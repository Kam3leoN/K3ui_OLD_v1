/**
 * @fileoverview Spécifications du composant Page K3UI
 * @description Empilement de sections plein écran (inspiré de pagePiling.js)
 * @author K3UI Team
 * @version 1.0.0
 */

import type { PageOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

export const PageSpecs = {
    behaviors: {
        direction: 'vertical' as const,
        verticalCentered: true,
        scrollingSpeed: 700,
        easing: 'cubic-bezier(0.55, 0.085, 0, 0.99)',
        loopBottom: false,
        loopTop: false,
        css3: true,
        touchSensitivity: 5,
        keyboardScrolling: true,
        sectionSelector: '.page__section',
        animateAnchor: false,
        normalScrollElementTouchThreshold: 5,
        scrollDelay: 400,
        fullscreen: true,
    },
    navigation: {
        textColor: '#000',
        bulletsColor: '#000',
        position: 'right' as const,
    },
    accessibility: {
        role: 'region',
        autoDisableForReducedMotion: true,
    },
} as const;

/**
 * Extrait les valeurs par défaut pour Page
 * @returns Options par défaut
 */
export function getPageDefaults(): PageOptions {
    return {
        direction: PageSpecs.behaviors.direction,
        menu: null,
        verticalCentered: PageSpecs.behaviors.verticalCentered,
        sectionsColor: [],
        anchors: [],
        scrollingSpeed: PageSpecs.behaviors.scrollingSpeed,
        easing: PageSpecs.behaviors.easing,
        loopBottom: PageSpecs.behaviors.loopBottom,
        loopTop: PageSpecs.behaviors.loopTop,
        css3: PageSpecs.behaviors.css3,
        navigation: false,
        normalScrollElements: null,
        normalScrollElementTouchThreshold: PageSpecs.behaviors.normalScrollElementTouchThreshold,
        touchSensitivity: PageSpecs.behaviors.touchSensitivity,
        keyboardScrolling: PageSpecs.behaviors.keyboardScrolling,
        sectionSelector: PageSpecs.behaviors.sectionSelector,
        animateAnchor: PageSpecs.behaviors.animateAnchor,
        scrollDelay: PageSpecs.behaviors.scrollDelay,
        fullscreen: PageSpecs.behaviors.fullscreen,
        respectReducedMotion: PageSpecs.accessibility.autoDisableForReducedMotion,
        afterLoad: null,
        onLeave: null,
        afterRender: null,
        priorityLevel: PriorityLevel.MEDIUM,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
    };
}
