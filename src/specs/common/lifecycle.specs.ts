/**
 * @fileoverview Spécifications cycle de vie K3UI v3
 * @description Contrat hooks, ordre d'exécution et événements DOM
 */

import type { LifecyclePhase } from '../../types/base/lifecycle';

/** Ordre canonique des hooks lifecycle */
export const LIFECYCLE_HOOK_ORDER: readonly string[] = [
    'setup',
    'onInit',
    'onMount',
    'onUpdate',
    'onUnmount',
    'onDestroy',
] as const;

/** Phases émises via CustomEvent */
export const LIFECYCLE_EVENT_PHASES: readonly LifecyclePhase[] = [
    'init',
    'mount',
    'update',
    'unmount',
    'destroy',
] as const;

/** Préfixes des événements k3ui:lifecycle:* */
export const LIFECYCLE_EVENT_NAMES = {
    init: 'k3ui:lifecycle:init',
    mount: 'k3ui:lifecycle:mount',
    update: 'k3ui:lifecycle:update',
    unmount: 'k3ui:lifecycle:unmount',
    destroy: 'k3ui:lifecycle:destroy',
} as const;

/**
 * Spécifications documentées du cycle de vie composant K3UI.
 */
export const LifecycleSpecs = {
    /** K3UI ne possède pas de render/VDOM — onUpdate resynchronise l'UI impérativement */
    hasVirtualRender: false,
    /** SSR / hydrate non supportés en v3 */
    supportsSSR: false,
    hookOrder: LIFECYCLE_HOOK_ORDER,
    eventPhases: LIFECYCLE_EVENT_PHASES,
    eventNames: LIFECYCLE_EVENT_NAMES,
    getters: ['isInitialized', 'isMounted', 'isDestroyed', 'isUpdating', 'isConnected'] as const,
} as const;
