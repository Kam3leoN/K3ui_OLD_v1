/**
 * @fileoverview Spécifications du composant ButtonArrow K3UI
 * @description Split-button flèches Material Design 3 Expressive (horizontal / vertical)
 * @see https://m3.material.io/components/buttons/overview
 * @author K3UI Team
 * @version 1.0.0
 */

import type { AnimationConfig } from '../../types/components/animations';
import type { ButtonArrowOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';
import { getHapticFeedbackDefaults } from '../common/haptic-feedback.specs';

/**
 * Spécifications du composant ButtonArrow (M3 Expressive)
 */
export const ButtonArrowSpecs = {
    behaviors: {
        defaultDirection: 'horizontal' as const,
        defaultVariant: 'filled' as const,
        defaultInitialIndex: 0,
        defaultList: [] as string[],
        iconLeft: 'chevron-left',
        iconRight: 'chevron-right',
        iconUp: 'chevron-up',
        iconDown: 'chevron-down',
    },

    animations: {
        enter: {
            type: 'fade' as const,
            duration: 200,
            easing: 'ease-out' as const,
        } as AnimationConfig,
        exit: {
            type: 'fade' as const,
            duration: 150,
            easing: 'ease-in' as const,
        } as AnimationConfig,
    },

    accessibility: {
        role: 'group',
        labelPrev: 'Previous',
        labelNext: 'Next',
        labelUp: 'Up',
        labelDown: 'Down',
        autoDisableForReducedMotion: true,
    },
};

/**
 * Extrait les valeurs par défaut pour ButtonArrow
 * @returns Options par défaut
 */
export function getButtonArrowDefaults(): ButtonArrowOptions {
    return {
        priorityLevel: PriorityLevel.MEDIUM,
        direction: ButtonArrowSpecs.behaviors.defaultDirection,
        variant: ButtonArrowSpecs.behaviors.defaultVariant,
        list: [...ButtonArrowSpecs.behaviors.defaultList],
        initialIndex: ButtonArrowSpecs.behaviors.defaultInitialIndex,
        onChange: null,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
        ...getHapticFeedbackDefaults('medium'),
    };
}
