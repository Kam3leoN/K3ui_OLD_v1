/**
 * @fileoverview Composant Masonry minimal (K3ui) - encapsulé sans dépendance externe
 * @description
 * Mason remplace un placement basé sur grid (K3ui .row) par un placement "Masonry minimal" :
 * - items en position:absolute
 * - calcul de positions (x, y) basé sur des "colonnes logiques" (12 colonnes par défaut)
 * - conservation des classes K3ui s* / m* / l* / xl* sur chaque item comme source de largeur (span)
 *
 * Le moteur Masonry est implémenté dans src/utils/mason/layoutEngine.ts.
 *
 * Important : ce composant est conçu pour être encapsulé. Il n’altère pas les styles globaux de K3ui.
 */

import { Component } from '../core/base/Component';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import type { MasonOptions } from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { LoggerManager } from '../core/managers/LoggerManager';
import { ManagerFactory } from '../core/factories/ManagerFactory';
import { getMasonDefaults } from '../specs/components/mason.specs';
import { resizeObserver } from '../utils/dom/elements';
import {
    computeMasonryLayoutWithInitialColumnHeights,
    extractMasonSpansFromClassNames,
    resolveMasonSpanForWidth,
    type MasonLayoutItemInput,
} from '../utils/mason/layoutEngine';

/**
 * Identifiant de classe (côté SCSS) appliqué au conteneur du composant.
 */
const ROOT_CLASS = 'k3ui-mason';
const ITEM_HIDDEN_ATTRIBUTE = 'data-k3ui-mason-hidden';
const ITEM_HIDDEN_CLASS = 'k3ui-mason__item--hidden';
const ROOT_ANIMATE_CLASS = 'k3ui-mason--isofilter-animate';

/**
 * Gestionnaire d'un layout (RAF) : garantit qu'un seul recalcul est en cours par frame.
 */
export class Mason extends Component<MasonOptions> {
    /** Niveau de priorité du composant */
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    private logger: LoggerManager;

    /** Items DOM ciblés (résolus via itemsSelector) */
    private items: HTMLElement[] = [];

    /** ResizeObserver pour déclencher des re-layouts lors des changements de largeur */
    private _resizeObserver: ResizeObserver | null = null;

    /** Raf en attente pour batcher les relayouts */
    private _rafScheduled = false;

    /** Timer de fallback (utilisé si des reflows critiques arrivent sans ResizeObserver) */
    private _layoutRetryTimeoutId: number | null = null;

    /** Handler stocké pour retirer correctement le listener window.resize */
    private _boundWindowResizeHandler: (() => void) | null = null;

    /** Snapshot des styles inline à restaurer au destroy() */
    private _originalInlineStyles: Map<HTMLElement, Partial<CSSStyleDeclaration>> = new Map();

    /** Indique si une phase d'initialisation d'item styles est déjà faite */
    private _itemsPrepared = false;

    /** Garde anti-récursion : `ComponentRegistry.unregister()` peut réappeler `destroy()` */
    private _isDestroying = false;

    /**
     * Si vrai au prochain `_layout`, on n’écrit pas `style.height` sur le conteneur
     * (coordination IsoFilter : transition de hauteur pilotée côté filtre).
     */
    private _skipContainerHeightOnNextLayout = false;

    /** Dernière hauteur de conteneur calculée par le moteur (px), toujours mise à jour en fin de layout. */
    private _lastContainerHeightPx = 0;

    /**
     * Pendant une transition de hauteur (IsoFilter), ignorer ResizeObserver / window.resize
     * pour éviter un relayout qui réécraserait `style.height` au milieu de l’animation.
     */
    private _suppressExternalLayoutUntil = 0;

    constructor(el: HTMLElement, options: Partial<MasonOptions> = {}) {
        super(el, options, toComponentClassDef(Mason));

        this.logger = ManagerFactory.getLoggerManager('[Mason]');
        this.options = {
            ...Mason.defaults,
            ...options,
        };

        this._setupRootClass();
        this._collectItems();
        this._setupObservers();
        this._scheduleLayout();
    }

    /**
     * Force un re-layout Mason depuis l'extérieur (coordination avec IsoFilter par ex.).
     *
     * @param options.skipContainerHeight Si `true`, le prochain layout calcule toujours les positions
     *   et met à jour {@link getLastContainerHeightPx} mais **n’applique pas** `style.height` sur le conteneur.
     *   Utile pour animer la hauteur (transition CSS) en parallèle du FLIP.
     */
    public refresh(options?: { skipContainerHeight?: boolean }): void {
        if (options?.skipContainerHeight === true) {
            this._skipContainerHeightOnNextLayout = true;
        }
        this._scheduleLayout();
    }

    /**
     * Dernière hauteur de conteneur calculée (px), après le dernier `_layout` terminé.
     */
    public getLastContainerHeightPx(): number {
        return this._lastContainerHeightPx;
    }

    /**
     * Supprime temporairement les relayout déclenchés par ResizeObserver ou le redimensionnement de la fenêtre.
     * Utilisé par IsoFilter pendant la transition de hauteur du conteneur.
     *
     * @param durationMs Durée de suppression (ms), typiquement alignée sur l’animation FLIP + marge.
     */
    public suppressExternalLayoutFor(durationMs: number): void {
        const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
        this._suppressExternalLayoutUntil = now + Math.max(0, durationMs);
        // Annule un retry différé qui sinon réécrirait les transform au milieu du FLIP IsoFilter.
        if (this._layoutRetryTimeoutId != null) {
            window.clearTimeout(this._layoutRetryTimeoutId);
            this._layoutRetryTimeoutId = null;
        }
    }

    private _shouldSuppressExternalLayout(): boolean {
        return typeof performance !== 'undefined' && performance.now() < this._suppressExternalLayoutUntil;
    }

    /**
     * Options par défaut du composant.
     */
    static get defaults(): MasonOptions {
        return { ...getMasonDefaults() };
    }

    /**
     * Récupère l'instance associée à un élément.
     * @param el Élément DOM cible
     */
    static getInstance(el: HTMLElement): Mason | undefined {
        return Component.getInstance(el) as Mason | undefined;
    }

    /**
     * Initialise un composant Mason sur un élément.
     *
     * @param el Élément racine (conteneur)
     * @param options Options de Mason
     */
    static init(el: HTMLElement, options?: Partial<MasonOptions>): Mason;

    /**
     * Initialise un composant Mason sur une collection d'éléments.
     *
     * @param els Liste d'éléments
     * @param options Options de Mason
     */
    static init(els: InitElements<KElement>, options?: Partial<MasonOptions>): Mason[];

    /**
     * Implémentation de init.
     *
     * Note : on s'aligne sur les conventions de Component.init.
     */
    static init(
        els: HTMLElement | InitElements<KElement>,
        options: Partial<MasonOptions> = {}
    ): Mason | Mason[] {
        return Component.init(els, options, toComponentClassDef(Mason)) as Mason | Mason[];
    }

    /**
     * Nettoyage : déconnecte les observers, annule les RAF et restaure les styles inline des items.
     */
    destroy(): void {
        if (this._isDestroying) return;
        this._isDestroying = true;

        this._rafScheduled = false;

        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }

        if (this._layoutRetryTimeoutId != null) {
            window.clearTimeout(this._layoutRetryTimeoutId);
            this._layoutRetryTimeoutId = null;
        }

        if (this._boundWindowResizeHandler) {
            window.removeEventListener('resize', this._boundWindowResizeHandler);
            this._boundWindowResizeHandler = null;
        }

        if (this.items.length > 0) {
            for (const item of this.items) {
                const snapshot = this._originalInlineStyles.get(item);
                if (!snapshot) continue;
                item.style.position = snapshot.position ?? item.style.position;
                item.style.left = snapshot.left ?? item.style.left;
                item.style.top = snapshot.top ?? item.style.top;
                item.style.width = snapshot.width ?? item.style.width;
                item.style.height = snapshot.height ?? item.style.height;
                item.style.transform = snapshot.transform ?? item.style.transform;
                item.style.willChange = snapshot.willChange ?? item.style.willChange;
            }
        }

        // Restaurer la hauteur du conteneur si elle a été modifiée.
        this.el.style.height = '';

        this.itemsPreparedCleanup();

        this._originalInlineStyles.clear();
        this.items = [];

        this.el.classList.remove(ROOT_CLASS);
        super.destroy();
    }

    /**
     * Applique/assure la classe racine (encapsulation).
     */
    private _setupRootClass(): void {
        this.el.classList.add(ROOT_CLASS);
    }

    /**
     * Collecte les items DOM à positionner.
     *
     * @description
     * - Le sélecteur est résolu dans l'élément this.el.
     * - Si aucun item ne correspond, on fallback sur this.el.children.
     */
    private _collectItems(): void {
        const selector = this.options.itemsSelector;
        const found = selector ? Array.from(this.el.querySelectorAll<HTMLElement>(selector)) : [];
        if (found.length > 0) {
            this.items = found;
        } else {
            // Fallback : si itemsSelector n'est pas présent/correct, on tente les enfants directs.
            this.items = Array.from(this.el.children).filter((c): c is HTMLElement => c instanceof HTMLElement);
        }
    }

    /**
     * Prépare les styles “base” des items (position absolute, suppression du flux normal, etc.).
     *
     * @description
     * Cette étape doit être faite avant la mesure de hauteur si le wrap dépend de la largeur.
     */
    private _prepareItemsBaseStyles(): void {
        if (this._itemsPrepared) return;
        if (this.items.length === 0) return;

        for (const item of this.items) {
            this._originalInlineStyles.set(item, {
                position: item.style.position,
                left: item.style.left,
                top: item.style.top,
                width: item.style.width,
                height: item.style.height,
                transform: item.style.transform,
                willChange: item.style.willChange,
            });

            // Encapsulation : aucun changement global, uniquement dans ce scope.
            item.style.position = 'absolute';

            // will-change aide le moteur de rendu lors d'un translate.
            item.style.willChange = this.options.positionMode === 'transform' ? 'transform' : 'left, top';
        }

        this._itemsPrepared = true;
    }

    /**
     * Restauration/suppression de l'état “itemsPrepared”.
     * @description Utilitaire de cleanup interne.
     */
    private itemsPreparedCleanup(): void {
        this._itemsPrepared = false;
    }

    /**
     * Met en place les observers (ResizeObserver + window resize).
     */
    private _setupObservers(): void {
        // ResizeObserver (si supporté) : le moteur dépend de la largeur effective du conteneur.
        if (typeof ResizeObserver !== 'undefined') {
            this._resizeObserver = resizeObserver(this.el, () => {
                if (this._shouldSuppressExternalLayout()) return;
                this._scheduleLayout();
            });
        }

        // Fallback : certains layouts (ex: changement scroll lock / fonts) peuvent provoquer des changements
        // sans notification ResizeObserver fiable. On écoute window.resize.
        this._boundWindowResizeHandler = () => {
            if (this._shouldSuppressExternalLayout()) return;
            this._scheduleLayout();
        };
        window.addEventListener('resize', this._boundWindowResizeHandler, { passive: true });
    }

    /**
     * Bascule vers le layout au prochain frame.
     */
    private _scheduleLayout(): void {
        if (this._rafScheduled) return;
        this._rafScheduled = true;

        // IsoFilter (skipContainerHeight) : un seul layout immédiat, pas de retry à 200 ms
        // qui casserait le FLIP en réécrivant les transform pendant l’animation.
        const skipDeferredRetry = this._skipContainerHeightOnNextLayout;

        // RAF : batch et meilleur timing pendant les reflows.
        requestAnimationFrame(() => {
            this._rafScheduled = false;
            this._layout();
        });

        // Fallback léger : si des images lazy changent la hauteur après quelques ms
        // (cas fréquent côté docs), on planifie un relayout “best-effort”.
        if (!skipDeferredRetry && this._layoutRetryTimeoutId == null) {
            this._layoutRetryTimeoutId = window.setTimeout(() => {
                this._layoutRetryTimeoutId = null;
                if (this._shouldSuppressExternalLayout()) return;
                this._scheduleLayout();
            }, 200);
        }
    }

    /**
     * Lance la séquence complète :
     * 1) préparer items absolute + widths calculées via spans
     * 2) mesurer hauteurs
     * 3) calculer positions finales via computeMasonryLayout
     * 4) appliquer transform/top/left
     */
    private _layout(): void {
        if (this.items.length === 0) return;

        this._prepareItemsBaseStyles();

        const containerWidth = this._readContainerWidthPx();
        const columns = this.options.columns;
        const spanBaseColumns = this.options.spanBaseColumns ?? 12;
        const gap = this.options.gap;

        const visibleItems = this.items.filter(item => !this._isItemHidden(item));
        const hiddenItems = this.items.filter(item => this._isItemHidden(item));

        // Calculer colWidth pour pouvoir appliquer les largeurs avant la mesure de hauteur.
        const totalGapWidth = Math.max(0, gap) * Math.max(0, columns - 1);
        const colWidth = Math.max(0, (containerWidth - totalGapWidth) / Math.max(1, columns));

        // 1) Résoudre spans + largeur item (avant mesure de hauteur).
        // On met à jour la largeur aussi pour les items masqués : utile si on les réaffiche plus tard.
        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i] as HTMLElement;
            const classNames = Array.from(item.classList);
            // 1) Span "base" (ex: m6 = 6/12 si spanBaseColumns=12)
            const spans = extractMasonSpansFromClassNames(classNames, spanBaseColumns);
            const spanBaseResolved = resolveMasonSpanForWidth(
                spans,
                containerWidth,
                this.options.fallbackSpan,
                spanBaseColumns
            );

            // 2) Conversion vers le nombre de colonnes cible
            const scaledSpan = spanBaseResolved * columns / spanBaseColumns;
            const clampedSpan = Math.max(1, Math.min(columns, Math.round(scaledSpan)));
            const width = clampedSpan * colWidth + (clampedSpan - 1) * gap;
            item.style.width = `${Math.round(width)}px`;
        }

        // 2) Mesurer hauteurs après largeur
        const visibleInputs: MasonLayoutItemInput[] = visibleItems.map((item, idx) => ({
            index: idx,
            classNames: Array.from(item.classList),
            height: this._measureItemHeight(item),
        }));

        const hiddenInputs: MasonLayoutItemInput[] = hiddenItems.map((item, idx) => ({
            index: idx,
            classNames: Array.from(item.classList),
            height: this._measureItemHeight(item),
        }));

        // 3) Calcul positions visibles (la hauteur du conteneur dépend uniquement des visibles)
        const visibleResult = computeMasonryLayoutWithInitialColumnHeights({
            containerWidth,
            gap,
            columns,
            fallbackSpan: this.options.fallbackSpan,
            items: visibleInputs,
            spanBaseColumns,
        });

        // 4) Calcul positions des items masqués, enchaîné après les visibles
        //    (utile pour que IsoFilter puisse mesurer des "first/last" cohérents pour FLIP).
        const hiddenResult = computeMasonryLayoutWithInitialColumnHeights({
            containerWidth,
            gap,
            columns,
            fallbackSpan: this.options.fallbackSpan,
            items: hiddenInputs,
            spanBaseColumns,
            initialColumnHeights: visibleResult.finalColumnHeights,
        });

        // 5) Appliquer transforms (visibles + masqués)
        const applyResolved = (resolvedItem: (typeof visibleResult.items)[number], container: HTMLElement[]) => {
            const item = container[resolvedItem.index];
            if (!item) return;

            if (this.options.positionMode === 'transform') {
                item.style.transform = `translate3d(${Math.round(resolvedItem.x)}px, ${Math.round(resolvedItem.y)}px, 0)`;
            } else {
                item.style.left = `${Math.round(resolvedItem.x)}px`;
                item.style.top = `${Math.round(resolvedItem.y)}px`;
            }
        };

        for (const resolved of visibleResult.items) {
            applyResolved(resolved, visibleItems);
        }
        for (const resolved of hiddenResult.items) {
            applyResolved(resolved, hiddenItems);
        }

        const h = Math.round(visibleResult.containerHeight);
        this._lastContainerHeightPx = h;

        const skipHeight = this._skipContainerHeightOnNextLayout;
        this._skipContainerHeightOnNextLayout = false;

        if (!skipHeight) {
            this.el.style.height = `${h}px`;
        }
    }

    /**
     * Indique si un item Mason doit être ignoré par le moteur de layout.
     * IsoFilter utilise `data-k3ui-mason-hidden="true"` comme convention.
     */
    private _isItemHidden(item: HTMLElement): boolean {
        const attr = item.getAttribute(ITEM_HIDDEN_ATTRIBUTE);
        return attr === 'true' || item.classList.contains(ITEM_HIDDEN_CLASS);
    }

    /**
     * Lit la largeur effective du conteneur (en pixels).
     */
    private _readContainerWidthPx(): number {
        const rect = this.el.getBoundingClientRect();
        return rect.width;
    }

    /**
     * Mesure la hauteur d'un item en pixels selon la stratégie choisie.
     */
    private _measureItemHeight(item: HTMLElement): number {
        const strat = this.options.itemsHeightStrategy;
        if (strat === 'offsetHeight') {
            return item.offsetHeight;
        }

        // boundingClientRect est plus “physique” (inclut certains cas de box model).
        return item.getBoundingClientRect().height;
    }
}

/**
 * Enregistrement du Web Component k3ui-mason.
 * @description
 * Permet d'utiliser <k3ui-mason> en HTML.
 * Le composant JS est initialisé en connectedCallback et détruit en disconnectedCallback.
 */
if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-mason')) {
    customElements.define(
        'k3ui-mason',
        class extends HTMLElement {
            private masonInstance: Mason | null = null;

            connectedCallback(): void {
                if (!this.hasAttribute('data-initialized')) {
                    this.setAttribute('data-initialized', 'true');
                }

                if (!this.masonInstance) {
                    // Note : pour les options via HTML attributes, on pourrait implémenter une lecture data-*
                    // (volontairement minimal ici : options via JS).
                    this.masonInstance = new Mason(this, {});
                }
            }

            disconnectedCallback(): void {
                if (this.masonInstance) {
                    this.masonInstance.destroy();
                    this.masonInstance = null;
                }
            }
        }
    );
}

