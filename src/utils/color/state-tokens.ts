/**
 * @fileoverview Tokens d'état dérivés (hover, pressed) — extension K3UI
 * @description Non présents dans la spec Material officielle ; dérivés des palettes tonales
 */

import type { DynamicScheme } from '@material/material-color-utilities';
import { MaterialDynamicColors } from './material-dynamic-colors';
import { argbToHex } from './color-format';

export interface StateTokenEntry {
    key: string;
    hex: string;
    rgb: string;
}

function clampTone(tone: number): number {
    return Math.max(0, Math.min(100, tone));
}

function toneArgb(palette: { tone: (t: number) => number }, tone: number): number {
    return palette.tone(clampTone(tone));
}

/**
 * Génère les tokens d'état hover/pressed à partir du schéma courant
 * @param scheme - Schéma dynamique actif
 */
export function buildStateTokens(scheme: DynamicScheme): StateTokenEntry[] {
    const isDark = scheme.isDark;
    const entries: StateTokenEntry[] = [];

    const primaryTone = MaterialDynamicColors.primary.getTone(scheme);
    const primaryHoverTone = primaryTone + (isDark ? 4 : -4);
    const primaryPressedTone = primaryTone + (isDark ? 8 : -8);

    const secContainerTone = MaterialDynamicColors.secondaryContainer.getTone(scheme);
    const secHoverTone = secContainerTone + (isDark ? 4 : -4);
    const secPressedTone = secContainerTone + (isDark ? 8 : -8);

    const tertiaryTone = MaterialDynamicColors.tertiary.getTone(scheme);
    const tertiaryHoverTone = tertiaryTone + (isDark ? 4 : -4);
    const tertiaryPressedTone = tertiaryTone + (isDark ? 8 : -8);

    const specs: Array<{ key: string; argb: number }> = [
        {
            key: 'primary-hover',
            argb: toneArgb(scheme.primaryPalette, primaryHoverTone),
        },
        {
            key: 'primary-pressed',
            argb: toneArgb(scheme.primaryPalette, primaryPressedTone),
        },
        {
            key: 'secondary-container-hover',
            argb: toneArgb(scheme.secondaryPalette, secHoverTone),
        },
        {
            key: 'secondary-container-pressed',
            argb: toneArgb(scheme.secondaryPalette, secPressedTone),
        },
        {
            key: 'tertiary-hover',
            argb: toneArgb(scheme.tertiaryPalette, tertiaryHoverTone),
        },
        {
            key: 'tertiary-pressed',
            argb: toneArgb(scheme.tertiaryPalette, tertiaryPressedTone),
        },
    ];

    for (const { key, argb } of specs) {
        entries.push({
            key,
            hex: argbToHex(argb),
            rgb: `${(argb >> 16) & 0xff}, ${(argb >> 8) & 0xff}, ${argb & 0xff}`,
        });
    }

    return entries;
}
