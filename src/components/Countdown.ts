/**
 * @fileoverview Composant Countdown (compte à rebours) pour K3UI
 * @description Affichage d'un compte à rebours avec format personnalisable (HH:mm:ss, DD, etc.)
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import type { CountdownOptions, CountdownTimeData } from '../types/components';
import { PriorityLevel, InitElements } from '../types/base';
import { setAriaAttributes } from '../utils/dom/aria';
import { getOrCreateChild } from '../utils/dom/elements';
import { LoggerManager, LocaleManager } from '../core/managers';
import { ManagerFactory } from '../core/factories';
import { getCountdownDefaults } from '../specs/components/countdown.specs';
import { getPreferReducedMotion } from '../utils/accessibility';

const _defaults: CountdownOptions = getCountdownDefaults();

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
/** 1 mois = 30 jours pour le calcul du countdown */
const DAYS_PER_MONTH = 30;

function toNumber(value: number | string): number {
    const n = typeof value === 'string' ? parseFloat(value) : value;
    return Number.isFinite(n) ? Math.max(0, n) : 0;
}

function padStart(str: string, length: number, pad: string): string {
    if (str.length >= length) return str;
    return pad.repeat(length - str.length) + str;
}

/**
 * Classe Countdown pour K3UI
 */
export class Countdown extends Component<CountdownOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;
    private logger: LoggerManager;

    private endTime: number = 0;
    private isStart: boolean = false;
    private rafId: number = 0;
    private remainingTime: number = 0;
    private displayElement: HTMLElement | null = null;
    private reducedMotion: boolean = false;
    /** True quand une date de fin (endDate) est utilisée : endTime = timestamp absolu, tick utilise Date.now() */
    private useEndDate: boolean = false;
    /** Segments (HH, mm, ss, etc.) pour le mode affichage par blocs (classe countdown--segments) */
    private segmentElements: Map<string, HTMLElement> = new Map();
    /** Libellés sous chaque segment (classe countdown--with-labels), clé = unit (MM, DD, …) */
    private segmentLabelElements: Map<string, HTMLElement> = new Map();

    static get defaults(): CountdownOptions {
        return { ..._defaults };
    }

    static getInstance(el: HTMLElement): Countdown | undefined {
        return Component.getInstance(el) as Countdown | undefined;
    }

    static init(el: HTMLElement, options?: Partial<CountdownOptions>): Countdown;
    static init(els: InitElements<HTMLElement> | string, options?: Partial<CountdownOptions>): Countdown[];
    static init(
        els: HTMLElement | InitElements<HTMLElement> | string,
        options: Partial<CountdownOptions> = {}
    ): Countdown | Countdown[] {
        const resolved: HTMLElement | NodeListOf<HTMLElement> =
            typeof els === 'string' ? document.querySelectorAll<HTMLElement>(els) : (els as HTMLElement | NodeListOf<HTMLElement>);
        return super.init(
            resolved,
            options,
            Countdown as ComponentType<Countdown, CountdownOptions>
        ) as Countdown | Countdown[];
    }

    constructor(el: HTMLElement, options: Partial<CountdownOptions> = {}) {
        super(el, options, toComponentClassDef(Countdown));
        this.logger = ManagerFactory.getLoggerManager('[Countdown]');
        this.init();
    }

    private init(): void {
        this.readAttributes();
        this.setupDisplay();
        this.setupAccessibility();
        this.reducedMotion = getPreferReducedMotion();
        const endDate = this.options.endDate;
        if (endDate != null) {
            const ts = typeof endDate === 'string' ? new Date(endDate).getTime() : endDate.getTime();
            if (Number.isFinite(ts)) {
                this.useEndDate = true;
                this.endTime = ts;
            }
        }
        this.tick();
        if (this.options.autoStart) {
            this.start();
        }
        this.logger.info('Component initialized');
    }

    private readAttributes(): void {
        const timeAttr = this.el.getAttribute('data-time');
        if (timeAttr != null) {
            const n = toNumber(timeAttr);
            if (n >= 0) this.options.time = n;
        }
        const endDateAttr = this.el.getAttribute('data-end-date');
        if (endDateAttr != null) {
            const d = new Date(endDateAttr);
            if (!isNaN(d.getTime())) this.options.endDate = endDateAttr;
        }
        const endMessageAttr = this.el.getAttribute('data-end-message');
        if (endMessageAttr != null) this.options.endMessage = endMessageAttr;
        const formatAttr = this.el.getAttribute('data-format');
        if (formatAttr != null) this.options.format = formatAttr;
        const autoAttr = this.el.getAttribute('data-auto-start');
        if (autoAttr != null) this.options.autoStart = autoAttr === 'true' || autoAttr === '';
        const shortLabelsAttr = this.el.getAttribute('data-short-labels');
        if (shortLabelsAttr != null) this.options.shortLabels = shortLabelsAttr === 'true' || shortLabelsAttr === '';
    }

    private setupDisplay(): void {
        const existing = this.el.querySelector('.countdown__display') as HTMLElement;
        if (existing) {
            this.displayElement = existing;
            this.buildSegmentsIfNeeded();
            return;
        }
        if (this.el.childNodes.length === 0 || (this.el.childNodes.length === 1 && this.el.textContent?.trim() === '')) {
            this.displayElement = getOrCreateChild(this.el, '.countdown__display', 'span');
            this.displayElement.setAttribute('aria-hidden', 'true');
            this.buildSegmentsIfNeeded();
        } else {
            this.displayElement = this.el;
        }
    }

    /** Clés i18n singulier/pluriel par unité */
    private static readonly UNIT_LABEL_KEYS: Record<string, { one: string; other: string }> = {
        MM: { one: 'countdown.month', other: 'countdown.months' },
        DD: { one: 'countdown.day', other: 'countdown.days' },
        HH: { one: 'countdown.hour', other: 'countdown.hours' },
        mm: { one: 'countdown.minute', other: 'countdown.minutes' },
        ss: { one: 'countdown.second', other: 'countdown.seconds' },
    };

    /** Construit les spans par segment (HH, mm, ss, etc.) quand la classe countdown--segments est présente */
    private buildSegmentsIfNeeded(): void {
        if (!this.displayElement || !this.el.classList.contains('countdown--segments')) return;
        const format = this.options.format;
        const parts: string[] = format.split(/(MM|DD|HH|mm|ss)/g);
        this.displayElement.textContent = '';
        this.displayElement.classList.add('countdown__display--segments');
        this.segmentElements.clear();
        this.segmentLabelElements.clear();
        const withLabels = this.el.classList.contains('countdown--with-labels');
        const units = new Set(['MM', 'DD', 'HH', 'mm', 'ss']);
        for (const part of parts) {
            if (units.has(part)) {
                if (withLabels) {
                    const cell = document.createElement('div');
                    cell.className = 'countdown__segment-cell';
                    cell.setAttribute('aria-hidden', 'true');
                    const span = document.createElement('span');
                    span.className = 'countdown__segment';
                    span.setAttribute('data-unit', part);
                    const label = document.createElement('span');
                    label.className = 'countdown__segment-label';
                    cell.appendChild(span);
                    cell.appendChild(label);
                    this.displayElement.appendChild(cell);
                    this.segmentElements.set(part, span);
                    this.segmentLabelElements.set(part, label);
                } else {
                    const span = document.createElement('span');
                    span.className = 'countdown__segment';
                    span.setAttribute('data-unit', part);
                    span.setAttribute('aria-hidden', 'true');
                    this.displayElement.appendChild(span);
                    this.segmentElements.set(part, span);
                }
            } else if (part.length > 0) {
                const sep = document.createElement('span');
                sep.className = 'countdown__separator';
                sep.setAttribute('aria-hidden', 'true');
                sep.textContent = part;
                this.displayElement.appendChild(sep);
            }
        }
    }

    private setupAccessibility(): void {
        setAriaAttributes(this.el, {
            role: 'timer',
            'aria-live': 'polite',
            'aria-label': LocaleManager.t('countdown.ariaLabel'),
        });
    }

    /** Retourne la valeur numérique pour une unité (normalise MM/Mm/mM → months, mm → minutes, etc.) */
    private getSegmentValue(unit: string, timeData: CountdownTimeData): number {
        const u = unit;
        if (u === 'mm') return timeData.minutes;
        if (u === 'ss') return timeData.seconds;
        if (u === 'MM' || u === 'Mm' || u === 'mM') return timeData.months;
        if (u === 'DD' || u === 'Dd' || u === 'dD') return timeData.days;
        if (u === 'HH' || u === 'Hh' || u === 'hH') return timeData.hours;
        const upper = u.toUpperCase();
        if (upper === 'MM') return timeData.months;
        if (upper === 'DD') return timeData.days;
        if (upper === 'HH') return timeData.hours;
        return timeData.seconds;
    }

    private parseFormat(format: string, time: CountdownTimeData): string {
        const scannedTimes = [time.months, time.days, time.hours, time.minutes, time.seconds, time.milliseconds];
        const scannedFormats = ['MM', 'DD', 'HH', 'mm', 'ss'];
        const padValues = [DAYS_PER_MONTH, 24, 60, 60, 1000];
        let result = format;

        scannedFormats.forEach((scannedFormat, index) => {
            if (!result.includes(scannedFormat)) {
                scannedTimes[index + 1] += scannedTimes[index] * padValues[index];
            } else {
                const value = padStart(String(scannedTimes[index]), 2, '0');
                const re = new RegExp(scannedFormat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                result = result.replace(re, value);
            }
        });

        if (result.includes('S')) {
            const ms = padStart(String(scannedTimes[5]), 3, '0');
            if (result.includes('SSS')) result = result.replace(/SSS/g, ms);
            else if (result.includes('SS')) result = result.replace(/SS/g, ms.slice(0, 2));
            else result = result.replace(/S/g, ms.slice(0, 1));
        }
        return result;
    }

    private displayTime(durationMs: number): void {
        if (durationMs <= 0) {
            const endMessage = this.options.endMessage.trim()
                ? this.options.endMessage
                : LocaleManager.t('countdown.endMessage');
            if (this.displayElement) {
                if (this.segmentElements.size > 0) {
                    this.displayElement.classList.remove('countdown__display--segments');
                    while (this.displayElement.firstChild) this.displayElement.removeChild(this.displayElement.firstChild);
                    this.segmentElements.clear();
                    this.segmentLabelElements.clear();
                }
                this.displayElement.textContent = endMessage;
            }
            this.el.setAttribute('data-ended', 'true');
            this.el.classList.add('countdown--ended');
            if (this.options.onChange) {
                this.options.onChange(
                    { months: 0, days: 0, hours: 0, minutes: 0, seconds: 0, milliseconds: 0 },
                    this
                );
            }
            return;
        }
        const totalDays = Math.floor(durationMs / DAY);
        const months = Math.floor(totalDays / DAYS_PER_MONTH);
        const days = totalDays % DAYS_PER_MONTH;
        const hours = Math.floor((durationMs % DAY) / HOUR);
        const minutes = Math.floor((durationMs % HOUR) / MINUTE);
        const seconds = Math.floor((durationMs % MINUTE) / SECOND);
        const milliseconds = Math.floor(durationMs % SECOND);
        const timeData: CountdownTimeData = { months, days, hours, minutes, seconds, milliseconds };

        if (this.el.classList.contains('countdown--segments')) {
            if (this.segmentElements.size === 0 && this.displayElement) {
                this.buildSegmentsIfNeeded();
            }
            if (this.segmentElements.size > 0) {
                this.segmentElements.forEach((el, unit) => {
                    const val = this.getSegmentValue(unit, timeData);
                    el.textContent = padStart(String(val), 2, '0');
                });
                const labelKeyByUnit: Record<string, keyof typeof Countdown.UNIT_LABEL_KEYS> = {
                    MM: 'MM', DD: 'DD', HH: 'HH', mm: 'mm', ss: 'ss',
                    Mm: 'MM', mM: 'MM', Dd: 'DD', Hh: 'HH', Ss: 'ss',
                };
                const shortKeyByUnit: Record<string, string> = {
                    MM: 'countdown.monthShort', DD: 'countdown.dayShort', HH: 'countdown.hourShort',
                    mm: 'countdown.minuteShort', ss: 'countdown.secondShort',
                };
                this.segmentLabelElements.forEach((el, unit) => {
                    const key = labelKeyByUnit[unit] ?? unit;
                    if (this.options.shortLabels && shortKeyByUnit[key]) {
                        el.textContent = LocaleManager.t(shortKeyByUnit[key]);
                    } else {
                        const keys = Countdown.UNIT_LABEL_KEYS[key];
                        if (keys) {
                            const val = this.getSegmentValue(unit, timeData);
                            el.textContent = val === 1 ? LocaleManager.t(keys.one) : LocaleManager.t(keys.other);
                        }
                    }
                });
            } else {
                const text = this.parseFormat(this.options.format, timeData);
                if (this.displayElement) this.displayElement.textContent = text;
            }
        } else {
            const text = this.parseFormat(this.options.format, timeData);
            if (this.displayElement) {
                this.displayElement.textContent = text;
            }
        }
        this.el.removeAttribute('data-ended');
        this.el.classList.remove('countdown--ended');
        if (this.options.onChange) {
            this.options.onChange(timeData, this);
        }
    }

    private tick = (): void => {
        if (this.useEndDate) {
            this.remainingTime = Math.max(0, this.endTime - Date.now());
        } else {
            const now = performance.now();
            if (!this.endTime) {
                this.endTime = now + toNumber(this.options.time);
            }
            this.remainingTime = Math.max(0, this.endTime - now);
        }
        this.displayTime(this.remainingTime);

        if (this.remainingTime <= 0) {
            if (this.options.onEnd) this.options.onEnd();
            return;
        }
        if (this.isStart) {
            if (this.reducedMotion) {
                this.rafId = window.setTimeout(this.tick, 1000) as unknown as number;
            } else {
                this.rafId = requestAnimationFrame(this.tick);
            }
        }
    };

    /**
     * Démarre ou reprend le compte à rebours
     * @param resume Si true, reprend avec le temps restant courant
     */
    start(resume: boolean = false): void {
        if (this.isStart && !resume) return;
        this.isStart = true;
        if (!this.useEndDate) {
            this.endTime = performance.now() + (this.remainingTime || toNumber(this.options.time));
        }
        this.tick();
    }

    /** Met en pause le compte à rebours */
    pause(): void {
        this.isStart = false;
        if (this.reducedMotion) {
            clearTimeout(this.rafId);
        } else {
            cancelAnimationFrame(this.rafId);
        }
    }

    /** Réinitialise le compte à rebours (temps initial, affichage, sans redémarrer) */
    reset(): void {
        this.isStart = false;
        this.el.removeAttribute('data-ended');
        this.el.classList.remove('countdown--ended');
        if (this.reducedMotion) clearTimeout(this.rafId);
        else cancelAnimationFrame(this.rafId);
        if (this.useEndDate && this.options.endDate != null) {
            const ts = typeof this.options.endDate === 'string'
                ? new Date(this.options.endDate).getTime()
                : this.options.endDate.getTime();
            if (Number.isFinite(ts)) this.endTime = ts;
        } else {
            this.endTime = 0;
        }
        this.tick();
    }

    /** Retourne le temps restant en millisecondes */
    getRemainingTime(): number {
        return this.remainingTime;
    }

    /** Indique si le compte à rebours est en cours */
    isRunning(): boolean {
        return this.isStart;
    }

    override destroy(): void {
        this.pause();
        this.logger.info('Component destroyed');
        super.destroy();
    }
}

/**
 * Custom Element <k3ui-countdown>
 * @description Permet l'utilisation de <k3ui-countdown> dans le HTML. Initialisation par AutoInit.
 */
if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-countdown')) {
    customElements.define('k3ui-countdown', class extends HTMLElement {
        connectedCallback(): void {
            if (!this.hasAttribute('data-initialized')) {
                this.setAttribute('data-initialized', 'true');
            }
        }
        disconnectedCallback(): void {
            const instance = Countdown.getInstance(this);
            if (instance && typeof instance.destroy === 'function') {
                instance.destroy();
            }
        }
    });
}
