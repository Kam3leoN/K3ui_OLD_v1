/**
 * @fileoverview Spécifications du composant Counter K3UI
 * @description Spécifications et comportements pour le compteur
 * @author K3UI Team
 * @version 1.0.0
 */

import type { CounterOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Spécifications du composant Counter
 */
export const CounterSpecs = {
    behaviors: {
        value: 0,
        allowNegative: false,
        step: 1,
    },
    accessibility: {
        role: 'group',
        ariaLabelDecrement: 'Décrémenter',
        ariaLabelIncrement: 'Incrémenter',
        ariaLabelValue: 'Valeur actuelle',
    },
};

/**
 * Extrait les valeurs par défaut pour Counter
 * @returns Options par défaut
 */
export function getCounterDefaults(): CounterOptions {
    return {
        value: 0,
        allowNegative: false,
        min: undefined,
        max: undefined,
        step: 1,
        decimals: 0,
        readonly: false,
        disabled: false,
        validate: undefined,
        size: 'md',
        asyncChange: false,
        onChange: null,
        onValidateError: null,
        onValidationErrorEnd: null,
        onIncrement: null,
        onDecrement: null,
        priorityLevel: PriorityLevel.MEDIUM,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
        ariaLabelDecrement: CounterSpecs.accessibility.ariaLabelDecrement,
        ariaLabelIncrement: CounterSpecs.accessibility.ariaLabelIncrement,
        ariaLabelValue: CounterSpecs.accessibility.ariaLabelValue,
    } as CounterOptions;
}
