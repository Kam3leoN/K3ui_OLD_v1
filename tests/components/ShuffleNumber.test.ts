/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant ShuffleNumber
 */

import { ShuffleNumber } from '../../src/components/ShuffleNumber';
import { SHUFFLE_NUMBER_CSS } from '../../src/utils/effects/shuffleNumber';

describe('ShuffleNumber', () => {
    beforeEach(() => {
        document.body.innerHTML = '<span id="label"></span>';
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('devrait initialiser avec le texte initial', () => {
        const el = document.getElementById('label') as HTMLElement;
        const instance = new ShuffleNumber(el, { text: 'Copy' });

        expect(instance).toBeDefined();
        expect(ShuffleNumber.getInstance(el)).toBe(instance);
        expect(instance.getValue()).toBe('Copy');
        expect(el.classList.contains('shuffle-number')).toBe(true);
        expect(el.querySelector(`.${SHUFFLE_NUMBER_CSS.char}`)).toBeTruthy();
    });

    it('devrait lire data-text à l\'initialisation', () => {
        const el = document.getElementById('label') as HTMLElement;
        el.setAttribute('data-text', 'Save');
        const instance = new ShuffleNumber(el);

        expect(instance.getValue()).toBe('Save');
    });

    it('devrait formater et animer une valeur numérique via update()', () => {
        const el = document.getElementById('label') as HTMLElement;
        const instance = new ShuffleNumber(el, {
            value: 100,
            locales: 'en-US',
            format: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 },
        });

        expect(instance.getNumber()).toBe(100);
        expect(instance.getValue()).toContain('100');

        instance.update(250);
        expect(instance.getNumber()).toBe(250);
        expect(instance.getValue()).toContain('250');
    });

    it('devrait mettre à jour le texte avec set()', () => {
        const el = document.getElementById('label') as HTMLElement;
        const instance = new ShuffleNumber(el, { text: 'Copy' });

        instance.set('Copied');
        expect(instance.getValue()).toBe('Copied');
    });

    it('devrait revenir au texte précédent après flash()', () => {
        const el = document.getElementById('label') as HTMLElement;
        const instance = new ShuffleNumber(el, { text: 'Copy', revertAfter: 500 });

        instance.flash('Copied');
        expect(instance.getValue()).toBe('Copied');

        jest.advanceTimersByTime(500);
        expect(instance.getValue()).toBe('Copy');
    });

    it('devrait exposer chromatic en statique', () => {
        const fn = ShuffleNumber.chromatic({ from: 0 });
        expect(typeof fn).toBe('function');
        expect(fn(0, 3)).toMatch(/^hsl\(/);
    });

    it('devrait détruire proprement l\'instance', () => {
        const el = document.getElementById('label') as HTMLElement;
        const instance = new ShuffleNumber(el, { text: 'Done' });

        instance.destroy();
        expect(ShuffleNumber.getInstance(el)).toBeFalsy();
        expect(el.textContent).toBe('Done');
    });
});
