/**
 * @fileoverview Spécifications du composant Avatar K3UI
 * @description Spécifications et comportements pour le composant Avatar
 * @author K3UI Team
 * @version 1.0.0
 */

import type { AnimationConfig } from '../../types/components/animations';
import { AvatarOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Spécifications du composant Avatar
 */
export const AvatarSpecs = {
  // ============================================================================
  // COMPORTEMENTS PAR DÉFAUT
  // ============================================================================

  behaviors: {
    /** Si l'avatar affiche une image */
    showImage: true,
    /** Si l'avatar affiche des initiales en fallback */
    showInitials: true,
    /** Si l'avatar affiche une icône en fallback */
    showIcon: true,
    /** Si l'avatar est cliquable */
    clickable: false,
    /** Si l'avatar est sélectionnable */
    selectable: false,
  },

  // ============================================================================
  // ANIMATIONS
  // ============================================================================

  animations: {
    enter: {
      type: 'fade' as const,
      duration: 300,
      easing: 'ease-out' as const,
    } as AnimationConfig,

    exit: {
      type: 'fade' as const,
      duration: 300,
      easing: 'ease-in' as const,
    } as AnimationConfig,

    hover: {
      type: 'scale' as const,
      duration: 200,
      easing: 'ease-out' as const,
    } as AnimationConfig,
  },

  // ============================================================================
  // ACCESSIBILITÉ
  // ============================================================================

  accessibility: {
    /** Rôle ARIA par défaut */
    role: 'img',
    /** Auto-désactiver pour mouvement réduit */
    autoDisableForReducedMotion: false,
  },

  // ============================================================================
  // TAILLES DISPONIBLES
  // ============================================================================

  sizes: {
    available: ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'] as const,
    default: 'lg' as const,
  },

  // ============================================================================
  // VARIANTS DISPONIBLES
  // ============================================================================

  variants: {
    available: ['filled', 'outlined', 'elevated'] as const,
    default: 'filled' as const,
  },

  // ============================================================================
  // FORMES DISPONIBLES
  // ============================================================================

  shapes: {
    available: ['circle', 'rounded', 'square'] as const,
    default: 'circle' as const,
  },

  // ============================================================================
  // PALETTES DE COULEURS DISPONIBLES
  // ============================================================================

  colorPalettes: {
    available: ['blue', 'red', 'green', 'purple', 'orange', 'gray'] as const,
    default: 'blue' as const,
  },

  // ============================================================================
  // BADGES DISPONIBLES
  // ============================================================================

  badges: {
    available: ['online', 'offline', 'idle', 'dnd', 'busy', 'away', null] as const,
    default: null,
  },
};

/**
 * Extrait les valeurs par défaut pour Avatar
 * @returns Options par défaut
 */
export function getAvatarDefaults(): AvatarOptions {
  return {
    // Options de base
    priorityLevel: PriorityLevel.MEDIUM,

    // Options spécifiques
    size: 'lg',
    variant: 'filled',
    shape: 'circle',
    name: '',
    imageUrl: '',
    colorPalette: 'blue',
    badge: null,

    // Callbacks
    onOpenStart: null,
    onOpenEnd: null,
    onCloseStart: null,
    onCloseEnd: null,
  };
}


