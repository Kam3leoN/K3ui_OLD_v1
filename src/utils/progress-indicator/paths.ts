/**
 * @fileoverview Utilitaires de tracé SVG pour ProgressIndicator
 * @description Chemins sinusoïdaux MD3 Expressive (linear & circular) + indéterminé Material/M3E
 * @see https://m3.material.io/components/progress-indicators
 * @see https://github.com/matraic/m3e
 * @author K3UI Team
 */

import { ProgressIndicatorSpecs } from '../../specs/components/progress-indicator.specs';

/** Amplitude ramp MD3 — fade in/out aux extrémités (rampMin 0.1, rampMax 0.9) */
export function ampRamp(progress: number, rampMin = 0.1, rampMax = 0.9): number {
    if (progress < rampMin) return progress / rampMin;
    if (progress > rampMax) return (1 - progress) / (1 - rampMax);
    return 1;
}

/** Décalage Y sinusoïdal */
export function sineY(x: number, wavelength: number, amplitude: number, phase: number): number {
    return amplitude * Math.sin(((x + phase) / wavelength) * Math.PI * 2);
}

/** Chemin linéaire entre x0 et x1 avec onde sinusoïdale */
export function linearPath(
    x0: number,
    x1: number,
    midY: number,
    wavelength: number,
    amplitude: number,
    phase: number
): string {
    if (x1 - x0 < 0.3) return '';
    const pts: string[] = [];
    const step = 0.6;
    for (let x = x0; x <= x1 + 0.01; x += step) {
        const xx = Math.min(x, x1);
        pts.push(`${xx.toFixed(2)},${(midY + sineY(xx, wavelength, amplitude, phase)).toFixed(3)}`);
        if (xx >= x1) break;
    }
    return pts.length ? `M${pts.join('L')}` : '';
}

/** Chemin circulaire entre deux angles (degrés) avec onde radiale */
export function circularPath(
    degFrom: number,
    degTo: number,
    cx: number,
    cy: number,
    r: number,
    waves: number,
    amplitude: number,
    phase: number
): string {
    if (degTo - degFrom < 0.15) return '';
    const pts: string[] = [];
    const step = 0.6;
    for (let d = degFrom; d <= degTo + 0.01; d += step) {
        const dd = Math.min(d, degTo);
        const rad = ((dd - 90) * Math.PI) / 180;
        const w = amplitude * Math.sin(rad * waves + phase);
        pts.push(
            `${(cx + (r + w) * Math.cos(rad)).toFixed(2)},${(cy + (r + w) * Math.sin(rad)).toFixed(2)}`
        );
        if (dd >= degTo) break;
    }
    return pts.length ? `M${pts.join('L')}` : '';
}

/** Easing quadratique MD3 indéterminé */
export function easeInOutQuad(x: number): number {
    return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

/** Smoothstep hermite (M3E wavy indeterminate grow/shrink) */
export function smoothstep(p: number): number {
    const t = Math.max(0, Math.min(1, p));
    return t * t * (3 - 2 * t);
}

/** Easing Material standard-accelerate — cubic-bezier(0.4, 0, 0.2, 1) approx */
export function materialStandardEasing(t: number): number {
    const p = Math.max(0, Math.min(1, t));
    return easeInOutQuad(p);
}

/** Normalise une valeur dans l'intervalle min–max → ratio 0–1 */
export function toRatio(value: number, min: number, max: number): number {
    if (max <= min) return 0;
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/**
 * Demi-écart le long du chemin (px) entre indicateur et piste.
 * MD3 `gapSize` = espace visible entre les bords des caps ronds ;
 * séparation des extrémités de chemin = gapDp + strokeWidth.
 */
export function computePathHalfGap(strokeWidth: number, wavy = false): number {
    const total = ProgressIndicatorSpecs.gapDp + strokeWidth;
    const wavyBoost = wavy ? 1.12 : 1;
    return (total / 2) * wavyBoost;
}

/**
 * Demi-écart angulaire (degrés) pour progress circulaire déterminé.
 */
export function computeGapHalfDegrees(
    strokeWidth: number,
    radius: number,
    wavy = false,
    amplitude = 0
): number {
    const effectiveRadius = Math.max(1, radius + (wavy ? amplitude * 0.35 : 0));
    const halfArc = computePathHalfGap(strokeWidth, wavy);
    return (halfArc / (2 * Math.PI * effectiveRadius)) * 360;
}

/**
 * Indique si le gap déterminé doit être dessiné (indicateur + piste coexistent).
 */
export function shouldDrawGap(progress: number, indeterminate = false): boolean {
    if (indeterminate) return false;
    return progress > 0.01 && progress < 0.99;
}

/**
 * Écart normalisé (0–1) le long d'une barre linéaire pour séparer indicateur et piste.
 */
export function computeLinearGapFraction(strokeWidth: number, viewBoxWidth: number, wavy = false): number {
    const adjustedGap = ProgressIndicatorSpecs.gapDp + strokeWidth;
    const wavyBoost = wavy ? 1.12 : 1;
    return (adjustedGap * wavyBoost) / viewBoxWidth;
}

/**
 * Soustrait [cutStart, cutEnd] d'une liste d'intervalles normalisés [0–1].
 */
export function subtractRanges(
    ranges: Array<[number, number]>,
    cutStart: number,
    cutEnd: number
): Array<[number, number]> {
    const result: Array<[number, number]> = [];
    for (const [a, b] of ranges) {
        if (cutEnd <= a || cutStart >= b) {
            result.push([a, b]);
            continue;
        }
        if (cutStart > a) result.push([a, cutStart]);
        if (cutEnd < b) result.push([cutEnd, b]);
    }
    return result.filter(([a, b]) => b - a > 0.003);
}

export interface LinearIndeterminateSegment {
    /** Position queue (0–1, peut être < 0 ou > 1 hors viewport) */
    tail: number;
    /** Position tête (0–1) */
    head: number;
}

/**
 * Keyframes Material / M3E pour un segment indéterminé linéaire.
 * left% + width% → [tail, head] en fraction de la largeur.
 * @see M3E LinearProgressIndicatorElement indeterminate-primary / secondary
 */
const LINEAR_INDETERMINATE_KEYS: Array<{ t: number; left: number; width: number }> = [
    { t: 0, left: -1.45167, width: 0.08 },
    { t: 0.2, left: -1.13333, width: 0.48 },
    { t: 0.6, left: 0.56333, width: 0.78 },
    { t: 1, left: 1.0, width: 0.08 },
];

function lerpKey(
    keys: Array<{ t: number; left: number; width: number }>,
    cycle: number
): { left: number; width: number } {
    const c = ((cycle % 1) + 1) % 1;
    for (let i = 0; i < keys.length - 1; i++) {
        const a = keys[i];
        const b = keys[i + 1];
        if (c >= a.t && c <= b.t) {
            const u = (c - a.t) / (b.t - a.t);
            const e = materialStandardEasing(u);
            return {
                left: a.left + (b.left - a.left) * e,
                width: a.width + (b.width - a.width) * e,
            };
        }
    }
    const last = keys[keys.length - 1];
    return { left: last.left, width: last.width };
}

/**
 * Segments indéterminés linéaires (primary + secondary) — timing Material 2.1s / delay 1.15s.
 */
export function computeLinearIndeterminateSegments(
    tSeconds: number,
    cycle = ProgressIndicatorSpecs.linearIndeterminateCycle,
    secondaryDelay = ProgressIndicatorSpecs.linearIndeterminateSecondaryDelay
): LinearIndeterminateSegment[] {
    const primaryCycle = (tSeconds / cycle) % 1;
    const secondaryCycle = ((tSeconds - secondaryDelay) / cycle) % 1;
    const segments: LinearIndeterminateSegment[] = [];

    for (const cyclePos of [primaryCycle, secondaryCycle]) {
        if (cyclePos < 0) continue;
        const { left, width } = lerpKey(LINEAR_INDETERMINATE_KEYS, cyclePos);
        const tail = left;
        const head = left + width;
        if (head > 0 && tail < 1 && head - tail > 0.005) {
            segments.push({
                tail: Math.max(0, Math.min(1, tail)),
                head: Math.max(0, Math.min(1, head)),
            });
        }
    }
    return segments;
}

/**
 * Balayage wavy indéterminé circulaire — cycle hold/grow/hold/shrink M3E.
 */
export function computeCircularWavyIndeterminateSweep(
    tSeconds: number,
    minSweep = ProgressIndicatorSpecs.circularWavyIndeterminateMinSweep,
    maxSweep = ProgressIndicatorSpecs.circularWavyIndeterminateMaxSweep,
    phase = ProgressIndicatorSpecs.circularWavyIndeterminatePhase
): number {
    const cycle = phase * 4;
    const u = ((tSeconds % cycle) + cycle) % cycle;
    if (u < phase) return minSweep;
    if (u < phase * 2) {
        const p = (u - phase) / phase;
        return minSweep + (maxSweep - minSweep) * smoothstep(p);
    }
    if (u < phase * 3) return maxSweep;
    const p = (u - phase * 3) / phase;
    return maxSweep - (maxSweep - minSweep) * smoothstep(p);
}

/**
 * Balayage flat indéterminé circulaire — pulsation sinusoïdale Material (grow/shrink).
 */
export function computeCircularFlatIndeterminateSweep(
    tSeconds: number,
    minSweep = ProgressIndicatorSpecs.circularIndeterminateMinSweep,
    maxSweep = ProgressIndicatorSpecs.circularIndeterminateMaxSweep,
    cycle = ProgressIndicatorSpecs.circularIndeterminateProgressCycle
): number {
    const sweepT = (Math.sin((tSeconds * (2 * Math.PI)) / cycle) + 1) / 2;
    return minSweep + (maxSweep - minSweep) * materialStandardEasing(sweepT);
}

/**
 * Format pourcentage entier pour label circulaire (défaut M3E-like).
 */
export function formatProgressPercent(ratio: number): string {
    return `${Math.round(Math.max(0, Math.min(1, ratio)) * 100)}`;
}
