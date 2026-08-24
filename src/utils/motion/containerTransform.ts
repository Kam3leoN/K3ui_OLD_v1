/**
 * @fileoverview Pattern Container Transform M3 (MaterialContainerTransform)
 * @description FLIP entre un élément déclencheur et la surface dialog
 * @see material-components-android MaterialContainerTransform
 */

import { readMotionSpring } from './motionSpring';

export interface ContainerTransformOptions {
    /** Seuils de fondu entrée (0 → seuil) — défaut MDC */
    fadeThresholds?: [number, number];
    /** Durée en ms */
    durationMs?: number;
    /** Trajectoire en arc (MaterialArcMotion) */
    arc?: boolean;
}

/**
 * Calcule le delta FLIP (centres + échelle) entre deux rects.
 */
function measureFlipDelta(
    start: DOMRectReadOnly,
    end: DOMRectReadOnly
): { dx: number; dy: number; scaleX: number; scaleY: number } {
    return {
        dx: start.left + start.width / 2 - (end.left + end.width / 2),
        dy: start.top + start.height / 2 - (end.top + end.height / 2),
        scaleX: start.width / Math.max(end.width, 1),
        scaleY: start.height / Math.max(end.height, 1),
    };
}

/**
 * Calcule le delta FLIP (centres + échelle) entre deux rects.
 */
export function measureContainerFlipDelta(
    fromRect: DOMRectReadOnly,
    toRect: DOMRectReadOnly
): { dx: number; dy: number; scaleX: number; scaleY: number } {
    return measureFlipDelta(fromRect, toRect);
}

/**
 * Pose l'état initial FLIP sur la surface avant WAAPI (évite un flash à identity).
 */
export function applyContainerTransformStart(from: HTMLElement, to: HTMLElement): void {
    const { dx, dy, scaleX, scaleY } = measureFlipDelta(
        from.getBoundingClientRect(),
        to.getBoundingClientRect()
    );
    to.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${scaleX}, ${scaleY})`;
    to.style.opacity = '0';
}

/**
 * Anime une transformation conteneur entre deux éléments (FLIP).
 * @param from - Élément déclencheur
 * @param to - Surface cible (dialog-container)
 * @param options - Options de transition
 * @returns Animation WAAPI
 *
 * @remarks
 * - Ne pas appliquer `transform: none` sur `to` pendant l’animation (Chromium ignore le FLIP).
 * - Pas de morph `borderRadius` : un trigger pill (9999px) ou carré (0px) provoque des flashes
 *   sur le `.dialog-container` ; le rayon M3 reste celui du CSS du dialog.
 */
export function containerTransform(
    from: HTMLElement,
    to: HTMLElement,
    options: ContainerTransformOptions = {}
): Animation {
    const { fadeThresholds = [0, 0.25], durationMs, arc = false } = options;
    const motion = readMotionSpring('spatial', 'default', to);
    const duration = durationMs ?? motion.durationMs;

    /* Mesure sur rects natifs AVANT pose de l'état initial (sinon delta FLIP = 0). */
    const { dx, dy, scaleX, scaleY } = measureFlipDelta(
        from.getBoundingClientRect(),
        to.getBoundingClientRect()
    );

    to.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${scaleX}, ${scaleY})`;
    to.style.opacity = '0';

    const fadeInOffset = Math.max(fadeThresholds[1], 0.01);

    const frames: Keyframe[] = [
        {
            transform: `translate3d(${dx}px, ${dy}px, 0) scale(${scaleX}, ${scaleY})`,
            opacity: 0,
            offset: 0,
        },
        { opacity: 1, offset: fadeInOffset },
        {
            transform: 'translate3d(0, 0, 0) scale(1, 1)',
            opacity: 1,
            offset: 1,
        },
    ];

    if (arc) {
        frames.splice(1, 0, {
            transform: `translate3d(${dx / 2}px, ${dy}px, 0) scale(${(scaleX + 1) / 2}, ${(scaleY + 1) / 2})`,
            offset: 0.5,
        });
    }

    return to.animate(frames, {
        duration,
        easing: motion.easing,
        fill: 'both',
    });
}

/**
 * Animation inverse Container Transform (surface dialog → trigger).
 * @param from - Élément déclencheur cible
 * @param to - Surface dialog (`.dialog-container`)
 */
export function containerTransformOut(
    from: HTMLElement,
    to: HTMLElement,
    options: ContainerTransformOptions = {}
): Animation {
    const { fadeThresholds = [0.75, 1], durationMs, arc = false } = options;
    const motion = readMotionSpring('spatial', 'fast', to);
    const duration = durationMs ?? motion.durationMs;

    const { dx, dy, scaleX, scaleY } = measureFlipDelta(
        from.getBoundingClientRect(),
        to.getBoundingClientRect()
    );

    const fadeOutStart = Math.min(Math.max(fadeThresholds[0], 0.01), 0.99);

    const frames: Keyframe[] = [
        {
            transform: 'translate3d(0, 0, 0) scale(1, 1)',
            opacity: 1,
            offset: 0,
        },
        { opacity: 0, offset: fadeOutStart },
        {
            transform: `translate3d(${dx}px, ${dy}px, 0) scale(${scaleX}, ${scaleY})`,
            opacity: 0,
            offset: 1,
        },
    ];

    if (arc) {
        frames.splice(1, 0, {
            transform: `translate3d(${dx / 2}px, ${dy}px, 0) scale(${(scaleX + 1) / 2}, ${(scaleY + 1) / 2})`,
            offset: 0.5,
        });
    }

    return to.animate(frames, {
        duration,
        easing: motion.easing,
        fill: 'both',
    });
}
