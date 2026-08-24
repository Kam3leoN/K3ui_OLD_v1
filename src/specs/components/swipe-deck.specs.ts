/**
 * @fileoverview Spécifications SwipeDeck K3UI
 */

import type { SwipeDeckOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

export const SwipeDeckSpecs = {
    behaviors: {
        threshold: 100,
        rotationFactor: 0.12,
        stackDepth: 3,
        allowUndo: true,
    },
} as const;

/**
 * Options par défaut SwipeDeck
 */
export function getSwipeDeckDefaults(): SwipeDeckOptions {
    return {
        threshold: SwipeDeckSpecs.behaviors.threshold,
        rotationFactor: SwipeDeckSpecs.behaviors.rotationFactor,
        stackDepth: SwipeDeckSpecs.behaviors.stackDepth,
        allowUndo: SwipeDeckSpecs.behaviors.allowUndo,
        onSwipeLeft: null,
        onSwipeRight: null,
        onSwipeUp: null,
        onStackEmpty: null,
        priorityLevel: PriorityLevel.MEDIUM,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
    };
}
