/**
 * @fileoverview Spécifications du composant Card K3UI
 * @description Spécifications et comportements pour les cartes
 * @author K3UI Team
 * @version 1.0.0
 */

import type { AnimationConfig } from '../../types/components/animations';
import { CardOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Spécifications du composant Card
 */
export const CardSpecs = {
    // ============================================================================
    // COMPORTEMENTS PAR DÉFAUT
    // ============================================================================

    behaviors: {
        /** Si la carte est cliquable */
        clickable: false,
        /** Si la carte est sélectionnable */
        selectable: false,
        /** Si la carte est draggable */
        draggable: false,
        /** Si la carte est redimensionnable */
        resizable: false,
        /** Si la carte est collapsible */
        collapsible: false,
        /** Si la carte est expandable */
        expandable: false,
        /** Si la carte est en mode lecture seule */
        readonly: false,
        /** Si la carte est en mode édition */
        editable: false,
    },

    // ============================================================================
    // ANIMATIONS
    // ============================================================================

    animations: {
        enter: {
            type: 'fade' as const,
            duration: 300,
            easing: 'ease-out' as const,
            direction: 'in' as const,
        } as AnimationConfig,

        exit: {
            type: 'fade' as const,
            duration: 250,
            easing: 'ease-in' as const,
            direction: 'out' as const,
        } as AnimationConfig,

        hover: {
            type: 'scale' as const,
            duration: 200,
            easing: 'ease-out' as const,
            direction: 'center' as const,
        } as AnimationConfig,

        select: {
            type: 'scale' as const,
            duration: 150,
            easing: 'ease-out' as const,
            direction: 'center' as const,
        } as AnimationConfig,
    },

    // ============================================================================
    // TYPES ET VARIANTS
    // ============================================================================

    types: {
        available: [
            'elevated',
            'outlined',
            'filled'
        ] as const,

        default: 'elevated' as const,

        /** Configuration par type */
        config: {
            elevated: {
                backgroundColor: 'var(--k3ui-surface-container-low)',
                border: 'none',
                elevation: 1,
            },
            outlined: {
                backgroundColor: 'var(--k3ui-surface)',
                border: '1px solid var(--k3ui-outline)',
                elevation: 0,
            },
            filled: {
                backgroundColor: 'var(--k3ui-surface-container-highest)',
                border: 'none',
                elevation: 0,
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
            'large'
        ] as const,

        default: 'medium' as const,

        /** Configuration par taille */
        config: {
            small: {
                padding: '12px',
                borderRadius: 'var(--k3ui-shape-small)',
                fontSize: 'var(--k3ui-body-small)',
            },
            medium: {
                padding: '16px',
                borderRadius: 'var(--k3ui-shape-medium)',
                fontSize: 'var(--k3ui-body-medium)',
            },
            large: {
                padding: '24px',
                borderRadius: 'var(--k3ui-shape-large)',
                fontSize: 'var(--k3ui-body-large)',
            },
        },
    },

    // ============================================================================
    // LAYOUT ET STRUCTURE
    // ============================================================================

    layout: {
        /** Zones disponibles */
        areas: [
            'header',
            'content',
            'actions',
            'footer'
        ] as const,

        /** Configuration des zones */
        areasConfig: {
            header: {
                padding: '16px 16px 8px 16px',
                backgroundColor: 'transparent',
            },
            content: {
                padding: '8px 16px',
                backgroundColor: 'transparent',
            },
            actions: {
                padding: '8px 16px 16px 16px',
                backgroundColor: 'transparent',
                justifyContent: 'flex-end',
            },
            footer: {
                padding: '8px 16px 16px 16px',
                backgroundColor: 'transparent',
            },
        },

        /** Si la carte utilise un layout flex */
        useFlexLayout: true,
        /** Direction du layout */
        direction: 'column' as const,
    },

    // ============================================================================
    // ACCESSIBILITÉ
    // ============================================================================

    accessibility: {
        /** Rôle ARIA statique */
        role: 'article' as const,
        /** Rôle ARIA interactif */
        interactiveRole: 'button' as const,
        /** Si la carte est focusable */
        focusable: false,
        /** Ordre de tabulation */
        tabIndex: -1,
        /** Labels ARIA par défaut */
        labels: {
            card: 'Carte',
            clickable: 'Carte cliquable',
            selectable: 'Carte sélectionnable',
        },
        /** Si la carte annonce ses changements d'état */
        announceStateChanges: true,
        /** Si la carte respecte les préférences de mouvement réduit */
        respectReducedMotion: true,
    },

    // ============================================================================
    // INTERACTIONS
    // ============================================================================

    interactions: {
        /** Si la carte répond au clic */
        clickable: false,
        /** Si la carte répond au hover */
        hoverable: true,
        /** Si la carte répond au focus */
        focusable: false,
        /** Si la carte peut être sélectionnée */
        selectable: false,
        /** Si la carte peut être glissée */
        draggable: false,
        /** Si la carte peut être redimensionnée */
        resizable: false,
        /** Si la carte peut être collapsée */
        collapsible: false,
    },

    // ============================================================================
    // RESPONSIVE
    // ============================================================================

    responsive: {
        /** Si la carte s'adapte aux petits écrans */
        adaptive: true,
        /** Largeur maximale sur mobile */
        maxWidthMobile: '100%',
        /** Largeur maximale sur desktop */
        maxWidthDesktop: '400px',
        /** Taille par défaut sur mobile */
        mobileSize: 'medium' as const,
        /** Taille par défaut sur desktop */
        desktopSize: 'medium' as const,
        /** Si la carte utilise une largeur fluide */
        fluidWidth: false,
        /** Si la carte s'empile sur mobile */
        stackOnMobile: false,
    },

    // ============================================================================
    // PERFORMANCE
    // ============================================================================

    performance: {
        /** Si l'animation est désactivée sur mobile */
        disableAnimationOnMobile: false,
        /** Si le rendu est différé */
        deferredRendering: false,
        /** Si la carte est mise en cache */
        cached: false,
        /** Taille maximale du cache */
        maxCacheSize: 50,
    },

    // ============================================================================
    // THÈMES ET STYLES
    // ============================================================================

    theming: {
        /** Si la carte suit le thème système */
        followSystemTheme: true,
        /** Styles par état */
        states: {
            default: {
                backgroundColor: 'var(--k3ui-surface)',
                color: 'var(--k3ui-on-surface)',
                border: '1px solid var(--k3ui-outline-variant)',
            },
            hover: {
                stateLayerOpacity: 0.08,
            },
            focus: {
                stateLayerOpacity: 0.12,
                outline: '2px solid var(--k3ui-primary)',
            },
            pressed: {
                stateLayerOpacity: 0.12,
            },
            selected: {
                backgroundColor: 'var(--k3ui-primary-container)',
                color: 'var(--k3ui-on-primary-container)',
                border: '1px solid var(--k3ui-primary)',
            },
            disabled: {
                backgroundColor: 'var(--k3ui-surface-disabled)',
                color: 'var(--k3ui-on-surface-disabled)',
                border: '1px solid var(--k3ui-outline-disabled)',
                opacity: 0.38,
            },
        },
    },

    // ============================================================================
    // IMAGES ET MÉDIAS
    // ============================================================================

    media: {
        /** Si les images sont supportées */
        supported: true,
        /** Position des images */
        position: {
            available: [
                'top',
                'bottom',
                'left',
                'right',
                'background'
            ] as const,

            default: 'top' as const,
        },

        /** Taille des images */
        size: {
            small: '120px',
            medium: '200px',
            large: '300px',
        },

        /** Ratio d'aspect par défaut */
        aspectRatio: '16:9' as const,

        /** Si les images sont lazy-loaded */
        lazyLoading: true,
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

        /** Nombre maximum d'actions */
        maxActions: 3,

        /** Types d'actions disponibles */
        available: [
            'button',
            'icon',
            'link',
            'toggle'
        ] as const,
    },

    // ============================================================================
    // SONS ET FEEDBACK (hors périmètre M3 — @deprecated)
    // ============================================================================

    /** @deprecated Hors spécification M3 — conservé pour rétrocompatibilité */
    audio: {
        /** Si les sons sont activés */
        enabled: true,
        /** Sons par action */
        sounds: {
            click: 'click.mp3',
            select: 'select.mp3',
            hover: 'hover.mp3',
        },
        /** Volume par défaut */
        volume: 0.3,
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
                card: 'Carte',
                clickable: 'Carte cliquable',
                selectable: 'Carte sélectionnable',
            },
            en: {
                card: 'Card',
                clickable: 'Clickable card',
                selectable: 'Selectable card',
            },
        },
    },

    // ============================================================================
    // VALIDATION
    // ============================================================================

    validation: {
        /** Longueur maximale du titre */
        maxTitleLength: 100,
        /** Longueur maximale du contenu */
        maxContentLength: 1000,
        /** Caractères interdits */
        forbiddenCharacters: ['<', '>'],
        /** Si le HTML est autorisé */
        allowHTML: true,
        /** Si les images sont requises */
        requireImage: false,
    },

    // ============================================================================
    // GESTION DES DONNÉES
    // ============================================================================

    data: {
        /** Si la carte peut contenir des données personnalisées */
        allowCustomData: true,
        /** Si la carte peut avoir des IDs uniques */
        allowUniqueIds: true,
        /** Si la carte peut être groupée */
        allowGrouping: true,
        /** Si la carte peut être filtrée */
        allowFiltering: true,
        /** Si la carte peut être triée */
        allowSorting: true,
    },
} as const;

/**
 * Extrait les valeurs par défaut pour Card depuis les specs
 * @returns Options par défaut pour Card
 */
export function getCardDefaults(): CardOptions {
    return {
        variant: 'elevated',
        size: 'medium',
        shape: 'medium',
        elevation: 1,
        data: null,
        interactive: false,
        checkable: false,
        selected: false,
        allowHTML: false,
        ripple: true,
        horizontalActions: false,
        verticalActions: false,
        fullWidth: false,
        height: null,
        width: null,
        onClick: undefined,
        onActionClick: undefined,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
        priorityLevel: PriorityLevel.MEDIUM,
    };
}
