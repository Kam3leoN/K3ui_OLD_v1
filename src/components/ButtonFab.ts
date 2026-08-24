/**
 * @fileoverview Composant ButtonFab pour K3UI
 * @description FAB et Extended FAB Material Design 3 Expressive — trois modes : fab, extended, morph (FAB ↔ Extended)
 * @see https://m3.material.io/components/floating-action-button
 * @see https://m3.material.io/components/extended-fab/specs
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import type { ButtonFabOptions } from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { setAriaAttributes } from '../utils/dom/aria';
import { LoggerManager, LocaleManager, IconManager } from '../core/managers';
import { ManagerFactory } from '../core/factories';
import { getButtonFabDefaults, ButtonFabSpecs } from '../specs/components/button-fab.specs';
import { createRipple, Ripple } from '../utils/effects/ripple';
import { HapticManager } from '../core/managers/HapticManager';

interface KButtonFabHTMLElement extends HTMLElement {
    K_ButtonFab?: ButtonFab;
}

const _defaults: ButtonFabOptions = getButtonFabDefaults();

type MorphPhase = 'idle' | 'shrinking' | 'extending';

export class ButtonFab extends Component<ButtonFabOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;
    private logger: LoggerManager;
    private buttonEl: HTMLButtonElement | null = null;
    private labelEl: HTMLSpanElement | null = null;
    private rippleInstance: Ripple | null = null;
    /** En mode morph : true = extended, false = FAB */
    private isExtended = true;
    private morphPhase: MorphPhase = 'idle';
    private labelVisible = true;
    private labelOpacity = 1;
    private scrollListener: (() => void) | null = null;
    private scrollTarget: HTMLElement | Window | null = null;
    private lastScrollTop = 0;

    static get defaults(): ButtonFabOptions {
        return { ..._defaults };
    }

    static getInstance(el: HTMLElement): ButtonFab | null {
        return (el as KButtonFabHTMLElement).K_ButtonFab ?? null;
    }

    static init(
        els: KElement | InitElements<KElement> | string,
        options: Partial<ButtonFabOptions> = {}
    ): ButtonFab[] {
        return Component.init(els, options, toComponentClassDef(ButtonFab)) as ButtonFab[];
    }

    constructor(el: HTMLElement, options: Partial<ButtonFabOptions> = {}) {
        super(el, options, toComponentClassDef(ButtonFab));
        this.logger = ManagerFactory.getLoggerManager('[ButtonFab]');
        const fromHtml = ButtonFab.readAttributes(el);
        this.options = {
            ...ButtonFab.defaults,
            ...options,
            ...fromHtml,
        } as ButtonFabOptions;
        if (!this.options.label) {
            this.options.label = LocaleManager.t('buttonFab.labelDefault');
        }
        (el as KButtonFabHTMLElement).K_ButtonFab = this;
        this.init();
    }

    private static readAttributes(el: HTMLElement): Partial<ButtonFabOptions> {
        const out: Partial<ButtonFabOptions> = {};
        const get = (key: string) => el.getAttribute('data-' + key);
        const mode = get('mode');
        if (mode === 'fab' || mode === 'extended' || mode === 'morph') out.mode = mode;
        const trigger = get('expand-trigger');
        if (trigger === 'scroll' || trigger === 'hover' || trigger === 'click') out.expandTrigger = trigger;
        const size = get('size');
        if (size === 'small' || size === 'medium' || size === 'large') out.size = size;
        const shape = get('shape');
        if (shape === 'rounded' || shape === 'square') out.shape = shape;
        const variant = get('variant');
        const variants: ButtonFabOptions['variant'][] = [
            'primary', 'secondary', 'tertiary',
            'primary-container', 'secondary-container', 'tertiary-container',
            'surface',
        ];
        if (variant != null && variants.includes(variant as ButtonFabOptions['variant'])) {
            out.variant = variant as ButtonFabOptions['variant'];
        }
        const icon = get('icon');
        if (icon != null) out.icon = icon;
        const label = get('label');
        if (label != null) out.label = label;
        if (el.getAttribute('data-lowered') !== null) out.lowered = true;
        if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') out.disabled = true;
        if (el.hasAttribute('data-fixed') || el.classList.contains('button-fab--fixed')) out.fixed = true;
        const position = get('position');
        if (
            position === 'bottom-right' ||
            position === 'bottom-left' ||
            position === 'top-right' ||
            position === 'top-left'
        ) {
            out.position = position;
        }
        return out;
    }

    private init(): void {
        this.el.classList.add('button-fab');
        this.el.setAttribute('data-size', this.options.size);
        this.el.setAttribute('data-shape', this.options.shape);
        this.el.setAttribute('data-variant', this.options.variant);
        this.el.setAttribute('data-mode', this.options.mode);
        if (this.options.lowered) {
            this.el.setAttribute('data-lowered', '');
        }
        if (this.options.fixed) {
            this.el.classList.add('button-fab--fixed');
            this.el.setAttribute('data-fixed', '');
            this.el.setAttribute('data-position', this.options.position);
        }
        if (this.options.mode === 'morph') {
            this.el.setAttribute('data-expand-trigger', this.options.expandTrigger);
            this.isExtended = this.options.expandTrigger === 'scroll';
            this.labelVisible = this.isExtended;
            this.labelOpacity = this.isExtended ? 1 : 0;
            this.el.classList.add(this.isExtended ? 'button-fab--extended' : 'button-fab--collapsed');
        }
        this.buildDom();
        this.setupAccessibility();
        this.attachEvents();
        if (this.options.mode === 'morph' && this.options.expandTrigger === 'scroll') {
            this.attachScrollListener();
        }
        if (this.buttonEl) {
            IconManager.processIconsInContainer(this.el);
        }
        this.logger.info('ButtonFab initialized');
    }

    private buildDom(): void {
        this.el.innerHTML = '';
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'button-fab__btn ripple';
        if (this.options.disabled) btn.disabled = true;

        const iconWrap = document.createElement('span');
        iconWrap.className = 'button-fab__icon';
        const i = document.createElement('i');
        i.className = 'k3ui-icon';
        i.setAttribute('name', this.options.icon);
        i.setAttribute('aria-hidden', 'true');
        iconWrap.appendChild(i);

        btn.appendChild(iconWrap);

        if (this.options.mode !== 'fab') {
            const labelSpan = document.createElement('span');
            labelSpan.className = 'button-fab__label';
            labelSpan.textContent = this.options.label;
            if (this.options.mode === 'morph') {
                labelSpan.style.opacity = String(this.labelOpacity);
                if (!this.labelVisible) labelSpan.hidden = true;
            }
            btn.appendChild(labelSpan);
            this.labelEl = labelSpan;
        }

        this.el.appendChild(btn);
        this.buttonEl = btn;

        if (this.options.ripple && !this.options.disabled) {
            try {
                this.rippleInstance = createRipple(btn);
            } catch (_) {}
        }
    }

    private setupAccessibility(): void {
        const ariaLabel = this.options.label || LocaleManager.t('buttonFab.ariaLabel');
        if (this.buttonEl) {
            setAriaAttributes(this.buttonEl, { 'aria-label': ariaLabel });
        }
    }

    private attachEvents(): void {
        if (!this.buttonEl) return;
        this.registerEvent(this.buttonEl, 'click', (e: Event) => {
            if (this.options.disabled) {
                e.preventDefault();
                return;
            }
            if (this.options.mode === 'morph' && this.options.expandTrigger === 'click') {
                this.toggleMorph();
            }
            HapticManager.triggerFromOptions(this.options, 'medium');
            this.options.onClick?.(e, this);
        });
        if (this.options.mode === 'morph' && this.options.expandTrigger === 'hover') {
            this.registerEvent(this.el, 'mouseenter', () => this.triggerExtend());
            this.registerEvent(this.el, 'mouseleave', () => this.triggerShrink());
        }
        // Transition square → rounded au :active (comme button-fab-menu)
        if (this.options.shape === 'square') {
            this.registerEvent(this.buttonEl, 'pointerdown', () => this.el.classList.add('button-fab--rounded-state'));
            this.registerEvent(this.buttonEl, 'pointerup', () => this.el.classList.remove('button-fab--rounded-state'));
            this.registerEvent(this.buttonEl, 'pointerleave', () => this.el.classList.remove('button-fab--rounded-state'));
        }
    }

    private attachScrollListener(): void {
        let target: HTMLElement | Window = window;
        if (this.options.scrollContainer) {
            if (typeof this.options.scrollContainer === 'string') {
                const el = document.querySelector(this.options.scrollContainer);
                if (el && (el as Element).nodeType === Node.ELEMENT_NODE) {
                    target = el;
                }
            } else {
                target = this.options.scrollContainer;
            }
        }
        this.scrollTarget = target;
        const onScroll = (): void => {
            const st = target === window
                ? (window.scrollY ?? document.documentElement.scrollTop)
                : (target as HTMLElement).scrollTop;
            const delta = st - this.lastScrollTop;
            this.lastScrollTop = st;
            if (delta > 4) this.triggerShrink();
            if (delta < -4) this.triggerExtend();
        };
        this.scrollListener = onScroll;
        target.addEventListener('scroll', onScroll, { passive: true });
    }

    private triggerShrink(): void {
        if (this.options.mode !== 'morph' || !this.isExtended || this.morphPhase !== 'idle') return;
        this.options.onShrinkStart?.(this);
        this.morphPhase = 'shrinking';
        this.labelOpacity = 0;
        const exitMs = ButtonFabSpecs.behaviors.labelExitMs;
        setTimeout(() => {
            this.labelVisible = false;
            if (this.labelEl) this.labelEl.hidden = true;
        }, exitMs);
        setTimeout(() => {
            this.isExtended = false;
            this.el.classList.remove('button-fab--extended');
            this.el.classList.add('button-fab--collapsed');
            const dur = ButtonFabSpecs.behaviors.shrinkDurationMs;
            setTimeout(() => {
                this.morphPhase = 'idle';
                this.options.onShrinkEnd?.(this);
            }, dur);
        }, 50);
    }

    private triggerExtend(): void {
        if (this.options.mode !== 'morph' || this.isExtended || this.morphPhase !== 'idle') return;
        this.options.onExpandStart?.(this);
        this.morphPhase = 'extending';
        this.labelVisible = false;
        this.labelOpacity = 0;
        this.isExtended = true;
        this.el.classList.remove('button-fab--collapsed');
        this.el.classList.add('button-fab--extended');
        const delayMs = ButtonFabSpecs.behaviors.labelEnterDelayMs;
        setTimeout(() => {
            this.labelVisible = true;
            if (this.labelEl) {
                this.labelEl.hidden = false;
                this.labelEl.style.opacity = '1';
            }
            this.labelOpacity = 1;
        }, delayMs);
        const totalMs = ButtonFabSpecs.behaviors.extendDurationMs;
        setTimeout(() => {
            this.morphPhase = 'idle';
            this.options.onExpandEnd?.(this);
        }, totalMs);
    }

    private toggleMorph(): void {
        if (this.isExtended) this.triggerShrink();
        else this.triggerExtend();
    }

    /** Retourne true si le bouton est en état extended (mode morph ou extended). */
    isExtendedState(): boolean {
        if (this.options.mode === 'fab') return false;
        if (this.options.mode === 'extended') return true;
        return this.isExtended;
    }

    /** En mode morph, force l'état extended. */
    setExtended(extended: boolean): void {
        if (this.options.mode !== 'morph') return;
        if (extended && !this.isExtended) this.triggerExtend();
        else if (!extended && this.isExtended) this.triggerShrink();
    }

    /** Met à jour le label affiché (extended / morph). */
    setLabel(label: string): void {
        this.options.label = label;
        if (this.labelEl) this.labelEl.textContent = label;
    }

    /** Met à jour l'icône. */
    setIcon(icon: string): void {
        this.options.icon = icon;
        const i = this.el.querySelector('.button-fab__icon i.k3ui-icon');
        if (i) i.setAttribute('name', icon);
        IconManager.processIconsInContainer(this.el);
    }

    override destroy(): void {
        if (this.scrollListener && this.scrollTarget) {
            this.scrollTarget.removeEventListener('scroll', this.scrollListener);
        }
        this.scrollListener = null;
        this.scrollTarget = null;
        try {
            this.rippleInstance?.destroy();
        } catch (_) {}
        this.rippleInstance = null;
        this.buttonEl = null;
        this.labelEl = null;
        if ((this.el as KButtonFabHTMLElement).K_ButtonFab === this) {
            delete (this.el as KButtonFabHTMLElement).K_ButtonFab;
        }
        this.logger.info('ButtonFab destroyed');
    }
}

if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-button-fab')) {
    customElements.define('k3ui-button-fab', class K3UIButtonFabElement extends HTMLElement {
        connectedCallback(): void {
            if (!this.hasAttribute('data-initialized')) {
                this.setAttribute('data-initialized', 'true');
            }
        }
        disconnectedCallback(): void {}
    });
}
