/**
 * @fileoverview Utilitaires de manipulation de couleurs
 * @description Fonctions pour convertir, éclaircir, assombrir et manipuler les couleurs
 * @author K3UI Team
 * @version 1.0.0
 */

/**
 * Interface pour représenter une couleur RGB
 */
export interface RGB {
    r: number;
    g: number;
    b: number;
}

/**
 * Convertit une couleur hexadécimale en RGB
 * @param hex - Couleur hexadécimale (ex: #FF6384 ou FF6384)
 * @returns Objet avec r, g, b ou null si la conversion échoue
 * @example
 * ```typescript
 * const rgb = hexToRgb('#FF6384');
 * // { r: 255, g: 99, b: 132 }
 * ```
 */
export function hexToRgb(hex: string): RGB | null {
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
 * Convertit une couleur RGB en hexadécimal
 * @param r - Composante rouge (0-255)
 * @param g - Composante verte (0-255)
 * @param b - Composante bleue (0-255)
 * @returns Couleur hexadécimale (ex: #FF6384)
 * @example
 * ```typescript
 * const hex = rgbToHex(255, 99, 132);
 * // '#FF6384'
 * ```
 */
export function rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number): string => {
        const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Éclaircit une couleur hexadécimale
 * @param color - Couleur hexadécimale (ex: #FF6384)
 * @param percent - Pourcentage d'éclaircissement (0-100)
 * @returns Couleur hexadécimale éclaircie
 * @example
 * ```typescript
 * const lighter = lightenColor('#FF6384', 20);
 * // '#FF8FA8' (environ 20% plus clair)
 * ```
 */
export function lightenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = ((num >> 8) & 0x00ff) + amt;
    const B = (num & 0x0000ff) + amt;
    return (
        '#' +
        (
            0x1000000 +
            (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
            (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
            (B < 255 ? (B < 1 ? 0 : B) : 255)
        )
            .toString(16)
            .slice(1)
    );
}

/**
 * Assombrit une couleur hexadécimale
 * @param color - Couleur hexadécimale (ex: #FF6384)
 * @param percent - Pourcentage d'assombrissement (0-100)
 * @returns Couleur hexadécimale assombrie
 * @example
 * ```typescript
 * const darker = darkenColor('#FF6384', 20);
 * // '#CC4F6A' (environ 20% plus sombre)
 * ```
 */
export function darkenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = ((num >> 8) & 0x00ff) - amt;
    const B = (num & 0x0000ff) - amt;
    return (
        '#' +
        (
            0x1000000 +
            (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
            (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
            (B > 255 ? 255 : B < 0 ? 0 : B)
        )
            .toString(16)
            .slice(1)
    );
}

/**
 * Convertit une couleur hexadécimale en RGBA
 * @param hex - Couleur hexadécimale (ex: #FF6384)
 * @param alpha - Opacité (0-1)
 * @returns Couleur RGBA (ex: rgba(255, 99, 132, 0.5))
 * @example
 * ```typescript
 * const rgba = hexToRgba('#FF6384', 0.5);
 * // 'rgba(255, 99, 132, 0.5)'
 * ```
 */
export function hexToRgba(hex: string, alpha: number): string {
    const rgb = hexToRgb(hex);
    if (!rgb) return `rgba(0, 0, 0, ${alpha})`;
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

/**
 * Ajuste l'opacité d'une couleur hexadécimale en ajoutant l'opacité à la fin
 * @param hex - Couleur hexadécimale (ex: #FF6384)
 * @param alpha - Opacité en hexadécimal (00-FF) ou en pourcentage (0-100)
 * @returns Couleur hexadécimale avec opacité (ex: #FF638480)
 * @example
 * ```typescript
 * const withOpacity = adjustOpacity('#FF6384', '80');
 * // '#FF638480'
 * ```
 */
export function adjustOpacity(hex: string, alpha: string | number): string {
    if (typeof alpha === 'number') {
        // Convertir le pourcentage en hexadécimal
        const hexAlpha = Math.round((alpha / 100) * 255)
            .toString(16)
            .padStart(2, '0');
        return hex + hexAlpha;
    }
    return hex + alpha;
}

