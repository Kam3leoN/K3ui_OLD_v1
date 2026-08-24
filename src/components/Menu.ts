/**
 * K3UI Menu Component
 * Composant de menu en cascade basé sur Material Design 3
 * Custom Element: <k3ui-menu>
 *
 * @summary Menu avec sous-menus en cascade
 * @element k3ui-menu
 *
 * @event onItemClick - Élément de menu sélectionné
 * @event onOpenStart - Début de l'ouverture du menu
 * @event onOpenEnd - Fin de l'ouverture du menu
 * @event onCloseStart - Début de la fermeture du menu
 * @event onCloseEnd - Fin de la fermeture du menu
 */

import { OpenableComponent } from '../core/base/OpenableComponent';
import { createK3UIElementClass } from '../core/base/K3UIElement';
import { MenuOptions, MenuItem } from '../types/components';
import { PriorityLevel } from '../types/base';
import { KElement, InitElements } from '../types/base';
import { toComponentClassDef } from '../types/components/component-base';
import type { K3uiMenuContainerElement, K3uiMenuElement } from '../types/dom/k3ui-menu-element';
import { LoggerManager, IconManager } from '../core/managers';
import { Mouse, Keyboard } from '../core/managers';
import { setAriaAttribute } from '../utils/dom';
import { eventListenerManager } from '../core/managers/EventListenerManager';
import {
    computePosition,
    flip,
    shift,
    size,
    offset,
    autoUpdate,
    type Placement,
    type ComputePositionConfig,
} from '../utils/floating';
import { getMenuDefaults, MenuSpecs } from '../specs/components/menu.specs';
import { HapticManager } from '../core/managers/HapticManager';
import { escapeHtml, sanitizeHtmlFragment } from '../utils/dom/sanitize';
import { getPreferReducedMotion } from '../utils/accessibility/reducedMotion';

/** Références CSS M3 motion — spatial/effects fast (enter/exit menu) */
const MENU_M3_SPATIAL_DURATION = 'var(--md-sys-motion-spatial-fast-duration)';
const MENU_M3_SPATIAL_EASING = 'var(--md-sys-motion-spatial-fast-easing)';
const MENU_M3_EFFECTS_DURATION = 'var(--md-sys-motion-effects-fast-duration)';
const MENU_M3_EFFECTS_EASING = 'var(--md-sys-motion-effects-fast-easing)';

/**
 * Options par défaut du composant Menu
 * @description Extrait depuis les specs pour garantir la cohérence
 */
const _defaults: MenuOptions = getMenuDefaults();

/**
 * Classe du composant Menu
 * @class Menu
 * @extends Component<MenuOptions>
 * @implements Openable
 */
export class Menu extends OpenableComponent<MenuOptions> {
    /** Logger statique pour la classe Menu */
    private static _logger = LoggerManager.create('[Menu]');

    /** Liste statique des instances de menu */
    static _menus: Menu[] = [];

    /** Si le menu est ouvert */
    isOpen: boolean;

    /** Indique si le contenu du menu est scrollable */
    isScrollable: boolean;

    /** Index de l'élément actuellement focalisé dans le menu */
    focusedIndex: number;

    /** Map des menus ouverts par ID */
    private openMenus: Map<string, boolean> = new Map();

    /** Map des sous-menus ouverts par ID */
    private openSubmenus: Map<string, boolean> = new Map();

    /** Map des positions des sous-menus */
    private submenuPositions: Map<string, 'left' | 'right'> = new Map();

    /** Sous-menus qui viennent d'être ouverts (pour l'animation) */
    private newlyOpenedSubmenus: Set<string> = new Set();

    /** Élément conteneur du menu */
    private menuContainer: HTMLElement | null = null;

    /** Élément trigger du menu */
    private triggerElement: HTMLElement | null = null;

    /** Niveau de priorité du composant */
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    /** Gestionnaires d'événements bindés */
    private _boundHandleClick?: (e: MouseEvent) => void;
    private _boundHandleClickOutside?: (e: MouseEvent) => void;
    private _boundHandleMenuClick?: (e: MouseEvent) => void;
    private _boundHandleMenuMouseLeave?: (e: MouseEvent) => void;
    private _boundHandleDocumentMouseMove?: (e: MouseEvent) => void;
    private _triggerMouseInstance?: Mouse;
    private _boundHandleMenuContainerMouseEnter?: () => void;
    private _boundHandleMenuContainerMouseLeave?: (e: MouseEvent) => void;
    private _boundHandleMenuPointerOver?: (e: PointerEvent) => void;
    private _boundHandleMenuPointerOut?: (e: PointerEvent) => void;
    private _boundHandleMenuFocusIn?: (e: FocusEvent) => void;
    /** Item visuellement actif (hover souris ou focus clavier) — un seul à la fois */
    private _activeVisualItem: HTMLElement | null = null;
    private _activeVisualSource: 'pointer' | 'keyboard' | null = null;
    /** Le pointeur a priorité sur le focus clavier jusqu'au prochain cycle clavier */
    private _pointerInputActive = false;
    private _closeTimeout?: number;
    private _animateMenuOutTimeout?: number;
    private _submenuCloseTimeouts: Map<string, number> = new Map();
    private _submenuOpenTimeouts: Map<string, number> = new Map();
    private _lastPointerCoords: { x: number; y: number } = { x: 0, y: 0 };

    /** Fonctions de cleanup pour les event listeners */
    private _eventCleanups: (() => void)[] = [];
    private _keyboardInstance?: Keyboard;
    private _boundHandleKeydown?: (e: KeyboardEvent) => void;
    private _lastScrollTime?: number;
    private _scrollAnimationFrameId?: number;
    private _resizeAnimationFrameId?: number;
    private _eventListenerCleanups: (() => void)[] = [];
    /** Fonction de cleanup pour autoUpdate de Floating UI */
    private _floatingCleanup: (() => void) | null = null;

    /**
     * @constructor
     * @param {HTMLElement} el - L'élément racine du composant
     * @param {Partial<MenuOptions>} options - Options de configuration
     */
    constructor(el: HTMLElement, options: Partial<MenuOptions> = {}) {
        const itemsFromOptions = options.items;
        const onItemClickFromOptions = options.onItemClick;

        super(el, options, toComponentClassDef(Menu));

        Menu._menus.push(this);

        this.isOpen = false;
        this.isScrollable = false;
        this.focusedIndex = -1;

        const htmlOptions = Menu.readAttributes(el);
        const itemsFromParentAfterMerge = this.options.items;

        const htmlOptionsWithoutItems = { ...htmlOptions };
        delete htmlOptionsWithoutItems.items;
        delete htmlOptionsWithoutItems.onItemClick;

        this.options = {
            ...this.options,
            ...htmlOptionsWithoutItems
        };

        if (onItemClickFromOptions && typeof onItemClickFromOptions === 'function') {
            this.options.onItemClick = onItemClickFromOptions;
        }

        if (itemsFromOptions !== undefined && itemsFromOptions !== null && itemsFromOptions.length > 0) {
            this.options.items = itemsFromOptions;
        } else if (htmlOptions.items && htmlOptions.items.length > 0) {
            this.options.items = htmlOptions.items;
        } else if (itemsFromParentAfterMerge && itemsFromParentAfterMerge.length > 0) {
            this.options.items = itemsFromParentAfterMerge;
        }

        this.init();
    }

    /**
     * Récupère l'instance du menu associée à un élément
     * @param {HTMLElement} el
     * @returns {Menu}
     */
    static getInstance(el: HTMLElement): Menu | undefined {
        return OpenableComponent.getInstance(el) as Menu | undefined;
    }

    /**
     * Récupère les options par défaut
     * @returns {MenuOptions}
     */
    static get defaults(): MenuOptions {
        return _defaults;
    }

    /**
     * Parse récursivement un élément menu-item et tous ses enfants
     * @param {HTMLElement} element - Élément à parser
     * @param {number} depth - Profondeur actuelle
     * @returns {MenuItem}
     */
    private static parseMenuItemElement(element: HTMLElement, depth: number = 0): MenuItem {
        const id = element.getAttribute('data-id') || `item-depth-${depth}`;

        let label = element.getAttribute('data-label');
        if (!label) {
            const clone = element.cloneNode(true) as HTMLElement;
            clone.querySelectorAll('i').forEach(i => i.remove());
            clone.querySelectorAll('menu-item').forEach(mi => mi.remove());
            label = clone.textContent?.trim() || '';
        }

        let icon = element.getAttribute('data-leading-icon') || element.getAttribute('data-icon') || '';
        if (!icon) {
            const iconElement = element.querySelector('i.leading-icon') || element.querySelector('i[name]');
            if (iconElement) {
                const hasFolder = iconElement.hasAttribute('folder');
                const iconType = iconElement.getAttribute('type') || 'classic';
                const iconCustom = iconElement.getAttribute('custom');
                const iconSize = iconElement.getAttribute('size') || 'sm';
                const iconName = iconElement.getAttribute('name') || '';

                if (hasFolder || iconType !== 'classic' || iconCustom || iconSize !== 'sm' || iconElement.classList.contains('leading-icon') || iconElement.classList.contains('trailing-icon')) {
                    icon = iconElement.outerHTML;
                } else {
                    icon = iconName;
                }
            }
        }

        const trailingText = element.getAttribute('data-trailing-text') || '';
        let trailingIcon = element.getAttribute('data-trailing-icon') || '';

        if (!trailingIcon) {
            const trailingIconElement = element.querySelector('i.trailing-icon');
            if (trailingIconElement) {
                const hasFolder = trailingIconElement.hasAttribute('folder');
                const iconType = trailingIconElement.getAttribute('type') || 'classic';
                const iconCustom = trailingIconElement.getAttribute('custom');
                const iconSize = trailingIconElement.getAttribute('size') || 'sm';
                const iconName = trailingIconElement.getAttribute('name') || '';

                if (hasFolder || iconType !== 'classic' || iconCustom || iconSize !== 'sm') {
                    trailingIcon = trailingIconElement.outerHTML;
                } else {
                    trailingIcon = iconName;
                }
            }
        }
        const disabled = element.hasAttribute('data-disabled') || element.hasAttribute('disabled');
        const hasGap = element.classList.contains('gap') || element.hasAttribute('data-gap');

        const childMenuItems = Array.from(element.children).filter(
            child => child.tagName.toLowerCase() === 'menu-item' || child.classList.contains('menu-item')
        );
        const hasSubmenu = element.hasAttribute('data-has-submenu') || childMenuItems.length > 0;

        const item: MenuItem = {
            id,
            label,
            icon: icon || undefined,
            trailingText: trailingText || undefined,
            trailingIcon: trailingIcon || undefined,
            disabled: disabled || undefined,
            hasSubmenu: hasSubmenu ? true : undefined,
        };

        if (hasGap) {
            item.gap = true;
        }

        if (hasSubmenu && childMenuItems.length > 0) {
            item.items = childMenuItems.map(child =>
                this.parseMenuItemElement(child as HTMLElement, depth + 1)
            );
        }

        return item;
    }

    /**
     * Parse les items de menu depuis le HTML du custom element
     * @param {HTMLElement} el - Élément racine
     * @returns {MenuItem[]}
     */
    private static parseItemsFromHTML(el: HTMLElement): MenuItem[] {
        const items: MenuItem[] = [];
        const children = Array.from(el.children);

        for (const child of children) {
            if (child.getAttribute('slot') === 'trigger') {
                continue;
            }

            if (child.tagName.toLowerCase() === 'menu-divider' || child.classList.contains('menu-divider')) {
                const id = child.getAttribute('data-id') || `divider-${items.length}`;
                const dividerType = child.getAttribute('data-divider') || 'gap';
                items.push({ id, type: 'divider', dividerType });
                continue;
            }

            if (child.tagName.toLowerCase() === 'menu-item' || child.classList.contains('menu-item')) {
                const item = this.parseMenuItemElement(child as HTMLElement, 0);
                items.push(item);
            }
        }

        return items;
    }

    /**
         * Lit les attributs HTML et les convertit en options
         * @private
         * @static
         * @param {HTMLElement} el - Élément source
         * @returns {Partial<MenuOptions>}
         */
    private static readAttributes(el: HTMLElement): Partial<MenuOptions> {
        const options: Partial<MenuOptions> = {};

        if (el.hasAttribute('data-items')) {
            try {
                const items = JSON.parse(el.getAttribute('data-items') || '[]');
                options.items = items;
            } catch (e) {
                // Erreur silencieuse
            }
        } else {
            const htmlItems = Menu.parseItemsFromHTML(el);
            if (htmlItems.length > 0) {
                options.items = htmlItems;
            }
        }

        if (el.hasAttribute('data-placement')) {
            const placement = el.getAttribute('data-placement');
            const validPlacements = ['auto', 'top', 'top-start', 'top-end', 'bottom', 'bottom-start', 'bottom-end', 'right', 'right-start', 'right-end', 'left', 'left-start', 'left-end'];
            if (placement && validPlacements.includes(placement)) {
                options.placement = placement as MenuOptions['placement'];
            }
        }

        if (el.hasAttribute('data-cover')) {
            options.cover = el.getAttribute('data-cover') === 'true';
        }

        if (!options.placement && el.hasAttribute('data-position')) {
            const position = el.getAttribute('data-position');
            if (position === 'top') {
                options.placement = 'top-start';
            } else if (position === 'bottom') {
                options.placement = 'bottom-start';
            } else if (position === 'left') {
                options.placement = 'left-start';
            } else if (position === 'right') {
                options.placement = 'right-start';
            } else if (position === 'auto') {
                options.placement = 'auto';
            }
        }

        if (el.hasAttribute('data-submenu-position')) {
            const submenuPosition = el.getAttribute('data-submenu-position');
            if (['auto', 'left', 'right'].includes(submenuPosition || '')) {
                options.submenuPosition = submenuPosition as MenuOptions['submenuPosition'];
            }
        }

        if (el.hasAttribute('data-hover')) {
            options.hover = el.getAttribute('data-hover') === 'true';
        }

        if (el.hasAttribute('data-close-on-click')) {
            options.closeOnClick = el.getAttribute('data-close-on-click') !== 'false';
        }
        if (el.hasAttribute('data-trigger-toggle')) {
            options.triggerToggle = el.getAttribute('data-trigger-toggle') !== 'false';
        }
        if (el.hasAttribute('data-restore-focus')) {
            options.restoreFocus = el.getAttribute('data-restore-focus') !== 'false';
        }

        if (el.hasAttribute('data-enable-animations')) {
            options.enableAnimations = el.getAttribute('data-enable-animations') !== 'false';
        }

        if (el.hasAttribute('data-auto-focus')) {
            options.autoFocus = el.getAttribute('data-auto-focus') !== 'false';
        }

        if (el.hasAttribute('data-in-duration')) {
            const inDuration = parseInt(el.getAttribute('data-in-duration') || '200', 10);
            if (!isNaN(inDuration)) {
                options.inDuration = inDuration;
            }
        }

        if (el.hasAttribute('data-out-duration')) {
            const outDuration = parseInt(el.getAttribute('data-out-duration') || '150', 10);
            if (!isNaN(outDuration)) {
                options.outDuration = outDuration;
            }
        }

        return options;
    }

    /**
     * Initialise une ou plusieurs instances de Menu
     * @param {HTMLElement | InitElements<KElement>} els - Éléments à initialiser
     * @param {Partial<MenuOptions>} options - Options de configuration
     * @returns {Menu | Menu[]}
     */
    static override init(els: string, options?: Partial<MenuOptions>): Menu[];
    static override init(els: HTMLElement, options?: Partial<MenuOptions>): Menu;
    static override init(els: InitElements<KElement>, options?: Partial<MenuOptions>): Menu[];
    static override init(
        els: string | HTMLElement | InitElements<KElement>,
        options: Partial<MenuOptions> = {}
    ): Menu | Menu[] {
        if (typeof els === 'string') {
            return Menu.init(document.querySelectorAll<HTMLElement>(els), options);
        }
        if (els instanceof Element) {
            const existingFromReg = Menu.getInstance(els as HTMLElement);
            if (els.tagName.toLowerCase() === 'k3ui-menu' && existingFromReg) {
                const existing = existingFromReg;
                if (options.items && options.items.length > 0) {
                    existing.options.items = options.items;
                    if (existing.isOpen) {
                        existing.render();
                    }
                }
                if (options.onItemClick && typeof options.onItemClick === 'function') {
                    existing.options.onItemClick = options.onItemClick;
                }
                return existing;
            }

            const existing = Menu.getInstance(els as HTMLElement);
            if (existing) {
                if (options.items && options.items.length > 0) {
                    existing.options.items = options.items;
                    if (existing.isOpen) {
                        existing.render();
                    }
                }
                if (options.onItemClick && typeof options.onItemClick === 'function') {
                    existing.options.onItemClick = options.onItemClick;
                }
                return existing;
            }
            return new Menu(els as HTMLElement, options);
        } else if (!!els && els.length) {
            const instances = [];
            for (let i = 0; i < els.length; i++) {
                const el = els[i] as HTMLElement;
                const existingMenu = Menu.getInstance(el);
                if (el.tagName.toLowerCase() === 'k3ui-menu' && existingMenu) {
                    instances.push(existingMenu);
                } else {
                    const existing = Menu.getInstance(el);
                    if (existing) {
                        instances.push(existing);
                    } else {
                        instances.push(new Menu(el, options));
                    }
                }
            }
            return instances;
        }
        return [];
    }

    /**
         * Initialise le composant
         * @private
         */
    private init(): void {
        // 1. Configuration initiale du conteneur
        if (this.options.menuEl) {
            this.menuContainer = this.options.menuEl as HTMLElement;
            // Force reset des styles pour éviter les interférences immédiates
            this.menuContainer.style.display = 'none';
            this.menuContainer.style.transform = 'none';
            this._convertSimpleMenuItems();

            // Récupération du trigger
            this.triggerElement = (this.el as K3uiMenuElement).__triggerElement ?? null;
            if (!this.triggerElement) {
                const targetId = this.menuContainer.getAttribute('id');
                if (targetId) {
                    const trigger = document.querySelector(`[data-target="${targetId}"]`) as HTMLElement;
                    if (trigger) this.triggerElement = trigger;
                }
            }
            if (!this.triggerElement) this.triggerElement = this.el;
        } else {
            // Création dynamique
            this.triggerElement = (this.el as K3uiMenuElement).__triggerElement ||
                this.el.querySelector('[slot="trigger"]') ||
                this.el.firstElementChild as HTMLElement;

            if (!this.triggerElement) return;

            this.menuContainer = document.createElement('div');
            this.menuContainer.className = 'menu-container';
            this.menuContainer.style.overflow = 'visible';
            // Ajouter un data-menu-id pour permettre à Select.ts de retrouver le container
            // quand il est déplacé dans le body
            if (this.el.id) {
                this.menuContainer.setAttribute('data-menu-id', this.el.id);
            }
            this.el.appendChild(this.menuContainer);
        }

        setAriaAttribute(this.el, 'expanded', false);
        if (this.triggerElement) {
            setAriaAttribute(this.triggerElement, 'haspopup', 'menu');
            setAriaAttribute(this.triggerElement, 'expanded', false);
            if (this.menuContainer) {
                if (!this.menuContainer.id) {
                    this.menuContainer.id = 'menu-' + (this.el.id || 'k3ui-menu-' + Math.random().toString(36).slice(2, 11));
                }
                setAriaAttribute(this.triggerElement, 'controls', this.menuContainer.id);
            }
        }
        if (!this.options.menuEl) {
            this.el.setAttribute('role', 'menu');
            this.render();
        }

        // 2. LOGIQUE D'ALIGNEMENT PAR DÉFAUT
        // Si aucun placement n'est forcé par les options JS
        if (!this.options.placement) {
            let detectedPlacement: MenuOptions['placement'] = 'bottom-start';

            // Vérification des classes utilitaires sur le trigger ou le parent
            // Supporte: floating--right, select--right, menu--right
            const checkElement = (el: HTMLElement | null) =>
                el && (el.classList.contains('floating--right') ||
                    el.classList.contains('select--right') ||
                    el.classList.contains('menu--right'));

            const isRightAligned =
                checkElement(this.triggerElement) ||
                checkElement(this.el) ||
                checkElement(this.triggerElement?.parentElement as HTMLElement);

            // Si une classe "right" est trouvée, on force bottom-end (aligné à droite)
            if (isRightAligned) {
                detectedPlacement = 'bottom-end';
            }

            this.options.placement = detectedPlacement;
        }

        this._setupEventHandlers();
    }

    /**
     * Configure les gestionnaires d'événements principaux
     * @returns {void}
     */
    private _setupEventHandlers(): void {
        if (!this._boundHandleClick) {
            this._boundHandleClick = this._handleClick.bind(this);
            this._boundHandleClickOutside = this._handleClickOutside.bind(this);
            this._boundHandleMenuClick = this._handleMenuClick.bind(this);
            this._boundHandleKeydown = this._handleKeydown.bind(this);
        }

        if (this.triggerElement && this._boundHandleClick && this._boundHandleKeydown) {
            // Hôte (Select / Autocomplete) : triggerToggle=false → pas de toggle Menu sur le trigger
            if (this.options.triggerToggle !== false) {
                this._eventCleanups.push(
                    eventListenerManager.add(this.triggerElement, 'click', this._boundHandleClick as EventListener)
                );
                this._eventCleanups.push(
                    eventListenerManager.add(this.triggerElement, 'keydown', this._boundHandleKeydown as EventListener)
                );
                Menu._logger.debug('Trigger toggle events attached');
            } else {
                Menu._logger.debug('Trigger toggle disabled (managed by host)');
            }
        }

        if (this.options.hover && this.triggerElement) {
            if (this._triggerMouseInstance) {
                this._triggerMouseInstance.destroy();
                this._triggerMouseInstance = undefined;
            }

            this._triggerMouseInstance = new Mouse({
                target: this.triggerElement,
                enabled: true,
                onMouseEnter: () => {
                    if (this.options.hover && this._triggerMouseInstance && !this.isOpen) {
                        this.open();
                    }
                },
                onMouseLeave: (e: MouseEvent) => {
                    if (this.isOpen && this.menuContainer && this.triggerElement) {
                        const relatedTarget = e.relatedTarget as HTMLElement;
                        const isLeavingToMenu = relatedTarget && this.menuContainer.contains(relatedTarget);
                        const isLeavingToTrigger = relatedTarget && (relatedTarget === this.triggerElement || this.triggerElement.contains(relatedTarget));

                        if (!isLeavingToMenu && !isLeavingToTrigger) {
                            setTimeout(() => {
                                if (this.isOpen && this.menuContainer && this.triggerElement) {
                                    const elementAtPoint = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
                                    const isMouseOverMenu = elementAtPoint && this.menuContainer.contains(elementAtPoint);
                                    const isMouseOverTrigger = elementAtPoint && (elementAtPoint === this.triggerElement || this.triggerElement.contains(elementAtPoint));

                                    if (!isMouseOverMenu && !isMouseOverTrigger) {
                                        this.close();
                                    }
                                }
                            }, 150);
                        }
                    }
                }
            });
        } else {
            if (this._triggerMouseInstance) {
                this._triggerMouseInstance.destroy();
                this._triggerMouseInstance = undefined;
            }
        }

        if (this.menuContainer && this._boundHandleMenuClick) {
            this._eventCleanups.push(
                eventListenerManager.add(this.menuContainer, 'click', this._boundHandleMenuClick as EventListener)
            );
        }

        if (this.options.hover && this.menuContainer) {
            if (this._boundHandleMenuContainerMouseEnter) {
                this.menuContainer.removeEventListener('mouseenter', this._boundHandleMenuContainerMouseEnter);
            }
            if (this._boundHandleMenuContainerMouseLeave) {
                this.menuContainer.removeEventListener('mouseleave', this._boundHandleMenuContainerMouseLeave);
            }

            this._boundHandleMenuContainerMouseEnter = () => {
                if (!this.isOpen) {
                    this.open();
                }
            };
            this._boundHandleMenuContainerMouseLeave = (e: MouseEvent) => {
                if (this.isOpen && this.triggerElement) {
                    const relatedTarget = e.relatedTarget as HTMLElement;
                    const isLeavingToTrigger = relatedTarget && (relatedTarget === this.triggerElement || this.triggerElement.contains(relatedTarget));

                    if (!isLeavingToTrigger) {
                        setTimeout(() => {
                            if (this.isOpen && this.triggerElement) {
                                const elementAtPoint = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
                                const isMouseOverTrigger = elementAtPoint && (elementAtPoint === this.triggerElement || this.triggerElement.contains(elementAtPoint));

                                if (!isMouseOverTrigger) {
                                    this.close();
                                }
                            }
                        }, 150);
                    }
                }
            };

            this._eventCleanups.push(
                eventListenerManager.add(this.menuContainer, 'mouseenter', this._boundHandleMenuContainerMouseEnter)
            );
            this._eventCleanups.push(
                eventListenerManager.add(this.menuContainer, 'mouseleave', this._boundHandleMenuContainerMouseLeave as EventListener)
            );
        }

        if (this.menuContainer) {
            this._boundHandleMenuPointerOver = this._handleMenuPointerOver.bind(this);
            this._boundHandleMenuPointerOut = this._handleMenuPointerOut.bind(this);
            this._boundHandleMenuFocusIn = this._handleMenuFocusIn.bind(this);
            this._eventCleanups.push(
                eventListenerManager.add(this.menuContainer, 'pointerover', this._boundHandleMenuPointerOver as EventListener)
            );
            this._eventCleanups.push(
                eventListenerManager.add(this.menuContainer, 'pointerout', this._boundHandleMenuPointerOut as EventListener)
            );
            this._eventCleanups.push(
                eventListenerManager.add(this.menuContainer, 'focusin', this._boundHandleMenuFocusIn as EventListener)
            );
        }

        if (this._boundHandleKeydown) {
            this._keyboardInstance = new Keyboard({
                target: document,
                enabled: true,
                capture: true,
                onKeyDown: (event: KeyboardEvent, key: string) => {
                    if (key === 'Escape' && this.isOpen) {
                        event.preventDefault();
                        event.stopPropagation();
                        this.close();
                    } else if ((key === 'Enter' || key === ' ') && !this.isOpen && event.target === this.el) {
                        event.preventDefault();
                        this.open();
                    }
                }
            });

            if (this.el) {
                this._eventCleanups.push(
                    eventListenerManager.add(this.el, 'keydown', this._boundHandleKeydown as EventListener)
                );
            }
        }

        if (this._boundHandleClickOutside) {
            this._eventCleanups.push(
                eventListenerManager.add(document, 'click', this._boundHandleClickOutside as EventListener, true)
            );
        }

        Menu._logger.debug('All events attached');
    }

    /**
     * Configure les gestionnaires temporaires (activés lors de l'ouverture)
     * @returns {void}
     */
    private _setupTemporaryEventHandlers(): void {
        if (!this._boundHandleMenuMouseLeave) {
            this._boundHandleMenuMouseLeave = this._handleMenuMouseLeave.bind(this);
        }

        if (this.menuContainer && this._boundHandleMenuMouseLeave) {
            this._eventCleanups.push(
                eventListenerManager.add(this.menuContainer, 'mouseleave', this._boundHandleMenuMouseLeave as EventListener)
            );
        }

        if (this.menuContainer && this._handleMenuKeydown) {
            this._eventCleanups.push(
                eventListenerManager.add(this.menuContainer, 'keydown', this._handleMenuKeydown as EventListener)
            );
        }

        if (!this._boundHandleDocumentMouseMove) {
            this._boundHandleDocumentMouseMove = this._handleDocumentMouseMove.bind(this);
        }
        if (this._boundHandleDocumentMouseMove) {
            this._eventCleanups.push(
                eventListenerManager.add(document, 'mousemove', this._boundHandleDocumentMouseMove as EventListener, true)
            );
        }
    }

    /**
     * Supprime les gestionnaires temporaires
     * @returns {void}
     */
    private _removeTemporaryEventHandlers(): void {
        if (this._floatingCleanup) {
            this._floatingCleanup();
            this._floatingCleanup = null;
        }

        if (this.menuContainer && this._boundHandleMenuMouseLeave) {
            this.menuContainer.removeEventListener('mouseleave', this._boundHandleMenuMouseLeave);
        }

        if (this._boundHandleDocumentMouseMove) {
            document.removeEventListener('mousemove', this._boundHandleDocumentMouseMove, true);
        }
    }

    /**
     * Supprime tous les gestionnaires d'événements
     * @returns {void}
     */
    private _removeEventHandlers(): void {
        if (this.triggerElement) {
            this.triggerElement.removeEventListener('click', this._boundHandleClick!);
            this.triggerElement.removeEventListener('keydown', this._boundHandleKeydown!);
        }

        if (this._triggerMouseInstance) {
            this._triggerMouseInstance.destroy();
            this._triggerMouseInstance = undefined;
        }

        if (this.menuContainer) {
            if (this._boundHandleMenuContainerMouseEnter) {
                this.menuContainer.removeEventListener('mouseenter', this._boundHandleMenuContainerMouseEnter);
                this._boundHandleMenuContainerMouseEnter = undefined;
            }
            if (this._boundHandleMenuContainerMouseLeave) {
                this.menuContainer.removeEventListener('mouseleave', this._boundHandleMenuContainerMouseLeave);
                this._boundHandleMenuContainerMouseLeave = undefined;
            }
        }

        if (this.menuContainer) {
            this.menuContainer.removeEventListener('click', this._boundHandleMenuClick!);

            if (this._boundHandleMenuPointerOver) {
                this.menuContainer.removeEventListener('pointerover', this._boundHandleMenuPointerOver as EventListener);
                this._boundHandleMenuPointerOver = undefined;
            }
            if (this._boundHandleMenuPointerOut) {
                this.menuContainer.removeEventListener('pointerout', this._boundHandleMenuPointerOut as EventListener);
                this._boundHandleMenuPointerOut = undefined;
            }
            if (this._boundHandleMenuFocusIn) {
                this.menuContainer.removeEventListener('focusin', this._boundHandleMenuFocusIn as EventListener);
                this._boundHandleMenuFocusIn = undefined;
            }
        }

        if (this._keyboardInstance) {
            this._keyboardInstance.destroy();
            this._keyboardInstance = undefined;
        }

        if (this.el && this._boundHandleKeydown) {
            this.el.removeEventListener('keydown', this._boundHandleKeydown);
        }

        document.removeEventListener('click', this._boundHandleClickOutside!, true);
        this._removeTemporaryEventHandlers();
    }

    /**
     * Gestionnaire de clic sur le trigger
     * @param {MouseEvent} e
     * @returns {void}
     */
    private _handleClick = (e: MouseEvent): void => {
        e.preventDefault();
        e.stopPropagation();

        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    };

    /**
     * Indique si l’événement cible le menu, son conteneur flottant ou le trigger.
     * Utilise composedPath pour rester robuste (conteneurs déplacés, hosts custom).
     * @private
     */
    private _isEventInsideMenuSurface(e: MouseEvent): boolean {
        const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
        const nodes: EventTarget[] = path.length > 0 ? path : [e.target as EventTarget];

        for (const node of nodes) {
            if (!(node instanceof Node)) continue;
            if (this.el.contains(node)) return true;
            if (this.menuContainer?.contains(node)) return true;
            if (
                this.triggerElement &&
                (this.triggerElement === node || this.triggerElement.contains(node))
            ) {
                return true;
            }
        }
        return false;
    }

    /**
     * Gestionnaire de clic en dehors du menu
     * @param {MouseEvent} e
     * @returns {void}
     */
    private _handleClickOutside = (e: MouseEvent): void => {
        if (!this.isOpen) return;
        if (this._isEventInsideMenuSurface(e)) return;
        this.close();
    };

    /**
     * Gestionnaire de clic sur un item du menu
     * @param {MouseEvent} e
     * @returns {void}
     */
    private _handleMenuClick = (e: MouseEvent): void => {
        const target = e.target as HTMLElement;
        const menuItem = target.closest('.menu-item') as HTMLElement | null;

        if (!menuItem || !this.menuContainer?.contains(menuItem)) return;

        const wrapper = menuItem.closest('.menu-item-wrapper') as HTMLElement | null;
        if (!wrapper || this._getMenuItemFromWrapper(wrapper) !== menuItem) return;

        const itemId = wrapper.dataset.itemId;
        if (!itemId) return;

        const link = (menuItem.querySelector('a') || wrapper.querySelector('a')) as HTMLAnchorElement | null;
        if (link && link.href && link.href !== '#!' && link.href !== '#') {
            e.preventDefault();
            e.stopPropagation();
            window.location.href = link.href;
            if (this.options.closeOnClick !== false) {
                this.close();
            }
            return;
        }

        const item = this._findItemById(itemId);
        if (!item) return;

        if (item.hasSubmenu) {
            return;
        }

        HapticManager.triggerFromOptions(this.options, 'selection');

        const submenu = wrapper.closest('.menu-submenu') as HTMLElement;
        const isInSubmenu = submenu !== null;
        const submenuId = submenu?.getAttribute('data-submenu-id') || null;
        const menuId = isInSubmenu ? (submenuId || 'submenu') : 'main';

        if (typeof this.options.onItemClick === 'function') {
            this.options.onItemClick.call(this, item, menuId);
        }

        this.el.dispatchEvent(new CustomEvent('onItemClick', {
            detail: { item, menuItem, menuId },
            bubbles: true
        }));

        if (this.options.closeOnClick !== false) {
            this.close();
        }
    };

    /**
     * Retire l'état visuel actif de tous les items.
     * @private
     */
    private _clearAllActiveVisual(): void {
        if (this.menuContainer) {
            this.menuContainer.querySelectorAll('.menu-item--active-visual').forEach((el) => {
                el.classList.remove('menu-item--active-visual');
            });
        }
        this._activeVisualItem = null;
        this._activeVisualSource = null;
    }

    /**
     * Pose l'état visuel M3 sur un seul item (hover ou focus clavier).
     * @param {HTMLElement} menuItem
     * @param {'pointer' | 'keyboard'} source
     * @private
     */
    private _setActiveVisualItem(menuItem: HTMLElement, source: 'pointer' | 'keyboard'): void {
        if (this._activeVisualItem === menuItem && this._activeVisualSource === source) {
            return;
        }

        if (this.menuContainer) {
            this.menuContainer.querySelectorAll('.menu-item--active-visual').forEach((el) => {
                if (el !== menuItem) {
                    el.classList.remove('menu-item--active-visual');
                }
            });
        }

        menuItem.classList.add('menu-item--active-visual');
        this._activeVisualItem = menuItem;
        this._activeVisualSource = source;

        if (source === 'pointer') {
            this._pointerInputActive = true;
            const focused = document.activeElement as HTMLElement | null;
            if (
                focused &&
                focused !== menuItem &&
                focused.classList.contains('menu-item') &&
                this.menuContainer?.contains(focused)
            ) {
                focused.blur();
            }
        }
    }

    /**
     * Retourne le `.menu-item` direct d'un wrapper (exclut items imbriqués dans sous-menus).
     * @param {HTMLElement} wrapper
     * @returns {HTMLElement | null}
     * @private
     */
    private _getMenuItemFromWrapper(wrapper: HTMLElement): HTMLElement | null {
        const item = wrapper.querySelector('.menu-item') as HTMLElement | null;
        if (!item || item.closest('.menu-item-wrapper') !== wrapper) return null;
        return item;
    }

    /**
     * Retourne le sous-menu d'un wrapper pour un itemId donné.
     * @param {HTMLElement} wrapper
     * @param {string} itemId
     * @returns {HTMLElement | null}
     * @private
     */
    private _getSubmenuFromWrapper(wrapper: HTMLElement, itemId: string): HTMLElement | null {
        const submenu = wrapper.querySelector(
            `.menu-submenu[data-submenu-id="${itemId}"]`
        ) as HTMLElement | null;
        if (!submenu || submenu.closest('.menu-item-wrapper') !== wrapper) return null;
        return submenu;
    }

    /**
     * Recherche un sous-menu dans le conteneur du menu (jamais via document).
     * @param {string} itemId
     * @returns {HTMLElement | null}
     * @private
     */
    private _findSubmenuInContainer(itemId: string): HTMLElement | null {
        if (!this.menuContainer) return null;
        const wrapper = this.menuContainer.querySelector(
            `[data-item-id="${itemId}"]`
        ) as HTMLElement | null;
        if (!wrapper) {
            Menu._logger.warn(`[Menu] Wrapper introuvable pour itemId="${itemId}"`);
            return null;
        }
        const submenu = this._getSubmenuFromWrapper(wrapper, itemId);
        if (!submenu) {
            Menu._logger.warn(`[Menu] Sous-menu introuvable pour itemId="${itemId}"`);
        }
        return submenu;
    }

    /**
     * Vérifie si le pointeur est dans la zone item + sous-menu d'un wrapper.
     * @param {HTMLElement} wrapper
     * @param {string} itemId
     * @returns {boolean}
     * @private
     */
    private _isPointerInSubmenuZone(wrapper: HTMLElement, itemId: string): boolean {
        const { x, y } = this._lastPointerCoords;
        if (x === 0 && y === 0) return true;
        if (typeof document.elementsFromPoint !== 'function') return true;

        try {
            const submenu = this._getSubmenuFromWrapper(wrapper, itemId);
            for (const el of document.elementsFromPoint(x, y)) {
                const node = el as Node;
                if (wrapper.contains(node)) return true;
                if (submenu?.contains(node)) return true;
            }
        } catch {
            return true;
        }
        return false;
    }

    /**
     * Résout le wrapper d'item sous le curseur via délégation DOM fiable.
     * @param {PointerEvent} e
     * @returns {HTMLElement | null}
     * @private
     */
    private _resolvePointerWrapper(e: PointerEvent): HTMLElement | null {
        if (!this.menuContainer) return null;
        const wrapper = (e.target as HTMLElement).closest('.menu-item-wrapper') as HTMLElement | null;
        if (!wrapper || !this.menuContainer.contains(wrapper)) return null;
        return wrapper;
    }

    /**
     * Retourne l'élément `.menu-item` pour un id (y compris items imbriqués).
     * @param {string} itemId
     * @returns {HTMLElement | null}
     * @private
     */
    private _getMenuItemElementById(itemId: string): HTMLElement | null {
        if (!this.menuContainer) return null;
        const wrapper = this.menuContainer.querySelector(
            `[data-item-id="${itemId}"]`
        ) as HTMLElement | null;
        return wrapper ? this._getMenuItemFromWrapper(wrapper) : null;
    }

    /**
     * Indique si un item possède un sous-menu.
     * @param {HTMLElement} wrapper
     * @param {HTMLElement} menuItem
     * @param {string} itemId
     * @returns {boolean}
     * @private
     */
    private _itemHasSubmenu(wrapper: HTMLElement, menuItem: HTMLElement, itemId: string): boolean {
        if (menuItem.getAttribute('data-has-submenu') === 'true') return true;
        if (this._getSubmenuFromWrapper(wrapper, itemId) !== null) return true;
        const item = this._findItemById(itemId);
        return !!(item?.items && item.items.length > 0);
    }

    /**
     * Synchronise menu-item--hover pour chaque sous-menu ouvert.
     * @private
     */
    private _rebuildOpenSubmenuHoverStates(): void {
        if (!this.menuContainer) return;

        const openIds = new Set<string>();
        this.openSubmenus.forEach((isOpen, id) => {
            if (isOpen) openIds.add(id);
        });

        this.menuContainer.querySelectorAll('.menu-item.menu-item--hover').forEach((el) => {
            const wrapper = el.closest('.menu-item-wrapper') as HTMLElement | null;
            const id = wrapper?.getAttribute('data-item-id');
            if (!id || !openIds.has(id)) {
                el.classList.remove('menu-item--hover');
            }
        });

        openIds.forEach((id) => {
            const menuItem = this._getMenuItemElementById(id);
            if (menuItem && !menuItem.classList.contains('menu-item--disabled')) {
                menuItem.classList.add('menu-item--hover');
            }
        });
    }

    /**
     * Synchronise les hovers ouverts et l'état visuel pointer de l'item focalisé.
     * @param {string} [pointerFocusItemId] - Item sous le curseur (optionnel)
     * @private
     */
    private _syncSubmenuHoverStates(pointerFocusItemId?: string): void {
        this._rebuildOpenSubmenuHoverStates();

        if (!pointerFocusItemId || !this.menuContainer || this._activeVisualSource !== 'pointer') {
            return;
        }

        const wrapper = this.menuContainer.querySelector(
            `[data-item-id="${pointerFocusItemId}"]`
        ) as HTMLElement | null;
        if (!wrapper || !this._isPointerInSubmenuZone(wrapper, pointerFocusItemId)) {
            return;
        }

        const menuItem = this._getMenuItemFromWrapper(wrapper);
        if (!menuItem || menuItem.classList.contains('menu-item--disabled')) {
            return;
        }

        this._setActiveVisualItem(menuItem, 'pointer');
    }

    /**
     * Ferme les sous-menus frères (même parent) pour un item donné.
     * @param {string} itemId
     * @returns {void}
     * @private
     */
    private _closeSiblingSubmenusForItem(itemId: string): void {
        const currentPath = this._getItemPath(itemId);
        const currentParentId = this._findParentItemId(itemId);
        const submenusToClose: string[] = [];

        this.openSubmenus.forEach((isOpen, id) => {
            if (id === itemId || !isOpen) return;
            if (currentPath.includes(id) || this._isDescendantOf(itemId, id)) return;
            const isSibling = this._findParentItemId(id) === currentParentId;
            const isChildSubmenu = this._isDescendantOf(id, itemId);
            if (isSibling || isChildSubmenu) {
                submenusToClose.push(id);
            }
        });

        submenusToClose.forEach((id) => {
            this._cancelSubmenuCloseTimeout(id);
            this._closeSubmenu(id, true);
        });
    }

    /**
     * Délégation pointerover — un seul handler pour tous les items (y compris sous-menus).
     * @param {PointerEvent} e
     * @private
     */
    private _handleMenuPointerOver = (e: PointerEvent): void => {
        if (!this.isOpen || !this.menuContainer) return;
        if (e.pointerType && e.pointerType !== 'mouse') return;

        this._lastPointerCoords = { x: e.clientX, y: e.clientY };

        const wrapper = this._resolvePointerWrapper(e);
        if (!wrapper || !this.menuContainer.contains(wrapper)) return;

        const relatedTarget = e.relatedTarget as Node | null;
        if (relatedTarget && wrapper.contains(relatedTarget)) return;

        const menuItem = this._getMenuItemFromWrapper(wrapper);
        if (!menuItem || menuItem.classList.contains('menu-item--disabled')) return;

        const itemId = wrapper.getAttribute('data-item-id');
        if (!itemId) return;

        this._closeSiblingSubmenusForItem(itemId);
        this._setActiveVisualItem(menuItem, 'pointer');
        this._handleItemEnter(wrapper, menuItem, itemId);
        this._syncSubmenuHoverStates(itemId);
    };

    /**
     * Délégation pointerout — fermeture différée via intention (pas de fermeture immédiate).
     * @param {PointerEvent} e
     * @private
     */
    private _handleMenuPointerOut = (e: PointerEvent): void => {
        if (!this.isOpen || !this.menuContainer) return;
        if (e.pointerType && e.pointerType !== 'mouse') return;

        this._lastPointerCoords = { x: e.clientX, y: e.clientY };

        const wrapper = this._resolvePointerWrapper(e);
        if (!wrapper || !this.menuContainer.contains(wrapper)) return;

        const relatedTarget = e.relatedTarget as Node | null;
        if (relatedTarget && wrapper.contains(relatedTarget)) return;

        const itemId = wrapper.getAttribute('data-item-id');
        if (!itemId) return;

        const submenu = this._getSubmenuFromWrapper(wrapper, itemId);
        const movingToSubmenu = relatedTarget && submenu?.contains(relatedTarget);

        if (movingToSubmenu || this._isPointerInSubmenuZone(wrapper, itemId)) {
            this._cancelSubmenuCloseTimeout(itemId);
            this._syncSubmenuHoverStates(itemId);
            return;
        }

        const menuItem = this._getMenuItemFromWrapper(wrapper);
        const submenuOpenOrPending =
            this.openSubmenus.get(itemId) === true || this._submenuOpenTimeouts.has(itemId);

        if (
            menuItem &&
            !submenuOpenOrPending &&
            relatedTarget &&
            !wrapper.contains(relatedTarget) &&
            this._activeVisualSource === 'pointer' &&
            menuItem.classList.contains('menu-item--active-visual')
        ) {
            menuItem.classList.remove('menu-item--active-visual');
            if (this._activeVisualItem === menuItem) {
                this._activeVisualItem = null;
                this._activeVisualSource = null;
            }
        }

        this._handleItemLeave(wrapper, itemId);
    };

    /**
     * Focus clavier sur un item — état visuel si le pointeur n'est pas actif.
     * @param {FocusEvent} e
     * @private
     */
    private _handleMenuFocusIn = (e: FocusEvent): void => {
        if (!this.isOpen || !this.menuContainer || this._pointerInputActive) return;

        const menuItem = (e.target as HTMLElement).closest('.menu-item') as HTMLElement | null;
        if (!menuItem || !this.menuContainer.contains(menuItem)) return;
        if (menuItem.classList.contains('menu-item--disabled')) return;

        this._setActiveVisualItem(menuItem, 'keyboard');
    };

    /**
     * Traite l'entrée sur un item de menu (gestion des sous-menus)
     * @param {HTMLElement} wrapper - Wrapper de l'item
     * @param {HTMLElement} menuItem - L'élément de menu
     * @param {string} itemId - ID de l'item
     * @returns {void}
     */
    private _handleItemEnter(wrapper: HTMLElement, menuItem: HTMLElement, itemId: string): void {
        const hasSubmenu = this._itemHasSubmenu(wrapper, menuItem, itemId);
        const item = this._findItemById(itemId);
        const hasSubmenuFromData = !!(item?.items && item.items.length > 0);

        this._cancelSubmenuCloseTimeout(itemId);

        this._submenuOpenTimeouts.forEach((timeoutId, id) => {
            if (id !== itemId) {
                clearTimeout(timeoutId);
                this._submenuOpenTimeouts.delete(id);
            }
        });

        this._closeSiblingSubmenusForItem(itemId);

        if (!hasSubmenu) return;

        const submenu = this._getSubmenuFromWrapper(wrapper, itemId);
        const isReallyOpen = submenu &&
            submenu.style.display !== 'none' &&
            !submenu.classList.contains('menu-submenu--closed') &&
            submenu.classList.contains('menu-submenu--open');

        if (this.openSubmenus.get(itemId) && isReallyOpen) {
            const horizontalPosition = this._calculateSubmenuHorizontalPosition(menuItem);
            this.submenuPositions.set(itemId, horizontalPosition);

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    if (!this.openSubmenus.get(itemId)) return;
                    const targetSubmenu = this._getSubmenuFromWrapper(wrapper, itemId);
                    if (!targetSubmenu) return;

                    void menuItem.offsetWidth;
                    const currentSubmenuPosition = this.submenuPositions.get(itemId) || 'right';

                    targetSubmenu.style.visibility = 'hidden';
                    targetSubmenu.style.display = 'block';

                    const wrapperComputed = window.getComputedStyle(wrapper);
                    if (wrapperComputed.position === 'static') {
                        wrapper.style.position = 'relative';
                    }

                    targetSubmenu.style.position = 'absolute';
                    targetSubmenu.style.marginLeft = '0';
                    targetSubmenu.style.marginRight = '0';
                    targetSubmenu.style.paddingLeft = '0';
                    targetSubmenu.style.paddingRight = '0';

                    if (currentSubmenuPosition === 'right') {
                        targetSubmenu.style.left = 'calc(100% - 4px)';
                        targetSubmenu.style.right = 'auto';
                    } else {
                        targetSubmenu.style.left = 'auto';
                        targetSubmenu.style.right = 'calc(100% - 4px)';
                    }

                    void menuItem.offsetHeight;
                    void targetSubmenu.offsetHeight;

                    const freshMenuItemRect = menuItem.getBoundingClientRect();
                    const wrapperRect = wrapper.getBoundingClientRect();

                    const submenuPadding = 4;
                    const targetSubmenuHeight = targetSubmenu.offsetHeight || 200;
                    const viewportHeight = window.innerHeight;
                    const margin = 16;
                    const itemHeight = 48;

                    const verticalPosition = this._calculateSubmenuVerticalPosition(menuItem, targetSubmenu);
                    const isFromTop = verticalPosition === 'top';

                    let topOffset: number;
                    if (isFromTop) {
                        const menuItemBottom = freshMenuItemRect.top - wrapperRect.top + freshMenuItemRect.height;
                        topOffset = menuItemBottom - targetSubmenuHeight + submenuPadding;
                    } else {
                        topOffset = freshMenuItemRect.top - wrapperRect.top - submenuPadding;
                    }

                    const calculatedBottom = wrapperRect.top + topOffset + targetSubmenuHeight;
                    if (calculatedBottom > viewportHeight - margin) {
                        const overflow = calculatedBottom - (viewportHeight - margin);
                        const itemsToShift = Math.ceil(overflow / itemHeight);
                        topOffset = topOffset - (itemsToShift * itemHeight);
                        const minTopOffset = margin - wrapperRect.top - submenuPadding;
                        if (topOffset < minTopOffset) {
                            topOffset = minTopOffset;
                        }
                    }

                    targetSubmenu.style.top = `${topOffset}px`;
                    targetSubmenu.style.bottom = 'auto';
                    targetSubmenu.style.visibility = 'visible';

                    void targetSubmenu.offsetWidth;
                    void targetSubmenu.offsetHeight;

                    this._manageSubmenuOverflow(itemId);
                });
            });

            return;
        }

        const horizontalPos = this._calculateSubmenuHorizontalPosition(menuItem);
        this.submenuPositions.set(itemId, horizontalPos);

        this._cancelSubmenuOpenTimeout(itemId);

        const timeoutId = window.setTimeout(() => {
            this._submenuOpenTimeouts.delete(itemId);
            if (!this.isOpen) return;

            const checkWrapper = this.menuContainer?.querySelector(
                `[data-item-id="${itemId}"]`
            ) as HTMLElement | null;
            if (!checkWrapper || !checkWrapper.isConnected) return;

            const checkItem = this._getMenuItemFromWrapper(checkWrapper);
            if (!checkItem) return;

            const checkSubmenu = this._getSubmenuFromWrapper(checkWrapper, itemId);
            const isAlreadyOpen = checkSubmenu &&
                checkSubmenu.style.display !== 'none' &&
                !checkSubmenu.classList.contains('menu-submenu--closed') &&
                checkSubmenu.classList.contains('menu-submenu--open');

            if (this.openSubmenus.get(itemId) && isAlreadyOpen) return;

            if (checkSubmenu || hasSubmenuFromData) {
                this._openSubmenu(itemId, checkItem);
            }
        }, MenuSpecs.timing.submenuOpenDelayMs);

        this._submenuOpenTimeouts.set(itemId, timeoutId);
    }

    /**
     * Traite la sortie d'un item de menu — planifie une fermeture différée (intention).
     * @param {HTMLElement} wrapper
     * @param {string} itemId
     * @returns {void}
     */
    private _handleItemLeave(wrapper: HTMLElement, itemId: string): void {
        this._scheduleSubmenuClose(itemId, wrapper);
    }

    /**
     * Planifie la fermeture différée d'un sous-menu (modèle d'intention M3).
     * @param {string} submenuId
     * @param {HTMLElement} [wrapper] - Wrapper parent pour vérification elementFromPoint
     * @returns {void}
     */
    private _scheduleSubmenuClose(submenuId: string, wrapper?: HTMLElement): void {
        if (!this.openSubmenus.get(submenuId)) return;

        this._cancelSubmenuCloseTimeout(submenuId);

        const timeoutId = window.setTimeout(() => {
            this._submenuCloseTimeouts.delete(submenuId);
            if (!this.openSubmenus.get(submenuId)) return;

            if (wrapper && this._isPointerInSubmenuZone(wrapper, submenuId)) return;

            this._closeSubmenu(submenuId, true);
        }, MenuSpecs.timing.submenuCloseDelayMs);

        this._submenuCloseTimeouts.set(submenuId, timeoutId);
    }

    /**
     * Annule le délai de fermeture d'un sous-menu
     * @param {string} submenuId
     * @returns {void}
     */
    private _cancelSubmenuCloseTimeout(submenuId: string): void {
        const timeoutId = this._submenuCloseTimeouts.get(submenuId);
        if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
            this._submenuCloseTimeouts.delete(submenuId);
        }
    }

    /**
     * Annule le délai d'ouverture planifié d'un sous-menu
     * @param {string} [submenuId] - Si omis, annule tous les délais d'ouverture en attente
     * @returns {void}
     */
    private _cancelSubmenuOpenTimeout(submenuId?: string): void {
        if (submenuId !== undefined) {
            const timeoutId = this._submenuOpenTimeouts.get(submenuId);
            if (timeoutId !== undefined) {
                clearTimeout(timeoutId);
                this._submenuOpenTimeouts.delete(submenuId);
            }
            return;
        }
        this._submenuOpenTimeouts.forEach((id) => clearTimeout(id));
        this._submenuOpenTimeouts.clear();
    }

    /**
     * Gestionnaire de touches clavier
     * @param {KeyboardEvent} e
     * @returns {void}
     */
    private _handleKeydown = (e: KeyboardEvent): void => {
        if (e.key === 'Escape' && this.isOpen) {
            e.preventDefault();
            this.close();
        } else if ((e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') && !this.isOpen) {
            e.preventDefault();
            this.open();
            this._focusFirstMenuItem();
        }
    };

    /**
     * Retourne les éléments menuitem focusables du menu principal (hors sous-menus)
     */
    private _getFocusableMenuItems(): HTMLElement[] {
        if (!this.menuContainer) return [];
        const groups = this.menuContainer.querySelectorAll(':scope > .menu-group');
        const items: HTMLElement[] = [];
        groups.forEach(group => {
            group.querySelectorAll(':scope > .menu-item-wrapper').forEach(wrapper => {
                const menuItem = this._getMenuItemFromWrapper(wrapper as HTMLElement);
                if (menuItem && !menuItem.classList.contains('menu-item--disabled')) {
                    items.push(menuItem);
                }
            });
        });
        return items;
    }

    /**
     * Focus le premier item du menu et applique le roving tabindex
     */
    private _focusFirstMenuItem(): void {
        const items = this._getFocusableMenuItems();
        if (items.length === 0) return;
        items.forEach((el, i) => {
            el.setAttribute('role', 'menuitem');
            el.setAttribute('tabindex', i === 0 ? '0' : '-1');
        });
        this.focusedIndex = 0;
        requestAnimationFrame(() => {
            items[0].focus();
            this._setActiveVisualItem(items[0], 'keyboard');
        });
    }

    /**
     * Gestionnaire clavier sur le conteneur du menu (flèches, Home, End, Enter, Escape)
     */
    private _handleMenuKeydown = (e: KeyboardEvent): void => {
        if (!this.menuContainer || !this.isOpen) return;
        const items = this._getFocusableMenuItems();
        if (items.length === 0) return;

        const target = e.target as HTMLElement;
        const isMenuItem = target.closest('.menu-item') && this.menuContainer.contains(target);
        if (!isMenuItem && target !== this.menuContainer) return;

        const activeEl = document.activeElement as HTMLElement;
        const activeIndex = items.indexOf(activeEl);
        if (activeIndex >= 0) this.focusedIndex = activeIndex;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this._pointerInputActive = false;
                this.focusedIndex = this.focusedIndex < items.length - 1 ? this.focusedIndex + 1 : 0;
                items.forEach((el, i) => el.setAttribute('tabindex', i === this.focusedIndex ? '0' : '-1'));
                items[this.focusedIndex].focus();
                this._setActiveVisualItem(items[this.focusedIndex], 'keyboard');
                break;
            case 'ArrowUp':
                e.preventDefault();
                this._pointerInputActive = false;
                this.focusedIndex = this.focusedIndex > 0 ? this.focusedIndex - 1 : items.length - 1;
                items.forEach((el, i) => el.setAttribute('tabindex', i === this.focusedIndex ? '0' : '-1'));
                items[this.focusedIndex].focus();
                this._setActiveVisualItem(items[this.focusedIndex], 'keyboard');
                break;
            case 'Home':
                e.preventDefault();
                this._pointerInputActive = false;
                this.focusedIndex = 0;
                items.forEach((el, i) => el.setAttribute('tabindex', i === 0 ? '0' : '-1'));
                items[0].focus();
                this._setActiveVisualItem(items[0], 'keyboard');
                break;
            case 'End':
                e.preventDefault();
                this._pointerInputActive = false;
                this.focusedIndex = items.length - 1;
                items.forEach((el, i) => el.setAttribute('tabindex', i === items.length - 1 ? '0' : '-1'));
                items[items.length - 1].focus();
                this._setActiveVisualItem(items[items.length - 1], 'keyboard');
                break;
            case 'Escape':
                e.preventDefault();
                this.close();
                if (this.triggerElement) this.triggerElement.focus();
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                const current = items[this.focusedIndex];
                if (current) {
                    const wrapper = current.closest('.menu-item-wrapper') as HTMLElement;
                    if (wrapper) wrapper.click();
                }
                break;
            default:
                break;
        }
    };

    /**
     * Gère le défilement pour repositionner le menu
     * @returns {void}
     */
    private _handleScroll = (): void => {
        if (!this.isOpen) return;

        if (this.menuContainer && this.triggerElement) {
            if (this._scrollAnimationFrameId !== undefined) return;

            this._scrollAnimationFrameId = requestAnimationFrame(() => {
                this._scrollAnimationFrameId = undefined;
                this._lastScrollTime = Date.now();

                if (this.isOpen && this.menuContainer && this.triggerElement) {
                    const scrollTransition = 'left 150ms ease-out, top 150ms ease-out';
                    const currentTransition = this.menuContainer.style.transition;

                    if (currentTransition && currentTransition.trim()) {
                        const hasLeftTop = currentTransition.includes('left') || currentTransition.includes('top');
                        if (!hasLeftTop) {
                            this.menuContainer.style.transition = `${currentTransition}, ${scrollTransition}`;
                        }
                    } else {
                        this.menuContainer.style.transition = scrollTransition;
                    }

                    // autoUpdate gère automatiquement le recalcul, pas besoin de l'appeler manuellement

                    if (this.openSubmenus.size > 0) {
                        this._positionSubmenus();
                        this.openSubmenus.forEach((_, submenuId) => {
                            this._manageSubmenuOverflow(submenuId);
                        });
                    }
                }
            });
            return;
        }

        if (this.openSubmenus.size > 0 && (!this.menuContainer || !this.triggerElement)) {
            if (this._scrollAnimationFrameId !== undefined) return;
            this._scrollAnimationFrameId = requestAnimationFrame(() => {
                this._scrollAnimationFrameId = undefined;
                this._lastScrollTime = Date.now();
                this._positionSubmenus();
                this.openSubmenus.forEach((_, submenuId) => {
                    this._manageSubmenuOverflow(submenuId);
                });
            });
        }
    };

    /**
     * Gère le redimensionnement de la fenêtre
     * @returns {void}
     */
    private _handleResize = (): void => {
        if (!this.isOpen) return;

        if (this.menuContainer && this.triggerElement) {
            if (this._resizeAnimationFrameId !== undefined) return;

            this._resizeAnimationFrameId = requestAnimationFrame(() => {
                this._resizeAnimationFrameId = undefined;

                if (this.isOpen && this.menuContainer && this.triggerElement) {
                    // autoUpdate gère automatiquement le recalcul, pas besoin de l'appeler manuellement

                    if (this.openSubmenus.size > 0) {
                        this._positionSubmenus();
                        this.openSubmenus.forEach((_, submenuId) => {
                            this._manageSubmenuOverflow(submenuId);
                        });
                    }
                }
            });
        }
    };

    /**
     * Gère la sortie de souris du menu complet
     * @param {MouseEvent} e
     * @returns {void}
     */
    private _handleMenuMouseLeave = (e: MouseEvent): void => {
        const relatedTarget = e.relatedTarget as HTMLElement;

        if (relatedTarget) {
            const relatedItem = relatedTarget.closest('.menu-item-wrapper') as HTMLElement;
            if (relatedItem) {
                return;
            }
            const isInSubmenu = relatedTarget.closest('.menu-submenu') !== null;
            if (isInSubmenu) return;
        }

        const allMenuElements = this.menuContainer?.querySelectorAll('.menu-container, .menu-submenu');
        if (allMenuElements && relatedTarget) {
            let isStillInMenu = false;
            for (const menuEl of Array.from(allMenuElements)) {
                if (menuEl.contains(relatedTarget) || menuEl === relatedTarget) {
                    isStillInMenu = true;
                    break;
                }
            }
            if (isStillInMenu) return;
        }

        const openSubmenuIds = Array.from(this.openSubmenus.keys());
        openSubmenuIds.forEach(submenuId => {
            this._closeSubmenu(submenuId, true);
        });
    };

    /**
     * Gère les mouvements de souris sur le document pour fermer le menu si nécessaire
     * @param {MouseEvent} e
     * @returns {void}
     */
    private _handleDocumentMouseMove = (e: MouseEvent): void => {
        if (!this.isOpen) return;

        const target = e.target as HTMLElement;

        const isInMenuItem = target.closest('.menu-item-wrapper') !== null;
        if (isInMenuItem) return;

        const isInMenuContainer = this.menuContainer?.contains(target) || this.menuContainer === target;
        if (isInMenuContainer) return;

        const isInSubmenu = target.closest('.menu-submenu') !== null;
        if (isInSubmenu) return;

        if (this._closeTimeout) {
            clearTimeout(this._closeTimeout);
        }
        this._closeTimeout = window.setTimeout(() => {
            const currentTarget = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
            if (currentTarget) {
                const stillInMenuContainer = this.menuContainer?.contains(currentTarget) || this.menuContainer === currentTarget;
                const stillInSubmenu = currentTarget.closest('.menu-submenu') !== null;

                if (!stillInMenuContainer && !stillInSubmenu) {
                    const openSubmenuIds = Array.from(this.openSubmenus.keys());
                    openSubmenuIds.forEach(submenuId => {
                        this._closeSubmenu(submenuId);
                    });
                }
            }
        }, 50);
    };

    /**
     * Calcule le côté d'ouverture horizontal du sous-menu
     * @param {HTMLElement} parentElement
     * @returns {'left' | 'right'}
     */
    private _calculateSubmenuHorizontalPosition(parentElement: HTMLElement): 'left' | 'right' {
        const rect = parentElement.getBoundingClientRect();
        const submenuWidth = 280;
        const rightSpace = window.innerWidth - rect.right;
        const leftSpace = rect.left;

        if (this.options.submenuPosition === 'left') {
            return 'left';
        } else if (this.options.submenuPosition === 'right') {
            return 'right';
        } else {
            if (rightSpace >= submenuWidth) {
                return 'right';
            } else if (leftSpace >= submenuWidth) {
                return 'left';
            } else {
                return rightSpace > leftSpace ? 'right' : 'left';
            }
        }
    }

    /**
     * Calcule la position verticale du sous-menu
     * @param {HTMLElement} parentElement
     * @param {HTMLElement} submenuElement
     * @returns {'top' | 'bottom'}
     */
    private _calculateSubmenuVerticalPosition(parentElement: HTMLElement, submenuElement: HTMLElement): 'top' | 'bottom' {
        const parentRect = parentElement.getBoundingClientRect();
        const submenuHeight = submenuElement.offsetHeight || submenuElement.getBoundingClientRect().height || 200;
        const bottomSpace = window.innerHeight - parentRect.top;
        const topSpace = parentRect.top;
        const minSpaceThreshold = 100;

        if (bottomSpace >= submenuHeight || (bottomSpace >= minSpaceThreshold && bottomSpace >= topSpace)) {
            return 'bottom';
        } else if (topSpace >= submenuHeight && topSpace > bottomSpace) {
            return 'top';
        } else {
            return 'bottom';
        }
    }

    /**
     * Parse une chaîne de placement pour en extraire les composantes
     * @param {string} placement
     * @returns {{direction: string, alignment: string}}
     */
    private _parsePlacement(placement: string): { direction: string, alignment: string } {
        const parts = placement.split('-');
        return {
            direction: parts[0] || 'bottom',
            alignment: parts[1] || 'center'
        };
    }

    /**
         * Calcule le placement du menu
         * @returns {MenuOptions['placement']}
         */
    private _calculateMenuPlacement(): MenuOptions['placement'] {
        if (!this.triggerElement) return 'bottom-start';

        // Priorité absolue aux classes CSS explicites
        if (this.triggerElement.classList.contains('floating--right')) {
            return 'bottom-end';
        }

        // Respect de l'option JS si définie et fixe
        if (this.options.placement && this.options.placement !== 'auto') {
            return this.options.placement;
        }

        // 3. Logique contextuelle (AppBar)
        const appbar = this.triggerElement.closest('k3ui-appbar, .appbar') as HTMLElement;
        if (appbar) {
            const isTop = appbar.classList.contains('appbar--top') || appbar.getAttribute('position') === 'top';
            // Dans une AppBar, on aligne souvent à la fin (droite) si on est dans la partie droite
            const rect = this.triggerElement.getBoundingClientRect();
            const isRightSide = rect.left > window.innerWidth / 2;

            if (isTop) return isRightSide ? 'bottom-end' : 'bottom-start';
            return isRightSide ? 'top-end' : 'top-start';
        }

        // 4. Calcul automatique basique (fallback)
        const rect = this.triggerElement.getBoundingClientRect();
        const bottomSpace = window.innerHeight - rect.bottom;
        // Si pas de place en bas (< 200px), on met en haut
        return bottomSpace >= 200 ? 'bottom-start' : 'top-start';
    }

    /**
     * Ouvre un sous-menu spécifique
     * @param {string} submenuId
     * @param {HTMLElement} parentElement
     * @returns {void}
     */
    private _openSubmenu(submenuId: string, parentElement: HTMLElement): void {
        if (this.openSubmenus.get(submenuId)) return;

        const horizontalPosition = this._calculateSubmenuHorizontalPosition(parentElement);
        this.openSubmenus.set(submenuId, true);
        this.submenuPositions.set(submenuId, horizontalPosition);
        this.newlyOpenedSubmenus.add(submenuId);

        const submenu = this._findSubmenuInContainer(submenuId);

        if (submenu) {
            const isNewlyOpened = this.newlyOpenedSubmenus.has(submenuId);
            submenu.classList.remove('menu-submenu--closed');
            submenu.classList.add('menu-submenu--open');
            if (isNewlyOpened) {
                submenu.classList.remove('menu-submenu--existing');
                submenu.classList.add('menu-submenu--new');
            } else {
                submenu.classList.remove('menu-submenu--new');
                submenu.classList.add('menu-submenu--existing');
            }
            submenu.style.display = 'block';
            this._syncSubmenuHoverStates(submenuId);
        }

        this._positionSubmenus();

        this.openSubmenus.forEach((isOpen, id) => {
            if (isOpen) {
                this._manageSubmenuOverflow(id);
            }
        });

        const isNewlyOpened = this.newlyOpenedSubmenus.has(submenuId);
        if (isNewlyOpened && submenu) {
            requestAnimationFrame(() => {
                this._animateSubmenuIn(submenu, horizontalPosition);
                this._syncSubmenuHoverStates(submenuId);
            });
        }

        requestAnimationFrame(() => {
            if (this.isOpen && this.menuContainer) {
                this._positionSubmenus();
                this._syncSubmenuHoverStates(submenuId);
            }
        });

        setTimeout(() => {
            this.newlyOpenedSubmenus.delete(submenuId);
            const submenuForAnimation = this._findSubmenuInContainer(submenuId);
            if (submenuForAnimation) {
                submenuForAnimation.classList.remove('menu-submenu--new');
                submenuForAnimation.classList.add('menu-submenu--existing');
            }
        }, this._getAnimationDurationMs('in'));
    }

    /**
     * Gère l'overflow pour les sous-menus
     * @param {string} submenuId
     * @returns {void}
     */
    private _manageSubmenuOverflow(submenuId: string): void {
        if (!this.menuContainer) return;

        const wrapper = this.menuContainer.querySelector(`[data-item-id="${submenuId}"]`) as HTMLElement;
        if (!wrapper) return;

        const submenu = this._getSubmenuFromWrapper(wrapper, submenuId);
        if (!submenu) return;
        if (submenu.style.display === 'none') return;

        submenu.style.maxHeight = 'none';
        submenu.style.overflowY = 'visible';
        submenu.classList.remove('menu-submenu--scrollable');
    }

    /**
     * Ferme un sous-menu
     * @param {string} submenuId
     * @param {boolean} [forceClose=false] - Forcer la fermeture sans délai
     * @returns {void}
     */
    private _closeSubmenu(submenuId: string, forceClose: boolean = false): void {
        this._cancelSubmenuOpenTimeout(submenuId);

        const submenu = this._findSubmenuInContainer(submenuId);

        const horizontalPosition = this.submenuPositions.get(submenuId) || 'right';
        const wasOpen = this.openSubmenus.get(submenuId) || false;

        if (submenu) {
            if (wasOpen) {
                submenu.classList.remove('menu-submenu--closed');
                submenu.classList.add('menu-submenu--open');

                if (submenu.style.display === 'none' || getComputedStyle(submenu).display === 'none') {
                    submenu.style.display = 'block';
                }

                this._animateSubmenuOut(submenu, horizontalPosition);
            }

            if (wasOpen) {
                setTimeout(() => {
                    if (submenu) {
                        submenu.style.removeProperty('display');
                        submenu.style.removeProperty('visibility');
                        submenu.style.removeProperty('opacity');
                        submenu.style.removeProperty('transform');
                        submenu.style.removeProperty('transition');

                        submenu.classList.remove('menu-submenu--open');
                        submenu.classList.remove('menu-submenu--new');
                        submenu.classList.remove('menu-submenu--existing');
                        submenu.classList.add('menu-submenu--closed');
                        submenu.removeAttribute('data-events-attached');
                    }
                }, this._getAnimationDurationMs('out', submenu));
            } else {
                if (submenu) {
                    submenu.style.display = 'none';
                    submenu.classList.remove('menu-submenu--open');
                    submenu.classList.remove('menu-submenu--new');
                    submenu.classList.remove('menu-submenu--existing');
                    submenu.classList.add('menu-submenu--closed');
                }
            }
        }

        this._cancelSubmenuCloseTimeout(submenuId);

        if (forceClose) {
            this.openSubmenus.delete(submenuId);
            this.submenuPositions.delete(submenuId);
            this.newlyOpenedSubmenus.delete(submenuId);
        } else if (!wasOpen) {
            this.openSubmenus.delete(submenuId);
            this.submenuPositions.delete(submenuId);
            this.newlyOpenedSubmenus.delete(submenuId);
        } else {
            setTimeout(() => {
                this.openSubmenus.delete(submenuId);
                this.submenuPositions.delete(submenuId);
                this.newlyOpenedSubmenus.delete(submenuId);
                this._rebuildOpenSubmenuHoverStates();
            }, this._getAnimationDurationMs('out', submenu ?? undefined));
        }

        const item = this._findItemById(submenuId);
        if (item && item.items) {
            const closeChildrenRecursive = (items: MenuItem[]): void => {
                for (const childItem of items) {
                    if (childItem.id && this.openSubmenus.get(childItem.id)) {
                        this._closeSubmenu(childItem.id);
                    }
                    if (childItem.items) {
                        closeChildrenRecursive(childItem.items);
                    }
                }
            };
            if (item.items) {
                closeChildrenRecursive(item.items);
            }
        }

        this._rebuildOpenSubmenuHoverStates();
    }

    /**
     * Trouve un item par son ID
     * @param {string} id
     * @param {MenuItem[]} [items]
     * @returns {MenuItem | null}
     */
    private _findItemById(id: string, items?: MenuItem[]): MenuItem | null {
        const searchItems = items || this.options.items || [];
        for (const item of searchItems) {
            if (item.id === id) return item;
            if (item.items) {
                const found = this._findItemById(id, item.items);
                if (found) return found;
            }
        }
        return null;
    }

    /**
     * Trouve l'ID du parent d'un item
     * @param {string} itemId
     * @param {MenuItem[]} [items]
     * @param {string} [parentId]
     * @returns {string | null}
     */
    private _findParentItemId(itemId: string, items?: MenuItem[], parentId?: string): string | null {
        const searchItems = items || this.options.items || [];
        for (const item of searchItems) {
            if (item.id === itemId) {
                return parentId || null;
            }
            if (item.items) {
                const found = this._findParentItemId(itemId, item.items, item.id);
                if (found !== null) return found;
            }
        }
        return null;
    }

    /**
     * Vérifie si un ancêtre est dans le chemin
     * @param {string} ancestorId
     * @param {string} descendantId
     * @returns {boolean}
     */
    private _isItemInPath(ancestorId: string, descendantId: string): boolean {
        let current = descendantId;
        while (current) {
            if (current === ancestorId) return true;
            const parent = this._findParentItemId(current);
            if (!parent) break;
            current = parent;
        }
        return false;
    }

    /**
     * Récupère le chemin d'items jusqu'à la racine
     * @param {string} itemId
     * @returns {string[]}
     */
    private _getItemPath(itemId: string): string[] {
        const path: string[] = [];
        let current: string | null = itemId;
        while (current) {
            path.unshift(current);
            const parent = this._findParentItemId(current);
            if (!parent) break;
            current = parent;
        }
        return path;
    }

    /**
     * Vérifie si un item est descendant d'un autre
     * @param {string} descendantId
     * @param {string} ancestorId
     * @returns {boolean}
     */
    private _isDescendantOf(descendantId: string, ancestorId: string): boolean {
        return this._isItemInPath(ancestorId, descendantId);
    }

    /**
     * Groupe les items par dividers
     * @param {MenuItem[]} items
     */
    private _groupItemsByDividers(items: MenuItem[]): { groups: MenuItem[][], visualDividers: Array<{ item: MenuItem, afterItemIndex: number, groupIndex: number }>, gapDividers: Array<{ item: MenuItem, afterGroupIndex: number }> } {
        const groups: MenuItem[][] = [];
        const visualDividers: Array<{ item: MenuItem, afterItemIndex: number, groupIndex: number }> = [];
        const gapDividers: Array<{ item: MenuItem, afterGroupIndex: number }> = [];
        let currentGroup: MenuItem[] = [];

        for (const item of items) {
            if (item.type === 'divider') {
                const dividerType = item.dividerType || 'gap';
                if (dividerType === 'line') {
                    if (currentGroup.length > 0) {
                        visualDividers.push({
                            item,
                            afterItemIndex: currentGroup.length - 1,
                            groupIndex: groups.length
                        });
                    }
                } else {
                    if (currentGroup.length > 0) {
                        groups.push(currentGroup);
                        gapDividers.push({ item, afterGroupIndex: groups.length - 1 });
                        currentGroup = [];
                    }
                }
            } else {
                currentGroup.push(item);
            }
        }

        if (currentGroup.length > 0) {
            groups.push(currentGroup);
        }

        return { groups, visualDividers, gapDividers };
    }

    /**
     * Rend le HTML pour un item de menu
     * @param {MenuItem} item
     * @param {string} menuId
     * @param {number} [depth=0]
     * @param {boolean} [isFirst=false]
     * @param {boolean} [isLast=false]
     * @returns {string}
     */
    private _renderMenuItem(item: MenuItem, menuId: string, depth: number = 0, isFirst: boolean = false, isLast: boolean = false): string {
        if (item.type === 'divider') return '';

        const itemId = item.id || `item-${depth}-${Date.now()}`;
        const isSubmenuOpen = this.openSubmenus.get(itemId) || false;
        const submenuPosition = this.submenuPositions.get(itemId) || 'right';
        const activeClass = isSubmenuOpen ? 'menu-item--active' : '';
        const disabledClass = item.disabled ? 'menu-item--disabled' : '';
        const gapClass = item.gap ? 'list-item--gap' : '';

        let submenuHtml = '';
        const hasSubmenuCheck = item.hasSubmenu === true || (item.items && item.items.length > 0);
        if (hasSubmenuCheck && item.items && item.items.length > 0) {
            const submenuResult = this._groupItemsByDividers(item.items);
            const submenuGroups = submenuResult.groups;
            const submenuVisualDividers = submenuResult.visualDividers;

            const submenuGroupsHtml: string[] = [];
            submenuGroups.forEach((group, groupIndex) => {
                const isFirstGroup = groupIndex === 0;
                const isLastGroup = groupIndex === submenuGroups.length - 1;
                const groupClass = `menu-group ${isFirstGroup ? 'menu-group--first' : ''} ${isLastGroup ? 'menu-group--last' : ''}`.trim();

                const groupItemsHtml: string[] = [];
                group.forEach((subItem, itemIndex) => {
                    const isFirstItem = itemIndex === 0;
                    const isLastItem = itemIndex === group.length - 1;
                    groupItemsHtml.push(this._renderMenuItem(subItem, menuId, depth + 1, isFirstItem, isLastItem));

                    const visualDividerAfterThisItem = submenuVisualDividers.find(d => d.groupIndex === groupIndex && d.afterItemIndex === itemIndex);
                    if (visualDividerAfterThisItem) {
                        groupItemsHtml.push(`<div class="menu-divider" data-divider-id="${visualDividerAfterThisItem.item.id || `divider-${groupIndex}-${itemIndex}`}"></div>`);
                    }
                });

                submenuGroupsHtml.push(`<div class="${groupClass}">${groupItemsHtml.join('')}</div>`);
            });

            const isNewlyOpened = this.newlyOpenedSubmenus.has(itemId);
            const animationClass = isNewlyOpened ? 'menu-submenu--new' : 'menu-submenu--existing';
            const visibleClass = isSubmenuOpen ? 'menu-submenu--open' : 'menu-submenu--closed';

            submenuHtml = `
                <div class="menu-submenu menu-submenu--${submenuPosition} ${animationClass} ${visibleClass}" data-submenu-id="${itemId}" style="${isSubmenuOpen ? '' : 'display: none;'}">
                    ${submenuGroupsHtml.join('')}
                </div>
            `;
        }

        const hasSubmenuAttr = item.hasSubmenu === true || (item.items && item.items.length > 0);
        let leadingHtml = '';
        if (item.icon) {
            const safeIconMarkup = sanitizeHtmlFragment(
                item.icon,
                new Set(['i']),
                { i: new Set(['name', 'type', 'custom', 'folder', 'size', 'class', 'aria-hidden']) }
            );
            if (item.icon.trim().startsWith('<') && safeIconMarkup.includes('<i')) {
                leadingHtml = `<div class="list-item__leading"><span class="list-item__leading-icon">${safeIconMarkup}</span></div>`;
            } else if (!item.icon.includes('<') && !item.icon.includes('&') && !item.icon.match(/[📄📂💾⬇️❓ℹ️]/)) {
                leadingHtml = `<div class="list-item__leading"><span class="list-item__leading-icon"><i name="${escapeHtml(item.icon)}" size="md"></i></span></div>`;
            } else {
                leadingHtml = `<div class="list-item__leading"><span class="list-item__leading-icon">${escapeHtml(item.icon)}</span></div>`;
            }
        }

        let trailingIconHtml = '';
        let trailingTextHtml = '';
        if (item.trailingIcon) {
            const safeTrailingMarkup = sanitizeHtmlFragment(
                item.trailingIcon,
                new Set(['i']),
                { i: new Set(['name', 'type', 'custom', 'folder', 'size', 'class', 'aria-hidden']) }
            );
            if (item.trailingIcon.trim().startsWith('<') && safeTrailingMarkup.includes('<i')) {
                trailingIconHtml = `<span class="list-item__trailing-icon">${safeTrailingMarkup}</span>`;
            } else if (!item.trailingIcon.includes('<') && !item.trailingIcon.includes('&') && !item.trailingIcon.match(/[📄📂💾⬇️❓ℹ️]/)) {
                trailingIconHtml = `<span class="list-item__trailing-icon"><i name="${escapeHtml(item.trailingIcon)}" size="sm"></i></span>`;
            } else {
                trailingIconHtml = `<span class="list-item__trailing-icon">${escapeHtml(item.trailingIcon)}</span>`;
            }
        }
        if (item.trailingText) {
            trailingTextHtml = `<span class="list-item__trailing-text">${escapeHtml(item.trailingText)}</span>`;
        }

        if (hasSubmenuAttr && !item.trailingIcon && !item.trailingText) {
            trailingIconHtml = `<span class="list-item__trailing-icon menu-item-trailing-icon--caret"><i name="caret" size="sm"></i></span>`;
        }

        let trailingHtml = '';
        if (trailingIconHtml || trailingTextHtml) {
            trailingHtml = `<div class="list-item__trailing">${trailingIconHtml}${trailingTextHtml}</div>`;
        }

        const contentHtml = `
            <div class="list-item__content">
                ${leadingHtml}
                <div class="list-item__text">
                    <span class="list-item__primary-text">${escapeHtml(item.label || item.text || '')}</span>
                </div>
                ${trailingHtml}
            </div>
        `;

        const firstAttr = isFirst ? 'data-is-first="true"' : '';
        const lastAttr = isLast ? 'data-is-last="true"' : '';

        return `
            <div class="menu-item-wrapper" data-item-id="${itemId}">
                <div class="menu-item list-item ${activeClass} ${disabledClass} ${gapClass}" ${hasSubmenuAttr ? 'data-has-submenu="true"' : ''} ${firstAttr} ${lastAttr}>
                    ${contentHtml}
                </div>
                ${submenuHtml}
            </div>
        `;
    }

    /**
     * Convertit une structure HTML simple en format Material Design
     * @returns {void}
     */
    private _convertSimpleMenuItems(): void {
        if (!this.menuContainer || this.menuContainer.tagName !== 'UL') return;

        const listItems = Array.from(this.menuContainer.querySelectorAll('li'));
        const convertedItems: HTMLElement[] = [];
        const groups: HTMLElement[] = [];
        let currentGroup: HTMLElement | null = null;

        listItems.forEach((li, index) => {
            if (li.classList.contains('divider')) {
                if (currentGroup) {
                    groups.push(currentGroup);
                    currentGroup = null;
                }
                return;
            }

            if (li.classList.contains('optgroup')) {
                if (currentGroup) groups.push(currentGroup);
                currentGroup = document.createElement('div');
                currentGroup.className = 'menu-group';
                if (groups.length === 0) currentGroup.classList.add('menu-group--first');
                return;
            }

            const link = li.querySelector('a');
            const content = link || li;

            const wrapper = document.createElement('div');
            wrapper.className = 'menu-item-wrapper';
            wrapper.setAttribute('data-item-id', `simple-${index}`);

            const menuItem = document.createElement('div');
            menuItem.className = 'menu-item list-item';

            const itemContent = document.createElement('div');
            itemContent.className = 'list-item__content';

            const contentHTML = content.innerHTML;
            const textMatch = contentHTML.match(/>([^<]+)</);
            const iconMatch = contentHTML.match(/<i[^>]*>/);

            if (iconMatch) {
                const leading = document.createElement('div');
                leading.className = 'list-item__leading';
                const rawIconHtml = iconMatch[0] + (iconMatch[0].includes('</i>') ? '' : '</i>');
                leading.innerHTML = sanitizeHtmlFragment(
                    rawIconHtml,
                    new Set(['i']),
                    { i: new Set(['name', 'type', 'custom', 'folder', 'size', 'class', 'aria-hidden']) }
                );
                itemContent.appendChild(leading);

                const text = document.createElement('div');
                text.className = 'list-item__text';
                const primaryText = document.createElement('div');
                primaryText.className = 'list-item__primary-text';
                primaryText.textContent = textMatch ? textMatch[1].trim() : '';
                text.appendChild(primaryText);
                itemContent.appendChild(text);
            } else {
                const text = document.createElement('div');
                text.className = 'list-item__text';
                const primaryText = document.createElement('div');
                primaryText.className = 'list-item__primary-text';
                primaryText.textContent = textMatch ? textMatch[1].trim() : content.textContent || '';
                text.appendChild(primaryText);
                itemContent.appendChild(text);
            }

            menuItem.appendChild(itemContent);
            wrapper.appendChild(menuItem);

            if (!currentGroup) {
                currentGroup = document.createElement('div');
                currentGroup.className = 'menu-group';
                if (groups.length === 0) currentGroup.classList.add('menu-group--first');
            }
            currentGroup.appendChild(wrapper);
            convertedItems.push(wrapper);
        });

        if (currentGroup) groups.push(currentGroup);

        if (groups.length === 0 && convertedItems.length > 0) {
            const defaultGroup = document.createElement('div');
            defaultGroup.className = 'menu-group menu-group--first menu-group--last';
            convertedItems.forEach(item => defaultGroup.appendChild(item));
            groups.push(defaultGroup);
        }

        if (groups.length > 0) {
            groups[groups.length - 1].classList.add('menu-group--last');
        }

        if (this.menuContainer) {
            this.menuContainer.innerHTML = '';
            groups.forEach(group => this.menuContainer!.appendChild(group));
        }
    }

    /**
     * Effectue le rendu du menu
     * @returns {void}
     */
    private render(): void {
        if (!this.menuContainer) return;
        if (!this.options.items || this.options.items.length === 0) {
            this.menuContainer.innerHTML = '';
            return;
        }

        const result = this._groupItemsByDividers(this.options.items);
        const groups = result.groups;
        const visualDividers = result.visualDividers;

        const groupsHtml: string[] = [];
        groups.forEach((group, groupIndex) => {
            const isFirstGroup = groupIndex === 0;
            const isLastGroup = groupIndex === groups.length - 1;
            const groupClass = `menu-group ${isFirstGroup ? 'menu-group--first' : ''} ${isLastGroup ? 'menu-group--last' : ''}`.trim();

            const itemsHtml: string[] = [];
            group.forEach((item, itemIndex) => {
                const isFirstItem = itemIndex === 0;
                const isLastItem = itemIndex === group.length - 1;
                itemsHtml.push(this._renderMenuItem(item, 'main', 0, isFirstItem, isLastItem));

                const visualDividerAfterThisItem = visualDividers.find(d => d.groupIndex === groupIndex && d.afterItemIndex === itemIndex);
                if (visualDividerAfterThisItem) {
                    itemsHtml.push(`<div class="menu-divider" data-divider-id="${visualDividerAfterThisItem.item.id || `divider-${groupIndex}-${itemIndex}`}"></div>`);
                }
            });

            groupsHtml.push(`<div class="${groupClass}">${itemsHtml.join('')}</div>`);
        });

        const existingSubmenuStates = new Map<string, { position: 'left' | 'right', isOpen: boolean }>();
        if (this.isOpen && this.openSubmenus.size > 0) {
            this.openSubmenus.forEach((isOpen, id) => {
                if (isOpen) {
                    existingSubmenuStates.set(id, {
                        position: this.submenuPositions.get(id) || 'right',
                        isOpen: true
                    });
                }
            });
        }

        this.menuContainer.innerHTML = groupsHtml.join('');
        const coverClass = (this.options.cover ?? false) ? 'menu-container--cover' : '';
        const inDialogClass = this.menuContainer.classList.contains('menu-container--in-dialog')
            ? 'menu-container--in-dialog'
            : '';
        this.menuContainer.className = `menu-container ${this.isOpen ? 'menu-container--open' : ''} ${coverClass} ${inDialogClass}`.trim();

        if (this.isOpen && this.menuContainer) {
            requestAnimationFrame(() => {
                if (this.menuContainer) {
                    this.menuContainer.style.height = '';
                    const scrollHeight = this.menuContainer.scrollHeight;
                    if (scrollHeight <= 320) {
                        this.menuContainer.style.height = `${scrollHeight}px`;
                    } else {
                        this.menuContainer.style.height = '';
                    }
                }
            });
        }

        try {
            const icons = this.menuContainer.querySelectorAll('i[name]');
            icons.forEach(icon => IconManager.updateIcon(icon as HTMLElement));
        } catch (_) { }

        if (this.isOpen) {
            const openSubmenuIds = Array.from(this.openSubmenus.keys());
            if (openSubmenuIds.length > 0) {
                requestAnimationFrame(() => {
                    this._positionSubmenus();
                    const existingSubmenus = this.menuContainer!.querySelectorAll('.menu-submenu--existing');
                    existingSubmenus.forEach(submenu => {
                        const submenuEl = submenu as HTMLElement;
                        submenuEl.style.opacity = '1';
                        submenuEl.style.transform = 'scale(1, 1)';
                        submenuEl.style.transition = 'none';
                    });

                    openSubmenuIds.forEach(submenuId => {
                        this._manageSubmenuOverflow(submenuId);
                    });
                });
            }
        }
    }

    /**
     * Positionne tous les sous-menus ouverts
     * @returns {void}
     */
    private _positionSubmenus(): void {
        if (!this.menuContainer) return;

        const openSubmenuIds = Array.from(this.openSubmenus.keys());
        if (openSubmenuIds.length === 0) return;

        const allWrappers = this.menuContainer.querySelectorAll('.menu-item-wrapper');

        openSubmenuIds.forEach(itemId => {
            let wrapperEl: HTMLElement | null = null;
            for (const wrapper of Array.from(allWrappers)) {
                if ((wrapper as HTMLElement).getAttribute('data-item-id') === itemId) {
                    wrapperEl = wrapper as HTMLElement;
                    break;
                }
            }

            if (!wrapperEl) return;

            const menuItem = this._getMenuItemFromWrapper(wrapperEl);
            const submenu = this._getSubmenuFromWrapper(wrapperEl, itemId);

            if (!menuItem || !submenu) return;

            const submenuPosition = this.submenuPositions.get(itemId) || 'right';
            submenu.style.position = 'absolute';
            submenu.style.marginLeft = '0';
            submenu.style.marginRight = '0';
            submenu.style.paddingLeft = '0';
            submenu.style.paddingRight = '0';

            const wrapperComputed = window.getComputedStyle(wrapperEl);
            if (wrapperComputed.position === 'static') {
                wrapperEl.style.position = 'relative';
            }

            if (submenuPosition === 'right') {
                submenu.style.left = 'calc(100% - 4px)';
                submenu.style.right = 'auto';
            } else {
                submenu.style.left = 'auto';
                submenu.style.right = 'calc(100% - 4px)';
            }

            void menuItem.offsetHeight;
            void submenu.offsetHeight;

            const menuItemRect = menuItem.getBoundingClientRect();
            const wrapperRect = wrapperEl.getBoundingClientRect();

            const submenuPadding = 4;
            const submenuHeight = submenu.offsetHeight || 200;
            const viewportHeight = window.innerHeight;
            const margin = 16;
            const itemHeight = 48;

            const verticalPosition = this._calculateSubmenuVerticalPosition(menuItem, submenu);
            const isFromTop = verticalPosition === 'top';

            let topOffset: number;
            if (isFromTop) {
                const menuItemBottom = menuItemRect.top - wrapperRect.top + menuItemRect.height;
                topOffset = menuItemBottom - submenuHeight + submenuPadding;
            } else {
                topOffset = menuItemRect.top - wrapperRect.top - submenuPadding;
            }

            const calculatedBottom = wrapperRect.top + topOffset + submenuHeight;
            if (calculatedBottom > viewportHeight - margin) {
                const overflow = calculatedBottom - (viewportHeight - margin);
                const itemsToShift = Math.ceil(overflow / itemHeight);
                topOffset = topOffset - (itemsToShift * itemHeight);
                const minTopOffset = margin - wrapperRect.top - submenuPadding;
                if (topOffset < minTopOffset) {
                    topOffset = minTopOffset;
                }
            }

            submenu.style.top = `${topOffset}px`;
            submenu.style.bottom = 'auto';

            if (submenuPosition === 'right') {
                submenu.style.transformOrigin = isFromTop ? 'bottom left' : 'top left';
                submenu.setAttribute('data-open-left', 'false');
                submenu.setAttribute('data-open-right', 'true');
            } else {
                submenu.style.transformOrigin = isFromTop ? 'bottom right' : 'top right';
                submenu.setAttribute('data-open-left', 'true');
                submenu.setAttribute('data-open-right', 'false');
            }
            submenu.setAttribute('data-open-top', isFromTop ? 'true' : 'false');
            submenu.setAttribute('data-open-bottom', isFromTop ? 'false' : 'true');
            submenu.setAttribute('data-transform-origin', submenu.style.transformOrigin);
            submenu.style.visibility = 'visible';
        });
    }

    /**
     * Indique si les animations du menu doivent être ignorées (désactivées ou reduced-motion).
     * @returns {boolean}
     * @private
     */
    private _shouldSkipMenuMotion(): boolean {
        return this.options.enableAnimations === false || getPreferReducedMotion();
    }

    /**
     * Échelle de départ alignée sur `$menu-animation-scale-start` (token SCSS / CSS var).
     * @returns {string}
     * @private
     */
    private _getMenuScaleStartTransform(context?: HTMLElement): string {
        if (typeof window === 'undefined' || typeof document === 'undefined') {
            return `scale(${MenuSpecs.motion.scaleStart})`;
        }
        const el = context ?? this.menuContainer ?? document.documentElement;
        const raw = getComputedStyle(el).getPropertyValue('--k3ui-menu-animation-scale-start').trim();
        const scale = raw ? parseFloat(raw) : MenuSpecs.motion.scaleStart;
        return `scale(${Number.isFinite(scale) ? scale : MenuSpecs.motion.scaleStart})`;
    }

    /**
     * Parse une durée CSS (ms ou s) en millisecondes.
     * @param {string} raw
     * @returns {number}
     * @private
     */
    private _parseDurationMs(raw: string): number {
        const trimmed = raw.trim();
        if (!trimmed) return 0;
        if (trimmed.endsWith('ms')) return parseFloat(trimmed) || 0;
        if (trimmed.endsWith('s')) return (parseFloat(trimmed) || 0) * 1000;
        return parseFloat(trimmed) || 0;
    }

    /**
     * Lit la durée d'un token motion M3 depuis le DOM (SSR-safe).
     * @param {string} varName
     * @param {HTMLElement} [context]
     * @returns {number}
     * @private
     */
    private _readMotionTokenDurationMs(varName: string, context?: HTMLElement): number {
        if (typeof window === 'undefined' || typeof document === 'undefined') return 0;
        const el = context ?? this.menuContainer ?? document.documentElement;
        return this._parseDurationMs(getComputedStyle(el).getPropertyValue(varName));
    }

    /**
     * Durée effective d'animation (override optionnel ou max spatial/effects tokens).
     * @param {'in' | 'out'} phase
     * @param {HTMLElement} [context]
     * @returns {number}
     * @private
     */
    private _getAnimationDurationMs(phase: 'in' | 'out', context?: HTMLElement): number {
        const override = phase === 'in' ? this.options.inDuration : this.options.outDuration;
        if (override !== undefined) return override;
        const spatial = this._readMotionTokenDurationMs('--md-sys-motion-spatial-fast-duration', context);
        const effects = this._readMotionTokenDurationMs('--md-sys-motion-effects-fast-duration', context);
        return Math.max(spatial, effects);
    }

    /**
     * Construit une transition M3 : transform → spatial-fast, opacity → effects-fast.
     * @param {number} [durationOverride] Durée en ms (override utilisateur) ; sinon tokens CSS
     * @returns {string}
     * @private
     */
    private _buildMenuMotionTransition(durationOverride?: number): string {
        const spatialDuration =
            durationOverride !== undefined ? `${durationOverride}ms` : MENU_M3_SPATIAL_DURATION;
        const effectsDuration =
            durationOverride !== undefined ? `${durationOverride}ms` : MENU_M3_EFFECTS_DURATION;

        return [
            `transform ${spatialDuration} ${MENU_M3_SPATIAL_EASING}`,
            `opacity ${effectsDuration} ${MENU_M3_EFFECTS_EASING}`,
        ].join(', ');
    }

    /**
     * Anime l'entrée du menu (M3 Expressive : spatial-fast + effects-fast).
     * @private
     */
    private _animateMenuIn(): void {
        if (!this.menuContainer) return;

        const scaleStart = this._getMenuScaleStartTransform();

        if (this._shouldSkipMenuMotion()) {
            this.menuContainer.style.transition = '';
            this.menuContainer.style.opacity = '1';
            this.menuContainer.style.transform = 'scale(1)';
            this.menuContainer.classList.add('menu-container--open');
            return;
        }

        const durationOverride = this.options.inDuration;

        // 1. État de départ
        this.menuContainer.style.transition = 'none';
        this.menuContainer.style.opacity = '0';
        this.menuContainer.style.transform = scaleStart;

        // 2. Force Reflow
        void this.menuContainer.offsetWidth;

        // 3. État d'arrivée — tokens M3 (data-motion-scheme)
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (!this.menuContainer) return;
                this.menuContainer.style.transition = this._buildMenuMotionTransition(durationOverride);
                this.menuContainer.style.opacity = '1';
                this.menuContainer.style.transform = 'scale(1)';
                this.menuContainer.classList.add('menu-container--open');
            });
        });
    }

    /**
     * Anime l'entrée d'un sous-menu (translateX spatial-fast, opacity effects-fast).
     * @param {HTMLElement} submenu
     * @param {'left' | 'right'} horizontalPosition
     * @returns {void}
     */
    private _animateSubmenuIn(submenu: HTMLElement, horizontalPosition: 'left' | 'right'): void {
        const savedTop = submenu.style.top;
        const savedLeft = submenu.style.left;

        const translateStart = horizontalPosition === 'right' ? '-8px' : '8px';

        if (this._shouldSkipMenuMotion()) {
            submenu.style.opacity = '1';
            submenu.style.transform = 'translateX(0)';
            submenu.style.transition = '';
            if (savedTop) submenu.style.top = savedTop;
            if (savedLeft) submenu.style.left = savedLeft;
            return;
        }

        const durationOverride = this.options.inDuration;

        submenu.style.transition = 'none';
        submenu.style.opacity = '0';
        submenu.style.transform = `translateX(${translateStart})`;

        if (savedTop) submenu.style.top = savedTop;
        if (savedLeft) submenu.style.left = savedLeft;

        void submenu.offsetWidth;

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                submenu.style.transition = this._buildMenuMotionTransition(durationOverride);
                submenu.style.opacity = '1';
                submenu.style.transform = 'translateX(0)';
            });
        });
    }

    /**
     * Anime la sortie d'un sous-menu (translateX spatial-fast, opacity effects-fast).
     * @param {HTMLElement} submenu
     * @param {'left' | 'right'} horizontalPosition
     * @returns {void}
     */
    private _animateSubmenuOut(submenu: HTMLElement, horizontalPosition: 'left' | 'right'): void {
        const savedTop = submenu.style.top;
        const savedLeft = submenu.style.left;

        const translateEnd = horizontalPosition === 'right' ? '-8px' : '8px';

        if (this._shouldSkipMenuMotion()) {
            submenu.style.opacity = '0';
            submenu.style.transform = 'translateX(0)';
            submenu.style.transition = '';
            if (savedTop) submenu.style.top = savedTop;
            if (savedLeft) submenu.style.left = savedLeft;
            return;
        }

        const durationOverride = this.options.outDuration;
        const durationMs = this._getAnimationDurationMs('out', submenu);

        submenu.style.transition = this._buildMenuMotionTransition(durationOverride);
        submenu.style.opacity = '0';
        submenu.style.transform = `translateX(${translateEnd})`;

        setTimeout(() => {
            if (savedTop) submenu.style.top = savedTop;
            if (savedLeft) submenu.style.left = savedLeft;
        }, durationMs);
    }

    /**
     * Anime la sortie du menu principal (M3 Expressive : spatial-fast + effects-fast).
     * @private
     */
    private _animateMenuOut(): void {
        if (!this.menuContainer) return;

        const scaleStart = this._getMenuScaleStartTransform();

        if (this._shouldSkipMenuMotion()) {
            this.menuContainer.style.transition = '';
            this.menuContainer.style.display = 'none';
            this.menuContainer.style.opacity = '0';
            this.menuContainer.style.transform = scaleStart;
            this.menuContainer.classList.remove('menu-container--open');
            return;
        }

        const durationOverride = this.options.outDuration;
        const durationMs = this._getAnimationDurationMs('out');

        requestAnimationFrame(() => {
            if (!this.menuContainer) return;
            this.menuContainer.style.transition = this._buildMenuMotionTransition(durationOverride);
            this.menuContainer.style.opacity = '0';
            this.menuContainer.style.transform = scaleStart;
        });

        if (this._animateMenuOutTimeout) clearTimeout(this._animateMenuOutTimeout);

        this._animateMenuOutTimeout = window.setTimeout(() => {
            if (this.menuContainer && !this.isOpen) {
                this.menuContainer.style.display = 'none';
                this.menuContainer.style.transform = scaleStart;
                this.menuContainer.classList.remove('menu-container--open');
            }
            this._animateMenuOutTimeout = undefined;
        }, durationMs);
    }

    /**
     * Récupère l'ancêtre le plus proche correspondant à une condition
     * @param {HTMLElement} el
     * @param condition Prédicat sur l’ancêtre courant
     * @returns {HTMLElement | null}
     */
    private _getClosestAncestor(el: HTMLElement, condition: (ancestor: Node) => boolean): HTMLElement | null {
        let ancestor = el.parentNode;
        while (ancestor !== null && ancestor !== document) {
            if (condition(ancestor)) {
                return ancestor as HTMLElement;
            }
            ancestor = ancestor.parentElement;
        }
        return null;
    }

    /**
     * Détermine le conteneur actuel du menu
     * @returns {HTMLElement}
     */
    private _getCurrentContainer(): HTMLElement {
        if (!this.triggerElement) return document.body;

        let closestOverflowParent: HTMLElement = this._getClosestAncestor(
            this.triggerElement,
            (ancestor) =>
                ancestor instanceof HTMLElement &&
                !['HTML', 'BODY'].includes(ancestor.tagName) &&
                getComputedStyle(ancestor).overflow !== 'visible'
        ) || (this.triggerElement.parentElement as HTMLElement) || document.body;

        const isInNavbar = !!this.triggerElement.closest('.navbar-select-container') || !!this.triggerElement.closest('.navbar-menu-container');
        const isInChipSelect = !!this.triggerElement.closest('.chip-select-container');
        const isInDialog = !!this.triggerElement.closest('.dialog, k3ui-dialog, [role="dialog"]');
        let container: HTMLElement = closestOverflowParent;

        if (isInNavbar) {
            const navbarContainer = this.triggerElement.closest('.navbar-select-container') || this.triggerElement.closest('.navbar-menu-container');
            container = (navbarContainer as HTMLElement) || document.body;
        } else if (isInChipSelect) {
            const chipContainer = this.triggerElement.closest('.chip-select-container');
            container = (chipContainer as HTMLElement) || document.body;
        } else if (isInDialog) {
            const dialogContainer = this.triggerElement.closest('.dialog, k3ui-dialog, [role="dialog"]');
            container = (dialogContainer as HTMLElement) || document.body;
        }

        return container;
    }

    /**
     * Positionne le menu et prépare l'animation
     * L'animation est déléguée au CSS via les classes .menu--open et .menu--closing
     * @private
     */
    private _positionMenu(container?: HTMLElement, onFirstUpdateCallback?: () => void): void {
        if (!this.menuContainer || !this.triggerElement) return;

        // 1. Nettoyage instance précédente
        if (this._floatingCleanup) {
            this._floatingCleanup();
            this._floatingCleanup = null;
        }

        // 2. Déterminer si le trigger est dans une AppBar (avant éventuel déplacement du menu)
        const isInAppBar = !!this.triggerElement.closest('k3ui-appbar, .appbar, [role="banner"]');

        // 3. Déplacer dans le body (Indispensable pour éviter les coupures overflow),
        //    sauf pour les menus dans une AppBar qui utilise des transforms (reveal) :
        //    on laisse alors le menu dans le même contexte de transformation pour qu'il reste visuellement ancré au bouton.
        const isInDialog = !!this.triggerElement.closest('.dialog, k3ui-dialog, [role="dialog"]');
        if (!this.options.menuEl &&
            this.menuContainer.parentElement !== document.body &&
            !isInAppBar) {
            (this.menuContainer as K3uiMenuContainerElement).__originalParent =
                this.menuContainer.parentElement ?? undefined;
            document.body.appendChild(this.menuContainer);
        }

        // Au-dessus du dialog (surface ~2001) quand le trigger est dans un dialog
        this.menuContainer.classList.toggle('menu-container--in-dialog', isInDialog);

        // 4. Préparation critique pour le calcul de dimensions
        // On désactive temporairement les transitions et on force scale(1) pour mesurer
        this.menuContainer.classList.remove('menu-container--open');
        this.menuContainer.style.transition = 'none';
        this.menuContainer.style.display = 'block';
        this.menuContainer.style.visibility = 'visible';
        this.menuContainer.style.opacity = '0';
        this.menuContainer.style.transform = 'none'; // Reset transform pour mesure précise

        // Force reflow pour appliquer les styles
        void this.menuContainer.offsetWidth;

        // 5. Configuration
        // Calcul intelligent du placement (prend en compte floating--right)
        const placement = (this._calculateMenuPlacement() || 'bottom-start') as Placement;
        const isTriggerFixed = !!this._getClosestAncestor(
            this.triggerElement,
            (ancestor) =>
                ancestor instanceof HTMLElement && getComputedStyle(ancestor).position === 'fixed'
        );
        // Strategy 'fixed' uniquement si un ancêtre est réellement positionné en fixed.
        // Pour les AppBar non fixées (reveal/scroll), on garde 'absolute' pour éviter les décalages visuels.
        const positionStrategy = isTriggerFixed ? ('fixed' as const) : ('absolute' as const);
        // Dans une AppBar en haut de page, ajouter un léger offset pour que le menu
        // ne soit pas collé / partiellement masqué par le bord supérieur de la fenêtre.
        const offsetVal = isInAppBar ? 8 : (this.options.cover ? 0 : 4);

        // 5. Fonction de mise à jour de la position
        const floatingMiddleware = [
            offset(offsetVal),
            flip({ padding: 8 }),
            shift({ padding: 8 }),
            size({
                padding: 8,
                apply({ availableWidth, availableHeight, elements }) {
                    Object.assign(elements.floating.style, {
                        maxWidth: `${Math.max(100, availableWidth)}px`,
                        maxHeight: `${Math.max(100, availableHeight)}px`,
                    });
                },
            }),
        ] as NonNullable<ComputePositionConfig['middleware']>;

        const updatePosition = async () => {
            const result = await computePosition(this.triggerElement!, this.menuContainer!, {
                placement,
                strategy: positionStrategy,
                middleware: floatingMiddleware,
            });

            if (!this.menuContainer) return;

            // S'assurer que le menu est bien affiché (fixed = coordonnées viewport, reste sous le trigger au scroll)
            this.menuContainer.style.display = 'block';
            this.menuContainer.style.position = positionStrategy;

            // Appliquer la position
            this.menuContainer.style.left = `${Math.round(result.x)}px`;
            this.menuContainer.style.top = `${Math.round(result.y)}px`;

            // Définir l'origine de l'animation selon le placement
            const [side, align] = result.placement.split('-');
            const originY = side === 'top' ? 'bottom' : 'top';
            const originX = align === 'end' ? 'inline-end' : (align === 'start' ? 'inline-start' : 'center');
            this.menuContainer.style.transformOrigin = `${originY} ${originX}`;
        };

        // 6. Premier calcul de position (synchrone pour l'animation)
        updatePosition().then(() => {
            // Déclencher l'animation d'entrée après le premier positionnement
            this._animateMenuIn();
            if (onFirstUpdateCallback) onFirstUpdateCallback();
        });

        // 7. Démarrer autoUpdate pour les mises à jour suivantes
        this._floatingCleanup = autoUpdate(
            this.triggerElement,
            this.menuContainer,
            updatePosition
        );

        // Gestion classe cover
        if (this.options.cover) this.menuContainer.classList.add('menu-container--cover');
        else this.menuContainer.classList.remove('menu-container--cover');
    }

    /**
     * Restaure le parent original du conteneur de menu
     * @returns {void}
     */
    private _restoreOriginalParent(): void {
        const container = this.menuContainer as K3uiMenuContainerElement | null;
        if (container?.__originalParent) {
            const originalParent = container.__originalParent;
            if (originalParent.isConnected && container.parentElement === document.body) {
                originalParent.appendChild(container);
            }
            delete container.__originalParent;
        }
    }

    /**
         * Recalcule la position du menu
         */
    recalculateDimensions = (): void => {
        // autoUpdate gère automatiquement le recalcul, pas besoin de l'appeler manuellement
        // Cette méthode est conservée pour la compatibilité API
    };

    /**
         * Ouvre le menu
         */
    open = (): void => {
        if (this.isOpen) return;

        // CORRECTION "S'ouvre une fois" : Annuler fermetures en attente
        if (this._animateMenuOutTimeout) {
            clearTimeout(this._animateMenuOutTimeout);
            this._animateMenuOutTimeout = undefined;
        }
        if (this._closeTimeout) {
            clearTimeout(this._closeTimeout);
            this._closeTimeout = undefined;
        }

        this.isOpen = true;
        this.openMenus.set('main', true);

        // Positionner PUIS animer
        this._positionMenu(undefined, () => {
            // Callback optionnel si besoin
        });

        // Setup events
        this._setupTemporaryEventHandlers();
        setAriaAttribute(this.el, 'expanded', true);
        if (this.triggerElement) {
            setAriaAttribute(this.triggerElement, 'expanded', true);
        }
        // autoFocus : par défaut true ; Autocomplete/Select editable passent false pour garder le focus sur l’input
        if (this.options.autoFocus !== false) {
            this._focusFirstMenuItem();
        }

        // Callback utilisateur
        if (this.options.onOpenStart) this.options.onOpenStart(this.el);
        this.el.dispatchEvent(new CustomEvent('onOpenStart', { bubbles: true }));
    };

    /**
     * Ferme le menu
     * @returns {void}
     */
    close = (): void => {
        if (!this.isOpen) return;

        if (this._closeTimeout) {
            clearTimeout(this._closeTimeout);
            this._closeTimeout = undefined;
        }

        if (this._animateMenuOutTimeout) {
            clearTimeout(this._animateMenuOutTimeout);
            this._animateMenuOutTimeout = undefined;
        }

        this.isOpen = false;
        this.openMenus.clear();
        this.openSubmenus.clear();
        this.submenuPositions.clear();
        this._clearAllActiveVisual();
        this._pointerInputActive = false;
        this._submenuCloseTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
        this._submenuCloseTimeouts.clear();
        this._cancelSubmenuOpenTimeout();

        if (this._floatingCleanup) {
            this._floatingCleanup();
            this._floatingCleanup = null;
        }

        const triggerToFocus = this.triggerElement;
        setAriaAttribute(this.el, 'expanded', false);
        if (this.triggerElement) {
            setAriaAttribute(this.triggerElement, 'expanded', false);
        }

        if (typeof this.options.onCloseStart === 'function') {
            this.options.onCloseStart.call(this, this.el);
        }

        this.el.dispatchEvent(new CustomEvent('onCloseStart', { bubbles: true }));
        this._animateMenuOut();
        this._removeTemporaryEventHandlers();

        if (this.options.restoreFocus !== false && triggerToFocus) {
            try { triggerToFocus.focus(); } catch (_) { }
        }

        this._closeTimeout = window.setTimeout(() => {
            this._closeTimeout = undefined;
            if (!this.el) {
                return;
            }
            if (!this.options.menuEl) {
                this.render();
            }
            this.el.removeAttribute('tabindex');
            if (typeof this.options.onCloseEnd === 'function') {
                this.options.onCloseEnd.call(this, this.el);
            }
            this.el.dispatchEvent(new CustomEvent('onCloseEnd', { bubbles: true }));
        }, this._getAnimationDurationMs('out'));
    };

    /**
     * Met à jour les items du menu
     * @param {MenuItem[]} items
     * @returns {void}
     */
    setItems(items: MenuItem[]): void {
        this.options.items = items;
        this.render();
    }

    /**
     * Met à jour les options du composant
     * @param {Partial<MenuOptions>} newOptions
     * @returns {void}
     */
    updateOptions(newOptions: Partial<MenuOptions>): void {
        const oldHover = this.options.hover ?? false;
        const newHover = newOptions.hover ?? false;
        const hoverChanged = newOptions.hover !== undefined && newHover !== oldHover;

        Object.assign(this.options, newOptions);

        if (hoverChanged || (!this.options.hover && this._triggerMouseInstance)) {
            if (this.menuContainer) {
                if (this._boundHandleMenuContainerMouseEnter) {
                    this.menuContainer.removeEventListener('mouseenter', this._boundHandleMenuContainerMouseEnter);
                    this._boundHandleMenuContainerMouseEnter = undefined;
                }
                if (this._boundHandleMenuContainerMouseLeave) {
                    this.menuContainer.removeEventListener('mouseleave', this._boundHandleMenuContainerMouseLeave);
                    this._boundHandleMenuContainerMouseLeave = undefined;
                }
            }

            if (this._triggerMouseInstance && !this.options.hover) {
                this._triggerMouseInstance.setEnabled(false);
                this._triggerMouseInstance.destroy();
                this._triggerMouseInstance = undefined;
            }

            this._setupEventHandlers();
        }

        if (this.isOpen) {
            this._positionMenu();
        }

        this.render();
    }

    /**
         * Détruit l'instance
         */
    destroy(): void {
        Menu._logger.debug('Destroying menu instance');

        if (this._closeTimeout) {
            clearTimeout(this._closeTimeout);
            this._closeTimeout = undefined;
        }
        if (this._animateMenuOutTimeout) {
            clearTimeout(this._animateMenuOutTimeout);
            this._animateMenuOutTimeout = undefined;
        }

        this._submenuCloseTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
        this._submenuCloseTimeouts.clear();
        this._cancelSubmenuOpenTimeout();
        this._clearAllActiveVisual();
        this._pointerInputActive = false;

        // Arrêt propre du moteur
        if (this._floatingCleanup) {
            this._floatingCleanup();
            this._floatingCleanup = null;
        }

        // Cleanup de tous les event listeners via eventListenerManager
        this._eventCleanups.forEach(cleanup => cleanup());
        this._eventCleanups = [];

        this._removeEventHandlers();
        this._restoreOriginalParent();

        // On ferme sans animation pour être instantané
        this.isOpen = false;
        if (this.menuContainer) this.menuContainer.style.display = 'none';

        const index = Menu._menus.indexOf(this);
        if (index > -1) Menu._menus.splice(index, 1);

        if (this.menuContainer && this.menuContainer.parentNode && !this.options.menuEl) {
            this.menuContainer.parentNode.removeChild(this.menuContainer);
        }
        super.destroy();
    }
}

/**
 * Custom Element <k3ui-menu>
 * @description Permet l'utilisation de <k3ui-menu> dans le HTML. Initialisation par AutoInit.
 */
if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-menu')) {
    const K3UIMenuElementBase = createK3UIElementClass(Menu);

    class K3UIMenuElement extends K3UIMenuElementBase {
        /**
         * Définit les items du menu (instance créée par AutoInit)
         */
        setItems(items: MenuItem[]): void {
            const instance = Menu.getInstance(this);
            if (instance) {
                instance.setItems(items);
            }
        }
    }

    customElements.define('k3ui-menu', K3UIMenuElement);
}