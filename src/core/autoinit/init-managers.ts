import type { ThemeType } from '../managers/ThemeManager';
import {
    IconManager,
    SoundFXManager,
    ThemeManager,
    LocaleManager,
    DynamicColorManager,
    PrivacyManager
} from '../managers';
import { DEFAULT_ICON_CONFIG, DEFAULT_SOUND_CONFIG, DEFAULT_DYNAMIC_COLOR_CONFIG } from '../../config';
import { k3uiLogger } from './logger';
import type { AutoInitOptions } from './types';
import { getK3uiWindowOptions, isK3uiProfileAutoInitEnabled } from './window-options';

/**
 * Initialise tous les managers K3UI
 * @param options Options personnalisées pour la configuration des managers
 */
export function initManagers(options: Partial<AutoInitOptions> = {}): void {
    k3uiLogger.info('Initialisation des managers K3UI...');

    try {
        const customOptions = getK3uiWindowOptions();
        const mergedOptions: Partial<AutoInitOptions> & Record<string, unknown> = { ...customOptions, ...options };
        const profileAutoInit = Boolean(
            mergedOptions.profileAutoInit ?? isK3uiProfileAutoInitEnabled()
        );

        const darkQuery = typeof window !== 'undefined' && window.matchMedia
            ? window.matchMedia('(prefers-color-scheme: dark)')
            : null;

        // Doit être initialisé avant les managers qui persistent des préférences (Theme, Locale, DynamicColor, Sound).
        PrivacyManager.init(
            mergedOptions.PrivacyManager as Parameters<typeof PrivacyManager.init>[0]
        );

        ThemeManager.init();

        LocaleManager.init(
            mergedOptions.LocaleManager as Parameters<typeof LocaleManager.init>[0]
        );

        const currentTheme = ThemeManager.currentTheme;
        const isDark = currentTheme === 'dark' ||
            (currentTheme === 'system' && darkQuery?.matches);

        const dynamicColorOpts = {
            ...DEFAULT_DYNAMIC_COLOR_CONFIG,
            ...(mergedOptions.DynamicColorManager as Record<string, unknown> | undefined),
            isDark,
        };

        // Soft : désactivable via DynamicColorManager: false ; sinon init (FOUC critique reste séparé).
        if (mergedOptions.DynamicColorManager !== false) {
            DynamicColorManager.init({
                ...dynamicColorOpts,
                onChange: (_sourceColor, _contrastLevel, isDarkFlag) => {
                    if (typeof ThemeManager !== 'undefined') {
                        const ct = ThemeManager.currentTheme;
                        const shouldBeDark = Boolean(isDarkFlag ||
                            (ct === 'system' && darkQuery?.matches));
                        if (shouldBeDark !== isDarkFlag) {
                            DynamicColorManager.setIsDark(shouldBeDark);
                        }
                    }
                }
            });

            if (typeof ThemeManager.updateOptions === 'function') {
                const originalOnChange = ThemeManager.options.onChange;
                ThemeManager.updateOptions({
                    onChange: (theme: ThemeType) => {
                        if (originalOnChange) {
                            originalOnChange(theme);
                        }
                        const dark = theme === 'dark' ||
                            Boolean(theme === 'system' && darkQuery?.matches);
                        DynamicColorManager.setIsDark(dark);
                    }
                });
            }
        }

        const iconManagerOpts = mergedOptions.IconManager as Record<string, unknown> | undefined;
        const iconConfig = (iconManagerOpts && Object.keys(iconManagerOpts).length > 0)
            ? { ...DEFAULT_ICON_CONFIG, ...iconManagerOpts }
            : { ...DEFAULT_ICON_CONFIG };
        const userSetBasePath =
            !!iconManagerOpts && Object.prototype.hasOwnProperty.call(iconManagerOpts, 'basePath');
        if (!userSetBasePath) {
            iconConfig.basePath = IconManager.resolveAssetsBasePath();
        }
        if (mergedOptions.iconMutationObserverRoot !== undefined) {
            iconConfig.mutationObserverRoot = mergedOptions.iconMutationObserverRoot;
        }
        // Avec hideBodyUntilReady : révélation groupée (icônes + body ensemble).
        if (mergedOptions.hideBodyUntilReady === true) {
            const userSetAtomic =
                !!iconManagerOpts && Object.prototype.hasOwnProperty.call(iconManagerOpts, 'atomicPageReveal');
            if (!userSetAtomic) {
                iconConfig.atomicPageReveal = true;
            }
        }
        IconManager.configure(iconConfig);

        if (profileAutoInit && typeof performance !== 'undefined' && typeof performance.mark === 'function') {
            performance.mark('k3ui-icon-init-start');
        }
        IconManager.init();
        if (profileAutoInit && typeof performance !== 'undefined' && typeof performance.mark === 'function') {
            performance.mark('k3ui-icon-init-end');
            try {
                performance.measure('k3ui-icon-init', 'k3ui-icon-init-start', 'k3ui-icon-init-end');
            } catch {
                /* ignore duplicate measure */
            }
        }

        const soundConfig =
            (mergedOptions.SoundFXManager as Parameters<typeof SoundFXManager.init>[0] | undefined)
            || DEFAULT_SOUND_CONFIG;
        // Soft lazy : mémorise la config ; l'instance est créée au premier play / toggle.
        SoundFXManager.updateOptions(soundConfig);

        k3uiLogger.info('Managers initialisés avec succès');
    } catch (error) {
        k3uiLogger.error('Erreur lors de l\'initialisation des managers:', error);
    }
}
