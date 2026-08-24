/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant Pagination
 */

import { Pagination } from '../../src/components/Pagination';

describe('Pagination', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div class="pagination" id="pag-el"></div>';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('initialise et stocke l\'instance sur l\'élément', () => {
        const el = document.getElementById('pag-el') as HTMLElement;
        const instance = new Pagination(el, { totalItems: 100, itemsPerPage: 10 });

        expect(instance).toBeDefined();
        expect(Pagination.getInstance(el)).toBe(instance);
    });

    test('applique les options par défaut', () => {
        expect(Pagination.defaults).toBeDefined();
    });

    test('updateOptions met à jour les options', () => {
        const el = document.getElementById('pag-el') as HTMLElement;
        const instance = new Pagination(el, { totalItems: 100, itemsPerPage: 10 });

        instance.updateOptions({ itemsPerPage: 20 });
        expect(instance.options.itemsPerPage).toBe(20);
    });

    test('destroy nettoie l\'instance', () => {
        const el = document.getElementById('pag-el') as HTMLElement;
        const instance = new Pagination(el, { totalItems: 100, itemsPerPage: 10 });

        instance.destroy();
        expect(Pagination.getInstance(el)).toBeFalsy();
    });
});
