/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant ColorPicker
 */

import { ColorPicker } from '../../src/components/ColorPicker';

describe('ColorPicker', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div class="color-picker" id="cp-el"></div>';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('initialise et stocke l\'instance sur l\'élément', () => {
        const el = document.getElementById('cp-el') as HTMLElement;
        const instance = new ColorPicker(el);

        expect(instance).toBeDefined();
        expect(ColorPicker.getInstance(el)).toBe(instance);
    });

    test('applique les options par défaut', () => {
        expect(ColorPicker.defaults).toBeDefined();
    });

    test('getValue retourne une valeur', () => {
        const el = document.getElementById('cp-el') as HTMLElement;
        const instance = new ColorPicker(el);

        expect(typeof instance.getValue()).toBe('string');
    });

    test('setValue met à jour la valeur', () => {
        const el = document.getElementById('cp-el') as HTMLElement;
        const instance = new ColorPicker(el);

        instance.setValue('#ff0000');
        expect(instance.getValue().toLowerCase()).toContain('ff0000');
    });

    test('destroy nettoie l\'instance', () => {
        const el = document.getElementById('cp-el') as HTMLElement;
        const instance = new ColorPicker(el);

        instance.destroy();
        expect(ColorPicker.getInstance(el)).toBeFalsy();
    });
});
