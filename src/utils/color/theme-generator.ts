/**
 * @fileoverview Génération des tokens système depuis les palettes
 * @description Reproduit la logique des fonctions SCSS md-sys-color-values-light/dark
 * @internal Usage prévu : génération build / alignement SCSS — pas dans le chemin critique runtime
 * @author K3UI Team
 * @version 1.0.0
 */

import { CorePaletteMap, getToneFromPalette } from './palette';

/**
 * Interface pour les tokens système
 */
export interface SystemColorTokens {
    // Surface colors
    surface: string;
    'surface-dim': string;
    'surface-bright': string;
    'surface-container-lowest': string;
    'surface-container-low': string;
    'surface-container': string;
    'surface-container-high': string;
    'surface-container-highest': string;

    // On-surface colors
    'on-surface': string;
    'on-surface-variant': string;

    // Surface variant
    'surface-variant': string;

    // Background colors
    background: string;
    'on-background': string;

    // Primary colors
    primary: string;
    'on-primary': string;
    'primary-container': string;
    'on-primary-container': string;

    // Secondary colors
    secondary: string;
    'on-secondary': string;
    'secondary-container': string;
    'on-secondary-container': string;

    // Tertiary colors
    tertiary: string;
    'on-tertiary': string;
    'tertiary-container': string;
    'on-tertiary-container': string;

    // Error colors
    error: string;
    'on-error': string;
    'error-container': string;
    'on-error-container': string;

    // Warning colors (K3UI spécifique)
    warning?: string;
    'on-warning'?: string;
    'warning-container'?: string;
    'on-warning-container'?: string;

    // Success colors (K3UI spécifique)
    success?: string;
    'on-success'?: string;
    'success-container'?: string;
    'on-success-container'?: string;

    // Info colors (K3UI spécifique)
    info?: string;
    'on-info'?: string;
    'info-container'?: string;
    'on-info-container'?: string;

    // Outline colors
    outline: string;
    'outline-variant': string;

    // Primary Fixed colors (identiques en light/dark)
    'primary-fixed': string;
    'primary-fixed-dim': string;
    'on-primary-fixed': string;
    'on-primary-fixed-variant': string;

    // Secondary Fixed colors
    'secondary-fixed': string;
    'secondary-fixed-dim': string;
    'on-secondary-fixed': string;
    'on-secondary-fixed-variant': string;

    // Tertiary Fixed colors
    'tertiary-fixed': string;
    'tertiary-fixed-dim': string;
    'on-tertiary-fixed': string;
    'on-tertiary-fixed-variant': string;

    // Inverse colors
    'inverse-surface': string;
    'inverse-on-surface': string;
    'inverse-primary': string;

    // Utility colors
    shadow: string;
    scrim: string;
    'surface-tint': string;
}

/**
 * Options pour la génération de tokens
 */
export interface ThemeGeneratorOptions {
    /**
     * Inclure les tokens K3UI spécifiques (warning, success, info)
     * @default false
     */
    includeK3UITokens?: boolean;
}

/**
 * Génère les tokens système pour le thème clair
 * @param palette - Palette principale générée
 * @param options - Options de génération
 * @returns Tokens système pour le thème clair
 */
export function generateLightThemeTokens(
    palette: CorePaletteMap,
    options: ThemeGeneratorOptions = {}
): SystemColorTokens {
    const tokens: SystemColorTokens = {
        // Surface colors (depuis neutral)
        surface: getToneFromPalette(palette.neutral, 98),
        'surface-dim': getToneFromPalette(palette.neutral, 87),
        'surface-bright': getToneFromPalette(palette.neutral, 98),
        'surface-container-lowest': getToneFromPalette(palette.neutral, 100),
        'surface-container-low': getToneFromPalette(palette.neutral, 96),
        'surface-container': getToneFromPalette(palette.neutral, 94),
        'surface-container-high': getToneFromPalette(palette.neutral, 92),
        'surface-container-highest': getToneFromPalette(palette.neutral, 90),

        // On-surface colors
        'on-surface': getToneFromPalette(palette.neutral, 10),
        'on-surface-variant': getToneFromPalette(palette.neutralVariant, 30),

        // Surface variant
        'surface-variant': getToneFromPalette(palette.neutralVariant, 90),

        // Background colors
        background: getToneFromPalette(palette.neutral, 99),
        'on-background': getToneFromPalette(palette.neutral, 10),

        // Primary colors
        primary: getToneFromPalette(palette.primary, 40),
        'on-primary': getToneFromPalette(palette.primary, 100),
        'primary-container': getToneFromPalette(palette.primary, 90),
        'on-primary-container': getToneFromPalette(palette.primary, 10),

        // Secondary colors
        secondary: getToneFromPalette(palette.secondary, 40),
        'on-secondary': getToneFromPalette(palette.secondary, 100),
        'secondary-container': getToneFromPalette(palette.secondary, 90),
        'on-secondary-container': getToneFromPalette(palette.secondary, 10),

        // Tertiary colors
        tertiary: getToneFromPalette(palette.tertiary, 40),
        'on-tertiary': getToneFromPalette(palette.tertiary, 100),
        'tertiary-container': getToneFromPalette(palette.tertiary, 90),
        'on-tertiary-container': getToneFromPalette(palette.tertiary, 10),

        // Error colors
        error: getToneFromPalette(palette.error, 40),
        'on-error': getToneFromPalette(palette.error, 100),
        'error-container': getToneFromPalette(palette.error, 90),
        'on-error-container': getToneFromPalette(palette.error, 10),

        // Outline colors
        outline: getToneFromPalette(palette.neutralVariant, 50),
        'outline-variant': getToneFromPalette(palette.neutralVariant, 80),

        // Primary Fixed colors (identiques en light/dark)
        'primary-fixed': getToneFromPalette(palette.primary, 90),
        'primary-fixed-dim': getToneFromPalette(palette.primary, 80),
        'on-primary-fixed': getToneFromPalette(palette.primary, 10),
        'on-primary-fixed-variant': getToneFromPalette(palette.primary, 30),

        // Secondary Fixed colors
        'secondary-fixed': getToneFromPalette(palette.secondary, 90),
        'secondary-fixed-dim': getToneFromPalette(palette.secondary, 80),
        'on-secondary-fixed': getToneFromPalette(palette.secondary, 10),
        'on-secondary-fixed-variant': getToneFromPalette(palette.secondary, 30),

        // Tertiary Fixed colors
        'tertiary-fixed': getToneFromPalette(palette.tertiary, 90),
        'tertiary-fixed-dim': getToneFromPalette(palette.tertiary, 80),
        'on-tertiary-fixed': getToneFromPalette(palette.tertiary, 10),
        'on-tertiary-fixed-variant': getToneFromPalette(palette.tertiary, 30),

        // Inverse colors
        'inverse-surface': getToneFromPalette(palette.neutral, 20),
        'inverse-on-surface': getToneFromPalette(palette.neutral, 95),
        'inverse-primary': getToneFromPalette(palette.primary, 80),

        // Utility colors
        shadow: getToneFromPalette(palette.neutral, 0),
        scrim: getToneFromPalette(palette.neutral, 0),
        'surface-tint': getToneFromPalette(palette.primary, 40), // Dérivé de primary
    };

    // Ajouter les tokens K3UI spécifiques si demandé
    if (options.includeK3UITokens) {
        // Note: Ces palettes doivent être générées séparément car elles ne sont pas dans CorePalette
        // Pour l'instant, on les laisse optionnels
        // TODO: Ajouter la génération des palettes warning, success, info
    }

    return tokens;
}

/**
 * Génère les tokens système pour le thème sombre
 * @param palette - Palette principale générée
 * @param options - Options de génération
 * @returns Tokens système pour le thème sombre
 */
export function generateDarkThemeTokens(
    palette: CorePaletteMap,
    options: ThemeGeneratorOptions = {}
): SystemColorTokens {
    const tokens: SystemColorTokens = {
        // Surface colors (depuis neutral)
        surface: getToneFromPalette(palette.neutral, 10),
        'surface-dim': getToneFromPalette(palette.neutral, 0),
        'surface-bright': getToneFromPalette(palette.neutral, 25),
        'surface-container-lowest': getToneFromPalette(palette.neutral, 0),
        'surface-container-low': getToneFromPalette(palette.neutral, 10),
        'surface-container': getToneFromPalette(palette.neutral, 20),
        'surface-container-high': getToneFromPalette(palette.neutral, 25),
        'surface-container-highest': getToneFromPalette(palette.neutral, 30),

        // On-surface colors
        'on-surface': getToneFromPalette(palette.neutral, 90),
        'on-surface-variant': getToneFromPalette(palette.neutralVariant, 80),

        // Surface variant
        'surface-variant': getToneFromPalette(palette.neutralVariant, 30),

        // Background colors
        background: getToneFromPalette(palette.neutral, 10),
        'on-background': getToneFromPalette(palette.neutral, 90),

        // Primary colors
        primary: getToneFromPalette(palette.primary, 80),
        'on-primary': getToneFromPalette(palette.primary, 20),
        'primary-container': getToneFromPalette(palette.primary, 30),
        'on-primary-container': getToneFromPalette(palette.primary, 90),

        // Secondary colors
        secondary: getToneFromPalette(palette.secondary, 80),
        'on-secondary': getToneFromPalette(palette.secondary, 20),
        'secondary-container': getToneFromPalette(palette.secondary, 30),
        'on-secondary-container': getToneFromPalette(palette.secondary, 90),

        // Tertiary colors
        tertiary: getToneFromPalette(palette.tertiary, 80),
        'on-tertiary': getToneFromPalette(palette.tertiary, 20),
        'tertiary-container': getToneFromPalette(palette.tertiary, 30),
        'on-tertiary-container': getToneFromPalette(palette.tertiary, 90),

        // Error colors
        error: getToneFromPalette(palette.error, 80),
        'on-error': getToneFromPalette(palette.error, 20),
        'error-container': getToneFromPalette(palette.error, 30),
        'on-error-container': getToneFromPalette(palette.error, 90),

        // Outline colors
        outline: getToneFromPalette(palette.neutralVariant, 60),
        'outline-variant': getToneFromPalette(palette.neutralVariant, 30),

        // Primary Fixed colors (identiques en light/dark)
        'primary-fixed': getToneFromPalette(palette.primary, 90),
        'primary-fixed-dim': getToneFromPalette(palette.primary, 80),
        'on-primary-fixed': getToneFromPalette(palette.primary, 10),
        'on-primary-fixed-variant': getToneFromPalette(palette.primary, 30),

        // Secondary Fixed colors
        'secondary-fixed': getToneFromPalette(palette.secondary, 90),
        'secondary-fixed-dim': getToneFromPalette(palette.secondary, 80),
        'on-secondary-fixed': getToneFromPalette(palette.secondary, 10),
        'on-secondary-fixed-variant': getToneFromPalette(palette.secondary, 30),

        // Tertiary Fixed colors
        'tertiary-fixed': getToneFromPalette(palette.tertiary, 90),
        'tertiary-fixed-dim': getToneFromPalette(palette.tertiary, 80),
        'on-tertiary-fixed': getToneFromPalette(palette.tertiary, 10),
        'on-tertiary-fixed-variant': getToneFromPalette(palette.tertiary, 30),

        // Inverse colors
        'inverse-surface': getToneFromPalette(palette.neutral, 90),
        'inverse-on-surface': getToneFromPalette(palette.neutral, 20),
        'inverse-primary': getToneFromPalette(palette.primary, 40),

        // Utility colors
        shadow: getToneFromPalette(palette.neutral, 0),
        scrim: getToneFromPalette(palette.neutral, 0),
        'surface-tint': getToneFromPalette(palette.primary, 80), // Dérivé de primary
    };

    // Ajouter les tokens K3UI spécifiques si demandé
    if (options.includeK3UITokens) {
        // Note: Ces palettes doivent être générées séparément car elles ne sont pas dans CorePalette
        // Pour l'instant, on les laisse optionnels
        // TODO: Ajouter la génération des palettes warning, success, info
    }

    return tokens;
}

/**
 * Convertit les tokens système en CSS custom properties
 * @param tokens - Tokens système
 * @param prefix - Préfixe pour les variables CSS (défaut: '--md-sys-color')
 * @returns Objet avec les propriétés CSS à appliquer
 */
export function tokensToCSSProperties(
    tokens: SystemColorTokens,
    prefix: string = '--md-sys-color'
): Record<string, string> {
    const properties: Record<string, string> = {};

    for (const [key, value] of Object.entries(tokens)) {
        if (value) {
            // Convertir 'on-primary' en '--md-sys-color-on-primary'
            const cssKey = `${prefix}-${key.replace(/_/g, '-')}`;
            properties[cssKey] = value;

            // Ajouter aussi la version RGB
            const rgb = hexToRgb(value);
            if (rgb) {
                properties[`${cssKey}-rgb`] = `${rgb.r}, ${rgb.g}, ${rgb.b}`;
            }
        }
    }

    return properties;
}

/**
 * Convertit une couleur hex en RGB
 * @param hex - Couleur hexadécimale
 * @returns Objet RGB ou null
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        }
        : null;
}

/**
 * Applique les tokens système au document via CSS custom properties
 * @param tokens - Tokens système
 * @param prefix - Préfixe pour les variables CSS (défaut: '--md-sys-color')
 * @param target - Élément cible (défaut: document.documentElement)
 */
export function applyTokensToDocument(
    tokens: SystemColorTokens,
    prefix: string = '--md-sys-color',
    target: HTMLElement = document.documentElement
): void {
    const properties = tokensToCSSProperties(tokens, prefix);

    for (const [key, value] of Object.entries(properties)) {
        target.style.setProperty(key, value);
    }
}

