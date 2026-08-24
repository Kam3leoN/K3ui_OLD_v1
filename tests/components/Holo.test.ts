/// <reference types="@types/jest" />

import { Holo } from '../../src/extensions/effects/holo/Holo';
import { flushComponentInit } from '../helpers/component-init';

describe('Holo', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    test('devrait créer une instance sur un conteneur .holo', async () => {
        document.body.innerHTML = `
            <div class="holo" id="holo-root" data-variant="rayon">
                <div class="holo__content"><img src="x.jpg" alt="Test"></div>
            </div>
        `;

        const el = document.getElementById('holo-root') as HTMLElement;
        const instance = new Holo(el);
        await flushComponentInit();

        expect(instance).toBeDefined();
        expect(instance.options.variant).toBe('rayon');
        expect(el.getAttribute('data-variant')).toBe('rayon');
        expect(el.querySelector('.holo__tilt')).not.toBeNull();
        expect(el.querySelector('.holo__shine')).not.toBeNull();
        expect(el.querySelector('.holo__glitter')).not.toBeNull();
        expect(el.querySelector('.holo__glare')).not.toBeNull();
        expect(el.querySelector('.holo__glare2')).not.toBeNull();
        expect(el.style.getPropertyValue('--mask')).toBe('none');
        expect(el.style.getPropertyValue('--foil')).toBe('var(--birthday)');
        expect(el.style.getPropertyValue('--grain')).toContain('grain.webp');
        expect(el.classList.contains('holo--masked')).toBe(false);
        expect(Holo.getInstance(el)).toBe(instance);
    });

    test('devrait envelopper automatiquement un élément avec data-holo', async () => {
        document.body.innerHTML =
            '<img id="img-holo" src="x.jpg" alt="Test" data-holo data-holo-variant="space">';

        const img = document.getElementById('img-holo') as HTMLElement;
        const instance = new Holo(img);
        await flushComponentInit();

        const wrapper = img.closest('.holo') as HTMLElement;
        expect(wrapper?.classList.contains('holo')).toBe(true);
        expect(wrapper?.getAttribute('data-variant')).toBe('space');
        expect(wrapper?.querySelector('.holo__tilt > .holo__content')).not.toBeNull();
        expect(wrapper?.querySelector('.holo__shine')).not.toBeNull();
        expect(Holo.getInstance(wrapper)).toBe(instance);
    });

    test('devrait normaliser les alias de variantes', async () => {
        document.body.innerHTML = `
            <div class="holo" id="holo-rainbow" data-variant="rare rainbow alt">
                <div class="holo__content"><img src="x.jpg" alt="Test"></div>
            </div>
        `;

        const el = document.getElementById('holo-rainbow') as HTMLElement;
        const instance = new Holo(el);
        await flushComponentInit();

        expect(instance.options.variant).toBe('rainbow');
        expect(el.style.getPropertyValue('--mask')).toBe('none');
    });

    test('devrait accepter les anciens identifiants double-rare et hyper-rare', async () => {
        document.body.innerHTML = `
            <div class="holo" id="holo-legacy" data-variant="hyper-rare">
                <div class="holo__content"><img src="legacy.jpg" alt="Test"></div>
            </div>
        `;

        const el = document.getElementById('holo-legacy') as HTMLElement;
        const instance = new Holo(el);
        await flushComponentInit();

        expect(instance.options.variant).toBe('space');
        expect(el.getAttribute('data-variant')).toBe('space');
    });

    test('data-holo auto-wrap — structure tilt/content + 4 couches', async () => {
        document.body.innerHTML =
            '<img id="img-holo-wrap" src="wrap.jpg" alt="Test" data-holo data-holo-variant="rainbow">';

        const img = document.getElementById('img-holo-wrap') as HTMLImageElement;
        const instance = new Holo(img);
        await flushComponentInit();

        const wrapper = img.closest('.holo') as HTMLElement;
        expect(wrapper).not.toBeNull();
        expect(wrapper.querySelectorAll(':scope > .holo__tilt')).toHaveLength(1);
        expect(wrapper.querySelectorAll('.holo__tilt > .holo__content')).toHaveLength(1);
        expect(wrapper.querySelector('.holo__content > img')).toBe(img);
        expect(wrapper.querySelectorAll('.holo__shine')).toHaveLength(1);
        expect(wrapper.querySelectorAll('.holo__glitter')).toHaveLength(1);
        expect(instance.options.variant).toBe('rainbow');
        expect(Holo.getInstance(wrapper)).toBe(instance);
    });
});
