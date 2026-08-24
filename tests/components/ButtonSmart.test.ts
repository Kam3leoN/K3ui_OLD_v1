/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant ButtonSmart
 */

import { ButtonSmart } from '../../src/components/ButtonSmart';

describe('ButtonSmart', () => {
    beforeEach(() => {
        document.body.innerHTML = '<button class="btn-smart" id="smart-el" type="button">Smart</button>';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('initialise et stocke l\'instance sur l\'élément', () => {
        const el = document.getElementById('smart-el') as HTMLElement;
        const instance = new ButtonSmart(el);

        expect(instance).toBeDefined();
        expect(ButtonSmart.getInstance(el)).toBe(instance);
    });

    test('applique les options par défaut', () => {
        expect(ButtonSmart.defaults).toBeDefined();
    });

    test('isActive retourne un booléen', () => {
        const el = document.getElementById('smart-el') as HTMLElement;
        const instance = new ButtonSmart(el);

        expect(typeof instance.isActive()).toBe('boolean');
    });

    test('toggle change l\'état actif', () => {
        const el = document.getElementById('smart-el') as HTMLElement;
        const instance = new ButtonSmart(el);

        const before = instance.isActive();
        instance.toggle();
        expect(instance.isActive()).toBe(!before);
    });

    test('init initialise plusieurs éléments', () => {
        document.body.innerHTML =
            '<button class="btn-smart" id="s1">A</button>' +
            '<button class="btn-smart" id="s2">B</button>';
        const els = document.querySelectorAll('.btn-smart');
        const instances = ButtonSmart.init(els as NodeListOf<HTMLElement>);

        expect(Array.isArray(instances)).toBe(true);
        expect((instances as ButtonSmart[]).length).toBe(2);
    });

    test('destroy nettoie l\'instance', () => {
        const el = document.getElementById('smart-el') as HTMLElement;
        const instance = new ButtonSmart(el);

        instance.destroy();
        expect(ButtonSmart.getInstance(el)).toBeFalsy();
    });
});
