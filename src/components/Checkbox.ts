/**
 * K3UI Checkbox Component
 * Composant de checkbox basé sur Material Design 3 Expressive
 *
 * @summary Checkbox Material Design 3 Expressive
 * @element k3ui-checkbox
 *
 * @event change - La valeur change
 * @event toggle - Bascule entre coché/décoché
 * @event focus - Obtient le focus
 * @event blur - Perd le focus
 */

import { Component } from '../core/base/Component';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import { CheckboxOptions } from '../types/components';
import { PriorityLevel } from '../types/base';
import { KElement, InitElements } from '../types/base';
import { LoggerManager } from '../core/managers/LoggerManager';
import { ManagerFactory } from '../core/factories/ManagerFactory';
import { setAriaAttribute, removeAriaAttribute } from '../utils/dom/aria';
import { Keyboard, Mouse } from '../core/managers';
import { getCheckboxDefaults } from '../specs/components/checkbox.specs';
import { HapticManager } from '../core/managers/HapticManager';
import { getPointerPressReleaseBindings } from '../utils/dom/pointer';

/** Durée d'animation toggle alignée sur spatial-fast (~350ms) */
const TOGGLE_ANIMATION_MS = 350;

/**
 * Options par défaut du composant Checkbox
 * @description Extrait depuis les specs pour garantir la cohérence
 */
const _defaults: CheckboxOptions = getCheckboxDefaults();

/**
 * Classe Checkbox
 * Gère les checkboxes avec animations M3 Expressive (coche SVG + rebond)
 */
export class Checkbox extends Component<CheckboxOptions> {
    /** Niveau de priorité du composant */
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    private checkboxElement: HTMLElement | null = null;
    private containerElement: HTMLElement | null = null;
    private stateLayerElement: HTMLElement | null = null;
    private checkElement: SVGSVGElement | null = null;
    private dashElement: HTMLElement | null = null;
    private inputElement: HTMLInputElement | null = null;
    private labelElement: HTMLElement | null = null;
    private isChecked: boolean = false;
    private isIndeterminate: boolean = false;
    private isAnimating: boolean = false;
    private logger: LoggerManager;
    private keyboardHandler: Keyboard | null = null;
    private mouseHandler: Mouse | null = null;
    private animationTimer: ReturnType<typeof setTimeout> | null = null;

    /**
     * Constructeur
     * @param el - Élément DOM du Checkbox
     * @param options - Options de configuration
     */
    constructor(el: HTMLElement, options: Partial<CheckboxOptions> = {}) {
        super(el, options, toComponentClassDef(Checkbox));

        this.logger = ManagerFactory.getLoggerManager('[Checkbox]');

        this.options = {
            ...Checkbox.defaults,
            ...options
        };

        if (el.hasAttribute('checked') || (el as HTMLInputElement).checked) {
            this.options.checked = true;
        }

        if (el.hasAttribute('disabled')) {
            this.options.disabled = true;
        }

        if (el.hasAttribute('indeterminate') || (el as HTMLInputElement).indeterminate) {
            this.options.indeterminate = true;
        }

        if (el.hasAttribute('error') || el.classList.contains('checkbox--error')) {
            this.options.error = true;
        }

        if (el.hasAttribute('data-label') || el.hasAttribute('label')) {
            this.options.label = el.getAttribute('data-label') || el.getAttribute('label') || undefined;
        }

        if (el.hasAttribute('data-show-label')) {
            const showLabelValue = el.getAttribute('data-show-label');
            this.options.showLabel = showLabelValue === 'true' || showLabelValue === '';
        }

        if (el.hasAttribute('data-name')) {
            this.options.name = el.getAttribute('data-name') || '';
        }

        if (el.hasAttribute('data-value')) {
            this.options.value = el.getAttribute('data-value') || '';
        }

        this.isChecked = this.options.checked;
        this.isIndeterminate = this.options.indeterminate;

        this.init();
    }

    static getInstance(el: HTMLElement): Checkbox | undefined {
        return Component.getInstance(el) as Checkbox | undefined;
    }

    static get defaults(): CheckboxOptions {
        return _defaults;
    }

    /**
     * Initialise une instance de Checkbox.
     * @param el Élément HTML.
     * @param options Options du composant.
     */
    static init(el: HTMLElement, options?: Partial<CheckboxOptions>): Checkbox;
    /**
     * Initialise des instances de Checkbox.
     * @param els Éléments HTML.
     * @param options Options du composant.
     */
    static init(els: InitElements<KElement>, options?: Partial<CheckboxOptions>): Checkbox[];
    static init(
        els: HTMLElement | InitElements<KElement>,
        options?: Partial<CheckboxOptions>
    ): Checkbox | Checkbox[] {

        if (els instanceof Element) {
            const existing = Checkbox.getInstance(els as HTMLElement);
            if (existing) {
                return existing;
            }
            return new Checkbox(els as HTMLElement, options);
        } else if (!!els && els.length) {
            const instances = [];
            for (let i = 0; i < els.length; i++) {
                const existing = Checkbox.getInstance(els[i] as HTMLElement);
                if (existing) {
                    instances.push(existing);
                } else {
                    instances.push(new Checkbox(els[i] as HTMLElement, options));
                }
            }
            return instances;
        }
        return [];
    }

    /**
     * Initialisation du composant
     */
    private init(): void {
        try {
            this.setupStructure();
            this.setupEventListeners();
            this.updateState();
            this.logger.success('Checkbox initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize Checkbox:', error);
        }
    }

    /**
     * Configuration de la structure HTML
     */
    private setupStructure(): void {
        this.el.classList.add('checkbox');
        this.createCheckboxStructure();
        this.updateVisualState();
    }

    /**
     * Crée la coche SVG (stroke-dashoffset animé en CSS)
     */
    private createCheckSvg(): SVGSVGElement {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'checkbox__check');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('aria-hidden', 'true');
        setAriaAttribute(svg as unknown as HTMLElement, 'hidden', true);

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M5 12.5 L10 17.5 L19.5 7');
        svg.appendChild(path);

        return svg;
    }

    /**
     * Création de la structure HTML du checkbox
     */
    private createCheckboxStructure(): void {
        this.checkboxElement = document.createElement('div');

        this.stateLayerElement = document.createElement('div');
        this.stateLayerElement.classList.add('checkbox__state-layer');

        this.containerElement = document.createElement('div');
        this.containerElement.classList.add('checkbox__container');

        this.checkElement = this.createCheckSvg();

        this.dashElement = document.createElement('span');
        this.dashElement.classList.add('checkbox__dash');
        setAriaAttribute(this.dashElement, 'hidden', true);

        this.checkboxElement.appendChild(this.stateLayerElement);
        this.containerElement.appendChild(this.checkElement);
        this.containerElement.appendChild(this.dashElement);
        this.checkboxElement.appendChild(this.containerElement);

        this.inputElement = document.createElement('input');
        this.inputElement.type = 'checkbox';
        this.inputElement.classList.add('checkbox__input');
        this.inputElement.checked = this.isChecked;
        this.inputElement.indeterminate = this.isIndeterminate;
        this.inputElement.disabled = this.options.disabled;
        this.inputElement.setAttribute('role', 'checkbox');
        setAriaAttribute(this.inputElement, 'checked', this.isChecked);
        if (this.options.disabled) {
            setAriaAttribute(this.inputElement, 'disabled', true);
        } else {
            removeAriaAttribute(this.inputElement, 'disabled');
        }

        if (this.isIndeterminate) {
            setAriaAttribute(this.inputElement, 'checked', 'mixed');
        }

        if (this.options.name) {
            this.inputElement.name = this.options.name;
        }

        if (this.options.value) {
            this.inputElement.value = this.options.value;
        }

        if (this.options.showLabel && this.options.label) {
            this.labelElement = document.createElement('label');
            this.labelElement.classList.add('checkbox__label');
            this.labelElement.textContent = this.options.label;

            const labelId = `checkbox-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
            this.inputElement.id = labelId;
            this.labelElement.setAttribute('for', labelId);
        }

        this.checkboxElement.appendChild(this.inputElement);
        this.el.appendChild(this.checkboxElement);
        if (this.labelElement) {
            this.el.appendChild(this.labelElement);
        }

        if (this.options.disabled) {
            this.el.classList.add('checkbox--disabled');
        }

        if (this.options.error) {
            this.el.classList.add('checkbox--error');
        }

        if (this.isChecked) {
            this.el.classList.add('checkbox--checked');
        }

        if (this.isIndeterminate) {
            this.el.classList.add('checkbox--indeterminate');
        }

        if (!this.options.disabled) {
            this.inputElement.setAttribute('tabindex', '0');
        }
    }

    /**
     * Configuration des écouteurs d'événements
     */
    private setupEventListeners(): void {
        if (!this.inputElement) return;

        getPointerPressReleaseBindings(this.inputElement, {
            onPress: () => {
                if (!this.options.disabled) {
                    this.el.classList.add('checkbox--pressed');
                }
            },
            onRelease: () => {
                this.el.classList.remove('checkbox--pressed');
            },
        }).forEach(({ target, type, handler, options }) => {
            this.registerEvent(target, type, handler as EventListener, options);
        });

        this.mouseHandler = new Mouse({
            target: this.inputElement,
            enabled: true,
            onMouseEnter: () => {
                if (!this.options.disabled && !this.isAnimating) {
                    this.el.classList.add('checkbox--hovered');
                }
            },
            onMouseLeave: () => {
                if (!this.options.disabled) {
                    this.el.classList.remove('checkbox--hovered');
                    this.el.classList.remove('checkbox--pressed');
                }
            }
        });

        this.keyboardHandler = new Keyboard({
            target: this.inputElement,
            enabled: true,
            onKeyDown: (event: KeyboardEvent, key: string) => {
                if (this.options.disabled) return;
                if (key === 'Enter' || key === ' ') {
                    event.preventDefault();
                    this.toggle();
                }
            }
        });

        this.registerEvent(this.inputElement, 'change', (event: Event) => {
            const target = event.target as HTMLInputElement;
            this.isChecked = target.checked;
            // Un changement utilisateur sort de l'état indeterminate
            if (this.isIndeterminate) {
                this.isIndeterminate = false;
                target.indeterminate = false;
            }
            this.handleToggle(event);
            this.updateState();
            this.options.onChange?.(this.isChecked, this);
        });

        this.registerEvent(this.inputElement, 'focus', () => {
            if (!this.options.disabled) {
                this.el.classList.add('checkbox--focused');
                this.options.onFocus?.(this.el);
            }
        });

        this.registerEvent(this.inputElement, 'blur', () => {
            if (!this.options.disabled) {
                this.el.classList.remove('checkbox--focused');
                this.options.onBlur?.(this.el);
            }
        });
    }

    /**
     * Gère le cycle d'animation / callbacks open-close
     */
    private handleToggle(_event: Event): void {
        if (this.isAnimating || this.options.disabled) return;

        HapticManager.triggerFromOptions(this.options, 'light');

        const becomingChecked = this.isChecked;
        this.isAnimating = true;

        if (becomingChecked) {
            this.options.onOpenStart?.(this.el);
        } else {
            this.options.onCloseStart?.(this.el);
        }

        requestAnimationFrame(() => {
            this.updateVisualState();
        });

        if (this.animationTimer) {
            clearTimeout(this.animationTimer);
        }

        this.animationTimer = setTimeout(() => {
            this.isAnimating = false;
            this.animationTimer = null;
            if (this.isChecked) {
                this.options.onOpenEnd?.(this.el);
            } else {
                this.options.onCloseEnd?.(this.el);
            }
            this.options.onToggle?.(this.el, this.isChecked);
        }, TOGGLE_ANIMATION_MS);
    }

    /**
     * Met à jour l'état du composant
     */
    private updateState(): void {
        if (!this.inputElement) return;

        this.inputElement.checked = this.isChecked;
        this.inputElement.indeterminate = this.isIndeterminate;

        if (this.options.disabled) {
            setAriaAttribute(this.inputElement, 'disabled', true);
        } else {
            removeAriaAttribute(this.inputElement, 'disabled');
        }

        if (this.isIndeterminate) {
            setAriaAttribute(this.inputElement, 'checked', 'mixed');
        } else if (this.isChecked) {
            setAriaAttribute(this.inputElement, 'checked', true);
        } else {
            setAriaAttribute(this.inputElement, 'checked', false);
        }

        this.updateVisualState();
    }

    /**
     * Met à jour les classes d'état (animations CSS)
     */
    private updateVisualState(): void {
        if (!this.el) return;

        // Indeterminate prioritaire sur checked (comme data-checked && !indeterminate du prototype M3)
        if (this.isIndeterminate) {
            this.el.classList.add('checkbox--indeterminate');
            this.el.classList.remove('checkbox--checked');
        } else if (this.isChecked) {
            this.el.classList.add('checkbox--checked');
            this.el.classList.remove('checkbox--indeterminate');
        } else {
            this.el.classList.remove('checkbox--checked');
            this.el.classList.remove('checkbox--indeterminate');
        }
    }

    /**
     * Obtient l'état checked du checkbox
     */
    getChecked(): boolean {
        return this.isChecked;
    }

    /**
     * Définit l'état checked du checkbox
     * @description Autorisé pendant une animation (sync programmatique, ex. « Tout sélectionner »)
     */
    setChecked(checked: boolean): void {
        if (this.options.disabled) return;
        this.isChecked = checked;
        if (this.isChecked) {
            this.isIndeterminate = false;
        }
        this.updateState();
    }

    /**
     * Obtient l'état indeterminate du checkbox
     */
    getIndeterminate(): boolean {
        return this.isIndeterminate;
    }

    /**
     * Définit l'état indeterminate du checkbox
     * @description Autorisé pendant une animation (sync programmatique, ex. sélection partielle)
     */
    setIndeterminate(indeterminate: boolean): void {
        if (this.options.disabled) return;
        this.isIndeterminate = indeterminate;
        if (this.isIndeterminate) {
            this.isChecked = false;
        }
        this.updateState();
    }

    /**
     * Bascule l'état du checkbox
     */
    toggle(): void {
        if (this.isAnimating || this.options.disabled) return;
        if (this.inputElement) {
            this.inputElement.click();
        }
    }

    /**
     * Détruit l'instance du composant
     */
    destroy(): void {
        if (this.animationTimer) {
            clearTimeout(this.animationTimer);
            this.animationTimer = null;
        }

        if (this.keyboardHandler) {
            this.keyboardHandler.destroy();
            this.keyboardHandler = null;
        }

        if (this.mouseHandler) {
            this.mouseHandler.destroy();
            this.mouseHandler = null;
        }

        if (this.inputElement) {
            removeAriaAttribute(this.inputElement, 'checked');
            removeAriaAttribute(this.inputElement, 'disabled');
        }

        super.destroy();

        this.logger.success('Checkbox destroyed');
    }
}

// ============================================================================
// WEB COMPONENT REGISTRATION
// ============================================================================

/**
 * Enregistrement du Web Component k3ui-checkbox
 * @description Permet l'utilisation de <k3ui-checkbox> dans le HTML. Initialisation par AutoInit.
 */
if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-checkbox')) {
    customElements.define('k3ui-checkbox', class extends HTMLElement {
        private checkboxInstance: Checkbox | null = null;

        connectedCallback() {
            // L'initialisation sera gérée par AutoInit
        }

        disconnectedCallback() {
            if (this.checkboxInstance) {
                this.checkboxInstance.destroy();
                this.checkboxInstance = null;
            }
        }

        static get observedAttributes() {
            return [
                'checked', 'disabled', 'indeterminate', 'error', 'label', 'name', 'value'
            ];
        }

        attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
            if (this.checkboxInstance && oldValue !== newValue) {
                const camelCaseName = name.replace(/-([a-z])/g, (g) => g[1].toUpperCase()) as keyof CheckboxOptions;
                if (camelCaseName in this.checkboxInstance.options) {
                    Object.assign(this.checkboxInstance.options, { [camelCaseName]: newValue } as Partial<CheckboxOptions>);
                }
            }
        }
    });
}
