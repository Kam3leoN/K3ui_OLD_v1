/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant Pin
 */

import { Pin } from '../../src/components/Pin';

describe('Pin', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="pin"></div>';
    });

    test('initialise et crée les inputs', () => {
        const el = document.getElementById('pin') as HTMLElement;
        const instance = new Pin(el, { length: 4 });
        expect(instance).toBeDefined();
        expect(el.querySelectorAll('.pin__digit').length).toBe(4);
    });

    test('setValue renseigne le code', () => {
        const el = document.getElementById('pin') as HTMLElement;
        const instance = new Pin(el, { length: 4 });
        instance.setValue('1234');
        expect(instance.getValue()).toBe('1234');
    });

    test('handle paste remplit plusieurs cases', () => {
        const el = document.getElementById('pin') as HTMLElement;
        const instance = new Pin(el, { length: 4, allowPaste: true });
        const first = el.querySelector('.pin__digit') as HTMLInputElement;
        const paste = new Event('paste') as ClipboardEvent;
        Object.defineProperty(paste, 'clipboardData', {
            value: { getData: () => '9876' },
        });
        first.dispatchEvent(paste);
        expect(instance.getValue()).toBe('9876');
    });

    test('validation expectedCode met la classe pin--valid', () => {
        const el = document.getElementById('pin') as HTMLElement;
        const instance = new Pin(el, { length: 4, enableValidation: true, expectedCode: '1111' });
        instance.setValue('1111');
        instance.validatePin();
        expect(el.classList.contains('pin--valid')).toBe(true);
    });
});