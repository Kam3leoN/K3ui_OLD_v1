/**
 * Tests unitaires pour le manager PrivacyManager
 * @description Tests du consentement RGPD et de l'inventaire des clés de stockage K3UI
 */

import { PrivacyManager } from '../../src/core/managers/PrivacyManager';

describe('PrivacyManager', () => {
    beforeEach(() => {
        localStorage.clear();
        PrivacyManager.reset();
    });

    afterEach(() => {
        localStorage.clear();
        PrivacyManager.reset();
    });

    describe('Initialisation', () => {
        test('devrait retourner les options par défaut', () => {
            const defaults = PrivacyManager.defaults;
            expect(defaults.storageKey).toBe('k3ui-privacy-consent');
        });

        test('devrait s\'initialiser sans erreur', () => {
            expect(() => PrivacyManager.init()).not.toThrow();
        });

        test('ne devrait pas s\'initialiser deux fois', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            PrivacyManager.init();
            PrivacyManager.init();
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('Comportement par défaut (sans setConsent)', () => {
        test('"essential" est toujours autorisé', () => {
            expect(PrivacyManager.hasConsent('essential')).toBe(true);
        });

        test('"functional" est autorisé par défaut (compatibilité rétroactive)', () => {
            expect(PrivacyManager.hasConsent('functional')).toBe(true);
        });

        test('"optional" est refusé par défaut (opt-in requis)', () => {
            expect(PrivacyManager.hasConsent('optional')).toBe(false);
        });

        test('canWrite autorise les clés functional connues (ex. k3ui-theme)', () => {
            expect(PrivacyManager.canWrite('k3ui-theme')).toBe(true);
        });

        test('canWrite refuse les clés optional connues (ex. k3ui-todo)', () => {
            expect(PrivacyManager.canWrite('k3ui-todo')).toBe(false);
        });

        test('canWrite autorise une clé inconnue (comportement conservateur functional)', () => {
            expect(PrivacyManager.canWrite('unknown-key')).toBe(true);
        });
    });

    describe('setConsent', () => {
        test('devrait autoriser explicitement la catégorie optional', () => {
            PrivacyManager.setConsent('optional', true);
            expect(PrivacyManager.hasConsent('optional')).toBe(true);
            expect(PrivacyManager.canWrite('k3ui-todo')).toBe(true);
        });

        test('devrait refuser explicitement la catégorie functional', () => {
            PrivacyManager.setConsent('functional', false);
            expect(PrivacyManager.hasConsent('functional')).toBe(false);
            expect(PrivacyManager.canWrite('k3ui-theme')).toBe(false);
        });

        test('ne devrait pas modifier la catégorie essential', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            PrivacyManager.setConsent('essential', false);
            expect(PrivacyManager.hasConsent('essential')).toBe(true);
            consoleSpy.mockRestore();
        });

        test('devrait persister le consentement dans localStorage', () => {
            PrivacyManager.setConsent('optional', true);
            const stored = localStorage.getItem('k3ui-privacy-consent');
            expect(stored).toBeTruthy();
            expect(JSON.parse(stored!)).toEqual({ optional: true });
        });

        test('devrait appeler le callback onChange', () => {
            const onChange = jest.fn();
            PrivacyManager.init({ onChange });
            PrivacyManager.setConsent('optional', true);
            expect(onChange).toHaveBeenCalledWith('optional', true);
        });

        test('devrait effacer les clés de la catégorie lors d\'un refus', () => {
            localStorage.setItem('k3ui-theme', 'dark');
            PrivacyManager.setConsent('functional', false);
            expect(localStorage.getItem('k3ui-theme')).toBeNull();
        });
    });

    describe('clearCategory', () => {
        test('devrait effacer uniquement les clés de la catégorie ciblée', () => {
            localStorage.setItem('k3ui-theme', 'dark');
            localStorage.setItem('k3ui-todo', '[]');

            PrivacyManager.clearCategory('functional');

            expect(localStorage.getItem('k3ui-theme')).toBeNull();
            expect(localStorage.getItem('k3ui-todo')).toBe('[]');
        });

        test('ne devrait pas effacer la catégorie essential', () => {
            PrivacyManager.setConsent('optional', true);
            PrivacyManager.clearCategory('essential');
            expect(localStorage.getItem('k3ui-privacy-consent')).toBeTruthy();
        });
    });

    describe('clearAll', () => {
        test('devrait effacer toutes les clés connues et le consentement', () => {
            localStorage.setItem('k3ui-theme', 'dark');
            localStorage.setItem('k3ui-todo', '[]');
            PrivacyManager.setConsent('optional', true);

            PrivacyManager.clearAll();

            expect(localStorage.getItem('k3ui-theme')).toBeNull();
            expect(localStorage.getItem('k3ui-todo')).toBeNull();
            expect(localStorage.getItem('k3ui-privacy-consent')).toBeNull();
            expect(PrivacyManager.hasConsent('optional')).toBe(false);
        });
    });

    describe('listKeys', () => {
        test('devrait retourner l\'inventaire des clés connues', () => {
            const keys = PrivacyManager.listKeys();
            const keyNames = keys.map(k => k.key);

            expect(keyNames).toContain('k3ui-theme');
            expect(keyNames).toContain('k3ui-locale');
            expect(keyNames).toContain('k3ui-sound-enabled');
            expect(keyNames).toContain('k3ui-dynamic-color');
            expect(keyNames).toContain('k3ui-todo');
        });

        test('k3ui-todo devrait être catégorisé "optional"', () => {
            const keys = PrivacyManager.listKeys();
            const todoEntry = keys.find(k => k.key === 'k3ui-todo');
            expect(todoEntry?.category).toBe('optional');
        });

        test('k3ui-theme devrait être catégorisé "functional"', () => {
            const keys = PrivacyManager.listKeys();
            const themeEntry = keys.find(k => k.key === 'k3ui-theme');
            expect(themeEntry?.category).toBe('functional');
        });
    });

    describe('registerKey', () => {
        test('devrait permettre d\'ajouter une clé personnalisée à l\'inventaire', () => {
            PrivacyManager.registerKey('my-app-key', 'optional', 'Donnée personnalisée');

            expect(PrivacyManager.getCategoryForKey('my-app-key')).toBe('optional');
            expect(PrivacyManager.canWrite('my-app-key')).toBe(false);

            PrivacyManager.setConsent('optional', true);
            expect(PrivacyManager.canWrite('my-app-key')).toBe(true);
        });
    });
});
