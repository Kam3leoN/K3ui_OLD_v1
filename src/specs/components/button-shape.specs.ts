/**
 * @fileoverview Spécifications du composant ButtonShape K3UI
 * @description Bouton pastille M3 Expressive avec slots shape overhang — filled / tonal
 * @author K3UI Team
 * @version 1.0.0
 */

import type { AnimationConfig } from '../../types/components/animations';
import type { ButtonShapeOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';
import { getHapticFeedbackDefaults } from '../common/haptic-feedback.specs';

/**
 * Spécifications du composant ButtonShape (M3 Expressive)
 */
export const ButtonShapeSpecs = {
    behaviors: {
        defaultVariant: 'filled' as const,
        defaultSize: 'md' as const,
        defaultRipple: true,
        defaultMorph: true,
        defaultLeadingShape: 'sunny' as const,
        defaultTrailingShape: 'sunny' as const,
        /** Morph press/release border-radius (pastille → coin réduit) */
        morphShape: true,
    },

    animations: {
        enter: {
            type: 'fade' as const,
            duration: 0,
            easing: 'linear' as const,
        } as AnimationConfig,
        exit: {
            type: 'fade' as const,
            duration: 0,
            easing: 'linear' as const,
        } as AnimationConfig,
    },

    accessibility: {
        role: 'button',
        autoDisableForReducedMotion: true,
    },
};

/**
 * Extrait les valeurs par défaut pour ButtonShape
 * @returns Options par défaut
 */
export function getButtonShapeDefaults(): ButtonShapeOptions {
    return {
        priorityLevel: PriorityLevel.MEDIUM,
        ripple: ButtonShapeSpecs.behaviors.defaultRipple,
        morph: ButtonShapeSpecs.behaviors.defaultMorph,
        size: ButtonShapeSpecs.behaviors.defaultSize,
        variant: ButtonShapeSpecs.behaviors.defaultVariant,
        leadingShape: ButtonShapeSpecs.behaviors.defaultLeadingShape,
        trailingShape: ButtonShapeSpecs.behaviors.defaultTrailingShape,
        assetsPath: undefined,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
        ...getHapticFeedbackDefaults('medium'),
    };
}
