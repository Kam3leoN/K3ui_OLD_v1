/**
 * @fileoverview Spécifications du composant Comparison K3UI
 * @description Comparaison avant/après avec curseur glissant
 * @author K3UI Team
 * @version 1.0.0
 */

import type { ComparisonOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Spécifications du composant Comparison
 */
export const ComparisonSpecs = {
    behaviors: {
        position: 50,
        min: 0,
        max: 100,
        step: 5,
        showLabels: true,
        aspectRatio: '16 / 9',
        disabled: false,
    },

    accessibility: {
        role: 'slider',
        autoDisableForReducedMotion: false,
    },
};

/**
 * Extrait les valeurs par défaut pour Comparison
 * @returns Options par défaut pour Comparison
 */
export function getComparisonDefaults(): ComparisonOptions {
    return {
        beforeImage: '',
        afterImage: '',
        beforeLabel: '',
        afterLabel: '',
        beforeAlt: '',
        afterAlt: '',
        position: ComparisonSpecs.behaviors.position,
        min: ComparisonSpecs.behaviors.min,
        max: ComparisonSpecs.behaviors.max,
        step: ComparisonSpecs.behaviors.step,
        showLabels: ComparisonSpecs.behaviors.showLabels,
        aspectRatio: ComparisonSpecs.behaviors.aspectRatio,
        disabled: ComparisonSpecs.behaviors.disabled,
        onChange: null,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
        priorityLevel: PriorityLevel.MEDIUM,
    };
}
