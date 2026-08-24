/**
 * @fileoverview Couche de compatibilité API statique pour MaterialDynamicColors
 * @description Délègue vers l'instance API du package (inclut les rôles *-dim 2025)
 */

import {
    MaterialDynamicColors as MaterialDynamicColorsCore,
    type DynamicColor,
    type DynamicScheme,
} from '@material/material-color-utilities';

const core = new MaterialDynamicColorsCore();

/**
 * API statique rétrocompatible K3UI — chaque propriété retourne un DynamicColor
 * utilisable via `.getArgb(scheme)`.
 */
export class MaterialDynamicColors {
    static contentAccentToneDelta = 15.0;

    static highestSurface(s: DynamicScheme): DynamicColor {
        return core.highestSurface(s);
    }

    static get primaryPaletteKeyColor(): DynamicColor {
        return core.primaryPaletteKeyColor();
    }

    static get secondaryPaletteKeyColor(): DynamicColor {
        return core.secondaryPaletteKeyColor();
    }

    static get tertiaryPaletteKeyColor(): DynamicColor {
        return core.tertiaryPaletteKeyColor();
    }

    static get neutralPaletteKeyColor(): DynamicColor {
        return core.neutralPaletteKeyColor();
    }

    static get neutralVariantPaletteKeyColor(): DynamicColor {
        return core.neutralVariantPaletteKeyColor();
    }

    static get errorPaletteKeyColor(): DynamicColor {
        return core.errorPaletteKeyColor();
    }

    static get background(): DynamicColor {
        return core.background();
    }

    static get onBackground(): DynamicColor {
        return core.onBackground();
    }

    static get surface(): DynamicColor {
        return core.surface();
    }

    static get surfaceDim(): DynamicColor {
        return core.surfaceDim();
    }

    static get surfaceBright(): DynamicColor {
        return core.surfaceBright();
    }

    static get surfaceContainerLowest(): DynamicColor {
        return core.surfaceContainerLowest();
    }

    static get surfaceContainerLow(): DynamicColor {
        return core.surfaceContainerLow();
    }

    static get surfaceContainer(): DynamicColor {
        return core.surfaceContainer();
    }

    static get surfaceContainerHigh(): DynamicColor {
        return core.surfaceContainerHigh();
    }

    static get surfaceContainerHighest(): DynamicColor {
        return core.surfaceContainerHighest();
    }

    static get onSurface(): DynamicColor {
        return core.onSurface();
    }

    static get surfaceVariant(): DynamicColor {
        return core.surfaceVariant();
    }

    static get onSurfaceVariant(): DynamicColor {
        return core.onSurfaceVariant();
    }

    static get primary(): DynamicColor {
        return core.primary();
    }

    /** Spec 2025+ ; undefined en 2021 */
    static get primaryDim(): DynamicColor | undefined {
        return core.primaryDim();
    }

    static get onPrimary(): DynamicColor {
        return core.onPrimary();
    }

    static get primaryContainer(): DynamicColor {
        return core.primaryContainer();
    }

    static get onPrimaryContainer(): DynamicColor {
        return core.onPrimaryContainer();
    }

    static get inversePrimary(): DynamicColor {
        return core.inversePrimary();
    }

    static get secondary(): DynamicColor {
        return core.secondary();
    }

    /** Spec 2025+ ; undefined en 2021 */
    static get secondaryDim(): DynamicColor | undefined {
        return core.secondaryDim();
    }

    static get onSecondary(): DynamicColor {
        return core.onSecondary();
    }

    static get secondaryContainer(): DynamicColor {
        return core.secondaryContainer();
    }

    static get onSecondaryContainer(): DynamicColor {
        return core.onSecondaryContainer();
    }

    static get tertiary(): DynamicColor {
        return core.tertiary();
    }

    /** Spec 2025+ ; undefined en 2021 */
    static get tertiaryDim(): DynamicColor | undefined {
        return core.tertiaryDim();
    }

    static get onTertiary(): DynamicColor {
        return core.onTertiary();
    }

    static get tertiaryContainer(): DynamicColor {
        return core.tertiaryContainer();
    }

    static get onTertiaryContainer(): DynamicColor {
        return core.onTertiaryContainer();
    }

    static get error(): DynamicColor {
        return core.error();
    }

    /** Spec 2025+ ; undefined en 2021 */
    static get errorDim(): DynamicColor | undefined {
        return core.errorDim();
    }

    static get onError(): DynamicColor {
        return core.onError();
    }

    static get errorContainer(): DynamicColor {
        return core.errorContainer();
    }

    static get onErrorContainer(): DynamicColor {
        return core.onErrorContainer();
    }

    static get outline(): DynamicColor {
        return core.outline();
    }

    static get outlineVariant(): DynamicColor {
        return core.outlineVariant();
    }

    static get inverseSurface(): DynamicColor {
        return core.inverseSurface();
    }

    static get inverseOnSurface(): DynamicColor {
        return core.inverseOnSurface();
    }

    static get shadow(): DynamicColor {
        return core.shadow();
    }

    static get scrim(): DynamicColor {
        return core.scrim();
    }

    static get surfaceTint(): DynamicColor {
        return core.surfaceTint();
    }

    static get primaryFixed(): DynamicColor {
        return core.primaryFixed();
    }

    static get primaryFixedDim(): DynamicColor {
        return core.primaryFixedDim();
    }

    static get onPrimaryFixed(): DynamicColor {
        return core.onPrimaryFixed();
    }

    static get onPrimaryFixedVariant(): DynamicColor {
        return core.onPrimaryFixedVariant();
    }

    static get secondaryFixed(): DynamicColor {
        return core.secondaryFixed();
    }

    static get secondaryFixedDim(): DynamicColor {
        return core.secondaryFixedDim();
    }

    static get onSecondaryFixed(): DynamicColor {
        return core.onSecondaryFixed();
    }

    static get onSecondaryFixedVariant(): DynamicColor {
        return core.onSecondaryFixedVariant();
    }

    static get tertiaryFixed(): DynamicColor {
        return core.tertiaryFixed();
    }

    static get tertiaryFixedDim(): DynamicColor {
        return core.tertiaryFixedDim();
    }

    static get onTertiaryFixed(): DynamicColor {
        return core.onTertiaryFixed();
    }

    static get onTertiaryFixedVariant(): DynamicColor {
        return core.onTertiaryFixedVariant();
    }
}
