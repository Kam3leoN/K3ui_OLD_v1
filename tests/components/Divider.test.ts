/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant Divider
 */

import { Divider } from '../../src/components/Divider';

describe('Divider', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div class="divider" id="divider-el"></div>';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('initialise et stocke l\'instance sur l\'élément', () => {
        const el = document.getElementById('divider-el') as HTMLElement;
        const instance = new Divider(el);

        expect(instance).toBeDefined();
        expect(Divider.getInstance(el)).toBe(instance);
        expect(el.classList.contains('divider')).toBe(true);
    });

    test('applique le texte via options', () => {
        const el = document.getElementById('divider-el') as HTMLElement;
        new Divider(el, { text: 'OR' });

        expect(el.textContent).toBe('OR');
    });

    test('applique le texte via attribut text', () => {
        const el = document.getElementById('divider-el') as HTMLElement;
        el.setAttribute('text', 'OU');
        new Divider(el);

        expect(el.textContent).toBe('OU');
    });

    test('applique orientation verticale (trait vertical)', () => {
        const el = document.getElementById('divider-el') as HTMLElement;
        new Divider(el, { orientation: 'vertical' });

        expect(el.classList.contains('divider--horizontal')).toBe(true);
        expect(el.getAttribute('aria-orientation')).toBe('vertical');
    });

    test('applique les options par défaut', () => {
        expect(Divider.defaults).toBeDefined();
        expect(Divider.defaults.orientation).toBe('horizontal');
    });

    test('init initialise plusieurs éléments', () => {
        document.body.innerHTML =
            '<div class="divider" id="d1"></div>' +
            '<div class="divider" id="d2"></div>';
        const els = document.querySelectorAll('.divider');
        const instances = Divider.init(els as NodeListOf<HTMLElement>);

        expect(Array.isArray(instances)).toBe(true);
        expect((instances as Divider[]).length).toBe(2);
    });

    test('destroy nettoie l\'instance', () => {
        const el = document.getElementById('divider-el') as HTMLElement;
        const instance = new Divider(el);

        instance.destroy();
        expect(Divider.getInstance(el)).toBeFalsy();
        expect(el.getAttribute('role')).toBeNull();
    });
});
