/// <reference types="jest" />
import { runFlipAnimation, type RectMap } from '../../src/utils/isofilter/flip';
import { waitMs } from '../helpers/menu-async';

describe('utils/isofilter/flip', () => {
    test('runFlipAnimation applique un delta puis remet la transform', async () => {
        const el = document.createElement('div');
        el.style.transform = 'translate3d(100px, 200px, 0)';
        el.style.opacity = '0';

        const first: RectMap = new Map([
            [el, { left: 0, top: 0, width: 10, height: 10 }],
        ]);
        const last: RectMap = new Map([
            [el, { left: 10, top: 20, width: 10, height: 10 }],
        ]);

        const durationMs = 350;

        runFlipAnimation({
            elements: [el],
            first,
            last,
            durationMs,
            visibilityByElement: new Map([[el, 'enter']]),
        });

        // Après runFlipAnimation, on doit avoir ajouté un translate delta.
        expect(el.style.transform).toContain('translate3d(-10px, -20px, 0)');

        // Ensuite, au frame suivant (rAF mock -> setTimeout 16ms)
        await waitMs(25);

        expect(el.style.transform).toBe('translate3d(100px, 200px, 0)');
        expect(el.style.opacity).toBe('1');
    });
});

