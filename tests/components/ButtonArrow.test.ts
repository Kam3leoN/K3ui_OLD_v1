/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant ButtonArrow
 */

import { ButtonArrow } from '../../src/components/ButtonArrow';

describe('ButtonArrow', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div class="btn-arrow" id="arrow-el"></div>';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('initialise et stocke l\'instance sur l\'élément', () => {
        const el = document.getElementById('arrow-el') as HTMLElement;
        const instance = new ButtonArrow(el);

        expect(instance).toBeDefined();
        expect(ButtonArrow.getInstance(el)).toBe(instance);
    });

    test('applique les options par défaut', () => {
        expect(ButtonArrow.defaults).toBeDefined();
    });

    test('init initialise plusieurs éléments', () => {
        document.body.innerHTML =
            '<div class="btn-arrow" id="a1"></div>' +
            '<div class="btn-arrow" id="a2"></div>';
        const els = document.querySelectorAll('.btn-arrow');
        const instances = ButtonArrow.init(els as NodeListOf<HTMLElement>);

        expect(Array.isArray(instances)).toBe(true);
        expect((instances as ButtonArrow[]).length).toBe(2);
    });

    test('destroy nettoie l\'instance', () => {
        const el = document.getElementById('arrow-el') as HTMLElement;
        const instance = new ButtonArrow(el);

        instance.destroy();
        expect(ButtonArrow.getInstance(el)).toBeFalsy();
    });
});
