/**
 * @fileoverview Spécifications du composant Countdown K3UI
 * @description Spécifications et comportements pour le compte à rebours
 * @author K3UI Team
 * @version 1.0.0
 */

import type { CountdownOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Spécifications du composant Countdown
 */
export const CountdownSpecs = {
    behaviors: {
        time: 0,
        format: 'HH : mm : ss',
        autoStart: true,
    },
    accessibility: {
        role: 'timer',
        liveRegion: 'polite',
        autoDisableForReducedMotion: true,
    },
};

/**
 * Extrait les valeurs par défaut pour Countdown
 * @returns Options par défaut
 */
export function getCountdownDefaults(): CountdownOptions {
    return {
        time: 0,
        endDate: null,
        endMessage: '',
        format: 'HH : mm : ss',
        autoStart: true,
        onEnd: null,
        onChange: null,
        shortLabels: false,
        priorityLevel: PriorityLevel.MEDIUM,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
    };
}
