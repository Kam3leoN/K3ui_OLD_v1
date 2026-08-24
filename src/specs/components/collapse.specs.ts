/**
 * @fileoverview Spécifications du composant Collapse K3UI
 * @description Accordion Material Design 3 Expressive (ouverture exclusive par défaut)
 * @author K3UI Team
 * @version 1.0.0
 */

import type { CollapseOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Spécifications du composant Collapse
 */
export const CollapseSpecs = {
  behaviors: {
    exclusive: true,
    openIndex: null as number | null,
    animationDuration: 450,
    chevronIcon: 'chevron-down',
    closingFadeMs: 150,
  },

  radii: {
    xl: 28,
    xs: 4,
    gap: 4,
  },

  accessibility: {
    role: 'region' as const,
  },

  animations: {
    expand: {
      duration: 450,
      easing: 'cubic-bezier(0.2, 0, 0, 1)',
    },
    fadeIn: {
      duration: 250,
      delay: 80,
      easing: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
    },
    fadeOut: {
      duration: 120,
      easing: 'cubic-bezier(0.3, 0, 0.8, 0.15)',
    },
  },
} as const;

/**
 * Extrait les valeurs par défaut pour Collapse
 * @returns Options par défaut
 */
export function getCollapseDefaults(): CollapseOptions {
  return {
    priorityLevel: PriorityLevel.MEDIUM,
    exclusive: CollapseSpecs.behaviors.exclusive,
    openIndex: CollapseSpecs.behaviors.openIndex,
    animationDuration: CollapseSpecs.behaviors.animationDuration,
    chevronIcon: CollapseSpecs.behaviors.chevronIcon,
    onChange: null,
    onOpenStart: null,
    onOpenEnd: null,
    onCloseStart: null,
    onCloseEnd: null,
  };
}
