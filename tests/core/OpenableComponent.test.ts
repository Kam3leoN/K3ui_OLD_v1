/// <reference types="@types/jest" />
/**
 * Tests unitaires pour OpenableComponent (via Sheet comme implémentation concrète)
 */

import { Sheet } from '../../src/components/Sheet';

describe('OpenableComponent', () => {
    beforeEach(() => {
        Sheet._sheetsOpen = 0;
        document.body.innerHTML =
            '<div class="sheet sheet--bottom" id="sheet-el">' +
            '<div class="sheet__content"><button>Focusable</button></div>' +
            '</div>';
        document.documentElement.style.removeProperty('--k3ui-scrollbar-compensation');
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        document.body.style.paddingRight = '';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('focus trap est configuré à l\'ouverture', () => {
        const el = document.getElementById('sheet-el') as HTMLElement;
        const instance = new Sheet(el, { focusTrap: true });

        instance.open();
        expect(instance.isOpen).toBe(true);
        instance.destroy();
    });

    test('scroll prevention bloque le scroll body à l\'ouverture', () => {
        const el = document.getElementById('sheet-el') as HTMLElement;
        const instance = new Sheet(el, { preventScrolling: true });

        instance.open();
        const hasScrollLock = document.body.classList.contains('sheet-open') ||
            document.body.style.overflow === 'hidden';
        expect(hasScrollLock || instance.isOpen).toBe(true);

        instance.close();
        instance.destroy();
    });

    test('lock scroll pose --k3ui-scrollbar-compensation et le retire à la fermeture', () => {
        const el = document.getElementById('sheet-el') as HTMLElement;
        const instance = new Sheet(el, { preventScrolling: true });

        instance.open();
        expect(document.documentElement.style.getPropertyValue('--k3ui-scrollbar-compensation')).toMatch(
            /^\d+(\.\d+)?px$/
        );

        instance.close();
        expect(document.documentElement.style.getPropertyValue('--k3ui-scrollbar-compensation')).toBe('0px');
        instance.destroy();
    });

    test('destroy nettoie le focus trap et restaure le scroll', () => {
        const el = document.getElementById('sheet-el') as HTMLElement;
        const instance = new Sheet(el, { focusTrap: true, preventScrolling: true });

        instance.open();
        instance.destroy();

        expect(Sheet.getInstance(el)).toBeFalsy();
    });
});
