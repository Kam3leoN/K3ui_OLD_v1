/**
 * @fileoverview Défauts partagés pour le retour haptique vibratoire (Vibration API)
 * @description Distinct de l'option `haptic` = animation visuelle uniquement
 */

import type { HapticPattern } from '../../types/managers/haptic';

/** Active le retour vibratoire par défaut sur les contrôles interactifs. */
export const HAPTIC_FEEDBACK_ENABLED_DEFAULT = true;

/**
 * Options haptiques par défaut pour un composant.
 * @param pattern - Motif {@link HapticPattern} pour l'interaction principale
 */
export function getHapticFeedbackDefaults(pattern: HapticPattern = 'light'): {
    hapticFeedback: boolean;
    hapticPattern: HapticPattern;
} {
    return {
        hapticFeedback: HAPTIC_FEEDBACK_ENABLED_DEFAULT,
        hapticPattern: pattern,
    };
}
