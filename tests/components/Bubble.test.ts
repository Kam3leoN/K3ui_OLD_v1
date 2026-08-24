/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant Bubble
 */

import { Bubble } from '../../src/components/Bubble';

describe('Bubble', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div class="bubble" id="bubble-el">Contenu</div>';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('initialise et stocke l\'instance sur l\'élément', () => {
        const el = document.getElementById('bubble-el') as HTMLElement;
        const instance = new Bubble(el);

        expect(instance).toBeDefined();
        expect(Bubble.getInstance(el)).toBe(instance);
    });

    test('applique les options par défaut', () => {
        expect(Bubble.defaults).toBeDefined();
    });

    test('init initialise plusieurs éléments', () => {
        document.body.innerHTML =
            '<div class="bubble" id="b1">A</div>' +
            '<div class="bubble" id="b2">B</div>';
        const els = document.querySelectorAll('.bubble');
        const instances = Bubble.init(els as NodeListOf<HTMLElement>);

        expect(Array.isArray(instances)).toBe(true);
        expect((instances as Bubble[]).length).toBe(2);
    });

    test('destroy nettoie l\'instance', () => {
        const el = document.getElementById('bubble-el') as HTMLElement;
        const instance = new Bubble(el);

        instance.destroy();
        expect(Bubble.getInstance(el)).toBeFalsy();
    });
});
