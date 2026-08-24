/**
 * @fileoverview Spécifications du composant Breadcrumb K3UI
 * @description Fil d'Ariane (breadcrumb) MD3 Expressive
 * @author K3UI Team
 * @version 1.0.0
 */

import type { AnimationConfig } from '../../types/components/animations';
import { BreadcrumbOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Spécifications du composant Breadcrumb
 */
export const BreadcrumbSpecs = {
  behaviors: {
    variant: 'plain' as const,
    separator: 'chevron' as const,
    size: 'medium' as const,
    showIcons: true,
    collapseAfter: null as number | null,
  },

  animations: {
    enter: {
      type: 'fade' as const,
      duration: 200,
      easing: 'ease-out' as const,
    } as AnimationConfig,

    exit: {
      type: 'fade' as const,
      duration: 150,
      easing: 'ease-in' as const,
    } as AnimationConfig,
  },

  accessibility: {
    role: 'navigation' as const,
    ariaLabel: 'Fil d’Ariane',
    autoDisableForReducedMotion: false,
  },

  separators: {
    chevron: '›',
    slash: '/',
    dot: '•',
    arrow: '→',
  },
};

/**
 * Valeurs par défaut pour Breadcrumb
 * @returns Options par défaut
 */
export function getBreadcrumbDefaults(): BreadcrumbOptions {
  return {
    priorityLevel: PriorityLevel.MEDIUM,
    items: [],
    variant: BreadcrumbSpecs.behaviors.variant,
    separator: BreadcrumbSpecs.behaviors.separator,
    size: BreadcrumbSpecs.behaviors.size,
    showIcons: BreadcrumbSpecs.behaviors.showIcons,
    collapseAfter: BreadcrumbSpecs.behaviors.collapseAfter,
    onItemClick: null,
    onOpenStart: null,
    onOpenEnd: null,
    onCloseStart: null,
    onCloseEnd: null,
  };
}
