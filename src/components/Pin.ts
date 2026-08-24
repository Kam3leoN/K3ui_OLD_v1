/**
 * Composant Pin pour la saisie de codes PIN avec auto-focus
 * Gère l'auto-focus entre les inputs et affiche un compteur unique
 */

import { Component } from '../core/base/Component';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import { PinOptions } from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { LoggerManager } from '../core/managers';

// PinOptions importé depuis ../types/components

import { getPinDefaults } from '../specs/components/pin.specs';
import { HapticManager } from '../core/managers/HapticManager';

/**
 * Options par défaut du composant Pin
 * @description Extrait depuis les specs pour garantir la cohérence
 */
const _defaults: PinOptions = getPinDefaults();

/**
 * Classe du composant Pin
 */
/**
 * Composant Pin
 * @description Saisie de codes PIN multi-champs avec auto-focus et compteur unique
 */
export class Pin extends Component<PinOptions> {
    private inputs: HTMLInputElement[] = [];
    private counterElement: HTMLElement | null = null;
    private helperElement: HTMLElement | null = null;
    private helperContainerElement: HTMLElement | null = null;
    private currentPin: string = '';
    private isValid: boolean | null = null;

    constructor(el: HTMLElement, options: Partial<PinOptions> = {}) {
        super(el, options, toComponentClassDef(Pin));
        this.init();
    }

    static getInstance(el: HTMLElement): Pin | undefined {
        return Component.getInstance(el) as Pin | undefined;
    }

    static get defaults(): PinOptions {
        return _defaults;
    }

    static init(
        el: HTMLElement,
        options?: Partial<PinOptions>
    ): Pin;
    static init(
        els: InitElements<KElement>,
        options?: Partial<PinOptions>
    ): Pin[];
    static init(
        els: HTMLElement | InitElements<KElement>,
        options?: Partial<PinOptions>
    ): Pin | Pin[] {
        return Component.init(els, options ?? {}, toComponentClassDef(Pin)) as Pin | Pin[];
    }

    /** Initialise le composant Pin */
    init(): void {
        LoggerManager.global.info('Pin - Initialisation', this.el);

        // Si on est sur un webcomponent léger <k3ui-pin>, ajouter la classe utilitaire pour le style
        if (this.el.tagName.toLowerCase() === 'k3ui-pin') {
            this.el.classList.add('pin');
        }

        // Lire d'abord les attributs HTML éventuels sur <k3ui-pin>
        this.readAttributes();

        // Puis appliquer la variante visuelle en tenant compte des attributs
        this.el.classList.remove('pin--filled', 'pin--outlined');
        this.el.classList.add(`pin--${this.options.variant}`);

        this.setCSSVariables();
        this.createInputs();
        this.createHelperContainer();
        this.attachEvents();
        this.updateCounter();
        this.updateHelper();

        LoggerManager.global.success('Pin - Initialisé');
    }

    /** Crée les inputs pour le PIN */
    private createInputs(): void {
        // Vider le conteneur
        this.el.innerHTML = '';
        this.inputs = [];

        // Créer le conteneur des inputs
        const inputsContainer = document.createElement('div');
        inputsContainer.className = 'pin__container';

        // Créer les inputs
        for (let i = 0; i < this.options.length; i++) {
            const input = document.createElement('input');
            input.type = this.options.type;
            input.className = 'pin__digit';
            input.maxLength = 1;
            input.setAttribute('data-index', i.toString());
            input.setAttribute('inputmode', 'numeric');
            input.setAttribute('autocomplete', 'one-time-code');

            // Ajouter l'input au conteneur
            inputsContainer.appendChild(input);
            this.inputs.push(input);
        }

        this.el.appendChild(inputsContainer);
    }

    /** Lit les attributs HTML (helper, counter, length/lenght, size, variant) et les applique aux options */
    private readAttributes(): void {
        const el = this.el as HTMLElement;
        const variantAttr = el.getAttribute('variant');
        if (variantAttr === 'filled' || variantAttr === 'outlined') {
            this.options.variant = variantAttr;
        }

        const helperAttr = el.getAttribute('helper');
        if (helperAttr !== null) {
            this.options.pinHelper = helperAttr;
        }

        const counterAttr = el.getAttribute('counter');
        if (counterAttr !== null) {
            this.options.pinCounter = counterAttr === 'true' || counterAttr === '';
        }

        const lengthAttr = el.getAttribute('length');
        if (lengthAttr) {
            const n = parseInt(lengthAttr, 10);
            if (!isNaN(n) && n > 0) this.options.length = n;
        }

        const inputTypeAttr = el.getAttribute('input-type');
        if (inputTypeAttr === 'numbers' || inputTypeAttr === 'letters' || inputTypeAttr === 'mixed') {
            this.options.inputType = inputTypeAttr;
        }

        const caseSensitiveAttr = el.getAttribute('case-sensitive');
        if (caseSensitiveAttr !== null) {
            this.options.caseSensitive = caseSensitiveAttr === 'true' || caseSensitiveAttr === '';
        }

    }


    /** Définit les variables CSS pour l'alignement dynamique */
    private setCSSVariables(): void {
        // Limiter à 12 cases maximum pour éviter les problèmes d'affichage
        const length = Math.min(Math.max(this.options.length, 3), 12);
        this.el.style.setProperty('--pin-length', length.toString());
    }

    /** Crée l'élément compteur */
    private createHelperContainer(): void {
        // Créer le conteneur footer unique
        if (!this.helperContainerElement) {
            this.helperContainerElement = document.createElement('div');
            this.helperContainerElement.className = 'pin__helper-container';
            this.el.appendChild(this.helperContainerElement);
        }

        // Helper (directement dans le container)
        if (!this.helperElement) {
            this.helperElement = document.createElement('div');
            this.helperElement.className = 'pin__helper';
            this.helperContainerElement.appendChild(this.helperElement);
        }

        // Counter (directement dans le container)
        if (!this.counterElement) {
            this.counterElement = document.createElement('div');
            this.counterElement.className = 'pin__counter';
            this.helperContainerElement.appendChild(this.counterElement);
        }
    }

    /** Crée/MAJ le helper text */
    private updateHelper(): void {
        if (!this.helperElement) return;
        if (this.options.pinHelper) {
            // Échapper le HTML pour la sécurité
            const escapedHtml = this.escapeHtml(String(this.options.pinHelper));
            this.helperElement.innerHTML = escapedHtml;
            this.helperElement.style.display = '';
        } else {
            this.helperElement.innerHTML = '';
            this.helperElement.style.display = '';
        }
    }

    /** Échappe les caractères HTML dangereux tout en permettant certaines balises sécurisées */
    private escapeHtml(unsafe: string): string {
        // Liste blanche des balises autorisées (sécurisées)
        const allowedTags = ['b', 'i'];

        // Échapper d'abord tous les caractères dangereux
        let escaped = unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

        // Restaurer les balises autorisées
        allowedTags.forEach(tag => {
            const openTag = new RegExp(`&lt;${tag}&gt;`, 'gi');
            const closeTag = new RegExp(`&lt;/${tag}&gt;`, 'gi');

            escaped = escaped.replace(openTag, `<${tag}>`);
            escaped = escaped.replace(closeTag, `</${tag}>`);
        });

        return escaped;
    }

    /** Attache les événements aux inputs */
    private attachEvents(): void {
        this.inputs.forEach((input, index) => {
            this.registerEvent(input, 'input', ((e: Event) => this.handleInput(e as InputEvent, index)) as EventListener);
            this.registerEvent(input, 'keydown', ((e: Event) => this.handleKeydown(e as KeyboardEvent, index)) as EventListener);
            this.registerEvent(input, 'paste', ((e: Event) => this.handlePaste(e as ClipboardEvent, index)) as EventListener);
            this.registerEvent(input, 'focus', () => this.handleFocus(index));
            this.registerEvent(input, 'blur', () => this.handleBlur(index));
        });
    }

    /** Gère la saisie dans un input */
    private handleInput(e: InputEvent, index: number): void {
        const input = e.target as HTMLInputElement;
        const value = input.value;

        // Nettoyer la valeur selon le type de caractères autorisés
        let cleanValue: string;
        switch (this.options.inputType) {
            case 'numbers':
                cleanValue = value.replace(/[^0-9]/g, '');
                break;
            case 'letters':
                cleanValue = value.replace(/[^a-zA-Z]/g, '');
                break;
            case 'mixed':
                cleanValue = value.replace(/[^0-9a-zA-Z]/g, '');
                break;
            default:
                cleanValue = value.replace(/[^0-9]/g, '');
        }

        if (cleanValue !== value) {
            input.value = cleanValue;
        }

        // Mettre à jour le PIN
        this.updatePin();

        // Validation si activée
        if (this.options.enableValidation) {
            this.validatePin();
        }

        if (cleanValue) {
            HapticManager.triggerFromOptions(this.options, 'selection');
        }

        // Auto-focus vers l'input suivant
        if (cleanValue && index < this.inputs.length - 1) {
            setTimeout(() => {
                this.focusInput(index + 1);
            }, this.options.focusDelay);
        }

        // Vérifier si le PIN est complet
        this.checkCompletion();

    }

    /** Gère les touches pressées */
    private handleKeydown(e: KeyboardEvent, index: number): void {
        const input = e.target as HTMLInputElement;

        // Backspace
        if (e.key === 'Backspace' && this.options.allowBackspace) {
            if (!input.value && index > 0) {
                // Aller à l'input précédent et le vider
                this.focusInput(index - 1);
                this.inputs[index - 1].value = '';
                this.updatePin();
                this.checkCompletion();
            }
        }

        // Flèches
        if (e.key === 'ArrowLeft' && index > 0) {
            e.preventDefault();
            this.focusInput(index - 1);
        }

        if (e.key === 'ArrowRight' && index < this.inputs.length - 1) {
            e.preventDefault();
            this.focusInput(index + 1);
        }

        // Validation par clavier (Entrée et Espace)
        if (e.key === 'Enter' || e.key === ' ') {
            if (e.key === ' ') {
                e.preventDefault(); // Empêcher le scroll
            }
            // Valider le PIN si un code attendu est défini
            if (this.options.expectedCode) {
                this.validatePin();
            }
        }

        // Supprimer les touches non autorisées selon le type
        let allowedKeys: RegExp;
        switch (this.options.inputType) {
            case 'numbers':
                allowedKeys = /[0-9]/;
                break;
            case 'letters':
                allowedKeys = /[a-zA-Z]/;
                break;
            case 'mixed':
                allowedKeys = /[0-9a-zA-Z]/;
                break;
            default:
                allowedKeys = /[0-9]/;
        }

        if (!allowedKeys.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', ' '].includes(e.key)) {
            e.preventDefault();
        }
    }

    /** Gère le collage (paste) */
    private handlePaste(e: ClipboardEvent, index: number): void {
        if (!this.options.allowPaste) {
            e.preventDefault();
            return;
        }

        e.preventDefault();

        const pastedData = e.clipboardData?.getData('text') || '';

        // Nettoyer les données selon le type de caractères autorisés
        let cleanData: string;
        switch (this.options.inputType) {
            case 'numbers':
                cleanData = pastedData.replace(/[^0-9]/g, '');
                break;
            case 'letters':
                cleanData = pastedData.replace(/[^a-zA-Z]/g, '');
                break;
            case 'mixed':
                cleanData = pastedData.replace(/[^0-9a-zA-Z]/g, '');
                break;
            default:
                cleanData = pastedData.replace(/[^0-9]/g, '');
        }

        if (cleanData) {
            // Remplir les inputs avec les données collées
            for (let i = 0; i < Math.min(cleanData.length, this.inputs.length - index); i++) {
                this.inputs[index + i].value = cleanData[i];
            }

            this.updatePin();
            this.updateCounter();

            // Focus sur le dernier input rempli ou le suivant
            const nextIndex = Math.min(index + cleanData.length, this.inputs.length - 1);
            this.focusInput(nextIndex);

            this.checkCompletion();

        }
    }

    /** Gère le focus sur un input */
    private handleFocus(index: number): void {
        // Sélectionner le contenu de l'input
        this.inputs[index].select();

        // Callback onFocus
        if (this.options.onFocus) {
            this.options.onFocus(index);
        }
    }

    /** Gère la perte de focus */
    private handleBlur(index: number): void {
        // Callback onBlur
        if (this.options.onBlur) {
            this.options.onBlur(index);
        }
    }

    /** Met à jour le PIN actuel */
    private updatePin(): void {
        this.currentPin = this.inputs.map(input => input.value).join('');
        this.updateCounter();
    }

    /** Met à jour le compteur */
    private updateCounter(): void {
        if (!this.counterElement) return;

        if (!this.options.pinCounter) {
            this.counterElement.textContent = '';
            return;
        }

        const filled = this.currentPin.length;
        const total = this.options.length;
        this.counterElement.textContent = `${filled}/${total}`;
    }

    /** Vérifie si le PIN est complet */
    private checkCompletion(): void {
        if (this.currentPin.length === this.options.length) {
            if (this.options.hapticFeedback === true) {
                HapticManager.vibrate('success');
            }
            if (this.options.onComplete) {
                this.options.onComplete(this.el, this.currentPin);
            }
        }
    }

    /** Focus sur un input spécifique */
    private focusInput(index: number): void {
        if (index >= 0 && index < this.inputs.length) {
            this.inputs[index].focus();
        }
    }

    /** Obtient la valeur actuelle du PIN */
    getValue(): string {
        return this.currentPin;
    }

    /** Définit la valeur du PIN */
    setValue(pin: string): void {
        // Nettoyer selon le type de caractères autorisés
        let cleanPin: string;
        switch (this.options.inputType) {
            case 'numbers':
                cleanPin = pin.replace(/[^0-9]/g, '');
                break;
            case 'letters':
                cleanPin = pin.replace(/[^a-zA-Z]/g, '');
                break;
            case 'mixed':
                cleanPin = pin.replace(/[^0-9a-zA-Z]/g, '');
                break;
            default:
                cleanPin = pin.replace(/[^0-9]/g, '');
        }

        cleanPin = cleanPin.substring(0, this.options.length);

        // Remplir les inputs
        for (let i = 0; i < this.inputs.length; i++) {
            this.inputs[i].value = cleanPin[i] || '';
        }

        this.updatePin();
        this.checkCompletion();
    }

    /** Efface le PIN */
    clear(): void {
        this.inputs.forEach(input => {
            input.value = '';
        });
        this.updatePin();
        this.focusInput(0);
    }

    /** Active ou désactive le composant */
    setDisabled(disabled: boolean): void {
        this.inputs.forEach(input => {
            input.disabled = disabled;
        });
        this.el.classList.toggle('pin--disabled', disabled);
    }

    /** Focus sur le premier input */
    focus(): void {
        this.focusInput(0);
    }

    /** Détruit le composant */
    /**
     * Valide le PIN actuel contre le code attendu
     */
    validatePin(): void {
        if (!this.options.expectedCode) {
            return;
        }

        const expectedCode = this.options.expectedCode;
        const currentLength = this.currentPin.length;

        // Ne valider que si le PIN est complet
        if (currentLength === expectedCode.length) {
            let isCurrentValid: boolean;
            if (this.options.caseSensitive) {
                isCurrentValid = this.currentPin === expectedCode;
            } else {
                isCurrentValid = this.currentPin.toLowerCase() === expectedCode.toLowerCase();
            }

            // Si l'état a changé, mettre à jour les classes CSS
            if (this.isValid !== isCurrentValid) {
                this.isValid = isCurrentValid;
                this.updateValidationClasses();

                // Appeler les callbacks appropriés
                if (isCurrentValid && this.options.onValid) {
                    this.options.onValid(this.currentPin);
                } else if (!isCurrentValid && this.options.onInvalid) {
                    this.options.onInvalid(this.currentPin);
                }
            }
        } else if (currentLength < expectedCode.length) {
            // PIN incomplet : réinitialiser l'état de validation
            if (this.isValid !== null) {
                this.isValid = null;
                this.updateValidationClasses();
            }
        }
    }

    /**
     * Met à jour les classes CSS de validation
     */
    updateValidationClasses(): void {
        // Supprimer les classes existantes
        this.el.classList.remove('pin--valid', 'pin--invalid');

        // Ajouter la classe appropriée
        if (this.isValid === true) {
            this.el.classList.add('pin--valid');
        } else if (this.isValid === false) {
            this.el.classList.add('pin--invalid');
        }
    }

    /**
     * Définit le code attendu et active la validation
     * @param expectedCode Code PIN attendu
     * @param enableValidation Activer la validation automatique
     */
    public setExpectedCode(expectedCode: string, enableValidation: boolean = true): void {
        this.options.expectedCode = expectedCode;
        this.options.enableValidation = enableValidation;

        // Réinitialiser l'état de validation
        this.isValid = null;
        this.updateValidationClasses();

        // Valider le PIN actuel si la validation est activée
        if (enableValidation) {
            this.validatePin();
        }
    }

    /**
     * Réinitialise l'état de validation
     */
    public resetValidation(): void {
        this.isValid = null;
        this.updateValidationClasses();
    }

    /**
     * Retourne l'état de validation actuel
     */
    public getValidationState(): boolean | null {
        return this.isValid;
    }

    destroy(): void {
        super.destroy();
    }
}

/**
 * Enregistrement du Web Component k3ui-pin
 * @description Permet l'utilisation de <k3ui-pin> dans le HTML. Initialisation par AutoInit.
 */
if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-pin')) {
    customElements.define('k3ui-pin', class extends HTMLElement {
        connectedCallback() {
            // L'initialisation sera gérée par AutoInit
            // ou manuellement via K.Pin.init(this)
            if (!this.hasAttribute('data-initialized')) {
                this.setAttribute('data-initialized', 'true');
            }
        }

        disconnectedCallback() {
            const instance = Pin.getInstance(this);
            if (instance && typeof instance.destroy === 'function') {
                instance.destroy();
            }
        }
    });
}
