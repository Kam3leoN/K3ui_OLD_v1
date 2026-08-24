/**
 * @fileoverview Spécifications du composant Table K3UI
 * @description Spécifications et comportements pour le composant Table
 * @author K3UI Team
 * @version 1.0.0
 */

import type { AnimationConfig } from '../../types/components/animations';
import { TableOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Spécifications du composant Table
 */
export const TableSpecs = {
    // ============================================================================
    // COMPORTEMENTS PAR DÉFAUT
    // ============================================================================

    behaviors: {
        /** Tri activé par défaut */
        sortable: false,
        /** Sélection activée par défaut */
        selectable: false,
        /** Sélection multiple activée par défaut */
        multiSelect: false,
    },

    // ============================================================================
    // ANIMATIONS
    // ============================================================================

    animations: {
        enter: {
            type: 'fade' as const,
            duration: 300,
            easing: 'ease-out' as const,
        } as AnimationConfig,

        exit: {
            type: 'fade' as const,
            duration: 300,
            easing: 'ease-in' as const,
        } as AnimationConfig,
    },

    // ============================================================================
    // ACCESSIBILITÉ
    // ============================================================================

    accessibility: {
        /** Rôle ARIA par défaut */
        role: 'table',
        /** Auto-désactiver pour mouvement réduit */
        autoDisableForReducedMotion: false,
    },
};

/**
 * Extrait les valeurs par défaut pour Table
 * @returns Options par défaut
 */
export function getTableDefaults(): TableOptions {
    return {
        // Options de base
        priorityLevel: PriorityLevel.MEDIUM,

        // Options spécifiques (libellés par défaut : LocaleManager table.*)
        ariaLabel: undefined,
        sortable: false,
        selectable: false,
        multiSelect: false,

        // Options de recherche
        searchable: false,
        searchPlaceholder: undefined,

        // Options de pagination
        pagination: false,
        itemsPerPage: 10,

        // Callbacks
        onSort: null,
        onRowSelect: null,
        onRowAction: null,
        onSearch: null,
        onPageChange: null,
    };
}

