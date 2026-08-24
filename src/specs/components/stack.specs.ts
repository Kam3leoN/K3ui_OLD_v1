/**
 * @fileoverview Spécifications du composant Stack K3UI
 * @description Piles overlap / deck compact (style shadcn collapsed, max 3 couches)
 * @author K3UI Team
 * @version 1.1.0
 */

import type { StackOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Spécifications du composant Stack
 */
export const StackSpecs = {
    classes: {
        root: 'stack',
        item: 'stack__item',
        remaining: 'stack__remaining',
        variantPrefix: 'stack--',
        directionPrefix: 'stack--direction-',
        alignPrefix: 'stack--align-',
        limited: 'stack--limited',
        scroll: 'stack--scroll',
    },

    variants: {
        available: ['overlap', 'deck'] as const,
        default: 'overlap' as const,
    },

    /**
     * top/bottom/left/right = deck peek
     * start/end = alias overlap (LTR) → left/right
     */
    directions: {
        available: ['top', 'bottom', 'left', 'right', 'start', 'end'] as const,
        default: 'start' as const,
        deckDefault: 'top' as const,
    },

    aligns: {
        available: ['start', 'center', 'end'] as const,
        default: 'start' as const,
    },

    behaviors: {
        /** Couches visibles max (prévention ombres empilées) */
        depth: 3,
        depthMax: 3,
        offset: 12,
        /** Peek compact deck (shadcn) */
        deckOffset: 6,
        scaleStep: 0.05,
        /** Pas de fade agressif — couches arrière nettes */
        opacityStep: 0,
        max: null as number | null,
        showRemaining: false,
        scroll: true,
        itemSelector: ':scope > *:not(.stack__remaining)',
    },

    accessibility: {
        role: 'group' as const,
    },
} as const;

/**
 * Extrait les valeurs par défaut pour Stack depuis les specs
 */
export function getStackDefaults(): StackOptions {
    return {
        priorityLevel: PriorityLevel.LOW,
        variant: StackSpecs.variants.default,
        direction: StackSpecs.directions.default,
        align: StackSpecs.aligns.default,
        depth: StackSpecs.behaviors.depth,
        offset: StackSpecs.behaviors.offset,
        scaleStep: StackSpecs.behaviors.scaleStep,
        opacityStep: StackSpecs.behaviors.opacityStep,
        max: StackSpecs.behaviors.max,
        showRemaining: StackSpecs.behaviors.showRemaining,
        scroll: StackSpecs.behaviors.scroll,
        itemSelector: StackSpecs.behaviors.itemSelector,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
    };
}
