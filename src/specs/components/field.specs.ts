/**
 * @fileoverview Spécifications dérivées pour Field (scindées de FormsSpecs)
 * @description Fournit getFieldDefaults() en s'appuyant sur FormsSpecs
 */

// Imports depuis les specs Formes communes
import { FormsSpecs } from './forms.specs';
import { FieldOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Extrait les valeurs par défaut pour Field depuis les FormsSpecs
 * @returns Options par défaut pour Field
 */
export function getFieldDefaults(): FieldOptions {
	return {
		variant: 'filled',
		type: FormsSpecs.fieldTypes.default,
		name: '',
		value: '',
		defaultValue: '',
		label: undefined,
		placeholder: undefined,
		helper: undefined,
		helperOnFocus: false,
		clearable: false,
		clearIcon: 'xmark',
		endAligned: false,
		prefix: undefined,
		suffix: undefined,
		leadingIcon: undefined,
		trailingIcon: undefined,
		errorIcon: 'error',
		readonly: FormsSpecs.behaviors.readonly,
		disabled: FormsSpecs.behaviors.disabled,
		required: false,
		rows: null,
		autosize: FormsSpecs.behaviors.autoResizeTextareas,
		minRows: null,
		maxRows: null,
		minLength: null,
		maxLength: null,
		counter: false,
		minCounter: null,
		maxCounter: null,
		step: null,
		pattern: null,
		togglePassword: false,
		showPasswordIcon: 'eye',
		hidePasswordIcon: 'eye-slash',
		autocapitalize: null,
		autocorrect: null,
		autocomplete: null,
		enterkeyhint: null,
		spellcheck: false,
		inputmode: null,
		filledBg: null,
		notchBg: null,
		onFocus: null,
		onBlur: null,
		onChange: null,
		onInput: null,
		validationMessage: null,
		onInvalid: null,
		onClear: null,
		onOpenStart: null,
		onOpenEnd: null,
		onCloseStart: null,
		onCloseEnd: null,
        onEvent: null,
        priorityLevel: PriorityLevel.MEDIUM,
        density: '',
    };
}
