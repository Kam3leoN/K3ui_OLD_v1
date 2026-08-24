/// <reference types="@types/jest" />

import { Tile } from '../../src/components/Tile';

describe('Tile', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="card"></div>';
    });

    test('initialise et applique les classes de base (expressive)', () => {
        const el = document.getElementById('card') as HTMLElement;
        const instance = new Tile(el);

        expect(instance).toBeDefined();
        expect(el.classList.contains('tile-item')).toBe(true);
        expect(el.classList.contains('tile-item--expressive')).toBe(true);
        expect(el.classList.contains('tile-item--md')).toBe(true);
    });

    test('setChecked met a jour la classe checked', () => {
        const el = document.getElementById('card') as HTMLElement;
        const instance = new Tile(el);

        instance.setChecked(true);
        expect(instance.getChecked()).toBe(true);
        expect(el.classList.contains('tile-item--checked')).toBe(true);
    });

    test('en groupe, une seule instance reste selectionnee', () => {
        document.body.innerHTML = `
            <div id="c1" data-name="g1"></div>
            <div id="c2" data-name="g1"></div>
        `;

        const c1 = document.getElementById('c1') as HTMLElement;
        const c2 = document.getElementById('c2') as HTMLElement;
        const i1 = new Tile(c1);
        const i2 = new Tile(c2);

        i1.setChecked(true);
        i2.setChecked(true);

        expect(i1.getChecked()).toBe(false);
        expect(i2.getChecked()).toBe(true);
    });

    test('mode declaratif carte conserve le DOM et synchronise les classes', () => {
        document.body.innerHTML = `
            <div class="tile-item no-autoinit" id="t1">
                <input id="r1" class="tile-input" type="radio" name="grp" value="a" />
                <div class="tile-panel"><label for="r1" class="tile-panel-label">A</label></div>
            </div>
        `;
        const el = document.getElementById('t1') as HTMLElement;
        const input = document.getElementById('r1') as HTMLInputElement;
        new Tile(el);

        expect(el.querySelector('.tile-panel')).not.toBeNull();
        input.checked = true;
        input.dispatchEvent(new Event('change', { bubbles: true }));
        expect(el.classList.contains('tile-item--checked')).toBe(true);
    });
});
