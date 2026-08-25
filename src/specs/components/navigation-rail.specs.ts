/**
 * @fileoverview Spécifications du composant NavigationRail K3UI
 * @description Material Design 3 - Navigation Rail Expressive (rail vertical, pill comme Bottom Navigation)
 * @author K3UI Team
 * @version 1.0.0
 */

import type { AnimationConfig } from '../../types/components/animations';
import type { NavigationRailOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Spécifications du composant Navigation Rail (Material Design 3 Expressive)
 */
export const NavigationRailSpecs = {
    behaviors: {
        defaultActiveIndex: 0,
        defaultExpanded: false,
        /**
         * Divider trait désactivé par défaut — séparation = gap type panes
         * (8px / `--docs-pane-gap`, leading·trailing ↔ panel-content).
         * Passer `footerDividerEnabled: true` pour le trait M3 classique.
         */
        defaultFooterDividerEnabled: false,
        /**
         * Bordure inline-end désactivée par défaut (surface continue M3).
         * Passer `border: true` pour le trait outline.
         */
        defaultBorder: false,
        /**
         * Mode d’expansion :
         * - `push` : élargit le rail et pousse le contenu (padding container)
         * - `modal` : élargit le rail en overlay + scrim, sans pousser (comme Drawer)
         */
        defaultExpandMode: 'push' as const,
        /** Opacité du scrim en mode modal (0–1) */
        defaultOverlayOpacity: 0.32,
        /** Clic scrim → collapse en mode modal */
        defaultDismissible: true,
        /** Bloque le scroll body quand le rail modal est ouvert */
        defaultPreventScrolling: true,
        /** Plafond footer : destinations + actions (ex. Paramètres, Crédits, API). */
        footerMaxItems: 3,
    },

    animations: {
        /** M3 MotionScheme : spatial (bounds) + effects (opacité/couleur) — schéma expressive par défaut */
        expand: {
            spatial: 'default' as const,
            effects: 'default' as const,
            scheme: 'expressive' as const,
        },
        /**
         * M3 Expressive / Android ActiveIndicatorTransform :
         * scaleX 0.4→1 (spatial-fast) + fade sur le premier 1/5 (ALPHA_FRACTION).
         * Harmonisé NavigationBar ↔ NavigationRail.
         */
        pill: {
            type: 'scale' as const,
            duration: 350,
            easing: 'spatial-fast' as const,
            navDelayMs: 140,
        } as AnimationConfig,
    },

    dimensions: {
        widthCollapsed: 96,
        widthExpanded: 256,
        /** Aligné sur --md-sys-motion-spatial-default-duration (500ms expressive) */
        expandDurationMs: 500,
        /** Fermeture plus réactive — spatial-fast (350ms expressive) */
        collapseDurationMs: 350,
        iconSize: 24,
        pillWidth: 56,
        pillHeight: 32,
        iconLabelGap: 8,
        iconLabelGapExpanded: 16,
        itemLeadingExpanded: 36,
        pillInsetInline: 12,
        contentLeadingExpanded: 24,
        pillRadius: 16,
        pillExpandedRadius: 28,
    },

    accessibility: {
        role: 'navigation' as const,
        tabRole: 'tab' as const,
    },

    priority: PriorityLevel.MEDIUM,
} as const;

/**
 * Extrait les valeurs par défaut pour NavigationRail
 */
export function getNavigationRailDefaults(): NavigationRailOptions {
    return {
        id: undefined,
        activeIndex: NavigationRailSpecs.behaviors.defaultActiveIndex,
        expanded: NavigationRailSpecs.behaviors.defaultExpanded,
        expandMode: NavigationRailSpecs.behaviors.defaultExpandMode,
        overlayOpacity: NavigationRailSpecs.behaviors.defaultOverlayOpacity,
        dismissible: NavigationRailSpecs.behaviors.defaultDismissible,
        preventScrolling: NavigationRailSpecs.behaviors.defaultPreventScrolling,
        footerDividerEnabled: NavigationRailSpecs.behaviors.defaultFooterDividerEnabled,
        border: NavigationRailSpecs.behaviors.defaultBorder,
        onChange: null,
        onClick: null,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
        priorityLevel: PriorityLevel.MEDIUM,
    };
}
