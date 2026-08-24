/// <reference types="jest" />
import {
    bindPointerDown,
    getPointerPressReleaseBindings,
    getPointerCoords,
    startPointerDragSession,
    supportsPointerEvents,
} from '../../src/utils/dom/pointer';

describe('utils/dom/pointer', () => {
    test('supportsPointerEvents reflète la présence de PointerEvent', () => {
        const hadPointer = 'PointerEvent' in window;
        expect(supportsPointerEvents()).toBe(hadPointer);
    });

    test('getPointerCoords extrait clientX/clientY depuis MouseEvent', () => {
        const coords = getPointerCoords({ clientX: 12, clientY: 34 } as MouseEvent);
        expect(coords).toEqual({ x: 12, y: 34 });
    });

    test('getPointerPressReleaseBindings utilise pointer* quand PointerEvent est disponible', () => {
        const el = document.createElement('button');
        const onPress = jest.fn();
        const onRelease = jest.fn();
        const bindings = getPointerPressReleaseBindings(el, { onPress, onRelease });
        if (supportsPointerEvents()) {
            expect(bindings.map((b) => b.type)).toEqual(
                expect.arrayContaining(['pointerdown', 'pointerup', 'pointerleave', 'pointercancel']),
            );
        } else {
            expect(bindings.map((b) => b.type)).toEqual(
                expect.arrayContaining(['mousedown', 'mouseup', 'touchstart', 'touchend']),
            );
        }
    });

    test('bindPointerDown appelle le handler sur pointerdown', () => {
        if (!supportsPointerEvents()) {
            return;
        }
        const el = document.createElement('div');
        const handler = jest.fn();
        const unbind = bindPointerDown(el, handler);
        el.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, bubbles: true }));
        expect(handler).toHaveBeenCalledTimes(1);
        unbind();
        el.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 2, bubbles: true }));
        expect(handler).toHaveBeenCalledTimes(1);
    });

    test('startPointerDragSession exécute onMove puis onEnd', () => {
        const el = document.createElement('div');
        document.body.appendChild(el);
        const onMove = jest.fn();
        const onEnd = jest.fn();
        const cleanup = startPointerDragSession({
            captureElement: el,
            pointerId: 7,
            onMove,
            onEnd,
        });
        if (supportsPointerEvents()) {
            el.dispatchEvent(
                new PointerEvent('pointermove', { pointerId: 7, clientX: 1, clientY: 2, bubbles: true }),
            );
            el.dispatchEvent(new PointerEvent('pointerup', { pointerId: 7, bubbles: true }));
        } else {
            document.dispatchEvent(new MouseEvent('mousemove', { clientX: 3, clientY: 4, bubbles: true }));
            document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        }
        expect(onMove).toHaveBeenCalled();
        expect(onEnd).toHaveBeenCalled();
        cleanup();
        el.remove();
    });
});
