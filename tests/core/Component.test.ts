/**
 * Tests unitaires pour la classe de base Component
 * @description Tests des mécanismes de base des composants
 */

import { Component } from '../../src/core/base/Component';
import { ComponentRegistry } from '../../src/core/registries/ComponentRegistry';
import { PriorityLevel, BaseOptions } from '../../src/types/base';

// Classe de test héritant de Component
class TestComponent extends Component<BaseOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    constructor(el: HTMLElement, options: Partial<BaseOptions> = {}) {
        super(el, options, TestComponent);
    }

    destroy() {
        super.destroy();
    }

    static get defaults(): BaseOptions {
        return {};
    }

    static initTest(els: string | HTMLElement, options: Partial<BaseOptions> = {}) {
        return TestComponent.init(els, options, TestComponent);
    }

    static initWithPriorityTest(els: string | HTMLElement, options: Partial<BaseOptions> = {}, priority: PriorityLevel = PriorityLevel.MEDIUM) {
        return TestComponent.initWithPriority(els, options, TestComponent, priority);
    }
}

describe('Component', () => {
    let testElement: HTMLElement;

    beforeEach(() => {
        testElement = document.createElement('div');
        document.body.appendChild(testElement);
        ComponentRegistry.clear();
    });

    afterEach(() => {
        testElement.remove();
        ComponentRegistry.destroy();
    });

    describe('Constructeur', () => {
        test('devrait créer une instance de composant', () => {
            const component = new TestComponent(testElement);

            expect(component).toBeInstanceOf(Component);
            expect(component.el).toBe(testElement);
        });

        test('devrait stocker l\'élément DOM', () => {
            const component = new TestComponent(testElement);

            expect(component.el).toBe(testElement);
        });

        test('devrait initialiser les options', () => {
            const callback = jest.fn();
            const component = new TestComponent(testElement, { onOpenStart: callback });

            expect(component.options).toBeDefined();
            expect(component.options.onOpenStart).toBe(callback);
        });
    });

    describe('Initialisation statique', () => {
        test('devrait initialiser un composant unique', () => {
            const instance = TestComponent.initTest(testElement);

            expect(instance).toBeDefined();
        });

        test('devrait initialiser plusieurs composants', () => {
            const el2 = document.createElement('div');
            el2.className = 'test-component';
            document.body.appendChild(el2);
            testElement.className = 'test-component';

            const instances = TestComponent.initTest('.test-component');

            expect(instances).toBeDefined();
            el2.remove();
        });

        test('devrait initialiser avec priorité personnalisée', () => {
            const instance = TestComponent.initWithPriorityTest(testElement, {}, PriorityLevel.HIGH);

            expect(instance).toBeDefined();
        });
    });

    describe('Gestion des priorités', () => {
        test('devrait utiliser la priorité MEDIUM par défaut', () => {
            const component = new TestComponent(testElement);

            expect(component.priority).toBe(PriorityLevel.MEDIUM);
        });
    });

    describe('Merge des options', () => {
        test('devrait merger les options par défaut avec les options personnalisées', () => {
            const callback = jest.fn();
            const component = new TestComponent(testElement, { onOpenStart: callback });

            expect(component.options.onOpenStart).toBe(callback);
        });

        test('devrait préserver les options par défaut si non spécifiées', () => {
            const component = new TestComponent(testElement, {});

            expect(component.options).toBeDefined();
        });
    });

    describe('Cas limites', () => {
        test('devrait rejeter un élément null ou invalide', () => {
            expect(() => {
                const nullElement = null as unknown as HTMLElement;
                new TestComponent(nullElement);
            }).toThrow(/n'est pas un HTMLElement valide/);
        });

        test('devrait gérer des options vides', () => {
            const component = new TestComponent(testElement, {});

            expect(component.options).toBeDefined();
        });
    });

    describe('Destruction', () => {
        test('devrait appeler la méthode destroy', () => {
            const component = new TestComponent(testElement);

            expect(() => {
                component.destroy();
            }).not.toThrow();
        });
    });
});

