/**
 * Configuration des tests Jest
 * @description Setup après l'environnement pour les tests K3UI
 */

import '@testing-library/jest-dom';

// Configuration globale des tests
beforeEach(() => {
    // Nettoyer le DOM avant chaque test
    document.body.innerHTML = '';
    document.head.innerHTML = '';

    // Réinitialiser les mocks
    jest.clearAllMocks();

    // Réinitialiser localStorage/sessionStorage
    globalThis.localStorage?.clear?.();
    globalThis.sessionStorage?.clear?.();
});

afterEach(() => {
    // Nettoyer après chaque test
    document.body.innerHTML = '';

    // Réinitialiser les timers (les tests qui en ont besoin appellent useFakeTimers localement)
    jest.clearAllTimers();
    jest.useRealTimers();
});

// LOT 6 : timers réels par défaut (évite de bloquer onInit / styles async des composants).
// Les suites qui en ont besoin : jest.useFakeTimers() dans le test ou le describe.

// Utilitaires de test globaux
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeInTheDocument(): R;
            toHaveClass(className: string): R;
            toHaveAttribute(attr: string, value?: string): R;
        }
    }
}

// Helper pour créer des éléments DOM de test
export const createTestElement = (tag: string, attributes: Record<string, string> = {}): HTMLElement => {
    const element = document.createElement(tag);
    Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
    });
    return element;
};

// Helper pour simuler les événements
export const simulateEvent = (
    element: HTMLElement,
    eventType: string,
    options: EventInit & Record<string, unknown> = {}
) => {
    const event = new Event(eventType, { bubbles: true, cancelable: true, ...options });
    Object.assign(event, options);
    element.dispatchEvent(event);
    return event;
};

// Helper pour attendre les animations
export const waitForAnimation = () => new Promise(resolve => requestAnimationFrame(resolve));
