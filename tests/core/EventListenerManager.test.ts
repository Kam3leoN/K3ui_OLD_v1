/// <reference types="@types/jest" />
/**
 * Tests unitaires pour l'EventListenerManager
 */

import { EventListenerManager } from '../../src/core/managers/EventListenerManager';

describe('EventListenerManager', () => {
    let manager: EventListenerManager;

    beforeEach(() => {
        manager = new EventListenerManager();
    });

    afterEach(() => {
        manager.destroy();
    });

    test('crée une instance', () => {
        expect(manager).toBeDefined();
    });

    test('add enregistre un listener et retourne un cleanup', () => {
        const el = document.createElement('div');
        const listener = jest.fn();
        const cleanup = manager.add(el, 'click', listener);

        expect(typeof cleanup).toBe('function');
    });

    test('has retourne true après add', () => {
        const el = document.createElement('div');
        const listener = jest.fn();
        manager.add(el, 'click', listener);

        expect(manager.has(el, 'click', listener)).toBe(true);
    });

    test('count retourne le nombre de listeners', () => {
        const el = document.createElement('div');
        manager.add(el, 'click', jest.fn());
        manager.add(el, 'mouseover', jest.fn());

        expect(manager.count(el)).toBe(2);
    });

    test('remove supprime un listener', () => {
        const el = document.createElement('div');
        const listener = jest.fn();
        manager.add(el, 'click', listener);
        manager.remove(el, 'click', listener);

        expect(manager.has(el, 'click', listener)).toBe(false);
    });

    test('removeAll supprime tous les listeners d\'un élément', () => {
        const el = document.createElement('div');
        manager.add(el, 'click', jest.fn());
        manager.add(el, 'mouseover', jest.fn());
        manager.removeAll(el);

        expect(manager.count(el)).toBe(0);
    });

    test('destroy supprime tout', () => {
        const el = document.createElement('div');
        manager.add(el, 'click', jest.fn());

        expect(() => manager.destroy()).not.toThrow();
    });
});
