/**
 * @fileoverview Regression — Touch ne doit pas bloquer scroll/taps mobiles
 */
import { Touch, touch } from '../../../src/utils/dom/touch';

describe('Touch (mobile scroll safety)', () => {
    const originalOntouchstart = Object.getOwnPropertyDescriptor(window, 'ontouchstart');
    const originalMaxTouchPoints = Object.getOwnPropertyDescriptor(Navigator.prototype, 'maxTouchPoints');

    beforeAll(() => {
        Object.defineProperty(window, 'ontouchstart', {
            configurable: true,
            value: null,
        });
        Object.defineProperty(Navigator.prototype, 'maxTouchPoints', {
            configurable: true,
            get: () => 5,
        });
    });

    afterAll(() => {
        if (originalOntouchstart) {
            Object.defineProperty(window, 'ontouchstart', originalOntouchstart);
        } else {
            delete (window as Window & { ontouchstart?: unknown }).ontouchstart;
        }
        if (originalMaxTouchPoints) {
            Object.defineProperty(Navigator.prototype, 'maxTouchPoints', originalMaxTouchPoints);
        }
    });

    it('singleton global is disabled (no document touch capture on bundle load)', () => {
        const start = jest.fn();
        document.addEventListener('touchstart', start);
        const te = new TouchEvent('touchstart', {
            bubbles: true,
            cancelable: true,
            touches: [] as unknown as Touch[],
            targetTouches: [] as unknown as Touch[],
            changedTouches: [] as unknown as Touch[],
        });
        document.dispatchEvent(te);
        document.removeEventListener('touchstart', start);
        // Si le singleton était enabled + preventDefault, defaultPrevented serait true
        expect(te.defaultPrevented).toBe(false);
    });

    it('does not preventDefault by default when enabled on a target', () => {
        const el = document.createElement('div');
        document.body.appendChild(el);
        const instance = new Touch({ target: el, enabled: true });

        const touchObj = {
            identifier: 1,
            target: el,
            clientX: 10,
            clientY: 20,
            pageX: 10,
            pageY: 20,
            screenX: 10,
            screenY: 20,
            radiusX: 1,
            radiusY: 1,
            rotationAngle: 0,
            force: 1,
        } as unknown as globalThis.Touch;

        const te = new TouchEvent('touchstart', {
            bubbles: true,
            cancelable: true,
            touches: [touchObj] as unknown as Touch[],
            targetTouches: [touchObj] as unknown as Touch[],
            changedTouches: [touchObj] as unknown as Touch[],
        });
        el.dispatchEvent(te);
        expect(te.defaultPrevented).toBe(false);

        instance.destroy();
        el.remove();
    });

    it('preventDefault only when preventDefault: true', () => {
        const el = document.createElement('div');
        document.body.appendChild(el);
        const instance = new Touch({ target: el, enabled: true, preventDefault: true });

        const touchObj = {
            identifier: 1,
            target: el,
            clientX: 10,
            clientY: 20,
            pageX: 10,
            pageY: 20,
            screenX: 10,
            screenY: 20,
            radiusX: 1,
            radiusY: 1,
            rotationAngle: 0,
            force: 1,
        } as unknown as globalThis.Touch;

        const te = new TouchEvent('touchstart', {
            bubbles: true,
            cancelable: true,
            touches: [touchObj] as unknown as Touch[],
            targetTouches: [touchObj] as unknown as Touch[],
            changedTouches: [touchObj] as unknown as Touch[],
        });
        el.dispatchEvent(te);
        expect(te.defaultPrevented).toBe(true);

        instance.destroy();
        el.remove();
    });

    it('exports disabled global touch instance', () => {
        expect(touch).toBeInstanceOf(Touch);
    });
});
