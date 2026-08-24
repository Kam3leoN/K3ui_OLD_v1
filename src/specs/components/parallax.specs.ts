/**
 * @fileoverview Spécifications du composant Parallax K3UI
 * @description simpleParallax.js + classique PixelCog + pointeur/gyro (data-depth)
 * @author K3UI Team
 * @version 2.1.0
 */

import type { ParallaxOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

export const ParallaxSpecs = {
    behaviors: {
        /** Moteur par défaut : pointer si depth, simple si média, sinon classic */
        engine: 'auto' as const,
        /** Axes : y = vertical (comportement historique), x / both pour l’horizontal */
        axis: 'y' as const,
        /** Vitesse relative du calque classique (défaut parallax.js ≈ 0.2) */
        speed: 0.2,
        /** Marge autour du bloc (px), comme `bleed` dans parallax.js */
        bleed: 0,
        /** Sans balise img : hauteur relative du calque pour le ratio de repli */
        imageHeight: 1.5,
        /** Respect de prefers-reduced-motion */
        respectReducedMotion: true,
        /** Réglages simpleParallax.js */
        scale: 1.5,
        orientation: 'up' as const,
        overflow: false,
        delay: 0.4,
        transition: 'cubic-bezier(0,0,0,1)',
        maxTransition: 0,
        /** Moteur pointer */
        depthSelector: '[data-depth],[data-depth-x],[data-depth-y]',
        relativeInput: true,
        clipRelativeInput: true,
        hoverOnly: false,
        strengthX: 150,
        strengthY: 150,
        invertX: true,
        invertY: true,
        smoothing: 0.12,
        originX: 0.5,
        originY: 0.5,
        gyroscope: true,
        gyroRange: 30,
        precision: 2,
    },
} as const;

export function getParallaxDefaults(): ParallaxOptions {
    return {
        engine: ParallaxSpecs.behaviors.engine,
        axis: ParallaxSpecs.behaviors.axis,
        speed: ParallaxSpecs.behaviors.speed,
        bleed: ParallaxSpecs.behaviors.bleed,
        image: '',
        video: '',
        imageHeight: ParallaxSpecs.behaviors.imageHeight,
        scale: ParallaxSpecs.behaviors.scale,
        orientation: ParallaxSpecs.behaviors.orientation,
        overflow: ParallaxSpecs.behaviors.overflow,
        delay: ParallaxSpecs.behaviors.delay,
        transition: ParallaxSpecs.behaviors.transition,
        maxTransition: ParallaxSpecs.behaviors.maxTransition,
        scrollContainer: undefined,
        respectReducedMotion: ParallaxSpecs.behaviors.respectReducedMotion,
        depthSelector: ParallaxSpecs.behaviors.depthSelector,
        relativeInput: ParallaxSpecs.behaviors.relativeInput,
        clipRelativeInput: ParallaxSpecs.behaviors.clipRelativeInput,
        hoverOnly: ParallaxSpecs.behaviors.hoverOnly,
        strengthX: ParallaxSpecs.behaviors.strengthX,
        strengthY: ParallaxSpecs.behaviors.strengthY,
        invertX: ParallaxSpecs.behaviors.invertX,
        invertY: ParallaxSpecs.behaviors.invertY,
        smoothing: ParallaxSpecs.behaviors.smoothing,
        originX: ParallaxSpecs.behaviors.originX,
        originY: ParallaxSpecs.behaviors.originY,
        gyroscope: ParallaxSpecs.behaviors.gyroscope,
        gyroRange: ParallaxSpecs.behaviors.gyroRange,
        precision: ParallaxSpecs.behaviors.precision,
        priorityLevel: PriorityLevel.MEDIUM,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
    };
}
