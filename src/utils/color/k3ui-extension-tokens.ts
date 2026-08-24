/**
 * @fileoverview Tokens d'extension K3UI (warning/success/info dim)
 * @description Palettes fixes K3UI — alignées sur theme.token.scss (refs tone 30/70)
 */

import { hexToArgb, argbToHex } from './color-format';
import type { StateTokenEntry } from './state-tokens';

/** Valeurs statiques alignées sur $md-ref-palette-*30 (light) et *70 (dark) */
const K3UI_DIM_LIGHT: Record<string, string> = {
    'warning-dim': '#6B3D00',
    'success-dim': '#005211',
    'info-dim': '#004875',
};

const K3UI_DIM_DARK: Record<string, string> = {
    'warning-dim': '#FBA500',
    'success-dim': '#00C82D',
    'info-dim': '#00A2ED',
};

function toEntry(key: string, hex: string): StateTokenEntry {
    const argb = hexToArgb(hex);
    return {
        key,
        hex: argbToHex(argb),
        rgb: `${(argb >> 16) & 0xff}, ${(argb >> 8) & 0xff}, ${argb & 0xff}`,
    };
}

/**
 * Génère les tokens dim K3UI (warning, success, info)
 * @param isDark - Mode sombre actif
 */
export function buildK3uiExtensionTokens(isDark: boolean): StateTokenEntry[] {
    const map = isDark ? K3UI_DIM_DARK : K3UI_DIM_LIGHT;
    return Object.entries(map).map(([key, hex]) => toEntry(key, hex));
}
