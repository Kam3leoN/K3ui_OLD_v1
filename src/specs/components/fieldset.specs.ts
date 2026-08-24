/**
 * @fileoverview Spécifications pour Fieldset
 */

import { FieldsetOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Retourne les options par défaut de Fieldset
 */
export function getFieldsetDefaults(): FieldsetOptions {
    return {
        headline: '',
        supportingText: '',
        density: 'default',
        columns: 1,
        collapsible: false,
        open: true,
        disabled: false,
        error: null,
        chevronIcon: 'chevron-down',
        errorIcon: 'circle-exclamation',
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
        onEvent: null,
        priorityLevel: PriorityLevel.MEDIUM,
    };
}

/** Chaînes localisables pour Fieldset */
export const FieldsetStrings = {
    manyInvalid: (count: number, headline: string) =>
        `${count} champs à corriger dans « ${headline} »`,
    oneInvalid: (label: string) => `Complétez « ${label} »`,
    invalidFallback: 'Ce champ est à corriger',
    collapse: (headline: string) => `Replier ${headline}`,
    expand: (headline: string) => `Déplier ${headline}`,
};

