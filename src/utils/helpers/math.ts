/**
 * @fileoverview Utilitaires mathématiques
 * @description Fonctions pour les calculs mathématiques, trigonométriques et géométriques
 * @author K3UI Team
 * @version 1.0.0
 */

/**
 * Interface pour représenter un point 2D
 */
export interface Point2D {
    x: number;
    y: number;
}

/**
 * Normalise un angle pour qu'il soit dans la plage [0, 2π]
 * @param angle - Angle en radians
 * @returns Angle normalisé dans [0, 2π]
 * @example
 * ```typescript
 * const normalized = normalizeAngle(-Math.PI / 2);
 * // 3 * Math.PI / 2
 * ```
 */
export function normalizeAngle(angle: number): number {
    let normalized = angle;
    while (normalized < 0) normalized += Math.PI * 2;
    while (normalized >= Math.PI * 2) normalized -= Math.PI * 2;
    return normalized;
}

/**
 * Convertit un angle et un rayon en coordonnées cartésiennes
 * @param angle - Angle en radians
 * @param radius - Rayon (distance depuis le centre)
 * @param centerX - Coordonnée X du centre (défaut: 0)
 * @param centerY - Coordonnée Y du centre (défaut: 0)
 * @returns Point 2D avec les coordonnées calculées
 * @example
 * ```typescript
 * const point = angleToPoint(Math.PI / 4, 100, 200, 200);
 * // { x: 270.71..., y: 270.71... }
 * ```
 */
export function angleToPoint(
    angle: number,
    radius: number,
    centerX: number = 0,
    centerY: number = 0
): Point2D {
    return {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
    };
}

/**
 * Convertit des coordonnées cartésiennes en angle (en radians)
 * @param x - Coordonnée X
 * @param y - Coordonnée Y
 * @param centerX - Coordonnée X du centre (défaut: 0)
 * @param centerY - Coordonnée Y du centre (défaut: 0)
 * @returns Angle en radians
 * @example
 * ```typescript
 * const angle = pointToAngle(100, 100, 0, 0);
 * // Math.PI / 4
 * ```
 */
export function pointToAngle(
    x: number,
    y: number,
    centerX: number = 0,
    centerY: number = 0
): number {
    return Math.atan2(y - centerY, x - centerX);
}

/**
 * Calcule la distance entre deux points
 * @param x1 - Coordonnée X du premier point
 * @param y1 - Coordonnée Y du premier point
 * @param x2 - Coordonnée X du deuxième point
 * @param y2 - Coordonnée Y du deuxième point
 * @returns Distance entre les deux points
 * @example
 * ```typescript
 * const distance = calculateDistance(0, 0, 3, 4);
 * // 5
 * ```
 */
export function calculateDistance(
    x1: number,
    y1: number,
    x2: number,
    y2: number
): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calcule la distance entre deux points 2D
 * @param point1 - Premier point
 * @param point2 - Deuxième point
 * @returns Distance entre les deux points
 * @example
 * ```typescript
 * const distance = calculateDistance2D({ x: 0, y: 0 }, { x: 3, y: 4 });
 * // 5
 * ```
 */
export function calculateDistance2D(point1: Point2D, point2: Point2D): number {
    return calculateDistance(point1.x, point1.y, point2.x, point2.y);
}

/**
 * Interpole linéairement entre deux valeurs
 * @param start - Valeur de départ
 * @param end - Valeur de fin
 * @param progress - Progrès de l'interpolation (0-1)
 * @returns Valeur interpolée
 * @example
 * ```typescript
 * const value = lerp(0, 100, 0.5);
 * // 50
 * ```
 */
export function lerp(start: number, end: number, progress: number): number {
    return start + (end - start) * progress;
}

/**
 * Applique une fonction d'easing cubic ease-out
 * @param progress - Progrès de l'animation (0-1)
 * @returns Progrès avec easing appliqué
 * @example
 * ```typescript
 * const eased = easeOutCubic(0.5);
 * // 0.875
 * ```
 */
export function easeOutCubic(progress: number): number {
    return 1 - Math.pow(1 - progress, 3);
}

/**
 * Applique une fonction d'easing cubic ease-in
 * @param progress - Progrès de l'animation (0-1)
 * @returns Progrès avec easing appliqué
 * @example
 * ```typescript
 * const eased = easeInCubic(0.5);
 * // 0.125
 * ```
 */
export function easeInCubic(progress: number): number {
    return Math.pow(progress, 3);
}

/**
 * Applique une fonction d'easing cubic ease-in-out
 * @param progress - Progrès de l'animation (0-1)
 * @returns Progrès avec easing appliqué
 * @example
 * ```typescript
 * const eased = easeInOutCubic(0.5);
 * // 0.5
 * ```
 */
export function easeInOutCubic(progress: number): number {
    return progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
}

/**
 * Contraint une valeur entre un minimum et un maximum
 * @param value - Valeur à contraindre
 * @param min - Valeur minimale
 * @param max - Valeur maximale
 * @returns Valeur contrainte
 * @example
 * ```typescript
 * const clamped = clamp(150, 0, 100);
 * // 100
 * ```
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

