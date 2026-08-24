/**
 * @fileoverview Spécifications du composant MessageBox K3UI
 * @description Boîte de dialogue type « The Legend of Zelda: A Link to the Past »
 *              (effet machine à écrire, pagination, système de choix, sons).
 * @author K3UI Team
 * @version 1.0.0
 */

import type { MessageBoxOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Spécifications du composant MessageBox
 */
export const MessageBoxSpecs = {
    // ============================================================================
    // COMPORTEMENTS PAR DÉFAUT
    // ============================================================================

    behaviors: {
        /** Délai (ms) entre chaque caractère */
        charDelay: 45,
        /** Pause (ms) après une ponctuation */
        punctuationDelay: 220,
        /** Nombre maximum de caractères par ligne (wrapping mot à mot) */
        maxCharsPerLine: 28,
        /** Nombre de lignes visibles par page (borné entre 1 et 5) */
        maxLines: 3,
        /** Jouer un son toutes les N lettres */
        soundEvery: 2,
        /** Échelle de rendu du pixel-art (multiplicateur des sprites natifs) */
        scale: 2,
        /** Activer la détection de swipe (avance comme un clic) */
        swipe: true,
        /** Fermer la boîte avec la touche Échap */
        closeOnEscape: true,
    },

    /** Bornes du nombre de lignes affichées */
    lines: {
        min: 1,
        max: 5,
    },

    // ============================================================================
    // POSITIONS À L'ÉCRAN
    // ============================================================================

    positions: {
        available: [
            'center',
            'top',
            'top-left',
            'top-right',
            'bottom',
            'bottom-left',
            'bottom-right',
            'left',
            'right',
        ] as const,
        /** Centrée parfaitement (horizontalement et verticalement) */
        default: 'center' as const,
    },

    // ============================================================================
    // ORIENTATION DES CHOIX
    // ============================================================================

    orientations: {
        available: ['vertical', 'horizontal'] as const,
        default: 'vertical' as const,
    },

    // ============================================================================
    // OVERLAY (fond derrière la boîte)
    // ============================================================================

    overlay: {
        available: ['none', 'scrim', 'blur', 'both'] as const,
        /** Overlay blur par défaut (au-dessus du contenu, sous la boîte) */
        default: 'blur' as const,
        /** Opacité du voile noir (0..1) — utilisé avec scrim/both */
        opacity: 0.5,
        /** Flou de l'arrière-plan (px) */
        blur: 4,
    },

    // ============================================================================
    // SONS (Web Audio API)
    // ============================================================================

    audio: {
        /** Sons activés par défaut */
        enabled: true,
        /** Chemin de base des sons (aligné sur SoundFXManager) */
        soundsPath: '/k3ui-docs/assets/sounds/',
        /** Son joué à chaque lettre */
        letterSound: 'message_letter.ogg',
        /** Son joué à la fin d'une page / d'un choix */
        doneSound: 'message_end.ogg',
        /** Volume par défaut (0..1) */
        volume: 0.5,
    },

    // ============================================================================
    // ACCESSIBILITÉ
    // ============================================================================

    accessibility: {
        /** Rôle ARIA de la zone de texte */
        textLive: 'polite' as const,
        /** Libellés ARIA par défaut */
        labels: {
            continue: 'Continuer',
            dialog: 'Boîte de dialogue',
        },
        /** Auto-désactiver les animations pour mouvement réduit */
        autoDisableForReducedMotion: true,
    },
} as const;

/**
 * Extrait les valeurs par défaut pour MessageBox depuis les specs
 * @returns Options par défaut pour MessageBox
 */
export function getMessageBoxDefaults(): MessageBoxOptions {
    return {
        charDelay: MessageBoxSpecs.behaviors.charDelay,
        punctuationDelay: MessageBoxSpecs.behaviors.punctuationDelay,
        maxCharsPerLine: MessageBoxSpecs.behaviors.maxCharsPerLine,
        maxLines: MessageBoxSpecs.behaviors.maxLines,
        soundEvery: MessageBoxSpecs.behaviors.soundEvery,
        scale: MessageBoxSpecs.behaviors.scale,
        swipe: MessageBoxSpecs.behaviors.swipe,
        closeOnEscape: MessageBoxSpecs.behaviors.closeOnEscape,
        autoDisableForReducedMotion: MessageBoxSpecs.accessibility.autoDisableForReducedMotion,

        position: MessageBoxSpecs.positions.default,
        choiceOrientation: MessageBoxSpecs.orientations.default,

        overlay: MessageBoxSpecs.overlay.default,
        overlayOpacity: MessageBoxSpecs.overlay.opacity,
        overlayBlur: MessageBoxSpecs.overlay.blur,

        soundEnabled: MessageBoxSpecs.audio.enabled,
        soundsPath: MessageBoxSpecs.audio.soundsPath,
        letterSound: MessageBoxSpecs.audio.letterSound,
        doneSound: MessageBoxSpecs.audio.doneSound,
        volume: MessageBoxSpecs.audio.volume,

        message: '',
        choices: [],
        classes: '',

        priorityLevel: PriorityLevel.MEDIUM,

        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
    };
}
