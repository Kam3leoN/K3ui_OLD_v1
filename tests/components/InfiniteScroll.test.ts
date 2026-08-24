/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant InfiniteScroll
 */

import { InfiniteScroll } from '../../src/components/InfiniteScroll';

describe('InfiniteScroll', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div class="infinite-scroll" id="inf-el"></div>';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('initialise et stocke l\'instance sur l\'élément', () => {
        const el = document.getElementById('inf-el') as HTMLElement;
        const instance = new InfiniteScroll(el);

        expect(instance).toBeDefined();
        expect(InfiniteScroll.getInstance(el)).toBe(instance);
    });

    test('applique les options par défaut', () => {
        expect(InfiniteScroll.defaults).toBeDefined();
    });

    test('getCurrentPage retourne un nombre', () => {
        const el = document.getElementById('inf-el') as HTMLElement;
        const instance = new InfiniteScroll(el);

        expect(typeof instance.getCurrentPage()).toBe('number');
    });

    test('isLastPage retourne un booléen', () => {
        const el = document.getElementById('inf-el') as HTMLElement;
        const instance = new InfiniteScroll(el);

        expect(typeof instance.isLastPage()).toBe('boolean');
    });

    test('destroy nettoie l\'instance', () => {
        const el = document.getElementById('inf-el') as HTMLElement;
        const instance = new InfiniteScroll(el);

        instance.destroy();
        expect(InfiniteScroll.getInstance(el)).toBeFalsy();
    });
});
