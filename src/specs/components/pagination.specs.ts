/**
 * @fileoverview Spécifications du composant Pagination K3UI
 * @description Spécifications et comportements pour la pagination numérique MD3 Expressive
 * @author K3UI Team
 * @version 1.0.0
 */

import type { AnimationConfig } from "../../types/components/animations";
import { PaginationOptions } from "../../types/components";
import { PriorityLevel } from "../../types/base";
import { getHapticFeedbackDefaults } from "../common/haptic-feedback.specs";

/**
 * Spécifications du composant Pagination
 */
export const PaginationSpecs = {
  // ============================================================================
  // COMPORTEMENTS PAR DÉFAUT
  // ============================================================================

  behaviors: {
    /** Valeur par défaut (réservé pour de futurs usages) */
    defaultValue: "default",
  },

  // ============================================================================
  // ANIMATIONS
  // ============================================================================

  animations: {
    enter: {
      type: "fade" as const,
      duration: 200,
      easing: "ease-out" as const,
    } as AnimationConfig,

    exit: {
      type: "fade" as const,
      duration: 150,
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
 * Valeurs par défaut pour Pagination
 * @returns Options par défaut
 */
export function getPaginationDefaults(): PaginationOptions {
  return {
    page: 1,
    count: 10,
    siblingCount: 1,
    showFirst: true,
    showLast: true,
    showPrev: true,
    showNext: true,
    firstLabel: undefined,
    prevLabel: undefined,
    nextLabel: undefined,
    lastLabel: undefined,
    onChange: null,
    disabled: false,
    priorityLevel: PriorityLevel.MEDIUM,
    onOpenStart: null,
    onOpenEnd: null,
    onCloseStart: null,
    onCloseEnd: null,
    ...getHapticFeedbackDefaults('selection'),
  };
}

