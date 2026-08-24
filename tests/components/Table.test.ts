/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant Table
 */

import { Table } from '../../src/components/Table';

describe('Table', () => {
    beforeEach(() => {
        document.body.innerHTML =
            '<table id="table-el" role="table">' +
            '<thead><tr><th>Nom</th><th>Age</th></tr></thead>' +
            '<tbody><tr><td>Alice</td><td>30</td></tr><tr><td>Bob</td><td>25</td></tr></tbody>' +
            '</table>';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('initialise et stocke l\'instance sur l\'élément', () => {
        const el = document.getElementById('table-el') as HTMLElement;
        const instance = new Table(el);

        expect(instance).toBeDefined();
        expect(Table.getInstance(el)).toBe(instance);
    });

    test('applique les options par défaut', () => {
        expect(Table.defaults).toBeDefined();
    });

    test('getSelectedRows retourne un tableau vide initialement', () => {
        const el = document.getElementById('table-el') as HTMLElement;
        const instance = new Table(el);

        expect(instance.getSelectedRows()).toEqual([]);
    });

    test('clearSelection vide la sélection', () => {
        const el = document.getElementById('table-el') as HTMLElement;
        const instance = new Table(el);

        instance.clearSelection();
        expect(instance.getSelectedRows()).toEqual([]);
    });

    test('destroy nettoie l\'instance', () => {
        const el = document.getElementById('table-el') as HTMLElement;
        const instance = new Table(el);

        instance.destroy();
        expect(Table.getInstance(el)).toBeFalsy();
    });
});
