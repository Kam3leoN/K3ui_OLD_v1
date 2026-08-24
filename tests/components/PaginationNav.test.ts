/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant PaginationNav
 */

import { PaginationNav } from '../../src/components/PaginationNav';

describe('PaginationNav', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div class="pagination-nav" id="pnav-el"></div>';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('initialise et stocke l\'instance sur l\'élément', () => {
        const el = document.getElementById('pnav-el') as HTMLElement;
        const instance = new PaginationNav(el, { totalItems: 50, itemsPerPage: 10 });

        expect(instance).toBeDefined();
        expect(PaginationNav.getInstance(el)).toBe(instance);
    });

    test('applique les options par défaut', () => {
        expect(PaginationNav.defaults).toBeDefined();
    });

    test('updateOptions met à jour les options', () => {
        const el = document.getElementById('pnav-el') as HTMLElement;
        const instance = new PaginationNav(el, { totalItems: 50, itemsPerPage: 10 });

        instance.updateOptions({ itemsPerPage: 25 });
        expect(instance.options.itemsPerPage).toBe(25);
    });

    test('destroy nettoie l\'instance', () => {
        const el = document.getElementById('pnav-el') as HTMLElement;
        const instance = new PaginationNav(el, { totalItems: 50, itemsPerPage: 10 });

        instance.destroy();
        expect(PaginationNav.getInstance(el)).toBeFalsy();
    });
});
