/**
 * @fileoverview Spécifications du composant Dialog K3UI
 * @description Spécifications Material Design 3 You Expressive pour les dialogues modaux
 * @see https://m3.material.io/components/dialogs/overview
 * @author K3UI Team
 * @version 2.0.0
 */

import type { AnimationConfig } from '../../types/components/animations';
import { DialogOptions } from '../../types/components';
import { getHapticFeedbackDefaults } from '../common/haptic-feedback.specs';
import { MotionPresets } from '../common/motion-presets.specs';

/**
 * Spécifications du composant Dialog selon Material Design 3 You Expressive
 */
export const DialogSpecs = {
    // ============================================================================
    // COMPORTEMENTS PAR DÉFAUT (MD3)
    // ============================================================================

    behaviors: {
        /** Si le dialog est activé par défaut */
        enabled: true,
        /** Si le dialog est ouvert par défaut */
        openByDefault: false,
        /** Si le dialog ferme au clic externe (scrim click) - MD3 */
        closeOnClickOutside: true,
        /** Si le dialog ferme avec Escape - MD3 */
        closeOnEscape: true,
        /** Si le dialog est persistant (ne peut pas être fermé) - MD3 */
        persistent: false,
        /** Si le dialog est en mode modal (bloque l'interaction avec le reste de la page) - MD3 */
        modal: true,
        /** Si le dialog a un overlay/scrim - MD3 */
        overlay: true,
        /** Si le dialog est en mode fullscreen - MD3 */
        fullscreen: false,
        /** Si le dialog empêche le scroll du body - MD3 */
        preventScrolling: true,
        /** Si le dialog capture le focus (focus trap) - MD3 */
        focusTrap: true,
    },

    // ============================================================================
    // ANIMATIONS (MD3)
    // ============================================================================

    animations: {
        /** Animation d'entrée du dialog modal - material-web translateY 500ms */
        enter: {
            type: 'slide' as const,
            duration: 500,
            easing: 'ease-out' as const,
            direction: 'up' as const,
        } as AnimationConfig,

        /** Animation de sortie du dialog modal - material-web translateY 150ms */
        exit: {
            type: 'slide' as const,
            duration: 150,
            easing: 'ease-in' as const,
            direction: 'up' as const,
        } as AnimationConfig,

        /** Animation de l'overlay/scrim - MD3 */
        overlay: {
            type: 'fade' as const,
            duration: 200,
            easing: 'ease-out' as const,
            direction: 'in' as const,
        } as AnimationConfig,

        /** Animation d'entrée du bottom sheet - MD3 */
        bottomSheetEnter: {
            type: 'slide' as const,
            duration: 300,
            easing: 'ease-out' as const,
            direction: 'up' as const,
        } as AnimationConfig,

        /** Animation de sortie du bottom sheet - MD3 */
        bottomSheetExit: {
            type: 'slide' as const,
            duration: 250,
            easing: 'ease-in' as const,
            direction: 'down' as const,
        } as AnimationConfig,

        /** Animation d'entrée fullscreen mobile - MD3 slide up */
        fullscreenEnter: {
            type: 'slide' as const,
            duration: 300,
            easing: 'ease-out' as const,
            direction: 'up' as const,
        } as AnimationConfig,

        /** Animation de sortie fullscreen mobile - MD3 slide down */
        fullscreenExit: {
            type: 'slide' as const,
            duration: 250,
            easing: 'ease-in' as const,
            direction: 'down' as const,
        } as AnimationConfig,
    },

    // ============================================================================
    // MOTION M3 (12 springs — expressive défaut, option animation: spatial → standard)
    // ============================================================================

    motion: {
        /** Schéma d'animation composant (défaut expressive) */
        animationDefault: 'expressive' as const,
        animationOptions: ['expressive', 'spatial'] as const,
        modal: MotionPresets.dialogModal,
        scrim: MotionPresets.dialogScrim,
        bottomSheet: MotionPresets.dialogBottomSheet,
        fullscreen: MotionPresets.dialogFullscreen,
    },

    // ============================================================================
    // TYPES ET VARIANTS (MD3)
    // ============================================================================

    types: {
        available: [
            'basic',
            'alert',
            'confirm',
            'simple',
            'fullscreen'
        ] as const,

        default: 'basic' as const,

        /** Configuration par type selon MD3 */
        config: {
            basic: {
                maxWidth: '560px',
                maxHeight: '80vh',
                fullscreen: false,
                overlay: true,
                hasHeader: true,
                hasFooter: true,
            },
            alert: {
                maxWidth: '400px',
                maxHeight: 'auto',
                fullscreen: false,
                overlay: true,
                hasHeader: true,
                hasFooter: true,
            },
            confirm: {
                maxWidth: '400px',
                maxHeight: 'auto',
                fullscreen: false,
                overlay: true,
                hasHeader: true,
                hasFooter: true,
            },
            simple: {
                maxWidth: '400px',
                maxHeight: 'auto',
                fullscreen: false,
                overlay: true,
                hasHeader: false,
                hasFooter: false,
            },
            fullscreen: {
                maxWidth: '100vw',
                maxHeight: '100vh',
                fullscreen: true,
                overlay: true,
                hasHeader: true,
                hasFooter: true,
            },
        },
    },

    // ============================================================================
    // TAILLES (MD3)
    // ============================================================================

    sizes: {
        available: [
            'small',
            'medium',
            'large',
            'fullscreen'
        ] as const,

        default: 'medium' as const,

        /** Configuration par taille selon MD3 */
        config: {
            small: {
                width: '280px',
                height: 'auto',
                maxWidth: '90vw',
                maxHeight: '80vh',
            },
            medium: {
                width: '560px',
                height: 'auto',
                maxWidth: '90vw',
                maxHeight: '80vh',
            },
            large: {
                width: '560px',
                height: 'auto',
                maxWidth: '560px',
                maxHeight: '90vh',
            },
            fullscreen: {
                width: '100vw',
                height: '100vh',
                maxWidth: '100vw',
                maxHeight: '100vh',
            },
        },
    },

    // ============================================================================
    // ACCESSIBILITÉ (MD3)
    // ============================================================================

    accessibility: {
        /** Rôle ARIA - MD3 */
        role: 'dialog' as const,
        /** Si le dialog est focusable - MD3 */
        focusable: true,
        /** Ordre de tabulation - MD3 */
        tabIndex: 0,
        /** Labels ARIA par défaut - MD3 */
        labels: {
            dialog: 'Dialogue',
            close: 'Fermer le dialogue',
            confirm: 'Confirmer',
            cancel: 'Annuler',
        },
        /** Si le dialog respecte les préférences de mouvement réduit - MD3 */
        respectReducedMotion: true,
        /** Si le dialog annonce ses changements d'état - MD3 */
        announceStateChanges: true,
        /** Si le dialog capture le focus (focus trap) - MD3 */
        focusTrap: true,
        /** Attribut aria-modal - MD3 */
        ariaModal: true,
        /** Attribut aria-labelledby pour le titre - MD3 */
        ariaLabelledBy: true,
        /** Attribut aria-describedby pour le contenu - MD3 */
        ariaDescribedBy: true,
    },

    // ============================================================================
    // INTERACTIONS
    // ============================================================================

    interactions: {
        /** Si le dialog répond au clic */
        clickable: true,
        /** Si le dialog répond au hover */
        hoverable: true,
        /** Si le dialog répond au focus */
        focusable: true,
        /** Si le dialog peut être activé au clavier */
        keyboardActivable: true,
        /** Si le dialog peut être activé au touch */
        touchActivable: true,
        /** Si le dialog peut être glissé */
        draggable: false,
        /** Si le dialog peut être redimensionné */
        resizable: false,
    },

    // ============================================================================
    // RESPONSIVE
    // ============================================================================

    responsive: {
        /** Si le dialog s'adapte aux petits écrans */
        adaptive: true,
        /** Largeur maximale sur mobile */
        maxWidthMobile: '95vw',
        /** Largeur maximale sur desktop */
        maxWidthDesktop: '500px',
        /** Taille par défaut sur mobile */
        mobileSize: 'fullscreen' as const,
        /** Taille par défaut sur desktop */
        desktopSize: 'medium' as const,
        /** Si le dialog utilise une position fixe sur mobile */
        fixedPositionOnMobile: true,
    },

    // ============================================================================
    // PERFORMANCE
    // ============================================================================

    performance: {
        /** Si l'animation est désactivée sur mobile */
        disableAnimationOnMobile: false,
        /** Si le rendu est différé */
        deferredRendering: true,
        /** Si le dialog est mis en cache */
        cached: true,
        /** Taille maximale du cache */
        maxCacheSize: 10,
        /** Si le dialog utilise la virtualisation */
        virtualized: false,
    },

    // ============================================================================
    // THÈMES ET STYLES (MD3)
    // ============================================================================

    theming: {
        /** Si le dialog suit le thème système - MD3 */
        followSystemTheme: true,
        /** Styles par défaut - MD3 */
        styles: {
            backgroundColor: 'var(--md-sys-color-surface-container-high)',
            color: 'var(--md-sys-color-on-surface)',
            border: 'none',
            borderRadius: '28px',
            elevation: 0,
            zIndex: 2001,
        },

        /** Styles par état - MD3 */
        states: {
            default: {
                backgroundColor: 'var(--md-sys-color-surface-container-high)',
                color: 'var(--md-sys-color-on-surface)',
                elevation: 0,
            },
            hover: {
                backgroundColor: 'var(--md-sys-color-surface-container-high)',
                color: 'var(--md-sys-color-on-surface)',
                elevation: 0,
            },
            focus: {
                backgroundColor: 'var(--md-sys-color-surface-container-high)',
                color: 'var(--md-sys-color-on-surface)',
                elevation: 0,
                outline: '2px solid var(--md-sys-color-primary)',
            },
            open: {
                backgroundColor: 'var(--md-sys-color-surface-container-high)',
                color: 'var(--md-sys-color-on-surface)',
                elevation: 0,
            },
            disabled: {
                backgroundColor: 'var(--md-sys-color-surface-disabled)',
                color: 'var(--md-sys-color-on-surface-disabled)',
                opacity: 0.38,
            },
        },
    },

    // ============================================================================
    // OVERLAY ET SCRIM (MD3)
    // ============================================================================

    overlay: {
        /** Si l'overlay/scrim est activé - MD3 */
        enabled: true,
        /** Couleur de l'overlay/scrim - MD3 (opacité 0.32 pour light, 0.64 pour dark) */
        color: 'rgba(0, 0, 0, 0.32)',
        /** Si l'overlay/scrim est cliquable - MD3 */
        clickable: true,
        /** Si l'overlay/scrim ferme le dialog - MD3 */
        closeOnClick: true,
        /** Si l'overlay/scrim est animé - MD3 */
        animated: true,
        /** Durée de l'animation de l'overlay/scrim - MD3 */
        animationDuration: 200,
        /** Type de scrim (blur ou overlay) - MD3 */
        scrimType: 'overlay' as const,
    },

    // ============================================================================
    // ACTIONS ET BOUTONS
    // ============================================================================

    actions: {
        /** Si les actions sont supportées */
        supported: true,
        /** Position des actions */
        position: {
            available: [
                'top',
                'bottom',
                'inline'
            ] as const,

            default: 'bottom' as const,
        },

        /** Types d'actions disponibles */
        available: [
            'confirm',
            'cancel',
            'close',
            'custom'
        ] as const,

        /** Configuration des boutons (M3 : text buttons dans la zone d'actions) */
        buttons: {
            confirm: {
                style: 'text' as const,
                color: 'primary' as const,
            },
            cancel: {
                style: 'text' as const,
                color: 'secondary' as const,
            },
            close: {
                style: 'text' as const,
                color: 'secondary' as const,
            },
        },
    },

    // ============================================================================
    // SONS ET FEEDBACK (extension K3UI — non implémenté)
    // ============================================================================

    audio: {
        enabled: false,
        sounds: {},
        volume: 0.5,
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
                confirm: 'Confirmer',
                cancel: 'Annuler',
                close: 'Fermer',
                ok: 'OK',
                yes: 'Oui',
                no: 'Non',
            },
            en: {
                confirm: 'Confirm',
                cancel: 'Cancel',
                close: 'Close',
                ok: 'OK',
                yes: 'Yes',
                no: 'No',
            },
        },
    },

    // ============================================================================
    // VALIDATION
    // ============================================================================

    validation: {
        requireMinWidth: true,
        minWidth: '280px',
        requireMaxWidth: true,
        maxWidth: '560px',
        requireMinHeight: true,
        minHeight: '140px',
    },
} as const;

/**
 * Classes K3UI pour les actions dialog (réf. button-reference : text, sm, rounded, padding-16).
 * @see k3ui-docs/partials/docs/pages/button-reference.php
 */
export const DialogActionButtonClasses = {
    /** Bouton texte standard (Annuler, etc.) */
    text: 'btn btn--text btn--sm btn--rounded btn--padding-16 ripple',
    /** Bouton texte primaire (OK, Confirmer) */
    textPrimary: 'btn btn--text btn--sm btn--rounded btn--padding-16 btn--primary ripple',
    /** Bouton texte destructif */
    textError: 'btn btn--text btn--sm btn--rounded btn--padding-16 btn--error ripple',
} as const;

/**
 * Extrait les valeurs par défaut pour Dialog depuis les specs MD3
 * @returns Options par défaut pour Dialog selon Material Design 3
 */
export function getDialogDefaults(): DialogOptions {
    return {
        opacity: 0.4,
        inDuration: 500,
        outDuration: 150,
        /** Défaut M3 Expressive — 12 springs (voir motion.token.scss) */
        animation: 'expressive',
        preventScrolling: DialogSpecs.behaviors.preventScrolling,
        dismissible: DialogSpecs.behaviors.closeOnEscape || DialogSpecs.behaviors.closeOnClickOutside,
        blur: 10,
        haptic: true,
        containerTransform: true,
        variant: 'basic',
        scrollable: false,
        reducedMotion: false,
        placement: undefined,
        cover: false,
        anchor: undefined,
        closeOnBackNavigation: true,
        fullScreenOnCompact: false,
        emphasizedHeadline: false,
        centered: false,
        ...getHapticFeedbackDefaults('light'),
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
    };
}
