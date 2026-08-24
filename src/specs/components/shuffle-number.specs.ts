/**
 * @fileoverview Spécifications du composant ShuffleNumber K3UI
 * @description Animation de nombres / texte caractère par caractère (inspiré NumberFlow)
 * @see https://number-flow.barvian.me/
 */

import { PriorityLevel } from '../../types/base';
import type { ShuffleNumberOptions } from '../../types/components';

export function getShuffleNumberDefaults(): ShuffleNumberOptions {
    return {
        text: '',
        value: null,
        format: undefined,
        locales: undefined,
        prefix: '',
        suffix: '',
        trend: 'auto',
        animated: true,
        respectMotionPreference: true,
        continuous: false,
        willChange: false,
        direction: 'down',
        stagger: 45,
        duration: 300,
        exitOffset: 50,
        easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        bounce: 0.6,
        colorFade: 280,
        skipUnchanged: true,
        interrupt: true,
        revertAfter: 1400,
        useChromatic: false,
        priorityLevel: PriorityLevel.MEDIUM,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
        onAnimationsStart: null,
        onAnimationsFinish: null,
    };
}

/** @deprecated Utiliser getShuffleNumberDefaults */
export const getSlotDefaults = getShuffleNumberDefaults;
