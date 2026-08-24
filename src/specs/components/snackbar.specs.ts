/**
 * @fileoverview Spécifications du composant Snackbar K3UI
 * @description Spécifications et comportements pour les notifications snackbar
 * @author K3UI Team
 * @version 1.0.0
 */

import type { AnimationConfig } from '../../types/components/animations';
import { SnackbarOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';
import { getHapticFeedbackDefaults } from '../common/haptic-feedback.specs';
import { MotionPresets } from '../common/motion-presets.specs';

/**
 * Spécifications du composant Snackbar
 */
export const SnackbarSpecs = {
    // ============================================================================
    // COMPORTEMENTS PAR DÉFAUT
    // ============================================================================

    behaviors: {
        /** Auto-dismiss par défaut */
        autoDismiss: true,
        /** Durée par défaut d'affichage */
        defaultDuration: 5000,
        /** Nombre maximum de snackbars simultanés */
        maxSnackbars: 3,
        /** Type de stacking (vertical uniquement) */
        stacking: 'vertical' as const,
        /** Espacement entre les snackbars */
        spacing: 8,
        /** Si les snackbars peuvent être fermées manuellement */
        dismissible: true,
        /** Si les snackbars empilent les nouvelles positions */
        stackNewest: true,
        /** Si le snackbar bloque les interactions */
        blocking: false,
    },

    // ============================================================================
    // ANIMATIONS
    // ============================================================================

    animations: {
        enter: {
            type: 'slide' as const,
            duration: 300,
            easing: 'ease-out' as const,
            direction: 'up' as const,
        } as AnimationConfig,

        exit: {
            type: 'slide' as const,
            duration: 250,
            easing: 'ease-in' as const,
            direction: 'down' as const,
        } as AnimationConfig,

        hover: {
            type: 'scale' as const,
            duration: 200,
            easing: 'ease-out' as const,
            direction: 'center' as const,
        } as AnimationConfig,
    },

    motion: {
        enter: MotionPresets.snackbarEnter,
        exit: MotionPresets.snackbarExit,
    },

    // ============================================================================
    // POSITIONS ET ALIGNEMENTS
    // ============================================================================

    positions: {
        available: [
            'bottom-left',
            'bottom-center',
            'bottom-right',
            'top-left',
            'top-center',
            'top-right'
        ] as const,

        default: 'bottom-center' as const,

        offsets: {
            top: 16,
            bottom: 16,
            left: 16,
            right: 16,
            center: 0,
        },
    },

    // ============================================================================
    // TYPES ET VARIANTS
    // ============================================================================

    types: {
        available: [
            'default',
            'success',
            'error',
            'warning',
            'info'
        ] as const,

        default: 'default' as const,

        icons: {
            success: 'check_circle',
            error: 'error',
            warning: 'warning',
            info: 'info',
            default: null,
        },
    },

    // ============================================================================
    // ACTIONS ET BOUTONS
    // ============================================================================

    actions: {
        /** Si les actions sont supportées */
        supported: true,
        /** Nombre maximum d'actions */
        maxActions: 2,
        /** Types d'actions disponibles */
        available: [
            'close',
            'dismiss',
            'retry',
            'undo',
            'custom'
        ] as const,

        /** Configuration des boutons */
        buttons: {
            primary: {
                style: 'text' as const,
                color: 'primary' as const,
            },
            secondary: {
                style: 'text' as const,
                color: 'secondary' as const,
            },
        },
    },

    // ============================================================================
    // ACCESSIBILITÉ
    // ============================================================================

    accessibility: {
        /** Rôle ARIA */
        role: 'alert' as const,
        /** Niveau de priorité ARIA */
        ariaLive: 'polite' as const,
        /** Si les changements doivent être annoncés */
        announceChanges: true,
        /** Si le snackbar est focusable */
        focusable: true,
        /** Ordre de tabulation */
        tabIndex: 0,
        /** Labels ARIA par défaut */
        labels: {
            close: 'Fermer la notification',
            dismiss: 'Ignorer la notification',
            retry: 'Réessayer',
            undo: 'Annuler',
        },
    },

    // ============================================================================
    // INTERACTIONS
    // ============================================================================

    interactions: {
        /** Si le snackbar répond au clic */
        clickable: true,
        /** Si le snackbar répond au hover */
        hoverable: true,
        /** Si le snackbar peut être glissé */
        draggable: false,
        /** Si le snackbar peut être pincé (mobile) */
        pinchable: false,
        /** Si le snackbar ferme au clic externe */
        closeOnClickOutside: false,
        /** Si le snackbar ferme avec Escape */
        closeOnEscape: true,
    },

    // ============================================================================
    // RESPONSIVE
    // ============================================================================

    responsive: {
        /** Si le snackbar s'adapte aux petits écrans */
        adaptive: true,
        /** Largeur maximale sur mobile */
        maxWidthMobile: '90vw',
        /** Largeur maximale sur desktop */
        maxWidthDesktop: '500px',
        /** Position par défaut sur mobile */
        mobilePosition: 'bottom-center' as const,
        /** Position par défaut sur desktop */
        desktopPosition: 'bottom-center' as const,
        /** Si les actions sont cachées sur mobile */
        hideActionsOnMobile: false,
    },

    // ============================================================================
    // PERFORMANCE
    // ============================================================================

    performance: {
        /** Si les snackbars inactifs sont nettoyés */
        autoCleanup: true,
        /** Délai avant nettoyage */
        cleanupDelay: 7000,
        /** Si l'animation est désactivée sur mobile */
        disableAnimationOnMobile: false,
        /** Si le rendu est différé */
        deferredRendering: true,
        /** Si le snackbar est persisté en mémoire */
        persistent: false,
    },

    // ============================================================================
    // THÈMES ET STYLES
    // ============================================================================

    theming: {
        /** Si le snackbar suit le thème système */
        followSystemTheme: true,
        /** Styles par type */
        styles: {
            default: {
                backgroundColor: 'var(--k3ui-surface-container-high)',
                color: 'var(--k3ui-on-surface)',
                border: '1px solid var(--k3ui-outline-variant)',
                elevation: 2,
            },
            success: {
                backgroundColor: 'var(--k3ui-surface-container-high)',
                color: 'var(--k3ui-on-surface)',
                border: '1px solid var(--k3ui-success)',
                iconColor: 'var(--k3ui-success)',
                elevation: 2,
            },
            error: {
                backgroundColor: 'var(--k3ui-error-container)',
                color: 'var(--k3ui-on-error-container)',
                border: '1px solid var(--k3ui-error)',
                iconColor: 'var(--k3ui-error)',
                elevation: 3,
            },
            warning: {
                backgroundColor: 'var(--k3ui-warning-container)',
                color: 'var(--k3ui-on-warning-container)',
                border: '1px solid var(--k3ui-warning)',
                iconColor: 'var(--k3ui-warning)',
                elevation: 2,
            },
            info: {
                backgroundColor: 'var(--k3ui-info-container)',
                color: 'var(--k3ui-on-info-container)',
                border: '1px solid var(--k3ui-info)',
                iconColor: 'var(--k3ui-info)',
                elevation: 2,
            },
        },
    },

    // ============================================================================
    // SONS ET FEEDBACK
    // ============================================================================

    audio: {
        /** Si les sons sont activés */
        enabled: true,
        /** Sons par type */
        sounds: {
            success: 'notification.mp3',
            error: 'fail.mp3',
            warning: 'bambam.mp3',
            info: 'beep.mp3',
            default: 'notification.mp3',
        },
        /** Volume par défaut */
        volume: 0.7,
    },

    // ============================================================================
    // INTERNATIONALISATION
    // ============================================================================

    i18n: {
        /** Langues supportées */
        supportedLanguages: ['fr', 'en', 'es', 'de'],
        /** Langue par défaut */
        defaultLanguage: 'fr',
        /** Textes par défaut */
        defaultTexts: {
            fr: {
                close: 'Fermer',
                dismiss: 'Ignorer',
                retry: 'Réessayer',
                undo: 'Annuler',
            },
            en: {
                close: 'Close',
                dismiss: 'Dismiss',
                retry: 'Retry',
                undo: 'Undo',
            },
        },
    },

    // ============================================================================
    // VALIDATION
    // ============================================================================

    validation: {
        /** Longueur maximale du message */
        maxMessageLength: 300,
        /** Longueur minimale du message */
        minMessageLength: 1,
        /** Caractères interdits */
        forbiddenCharacters: ['<', '>', '"', "'"],
        /** Si le HTML est autorisé */
        allowHTML: false,
        /** Longueur maximale du label d'action */
        maxActionLabelLength: 20,
    },
} as const;

/**
 * Extrait les valeurs par défaut pour Snackbar depuis les specs
 * @returns Options par défaut pour Snackbar
 */
export function getSnackbarDefaults(): SnackbarOptions {
    return {
        text: '',
        type: SnackbarSpecs.types.default,
        actionText: undefined,
        duration: SnackbarSpecs.behaviors.defaultDuration,
        actionCallback: null,
        classes: '',
        showImmediately: false,
        position: SnackbarSpecs.positions.default,
        maxSnackbars: SnackbarSpecs.behaviors.maxSnackbars,
        ...getHapticFeedbackDefaults('light'),
        priorityLevel: PriorityLevel.MEDIUM,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
    };
}
