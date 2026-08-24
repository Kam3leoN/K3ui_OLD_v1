/**
 * @fileoverview Spécifications du composant ScrollToTop K3UI
 * @description Bouton de retour haut de page Material Design 3 Expressive
 * @author K3UI Team
 * @version 1.0.0
 */

import type { ScrollToTopOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';
import { ButtonFabMenuSpecs } from './button-fab-menu.specs';

/** Marge chrome flottant (alignée FAB / fab-menu layer — 16px). */
const FLOATING_EDGE_INSET_PX = ButtonFabMenuSpecs.layer.insetPx;

export const ScrollToTopSpecs = {
    behaviors: {
        threshold: 80,
        size: 56,
        strokeWidth: 6,
        rightOffset: FLOATING_EDGE_INSET_PX,
        bottomOffset: FLOATING_EDGE_INSET_PX,
        siblingGap: FLOATING_EDGE_INSET_PX,
        showProgress: true,
    },
    motion: {
        scrollDuration: 350,
        easing: 'cubic-bezier(0.2, 0, 0, 1)',
    },
    accessibility: {
        role: 'button' as const,
        autoDisableForReducedMotion: true,
    },
};

export function getScrollToTopDefaults(): ScrollToTopOptions {
    return {
        priorityLevel: PriorityLevel.MEDIUM,
        threshold: ScrollToTopSpecs.behaviors.threshold,
        size: ScrollToTopSpecs.behaviors.size,
        strokeWidth: ScrollToTopSpecs.behaviors.strokeWidth,
        rightOffset: ScrollToTopSpecs.behaviors.rightOffset,
        bottomOffset: ScrollToTopSpecs.behaviors.bottomOffset,
        siblingGap: ScrollToTopSpecs.behaviors.siblingGap,
        siblingFabSelector: '.button-fab-menu, k3ui-button-fab-menu, .button-fab, k3ui-button-fab, .button-fab--fixed, .k3ui-floating-corner, .btn.k3ui-floating-corner, [data-fixed]',
        showProgress: ScrollToTopSpecs.behaviors.showProgress,
        scrollContainer: null,
        scrollDuration: ScrollToTopSpecs.motion.scrollDuration,
        onShowStart: null,
        onShowEnd: null,
        onHideStart: null,
        onHideEnd: null,
        onScrollStart: null,
        onScrollEnd: null,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
    };
}
