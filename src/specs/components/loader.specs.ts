/**
 * @fileoverview Spécifications du composant Loader K3UI
 * @description Material Design 3 Expressive – 7 shapes, motion via tokens spatial
 * @see https://m3.material.io/components/loading-indicator
 * @author K3UI Team
 */

import type { LoaderOptions, LoaderShapeName } from '../../types/components';
import { PriorityLevel } from '../../types/base';
import {
    MOTION_EXPRESSIVE_SPATIAL_SLOW_DURATION_MS,
    MOTION_EXPRESSIVE_SPATIAL_SLOW_EASING,
    readMotionSpring,
    type MotionSpringCategory,
    type MotionSpringSpeed,
} from '../../utils/motion/motionSpring';
import { SHAPE_COUNT } from '../../utils/loading-indicator/morph';

/** Liste des 35 shapes disponibles (assets/images/shapes/) pour le mode cycle */
export const LOADING_INDICATOR_SHAPES: readonly LoaderShapeName[] = [
    'arch', 'arrow', 'boom', 'boomsoft', 'bun', 'burst', 'burstsoft', 'circle',
    'clamshell', 'diamond', 'fan', 'flower', 'gem', 'ghost', 'heart', 'leaf4',
    'leaf8', 'oval', 'pentagon', 'pill', 'pixelcircle', 'pixeltriangle', 'puffy',
    'puffydiamond', 'semicircle', 'sides4', 'sides6', 'sides7', 'sides9', 'sides12',
    'slanted', 'square', 'sunny', 'sunnysoft', 'triangle',
] as const;

/**
 * Séquence M3 Expressive officielle — 7 shapes :
 * SoftBurst → Cookie9Sided → Pentagon → Pill → Sunny → Cookie4Sided → Oval
 */
export const M3_EXPRESSIVE_SHAPE_SEQUENCE: readonly string[] = [
    'burstsoft', 'sides9', 'pentagon', 'pill', 'sunny', 'sides4', 'oval',
];

/** Séquence par défaut du morph (7 shapes M3 Expressive) */
export const DEFAULT_MORPH_SEQUENCE: string[] = [...M3_EXPRESSIVE_SHAPE_SEQUENCE];

/** Nombre de shapes M3 (alias export specs) */
export { SHAPE_COUNT as LOADING_INDICATOR_SHAPE_COUNT };

/** Bornes M3 pour la taille (dp) */
export const LOADING_INDICATOR_SIZE_MIN = 24;
export const LOADING_INDICATOR_SIZE_MAX = 240;

/** Container 48dp ; zone drawable agrandie (42dp) — pill dépasse le viewBox source, marge anti-clipping */
export const LOADING_INDICATOR_SHAPE_CONTAINER_RATIO = 42 / 48;

/** Spring spatial pour le morph (DampingRatioNoBouncy + StiffnessVeryLow → spatial-slow M3 Web) */
export const LOADING_INDICATOR_MORPH_MOTION_CATEGORY: MotionSpringCategory = 'spatial';
export const LOADING_INDICATOR_MORPH_MOTION_SPEED: MotionSpringSpeed = 'slow';

/**
 * Rotation constante linéaire sur le cycle complet (1 tour = 360°).
 * Aligné sur LoadingIndicatorAnimatorDelegate (Android M3).
 */
export const LOADING_INDICATOR_CONSTANT_ROTATION_DEG = 360;

/** Rotation extra par transition de shape, pilotée par le spring spatial */
export const LOADING_INDICATOR_EXTRA_ROTATION_DEG = 90;

/**
 * keySplines SMIL — dérivé du spring spatial-default actif (expressive : 0.38 1.21 0.22 1)
 * Utilisé uniquement en fallback SMIL si le moteur RAF est indisponible.
 */
export const LOADING_INDICATOR_KEYSPLINES = '0.38 1.21 0.22 1';

/** Couleur shape — variante default (Primary) */
export const LOADING_INDICATOR_DEFAULT_INDICATOR_COLOR =
    'var(--k3ui-primary, var(--md-sys-color-primary, #6750a4))';

/** Couleur fond — variante contained (Primary container) */
export const LOADING_INDICATOR_DEFAULT_CONTAINER_COLOR =
    'var(--k3ui-primary-container, var(--md-sys-color-primary-container, #eaddff))';

/** Couleur shape — variante contained (On primary container) */
export const LOADING_INDICATOR_DEFAULT_CONTAINER_INDICATOR_COLOR =
    'var(--k3ui-on-primary-container, var(--md-sys-color-on-primary-container, #21005d))';

/**
 * Timing morph dérivé des tokens motion (--md-sys-motion-spatial-slow-*).
 * cycle = SHAPE_COUNT × durationPerShape
 */
export interface LoaderMotionTiming {
    /** Durée par shape (ms) — token spatial-slow-duration */
    durationPerShapeMs: number;
    /** Durée cycle complet (ms) = SHAPE_COUNT × durationPerShapeMs */
    cycleDurationMs: number;
    /** Easing CSS cubic-bezier du morph */
    morphEasing: string;
    /** Variable CSS durée (pour styles inline / doc) */
    motionDurationVar: string;
    /** Variable CSS easing */
    motionEasingVar: string;
}

/**
 * Calcule le timing à partir des tokens motion actifs.
 * @param contextEl Élément de contexte pour getComputedStyle
 */
export function getLoaderMotionTiming(contextEl?: HTMLElement | null): LoaderMotionTiming {
    const spring = readMotionSpring(
        LOADING_INDICATOR_MORPH_MOTION_CATEGORY,
        LOADING_INDICATOR_MORPH_MOTION_SPEED,
        contextEl
    );
    const durationPerShapeMs = spring.durationMs;
    const cycleDurationMs = SHAPE_COUNT * durationPerShapeMs;
    return {
        durationPerShapeMs,
        cycleDurationMs,
        morphEasing: spring.easing,
        motionDurationVar: `--md-sys-motion-${LOADING_INDICATOR_MORPH_MOTION_CATEGORY}-${LOADING_INDICATOR_MORPH_MOTION_SPEED}-duration`,
        motionEasingVar: `--md-sys-motion-${LOADING_INDICATOR_MORPH_MOTION_CATEGORY}-${LOADING_INDICATOR_MORPH_MOTION_SPEED}-easing`,
    };
}

/**
 * Durée cycle morph fallback (7 × spatial-slow 650ms = 4550ms).
 */
export function getDefaultMorphCycleDurationMs(): number {
    return SHAPE_COUNT * MOTION_EXPRESSIVE_SPATIAL_SLOW_DURATION_MS;
}

/** @deprecated Utiliser getLoaderMotionTiming().cycleDurationMs */
export const LOADING_INDICATOR_MORPH_DURATION_MS = getDefaultMorphCycleDurationMs();

/**
 * Spécifications du composant Loader – M3 Expressive
 */
export const LoaderSpecs = {
    mode: 'morph' as const,
    morphShapeSequence: DEFAULT_MORPH_SEQUENCE,
    /** Durée cycle complet (ms) — dérivée motion spatial-slow × SHAPE_COUNT */
    morphDuration: getDefaultMorphCycleDurationMs(),
    morphUseSpring: true,
    /** @deprecated Ignoré — morph piloté par tokens motion spatial-slow */
    morphRotationStiffness: 0,
    /** @deprecated Ignoré */
    morphRotationDamping: 0,
    /** @deprecated Ignoré */
    morphMorphStiffness: 0,
    /** @deprecated Ignoré */
    morphMorphDamping: 0,
    /** @deprecated Ignoré — pas de hold entre shapes (transitions continues) */
    morphHoldMs: 0,
    size: 48,
    container: false,
    blur: false,
    center: true,
    cycleInterval: 1500,
    rotationDuration: 1500,
    assetsPath: '',
    /** Progression déterminée 0..1 (null = indéterminé) */
    progress: null as number | null,
    /** Pause l'animation */
    paused: false,
    indicatorColor: '',
    containerColor: '',
    /** Token motion spatial-slow (fallback mirror SCSS) */
    motionSpatialSlowDurationMs: MOTION_EXPRESSIVE_SPATIAL_SLOW_DURATION_MS,
    motionSpatialSlowEasing: MOTION_EXPRESSIVE_SPATIAL_SLOW_EASING,
    shapeCount: SHAPE_COUNT,
    constantRotationDeg: LOADING_INDICATOR_CONSTANT_ROTATION_DEG,
    extraRotationDeg: LOADING_INDICATOR_EXTRA_ROTATION_DEG,
    shapeContainerRatio: LOADING_INDICATOR_SHAPE_CONTAINER_RATIO,
};

/**
 * Extrait les valeurs par défaut pour Loader
 */
export function getLoaderDefaults(): LoaderOptions {
    return {
        ...LoaderSpecs,
        morphShapeSequence: [...DEFAULT_MORPH_SEQUENCE],
        priorityLevel: PriorityLevel.MEDIUM,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
    };
}
