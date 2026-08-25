/**
 * @fileoverview Composant NavigationRail pour K3UI (Material Design 3 Expressive)
 * @description Rail vertical avec indicateur pill (même modèle transform que NavigationBar),
 * collapsed ↔ expanded via WideNavigationRail-like spatial-default.
 * @author K3UI Team
 * @version 1.1.0
 */

import { Component } from '../core/base/Component';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import type { NavigationRailOptions } from '../types/components';
import { PriorityLevel } from '../types/base';
import { setAriaAttributes, setAriaAttribute, removeAriaAttribute } from '../utils/dom/aria';
import { generateGuid } from '../utils/helpers/guid';
import { LoggerManager, LocaleManager, IconManager, ScrollbarManager, Keyboard } from '../core/managers';
import type { ScrollbarHandle } from '../core/managers/ScrollbarManager';
import { ManagerFactory } from '../core/factories/ManagerFactory';
import { getNavigationRailDefaults } from '../specs/components/navigation-rail.specs';
import { NavigationRailSpecs } from '../specs/components/navigation-rail.specs';
import { requestFloatingChromeSync } from '../utils/fab';

const _defaults: NavigationRailOptions = getNavigationRailDefaults();
const BODY_MODAL_OPEN_CLASS = 'navigation-rail-modal-open';
const OVERLAY_CLASS = 'navigation-rail-overlay';
const EXPAND_MODAL_CLASS = 'navigation-rail--expand-modal';
const EXPAND_PUSH_CLASS = 'navigation-rail--expand-push';

/**
 * Classe NavigationRail — MD3 Expressive Wide Navigation Rail
 * Pill : translate(-50%,-50%) scaleX (harmonisé NavigationBar)
 * Expand : layout + largeur en parallèle (spatial-default 500ms)
 */
export class NavigationRail extends Component<NavigationRailOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    private logger: LoggerManager;
    private items: HTMLElement[] = [];
    private panels: HTMLElement[] = [];
    private toggleEl: HTMLElement | null = null;
    private expandAnimTimer: ReturnType<typeof setTimeout> | null = null;
    private chromeRafId: number | null = null;
    private expandSeq = 0;
    private pillAnimTimer: ReturnType<typeof setTimeout> | null = null;
    private hrefNavTimer: ReturnType<typeof setTimeout> | null = null;
    private itemsEl: HTMLElement | null = null;
    private itemsShellEl: HTMLElement | null = null;
    private stackEl: HTMLElement | null = null;
    private footerEl: HTMLElement | null = null;
    private mainEl: HTMLElement | null = null;
    private scrollbarHandle: ScrollbarHandle | null = null;
    private overlayEl: HTMLElement | null = null;
    private overlayCleanup: (() => void) | null = null;
    private modalKeyboard: Keyboard | null = null;

    static get defaults(): NavigationRailOptions {
        return { ..._defaults };
    }

    static getInstance(el: HTMLElement): NavigationRail | undefined {
        return Component.getInstance(el) as NavigationRail | undefined;
    }

    static init(els: HTMLElement | NodeListOf<HTMLElement> | string, options: Partial<NavigationRailOptions> = {}): NavigationRail[] {
        return Component.init(els, options, toComponentClassDef(NavigationRail)) as NavigationRail[];
    }

    constructor(el: HTMLElement, options: Partial<NavigationRailOptions> = {}) {
        super(el, options, toComponentClassDef(NavigationRail));

        this.logger = ManagerFactory.getLoggerManager('[NavigationRail]');
        this.options = {
            ...NavigationRail.defaults,
            ...options,
        };

        if (el.hasAttribute('data-active-index')) {
            const v = parseInt(el.getAttribute('data-active-index')!, 10);
            if (!Number.isNaN(v) && v >= 0) this.options.activeIndex = v;
        }
        if (el.hasAttribute('data-expanded')) {
            this.options.expanded = el.getAttribute('data-expanded') !== 'false' && el.getAttribute('data-expanded') !== '0';
        }
        if (el.hasAttribute('data-expand-mode')) {
            const mode = el.getAttribute('data-expand-mode');
            if (mode === 'modal' || mode === 'push') {
                this.options.expandMode = mode;
            }
        }

        if (!this.options.id) this.options.id = generateGuid();
        el.id = el.id || this.options.id;
        el.setAttribute('data-navigation-rail-id', this.options.id);

        this.init();
    }

    private isModalExpand(): boolean {
        return this.options.expandMode === 'modal';
    }

    private init(): void {
        this.resolveStructure();
        this.ensureFooterStructure();
        this.ensureMainGroupStructure();
        this.resolveStructure();
        this.el.classList.toggle('navigation-rail--border', this.options.border === true);
        this.el.classList.toggle(EXPAND_MODAL_CLASS, this.isModalExpand());
        this.el.classList.toggle(EXPAND_PUSH_CLASS, !this.isModalExpand());
        this.el.setAttribute('data-expand-mode', this.isModalExpand() ? 'modal' : 'push');
        if (this.items.length === 0) {
            this.logger.warn('NavigationRail: aucun .navigation-rail__item trouvé');
            return;
        }
        this.applyExpanded(false);
        this.setActiveIndex(this.options.activeIndex, false);
        this.setupAria();
        this.setupEvents();
        this.setupItemsScrollbar();
        if (this.el) {
            IconManager.processIconsInContainer(this.el);
        }
        this.logger.info('NavigationRail initialized');
    }

    /**
     * Applique collapsed/expanded.
     * M3 WideNavigationRail : le mode layout change immédiatement ; la largeur
     * morph avec spatial-default. Les items (icône top→start, pill 56×32→capsule)
     * suivent la même courbe — pas de snap en fin d’anim.
     * Mode `modal` : pas de push (padding reste collapsed) + scrim.
     */
    private applyExpanded(animate = true): void {
        const expanding = this.options.expanded;
        const modal = this.isModalExpand();
        const widthCollapsed = `${NavigationRailSpecs.dimensions.widthCollapsed}px`;
        const widthExpanded = `${NavigationRailSpecs.dimensions.widthExpanded}px`;
        const targetWidth = expanding ? widthExpanded : widthCollapsed;
        /* En modal, le flux garde toujours la largeur collapsed (pas de push). */
        const flowWidth = modal ? widthCollapsed : targetWidth;
        const durationMs = expanding
            ? NavigationRailSpecs.dimensions.expandDurationMs
            : NavigationRailSpecs.dimensions.collapseDurationMs;

        const syncRailWidthVars = (widthForRail: string, widthForFlow: string): void => {
            this.el.style.setProperty('--k3-navigation-rail-width', widthForRail);
            const container = this.el.closest('.navigation-rail-container');
            if (container instanceof HTMLElement) {
                container.style.setProperty('--k3-navigation-rail-width', widthForFlow);
                /* Padding explicite : évite le bug Chrome où transition sur
                 * padding-inline-start: var(--x) reste bloqué à l’ancienne valeur. */
                container.style.paddingInlineStart = widthForFlow;
            }
            const leadingPane = this.el.closest(
                '.leading-pane, k3ui-panel-content.panel-content--leading, k3ui-content-pane.content-pane--leading'
            );
            if (leadingPane instanceof HTMLElement) {
                leadingPane.style.setProperty('--k3-navigation-rail-width', widthForFlow);
                leadingPane.style.setProperty('--docs-leading-width', widthForFlow);
                leadingPane.classList.toggle('leading-pane--rail-collapsing', !expanding && !modal);
                leadingPane.classList.toggle('leading-pane--rail-expanding', expanding && !modal);
            }
        };

        const syncToggleAria = (): void => {
            const ariaLabel = expanding
                ? LocaleManager.t('navigationRail.ariaLabelExpanded')
                : LocaleManager.t('navigationRail.ariaLabelCollapsed');
            if (this.toggleEl && ariaLabel) setAriaAttribute(this.toggleEl, 'label', ariaLabel);
        };

        this.clearExpandTimers();
        const seq = ++this.expandSeq;

        this.el.classList.remove('navigation-rail--expanding', 'navigation-rail--collapsing');
        this.el.setAttribute('data-expanded', String(expanding));
        this.el.classList.toggle('navigation-rail--expanded', expanding);
        syncToggleAria();
        this.syncModalChrome(expanding, animate);
        /* Flux (push/modal) immédiat — le morph largeur du rail peut suivre au frame suivant */
        syncRailWidthVars(targetWidth, flowWidth);

        if (!animate) {
            this.el.classList.add('navigation-rail--no-motion');
            this.el.classList.remove('navigation-rail--animating');
            requestFloatingChromeSync();
            requestAnimationFrame(() => {
                this.el.classList.remove('navigation-rail--no-motion');
                this.scrollbarHandle?.refresh();
            });
            return;
        }

        this.el.classList.remove('navigation-rail--no-motion');
        this.el.classList.add(
            expanding ? 'navigation-rail--expanding' : 'navigation-rail--collapsing',
            'navigation-rail--animating'
        );

        requestAnimationFrame(() => {
            if (seq !== this.expandSeq) return;
            requestAnimationFrame(() => {
                if (seq !== this.expandSeq) return;
                syncRailWidthVars(targetWidth, flowWidth);
                requestFloatingChromeSync();
                this.startChromeSyncLoop(durationMs);
            });
        });

        this.expandAnimTimer = setTimeout(() => {
            if (seq !== this.expandSeq) return;
            this.el.classList.remove(
                'navigation-rail--animating',
                'navigation-rail--expanding',
                'navigation-rail--collapsing'
            );
            const leadingPane = this.el.closest(
                '.leading-pane, k3ui-panel-content.panel-content--leading, k3ui-content-pane.content-pane--leading'
            );
            if (leadingPane instanceof HTMLElement) {
                leadingPane.classList.remove('leading-pane--rail-collapsing', 'leading-pane--rail-expanding');
            }
            this.expandAnimTimer = null;
            this.stopChromeSyncLoop();
            requestFloatingChromeSync();
            this.scrollbarHandle?.refresh();
            if (this.options.expanded) {
                this.options.onOpenEnd?.(this.el);
            } else {
                this.options.onCloseEnd?.(this.el);
            }
        }, durationMs);
    }

    /**
     * Scrim + scroll-lock + Escape — uniquement en expandMode modal.
     */
    private syncModalChrome(expanded: boolean, animate: boolean): void {
        if (!this.isModalExpand()) {
            this.teardownModalChrome();
            return;
        }

        if (expanded) {
            this.ensureOverlay();
            this.showOverlay(animate);
            if (this.options.preventScrolling) {
                document.body.classList.add(BODY_MODAL_OPEN_CLASS);
            }
            this.bindModalEscape();
        } else {
            this.hideOverlay(animate);
            document.body.classList.remove(BODY_MODAL_OPEN_CLASS);
            this.unbindModalEscape();
        }
    }

    private ensureOverlay(): void {
        if (this.overlayEl) return;
        const overlay = document.createElement('div');
        overlay.className = OVERLAY_CLASS;
        overlay.setAttribute('aria-hidden', 'true');
        const opacity = Math.min(1, Math.max(0, Number(this.options.overlayOpacity) || 0.32));
        overlay.style.setProperty('--navigation-rail-overlay-opacity', String(opacity));
        document.body.appendChild(overlay);
        this.overlayEl = overlay;

        if (this.options.dismissible !== false) {
            this.overlayCleanup = this.registerEvent(overlay, 'click', () => {
                this.setExpanded(false);
            });
        }
    }

    private showOverlay(animate: boolean): void {
        if (!this.overlayEl) return;
        this.overlayEl.style.display = 'block';
        if (!animate) {
            this.overlayEl.classList.add('is-visible');
            return;
        }
        this.overlayEl.classList.remove('is-visible');
        void this.overlayEl.offsetWidth;
        requestAnimationFrame(() => {
            this.overlayEl?.classList.add('is-visible');
        });
    }

    private hideOverlay(animate: boolean): void {
        if (!this.overlayEl) return;
        const overlay = this.overlayEl;
        overlay.classList.remove('is-visible');
        if (!animate) {
            overlay.style.display = 'none';
            return;
        }
        window.setTimeout(() => {
            if (!this.options.expanded && this.overlayEl === overlay) {
                overlay.style.display = 'none';
            }
        }, NavigationRailSpecs.dimensions.collapseDurationMs);
    }

    private bindModalEscape(): void {
        if (this.modalKeyboard || this.options.dismissible === false) return;
        this.modalKeyboard = new Keyboard({
            target: document,
            enabled: true,
            ignoreSystemKeys: false,
            onKeyDown: (_event: KeyboardEvent, key: string) => {
                if (key !== 'Escape') return;
                if (!this.options.expanded || !this.isModalExpand()) return;
                this.setExpanded(false);
            },
        });
    }

    private unbindModalEscape(): void {
        if (!this.modalKeyboard) return;
        this.modalKeyboard.destroy?.();
        this.modalKeyboard = null;
    }

    private teardownModalChrome(): void {
        this.unbindModalEscape();
        document.body.classList.remove(BODY_MODAL_OPEN_CLASS);
        if (this.overlayCleanup) {
            this.overlayCleanup();
            this.overlayCleanup = null;
        }
        if (this.overlayEl) {
            this.overlayEl.remove();
            this.overlayEl = null;
        }
    }

    private clearExpandTimers(): void {
        if (this.expandAnimTimer !== null) {
            clearTimeout(this.expandAnimTimer);
            this.expandAnimTimer = null;
        }
        this.stopChromeSyncLoop();
    }

    private startChromeSyncLoop(durationMs: number): void {
        this.stopChromeSyncLoop();
        const animStart = performance.now();
        const tick = (now: number): void => {
            requestFloatingChromeSync();
            if (now - animStart < durationMs) {
                this.chromeRafId = requestAnimationFrame(tick);
            } else {
                this.chromeRafId = null;
            }
        };
        this.chromeRafId = requestAnimationFrame(tick);
    }

    private stopChromeSyncLoop(): void {
        if (this.chromeRafId !== null) {
            cancelAnimationFrame(this.chromeRafId);
            this.chromeRafId = null;
        }
    }

    private resolveStructure(): void {
        this.toggleEl = this.el.querySelector<HTMLElement>('.navigation-rail__toggle');
        this.itemsEl = this.el.querySelector<HTMLElement>('.navigation-rail__items');
        this.footerEl = this.el.querySelector<HTMLElement>('.navigation-rail__footer');
        /* Ordre DOM : destinations principales puis footer (garde-fou bas). */
        const mainItems = this.itemsEl
            ? Array.from(this.itemsEl.querySelectorAll<HTMLElement>(':scope > .navigation-rail__item'))
                .filter((item) => this.isDestinationItem(item))
            : [];
        const footerItems = this.footerEl
            ? Array.from(this.footerEl.querySelectorAll<HTMLElement>(':scope > .navigation-rail__item'))
                .filter((item) => this.isDestinationItem(item))
            : [];
        this.items = [...mainItems, ...footerItems];
        const container = this.el.closest('.navigation-rail-container') || document.body;
        this.panels = Array.from(container.querySelectorAll<HTMLElement>('.navigation-rail-panel'));
        if (this.panels.length === 0) {
            this.panels = Array.from(container.querySelectorAll<HTMLElement>('.active-page'));
        }
    }

    /**
     * Destinations navigables uniquement — exclut les actions (ex. Paramètres → dialog).
     */
    private isDestinationItem(el: HTMLElement): boolean {
        if (el.getAttribute('data-rail-action') === 'settings') return false;
        if (el.classList.contains('navbar-settings-trigger')) return false;
        return true;
    }

    /**
     * Normalise le footer M3 Expressive : épinglé en bas hors zone scroll,
     * séparation par gap 4px (modèle menu-group) ; divider trait opt-in,
     * plafond footerMaxItems (Paramètres + Crédits + API = 3).
     * @see https://m3.material.io/components/navigation-rail/guidelines
     */
    private ensureFooterStructure(): void {
        const footer = this.el.querySelector<HTMLElement>('.navigation-rail__footer');
        if (!footer) {
            this.footerEl = null;
            return;
        }
        this.footerEl = footer;

        /* Toujours hors de la zone scroll (frère de items-shell / items). */
        if (footer.parentElement !== this.el) {
            this.el.appendChild(footer);
        } else {
            this.el.appendChild(footer);
        }

        const max = NavigationRailSpecs.behaviors.footerMaxItems;
        /* Compte tous les .navigation-rail__item (actions + destinations). */
        const footerItems = Array.from(
            footer.querySelectorAll<HTMLElement>(':scope > .navigation-rail__item')
        );
        if (footerItems.length > max) {
            this.logger.warn(
                `NavigationRail: footer limité à ${max} items (reçu ${footerItems.length}) — surplus ignoré`
            );
            footerItems.slice(max).forEach((item) => item.remove());
        }

        /* Gap par défaut (CSS) ; trait uniquement si footerDividerEnabled === true */
        const dividerEnabled = this.options.footerDividerEnabled === true;
        let divider = footer.querySelector<HTMLElement>(':scope > .navigation-rail__divider');
        const hasItems = footer.querySelectorAll(':scope > .navigation-rail__item').length > 0;
        if (dividerEnabled && hasItems) {
            if (!divider) {
                divider = document.createElement('hr');
                divider.className = 'navigation-rail__divider';
                divider.setAttribute('aria-hidden', 'true');
                footer.insertBefore(divider, footer.firstChild);
            }
        } else if (divider) {
            divider.remove();
        }
    }

    /**
     * Groupe haut (chrome + items) séparé du footer — même modèle que `.menu-group`
     * (deux îlots surface, gap 4px, fond parent visible entre les deux).
     */
    private ensureMainGroupStructure(): void {
        const footer = this.footerEl ?? this.el.querySelector<HTMLElement>('.navigation-rail__footer');
        if (!footer || footer.parentElement !== this.el) {
            this.mainEl = this.el.querySelector<HTMLElement>(':scope > .navigation-rail__main');
            return;
        }

        let main = this.el.querySelector<HTMLElement>(':scope > .navigation-rail__main');
        if (!main) {
            main = document.createElement('div');
            main.className = 'navigation-rail__main';
            const toMove = Array.from(this.el.children).filter((child) => child !== footer);
            this.el.insertBefore(main, footer);
            toMove.forEach((child) => main!.appendChild(child));
        } else if (main.nextElementSibling !== footer) {
            this.el.appendChild(footer);
        }

        /* Tout hors footer doit rester dans __main (shell créé plus tard inclus). */
        Array.from(this.el.children).forEach((child) => {
            if (child !== footer && child !== main) {
                main!.appendChild(child);
            }
        });

        this.mainEl = main;
    }

    /**
     * Destinations épinglées en bas du rail (hors scroll).
     */
    getFooterItems(): HTMLElement[] {
        if (!this.footerEl) return [];
        return Array.from(
            this.footerEl.querySelectorAll<HTMLElement>(':scope > .navigation-rail__item')
        ).filter((item) => this.isDestinationItem(item));
    }

    /**
     * Shell items (scroll) + stack hors rail : scrollbar dans le gutter
     * (même modèle panel-content / docs-layout-scrollbar).
     */
    private setupItemsScrollbar(): void {
        this.teardownItemsScrollbar();
        const items = this.itemsEl ?? this.el.querySelector<HTMLElement>('.navigation-rail__items');
        if (!items) return;
        this.itemsEl = items;

        let shell = items.parentElement;
        if (!shell?.classList.contains('navigation-rail__items-shell')) {
            shell = document.createElement('div');
            shell.className = 'navigation-rail__items-shell';
            items.parentNode?.insertBefore(shell, items);
            shell.appendChild(items);
        }
        this.itemsShellEl = shell;

        /* Footer hors shell (garde-fou bas, jamais dans le scroll). */
        const footer = this.footerEl ?? this.el.querySelector<HTMLElement>('.navigation-rail__footer');
        if (footer) {
            if (shell.contains(footer)) {
                this.el.appendChild(footer);
            } else if (footer.parentElement === this.el) {
                this.el.appendChild(footer);
            }
            this.footerEl = footer;
        }

        /* Retirer une éventuelle scrollbar encore nichée dans le rail / shell */
        this.el.querySelectorAll('.navigation-rail__scrollbar').forEach((node) => {
            node.remove();
        });

        let stack = this.el.parentElement;
        if (!stack?.classList.contains('navigation-rail-stack')) {
            stack = document.createElement('div');
            stack.className = 'navigation-rail-stack';
            this.el.parentNode?.insertBefore(stack, this.el);
            stack.appendChild(this.el);
        }
        this.stackEl = stack;

        const inDocsFlow = !!this.el.closest('.docs-shell__body, #docs-shell-body');
        if (!inDocsFlow && getComputedStyle(this.el).position === 'fixed') {
            stack.classList.add('navigation-rail-stack--fixed');
        } else {
            stack.classList.remove('navigation-rail-stack--fixed');
        }

        let scrollbar = stack.querySelector<HTMLElement>(':scope > .navigation-rail__scrollbar');
        if (!scrollbar) {
            const created = ScrollbarManager.createRail(
                'navigation-rail__scrollbar',
                'navigation-rail__scrollbar-thumb',
            );
            scrollbar = created.rail;
            stack.appendChild(scrollbar);
        }

        this.scrollbarHandle = ScrollbarManager.bind({
            scroll: items,
            railHost: stack,
            rail: scrollbar,
            thumbClass: 'navigation-rail__scrollbar-thumb',
            geometry: 'none',
            placement: 'internal',
            removeRailOnDestroy: false,
            enlargeOnInteraction: true,
            enlargeFactor: 2,
        });
        requestAnimationFrame(() => this.scrollbarHandle?.refresh());
    }

    private teardownItemsScrollbar(): void {
        this.scrollbarHandle?.destroy();
        this.scrollbarHandle = null;
    }

    private setupAria(): void {
        const ariaLabel = LocaleManager.t('navigationRail.ariaLabel');
        setAriaAttributes(this.el, {
            role: 'navigation',
            label: ariaLabel || null,
        });
        // Destinations de navigation (pas un tablist) : boutons natifs + aria-current.
        this.items.forEach((item, i) => {
            removeAriaAttribute(item, 'role');
            removeAriaAttribute(item, 'selected');
            removeAriaAttribute(item, 'setsize');
            removeAriaAttribute(item, 'posinset');
            setAriaAttribute(item, 'current', i === this.options.activeIndex ? 'page' : null);
        });
    }

    private setupEvents(): void {
        this.items.forEach((item, index) => {
            this.registerEvent(item, 'click', (e) => this.handleItemClick(e, index));
            this.registerEvent(item, 'keydown', (e) => this.handleKeydown(e as KeyboardEvent, index));
        });
        if (this.toggleEl) {
            this.registerEvent(this.toggleEl, 'click', (e) => {
                e.preventDefault();
                this.setExpanded(!this.options.expanded);
            });
        }
    }

    private handleItemClick(e: Event, index: number): void {
        const item = this.items[index];
        if (item.hasAttribute('aria-disabled') || item.getAttribute('aria-disabled') === 'true') return;
        e.preventDefault();
        const destination = item.getAttribute('data-destination') ?? index;
        const href = item.getAttribute('data-href');

        if (index === this.options.activeIndex) {
            this.options.onClick?.(destination, index);
            return;
        }

        this.setActiveIndex(index, true);

        if (this.hrefNavTimer !== null) {
            clearTimeout(this.hrefNavTimer);
            this.hrefNavTimer = null;
        }

        if (href) {
            const navDelayMs =
                typeof NavigationRailSpecs.animations.pill.navDelayMs === 'number'
                    ? NavigationRailSpecs.animations.pill.navDelayMs
                    : 140;
            this.hrefNavTimer = window.setTimeout(() => {
                this.hrefNavTimer = null;
                this.options.onClick?.(destination, index);
            }, navDelayMs);
            return;
        }

        this.options.onClick?.(destination, index);
    }

    private handleKeydown(e: KeyboardEvent, index: number): void {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.handleItemClick(e, index);
            return;
        }
        if (e.key === 'ArrowDown' && index < this.items.length - 1) {
            e.preventDefault();
            this.items[index + 1].focus();
            this.setActiveIndex(index + 1, true);
            return;
        }
        if (e.key === 'ArrowUp' && index > 0) {
            e.preventDefault();
            this.items[index - 1].focus();
            this.setActiveIndex(index - 1, true);
            return;
        }
        if (e.key === 'Home') {
            e.preventDefault();
            this.items[0].focus();
            this.setActiveIndex(0, true);
            return;
        }
        if (e.key === 'End') {
            e.preventDefault();
            const last = this.items.length - 1;
            this.items[last].focus();
            this.setActiveIndex(last, true);
        }
    }

    setActiveIndex(index: number, notify = true): void {
        const safeIndex = Math.max(0, Math.min(index, this.items.length - 1));
        const previousIndex = this.options.activeIndex;
        const indexChanged = safeIndex !== previousIndex;
        if (!indexChanged && !notify) {
            this.items.forEach((item, i) => {
                const active = i === safeIndex;
                item.classList.toggle('navigation-rail__item--active', active);
                item.classList.remove('navigation-rail__item--pill-anim');
                setAriaAttribute(item, 'current', active ? 'page' : null);
            });
            return;
        }
        this.options.activeIndex = safeIndex;

        const target = this.items[safeIndex];
        const runPillAnim = indexChanged;

        this.items.forEach((item, i) => {
            const active = i === safeIndex;
            item.classList.toggle('navigation-rail__item--active', active);
            item.classList.remove('navigation-rail__item--pill-anim');
            setAriaAttribute(item, 'current', active ? 'page' : null);
        });

        if (runPillAnim && target) {
            this.restartPillEnter(target);
        } else if (this.pillAnimTimer !== null) {
            clearTimeout(this.pillAnimTimer);
            this.pillAnimTimer = null;
        }

        const destId = this.items[safeIndex]?.getAttribute('data-destination');
        this.panels.forEach((panel) => {
            const dataDest = panel.getAttribute('data-destination');
            const idMatch = panel.id && destId && panel.id === `page-${destId}`;
            const dataMatch = dataDest !== null && dataDest === destId;
            const show = !!idMatch || !!dataMatch;
            panel.classList.toggle('navigation-rail-panel--active', show);
            panel.classList.toggle('show', show);
        });

        if (notify) {
            const destination = this.items[safeIndex]?.getAttribute('data-destination') ?? safeIndex;
            this.options.onChange?.(destination, safeIndex);
        }
    }

    /**
     * Relance l’entrée pill (spatial-fast) — même pattern que NavigationBar.
     */
    private restartPillEnter(item: HTMLElement): void {
        const pill = item.querySelector<HTMLElement>('.navigation-rail__pill');
        item.classList.remove('navigation-rail__item--pill-anim');
        if (pill) {
            pill.style.setProperty('animation', 'none');
            void pill.offsetWidth;
            pill.style.removeProperty('animation');
        }
        item.classList.add('navigation-rail__item--pill-anim');
        this.schedulePillAnimCleanup(item);
    }

    private schedulePillAnimCleanup(item: HTMLElement | undefined): void {
        if (!item) return;

        if (this.pillAnimTimer !== null) {
            clearTimeout(this.pillAnimTimer);
            this.pillAnimTimer = null;
        }

        const pillDurationMs = NavigationRailSpecs.animations.pill.duration ?? 350;
        this.pillAnimTimer = window.setTimeout(() => {
            item.classList.remove('navigation-rail__item--pill-anim');
            this.pillAnimTimer = null;
        }, pillDurationMs + 40);
    }

    getActiveIndex(): number {
        return this.options.activeIndex;
    }

    getId(): string {
        return this.options.id ?? this.el.id ?? '';
    }

    setExpanded(expanded: boolean): void {
        if (this.options.expanded === expanded) return;

        if (expanded) {
            this.options.onOpenStart?.(this.el);
        } else {
            this.options.onCloseStart?.(this.el);
        }

        this.options.expanded = expanded;
        this.applyExpanded();
        this.options.onToggleExpand?.(expanded, this);
    }

    getExpanded(): boolean {
        return this.options.expanded;
    }

    /**
     * Mode d’expansion actuel (`push` | `modal`).
     */
    getExpandMode(): 'push' | 'modal' {
        return this.isModalExpand() ? 'modal' : 'push';
    }

    public override destroy(): void {
        this.clearExpandTimers();
        this.teardownModalChrome();
        this.teardownItemsScrollbar();
        if (this.pillAnimTimer !== null) {
            clearTimeout(this.pillAnimTimer);
            this.pillAnimTimer = null;
        }
        if (this.hrefNavTimer !== null) {
            clearTimeout(this.hrefNavTimer);
            this.hrefNavTimer = null;
        }
        this.logger.info('NavigationRail destroyed');
        super.destroy();
    }
}

/**
 * Custom Element <k3ui-navigation-rail>
 */
if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-navigation-rail')) {
    customElements.define('k3ui-navigation-rail', class extends HTMLElement {
        connectedCallback(): void {
            if (!this.hasAttribute('data-initialized')) {
                this.setAttribute('data-initialized', 'true');
            }
        }
        disconnectedCallback(): void {
            const instance = NavigationRail.getInstance(this);
            if (instance && typeof instance.destroy === 'function') {
                instance.destroy();
            }
        }
    });
}
