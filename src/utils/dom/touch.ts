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
 * Gestionnaire d'événements tactiles unifié.
 * Ne bloque jamais le scroll/taps par défaut (preventDefault opt-in).
 */
export class Touch {
    private _target: HTMLElement | Document;
    private _enabled: boolean;
    private _capture: boolean;
    private _preventDefault: boolean;
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

    private readonly _boundStart: (event: TouchEvent) => void;
    private readonly _boundMove: (event: TouchEvent) => void;
    private readonly _boundEnd: (event: TouchEvent) => void;
    private readonly _boundCancel: (event: TouchEvent) => void;

    constructor(options: TouchOptions & TouchCallbacks = {}) {
        this._target = options.target || document;
        // Désactivé par défaut : une instance document + enabled:true figeait tout le tactile mobile
        this._enabled = options.enabled ?? false;
        this._capture = options.capture ?? false;
        this._preventDefault = options.preventDefault ?? false;
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

        this._boundStart = this.handleTouchStart.bind(this);
        this._boundMove = this.handleTouchMove.bind(this);
        this._boundEnd = this.handleTouchEnd.bind(this);
        this._boundCancel = this.handleTouchCancel.bind(this);

        if (this._enabled) {
            this.attachEvents();
        }
    }

    /**
     * Attache les événements tactiles
     */
    private attachEvents(): void {
        if (!isTouchDevice()) {
            return;
        }

        const opts: AddEventListenerOptions = {
            capture: this._capture,
            // passive tant qu'on ne preventDefault pas — sinon Chrome Android bloque le scroll
            passive: !this._preventDefault,
        };

        this._target.addEventListener('touchstart', this._boundStart as EventListener, opts);
        this._target.addEventListener('touchmove', this._boundMove as EventListener, opts);
        this._target.addEventListener('touchend', this._boundEnd as EventListener, opts);
        this._target.addEventListener('touchcancel', this._boundCancel as EventListener, opts);
    }

    /**
     * Détache les événements tactiles
     */
    private detachEvents(): void {
        if (!isTouchDevice()) {
            return;
        }

        this._target.removeEventListener('touchstart', this._boundStart as EventListener, this._capture);
        this._target.removeEventListener('touchmove', this._boundMove as EventListener, this._capture);
        this._target.removeEventListener('touchend', this._boundEnd as EventListener, this._capture);
        this._target.removeEventListener('touchcancel', this._boundCancel as EventListener, this._capture);
    }

    private maybePreventDefault(event: TouchEvent): void {
        if (this._preventDefault) {
            event.preventDefault();
        }
    }

    /**
     * Gère l'événement touchstart
     */
    private handleTouchStart(event: TouchEvent): void {
        this.maybePreventDefault(event);

        const currentTime = Date.now();
        this._state.isMultiTouch = event.touches.length > 1;

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

        if (event.touches.length === 1) {
            const touch = event.touches[0];
            this._state.swipeStartTime = currentTime;
            this._state.swipeStartX = touch.clientX;
            this._state.swipeStartY = touch.clientY;

            this._state.longTapTimer = window.setTimeout(() => {
                const touchPoint = this._state.touches.get(touch.identifier);
                if (touchPoint && !this._state.isMultiTouch) {
                    this._callbacks.onLongTap?.(event, touchPoint.currentX, touchPoint.currentY, this._longTapDelay);
                }
            }, this._longTapDelay);
        }

        if (this._state.isMultiTouch && event.touches.length === 2) {
            this.handleMultiTouchStart(event);
        }
    }

    /**
     * Gère l'événement touchmove
     */
    private handleTouchMove(event: TouchEvent): void {
        this.maybePreventDefault(event);

        for (let i = 0; i < event.touches.length; i++) {
            const touch = event.touches[i];
            const touchPoint = this._state.touches.get(touch.identifier);

            if (touchPoint) {
                touchPoint.currentX = touch.clientX;
                touchPoint.currentY = touch.clientY;
            }
        }

        if (this._state.isMultiTouch && event.touches.length === 2) {
            this.handleMultiTouchMove(event);
        }
    }

    /**
     * Gère l'événement touchend
     */
    private handleTouchEnd(event: TouchEvent): void {
        this.maybePreventDefault(event);

        const currentTime = Date.now();

        if (this._state.longTapTimer) {
            clearTimeout(this._state.longTapTimer);
            this._state.longTapTimer = undefined;
        }

        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            const touchPoint = this._state.touches.get(touch.identifier);

            if (touchPoint) {
                const deltaX = touchPoint.currentX - touchPoint.startX;
                const deltaY = touchPoint.currentY - touchPoint.startY;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                const duration = currentTime - touchPoint.startTime;

                if (distance > this._swipeThreshold && duration < this._swipeTimeout && !this._state.isMultiTouch) {
                    const swipeData = this.calculateSwipeData(deltaX, deltaY, distance, duration);
                    this._callbacks.onSwipe?.(event, swipeData.direction, swipeData.distance, swipeData.velocity);
                } else if (distance < this._tapThreshold && duration < this._swipeTimeout && !this._state.isMultiTouch) {
                    const timeSinceLastTap = currentTime - this._state.lastTapTime;

                    if (timeSinceLastTap < 300 && this._state.tapCount === 1) {
                        this._callbacks.onDoubleTap?.(event, touchPoint.currentX, touchPoint.currentY);
                        this._state.tapCount = 0;
                    } else {
                        this._callbacks.onTap?.(event, touchPoint.currentX, touchPoint.currentY);
                        this._state.tapCount = 1;
                    }

                    this._state.lastTapTime = currentTime;
                }

                this._state.touches.delete(touch.identifier);
            }
        }

        if (event.touches.length === 0) {
            this._state.isMultiTouch = false;
        }
    }

    /**
     * Gère l'événement touchcancel
     */
    private handleTouchCancel(event: TouchEvent): void {
        if (this._state.longTapTimer) {
            clearTimeout(this._state.longTapTimer);
            this._state.longTapTimer = undefined;
        }

        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            this._state.touches.delete(touch.identifier);
        }

        if (event.touches.length === 0) {
            this._state.isMultiTouch = false;
        }
    }

    /**
     * Gère le début du multi-touch
     */
    private handleMultiTouchStart(_event: TouchEvent): void {
        // Réservé pinch/rotate avancés
    }

    /**
     * Gère le mouvement du multi-touch
     */
    private handleMultiTouchMove(event: TouchEvent): void {
        if (event.touches.length === 2) {
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];

            const distance = Math.sqrt(
                Math.pow(touch2.clientX - touch1.clientX, 2) +
                Math.pow(touch2.clientY - touch1.clientY, 2)
            );

            const centerX = (touch1.clientX + touch2.clientX) / 2;
            const centerY = (touch1.clientY + touch2.clientY) / 2;

            const angle = Math.atan2(
                touch2.clientY - touch1.clientY,
                touch2.clientX - touch1.clientX
            );

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
        const wasEnabled = this._enabled;
        if (wasEnabled) {
            this.detachEvents();
        }

        if (options.target !== undefined) {
            this._target = options.target;
        }
        if (options.capture !== undefined) {
            this._capture = options.capture;
        }
        if (options.preventDefault !== undefined) {
            this._preventDefault = options.preventDefault;
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

        Object.assign(this._callbacks, options);

        if (options.enabled !== undefined) {
            this._enabled = options.enabled;
        }

        if (this._enabled) {
            this.attachEvents();
        } else if (wasEnabled) {
            this.resetState();
        }
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
 * Instance globale désactivée : ne jamais écouter document au chargement du bundle
 * (sinon preventDefault touch bloque scroll/FAB/nav sur Android).
 * Activer explicitement : `touch.setEnabled(true)` + target dédié via `updateOptions`.
 */
export const touch = new Touch({ enabled: false, preventDefault: false });

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
