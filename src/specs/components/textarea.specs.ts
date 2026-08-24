/**
 * @fileoverview Spécifications dérivées pour Textarea (scindées de FormsSpecs)
 * @description Fournit getTextareaDefaults() en s'appuyant sur FormsSpecs
 */

import { FormsSpecs } from './forms.specs';
import { TextareaOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Extrait les valeurs par défaut pour Textarea depuis les FormsSpecs
 * @returns Options par défaut pour Textarea
 */
export function getTextareaDefaults(): TextareaOptions {
	return {
		variant: 'filled',
		label: undefined,
		placeholder: undefined,
		rows: FormsSpecs.fieldTypes.config.textarea.rows || 3,
		maxLength: undefined,
		helperText: undefined,
		errorText: undefined,
		disabled: FormsSpecs.behaviors.disabled,
		required: false,
		readonly: FormsSpecs.behaviors.readonly,
		autosize: FormsSpecs.behaviors.autoResizeTextareas,
		showCounter: false,
		name: '',
		value: '',
		onFocus: null,
		onBlur: null,
		onChange: null,
		onInput: null,
		onInvalid: null,
		onOpenStart: null,
		onOpenEnd: null,
		onCloseStart: null,
		onCloseEnd: null,
		onEvent: null,
		priorityLevel: PriorityLevel.MEDIUM,
	};
}
