/**
 * @fileoverview Spécifications du composant Halo K3UI
 * @description Effet de lumière animée autour de n'importe quel élément
 * @author K3UI Team
 * @version 1.0.0
 */

import type { HaloOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';
import type { EffectComponentMeta } from '../common/effect.specs';

/** Variantes visuelles du halo */
export const HALO_VARIANTS = ['default', 'dual', 'rainbow', 'glow', 'pulse'] as const;

/** Tailles du liseré et du flou */
export const HALO_SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

/** Sens de rotation */
export const HALO_DIRECTIONS = ['cw', 'ccw'] as const;

/** Modes de déclenchement */
export const HALO_TRIGGERS = ['always', 'hover'] as const;

/**
 * Spécifications du composant Halo
 */
export const HaloSpecs = {
    meta: {
        cssOnly: true,
        supportsWrapper: true,
        supportsDataAttribute: true,
        supportsCustomElement: true,
        respectsReducedMotion: true,
    } satisfies EffectComponentMeta,
} as const;

/**
 * Retourne les options par défaut du composant Halo
 * @returns Les options par défaut
 */
export function getHaloDefaults(): HaloOptions {
    return {
        variant: 'default',
        size: 'md',
        direction: 'cw',
        trigger: 'always',
        paused: false,
        block: false,
        color: '',
        radius: '',
        duration: '',
        padding: '',
        autoRadius: true,
        priorityLevel: PriorityLevel.MEDIUM,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
    };
}
