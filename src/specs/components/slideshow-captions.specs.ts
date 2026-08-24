/**
 * @fileoverview Spécifications du composant SlideshowCaptions K3UI
 * @description Synergy : paires de lignes, croisement au centre de la largeur ; marquee optionnel
 */

import type { SlideshowCaptionsOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Easing synergy « thème Synergy » : rapide en début/fin de trajet, fort ralentissement au milieu
 * (proche de l’ancien `SlowMo.ease.config(0.7, 0.96)`), sans charger GSAP EasePack.
 * Passer à `data-ease` / option `ease`, ou utiliser une chaîne GSAP classique (ex. `sine.inOut`).
 */
export const SYNERGY_EASE_THEME_CROSS = 'synergy.slowCross';

export const SlideshowCaptionsSpecs = {
    behaviors: {
        defaultMode: 'synergy' as const,
        // Synergy : plafond d'enfants (paires de 2) ; marquee : 2 premières lignes seulement
        defaultMaxCaptionLines: 12,
        defaultMarqueeSpeed: 72,
        defaultMarqueeSegmentGap: 48,
        defaultDuration: 5,
        defaultLineGap: 40,
        // Réservé (ne modifie plus le centrage ; anciennement ajouté à la largeur mesurée par erreur).
        defaultWidthExtra: 0,
        defaultEase: SYNERGY_EASE_THEME_CROSS,
    },
    accessibility: {
        autoDisableForReducedMotion: true,
    },
} as const;

export function getSlideshowCaptionsDefaults(): SlideshowCaptionsOptions {
    return {
        priorityLevel: PriorityLevel.MEDIUM,
        mode: SlideshowCaptionsSpecs.behaviors.defaultMode,
        maxCaptionLines: SlideshowCaptionsSpecs.behaviors.defaultMaxCaptionLines,
        marqueeSpeed: SlideshowCaptionsSpecs.behaviors.defaultMarqueeSpeed,
        marqueeSegmentGap: SlideshowCaptionsSpecs.behaviors.defaultMarqueeSegmentGap,
        duration: SlideshowCaptionsSpecs.behaviors.defaultDuration,
        lineGap: SlideshowCaptionsSpecs.behaviors.defaultLineGap,
        widthExtra: SlideshowCaptionsSpecs.behaviors.defaultWidthExtra,
        autoStart: true,
        loop: true,
        viewport: 'window',
        ease: SlideshowCaptionsSpecs.behaviors.defaultEase,
        disableForReducedMotion: SlideshowCaptionsSpecs.accessibility.autoDisableForReducedMotion,
        onCycleStart: null,
        onCycleComplete: null,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
    };
}
