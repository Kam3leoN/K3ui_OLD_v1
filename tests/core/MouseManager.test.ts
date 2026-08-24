/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le MouseManager
 */

import { Mouse } from '../../src/core/managers/MouseManager';

describe('Mouse', () => {
    let mouse: Mouse;

    afterEach(() => {
        if (mouse) mouse.destroy();
    });

    test('crée une instance avec les options par défaut', () => {
        mouse = new Mouse();
        expect(mouse).toBeDefined();
    });

    test('setEnabled active/désactive le gestionnaire', () => {
        mouse = new Mouse();

        expect(() => mouse.setEnabled(false)).not.toThrow();
        expect(() => mouse.setEnabled(true)).not.toThrow();
    });

    test('getEventXPosition retourne un nombre', () => {
        const event = new MouseEvent('click', { clientX: 100 });
        expect(typeof Mouse.getEventXPosition(event)).toBe('number');
    });

    test('getEventYPosition retourne un nombre', () => {
        const event = new MouseEvent('click', { clientY: 200 });
        expect(typeof Mouse.getEventYPosition(event)).toBe('number');
    });

    test('getDocumentScrollTop retourne un nombre', () => {
        expect(typeof Mouse.getDocumentScrollTop()).toBe('number');
    });

    test('getDocumentScrollLeft retourne un nombre', () => {
        expect(typeof Mouse.getDocumentScrollLeft()).toBe('number');
    });

    test('destroy nettoie le gestionnaire', () => {
        mouse = new Mouse();

        expect(() => mouse.destroy()).not.toThrow();
    });
});
