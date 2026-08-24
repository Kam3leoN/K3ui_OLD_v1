/**
 * @fileoverview Spécifications du composant Tabs K3UI
 * @description Spécifications Material Design 3 Expressive pour les onglets
 * @author K3UI Team
 * @version 1.0.0
 */

import type { AnimationConfig } from '../../types/components/animations';
import type { TabsOptions, TabsDirection, TabsScrollable, TabsIndicatorPosition, TabsVariant } from '../../types/components';
import { PriorityLevel } from '../../types/base';
import { getHapticFeedbackDefaults } from '../common/haptic-feedback.specs';

/**
 * Spécifications du composant Tabs (Material Design 3)
 */
export const TabsSpecs = {
    // ============================================================================
    // COMPORTEMENTS PAR DÉFAUT
    // ============================================================================

    behaviors: {
        /** Index de l'onglet actif par défaut */
        defaultActive: 0,
        /** Direction de la barre d'onglets */
        layoutDirection: 'horizontal' as TabsDirection,
        /** Direction des panneaux */
        itemDirection: 'horizontal' as TabsDirection,
        /** Défilement de la barre */
        scrollable: 'auto' as TabsScrollable,
        /** Position de l'indicateur */
        indicatorPosition: 'normal' as TabsIndicatorPosition,
        /** Swipe entre panneaux activé */
        canSwipe: true,
        /** Transitions activées */
        animated: true,
        /** Variante : secondary = texte seul, primary = icône + label */
        variant: 'secondary' as TabsVariant,
    },

    // ============================================================================
    // ANIMATIONS
    // ============================================================================

    animations: {
        indicator: {
            type: 'slide' as const,
            duration: 300,
            easing: 'ease-out' as const,
        } as AnimationConfig,
        panel: {
            type: 'fade' as const,
            duration: 250,
            easing: 'ease-out' as const,
        } as AnimationConfig,
    },

    // ============================================================================
    // DIMENSIONS (Material Design 3)
    // ============================================================================

    dimensions: {
        /** Hauteur d'un onglet horizontal (px) - Secondary tabs */
        itemHeightHorizontal: 48,
        /** Hauteur d'un onglet Primary (icône + label) - MD3 */
        itemHeightPrimary: 64,
        /** Hauteur d'un onglet vertical (px) */
        itemHeightVertical: 72,
        /** Taille d'icône Primary tabs (px) - MD3 */
        iconSizePrimary: 24,
        /** Épaisseur de l'indicateur (px) */
        indicatorSize: 2,
        /** Padding horizontal du scroller (px) */
        scrollerPadding: 12,
        /** Rayon des bords (px) */
        radius: 2,
    },

    // ============================================================================
    // ACCESSIBILITÉ
    // ============================================================================

    accessibility: {
        /** Rôle de la barre d'onglets */
        tablistRole: 'tablist',
        /** Rôle de chaque onglet */
        tabRole: 'tab',
        /** Rôle de chaque panneau */
        tabpanelRole: 'tabpanel',
        /** Seuil de nombre d'onglets pour activer le scroll automatique */
        scrollableThreshold: 5,
    },

    // ============================================================================
    // PRIORITÉ
    // ============================================================================

    priority: PriorityLevel.MEDIUM,
} as const;

/**
 * Extrait les valeurs par défaut pour Tabs depuis les specs
 * @returns Options par défaut pour Tabs
 */
export function getTabsDefaults(): TabsOptions {
    return {
        active: TabsSpecs.behaviors.defaultActive,
        variant: TabsSpecs.behaviors.variant,
        layoutDirection: TabsSpecs.behaviors.layoutDirection,
        itemDirection: TabsSpecs.behaviors.itemDirection,
        scrollable: TabsSpecs.behaviors.scrollable,
        indicatorPosition: TabsSpecs.behaviors.indicatorPosition,
        indicatorSize: TabsSpecs.dimensions.indicatorSize,
        canSwipe: TabsSpecs.behaviors.canSwipe,
        animated: TabsSpecs.behaviors.animated,
        onClick: null,
        onChange: null,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
        priorityLevel: PriorityLevel.MEDIUM,
        ...getHapticFeedbackDefaults('selection'),
    };
}
