/**
 * @fileoverview Spécifications du composant ButtonFab K3UI
 * @description FAB et Extended FAB Material Design 3 Expressive — tailles, motion, variants
 * @see https://m3.material.io/components/floating-action-button/overview
 * @see https://m3.material.io/components/extended-fab/specs
 * @author K3UI Team
 * @version 1.0.0
 */

import type { ButtonFabOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';
import { getHapticFeedbackDefaults } from '../common/haptic-feedback.specs';

/**
 * Spécifications ButtonFab (M3 Expressive)
 * Tailles : small 56dp, medium 80dp, large 96dp — icônes 24 / 28 / 36
 * Motion : shrink emphasizedAccelerate 200ms, extend emphasizedDecelerate 500ms
 */
export const ButtonFabSpecs = {
    behaviors: {
        defaultMode: 'fab' as const,
        defaultExpandTrigger: 'scroll' as const,
        defaultSize: 'medium' as const,
        defaultShape: 'rounded' as const,
        defaultVariant: 'primary' as const,
        defaultIcon: 'add',
        /** Shrink (scroll down) : 200ms emphasizedAccelerate */
        shrinkDurationMs: 200,
        /** Extend (scroll up) : 500ms emphasizedDecelerate */
        extendDurationMs: 500,
        /** Label exit avant shrink : 83ms linear */
        labelExitMs: 83,
        /** Label enter après début extend : delay 100ms, 150ms linear */
        labelEnterDelayMs: 100,
        labelEnterDurationMs: 150,
        /** Easing M3 shrink */
        easingShrink: 'cubic-bezier(0.3, 0, 0.8, 0.15)',
        /** Easing M3 extend */
        easingExtend: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
    },
    accessibility: {
        role: 'button' as const,
    },
};

/**
 * Retourne les options par défaut pour ButtonFab
 */
export function getButtonFabDefaults(): ButtonFabOptions {
    return {
        priorityLevel: PriorityLevel.MEDIUM,
        mode: ButtonFabSpecs.behaviors.defaultMode,
        expandTrigger: ButtonFabSpecs.behaviors.defaultExpandTrigger,
        scrollContainer: null,
        size: ButtonFabSpecs.behaviors.defaultSize,
        shape: ButtonFabSpecs.behaviors.defaultShape,
        variant: ButtonFabSpecs.behaviors.defaultVariant,
        icon: ButtonFabSpecs.behaviors.defaultIcon,
        label: '', // Sera remplacé par LocaleManager.t('buttonFab.labelDefault') dans le composant
        lowered: false,
        disabled: false,
        ripple: true,
        fixed: false,
        position: 'bottom-right',
        onClick: null,
        onExpandStart: null,
        onExpandEnd: null,
        onShrinkStart: null,
        onShrinkEnd: null,
        ...getHapticFeedbackDefaults('medium'),
    };
}
