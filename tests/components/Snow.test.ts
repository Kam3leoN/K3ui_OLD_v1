/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant Snow
 */

import { Snow } from '../../src/extensions/effects/snow/Snow';

describe('Snow', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="snow-el" style="width:400px;height:400px;"></div>';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('initialise et stocke l\'instance sur l\'élément', () => {
        const el = document.getElementById('snow-el') as HTMLElement;
        const instance = new Snow(el);

        expect(instance).toBeDefined();
        expect(Snow.getInstance(el)).toBe(instance);
    });

    test('applique les options par défaut', () => {
        expect(Snow.defaults).toBeDefined();
    });

    test('isAnimating retourne un booléen', () => {
        const el = document.getElementById('snow-el') as HTMLElement;
        const instance = new Snow(el);

        expect(typeof instance.isAnimating).toBe('boolean');
    });

    test('stop arrête l\'animation', () => {
        const el = document.getElementById('snow-el') as HTMLElement;
        const instance = new Snow(el);

        instance.stop();
        expect(instance.isAnimating).toBe(false);
    });

    test('destroy nettoie l\'instance', () => {
        const el = document.getElementById('snow-el') as HTMLElement;
        const instance = new Snow(el);

        instance.destroy();
        expect(Snow.getInstance(el)).toBeFalsy();
    });
});
