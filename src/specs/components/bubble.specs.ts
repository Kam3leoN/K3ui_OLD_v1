/**
 * @fileoverview Spécifications du composant Bubble K3UI
 * @description Bulles de conversation (placement, couleurs, accessibilité)
 * @author K3UI Team
 * @version 1.0.0
 */

import type { BubbleOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Spécifications du composant Bubble
 */
export const BubbleSpecs = {
  placements: {
    available: ['start', 'end'] as const,
    default: 'start' as const,
  },

  colors: {
    available: [
      'default',
      'primary',
      'secondary',
      'accent',
      'neutral',
      'info',
      'success',
      'warning',
      'error',
    ] as const,
    default: 'default' as const,
  },

  accessibility: {
    role: 'group' as const,
  },
} as const;

/**
 * Extrait les valeurs par défaut pour Bubble depuis les specs
 */
export function getBubbleDefaults(): BubbleOptions {
  return {
    priorityLevel: PriorityLevel.MEDIUM,
    placement: BubbleSpecs.placements.default,
    color: BubbleSpecs.colors.default,
    onOpenStart: null,
    onOpenEnd: null,
    onCloseStart: null,
    onCloseEnd: null,
  };
}
