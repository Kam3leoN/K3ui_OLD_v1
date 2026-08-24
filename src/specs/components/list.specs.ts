/**
 * @fileoverview Spécifications du composant List K3UI (Material Design 3 Expressive)
 * @description Listes avec leading/trailing, drag & drop, swipe
 * @author K3UI Team
 * @version 1.0.0
 */

import type { AnimationConfig } from '../../types/components/animations';
import type { ListOptions, ListConfig } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Spécifications du composant List
 */
export const ListSpecs = {
    // ============================================================================
    // COMPORTEMENTS PAR DÉFAUT
    // ============================================================================

    behaviors: {
        variant: 'standard' as const,
        leading: 'avatar' as const,
        lines: '2' as const,
        overline: false,
        withTasks: false,
        withSwitches: false,
        trailing: 'arrow' as const,
        grouped: true,
        selection: 'single' as const,
        expandCollapse: false,
        accordion: false,
        drag: false,
        swipe: false,
        showSnackbarUndo: true,
    },

    // ============================================================================
    // ANIMATIONS
    // ============================================================================

    animations: {
        dismiss: {
            type: 'fade' as const,
            duration: 280,
            easing: 'ease' as const,
        } as AnimationConfig,
    },

    // ============================================================================
    // ACCESSIBILITÉ
    // ============================================================================

    accessibility: {
        role: 'list' as const,
        itemRole: 'listitem' as const,
        autoDisableForReducedMotion: true,
    },

    /** Rayons MD3 Expressive (alignés list.token.scss) */
    radii: {
        /** Coins extérieurs premier/dernier item d'un groupe segmented (12dp) */
        segmentedOuterPx: 12,
        /** Coins intérieurs entre items d'un groupe (4dp) */
        segmentedInnerPx: 4,
        /** Items isolated ou états actifs hover/selected/focus (16dp) */
        segmentedActivePx: 16,
        /** Items variant standard (12dp) */
        standardItemPx: 12,
    },

    /** Espacement entre items segmented (md.comp.list.segmented.gap = 2dp) */
    segmentedGapPx: 2,
} as const;

/**
 * Border-radius CSS pour un item segmented selon grouped / position dans le groupe.
 */
export function getListSegmentedBorderRadius(options: {
    grouped: boolean;
    isFirstInGroup: boolean;
    isLastInGroup: boolean;
}): string {
    const outer = `${ListSpecs.radii.segmentedOuterPx}px`;
    const inner = `${ListSpecs.radii.segmentedInnerPx}px`;
    const active = `${ListSpecs.radii.segmentedActivePx}px`;

    if (!options.grouped) {
        return active;
    }
    if (options.isFirstInGroup && options.isLastInGroup) {
        return outer;
    }
    if (options.isFirstInGroup) {
        return `${outer} ${outer} ${inner} ${inner}`;
    }
    if (options.isLastInGroup) {
        return `${inner} ${inner} ${outer} ${outer}`;
    }
    return inner;
}

/**
 * Configuration par défaut de la liste (config)
 */
export function getListConfigDefaults(): ListConfig {
    return {
        variant: ListSpecs.behaviors.variant,
        leading: ListSpecs.behaviors.leading,
        lines: ListSpecs.behaviors.lines,
        overline: ListSpecs.behaviors.overline,
        withTasks: ListSpecs.behaviors.withTasks,
        withSwitches: ListSpecs.behaviors.withSwitches,
        trailing: ListSpecs.behaviors.trailing,
        grouped: ListSpecs.behaviors.grouped,
        selection: ListSpecs.behaviors.selection,
        expandCollapse: ListSpecs.behaviors.expandCollapse,
        accordion: ListSpecs.behaviors.accordion,
        drag: ListSpecs.behaviors.drag,
        swipe: ListSpecs.behaviors.swipe,
    };
}

/**
 * Extrait les valeurs par défaut pour List
 * @returns Options par défaut pour List
 */
export function getListDefaults(): ListOptions {
    return {
        items: [],
        config: getListConfigDefaults(),
        selectedId: null,
        checked: {},
        switches: {},
        showSnackbarUndo: ListSpecs.behaviors.showSnackbarUndo,
        priorityLevel: PriorityLevel.MEDIUM,
        onSelect: null,
        onCheck: null,
        onSwitch: null,
        onDelete: null,
        onArchive: null,
        onReorder: null,
    };
}
