/**
 * @fileoverview Spécifications pour le composant Timepicker
 * @description Valeurs par défaut et configurations pour Timepicker basé sur Material Design 3
 */

import { TimepickerOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';
import { getHapticFeedbackDefaults } from '../common/haptic-feedback.specs';

/**
 * Extrait les valeurs par défaut pour Timepicker
 * @returns Options par défaut pour Timepicker
 */
export function getTimepickerDefaults(): TimepickerOptions {
    return {
        selectedTime: null,
        format: '24h',
        locale: 'fr-FR',
        minTime: null,
        maxTime: null,
        minuteStep: 1,
        hourStep: 1,
        timeFormat: 'HH:mm',
        placeholder: undefined,
        label: undefined,
        helper: undefined,
        error: false,
        errorMessage: undefined,
        disabled: false,
        readonly: false,
        required: false,
        variant: 'filled',
        inputVariant: undefined,
        showIcon: true,
        icon: 'clock',
        showCancelButton: true,
        showConfirmButton: true,
        cancelButtonText: undefined,
        confirmButtonText: undefined,
        allowInput: true,
        allowKeyboardNavigation: true,
        preventScrolling: true,
        inDuration: 300,
        outDuration: 250,
        opacity: 0.5,
        haptic: true, // Animation haptique activée par défaut
        onSelect: null,
        onOpen: null,
        onClose: null,
        onChange: null,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
        onEvent: null,
        priorityLevel: PriorityLevel.MEDIUM,
        ...getHapticFeedbackDefaults('selection'),
    };
}








