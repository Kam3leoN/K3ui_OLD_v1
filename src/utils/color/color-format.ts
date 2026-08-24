/**
 * @fileoverview Formatage couleurs ARGB/hex partagé K3UI
 * @description Utilitaires centralisés pour DynamicColorManager et palette
 */

import { hexFromArgb as upstreamHexFromArgb, argbFromHex as upstreamArgbFromHex } from '@material/material-color-utilities';

/**
 * Convertit ARGB (32 bits) en hex #RRGGBB
 * @param argb - Couleur ARGB
 * @param uppercase - Majuscules (défaut: true)
 * @returns Hex
 */
export function argbToHex(argb: number, uppercase: boolean = true): string {
    const hex = upstreamHexFromArgb(argb);
    return uppercase ? hex.toUpperCase() : hex.toLowerCase();
}

/**
 * Convertit hex (#RRGGBB ou RRGGBB) en ARGB
 * @param hex - Couleur hexadécimale
 * @returns ARGB 32 bits
 */
export function hexToArgb(hex: string): number {
    const normalized = hex.startsWith('#') ? hex : `#${hex}`;
    return upstreamArgbFromHex(normalized);
}

/**
 * Extrait les composantes RGB depuis ARGB
 * @param argb - Couleur ARGB
 */
export function argbToRgbString(argb: number): string {
    const r = (argb >> 16) & 0xff;
    const g = (argb >> 8) & 0xff;
    const b = argb & 0xff;
    return `${r}, ${g}, ${b}`;
}
