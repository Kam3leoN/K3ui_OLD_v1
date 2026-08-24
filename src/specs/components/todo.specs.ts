/**
 * @fileoverview Spécifications du composant Todo K3UI
 * @description Spécifications et comportements pour les listes de tâches selon Material Design 3
 * @author K3UI Team
 * @version 1.0.0
 */

import type { AnimationConfig } from '../../types/components/animations';
import { TodoOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Spécifications du composant Todo
 */
export const TodoSpecs = {
    // ============================================================================
    // COMPORTEMENTS PAR DÉFAUT
    // ============================================================================

    behaviors: {
        /** Liste initiale de tâches */
        initialItems: [] as Array<{ id: string; text: string; completed: boolean }>,
        /** Filtre actif par défaut */
        defaultFilter: 'all' as 'all' | 'active' | 'completed',
        /**
         * Activer la persistance dans localStorage
         * @default false — minimisation des données (RGPD) : le contenu du Todo est une donnée utilisateur
         * (catégorie `optional`) qui ne doit pas être écrite sans consentement explicite via
         * `PrivacyManager.setConsent('optional', true)`. Voir la section Privacy/GDPR du README.
         */
        persistToStorage: false,
        /** Clé de stockage localStorage */
        storageKey: 'k3ui-todo',
        /** Placeholder pour l'input d'ajout */
        placeholder: 'Ajouter une tâche...',
        /** Permettre l'édition par double-clic */
        allowEditOnDoubleClick: true,
        /** Afficher le compteur de tâches */
        showCounter: true,
        /** Afficher le bouton de suppression des tâches terminées */
        showClearCompleted: true,
    },

    // ============================================================================
    // ANIMATIONS
    // ============================================================================

    animations: {
        add: {
            type: 'fade' as const,
            duration: 200,
            easing: 'ease-out' as const,
            direction: 'top' as const,
        } as AnimationConfig,
        remove: {
            type: 'fade' as const,
            duration: 200,
            easing: 'ease-in' as const,
            direction: 'bottom' as const,
        } as AnimationConfig,
        edit: {
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
        ] as const,

        default: 'default' as const,
    },

    // ============================================================================
    // ACCESSIBILITÉ
    // ============================================================================

    accessibility: {
        /** Rôle ARIA de la liste */
        listRole: 'list' as const,
        /** Rôle ARIA d'un item */
        itemRole: 'listitem' as const,
        /** Si la liste est focusable */
        focusable: true,
        /** Labels ARIA par défaut */
        labels: {
            addTask: 'Ajouter une tâche',
            editTask: 'Modifier la tâche',
            deleteTask: 'Supprimer la tâche',
            markComplete: 'Marquer comme terminé',
            markIncomplete: 'Marquer comme non terminé',
            filterAll: 'Afficher toutes les tâches',
            filterActive: 'Afficher les tâches actives',
            filterCompleted: 'Afficher les tâches terminées',
            clearCompleted: 'Supprimer toutes les tâches terminées',
            taskCounter: 'Tâches restantes',
        },
        /** Si la liste annonce ses changements */
        announceChanges: true,
    },

    // ============================================================================
    // INTERACTIONS
    // ============================================================================

    interactions: {
        /** Si la liste répond au clavier */
        keyboardEnabled: true,
        /** Si la liste répond au touch */
        touchEnabled: true,
        /** Permettre l'édition inline */
        allowInlineEdit: true,
        /** Permettre la suppression par clic */
        allowDeleteOnClick: true,
    },

    // ============================================================================
    // PERFORMANCE
    // ============================================================================

    performance: {
        /** Si l'animation est désactivée sur mobile */
        disableAnimationOnMobile: false,
        /** Si le rendu est différé */
        deferredRendering: false,
        /** Nombre maximum de tâches affichées simultanément */
        maxVisibleItems: 100,
    },

    // ============================================================================
    // THÈMES ET STYLES
    // ============================================================================

    theming: {
        /** Si la liste suit le thème système */
        followSystemTheme: true,
        /** Styles par état */
        states: {
            default: {
                backgroundColor: 'var(--md-sys-color-surface)',
                textColor: 'var(--md-sys-color-on-surface)',
            },
            completed: {
                textColor: 'var(--md-sys-color-on-surface-variant)',
                opacity: 0.6,
            },
            editing: {
                backgroundColor: 'var(--md-sys-color-surface-container-high)',
            },
        },
    },

    // ============================================================================
    // PRIORITÉ
    // ============================================================================

} as const;

/**
 * Extrait les valeurs par défaut pour Todo depuis les specs
 * @returns Options par défaut pour Todo
 */
export function getTodoDefaults(): TodoOptions {
    return {
        items: TodoSpecs.behaviors.initialItems,
        filter: TodoSpecs.behaviors.defaultFilter,
        persistToStorage: TodoSpecs.behaviors.persistToStorage,
        storageKey: TodoSpecs.behaviors.storageKey,
        placeholder: TodoSpecs.behaviors.placeholder,
        allowEditOnDoubleClick: TodoSpecs.behaviors.allowEditOnDoubleClick,
        showCounter: TodoSpecs.behaviors.showCounter,
        showClearCompleted: TodoSpecs.behaviors.showClearCompleted,
        onAdd: null,
        onRemove: null,
        onToggle: null,
        onEdit: null,
        onFilterChange: null,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
        priorityLevel: PriorityLevel.MEDIUM,
    };
}




