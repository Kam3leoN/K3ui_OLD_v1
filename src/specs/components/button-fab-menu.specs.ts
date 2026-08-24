/**
 * @fileoverview Spécifications du composant ButtonFabMenu K3UI
 * @description FAB Menu Material Design 3 Expressive — FAB principal + menu de pills
 * @see https://m3.material.io/components/fab-menu/overview
 * @see androidx.compose.material3.FloatingActionButtonMenu (StaggerEnter 35ms, StaggerExit 25ms, FastSpatial + FastEffects)
 * @author K3UI Team
 * @version 1.0.0
 */

import type { ButtonFabMenuOptions, ButtonFabMenuItem } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Spécifications ButtonFabMenu (M3 Expressive — FAB + Speed Dial)
 */
export const ButtonFabMenuSpecs = {
    behaviors: {
        defaultPosition: 'bottom-right' as const,
        defaultFabIcon: 'add',
        /** Hauteur des pills (actions) en px — M3 56dp */
        pillHeight: 56,
        /** Espace entre FAB et pills, et entre pills (px) */
        gap: 4,
        /** Marge du conteneur au bord (px) — 16px comme padding autour du trigger (aligné FAB layer) */
        edge: 16,
        /** Stagger entrée (ms) — StaggerEnterDelayMillis */
        staggerEnterMs: 35,
        /** Stagger sortie (ms) — StaggerExitDelayMillis */
        staggerExitMs: 25,
        /** Spatial Fast (ms) — expand / translate */
        spatialDurationMs: 350,
        /** Effects Fast (ms) — fade */
        effectsDurationMs: 150,
        /** Taille FAB (px) — M3 large FAB 56dp, expressive peut être plus grand */
        fabSize: 56,
        /** Border radius FAB fermé (px) — M3 16dp / expressive 18px */
        fabRadiusClosed: 18,
    },

    /** Couche globale .fab-menu-layer : position des slots selon app bar et navigation-rail */
    layer: {
        /** Inset depuis le bord du viewport (px) — 16px comme padding autour du trigger */
        insetPx: 16,
        /** Hauteur app bar (px) — FAB à inset + appBarHeight quand app bar visible */
        appBarHeightPx: 64,
        /**
         * Offset horizontal quand un navigation-rail est visible sur le même côté :
         * left/right du slot = largeur du rail + insetPx (géré dans utils/fab/layer.ts)
         */
        railAware: true,
    },

    accessibility: {
        role: 'group',
        /** Rôle du menu pour les pills */
        menuRole: 'menu',
        itemRole: 'menuitem',
    },
};

/**
 * Retourne les options par défaut pour ButtonFabMenu
 */
export function getButtonFabMenuDefaults(): ButtonFabMenuOptions {
    return {
        priorityLevel: PriorityLevel.MEDIUM,
        position: ButtonFabMenuSpecs.behaviors.defaultPosition,
        items: [] as ButtonFabMenuItem[],
        fabIcon: ButtonFabMenuSpecs.behaviors.defaultFabIcon,
        onItemClick: null,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
    };
}
