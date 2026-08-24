import { Dialog } from '../../components/Dialog';
import { Sheet } from '../../components/Sheet';
import { ButtonIcon } from '../../components/ButtonIcon';
import { DEFAULT_COMPONENT_OPTIONS } from '../../config';
import { DEFAULT_SELECTORS } from '../../config/selectors';
import { IconManager } from '../managers/IconManager';
import { initFabMenuLayer } from '../../utils/fab';
import { COMPONENT_INIT_STRUCTURE } from './component-init-registry';
import { Loader } from '../../components/Loader';
import { assignAutoinitRegistry } from './registry-bridge';
import { K3UI_READY_CLASS } from './constants';
import { k3uiLogger } from './logger';
import { initSimpleMenus, initAvatarGroups, initStaticSelectMenus } from './init-special-dom';
import {
    attachDeferredComponentsToK,
    getDeferredComponentsLoadPromise,
    type DeferredComponentName,
} from './deferred-component-loaders';
import { countInitInstances, type ComponentInitElements, type ComponentInitFn, type ComponentInitOptions } from './component-init-helper';
import type { AutoInitOptions } from './types';
import { getK3uiWindowOptions, isK3uiProfileAutoInitEnabled, resolveAutoinitSelectors } from './window-options';

/** Cibles ButtonIcon pas encore initialisées (évite une logique dupliquée entre passes critique / différée). */
function collectLateButtonIconElements(context: HTMLElement, selector: string): HTMLElement[] {
    return Array.from(context.querySelectorAll(selector) as NodeListOf<HTMLElement>).filter(
        (el) => !el.hasAttribute('data-no-auto-init') && !ButtonIcon.getInstance(el)
    );
}

/**
 * Initialise automatiquement tous les composants K3UI
 * @param context Contexte DOM pour l'initialisation (défaut: document.body)
 * @param options Options personnalisées pour l'initialisation
 */
export function initComponents(context: HTMLElement = document.body, options?: Partial<AutoInitOptions>): boolean {
    k3uiLogger.info('Initialisation des composants K3UI...');

    try {
        const customOptions = getK3uiWindowOptions();
        const mergedOptions: Partial<AutoInitOptions> = { ...customOptions, ...options };
        const profileAutoInit = Boolean(
            mergedOptions.profileAutoInit ?? isK3uiProfileAutoInitEnabled()
        );
        if (profileAutoInit && typeof performance !== 'undefined' && typeof performance.mark === 'function') {
            performance.mark('k3ui-autoinit-components-start');
        }
        const selectors = resolveAutoinitSelectors(options);
        const loaderSelector = selectors.Loader ?? DEFAULT_SELECTORS.Loader;
        const defaultByName = DEFAULT_COMPONENT_OPTIONS as unknown as Record<string, ComponentInitOptions | undefined>;
        const loaderOptions = mergedOptions.Loader ?? defaultByName.Loader;
        let loaderCount = 0;
        try {
            const loadingElements = Array.from(context.querySelectorAll(loaderSelector) as NodeListOf<HTMLElement>)
                .filter(el => !el.hasAttribute('data-no-auto-init'));
            if (loadingElements.length > 0) {
                const instances = Loader.init(
                    loadingElements as unknown as Parameters<typeof Loader.init>[0],
                    loaderOptions
                );
                loaderCount = countInitInstances(instances);
            }
        } catch (err) {
            k3uiLogger.error('Erreur lors de l\'init prioritaire Loader:', err);
        }

        const componentConfig = COMPONENT_INIT_STRUCTURE.map(entry => {
            const mergedOpts = mergedOptions as Record<string, ComponentInitOptions | undefined>;
            const options = mergedOpts[entry.name] ?? defaultByName[entry.name];
            return {
                name: entry.name,
                selector: (selectors as Record<string, string>)[entry.name],
                initFn: entry.initFn,
                options,
                alwaysInit: entry.alwaysInit,
                deferred: entry.deferred,
            };
        });

        const registry: Record<string, HTMLElement[]> = {};
        componentConfig.forEach(config => {
            let filteredElements: HTMLElement[];
            // `selector === 'body'` n’auto-matche que si `alwaysInit` (évite Pace sur chaque page).
            if (config.selector === 'body' && context === document.body) {
                filteredElements = config.alwaysInit ? [context] : [];
            } else if (!config.selector) {
                filteredElements = [];
            } else {
                try {
                    filteredElements = Array.from(
                        context.querySelectorAll(config.selector) as NodeListOf<HTMLElement>
                    ).filter(el => !el.hasAttribute('data-no-auto-init'));
                } catch (selectorErr) {
                    k3uiLogger.warn(
                        `Sélecteur AutoInit ignoré pour ${config.name} (${config.selector}):`,
                        selectorErr
                    );
                    filteredElements = [];
                }
            }
            registry[config.name] = filteredElements;
        });

        assignAutoinitRegistry(registry);

        let totalInstances = loaderCount;
        const initializedComponents: Record<string, number> = { Loader: loaderCount };

        function runInits(configs: typeof componentConfig): void {
            configs.forEach(config => {
                if (config.name === 'Loader') return;
                if (!config.initFn) return;
                const elements = registry[config.name];
                const hasElements = elements.length > 0;
                if (hasElements || config.alwaysInit) {
                    let instances: unknown;
                    try {
                        const toInit: ComponentInitElements = elements;
                        instances = config.alwaysInit && !hasElements
                            ? config.initFn!(document.createElement('div'), config.options)
                            : config.initFn!(toInit, config.options);
                    } catch (error) {
                        k3uiLogger.error(`Erreur lors de l'initialisation de ${config.name}:`, error);
                        /* Ne pas relancer : une seule erreur bloquait toute la doc (composants différés jamais planifiés). */
                    }
                    const count = countInitInstances(instances);
                    initializedComponents[config.name] = count;
                    totalInstances += count;
                } else {
                    initializedComponents[config.name] = 0;
                }
            });
        }

        const criticalConfigs = componentConfig.filter(c => !c.deferred);
        runInits(criticalConfigs);

        const buttonIconConfig = componentConfig.find(c => c.name === 'ButtonIcon');
        const deferredConfigs = componentConfig.filter(c => c.deferred);

        /**
         * Init différée (Datepicker, Timepicker, Chart, Pace, etc.) : chunks JS chargés dynamiquement,
         * puis attachement sur `window.K` et init comme la passe synchrone historique.
         */
        const neededDeferredNames: DeferredComponentName[] = deferredConfigs
            .filter((c) => c.alwaysInit || (registry[c.name]?.length ?? 0) > 0)
            .map((c) => c.name as DeferredComponentName);

        const runDeferredAsync = async (): Promise<void> => {
            if (neededDeferredNames.length === 0) {
                const plural = totalInstances > 1 ? 's' : '';
                k3uiLogger.info(`${totalInstances} composant${plural} initialisé${plural} (aucun différé requis)`);
                document.dispatchEvent(new CustomEvent('k3ui-ready', {
                    detail: { totalComponents: totalInstances, components: registry, initializedComponents: { ...initializedComponents } }
                }));
                return;
            }

            let classes: Record<string, unknown>;
            try {
                classes = await getDeferredComponentsLoadPromise(neededDeferredNames);
            } catch (loadErr) {
                k3uiLogger.error('Erreur chargement chunks composants différés:', loadErr);
                throw loadErr;
            }
            attachDeferredComponentsToK(classes);

            const deferredWithInit = deferredConfigs.map((c) => {
                const C = classes[c.name] as { init: ComponentInitFn };
                const initFn: ComponentInitFn = (els, opts) => C.init(els, opts);
                return { ...c, initFn };
            });

            runInits(deferredWithInit);

            if (buttonIconConfig?.selector) {
                const lateButtonIcons = collectLateButtonIconElements(context, buttonIconConfig.selector);
                if (lateButtonIcons.length > 0) {
                    ButtonIcon.init(
                        lateButtonIcons as unknown as Parameters<typeof ButtonIcon.init>[0],
                        buttonIconConfig.options
                    );
                    totalInstances += lateButtonIcons.length;
                    initializedComponents['ButtonIcon'] = (initializedComponents['ButtonIcon'] ?? 0) + lateButtonIcons.length;
                }
            }
            const plural = totalInstances > 1 ? 's' : '';
            k3uiLogger.info(`${totalInstances} composant${plural} initialisé${plural} (dont différés)`);
            document.dispatchEvent(new CustomEvent('k3ui-ready', {
                detail: { totalComponents: totalInstances, components: registry, initializedComponents: { ...initializedComponents } }
            }));
        };

        const scheduleDeferred = neededDeferredNames.length > 0;
        if (scheduleDeferred) {
            setTimeout(() => {
                void runDeferredAsync().catch((deferredErr) => {
                    k3uiLogger.error('Erreur lors de l\'initialisation différée (deferred):', deferredErr);
                    document.dispatchEvent(new CustomEvent('k3ui-ready', {
                        detail: {
                            totalComponents: totalInstances,
                            components: registry,
                            initializedComponents: { ...initializedComponents },
                            error: deferredErr,
                            deferredFailed: true,
                        },
                    }));
                });
            }, 0);
        }

        try {
            Dialog.initFromTriggers();
            Sheet.initFromTriggers();
            initFabMenuLayer();
            initSimpleMenus(context, mergedOptions);
            initAvatarGroups(context);
            initStaticSelectMenus(context, mergedOptions);
        } catch (postCriticalErr) {
            k3uiLogger.error('Erreur après init critique (dialog/sheet/menus) — init différée déjà planifiée:', postCriticalErr);
        }

        if (buttonIconConfig?.selector) {
            try {
                const lateButtonIcons = collectLateButtonIconElements(context, buttonIconConfig.selector);
                if (lateButtonIcons.length > 0) {
                    ButtonIcon.init(
                        lateButtonIcons as unknown as Parameters<typeof ButtonIcon.init>[0],
                        buttonIconConfig.options
                    );
                    totalInstances += lateButtonIcons.length;
                    initializedComponents['ButtonIcon'] = (initializedComponents['ButtonIcon'] ?? 0) + lateButtonIcons.length;
                }
            } catch (biErr) {
                k3uiLogger.error('Erreur ButtonIcon (passe critique):', biErr);
            }
        }

        k3uiLogger.info(`${totalInstances} composant(s) critique(s) initialisé(s)`);

        const revealBody = (): void => {
            if (typeof document !== 'undefined' && document.body) {
                document.body.classList.add(K3UI_READY_CLASS);
            }
        };

        const dispatchReadyEvents = (): void => {
            document.dispatchEvent(new CustomEvent('k3ui-critical-ready', {
                detail: {
                    totalComponents: totalInstances,
                    components: registry,
                    initializedComponents: { ...initializedComponents },
                },
            }));

            if (!scheduleDeferred) {
                const plural = totalInstances > 1 ? 's' : '';
                k3uiLogger.info(`${totalInstances} composant${plural} initialisé${plural}`);
                document.dispatchEvent(new CustomEvent('k3ui-ready', {
                    detail: { totalComponents: totalInstances, components: registry, initializedComponents },
                }));
            }
        };

        /**
         * hideBodyUntilReady : attendre les icônes pour révéler body + events ensemble.
         * Sinon : révéler tout de suite (LCP) — IconManager peint déjà les SVG sync immédiatement.
         */
        if (mergedOptions.hideBodyUntilReady === true) {
            void IconManager.whenReady().then(() => {
                revealBody();
                dispatchReadyEvents();
            });
        } else {
            revealBody();
            dispatchReadyEvents();
            void IconManager.whenReady();
        }

        if (profileAutoInit && typeof performance !== 'undefined' && typeof performance.mark === 'function') {
            performance.mark('k3ui-autoinit-components-end');
            try {
                performance.measure(
                    'k3ui-autoinit-components',
                    'k3ui-autoinit-components-start',
                    'k3ui-autoinit-components-end'
                );
            } catch {
                /* ignore */
            }
        }

        return true;

    } catch (err) {
        k3uiLogger.error('Erreur lors de l\'AutoInit:', err);
        if (typeof document !== 'undefined') {
            document.dispatchEvent(new CustomEvent('k3ui-critical-ready', { detail: { error: err } }));
            if (document.body) document.body.classList.add(K3UI_READY_CLASS);
        }
        return false;
    }
}
