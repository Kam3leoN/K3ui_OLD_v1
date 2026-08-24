/**
 * @fileoverview Composant ButtonIcon pour K3UI
 * @description Bouton d'action (icon-only) Material Design 3 Expressive — référence unique
 * @see https://m3.material.io/components/icon-buttons/overview
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import type { ButtonIconOptions } from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { setAriaAttributes, removeAriaAttribute } from '../utils/dom/aria';
import { LoggerManager } from '../core/managers';
import { ManagerFactory } from '../core/factories';
import { getButtonIconDefaults } from '../specs/components/button-icon.specs';
import { Ripple } from '../utils/effects/ripple';
import { Keyboard } from '../core/managers/KeyboardManager';
import { HapticManager } from '../core/managers/HapticManager';
import { getPointerPressReleaseBindings } from '../utils/dom/pointer';

interface KButtonIconHTMLElement extends HTMLElement {
    K_ButtonIcon?: ButtonIcon;
}

const _defaults: ButtonIconOptions = getButtonIconDefaults();

const SIZE_MAPPING: Record<string, 'xs' | 'sm' | 'md' | 'lg' | 'xl'> = {
    xs: 'xs', xsmall: 'xs',
    sm: 'sm', small: 'sm',
    md: 'md', medium: 'md',
    lg: 'lg', large: 'lg',
    xl: 'xl', xlarge: 'xl',
};

const WIDTH_MAPPING: Record<string, 'narrow' | 'default' | 'wide'> = {
    narrow: 'narrow',
    default: 'default',
    wide: 'wide',
};

const VARIANTS: ButtonIconOptions['variant'][] = ['standard', 'filled', 'tonal', 'outlined'];

export class ButtonIcon extends Component<ButtonIconOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;
    private logger: LoggerManager;
    private rippleInstance: Ripple | null = null;
    private keyboardInstance: Keyboard | null = null;
    private isLoading = false;

    static get defaults(): ButtonIconOptions {
        return { ..._defaults };
    }

    static getInstance(el: HTMLElement): ButtonIcon | null {
        return (el as KButtonIconHTMLElement).K_ButtonIcon ?? null;
    }

    static init(
        els: KElement | InitElements<KElement> | string,
        options: Partial<ButtonIconOptions> = {}
    ): ButtonIcon[] {
        return Component.init(els, options, toComponentClassDef(ButtonIcon)) as ButtonIcon[];
    }

    constructor(el: HTMLElement, options: Partial<ButtonIconOptions> = {}) {
        super(el, options, toComponentClassDef(ButtonIcon));
        this.logger = ManagerFactory.getLoggerManager('[ButtonIcon]');
        this.options = { ...ButtonIcon.defaults, ...options };
        (el as KButtonIconHTMLElement).K_ButtonIcon = this;
        this.init();
    }

    private init(): void {
        this.applyClasses();
        this.setupAccessibility();
        this.attachEventListeners();
        this.attachPressReleaseListeners();
        if (this.options.ripple) this.setupRipple();
        if (this.el.hasAttribute('disabled') || this.el.getAttribute('aria-disabled') === 'true') this.disable();
        if (this.el.classList.contains('btn-icon--loading') || this.el.classList.contains('button-icon--loading')) {
            this.setLoading(true);
        }
        this.logger.info('ButtonIcon initialized');
    }

    private ensureBaseClass(): void {
        if (!this.el.classList.contains('btn-icon') && !this.el.classList.contains('button-icon')) {
            this.el.classList.add('btn-icon');
        }
    }

    private detectFromHTML(): {
        size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | null;
        width: 'narrow' | 'default' | 'wide' | null;
        variant: ButtonIconOptions['variant'] | null;
        selected: boolean | null;
    } {
        let size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | null = null;
        for (const [cls, norm] of Object.entries(SIZE_MAPPING)) {
            if (
                this.el.classList.contains(`btn-icon--${cls}`) ||
                this.el.classList.contains(`button-icon--${cls}`) ||
                this.el.classList.contains(`btn--${cls}`)
            ) {
                size = norm;
                break;
            }
        }
        let width: 'narrow' | 'default' | 'wide' | null = null;
        if (this.el.classList.contains('btn-icon--narrow') || this.el.classList.contains('button-icon--narrow')) width = 'narrow';
        else if (this.el.classList.contains('btn-icon--wide') || this.el.classList.contains('button-icon--wide')) width = 'wide';
        let variant: ButtonIconOptions['variant'] | null = null;
        for (const v of VARIANTS) {
            if (this.el.classList.contains(`btn-icon--${v}`) || this.el.classList.contains(`button-icon--${v}`)) {
                variant = v;
                break;
            }
        }
        const selected = this.el.classList.contains('btn-icon--selected') ||
            this.el.classList.contains('button-icon--selected') ||
            this.el.getAttribute('aria-pressed') === 'true' ||
            this.el.getAttribute('data-selected') === 'true';
        return { size, width, variant, selected: selected ? true : null };
    }

    private removeOldClasses(): void {
        ['xs', 'xsmall', 'sm', 'small', 'md', 'medium', 'lg', 'large', 'xl', 'xlarge'].forEach(c => {
            this.el.classList.remove(`btn-icon--${c}`, `button-icon--${c}`);
        });
        ['narrow', 'wide', 'default'].forEach(c => {
            this.el.classList.remove(`btn-icon--${c}`, `button-icon--${c}`);
        });
        VARIANTS.forEach(v => {
            this.el.classList.remove(`btn-icon--${v}`, `button-icon--${v}`);
        });
        this.el.classList.remove('btn-icon--selected', 'button-icon--selected');
    }

    private applyClasses(): void {
        this.ensureBaseClass();
        const detected = this.detectFromHTML();
        this.removeOldClasses();

        const size = detected.size ?? (SIZE_MAPPING[this.options.size] || 'md');
        this.el.classList.add(`btn-icon--${size}`, `button-icon--${size}`);
        this.options.size = size === 'xs' ? 'xs' : size === 'sm' ? 'sm' : size === 'md' ? 'md' : size === 'lg' ? 'lg' : 'xl';

        const width = detected.width ?? this.options.width;
        if (width !== 'default') {
            this.el.classList.add(`btn-icon--${width}`, `button-icon--${width}`);
        }
        this.options.width = width;

        const variant = detected.variant ?? this.options.variant;
        this.el.classList.add(`btn-icon--${variant}`, `button-icon--${variant}`);
        this.options.variant = variant;

        const selected = detected.selected ?? this.options.selected;
        if (selected) {
            this.el.classList.add('btn-icon--selected', 'button-icon--selected');
            setAriaAttributes(this.el, { 'aria-pressed': 'true' });
        } else {
            removeAriaAttribute(this.el, 'aria-pressed');
        }
        this.options.selected = selected;
    }

    private setupAccessibility(): void {
        if (this.el.tagName !== 'BUTTON' && this.el.tagName !== 'A') {
            setAriaAttributes(this.el, { role: 'button' });
        }
        if (!this.el.hasAttribute('tabindex') && this.el.tagName !== 'BUTTON' && this.el.tagName !== 'A') {
            this.el.setAttribute('tabindex', '0');
        }
    }

    private attachEventListeners(): void {
        this.keyboardInstance = new Keyboard({
            target: this.el,
            onKeyDown: (e: KeyboardEvent) => {
                if (this.isLoading || this.el.hasAttribute('disabled') || this.el.getAttribute('aria-disabled') === 'true') return;
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.el.click();
                }
            },
        });
        this.registerEvent(this.el, 'click', (e: MouseEvent) => {
            if (this.isLoading || this.el.hasAttribute('disabled') || this.el.getAttribute('aria-disabled') === 'true') {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            HapticManager.triggerFromOptions(this.options, 'medium');
        });
    }

    /**
     * Attache les listeners pour le morph press/release (M3 Expressive), comme Button.
     * Square : keyframes .pressing (square → pill) / .releasing (pill → square).
     * Round (défaut) : calque d’état circulaire uniquement (pas de morph vers 8dp des boutons texte).
     */
    private attachPressReleaseListeners(): void {
        /* Toolbar : state layer circulaire M3, pas de morph press des boutons label */
        if (this.el.classList.contains('toolbar__item')) {
            return;
        }
        const el = this.el;
        const bindings = getPointerPressReleaseBindings(el, {
            onPress: () => this.handlePress(),
            onRelease: () => this.handleRelease(),
            onDocumentRelease: () => {
                if (el.classList.contains('pressing')) {
                    ButtonIcon.releaseBtnIcon(el);
                }
            },
        });
        bindings.forEach(({ target, type, handler, options }) => {
            this.registerEvent(target, type, handler, options);
        });
    }

    private handlePress(): void {
        if (this.isLoading || this.el.hasAttribute('disabled') || this.el.getAttribute('aria-disabled') === 'true') return;
        ButtonIcon.pressBtnIcon(this.el);
    }

    private handleRelease(): void {
        ButtonIcon.releaseBtnIcon(this.el);
    }

    /**
     * Applique l'état press (morph) — Square: keyframes squircle ; Round: transition.
     * requestAnimationFrame pour que le navigateur applique la transition avant le changement d’état (morph fluide).
     */
    static pressBtnIcon(el: HTMLElement): void {
        el.classList.remove('btn-icon--shape-to-square', 'btn-icon--shape-to-round', 'button-icon--shape-to-square', 'button-icon--shape-to-round');
        (el as HTMLElement).style.removeProperty('animation');
        const isSquare = el.classList.contains('btn-icon--square') || el.classList.contains('button-icon--square');
        if (isSquare) {
            (el as HTMLElement).style.removeProperty('transition');
            el.classList.remove('releasing');
            void (el as HTMLElement).offsetWidth;
            el.classList.add('pressing');
        } else {
            el.classList.add('pressing');
        }
    }

    /**
     * Retire l'état press — Square: keyframes pill→square ; Round: transition.
     * requestAnimationFrame pour que la transition de retour s’applique correctement.
     */
    static releaseBtnIcon(el: HTMLElement): void {
        if (!el.classList.contains('pressing')) return;
        const isSquare = el.classList.contains('btn-icon--square') || el.classList.contains('button-icon--square');
        if (isSquare) {
            (el as HTMLElement).style.removeProperty('transition');
            el.classList.remove('pressing');
            void (el as HTMLElement).offsetWidth;
            el.classList.add('releasing');
            el.addEventListener('animationend', () => {
                el.classList.remove('releasing');
                (el as HTMLElement).style.removeProperty('transition');
            }, { once: true });
        } else {
            el.classList.remove('pressing');
        }
    }

    private setupRipple(): void {
        try {
            this.rippleInstance = new Ripple(this.el);
            this.rippleInstance.attach();
        } catch (err) {
            this.logger.warn('Ripple setup failed', { error: err });
        }
    }

    setLoading(loading: boolean): void {
        this.isLoading = loading;
        if (loading) {
            this.el.classList.add('btn-icon--loading', 'button-icon--loading');
            setAriaAttributes(this.el, { 'aria-busy': 'true' });
            (this.el as HTMLButtonElement).disabled = true;
        } else {
            this.el.classList.remove('btn-icon--loading', 'button-icon--loading');
            removeAriaAttribute(this.el, 'aria-busy');
            if (!this.el.hasAttribute('disabled') && this.el.getAttribute('aria-disabled') !== 'true') {
                (this.el as HTMLButtonElement).disabled = false;
            }
        }
    }

    disable(): void {
        (this.el as HTMLButtonElement).disabled = true;
        setAriaAttributes(this.el, { 'aria-disabled': 'true' });
    }

    enable(): void {
        (this.el as HTMLButtonElement).disabled = false;
        removeAriaAttribute(this.el, 'aria-disabled');
    }

    setSelected(selected: boolean): void {
        this.options.selected = selected;
        if (selected) {
            this.el.classList.add('btn-icon--selected', 'button-icon--selected');
            setAriaAttributes(this.el, { 'aria-pressed': 'true' });
        } else {
            this.el.classList.remove('btn-icon--selected', 'button-icon--selected');
            removeAriaAttribute(this.el, 'aria-pressed');
        }
    }

    setVariant(variant: ButtonIconOptions['variant']): void {
        VARIANTS.forEach(v => this.el.classList.remove(`btn-icon--${v}`, `button-icon--${v}`));
        this.options.variant = variant;
        this.el.classList.add(`btn-icon--${variant}`, `button-icon--${variant}`);
    }

    setSize(size: ButtonIconOptions['size']): void {
        const norm = SIZE_MAPPING[size] || 'md';
        Object.keys(SIZE_MAPPING).forEach(c => this.el.classList.remove(`btn-icon--${c}`, `button-icon--${c}`));
        this.options.size = norm === 'xs' ? 'xs' : norm === 'sm' ? 'sm' : norm === 'md' ? 'md' : norm === 'lg' ? 'lg' : 'xl';
        this.el.classList.add(`btn-icon--${norm}`, `button-icon--${norm}`);
    }

    setWidth(width: ButtonIconOptions['width']): void {
        this.el.classList.remove('btn-icon--narrow', 'button-icon--narrow', 'btn-icon--wide', 'button-icon--wide');
        this.options.width = width;
        if (width !== 'default') this.el.classList.add(`btn-icon--${width}`, `button-icon--${width}`);
    }

    override destroy(): void {
        if (this.rippleInstance) {
            try { this.rippleInstance.detach(); } catch (_) {}
            this.rippleInstance = null;
        }
        this.keyboardInstance = null;
        if ((this.el as KButtonIconHTMLElement).K_ButtonIcon === this) {
            delete (this.el as KButtonIconHTMLElement).K_ButtonIcon;
        }
        this.logger.info('ButtonIcon destroyed');
    }
}

/**
 * Custom Element <k3ui-button-icon>
 * @description Permet l'utilisation de <k3ui-button-icon> dans le HTML. Initialisation par AutoInit.
 */
if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-button-icon')) {
    customElements.define('k3ui-button-icon', class extends HTMLElement {
        connectedCallback() {
            if (!this.hasAttribute('data-initialized')) this.setAttribute('data-initialized', 'true');
        }
        /** Pas d'instance stockée sur l'élément : AutoInit attache K_ButtonIcon sur this.el ; le CE est le même nœud, destroy géré par ButtonIcon.init/destroy. */
        disconnectedCallback() {}
    });
}
