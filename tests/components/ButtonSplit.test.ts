/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant ButtonSplit
 */

import { ButtonSplit } from '../../src/components/ButtonSplit';

describe('ButtonSplit', () => {
    beforeEach(() => {
        document.body.innerHTML =
            '<div class="split-btn" id="split-el">' +
            '<button class="split-btn__primary" type="button">Action</button>' +
            '<button class="split-btn__toggle" type="button" aria-label="Plus d\'options"></button>' +
            '</div>';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('initialise et stocke l\'instance sur l\'élément', () => {
        const el = document.getElementById('split-el') as HTMLElement;
        const instance = new ButtonSplit(el);

        expect(instance).toBeDefined();
        expect(ButtonSplit.getInstance(el)).toBe(instance);
    });

    test('applique les options par défaut', () => {
        expect(ButtonSplit.defaults).toBeDefined();
    });

    test('init initialise plusieurs éléments', () => {
        document.body.innerHTML =
            '<div class="split-btn" id="sp1"><button class="split-btn__primary">A</button><button class="split-btn__toggle"></button></div>' +
            '<div class="split-btn" id="sp2"><button class="split-btn__primary">B</button><button class="split-btn__toggle"></button></div>';
        const els = document.querySelectorAll('.split-btn');
        const instances = ButtonSplit.init(els as NodeListOf<HTMLElement>);

        expect(Array.isArray(instances)).toBe(true);
        expect((instances as ButtonSplit[]).length).toBe(2);
    });

    test('destroy nettoie l\'instance', () => {
        const el = document.getElementById('split-el') as HTMLElement;
        const instance = new ButtonSplit(el);

        instance.destroy();
        expect(ButtonSplit.getInstance(el)).toBeFalsy();
    });
});
