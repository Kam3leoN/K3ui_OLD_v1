/// <reference types="@types/jest" />

import { writePointerSurface, resetPointerSurface, coordsFromClient } from '../../src/utils/effects/pointerSurface';

describe('pointerSurface', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="surface" style="width:200px;height:100px"></div>';
    });

    test('writePointerSurface définit les variables CSS', () => {
        const el = document.getElementById('surface') as HTMLElement;
        writePointerSurface(el, 0.25, 0.75, 1);
        expect(el.style.getPropertyValue('--px')).toBe('0.2500');
        expect(el.style.getPropertyValue('--py')).toBe('0.7500');
        expect(el.style.getPropertyValue('--active')).toBe('1');
        expect(el.dataset.active).toBe('true');
    });

    test('resetPointerSurface remet au centre', () => {
        const el = document.getElementById('surface') as HTMLElement;
        writePointerSurface(el, 0.1, 0.9, 1);
        resetPointerSurface(el);
        expect(el.style.getPropertyValue('--px')).toBe('0.5000');
        expect(el.dataset.active).toBe('false');
    });

    test('coordsFromClient normalise la position', () => {
        const el = document.getElementById('surface') as HTMLElement;
        el.getBoundingClientRect = jest.fn(() => ({
            left: 0,
            top: 0,
            width: 200,
            height: 100,
            right: 200,
            bottom: 100,
            x: 0,
            y: 0,
            toJSON: () => ({}),
        }));

        const coords = coordsFromClient(el, 100, 50);
        expect(coords.px).toBe(0.5);
        expect(coords.py).toBe(0.5);
        expect(coords.active).toBe(1);
    });
});
