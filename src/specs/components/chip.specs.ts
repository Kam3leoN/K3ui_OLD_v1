/**
 * @fileoverview Spécifications du composant Chip K3UI
 * @description Spécifications et comportements pour les chips
 * @author K3UI Team
 * @version 1.0.0
 */

import type { AnimationConfig } from '../../types/components/animations';
import { ChipOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';
import { getHapticFeedbackDefaults } from '../common/haptic-feedback.specs';

/**
 * Spécifications du composant Chip
 */
export const ChipSpecs = {
    // ============================================================================
    // COMPORTEMENTS PAR DÉFAUT
    // ============================================================================

    behaviors: {
        /** Si les chips sont sélectionnables */
        selectable: false,
        /** Si les chips sont supprimables */
        removable: false,
        /** Si les chips sont éditables */
        editable: false,
        /** Si les chips sont triables */
        sortable: false,
        /** Si les chips sont filtrables */
        filterable: false,
        /** Si les chips sont draggables */
        draggable: false,
        /** Si les chips permettent la sélection multiple */
        multiple: false,
        /** Si les chips sont en mode lecture seule */
        readonly: false,
    },

    // ============================================================================
    // ANIMATIONS
    // ============================================================================

    animations: {
        enter: {
            type: 'scale' as const,
            duration: 200,
            easing: 'ease-out' as const,
            direction: 'center' as const,
        } as AnimationConfig,

        exit: {
            type: 'scale' as const,
            duration: 150,
            easing: 'ease-in' as const,
            direction: 'center' as const,
        } as AnimationConfig,

        select: {
            type: 'scale' as const,
            duration: 100,
            easing: 'ease-out' as const,
            direction: 'center' as const,
        } as AnimationConfig,

        hover: {
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
            'default',
            'outlined',
            'filled',
            'tonal'
        ] as const,

        default: 'default' as const,

        /** Configuration par type */
        config: {
            default: {
                backgroundColor: 'transparent',
                border: '1px solid var(--k3ui-outline)',
                color: 'var(--k3ui-on-surface)',
            },
            outlined: {
                backgroundColor: 'transparent',
                border: '1px solid var(--k3ui-outline)',
                color: 'var(--k3ui-on-surface)',
            },
            filled: {
                backgroundColor: 'var(--k3ui-surface-container)',
                border: 'none',
                color: 'var(--k3ui-on-surface)',
            },
            tonal: {
                backgroundColor: 'var(--k3ui-secondary-container)',
                border: 'none',
                color: 'var(--k3ui-on-secondary-container)',
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
                height: '24px',
                padding: '4px 8px',
                fontSize: 'var(--k3ui-label-small)',
                borderRadius: 'var(--k3ui-shape-extra-small)',
            },
            medium: {
                height: '32px',
                padding: '6px 12px',
                fontSize: 'var(--k3ui-label-medium)',
                borderRadius: 'var(--k3ui-shape-small)',
            },
            large: {
                height: '40px',
                padding: '8px 16px',
                fontSize: 'var(--k3ui-label-large)',
                borderRadius: 'var(--k3ui-shape-medium)',
            },
        },
    },

    // ============================================================================
    // ICÔNES
    // ============================================================================

    icons: {
        /** Si les icônes sont supportées */
        supported: true,
        /** Position des icônes */
        position: {
            available: [
                'leading',
                'trailing',
                'both'
            ] as const,

            default: 'leading' as const,
        },

        /** Icônes par défaut */
        default: {
            close: 'close',
            edit: 'edit',
            check: 'check',
            add: 'add',
        },

        /** Taille des icônes */
        size: {
            small: '16px',
            medium: '18px',
            large: '20px',
        },
    },

    // ============================================================================
    // ACCESSIBILITÉ
    // ============================================================================

    accessibility: {
        /** Rôle ARIA */
        role: 'button' as const,
        /** Si le chip est focusable */
        focusable: true,
        /** Ordre de tabulation */
        tabIndex: 0,
        /** Labels ARIA par défaut */
        labels: {
            remove: 'Supprimer le chip',
            select: 'Sélectionner le chip',
            edit: 'Modifier le chip',
            openMenu: 'Ouvrir le menu',
        },
        /** Si le chip annonce ses changements d'état */
        announceStateChanges: true,
        /** Si le chip respecte les préférences de mouvement réduit */
        respectReducedMotion: true,
    },

    // ============================================================================
    // INTERACTIONS
    // ============================================================================

    interactions: {
        /** Si le chip répond au clic */
        clickable: true,
        /** Si le chip répond au hover */
        hoverable: true,
        /** Si le chip répond au focus */
        focusable: true,
        /** Si le chip peut être sélectionné */
        selectable: false,
        /** Si le chip peut être supprimé */
        removable: false,
        /** Si le chip peut être édité */
        editable: false,
        /** Si le chip peut être glissé */
        draggable: false,
    },

    // ============================================================================
    // RESPONSIVE
    // ============================================================================

    responsive: {
        /** Si les chips s'adaptent aux petits écrans */
        adaptive: true,
        /** Taille par défaut sur mobile */
        mobileSize: 'small' as const,
        /** Taille par défaut sur desktop */
        desktopSize: 'medium' as const,
        /** Si les icônes sont cachées sur mobile */
        hideIconsOnMobile: false,
        /** Si les chips se réorganisent sur mobile */
        reflowOnMobile: true,
    },

    // ============================================================================
    // PERFORMANCE
    // ============================================================================

    performance: {
        /** Si les chips inactifs sont nettoyés */
        autoCleanup: false,
        /** Si l'animation est désactivée sur mobile */
        disableAnimationOnMobile: false,
        /** Si le rendu est différé */
        deferredRendering: false,
        /** Taille maximale du cache */
        maxCacheSize: 100,
    },

    // ============================================================================
    // THÈMES ET STYLES
    // ============================================================================

    theming: {
        /** Si le chip suit le thème système */
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
            selected: {
                backgroundColor: 'var(--k3ui-primary)',
                color: 'var(--k3ui-on-primary)',
                border: '1px solid var(--k3ui-primary)',
            },
            disabled: {
                backgroundColor: 'transparent',
                color: 'var(--k3ui-on-surface-disabled)',
                border: '1px solid var(--k3ui-outline-disabled)',
                opacity: 0.38,
            },
        },
    },

    // ============================================================================
    // SONS ET FEEDBACK
    // ============================================================================

    audio: {
        /** Si les sons sont activés */
        enabled: true,
        /** Sons par action */
        sounds: {
            select: 'click.mp3',
            remove: 'off.mp3',
            add: 'on.mp3',
            edit: 'beep.mp3',
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
                remove: 'Supprimer',
                select: 'Sélectionner',
                edit: 'Modifier',
                add: 'Ajouter',
            },
            en: {
                remove: 'Remove',
                select: 'Select',
                edit: 'Edit',
                add: 'Add',
            },
        },
    },

    // ============================================================================
    // VALIDATION
    // ============================================================================

    validation: {
        /** Longueur maximale du texte */
        maxTextLength: 50,
        /** Longueur minimale du texte */
        minTextLength: 1,
        /** Caractères interdits */
        forbiddenCharacters: ['<', '>', '"', "'"],
        /** Si le HTML est autorisé */
        allowHTML: false,
        /** Si les espaces en début/fin sont autorisés */
        allowLeadingTrailingSpaces: false,
    },

    // ============================================================================
    // GESTION DES DONNÉES
    // ============================================================================

    data: {
        /** Si les chips peuvent contenir des données personnalisées */
        allowCustomData: true,
        /** Si les chips peuvent avoir des IDs uniques */
        allowUniqueIds: true,
        /** Si les chips peuvent être groupés */
        allowGrouping: true,
        /** Si les chips peuvent être filtrés */
        allowFiltering: true,
        /** Si les chips peuvent être triés */
        allowSorting: true,
    },
} as const;

/**
 * Extrait les valeurs par défaut pour Chip depuis les specs
 * @returns Options par défaut pour Chip
 */
export function getChipDefaults(): ChipOptions {
    return {
        data: [],
        placeholder: '',
        secondaryPlaceholder: '',
        limit: Infinity,
        allowUserInput: false,
        selectable: ChipSpecs.behaviors.selectable,
        removable: ChipSpecs.behaviors.removable,
        multiSelect: false,
        size: ChipSpecs.sizes.default,
        variant: undefined,
        closeIconClass: 'k3ui-icon',
        onChipAdd: null,
        onChipSelect: null,
        onChipDelete: null,
        onChipClick: null,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
        priorityLevel: PriorityLevel.MEDIUM,
        ...getHapticFeedbackDefaults('selection'),
    };
}
