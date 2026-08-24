/**
 * @fileoverview Spécifications du composant ScrollSpy K3UI
 * @description ScrollSpy / On this page — sommaire de page Material Design 3
 * @author K3UI Team
 * @version 1.0.0
 */

import type { AnimationConfig } from '../../types/components/animations';
import type { ScrollSpyOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Spécifications du composant ScrollSpy
 */
export const ScrollSpySpecs = {
    behaviors: {
        selector: 'main, [data-scrollspy-content]',
        headings: 'h2',
        offset: 96,
        progress: false,
        mobileBreakpoint: 960,
        pinDesktop: true,
        autoActivateInitial: true,
    },

    animations: {
        pill: {
            type: 'custom' as const,
            duration: 500,
            easing: 'ease-out' as const,
        } as AnimationConfig,
    },

    accessibility: {
        role: 'navigation' as const,
        autoDisableForReducedMotion: true,
    },
} as const;

/**
 * Extrait les valeurs par défaut pour ScrollSpy depuis les specs
 * @returns Options par défaut pour ScrollSpy
 */
export function getScrollSpyDefaults(): ScrollSpyOptions {
    return {
        selector: ScrollSpySpecs.behaviors.selector,
        headings: ScrollSpySpecs.behaviors.headings,
        offset: ScrollSpySpecs.behaviors.offset,
        scrollRoot: null,
        progress: ScrollSpySpecs.behaviors.progress,
        mobileBreakpoint: ScrollSpySpecs.behaviors.mobileBreakpoint,
        pinDesktop: ScrollSpySpecs.behaviors.pinDesktop,
        autoActivateInitial: ScrollSpySpecs.behaviors.autoActivateInitial,
        onSelect: null,
        priorityLevel: PriorityLevel.MEDIUM,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
    };
}
