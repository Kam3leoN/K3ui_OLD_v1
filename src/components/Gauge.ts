/**
 * @fileoverview Composant Gauge pour K3UI
 * @description Jauge circulaire Material 3 Expressive — arc 270°, ressort spatial, typo cqi
 * @author K3UI Team
 * @version 2.0.0
 */

import { Component } from '../core/base/Component';
import { toComponentClassDef } from '../types/components/component-base';
import type { GaugeOptions, GaugeColors, GaugePalette } from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { setAriaAttribute, setAriaAttributes } from '../utils/dom/aria';
import { LocaleManager, IconManager } from '../core/managers';
import { getGaugeDefaults, GaugeSpecs } from '../specs/components/gauge.specs';
import { sanitizeHtmlFragment } from '../utils/dom/sanitize';
import { M3_SPRING, SpringValue } from '../utils/motion/springValue';

const SWEEP = GaugeSpecs.totalSpan;
const START = GaugeSpecs.startAngle;
const CX = GaugeSpecs.centerX;
const CY = GaugeSpecs.centerY;

function polar(cx: number, cy: number, r: number, deg: number): { x: number; y: number } {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, a0: number, a1: number): string {
    const s = polar(cx, cy, r, a0);
    const e = polar(cx, cy, r, a1);
    const large = a1 - a0 > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

function describeArcCCW(cx: number, cy: number, r: number, a0: number, a1: number): string {
    const s = polar(cx, cy, r, a0);
    const e = polar(cx, cy, r, a1);
    const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y}`;
}

const _defaults: GaugeOptions = getGaugeDefaults();

const CSS_VAR_MAP: Record<keyof GaugeColors, string> = {
    frame: '--g-frame',
    frameOpacity: '--g-frame-opacity',
    track: '--g-track',
    trackActive: '--g-track-active',
    icon: '--g-icon',
    text: '--g-text',
    sublabel: '--g-sublabel',
    tick: '--g-tick',
    marker: '--g-marker',
};

/**
 * Classe Gauge pour K3UI — indicateur circulaire MD3 Expressive.
 */
export class Gauge extends Component<GaugeOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    private svgEl: SVGSVGElement | null = null;
    private progressEl: SVGPathElement | null = null;
    private valueDisplayEl: HTMLElement | null = null;
    private fractionEl: HTMLElement | null = null;
    private arcLabelEl: SVGTextElement | null = null;
    private arcUnitEl: SVGTextElement | null = null;
    private springValue: SpringValue | null = null;
    private resizeObserver: ResizeObserver | null = null;
    private uid = `g${Math.random().toString(36).slice(2, 8)}`;
    private calibrated = false;
    private lastWidth = 0;
    private _destroying = false;
    private readonly reducedMotion =
        typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

    static get defaults(): GaugeOptions {
        return { ..._defaults, colors: { ..._defaults.colors } };
    }

    static getInstance(el: HTMLElement): Gauge | undefined {
        return Component.getInstance(el) as Gauge | undefined;
    }

    static init(
        els: KElement | InitElements<KElement> | string,
        options: Partial<GaugeOptions> = {}
    ): Gauge | Gauge[] {
        return Component.init(els, options, toComponentClassDef(Gauge)) as Gauge | Gauge[];
    }

    constructor(el: HTMLElement, options: Partial<GaugeOptions> = {}) {
        super(el, options, toComponentClassDef(Gauge));

        this.options = {
            ...Gauge.defaults,
            ...options,
            colors: { ...Gauge.defaults.colors, ...(options.colors || {}) },
        };

        this.readAttributes();
        this.mount();
    }

    private readAttributes(): void {
        const el = this.el;
        const num = (attr: string): number | null => {
            const v = el.getAttribute(attr);
            if (v === null) return null;
            const n = parseFloat(v);
            return Number.isNaN(n) ? null : n;
        };

        const v = num('data-value');
        if (v !== null) this.options.value = v;
        const min = num('data-min');
        if (min !== null) this.options.min = min;
        const max = num('data-max');
        if (max !== null) this.options.max = max;
        const dec = num('data-decimals');
        if (dec !== null) this.options.decimals = Math.trunc(dec);
        const ticks = num('data-ticks');
        if (ticks !== null) this.options.ticks = Math.max(0, Math.trunc(ticks));
        const thr = num('data-threshold');
        if (thr !== null) this.options.threshold = thr;

        const str = (attr: string): string | null => el.getAttribute(attr);
        const label = str('data-label');
        if (label !== null) this.options.label = label;
        const unit = str('data-unit');
        if (unit !== null) this.options.unit = unit;
        const icon = str('data-icon');
        if (icon !== null) this.options.icon = icon;

        const display = str('data-display');
        if (display === 'fraction' || display === 'value') this.options.display = display;
        const palette = str('data-palette');
        if (palette) this.options.palette = palette as GaugePalette;
        const size = str('data-size');
        if (size === 'sm' || size === 'md' || size === 'lg') this.options.size = size;
        const spring = str('data-spring');
        if (spring === 'fast' || spring === 'default' || spring === 'slow') this.options.spring = spring;
        const state = str('data-state');
        if (state === 'ok' || state === 'loading' || state === 'error' || state === 'nodata') {
            this.options.state = state;
        }

        const frame = str('data-frame');
        if (frame !== null) this.options.frame = frame !== 'false';
        const curved = str('data-curved-text');
        if (curved !== null) {
            this.options.curvedText = curved !== 'false';
        } else {
            // Compat : data-label-arc / data-unit-arc → curvedText
            const la = str('data-label-arc');
            const ua = str('data-unit-arc');
            if (la !== null || ua !== null) {
                this.options.curvedText = (la !== 'false' && la !== null) || (ua !== 'false' && ua !== null);
            }
        }
    }

    private getArcRadius(): number {
        return this.options.size === 'lg' ? GaugeSpecs.radiusLg : GaugeSpecs.radius;
    }

    private getRatio(value = this.options.value): number {
        const { min, max } = this.options;
        const span = max - min || 1;
        return Math.min(1, Math.max(0, (value - min) / span));
    }

    private formatDisplayed(v: number): string {
        if (this.options.formatValue) return this.options.formatValue(v);
        const { decimals } = this.options;
        if (decimals > 0) {
            return v.toLocaleString('fr-FR', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
            });
        }
        return Math.round(v).toLocaleString('fr-FR');
    }

    private strokeColor(ratio: number): string {
        const { colors, palette } = this.options;
        if (colors.trackActive != null) return 'var(--g-track-active)';
        if (palette === 'neutral') return 'var(--gauge-neutral)';
        if (palette === 'primary') return 'var(--md-sys-color-primary)';
        if (palette === 'inverted') {
            if (ratio <= 0.25) return 'var(--gauge-inv-low)';
            if (ratio <= 0.5) return 'var(--gauge-inv-medium)';
            if (ratio <= 0.75) return 'var(--gauge-inv-high)';
            return 'var(--gauge-inv-full)';
        }
        if (palette === 'thermal') {
            if (ratio <= 0.25) return 'var(--gauge-cold)';
            if (ratio <= 0.5) return 'var(--gauge-cool)';
            if (ratio <= 0.75) return 'var(--gauge-warm)';
            return 'var(--gauge-hot)';
        }
        if (palette === 'lighthouse') {
            if (ratio < 0.5) return 'var(--gauge-lh-poor)';
            if (ratio < 0.9) return 'var(--gauge-lh-avg)';
            return 'var(--gauge-lh-good)';
        }
        if (ratio <= 0.25) return 'var(--gauge-low)';
        if (ratio <= 0.5) return 'var(--gauge-medium)';
        if (ratio <= 0.75) return 'var(--gauge-high)';
        return 'var(--gauge-critical)';
    }

    private applyColorVars(): void {
        const { colors } = this.options;
        (Object.keys(CSS_VAR_MAP) as (keyof GaugeColors)[]).forEach((key) => {
            const cssVar = CSS_VAR_MAP[key];
            if (!Object.prototype.hasOwnProperty.call(colors, key)) return;
            const val = colors[key];
            if (val != null) {
                this.el.style.setProperty(cssVar, String(val));
            } else {
                this.el.style.removeProperty(cssVar);
            }
        });
    }

    private buildTicks(svg: SVGSVGElement, arcR: number): void {
        const n = this.options.ticks;
        if (n <= 0) return;
        const svgNS = 'http://www.w3.org/2000/svg';
        for (let i = 0; i <= n; i++) {
            const ang = START + SWEEP * (i / n);
            const a = polar(CX, CY, arcR - 5, ang);
            const b = polar(CX, CY, arcR - 8, ang);
            const line = document.createElementNS(svgNS, 'line');
            line.setAttribute('class', 'gauge__tick');
            line.setAttribute('x1', a.x.toFixed(2));
            line.setAttribute('y1', a.y.toFixed(2));
            line.setAttribute('x2', b.x.toFixed(2));
            line.setAttribute('y2', b.y.toFixed(2));
            svg.appendChild(line);
        }
    }

    private buildMarker(svg: SVGSVGElement, arcR: number): void {
        const t = this.options.threshold;
        if (t == null) return;
        const { min, max } = this.options;
        const f = Math.min(1, Math.max(0, (t - min) / (max - min || 1)));
        const ang = START + SWEEP * f;
        const a = polar(CX, CY, arcR + 4, ang);
        const b = polar(CX, CY, arcR - 4, ang);
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('class', 'gauge__marker');
        line.setAttribute('x1', a.x.toFixed(2));
        line.setAttribute('y1', a.y.toFixed(2));
        line.setAttribute('x2', b.x.toFixed(2));
        line.setAttribute('y2', b.y.toFixed(2));
        svg.appendChild(line);
    }

    private textGeom(arcR: number): {
        rTop: number;
        rBot: number;
        topLen: number;
        botLen: number;
        topSpread: number;
        botSpread: number;
    } {
        const large = this.options.size === 'lg';
        const halfStroke = large ? 2.5 : 4;
        const labelH = large ? 6.4 : 7.6;
        const unitH = large ? 5.8 : 6.8;
        const innerEdge = arcR - halfStroke;
        const topObstacle = this.options.ticks > 0 ? 8 : halfStroke;
        const rTop = arcR - topObstacle - 2 - labelH / 2;
        const rBot = innerEdge - 2 - unitH / 2;
        const topSpread = 78;
        const botSpread = 70;
        return {
            rTop,
            rBot,
            topSpread,
            botSpread,
            topLen: (rTop * (2 * topSpread) * Math.PI) / 180,
            botLen: (rBot * (2 * botSpread) * Math.PI) / 180,
        };
    }

    private shouldCurveUnit(): boolean {
        const unit = (this.options.unit || '').trim();
        // Unités courtes (ex. « % ») restent à côté de la valeur ; les longues (hPa, bpm) vont sur l’arc.
        return this.options.curvedText && unit.length > 2;
    }

    private buildCurvedText(svg: SVGSVGElement, arcR: number): void {
        if (!this.options.curvedText || this.options.display !== 'value') return;
        const { label, unit } = this.options;
        const curveUnit = this.shouldCurveUnit();
        if (!label && !(unit && curveUnit)) return;

        const g = this.textGeom(arcR);
        const svgNS = 'http://www.w3.org/2000/svg';
        const defs = document.createElementNS(svgNS, 'defs');
        const topPath = document.createElementNS(svgNS, 'path');
        topPath.setAttribute('id', `${this.uid}-top`);
        topPath.setAttribute('d', describeArc(CX, CY, g.rTop, -g.topSpread, g.topSpread));
        defs.appendChild(topPath);
        if (curveUnit) {
            const botPath = document.createElementNS(svgNS, 'path');
            botPath.setAttribute('id', `${this.uid}-bot`);
            botPath.setAttribute(
                'd',
                describeArcCCW(CX, CY, g.rBot, 180 + g.botSpread, 180 - g.botSpread)
            );
            defs.appendChild(botPath);
        }
        svg.appendChild(defs);

        if (label) {
            const text = document.createElementNS(svgNS, 'text');
            text.setAttribute('class', 'gauge__arc-label');
            text.setAttribute('data-arclen', g.topLen.toFixed(2));
            const tp = document.createElementNS(svgNS, 'textPath');
            tp.setAttribute('href', `#${this.uid}-top`);
            tp.setAttribute('startOffset', '50%');
            tp.setAttribute('text-anchor', 'middle');
            tp.textContent = label;
            text.appendChild(tp);
            svg.appendChild(text);
            this.arcLabelEl = text;
        }
        if (unit && curveUnit) {
            const text = document.createElementNS(svgNS, 'text');
            text.setAttribute('class', 'gauge__arc-unit');
            text.setAttribute('data-arclen', g.botLen.toFixed(2));
            const tp = document.createElementNS(svgNS, 'textPath');
            tp.setAttribute('href', `#${this.uid}-bot`);
            tp.setAttribute('startOffset', '50%');
            tp.setAttribute('text-anchor', 'middle');
            tp.textContent = unit;
            text.appendChild(tp);
            svg.appendChild(text);
            this.arcUnitEl = text;
        }
    }

    private buildIconHtml(): string {
        const iconOpt = this.options.icon;
        if (!iconOpt) return '';
        if (iconOpt.trim().startsWith('<')) {
            return sanitizeHtmlFragment(
                iconOpt,
                new Set(['i', 'svg', 'path', 'circle', 'line', 'polyline', 'polygon', 'g']),
                {
                    i: new Set(['name', 'type', 'custom', 'folder', 'size', 'class', 'aria-hidden']),
                    svg: new Set(['viewBox', 'fill', 'xmlns', 'aria-hidden', 'class', 'width', 'height']),
                    path: new Set(['d', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin']),
                    circle: new Set(['cx', 'cy', 'r', 'fill', 'stroke', 'stroke-width']),
                    line: new Set(['x1', 'y1', 'x2', 'y2', 'stroke', 'stroke-width', 'stroke-linecap']),
                    polyline: new Set(['points', 'fill', 'stroke', 'stroke-width']),
                    polygon: new Set(['points', 'fill', 'stroke']),
                    g: new Set(['fill', 'stroke', 'transform']),
                }
            );
        }
        return '';
    }

    private appendIcon(parent: HTMLElement, small: boolean): void {
        const iconOpt = this.options.icon;
        if (!iconOpt) return;
        const wrap = document.createElement('span');
        wrap.className = small ? 'gauge__icon gauge__icon--sm' : 'gauge__icon';

        if (iconOpt.trim().startsWith('<')) {
            const html = this.buildIconHtml();
            if (html.trim()) wrap.innerHTML = html;
        } else {
            const iconEl = document.createElement('i');
            iconEl.className = 'k3ui-icon';
            iconEl.setAttribute('name', iconOpt.trim());
            iconEl.setAttribute('type', 'classic');
            iconEl.setAttribute('aria-hidden', 'true');
            iconEl.setAttribute('size', small ? 'md' : 'lg');
            wrap.appendChild(iconEl);
        }
        parent.appendChild(wrap);
    }

    private mountStateFallback(state: 'error' | 'nodata'): void {
        const el = this.el;
        el.classList.add('gauge');
        if (this.options.size === 'lg') el.classList.add('gauge--lg');
        if (this.options.size === 'sm') el.classList.add('gauge--sm');
        el.dataset.state = state;
        this.applyColorVars();

        const arcR = this.getArcRadius();
        const frameHtml = this.options.frame ? '<div class="gauge__frame"></div>' : '';
        const msg = state === 'error' ? 'Erreur' : '—';
        el.innerHTML = `${frameHtml}
            <svg class="gauge__svg" viewBox="0 0 100 100" aria-hidden="true">
              <path class="gauge__track" d="${describeArc(CX, CY, arcR, START, START + SWEEP)}" pathLength="100"/>
            </svg>
            <div class="gauge__content"><div class="gauge__state">${msg}</div></div>`;

        setAriaAttributes(el, {
            valuemin: String(this.options.min),
            valuemax: String(this.options.max),
            valuenow: String(this.options.value),
            label: this.options.label || this.options.unit || LocaleManager.t('gauge.ariaLabelDefault') || 'value',
        });
        el.setAttribute('role', 'meter');
    }

    private mount(): void {
        const { state } = this.options;
        if (state === 'error' || state === 'nodata') {
            this.mountStateFallback(state);
            return;
        }

        const el = this.el;
        el.classList.add('gauge');
        el.classList.toggle('gauge--lg', this.options.size === 'lg');
        el.classList.toggle('gauge--sm', this.options.size === 'sm');
        el.dataset.state = state;
        this.applyColorVars();

        const arcR = this.getArcRadius();
        const arcD = describeArc(CX, CY, arcR, START, START + SWEEP);
        const svgNS = 'http://www.w3.org/2000/svg';

        if (this.options.frame) {
            const frame = document.createElement('div');
            frame.className = 'gauge__frame';
            el.appendChild(frame);
        }

        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('class', 'gauge__svg');
        svg.setAttribute('viewBox', '0 0 100 100');
        svg.setAttribute('aria-hidden', 'true');

        this.buildCurvedText(svg, arcR);

        const track = document.createElementNS(svgNS, 'path');
        track.setAttribute('class', 'gauge__track');
        track.setAttribute('d', arcD);
        track.setAttribute('pathLength', '100');
        svg.appendChild(track);

        this.buildTicks(svg, arcR);

        const progress = document.createElementNS(svgNS, 'path');
        progress.setAttribute('class', 'gauge__progress');
        progress.setAttribute('d', arcD);
        progress.setAttribute('pathLength', '100');
        progress.setAttribute('stroke-dasharray', '0 400');
        progress.setAttribute('visibility', 'hidden');
        svg.appendChild(progress);

        this.buildMarker(svg, arcR);
        el.appendChild(svg);

        const { display, label, unit, icon, curvedText } = this.options;
        const curveUnit = this.shouldCurveUnit();
        const content = document.createElement('div');
        content.className = 'gauge__content';
        if (display === 'value') content.classList.add('gauge__content--value');
        if (curvedText && display === 'value') content.classList.add('gauge__content--curved');
        if (display === 'value' && !icon && !label && !unit && !curvedText) {
            content.classList.add('gauge__content--value-only');
        }

        if (display === 'value') {
            this.appendIcon(content, true);
            if (label && !curvedText) {
                const lab = document.createElement('span');
                lab.className = 'gauge__label gauge__label--sm';
                lab.title = label;
                lab.textContent = label;
                content.appendChild(lab);
            }
            const valueEl = document.createElement('span');
            valueEl.className = 'gauge__value';
            this.valueDisplayEl = valueEl;

            if (unit && !curveUnit) {
                const valueRow = document.createElement('span');
                valueRow.className = 'gauge__value-row';
                valueRow.appendChild(valueEl);
                const u = document.createElement('span');
                u.className = 'gauge__unit';
                u.textContent = unit;
                valueRow.appendChild(u);
                content.appendChild(valueRow);
            } else {
                content.appendChild(valueEl);
            }
        } else {
            this.appendIcon(content, false);
            const lab = document.createElement('span');
            lab.className = 'gauge__label';
            lab.title = label;
            lab.textContent = label;
            content.appendChild(lab);
        }
        el.appendChild(content);

        if (display === 'fraction') {
            const frac = document.createElement('span');
            frac.className = 'gauge__fraction';
            frac.textContent = `0/${this.options.max}`;
            el.appendChild(frac);
            this.fractionEl = frac;
        }

        if (icon && !icon.trim().startsWith('<')) {
            IconManager.processIconsInContainer(el);
            IconManager.forceDisplayIcons?.();
        }

        this.svgEl = svg;
        this.progressEl = progress;

        setAriaAttributes(el, {
            valuemin: String(this.options.min),
            valuemax: String(this.options.max),
            valuenow: String(this.options.value),
            label:
                this.options.label ||
                this.options.unit ||
                LocaleManager.t('gauge.ariaLabelDefault') ||
                'value',
        });
        el.setAttribute('role', 'meter');

        this.springValue = new SpringValue(0, M3_SPRING[this.options.spring], (x) => {
            this.onSpringTick(x);
        });

        this.resizeObserver = new ResizeObserver(() => {
            this.calibrated = false;
            this.lastWidth = 0;
            this.calibrate();
            this.fitCurvedText();
        });
        this.resizeObserver.observe(el);

        this.setValue(this.options.value, true);
        requestAnimationFrame(() => {
            this.calibrate();
            this.fitCurvedText();
        });
    }

    private onSpringTick(x: number): void {
        const progress = this.progressEl;
        if (!progress) return;
        const len = Math.max(0, x);
        progress.setAttribute('stroke-dasharray', `${len} 400`);
        progress.setAttribute('visibility', len > 0.4 ? 'visible' : 'hidden');

        const { min, max } = this.options;
        const span = max - min || 1;
        const animated = min + (x / 100) * span;

        if (this.valueDisplayEl) {
            this.valueDisplayEl.textContent = this.formatDisplayed(animated);
            if (!this.calibrated) this.calibrate();
        }
        if (this.fractionEl) {
            this.fractionEl.textContent = `${Math.round(this.options.value)}/${max}`;
        }
    }

    /**
     * Calibrage unique sur le pire cas 4 chiffres « 8 888 ».
     * Verrouillé pendant l’animation — recalcul uniquement au resize.
     */
    private calibrate(): void {
        const node = this.valueDisplayEl;
        if (!node) return;
        const w = this.el.clientWidth;
        if (!w || w === this.lastWidth) return;
        this.lastWidth = w;
        const maxAvail = w * 0.52;
        const maxPx = w * 0.2;
        const minPx = w * 0.1;
        const saved = node.textContent;
        node.textContent = '8\u2009888';
        node.style.fontSize = `${maxPx}px`;
        const measured = node.scrollWidth;
        const fitted = measured > 0 ? (maxAvail / measured) * maxPx : maxPx;
        node.style.fontSize = `${Math.floor(Math.min(maxPx, Math.max(minPx, fitted)))}px`;
        node.textContent = saved;
        this.calibrated = true;
    }

    private fitCurvedText(): void {
        if (!this.options.curvedText) return;
        const pairs: [SVGTextElement | null, number][] = [
            [this.arcLabelEl, parseFloat(this.arcLabelEl?.getAttribute('data-arclen') || '0')],
            [this.arcUnitEl, parseFloat(this.arcUnitEl?.getAttribute('data-arclen') || '0')],
        ];
        for (const [node, avail] of pairs) {
            if (!node || !avail) continue;
            const tp = node.querySelector('textPath');
            let len = 0;
            try {
                len = tp?.getComputedTextLength?.() ?? 0;
            } catch {
                len = 0;
            }
            if (len > avail) {
                const cur = parseFloat(getComputedStyle(node).fontSize) || 6;
                node.style.fontSize = `${(cur * (avail / len) * 0.96).toFixed(2)}px`;
            }
        }
    }

    private setValue(value: number, fromInit = false): void {
        const { min, max, onChange } = this.options;
        const clamped = Math.max(min, Math.min(max, value));
        this.options.value = clamped;
        const ratio = this.getRatio(clamped);

        if (this.progressEl) {
            this.progressEl.style.stroke = this.strokeColor(ratio);
        }
        setAriaAttribute(this.el, 'valuenow', String(clamped));

        const target = ratio * 100;
        if (!this.springValue) return;
        if (this.reducedMotion || this.options.state === 'loading') {
            this.springValue.snap(this.options.state === 'loading' ? 25 : target);
        } else {
            this.springValue.target = target;
        }

        if (!fromInit && onChange) {
            onChange(clamped, this);
        }
    }

    /**
     * Met à jour la valeur affichée et l’arc (animation ressort).
     * @param value Nouvelle valeur
     */
    update(value: number): void {
        this.setValue(value);
    }

    /**
     * Rejoue l’animation d’entrée depuis 0.
     * @param delay Délai avant reprise (ms)
     */
    replay(delay = 0): void {
        if (!this.springValue) return;
        const v = this.options.value;
        this.springValue.snap(0);
        window.setTimeout(() => this.setValue(v), delay);
    }

    /**
     * Change l’état visuel (ok | loading | error | nodata).
     * Pour error/nodata, remonte le DOM de secours.
     */
    setState(state: GaugeOptions['state']): void {
        this.options.state = state;
        this.el.dataset.state = state;
        if (state === 'error' || state === 'nodata') {
            this.teardownInternals();
            this.mountStateFallback(state);
            return;
        }
        if (!this.progressEl) {
            this.el.innerHTML = '';
            this.mount();
            return;
        }
        if (state === 'loading') {
            this.springValue?.snap(25);
        } else {
            this.setValue(this.options.value);
        }
    }

    /** Retourne la valeur actuelle */
    getValue(): number {
        return this.options.value;
    }

    private teardownInternals(): void {
        this.springValue?.cancel();
        this.springValue = null;
        this.resizeObserver?.disconnect();
        this.resizeObserver = null;
        this.svgEl = null;
        this.progressEl = null;
        this.valueDisplayEl = null;
        this.fractionEl = null;
        this.arcLabelEl = null;
        this.arcUnitEl = null;
    }

    override destroy(): void {
        if (this._destroying) return;
        this._destroying = true;
        this.teardownInternals();
        super.destroy();
    }
}
