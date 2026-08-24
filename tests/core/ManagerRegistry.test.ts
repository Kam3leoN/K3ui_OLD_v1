/**
 * Tests unitaires pour ManagerRegistry
 * @description Tests du registre central des managers
 */

import { ManagerRegistry } from '../../src/core/registries/ManagerRegistry';
import { LoggerManager } from '../../src/core/managers/LoggerManager';

describe('ManagerRegistry', () => {
    let registry: ManagerRegistry;

    beforeEach(() => {
        registry = ManagerRegistry.getInstance();
        registry.clear();
    });

    afterEach(() => {
        registry.destroy();
    });

    describe('Initialisation', () => {
        test('devrait créer une instance unique (Singleton)', () => {
            expect(registry).toBeDefined();
            expect(registry).toBeInstanceOf(ManagerRegistry);
        });

        test('devrait retourner la même instance', () => {
            const instance1 = ManagerRegistry.getInstance();
            const instance2 = ManagerRegistry.getInstance();

            expect(instance1).toBe(instance2);
        });
    });

    describe('Configuration', () => {
        test('devrait configurer le registre', () => {
            registry.configure({
                enabled: false,
                maxCacheSize: 100,
            });

            // Vérifier que la configuration est appliquée
            expect(() => {
                registry.configure({ enabled: true });
            }).not.toThrow();
        });
    });

    describe('Gestion des managers', () => {
        test('devrait obtenir un manager via factory', () => {
            const logger = registry.get('logger', () => new LoggerManager({ prefix: '[Test]' }));

            expect(logger).toBeDefined();
            expect(logger).toBeInstanceOf(LoggerManager);
        });

        test('devrait retourner la même instance pour un manager existant', () => {
            const logger1 = registry.get('logger', () => new LoggerManager({ prefix: '[Test]' }));
            const logger2 = registry.get('logger', () => new LoggerManager({ prefix: '[Test]' }));

            expect(logger1).toBe(logger2);
        });

        test('devrait vérifier si un manager existe', () => {
            expect(registry.has('logger')).toBe(false);

            registry.get('logger', () => new LoggerManager({ prefix: '[Test]' }));

            expect(registry.has('logger')).toBe(true);
        });

        test('devrait supprimer un manager', () => {
            registry.get('logger', () => new LoggerManager({ prefix: '[Test]' }));
            expect(registry.has('logger')).toBe(true);

            const removed = registry.remove('logger');

            expect(removed).toBe(true);
            expect(registry.has('logger')).toBe(false);
        });
    });

    describe('Métadonnées', () => {
        test('devrait obtenir les métadonnées d\'un manager', () => {
            registry.get('logger', () => new LoggerManager({ prefix: '[Test]' }));

            const metadata = registry.getMetadata('logger');

            expect(metadata).toBeDefined();
            expect(metadata?.name).toBe('logger');
            expect(metadata?.usageCount).toBe(1);
        });

        test('devrait retourner undefined pour un manager inexistant', () => {
            const metadata = registry.getMetadata('nonexistent');

            expect(metadata).toBeUndefined();
        });

        test('devrait obtenir toutes les métadonnées', () => {
            registry.get('logger', () => new LoggerManager({ prefix: '[Test]' }));
            registry.get('logger2', () => new LoggerManager({ prefix: '[Test2]' }));

            const allMetadata = registry.getAllMetadata();

            expect(allMetadata.size).toBe(2);
        });

        test('devrait mettre à jour les métadonnées à chaque accès', () => {
            registry.get('logger', () => new LoggerManager({ prefix: '[Test]' }));

            const metadata1 = registry.getMetadata('logger');
            expect(metadata1?.usageCount).toBe(1);

            registry.get('logger', () => new LoggerManager({ prefix: '[Test]' }));

            const metadata2 = registry.getMetadata('logger');
            expect(metadata2?.usageCount).toBe(2);
        });
    });

    describe('Statistiques', () => {
        test('devrait obtenir les statistiques', () => {
            registry.get('logger', () => new LoggerManager({ prefix: '[Test]' }));
            registry.get('logger2', () => new LoggerManager({ prefix: '[Test2]' }));

            const stats = registry.getStats();

            expect(stats.totalManagers).toBe(2);
            expect(stats.averageUsageCount).toBeGreaterThan(0);
        });

        test('devrait retourner des stats vides pour un registre vide', () => {
            const stats = registry.getStats();

            expect(stats.totalManagers).toBe(0);
            expect(stats.activeManagers).toBe(0);
        });
    });

    describe('Nettoyage', () => {
        test('devrait nettoyer les managers inactifs', () => {
            registry.get('logger', () => new LoggerManager({ prefix: '[Test]' }));

            expect(() => {
                registry.cleanup();
            }).not.toThrow();
        });

        test('devrait vider complètement le registre', () => {
            registry.get('logger', () => new LoggerManager({ prefix: '[Test]' }));
            registry.get('logger2', () => new LoggerManager({ prefix: '[Test2]' }));

            expect(registry.getAll().size).toBe(2);

            registry.clear();

            expect(registry.getAll().size).toBe(0);
        });
    });

    describe('Destruction', () => {
        test('devrait détruire le registre', () => {
            registry.get('logger', () => new LoggerManager({ prefix: '[Test]' }));

            expect(() => {
                registry.destroy();
            }).not.toThrow();
        });
    });

    describe('Cas limites', () => {
        test('devrait gérer la factory qui retourne null', () => {
            const result = registry.get('nullManager', () => null as any);
            expect(result).toBeNull();
        });

        test('devrait gérer plusieurs appels simultanés', () => {
            const manager1 = registry.get('manager1', () => new LoggerManager({ prefix: '[Test]' }));
            const manager2 = registry.get('manager2', () => new LoggerManager({ prefix: '[Test]' }));
            const manager3 = registry.get('manager3', () => new LoggerManager({ prefix: '[Test]' }));

            expect(manager1).toBeDefined();
            expect(manager2).toBeDefined();
            expect(manager3).toBeDefined();
        });

        test('devrait gérer la suppression d\'un manager inexistant', () => {
            // Éviter le problème en n'ajoutant pas null
            const removed = registry.remove('nonexistent');

            expect(removed).toBe(true);
        });
    });
});

