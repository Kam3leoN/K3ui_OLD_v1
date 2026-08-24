/**
 * @fileoverview Spécifications du composant Button K3UI
 * @description Spécifications et comportements pour le composant Button conforme Material Design 3 Expressive
 * @author K3UI Team
 * @version 1.0.0
 */

import type { AnimationConfig } from '../../types/components/animations';
import { ButtonOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';
import { getHapticFeedbackDefaults } from '../common/haptic-feedback.specs';

/**
 * Spécifications du composant Button
 */
export const ButtonSpecs = {
    // ============================================================================
    // COMPORTEMENTS PAR DÉFAUT
    // ============================================================================

    behaviors: {
        /** Taille par défaut */
        defaultSize: 'md' as const,
        /** Mode par défaut */
        defaultMode: 'default' as const,
        /** Type par défaut */
        defaultType: 'filled' as const,
        /** Ripple activé par défaut */
        defaultRipple: true,
    },

    // ============================================================================
    // ANIMATIONS
    // ============================================================================

    animations: {
        enter: {
            type: 'scale' as const,
            duration: 200,
            easing: 'ease-out' as const,
        } as AnimationConfig,

        exit: {
            type: 'scale' as const,
            duration: 150,
            easing: 'ease-in' as const,
        } as AnimationConfig,
    },

    // ============================================================================
    // ACCESSIBILITÉ
    // ============================================================================

    accessibility: {
        /** Rôle ARIA par défaut */
        role: 'button',
        /** Auto-désactiver pour mouvement réduit */
        autoDisableForReducedMotion: true,
    },
};

/**
 * Extrait les valeurs par défaut pour Button
 * @returns Options par défaut
 */
export function getButtonDefaults(): ButtonOptions {
    return {
        // Options de base
        priorityLevel: PriorityLevel.MEDIUM,

        // Options spécifiques
        ripple: ButtonSpecs.behaviors.defaultRipple,
        size: ButtonSpecs.behaviors.defaultSize,
        mode: ButtonSpecs.behaviors.defaultMode,
        type: ButtonSpecs.behaviors.defaultType,
        ...getHapticFeedbackDefaults('medium'),
    };
}

