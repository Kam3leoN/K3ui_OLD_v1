/**
 * @fileoverview Composant ScrollToTop pour K3UI
 * @description Bouton flottant Material Design 3 Expressive pour remonter en haut de page avec progression de scroll
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import type { ScrollToTopOptions } from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { setAriaAttributes, removeAriaAttribute } from '../utils/dom/aria';
import { LocaleManager, LoggerManager } from '../core/managers';
import { ManagerFactory } from '../core/factories';
import { getScrollToTopDefaults } from '../specs/components/scroll-to-top.specs';
import { FLOATING_CHROME_SYNC_EVENT } from '../utils/fab/layer';
import { Tooltips } from './Tooltips';

interface KScrollToTopHTMLElement extends HTMLElement {
    K_ScrollToTop?: ScrollToTop;
}

const _defaults: ScrollToTopOptions = getScrollToTopDefaults();

export class ScrollToTop extends Component<ScrollToTopOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    private logger: LoggerManager;
    private buttonEl: HTMLButtonElement | null = null;
    private progressCircleEl: SVGCircleElement | null = null;
    private baseCircleEl: SVGCircleElement | null = null;
    private iconEl: SVGElement | null = null;
    private tooltipInstance: Tooltips | null = null;
    private scrollTarget: Window | HTMLElement = window;
    private isVisible = false;
    private rafId: number | null = null;
    private resizeObserver: ResizeObserver | null = null;
    private observedSiblingFab: HTMLElement | null = null;
    private siblingMutationObserver: MutationObserver | null = null;
    private siblingRetryTimeoutIds: number[] = [];
    private pendingShow = false;
    private activeScrollDuration = 0;
    private circumference = 0;

    static get defaults(): ScrollToTopOptions {
        return { ..._defaults };
    }

    static getInstance(el: HTMLElement): ScrollToTop | null {
        return (el as KScrollToTopHTMLElement).K_ScrollToTop ?? null;
    }

    static init(
        els: KElement | InitElements<KElement> | string,
        options: Partial<ScrollToTopOptions> = {}
    ): ScrollToTop[] {
        return Component.init(els, options, toComponentClassDef(ScrollToTop)) as ScrollToTop[];
    }

    constructor(el: HTMLElement, options: Partial<ScrollToTopOptions> = {}) {
        super(el, options, toComponentClassDef(ScrollToTop));
        this.logger = ManagerFactory.getLoggerManager('[ScrollToTop]');
        const fromHtml = ScrollToTop.readAttributes(el);
        this.options = {
            ...ScrollToTop.defaults,
            ...options,
            ...fromHtml,
        };

        (el as KScrollToTopHTMLElement).K_ScrollToTop = this;
        this.init();
    }

    private static readAttributes(el: HTMLElement): Partial<ScrollToTopOptions> {
        const out: Partial<ScrollToTopOptions> = {};
        const get = (key: string) => el.getAttribute(`data-${key}`);

        const threshold = get('threshold');
        if (threshold != null) {
            const n = parseInt(threshold, 10);
            if (!Number.isNaN(n)) out.threshold = n;
        }

        const size = get('size');
        if (size != null) {
            const n = parseInt(size, 10);
            if (!Number.isNaN(n)) out.size = n;
        }

        const stroke = get('stroke-width');
        if (stroke != null) {
            const n = parseFloat(stroke);
            if (!Number.isNaN(n)) out.strokeWidth = n;
        }

        const duration = get('scroll-duration');
        if (duration != null) {
            const n = parseInt(duration, 10);
            if (!Number.isNaN(n)) out.scrollDuration = n;
        }

        const rightOffset = get('right-offset');
        if (rightOffset != null) {
            const n = parseInt(rightOffset, 10);
            if (!Number.isNaN(n)) out.rightOffset = n;
        }

        const bottomOffset = get('bottom-offset');
        if (bottomOffset != null) {
            const n = parseInt(bottomOffset, 10);
            if (!Number.isNaN(n)) out.bottomOffset = n;
        }

        const siblingGap = get('sibling-gap');
        if (siblingGap != null) {
            const n = parseInt(siblingGap, 10);
            if (!Number.isNaN(n)) out.siblingGap = n;
        }

        const siblingFabSelector = get('sibling-fab-selector');
        if (siblingFabSelector != null) out.siblingFabSelector = siblingFabSelector;

        const showProgress = get('show-progress');
        if (showProgress === 'true' || showProgress === 'false') {
            out.showProgress = showProgress === 'true';
        }

        const scrollContainer = get('scroll-container');
        if (scrollContainer != null && scrollContainer !== '') {
            out.scrollContainer = scrollContainer;
        }

        return out;
    }

    private init(): void {
        this.el.classList.add('scroll-to-top');
        /** Évite aria-hidden sur le host masquant le bouton injecté (Lighthouse aria-hidden-focus). */
        removeAriaAttribute(this.el, 'hidden');
        this.resolveScrollTarget();
        this.buildDom();
        this.setupAccessibility();
        this.attachEvents();
        this.update();
        this.refreshSiblingOffset();
        this.scheduleSiblingOffsetSync();
        this.logger.info('ScrollToTop initialized');
    }

    private resolveScrollTarget(): void {
        const { scrollContainer } = this.options;
        if (!scrollContainer) {
            this.scrollTarget = window;
            return;
        }

        if (typeof scrollContainer === 'string') {
            const container = document.querySelector(scrollContainer);
            this.scrollTarget = container instanceof HTMLElement ? container : window;
            return;
        }

        this.scrollTarget = scrollContainer;
    }

    private buildDom(): void {
        this.el.innerHTML = '';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'scroll-to-top__button';

        const size = Math.max(36, this.options.size);
        const stroke = Math.max(2, this.options.strokeWidth);
        const radius = (size - stroke) / 2;
        this.circumference = 2 * Math.PI * radius;

        const ring = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        ring.setAttribute('class', 'scroll-to-top__ring');
        ring.setAttribute('viewBox', `0 0 ${size} ${size}`);
        ring.setAttribute('aria-hidden', 'true');

        const baseCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        baseCircle.setAttribute('class', 'scroll-to-top__ring-base');
        baseCircle.setAttribute('cx', String(size / 2));
        baseCircle.setAttribute('cy', String(size / 2));
        baseCircle.setAttribute('r', String(radius));
        baseCircle.setAttribute('stroke-width', String(stroke));

        const progressCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        progressCircle.setAttribute('class', 'scroll-to-top__ring-progress');
        progressCircle.setAttribute('cx', String(size / 2));
        progressCircle.setAttribute('cy', String(size / 2));
        progressCircle.setAttribute('r', String(radius));
        progressCircle.setAttribute('stroke-width', String(stroke));
        progressCircle.setAttribute('stroke-dasharray', String(this.circumference));
        progressCircle.setAttribute('stroke-dashoffset', String(this.circumference));

        ring.appendChild(baseCircle);
        ring.appendChild(progressCircle);

        const iconWrap = document.createElement('span');
        iconWrap.className = 'scroll-to-top__icon-wrap';
        iconWrap.setAttribute('aria-hidden', 'true');

        const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        icon.setAttribute('class', 'scroll-to-top__icon');
        icon.setAttribute('viewBox', '0 0 24 24');
        const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        polyline.setAttribute('points', '18 15 12 9 6 15');
        icon.appendChild(polyline);
        iconWrap.appendChild(icon);

        btn.appendChild(ring);
        btn.appendChild(iconWrap);
        this.el.appendChild(btn);

        this.buttonEl = btn;
        this.baseCircleEl = baseCircle;
        this.progressCircleEl = progressCircle;
        this.iconEl = icon;

        if (!this.options.showProgress) {
            ring.style.display = 'none';
        }

        this.applyCssVariables();
    }

    private applyCssVariables(): void {
        this.el.style.setProperty('--scroll-to-top-size', `${this.options.size}px`);
        this.el.style.setProperty('--scroll-to-top-bottom', `${this.options.bottomOffset}px`);
        this.el.style.setProperty('--scroll-to-top-right', `${this.options.rightOffset}px`);
    }

    private setupAccessibility(): void {
        if (!this.buttonEl) return;
        setAriaAttributes(this.buttonEl, {
            role: 'button',
            'aria-label': LocaleManager.t('scrollToTop.ariaLabel'),
        });

        this.tooltipInstance?.destroy();
        this.tooltipInstance = new Tooltips(this.buttonEl, {
            content: LocaleManager.t('scrollToTop.tooltipLabel'),
            placement: 'left',
            trigger: 'hover',
            offset: 10,
        });
    }

    private attachEvents(): void {
        if (!this.buttonEl) return;

        this.registerEvent(this.buttonEl, 'click', () => this.scrollToTop());
        this.registerEvent(this.buttonEl, 'pointerdown', () => {
            this.buttonEl?.classList.add('is-pressed');
        });
        this.registerEvent(this.buttonEl, 'pointerup', () => {
            this.buttonEl?.classList.remove('is-pressed');
        });
        this.registerEvent(this.buttonEl, 'pointerleave', () => {
            this.buttonEl?.classList.remove('is-pressed');
        });

        const target: Window | HTMLElement = this.scrollTarget;
        this.registerEvent(target, 'scroll', () => this.update(), { passive: true });
        this.registerEvent(window, 'resize', () => {
            this.update();
            this.refreshSiblingOffset();
        }, { passive: true });
        this.registerEvent(window, 'load', () => this.refreshSiblingOffset(), { passive: true });
        this.registerEvent(document, 'k3ui-ready', () => {
            this.refreshSiblingOffset();
        });
        this.registerEvent(document, FLOATING_CHROME_SYNC_EVENT, () => {
            this.refreshSiblingOffset();
        });
    }

    /**
     * Largeur utile du viewport pour le positionnement fixed (sans scrollbar).
     */
    private getViewportWidthPx(): number {
        return document.documentElement.clientWidth || window.innerWidth || 0;
    }

    /**
     * Inset droit du navigation-rail (px) posé sur body par utils/fab/layer.ts.
     */
    private getRailInsetRightPx(): number {
        const raw = window.getComputedStyle(document.body).getPropertyValue('--k3ui-rail-inset-right').trim();
        const value = parseFloat(raw);
        return Number.isNaN(value) ? 0 : value;
    }

    /**
     * Retourne le nœud racine du sibling FAB (menu, fixed, coin flottant…).
     */
    private resolveSiblingRoot(el: HTMLElement): HTMLElement {
        const menuRoot = el.closest('.button-fab-menu, k3ui-button-fab-menu');
        if (menuRoot instanceof HTMLElement) return menuRoot;
        if (el.classList.contains('button-fab') || el.classList.contains('button-fab--fixed')) return el;
        return el;
    }

    /**
     * Cible de mesure interne (bouton FAB réel plutôt que le wrapper).
     */
    private resolveSiblingMeasureTarget(root: HTMLElement): HTMLElement {
        if (root.classList.contains('button-fab-menu') || root.tagName.toLowerCase() === 'k3ui-button-fab-menu') {
            const trigger = root.querySelector('.button-fab__btn');
            return trigger instanceof HTMLElement ? trigger : root;
        }
        if (root.classList.contains('button-fab') || root.classList.contains('button-fab--fixed')) {
            const btn = root.querySelector('.button-fab__btn');
            return btn instanceof HTMLElement ? btn : root;
        }
        return root;
    }

    /**
     * Rectangle occupé par le sibling (pills du FabMenu incluses à l'ouverture).
     */
    private getSiblingOccupiedRect(root: HTMLElement): DOMRect {
        const menuRoot = root.closest('.button-fab-menu, k3ui-button-fab-menu');
        if (menuRoot instanceof HTMLElement) {
            const fabBtn = menuRoot.querySelector('.button-fab__btn');
            const isExpanded = fabBtn?.getAttribute('aria-expanded') === 'true';
            if (!isExpanded) {
                return this.resolveSiblingMeasureTarget(menuRoot).getBoundingClientRect();
            }

            const nodes = [
                menuRoot.querySelector('.button-fab__btn'),
                ...Array.from(menuRoot.querySelectorAll('.button-fab-menu__item, .button-fab-menu__pill')),
            ];
            let left = Infinity;
            let right = -Infinity;
            let top = Infinity;
            let bottom = -Infinity;
            let hasBox = false;

            nodes.forEach((node) => {
                if (!(node instanceof HTMLElement)) return;
                const style = window.getComputedStyle(node);
                if (style.display === 'none' || style.visibility === 'hidden') return;
                const opacity = parseFloat(style.opacity);
                if (!Number.isNaN(opacity) && opacity <= 0.01) return;
                const rect = node.getBoundingClientRect();
                if (rect.width <= 0 || rect.height <= 0) return;
                hasBox = true;
                left = Math.min(left, rect.left);
                right = Math.max(right, rect.right);
                top = Math.min(top, rect.top);
                bottom = Math.max(bottom, rect.bottom);
            });

            if (hasBox) {
                return new DOMRect(left, top, right - left, bottom - top);
            }
        }

        return this.resolveSiblingMeasureTarget(root).getBoundingClientRect();
    }

    /**
     * Rectangle horizontal de référence : toujours le trigger FAB (les items s’ouvrent au-dessus).
     */
    private getSiblingHorizontalAnchorRect(sibling: HTMLElement, occupied: DOMRect): DOMRect {
        const menuRoot = sibling.closest('.button-fab-menu, k3ui-button-fab-menu');
        if (menuRoot instanceof HTMLElement) {
            const fabBtn = menuRoot.querySelector('.button-fab__btn');
            if (fabBtn instanceof HTMLElement) {
                return fabBtn.getBoundingClientRect();
            }
        }
        return occupied;
    }

    /**
     * Décalage horizontal (px) pour placer le scroll-to-top à gauche du sibling (gap = edge inset).
     * Préfère le calcul géométrique (largeur sibling + gap) pour éviter un slide depuis la droite.
     */
    private computeSiblingRightExtraPx(sibling: HTMLElement, occupied: DOMRect): number {
        const geometricExtra = this.computeSiblingRightExtraPxGeometric(sibling);
        if (geometricExtra != null) return geometricExtra;

        const rect = this.getSiblingHorizontalAnchorRect(sibling, occupied);
        if (rect.width <= 0 || rect.height <= 0) return 0;

        const viewportWidth = this.getViewportWidthPx();
        const anchorRight = viewportWidth - this.options.rightOffset - this.getRailInsetRightPx();
        const targetRightEdge = rect.left - this.options.siblingGap;
        const extra = anchorRight - targetRightEdge;

        return extra > 0 ? Math.round(extra) : 0;
    }

    /**
     * Extra horizontal stable : largeur du trigger FAB + gap (ignoré l’emprise des items ouverts).
     */
    private computeSiblingRightExtraPxGeometric(sibling: HTMLElement): number | null {
        const isFixedCornerSibling =
            sibling.closest('.fab-menu-layer__slot--bottom-right, .fab-menu-layer__slot--bottom-left') != null
            || sibling.classList.contains('button-fab--fixed')
            || sibling.classList.contains('button-fab')
            || sibling.classList.contains('button-fab-menu')
            || sibling.tagName.toLowerCase() === 'k3ui-button-fab'
            || sibling.tagName.toLowerCase() === 'k3ui-button-fab-menu'
            || sibling.hasAttribute('data-fixed')
            || sibling.classList.contains('k3ui-floating-corner');

        if (!isFixedCornerSibling) return null;

        const trigger = this.resolveSiblingMeasureTarget(sibling);
        const width = Math.round(trigger.getBoundingClientRect().width) || trigger.offsetWidth;
        if (width <= 0) return null;

        return width + this.options.siblingGap;
    }

    private getAppliedSiblingRightExtraPx(): number {
        const raw = this.el.style.getPropertyValue('--scroll-to-top-right-extra').trim();
        if (!raw) return 0;
        const value = parseFloat(raw);
        return Number.isNaN(value) ? 0 : value;
    }

    private applySiblingRightExtra(extraPx: number): void {
        if (extraPx > 0) {
            this.el.style.setProperty('--scroll-to-top-right-extra', `${extraPx}px`);
        } else {
            this.el.style.removeProperty('--scroll-to-top-right-extra');
        }
    }

    private shouldDeferShowForSibling(extraPx: number): boolean {
        const sibling = this.getSiblingFabElement();
        if (sibling) return extraPx <= 0;

        if (
            document.body.classList.contains('has-fab-menu')
            && !document.querySelector('.button-fab-menu .button-fab__btn, k3ui-button-fab-menu .button-fab__btn')
        ) {
            return true;
        }

        return false;
    }

    private getSiblingFabElement(): HTMLElement | null {
        if (!this.options.siblingFabSelector) return null;

        const roots = Array.from(new Set(
            Array.from(document.querySelectorAll(this.options.siblingFabSelector))
                .filter((el): el is HTMLElement => el instanceof HTMLElement)
                .map((el) => this.resolveSiblingRoot(el))
        ));

        if (roots.length === 0) return null;

        const vw = this.getViewportWidthPx();
        const half = vw / 2;

        const candidates = roots
            .map((root) => ({
                root,
                rect: this.getSiblingOccupiedRect(root),
            }))
            .filter(({ rect }) => {
                if (rect.width <= 0 || rect.height <= 0) return false;
                const centerX = rect.left + rect.width / 2;
                return centerX >= half;
            });

        if (candidates.length === 0) return null;

        candidates.sort((a, b) => {
            if (b.rect.right !== a.rect.right) return b.rect.right - a.rect.right;
            return b.rect.bottom - a.rect.bottom;
        });

        return candidates[0].root;
    }

    private refreshSiblingOffset(): void {
        const sibling = this.getSiblingFabElement();
        if (!sibling) {
            this.el.style.removeProperty('--scroll-to-top-right-extra');
            this.el.style.setProperty('--scroll-to-top-bottom', `${this.options.bottomOffset}px`);
            this.detachSiblingObserver();

            if (this.pendingShow && !this.shouldDeferShowForSibling(0)) {
                this.pendingShow = false;
                void this.el.offsetWidth;
                this.reveal();
            }
            return;
        }

        const occupiedRect = this.getSiblingOccupiedRect(sibling);
        const extraPx = this.computeSiblingRightExtraPx(sibling, occupiedRect);
        this.applySiblingRightExtra(extraPx);
        this.el.style.setProperty('--scroll-to-top-bottom', `${this.options.bottomOffset}px`);

        if (this.pendingShow && !this.shouldDeferShowForSibling(extraPx)) {
            this.pendingShow = false;
            void this.el.offsetWidth;
            this.reveal();
        }

        if (typeof ResizeObserver !== 'undefined' && sibling !== this.observedSiblingFab) {
            this.detachSiblingObserver();
            this.resizeObserver = new ResizeObserver(() => this.refreshSiblingOffset());
            this.resizeObserver.observe(sibling);
            this.observedSiblingFab = sibling;
        }

        if (typeof MutationObserver !== 'undefined') {
            if (!this.siblingMutationObserver) {
                this.siblingMutationObserver = new MutationObserver(() => this.refreshSiblingOffset());
            }
            this.siblingMutationObserver.disconnect();
            this.siblingMutationObserver.observe(sibling, {
                attributes: true,
                subtree: true,
                attributeFilter: ['class', 'style', 'aria-expanded'],
            });
        }
    }

    private scheduleSiblingOffsetSync(): void {
        const retryDelays = [50, 150, 300, 600, 1000];
        this.siblingRetryTimeoutIds = retryDelays.map((delay) => window.setTimeout(() => {
            this.refreshSiblingOffset();
        }, delay));
    }

    private detachSiblingObserver(): void {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        if (this.siblingMutationObserver) {
            this.siblingMutationObserver.disconnect();
        }
        this.observedSiblingFab = null;
    }

    private getScrollState(): { top: number; max: number } {
        if (this.scrollTarget === window) {
            const top = window.scrollY ?? document.documentElement.scrollTop ?? 0;
            const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
            return { top, max };
        }
        const target = this.scrollTarget as HTMLElement;
        const top = target.scrollTop;
        const max = Math.max(0, target.scrollHeight - target.clientHeight);
        return { top, max };
    }

    private update(): void {
        const { top, max } = this.getScrollState();
        const progress = max > 0 ? Math.min(1, Math.max(0, top / max)) : 0;
        this.refreshSiblingOffset();

        if (this.progressCircleEl) {
            const offset = this.circumference * (1 - progress);
            this.progressCircleEl.style.strokeDashoffset = String(offset);
        }

        const shouldShow = top > this.options.threshold;
        if (shouldShow !== this.isVisible) {
            if (shouldShow) {
                this.refreshSiblingOffset();
                this.toggleVisibility(true);
            } else {
                this.pendingShow = false;
                this.toggleVisibility(false);
            }
        }
    }

    /**
     * Affiche le bouton (position horizontale déjà appliquée, sans slide depuis la droite).
     */
    private reveal(): void {
        if (!this.buttonEl || this.isVisible) return;

        this.isVisible = true;
        this.options.onShowStart?.(this);
        this.options.onOpenStart?.(this.el);
        this.el.classList.add('is-visible');
        this.el.classList.remove('is-hidden');
        this.options.onShowEnd?.(this);
        this.options.onOpenEnd?.(this.el);
    }

    private toggleVisibility(show: boolean): void {
        if (!this.buttonEl) return;

        if (show) {
            this.refreshSiblingOffset();
            const extraPx = this.getAppliedSiblingRightExtraPx();
            if (this.shouldDeferShowForSibling(extraPx)) {
                this.pendingShow = true;
                return;
            }
            this.pendingShow = false;
            // Force layout : position horizontale figée avant l'anim de visibilité.
            void this.el.offsetWidth;
            this.reveal();
            return;
        }

        this.pendingShow = false;
        this.isVisible = false;
        this.options.onHideStart?.(this);
        this.options.onCloseStart?.(this.el);
        this.el.classList.remove('is-visible');
        this.el.classList.add('is-hidden');
        this.options.onHideEnd?.(this);
        this.options.onCloseEnd?.(this.el);
    }

    private isReducedMotion(): boolean {
        if (typeof window === 'undefined' || !window.matchMedia) return false;
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    private scrollToTop(): void {
        const { top } = this.getScrollState();
        if (top <= 0) return;

        this.options.onScrollStart?.(this);

        if (this.isReducedMotion() || this.options.scrollDuration <= 0) {
            if (this.scrollTarget === window) window.scrollTo(0, 0);
            else (this.scrollTarget as HTMLElement).scrollTop = 0;
            this.options.onScrollEnd?.(this);
            return;
        }

        if (this.rafId != null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }

        const startTop = top;
        const viewportSize = this.scrollTarget === window
            ? window.innerHeight
            : (this.scrollTarget as HTMLElement).clientHeight;
        const startTime = performance.now();
        const minDuration = 220;
        const maxDuration = Math.max(minDuration, this.options.scrollDuration);
        const travelRatio = Math.min(1, startTop / Math.max(1, viewportSize * 2));
        this.activeScrollDuration = Math.round(minDuration + ((maxDuration - minDuration) * travelRatio));

        const easeOutExpo = (t: number): number => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

        const animate = (now: number): void => {
            const t = Math.min((now - startTime) / this.activeScrollDuration, 1);
            const nextTop = Math.max(0, startTop * (1 - easeOutExpo(t)));
            if (this.scrollTarget === window) {
                window.scrollTo(0, nextTop);
            } else {
                (this.scrollTarget as HTMLElement).scrollTop = nextTop;
            }
            if (t < 1) {
                this.rafId = requestAnimationFrame(animate);
                return;
            }
            this.rafId = null;
            this.options.onScrollEnd?.(this);
        };

        this.rafId = requestAnimationFrame(animate);
    }

    override destroy(): void {
        if (this.rafId != null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        if (this.resizeObserver) {
            this.detachSiblingObserver();
        }
        if (this.siblingRetryTimeoutIds.length > 0) {
            this.siblingRetryTimeoutIds.forEach((id) => window.clearTimeout(id));
            this.siblingRetryTimeoutIds = [];
        }
        if (this.buttonEl) {
            removeAriaAttribute(this.buttonEl, 'label');
        }
        this.buttonEl = null;
        this.progressCircleEl = null;
        this.baseCircleEl = null;
        this.iconEl = null;
        this.tooltipInstance?.destroy();
        this.tooltipInstance = null;

        if ((this.el as KScrollToTopHTMLElement).K_ScrollToTop === this) {
            delete (this.el as KScrollToTopHTMLElement).K_ScrollToTop;
        }
        this.logger.info('ScrollToTop destroyed');
        super.destroy();
    }
}

if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-scroll-to-top')) {
    customElements.define('k3ui-scroll-to-top', class K3UIScrollToTopElement extends HTMLElement {
        connectedCallback(): void {
            if (!this.hasAttribute('data-initialized')) {
                this.setAttribute('data-initialized', 'true');
            }
        }
        disconnectedCallback(): void {}
    });
}
