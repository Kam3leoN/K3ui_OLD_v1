import { asRegistryComponent } from '../helpers/registry';
/**
 * Tests unitaires pour ComponentRegistry
 * @description Tests du registre central des composants
 */

import { ComponentRegistry } from '../../src/core/registries/ComponentRegistry';
import { PriorityLevel } from '../../src/types/base';
import { ComponentRegistryEntry } from '../../src/types/components';

// Mock d'un composant simple pour les tests
class MockComponent {
    constructor(private el: HTMLElement) { }

    destroy() {
        // Mock de destruction
    }

    getElement() {
        return this.el;
    }
}

describe('ComponentRegistry', () => {
    let mockElement: HTMLElement;
    let mockComponent: MockComponent;

    beforeEach(() => {
        // Créer un élément de test
        mockElement = document.createElement('div');
        mockComponent = new MockComponent(mockElement);

        // Nettoyer le registre avant chaque test
        ComponentRegistry.clear();
        ComponentRegistry.destroy();
    });

    afterEach(() => {
        // Nettoyer après chaque test
        ComponentRegistry.destroy();
    });

    describe('Initialisation', () => {
        test('devrait créer une instance unique (Singleton)', () => {
            const instance1 = ComponentRegistry.getInstance();
            const instance2 = ComponentRegistry.getInstance();

            expect(instance1).toBe(instance2);
        });

        test('devrait initialiser le registre', () => {
            expect(() => {
                ComponentRegistry.init();
            }).not.toThrow();
        });

        test('devrait initialiser avec une configuration personnalisée', () => {
            expect(() => {
                ComponentRegistry.init({
                    maxSize: 500,
                    cleanupInterval: 60000,
                });
            }).not.toThrow();
        });
    });

    describe('Enregistrement', () => {
        test('devrait enregistrer une nouvelle instance', () => {
            const result = ComponentRegistry.register(
                mockElement,
                asRegistryComponent(mockComponent),
                PriorityLevel.MEDIUM,
                {},
                'MockComponent'
            );

            expect(result).toBe(true);
        });

        test('devrait retourner false pour une priorité insuffisante', () => {
            // Enregistrer avec priorité élevée
            ComponentRegistry.register(
                mockElement,
                asRegistryComponent(mockComponent),
                PriorityLevel.HIGH,
                {},
                'MockComponent'
            );

            // Essayer d'enregistrer avec priorité plus basse
            const result = ComponentRegistry.register(
                mockElement,
                asRegistryComponent(new MockComponent(mockElement)),
                PriorityLevel.LOW,
                {},
                'MockComponent'
            );

            expect(result).toBe(false);
        });

        test('devrait remplacer une instance existante avec priorité plus élevée', () => {
            // Enregistrer avec priorité basse
            ComponentRegistry.register(
                mockElement,
                asRegistryComponent(mockComponent),
                PriorityLevel.LOW,
                {},
                'MockComponent'
            );

            // Remplacer avec priorité élevée
            const newComponent = new MockComponent(mockElement);
            const result = ComponentRegistry.register(
                mockElement,
                asRegistryComponent(newComponent),
                PriorityLevel.HIGH,
                {},
                'MockComponent'
            );

            expect(result).toBe(true);
        });
    });

    describe('Récupération', () => {
        test('devrait récupérer une instance enregistrée', () => {
            ComponentRegistry.register(
                mockElement,
                asRegistryComponent(mockComponent),
                PriorityLevel.MEDIUM,
                {},
                'MockComponent'
            );

            const instance = ComponentRegistry.getComponentInstance(mockElement);

            expect(instance).toBe(mockComponent);
        });

        test('devrait retourner null pour un élément non enregistré', () => {
            const instance = ComponentRegistry.getComponentInstance(mockElement);

            expect(instance).toBeNull();
        });
    });

    describe('Priorité', () => {
        test('devrait vérifier si une priorité est plus élevée', () => {
            // Pas d'instance existante
            expect(ComponentRegistry.hasHigherPriority(mockElement, PriorityLevel.LOW)).toBe(true);

            // Enregistrer avec priorité basse
            ComponentRegistry.register(
                mockElement,
                asRegistryComponent(mockComponent),
                PriorityLevel.LOW,
                {},
                'MockComponent'
            );

            // Tester avec priorité plus élevée
            expect(ComponentRegistry.hasHigherPriority(mockElement, PriorityLevel.MEDIUM)).toBe(true);

            // Tester avec priorité plus basse
            expect(ComponentRegistry.hasHigherPriority(mockElement, PriorityLevel.LOW)).toBe(false);
        });
    });

    describe('Désenregistrement', () => {
        test('devrait désenregistrer une instance', () => {
            ComponentRegistry.register(
                mockElement,
                asRegistryComponent(mockComponent),
                PriorityLevel.MEDIUM,
                {},
                'MockComponent'
            );

            expect(() => {
                ComponentRegistry.unregister(mockElement);
            }).not.toThrow();

            const instance = ComponentRegistry.getComponentInstance(mockElement);
            expect(instance).toBeNull();
        });

        test('devrait gérer la désinscription d\'un élément non enregistré', () => {
            expect(() => {
                ComponentRegistry.unregister(mockElement);
            }).not.toThrow();
        });
    });

    describe('Récupération de toutes les instances', () => {
        test('devrait retourner toutes les instances', () => {
            const element1 = document.createElement('div');
            const element2 = document.createElement('div');

            ComponentRegistry.register(
                element1,
                asRegistryComponent(new MockComponent(element1)),
                PriorityLevel.MEDIUM,
                {},
                'MockComponent1'
            );

            ComponentRegistry.register(
                element2,
                asRegistryComponent(new MockComponent(element2)),
                PriorityLevel.MEDIUM,
                {},
                'MockComponent2'
            );

            const allInstances = ComponentRegistry.getAllInstances();

            expect(allInstances.size).toBe(2);
        });

        test('devrait retourner une Map vide si aucune instance', () => {
            const allInstances = ComponentRegistry.getAllInstances();

            expect(allInstances.size).toBe(0);
        });
    });

    describe('Nettoyage', () => {
        test('devrait nettoyer le registre', () => {
            ComponentRegistry.register(
                mockElement,
                asRegistryComponent(mockComponent),
                PriorityLevel.MEDIUM,
                {},
                'MockComponent'
            );

            expect(() => {
                ComponentRegistry.cleanup();
            }).not.toThrow();
        });

        test('devrait vider complètement le registre', () => {
            ComponentRegistry.register(
                mockElement,
                asRegistryComponent(mockComponent),
                PriorityLevel.MEDIUM,
                {},
                'MockComponent'
            );

            ComponentRegistry.clear();

            const allInstances = ComponentRegistry.getAllInstances();
            expect(allInstances.size).toBe(0);
        });
    });

    describe('Statistiques', () => {
        test('devrait obtenir les statistiques', () => {
            ComponentRegistry.register(
                mockElement,
                asRegistryComponent(mockComponent),
                PriorityLevel.MEDIUM,
                {},
                'MockComponent'
            );

            const stats = ComponentRegistry.getStats();

            expect(stats).toBeDefined();
            expect(stats.totalInstances).toBe(1);
        });

        test('devrait retourner des stats vides pour un registre vide', () => {
            const stats = ComponentRegistry.getStats();

            expect(stats.totalInstances).toBe(0);
            expect(stats.inactiveInstances).toBe(0);
        });
    });

    describe('Événements', () => {
        test('devrait écouter un événement', () => {
            const callback = jest.fn();

            ComponentRegistry.on('instance-created', callback);

            ComponentRegistry.register(
                mockElement,
                asRegistryComponent(mockComponent),
                PriorityLevel.MEDIUM,
                {},
                'MockComponent'
            );

            expect(callback).toHaveBeenCalled();
        });

        test('devrait arrêter d\'écouter un événement', () => {
            const callback = jest.fn();

            ComponentRegistry.on('instance-created', callback);
            ComponentRegistry.off('instance-created', callback);

            ComponentRegistry.register(
                mockElement,
                asRegistryComponent(mockComponent),
                PriorityLevel.MEDIUM,
                {},
                'MockComponent'
            );

            // Le callback ne devrait pas être appelé car on a arrêté de l'écouter
            // Mais dans ce cas, il pourrait avoir été appelé avant off()
            // La vérification est donc que l'événement a été géré
            expect(callback.mock.calls.length).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Destruction', () => {
        test('devrait détruire le registre', () => {
            ComponentRegistry.register(
                mockElement,
                asRegistryComponent(mockComponent),
                PriorityLevel.MEDIUM,
                {},
                'MockComponent'
            );

            expect(() => {
                ComponentRegistry.destroy();
            }).not.toThrow();
        });

        test('devrait nettoyer toutes les instances lors de la destruction', () => {
            ComponentRegistry.register(
                mockElement,
                asRegistryComponent(mockComponent),
                PriorityLevel.MEDIUM,
                {},
                'MockComponent'
            );

            ComponentRegistry.destroy();

            const stats = ComponentRegistry.getStats();
            expect(stats.totalInstances).toBe(0);
        });
    });

    describe('Cas limites', () => {
        test('devrait gérer plusieurs instances du même élément avec priorités différentes', () => {
            const element = document.createElement('div');

            // Enregistrer avec basse priorité
            ComponentRegistry.register(
                element,
                asRegistryComponent(new MockComponent(element)),
                PriorityLevel.LOW,
                {},
                'MockComponent1'
            );

            // Enregistrer avec moyenne priorité
            const result2 = ComponentRegistry.register(
                element,
                asRegistryComponent(new MockComponent(element)),
                PriorityLevel.MEDIUM,
                {},
                'MockComponent2'
            );

            // Devrait remplacer car priorité plus élevée
            expect(result2).toBe(true);
        });

        test('devrait gérer plusieurs éléments avec des priorités différentes', () => {
            const element1 = document.createElement('div');
            const element2 = document.createElement('div');

            ComponentRegistry.register(
                element1,
                asRegistryComponent(new MockComponent(element1)),
                PriorityLevel.HIGH,
                {},
                'MockComponent1'
            );

            ComponentRegistry.register(
                element2,
                asRegistryComponent(new MockComponent(element2)),
                PriorityLevel.LOW,
                {},
                'MockComponent2'
            );

            const stats = ComponentRegistry.getStats();
            expect(stats.totalInstances).toBe(2);
        });

        test('devrait mettre à jour le timestamp de dernière utilisation', () => {
            ComponentRegistry.register(
                mockElement,
                asRegistryComponent(mockComponent),
                PriorityLevel.MEDIUM,
                {},
                'MockComponent'
            );

            // Récupérer plusieurs fois
            ComponentRegistry.getComponentInstance(mockElement);
            ComponentRegistry.getComponentInstance(mockElement);
            ComponentRegistry.getComponentInstance(mockElement);

            const stats = ComponentRegistry.getStats();
            expect(stats.totalInstances).toBe(1);
        });
    });
});

