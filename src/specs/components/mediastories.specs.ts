/**
 * @fileoverview Spécifications du composant MediaStories K3UI
 * @description Stories images/vidéo style Instagram (progress, tap, hold, fullscreen, gallery)
 * @author K3UI Team
 * @version 1.0.0
 */

import type { AnimationConfig } from '../../types/components/animations';
import type { MediaStoriesOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Spécifications du composant MediaStories
 */
export const MediaStoriesSpecs = {
  behaviors: {
    defaultInterval: 4000,
    defaultWidth: 360 as number | string,
    defaultHeight: 640 as number | string,
    loop: false,
    keyboardNavigation: true,
    showCloseButton: true,
    currentIndex: 0,
    fullscreen: false,
    aspectRatio: '9 / 16',
    showArrows: true,
    showLikeButton: true,
    showShareButton: true,
    autoStart: true,
    holdThresholdMs: 200,
    swipeDownClosePx: 90,
    mode: 'viewer' as const,
  },

  animations: {
    enter: {
      type: 'fade' as const,
      duration: 200,
      easing: 'ease-out' as const,
    } as AnimationConfig,

    exit: {
      type: 'fade' as const,
      duration: 150,
      easing: 'ease-in' as const,
    } as AnimationConfig,
  },

  accessibility: {
    role: 'dialog',
    autoDisableForReducedMotion: false,
  },
} as const;

/**
 * Extrait les valeurs par défaut pour MediaStories
 * @returns Options par défaut
 */
export function getMediaStoriesDefaults(): MediaStoriesOptions {
  return {
    priorityLevel: PriorityLevel.MEDIUM,
    mode: MediaStoriesSpecs.behaviors.mode,
    albums: [],
    galleryIntro: null,
    stories: [],
    defaultInterval: MediaStoriesSpecs.behaviors.defaultInterval,
    width: MediaStoriesSpecs.behaviors.defaultWidth,
    height: MediaStoriesSpecs.behaviors.defaultHeight,
    loop: MediaStoriesSpecs.behaviors.loop,
    keyboardNavigation: MediaStoriesSpecs.behaviors.keyboardNavigation,
    showCloseButton: MediaStoriesSpecs.behaviors.showCloseButton,
    currentIndex: MediaStoriesSpecs.behaviors.currentIndex,
    fullscreen: MediaStoriesSpecs.behaviors.fullscreen,
    aspectRatio: MediaStoriesSpecs.behaviors.aspectRatio,
    showArrows: MediaStoriesSpecs.behaviors.showArrows,
    showLikeButton: MediaStoriesSpecs.behaviors.showLikeButton,
    showShareButton: MediaStoriesSpecs.behaviors.showShareButton,
    autoStart: MediaStoriesSpecs.behaviors.autoStart,
    holdThresholdMs: MediaStoriesSpecs.behaviors.holdThresholdMs,
    swipeDownClosePx: MediaStoriesSpecs.behaviors.swipeDownClosePx,
    onStoryStart: null,
    onStoryEnd: null,
    onAllStoriesEnd: null,
    onNext: null,
    onPrevious: null,
    onClose: null,
    onLike: null,
    onShare: null,
    onOpenStart: null,
    onOpenEnd: null,
    onCloseStart: null,
    onCloseEnd: null,
  };
}
