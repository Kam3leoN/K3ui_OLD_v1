/**
 * @fileoverview Moteur de rendu SVG QR (qrcode-generator + assets embarqués)
 */

import qrcodeFactory from 'qrcode-generator';
import type { QrCodeDotsType, QrCodeErrorCorrectionLevel } from '../../../types/components';
import { QR_CORNER_INNERS, QR_COVER_FULL, QR_DOT_INNERS } from './shapeCatalog';
import { getQrBallPath, parseSvgShapeKey } from './shapes';
import {
    isTransparentBgColor,
    resolveLogoSrc,
    resolveQrPartColors,
    type QrDotsFill,
    type QrDotsGradientPreset,
    type QrPartColors,
} from './style';

/** Secours module (espace 0..1). */
export const BUILTIN_DOT_FALLBACK =
    '<rect x="0" y="0" width="1" height="1" fill="currentColor"/>';

/** Secours repère extérieur (espace 0..7). */
export const BUILTIN_CORNER_OUTER_FALLBACK =
    '<path fill="currentColor" d="M0 0h7v7H0V0zm1 1v5h5V1H1z"/>';

/**
 * Mapping stable dotsType → index fichier `assets/qrcode/dots/N.svg`
 * (`square` utilise le rect intégré, pas un asset).
 */
export const DOTS_TYPE_TO_ASSET_INDEX: Record<Exclude<QrCodeDotsType, 'square'>, number> = {
    dots: 6,
    rounded: 7,
    'extra-rounded': 5,
    classy: 3,
    'classy-rounded': 4,
};

const DEFAULT_QUIET_MARGIN = 4;

function escapeXmlAttr(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/**
 * Applique une couleur ou un dégradé (`url(#…)`) au fragment SVG
 * @param fragment Markup interne
 * @param fill Couleur ou référence de paint
 */
function applyPaintToFragment(fragment: string, fill: string): string {
    const repl = fill.startsWith('url(') ? fill : escapeXmlAttr(fill);
    const patched = fragment.replace(/currentColor/gi, repl);
    return `<g fill="${repl}" stroke="none">${patched}</g>`;
}

function buildDotsGradientDef(
    preset: QrDotsGradientPreset,
    size: number,
    gradId: string,
    pc: QrPartColors
): string {
    const c0 = escapeXmlAttr(pc.dots);
    const c1 = escapeXmlAttr(pc.dotsGradientEnd);
    const stops = `<stop offset="0%" stop-color="${c0}"/><stop offset="100%" stop-color="${c1}"/>`;

    switch (preset) {
        case 'linear-horizontal':
            return `<linearGradient id="${gradId}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${size}" y2="0">${stops}</linearGradient>`;
        case 'linear-vertical':
            return `<linearGradient id="${gradId}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${size}">${stops}</linearGradient>`;
        case 'diagonal-right': {
            const rad = (45 * Math.PI) / 180;
            return `<linearGradient id="${gradId}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${size * Math.cos(rad)}" y2="${size * Math.sin(rad)}">${stops}</linearGradient>`;
        }
        case 'diagonal-left': {
            const rad = (135 * Math.PI) / 180;
            return `<linearGradient id="${gradId}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${size * Math.cos(rad)}" y2="${size * Math.sin(rad)}">${stops}</linearGradient>`;
        }
        case 'radial': {
            const r = (size * Math.SQRT2) / 2;
            const cx = size / 2;
            const cy = size / 2;
            return `<radialGradient id="${gradId}" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${r}" fx="${cx}" fy="${cy}">${stops}</radialGradient>`;
        }
        default:
            return `<linearGradient id="${gradId}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${size}" y2="${size}">${stops}</linearGradient>`;
    }
}

/** Assets `dots/*.svg` : viewBox 0 0 6 6 → une cellule module = 0..1. */
function wrapDotModuleFragment(inner: string): string {
    return `<g transform="scale(${1 / 6})">${inner}</g>`;
}

function singleDotCellFragment(raw: string | null): string {
    return raw ? wrapDotModuleFragment(raw) : BUILTIN_DOT_FALLBACK;
}

/** Assets `corners/*.svg` : viewBox 0 0 14 14 → repère 7×7 = 0..7. */
function wrapCornerOuterFragment(inner: string): string {
    return `<g transform="scale(${7 / 14})">${inner}</g>`;
}

/**
 * Centre d'œil : path QR_BALL_SVG (0–100) mis à l'échelle dans la zone 3×3 modules
 * @param ballShape Clé svg-N
 */
function buildBallInnerFragment(ballShape: string): string {
    const d = escapeXmlAttr(getQrBallPath(ballShape));
    return `<g transform="scale(${3 / 100})"><path fill="currentColor" d="${d}"/></g>`;
}

type FinderKind = 'tl' | 'tr' | 'bl';

function mirrorOuterTopRight(outer: string): string {
    return `<g transform="translate(7,0) scale(-1,1)">${outer}</g>`;
}

function mirrorOuterBottomLeft(outer: string): string {
    return `<g transform="translate(0,7) scale(1,-1)">${outer}</g>`;
}

function mirrorInnerTopRight(inner: string): string {
    return `<g transform="translate(3,0) scale(-1,1)">${inner}</g>`;
}

function mirrorInnerBottomLeft(inner: string): string {
    return `<g transform="translate(0,3) scale(1,-1)">${inner}</g>`;
}

function mapFinderOuter(kind: FinderKind, outer: string): string {
    if (kind === 'tr') {
        return mirrorOuterTopRight(outer);
    }
    if (kind === 'bl') {
        return mirrorOuterBottomLeft(outer);
    }
    return outer;
}

function mapFinderInner(kind: FinderKind, inner: string): string {
    if (kind === 'tr') {
        return mirrorInnerTopRight(inner);
    }
    if (kind === 'bl') {
        return mirrorInnerBottomLeft(inner);
    }
    return inner;
}

function isInFinderBlock(r: number, c: number, n: number): boolean {
    if (r < 7 && c < 7) {
        return true;
    }
    if (r < 7 && c >= n - 7) {
        return true;
    }
    if (r >= n - 7 && c < 7) {
        return true;
    }
    return false;
}

function inLogoSquare(
    r: number,
    c: number,
    n: number,
    logoSide: number,
    logoStart: number
): boolean {
    return r >= logoStart && r < logoStart + logoSide && c >= logoStart && c < logoStart + logoSide;
}

/**
 * Résout l'index corner depuis `frameShape` (svg-N)
 * @param frameShape Forme du contour
 */
export function resolveCornerIndex(frameShape: string): number {
    const key = parseSvgShapeKey(frameShape);
    const n = Number(key);
    if (Number.isFinite(n) && QR_CORNER_INNERS[n] !== undefined) {
        return n;
    }
    return 0;
}

/**
 * Résout le fragment module depuis `dotsType`
 * @param dotsType Style de points
 */
export function resolveDotInner(dotsType: QrCodeDotsType): string | null {
    if (dotsType === 'square') {
        return null;
    }
    const idx = DOTS_TYPE_TO_ASSET_INDEX[dotsType];
    return QR_DOT_INNERS[idx] ?? QR_DOT_INNERS[7] ?? null;
}

/** Paramètres de rendu SVG QR. */
export interface QrSvgRenderParams {
    /** Contenu encodé */
    value: string;
    /** Taille en pixels */
    size: number;
    /** Couleur de fond */
    backgroundColor: string;
    /** Couleur des modules */
    dotsColor: string;
    /** Couleur des contours d'yeux */
    cornersSquareColor: string;
    /** Couleur des centres d'yeux */
    cornersDotColor: string;
    /** Style des modules */
    dotsType: QrCodeDotsType;
    /** Niveau ECC */
    level: QrCodeErrorCorrectionLevel;
    /** Forme contour yeux (svg-N) */
    frameShape: string;
    /** Forme centre yeux (svg-N) */
    ballShape: string;
    /** Logo central */
    image?: string | null;
    /** Masquer les modules derrière le logo */
    hideBackgroundDots?: boolean;
    /** Taille relative du logo (0–1) */
    imageSize?: number;
    /** Remplissage modules */
    dotsFill?: QrDotsFill;
    /** Fin de dégradé */
    dotsGradientEnd?: string;
    /** Preset de dégradé */
    dotsGradientPreset?: QrDotsGradientPreset;
    /** Modules adoucis (false = crispEdges) */
    dotsRoundSize?: boolean;
    /** Index cover optionnel (`null` = aucun) */
    coverShape?: number | null;
    /** Marge quiet zone en modules (défaut 4) */
    quietMargin?: number;
}

/**
 * Génère le markup SVG complet du QR code
 * @param params Options de rendu
 */
export function renderQrSvgString(params: QrSvgRenderParams): string {
    const qr = qrcodeFactory(0, params.level);
    qr.addData(params.value.trim() || ' ');
    qr.make();
    const n = qr.getModuleCount();
    const margin =
        typeof params.quietMargin === 'number' && Number.isFinite(params.quietMargin)
            ? Math.max(0, Math.floor(params.quietMargin))
            : DEFAULT_QUIET_MARGIN;
    const cell = params.size / (n + 2 * margin);

    const pc = resolveQrPartColors(params.dotsColor, {
        dots: params.dotsColor,
        outer: params.cornersSquareColor,
        inner: params.cornersDotColor,
        dotsFill: params.dotsFill,
        dotsGradientEnd: params.dotsGradientEnd,
        dotsGradientPreset: params.dotsGradientPreset,
    });

    const bg = params.backgroundColor;
    const bgTransparent = isTransparentBgColor(bg);

    const cornerIdx = resolveCornerIndex(params.frameShape);
    const cornerOuterInner = QR_CORNER_INNERS[cornerIdx] ?? null;
    const dotInner = resolveDotInner(params.dotsType);

    const dotFrag = singleDotCellFragment(dotInner);
    const innerBase = buildBallInnerFragment(params.ballShape);
    const outerBase = cornerOuterInner
        ? wrapCornerOuterFragment(cornerOuterInner)
        : BUILTIN_CORNER_OUTER_FALLBACK;

    let coverHref: string | null = null;
    if (!bgTransparent && params.coverShape !== null && params.coverShape !== undefined) {
        const coverFull = QR_COVER_FULL[params.coverShape];
        if (coverFull?.trim()) {
            coverHref = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(coverFull)}`;
        }
    }

    const logoSrc = resolveLogoSrc(params.image);
    const imageSize = typeof params.imageSize === 'number' ? params.imageSize : 0.38;
    const logoSide = Math.max(3, Math.floor(n * Math.min(0.5, Math.max(0.1, imageSize))));
    const logoStart = Math.floor((n - logoSide) / 2);
    const hideDots = params.hideBackgroundDots !== false;

    const useGradient = pc.dotsFill === 'gradient';
    const crispDots = params.dotsRoundSize === false;
    const uid = Math.random().toString(36).slice(2, 11);
    const dotsGradId = `qd_grad_${uid}`;
    const dotsMaskId = `qd_mask_${uid}`;

    const defsParts: string[] = [];
    if (useGradient) {
        defsParts.push(buildDotsGradientDef(pc.dotsGradientPreset, params.size, dotsGradId, pc));
        const maskCells: string[] = [];
        for (let r = 0; r < n; r += 1) {
            for (let c = 0; c < n; c += 1) {
                if (isInFinderBlock(r, c, n)) {
                    continue;
                }
                if (logoSrc && hideDots && inLogoSquare(r, c, n, logoSide, logoStart)) {
                    continue;
                }
                if (!qr.isDark(r, c)) {
                    continue;
                }
                const x = (margin + c) * cell;
                const y = (margin + r) * cell;
                maskCells.push(
                    `<g transform="translate(${x},${y}) scale(${cell})"><g fill="#ffffff">${dotFrag}</g></g>`
                );
            }
        }
        defsParts.push(
            `<mask id="${dotsMaskId}" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x="0" y="0" width="${params.size}" height="${params.size}"><rect width="100%" height="100%" fill="#000000"/>${maskCells.join('')}</mask>`
        );
    }

    const parts: string[] = [];
    parts.push(
        `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${params.size}" height="${params.size}" viewBox="0 0 ${params.size} ${params.size}" role="img" aria-label="QR code">`
    );
    if (defsParts.length > 0) {
        parts.push(`<defs>${defsParts.join('')}</defs>`);
    }
    if (!bgTransparent) {
        parts.push(`<rect width="100%" height="100%" fill="${escapeXmlAttr(bg)}"/>`);
    }

    if (coverHref) {
        parts.push(
            `<image href="${escapeXmlAttr(coverHref)}" x="0" y="0" width="${params.size}" height="${params.size}" preserveAspectRatio="xMidYMid slice" opacity="0.07"/>`
        );
    }

    const finderSpecs: { kind: FinderKind; r: number; c: number }[] = [
        { kind: 'tl', r: 0, c: 0 },
        { kind: 'tr', r: 0, c: n - 7 },
        { kind: 'bl', r: n - 7, c: 0 },
    ];

    for (const { kind, r, c } of finderSpecs) {
        const x = (margin + c) * cell;
        const y = (margin + r) * cell;
        const outerUse = applyPaintToFragment(mapFinderOuter(kind, outerBase), pc.outer);
        parts.push(`<g transform="translate(${x},${y}) scale(${cell})">${outerUse}</g>`);
        const ix = (margin + c + 2) * cell;
        const iy = (margin + r + 2) * cell;
        const innerUse = applyPaintToFragment(mapFinderInner(kind, innerBase), pc.inner);
        parts.push(`<g transform="translate(${ix},${iy}) scale(${cell})">${innerUse}</g>`);
    }

    const dotsShapeRendering = crispDots
        ? 'shape-rendering="crispEdges"'
        : 'shape-rendering="auto"';

    if (useGradient) {
        parts.push(
            `<g ${dotsShapeRendering}><rect width="100%" height="100%" fill="url(#${dotsGradId})" mask="url(#${dotsMaskId})"/></g>`
        );
    } else {
        const dotUse = applyPaintToFragment(dotFrag, pc.dots);
        parts.push(`<g ${dotsShapeRendering}>`);
        for (let r = 0; r < n; r += 1) {
            for (let c = 0; c < n; c += 1) {
                if (isInFinderBlock(r, c, n)) {
                    continue;
                }
                if (logoSrc && hideDots && inLogoSquare(r, c, n, logoSide, logoStart)) {
                    continue;
                }
                if (!qr.isDark(r, c)) {
                    continue;
                }
                const x = (margin + c) * cell;
                const y = (margin + r) * cell;
                parts.push(`<g transform="translate(${x},${y}) scale(${cell})">${dotUse}</g>`);
            }
        }
        parts.push(`</g>`);
    }

    if (logoSrc) {
        const lz = logoSide * cell;
        const lx = (margin + logoStart) * cell;
        const ly = (margin + logoStart) * cell;
        if (bgTransparent) {
            const inset = lz * 0.06;
            const side = lz - 2 * inset;
            parts.push(
                `<image href="${escapeXmlAttr(logoSrc)}" x="${lx + inset}" y="${ly + inset}" width="${side}" height="${side}" preserveAspectRatio="xMidYMid meet" crossorigin="anonymous"/>`
            );
        } else {
            parts.push(
                `<rect x="${lx}" y="${ly}" width="${lz}" height="${lz}" rx="${lz * 0.08}" fill="${escapeXmlAttr(bg)}"/>`
            );
            parts.push(
                `<image href="${escapeXmlAttr(logoSrc)}" x="${lx + lz * 0.1}" y="${ly + lz * 0.1}" width="${lz * 0.8}" height="${lz * 0.8}" preserveAspectRatio="xMidYMid meet" crossorigin="anonymous"/>`
            );
        }
    }

    parts.push(`</svg>`);
    return parts.join('');
}
