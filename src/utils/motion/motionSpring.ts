/**
 * @fileoverview Lecture des springs M3 (--md-sys-motion-*) depuis le DOM
 * @description Durée + cubic-bezier actifs (schéma expressive/standard via data-motion-scheme)
 * @author K3UI Team
 */

export type MotionSpringCategory = 'spatial' | 'effects';
export type MotionSpringSpeed = 'fast' | 'default' | 'slow';

/** Valeurs spring résolues depuis les custom properties M3 */
export interface MotionSpringValues {
    /** Durée en millisecondes */
    durationMs: number;
    /** Valeur CSS easing, ex. cubic-bezier(0.39, 1.29, 0.35, 0.98) */
    easing: string;
}

/** Fallback expressive spatial-slow (motion.token.scss — lecture seule, miroir TS) */
export const MOTION_EXPRESSIVE_SPATIAL_SLOW_DURATION_MS = 650;
export const MOTION_EXPRESSIVE_SPATIAL_SLOW_EASING = 'cubic-bezier(0.39, 1.29, 0.35, 0.98)';

/** Fallback expressive spatial-default */
export const MOTION_EXPRESSIVE_SPATIAL_DEFAULT_DURATION_MS = 500;
export const MOTION_EXPRESSIVE_SPATIAL_DEFAULT_EASING = 'cubic-bezier(0.38, 1.21, 0.22, 1)';

const CUBIC_BEZIER_RE =
    /^cubic-bezier\s*\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)$/i;

/**
 * Parse une chaîne cubic-bezier CSS en tuple [x1, y1, x2, y2].
 */
export function parseCubicBezier(easing: string): [number, number, number, number] | null {
    const m = easing.trim().match(CUBIC_BEZIER_RE);
    if (!m) return null;
    return [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
}

/**
 * Évalue y pour x=t sur une courbe cubic-bezier (approximation Newton).
 */
export function cubicBezierEase(t: number, x1: number, y1: number, x2: number, y2: number): number {
    if (t <= 0) return 0;
    if (t >= 1) return 1;

    const sampleCurveX = (tt: number): number =>
        ((1 - 3 * x2 + 3 * x1) * tt + (3 * x2 - 6 * x1)) * tt * tt + 3 * x1 * tt;
    const sampleCurveY = (tt: number): number =>
        ((1 - 3 * y2 + 3 * y1) * tt + (3 * y2 - 6 * y1)) * tt * tt + 3 * y1 * tt;
    const sampleCurveDerivativeX = (tt: number): number =>
        (3 * (1 - 3 * x2 + 3 * x1) * tt + 2 * (3 * x2 - 6 * x1)) * tt + 3 * x1;

    let tGuess = t;
    for (let i = 0; i < 8; i++) {
        const x = sampleCurveX(tGuess) - t;
        const dx = sampleCurveDerivativeX(tGuess);
        if (Math.abs(x) < 1e-6 || Math.abs(dx) < 1e-6) break;
        tGuess -= x / dx;
    }
    return sampleCurveY(tGuess);
}

/**
 * Crée une fonction d'easing à partir d'une chaîne cubic-bezier CSS.
 */
export function createCubicBezierEasing(easing: string): (t: number) => number {
    const parsed = parseCubicBezier(easing);
    if (!parsed) return (t: number) => t;
    const [x1, y1, x2, y2] = parsed;
    return (t: number) => cubicBezierEase(t, x1, y1, x2, y2);
}

/**
 * Parse une durée CSS (ms ou s) en millisecondes.
 */
export function parseDurationMs(raw: string): number | null {
    const v = raw.trim();
    if (!v) return null;
    if (v.endsWith('ms')) {
        const n = parseFloat(v);
        return Number.isFinite(n) ? n : null;
    }
    if (v.endsWith('s')) {
        const n = parseFloat(v);
        return Number.isFinite(n) ? n * 1000 : null;
    }
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
}

/**
 * Lit les tokens spring actifs (--md-sys-motion-{spatial|effects}-{speed}-*).
 * @param contextEl Élément de contexte (fallback documentElement)
 */
export function readMotionSpring(
    category: MotionSpringCategory,
    speed: MotionSpringSpeed,
    contextEl?: HTMLElement | null
): MotionSpringValues {
    const root =
        contextEl ??
        (typeof document !== 'undefined' ? document.documentElement : null);

    const fallbackDuration =
        category === 'spatial' && speed === 'slow'
            ? MOTION_EXPRESSIVE_SPATIAL_SLOW_DURATION_MS
            : category === 'spatial' && speed === 'default'
              ? MOTION_EXPRESSIVE_SPATIAL_DEFAULT_DURATION_MS
              : MOTION_EXPRESSIVE_SPATIAL_SLOW_DURATION_MS;

    const fallbackEasing =
        category === 'spatial' && speed === 'slow'
            ? MOTION_EXPRESSIVE_SPATIAL_SLOW_EASING
            : category === 'spatial' && speed === 'default'
              ? MOTION_EXPRESSIVE_SPATIAL_DEFAULT_EASING
              : MOTION_EXPRESSIVE_SPATIAL_SLOW_EASING;

    if (!root || typeof getComputedStyle === 'undefined') {
        return { durationMs: fallbackDuration, easing: fallbackEasing };
    }

    const style = getComputedStyle(root);
    const durationRaw = style.getPropertyValue(`--md-sys-motion-${category}-${speed}-duration`).trim();
    const easingRaw = style.getPropertyValue(`--md-sys-motion-${category}-${speed}-easing`).trim();

    const durationMs = parseDurationMs(durationRaw) ?? fallbackDuration;
    const easing = easingRaw || fallbackEasing;

    return { durationMs, easing };
}
