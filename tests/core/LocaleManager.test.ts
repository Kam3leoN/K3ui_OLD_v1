/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le LocaleManager
 */

import { LocaleManager } from '../../src/core/managers/LocaleManager';

describe('LocaleManager', () => {
    test('init initialise le manager', () => {
        expect(() => LocaleManager.init()).not.toThrow();
    });

    test('currentLocale retourne une locale valide', () => {
        LocaleManager.init();
        const locale = LocaleManager.currentLocale;

        expect(typeof locale).toBe('string');
        expect(locale.length).toBeGreaterThan(0);
    });

    test('t retourne une chaîne pour une clé connue', () => {
        LocaleManager.init();
        const result = LocaleManager.t('common.close');

        expect(typeof result).toBe('string');
    });

    test('t retourne la clé pour une clé inconnue', () => {
        LocaleManager.init();
        const unknownKey = 'unknown.key.test';
        const result = LocaleManager.t(unknownKey);

        expect(result).toBe(unknownKey);
    });

    test('setLocale change la locale', () => {
        LocaleManager.init();

        expect(() => LocaleManager.setLocale('en-US' as any)).not.toThrow();
    });
});
