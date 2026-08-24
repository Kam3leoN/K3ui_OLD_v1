/**
 * @fileoverview Module de drag and drop pour K3UI
 * @description Gestionnaire de glissement d'éléments avec support touch/mouse, limites et attraction
 * @author K3UI Team
 * @version 1.0.0
 */

import { DragOptions, DragCallbacks, DragDirection, DragAttraction, DragBoundary, Bounding } from '../../types/base/dom';
import { clamp } from '../helpers/math';

// ============================================================================
// INTERFACES INTERNES
// ============================================================================

interface DragState {
    x: number;
    y: number;
    dragged: boolean;
    enableTransition: boolean;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    lastX: number;
    lastY: number;
    offsetX: number; // Offset entre le point de clic et le coin supérieur gauche de l'élément
    offsetY: number; // Offset entre le point de clic et le coin supérieur gauche de l'élément
}

interface DragOffset {
    top: number;
    bottom: number;
    left: number;
    right: number;
    width: number;
    height: number;
    halfWidth: number;
    halfHeight: number;
    windowWidth: number;
    windowHeight: number;
}

interface DragRange {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

// ============================================================================
// CLASSE DRAG
// ============================================================================

/**
 * Gestionnaire de drag and drop pour éléments DOM
 * @description Permet de faire glisser un élément avec support touch/mouse, limites et attraction
 */
export class Drag {
    private _element: HTMLElement;
    private _direction: DragDirection;
    private _attraction?: DragAttraction;
    private _disabled: boolean;
    private _boundary: DragBoundary;
    private _zIndex: number | string;
    private _teleport?: HTMLElement | string | false;
    private _enableTransition: boolean;
    private _transitionDuration: number;

    private _state: DragState = {
        x: 0,
        y: 0,
        dragged: false,
        enableTransition: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        lastX: 0,
        lastY: 0,
        offsetX: 0,
        offsetY: 0
    };

    private _boundaryPx: {
        top: number;
        bottom: number;
        left: number;
        right: number;
    } = {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0
        };

    private _callbacks: DragCallbacks;
    private _originalParent?: Node;
    private _teleportElement?: HTMLElement;
    private _resizeObserver?: ResizeObserver;
    private _windowResizeHandler?: () => void;
    private _isDragging: boolean = false;
    private _touchStartHandler?: (e: TouchEvent) => void;
    private _touchMoveHandler?: (e: TouchEvent) => void;
    private _touchEndHandler?: (e: TouchEvent) => void;
    private _mouseDownHandler?: (e: MouseEvent) => void;
    private _mouseMoveHandler?: (e: MouseEvent) => void;
    private _mouseUpHandler?: (e: MouseEvent) => void;
    private _initialPosition: { top: string; left: string; bottom: string; right: string; transform: string } = {
        top: '',
        left: '',
        bottom: '',
        right: '',
        transform: ''
    };

    constructor(options: DragOptions & DragCallbacks) {
        if (!options.element) {
            console.error('[Drag] element is required');
            throw new Error('Drag: element is required');
        }

        this._element = options.element;
        this._direction = options.direction || 'xy';
        this._attraction = options.attraction;
        this._disabled = options.disabled ?? false;
        this._boundary = options.boundary || { top: 0, bottom: 0, left: 0, right: 0 };
        this._zIndex = options.zIndex ?? 90;
        this._teleport = options.teleport;
        this._enableTransition = options.enableTransition ?? true;
        this._transitionDuration = options.transitionDuration ?? 200;

        this._callbacks = {
            onClick: options.onClick || null,
            onDragStart: options.onDragStart || null,
            onDrag: options.onDrag || null,
            onDragEnd: options.onDragEnd || null
        };

        // Initialiser les limites en pixels
        this.toPxBoundary();

        // Sauvegarder la position initiale AVANT la téléportation
        this.saveInitialPosition();

        // Téléporter l'élément si nécessaire
        if (this._teleport !== false) {
            this.teleportElement();
            // Après la téléportation, mettre à jour la position initiale si elle a changé
            // (car la téléportation peut modifier les styles)
            requestAnimationFrame(() => {
                // Si l'élément a maintenant bottom/left après téléportation, les sauvegarder
                const style = this._element.style;
                if (style.bottom && !this._initialPosition.bottom) {
                    this._initialPosition.bottom = style.bottom;
                }
                if (style.left && !this._initialPosition.left) {
                    this._initialPosition.left = style.left;
                }
            });
        }

        // Initialiser les gestionnaires d'événements
        if (!this._disabled) {
            this.attachEvents();
        }

        // Observer les changements de taille de la fenêtre
        this.attachResizeObserver();
    }

    /**
     * Convertit les limites en pixels
     */
    private toPxBoundary(): void {
        const { top = 0, bottom = 0, left = 0, right = 0 } = this._boundary;

        this._boundaryPx = {
            top: this.toPxNum(top),
            bottom: this.toPxNum(bottom),
            left: this.toPxNum(left),
            right: this.toPxNum(right)
        };
    }

    /**
     * Convertit une valeur (number ou string) en pixels
     */
    private toPxNum(value: number | string): number {
        if (typeof value === 'number') {
            return value;
        }

        if (typeof value === 'string') {
            // Si c'est déjà en pixels
            if (value.endsWith('px')) {
                return parseFloat(value);
            }

            // Si c'est un pourcentage, calculer par rapport à la fenêtre
            if (value.endsWith('%')) {
                const percent = parseFloat(value);
                return (window.innerWidth * percent) / 100;
            }

            // Sinon, essayer de parser comme nombre
            const num = parseFloat(value);
            return isNaN(num) ? 0 : num;
        }

        return 0;
    }

    /**
     * Téléporte l'élément vers le conteneur spécifié
     */
    private teleportElement(): void {
        if (this._teleport === false) {
            return;
        }

        this._originalParent = this._element.parentNode as HTMLElement || undefined;

        if (this._teleport === 'body' || this._teleport === undefined) {
            this._teleportElement = document.body;
        } else if (typeof this._teleport === 'string') {
            const target = document.querySelector(this._teleport) as HTMLElement;
            if (target) {
                this._teleportElement = target;
            } else {
                console.warn(`[Drag] teleport target "${this._teleport}" not found, using body`);
                this._teleportElement = document.body;
            }
        } else if (this._teleport instanceof HTMLElement) {
            this._teleportElement = this._teleport;
        }

        if (this._teleportElement && this._teleportElement !== this._element.parentNode) {
            // Sauvegarder la position actuelle avant la téléportation
            const rect = this._element.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;
            const elementHeight = rect.height || this._element.offsetHeight || 40;
            const elementWidth = rect.width || this._element.offsetWidth || 120;

            // Calculer la position visible avant la téléportation
            let top = rect.top;
            let left = rect.left;

            // Si le bouton est en dehors du viewport vertical, le placer dans le viewport
            if (rect.top < 0 || rect.top > viewportHeight || rect.bottom < 0 || rect.bottom > viewportHeight) {
                // Placer le bouton au centre vertical du viewport
                top = Math.max(100, (viewportHeight - elementHeight) / 2);
            }

            // Si le bouton est en dehors du viewport horizontal, le placer dans le viewport
            if (rect.left < 0 || rect.left > viewportWidth || rect.right < 0 || rect.right > viewportWidth) {
                // Placer le bouton au centre horizontal du viewport
                left = Math.max(50, (viewportWidth - elementWidth) / 2);
            }

            // Téléporter l'élément
            this._teleportElement.appendChild(this._element);

            // Sauvegarder la position initiale pour le reset (depuis les styles inline ou calculés)
            const computedStyle = window.getComputedStyle(this._element);
            const originalBottom = this._element.style.bottom || computedStyle.bottom;
            const originalLeft = this._element.style.left || computedStyle.left;

            // Sauvegarder dans les attributs data pour le reset
            if (originalBottom && originalBottom !== 'auto') {
                this._element.setAttribute('data-original-bottom', originalBottom);
            }
            if (originalLeft && originalLeft !== 'auto') {
                this._element.setAttribute('data-original-left', originalLeft);
            }

            // Attendre que le DOM soit mis à jour avant de restaurer la position
            requestAnimationFrame(() => {
                // Restaurer la position visuelle avec position: fixed
                const style = this._element.style;
                style.position = 'fixed';

                // Utiliser bottom/left si disponibles (pour position fixed), sinon top/left
                if (originalBottom && originalBottom !== 'auto' && originalLeft && originalLeft !== 'auto') {
                    // Utiliser bottom/left pour position fixed
                    style.bottom = originalBottom;
                    style.left = originalLeft;
                    style.top = '';
                } else if (originalBottom && originalBottom !== 'auto') {
                    style.bottom = originalBottom;
                    style.top = `${top}px`;
                    style.left = `${left}px`;
                } else if (originalLeft && originalLeft !== 'auto') {
                    style.left = originalLeft;
                    style.top = `${top}px`;
                } else {
                    style.top = `${top}px`;
                    style.left = `${left}px`;
                }

                style.margin = '0'; // Réinitialiser les marges
                style.zIndex = String(this._zIndex);

                // Mettre à jour la position initiale sauvegardée avec les valeurs finales
                if (style.bottom) {
                    this._initialPosition.bottom = style.bottom;
                }
                if (style.left) {
                    this._initialPosition.left = style.left;
                }
                if (style.top) {
                    this._initialPosition.top = style.top;
                }

                // Initialiser les positions dans l'état (par rapport au viewport)
                this._state.x = left;
                this._state.y = top;
            });
        }
    }

    /**
     * Restaure l'élément à sa position d'origine
     */
    private restoreElement(): void {
        if (this._originalParent && this._element.parentNode !== this._originalParent) {
            this._originalParent.appendChild(this._element);
        }
    }

    /**
     * Attache les gestionnaires d'événements
     */
    private attachEvents(): void {
        // Gestionnaires touch
        this._touchStartHandler = this.handleTouchStart.bind(this);
        this._touchMoveHandler = this.handleTouchMove.bind(this);
        this._touchEndHandler = this.handleTouchEnd.bind(this);

        this._element.addEventListener('touchstart', this._touchStartHandler, { passive: false });
        this._element.addEventListener('touchmove', this._touchMoveHandler, { passive: false });
        this._element.addEventListener('touchend', this._touchEndHandler, { passive: false });
        this._element.addEventListener('touchcancel', this._touchEndHandler, { passive: false });

        // Gestionnaires souris
        this._mouseDownHandler = this.handleMouseDown.bind(this);
        this._mouseMoveHandler = this.handleMouseMove.bind(this);
        this._mouseUpHandler = this.handleMouseUp.bind(this);

        this._element.addEventListener('mousedown', this._mouseDownHandler);
        document.addEventListener('mousemove', this._mouseMoveHandler);
        document.addEventListener('mouseup', this._mouseUpHandler);
    }

    /**
     * Détache les gestionnaires d'événements
     */
    private detachEvents(): void {
        if (this._touchStartHandler) {
            this._element.removeEventListener('touchstart', this._touchStartHandler);
            this._element.removeEventListener('touchmove', this._touchMoveHandler!);
            this._element.removeEventListener('touchend', this._touchEndHandler!);
            this._element.removeEventListener('touchcancel', this._touchEndHandler!);
        }

        if (this._mouseDownHandler) {
            this._element.removeEventListener('mousedown', this._mouseDownHandler);
            document.removeEventListener('mousemove', this._mouseMoveHandler!);
            document.removeEventListener('mouseup', this._mouseUpHandler!);
        }
    }

    /**
     * Gère le début du drag (souris)
     */
    private handleMouseDown(event: MouseEvent): void {
        if (this._disabled) return;
        event.preventDefault();

        this._isDragging = true;
        this.saveXY();

        // Calculer l'offset entre le point de clic et le coin supérieur gauche de l'élément
        const rect = this._element.getBoundingClientRect();

        if (this._teleport !== false) {
            // Élément téléporté : offset par rapport au viewport
            this._state.offsetX = event.clientX - rect.left;
            this._state.offsetY = event.clientY - rect.top;
        } else {
            // Élément non téléporté : offset par rapport au parent positionné
            const positionedParent = this.getPositionedParent(this._element);
            if (positionedParent) {
                const parentRect = this.getRect(positionedParent);
                // Offset = position du clic relative au parent - position de l'élément relative au parent
                this._state.offsetX = (event.clientX - parentRect.left) - (rect.left - parentRect.left);
                this._state.offsetY = (event.clientY - parentRect.top) - (rect.top - parentRect.top);
            } else {
                // Fallback : offset par rapport au viewport
                this._state.offsetX = event.clientX - rect.left;
                this._state.offsetY = event.clientY - rect.top;
            }
        }


        this._state.startX = event.clientX;
        this._state.startY = event.clientY;
        this._state.currentX = event.clientX;
        this._state.currentY = event.clientY;
        this._state.lastX = event.clientX;
        this._state.lastY = event.clientY;

        // Appliquer le z-index
        const currentZIndex = window.getComputedStyle(this._element).zIndex;
        if (currentZIndex === 'auto' || parseInt(currentZIndex) < parseInt(String(this._zIndex))) {
            this._element.style.zIndex = String(this._zIndex);
        }

        this._callbacks.onDragStart?.(event, this._state.x, this._state.y);
    }

    /**
     * Gère le mouvement du drag (souris)
     */
    private handleMouseMove(event: MouseEvent): void {
        if (this._disabled || !this._isDragging) return;

        event.preventDefault();

        this._state.currentX = event.clientX;
        this._state.currentY = event.clientY;

        this._state.enableTransition = false;
        const wasDragged = this._state.dragged;
        this._state.dragged = true;


        // Pour les éléments téléportés, calculer par rapport à la fenêtre (viewport)
        // Pour les autres, calculer par rapport au conteneur parent
        if (this._teleport !== false) {
            // Élément téléporté : clientX/clientY sont déjà par rapport au viewport
            // On soustrait seulement l'offset pour positionner le coin supérieur gauche
            if (this._direction.includes('x')) {
                this._state.x = event.clientX - this._state.offsetX;
            }
            if (this._direction.includes('y')) {
                this._state.y = event.clientY - this._state.offsetY;
            }

        } else {
            // Élément non téléporté : position par rapport au conteneur parent
            const positionedParent = this.getPositionedParent(this._element);
            if (positionedParent) {
                const parentRect = this.getRect(positionedParent);
                // L'offset a été calculé comme : (clientX_down - parentRect.left_down) - (rect.left_down - parentRect.left_down)
                // Simplifié : offsetX = clientX_down - rect.left_down (distance dans le viewport)
                // Mais c'est aussi la distance dans le système du parent car c'est une distance pure
                // Pour calculer la nouvelle position relative au parent :
                // stateX = (event.clientX - parentRect.left) - offsetX
                if (this._direction.includes('x')) {
                    this._state.x = (event.clientX - parentRect.left) - this._state.offsetX;
                }
                if (this._direction.includes('y')) {
                    this._state.y = (event.clientY - parentRect.top) - this._state.offsetY;
                }
            } else {
                // Fallback : position par rapport à la fenêtre (viewport)
                if (this._direction.includes('x')) {
                    this._state.x = event.clientX - this._state.offsetX;
                }
                if (this._direction.includes('y')) {
                    this._state.y = event.clientY - this._state.offsetY;
                }
            }
        }

        this.clampToBoundary();
        this.updateTransform();

        this._callbacks.onDrag?.(event, this._state.x, this._state.y);
    }

    /**
     * Gère la fin du drag (souris)
     */
    private handleMouseUp(event: MouseEvent): void {
        if (this._disabled || !this._isDragging) return;

        this._isDragging = false;
        this._state.enableTransition = this._enableTransition;
        this.attract();

        // Si pas de drag, déclencher onClick
        if (!this._state.dragged) {
            this._callbacks.onClick?.(event);
        } else {
            this._callbacks.onDragEnd?.(event, this._state.x, this._state.y);
        }
    }

    /**
     * Gère le début du drag (touch)
     */
    private handleTouchStart(event: TouchEvent): void {
        if (this._disabled) return;

        event.preventDefault();
        const touch = event.touches[0];
        if (touch) {
            this._isDragging = true;
            this.saveXY();

            // Calculer l'offset entre le point de touch et le coin supérieur gauche de l'élément
            const rect = this._element.getBoundingClientRect();

            if (this._teleport !== false) {
                // Élément téléporté : offset par rapport au viewport
                this._state.offsetX = touch.clientX - rect.left;
                this._state.offsetY = touch.clientY - rect.top;
            } else {
                // Élément non téléporté : offset par rapport au parent positionné
                const positionedParent = this.getPositionedParent(this._element);
                if (positionedParent) {
                    const parentRect = this.getRect(positionedParent);
                    // Offset = position du touch relative au parent - position de l'élément relative au parent
                    this._state.offsetX = (touch.clientX - parentRect.left) - (rect.left - parentRect.left);
                    this._state.offsetY = (touch.clientY - parentRect.top) - (rect.top - parentRect.top);
                } else {
                    // Fallback : offset par rapport au viewport
                    this._state.offsetX = touch.clientX - rect.left;
                    this._state.offsetY = touch.clientY - rect.top;
                }
            }


            this._state.startX = touch.clientX;
            this._state.startY = touch.clientY;
            this._state.currentX = touch.clientX;
            this._state.currentY = touch.clientY;
            this._state.lastX = touch.clientX;
            this._state.lastY = touch.clientY;

            // Appliquer le z-index
            const currentZIndex = window.getComputedStyle(this._element).zIndex;
            if (currentZIndex === 'auto' || parseInt(currentZIndex) < parseInt(String(this._zIndex))) {
                this._element.style.zIndex = String(this._zIndex);
            }

            this._callbacks.onDragStart?.(event, this._state.x, this._state.y);
        }
    }

    /**
     * Gère le mouvement du drag (touch)
     */
    private handleTouchMove(event: TouchEvent): void {
        if (this._disabled || !this._isDragging) return;

        event.preventDefault();
        const touch = event.touches[0];
        if (touch) {
            this._state.currentX = touch.clientX;
            this._state.currentY = touch.clientY;

            this._state.enableTransition = false;
            this._state.dragged = true;

            // Pour les éléments téléportés, calculer par rapport à la fenêtre (viewport)
            // Pour les autres, calculer par rapport au conteneur parent
            if (this._teleport !== false) {
                // Élément téléporté : clientX/clientY sont déjà par rapport au viewport
                // On soustrait seulement l'offset pour positionner le coin supérieur gauche
                if (this._direction.includes('x')) {
                    this._state.x = touch.clientX - this._state.offsetX;
                }
                if (this._direction.includes('y')) {
                    this._state.y = touch.clientY - this._state.offsetY;
                }
            } else {
                // Élément non téléporté : position par rapport au conteneur parent
                const positionedParent = this.getPositionedParent(this._element);
                if (positionedParent) {
                    const parentRect = this.getRect(positionedParent);
                    // L'offset a été calculé comme distance, donc on l'utilise directement
                    // stateX = (touch.clientX - parentRect.left) - offsetX
                    if (this._direction.includes('x')) {
                        this._state.x = (touch.clientX - parentRect.left) - this._state.offsetX;
                    }
                    if (this._direction.includes('y')) {
                        this._state.y = (touch.clientY - parentRect.top) - this._state.offsetY;
                    }
                } else {
                    // Fallback : position par rapport à la fenêtre (viewport)
                    if (this._direction.includes('x')) {
                        this._state.x = touch.clientX - this._state.offsetX;
                    }
                    if (this._direction.includes('y')) {
                        this._state.y = touch.clientY - this._state.offsetY;
                    }
                }
            }

            this.clampToBoundary();
            this.updateTransform();

            this._callbacks.onDrag?.(event, this._state.x, this._state.y);
        }
    }

    /**
     * Gère la fin du drag (touch)
     */
    private handleTouchEnd(event: TouchEvent): void {
        if (this._disabled || !this._isDragging) return;

        this._isDragging = false;
        this._state.enableTransition = this._enableTransition;
        this.attract();

        // Si pas de drag, déclencher onClick
        if (!this._state.dragged) {
            this._callbacks.onClick?.(event);
        } else {
            this._callbacks.onDragEnd?.(event, this._state.x, this._state.y);
        }
    }

    /**
     * Obtient le conteneur parent positionné
     */
    private getPositionedParent(element: HTMLElement): HTMLElement | null {
        let parent = element.parentElement;
        while (parent && parent !== document.body) {
            const style = window.getComputedStyle(parent);
            const position = style.position;
            if (position === 'relative' || position === 'absolute' || position === 'fixed' || position === 'sticky') {
                return parent;
            }
            parent = parent.parentElement;
        }
        return null;
    }

    /**
     * Sauvegarde la position initiale de l'élément
     */
    private saveInitialPosition(): void {
        const style = this._element.style;
        const computedStyle = window.getComputedStyle(this._element);

        // Sauvegarder les styles inline en priorité, sinon les styles calculés
        this._initialPosition = {
            top: style.top || (computedStyle.top !== 'auto' ? computedStyle.top : ''),
            left: style.left || (computedStyle.left !== 'auto' ? computedStyle.left : ''),
            bottom: style.bottom || (computedStyle.bottom !== 'auto' ? computedStyle.bottom : ''),
            right: style.right || (computedStyle.right !== 'auto' ? computedStyle.right : ''),
            transform: style.transform || (computedStyle.transform !== 'none' ? computedStyle.transform : '')
        };
    }

    /**
     * Sauvegarde les positions X et Y actuelles
     */
    private saveXY(): void {
        if (this._teleport !== false) {
            // Pour les éléments téléportés, calculer par rapport à la fenêtre (viewport)
            const dragRect = this.getRect(this._element);
            const windowRect = this.getWindowRect();
            this._state.x = dragRect.left - windowRect.left;
            this._state.y = dragRect.top - windowRect.top;
        } else {
            // Pour les éléments non téléportés, calculer la position réelle depuis getBoundingClientRect
            // par rapport au parent positionné (pas depuis les styles CSS qui peuvent être obsolètes)
            const dragRect = this.getRect(this._element);
            const positionedParent = this.getPositionedParent(this._element);
            if (positionedParent) {
                const parentRect = this.getRect(positionedParent);
                this._state.x = dragRect.left - parentRect.left;
                this._state.y = dragRect.top - parentRect.top;
            } else {
                // Fallback : position par rapport au viewport
                this._state.x = dragRect.left;
                this._state.y = dragRect.top;
            }
        }
    }

    /**
     * Obtient les offsets de l'élément
     */
    private getOffset(): DragOffset {
        const dragRect = this.getRect(this._element);
        const positionedParent = this.getPositionedParent(this._element);
        const windowRect = this.getWindowRect();

        let top: number;
        let bottom: number;
        let left: number;
        let right: number;
        let containerWidth: number;
        let containerHeight: number;

        if (positionedParent && this._teleport === false) {
            // Calculer par rapport au conteneur parent
            const parentRect = this.getRect(positionedParent);
            top = dragRect.top - parentRect.top;
            bottom = parentRect.height - (dragRect.top - parentRect.top + dragRect.height);
            left = dragRect.left - parentRect.left;
            right = parentRect.width - (dragRect.left - parentRect.left + dragRect.width);
            containerWidth = parentRect.width;
            containerHeight = parentRect.height;
        } else {
            // Calculer par rapport à la fenêtre
            top = dragRect.top - windowRect.top;
            // Calculer bottom à partir de top + height (Bounding n'a pas bottom)
            const dragBottom = dragRect.top + dragRect.height;
            bottom = windowRect.height - dragBottom;
            left = dragRect.left - windowRect.left;
            // Calculer right à partir de left + width (Bounding n'a pas right)
            const dragRight = dragRect.left + dragRect.width;
            right = windowRect.width - dragRight;
            containerWidth = windowRect.width;
            containerHeight = windowRect.height;
        }

        const { width, height } = dragRect;

        return {
            top,
            bottom,
            left,
            right,
            width,
            height,
            halfWidth: width / 2,
            halfHeight: height / 2,
            windowWidth: containerWidth,
            windowHeight: containerHeight
        };
    }

    /**
     * Obtient les dimensions d'un élément ou de la fenêtre
     */
    private getRect(element: HTMLElement | Window): Bounding {
        if (element === window) {
            return {
                left: 0,
                top: 0,
                width: window.innerWidth,
                height: window.innerHeight
            };
        }

        const rect = (element as HTMLElement).getBoundingClientRect();
        return {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height
        };
    }

    /**
     * Obtient les dimensions de la fenêtre (compatibilité)
     */
    private getWindowRect(): Bounding {
        return {
            left: 0,
            top: 0,
            width: window.innerWidth,
            height: window.innerHeight
        };
    }

    /**
     * Obtient la plage de déplacement autorisée
     */
    private getRange(): DragRange {
        const offset = this.getOffset();
        const positionedParent = this.getPositionedParent(this._element);

        // Si on est dans un conteneur et qu'on n'utilise pas le téléport, utiliser les dimensions du conteneur
        let containerWidth = offset.windowWidth;
        let containerHeight = offset.windowHeight;

        if (positionedParent && this._teleport === false) {
            const parentRect = this.getRect(positionedParent);
            containerWidth = parentRect.width;
            containerHeight = parentRect.height;
        }

        // S'assurer que les valeurs sont des nombres
        const x1: number = Number(this._boundaryPx.left) || 0;
        const x2: number = Number(containerWidth) - (Number(this._boundaryPx.right) || 0) - (Number(offset.width) || 0);
        const y1: number = Number(this._boundaryPx.top) || 0;
        const y2: number = Number(containerHeight) - (Number(this._boundaryPx.bottom) || 0) - (Number(offset.height) || 0);

        return {
            minX: x1,
            minY: y1,
            // Fallback si l'élément déborde des limites
            maxX: x1 < x2 ? x2 : x1,
            maxY: y1 < y2 ? y2 : y1
        };
    }

    /**
     * Applique l'attraction vers les bords
     */
    private attract(): void {
        if (!this._attraction) {
            return;
        }

        const { minX, minY, maxX, maxY } = this.getRange();
        const offset = this.getOffset();

        // Pour les éléments téléportés, utiliser les positions actuelles (_state.x, _state.y)
        // Pour les autres, utiliser les valeurs de getOffset()
        let currentX: number;
        let currentY: number;

        if (this._teleport !== false) {
            // Élément téléporté : utiliser les positions actuelles
            currentX = this._state.x;
            currentY = this._state.y;
        } else {
            // Élément non téléporté : utiliser les positions calculées
            currentX = offset.left;
            currentY = offset.top;
        }

        // Calculer les distances par rapport aux bords
        const leftDistance = currentX - minX;
        const rightDistance = maxX - currentX;
        const topDistance = currentY - minY;
        const bottomDistance = maxY - currentY;

        // Déterminer quel bord est le plus proche
        const nearLeft = leftDistance <= rightDistance;
        const nearTop = topDistance <= bottomDistance;

        if (this._attraction.includes('x')) {
            this._state.x = nearLeft ? minX : maxX;
        }

        if (this._attraction.includes('y')) {
            this._state.y = nearTop ? minY : maxY;
        }

        this.updateTransform();
    }

    /**
     * Contraint les positions dans les limites
     */
    private clampToBoundary(): void {
        const { minX, minY, maxX, maxY } = this.getRange();
        this._state.x = clamp(this._state.x, minX, maxX);
        this._state.y = clamp(this._state.y, minY, maxY);
    }

    /**
     * Met à jour la transformation CSS
     */
    private updateTransform(): void {
        const style = this._element.style;

        if (this._state.dragged) {
            // Pour les éléments téléportés, on utilise position: fixed et on met à jour top/left
            // Pour les autres, on utilise position: absolute avec transform
            if (this._teleport !== false) {
                // Élément téléporté : utiliser position: fixed avec top/left
                style.position = 'fixed';

                // Appliquer la transition si activée
                if (this._state.enableTransition) {
                    style.transition = `top ${this._transitionDuration}ms linear, left ${this._transitionDuration}ms linear`;
                } else {
                    style.transition = 'none';
                }

                // Pour position: fixed, les coordonnées sont déjà par rapport au viewport
                // _state.x et _state.y sont déjà calculés correctement
                const topBefore = style.top;
                const leftBefore = style.left;
                style.top = `${this._state.y}px`;
                style.left = `${this._state.x}px`;
                style.right = 'auto';
                style.bottom = 'auto';
                style.transform = 'none';

            } else {
                // Élément non téléporté : utiliser position: absolute avec top/left
                const currentPosition = window.getComputedStyle(this._element).position;
                if (currentPosition === 'static' || currentPosition === 'relative') {
                    style.position = 'absolute';
                }

                // Appliquer la transition si activée
                if (this._state.enableTransition) {
                    style.transition = `top ${this._transitionDuration}ms linear, left ${this._transitionDuration}ms linear`;
                } else {
                    style.transition = 'none';
                }

                // Utiliser top/left directement (comme pour les éléments téléportés)
                style.top = `${this._state.y}px`;
                style.left = `${this._state.x}px`;
                style.right = 'auto';
                style.bottom = 'auto';
                style.transform = 'none';
            }
        }
    }

    /**
     * Attache l'observer de redimensionnement
     */
    private attachResizeObserver(): void {
        this._windowResizeHandler = () => {
            if (this._state.dragged) {
                this.saveXY();
                this.clampToBoundary();
                this.updateTransform();
            }
        };

        window.addEventListener('resize', this._windowResizeHandler);

        // Observer les changements de taille de l'élément
        if (typeof ResizeObserver !== 'undefined') {
            this._resizeObserver = new ResizeObserver(() => {
                if (this._state.dragged) {
                    this.saveXY();
                    this.clampToBoundary();
                    this.updateTransform();
                }
            });

            this._resizeObserver.observe(this._element);
        }
    }

    /**
     * Détache l'observer de redimensionnement
     */
    private detachResizeObserver(): void {
        if (this._windowResizeHandler) {
            window.removeEventListener('resize', this._windowResizeHandler);
            this._windowResizeHandler = undefined;
        }

        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = undefined;
        }
    }

    /**
     * Active/désactive le drag
     */
    setEnabled(enabled: boolean): void {
        // Si l'état actuel est différent de l'état souhaité, changer
        const shouldBeDisabled = !enabled;
        if (this._disabled !== shouldBeDisabled) {
            this._disabled = shouldBeDisabled;
            if (enabled) {
                this.attachEvents();
            } else {
                this.detachEvents();
            }
        }
    }

    /**
     * Met à jour les options
     */
    updateOptions(options: Partial<DragOptions & DragCallbacks>): void {
        if (options.direction !== undefined) {
            this._direction = options.direction;
        }
        if (options.attraction !== undefined) {
            this._attraction = options.attraction;
        }
        if (options.disabled !== undefined) {
            this.setEnabled(!options.disabled);
        }
        if (options.boundary !== undefined) {
            this._boundary = options.boundary;
            this.toPxBoundary();
        }
        if (options.zIndex !== undefined) {
            this._zIndex = options.zIndex;
        }
        if (options.enableTransition !== undefined) {
            this._enableTransition = options.enableTransition;
        }
        if (options.transitionDuration !== undefined) {
            this._transitionDuration = options.transitionDuration;
        }

        // Mettre à jour les callbacks
        Object.assign(this._callbacks, options);
    }

    /**
     * Réinitialise la position de l'élément
     */
    reset(): void {
        this._isDragging = false;
        this._state.enableTransition = false;
        this._state.dragged = false;
        this._state.x = 0;
        this._state.y = 0;

        const style = this._element.style;

        // Restaurer la position initiale sauvegardée
        style.top = this._initialPosition.top;
        style.left = this._initialPosition.left;
        style.bottom = this._initialPosition.bottom;
        style.right = this._initialPosition.right;
        style.transform = this._initialPosition.transform;
        style.transition = '';

        // Ne pas réinitialiser le z-index pour les éléments téléportés
        if (!this._teleportElement || this._teleportElement !== document.body) {
            style.zIndex = '';
        }
    }

    /**
     * Redimensionne et repositionne l'élément
     */
    resize(): void {
        if (!this._state.dragged) {
            return;
        }

        this.saveXY();
        this.clampToBoundary();
        this.updateTransform();
    }

    /**
     * Nettoie les ressources
     */
    destroy(): void {
        this.detachEvents();
        this.detachResizeObserver();
        this.restoreElement();
        this.reset();
    }
}

