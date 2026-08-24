/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant ProgressIndicator
 */

import { ProgressIndicator } from '../../src/components/ProgressIndicator';

describe('ProgressIndicator', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div class="progress-indicator" id="prog-el"></div>';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('initialise et stocke l\'instance sur l\'élément', () => {
        const el = document.getElementById('prog-el') as HTMLElement;
        const instance = new ProgressIndicator(el);

        expect(instance).toBeDefined();
        expect(ProgressIndicator.getInstance(el)).toBe(instance);
    });

    test('applique les options par défaut', () => {
        expect(ProgressIndicator.defaults).toBeDefined();
    });

    test('getValue retourne un nombre', () => {
        const el = document.getElementById('prog-el') as HTMLElement;
        const instance = new ProgressIndicator(el);

        expect(typeof instance.getValue()).toBe('number');
    });

    test('update met à jour la progression', () => {
        const el = document.getElementById('prog-el') as HTMLElement;
        const instance = new ProgressIndicator(el);

        expect(() => instance.update(50)).not.toThrow();
    });

    test('destroy nettoie l\'instance', () => {
        const el = document.getElementById('prog-el') as HTMLElement;
        const instance = new ProgressIndicator(el);

        instance.destroy();
        expect(ProgressIndicator.getInstance(el)).toBeFalsy();
    });
});
