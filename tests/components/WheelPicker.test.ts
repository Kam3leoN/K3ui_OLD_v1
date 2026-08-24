/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant WheelPicker
 */

import { WheelPicker } from '../../src/components/WheelPicker';

describe('WheelPicker', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div class="wheel-picker" id="wp-el"></div>';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('initialise et stocke l\'instance sur l\'élément', () => {
        const el = document.getElementById('wp-el') as HTMLElement;
        const instance = new WheelPicker(el);

        expect(instance).toBeDefined();
        expect(WheelPicker.getInstance(el)).toBe(instance);
    });

    test('applique les options par défaut', () => {
        expect(WheelPicker.defaults).toBeDefined();
    });

    test('getValue retourne une valeur', () => {
        const el = document.getElementById('wp-el') as HTMLElement;
        const instance = new WheelPicker(el);

        expect(typeof instance.getValue()).toBe('string');
    });

    test('destroy nettoie l\'instance', () => {
        const el = document.getElementById('wp-el') as HTMLElement;
        const instance = new WheelPicker(el);

        instance.destroy();
        expect(WheelPicker.getInstance(el)).toBeFalsy();
    });
});
