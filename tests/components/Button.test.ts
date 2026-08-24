/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant Button
 */

import { Button } from '../../src/components/Button';

describe('Button', () => {
    beforeEach(() => {
        document.body.innerHTML = '<button class="btn" id="btn-el" type="button">Click</button>';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('initialise et stocke l\'instance sur l\'élément', () => {
        const el = document.getElementById('btn-el') as HTMLElement;
        const instance = new Button(el);

        expect(instance).toBeDefined();
        expect(Button.getInstance(el)).toBe(instance);
    });

    test('applique les options par défaut', () => {
        const defaults = Button.defaults;
        expect(defaults).toBeDefined();
    });

    test('setLoading active le mode chargement', () => {
        const el = document.getElementById('btn-el') as HTMLElement;
        const instance = new Button(el);

        instance.setLoading(true);
        expect(el.classList.contains('btn--loading') || el.getAttribute('aria-busy') === 'true').toBe(true);
    });

    test('disable/enable gère l\'état désactivé', () => {
        const el = document.getElementById('btn-el') as HTMLButtonElement;
        const instance = new Button(el);

        instance.disable();
        expect(el.disabled || el.getAttribute('aria-disabled') === 'true').toBe(true);

        instance.enable();
        expect(el.disabled).toBe(false);
    });

    test('init initialise plusieurs éléments', () => {
        document.body.innerHTML =
            '<button class="btn" id="b1">A</button>' +
            '<button class="btn" id="b2">B</button>';
        const els = document.querySelectorAll('.btn');
        const instances = Button.init(els as NodeListOf<HTMLElement>);

        expect(Array.isArray(instances)).toBe(true);
        expect((instances as Button[]).length).toBe(2);
    });

    test('destroy nettoie l\'instance', () => {
        const el = document.getElementById('btn-el') as HTMLElement;
        const instance = new Button(el);

        instance.destroy();
        expect(Button.getInstance(el)).toBeFalsy();
    });
});
