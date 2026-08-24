/**
 * @fileoverview Composant MenuContext pour K3UI
 * @description Affiche un Menu K3UI au clic droit (n’importe où selon `scope`)
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { toComponentClassDef } from '../types/components/component-base';
import type { MenuContextOptions, MenuItem } from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { setAriaAttributes, setAriaAttribute } from '../utils/dom/aria';
import { LoggerManager, LocaleManager, Mouse } from '../core/managers';
import { ManagerFactory } from '../core/factories';
import { getMenuContextDefaults, MenuContextSpecs } from '../specs/components/menu-context.specs';
import { Menu } from './Menu';
import { setMenuTriggerElement } from '../types/dom/k3ui-menu-element';

interface KMenuContextHTMLElement extends HTMLElement {
    K_MenuContext?: MenuContext;
}

const _defaults: MenuContextOptions = getMenuContextDefaults();

const HOST_SELECTOR = '.menu-context, k3ui-menu-context';

/**
 * Classe MenuContext — menu contextuel (clic droit) reposant sur Menu
 */
export class MenuContext extends Component<MenuContextOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    private logger: LoggerManager;
    private mouseInstance: Mouse | null = null;
    private menuInstance: Menu | null = null;
    private menuHost: HTMLElement | null = null;
    private anchor: HTMLElement | null = null;
    private openEndTimeout: ReturnType<typeof setTimeout> | null = null;

    /**
     * Options par défaut du composant
     */
    static get defaults(): MenuContextOptions {
        return { ..._defaults };
    }

    /**
     * Obtient l'instance associée à un élément
     * @param el Élément HTML
     */
    static getInstance(el: HTMLElement): MenuContext | null {
        if (!el) {
            return null;
        }
        return (el as KMenuContextHTMLElement).K_MenuContext ?? null;
    }

    /**
     * Initialise un ou plusieurs MenuContext
     * @param els Élément(s) ou sélecteur
     * @param options Options partielles
     */
    static init(
        els: KElement | InitElements<KElement> | string,
        options: Partial<MenuContextOptions> = {}
    ): MenuContext[] {
        return Component.init(els, options, toComponentClassDef(MenuContext)) as MenuContext[];
    }

    /**
     * @param el Élément hôte
     * @param options Options de configuration
     */
    constructor(el: HTMLElement, options: Partial<MenuContextOptions> = {}) {
        super(el, options, toComponentClassDef(MenuContext));
        this.logger = ManagerFactory.getLoggerManager('[MenuContext]');

        const fromHtml = MenuContext.readAttributes(el);
        const items =
            (options.items && options.items.length > 0)
                ? options.items
                : (fromHtml.items && fromHtml.items.length > 0)
                    ? fromHtml.items
                    : MenuContext.parseItemsFromDom(el);

        this.options = {
            ...MenuContext.defaults,
            ...options,
            ...fromHtml,
            items,
        } as MenuContextOptions;

        (el as KMenuContextHTMLElement).K_MenuContext = this;
        this.init();
    }

    /**
     * Lit les attributs data-* de l’hôte
     */
    private static readAttributes(el: HTMLElement): Partial<MenuContextOptions> {
        const out: Partial<MenuContextOptions> = {};
        const get = (name: string) => el.getAttribute('data-' + name);

        const scope = get('scope');
        if (scope === 'element' || scope === 'document') {
            out.scope = scope;
        }

        const prevent = get('prevent-default');
        if (prevent === 'true' || prevent === 'false') {
            out.preventDefault = prevent === 'true';
        }

        const allowNative = get('allow-native-on-editable');
        if (allowNative === 'true' || allowNative === 'false') {
            out.allowNativeOnEditable = allowNative === 'true';
        }

        const enabled = get('enabled');
        if (enabled === 'true' || enabled === 'false') {
            out.enabled = enabled === 'true';
        }

        const placement = get('placement');
        if (placement) {
            out.placement = placement as MenuContextOptions['placement'];
        }

        const exclude = get('exclude-selector');
        if (exclude != null && exclude !== '') {
            out.excludeSelector = exclude;
        }

        const itemsRaw = get('items');
        if (itemsRaw) {
            try {
                const parsed = JSON.parse(itemsRaw) as MenuItem[];
                if (Array.isArray(parsed)) {
                    out.items = parsed;
                }
            } catch {
                console.warn('[MenuContext] data-items JSON invalide');
            }
        }

        return out;
    }

    /**
     * Parse les enfants `menu-item` de l’hôte
     */
    private static parseItemsFromDom(el: HTMLElement): MenuItem[] {
        const nodes = el.querySelectorAll(':scope > menu-item');
        if (nodes.length === 0) {
            return [];
        }

        const parseOne = (element: HTMLElement): MenuItem => {
            const id = element.getAttribute('data-id') || undefined;
            const disabled = element.hasAttribute('data-disabled') || element.hasAttribute('disabled');
            const divider =
                element.getAttribute('data-type') === 'divider' ||
                element.hasAttribute('data-divider');
            const icon = element.getAttribute('data-icon') || undefined;
            const label =
                element.getAttribute('data-label') ||
                element.textContent?.trim() ||
                '';

            const childItems = Array.from(element.querySelectorAll(':scope > menu-item')).map(
                (child) => parseOne(child as HTMLElement)
            );

            const item: MenuItem = {
                id,
                label,
                text: label,
                icon,
                disabled,
            };

            if (divider) {
                item.divider = true;
                item.type = 'divider';
            }

            if (childItems.length > 0) {
                item.items = childItems;
                item.hasSubmenu = true;
            }

            return item;
        };

        return Array.from(nodes).map((n) => parseOne(n as HTMLElement));
    }

    /**
     * Initialise le composant
     */
    private init(): void {
        this.el.classList.add('menu-context');
        setAriaAttributes(this.el, {
            role: MenuContextSpecs.accessibility.role,
            label: LocaleManager.t('menuContext.ariaLabel'),
        });

        this.createAnchorAndMenu();
        this.attachContextListener();

        this.logger.info('MenuContext initialized');
    }

    /**
     * Crée l’ancre invisible et l’instance Menu
     */
    private createAnchorAndMenu(): void {
        this.anchor = document.createElement('div');
        this.anchor.className = 'menu-context__anchor';
        this.anchor.setAttribute('aria-hidden', 'true');
        this.anchor.tabIndex = -1;
        Object.assign(this.anchor.style, {
            position: 'fixed',
            width: '1px',
            height: '1px',
            margin: '0',
            padding: '0',
            border: '0',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            clipPath: 'inset(50%)',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: '-1',
            left: '0',
            top: '0',
        });
        document.body.appendChild(this.anchor);

        this.menuHost = document.createElement('div');
        this.menuHost.className = 'menu-context__menu no-autoinit';
        this.menuHost.setAttribute('aria-hidden', 'true');
        this.el.appendChild(this.menuHost);

        setMenuTriggerElement(this.menuHost, this.anchor);

        // Préférer `new Menu` pour un hôte interne (évite ambiguïté Menu.init overload)
        this.menuInstance = new Menu(this.menuHost, {
            items: this.options.items ?? [],
            placement: this.options.placement ?? 'bottom-start',
            triggerToggle: false,
            restoreFocus: false,
            closeOnClick: true,
            onItemClick: (item, menuId) => {
                this.options.onItemClick?.(item, menuId);
            },
            onOpenStart: () => {
                this.options.onOpenStart?.(this.el);
                this.el.dispatchEvent(new CustomEvent('onOpenStart', { bubbles: true }));
            },
            onCloseStart: () => {
                this.options.onCloseStart?.(this.el);
                this.el.dispatchEvent(new CustomEvent('onCloseStart', { bubbles: true }));
            },
            onCloseEnd: () => {
                this.options.onCloseEnd?.(this.el);
                this.el.dispatchEvent(new CustomEvent('onCloseEnd', { bubbles: true }));
            },
        });
    }

    /**
     * Attache le listener contextmenu via Mouse
     */
    private attachContextListener(): void {
        if (this.mouseInstance) {
            this.mouseInstance.destroy();
            this.mouseInstance = null;
        }

        const target: HTMLElement | Document =
            this.options.scope === 'element' ? this.el : document;

        this.mouseInstance = new Mouse({
            target,
            enabled: this.options.enabled !== false,
            onContextMenu: (event, x, y) => {
                this.handleContextMenu(event, x, y);
            },
        });
    }

    /**
     * Traite le clic droit
     */
    private handleContextMenu(event: MouseEvent, x: number, y: number): void {
        if (this.options.enabled === false) {
            return;
        }

        const target = event.target as Node | null;
        if (!target || !(target instanceof Element)) {
            return;
        }

        if (this.options.scope === 'document') {
            const closestHost = target.closest(HOST_SELECTOR) as HTMLElement | null;
            if (closestHost && closestHost !== this.el) {
                return;
            }
        }

        if (this.options.excludeSelector) {
            try {
                if (target.closest(this.options.excludeSelector)) {
                    return;
                }
            } catch {
                this.logger.warn('excludeSelector invalide', this.options.excludeSelector);
            }
        }

        if (this.options.allowNativeOnEditable !== false && this.isEditableTarget(target)) {
            return;
        }

        if (this.options.preventDefault !== false) {
            event.preventDefault();
            event.stopPropagation();
        }

        this.openAt(x, y);
    }

    /**
     * Indique si la cible est un champ éditable
     */
    private isEditableTarget(el: Element): boolean {
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
            return !el.readOnly && !el.disabled;
        }
        if (el instanceof HTMLElement && el.isContentEditable) {
            return true;
        }
        return !!el.closest('input:not([readonly]):not([disabled]), textarea:not([readonly]):not([disabled]), [contenteditable="true"]');
    }

    /**
     * Positionne l’ancre aux coordonnées viewport
     */
    private positionAnchor(x: number, y: number): void {
        if (!this.anchor) {
            return;
        }
        this.anchor.style.left = `${Math.round(x)}px`;
        this.anchor.style.top = `${Math.round(y)}px`;
    }

    /**
     * Ouvre le menu aux coordonnées viewport (clientX / clientY)
     * @param x Coordonnée X
     * @param y Coordonnée Y
     */
    public openAt(x: number, y: number): void {
        if (!this.menuInstance) {
            return;
        }

        if (this.openEndTimeout) {
            clearTimeout(this.openEndTimeout);
            this.openEndTimeout = null;
        }

        if (this.menuInstance.isOpen) {
            this.menuInstance.close();
        }

        this.positionAnchor(x, y);

        // Forcer le recalcul layout avant Floating UI
        void this.anchor?.offsetWidth;

        this.menuInstance.open();
        setAriaAttribute(this.el, 'expanded', true);

        const duration = MenuContextSpecs.animations.enter.duration;
        this.openEndTimeout = setTimeout(() => {
            this.openEndTimeout = null;
            this.options.onOpenEnd?.(this.el);
            this.el.dispatchEvent(new CustomEvent('onOpenEnd', { bubbles: true }));
        }, duration);
    }

    /**
     * Ferme le menu contextuel
     */
    public close(): void {
        if (this.openEndTimeout) {
            clearTimeout(this.openEndTimeout);
            this.openEndTimeout = null;
        }
        this.menuInstance?.close();
        setAriaAttribute(this.el, 'expanded', false);
    }

    /**
     * Indique si le menu est ouvert
     */
    public isOpen(): boolean {
        return this.menuInstance?.isOpen ?? false;
    }

    /**
     * Met à jour les items du menu
     * @param items Nouveaux items
     */
    public setItems(items: MenuItem[]): void {
        this.options.items = items;
        this.menuInstance?.setItems(items);
    }

    /**
     * Active ou désactive le gestionnaire de clic droit
     * @param enabled État
     */
    public setEnabled(enabled: boolean): void {
        this.options.enabled = enabled;
        this.mouseInstance?.setEnabled(enabled);
    }

    /**
     * Change la portée d’écoute
     * @param scope 'element' | 'document'
     */
    public setScope(scope: MenuContextOptions['scope']): void {
        this.options.scope = scope;
        this.attachContextListener();
    }

    /**
     * Retourne l’instance Menu sous-jacente
     */
    public getMenu(): Menu | null {
        return this.menuInstance;
    }

    /**
     * Détruit l’instance
     */
    public override destroy(): void {
        if (this.openEndTimeout) {
            clearTimeout(this.openEndTimeout);
            this.openEndTimeout = null;
        }

        this.mouseInstance?.destroy();
        this.mouseInstance = null;

        this.menuInstance?.destroy();
        this.menuInstance = null;

        if (this.anchor?.parentNode) {
            this.anchor.parentNode.removeChild(this.anchor);
        }
        this.anchor = null;

        if (this.menuHost?.parentNode) {
            this.menuHost.parentNode.removeChild(this.menuHost);
        }
        this.menuHost = null;

        if ((this.el as KMenuContextHTMLElement).K_MenuContext === this) {
            delete (this.el as KMenuContextHTMLElement).K_MenuContext;
        }

        this.logger.info('MenuContext destroyed');
        super.destroy();
    }
}

/**
 * Custom Element k3ui-menu-context
 */
if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-menu-context')) {
    customElements.define(
        'k3ui-menu-context',
        class extends HTMLElement {
            connectedCallback(): void {
                if (!this.hasAttribute('data-initialized')) {
                    this.setAttribute('data-initialized', 'true');
                }
            }

            disconnectedCallback(): void {
                const instance = (this as KMenuContextHTMLElement).K_MenuContext;
                if (instance && typeof instance.destroy === 'function') {
                    instance.destroy();
                }
                (this as KMenuContextHTMLElement).K_MenuContext = undefined;
            }
        }
    );
}
