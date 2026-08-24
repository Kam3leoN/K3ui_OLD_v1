/**
 * Tests golden pour la génération de tokens Material Dynamic Color
 * @description Référence seed #6750A4, SchemeTonalSpot, spec 2021 (golden historique)
 */

import {
    Hct,
    SchemeTonalSpot,
    MaterialDynamicColors,
    createScheme,
    buildStateTokens,
    buildK3uiExtensionTokens,
} from '../../../src/utils/color';
import type { DynamicColor, DynamicScheme } from '@material/material-color-utilities';
import type { ContrastLevel } from '../../../src/utils/color/contrast';

const SEED = '#6750A4';

/** Convertit ARGB en hex lowercase (#rrggbb) */
function argbToHex(argb: number): string {
    const rgb = argb & 0xffffff;
    return `#${rgb.toString(16).padStart(6, '0').toLowerCase()}`;
}

/** Extrait les hex d'une liste de tokens DynamicColor */
function resolveTokens(
    scheme: DynamicScheme,
    entries: ReadonlyArray<readonly [string, DynamicColor]>
): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [key, color] of entries) {
        out[key] = argbToHex(color.getArgb(scheme));
    }
    return out;
}

const CORE_TOKENS: ReadonlyArray<readonly [string, DynamicColor]> = [
    ['primary', MaterialDynamicColors.primary],
    ['on-primary', MaterialDynamicColors.onPrimary],
    ['primary-container', MaterialDynamicColors.primaryContainer],
    ['on-primary-container', MaterialDynamicColors.onPrimaryContainer],
    ['secondary', MaterialDynamicColors.secondary],
    ['on-secondary', MaterialDynamicColors.onSecondary],
    ['tertiary', MaterialDynamicColors.tertiary],
    ['surface', MaterialDynamicColors.surface],
    ['surface-container', MaterialDynamicColors.surfaceContainer],
    ['surface-container-high', MaterialDynamicColors.surfaceContainerHigh],
    ['on-surface', MaterialDynamicColors.onSurface],
    ['on-surface-variant', MaterialDynamicColors.onSurfaceVariant],
    ['outline', MaterialDynamicColors.outline],
    ['outline-variant', MaterialDynamicColors.outlineVariant],
    ['error', MaterialDynamicColors.error],
    ['on-error', MaterialDynamicColors.onError],
    ['background', MaterialDynamicColors.background],
    ['inverse-primary', MaterialDynamicColors.inversePrimary],
];

/** Valeurs golden — spec 2021 explicite, seed #6750A4 */
const GOLDEN_LIGHT_CONTRAST_0: Record<string, string> = {
    primary: '#65558f',
    'on-primary': '#ffffff',
    'primary-container': '#e9ddff',
    'on-primary-container': '#4d3d75',
    secondary: '#625b71',
    'on-secondary': '#ffffff',
    tertiary: '#7e5260',
    surface: '#fdf7ff',
    'surface-container': '#f2ecf4',
    'surface-container-high': '#ece6ee',
    'on-surface': '#1d1b20',
    'on-surface-variant': '#49454e',
    outline: '#7a757f',
    'outline-variant': '#cac4cf',
    error: '#ba1a1a',
    'on-error': '#ffffff',
    background: '#fdf7ff',
    'inverse-primary': '#cfbdfe',
};

const GOLDEN_DARK_CONTRAST_0: Record<string, string> = {
    primary: '#cfbdfe',
    'on-primary': '#36275d',
    'primary-container': '#4d3d75',
    'on-primary-container': '#e9ddff',
    secondary: '#cbc2db',
    'on-secondary': '#332d41',
    tertiary: '#efb8c8',
    surface: '#141218',
    'surface-container': '#211f24',
    'surface-container-high': '#2b292f',
    'on-surface': '#e6e0e9',
    'on-surface-variant': '#cac4cf',
    outline: '#948f99',
    'outline-variant': '#49454e',
    error: '#ffb4ab',
    'on-error': '#690005',
    background: '#141218',
    'inverse-primary': '#65558f',
};

function createSchemeLegacy(isDark: boolean, contrastLevel: ContrastLevel): DynamicScheme {
    const sourceHct = Hct.fromHex(SEED);
    return new SchemeTonalSpot(sourceHct, isDark, contrastLevel);
}

describe('Dynamic color golden (SchemeTonalSpot, #6750A4)', () => {
    test('Hct.fromHex / from exposent toHex (façade K3UI)', () => {
        expect(Hct.fromHex(SEED).toHex()).toBe('#6750A4');
        expect(Hct.from(200, 50, 40).toHex()).toMatch(/^#[0-9A-F]{6}$/);
    });

    test('light / contrast 0 — tokens core', () => {
        const scheme = createSchemeLegacy(false, 0);
        const resolved = resolveTokens(scheme, CORE_TOKENS);
        expect(resolved).toEqual(GOLDEN_LIGHT_CONTRAST_0);
    });

    test('dark / contrast 0 — tokens core', () => {
        const scheme = createSchemeLegacy(true, 0);
        const resolved = resolveTokens(scheme, CORE_TOKENS);
        expect(resolved).toEqual(GOLDEN_DARK_CONTRAST_0);
    });

    test('light / contrast -1 — primary plus clair que contrast 0', () => {
        const low = createSchemeLegacy(false, -1);
        const std = createSchemeLegacy(false, 0);
        const lowPrimary = MaterialDynamicColors.primary.getArgb(low);
        const stdPrimary = MaterialDynamicColors.primary.getArgb(std);
        expect(lowPrimary).not.toBe(stdPrimary);
    });

    test('light / contrast 1 — on-surface plus contrasté que contrast 0', () => {
        const high = createSchemeLegacy(false, 1);
        const std = createSchemeLegacy(false, 0);
        const highOnSurface = MaterialDynamicColors.onSurface.getArgb(high);
        const stdOnSurface = MaterialDynamicColors.onSurface.getArgb(std);
        expect(highOnSurface).not.toBe(stdOnSurface);
    });

    test('primary light est dérivé de la couleur seed (tonal spot)', () => {
        const scheme = createSchemeLegacy(false, 0);
        expect(argbToHex(MaterialDynamicColors.primary.getArgb(scheme))).toBe('#65558f');
    });
});

describe('Dynamic color spec 2025 (#6750A4)', () => {
    test('light / contrast 0 — primary-dim et error-dim définis', () => {
        const sourceHct = Hct.fromHex(SEED);
        const scheme = createScheme(sourceHct, { specVersion: '2025', isDark: false, contrastLevel: 0 });
        const primaryDim = MaterialDynamicColors.primaryDim;
        const errorDim = MaterialDynamicColors.errorDim;
        expect(primaryDim).toBeDefined();
        expect(errorDim).toBeDefined();
        expect(argbToHex(primaryDim!.getArgb(scheme))).toBe('#594b7c');
        expect(argbToHex(errorDim!.getArgb(scheme))).toBe('#6b0221');
    });
});

describe('State tokens K3UI (#6750A4)', () => {
    test('light — primary-hover et primary-pressed', () => {
        const sourceHct = Hct.fromHex(SEED);
        const scheme = createScheme(sourceHct, { isDark: false, contrastLevel: 0, specVersion: '2021' });
        const tokens = Object.fromEntries(buildStateTokens(scheme).map((t) => [t.key, t.hex.toLowerCase()]));
        expect(tokens['primary-hover']).toBe('#5b4c84');
        expect(tokens['primary-pressed']).toBe('#51427a');
    });

    test('light — tertiary-hover et tertiary-pressed', () => {
        const sourceHct = Hct.fromHex(SEED);
        const scheme = createScheme(sourceHct, { isDark: false, contrastLevel: 0, specVersion: '2021' });
        const tokens = Object.fromEntries(buildStateTokens(scheme).map((t) => [t.key, t.hex.toLowerCase()]));
        expect(tokens['tertiary-hover']).toBe('#734856');
        expect(tokens['tertiary-pressed']).toBe('#683f4d');
    });
});

describe('Extension tokens K3UI dim', () => {
    test('light — warning/success/info dim', () => {
        const tokens = Object.fromEntries(
            buildK3uiExtensionTokens(false).map((t) => [t.key, t.hex])
        );
        expect(tokens['warning-dim']).toBe('#6B3D00');
        expect(tokens['success-dim']).toBe('#005211');
        expect(tokens['info-dim']).toBe('#004875');
    });
});
