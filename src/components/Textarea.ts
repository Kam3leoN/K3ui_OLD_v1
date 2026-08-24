/**
 * K3UI Textarea Component
 * Composant de textarea basé sur Material Design 3
 *
 * @summary Textarea Material Design 3
 * @element k3ui-textarea
 *
 * @event focus - Obtient le focus
 * @event blur - Perd le focus
 * @event change - La valeur change et perd le focus
 * @event input - La valeur change
 * @event invalid - Validation échouée
 *
 * @slot label - Label du textarea
 * @slot helper - Texte d'aide
 * @slot counter - Compteur de caractères
 *
 * @cssprop --textarea-container-bg - Couleur de fond du container
 * @cssprop --textarea-border-color - Couleur de la bordure
 * @cssprop --textarea-label-color - Couleur du label
 * @cssprop --textarea-text-color - Couleur du texte
 */

import { Component } from '../core/base/Component';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import { TextareaOptions } from '../types/components';
import { PriorityLevel } from '../types/base';
import { KElement, InitElements } from '../types/base';
import { LoggerManager } from '../core/managers';

/**
 * Options par défaut du composant Textarea
 * (Interface définie dans src/types/components/components.ts)
 */

import { getTextareaDefaults } from '../specs/components/textarea.specs';

/**
 * Options par défaut du composant Textarea
 * @description Extrait depuis les specs pour garantir la cohérence
 */
const _defaults: TextareaOptions = getTextareaDefaults();

/**
 * Classe du composant Textarea
 */
export class Textarea extends Component<TextareaOptions> {
    declare el: HTMLElement;

    /** Élément textarea */
    textareaElement: HTMLTextAreaElement | null = null;

    /** Élément container */
    containerElement: HTMLDivElement | null = null;

    /** Élément label */
    labelElement: HTMLLabelElement | null = null;

    /** Élément ligne du bas */
    bottomLineElement: HTMLDivElement | null = null;

    /** Élément texte d'aide */
    helperElement: HTMLDivElement | null = null;

    /** Élément compteur */
    counterElement: HTMLDivElement | null = null;

    /** Si le textarea a une valeur */
    hasValue: boolean = false;

    /** Si le textarea est invalide */
    invalid: boolean = false;

    constructor(el: HTMLElement, options: Partial<TextareaOptions> = {}) {
        // Lire les attributs HTML et les convertir en options
        // Les attributs HTML ont la priorité sur les options passées en paramètre
        const htmlOptions = Textarea.readAttributes(el);

        super(el, { ...options, ...htmlOptions }, toComponentClassDef(Textarea));

        // Initialiser le composant
        this.init();
    }

    static getInstance(el: HTMLElement): Textarea | undefined {
        return Component.getInstance(el) as Textarea | undefined;
    }

    static get defaults(): TextareaOptions {
        return _defaults;
    }

    /**
     * Initialise une instance de Textarea.
     * @param el Élément HTML.
     * @param options Options du composant.
     */
    static init(el: HTMLElement, options?: Partial<TextareaOptions>): Textarea;
    /**
     * Initialise des instances de Textarea.
     * @param els Éléments HTML.
     * @param options Options du composant.
     */
    static init(els: InitElements<KElement>, options?: Partial<TextareaOptions>): Textarea[];
    static init(
        els: HTMLElement | InitElements<KElement>,
        options?: Partial<TextareaOptions>
    ): Textarea | Textarea[] {
        if (els instanceof Element) {
            return new Textarea(els as HTMLElement, options);
        } else if (!!els && els.length) {
            const instances = [];
            for (let i = 0; i < els.length; i++) {
                instances.push(new Textarea(els[i] as HTMLElement, options));
            }
            return instances;
        }
        return [];
    }

    /**
     * Lit les attributs HTML et les convertit en options
     */
    private static readAttributes(el: HTMLElement): Partial<TextareaOptions> {
        const options: Partial<TextareaOptions> = {};

        // Lire les attributs HTML
        if (el.hasAttribute('variant')) {
            options.variant = el.getAttribute('variant') as 'filled' | 'outlined';
        }
        if (el.hasAttribute('label')) {
            options.label = el.getAttribute('label') || undefined;
        }
        if (el.hasAttribute('placeholder')) {
            options.placeholder = el.getAttribute('placeholder') || undefined;
        }
        if (el.hasAttribute('rows')) {
            options.rows = parseInt(el.getAttribute('rows') || '3');
        }
        if (el.hasAttribute('maxlength')) {
            options.maxLength = parseInt(el.getAttribute('maxlength') || '0');
        }
        if (el.hasAttribute('helper-text')) {
            options.helperText = el.getAttribute('helper-text') || undefined;
        }
        if (el.hasAttribute('error-text')) {
            options.errorText = el.getAttribute('error-text') || undefined;
        }
        if (el.hasAttribute('name')) {
            options.name = el.getAttribute('name') || '';
        }
        if (el.hasAttribute('value')) {
            options.value = el.getAttribute('value') || '';
        }

        // Attributs booléens
        options.disabled = el.hasAttribute('disabled');
        options.readonly = el.hasAttribute('readonly');
        options.autosize = el.hasAttribute('autosize');
        options.showCounter = el.hasAttribute('show-counter');
        options.required = el.hasAttribute('required');

        return options;
    }

    /**
     * Initialise le composant Textarea
     */
    init(): void {
        LoggerManager.global.info('Textarea component initialized');

        // Créer la structure DOM
        this.createStructure();

        // Configurer les événements
        this.setupEvents();

        // Appliquer les styles
        this.applyStyles();

        // Initialiser hasValue avec la valeur par défaut du HTML
        if (this.textareaElement) {
            this.hasValue = this.textareaElement.value.length > 0;
        }

        // Initialiser l'état visuel
        this.updateState();

        // Initialiser l'autosize si activé
        if (this.options.autosize && this.textareaElement) {
            this.initAutosize();
        }
    }

    /**
     * Crée la structure DOM du composant
     */
    private createStructure(): void {
        // Créer le container principal avec la classe attendue par SCSS
        this.containerElement = document.createElement('div');
        this.containerElement.className = 'input-field';

        // Créer le textarea
        this.textareaElement = document.createElement('textarea');
        this.textareaElement.className = 'textarea';
        // Ne pas définir de rows pour permettre l'adaptation au container
        // this.textareaElement.rows = this.options.rows;
        this.textareaElement.placeholder = this.options.placeholder || '';
        this.textareaElement.disabled = this.options.disabled ?? false;
        this.textareaElement.readOnly = this.options.readonly ?? false;
        this.textareaElement.name = this.options.name || '';
        this.textareaElement.value = this.options.value || '';
        this.textareaElement.required = this.options.required ?? false;

        if (this.options.maxLength) {
            this.textareaElement.maxLength = this.options.maxLength;
        }

        // Créer le label si nécessaire
        if (this.options.label) {
            this.labelElement = document.createElement('label');
            this.labelElement.textContent = this.options.label;
            this.labelElement.className = 'label';
        }

        // Créer la ligne du bas
        this.bottomLineElement = document.createElement('div');
        this.bottomLineElement.className = 'bottom-line';

        // Créer le texte d'aide si nécessaire
        if (this.options.helperText || this.options.errorText) {
            this.helperElement = document.createElement('div');
            this.helperElement.textContent = this.options.errorText || this.options.helperText || '';
            this.helperElement.className = 'helper-text';
        }

        // Créer le compteur de caractères si nécessaire (automatique si maxLength est défini)
        if (this.options.maxLength) {
            this.counterElement = document.createElement('div');
            this.counterElement.className = 'field-display-counter';
            this.updateCounter();
        }

        // Assembler la structure
        this.containerElement.appendChild(this.textareaElement);

        if (this.labelElement) {
            this.containerElement.appendChild(this.labelElement);
        }

        this.containerElement.appendChild(this.bottomLineElement);

        // Ajouter le container à l'élément k3ui-textarea (pas remplacer)
        this.el.appendChild(this.containerElement);

        // Créer un conteneur pour aligner helper et counter sur la même ligne
        if (this.helperElement || this.counterElement) {
            const bottomContainer = document.createElement('div');
            bottomContainer.className = 'textarea-bottom';

            if (this.helperElement) {
                bottomContainer.appendChild(this.helperElement);
            }
            if (this.counterElement) {
                bottomContainer.appendChild(this.counterElement);
            }

            this.el.appendChild(bottomContainer);
        }
    }

    /**
     * Configure les événements du composant
     */
    private setupEvents(): void {
        if (!this.textareaElement) return;

        this.registerEvent(this.textareaElement, 'focus', this.handleFocus);
        this.registerEvent(this.textareaElement, 'blur', this.handleBlur);
        this.registerEvent(this.textareaElement, 'input', this.handleInput);
        this.registerEvent(this.textareaElement, 'change', this.handleChange);
        this.registerEvent(this.textareaElement, 'invalid', this.handleInvalid);
    }

    /**
     * Applique les styles du composant
     */
    private applyStyles(): void {
        if (!this.containerElement) return;

        // Définir l'attribut variant sur l'élément k3ui-textarea pour les styles SCSS
        this.el.setAttribute('variant', this.options.variant);

        // Définir l'attribut disabled sur l'élément k3ui-textarea pour les styles SCSS
        if (this.options.disabled) {
            this.el.setAttribute('disabled', '');
        } else {
            this.el.removeAttribute('disabled');
        }

        // Ajouter les classes CSS selon la structure SCSS
        if (this.options.autosize) {
            this.containerElement.classList.add('autosize');
        }
        if (this.options.showCounter) {
            this.containerElement.classList.add('has-counter');
        }
        if (this.options.label) {
            this.containerElement.classList.add('has-label');
        }
        if (this.options.helperText || this.options.errorText) {
            this.containerElement.classList.add('has-helper');
        }

        // Debug: vérifier les attributs appliqués
        LoggerManager.global.debug(`Attributs appliqués sur k3ui-textarea: ${Array.from(this.el.attributes).map(attr => `${attr.name}="${attr.value}"`).join(' ')}`);
        LoggerManager.global.debug(`Classes appliquées sur container: ${this.containerElement.className}`);
    }

    /**
     * Gestionnaire d'événement focus
     */
    private handleFocus = (event: Event): void => {
        this.el.setAttribute('focused', '');
        this.updateState();

        if (this.options.onFocus) {
            this.options.onFocus(this);
        }
    }

    /**
     * Gestionnaire d'événement blur
     */
    private handleBlur = (event: Event): void => {
        this.el.removeAttribute('focused');

        // Vérifier la valeur actuelle avant de mettre à jour l'état
        if (this.textareaElement) {
            this.hasValue = this.textareaElement.value.length > 0;
        }

        this.updateState();

        if (this.options.onBlur && this.textareaElement) {
            this.options.onBlur(this.textareaElement.value, this);
        }
    }

    /**
     * Gestionnaire d'événement input
     */
    private handleInput = (event: Event): void => {
        this.hasValue = (event.target as HTMLTextAreaElement).value.length > 0;
        this.updateState();
        this.updateCounter();

        if (this.options.onInput && this.textareaElement) {
            this.options.onInput(this.textareaElement.value, this);
        }
    }

    /**
     * Gestionnaire d'événement change
     */
    private handleChange = (event: Event): void => {
        if (this.options.onChange) {
            this.options.onChange(this.el);
        }
    }

    /**
     * Gestionnaire d'événement invalid
     */
    private handleInvalid = (event: Event): void => {
        this.invalid = true;
        this.el.setAttribute('invalid', '');

        if (this.options.onInvalid) {
            this.options.onInvalid(this.el);
        }
    }

    /**
     * Met à jour l'état visuel du composant
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
    }

    /**
     * Met à jour le compteur de caractères
     */
    private updateCounter(): void {
        if (!this.counterElement || !this.textareaElement || !this.options.maxLength) return;

        const currentLength = this.textareaElement.value.length;
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
     * Initialise l'autosize pour les textareas
     */
    private initAutosize(): void {
        if (!this.textareaElement) return;

        const textarea = this.textareaElement;

        // Fonction pour ajuster la hauteur
        const adjustHeight = () => {
            // Réinitialiser la hauteur pour calculer la hauteur naturelle
            textarea.style.height = 'auto';

            // Calculer la hauteur nécessaire
            const scrollHeight = textarea.scrollHeight;
            const minHeight = 80; // 80px minimum
            const maxHeight = 200; // 200px max

            // Appliquer la hauteur calculée avec les contraintes
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
     * Récupère la valeur du textarea
     */
    getValue(): string {
        return this.textareaElement?.value || '';
    }

    /**
     * Définit la valeur du textarea
     */
    setValue(value: string): void {
        if (this.textareaElement) {
            this.textareaElement.value = value;
            this.hasValue = value.length > 0;
            this.updateState();
            this.updateCounter();
        }
    }

    /**
     * Focus sur le textarea
     */
    focus(): void {
        this.textareaElement?.focus();
    }

    /**
     * Blur sur le textarea
     */
    blur(): void {
        this.textareaElement?.blur();
    }

    /**
     * Vérifie la validité du textarea
     */
    checkValidity(): boolean {
        return this.textareaElement?.checkValidity() ?? true;
    }

    /**
     * Rapporte la validité du textarea
     */
    reportValidity(): boolean {
        return this.textareaElement?.reportValidity() ?? true;
    }

    /**
     * Définit un message d'erreur personnalisé
     */
    setCustomValidity(message: string): void {
        this.textareaElement?.setCustomValidity(message);
    }

    /**
     * Détruit le composant
     */
    destroy(): void {
        LoggerManager.global.info('Textarea component destroyed');
        super.destroy();
    }
}

// ============================================================================
// WEB COMPONENT REGISTRATION
// ============================================================================

/**
 * Enregistrement du Web Component k3ui-textarea
 * @description Permet l'utilisation de <k3ui-textarea> dans le HTML. Initialisation par AutoInit.
 */
if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-textarea')) {
    customElements.define('k3ui-textarea', class extends HTMLElement {
        connectedCallback() {
            // L'initialisation sera gérée par AutoInit
            // ou manuellement via K.Textarea.init(this)
        }

        disconnectedCallback() {
            const instance = Textarea.getInstance(this);
            if (instance && typeof instance.destroy === 'function') {
                instance.destroy();
            }
        }

        static get observedAttributes() {
            return [
                'variant', 'label', 'placeholder', 'rows', 'maxlength', 'helper-text',
                'error-text', 'disabled', 'readonly', 'autosize', 'show-counter',
                'name', 'value', 'required'
            ];
        }

        attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
            const instance = Textarea.getInstance(this);
            if (instance && oldValue !== newValue) {
                const camelCaseName = name.replace(/-([a-z])/g, (g) => g[1].toUpperCase()) as keyof TextareaOptions;
                if (camelCaseName in instance.options) {
                    Object.assign(instance.options, { [camelCaseName]: newValue } as Partial<TextareaOptions>);
                }
            }
        }
    });
}