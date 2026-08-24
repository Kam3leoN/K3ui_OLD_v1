/**
 * @fileoverview Spécifications dérivées pour Pin (scindées de FormsSpecs)
 * @description Fournit getPinDefaults() en s'appuyant sur FormsSpecs
 */

import { FormsSpecs } from './forms.specs';
import { PinOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';
import { getHapticFeedbackDefaults } from '../common/haptic-feedback.specs';

/**
 * Extrait les valeurs par défaut pour Pin depuis les FormsSpecs
 * @returns Options par défaut pour Pin
 */
export function getPinDefaults(): PinOptions {
	return {
		variant: 'filled',
		length: FormsSpecs.behaviors.pinLength || 6,
		type: 'password',
		inputType: FormsSpecs.behaviors.pinType === 'numeric' ? 'numbers' : 'mixed',
		caseSensitive: true,
		pinHelper: null,
		pinCounter: true,
		focusDelay: 0,
		allowBackspace: true,
		allowPaste: true,
		onComplete: null,
		onFocus: null,
		onBlur: null,
		onOpenStart: null,
		onOpenEnd: null,
		onCloseStart: null,
		onCloseEnd: null,
		onEvent: null,
		expectedCode: null,
		enableValidation: false,
		onValid: null,
		onInvalid: null,
		priorityLevel: PriorityLevel.MEDIUM,
		...getHapticFeedbackDefaults('selection'),
	};
}
