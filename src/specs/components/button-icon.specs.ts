/**
 * @fileoverview Spécifications du composant ButtonIcon K3UI
 * @description Bouton d'action (icon button) Material Design 3 Expressive — référence unique
 * @see https://m3.material.io/components/icon-buttons/overview
 * @author K3UI Team
 * @version 1.0.0
 */

import type { AnimationConfig } from '../../types/components/animations';
import type { ButtonIconOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';
import { getHapticFeedbackDefaults } from '../common/haptic-feedback.specs';

/**
 * Spécifications du composant ButtonIcon (M3 Expressive)
 */
export const ButtonIconSpecs = {
    behaviors: {
        defaultSize: 'md' as const,
        defaultWidth: 'default' as const,
        defaultVariant: 'standard' as const,
        defaultSelected: false,
        defaultRipple: true,
    },

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

    accessibility: {
        role: 'button',
        autoDisableForReducedMotion: true,
    },
};

/**
 * Extrait les valeurs par défaut pour ButtonIcon
 * @returns Options par défaut
 */
export function getButtonIconDefaults(): ButtonIconOptions {
    return {
        priorityLevel: PriorityLevel.MEDIUM,
        ripple: ButtonIconSpecs.behaviors.defaultRipple,
        size: ButtonIconSpecs.behaviors.defaultSize,
        width: ButtonIconSpecs.behaviors.defaultWidth,
        variant: ButtonIconSpecs.behaviors.defaultVariant,
        selected: ButtonIconSpecs.behaviors.defaultSelected,
        ...getHapticFeedbackDefaults('medium'),
    };
}
