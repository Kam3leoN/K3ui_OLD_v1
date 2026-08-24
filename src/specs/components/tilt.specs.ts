/**
 * @fileoverview Spécifications du composant Tilt K3UI
 * @description Effet 3D parallax au survol — moteur natif K3UI
 * @author K3UI Team
 * @version 2.0.0
 */

import type { TiltOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';
import type { EffectComponentMeta } from '../common/effect.specs';

export const TiltSpecs = {
    meta: {
        cssOnly: false,
        supportsWrapper: true,
        supportsDataAttribute: false,
        supportsCustomElement: true,
        respectsReducedMotion: true,
    } satisfies EffectComponentMeta,
    behaviors: {
        alwaysActive: false,
        activeOffset: 50,
        shadowOffset: 50,
        shadowScale: 1,
        duration: 300,
        rotate: true,
        rotateTouch: true as boolean | 'scroll-x' | 'scroll-y',
        rotateXMax: 15,
        rotateYMax: 15,
        rotateXInvert: false,
        rotateYInvert: false,
        stretchX: 0,
        stretchY: 0,
        stretchZ: 0,
        commonOrigin: true,
        shadow: true,
        highlight: true,
        respectReducedMotion: true,
        reducedMotion: false,
    },
} as const;

/**
 * Valeurs par défaut du composant Tilt
 * @returns Options par défaut
 */
export function getTiltDefaults(): TiltOptions {
    return {
        alwaysActive: TiltSpecs.behaviors.alwaysActive,
        activeOffset: TiltSpecs.behaviors.activeOffset,
        shadowOffset: TiltSpecs.behaviors.shadowOffset,
        shadowScale: TiltSpecs.behaviors.shadowScale,
        duration: TiltSpecs.behaviors.duration,
        rotate: TiltSpecs.behaviors.rotate,
        rotateTouch: TiltSpecs.behaviors.rotateTouch,
        rotateXMax: TiltSpecs.behaviors.rotateXMax,
        rotateYMax: TiltSpecs.behaviors.rotateYMax,
        rotateXInvert: TiltSpecs.behaviors.rotateXInvert,
        rotateYInvert: TiltSpecs.behaviors.rotateYInvert,
        stretchX: TiltSpecs.behaviors.stretchX,
        stretchY: TiltSpecs.behaviors.stretchY,
        stretchZ: TiltSpecs.behaviors.stretchZ,
        commonOrigin: TiltSpecs.behaviors.commonOrigin,
        shadow: TiltSpecs.behaviors.shadow,
        highlight: TiltSpecs.behaviors.highlight,
        eventsEl: undefined,
        respectReducedMotion: TiltSpecs.behaviors.respectReducedMotion,
        reducedMotion: TiltSpecs.behaviors.reducedMotion,
        onRotate: null,
        priorityLevel: PriorityLevel.MEDIUM,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
    };
}
