/**
 * @fileoverview Spécifications du composant Toast K3UI
 * @description Spécifications alignées solid-toast
 * @see https://www.solid-toast.com/
 * @author K3UI Team
 * @version 3.0.0
 */

import type { AnimationConfig } from '../../types/components/animations';
import type { ToastOptions, ToastPosition } from '../../types/components';
import { PriorityLevel } from '../../types/base';

export const ToastSpecs = {
  behaviors: {
    defaultCloseDelay: 4000,
    hover: 'pause' as const,
    unmountDelay: 500,
    gutter: 8,
    clearStaggerMs: 80,
    timerStyle: 'bar' as const,
  },
  animations: {
    enter: {
      type: 'slide' as const,
      duration: 500,
      easing: 'var(--md-sys-motion-spatial-default-easing)' as const,
      direction: 'auto' as const,
    } as AnimationConfig,
    exit: {
      type: 'slide' as const,
      duration: 350,
      easing: 'var(--md-sys-motion-spatial-fast-easing)' as const,
      direction: 'auto' as const,
    } as AnimationConfig,
  },
  positions: {
    available: [
      'bottom-left',
      'bottom-center',
      'bottom-right',
      'top-left',
      'top-center',
      'top-right',
    ] as const,
    default: 'top-right' as const satisfies ToastPosition,
  },
  types: {
    priority: ['foreground', 'background'] as const,
    default: 'background' as const,
    variants: ['default', 'success', 'error', 'warning', 'info', 'loading'] as const,
    variantDefault: 'default' as const,
    icons: {
      default: null,
      success: 'circle-check',
      error: 'circle-exclamation',
      warning: 'triangle-exclamation',
      info: 'circle-info',
      loading: 'spinner',
    },
  },
  accessibility: {
    role: 'status' as const,
    ariaLive: 'polite' as const,
    tabIndex: -1,
    labels: { close: 'Fermer la notification' },
  },
} as const;

/**
 * Extrait les valeurs par défaut pour Toast
 * @returns Options par défaut
 */
export function getToastDefaults(): ToastOptions {
  return {
    title: undefined,
    description: '',
    variant: ToastSpecs.types.variantDefault,
    icon: null,
    showIcon: false,
    type: ToastSpecs.types.default,
    hover: ToastSpecs.behaviors.hover,
    closeDelay: ToastSpecs.behaviors.defaultCloseDelay,
    duration: ToastSpecs.behaviors.defaultCloseDelay,
    unmountDelay: ToastSpecs.behaviors.unmountDelay,
    position: ToastSpecs.positions.default,
    showClose: false,
    showProgressBar: true,
    timerStyle: ToastSpecs.behaviors.timerStyle,
    actionText: undefined,
    onAction: null,
    priorityLevel: PriorityLevel.MEDIUM,
    classes: '',
    className: '',
    shape: 'default',
    gutter: ToastSpecs.behaviors.gutter,
    multiline: false,
    showImmediately: false,
    onOpenStart: null,
    onOpenEnd: null,
    onCloseStart: null,
    onCloseEnd: null,
  };
}
