/// <reference types="@types/jest" />
/**
 * Tests unitaires pour GestureManager
 */

import { Gesture } from '../../src/core/managers/GestureManager';

function dispatchPointer(
    el: HTMLElement,
    type: string,
    props: Partial<PointerEventInit> & { clientX: number; clientY: number }
): void {
    const event = new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        pointerType: 'touch',
        ...props,
    });
    el.dispatchEvent(event);
}

describe('Gesture', () => {
    let gesture: Gesture;
    let el: HTMLElement;

    beforeEach(() => {
        el = document.createElement('div');
        document.body.appendChild(el);
    });

    afterEach(() => {
        gesture?.destroy();
        el.remove();
    });

    test('crée une instance avec les options par défaut', () => {
        gesture = new Gesture({ target: el });
        expect(gesture).toBeDefined();
        expect(gesture.isPanning()).toBe(false);
    });

    test('setEnabled active/désactive sans erreur', () => {
        gesture = new Gesture({ target: el });
        expect(() => gesture.setEnabled(false)).not.toThrow();
        expect(() => gesture.setEnabled(true)).not.toThrow();
    });

    test('déclenche onPan après le seuil', () => {
        const onPan = jest.fn();
        gesture = new Gesture({
            target: el,
            panThreshold: 10,
            onPan,
        });

        dispatchPointer(el, 'pointerdown', { clientX: 100, clientY: 100 });
        dispatchPointer(el, 'pointermove', { clientX: 130, clientY: 100 });

        expect(onPan).toHaveBeenCalled();
        expect(gesture.isPanning()).toBe(true);
        const detail = onPan.mock.calls[0][0];
        expect(detail.dx).toBe(30);
    });

    test('déclenche onSwipe left', () => {
        const onSwipe = jest.fn();
        gesture = new Gesture({
            target: el,
            panThreshold: 5,
            swipeThreshold: 50,
            onSwipe,
        });

        dispatchPointer(el, 'pointerdown', { clientX: 200, clientY: 100 });
        dispatchPointer(el, 'pointermove', { clientX: 100, clientY: 100 });
        dispatchPointer(el, 'pointerup', { clientX: 100, clientY: 100 });

        expect(onSwipe).toHaveBeenCalled();
        expect(onSwipe.mock.calls[0][0]).toBe('left');
    });

    test('destroy nettoie sans erreur', () => {
        gesture = new Gesture({ target: el });
        expect(() => gesture.destroy()).not.toThrow();
    });
});
