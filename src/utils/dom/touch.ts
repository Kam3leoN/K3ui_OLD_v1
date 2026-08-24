/**
 * @fileoverview Module de gestion tactile pour K3UI
 * @description Gestion des événements tactiles, swipes, pinch et rotation
 * @author K3UI Team
 * @version 1.0.0
 */

import { TouchOptions, TouchCallbacks, SwipeDirection, Position } from '../../types/base/dom';

// ============================================================================
// DÉTECTION TACTILE
// ============================================================================

/**
 * Détecte si l'appareil supporte les événements tactiles
 */
function isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// ============================================================================
// INTERFACES INTERNES
// ============================================================================

interface TouchPoint {
    id: number;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    startTime: number;
}

interface TouchState {
    touches: Map<number, TouchPoint>;
    isMultiTouch: boolean;
    lastTapTime: number;
    tapCount: number;
    longTapTimer?: number;
    swipeStartTime: number;
    swipeStartX: number;
    swipeStartY: number;
}

interface SwipeData {
    direction: SwipeDirection;
    distance: number;
    velocity: number;
    duration: number;
}

// ============================================================================
// CLASSE TOUCH
// ============================================================================

/**
 * Gestionnaire d'événements tactiles unifié
 */
export class Touch {
    private _target: HTMLElement | Document;
    private _enabled: boolean;
    private _capture: boolean;
    private _swipeThreshold: number;
    private _swipeTimeout: number;
    private _longTapDelay: number;
    private _tapThreshold: number;

    private _state: TouchState = {
        touches: new Map(),
        isMultiTouch: false,
        lastTapTime: 0,
        tapCount: 0,
        swipeStartTime: 0,
        swipeStartX: 0,
        swipeStartY: 0
    };

    private _callbacks: TouchCallbacks;

    constructor(options: TouchOptions & TouchCallbacks = {}) {
        this._target = options.target || document;
        this._enabled = options.enabled ?? true;
        this._capture = options.capture ?? false;
        this._swipeThreshold = options.swipeThreshold ?? 50;
        this._swipeTimeout = options.swipeTimeout ?? 500;
        this._longTapDelay = options.longTapDelay ?? 500;
        this._tapThreshold = options.tapThreshold ?? 10;

        this._callbacks = {
            onTap: options.onTap || null,
            onDoubleTap: options.onDoubleTap || null,
            onLongTap: options.onLongTap || null,
            onSwipe: options.onSwipe || null,
            onPinch: options.onPinch || null,
            onRotate: options.onRotate || null
        };

        if (this._enabled) {
            this.attachEvents();
        }
    }

    /**
     * Attache les événements tactiles
     */
    private attachEvents(): void {
        // Ne pas attacher les événements tactiles si l'appareil ne les supporte pas
        if (!isTouchDevice()) {
            return;
        }

        this._target.addEventListener('touchstart', this.handleTouchStart.bind(this) as EventListener, { capture: this._capture, passive: false });
        this._target.addEventListener('touchmove', this.handleTouchMove.bind(this) as EventListener, { capture: this._capture, passive: false });
        this._target.addEventListener('touchend', this.handleTouchEnd.bind(this) as EventListener, { capture: this._capture, passive: false });
        this._target.addEventListener('touchcancel', this.handleTouchCancel.bind(this) as EventListener, { capture: this._capture, passive: false });
    }

    /**
     * Détache les événements tactiles
     */
    private detachEvents(): void {
        // Ne pas détacher les événements tactiles si l'appareil ne les supporte pas
        if (!isTouchDevice()) {
            return;
        }

        this._target.removeEventListener('touchstart', this.handleTouchStart.bind(this) as EventListener, this._capture);
        this._target.removeEventListener('touchmove', this.handleTouchMove.bind(this) as EventListener, this._capture);
        this._target.removeEventListener('touchend', this.handleTouchEnd.bind(this) as EventListener, this._capture);
        this._target.removeEventListener('touchcancel', this.handleTouchCancel.bind(this) as EventListener, this._capture);
    }

    /**
     * Gère l'événement touchstart
     */
    private handleTouchStart(event: TouchEvent): void {
        event.preventDefault();

        const currentTime = Date.now();
        this._state.isMultiTouch = event.touches.length > 1;

        // Traiter chaque nouveau point tactile
        for (let i = 0; i < event.touches.length; i++) {
            const touch = event.touches[i];

            if (!this._state.touches.has(touch.identifier)) {
                const touchPoint: TouchPoint = {
                    id: touch.identifier,
                    startX: touch.clientX,
                    startY: touch.clientY,
                    currentX: touch.clientX,
                    currentY: touch.clientY,
                    startTime: currentTime
                };

                this._state.touches.set(touch.identifier, touchPoint);
            }
        }

        // Gestion du swipe (premier touch seulement)
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            this._state.swipeStartTime = currentTime;
            this._state.swipeStartX = touch.clientX;
            this._state.swipeStartY = touch.clientY;

            // Démarrer le timer de tap long
            this._state.longTapTimer = setTimeout(() => {
                const touchPoint = this._state.touches.get(touch.identifier);
                if (touchPoint && !this._state.isMultiTouch) {
                    this._callbacks.onLongTap?.(event, touchPoint.currentX, touchPoint.currentY, this._longTapDelay);
                }
            }, this._longTapDelay);
        }

        // Gestion multi-touch (pinch/rotate)
        if (this._state.isMultiTouch && event.touches.length === 2) {
            this.handleMultiTouchStart(event);
        }
    }

    /**
     * Gère l'événement touchmove
     */
    private handleTouchMove(event: TouchEvent): void {
        event.preventDefault();

        // Mettre à jour les positions des touches
        for (let i = 0; i < event.touches.length; i++) {
            const touch = event.touches[i];
            const touchPoint = this._state.touches.get(touch.identifier);

            if (touchPoint) {
                touchPoint.currentX = touch.clientX;
                touchPoint.currentY = touch.clientY;
            }
        }

        // Gestion multi-touch
        if (this._state.isMultiTouch && event.touches.length === 2) {
            this.handleMultiTouchMove(event);
        }
    }

    /**
     * Gère l'événement touchend
     */
    private handleTouchEnd(event: TouchEvent): void {
        event.preventDefault();

        const currentTime = Date.now();

        // Nettoyer le timer de tap long
        if (this._state.longTapTimer) {
            clearTimeout(this._state.longTapTimer);
            this._state.longTapTimer = undefined;
        }

        // Traiter les touches terminées
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            const touchPoint = this._state.touches.get(touch.identifier);

            if (touchPoint) {
                // Calculer la distance parcourue
                const deltaX = touchPoint.currentX - touchPoint.startX;
                const deltaY = touchPoint.currentY - touchPoint.startY;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                const duration = currentTime - touchPoint.startTime;

                // Déterminer si c'est un swipe
                if (distance > this._swipeThreshold && duration < this._swipeTimeout && !this._state.isMultiTouch) {
                    const swipeData = this.calculateSwipeData(deltaX, deltaY, distance, duration);
                    this._callbacks.onSwipe?.(event, swipeData.direction, swipeData.distance, swipeData.velocity);
                } else if (distance < this._tapThreshold && duration < this._swipeTimeout && !this._state.isMultiTouch) {
                    // C'est un tap
                    const timeSinceLastTap = currentTime - this._state.lastTapTime;

                    if (timeSinceLastTap < 300 && this._state.tapCount === 1) {
                        // Double tap
                        this._callbacks.onDoubleTap?.(event, touchPoint.currentX, touchPoint.currentY);
                        this._state.tapCount = 0;
                    } else {
                        // Tap simple
                        this._callbacks.onTap?.(event, touchPoint.currentX, touchPoint.currentY);
                        this._state.tapCount = 1;
                    }

                    this._state.lastTapTime = currentTime;
                }

                // Supprimer la touche
                this._state.touches.delete(touch.identifier);
            }
        }

        // Réinitialiser l'état multi-touch si plus de touches
        if (event.touches.length === 0) {
            this._state.isMultiTouch = false;
        }
    }

    /**
     * Gère l'événement touchcancel
     */
    private handleTouchCancel(event: TouchEvent): void {
        // Nettoyer le timer de tap long
        if (this._state.longTapTimer) {
            clearTimeout(this._state.longTapTimer);
            this._state.longTapTimer = undefined;
        }

        // Supprimer toutes les touches annulées
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            this._state.touches.delete(touch.identifier);
        }

        // Réinitialiser l'état multi-touch si plus de touches
        if (event.touches.length === 0) {
            this._state.isMultiTouch = false;
        }
    }

    /**
     * Gère le début du multi-touch
     */
    private handleMultiTouchStart(event: TouchEvent): void {
        // Initialiser les données de pinch/rotate si nécessaire
        // Cette fonction peut être étendue pour gérer des gestes plus complexes
    }

    /**
     * Gère le mouvement du multi-touch
     */
    private handleMultiTouchMove(event: TouchEvent): void {
        if (event.touches.length === 2) {
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];

            // Calculer la distance entre les deux touches
            const distance = Math.sqrt(
                Math.pow(touch2.clientX - touch1.clientX, 2) +
                Math.pow(touch2.clientY - touch1.clientY, 2)
            );

            // Calculer le centre
            const centerX = (touch1.clientX + touch2.clientX) / 2;
            const centerY = (touch1.clientY + touch2.clientY) / 2;

            // Calculer l'angle
            const angle = Math.atan2(
                touch2.clientY - touch1.clientY,
                touch2.clientX - touch1.clientX
            );

            // Appeler les callbacks appropriés
            this._callbacks.onPinch?.(event, distance, centerX, centerY);
            this._callbacks.onRotate?.(event, angle, centerX, centerY);
        }
    }

    /**
     * Calcule les données de swipe
     */
    private calculateSwipeData(deltaX: number, deltaY: number, distance: number, duration: number): SwipeData {
        let direction: SwipeDirection;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            direction = deltaX > 0 ? 'right' : 'left';
        } else {
            direction = deltaY > 0 ? 'down' : 'up';
        }

        const velocity = distance / duration;

        return {
            direction,
            distance,
            velocity,
            duration
        };
    }

    /**
     * Active/désactive le gestionnaire
     */
    setEnabled(enabled: boolean): void {
        if (this._enabled !== enabled) {
            this._enabled = enabled;
            if (enabled) {
                this.attachEvents();
            } else {
                this.detachEvents();
                this.resetState();
            }
        }
    }

    /**
     * Met à jour les options
     */
    updateOptions(options: Partial<TouchOptions & TouchCallbacks>): void {
        if (options.target !== undefined) {
            this._target = options.target;
        }
        if (options.enabled !== undefined) {
            this.setEnabled(options.enabled);
        }
        if (options.capture !== undefined) {
            this._capture = options.capture;
        }
        if (options.swipeThreshold !== undefined) {
            this._swipeThreshold = options.swipeThreshold;
        }
        if (options.swipeTimeout !== undefined) {
            this._swipeTimeout = options.swipeTimeout;
        }
        if (options.longTapDelay !== undefined) {
            this._longTapDelay = options.longTapDelay;
        }
        if (options.tapThreshold !== undefined) {
            this._tapThreshold = options.tapThreshold;
        }

        // Mettre à jour les callbacks
        Object.assign(this._callbacks, options);
    }

    /**
     * Réinitialise l'état tactile
     */
    private resetState(): void {
        if (this._state.longTapTimer) {
            clearTimeout(this._state.longTapTimer);
        }

        this._state = {
            touches: new Map(),
            isMultiTouch: false,
            lastTapTime: 0,
            tapCount: 0,
            swipeStartTime: 0,
            swipeStartX: 0,
            swipeStartY: 0
        };
    }

    /**
     * Nettoie les ressources
     */
    destroy(): void {
        this.detachEvents();
        this.resetState();
    }

    // ============================================================================
    // MÉTHODES UTILITAIRES
    // ============================================================================

    /**
     * Vérifie si les événements tactiles sont supportés
     */
    static isSupported(): boolean {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    /**
     * Obtient la position d'un événement tactile
     */
    static getTouchPosition(event: TouchEvent, index: number = 0): Position {
        const touch = event.touches[index] || event.changedTouches[index];
        return {
            x: touch ? touch.clientX : 0,
            y: touch ? touch.clientY : 0
        };
    }

    /**
     * Calcule la distance entre deux points tactiles
     */
    static getDistance(touch1: globalThis.Touch, touch2: globalThis.Touch): number {
        const deltaX = touch2.clientX - touch1.clientX;
        const deltaY = touch2.clientY - touch1.clientY;
        return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    }

    /**
     * Calcule l'angle entre deux points tactiles
     */
    static getAngle(touch1: globalThis.Touch, touch2: globalThis.Touch): number {
        return Math.atan2(touch2.clientY - touch1.clientY, touch2.clientX - touch1.clientX);
    }
}

// ============================================================================
// INSTANCE GLOBALE
// ============================================================================

/**
 * Instance globale du gestionnaire tactile
 */
export const touch = new Touch();

/**
 * Fonctions utilitaires pour compatibilité avec utils.ts
 */
export const touchUtils = {
    isSupported: Touch.isSupported,
    getTouchPosition: Touch.getTouchPosition,
    getDistance: Touch.getDistance,
    getAngle: Touch.getAngle,
    isTouchDevice: isTouchDevice
};
