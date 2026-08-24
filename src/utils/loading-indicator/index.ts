/**
 * @fileoverview Utilitaires pour LoadingIndicator (morph, dimensions).
 * @author K3UI Team
 */

export * from './morph';
export * from './shape-paths';
export * from './animator';

import { LOADING_INDICATOR_SIZE_MIN, LOADING_INDICATOR_SIZE_MAX } from '../../specs/components/loader.specs';

/** Taille par défaut du loader plein écran (M3 48dp). */
export const LOADING_INDICATOR_PAGE_LOADER_SIZE = 48;

/**
 * Calcule la taille effective du page loader (options fusionnées, bornes M3 24–240 dp).
 * Utilisé dans injectPageLoader pour appliquer la bonne taille dès la première frame et éviter un premier rendu à 48px puis un second à la taille réelle.
 */
export function getPageLoaderSize(options?: { size?: number } | null): number {
    const size = options?.size ?? LOADING_INDICATOR_PAGE_LOADER_SIZE;
    return Math.max(LOADING_INDICATOR_SIZE_MIN, Math.min(LOADING_INDICATOR_SIZE_MAX, size));
}

/**
 * Applique la taille (px) sur un élément .loading-indicator pour éviter un rendu "tout petit" avant l'init du composant.
 * À appeler dès la création de l'élément (inject page loader) ou au début du constructeur du composant.
 */
export function applyLoadingIndicatorSize(el: HTMLElement, sizePx: number): void {
    el.style.width = `${sizePx}px`;
    el.style.height = `${sizePx}px`;
}
