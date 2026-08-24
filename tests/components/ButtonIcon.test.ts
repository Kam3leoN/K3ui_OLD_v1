/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant ButtonIcon
 */

import { ButtonIcon } from '../../src/components/ButtonIcon';

describe('ButtonIcon', () => {
    beforeEach(() => {
        document.body.innerHTML =
            '<button class="btn-icon" id="icon-el" type="button" aria-label="Action">' +
            '<i name="star" aria-hidden="true"></i></button>';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('initialise et stocke l\'instance sur l\'élément', () => {
        const el = document.getElementById('icon-el') as HTMLElement;
        const instance = new ButtonIcon(el);

        expect(instance).toBeDefined();
        expect(ButtonIcon.getInstance(el)).toBe(instance);
    });

    test('applique les options par défaut', () => {
        expect(ButtonIcon.defaults).toBeDefined();
    });

    test('disable/enable gère l\'état désactivé', () => {
        const el = document.getElementById('icon-el') as HTMLButtonElement;
        const instance = new ButtonIcon(el);

        instance.disable();
        expect(el.disabled || el.getAttribute('aria-disabled') === 'true').toBe(true);

        instance.enable();
        expect(el.disabled).toBe(false);
    });

    test('init initialise plusieurs éléments', () => {
        document.body.innerHTML =
            '<button class="btn-icon" id="i1" aria-label="A"><i name="star"></i></button>' +
            '<button class="btn-icon" id="i2" aria-label="B"><i name="star"></i></button>';
        const els = document.querySelectorAll('.btn-icon');
        const instances = ButtonIcon.init(els as NodeListOf<HTMLElement>);

        expect(Array.isArray(instances)).toBe(true);
        expect((instances as ButtonIcon[]).length).toBe(2);
    });

    test('destroy nettoie l\'instance', () => {
        const el = document.getElementById('icon-el') as HTMLElement;
        const instance = new ButtonIcon(el);

        instance.destroy();
        expect(ButtonIcon.getInstance(el)).toBeFalsy();
    });
});
