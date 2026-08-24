/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant Snackbar
 */

import { Snackbar } from '../../src/components/Snackbar';
import { getAriaAttribute } from '../../src/utils/dom/aria';

describe('Snackbar', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="snack"></div>';
        jest.useFakeTimers();
        Snackbar.clear();
    });

    afterEach(() => {
        Snackbar.clear();
        jest.useRealTimers();
    });

    test('ouvre et ferme le snackbar', () => {
        const el = document.getElementById('snack') as HTMLElement;
        const instance = new Snackbar(el, { text: 'Hello', duration: 5000, showImmediately: true });
        instance.open();
        expect(el.classList.contains('show')).toBe(true);
        instance.close();
        jest.advanceTimersByTime(1000);
        expect(Snackbar.getInstance(el)).toBeUndefined();
    });

    test('API statique show ne jette pas', () => {
        expect(() => Snackbar.show({ text: 'Hi' })).not.toThrow();
    });

    test('getInstance ne crée pas d\'instance implicite', () => {
        const el = document.getElementById('snack') as HTMLElement;
        expect(Snackbar.getInstance(el)).toBeUndefined();
    });

    test('updateText modifie le contenu et la classe de lignes', () => {
        const el = document.getElementById('snack') as HTMLElement;
        const instance = new Snackbar(el, { text: 'short', maxCharsPerLine: 5 });
        instance.updateText('a very very long text to wrap');
        const textEl = el.querySelector('.snackbar__text') as HTMLElement;
        expect(textEl.textContent).toContain('long text');
    });

    test('échappe le HTML dans le texte', () => {
        const el = document.getElementById('snack') as HTMLElement;
        const instance = new Snackbar(el, { text: '<script>x</script>' });
        const textEl = el.querySelector('.snackbar__text') as HTMLElement;
        expect(textEl.textContent).toBe('<script>x</script>');
        expect(textEl.innerHTML).not.toContain('<script>');
        instance.destroy();
    });

    test('expose role alert sur le snackbar', () => {
        const el = document.getElementById('snack') as HTMLElement;
        const instance = new Snackbar(el, { text: 'Alerte' });
        expect(getAriaAttribute(el, 'role')).toBe('alert');
        instance.destroy();
    });

    test('portal aria-live pour la pile de snackbars', () => {
        Snackbar.show({ text: 'Un' });
        const portal = document.getElementById('k3ui-snackbar-portal');
        expect(portal).toBeTruthy();
        expect(portal?.getAttribute('aria-live')).toBe('polite');
    });

    test('defaults incluent callbacks et hapticFeedback', () => {
        expect(Snackbar.defaults.onOpenStart).toBeNull();
        expect(Snackbar.defaults.hapticFeedback).toBe(true);
        expect(Snackbar.defaults.maxSnackbars).toBe(3);
    });
});
