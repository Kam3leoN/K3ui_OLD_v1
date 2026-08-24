/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant Firework
 */

import { Firework } from '../../src/extensions/effects/firework/Firework';
import { ThemeManager } from '../../src/core/managers/ThemeManager';
import { getAriaAttribute } from '../../src/utils/dom/aria';

describe('Firework', () => {
    beforeEach(() => {
        document.body.innerHTML = '<k3ui-firework id="fw"></k3ui-firework>';
        jest.useFakeTimers();

        Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
            value: jest.fn(() => ({
                scale: jest.fn(),
                fillRect: jest.fn(),
                clearRect: jest.fn(),
                beginPath: jest.fn(),
                moveTo: jest.fn(),
                lineTo: jest.fn(),
                stroke: jest.fn(),
                createRadialGradient: jest.fn(() => ({
                    addColorStop: jest.fn(),
                })),
                setTransform: jest.fn(),
            })),
            configurable: true,
        });

        global.requestAnimationFrame = jest.fn((cb: FrameRequestCallback) => {
            return setTimeout(() => cb(performance.now()), 16) as unknown as number;
        }) as typeof requestAnimationFrame;
        global.cancelAnimationFrame = jest.fn((id: number) => clearTimeout(id)) as typeof cancelAnimationFrame;
    });

    afterEach(() => {
        const el = document.getElementById('fw');
        Firework.getInstance(el as HTMLElement)?.destroy();
        document.body.innerHTML = '';
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    test('defaults incluent callbacks et themeFlip', () => {
        expect(Firework.defaults.onOpenStart).toBeNull();
        expect(Firework.defaults.themeFlip).toBe(true);
        expect(Firework.defaults.transparentBackground).toBe(true);
        expect(Firework.defaults.autoLaunch).toBe(false);
        expect(Firework.defaults.soundMode).toBe('samples');
        expect(Firework.defaults.soundSources?.lift?.length).toBeGreaterThan(0);
        expect(Firework.defaults.layer).toBe('behind');
        expect(Firework.defaults.trails).toBe(true);
        expect(Firework.defaults.imprints).toBe(false);
    });

    test('layer front résout z-index sans bloquer les interactions', () => {
        document.body.innerHTML = '<k3ui-firework id="fw-front" layer="front"></k3ui-firework>';
        const el = document.getElementById('fw-front') as HTMLElement;
        const instance = new Firework(el, { autoStart: false, themeFlip: false });
        const root = document.querySelector('.firework-root') as HTMLElement;
        expect(instance.options.zIndex).toBe(450);
        expect(getComputedStyle(root).pointerEvents).toBe('none');
        instance.destroy();
    });

    test('init crée une instance', () => {
        const el = document.getElementById('fw') as HTMLElement;
        const instances = Firework.init(el, { autoLaunch: false, autoStart: false });
        const instance = Array.isArray(instances) ? instances[0] : instances;
        expect(instance).toBeInstanceOf(Firework);
        expect(Firework.getInstance(el)).toBe(instance);
    });

    test('getInstance ne crée pas d\'instance implicite', () => {
        const el = document.getElementById('fw') as HTMLElement;
        expect(Firework.getInstance(el)).toBeFalsy();
    });

    test('destroy retire le conteneur canvas', () => {
        const el = document.getElementById('fw') as HTMLElement;
        const instance = new Firework(el, { autoStart: false, themeFlip: false });
        expect(document.querySelector('.firework-root')).toBeTruthy();
        instance.destroy();
        expect(document.querySelector('.firework-root')).toBeNull();
        expect(Firework.getInstance(el)).toBeFalsy();
    });

    test('celebrate ne lève pas d\'erreur', () => {
        const el = document.getElementById('fw') as HTMLElement;
        const instance = new Firework(el, { autoStart: false, themeFlip: false });
        expect(() => instance.celebrate()).not.toThrow();
        instance.destroy();
    });

    test('aria-hidden sur le conteneur firework', () => {
        const el = document.getElementById('fw') as HTMLElement;
        const instance = new Firework(el, { autoStart: false, themeFlip: false });
        const root = document.querySelector('.firework-root') as HTMLElement;
        expect(getAriaAttribute(root, 'hidden')).toBe('true');
        instance.destroy();
    });

    test('themeFlip bascule en dark puis restaure', () => {
        const setThemeSpy = jest.spyOn(ThemeManager, 'setTheme').mockImplementation(() => {});
        jest.spyOn(ThemeManager, 'currentTheme', 'get').mockReturnValue('light');

        const el = document.getElementById('fw') as HTMLElement;
        const instance = new Firework(el, {
            autoStart: true,
            themeFlip: true,
            themeFlipTailMs: 500,
        });

        const engine = instance.fireworksEngine;
        if (engine) {
            Object.defineProperty(engine, 'activeParticleCount', { get: () => 1, configurable: true });
        }

        instance.launch();
        jest.advanceTimersByTime(200);
        expect(setThemeSpy).toHaveBeenCalledWith('dark', { silent: true });

        if (engine) {
            Object.defineProperty(engine, 'activeParticleCount', { get: () => 0, configurable: true });
            Object.defineProperty(engine, 'isPlayingSequence', { get: () => false, configurable: true });
        }

        jest.advanceTimersByTime(600);
        expect(setThemeSpy).toHaveBeenCalledWith('light', { silent: true });
        expect(setThemeSpy).toHaveBeenCalledTimes(2);

        instance.destroy();
        setThemeSpy.mockRestore();
    });
});
