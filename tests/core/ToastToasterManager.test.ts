/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le ToastToasterManager
 */

import { ToastToasterManager } from '../../src/core/managers/ToastToasterManager';

describe('ToastToasterManager', () => {
    afterEach(() => {
        ToastToasterManager.resetAll();
        document.body.innerHTML = '';
    });

    test('configure accepte des options', () => {
        expect(() => ToastToasterManager.configure({})).not.toThrow();
    });

    test('ensureContainer crée un conteneur', () => {
        const container = ToastToasterManager.ensureContainer();

        expect(container).toBeDefined();
        expect(container instanceof HTMLElement).toBe(true);
    });

    test('register/unregister gère un toast', () => {
        const el = document.createElement('div');
        const item = { el, getId: () => 'test-toast-1' };

        ToastToasterManager.register(item);
        const toasts = ToastToasterManager.getAllNewestFirst();
        expect(toasts.length).toBe(1);

        ToastToasterManager.unregister(item);
        expect(ToastToasterManager.getAllNewestFirst().length).toBe(0);
    });

    test('resetAll vide tous les toasters', () => {
        const el = document.createElement('div');
        ToastToasterManager.register({ el, getId: () => 'test-1' });
        ToastToasterManager.register({ el, getId: () => 'test-2' });

        ToastToasterManager.resetAll();
        expect(ToastToasterManager.getAllNewestFirst().length).toBe(0);
    });

    test('getToastsNewestFirst retourne un tableau', () => {
        const result = ToastToasterManager.getToastsNewestFirst();
        expect(Array.isArray(result)).toBe(true);
    });
});
