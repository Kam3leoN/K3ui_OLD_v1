/**
 * @fileoverview Manager global pour gérer `prefers-reduced-motion` + un override utilisateur.
 * @description Unifie la logique pour JS (effets) et permet un pilotage via une API exposée à `K.Motion`.
 */

type Override = boolean | null; // null = suivre la préférence système

/** `MediaQueryList.addListener` (API dépréciée, encore présente sur certains navigateurs). */
type MediaQueryListWithLegacyListener = MediaQueryList & {
    addListener?(callback: (this: MediaQueryList, ev: MediaQueryListEvent) => void): void;
};

export class MotionManager {
    private static _initialized = false;
    private static _override: Override = null;
    private static _mql: MediaQueryList | null = null;
    private static _lastEffective: boolean | null = null;
    private static _hasListener = false;

    private static readonly REDUCED_CLASS = 'k3ui-reduced-motion';
    private static readonly REDUCED_DATA = 'reduced';
    private static readonly FULL_DATA = 'full';

    /** Initialisation paresseuse et idempotente. */
    public static init(): void {
        if (typeof window === 'undefined' || typeof document === 'undefined') return;
        if (!this._initialized) {
            this._override = this.readOverrideFromWindow();
            this._initialized = true;
        } else {
            // Re-synchroniser l'override au cas où un consumer aurait modifié window.K.preferReducedMotion.
            this._override = this.readOverrideFromWindow();
        }

        this.ensureSynced();
        this.ensureListener();
    }

    /** Retourne l’état effectif (override utilisateur OU préférence système). */
    public static isReducedMotion(): boolean {
        if (typeof window === 'undefined' || typeof document === 'undefined') return false;
        this.init();
        // ensureSynced met à jour _lastEffective
        return this._lastEffective === true;
    }

    public static setOverride(override: Override): void {
        if (typeof window === 'undefined' || typeof document === 'undefined') return;
        this._override = override;

        // Compat : keep window.K.preferReducedMotion en miroir.
        if (!window.K) window.K = {};
        if (override === null) {
            delete window.K.preferReducedMotion;
        } else {
            window.K.preferReducedMotion = override;
        }

        this.ensureSynced();
        this.ensureListener();
    }

    /** Toggle l’override (false -> true, true -> false). Si aucun override n’est présent, passe à `true`. */
    public static toggle(): boolean {
        const currentOverride = this._override === true ? true : this._override === false ? false : undefined;
        const nextOverride = currentOverride === true ? false : true;
        this.setOverride(nextOverride);
        return this.isReducedMotion();
    }

    /** Force une synchronisation de la classe + mémorise l’état. */
    public static ensureSynced(): void {
        if (typeof window === 'undefined' || typeof document === 'undefined') return;

        const effective = this.computeEffectiveReducedMotion();
        if (this._lastEffective === effective) return;

        this._lastEffective = effective;
        this.applyGlobalState(effective);

        document.dispatchEvent(
            new CustomEvent('k3ui-motion-changed', {
                detail: { reducedMotion: effective, override: this._override }
            })
        );
    }

    private static ensureListener(): void {
        if (this._hasListener) return;
        if (typeof window === 'undefined' || typeof document === 'undefined') return;
        if (typeof matchMedia !== 'function') return;

        const mql = matchMedia('(prefers-reduced-motion: reduce)');
        this._mql = mql;

        const handler = () => {
            // Quand override != null, le système peut changer sans impact effectif.
            this.ensureSynced();
        };

        try {
            if (typeof mql.addEventListener === 'function') {
                mql.addEventListener('change', handler);
                this._hasListener = true;
                return;
            }
        } catch {
            // ignore
        }

        // Fallback legacy
        try {
            const legacyMql = mql as MediaQueryListWithLegacyListener;
            if (typeof legacyMql.addListener === 'function') {
                legacyMql.addListener(handler);
                this._hasListener = true;
            }
        } catch {
            // ignore
        }
    }

    private static readOverrideFromWindow(): Override {
        const overrideValue = window?.K?.preferReducedMotion;
        if (overrideValue === true) return true;
        if (overrideValue === false) return false;
        return null;
    }

    private static computeEffectiveReducedMotion(): boolean {
        if (this._override === true) return true;
        if (this._override === false) return false;

        if (typeof matchMedia !== 'function') return false;
        return matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    private static applyGlobalState(reduced: boolean): void {
        const root = document.documentElement;
        root.classList.toggle(this.REDUCED_CLASS, reduced);
        root.setAttribute('data-k3ui-motion', reduced ? this.REDUCED_DATA : this.FULL_DATA);
    }
}

