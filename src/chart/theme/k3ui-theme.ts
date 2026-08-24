/**
 * @fileoverview Thème graphique K3UI
 * @description Mappe les tokens Material You 3 vers la palette du moteur de rendu
 */

/** Palette et styles dérivés des tokens K3UI */
export interface K3uiChartTheme {
    palette: string[];
    textColor: string;
    axisColor: string;
    gridColor: string;
    backgroundColor: string;
    surfaceColor: string;
    tooltipBackground: string;
    tooltipText: string;
    isDark: boolean;
}

/** Palette primaire Chart K3UI (8 couleurs de référence) */
export const CHART_PRIMARY_PALETTE = [
    '#5470c6',
    '#91cc75',
    '#fac858',
    '#ee6666',
    '#73c0de',
    '#3ba272',
    '#fc8452',
    '#9a60b4',
] as const;

/**
 * Résout une palette de couleurs pour un nombre de séries donné.
 * Utilise les 8 couleurs primaires puis génère des teintes distinctes si nécessaire.
 */
export function resolveChartPalette(count: number, base: string[] = [...CHART_PRIMARY_PALETTE]): string[] {
    const safeCount = Math.max(1, count);
    if (safeCount <= base.length) {
        return base.slice(0, safeCount);
    }

    const palette = [...base];
    for (let i = base.length; i < safeCount; i++) {
        const hue = Math.round((i * 137.508) % 360);
        const saturation = 58 + (i % 3) * 7;
        const lightness = 48 + (i % 4) * 4;
        palette.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
    }
    return palette;
}

const DEFAULT_PALETTE = [...CHART_PRIMARY_PALETTE];

/**
 * Lit une variable CSS sur l'élément racine ou un hôte
 * @param name Nom de la variable CSS
 * @param fallback Valeur de repli
 */
function readCssVar(name: string, fallback: string, host?: HTMLElement): string {
    const target = host ?? document.documentElement;
    const value = getComputedStyle(target).getPropertyValue(name).trim();
    return value || fallback;
}

/**
 * Détecte si le thème actif est sombre
 */
export function isDarkTheme(host?: HTMLElement): boolean {
    const root = host ?? document.documentElement;
    const dataTheme = root.getAttribute('data-theme');
    if (dataTheme === 'dark') {
        return true;
    }
    if (dataTheme === 'light') {
        return false;
    }
    return root.classList.contains('theme-dark');
}

/**
 * Résout le thème graphique K3UI depuis les tokens CSS
 * @param host Élément hôte optionnel
 */
export function resolveK3uiTheme(host?: HTMLElement): K3uiChartTheme {
    const dark = isDarkTheme(host);

    return {
        palette: DEFAULT_PALETTE,
        textColor: readCssVar('--md-sys-color-on-surface', dark ? '#E6E0E9' : '#1D1B20', host),
        axisColor: readCssVar('--md-sys-color-on-surface-variant', dark ? '#CAC4D0' : '#49454F', host),
        gridColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        backgroundColor: 'transparent',
        surfaceColor: readCssVar('--md-sys-color-surface', dark ? '#1D1B20' : '#FEF7FF', host),
        tooltipBackground: readCssVar('--md-sys-color-inverse-surface', dark ? '#F5EFF7' : '#313033', host),
        tooltipText: readCssVar('--md-sys-color-inverse-on-surface', dark ? '#313033' : '#F5EFF7', host),
        isDark: dark,
    };
}

/**
 * Résout le mode thème demandé par les options
 * @param mode Mode demandé
 */
export function resolveThemeMode(mode: 'auto' | 'light' | 'dark', host?: HTMLElement): K3uiChartTheme {
    if (mode === 'auto') {
        return resolveK3uiTheme(host);
    }

    const base = resolveK3uiTheme(host);
    const forcedDark = mode === 'dark';

    if (forcedDark === base.isDark) {
        return base;
    }

    return {
        ...base,
        isDark: forcedDark,
        textColor: forcedDark ? '#E6E0E9' : '#1D1B20',
        axisColor: forcedDark ? '#CAC4D0' : '#49454F',
        gridColor: forcedDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        surfaceColor: forcedDark ? '#1D1B20' : '#FEF7FF',
        tooltipBackground: forcedDark ? '#F5EFF7' : '#313033',
        tooltipText: forcedDark ? '#313033' : '#F5EFF7',
    };
}
