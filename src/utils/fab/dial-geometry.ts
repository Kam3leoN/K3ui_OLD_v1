/**
 * @fileoverview Géométrie de l'éventail ButtonFabDial (flower / vertical)
 */

export type FabDialLayout = 'flower' | 'vertical';
export type FabCornerPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

export interface FabOffset {
    x: number;
    y: number;
}

export interface FabDialGeometryInput {
    count: number;
    layout: FabDialLayout;
    position: FabCornerPosition;
    radius: number | null;
    gap: number;
    spread: [number, number];
    triggerSize: number;
    actionSize: number;
    minGap: number;
}

/**
 * Calcule les décalages (px) de chaque action par rapport au déclencheur.
 * En mode flower, le rayon garantit un espacement minimal entre boutons voisins.
 */
export function computeFabDialOffsets(input: FabDialGeometryInput): FabOffset[] {
    const { count, layout, position, radius, gap, spread, triggerSize, actionSize, minGap } = input;
    if (count <= 0) return [];

    const sx = position.endsWith('right') ? 1 : -1;
    const sy = position.startsWith('bottom') ? 1 : -1;
    const [from, to] = spread;

    const step = count > 1 ? (to - from) / (count - 1) : 0;
    const spacedRadius =
        count > 1 ? (actionSize + minGap) / (2 * Math.sin((step * Math.PI) / 360)) : 0;
    const clearance = (triggerSize + actionSize) / 2 + minGap;
    const r = radius ?? Math.max(spacedRadius, clearance);

    return Array.from({ length: count }, (_, i) => {
        if (layout === 'vertical') {
            return {
                x: 0,
                y: -sy * ((triggerSize + actionSize) / 2 + minGap + i * gap),
            };
        }
        const t = count === 1 ? 0.5 : i / (count - 1);
        const angle = ((from + t * (to - from)) * Math.PI) / 180;
        return {
            x: -sx * r * Math.cos(angle),
            y: -sy * r * Math.sin(angle),
        };
    });
}

/**
 * Rotation de l'icône trigger selon le coin (deg).
 */
export function computeFabDialIconRotation(position: FabCornerPosition): number {
    const [vertical, horizontal] = position.split('-') as ['bottom' | 'top', 'right' | 'left'];
    const spin = (horizontal === 'right' ? 1 : -1) * (vertical === 'bottom' ? 1 : -1);
    return 135 * spin;
}
