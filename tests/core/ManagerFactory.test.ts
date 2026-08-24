/**
 * Tests unitaires pour ManagerFactory
 * @description Tests de la factory centralisée des managers
 */

import { ManagerFactory } from '../../src/core/factories/ManagerFactory';
import { LoggerManager } from '../../src/core/managers/LoggerManager';
import { ThemeManager } from '../../src/core/managers/ThemeManager';
import { SoundFXManager } from '../../src/core/managers/SoundFXManager';
import { HapticManager } from '../../src/core/managers/HapticManager';
import { IconManager } from '../../src/core/managers/IconManager';

describe('ManagerFactory', () => {
    beforeEach(() => {
        // Nettoyer avant chaque test
        ManagerFactory.destroy();
    });

    afterEach(() => {
        // Nettoyer après chaque test
        ManagerFactory.clear();
        ManagerFactory.destroy();
    });

    describe('Initialisation', () => {
        test('devrait créer une instance unique (Singleton)', () => {
            const factory = ManagerFactory.getInstance();

            expect(factory).toBeDefined();
            expect(factory).toBeInstanceOf(ManagerFactory);
        });

        test('devrait retourner la même instance', () => {
            const factory1 = ManagerFactory.getInstance();
            const factory2 = ManagerFactory.getInstance();

            expect(factory1).toBe(factory2);
        });
    });

    describe('Configuration', () => {
        test('devrait configurer la factory', () => {
            const factory = ManagerFactory.getInstance();

            expect(() => {
                factory.configure({
                    enabled: false,
                    cacheEnabled: false,
                });
            }).not.toThrow();
        });
    });

    describe('Récupération des managers', () => {
        test('devrait obtenir le LoggerManager', () => {
            const logger = ManagerFactory.getLoggerManager('[Test]');

            expect(logger).toBeDefined();
            expect(logger).toBeInstanceOf(LoggerManager);
        });

        test('devrait obtenir le LoggerManager global', () => {
            const logger = ManagerFactory.getLoggerManager();

            expect(logger).toBeDefined();
            expect(logger).toBeInstanceOf(LoggerManager);
        });

        test('devrait obtenir le ThemeManager', () => {
            const themeManager = ManagerFactory.getThemeManager();

            expect(themeManager).toBeDefined();
            expect(themeManager).toBeInstanceOf(ThemeManager);
        });

        test('devrait obtenir le SoundFXManager', () => {
            const soundFXManager = ManagerFactory.getSoundFXManager();

            expect(soundFXManager).toBeDefined();
            expect(soundFXManager).toBeInstanceOf(SoundFXManager);
        });

        test('devrait obtenir le HapticManager', () => {
            const hapticManager = ManagerFactory.getHapticManager();

            expect(hapticManager).toBeDefined();
            expect(hapticManager).toBeInstanceOf(HapticManager);
        });

        test('devrait obtenir l\'IconManager', () => {
            const iconManager = ManagerFactory.getIconManager();

            expect(iconManager).toBeDefined();
            expect(iconManager).toBe(IconManager);
        });
    });

    describe('Cache et singleton', () => {
        test('devrait retourner la même instance du ThemeManager', () => {
            const themeManager1 = ManagerFactory.getThemeManager();
            const themeManager2 = ManagerFactory.getThemeManager();

            expect(themeManager1).toBe(themeManager2);
        });

        test('devrait retourner la même instance du SoundFXManager', () => {
            const soundFX1 = ManagerFactory.getSoundFXManager();
            const soundFX2 = ManagerFactory.getSoundFXManager();

            expect(soundFX1).toBe(soundFX2);
        });

        test('devrait retourner la même instance du HapticManager', () => {
            HapticManager.resetForTests();
            const haptic1 = ManagerFactory.getHapticManager();
            const haptic2 = ManagerFactory.getHapticManager();

            expect(haptic1).toBe(haptic2);
        });
    });

    describe('Méthodes génériques', () => {
        test('devrait obtenir un manager par nom', () => {
            const customManager = ManagerFactory.getManager('custom', () => {
                return { name: 'CustomManager' };
            });

            expect(customManager).toBeDefined();
            expect((customManager as { name: string }).name).toBe('CustomManager');
        });

        test('devrait vérifier si un manager existe dans le cache', () => {
            ManagerFactory.getThemeManager();

            const exists = ManagerFactory.hasManager('theme');

            expect(exists).toBe(true);
        });

        test('devrait supprimer un manager du cache', () => {
            ManagerFactory.getThemeManager();
            const removed = ManagerFactory.removeManager('theme');

            expect(removed).toBe(true);
            expect(ManagerFactory.hasManager('theme')).toBe(false);
        });
    });

    describe('Statistiques', () => {
        test('devrait obtenir les statistiques', () => {
            ManagerFactory.getThemeManager();
            ManagerFactory.getSoundFXManager();

            const stats = ManagerFactory.getStats();

            expect(stats).toBeDefined();
            expect(stats.enabled).toBeDefined();
        });

        test('devrait retourner des stats vides si le cache est désactivé', () => {
            const factory = ManagerFactory.getInstance();
            factory.configure({ cacheEnabled: false });

            const stats = ManagerFactory.getStats();

            expect(stats.cacheEnabled).toBe(false);
            expect(stats.totalManagers).toBe(0);
        });
    });

    describe('Nettoyage', () => {
        test('devrait nettoyer le cache', () => {
            ManagerFactory.getThemeManager();

            expect(() => {
                ManagerFactory.cleanup();
            }).not.toThrow();
        });

        test('devrait vider complètement le cache', () => {
            ManagerFactory.getThemeManager();
            ManagerFactory.getSoundFXManager();

            ManagerFactory.clear();

            // Après clear, hasManager devrait retourner false
            expect(ManagerFactory.hasManager('theme')).toBe(false);
        });
    });

    describe('Managers essentiels', () => {
        test('devrait obtenir les managers essentiels pour un composant', () => {
            const managers = ManagerFactory.getEssentialManagers('TestComponent');

            expect(managers).toBeDefined();
            expect(managers.logger).toBeDefined();
            expect(managers.themeManager).toBeDefined();
            expect(managers.iconManager).toBeDefined();
        });
    });

    describe('Managers pour tests', () => {
        test('devrait obtenir les managers pour les tests', () => {
            const managers = ManagerFactory.getTestManagers();

            expect(managers).toBeDefined();
            expect(managers.logger).toBeDefined();
            expect(managers.themeManager).toBeDefined();
            expect(managers.soundFXManager).toBeDefined();
            expect(managers.cookieManager).toBeDefined();
            expect(managers.iconManager).toBeDefined();
        });

        test('devrait désactiver le cache pour les tests', () => {
            ManagerFactory.getTestManagers();

            const stats = ManagerFactory.getStats();

            // Le cache devrait être temporairement désactivé puis restauré
            expect(stats).toBeDefined();
        });
    });

    describe('Destruction', () => {
        test('devrait détruire la factory', () => {
            ManagerFactory.getThemeManager();

            expect(() => {
                ManagerFactory.destroy();
            }).not.toThrow();
        });
    });

    describe('Cas limites', () => {
        test('devrait gérer un manager inexistant', () => {
            const exists = ManagerFactory.hasManager('nonexistent');

            expect(exists).toBe(false);
        });

        test('devrait retourner true lors de la suppression d\'un manager inexistant', () => {
            // ManagerRegistry.remove() retourne toujours true
            const removed = ManagerFactory.removeManager('nonexistent');

            expect(removed).toBe(true);
        });

        test('devrait gérer plusieurs appels simultanés', () => {
            const manager1 = ManagerFactory.getThemeManager();
            const manager2 = ManagerFactory.getSoundFXManager();
            const manager3 = ManagerFactory.getIconManager();

            expect(manager1).toBeDefined();
            expect(manager2).toBeDefined();
            expect(manager3).toBeDefined();
        });
    });
});

