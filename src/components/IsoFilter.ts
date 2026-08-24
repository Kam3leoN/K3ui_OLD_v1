/**
 * @fileoverview Composant IsoFilter K3UI (sans dépendance externe)
 * @description
 * Filtrage type Isotope (sans lib) + animations FLIP, coordonné avec Mason :
 * - Mason gère le placement en absolute/transform
 * - IsoFilter gère la visibilité logique via `data-k3ui-mason-hidden`
 * - IsoFilter capture positions (FLIP) avant/après un relayout Mason
 */

import { Component } from '../core/base/Component';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import type { IsoFilterOptions } from '../types/components';
import type { KElement, InitElements } from '../types/base';
import { PriorityLevel } from '../types/base';
import { LoggerManager } from '../core/managers/LoggerManager';
import { ManagerFactory } from '../core/factories/ManagerFactory';
import { getIsoFilterDefaults } from '../specs/components/isofilter.specs';

import { computeVisibleIds, tokenizeTags, type IsoFilterSourceItem } from '../utils/isofilter/filterEngine';
import { captureRects, runFlipAnimation, type RectMap, type FlipVisibility } from '../utils/isofilter/flip';
import { Mason } from './Mason';

const ROOT_CLASS = 'k3ui-isofilter';
const MASON_ANIMATE_CLASS = 'k3ui-mason--isofilter-animate';

type VisibilityState = {
    wasVisible: boolean;
    isVisible: boolean;
    visibility: FlipVisibility;
};

export class IsoFilter extends Component<IsoFilterOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    private logger: LoggerManager;

    private _controls: HTMLElement[] = [];
    private _sourceItems: IsoFilterSourceItem[] = [];

    private _masonContainers: HTMLElement[] = [];
    private _masonItemsById: Map<string, HTMLElement> = new Map();
    private _sourceIds: Set<string> = new Set();

    private _currentFilter: string;
    private _currentlyVisibleIds: Set<string> = new Set();

    private _isDestroying = false;

    /** État snapshot pour restaurer au destroy() */
    private _originalMasonItemsState: Map<HTMLElement, {
        hiddenAttr: string | null;
        opacity: string;
        transition: string;
    }> = new Map();

    /** Timer de cleanup animation */
    private _animationCleanupTimeoutId: number | null = null;

    constructor(el: HTMLElement, options: Partial<IsoFilterOptions> = {}) {
        super(el, options, toComponentClassDef(IsoFilter));

        this.logger = ManagerFactory.getLoggerManager('[IsoFilter]');

        // Le base Component a déjà merged les defaults via IsoFilter.defaults.
        this._setupRootClass();

        this._controls = this._collectControls();
        this._sourceItems = this._collectSourceItems();
        this._sourceIds = new Set(this._sourceItems.map(it => it.id));

        this._masonContainers = this._collectMasonContainers();
        this._masonItemsById = this._collectMasonItemsById();

        // Snapshot avant mutation
        this._snapshotOriginalMasonItemsState();

        this._currentFilter = this._resolveInitialFilter();

        // Initialisation sans animation (évite glitch visuel)
        this._applyFilter(this._currentFilter, { animate: false });

        this._setupControlListeners();
    }

    static get defaults(): IsoFilterOptions {
        return { ...getIsoFilterDefaults() };
    }

    static getInstance(el: HTMLElement): IsoFilter | undefined {
        return Component.getInstance(el) as IsoFilter | undefined;
    }

    static init(el: HTMLElement, options?: Partial<IsoFilterOptions>): IsoFilter;
    static init(els: InitElements<KElement>, options?: Partial<IsoFilterOptions>): IsoFilter[];
    static init(
        els: HTMLElement | InitElements<KElement>,
        options: Partial<IsoFilterOptions> = {}
    ): IsoFilter | IsoFilter[] {
        return Component.init(els, options, toComponentClassDef(IsoFilter)) as IsoFilter | IsoFilter[];
    }

    destroy(): void {
        if (this._isDestroying) return;
        this._isDestroying = true;

        if (this._animationCleanupTimeoutId != null) {
            window.clearTimeout(this._animationCleanupTimeoutId);
            this._animationCleanupTimeoutId = null;
        }

        // Supprimer classe animation sur Mason
        for (const masonRoot of this._masonContainers) {
            masonRoot.classList.remove(MASON_ANIMATE_CLASS);
        }

        // Restaurer l'état inline des items Mason
        for (const [el, snapshot] of this._originalMasonItemsState.entries()) {
            if (!el) continue;
            if (snapshot.hiddenAttr == null) el.removeAttribute(this.options.masonHiddenAttribute);
            else el.setAttribute(this.options.masonHiddenAttribute, snapshot.hiddenAttr);

            el.style.opacity = snapshot.opacity;
            el.style.transition = snapshot.transition;
        }

        super.destroy();
    }

    private _setupRootClass(): void {
        this.el.classList.add(ROOT_CLASS);
    }

    private _collectControls(): HTMLElement[] {
        const controls = Array.from(this.el.querySelectorAll<HTMLElement>(this.options.controlsSelector));
        return controls.filter(c => c instanceof HTMLElement);
    }

    private _collectSourceItems(): IsoFilterSourceItem[] {
        const items = Array.from(this.el.querySelectorAll<HTMLElement>(this.options.itemsSelector));
        const out: IsoFilterSourceItem[] = [];

        for (const itemEl of items) {
            const id = itemEl.getAttribute(this.options.idAttribute);
            if (!id) continue;
            const tagsRaw = itemEl.getAttribute(this.options.tagsAttribute) ?? '';
            out.push({
                id,
                tags: tokenizeTags(tagsRaw),
            });
        }

        return out;
    }

    private _collectMasonContainers(): HTMLElement[] {
        const local = Array.from(this.el.querySelectorAll<HTMLElement>(this.options.masonContainerSelector));
        if (local.length > 0) return local;
        return Array.from(document.querySelectorAll<HTMLElement>(this.options.masonContainerSelector));
    }

    private _collectMasonItemsById(): Map<string, HTMLElement> {
        const map: Map<string, HTMLElement> = new Map();

        for (const container of this._masonContainers) {
            const items = Array.from(container.querySelectorAll<HTMLElement>(this.options.masonItemsSelector));
            for (const itemEl of items) {
                const id = itemEl.getAttribute(this.options.idAttribute);
                if (!id) continue;
                map.set(id, itemEl);
            }
        }

        return map;
    }

    private _snapshotOriginalMasonItemsState(): void {
        for (const item of this._masonItemsById.values()) {
            this._originalMasonItemsState.set(item, {
                hiddenAttr: item.getAttribute(this.options.masonHiddenAttribute),
                opacity: item.style.opacity,
                transition: item.style.transition,
            });
        }
    }

    private _resolveInitialFilter(): string {
        const fromRoot = this.el.getAttribute(this.options.controlFilterAttribute);
        if (fromRoot && fromRoot.trim().length > 0) return fromRoot;

        // Sinon : tenter de trouver un contrôle "all"
        const allCtrl = this._controls.find(c => (c.getAttribute(this.options.controlFilterAttribute) ?? '').trim() === this.options.allFilterValue);
        if (allCtrl) {
            return this.options.allFilterValue;
        }

        return this.options.allFilterValue;
    }

    private _setupControlListeners(): void {
        for (const control of this._controls) {
            const handler = (event: Event) => {
                event.preventDefault();
                const filterValue = control.getAttribute(this.options.controlFilterAttribute);
                if (!filterValue) return;
                this._setFilter(filterValue);
            };
            this.registerEvent(control, 'click', handler as unknown as EventListener);
        }
    }

    private _setFilter(filterValue: string): void {
        const normalized = filterValue.trim();
        if (normalized === this._currentFilter) return;
        this._currentFilter = normalized;
        this._applyFilter(normalized, { animate: true });
    }

    private _applyFilter(filterValue: string, params: { animate: boolean }): void {
        if (this._isDestroying) return;

        const visibleIdsArr = computeVisibleIds({
            items: this._sourceItems,
            filterValue,
            options: {
                allFilterValue: this.options.allFilterValue,
                matchMode: this.options.matchMode,
                fallbackToAllOnNoMatch: this.options.fallbackToAllOnNoMatch,
            },
        });

        const visibleIds = new Set(visibleIdsArr);
        this._runVisibilityAndLayout(visibleIds, params.animate);
    }

    private _runVisibilityAndLayout(newVisibleIds: Set<string>, animate: boolean): void {
        const masonItems = Array.from(this._masonItemsById.values());
        const targetElements = masonItems.filter(el => {
            const id = el.getAttribute(this.options.idAttribute);
            return !!id && this._sourceIds.has(id);
        });

        const visibilityByEl: Map<HTMLElement, VisibilityState> = new Map();
        for (const el of targetElements) {
            const id = el.getAttribute(this.options.idAttribute)!;
            const wasVisible = this._currentlyVisibleIds.has(id);
            const isVisible = newVisibleIds.has(id);
            const visibility: FlipVisibility = isVisible && !wasVisible ? 'enter' : (!isVisible && wasVisible ? 'exit' : 'stay');
            visibilityByEl.set(el, { wasVisible, isVisible, visibility });
        }

        const firstRects: RectMap = animate ? captureRects(targetElements) : new Map();

        // Mettre à jour "hidden" avant relayout Mason.
        for (const el of targetElements) {
            const id = el.getAttribute(this.options.idAttribute)!;
            const isVisible = newVisibleIds.has(id);
            if (isVisible) {
                el.removeAttribute(this.options.masonHiddenAttribute);
            } else {
                el.setAttribute(this.options.masonHiddenAttribute, 'true');
            }

            // Opacité / interaction :
            // - initial : on applique directement
            // - animation : la gestion opacité est faite dans runFlipAnimation
            if (!animate) {
                el.style.opacity = isVisible ? '1' : '0';
            }
        }

        // Déclencher relayout Mason
        // En mode animé : ne pas appliquer tout de suite la hauteur du conteneur (évite le “snap” UX) ;
        // la hauteur cible est appliquée dans le double rAF avec transition CSS (voir ci‑dessous).
        // suppressExternalLayoutFor AVANT refresh : bloque ResizeObserver / retry 200 ms pendant le FLIP.
        for (const masonRoot of this._masonContainers) {
            const instance = Mason.getInstance(masonRoot);
            if (instance && typeof instance.refresh === 'function') {
                if (animate) {
                    instance.suppressExternalLayoutFor(this.options.animationDurationMs + 100);
                }
                instance.refresh(animate ? { skipContainerHeight: true } : undefined);
            }
        }

        if (!animate) {
            // Flush état visible
            this._currentlyVisibleIds = new Set(newVisibleIds);
            return;
        }

        // FLIP après relayout Mason : deux rAF pour être sûrs que les transform sont à jour.
        requestAnimationFrame(() => {
            if (this._isDestroying) return;
            requestAnimationFrame(() => {
                if (this._isDestroying) return;

                const lastRects = captureRects(targetElements);

                const flipVisibility: Map<HTMLElement, FlipVisibility> = new Map();
                for (const [el, state] of visibilityByEl.entries()) {
                    flipVisibility.set(el, state.visibility);
                }

                // Activer transitions Mason (coordination) : FLIP items + hauteur du conteneur
                for (const masonRoot of this._masonContainers) {
                    masonRoot.style.setProperty('--k3ui-mason-flip-duration', `${this.options.animationDurationMs}ms`);
                    masonRoot.classList.add(MASON_ANIMATE_CLASS);
                    const masonInst = Mason.getInstance(masonRoot);
                    const endH = masonInst?.getLastContainerHeightPx() ?? masonRoot.offsetHeight;
                    masonRoot.style.height = `${endH}px`;
                    masonInst?.suppressExternalLayoutFor(this.options.animationDurationMs + 100);
                }

                runFlipAnimation({
                    elements: targetElements,
                    first: firstRects,
                    last: lastRects,
                    durationMs: this.options.animationDurationMs,
                    opacityDurationMs: this.options.animationDurationMs,
                    visibilityByElement: flipVisibility,
                    easing: 'ease',
                });

                // Nettoyage après animation
                this._animationCleanupTimeoutId = window.setTimeout(() => {
                    for (const masonRoot of this._masonContainers) {
                        masonRoot.classList.remove(MASON_ANIMATE_CLASS);
                    }
                    for (const el of targetElements) {
                        // On enlève la transition inline si elle a été posée par le helper.
                        if (el.style.transition.includes('transform')) {
                            el.style.transition = '';
                        }
                    }
                }, this.options.animationDurationMs + 60);
            });
        });

        this._currentlyVisibleIds = new Set(newVisibleIds);
    }
}

