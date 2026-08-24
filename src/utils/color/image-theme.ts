/**
 * @fileoverview Entrypoint lazy — thème depuis image
 * @description Import dynamique ciblé pour éviter le poids quantize/score dans le bundle principal
 */

import type { SpecVersion, Platform } from './scheme';
import type { ContrastLevel } from './contrast';
import type { DynamicScheme, Variant } from '@material/material-color-utilities';

export interface ImageThemeResult {
    sourceColor: string;
    scheme: DynamicScheme;
}

/**
 * Extrait la couleur dominante d'une image et crée un schéma dynamique
 * @param image - Élément image chargé (crossOrigin si CORS requis)
 * @param options - Options de schéma
 */
export async function themeFromImage(
    image: HTMLImageElement,
    options: {
        variant?: Variant;
        specVersion?: SpecVersion;
        platform?: Platform;
        contrastLevel?: ContrastLevel;
        isDark?: boolean;
    } = {}
): Promise<ImageThemeResult> {
    const { sourceColorFromImage } = await import('@material/material-color-utilities');
    const { createScheme, Variant: VariantEnum, DynamicScheme } = await import('./scheme');
    const { Hct } = await import('./hct');

    const sourceArgb = await sourceColorFromImage(image);
    const sourceHct = Hct.fromInt(sourceArgb);
    const sourceColor = sourceHct.toHex();

    const scheme = createScheme(sourceHct, {
        variant: options.variant ?? VariantEnum.TONAL_SPOT,
        specVersion: options.specVersion ?? DynamicScheme.DEFAULT_SPEC_VERSION,
        platform: options.platform ?? DynamicScheme.DEFAULT_PLATFORM,
        contrastLevel: options.contrastLevel ?? 0,
        isDark: options.isDark ?? false,
    });

    return { sourceColor, scheme };
}

/**
 * Réexport lazy de themeFromSourceColor (API legacy Material)
 */
export async function themeFromSourceColor(sourceArgb: number) {
    const { themeFromSourceColor: upstream } = await import('@material/material-color-utilities');
    return upstream(sourceArgb);
}
