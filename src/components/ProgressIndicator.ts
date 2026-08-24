/**
 * @fileoverview Composant ProgressIndicator pour K3UI
 * @description Indicateurs de progression Material Design 3 Expressive — linear & circular, wavy
 * @see https://m3.material.io/components/progress-indicators
 * @see https://github.com/matraic/m3e
 * @see https://github.com/material-components/material-components-android
 * @author K3UI Team
 * @version 1.1.0
 */

import { Component } from '../core/base/Component';
import { toComponentClassDef } from '../types/components/component-base';
import type { ProgressIndicatorOptions, ProgressIndicatorPalette } from '../types/components';
import { PriorityLevel, InitElements } from '../types/base';
import { setAriaAttributes } from '../utils/dom/aria';
import { getPreferReducedMotion } from '../utils/accessibility';
import {
    getProgressIndicatorDefaults,
    ProgressIndicatorSpecs,
} from '../specs/components/progress-indicator.specs';
import {
    ampRamp,
    circularPath,
    computeCircularFlatIndeterminateSweep,
    computeCircularWavyIndeterminateSweep,
    computeGapHalfDegrees,
    computeLinearGapFraction,
    computeLinearIndeterminateSegments,
    computePathHalfGap,
    formatProgressPercent,
    linearPath,
    shouldDrawGap,
    subtractRanges,
    toRatio,
} from '../utils/progress-indicator/paths';

const _defaults: ProgressIndicatorOptions = getProgressIndicatorDefaults();

const PALETTE_VARS: Record<ProgressIndicatorPalette, { color: string; track: string }> = {
    primary: {
        color: 'var(--md-sys-color-primary)',
        track: 'var(--md-sys-color-primary-container)',
    },
    secondary: {
        color: 'var(--md-sys-color-secondary)',
        track: 'var(--md-sys-color-secondary-container)',
    },
    tertiary: {
        color: 'var(--md-sys-color-tertiary)',
        track: 'var(--md-sys-color-tertiary-container)',
    },
    error: {
        color: 'var(--md-sys-color-error)',
        track: 'var(--md-sys-color-error-container)',
    },
};

const SVG_NS = 'http://www.w3.org/2000/svg';

function readDataOptions(el: HTMLElement): Partial<ProgressIndicatorOptions> {
    const o: Partial<ProgressIndicatorOptions> = {};
    const str = (attr: string): string | null => el.getAttribute(attr);

    const variant = str('data-variant');
    if (variant === 'linear' || variant === 'circular') o.variant = variant;

    const num = (attr: string): number | null => {
        const v = str(attr);
        if (v === null) return null;
        const n = parseFloat(v);
        return Number.isNaN(n) ? null : n;
    };

    const value = num('data-value');
    if (value !== null) o.value = value;
    const min = num('data-min');
    if (min !== null) o.min = min;
    const max = num('data-max');
    if (max !== null) o.max = max;
    const size = num('data-size');
    if (size !== null) o.size = size;
    const stopSize = num('data-stop-size');
    if (stopSize !== null) o.stopSize = stopSize;

    if (el.dataset.indeterminate != null) o.indeterminate = el.dataset.indeterminate === 'true';
    if (el.dataset.wavy != null) o.wavy = el.dataset.wavy !== 'false';
    if (el.dataset.thick != null) o.thick = el.dataset.thick === 'true';
    if (el.dataset.stopIndicator != null) o.stopIndicator = el.dataset.stopIndicator !== 'false';
    if (el.dataset.showValue != null) o.showValue = el.dataset.showValue === 'true';

    const palette = str('data-palette');
    if (palette === 'primary' || palette === 'secondary' || palette === 'tertiary' || palette === 'error') {
        o.palette = palette;
    }

    const color = str('data-color');
    if (color !== null) o.color = color;
    const trackColor = str('data-track-color');
    if (trackColor !== null) o.trackColor = trackColor;
    const label = str('data-label');
    if (label !== null) o.label = label;

    return o;
}

/**
 * Indicateur de progression MD3 Expressive — linear & circular.
 */
export class ProgressIndicator extends Component<ProgressIndicatorOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    private svgEl: SVGSVGElement | null = null;
    private rotateWrapper: HTMLElement | null = null;
    private valueLabelEl: HTMLElement | null = null;
    private pathPool: SVGPathElement[] = [];
    private stopCircleEl: SVGCircleElement | null = null;
    private rafId: number | null = null;
    private animStartMs = 0;
    private _destroying = false;
    private displayRatio = 0;
    private targetRatio = 0;
    private valueAnimStartMs = 0;
    private valueAnimFrom = 0;
    private valueAnimating = false;
    private readonly reducedMotion: boolean;

    static get defaults(): ProgressIndicatorOptions {
        return { ..._defaults };
    }

    static getInstance(el: HTMLElement): ProgressIndicator | undefined {
        return Component.getInstance(el) as ProgressIndicator | undefined;
    }

    static init(
        els: HTMLElement | InitElements<HTMLElement> | string,
        options: Partial<ProgressIndicatorOptions> = {}
    ): ProgressIndicator | ProgressIndicator[] {
        const resolved: HTMLElement | InitElements<HTMLElement> =
            typeof els === 'string' ? document.querySelectorAll<HTMLElement>(els) : els;
        return Component.init(resolved, options, toComponentClassDef(ProgressIndicator)) as
            | ProgressIndicator
            | ProgressIndicator[];
    }

    constructor(el: HTMLElement, options: Partial<ProgressIndicatorOptions> = {}) {
        super(el, options, toComponentClassDef(ProgressIndicator));

        this.reducedMotion = getPreferReducedMotion();

        const dataOptions = readDataOptions(el);
        this.options = {
            ..._defaults,
            ...options,
            ...dataOptions,
        };

        this.targetRatio = toRatio(this.options.value, this.options.min, this.options.max);
        this.displayRatio = this.targetRatio;

        this.applyHostClasses();
        this.mount();
        this.updateAria();
        this.startAnimation();
    }

    /**
     * Met à jour plusieurs options et rafraîchit le rendu.
     * @param options - Options partielles à fusionner
     */
    configure(options: Partial<ProgressIndicatorOptions>): this {
        const prev = { ...this.options };
        this.options = { ...this.options, ...options };
        this.applyHostClasses();
        const needsRemount =
            prev.variant !== this.options.variant ||
            prev.thick !== this.options.thick ||
            prev.size !== this.options.size ||
            prev.showValue !== this.options.showValue;
        const wavyChanged = prev.wavy !== this.options.wavy;
        if (needsRemount) {
            this.mount();
        }
        if (options.value !== undefined && !this.options.indeterminate) {
            this.setTargetRatio(toRatio(this.options.value, this.options.min, this.options.max), true);
        }
        this.updateAria();
        if (this.options.indeterminate || wavyChanged || needsRemount) {
            this.restartAnimation();
        } else if (!this.valueAnimating) {
            this.renderFrame(0);
        }
        return this;
    }

    /**
     * Met à jour la valeur de progression (0–max) avec transition MD3.
     * @param value - Nouvelle valeur
     */
    update(value: number): this {
        const { min, max } = this.options;
        this.options.value = Math.max(min, Math.min(max, value));
        this.updateAria();
        this.options.onChange?.(this.options.value, this);
        if (!this.options.indeterminate) {
            this.setTargetRatio(toRatio(this.options.value, min, max), !this.reducedMotion);
        }
        return this;
    }

    /**
     * Active ou désactive le mode indéterminé.
     * @param indeterminate - true pour animation continue
     */
    setIndeterminate(indeterminate: boolean): this {
        this.options.indeterminate = indeterminate;
        this.applyHostClasses();
        this.updateAria();
        if (!indeterminate) {
            this.displayRatio = toRatio(this.options.value, this.options.min, this.options.max);
            this.targetRatio = this.displayRatio;
            this.valueAnimating = false;
        }
        this.restartAnimation();
        return this;
    }

    /**
     * Affiche ou masque le label de valeur circulaire.
     * @param show - true pour afficher
     */
    setShowValue(show: boolean): this {
        return this.configure({ showValue: show });
    }

    /**
     * Active ou désactive le stop indicator linéaire.
     * @param enabled - true pour afficher le point d’arrêt
     */
    setStopIndicator(enabled: boolean): this {
        this.options.stopIndicator = enabled;
        const t =
            this.animStartMs > 0 ? (performance.now() - this.animStartMs) / 1000 : 0;
        this.renderFrame(t);
        return this;
    }

    /**
     * Anime la progression de min à max sur la durée donnée.
     * @param durationMs - Durée en millisecondes (défaut 2800)
     */
    replay(durationMs = 2800): this {
        if (this.options.indeterminate) return this;
        this.stopAnimation();
        const { min, max } = this.options;
        this.options.value = min;
        this.displayRatio = 0;
        this.targetRatio = 0;
        this.valueAnimating = false;
        this.updateAria();
        const start = performance.now();

        const tick = (now: number): void => {
            if (this._destroying) return;
            const p = Math.min(1, (now - start) / durationMs);
            const next = min + (max - min) * p;
            this.options.value = next;
            this.displayRatio = p;
            this.targetRatio = p;
            this.updateAria();
            this.options.onChange?.(next, this);
            this.renderFrame(0);
            if (p < 1) {
                this.rafId = requestAnimationFrame(tick);
            } else {
                this.rafId = null;
                this.startAnimation();
            }
        };

        this.rafId = requestAnimationFrame(tick);
        return this;
    }

    /**
     * Retourne la valeur actuelle.
     */
    getValue(): number {
        return this.options.value;
    }

    override destroy(): void {
        if (this._destroying) return;
        this._destroying = true;
        this.stopAnimation();
        this.svgEl = null;
        this.rotateWrapper = null;
        this.valueLabelEl = null;
        this.pathPool = [];
        this.stopCircleEl = null;
        super.destroy();
    }

    private setTargetRatio(ratio: number, animate: boolean): void {
        this.targetRatio = ratio;
        if (!animate || Math.abs(ratio - this.displayRatio) < 0.001) {
            this.displayRatio = ratio;
            this.valueAnimating = false;
            this.ensureLoop();
            this.renderFrame(0);
            return;
        }
        this.valueAnimFrom = this.displayRatio;
        this.valueAnimStartMs = performance.now();
        this.valueAnimating = true;
        this.ensureLoop();
    }

    private ensureLoop(): void {
        const needsAnim =
            !this.reducedMotion &&
            (this.options.indeterminate ||
                this.valueAnimating ||
                (this.options.wavy && !this.options.indeterminate));
        if (needsAnim && this.rafId === null) {
            this.startAnimation();
        } else if (!needsAnim && this.rafId !== null && !this.options.indeterminate) {
            this.stopAnimation();
            this.renderFrame(0);
        }
    }

    private applyHostClasses(): void {
        const { variant, wavy, thick, indeterminate, palette, showValue } = this.options;
        const el = this.el;
        el.classList.add('progress-indicator');
        el.classList.toggle('progress-indicator--linear', variant === 'linear');
        el.classList.toggle('progress-indicator--circular', variant === 'circular');
        el.classList.toggle('progress-indicator--wavy', wavy);
        el.classList.toggle('progress-indicator--flat', !wavy);
        el.classList.toggle('progress-indicator--thick', thick);
        el.classList.toggle('progress-indicator--standard', !thick);
        el.classList.toggle('progress-indicator--indeterminate', indeterminate);
        el.classList.toggle('progress-indicator--determinate', !indeterminate);
        el.classList.toggle('progress-indicator--show-value', showValue && variant === 'circular');
        for (const p of ['primary', 'secondary', 'tertiary', 'error'] as const) {
            el.classList.toggle(`progress-indicator--${p}`, palette === p);
        }
    }

    private resolveColors(): { color: string; track: string } {
        const { palette, color, trackColor } = this.options;
        const vars = PALETTE_VARS[palette];
        return {
            color: color ?? vars.color,
            track: trackColor ?? vars.track,
        };
    }

    private mount(): void {
        this.el.innerHTML = '';
        this.pathPool = [];
        this.stopCircleEl = null;
        this.valueLabelEl = null;
        this.rotateWrapper = null;

        const { variant, showValue } = this.options;

        if (variant === 'circular') {
            this.rotateWrapper = document.createElement('div');
            this.rotateWrapper.className = 'progress-indicator__rotate';
            this.svgEl = this.createSvg();
            this.rotateWrapper.appendChild(this.svgEl);
            this.el.appendChild(this.rotateWrapper);

            if (showValue) {
                this.valueLabelEl = document.createElement('span');
                this.valueLabelEl.className = 'progress-indicator__value';
                this.valueLabelEl.setAttribute('aria-hidden', 'true');
                this.el.appendChild(this.valueLabelEl);
            }
        } else {
            this.svgEl = this.createSvg();
            this.el.appendChild(this.svgEl);
        }

        this.renderFrame(0);
    }

    private createSvg(): SVGSVGElement {
        const svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('class', 'progress-indicator__svg');
        svg.setAttribute('role', 'presentation');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('preserveAspectRatio', 'none');
        return svg as SVGSVGElement;
    }

    private ensurePath(index: number): SVGPathElement {
        let path = this.pathPool[index];
        if (!path) {
            path = document.createElementNS(SVG_NS, 'path') as SVGPathElement;
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke-linecap', 'round');
            this.pathPool[index] = path;
            this.svgEl?.appendChild(path);
        }
        return path;
    }

    private ensureStopCircle(): SVGCircleElement {
        if (!this.stopCircleEl) {
            this.stopCircleEl = document.createElementNS(SVG_NS, 'circle') as SVGCircleElement;
            this.stopCircleEl.setAttribute('class', 'progress-indicator__stop');
            this.svgEl?.appendChild(this.stopCircleEl);
        }
        return this.stopCircleEl;
    }

    private trimPaths(used: number): void {
        while (this.pathPool.length > used) {
            const path = this.pathPool.pop();
            path?.remove();
        }
    }

    private hideStop(): void {
        if (this.stopCircleEl) {
            this.stopCircleEl.setAttribute('visibility', 'hidden');
        }
    }

    private updateAria(): void {
        const { indeterminate, min, max, value, label } = this.options;
        const attrs: Record<string, string | number | null | undefined> = {
            'aria-valuemin': min,
            'aria-valuemax': max,
            role: 'progressbar',
        };
        if (!indeterminate) {
            attrs['aria-valuenow'] = value;
        } else {
            attrs['aria-valuenow'] = null;
        }
        if (label) {
            attrs['aria-label'] = label;
        }
        setAriaAttributes(this.el, attrs);
        if (!this.el.hasAttribute('role')) {
            this.el.setAttribute('role', 'progressbar');
        }
    }

    private startAnimation(): void {
        this.stopAnimation();
        const needsAnim =
            !this.reducedMotion &&
            (this.options.indeterminate ||
                this.valueAnimating ||
                (this.options.wavy && !this.options.indeterminate));
        if (!needsAnim) {
            this.renderFrame(0);
            return;
        }
        this.animStartMs = performance.now();
        const loop = (now: number): void => {
            if (this._destroying) return;
            if (this.valueAnimating) {
                this.tickValueTransition(now);
            }
            const t = (now - this.animStartMs) / 1000;
            this.renderFrame(t);
            const stillNeeds =
                this.options.indeterminate ||
                this.valueAnimating ||
                (this.options.wavy && !this.options.indeterminate && !this.reducedMotion);
            if (stillNeeds) {
                this.rafId = requestAnimationFrame(loop);
            } else {
                this.rafId = null;
            }
        };
        this.rafId = requestAnimationFrame(loop);
    }

    private tickValueTransition(now: number): void {
        const duration = ProgressIndicatorSpecs.valueTransitionMs;
        const p = Math.min(1, (now - this.valueAnimStartMs) / duration);
        // Material decelerate: cubic-bezier(0, 0, 0.2, 1) approx
        const eased = 1 - Math.pow(1 - p, 3);
        this.displayRatio = this.valueAnimFrom + (this.targetRatio - this.valueAnimFrom) * eased;
        if (p >= 1) {
            this.displayRatio = this.targetRatio;
            this.valueAnimating = false;
        }
    }

    private restartAnimation(): void {
        this.stopAnimation();
        this.startAnimation();
    }

    private stopAnimation(): void {
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    private renderFrame(t: number): void {
        if (!this.svgEl) return;
        if (this.options.variant === 'circular') {
            this.renderCircular(t);
        } else {
            this.renderLinear(t);
        }
        this.updateValueLabel();
    }

    private updateValueLabel(): void {
        if (!this.valueLabelEl) return;
        if (this.options.indeterminate || this.options.variant !== 'circular' || !this.options.showValue) {
            this.valueLabelEl.hidden = true;
            return;
        }
        this.valueLabelEl.hidden = false;
        const { min, max, value, valueFormat } = this.options;
        const ratio = this.displayRatio;
        this.valueLabelEl.textContent = valueFormat
            ? valueFormat(ratio, value, min, max)
            : formatProgressPercent(ratio);
    }

    private applyPath(
        index: number,
        d: string,
        stroke: string,
        strokeWidth: number,
        opacity = 1
    ): number {
        if (!d) return index;
        const path = this.ensurePath(index);
        path.setAttribute('d', d);
        path.setAttribute('stroke', stroke);
        path.setAttribute('stroke-width', String(strokeWidth));
        path.setAttribute('opacity', String(opacity));
        path.setAttribute('visibility', 'visible');
        return index + 1;
    }

    private renderLinear(t: number): void {
        const svg = this.svgEl!;
        const { wavy, thick, indeterminate, stopIndicator, stopSize } = this.options;
        const colors = this.resolveColors();
        const h = thick
            ? ProgressIndicatorSpecs.trackHeightThick
            : ProgressIndicatorSpecs.trackHeightStandard;
        const waveContainer = thick
            ? ProgressIndicatorSpecs.linearWaveHeightThick
            : ProgressIndicatorSpecs.linearWaveHeightStandard;
        const baseAmp =
            wavy && !this.reducedMotion
                ? thick
                    ? (waveContainer - h) / 2
                    : ProgressIndicatorSpecs.linearWaveAmplitudeStandard
                : 0;
        const wl = thick
            ? ProgressIndicatorSpecs.linearWavelengthThick
            : ProgressIndicatorSpecs.linearWavelengthStandard;
        const W = ProgressIndicatorSpecs.linearViewBoxWidth;
        const isWavy = wavy && !this.reducedMotion;
        const v = this.displayRatio;
        const gapFrac = computeLinearGapFraction(h, W, isWavy);
        const halfGap = shouldDrawGap(v, indeterminate) ? computePathHalfGap(h, isWavy) : 0;
        const totalH = isWavy ? waveContainer : h;
        const midY = totalH / 2;
        const trackSw = ProgressIndicatorSpecs.trackHeightStandard;
        const ph = isWavy ? -t * wl * ProgressIndicatorSpecs.waveSpeedPerSecond : 0;
        const amp = baseAmp * (indeterminate ? 1 : ampRamp(v));
        const resolvedStopSize = stopSize > 0 ? stopSize : ProgressIndicatorSpecs.stopIndicatorSize;

        svg.setAttribute('viewBox', `0 0 ${W} ${totalH}`);
        svg.style.height = `${totalH}px`;
        svg.style.width = '100%';
        svg.style.display = 'block';
        svg.style.overflow = 'visible';

        const mkIndicator = (from: number, to: number, waveAmp?: number): string =>
            linearPath(from * W, to * W, midY, wl, isWavy ? (waveAmp ?? amp) : 0, ph);

        const mkTrack = (from: number, to: number): string =>
            linearPath(from * W, to * W, midY, wl, 0, 0);

        let pathIdx = 0;

        if (indeterminate) {
            this.hideStop();
            const indicators = computeLinearIndeterminateSegments(t);
            let trackRanges: Array<[number, number]> = [[0, 1]];
            for (const seg of indicators) {
                trackRanges = subtractRanges(
                    trackRanges,
                    Math.max(0, seg.tail - gapFrac),
                    Math.min(1, seg.head + gapFrac)
                );
            }
            for (const [from, to] of trackRanges) {
                pathIdx = this.applyPath(pathIdx, mkTrack(from, to), colors.track, trackSw);
            }
            for (const seg of indicators) {
                pathIdx = this.applyPath(
                    pathIdx,
                    mkIndicator(seg.tail, seg.head, baseAmp),
                    colors.color,
                    h
                );
            }
        } else if (v <= 0.005) {
            pathIdx = this.applyPath(pathIdx, mkTrack(0, 1), colors.track, trackSw);
            this.drawStop(W, midY, resolvedStopSize, colors.color, stopIndicator && resolvedStopSize > 0);
        } else if (v >= 0.995) {
            pathIdx = this.applyPath(pathIdx, mkIndicator(0, 1), colors.color, h);
            this.hideStop();
        } else {
            // Anatomy MD3 : active | gap | track | stop (Compose / M3E)
            const stopReserve =
                stopIndicator && resolvedStopSize > 0
                    ? (resolvedStopSize + ProgressIndicatorSpecs.gapDp * 0.5) / W
                    : 0;
            const trackFrom = Math.min(1, v + halfGap / W);
            const trackTo = Math.max(trackFrom, 1 - stopReserve);
            if (trackTo - trackFrom > 0.002) {
                pathIdx = this.applyPath(
                    pathIdx,
                    mkTrack(trackFrom, trackTo),
                    colors.track,
                    trackSw
                );
            }
            pathIdx = this.applyPath(
                pathIdx,
                mkIndicator(0, Math.max(0.01, v - halfGap / W)),
                colors.color,
                h
            );
            this.drawStop(
                W,
                midY,
                resolvedStopSize,
                colors.color,
                stopIndicator && resolvedStopSize > 0
            );
        }

        this.trimPaths(pathIdx);
    }

    private drawStop(
        viewWidth: number,
        midY: number,
        size: number,
        color: string,
        visible: boolean
    ): void {
        if (!visible || size <= 0) {
            this.hideStop();
            return;
        }
        const circle = this.ensureStopCircle();
        const r = size / 2;
        circle.setAttribute('cx', String(viewWidth - r));
        circle.setAttribute('cy', String(midY));
        circle.setAttribute('r', String(r));
        circle.setAttribute('fill', color);
        circle.setAttribute('visibility', 'visible');
        // Toujours au-dessus des paths (anatomy MD3 : stop en fin de piste)
        this.svgEl?.appendChild(circle);
    }

    private renderCircular(t: number): void {
        const svg = this.svgEl!;
        const { wavy, thick, indeterminate, size } = this.options;
        const colors = this.resolveColors();
        const sw = thick
            ? ProgressIndicatorSpecs.trackHeightThick
            : ProgressIndicatorSpecs.trackHeightStandard;
        const base =
            size ||
            (thick ? ProgressIndicatorSpecs.circularSizeThick : ProgressIndicatorSpecs.circularSizeDefault);
        const circumference = Math.PI * (base - sw);
        const waveN =
            wavy && !this.reducedMotion
                ? Math.max(4, circumference / ProgressIndicatorSpecs.circularWavelength)
                : 0;
        const baseAmp =
            wavy && !this.reducedMotion
                ? thick
                    ? ProgressIndicatorSpecs.circularWaveAmplitudeThick
                    : ProgressIndicatorSpecs.circularWaveAmplitudeStandard
                : 0;
        const pad = wavy && !this.reducedMotion ? baseAmp + 2 : 0;
        const S = base + pad * 2;
        const cx = S / 2;
        const cy = S / 2;
        const r = (base - sw) / 2;
        const v = this.displayRatio;
        const isWavy = wavy && !this.reducedMotion;
        const wPh = isWavy ? t * 5 : 0;
        const trackSw = ProgressIndicatorSpecs.trackHeightStandard;
        const gapHalfDeg =
            indeterminate || shouldDrawGap(v) ? computeGapHalfDegrees(sw, r, isWavy, baseAmp) : 0;
        const amp = baseAmp * (indeterminate ? 1 : ampRamp(v));

        svg.setAttribute('viewBox', `0 0 ${S} ${S}`);
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        svg.style.width = `${S}px`;
        svg.style.height = `${S}px`;
        svg.style.display = 'block';

        this.hideStop();

        if (this.rotateWrapper) {
            if (indeterminate && !this.reducedMotion) {
                if (isWavy) {
                    // M3E wavy-spin : accélération initiale puis tour complet
                    const cycle = ProgressIndicatorSpecs.circularWavyIndeterminatePhase * 4;
                    const u = (t % cycle) / cycle;
                    let rot: number;
                    if (u < 0.1) {
                        rot = (u / 0.1) * 90;
                    } else {
                        rot = 90 + ((u - 0.1) / 0.9) * 270;
                    }
                    this.rotateWrapper.style.transform = `rotate(${rot}deg)`;
                } else {
                    const rot = (t * ProgressIndicatorSpecs.circularIndeterminateRotation) % 360;
                    this.rotateWrapper.style.transform = `rotate(${rot}deg)`;
                }
                this.rotateWrapper.style.willChange = 'transform';
            } else {
                this.rotateWrapper.style.transform = '';
                this.rotateWrapper.style.willChange = 'auto';
            }
        }

        const mkIndicator = (s: number, e: number, waveAmp?: number): string =>
            circularPath(s, e, cx, cy, r, waveN, waveAmp ?? amp, wPh);

        const mkTrack = (s: number, e: number): string => circularPath(s, e, cx, cy, r, 0, 0, 0);

        let pathIdx = 0;

        if (indeterminate) {
            const sweep = isWavy
                ? computeCircularWavyIndeterminateSweep(t)
                : computeCircularFlatIndeterminateSweep(t);
            const gapSweep = gapHalfDeg * 2;
            const gapAtJunction = Math.min(sweep, gapSweep);
            const trackFrom = sweep + gapAtJunction;
            const trackTo = 360 - gapAtJunction;

            if (trackTo - trackFrom > 0.15) {
                pathIdx = this.applyPath(pathIdx, mkTrack(trackFrom, trackTo), colors.track, trackSw);
            }
            pathIdx = this.applyPath(pathIdx, mkIndicator(0, sweep, baseAmp), colors.color, sw);
        } else if (v <= 0.005) {
            pathIdx = this.applyPath(pathIdx, mkTrack(0, 360), colors.track, trackSw);
        } else if (v >= 0.995) {
            pathIdx = this.applyPath(pathIdx, mkIndicator(0, 360), colors.color, sw);
        } else {
            const junction = v * 360;
            pathIdx = this.applyPath(
                pathIdx,
                mkTrack(junction + gapHalfDeg, 360 - gapHalfDeg),
                colors.track,
                trackSw
            );
            pathIdx = this.applyPath(
                pathIdx,
                mkIndicator(gapHalfDeg, junction - gapHalfDeg),
                colors.color,
                sw
            );
        }

        this.trimPaths(pathIdx);
    }
}
