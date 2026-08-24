/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant List
 */

import { List } from '../../src/components/List';
import { getListDefaults } from '../../src/specs/components/list.specs';

const sampleItems = [
    { id: 1, headline: 'Item 1', sub1: 'Support', avatar: { label: 'A', color: '#6750A4', textColor: '#fff' } },
    { id: 2, headline: 'Item 2', sub1: 'Support', avatar: { label: 'B', color: '#EADDFF', textColor: '#21005D' } },
];

describe('List', () => {
    let el: HTMLElement;

    beforeEach(() => {
        el = document.createElement('div');
        el.className = 'list';
        document.body.appendChild(el);
    });

    afterEach(() => {
        if (el && el.parentNode) {
            const instance = List.getInstance(el);
            if (instance) instance.destroy();
            el.parentNode.removeChild(el);
        }
    });

    test('initialise et stocke l\'instance sur l\'élément', () => {
        const instance = new List(el, { items: sampleItems, config: getListDefaults().config });
        expect(instance).toBeDefined();
        expect(List.getInstance(el)).toBe(instance);
        expect(el.classList.contains('list')).toBe(true);
    });

    test('getInstance retourne l\'instance', () => {
        const instance = new List(el, { items: sampleItems, config: getListDefaults().config });
        expect(List.getInstance(el)).toBe(instance);
    });

    test('defaults retourne les options par défaut', () => {
        const defaults = List.defaults;
        expect(defaults.items).toEqual([]);
        expect(defaults.config).toBeDefined();
        expect(defaults.config.variant).toBe('standard');
        expect(defaults.config.leading).toBe('avatar');
    });

    test('getItems retourne une copie des items', () => {
        const instance = new List(el, { items: sampleItems, config: getListDefaults().config });
        const items = instance.getItems();
        expect(items).toHaveLength(2);
        expect(items[0].headline).toBe('Item 1');
        expect(items).not.toBe(instance.getItems());
    });

    test('setItems met à jour et re-rend', () => {
        const instance = new List(el, { items: sampleItems, config: getListDefaults().config });
        const newItems = [{ id: 3, headline: 'Item 3', avatar: { label: 'C', color: '#ccc', textColor: '#000' } }];
        instance.setItems(newItems);
        expect(instance.getItems()).toHaveLength(1);
        expect(instance.getItems()[0].headline).toBe('Item 3');
    });

    test('destroy nettoie l\'instance', () => {
        const instance = new List(el, { items: sampleItems, config: getListDefaults().config });
        instance.destroy();
        expect(List.getInstance(el)).toBeFalsy();
    });

    test('init accepte un sélecteur', () => {
        el.id = 'list-init-test';
        const result = List.init('#list-init-test', { items: sampleItems, config: getListDefaults().config });
        const instances = Array.isArray(result) ? result : [result];
        expect(instances.length).toBe(1);
        expect(instances[0]).toBeInstanceOf(List);
    });
});
