/**
 * @fileoverview Spécifications du composant Flip K3UI
 * @author K3UI Team
 * @version 1.0.0
 */

import type { FlipOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';
import type { EffectComponentMeta } from '../common/effect.specs';

export const FLIP_AXES = ['x', 'y'] as const;
export const FLIP_MOTIONS = ['standard', 'expressive'] as const;
export const FLIP_TRIGGERS = ['hover', 'click'] as const;

export const FlipSpecs = {
    meta: {
        cssOnly: false,
        supportsWrapper: true,
        supportsDataAttribute: false,
        supportsCustomElement: true,
        respectsReducedMotion: true,
    } satisfies EffectComponentMeta,
    behaviors: {
        axis: 'y' as const,
        motion: 'standard' as const,
        trigger: 'hover' as const,
        duration: 600,
        perspective: 1200,
    },
} as const;

/**
 * Retourne les options par défaut du composant Flip
 * @returns Options par défaut
 */
export function getFlipDefaults(): FlipOptions {
    return {
        axis: FlipSpecs.behaviors.axis,
        motion: FlipSpecs.behaviors.motion,
        trigger: FlipSpecs.behaviors.trigger,
        duration: FlipSpecs.behaviors.duration,
        perspective: FlipSpecs.behaviors.perspective,
        flipped: false,
        label: '',
        onFlipChange: null,
        priorityLevel: PriorityLevel.MEDIUM,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
    };
}
