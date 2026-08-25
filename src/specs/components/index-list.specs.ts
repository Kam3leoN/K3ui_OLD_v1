/**
 * @fileoverview Spécifications du composant IndexList K3UI
 * @description Annuaire avec en-têtes sticky push et rail de navigation
 * @author K3UI Team
 * @version 1.0.0
 */

import type { AnimationConfig } from '../../types/components/animations';
import type { IndexListOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';
import { INDEX_LIST_KEY_ORDER } from '../../utils/helpers/index-list-keys';

/**
 * Spécifications du composant IndexList
 */
export const IndexListSpecs = {
    /** Ordre des groupes (#, symboles, chiffres, A–Z) */
    keyOrder: INDEX_LIST_KEY_ORDER,

    behaviors: {
        indexKeyAttr: 'data-index-key',
        locale: 'fr-FR',
        showRail: true,
        stickyHeaders: true,
        stickyOffset: 0,
        scrollBehavior: 'smooth' as ScrollBehavior,
        hideEmptyKeys: true,
        railScrub: true,
    },

    animations: {
        scroll: {
            type: 'custom' as const,
            duration: 400,
            easing: 'ease-out' as const,
        } as AnimationConfig,
    },

    accessibility: {
        role: 'navigation' as const,
        autoDisableForReducedMotion: true,
    },
} as const;

/**
 * Valeurs par défaut pour IndexList
 * @returns Options par défaut
 */
export function getIndexListDefaults(): IndexListOptions {
    return {
        items: undefined,
        indexKeyAttr: IndexListSpecs.behaviors.indexKeyAttr,
        locale: IndexListSpecs.behaviors.locale,
        showRail: IndexListSpecs.behaviors.showRail,
        stickyHeaders: IndexListSpecs.behaviors.stickyHeaders,
        stickyOffset: IndexListSpecs.behaviors.stickyOffset,
        scrollBehavior: IndexListSpecs.behaviors.scrollBehavior,
        hideEmptyKeys: IndexListSpecs.behaviors.hideEmptyKeys,
        railScrub: IndexListSpecs.behaviors.railScrub,
        getKey: null,
        scrollRoot: null,
        onSectionChange: null,
        onRailSelect: null,
        priorityLevel: PriorityLevel.MEDIUM,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
    };
}
