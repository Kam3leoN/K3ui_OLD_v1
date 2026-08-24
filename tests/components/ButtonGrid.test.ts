/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant ButtonGrid
 */

import { ButtonGrid } from '../../src/components/ButtonGrid';

describe('ButtonGrid', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div class="btn-grid" id="grid-el"></div>';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('initialise et stocke l\'instance sur l\'élément', () => {
        const el = document.getElementById('grid-el') as HTMLElement;
        const instance = new ButtonGrid(el);

        expect(instance).toBeDefined();
        expect(ButtonGrid.getInstance(el)).toBe(instance);
    });

    test('applique les options par défaut', () => {
        expect(ButtonGrid.defaults).toBeDefined();
    });

    test('isExpanded retourne false initialement', () => {
        const el = document.getElementById('grid-el') as HTMLElement;
        const instance = new ButtonGrid(el);

        expect(instance.isExpanded).toBe(false);
    });

    test('init initialise plusieurs éléments', () => {
        document.body.innerHTML =
            '<div class="btn-grid" id="g1"></div>' +
            '<div class="btn-grid" id="g2"></div>';
        const els = document.querySelectorAll('.btn-grid');
        const instances = ButtonGrid.init(els as NodeListOf<HTMLElement>);

        expect(Array.isArray(instances)).toBe(true);
        expect((instances as ButtonGrid[]).length).toBe(2);
    });

    test('destroy nettoie l\'instance', () => {
        const el = document.getElementById('grid-el') as HTMLElement;
        const instance = new ButtonGrid(el);

        instance.destroy();
        expect(ButtonGrid.getInstance(el)).toBeFalsy();
    });
});
