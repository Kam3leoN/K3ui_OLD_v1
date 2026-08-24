/**
 * @fileoverview Spécifications du composant Skeleton K3UI
 * @description Material Design 3 Expressive – placeholder de chargement (pulse / wave)
 * @see https://m3.material.io (progress indicators, placeholders)
 * @author K3UI Team
 * @version 1.0.0
 */

import type { AnimationConfig } from '../../types/components/animations';
import type { SkeletonOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Spécifications du composant Skeleton – M3 Expressive
 */
export const SkeletonSpecs = {
  // ============================================================================
  // COMPORTEMENTS PAR DÉFAUT
  // ============================================================================

  behaviors: {
    /** Variant de forme par défaut */
    defaultVariant: 'text' as const,
    /** Type d'animation par défaut (pulse = M3 standard, wave = expressive) */
    defaultAnimation: 'pulse' as const,
    /** Respecter prefers-reduced-motion */
    autoDisableForReducedMotion: true,
  },

  // ============================================================================
  // VARIANTS (formes)
  // ============================================================================

  variants: {
    available: ['text', 'circular', 'rectangular', 'rounded'] as const,
    default: 'text' as const,
  },

  // ============================================================================
  // ANIMATIONS (M3 Expressive : pulse standard, wave plus expressive)
  // ============================================================================

  animations: {
    enter: {
      type: 'fade' as const,
      duration: 200,
      easing: 'ease-out' as const,
    } as AnimationConfig,
    exit: {
      type: 'fade' as const,
      duration: 200,
      easing: 'ease-in' as const,
    } as AnimationConfig,
  },

  /** Durée du cycle d'animation pulse/wave (ms) – M3 short duration */
  animationDuration: 1500,

  /** Courbe d'easing M3 emphasized */
  animationEasing: 'cubic-bezier(0.2, 0, 0, 1)',

  // ============================================================================
  // ACCESSIBILITÉ
  // ============================================================================

  accessibility: {
    role: 'status' as const,
    /** Désactiver l'animation si prefers-reduced-motion */
    autoDisableForReducedMotion: true,
  },
};

/**
 * Extrait les valeurs par défaut pour Skeleton
 * @returns Options par défaut
 */
export function getSkeletonDefaults(): SkeletonOptions {
  return {
    priorityLevel: PriorityLevel.MEDIUM,
    variant: SkeletonSpecs.variants.default,
    animation: SkeletonSpecs.behaviors.defaultAnimation,
    width: undefined,
    height: undefined,
    autoDisableForReducedMotion: SkeletonSpecs.accessibility.autoDisableForReducedMotion,
    onOpenStart: null,
    onOpenEnd: null,
    onCloseStart: null,
    onCloseEnd: null,
  };
}
