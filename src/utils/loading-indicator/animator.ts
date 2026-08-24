/**
 * @fileoverview Moteur d'animation M3 LoadingIndicator (double rotation + morph spring)
 * @description Constant rotation + extra rotation par transition, easing via tokens motion
 * @author K3UI Team
 */

import { createCubicBezierEasing } from '../motion/motionSpring';
import {
    LOADING_INDICATOR_CONSTANT_ROTATION_DEG,
    LOADING_INDICATOR_EXTRA_ROTATION_DEG,
    getLoaderMotionTiming,
    type LoaderMotionTiming,
} from '../../specs/components/loader.specs';

export interface MorphAnimationState {
    /** Index shape source (0..n-1) */
    indexA: number;
    /** Index shape cible */
    indexB: number;
    /** Progression morph 0..1 (spring-eased) */
    morphT: number;
    /** Rotation totale en degrés */
    rotationDeg: number;
    /** Temps global normalisé 0..1 dans le cycle */
    cycleProgress: number;
}

export interface MorphAnimatorOptions {
    shapeCount: number;
    timing?: LoaderMotionTiming;
    contextEl?: HTMLElement | null;
    /** Progress déterminé 0..1 (null = boucle temporelle) */
    progress?: number | null;
    /** Arrêt animation (garde l'état courant) */
    paused?: boolean;
    /** Mode reduced-motion : shape statique index 0 */
    reducedMotion?: boolean;
}

/**
 * Calcule l'état morph + rotation à un instant donné.
 * @param elapsedMs Temps écoulé depuis le début (ignoré si progress fourni)
 */
export function computeMorphAnimationState(
    elapsedMs: number,
    options: MorphAnimatorOptions
): MorphAnimationState {
    const {
        shapeCount,
        contextEl,
        progress = null,
        paused = false,
        reducedMotion = false,
    } = options;

    const n = Math.max(2, shapeCount);
    const timing = options.timing ?? getLoaderMotionTiming(contextEl);
    const { durationPerShapeMs, cycleDurationMs, morphEasing } = timing;
    const ease = createCubicBezierEasing(morphEasing);

    if (reducedMotion) {
        return {
            indexA: 0,
            indexB: 1 % n,
            morphT: 0,
            rotationDeg: 0,
            cycleProgress: 0,
        };
    }

    let globalMs = elapsedMs;
    if (progress !== null && Number.isFinite(progress)) {
        const p = Math.max(0, Math.min(1, progress));
        globalMs = p * cycleDurationMs;
    } else if (!paused) {
        globalMs = elapsedMs % cycleDurationMs;
    } else {
        globalMs = elapsedMs % cycleDurationMs;
    }

    const cycleProgress = globalMs / cycleDurationMs;
    const slotIndex = Math.floor(globalMs / durationPerShapeMs) % n;
    const slotLocalMs = globalMs % durationPerShapeMs;
    const slotLinearT = durationPerShapeMs > 0 ? slotLocalMs / durationPerShapeMs : 0;
    const morphT = ease(Math.max(0, Math.min(1, slotLinearT)));

    const indexA = slotIndex;
    const indexB = (slotIndex + 1) % n;

    /** Rotation constante : 360° sur la durée totale du cycle */
    const constantRot = cycleProgress * LOADING_INDICATOR_CONSTANT_ROTATION_DEG;

    /** Rotation extra : impulsion spring par transition (90° × fraction eased) */
    const completedTransitions = slotIndex;
    const extraRot =
        completedTransitions * LOADING_INDICATOR_EXTRA_ROTATION_DEG +
        morphT * LOADING_INDICATOR_EXTRA_ROTATION_DEG;

    return {
        indexA,
        indexB,
        morphT,
        rotationDeg: constantRot + extraRot,
        cycleProgress,
    };
}

/**
 * Expose les variables CSS motion sur un élément loader.
 */
export function applyLoadingIndicatorMotionVars(
    el: HTMLElement,
    contextEl?: HTMLElement | null
): LoaderMotionTiming {
    const timing = getLoaderMotionTiming(contextEl ?? el);
    el.style.setProperty('--loading-indicator-duration-per-shape', `${timing.durationPerShapeMs}ms`);
    el.style.setProperty('--loading-indicator-cycle-duration', `${timing.cycleDurationMs}ms`);
    el.style.setProperty('--loading-indicator-morph-easing', timing.morphEasing);
    return timing;
}
