/**
 * @fileoverview Spécifications du composant Firework K3UI
 * @description Spécifications et comportements pour le composant feux d'artifice
 * @author K3UI Team
 * @version 1.0.0
 */

import type { AnimationConfig } from '../../types/components/animations';
import type { FireworkLayer, FireworkOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';
import {
    FIREWORK_SOUND_REMOTE_BASE_URL,
    getFireworkSoundSourcesWithFallback,
} from '../../extensions/effects/firework/firework-audio';

/**
 * Spécifications du composant Firework
 */
export const FireworkSpecs = {
    behaviors: {
        defaultQuality: 2 as const,
        defaultShell: 'Random' as const,
        defaultSize: 3,
        defaultLayer: 'behind' as const,
        defaultZIndex: -1,
        zIndexFront: 450,
        defaultScaleFactor: 1,
        themeFlipTailMs: 1000,
        themeFlipPollMs: 140,
    },

    shells: [
        'Random',
        'Crackle',
        'Crossette',
        'Crysanthemum',
        'Falling Leaves',
        'Floral',
        'Ghost',
        'Horse Tail',
        'Palm',
        'Ring',
        'Strobe',
        'Willow',
    ] as const,

    sound: {
        defaultMode: 'samples' as const,
        defaultBaseUrl: FIREWORK_SOUND_REMOTE_BASE_URL,
    },

    sequences: {
        celebrate: [{ count: 2 }, { count: 3 }, { count: 2 }, { finale: true }],
    },

    animations: {
        enter: {
            type: 'fade' as const,
            duration: 300,
            easing: 'ease-out' as const,
        } as AnimationConfig,
        exit: {
            type: 'fade' as const,
            duration: 300,
            easing: 'ease-in' as const,
        } as AnimationConfig,
    },

    accessibility: {
        role: 'presentation',
        autoDisableForReducedMotion: true,
    },

    limitations: {
        /** Une seule instance moteur active par page (état module du moteur canvas). */
        singleEnginePerPage: true,
    },
};

/**
 * Résout le z-index selon le calque ou une valeur explicite.
 * @param layer - Calque behind/front
 * @param zIndex - Valeur z-index fournie
 * @param zIndexExplicit - true si z-index défini manuellement (prioritaire)
 */
export function resolveFireworkZIndex(
    layer: FireworkLayer,
    zIndex: number,
    zIndexExplicit = false,
): number {
    if (zIndexExplicit) return zIndex;
    return layer === 'front'
        ? FireworkSpecs.behaviors.zIndexFront
        : FireworkSpecs.behaviors.defaultZIndex;
}

/**
 * Extrait les valeurs par défaut pour Firework
 * @returns Options par défaut
 */
export function getFireworkDefaults(): FireworkOptions {
    return {
        priorityLevel: PriorityLevel.LOW,

        quality: FireworkSpecs.behaviors.defaultQuality,
        shell: FireworkSpecs.behaviors.defaultShell,
        size: FireworkSpecs.behaviors.defaultSize,
        autoLaunch: false,
        finale: false,
    skyLighting: 2,
    longExposure: false,
    trails: true,
    imprints: false,
    scaleFactor: FireworkSpecs.behaviors.defaultScaleFactor,
        soundEnabled: false,
        soundMode: FireworkSpecs.sound.defaultMode,
        soundBaseUrl: FireworkSpecs.sound.defaultBaseUrl,
        soundSources: getFireworkSoundSourcesWithFallback(),
        transparentBackground: true,
        layer: FireworkSpecs.behaviors.defaultLayer,
        zIndex: FireworkSpecs.behaviors.defaultZIndex,
        highDPI: true,
        autoStart: true,
        container: undefined,

        themeFlip: true,
        themeFlipTailMs: FireworkSpecs.behaviors.themeFlipTailMs,
        restoreTheme: undefined,
        disableForReducedMotion: FireworkSpecs.accessibility.autoDisableForReducedMotion,

        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
    };
}
