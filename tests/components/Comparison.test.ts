/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant Comparison
 */

import { Comparison } from '../../src/components/Comparison';

describe('Comparison', () => {
    beforeEach(() => {
        document.body.innerHTML =
            '<div class="comparison" id="comp-el">' +
            '<img src="" alt="Before"><img src="" alt="After">' +
            '</div>';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('initialise et stocke l\'instance sur l\'élément', () => {
        const el = document.getElementById('comp-el') as HTMLElement;
        const instance = new Comparison(el);

        expect(instance).toBeDefined();
        expect(Comparison.getInstance(el)).toBe(instance);
    });

    test('applique les options par défaut', () => {
        expect(Comparison.defaults).toBeDefined();
    });

    test('getPosition retourne un nombre', () => {
        const el = document.getElementById('comp-el') as HTMLElement;
        const instance = new Comparison(el);

        expect(typeof instance.getPosition()).toBe('number');
    });

    test('destroy nettoie l\'instance', () => {
        const el = document.getElementById('comp-el') as HTMLElement;
        const instance = new Comparison(el);

        instance.destroy();
        expect(Comparison.getInstance(el)).toBeFalsy();
    });
});
