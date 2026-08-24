/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant Confetti
 */

import { Confetti } from '../../src/extensions/effects/confetti/Confetti';

describe('Confetti', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="confetti-el" style="width:400px;height:400px;"></div>';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('initialise et stocke l\'instance sur l\'élément', () => {
        const el = document.getElementById('confetti-el') as HTMLElement;
        const instance = new Confetti(el);

        expect(instance).toBeDefined();
        expect(Confetti.getInstance(el)).toBe(instance);
    });

    test('applique les options par défaut', () => {
        expect(Confetti.defaults).toBeDefined();
    });

    test('reset réinitialise l\'état', () => {
        const el = document.getElementById('confetti-el') as HTMLElement;
        const instance = new Confetti(el);

        expect(() => instance.reset()).not.toThrow();
    });

    test('destroy nettoie l\'instance', () => {
        const el = document.getElementById('confetti-el') as HTMLElement;
        const instance = new Confetti(el);

        instance.destroy();
        expect(Confetti.getInstance(el)).toBeFalsy();
    });
});
