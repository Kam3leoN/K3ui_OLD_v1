/**
 * @fileoverview Composant ButtonShape pour K3UI
 * @description Bouton pastille Material Design 3 Expressive avec slots shape overhang (leading/trailing)
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { toComponentClassDef } from '../types/components/component-base';
import type { ButtonShapeOptions, ButtonShapeName } from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { setAriaAttribute, setAriaAttributes, removeAriaAttribute } from '../utils/dom/aria';
import { LoggerManager } from '../core/managers';
import { ManagerFactory } from '../core/factories';
import { getButtonShapeDefaults } from '../specs/components/button-shape.specs';
import { Ripple } from '../utils/effects/ripple';
import { Keyboard } from '../core/managers/KeyboardManager';
import { HapticManager } from '../core/managers/HapticManager';
import { getK3uiWindowOptions } from '../core/autoinit/window-options';
import { getPointerPressReleaseBindings } from '../utils/dom/pointer';

interface KButtonShapeHTMLElement extends HTMLElement {
    K_ButtonShape?: ButtonShape;
}

const _defaults: ButtonShapeOptions = getButtonShapeDefaults();

const SIZE_MAPPING: Record<string, 'xs' | 'sm' | 'md' | 'lg' | 'xl'> = {
    xs: 'xs', xsmall: 'xs',
    sm: 'sm', small: 'sm',
    md: 'md', medium: 'md',
    lg: 'lg', large: 'lg',
    xl: 'xl', xlarge: 'xl',
};

const VARIANTS: ButtonShapeOptions['variant'][] = ['filled', 'tonal'];

/** Shapes supportées par ButtonShape */
const BUTTON_SHAPES: readonly ButtonShapeName[] = ['sunny', 'octagonal-circle'];
const DEFAULT_BUTTON_SHAPE: ButtonShapeName = 'sunny';

function isButtonShapeName(value: string): value is ButtonShapeName {
    return (BUTTON_SHAPES as readonly string[]).includes(value);
}

/**
 * Bouton pastille M3 avec pastilles shape overhang (leading / trailing).
 * Morph press/release du border-radius (comme Button rounded), désactivable via morph: false.
 */
export class ButtonShape extends Component<ButtonShapeOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;
    private logger: LoggerManager;
    private rippleInstance: Ripple | null = null;
    private keyboardInstance: Keyboard | null = null;
    private leadingSlot: HTMLElement | null = null;
    private trailingSlot: HTMLElement | null = null;
    private labelEl: HTMLElement | null = null;

    /**
     * Options par défaut du composant
     */
    static get defaults(): ButtonShapeOptions {
        return { ..._defaults };
    }

    /**
     * Récupère l’instance attachée à un élément
     * @param el - Élément DOM
     */
    static getInstance(el: HTMLElement): ButtonShape | null {
        return (el as KButtonShapeHTMLElement).K_ButtonShape ?? null;
    }

    /**
     * Initialise un ou plusieurs éléments
     * @param els - Élément(s) ou sélecteur
     * @param options - Options partielles
     */
    static init(
        els: KElement | InitElements<KElement> | string,
        options: Partial<ButtonShapeOptions> = {}
    ): ButtonShape[] {
        return Component.init(els, options, toComponentClassDef(ButtonShape)) as ButtonShape[];
    }

    /**
     * Résout le chemin des assets shapes (même priorité que Shape)
     */
    private static getAssetsPath(
        globalOptions: Partial<ButtonShapeOptions>,
        options: Partial<ButtonShapeOptions>,
        dataOptions: Partial<ButtonShapeOptions>
    ): string {
        if (dataOptions.assetsPath) return dataOptions.assetsPath;
        if (options.assetsPath) return options.assetsPath;
        if (globalOptions.assetsPath) return globalOptions.assetsPath;

        // Fallback : même chemin que Shape (docs → /k3ui/assets/images/shapes/)
        const winOpts = typeof window !== 'undefined'
            ? (getK3uiWindowOptions() as Record<string, unknown>)
            : {};
        const shapeOpts = (winOpts['Shape'] ?? {}) as { assetsPath?: string };
        if (shapeOpts.assetsPath) return shapeOpts.assetsPath;

        if (typeof window !== 'undefined') {
            const pathname = window.location.pathname;
            const pathParts = pathname.split('/').filter(p => p);
            // Sur k3ui-docs, les SVG restent sous /k3ui/assets/
            if (pathParts[0] === 'k3ui-docs') {
                return '/k3ui/assets/images/shapes/';
            }
            if (pathParts.length > 0) {
                return `/${pathParts[0]}/assets/images/shapes/`;
            }
        }

        return '/k3ui/assets/images/shapes/';
    }

    /**
     * Applique le mask-image sur un slot (fond coloré + SVG shape), sans img
     */
    private static applySlotMask(slot: HTMLElement, assetsPath: string, shape: string): void {
        const fullPath = `${assetsPath}${shape}.svg`;
        const absolutePath = fullPath.startsWith('http')
            ? fullPath
            : `${typeof window !== 'undefined' ? window.location.origin : ''}${fullPath.startsWith('/') ? fullPath : `/${fullPath}`}`;

        slot.style.setProperty('--k3ui-shape-path', absolutePath);
        slot.style.setProperty('mask-image', `url(${absolutePath})`, 'important');
        slot.style.setProperty('mask-size', '100% 100%', 'important');
        slot.style.setProperty('mask-repeat', 'no-repeat', 'important');
        slot.style.setProperty('mask-position', 'center', 'important');
        slot.style.setProperty('mask-mode', 'alpha', 'important');
        slot.style.setProperty('-webkit-mask-image', `url(${absolutePath})`, 'important');
        slot.style.setProperty('-webkit-mask-size', '100% 100%', 'important');
        slot.style.setProperty('-webkit-mask-repeat', 'no-repeat', 'important');
        slot.style.setProperty('-webkit-mask-position', 'center', 'important');
    }

    constructor(el: HTMLElement, options: Partial<ButtonShapeOptions> = {}) {
        super(el, options, toComponentClassDef(ButtonShape));
        this.logger = ManagerFactory.getLoggerManager('[ButtonShape]');

        const winOpts = getK3uiWindowOptions() as Record<string, unknown>;
        const globalOptions = (winOpts['ButtonShape'] ?? {}) as Partial<ButtonShapeOptions>;
        const dataOptions = this.readDataOptions();
        const assetsPath = ButtonShape.getAssetsPath(globalOptions, options, dataOptions);

        this.options = {
            ...ButtonShape.defaults,
            ...globalOptions,
            ...options,
            ...dataOptions,
            assetsPath,
        };

        (el as KButtonShapeHTMLElement).K_ButtonShape = this;
        this.init();
    }

    private init(): void {
        this.options.onOpenStart?.(this.el);
        this.ensureDomStructure();
        this.applyClasses();
        this.applySlotShapes();
        this.setupAccessibility();
        this.attachEventListeners();
        if (this.options.morph !== false) {
            this.attachPressReleaseListeners();
        } else {
            this.el.classList.add('btn-shape--no-morph', 'button-shape--no-morph');
        }
        if (this.options.ripple) this.setupRipple();
        if (this.el.hasAttribute('disabled') || this.el.getAttribute('aria-disabled') === 'true') {
            this.disable();
        }
        this.logger.info('ButtonShape initialized');
        this.options.onOpenEnd?.(this.el);
    }

    private readDataOptions(): Partial<ButtonShapeOptions> {
        const data: Partial<ButtonShapeOptions> = {};
        const ds = this.el.dataset;

        if (ds.variant && VARIANTS.includes(ds.variant as ButtonShapeOptions['variant'])) {
            data.variant = ds.variant as ButtonShapeOptions['variant'];
        }
        if (ds.size && SIZE_MAPPING[ds.size]) {
            data.size = SIZE_MAPPING[ds.size];
        }
        if (ds.leadingShape && isButtonShapeName(ds.leadingShape)) {
            data.leadingShape = ds.leadingShape;
        }
        if (ds.trailingShape && isButtonShapeName(ds.trailingShape)) {
            data.trailingShape = ds.trailingShape;
        }
        if (ds.assetsPath) {
            data.assetsPath = ds.assetsPath;
        }
        if (this.el.hasAttribute('data-ripple')) {
            data.ripple = ds.ripple !== 'false';
        }
        if (this.el.hasAttribute('data-morph')) {
            data.morph = ds.morph !== 'false';
        }
        return data;
    }

    private ensureBaseClass(): void {
        if (!this.el.classList.contains('btn-shape') && !this.el.classList.contains('button-shape')) {
            this.el.classList.add('btn-shape');
        }
    }

    /**
     * Garantit la structure DOM : slots + label
     */
    private ensureDomStructure(): void {
        this.leadingSlot =
            this.el.querySelector('.btn-shape__slot--leading, .button-shape__slot--leading') as HTMLElement | null;
        this.trailingSlot =
            this.el.querySelector('.btn-shape__slot--trailing, .button-shape__slot--trailing') as HTMLElement | null;
        this.labelEl =
            this.el.querySelector('.btn-shape__label, .button-shape__label') as HTMLElement | null;

        if (!this.labelEl) {
            const textNodes: Node[] = [];
            Array.from(this.el.childNodes).forEach(node => {
                if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
                    textNodes.push(node);
                }
            });
            this.labelEl = document.createElement('span');
            this.labelEl.className = 'btn-shape__label';
            if (textNodes.length > 0) {
                textNodes.forEach(n => this.labelEl!.appendChild(n));
            } else {
                const looseIcon = this.el.querySelector(':scope > i.icon, :scope > i[name]');
                if (!this.leadingSlot && !this.trailingSlot && !looseIcon) {
                    this.labelEl.textContent = this.el.textContent?.trim() ?? '';
                    this.el.textContent = '';
                }
            }
            this.el.appendChild(this.labelEl);
        }

        if (this.leadingSlot) {
            this.leadingSlot.classList.add('btn-shape__slot', 'btn-shape__slot--leading');
            setAriaAttribute(this.leadingSlot, 'hidden', true);
            this.leadingSlot.removeAttribute('data-animate');
            this.leadingSlot.removeAttribute('data-hover');
            this.leadingSlot.setAttribute('data-animate', 'false');
            this.leadingSlot.setAttribute('data-hover', 'false');
        }
        if (this.trailingSlot) {
            this.trailingSlot.classList.add('btn-shape__slot', 'btn-shape__slot--trailing');
            setAriaAttribute(this.trailingSlot, 'hidden', true);
            this.trailingSlot.removeAttribute('data-animate');
            this.trailingSlot.removeAttribute('data-hover');
            this.trailingSlot.setAttribute('data-animate', 'false');
            this.trailingSlot.setAttribute('data-hover', 'false');
        }

        this.el.classList.toggle('btn-shape--has-leading', Boolean(this.leadingSlot));
        this.el.classList.toggle('button-shape--has-leading', Boolean(this.leadingSlot));
        this.el.classList.toggle('btn-shape--has-trailing', Boolean(this.trailingSlot));
        this.el.classList.toggle('button-shape--has-trailing', Boolean(this.trailingSlot));
    }

    private detectFromHTML(): {
        size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | null;
        variant: ButtonShapeOptions['variant'] | null;
    } {
        let size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | null = null;
        for (const [cls, norm] of Object.entries(SIZE_MAPPING)) {
            if (
                this.el.classList.contains(`btn-shape--${cls}`) ||
                this.el.classList.contains(`button-shape--${cls}`)
            ) {
                size = norm;
                break;
            }
        }
        let variant: ButtonShapeOptions['variant'] | null = null;
        for (const v of VARIANTS) {
            if (
                this.el.classList.contains(`btn-shape--${v}`) ||
                this.el.classList.contains(`button-shape--${v}`)
            ) {
                variant = v;
                break;
            }
        }
        return { size, variant };
    }

    private removeOldClasses(): void {
        ['xs', 'xsmall', 'sm', 'small', 'md', 'medium', 'lg', 'large', 'xl', 'xlarge'].forEach(c => {
            this.el.classList.remove(`btn-shape--${c}`, `button-shape--${c}`);
        });
        VARIANTS.forEach(v => {
            this.el.classList.remove(`btn-shape--${v}`, `button-shape--${v}`);
        });
    }

    private applyClasses(): void {
        this.ensureBaseClass();
        const detected = this.detectFromHTML();
        this.removeOldClasses();

        const size = detected.size ?? (SIZE_MAPPING[this.options.size] || 'md');
        this.el.classList.add(`btn-shape--${size}`, `button-shape--${size}`);
        this.options.size = size;

        const variant = detected.variant ?? this.options.variant;
        this.el.classList.add(`btn-shape--${variant}`, `button-shape--${variant}`);
        this.options.variant = variant;
    }

    private resolveSlotShape(slot: HTMLElement | null, fallback?: ButtonShapeName): ButtonShapeName {
        const fromSlot = slot?.dataset.shape;
        if (fromSlot && isButtonShapeName(fromSlot)) return fromSlot;
        if (fallback && isButtonShapeName(fallback)) return fallback;
        return DEFAULT_BUTTON_SHAPE;
    }

    private applySlotShapes(): void {
        const assetsPath = this.options.assetsPath ?? '/assets/images/shapes/';

        if (this.leadingSlot) {
            const shape = this.resolveSlotShape(this.leadingSlot, this.options.leadingShape);
            this.options.leadingShape = shape;
            this.leadingSlot.setAttribute('data-shape', shape);
            ButtonShape.applySlotMask(this.leadingSlot, assetsPath, shape);
        }
        if (this.trailingSlot) {
            const shape = this.resolveSlotShape(this.trailingSlot, this.options.trailingShape);
            this.options.trailingShape = shape;
            this.trailingSlot.setAttribute('data-shape', shape);
            ButtonShape.applySlotMask(this.trailingSlot, assetsPath, shape);
        }
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
                if (this.el.hasAttribute('disabled') || this.el.getAttribute('aria-disabled') === 'true') return;
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.el.click();
                }
            },
        });
        this.registerEvent(this.el, 'click', (e: MouseEvent) => {
            if (this.el.hasAttribute('disabled') || this.el.getAttribute('aria-disabled') === 'true') {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            HapticManager.triggerFromOptions(this.options, 'medium');
        });
    }

    /**
     * Morph press/release (M3 Expressive) — pastille → rayon réduit
     * @private
     */
    private attachPressReleaseListeners(): void {
        const el = this.el;
        const bindings = getPointerPressReleaseBindings(el, {
            onPress: () => this.handlePress(),
            onRelease: () => this.handleRelease(),
            onDocumentRelease: () => {
                if (el.classList.contains('pressing')) {
                    ButtonShape.releaseBtn(el);
                }
            },
        });
        bindings.forEach(({ target, type, handler, options }) => {
            this.registerEvent(target, type, handler, options);
        });
    }

    private handlePress(): void {
        if (this.el.hasAttribute('disabled') || this.el.getAttribute('aria-disabled') === 'true') return;
        ButtonShape.pressBtn(this.el);
    }

    private handleRelease(): void {
        ButtonShape.releaseBtn(this.el);
    }

    /** M3 Expressive — spatial-fast (press) */
    private static readonly MOTION_BORDER_RADIUS_SPATIAL_FAST =
        'border-radius var(--md-sys-motion-spatial-fast-duration) var(--md-sys-motion-spatial-fast-easing)';

    /** M3 Expressive — spatial-default (release) */
    private static readonly MOTION_BORDER_RADIUS_SPATIAL_EMPHASIZED =
        'border-radius var(--md-sys-motion-spatial-default-duration) var(--md-sys-motion-spatial-default-easing)';

    /**
     * Applique l'état press (morph pastille)
     * @param el Élément .btn-shape
     */
    static pressBtn(el: HTMLElement): void {
        if (el.classList.contains('btn-shape--no-morph') || el.classList.contains('button-shape--no-morph')) {
            return;
        }
        const htmlEl = el as HTMLElement;
        htmlEl.style.transition = ButtonShape.MOTION_BORDER_RADIUS_SPATIAL_FAST;
        void htmlEl.offsetWidth;
        el.classList.add('pressing');
    }

    /**
     * Retire l'état press (retour pastille)
     * @param el Élément .btn-shape
     */
    static releaseBtn(el: HTMLElement): void {
        if (!el.classList.contains('pressing')) return;
        const htmlEl = el as HTMLElement;
        htmlEl.style.transition = ButtonShape.MOTION_BORDER_RADIUS_SPATIAL_EMPHASIZED;
        void htmlEl.offsetWidth;
        el.classList.remove('pressing');
        htmlEl.addEventListener('transitionend', () => {
            htmlEl.style.removeProperty('transition');
        }, { once: true });
    }

    private setupRipple(): void {
        try {
            this.rippleInstance = new Ripple(this.el);
            this.rippleInstance.attach();
        } catch (err) {
            this.logger.warn('Ripple setup failed', { error: err });
        }
    }

    /**
     * Change la variante (filled | tonal)
     * @param variant - Variante visuelle
     */
    setVariant(variant: ButtonShapeOptions['variant']): void {
        VARIANTS.forEach(v => this.el.classList.remove(`btn-shape--${v}`, `button-shape--${v}`));
        this.options.variant = variant;
        this.el.classList.add(`btn-shape--${variant}`, `button-shape--${variant}`);
    }

    /**
     * Change la taille (xs–xl)
     * @param size - Taille expressive
     */
    setSize(size: ButtonShapeOptions['size']): void {
        const norm = SIZE_MAPPING[size] || 'md';
        Object.keys(SIZE_MAPPING).forEach(c => {
            this.el.classList.remove(`btn-shape--${c}`, `button-shape--${c}`);
        });
        this.options.size = norm;
        this.el.classList.add(`btn-shape--${norm}`, `button-shape--${norm}`);
    }

    /**
     * Définit la forme du slot leading (`sunny` | `octagonal-circle`)
     * @param shape - Nom de shape ButtonShape
     */
    setLeadingShape(shape: ButtonShapeName = DEFAULT_BUTTON_SHAPE): void {
        if (!isButtonShapeName(shape)) {
            this.logger.warn(`Shape ButtonShape invalide: ${shape}`);
            return;
        }
        this.options.leadingShape = shape;
        if (!this.leadingSlot) {
            this.leadingSlot = document.createElement('span');
            this.leadingSlot.className = 'btn-shape__slot btn-shape__slot--leading';
            setAriaAttribute(this.leadingSlot, 'hidden', true);
            this.leadingSlot.setAttribute('data-animate', 'false');
            this.leadingSlot.setAttribute('data-hover', 'false');
            this.el.insertBefore(this.leadingSlot, this.el.firstChild);
            this.el.classList.add('btn-shape--has-leading', 'button-shape--has-leading');
        }
        this.leadingSlot.setAttribute('data-shape', shape);
        const assetsPath = this.options.assetsPath ?? '/assets/images/shapes/';
        ButtonShape.applySlotMask(this.leadingSlot, assetsPath, shape);
    }

    /**
     * Définit la forme du slot trailing (`sunny` | `octagonal-circle`)
     * @param shape - Nom de shape ButtonShape
     */
    setTrailingShape(shape: ButtonShapeName = DEFAULT_BUTTON_SHAPE): void {
        if (!isButtonShapeName(shape)) {
            this.logger.warn(`Shape ButtonShape invalide: ${shape}`);
            return;
        }
        this.options.trailingShape = shape;
        if (!this.trailingSlot) {
            this.trailingSlot = document.createElement('span');
            this.trailingSlot.className = 'btn-shape__slot btn-shape__slot--trailing';
            setAriaAttribute(this.trailingSlot, 'hidden', true);
            this.trailingSlot.setAttribute('data-animate', 'false');
            this.trailingSlot.setAttribute('data-hover', 'false');
            this.el.appendChild(this.trailingSlot);
            this.el.classList.add('btn-shape--has-trailing', 'button-shape--has-trailing');
        }
        this.trailingSlot.setAttribute('data-shape', shape);
        const assetsPath = this.options.assetsPath ?? '/assets/images/shapes/';
        ButtonShape.applySlotMask(this.trailingSlot, assetsPath, shape);
    }

    /**
     * Désactive le bouton
     */
    disable(): void {
        (this.el as HTMLButtonElement).disabled = true;
        setAriaAttributes(this.el, { 'aria-disabled': 'true' });
    }

    /**
     * Active le bouton
     */
    enable(): void {
        (this.el as HTMLButtonElement).disabled = false;
        removeAriaAttribute(this.el, 'aria-disabled');
    }

    /**
     * Détruit l’instance et nettoie les listeners
     */
    override destroy(): void {
        this.options.onCloseStart?.(this.el);
        if (this.rippleInstance) {
            try { this.rippleInstance.detach(); } catch (_) { /* ignore */ }
            this.rippleInstance = null;
        }
        this.keyboardInstance = null;
        if ((this.el as KButtonShapeHTMLElement).K_ButtonShape === this) {
            delete (this.el as KButtonShapeHTMLElement).K_ButtonShape;
        }
        this.logger.info('ButtonShape destroyed');
        this.options.onCloseEnd?.(this.el);
        super.destroy();
    }
}

/**
 * Custom Element <k3ui-button-shape>
 * @description Permet l'utilisation de <k3ui-button-shape> dans le HTML. Initialisation par AutoInit.
 */
if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-button-shape')) {
    customElements.define('k3ui-button-shape', class extends HTMLElement {
        connectedCallback() {
            if (!this.hasAttribute('data-initialized')) this.setAttribute('data-initialized', 'true');
        }
        disconnectedCallback() {}
    });
}
