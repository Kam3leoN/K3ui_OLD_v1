/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant Loader
 */

import { Loader } from '../../src/components/Loader';
import { LOADING_INDICATOR_SHAPE_CONTAINER_RATIO } from '../../src/specs/components/loader.specs';

describe('Loader', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div class="loading-indicator"></div>';
    });

    it('devrait créer une instance avec les options par défaut', () => {
        const el = document.querySelector('.loading-indicator') as HTMLElement;
        const instance = new Loader(el, { assetsPath: '/test/shapes/' });
        expect(instance).toBeDefined();
        expect(instance.options.size).toBe(48);
        expect(instance.options.center).toBe(true);
        expect(instance.options.container).toBe(false);
    });

    it('devrait exposer getInstance', () => {
        const el = document.querySelector('.loading-indicator') as HTMLElement;
        new Loader(el, { assetsPath: '/test/' });
        const got = Loader.getInstance(el);
        expect(got).toBeDefined();
    });

    it('devrait construire le DOM morph (svg + shape-container)', () => {
        const el = document.querySelector('.loading-indicator') as HTMLElement;
        new Loader(el, { assetsPath: '/test/', mode: 'morph' });
        expect(el.querySelector('.loading-indicator__shape-container')).toBeTruthy();
        expect(el.querySelector('.loading-indicator__svg')).toBeTruthy();
        expect(el.querySelector('path')).toBeTruthy();
    });

    it('devrait construire le DOM cycle (wrapper + img)', () => {
        const el = document.querySelector('.loading-indicator') as HTMLElement;
        new Loader(el, { assetsPath: '/test/', mode: 'cycle' });
        expect(el.querySelector('.loading-indicator__shape-container')).toBeTruthy();
        expect(el.querySelector('.loading-indicator__wrapper')).toBeTruthy();
        expect(el.querySelector('.loading-indicator__shape')).toBeTruthy();
    });

    it('variante contained — classe CSS loading-indicator--container', () => {
        const el = document.querySelector('.loading-indicator') as HTMLElement;
        new Loader(el, { assetsPath: '/test/', container: true });
        expect(el.classList.contains('loading-indicator--container')).toBe(true);
    });

    it('variante default — sans classe container', () => {
        const el = document.querySelector('.loading-indicator') as HTMLElement;
        new Loader(el, { assetsPath: '/test/', container: false });
        expect(el.classList.contains('loading-indicator--container')).toBe(false);
    });

    it('setSize respecte le ratio shape/container 42/48', () => {
        const el = document.querySelector('.loading-indicator') as HTMLElement;
        const instance = new Loader(el, { assetsPath: '/test/' });
        instance.setSize(96);
        expect(instance.options.size).toBe(96);
        const shapeContainer = el.querySelector('.loading-indicator__shape-container') as HTMLElement;
        expect(shapeContainer).toBeTruthy();
        const expected = Math.round(96 * LOADING_INDICATOR_SHAPE_CONTAINER_RATIO);
        expect(shapeContainer.style.width).toBe(`${expected}px`);
    });

    it('stop puis start redémarre', () => {
        const el = document.querySelector('.loading-indicator') as HTMLElement;
        const instance = new Loader(el, { assetsPath: '/test/' });
        instance.stop();
        expect(instance.options.paused).toBe(true);
        instance.start();
        expect(instance.options.paused).toBe(false);
    });

    it('setProgress accepte 0..1', () => {
        const el = document.querySelector('.loading-indicator') as HTMLElement;
        const instance = new Loader(el, { assetsPath: '/test/' });
        instance.setProgress(0.42);
        expect(instance.options.progress).toBe(0.42);
        instance.setProgress(null);
        expect(instance.options.progress).toBeNull();
    });

    it('devrait détruire proprement', () => {
        const el = document.querySelector('.loading-indicator') as HTMLElement;
        const instance = new Loader(el, { assetsPath: '/test/' });
        instance.destroy();
        expect(Loader.getInstance(el)).toBeFalsy();
    });
});
