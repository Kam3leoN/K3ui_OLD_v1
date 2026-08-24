/**
 * @fileoverview Composant NavigationMenu pour K3UI (Material Design 3 Expressive)
 * @description Menu de navigation hiérarchique — modèle M3E nav-menu (tree, expand/collapse, sélection)
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import type { NavigationMenuOptions } from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { setAriaAttributes, setAriaAttribute, removeAriaAttribute } from '../utils/dom/aria';
import { generateGuid } from '../utils/helpers/guid';
import { LoggerManager, LocaleManager, IconManager } from '../core/managers';
import { ManagerFactory } from '../core/factories/ManagerFactory';
import { getNavigationMenuDefaults } from '../specs/components/navigation-menu.specs';
import { NavigationMenuSpecs } from '../specs/components/navigation-menu.specs';
import { HapticManager } from '../core/managers/HapticManager';

const _defaults: NavigationMenuOptions = getNavigationMenuDefaults();

/** Item interne du menu de navigation */
interface NavMenuItemNode {
    el: HTMLElement;
    row: HTMLElement;
    childrenWrap: HTMLElement | null;
    parent: NavMenuItemNode | null;
    id: string;
    level: number;
}

let _nextItemId = 0;

/**
 * NavigationMenu — menu hiérarchique MD3 Expressive (M3E nav-menu)
 * Rôle tree, navigation clavier aria-activedescendant, expand/collapse, sélection unique feuilles.
 */
export class NavigationMenu extends Component<NavigationMenuOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    private logger: LoggerManager;
    private itemNodes: NavMenuItemNode[] = [];
    private activeItem: NavMenuItemNode | null = null;
    private selectedItem: NavMenuItemNode | null = null;
    private typeaheadBuffer = '';
    private typeaheadTimer: ReturnType<typeof setTimeout> | null = null;
    /** Timers onOpenEnd / onCloseEnd par item (motion spatial M3) */
    private motionEndTimers = new Map<HTMLElement, ReturnType<typeof setTimeout>>();

    static get defaults(): NavigationMenuOptions {
        return { ..._defaults };
    }

    static getInstance(el: HTMLElement): NavigationMenu | undefined {
        return Component.getInstance(el) as NavigationMenu | undefined;
    }

    static init(
        els: KElement | InitElements<KElement> | string,
        options: Partial<NavigationMenuOptions> = {}
    ): NavigationMenu | NavigationMenu[] {
        return Component.init(els, options, toComponentClassDef(NavigationMenu)) as NavigationMenu | NavigationMenu[];
    }

    constructor(el: HTMLElement, options: Partial<NavigationMenuOptions> = {}) {
        super(el, options, toComponentClassDef(NavigationMenu));

        this.logger = ManagerFactory.getLoggerManager('[NavigationMenu]');
        this.options = {
            ...NavigationMenu.defaults,
            ...options,
        };

        if (!this.options.id) this.options.id = generateGuid();
        el.id = el.id || this.options.id;
        el.setAttribute('data-navigation-menu-id', this.options.id);

        this.init();
    }

    private init(): void {
        this.resolveStructure();
        this.setupAria();
        this.setupEvents();
        this.syncInitialState();
        IconManager.processIconsInContainer(this.el);
        this.logger.info('NavigationMenu initialized');
    }

    /** Collecte tous les items `.navigation-menu__item` dans l'ordre DOM */
    private resolveStructure(): void {
        this.itemNodes = [];
        const items = Array.from(this.el.querySelectorAll<HTMLElement>('.navigation-menu__item'));
        items.forEach((itemEl) => {
            const row = itemEl.querySelector<HTMLElement>('.navigation-menu__item-row');
            if (!row) return;

            const childrenWrap = itemEl.querySelector<HTMLElement>('.navigation-menu__item-children');
            if (childrenWrap) {
                this.ensureChildrenClip(childrenWrap);
            }
            const hasChildren = childrenWrap !== null && childrenWrap.querySelector('.navigation-menu__item') !== null;

            itemEl.classList.toggle('navigation-menu__item--has-children', hasChildren);

            let parent: NavMenuItemNode | null = null;
            const parentItemEl = itemEl.parentElement?.closest('.navigation-menu__item');
            if (parentItemEl) {
                parent = this.itemNodes.find((n) => n.el === parentItemEl) ?? null;
            }

            const level = parent ? parent.level + 1 : 1;
            const id = itemEl.id || `navigation-menu-item-${_nextItemId++}`;
            itemEl.id = id;

            const node: NavMenuItemNode = {
                el: itemEl,
                row,
                childrenWrap,
                parent,
                id,
                level,
            };
            this.itemNodes.push(node);
        });
    }

    private syncInitialState(): void {
        for (const node of this.itemNodes) {
            const isOpen = node.el.getAttribute('data-open') === 'true' || node.el.classList.contains('navigation-menu__item--open');
            const isSelected = node.el.getAttribute('data-selected') === 'true' || node.el.classList.contains('navigation-menu__item--selected');
            const isDisabled = node.el.getAttribute('data-disabled') === 'true' || node.el.classList.contains('navigation-menu__item--disabled');

            this.applyOpenState(node, isOpen, false);
            if (isSelected && !this.hasChildItems(node)) {
                this.applySelectState(node, true, false);
            }
            if (isDisabled) {
                this.applyDisabledState(node, true);
            }
        }

        const firstVisible = this.getVisibleItems().find((n) => !this.isDisabled(n));
        if (firstVisible) {
            this.setActiveItem(firstVisible, false);
        }
    }

    private setupAria(): void {
        const ariaLabel = LocaleManager.t('navigationMenu.ariaLabel');
        setAriaAttributes(this.el, {
            role: NavigationMenuSpecs.accessibility.role,
            label: ariaLabel || null,
        });
        this.el.setAttribute('tabindex', '0');

        for (const node of this.itemNodes) {
            this.updateItemAria(node);
        }
    }

    private updateItemAria(node: NavMenuItemNode): void {
        const hasChildren = this.hasChildItems(node);
        const isOpen = node.el.classList.contains('navigation-menu__item--open');
        const isSelected = node.el.classList.contains('navigation-menu__item--selected');
        const disabled = this.isDisabled(node);

        setAriaAttributes(node.row, {
            role: NavigationMenuSpecs.accessibility.itemRole,
            disabled: disabled || null,
            expanded: hasChildren ? isOpen : null,
            current: !hasChildren && isSelected ? 'page' : null,
        });

        if (node.childrenWrap && hasChildren) {
            setAriaAttribute(node.childrenWrap, 'label', node.row.textContent?.trim() || 'Submenu');
            setAriaAttribute(node.childrenWrap, 'hidden', isOpen ? false : true);
        }
    }

    /**
     * Garantit un clip overflow pour l’animation spatial 0fr→1fr (M3 Expressive)
     * @param childrenWrap Conteneur `.navigation-menu__item-children`
     */
    private ensureChildrenClip(childrenWrap: HTMLElement): void {
        let clip = childrenWrap.querySelector<HTMLElement>(':scope > .navigation-menu__item-clip');
        if (clip) return;

        clip = document.createElement('div');
        clip.className = 'navigation-menu__item-clip';
        while (childrenWrap.firstChild) {
            clip.appendChild(childrenWrap.firstChild);
        }
        childrenWrap.appendChild(clip);
    }

    /** Clip associé à un item parent */
    private getItemClip(node: NavMenuItemNode): HTMLElement | null {
        return node.childrenWrap?.querySelector<HTMLElement>(':scope > .navigation-menu__item-clip') ?? null;
    }

    /** prefers-reduced-motion : pas de spring, callbacks immédiats */
    private prefersReducedMotion(): boolean {
        return typeof window !== 'undefined'
            && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    /** Annule le timer de fin de motion d’un item */
    private clearMotionEndTimer(el: HTMLElement): void {
        const timer = this.motionEndTimers.get(el);
        if (timer !== undefined) {
            clearTimeout(timer);
            this.motionEndTimers.delete(el);
        }
    }

    private setupEvents(): void {
        this.registerEvent(this.el, 'keydown', this.handleKeyDown.bind(this));
        this.registerEvent(this.el, 'click', this.handleClick.bind(this));
        this.registerEvent(this.el, 'focus', this.handleFocus.bind(this));
    }

    private handleFocus(): void {
        if (!this.activeItem) {
            const first = this.getVisibleItems().find((n) => !this.isDisabled(n));
            if (first) this.setActiveItem(first, false);
        }
        this.updateActiveDescendant();
    }

    private handleClick(e: Event): void {
        const target = e.target as HTMLElement;
        const row = target.closest<HTMLElement>('.navigation-menu__item-row');
        if (!row || !this.el.contains(row)) return;

        const node = this.itemNodes.find((n) => n.row === row);
        if (!node || this.isDisabled(node)) return;

        e.preventDefault();
        this.setIndicatorOriginFromPointer(row, e as MouseEvent);
        this.activateItemInteraction(node);
    }

    /**
     * Origine horizontale de la pilule au point d’appui (M3E selection-indicator)
     * @param row Ligne d’item
     * @param e Événement pointeur
     */
    private setIndicatorOriginFromPointer(row: HTMLElement, e: MouseEvent): void {
        // Clics synthétiques (Keyboard / .click()) sans coordonnées → origine center
        if (e.clientX === 0 && e.clientY === 0) return;
        const rect = row.getBoundingClientRect();
        if (rect.width <= 0) return;
        const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
        row.style.setProperty('--navigation-menu-indicator-origin-x', `${x}px`);
    }

    private activateItemInteraction(node: NavMenuItemNode): void {
        this.setActiveItem(node, false);

        if (this.hasChildItems(node)) {
            HapticManager.triggerFromOptions(this.options, 'selection');
            this.toggle(node);
            return;
        }

        HapticManager.triggerFromOptions(this.options, 'selection');
        this.select(node);
        const link = node.row.querySelector<HTMLAnchorElement>('a[href]');
        if (link) {
            link.click();
        }
        this.options.onItemSelect?.(node.el, this);
    }

    private handleKeyDown(e: KeyboardEvent): void {
        if (!this.activeItem) return;

        const node = this.activeItem;
        if (this.isDisabled(node)) return;

        switch (e.key) {
            case 'Enter':
            case ' ':
                e.preventDefault();
                this.activateItemInteraction(node);
                break;

            case '*':
                e.preventDefault();
                this.expand(undefined, true);
                break;

            case 'ArrowLeft':
                e.preventDefault();
                this.handleArrowLeft(node);
                break;

            case 'ArrowRight':
                e.preventDefault();
                this.handleArrowRight(node);
                break;

            case 'ArrowDown':
                e.preventDefault();
                this.moveActive(1);
                break;

            case 'ArrowUp':
                e.preventDefault();
                this.moveActive(-1);
                break;

            case 'Home':
                e.preventDefault();
                this.moveActiveToFirst();
                break;

            case 'End':
                e.preventDefault();
                this.moveActiveToLast();
                break;

            default:
                if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                    this.handleTypeahead(e.key);
                }
                break;
        }
    }

    private handleArrowLeft(node: NavMenuItemNode): void {
        const isRtl = getComputedStyle(this.el).direction === 'rtl';
        if (!isRtl) {
            if (this.hasChildItems(node) && node.el.classList.contains('navigation-menu__item--open')) {
                this.collapse([node]);
            } else if (node.parent) {
                this.setActiveItem(node.parent);
            }
        } else if (this.hasChildItems(node) && !node.el.classList.contains('navigation-menu__item--open')) {
            this.expand([node]);
        }
    }

    private handleArrowRight(node: NavMenuItemNode): void {
        const isRtl = getComputedStyle(this.el).direction === 'rtl';
        if (isRtl) {
            if (this.hasChildItems(node) && node.el.classList.contains('navigation-menu__item--open')) {
                this.collapse([node]);
            } else if (node.parent) {
                this.setActiveItem(node.parent);
            }
        } else if (this.hasChildItems(node) && !node.el.classList.contains('navigation-menu__item--open')) {
            this.expand([node]);
        }
    }

    private handleTypeahead(char: string): void {
        if (this.typeaheadTimer !== null) {
            clearTimeout(this.typeaheadTimer);
        }
        this.typeaheadBuffer += char.toLowerCase();
        this.typeaheadTimer = setTimeout(() => {
            this.typeaheadBuffer = '';
            this.typeaheadTimer = null;
        }, 500);

        const visible = this.getVisibleItems().filter((n) => !this.isDisabled(n));
        const startIdx = this.activeItem ? visible.indexOf(this.activeItem) + 1 : 0;
        const search = (from: number): NavMenuItemNode | null => {
            for (let i = 0; i < visible.length; i++) {
                const idx = (from + i) % visible.length;
                const label = visible[idx].row.querySelector('.navigation-menu__item-label')?.textContent?.trim().toLowerCase() ?? '';
                if (label.startsWith(this.typeaheadBuffer)) return visible[idx];
            }
            return null;
        };
        const match = search(startIdx) ?? search(0);
        if (match) this.setActiveItem(match);
    }

    private moveActive(delta: number): void {
        const visible = this.getVisibleItems().filter((n) => !this.isDisabled(n));
        if (visible.length === 0) return;
        const currentIdx = this.activeItem ? visible.indexOf(this.activeItem) : -1;
        let nextIdx = currentIdx + delta;
        if (nextIdx < 0) nextIdx = visible.length - 1;
        if (nextIdx >= visible.length) nextIdx = 0;
        this.setActiveItem(visible[nextIdx]);
    }

    private moveActiveToFirst(): void {
        const visible = this.getVisibleItems().filter((n) => !this.isDisabled(n));
        if (visible[0]) this.setActiveItem(visible[0]);
    }

    private moveActiveToLast(): void {
        const visible = this.getVisibleItems().filter((n) => !this.isDisabled(n));
        const last = visible[visible.length - 1];
        if (last) this.setActiveItem(last);
    }

    /**
     * Définit l'item actif (focus roving via aria-activedescendant)
     * @param node Item à activer
     * @param scrollIntoView Faire défiler l'item dans la vue
     */
    setActiveItem(node: NavMenuItemNode | HTMLElement, scrollIntoView = true): void {
        const resolved = node instanceof HTMLElement
            ? this.itemNodes.find((n) => n.el === node) ?? null
            : node;
        if (!resolved || this.isDisabled(resolved)) return;

        this.activeItem = resolved;
        this.updateActiveDescendant();

        if (scrollIntoView) {
            resolved.row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }

    private updateActiveDescendant(): void {
        if (this.activeItem) {
            setAriaAttribute(this.el, 'activedescendant', this.activeItem.id);
        } else {
            removeAriaAttribute(this.el, 'activedescendant');
        }
    }

    /**
     * Sélectionne un item feuille (désélectionne les autres)
     * @param node Item à sélectionner
     */
    select(node: NavMenuItemNode | HTMLElement): void {
        const resolved = node instanceof HTMLElement
            ? this.itemNodes.find((n) => n.el === node) ?? null
            : node;
        if (!resolved || this.hasChildItems(resolved) || this.isDisabled(resolved)) return;

        if (this.selectedItem && this.selectedItem !== resolved) {
            this.clearParentSelectionOutsideBranch(this.selectedItem, resolved);
            this.applySelectState(this.selectedItem, false, false);
        }

        this.applySelectState(resolved, true, true);
        this.propagateParentSelection(resolved);
        this.options.onChange?.(resolved.el, this);
    }

    /**
     * Retire la sélection des parents qui ne sont plus dans la branche cible
     * (évite le flash de la pilule master lors d’un switch entre frères)
     */
    private clearParentSelectionOutsideBranch(from: NavMenuItemNode, to: NavMenuItemNode): void {
        const keep = new Set<NavMenuItemNode>();
        for (let p = to.parent; p; p = p.parent) {
            keep.add(p);
        }
        let parent = from.parent;
        while (parent) {
            if (!keep.has(parent)) {
                parent.el.classList.remove('navigation-menu__item--selected');
                parent.el.setAttribute('data-selected', 'false');
            }
            parent = parent.parent;
        }
    }

    private propagateParentSelection(node: NavMenuItemNode): void {
        let parent = node.parent;
        while (parent) {
            parent.el.classList.add('navigation-menu__item--selected');
            parent.el.setAttribute('data-selected', 'true');
            parent = parent.parent;
        }
    }

    private applySelectState(node: NavMenuItemNode, selected: boolean, notify: boolean): void {
        node.el.classList.toggle('navigation-menu__item--selected', selected);
        node.el.setAttribute('data-selected', String(selected));
        if (selected) {
            this.selectedItem = node;
        } else if (this.selectedItem === node) {
            this.selectedItem = null;
        }
        this.updateItemAria(node);
        if (notify && selected) {
            this.options.onChange?.(node.el, this);
        }
    }

    /**
     * Bascule l'état ouvert/fermé d'un item
     * @param node Item à basculer
     */
    toggle(node: NavMenuItemNode | HTMLElement): void {
        const resolved = node instanceof HTMLElement
            ? this.itemNodes.find((n) => n.el === node) ?? null
            : node;
        if (!resolved || !this.hasChildItems(resolved)) return;

        const isOpen = resolved.el.classList.contains('navigation-menu__item--open');
        if (isOpen) {
            this.collapse([resolved]);
        } else {
            this.expand([resolved]);
        }
    }

    /**
     * Ouvre un ou plusieurs items
     * @param items Items à ouvrir (tous si omis)
     * @param descendants Ouvrir aussi tous les descendants
     */
    expand(items?: NavMenuItemNode[] | HTMLElement[], descendants = false): void {
        const targets = items
            ? items.map((i) => (i instanceof HTMLElement ? this.itemNodes.find((n) => n.el === i) : i)).filter(Boolean) as NavMenuItemNode[]
            : this.itemNodes;

        for (const node of targets) {
            if (!this.hasChildItems(node)) continue;
            this.applyOpenState(node, true, true);
            if (descendants) {
                const childItems = this.getChildItems(node);
                this.expand(childItems.map((n) => n.el), true);
            }
        }
    }

    /**
     * Ferme un ou plusieurs items
     * @param items Items à fermer (tous si omis)
     * @param descendants Fermer aussi tous les descendants
     */
    collapse(items?: NavMenuItemNode[] | HTMLElement[], descendants = false): void {
        const targets = items
            ? items.map((i) => (i instanceof HTMLElement ? this.itemNodes.find((n) => n.el === i) : i)).filter(Boolean) as NavMenuItemNode[]
            : this.itemNodes;

        for (const node of targets) {
            if (!this.hasChildItems(node)) continue;
            if (descendants) {
                const childItems = this.getChildItems(node);
                this.collapse(childItems.map((n) => n.el), true);
            }
            this.applyOpenState(node, false, true);
        }

        if (this.activeItem && !this.isVisible(this.activeItem)) {
            for (let parent = this.activeItem.parent; parent; parent = parent.parent) {
                if (this.isVisible(parent)) {
                    this.setActiveItem(parent);
                    break;
                }
            }
        }
    }

    private applyOpenState(node: NavMenuItemNode, open: boolean, notify: boolean): void {
        const wasOpen = node.el.classList.contains('navigation-menu__item--open');
        const clip = this.getItemClip(node);

        if (wasOpen === open) {
            clip?.classList.toggle('navigation-menu__item-clip--visible', open);
            return;
        }

        this.clearMotionEndTimer(node.el);
        const reduced = this.prefersReducedMotion();

        if (notify) {
            if (open) {
                this.options.onOpenStart?.(node.el);
                this.options.onItemOpen?.(node.el, this);
            } else {
                this.options.onCloseStart?.(node.el);
                this.options.onItemClose?.(node.el, this);
            }
        }

        if (open) {
            node.el.classList.add('navigation-menu__item--open');
            node.el.setAttribute('data-open', 'true');
            this.updateItemAria(node);

            const reveal = (): void => {
                clip?.classList.add('navigation-menu__item-clip--visible');
            };

            if (notify && !reduced) {
                requestAnimationFrame(reveal);
            } else {
                reveal();
            }

            if (notify) {
                const duration = reduced ? 0 : NavigationMenuSpecs.animations.expandDurationMs;
                this.motionEndTimers.set(
                    node.el,
                    setTimeout(() => {
                        this.motionEndTimers.delete(node.el);
                        this.options.onOpenEnd?.(node.el);
                    }, duration)
                );
            }
            return;
        }

        clip?.classList.remove('navigation-menu__item-clip--visible');
        node.el.classList.remove('navigation-menu__item--open');
        node.el.setAttribute('data-open', 'false');
        this.updateItemAria(node);

        if (notify) {
            const duration = reduced ? 0 : NavigationMenuSpecs.animations.collapseDurationMs;
            this.motionEndTimers.set(
                node.el,
                setTimeout(() => {
                    this.motionEndTimers.delete(node.el);
                    this.options.onCloseEnd?.(node.el);
                }, duration)
            );
        }
    }

    private applyDisabledState(node: NavMenuItemNode, disabled: boolean): void {
        node.el.classList.toggle('navigation-menu__item--disabled', disabled);
        node.el.setAttribute('data-disabled', String(disabled));
        node.row.toggleAttribute('disabled', disabled);
        this.updateItemAria(node);
        if (disabled) {
            const childItems = this.getChildItems(node);
            childItems.forEach((child) => this.applyDisabledState(child, true));
        }
    }

    /** Retourne l'item sélectionné ou null */
    getSelectedItem(): HTMLElement | null {
        return this.selectedItem?.el ?? null;
    }

    /** Retourne l'identifiant du menu */
    getId(): string {
        return this.options.id ?? this.el.id ?? '';
    }

    /** Indique si l'item possède des enfants */
    hasChildItems(node: NavMenuItemNode | HTMLElement): boolean {
        const el = node instanceof HTMLElement ? node : node.el;
        return el.classList.contains('navigation-menu__item--has-children');
    }

    private getChildItems(node: NavMenuItemNode): NavMenuItemNode[] {
        if (!node.childrenWrap) return [];
        return this.itemNodes.filter((n) => node.childrenWrap?.contains(n.el) && n.parent === node);
    }

    private isDisabled(node: NavMenuItemNode): boolean {
        return node.el.classList.contains('navigation-menu__item--disabled');
    }

    private isVisible(node: NavMenuItemNode): boolean {
        let current: NavMenuItemNode | null = node;
        while (current) {
            if (current.parent && !current.parent.el.classList.contains('navigation-menu__item--open')) {
                return false;
            }
            current = current.parent;
        }
        return true;
    }

    private getVisibleItems(): NavMenuItemNode[] {
        return this.itemNodes.filter((n) => this.isVisible(n));
    }

    public override destroy(): void {
        if (this.typeaheadTimer !== null) {
            clearTimeout(this.typeaheadTimer);
            this.typeaheadTimer = null;
        }
        this.motionEndTimers.forEach((timer) => clearTimeout(timer));
        this.motionEndTimers.clear();
        this.itemNodes = [];
        this.activeItem = null;
        this.selectedItem = null;
        this.logger.info('NavigationMenu destroyed');
        super.destroy();
    }
}

/**
 * Custom Element <k3ui-navigation-menu>
 */
if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-navigation-menu')) {
    customElements.define('k3ui-navigation-menu', class extends HTMLElement {
        connectedCallback(): void {
            if (!this.hasAttribute('data-initialized')) {
                this.setAttribute('data-initialized', 'true');
            }
        }
        disconnectedCallback(): void {
            const instance = NavigationMenu.getInstance(this);
            if (instance && typeof instance.destroy === 'function') {
                instance.destroy();
            }
        }
    });
}
