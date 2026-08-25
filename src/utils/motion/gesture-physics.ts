/**
 * @fileoverview Physique de geste M3 Expressive (fling, rubber-band, projection)
 * @description Porté depuis le prototype sheets2 (Claude Cowork) pour Sheet / Drawer.
 * Au-delà de {@link FLING_THRESHOLD} px/s, le lancer l'emporte sur la position
 * et le ressort spatial passe de « default » à « fast ».
 */

/** Seuil de lancer (px/s) — token spatial « fast » au-delà. */
export const FLING_THRESHOLD = 500;

/** Part de la course à franchir pour fermer (sous la détente basse). */
export const DISMISS_RATIO = 0.5;

/**
 * Spécification ressort (stiffness / damping relatif) — intégration image par image.
 */
export interface SpringSpec {
    /** Raideur (k) */
    stiffness: number;
    /** Amortissement relatif (ζ) */
    damping: number;
}

/** Tokens spatiaux M3 Expressive (réf. md.sys.motion.spring.*). */
export const M3_SPRING = {
    fastSpatial: { stiffness: 800, damping: 0.6 } as SpringSpec,
    defaultSpatial: { stiffness: 380, damping: 0.8 } as SpringSpec,
    slowSpatial: { stiffness: 200, damping: 0.8 } as SpringSpec,
} as const;

/**
 * Choisit le token spatial selon la vitesse du geste.
 * @param velocityPxPerSec Vitesse en px/s
 */
export function springSpecForVelocity(velocityPxPerSec: number): SpringSpec {
    return Math.abs(velocityPxPerSec) > FLING_THRESHOLD
        ? M3_SPRING.fastSpatial
        : M3_SPRING.defaultSpatial;
}

/**
 * Suiture de vitesse sur une fenêtre glissante (défaut 100 ms).
 */
export class VelocityTracker {
    private readonly windowMs: number;
    private samples: Array<{ t: number; v: number }> = [];

    /**
     * @param windowMs Fenêtre d'échantillonnage en ms
     */
    constructor(windowMs = 100) {
        this.windowMs = windowMs;
    }

    /** Remet le tracker à zéro. */
    reset(): void {
        this.samples = [];
    }

    /**
     * Ajoute un échantillon de position.
     * @param position Position (px) sur l'axe suivi
     * @param time Horodatage (ms), défaut `performance.now()`
     */
    add(position: number, time: number = performance.now()): void {
        this.samples.push({ t: time, v: position });
        const cutoff = time - this.windowMs;
        while (this.samples.length > 2 && this.samples[0].t < cutoff) {
            this.samples.shift();
        }
    }

    /**
     * Vitesse estimée en px/s (0 si échantillons insuffisants).
     */
    get velocity(): number {
        if (this.samples.length < 2) return 0;
        const a = this.samples[0];
        const b = this.samples[this.samples.length - 1];
        const dt = (b.t - a.t) / 1000;
        return dt > 0 ? (b.v - a.v) / dt : 0;
    }
}

/**
 * Résistance élastique hors butée (iOS-like / M3 gesture).
 * @param overshoot Dépassement positif (px)
 * @param dimension Dimension de référence (px)
 * @param coefficient Coefficient (défaut 0.55)
 */
export function rubberBand(
    overshoot: number,
    dimension: number,
    coefficient = 0.55
): number {
    if (dimension <= 0 || overshoot <= 0) return 0;
    return (1 - 1 / ((overshoot * coefficient) / dimension + 1)) * dimension;
}

/**
 * Projette la position finale d'un lancer avec décélération.
 * @param position Position courante (px)
 * @param velocity Vitesse (px/s)
 * @param rate Facteur de décélération par ms (défaut 0.998)
 */
export function projectFling(
    position: number,
    velocity: number,
    rate = 0.998
): number {
    return position + (velocity / 1000) * (rate / (1 - rate));
}

/**
 * Borne une valeur entre min et max.
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

/**
 * Détente la plus proche d'une position donnée.
 * @param position Position courante
 * @param detentPositions Positions des détentes (même unité)
 * @returns Index de la détente la plus proche
 */
export function nearestDetentIndex(
    position: number,
    detentPositions: readonly number[]
): number {
    if (detentPositions.length === 0) return 0;
    let best = 0;
    let bestDist = Math.abs(detentPositions[0] - position);
    for (let i = 1; i < detentPositions.length; i++) {
        const dist = Math.abs(detentPositions[i] - position);
        if (dist < bestDist) {
            best = i;
            bestDist = dist;
        }
    }
    return best;
}

/**
 * Indique si un geste doit fermer (fling ou projection au-delà du seuil).
 * @param velocityPxPerSec Vitesse vers la fermeture (positive = ferme)
 * @param projected Position projetée
 * @param dismissBeyond Seuil de fermeture (position)
 */
export function shouldDismissByGesture(
    velocityPxPerSec: number,
    projected: number,
    dismissBeyond: number
): boolean {
    return velocityPxPerSec > FLING_THRESHOLD || projected > dismissBeyond;
}

/**
 * Anime une valeur avec un ressort (intégration Euler sous-échantillonnée).
 * Respecte `prefers-reduced-motion` si disponible.
 * @returns Fonction d'annulation
 */
export function animateSpring(options: {
    from: number;
    to: number;
    velocity?: number;
    spec?: SpringSpec;
    onUpdate: (value: number, velocity: number) => void;
    onComplete?: () => void;
}): () => void {
    const {
        from,
        to,
        velocity = 0,
        spec = M3_SPRING.defaultSpatial,
        onUpdate,
        onComplete,
    } = options;

    const reduced =
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
        onUpdate(to, 0);
        onComplete?.();
        return () => {};
    }

    const k = spec.stiffness;
    const c = 2 * spec.damping * Math.sqrt(k);
    let x = from;
    let v = velocity;
    let last = performance.now();
    let raf = 0;
    let cancelled = false;

    const step = (now: number): void => {
        if (cancelled) return;
        const frame = Math.min((now - last) / 1000, 1 / 30);
        last = now;
        const substeps = Math.max(1, Math.ceil(frame / (1 / 240)));
        const dt = frame / substeps;
        for (let i = 0; i < substeps; i++) {
            v += (-k * (x - to) - c * v) * dt;
            x += v * dt;
        }
        if (Math.abs(x - to) < 0.1 && Math.abs(v) < 1) {
            onUpdate(to, 0);
            onComplete?.();
            return;
        }
        onUpdate(x, v);
        raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => {
        cancelled = true;
        cancelAnimationFrame(raf);
    };
}
