/**
 * @fileoverview Spécifications du composant Confetti K3UI
 * @description Spécifications et comportements pour le composant
 * @author K3UI Team
 * @version 1.0.0
 */

import type { AnimationConfig } from '../../types/components/animations';
import { ConfettiOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Spécifications du composant Confetti
 */
export const ConfettiSpecs = {
    // ============================================================================
    // COMPORTEMENTS PAR DÉFAUT
    // ============================================================================

    behaviors: {
        /** Nombre de particules par défaut */
        defaultParticleCount: 50,
        /** Angle par défaut */
        defaultAngle: 90,
        /** Écartement par défaut */
        defaultSpread: 45,
        /** Vélocité de départ par défaut */
        defaultStartVelocity: 45,
        /** Décroissance par défaut */
        defaultDecay: 0.9,
        /** Gravité par défaut */
        defaultGravity: 1,
        /** Dérive par défaut */
        defaultDrift: 0,
        /** Ticks par défaut */
        defaultTicks: 200,
        /** Scalar par défaut */
        defaultScalar: 1,
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

    // ============================================================================
    // COULEURS
    // ============================================================================

    colors: {
        /** Couleurs par défaut */
        default: [
            '#26ccff',
            '#a25afd',
            '#ff5e7e',
            '#88ff5a',
            '#fcff42',
            '#ffa62d',
            '#ff36ff',
        ],
    },

    // ============================================================================
    // FORMES
    // ============================================================================

    shapes: {
        /** Formes disponibles */
        available: ['square', 'circle', 'star'] as const,
        /** Formes par défaut */
        default: ['square', 'circle'] as const,
    },

    // ============================================================================
    // PRESETS (supprimés - tout est dans la page PHP)
    // ============================================================================

    presets: {},
};

/**
 * Extrait les valeurs par défaut pour Confetti
 * @returns Options par défaut
 */
export function getConfettiDefaults(): ConfettiOptions {
    return {
        // Options de base
        priorityLevel: PriorityLevel.MEDIUM,

        // Options spécifiques
        particleCount: ConfettiSpecs.behaviors.defaultParticleCount,
        angle: ConfettiSpecs.behaviors.defaultAngle,
        spread: ConfettiSpecs.behaviors.defaultSpread,
        startVelocity: ConfettiSpecs.behaviors.defaultStartVelocity,
        decay: ConfettiSpecs.behaviors.defaultDecay,
        gravity: ConfettiSpecs.behaviors.defaultGravity,
        drift: ConfettiSpecs.behaviors.defaultDrift,
        ticks: ConfettiSpecs.behaviors.defaultTicks,
        origin: {
            x: 0.5,
            y: 0.5,
        },
        shapes: [...ConfettiSpecs.shapes.default],
        zIndex: 100,
        colors: [...ConfettiSpecs.colors.default],
        disableForReducedMotion: ConfettiSpecs.accessibility.autoDisableForReducedMotion,
        scalar: ConfettiSpecs.behaviors.defaultScalar,
        flat: false,
        resize: true, // Par défaut true pour le canvas global (comme canvas-confetti)

        // Callbacks
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
    };
}


