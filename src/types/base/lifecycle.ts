/**
 * @fileoverview Types du cycle de vie K3UI v3
 */

/** Phases du cycle de vie émises via CustomEvent */
export type LifecyclePhase = 'init' | 'mount' | 'update' | 'unmount' | 'destroy';

/** Détail des changements passés à onUpdate */
export interface ComponentLifecycleChanges {
    /** Clés d'options modifiées */
    keys?: string[];
    /** Attribut DOM modifié (Web Components) */
    attribute?: string;
    oldValue?: string | null;
    newValue?: string | null;
}

/** Payload des événements k3ui:lifecycle:* */
export interface ComponentLifecycleEventDetail {
    phase: LifecyclePhase;
    component: string;
    timestamp: number;
    changes?: ComponentLifecycleChanges;
}
