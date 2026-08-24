#!/usr/bin/env node
/**
 * Lit assets/qrcode/{dots,corners,covers}/*.svg et génère
 * src/extensions/generators/qrcode/shapeCatalog.ts (fragments embarqués, aucun fetch runtime).
 *
 * Usage: node scripts/generate-qr-shape-catalog.mjs
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ASSETS = join(ROOT, 'assets', 'qrcode');
const OUT = join(ROOT, 'src', 'extensions', 'generators', 'qrcode', 'shapeCatalog.ts');

/**
 * @param {string} svg
 * @returns {string}
 */
function extractSvgInner(svg) {
    const m = svg.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
    return m ? m[1].trim() : '';
}

/**
 * @param {string} s
 * @returns {string}
 */
function escapeTsString(s) {
    return s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

/**
 * @param {string} dirName
 * @returns {Map<number, string>}
 */
function loadSvgs(dirName) {
    const dir = join(ASSETS, dirName);
    /** @type {Map<number, string>} */
    const map = new Map();
    for (const name of readdirSync(dir)) {
        if (!name.endsWith('.svg')) continue;
        const base = name.replace(/\.svg$/i, '');
        if (!/^\d+$/.test(base)) continue;
        const idx = Number(base);
        const raw = readFileSync(join(dir, name), 'utf8').trim();
        map.set(idx, raw);
    }
    return map;
}

/**
 * @param {Map<number, string>} map
 * @param {(svg: string) => string} transform
 * @returns {string}
 */
function formatRecord(map, transform) {
    const keys = [...map.keys()].sort((a, b) => a - b);
    const lines = keys.map((k) => {
        const val = escapeTsString(transform(map.get(k) ?? ''));
        return `    ${k}: \`${val}\`,`;
    });
    return `{\n${lines.join('\n')}\n}`;
}

const dots = loadSvgs('dots');
const corners = loadSvgs('corners');
const covers = loadSvgs('covers');

const content = `/**
 * @fileoverview Catalogue SVG QR embarqué (dots / corners / covers)
 * @description Généré par scripts/generate-qr-shape-catalog.mjs — ne pas éditer à la main.
 * @see assets/qrcode/
 */

/** Fragments internes des modules (viewBox source 0 0 6 6). */
export const QR_DOT_INNERS: Readonly<Record<number, string>> = ${formatRecord(dots, extractSvgInner)};

/** Fragments internes des repères extérieurs (viewBox source 0 0 14 14). */
export const QR_CORNER_INNERS: Readonly<Record<number, string>> = ${formatRecord(corners, extractSvgInner)};

/** Documents SVG complets pour le voile (cover). */
export const QR_COVER_FULL: Readonly<Record<number, string>> = ${formatRecord(covers, (s) => s)};

/** Indices disponibles par famille. */
export const QR_SHAPE_INDEXES = {
    dots: Object.keys(QR_DOT_INNERS).map(Number),
    corners: Object.keys(QR_CORNER_INNERS).map(Number),
    covers: Object.keys(QR_COVER_FULL).map(Number),
} as const;
`;

writeFileSync(OUT, content, 'utf8');
process.stdout.write(
    `✓ shapeCatalog.ts — dots:${dots.size} corners:${corners.size} covers:${covers.size}\n`
);
