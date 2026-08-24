/**
 * @fileoverview Composant Select pour K3UI
 * @description Composant de sélection basé sur Material Design 3 avec support des groupes, synchronisation et accessibilité
 * @module components/Select
 */

import { Component } from '../core/base/Component';
import { SelectOptions, MenuOptions, MenuItem } from '../types/components';
import { toComponentClassDef } from '../types/components/component-base';
import { setMenuTriggerElement, setSelectMenuItemRealOption } from '../types/dom/k3ui-menu-element';
import { PriorityLevel } from '../types/base';
import { KElement, InitElements } from '../types/base';
import { generateGuid } from '../utils/helpers';
import { storage } from '../utils/storage';
import { Menu } from './Menu';
import { ButtonSplit } from './ButtonSplit';
import { Checkbox } from './Checkbox';
import { IconManager, LocaleManager, ThemeManager } from '../core/managers';
import { setAriaAttribute, setAriaAttributes } from '../utils/dom/aria';
import { sanitizeHtmlFragment } from '../utils/dom/sanitize';
import { getSelectDefaults } from '../specs/components/select.specs';

/**
 * Options par défaut du composant Select
 * @description Extrait depuis les specs pour garantir la cohérence
 * @private
 */
const _defaults: SelectOptions = getSelectDefaults();

/**
 * Structure de valeur pour les options du select
 * @private
 */
type ValueStruct = {
    /** Option HTML native */
    el: HTMLOptionElement;
    /** Élément DOM virtuel dans le menu */
    optionEl: HTMLElement;
};

/**
 * Classe du composant Select
 * @description Gère la transformation d'un select HTML natif en composant Material Design 3 avec menu
 * @class Select
 * @extends {Component<SelectOptions>}
 */
export class Select extends Component<SelectOptions> {
    declare el: HTMLSelectElement;

    /**
     * Indique si c'est un select multiple
     * @public
     */
    isMultiple: boolean;

    /**
     * Label associé à l'élément select
     * @public
     */
    labelEl: HTMLLabelElement | null = null;

    /**
     * Élément k3ui-menu des options menu
     * @public
     */
    menuList!: HTMLElement;
    private trailingIconObserver: MutationObserver | null = null;

    /** Coalescence des syncs trailing icons (une frame max) */
    private trailingIconSyncRaf: number | null = null;

    /**
     * Input texte qui affiche l'option actuellement sélectionnée
     * @public
     */
    input!: HTMLInputElement;

    /**
     * Instance du composant Menu pour ce select
     * @public
     */
    menu: Menu | null = null;

    /**
     * Élément wrapper du select
     * @public
     */
    wrapper!: HTMLDivElement;

    /**
     * Options du select (OPTION et OPTGROUP)
     * @public
     */
    selectOptions!: (HTMLOptionElement | HTMLOptGroupElement)[];

    /**
     * Bouton élément si présent dans le wrapper (pour navbar/chip)
     * @public
     */
    buttonEl: HTMLButtonElement | null = null;

    /**
     * Conteneur affiché sous l'input en mode multiple : liste des valeurs sélectionnées (balises).
     * @private
     */
    private multipleValuesContainer: HTMLElement | null = null;

    /**
     * Valeurs des options (mapping entre options natives et éléments virtuels)
     * @private
     */
    private _values: ValueStruct[] = [];

    /**
     * Index de tabulation natif du select
     * @public
     */
    nativeTabIndex: number;

    /**
     * Niveau de priorité du composant
     * @readonly
     * @public
     */
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    /**
     * Constructeur du composant Select
     * @param {HTMLSelectElement} el - Élément select HTML
     * @param {Partial<SelectOptions>} [options={}] - Options de configuration
     * @constructor
     */
    constructor(el: HTMLSelectElement, options: Partial<SelectOptions> = {}) {
        super(el, options, toComponentClassDef(Select));

        // Détecter le variant depuis l'attribut HTML, la classe du conteneur parent ou les options
        this._detectVariant(el, options);

        // Lire l'attribut leading-icon depuis l'élément HTML
        if (el.hasAttribute('leading-icon')) {
            options.leadingIcon = el.getAttribute('leading-icon');
        }

        // Initialiser les propriétés
        this.isMultiple = this.el.multiple;
        this.nativeTabIndex = this.el.tabIndex ?? -1;
        this.el.tabIndex = -1;
        this._values = [];

        // Initialiser le composant
        this.init();
    }

    /**
     * Récupère l'instance Select associée à un élément
     * @param {HTMLElement} el - Élément select
     * @returns {Select} Instance du select ou undefined
     * @static
     */
    static getInstance(el: HTMLElement): Select | undefined {
        return Component.getInstance(el) as Select | undefined;
    }

    /**
     * Retourne les options par défaut du composant
     * @returns {SelectOptions} Options par défaut
     * @static
     */
    static get defaults(): SelectOptions {
        return _defaults;
    }

    /**
     * Initialise une instance de Select
     * @param {HTMLSelectElement} el - Élément HTML select
     * @param {Partial<SelectOptions>} [options] - Options du composant
     * @returns {Select} Instance du select
     * @static
     */
    static init(el: HTMLSelectElement, options?: Partial<SelectOptions>): Select;

    /**
     * Initialise plusieurs instances de Select
     * @param {InitElements<HTMLSelectElement | KElement>} els - Collection d'éléments HTML
     * @param {Partial<SelectOptions>} [options] - Options du composant
     * @returns {Select[]} Tableau d'instances de select
     * @static
     */
    static init(
        els: InitElements<HTMLSelectElement | KElement>,
        options?: Partial<SelectOptions>
    ): Select[];

    /**
     * Implémentation de la méthode init
     * @param {HTMLSelectElement | InitElements<HTMLSelectElement | KElement>} els - Élément(s) HTML
     * @param {Partial<SelectOptions>} [options={}] - Options du composant
     * @returns {Select | Select[]} Instance(s) du select
     * @static
     */
    static init(
        els: HTMLSelectElement | InitElements<HTMLSelectElement | KElement>,
        options: Partial<SelectOptions> = {}
    ): Select | Select[] {
        if (els instanceof Element) {
            const existing = Select.getInstance(els as HTMLElement);
            if (existing) {
                return existing;
            }
            return new Select(els as HTMLSelectElement, options);
        } else if (!!els && els.length) {
            const instances = [];
            for (let i = 0; i < els.length; i++) {
                const existing = Select.getInstance(els[i] as HTMLElement);
                if (existing) {
                    instances.push(existing);
                } else {
                    instances.push(new Select(els[i] as HTMLSelectElement, options));
                }
            }
            return instances;
        }
        return [];
    }

    /**
     * Détecte le variant depuis l'attribut HTML, la classe du conteneur parent ou les options
     * @private
     * @param {HTMLSelectElement} el - Élément select
     * @param {Partial<SelectOptions>} options - Options du composant
     * @returns {void}
     */
    private _detectVariant(el: HTMLSelectElement, options: Partial<SelectOptions>): void {
        const variantExplicitlySet = options && 'variant' in options && options.variant !== undefined;

        if (el.hasAttribute('variant')) {
            const variantAttr = el.getAttribute('variant');
            if (variantAttr === 'filled' || variantAttr === 'outlined') {
                this.options.variant = variantAttr;
            }
        } else if (!variantExplicitlySet) {
            let parentContainer: HTMLElement | null = null;

            // Essayer d'abord avec parentElement (plus direct)
            let current: HTMLElement | null = el.parentElement;
            while (current) {
                if (current.classList.contains('input-field') && !current.classList.contains('select-wrapper')) {
                    parentContainer = current;
                    break;
                }
                current = current.parentElement;
            }

            // Si pas trouvé, essayer avec closest (mais exclure les select-wrapper)
            if (!parentContainer) {
                const allInputFields = Array.from(document.querySelectorAll('.input-field'));
                parentContainer = allInputFields.find(container => {
                    return container.contains(el) && !container.classList.contains('select-wrapper');
                }) as HTMLElement | null;
            }

            if (parentContainer) {
                if (parentContainer.classList.contains('filled')) {
                    this.options.variant = 'filled';
                } else if (parentContainer.classList.contains('outlined')) {
                    this.options.variant = 'outlined';
                }
            }
        }
    }

    /**
     * Initialise le composant
     * @private
     * @returns {void}
     */
    private init(): void {
        if (this.el.classList.contains('browser-default')) return;

        this._setupMenu();
        this._setupEventHandlers();
        this._loadGroupPreference();
    }

    /**
     * Configure les gestionnaires d'événements
     * @private
     * @returns {void}
     */
    private _setupEventHandlers(): void {
        // Gestionnaires pour les options du menu (menu-item)
        this.registerEvent(this.menuList, 'click', this._handleOptionClick as EventListener, true);
        this.registerEvent(this.menuList, 'keydown', this._handleMenuKeydown as EventListener, true);

        // Gestionnaire pour les changements du select natif
        this.registerEvent(this.el, 'change', this._handleSelectChange);
    }

    /**
     * Gestionnaire clavier des options du menu (activation via Espace/Entrée)
     * @private
     * @param {KeyboardEvent} e - Événement clavier
     * @returns {void}
     */
    private _handleMenuKeydown = (e: KeyboardEvent): void => {
        if (e.key === ' ' || e.key === 'Enter') {
            const menuItem = (e.target as HTMLElement).closest('menu-item');
            if (menuItem) {
                this._handleOptionClick(e);
            }
        }
    };

    /**
     * Gestionnaire de clic sur le trigger (input ou bouton) quand le wrapper sert de trigger au menu
     * @description Ouvre/ferme le menu et empêche Menu.ts de traiter le même clic une seconde fois
     * @private
     * @param {MouseEvent} e - Événement de clic
     * @returns {void}
     */
    private _handleTriggerClick = (e: MouseEvent): void => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        if (this.menu) {
            if (this.menu.isOpen) {
                this.menu.close();
            } else {
                this.menu.open();
            }
        }
    };

    /**
     * Gestionnaire de changement du select natif
     * @private
     * @returns {void}
     */
    private _handleSelectChange = (): void => {
        this._setValueToInput();
        this._setSelectedStates();
    };

    /**
     * Gestionnaire de clic sur une option du menu
     * @private
     * @param {MouseEvent | KeyboardEvent} e - Événement de clic ou clavier
     * @returns {void}
     */
    private _handleOptionClick = (e: MouseEvent | KeyboardEvent): void => {

        // Menu.ts génère une structure avec .menu-item-wrapper qui contient le menu-item custom element
        // Il faut remonter jusqu'au wrapper puis trouver le menu-item dedans
        let virtualOption: HTMLElement | null = null;

        // Essayer d'abord avec closest('menu-item')
        virtualOption = (e.target as HTMLElement).closest('menu-item') as HTMLElement;

        // Si pas trouvé, chercher via le wrapper
        if (!virtualOption) {
            const wrapper = (e.target as HTMLElement).closest('.menu-item-wrapper') as HTMLElement;
            if (wrapper) {
                const itemId = wrapper.getAttribute('data-item-id');
                if (itemId) {
                    virtualOption = this.menuList.querySelector(`menu-item[data-id="${itemId}"]`) as HTMLElement;
                }
            }
        }

        // Si toujours pas trouvé, remonter manuellement dans la hiérarchie
        if (!virtualOption) {
            let current = e.target as HTMLElement;
            while (current && current !== this.menuList) {
                if (current.tagName === 'MENU-ITEM') {
                    virtualOption = current;
                    break;
                }
                // Chercher dans les enfants si on est dans un wrapper
                if (current.classList.contains('menu-item-wrapper')) {
                    const itemId = current.getAttribute('data-item-id');
                    if (itemId) {
                        virtualOption = this.menuList.querySelector(`menu-item[data-id="${itemId}"]`) as HTMLElement;
                        if (virtualOption) break;
                    }
                }
                current = current.parentElement as HTMLElement;
            }
        }

        if (virtualOption) {
            this._selectOptionElement(virtualOption);
        }
        e.stopPropagation();
    };

    /**
     * Gestionnaire de clic sur un item du menu via le callback onItemClick de Menu.ts
     * Cette méthode est appelée par Menu.ts quand un item est cliqué, même si le
     * menu-container a été déplacé dans le body (ce qui empêche les événements
     * attachés à menuList de capter les clics)
     * @private
     * @param item - Objet MenuItem ou élément legacy passé par Menu.ts
     * @returns {void}
     */
    private _handleMenuItemClick(item: MenuItem | HTMLElement): void {
        // Menu.ts passe un objet MenuItem, pas un HTMLElement
        // L'objet MenuItem contient un id qu'on peut utiliser pour trouver le menu-item element
        let virtualOption: HTMLElement | null = null;

        // Si c'est un HTMLElement (ancien comportement)
        if (item instanceof HTMLElement) {
            if (item.tagName === 'MENU-ITEM') {
                virtualOption = item;
            } else {
                const itemId = item.getAttribute('data-item-id');
                if (itemId && this.menuList) {
                    virtualOption = this.menuList.querySelector(`menu-item[data-id="${itemId}"]`) as HTMLElement;
                }
                if (!virtualOption) {
                    virtualOption = item.querySelector('menu-item') as HTMLElement;
                }
            }
        } else if (item && typeof item === 'object') {
            // C'est un objet MenuItem de Menu.ts
            // Utiliser l'id pour trouver le menu-item correspondant
            const itemId = item.id || item.value;
            if (itemId && this.menuList) {
                virtualOption = this.menuList.querySelector(`menu-item[data-id="${itemId}"]`) as HTMLElement;
            }

            // Si pas trouvé par id, essayer par valeur
            if (!virtualOption && item.value && this.menuList) {
                virtualOption = this.menuList.querySelector(`menu-item[data-value="${item.value}"]`) as HTMLElement;
            }
        }

        if (virtualOption) {
            this._selectOptionElement(virtualOption);
        }
    }

    /**
     * Compare deux tableaux pour l'égalité
     * @private
     * @template T
     * @template E
     * @param {T[]} a - Premier tableau
     * @param {(E | T)[]} b - Deuxième tableau
     * @returns {boolean} true si les tableaux sont égaux
     */
    private _arraysEqual<T, E>(a: T[], b: (E | T)[]): boolean {
        if (a === b) return true;
        if (a == null || b == null) return false;
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; ++i) if (a[i] !== b[i]) return false;
        return true;
    }

    /**
     * Sélectionne un élément d'option dans le menu
     * @private
     * @param {HTMLElement} virtualOption - Élément virtuel de l'option
     * @returns {void}
     */
    private _selectOptionElement(virtualOption: HTMLElement): void {
        if (
            !virtualOption.hasAttribute('data-disabled') &&
            virtualOption.tagName.toLowerCase() === 'menu-item'
        ) {
            const value = this._values.find((value) => value.optionEl === virtualOption);
            const previousSelectedValues = this.getSelectedValues();

            if (this.isMultiple) {
                if (value) this._toggleEntryFromArray(value);
            } else {
                this._deselectAll();
                if (value) this._selectValue(value);
            }

            this._setValueToInput();

            const actualSelectedValues = this.getSelectedValues();
            const selectionHasChanged = !this._arraysEqual(previousSelectedValues, actualSelectedValues);

            if (selectionHasChanged) {
                if (typeof this.options.onOptionSelect === 'function' && value) {
                    this.options.onOptionSelect.call(this, this.el, value.el.value);
                }

                this.el.dispatchEvent(
                    new Event('change', { bubbles: true, cancelable: true, composed: true })
                );

                this._setValueToInput();

                if (value) {
                    this._handleGroupSync(value.el.value);
                }
            }
        }
        if (!this.isMultiple) {
            this.menu?.close();
            if (this.buttonEl) {
                this.buttonEl.blur();
            } else if (this.input) {
                this.input.blur();
            }
        }
    }

    /**
     * Configure le menu et toute sa structure
     * @private
     * @returns {void}
     */
    private _setupMenu(): void {
        this._setupLabel();
        this._setupWrapper();
        this._setupHiddenSelect();
        this._setupSelectOptions();
        this._createMenuElement();

        // Créer la structure du menu
        if (this.selectOptions.length > 0) {
            this.selectOptions.forEach((realOption) => {
                if (realOption.tagName === 'OPTION') {
                    const virtualOption = this._createAndAppendOptionWithIcon(
                        realOption as HTMLOptionElement,
                        this.isMultiple ? 'multiple' : undefined
                    );
                    this._addOptionToValues(realOption as HTMLOptionElement, virtualOption);
                } else if (realOption.tagName === 'OPTGROUP') {
                    // Pour les optgroups, créer un menu-divider de type gap avant le groupe (si ce n'est pas le premier)
                    const isFirstGroup = this.selectOptions.indexOf(realOption) === 0;
                    if (!isFirstGroup) {
                        const divider = document.createElement('menu-divider');
                        // Ne pas mettre data-divider="line" pour créer un gap (espacement) au lieu d'une ligne
                        // Par défaut, Menu.ts traite les menu-divider sans data-divider comme des gaps
                        divider.setAttribute('data-id', `divider-group-${generateGuid()}`);
                        this.menuList.append(divider);
                    }

                    // Créer les options du groupe
                    const selectOptions = Array.from(realOption.children).filter((el) =>
                        el.tagName === 'OPTION'
                    ) as HTMLOptionElement[];
                    selectOptions.forEach((realOption) => {
                        const virtualOption = this._createAndAppendOptionWithIcon(
                            realOption,
                            'optgroup-option'
                        );
                        this._addOptionToValues(realOption, virtualOption);
                    });
                }
            });
        }
        this.wrapper.append(this.menuList);

        // Chercher le bouton dans le wrapper (pour navbar/chip)
        this._findButtonElement();

        // Ajuster les classes selon le contexte
        if (this.wrapper.classList.contains('navbar-select-container')) {
            this.wrapper.classList.add('navbar-select-wrapper');
        } else if (this.wrapper.classList.contains('chip-select-container')) {
            this.wrapper.classList.add('chip-select-wrapper');
        }

        // Créer et configurer l'input menu
        this._createInputElement();

        // Mode multiple : pas de conteneur chips ; les valeurs sont affichées dans l'input (virgules)

        // Vérifier l'alignement à droite
        if (this.el.classList.contains('select--right') || this.buttonEl?.classList.contains('select--right')) {
            this.wrapper.classList.add('select--right');
        }

        this._setValueToInput();

        // Ajouter l'icône leading si nécessaire
        if (this.options.leadingIcon) {
            this._setupLeadingIcon();
        }

        // Ajouter la flèche seulement si pas de bouton
        if (!this.buttonEl) {
            this._createCaretIcon();
        }

        // Initialiser le menu
        this._initializeMenu();

        // Ajouter les sélections initiales
        this._setSelectedStates();

        // Déplacer le label dans le wrapper
        if (this.labelEl) {
            this.labelEl.classList.add('label');
            this.wrapper.appendChild(this.labelEl);
        }

        this._updateHasValueState();
    }

    /**
     * Cherche le bouton élément dans le wrapper ou ses parents
     * @private
     * @returns {void}
     */
    private _findButtonElement(): void {
        this.buttonEl = this.wrapper.querySelector('button.btn--icon, button.appbar__action-icon, button.btn--oval-select, button.select--right, button.switch-theme') as HTMLButtonElement;

        if (!this.buttonEl && this.wrapper.parentElement) {
            this.buttonEl = this.wrapper.parentElement.querySelector('button.btn--icon, button.appbar__action-icon, button.btn--oval-select, button.select--right, button.switch-theme') as HTMLButtonElement;
        }

        // Chercher dans les containers de split button (pour les split buttons dans navbar-select-container)
        if (!this.buttonEl && this.wrapper.parentElement) {
            const splitContainer = this.wrapper.parentElement.querySelector('.split-btn, .split-button');
            if (splitContainer) {
                this.buttonEl = splitContainer.querySelector('button.split-btn__trailing.select--right, button.split-button__trailing.select--right, button.split-btn__trailing.switch-theme, button.split-button__trailing.switch-theme') as HTMLButtonElement;
            }
        }

        if (!this.buttonEl && this.wrapper.classList.contains('chip-select-container')) {
            const chipWrapper = this.wrapper.closest('.chip-wrapper');
            if (chipWrapper) {
                this.buttonEl = chipWrapper.querySelector('button.trailing.action.btn--icon, button.trailing.action.btn--oval-select') as HTMLButtonElement;
            }
        }
    }

    /**
     * Crée l'élément input pour le menu
     * @private
     * @returns {void}
     */
    private _createInputElement(): void {
        this.input = document.createElement('input');
        this.input.id = 'k3ui_select-input-' + generateGuid();
        this.input.classList.add('select-menu', 'select-trigger', 'menu-trigger');
        this.input.type = 'text';
        this.input.readOnly = true;

        // Ne pas mettre data-target sur l'input si le wrapper doit être le trigger
        // (détecté dans _initializeMenu)
        const shouldUseWrapperAsTrigger = this.buttonEl && (
            this.wrapper.classList.contains('navbar-select-wrapper') ||
            this.wrapper.classList.contains('select-wrapper') ||
            this.wrapper.classList.contains('select-button-version') ||
            this.wrapper.classList.contains('navbar-select-container')
        );

        if (!shouldUseWrapperAsTrigger) {
            // Seulement mettre data-target sur l'input si le wrapper n'est pas utilisé comme trigger
            this.input.setAttribute('data-target', this.menuList.id);
        }

        setAriaAttribute(this.input, 'readonly', true);
        setAriaAttribute(this.input, 'required', this.el.hasAttribute('required'));
        if (this.el.disabled) this.input.disabled = true;
        this.input.setAttribute('tabindex', this.nativeTabIndex.toString());

        // Copier les attributs aria du select vers l'input
        const attrs = this.el.attributes;
        for (let i = 0; i < attrs.length; ++i) {
            const attr = attrs[i];
            if (attr.name.startsWith('aria-')) this.input.setAttribute(attr.name, attr.value);
        }

        // Ajouter les attributs aria à l'élément input
        this.input.setAttribute('role', 'combobox');
        setAriaAttributes(this.input, {
            expanded: false,
            owns: this.menuList.id,
            controls: this.menuList.id,
            label: LocaleManager.t('select.ariaLabel')
        });
        this.input.placeholder = ' ';

        // Si un bouton est présent, ne pas ajouter l'input au DOM
        if (this.buttonEl) {
            // Le bouton déclenche l'ouverture mais le wrapper sera utilisé comme trigger pour le positionnement
            // Ne pas mettre data-target sur le bouton si le wrapper doit être le trigger
            this.buttonEl.classList.add('select-trigger', 'menu-trigger');
            this.wrapper.classList.add('select-button-version');
        } else {
            this.wrapper.prepend(this.input);
        }
    }

    /**
     * Crée le conteneur sous l'input pour afficher les valeurs sélectionnées en mode multiple (balises).
     * @private
     * @returns {void}
     */
    private _createMultipleValuesContainer(): void {
        if (this.multipleValuesContainer || !this.input) return;
        const container = document.createElement('div');
        container.className = 'select-multiple-values';
        setAriaAttribute(container, 'live', 'polite');
        this.input.insertAdjacentElement('afterend', container);
        this.multipleValuesContainer = container;
    }

    /**
     * Met à jour l'affichage des valeurs sélectionnées dans le conteneur (mode multiple).
     * @private
     * @returns {void}
     */
    private _updateMultipleValuesDisplay(): void {
        if (!this.multipleValuesContainer) return;
        this.multipleValuesContainer.innerHTML = '';
        const selectedOptions = this._getSelectedOptions();
        selectedOptions.forEach((opt) => {
            let label = (opt.textContent || opt.innerText || opt.value || '')
                .replace(/[\uFFFD]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
            if (!label) label = opt.value || '';
            if (!label) return;
            const tag = document.createElement('span');
            tag.className = 'select-multiple-value-tag';
            tag.textContent = label;
            this.multipleValuesContainer!.appendChild(tag);
        });
    }

    /**
     * Crée l'icône caret (flèche) pour le menu
     * @private
     * @returns {void}
     */
    private _createCaretIcon(): void {
        const caretIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        caretIcon.classList.add('caret');
        caretIcon.setAttribute('height', '24');
        caretIcon.setAttribute('width', '24');
        caretIcon.setAttribute('viewBox', '0 0 24 24');
        setAriaAttribute(caretIcon as unknown as HTMLElement, 'hidden', true);
        caretIcon.innerHTML = `<path d="M7 10l5 5 5-5z"/><path d="M0 0h24v24H0z" fill="none"/>`;

        const leadingIcon = this.wrapper.querySelector('.leading-icon');
        if (leadingIcon) {
            leadingIcon.insertAdjacentElement('afterend', caretIcon);
        } else {
            this.wrapper.prepend(caretIcon);
        }
    }

    /**
     * Initialise le composant Menu
     * @private
     * @returns {void}
     */
    private _initializeMenu(): void {
        if (this.el.disabled) return;

        const defaultMenuOptions = Menu.defaults;
        const userOnItemClick = this.options.menuOptions?.onItemClick;

        const menuOptions: Partial<MenuOptions> = {
            ...defaultMenuOptions,
            ...this.options.menuOptions,
            closeOnClick: false,
            // Select pilote open/close via _handleTriggerClick (évite double toggle Menu)
            triggerToggle: false,
            // Utiliser onItemClick de Menu.ts pour capturer les clics sur les items
            // Car Menu.ts déplace le .menu-container dans le body, les événements
            // attachés à menuList ne capturent pas les clics sur les items
            onItemClick: (item: MenuItem, menuId: string) => {
                // Appeler le callback utilisateur si défini
                if (typeof userOnItemClick === 'function') {
                    userOnItemClick.call(this, item, menuId);
                }
                // Traiter la sélection de l'item
                this._handleMenuItemClick(item);
            }
        };

        const userOnOpenStart = menuOptions.onOpenStart;
        const userOnOpenEnd = menuOptions.onOpenEnd;
        const userOnCloseStart = menuOptions.onCloseStart;
        const userOnCloseEnd = menuOptions.onCloseEnd;

        // Pour le bon alignement du menu, utiliser le wrapper comme trigger si c'est un select avec bouton
        // (navbar-select-wrapper, select-wrapper, ou select-button-version avec bouton)
        let triggerElement: HTMLElement;

        // Vérifier si le wrapper ou son parent est un navbar-select-container
        const isNavbarSelect = this.wrapper.classList.contains('navbar-select-container') ||
            this.wrapper.classList.contains('navbar-select-wrapper') ||
            this.wrapper.parentElement?.classList.contains('navbar-select-container') ||
            this.el.closest('.navbar-select-container') !== null;

        // IMPORTANT: Toujours utiliser le wrapper comme trigger pour garantir l'alignement correct
        // avec le field et pour que l'animation de fermeture fonctionne correctement.
        // Le wrapper assure la cohérence visuelle et l'animation de fermeture.
        const hasSelectWrapper = this.wrapper.classList.contains('select-wrapper');

        if (this.buttonEl && (
            isNavbarSelect ||
            this.wrapper.classList.contains('select-button-version')
        )) {
            // Pour les selects avec bouton dans navbar/chip
            // Détecter si c'est un split button
            const splitContainer = this.buttonEl.closest('.split-btn, .split-button') ||
                this.wrapper.querySelector('.split-btn, .split-button') ||
                this.wrapper.parentElement?.querySelector('.split-btn, .split-button');

            if (splitContainer) {
                // C'est un split button
                const leadingButton = splitContainer.querySelector('.split-btn__leading, .split-button__leading') as HTMLElement;
                const trailingButton = splitContainer.querySelector('.split-btn__trailing, .split-button__trailing') as HTMLElement;

                // Déterminer l'alignement : right si select--right, sinon left (par défaut)
                const hasSelectRight = this.el.classList.contains('select--right') ||
                    this.buttonEl.classList.contains('select--right') ||
                    trailingButton?.classList.contains('select--right');

                if (hasSelectRight && trailingButton) {
                    // Alignement right : utiliser le bouton trailing
                    triggerElement = trailingButton;
                    // Placement bottom-end pour l'alignement à droite
                    menuOptions.placement = 'bottom-end';
                    menuOptions.alignment = 'right';
                } else if (leadingButton) {
                    // Alignement left : utiliser le bouton leading
                    triggerElement = leadingButton;
                    // Placement bottom-start pour l'alignement à gauche
                    menuOptions.placement = 'bottom-start';
                    menuOptions.alignment = 'left';
                } else {
                    // Fallback : utiliser le wrapper
                    triggerElement = this.wrapper;
                }
            } else {
                // Pas un split button, utiliser le wrapper
                triggerElement = this.wrapper;
            }
            // Ajouter l'attribut data-target sur le trigger pour que Menu.ts puisse le trouver
            triggerElement.setAttribute('data-target', this.menuList.id);
        } else if (hasSelectWrapper) {
            // Pour tous les selects normaux, utiliser le wrapper pour l'alignement avec le field
            triggerElement = this.wrapper;
            // Ajouter l'attribut data-target pour que Menu.ts puisse le trouver
            triggerElement.setAttribute('data-target', this.menuList.id);
            // Retirer data-target de l'input pour éviter que Menu.ts le trouve
            if (this.input && this.input.hasAttribute('data-target')) {
                this.input.removeAttribute('data-target');
            }
        } else {
            // Fallback: utiliser le wrapper
            triggerElement = this.wrapper;
            // Ajouter l'attribut data-target pour que Menu.ts puisse le trouver
            triggerElement.setAttribute('data-target', this.menuList.id);
        }

        // Détecter si le select est dans un dialog
        const dialogContainer = this.el.closest('.dialog, k3ui-dialog, [role="dialog"]');
        if (dialogContainer) {
            menuOptions.constrainWidth = true;
            menuOptions.container = dialogContainer as HTMLElement;
        }

        // Si le select ou le bouton a la classe select--right, forcer l'alignement à droite
        // (seulement si le placement n'a pas déjà été défini pour un split button)
        if (!menuOptions.placement) {
            if (this.el.classList.contains('select--right') || this.buttonEl?.classList.contains('select--right')) {
                menuOptions.alignment = 'right';
                menuOptions.placement = 'bottom-end';
            } else {
                menuOptions.placement = 'bottom-start';
            }
        }

        // Callback onOpenStart
        menuOptions.onOpenStart = () => {
            if (typeof this.options.onOpenStart === 'function') {
                this.options.onOpenStart.call(this, this.el);
            }
            if (userOnOpenStart && typeof userOnOpenStart === 'function') {
                userOnOpenStart.call(this.menu, this.el);
            }
        };

        // Callback onOpenEnd
        menuOptions.onOpenEnd = () => {
            const selectedOption = this.menuList.querySelector('menu-item[data-selected="true"]') as HTMLElement;
            if (selectedOption && this.menuList && this.menu) {
                const menuItems = Array.from(this.menuList.querySelectorAll('menu-item'));
                this.menu.focusedIndex = menuItems.indexOf(selectedOption);
                if (this.menu.isScrollable && this.menuList) {
                    let scrollOffset =
                        selectedOption.getBoundingClientRect().top -
                        this.menuList.getBoundingClientRect().top;
                    scrollOffset -= this.menuList.clientHeight / 2;
                    this.menuList.scrollTop = scrollOffset;
                }
            }
            setAriaAttribute(this.input, 'expanded', true);

            if (this.wrapper) {
                this.wrapper.setAttribute('focused', '');
            }
            this._updateHasValueState();

            // Resynchroniser les trailing icons après que Menu.ts ait terminé son render
            // Menu.ts appelle render() lors de l'ouverture, ce qui recrée tous les éléments DOM
            // Il faut donc resynchroniser les trailing icons après le render
            this._setSelectedStates();

            if (typeof this.options.onOpenEnd === 'function') {
                this.options.onOpenEnd.call(this, this.el);
            }

            if (userOnOpenEnd && typeof userOnOpenEnd === 'function')
                userOnOpenEnd.call(this.menu, this.el);
        };

        // Callback onCloseStart
        menuOptions.onCloseStart = () => {
            if (typeof this.options.onCloseStart === 'function') {
                this.options.onCloseStart.call(this, this.el);
            }
            if (userOnCloseStart && typeof userOnCloseStart === 'function') {
                userOnCloseStart.call(this.menu, this.el);
            }
        };

        // Callback onCloseEnd
        menuOptions.onCloseEnd = () => {
            setAriaAttribute(this.input, 'expanded', false);

            const splitContainer = this.buttonEl?.closest('.split-btn, .split-button, .button-split');
            if (splitContainer) {
                ButtonSplit.getInstance(splitContainer)?.closeTrailing();
            }

            if (this.wrapper) {
                this.wrapper.removeAttribute('focused');
            }
            // En mode multiple : rafraîchir immédiatement l'affichage des balises sous l'input à la fermeture du menu
            if (this.isMultiple) {
                this._setValueToInput();
            }
            this._updateHasValueState();

            // Resynchroniser les trailing icons après que Menu.ts ait terminé son render
            // Menu.ts appelle render() lors de la fermeture, ce qui recrée tous les éléments DOM
            // Il faut donc resynchroniser les trailing icons après le render
            // Utiliser double requestAnimationFrame pour s'assurer que le render est complètement terminé
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    this._setSelectedStates();
                });
            });

            if (typeof this.options.onCloseEnd === 'function') {
                this.options.onCloseEnd.call(this, this.el);
            }

            if (userOnCloseEnd && typeof userOnCloseEnd === 'function')
                userOnCloseEnd.call(this.menu, this.el);
        };

        if (!this.menu) {
            const isChipSelect = this.wrapper.classList.contains('chip-select-container');
            const needsButton = isChipSelect && !this.buttonEl;

            if (needsButton) {
                // Attendre que le bouton soit disponible (il sera ajouté par Chip.ts)
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        const chipWrapper = this.wrapper.closest('.chip-wrapper');
                        if (chipWrapper) {
                            const foundButton = chipWrapper.querySelector('button.trailing.action.btn--icon, button.trailing.action.btn--oval-select') as HTMLButtonElement;
                            if (foundButton) {
                                this.buttonEl = foundButton;
                                triggerElement = foundButton;
                                foundButton.setAttribute('data-target', this.menuList.id);
                                foundButton.classList.add('select-trigger', 'menu-trigger');
                            }
                        }

                        if (this.menuList && triggerElement) {
                            if (!this.menuList.isConnected) {
                                this.wrapper.append(this.menuList);
                            }
                            setMenuTriggerElement(this.menuList, triggerElement);
                            // Si le trigger est le wrapper, s'assurer qu'il a les classes et attributs nécessaires
                            if (triggerElement === this.wrapper) {
                                triggerElement.classList.add('select-trigger', 'menu-trigger');
                                triggerElement.setAttribute('data-target', this.menuList.id);
                                // Retirer data-target de l'input pour éviter que Menu.ts le trouve
                                if (this.input && this.input.hasAttribute('data-target')) {
                                    this.input.removeAttribute('data-target');
                                }
                            }
                            this.menu = Menu.init(this.menuList as HTMLElement, menuOptions);
                            this._setupTrailingIconObserver();
                        }
                    });
                });
            } else {
                if (this.menuList && triggerElement) {
                    if (!this.menuList.isConnected) {
                        this.wrapper.append(this.menuList);
                    }
                    // TOUJOURS définir __triggerElement sur le menuList pour que Menu.ts le trouve
                    setMenuTriggerElement(this.menuList, triggerElement);
                    // S'assurer que le trigger a les classes et attributs nécessaires
                    triggerElement.classList.add('select-trigger', 'menu-trigger');
                    triggerElement.setAttribute('data-target', this.menuList.id);
                    // Si le trigger est le wrapper, retirer data-target de l'input pour éviter que Menu.ts le trouve
                    if (triggerElement === this.wrapper && this.input && this.input.hasAttribute('data-target')) {
                        this.input.removeAttribute('data-target');
                    }
                    this.menu = Menu.init(this.menuList as HTMLElement, menuOptions);
                    this._setupTrailingIconObserver();
                }
            }
        }


        // Si le wrapper est utilisé comme trigger et qu'il y a un input, ajouter un gestionnaire pour que l'input déclenche l'ouverture
        if (triggerElement === this.wrapper && this.input && this.menu) {
            // Utiliser la phase de capture pour être sûr que notre gestionnaire soit appelé avant celui de Menu.ts
            this.registerEvent(this.input, 'click', this._handleTriggerClick as EventListener, true);
        }

        // Si le wrapper est utilisé comme trigger et qu'il y a un bouton, ajouter un gestionnaire pour que le bouton déclenche l'ouverture
        if (triggerElement === this.wrapper && this.buttonEl && this.menu) {
            // Utiliser la phase de capture pour être sûr que notre gestionnaire soit appelé avant celui de Menu.ts
            this.registerEvent(this.buttonEl, 'click', this._handleTriggerClick as EventListener, true);
        }

        // Split-button : le triggerElement est le bouton trailing (pas le wrapper ni buttonEl)
        if (triggerElement !== this.wrapper && triggerElement !== this.buttonEl && this.menu) {
            this.registerEvent(triggerElement, 'click', this._handleTriggerClick as EventListener, true);
        }
    }

    /**
     * Configure le label du select
     * @private
     * @returns {void}
     */
    private _setupLabel(): void {
        this.labelEl = document.querySelector('[for="' + this.el.id + '"]') as HTMLLabelElement;
    }

    /**
     * Configure le wrapper du select
     * @private
     * @returns {void}
     */
    private _setupWrapper(): void {
        const navbarContainer = this.el.closest('.navbar-select-container');
        const chipSelectContainer = this.el.closest('.chip-select-container');

        if (navbarContainer || chipSelectContainer) {
            this.wrapper = (navbarContainer || chipSelectContainer) as HTMLDivElement;
        } else {
            this.wrapper = document.createElement('div');
            this.wrapper.classList.add('select-wrapper', 'input-field');

            let variant = this.options.variant;
            if (!variant) {
                const allInputFields = Array.from(document.querySelectorAll('.input-field'));
                const parentContainer = allInputFields.find(container => {
                    return container.contains(this.el) && !container.classList.contains('select-wrapper');
                });
                if (parentContainer) {
                    if (parentContainer.classList.contains('filled')) {
                        variant = 'filled';
                    } else if (parentContainer.classList.contains('outlined')) {
                        variant = 'outlined';
                    }
                }
            }
            variant = variant || 'outlined';

            if (variant === 'filled') {
                this.wrapper.classList.add('filled');
                this.el.setAttribute('variant', 'filled');
            } else {
                this.wrapper.classList.add('outlined');
                this.el.setAttribute('variant', 'outlined');
            }

            if (this.options.classes && this.options.classes.length > 0) {
                this.wrapper.classList.add(...this.options.classes.split(' '));
            }
            this.el.before(this.wrapper);
        }

        if (this.el.disabled) this.wrapper.classList.add('disabled');
    }

    /**
     * Configure le select caché (déplacé dans un wrapper overflow hidden)
     * @private
     * @returns {void}
     */
    private _setupHiddenSelect(): void {
        const hiddenDiv = document.createElement('div');
        hiddenDiv.classList.add('hide-select');
        this.wrapper.append(hiddenDiv);
        hiddenDiv.appendChild(this.el);
    }

    /**
     * Configure les options du select
     * @private
     * @returns {void}
     */
    private _setupSelectOptions(): void {
        this.selectOptions = Array.from(this.el.children).filter((el) =>
            ['OPTION', 'OPTGROUP'].includes(el.tagName)
        ) as (HTMLOptGroupElement | HTMLOptionElement)[];
    }

    /**
     * Crée l'élément menu (k3ui-menu)
     * @private
     * @returns {void}
     */
    private _createMenuElement(): void {
        this.menuList = document.createElement('k3ui-menu');
        // ID distinct du <select> natif (évite deux nœuds avec le même id dans le document — Lighthouse / a11y)
        if (!this.el.id) {
            this.el.id = `select-${generateGuid()}`;
        }
        this.menuList.id = `${this.el.id}-menu`;
        this.menuList.setAttribute('data-no-auto-init', 'true');
        this.menuList.setAttribute('role', 'listbox');
        setAriaAttribute(this.menuList, 'multiselectable', this.isMultiple);
        if (this.isMultiple) this.menuList.classList.add('multiple-select-menu');
    }

    /**
     * Ajoute une option aux valeurs (mapping)
     * @private
     * @param {HTMLOptionElement} realOption - Option HTML native
     * @param {HTMLElement} virtualOption - Élément virtuel dans le menu
     * @returns {void}
     */
    private _addOptionToValues(realOption: HTMLOptionElement, virtualOption: HTMLElement): void {
        this._values.push({ el: realOption, optionEl: virtualOption });
    }

    /**
     * Supprime le menu et restaure le select natif
     * @private
     * @returns {void}
     */
    private _cancelTrailingIconSyncRaf(): void {
        if (this.trailingIconSyncRaf !== null) {
            cancelAnimationFrame(this.trailingIconSyncRaf);
            this.trailingIconSyncRaf = null;
        }
    }

    private _removeMenu(): void {
        this._cancelTrailingIconSyncRaf();
        if (this.trailingIconObserver) {
            this.trailingIconObserver.disconnect();
            this.trailingIconObserver = null;
        }

        if (this.menu) {
            this.menu.destroy();
            this.menu = null;
        }
        this.wrapper.querySelector('.caret')?.remove();
        if (this.input.parentNode) {
            this.input.remove();
        }
        if (this.menuList && this.menuList.parentNode) {
            this.menuList.remove();
        }
        this.wrapper.before(this.el);
        this.wrapper.remove();
    }

    /**
     * Crée et ajoute une option avec icône dans le menu en utilisant menu-item custom element
     * @private
     * @param {HTMLOptionElement | HTMLOptGroupElement} realOption - Option HTML native
     * @param {string} [type] - Type d'option (multiple, optgroup-option)
     * @returns {HTMLElement} Élément menu-item créé
     */
    private _createAndAppendOptionWithIcon(
        realOption: HTMLOptionElement | HTMLOptGroupElement,
        type?: string
    ): HTMLElement {
        // Si c'est un divider, créer un menu-divider
        // Supporte deux types : gap (par défaut) ou line (si data-divider="line" est présent)
        if (realOption.classList.contains('divider')) {
            const divider = document.createElement('menu-divider');
            const dividerId = `divider-${generateGuid()}`;
            divider.setAttribute('data-id', dividerId);

            // Vérifier si l'option a un attribut data-divider pour déterminer le type
            // Si data-divider="line" est présent, créer un divider ligne
            // Sinon, créer un gap (par défaut, Menu.ts traite les menu-divider sans data-divider comme des gaps)
            const dividerType = realOption.getAttribute('data-divider');
            if (dividerType === 'line') {
                divider.setAttribute('data-divider', 'line');
            }
            // Si data-divider n'est pas "line" ou absent, pas besoin de l'attribut (gap par défaut)

            this.menuList.append(divider);
            return divider;
        }

        // Extraire l'icône leading depuis l'attribut data-option-html (préservé par k3ui-select)
        // ou depuis innerHTML si disponible
        let leadingIcon: string | undefined = undefined;
        let optionHTML: string | null = null;

        // Priorité 1 : utiliser data-option-html (préservé par le Web Component k3ui-select)
        optionHTML = realOption.getAttribute('data-option-html');

        // Priorité 2 : utiliser innerHTML si data-option-html n'existe pas
        if (!optionHTML) {
            optionHTML = realOption.innerHTML
                .replace(/[\uFFFD]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
        }

        // Parser l'icône leading depuis le HTML
        // Supporte plusieurs formats : <i name="sun"></i>, <i name='sun'></i>, <i name=sun></i>
        if (optionHTML) {
            // Conserver le HTML complet du <i> (incluant type="...") pour que Menu.ts puisse l'intégrer tel quel
            // et permettre à IconManager de charger le bon bundle (ex: type="flags").
            const iconMatchWithClosing = optionHTML.match(/<i[^>]*\s+name\s*=\s*["']?[^"'\s>]+["']?[^>]*>.*?<\/i>/i);
            if (iconMatchWithClosing) {
                leadingIcon = iconMatchWithClosing[0];
            } else {
                // Fallback : si on n'a pas la balise fermante, on récupère la balise d'ouverture
                // (donc on conserve aussi attributes comme type="flags") puis on recompose un <i>...</i>.
                const iconOpenTagMatch = optionHTML.match(/<i[^>]*\s+name\s*=\s*["']?[^"'\s>]+["']?[^>]*>/i);
                if (iconOpenTagMatch) {
                    const openTag = iconOpenTagMatch[0];
                    leadingIcon = openTag.trim().endsWith('/>') ? openTag : `${openTag}</i>`;
                }
            }
        }

        // Extraire le texte (sans les balises HTML)
        // Utiliser textContent directement pour obtenir le texte sans les balises
        const textContent = realOption.textContent?.trim() || '';

        // Extraire trailing text si présent
        const trailingText = realOption.getAttribute('data-trailing-text');

        // Créer un menu-item custom element
        const menuItem = document.createElement('menu-item');
        const optionId = (realOption instanceof HTMLOptionElement ? realOption.value : null) || `option-${generateGuid()}`;
        menuItem.setAttribute('data-id', optionId);
        menuItem.setAttribute('data-label', textContent);

        // Ajouter l'icône leading si présente (sanitisée avant injection dans le menu-item / Menu.ts)
        if (leadingIcon) {
            const safeLeadingIcon = sanitizeHtmlFragment(
                leadingIcon,
                new Set(['i']),
                { i: new Set(['name', 'type', 'custom', 'folder', 'size', 'class', 'aria-hidden']) }
            );
            if (safeLeadingIcon) {
                menuItem.setAttribute('data-leading-icon', safeLeadingIcon);
            }
        }

        // Ajouter le trailing text si présent
        if (trailingText) {
            menuItem.setAttribute('data-trailing-text', trailingText);
        } else if (this.isMultiple) {
            // En mode multiple : trailing = k3ui-checkbox (le Menu accepte du HTML dans data-trailing-icon)
            menuItem.setAttribute('data-trailing-icon', '<k3ui-checkbox class="select-option-checkbox" data-show-label="false"></k3ui-checkbox>');
        } else {
            // Select simple : icône trailing check, visibilité contrôlée par CSS via data-selected
            menuItem.setAttribute('data-trailing-icon', 'check');
        }

        // Gérer l'état disabled
        if (realOption.disabled) {
            menuItem.setAttribute('data-disabled', 'true');
        }

        // Gérer l'état selected (pour Menu.ts)
        if ((realOption as HTMLOptionElement).selected) {
            menuItem.setAttribute('data-selected', 'true');
        }

        // Stocker la référence à l'option native pour le mapping
        setSelectMenuItemRealOption(menuItem, realOption);

        this.menuList.append(menuItem);

        return menuItem;
    }

    /**
     * Sélectionne une valeur
     * @private
     * @param {ValueStruct} value - Structure de valeur à sélectionner
     * @returns {void}
     */
    private _selectValue(value: ValueStruct): void {
        value.el.selected = true;
        // En mode simple : une seule valeur ; en mode multiple ne pas toucher à el.value (sinon une seule option reste sélectionnée)
        if (!this.isMultiple) {
            this.el.value = value.el.value;
        }
        value.optionEl.setAttribute('data-selected', 'true');
        setAriaAttribute(value.optionEl, 'selected', true);

        if (this.isMultiple) {
            const cbEl = this._getCheckboxForValue(value);
            if (cbEl && typeof Checkbox.getInstance === 'function') {
                const inst = Checkbox.getInstance(cbEl);
                if (inst) inst.setChecked(true);
            }
            return;
        }

        const checkbox = value.optionEl.querySelector('input[type="checkbox"]') as HTMLInputElement;
        if (checkbox) checkbox.checked = true;

        // Pour les selects simples, retirer is-visible uniquement des autres options
        if (this.menuList) {
            this._values.forEach((otherValue) => {
                if (otherValue !== value && otherValue.optionEl.getAttribute('data-selected') === 'true') {
                    const otherMenuItemId = otherValue.optionEl.getAttribute('data-id');
                    if (otherMenuItemId) {
                        const searchContainer = this._getMenuSearchContainer();
                        const otherMenuItemWrapper = searchContainer?.querySelector(`.menu-item-wrapper[data-item-id="${otherMenuItemId}"]`) as HTMLElement;
                        if (otherMenuItemWrapper) {
                            const otherTrailingIcon = otherMenuItemWrapper.querySelector('.list-item__trailing-icon.is-visible, .select-trailing-icon.is-visible') as HTMLElement;
                            if (otherTrailingIcon) {
                                otherTrailingIcon.classList.remove('is-visible');
                            }
                        }
                    }
                    otherValue.optionEl.removeAttribute('data-selected');
                    setAriaAttribute(otherValue.optionEl, 'selected', false);
                    otherValue.el.selected = false;
                }
            });
        }

        // Mettre à jour le trailing icon (check) dans le menu-item — select simple uniquement
        const menuItemId = value.optionEl.getAttribute('data-id');
        const searchContainer = this._getMenuSearchContainer();
        if (menuItemId && searchContainer) {
            const menuItemWrapper = searchContainer.querySelector(`.menu-item-wrapper[data-item-id="${menuItemId}"]`) as HTMLElement;
            if (menuItemWrapper) {
                let trailingIcon = menuItemWrapper.querySelector('.list-item__trailing-icon, .select-trailing-icon') as HTMLElement;
                if (!trailingIcon) {
                    let trailing = menuItemWrapper.querySelector('.list-item__trailing') as HTMLElement;
                    if (!trailing) {
                        trailing = document.createElement('div');
                        trailing.classList.add('list-item__trailing');
                        menuItemWrapper.appendChild(trailing);
                    }
                    trailingIcon = document.createElement('i');
                    trailingIcon.setAttribute('name', 'check');
                    trailingIcon.setAttribute('size', 'sm');
                    trailingIcon.classList.add('select-trailing-icon');
                    trailing.appendChild(trailingIcon);
                    IconManager.updateIcon(trailingIcon);
                } else {
                    if (!trailingIcon.classList.contains('select-trailing-icon')) {
                        trailingIcon.classList.add('select-trailing-icon');
                    }
                }
                if (!trailingIcon.classList.contains('is-visible')) {
                    trailingIcon.classList.add('is-visible');
                }
            }
        }
    }

    /**
     * Désélectionne une valeur
     * @private
     * @param {ValueStruct} value - Structure de valeur à désélectionner
     * @returns {void}
     */
    private _deselectValue(value: ValueStruct): void {
        value.el.selected = false;
        value.optionEl.removeAttribute('data-selected');
        setAriaAttribute(value.optionEl, 'selected', false);

        if (this.isMultiple) {
            const cbEl = this._getCheckboxForValue(value);
            if (cbEl && typeof Checkbox.getInstance === 'function') {
                const inst = Checkbox.getInstance(cbEl);
                if (inst) inst.setChecked(false);
            }
            return;
        }

        const checkbox = value.optionEl.querySelector('input[type="checkbox"]') as HTMLInputElement;
        if (checkbox) checkbox.checked = false;

        const menuItemId = value.optionEl.getAttribute('data-id');
        if (menuItemId) {
            const searchContainer = this._getMenuSearchContainer();
            const menuItemWrapper = searchContainer?.querySelector(`.menu-item-wrapper[data-item-id="${menuItemId}"]`) as HTMLElement;
            if (menuItemWrapper) {
                const trailingIcon = menuItemWrapper.querySelector('.list-item__trailing-icon, .select-trailing-icon') as HTMLElement;
                if (trailingIcon) {
                    trailingIcon.classList.remove('is-visible');
                }
            }
        }
    }

    /**
     * Désélectionne toutes les valeurs
     * @private
     * @returns {void}
     */
    private _deselectAll(): void {
        this._values.forEach((value) => this._deselectValue(value));
    }

    /**
     * Vérifie si une valeur est sélectionnée
     * @private
     * @param {ValueStruct} value - Structure de valeur à vérifier
     * @returns {boolean} true si la valeur est sélectionnée
     */
    private _isValueSelected(value: ValueStruct): boolean {
        const realValues = this._getSelectedOptions().map((realOption) => realOption.value);
        return realValues.some((realValue: string) => realValue === value.el.value);
    }

    /**
     * Bascule une entrée dans le tableau (pour select multiple)
     * @private
     * @param {ValueStruct} value - Structure de valeur à basculer
     * @returns {void}
     */
    private _toggleEntryFromArray(value: ValueStruct): void {
        if (this._isValueSelected(value)) this._deselectValue(value);
        else this._selectValue(value);
    }

    /**
     * Obtient les options sélectionnées du select natif
     * @private
     * @returns {HTMLOptionElement[]} Tableau des options sélectionnées
     */
    private _getSelectedOptions(): HTMLOptionElement[] {
        return Array.prototype.filter.call(
            this.el.selectedOptions,
            (realOption: HTMLOptionElement) => realOption
        );
    }

    /**
     * Obtient les valeurs sélectionnées
     * @public
     * @returns {string[]} Tableau des valeurs sélectionnées
     */
    getSelectedValues(): string[] {
        return this._getSelectedOptions().map((realOption) => realOption.value);
    }

    /**
     * Définit la valeur dans l'input selon l'option sélectionnée
     * @private
     * @returns {void}
     */
    private _setValueToInput(): void {
        if (this.isMultiple) {
            const selectedOptions = this._getSelectedOptions();
            const labels = selectedOptions.map((opt) => {
                let label = (opt.textContent || opt.innerText || opt.value || '')
                    .replace(/[\uFFFD]/g, '')
                    .replace(/\s+/g, ' ')
                    .trim();
                if (!label) label = opt.value || '';
                return label;
            }).filter(Boolean);
            const displayText = labels.join(', ');
            if (this.input) this.input.value = displayText;
            this._updateHasValueState();
            return;
        }

        let selectedValue = this.el.value;
        if (!selectedValue) {
            const selectedOption = Array.from(this.el.options).find(option => option.selected);
            if (selectedOption) {
                selectedValue = selectedOption.value;
                this.el.value = selectedValue;
            }
        }

        this.el.selectedIndex = Array.from(this.el.options).findIndex(option => option.value === selectedValue);

        const selectedOption = this.el.options[this.el.selectedIndex];
        let displayText = '';

        if (selectedOption) {
            const originalText = selectedOption.textContent || selectedOption.innerText || '';
            displayText = originalText
                .replace(/[\uFFFD]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
        } else {
            const valueMap: { [key: string]: string } = {
                'light': 'Clair',
                'dark': 'Sombre',
                'auto': 'Auto',
                'system': 'Système'
            };
            displayText = valueMap[selectedValue] || selectedValue;
        }

        if (this.input) {
            this.input.value = displayText;
        }

        if (this.buttonEl) {
            this._updateButtonIcon(selectedValue);
        }

        this._updateHasValueState();
    }

    /**
     * Met à jour l'état has-value pour le positionnement du label
     * @private
     * @returns {void}
     */
    private _updateHasValueState(): void {
        if (!this.wrapper) return;

        let hasValue: boolean;
        if (this.isMultiple) {
            hasValue = this.getSelectedValues().length > 0;
        } else {
            hasValue = !!(this.input && this.input.value && this.input.value.trim() !== '');
        }
        const hasFocus = this.wrapper.hasAttribute('focused');

        if (hasValue || hasFocus) {
            this.wrapper.setAttribute('has-value', '');
        } else {
            this.wrapper.removeAttribute('has-value');
        }
    }

    /**
     * Met à jour l'icône du bouton selon la valeur sélectionnée
     * @private
     * @param {string} selectedValue - Valeur sélectionnée
     * @param {HTMLButtonElement} [buttonEl] - Bouton cible (optionnel)
     * @returns {void}
     */
    private _updateButtonIcon(selectedValue: string, buttonEl?: HTMLButtonElement): void {
        const targetButton = buttonEl || this.buttonEl;
        if (!targetButton) return;

        // Si le bouton est un trailing d'un split button, mettre à jour l'icône du leading à la place
        let iconButton = targetButton;
        if (targetButton.classList.contains('split-btn__trailing') || targetButton.classList.contains('split-button__trailing')) {
            const splitContainer = targetButton.closest('.split-btn, .split-button');
            if (splitContainer) {
                const leadingButton = splitContainer.querySelector('.split-btn__leading, .split-button__leading') as HTMLButtonElement;
                if (leadingButton) {
                    iconButton = leadingButton;
                }
            }
        }

        const icon = iconButton?.querySelector('i');
        if (icon) {
            const iconMap: { [key: string]: string } = {
                'light': 'sun',
                'dark': 'moon',
                'auto': 'clock',
                'system': 'gear',
                'fr': 'globe-pointer',
                'en': 'globe-pointer',
                'es': 'globe-pointer',
                'de': 'globe-pointer',
                'it': 'globe-pointer',
                'pt': 'globe-pointer',
                'ja': 'globe-pointer',
                'ko': 'globe-pointer',
                'zh': 'globe-pointer'
            };

            const newIconName = iconMap[selectedValue];
            if (newIconName && icon.getAttribute('name') !== newIconName) {
                icon.setAttribute('name', newIconName);
                // Mettre à jour l'icône via IconManager si disponible
                IconManager.updateIcon(icon);
            }
        }
    }

    /**
     * Charge la préférence de groupe depuis le manager concerné (une seule source de vérité).
     * theme → ThemeManager.currentTheme ; locale/language → LocaleManager.currentLocale ; autres → pas de chargement.
     * @private
     * @returns {void}
     */
    private _loadGroupPreference(): void {
        const groupName = this._getSyncGroup();
        if (!groupName) return;

        let sourceValue: string | null = null;
        if (groupName === 'theme' && typeof ThemeManager !== 'undefined' && ThemeManager.currentTheme) {
            sourceValue = ThemeManager.currentTheme;
        } else if ((groupName === 'locale' || groupName === 'language') && typeof LocaleManager !== 'undefined') {
            sourceValue = LocaleManager.currentLocale;
        }
        // Autres groupes : pas de lecture storage, le select garde sa valeur HTML

        if (sourceValue && sourceValue !== this.el.value) {
            this.el.value = sourceValue;
            this._setValueToInput();
            this._setSelectedStates();

            if (groupName === 'theme') {
                this.el.setAttribute('data-theme', this.el.value);
            }
        } else if (groupName === 'theme' && typeof ThemeManager !== 'undefined' && ThemeManager.currentTheme) {
            this.el.setAttribute('data-theme', ThemeManager.currentTheme);
        }
    }

    /**
     * Gère la synchronisation par groupes : délégation aux managers (theme, locale) ou synchro en page uniquement.
     * @private
     * @param {string} value - Valeur sélectionnée
     * @returns {void}
     */
    private _handleGroupSync(value: string): void {
        const groupClass = this._getSyncGroup();
        if (!groupClass) return;

        if (groupClass === 'theme') {
            if (typeof ThemeManager !== 'undefined' && typeof ThemeManager.setTheme === 'function') {
                ThemeManager.setTheme(value as 'light' | 'dark' | 'auto' | 'system');
            }
            return;
        }
        if (groupClass === 'locale' || groupClass === 'language') {
            if (typeof LocaleManager !== 'undefined' && typeof LocaleManager.setLocale === 'function') {
                LocaleManager.setLocale(value as 'fr-FR' | 'en-US');
            }
            this._syncGroupSelects(groupClass, value);
            return;
        }
        this._syncGroupSelects(groupClass, value);
    }

    /**
     * Détermine le groupe de synchronisation du select
     * @private
     * @returns {string | null} Nom du groupe ou null
     */
    private _getSyncGroup(): string | null {
        return this.el.getAttribute('data-group') || null;
    }

    /**
     * Retourne le conteneur dans lequel chercher les .menu-item-wrapper (menu déplacé dans body ou menuList).
     * @private
     * @returns {HTMLElement | null}
     */
    private _getMenuSearchContainer(): HTMLElement | null {
        const menuId = this.menuList?.id;
        if (!menuId) return this.menuList || null;
        const menuContainer = document.querySelector(`.menu-container[data-menu-id="${menuId}"]`) as HTMLElement;
        return menuContainer || this.menuList || null;
    }

    /**
     * Retourne l'élément k3ui-checkbox pour une valeur (option multi-select). Init le composant si besoin.
     * @private
     * @param {ValueStruct} value - Structure de valeur
     * @returns {HTMLElement | null}
     */
    private _getCheckboxForValue(value: ValueStruct): HTMLElement | null {
        const searchContainer = this._getMenuSearchContainer();
        if (!searchContainer) return null;
        const menuItemId = value.optionEl.getAttribute('data-id');
        if (!menuItemId) return null;
        const wrapper = searchContainer.querySelector(`.menu-item-wrapper[data-item-id="${menuItemId}"]`) as HTMLElement;
        const cbEl = wrapper?.querySelector('k3ui-checkbox.select-option-checkbox') as HTMLElement;
        if (cbEl && !Checkbox.getInstance(cbEl)) {
            Checkbox.init(cbEl);
        }
        return cbEl || null;
    }

    /**
     * Délègue la persistance au manager concerné (theme → ThemeManager, locale/language → LocaleManager).
     * Autres groupes : pas de sauvegarde (synchro en page uniquement).
     * @private
     * @param {string} groupName - Nom du groupe
     * @param {string} value - Valeur à sauvegarder
     * @returns {void}
     */
    private _saveGroupPreference(groupName: string, value: string): void {
        if (groupName === 'theme' && typeof ThemeManager !== 'undefined' && typeof ThemeManager.setTheme === 'function') {
            ThemeManager.setTheme(value as 'light' | 'dark' | 'auto' | 'system');
            return;
        }
        if ((groupName === 'locale' || groupName === 'language') && typeof LocaleManager !== 'undefined' && typeof LocaleManager.setLocale === 'function') {
            LocaleManager.setLocale(value as 'fr-FR' | 'en-US');
            return;
        }
        // Autres groupes : pas d'écriture storage
    }

    /**
     * Synchronise tous les selects du même groupe
     * @private
     * @param {string} groupName - Nom du groupe
     * @param {string} targetValue - Valeur cible
     * @returns {void}
     */
    private _syncGroupSelects(groupName: string, targetValue: string): void {
        const selector = `select[data-group="${groupName}"]`;
        const allGroupSelects = document.querySelectorAll(selector);

        allGroupSelects.forEach((element) => {
            if (element !== this.el && element instanceof HTMLSelectElement) {
                if (element.value !== targetValue) {
                    element.value = targetValue;

                    const selectInstance = Select.getInstance(element as HTMLElement);
                    if (selectInstance) {
                        selectInstance.forceSyncAll();
                        selectInstance.refreshDisplay();
                    }

                    if (groupName === 'theme') {
                        element.setAttribute('data-theme', targetValue);
                    }

                    element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
                }
            }
        });
    }

    /**
     * Force la synchronisation de l'input avec la valeur du select
     * @public
     * @returns {void}
     */
    public forceSyncInput(): void {
        this._setValueToInput();
    }

    /**
     * Force la synchronisation complète (input + états)
     * @public
     * @returns {void}
     */
    public forceSyncAll(): void {
        this._setValueToInput();
        this._setSelectedStates();
    }

    /**
     * Force la mise à jour de l'affichage de l'input
     * @public
     * @returns {void}
     */
    public refreshDisplay(): void {
        if (this.input) {
            this._setValueToInput();
        }
    }

    /**
     * Configure un MutationObserver pour corriger immédiatement les trailing icons créés par Menu.ts
     * @private
     * @returns {void}
     */
    private _setupTrailingIconObserver(): void {
        if (!this.menuList) return;

        // Nettoyer l'observer existant s'il existe
        if (this.trailingIconObserver) {
            this.trailingIconObserver.disconnect();
            this.trailingIconObserver = null;
        }

        // Créer un observer pour détecter les ajouts de trailing icons
        this.trailingIconObserver = new MutationObserver((mutations) => {
            let needsSync = false;
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const element = node as HTMLElement;
                        if (element.classList.contains('list-item__trailing-icon') ||
                            element.classList.contains('select-trailing-icon') ||
                            element.querySelector('.list-item__trailing-icon, .select-trailing-icon')) {
                            needsSync = true;
                        }
                    }
                });
            });

            if (!needsSync) return;
            if (this.trailingIconSyncRaf !== null) return;
            this.trailingIconSyncRaf = requestAnimationFrame(() => {
                this.trailingIconSyncRaf = null;
                this._syncTrailingIconsImmediately();
                if (this.menuList) {
                    try {
                        IconManager.processIconsInContainer(this.menuList);
                    } catch {
                        /* ignore */
                    }
                }
            });
        });

        // Observer les ajouts d'éléments dans le menuList
        this.trailingIconObserver.observe(this.menuList, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Synchronise immédiatement les trailing icons sans flash visuel
     * @private
     * @returns {void}
     */
    private _syncTrailingIconsImmediately(): void {
        if (!this.menuList) return;

        const searchContainer = this._getMenuSearchContainer();
        if (!searchContainer) return;

        if (this.isMultiple) {
            this._values.forEach((value) => {
                const cbEl = this._getCheckboxForValue(value);
                if (cbEl && typeof Checkbox.getInstance === 'function') {
                    const inst = Checkbox.getInstance(cbEl);
                    if (inst) inst.setChecked(value.el.selected);
                }
            });
            return;
        }

        const selectedValue = this.el.value;
        searchContainer.querySelectorAll('.list-item__trailing-icon, .select-trailing-icon').forEach((icon) => {
            icon.classList.remove('is-visible');
        });
        searchContainer.querySelectorAll('.list-item__trailing-icon, .select-trailing-icon').forEach((icon) => {
            const trailingIcon = icon as HTMLElement;
            if (!trailingIcon.classList.contains('select-trailing-icon')) {
                trailingIcon.classList.add('select-trailing-icon');
            }
            const menuItemWrapper = trailingIcon.closest('.menu-item-wrapper') as HTMLElement;
            if (menuItemWrapper) {
                const menuItemId = menuItemWrapper.getAttribute('data-item-id');
                if (menuItemId) {
                    const value = this._values.find(v => v.optionEl.getAttribute('data-id') === menuItemId);
                    if (value && value.el.value === selectedValue) {
                        trailingIcon.classList.add('is-visible');
                    }
                }
            }
        });
    }

    /**
     * Définit les états sélectionnés (synchronise les éléments virtuels avec le select natif)
     * @private
     * @returns {void}
     */
    private _setSelectedStates(): void {
        if (!this.isMultiple && !this.el.value) {
            const selectedOption = Array.from(this.el.options).find(option => option.selected);
            if (selectedOption) {
                this.el.value = selectedOption.value;
            }
        }

        // En mode simple : this.el.value est la source de vérité ; en mode multiple : option.selected sur chaque option
        const selectedValue = this.el.value;

        // S'assurer qu'une seule option est sélectionnée dans le select natif (simple uniquement)
        if (!this.isMultiple) {
            Array.from(this.el.options).forEach(option => {
                option.selected = (option.value === selectedValue);
            });
        }

        const searchContainer = this._getMenuSearchContainer();

        // Select simple uniquement : retirer is-visible de tous les trailing icons avant de réappliquer
        if (searchContainer && !this.isMultiple) {
            searchContainer.querySelectorAll('.list-item__trailing-icon, .select-trailing-icon').forEach((icon) => {
                icon.classList.remove('is-visible');
                if (!icon.classList.contains('select-trailing-icon')) {
                    icon.classList.add('select-trailing-icon');
                }
            });
        }

        this._values.forEach((value) => {
            const optionIsSelected = this.isMultiple
                ? value.el.selected
                : value.el.value === selectedValue;

            value.el.selected = optionIsSelected;

            if (this.isMultiple) {
                const cbEl = this._getCheckboxForValue(value);
                if (cbEl && typeof Checkbox.getInstance === 'function') {
                    const inst = Checkbox.getInstance(cbEl);
                    if (inst) inst.setChecked(optionIsSelected);
                }
            } else {
                const cb = value.optionEl.querySelector('input[type="checkbox"]') as HTMLInputElement;
                if (cb) cb.checked = optionIsSelected;
            }

            if (optionIsSelected) {
                value.optionEl.setAttribute('data-selected', 'true');
                setAriaAttribute(value.optionEl, 'selected', true);
            } else {
                value.optionEl.removeAttribute('data-selected');
                setAriaAttribute(value.optionEl, 'selected', false);
            }

            const menuItemId = value.optionEl.getAttribute('data-id');
            if (menuItemId && searchContainer) {
                const menuItemWrapper = searchContainer.querySelector(`.menu-item-wrapper[data-item-id="${menuItemId}"]`) as HTMLElement;
                if (menuItemWrapper) {
                    if (optionIsSelected) {
                        menuItemWrapper.setAttribute('data-selected', 'true');
                    } else {
                        menuItemWrapper.removeAttribute('data-selected');
                    }
                    if (!this.isMultiple) {
                        let trailingIcon = menuItemWrapper.querySelector('.list-item__trailing-icon, .select-trailing-icon') as HTMLElement;
                        if (trailingIcon && !trailingIcon.classList.contains('select-trailing-icon')) {
                            trailingIcon.classList.add('select-trailing-icon');
                        }
                        if (!trailingIcon && optionIsSelected) {
                            let trailing = menuItemWrapper.querySelector('.list-item__trailing') as HTMLElement;
                            if (!trailing) {
                                trailing = document.createElement('div');
                                trailing.classList.add('list-item__trailing');
                                menuItemWrapper.appendChild(trailing);
                            }
                            trailingIcon = document.createElement('i');
                            trailingIcon.setAttribute('name', 'check');
                            trailingIcon.setAttribute('size', 'sm');
                            trailingIcon.classList.add('select-trailing-icon');
                            trailing.appendChild(trailingIcon);
                            IconManager.updateIcon(trailingIcon);
                        }
                        if (trailingIcon) {
                            if (optionIsSelected) {
                                trailingIcon.classList.add('is-visible');
                            } else {
                                trailingIcon.classList.remove('is-visible');
                            }
                        }
                    }
                }
            }
        });

        this._setValueToInput();
    }

    /**
     * Configure l'icône leading (icône ou image)
     * @private
     * @returns {void}
     */
    private _setupLeadingIcon(): void {
        if (!this.options.leadingIcon || !this.options.leadingIcon.trim() || !this.wrapper) return;

        const existingIcon = this.wrapper.querySelector('.leading-icon');
        if (existingIcon) {
            existingIcon.remove();
        }

        const leadingIcon = document.createElement('div');
        leadingIcon.className = 'leading-icon';

        const isImage = this.options.leadingIcon.includes('/') ||
            this.options.leadingIcon.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i);

        if (isImage) {
            const img = document.createElement('img');
            img.src = this.options.leadingIcon;
            img.alt = '';
            img.style.cssText = 'width: 24px; height: 24px; border-radius: 50%; object-fit: cover;';
            leadingIcon.appendChild(img);
            leadingIcon.classList.add('leading-icon-avatar');
        } else {
            const icon = document.createElement('i');
            icon.className = 'k3ui-icon';
            icon.setAttribute('name', this.options.leadingIcon);
            leadingIcon.appendChild(icon);
            try {
                IconManager.updateIcon(icon);
            } catch (_) { /* no-op */ }
        }

        this.wrapper.classList.add('has-leading-icon');

        if (this.buttonEl) {
            this.wrapper.insertBefore(leadingIcon, this.buttonEl);
        } else if (this.input) {
            this.wrapper.insertBefore(leadingIcon, this.input);
        } else {
            this.wrapper.prepend(leadingIcon);
        }
    }

    /**
     * Définit ou met à jour l'icône leading
     * @param {string | null} icon - Nom d'icône ou chemin d'image, ou null pour supprimer
     * @public
     * @returns {void}
     */
    public setLeadingIcon(icon: string | null): void {
        this.options.leadingIcon = icon || null;
        if (icon) {
            this._setupLeadingIcon();
        } else {
            const existingIcon = this.wrapper?.querySelector('.leading-icon');
            if (existingIcon) {
                existingIcon.remove();
            }
            this.wrapper?.classList.remove('has-leading-icon');
        }
    }

    /**
     * Ouvre le menu du select
     * @public
     * @returns {void}
     */
    public open(): void {
        if (this.menu) {
            this.menu.open();
        }
    }

    /**
     * Ferme le menu du select
     * @public
     * @returns {void}
     */
    public close(): void {
        if (this.menu) {
            this.menu.close();
        }
    }

    /**
     * Détruit l'instance du composant et nettoie toutes les ressources
     * @public
     * @returns {void}
     */
    destroy(): void {
        this._removeMenu();

        super.destroy();
    }
}

/**
 * Enregistrement du Web Component k3ui-select
 * @description Permet l'utilisation de <k3ui-select> dans le HTML. Initialisation par AutoInit.
 * Le custom element crée un select natif et l'initialise avec le composant Select
 */
if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-select')) {
    customElements.define('k3ui-select', class extends HTMLElement {
        /** Élément select natif créé */
        private selectElement: HTMLSelectElement | null = null;

        /**
         * Callback appelé quand l'élément est connecté au DOM
         * @returns {void}
         */
        connectedCallback() {
            this.selectElement = document.createElement('select');

            let selectId = this.getAttribute('id');
            if (!selectId) {
                selectId = 'k3ui-select-' + generateGuid();
            }
            this.selectElement.setAttribute('id', selectId);

            // Copier les attributs vers le select natif
            const attrs = this.attributes;
            for (let i = 0; i < attrs.length; i++) {
                const attr = attrs[i];
                if (attr.name === 'variant') {
                    this.selectElement.setAttribute('variant', attr.value);
                } else if (attr.name === 'name') {
                    this.selectElement.setAttribute('name', attr.value);
                } else if (attr.name === 'required') {
                    this.selectElement.setAttribute('required', '');
                } else if (attr.name === 'disabled') {
                    this.selectElement.setAttribute('disabled', '');
                } else if (attr.name === 'class') {
                    this.selectElement.className = attr.value;
                } else if (attr.name === 'data-group') {
                    this.selectElement.setAttribute('data-group', attr.value);
                } else if (attr.name === 'leading-icon') {
                    this.selectElement.setAttribute('leading-icon', attr.value);
                } else if (attr.name === 'multiple') {
                    this.selectElement.setAttribute('multiple', '');
                }
            }

            this.selectElement.classList.add('select');

            // Copier les options depuis le contenu du custom element
            const options = Array.from(this.children);
            options.forEach(option => {
                if (option.tagName === 'OPTION') {
                    const optionEl = document.createElement('option');
                    optionEl.value = option.getAttribute('value') || '';
                    optionEl.textContent = option.textContent || '';
                    // Préserver le HTML original dans un attribut data pour parser les icônes
                    const optionHTML = (option as HTMLElement).innerHTML;
                    if (optionHTML && optionHTML.trim()) {
                        optionEl.setAttribute('data-option-html', optionHTML);
                    }
                    // Copier aussi les autres attributs data (y compris data-divider pour les dividers)
                    Array.from(option.attributes).forEach(attr => {
                        if (attr.name.startsWith('data-')) {
                            optionEl.setAttribute(attr.name, attr.value);
                        }
                    });
                    if (option.hasAttribute('selected')) {
                        optionEl.setAttribute('selected', '');
                    }
                    if (option.hasAttribute('disabled')) {
                        optionEl.setAttribute('disabled', '');
                    }
                    if (option.classList.contains('divider')) {
                        optionEl.classList.add('divider');
                    }
                    this.selectElement!.appendChild(optionEl);
                } else if (option.tagName === 'OPTGROUP') {
                    const optgroupEl = document.createElement('optgroup');
                    optgroupEl.label = option.getAttribute('label') || '';
                    const groupOptions = Array.from(option.children);
                    groupOptions.forEach(groupOption => {
                        if (groupOption.tagName === 'OPTION') {
                            const optionEl = document.createElement('option');
                            optionEl.value = groupOption.getAttribute('value') || '';
                            optionEl.textContent = groupOption.textContent || '';
                            // Préserver le HTML original dans un attribut data pour parser les icônes
                            const optionHTML = (groupOption as HTMLElement).innerHTML;
                            if (optionHTML && optionHTML.trim()) {
                                optionEl.setAttribute('data-option-html', optionHTML);
                            }
                            // Copier aussi les autres attributs data (y compris data-divider pour les dividers)
                            Array.from(groupOption.attributes).forEach(attr => {
                                if (attr.name.startsWith('data-')) {
                                    optionEl.setAttribute(attr.name, attr.value);
                                }
                            });
                            if (groupOption.hasAttribute('selected')) {
                                optionEl.setAttribute('selected', '');
                            }
                            if (groupOption.hasAttribute('disabled')) {
                                optionEl.setAttribute('disabled', '');
                            }
                            if (groupOption.classList.contains('divider')) {
                                optionEl.classList.add('divider');
                            }
                            optgroupEl.appendChild(optionEl);
                        }
                    });
                    this.selectElement!.appendChild(optgroupEl);
                }
            });

            // Créer un label si l'attribut label est présent
            const labelText = this.getAttribute('label');
            if (labelText) {
                const labelEl = document.createElement('label');
                labelEl.setAttribute('for', selectId);
                labelEl.textContent = labelText;
                this.parentNode?.insertBefore(labelEl, this);
            }

            // Remplacer le custom element par le select natif
            this.replaceWith(this.selectElement);

            // Initialiser le composant Select
            if (this.selectElement) {
                Select.init(this.selectElement);
            }
        }

        /**
         * Callback appelé quand l'élément est déconnecté du DOM
         * @returns {void}
         */
        disconnectedCallback() {
            const instance = this.selectElement ? Select.getInstance(this.selectElement) : undefined;
            if (instance && typeof instance.destroy === 'function') {
                instance.destroy();
            }
        }

        /**
         * Liste des attributs observés
         * @returns {string[]} Tableau des noms d'attributs
         * @static
         */
        static get observedAttributes() {
            return ['variant', 'name', 'required', 'disabled', 'id', 'class', 'data-group', 'label', 'leading-icon'];
        }

        /**
         * Callback appelé quand un attribut observé change
         * @param {string} name - Nom de l'attribut
         * @param {string | null} oldValue - Ancienne valeur
         * @param {string | null} newValue - Nouvelle valeur
         * @returns {void}
         */
        attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
            if (this.selectElement && oldValue !== newValue) {
                if (name === 'variant') {
                    this.selectElement.setAttribute('variant', newValue || 'outlined');
                } else if (name === 'name') {
                    this.selectElement.setAttribute('name', newValue || '');
                } else if (name === 'required') {
                    if (newValue !== null) {
                        this.selectElement.setAttribute('required', '');
                    } else {
                        this.selectElement.removeAttribute('required');
                    }
                } else if (name === 'disabled') {
                    if (newValue !== null) {
                        this.selectElement.setAttribute('disabled', '');
                    } else {
                        this.selectElement.removeAttribute('disabled');
                    }
                } else if (name === 'id') {
                    this.selectElement.setAttribute('id', newValue || '');
                } else if (name === 'class') {
                    this.selectElement.className = newValue || '';
                } else if (name === 'data-group') {
                    this.selectElement.setAttribute('data-group', newValue || '');
                } else if (name === 'leading-icon') {
                    this.selectElement.setAttribute('leading-icon', newValue || '');
                    const inst = this.selectElement ? Select.getInstance(this.selectElement) : undefined;
                    if (inst && inst.setLeadingIcon) {
                        inst.setLeadingIcon(newValue || null);
                    }
                }

                const inst = this.selectElement ? Select.getInstance(this.selectElement) : undefined;
                if (inst && (name === 'variant' || name === 'disabled')) {
                    inst.destroy();
                    Select.init(this.selectElement!);
                }
            }
        }
    });
}


