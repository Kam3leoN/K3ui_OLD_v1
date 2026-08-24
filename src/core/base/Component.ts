/**
 * @fileoverview Classe de base optimisée pour les composants K3UI
 * @description Architecture découplée, typage strict et cycle de vie événementiel v3.
 * @author K3UI Team
 * @version 3.0.0
 */

import { mergeOptions } from '../../utils/options';
import { KElement, InitElements, BaseOptions, PriorityLevel, I18nOptions, Openable } from '../../types/base';
import type { ComponentLifecycleChanges, LifecyclePhase } from '../../types/base/lifecycle';
import type { DOMEventCallback } from '../../types/base/dom';
import { ComponentType } from '../../types/components';
import { K3UI_EVENT_TYPES } from '../../types/components/events';
import { ComponentRegistry } from '../registries/ComponentRegistry';
import { LoggerManager } from '../managers/LoggerManager';
import { EventListenerManager } from '../managers/EventListenerManager';
import { LifecycleManager } from '../lifecycle/LifecycleManager';

// Re-export types
export type { KElement, InitElements, Openable, I18nOptions };
export type { ComponentLifecycleChanges, LifecyclePhase };
export { PriorityLevel };

/**
 * Interface pour les hooks du cycle de vie du composant (K3UI v3).
 */
export interface ComponentLifecycle {
    /** Pré-configuration avant fusion des options (override rare) */
    setup?(): void;
    /** Post-constructeur, instance prête */
    onInit?(): void;
    /** Élément connecté au document */
    onMount?(): void;
    /** Options ou attributs modifiés */
    onUpdate?(changes?: ComponentLifecycleChanges): void;
    /** Déconnexion DOM, avant destroy */
    onUnmount?(): void;
    /** Cleanup final */
    onDestroy?(): void;
}

// ============================================================================
// CLASSE DE BASE OPTIMISÉE
// ============================================================================

/**
 * Classe de base abstraite pour tous les composants K3UI.
 */
export abstract class Component<O extends BaseOptions> implements ComponentLifecycle {
    /** Logger statique pour la classe de base */
    protected static readonly logger: LoggerManager = LoggerManager.create('[Component]', 'Component');

    /** L'élément DOM racine du composant */
    public el: HTMLElement;

    /** Les options configurées (fusion des défauts et des options utilisateur) */
    public options: O;

    /** Identifiant unique de l'instance (utile pour le débogage) */
    public readonly id: string;

    /** Nom de la classe composant (Dialog, Button, …) */
    protected readonly _componentName: string;

    /**
     * Niveau de priorité du composant.
     * Défini par défaut à MEDIUM, surchargeable par les classes enfants.
     */
    public readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    private readonly _eventManager: EventListenerManager = new EventListenerManager();
    private readonly _cleanupFunctions: Set<() => void> = new Set();
    private readonly _lifecycleManager = new LifecycleManager();

    private _initialized = false;
    private _mounted = false;
    private _destroyed = false;
    private _updating = false;

    /**
     * Constructeur du composant.
     * @param el - L'élément DOM racine.
     * @param options - Les options utilisateur.
     * @param classDef - Classe constructeur.
     */
    constructor(el: HTMLElement, options: Partial<O>, classDef: unknown) {
        const ctor = classDef as ComponentType<Component<O>, O> & { name?: string };
        if (!(el instanceof HTMLElement)) {
            const msg = `L'initialisation a échoué : l'élément fourni n'est pas un HTMLElement valide.`;
            Component.logger.error(msg, el);
            throw new Error(msg);
        }

        this.el = el;
        this._componentName = ctor.name ?? 'Component';
        this.id = `${this._componentName}-${Math.random().toString(36).slice(2, 11)}`;

        try {
            const existingInstance = ComponentRegistry.getComponentInstance(el);
            if (existingInstance && typeof existingInstance.destroy === 'function') {
                Component.logger.debug(`Destruction de l'ancienne instance sur ${this._componentName}`);
                existingInstance.destroy();
            }
        } catch (error) {
            Component.logger.warn(`Erreur lors du nettoyage de l'instance précédente:`, error);
        }

        if (typeof this.setup === 'function') {
            this.setup();
        }

        const defaultOptions = (ctor as { defaults?: Partial<O> }).defaults ?? {};
        this.options = mergeOptions(defaultOptions, options) as O;

        ComponentRegistry.register(
            this.el,
            this as unknown as Component<BaseOptions>,
            this.priority,
            this.options,
            this._componentName,
        );

        this._runInitPhase();
    }

    // ============================================================================
    // GETTERS D'ÉTAT (cycle de vie v3)
    // ============================================================================

    /** Instance initialisée (onInit exécuté) */
    get isInitialized(): boolean {
        return this._initialized;
    }

    /** Instance montée dans le document */
    get isMounted(): boolean {
        return this._mounted;
    }

    /** Instance détruite */
    get isDestroyed(): boolean {
        return this._destroyed;
    }

    /** onUpdate en cours */
    get isUpdating(): boolean {
        return this._updating;
    }

    /** Élément connecté au document */
    get isConnected(): boolean {
        return this.el?.isConnected ?? false;
    }

    // ============================================================================
    // MÉTHODES STATIQUES (FACTORY)
    // ============================================================================

    protected static init<O extends BaseOptions, C extends Component<O>>(
        els: string | KElement | InitElements<KElement>,
        options: Partial<O> = {},
        classDef: unknown,
        priority?: PriorityLevel,
    ): unknown {
        const ctor = classDef as ComponentType<C, O>;
        const targetPriority = priority ?? PriorityLevel.MEDIUM;
        const instances: C[] = [];

        const elements: HTMLElement[] = [];
        if (typeof els === 'string') {
            elements.push(...Array.from(document.querySelectorAll<HTMLElement>(els)));
        } else if (els instanceof HTMLElement) {
            elements.push(els);
        } else if (els instanceof Element) {
            elements.push(els as HTMLElement);
        } else if (els && typeof (els as NodeListOf<KElement>).length === 'number') {
            for (const node of Array.from(els as NodeListOf<KElement>)) {
                if (node instanceof HTMLElement) elements.push(node);
                else if (node instanceof Element) elements.push(node as HTMLElement);
            }
        }

        for (const element of elements) {
            if (ComponentRegistry.hasHigherPriority(element, targetPriority)) {
                const instance = new ctor(element, options);
                instances.push(instance);
            } else {
                const existing = ComponentRegistry.getComponentInstance(element) as unknown as C;
                if (existing) {
                    instances.push(existing);
                }
            }
        }

        const single =
            typeof els !== 'string' &&
            (els instanceof HTMLElement || els instanceof Element);
        return (single ? instances[0] : instances) as unknown;
    }

    static initWithPriority<I extends KElement, O extends BaseOptions, C extends Component<O>>(
        els: I | InitElements<I>,
        options: Partial<O>,
        classDef: unknown,
        priority: PriorityLevel,
    ): unknown {
        return this.init(els as string | KElement | InitElements<KElement>, options, classDef, priority);
    }

    static get defaults(): BaseOptions {
        return {};
    }

    static getInstance(el: HTMLElement): Component<BaseOptions> | undefined | null {
        return ComponentRegistry.getComponentInstance(el) as Component<BaseOptions> | undefined | null;
    }

    // ============================================================================
    // CYCLE DE VIE — HOOKS & ORCHESTRATION
    // ============================================================================

    /** @inheritdoc */
    public setup(): void {
        // Override optionnel dans les sous-classes
    }

    /** @inheritdoc */
    public onInit(): void {
        // Override optionnel dans les sous-classes
    }

    /** @inheritdoc */
    public onMount(): void {
        // Override optionnel dans les sous-classes
    }

    /** @inheritdoc */
    public onUpdate(_changes?: ComponentLifecycleChanges): void {
        // Override optionnel dans les sous-classes
    }

    /** @inheritdoc */
    public onUnmount(): void {
        // Override optionnel dans les sous-classes
    }

    /** @inheritdoc */
    public onDestroy(): void {
        // Override optionnel dans les sous-classes
    }

    /**
     * Appelé par K3UIElement quand l'élément est connecté au DOM après init.
     */
    public handleConnected(): void {
        this._maybeMount();
    }

    /**
     * Appelé par K3UIElement avant destroy à la déconnexion DOM.
     */
    public handleDisconnected(): void {
        this.destroy();
    }

    /**
     * Met à jour les options et déclenche onUpdate.
     * @param opts - Options partielles
     * @param changesMeta - Métadonnées (attribut DOM, etc.)
     */
    public updateOptions(
        opts: Partial<O>,
        changesMeta?: ComponentLifecycleChanges,
    ): void {
        if (this._destroyed) return;

        const changedKeys = Object.keys(opts);
        const defaultOptions =
            (this.constructor as { defaults?: Partial<O> }).defaults ?? {};
        this.options = mergeOptions(defaultOptions, { ...this.options, ...opts }) as O;

        const changes: ComponentLifecycleChanges = {
            ...changesMeta,
            keys: [...new Set([...(changesMeta?.keys ?? []), ...changedKeys])],
        };

        this._lifecycleManager.scheduleUpdate((merged) => this._runUpdatePhase(merged), changes);
    }

    /**
     * @deprecated Utiliser {@link updateOptions}
     */
    public setOptions(opts: Partial<O>): void {
        this.updateOptions(opts);
    }

    /**
     * Émet un événement CustomEvent lifecycle sur l'élément racine.
     * @param phase - Phase du cycle de vie
     * @param changes - Changements associés (update)
     */
    protected emitLifecycle(phase: LifecyclePhase, changes?: ComponentLifecycleChanges): void {
        if (!this.el || this._destroyed) return;

        const eventMap: Record<LifecyclePhase, string> = {
            init: K3UI_EVENT_TYPES.LIFECYCLE_INIT,
            mount: K3UI_EVENT_TYPES.LIFECYCLE_MOUNT,
            update: K3UI_EVENT_TYPES.LIFECYCLE_UPDATE,
            unmount: K3UI_EVENT_TYPES.LIFECYCLE_UNMOUNT,
            destroy: K3UI_EVENT_TYPES.LIFECYCLE_DESTROY,
        };

        this.el.dispatchEvent(
            new CustomEvent(eventMap[phase], {
                bubbles: true,
                detail: {
                    phase,
                    component: this._componentName,
                    timestamp: Date.now(),
                    changes,
                },
            }),
        );
    }

    protected registerEvent(
        target: EventTarget,
        event: string,
        listener: DOMEventCallback,
        options?: boolean | AddEventListenerOptions,
    ): () => void {
        const cleanup = this._eventManager.add(target, event, listener, options);
        this._cleanupFunctions.add(cleanup);
        return cleanup;
    }

    /**
     * Détruit le composant (unmount → onDestroy → cleanup registry).
     */
    public destroy(): void {
        if (this._destroyed) return;

        this._lifecycleManager.cancelPendingUpdate();
        this._maybeUnmount();
        this.onDestroy();

        this._cleanupFunctions.forEach((cleanup) => cleanup());
        this._cleanupFunctions.clear();
        this._eventManager.destroy();

        ComponentRegistry.unregister(this.el);
        this.emitLifecycle('destroy');

        this._destroyed = true;
        (this as { el: HTMLElement | null }).el = null;
    }

    private _runInitPhase(): void {
        this.emitLifecycle('init');
        this.onInit();
        this._initialized = true;
        this._maybeMount();
    }

    private _maybeMount(): void {
        if (this._destroyed || this._mounted || !this.el?.isConnected) return;
        this._mounted = true;
        this.emitLifecycle('mount');
        this.onMount();
    }

    private _maybeUnmount(): void {
        if (!this._mounted || this._destroyed) return;
        this._mounted = false;
        this.emitLifecycle('unmount');
        this.onUnmount();
    }

    private _runUpdatePhase(changes: ComponentLifecycleChanges): void {
        if (this._destroyed) return;
        this._updating = true;
        try {
            this.emitLifecycle('update', changes);
            this.onUpdate(changes);
        } finally {
            this._updating = false;
        }
    }
}
