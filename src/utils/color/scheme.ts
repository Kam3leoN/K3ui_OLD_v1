/**
 * @fileoverview Schémas dynamiques de couleurs (réexports package + factory K3UI)
 * @description Gestion des schémas de couleurs dynamiques Material Design 3
 */

export {
    SchemeTonalSpot,
    SchemeVibrant,
    SchemeExpressive,
    SchemeNeutral,
    SchemeMonochrome,
    SchemeFidelity,
    SchemeContent,
    SchemeRainbow,
    SchemeFruitSalad,
    SchemeAndroid,
    Variant,
    DynamicScheme,
} from '@material/material-color-utilities';

import {
    DynamicScheme,
    SchemeTonalSpot,
    SchemeVibrant,
    SchemeExpressive,
    SchemeNeutral,
    SchemeMonochrome,
    SchemeFidelity,
    SchemeContent,
    SchemeRainbow,
    SchemeFruitSalad,
    Variant,
} from '@material/material-color-utilities';
import type { Hct } from './hct';
import type { ContrastLevel } from './contrast';

/** Version de spec couleur Material */
export type SpecVersion = '2021' | '2025';

/** Plateforme cible pour la spec 2025+ */
export type Platform = 'phone' | 'watch';

/** Options pour créer un schéma dynamique */
export interface CreateSchemeOptions {
    variant?: Variant;
    specVersion?: SpecVersion;
    platform?: Platform;
    contrastLevel?: ContrastLevel;
    isDark?: boolean;
}

const SCHEME_FACTORIES: Partial<Record<Variant, new (
    sourceColorHct: Hct,
    isDark: boolean,
    contrastLevel: number,
    specVersion?: SpecVersion,
    platform?: Platform
) => DynamicScheme>> = {
    [Variant.TONAL_SPOT]: SchemeTonalSpot,
    [Variant.VIBRANT]: SchemeVibrant,
    [Variant.EXPRESSIVE]: SchemeExpressive,
    [Variant.NEUTRAL]: SchemeNeutral,
    [Variant.MONOCHROME]: SchemeMonochrome,
    [Variant.FIDELITY]: SchemeFidelity,
    [Variant.CONTENT]: SchemeContent,
    [Variant.RAINBOW]: SchemeRainbow,
    [Variant.FRUIT_SALAD]: SchemeFruitSalad,
};

/**
 * Factory pour créer un DynamicScheme selon la variante et la spec
 * @param sourceColorHct - Couleur source HCT
 * @param options - Options de schéma
 * @returns Instance DynamicScheme
 */
export function createScheme(sourceColorHct: Hct, options: CreateSchemeOptions = {}): DynamicScheme {
    const variant = options.variant ?? Variant.TONAL_SPOT;
    const specVersion = options.specVersion ?? '2025';
    const platform = options.platform ?? DynamicScheme.DEFAULT_PLATFORM;
    const isDark = options.isDark ?? false;
    const contrastLevel = options.contrastLevel ?? 0;

    const SchemeClass = SCHEME_FACTORIES[variant] ?? SchemeTonalSpot;
    return new SchemeClass(sourceColorHct, isDark, contrastLevel, specVersion, platform);
}
