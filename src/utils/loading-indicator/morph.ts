/**
 * @fileoverview Paths et helpers morph LoadingIndicator M3
 * @description Paths SVG bruts depuis assets/images/shapes/ — aucune transformation
 * @see assets/images/shapes/*.svg
 */

import { M3_OFFICIAL_SHAPE_PATHS } from './shape-paths';

/** Canvas logique des shapes (sunny = 340) */
export const MORPH_CANVAS = 340;
/** Marge viewBox — pill et autres paths dépassent leur viewBox source (~±12px) */
export const MORPH_VIEWPORT_PADDING = 14;
/** @deprecated Alias — préférer MORPH_CANVAS */
export const MORPH_VIEWPORT = MORPH_CANVAS;
export const MORPH_CENTER = MORPH_CANVAS / 2;

/** Attribut viewBox SVG avec marge anti-clipping (pill, rotation) */
export function getMorphSvgViewBox(): string {
    const p = MORPH_VIEWPORT_PADDING;
    const size = MORPH_CANVAS + p * 2;
    return `${-p} ${-p} ${size} ${size}`;
}

export const SHAPE_COUNT = 7;

/** @deprecated Conservé pour compat tests */
export const MORPH_VERTEX_COUNT = 180;
export const MORPH_SPRING_POINTS = MORPH_VERTEX_COUNT;

/** Séquence M3 : burstsoft → sides9 → pentagon → pill → sunny → sides4 → oval */
export const MORPHABLE_SHAPE_NAMES = [
    'burstsoft',
    'sides9',
    'pentagon',
    'pill',
    'sunny',
    'sides4',
    'oval',
] as const;

export type MorphableShapeName = (typeof MORPHABLE_SHAPE_NAMES)[number];

export interface MorphVertex {
    x: number;
    y: number;
}

export interface RoundedPolygonShape {
    vertices: MorphVertex[];
    cornerRadii: number[];
}

/**
 * Path SVG brut (attribut d) tel qu'extrait du fichier assets — sans scale ni edit.
 */
export function getMorphablePath(shape: MorphableShapeName): string {
    return M3_OFFICIAL_SHAPE_PATHS[shape].pathD;
}

/** ViewBox source du SVG asset */
export function getShapeViewBoxSize(shape: MorphableShapeName): number {
    return M3_OFFICIAL_SHAPE_PATHS[shape].viewBoxSize;
}

/** Décalage pour centrer une shape native dans le canvas morph unifié (340×340) */
export function getShapeViewportOffset(shape: MorphableShapeName): { x: number; y: number } {
    const offset = (MORPH_CANVAS - getShapeViewBoxSize(shape)) / 2;
    return { x: offset, y: offset };
}

export function isMorphableShape(name: string): name is MorphableShapeName {
    return (MORPHABLE_SHAPE_NAMES as readonly string[]).includes(name);
}

/** Paths bruts pour une séquence morph */
export function getMorphablePathsForSequence(sequence: MorphableShapeName[]): string[] {
    return sequence.map((name) => getMorphablePath(name));
}

/**
 * keyTimes SMIL équidistants pour N shapes (cycle 0 → 1).
 */
export function buildMorphKeyTimes(shapeCount: number): string {
    const n = Math.max(2, shapeCount);
    return Array.from({ length: n }, (_, i) => (i / (n - 1)).toFixed(3)).join('; ');
}

/**
 * keySplines SMIL (N-1 segments) depuis un cubic-bezier CSS M3.
 */
export function cubicBezierToKeySplines(easing: string, segments: number): string {
    const m = easing.trim().match(/cubic-bezier\s*\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/i);
    const spline = m ? `${m[1]} ${m[2]} ${m[3]} ${m[4]}` : '0.38 1.21 0.22 1';
    return Array(Math.max(1, segments - 1)).fill(spline).join('; ');
}

/**
 * Valeurs rotation SMIL — double rotation M3 (constant + extra par transition).
 */
export function buildMorphRotationValues(shapeCount: number): string {
    const n = Math.max(2, shapeCount);
    const cx = MORPH_CENTER;
    const cy = MORPH_CENTER;
    const constantStep = 360 / n;
    const extraStep = 90;
    return Array.from({ length: n }, (_, i) => {
        const deg = constantStep * i + extraStep * i;
        return `${deg} ${cx} ${cy}`;
    }).join('; ');
}

/** @deprecated */
export function scalePathTo380(pathD: string, fromSize: number): string {
    const scale = 380 / fromSize;
    return pathD.replace(/-?[\d.]+(?:e[-+]?\d+)?/gi, (num) =>
        String(Math.round(parseFloat(num) * scale * 100) / 100)
    );
}

/** @deprecated */
export function clearShapePolygonCache(): void {
    /* noop */
}
