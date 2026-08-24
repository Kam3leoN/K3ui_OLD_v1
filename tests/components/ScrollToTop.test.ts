/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant ScrollToTop
 */

import { ScrollToTop } from '../../src/components/ScrollToTop';

describe('ScrollToTop', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="root" class="scroll-to-top"></div>';
        Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
        Object.defineProperty(document.documentElement, 'scrollHeight', { value: 3000, writable: true });
        Object.defineProperty(window, 'innerHeight', { value: 1000, writable: true });
        window.scrollTo = jest.fn();
    });

    it('devrait créer une instance avec les options par défaut', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new ScrollToTop(el, {});
        expect(instance).toBeDefined();
        expect(ScrollToTop.getInstance(el)).toBe(instance);
        expect(el.classList.contains('scroll-to-top')).toBe(true);
        expect(el.querySelector('.scroll-to-top__button')).toBeTruthy();
    });

    it('devrait exposer getInstance', () => {
        const el = document.getElementById('root') as HTMLElement;
        new ScrollToTop(el, {});
        expect(ScrollToTop.getInstance(el)).toBeTruthy();
    });

    it('devrait initialiser via init avec un élément', () => {
        const el = document.getElementById('root') as HTMLElement;
        const result = ScrollToTop.init(el, {});
        const instances = Array.isArray(result) ? result : [result];
        expect(instances.length).toBe(1);
        expect(ScrollToTop.getInstance(el)).toBe(instances[0]);
    });

    it('defaults devrait retourner les options par défaut', () => {
        const def = ScrollToTop.defaults;
        expect(def.threshold).toBe(80);
        expect(def.size).toBe(56);
        expect(def.scrollDuration).toBe(350);
    });

    it('devrait détruire proprement', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new ScrollToTop(el, {});
        instance.destroy();
        expect(ScrollToTop.getInstance(el)).toBeFalsy();
    });
});
