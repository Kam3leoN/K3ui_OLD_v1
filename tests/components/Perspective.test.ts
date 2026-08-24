/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant Perspective
 */

import { Perspective } from '../../src/components/Perspective';

function createPerspectiveDOM(): HTMLElement {
    const wrap = document.createElement('div');
    wrap.innerHTML = `
        <div class="perspective" id="perspective-root">
            <section class="perspective__slide"><div class="perspective__slide-inner">1</div></section>
            <section class="perspective__slide"><div class="perspective__slide-inner">2</div></section>
            <section class="perspective__slide"><div class="perspective__slide-inner">3</div></section>
            <span class="perspective__nav perspective__nav--prev"></span>
            <span class="perspective__nav perspective__nav--next"></span>
        </div>
    `;
    return wrap.querySelector('.perspective') as HTMLElement;
}

describe('Perspective', () => {
    let el: HTMLElement;

    beforeEach(() => {
        el = createPerspectiveDOM();
        document.body.innerHTML = '';
        document.body.appendChild(el);
    });

    test('initialise et stocke l\'instance sur l\'élément', () => {
        const instance = new Perspective(el);
        expect(instance).toBeDefined();
        expect(Perspective.getInstance(el)).toBe(instance);
        expect(instance.el).toBe(el);
    });

    test('getInstance retourne l\'instance', () => {
        const instance = new Perspective(el);
        expect(Perspective.getInstance(el)).toBe(instance);
    });

    test('defaults expose les options par défaut', () => {
        expect(Perspective.defaults).toBeDefined();
        expect(Perspective.defaults.effect).toBe('wave');
        expect(Perspective.defaults.focus).toBe(0);
        expect(Perspective.defaults.shadows.enabled).toBe(true);
        expect(Perspective.defaults.navigation.enabled).toBe(true);
        expect(Perspective.defaults.autoplay.enabled).toBe(true);
        expect(Perspective.defaults.loop.enabled).toBe(true);
    });

    test('getSlideCount retourne le nombre de slides', () => {
        const instance = new Perspective(el);
        expect(instance.getSlideCount()).toBe(3);
    });

    test('getCurrentIndex retourne l\'index courant', () => {
        const instance = new Perspective(el);
        expect(instance.getCurrentIndex()).toBe(0);
    });

    test('slide() change l\'index', () => {
        const instance = new Perspective(el);
        instance.slide(1);
        expect(instance.getCurrentIndex()).toBe(1);
        instance.slide(2);
        expect(instance.getCurrentIndex()).toBe(2);
    });

    test('next() avance d\'une slide', () => {
        const instance = new Perspective(el);
        instance.next();
        expect(instance.getCurrentIndex()).toBe(1);
        instance.next();
        expect(instance.getCurrentIndex()).toBe(2);
    });

    test('prev() recule d\'une slide', () => {
        const instance = new Perspective(el);
        instance.slide(2);
        instance.prev();
        expect(instance.getCurrentIndex()).toBe(1);
        instance.prev();
        expect(instance.getCurrentIndex()).toBe(0);
    });

    test('changeEffect met à jour l\'effet', () => {
        const instance = new Perspective(el);
        instance.changeEffect('coverflow');
        expect(instance.options.effect).toBe('coverflow');
        expect(el.classList.contains('perspective--effect-coverflow')).toBe(true);
    });

    test('toggleShadows active/désactive les ombres', () => {
        const instance = new Perspective(el);
        instance.toggleShadows(false);
        expect(instance.options.shadows.enabled).toBe(false);
        instance.toggleShadows(true);
        expect(instance.options.shadows.enabled).toBe(true);
    });

    test('toggleAutoplay active/désactive l\'autoplay', () => {
        const instance = new Perspective(el);
        instance.toggleAutoplay(false);
        expect(instance.options.autoplay.enabled).toBe(false);
        instance.toggleAutoplay(true);
        expect(instance.options.autoplay.enabled).toBe(true);
    });

    test('toggleLoop active/désactive la boucle', () => {
        const instance = new Perspective(el);
        instance.toggleLoop(false);
        expect(instance.options.loop.enabled).toBe(false);
    });

    test('toggleNavigation affiche/masque la navigation', () => {
        const instance = new Perspective(el);
        instance.toggleNavigation(false);
        expect(instance.options.navigation.enabled).toBe(false);
        instance.toggleNavigation(true);
        expect(instance.options.navigation.enabled).toBe(true);
    });

    test('destroy nettoie l\'instance', () => {
        const instance = new Perspective(el);
        instance.destroy();
        expect(Perspective.getInstance(el)).toBeFalsy();
    });

    test('init avec options personnalisées', () => {
        const instance = new Perspective(el, { effect: 'cube', focus: 1 });
        expect(instance.options.effect).toBe('cube');
        expect(instance.getCurrentIndex()).toBe(1);
    });
});
