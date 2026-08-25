/**
 * @fileoverview Spécifications du composant Sheet K3UI
 * @description Spécifications Material Design 3 You Expressive pour les bottom / top sheets
 * @see https://m3.material.io/components/bottom-sheets/overview
 * @author K3UI Team
 * @version 1.0.0
 */

import type { AnimationConfig } from '../../types/components/animations';
import { SheetOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Spécifications du composant Sheet selon Material Design 3 You Expressive
 */
export const SheetSpecs = {
    // ============================================================================
    // COMPORTEMENTS PAR DÉFAUT (MD3)
    // ============================================================================

    behaviors: {
        /** Si le sheet est activé par défaut */
        enabled: true,
        /** Si le sheet est ouvert par défaut */
        openByDefault: false,
        /** Si le sheet ferme au clic externe (scrim click) - MD3 */
        closeOnClickOutside: true,
        /** Si le sheet ferme avec Escape - MD3 */
        closeOnEscape: true,
        /** Si le sheet est persistant (ne peut pas être fermé) - MD3 */
        persistent: false,
        /** Si le sheet est en mode modal (bloque l'interaction avec le reste de la page) - MD3 */
        modal: true,
        /** Si le sheet a un overlay/scrim - MD3 */
        overlay: true,
        /** Si le sheet empêche le scroll du body - MD3 */
        preventScrolling: true,
        /**
         * Bordure header (divider) désactivée par défaut.
         * Passer `border: true` pour le trait sous `.sheet-header`.
         */
        defaultBorder: false,
        /** Si le sheet capture le focus (focus trap) - MD3 */
        focusTrap: true,
        /** Si le sheet est draggable (uniquement pour bottom et top sheets) - MD3 */
        draggable: true,
        /** Largeur de la zone de drag (drag handle) - MD3 */
        dragTargetWidth: '10px',
    },

    // ============================================================================
    // ANIMATIONS (MD3)
    // ============================================================================

    animations: {
        /** Animation d'entrée du bottom / top sheet - MD3 */
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

        /** Animation de l'overlay/scrim - MD3 */
        overlay: {
            type: 'fade' as const,
            duration: 200,
            easing: 'ease-out' as const,
            direction: 'in' as const,
        } as AnimationConfig,
    },

    // ============================================================================
    // TYPES ET VARIANTS (MD3)
    // ============================================================================

    types: {
        available: [
            'bottom',
            'top',
        ] as const,

        default: 'bottom' as const,

        /** Configuration par type selon MD3 */
        config: {
            bottom: {
                position: 'bottom' as const,
                width: '100%',
                maxWidth: '640px',
                height: 'auto',
                minHeight: 'auto',
                maxHeight: '90vh',
                overlay: true,
                modal: true,
            },
            top: {
                position: 'top' as const,
                width: '100%',
                maxWidth: '640px',
                height: 'auto',
                overlay: true,
                modal: true,
            },
        },
    },

    // ============================================================================
    // POSITIONS (MD3)
    // ============================================================================

    positions: {
        available: [
            'bottom',
            'top',
        ] as const,

        default: 'bottom' as const,

        /** Configuration par position selon MD3 */
        config: {
            bottom: {
                direction: 'up' as const,
                transform: 'translateY(100%)',
                width: '100%',
                maxWidth: '640px',
                height: 'auto',
            },
            top: {
                direction: 'down' as const,
                transform: 'translateY(-100%)',
                width: '100%',
                maxWidth: '640px',
                height: 'auto',
            },
        },
    },

    // ============================================================================
    // TAILLES (MD3 Expressive)
    // Bottom/top : largeur 100% (plafond 640dp ≥600) ; hauteur = contenu / détentes
    // ============================================================================

    sizes: {
        available: [
            'small',
            'medium',
            'large',
            'half',
            'full'
        ] as const,

        default: 'medium' as const,

        /** Détentes verticales (peek / half / large / full) — largeur gérée en CSS */
        config: {
            small: {
                width: '280px',
                height: '100dvh',
                maxWidth: '400px',
                maxHeight: 'calc(100dvh - var(--md-sys-sheet-inset-top, 56px))',
            },
            medium: {
                width: '360px',
                height: '100dvh',
                maxWidth: '400px',
                maxHeight: 'calc(100dvh - var(--md-sys-sheet-inset-top, 56px))',
            },
            large: {
                width: '400px',
                height: '100dvh',
                maxWidth: '400px',
                maxHeight: 'calc(100dvh - var(--md-sys-sheet-inset-top, 56px))',
            },
            half: {
                width: '50%',
                height: '100dvh',
                maxWidth: '50vw',
                maxHeight: 'calc(100dvh - var(--md-sys-sheet-inset-top, 56px))',
            },
            full: {
                width: '100%',
                height: '100dvh',
                maxWidth: '100vw',
                maxHeight: 'calc(100dvh - var(--md-sys-sheet-inset-top, 56px))',
            },
        },
    },

    // ============================================================================
    // ACCESSIBILITÉ (MD3)
    // ============================================================================

    accessibility: {
        /** Rôle ARIA - MD3 */
        role: 'dialog' as const,
        /** Si le sheet est focusable - MD3 */
        focusable: true,
        /** Ordre de tabulation - MD3 */
        tabIndex: 0,
        /** Labels ARIA par défaut - MD3 */
        labels: {
            sheet: 'Feuille',
            close: 'Fermer le panneau',
            resize: 'Redimensionner le sheet',
        },
        /** Si le sheet respecte les préférences de mouvement réduit - MD3 */
        respectReducedMotion: true,
        /** Si le sheet annonce ses changements d'état - MD3 */
        announceStateChanges: true,
        /** Si le sheet capture le focus (focus trap) - MD3 */
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
        /** Si le sheet répond au clic */
        clickable: true,
        /** Si le sheet répond au hover */
        hoverable: true,
        /** Si le sheet répond au focus */
        focusable: true,
        /** Si le sheet peut être activé au clavier */
        keyboardActivable: true,
        /** Si le sheet peut être activé au touch */
        touchActivable: true,
        /** Si le sheet peut être glissé */
        draggable: false,
        /** Si le sheet peut être redimensionné */
        resizable: false,
    },

    // ============================================================================
    // RESPONSIVE
    // ============================================================================

    responsive: {
        /** Si le sheet s'adapte aux petits écrans */
        adaptive: true,
        /** Largeur maximale sur mobile (compact < 600) */
        maxWidthMobile: '100vw',
        /** Largeur max side sheet desktop (M3) */
        maxWidthDesktop: '400px',
        /** Bottom sheet max width medium+ (M3) */
        bottomMaxWidthDesktop: '640px',
        /** Position par défaut sur mobile */
        mobilePosition: 'bottom' as const,
        /** Position par défaut sur desktop */
        desktopPosition: 'right' as const,
        /** Si le sheet utilise une position fixe sur mobile */
        fixedPositionOnMobile: true,
        /** Breakpoint compact M3 (dp) */
        compactBreakpoint: 600,
        /** Breakpoint expanded M3 (dp) */
        expandedBreakpoint: 840,
    },

    // ============================================================================
    // PERFORMANCE
    // ============================================================================

    performance: {
        /** Si l'animation est désactivée sur mobile */
        disableAnimationOnMobile: false,
        /** Si le rendu est différé */
        deferredRendering: true,
        /** Si le sheet est mis en cache */
        cached: true,
        /** Taille maximale du cache */
        maxCacheSize: 10,
        /** Si le sheet utilise la virtualisation */
        virtualized: false,
    },

    // ============================================================================
    // THÈMES ET STYLES (MD3)
    // ============================================================================

    theming: {
        /** Si le sheet suit le thème système - MD3 */
        followSystemTheme: true,
        /** Styles par défaut - MD3 */
        styles: {
            backgroundColor: 'var(--md-sys-color-surface)',
            color: 'var(--md-sys-color-on-surface)',
            border: 'none',
            borderRadius: '0px',
            elevation: 1,
            zIndex: 1601,
        },

        /** Styles par état - MD3 */
        states: {
            default: {
                backgroundColor: 'var(--md-sys-color-surface)',
                color: 'var(--md-sys-color-on-surface)',
                elevation: 1,
            },
            hover: {
                backgroundColor: 'var(--md-sys-color-surface-container-highest)',
                color: 'var(--md-sys-color-on-surface)',
                elevation: 2,
            },
            focus: {
                backgroundColor: 'var(--md-sys-color-surface-container-highest)',
                color: 'var(--md-sys-color-on-surface)',
                elevation: 2,
                outline: '2px solid var(--md-sys-color-primary)',
            },
            open: {
                backgroundColor: 'var(--md-sys-color-surface)',
                color: 'var(--md-sys-color-on-surface)',
                elevation: 1,
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
        /** Si l'overlay/scrim ferme le sheet - MD3 */
        closeOnClick: true,
        /** Si l'overlay/scrim est animé - MD3 */
        animated: true,
        /** Durée de l'animation de l'overlay/scrim - MD3 */
        animationDuration: 200,
        /** Type de scrim (blur ou overlay) - MD3 */
        scrimType: 'overlay' as const,
    },
} as const;

/**
 * Extrait les valeurs par défaut pour Sheet depuis les specs MD3
 * @returns Options par défaut pour Sheet selon Material Design 3
 */
export function getSheetDefaults(): SheetOptions {
    return {
        type: SheetSpecs.positions.default,
        position: SheetSpecs.positions.default,
        size: SheetSpecs.sizes.default,
        open: false,
        overlayOpacity: 0.32,
        blur: 4,
        inDuration: SheetSpecs.animations.bottomSheetEnter.duration,
        outDuration: SheetSpecs.animations.bottomSheetExit.duration,
        preventScrolling: SheetSpecs.behaviors.preventScrolling,
        dismissible: SheetSpecs.behaviors.closeOnEscape || SheetSpecs.behaviors.closeOnClickOutside,
        draggable: SheetSpecs.behaviors.draggable,
        border: SheetSpecs.behaviors.defaultBorder,
        fullWidth: false,
        priorityLevel: PriorityLevel.MEDIUM,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
    };
}

