/**
 * @fileoverview Retour haptique centralisé via la Vibration API
 * @description Vibrations réelles sur appareils compatibles ; dégradation silencieuse ailleurs.
 * @author K3UI Team
 * @version 1.0.0
 */

import type {
    HapticFeedbackOptions,
    HapticPattern,
    HapticPatternsMap,
    HapticVibrationSequence,
} from '../../types/managers/haptic';
import { MotionManager } from './MotionManager';

export type {
    HapticFeedbackOptions,
    HapticPattern,
    HapticPatternsMap,
    HapticVibrationSequence,
} from '../../types/managers/haptic';

/** Motifs par défaut (durées en ms). */
const DEFAULT_PATTERNS: HapticPatternsMap = {
    selection: 10,
    light: 15,
    medium: 25,
    success: [15, 40, 15],
    error: [30, 50, 30],
};

/**
 * Gestionnaire global du retour haptique (smartphone / appareils compatibles).
 * Ne lève jamais d'exception : no-op sur desktop, iOS Safari, API absente ou mouvement réduit.
 */
export class HapticManager {
    private static _instance: HapticManager | null = null;

    /** Activation globale (désactivable par l'application). */
    private static _enabled = true;

    /** Motifs actifs (surchargeables via {@link setPattern} / {@link setPatterns}). */
    private static _patterns: Record<HapticPattern, HapticVibrationSequence> = HapticManager.cloneDefaultPatterns();

    /**
     * Retourne l'instance unique du manager.
     * @returns Instance partagée de {@link HapticManager}
     */
    static create(): HapticManager {
        if (!HapticManager._instance) {
            HapticManager._instance = new HapticManager();
        }
        return HapticManager._instance;
    }

    /**
     * Active ou désactive toutes les vibrations haptiques.
     * @param enabled - `true` pour autoriser les vibrations (défaut)
     */
    static setEnabled(enabled: boolean): void {
        HapticManager._enabled = enabled;
    }

    /**
     * Indique si le retour haptique est autorisé au niveau application.
     */
    static isEnabled(): boolean {
        return HapticManager._enabled;
    }

    /**
     * Retourne une copie des motifs actuels.
     */
    static getPatterns(): HapticPatternsMap {
        return HapticManager.clonePatternsMap(HapticManager._patterns);
    }

    /**
     * Retourne une copie du motif nommé.
     * @param pattern - Nom du motif
     */
    static getPattern(pattern: HapticPattern): HapticVibrationSequence {
        const value = HapticManager._patterns[pattern];
        return Array.isArray(value) ? [...value] : value;
    }

    /**
     * Remplace un motif prédéfini (ex. `selection: 8` ou `success: [10, 30, 10]`).
     * @param pattern - Clé du motif
     * @param sequence - Durée (ms) ou séquence [vibre, pause, vibre, …]
     */
    static setPattern(pattern: HapticPattern, sequence: HapticVibrationSequence): void {
        if (!HapticManager.isValidSequence(sequence)) {
            return;
        }
        HapticManager._patterns[pattern] = Array.isArray(sequence) ? [...sequence] : sequence;
    }

    /**
     * Surcharge plusieurs motifs en une fois.
     * @param overrides - Sous-ensemble des motifs à mettre à jour
     */
    static setPatterns(overrides: Partial<Record<HapticPattern, HapticVibrationSequence>>): void {
        (Object.keys(overrides) as HapticPattern[]).forEach((key) => {
            const sequence = overrides[key];
            if (sequence !== undefined) {
                HapticManager.setPattern(key, sequence);
            }
        });
    }

    /**
     * Restaure les motifs d'usine par défaut.
     */
    static resetPatterns(): void {
        HapticManager._patterns = HapticManager.cloneDefaultPatterns();
    }

    /**
     * Déclenche une vibration selon un motif prédéfini.
     * @param pattern - Motif sémantique
     */
    vibrate(pattern: HapticPattern): void {
        HapticManager.vibrate(pattern);
    }

    /**
     * Déclenche une vibration (API statique).
     * @param pattern - Motif sémantique enregistré
     */
    static vibrate(pattern: HapticPattern): void {
        HapticManager.vibrateSequence(HapticManager._patterns[pattern]);
    }

    /**
     * Déclenche une séquence arbitraire (hors motifs nommés).
     * @param sequence - Valeur `navigator.vibrate()`
     */
    static vibrateRaw(sequence: HapticVibrationSequence): void {
        HapticManager.vibrateSequence(sequence);
    }

    /**
     * Déclenche une vibration si `hapticFeedback` est activé sur le composant.
     * @param options - Options du composant (`hapticFeedback`, `hapticPattern`)
     * @param fallbackPattern - Motif si `hapticPattern` est absent
     */
    static triggerFromOptions(
        options: HapticFeedbackOptions,
        fallbackPattern: HapticPattern = 'light'
    ): void {
        if (options.hapticFeedback !== true) {
            return;
        }
        HapticManager.vibrate(options.hapticPattern ?? fallbackPattern);
    }

    /**
     * Réinitialise l'état interne (tests).
     * @internal
     */
    static resetForTests(): void {
        HapticManager._instance = null;
        HapticManager._enabled = true;
        HapticManager.resetPatterns();
    }

    private static vibrateSequence(sequence: HapticVibrationSequence | undefined): void {
        if (!HapticManager._enabled || sequence === undefined) {
            return;
        }
        if (!HapticManager.isVibrationSupported()) {
            return;
        }
        if (HapticManager.isReducedMotionPreferred()) {
            return;
        }
        if (!HapticManager.isValidSequence(sequence)) {
            return;
        }
        try {
            navigator.vibrate(sequence);
        } catch {
            // Dégradation silencieuse
        }
    }

    private static isValidSequence(sequence: HapticVibrationSequence): boolean {
        if (typeof sequence === 'number') {
            return Number.isFinite(sequence) && sequence >= 0;
        }
        return (
            sequence.length > 0 &&
            sequence.every((n) => typeof n === 'number' && Number.isFinite(n) && n >= 0)
        );
    }

    private static cloneDefaultPatterns(): Record<HapticPattern, HapticVibrationSequence> {
        return HapticManager.clonePatternsMap(DEFAULT_PATTERNS);
    }

    private static clonePatternsMap(
        source: Record<HapticPattern, HapticVibrationSequence>
    ): Record<HapticPattern, HapticVibrationSequence> {
        const out = {} as Record<HapticPattern, HapticVibrationSequence>;
        (Object.keys(source) as HapticPattern[]).forEach((key) => {
            const value = source[key];
            out[key] = Array.isArray(value) ? [...value] : value;
        });
        return out;
    }

    private static isVibrationSupported(): boolean {
        return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
    }

    /**
     * Respecte `prefers-reduced-motion` et l'override global {@link MotionManager}.
     */
    private static isReducedMotionPreferred(): boolean {
        if (typeof window === 'undefined') {
            return true;
        }
        MotionManager.init();
        return MotionManager.isReducedMotion();
    }
}
