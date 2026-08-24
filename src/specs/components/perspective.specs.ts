/**
 * @fileoverview Spécifications du composant Perspective K3UI
 * @description Slider 3D avec effets de perspective (wave, coverflow, carousel, etc.)
 * @author K3UI Team
 * @version 1.0.0
 */

import type { PerspectiveOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/** Effets disponibles pour le slider Perspective */
export type PerspectiveEffect =
    | 'wave'
    | 'coverflow'
    | 'carousel'
    | 'cube'
    | 'classic'
    | 'concave'
    | 'arc'
    | 'spiral-right'
    | 'spiral-left';

/**
 * Spécifications du composant Perspective
 */
export const PerspectiveSpecs = {
    effects: [
        'wave',
        'coverflow',
        'carousel',
        'cube',
        'classic',
        'concave',
        'arc',
        'spiral-right',
        'spiral-left'
    ] as PerspectiveEffect[],

    behaviors: {
        effect: 'wave' as PerspectiveEffect,
        focus: 0,
        orientation: 'horizontal' as 'horizontal' | 'vertical',
        shadowsEnabled: true,
        navigationEnabled: true,
        autoplayEnabled: true,
        autoplaySpeed: 1500,
        loopEnabled: true,
        preventScrolling: true,
        inDuration: 250,
        outDuration: 200,
        indicatorsEnabled: true,
        indicatorsPosition: 'bottom' as 'top' | 'bottom',
        numVisible: 5,
        listeners: {
            keys: true,
            touches: true,
            clicks: true,
            scroll: true,
            drag: true
        }
    }
};

/**
 * Extrait les valeurs par défaut pour Perspective
 * @returns Options par défaut
 */
export function getPerspectiveDefaults(): PerspectiveOptions {
    return {
        effect: PerspectiveSpecs.behaviors.effect,
        focus: PerspectiveSpecs.behaviors.focus,
        orientation: PerspectiveSpecs.behaviors.orientation,
        shadows: { enabled: PerspectiveSpecs.behaviors.shadowsEnabled },
        navigation: { enabled: PerspectiveSpecs.behaviors.navigationEnabled },
        autoplay: {
            enabled: PerspectiveSpecs.behaviors.autoplayEnabled,
            speed: PerspectiveSpecs.behaviors.autoplaySpeed
        },
        loop: { enabled: PerspectiveSpecs.behaviors.loopEnabled },
        listeners: { ...PerspectiveSpecs.behaviors.listeners },
        onChange: null,
        onCycleTo: null,
        preventScrolling: PerspectiveSpecs.behaviors.preventScrolling,
        inDuration: PerspectiveSpecs.behaviors.inDuration,
        outDuration: PerspectiveSpecs.behaviors.outDuration,
        indicators: PerspectiveSpecs.behaviors.indicatorsEnabled,
        indicatorsPosition: PerspectiveSpecs.behaviors.indicatorsPosition,
        numVisible: PerspectiveSpecs.behaviors.numVisible,
        priorityLevel: PriorityLevel.MEDIUM,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null
    };
}
