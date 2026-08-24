/**
 * @fileoverview Spécifications du composant Select K3UI
 * @description Spécifications et comportements pour les sélecteurs
 * @author K3UI Team
 * @version 1.0.0
 */

import type { AnimationConfig } from '../../types/components/animations';
import { SelectOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Spécifications du composant Select
 */
export const SelectSpecs = {
    // ============================================================================
    // COMPORTEMENTS PAR DÉFAUT
    // ============================================================================

    behaviors: {
        /** Si le select est activé par défaut */
        enabled: true,
        /** Si le select ferme au clic externe */
        closeOnClickOutside: true,
        /** Si le select ferme avec Escape */
        closeOnEscape: true,
        /** Si le select ferme après sélection */
        closeOnSelect: true,
        /** Si le select est en mode multiple */
        multiple: false,
        /** Si le select est en mode recherche */
        searchable: false,
        /** Si le select est en mode filtre */
        filterable: false,
        /** Si le select est en mode tri */
        sortable: false,
        /** Si le select est en mode autocomplete */
        autocomplete: false,
    },

    // ============================================================================
    // ANIMATIONS
    // ============================================================================

    animations: {
        enter: {
            type: 'slide' as const,
            duration: 200,
            easing: 'ease-out' as const,
            direction: 'down' as const,
        } as AnimationConfig,

        exit: {
            type: 'slide' as const,
            duration: 150,
            easing: 'ease-in' as const,
            direction: 'up' as const,
        } as AnimationConfig,

        hover: {
            type: 'scale' as const,
            duration: 100,
            easing: 'ease-out' as const,
            direction: 'center' as const,
        } as AnimationConfig,
    },

    // ============================================================================
    // TYPES ET VARIANTS
    // ============================================================================

    types: {
        available: [
            'default',
            'outlined',
            'filled',
            'underlined'
        ] as const,

        default: 'outlined' as const,

        /** Configuration par type */
        config: {
            default: {
                backgroundColor: 'var(--k3ui-surface)',
                border: '1px solid var(--k3ui-outline)',
                borderRadius: 'var(--k3ui-shape-small)',
            },
            outlined: {
                backgroundColor: 'transparent',
                border: '1px solid var(--k3ui-outline)',
                borderRadius: 'var(--k3ui-shape-small)',
            },
            filled: {
                backgroundColor: 'var(--k3ui-surface-container)',
                border: 'none',
                borderRadius: 'var(--k3ui-shape-small)',
            },
            underlined: {
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: '1px solid var(--k3ui-outline)',
                borderRadius: '0',
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
                height: '32px',
                padding: '4px 8px',
                fontSize: 'var(--k3ui-label-small)',
            },
            medium: {
                height: '40px',
                padding: '8px 12px',
                fontSize: 'var(--k3ui-label-medium)',
            },
            large: {
                height: '48px',
                padding: '12px 16px',
                fontSize: 'var(--k3ui-label-large)',
            },
        },
    },

    // ============================================================================
    // POSITIONS ET ALIGNEMENTS
    // ============================================================================

    positions: {
        available: [
            'bottom-start',
            'bottom-center',
            'bottom-end',
            'top-start',
            'top-center',
            'top-end'
        ] as const,

        default: 'bottom-start' as const,

        /** Marges de sécurité */
        margins: {
            top: 8,
            bottom: 8,
            left: 8,
            right: 8,
        },
    },

    // ============================================================================
    // ACCESSIBILITÉ
    // ============================================================================

    accessibility: {
        /** Rôle ARIA */
        role: 'combobox' as const,
        /** Si le select est focusable */
        focusable: true,
        /** Ordre de tabulation */
        tabIndex: 0,
        /** Labels ARIA par défaut */
        labels: {
            select: 'Sélecteur',
            trigger: 'Ouvrir le menu',
            option: 'Option',
            selected: 'Sélectionné',
            placeholder: 'Sélectionner une option',
        },
        /** Si le select respecte les préférences de mouvement réduit */
        respectReducedMotion: true,
        /** Si le select annonce ses changements d'état */
        announceStateChanges: true,
    },

    // ============================================================================
    // INTERACTIONS
    // ============================================================================

    interactions: {
        /** Si le select répond au clic */
        clickable: true,
        /** Si le select répond au hover */
        hoverable: true,
        /** Si le select répond au focus */
        focusable: true,
        /** Si le select peut être activé au clavier */
        keyboardActivable: true,
        /** Si le select peut être activé au touch */
        touchActivable: true,
        /** Si le select peut être glissé */
        draggable: false,
    },

    // ============================================================================
    // RESPONSIVE
    // ============================================================================

    responsive: {
        /** Si le select s'adapte aux petits écrans */
        adaptive: true,
        /** Largeur maximale sur mobile */
        maxWidthMobile: '90vw',
        /** Largeur maximale sur desktop */
        maxWidthDesktop: '300px',
        /** Position par défaut sur mobile */
        mobilePosition: 'bottom-center' as const,
        /** Position par défaut sur desktop */
        desktopPosition: 'bottom-start' as const,
        /** Si le select utilise une position fixe sur mobile */
        fixedPositionOnMobile: false,
    },

    // ============================================================================
    // PERFORMANCE
    // ============================================================================

    performance: {
        /** Si l'animation est désactivée sur mobile */
        disableAnimationOnMobile: false,
        /** Si le rendu est différé */
        deferredRendering: true,
        /** Si les options sont mises en cache */
        cached: true,
        /** Taille maximale du cache */
        maxCacheSize: 100,
        /** Si le select utilise la virtualisation */
        virtualized: false,
    },

    // ============================================================================
    // THÈMES ET STYLES
    // ============================================================================

    theming: {
        /** Si le select suit le thème système */
        followSystemTheme: true,
        /** Styles par état */
        states: {
            default: {
                backgroundColor: 'transparent',
                color: 'var(--k3ui-on-surface)',
                border: '1px solid var(--k3ui-outline)',
            },
            hover: {
                backgroundColor: 'var(--k3ui-surface-container-highest)',
                color: 'var(--k3ui-on-surface)',
                border: '1px solid var(--k3ui-outline)',
            },
            focus: {
                backgroundColor: 'var(--k3ui-surface-container-highest)',
                color: 'var(--k3ui-on-surface)',
                border: '2px solid var(--k3ui-primary)',
            },
            open: {
                backgroundColor: 'var(--k3ui-surface-container-highest)',
                color: 'var(--k3ui-on-surface)',
                border: '1px solid var(--k3ui-outline)',
                elevation: 2,
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
    // OPTIONS ET ITEMS
    // ============================================================================

    options: {
        /** Si les options sont groupées */
        groupable: true,
        /** Si les options sont séparables */
        separable: true,
        /** Si les options sont désactivables */
        disableable: true,
        /** Si les options sont sélectionnables */
        selectable: true,
        /** Si les options sont filtrables */
        filterable: true,
        /** Si les options sont triables */
        sortable: true,
        /** Si les options sont recherchables */
        searchable: true,
        /** Si les options sont autocomplétables */
        autocompletable: true,
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
            select: 'click.mp3',
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
                placeholder: 'Sélectionner une option',
                noResults: 'Aucun résultat',
                search: 'Rechercher',
                selectAll: 'Tout sélectionner',
                clear: 'Effacer',
            },
            en: {
                placeholder: 'Select an option',
                noResults: 'No results',
                search: 'Search',
                selectAll: 'Select all',
                clear: 'Clear',
            },
        },
    },

    // ============================================================================
    // VALIDATION
    // ============================================================================

    validation: {
        /** Si le select doit avoir une valeur */
        required: false,
        /** Si le select doit avoir une valeur minimale */
        minItems: 0,
        /** Si le select doit avoir une valeur maximale */
        maxItems: 100,
        /** Si le select doit valider les options */
        validateOptions: true,
        /** Si le select doit valider les sélections */
        validateSelections: true,
    },

    // ============================================================================
    // GESTION DES DONNÉES
    // ============================================================================

    data: {
        /** Si le select peut contenir des données personnalisées */
        allowCustomData: true,
        /** Si le select peut avoir des IDs uniques */
        allowUniqueIds: true,
        /** Si le select peut être groupé */
        allowGrouping: true,
        /** Si le select peut être filtré */
        allowFiltering: true,
        /** Si le select peut être trié */
        allowSorting: true,
    },
} as const;

/**
 * Extrait les valeurs par défaut pour Select depuis les specs
 * @returns Options par défaut pour Select
 */
export function getSelectDefaults(): SelectOptions {
    return {
        variant: 'outlined',
        classes: '',
        menuOptions: {
            closeOnClick: SelectSpecs.behaviors.closeOnSelect,
            coverTrigger: false,
        },
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
        onOptionSelect: null,
        priorityLevel: PriorityLevel.MEDIUM,
        leadingIcon: null,
    };
}
