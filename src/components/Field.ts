/**
 * K3UI Field Component
 * Composant de champ de texte basé sur Material Design 3
 * Inspiré de MDUI text-field
 *
 * @summary Champ de texte Material Design 3
 * @element k3ui-field
 *
 * @event focus - Obtient le focus
 * @event blur - Perd le focus
 * @event change - La valeur change et perd le focus
 * @event input - La valeur change
 * @event invalid - Validation échouée
 * @event clear - Bouton clear cliqué
 *
 * @slot icon - Icône gauche
 * @slot end-icon - Icône droite
 * @slot error-icon - Icône d'erreur
 * @slot prefix - Texte préfixe
 * @slot suffix - Texte suffixe
 * @slot clear-button - Bouton clear personnalisé
 * @slot clear-icon - Icône du bouton clear
 * @slot toggle-password-button - Bouton toggle password personnalisé
 * @slot show-password-icon - Icône afficher mot de passe
 * @slot hide-password-icon - Icône masquer mot de passe
 * @slot helper - Texte d'aide
 *
 * @cssprop --field-container-bg - Couleur de fond du container
 * @cssprop --field-border-color - Couleur de la bordure
 * @cssprop --field-label-color - Couleur du label
 * @cssprop --field-input-color - Couleur du texte
 */

import { Component } from '../core/base/Component';
import { attributeNameToCamelCase, defineK3UIElement } from '../core/base/K3UIElement';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import { FieldOptions } from '../types/components';
import { PriorityLevel } from '../types/base';
import { KElement, InitElements } from '../types/base';
import { LoggerManager, IconManager, LocaleManager } from '../core/managers';
import { InputPattern } from '../utils/validation';
import { setAriaAttribute } from '../utils/dom/aria';
import { getFieldDefaults } from '../specs/components/field.specs';
import { generateShortId } from '../utils/helpers/guid';

/**
 * Options par défaut du composant Field
 * @description Extrait depuis les specs pour garantir la cohérence
 */
const _defaults: FieldOptions = getFieldDefaults();

/** Padding horizontal par défaut du label (tokens field) */
const FIELD_LABEL_PADDING_LEFT = 16;
const FIELD_LABEL_PADDING_RIGHT = 16;

/** Décalage leading icon : padding 12 + icône 24 + espacement 16 */
const FIELD_LABEL_LEADING_ICON_INSET = 52;

/**
 * Classe du composant Field
 * @description Composant de champ de texte basé sur Material Design 3 avec support des variantes, validation, autosize et accessibilité
 * @class Field
 * @extends {Component<FieldOptions>}
 */
export class Field extends Component<FieldOptions> {
    declare el: HTMLElement;

    /**
     * Élément input ou textarea du champ
     * @public
     */
    inputElement: HTMLInputElement | HTMLTextAreaElement | null = null;

    /**
     * Élément container principal (.input-field)
     * @public
     */
    containerElement: HTMLDivElement | null = null;

    /**
     * Élément label du champ
     * @public
     */
    labelElement: HTMLLabelElement | null = null;

    /**
     * Élément compteur de caractères
     * @public
     */
    counterElement: HTMLDivElement | null = null;

    /**
     * Élément texte d'aide (helper text)
     * @public
     */
    helperElement: HTMLDivElement | null = null;

    /**
     * Élément icône trailing (référence pour clic si onTrailingIconClick)
     * @private
     */
    private trailingIconElement: HTMLElement | null = null;

    /**
     * Élément bouton toggle password
     * @public
     */
    togglePasswordElement: HTMLElement | null = null;

    /**
     * Élément bouton clear
     * @private
     */
    private clearButtonElement: HTMLElement | null = null;

    /**
     * Indique si le mot de passe est visible
     * @public
     */
    isPasswordVisible: boolean = false;

    /**
     * Indique si le champ a une valeur
     * @public
     */
    hasValue: boolean = false;

    /**
     * Indique si le champ est invalide
     * @public
     */
    invalid: boolean = false;

    /**
     * Message d'erreur personnalisé (serveur, setError)
     * @private
     */
    private customErrorMessage = '';

    /**
     * Niveau de priorité du composant
     * @readonly
     * @public
     */
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    /**
     * Constructeur du composant Field
     * @param {HTMLElement} el - Élément HTML k3ui-field
     * @param {Partial<FieldOptions>} [options={}] - Options de configuration
     * @constructor
     */
    constructor(el: HTMLElement, options: Partial<FieldOptions> = {}) {
        // Lire les attributs HTML et les convertir en options
        // Les attributs HTML ont la priorité sur les options passées en paramètre
        const htmlOptions = Field.readAttributes(el);

        super(el, { ...options, ...htmlOptions }, toComponentClassDef(Field));

        // Initialiser le composant
        this.init();
    }

    /**
     * Récupère l'instance Field associée à un élément
     * @param {HTMLElement} el - Élément HTML
     * @returns {Field} Instance du field ou undefined
     * @static
     */
    static getInstance(el: HTMLElement): Field | undefined {
        return Component.getInstance(el) as Field | undefined;
    }

    /**
     * Retourne les options par défaut du composant
     * @returns {FieldOptions} Options par défaut
     * @static
     */
    static get defaults(): FieldOptions {
        return _defaults;
    }

    /**
     * Initialise une instance de Field
     * @param {HTMLElement} el - Élément HTML k3ui-field
     * @param {Partial<FieldOptions>} [options] - Options du composant
     * @returns {Field} Instance du field
     * @static
     */
    static init(el: HTMLElement, options?: Partial<FieldOptions>): Field;

    /**
     * Initialise plusieurs instances de Field
     * @param {InitElements<KElement>} els - Collection d'éléments HTML
     * @param {Partial<FieldOptions>} [options] - Options du composant
     * @returns {Field[]} Tableau d'instances de field
     * @static
     */
    static init(els: InitElements<KElement>, options?: Partial<FieldOptions>): Field[];
    static init(
        els: HTMLElement | InitElements<KElement>,
        options?: Partial<FieldOptions>
    ): Field | Field[] {

        if (els instanceof Element) {
            // Vérifier si une instance existe déjà
            const existingInstance = Field.getInstance(els as HTMLElement);
            if (existingInstance) {
                // Si une instance existe, réinitialiser au lieu de créer une nouvelle
                existingInstance.init();
                return existingInstance;
            }
            return new Field(els as HTMLElement, options);
        } else if (!!els && els.length) {
            const instances = [];
            for (let i = 0; i < els.length; i++) {
                const el = els[i] as HTMLElement;
                // Vérifier si une instance existe déjà
                const existingInstance = Field.getInstance(el);
                if (existingInstance) {
                    // Si une instance existe, réinitialiser au lieu de créer une nouvelle
                    existingInstance.init();
                    instances.push(existingInstance);
                } else {
                    instances.push(new Field(el, options));
                }
            }
            return instances;
        }
        return [];
    }

    /**
     * Lit les attributs HTML et les convertit en options
     * @private
     * @param {HTMLElement} el - Élément HTML à analyser
     * @returns {Partial<FieldOptions>} Options extraites des attributs HTML
     * @static
     */
    private static readAttributes(el: HTMLElement): Partial<FieldOptions> {
        const options: Partial<FieldOptions> = {};

        // Lire les attributs HTML
        if (el.hasAttribute('variant')) {
            options.variant = el.getAttribute('variant') as 'filled' | 'outlined' | 'plain';
        }
        if (el.hasAttribute('type')) {
            options.type = el.getAttribute('type') || 'text';
        }
        if (el.hasAttribute('name')) {
            options.name = el.getAttribute('name') || '';
        }
        if (el.hasAttribute('value')) {
            options.value = el.getAttribute('value') || '';
        }
        if (el.hasAttribute('label')) {
            options.label = el.getAttribute('label') || undefined;
        }
        if (el.hasAttribute('placeholder')) {
            options.placeholder = el.getAttribute('placeholder') || undefined;
        }
        if (el.hasAttribute('helper')) {
            options.helper = el.getAttribute('helper') || undefined;
        }
        if (el.hasAttribute('prefix')) {
            options.prefix = el.getAttribute('prefix') || undefined;
        }
        if (el.hasAttribute('suffix')) {
            options.suffix = el.getAttribute('suffix') || undefined;
        }
        if (el.hasAttribute('leading-icon')) {
            options.leadingIcon = el.getAttribute('leading-icon') || undefined;
        }
        if (el.hasAttribute('trailing-icon')) {
            options.trailingIcon = el.getAttribute('trailing-icon') || undefined;
        }

        // Attributs booléens
        options.clearable = el.hasAttribute('clearable');
        options.endAligned = el.hasAttribute('end-aligned');
        options.readonly = el.hasAttribute('readonly');
        options.disabled = el.hasAttribute('disabled');
        options.required = el.hasAttribute('required');
        options.togglePassword = el.hasAttribute('toggle-password');
        options.helperOnFocus = el.hasAttribute('helper-on-focus');
        options.autosize = el.hasAttribute('autosize');
        options.counter = el.hasAttribute('counter');

        // Attributs numériques
        if (el.hasAttribute('rows')) {
            options.rows = parseInt(el.getAttribute('rows') || '1');
        }
        if (el.hasAttribute('min-rows')) {
            options.minRows = parseInt(el.getAttribute('min-rows') || '1');
        }
        if (el.hasAttribute('max-rows')) {
            options.maxRows = parseInt(el.getAttribute('max-rows') || '10');
        }
        if (el.hasAttribute('minlength')) {
            options.minLength = parseInt(el.getAttribute('minlength') || '0');
        }
        if (el.hasAttribute('maxlength')) {
            options.maxLength = parseInt(el.getAttribute('maxlength') || '0');
        }
        if (el.hasAttribute('min-counter')) {
            options.minCounter = parseFloat(el.getAttribute('min-counter') || '0');
        }
        if (el.hasAttribute('max-counter')) {
            options.maxCounter = parseFloat(el.getAttribute('max-counter') || '0');
        }
        if (el.hasAttribute('step')) {
            options.step = parseFloat(el.getAttribute('step') || '1');
        }

        // Autres attributs
        if (el.hasAttribute('pattern')) {
            options.pattern = el.getAttribute('pattern');
        }
        if (el.hasAttribute('validation-message')) {
            options.validationMessage = el.getAttribute('validation-message');
        }
        if (el.hasAttribute('autocomplete')) {
            options.autocomplete = el.getAttribute('autocomplete') || undefined;
        }
        if (el.hasAttribute('filled-bg')) {
            options.filledBg = el.getAttribute('filled-bg') || undefined;
        }
        if (el.hasAttribute('notch-bg')) {
            options.notchBg = el.getAttribute('notch-bg') || undefined;
        }
        if (el.hasAttribute('density')) {
            options.density = el.getAttribute('density') as FieldOptions['density'];
        }
        if (el.hasAttribute('error-text')) {
            options.errorText = el.getAttribute('error-text') || undefined;
        }

        return options;
    }

    /**
     * Récupère les nœuds assignés à un slot avant construction du DOM
     * @private
     */
    private collectSlottedElements(slotName: string): Element[] {
        return Array.from(this.el.querySelectorAll(`[slot="${slotName}"]`));
    }

    /**
     * Installe une icône leading depuis un slot ou les options
     * @private
     */
    private mountLeadingIcon(): void {
        if (!this.containerElement) return;

        const slotted = this.collectSlottedElements('icon');
        if (slotted.length) {
            slotted.forEach((node) => {
                node.removeAttribute('slot');
                if (node instanceof HTMLElement) {
                    node.classList.add('leading-icon');
                }
                this.containerElement?.appendChild(node);
            });
            this.containerElement.classList.add('has-leading-icon');
            return;
        }

        if (this.options.leadingIcon) {
            const leadingIconElement = document.createElement('i');
            leadingIconElement.className = 'k3ui-icon leading-icon';
            leadingIconElement.setAttribute('name', this.options.leadingIcon);
            this.containerElement.appendChild(leadingIconElement);
            this.containerElement.classList.add('has-leading-icon');
        }
    }

    /**
     * Installe une icône trailing depuis un slot ou les options
     * @private
     */
    private mountTrailingIcon(): void {
        if (!this.containerElement) return;

        const slottedEnd = this.collectSlottedElements('end-icon');

        if (slottedEnd.length) {
            slottedEnd.forEach((node) => {
                node.removeAttribute('slot');
                if (node instanceof HTMLElement) {
                    node.classList.add('trailing-icon');
                    if (this.options.onTrailingIconClick) {
                        node.classList.add('trailing-icon--action');
                        node.setAttribute('role', 'button');
                        node.setAttribute('tabindex', '-1');
                        setAriaAttribute(node, 'label', this.options.trailingIconLabel || '');
                    }
                    this.trailingIconElement = node;
                }
                this.containerElement?.appendChild(node);
            });
            this.containerElement.classList.add('has-trailing-icon');
            return;
        }

        if (this.options.trailingIcon) {
            const trailingIconElement = document.createElement('i');
            trailingIconElement.className = 'k3ui-icon trailing-icon';
            trailingIconElement.setAttribute('name', this.options.trailingIcon);
            if (this.options.onTrailingIconClick) {
                trailingIconElement.classList.add('trailing-icon--action');
                trailingIconElement.setAttribute('role', 'button');
                trailingIconElement.setAttribute('tabindex', '-1');
                setAriaAttribute(trailingIconElement, 'label', this.options.trailingIconLabel || '');
            }
            this.containerElement.appendChild(trailingIconElement);
            this.trailingIconElement = trailingIconElement;
            this.containerElement.classList.add('has-trailing-icon');
        }
    }

    /**
     * Initialise le composant Field
     * @description Crée la structure DOM, configure les événements et applique les styles
     * @public
     * @returns {void}
     */
    init(): void {

        LoggerManager.global.info('Field component initialized');

        // Vérifier si la structure existe déjà pour éviter les doublons
        const existingContainers = this.el.querySelectorAll('.input-field');
        if (existingContainers.length > 0) {
            // Si plusieurs containers existent, supprimer les doublons (garder seulement le premier)
            if (existingContainers.length > 1) {
                for (let i = 1; i < existingContainers.length; i++) {
                    existingContainers[i].remove();
                }
            }

            // Réutiliser le premier container existant
            this.containerElement = existingContainers[0] as HTMLDivElement;
            this.inputElement = this.containerElement.querySelector('input, textarea') as HTMLInputElement | HTMLTextAreaElement | null;
            this.labelElement = (
                this.el.querySelector(':scope > label.label') ??
                this.containerElement.querySelector('label.label')
            ) as HTMLLabelElement | null;

            // Vérifier aussi les bottom containers
            const existingBottomContainers = this.el.querySelectorAll('.field-bottom');
            if (existingBottomContainers.length > 1) {
                // Supprimer les doublons de bottom containers
                for (let i = 1; i < existingBottomContainers.length; i++) {
                    existingBottomContainers[i].remove();
                }
            }
            if (existingBottomContainers.length > 0) {
                this.counterElement = existingBottomContainers[0].querySelector('.field-display-counter') as HTMLDivElement | null;
                this.helperElement = existingBottomContainers[0].querySelector('.helper-text') as HTMLDivElement | null;
            }

            this.clearButtonElement = this.containerElement.querySelector('.clear-button') as HTMLElement | null;
            if (this.options.clearable && !this.clearButtonElement) {
                this.createClearButton();
            }
            this.togglePasswordElement = this.containerElement.querySelector('.toggle-password-button') as HTMLElement | null;

            // Réinitialiser les événements et l'état seulement si nécessaire
            // Ne pas réinitialiser les événements si déjà configurés pour éviter les doublons
            if (!this.inputElement || !this.inputElement.hasAttribute('data-events-setup')) {
                this.setupEvents();
                if (this.inputElement) {
                    this.inputElement.setAttribute('data-events-setup', 'true');
                }
            }
            this.applyStyles();
            if (this.inputElement) {
                this.hasValue = this.inputElement.value.length > 0;
            }
            this.updateState();
            this.syncInvalidFromHost();

            if (this.options.autosize && this.inputElement instanceof HTMLTextAreaElement) {
                this.initAutosize();
            }
            return;
        }

        // Créer la structure DOM
        this.createStructure();

        // Configurer les événements
        this.setupEvents();

        // Intégration DatePicker / TimePicker pour les types date et time
        this.setupPickerIntegration();

        // Appliquer les styles
        this.applyStyles();

        // Initialiser hasValue avec la valeur par défaut du HTML
        if (this.inputElement) {
            this.hasValue = this.inputElement.value.length > 0;
        }

        // Initialiser l'état visuel
        this.updateState();
        this.syncInvalidFromHost();

        // Initialiser l'autosize si activé
        if (this.options.autosize && this.inputElement instanceof HTMLTextAreaElement) {
            this.initAutosize();
        }
    }

    /**
     * Crée la structure DOM du composant
     * @description Crée le container, l'input/textarea, le label, les icônes et les éléments de support
     * @private
     * @returns {void}
     */
    private createStructure(): void {
        // Pour les types date/heure, ajouter l'icône trailing (calendrier / horloge) si absente
        const dateTypes = ['date', 'datetime-local', 'month', 'week'];
        if (dateTypes.includes(this.options.type) && !this.options.trailingIcon) {
            this.options.trailingIcon = 'calendar';
        }
        if (this.options.type === 'time' && !this.options.trailingIcon) {
            this.options.trailingIcon = 'clock';
        }

        // Créer le container principal avec la classe attendue par SCSS
        this.containerElement = document.createElement('div');
        this.containerElement.className = 'input-field';

        // Créer l'input ou textarea selon Material Design 3 Expressive
        // Un textarea est créé si:
        // - L'attribut rows est défini avec une valeur > 1
        // - L'attribut autosize est activé (textarea multi-ligne selon MD3)
        // Note: Le counter ne force pas l'utilisation d'un textarea
        if ((this.options.rows && this.options.rows > 1) || this.options.autosize) {
            this.inputElement = document.createElement('textarea');
            if (this.options.rows) {
                (this.inputElement as HTMLTextAreaElement).rows = this.options.rows;
            } else {
                // Valeur par défaut pour les textareas selon Material Design 3 (3 lignes minimum)
                (this.inputElement as HTMLTextAreaElement).rows = 3;
            }
        } else {
            this.inputElement = document.createElement('input');
        }

        // Ajouter la classe CSS pour les styles Material Design
        this.inputElement.className = 'input';

        // Configurer l'input
        if (this.inputElement) {
            if (this.inputElement instanceof HTMLInputElement) {
                this.inputElement.type = this.options.type;
                if (this.options.pattern) {
                    this.inputElement.pattern = this.options.pattern;
                }
                if (this.options.minCounter !== null) {
                    this.inputElement.min = this.options.minCounter.toString();
                }
                if (this.options.maxCounter !== null) {
                    this.inputElement.max = this.options.maxCounter.toString();
                }
                if (this.options.step !== null) {
                    this.inputElement.step = this.options.step.toString();
                }
            }

            this.inputElement.name = this.options.name ?? '';
            this.inputElement.value = this.options.value ?? '';
            this.inputElement.placeholder = this.options.placeholder || '';
            this.inputElement.readOnly = this.options.readonly ?? false;
            this.inputElement.disabled = this.options.disabled ?? false;
            this.inputElement.required = this.options.required ?? false;

            if (this.options.minLength) {
                this.inputElement.minLength = this.options.minLength;
            }
            if (this.options.maxLength) {
                this.inputElement.maxLength = this.options.maxLength;
            }
        }

        // Créer le label si nécessaire
        if (this.options.label) {
            this.labelElement = document.createElement('label');
            this.labelElement.textContent = this.options.label;
            this.labelElement.className = 'label';
        }

        // Associer le label à l'input pour l'accessibilité
        if (this.labelElement && this.inputElement) {
            if (!this.inputElement.id) {
                this.inputElement.id = generateShortId('k3ui-field');
            }
            this.labelElement.htmlFor = this.inputElement.id;
        }

        // Créer le counter si nécessaire (automatique si maxLength est défini)
        if (this.options.maxLength) {
            this.counterElement = document.createElement('div');
            this.counterElement.className = 'field-display-counter';
            this.updateCounter();
        }

        // Créer le texte d'aide si nécessaire
        if (this.options.helper) {
            this.helperElement = document.createElement('div');
            this.helperElement.textContent = this.options.helper;
            this.helperElement.className = 'helper-text';
        }

        // Créer les icônes si nécessaire — géré après assemblage via mountLeadingIcon/mountTrailingIcon

        // Assembler la structure
        if (this.containerElement && this.inputElement) {
            // Créer un wrapper pour le texte intégré
            const textWrapper = document.createElement('div');
            textWrapper.className = 'text-wrapper';
            textWrapper.style.display = 'flex';
            textWrapper.style.alignItems = 'center';
            textWrapper.style.flex = '1';

            // Ajouter le prefix si nécessaire
            if (this.options.prefix) {
                const prefixElement = document.createElement('span');
                prefixElement.className = 'prefix-text';
                prefixElement.textContent = this.options.prefix;
                textWrapper.appendChild(prefixElement);
            }

            // Ajouter l'input
            textWrapper.appendChild(this.inputElement);

            // Ajouter le suffix si nécessaire
            if (this.options.suffix) {
                const suffixElement = document.createElement('span');
                suffixElement.className = 'suffix-text';
                suffixElement.textContent = this.options.suffix;
                textWrapper.appendChild(suffixElement);
            }

            this.containerElement.appendChild(textWrapper);

            this.mountLeadingIcon();
            this.mountTrailingIcon();

            if (this.trailingIconElement && this.options.onTrailingIconClick) {
                try {
                    IconManager.updateIcon(this.trailingIconElement);
                } catch (_) { /* no-op */ }
            }

            // Créer le bouton toggle password si nécessaire
            if (this.options.togglePassword && this.options.type === 'password' && this.containerElement) {
                this.togglePasswordElement = document.createElement('i');
                this.togglePasswordElement.className = 'k3ui-icon toggle-password-button';
                this.togglePasswordElement.setAttribute('name', this.options.showPasswordIcon);
                setAriaAttribute(this.togglePasswordElement, 'label', LocaleManager.t('field.showPassword'));
                this.togglePasswordElement.setAttribute('tabindex', '-1');
                this.togglePasswordElement.setAttribute('role', 'button');
                this.containerElement.appendChild(this.togglePasswordElement);
            }

            // Créer le bouton clear si nécessaire
            if (this.options.clearable) {
                this.createClearButton();
            }

            if (this.labelElement) {
                if (this.options.variant === 'plain') {
                    this.el.appendChild(this.labelElement);
                } else {
                    this.containerElement.appendChild(this.labelElement);
                }
            }

            // Ajouter le container à l'élément k3ui-field (pas remplacer)
            this.el.appendChild(this.containerElement);
        }

        // Créer un conteneur pour aligner helper et counter sur la même ligne
        if (this.helperElement || this.counterElement) {
            const bottomContainer = document.createElement('div');
            bottomContainer.className = 'field-bottom';

            if (this.helperElement) {
                bottomContainer.appendChild(this.helperElement);
            }
            if (this.counterElement) {
                bottomContainer.appendChild(this.counterElement);
            }

            this.el.appendChild(bottomContainer);
        }

        // Forcer l'initialisation de toutes les icônes après que tout soit dans le DOM
        if (this.el.querySelectorAll('i.k3ui-icon[name]').length > 0) {
            // Utiliser setTimeout pour s'assurer que l'élément est dans le DOM
            setTimeout(() => {
                IconManager.forceDisplayIcons();
                this.updateLabelInsets();
            }, 0);
        } else {
            this.updateLabelInsets();
        }
    }

    /**
     * Configure les événements du composant
     * @description Ajoute les listeners pour focus, blur, input, change, invalid, keydown, copy et toggle password
     * @private
     * @returns {void}
     */
    private setupEvents(): void {
        if (!this.inputElement) return;

        this.registerEvent(this.inputElement, 'focus', this.handleFocus);
        this.registerEvent(this.inputElement, 'blur', this.handleBlur);
        this.registerEvent(this.inputElement, 'input', this.handleInput);
        this.registerEvent(this.inputElement, 'change', this.handleChange);
        this.registerEvent(this.inputElement, 'invalid', this.handleInvalid);
        this.registerEvent(this.inputElement, 'keydown', this.handleKeyDown as EventListener);
        this.registerEvent(this.inputElement, 'mousedown', this.handlePointerDown);
        this.registerEvent(this.inputElement, 'pointerdown', this.handlePointerDown);

        // Gestionnaire pour la copie (téléphones et hex)
        const copyPatterns = ['phone_intl', 'phone_fr', 'hex_color'];
        if (this.options.pattern && copyPatterns.includes(this.options.pattern)) {
            this.registerEvent(this.inputElement, 'copy', this.handleCopy as EventListener);
        }

        // Ajouter l'événement pour le toggle password
        if (this.togglePasswordElement) {
            this.registerEvent(this.togglePasswordElement, 'click', this.handleTogglePassword);
        }

        // Le bouton clear enregistre son listener dans createClearButton()

        // Ajouter l'événement pour l'icône trailing cliquable (ex. copier)
        if (this.trailingIconElement && this.options.onTrailingIconClick) {
            this.registerEvent(this.trailingIconElement, 'click', this.handleTrailingIconClick);
        }
    }

    /**
     * Configure l'ouverture de DatePicker / TimePicker pour les champs date et time
     * @private
     */
    private setupPickerIntegration(): void {
        if (!this.inputElement || !(this.inputElement instanceof HTMLInputElement)) return;

        const dateTypes = ['date', 'datetime-local', 'month', 'week'];
        const isDateType = dateTypes.includes(this.options.type);
        const isTimeType = this.options.type === 'time';

        if (isDateType) {
            this.registerEvent(this.inputElement, 'click', this.handleDateFieldClick);
            if (this.trailingIconElement) {
                this.registerEvent(this.trailingIconElement, 'click', this.handleDatePickerIconClick);
            }
        } else if (isTimeType) {
            this.registerEvent(this.inputElement, 'click', this.handleTimeFieldClick);
            if (this.trailingIconElement) {
                this.registerEvent(this.trailingIconElement, 'click', this.handleTimePickerIconClick);
            }
        }
    }

    private handleDateFieldClick = (e: Event): void => {
        e.preventDefault();
        if (this.options.disabled || this.options.readonly) return;
        void this.openDatePickerForField();
    };

    private handleDatePickerIconClick = (e: Event): void => {
        e.preventDefault();
        e.stopPropagation();
        if (this.options.disabled || this.options.readonly) return;
        this.openDatePickerForField();
    };

    private handleTimeFieldClick = (e: Event): void => {
        e.preventDefault();
        if (this.options.disabled || this.options.readonly) return;
        void this.openTimePickerForField();
    };

    private handleTimePickerIconClick = (e: Event): void => {
        e.preventDefault();
        e.stopPropagation();
        if (this.options.disabled || this.options.readonly) return;
        this.openTimePickerForField();
    };

    /**
     * Ouvre le DatePicker en modal et recopie la date sélectionnée dans le champ
     * @private
     */
    private async openDatePickerForField(): Promise<void> {
        if (!this.inputElement || !(this.inputElement instanceof HTMLInputElement)) return;

        const { Datepicker } = await import('./Datepicker');

        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'position:fixed;left:-9999px;top:0;pointer-events:none;';

        const datepickerEl = document.createElement('k3ui-datepicker');
        datepickerEl.className = 'no-autoinit';
        datepickerEl.setAttribute('variant', this.options.variant || 'filled');
        datepickerEl.setAttribute('show-icon', '');
        const currentValue = this.inputElement.value;
        if (currentValue) {
            datepickerEl.setAttribute('value', currentValue);
            datepickerEl.setAttribute('selected-date', currentValue);
        }
        wrapper.appendChild(datepickerEl);

        const dp = Datepicker.init(datepickerEl, {
            onClose: () => {
                const date = dp.getDate();
                if (this.inputElement) {
                    if (date) {
                        const y = date.getFullYear();
                        const m = String(date.getMonth() + 1).padStart(2, '0');
                        const d = String(date.getDate()).padStart(2, '0');
                        if (this.options.type === 'date') {
                            this.inputElement.value = `${y}-${m}-${d}`;
                        } else if (this.options.type === 'month') {
                            this.inputElement.value = `${y}-${m}`;
                        } else if (this.options.type === 'week') {
                            const oneJan = new Date(date.getFullYear(), 0, 1);
                            const weekNum = Math.ceil((((date.getTime() - oneJan.getTime()) / 86400000) + oneJan.getDay() + 1) / 7);
                            this.inputElement.value = `${y}-W${String(weekNum).padStart(2, '0')}`;
                        } else if (this.options.type === 'datetime-local') {
                            const prev = this.inputElement.value;
                            const timePart = prev && prev.includes('T') ? prev.slice(prev.indexOf('T')) : 'T00:00';
                            this.inputElement.value = `${y}-${m}-${d}${timePart}`;
                        } else {
                            this.inputElement.value = `${y}-${m}-${d}`;
                        }
                    } else {
                        this.inputElement.value = '';
                    }
                    this.hasValue = this.inputElement.value.length > 0;
                    this.updateState();
                    this.inputElement.dispatchEvent(new Event('input', { bubbles: true }));
                    this.inputElement.dispatchEvent(new Event('change', { bubbles: true }));
                }
                dp.destroy();
                wrapper.remove();
            }
        });

        document.body.appendChild(wrapper);
        dp.open();
    }

    /**
     * Ouvre le TimePicker en modal et recopie l'heure sélectionnée dans le champ
     * @private
     */
    private async openTimePickerForField(): Promise<void> {
        if (!this.inputElement || !(this.inputElement instanceof HTMLInputElement)) return;

        const { Timepicker } = await import('./Timepicker');

        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'position:fixed;left:-9999px;top:0;pointer-events:none;';

        const timepickerEl = document.createElement('k3ui-timepicker');
        timepickerEl.className = 'no-autoinit';
        timepickerEl.setAttribute('variant', this.options.variant || 'filled');
        timepickerEl.setAttribute('show-icon', '');
        const currentValue = this.inputElement.value;
        if (currentValue) {
            const [h, m] = currentValue.split(':').map((n) => parseInt(n, 10));
            if (!isNaN(h) && !isNaN(m)) {
                timepickerEl.setAttribute('value', currentValue);
            }
        }
        wrapper.appendChild(timepickerEl);

        const fieldInput = this.inputElement;
        const fieldRef = this;
        let valueApplied = false;

        const applyTimeToField = (time: { hours: number; minutes: number } | null): void => {
            if (!fieldInput || valueApplied) return;
            if (time) {
                const h = String(time.hours).padStart(2, '0');
                const min = String(time.minutes).padStart(2, '0');
                fieldInput.value = `${h}:${min}`;
                fieldRef.hasValue = true;
                fieldRef.updateState();
                fieldInput.dispatchEvent(new Event('input', { bubbles: true }));
                fieldInput.dispatchEvent(new Event('change', { bubbles: true }));
                valueApplied = true;
            }
        };

        const tp = Timepicker.init(timepickerEl, {
            onSelect: (time: { hours: number; minutes: number } | null) => {
                applyTimeToField(time);
            },
            onClose: () => {
                if (!valueApplied) {
                    const time = tp.getTime();
                    applyTimeToField(time);
                }
                tp.destroy();
                wrapper.remove();
            }
        });

        document.body.appendChild(wrapper);
        tp.open();
    }

    /**
     * Gestionnaire du clic sur l'icône trailing (ex. copier)
     * @private
     */
    private handleTrailingIconClick = (): void => {
        if (this.options.onTrailingIconClick) {
            this.options.onTrailingIconClick(this);
        }
    };

    /**
     * Synchronise l'état d'interaction du champ (disabled / readonly)
     * @private
     */
    private applyInputInteractionState(): void {
        if (!this.inputElement) return;

        const isNonInteractive = Boolean(this.options.disabled || this.options.readonly);

        this.inputElement.readOnly = this.options.readonly ?? false;
        this.inputElement.required = this.options.required ?? false;
        this.inputElement.disabled = this.options.disabled ?? false;

        if (isNonInteractive) {
            this.inputElement.setAttribute('tabindex', '-1');
        } else {
            this.inputElement.removeAttribute('tabindex');
        }

        if (this.options.disabled) {
            setAriaAttribute(this.inputElement, 'disabled', true);
        } else {
            setAriaAttribute(this.inputElement, 'disabled', false);
        }

        if (this.options.readonly) {
            setAriaAttribute(this.inputElement, 'readonly', true);
        } else {
            setAriaAttribute(this.inputElement, 'readonly', false);
        }

        if (this.labelElement) {
            if (isNonInteractive) {
                this.labelElement.removeAttribute('for');
            } else if (this.inputElement.id) {
                this.labelElement.htmlFor = this.inputElement.id;
            }
        }
    }

    /**
     * Applique les styles du composant
     * @description Configure les classes CSS, les attributs et les variables CSS selon les options
     * @private
     * @returns {void}
     */
    private applyStyles(): void {
        if (!this.containerElement) return;

        // Définir l'attribut variant sur l'élément k3ui-field pour les styles SCSS
        this.el.setAttribute('variant', this.options.variant);

        // Configurer l'autocomplétion
        this.configureAutocomplete();

        // Définir l'attribut disabled sur l'élément k3ui-field pour les styles SCSS
        if (this.options.disabled) {
            this.el.setAttribute('disabled', '');
        } else {
            this.el.removeAttribute('disabled');
        }

        if (this.options.readonly) {
            this.el.setAttribute('readonly', '');
        } else {
            this.el.removeAttribute('readonly');
        }

        if (this.options.required) {
            this.el.setAttribute('required', '');
        } else {
            this.el.removeAttribute('required');
        }

        if (this.options.clearable) {
            this.el.setAttribute('clearable', '');
            if (!this.clearButtonElement) {
                this.createClearButton();
            }
        } else {
            this.el.removeAttribute('clearable');
        }

        if (this.inputElement) {
            this.applyInputInteractionState();
        }

        // Définir la variable CSS --rows pour les textareas selon Material Design 3
        if (this.options.rows && this.options.rows > 1) {
            this.el.style.setProperty('--rows', this.options.rows.toString());
        } else if (this.inputElement instanceof HTMLTextAreaElement) {
            // Valeur par défaut de 3 lignes pour les textareas selon MD3
            this.el.style.setProperty('--rows', '3');
        } else {
            this.el.style.removeProperty('--rows');
        }

        // Ajouter les classes CSS selon la structure SCSS
        if (this.options.clearable) {
            this.containerElement.classList.add('clearable');
        } else {
            this.containerElement.classList.remove('clearable');
        }
        if (this.options.togglePassword) {
            this.containerElement.classList.add('toggle-password');
            this.el.classList.add('toggle-password');
        } else {
            this.containerElement.classList.remove('toggle-password');
            this.el.classList.remove('toggle-password');
        }
        if (this.options.endAligned) {
            this.containerElement.classList.add('end-aligned');
        }
        if (this.options.leadingIcon) {
            this.containerElement.classList.add('has-leading-icon');
        }
        if (this.options.trailingIcon) {
            this.containerElement.classList.add('has-trailing-icon');
        }
        if (this.options.prefix) {
            this.containerElement.classList.add('has-prefix');
        }
        if (this.options.suffix) {
            this.containerElement.classList.add('has-suffix');
        }

        this.applyFilledBackground();
        this.applyNotchBackground();
        this.updateClearButtonVisibility();
        this.syncDensity();
        this.updateLabelInsets();
    }

    /**
     * Hérite la densité d'un ancêtre `[density]` ou `k3ui-fieldset`
     * @private
     */
    private syncDensity(): void {
        let density = this.el.getAttribute('density') || this.options.density || '';

        if (!density) {
            const inherited = this.el.closest('[density], k3ui-fieldset[density]');
            density = inherited?.getAttribute('density') ?? '';
        }

        if (density && density !== 'default') {
            this.el.setAttribute('density', density);
            this.el.dataset.density = density;
        } else {
            this.el.removeAttribute('density');
            delete this.el.dataset.density;
        }
    }

    /**
     * Détecte la présence d'un adornement leading (icône ou slot)
     * @private
     */
    private hasLeadingAdornment(): boolean {
        if (!this.containerElement) return false;
        return Boolean(
            this.containerElement.querySelector('.leading-icon')
            || this.containerElement.classList.contains('has-leading-icon'),
        );
    }

    /**
     * Détecte la présence d'un adornement trailing (icône, action, clear, toggle, erreur)
     * @private
     */
    private hasTrailingAdornment(): boolean {
        if (!this.containerElement) return false;
        return Boolean(
            this.containerElement.querySelector('.trailing-icon')
            || this.containerElement.querySelector('.error-icon')
            || this.containerElement.querySelector('.toggle-password-button')
            || (this.clearButtonElement && !this.clearButtonElement.hidden)
            || this.containerElement.classList.contains('has-trailing-icon'),
        );
    }

    /**
     * Calcule les insets horizontaux du label pour éviter le chevauchement avec les adornements
     * @private
     */
    private updateLabelInsets(): void {
        if (!this.containerElement) return;

        const hasLeading = this.hasLeadingAdornment();
        const hasTrailing = this.hasTrailingAdornment();

        this.el.toggleAttribute('data-leading', hasLeading);
        this.el.toggleAttribute('data-trailing', hasTrailing);

        const insetStart = hasLeading ? FIELD_LABEL_LEADING_ICON_INSET : FIELD_LABEL_PADDING_LEFT;
        const insetEnd = hasTrailing ? FIELD_LABEL_LEADING_ICON_INSET : FIELD_LABEL_PADDING_RIGHT;

        this.el.style.setProperty('--k3ui-field-label-inset-start', `${insetStart}px`);
        this.el.style.setProperty('--k3ui-field-label-inset-end', `${insetEnd}px`);
        this.el.style.setProperty('--k3ui-field-lead', `${insetStart}px`);
        this.el.style.setProperty('--k3ui-field-trail', `${insetEnd}px`);
        this.containerElement.style.setProperty('--k3ui-field-label-inset-start', `${insetStart}px`);
        this.containerElement.style.setProperty('--k3ui-field-label-inset-end', `${insetEnd}px`);
    }

    /**
     * Crée le bouton clear du champ
     * @private
     */
    private createClearButton(): void {
        if (!this.containerElement || this.clearButtonElement) return;

        this.clearButtonElement = document.createElement('i');
        this.clearButtonElement.className = 'k3ui-icon clear-button';
        this.clearButtonElement.setAttribute('name', this.options.clearIcon);
        setAriaAttribute(this.clearButtonElement, 'label', LocaleManager.t('field.clear'));
        this.clearButtonElement.setAttribute('tabindex', '-1');
        this.clearButtonElement.setAttribute('role', 'button');

        if (this.togglePasswordElement) {
            this.containerElement.insertBefore(this.clearButtonElement, this.togglePasswordElement);
        } else {
            this.containerElement.appendChild(this.clearButtonElement);
        }

        try {
            IconManager.updateIcon(this.clearButtonElement);
        } catch (_) { /* no-op */ }

        this.registerEvent(this.clearButtonElement, 'click', this.handleClear);
        this.updateClearButtonVisibility();
    }

    /**
     * Applique le fond du variant filled via --k3ui-field-filled-bg
     * @description Permet de différencier le fond du field sur card, surface, etc.
     * @private
     */
    private applyFilledBackground(): void {
        if (this.options.variant !== 'filled') {
            this.el.style.removeProperty('--k3ui-field-filled-bg');
            return;
        }

        const filledBg = this.options.filledBg;
        if (!filledBg) {
            this.el.style.removeProperty('--k3ui-field-filled-bg');
            return;
        }

        this.el.style.setProperty('--k3ui-field-filled-bg', this.resolveSurfaceTokenCss(filledBg));
    }

    /**
     * Applique le fond d’encoche outlined via --k3ui-field-outlined-notch-bg
     * @description Override optionnel ; sinon héritage CSS du host (Card, Dialog, Collapse…)
     * @private
     */
    private applyNotchBackground(): void {
        const notchBg = this.options.notchBg;
        if (!notchBg) {
            this.el.style.removeProperty('--k3ui-field-outlined-notch-bg');
            return;
        }

        this.el.style.setProperty('--k3ui-field-outlined-notch-bg', this.resolveSurfaceTokenCss(notchBg));
    }

    /**
     * Résout un token surface MD ou une couleur CSS brute
     * @param value Alias court, suffixe MD, ou couleur CSS
     * @private
     */
    private resolveSurfaceTokenCss(value: string): string {
        const tokenMap: Record<string, string> = {
            highest: 'surface-container-highest',
            high: 'surface-container-high',
            container: 'surface-container',
            low: 'surface-container-low',
            lowest: 'surface-container-lowest',
            surface: 'surface',
            dim: 'surface-dim',
            bright: 'surface-bright',
        };
        const trimmed = value.trim();
        if (
            trimmed.startsWith('#') ||
            trimmed.startsWith('rgb') ||
            trimmed.startsWith('hsl') ||
            trimmed.startsWith('var(') ||
            trimmed === 'transparent'
        ) {
            return trimmed;
        }
        const token = tokenMap[trimmed] ?? trimmed;
        return `var(--md-sys-color-${token})`;
    }

    /**
     * Configure l'autocomplétion du navigateur
     * @description Gère l'autocomplétion pour les champs password et autres types selon Material Design 3
     * @private
     * @returns {void}
     */
    private configureAutocomplete(): void {
        if (!this.inputElement) return;

        // Lire l'attribut autocomplete depuis l'élément k3ui-field
        // Vérifier d'abord sur l'élément, puis dans les options
        let autocomplete = this.el.getAttribute('autocomplete');
        if (!autocomplete && this.options.autocomplete) {
            autocomplete = this.options.autocomplete;
        }

        if (this.options.type === 'password') {
            // Si un autocomplete est spécifié, l'utiliser (ex: "current-password" pour se souvenir des identifiants)
            if (autocomplete) {
                this.inputElement.setAttribute('autocomplete', autocomplete);
                // Garder le nom original si autocomplete est spécifié
                if (this.options.name) {
                    this.inputElement.setAttribute('name', this.options.name);
                }
            } else {
                // Sinon, désactiver l'autocomplétion par défaut pour les nouveaux mots de passe
                this.inputElement.setAttribute('autocomplete', 'new-password');
                // Générer un nom unique pour éviter la reconnaissance du navigateur
                const randomName = 'pwd_' + Math.random().toString(36).substring(2, 11);
                this.inputElement.setAttribute('name', randomName);
                this.inputElement.setAttribute('data-form-type', 'other');
                this.inputElement.setAttribute('data-lpignore', 'true'); // LastPass
                this.inputElement.setAttribute('data-1p-ignore', 'true'); // 1Password
                this.inputElement.setAttribute('data-bwignore', 'true'); // Bitwarden

                // Technique simple : readonly temporaire au focus (une seule fois)
                let focusHandled = false;
                this.registerEvent(this.inputElement, 'focus', () => {
                    if (!focusHandled && !this.options.readonly && !this.options.disabled) {
                        focusHandled = true;
                        this.inputElement?.setAttribute('readonly', '');
                        setTimeout(() => {
                            this.inputElement?.removeAttribute('readonly');
                            focusHandled = false; // Réinitialiser pour le prochain focus
                        }, 100);
                    }
                });
            }
        } else {
            // Pour les autres types, utiliser la valeur par défaut ou celle spécifiée
            if (autocomplete) {
                this.inputElement.setAttribute('autocomplete', autocomplete);
            } else {
                this.inputElement.removeAttribute('autocomplete');
            }
        }
    }

    /**
     * Gestionnaire d'événement focus
     * @private
     * @param {Event} event - Événement focus
     * @returns {void}
     */
    private handleFocus = (event: Event): void => {
        if (this.options.disabled || this.options.readonly) {
            (event.target as HTMLElement)?.blur();
            this.el.removeAttribute('focused');
            return;
        }

        const inputElement = event.target as HTMLInputElement;
        this.el.setAttribute('focused', '');

        // Ajouter automatiquement # pour les couleurs hex
        if (this.options.pattern === 'hex_color' && !inputElement.value.startsWith('#')) {
            inputElement.value = '#';
        }

        this.updateState();

        if (this.options.onFocus) {
            this.options.onFocus(this.el);
        }
    }

    private handlePointerDown = (event: Event): void => {
        if (this.options.disabled || this.options.readonly) {
            event.preventDefault();
            (event.target as HTMLElement)?.blur();
        }
    };

    /**
     * Gestionnaire d'événement blur
     * @private
     * @param {Event} event - Événement blur
     * @returns {void}
     */
    private handleBlur = (event: Event): void => {
        this.el.removeAttribute('focused');

        // Vérifier la valeur actuelle avant de mettre à jour l'état
        if (this.inputElement) {
            this.hasValue = this.inputElement.value.length > 0;
        }

        this.updateState();

        if (this.options.onBlur) {
            this.options.onBlur(this.el);
        }
    }

    /**
     * Gestionnaire d'événement input
     * @private
     * @param {Event} event - Événement input
     * @returns {void}
     */
    private handleInput = (event: Event): void => {
        const inputElement = event.target as HTMLInputElement;
        this.hasValue = inputElement.value.length > 0;

        // Formatage automatique pour les téléphones internationaux
        this.formatPhoneInput(inputElement);

        this.updateState();
        this.updateCounter();
        this.updateValidationState();

        if (this.options.onInput && this.inputElement) {
            this.options.onInput(this.el, this.inputElement.value);
        }
    }

    /**
     * Gestionnaire d'événement change
     * @private
     * @param {Event} event - Événement change
     * @returns {void}
     */
    private handleChange = (event: Event): void => {
        if (this.options.onChange && this.inputElement) {
            this.options.onChange(this.el, this.inputElement.value);
        }
    }


    /**
     * Formate automatiquement l'input selon le pattern
     * @description Formate les téléphones français, internationaux et les couleurs hex selon les patterns définis
     * @private
     * @param {HTMLInputElement} inputElement - Élément input à formater
     * @returns {void}
     */
    private formatPhoneInput(inputElement: HTMLInputElement): void {
        if (!this.options.pattern) {
            return;
        }

        const currentValue = inputElement.value;
        const cursorPosition = inputElement.selectionStart || 0;
        let cleaned: string = currentValue;
        let formatted: string = currentValue;

        switch (this.options.pattern) {
            case 'phone_fr':
                // Formatage pour téléphone français
                cleaned = InputPattern.cleanFrenchPhone(currentValue);
                formatted = InputPattern.formatFrenchPhone(cleaned);
                break;
            case 'phone_intl':
                // Formatage pour téléphone international
                cleaned = InputPattern.cleanInternationalPhone(currentValue);
                formatted = InputPattern.formatInternationalPhone(cleaned);
                break;
            case 'rgb_color':
            case 'rgba_color':
            case 'cmyk_color':
            case 'hsl_color':
                // Les champs de couleur sont créés dans createStructure()
                return;
            case 'hex_color':
                // Formatage hex : # automatique, seulement les caractères hex
                cleaned = currentValue.replace(/[^0-9A-Fa-f]/g, '');
                formatted = cleaned ? `#${cleaned}` : '#';
                break;
            default:
                return;
        }

        // Mettre à jour la valeur si elle a changé
        if (formatted !== currentValue) {
            inputElement.value = formatted;

            // Stocker la valeur nettoyée dans un attribut data pour la copie
            inputElement.setAttribute('data-clean-value', cleaned);

            // Ajuster la position du curseur
            const separatorsAdded = (formatted.match(/[,\s]/g) || []).length - (currentValue.match(/[,\s]/g) || []).length;
            const newCursorPosition = cursorPosition + separatorsAdded;
            inputElement.setSelectionRange(newCursorPosition, newCursorPosition);
        }
    }

    /**
     * Gestionnaire d'événement invalid
     * @private
     * @param {Event} event - Événement invalid
     * @returns {void}
     */
    private handleInvalid = (event: Event): void => {
        this.invalid = true;
        this.el.setAttribute('invalid', '');

        if (this.options.onInvalid && this.inputElement && event.target instanceof HTMLInputElement) {
            this.options.onInvalid(this.el, event.target.validity);
        }
    }

    /**
     * Gestionnaire d'événement keydown pour limiter la saisie
     * @description Limite la saisie selon le pattern (ex: hex_color max 6 caractères)
     * @private
     * @param {KeyboardEvent} event - Événement keydown
     * @returns {void}
     */
    private handleKeyDown = (event: KeyboardEvent): void => {
        if (!this.inputElement) return;

        const currentValue = this.inputElement.value;
        const cursorPosition = this.inputElement.selectionStart || 0;

        // Touches autorisées (navigation, suppression, virgule, point)
        const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Enter'];
        const isComma = event.key === ',' || event.key === '.' || event.key === 'NumpadComma' || event.key === 'NumpadDecimal';
        const isDigit = /^[0-9]$/.test(event.key);
        const isAllowedKey = allowedKeys.includes(event.key) || isComma || isDigit;

        // Limitation pour hex uniquement
        if (this.options.pattern === 'hex_color') {
            // Hex : max 6 caractères après le #
            const hexPart = currentValue.replace('#', '');
            if (hexPart.length >= 6 && !allowedKeys.includes(event.key)) {
                event.preventDefault();
                return;
            }
        }
    }

    /**
     * Gestionnaire d'événement copy pour les téléphones internationaux
     * @description Copie la valeur nettoyée (sans formatage) dans le presse-papiers
     * @private
     * @param {ClipboardEvent} event - Événement copy
     * @returns {void}
     */
    private handleCopy = (event: ClipboardEvent): void => {
        if (!this.inputElement) return;

        const cleanValue = this.inputElement.getAttribute('data-clean-value');
        if (cleanValue) {
            event.preventDefault();
            event.clipboardData?.setData('text/plain', cleanValue);
        }
    };

    /**
     * Met à jour l'affichage du compteur de caractères
     * @description Affiche le nombre de caractères saisis / maxLength et ajoute la classe limit-reached si nécessaire
     * @private
     * @returns {void}
     */
    private updateCounter(): void {
        if (!this.counterElement || !this.inputElement || !this.options.maxLength) return;

        const currentLength = this.inputElement.value.length;
        const maxLength = this.options.maxLength;

        this.counterElement.textContent = `${currentLength}/${maxLength}`;

        // Ajouter une classe CSS si la limite est atteinte ou dépassée
        if (currentLength >= maxLength) {
            this.counterElement.classList.add('limit-reached');
        } else {
            this.counterElement.classList.remove('limit-reached');
        }
    }

    /**
     * Valide la valeur de l'input selon le pattern défini
     * @private
     * @param {string} value - La valeur à valider
     * @returns {boolean} true si la valeur est valide, false sinon
     */
    private validateInput(value: string): boolean {
        if (!this.options.pattern) {
            return true; // Pas de pattern = validation réussie
        }

        // Si le pattern est une chaîne, l'utiliser comme nom de pattern
        if (typeof this.options.pattern === 'string') {
            return InputPattern.validate(value, this.options.pattern);
        }

        // Si c'est déjà une RegExp, l'utiliser directement
        if (this.options.pattern && typeof this.options.pattern !== 'string') {
            return InputPattern.validate(value, this.options.pattern as RegExp);
        }

        return true;
    }

    /**
     * Met à jour l'état de validation du champ
     * @description Valide la valeur et met à jour les classes CSS et l'icône d'erreur
     * @private
     * @returns {void}
     */
    private updateValidationState(): void {
        if (!this.inputElement || !this.options.pattern) return;

        const value = this.inputElement.value;
        const isValid = this.validateInput(value);

        // Mettre à jour les classes CSS
        if (isValid) {
            this.containerElement?.classList.remove('invalid');
            this.containerElement?.classList.add('valid');
            // Supprimer l'icône d'erreur s'il existe
            this.removeErrorIcon();
        } else {
            this.containerElement?.classList.remove('valid');
            this.containerElement?.classList.add('invalid');
            // Afficher l'icône d'erreur
            this.showErrorIcon();
        }

        // Déclencher l'événement de validation
        if (this.options.onInvalid && !isValid && this.inputElement) {
            this.options.onInvalid(this.el, this.inputElement.validity);
        }
    }

    /**
     * Affiche l'icône d'erreur de validation
     * @description Crée et affiche l'icône d'erreur si elle n'existe pas déjà
     * @private
     * @returns {void}
     */
    private showErrorIcon(): void {
        if (!this.containerElement) return;

        // Vérifier si l'icône d'erreur existe déjà
        let errorIconElement = this.containerElement.querySelector('.error-icon') as HTMLElement;

        if (!errorIconElement) {
            errorIconElement = document.createElement('i');
            errorIconElement.className = 'k3ui-icon error-icon trailing-icon';
            errorIconElement.setAttribute('name', 'circle-exclamation');

            // Style inline pour forcer l'affichage
            errorIconElement.style.color = 'rgb(var(--md-sys-color-error-rgb))';
            errorIconElement.style.fontSize = '24px';
            errorIconElement.style.width = '24px';
            errorIconElement.style.height = '24px';
            errorIconElement.style.display = 'inline-flex';
            errorIconElement.style.alignItems = 'center';
            errorIconElement.style.justifyContent = 'center';

            // Insérer l'icône d'erreur après le text-wrapper mais avant le label
            const textWrapper = this.containerElement.querySelector('.text-wrapper');
            if (textWrapper) {
                textWrapper.insertAdjacentElement('afterend', errorIconElement);
            } else {
                this.containerElement.appendChild(errorIconElement);
            }

            // Ajouter la classe has-trailing-icon au container pour le style
            this.containerElement.classList.add('has-trailing-icon');

            // Forcer le chargement de l'icône par l'IconManager
            setTimeout(() => {
                IconManager.forceDisplayIcons();
                this.updateLabelInsets();
            }, 100);
        }

        this.updateLabelInsets();
    }

    /**
     * Supprime l'icône d'erreur de validation
     * @description Supprime l'icône d'erreur et la classe has-trailing-icon si nécessaire
     * @private
     * @returns {void}
     */
    private removeErrorIcon(): void {
        if (!this.containerElement) return;

        const errorIconElement = this.containerElement.querySelector('.error-icon');
        if (errorIconElement) {
            errorIconElement.remove();

            // Supprimer la classe has-trailing-icon si c'était la seule trailing icon
            if (!this.containerElement.querySelector('.trailing-icon:not(.error-icon)')) {
                this.containerElement.classList.remove('has-trailing-icon');
            }
        }

        this.updateLabelInsets();
    }

    /**
     * Gère le toggle du mot de passe
     * @description Bascule entre type="password" et type="text" et met à jour l'icône
     * @private
     * @param {Event} event - Événement de clic
     * @returns {void}
     */
    private handleTogglePassword = (event: Event): void => {
        event.preventDefault();
        event.stopPropagation();

        if (!this.inputElement || !this.togglePasswordElement || !(this.inputElement instanceof HTMLInputElement)) {
            return;
        }

        // Basculer la visibilité
        this.isPasswordVisible = !this.isPasswordVisible;

        // Changer le type de l'input pour révéler ou masquer le mot de passe
        this.inputElement.type = this.isPasswordVisible ? 'text' : 'password';

        // Mettre à jour l'icône et l'aria-label
        if (this.isPasswordVisible) {
            this.togglePasswordElement.setAttribute('name', this.options.hidePasswordIcon);
            setAriaAttribute(this.togglePasswordElement, 'label', LocaleManager.t('field.hidePassword'));
        } else {
            this.togglePasswordElement.setAttribute('name', this.options.showPasswordIcon);
            setAriaAttribute(this.togglePasswordElement, 'label', LocaleManager.t('field.showPassword'));
        }

        // Forcer la mise à jour de l'icône
        IconManager.forceDisplayIcons();

        // Remettre le focus sur l'input pour continuer la saisie
        this.inputElement.focus();
    };

    /**
     * Gestionnaire du bouton clear
     * @private
     */
    private handleClear = (event: Event): void => {
        event.preventDefault();
        event.stopPropagation();

        if (!this.inputElement || this.options.disabled || this.options.readonly) return;

        this.inputElement.value = '';
        this.hasValue = false;
        this.updateState();
        this.updateCounter();
        this.updateValidationState();
        this.updateClearButtonVisibility();

        this.inputElement.dispatchEvent(new Event('input', { bubbles: true }));
        this.inputElement.dispatchEvent(new Event('change', { bubbles: true }));
        this.el.dispatchEvent(new CustomEvent('clear', { bubbles: true, detail: { instance: this } }));

        if (this.options.onClear) {
            this.options.onClear(this);
        }

        if (this.options.onInput) {
            this.options.onInput(this.el, '');
        }

        this.inputElement.focus();
    };

    /**
     * Met à jour la visibilité du bouton clear
     * @private
     */
    private updateClearButtonVisibility(): void {
        if (!this.clearButtonElement || !this.containerElement) return;

        const isVisible = Boolean(
            this.options.clearable
            && this.hasValue
            && !this.options.disabled
            && !this.options.readonly,
        );

        if (isVisible) {
            this.clearButtonElement.hidden = false;
            this.containerElement.classList.add('has-clear-visible');
            this.el.setAttribute('has-clear-visible', '');
        } else {
            this.clearButtonElement.hidden = true;
            this.containerElement.classList.remove('has-clear-visible');
            this.el.removeAttribute('has-clear-visible');
        }
    }

    /**
     * Synchronise l'état visuel d'erreur depuis l'attribut host ou errorText
     * @private
     */
    private syncInvalidFromHost(): void {
        const hasHostInvalid = this.el.hasAttribute('invalid');
        const errorText = this.options.errorText?.trim();

        if (!hasHostInvalid && !errorText) {
            return;
        }

        this.invalid = true;
        this.el.setAttribute('invalid', '');

        if (errorText && this.inputElement) {
            this.inputElement.setCustomValidity(errorText);
        }

        this.containerElement?.classList.add('invalid');
        this.showErrorIcon();
        this.updateLabelInsets();
    }

    /**
     * Met à jour l'état visuel du composant
     * @description Met à jour l'attribut has-value selon la présence d'une valeur, placeholder ou focus
     * @private
     * @returns {void}
     */
    private updateState(): void {
        if (!this.containerElement) return;

        // Le label est actif si il y a une valeur OU un placeholder OU le champ a le focus
        const hasValueOrPlaceholderOrFocus = this.hasValue || !!this.options.placeholder || this.el.hasAttribute('focused');

        if (hasValueOrPlaceholderOrFocus) {
            this.el.setAttribute('has-value', '');
        } else {
            this.el.removeAttribute('has-value');
        }

        this.updateClearButtonVisibility();
        this.updateLabelInsets();
    }

    /**
     * Initialise l'autosize pour les textareas selon Material Design 3 Expressive
     * @description Ajuste automatiquement la hauteur du textarea selon le contenu avec contraintes min/max
     * @private
     * @returns {void}
     */
    private initAutosize(): void {
        if (!(this.inputElement instanceof HTMLTextAreaElement)) return;

        const textarea = this.inputElement;

        // Fonction pour ajuster la hauteur selon les spécifications Material Design 3
        const adjustHeight = () => {
            // Réinitialiser la hauteur pour calculer la hauteur naturelle
            textarea.style.height = 'auto';

            // Calculer la hauteur nécessaire selon les tokens MD3
            const scrollHeight = textarea.scrollHeight;
            const minHeight = 80; // 80px minimum selon les tokens MD3
            const maxHeight = this.options.maxRows ? this.options.maxRows * 24 + 48 : 200; // 200px max selon MD3

            // Appliquer la hauteur calculée avec les contraintes Material Design 3
            const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
            textarea.style.height = `${newHeight}px`;
        };

        // Ajuster la hauteur initiale
        adjustHeight();

        // Ajuster la hauteur lors des changements
        this.registerEvent(textarea, 'input', adjustHeight);
        this.registerEvent(textarea, 'paste', () => {
            // Délai pour laisser le contenu se coller
            setTimeout(adjustHeight, 0);
        });
    }

    /**
     * Récupère la valeur du champ
     * @public
     * @returns {string} Valeur du champ ou chaîne vide
     */
    getValue(): string {
        return this.inputElement?.value || '';
    }

    /**
     * Définit la valeur du champ
     * @public
     * @param {string} value - Nouvelle valeur du champ
     * @returns {void}
     */
    setValue(value: string): void {
        if (this.inputElement) {
            this.inputElement.value = value;
            this.hasValue = value.length > 0;
            this.updateState();
        }
    }

    /**
     * Focus sur le champ
     * @public
     * @returns {void}
     */
    focus(): void {
        if (this.options.disabled || this.options.readonly) return;
        this.inputElement?.focus();
    }

    /**
     * Blur sur le champ
     * @public
     * @returns {void}
     */
    blur(): void {
        this.inputElement?.blur();
    }

    /**
     * Sélectionne tout le texte du champ
     * @public
     * @returns {void}
     */
    select(): void {
        (this.inputElement as HTMLInputElement)?.select();
    }

    /**
     * Vérifie la validité du champ
     * @public
     * @returns {boolean} true si le champ est valide, false sinon
     */
    checkValidity(): boolean {
        return this.inputElement?.checkValidity() ?? true;
    }

    /**
     * Affiche une erreur personnalisée (ex. réponse serveur)
     * @public
     * @param {string} message - Message d'erreur
     */
    setError(message: string): void {
        this.customErrorMessage = message;
        this.inputElement?.setCustomValidity(message);
        this.invalid = true;
        this.el.setAttribute('invalid', '');
        this.containerElement?.classList.add('invalid');
        this.showErrorIcon();
    }

    /**
     * Efface l'erreur posée par setError
     * @public
     */
    clearError(): void {
        this.customErrorMessage = '';
        this.inputElement?.setCustomValidity('');
        this.reportFieldValidity();
    }

    /**
     * Vérifie la validité du champ et synchronise l'état visuel
     * @public
     * @returns {boolean} true si le champ est valide
     */
    reportFieldValidity(): boolean {
        const valid = this.inputElement?.checkValidity() ?? true;

        if (valid) {
            this.invalid = false;
            this.el.removeAttribute('invalid');
            this.containerElement?.classList.remove('invalid');
            this.removeErrorIcon();
            if (this.inputElement) {
                setAriaAttribute(this.inputElement, 'invalid', false);
            }
        } else {
            this.invalid = true;
            this.el.setAttribute('invalid', '');
            this.containerElement?.classList.add('invalid');
            this.showErrorIcon();
            if (this.inputElement) {
                setAriaAttribute(this.inputElement, 'invalid', true);
            }
        }

        this.updateLabelInsets();
        return valid;
    }

    /**
     * Rapporte la validité du champ
     * @public
     * @returns {boolean} true si le champ est valide, false sinon
     */
    reportValidity(): boolean {
        const valid = this.inputElement?.reportValidity() ?? true;
        this.reportFieldValidity();
        return valid;
    }

    /**
     * Définit un message d'erreur personnalisé
     * @public
     * @param {string} message - Message d'erreur personnalisé
     * @returns {void}
     */
    setCustomValidity(message: string): void {
        this.inputElement?.setCustomValidity(message);
    }

    /**
     * Réinitialise le champ à sa valeur par défaut
     * @public
     * @returns {void}
     */
    reset(): void {
        this.setValue(this.options.defaultValue ?? '');
    }

    /**
     * Détruit le composant et nettoie toutes les ressources
     * @public
     * @returns {void}
     */
    destroy(): void {
        LoggerManager.global.info('Field component destroyed');
        super.destroy();
    }
}

// ============================================================================
// WEB COMPONENT REGISTRATION
// ============================================================================

const FIELD_OBSERVED_ATTRIBUTES = [
    'variant', 'type', 'name', 'value', 'label', 'placeholder', 'helper',
    'clearable', 'end-aligned', 'prefix', 'suffix', 'icon', 'end-icon',
    'readonly', 'disabled', 'required', 'rows', 'autosize', 'min-rows',
    'max-rows', 'minlength', 'maxlength', 'counter', 'min-counter', 'max-counter', 'step',
    'pattern', 'validation-message', 'toggle-password', 'helper-on-focus', 'filled-bg',
    'notch-bg', 'density', 'error-text', 'leading-icon', 'trailing-icon',
] as const;

defineK3UIElement('k3ui-field', Field, {
    observedAttributes: [...FIELD_OBSERVED_ATTRIBUTES],
    onAttributeChanged(_el, name, oldValue, newValue, instance) {
        const camelCaseName = attributeNameToCamelCase(name) as keyof FieldOptions;
        if (camelCaseName in instance.options) {
            instance.updateOptions(
                { [camelCaseName]: newValue } as Partial<FieldOptions>,
                { attribute: name, oldValue, newValue, keys: [camelCaseName as string] },
            );
        }
    },
});
