/**
 * @fileoverview Spécifications du composant Shape K3UI
 * @description Spécifications et comportements pour les formes Material Design
 * @author K3UI Team
 * @version 1.0.0
 */

import type { AnimationConfig } from '../../types/components/animations';
import { ShapeOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Spécifications du composant Shape
 */
export const ShapeSpecs = {
    // ============================================================================
    // COMPORTEMENTS PAR DÉFAUT
    // ============================================================================

    behaviors: {
        /** Si la forme est cliquable */
        clickable: false,
        /** Si la forme est sélectionnable */
        selectable: false,
        /** Si la forme est draggable */
        draggable: false,
        /** Si la forme est animée */
        animated: false,
        /** Si la forme répond au hover */
        hoverable: false,
        /** Si la forme est en mode lecture seule */
        readonly: false,
        /** Si la forme peut être redimensionnée */
        resizable: false,
    },

    // ============================================================================
    // ANIMATIONS
    // ============================================================================

    animations: {
        enter: {
            type: 'scale' as const,
            duration: 300,
            easing: 'ease-out' as const,
            direction: 'center' as const,
        } as AnimationConfig,

        exit: {
            type: 'scale' as const,
            duration: 250,
            easing: 'ease-in' as const,
            direction: 'center' as const,
        } as AnimationConfig,

        hover: {
            type: 'scale' as const,
            duration: 200,
            easing: 'ease-out' as const,
            direction: 'center' as const,
        } as AnimationConfig,

        pulse: {
            type: 'pulse' as const,
            duration: 1000,
            easing: 'ease-in-out' as const,
            direction: 'center' as const,
            iterations: 'infinite' as const,
        } as AnimationConfig,
    },

    // ============================================================================
    // FORMES DISPONIBLES
    // ============================================================================

    shapes: {
        available: [
            'heart',
            'star',
            'circle',
            'square',
            'triangle',
            'diamond',
            'hexagon',
            'octagon',
            'cloud',
            'sun',
            'moon',
            'flower',
            'leaf',
            'butterfly',
            'bird',
            'fish',
            'cat',
            'dog',
            'bear',
            'rabbit'
        ] as const,

        default: 'heart' as const,

        /** Configuration par forme */
        config: {
            heart: {
                path: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
                viewBox: '0 0 24 24',
            },
            star: {
                path: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
                viewBox: '0 0 24 24',
            },
            circle: {
                path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z',
                viewBox: '0 0 24 24',
            },
        },
    },

    // ============================================================================
    // VARIANTS
    // ============================================================================

    variants: {
        available: [
            'mask',
            'outline',
            'filled',
            'gradient'
        ] as const,

        default: 'mask' as const,

        /** Configuration par variant */
        config: {
            mask: {
                fill: 'currentColor',
                stroke: 'none',
                opacity: 1,
            },
            outline: {
                fill: 'transparent',
                stroke: 'currentColor',
                strokeWidth: 2,
                opacity: 1,
            },
            filled: {
                fill: 'currentColor',
                stroke: 'none',
                opacity: 1,
            },
            gradient: {
                fill: 'url(#gradient)',
                stroke: 'none',
                opacity: 1,
            },
        },
    },

    // ============================================================================
    // TAILLES
    // ============================================================================

    sizes: {
        available: [
            'xs',
            'sm',
            'md',
            'lg',
            'xl'
        ] as const,

        default: 'md' as const,

        /** Configuration par taille */
        config: {
            xs: {
                width: '16px',
                height: '16px',
            },
            sm: {
                width: '24px',
                height: '24px',
            },
            md: {
                width: '32px',
                height: '32px',
            },
            lg: {
                width: '48px',
                height: '48px',
            },
            xl: {
                width: '64px',
                height: '64px',
            },
        },
    },

    // ============================================================================
    // ACCESSIBILITÉ
    // ============================================================================

    accessibility: {
        /** Rôle ARIA */
        role: 'img' as const,
        /** Si la forme est focusable */
        focusable: false,
        /** Ordre de tabulation */
        tabIndex: -1,
        /** Labels ARIA par défaut */
        labels: {
            heart: 'Cœur',
            star: 'Étoile',
            circle: 'Cercle',
            square: 'Carré',
            triangle: 'Triangle',
            diamond: 'Diamant',
        },
        /** Si la forme respecte les préférences de mouvement réduit */
        respectReducedMotion: true,
        /** Si la forme a une description textuelle */
        hasTextDescription: false,
    },

    // ============================================================================
    // INTERACTIONS
    // ============================================================================

    interactions: {
        /** Si la forme répond au clic */
        clickable: false,
        /** Si la forme répond au hover */
        hoverable: false,
        /** Si la forme répond au focus */
        focusable: false,
        /** Si la forme peut être sélectionnée */
        selectable: false,
        /** Si la forme peut être glissée */
        draggable: false,
        /** Si la forme peut être redimensionnée */
        resizable: false,
        /** Si la forme peut être tournée */
        rotatable: false,
    },

    // ============================================================================
    // RESPONSIVE
    // ============================================================================

    responsive: {
        /** Si la forme s'adapte aux petits écrans */
        adaptive: true,
        /** Taille par défaut sur mobile */
        mobileSize: 'sm' as const,
        /** Taille par défaut sur desktop */
        desktopSize: 'md' as const,
        /** Si la forme se redimensionne automatiquement */
        autoResize: false,
        /** Si la forme s'adapte au conteneur */
        fitToContainer: false,
    },

    // ============================================================================
    // PERFORMANCE
    // ============================================================================

    performance: {
        /** Si l'animation est désactivée sur mobile */
        disableAnimationOnMobile: true,
        /** Si le rendu est différé */
        deferredRendering: false,
        /** Si la forme est mise en cache */
        cached: true,
        /** Taille maximale du cache */
        maxCacheSize: 100,
        /** Si les formes sont optimisées pour le rendu */
        optimizedRendering: true,
    },

    // ============================================================================
    // THÈMES ET STYLES
    // ============================================================================

    theming: {
        /** Si la forme suit le thème système */
        followSystemTheme: true,
        /** Couleurs par défaut */
        colors: {
            primary: 'var(--k3ui-primary)',
            secondary: 'var(--k3ui-secondary)',
            tertiary: 'var(--k3ui-tertiary)',
            error: 'var(--k3ui-error)',
            warning: 'var(--k3ui-warning)',
            info: 'var(--k3ui-info)',
            success: 'var(--k3ui-success)',
        },

        /** Styles par état */
        states: {
            default: {
                color: 'var(--k3ui-on-surface)',
                opacity: 1,
            },
            hover: {
                color: 'var(--k3ui-primary)',
                opacity: 0.8,
            },
            focus: {
                color: 'var(--k3ui-primary)',
                opacity: 1,
            },
            selected: {
                color: 'var(--k3ui-primary)',
                opacity: 1,
            },
            disabled: {
                color: 'var(--k3ui-on-surface-disabled)',
                opacity: 0.38,
            },
        },
    },

    // ============================================================================
    // GRADIENTS ET EFFETS
    // ============================================================================

    effects: {
        /** Si les gradients sont supportés */
        gradientsSupported: true,
        /** Types de gradients disponibles */
        gradientTypes: [
            'linear',
            'radial',
            'conic'
        ] as const,

        /** Gradients par défaut */
        defaultGradients: {
            primary: 'linear-gradient(45deg, var(--k3ui-primary), var(--k3ui-primary-container))',
            secondary: 'linear-gradient(45deg, var(--k3ui-secondary), var(--k3ui-secondary-container))',
            rainbow: 'linear-gradient(45deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080)',
        },

        /** Si les effets de blur sont supportés */
        blurSupported: true,
        /** Si les effets de shadow sont supportés */
        shadowSupported: true,
    },

    // ============================================================================
    // SONS ET FEEDBACK
    // ============================================================================

    audio: {
        /** Si les sons sont activés */
        enabled: false,
        /** Sons par action */
        sounds: {
            click: 'click.mp3',
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
                heart: 'Cœur',
                star: 'Étoile',
                circle: 'Cercle',
                square: 'Carré',
            },
            en: {
                heart: 'Heart',
                star: 'Star',
                circle: 'Circle',
                square: 'Square',
            },
        },
    },

    // ============================================================================
    // VALIDATION
    // ============================================================================

    validation: {
        /** Si la forme doit avoir une taille minimale */
        requireMinSize: false,
        /** Taille minimale */
        minSize: '16px',
        /** Si la forme doit avoir une taille maximale */
        requireMaxSize: false,
        /** Taille maximale */
        maxSize: '200px',
        /** Si la forme doit avoir une couleur */
        requireColor: false,
    },

    // ============================================================================
    // GESTION DES DONNÉES
    // ============================================================================

    data: {
        /** Si la forme peut contenir des données personnalisées */
        allowCustomData: true,
        /** Si la forme peut avoir des IDs uniques */
        allowUniqueIds: true,
        /** Si la forme peut être groupée */
        allowGrouping: true,
        /** Si la forme peut être filtrée */
        allowFiltering: true,
        /** Si la forme peut être triée */
        allowSorting: true,
    },
} as const;

/**
 * Extrait les valeurs par défaut pour Shape depuis les specs
 * @returns Options par défaut pour Shape
 */
export function getShapeDefaults(): ShapeOptions {
    return {
        shape: ShapeSpecs.shapes.default,
        variant: 'mask',
        size: 'md',
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
        priorityLevel: PriorityLevel.MEDIUM,
    };
}
