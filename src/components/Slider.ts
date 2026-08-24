/**
 * K3UI Slider Component
 * Composant de slider basé sur Material Design 3 Expressive
 *
 * @summary Slider Material Design 3 Expressive
 * @element k3ui-slider
 *
 * @event change - La valeur change
 * @event dragstart - Le drag commence
 * @event drag - Le drag continue
 * @event dragend - Le drag se termine
 */

import { Component } from '../core/base/Component';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import { SliderOptions } from '../types/components';
import { PriorityLevel } from '../types/base';
import { KElement, InitElements } from '../types/base';
import { LoggerManager, IconManager } from '../core/managers';
import { setAriaAttribute } from '../utils/dom/aria';
import { Mouse, Keyboard } from '../core/managers';
import { getSliderDefaults, SliderSpecs } from '../specs/components/slider.specs';
import { HapticManager } from '../core/managers/HapticManager';
import {
    bindPointerDown,
    getPointerCoords,
    startPointerDragSession,
    type PointerLikeEvent,
} from '../utils/dom/pointer';

/**
 * Options par défaut du composant Slider
 * @description Extrait depuis les specs pour garantir la cohérence
 */
const _defaults: SliderOptions = getSliderDefaults();

/** Cleanup de drag actif stocké sur l’élément slider (legacy / debug). */
interface KSliderDragCleanupElement extends HTMLElement {
    _sliderCleanup?: () => void;
}

/**
 * Classe du composant Slider
 */
export class Slider extends Component<SliderOptions> {
    declare el: HTMLElement;

    /** Élément container du slider */
    containerElement: HTMLDivElement | null = null;

    /** Élément track (rail) */
    trackElement: HTMLDivElement | null = null;

    /** Élément track actif */
    activeTrackElement: HTMLDivElement | null = null;

    /** Élément track inactif */
    inactiveTrackElement: HTMLDivElement | null = null;

    /** Élément track inactif avant (pour range slider) */
    inactiveTrackBeforeElement: HTMLDivElement | null = null;

    /** Élément track inactif après (pour range slider) */
    inactiveTrackAfterElement: HTMLDivElement | null = null;

    /** Élément handle (poignée) */
    handleElement: HTMLDivElement | null = null;

    /** Élément handle start (pour range slider) */
    handleStartElement: HTMLDivElement | null = null;

    /** Élément handle end (pour range slider) */
    handleEndElement: HTMLDivElement | null = null;

    /** Élément label de valeur (pour single slider) */
    valueLabelElement: HTMLDivElement | null = null;

    /** Élément label de valeur start (pour range slider) */
    valueLabelStartElement: HTMLDivElement | null = null;

    /** Élément label de valeur end (pour range slider) */
    valueLabelEndElement: HTMLDivElement | null = null;

    /** Élément label */
    labelElement: HTMLLabelElement | null = null;

    /** Élément icône inset */
    iconElement: HTMLElement | null = null;

    /** Élément input caché (pour les formulaires) */
    inputElement: HTMLInputElement | null = null;

    /** Si le slider est en train d'être dragué */
    private isDragging: boolean = false;

    /** Dernier cran haptique émis (évite les répétitions pendant le drag). */
    private lastHapticStepKey: string | null = null;

    /** Handle actif (pour range slider) */
    private activeHandle: 'start' | 'end' | 'single' | null = null;

    /** Désinscription des listeners pointerdown. */
    private _pointerUnbinds: Array<() => void> = [];

    /** Nettoyage de la session de drag en cours. */
    private _activeDragCleanup: (() => void) | null = null;

    /** ID unique pour ce slider (pour gérer plusieurs sliders) */
    private sliderId: string;

    /** Valeur actuelle */
    private currentValue: number = 50;

    /** Valeur start actuelle (pour range slider) */
    private currentValueStart: number = 25;

    /** Valeur end actuelle (pour range slider) */
    private currentValueEnd: number = 75;

    /** Niveau de priorité du composant */
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    /** Seuil de tolérance pour la comparaison des valeurs (pour éviter les erreurs de précision flottante) */
    private static readonly VALUE_EPSILON = 0.01;

    /** Classe CSS pour le stop indicator actif */
    private static readonly STOP_INDICATOR_ACTIVE_CLASS = 'slider__stop-indicator--active';

    /** Classe CSS pour le stop indicator sélectionné */
    private static readonly STOP_INDICATOR_SELECTED_CLASS = 'slider__stop-indicator--selected';

    /**
     * Détecte la direction d'écriture (LTR/RTL)
     * @returns true si RTL, false si LTR
     */
    private isRTL(): boolean {
        if (this.options.direction === 'rtl') {
            return true;
        }
        if (this.options.direction === 'ltr') {
            return false;
        }
        // 'auto' : détection depuis le DOM
        return window.getComputedStyle(this.el).direction === 'rtl';
    }

    /**
     * Inverse un pourcentage pour RTL (uniquement pour horizontal)
     * @param percentage Pourcentage à inverser
     * @returns Pourcentage inversé si RTL horizontal, sinon le pourcentage original
     */
    private invertPercentageForRTL(percentage: number): number {
        if (this.isRTL() && !this.options.vertical) {
            return 100 - percentage;
        }
        return percentage;
    }

    constructor(el: HTMLElement, options: Partial<SliderOptions> = {}) {
        // Lire les attributs HTML et les convertir en options
        const htmlOptions = Slider.readAttributes(el);

        super(el, { ...options, ...htmlOptions }, toComponentClassDef(Slider));

        // Générer un ID unique pour ce slider
        this.sliderId = `slider-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

        // Stocker l'ID sur l'élément DOM pour identifier ce slider
        el.setAttribute('data-slider-id', this.sliderId);

        // Stocker l'instance
        // L'instance est gérée via ComponentRegistry (voir getInstance())

        // Initialiser le composant
        this.init();
    }

    static getInstance(el: HTMLElement): Slider | undefined {
        return Component.getInstance(el) as Slider | undefined;
    }

    static get defaults(): SliderOptions {
        return _defaults;
    }

    /**
     * Initialise une instance de Slider.
     * @param el Élément HTML.
     * @param options Options du composant.
     */
    static init(el: HTMLElement, options?: Partial<SliderOptions>): Slider;
    /**
     * Initialise des instances de Slider.
     * @param els Éléments HTML.
     * @param options Options du composant.
     */
    static init(els: InitElements<KElement>, options?: Partial<SliderOptions>): Slider[];
    static init(
        els: HTMLElement | InitElements<KElement>,
        options?: Partial<SliderOptions>
    ): Slider | Slider[] {
        if (els instanceof Element) {
            return new Slider(els as HTMLElement, options);
        } else if (!!els && els.length) {
            const instances = [];
            for (let i = 0; i < els.length; i++) {
                instances.push(new Slider(els[i] as HTMLElement, options));
            }
            return instances;
        }
        return [];
    }

    /**
     * Lit les attributs HTML et les convertit en options
     */
    private static readAttributes(el: HTMLElement): Partial<SliderOptions> {
        const options: Partial<SliderOptions> = {};

        // Lire les attributs HTML
        if (el.hasAttribute('value')) {
            options.value = parseFloat(el.getAttribute('value') || '50');
        }
        if (el.hasAttribute('value-start')) {
            options.valueStart = parseFloat(el.getAttribute('value-start') || '25');
        }
        if (el.hasAttribute('value-end')) {
            options.valueEnd = parseFloat(el.getAttribute('value-end') || '75');
        }
        if (el.hasAttribute('min')) {
            options.min = parseFloat(el.getAttribute('min') || '0');
        }
        if (el.hasAttribute('max')) {
            options.max = parseFloat(el.getAttribute('max') || '100');
        }
        if (el.hasAttribute('step')) {
            options.step = parseFloat(el.getAttribute('step') || '1');
        }
        if (el.hasAttribute('size')) {
            const size = el.getAttribute('size');
            if (size === 'xs' || size === 's' || size === 'm' || size === 'l' || size === 'xl') {
                options.size = size;
            }
        }
        if (el.hasAttribute('label')) {
            options.label = el.getAttribute('label') || undefined;
        }
        if (el.hasAttribute('name')) {
            options.name = el.getAttribute('name') || '';
        }
        if (el.hasAttribute('icon')) {
            options.icon = el.getAttribute('icon') || undefined;
        }
        if (el.hasAttribute('direction')) {
            const direction = el.getAttribute('direction');
            if (direction === 'ltr' || direction === 'rtl' || direction === 'auto') {
                options.direction = direction;
            }
        }

        // Attributs booléens
        options.discrete = el.hasAttribute('discrete');
        options.vertical = el.hasAttribute('vertical');
        options.centered = el.hasAttribute('centered');
        options.range = el.hasAttribute('range');
        options.disabled = el.hasAttribute('disabled');
        options.showLabel = el.hasAttribute('show-label');
        // showValueLabel : true par défaut, false si l'attribut 'hide-value-label' est présent
        if (el.hasAttribute('data-label-position')) {
            const labelPosition = el.getAttribute('data-label-position');
            if (labelPosition === 'left' || labelPosition === 'right' || labelPosition === 'top' || labelPosition === 'bottom') {
                options.labelPosition = labelPosition;
            }
        }
        options.showValueLabel = !el.hasAttribute('hide-value-label');

        return options;
    }

    /**
     * Initialise le composant Slider
     */
    init(): void {
        LoggerManager.global.info(`Slider component initialized [${this.sliderId}]`);

        // Valider que range slider n'est pas vertical (non supporté)
        if (this.options.range && this.options.vertical) {
            LoggerManager.global.warn('Range slider vertical is not supported. Forcing horizontal orientation.');
            this.options.vertical = false;
        }

        // Initialiser les valeurs
        this.currentValue = this.options.value;
        this.currentValueStart = this.options.valueStart ?? this.options.min;
        this.currentValueEnd = this.options.valueEnd ?? this.options.max;

        // Créer la structure DOM
        this.createStructure();

        // Configurer les événements
        this.setupEvents();

        // Appliquer la direction sur l'élément si spécifiée
        if (this.options.direction && this.options.direction !== 'auto') {
            this.el.setAttribute('dir', this.options.direction);
        }

        // Appliquer les styles
        this.applyStyles();

        // Créer l'icône inset si nécessaire (uniquement pour M, L, XL)
        // Après que tous les éléments soient créés et ajoutés au DOM
        if (this.options.icon && (this.options.size === 'm' || this.options.size === 'l' || this.options.size === 'xl')) {
            this.createIcon();
        }

        // Mettre à jour l'état visuel
        this.updateVisualState();
    }

    /**
     * Crée la structure DOM du composant
     */
    private createStructure(): void {
        // Créer le container principal
        this.containerElement = document.createElement('div');
        this.containerElement.className = 'slider__container';

        // Créer le track
        this.trackElement = document.createElement('div');
        this.trackElement.className = 'slider__track';

        // Créer le track actif
        this.activeTrackElement = document.createElement('div');
        this.activeTrackElement.className = 'slider__track-active';

        // Créer le track inactif
        this.inactiveTrackElement = document.createElement('div');
        this.inactiveTrackElement.className = 'slider__track-inactive';

        // Créer les stop indicators
        const stopStart = document.createElement('div');
        stopStart.className = 'slider__stop-indicator';
        stopStart.setAttribute('data-position', 'start');

        const stopEnd = document.createElement('div');
        stopEnd.className = 'slider__stop-indicator';
        stopEnd.setAttribute('data-position', 'end');

        // Créer les handles selon le type de slider
        if (this.options.range) {
            // Range slider : deux handles (cliquables directement comme dans le code React)
            this.handleStartElement = document.createElement('div');
            this.handleStartElement.className = 'slider__handle';
            this.handleStartElement.setAttribute('data-handle', 'start');
            this.handleStartElement.style.cursor = 'grab';
            this.handleStartElement.style.pointerEvents = 'auto'; // Permettre les clics directs
            setAriaAttribute(this.handleStartElement, 'role', 'slider');
            setAriaAttribute(this.handleStartElement, 'valuemin', this.options.min);
            setAriaAttribute(this.handleStartElement, 'valuemax', this.options.max);
            setAriaAttribute(this.handleStartElement, 'valuenow', this.currentValueStart);

            this.handleEndElement = document.createElement('div');
            this.handleEndElement.className = 'slider__handle';
            this.handleEndElement.setAttribute('data-handle', 'end');
            this.handleEndElement.style.cursor = 'grab';
            this.handleEndElement.style.pointerEvents = 'auto'; // Permettre les clics directs
            setAriaAttribute(this.handleEndElement, 'role', 'slider');
            setAriaAttribute(this.handleEndElement, 'valuemin', this.options.min);
            setAriaAttribute(this.handleEndElement, 'valuemax', this.options.max);
            setAriaAttribute(this.handleEndElement, 'valuenow', this.currentValueEnd);
        } else {
            // Single slider : un handle
            this.handleElement = document.createElement('div');
            this.handleElement.className = 'slider__handle';
            this.handleElement.style.pointerEvents = 'none'; // Non cliquable directement, clic sur le track
            setAriaAttribute(this.handleElement, 'role', 'slider');
            setAriaAttribute(this.handleElement, 'valuemin', this.options.min);
            setAriaAttribute(this.handleElement, 'valuemax', this.options.max);
            setAriaAttribute(this.handleElement, 'valuenow', this.currentValue);
        }

        // Assembler la structure (ordre important pour z-index)
        // 1. Stop indicators (z-index 5)
        this.trackElement.appendChild(stopStart);
        this.trackElement.appendChild(stopEnd);

        // 2. Track inactif (z-index 0)
        this.trackElement.appendChild(this.inactiveTrackElement);

        // 3. Track actif (z-index 10)
        this.trackElement.appendChild(this.activeTrackElement);

        // 4. Points discrets (z-index 5, au-dessus du track inactif, sous le track actif)
        if (this.options.discrete) {
            const discreteContainer = document.createElement('div');
            discreteContainer.className = 'slider__discrete-points';
            // Exclure min et max car ils sont déjà représentés par les stop indicators
            // Créer des points pour toutes les valeurs entre min et max (excluant min et max)
            const totalSteps = Math.floor((this.options.max - this.options.min) / this.options.step);
            for (let i = 1; i < totalSteps; i++) {
                const tickValue = this.options.min + (i * this.options.step);
                // Exclure min et max pour éviter les doublons avec les stop indicators
                if (tickValue > this.options.min && tickValue < this.options.max) {
                    const point = document.createElement('div');
                    point.className = 'slider__discrete-point';
                    discreteContainer.appendChild(point);
                }
            }
            this.trackElement.appendChild(discreteContainer);
        }

        if (this.options.range) {
            if (this.handleStartElement) {
                this.trackElement.appendChild(this.handleStartElement);
            }
            if (this.handleEndElement) {
                this.trackElement.appendChild(this.handleEndElement);
            }
        } else {
            if (this.handleElement) {
                this.trackElement.appendChild(this.handleElement);
            }
        }

        this.containerElement.appendChild(this.trackElement);


        // Créer le label si nécessaire
        if (this.options.label) {
            this.labelElement = document.createElement('label');
            this.labelElement.className = 'slider__label';
            this.labelElement.textContent = this.options.label;
            this.el.appendChild(this.labelElement);
        }

        // Créer l'icône inset si nécessaire (uniquement pour M, L, XL)
        // L'icône sera créée après l'initialisation complète du DOM
        // pour s'assurer que tous les éléments sont en place

        // Créer l'input caché pour les formulaires
        this.inputElement = document.createElement('input');
        this.inputElement.type = 'range';
        this.inputElement.className = 'slider__input';
        this.inputElement.min = this.options.min.toString();
        this.inputElement.max = this.options.max.toString();
        this.inputElement.step = this.options.step.toString();
        this.inputElement.value = this.options.range
            ? this.currentValueStart.toString()
            : this.currentValue.toString();
        this.inputElement.disabled = this.options.disabled ?? false;
        this.inputElement.style.position = 'absolute';
        this.inputElement.style.opacity = '0';
        this.inputElement.style.pointerEvents = 'none';
        this.inputElement.setAttribute('aria-hidden', 'true');

        if (this.options.name) {
            this.inputElement.name = this.options.name;
        }

        // Ajouter au DOM
        this.el.appendChild(this.containerElement);
        this.el.appendChild(this.inputElement);

        // Configurer ARIA
        this.setupAria();
    }

    /**
     * Configure les attributs ARIA
     */
    private setupAria(): void {
        setAriaAttribute(this.el, 'role', 'group');
        if (this.options.label) {
            setAriaAttribute(this.el, 'label', this.options.label);
        }
        if (this.options.disabled) {
            setAriaAttribute(this.el, 'disabled', true);
        }
    }

    /**
     * Configure les événements du composant
     */
    private setupEvents(): void {
        if (!this.trackElement) return;

        this._pointerUnbinds.push(
            bindPointerDown(this.trackElement, (e) => this.handleStart(e))
        );

        if (this.options.range) {
            if (this.handleStartElement) {
                this._pointerUnbinds.push(
                    bindPointerDown(this.handleStartElement, (e) => {
                        if (e instanceof Event) {
                            e.preventDefault();
                            e.stopPropagation();
                        }
                        this.activeHandle = 'start';
                        this.handleStart(e);
                    })
                );
            }
            if (this.handleEndElement) {
                this._pointerUnbinds.push(
                    bindPointerDown(this.handleEndElement, (e) => {
                        if (e instanceof Event) {
                            e.preventDefault();
                            e.stopPropagation();
                        }
                        this.activeHandle = 'end';
                        this.handleStart(e);
                    })
                );
            }
        }

        // Gérer les événements clavier
        this.trackElement.addEventListener('keydown', this.handleKeyDown.bind(this) as EventListener);
        this.trackElement.setAttribute('tabindex', '0');
    }

    /**
     * Gestionnaire d'événement start (pointerdown unifié)
     */
    private handleStart = (event: PointerLikeEvent): void => {
        if (this.options.disabled) return;

        event.preventDefault();
        event.stopPropagation();

        // Pour range slider, déterminer quel handle est le plus proche (si pas déjà déterminé par clic direct)
        if (this.options.range && !this.activeHandle) {
            const rect = this.trackElement!.getBoundingClientRect();
            const { x: clientX } = getPointerCoords(event);
            // Pour range slider RTL, utiliser la logique LTR (pas d'inversion)
            const isRTL = this.isRTL();
            const isRangeRTL = isRTL && this.options.range;
            const clickPosition = (isRTL && !isRangeRTL)
                ? (rect.right - clientX) / rect.width  // RTL (sauf range) : inverser
                : (clientX - rect.left) / rect.width; // LTR ou range RTL : normal
            const clickValue = this.options.min + (clickPosition * (this.options.max - this.options.min));

            const distanceToStart = Math.abs(clickValue - this.currentValueStart);
            const distanceToEnd = Math.abs(clickValue - this.currentValueEnd);

            this.activeHandle = distanceToStart < distanceToEnd ? 'start' : 'end';
        } else if (!this.options.range) {
            this.activeHandle = 'single';
        }

        this.isDragging = true;
        this.el.setAttribute('data-dragging', 'true');
        this.handleInteraction(event);

        // Émettre l'événement 'dragstart'
        this.el.dispatchEvent(new CustomEvent('dragstart', {
            detail: {},
            bubbles: true,
            cancelable: true
        }));

        this.options.onDragStart?.(this.el);

        const pointerId = event instanceof PointerEvent ? event.pointerId : 0;
        const track = this.trackElement;
        if (!track) return;
        this._activeDragCleanup?.();
        this._activeDragCleanup = startPointerDragSession({
            captureElement: track,
            pointerId,
            onMove: (e) => {
                if (this.isDragging) {
                    this.handleInteraction(e);
                }
            },
            onEnd: () => this.finishDrag(),
            preventDefaultOnMove: true,
        });
        (this.el as KSliderDragCleanupElement)._sliderCleanup = this._activeDragCleanup;
    };

    /**
     * Termine le drag (pointerup / fallback).
     * @private
     */
    private finishDrag(): void {
        if (!this.isDragging) {
            return;
        }
        this.isDragging = false;
        this._activeDragCleanup = null;
        delete (this.el as KSliderDragCleanupElement)._sliderCleanup;

        if (this.handleElement) {
            this.handleElement.style.transition = '';
            this.handleElement.style.willChange = '';
        }
        if (this.handleStartElement) {
            this.handleStartElement.style.transition = '';
            this.handleStartElement.style.willChange = '';
        }
        if (this.handleEndElement) {
            this.handleEndElement.style.transition = '';
            this.handleEndElement.style.willChange = '';
        }
        if (this.valueLabelElement) {
            this.valueLabelElement.style.transition = '';
            this.valueLabelElement.style.willChange = '';
            this.valueLabelElement.classList.remove('slider__value-label--visible');
        }
        if (this.valueLabelStartElement) {
            this.valueLabelStartElement.style.transition = '';
            this.valueLabelStartElement.style.willChange = '';
            this.valueLabelStartElement.classList.remove('slider__value-label--visible');
        }
        if (this.valueLabelEndElement) {
            this.valueLabelEndElement.style.transition = '';
            this.valueLabelEndElement.style.willChange = '';
            this.valueLabelEndElement.classList.remove('slider__value-label--visible');
        }
        this.setTrackTransitions(false);
        this.el.removeAttribute('data-dragging');
        this.el.style.zIndex = '';
        this.el.style.position = '';
        this.el.style.overflow = '';
        if (this.containerElement) {
            this.containerElement.style.overflow = '';
        }
        this.updateVisualState();

        const value = this.options.range
            ? [this.currentValueStart, this.currentValueEnd] as [number, number]
            : this.currentValue;

        this.el.dispatchEvent(
            new CustomEvent('dragend', {
                detail: { value },
                bubbles: true,
                cancelable: true,
            })
        );
        this.options.onDragEnd?.(this.el, value);
        this.activeHandle = null;
    }

    /**
     * Gestionnaire d'événement keydown
     */
    private handleKeyDown = (event: KeyboardEvent): void => {
        if (this.options.disabled) return;

        const step = this.options.step;
        const isRTL = this.isRTL() && !this.options.vertical; // RTL uniquement pour horizontal
        let newValue: number;

        // En RTL, inverser les flèches gauche/droite
        let effectiveKey = event.key;
        if (isRTL && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
            effectiveKey = event.key === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft';
        }

        switch (effectiveKey) {
            case 'ArrowLeft':
            case 'ArrowDown':
                event.preventDefault();
                if (this.options.range) {
                    if (this.activeHandle === 'end') {
                        newValue = Math.max(this.currentValueStart + step, this.currentValueEnd - step);
                        this.setValue(newValue, 'end');
                    } else {
                        newValue = Math.max(this.options.min, this.currentValueStart - step);
                        this.setValue(newValue, 'start');
                    }
                } else {
                    newValue = Math.max(this.options.min, this.currentValue - step);
                    this.setValue(newValue, 'single');
                }
                break;
            case 'ArrowRight':
            case 'ArrowUp':
                event.preventDefault();
                if (this.options.range) {
                    if (this.activeHandle === 'start') {
                        newValue = Math.min(this.currentValueEnd - step, this.currentValueStart + step);
                        this.setValue(newValue, 'start');
                    } else {
                        newValue = Math.min(this.options.max, this.currentValueEnd + step);
                        this.setValue(newValue, 'end');
                    }
                } else {
                    newValue = Math.min(this.options.max, this.currentValue + step);
                    this.setValue(newValue, 'single');
                }
                break;
            case 'Home':
                event.preventDefault();
                if (this.options.range) {
                    this.setValue(this.options.min, this.activeHandle === 'end' ? 'end' : 'start');
                } else {
                    this.setValue(this.options.min, 'single');
                }
                break;
            case 'End':
                event.preventDefault();
                if (this.options.range) {
                    this.setValue(this.options.max, this.activeHandle === 'start' ? 'start' : 'end');
                } else {
                    this.setValue(this.options.max, 'single');
                }
                break;
        }
    };

    /**
     * Gère l'interaction (click ou drag)
     */
    private handleInteraction(event: PointerLikeEvent): void {
        if (!this.trackElement) return;

        const rect = this.trackElement.getBoundingClientRect();
        const { x: clientX, y: clientY } = getPointerCoords(event);

        let clickPosition: number;
        let newValue: number;

        if (this.options.vertical) {
            clickPosition = (rect.bottom - clientY) / rect.height;
        } else {
            // Horizontal : gérer LTR/RTL
            // Pour range slider RTL, utiliser la logique LTR (pas d'inversion)
            const isRTL = this.isRTL();
            const isRangeRTL = isRTL && this.options.range;
            if (isRTL && !isRangeRTL) {
                // RTL (sauf range) : inverser le calcul (cliquer à gauche = valeur élevée)
                clickPosition = (rect.right - clientX) / rect.width;
            } else {
                // LTR ou range RTL : calcul normal (cliquer à gauche = valeur faible)
                clickPosition = (clientX - rect.left) / rect.width;
            }
        }

        newValue = this.options.min + (clickPosition * (this.options.max - this.options.min));

        // Appliquer le step si discret
        if (this.options.discrete) {
            newValue = Math.round(newValue / this.options.step) * this.options.step;
        }

        newValue = Math.max(this.options.min, Math.min(this.options.max, newValue));

        // Pour range slider, utiliser le handle actif déterminé au start
        if (this.options.range) {
            if (this.activeHandle === 'start') {
                // Pour range slider, s'assurer que start ne dépasse pas end
                newValue = Math.min(newValue, this.currentValueEnd - 1);
                this.setValue(newValue, 'start');
            } else if (this.activeHandle === 'end') {
                // Pour range slider, s'assurer que end ne passe pas sous start
                newValue = Math.max(newValue, this.currentValueStart + 1);
                this.setValue(newValue, 'end');
            }
        } else {
            this.setValue(newValue, 'single');
        }
    }

    /**
     * Définit la valeur du slider
     */
    setValue(value: number, handle: 'start' | 'end' | 'single' = 'single'): void {
        if (this.options.range) {
            if (handle === 'start') {
                // Pour range slider, s'assurer que start ne dépasse pas end (avec marge de 1 pour éviter la collision)
                this.currentValueStart = Math.max(this.options.min, Math.min(this.currentValueEnd - 1, value));
            } else if (handle === 'end') {
                // Pour range slider, s'assurer que end ne passe pas sous start (avec marge de 1 pour éviter la collision)
                this.currentValueEnd = Math.min(this.options.max, Math.max(this.currentValueStart + 1, value));
            }
        } else {
            this.currentValue = value;
        }

        this.updateVisualState();

        const finalValue = this.options.range
            ? [this.currentValueStart, this.currentValueEnd] as [number, number]
            : this.currentValue;

        // Émettre l'événement 'change'
        this.el.dispatchEvent(new CustomEvent('change', {
            detail: { value: finalValue },
            bubbles: true,
            cancelable: true
        }));

        if (this.options.onChange) {
            this.options.onChange(this.el, finalValue);
        }

        this.emitHapticOnStepChange();

        // Émettre l'événement 'drag' si on est en train de draguer
        if (this.isDragging) {
            this.el.dispatchEvent(new CustomEvent('drag', {
                detail: { value: finalValue },
                bubbles: true,
                cancelable: true
            }));

            if (this.options.onDrag) {
                this.options.onDrag(this.el, finalValue);
            }
        }
    }

    /**
     * Vibration à chaque changement de cran (step).
     * @private
     */
    private emitHapticOnStepChange(): void {
        if (this.options.hapticFeedback !== true) {
            return;
        }
        const step = this.options.step ?? 1;
        const stepKey = this.options.range
            ? `${Math.round(this.currentValueStart / step) * step}|${Math.round(this.currentValueEnd / step) * step}`
            : String(Math.round(this.currentValue / step) * step);
        if (stepKey === this.lastHapticStepKey) {
            return;
        }
        this.lastHapticStepKey = stepKey;
        HapticManager.triggerFromOptions(this.options, 'selection');
    }

    /**
     * Récupère la valeur du slider
     */
    getValue(): number | [number, number] {
        if (this.options.range) {
            return [this.currentValueStart, this.currentValueEnd];
        }
        return this.currentValue;
    }

    /**
     * Applique les styles du composant
     */
    private applyStyles(): void {
        if (!this.containerElement) return;

        // Ajouter les attributs pour les styles SCSS
        this.el.setAttribute('data-size', this.options.size);
        if (this.options.discrete) {
            this.el.setAttribute('data-discrete', '');
        }
        if (this.options.vertical) {
            this.el.setAttribute('data-vertical', '');
            // Pour le mode vertical, définir la variable CSS --track-height
            const config = SliderSpecs.sizes[this.options.size];
            this.containerElement.style.setProperty('--track-height', `${config.trackHeight}px`);
        }
        if (this.options.centered) {
            this.el.setAttribute('data-centered', '');
        }
        if (this.options.range) {
            this.el.setAttribute('data-range', '');
        }
        if (this.options.disabled) {
            this.el.setAttribute('data-disabled', '');
        }
        if (this.options.showLabel) {
            this.el.setAttribute('data-show-label', '');
        }
        if (this.options.labelPosition) {
            this.el.setAttribute('data-label-position', this.options.labelPosition);
        }
    }

    /**
     * Crée une bulle de valeur si elle n'existe pas
     */
    private createValueLabel(): HTMLDivElement {
        const label = document.createElement('div');
        label.className = 'slider__value-label';
        const labelContent = document.createElement('div');
        labelContent.className = 'slider__value-label-content';
        label.appendChild(labelContent);
        // Ne pas ajouter la classe --visible initialement (la bulle est cachée par défaut)
        label.style.zIndex = '1000'; // Z-index élevé pour être au-dessus de tous les sliders
        label.style.position = 'absolute'; // Position absolue par rapport au slider parent
        // Attacher la bulle à l'élément slider parent pour qu'elle puisse dépasser sans décaler le container
        this.el.appendChild(label);
        return label;
    }

    /**
     * Crée l'icône inset dans la barre
     */
    private createIcon(): void {
        if (!this.options.icon || !this.trackElement) return;

        this.iconElement = document.createElement('div');
        this.iconElement.className = 'slider__icon';

        // Créer l'élément icône pour IconManager
        // IconManager utilise l'attribut 'name' et 'type' (par défaut 'classic')
        // Utiliser <i> comme les autres composants
        // Ne pas définir 'size' pour que l'icône hérite de la taille du conteneur CSS
        const iconInner = document.createElement('i');
        iconInner.className = 'k3ui-icon';
        iconInner.setAttribute('name', this.options.icon);
        iconInner.setAttribute('type', 'classic'); // Type par défaut pour les icônes classic
        // Ne pas définir 'size' - la taille sera gérée par CSS via le conteneur .slider__icon
        this.iconElement.appendChild(iconInner);

        // Ajouter l'icône au track (d'abord sur le track inactif, sera repositionnée par updateIconPosition)
        if (this.inactiveTrackElement) {
            this.inactiveTrackElement.appendChild(this.iconElement);

            // Initialiser l'icône via IconManager après ajout au DOM
            // Utiliser requestAnimationFrame pour s'assurer que le DOM est prêt
            requestAnimationFrame(() => {
                IconManager.updateIcon(iconInner);
                // Forcer l'affichage de toutes les icônes après un court délai
                setTimeout(() => {
                    IconManager.forceDisplayIcons();
                }, 50);
            });
        }
    }

    /**
     * Met à jour la position de l'icône inset et gère le basculement entre track actif/inactif
     */
    private updateIconPosition(): void {
        if (!this.iconElement || !this.activeTrackElement || !this.inactiveTrackElement || !this.containerElement || !this.trackElement) return;

        const config = SliderSpecs.sizes[this.options.size];
        const currentValue = this.options.range ? this.currentValueStart : this.currentValue;
        const percentage = this.calculatePercentage(currentValue);

        // Taille de l'icône selon la taille du slider (en pixels)
        // M et L : 24dp, XL : 32dp
        let iconSize = 24; // M et L (24dp)
        if (this.options.size === 'xl') {
            iconSize = 32; // XL (32dp)
        }

        // Position de l'icône (padding depuis le bord du track)
        const iconPadding = 12; // 12dp de padding

        // Vérifier la direction (LTR/RTL)
        const isRTL = this.isRTL();

        // Calculer la position du handle en pixels
        const trackWidth = this.trackElement.offsetWidth;
        const handleWidth = config.handleWidth;
        const handleGap = config.handleGap; // Padding/gap transparent autour du handle

        // En RTL, le handle utilise right = percentage%, donc sa position depuis la gauche est inversée
        let handlePosition: number;
        if (isRTL) {
            // RTL : handle à right = percentage%, donc position depuis la gauche = trackWidth - (percentage% de trackWidth)
            handlePosition = trackWidth - (percentage / 100) * trackWidth;
        } else {
            // LTR : handle à left = percentage%, donc position depuis la gauche = percentage% de trackWidth
            handlePosition = (percentage / 100) * trackWidth;
        }

        // Position de l'icône depuis le bord gauche (LTR) ou droit (RTL)
        const iconPosition = isRTL ? trackWidth - iconPadding - iconSize / 2 : iconPadding + iconSize / 2;

        // Vérifier si l'icône serait cachée par le handle
        // Prendre en compte le handleGap (padding) pour ne basculer que quand le handle arrive vraiment
        const handleLeftEdge = handlePosition - handleWidth / 2 - handleGap;
        const handleRightEdge = handlePosition + handleWidth / 2 + handleGap;
        const iconLeftEdge = iconPosition - iconSize / 2;
        const iconRightEdge = iconPosition + iconSize / 2;

        // Vérifier si l'icône chevauche le handle (avec son padding)
        // En RTL, quand le handle est à 0% (à droite), l'icône est aussi à droite mais ne doit pas être considérée comme cachée
        // car elle doit rester visible sur le track inactif
        // En RTL à 100%, l'icône doit rester visible sur le track actif (comme en LTR à 100%)
        let wouldBeHidden = (iconRightEdge >= handleLeftEdge && iconLeftEdge <= handleRightEdge);
        // En RTL à 0%, ignorer la collision car l'icône doit rester visible sur le track inactif
        // En RTL à 100%, ignorer la collision car l'icône doit rester visible sur le track actif (comme en LTR)
        if (isRTL && (percentage <= 0 || percentage >= 100)) {
            wouldBeHidden = false;
        }

        // Déterminer sur quel track placer l'icône
        // En LTR : icône à gauche, track actif de gauche vers handle
        //   - Si handle > 0% : icône sur track actif (sauf si cachée)
        //   - Si handle = 0% : icône sur track inactif
        // En RTL : icône à droite, track actif de droite (100%) vers handle
        //   - Si handle <= 100% : icône sur track actif (sauf si cachée)
        //   - Si handle = 0% : icône sur track inactif (mais toujours visible)
        let shouldBeOnActiveTrack = false;
        if (isRTL) {
            // RTL : icône à droite, track actif de droite vers handle
            // L'icône est toujours sur le track actif sauf si :
            // 1. Le handle est à 0% (pas de track actif, mais icône visible sur track inactif)
            // 2. L'icône serait cachée par le handle (alors on bascule sur track inactif)
            // Note : À 100%, le track actif existe toujours (même très petit), donc l'icône reste sur le track actif
            if (percentage <= 0) {
                // Handle à 0% : pas de track actif à droite, icône sur track inactif (mais toujours visible)
                shouldBeOnActiveTrack = false;
            } else if (wouldBeHidden) {
                // Icône cachée par le handle : basculer sur track inactif
                shouldBeOnActiveTrack = false;
            } else {
                // Icône visible et handle > 0% (y compris à 100%) : sur track actif
                shouldBeOnActiveTrack = true;
            }
        } else {
            // LTR : icône à gauche, track actif de gauche vers handle
            // L'icône est toujours sur le track actif sauf si :
            // 1. Le handle est à 0% (pas de track actif à gauche)
            // 2. L'icône serait cachée par le handle (alors on bascule sur track inactif)
            if (percentage <= 0) {
                // Handle à 0% : pas de track actif à gauche, icône sur track inactif
                shouldBeOnActiveTrack = false;
            } else if (wouldBeHidden) {
                // Icône cachée par le handle : basculer sur track inactif
                shouldBeOnActiveTrack = false;
            } else {
                // Icône visible et handle > 0% : sur track actif
                shouldBeOnActiveTrack = true;
            }
        }

        // Retirer l'icône des deux tracks
        if (this.activeTrackElement.contains(this.iconElement)) {
            this.activeTrackElement.removeChild(this.iconElement);
        }
        if (this.inactiveTrackElement.contains(this.iconElement)) {
            this.inactiveTrackElement.removeChild(this.iconElement);
        }

        // Ajouter l'icône au bon track
        if (shouldBeOnActiveTrack) {
            this.activeTrackElement.appendChild(this.iconElement);
            this.iconElement.setAttribute('data-track', 'active');
        } else {
            this.inactiveTrackElement.appendChild(this.iconElement);
            this.iconElement.setAttribute('data-track', 'inactive');
        }
    }

    /**
     * Calcule le pourcentage pour une valeur donnée
     */
    private calculatePercentage(value: number): number {
        if (this.options.centered) {
            const range = this.options.max - this.options.min;
            const centerValue = (this.options.min + this.options.max) / 2;
            return Math.max(0, Math.min(100, 50 + ((value - centerValue) / range) * 100));
        }
        return ((value - this.options.min) / (this.options.max - this.options.min)) * 100;
    }

    /**
     * Met à jour la position et le style d'un handle
     */
    private updateHandle(
        handleElement: HTMLDivElement,
        percentage: number,
        value: number,
        isActive: boolean,
        isHandleActive: boolean,
        zIndex: number,
        config: typeof SliderSpecs.sizes.m
    ): void {
        const handleWidth = isHandleActive ? config.handleWidth * 0.85 : config.handleWidth;
        const handleHeight = config.handleHeight;

        if (isHandleActive) {
            handleElement.style.transition = 'none';
            handleElement.style.willChange = 'transform, left, bottom, width, height';
        }

        if (this.options.vertical) {
            handleElement.style.width = `${handleHeight}px`;
            handleElement.style.height = `${handleWidth}px`;
            handleElement.style.borderRadius = `${handleWidth / 2}px`;
            handleElement.style.bottom = `calc(${percentage}% - ${handleWidth / 2}px)`;
            handleElement.style.left = '50%';
            handleElement.style.transform = 'translateX(-50%)';
            handleElement.style.top = 'auto';
            handleElement.style.right = 'auto';
        } else {
            // Horizontal : gérer LTR/RTL
            const isRTL = this.isRTL();
            handleElement.style.width = `${handleWidth}px`;
            handleElement.style.height = `${handleHeight}px`;
            handleElement.style.borderRadius = `${handleWidth / 2}px`;
            handleElement.style.top = '50%';
            handleElement.style.transform = 'translateY(-50%)';
            handleElement.style.bottom = 'auto';

            // Pour range slider RTL, utiliser la logique LTR pour les handles
            const isRangeRTL = isRTL && this.options.range;
            if (isRTL && !isRangeRTL) {
                // RTL (sauf range) : positionner depuis la droite
                // En RTL, le pourcentage représente la position depuis la gauche (comme en LTR)
                // Mais on utilise right au lieu de left pour inverser visuellement
                // value = 0 → percentage = 0% → handle à droite → right = 0%
                // value = 100 → percentage = 100% → handle à gauche → right = 100%
                // Donc right = percentage (pas d'inversion)
                handleElement.style.right = `calc(${percentage}% - ${handleWidth / 2}px)`;
                handleElement.style.left = 'auto';
            } else {
                // LTR ou range RTL : positionner depuis la gauche
                handleElement.style.left = `calc(${percentage}% - ${handleWidth / 2}px)`;
                handleElement.style.right = 'auto';
            }
        }

        handleElement.style.zIndex = isHandleActive ? '30' : zIndex.toString();
        handleElement.style.display = 'block';
        handleElement.style.visibility = 'visible';
        handleElement.style.opacity = '1';

        if (isHandleActive) {
            handleElement.classList.add('slider__handle--active');
        } else {
            handleElement.classList.remove('slider__handle--active');
        }

        setAriaAttribute(handleElement, 'valuenow', value);
    }

    /**
     * Met à jour la position et le style d'une bulle de valeur
     */
    private updateValueLabel(
        labelElement: HTMLDivElement,
        percentage: number,
        value: number,
        handleWidth: number,
        isActive: boolean
    ): void {
        const labelContent = labelElement.querySelector('.slider__value-label-content') as HTMLElement;
        if (!labelContent) return;

        labelContent.textContent = Math.round(value).toString();

        if (isActive) {
            labelElement.style.transition = 'none';
            labelElement.style.willChange = 'transform, left, bottom';
        } else {
            labelElement.style.transition = '';
            labelElement.style.willChange = '';
        }

        // Déterminer la position par défaut selon l'orientation
        const defaultLabelPosition = this.options.vertical ? 'right' : 'top';
        const labelPosition = this.options.labelPosition || defaultLabelPosition;
        const labelMargin = 4; // 4dp de marge entre le handle et la bulle

        // Dimensions de la bulle (en mode vertical : 44dp haut, 48dp large)
        const labelHeight = this.options.vertical ? 44 : 44;
        const labelWidth = this.options.vertical ? 48 : 48;

        // Dimensions du handle (handleWidth est déjà passé en paramètre, on le recalcule pour le positionnement)
        const config = SliderSpecs.sizes[this.options.size];
        const actualHandleHeight = this.options.vertical ? config.handleWidth : config.handleHeight;
        const actualHandleWidth = this.options.vertical ? config.handleHeight : config.handleWidth;

        if (this.options.vertical && this.containerElement) {
            // Positionner la bulle par rapport à l'élément slider parent
            const containerRect = this.containerElement.getBoundingClientRect();
            const sliderRect = this.el.getBoundingClientRect();

            const containerLeft = containerRect.left - sliderRect.left;
            const containerTop = containerRect.top - sliderRect.top;
            const containerWidth = containerRect.width;
            const containerHeight = containerRect.height;
            const handlePositionFromBottom = (percentage / 100) * containerHeight;

            // Positionner horizontalement selon labelPosition
            // Le handle est centré sur le container, donc il dépasse de (actualHandleWidth - containerWidth) / 2 de chaque côté
            const handleLeftEdge = containerLeft - (actualHandleWidth - containerWidth) / 2;
            const handleRightEdge = containerLeft + containerWidth + (actualHandleWidth - containerWidth) / 2;

            if (labelPosition === 'left') {
                // À gauche du handle avec marge de 4dp
                labelElement.style.left = `${handleLeftEdge - labelMargin - labelWidth}px`;
                labelElement.style.transform = `translateX(0) translateY(50%)`;
                labelElement.setAttribute('data-label-position', 'left');
            } else {
                // À droite du handle avec marge de 4dp (par défaut ou 'right')
                labelElement.style.left = `${handleRightEdge + labelMargin}px`;
                labelElement.style.transform = `translateY(50%)`;
                labelElement.setAttribute('data-label-position', 'right');
            }

            // Positionner verticalement au niveau du handle (centré)
            labelElement.style.bottom = `${sliderRect.height - containerTop - containerHeight + handlePositionFromBottom}px`;
            labelElement.style.marginLeft = '0';
            labelElement.style.marginRight = '0';
            labelElement.style.marginBottom = '0';
            labelElement.style.marginTop = '0';
        } else if (!this.options.vertical && this.containerElement) {
            // Horizontal : gérer LTR/RTL
            const isRTL = this.isRTL();
            // Positionner la bulle par rapport à l'élément slider parent
            const containerRect = this.containerElement.getBoundingClientRect();
            const sliderRect = this.el.getBoundingClientRect();
            const containerLeft = containerRect.left - sliderRect.left;
            const containerTop = containerRect.top - sliderRect.top;
            const containerWidth = containerRect.width;
            const containerHeight = containerRect.height;

            // Calculer la position du handle dans le container
            // Pour range slider RTL, utiliser la logique LTR (handles avec left)
            const isRangeRTL = isRTL && this.options.range;
            let handlePositionFromContainerLeft: number;
            if (isRTL && !isRangeRTL) {
                // RTL (sauf range) : handle à right = percentage%, donc position depuis la gauche = containerWidth - (percentage% de containerWidth)
                handlePositionFromContainerLeft = containerWidth - (percentage / 100) * containerWidth;
            } else {
                // LTR ou range RTL : handle à left = percentage%, donc position depuis la gauche = percentage% de containerWidth
                handlePositionFromContainerLeft = (percentage / 100) * containerWidth;
            }

            // Positionner horizontalement au niveau du handle (centré)
            // La position depuis la gauche du slider = containerLeft + handlePositionFromContainerLeft
            const handlePositionFromSliderLeft = containerLeft + handlePositionFromContainerLeft;

            if (isRTL && !isRangeRTL) {
                // RTL (sauf range) : positionner depuis la droite du slider
                labelElement.style.right = `${sliderRect.width - handlePositionFromSliderLeft}px`;
                labelElement.style.left = 'auto';
                labelElement.style.transform = 'translateX(50%)';
            } else {
                // LTR ou range RTL : positionner depuis la gauche du slider
                labelElement.style.left = `${handlePositionFromSliderLeft}px`;
                labelElement.style.right = 'auto';
                labelElement.style.transform = 'translateX(-50%)';
            }

            // Positionner verticalement selon labelPosition
            // Le handle dépasse du container, donc il faut tenir compte de sa hauteur
            const handleTopEdge = containerTop - (actualHandleHeight - containerHeight) / 2;
            const handleBottomEdge = containerTop + containerHeight + (actualHandleHeight - containerHeight) / 2;

            if (labelPosition === 'bottom') {
                // En dessous du handle avec marge de 4dp
                labelElement.style.top = `${handleBottomEdge + labelMargin}px`;
                labelElement.style.bottom = 'auto';
                labelElement.setAttribute('data-label-position', 'bottom');
            } else {
                // Au-dessus du handle avec marge de 4dp (par défaut ou 'top')
                labelElement.style.bottom = `${sliderRect.height - handleTopEdge + labelMargin}px`;
                labelElement.style.top = 'auto';
                labelElement.setAttribute('data-label-position', 'top');
            }

            labelElement.style.marginBottom = '0';
            labelElement.style.marginTop = '0';
            labelElement.style.marginLeft = '0';
            labelElement.style.marginRight = '0';
        } else {
            // Fallback : positionnement par rapport au container (ancien code)
            if (this.options.vertical) {
                // Position verticale au niveau du handle
                labelElement.style.bottom = `calc(${percentage}% - ${actualHandleWidth / 2}px)`;

                // Position horizontale avec marge de 4dp
                if (labelPosition === 'left') {
                    // À gauche : positionner le bord droit de la bulle à 4dp du bord gauche du handle
                    labelElement.style.left = `calc(${percentage}% - ${actualHandleWidth / 2}px - ${labelMargin}px - ${labelWidth}px)`;
                    labelElement.style.transform = `translateX(0) translateY(calc(-50% + ${actualHandleWidth / 2}px)) rotate(90deg)`;
                } else {
                    // À droite : positionner le bord gauche de la bulle à 4dp du bord droit du handle
                    labelElement.style.left = `calc(${percentage}% + ${actualHandleWidth / 2}px + ${labelMargin}px)`;
                    labelElement.style.transform = `translateY(calc(-50% + ${actualHandleWidth / 2}px)) rotate(90deg)`;
                }
                labelElement.style.marginLeft = '0';
                labelElement.style.marginRight = '0';
                labelElement.style.marginBottom = '0';
            } else {
                // Position horizontale au niveau du handle
                labelElement.style.left = `calc(${percentage}% - ${handleWidth / 2}px)`;
                labelElement.style.transform = `translateX(calc(-50% + ${handleWidth / 2}px))`;

                // Position verticale avec marge de 4dp
                if (labelPosition === 'bottom') {
                    // En dessous : positionner le haut de la bulle à 4dp du bas du handle
                    labelElement.style.top = `calc(${percentage}% + ${actualHandleHeight / 2}px + ${labelMargin}px)`;
                    labelElement.style.bottom = 'auto';
                } else {
                    // Au-dessus : positionner le bas de la bulle à 4dp du haut du handle
                    labelElement.style.bottom = `calc(${percentage}% + ${actualHandleHeight / 2}px + ${labelMargin}px)`;
                    labelElement.style.top = 'auto';
                }
                labelElement.style.marginBottom = '0';
                labelElement.style.marginTop = '0';
                labelElement.style.marginLeft = '0';
            }
        }

        if (isActive) {
            labelElement.style.display = 'block';
            labelElement.style.visibility = 'visible';
            // Ajouter la classe --visible pour déclencher l'animation
            labelElement.classList.add('slider__value-label--visible');
            // Augmenter le z-index de l'élément parent pour que la bulle soit au-dessus des autres sliders
            this.el.style.zIndex = '1000';
            this.el.style.position = 'relative';
            // S'assurer que l'overflow est visible pour permettre à la bulle de dépasser
            this.el.style.overflow = 'visible';
            if (this.containerElement) {
                this.containerElement.style.overflow = 'visible';
            }
        } else {
            // Retirer la classe --visible pour déclencher l'animation de fermeture
            labelElement.classList.remove('slider__value-label--visible');
            // L'animation de fermeture est gérée par CSS via les transitions
            // Réinitialiser le z-index seulement si le drag est terminé (vérifié dans handleEnd)
        }
    }

    /**
     * Gère les transitions des tracks pendant le drag
     */
    private setTrackTransitions(isActive: boolean): void {
        const willChange = 'transform, left, right, top, bottom, width, height';
        const transition = isActive ? 'none' : '';

        const tracks = [
            this.activeTrackElement,
            this.inactiveTrackElement,
            this.inactiveTrackBeforeElement,
            this.inactiveTrackAfterElement
        ];

        tracks.forEach(track => {
            if (track) {
                track.style.transition = transition;
                track.style.willChange = isActive ? willChange : '';
            }
        });

        if (this.trackElement && this.options.centered) {
            const inactiveTrackRight = this.trackElement.querySelector('.slider__track-inactive-right') as HTMLDivElement;
            if (inactiveTrackRight) {
                inactiveTrackRight.style.transition = transition;
                inactiveTrackRight.style.willChange = isActive ? willChange : '';
            }
        }
    }

    /**
     * Met à jour l'état visuel du composant
     */
    private updateVisualState(): void {
        if (!this.trackElement || !this.activeTrackElement || !this.inactiveTrackElement) return;

        const config = SliderSpecs.sizes[this.options.size];
        const isActive = this.isDragging;

        // Créer les labels s'ils n'existent pas et si showValueLabel est activé
        if (this.options.showValueLabel !== false) {
            if (this.options.range) {
                if (!this.valueLabelStartElement) {
                    this.valueLabelStartElement = this.createValueLabel();
                }
                if (!this.valueLabelEndElement) {
                    this.valueLabelEndElement = this.createValueLabel();
                }
            } else {
                if (!this.valueLabelElement) {
                    this.valueLabelElement = this.createValueLabel();
                }
            }
        }

        // Gérer les transitions des tracks
        this.setTrackTransitions(isActive);

        // Mettre à jour la position de l'icône inset
        if (this.iconElement) {
            this.updateIconPosition();
            // Forcer la mise à jour de l'icône après repositionnement
            const iconInner = this.iconElement.querySelector('i.k3ui-icon') as HTMLElement;
            if (iconInner && iconInner.hasAttribute('name')) {
                IconManager.updateIcon(iconInner);
            }
        }

        // Calculer les pourcentages
        const percentage = this.calculatePercentage(this.currentValue);
        const percentageStart = this.calculatePercentage(this.currentValueStart);
        const percentageEnd = this.calculatePercentage(this.currentValueEnd);
        const centerPercentage = 50;

        const isPositive = this.options.centered ? (this.options.range ? this.currentValueStart > 0 : this.currentValue > 0) : true;

        // Mettre à jour les handles et bulles
        if (this.options.range) {
            // Range slider
            if (this.handleStartElement) {
                const isHandleActive = isActive && this.activeHandle === 'start';
                const handleWidth = isHandleActive ? config.handleWidth * 0.85 : config.handleWidth;
                this.updateHandle(
                    this.handleStartElement,
                    percentageStart,
                    this.currentValueStart,
                    isActive,
                    isHandleActive,
                    21,
                    config
                );
                // Pour range slider RTL, utiliser la logique LTR pour position, mais inverser les valeurs affichées
                const isRTL = this.isRTL();
                if (this.valueLabelStartElement) {
                    if (isRTL && this.options.range) {
                        // RTL range : bulle start affiche la valeur inversée de start (0 = 100, 100 = 0)
                        const invertedValue = this.options.max - this.currentValueStart + this.options.min;
                        this.updateValueLabel(
                            this.valueLabelStartElement,
                            percentageStart,
                            invertedValue,
                            handleWidth,
                            isHandleActive
                        );
                    } else {
                        // LTR ou single : bulle start normale
                        this.updateValueLabel(
                            this.valueLabelStartElement,
                            percentageStart,
                            this.currentValueStart,
                            handleWidth,
                            isHandleActive
                        );
                    }
                }
            }
            if (this.handleEndElement) {
                const isHandleActive = isActive && this.activeHandle === 'end';
                const handleWidth = isHandleActive ? config.handleWidth * 0.85 : config.handleWidth;
                this.updateHandle(
                    this.handleEndElement,
                    percentageEnd,
                    this.currentValueEnd,
                    isActive,
                    isHandleActive,
                    22,
                    config
                );
                // Pour range slider RTL, utiliser la logique LTR pour position, mais inverser les valeurs affichées
                const isRTL = this.isRTL();
                if (this.valueLabelEndElement) {
                    if (isRTL && this.options.range) {
                        // RTL range : bulle end affiche la valeur inversée de end (0 = 100, 100 = 0)
                        const invertedValue = this.options.max - this.currentValueEnd + this.options.min;
                        this.updateValueLabel(
                            this.valueLabelEndElement,
                            percentageEnd,
                            invertedValue,
                            handleWidth,
                            isHandleActive
                        );
                    } else {
                        // LTR ou single : bulle end normale
                        this.updateValueLabel(
                            this.valueLabelEndElement,
                            percentageEnd,
                            this.currentValueEnd,
                            handleWidth,
                            isHandleActive
                        );
                    }
                }
            }

            // Mettre à jour les tracks pour range slider
            if (!this.inactiveTrackBeforeElement && this.options.range) {
                this.inactiveTrackBeforeElement = document.createElement('div');
                this.inactiveTrackBeforeElement.className = 'slider__track-inactive';
                this.trackElement.appendChild(this.inactiveTrackBeforeElement);
            }
            if (!this.inactiveTrackAfterElement && this.options.range) {
                this.inactiveTrackAfterElement = document.createElement('div');
                this.inactiveTrackAfterElement.className = 'slider__track-inactive';
                this.trackElement.appendChild(this.inactiveTrackAfterElement);
            }

            // Range slider : uniquement horizontal (pas de support vertical)
            // Pour RTL range, utiliser la logique LTR pour les tracks et handles
            // Seules les bulles sont inversées (fait ci-dessus)
            // LTR : track actif de gauche (min) vers les handles
            this.activeTrackElement.style.height = '100%';
            this.activeTrackElement.style.top = '0';
            this.activeTrackElement.style.bottom = 'auto';
            this.activeTrackElement.style.left = `calc(${percentageStart}% + ${config.handleGap + config.handleWidth / 2}px)`;
            this.activeTrackElement.style.right = 'auto';
            this.activeTrackElement.style.width = `calc(${percentageEnd - percentageStart}% - ${(config.handleGap + config.handleWidth / 2) * 2}px)`;
            this.activeTrackElement.style.borderRadius = `${config.innerRadius}px`;
            // Désactiver les transitions pour éviter l'animation indésirable du track actif
            // qui le fait défiler depuis la gauche en RTL/LTR et en disabled
            // Utiliser setProperty avec !important pour surcharger le CSS
            if (this.activeTrackElement) {
                this.activeTrackElement.style.setProperty('transition', 'none', 'important');
            }

            // Track inactif avant (de 0 à start)
            if (this.inactiveTrackBeforeElement) {
                this.inactiveTrackBeforeElement.style.display = 'block';
                this.inactiveTrackBeforeElement.style.visibility = 'visible';
                this.inactiveTrackBeforeElement.style.opacity = '1';
                this.inactiveTrackBeforeElement.style.left = '0';
                this.inactiveTrackBeforeElement.style.right = 'auto';
                this.inactiveTrackBeforeElement.style.width = `calc(${percentageStart}% - ${config.handleGap + config.handleWidth / 2}px)`;
                this.inactiveTrackBeforeElement.style.height = '100%';
                this.inactiveTrackBeforeElement.style.top = '0';
                this.inactiveTrackBeforeElement.style.bottom = 'auto';
                this.inactiveTrackBeforeElement.style.borderRadius = `${config.trackShape}px`;
                this.inactiveTrackBeforeElement.style.borderTopRightRadius = `${config.innerRadius}px`;
                this.inactiveTrackBeforeElement.style.borderBottomRightRadius = `${config.innerRadius}px`;
                this.inactiveTrackBeforeElement.style.backgroundColor = getComputedStyle(this.inactiveTrackElement).backgroundColor;
                this.inactiveTrackBeforeElement.style.zIndex = '0';
            }

            // Track inactif après (de end à 100%)
            if (this.inactiveTrackAfterElement) {
                this.inactiveTrackAfterElement.style.display = 'block';
                this.inactiveTrackAfterElement.style.visibility = 'visible';
                this.inactiveTrackAfterElement.style.opacity = '1';
                this.inactiveTrackAfterElement.style.right = '0';
                this.inactiveTrackAfterElement.style.left = 'auto';
                this.inactiveTrackAfterElement.style.width = `calc(${100 - percentageEnd}% - ${config.handleGap + config.handleWidth / 2}px)`;
                this.inactiveTrackAfterElement.style.height = '100%';
                this.inactiveTrackAfterElement.style.top = '0';
                this.inactiveTrackAfterElement.style.bottom = 'auto';
                this.inactiveTrackAfterElement.style.borderRadius = `${config.trackShape}px`;
                this.inactiveTrackAfterElement.style.borderTopLeftRadius = `${config.innerRadius}px`;
                this.inactiveTrackAfterElement.style.borderBottomLeftRadius = `${config.innerRadius}px`;
                this.inactiveTrackAfterElement.style.backgroundColor = getComputedStyle(this.inactiveTrackElement).backgroundColor;
                this.inactiveTrackAfterElement.style.zIndex = '0';
            }

            // Cacher l'ancien track inactif pour range
            this.inactiveTrackElement.style.display = 'none';
        } else {
            // Single slider
            if (this.handleElement) {
                const handleWidth = isActive ? config.handleWidth * 0.85 : config.handleWidth;
                this.updateHandle(
                    this.handleElement,
                    percentage,
                    this.currentValue,
                    isActive,
                    isActive,
                    20,
                    config
                );
                if (this.options.vertical) {
                    this.handleElement.style.maxWidth = 'none';
                    this.handleElement.style.maxHeight = 'none';
                }
                if (this.valueLabelElement) {
                    this.updateValueLabel(
                        this.valueLabelElement,
                        percentage,
                        this.currentValue,
                        handleWidth,
                        isActive
                    );
                }
            }

            // Mettre à jour les tracks pour single slider
            if (this.options.centered) {
                // Mode centered
                if (this.options.vertical) {
                    // Vertical centered : exactement comme horizontal centered mais tourné de 90°
                    // Valeurs positives en haut (comme à droite en horizontal), négatives en bas (comme à gauche en horizontal)
                    this.activeTrackElement.style.width = '100%';
                    this.activeTrackElement.style.left = '0';
                    this.activeTrackElement.style.right = 'auto';
                    if (isPositive || percentage >= centerPercentage) {
                        // Valeur positive : track actif du centre vers le haut (comme vers la droite en horizontal)
                        const activeHeight = Math.max(0, percentage - centerPercentage);
                        this.activeTrackElement.style.height = activeHeight > 0
                            ? `calc(${activeHeight}% - ${config.handleGap + config.handleWidth / 2}px)`
                            : '0px';
                        this.activeTrackElement.style.bottom = `${centerPercentage}%`;
                        this.activeTrackElement.style.top = 'auto';
                        this.activeTrackElement.style.borderRadius = `${config.innerRadius}px`;
                        this.activeTrackElement.style.borderTopLeftRadius = '0';
                        this.activeTrackElement.style.borderTopRightRadius = '0';
                        this.activeTrackElement.style.borderBottomLeftRadius = `${config.innerRadius}px`;
                        this.activeTrackElement.style.borderBottomRightRadius = `${config.innerRadius}px`;
                    } else {
                        // Valeur négative : track actif du centre vers le bas (comme vers la gauche en horizontal)
                        const activeHeight = Math.max(0, centerPercentage - percentage);
                        this.activeTrackElement.style.height = activeHeight > 0
                            ? `calc(${activeHeight}% - ${config.handleGap + config.handleWidth / 2}px)`
                            : '0px';
                        this.activeTrackElement.style.top = `${centerPercentage}%`;
                        this.activeTrackElement.style.bottom = 'auto';
                        this.activeTrackElement.style.borderRadius = `${config.innerRadius}px`;
                        this.activeTrackElement.style.borderBottomLeftRadius = '0';
                        this.activeTrackElement.style.borderBottomRightRadius = '0';
                        this.activeTrackElement.style.borderTopLeftRadius = `${config.innerRadius}px`;
                        this.activeTrackElement.style.borderTopRightRadius = `${config.innerRadius}px`;
                    }
                } else {
                    // Horizontal centered : calculer en LTR puis inverser pour RTL
                    const isRTL = this.isRTL();
                    this.activeTrackElement.style.height = '100%';
                    this.activeTrackElement.style.top = '0';
                    this.activeTrackElement.style.bottom = 'auto';

                    // Calculer les valeurs comme en LTR
                    let activeWidth: number;
                    let activeLeft: string;
                    let activeRight: string;
                    let borderTopLeftRadius: string;
                    let borderTopRightRadius: string;
                    let borderBottomLeftRadius: string;
                    let borderBottomRightRadius: string;

                    if (isPositive || percentage >= centerPercentage) {
                        // Valeur positive : track actif du centre vers la droite (LTR)
                        activeWidth = Math.max(0, percentage - centerPercentage);
                        activeLeft = `${centerPercentage}%`;
                        activeRight = 'auto';
                        borderTopLeftRadius = '0';
                        borderTopRightRadius = `${config.innerRadius}px`;
                        borderBottomLeftRadius = '0';
                        borderBottomRightRadius = `${config.innerRadius}px`;
                    } else {
                        // Valeur négative : track actif du centre vers la gauche (LTR)
                        activeWidth = Math.max(0, centerPercentage - percentage);
                        activeLeft = 'auto';
                        activeRight = `${100 - centerPercentage}%`;
                        borderTopLeftRadius = `${config.innerRadius}px`;
                        borderTopRightRadius = '0';
                        borderBottomLeftRadius = `${config.innerRadius}px`;
                        borderBottomRightRadius = '0';
                    }

                    // Appliquer les valeurs (inverser left/right pour RTL)
                    this.activeTrackElement.style.width = activeWidth > 0
                        ? `calc(${activeWidth}% - ${config.handleGap + config.handleWidth / 2}px)`
                        : '0px';

                    if (isRTL) {
                        // RTL : inverser left ↔ right et border radius
                        this.activeTrackElement.style.left = activeRight;
                        this.activeTrackElement.style.right = activeLeft;
                        this.activeTrackElement.style.borderTopLeftRadius = borderTopRightRadius;
                        this.activeTrackElement.style.borderTopRightRadius = borderTopLeftRadius;
                        this.activeTrackElement.style.borderBottomLeftRadius = borderBottomRightRadius;
                        this.activeTrackElement.style.borderBottomRightRadius = borderBottomLeftRadius;
                    } else {
                        // LTR : valeurs normales
                        this.activeTrackElement.style.left = activeLeft;
                        this.activeTrackElement.style.right = activeRight;
                        this.activeTrackElement.style.borderTopLeftRadius = borderTopLeftRadius;
                        this.activeTrackElement.style.borderTopRightRadius = borderTopRightRadius;
                        this.activeTrackElement.style.borderBottomLeftRadius = borderBottomLeftRadius;
                        this.activeTrackElement.style.borderBottomRightRadius = borderBottomRightRadius;
                    }

                    this.activeTrackElement.style.borderRadius = `${config.innerRadius}px`;
                }

                // Tracks inactifs pour centered
                if (this.options.vertical) {
                    // Track inactif bas : comme track inactif gauche en horizontal (de 0% au centre ou au handle)
                    this.inactiveTrackElement.style.width = '100%';
                    this.inactiveTrackElement.style.left = '0';
                    this.inactiveTrackElement.style.right = 'auto';
                    this.inactiveTrackElement.style.bottom = '0';
                    this.inactiveTrackElement.style.top = 'auto';
                    this.inactiveTrackElement.style.position = 'absolute';
                    // Pour valeurs positives : de 0% au centre (50%)
                    // Pour valeurs négatives : de 0% au handle (percentage)
                    if (isPositive || percentage >= centerPercentage) {
                        // Valeur positive : track inactif bas de 0% au centre
                        const inactiveBottomHeight = centerPercentage;
                        this.inactiveTrackElement.style.height = inactiveBottomHeight > 0
                            ? `calc(${inactiveBottomHeight}% - ${config.handleGap + config.handleWidth / 2}px)`
                            : '0px';
                        // Le bottom reste à 0, le gap est créé par la réduction de la hauteur
                    } else {
                        // Valeur négative : track inactif bas de 0% au handle
                        const inactiveBottomHeight = percentage;
                        // Ajuster le bottom pour créer le gap depuis le handle
                        this.inactiveTrackElement.style.bottom = `calc(${config.handleGap + config.handleWidth / 2}px)`;
                        this.inactiveTrackElement.style.height = inactiveBottomHeight > 0
                            ? `calc(${inactiveBottomHeight}% - ${config.handleGap + config.handleWidth / 2}px)`
                            : '0px';
                    }
                    this.inactiveTrackElement.style.borderRadius = `${config.trackShape}px`;
                    this.inactiveTrackElement.style.borderTopLeftRadius = `${config.innerRadius}px`;
                    this.inactiveTrackElement.style.borderTopRightRadius = `${config.innerRadius}px`;
                } else {
                    // Horizontal centered : calculer en LTR puis inverser pour RTL
                    const isRTL = this.isRTL();
                    this.inactiveTrackElement.style.height = '100%';
                    this.inactiveTrackElement.style.top = '0';
                    this.inactiveTrackElement.style.bottom = 'auto';

                    // Track inactif gauche : de 0% jusqu'au centre (si positif ou >= 50%) ou jusqu'au handle (si négatif)
                    const inactiveLeftWidth = (isPositive || percentage >= centerPercentage)
                        ? centerPercentage
                        : percentage;

                    // Calculer comme en LTR
                    // Track inactif gauche : côté gauche (0%) = trackShape, côté droit (près handle/centre) = innerRadius (2dp) en haut et en bas
                    const inactiveLeft = '0';
                    const inactiveRight = 'auto';
                    const borderTopLeftRadius = `${config.trackShape}px`; // Coin extérieur gauche
                    const borderTopRightRadius = `${config.innerRadius}px`; // Près du handle/centre (2dp)
                    const borderBottomLeftRadius = `${config.trackShape}px`; // Coin extérieur gauche
                    const borderBottomRightRadius = `${config.innerRadius}px`; // Près du handle/centre (2dp)

                    // Appliquer (inverser pour RTL)
                    if (isRTL) {
                        this.inactiveTrackElement.style.left = inactiveRight;
                        this.inactiveTrackElement.style.right = inactiveLeft;
                        this.inactiveTrackElement.style.borderTopLeftRadius = borderTopRightRadius;
                        this.inactiveTrackElement.style.borderTopRightRadius = borderTopLeftRadius;
                        this.inactiveTrackElement.style.borderBottomLeftRadius = borderBottomRightRadius;
                        this.inactiveTrackElement.style.borderBottomRightRadius = borderBottomLeftRadius;
                    } else {
                        this.inactiveTrackElement.style.left = inactiveLeft;
                        this.inactiveTrackElement.style.right = inactiveRight;
                        this.inactiveTrackElement.style.borderTopLeftRadius = borderTopLeftRadius;
                        this.inactiveTrackElement.style.borderTopRightRadius = borderTopRightRadius;
                        this.inactiveTrackElement.style.borderBottomLeftRadius = borderBottomLeftRadius;
                        this.inactiveTrackElement.style.borderBottomRightRadius = borderBottomRightRadius;
                    }

                    this.inactiveTrackElement.style.width = inactiveLeftWidth > 0
                        ? `calc(${inactiveLeftWidth}% - ${config.handleGap + config.handleWidth / 2}px)`
                        : '0px';
                    // Ne pas définir borderRadius général pour éviter d'écraser les border radius spécifiques
                }

                // Track inactif droit/haut pour centered
                let inactiveTrackRight = this.trackElement.querySelector('.slider__track-inactive-right') as HTMLDivElement;
                if (!inactiveTrackRight && this.options.centered) {
                    inactiveTrackRight = document.createElement('div');
                    inactiveTrackRight.className = 'slider__track-inactive-right';
                    this.trackElement.appendChild(inactiveTrackRight);
                }
                if (inactiveTrackRight) {
                    inactiveTrackRight.style.display = 'block';
                    inactiveTrackRight.style.visibility = 'visible';
                    inactiveTrackRight.style.opacity = '1';
                    if (this.options.vertical) {
                        // Track inactif haut : comme track inactif droit en horizontal (du handle ou du centre vers 100%)
                        inactiveTrackRight.style.width = '100%';
                        inactiveTrackRight.style.left = '0';
                        inactiveTrackRight.style.right = 'auto';
                        inactiveTrackRight.style.top = 'auto';
                        inactiveTrackRight.style.position = 'absolute';
                        // Pour valeurs positives : du handle (percentage) jusqu'à 100% (en haut)
                        // Pour valeurs négatives : du centre (50%) jusqu'à 100% (en haut)
                        if (isPositive || percentage >= centerPercentage) {
                            // Valeur positive : track inactif haut du handle jusqu'en haut
                            // percentage est depuis le bas, donc bottom = percentage + gap et height = 100% - percentage - gap
                            const inactiveTopHeight = 100 - percentage;
                            // Ajuster le bottom pour créer le gap (comme en horizontal avec left)
                            inactiveTrackRight.style.bottom = `calc(${percentage}% + ${config.handleGap + config.handleWidth / 2}px)`;
                            inactiveTrackRight.style.height = inactiveTopHeight > 0
                                ? `calc(${inactiveTopHeight}% - ${config.handleGap + config.handleWidth / 2}px)`
                                : '0px';
                        } else {
                            // Valeur négative : track inactif haut du centre jusqu'en haut
                            const inactiveTopHeight = 100 - centerPercentage;
                            // Ajuster le bottom pour créer le gap depuis le centre
                            inactiveTrackRight.style.bottom = `calc(${centerPercentage}% + ${config.handleGap + config.handleWidth / 2}px)`;
                            inactiveTrackRight.style.height = inactiveTopHeight > 0
                                ? `calc(${inactiveTopHeight}% - ${config.handleGap + config.handleWidth / 2}px)`
                                : '0px';
                        }
                        inactiveTrackRight.style.backgroundColor = getComputedStyle(this.inactiveTrackElement).backgroundColor;
                        inactiveTrackRight.style.zIndex = '0';
                        inactiveTrackRight.style.borderRadius = `${config.trackShape}px`;
                        inactiveTrackRight.style.borderTopLeftRadius = `${config.trackShape}px`;
                        inactiveTrackRight.style.borderTopRightRadius = `${config.trackShape}px`;
                        inactiveTrackRight.style.borderBottomLeftRadius = `${config.innerRadius}px`;
                        inactiveTrackRight.style.borderBottomRightRadius = `${config.innerRadius}px`;
                    } else {
                        // Horizontal centered : calculer en LTR puis inverser pour RTL
                        const isRTL = this.isRTL();
                        inactiveTrackRight.style.height = '100%';
                        inactiveTrackRight.style.top = '0';
                        inactiveTrackRight.style.bottom = 'auto';

                        // Track inactif droit : du handle (si positif ou >= 50%) ou du centre (si négatif) jusqu'à 100%
                        const inactiveRightWidth = (isPositive || percentage >= centerPercentage)
                            ? 100 - percentage
                            : 100 - centerPercentage;

                        // Calculer comme en LTR
                        // Track inactif droit : côté gauche (près handle/centre) = innerRadius (2dp) en haut et en bas, côté droit (100%) = trackShape
                        const inactiveRight = '0';
                        const inactiveLeft = 'auto';
                        const borderTopLeftRadius = `${config.innerRadius}px`; // Près du handle/centre (2dp)
                        const borderTopRightRadius = `${config.trackShape}px`; // Coin extérieur droit
                        const borderBottomLeftRadius = `${config.innerRadius}px`; // Près du handle/centre (2dp)
                        const borderBottomRightRadius = `${config.trackShape}px`; // Coin extérieur droit

                        // Appliquer (inverser pour RTL)
                        if (isRTL) {
                            inactiveTrackRight.style.left = inactiveRight;
                            inactiveTrackRight.style.right = inactiveLeft;
                            inactiveTrackRight.style.borderTopLeftRadius = borderTopRightRadius;
                            inactiveTrackRight.style.borderTopRightRadius = borderTopLeftRadius;
                            inactiveTrackRight.style.borderBottomLeftRadius = borderBottomRightRadius;
                            inactiveTrackRight.style.borderBottomRightRadius = borderBottomLeftRadius;
                        } else {
                            inactiveTrackRight.style.left = inactiveLeft;
                            inactiveTrackRight.style.right = inactiveRight;
                            inactiveTrackRight.style.borderTopLeftRadius = borderTopLeftRadius;
                            inactiveTrackRight.style.borderTopRightRadius = borderTopRightRadius;
                            inactiveTrackRight.style.borderBottomLeftRadius = borderBottomLeftRadius;
                            inactiveTrackRight.style.borderBottomRightRadius = borderBottomRightRadius;
                        }

                        inactiveTrackRight.style.width = inactiveRightWidth > 0
                            ? `calc(${inactiveRightWidth}% - ${config.handleGap + config.handleWidth / 2}px)`
                            : '0px';
                        inactiveTrackRight.style.backgroundColor = getComputedStyle(this.inactiveTrackElement).backgroundColor;
                        inactiveTrackRight.style.zIndex = '0';
                        // Ne pas définir borderRadius général pour éviter d'écraser les border radius spécifiques
                    }
                }
            } else {
                // Mode standard
                if (this.options.vertical) {
                    // Vertical : track actif en bas (de 0 à percentage)
                    this.activeTrackElement.style.width = '100%';
                    this.activeTrackElement.style.height = `calc(${percentage}% - ${config.handleGap + config.handleWidth / 2}px)`;
                    this.activeTrackElement.style.bottom = '0';
                    this.activeTrackElement.style.left = '0';
                    this.activeTrackElement.style.top = 'auto';
                    this.activeTrackElement.style.right = 'auto';
                    this.activeTrackElement.style.borderRadius = `${config.trackShape}px`;
                    this.activeTrackElement.style.borderTopLeftRadius = `${config.innerRadius}px`;
                    this.activeTrackElement.style.borderTopRightRadius = `${config.innerRadius}px`;

                    // Vertical : track inactif en haut (de percentage à 100%)
                    this.inactiveTrackElement.style.width = '100%';
                    this.inactiveTrackElement.style.height = `calc(${100 - percentage}% - ${config.handleGap + config.handleWidth / 2}px)`;
                    this.inactiveTrackElement.style.top = '0';
                    this.inactiveTrackElement.style.left = '0';
                    this.inactiveTrackElement.style.bottom = 'auto';
                    this.inactiveTrackElement.style.right = 'auto';
                    this.inactiveTrackElement.style.borderRadius = `${config.trackShape}px`;
                    this.inactiveTrackElement.style.borderBottomLeftRadius = `${config.innerRadius}px`;
                    this.inactiveTrackElement.style.borderBottomRightRadius = `${config.innerRadius}px`;
                } else {
                    // Horizontal : gérer LTR/RTL
                    const isRTL = this.isRTL();
                    // Définir la hauteur pour les tracks horizontaux
                    this.activeTrackElement.style.height = '100%';
                    this.activeTrackElement.style.top = '0';
                    this.activeTrackElement.style.bottom = 'auto';
                    this.inactiveTrackElement.style.height = '100%';
                    this.inactiveTrackElement.style.top = '0';
                    this.inactiveTrackElement.style.bottom = 'auto';

                    if (isRTL) {
                        // RTL : track actif de droite (max) vers le handle
                        this.activeTrackElement.style.width = `calc(${percentage}% - ${config.handleGap + config.handleWidth / 2}px)`;
                        this.activeTrackElement.style.right = '0';
                        this.activeTrackElement.style.left = 'auto';
                        this.activeTrackElement.style.borderRadius = `${config.trackShape}px`;
                        this.activeTrackElement.style.borderTopLeftRadius = `${config.innerRadius}px`;
                        this.activeTrackElement.style.borderBottomLeftRadius = `${config.innerRadius}px`;

                        this.inactiveTrackElement.style.width = `calc(${100 - percentage}% - ${config.handleGap + config.handleWidth / 2}px)`;
                        this.inactiveTrackElement.style.left = '0';
                        this.inactiveTrackElement.style.right = 'auto';
                        this.inactiveTrackElement.style.borderRadius = `${config.trackShape}px`;
                        this.inactiveTrackElement.style.borderTopRightRadius = `${config.innerRadius}px`;
                        this.inactiveTrackElement.style.borderBottomRightRadius = `${config.innerRadius}px`;
                    } else {
                        // LTR : track actif de gauche (min) vers le handle
                        this.activeTrackElement.style.width = `calc(${percentage}% - ${config.handleGap + config.handleWidth / 2}px)`;
                        this.activeTrackElement.style.left = '0';
                        this.activeTrackElement.style.right = 'auto';
                        this.activeTrackElement.style.borderRadius = `${config.trackShape}px`;
                        this.activeTrackElement.style.borderTopRightRadius = `${config.innerRadius}px`;
                        this.activeTrackElement.style.borderBottomRightRadius = `${config.innerRadius}px`;

                        this.inactiveTrackElement.style.width = `calc(${100 - percentage}% - ${config.handleGap + config.handleWidth / 2}px)`;
                        this.inactiveTrackElement.style.right = '0';
                        this.inactiveTrackElement.style.left = 'auto';
                        this.inactiveTrackElement.style.borderRadius = `${config.trackShape}px`;
                        this.inactiveTrackElement.style.borderTopLeftRadius = `${config.innerRadius}px`;
                        this.inactiveTrackElement.style.borderBottomLeftRadius = `${config.innerRadius}px`;
                    }
                }
            }
        }

        // Mettre à jour les stop indicators
        this.updateStopIndicators();

        // Mettre à jour les points discrets
        if (this.options.discrete && this.trackElement) {
            const discretePoints = this.trackElement.querySelectorAll('.slider__discrete-point');
            const currentValue = this.options.range ? this.currentValueStart : this.currentValue;
            const handleWidth = config.handleWidth;

            const allTickValues: number[] = [];
            const totalSteps = Math.floor((this.options.max - this.options.min) / this.options.step);
            for (let i = 1; i < totalSteps; i++) {
                const tickValue = this.options.min + (i * this.options.step);
                if (tickValue > this.options.min && tickValue < this.options.max) {
                    allTickValues.push(tickValue);
                }
            }

            discretePoints.forEach((point, i) => {
                const tickValue = allTickValues[i];
                if (tickValue === undefined) return;

                const pointElement = point as HTMLElement;

                // Cacher le discrete point si il est à la position exacte du handle
                const isAtHandlePosition = this.isValueNear(tickValue, currentValue);
                this.setElementVisibility(pointElement, isAtHandlePosition);
                if (isAtHandlePosition) return;

                const tickPercentage = this.calculatePercentage(tickValue);
                const isOnActiveTrack = this.isDiscretePointOnActiveTrack(tickValue, currentValue);

                // Mettre à jour la classe active
                point.classList.toggle('slider__discrete-point--active', isOnActiveTrack);

                // Positionner le point
                this.positionDiscretePoint(pointElement, tickPercentage, handleWidth);
            });
        }
    }

    /**
     * Vérifie si une valeur est proche d'une autre (avec tolérance)
     * @param value Valeur à comparer
     * @param target Valeur cible
     * @returns true si les valeurs sont proches
     */
    private isValueNear(value: number, target: number): boolean {
        return Math.abs(value - target) < Slider.VALUE_EPSILON;
    }

    /**
     * Détermine si un discrete point est sur le track actif
     * @param tickValue Valeur du tick
     * @param currentValue Valeur actuelle du handle
     * @returns true si le point est sur le track actif
     */
    private isDiscretePointOnActiveTrack(tickValue: number, currentValue: number): boolean {
        if (this.options.centered) {
            // Mode centered : track actif du centre vers le handle
            const centerValue = (this.options.min + this.options.max) / 2;
            const isPositive = currentValue >= centerValue;

            if (isPositive) {
                // Valeur positive : track actif du centre vers le handle (vers le haut/droite)
                return tickValue >= centerValue && tickValue <= currentValue;
            } else {
                // Valeur négative : track actif du centre vers le handle (vers le bas/gauche)
                return tickValue <= centerValue && tickValue >= currentValue;
            }
        } else {
            // Mode standard : track actif de 0% jusqu'au handle
            return tickValue <= currentValue;
        }
    }

    /**
     * Positionne un discrete point sur le track
     * @param pointElement Élément du point discret
     * @param percentage Pourcentage de position
     * @param handleWidth Largeur du handle
     */
    private positionDiscretePoint(
        pointElement: HTMLElement,
        percentage: number,
        handleWidth: number
    ): void {
        if (this.options.vertical) {
            pointElement.style.bottom = `calc(${percentage}% - ${handleWidth / 2}px)`;
            pointElement.style.left = '50%';
            pointElement.style.transform = 'translateX(-50%)';
        } else {
            // Horizontal : gérer LTR/RTL
            const isRTL = this.isRTL();
            if (isRTL) {
                // RTL : positionner depuis la droite (comme le handle)
                pointElement.style.right = `calc(${percentage}% - ${handleWidth / 2}px)`;
                pointElement.style.left = 'auto';
            } else {
                // LTR : positionner depuis la gauche
                pointElement.style.left = `calc(${percentage}% - ${handleWidth / 2}px)`;
                pointElement.style.right = 'auto';
            }
            pointElement.style.top = '50%';
            pointElement.style.transform = 'translateY(-50%)';
        }
    }

    /**
     * Cache ou affiche un élément
     * @param element Élément à cacher/afficher
     * @param shouldHide Si l'élément doit être caché
     */
    private setElementVisibility(element: HTMLElement | null, shouldHide: boolean): void {
        if (!element) return;

        if (shouldHide) {
            element.style.display = 'none';
            element.style.visibility = 'hidden';
            element.style.opacity = '0';
        } else {
            element.style.display = '';
            element.style.visibility = '';
            element.style.opacity = '';
        }
    }

    /**
     * Met à jour l'état d'un stop indicator
     * @param element Élément stop indicator
     * @param isActive Si le stop indicator est sur le track actif
     * @param isSelected Si le stop indicator est sélectionné (optionnel)
     * @param shouldHide Si le stop indicator doit être caché (quand le handle est à sa position)
     */
    private updateStopIndicatorState(
        element: HTMLElement | null,
        isActive: boolean,
        isSelected: boolean = false,
        shouldHide: boolean = false
    ): void {
        if (!element) return;

        // Cacher le stop indicator si le handle est à sa position
        this.setElementVisibility(element, shouldHide);
        if (shouldHide) return;

        // Gérer les classes CSS
        element.classList.toggle(Slider.STOP_INDICATOR_SELECTED_CLASS, isSelected);
        element.classList.toggle(Slider.STOP_INDICATOR_ACTIVE_CLASS, isActive);
    }

    /**
     * Met à jour les stop indicators selon le mode et la position du slider
     */
    private updateStopIndicators(): void {
        if (!this.trackElement) return;

        const stopIndicators = this.trackElement.querySelectorAll('.slider__stop-indicator');
        if (stopIndicators.length === 0) return;

        // Si l'option showStopIndicators est false, masquer tous les stop indicators
        if (!this.options.showStopIndicators) {
            stopIndicators.forEach((indicator) => {
                this.setElementVisibility(indicator as HTMLElement, true);
            });
            return;
        }

        const stopStart = stopIndicators[0] as HTMLElement;
        const stopEnd = stopIndicators[1] as HTMLElement;

        if (this.options.range) {
            this.updateStopIndicatorsForRange(stopStart, stopEnd);
        } else {
            this.updateStopIndicatorsForSingle(stopStart, stopEnd);
        }
    }

    /**
     * Met à jour les stop indicators pour un range slider
     * @param stopStart Stop indicator de début
     * @param stopEnd Stop indicator de fin
     */
    private updateStopIndicatorsForRange(
        stopStart: HTMLElement | null,
        stopEnd: HTMLElement | null
    ): void {
        const isStartAtMin = this.isValueNear(this.currentValueStart, this.options.min);
        const isEndAtMax = this.isValueNear(this.currentValueEnd, this.options.max);

        // Stop min : cacher si handle start à min, sinon sur track actif si à min
        this.updateStopIndicatorState(stopStart, isStartAtMin, false, isStartAtMin);

        // Stop max : cacher si handle end à max, sinon sur track actif si à max
        this.updateStopIndicatorState(stopEnd, isEndAtMax, false, isEndAtMax);
    }

    /**
     * Met à jour les stop indicators pour un single slider
     * @param stopStart Stop indicator de début
     * @param stopEnd Stop indicator de fin
     */
    private updateStopIndicatorsForSingle(
        stopStart: HTMLElement | null,
        stopEnd: HTMLElement | null
    ): void {
        const isAtMin = this.isValueNear(this.currentValue, this.options.min);
        const isAtMax = this.isValueNear(this.currentValue, this.options.max);

        if (this.options.centered) {
            // Mode centered : cacher les stop indicators si handle à leur position
            this.updateStopIndicatorState(stopStart, isAtMin, false, isAtMin);
            this.updateStopIndicatorState(stopEnd, isAtMax, false, isAtMax);
        } else {
            // Mode standard : track actif va toujours de 0% au handle
            // Stop min : cacher si handle à min, sinon sur track actif
            this.updateStopIndicatorState(stopStart, true, false, isAtMin);

            // Stop max : cacher si handle à max, sinon sur track actif si à max
            this.updateStopIndicatorState(stopEnd, isAtMax, false, isAtMax);
        }
    }

    /**
     * Détruit le composant
     */
    destroy(): void {
        if (this._activeDragCleanup) {
            this._activeDragCleanup();
            this._activeDragCleanup = null;
        }
        const elWithCleanup = this.el as KSliderDragCleanupElement;
        if (elWithCleanup._sliderCleanup) {
            delete elWithCleanup._sliderCleanup;
        }
        this._pointerUnbinds.forEach((unbind) => unbind());
        this._pointerUnbinds = [];

        if (this.trackElement) {
            this.trackElement.removeEventListener('keydown', this.handleKeyDown.bind(this) as EventListener);
        }

        // Nettoyer les labels de valeur
        if (this.valueLabelElement) {
            this.valueLabelElement.remove();
            this.valueLabelElement = null;
        }
        if (this.valueLabelStartElement) {
            this.valueLabelStartElement.remove();
            this.valueLabelStartElement = null;
        }
        if (this.valueLabelEndElement) {
            this.valueLabelEndElement.remove();
            this.valueLabelEndElement = null;
        }

        // Nettoyer l'icône inset
        if (this.iconElement) {
            this.iconElement.remove();
            this.iconElement = null;
        }

        // Retirer l'ID de l'élément DOM
        this.el.removeAttribute('data-slider-id');

        // Détruire via la base (unregister + cleanup events)
        super.destroy();

        LoggerManager.global.info(`Slider component destroyed [${this.sliderId}]`);
    }
}

// ============================================================================
// WEB COMPONENT REGISTRATION
// ============================================================================

/**
 * Enregistrement du Web Component k3ui-slider
 * @description Permet l'utilisation de <k3ui-slider> dans le HTML. Initialisation par AutoInit.
 */
if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-slider')) {
    customElements.define('k3ui-slider', class extends HTMLElement {
        private sliderInstance: Slider | null = null;

        connectedCallback() {
            // L'initialisation sera gérée par AutoInit
            // ou manuellement via K.Slider.init(this)
        }

        disconnectedCallback() {
            if (this.sliderInstance) {
                this.sliderInstance.destroy();
                this.sliderInstance = null;
            }
        }

        static get observedAttributes() {
            return [
                'value', 'value-start', 'value-end', 'min', 'max', 'step', 'size',
                'discrete', 'vertical', 'centered', 'range', 'disabled', 'show-label', 'label', 'name', 'icon'
            ];
        }

        attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
            if (this.sliderInstance && oldValue !== newValue) {
                // Mettre à jour l'instance si elle existe
                const camelCaseName = name.replace(/-([a-z])/g, (g) => g[1].toUpperCase()) as keyof SliderOptions;
                if (camelCaseName in this.sliderInstance.options) {
                    Object.assign(this.sliderInstance.options, { [camelCaseName]: newValue } as Partial<SliderOptions>);
                }
            }
        }
    });
}

