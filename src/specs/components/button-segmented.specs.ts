/**
 * @fileoverview Spécifications du composant ButtonSegmented K3UI
 * @description Segmented Button Material Design 3 Expressive — conteneur outlineVariant×40, padding 4dp, gap 4dp, pill actif primaryContainer
 * @author K3UI Team
 * @version 1.0.0
 */

import type { AnimationConfig } from '../../types/components/animations';
import type { ButtonSegmentedOptions, ButtonGroupItem } from '../../types/components';
import { PriorityLevel } from '../../types/base';
import { getHapticFeedbackDefaults } from '../common/haptic-feedback.specs';

/**
 * Spécifications du composant ButtonSegmented (M3 Expressive)
 */
export const ButtonSegmentedSpecs = {
    behaviors: {
        defaultShape: 'rounded' as const,
        defaultMultiSelect: false,
        defaultShowCheck: false,
        /** Padding conteneur 4dp, gap entre segments 4dp */
        containerPadding: 4,
        segmentGap: 4,
        /** Border-radius conteneur : rounded 24px, square 10px */
        wrapRadiusRounded: 24,
        wrapRadiusSquare: 10,
        /** Border-radius segment actif/inactif : rounded 20px, square 6px */
        segmentRadiusRounded: 20,
        segmentRadiusSquare: 6,
    },

    animations: {
        enter: {
            type: 'fade' as const,
            duration: 180,
            easing: 'ease-out' as const,
        } as AnimationConfig,
        exit: {
            type: 'fade' as const,
            duration: 150,
            easing: 'ease-in' as const,
        } as AnimationConfig,
        /** Transition pill — M3 Expressive (navigation rail–style) */
        segmentTransitionDuration: 350,
        segmentTransitionEasing: 'cubic-bezier(0.2, 0, 0, 1)',
    },

    accessibility: {
        roleSingle: 'radiogroup' as const,
        roleMulti: 'group' as const,
        autoDisableForReducedMotion: false,
    },
};

/**
 * Extrait les valeurs par défaut pour ButtonSegmented
 * @returns Options par défaut
 */
export function getButtonSegmentedDefaults(): ButtonSegmentedOptions {
    return {
        priorityLevel: PriorityLevel.MEDIUM,
        segments: [] as ButtonGroupItem[],
        shape: ButtonSegmentedSpecs.behaviors.defaultShape,
        multiSelect: ButtonSegmentedSpecs.behaviors.defaultMultiSelect,
        defaultSelected: [0],
        showCheck: ButtonSegmentedSpecs.behaviors.defaultShowCheck,
        ariaLabel: null,
        onSelect: null,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
        ...getHapticFeedbackDefaults('selection'),
    };
}
