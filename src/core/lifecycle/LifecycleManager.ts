/**
 * @fileoverview Utilitaires cycle de vie K3UI v3 — debounce update, tracking mount
 */

import type { ComponentLifecycleChanges } from '../../types/base/lifecycle';

const DEFAULT_UPDATE_DEBOUNCE_MS = 0;

interface PendingUpdate {
    timer: ReturnType<typeof setTimeout> | null;
    changes: ComponentLifecycleChanges;
}

/**
 * Gestionnaire léger par instance pour debouncer les mises à jour d'options.
 */
export class LifecycleManager {
    private pending: PendingUpdate | null = null;

    /**
     * @param debounceMs - Délai avant flush (0 = synchrone)
     */
    constructor(private readonly debounceMs: number = DEFAULT_UPDATE_DEBOUNCE_MS) {}

    /**
     * Planifie ou fusionne un appel onUpdate.
     * @param flush - Callback exécuté avec les changements accumulés
     * @param partial - Changements partiels à fusionner
     */
    scheduleUpdate(
        flush: (changes: ComponentLifecycleChanges) => void,
        partial: ComponentLifecycleChanges,
    ): void {
        if (this.debounceMs <= 0) {
            flush(partial);
            return;
        }

        if (!this.pending) {
            this.pending = { timer: null, changes: { keys: [] } };
        }

        const pending = this.pending;
        if (partial.keys?.length) {
            const keys = new Set([...(pending.changes.keys ?? []), ...partial.keys]);
            pending.changes.keys = [...keys];
        }
        if (partial.attribute !== undefined) {
            pending.changes.attribute = partial.attribute;
            pending.changes.oldValue = partial.oldValue;
            pending.changes.newValue = partial.newValue;
        }

        if (pending.timer) {
            clearTimeout(pending.timer);
        }
        pending.timer = setTimeout(() => {
            const changes = { ...pending.changes };
            pending.timer = null;
            this.pending = null;
            flush(changes);
        }, this.debounceMs);
    }

    /** Annule une mise à jour planifiée (ex. destroy). */
    cancelPendingUpdate(): void {
        if (this.pending?.timer) {
            clearTimeout(this.pending.timer);
        }
        this.pending = null;
    }
}
