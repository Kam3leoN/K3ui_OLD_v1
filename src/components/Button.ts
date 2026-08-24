/**
 * @fileoverview Composant Button pour K3UI
 * @description Composant de bouton conforme aux spécifications Material Design 3 Expressive
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { defineK3UIElement } from '../core/base/K3UIElement';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import { ButtonOptions } from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { setAriaAttributes, removeAriaAttribute } from '../utils/dom/aria';
import { LoggerManager } from '../core/managers';
import { ManagerFactory } from '../core/factories';
import { getButtonDefaults } from '../specs/components/button.specs';
import { Ripple } from '../utils/effects/ripple';
import { Keyboard } from '../core/managers/KeyboardManager';
import { HapticManager } from '../core/managers/HapticManager';
import { getPointerPressReleaseBindings } from '../utils/dom/pointer';

interface KButtonHTMLElement extends HTMLElement {
    K_Button?: Button;
}

/**
 * Valeurs par défaut pour les options
 */
const _defaults: ButtonOptions = getButtonDefaults();

/**
 * Classe Button pour K3UI
 * @description Composant de bouton Material Design 3 Expressive avec support des variantes, tailles, et états
 */
export class Button extends Component<ButtonOptions> {
    /** Niveau de priorité du composant */
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    /** Logger pour le composant */
    private logger: LoggerManager;

    /** Instance du ripple */
    private rippleInstance: Ripple | null = null;

    /** Instance du gestionnaire clavier */
    private keyboardInstance: Keyboard | null = null;

    /** État de chargement */
    private isLoading: boolean = false;

    /**
     * Options par défaut du composant
     * @returns Les options par défaut
     */
    static get defaults(): ButtonOptions {
        return { ..._defaults };
    }

    /**
     * Obtient l'instance du composant pour un élément donné
     * @param el Élément HTML
     * @returns L'instance Button
     */
    static getInstance(el: HTMLElement): Button | null {
        return (el as KButtonHTMLElement).K_Button || null;
    }

    /**
     * Initialise les composants
     * @param els Éléments HTML ou sélecteur CSS
     * @param options Options de configuration
     * @returns Tableau des instances créées
     */
    static init(
        els: KElement | InitElements<KElement> | string,
        options: Partial<ButtonOptions> = {}
    ): Button[] {
        return Component.init(els, options, toComponentClassDef(Button)) as Button[];
    }

    /**
     * Constructeur du composant
     * @param el Élément HTML
     * @param options Options de configuration
     */
    constructor(el: HTMLElement, options: Partial<ButtonOptions> = {}) {
        super(el, options, toComponentClassDef(Button));

        this.logger = ManagerFactory.getLoggerManager('[Button]');

        // Initialiser les options (les options passées en paramètre ont la priorité sur les defaults)
        this.options = {
            ...Button.defaults,
            ...options,
        };


        // Stocker l'instance sur l'élément
        (el as KButtonHTMLElement).K_Button = this;

        // Initialiser le composant
        this.init();
    }

    /**
     * Initialise le composant
     * @private
     */
    private init(): void {
        // Appliquer les classes CSS selon les options
        this.applyClasses();

        // Configurer l'accessibilité
        this.setupAccessibility();

        // Attacher les événements
        this.attachEventListeners();

        // Configurer le ripple si activé
        if (this.options.ripple) {
            this.setupRipple();
        }

        // Gérer l'état disabled initial
        if (this.el.hasAttribute('disabled') || this.el.getAttribute('aria-disabled') === 'true') {
            this.disable();
        }

        // Gérer l'état loading initial
        if (this.el.classList.contains('btn--loading') || this.el.classList.contains('button--loading')) {
            this.setLoading(true);
        }

        this.logger.info('Component initialized');
    }

    /**
     * Mapping des tailles (support des deux conventions)
     */
    private static readonly SIZE_MAPPING: Record<string, 'xs' | 'sm' | 'md' | 'lg' | 'xl'> = {
        'xs': 'xs',
        'xsmall': 'xs',
        'sm': 'sm',
        'small': 'sm',
        'md': 'md',
        'medium': 'md',
        'lg': 'lg',
        'large': 'lg',
        'xl': 'xl',
        'xlarge': 'xl'
    };

    /**
     * Types de boutons disponibles
     */
    private static readonly TYPES: ButtonOptions['type'][] = ['filled', 'tonal', 'elevated', 'outlined', 'text'];

    /**
     * Formes disponibles
     */
    private static readonly SHAPES: ButtonOptions['shape'][] = ['rounded', 'square'];

    /**
     * Tailles normalisées
     */
    private static readonly NORMALIZED_SIZES: ('xs' | 'sm' | 'md' | 'lg' | 'xl')[] = ['xs', 'sm', 'md', 'lg', 'xl'];

    /**
     * Applique les classes CSS selon les options
     * @private
     */
    private applyClasses(): void {
        // Ajouter la classe de base
        this.ensureBaseClass();

        // Détecter les attributs depuis le HTML (AVANT de retirer les classes)
        const detected = this.detectAttributesFromHTML();

        // Retirer toutes les anciennes classes
        this.removeOldClasses();

        // Appliquer les nouvelles classes
        this.applyNewClasses(detected);
    }

    /**
     * S'assure que la classe de base est présente
     * @private
     */
    private ensureBaseClass(): void {
        if (!this.el.classList.contains('btn') && !this.el.classList.contains('button')) {
            this.el.classList.add('btn');
        }
    }

    /**
     * Détecte les attributs depuis les classes HTML existantes
     * @private
     * @returns Objet contenant les attributs détectés
     */
    private detectAttributesFromHTML(): {
        size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | null;
        type: ButtonOptions['type'] | null;
        shape: ButtonOptions['shape'] | undefined;
    } {
        let detectedSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | null = null;
        for (const [cssClass, normalizedSize] of Object.entries(Button.SIZE_MAPPING)) {
            if (this.el.classList.contains(`btn--${cssClass}`) || this.el.classList.contains(`button--${cssClass}`)) {
                detectedSize = normalizedSize;
                break;
            }
        }

        let detectedType: ButtonOptions['type'] | null = null;
        for (const type of Button.TYPES) {
            if (this.el.classList.contains(`btn--${type}`) || this.el.classList.contains(`button--${type}`)) {
                detectedType = type;
                break;
            }
        }

        let detectedShape: ButtonOptions['shape'] | undefined = undefined;
        for (const shape of Button.SHAPES) {
            if (this.el.classList.contains(`btn--${shape}`) || this.el.classList.contains(`button--${shape}`)) {
                detectedShape = shape;
                break;
            }
        }

        return { size: detectedSize, type: detectedType, shape: detectedShape };
    }

    /**
     * Retire toutes les anciennes classes liées au Button
     * @private
     * @description Préserve les classes personnalisées (comme select--right, switch-theme, etc.)
     */
    private removeOldClasses(): void {
        // Retirer les classes de taille
        Object.keys(Button.SIZE_MAPPING).forEach(cssClass => {
            this.el.classList.remove(`btn--${cssClass}`, `button--${cssClass}`);
        });

        // Retirer les classes de type
        Button.TYPES.forEach(type => {
            this.el.classList.remove(`btn--${type}`, `button--${type}`);
        });

        // Retirer les classes de shape
        Button.SHAPES.forEach(shape => {
            this.el.classList.remove(`btn--${shape}`, `button--${shape}`);
        });

        // NOTE: Les classes personnalisées (select--right, switch-theme, etc.) sont préservées
    }

    /**
     * Applique les nouvelles classes selon les attributs détectés
     * @private
     * @param detected Attributs détectés depuis le HTML
     */
    private applyNewClasses(detected: {
        size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | null;
        type: ButtonOptions['type'] | null;
        shape: ButtonOptions['shape'] | undefined;
    }): void {
        const normalizedOptionsSize = Button.SIZE_MAPPING[this.options.size] || 'md';
        const finalSize = detected.size || normalizedOptionsSize;
        this.applySizeClass(finalSize);

        const finalType = detected.type || this.options.type;
        this.applyTypeClass(finalType);

        const finalShape = detected.shape || this.options.shape;
        this.applyShapeClass(finalShape);
    }

    /**
     * Applique la classe de taille
     * @private
     */
    private applySizeClass(size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'): void {
        this.el.classList.add(`btn--${size}`, `button--${size}`);
        // Convertir la taille normalisée en format ButtonOptions['size'] (utiliser la version courte)
        this.options.size = size as ButtonOptions['size'];
    }

    /**
     * Applique la classe de type
     * @private
     */
    private applyTypeClass(type: ButtonOptions['type'] | null): void {
        const finalType = type ?? this.options.type;
        this.el.classList.add(`btn--${finalType}`, `button--${finalType}`);
        this.options.type = finalType;
    }

    /**
     * Applique la classe de forme
     * @private
     */
    private applyShapeClass(shape: ButtonOptions['shape'] | undefined): void {
        if (shape === 'square') {
            this.el.classList.add(`btn--${shape}`, `button--${shape}`);
            this.options.shape = shape;
        } else if (shape === 'rounded') {
            this.el.classList.add(`btn--${shape}`, `button--${shape}`);
            this.options.shape = shape;
        }
    }

    /**
     * Configure l'accessibilité
     * @private
     */
    private setupAccessibility(): void {
        // S'assurer que l'élément a le rôle button
        if (this.el.tagName.toLowerCase() !== 'button' && this.el.tagName.toLowerCase() !== 'a') {
            setAriaAttributes(this.el, {
                role: 'button',
            });
        }

        // Ajouter tabindex si nécessaire
        if (!this.el.hasAttribute('tabindex') && this.el.tagName.toLowerCase() !== 'button' && this.el.tagName.toLowerCase() !== 'a') {
            this.el.setAttribute('tabindex', '0');
        }
    }

    /**
     * Attache les événements
     * @private
     */
    private attachEventListeners(): void {
        // Gestionnaire clavier
        this.keyboardInstance = new Keyboard({
            target: this.el,
            onKeyDown: (event: KeyboardEvent) => {
                this.handleKeyDown(event);
            },
        });

        // Gestionnaire de clic
        this.registerEvent(this.el, 'click', this.handleClick.bind(this));

        // Shape morph press/release — Round: transition CSS ; Square: @keyframes squircle
        this.attachPressReleaseListeners();
    }

    /**
     * Attache les listeners pour le morph press/release (M3 Expressive).
     * Round : transition CSS (.pressing → border-radius 8px + scale).
     * Square : @keyframes .pressing / .releasing (squircle intermédiaire).
     * @private
     */
    private attachPressReleaseListeners(): void {
        const el = this.el;
        const bindings = getPointerPressReleaseBindings(el, {
            onPress: () => this.handlePress(),
            onRelease: () => this.handleRelease(),
            onDocumentRelease: () => {
                if (el.classList.contains('pressing')) {
                    Button.releaseBtn(el);
                }
            },
        });
        bindings.forEach(({ target, type, handler, options }) => {
            this.registerEvent(target, type, handler, options);
        });
    }

    private handlePress(): void {
        if (this.isLoading || this.el.hasAttribute('disabled') || this.el.getAttribute('aria-disabled') === 'true') return;
        Button.pressBtn(this.el);
    }

    private handleRelease(): void {
        Button.releaseBtn(this.el);
    }

    /** M3 Expressive — spatial-fast (press) */
    private static readonly MOTION_BORDER_RADIUS_SPATIAL_FAST =
        'border-radius var(--md-sys-motion-spatial-fast-duration) var(--md-sys-motion-spatial-fast-easing)';

    /** M3 Expressive — spatial-default / emphasized (release) */
    private static readonly MOTION_BORDER_RADIUS_SPATIAL_EMPHASIZED =
        'border-radius var(--md-sys-motion-spatial-default-duration) var(--md-sys-motion-spatial-default-easing)';

    /**
     * Applique l'état press (morph) — Round: transition spatial-fast ; Square: keyframes squircle.
     * @param el Élément bouton (.btn ou .button)
     */
    static pressBtn(el: HTMLElement): void {
        const htmlEl = el as HTMLElement;
        if (el.classList.contains('btn--square') || el.classList.contains('button--square')) {
            htmlEl.style.removeProperty('transition');
            htmlEl.style.removeProperty('animation');
            el.classList.remove('releasing');
            void htmlEl.offsetWidth;
            el.classList.add('pressing');
        } else if (el.classList.contains('btn--rounded') || el.classList.contains('button--rounded')) {
            htmlEl.style.transition = Button.MOTION_BORDER_RADIUS_SPATIAL_FAST;
            void htmlEl.offsetWidth;
            el.classList.add('pressing');
        }
    }

    /**
     * Retire l'état press — Round: transition spatial-default (emphasized) ; Square: keyframes pillToSquare.
     * @param el Élément bouton (.btn ou .button)
     */
    static releaseBtn(el: HTMLElement): void {
        if (!el.classList.contains('pressing')) return;

        const htmlEl = el as HTMLElement;

        if (el.classList.contains('btn--square') || el.classList.contains('button--square')) {
            htmlEl.style.removeProperty('transition');
            el.classList.remove('pressing');
            void htmlEl.offsetWidth;
            el.classList.add('releasing');
            el.addEventListener('animationend', () => {
                el.classList.remove('releasing');
                htmlEl.style.removeProperty('transition');
            }, { once: true });
        } else if (el.classList.contains('btn--rounded') || el.classList.contains('button--rounded')) {
            htmlEl.style.transition = Button.MOTION_BORDER_RADIUS_SPATIAL_EMPHASIZED;
            void htmlEl.offsetWidth;
            el.classList.remove('pressing');
            htmlEl.addEventListener('transitionend', () => {
                htmlEl.style.removeProperty('transition');
            }, { once: true });
        }
    }

    /**
     * Gère l'événement clic
     * @param event Événement de clic
     * @private
     */
    private handleClick(event: MouseEvent): void {
        if (this.isLoading || this.el.hasAttribute('disabled') || this.el.getAttribute('aria-disabled') === 'true') {
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        HapticManager.triggerFromOptions(this.options, 'medium');
    }

    /**
     * Gère l'événement clavier
     * @param event Événement clavier
     * @private
     */
    private handleKeyDown(event: KeyboardEvent): void {
        if (this.isLoading || this.el.hasAttribute('disabled') || this.el.getAttribute('aria-disabled') === 'true') {
            return;
        }

        // Enter ou Space déclenchent le clic
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.el.click();
        }
    }

    /**
     * Configure le ripple
     * @private
     */
    private setupRipple(): void {
        try {
            this.rippleInstance = new Ripple(this.el);
            this.rippleInstance.attach();
        } catch (error) {
            this.logger.warn('Failed to setup ripple effect', { error });
        }
    }

    /**
     * Définit l'état de chargement
     * @param loading État de chargement
     */
    public setLoading(loading: boolean): void {
        this.isLoading = loading;

        const buttonEl = this.el as HTMLButtonElement;

        if (loading) {
            this.el.classList.add('btn--loading', 'button--loading');
            setAriaAttributes(this.el, {
                'aria-busy': 'true',
            });
            if (buttonEl) {
                buttonEl.disabled = true;
            }
        } else {
            this.el.classList.remove('btn--loading', 'button--loading');
            removeAriaAttribute(this.el, 'aria-busy');
            // Restaurer l'état disabled selon les options
            if (buttonEl && !this.el.hasAttribute('disabled') && this.el.getAttribute('aria-disabled') !== 'true') {
                buttonEl.disabled = false;
            }
        }
    }

    /**
     * Désactive le bouton
     */
    public disable(): void {
        const buttonEl = this.el as HTMLButtonElement;
        if (buttonEl) {
            buttonEl.disabled = true;
        }
        setAriaAttributes(this.el, {
            'aria-disabled': 'true',
        });
    }

    /**
     * Active le bouton
     */
    public enable(): void {
        const buttonEl = this.el as HTMLButtonElement;
        if (buttonEl) {
            buttonEl.disabled = false;
        }
        removeAriaAttribute(this.el, 'aria-disabled');
    }

    /**
     * Change le type de bouton
     * @param type Nouveau type
     */
    public setType(type: ButtonOptions['type']): void {
        // Retirer l'ancien type
        const oldTypeClass = `btn--${this.options.type}`;
        const oldTypeClassAlt = `button--${this.options.type}`;
        this.el.classList.remove(oldTypeClass, oldTypeClassAlt);

        // Ajouter le nouveau type
        this.options.type = type;
        const newTypeClass = `btn--${type}`;
        const newTypeClassAlt = `button--${type}`;
        this.el.classList.add(newTypeClass, newTypeClassAlt);
    }

    /**
     * Change la taille du bouton
     * @param size Nouvelle taille
     */
    public setSize(size: ButtonOptions['size']): void {
        // Normaliser la taille
        const sizeMapping: Record<string, 'xs' | 'sm' | 'md' | 'lg' | 'xl'> = {
            'xs': 'xs',
            'xsmall': 'xs',
            'sm': 'sm',
            'small': 'sm',
            'md': 'md',
            'medium': 'md',
            'lg': 'lg',
            'large': 'lg',
            'xl': 'xl',
            'xlarge': 'xl'
        };
        const normalizedSize = sizeMapping[size] || 'md';
        const oldNormalizedSize = sizeMapping[this.options.size] || 'md';

        // Retirer toutes les anciennes classes de taille (toutes les variantes)
        Object.keys(sizeMapping).forEach(cssClass => {
            this.el.classList.remove(`btn--${cssClass}`, `button--${cssClass}`);
        });

        // Ajouter la nouvelle taille (utiliser la convention courte)
        this.options.size = size;
        const newSizeClass = `btn--${normalizedSize}`;
        const newSizeClassAlt = `button--${normalizedSize}`;
        this.el.classList.add(newSizeClass, newSizeClassAlt);
    }

    /**
     * Détruit l'instance du composant
     */
    public override destroy(): void {
        // Nettoyer le ripple
        if (this.rippleInstance) {
            try {
                this.rippleInstance.detach();
            } catch (error) {
                this.logger.warn('Failed to detach ripple', { error });
            }
            this.rippleInstance = null;
        }

        // Nettoyer le clavier
        if (this.keyboardInstance) {
            // Le Keyboard n'a pas de méthode destroy, mais on peut le laisser se nettoyer automatiquement
            this.keyboardInstance = null;
        }

        // Les événements sont automatiquement nettoyés par registerEvent() dans onDestroy()

        // Nettoyer l'instance
        if ((this.el as KButtonHTMLElement).K_Button === this) {
            delete (this.el as KButtonHTMLElement).K_Button;
        }

        this.logger.info('Component destroyed');
        super.destroy();
    }
}

defineK3UIElement('k3ui-button', Button);

