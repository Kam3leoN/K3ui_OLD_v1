/**
 * @fileoverview Spécifications du composant ButtonSmart K3UI
 * @description Tuile réglages rapides façon Material You (Android) — morph pill/squircle, marquee AOSP
 * @author K3UI Team
 * @version 1.0.0
 */

import type { ButtonSmartOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';
import { getHapticFeedbackDefaults } from '../common/haptic-feedback.specs';

/**
 * Spécifications du composant ButtonSmart
 */
export const ButtonSmartSpecs = {
    behaviors: {
        defaultActive: false,
        defaultActiveSubtitle: 'Activé',
        defaultInactiveSubtitle: '',
        defaultHapticDuration: 15,
        marqueeDelayMs: 1200,
        marqueeRestartDelayMs: 1200,
        marqueeDpPerSecond: 30,
    },
    accessibility: {
        role: 'button',
        autoDisableMarqueeForReducedMotion: true,
    },
};

/**
 * Extrait les valeurs par défaut pour ButtonSmart
 * @returns Options par défaut
 */
export function getButtonSmartDefaults(): ButtonSmartOptions {
    return {
        priorityLevel: PriorityLevel.MEDIUM,
        label: '',
        activeSubtitle: ButtonSmartSpecs.behaviors.defaultActiveSubtitle,
        inactiveSubtitle: ButtonSmartSpecs.behaviors.defaultInactiveSubtitle,
        active: ButtonSmartSpecs.behaviors.defaultActive,
        disabled: false,
        hapticDuration: ButtonSmartSpecs.behaviors.defaultHapticDuration,
        ...getHapticFeedbackDefaults('light'),
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
        onToggle: null,
    };
}
