/**
 * @fileoverview Composant Tabs pour K3UI (Material Design 3 Expressive)
 * @description Barre d'onglets avec indicateur et panneaux de contenu
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import type { TabsOptions, TabsDirection } from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { setAriaAttributes, setAriaAttribute, removeAriaAttribute } from '../utils/dom/aria';
import { LoggerManager, IconManager } from '../core/managers';
import { ManagerFactory } from '../core/factories/ManagerFactory';
import { getTabsDefaults } from '../specs/components/tabs.specs';
import { HapticManager } from '../core/managers/HapticManager';
import { getPointerCoords, supportsPointerEvents } from '../utils/dom/pointer';

const _defaults: TabsOptions = getTabsDefaults();

/**
 * Classe Tabs - Barre d'onglets et panneaux selon Material Design 3
 */
export class Tabs extends Component<TabsOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    private logger: LoggerManager;
    private tabBarEl: HTMLElement | null = null;
    private scrollerEl: HTMLElement | null = null;
    private indicatorEl: HTMLElement | null = null;
    private tabsItemsEl: HTMLElement | null = null;
    private tabButtons: HTMLElement[] = [];
    private panels: HTMLElement[] = [];
    private activeIndex: number = 0;
    private touchStartX: number = 0;
    private touchStartY: number = 0;

    static get defaults(): TabsOptions {
        return { ..._defaults };
    }

    static getInstance(el: HTMLElement): Tabs | undefined {
        return Component.getInstance(el) as Tabs | undefined;
    }

    static init(
        els: KElement | InitElements<KElement> | string,
        options: Partial<TabsOptions> = {}
    ): Tabs | Tabs[] {
        return Component.init(els, options, toComponentClassDef(Tabs)) as Tabs | Tabs[];
    }

    constructor(el: HTMLElement, options: Partial<TabsOptions> = {}) {
        super(el, options, toComponentClassDef(Tabs));

        this.logger = ManagerFactory.getLoggerManager('[Tabs]');
        this.options = {
            ...Tabs.defaults,
            ...options,
        };

        const activeOpt = this.options.active;
        this.activeIndex = typeof activeOpt === 'number' ? Math.max(0, activeOpt) : 0;

        if (el.hasAttribute('data-active')) {
            const v = parseInt(el.getAttribute('data-active')!, 10);
            if (!Number.isNaN(v)) this.activeIndex = v;
        }
        if (el.hasAttribute('data-layout-direction')) {
            const dir = el.getAttribute('data-layout-direction');
            if (dir === 'vertical' || dir === 'horizontal') this.options.layoutDirection = dir;
        }
        if (el.hasAttribute('data-indicator-position')) {
            const pos = el.getAttribute('data-indicator-position');
            if (pos === 'normal' || pos === 'reverse') this.options.indicatorPosition = pos;
        }
        if (el.hasAttribute('data-scrollable')) {
            const s = el.getAttribute('data-scrollable');
            if (s === 'auto' || s === 'always' || s === 'none') this.options.scrollable = s;
        }
        const tabBar = el.classList.contains('tabs') ? el : el.querySelector('.tabs');
        if (tabBar && tabBar.hasAttribute('data-layout-direction')) {
            const dir = (tabBar as HTMLElement).getAttribute('data-layout-direction');
            if (dir === 'vertical' || dir === 'horizontal') this.options.layoutDirection = dir;
        }
        if (tabBar && (tabBar as HTMLElement).hasAttribute('data-indicator-position')) {
            const pos = (tabBar as HTMLElement).getAttribute('data-indicator-position');
            if (pos === 'normal' || pos === 'reverse') this.options.indicatorPosition = pos;
        }
        if (el.hasAttribute('data-variant')) {
            const v = el.getAttribute('data-variant');
            if (v === 'primary' || v === 'secondary') this.options.variant = v;
        }
        if (tabBar && (tabBar as HTMLElement).hasAttribute('data-variant')) {
            const v = (tabBar as HTMLElement).getAttribute('data-variant');
            if (v === 'primary' || v === 'secondary') this.options.variant = v;
        }

        this.init();
    }

    private init(): void {
        this.resolveStructure();
        if (!this.tabBarEl || this.tabButtons.length === 0) {
            this.logger.warn('Tabs: structure invalide (aucun .tabs ou .tabs__tab)');
            return;
        }
        this.ensureScrollerAndIndicator();
        this.applyLayoutClasses();
        this.syncPanels();
        this.updateIndicator();
        this.setupAria();
        this.setupEvents();
        this.applyScrollable();
        if (this.tabBarEl && this.options.variant === 'primary') {
            IconManager.processIconsInContainer(this.tabBarEl);
            this.applyPrimaryIconSizes();
            requestAnimationFrame(() => {
                this.updateIndicator();
            });
        }
        this.logger.info('Tabs initialized');
    }

    /**
     * Trouve la barre d'onglets, le conteneur de panneaux et les enfants
     */
    private resolveStructure(): void {
        const root = this.el;
        this.tabBarEl = root.classList.contains('tabs') ? root : (root.querySelector('.tabs') as HTMLElement);
        this.tabsItemsEl = (root.querySelector('.tabs-items') as HTMLElement) ?? null;
        if (!this.tabsItemsEl && root.classList.contains('tabs') && root.nextElementSibling?.classList.contains('tabs-items')) {
            this.tabsItemsEl = root.nextElementSibling as HTMLElement;
        }
        if (!this.tabsItemsEl && root.parentElement) {
            this.tabsItemsEl = root.parentElement.querySelector('.tabs-items') as HTMLElement;
        }

        if (this.tabBarEl) {
            this.scrollerEl = this.tabBarEl.querySelector('.tabs__scroller') as HTMLElement | null;
            const tabs = this.tabBarEl.querySelectorAll('.tabs__tab');
            this.tabButtons = Array.from(tabs) as HTMLElement[];
            this.indicatorEl = this.tabBarEl.querySelector('.tabs__indicator') as HTMLElement | null;
            this.tabButtons.forEach(btn => {
                if (btn.hasAttribute('data-disabled') || btn.hasAttribute('disabled')) {
                    btn.setAttribute('aria-disabled', 'true');
                }
            });
        }

        if (this.tabsItemsEl) {
            const items = this.tabsItemsEl.querySelectorAll('.tabs-item');
            this.panels = Array.from(items) as HTMLElement[];
        }

        if (this.panels.length > 0 && this.activeIndex >= this.panels.length) {
            this.activeIndex = this.panels.length - 1;
        }
        if (this.tabButtons.length > 0 && this.activeIndex >= this.tabButtons.length) {
            this.activeIndex = this.tabButtons.length - 1;
        }
    }

    /**
     * Crée .tabs__scroller et .tabs__indicator si absents
     */
    private ensureScrollerAndIndicator(): void {
        if (!this.tabBarEl) return;

        if (!this.scrollerEl) {
            this.scrollerEl = document.createElement('div');
            this.scrollerEl.className = 'tabs__scroller';
            while (this.tabBarEl.firstChild) {
                this.scrollerEl.appendChild(this.tabBarEl.firstChild);
            }
            this.tabBarEl.appendChild(this.scrollerEl);
            const tabs = this.scrollerEl.querySelectorAll('.tabs__tab');
            this.tabButtons = Array.from(tabs) as HTMLElement[];
        }

        if (!this.indicatorEl && this.scrollerEl) {
            this.indicatorEl = document.createElement('div');
            this.indicatorEl.className = 'tabs__indicator';
            this.indicatorEl.setAttribute('aria-hidden', 'true');
            this.scrollerEl.appendChild(this.indicatorEl);
        }
    }

    /**
     * Met à jour les classes et attributs ARIA des panneaux
     */
    private syncPanels(): void {
        this.panels.forEach((panel, i) => {
            const isActive = i === this.activeIndex;
            panel.classList.toggle('tabs-item--active', isActive);
            panel.hidden = !isActive;
            setAriaAttribute(panel, 'aria-hidden', isActive ? null : 'true');
        });
        this.tabButtons.forEach((btn, i) => {
            const isSelected = i === this.activeIndex;
            btn.classList.toggle('tabs__tab--active', isSelected);
            btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');
            btn.setAttribute('tabindex', isSelected ? '0' : '-1');
        });
    }

    /**
     * Positionne l'indicateur sous l'onglet actif
     */
    private updateIndicator(): void {
        if (!this.indicatorEl || !this.scrollerEl || this.tabButtons.length === 0) return;

        const btn = this.tabButtons[this.activeIndex];
        if (!btn) return;

        const isHorizontal = this.options.layoutDirection !== 'vertical';
        const reverse = this.options.indicatorPosition === 'reverse';
        const size = this.options.indicatorSize;
        const sizeStr = typeof size === 'number' ? `${size}px` : size;

        if (isHorizontal) {
            const isPrimary = this.options.variant === 'primary';
            let widthPx = btn.offsetWidth;
            let leftPx = btn.offsetLeft;
            if (isPrimary) {
                const labelEl = btn.querySelector('.tabs__tab-label') as HTMLElement | null;
                if (labelEl) {
                    const textWidth = this.measureLabelTextWidth(labelEl);
                    widthPx = Math.max(24, Math.floor(textWidth));
                } else {
                    widthPx = Math.max(24, btn.offsetWidth);
                }
                leftPx = btn.offsetLeft + (btn.offsetWidth - widthPx) / 2;
                this.indicatorEl.style.maxWidth = `${widthPx}px`;
                this.indicatorEl.style.height = '3px';
                this.indicatorEl.style.borderRadius = '3px 3px 0 0';
            } else {
                this.indicatorEl.style.maxWidth = '';
                this.indicatorEl.style.height = sizeStr;
                this.indicatorEl.style.borderRadius = '';
            }
            this.indicatorEl.style.width = `${widthPx}px`;
            this.indicatorEl.style.transform = `translateX(${leftPx}px)`;
            this.indicatorEl.style.top = '';
            this.indicatorEl.style.bottom = reverse ? '' : '0';
            this.indicatorEl.style.left = '0';
        } else {
            this.indicatorEl.style.height = `${btn.offsetHeight}px`;
            this.indicatorEl.style.width = sizeStr;
            this.indicatorEl.style.transform = `translateY(${btn.offsetTop}px)`;
            this.indicatorEl.style.left = reverse ? '' : '0';
            this.indicatorEl.style.right = reverse ? '0' : '';
            this.indicatorEl.style.top = '0';
        }

        if (this.options.indicatorColor) {
            this.indicatorEl.style.backgroundColor = this.options.indicatorColor;
        } else if (this.options.activeColor) {
            this.indicatorEl.style.backgroundColor = this.options.activeColor;
        }
    }

    private setupAria(): void {
        if (this.tabBarEl) {
            setAriaAttribute(this.tabBarEl, 'role', 'tablist');
            setAriaAttribute(this.tabBarEl, 'aria-orientation', this.options.layoutDirection === 'vertical' ? 'vertical' : 'horizontal');
        }
        this.tabButtons.forEach((btn, i) => {
            if (!btn.getAttribute('role')) btn.setAttribute('role', 'tab');
            btn.setAttribute('aria-selected', i === this.activeIndex ? 'true' : 'false');
            btn.setAttribute('aria-controls', this.panels[i]?.id || `tabs-panel-${this.id}-${i}`);
            btn.setAttribute('tabindex', i === this.activeIndex ? '0' : '-1');
        });
        this.panels.forEach((panel, i) => {
            if (!panel.getAttribute('role')) panel.setAttribute('role', 'tabpanel');
            const id = panel.id || `tabs-panel-${this.id}-${i}`;
            if (!panel.id) panel.id = id;
            panel.setAttribute('aria-labelledby', this.tabButtons[i]?.id || '');
        });
        this.tabButtons.forEach((btn, i) => {
            if (!btn.id) btn.id = `tabs-tab-${this.id}-${i}`;
            const panel = this.panels[i];
            if (panel) setAriaAttribute(btn, 'aria-controls', panel.id);
        });
    }

    private setupEvents(): void {
        this.tabButtons.forEach((btn, index) => {
            this.registerEvent(btn, 'click', () => this.handleTabClick(index));
            this.registerEvent(btn, 'keydown', (e: Event) => this.handleTabKeydown(e as KeyboardEvent, index));
        });

        if (this.tabsItemsEl && this.options.canSwipe) {
            if (supportsPointerEvents()) {
                this.registerEvent(this.tabsItemsEl, 'pointerdown', (e: Event) => {
                    const pe = e as PointerEvent;
                    if (pe.pointerType === 'mouse' && pe.button !== 0) return;
                    this.handleTouchStart(pe.clientX, pe.clientY);
                });
                this.registerEvent(this.tabsItemsEl, 'pointerup', (e: Event) => {
                    const pe = e as PointerEvent;
                    const { x, y } = getPointerCoords(pe);
                    this.handleTouchEnd(x, y);
                });
                this.registerEvent(this.tabsItemsEl, 'pointercancel', (e: Event) => {
                    const pe = e as PointerEvent;
                    const { x, y } = getPointerCoords(pe);
                    this.handleTouchEnd(x, y);
                });
            } else {
                this.registerEvent(this.tabsItemsEl, 'touchstart', (e: Event) => this.handleTouchStart(e as TouchEvent), { passive: true });
                this.registerEvent(this.tabsItemsEl, 'touchend', (e: Event) => this.handleTouchEnd(e as TouchEvent));
            }
        }

        this.registerEvent(window, 'resize', () => {
            this.updateIndicator();
        });
    }

    private handleTabClick(index: number): void {
        const btn = this.tabButtons[index];
        if (btn?.getAttribute('aria-disabled') === 'true') return;
        if (index !== this.activeIndex) {
            HapticManager.triggerFromOptions(this.options, 'selection');
        }
        this.setActive(index);
        this.options.onClick?.(index);
        this.options.onChange?.(index);
    }

    private handleTabKeydown(e: KeyboardEvent, index: number): void {
        const isHorizontal = this.options.layoutDirection !== 'vertical';
        let next = -1;
        if (isHorizontal) {
            if (e.key === 'ArrowLeft') next = index - 1;
            else if (e.key === 'ArrowRight') next = index + 1;
        } else {
            if (e.key === 'ArrowUp') next = index - 1;
            else if (e.key === 'ArrowDown') next = index + 1;
        }
        if (e.key === 'Home') next = 0;
        if (e.key === 'End') next = this.tabButtons.length - 1;
        if (next >= 0 && next < this.tabButtons.length) {
            e.preventDefault();
            this.setActive(next);
            this.tabButtons[next]?.focus();
        }
    }

    private handleTouchStart(clientXOrEvent: number | TouchEvent, clientY?: number): void {
        if (typeof clientXOrEvent === 'number') {
            this.touchStartX = clientXOrEvent;
            this.touchStartY = clientY ?? 0;
            return;
        }
        this.touchStartX = clientXOrEvent.touches[0].clientX;
        this.touchStartY = clientXOrEvent.touches[0].clientY;
    }

    private handleTouchEnd(clientXOrEvent: number | TouchEvent, clientY?: number): void {
        const endX = typeof clientXOrEvent === 'number' ? clientXOrEvent : clientXOrEvent.changedTouches[0].clientX;
        const endY = typeof clientXOrEvent === 'number' ? (clientY ?? 0) : clientXOrEvent.changedTouches[0].clientY;
        const dx = endX - this.touchStartX;
        const dy = endY - this.touchStartY;
        const isHorizontal = this.options.layoutDirection !== 'vertical';
        const threshold = 50;
        if (isHorizontal && Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy)) {
            if (dx < 0 && this.activeIndex < this.tabButtons.length - 1) {
                this.setActive(this.activeIndex + 1);
            } else if (dx > 0 && this.activeIndex > 0) {
                this.setActive(this.activeIndex - 1);
            }
        }
    }

    private applyLayoutClasses(): void {
        if (!this.tabBarEl) return;
        this.tabBarEl.classList.toggle('tabs--layout-vertical', this.options.layoutDirection === 'vertical');
        this.tabBarEl.classList.toggle('tabs--indicator-reverse', this.options.indicatorPosition === 'reverse');
        this.tabBarEl.classList.toggle('tabs--primary', this.options.variant === 'primary');
        this.tabBarEl.classList.toggle('tabs--secondary', this.options.variant === 'secondary');
    }

    /**
     * Mesure la largeur réelle du texte du label (Range = bounds du texte seul) pour l'indicateur Primary.
     */
    private measureLabelTextWidth(labelEl: HTMLElement): number {
        const first = labelEl.firstChild;
        if (!first) return Math.max(24, labelEl.getBoundingClientRect().width || 24);
        const range = document.createRange();
        range.selectNodeContents(labelEl);
        const rect = range.getBoundingClientRect();
        range.detach();
        const w = rect.width;
        if (w > 0) return w;
        return Math.max(24, labelEl.getBoundingClientRect().width || 24);
    }

    /** Force 24px (24dp) sur les icônes des onglets Primary après IconManager (écrase les styles inline). */
    private applyPrimaryIconSizes(): void {
        if (!this.tabBarEl) return;
        const iconSize = '24px';
        this.tabBarEl.querySelectorAll('.tabs__tab i[name], .tabs__tab [class*="k3ui-icon"]').forEach((el) => {
            const htmlEl = el as HTMLElement;
            htmlEl.style.width = iconSize;
            htmlEl.style.height = iconSize;
        });
    }

    private applyScrollable(): void {
        if (!this.scrollerEl || !this.tabBarEl) return;
        const mode = this.options.scrollable;
        const needScroll = mode === 'always' || (mode === 'auto' && this.tabButtons.length >= 5);
        this.tabBarEl.classList.toggle('tabs--scrollable', needScroll);
        this.scrollerEl.classList.toggle('tabs__scroller--scrollable', needScroll);
    }

    /**
     * Définit l'onglet actif par index
     */
    setActive(index: number | string): void {
        const i = typeof index === 'string' ? parseInt(index, 10) : index;
        if (Number.isNaN(i) || i < 0 || i >= Math.max(this.tabButtons.length, this.panels.length, 1)) return;
        this.activeIndex = i;
        this.syncPanels();
        this.updateIndicator();
        if (this.options.variant === 'primary') {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => this.updateIndicator());
            });
        }
        this.scrollTabIntoView();
        this.options.onChange?.(this.activeIndex);
    }

    /**
     * Retourne l'index de l'onglet actif
     */
    getActive(): number {
        return this.activeIndex;
    }

    /**
     * Fait défiler la barre pour que l'onglet actif soit visible
     */
    private scrollTabIntoView(): void {
        if (!this.scrollerEl || !this.tabBarEl?.classList.contains('tabs--scrollable')) return;
        const btn = this.tabButtons[this.activeIndex];
        if (btn) btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }

    /**
     * Recalcule la position de l'indicateur (à appeler après changement de contenu)
     */
    resize(): void {
        this.updateIndicator();
    }

    public override destroy(): void {
        this.tabBarEl = null;
        this.scrollerEl = null;
        this.indicatorEl = null;
        this.tabsItemsEl = null;
        this.tabButtons = [];
        this.panels = [];
        this.logger.info('Tabs destroyed');
        super.destroy();
    }
}
