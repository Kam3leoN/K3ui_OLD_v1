/**
 * @fileoverview Ressort physique M3 Expressive (stiffness / damping)
 * @description Animation type spring pour jauges et indicateurs — compatible prefers-reduced-motion
 */

/** Spécification d’un ressort (raideur + amortissement relatif) */
export interface SpringSpec {
    stiffness: number;
    damping: number;
}

/** Presets spatiaux Material 3 Expressive (MotionScheme.expressive — spatial) */
export const M3_SPRING = {
    fast: { stiffness: 800, damping: 0.6 },
    default: { stiffness: 380, damping: 0.8 },
    slow: { stiffness: 200, damping: 0.8 },
} as const;

/** Presets effects Material 3 Expressive (opacity, scrim — sans rebond) */
export const M3_SPRING_EFFECTS = {
    fast: { stiffness: 3800, damping: 1 },
    default: { stiffness: 1600, damping: 1 },
    slow: { stiffness: 800, damping: 1 },
} as const;

/** Presets spatiaux Material 3 Standard (data-animation="spatial") */
export const M3_SPRING_STANDARD = {
    fast: { stiffness: 1400, damping: 0.9 },
    default: { stiffness: 700, damping: 0.9 },
    slow: { stiffness: 300, damping: 0.9 },
} as const;

export const M3_SPRING_EFFECTS_STANDARD = {
    fast: { stiffness: 3800, damping: 1 },
    default: { stiffness: 1600, damping: 1 },
    slow: { stiffness: 800, damping: 1 },
} as const;

export type M3SpringSpeed = keyof typeof M3_SPRING;

/**
 * Retourne les specs spatial/effects selon le schéma d'animation composant.
 * @param animation - expressive (défaut) ou spatial (standard)
 */
export function getM3SpringSpecs(
    animation: 'expressive' | 'spatial',
    speed: M3SpringSpeed = 'default'
): { spatial: SpringSpec; effects: SpringSpec } {
    if (animation === 'spatial') {
        return {
            spatial: M3_SPRING_STANDARD[speed],
            effects: M3_SPRING_EFFECTS_STANDARD[speed],
        };
    }
    return {
        spatial: M3_SPRING[speed],
        effects: M3_SPRING_EFFECTS[speed],
    };
}

/**
 * Valeur animée par ressort (requestAnimationFrame).
 * Pas de dépendance au DOM — utilisable depuis n’importe quel composant.
 */
export class SpringValue {
    current: number;
    private v = 0;
    private raf = 0;
    private last = 0;
    private _target = 0;

    constructor(
        initial: number,
        private spec: SpringSpec,
        private onUpdate: (x: number) => void
    ) {
        this.current = initial;
        this._target = initial;
    }

    private onRest: (() => void) | null = null;

    /** Met à jour la cible ; démarre la boucle si nécessaire. */
    set target(t: number) {
        this.setTarget(t);
    }

    get target(): number {
        return this._target;
    }

    /** Indique si une animation est en cours. */
    get isAnimating(): boolean {
        return this.raf !== 0;
    }

    /**
     * Définit la cible avec spec et callback optionnels (interruption M3).
     * @param t - Valeur cible
     * @param spec - Spec ressort (conserve la spec courante si omise)
     * @param onRest - Callback à la fin du mouvement
     */
    setTarget(t: number, spec?: SpringSpec, onRest?: () => void): void {
        this._target = t;
        if (spec) this.spec = spec;
        this.onRest = onRest ?? null;
        if (this.current === t && Math.abs(this.v) < 1e-4) {
            this.onUpdate(t);
            const rest = this.onRest;
            this.onRest = null;
            rest?.();
            return;
        }
        if (!this.raf) {
            this.last = performance.now();
            this.raf = requestAnimationFrame(this.tick);
        }
    }

    /** Injecte une vélocité initiale (gestes). */
    setVelocity(velocity: number): void {
        this.v = velocity;
    }

    /** Saute immédiatement à la valeur (sans animation). */
    snap(t: number): void {
        this.jump(t);
    }

    /** Alias de snap — aligné material-web / md-dialog. */
    jump(t: number): void {
        this.cancel();
        this._target = t;
        this.current = t;
        this.v = 0;
        this.onRest = null;
        this.onUpdate(t);
    }

    /** Change le preset en cours (sans reset de position). */
    setSpec(spec: SpringSpec): void {
        this.spec = spec;
    }

    cancel(): void {
        if (this.raf) {
            cancelAnimationFrame(this.raf);
            this.raf = 0;
        }
    }

    private tick = (now: number): void => {
        const dt = Math.min((now - this.last) / 1000, 1 / 30);
        this.last = now;
        const { stiffness: k, damping: zeta } = this.spec;
        const c = 2 * zeta * Math.sqrt(k);
        this.v += (-k * (this.current - this._target) - c * this.v) * dt;
        this.current += this.v * dt;
        if (Math.abs(this.v) < 0.05 && Math.abs(this.current - this._target) < 0.001) {
            this.current = this._target;
            this.v = 0;
            this.raf = 0;
            this.onUpdate(this.current);
            const rest = this.onRest;
            this.onRest = null;
            rest?.();
            return;
        }
        this.raf = requestAnimationFrame(this.tick);
        this.onUpdate(this.current);
    };
}
