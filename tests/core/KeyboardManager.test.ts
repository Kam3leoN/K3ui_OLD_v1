/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le KeyboardManager
 */

import { Keyboard } from '../../src/core/managers/KeyboardManager';

describe('Keyboard', () => {
    let keyboard: Keyboard;

    afterEach(() => {
        if (keyboard) keyboard.destroy();
    });

    test('crée une instance avec les options par défaut', () => {
        keyboard = new Keyboard();
        expect(keyboard).toBeDefined();
    });

    test('onKey enregistre un callback pour une touche', () => {
        keyboard = new Keyboard();
        const id = keyboard.onKey('Enter', jest.fn());

        expect(typeof id).toBe('string');
    });

    test('offKey désactive un callback', () => {
        keyboard = new Keyboard();
        const id = keyboard.onKey('Enter', jest.fn());

        expect(() => keyboard.offKey(id)).not.toThrow();
    });

    test('setEnabled active/désactive le gestionnaire', () => {
        keyboard = new Keyboard();

        expect(() => keyboard.setEnabled(false)).not.toThrow();
        expect(() => keyboard.setEnabled(true)).not.toThrow();
    });

    test('destroy nettoie le gestionnaire', () => {
        keyboard = new Keyboard();

        expect(() => keyboard.destroy()).not.toThrow();
    });

    test('callback onKeyDown est appelé', () => {
        const onKeyDown = jest.fn();
        keyboard = new Keyboard({ onKeyDown });

        const event = new KeyboardEvent('keydown', { key: 'a' });
        document.dispatchEvent(event);

        expect(onKeyDown).toHaveBeenCalled();
    });
});
