/**
 * @fileoverview Spécifications du composant Divider K3UI
 * @description Séparateur horizontal ou vertical avec libellé optionnel
 * @author K3UI Team
 * @version 1.0.0
 */

import type { DividerOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Spécifications du composant Divider
 */
export const DividerSpecs = {
  /** Classe de base et modificateurs BEM */
  classes: {
    root: 'divider',
    verticalLine: 'divider--horizontal',
    labelStart: 'divider--start',
    labelEnd: 'divider--end',
    colorPrefix: 'divider--',
  },

  orientations: {
    available: ['horizontal', 'vertical'] as const,
    /** Trait horizontal entre blocs empilés */
    default: 'horizontal' as const,
  },

  placements: {
    available: ['start', 'end', 'center'] as const,
    default: 'center' as const,
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
    role: 'separator' as const,
  },

  /** Épaisseur CSS (alignée sur scss/tokens/divider.token.scss) */
  thicknessPx: 2,
} as const;

/**
 * Extrait les valeurs par défaut pour Divider depuis les specs
 */
export function getDividerDefaults(): DividerOptions {
  return {
    priorityLevel: PriorityLevel.LOW,
    text: '',
    orientation: DividerSpecs.orientations.default,
    placement: DividerSpecs.placements.default,
    color: DividerSpecs.colors.default,
    onOpenStart: null,
    onOpenEnd: null,
    onCloseStart: null,
    onCloseEnd: null,
  };
}
