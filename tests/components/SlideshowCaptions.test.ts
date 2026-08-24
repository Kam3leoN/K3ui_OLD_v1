/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant SlideshowCaptions
 */

import { SlideshowCaptions } from '../../src/components/SlideshowCaptions';

describe('SlideshowCaptions', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="slideshow-el" style="width:600px;height:400px;"></div>';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('initialise et stocke l\'instance sur l\'élément', () => {
        const el = document.getElementById('slideshow-el') as HTMLElement;
        const instance = new SlideshowCaptions(el);

        expect(instance).toBeDefined();
        expect(SlideshowCaptions.getInstance(el)).toBe(instance);
    });

    test('applique les options par défaut', () => {
        expect(SlideshowCaptions.defaults).toBeDefined();
    });

    test('destroy nettoie l\'instance', () => {
        const el = document.getElementById('slideshow-el') as HTMLElement;
        const instance = new SlideshowCaptions(el);

        instance.destroy();
        expect(SlideshowCaptions.getInstance(el)).toBeFalsy();
    });
});
