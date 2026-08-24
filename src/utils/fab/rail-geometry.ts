/**
 * @fileoverview Géométrie linéaire ButtonFabRail
 */

import type { FabCornerPosition, FabOffset } from './dial-geometry';

export type FabRailDirection = 'right' | 'left' | 'up' | 'down';

const AXIS: Record<FabRailDirection, FabOffset> = {
    right: { x: 1, y: 0 },
    left: { x: -1, y: 0 },
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
};

/** Direction par défaut selon le coin d'ancrage */
export const DEFAULT_RAIL_DIRECTION: Record<FabCornerPosition, FabRailDirection> = {
    'top-left': 'right',
    'top-right': 'down',
    'bottom-right': 'left',
    'bottom-left': 'up',
};

export interface FabRailGeometryInput {
    count: number;
    direction: FabRailDirection;
    actionSize: number;
    gap: number;
    triggerSize: number;
}

/**
 * Décalage de chaque action le long de l'axe du rail.
 */
export function computeFabRailOffsets(input: FabRailGeometryInput): FabOffset[] {
    const { count, direction, actionSize, gap, triggerSize } = input;
    if (count <= 0) return [];

    const axis = AXIS[direction] ?? AXIS.up;
    const first = (triggerSize + actionSize) / 2 + gap;
    const step = actionSize + gap;

    return Array.from({ length: count }, (_, i) => {
        const d = first + i * step;
        return { x: axis.x * d, y: axis.y * d };
    });
}

/**
 * Facteur d'échelle pour que le rail tienne dans l'écran (0–1).
 */
export function computeFabRailFitScale(
    rootRect: DOMRect,
    direction: FabRailDirection,
    count: number,
    actionSize: number,
    gap: number
): number {
    const available = {
        right: window.innerWidth - rootRect.right,
        left: rootRect.left,
        down: window.innerHeight - rootRect.bottom,
        up: rootRect.top,
    }[direction];

    const needed = count * (actionSize + gap);
    if (!needed || !Number.isFinite(available)) return 1;
    return Math.min(1, (available - 8) / needed);
}

/**
 * Rotation de l'icône trigger selon la direction du rail.
 */
export function computeFabRailIconRotation(direction: FabRailDirection): string {
    return direction === 'right' || direction === 'down' ? '135deg' : '-135deg';
}
