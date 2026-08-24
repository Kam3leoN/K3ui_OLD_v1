/**
 * @fileoverview Spécifications du composant NavigationMenu K3UI
 * @description Material Design 3 Expressive — menu de navigation hiérarchique (M3E nav-menu)
 * @author K3UI Team
 * @version 1.0.0
 */

import type { NavigationMenuOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';
import { getHapticFeedbackDefaults } from '../common/haptic-feedback.specs';

/**
 * Spécifications NavigationMenu (Material Design 3 Expressive / M3E nav-menu)
 */
export const NavigationMenuSpecs = {
    dimensions: {
        /** Hauteur d'une ligne d'item (56dp M3) */
        itemHeight: 56,
        /** Taille icône (24dp) */
        iconSize: 24,
        /** Indentation des items imbriqués (16dp) */
        itemInset: 16,
        /** Padding horizontal item (12dp) */
        itemPaddingInline: 12,
        /** Espacement icône ↔ label (12dp) */
        itemSpacing: 12,
        /** Rayon de forme (pill) */
        itemShape: 9999,
        /** Padding menu */
        paddingBlock: 8,
        paddingInline: 12,
    },

    animations: {
        /**
         * M3 MotionScheme expressive :
         * - expand : spatial-default (hauteur)
         * - collapse : spatial-fast (fermeture plus snappy)
         * - contenu : effects (fade / translate, sans bounce)
         * - indicator : scaleX horizontal (M3E selection-indicator grow)
         */
        expand: {
            spatial: 'default' as const,
            effects: 'default' as const,
            scheme: 'expressive' as const,
        },
        collapse: {
            spatial: 'fast' as const,
            effects: 'fast' as const,
            scheme: 'expressive' as const,
        },
        /** Aligné sur --md-sys-motion-spatial-default-duration (500ms expressive, overshoot) */
        expandDurationMs: 500,
        /** Fermeture douce (même durée, sans overshoot clampé) */
        collapseDurationMs: 500,
        /** Ouverture pilule scaleX — medium-2 (300ms) */
        indicatorDurationMs: 300,
    },

    accessibility: {
        role: 'tree' as const,
        itemRole: 'treeitem' as const,
    },

    priority: PriorityLevel.MEDIUM,
} as const;

/**
 * Valeurs par défaut NavigationMenu
 */
export function getNavigationMenuDefaults(): NavigationMenuOptions {
    return {
        id: undefined,
        onItemSelect: null,
        onItemOpen: null,
        onItemClose: null,
        onChange: null,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
        priorityLevel: PriorityLevel.MEDIUM,
        ...getHapticFeedbackDefaults('selection'),
    };
}
