/**
 * @fileoverview Spécifications du composant WheelPicker K3UI
 * @description Sélecteur de caractères en colonnes rotatives (style arcade / initiales)
 */

import { PriorityLevel } from '../../types/base';
import type { WheelPickerOptions } from '../../types/components';

/**
 * Retourne les options par défaut du composant WheelPicker.
 * @returns Options par défaut complètes
 */
export function getWheelPickerDefaults(): WheelPickerOptions {
    return {
        length: 3,
        allowedChars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        value: '',
        showPreview: true,
        showSubmitButton: true,
        submitText: 'Sauvegarder',
        submittedText: 'Enregistré !',
        onChange: null,
        onSubmit: null,
        priorityLevel: PriorityLevel.MEDIUM,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
    };
}
