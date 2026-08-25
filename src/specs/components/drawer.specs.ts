/**
 * @fileoverview Spécifications du composant Drawer K3UI
 * @description Spécifications et comportements pour les tiroirs de navigation
 * @author K3UI Team
 * @version 1.0.0
 */

import type { AnimationConfig } from '../../types/components/animations';
import { DrawerOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Spécifications du composant Drawer
 */
export const DrawerSpecs = {
    // ============================================================================
    // COMPORTEMENTS PAR DÉFAUT
    // ============================================================================

    behaviors: {
        /** Si le drawer est activé par défaut */
        enabled: true,
        /** Si le drawer est ouvert par défaut */
        openByDefault: false,
        /** Si le drawer ferme au clic externe */
        closeOnClickOutside: true,
        /** Si le drawer ferme avec Escape */
        closeOnEscape: true,
        /** Si le drawer est persistant */
        persistent: false,
        /** Si le drawer est en mode modal */
        modal: false,
        /** Si le drawer est en mode overlay */
        overlay: true,
        /** Si le drawer est en mode push */
        push: false,
    },

    // ============================================================================
    // ANIMATIONS
    // ============================================================================

    animations: {
        enter: {
            type: 'slide' as const,
            duration: 300,
            easing: 'ease-out' as const,
            direction: 'left' as const,
        } as AnimationConfig,

        exit: {
            type: 'slide' as const,
            duration: 250,
            easing: 'ease-in' as const,
            direction: 'right' as const,
        } as AnimationConfig,

        overlay: {
            type: 'fade' as const,
            duration: 200,
            easing: 'ease-out' as const,
            direction: 'in' as const,
        } as AnimationConfig,
    },

    // ============================================================================
    // TYPES ET VARIANTS
    // ============================================================================

    types: {
        available: [
            'temporary',
            'persistent',
            'permanent'
        ] as const,

        default: 'temporary' as const,

        /** Configuration par type */
        config: {
            temporary: {
                overlay: true,
                modal: true,
                persistent: false,
                push: false,
            },
            persistent: {
                overlay: true,
                modal: false,
                persistent: true,
                push: false,
            },
            permanent: {
                overlay: false,
                modal: false,
                persistent: true,
                push: true,
            },
        },
    },

    // ============================================================================
    // POSITIONS
    // ============================================================================

    positions: {
        available: [
            'left',
            'right',
        ] as const,

        default: 'left' as const,

        /** Configuration par position */
        config: {
            left: {
                direction: 'left' as const,
                transform: 'translateX(-100%)',
                width: '320px',
                height: '100%',
            },
            right: {
                direction: 'right' as const,
                transform: 'translateX(100%)',
                width: '320px',
                height: '100%',
            },
        },
    },

    // ============================================================================
    // TAILLES
    // ============================================================================

    sizes: {
        available: [
            'small',
            'medium',
            'large',
            'full'
        ] as const,

        default: 'medium' as const,

        /** Configuration par taille */
        config: {
            small: {
                width: '240px',
                height: '240px',
            },
            medium: {
                width: '320px',
                height: '320px',
            },
            large: {
                width: '400px',
                height: '400px',
            },
            full: {
                width: '100%',
                height: '100%',
            },
        },
    },

    // ============================================================================
    // ACCESSIBILITÉ
    // ============================================================================

    accessibility: {
        /** Rôle ARIA */
        role: 'navigation' as const,
        /** Si le drawer est focusable */
        focusable: true,
        /** Ordre de tabulation */
        tabIndex: 0,
        /** Labels ARIA par défaut */
        labels: {
            drawer: 'Menu de navigation',
            trigger: 'Ouvrir le menu',
            close: 'Fermer le menu',
        },
        /** Si le drawer respecte les préférences de mouvement réduit */
        respectReducedMotion: true,
        /** Si le drawer annonce ses changements d'état */
        announceStateChanges: true,
    },

    // ============================================================================
    // INTERACTIONS
    // ============================================================================

    interactions: {
        /** Si le drawer répond au clic */
        clickable: true,
        /** Si le drawer répond au hover */
        hoverable: true,
        /** Si le drawer répond au focus */
        focusable: true,
        /** Si le drawer peut être activé au clavier */
        keyboardActivable: true,
        /** Si le drawer peut être activé au touch */
        touchActivable: true,
        /** Si le drawer peut être glissé */
        draggable: false,
        /** Si le drawer peut être redimensionné */
        resizable: false,
    },

    // ============================================================================
    // RESPONSIVE
    // ============================================================================

    responsive: {
        /** Si le drawer s'adapte aux petits écrans */
        adaptive: true,
        /** Largeur maximale sur mobile */
        maxWidthMobile: '90vw',
        /** Largeur maximale sur desktop */
        maxWidthDesktop: '400px',
        /** Position par défaut sur mobile */
        mobilePosition: 'left' as const,
        /** Position par défaut sur desktop */
        desktopPosition: 'left' as const,
        /** Si le drawer utilise une position fixe sur mobile */
        fixedPositionOnMobile: true,
    },

    // ============================================================================
    // PERFORMANCE
    // ============================================================================

    performance: {
        /** Si l'animation est désactivée sur mobile */
        disableAnimationOnMobile: false,
        /** Si le rendu est différé */
        deferredRendering: false,
        /** Si le drawer est mis en cache */
        cached: true,
        /** Taille maximale du cache */
        maxCacheSize: 10,
        /** Si le drawer utilise la virtualisation */
        virtualized: false,
    },

    // ============================================================================
    // THÈMES ET STYLES
    // ============================================================================

    theming: {
        /** Si le drawer suit le thème système */
        followSystemTheme: true,
        /** Styles par défaut */
        styles: {
            backgroundColor: 'var(--k3ui-surface)',
            color: 'var(--k3ui-on-surface)',
            border: 'none',
            elevation: 3,
            zIndex: 1100,
        },

        /** Styles par état */
        states: {
            default: {
                backgroundColor: 'var(--k3ui-surface)',
                color: 'var(--k3ui-on-surface)',
                elevation: 3,
            },
            hover: {
                backgroundColor: 'var(--k3ui-surface-container-highest)',
                color: 'var(--k3ui-on-surface)',
                elevation: 4,
            },
            focus: {
                backgroundColor: 'var(--k3ui-surface-container-highest)',
                color: 'var(--k3ui-on-surface)',
                elevation: 4,
                outline: '2px solid var(--k3ui-primary)',
            },
            open: {
                backgroundColor: 'var(--k3ui-surface)',
                color: 'var(--k3ui-on-surface)',
                elevation: 3,
            },
            disabled: {
                backgroundColor: 'var(--k3ui-surface-disabled)',
                color: 'var(--k3ui-on-surface-disabled)',
                opacity: 0.38,
            },
        },
    },

    // ============================================================================
    // OVERLAY ET BACKDROP
    // ============================================================================

    overlay: {
        /** Si l'overlay est activé */
        enabled: true,
        /** Couleur de l'overlay — scrim M3 32 % */
        color: 'rgba(0, 0, 0, 0.32)',
        /** Si l'overlay est cliquable */
        clickable: true,
        /** Si l'overlay ferme le drawer */
        closeOnClick: true,
        /** Si l'overlay est animé */
        animated: true,
        /** Durée de l'animation de l'overlay */
        animationDuration: 200,
    },

    // ============================================================================
    // SONS ET FEEDBACK
    // ============================================================================

    audio: {
        /** Si les sons sont activés */
        enabled: true,
        /** Sons par action */
        sounds: {
            open: 'swoosh.mp3',
            close: 'swoosh.mp3',
            click: 'click.mp3',
            hover: 'hover.mp3',
        },
        /** Volume par défaut */
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
                open: 'Ouvrir le menu',
                close: 'Fermer le menu',
                navigation: 'Navigation',
            },
            en: {
                open: 'Open menu',
                close: 'Close menu',
                navigation: 'Navigation',
            },
        },
    },

    // ============================================================================
    // VALIDATION
    // ============================================================================

    validation: {
        /** Si le drawer doit avoir une largeur minimale */
        requireMinWidth: true,
        /** Largeur minimale */
        minWidth: '200px',
        /** Si le drawer doit avoir une largeur maximale */
        requireMaxWidth: true,
        /** Largeur maximale */
        maxWidth: '500px',
        /** Si le drawer doit avoir une hauteur minimale */
        requireMinHeight: true,
        /** Hauteur minimale */
        minHeight: '200px',
    },

    // ============================================================================
    // GESTION DES DONNÉES
    // ============================================================================

    data: {
        /** Si le drawer peut contenir des données personnalisées */
        allowCustomData: true,
        /** Si le drawer peut avoir des IDs uniques */
        allowUniqueIds: true,
        /** Si le drawer peut être groupé */
        allowGrouping: true,
        /** Si le drawer peut être filtré */
        allowFiltering: true,
        /** Si le drawer peut être trié */
        allowSorting: true,
    },
} as const;

/**
 * Extrait les valeurs par défaut pour Drawer depuis les specs
 * @returns Options par défaut pour Drawer
 */
export function getDrawerDefaults(): DrawerOptions {
    return {
        edge: DrawerSpecs.positions.default as 'left' | 'right',
        draggable: true,
        inDuration: DrawerSpecs.animations.enter.duration,
        outDuration: DrawerSpecs.animations.exit.duration,
        dismissible: true,
        open: false,
        width: '280px',
        modal: true,
        overlayOpacity: 0.32,
        preventScrolling: true,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
        priorityLevel: PriorityLevel.MEDIUM,
    };
}
