/// <reference types="@types/jest" />

import { Flip } from '../../src/components/Flip';
import { flushComponentInit } from '../helpers/component-init';

describe('Flip', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    test('devrait initialiser avec structure recto/verso', async () => {
        document.body.innerHTML = `
            <div class="flip" id="flip-root" data-axis="y" data-motion="standard">
                <div class="flip__inner">
                    <div class="flip__face flip__face--front">Recto</div>
                    <div class="flip__face flip__face--back">Verso</div>
                </div>
            </div>
        `;

        const el = document.getElementById('flip-root') as HTMLElement;
        const instance = new Flip(el);
        await flushComponentInit();

        expect(instance).toBeDefined();
        expect(el.dataset.flipAxis).toBe('y');
        expect(el.classList.contains('flip--axis-y')).toBe(true);
        expect(el.dataset.flipMotion).toBe('standard');
        expect(Flip.getInstance(el)).toBe(instance);
    });

    test('devrait basculer en mode click', async () => {
        document.body.innerHTML = `
            <div class="flip" id="flip-click" data-trigger="click">
                <div class="flip__inner">
                    <div class="flip__face flip__face--front">A</div>
                    <div class="flip__face flip__face--back">B</div>
                </div>
            </div>
        `;

        const el = document.getElementById('flip-click') as HTMLElement;
        const instance = new Flip(el);
        await flushComponentInit();

        expect(el.getAttribute('role')).toBe('button');
        instance.toggle();
        expect(el.dataset.flipFlipped).toBe('true');
    });
});
