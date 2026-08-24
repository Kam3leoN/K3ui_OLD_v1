/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant ButtonShape
 */

import { ButtonShape } from '../../src/components/ButtonShape';

describe('ButtonShape', () => {
    beforeEach(() => {
        document.body.innerHTML =
            '<button type="button" class="btn-shape btn-shape--filled btn-shape--md" id="shape-el">' +
            '<span class="btn-shape__slot btn-shape__slot--leading" data-shape="sunny">' +
            '<i class="icon" aria-hidden="true">download</i></span>' +
            '<span class="btn-shape__label">Télécharger</span></button>';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('initialise et stocke l\'instance sur l\'élément', () => {
        const el = document.getElementById('shape-el') as HTMLElement;
        const instance = new ButtonShape(el);

        expect(instance).toBeDefined();
        expect(ButtonShape.getInstance(el)).toBe(instance);
    });

    test('applique les options par défaut', () => {
        expect(ButtonShape.defaults).toBeDefined();
        expect(ButtonShape.defaults.variant).toBe('filled');
        expect(ButtonShape.defaults.size).toBe('md');
        expect(ButtonShape.defaults.ripple).toBe(true);
        expect(ButtonShape.defaults.morph).toBe(true);
    });

    test('setVariant change la variante', () => {
        const el = document.getElementById('shape-el') as HTMLElement;
        const instance = new ButtonShape(el);

        instance.setVariant('tonal');
        expect(el.classList.contains('btn-shape--tonal')).toBe(true);
        expect(el.classList.contains('btn-shape--filled')).toBe(false);
    });

    test('setSize change la taille', () => {
        const el = document.getElementById('shape-el') as HTMLElement;
        const instance = new ButtonShape(el);

        instance.setSize('lg');
        expect(el.classList.contains('btn-shape--lg')).toBe(true);
        expect(el.classList.contains('btn-shape--md')).toBe(false);
    });

    test('destroy nettoie l\'instance', () => {
        const el = document.getElementById('shape-el') as HTMLElement;
        const instance = new ButtonShape(el);

        instance.destroy();
        expect(ButtonShape.getInstance(el)).toBeFalsy();
    });
});
