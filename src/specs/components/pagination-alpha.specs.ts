/**
 * @fileoverview Spécifications du composant PaginationAlpha K3UI
 * @description Index alphabétique A–Z MD3 Expressive (navigation par lettre)
 * @author K3UI Team
 * @version 1.0.0
 */

import type { AnimationConfig } from "../../types/components/animations";
import type { PaginationAlphaOptions } from "../../types/components";
import { PriorityLevel } from "../../types/base";

/**
 * Spécifications du composant PaginationAlpha
 */
export const PaginationAlphaSpecs = {
  /** Alphabet utilisé pour l'index */
  alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),

  behaviors: {
    defaultValue: "default",
  },

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

  accessibility: {
    role: "navigation" as const,
    autoDisableForReducedMotion: false,
  },
};

/**
 * Valeurs par défaut pour PaginationAlpha
 * @returns Options par défaut
 */
export function getPaginationAlphaDefaults(): PaginationAlphaOptions {
  return {
    items: [],
    activeLetter: "A",
    onSelect: null,
    size: "md",
    orientation: "horizontal",
    showCount: false,
    showDisabled: true,
    animated: true,
    colorScheme: "primary",
    density: "normal",
    priorityLevel: PriorityLevel.MEDIUM,
    onOpenStart: null,
    onOpenEnd: null,
    onCloseStart: null,
    onCloseEnd: null,
  };
}
