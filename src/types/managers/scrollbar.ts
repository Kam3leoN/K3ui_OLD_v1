/**
 * @fileoverview Types pour ScrollbarManager
 * @description Scrollbar custom (rail + thumb) synchronisée sur un conteneur scrollable
 */

import type { CustomScrollbarOptions } from '../../utils/dom/customScrollbar';

/** Mode de géométrie du rail par rapport au host */
export type ScrollbarGeometryMode = 'none' | 'scroll-bounds';

/** Placement du rail : externe (gutter), interne, ou auto (externe puis bascule si clip viewport). */
export type ScrollbarPlacement = 'auto' | 'external' | 'internal';

/**
 * Options de liaison d'une scrollbar custom K3UI.
 */
export interface ScrollbarBindOptions extends CustomScrollbarOptions {
    /** Conteneur scrollable (overflow auto/scroll). */
    scroll: HTMLElement;
    /** Host recevant le rail (ex. `.dialog`, `.navigation-rail-stack`). */
    railHost?: HTMLElement;
    /**
     * Élément de référence pour `scroll-bounds` (défaut : `scroll`).
     * Permet d’aligner le rail sur `.dialog-scroller` dans un host plus large.
     */
    geometryTarget?: HTMLElement;
    /** Recalcule top/height du rail sur les bounds du geometryTarget. */
    geometry?: ScrollbarGeometryMode;
    /**
     * Position horizontale du rail.
     * `auto` : externe par défaut, bascule interne si le rail sort du viewport.
     */
    placement?: ScrollbarPlacement;
    /** Marge (px) pour le test de visibilité viewport (défaut : 4). */
    viewportMargin?: number;
    /** Rail existant (sinon créé et appendé au railHost). */
    rail?: HTMLElement;
    /** Classe CSS du rail si création automatique. */
    railClass?: string;
    /** Classe CSS du thumb si création automatique. */
    thumbClass?: string;
    /** Retire le rail du DOM à la destruction (défaut : false). */
    removeRailOnDestroy?: boolean;
    /** Grossit le thumb (et le rail) au survol / drag (défaut : true). */
    enlargeOnInteraction?: boolean;
    /** Facteur d’agrandissement au survol / drag (défaut : 2). */
    enlargeFactor?: number;
    /** Largeur de base du thumb en px (défaut : 5). */
    thumbWidth?: number;
}

/**
 * Handle retourné par ScrollbarManager.bind().
 */
export interface ScrollbarHandle {
    /** Élément rail. */
    rail: HTMLElement;
    /** Élément thumb. */
    thumb: HTMLElement;
    /** Recalcule géométrie (si activée) + position du thumb. */
    refresh: () => void;
    /** Recalcule uniquement le thumb. */
    update: () => void;
    /** Détruit listeners, observers et optionnellement le rail. */
    destroy: () => void;
}
