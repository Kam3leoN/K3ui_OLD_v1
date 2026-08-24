/**
 * @fileoverview Spécifications du composant Holo K3UI
 * @author K3UI Team
 * @version 2.0.0
 */

import type { HoloOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';
import type { EffectComponentMeta } from '../common/effect.specs';

/** Variantes holo — portage pokemon-cards-151 (GPL-3.0) */
export const HOLO_VARIANTS = ['rayon', 'space', 'rainbow'] as const;
export const HOLO_AUTOPLAY_MODES = ['auto', true, false] as const;

export const HoloSpecs = {
    meta: {
        cssOnly: false,
        supportsWrapper: true,
        supportsDataAttribute: true,
        supportsCustomElement: true,
        respectsReducedMotion: true,
    } satisfies EffectComponentMeta,
    behaviors: {
        variant: 'rayon' as const,
        strength: 1,
        autoplay: 'auto' as const,
    },
} as const;

/**
 * Retourne les options par défaut du composant Holo
 * @returns Options par défaut
 */
export function getHoloDefaults(): HoloOptions {
    return {
        variant: HoloSpecs.behaviors.variant,
        strength: HoloSpecs.behaviors.strength,
        autoplay: HoloSpecs.behaviors.autoplay,
        priorityLevel: PriorityLevel.MEDIUM,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
    };
}
