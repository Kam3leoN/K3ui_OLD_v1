/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant ButtonPad
 */

import { ButtonPad } from '../../src/components/ButtonPad';

describe('ButtonPad', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div class="btn-pad" id="pad-el"></div>';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('initialise et stocke l\'instance sur l\'élément', () => {
        const el = document.getElementById('pad-el') as HTMLElement;
        const instance = new ButtonPad(el);

        expect(instance).toBeDefined();
        expect(ButtonPad.getInstance(el)).toBe(instance);
    });

    test('applique les options par défaut', () => {
        expect(ButtonPad.defaults).toBeDefined();
    });

    test('init initialise plusieurs éléments', () => {
        document.body.innerHTML =
            '<div class="btn-pad" id="p1"></div>' +
            '<div class="btn-pad" id="p2"></div>';
        const els = document.querySelectorAll('.btn-pad');
        const instances = ButtonPad.init(els as NodeListOf<HTMLElement>);

        expect(Array.isArray(instances)).toBe(true);
        expect((instances as ButtonPad[]).length).toBe(2);
    });

    test('destroy nettoie l\'instance', () => {
        const el = document.getElementById('pad-el') as HTMLElement;
        const instance = new ButtonPad(el);

        instance.destroy();
        expect(ButtonPad.getInstance(el)).toBeFalsy();
    });
});
