/**
 * @fileoverview Génération de palettes tonales depuis une couleur de base
 * @description Gestion de la génération de palettes de couleurs
 */

import { CorePalette, TonalPalette } from '@material/material-color-utilities';
import { argbToHex, hexToArgb } from './color-format';

/**
 * Interface pour représenter une palette tonale complète (tons 0-100)
 */
export interface TonalPaletteMap {
    [tone: number]: string;
}

/**
 * Interface pour représenter une palette principale (primary, secondary, etc.)
 */
export interface CorePaletteMap {
    primary: TonalPaletteMap;
    secondary: TonalPaletteMap;
    tertiary: TonalPaletteMap;
    error: TonalPaletteMap;
    neutral: TonalPaletteMap;
    neutralVariant: TonalPaletteMap;
}

/**
 * Options pour la génération de palette
 */
export interface PaletteOptions {
    /**
     * Mode contenu (content mode) - génère des palettes plus subtiles
     * @default false
     */
    isContent?: boolean;
    /** Couleur secondaire personnalisée (optionnelle) */
    secondaryColor?: string;
    /** Couleur tertiaire personnalisée (optionnelle) */
    tertiaryColor?: string;
    /** Couleur d'erreur personnalisée (optionnelle) */
    errorColor?: string;
    /** Couleur neutre personnalisée (optionnelle) */
    neutralColor?: string;
    /** Couleur neutre variante personnalisée (optionnelle) */
    neutralVariantColor?: string;
}

/**
 * Génère une palette tonale complète depuis une TonalPalette Material
 * @param tonalPalette - Palette tonale Material
 * @returns Map des tons (0-100) vers les couleurs hex
 */
function generateTonalPaletteMap(tonalPalette: TonalPalette): TonalPaletteMap {
    const map: TonalPaletteMap = {};
    const standardTones = [0, 10, 20, 25, 30, 35, 40, 50, 60, 70, 80, 87, 90, 92, 94, 95, 96, 98, 99, 100];

    for (const tone of standardTones) {
        const argb = tonalPalette.tone(tone);
        map[tone] = argbToHex(argb);
    }

    return map;
}

/**
 * Génère une palette principale (Core Palette) depuis une couleur de base
 * @param sourceColor - Couleur de base (hex, ex: #006493)
 * @param options - Options de génération
 * @returns Palette principale complète avec tous les tons
 */
export function generateCorePalette(
    sourceColor: string,
    options: PaletteOptions = {}
): CorePaletteMap {
    const sourceArgb = hexToArgb(sourceColor);

    let corePalette: CorePalette;

    if (options.isContent) {
        corePalette = CorePalette.contentOf(sourceArgb);
    } else {
        corePalette = CorePalette.of(sourceArgb);
    }

    if (options.secondaryColor || options.tertiaryColor || options.errorColor ||
        options.neutralColor || options.neutralVariantColor) {
        const customColors: Record<string, string> = {
            primary: sourceColor,
        };

        if (options.secondaryColor) customColors.secondary = options.secondaryColor;
        if (options.tertiaryColor) customColors.tertiary = options.tertiaryColor;
        if (options.errorColor) customColors.error = options.errorColor;
        if (options.neutralColor) customColors.neutral = options.neutralColor;
        if (options.neutralVariantColor) customColors.neutralVariant = options.neutralVariantColor;

        const colorsArgb = {
            primary: hexToArgb(customColors.primary),
            ...(customColors.secondary !== undefined ? { secondary: hexToArgb(customColors.secondary) } : {}),
            ...(customColors.tertiary !== undefined ? { tertiary: hexToArgb(customColors.tertiary) } : {}),
            ...(customColors.error !== undefined ? { error: hexToArgb(customColors.error) } : {}),
            ...(customColors.neutral !== undefined ? { neutral: hexToArgb(customColors.neutral) } : {}),
            ...(customColors.neutralVariant !== undefined
                ? { neutralVariant: hexToArgb(customColors.neutralVariant) }
                : {}),
        };

        if (options.isContent) {
            corePalette = CorePalette.contentFromColors(colorsArgb);
        } else {
            corePalette = CorePalette.fromColors(colorsArgb);
        }
    }

    return {
        primary: generateTonalPaletteMap(corePalette.a1),
        secondary: generateTonalPaletteMap(corePalette.a2),
        tertiary: generateTonalPaletteMap(corePalette.a3),
        error: generateTonalPaletteMap(corePalette.error),
        neutral: generateTonalPaletteMap(corePalette.n1),
        neutralVariant: generateTonalPaletteMap(corePalette.n2),
    };
}

/**
 * Génère une palette tonale depuis une couleur de base
 * @param sourceColor - Couleur de base (hex, ex: #006493)
 * @param hue - Teinte personnalisée (optionnelle, en degrés)
 * @param chroma - Chroma personnalisé (optionnel)
 * @returns Map des tons (0-100) vers les couleurs hex
 */
export function generateTonalPalette(
    sourceColor: string,
    hue?: number,
    chroma?: number
): TonalPaletteMap {
    let tonalPalette: TonalPalette;

    if (hue !== undefined && chroma !== undefined) {
        tonalPalette = TonalPalette.fromHueAndChroma(hue, chroma);
    } else {
        tonalPalette = TonalPalette.fromInt(hexToArgb(sourceColor));
    }

    return generateTonalPaletteMap(tonalPalette);
}

/**
 * Obtient un ton spécifique d'une palette
 * @param palette - Palette tonale
 * @param tone - Ton souhaité (0-100)
 * @returns Couleur hex pour ce ton, ou le ton le plus proche si non disponible
 */
export function getToneFromPalette(palette: TonalPaletteMap, tone: number): string {
    if (palette[tone]) {
        return palette[tone];
    }

    const availableTones = Object.keys(palette).map(Number).sort((a, b) => a - b);

    if (tone <= availableTones[0]) {
        return palette[availableTones[0]];
    }

    if (tone >= availableTones[availableTones.length - 1]) {
        return palette[availableTones[availableTones.length - 1]];
    }

    for (let i = 0; i < availableTones.length - 1; i++) {
        const lower = availableTones[i];
        const upper = availableTones[i + 1];

        if (tone >= lower && tone <= upper) {
            return tone - lower < upper - tone
                ? palette[lower]
                : palette[upper];
        }
    }

    return palette[availableTones[0]];
}
