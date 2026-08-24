/**
 * @fileoverview Utilitaires Sheet (M3 Expressive) — positions verticales et détentes.
 * Sheet = top / bottom uniquement. Pour left / right, utiliser Drawer.
 */

/** Positions Sheet supportées */
export const SHEET_POSITIONS = ['top', 'bottom'] as const;

/** Type de position Sheet */
export type SheetPosition = (typeof SHEET_POSITIONS)[number];

/** Tailles Sheet supportées */
export const SHEET_SIZES = ['small', 'medium', 'large', 'half', 'full'] as const;

/** Type de taille Sheet */
export type SheetSize = (typeof SHEET_SIZES)[number];

/** Index de détente vertical par taille (peek / half / ~75% / full) */
export const SHEET_VERTICAL_SIZE_DETENT: Record<SheetSize, 'peek' | 'half' | 'large' | 'full'> = {
    small: 'peek',
    medium: 'half',
    large: 'large',
    half: 'half',
    full: 'full',
};

/**
 * Vérifie qu'une valeur est une position Sheet valide (top / bottom).
 * @param value - Valeur à tester
 */
export function isSheetPosition(value: unknown): value is SheetPosition {
    return value === 'top' || value === 'bottom';
}

/**
 * Résout la position : classe CSS > option explicite > défaut bottom.
 * Les anciennes classes latérales (`sheet--left` / `sheet--right`) sont ignorées.
 * @param el - Élément sheet
 * @param explicit - Position passée à l'init
 */
export function resolveSheetPosition(
    el: HTMLElement,
    explicit?: string | null
): SheetPosition {
    if (el.classList.contains('sheet--top')) {
        return 'top';
    }
    if (el.classList.contains('sheet--bottom')) {
        return 'bottom';
    }
    if (isSheetPosition(explicit)) {
        return explicit;
    }
    return 'bottom';
}

/**
 * Vérifie qu'une valeur est une taille Sheet valide.
 * @param value - Valeur à tester
 */
export function isSheetSize(value: unknown): value is SheetSize {
    return typeof value === 'string' && (SHEET_SIZES as readonly string[]).includes(value);
}

/**
 * Détecte la taille depuis les classes CSS `sheet--{size}`.
 * @param el - Élément sheet
 */
export function detectSheetSizeFromElement(el: HTMLElement): SheetSize | null {
    for (const size of SHEET_SIZES) {
        if (el.classList.contains(`sheet--${size}`)) {
            return size;
        }
    }
    return null;
}

/**
 * Résout la taille : option explicite > attribut HTML > classes CSS > défaut medium.
 * @param el - Élément sheet
 * @param explicitSize - Taille passée à l'init (undefined si non fournie)
 */
export function resolveSheetSize(el: HTMLElement, explicitSize?: SheetSize | null): SheetSize {
    if (explicitSize && isSheetSize(explicitSize)) {
        return explicitSize;
    }
    const attr = el.getAttribute('size');
    if (isSheetSize(attr)) {
        return attr;
    }
    const fromClass = detectSheetSizeFromElement(el);
    if (fromClass) {
        return fromClass;
    }
    return 'medium';
}

/**
 * Retire les styles inline de hauteur (bottom/top) après fermeture.
 * @param el - Élément sheet
 */
export function clearSheetVerticalInlineSize(el: HTMLElement): void {
    el.style.removeProperty('height');
    el.style.removeProperty('max-height');
    el.style.removeProperty('min-height');
    const container = el.querySelector('.sheet-container') as HTMLElement | null;
    if (container) {
        container.style.removeProperty('height');
        container.style.removeProperty('max-height');
        container.style.removeProperty('overflow-y');
    }
}

/**
 * Calcule la hauteur initiale bottom/top selon la taille M3.
 * @param size - Taille sheet
 * @param detents - Hauteurs [peek, half, full]
 * @param minHeight - Hauteur minimale (120dp)
 */
export function sheetInitialVerticalHeight(
    size: SheetSize,
    detents: [number, number, number],
    minHeight = 120
): number {
    const [peek, half, full] = detents;
    const detent = SHEET_VERTICAL_SIZE_DETENT[size];
    switch (detent) {
        case 'peek':
            return Math.max(minHeight, peek);
        case 'half':
            return Math.max(minHeight, half);
        case 'large':
            return Math.max(minHeight, Math.round(half + (full - half) * 0.75));
        case 'full':
        default:
            return Math.max(minHeight, full);
    }
}
