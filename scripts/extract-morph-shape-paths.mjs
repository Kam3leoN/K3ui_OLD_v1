#!/usr/bin/env node
/**
 * Extrait les 7 paths morph depuis assets/images/shapes/shapes.svg
 * et génère src/utils/loading-indicator/shape-paths.ts (embarqué dans le bundle K3UI)
 *
 * Usage: node scripts/extract-morph-shape-paths.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SHAPES_DIR = join(ROOT, 'assets', 'images', 'shapes');
const SHAPES_SVG = join(SHAPES_DIR, 'shapes.svg');
const OUT_FILE = join(ROOT, 'src', 'utils', 'loading-indicator', 'shape-paths.ts');

/** Séquence M3 LoadingIndicator (ordre des <path> dans shapes.svg) */
const M3_MORPH_SEQUENCE = [
    'burstsoft',
    'sides9',
    'pentagon',
    'pill',
    'sunny',
    'sides4',
    'oval',
];

/**
 * @param {string} svgContent
 * @returns {{ pathD: string, viewBoxSize: number }}
 */
function parseShapeSvg(svgContent) {
    const viewBoxMatch = svgContent.match(/viewBox=["']0\s+0\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)["']/i);
    const pathMatch = svgContent.match(/<path[^>]*\sd=["']([^"']+)["']/i);
    if (!pathMatch) {
        throw new Error('Path introuvable dans le SVG');
    }
    const w = viewBoxMatch ? parseFloat(viewBoxMatch[1]) : 320;
    const h = viewBoxMatch ? parseFloat(viewBoxMatch[2]) : 320;
    const viewBoxSize = Math.max(w, h);
    return { pathD: pathMatch[1], viewBoxSize };
}

const shapesSvgContent = readFileSync(SHAPES_SVG, 'utf8');
const pathsFromShapesSvg = [...shapesSvgContent.matchAll(/<path[^>]*\sd=["']([^"']+)["']/gi)].map((m) => m[1]);

if (pathsFromShapesSvg.length < M3_MORPH_SEQUENCE.length) {
    throw new Error(
        `shapes.svg : ${pathsFromShapesSvg.length} paths trouvés, ${M3_MORPH_SEQUENCE.length} attendus`
    );
}

const assets = {};

for (let i = 0; i < M3_MORPH_SEQUENCE.length; i++) {
    const name = M3_MORPH_SEQUENCE[i];
    const filePath = join(SHAPES_DIR, `${name}.svg`);
    const individual = readFileSync(filePath, 'utf8');
    const meta = parseShapeSvg(individual);
    assets[name] = {
        pathD: pathsFromShapesSvg[i],
        viewBoxSize: meta.viewBoxSize,
    };
    console.log(`✓ ${name} (shapes.svg path #${i + 1}, viewBox ${meta.viewBoxSize})`);
}

const lines = [
    '/**',
    ' * @fileoverview Paths SVG morph M3 embarqués (bundle JS, aucun fetch réseau)',
    ' * @description Généré par scripts/extract-morph-shape-paths.mjs depuis assets/images/shapes/shapes.svg',
    ' * @see assets/images/shapes/shapes.svg — 7 paths séquence morph (burstsoft → oval)',
    ' */',
    '',
    '/** Métadonnées path brut + viewBox source (avant normalisation viewport 380) */',
    'export interface M3ShapePathAsset {',
    '    /** Attribut d du path SVG officiel */',
    '    pathD: string;',
    '    /** Taille viewBox carré source (ex. 320, 300, 340) */',
    '    viewBoxSize: number;',
    '}',
    '',
    '/** Paths officiels Google Material 3 You — séquence morph LoadingIndicator */',
    'export const M3_OFFICIAL_SHAPE_PATHS = {',
];

for (const name of M3_MORPH_SEQUENCE) {
    const { pathD, viewBoxSize } = assets[name];
    lines.push(`    ${name}: {`);
    lines.push(`        pathD: '${pathD}',`);
    lines.push(`        viewBoxSize: ${viewBoxSize},`);
    lines.push('    },');
}

lines.push('} as const satisfies Record<string, M3ShapePathAsset>;');
lines.push('');
lines.push('export type M3OfficialMorphShapeName = keyof typeof M3_OFFICIAL_SHAPE_PATHS;');
lines.push('');

writeFileSync(OUT_FILE, lines.join('\n'), 'utf8');
console.log(`\n→ ${OUT_FILE}`);
