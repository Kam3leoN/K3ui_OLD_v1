/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant Pace
 */

import { Pace } from '../../src/components/Pace';

describe('Pace', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    test('devrait créer une instance avec les options par défaut', () => {
        const instance = new Pace(document.body, { startOnPageLoad: false });
        expect(instance).toBeDefined();
        expect(Pace.getInstance(document.body)).toBe(instance);
    });

    test('devrait exposer getInstance et defaults', () => {
        const instance = new Pace(document.body, { startOnPageLoad: false });
        expect(Pace.getInstance(document.body)).toBe(instance);
        expect(Pace.defaults).toBeDefined();
        expect(Pace.defaults.target).toBe('body');
        expect(Pace.defaults.startOnPageLoad).toBe(true);
    });

    test('start() crée la barre dans le DOM', () => {
        const instance = new Pace(document.body, { startOnPageLoad: false });
        instance.start();
        expect(document.querySelector('.pace')).toBeTruthy();
        expect(document.querySelector('.pace-progress')).toBeTruthy();
    });

    test('stop() retire la barre et réinitialise', () => {
        const instance = new Pace(document.body, { startOnPageLoad: false });
        instance.start();
        expect(document.querySelector('.pace')).toBeTruthy();
        instance.stop();
        expect(document.querySelector('.pace')).toBeFalsy();
    });

    test('isRunning() retourne true après start, false après stop', () => {
        const instance = new Pace(document.body, { startOnPageLoad: false });
        expect(instance.isRunning()).toBe(false);
        instance.start();
        expect(instance.isRunning()).toBe(true);
        instance.stop();
        expect(instance.isRunning()).toBe(false);
    });

    test('destroy() nettoie l’instance sur l’élément', () => {
        const instance = new Pace(document.body, { startOnPageLoad: false });
        expect(Pace.getInstance(document.body)).toBe(instance);
        instance.destroy();
        expect(Pace.getInstance(document.body)).toBeFalsy();
    });

    test('se termine sans requête XHR en cours (AjaxMonitor au repos)', async () => {
        const instance = new Pace(document.body, {
            startOnPageLoad: false,
            minTime: 0,
            ghostTime: 0,
            eventLag: undefined,
            elements: { checkInterval: 100, selectors: [] },
            ajax: { trackMethods: ['GET'], trackWebSockets: false, ignoreURLs: [] },
        });
        instance.start();
        expect(document.querySelector('.pace-active')).toBeTruthy();

        await new Promise<void>((resolve) => {
            const deadline = Date.now() + 3000;
            const tick = () => {
                if (!document.querySelector('.pace-active') || Date.now() > deadline) {
                    resolve();
                    return;
                }
                requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        });

        expect(document.querySelector('.pace-active')).toBeFalsy();
        instance.destroy();
    });
});
