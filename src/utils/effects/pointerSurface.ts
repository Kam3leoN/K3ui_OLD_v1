/**
 * @fileoverview Suivi pointeur normalisé pour effets de surface (Holo, etc.)
 * @description Écrit --px, --py, --pd, --active sur un élément via requestAnimationFrame
 * @author K3UI Team
 * @version 1.0.0
 */

/** Position normalisée 0→1 sur la surface */
export interface PointerSurfaceCoords {
    px: number;
    py: number;
    pd: number;
    active: 0 | 1;
}

/** Options pour l'autoplay tactile */
export interface PointerSurfaceAutoplayOptions {
    /** Callback à chaque tick (sinon write direct sur el) */
    onTick?: (coords: PointerSurfaceCoords) => void;
}

const DEFAULT_CENTER: PointerSurfaceCoords = { px: 0.5, py: 0.5, pd: 0, active: 0 };

/**
 * Écrit les variables CSS de surface sur un élément
 * @param el Élément cible
 * @param px Position X normalisée (0–1)
 * @param py Position Y normalisée (0–1)
 * @param active 0 ou 1
 */
export function writePointerSurface(
    el: HTMLElement,
    px: number,
    py: number,
    active: 0 | 1
): void {
    const pd = Math.min(1, Math.hypot(px - 0.5, py - 0.5) * 2);
    el.style.setProperty('--px', px.toFixed(4));
    el.style.setProperty('--py', py.toFixed(4));
    el.style.setProperty('--pd', pd.toFixed(4));
    el.style.setProperty('--active', String(active));
    el.dataset.active = active === 1 ? 'true' : 'false';
}

/**
 * Réinitialise la surface au centre inactif
 * @param el Élément cible
 */
export function resetPointerSurface(el: HTMLElement): void {
    writePointerSurface(el, DEFAULT_CENTER.px, DEFAULT_CENTER.py, 0);
}

/**
 * Calcule les coordonnées normalisées depuis un événement pointeur
 * @param el Élément de référence
 * @param clientX Coordonnée X viewport
 * @param clientY Coordonnée Y viewport
 * @returns Coordonnées normalisées
 */
export function coordsFromClient(
    el: HTMLElement,
    clientX: number,
    clientY: number
): PointerSurfaceCoords {
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
        return { ...DEFAULT_CENTER, active: 1 };
    }
    const px = (clientX - rect.left) / rect.width;
    const py = (clientY - rect.top) / rect.height;
    const pd = Math.min(1, Math.hypot(px - 0.5, py - 0.5) * 2);
    return { px, py, pd, active: 1 };
}

/**
 * Calcule les coordonnées depuis un PointerEvent
 * @param el Élément de référence
 * @param event Événement pointeur
 * @returns Coordonnées normalisées
 */
export function coordsFromPointerEvent(
    el: HTMLElement,
    event: PointerEvent
): PointerSurfaceCoords {
    return coordsFromClient(el, event.clientX, event.clientY);
}

/** Contrôleur de suivi pointeur attaché à un élément */
export interface PointerSurfaceController {
    /** Annule l'autoplay et les frames en cours */
    cancel(): void;
    /** Détache les listeners */
    destroy(): void;
}

/**
 * Attache le suivi pointeur sur un élément
 * @param el Élément racine
 * @param options Options d'autoplay
 * @returns Contrôleur pour cleanup
 */
export function attachPointerSurface(
    el: HTMLElement,
    options: {
        autoplay?: 'auto' | boolean;
        onWrite?: (coords: PointerSurfaceCoords) => void;
    } = {}
): PointerSurfaceController {
    let frameId = 0;
    let loopId = 0;
    let touched = false;

    const apply = (coords: PointerSurfaceCoords): void => {
        if (options.onWrite) {
            options.onWrite(coords);
        } else {
            writePointerSurface(el, coords.px, coords.py, coords.active);
        }
    };

    const scheduleWrite = (coords: PointerSurfaceCoords): void => {
        cancelAnimationFrame(frameId);
        frameId = requestAnimationFrame(() => apply(coords));
    };

    const stopLoop = (): void => {
        if (loopId) {
            cancelAnimationFrame(loopId);
            loopId = 0;
        }
        touched = true;
    };

    const fromEvent = (event: PointerEvent): void => {
        stopLoop();
        scheduleWrite(coordsFromPointerEvent(el, event));
    };

    const onLeave = (): void => {
        cancelAnimationFrame(frameId);
        apply(DEFAULT_CENTER);
    };

    const onMove = (e: PointerEvent): void => fromEvent(e);
    const onDown = (e: PointerEvent): void => fromEvent(e);

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointerleave', onLeave);
    el.addEventListener('pointerup', onLeave);
    el.addEventListener('pointercancel', onLeave);

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
            scheduleWrite({
                px: 0.5 + 0.4 * Math.sin(elapsed * 0.0007),
                py: 0.5 + 0.4 * Math.sin(elapsed * 0.0011),
                pd: 0,
                active: 1,
            });
            loopId = requestAnimationFrame(tick);
        };
        loopId = requestAnimationFrame(tick);
    }

    return {
        cancel: stopLoop,
        destroy(): void {
            cancelAnimationFrame(frameId);
            stopLoop();
            el.removeEventListener('pointermove', onMove);
            el.removeEventListener('pointerdown', onDown);
            el.removeEventListener('pointerleave', onLeave);
            el.removeEventListener('pointerup', onLeave);
            el.removeEventListener('pointercancel', onLeave);
            apply(DEFAULT_CENTER);
        },
    };
}
