/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant Avatar
 */

import { Avatar } from '../../src/components/Avatar';

describe('Avatar', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div class="avatar" id="avatar-el"></div>';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('initialise et stocke l\'instance sur l\'élément', () => {
        const el = document.getElementById('avatar-el') as HTMLElement;
        const instance = new Avatar(el);

        expect(instance).toBeDefined();
        expect(Avatar.getInstance(el)).toBe(instance);
    });

    test('applique les options par défaut', () => {
        const defaults = Avatar.defaults;
        expect(defaults).toBeDefined();
    });

    test('accepte des options personnalisées', () => {
        const el = document.getElementById('avatar-el') as HTMLElement;
        const instance = new Avatar(el, { size: 'lg', shape: 'circle' });

        expect(instance).toBeDefined();
        expect(instance.options.size).toBe('lg');
    });

    test('getInitials retourne les initiales correctes', () => {
        expect(Avatar.getInitials('John Doe')).toBe('JD');
        expect(Avatar.getInitials('Alice')).toBe('A');
        expect(Avatar.getInitials(null)).toBe('');
        expect(Avatar.getInitials(undefined)).toBe('');
    });

    test('update met à jour les options', () => {
        const el = document.getElementById('avatar-el') as HTMLElement;
        const instance = new Avatar(el, { size: 'sm' });

        instance.update({ size: 'xl' });
        expect(instance.options.size).toBe('xl');
    });

    test('init initialise plusieurs éléments', () => {
        document.body.innerHTML =
            '<div class="avatar" id="a1"></div>' +
            '<div class="avatar" id="a2"></div>';
        const els = document.querySelectorAll('.avatar');
        const instances = Avatar.init(els as NodeListOf<HTMLElement>);

        expect(Array.isArray(instances)).toBe(true);
        expect((instances as Avatar[]).length).toBe(2);
    });

    test('destroy nettoie l\'instance', () => {
        const el = document.getElementById('avatar-el') as HTMLElement;
        const instance = new Avatar(el);

        instance.destroy();
        expect(Avatar.getInstance(el)).toBeFalsy();
    });
});
