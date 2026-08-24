/**
 * @fileoverview Composant Timepicker K3UI - Sélecteur d'heure Material Design 3
 * @description Composant de sélection d'heure avec modal interactif, validation et accessibilité complète
 * @author K3UI Team
 * @version 1.0.0
 * @element k3ui-timepicker
 */

import { Component } from '../core/base/Component';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import { TimepickerOptions } from '../types/components';
import { PriorityLevel } from '../types/base';
import { KElement, InitElements } from '../types/base';
import { LoggerManager, IconManager, LocaleManager, ThemeManager } from '../core/managers';
import { setAriaAttribute, setAriaAttributes, removeAriaAttribute } from '../utils/dom/aria';
import { Mouse, Keyboard } from '../core/managers';
import { Field } from './Field';
import { getTimepickerDefaults } from '../specs/components/timepicker.specs';
import { HapticManager } from '../core/managers/HapticManager';
import {
    bindPointerDown,
    getPointerCoords,
    startPointerDragSession,
    type PointerLikeEvent,
} from '../utils/dom/pointer';
import { getK3uiGlobal } from '../types/global/k3ui-window';

/**
 * Options par défaut du composant Timepicker
 * @description Extrait depuis les specs pour garantir la cohérence
 */
const _defaults: TimepickerOptions = getTimepickerDefaults();

/**
 * Classe du composant Timepicker
 */
export class Timepicker extends Component<TimepickerOptions> {
    declare el: HTMLElement;

    /** Si le timepicker est ouvert */
    isOpen: boolean = false;

    /** Heure actuellement sélectionnée */
    selectedTime: { hours: number; minutes: number } | null = null;

    /** Heure actuellement affichée dans le picker */
    currentHours: number = 0;
    currentMinutes: number = 0;

    /** Flag pour indiquer si on est en train de draguer */
    private _isDragging: boolean = false;
    private _unbindClockDialDrag: (() => void) | null = null;
    private _clockDialDragCleanup: (() => void) | null = null;

    /** Instance Field pour le champ de saisie */
    fieldInstance: Field | null = null;

    /** Élément input du Field (accès direct pour compatibilité) */
    inputElement: HTMLInputElement | null = null;

    /** Élément backdrop */
    backdropElement: HTMLDivElement | null = null;

    /** Élément modal */
    modalElement: HTMLDivElement | null = null;

    /** Élément container du timepicker */
    timepickerElement: HTMLDivElement | null = null;

    /** Mode d'affichage : 'dial' (cadran) ou 'input' (saisie numérique) */
    currentViewMode: 'dial' | 'input' = 'dial';

    /** Élément cadran d'horloge */
    clockDialElement: HTMLDivElement | null = null;

    /** Élément aiguille de l'horloge */
    clockHandElement: HTMLDivElement | null = null;

    /** Élément cercle selector container au bout de l'aiguille */
    clockHandEndElement: HTMLDivElement | null = null;

    /** Élément texte affichant le nombre sélectionné dans le cercle */
    clockHandEndNumberElement: HTMLSpanElement | null = null;

    /** Élément container des nombres du cadran (heures) */
    clockNumbersHourElement: HTMLDivElement | null = null;

    /** Élément container des nombres du cadran (minutes) */
    clockNumbersMinuteElement: HTMLDivElement | null = null;

    /** Angle précédent de l'aiguille pour éviter les rotations inverses */
    private lastHandAngle: number | null = null;

    /** Dernière heure ayant déclenché une vibration (évite les répétitions au drag). */
    private lastHapticTimeKey: string | null = null;

    /** Élément sélecteur AM/PM */
    amPmElement: HTMLDivElement | null = null;

    /** Bouton de basculement 12/24 */
    private toggleFormatButton: HTMLButtonElement | null = null;

    // ============================================================================
    // CONSTANTES POUR LE CADRAN D'HORLOGE
    // ============================================================================

    /** Taille du cercle du cadran (diamètre) - Material Design 3 : 296dp */
    private static readonly CIRCLE_SIZE = 296; // Taille du cadran (296px)

    /** Rayon de l'anneau extérieur (12h format) - 296 / 2.5 = 118.4px, réduit à 118px pour éviter le dépassement */
    private static readonly OUTER_RING_RADIUS = 118;

    /** Rayon de l'anneau intérieur (24h format) - 296 / 4 = 74px */
    private static readonly INNER_RING_RADIUS = 74;

    /** Rayon de séparation entre anneau intérieur et extérieur - moyenne entre INNER (74) et OUTER (116) = 94px */
    private static readonly RING_SEPARATION_RADIUS = 94;

    /** Angle par position sur le cadran (360° / 12 positions) */
    private static readonly ANGLE_PER_POSITION = 30;

    /** Angle par minute (360° / 60 minutes) */
    private static readonly ANGLE_PER_MINUTE = 6;

    /** Mode actuel : 'hour' ou 'minute' */
    private clockMode: 'hour' | 'minute' = 'hour';

    /** Timer pour la transition de vue */
    private toggleViewTimer: ReturnType<typeof setTimeout> | null = null;

    /** Éléments pour le mode input */
    private inputHourElement: HTMLInputElement | null = null;
    private inputMinuteElement: HTMLInputElement | null = null;
    private inputViewElement: HTMLDivElement | null = null;
    private toggleViewButton: HTMLButtonElement | null = null;

    /** Instance Keyboard pour la navigation */
    keyboardInstance: Keyboard | null = null;

    /** Instance Mouse pour les interactions */
    mouseInstance: Mouse | null = null;

    /** Scroll Y sauvegardé */
    savedScrollY: number = 0;

    /** Niveau de priorité du composant */
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    constructor(el: HTMLElement, options: Partial<TimepickerOptions> = {}) {
        // Lire les attributs HTML et les convertir en options
        const htmlOptions = Timepicker.readAttributes(el);
        // Options passées à init() priment sur les attributs HTML (comme en doc : init(el, { onSelect }))
        super(el, { ...htmlOptions, ...options } as TimepickerOptions, toComponentClassDef(Timepicker));

        // Normaliser l'heure sélectionnée
        if (this.options.selectedTime) {
            this.selectedTime = {
                hours: Math.max(0, Math.min(23, this.options.selectedTime.hours)),
                minutes: Math.max(0, Math.min(59, this.options.selectedTime.minutes))
            };
            this.currentHours = this.selectedTime.hours;
            this.currentMinutes = this.selectedTime.minutes;
        }

        // Sans heure sélectionnée : affichage par défaut 00:00
        if (!this.options.selectedTime) {
            this.currentHours = 0;
            this.currentMinutes = 0;
        }

        // Normaliser l'heure pour le format 12h si nécessaire
        // En format 12h, 00:00 (minuit) s'affiche comme 12:00 AM
        if (this.options.format === '12h') {
            if (this.currentHours > 12) {
                this.currentHours = this.currentHours - 12;
            } else if (this.currentHours === 0) {
                // En format 12h, minuit (00:00) s'affiche comme 12:00 AM
                // Mais on garde currentHours = 0 en interne pour la cohérence
                // L'affichage sera géré par formatHourForDisplay
            }
        }

        // Détecter automatiquement le format selon la locale si non spécifié
        if (!options.format && !htmlOptions.format) {
            this.options.format = this.detectFormatFromLocale(this.options.locale);
        }

        // Initialiser le composant
        this.init();
    }

    /**
     * Détecte le format d'heure (12h ou 24h) selon la locale
     * @param locale Locale à utiliser (ex: 'fr-FR', 'en-US')
     * @returns '12h' ou '24h'
     */
    private detectFormatFromLocale(locale: string): '12h' | '24h' {
        try {
            // Créer un formateur de date pour tester le format
            const formatter = new Intl.DateTimeFormat(locale, {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'UTC',
            });
            // Tester avec 23h pour voir si le format inclut 23 (24h) ou 11 PM (12h)
            const formatted = formatter.format(new Date(Date.UTC(2020, 1, 1, 23)));
            // Si le format contient '23', c'est du 24h, sinon c'est du 12h
            return formatted.includes('23') ? '24h' : '12h';
        } catch (e) {
            // En cas d'erreur, utiliser '24h' par défaut
            return '24h';
        }
    }

    static getInstance(el: HTMLElement): Timepicker | undefined {
        return Component.getInstance(el) as Timepicker | undefined;
    }

    static get defaults(): TimepickerOptions {
        return _defaults;
    }

    /**
     * Initialise une instance de Timepicker.
     * @param el Élément HTML.
     * @param options Options du composant.
     */
    static init(el: HTMLElement, options?: Partial<TimepickerOptions>): Timepicker;
    /**
     * Initialise des instances de Timepicker.
     * @param els Éléments HTML.
     * @param options Options du composant.
     */
    static init(els: InitElements<KElement>, options?: Partial<TimepickerOptions>): Timepicker[];
    static init(
        els: HTMLElement | InitElements<KElement>,
        options?: Partial<TimepickerOptions>
    ): Timepicker | Timepicker[] {
        if (els instanceof Element) {
            // Vérifier si une instance existe déjà
            const existing = Timepicker.getInstance(els as HTMLElement);
            if (existing) {
                return existing;
            }
            return new Timepicker(els as HTMLElement, options);
        } else if (!!els && els.length) {
            const instances = [];
            for (let i = 0; i < els.length; i++) {
                // Vérifier si une instance existe déjà
                const existing = Timepicker.getInstance(els[i] as HTMLElement);
                if (existing) {
                    instances.push(existing);
                } else {
                    instances.push(new Timepicker(els[i] as HTMLElement, options));
                }
            }
            return instances;
        }
        return [];
    }

    /**
     * Lit les attributs HTML et les convertit en options
     */
    private static readAttributes(el: HTMLElement): Partial<TimepickerOptions> {
        const options: Partial<TimepickerOptions> = {};

        // Lire les attributs HTML
        if (el.hasAttribute('locale')) {
            options.locale = el.getAttribute('locale') || 'fr-FR';
        }
        if (el.hasAttribute('time-format')) {
            options.timeFormat = el.getAttribute('time-format') || 'HH:mm';
        }
        if (el.hasAttribute('format')) {
            const format = el.getAttribute('format');
            if (format === '12h' || format === '24h') {
                options.format = format;
            }
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
            options.icon = el.getAttribute('icon') || 'clock';
        }
        if (el.hasAttribute('minute-step')) {
            const step = parseInt(el.getAttribute('minute-step') || '1', 10);
            options.minuteStep = isNaN(step) ? 1 : step;
        }
        if (el.hasAttribute('hour-step')) {
            const step = parseInt(el.getAttribute('hour-step') || '1', 10);
            options.hourStep = isNaN(step) ? 1 : step;
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
        options.showCancelButton = !el.hasAttribute('hide-cancel-button');
        options.showConfirmButton = !el.hasAttribute('hide-confirm-button');
        options.allowInput = !el.hasAttribute('disable-input');
        options.allowKeyboardNavigation = !el.hasAttribute('disable-keyboard');

        // Heure min/max
        if (el.hasAttribute('min-time')) {
            const minTimeStr = el.getAttribute('min-time');
            if (minTimeStr) {
                const parts = minTimeStr.split(':');
                if (parts.length === 2) {
                    const hours = parseInt(parts[0], 10);
                    const minutes = parseInt(parts[1], 10);
                    if (!isNaN(hours) && !isNaN(minutes)) {
                        options.minTime = { hours, minutes };
                    }
                }
            }
        }
        if (el.hasAttribute('max-time')) {
            const maxTimeStr = el.getAttribute('max-time');
            if (maxTimeStr) {
                const parts = maxTimeStr.split(':');
                if (parts.length === 2) {
                    const hours = parseInt(parts[0], 10);
                    const minutes = parseInt(parts[1], 10);
                    if (!isNaN(hours) && !isNaN(minutes)) {
                        options.maxTime = { hours, minutes };
                    }
                }
            }
        }

        // Heure sélectionnée initiale
        const timeStr = el.getAttribute('value') || el.getAttribute('selected-time');
        if (timeStr && timeStr.trim() !== '') {
            const parts = timeStr.split(':');
            if (parts.length === 2) {
                const hours = parseInt(parts[0], 10);
                const minutes = parseInt(parts[1], 10);
                if (!isNaN(hours) && !isNaN(minutes)) {
                    options.selectedTime = { hours, minutes };
                }
            }
        }

        return options;
    }

    /**
     * Initialise le composant
     */
    init(): void {
        LoggerManager.global.info('Timepicker component initialized');

        // Créer la structure DOM
        this.createStructure();

        // Lire la valeur de l'input si elle existe et qu'aucune heure n'a été fournie via les options
        // (pas d'attribut value ou selected-time sur l'élément)
        if (!this.options.selectedTime) {
            // Vérifier d'abord si l'élément original est un input avec une valeur
            let inputValue: string | null = null;
            if (this.el instanceof HTMLInputElement && this.el.value) {
                inputValue = this.el.value;
            } else if (this.inputElement && this.inputElement.value) {
                inputValue = this.inputElement.value;
            }

            if (inputValue) {
                const time = this.parseTime(inputValue);
                if (time) {
                    this.selectedTime = time;
                    this.currentHours = time.hours;
                    this.currentMinutes = time.minutes;

                    // Normaliser l'heure pour le format 12h si nécessaire
                    if (this.options.format === '12h') {
                        if (this.currentHours > 12) {
                            this.currentHours = this.currentHours - 12;
                        } else if (this.currentHours === 0) {
                            this.currentHours = 12;
                        }
                    }
                }
            }
        }

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
        fieldElement.setAttribute('placeholder', this.options.placeholder ?? LocaleManager.t('timepicker.placeholder'));
        fieldElement.setAttribute('autocomplete', 'off');

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

        // Initialiser le Field
        this.fieldInstance = Field.init(fieldElement);

        // Récupérer l'élément input du Field
        this.inputElement = this.fieldInstance.inputElement as HTMLInputElement;

        // Forcer l'initialisation des icônes du Field après initialisation
        setTimeout(() => {
            getK3uiGlobal()?.IconManager?.forceDisplayIcons();
        }, 10);

        // Mettre à jour l'état d'erreur du Field après initialisation
        this.updateFieldErrorState();

        // Ajouter le gestionnaire de clic sur l'icône horloge
        setTimeout(() => {
            this.setupIconClick();
        }, 50);
    }

    /**
     * Configure le clic sur l'icône horloge pour ouvrir le timepicker
     */
    private setupIconClick(): void {
        if (!this.fieldInstance || !this.fieldInstance.el) return;

        // Trouver l'icône trailing dans le Field
        let trailingIcon = this.fieldInstance.el.querySelector('.trailing-icon.k3ui-icon[name]') as HTMLElement;

        if (!trailingIcon && this.fieldInstance.containerElement) {
            trailingIcon = this.fieldInstance.containerElement.querySelector('.trailing-icon.k3ui-icon[name]') as HTMLElement;
        }

        if (!trailingIcon && this.options.icon) {
            trailingIcon = this.fieldInstance.el.querySelector(`i.k3ui-icon.trailing-icon[name="${this.options.icon}"]`) as HTMLElement;
        }

        if (trailingIcon && this.options.showIcon) {
            trailingIcon.style.cursor = 'pointer';
            trailingIcon.setAttribute('role', 'button');
            trailingIcon.setAttribute('tabindex', '0');
            setAriaAttribute(trailingIcon, 'label', LocaleManager.t('timepicker.ariaOpenPicker'));

            this.registerEvent(trailingIcon, 'click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!this.options.disabled && !this.options.readonly) {
                    this.open();
                }
            });

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
                if (this.fieldInstance.helperElement) {
                    this.fieldInstance.helperElement.textContent = this.options.errorMessage;
                    this.fieldInstance.helperElement.classList.add('error');
                }
            }
            this.fieldInstance.invalid = true;
            if (this.fieldInstance.containerElement) {
                this.fieldInstance.containerElement.classList.remove('valid');
                this.fieldInstance.containerElement.classList.add('invalid');
            }
        } else {
            fieldEl.removeAttribute('error');
            fieldEl.removeAttribute('error-message');
            if (this.fieldInstance.helperElement) {
                this.fieldInstance.helperElement.classList.remove('error');
                if (this.options.helper) {
                    this.fieldInstance.helperElement.textContent = this.options.helper;
                } else {
                    this.fieldInstance.helperElement.textContent = '';
                }
            }
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
        this.el.classList.add('timepicker');

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
     * Met à jour l'affichage de l'heure
     */
    private updateDisplay(): void {
        if (!this.fieldInstance || !this.inputElement) return;

        if (this.selectedTime) {
            const formattedTime = this.formatTime(this.selectedTime.hours, this.selectedTime.minutes);
            this.fieldInstance.setValue(formattedTime);
        } else {
            this.fieldInstance.setValue('');
            if (this.inputElement) {
                this.inputElement.value = '';
            }
        }
    }

    /**
     * Ouvre le timepicker
     */
    open(): void {
        if (this.isOpen || this.options.disabled) return;

        // Callback onOpenStart
        if (this.options.onOpenStart) {
            this.options.onOpenStart(this.el);
        }

        // Réinitialiser le mode à 'hour' par défaut
        this.clockMode = 'hour';

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

            // Mettre à jour le cadran et l'aiguille après que le modal soit complètement rendu
            if (this.currentViewMode === 'dial') {
                // Utiliser un seul requestAnimationFrame pour positionner immédiatement sans latence
                requestAnimationFrame(() => {
                    // Forcer un reflow en accédant à une propriété qui force le layout
                    if (this.clockDialElement) {
                        void this.clockDialElement.offsetHeight;
                    }

                    // Forcer un reflow sur les nombres pour s'assurer qu'ils sont positionnés
                    if (this.clockNumbersHourElement) {
                        void this.clockNumbersHourElement.offsetHeight;
                        const firstNumber = this.clockNumbersHourElement.querySelector('.timepicker__clock-number') as HTMLElement;
                        if (firstNumber) {
                            void firstNumber.offsetWidth;
                        }
                    }

                    // Positionner immédiatement le dial et le hand sans délai supplémentaire
                    if (this.clockNumbersHourElement || this.clockNumbersMinuteElement) {
                        this.updateClockDial();
                    }
                    // Mettre à jour l'aiguille après le rendu
                    if (this.clockHandElement) {
                        this.updateClockHand();
                    }
                    // Mettre à jour l'affichage pour activer le mode heures par défaut
                    this.updateTimeDisplay();
                });
            } else {
                // En mode input, mettre à jour l'affichage pour activer l'input des heures par défaut
                setTimeout(() => {
                    this.updateTimeDisplay();
                }, 100);
            }
        }

        LoggerManager.global.info('Timepicker opened');
    }

    /**
     * Ferme le timepicker
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

        LoggerManager.global.info('Timepicker closed');
    }

    /**
     * Crée le modal du timepicker
     */
    private createModal(): void {
        // Créer le backdrop
        this.backdropElement = document.createElement('div');
        this.backdropElement.className = 'timepicker__backdrop';
        setAriaAttribute(this.backdropElement, 'hidden', false);

        // Créer le modal
        this.modalElement = document.createElement('div');
        this.modalElement.className = 'timepicker__modal';
        setAriaAttributes(this.modalElement, {
            role: 'dialog',
            'aria-modal': true,
            'aria-label': LocaleManager.t('timepicker.ariaLabel')
        });

        // Appliquer les couleurs dynamiques au modal
        this._applyDynamicColors();

        // Créer le header
        const header = this.createHeader();
        this.modalElement.appendChild(header);

        // Créer le contenu
        this.timepickerElement = this.createTimepickerView();
        this.modalElement.appendChild(this.timepickerElement);

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
        header.className = 'timepicker__header';

        const label = document.createElement('div');
        label.className = 'timepicker__header-label';
        label.textContent = LocaleManager.t('timepicker.modalTitle');
        header.appendChild(label);

        // Retirer l'affichage de l'heure actuelle en haut

        return header;
    }

    /**
     * Détecte si on est en mode landscape (horizontal)
     */
    private isLandscape(): boolean {
        return window.innerWidth > window.innerHeight;
    }

    /**
     * Crée la vue du timepicker selon le mode (dial ou input)
     */
    private createTimepickerView(): HTMLDivElement {
        const container = document.createElement('div');
        container.className = 'timepicker__time-view';

        if (this.currentViewMode === 'input') {
            const inputView = this.createInputView();
            container.appendChild(inputView);
        } else {
            const dialView = this.createDialView();
            container.appendChild(dialView);
        }

        // Ajouter la classe landscape si nécessaire
        if (this.isLandscape()) {
            container.classList.add('timepicker__time-view--landscape');
        }

        // Écouter les changements de taille de fenêtre
        const handleResize = () => {
            if (this.modalElement) {
                const timeView = this.modalElement.querySelector('.timepicker__time-view') as HTMLElement;
                if (timeView) {
                    if (this.isLandscape()) {
                        timeView.classList.add('timepicker__time-view--landscape');
                    } else {
                        timeView.classList.remove('timepicker__time-view--landscape');
                    }
                }
            }
        };
        this.registerEvent(window, 'resize', handleResize);

        return container;
    }

    /**
     * Crée la vue avec le cadran d'horloge analogique
     */
    private createDialView(): HTMLDivElement {
        const container = document.createElement('div');
        container.className = 'timepicker__time-view';

        // Container principal
        const timeContainer = document.createElement('div');
        timeContainer.className = 'timepicker__time-container';

        // Ajouter la classe landscape si nécessaire
        if (this.isLandscape()) {
            timeContainer.classList.add('timepicker__time-container--landscape');
        }

        // Affichage de l'heure sélectionnée (cliquable)
        const timeDisplay = document.createElement('div');
        timeDisplay.className = 'timepicker__time-display';

        const hourDisplay = document.createElement('button');
        hourDisplay.className = 'timepicker__hour-display';
        hourDisplay.type = 'button';
        hourDisplay.textContent = this.formatHourForDisplay(this.currentHours);
        this.registerEvent(hourDisplay, 'click', () => {
            this.clockMode = 'hour';
            // Passer à la vue heures
            this.showView('hour');
            this.updateClockDial();
            this.updateClockHand();
            this.updateTimeDisplay();
        });
        timeDisplay.appendChild(hourDisplay);

        const separator = document.createElement('div');
        separator.className = 'timepicker__separator';
        // Créer deux points ronds empilés verticalement, chacun dans sa propre div
        const dot1Wrapper = document.createElement('div');
        dot1Wrapper.className = 'timepicker__separator-dot-wrapper';
        const dot1 = document.createElement('span');
        dot1.className = 'timepicker__separator-dot';
        dot1.textContent = '•';
        dot1Wrapper.appendChild(dot1);

        const dot2Wrapper = document.createElement('div');
        dot2Wrapper.className = 'timepicker__separator-dot-wrapper';
        const dot2 = document.createElement('span');
        dot2.className = 'timepicker__separator-dot';
        dot2.textContent = '•';
        dot2Wrapper.appendChild(dot2);

        separator.appendChild(dot1Wrapper);
        separator.appendChild(dot2Wrapper);
        timeDisplay.appendChild(separator);

        const minuteDisplay = document.createElement('button');
        minuteDisplay.className = 'timepicker__minute-display';
        minuteDisplay.type = 'button';
        minuteDisplay.textContent = this.currentMinutes.toString().padStart(2, '0');
        this.registerEvent(minuteDisplay, 'click', () => {
            // Passer à la vue minutes
            this.showView('minute');
        });
        timeDisplay.appendChild(minuteDisplay);

        // Sélecteur AM/PM (toujours présent, désactivé en format 24h selon Material Design 3)
        // Ajouté directement dans timeDisplay pour être à côté des minutes
        this.amPmElement = this.createAmPmSelector();
        timeDisplay.appendChild(this.amPmElement);

        timeContainer.appendChild(timeDisplay);

        // Cadran d'horloge
        const clockDial = this.createClockDial();
        timeContainer.appendChild(clockDial);

        container.appendChild(timeContainer);

        return container;
    }

    /**
     * Crée la vue avec saisie numérique
     */
    private createInputView(): HTMLDivElement {
        const container = document.createElement('div');
        container.className = 'timepicker__time-view timepicker__time-view--input';
        this.inputViewElement = container;

        // Container principal
        const timeContainer = document.createElement('div');
        timeContainer.className = 'timepicker__time-container timepicker__time-container--input';

        // Affichage de l'heure sélectionnée (cliquable)
        const timeDisplay = document.createElement('div');
        timeDisplay.className = 'timepicker__time-display';

        const hourWrapper = document.createElement('div');
        hourWrapper.className = 'timepicker__input-wrapper';

        const hourInput = document.createElement('input');
        hourInput.className = 'timepicker__input-hour';
        hourInput.type = 'text';
        hourInput.inputMode = 'numeric';
        hourInput.maxLength = 2;
        // Ne pas ajouter AM/PM dans l'input de la version input (le sélecteur AM/PM est à côté)
        hourInput.value = this.formatHourForDisplay(this.currentHours);
        setAriaAttribute(hourInput, 'label', LocaleManager.t('timepicker.hour'));
        this.inputHourElement = hourInput;

        this.registerEvent(hourInput, 'focus', (e) => {
            // Sélectionner tout le texte pour permettre la suppression facile
            const input = e.target as HTMLInputElement;
            // Utiliser setTimeout pour s'assurer que la sélection se fait après le focus
            setTimeout(() => {
                input.select();
            }, 0);
            this.clockMode = 'hour';
            this.updateTimeDisplay();
        });

        this.registerEvent(hourInput, 'input', (e) => {
            const input = e.target as HTMLInputElement;
            // Filtrer uniquement les caractères numériques (ne pas inclure AM/PM)
            let value = input.value.replace(/[^0-9]/g, '');

            // Limiter à 2 caractères
            if (value.length > 2) {
                value = value.substring(0, 2);
            }

            // Si la valeur est vide, permettre la suppression complète
            // Ne pas mettre à jour currentHours pour permettre la re-saisie
            if (value.length === 0) {
                input.value = '';
                return;
            }

            // Validation intelligente selon le format
            const hour = parseInt(value, 10);
            if (!isNaN(hour)) {
                if (this.options.format === '12h') {
                    // En mode 12h, permettre 1-12
                    // Si on tape un seul chiffre, permettre 1-9 (pour permettre "1" puis "2" pour "12")
                    // Si on tape deux chiffres, valider que c'est entre 1 et 12
                    if (value.length === 1) {
                        // Permettre 1-9 pour la saisie progressive
                        if (hour >= 1 && hour <= 9) {
                            input.value = value;
                            this.currentHours = hour;
                            // Ne pas appeler updateTimeDisplay() ici pour éviter le formatage
                            // Mettre à jour seulement les autres éléments (dial, hand) sans formater l'input
                            const hourDisplay = this.modalElement?.querySelector('.timepicker__hour-display') as HTMLElement;
                            if (hourDisplay) {
                                hourDisplay.textContent = this.formatHourForDisplay(this.currentHours);
                            }
                            if (this.clockDialElement && this.clockMode === 'hour') {
                                this.updateClockDial();
                                this.updateClockHand();
                            }
                        } else {
                            // Bloquer si le premier chiffre est invalide (0 ou > 9)
                            input.value = '';
                        }
                    } else if (value.length === 2) {
                        // Valider que c'est entre 10 et 12
                        if (hour >= 10 && hour <= 12) {
                            input.value = value;
                            this.currentHours = hour;
                            this.updateTimeDisplay();
                        } else {
                            // Si invalide, garder seulement le premier chiffre si valide
                            const firstDigit = parseInt(value[0], 10);
                            if (firstDigit >= 1 && firstDigit <= 9) {
                                input.value = value[0];
                                this.currentHours = firstDigit;
                                // Ne pas appeler updateTimeDisplay() ici pour éviter le formatage
                                const hourDisplay = this.modalElement?.querySelector('.timepicker__hour-display') as HTMLElement;
                                if (hourDisplay) {
                                    hourDisplay.textContent = this.formatHourForDisplay(this.currentHours);
                                }
                                if (this.clockDialElement && this.clockMode === 'hour') {
                                    this.updateClockDial();
                                    this.updateClockHand();
                                }
                            } else {
                                input.value = '';
                            }
                        }
                    }
                } else {
                    // En mode 24h, permettre 0-23
                    // Si on tape un seul chiffre, permettre 0-9 (pour permettre la saisie progressive)
                    // Si on tape deux chiffres, valider que c'est entre 0 et 23
                    if (value.length === 1) {
                        // Permettre 0-9 pour la saisie progressive
                        if (hour >= 0 && hour <= 9) {
                            input.value = value;
                            this.currentHours = hour;
                            // Ne pas appeler updateTimeDisplay() ici pour éviter le formatage en "01"
                            // Mettre à jour seulement les autres éléments (dial, hand) sans formater l'input
                            const hourDisplay = this.modalElement?.querySelector('.timepicker__hour-display') as HTMLElement;
                            if (hourDisplay) {
                                hourDisplay.textContent = this.formatHourForDisplay(this.currentHours);
                            }
                            if (this.clockDialElement && this.clockMode === 'hour') {
                                this.updateClockDial();
                                this.updateClockHand();
                            }
                        } else {
                            // Bloquer si le premier chiffre est invalide
                            input.value = '';
                        }
                    } else if (value.length === 2) {
                        // Valider que c'est entre 0 et 23
                        if (hour >= 0 && hour <= 23) {
                            input.value = value;
                            this.currentHours = hour;
                            this.updateTimeDisplay();
                        } else {
                            // Si invalide (24-99), garder seulement le premier chiffre si valide
                            const firstDigit = parseInt(value[0], 10);
                            if (firstDigit >= 0 && firstDigit <= 9) {
                                input.value = value[0];
                                this.currentHours = firstDigit;
                                // Ne pas appeler updateTimeDisplay() ici pour éviter le formatage en "01"
                                const hourDisplay = this.modalElement?.querySelector('.timepicker__hour-display') as HTMLElement;
                                if (hourDisplay) {
                                    hourDisplay.textContent = this.formatHourForDisplay(this.currentHours);
                                }
                                if (this.clockDialElement && this.clockMode === 'hour') {
                                    this.updateClockDial();
                                    this.updateClockHand();
                                }
                            } else {
                                input.value = '';
                            }
                        }
                    }
                }
            }
        });

        this.registerEvent(hourInput, 'keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                // Valider et passer aux minutes
                // Filtrer uniquement les chiffres (ne pas inclure AM/PM)
                const valueStr = hourInput.value.replace(/[^0-9]/g, '');
                const value = parseInt(valueStr, 10);
                if (!isNaN(value)) {
                    if (this.options.format === '12h') {
                        if (value >= 1 && value <= 12) {
                            this.currentHours = value;
                            this.clockMode = 'minute';
                            if (this.inputMinuteElement) {
                                this.inputMinuteElement.focus();
                                this.inputMinuteElement.select();
                            }
                            this.updateTimeDisplay();
                        }
                    } else {
                        if (value >= 0 && value <= 23) {
                            this.currentHours = value;
                            this.clockMode = 'minute';
                            if (this.inputMinuteElement) {
                                this.inputMinuteElement.focus();
                                this.inputMinuteElement.select();
                            }
                            this.updateTimeDisplay();
                        }
                    }
                }
            }
        });

        this.registerEvent(hourInput, 'blur', () => {
            // Si l'input est vide, restaurer la valeur actuelle seulement si on perd le focus
            // mais permettre de laisser vide pendant la saisie
            if (hourInput.value.trim() === '') {
                hourInput.value = this.formatHourForDisplay(this.currentHours);
                return;
            }

            // Filtrer uniquement les chiffres (ne pas inclure AM/PM)
            const valueStr = hourInput.value.replace(/[^0-9]/g, '');
            const value = parseInt(valueStr, 10);
            if (!isNaN(value)) {
                if (this.options.format === '12h') {
                    if (value >= 1 && value <= 12) {
                        this.currentHours = value;
                        hourInput.value = this.formatHourForDisplay(value);
                        // Passer automatiquement aux minutes après validation
                        this.clockMode = 'minute';
                        if (this.inputMinuteElement) {
                            this.inputMinuteElement.focus();
                            this.inputMinuteElement.select();
                        }
                        this.updateTimeDisplay();
                    } else {
                        // Corriger la valeur si invalide
                        if (value < 1) {
                            this.currentHours = 1;
                            hourInput.value = '1';
                        } else if (value > 12) {
                            this.currentHours = 12;
                            hourInput.value = '12';
                        }
                        // Passer automatiquement aux minutes après validation
                        this.clockMode = 'minute';
                        if (this.inputMinuteElement) {
                            this.inputMinuteElement.focus();
                            this.inputMinuteElement.select();
                        }
                        this.updateTimeDisplay();
                    }
                } else {
                    if (value >= 0 && value <= 23) {
                        this.currentHours = value;
                        hourInput.value = this.formatHourForDisplay(value);
                        // Passer automatiquement aux minutes après validation
                        this.clockMode = 'minute';
                        if (this.inputMinuteElement) {
                            this.inputMinuteElement.focus();
                            this.inputMinuteElement.select();
                        }
                        this.updateTimeDisplay();
                    } else {
                        // Corriger la valeur si invalide
                        if (value < 0) {
                            hourInput.value = '0';
                            this.currentHours = 0;
                        } else if (value > 23) {
                            hourInput.value = '23';
                            this.currentHours = 23;
                        }
                        // Passer automatiquement aux minutes après validation
                        this.clockMode = 'minute';
                        if (this.inputMinuteElement) {
                            this.inputMinuteElement.focus();
                            this.inputMinuteElement.select();
                        }
                        this.updateTimeDisplay();
                    }
                }
            } else {
                // Si la valeur n'est pas un nombre, restaurer la valeur actuelle
                hourInput.value = this.formatHourForDisplay(this.currentHours);
            }
        });

        const hourLabel = document.createElement('div');
        hourLabel.className = 'timepicker__input-label';
        hourLabel.textContent = LocaleManager.t('timepicker.hour');
        hourWrapper.appendChild(hourInput);
        hourWrapper.appendChild(hourLabel);
        timeDisplay.appendChild(hourWrapper);

        const separator = document.createElement('div');
        separator.className = 'timepicker__separator';
        // Créer deux points ronds empilés verticalement, chacun dans sa propre div
        const dot1Wrapper = document.createElement('div');
        dot1Wrapper.className = 'timepicker__separator-dot-wrapper';
        const dot1 = document.createElement('span');
        dot1.className = 'timepicker__separator-dot';
        dot1.textContent = '•';
        dot1Wrapper.appendChild(dot1);

        const dot2Wrapper = document.createElement('div');
        dot2Wrapper.className = 'timepicker__separator-dot-wrapper';
        const dot2 = document.createElement('span');
        dot2.className = 'timepicker__separator-dot';
        dot2.textContent = '•';
        dot2Wrapper.appendChild(dot2);

        separator.appendChild(dot1Wrapper);
        separator.appendChild(dot2Wrapper);
        timeDisplay.appendChild(separator);

        const minuteWrapper = document.createElement('div');
        minuteWrapper.className = 'timepicker__input-wrapper';

        const minuteInput = document.createElement('input');
        minuteInput.className = 'timepicker__input-minute';
        minuteInput.type = 'text';
        minuteInput.inputMode = 'numeric';
        minuteInput.maxLength = 2;
        minuteInput.value = this.currentMinutes.toString().padStart(2, '0');
        setAriaAttribute(minuteInput, 'label', LocaleManager.t('timepicker.minute'));
        this.inputMinuteElement = minuteInput;

        this.registerEvent(minuteInput, 'focus', (e) => {
            // Sélectionner tout le texte pour permettre la suppression facile
            const input = e.target as HTMLInputElement;
            // Utiliser setTimeout pour s'assurer que la sélection se fait après le focus
            setTimeout(() => {
                input.select();
            }, 0);
            this.clockMode = 'minute';
            this.updateTimeDisplay();
        });

        this.registerEvent(minuteInput, 'input', (e) => {
            const input = e.target as HTMLInputElement;
            // Filtrer uniquement les caractères numériques
            let value = input.value.replace(/[^0-9]/g, '');

            // Limiter à 2 caractères
            if (value.length > 2) {
                value = value.substring(0, 2);
            }

            // Si la valeur est vide, permettre la suppression complète
            if (value.length === 0) {
                input.value = '';
                return;
            }

            // Validation intelligente pour les minutes (0-59)
            const minute = parseInt(value, 10);
            if (!isNaN(minute)) {
                if (value.length === 1) {
                    // Permettre 0-5 pour la saisie progressive (pour permettre "5" puis "9" pour "59")
                    if (minute >= 0 && minute <= 5) {
                        input.value = value;
                        this.currentMinutes = minute;
                        // Ne pas appeler setMinute() ici pour éviter le formatage en "05"
                        // Mettre à jour seulement les autres éléments (dial, hand) sans formater l'input
                        const minuteDisplay = this.modalElement?.querySelector('.timepicker__minute-display') as HTMLElement;
                        if (minuteDisplay) {
                            minuteDisplay.textContent = this.currentMinutes.toString().padStart(2, '0');
                        }
                        if (this.clockDialElement && this.clockMode === 'minute') {
                            this.updateClockDial();
                            this.updateClockHand();
                        }
                    } else {
                        // Bloquer si le premier chiffre est invalide (> 5)
                        input.value = '';
                    }
                } else if (value.length === 2) {
                    // Valider que c'est entre 0 et 59
                    if (minute >= 0 && minute <= 59) {
                        input.value = value;
                        this.setMinute(minute);
                    } else {
                        // Si invalide (60-99), garder seulement le premier chiffre si valide
                        const firstDigit = parseInt(value[0], 10);
                        if (firstDigit >= 0 && firstDigit <= 5) {
                            input.value = value[0];
                            this.currentMinutes = firstDigit;
                            // Ne pas appeler setMinute() ici pour éviter le formatage en "05"
                            const minuteDisplay = this.modalElement?.querySelector('.timepicker__minute-display') as HTMLElement;
                            if (minuteDisplay) {
                                minuteDisplay.textContent = this.currentMinutes.toString().padStart(2, '0');
                            }
                            if (this.clockDialElement && this.clockMode === 'minute') {
                                this.updateClockDial();
                                this.updateClockHand();
                            }
                        } else {
                            input.value = '';
                        }
                    }
                }
            }
        });

        this.registerEvent(minuteInput, 'blur', () => {
            // Si l'input est vide, restaurer la valeur actuelle
            if (minuteInput.value.trim() === '') {
                minuteInput.value = this.currentMinutes.toString().padStart(2, '0');
                return;
            }

            const value = parseInt(minuteInput.value, 10);
            if (isNaN(value) || value < 0) {
                minuteInput.value = this.currentMinutes.toString().padStart(2, '0');
            } else if (value > 59) {
                // Corriger si > 59 (par exemple si on tape 60, 61, etc.)
                minuteInput.value = '59';
                this.currentMinutes = 59;
                this.setMinute(59);
            } else {
                // Valeur valide, s'assurer qu'elle est formatée avec 2 chiffres
                minuteInput.value = value.toString().padStart(2, '0');
                this.setMinute(value);
            }
        });

        const minuteLabel = document.createElement('div');
        minuteLabel.className = 'timepicker__input-label';
        minuteLabel.textContent = LocaleManager.t('timepicker.minute');
        minuteWrapper.appendChild(minuteInput);
        minuteWrapper.appendChild(minuteLabel);
        timeDisplay.appendChild(minuteWrapper);

        // Sélecteur AM/PM (toujours présent, désactivé en format 24h selon Material Design 3)
        // Ajouté directement dans timeDisplay pour être à côté des minutes
        this.amPmElement = this.createAmPmSelector();
        timeDisplay.appendChild(this.amPmElement);

        timeContainer.appendChild(timeDisplay);

        container.appendChild(timeContainer);

        return container;
    }

    /**
     * Formate l'heure pour l'affichage (gère le format 12h)
     */
    private formatHourForDisplay(hour: number): string {
        if (this.options.format === '12h') {
            // Convertir de 24h à 12h pour l'affichage
            let displayHour = hour;
            if (hour === 0) {
                displayHour = 12; // 00h devient 12 AM
            } else if (hour > 12) {
                displayHour = hour - 12; // 13-23h devient 1-11 PM
            }
            return displayHour.toString();
        }
        return hour.toString().padStart(2, '0');
    }

    /**
     * Crée le sélecteur AM/PM
     */
    private createAmPmSelector(): HTMLDivElement {
        const container = document.createElement('div');
        container.className = 'timepicker__ampm-selector';

        const amButton = document.createElement('button');
        amButton.className = 'timepicker__ampm-button';
        amButton.type = 'button';
        amButton.textContent = 'AM';
        amButton.setAttribute('data-ampm', 'am');

        const pmButton = document.createElement('button');
        pmButton.className = 'timepicker__ampm-button';
        pmButton.type = 'button';
        pmButton.textContent = 'PM';
        pmButton.setAttribute('data-ampm', 'pm');

        // Désactiver en format 24h selon Material Design 3
        const isDisabled = this.options.format === '24h';
        if (isDisabled) {
            amButton.disabled = true;
            pmButton.disabled = true;
            container.classList.add('timepicker__ampm-selector--disabled');
            setAriaAttribute(amButton, 'disabled', true);
            setAriaAttribute(pmButton, 'disabled', true);
        } else {
            // Déterminer l'état initial
            const isPM = this.get24Hour() >= 12;
            if (isPM) {
                pmButton.classList.add('timepicker__ampm-button--selected');
                setAriaAttribute(pmButton, 'selected', true);
            } else {
                amButton.classList.add('timepicker__ampm-button--selected');
                setAriaAttribute(amButton, 'selected', true);
            }

            this.registerEvent(amButton, 'click', () => {
                this.setAmPm('am');
            });

            this.registerEvent(pmButton, 'click', () => {
                this.setAmPm('pm');
            });
        }

        container.appendChild(amButton);
        container.appendChild(pmButton);

        return container;
    }

    /**
     * Définit AM/PM et ajuste l'heure
     */
    private setAmPm(ampm: 'am' | 'pm'): void {
        if (!this.amPmElement) return;

        const amButton = this.amPmElement.querySelector('[data-ampm="am"]') as HTMLElement;
        const pmButton = this.amPmElement.querySelector('[data-ampm="pm"]') as HTMLElement;

        if (amButton && pmButton) {
            amButton.classList.remove('timepicker__ampm-button--selected');
            pmButton.classList.remove('timepicker__ampm-button--selected');
            removeAriaAttribute(amButton, 'selected');
            removeAriaAttribute(pmButton, 'selected');

            if (ampm === 'am') {
                amButton.classList.add('timepicker__ampm-button--selected');
                setAriaAttribute(amButton, 'selected', true);
                // Convertir en AM (0-11h)
                if (this.currentHours === 12) {
                    // 12 PM → 0 AM (minuit)
                    this.currentHours = 0;
                } else if (this.currentHours >= 13 && this.currentHours <= 23) {
                    // 13-23h → 1-11h (soustraire 12)
                    this.currentHours = this.currentHours - 12;
                }
                // Si déjà entre 0-11, ne rien faire
            } else {
                pmButton.classList.add('timepicker__ampm-button--selected');
                setAriaAttribute(pmButton, 'selected', true);
                // Convertir en PM (12-23h)
                if (this.currentHours >= 0 && this.currentHours <= 11) {
                    // 0-11h → 12-23h (ajouter 12)
                    this.currentHours = this.currentHours + 12;
                }
                // Si déjà 12 ou entre 13-23, ne rien faire
            }

            // Mettre à jour selectedTime
            if (this.selectedTime) {
                this.selectedTime.hours = this.currentHours;
            }

            this.updateClockDial();
            this.updateClockHand();
            this.updateTimeDisplay();
        }
    }

    /**
     * Récupère l'heure au format 24h
     * @description currentHours est toujours stocké en format 24h (0-23), donc on retourne simplement currentHours
     */
    private get24Hour(): number {
        // currentHours est toujours en format 24h (0-23), donc on retourne directement
        return this.currentHours;
    }

    /**
     * Crée le cadran d'horloge analogique selon Material Design 3
     */
    private createClockDial(): HTMLDivElement {
        const dialContainer = document.createElement('div');
        dialContainer.className = 'timepicker__clock-dial-container';

        const dial = document.createElement('div');
        dial.className = 'timepicker__clock-dial';
        this.clockDialElement = dial;

        // Créer les nombres du cadran pour les heures
        this.clockNumbersHourElement = document.createElement('div');
        this.clockNumbersHourElement.className = 'timepicker__clock-numbers timepicker__clock-numbers--hours';
        this.createHourNumbers();
        dial.appendChild(this.clockNumbersHourElement);

        // Créer les nombres du cadran pour les minutes
        this.clockNumbersMinuteElement = document.createElement('div');
        this.clockNumbersMinuteElement.className = 'timepicker__clock-numbers timepicker__clock-numbers--minutes timepicker__clock-numbers--out';
        this.clockNumbersMinuteElement.style.visibility = 'hidden';
        this.createMinuteNumbers();
        dial.appendChild(this.clockNumbersMinuteElement);

        // Créer l'aiguille
        this.clockHandElement = document.createElement('div');
        this.clockHandElement.className = 'timepicker__clock-hand';
        dial.appendChild(this.clockHandElement);

        // Créer le cercle selector container au bout de l'aiguille
        this.clockHandEndElement = document.createElement('div');
        this.clockHandEndElement.className = 'timepicker__clock-hand-end';

        // Créer l'élément texte pour afficher le nombre sélectionné dans le cercle
        const handEndNumber = document.createElement('span');
        handEndNumber.className = 'timepicker__clock-hand-end-number';
        this.clockHandEndNumberElement = handEndNumber;
        this.clockHandEndElement.appendChild(handEndNumber);

        dial.appendChild(this.clockHandEndElement);

        // Point central
        const centerDot = document.createElement('div');
        centerDot.className = 'timepicker__clock-center';
        dial.appendChild(centerDot);

        // Gérer les clics sur le cadran pour sélectionner l'heure
        this.registerEvent(dial, 'click', (e) => {
            this.handleClockDialClick(e);
        });

        this._unbindClockDialDrag?.();
        this._unbindClockDialDrag = bindPointerDown(dial, (e) => this.handleClockDialDragStart(e));

        dialContainer.appendChild(dial);

        // Le positionnement du cercle sera géré par updateClockHand() après que le modal soit complètement rendu
        // Ne pas positionner ici car le modal n'est pas encore dans le DOM

        return dialContainer;
    }

    /**
     * Crée les nombres pour le mode heures
     * @description Utilise la même logique que React Native Paper Dates pour le positionnement précis
     */
    private createHourNumbers(): void {
        if (!this.clockNumbersHourElement) return;

        // Vider le contenu existant
        this.clockNumbersHourElement.innerHTML = '';

        const is24Hour = this.options.format === '24h';
        const circleSize = Timepicker.CIRCLE_SIZE;

        // Calculer les positions pour l'anneau extérieur (12h format)
        const outerRange = this.getHourNumbers(false, circleSize, 12, 12);
        outerRange.forEach((coords, i) => {
            const hourValue = i + 1 === 12 ? 12 : i + 1;
            const hourText = is24Hour && i + 1 === 12 ? '00' : (i + 1).toString();
            const number = this.createClockNumberFromCoords(hourText, hourValue, 'outer', coords[0], coords[1]);
            if (this.clockNumbersHourElement) {
                this.clockNumbersHourElement.appendChild(number);
            }
        });

        // Pour le format 24h, ajouter l'anneau intérieur (13-23)
        if (is24Hour) {
            const innerRange = this.getHourNumbers(true, circleSize, 12, 12);
            innerRange.forEach((coords, i) => {
                const hourValue = i + 13 === 24 ? 12 : i + 13;
                const hourText = i + 13 === 24 ? '12' : (i + 13).toString();
                const number = this.createClockNumberFromCoords(hourText, hourValue, 'inner', coords[0], coords[1]);
                if (this.clockNumbersHourElement) {
                    this.clockNumbersHourElement.appendChild(number);
                }
            });
        }
    }

    /**
     * Calcule les positions des nombres d'heures sur le cadran
     * @description Inspiré de React Native Paper Dates - getHourNumbers
     * @param is24Hour Si true, calcule pour l'anneau intérieur (24h), sinon anneau extérieur (12h)
     * @param size Taille du cercle
     * @param count Nombre de positions (12)
     * @param arrayLength Longueur du tableau (12)
     * @returns Tableau de coordonnées [x, y]
     */
    private getHourNumbers(is24Hour: boolean, size: number, count: number, arrayLength: number): number[][] {
        let angle = 0;
        const step = (2 * Math.PI) / count;
        // Rayon selon le format : intérieur pour 24h, extérieur pour 12h
        const radius = size / (is24Hour ? 4 : 2.5);

        // Commencer à -90° (haut) + 30° (première position)
        angle = (-90 * Math.PI) / 180 + Math.PI / 6;

        return Array(arrayLength)
            .fill(true)
            .map(() => {
                const x = Math.round(size / 2 + radius * Math.cos(angle));
                const y = Math.round(size / 2 + radius * Math.sin(angle));
                angle += step;
                return [x, y];
            });
    }

    /**
     * Crée les nombres pour le mode minutes
     * @description Utilise la même logique que React Native Paper Dates pour le positionnement précis
     */
    private createMinuteNumbers(): void {
        if (!this.clockNumbersMinuteElement) return;

        // Vider le contenu existant
        this.clockNumbersMinuteElement.innerHTML = '';

        const circleSize = Timepicker.CIRCLE_SIZE;
        const range = this.getMinuteNumbers(circleSize, 12);

        range.forEach((coords, i) => {
            const currentMinutes = i * 5;
            const minuteText = currentMinutes === 0 ? '00' : currentMinutes.toString();
            const number = this.createClockNumberFromCoords(minuteText, currentMinutes, 'outer', coords[0], coords[1]);
            if (this.clockNumbersMinuteElement) {
                this.clockNumbersMinuteElement.appendChild(number);
            }
        });
    }

    /**
     * Calcule les positions des nombres de minutes sur le cadran
     * @description Inspiré de React Native Paper Dates - getMinuteNumbers
     * @param size Taille du cercle
     * @param count Nombre de positions (12)
     * @returns Tableau de coordonnées [x, y]
     */
    private getMinuteNumbers(size: number, count: number): number[][] {
        let angle = 0;
        const step = (2 * Math.PI) / count;
        const radius = size / 2.5;

        // Commencer à -90° (haut)
        angle = (-90 * Math.PI) / 180;

        return Array(12)
            .fill(true)
            .map(() => {
                const x = Math.round(size / 2 + radius * Math.cos(angle));
                const y = Math.round(size / 2 + radius * Math.sin(angle));
                angle += step;
                return [x, y];
            });
    }

    /**
     * Convertit une minute (0-59) en position horaire (1-12)
     * @description Selon l'ordre : ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']
     * minute 0 = position 1, minute 5 = position 2, etc.
     */
    private minuteToPosition(minute: number): number {
        // Arrondir à la valeur la plus proche (0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55)
        const roundedMinute = Math.round(minute / 5) * 5;
        // Convertir en position : 0 = position 1, 5 = position 2, 10 = position 3, etc.
        const position = (roundedMinute / 5) + 1;
        return position > 12 ? 12 : (position < 1 ? 1 : position);
    }

    /**
     * Convertit une position horaire (1-12) en minute (0, 5, 10, 15, etc.)
     * @description Selon l'ordre : position 1 = minute 0, position 2 = minute 5, etc.
     */
    private positionToMinute(position: number): number {
        // position 1 = minute 0, position 2 = minute 5, etc.
        return (position - 1) * 5;
    }

    // ============================================================================
    // UTILITAIRES DE CALCUL D'ANGLES
    // ============================================================================

    /**
     * Normalise un angle entre 0° et 360°
     * @param angle Angle à normaliser
     * @returns Angle normalisé entre 0° et 360°
     */
    private normalizeAngle0To360(angle: number): number {
        let normalized = angle;
        if (normalized < 0) {
            normalized = normalized + 360;
        }
        if (normalized >= 360) {
            normalized = normalized - 360;
        }
        return normalized;
    }

    /**
     * Normalise un angle entre -180° et 180°
     * @param angle Angle à normaliser
     * @returns Angle normalisé entre -180° et 180°
     */
    private normalizeAngleMinus180To180(angle: number): number {
        let normalized = angle;
        if (normalized > 180) {
            normalized = normalized - 360;
        } else if (normalized < -180) {
            normalized = normalized + 360;
        }
        return normalized;
    }

    /**
     * Convertit une position (1-12) en angle pour le cadran
     * @param position Position sur le cadran (1-12, où 1 = 12h en haut)
     * @returns Angle en degrés normalisé entre -180° et 180°
     */
    private positionToAngle(position: number): number {
        // Formule : angle = (position - 4) * 30
        // Position 1 (12h en haut) = -90°, position 4 (3h à droite) = 0°, etc.
        const angle = (position - 4) * Timepicker.ANGLE_PER_POSITION;
        return this.normalizeAngleMinus180To180(angle);
    }

    /**
     * Convertit un angle normalisé (0-360°) en position (1-12)
     * @param angle Angle en degrés (0° = haut, 90° = droite, 180° = bas, 270° = gauche)
     * @returns Position sur le cadran (1-12)
     */
    private angleToPosition(angle: number): number {
        // Formule : position = (angle / 30) + 1
        let position = Math.round((angle / Timepicker.ANGLE_PER_POSITION) + 1);
        // Normaliser entre 1 et 12
        if (position < 1) position = position + 12;
        if (position > 12) position = position - 12;
        return position;
    }

    /**
     * Convertit un angle Math.atan2 en angle de cadran (0° = haut)
     * @param atan2Angle Angle retourné par Math.atan2 (0° = droite, 90° = bas, -90° = haut)
     * @returns Angle normalisé entre 0° et 360° (0° = haut)
     */
    private atan2ToClockAngle(atan2Angle: number): number {
        // Math.atan2 : 0° = droite, 90° = bas, -90° = haut, 180° = gauche
        // On veut : 0° = haut, 90° = droite, 180° = bas, 270° = gauche
        // Conversion : ajouter 90° pour que -90° devienne 0°
        return this.normalizeAngle0To360(atan2Angle + 90);
    }

    /**
     * Convertit une minute (0-59) en angle pour le cadran
     * @param minute Minute (0-59)
     * @returns Angle normalisé entre 0° et 360° (0° = minute 0, 90° = minute 15, etc.)
     */
    private minuteToAngle(minute: number): number {
        // Formule : angle = minute * 6
        return this.normalizeAngle0To360(minute * Timepicker.ANGLE_PER_MINUTE);
    }

    /**
     * Convertit un angle normalisé (0-360°) en minute (0-59)
     * @param angle Angle en degrés (0° = minute 0, 90° = minute 15, etc.)
     * @returns Minute (0-59)
     */
    private angleToMinute(angle: number): number {
        // Formule : minute = angle / 6
        let minute = Math.round(angle / Timepicker.ANGLE_PER_MINUTE);
        // Normaliser entre 0 et 59
        if (minute < 0) minute = minute + 60;
        if (minute >= 60) minute = minute - 60;
        return minute;
    }

    /**
     * Calcule la distance entre deux points
     * @param x1 Coordonnée X du premier point
     * @param y1 Coordonnée Y du premier point
     * @param x2 Coordonnée X du deuxième point
     * @param y2 Coordonnée Y du deuxième point
     * @returns Distance entre les deux points
     */
    private calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    /**
     * Détermine si un point est sur l'anneau intérieur (24h format)
     * @param distance Distance du point au centre
     * @returns true si le point est sur l'anneau intérieur
     */
    private isInnerRing(distance: number): boolean {
        return distance < Timepicker.RING_SEPARATION_RADIUS;
    }

    /**
     * Calcule l'angle pour la rotation CSS en évitant les sauts autour de 180° et 0°/360°
     * @param targetAngle Angle cible (0-360°)
     * @param previousAngle Angle précédent (0-360° ou null)
     * @returns Angle pour CSS (peut être négatif si > 180°)
     */
    private calculateCSSAngle(targetAngle: number, previousAngle: number | null): number {
        if (previousAngle === null) {
            // Première fois : convertir si > 180° pour éviter les sauts initiaux
            if (targetAngle > 180) {
                return targetAngle - 360;
            }
            return targetAngle;
        }

        // Calculer l'angle CSS précédent (peut être négatif si > 180°)
        let previousCSSAngle = previousAngle;
        if (previousCSSAngle > 180) {
            previousCSSAngle = previousCSSAngle - 360;
        }

        // Calculer la différence d'angle pour CSS
        let cssDiff = targetAngle - previousAngle;

        // Détecter le passage par 0°/360° pour CSS
        const isCrossingZeroCSS = (previousAngle > 270 && targetAngle < 90) ||
            (previousAngle < 90 && targetAngle > 270);

        if (isCrossingZeroCSS) {
            // Passage par 0°/360° : calculer la différence correcte
            if (previousAngle > 270 && targetAngle < 90) {
                // Passage de 270°-360° à 0°-90° : rotation horaire
                cssDiff = (360 - previousAngle) + targetAngle;
            } else {
                // Passage de 0°-90° à 270°-360° : rotation inverse (ne devrait pas arriver)
                cssDiff = targetAngle - (previousAngle + 360);
            }
        } else {
            // Normaliser la différence
            if (cssDiff > 180) {
                cssDiff = cssDiff - 360;
            } else if (cssDiff < -180) {
                cssDiff = cssDiff + 360;
            }
        }

        // Calculer le nouvel angle CSS en ajoutant la différence à l'angle CSS précédent
        return previousCSSAngle + cssDiff;
    }

    /**
     * Calcule l'angle de rotation horaire en évitant les rotations inverses
     * @param targetAngle Angle cible (0-360°)
     * @param previousAngle Angle précédent (0-360° ou null)
     * @returns Angle normalisé entre 0° et 360° (toujours dans le sens horaire)
     */
    private calculateClockwiseAngle(targetAngle: number, previousAngle: number | null): number {
        if (previousAngle === null) {
            return this.normalizeAngle0To360(targetAngle);
        }

        // Calculer la différence d'angle
        let diff = targetAngle - previousAngle;

        // Détecter le passage par 0°/360°
        const isCrossingZero = (previousAngle > 270 && targetAngle < 90) ||
            (previousAngle < 90 && targetAngle > 270);

        if (isCrossingZero) {
            // Passage par 0°/360° détecté
            if (previousAngle > 270 && targetAngle < 90) {
                // Passage de 270°-360° à 0°-90° : rotation horaire
                diff = (360 - previousAngle) + targetAngle;
            } else {
                // Passage de 0°-90° à 270°-360° : rotation inverse (ne devrait pas arriver)
                diff = targetAngle - (previousAngle + 360);
            }
        } else {
            // Normaliser la différence
            if (diff > 180) {
                diff = diff - 360;
            } else if (diff < -180) {
                diff = diff + 360;
            }
        }

        // Toujours aller dans le sens des aiguilles d'une montre
        if (diff < 0) {
            // Rotation inverse détectée : faire un tour complet dans le sens horaire
            return this.normalizeAngle0To360(previousAngle + (diff + 360));
        } else {
            // Rotation dans le sens horaire : utiliser la différence normale
            return this.normalizeAngle0To360(previousAngle + diff);
        }
    }

    /**
     * Crée un nombre sur le cadran à partir de coordonnées précises
     * @description Utilise les coordonnées calculées directement (méthode React Native)
     * @param text Texte à afficher (ex: '12', '1', '00', '05')
     * @param value Valeur numérique (ex: 12, 1, 0, 5)
     * @param ring Type d'anneau ('outer' ou 'inner')
     * @param x Coordonnée X absolue depuis le coin supérieur gauche
     * @param y Coordonnée Y absolue depuis le coin supérieur gauche
     */
    private createClockNumberFromCoords(text: string, value: number, ring: 'outer' | 'inner', x: number, y: number): HTMLButtonElement {
        const number = document.createElement('button');
        number.className = `timepicker__clock-number timepicker__clock-number--${ring}`;
        number.type = 'button';
        number.textContent = text;
        number.setAttribute('data-value', value.toString());
        number.setAttribute('data-ring', ring); // Ajouter l'attribut pour distinguer les anneaux

        // Convertir les coordonnées absolues en coordonnées relatives au centre (50% + offset)
        // Le cercle fait CIRCLE_SIZE (296px), donc le centre est à 148px
        const center = Timepicker.CIRCLE_SIZE / 2;
        const offsetX = x - center;
        const offsetY = y - center;

        number.style.left = `calc(50% + ${offsetX}px)`;
        number.style.top = `calc(50% + ${offsetY}px)`;
        number.style.transform = 'translate(-50%, -50%)';

        // Continuer avec le reste de la logique...

        // Vérifier si c'est la valeur sélectionnée
        let isSelected = false;
        if (this.clockMode === 'hour') {
            if (this.options.format === '24h' && ring === 'inner') {
                isSelected = value === this.currentHours;
            } else if (ring === 'outer') {
                const displayHour = this.currentHours === 0 ? 12 : (this.currentHours > 12 ? this.currentHours - 12 : this.currentHours);
                isSelected = value === displayHour;
            }
        } else {
            // Mode minutes : utiliser la minute EXACTE (0-59) sans arrondir
            isSelected = value === this.currentMinutes;
        }

        if (isSelected) {
            setAriaAttribute(number, 'selected', true);
        }

        this.registerEvent(number, 'click', () => {
            if (this.clockMode === 'hour') {
                this.selectHourFromDial(value);
                // selectHourFromDial passe déjà automatiquement aux minutes
            } else {
                this.setMinute(value);
            }
        });

        setAriaAttribute(number, 'label', this.clockMode === 'hour' ? `Heure ${value}` : `Minute ${value}`);

        return number;
    }

    /**
     * Sélectionne une heure depuis le cadran
     */
    private selectHourFromDial(hour: number): void {
        if (this.clockMode === 'hour') {
            if (this.options.format === '12h') {
                // En mode 12h, on garde l'heure telle quelle et on ajuste selon AM/PM
                this.currentHours = hour;
                // Si on était en PM et qu'on sélectionne une heure < 12, on reste en PM
                // Si on était en AM et qu'on sélectionne 12, on passe à minuit
                if (this.amPmElement) {
                    const pmButton = this.amPmElement.querySelector('[data-ampm="pm"]') as HTMLElement;
                    const isPM = pmButton?.classList.contains('timepicker__ampm-button--selected');
                    if (isPM && hour < 12) {
                        this.currentHours = hour + 12;
                    } else if (!isPM && hour === 12) {
                        this.currentHours = 0;
                    }
                }
            } else {
                // En mode 24h, la valeur sélectionnée est directement l'heure 24h
                this.currentHours = hour;
            }
            this.updateClockDial();
            this.updateClockHand();
            this.updateTimeDisplay();

            // Passer automatiquement aux minutes après sélection d'une heure
            this.showView('minute');
        }
    }

    /**
     * Affiche la vue heures ou minutes avec transition
     * Inspiré de MaterializeWeb
     */
    private showView(view: 'hour' | 'minute', delay: number | null = null): void {
        const isHours = view === 'hour';
        const nextView = isHours ? this.clockNumbersHourElement : this.clockNumbersMinuteElement;
        const hideView = isHours ? this.clockNumbersMinuteElement : this.clockNumbersHourElement;

        if (!nextView || !hideView) return;

        this.clockMode = view;

        // Réinitialiser l'angle précédent lors de la bascule pour éviter les rotations inverses
        this.lastHandAngle = null;

        // Transition : ajouter la classe "out" à la vue à cacher
        hideView.classList.add('timepicker__clock-numbers--out');

        // Afficher la vue suivante
        nextView.style.visibility = 'visible';
        nextView.classList.remove('timepicker__clock-numbers--out');

        // Mettre à jour le cadran et l'aiguille immédiatement
        this.updateClockDial();

        // Réinitialiser l'aiguille avec transition
        // resetClockHand appellera updateClockHand qui repositionnera la bulle correctement
        // Mais seulement si on change de vue, pas lors de l'ouverture initiale
        if (delay !== null) {
            this.resetClockHand(delay);
        } else {
            // Pas de transition : mettre à jour immédiatement
            this.updateClockHand();
        }

        // Après la transition, cacher complètement la vue précédente
        if (this.toggleViewTimer) {
            clearTimeout(this.toggleViewTimer);
        }
        this.toggleViewTimer = setTimeout(() => {
            hideView.style.visibility = 'hidden';
        }, 350); // Durée de transition

        // Mettre à jour l'affichage
        this.updateTimeDisplay();
    }

    /**
     * Réinitialise l'aiguille avec transition d'opacité
     * Inspiré de MaterializeWeb
     */
    private resetClockHand(delay: number | null = null): void {
        if (!this.clockHandElement || !this.clockDialElement) return;

        if (delay) {
            // Ajouter la classe pour réduire l'opacité pendant la transition
            this.clockHandElement.classList.add('timepicker__clock-hand--out');
            if (this.clockHandEndElement) {
                this.clockHandEndElement.classList.add('timepicker__clock-hand-end--out');
            }
            const center = this.clockDialElement.querySelector('.timepicker__clock-center') as HTMLElement;
            if (center) {
                center.classList.add('timepicker__clock-center--out');
            }

            setTimeout(() => {
                this.clockHandElement?.classList.remove('timepicker__clock-hand--out');
                if (this.clockHandEndElement) {
                    this.clockHandEndElement.classList.remove('timepicker__clock-hand-end--out');
                }
                const center = this.clockDialElement?.querySelector('.timepicker__clock-center') as HTMLElement;
                center?.classList.remove('timepicker__clock-center--out');
                this.updateClockHand();
            }, delay);
        } else {
            this.updateClockHand();
        }
    }

    /**
     * Gère les clics sur le cadran
     * @description Convertit la position du clic en position d'horloge (1-12)
     */
    private handleClockDialClick(e: MouseEvent): void {
        if (!this.clockDialElement) return;

        const rect = this.clockDialElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const x = e.clientX - centerX;
        const y = e.clientY - centerY;

        // Convertir les coordonnées en angle de cadran
        const atan2Angle = Math.atan2(y, x) * (180 / Math.PI);
        const angle = this.atan2ToClockAngle(atan2Angle);
        const position = this.angleToPosition(angle);

        if (this.clockMode === 'hour') {
            // Convertir la position en heure selon le format
            // Ordre : position 1 = '12' (12h), position 2 = '1' (1h), position 3 = '2' (2h), ..., position 12 = '11' (11h)
            if (this.options.format === '24h') {
                // En mode 24h, on doit déterminer si on clique sur l'anneau extérieur ou intérieur
                const distance = this.calculateDistance(e.clientX, e.clientY, centerX, centerY);

                // IMPORTANT : La logique doit correspondre EXACTEMENT à createHourNumbers
                // Anneau extérieur : i=11 → position 1 → hourValue=12 (hourText='00') = 0h
                // Anneau intérieur : i=11 → position 1 → hourValue=12 (hourText='12') = 12h
                if (this.isInnerRing(distance)) {
                    // Anneau intérieur : position 1 = '12' (12h), position 2 = '13' (13h), ..., position 12 = '23' (23h)
                    const hour = position === 1 ? 12 : position + 11;
                    this.selectHourFromDial(hour);
                } else {
                    // Anneau extérieur : position 1 = '00' (0h), position 2 = '1' (1h), ..., position 12 = '11' (11h)
                    const hour = position === 1 ? 0 : position - 1;
                    this.selectHourFromDial(hour);
                }
            } else {
                // Mode 12h : position 1 = '12' (12h), position 2 = '1' (1h), ..., position 12 = '11' (11h)
                const hour = position === 1 ? 12 : position - 1;
                this.selectHourFromDial(hour);
            }
        } else {
            // Mode minutes : calculer la minute exacte depuis l'angle (0-59)
            const minute = this.angleToMinute(angle);
            this.setMinute(minute);
        }
    }

    /**
     * Gère le début du drag sur le cadran
     */
    private handleClockDialDragStart(e: PointerLikeEvent): void {
        if (!this.clockDialElement) return;

        if (e instanceof Event) {
            e.preventDefault();
        }
        this._isDragging = true;
        let isDragging = true;
        let lastHour: number | null = null;

        const handleMove = (moveEvent: PointerLikeEvent) => {
            if (!isDragging || !this.clockDialElement || !this.clockHandElement) return;

            const coords = getPointerCoords(moveEvent);
            const rect = this.clockDialElement.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const x = coords.x - centerX;
            const y = coords.y - centerY;

            // Calculer l'angle et le rayon directement à partir des coordonnées de la souris
            const atan2Angle = Math.atan2(y, x) * (180 / Math.PI);
            const angle = this.atan2ToClockAngle(atan2Angle);
            const distance = Math.sqrt(x * x + y * y);

            // Déterminer le rayon selon le mode et le format
            let radius: number;
            if (this.clockMode === 'hour' && this.options.format === '24h') {
                // En mode 24h, déterminer si on est sur l'anneau intérieur ou extérieur
                radius = this.isInnerRing(distance) ? Timepicker.INNER_RING_RADIUS : Timepicker.OUTER_RING_RADIUS;
            } else {
                radius = Timepicker.OUTER_RING_RADIUS;
            }

            if (this.clockMode === 'hour') {
                // Pour les heures, convertir l'angle en position puis en heure selon le format
                const position = this.angleToPosition(angle);

                // Convertir la position en heure selon le format
                // IMPORTANT : La logique doit correspondre EXACTEMENT à createHourNumbers
                // Anneau extérieur : i=0 → hourValue=1, i=1 → hourValue=2, ..., i=10 → hourValue=11, i=11 → hourValue=12 (hourText='00' en 24h)
                // Anneau intérieur : i=0 → hourValue=13, i=1 → hourValue=14, ..., i=10 → hourValue=23, i=11 → hourValue=12 (hourText='12')
                let hour: number;
                if (this.options.format === '24h') {
                    if (this.isInnerRing(distance)) {
                        // Anneau intérieur : position 1 = '12' (12h), position 2 = '13' (13h), ..., position 12 = '23' (23h)
                        // i=0 → position 2 → hourValue=13, i=11 → position 1 → hourValue=12
                        hour = position === 1 ? 12 : position + 11;
                    } else {
                        // Anneau extérieur : position 1 = '00' (0h), position 2 = '1' (1h), ..., position 12 = '11' (11h)
                        // i=0 → position 2 → hourValue=1, i=11 → position 1 → hourValue=12 (mais hourText='00')
                        hour = position === 1 ? 0 : position - 1;
                    }
                } else {
                    // Mode 12h : position 1 = '12' (12h), position 2 = '1' (1h), ..., position 12 = '11' (11h)
                    hour = position === 1 ? 12 : position - 1;
                }

                // Ne changer l'heure que si elle est différente de la précédente (effet haptic)
                if (lastHour === null || lastHour !== hour) {
                    lastHour = hour;
                    // Mettre à jour l'heure directement sans passer par selectHourFromDialWithHaptic
                    // pour éviter les conflits de méthode
                    if (this.options.format === '12h') {
                        this.currentHours = hour;
                        if (this.amPmElement) {
                            const pmButton = this.amPmElement.querySelector('[data-ampm="pm"]') as HTMLElement;
                            const isPM = pmButton?.classList.contains('timepicker__ampm-button--selected');
                            if (isPM && hour < 12) {
                                this.currentHours = hour + 12;
                            } else if (!isPM && hour === 12) {
                                this.currentHours = 0;
                            }
                        }
                    } else {
                        this.currentHours = hour;
                    }

                    // Mettre à jour l'aiguille avec la MÊME méthode que updateClockHand
                    this.updateClockHand();
                    this.updateClockDial();
                    this.updateTimeDisplay();
                }
            } else {
                // Mode minutes : utiliser la minute EXACTE (0-59) sans arrondir
                const minute = this.angleToMinute(angle);
                if (this.currentMinutes !== minute) {
                    this.currentMinutes = minute;
                    // Mettre à jour l'aiguille avec la MÊME méthode que updateClockHand
                    this.updateClockHand();
                    this.updateClockDial();
                    this.updateTimeDisplay();
                }
            }
        };

        const handleEnd = (): void => {
            isDragging = false;
            this._isDragging = false;
            lastHour = null;
            this._clockDialDragCleanup = null;
            this.updateClockHand();
        };

        const pointerId = e instanceof PointerEvent ? e.pointerId : 0;
        this._clockDialDragCleanup?.();
        this._clockDialDragCleanup = startPointerDragSession({
            captureElement: this.clockDialElement,
            pointerId,
            onMove: handleMove,
            onEnd: handleEnd,
            preventDefaultOnMove: true,
        });
    }

    /**
     * Sélectionne une heure depuis le cadran avec effet haptic
     * @description Version avec effet haptic pour le drag
     */
    private selectHourFromDialWithHaptic(hour: number): void {
        if (this.clockMode === 'hour') {
            if (this.options.format === '12h') {
                // En mode 12h, on garde l'heure telle quelle et on ajuste selon AM/PM
                this.currentHours = hour;
                // Si on était en PM et qu'on sélectionne une heure < 12, on reste en PM
                // Si on était en AM et qu'on sélectionne 12, on passe à minuit
                if (this.amPmElement) {
                    const pmButton = this.amPmElement.querySelector('[data-ampm="pm"]') as HTMLElement;
                    const isPM = pmButton?.classList.contains('timepicker__ampm-button--selected');
                    if (isPM && hour < 12) {
                        this.currentHours = hour + 12;
                    } else if (!isPM && hour === 12) {
                        this.currentHours = 0;
                    }
                }
            } else {
                // En mode 24h, la valeur sélectionnée est directement l'heure 24h
                this.currentHours = hour;
            }

            // Effet haptic : animation du sélecteur
            this._applyHapticEffect();

            this.updateClockDial();
            // TOUJOURS appeler updateClockHand pour garantir la synchronisation
            this.updateClockHand();
            this.updateTimeDisplay();
        }
    }

    /**
     * Applique un effet haptic lors du changement d'heure
     * @description Animation visuelle Material Design 3 pour le feedback haptic
     */
    private _applyHapticEffect(): void {
        // Animation haptic Material Design 3 : effet sur l'aiguille
        if (!this.clockHandElement) return;

        // Animation légère sur l'aiguille pour le feedback haptic
        this.clockHandElement.style.transition = 'transform 200ms cubic-bezier(0.05, 0.7, 0.1, 1)';
        const currentTransform = this.clockHandElement.style.transform;
        this.clockHandElement.style.transform = currentTransform + ' scale(1.05)';

        setTimeout(() => {
            if (this.clockHandElement) {
                this.clockHandElement.style.transition = 'transform 250ms cubic-bezier(0.2, 0, 0, 1)';
                this.clockHandElement.style.transform = currentTransform;
            }
        }, 200);
    }

    /**
     * Bascule entre le mode heures et minutes
     */
    private toggleClockMode(): void {
        const newMode = this.clockMode === 'hour' ? 'minute' : 'hour';
        this.showView(newMode);
    }

    /**
     * Met à jour le cadran d'horloge
     */
    private updateClockDial(): void {
        // Ne mettre à jour le dial que si on est en mode dial
        if (this.currentViewMode !== 'dial') return;

        const currentNumbersElement = this.clockMode === 'hour' ? this.clockNumbersHourElement : this.clockNumbersMinuteElement;
        if (!currentNumbersElement) return;

        const numbers = currentNumbersElement.querySelectorAll('.timepicker__clock-number');
        numbers.forEach((num: Element) => {
            const numEl = num as HTMLElement;
            removeAriaAttribute(numEl, 'selected');
        });

        if (this.clockMode === 'hour') {
            let selectedValue: number | null = null;

            if (this.options.format === '24h') {
                // En mode 24h, sélectionner la valeur correspondante (extérieur ou intérieur)
                // IMPORTANT : 00h est sur l'anneau extérieur avec data-value='12' (car hourValue=12 mais hourText='00')
                // IMPORTANT : 12h est sur l'anneau intérieur avec data-value='12' (car hourValue=12 et hourText='12')
                if (this.currentHours === 0) {
                    selectedValue = 12; // Chercher data-value='12' sur l'anneau extérieur
                    const selectedNumber = currentNumbersElement.querySelector(`[data-value="${selectedValue}"][data-ring="outer"]`) as HTMLElement;
                    if (selectedNumber) {
                        setAriaAttribute(selectedNumber, 'selected', true);
                    }
                } else if (this.currentHours === 12) {
                    selectedValue = 12; // Chercher data-value='12' sur l'anneau intérieur
                    const selectedNumber = currentNumbersElement.querySelector(`[data-value="${selectedValue}"][data-ring="inner"]`) as HTMLElement;
                    if (selectedNumber) {
                        setAriaAttribute(selectedNumber, 'selected', true);
                    }
                } else if (this.currentHours > 12) {
                    // 13-23h sont sur l'anneau intérieur
                    selectedValue = this.currentHours;
                    const selectedNumber = currentNumbersElement.querySelector(`[data-value="${selectedValue}"][data-ring="inner"]`) as HTMLElement;
                    if (selectedNumber) {
                        setAriaAttribute(selectedNumber, 'selected', true);
                    }
                } else {
                    // 1-11h sont sur l'anneau extérieur
                    selectedValue = this.currentHours;
                    const selectedNumber = currentNumbersElement.querySelector(`[data-value="${selectedValue}"][data-ring="outer"]`) as HTMLElement;
                    if (selectedNumber) {
                        setAriaAttribute(selectedNumber, 'selected', true);
                    }
                }
                // Ne pas continuer avec le code ci-dessous pour le format 24h
                this.updateClockHand();
                return;
            } else {
                // Mode 12h : sélectionner 1-12
                selectedValue = this.currentHours === 0 ? 12 : (this.currentHours > 12 ? this.currentHours - 12 : this.currentHours);
            }

            const selectedNumber = currentNumbersElement.querySelector(`[data-value="${selectedValue}"]`) as HTMLElement;
            if (selectedNumber) {
                setAriaAttribute(selectedNumber, 'selected', true);
            }
        } else {
            // Mode minutes : utiliser la minute EXACTE (0-59) sans arrondir
            const selectedNumber = currentNumbersElement.querySelector(`[data-value="${this.currentMinutes}"]`) as HTMLElement;
            if (selectedNumber) {
                setAriaAttribute(selectedNumber, 'selected', true);
            }
        }

        this.updateClockHand();
    }

    /**
     * Calcule la position (1-12) depuis l'heure actuelle
     * @returns Position sur le cadran (1-12)
     */
    private calculateHourPosition(): number {
        if (this.options.format === '24h') {
            // En mode 24h, déterminer si on est sur l'anneau intérieur ou extérieur
            if (this.currentHours === 0 || this.currentHours === 12) {
                return 1; // Position 1 pour '00' ou '12'
            } else if (this.currentHours > 12) {
                // Anneau intérieur : heure 13-23 → position 2-12
                return this.currentHours - 11;
            } else {
                // Anneau extérieur : heure 1-11 → position 2-12
                return this.currentHours + 1;
            }
        } else {
            // Mode 12h : position 1 = 12, position 2 = 1, ..., position 12 = 11
            return this.currentHours === 0 || this.currentHours === 12 ? 1 : this.currentHours + 1;
        }
    }

    /**
     * Met à jour la position de l'aiguille
     * @description Positionne l'aiguille selon l'heure ou la minute sélectionnée
     * Suit strictement les spécifications Material Design 3 Expressive
     */
    private updateClockHand(): void {
        // Ne mettre à jour l'aiguille que si on est en mode dial
        if (this.currentViewMode !== 'dial') return;

        if (!this.clockHandElement || !this.clockDialElement) return;

        const currentNumbersElement = this.clockMode === 'hour' ? this.clockNumbersHourElement : this.clockNumbersMinuteElement;
        if (!currentNumbersElement) return;

        const dialRect = this.clockDialElement.getBoundingClientRect();

        // Vérifier que le dial a des dimensions valides
        if (dialRect.width === 0 || dialRect.height === 0) {
            requestAnimationFrame(() => {
                this.updateClockHand();
            });
            return;
        }

        const centerX = dialRect.width / 2;
        const centerY = dialRect.height / 2;

        // Calculer la valeur affichée selon Material Design 3
        let displayedValue: number;
        let radiusForEnd: number = Timepicker.OUTER_RING_RADIUS;

        if (this.clockMode === 'hour') {
            displayedValue = this.currentHours;
            // Déterminer le rayon selon le format Material Design 3
            if (this.options.format === '24h') {
                if (this.currentHours === 0 || this.currentHours > 12) {
                    radiusForEnd = Timepicker.INNER_RING_RADIUS;
                } else {
                    radiusForEnd = Timepicker.OUTER_RING_RADIUS;
                }
            } else {
                radiusForEnd = Timepicker.OUTER_RING_RADIUS;
            }

            // Mettre à jour le texte dans le cercle (sans padding pour les heures)
            if (this.clockHandEndNumberElement) {
                // Pour le dial, afficher les heures sans padding (1, 2, 3... au lieu de 01, 02, 03...)
                const hourText = this.options.format === '24h' && this.currentHours === 0
                    ? '00'
                    : (this.options.format === '24h' && this.currentHours > 12
                        ? this.currentHours.toString()
                        : (this.currentHours === 0 ? '12' : (this.currentHours > 12 ? (this.currentHours - 12).toString() : this.currentHours.toString())));
                this.clockHandEndNumberElement.textContent = hourText;
            }
        } else {
            // Mode minutes : utiliser la minute EXACTE (0-59) sans arrondir
            displayedValue = this.currentMinutes;
            radiusForEnd = Timepicker.OUTER_RING_RADIUS;

            // Mettre à jour le texte dans le cercle
            if (this.clockHandEndNumberElement) {
                this.clockHandEndNumberElement.textContent = this.currentMinutes.toString().padStart(2, '0');
            }
        }

        // Calculer les coordonnées EXACTEMENT comme les nombres sont créés
        // Utiliser la MÊME méthode de calcul (getHourNumbers/getMinuteNumbers) pour garantir la synchronisation
        const circleSize = Timepicker.CIRCLE_SIZE;
        let coords: number[] | null = null;
        let x: number;
        let y: number;
        let angleForCSS: number;
        let actualRadius: number;

        if (this.clockMode === 'hour') {
            // Pour les heures, déterminer l'index dans le tableau et l'anneau
            // IMPORTANT : La logique doit correspondre EXACTEMENT à createHourNumbers
            let index: number;
            let isInner: boolean = false;

            if (this.options.format === '24h') {
                // Anneau extérieur : i=0 → hourValue=1, i=1 → hourValue=2, ..., i=10 → hourValue=11, i=11 → hourValue=12 (mais hourText='00' en 24h)
                // Anneau intérieur : i=0 → hourValue=13, i=1 → hourValue=14, ..., i=11 → hourValue=24 (mais hourValue=12, hourText='12')
                // IMPORTANT : 00h est sur l'anneau extérieur à i=11 (position 12), pas sur l'anneau intérieur !
                if (this.currentHours === 0) {
                    // 00h est à l'index 11 de l'anneau extérieur (position 12, mais hourText='00')
                    index = 11;
                    isInner = false;
                } else if (this.currentHours > 12) {
                    // 13-23h sont sur l'anneau intérieur : index = heure - 13
                    index = this.currentHours - 13;
                    isInner = true;
                } else if (this.currentHours === 12) {
                    // 12h est à l'index 11 de l'anneau extérieur (car i=11 dans forEach)
                    // Mais attendez, dans createHourNumbers : i=0 → hourValue=1, i=11 → hourValue=12
                    // Donc pour 12h, on cherche i où hourValue = 12, c'est i=11
                    // MAIS en 24h, i=11 affiche '00' (minuit), pas '12' !
                    // En fait, 12h n'est pas sur l'anneau extérieur en 24h, il est sur l'anneau intérieur à i=11
                    // Non, regardons createHourNumbers : i=11 de l'anneau intérieur → hourValue=24 → hourValue=12, hourText='12'
                    index = 11;
                    isInner = true; // 12h est sur l'anneau intérieur en 24h
                } else {
                    // 1-11h sont sur l'anneau extérieur : index = heure - 1
                    // i=0 → hourValue=1, i=1 → hourValue=2, ..., i=10 → hourValue=11
                    index = this.currentHours - 1;
                    isInner = false;
                }
            } else {
                // Mode 12h : toutes les heures sont sur l'anneau extérieur
                // i=0 → hourValue=1, i=1 → hourValue=2, ..., i=11 → hourValue=12
                const hour12 = this.currentHours === 0 ? 12 : (this.currentHours > 12 ? this.currentHours - 12 : this.currentHours);
                // Pour 12h, index = 11 (dernier élément)
                // Pour 1-11h, index = heure - 1
                index = hour12 === 12 ? 11 : hour12 - 1;
                isInner = false;
            }

            // Calculer les coordonnées avec la MÊME méthode que createHourNumbers
            const hourCoords = this.getHourNumbers(isInner, circleSize, 12, 12);
            coords = hourCoords[index];
        } else {
            // Pour les minutes, utiliser la minute EXACTE (0-59) sans arrondir
            // Calculer l'angle directement depuis la minute
            const minuteAngle = (this.currentMinutes * 360) / 60; // 0° = 0min, 360° = 60min (revient à 0)
            const angleRad = ((minuteAngle - 90) * Math.PI) / 180; // -90° pour commencer en haut
            const radius = circleSize / 2.5;
            const center = circleSize / 2;
            const x = center + radius * Math.cos(angleRad);
            const y = center + radius * Math.sin(angleRad);
            coords = [Math.round(x), Math.round(y)];
        }

        if (coords) {
            // Convertir les coordonnées absolues (0-296) en coordonnées relatives au centre
            const center = circleSize / 2;
            x = coords[0] - center;
            y = coords[1] - center;

            // Calculer le rayon réel
            actualRadius = Math.sqrt(x * x + y * y);

            // Calculer l'angle depuis les coordonnées
            const atan2Angle = Math.atan2(y, x) * (180 / Math.PI);
            angleForCSS = this.atan2ToClockAngle(atan2Angle);
        } else {
            // Fallback (ne devrait jamais arriver)
            x = 0;
            y = 0;
            actualRadius = radiusForEnd;
            angleForCSS = 0;
        }

        // Positionner le cercle EXACTEMENT comme le nombre (relatif au centre du dial)
        // Les nombres utilisent calc(50% + ${x}px) avec transform: translate(-50%, -50%)
        // Le cercle a déjà transform: translate(-50%, -50%) dans le SCSS, donc on utilise la même formule

        // Positionner l'aiguille selon Material Design 3
        // L'aiguille doit s'étendre exactement jusqu'au centre du cercle selector container
        // Le cercle est positionné à une distance `actualRadius` du centre, donc l'aiguille doit avoir une hauteur de `actualRadius` pixels
        this.lastHandAngle = angleForCSS;
        // Utiliser transform-origin: center bottom pour que l'aiguille parte du centre et s'étende vers le haut
        // translate(-50%, -100%) positionne l'aiguille au centre et l'étend de 100% de sa hauteur vers le haut
        // L'ordre des transformations est important : translate d'abord, puis rotate
        this.clockHandElement.style.transform = `translate(-50%, -100%) rotate(${angleForCSS}deg)`;
        this.clockHandElement.style.transformOrigin = 'center bottom';
        // La hauteur doit être exactement égale au rayon réel pour atteindre le centre du cercle
        // Le cercle est centré sur le point calculé, donc l'aiguille doit s'étendre jusqu'à ce point
        // Avec translate(-50%, -100%) et transform-origin: center bottom, l'aiguille part du centre
        // et s'étend de 100% de sa hauteur vers le haut, donc elle atteint exactement le centre du cercle
        this.clockHandElement.style.height = `${actualRadius}px`;

        // Positionner le cercle selector container au bout de l'aiguille
        // Utiliser la MÊME formule que createClockNumber : calc(50% + ${x}px)
        // Le transform: translate(-50%, -50%) est déjà dans le SCSS
        if (this.clockHandEndElement) {
            this.clockHandEndElement.style.left = `calc(50% + ${x}px)`;
            this.clockHandEndElement.style.top = `calc(50% + ${y}px)`;
        }
    }

    /**
     * Positionne le cercle et l'aiguille à partir d'un angle et d'un rayon
     * @param angle Angle en degrés (0-360°, où 0° = haut selon Material Design 3)
     * @param radius Rayon en pixels
     * @description Utilise EXACTEMENT la même formule que updateClockHand pour garantir une synchronisation parfaite
     */
    private positionClockHandFromAngle(angle: number, radius: number): void {
        if (!this.clockHandElement || !this.clockDialElement) return;

        // Normaliser l'angle Material Design 3 (0-360°, 0° = haut)
        const angleNormalized = this.normalizeAngle0To360(angle);

        // Convertir l'angle Material Design 3 (0-360°) en angle Math (-180° à 180°)
        // Dans updateClockHand: angleForCSS = normalizeAngle0To360(angle + 90)
        // Donc angle = angleForCSS - 90, normalisé entre -180° et 180°
        // Cette conversion doit être EXACTEMENT l'inverse de celle dans updateClockHand
        let angleMath = angleNormalized - 90;
        angleMath = this.normalizeAngleMinus180To180(angleMath);

        // Utiliser EXACTEMENT la même formule que updateClockHand pour calculer x et y
        // Math.cos et Math.sin utilisent un système où 0° = droite, 90° = bas, -90° = haut, 180° = gauche
        const angleRad = (angleMath * Math.PI) / 180;
        const x = Math.cos(angleRad) * radius;
        const y = Math.sin(angleRad) * radius;

        // Positionner l'aiguille avec EXACTEMENT le même angle CSS que dans updateClockHand
        // L'angle CSS doit être l'angle Material Design 3 (0-360°, 0° = haut)
        this.lastHandAngle = angleNormalized;
        this.clockHandElement.style.transform = `translate(-50%, -100%) rotate(${angleNormalized}deg)`;
        this.clockHandElement.style.transformOrigin = 'center bottom';
        this.clockHandElement.style.height = `${radius}px`;

        // Positionner le cercle selector container au bout de l'aiguille
        // Utiliser EXACTEMENT la MÊME formule que updateClockHand : calc(50% + ${x}px)
        // Le transform: translate(-50%, -50%) est déjà dans le SCSS
        if (this.clockHandEndElement) {
            this.clockHandEndElement.style.left = `calc(50% + ${x}px)`;
            this.clockHandEndElement.style.top = `calc(50% + ${y}px)`;
        }
    }

    /**
     * Met à jour l'affichage de l'heure
     */
    private updateTimeDisplay(): void {
        if (!this.modalElement) return;

        if (this.currentViewMode === 'dial') {
            // Mettre à jour l'affichage dans le modal dial
            const hourDisplay = this.modalElement.querySelector('.timepicker__hour-display') as HTMLElement;
            const minuteDisplay = this.modalElement.querySelector('.timepicker__minute-display') as HTMLElement;

            if (hourDisplay) {
                hourDisplay.textContent = this.formatHourForDisplay(this.currentHours);
                // Mettre en évidence si on est en mode heures
                if (this.clockMode === 'hour') {
                    hourDisplay.classList.add('timepicker__hour-display--active');
                } else {
                    hourDisplay.classList.remove('timepicker__hour-display--active');
                }
            }

            if (minuteDisplay) {
                minuteDisplay.textContent = this.currentMinutes.toString().padStart(2, '0');
                // Mettre en évidence si on est en mode minutes
                if (this.clockMode === 'minute') {
                    minuteDisplay.classList.add('timepicker__minute-display--active');
                } else {
                    minuteDisplay.classList.remove('timepicker__minute-display--active');
                }
            }
        } else {
            // Mettre à jour les inputs dans le mode input
            if (this.inputHourElement) {
                // Ne pas ajouter AM/PM dans l'input de la version input (le sélecteur AM/PM est à côté)
                this.inputHourElement.value = this.formatHourForDisplay(this.currentHours);
                if (this.clockMode === 'hour') {
                    this.inputHourElement.classList.add('timepicker__input-hour--active');
                } else {
                    this.inputHourElement.classList.remove('timepicker__input-hour--active');
                }
            }

            if (this.inputMinuteElement) {
                this.inputMinuteElement.value = this.currentMinutes.toString().padStart(2, '0');
                if (this.clockMode === 'minute') {
                    this.inputMinuteElement.classList.add('timepicker__input-minute--active');
                } else {
                    this.inputMinuteElement.classList.remove('timepicker__input-minute--active');
                }
            }
        }
    }


    /**
     * Crée le footer avec les boutons d'action
     */
    private createFooter(): HTMLDivElement | null {
        const footer = document.createElement('div');
        footer.className = 'timepicker__footer';

        // Bouton de basculement dial/input
        const toggleButton = document.createElement('button');
        toggleButton.className = 'timepicker__toggle-view';
        toggleButton.type = 'button';
        setAriaAttribute(toggleButton, 'label', this.currentViewMode === 'dial' ? 'Passer en mode saisie' : 'Passer en mode cadran');

        const iconElement = document.createElement('i');
        iconElement.className = 'k3ui-icon';
        // Utiliser 'keyboard' pour représenter le clavier (mode input)
        // ou 'clock' pour le cadran (mode dial)
        iconElement.setAttribute('name', this.currentViewMode === 'dial' ? 'keyboard' : 'clock');
        toggleButton.appendChild(iconElement);

        // Utiliser setTimeout pour s'assurer que l'icône est dans le DOM avant de l'initialiser
        setTimeout(() => {
            IconManager.updateIcon(iconElement);
            IconManager.forceDisplayIcons();
        }, 0);

        this.registerEvent(toggleButton, 'click', () => {
            // Si on est en mode dial, basculer vers input
            // Si on est en mode input, basculer vers dial
            if (this.currentViewMode === 'dial') {
                this.setViewMode('input');
            } else {
                this.setViewMode('dial');
            }
        });

        this.toggleViewButton = toggleButton;
        footer.appendChild(toggleButton);

        // Bouton de basculement 12/24
        const toggleFormatBtn = document.createElement('button');
        toggleFormatBtn.className = 'timepicker__toggle-format';
        toggleFormatBtn.type = 'button';
        const formatLabel = this.options.format === '24h' ? 'Passer en format 12h' : 'Passer en format 24h';
        setAriaAttribute(toggleFormatBtn, 'label', formatLabel);

        // Utiliser du texte directement au lieu d'une icône pour afficher "12" ou "24"
        const formatTextElement = document.createElement('span');
        formatTextElement.className = 'timepicker__toggle-format-text';
        formatTextElement.textContent = this.options.format === '24h' ? '12' : '24';
        toggleFormatBtn.appendChild(formatTextElement);

        this.registerEvent(toggleFormatBtn, 'click', () => {
            this.toggleFormat();
        });

        this.toggleFormatButton = toggleFormatBtn;
        footer.appendChild(toggleFormatBtn);

        const actions = document.createElement('div');
        actions.className = 'timepicker__actions';

        // Bouton Annuler
        if (this.options.showCancelButton) {
            const cancelButton = document.createElement('button');
            cancelButton.className = 'btn btn--tonal ripple timepicker__button timepicker__button--cancel';
            cancelButton.type = 'button';
            cancelButton.textContent = this.options.cancelButtonText ?? LocaleManager.t('timepicker.cancel');
            setAriaAttribute(cancelButton, 'label', LocaleManager.t('timepicker.cancel'));
            this.registerEvent(cancelButton, 'click', () => {
                this.close();
            });
            actions.appendChild(cancelButton);
        }

        // Bouton Confirmer
        if (this.options.showConfirmButton) {
            const confirmButton = document.createElement('button');
            confirmButton.className = 'btn btn--tonal ripple timepicker__button timepicker__button--confirm';
            confirmButton.type = 'button';
            confirmButton.textContent = this.options.confirmButtonText ?? LocaleManager.t('timepicker.confirm');
            setAriaAttribute(confirmButton, 'label', LocaleManager.t('timepicker.confirm'));
            this.registerEvent(confirmButton, 'click', () => {
                this.confirmSelection();
            });
            actions.appendChild(confirmButton);
        }

        // Ne retourner que si au moins un bouton est affiché
        if (actions.children.length > 0) {
            footer.appendChild(actions);
            return footer;
        }

        return footer;
    }

    /**
     * Change le mode d'affichage (dial ou input)
     */
    private setViewMode(mode: 'dial' | 'input'): void {
        this.currentViewMode = mode;

        if (!this.modalElement || !this.timepickerElement) return;

        // Si on passe en mode dial, réinitialiser le clockMode à 'hour' par défaut
        if (mode === 'dial') {
            this.clockMode = 'hour';
        }

        // Supprimer l'ancienne vue
        this.timepickerElement.remove();

        // Créer la nouvelle vue
        this.timepickerElement = this.createTimepickerView();
        this.modalElement.insertBefore(this.timepickerElement, this.modalElement.querySelector('.timepicker__footer'));

        // Mettre à jour l'icône du bouton toggle
        if (this.toggleViewButton) {
            const iconElement = this.toggleViewButton.querySelector('.k3ui-icon') as HTMLElement;
            if (iconElement) {
                // Changer l'icône selon le mode : keyboard pour input, clock pour dial
                iconElement.setAttribute('name', this.currentViewMode === 'dial' ? 'keyboard' : 'clock');
                setTimeout(() => {
                    IconManager.updateIcon(iconElement);
                    IconManager.forceDisplayIcons();
                }, 0);
                setAriaAttribute(this.toggleViewButton, 'label', this.currentViewMode === 'dial' ? 'Passer en mode saisie' : 'Passer en mode cadran');
            }
        }

        // Mettre à jour l'affichage et le dial si on est en mode dial
        if (mode === 'dial') {
            setTimeout(() => {
                this.showView('hour');
                this.updateClockDial();
                this.updateClockHand();
                this.updateTimeDisplay();
            }, 0);
        } else {
            this.updateTimeDisplay();
        }
    }

    /**
     * Configure les attributs ARIA
     */
    private setupAriaAttributes(): void {
        if (!this.modalElement) return;

        setAriaAttributes(this.modalElement, {
            role: 'dialog',
            'aria-modal': true,
            'aria-label': LocaleManager.t('timepicker.ariaLabel'),
            'aria-labelledby': 'timepicker-header-time'
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
        const time = this.parseTime(value);
        if (time) {
            this.selectTime(time.hours, time.minutes, false);
        }
    };

    /**
     * Gestionnaire d'événement blur sur l'input
     */
    private handleInputBlur = (): void => {
        // Validation de l'heure saisie
        if (this.inputElement && this.inputElement.value) {
            const time = this.parseTime(this.inputElement.value);
            if (!time) {
                // Heure invalide, restaurer la valeur précédente
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
            case 'ArrowUp':
                event.preventDefault();
                if (this.clockMode === 'hour') {
                    this.navigateHour('prev');
                } else {
                    this.navigateMinute('prev');
                }
                break;
            case 'ArrowDown':
                event.preventDefault();
                if (this.clockMode === 'hour') {
                    this.navigateHour('next');
                } else {
                    this.navigateMinute('next');
                }
                break;
            case 'Enter':
                event.preventDefault();
                this.confirmSelection();
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
     * Définit l'heure
     */
    setHour(hour: number): void {
        if (this.isTimeDisabled(hour, this.currentMinutes)) return;

        this.currentHours = hour;
        this.updateTimeDisplay();
        this.updateClockDial();
    }

    /**
     * Définit la minute
     */
    setMinute(minute: number): void {
        if (this.isTimeDisabled(this.currentHours, minute)) return;

        this.currentMinutes = minute;
        this.updateClockDial();
        // TOUJOURS appeler updateClockHand pour garantir la synchronisation
        this.updateClockHand();
        this.updateTimeDisplay();
    }

    /**
     * Sélectionne une heure
     */
    selectTime(hours: number, minutes: number, updateCalendar: boolean = true): void {
        if (this.isTimeDisabled(hours, minutes)) return;

        const timeKey = `${hours}:${minutes}`;
        if (timeKey !== this.lastHapticTimeKey) {
            this.lastHapticTimeKey = timeKey;
            HapticManager.triggerFromOptions(this.options, 'selection');
        }

        this.currentHours = hours;
        this.currentMinutes = minutes;
        this.selectedTime = { hours, minutes };

        // Mettre à jour l'affichage
        this.updateDisplay();

        // Mettre à jour le cadran
        if (updateCalendar) {
            this.updateClockDial();
        }

        // Callback onChange
        if (this.options.onChange && this.selectedTime) {
            this.options.onChange(this.selectedTime, this);
        }
    }

    /**
     * Navigue vers l'heure précédente/suivante
     */
    private navigateHour(direction: 'prev' | 'next'): void {
        let newHour = this.currentHours;

        if (this.options.format === '12h') {
            if (direction === 'prev') {
                newHour -= 1;
                if (newHour < 1) {
                    newHour = 12;
                }
            } else {
                newHour += 1;
                if (newHour > 12) {
                    newHour = 1;
                }
            }
        } else {
            if (direction === 'prev') {
                newHour -= 1;
                if (newHour < 0) {
                    newHour = 23;
                }
            } else {
                newHour += 1;
                if (newHour > 23) {
                    newHour = 0;
                }
            }
        }

        this.setHour(newHour);
    }

    /**
     * Navigue vers la minute précédente/suivante
     */
    private navigateMinute(direction: 'prev' | 'next'): void {
        let newMinute = this.currentMinutes;

        if (direction === 'prev') {
            newMinute -= this.options.minuteStep || 1;
            if (newMinute < 0) {
                newMinute = 60 - (this.options.minuteStep || 1);
            }
        } else {
            newMinute += this.options.minuteStep || 1;
            if (newMinute >= 60) {
                newMinute = 0;
            }
        }

        this.setMinute(newMinute);
    }

    /**
     * Vérifie si une heure est désactivée
     */
    private isTimeDisabled(hours: number, minutes: number): boolean {
        // Vérifier minTime
        if (this.options.minTime) {
            const minTotal = this.options.minTime.hours * 60 + this.options.minTime.minutes;
            const currentTotal = hours * 60 + minutes;
            if (currentTotal < minTotal) {
                return true;
            }
        }

        // Vérifier maxTime
        if (this.options.maxTime) {
            const maxTotal = this.options.maxTime.hours * 60 + this.options.maxTime.minutes;
            const currentTotal = hours * 60 + minutes;
            if (currentTotal > maxTotal) {
                return true;
            }
        }

        return false;
    }

    /**
     * Formate une heure selon le format donné
     */
    formatTime(hours: number, minutes: number): string {
        let displayHours = hours;
        let ampm = '';

        if (this.options.format === '12h') {
            if (hours === 0) {
                displayHours = 12;
                ampm = ' AM';
            } else if (hours === 12) {
                displayHours = 12;
                ampm = ' PM';
            } else if (hours > 12) {
                displayHours = hours - 12;
                ampm = ' PM';
            } else {
                ampm = ' AM';
            }
        }

        const formattedHours = displayHours.toString().padStart(2, '0');
        const formattedMinutes = minutes.toString().padStart(2, '0');

        let formatted = this.options.timeFormat
            .replace('HH', formattedHours)
            .replace('hh', formattedHours)
            .replace('mm', formattedMinutes)
            .replace('MM', formattedMinutes)
            .replace('A', ampm.trim())
            .replace('a', ampm.trim().toLowerCase());

        // Si format 12h et que AM/PM n'a pas été ajouté (timeFormat ne contient pas A ou a), l'ajouter à la fin
        if (this.options.format === '12h' && !this.options.timeFormat.match(/[Aa]/)) {
            formatted += ampm;
        }

        return formatted;
    }

    /**
     * Parse une heure depuis une chaîne
     */
    parseTime(timeString: string): { hours: number; minutes: number } | null {
        if (!timeString) return null;

        // Essayer de parser selon le format HH:mm ou hh:mm A
        const parts = timeString.split(/[: ]/);
        if (parts.length < 2) return null;

        let hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);

        if (isNaN(hours) || isNaN(minutes)) return null;

        // Gérer le format 12h
        if (this.options.format === '12h' && parts.length > 2) {
            const ampm = parts[2].toUpperCase();
            if (ampm === 'PM' && hours !== 12) {
                hours += 12;
            } else if (ampm === 'AM' && hours === 12) {
                hours = 0;
            }
        }

        if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
            return null;
        }

        return { hours, minutes };
    }

    /**
     * Récupère l'heure sélectionnée
     */
    getTime(): { hours: number; minutes: number } | null {
        return this.selectedTime ? { ...this.selectedTime } : null;
    }

    /**
     * Définit l'heure sélectionnée
     */
    setTime(time: { hours: number; minutes: number } | null): void {
        if (time) {
            this.selectTime(time.hours, time.minutes, false);
        } else {
            this.clearTime();
        }
    }

    /**
     * Efface l'heure sélectionnée
     */
    clearTime(): void {
        this.selectedTime = null;
        this.updateDisplay();

        // Note: onChange n'est pas appelé ici car le type n'accepte pas null
        // Si nécessaire, le callback peut être appelé depuis l'extérieur après clearTime()
    }

    /**
     * Confirme la sélection et ferme
     */
    confirmSelection(): void {
        // Mettre à jour selectedTime avec les valeurs actuelles si pas déjà défini
        if (!this.selectedTime) {
            this.selectedTime = {
                hours: this.currentHours,
                minutes: this.currentMinutes
            };
        } else {
            // S'assurer que selectedTime est synchronisé avec currentHours et currentMinutes
            this.selectedTime.hours = this.currentHours;
            this.selectedTime.minutes = this.currentMinutes;
        }

        // Mettre à jour l'input principal
        this.updateDisplay();

        // Callback onSelect
        if (this.options.onSelect) {
            this.options.onSelect(this.selectedTime, this);
        }

        this.close();
    }

    /**
     * Bascule entre format 12h et 24h
     */
    private toggleFormat(): void {
        // Obtenir l'heure en 24h avant de changer le format
        let hour24 = this.currentHours;
        if (this.options.format === '12h') {
            // Convertir de 12h à 24h avant de changer
            if (this.amPmElement) {
                const pmButton = this.amPmElement.querySelector('[data-ampm="pm"]') as HTMLElement;
                const isPM = pmButton?.classList.contains('timepicker__ampm-button--selected');
                if (isPM && this.currentHours < 12) {
                    hour24 = this.currentHours + 12;
                } else if (!isPM && this.currentHours === 12) {
                    hour24 = 0;
                } else {
                    hour24 = this.currentHours;
                }
            }
        }

        // Basculer le format
        const newFormat = this.options.format === '24h' ? '12h' : '24h';
        this.options.format = newFormat;

        // Garder currentHours en format 24h (0-23) pour le stockage interne
        // formatHourForDisplay fera la conversion pour l'affichage
        this.currentHours = hour24;

        // Mettre à jour selectedTime
        if (this.selectedTime) {
            this.selectedTime.hours = this.currentHours;
        }

        // Recréer la vue pour mettre à jour le sélecteur AM/PM
        if (this.modalElement && this.timepickerElement) {
            this.timepickerElement.remove();
            this.timepickerElement = this.createTimepickerView();
            this.modalElement.insertBefore(this.timepickerElement, this.modalElement.querySelector('.timepicker__footer'));

            // Mettre à jour le texte du bouton toggle format
            if (this.toggleFormatButton) {
                const textElement = this.toggleFormatButton.querySelector('.timepicker__toggle-format-text') as HTMLElement;
                if (textElement) {
                    textElement.textContent = this.options.format === '24h' ? '12' : '24';
                    const formatLabel = this.options.format === '24h' ? 'Passer en format 12h' : 'Passer en format 24h';
                    setAriaAttribute(this.toggleFormatButton, 'label', formatLabel);
                }
            }

            // Mettre à jour l'affichage et le dial si on est en mode dial
            if (this.currentViewMode === 'dial') {
                setTimeout(() => {
                    this.showView('hour');
                    this.updateClockDial();
                    this.updateClockHand();
                    this.updateTimeDisplay();
                }, 0);
            } else {
                this.updateTimeDisplay();
            }
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
            this.keyboardInstance = null;
        }

        if (this.mouseInstance) {
            this.mouseInstance = null;
        }

        LoggerManager.global.info('Timepicker component destroyed');
        super.destroy();
    }

    /**
     * Anime l'entrée du modal avec effet haptic
     */
    private _animateIn(): void {
        if (!this.backdropElement || !this.modalElement) return;

        const duration = this.options.inDuration || 250;
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
            this.timepickerElement = null;
            this.inputViewElement = null;
            this.clockDialElement = null;
            this.clockHandElement = null;
            this.clockNumbersHourElement = null;
            this.clockNumbersMinuteElement = null;
            this.amPmElement = null;
            this.inputHourElement = null;
            this.inputMinuteElement = null;
            this.toggleViewButton = null;

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
        const header = this.modalElement.querySelector('.timepicker__header');
        if (header) {
            (header as HTMLElement).style.backgroundColor = 'var(--md-sys-color-surface-container-high, #f5f5f5)';
            (header as HTMLElement).style.color = 'var(--md-sys-color-on-surface, #000)';
        }
    }
}

/**
 * Enregistrement du Web Component k3ui-timepicker
 * @description Permet l'utilisation de <k3ui-timepicker> dans le HTML. Initialisation par AutoInit.
 */
if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-timepicker')) {
    customElements.define('k3ui-timepicker', class extends HTMLElement {
        connectedCallback(): void {
            if (!this.hasAttribute('data-initialized')) {
                this.setAttribute('data-initialized', 'true');
                // Attendre que K3UI soit prêt
                const timepicker = getK3uiGlobal()?.Timepicker;
                if (timepicker) {
                    timepicker.init(this);
                } else {
                    document.addEventListener('k3ui-ready', () => {
                        getK3uiGlobal()?.Timepicker?.init(this);
                    });
                }
            }
        }
    });
}

