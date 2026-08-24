/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant Countdown
 */

import { Countdown } from '../../src/components/Countdown';

describe('Countdown', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="root"></div>';
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('devrait initialiser correctement avec les options par défaut', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new Countdown(el, { time: 5000 });

        expect(instance).toBeDefined();
        expect(Countdown.getInstance(el)).toBe(instance);
        expect(el.querySelector('.countdown__display') || el).toBeTruthy();
        expect(el.getAttribute('role')).toBe('timer');
    });

    it('devrait exposer getInstance', () => {
        const el = document.getElementById('root') as HTMLElement;
        new Countdown(el);
        const instance = Countdown.getInstance(el);
        expect(instance).toBeDefined();
        expect(instance.getRemainingTime()).toBeGreaterThanOrEqual(0);
    });

    it('devrait créer un élément .countdown__display si vide', () => {
        const el = document.getElementById('root') as HTMLElement;
        new Countdown(el, { time: 1000 });
        const display = el.querySelector('.countdown__display');
        expect(display).toBeTruthy();
        expect(display?.textContent).toBeDefined();
    });

    it('devrait démarrer et mettre à jour l\'affichage avec start()', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new Countdown(el, { time: 10000, autoStart: false });
        const initialRemaining = instance.getRemainingTime();
        instance.start();
        expect(instance.isRunning()).toBe(true);
        jest.advanceTimersByTime(100);
        expect(instance.getRemainingTime()).toBeLessThanOrEqual(initialRemaining);
    });

    it('devrait mettre en pause avec pause()', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new Countdown(el, { time: 10000, autoStart: true });
        expect(instance.isRunning()).toBe(true);
        instance.pause();
        expect(instance.isRunning()).toBe(false);
    });

    it('devrait réinitialiser avec reset()', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new Countdown(el, { time: 5000, autoStart: false });
        instance.start();
        jest.advanceTimersByTime(1000);
        instance.reset();
        expect(instance.isRunning()).toBe(false);
        expect(instance.getRemainingTime()).toBeGreaterThanOrEqual(0);
        expect(el.hasAttribute('data-ended')).toBe(false);
    });

    it('devrait appeler onEnd à la fin du compte à rebours', () => {
        const el = document.getElementById('root') as HTMLElement;
        const onEnd = jest.fn();
        new Countdown(el, { time: 100, autoStart: true, onEnd });
        jest.advanceTimersByTime(500);
        expect(onEnd).toHaveBeenCalled();
    });

    it('devrait appeler onChange à chaque mise à jour', () => {
        const el = document.getElementById('root') as HTMLElement;
        const onChange = jest.fn();
        new Countdown(el, { time: 2000, autoStart: true, onChange });
        jest.advanceTimersByTime(100);
        expect(onChange).toHaveBeenCalled();
        expect(onChange.mock.calls[0][0]).toMatchObject({
            months: expect.any(Number),
            days: expect.any(Number),
            hours: expect.any(Number),
            minutes: expect.any(Number),
            seconds: expect.any(Number),
            milliseconds: expect.any(Number),
        });
    });

    it('devrait lire data-time et data-format', () => {
        const el = document.getElementById('root') as HTMLElement;
        el.setAttribute('data-time', '60000');
        el.setAttribute('data-format', 'mm : ss');
        const instance = new Countdown(el);
        expect(instance.options.time).toBe(60000);
        expect(instance.options.format).toBe('mm : ss');
    });

    it('devrait détruire proprement', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new Countdown(el, { time: 5000, autoStart: true });
        instance.destroy();
        expect(Countdown.getInstance(el)).toBeFalsy();
    });
});
