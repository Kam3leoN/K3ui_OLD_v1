/**
 * @fileoverview Construction de transitions CSS à partir des springs M3
 * @description Utilitaire partagé pour Dialog, Tooltip, Snackbar, Menu, etc.
 * @author K3UI Team
 */

import { getPreferReducedMotion } from '../accessibility/reducedMotion';
import {
    readMotionSpring,
    type MotionSpringCategory,
    type MotionSpringSpeed,
    type MotionSpringValues,
} from './motionSpring';

/** Propriété CSS animée avec son spring M3 */
export interface MotionTransitionProperty {
    /** Propriété CSS (transform, opacity, etc.) */
    property: string;
    /** Catégorie spring M3 */
    category: MotionSpringCategory;
    /** Vitesse spring M3 */
    speed: MotionSpringSpeed;
}

/** Paire spatial + effects pour animations composites */
export interface MotionSpringPair {
    spatial: MotionSpringValues;
    effects: MotionSpringValues;
}

/** Options pour shouldSkipMotion */
export interface MotionSkipOptions {
    /** Désactive explicitement les animations du composant */
    enableAnimations?: boolean;
}

/**
 * Lit la paire spatial/effects depuis les tokens M3 actifs.
 * @param spatialSpeed - Vitesse spatial (fast | default | slow)
 * @param effectsSpeed - Vitesse effects (fast | default | slow)
 * @param contextEl - Élément de contexte pour getComputedStyle
 */
export function getMotionSpringPair(
    spatialSpeed: MotionSpringSpeed,
    effectsSpeed: MotionSpringSpeed,
    contextEl?: HTMLElement | null
): MotionSpringPair {
    return {
        spatial: readMotionSpring('spatial', spatialSpeed, contextEl),
        effects: readMotionSpring('effects', effectsSpeed, contextEl),
    };
}

/**
 * Indique si les animations doivent être ignorées (reduced motion ou option composant).
 * @param options - Options du composant
 */
export function shouldSkipMotion(options?: MotionSkipOptions): boolean {
    if (options?.enableAnimations === false) {
        return true;
    }
    return getPreferReducedMotion();
}

/**
 * Construit une chaîne CSS `transition` à partir de propriétés et springs M3.
 * @param properties - Liste des propriétés animées
 * @param durationOverrideMs - Override optionnel de toutes les durées (ms)
 * @param contextEl - Élément de contexte pour lecture des tokens
 */
export function buildMotionTransition(
    properties: MotionTransitionProperty[],
    durationOverrideMs?: number,
    contextEl?: HTMLElement | null
): string {
    return properties
        .map(({ property, category, speed }) => {
            const spring = readMotionSpring(category, speed, contextEl);
            const duration =
                durationOverrideMs !== undefined ? `${durationOverrideMs}ms` : `${spring.durationMs}ms`;
            return `${property} ${duration} ${spring.easing}`;
        })
        .join(', ');
}

/**
 * Construit une transition composite transform (spatial) + opacity (effects).
 * Pattern M3 Expressive utilisé par Menu, Dialog, Snackbar.
 * @param spatialSpeed - Vitesse pour transform
 * @param effectsSpeed - Vitesse pour opacity
 * @param durationOverrideMs - Override optionnel (appliqué aux deux)
 * @param contextEl - Élément de contexte
 */
export function buildSpatialEffectsTransition(
    spatialSpeed: MotionSpringSpeed,
    effectsSpeed: MotionSpringSpeed,
    durationOverrideMs?: number,
    contextEl?: HTMLElement | null
): string {
    const pair = getMotionSpringPair(spatialSpeed, effectsSpeed, contextEl);
    const spatialDuration =
        durationOverrideMs !== undefined ? `${durationOverrideMs}ms` : `${pair.spatial.durationMs}ms`;
    const effectsDuration =
        durationOverrideMs !== undefined ? `${durationOverrideMs}ms` : `${pair.effects.durationMs}ms`;

    return [
        `transform ${spatialDuration} ${pair.spatial.easing}`,
        `opacity ${effectsDuration} ${pair.effects.easing}`,
    ].join(', ');
}

/**
 * Construit une transition opacity-only (effects).
 * @param effectsSpeed - Vitesse effects
 * @param durationOverrideMs - Override optionnel
 * @param contextEl - Élément de contexte
 */
export function buildEffectsTransition(
    effectsSpeed: MotionSpringSpeed,
    durationOverrideMs?: number,
    contextEl?: HTMLElement | null
): string {
    const spring = readMotionSpring('effects', effectsSpeed, contextEl);
    const duration =
        durationOverrideMs !== undefined ? `${durationOverrideMs}ms` : `${spring.durationMs}ms`;
    return `opacity ${duration} ${spring.easing}`;
}

/**
 * Retourne la durée maximale (ms) d'une liste de springs — utile pour setTimeout/onEnd.
 * @param speeds - Liste category/speed
 * @param durationOverrideMs - Override optionnel
 * @param contextEl - Élément de contexte
 */
export function getMaxMotionDurationMs(
    speeds: Array<{ category: MotionSpringCategory; speed: MotionSpringSpeed }>,
    durationOverrideMs?: number,
    contextEl?: HTMLElement | null
): number {
    if (durationOverrideMs !== undefined) {
        return durationOverrideMs;
    }
    return speeds.reduce((max, { category, speed }) => {
        const { durationMs } = readMotionSpring(category, speed, contextEl);
        return Math.max(max, durationMs);
    }, 0);
}
