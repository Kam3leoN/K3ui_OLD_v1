/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant MessageBox
 */

import { MessageBox } from '../../src/components/MessageBox';

describe('MessageBox', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div class="messagebox" id="msgbox-el"></div>';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('initialise et stocke l\'instance sur l\'élément', () => {
        const el = document.getElementById('msgbox-el') as HTMLElement;
        const instance = new MessageBox(el);

        expect(instance).toBeDefined();
        expect(MessageBox.getInstance(el)).toBe(instance);
    });

    test('applique les options par défaut', () => {
        expect(MessageBox.defaults).toBeDefined();
    });

    test('hide masque le composant', () => {
        const el = document.getElementById('msgbox-el') as HTMLElement;
        const instance = new MessageBox(el);

        expect(() => instance.hide()).not.toThrow();
    });

    test('destroy nettoie l\'instance', () => {
        const el = document.getElementById('msgbox-el') as HTMLElement;
        const instance = new MessageBox(el);

        instance.destroy();
        expect(MessageBox.getInstance(el)).toBeFalsy();
    });
});
