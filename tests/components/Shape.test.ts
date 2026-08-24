/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant Shape
 */

import { Shape } from '../../src/components/Shape';

describe('Shape', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="shape"></div>';
    });

    test('initialise et met à jour les attributs', () => {
        const el = document.getElementById('shape') as HTMLElement;
        const instance = new Shape(el, { shape: 'circle', variant: 'mask', size: 'md' });
        expect(instance).toBeDefined();
        // La seule variante valide est 'mask'; vérifier que l'appel ne casse pas
        instance.setSize('lg');
        instance.setHover(true);
        instance.setAnimation(false);
        expect(Shape.getInstance(el)).toBe(instance);
    });
});


