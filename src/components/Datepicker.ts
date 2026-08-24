/**
 * @fileoverview Composant Datepicker K3UI - Sélecteur de date Material Design 3
 * @description Composant de sélection de date avec calendrier modal, navigation mois/année, validation et accessibilité complète
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import { DatepickerOptions } from '../types/components';
import { PriorityLevel } from '../types/base';
import { KElement, InitElements } from '../types/base';
import { LoggerManager, IconManager, LocaleManager, ThemeManager } from '../core/managers';
import { setAriaAttribute, setAriaAttributes } from '../utils/dom/aria';
import { Mouse, Keyboard } from '../core/managers';
import { Field } from './Field';
import { getDatepickerDefaults } from '../specs/components/datepicker.specs';
import { HapticManager } from '../core/managers/HapticManager';

/**
 * Options par défaut du composant Datepicker
 * @description Extrait depuis les specs pour garantir la cohérence
 */
const _defaults: DatepickerOptions = getDatepickerDefaults();

/**
 * Convertit une valeur date (Date, chaîne ISO, timestamp) en `Date` ou `null`.
 * @param value - Valeur à normaliser
 */
function coerceDateValue(value: unknown): Date | null {
    if (value === undefined || value === null) {
        return null;
    }
    if (value instanceof Date) {
        return isNaN(value.getTime()) ? null : value;
    }
    if (typeof value === 'string' || typeof value === 'number') {
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date;
    }
    return null;
}

/**
 * Interface pour un jour du calendrier
 */
interface CalendarDay {
    day: number;
    month: number;
    year: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
    isDisabled: boolean;
    date: Date;
    isInRange: boolean;
    isRangeStart: boolean;
    isRangeEnd: boolean;
}

/**
 * Classe du composant Datepicker
 */
export class Datepicker extends Component<DatepickerOptions> {
    declare el: HTMLElement;

    /** Si le datepicker est ouvert */
    isOpen: boolean = false;

    /** Date actuellement sélectionnée (mode single) */
    selectedDate: Date | null = null;

    /** Date de début de la plage (mode range) */
    startDate: Date | null = null;

    /** Date de fin de la plage (mode range) */
    endDate: Date | null = null;

    /** État temporaire lors de la sélection de plage (première date cliquée) */
    private tempStartDate: Date | null = null;

    /** Mois actuellement affiché */
    currentMonth: number = 0;

    /** Année actuellement affichée */
    currentYear: number = 0;

    /** Mode d'affichage actuel */
    currentViewMode: 'calendar' | 'year' | 'month' | 'input' = 'calendar';

    /** Instance Field pour le champ de saisie */
    fieldInstance: Field | null = null;

    /** Élément input du Field (accès direct pour compatibilité) */
    inputElement: HTMLInputElement | null = null;

    /** Élément backdrop */
    backdropElement: HTMLDivElement | null = null;

    /** Élément modal */
    modalElement: HTMLDivElement | null = null;

    /** Élément container du calendrier */
    calendarElement: HTMLDivElement | null = null;

    /** Élément container de la grille des années */
    yearGridElement: HTMLDivElement | null = null;

    /** Élément container de la grille des années (wrapper scrollable) */
    yearGridWrapper: HTMLDivElement | null = null;

    /** Élément container de la grille des années (grid) */
    yearGrid: HTMLDivElement | null = null;

    /** Année minimale actuellement chargée */
    private minLoadedYear: number = 0;

    /** Année maximale actuellement chargée */
    private maxLoadedYear: number = 0;

    /** Nombre d'années à afficher par décennie (12 années : décennie de 10 + 1 avant + 1 après) */
    private readonly yearBlockSize: number = 12;

    /** Année de début du bloc actuellement affiché */
    private currentYearBlockStart: number = 0;

    /** Limite minimale d'années à charger (-100 par rapport à l'année courante) */
    private get minYearLimit(): number {
        return this.currentYear - 100;
    }

    /** Limite maximale d'années à charger (+100 par rapport à l'année courante) */
    private get maxYearLimit(): number {
        return this.currentYear + 100;
    }

    /** Flag pour éviter les chargements multiples simultanés */
    private isLoadingYears: boolean = false;

    /** Élément container de la grille des mois */
    monthGridElement: HTMLDivElement | null = null;

    /** Élément container du mode input */
    inputModeElement: HTMLDivElement | null = null;

    /** Instance Keyboard pour la navigation */
    keyboardInstance: Keyboard | null = null;

    /** Instance Mouse pour les interactions */
    mouseInstance: Mouse | null = null;

    /** Scroll Y sauvegardé */
    savedScrollY: number = 0;

    /** Niveau de priorité du composant */
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    constructor(el: HTMLElement, options: Partial<DatepickerOptions> = {}) {
        // Lire les attributs HTML et les convertir en options
        const htmlOptions = Datepicker.readAttributes(el);
        // Options passées à init() priment sur les attributs HTML (comme en doc)
        super(el, { ...htmlOptions, ...options }, toComponentClassDef(Datepicker));

        // Normaliser les dates selon le mode
        if (this.options.mode === 'range') {
            // Mode range : normaliser startDate et endDate
            if (this.options.startDate === undefined || this.options.startDate === null) {
                this.startDate = null;
            } else if (this.options.startDate instanceof Date && !isNaN(this.options.startDate.getTime())) {
                this.startDate = new Date(this.options.startDate);
            } else if (this.options.startDate) {
                this.startDate = coerceDateValue(this.options.startDate);
            } else {
                this.startDate = null;
            }

            if (this.options.endDate === undefined || this.options.endDate === null) {
                this.endDate = null;
            } else if (this.options.endDate instanceof Date && !isNaN(this.options.endDate.getTime())) {
                this.endDate = new Date(this.options.endDate);
            } else if (this.options.endDate) {
                this.endDate = coerceDateValue(this.options.endDate);
            } else {
                this.endDate = null;
            }

            // S'assurer que startDate <= endDate
            if (this.startDate && this.endDate && this.startDate > this.endDate) {
                const temp = this.startDate;
                this.startDate = this.endDate;
                this.endDate = temp;
            }

            // Ne pas initialiser currentMonth/currentYear ici, ce sera fait plus tard
        } else {
            // Mode single : normaliser selectedDate
            if (this.options.selectedDate === undefined || this.options.selectedDate === null) {
                this.selectedDate = null;
            } else if (this.options.selectedDate instanceof Date && !isNaN(this.options.selectedDate.getTime())) {
                this.selectedDate = this.options.selectedDate;
            } else if (this.options.selectedDate) {
                this.selectedDate = coerceDateValue(this.options.selectedDate);
            } else {
                // Cas par défaut : pas de date sélectionnée, afficher le placeholder
                this.selectedDate = null;
            }
            // Ne pas initialiser currentMonth/currentYear ici, ce sera fait plus tard
        }


        // Normaliser minDate
        if (this.options.minDate) {
            if (this.options.minDate instanceof Date && !isNaN(this.options.minDate.getTime())) {
                // Déjà un Date valide
            } else {
                this.options.minDate = coerceDateValue(this.options.minDate);
            }
        }

        // Normaliser maxDate
        if (this.options.maxDate) {
            if (this.options.maxDate instanceof Date && !isNaN(this.options.maxDate.getTime())) {
                // Déjà un Date valide
            } else {
                this.options.maxDate = coerceDateValue(this.options.maxDate);
            }
        }

        // Normaliser disabledDates
        if (this.options.disabledDates && Array.isArray(this.options.disabledDates)) {
            this.options.disabledDates = this.options.disabledDates.map((d) => coerceDateValue(d)).filter((d): d is Date => d !== null);
        }

        // Initialiser le mois et l'année affichés
        // Si une date est sélectionnée, utiliser cette date, sinon utiliser le mois/année actuel
        if (this.options.mode === 'range') {
            if (this.startDate) {
                this.currentMonth = this.startDate.getMonth();
                this.currentYear = this.startDate.getFullYear();
            } else if (this.endDate) {
                this.currentMonth = this.endDate.getMonth();
                this.currentYear = this.endDate.getFullYear();
            } else {
                // Aucune date sélectionnée : utiliser le mois/année actuel
                const now = new Date();
                this.currentMonth = now.getMonth();
                this.currentYear = now.getFullYear();
            }
        } else {
            if (this.selectedDate) {
                this.currentMonth = this.selectedDate.getMonth();
                this.currentYear = this.selectedDate.getFullYear();
            } else {
                // Aucune date sélectionnée : utiliser le mois/année actuel
                const now = new Date();
                this.currentMonth = now.getMonth();
                this.currentYear = now.getFullYear();
            }
        }
        this.currentViewMode = this.options.viewMode === 'months'
            ? 'month'
            : this.options.viewMode === 'years'
                ? 'year'
                : (this.options.viewMode || 'calendar');

        // Initialiser le composant
        this.init();
    }

    static getInstance(el: HTMLElement): Datepicker | undefined {
        return Component.getInstance(el) as Datepicker | undefined;
    }

    static get defaults(): DatepickerOptions {
        return _defaults;
    }

    /**
     * Initialise une instance de Datepicker.
     * @param el Élément HTML.
     * @param options Options du composant.
     */
    static init(el: HTMLElement, options?: Partial<DatepickerOptions>): Datepicker;
    /**
     * Initialise des instances de Datepicker.
     * @param els Éléments HTML.
     * @param options Options du composant.
     */
    static init(els: InitElements<KElement>, options?: Partial<DatepickerOptions>): Datepicker[];
    static init(
        els: HTMLElement | InitElements<KElement>,
        options?: Partial<DatepickerOptions>
    ): Datepicker | Datepicker[] {
        if (els instanceof Element) {
            // Vérifier si une instance existe déjà
            const existing = Datepicker.getInstance(els as HTMLElement);
            if (existing) {
                return existing;
            }
            return new Datepicker(els as HTMLElement, options);
        } else if (!!els && els.length) {
            const instances = [];
            for (let i = 0; i < els.length; i++) {
                // Vérifier si une instance existe déjà
                const existing = Datepicker.getInstance(els[i] as HTMLElement);
                if (existing) {
                    instances.push(existing);
                } else {
                    instances.push(new Datepicker(els[i] as HTMLElement, options));
                }
            }
            return instances;
        }
        return [];
    }

    /**
     * Lit les attributs HTML et les convertit en options
     */
    private static readAttributes(el: HTMLElement): Partial<DatepickerOptions> {
        const options: Partial<DatepickerOptions> = {};

        // Lire les attributs HTML
        if (el.hasAttribute('locale')) {
            options.locale = el.getAttribute('locale') || 'fr-FR';
        }
        if (el.hasAttribute('date-format')) {
            options.dateFormat = el.getAttribute('date-format') || 'DD/MM/YYYY';
        }
        if (el.hasAttribute('display-format')) {
            options.displayFormat = el.getAttribute('display-format') || 'DD/MM/YYYY';
        }
        if (el.hasAttribute('placeholder')) {
            options.placeholder = el.getAttribute('placeholder') || '';
        }
        if (el.hasAttribute('label')) {
            options.label = el.getAttribute('label') || undefined;
        }
        if (el.hasAttribute('helper')) {
            options.helper = el.getAttribute('helper') || undefined;
        }
        if (el.hasAttribute('error-message')) {
            options.errorMessage = el.getAttribute('error-message') || undefined;
        }
        if (el.hasAttribute('variant')) {
            options.variant = el.getAttribute('variant') as 'filled' | 'outlined';
        }
        if (el.hasAttribute('data-input-variant') || el.hasAttribute('input-variant')) {
            const inputVariant = el.getAttribute('data-input-variant') || el.getAttribute('input-variant');
            options.inputVariant = inputVariant as 'filled' | 'outlined';
        }
        if (el.hasAttribute('icon')) {
            options.icon = el.getAttribute('icon') || 'calendar';
        }
        if (el.hasAttribute('first-day-of-week')) {
            const value = el.getAttribute('first-day-of-week');
            options.firstDayOfWeek = value === '1' ? 1 : 0;
        }

        // Mode de sélection (single ou range)
        if (el.hasAttribute('mode') || el.hasAttribute('data-mode')) {
            const mode = el.getAttribute('mode') || el.getAttribute('data-mode');
            if (mode === 'range' || mode === 'single') {
                options.mode = mode;
            }
        }
        if (el.hasAttribute('range-separator') || el.hasAttribute('data-range-separator')) {
            options.rangeSeparator = el.getAttribute('range-separator') || el.getAttribute('data-range-separator') || ' - ';
        }

        // Attributs booléens
        options.error = el.hasAttribute('error');
        options.disabled = el.hasAttribute('disabled');
        options.readonly = el.hasAttribute('readonly');
        options.required = el.hasAttribute('required');
        // Attribut haptic
        if (el.hasAttribute('haptic')) {
            options.haptic = el.getAttribute('haptic') === 'true';
        }
        // showIcon : true par défaut, false seulement si hide-icon est présent
        if (el.hasAttribute('hide-icon')) {
            options.showIcon = false;
        } else if (el.hasAttribute('show-icon')) {
            options.showIcon = true;
        }
        options.showTodayButton = !el.hasAttribute('hide-today-button');
        options.showClearButton = !el.hasAttribute('hide-clear-button');
        options.showCancelButton = !el.hasAttribute('hide-cancel-button');
        options.showConfirmButton = !el.hasAttribute('hide-confirm-button');
        options.allowInput = !el.hasAttribute('disable-input');
        options.allowKeyboardNavigation = !el.hasAttribute('disable-keyboard');

        // Dates min/max
        if (el.hasAttribute('min-date')) {
            const minDateStr = el.getAttribute('min-date');
            if (minDateStr) {
                options.minDate = new Date(minDateStr);
            }
        }
        if (el.hasAttribute('max-date')) {
            const maxDateStr = el.getAttribute('max-date');
            if (maxDateStr) {
                options.maxDate = new Date(maxDateStr);
            }
        }

        // Mode range : lire start-date et end-date
        if (options.mode === 'range') {
            if (el.hasAttribute('start-date') || el.hasAttribute('data-start-date')) {
                const startDateStr = el.getAttribute('start-date') || el.getAttribute('data-start-date');
                if (startDateStr && startDateStr.trim() !== '') {
                    const parsedDate = new Date(startDateStr);
                    if (!isNaN(parsedDate.getTime())) {
                        options.startDate = parsedDate;
                    }
                }
            }
            if (el.hasAttribute('end-date') || el.hasAttribute('data-end-date')) {
                const endDateStr = el.getAttribute('end-date') || el.getAttribute('data-end-date');
                if (endDateStr && endDateStr.trim() !== '') {
                    const parsedDate = new Date(endDateStr);
                    if (!isNaN(parsedDate.getTime())) {
                        options.endDate = parsedDate;
                    }
                }
            }
            // Lire aussi depuis value au format "YYYY-MM-DD - YYYY-MM-DD"
            const valueStr = el.getAttribute('value');
            if (valueStr && valueStr.trim() !== '') {
                const separator = options.rangeSeparator || ' - ';
                const parts = valueStr.split(separator);
                if (parts.length === 2) {
                    const startDate = new Date(parts[0].trim());
                    const endDate = new Date(parts[1].trim());
                    if (!isNaN(startDate.getTime())) {
                        options.startDate = startDate;
                    }
                    if (!isNaN(endDate.getTime())) {
                        options.endDate = endDate;
                    }
                }
            }
        } else {
            // Mode single : Date sélectionnée initiale
            // Lire depuis value ou selected-date (dans cet ordre de priorité)
            const dateStr = el.getAttribute('value') || el.getAttribute('selected-date');

            // Si value="" (chaîne vide) ou selected-date="" ou absent, selectedDate reste undefined (utilisera null par défaut)
            if (dateStr && dateStr.trim() !== '') {
                // Essayer de parser la date
                const parsedDate = new Date(dateStr);
                // Vérifier que la date est valide
                if (!isNaN(parsedDate.getTime())) {
                    options.selectedDate = parsedDate;
                }
                // Si la date est invalide, on laisse undefined pour utiliser la valeur par défaut (null)
            }
            // Si aucun attribut ou attribut vide, selectedDate reste undefined et utilisera la valeur par défaut (null)
        }

        return options;
    }

    /**
     * Initialise le composant
     */
    init(): void {
        LoggerManager.global.info('Datepicker component initialized');

        // Créer la structure DOM
        this.createStructure();

        // Configurer les événements
        this.setupEvents();

        // Appliquer les styles
        this.applyStyles();

        // Initialiser l'affichage
        this.updateDisplay();
    }

    /**
     * Crée la structure DOM du composant
     */
    private createStructure(): void {
        // Créer un élément Field pour le champ de saisie
        const fieldElement = document.createElement('k3ui-field');
        fieldElement.className = 'no-autoinit'; // Empêcher l'AutoInit de l'initialiser
        fieldElement.setAttribute('type', 'text');
        fieldElement.setAttribute('variant', this.options.inputVariant || this.options.variant);
        fieldElement.setAttribute('placeholder', this.options.placeholder ?? LocaleManager.t('datepicker.placeholder'));
        fieldElement.setAttribute('autocomplete', 'off');
        // IMPORTANT : Ne pas définir d'attribut 'value' sur le fieldElement
        // La valeur sera définie par updateDisplay() après initialisation

        if (this.options.label) {
            fieldElement.setAttribute('label', this.options.label);
        }
        if (this.options.helper) {
            fieldElement.setAttribute('helper', this.options.helper);
        }
        if (this.options.error) {
            fieldElement.setAttribute('error', '');
            if (this.options.errorMessage) {
                fieldElement.setAttribute('error-message', this.options.errorMessage);
            }
        }
        if (this.options.disabled) {
            fieldElement.setAttribute('disabled', '');
        }
        if (this.options.readonly) {
            fieldElement.setAttribute('readonly', '');
        }
        if (this.options.required) {
            fieldElement.setAttribute('required', '');
        }
        if (this.options.showIcon && this.options.icon) {
            fieldElement.setAttribute('trailing-icon', this.options.icon);
        }

        // Ajouter le Field à l'élément
        this.el.appendChild(fieldElement);

        // Initialiser le Field (les attributs sont déjà définis sur l'élément)
        // IMPORTANT : Ne pas définir d'attribut 'value' sur le fieldElement pour que le placeholder s'affiche
        // La valeur sera définie plus tard par updateDisplay()
        this.fieldInstance = Field.init(fieldElement);

        // Récupérer l'élément input du Field
        this.inputElement = this.fieldInstance.inputElement as HTMLInputElement;

        // Forcer l'initialisation des icônes du Field après initialisation
        // (car IconManager.forceDisplayIcons() est appelé dans Field mais peut-être trop tôt)
        setTimeout(() => {
            IconManager.forceDisplayIcons();
        }, 10);

        // Mettre à jour l'état d'erreur du Field après initialisation
        this.updateFieldErrorState();

        // Ajouter le gestionnaire de clic sur l'icône calendrier (trailing-icon)
        // Utiliser setTimeout pour s'assurer que l'icône est dans le DOM
        setTimeout(() => {
            this.setupIconClick();
        }, 50);

        // Créer le backdrop et le modal (créés dynamiquement lors de l'ouverture)
    }

    /**
     * Configure le clic sur l'icône calendrier pour ouvrir le datepicker
     */
    private setupIconClick(): void {
        if (!this.fieldInstance || !this.fieldInstance.el) return;

        // Trouver l'icône trailing dans le Field (plusieurs sélecteurs possibles)
        let trailingIcon = this.fieldInstance.el.querySelector('.trailing-icon.k3ui-icon[name]') as HTMLElement;

        // Si pas trouvé, chercher dans le container
        if (!trailingIcon && this.fieldInstance.containerElement) {
            trailingIcon = this.fieldInstance.containerElement.querySelector('.trailing-icon.k3ui-icon[name]') as HTMLElement;
        }

        // Si toujours pas trouvé, chercher par attribut name
        if (!trailingIcon && this.options.icon) {
            trailingIcon = this.fieldInstance.el.querySelector(`i.k3ui-icon.trailing-icon[name="${this.options.icon}"]`) as HTMLElement;
        }

        if (trailingIcon && this.options.showIcon) {
            // Rendre l'icône cliquable
            trailingIcon.style.cursor = 'pointer';
            trailingIcon.setAttribute('role', 'button');
            trailingIcon.setAttribute('tabindex', '0');
            setAriaAttribute(trailingIcon, 'label', LocaleManager.t('datepicker.openCalendar'));

            // Ajouter le gestionnaire de clic
            this.registerEvent(trailingIcon, 'click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!this.options.disabled && !this.options.readonly) {
                    this.open();
                }
            });

            // Ajouter le gestionnaire pour Enter et Space
            this.registerEvent(trailingIcon, 'keydown', (e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !this.options.disabled && !this.options.readonly) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.open();
                }
            });
        }
    }

    /**
     * Met à jour l'état d'erreur du Field
     */
    private updateFieldErrorState(): void {
        if (!this.fieldInstance || !this.fieldInstance.el) return;

        const fieldEl = this.fieldInstance.el as HTMLElement;

        if (this.options.error) {
            fieldEl.setAttribute('error', '');
            if (this.options.errorMessage) {
                fieldEl.setAttribute('error-message', this.options.errorMessage);
                // Mettre à jour le helper text pour afficher le message d'erreur
                if (this.fieldInstance.helperElement) {
                    this.fieldInstance.helperElement.textContent = this.options.errorMessage;
                    this.fieldInstance.helperElement.classList.add('error');
                } else if (this.options.errorMessage) {
                    // Créer le helper element s'il n'existe pas
                    const bottomContainer = fieldEl.querySelector('.field-bottom') as HTMLElement;
                    if (bottomContainer) {
                        const helperElement = document.createElement('div');
                        helperElement.className = 'helper-text error';
                        helperElement.textContent = this.options.errorMessage;
                        bottomContainer.insertBefore(helperElement, bottomContainer.firstChild);
                        this.fieldInstance.helperElement = helperElement;
                    }
                }
            } else {
                fieldEl.removeAttribute('error-message');
                // Réinitialiser le helper text
                if (this.fieldInstance.helperElement) {
                    this.fieldInstance.helperElement.classList.remove('error');
                    if (this.options.helper) {
                        this.fieldInstance.helperElement.textContent = this.options.helper;
                    }
                }
            }
            // Mettre à jour l'état invalide du Field et forcer l'affichage de l'icône d'erreur
            this.fieldInstance.invalid = true;
            if (this.fieldInstance.containerElement) {
                this.fieldInstance.containerElement.classList.remove('valid');
                this.fieldInstance.containerElement.classList.add('invalid');
            }
        } else {
            fieldEl.removeAttribute('error');
            fieldEl.removeAttribute('error-message');
            // Réinitialiser le helper text
            if (this.fieldInstance.helperElement) {
                this.fieldInstance.helperElement.classList.remove('error');
                if (this.options.helper) {
                    this.fieldInstance.helperElement.textContent = this.options.helper;
                } else if (!this.options.errorMessage) {
                    this.fieldInstance.helperElement.textContent = '';
                }
            }
            // Réinitialiser l'état invalide du Field
            this.fieldInstance.invalid = false;
            if (this.fieldInstance.containerElement) {
                this.fieldInstance.containerElement.classList.remove('invalid');
                this.fieldInstance.containerElement.classList.remove('valid');
            }
        }
    }

    /**
     * Configure les événements du composant
     */
    private setupEvents(): void {
        if (!this.inputElement) return;

        // Événement focus sur l'input
        this.registerEvent(this.inputElement, 'focus', this.handleInputFocus);
        this.registerEvent(this.inputElement, 'click', this.handleInputClick);

        // Événement input pour la saisie manuelle
        if (this.options.allowInput) {
            this.registerEvent(this.inputElement, 'input', this.handleInputChange);
            this.registerEvent(this.inputElement, 'blur', this.handleInputBlur);
        }

        // Créer l'instance Keyboard pour la navigation
        if (this.options.allowKeyboardNavigation) {
            this.keyboardInstance = new Keyboard({
                target: this.el,
                enabled: true,
                onKeyDown: this.handleKeyDown.bind(this)
            });
        }

        // Créer l'instance Mouse pour les interactions
        this.mouseInstance = new Mouse({
            target: this.el,
            enabled: true,
            onClick: this.handleMouseClick.bind(this)
        });
    }

    /**
     * Applique les styles du composant
     */
    private applyStyles(): void {
        // Ajouter la classe principale
        this.el.classList.add('datepicker');

        // Ajouter les classes selon les options
        if (this.options.variant) {
            this.el.setAttribute('variant', this.options.variant);
        }
        if (this.options.disabled) {
            this.el.setAttribute('disabled', '');
        }
        if (this.options.error) {
            this.el.setAttribute('error', '');
        }
        if (this.options.required) {
            this.el.setAttribute('required', '');
        }
    }

    /**
     * Met à jour l'affichage de la date
     */
    private updateDisplay(): void {
        if (!this.fieldInstance || !this.inputElement) return;

        if (this.options.mode === 'range') {
            // Mode range : afficher la plage
            if (this.startDate && this.endDate) {
                // Plage complète
                const formattedStart = this.formatDate(this.startDate, this.options.dateFormat);
                const formattedEnd = this.formatDate(this.endDate, this.options.dateFormat);
                const displayValue = `${formattedStart}${this.options.rangeSeparator}${formattedEnd}`;
                this.fieldInstance.setValue(displayValue);
            } else if (this.startDate) {
                // Seulement startDate sélectionnée
                const formattedStart = this.formatDate(this.startDate, this.options.dateFormat);
                this.fieldInstance.setValue(formattedStart);
            } else {
                // Aucune date sélectionnée
                this.fieldInstance.setValue('');
                if (this.inputElement) {
                    this.inputElement.value = '';
                }
            }
        } else {
            // Mode single : comportement original
            if (this.selectedDate) {
                const formattedDate = this.formatDate(this.selectedDate, this.options.dateFormat);
                this.fieldInstance.setValue(formattedDate);
            } else {
                // Vider la valeur pour afficher le placeholder
                // Utiliser setValue('') qui met à jour hasValue et l'état automatiquement
                this.fieldInstance.setValue('');
                // S'assurer que l'input est vraiment vide pour que le placeholder s'affiche
                if (this.inputElement) {
                    this.inputElement.value = '';
                }
            }
        }
    }

    /**
     * Ouvre le datepicker
     */
    open(): void {
        if (this.isOpen || this.options.disabled) return;

        // Callback onOpenStart
        if (this.options.onOpenStart) {
            this.options.onOpenStart(this.el);
        }

        this.isOpen = true;

        // Sauvegarder le scroll
        if (this.options.preventScrolling) {
            this.savedScrollY = window.scrollY;
        }

        // Créer le backdrop et le modal
        this.createModal();

        // Empêcher le scroll
        if (this.options.preventScrolling) {
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.top = `-${this.savedScrollY}px`;
            document.body.style.width = '100%';
        }

        // Afficher le modal
        if (this.backdropElement && this.modalElement) {
            document.body.appendChild(this.backdropElement);
            this.backdropElement.appendChild(this.modalElement);

            // Appliquer les animations haptic
            this._animateIn();

            // Configurer ARIA
            this.setupAriaAttributes();
        }

        LoggerManager.global.info('Datepicker opened');
    }

    /**
     * Ferme le datepicker
     */
    close(): void {
        if (!this.isOpen) return;

        // Callback onCloseStart
        if (this.options.onCloseStart) {
            this.options.onCloseStart(this.el);
        }

        this.isOpen = false;

        // Restaurer le scroll
        if (this.options.preventScrolling) {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            window.scrollTo(0, this.savedScrollY);
        }

        // Appliquer les animations haptic de fermeture
        this._animateOut();

        LoggerManager.global.info('Datepicker closed');
    }

    /**
     * Crée le modal du datepicker
     */
    private createModal(): void {
        // Créer le backdrop
        this.backdropElement = document.createElement('div');
        this.backdropElement.className = 'datepicker__backdrop';
        setAriaAttribute(this.backdropElement, 'hidden', false);

        // Créer le modal
        this.modalElement = document.createElement('div');
        this.modalElement.className = 'datepicker__modal';
        // Ajouter l'attribut data-mode pour identifier le mode (single ou range) en CSS
        this.modalElement.setAttribute('data-mode', this.options.mode || 'single');
        setAriaAttributes(this.modalElement, {
            role: 'dialog',
            'aria-modal': true,
            'aria-label': LocaleManager.t('datepicker.ariaLabel')
        });

        // Appliquer les couleurs dynamiques au modal
        this._applyDynamicColors();

        // Créer le header
        const header = this.createHeader();
        this.modalElement.appendChild(header);

        // Créer le contenu selon le mode
        if (this.currentViewMode === 'calendar') {
            this.calendarElement = this.createCalendarView();
            this.modalElement.appendChild(this.calendarElement);
        } else if (this.currentViewMode === 'year') {
            this.yearGridElement = this.createYearView();
            this.modalElement.appendChild(this.yearGridElement);
        } else if (this.currentViewMode === 'month') {
            this.monthGridElement = this.createMonthView();
            this.modalElement.appendChild(this.monthGridElement);
        } else if (this.currentViewMode === 'input') {
            this.inputModeElement = this.createInputModeView();
            this.modalElement.appendChild(this.inputModeElement);
        }

        // Mettre à jour le caret
        this.updateCaretRotation();

        // Créer le footer avec les boutons d'action
        const footer = this.createFooter();
        if (footer) {
            this.modalElement.appendChild(footer);
        }

        // Événement de clic sur le backdrop pour fermer
        this.registerEvent(this.backdropElement, 'click', (e) => {
            if (e.target === this.backdropElement) {
                this.close();
            }
        });
    }

    /**
     * Crée le header du modal
     */
    private createHeader(): HTMLDivElement {
        const header = document.createElement('div');
        header.className = 'datepicker__header';

        const label = document.createElement('div');
        label.className = 'datepicker__header-label';
        label.textContent = LocaleManager.t('datepicker.selectDate');
        header.appendChild(label);

        const dateWrapper = document.createElement('div');
        dateWrapper.className = 'datepicker__header-date-wrapper';

        const dateDisplay = document.createElement('div');
        dateDisplay.className = 'datepicker__header-date';
        // Afficher la date selon le format demandé
        if (this.options.mode === 'range' && this.startDate && this.endDate) {
            // Mode range : "Aug 17 – Aug 23"
            dateDisplay.textContent = this.formatHeaderDateRange(this.startDate, this.endDate);
        } else if (this.options.mode === 'range' && this.startDate) {
            // Mode range avec seulement startDate
            dateDisplay.textContent = this.formatHeaderDateSingle(this.startDate);
        } else if (this.selectedDate) {
            // Mode single avec date sélectionnée : "Mon, Aug 17"
            dateDisplay.textContent = this.formatHeaderDateSingle(this.selectedDate);
        } else {
            // Aucune date sélectionnée : afficher la date du jour
            const today = new Date();
            dateDisplay.textContent = this.formatHeaderDateSingle(today);
        }
        dateWrapper.appendChild(dateDisplay);

        // Bouton pour changer de vue
        const viewButton = document.createElement('button');
        viewButton.className = 'datepicker__header-action';
        viewButton.type = 'button';
        setAriaAttribute(viewButton, 'label', LocaleManager.t('datepicker.changeView'));
        viewButton.innerHTML = '<i class="k3ui-icon" name="calendar"></i>';
        this.registerEvent(viewButton, 'click', () => {
            this.toggleViewMode();
        });
        dateWrapper.appendChild(viewButton);

        header.appendChild(dateWrapper);

        return header;
    }



    /**
     * Crée un élément day avec tous ses event listeners
     */
    private createDayElement(dayData: CalendarDay): HTMLButtonElement {
        const day = document.createElement('button');
        day.className = 'datepicker__day';
        day.type = 'button';
        day.textContent = dayData.day.toString();

        if (!dayData.isCurrentMonth) {
            day.classList.add('datepicker__day--outside-month');
        }
        if (dayData.isToday) {
            day.classList.add('datepicker__day--today');
        }
        if (dayData.isSelected) {
            day.classList.add('datepicker__day--selected');
        }
        if (dayData.isDisabled) {
            day.classList.add('datepicker__day--disabled');
            day.disabled = true;
        }
        // Classes pour le mode range
        if (dayData.isInRange) {
            day.classList.add('datepicker__day--in-range');
        }
        if (dayData.isRangeStart) {
            day.classList.add('datepicker__day--range-start');
        }
        if (dayData.isRangeEnd) {
            day.classList.add('datepicker__day--range-end');
        }

        setAriaAttribute(day, 'label', this.formatDate(dayData.date, 'DD MMMM YYYY'));
        if (dayData.isSelected) {
            setAriaAttribute(day, 'selected', true);
        }


        this.registerEvent(day, 'click', () => {
            if (!dayData.isDisabled) {
                this.selectDate(dayData.date);
            }
        });

        return day;
    }

    /**
     * Crée la vue calendrier
     */
    private createCalendarView(): HTMLDivElement {
        const container = document.createElement('div');
        container.className = 'datepicker__calendar-view';

        // Navigation
        const navigation = this.createNavigation();
        container.appendChild(navigation);

        // Calendrier
        const calendar = document.createElement('div');
        calendar.className = 'datepicker__calendar';

        // Jours de la semaine
        const weekdays = document.createElement('div');
        weekdays.className = 'datepicker__weekdays';
        const weekdayNames = this.getWeekDayNames();
        weekdayNames.forEach(name => {
            const weekday = document.createElement('div');
            weekday.className = 'datepicker__weekday';
            weekday.textContent = name;
            weekdays.appendChild(weekday);
        });
        calendar.appendChild(weekdays);

        // Grille des jours
        const daysGrid = document.createElement('div');
        daysGrid.className = 'datepicker__days-grid';
        const days = this.getCalendarDays();
        days.forEach(dayData => {
            const day = this.createDayElement(dayData);
            daysGrid.appendChild(day);
        });
        calendar.appendChild(daysGrid);

        container.appendChild(calendar);

        return container;
    }

    /**
     * Crée la navigation du calendrier
     */
    private createNavigation(): HTMLDivElement {
        const navigation = document.createElement('div');
        navigation.className = 'datepicker__navigation';

        // Container pour les boutons année et mois
        const yearMonthContainer = document.createElement('div');
        yearMonthContainer.className = 'datepicker__year-month-navigation';

        // Bouton Année
        const yearButton = document.createElement('button');
        yearButton.className = 'datepicker__year-button-nav';
        yearButton.type = 'button';

        const yearText = document.createElement('span');
        yearText.textContent = `${this.currentYear}`;

        const yearCaret = document.createElement('i');
        yearCaret.className = 'k3ui-icon datepicker__year-caret-nav';
        yearCaret.setAttribute('name', 'caret');
        yearCaret.setAttribute('rotate', '0');

        yearButton.appendChild(yearText);
        yearButton.appendChild(yearCaret);

        setAriaAttribute(yearButton, 'label', `${LocaleManager.t('datepicker.selectYear')} ${this.currentYear}`);
        this.registerEvent(yearButton, 'click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.currentViewMode === 'calendar') {
                this.setViewMode('year');
            }
        });

        // Bouton Mois
        const monthButton = document.createElement('button');
        monthButton.className = 'datepicker__month-button-nav';
        monthButton.type = 'button';

        const monthText = document.createElement('span');
        monthText.textContent = this.getMonthName(this.currentMonth);

        const monthCaret = document.createElement('i');
        monthCaret.className = 'k3ui-icon datepicker__month-caret-nav';
        monthCaret.setAttribute('name', 'caret');
        monthCaret.setAttribute('rotate', '0');

        monthButton.appendChild(monthText);
        monthButton.appendChild(monthCaret);

        setAriaAttribute(monthButton, 'label', `${LocaleManager.t('datepicker.selectMonth')} ${this.getMonthName(this.currentMonth)}`);
        this.registerEvent(monthButton, 'click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.currentViewMode === 'calendar') {
                this.setViewMode('month');
            }
        });

        yearMonthContainer.appendChild(yearButton);
        yearMonthContainer.appendChild(monthButton);

        // Mettre à jour les icônes via IconManager
        IconManager.updateIcon(yearCaret);
        IconManager.updateIcon(monthCaret);

        navigation.appendChild(yearMonthContainer);

        // Boutons de navigation
        const navButtons = document.createElement('div');
        navButtons.className = 'datepicker__navigation-buttons';

        // Bouton précédent
        const prevButton = document.createElement('button');
        prevButton.className = 'datepicker__navigation-button';
        prevButton.type = 'button';
        setAriaAttribute(prevButton, 'label', LocaleManager.t('datepicker.monthPrev'));
        prevButton.innerHTML = '<i class="k3ui-icon" name="chevron" rotate="-90"></i>';
        this.registerEvent(prevButton, 'click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.navigateMonth('prev');
        });
        navButtons.appendChild(prevButton);

        // Bouton suivant
        const nextButton = document.createElement('button');
        nextButton.className = 'datepicker__navigation-button';
        nextButton.type = 'button';
        setAriaAttribute(nextButton, 'label', LocaleManager.t('datepicker.monthNext'));
        nextButton.innerHTML = '<i class="k3ui-icon" name="chevron" rotate="90"></i>';
        this.registerEvent(nextButton, 'click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.navigateMonth('next');
        });
        navButtons.appendChild(nextButton);

        navigation.appendChild(navButtons);

        return navigation;
    }

    /**
     * Crée la vue année avec lazy loading
     */
    /**
     * Crée le header avec les boutons jour, mois et année séparés
     */
    private createYearMonthHeader(): HTMLDivElement {
        const header = document.createElement('div');
        header.className = 'datepicker__year-month-header';

        // Déterminer la date à afficher (date sélectionnée ou date courante)
        const displayDate = this.selectedDate || new Date(this.currentYear, this.currentMonth, 1);
        const displayDay = displayDate.getDate();
        const displayMonth = displayDate.getMonth();
        const displayYear = displayDate.getFullYear();

        // Bouton Jour (premier)
        const dayButton = document.createElement('button');
        dayButton.className = 'datepicker__day-button';
        dayButton.type = 'button';

        const dayText = document.createElement('span');
        dayText.textContent = `${displayDay}`;

        const dayCaret = document.createElement('i');
        dayCaret.className = 'k3ui-icon datepicker__day-caret';
        dayCaret.setAttribute('name', 'caret');
        // Rotation 180° pour pointer vers le bas quand on est en vue calendrier
        dayCaret.setAttribute('rotate', this.currentViewMode === 'calendar' ? '180' : '0');

        dayButton.appendChild(dayText);
        dayButton.appendChild(dayCaret);

        setAriaAttribute(dayButton, 'label', `${LocaleManager.t('datepicker.selectDay')} ${displayDay}`);
        this.registerEvent(dayButton, 'click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.currentViewMode === 'year' || this.currentViewMode === 'month') {
                this.setViewMode('calendar');
            }
        });

        // Bouton Mois (deuxième)
        const monthButton = document.createElement('button');
        monthButton.className = 'datepicker__month-button';
        monthButton.type = 'button';

        const monthText = document.createElement('span');
        monthText.textContent = this.getMonthName(displayMonth);

        const monthCaret = document.createElement('i');
        monthCaret.className = 'k3ui-icon datepicker__month-caret';
        monthCaret.setAttribute('name', 'caret');
        // Rotation 180° pour pointer vers le bas quand on est en vue mois
        monthCaret.setAttribute('rotate', this.currentViewMode === 'month' ? '180' : '0');

        monthButton.appendChild(monthText);
        monthButton.appendChild(monthCaret);

        setAriaAttribute(monthButton, 'label', `${LocaleManager.t('datepicker.selectMonth')} ${this.getMonthName(displayMonth)}`);
        this.registerEvent(monthButton, 'click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.currentViewMode === 'year' || this.currentViewMode === 'calendar') {
                this.setViewMode('month');
            }
        });

        // Bouton Année (troisième)
        const yearButton = document.createElement('button');
        yearButton.className = 'datepicker__year-button';
        yearButton.type = 'button';

        const yearText = document.createElement('span');
        yearText.textContent = `${displayYear}`;

        const yearCaret = document.createElement('i');
        yearCaret.className = 'k3ui-icon datepicker__year-caret';
        yearCaret.setAttribute('name', 'caret');
        // Rotation 180° pour pointer vers le bas quand on est en vue année
        yearCaret.setAttribute('rotate', this.currentViewMode === 'year' ? '180' : '0');

        yearButton.appendChild(yearText);
        yearButton.appendChild(yearCaret);

        setAriaAttribute(yearButton, 'label', `${LocaleManager.t('datepicker.selectYear')} ${displayYear}`);
        this.registerEvent(yearButton, 'click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.currentViewMode === 'month' || this.currentViewMode === 'calendar') {
                this.setViewMode('year');
            }
        });

        // Ajouter dans l'ordre : Jour, Mois, Année
        header.appendChild(dayButton);
        header.appendChild(monthButton);
        header.appendChild(yearButton);

        // Mettre à jour les icônes via IconManager
        IconManager.updateIcon(dayCaret);
        IconManager.updateIcon(monthCaret);
        IconManager.updateIcon(yearCaret);

        return header;
    }

    private createYearView(): HTMLDivElement {
        const container = document.createElement('div');
        container.className = 'datepicker__year-picker';

        // Header avec boutons année et mois
        const header = this.createYearMonthHeader();
        container.appendChild(header);

        // Ajouter les boutons de navigation par blocs
        const navigationContainer = document.createElement('div');
        navigationContainer.className = 'datepicker__year-navigation';

        // Bouton précédent (bloc de 16 années vers le passé)
        const prevButton = document.createElement('button');
        prevButton.className = 'datepicker__year-nav-button datepicker__year-nav-button--prev';
        prevButton.type = 'button';
        prevButton.innerHTML = '<i class="k3ui-icon" name="chevron" rotate="-90"></i>';
        setAriaAttribute(prevButton, 'label', LocaleManager.t('datepicker.yearBlockPrev'));
        this.registerEvent(prevButton, 'click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.navigateYearBlock('prev');
        });
        navigationContainer.appendChild(prevButton);

        // Affichage de la plage d'années actuelle
        const rangeDisplay = document.createElement('div');
        rangeDisplay.className = 'datepicker__year-range';
        navigationContainer.appendChild(rangeDisplay);

        // Bouton suivant (bloc de 16 années vers le futur)
        const nextButton = document.createElement('button');
        nextButton.className = 'datepicker__year-nav-button datepicker__year-nav-button--next';
        nextButton.type = 'button';
        nextButton.innerHTML = '<i class="k3ui-icon" name="chevron" rotate="90"></i>';
        setAriaAttribute(nextButton, 'label', LocaleManager.t('datepicker.yearBlockNext'));
        this.registerEvent(nextButton, 'click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.navigateYearBlock('next');
        });
        navigationContainer.appendChild(nextButton);

        container.appendChild(navigationContainer);

        const wrapper = document.createElement('div');
        wrapper.className = 'datepicker__year-grid-wrapper';
        this.yearGridWrapper = wrapper;

        const grid = document.createElement('div');
        grid.className = 'datepicker__year-grid';
        this.yearGrid = grid;

        // Calculer la décennie initiale centrée sur l'année courante
        // Format : décennie de 10 années + 1 avant (disabled) + 1 après (disabled) = 12 années
        // Exemple : 2018-2030 pour la décennie 2020-2029 (2018 et 2030 sont disabled mais visibles)
        const decadeStart = Math.floor(this.currentYear / 10) * 10; // Arrondir à la décennie inférieure (ex: 2025 -> 2020)
        const yearsBefore = 1; // 1 année avant la décennie (disabled)
        const blockStart = decadeStart - yearsBefore; // Année avant la décennie (disabled)

        // Ajuster si on dépasse les limites
        let adjustedBlockStart = blockStart;
        if (adjustedBlockStart < this.minYearLimit) {
            adjustedBlockStart = this.minYearLimit;
        } else if (adjustedBlockStart + this.yearBlockSize - 1 > this.maxYearLimit) {
            adjustedBlockStart = Math.max(this.minYearLimit, this.maxYearLimit - this.yearBlockSize + 1);
        }

        this.currentYearBlockStart = adjustedBlockStart;
        this.minLoadedYear = adjustedBlockStart;
        this.maxLoadedYear = Math.min(adjustedBlockStart + this.yearBlockSize - 1, this.maxYearLimit);

        // Générer les 12 années du bloc (décennie de 10 + 1 avant + 1 après disabled)
        this.renderYearBlock();

        // Mettre à jour l'affichage de la plage
        this.updateYearRangeDisplay(rangeDisplay);

        // Gérer le scroll pour changer de bloc
        let scrollTimeout: number | null = null;
        this.registerEvent(wrapper, 
            'scroll',
            () => {
                if (scrollTimeout) {
                    clearTimeout(scrollTimeout);
                }
                scrollTimeout = window.setTimeout(() => {
                    this.handleYearBlockScroll();
                }, 150);
            },
            { passive: true },
        );

        // Scroll vers l'année courante - centrer verticalement au milieu
        setTimeout(() => {
            this.scrollToCurrentYear();
        }, 100);

        // Mettre à jour les icônes
        IconManager.updateIcon(prevButton.querySelector('.k3ui-icon') as HTMLElement);
        IconManager.updateIcon(nextButton.querySelector('.k3ui-icon') as HTMLElement);

        wrapper.appendChild(grid);
        container.appendChild(wrapper);

        return container;
    }

    /**
     * Rend le bloc de 12 années actuel (décennie de 10 + 1 avant + 1 après disabled)
     */
    private renderYearBlock(): void {
        if (!this.yearGrid) return;

        // Vider la grille
        this.yearGrid.innerHTML = '';

        // Calculer la décennie (10 années au milieu)
        // La décennie commence à la première année qui se termine par 0
        const yearsBefore = 1; // 1 année avant la décennie
        const decadeStart = this.currentYearBlockStart + yearsBefore; // Première année de la décennie (ex: 2020)
        const decadeEnd = decadeStart + 9; // Dernière année de la décennie (ex: 2029)

        // Générer les 12 années du bloc
        for (let year = this.minLoadedYear; year <= this.maxLoadedYear; year++) {
            const isOutsideDecade = year < decadeStart || year > decadeEnd;
            const yearItem = this.createYearButton(year, isOutsideDecade);
            this.yearGrid.appendChild(yearItem);
        }
    }

    /**
     * Navigue vers le bloc précédent ou suivant (décennie précédente/suivante)
     */
    private navigateYearBlock(direction: 'prev' | 'next'): void {
        if (this.isLoadingYears) return;

        this.isLoadingYears = true;

        // Calculer la décennie actuelle (première année de la décennie)
        const yearsBefore = 1; // 1 année avant la décennie
        const currentDecadeStart = this.currentYearBlockStart + yearsBefore;

        if (direction === 'prev') {
            // Aller vers la décennie précédente : soustraire 10 années
            const newDecadeStart = Math.max(
                this.minYearLimit + yearsBefore, // Laisser place aux années disabled avant
                currentDecadeStart - 10
            );
            const newBlockStart = newDecadeStart - yearsBefore; // Années avant la décennie (disabled)

            if (newBlockStart === this.currentYearBlockStart) {
                // On est déjà à la limite
                this.isLoadingYears = false;
                return;
            }

            this.currentYearBlockStart = newBlockStart;
            this.minLoadedYear = newBlockStart;
            this.maxLoadedYear = Math.min(newBlockStart + this.yearBlockSize - 1, this.maxYearLimit);
        } else {
            // Aller vers la décennie suivante : ajouter 10 années
            const newDecadeStart = Math.min(
                this.maxYearLimit - 9 - yearsBefore, // Laisser place à la décennie + années disabled après
                currentDecadeStart + 10
            );
            const newBlockStart = newDecadeStart - yearsBefore; // Années avant la décennie (disabled)

            if (newBlockStart === this.currentYearBlockStart) {
                // On est déjà à la limite
                this.isLoadingYears = false;
                return;
            }

            this.currentYearBlockStart = newBlockStart;
            this.minLoadedYear = newBlockStart;
            this.maxLoadedYear = Math.min(newBlockStart + this.yearBlockSize - 1, this.maxYearLimit);
        }

        // Rendre le nouveau bloc
        this.renderYearBlock();

        // Mettre à jour l'affichage de la plage
        const rangeDisplay = this.modalElement?.querySelector('.datepicker__year-range') as HTMLElement;
        if (rangeDisplay) {
            this.updateYearRangeDisplay(rangeDisplay);
        }

        // Scroll vers le haut après changement de bloc
        if (this.yearGridWrapper) {
            this.yearGridWrapper.scrollTop = 0;
        }

        this.isLoadingYears = false;
    }

    /**
     * Met à jour l'affichage de la plage d'années (décennie)
     */
    private updateYearRangeDisplay(rangeDisplay: HTMLElement): void {
        if (!rangeDisplay) return;
        // Afficher la décennie complète (ex: 2020 - 2029, 1980 - 1989, 2000 - 2009)
        const yearsBefore = 1; // 1 année avant la décennie
        const decadeStart = this.currentYearBlockStart + yearsBefore; // Première année de la décennie (ex: 2020)
        const decadeEnd = decadeStart + 9; // Dernière année de la décennie (ex: 2029)
        rangeDisplay.textContent = `${decadeStart} - ${decadeEnd}`;
    }

    /**
     * Gère le scroll pour changer de bloc (au lieu du lazy loading)
     */
    private handleYearBlockScroll(): void {
        if (!this.yearGridWrapper || !this.yearGrid || this.isLoadingYears) return;

        const scrollTop = this.yearGridWrapper.scrollTop;
        const scrollHeight = this.yearGridWrapper.scrollHeight;
        const clientHeight = this.yearGridWrapper.clientHeight;
        const scrollBottom = scrollHeight - scrollTop - clientHeight;

        // Seuil de déclenchement : 50px du haut ou du bas
        const threshold = 50;

        // Changer de bloc vers le passé si on est proche du haut
        const yearsBefore = 1; // 1 année avant la décennie
        const currentDecadeStart = this.currentYearBlockStart + yearsBefore;
        if (scrollTop < threshold && currentDecadeStart > this.minYearLimit + yearsBefore) {
            this.navigateYearBlock('prev');
        }

        // Changer de bloc vers le futur si on est proche du bas
        const currentDecadeEnd = currentDecadeStart + 9;
        if (scrollBottom < threshold && currentDecadeEnd < this.maxYearLimit - yearsBefore) {
            this.navigateYearBlock('next');
        }
    }



    /**
     * Met à jour la grille du calendrier avec les jours actuels
     */
    private updateCalendarGrid(): void {
        if (!this.calendarElement || !this.modalElement) return;

        const daysGrid = this.calendarElement.querySelector('.datepicker__days-grid') as HTMLElement;
        if (!daysGrid) return;

        daysGrid.innerHTML = '';
        const days = this.getCalendarDays();
        days.forEach(dayData => {
            const day = this.createDayElement(dayData);
            daysGrid.appendChild(day);
        });
    }

    /**
     * Met à jour l'affichage de la date dans le header
     */
    private updateHeaderDate(): void {
        if (!this.modalElement) return;

        const dateDisplay = this.modalElement.querySelector('.datepicker__header-date') as HTMLDivElement;
        if (!dateDisplay) return;

        if (this.options.mode === 'range' && this.startDate && this.endDate) {
            dateDisplay.textContent = this.formatHeaderDateRange(this.startDate, this.endDate);
        } else if (this.options.mode === 'range' && this.startDate) {
            dateDisplay.textContent = this.formatHeaderDateSingle(this.startDate);
        } else if (this.selectedDate) {
            dateDisplay.textContent = this.formatHeaderDateSingle(this.selectedDate);
        } else {
            const today = new Date();
            dateDisplay.textContent = this.formatHeaderDateSingle(today);
        }
    }

    /**
     * Crée un bouton année avec ses attributs et événements
     */
    private createYearButton(year: number, isDisabled: boolean = false): HTMLButtonElement {
        const yearItem = document.createElement('button');
        yearItem.className = 'datepicker__year-item';
        yearItem.type = 'button';
        yearItem.textContent = year.toString();
        yearItem.setAttribute('data-year', year.toString());

        if (isDisabled) {
            yearItem.classList.add('datepicker__year-item--disabled');
            setAriaAttribute(yearItem, 'disabled', true);
        }

        if (year === this.currentYear) {
            yearItem.classList.add('datepicker__year-item--selected');
            setAriaAttribute(yearItem, 'selected', true);
        }

        setAriaAttribute(yearItem, 'label', `${LocaleManager.t('datepicker.yearLabel')} ${year}`);
        this.registerEvent(yearItem, 'click', () => {
            this.setYear(year);
        });

        return yearItem;
    }

    /**
     * Scroll vers l'année courante
     */
    private scrollToCurrentYear(): void {
        if (!this.yearGridWrapper || !this.yearGrid) return;

        const currentYearElement = this.yearGrid.querySelector(`[data-year="${this.currentYear}"]`) as HTMLElement;
        if (currentYearElement) {
            // Centrer parfaitement l'année courante au milieu de la zone visible
            const wrapperHeight = this.yearGridWrapper.clientHeight;
            const elementHeight = currentYearElement.offsetHeight;
            const elementTop = currentYearElement.offsetTop;

            // Calculer la position pour centrer : position de l'élément - moitié de la hauteur du wrapper + moitié de la hauteur de l'élément
            const scrollTop = elementTop - (wrapperHeight / 2) + (elementHeight / 2);

            // Utiliser scrollTop directement pour un positionnement immédiat et précis
            this.yearGridWrapper.scrollTop = Math.max(0, scrollTop);
        }
    }

    /**
     * Crée la vue mois
     */
    private createMonthView(): HTMLDivElement {
        const container = document.createElement('div');
        container.className = 'datepicker__month-picker';

        // Header avec boutons année et mois
        const header = this.createYearMonthHeader();
        container.appendChild(header);

        const wrapper = document.createElement('div');
        wrapper.className = 'datepicker__month-grid-wrapper';

        const grid = document.createElement('div');
        grid.className = 'datepicker__month-grid';

        // Générer les 12 mois
        for (let month = 0; month < 12; month++) {
            const monthItem = document.createElement('button');
            monthItem.className = 'datepicker__month-item';
            monthItem.type = 'button';
            const monthName = this.getMonthName(month);
            monthItem.textContent = monthName;

            if (month === this.currentMonth) {
                monthItem.classList.add('datepicker__month-item--selected');
                setAriaAttribute(monthItem, 'selected', true);
            }

            setAriaAttribute(monthItem, 'label', `${LocaleManager.t('datepicker.monthLabel')} ${monthName}`);
            this.registerEvent(monthItem, 'click', () => {
                this.setMonth(month);
            });

            grid.appendChild(monthItem);
        }

        wrapper.appendChild(grid);
        container.appendChild(wrapper);

        return container;
    }

    /**
     * Crée la vue input
     */
    private createInputModeView(): HTMLDivElement {
        const container = document.createElement('div');
        container.className = 'datepicker__input-mode';

        const label = document.createElement('label');
        label.className = 'datepicker__input-mode-label';
        label.textContent = LocaleManager.t('datepicker.enterDate');
        container.appendChild(label);

        const input = document.createElement('input');
        input.className = 'datepicker__input-mode-field';
        input.type = 'text';
        input.placeholder = this.options.dateFormat;
        if (this.selectedDate) {
            input.value = this.formatDate(this.selectedDate, this.options.dateFormat);
        }

        this.registerEvent(input, 'input', (e) => {
            const value = (e.target as HTMLInputElement).value;
            const date = this.parseDate(value);
            if (date) {
                this.selectDate(date);
            }
        });

        container.appendChild(input);

        return container;
    }

    /**
     * Crée le footer avec les boutons d'action (Cancel/OK)
     */
    private createFooter(): HTMLDivElement | null {
        const footer = document.createElement('div');
        footer.className = 'datepicker__footer';

        const actions = document.createElement('div');
        actions.className = 'datepicker__actions';

        // Bouton Cancel
        if (this.options.showCancelButton) {
            const cancelButton = document.createElement('button');
            cancelButton.className = 'btn btn--tonal ripple datepicker__button datepicker__button--cancel';
            cancelButton.type = 'button';
            cancelButton.textContent = this.options.cancelButtonText ?? LocaleManager.t('datepicker.cancel');
            setAriaAttribute(cancelButton, 'label', this.options.cancelButtonText ?? LocaleManager.t('datepicker.cancel'));
            this.registerEvent(cancelButton, 'click', () => {
                this.close();
            });
            actions.appendChild(cancelButton);
        }

        // Bouton OK
        if (this.options.showConfirmButton) {
            const okButton = document.createElement('button');
            okButton.className = 'btn btn--tonal ripple datepicker__button datepicker__button--ok';
            okButton.type = 'button';
            okButton.textContent = this.options.confirmButtonText ?? LocaleManager.t('datepicker.ok');
            setAriaAttribute(okButton, 'label', this.options.confirmButtonText ?? LocaleManager.t('datepicker.confirm'));
            this.registerEvent(okButton, 'click', () => {
                this.confirmSelection();
            });
            actions.appendChild(okButton);
        }

        // Ne retourner que si au moins un bouton est affiché
        if (actions.children.length > 0) {
            footer.appendChild(actions);
            return footer;
        }

        return null;
    }

    /**
     * Configure les attributs ARIA
     */
    private setupAriaAttributes(): void {
        if (!this.modalElement) return;

        setAriaAttributes(this.modalElement, {
            role: 'dialog',
            'aria-modal': true,
            'aria-label': LocaleManager.t('datepicker.ariaLabel'),
            'aria-labelledby': 'datepicker-header-date'
        });
    }

    /**
     * Gestionnaire d'événement focus sur l'input
     */
    private handleInputFocus = (): void => {
        if (!this.options.disabled && !this.options.readonly) {
            this.open();
        }
    };

    /**
     * Gestionnaire d'événement click sur l'input
     */
    private handleInputClick = (): void => {
        if (!this.options.disabled && !this.options.readonly) {
            this.open();
        }
    };

    /**
     * Gestionnaire d'événement input
     */
    private handleInputChange = (e: Event): void => {
        const value = (e.target as HTMLInputElement).value;
        const date = this.parseDate(value);
        if (date) {
            this.selectDate(date, false);
        }
    };

    /**
     * Gestionnaire d'événement blur sur l'input
     */
    private handleInputBlur = (): void => {
        // Validation de la date saisie
        if (this.inputElement && this.inputElement.value) {
            const date = this.parseDate(this.inputElement.value);
            if (!date) {
                // Date invalide, restaurer la valeur précédente
                this.updateDisplay();
            }
        }
    };

    /**
     * Gestionnaire d'événement keydown
     */
    private handleKeyDown = (event: KeyboardEvent): void => {
        if (!this.isOpen) return;

        switch (event.key) {
            case 'Escape':
                event.preventDefault();
                this.close();
                break;
            case 'ArrowLeft':
                if (this.currentViewMode === 'calendar') {
                    event.preventDefault();
                    this.navigateMonth('prev');
                }
                break;
            case 'ArrowRight':
                if (this.currentViewMode === 'calendar') {
                    event.preventDefault();
                    this.navigateMonth('next');
                }
                break;
            case 'Enter':
                if (this.currentViewMode === 'calendar') {
                    event.preventDefault();
                    this.confirmSelection();
                }
                break;
        }
    };

    /**
     * Gestionnaire d'événement mouse click
     */
    private handleMouseClick = (event: MouseEvent): void => {
        // Gestion des clics en dehors du modal pour fermer
        if (this.isOpen && this.backdropElement && event.target === this.backdropElement) {
            this.close();
        }
    };

    /**
     * Navigue vers le mois précédent/suivant
     */
    navigateMonth(direction: 'prev' | 'next'): void {

        if (direction === 'prev') {
            if (this.currentMonth === 0) {
                this.currentMonth = 11;
                this.currentYear--;
            } else {
                this.currentMonth--;
            }
        } else {
            if (this.currentMonth === 11) {
                this.currentMonth = 0;
                this.currentYear++;
            } else {
                this.currentMonth++;
            }
        }

        // Mettre à jour les boutons année et mois dans la navigation principale
        const yearButtonNav = this.modalElement?.querySelector('.datepicker__year-button-nav') as HTMLButtonElement;
        if (yearButtonNav) {
            const yearText = yearButtonNav.querySelector('span');
            if (yearText) {
                yearText.textContent = `${this.currentYear}`;
            }
        }

        const monthButtonNav = this.modalElement?.querySelector('.datepicker__month-button-nav') as HTMLButtonElement;
        if (monthButtonNav) {
            const monthText = monthButtonNav.querySelector('span');
            if (monthText) {
                monthText.textContent = this.getMonthName(this.currentMonth);
            }
        }

        // Mettre à jour les boutons jour/mois/année dans le header
        this.updateDayMonthYearButtons();

        // Mettre à jour la date dans le header
        this.updateHeaderDate();

        // Mettre à jour l'affichage du calendrier uniquement si on est en mode calendar
        if (this.currentViewMode === 'calendar') {
            this.updateCalendarGrid();
        }
    }

    /**
     * Définit l'année
     */
    setYear(year: number): void {
        this.currentYear = year;
        // Mettre à jour les boutons jour/mois/année dans le header
        this.updateDayMonthYearButtons();
        // Après sélection d'année, passer à la sélection de mois (selon Material Design 3)
        this.setViewMode('month');
    }

    /**
     * Définit le mois
     */
    setMonth(month: number): void {
        this.currentMonth = month;
        // Mettre à jour les boutons jour/mois/année dans le header
        this.updateDayMonthYearButtons();
        // Après sélection de mois, retourner au calendrier
        this.setViewMode('calendar');
        // Mettre à jour l'affichage
        this.updateDisplay();
    }

    /**
     * Met à jour les boutons jour/mois/année dans le header avec la date sélectionnée
     */
    private updateDayMonthYearButtons(): void {
        if (!this.modalElement) return;

        // Déterminer la date à afficher (date sélectionnée ou date courante)
        let displayDate: Date;
        if (this.options.mode === 'range') {
            // En mode range, utiliser startDate ou endDate selon ce qui est disponible
            displayDate = this.startDate || this.endDate || new Date(this.currentYear, this.currentMonth, 1);
        } else {
            // En mode single, utiliser selectedDate si disponible (pour avoir le jour exact)
            // Sinon utiliser currentYear/currentMonth pour le mois/année affichés
            if (this.selectedDate) {
                // Utiliser la date sélectionnée complète (jour, mois, année)
                displayDate = new Date(this.selectedDate);
            } else {
                // Aucune date sélectionnée : utiliser le mois/année actuellement affichés
                displayDate = new Date(this.currentYear, this.currentMonth, 1);
            }
        }

        const displayDay = displayDate.getDate();
        const displayMonth = displayDate.getMonth();
        const displayYear = displayDate.getFullYear();

        // Mettre à jour le bouton jour
        const dayButton = this.modalElement.querySelector('.datepicker__day-button') as HTMLButtonElement;
        if (dayButton) {
            const dayText = dayButton.querySelector('span');
            if (dayText) {
                dayText.textContent = `${displayDay}`;
            }
        }

        // Mettre à jour le bouton mois
        const monthButton = this.modalElement.querySelector('.datepicker__month-button') as HTMLButtonElement;
        if (monthButton) {
            const monthText = monthButton.querySelector('span');
            if (monthText) {
                monthText.textContent = this.getMonthName(displayMonth);
            }
        }

        // Mettre à jour le bouton année
        const yearButton = this.modalElement.querySelector('.datepicker__year-button') as HTMLButtonElement;
        if (yearButton) {
            const yearText = yearButton.querySelector('span');
            if (yearText) {
                yearText.textContent = `${displayYear}`;
            }
        }
    }

    /**
     * Met à jour la rotation du caret selon le mode de vue
     */
    private updateCaretRotation(): void {
        if (!this.modalElement) return;

        // Caret du bouton année dans la navigation du calendrier principal
        const yearCaretNav = this.modalElement.querySelector('.datepicker__year-caret-nav') as HTMLElement;
        if (yearCaretNav) {
            const rotate = this.currentViewMode === 'year' ? '180' : '0';
            yearCaretNav.setAttribute('rotate', rotate);
            IconManager.updateIcon(yearCaretNav);
        }

        // Caret du bouton mois dans la navigation du calendrier principal
        const monthCaretNav = this.modalElement.querySelector('.datepicker__month-caret-nav') as HTMLElement;
        if (monthCaretNav) {
            const rotate = this.currentViewMode === 'month' ? '180' : '0';
            monthCaretNav.setAttribute('rotate', rotate);
            IconManager.updateIcon(monthCaretNav);
        }

        // Caret du bouton jour dans le header jour/mois/année
        const dayCaret = this.modalElement.querySelector('.datepicker__day-caret') as HTMLElement;
        if (dayCaret) {
            const rotate = this.currentViewMode === 'calendar' ? '180' : '0';
            dayCaret.setAttribute('rotate', rotate);
            IconManager.updateIcon(dayCaret);
        }

        // Caret du bouton mois dans le header jour/mois/année
        const monthCaret = this.modalElement.querySelector('.datepicker__month-caret') as HTMLElement;
        if (monthCaret) {
            const rotate = this.currentViewMode === 'month' ? '180' : '0';
            monthCaret.setAttribute('rotate', rotate);
            IconManager.updateIcon(monthCaret);
        }

        // Caret du bouton année dans le header jour/mois/année
        const yearCaret = this.modalElement.querySelector('.datepicker__year-caret') as HTMLElement;
        if (yearCaret) {
            const rotate = this.currentViewMode === 'year' ? '180' : '0';
            yearCaret.setAttribute('rotate', rotate);
            IconManager.updateIcon(yearCaret);
        }
    }

    /**
     * Change le mode d'affichage
     */
    setViewMode(mode: 'calendar' | 'year' | 'month' | 'input'): void {
        this.currentViewMode = mode;

        if (!this.modalElement) return;

        // Supprimer les vues existantes
        if (this.calendarElement) {
            this.calendarElement.remove();
            this.calendarElement = null;
        }
        if (this.yearGridElement) {
            this.yearGridElement.remove();
            this.yearGridElement = null;
            this.yearGridWrapper = null;
            this.yearGrid = null;
            this.minLoadedYear = 0;
            this.maxLoadedYear = 0;
            this.currentYearBlockStart = 0;
            this.isLoadingYears = false;
        }
        if (this.monthGridElement) {
            this.monthGridElement.remove();
            this.monthGridElement = null;
        }
        if (this.inputModeElement) {
            this.inputModeElement.remove();
            this.inputModeElement = null;
        }

        // Supprimer l'ancien header jour/mois/année s'il existe (dans les vues année/mois)
        const oldYearMonthHeader = this.modalElement.querySelector('.datepicker__year-month-header');
        if (oldYearMonthHeader) {
            oldYearMonthHeader.remove();
        }

        // Créer la nouvelle vue
        let newView: HTMLDivElement;
        if (mode === 'calendar') {
            newView = this.createCalendarView();
            this.calendarElement = newView;
        } else if (mode === 'year') {
            newView = this.createYearView();
            this.yearGridElement = newView;
        } else if (mode === 'month') {
            newView = this.createMonthView();
            this.monthGridElement = newView;
        } else {
            newView = this.createInputModeView();
            this.inputModeElement = newView;
        }

        // Mettre à jour le caret
        this.updateCaretRotation();

        // Mettre à jour les boutons jour/mois/année dans le header (après création de la nouvelle vue)
        // Utiliser setTimeout pour s'assurer que le DOM est complètement rendu
        setTimeout(() => {
            this.updateDayMonthYearButtons();
        }, 0);

        // Insérer après le header
        const header = this.modalElement.querySelector('.datepicker__header');
        if (header) {
            header.insertAdjacentElement('afterend', newView);
        }
    }

    /**
     * Change le mode d'affichage (toggle)
     */
    toggleViewMode(): void {
        if (this.currentViewMode === 'calendar') {
            this.setViewMode('year');
        } else {
            this.setViewMode('calendar');
        }
    }

    /**
     * Sélectionne une date (mode single) ou une plage (mode range)
     */
    selectDate(date: Date, updateCalendar: boolean = true): void {
        // Vérifier si la date est valide
        if (this.isDateDisabled(date)) {
            return;
        }

        HapticManager.triggerFromOptions(this.options, 'selection');

        if (this.options.mode === 'range') {
            // Mode range : gestion de la sélection de plage
            const dateNormalized = new Date(date);
            dateNormalized.setHours(0, 0, 0, 0);

            if (!this.tempStartDate) {
                // Premier clic : définir la date de début
                this.tempStartDate = dateNormalized;
                this.startDate = dateNormalized;
                this.endDate = null;
            } else {
                // Deuxième clic : définir la date de fin
                if (dateNormalized.getTime() === this.tempStartDate.getTime()) {
                    // Même date cliquée : réinitialiser
                    this.tempStartDate = null;
                    this.startDate = null;
                    this.endDate = null;
                } else if (dateNormalized < this.tempStartDate) {
                    // Date antérieure : inverser (la date cliquée devient startDate, l'ancienne devient endDate)
                    this.endDate = new Date(this.tempStartDate);
                    this.startDate = dateNormalized;
                    this.tempStartDate = null;
                } else {
                    // Date postérieure : normal
                    this.endDate = dateNormalized;
                    this.tempStartDate = null;
                }
            }

            // Mettre à jour le mois affiché
            const displayDate = this.startDate || this.endDate || date;
            this.currentMonth = displayDate.getMonth();
            this.currentYear = displayDate.getFullYear();

            // Mettre à jour l'affichage
            this.updateDisplay();

            // Mettre à jour les boutons jour/mois/année dans le header
            this.updateDayMonthYearButtons();

            // Mettre à jour le header avec la date/plage sélectionnée
            this.updateHeaderDate();

            // Callbacks
            if (this.startDate && this.endDate) {
                // Plage complète sélectionnée : fermer automatiquement après un court délai pour voir la sélection
                const range: [Date, Date] = [this.startDate, this.endDate];
                const dateRange = { start: this.startDate, end: this.endDate };
                if (this.options.onSelect) {
                    this.options.onSelect(dateRange, this);
                }
                if (this.options.onChange) {
                    this.options.onChange(dateRange, this);
                }
                // Mettre à jour le calendrier pour afficher la plage complète
                if (updateCalendar) {
                    this.updateCalendarGrid();
                }
                // Ne pas fermer automatiquement - attendre le clic sur OK
            } else if (this.startDate) {
                // Seulement startDate sélectionnée (premier clic) - on garde le modal ouvert
                if (this.options.onChange) {
                    this.options.onChange(null, this);
                }
                // Mettre à jour le calendrier pour afficher la sélection
                if (updateCalendar) {
                    this.updateCalendarGrid();
                }
            }
        } else {
            // Mode single : comportement original
            this.selectedDate = new Date(date);
            this.currentMonth = this.selectedDate.getMonth();
            this.currentYear = this.selectedDate.getFullYear();

            // Mettre à jour l'affichage
            this.updateDisplay();

            // Mettre à jour les boutons jour/mois/année dans le header
            this.updateDayMonthYearButtons();

            // Mettre à jour le header avec la date sélectionnée en temps réel
            this.updateHeaderDate();

            // Callback onSelect
            if (this.options.onSelect) {
                this.options.onSelect(this.selectedDate, this);
            }

            // Callback onChange
            if (this.options.onChange) {
                this.options.onChange(this.selectedDate, this);
            }

            // Mettre à jour le calendrier pour afficher la sélection
            if (updateCalendar) {
                this.updateCalendarGrid();
            }
            // Ne pas fermer automatiquement - attendre le clic sur OK
        }
    }

    /**
     * Efface la date sélectionnée (mode single) ou la plage (mode range)
     */
    clearDate(): void {
        if (this.options.mode === 'range') {
            this.startDate = null;
            this.endDate = null;
            this.tempStartDate = null;
            this.updateDisplay();

            // Callback onChange
            if (this.options.onChange) {
                this.options.onChange(null, this);
            }
        } else {
            this.selectedDate = null;
            this.updateDisplay();

            // Callback onChange
            if (this.options.onChange) {
                this.options.onChange(null, this);
            }
        }
    }

    /**
     * Confirme la sélection et ferme
     */
    confirmSelection(): void {
        if (this.options.mode === 'range') {
            if (this.startDate && this.endDate) {
                const dateRange = { start: this.startDate, end: this.endDate };
                if (this.options.onSelect) {
                    this.options.onSelect(dateRange, this);
                }
            }
        } else {
            if (this.selectedDate) {
                // Callback onSelect
                if (this.options.onSelect) {
                    this.options.onSelect(this.selectedDate, this);
                }
            }
        }

        this.close();
    }

    /**
     * Obtient les jours du calendrier
     */
    private getCalendarDays(): CalendarDay[] {
        const days: CalendarDay[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Nombre de jours dans le mois
        const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();

        // Premier jour du mois
        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const firstDayOfWeek = firstDay.getDay();
        const adjustedFirstDay = this.options.firstDayOfWeek === 1
            ? (firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1)
            : firstDayOfWeek;

        // Jours du mois précédent
        const prevMonthDays = new Date(this.currentYear, this.currentMonth, 0).getDate();
        for (let i = adjustedFirstDay - 1; i >= 0; i--) {
            const day = prevMonthDays - i;
            const date = new Date(this.currentYear, this.currentMonth - 1, day);
            date.setHours(0, 0, 0, 0);

            const isInRange = this.options.mode === 'range' ? this.isDateInRange(date) : false;
            const isRangeStart = this.options.mode === 'range' && this.startDate ? this.isSameDay(date, this.startDate) : false;
            const isRangeEnd = this.options.mode === 'range' && this.endDate ? this.isSameDay(date, this.endDate) : false;
            const isSelected = this.options.mode === 'single' && this.selectedDate ? this.isSameDay(date, this.selectedDate) : false;

            days.push({
                day,
                month: this.currentMonth - 1,
                year: this.currentYear,
                isCurrentMonth: false,
                isToday: this.isSameDay(date, today),
                isSelected,
                isDisabled: this.isDateDisabled(date),
                date,
                isInRange,
                isRangeStart,
                isRangeEnd
            });
        }

        // Jours du mois actuel
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(this.currentYear, this.currentMonth, day);
            date.setHours(0, 0, 0, 0);

            const isInRange = this.options.mode === 'range' ? this.isDateInRange(date) : false;
            const isRangeStart = this.options.mode === 'range' && this.startDate ? this.isSameDay(date, this.startDate) : false;
            const isRangeEnd = this.options.mode === 'range' && this.endDate ? this.isSameDay(date, this.endDate) : false;
            const isSelected = this.options.mode === 'single' && this.selectedDate ? this.isSameDay(date, this.selectedDate) : false;

            days.push({
                day,
                month: this.currentMonth,
                year: this.currentYear,
                isCurrentMonth: true,
                isToday: this.isSameDay(date, today),
                isSelected,
                isDisabled: this.isDateDisabled(date),
                date,
                isInRange,
                isRangeStart,
                isRangeEnd
            });
        }

        // Jours du mois suivant pour compléter la grille (42 jours = 6 semaines)
        const remainingDays = 42 - days.length;
        for (let day = 1; day <= remainingDays; day++) {
            const date = new Date(this.currentYear, this.currentMonth + 1, day);
            date.setHours(0, 0, 0, 0);

            const isInRange = this.options.mode === 'range' ? this.isDateInRange(date) : false;
            const isRangeStart = this.options.mode === 'range' && this.startDate ? this.isSameDay(date, this.startDate) : false;
            const isRangeEnd = this.options.mode === 'range' && this.endDate ? this.isSameDay(date, this.endDate) : false;
            const isSelected = this.options.mode === 'single' && this.selectedDate ? this.isSameDay(date, this.selectedDate) : false;

            days.push({
                day,
                month: this.currentMonth + 1,
                year: this.currentYear,
                isCurrentMonth: false,
                isToday: this.isSameDay(date, today),
                isSelected,
                isDisabled: this.isDateDisabled(date),
                date,
                isInRange,
                isRangeStart,
                isRangeEnd
            });
        }

        return days;
    }

    /**
     * Vérifie si une date est désactivée
     */
    private isDateDisabled(date: Date): boolean {
        const dateCopy = new Date(date);
        dateCopy.setHours(0, 0, 0, 0);

        // Vérifier minDate
        if (this.options.minDate) {
            const minDate = new Date(this.options.minDate);
            minDate.setHours(0, 0, 0, 0);
            if (dateCopy < minDate) {
                return true;
            }
        }

        // Vérifier maxDate
        if (this.options.maxDate) {
            const maxDate = new Date(this.options.maxDate);
            maxDate.setHours(0, 0, 0, 0);
            if (dateCopy > maxDate) {
                return true;
            }
        }

        // Vérifier disabledDates
        if (this.options.disabledDates) {
            if (typeof this.options.disabledDates === 'function') {
                return this.options.disabledDates(dateCopy);
            }

            if (Array.isArray(this.options.disabledDates) && this.options.disabledDates.length > 0) {
                for (const disabledDate of this.options.disabledDates) {
                    const disabled = new Date(disabledDate);
                    disabled.setHours(0, 0, 0, 0);
                    if (dateCopy.getTime() === disabled.getTime()) {
                        return true;
                    }
                }
            }
        }

        return false;
    }


    /**
     * Vérifie si une date est dans la plage sélectionnée (mode range)
     */
    private isDateInRange(date: Date): boolean {
        if (this.options.mode !== 'range' || !this.startDate || !this.endDate) {
            return false;
        }

        const dateCopy = new Date(date);
        dateCopy.setHours(0, 0, 0, 0);

        const start = new Date(this.startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(this.endDate);
        end.setHours(0, 0, 0, 0);

        return dateCopy >= start && dateCopy <= end;
    }

    /**
     * Vérifie si deux dates sont le même jour
     */
    private isSameDay(date1: Date, date2: Date): boolean {
        return date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate();
    }

    /**
     * Obtient les noms des jours de la semaine (i18n)
     */
    private getWeekDayNames(): string[] {
        const weekDays: string[] = [];
        for (let i = 0; i < 7; i++) {
            weekDays.push(LocaleManager.t(`datepicker.weekday${i}`));
        }
        if (this.options.firstDayOfWeek === 1) {
            const sunday = weekDays.shift();
            if (sunday) {
                weekDays.push(sunday);
            }
        }
        return weekDays;
    }

    /**
     * Obtient le nom du mois (i18n)
     */
    private getMonthName(monthIndex: number): string {
        return LocaleManager.t(`datepicker.month${monthIndex}`);
    }

    /**
     * Formate une date selon le format donné
     */
    formatDate(date: Date, format: string): string {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return format
            .replace('DD', day)
            .replace('MM', month)
            .replace('YYYY', String(year))
            .replace('YY', String(year).slice(-2));
    }

    /**
     * Formate une date pour l'affichage dans le header (mode single)
     * Format : "Mon, Aug 17" (sans points, première lettre en majuscule pour jour et mois)
     */
    private formatHeaderDateSingle(date: Date): string {
        try {
            let weekday = new Intl.DateTimeFormat(this.options.locale, {
                weekday: 'short'
            }).format(date).replace(/\./g, ''); // Retirer les points
            let monthDay = new Intl.DateTimeFormat(this.options.locale, {
                month: 'short',
                day: 'numeric'
            }).format(date).replace(/\./g, ''); // Retirer les points

            // Mettre la première lettre en majuscule pour le jour
            weekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);

            // Trouver où commence le mois dans monthDay et mettre sa première lettre en majuscule
            // Le format peut être "1 nov" (fr) ou "Nov 1" (en) selon la locale
            const parts = monthDay.split(' ');
            if (parts.length >= 2) {
                // Vérifier quel élément est le mois (commence par une lettre)
                for (let i = 0; i < parts.length; i++) {
                    if (parts[i].match(/^[a-zA-Z]/)) {
                        // C'est le mois, mettre sa première lettre en majuscule
                        parts[i] = parts[i].charAt(0).toUpperCase() + parts[i].slice(1);
                        break;
                    }
                }
                monthDay = parts.join(' ');
            } else {
                // Si le format est différent, essayer de mettre la première lettre en majuscule
                monthDay = monthDay.charAt(0).toUpperCase() + monthDay.slice(1);
            }

            return `${weekday}, ${monthDay}`;
        } catch (e) {
            // Fallback en cas d'erreur de locale
            const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const weekday = weekdays[date.getDay()];
            const month = months[date.getMonth()];
            const day = date.getDate();
            return `${weekday}, ${month.charAt(0).toUpperCase() + month.slice(1)} ${day}`;
        }
    }

    /**
     * Formate une plage de dates pour l'affichage dans le header (mode range)
     * Format : "Aug 17 – Aug 23" (sans points, première lettre en majuscule pour chaque mois)
     */
    private formatHeaderDateRange(startDate: Date, endDate: Date): string {
        try {
            let start = new Intl.DateTimeFormat(this.options.locale, {
                month: 'short',
                day: 'numeric'
            }).format(startDate).replace(/\./g, ''); // Retirer les points
            let end = new Intl.DateTimeFormat(this.options.locale, {
                month: 'short',
                day: 'numeric'
            }).format(endDate).replace(/\./g, ''); // Retirer les points

            // Mettre la première lettre en majuscule pour chaque mois
            // Le format peut être "1 nov" (fr) ou "Nov 1" (en) selon la locale
            const startParts = start.split(' ');
            if (startParts.length >= 2) {
                // Vérifier quel élément est le mois (commence par une lettre)
                for (let i = 0; i < startParts.length; i++) {
                    if (startParts[i].match(/^[a-zA-Z]/)) {
                        // C'est le mois, mettre sa première lettre en majuscule
                        startParts[i] = startParts[i].charAt(0).toUpperCase() + startParts[i].slice(1);
                        break;
                    }
                }
                start = startParts.join(' ');
            } else {
                start = start.charAt(0).toUpperCase() + start.slice(1);
            }

            const endParts = end.split(' ');
            if (endParts.length >= 2) {
                // Vérifier quel élément est le mois (commence par une lettre)
                for (let i = 0; i < endParts.length; i++) {
                    if (endParts[i].match(/^[a-zA-Z]/)) {
                        // C'est le mois, mettre sa première lettre en majuscule
                        endParts[i] = endParts[i].charAt(0).toUpperCase() + endParts[i].slice(1);
                        break;
                    }
                }
                end = endParts.join(' ');
            } else {
                end = end.charAt(0).toUpperCase() + end.slice(1);
            }

            return `${start} – ${end}`;
        } catch (e) {
            // Fallback en cas d'erreur de locale
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const startMonth = months[startDate.getMonth()];
            const startDay = startDate.getDate();
            const endMonth = months[endDate.getMonth()];
            const endDay = endDate.getDate();
            return `${startMonth.charAt(0).toUpperCase() + startMonth.slice(1)} ${startDay} – ${endMonth.charAt(0).toUpperCase() + endMonth.slice(1)} ${endDay}`;
        }
    }

    /**
     * Parse une date depuis une chaîne
     */
    parseDate(dateString: string): Date | null {
        if (!dateString) return null;

        // Essayer de parser selon le format
        const format = this.options.dateFormat;
        const parts = dateString.split(/[\/\-\.]/);
        const formatParts = format.split(/[\/\-\.]/);

        if (parts.length !== formatParts.length) {
            return null;
        }

        let day = 0, month = 0, year = 0;

        formatParts.forEach((part, index) => {
            const value = parseInt(parts[index], 10);
            if (isNaN(value)) return;

            if (part.includes('D')) {
                day = value;
            } else if (part.includes('M')) {
                month = value - 1; // Les mois sont 0-indexed
            } else if (part.includes('Y')) {
                year = value;
                if (year < 100) {
                    year += 2000; // Assumer 2000+ pour les années à 2 chiffres
                }
            }
        });

        if (day && month >= 0 && month <= 11 && year) {
            const date = new Date(year, month, day);
            if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
                return date;
            }
        }

        return null;
    }

    /**
     * Récupère la date sélectionnée
     */
    getDate(): Date | null {
        return this.selectedDate ? new Date(this.selectedDate) : null;
    }

    /**
     * Définit la date sélectionnée
     */
    setDate(date: Date | null): void {
        if (date) {
            this.selectDate(date, false);
        } else {
            this.clearDate();
        }
    }

    /**
     * Détruit le composant
     */
    destroy(): void {
        // Fermer si ouvert
        if (this.isOpen) {
            this.close();
        }

        // Détruire l'instance Field
        if (this.fieldInstance) {
            this.fieldInstance.destroy();
            this.fieldInstance = null;
        }

        // Nettoyer les instances
        if (this.keyboardInstance) {
            // Keyboard n'a pas de méthode destroy, mais on peut le laisser être garbage collected
            this.keyboardInstance = null;
        }

        if (this.mouseInstance) {
            // Mouse n'a pas de méthode destroy, mais on peut le laisser être garbage collected
            this.mouseInstance = null;
        }

        LoggerManager.global.info('Datepicker component destroyed');
        super.destroy();
    }

    /**
     * Anime l'entrée du modal avec effet haptic
     */
    private _animateIn(): void {
        if (!this.backdropElement || !this.modalElement) return;

        const duration = this.options.inDuration ?? 250;
        const isHaptic = this.options.haptic;

        // Styles initiaux
        this.backdropElement.style.display = 'block';
        this.modalElement.style.display = 'block';
        this.modalElement.style.opacity = '0';

        // Opacité de l'overlay (thème K3UI effectif, pas seulement l'OS)
        const isDarkTheme = ThemeManager.isDark();
        const opacity = this.options.opacity !== undefined
            ? this.options.opacity
            : (isDarkTheme ? 0.64 : 0.32);

        this.backdropElement.style.background = `rgba(0, 0, 0, ${opacity})`;
        this.backdropElement.style.opacity = '0';
        this.backdropElement.style.transition = `opacity ${duration}ms ease-out`;

        // Animation du modal selon le type
        if (isHaptic) {
            // Animation haptic : scale initial plus petit pour effet dynamique
            this.modalElement.style.transform = 'translate(-50%, -50%) scale(0.8)';

            // Calculer les durées pour respecter inDuration
            const overshootDuration = Math.floor(duration * 0.6); // 60% pour l'overshoot
            const settleDuration = duration - overshootDuration; // 40% pour le retour

            // Première transition : scale 0.8 → 1.04 avec overshoot
            this.modalElement.style.transition = `
                opacity ${overshootDuration}ms cubic-bezier(0.25, 1.35, 0.5, 1),
                transform ${overshootDuration}ms cubic-bezier(0.25, 1.35, 0.5, 1)
            `;
        } else {
            // Animation standard Material Design
            this.modalElement.style.transform = 'translate(-50%, -50%) scale(0.9)';
            this.modalElement.style.transition = `
                opacity ${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1),
                transform ${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1)
            `;
        }

        // Positionner le modal au centre
        this.modalElement.style.position = 'fixed';
        this.modalElement.style.top = '50%';
        this.modalElement.style.left = '50%';
        this.modalElement.style.transformOrigin = 'center center';

        // Démarrer l'animation
        requestAnimationFrame(() => {
            if (this.backdropElement) {
                this.backdropElement.style.opacity = '1';
            }

            if (this.modalElement) {
                this.modalElement.style.opacity = '1';

                if (isHaptic) {
                    // Animation haptic : scale final avec léger overshoot
                    const overshootDuration = Math.floor(duration * 0.6);
                    const settleDuration = duration - overshootDuration;

                    this.modalElement.style.transform = 'translate(-50%, -50%) scale(1.04)';

                    // Puis revenir à scale(1) après l'overshoot
                    setTimeout(() => {
                        if (this.modalElement) {
                            this.modalElement.style.transition = `transform ${settleDuration}ms cubic-bezier(0.4, 0.0, 0.2, 1)`;
                            this.modalElement.style.transform = 'translate(-50%, -50%) scale(1)';
                        }
                    }, overshootDuration);
                } else {
                    // Animation standard
                    this.modalElement.style.transform = 'translate(-50%, -50%) scale(1)';
                }
            }
        });

        // Callback onOpenEnd
        setTimeout(() => {
            if (this.options.onOpenEnd) {
                this.options.onOpenEnd(this.el);
            }
            if (this.options.onOpen) {
                this.options.onOpen(this);
            }
        }, duration);
    }

    /**
     * Anime la sortie du modal avec effet haptic
     */
    private _animateOut(): void {
        if (!this.backdropElement || !this.modalElement) return;

        const duration = this.options.outDuration ?? 250;
        const isHaptic = this.options.haptic;

        // Overlay animation
        this.backdropElement.style.transition = `opacity ${duration}ms ease-in`;

        // Modal animation selon le type
        if (isHaptic) {
            // Animation haptic : courbe avec rebond inverse pour la sortie
            const bounceOutDuration = Math.floor(duration * 0.3);
            const shrinkDuration = duration - bounceOutDuration;

            // Étape 1 : Rebond vers l'extérieur (scale 1 → 1.08)
            this.modalElement.style.transition = `transform ${bounceOutDuration}ms cubic-bezier(0.25, 1.35, 0.5, 1)`;
            this.modalElement.style.transform = 'translate(-50%, -50%) scale(1.08)';

            // Étape 2 : Rétrécissement final avec rebond inverse (scale 1.08 → 0.7) et fade
            setTimeout(() => {
                if (this.modalElement) {
                    this.modalElement.style.transition = `
                        opacity ${shrinkDuration}ms cubic-bezier(0.4, 0.0, 1, 1),
                        transform ${shrinkDuration}ms cubic-bezier(0.4, 0.0, 0.6, 1)
                    `;
                    this.modalElement.style.opacity = '0';
                    this.modalElement.style.transform = 'translate(-50%, -50%) scale(0.7)';
                }
            }, bounceOutDuration);
        } else {
            // Animation standard Material Design
            this.modalElement.style.transition = `
                opacity ${duration}ms cubic-bezier(0.4, 0.0, 1, 1),
                transform ${duration}ms cubic-bezier(0.4, 0.0, 1, 1)
            `;
        }

        // Démarrer l'animation de sortie
        requestAnimationFrame(() => {
            if (this.backdropElement) {
                this.backdropElement.style.opacity = '0';
            }

            if (this.modalElement && !isHaptic) {
                // Animation standard
                this.modalElement.style.opacity = '0';
                this.modalElement.style.transform = 'translate(-50%, -50%) scale(0.9)';
            }
        });

        // Nettoyer après l'animation
        setTimeout(() => {
            if (this.backdropElement) {
                this.backdropElement.remove();
            }
            this.backdropElement = null;
            this.modalElement = null;
            this.calendarElement = null;
            this.yearGridElement = null;
            this.yearGridWrapper = null;
            this.yearGrid = null;
            this.minLoadedYear = 0;
            this.maxLoadedYear = 0;
            this.isLoadingYears = false;
            this.monthGridElement = null;
            this.inputModeElement = null;

            // Callback onCloseEnd
            if (this.options.onCloseEnd) {
                this.options.onCloseEnd(this.el);
            }
            if (this.options.onClose) {
                this.options.onClose(this);
            }
        }, duration);
    }

    /**
     * Applique les couleurs dynamiques au modal
     */
    private _applyDynamicColors(): void {
        if (!this.modalElement) return;

        // Appliquer les couleurs dynamiques via CSS custom properties
        // Les couleurs sont déjà définies sur document.documentElement par DynamicColorManager
        // On utilise simplement les variables CSS Material Design 3
        this.modalElement.style.backgroundColor = 'var(--md-sys-color-surface-container, #fff)';
        this.modalElement.style.color = 'var(--md-sys-color-on-surface, #000)';

        // Appliquer les couleurs aux éléments enfants si nécessaire
        const header = this.modalElement.querySelector('.datepicker__header');
        if (header) {
            (header as HTMLElement).style.backgroundColor = 'var(--md-sys-color-surface-container-high, #f5f5f5)';
            (header as HTMLElement).style.color = 'var(--md-sys-color-on-surface, #000)';
        }
    }
}



/**
 * Enregistrement du Web Component k3ui-datepicker
 * @description Permet l'utilisation de <k3ui-datepicker> dans le HTML. Initialisation par AutoInit.
 */
if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-datepicker')) {
    customElements.define('k3ui-datepicker', class extends HTMLElement {
        private datepickerInstance: Datepicker | null = null;

        connectedCallback() {
            // L'initialisation sera geree par AutoInit
            // ou manuellement via K.Datepicker.init(this)
            if (!this.hasAttribute('data-initialized')) {
                this.setAttribute('data-initialized', 'true');
            }
        }

        disconnectedCallback() {
            // Nettoyage lors de la suppression du DOM
            if (this.datepickerInstance) {
                this.datepickerInstance.destroy();
                this.datepickerInstance = null;
            }
        }
    });
}
