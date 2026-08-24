/**
 * @fileoverview Spécifications du composant Gradient K3UI
 * @description Spécifications et comportements pour le texte en dégradé
 * @author K3UI Team
 * @version 1.0.0
 */

import type { GradientOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Spécifications du composant Gradient
 */
export const GradientSpecs = {
    behaviors: {
        inline: true,
        supportsCustomElement: true,
        supportsDatasetConfiguration: true,
    },
    effects: {
        gradientType: 'linear',
        textClipping: true,
        reducedMotionSensitive: false,
    },
    accessibility: {
        role: 'text' as const,
    },
} as const;

/**
 * Retourne les options par défaut du composant Gradient
 * @returns Les options par défaut
 */
export function getGradientDefaults(): GradientOptions {
    return {
        colors: ['#0575E6', '#021B79', '#0575E6'],
        angle: 90,
        text: '',
        backgroundSize: '100%',
        priorityLevel: PriorityLevel.MEDIUM,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
    };
}
