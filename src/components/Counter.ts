/**
 * @fileoverview Composant Counter (compteur) pour K3UI
 * @description Contrôle +/- avec valeur affichée, validation, readonly, disabled, décimales et callbacks
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import {
    CounterOptions,
    CounterValidateConfig,
    CounterValidateFn,
} from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { setAriaAttributes } from '../utils/dom/aria';
import { getCounterDefaults, CounterSpecs } from '../specs/components/counter.specs';
import { createRipple, Ripple } from '../utils/effects/ripple';
import { bindPointerDown, startPointerDragSession, type PointerLikeEvent } from '../utils/dom/pointer';

const _defaults: CounterOptions = getCounterDefaults();

/**
 * Classe Counter pour K3UI
 */
export class Counter extends Component<CounterOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    private wrapperElement: HTMLDivElement | null = null;
    private decrementBtn: HTMLButtonElement | null = null;
    private incrementBtn: HTMLButtonElement | null = null;
    private valueInput: HTMLInputElement | null = null;
    /** Cercle valeur (mode counter, draggable) */
    private numberElement: HTMLDivElement | null = null;
    private errorElement: HTMLDivElement | null = null;
    private loadingOverlay: HTMLDivElement | null = null;
    private dragStartX: number = 0;
    /** Offset de drag en px (transform: translateX) quand la valeur est dans le flux flex */
    private dragOffset: number = 0;
    private _unbindCounterDrag: (() => void) | null = null;
    private currentValue: number = 0;
    private validationError: string | null = null;
    private isAsyncPending: boolean = false;
    private rippleDec: Ripple | null = null;
    private rippleInc: Ripple | null = null;

    static get defaults(): CounterOptions {
        return { ..._defaults };
    }

    static getInstance(el: HTMLElement): Counter | undefined {
        return Component.getInstance(el) as Counter | undefined;
    }

    static init(els: HTMLElement, options?: Partial<CounterOptions>): Counter;
    static init(els: InitElements<KElement>, options?: Partial<CounterOptions>): Counter[];
    static init(
        els: HTMLElement | InitElements<KElement>,
        options: Partial<CounterOptions> = {}
    ): Counter | Counter[] {
        return Component.init(els, options, toComponentClassDef(Counter)) as Counter | Counter[];
    }

    constructor(el: HTMLElement, options: Partial<CounterOptions> = {}) {
        super(el, options, toComponentClassDef(Counter));
        this.currentValue = this.options.value ?? 0;
        this.init();
    }

    private init(): void {
        if (this.el.tagName.toLowerCase() === 'k3ui-counter') {
            this.el.classList.add('counter');
        }
        this.readAttributes();
        this.buildDOM();
        this.attachEvents();
        this.attachRipples();
        this.runValidation();
        this.updateUI();
    }

    private readAttributes(): void {
        const val = this.el.getAttribute('data-value');
        if (val !== null) {
            const n = Number(val);
            if (!Number.isNaN(n)) this.currentValue = n;
        }
        const allowNeg = this.el.getAttribute('data-allow-negative');
        if (allowNeg !== null) this.options.allowNegative = allowNeg === 'true' || allowNeg === '';
        const min = this.el.getAttribute('data-min');
        if (min !== null) {
            const n = Number(min);
            if (!Number.isNaN(n)) this.options.min = n;
        }
        const max = this.el.getAttribute('data-max');
        if (max !== null) {
            const n = Number(max);
            if (!Number.isNaN(n)) this.options.max = n;
        }
        const step = this.el.getAttribute('data-step');
        if (step !== null) {
            const n = Number(step);
            if (!Number.isNaN(n) && n > 0) this.options.step = n;
        }
        const decimals = this.el.getAttribute('data-decimals');
        if (decimals !== null) {
            const n = parseInt(decimals, 10);
            if (!Number.isNaN(n) && n >= 0) this.options.decimals = n;
        }
        const readonly = this.el.getAttribute('data-readonly');
        if (readonly !== null) this.options.readonly = readonly === 'true' || readonly === '';
        const disabled = this.el.getAttribute('data-disabled');
        if (disabled !== null) this.options.disabled = disabled === 'true' || disabled === '';
        const size = this.el.getAttribute('data-size');
        if (size === 'xs' || size === 'sm' || size === 'md' || size === 'lg' || size === 'xl') this.options.size = size;
    }

    private buildDOM(): void {
        this.el.innerHTML = '';
        const size = this.options.size ?? 'md';
        const wrapper = document.createElement('div');
        wrapper.className = `counter__wrapper counter__wrapper--counter counter__wrapper--counter--${size}`;
        this.wrapperElement = wrapper;

        const decBtn = document.createElement('button');
        decBtn.type = 'button';
        decBtn.className = 'btn btn--icon btn--filled btn--primary btn--rounded ripple counter__btn counter__btn--decrement';
        decBtn.textContent = '−';
        const ariaDec = this.options.ariaLabelDecrement ?? CounterSpecs.accessibility.ariaLabelDecrement;
        setAriaAttributes(decBtn, { label: ariaDec });
        this.decrementBtn = decBtn;

        const numberEl = document.createElement('div');
        numberEl.className = 'counter__number';
        numberEl.setAttribute('role', 'spinbutton');
        const ariaVal = this.options.ariaLabelValue ?? CounterSpecs.accessibility.ariaLabelValue;
        numberEl.setAttribute('aria-label', ariaVal);
        this.numberElement = numberEl;
        wrapper.appendChild(decBtn);
        wrapper.appendChild(numberEl);

        const incBtn = document.createElement('button');
        incBtn.type = 'button';
        incBtn.className = 'btn btn--icon btn--filled btn--primary btn--rounded ripple counter__btn counter__btn--increment';
        incBtn.textContent = '+';
        const ariaInc = this.options.ariaLabelIncrement ?? CounterSpecs.accessibility.ariaLabelIncrement;
        setAriaAttributes(incBtn, { label: ariaInc });
        this.incrementBtn = incBtn;
        wrapper.appendChild(incBtn);

        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'counter__loading';
        loadingOverlay.setAttribute('aria-hidden', 'true');
        loadingOverlay.hidden = true;
        this.loadingOverlay = loadingOverlay;
        wrapper.appendChild(loadingOverlay);

        this.el.appendChild(wrapper);

        const errorEl = document.createElement('div');
        errorEl.className = 'counter__error';
        errorEl.setAttribute('role', 'alert');
        errorEl.setAttribute('aria-live', 'polite');
        this.errorElement = errorEl;
        this.el.appendChild(errorEl);
    }

    private attachRipples(): void {
        try {
            if (this.decrementBtn) {
                this.rippleDec = createRipple(this.decrementBtn);
            }
            if (this.incrementBtn) {
                this.rippleInc = createRipple(this.incrementBtn);
            }
        } catch {
            // ignore if ripple fails
        }
    }

    private attachEvents(): void {
        if (this.decrementBtn) {
            this.registerEvent(this.decrementBtn, 'click', this.handleDecrement.bind(this));
        }
        if (this.incrementBtn) {
            this.registerEvent(this.incrementBtn, 'click', this.handleIncrement.bind(this));
        }
        if (this.numberElement && this.wrapperElement) {
            this.setupCounterDrag();
        }
    }

    /** Mode counter : drag et swipe sur le cercle nombre (valeur en flux flex, container s’élargit) */
    private setupCounterDrag(): void {
        const num = this.numberElement!;
        const wrapper = this.wrapperElement!;

        const dragMove = (e: MouseEvent): void => {
            const wr = wrapper.getBoundingClientRect();
            const numW = num.offsetWidth;
            const maxOffset = (wr.width - numW) / 2;
            this.dragOffset = Math.min(maxOffset, Math.max(-maxOffset, this.dragOffset + e.movementX));
            num.style.transition = 'none';
            num.style.transform = `translateX(${this.dragOffset}px)`;
        };

        const centerNumber = (): void => {
            this.dragOffset = 0;
            num.style.transition = 'transform 0.3s ease';
            num.style.transform = '';
        };

        const mathOnDrag = (): void => {
            const wr = wrapper.getBoundingClientRect();
            const numRect = num.getBoundingClientRect();
            const threshold = num.offsetWidth * 0.5;
            const numCenter = numRect.left - wr.left + numRect.width / 2;
            const wrapperCenter = wr.width / 2;
            if (numCenter <= wrapperCenter - threshold) this.handleDecrement();
            else if (numCenter >= wrapperCenter + threshold) this.handleIncrement();
        };

        const dragEnd = (): void => {
            centerNumber();
            mathOnDrag();
        };

        const onDragStart = (e: PointerLikeEvent): void => {
            if (this.options.disabled || this.options.readonly || this.isAsyncPending) return;
            if (e instanceof PointerEvent && e.pointerType === 'mouse' && e.button !== 0) return;
            if (e instanceof Event) {
                e.preventDefault();
            }
            const pointerId = e instanceof PointerEvent ? e.pointerId : 0;
            startPointerDragSession({
                captureElement: num,
                pointerId,
                onMove: (ev) => dragMove(ev as MouseEvent),
                onEnd: dragEnd,
            });
        };

        this._unbindCounterDrag = bindPointerDown(num, onDragStart);
    }

    /**
     * Exécute la validation et met à jour validationError / UI
     * @returns message d'erreur ou null si valide
     */
    private runValidation(): string | null {
        const validate = this.options.validate;
        if (!validate) {
            if (this.validationError) {
                this.validationError = null;
                this.options.onValidationErrorEnd?.(this);
            }
            return null;
        }
        let result: boolean | string = true;
        if (typeof validate === 'function') {
            result = validate(this.currentValue);
        } else {
            const config = validate as CounterValidateConfig;
            if (config.min !== undefined && this.currentValue < config.min) {
                result = `Please set a value greater than or equal to ${config.min}`;
            } else if (config.max !== undefined && this.currentValue > config.max) {
                result = `Please set a value less than or equal to ${config.max}`;
            } else if (config.validator) {
                result = config.validator(this.currentValue);
            }
        }
        const message = result === true ? null : (result as string);
        const hadError = this.validationError !== null;
        this.validationError = message;
        if (message) {
            this.options.onValidateError?.(message, this.currentValue, this);
        } else if (hadError) {
            this.options.onValidationErrorEnd?.(this);
        }
        return message;
    }

    private handleDecrement(): void {
        if (this.options.disabled || this.options.readonly || this.isAsyncPending) return;
        const step = this.options.step ?? 1;
        const newVal = this.roundValue(this.currentValue - step);
        if (!this.options.allowNegative && newVal < 0) return;
        if (this.options.min !== undefined && newVal < this.options.min) return;
        this.applyValue(newVal, 'decrement');
    }

    private handleIncrement(): void {
        if (this.options.disabled || this.options.readonly || this.isAsyncPending) return;
        const step = this.options.step ?? 1;
        const newVal = this.roundValue(this.currentValue + step);
        if (this.options.max !== undefined && newVal > this.options.max) return;
        this.applyValue(newVal, 'increment');
    }

    private roundValue(v: number): number {
        const decimals = this.options.decimals ?? 0;
        if (decimals <= 0) return Math.round(v);
        const factor = Math.pow(10, decimals);
        return Math.round(v * factor) / factor;
    }

    private formatDisplayValue(v: number): string {
        const decimals = this.options.decimals ?? 0;
        if (decimals <= 0) return String(Math.round(v));
        return v.toFixed(decimals);
    }

    private async applyValue(newVal: number, direction: 'increment' | 'decrement'): Promise<void> {
        if (this.options.asyncChange && this.options.onChange) {
            this.isAsyncPending = true;
            this.updateUI();
            await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
            try {
                const result = this.options.onChange(newVal, this);
                const resolved = result instanceof Promise ? await result : result;
                const valueToApply = typeof resolved === 'number' ? resolved : newVal;
                this.currentValue = this.roundValue(valueToApply);
            } catch {
                // keep current value on error
            } finally {
                this.isAsyncPending = false;
                this.runValidation();
                this.updateUI();
            }
        } else {
            this.currentValue = newVal;
            this.runValidation();
            this.updateUI();
            this.options.onChange?.(this.currentValue, this);
        }
        if (direction === 'increment') {
            this.options.onIncrement?.(this.currentValue, this);
        } else {
            this.options.onDecrement?.(this.currentValue, this);
        }
    }

    /**
     * Définit la valeur et met à jour l'UI / appelle onChange
     * @param value Nouvelle valeur
     */
    setValue(value: number): void {
        const v = this.roundValue(value);
        this.currentValue = v;
        this.runValidation();
        this.updateUI();
        this.options.onChange?.(v, this);
    }

    /**
     * Retourne la valeur actuelle
     */
    getValue(): number {
        return this.currentValue;
    }

    /**
     * Retourne le message d'erreur de validation actuel (ou null)
     */
    getValidationError(): string | null {
        return this.validationError;
    }

    /**
     * Définit l'option disabled et met à jour l'UI
     */
    setDisabled(disabled: boolean): void {
        this.options.disabled = disabled;
        this.updateUI();
    }

    /**
     * Définit l'option readonly et met à jour l'UI
     */
    setReadonly(readonly: boolean): void {
        this.options.readonly = readonly;
        this.updateUI();
    }

    private updateUI(): void {
        const min = this.options.min;
        const max = this.options.max;
        const allowNegative = this.options.allowNegative ?? false;
        const disabled = this.options.disabled ?? false;
        const readonly = this.options.readonly ?? false;
        const noEdit = disabled || readonly || this.isAsyncPending;

        const decDisabled =
            noEdit ||
            (!allowNegative && this.currentValue <= 0) ||
            (min !== undefined && this.currentValue <= min);
        const incDisabled = noEdit || (max !== undefined && this.currentValue >= max);

        if (this.valueInput) {
            this.valueInput.value = this.formatDisplayValue(this.currentValue);
        }
        if (this.numberElement) {
            this.numberElement.textContent = this.formatDisplayValue(this.currentValue);
            setAriaAttributes(this.numberElement, { valueNow: this.currentValue });
            this.dragOffset = 0;
            this.numberElement.style.transform = '';
        }
        if (this.decrementBtn) {
            if (this.decrementBtn instanceof HTMLButtonElement) {
                this.decrementBtn.disabled = decDisabled;
                setAriaAttributes(this.decrementBtn, { disabled: decDisabled });
            }
        }
        if (this.incrementBtn) {
            if (this.incrementBtn instanceof HTMLButtonElement) {
                this.incrementBtn.disabled = incDisabled;
                setAriaAttributes(this.incrementBtn, { disabled: incDisabled });
            }
        }

        this.el.classList.toggle('counter--disabled', disabled);
        this.el.classList.toggle('counter--readonly', readonly);
        this.el.classList.toggle('counter--loading', this.isAsyncPending);
        this.el.classList.toggle('counter--error', this.validationError !== null);

        if (this.loadingOverlay) {
            this.loadingOverlay.hidden = !this.isAsyncPending;
        }

        if (this.errorElement) {
            if (this.validationError) {
                this.errorElement.textContent = this.validationError;
                this.errorElement.hidden = false;
            } else {
                this.errorElement.textContent = '';
                this.errorElement.hidden = true;
            }
        }
        setAriaAttributes(this.el, {
            invalid: this.validationError !== null,
            disabled: disabled,
            busy: this.isAsyncPending,
        });
    }

    override destroy(): void {
        this._unbindCounterDrag?.();
        this._unbindCounterDrag = null;
        this.rippleDec?.destroy();
        this.rippleInc?.destroy();
        this.rippleDec = null;
        this.rippleInc = null;
        this.wrapperElement = null;
        this.decrementBtn = null;
        this.incrementBtn = null;
        this.valueInput = null;
        this.numberElement = null;
        this.errorElement = null;
        this.loadingOverlay = null;
        super.destroy();
    }
}

/**
 * Custom Element <k3ui-counter>
 * @description Permet l'utilisation de <k3ui-counter> dans le HTML. Initialisation par AutoInit.
 */
if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-counter')) {
    customElements.define('k3ui-counter', class extends HTMLElement {
        connectedCallback(): void {
            if (!this.hasAttribute('data-initialized')) {
                this.setAttribute('data-initialized', 'true');
            }
        }
        disconnectedCallback(): void {
            const instance = Counter.getInstance(this);
            if (instance && typeof instance.destroy === 'function') {
                instance.destroy();
            }
        }
    });
}
