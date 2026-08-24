/**
 * @fileoverview Composant ShuffleNumber pour K3UI
 * @description Animation de roulement pour nombres et textes courts (inspiré NumberFlow)
 * @see https://number-flow.barvian.me/
 * @see https://github.com/barvian/number-flow
 */

import { Component } from '../core/base/Component';
import { toComponentClassDef } from '../types/components/component-base';
import type {
    ShuffleNumberFlashOptions,
    ShuffleNumberOptions,
    ShuffleNumberRollOptions,
    ShuffleNumberTrend,
} from '../types/components';
import { InitElements, KElement, PriorityLevel } from '../types/base';
import { setAriaAttributes } from '../utils/dom/aria';
import { getPreferReducedMotion } from '../utils/accessibility';
import {
    animateShuffleNumber,
    buildShuffleNumber,
    chromatic,
    clearShuffleNumber,
    SHUFFLE_NUMBER_CSS,
    type ShuffleNumberAnimationOptions,
    type ShuffleNumberDirection,
} from '../utils/effects/shuffleNumber';
import { getShuffleNumberDefaults } from '../specs/components/shuffle-number.specs';

const _defaults: ShuffleNumberOptions = getShuffleNumberDefaults();

/**
 * Composant ShuffleNumber — roulement animé pour compteurs, prix et labels courts.
 */
export class ShuffleNumber extends Component<ShuffleNumberOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    private currentText = '';
    private currentValue: number | null = null;
    private revertTimeout: ReturnType<typeof setTimeout> | undefined;
    private restingText: string | undefined;
    private reducedMotion = false;
    private prefixEl: HTMLSpanElement | null = null;
    private suffixEl: HTMLSpanElement | null = null;
    private valueEl: HTMLSpanElement | null = null;

    static get defaults(): ShuffleNumberOptions {
        return { ..._defaults };
    }

    static getInstance(el: HTMLElement): ShuffleNumber | undefined {
        return Component.getInstance(el) as ShuffleNumber | undefined;
    }

    static init(els: HTMLElement, options?: Partial<ShuffleNumberOptions>): ShuffleNumber;
    static init(
        els: InitElements<KElement>,
        options?: Partial<ShuffleNumberOptions>
    ): ShuffleNumber[];
    static init(
        els: HTMLElement | InitElements<KElement>,
        options: Partial<ShuffleNumberOptions> = {}
    ): ShuffleNumber | ShuffleNumber[] {
        return Component.init(els, options, toComponentClassDef(ShuffleNumber)) as
            | ShuffleNumber
            | ShuffleNumber[];
    }

    /** Helper arc-en-ciel pour les options `color`. */
    static chromatic = chromatic;

    constructor(el: HTMLElement, options: Partial<ShuffleNumberOptions> = {}) {
        super(el, options, toComponentClassDef(ShuffleNumber));
        this.init();
    }

    private init(): void {
        const tag = this.el.tagName.toLowerCase();
        if (tag === 'k3ui-shuffle-number' || tag === 'k3ui-slot') {
            this.el.classList.add(SHUFFLE_NUMBER_CSS.root);
        } else if (!this.el.classList.contains(SHUFFLE_NUMBER_CSS.root)) {
            this.el.classList.add(SHUFFLE_NUMBER_CSS.root);
        }
        this.el.classList.remove('slot');

        this.readAttributes();
        this.reducedMotion =
            this.options.respectMotionPreference && getPreferReducedMotion();

        if (this.options.willChange) {
            this.el.classList.add(SHUFFLE_NUMBER_CSS.willChange);
        }

        this.ensureParts();

        const initial = this.resolveInitialDisplay();
        this.currentText = initial;
        this.options.text = initial;

        if (this.reducedMotion || !this.options.animated) {
            this.valueEl!.textContent = initial;
        } else {
            buildShuffleNumber(this.valueEl!, initial);
        }

        setAriaAttributes(this.el, {
            live: 'polite',
            atomic: 'true',
        });
    }

    private ensureParts(): void {
        if (!this.options.prefix && !this.options.suffix) {
            this.valueEl = this.el;
            return;
        }

        let value = this.el.querySelector<HTMLElement>('[data-shuffle-value], .shuffle-number__value');
        if (!value) {
            value = document.createElement('span');
            value.dataset.shuffleValue = '';
            value.className = 'shuffle-number__value';
            while (this.el.firstChild) {
                value.appendChild(this.el.firstChild);
            }
            this.el.appendChild(value);
        }
        this.valueEl = value;

        if (this.options.prefix && !this.prefixEl) {
            this.prefixEl = document.createElement('span');
            this.prefixEl.className = SHUFFLE_NUMBER_CSS.prefix;
            this.prefixEl.textContent = this.options.prefix;
            this.el.insertBefore(this.prefixEl, this.valueEl);
        }
        if (this.options.suffix && !this.suffixEl) {
            this.suffixEl = document.createElement('span');
            this.suffixEl.className = SHUFFLE_NUMBER_CSS.suffix;
            this.suffixEl.textContent = this.options.suffix;
            this.el.appendChild(this.suffixEl);
        }
    }

    private resolveInitialDisplay(): string {
        if (this.options.value != null && Number.isFinite(this.options.value)) {
            this.currentValue = this.options.value;
            return this.formatValue(this.options.value);
        }

        const dataValue = this.el.getAttribute('data-value');
        if (dataValue !== null && dataValue !== '') {
            const n = Number(dataValue);
            if (Number.isFinite(n)) {
                this.currentValue = n;
                this.options.value = n;
                return this.formatValue(n);
            }
        }

        return (
            this.options.text ||
            this.el.getAttribute('data-text') ||
            this.valueEl?.textContent?.trim() ||
            this.el.textContent?.trim() ||
            ''
        );
    }

    private readAttributes(): void {
        const text = this.el.getAttribute('data-text');
        if (text !== null) this.options.text = text;

        const value = this.el.getAttribute('data-value');
        if (value !== null && value !== '') {
            const n = Number(value);
            if (Number.isFinite(n)) this.options.value = n;
        }

        const prefix = this.el.getAttribute('data-prefix');
        if (prefix !== null) this.options.prefix = prefix;

        const suffix = this.el.getAttribute('data-suffix');
        if (suffix !== null) this.options.suffix = suffix;

        const locales = this.el.getAttribute('data-locales');
        if (locales !== null) this.options.locales = locales;

        const direction = this.el.getAttribute('data-direction');
        if (direction === 'up' || direction === 'down') this.options.direction = direction;

        const trend = this.el.getAttribute('data-trend');
        if (trend === 'up' || trend === 'down' || trend === 'auto' || trend === 'none') {
            this.options.trend = trend;
        } else if (trend === '1' || trend === '+1') {
            this.options.trend = 1;
        } else if (trend === '-1') {
            this.options.trend = -1;
        } else if (trend === '0') {
            this.options.trend = 0;
        }

        const stagger = this.el.getAttribute('data-stagger');
        if (stagger !== null) {
            const n = Number(stagger);
            if (Number.isFinite(n)) this.options.stagger = n;
        }

        const duration = this.el.getAttribute('data-duration');
        if (duration !== null) {
            const n = Number(duration);
            if (Number.isFinite(n)) this.options.duration = n;
        }

        const revertAfter = this.el.getAttribute('data-revert-after');
        if (revertAfter !== null) {
            const n = Number(revertAfter);
            if (Number.isFinite(n)) this.options.revertAfter = n;
        }

        if (this.el.hasAttribute('data-chromatic')) {
            this.options.useChromatic = true;
        }
        if (this.el.hasAttribute('data-continuous')) {
            this.options.continuous = true;
        }
        if (this.el.hasAttribute('data-will-change')) {
            this.options.willChange = true;
        }
        if (this.el.getAttribute('data-animated') === 'false') {
            this.options.animated = false;
        }
        if (this.el.getAttribute('data-respect-motion') === 'false') {
            this.options.respectMotionPreference = false;
        }
    }

    private formatValue(value: number): string {
        try {
            const formatted = new Intl.NumberFormat(
                this.options.locales,
                this.options.format
            ).format(value);
            return formatted;
        } catch {
            return String(value);
        }
    }

    private resolveDirection(
        oldValue: number | null,
        newValue: number,
        overrides?: ShuffleNumberRollOptions
    ): ShuffleNumberDirection {
        if (overrides?.direction) return overrides.direction;

        const trend = this.options.trend;
        const resolved = this.resolveTrend(trend, oldValue, newValue);
        if (resolved > 0) return 'up';
        if (resolved < 0) return 'down';
        // trend 0 : direction par chiffre gérée via direction option (défaut down)
        return this.options.direction;
    }

    private resolveTrend(
        trend: ShuffleNumberTrend,
        oldValue: number | null,
        newValue: number
    ): number {
        if (typeof trend === 'function') {
            return trend(oldValue ?? newValue, newValue);
        }
        if (trend === 'up' || trend === 1) return 1;
        if (trend === 'down' || trend === -1) return -1;
        if (trend === 'none' || trend === 0) return 0;
        // auto
        if (oldValue == null) return Math.sign(newValue) || 1;
        return Math.sign(newValue - oldValue);
    }

    private baseRollOptions(
        direction?: ShuffleNumberDirection
    ): ShuffleNumberAnimationOptions {
        const opts: ShuffleNumberAnimationOptions = {
            direction: direction ?? this.options.direction,
            stagger: this.options.stagger,
            duration: this.options.duration,
            exitOffset: this.options.exitOffset,
            easing: this.options.easing,
            bounce: this.options.bounce,
            colorFade: this.options.colorFade,
            skipUnchanged: this.options.skipUnchanged,
            interrupt: this.options.interrupt,
            continuous: this.options.continuous,
            onStart: () => this.options.onAnimationsStart?.(this),
            onFinish: () => this.options.onAnimationsFinish?.(this),
        };
        if (this.options.useChromatic) {
            opts.color = chromatic();
        }
        return opts;
    }

    private mergeRollOptions(
        overrides: ShuffleNumberRollOptions = {},
        direction?: ShuffleNumberDirection
    ): ShuffleNumberAnimationOptions {
        return { ...this.baseRollOptions(direction), ...overrides };
    }

    private shouldAnimate(): boolean {
        if (!this.options.animated) return false;
        if (this.options.respectMotionPreference && this.reducedMotion) return false;
        return true;
    }

    private applyDisplay(text: string, rollOptions: ShuffleNumberRollOptions = {}): void {
        const target = this.valueEl ?? this.el;
        if (!this.shouldAnimate()) {
            if (target.classList.contains(SHUFFLE_NUMBER_CSS.root) && target !== this.el) {
                clearShuffleNumber(target, text);
                target.textContent = text;
            } else if (target === this.el) {
                target.textContent = text;
            } else {
                target.textContent = text;
            }
            return;
        }
        animateShuffleNumber(target, text, this.mergeRollOptions(rollOptions));
    }

    /**
     * Retourne le texte actuellement affiché (valeur logique formatée).
     */
    getValue(): string {
        return this.currentText;
    }

    /**
     * Retourne la valeur numérique courante, si définie.
     */
    getNumber(): number | null {
        return this.currentValue;
    }

    /**
     * Met à jour la valeur numérique et anime le passage (API type NumberFlow `.update()`).
     * @param value - Nouvelle valeur
     * @param rollOptions - Surcharge des options d'animation
     */
    update(value: number, rollOptions: ShuffleNumberRollOptions = {}): void {
        if (!Number.isFinite(value)) return;

        if (this.options.onOpenStart) this.options.onOpenStart(this);

        clearTimeout(this.revertTimeout);
        this.revertTimeout = undefined;
        this.restingText = undefined;

        const prev = this.currentValue;
        const direction = this.resolveDirection(prev, value, rollOptions);
        const text = this.formatValue(value);

        this.currentValue = value;
        this.currentText = text;
        this.options.value = value;
        this.options.text = text;
        this.el.setAttribute('data-value', String(value));

        this.applyDisplay(text, { ...rollOptions, direction });

        if (this.options.onOpenEnd) this.options.onOpenEnd(this);
    }

    /**
     * Roule vers un nouveau texte (changement permanent).
     * @param text - Texte cible
     * @param rollOptions - Surcharge des options d'animation
     */
    set(text: string, rollOptions: ShuffleNumberRollOptions = {}): void {
        if (this.options.onOpenStart) this.options.onOpenStart(this);

        clearTimeout(this.revertTimeout);
        this.revertTimeout = undefined;
        this.restingText = undefined;
        this.currentText = text;
        this.currentValue = null;
        this.options.text = text;

        this.applyDisplay(text, rollOptions);

        if (this.options.onOpenEnd) this.options.onOpenEnd(this);
    }

    /**
     * Roule temporairement vers un texte puis revient au précédent.
     * Spam-safe : les clics répétés redémarrent le timer de revert.
     * @param text - Texte temporaire
     * @param flashOptions - Options flash (revertAfter, enter, exit)
     */
    flash(text: string, flashOptions: ShuffleNumberFlashOptions = {}): void {
        const { revertAfter = this.options.revertAfter, enter, exit } = flashOptions;
        const target = this.valueEl ?? this.el;

        if (this.restingText === undefined) {
            this.restingText = this.currentText;
        }

        this.currentText = text;

        if (!this.shouldAnimate()) {
            target.textContent = text;
            clearTimeout(this.revertTimeout);
            this.revertTimeout = setTimeout(() => {
                const back = this.restingText ?? '';
                this.restingText = undefined;
                this.revertTimeout = undefined;
                this.currentText = back;
                target.textContent = back;
            }, revertAfter);
            return;
        }

        animateShuffleNumber(target, text, {
            ...this.mergeRollOptions(enter),
            interrupt: false,
        });

        clearTimeout(this.revertTimeout);
        this.revertTimeout = setTimeout(() => {
            const back = this.restingText ?? '';
            this.restingText = undefined;
            this.revertTimeout = undefined;
            this.currentText = back;
            animateShuffleNumber(target, back, {
                ...this.mergeRollOptions(exit),
                interrupt: false,
            });
        }, revertAfter);
    }

    /**
     * Active ou désactive les animations (termine l'animation en cours si false).
     */
    setAnimated(animated: boolean): void {
        this.options.animated = animated;
        if (!animated) {
            const target = this.valueEl ?? this.el;
            clearShuffleNumber(target, this.currentText);
            if (target !== this.el || (!this.prefixEl && !this.suffixEl)) {
                target.textContent = this.currentText;
            } else {
                buildShuffleNumber(target, this.currentText);
                clearShuffleNumber(target, this.currentText);
                target.textContent = this.currentText;
            }
        }
    }

    /**
     * Détruit l'instance et restaure un texte simple.
     */
    override destroy(): void {
        if (this.options.onCloseStart) this.options.onCloseStart(this);

        clearTimeout(this.revertTimeout);
        this.revertTimeout = undefined;

        const display =
            (this.options.prefix || '') + this.currentText + (this.options.suffix || '');
        clearShuffleNumber(this.valueEl ?? this.el, this.currentText);
        this.el.textContent = display;
        this.el.classList.remove(SHUFFLE_NUMBER_CSS.root, SHUFFLE_NUMBER_CSS.willChange);

        if (this.options.onCloseEnd) this.options.onCloseEnd(this);
        super.destroy();
    }
}

/** @deprecated Utiliser ShuffleNumber */
export { ShuffleNumber as Slot };
