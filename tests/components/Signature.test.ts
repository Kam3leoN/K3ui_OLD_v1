/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant Signature
 */

import { Signature } from '../../src/extensions/generators/signature/Signature';

describe('Signature', () => {
    beforeEach(() => {
        document.body.innerHTML = '<canvas id="sig-el" width="400" height="200"></canvas>';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('initialise et stocke l\'instance sur l\'élément', () => {
        const el = document.getElementById('sig-el') as HTMLElement;
        const instance = new Signature(el);

        expect(instance).toBeDefined();
        expect(Signature.getInstance(el)).toBe(instance);
    });

    test('applique les options par défaut', () => {
        expect(Signature.defaults).toBeDefined();
    });

    test('isEmpty retourne true au départ', () => {
        const el = document.getElementById('sig-el') as HTMLElement;
        const instance = new Signature(el);

        expect(instance.isEmpty()).toBe(true);
    });

    test('clear vide le canvas', () => {
        const el = document.getElementById('sig-el') as HTMLElement;
        const instance = new Signature(el);

        instance.clear();
        expect(instance.isEmpty()).toBe(true);
    });

    test('toData retourne un tableau', () => {
        const el = document.getElementById('sig-el') as HTMLElement;
        const instance = new Signature(el);

        expect(Array.isArray(instance.toData())).toBe(true);
    });

    test('destroy nettoie l\'instance', () => {
        const el = document.getElementById('sig-el') as HTMLElement;
        const instance = new Signature(el);

        instance.destroy();
        expect(Signature.getInstance(el)).toBeFalsy();
    });
});
