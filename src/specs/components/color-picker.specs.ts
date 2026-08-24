/**
 * @fileoverview Spécifications du composant ColorPicker K3UI
 * @description Spécifications Material Design 3 pour le sélecteur de couleur
 * @author K3UI Team
 * @version 1.0.0
 */

import type { ColorPickerOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Spécifications du composant ColorPicker
 */
export const ColorPickerSpecs = {
  behaviors: {
    defaultValue: '#6750A4',
    showToastOnCopy: true,
  },
  accessibility: {
    role: 'group',
    autoDisableForReducedMotion: false,
  },
};

/**
 * Extrait les valeurs par défaut pour ColorPicker
 * @returns Options par défaut
 */
export function getColorPickerDefaults(): ColorPickerOptions {
  return {
    value: ColorPickerSpecs.behaviors.defaultValue,
    showToastOnCopy: ColorPickerSpecs.behaviors.showToastOnCopy,
    onChange: null,
    priorityLevel: PriorityLevel.MEDIUM,
  };
}
