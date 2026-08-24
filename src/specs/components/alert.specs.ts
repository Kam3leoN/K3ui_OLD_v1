/**
 * @fileoverview Spécifications du composant Alert K3UI
 * @description Encarts d'information avec encoche titre (Material You)
 * @author K3UI Team
 * @version 1.0.0
 */

import type { AlertOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Spécifications du composant Alert
 */
export const AlertSpecs = {
  colors: {
    available: ['primary', 'alert', 'info', 'warning', 'note', 'tips', 'hint'] as const,
    default: 'primary' as const,
  },

  positions: {
    available: [
      'top-start',
      'top-end',
      'bottom-start',
      'bottom-end',
      'top-center',
      'bottom-center',
      'left-center',
      'right-center',
    ] as const,
    default: 'top-end' as const,
  },

  accessibility: {
    roles: {
      primary: 'note' as const,
      alert: 'alert' as const,
      info: 'note' as const,
      warning: 'status' as const,
      note: 'note' as const,
      tips: 'note' as const,
      hint: 'note' as const,
    },
  },
} as const;

/**
 * Extrait les valeurs par défaut pour Alert
 */
export function getAlertDefaults(): AlertOptions {
  return {
    priorityLevel: PriorityLevel.MEDIUM,
    color: AlertSpecs.colors.default,
    position: AlertSpecs.positions.default,
    title: '',
    text: '',
    onOpenStart: null,
    onOpenEnd: null,
    onCloseStart: null,
    onCloseEnd: null,
  };
}
