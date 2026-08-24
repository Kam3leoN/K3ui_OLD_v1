/**
 * @fileoverview GestureManager — Pointer Events unifiés (touch + souris)
 * @description Pan continu, vélocité et swipe pour SwipeDeck et composants gestuels
 */

import type { SwipeDirection } from '../../types/base/dom';
import type {
    GestureCallbacks,
    GestureOptions,
    GesturePanDetail,
} from '../../types/managers/gesture';

interface GestureState {
    active: boolean;
    pointerId: number | null;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    startTime: number;
    lastX: number;
    lastY: number;
    lastTime: number;
    velocityX: number;
    velocityY: number;
    panning: boolean;
}

/**
 * Gestionnaire de gestes unifié (Pointer Events).
 * Pattern aligné sur `Keyboard` / `Mouse`.
 */
export class Gesture {
    private _target: HTMLElement | Document;
    private _enabled: boolean;
    private _capture: boolean;
    private _panThreshold: number;
    private _swipeThreshold: number;
    private _swipeVelocity: number;
    private _preventDefault: boolean;
    private _callbacks: GestureCallbacks;

    private _state: GestureState = {
        active: false,
        pointerId: null,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        startTime: 0,
        lastX: 0,
        lastY: 0,
        lastTime: 0,
        velocityX: 0,
        velocityY: 0,
        panning: false,
    };

    private readonly _boundDown: (event: PointerEvent) => void;
    private readonly _boundMove: (event: PointerEvent) => void;
    private readonly _boundUp: (event: PointerEvent) => void;
    private readonly _boundCancel: (event: PointerEvent) => void;

    constructor(options: GestureOptions & GestureCallbacks = {}) {
        this._target = (options.target || document) as HTMLElement | Document;
        this._enabled = options.enabled ?? true;
        this._capture = options.capture ?? false;
        this._panThreshold = options.panThreshold ?? 8;
        this._swipeThreshold = options.swipeThreshold ?? 80;
        this._swipeVelocity = options.swipeVelocity ?? 0.35;
        this._preventDefault = options.preventDefault ?? true;

        this._callbacks = {
            onPointerDown: options.onPointerDown ?? null,
            onPan: options.onPan ?? null,
            onPanEnd: options.onPanEnd ?? null,
            onSwipe: options.onSwipe ?? null,
            onCancel: options.onCancel ?? null,
        };

        this._boundDown = this.handlePointerDown.bind(this);
        this._boundMove = this.handlePointerMove.bind(this);
        this._boundUp = this.handlePointerUp.bind(this);
        this._boundCancel = this.handlePointerCancel.bind(this);

        if (this._enabled) {
            this.attachEvents();
        }
    }

    /** Attache les listeners pointer */
    private attachEvents(): void {
        this._target.addEventListener('pointerdown', this._boundDown as EventListener, this._capture);
        this._target.addEventListener('pointermove', this._boundMove as EventListener, this._capture);
        this._target.addEventListener('pointerup', this._boundUp as EventListener, this._capture);
        this._target.addEventListener('pointercancel', this._boundCancel as EventListener, this._capture);
    }

    /** Détache les listeners pointer */
    private detachEvents(): void {
        this._target.removeEventListener('pointerdown', this._boundDown as EventListener, this._capture);
        this._target.removeEventListener('pointermove', this._boundMove as EventListener, this._capture);
        this._target.removeEventListener('pointerup', this._boundUp as EventListener, this._capture);
        this._target.removeEventListener('pointercancel', this._boundCancel as EventListener, this._capture);
    }

    private buildDetail(event: PointerEvent): GesturePanDetail {
        const dx = this._state.currentX - this._state.startX;
        const dy = this._state.currentY - this._state.startY;
        const duration = Math.max(1, performance.now() - this._state.startTime);
        return {
            dx,
            dy,
            x: this._state.currentX,
            y: this._state.currentY,
            duration,
            velocityX: this._state.velocityX,
            velocityY: this._state.velocityY,
            angle: (Math.atan2(dy, dx) * 180) / Math.PI,
            event,
        };
    }

    private handlePointerDown(event: PointerEvent): void {
        if (this._state.active) {
            return;
        }
        this._state.active = true;
        this._state.pointerId = event.pointerId;
        this._state.startX = event.clientX;
        this._state.startY = event.clientY;
        this._state.currentX = event.clientX;
        this._state.currentY = event.clientY;
        this._state.lastX = event.clientX;
        this._state.lastY = event.clientY;
        this._state.startTime = performance.now();
        this._state.lastTime = this._state.startTime;
        this._state.velocityX = 0;
        this._state.velocityY = 0;
        this._state.panning = false;

        if (this._target instanceof HTMLElement) {
            try {
                this._target.setPointerCapture(event.pointerId);
            } catch {
                /* ignore */
            }
        }

        this._callbacks.onPointerDown?.(event, event.clientX, event.clientY);
    }

    private handlePointerMove(event: PointerEvent): void {
        if (!this._state.active || event.pointerId !== this._state.pointerId) {
            return;
        }

        const now = performance.now();
        const dt = Math.max(1, now - this._state.lastTime);
        this._state.velocityX = (event.clientX - this._state.lastX) / dt;
        this._state.velocityY = (event.clientY - this._state.lastY) / dt;
        this._state.lastX = event.clientX;
        this._state.lastY = event.clientY;
        this._state.lastTime = now;
        this._state.currentX = event.clientX;
        this._state.currentY = event.clientY;

        const dx = this._state.currentX - this._state.startX;
        const dy = this._state.currentY - this._state.startY;
        const dist = Math.hypot(dx, dy);

        if (!this._state.panning && dist >= this._panThreshold) {
            this._state.panning = true;
        }

        if (this._state.panning) {
            if (this._preventDefault) {
                event.preventDefault();
            }
            this._callbacks.onPan?.(this.buildDetail(event));
        }
    }

    private resolveSwipeDirection(detail: GesturePanDetail): SwipeDirection | null {
        const absX = Math.abs(detail.dx);
        const absY = Math.abs(detail.dy);
        const fastX = Math.abs(detail.velocityX) >= this._swipeVelocity;
        const fastY = Math.abs(detail.velocityY) >= this._swipeVelocity;
        const farX = absX >= this._swipeThreshold;
        const farY = absY >= this._swipeThreshold;

        if (absX >= absY && (farX || fastX)) {
            return detail.dx > 0 ? 'right' : 'left';
        }
        if (absY > absX && (farY || fastY)) {
            return detail.dy > 0 ? 'down' : 'up';
        }
        return null;
    }

    private handlePointerUp(event: PointerEvent): void {
        if (!this._state.active || event.pointerId !== this._state.pointerId) {
            return;
        }

        this._state.currentX = event.clientX;
        this._state.currentY = event.clientY;
        const detail = this.buildDetail(event);

        if (this._state.panning) {
            this._callbacks.onPanEnd?.(detail);
            const direction = this.resolveSwipeDirection(detail);
            if (direction) {
                this._callbacks.onSwipe?.(direction, detail);
            }
        }

        this.resetState();
    }

    private handlePointerCancel(event: PointerEvent): void {
        if (!this._state.active || event.pointerId !== this._state.pointerId) {
            return;
        }
        this._callbacks.onCancel?.(event);
        this.resetState();
    }

    private resetState(): void {
        this._state.active = false;
        this._state.pointerId = null;
        this._state.panning = false;
    }

    /** Active ou désactive le gestionnaire */
    setEnabled(enabled: boolean): void {
        if (enabled === this._enabled) {
            return;
        }
        this._enabled = enabled;
        if (enabled) {
            this.attachEvents();
        } else {
            this.detachEvents();
            this.resetState();
        }
    }

    /** Indique si un pan est en cours */
    isPanning(): boolean {
        return this._state.panning;
    }

    /** Nettoie les listeners */
    destroy(): void {
        this.detachEvents();
        this.resetState();
        this._callbacks = {
            onPointerDown: null,
            onPan: null,
            onPanEnd: null,
            onSwipe: null,
            onCancel: null,
        };
    }
}

/** Instance utilitaire optionnelle (document) */
export const gestureUtils = {
    create(options: GestureOptions & GestureCallbacks = {}): Gesture {
        return new Gesture(options);
    },
};
