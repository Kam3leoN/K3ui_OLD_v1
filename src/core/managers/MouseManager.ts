/**
 * @fileoverview Module de gestion souris pour K3UI
 * @description Gestionnaire d'événements souris unifié pour les composants
 * @author K3UI Team
 * @version 1.0.0
 */

import { MouseOptions, MouseCallbacks, Position } from '../../types/base/dom';

// ============================================================================
// INTERFACES INTERNES
// ============================================================================

interface MouseState {
    isDown: boolean;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    lastX: number;
    lastY: number;
    isDragging: boolean;
    dragStartTime: number;
    clickCount: number;
    lastClickTime: number;
    longClickTimer?: number;
}

// ============================================================================
// CLASSE MOUSE
// ============================================================================

/**
 * Gestionnaire d'événements souris unifié
 */
export class Mouse {
    private _target: HTMLElement | Document | Window;
    private _enabled: boolean;
    private _capture: boolean;
    private _dragThreshold: number;
    private _longClickDelay: number;
    private _doubleClickDelay: number;
    private _scrollListenerOptions?: AddEventListenerOptions;

    private _state: MouseState = {
        isDown: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        lastX: 0,
        lastY: 0,
        isDragging: false,
        dragStartTime: 0,
        clickCount: 0,
        lastClickTime: 0
    };

    private _callbacks: MouseCallbacks;
    private _boundHandleMouseDown: (event: MouseEvent) => void;
    private _boundHandleMouseUp: (event: MouseEvent) => void;
    private _boundHandleMouseMove: (event: MouseEvent) => void;
    private _boundHandleContextMenu: (event: MouseEvent) => void;
    private _boundHandleMouseEnter: (event: MouseEvent) => void;
    private _boundHandleMouseLeave: (event: MouseEvent) => void;
    private _boundHandleScroll: (event: Event) => void;
    private _boundHandleWheel: (event: WheelEvent) => void;

    constructor(options: MouseOptions & MouseCallbacks = {}) {
        this._target = (options.target || document) as HTMLElement | Document | Window;
        this._enabled = options.enabled ?? true;
        this._capture = options.capture ?? false;
        this._dragThreshold = options.dragThreshold ?? 5;
        this._longClickDelay = options.longClickDelay ?? 500;
        this._doubleClickDelay = options.doubleClickDelay ?? 300;

        this._callbacks = {
            onClick: options.onClick || null,
            onDoubleClick: options.onDoubleClick || null,
            onLongClick: options.onLongClick || null,
            onContextMenu: options.onContextMenu || null,
            onMouseMove: options.onMouseMove || null,
            onDragStart: options.onDragStart || null,
            onDrag: options.onDrag || null,
            onDragEnd: options.onDragEnd || null,
            onMouseEnter: options.onMouseEnter || null,
            onMouseLeave: options.onMouseLeave || null,
            onScroll: options.onScroll || null,
            onWheel: options.onWheel || null
        };
        this._boundHandleMouseDown = this.handleMouseDown.bind(this);
        this._boundHandleMouseUp = this.handleMouseUp.bind(this);
        this._boundHandleMouseMove = this.handleMouseMove.bind(this);
        this._boundHandleContextMenu = this.handleContextMenu.bind(this);
        this._boundHandleMouseEnter = this.handleMouseEnter.bind(this);
        this._boundHandleMouseLeave = this.handleMouseLeave.bind(this);
        this._boundHandleScroll = this.handleScroll.bind(this);
        this._boundHandleWheel = this.handleWheel.bind(this);

        if (this._enabled) {
            this.attachEvents();
        }
    }

    /**
     * Attache les événements souris
     */
    private attachEvents(): void {
        this._target.addEventListener('mousedown', this._boundHandleMouseDown as EventListener, this._capture);
        this._target.addEventListener('mouseup', this._boundHandleMouseUp as EventListener, this._capture);
        this._target.addEventListener('mousemove', this._boundHandleMouseMove as EventListener, this._capture);
        this._target.addEventListener('contextmenu', this._boundHandleContextMenu as EventListener, this._capture);
        this._target.addEventListener('mouseenter', this._boundHandleMouseEnter as EventListener, this._capture);
        this._target.addEventListener('mouseleave', this._boundHandleMouseLeave as EventListener, this._capture);

        if (this._callbacks.onScroll) {
            const target = this._target === document ? window : this._target;
            const scrollOptions: AddEventListenerOptions = { passive: true, capture: this._capture };
            target.addEventListener('scroll', this._boundHandleScroll as EventListener, scrollOptions);
            this._scrollListenerOptions = scrollOptions;
        }

        if (this._callbacks.onWheel) {
            this._target.addEventListener('wheel', this._boundHandleWheel as EventListener, { passive: true, capture: this._capture });
        }
    }

    /**
     * Détache les événements souris
     */
    private detachEvents(): void {
        this._target.removeEventListener('mousedown', this._boundHandleMouseDown as EventListener, this._capture);
        this._target.removeEventListener('mouseup', this._boundHandleMouseUp as EventListener, this._capture);
        this._target.removeEventListener('mousemove', this._boundHandleMouseMove as EventListener, this._capture);
        this._target.removeEventListener('contextmenu', this._boundHandleContextMenu as EventListener, this._capture);
        this._target.removeEventListener('mouseenter', this._boundHandleMouseEnter as EventListener, this._capture);
        this._target.removeEventListener('mouseleave', this._boundHandleMouseLeave as EventListener, this._capture);

        if (this._callbacks.onScroll && this._scrollListenerOptions) {
            const target = this._target === document ? window : this._target;
            target.removeEventListener(
                'scroll',
                this._boundHandleScroll as EventListener,
                this._scrollListenerOptions,
            );
            this._scrollListenerOptions = undefined;
        }

        if (this._callbacks.onWheel) {
            this._target.removeEventListener('wheel', this._boundHandleWheel as EventListener, this._capture);
        }
    }

    /**
     * Gère l'événement mousedown
     */
    private handleMouseDown(event: MouseEvent): void {
        this._state.isDown = true;
        this._state.startX = event.clientX;
        this._state.startY = event.clientY;
        this._state.currentX = event.clientX;
        this._state.currentY = event.clientY;
        this._state.lastX = event.clientX;
        this._state.lastY = event.clientY;
        this._state.dragStartTime = Date.now();

        // Démarrer le timer de clic long
        this._state.longClickTimer = setTimeout(() => {
            if (this._state.isDown && !this._state.isDragging) {
                this._callbacks.onLongClick?.(event, event.clientX, event.clientY, this._longClickDelay);
            }
        }, this._longClickDelay);

        // Gérer les clics spéciaux
        if (event.button === 1) { // Clic milieu
            this._callbacks.onClick?.(event, event.clientX, event.clientY);
        }
    }

    /**
     * Gère l'événement mouseup
     */
    private handleMouseUp(event: MouseEvent): void {
        if (!this._state.isDown) return;

        const wasDragging = this._state.isDragging;
        const currentTime = Date.now();

        // Nettoyer le timer de clic long
        if (this._state.longClickTimer) {
            clearTimeout(this._state.longClickTimer);
            this._state.longClickTimer = undefined;
        }

        // Calculer la distance de déplacement
        const deltaX = this._state.currentX - this._state.startX;
        const deltaY = this._state.currentY - this._state.startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Si c'était un drag, appeler onDragEnd
        if (wasDragging) {
            this._callbacks.onDragEnd?.(event, event.clientX, event.clientY);
        } else {
            // Vérifier si c'est un double-clic
            const timeSinceLastClick = currentTime - this._state.lastClickTime;
            if (timeSinceLastClick < this._doubleClickDelay && this._state.clickCount === 1) {
                this._callbacks.onDoubleClick?.(event, event.clientX, event.clientY);
                this._state.clickCount = 0;
            } else {
                // Clic simple
                this._callbacks.onClick?.(event, event.clientX, event.clientY);
                this._state.clickCount = 1;
            }
            this._state.lastClickTime = currentTime;
        }

        // Réinitialiser l'état
        this._state.isDown = false;
        this._state.isDragging = false;
    }

    /**
     * Gère l'événement mousemove
     */
    private handleMouseMove(event: MouseEvent): void {
        this._state.lastX = this._state.currentX;
        this._state.lastY = this._state.currentY;
        this._state.currentX = event.clientX;
        this._state.currentY = event.clientY;

        const deltaX = event.clientX - this._state.lastX;
        const deltaY = event.clientY - this._state.lastY;

        // Appeler onMouseMove
        this._callbacks.onMouseMove?.(event, event.clientX, event.clientY);

        // Gérer le drag
        if (this._state.isDown) {
            const totalDeltaX = this._state.currentX - this._state.startX;
            const totalDeltaY = this._state.currentY - this._state.startY;
            const distance = Math.sqrt(totalDeltaX * totalDeltaX + totalDeltaY * totalDeltaY);

            if (!this._state.isDragging && distance > this._dragThreshold) {
                this._state.isDragging = true;
                this._callbacks.onDragStart?.(event, event.clientX, event.clientY);
            }

            if (this._state.isDragging) {
                this._callbacks.onDrag?.(event, event.clientX, event.clientY, deltaX, deltaY);
            }
        }
    }

    /**
     * Gère l'événement contextmenu (clic droit)
     */
    private handleContextMenu(event: MouseEvent): void {
        this._callbacks.onContextMenu?.(event, event.clientX, event.clientY);
    }

    /**
     * Gère l'événement mouseenter
     */
    private handleMouseEnter(event: MouseEvent): void {
        if (this._callbacks.onMouseEnter) {
            this._callbacks.onMouseEnter(event, event.clientX, event.clientY);
        }
    }

    /**
     * Gère l'événement mouseleave
     */
    private handleMouseLeave(event: MouseEvent): void {
        this._callbacks.onMouseLeave?.(event, event.clientX, event.clientY);
    }

    /**
     * Gère l'événement scroll
     */
    private handleScroll(event: Event): void {
        this._callbacks.onScroll?.(event);
    }

    /**
     * Gère l'événement wheel
     */
    private handleWheel(event: WheelEvent): void {
        this._callbacks.onWheel?.(event, event.deltaX, event.deltaY, event.deltaZ);
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
    updateOptions(options: Partial<MouseOptions & MouseCallbacks>): void {
        if (options.target !== undefined) {
            this._target = options.target;
        }
        if (options.enabled !== undefined) {
            this.setEnabled(options.enabled);
        }
        if (options.capture !== undefined) {
            this._capture = options.capture;
        }
        if (options.dragThreshold !== undefined) {
            this._dragThreshold = options.dragThreshold;
        }
        if (options.longClickDelay !== undefined) {
            this._longClickDelay = options.longClickDelay;
        }
        if (options.doubleClickDelay !== undefined) {
            this._doubleClickDelay = options.doubleClickDelay;
        }

        // Mettre à jour les callbacks
        Object.assign(this._callbacks, options);
    }

    /**
     * Réinitialise l'état de la souris
     */
    private resetState(): void {
        this._state = {
            isDown: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            lastX: 0,
            lastY: 0,
            isDragging: false,
            dragStartTime: 0,
            clickCount: 0,
            lastClickTime: 0
        };
    }

    /**
     * Nettoie les ressources
     */
    destroy(): void {
        this.detachEvents();
        if (this._state.longClickTimer) {
            clearTimeout(this._state.longClickTimer);
        }
        this.resetState();
    }

    // ============================================================================
    // MÉTHODES UTILITAIRES (compatibilité avec utils.ts)
    // ============================================================================

    /**
     * Obtient la position X d'un événement (souris ou touch)
     */
    static getEventXPosition(event: TouchEvent | MouseEvent): number {
        if ('touches' in event && event.touches.length > 0) {
            return event.touches[0].clientX;
        }
        return (event as MouseEvent).clientX;
    }

    /**
     * Obtient la position Y d'un événement (souris ou touch)
     */
    static getEventYPosition(event: TouchEvent | MouseEvent): number {
        if ('touches' in event && event.touches.length > 0) {
            return event.touches[0].clientY;
        }
        return (event as MouseEvent).clientY;
    }

    /**
     * Obtient le scroll top du document
     */
    static getDocumentScrollTop(): number {
        return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    }

    /**
     * Obtient le scroll left du document
     */
    static getDocumentScrollLeft(): number {
        return window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
    }
}

// ============================================================================
// INSTANCE GLOBALE
// ============================================================================

/**
 * Instance globale du gestionnaire souris
 */
export const mouse = new Mouse();

/**
 * Fonctions utilitaires pour compatibilité avec utils.ts
 */
export const mouseUtils = {
    getEventXPosition: Mouse.getEventXPosition,
    getEventYPosition: Mouse.getEventYPosition,
    getDocumentScrollTop: Mouse.getDocumentScrollTop,
    getDocumentScrollLeft: Mouse.getDocumentScrollLeft
};
