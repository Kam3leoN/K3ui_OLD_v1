/**
 * @fileoverview Spécifications du composant Marquee K3UI
 * @description Défilement infini ou classique (CSS/RAF), direction configurable.
 */

import { PriorityLevel } from '../../types/base';
import type { MarqueeOptions } from '../../types/components';

export function getMarqueeDefaults(): MarqueeOptions {
  return {
    enabled: true,
    mode: 'infinite',
    direction: 'left',
    rotate: null,
    rotateLength: 300,
    duration: 20,
    speed: null,
    gap: 80,
    pauseOnHover: false,
    autoplay: true,
    noFade: false,
    pingPong: false,
    loop: 0,
    startDelay: 0,
    priorityLevel: PriorityLevel.MEDIUM,
    onOpenStart: null,
    onOpenEnd: null,
    onCloseStart: null,
    onCloseEnd: null,
  };
}

