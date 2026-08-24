/**
 * @fileoverview Composant Ticker pour K3UI
 * @description Affichage d'une valeur chiffrée signée, façon cotation boursière / KPI
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { toComponentClassDef } from '../types/components/component-base';
import type {
    TickerFormat,
    TickerIndicator,
    TickerLayout,
    TickerOptions,
    TickerSize,
    TickerTrend,
} from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { setAriaAttributes, setAriaAttribute, removeAriaAttribute } from '../utils/dom/aria';
import { LocaleManager, IconManager } from '../core/managers';
import { getTickerDefaults } from '../specs/components/ticker.specs';

const _defaults: TickerOptions = getTickerDefaults();

/**
 * Tendance d'une valeur, avec zone morte optionnelle autour de zéro.
 * @param value Valeur signée
 * @param flatThreshold Seuil d'absolu sous lequel la tendance est flat
 */
export function trendOf(value: number, flatThreshold = 0): TickerTrend {
    if (!Number.isFinite(value) || Math.abs(value) <= flatThreshold) return 'flat';
    return value > 0 ? 'up' : 'down';
}

/**
 * Formate la valeur (signe porté par l'indicateur sauf signOnValue / none).
 * @param config Options du ticker
 */
export function formatTickerValue(config: Pick<
    TickerOptions,
    'value' | 'format' | 'locale' | 'currency' | 'precision' | 'indicator' | 'signOnValue'
>): string {
    const { value, format, locale, currency } = config;
    if (!Number.isFinite(value)) {
        return LocaleManager.t('ticker.valueUnknown') || '—';
    }

    const digits = config.precision ?? (format === 'number' ? 0 : 2);
    const signDisplay = config.indicator === 'none' || config.signOnValue ? 'exceptZero' : 'never';

    const options: Intl.NumberFormatOptions = {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
        signDisplay: signDisplay as Intl.NumberFormatOptions['signDisplay'],
    };

    if (format === 'currency') {
        options.style = 'currency';
        options.currency = currency;
    } else if (format === 'percent') {
        // Intl divise par 100 en style "percent" : on lui repasse un ratio.
        options.style = 'percent';
        return new Intl.NumberFormat(locale, options).format(value / 100);
    }

    return new Intl.NumberFormat(locale, options).format(value);
}

/** Le sens est déjà verbalisé dans l'aria-label : on enlève le signe du nombre. */
function stripSign(text: string): string {
    return text.replace(/[-\u2212+]\s?/, '');
}

/**
 * Classe Ticker pour K3UI
 */
export class Ticker extends Component<TickerOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    private labelEl: HTMLElement | null = null;
    private indicatorEl: HTMLElement | null = null;
    private valueEl: HTMLElement | null = null;
    private deltaEl: HTMLElement | null = null;
    private previous: number | null = null;
    private authorClasses: string[] = [];
    private unbindFlashEnd: (() => void) | null = null;

    static get defaults(): TickerOptions {
        return { ..._defaults };
    }

    static getInstance(el: HTMLElement): Ticker | undefined {
        return Component.getInstance(el) as Ticker | undefined;
    }

    static init(els: HTMLElement, options?: Partial<TickerOptions>): Ticker;
    static init(els: InitElements<KElement>, options?: Partial<TickerOptions>): Ticker[];
    static init(
        els: HTMLElement | InitElements<KElement>,
        options: Partial<TickerOptions> = {}
    ): Ticker | Ticker[] {
        return Component.init(els, options, toComponentClassDef(Ticker)) as Ticker | Ticker[];
    }

    constructor(el: HTMLElement, options: Partial<TickerOptions> = {}) {
        super(el, options, toComponentClassDef(Ticker));
        this.options = {
            ...Ticker.defaults,
            ...options,
        };
        this.init();
    }

    private init(): void {
        if (this.el.tagName.toLowerCase() === 'k3ui-ticker') {
            this.el.classList.add('ticker');
        }
        this.authorClasses = Array.from(this.el.classList).filter(
            (name) => name !== 'ticker' && !name.startsWith('ticker--') && !name.startsWith('is-')
        );
        this.readAttributes();
        this.buildDOM();
        this.render();
    }

    private readAttributes(): void {
        const attr = (name: string): string | null => this.el.getAttribute(name);
        const num = (name: string): number | null => {
            const raw = attr(name)?.trim();
            if (!raw) return null;
            const parsed = Number(raw);
            return Number.isFinite(parsed) ? parsed : null;
        };

        const label = attr('data-label');
        if (label !== null) this.options.label = label;

        const value = num('data-value');
        if (value !== null) this.options.value = value;

        const format = attr('data-format') as TickerFormat | null;
        if (format === 'number' || format === 'percent' || format === 'currency') {
            this.options.format = format;
        }

        const indicator = attr('data-indicator') as TickerIndicator | null;
        if (indicator === 'sign' || indicator === 'caret' || indicator === 'none') {
            this.options.indicator = indicator;
        }

        const precisionRaw = attr('data-precision');
        if (precisionRaw !== null) {
            const p = Number(precisionRaw);
            this.options.precision = Number.isFinite(p) ? p : null;
        }

        const locale = attr('data-locale');
        if (locale !== null) this.options.locale = locale;

        const currency = attr('data-currency');
        if (currency !== null) this.options.currency = currency;

        const delta = attr('data-delta');
        if (delta !== null) this.options.delta = delta;

        const flat = num('data-flat-threshold');
        if (flat !== null) this.options.flatThreshold = flat;

        if (this.el.hasAttribute('data-sign-on-value')) {
            const raw = attr('data-sign-on-value');
            this.options.signOnValue = raw === '' || raw === 'true';
        }

        const size = attr('data-size') as TickerSize | null;
        if (size === 'sm' || size === 'md' || size === 'lg') this.options.size = size;

        const layout = attr('data-layout') as TickerLayout | null;
        if (layout === 'inline' || layout === 'stacked') this.options.layout = layout;

        if (this.el.hasAttribute('data-live')) {
            const raw = attr('data-live');
            this.options.live = raw === '' || raw === 'true';
        }
    }

    private buildDOM(): void {
        this.el.innerHTML =
            '<span class="ticker__label"></span>' +
            '<span class="ticker__readout">' +
            '<span class="ticker__indicator"></span>' +
            '<span class="ticker__value"></span>' +
            '<span class="ticker__delta"></span>' +
            '</span>';

        this.labelEl = this.el.querySelector('.ticker__label');
        this.indicatorEl = this.el.querySelector('.ticker__indicator');
        this.valueEl = this.el.querySelector('.ticker__value');
        this.deltaEl = this.el.querySelector('.ticker__delta');

        if (this.indicatorEl) {
            setAriaAttribute(this.indicatorEl, 'hidden', true);
        }
    }

    /**
     * Tendance courante (up / down / flat)
     */
    get trend(): TickerTrend {
        return trendOf(this.options.value, this.options.flatThreshold);
    }

    /**
     * Met à jour la valeur (et éventuellement le delta) et déclenche le flash.
     * @param value Nouvelle valeur signée
     * @param delta Texte secondaire optionnel (null pour masquer)
     */
    setValue(value: number, delta?: string | null): void {
        this.options.value = value;
        this.el.setAttribute('data-value', String(value));
        if (delta !== undefined) {
            this.options.delta = delta;
            if (delta === null) this.el.removeAttribute('data-delta');
            else this.el.setAttribute('data-delta', delta);
        }
        this.render();
        this.options.onChange?.(this.options.value, this);
    }

    /**
     * Retourne la valeur actuelle
     */
    getValue(): number {
        return this.options.value;
    }

    /**
     * Met à jour les options et re-rend
     * @param options Options partielles
     */
    updateOptions(options: Partial<TickerOptions>): void {
        this.options = { ...this.options, ...options };
        this.render();
    }

    private render(): void {
        const { label, indicator, size, layout, live, delta } = this.options;
        const trend = this.trend;
        const text = formatTickerValue(this.options);

        this.el.className = [
            'ticker',
            `ticker--${size}`,
            `ticker--${layout}`,
            `ticker--indicator-${indicator}`,
            `is-${trend}`,
            ...this.authorClasses,
        ].join(' ');

        if (this.labelEl) this.labelEl.textContent = label;
        if (this.valueEl) this.valueEl.textContent = text;

        if (this.deltaEl) {
            this.deltaEl.textContent = delta ?? '';
            this.deltaEl.hidden = !delta;
        }

        if (this.indicatorEl) {
            this.renderIndicator(indicator, trend);
        }

        const trendKey =
            trend === 'up' ? 'ticker.trendUp' : trend === 'down' ? 'ticker.trendDown' : 'ticker.trendFlat';
        const spoken = Number.isFinite(this.options.value)
            ? `${LocaleManager.t(trendKey)} ${stripSign(text)}`
            : LocaleManager.t('ticker.valueUnavailable');

        setAriaAttributes(this.el, {
            role: 'group',
            label: [label, spoken, delta].filter(Boolean).join(', '),
        });

        if (this.valueEl) {
            if (live) setAriaAttribute(this.valueEl, 'live', 'polite');
            else removeAriaAttribute(this.valueEl, 'live');
        }

        this.flash(this.options.value);
    }

    /**
     * Résout le nom d'icône IconManager selon l'indicateur et la tendance.
     */
    private indicatorIconName(indicator: TickerIndicator, trend: TickerTrend): string | null {
        if (indicator === 'none') return null;
        if (indicator === 'sign') {
            if (trend === 'up') return 'plus';
            if (trend === 'down') return 'minus';
            return 'minus';
        }
        // caret
        if (trend === 'up') return 'caret-up';
        if (trend === 'down') return 'caret-down';
        return 'minus';
    }

    /**
     * Injecte l'icône via IconManager (caret-up/down, plus/minus).
     */
    private renderIndicator(indicator: TickerIndicator, trend: TickerTrend): void {
        if (!this.indicatorEl) return;

        const iconName = this.indicatorIconName(indicator, trend);
        if (!iconName) {
            this.indicatorEl.innerHTML = '';
            this.indicatorEl.hidden = true;
            setAriaAttribute(this.indicatorEl, 'hidden', true);
            return;
        }

        const iconSize = this.options.size === 'lg' ? 'md' : 'sm';
        this.indicatorEl.hidden = false;
        this.indicatorEl.innerHTML =
            `<i class="k3ui-icon" name="${iconName}" size="${iconSize}" aria-hidden="true"></i>`;
        setAriaAttribute(this.indicatorEl, 'hidden', true);
        IconManager.processIconsInContainer(this.indicatorEl);
    }

    private flash(value: number): void {
        const previous = this.previous;
        this.previous = value;
        if (previous === null || previous === value || !Number.isFinite(value)) return;

        const direction = value > previous ? 'up' : 'down';
        this.el.removeAttribute('data-flash');
        // Force un reflow pour rejouer l'animation sur des mises à jour rapprochées.
        void this.el.offsetWidth;
        this.el.setAttribute('data-flash', direction);

        this.unbindFlashEnd?.();
        this.unbindFlashEnd = this.registerEvent(this.el, 'animationend', () => {
            this.el.removeAttribute('data-flash');
            this.unbindFlashEnd = null;
        });
    }

    override destroy(): void {
        this.unbindFlashEnd?.();
        this.unbindFlashEnd = null;
        this.labelEl = null;
        this.indicatorEl = null;
        this.valueEl = null;
        this.deltaEl = null;
        super.destroy();
    }
}

/**
 * Custom Element &lt;k3ui-ticker&gt;
 * @description Permet l'utilisation de &lt;k3ui-ticker&gt; dans le HTML. Initialisation par AutoInit.
 */
if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-ticker')) {
    customElements.define(
        'k3ui-ticker',
        class extends HTMLElement {
            connectedCallback(): void {
                if (!this.hasAttribute('data-initialized')) {
                    this.setAttribute('data-initialized', 'true');
                }
            }
            disconnectedCallback(): void {
                const instance = Ticker.getInstance(this);
                if (instance && typeof instance.destroy === 'function') {
                    instance.destroy();
                }
            }
        }
    );
}
