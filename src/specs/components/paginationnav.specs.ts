/**
 * @fileoverview Spécifications du composant PaginationNav K3UI
 * @description Spécifications et comportements pour le composant de navigation entre pages
 * @author K3UI Team
 * @version 1.0.0
 */

import type { AnimationConfig } from "../../types/components/animations";
import { PaginationNavOptions } from "../../types/components";
import { PriorityLevel } from "../../types/base";

/**
 * Spécifications du composant PaginationNav
 */
export const PaginationNavSpecs = {
  // ============================================================================
  // COMPORTEMENTS PAR DÉFAUT
  // ============================================================================

  behaviors: {
    /** Valeur par défaut */
    defaultValue: "default",
  },

  // ============================================================================
  // ANIMATIONS
  // ============================================================================

  animations: {
    enter: {
      type: "fade" as const,
      duration: 300,
      easing: "ease-out" as const,
    } as AnimationConfig,

    exit: {
      type: "fade" as const,
      duration: 300,
      easing: "ease-in" as const,
    } as AnimationConfig,
  },

  // ============================================================================
  // ACCESSIBILITÉ
  // ============================================================================

  accessibility: {
    /** Rôle ARIA par défaut */
    role: "navigation",
    /** Auto-désactiver pour mouvement réduit */
    autoDisableForReducedMotion: false,
  },
};

/**
 * Extrait les valeurs par défaut pour PaginationNav
 * @returns Options par défaut
 */
export function getPaginationNavDefaults(): PaginationNavOptions {
  return {
    // Options de base
    priorityLevel: PriorityLevel.MEDIUM,

    // Options spécifiques
    previous: null,
    next: null,

    // Callbacks
    onPreviousClick: null,
    onNextClick: null,
    onOpenStart: null,
    onOpenEnd: null,
    onCloseStart: null,
    onCloseEnd: null,
  };
}

