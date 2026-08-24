/**
 * @fileoverview Pilote ressort pour effet Holo (portage pokemon-cards-151)
 * @description Anime --pointer-x/y, --card-opacity, --background-x/y, --rotate-x/y
 * @author K3UI Team — effets originaux @simeydotme (GPL-3.0)
 * @version 2.0.0
 */

/** Coefficients ressort — interaction / retour au repos */
export interface HoloSpringConfig {
    stiffness: number;
    damping: number;
}

const INTERACTION: HoloSpringConfig = { stiffness: 0.066, damping: 0.25 };
const RETURN: HoloSpringConfig = { stiffness: 0.01, damping: 0.06 };

const clamp = (v: number, min = 0, max = 100): number => Math.min(Math.max(v, min), max);
const round = (v: number, precision = 3): number => parseFloat(v.toFixed(precision));
const adjust = (v: number, fmin: number, fmax: number, tmin: number, tmax: number): number =>
    round(tmin + ((tmax - tmin) * (v - fmin)) / (fmax - fmin));

interface SpringState {
    val: Record<string, number>;
    velocity: Record<string, number>;
    target: Record<string, number>;
    config: HoloSpringConfig;
    aim(partial: Record<string, number>): void;
    setConfig(config: HoloSpringConfig): void;
    step(): boolean;
}

/**
 * Crée un ressort multidimensionnel
 * @param initial Valeurs initiales
 * @returns État ressort
 */
function createSpring(initial: Record<string, number>): SpringState {
    const val = { ...initial };
    const velocity = Object.fromEntries(Object.keys(initial).map((k) => [k, 0]));
    let target = { ...initial };
    let config = INTERACTION;

    return {
        val,
        velocity,
        target,
        config,
        aim(partial: Record<string, number>): void {
            target = { ...target, ...partial };
        },
        setConfig(next: HoloSpringConfig): void {
            config = next;
        },
        step(): boolean {
            let active = false;
            for (const key in val) {
                const delta = target[key] - val[key];
                velocity[key] = (velocity[key] + delta * config.stiffness) * (1 - config.damping);
                val[key] += velocity[key];
                if (Math.abs(delta) > 1e-3 || Math.abs(velocity[key]) > 1e-3) {
                    active = true;
                } else {
                    val[key] = target[key];
                }
            }
            return active;
        },
    };
}

/** Contrôleur du pilote Holo */
export interface HoloSpringController {
    /** Annule l'autoplay et les frames en cours */
    cancel(): void;
    /** Détache les listeners */
    destroy(): void;
}

/**
 * Attache le pilote ressort Holo sur un élément
 * @param el Élément racine `.holo`
 * @param options Options d'autoplay tactile
 * @returns Contrôleur pour cleanup
 */
export function attachHoloSpring(
    el: HTMLElement,
    options: {
        autoplay?: 'auto' | boolean;
        strength?: number;
        surface?: HTMLElement;
    } = {}
): HoloSpringController {
    const surface = options.surface ?? el;
    const strength = options.strength ?? 1;

    const rotation = createSpring({ x: 0, y: 0 });
    const glare = createSpring({ x: 50, y: 50, o: 0 });
    const background = createSpring({ x: 50, y: 50 });
    const springs = [rotation, glare, background];

    let frameId = 0;
    let loopId = 0;
    let touched = false;

    const paint = (): void => {
        const active = springs.map((s) => s.step()).some(Boolean);
        const fromCenter = clamp(Math.hypot(glare.val.x - 50, glare.val.y - 50) / 50, 0, 1);

        el.style.setProperty('--pointer-x', `${round(glare.val.x)}%`);
        el.style.setProperty('--pointer-y', `${round(glare.val.y)}%`);
        el.style.setProperty('--pointer-from-center', String(round(fromCenter)));
        el.style.setProperty('--pointer-from-top', String(round(glare.val.y / 100)));
        el.style.setProperty('--pointer-from-left', String(round(glare.val.x / 100)));
        el.style.setProperty('--card-opacity', String(round(glare.val.o * strength)));
        el.style.setProperty('--rotate-x', `${round(rotation.val.x)}deg`);
        el.style.setProperty('--rotate-y', `${round(rotation.val.y)}deg`);
        el.style.setProperty('--background-x', `${round(background.val.x)}%`);
        el.style.setProperty('--background-y', `${round(background.val.y)}%`);

        el.dataset.active = glare.val.o > 0.01 ? 'true' : 'false';
        el.classList.toggle('holo--interacting', glare.val.o > 0.01);

        frameId = active ? requestAnimationFrame(paint) : 0;
    };

    const kick = (): void => {
        if (frameId === 0) frameId = requestAnimationFrame(paint);
    };

    const stopLoop = (): void => {
        if (loopId) {
            cancelAnimationFrame(loopId);
            loopId = 0;
        }
        touched = true;
    };

    const onMove = (event: PointerEvent): void => {
        stopLoop();
        const rect = surface.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;

        const px = clamp(round((100 / rect.width) * (event.clientX - rect.left)));
        const py = clamp(round((100 / rect.height) * (event.clientY - rect.top)));

        springs.forEach((s) => s.setConfig(INTERACTION));
        background.aim({ x: adjust(px, 0, 100, 37, 63), y: adjust(py, 0, 100, 33, 67) });
        rotation.aim({ x: round(-((px - 50) / 3.5)), y: round((py - 50) / 3.5) });
        glare.aim({ x: px, y: py, o: 1 });
        kick();
    };

    const onLeave = (): void => {
        stopLoop();
        springs.forEach((s) => s.setConfig(RETURN));
        rotation.aim({ x: 0, y: 0 });
        glare.aim({ x: 50, y: 50, o: 0 });
        background.aim({ x: 50, y: 50 });
        kick();
    };

    surface.addEventListener('pointermove', onMove);
    surface.addEventListener('pointerdown', onMove);
    surface.addEventListener('pointerenter', onMove);
    surface.addEventListener('pointerleave', onLeave);
    surface.addEventListener('pointercancel', onLeave);

    const autoplayEnabled =
        options.autoplay === true ||
        (options.autoplay === 'auto' &&
            typeof window !== 'undefined' &&
            window.matchMedia('(hover: none)').matches);

    if (autoplayEnabled) {
        const start = performance.now();
        const tick = (t: number): void => {
            if (touched) return;
            const elapsed = t - start;
            const px = 50 + 40 * Math.sin(elapsed * 0.0007);
            const py = 50 + 40 * Math.sin(elapsed * 0.0011);
            springs.forEach((s) => s.setConfig(INTERACTION));
            background.aim({ x: adjust(px, 0, 100, 37, 63), y: adjust(py, 0, 100, 33, 67) });
            rotation.aim({ x: round(-((px - 50) / 3.5)), y: round((py - 50) / 3.5) });
            glare.aim({ x: px, y: py, o: 1 });
            kick();
            loopId = requestAnimationFrame(tick);
        };
        loopId = requestAnimationFrame(tick);
    } else {
        onLeave();
    }

    return {
        cancel: stopLoop,
        destroy(): void {
            if (frameId) cancelAnimationFrame(frameId);
            stopLoop();
            surface.removeEventListener('pointermove', onMove);
            surface.removeEventListener('pointerdown', onMove);
            surface.removeEventListener('pointerenter', onMove);
            surface.removeEventListener('pointerleave', onLeave);
            surface.removeEventListener('pointercancel', onLeave);
            onLeave();
        },
    };
}
