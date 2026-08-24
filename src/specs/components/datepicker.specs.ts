/**
 * @fileoverview Spécifications pour le composant Datepicker
 * @description Valeurs par défaut et configurations pour Datepicker basé sur Material Design 3
 */

import { DatepickerOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';
import { getHapticFeedbackDefaults } from '../common/haptic-feedback.specs';

/**
 * Extrait les valeurs par défaut pour Datepicker
 * @returns Options par défaut pour Datepicker
 */
export function getDatepickerDefaults(): DatepickerOptions {
    return {
        mode: 'single',
        selectedDate: null,
        startDate: null,
        endDate: null,
        rangeSeparator: ' - ',
        locale: 'fr-FR',
        minDate: null,
        maxDate: null,
        disabledDates: [],
        firstDayOfWeek: 1, // Lundi par défaut (0 = Dimanche, 1 = Lundi)
        dateFormat: 'DD/MM/YYYY',
        displayFormat: 'DD/MM/YYYY',
        placeholder: 'Sélectionner une date',
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
        icon: 'calendar',
        showTodayButton: true,
        showClearButton: true,
        showCancelButton: true,
        showConfirmButton: true,
        clearButtonText: 'Effacer',
        cancelButtonText: 'Annuler',
        confirmButtonText: 'Confirmer',
        viewMode: 'calendar', // 'calendar' | 'year' | 'input'
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

