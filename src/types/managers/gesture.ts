/**
 * @fileoverview Types pour GestureManager (Pointer Events unifiés)
 * @description Pan / swipe / velocity pour interactions type SwipeDeck
 */

import type { SwipeDirection } from '../base/dom';

/** Snapshot d’un pan en cours */
export interface GesturePanDetail {
    /** Delta X depuis le début (px) */
    dx: number;
    /** Delta Y depuis le début (px) */
    dy: number;
    /** Position client X */
    x: number;
    /** Position client Y */
    y: number;
    /** Durée depuis pointerdown (ms) */
    duration: number;
    /** Vélocité X (px/ms) */
    velocityX: number;
    /** Vélocité Y (px/ms) */
    velocityY: number;
    /** Angle approximatif en degrés (−180…180, 0 = droite) */
    angle: number;
    /** Événement pointer source */
    event: PointerEvent;
}

export interface GestureOptions {
    /** Élément cible */
    target?: HTMLElement | Document;
    /** Activer le gestionnaire */
    enabled?: boolean;
    /** Capture pointer events */
    capture?: boolean;
    /** Seuil de mouvement (px) avant de considérer un pan actif */
    panThreshold?: number;
    /** Seuil de distance (px) pour déclencher onSwipe */
    swipeThreshold?: number;
    /** Vélocité minimale (px/ms) pour un swipe rapide */
    swipeVelocity?: number;
    /** Empêcher le scroll / sélection pendant le pan */
    preventDefault?: boolean;
}

export interface GestureCallbacks {
    /** Début de pointeur */
    onPointerDown?: ((event: PointerEvent, x: number, y: number) => void) | null;
    /** Pan en cours (après panThreshold) */
    onPan?: ((detail: GesturePanDetail) => void) | null;
    /** Fin de pan (release) */
    onPanEnd?: ((detail: GesturePanDetail) => void) | null;
    /** Swipe directionnel détecté */
    onSwipe?: ((direction: SwipeDirection, detail: GesturePanDetail) => void) | null;
    /** Annulation (pointercancel) */
    onCancel?: ((event: PointerEvent) => void) | null;
}

export type { SwipeDirection };
