/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant Parallax
 */

import { Parallax } from '../../src/components/Parallax';

describe('Parallax', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="px" class="parallax" style="height:200px" data-speed="0.5">
            </div>
        `;
        Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
        Object.defineProperty(window, 'innerHeight', { value: 800, writable: true });
    });

    it('devrait créer le calque .parallax__image', () => {
        const el = document.getElementById('px') as HTMLElement;
        const instance = new Parallax(el, {});
        expect(instance).toBeDefined();
        expect(el.querySelector('.parallax__image')).toBeTruthy();
        expect(el.classList.contains('parallax')).toBe(true);
    });

    it('devrait exposer getInstance via Component', () => {
        const el = document.getElementById('px') as HTMLElement;
        new Parallax(el, {});
        expect(Parallax.getInstance(el)).toBeDefined();
    });

    it('devrait initialiser via init', () => {
        const el = document.getElementById('px') as HTMLElement;
        const result = Parallax.init(el, {});
        const instances = Array.isArray(result) ? result : [result];
        expect(instances.length).toBe(1);
    });

    it('defaults devrait inclure speed, scale, engine et axis', () => {
        const def = Parallax.defaults;
        expect(def.speed).toBe(0.2);
        expect(def.bleed).toBe(0);
        expect(def.imageHeight).toBe(1.5);
        expect(def.respectReducedMotion).toBe(true);
        expect(def.engine).toBe('auto');
        expect(def.scale).toBe(1.5);
        expect(def.orientation).toBe('up');
        expect(def.axis).toBe('y');
        expect(def.strengthX).toBe(150);
        expect(def.strengthY).toBe(150);
    });

    it('devrait utiliser le moteur classique sans média', () => {
        const el = document.getElementById('px') as HTMLElement;
        const instance = new Parallax(el, { engine: 'auto' });
        expect(instance.getEngine()).toBe('classic');
    });

    it('devrait utiliser le moteur simple avec image', () => {
        const el = document.getElementById('px') as HTMLElement;
        const instance = new Parallax(el, {
            image: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        });
        expect(instance.getEngine()).toBe('simple');
    });

    it('devrait utiliser le moteur pointer avec data-depth', () => {
        document.body.innerHTML = `
            <div id="scene" class="parallax">
                <div data-depth="0.4">A</div>
                <div data-depth="0.1">B</div>
            </div>
        `;
        const el = document.getElementById('scene') as HTMLElement;
        const instance = new Parallax(el, {});
        expect(instance.getEngine()).toBe('pointer');
        expect(el.classList.contains('parallax--pointer')).toBe(true);
    });

    it('devrait accepter data-axis x pour le moteur pointer', () => {
        document.body.innerHTML = `
            <div id="scene" class="parallax" data-engine="pointer" data-axis="x">
                <div data-depth="0.2">A</div>
            </div>
        `;
        const el = document.getElementById('scene') as HTMLElement;
        const instance = new Parallax(el, {});
        expect(instance.getEngine()).toBe('pointer');
        expect(instance['options'].axis).toBe('x');
    });

    it('devrait détruire sans erreur', () => {
        const el = document.getElementById('px') as HTMLElement;
        const instance = new Parallax(el, {});
        expect(() => instance.destroy()).not.toThrow();
    });
});
