/**
 * @fileoverview Classes de fenêtre Material 3 (breakpoints Compose)
 */

export type WindowSizeClass = 'compact' | 'medium' | 'expanded' | 'large' | 'extra-large';

export const WINDOW_BREAKPOINTS: Record<Exclude<WindowSizeClass, 'compact'>, number> = {
    medium: 600,
    expanded: 840,
    large: 1200,
    'extra-large': 1600,
};

/**
 * Retourne la classe de fenêtre M3 pour une largeur donnée.
 * @param width - Largeur viewport en px
 */
export function windowSizeClass(width: number = typeof window !== 'undefined' ? window.innerWidth : 840): WindowSizeClass {
    if (width < WINDOW_BREAKPOINTS.medium) return 'compact';
    if (width < WINDOW_BREAKPOINTS.expanded) return 'medium';
    if (width < WINDOW_BREAKPOINTS.large) return 'expanded';
    if (width < WINDOW_BREAKPOINTS['extra-large']) return 'large';
    return 'extra-large';
}
