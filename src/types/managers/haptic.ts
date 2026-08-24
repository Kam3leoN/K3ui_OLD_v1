/**
 * @fileoverview Types pour le retour haptique (Vibration API)
 * @author K3UI Team
 * @version 1.0.0
 */

/**
 * Motifs de vibration prédéfinis pour les interactions K3UI.
 * - `selection` : sélection légère (liste, onglet, chip)
 * - `light` : retour discret (toggle, checkbox)
 * - `medium` : action confirmée (bouton, FAB)
 * - `success` : succès (PIN complet, validation)
 * - `error` : erreur ou refus
 */
export type HapticPattern = 'selection' | 'light' | 'medium' | 'success' | 'error';

/** Valeur passée à `navigator.vibrate()` (ms ou séquence). */
export type HapticVibrationSequence = number | number[];

/** Carte complète des motifs nommés. */
export type HapticPatternsMap = Readonly<Record<HapticPattern, HapticVibrationSequence>>;

/**
 * Options de vibration réelle sur un composant.
 * À distinguer de `haptic` (animation visuelle scale/bounce).
 */
export interface HapticFeedbackOptions {
    /**
     * Active la Vibration API sur les interactions utilisateur.
     * @default true
     */
    hapticFeedback?: boolean;
    /**
     * Motif pour l'interaction principale du composant.
     * @default selon le composant (`light`, `medium`, `selection`, etc.)
     */
    hapticPattern?: HapticPattern;
}
