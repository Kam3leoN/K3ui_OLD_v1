/**
 * @fileoverview Spécifications du composant AppBar K3UI
 * @description Top App Bar M3 — variantes material.io/components/app-bars uniquement
 * @see https://m3.material.io/components/app-bars/overview
 * @author K3UI Team
 * @version 1.2.0
 */

import type { AnimationConfig } from '../../types/components/animations';
import type { AppBarOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/** Variantes M3 Expressive (material.io) */
export type AppBarVariant = 'small' | 'center' | 'search' | 'medium' | 'large';

/** Variantes exposées dans la doc M3 (center = small + titre centré, extension K3UI) */
export type AppBarM3Variant = 'search' | 'small' | 'medium' | 'large';

export const AppBarSpecs = {
  behaviors: {
    defaultVariant: 'small' as AppBarVariant,
    defaultHeight: 'medium' as const,
    defaultCollapseDistance: 112,
    liftScrollThreshold: 1,
  },

  dimensions: {
    smallHeight: 64,
    searchHeight: 72,
    mediumCollapsedHeight: 64,
    mediumExpandedHeight: 112,
    largeCollapsedHeight: 64,
    largeExpandedHeight: 152,
  },

  animations: {
    lift: {
      type: 'fade' as const,
      duration: 200,
      easing: 'var(--md-sys-motion-effects-default-easing)',
    } as AnimationConfig,
    collapse: {
      type: 'slide' as const,
      duration: 500,
      easing: 'var(--md-sys-motion-spatial-default-easing)',
    } as AnimationConfig,
  },

  accessibility: {
    role: 'banner' as const,
    autoDisableForReducedMotion: true,
  },

  priority: PriorityLevel.MEDIUM,
} as const;

export function getAppBarDefaults(): AppBarOptions {
  return {
    variant: AppBarSpecs.behaviors.defaultVariant,
    height: AppBarSpecs.behaviors.defaultHeight,
    fixed: false,
    collapseDistance: AppBarSpecs.behaviors.defaultCollapseDistance,
    scrollRatio: 0,
    onScrollRatioChange: null,
    onOpenStart: null,
    onOpenEnd: null,
    onCloseStart: null,
    onCloseEnd: null,
    priorityLevel: PriorityLevel.MEDIUM,
  };
}
