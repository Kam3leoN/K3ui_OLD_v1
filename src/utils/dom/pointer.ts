/**
 * @fileoverview Helpers Pointer Events (souris + tactile + stylet unifiés)
 * @description Réduit le double-fire mousedown/touchstart ; fallback souris/touch legacy.
 */

import { getPointerCoords } from './eventListener';

export type PointerLikeEvent = MouseEvent | TouchEvent | PointerEvent;

export interface PointerPressReleaseBinding {
    target: EventTarget;
    type: string;
    handler: EventListener;
    options?: boolean | AddEventListenerOptions;
}

/**
 * Indique si l’API Pointer Events est disponible.
 */
export function supportsPointerEvents(): boolean {
    return typeof window !== 'undefined' && 'PointerEvent' in window;
}

/**
 * Retourne les bindings press/release à enregistrer via `registerEvent`.
 * @param element - Élément principal
 * @param handlers - Callbacks press / release
 */
export function getPointerPressReleaseBindings(
    element: HTMLElement,
    handlers: {
        onPress: (e: PointerLikeEvent) => void;
        onRelease: (e?: PointerLikeEvent) => void;
        onDocumentRelease?: () => void;
    }
): PointerPressReleaseBinding[] {
    if (supportsPointerEvents()) {
        const onDown = (e: Event): void => {
            const pe = e as PointerEvent;
            if (pe.pointerType === 'mouse' && pe.button !== 0) {
                return;
            }
            handlers.onPress(pe);
        };
        const onUp = (e: Event): void => {
            handlers.onRelease(e as PointerLikeEvent);
        };
        const bindings: PointerPressReleaseBinding[] = [
            { target: element, type: 'pointerdown', handler: onDown },
            { target: element, type: 'pointerup', handler: onUp },
            { target: element, type: 'pointerleave', handler: onUp },
            { target: element, type: 'pointercancel', handler: onUp },
        ];
        if (handlers.onDocumentRelease) {
            bindings.push({
                target: document,
                type: 'pointerup',
                handler: () => handlers.onDocumentRelease!(),
            });
        }
        return bindings;
    }

    const onMouseDown = (e: Event): void => handlers.onPress(e as MouseEvent);
    const onMouseUp = (e: Event): void => handlers.onRelease(e as MouseEvent);
    const onTouchStart = (e: Event): void => handlers.onPress(e as TouchEvent);
    const onTouchEnd = (e: Event): void => handlers.onRelease(e as TouchEvent);
    const bindings: PointerPressReleaseBinding[] = [
        { target: element, type: 'mousedown', handler: onMouseDown },
        { target: element, type: 'mouseup', handler: onMouseUp },
        { target: element, type: 'mouseleave', handler: onMouseUp },
        { target: element, type: 'touchstart', handler: onTouchStart, options: { passive: true } },
        { target: element, type: 'touchend', handler: onTouchEnd, options: { passive: true } },
    ];
    if (handlers.onDocumentRelease) {
        bindings.push(
            { target: document, type: 'mouseup', handler: () => handlers.onDocumentRelease!() },
            {
                target: document,
                type: 'touchend',
                handler: () => handlers.onDocumentRelease!(),
                options: { passive: true },
            }
        );
    }
    return bindings;
}

export interface PointerDragSessionOptions {
    captureElement: HTMLElement;
    pointerId: number;
    onMove: (e: PointerLikeEvent) => void;
    onEnd: () => void;
    preventDefaultOnMove?: boolean;
}

/**
 * Démarre une session de drag avec `setPointerCapture` (ou fallback document).
 * @returns Fonction de nettoyage
 */
export function startPointerDragSession(options: PointerDragSessionOptions): () => void {
    const { captureElement, pointerId, onMove, onEnd, preventDefaultOnMove = false } = options;

    if (supportsPointerEvents()) {
        try {
            captureElement.setPointerCapture(pointerId);
        } catch {
            // ignore — drag continue via listeners
        }

        const handleMove = (e: Event): void => {
            const pe = e as PointerEvent;
            if (pe.pointerId !== pointerId) {
                return;
            }
            if (preventDefaultOnMove) {
                pe.preventDefault();
            }
            onMove(pe);
        };

        const finish = (): void => {
            captureElement.removeEventListener('pointermove', handleMove);
            captureElement.removeEventListener('pointerup', handleEnd);
            captureElement.removeEventListener('pointercancel', handleEnd);
            try {
                if (captureElement.hasPointerCapture(pointerId)) {
                    captureElement.releasePointerCapture(pointerId);
                }
            } catch {
                // ignore
            }
            onEnd();
        };

        const handleEnd = (e: Event): void => {
            const pe = e as PointerEvent;
            if (pe.pointerId !== pointerId) {
                return;
            }
            finish();
        };

        captureElement.addEventListener('pointermove', handleMove);
        captureElement.addEventListener('pointerup', handleEnd);
        captureElement.addEventListener('pointercancel', handleEnd);

        return finish;
    }

    const handleMouseMove = (e: Event): void => onMove(e as MouseEvent);
    const handleTouchMove = (e: Event): void => {
        if (preventDefaultOnMove) {
            e.preventDefault();
        }
        onMove(e as TouchEvent);
    };
    const handleEnd = (): void => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleEnd);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleEnd);
        onEnd();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleTouchMove, { passive: !preventDefaultOnMove });
    document.addEventListener('touchend', handleEnd);

    return handleEnd;
}

export interface BindPointerDownOptions {
    passive?: boolean;
    capture?: boolean;
}

/**
 * Attache un listener `pointerdown` (ou fallback mousedown/touchstart).
 * @returns Fonction de désinscription
 */
export function bindPointerDown(
    element: HTMLElement,
    handler: (e: PointerLikeEvent) => void,
    options: BindPointerDownOptions = {}
): () => void {
    const opts: AddEventListenerOptions = {
        passive: options.passive ?? false,
        capture: options.capture ?? false,
    };

    if (supportsPointerEvents()) {
        const onPointerDown = (e: Event): void => {
            const pe = e as PointerEvent;
            if (pe.pointerType === 'mouse' && pe.button !== 0) {
                return;
            }
            handler(pe);
        };
        element.addEventListener('pointerdown', onPointerDown, opts);
        return () => element.removeEventListener('pointerdown', onPointerDown, opts);
    }

    const onMouseDown = (e: Event): void => handler(e as MouseEvent);
    const onTouchStart = (e: Event): void => handler(e as TouchEvent);
    element.addEventListener('mousedown', onMouseDown, opts);
    element.addEventListener('touchstart', onTouchStart, { ...opts, passive: true });
    return () => {
        element.removeEventListener('mousedown', onMouseDown, opts);
        element.removeEventListener('touchstart', onTouchStart);
    };
}

export { getPointerCoords };
