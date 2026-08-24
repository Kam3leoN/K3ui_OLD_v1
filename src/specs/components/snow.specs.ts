/**
 * @fileoverview Spécifications du composant Snow K3UI
 * @description Spécifications et comportements pour le composant
 * @author K3UI Team
 * @version 1.0.0
 */

import type { AnimationConfig } from '../../types/components/animations';
import { SnowOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Spécifications du composant Snow
 */
export const SnowSpecs = {
    // ============================================================================
    // COMPORTEMENTS PAR DÉFAUT
    // ============================================================================

    behaviors: {
        /** Nombre de particules par défaut */
        defaultParticleCount: 999,
        /** Vitesse par défaut */
        defaultSpeed: 3,
        /** Vent par défaut */
        defaultWind: 500,
        /** Variance du vent */
        defaultWindVariance: 1.5,
    },

    // ============================================================================
    // ANIMATIONS
    // ============================================================================

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

    // ============================================================================
    // ACCESSIBILITÉ
    // ============================================================================

    accessibility: {
        /** Rôle ARIA par défaut */
        role: 'region',
        /** Auto-désactiver pour mouvement réduit */
        autoDisableForReducedMotion: true,
    },
};

/**
 * Extrait les valeurs par défaut pour Snow
 * @returns Options par défaut
 */
export function getSnowDefaults(): SnowOptions {
    return {
        // Options de base
        priorityLevel: PriorityLevel.MEDIUM,

        // Options spécifiques
        particleCount: SnowSpecs.behaviors.defaultParticleCount,
        speed: SnowSpecs.behaviors.defaultSpeed,
        wind: SnowSpecs.behaviors.defaultWind,
        windVariance: SnowSpecs.behaviors.defaultWindVariance,
        zIndex: 100,
        autoStart: false,
        mode: 'manual',
        resize: true,
        disableForReducedMotion: SnowSpecs.accessibility.autoDisableForReducedMotion,

        // Callbacks
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
    };
}

