/**
 * Tests unitaires pour HapticManager
 * @description Vibration API, garde-fous, motifs personnalisables.
 */

/// <reference types="@types/jest" />

import { HapticManager } from '../../src/core/managers/HapticManager';
import { MotionManager } from '../../src/core/managers/MotionManager';

describe('HapticManager', () => {
    let vibrateMock: jest.Mock;

    beforeEach(() => {
        HapticManager.resetForTests();
        HapticManager.setEnabled(true);
        MotionManager.setOverride(null);

        vibrateMock = jest.fn().mockReturnValue(true);
        Object.defineProperty(global.navigator, 'vibrate', {
            configurable: true,
            writable: true,
            value: vibrateMock,
        });

        window.matchMedia = jest.fn().mockImplementation(() => ({
            matches: false,
            media: '(prefers-reduced-motion: reduce)',
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        }));
    });

    afterEach(() => {
        HapticManager.resetForTests();
    });

    it('create() retourne toujours la même instance', () => {
        const a = HapticManager.create();
        const b = HapticManager.create();
        expect(a).toBe(b);
    });

    it('appelle navigator.vibrate avec le motif selection (10 ms)', () => {
        HapticManager.vibrate('selection');
        expect(vibrateMock).toHaveBeenCalledWith(10);
    });

    it('appelle navigator.vibrate avec le motif success ([15, 40, 15])', () => {
        HapticManager.vibrate('success');
        expect(vibrateMock).toHaveBeenCalledWith([15, 40, 15]);
    });

    it('setPattern() remplace un motif prédéfini', () => {
        HapticManager.setPattern('selection', 5);
        HapticManager.vibrate('selection');
        expect(vibrateMock).toHaveBeenCalledWith(5);
    });

    it('setPatterns() met à jour plusieurs motifs', () => {
        HapticManager.setPatterns({ light: 20, medium: 30 });
        HapticManager.vibrate('light');
        HapticManager.vibrate('medium');
        expect(vibrateMock).toHaveBeenNthCalledWith(1, 20);
        expect(vibrateMock).toHaveBeenNthCalledWith(2, 30);
    });

    it('getPattern() retourne une copie du motif', () => {
        HapticManager.setPattern('error', [5, 10, 5]);
        expect(HapticManager.getPattern('error')).toEqual([5, 10, 5]);
        const copy = HapticManager.getPattern('error') as number[];
        copy.push(99);
        expect(HapticManager.getPattern('error')).toEqual([5, 10, 5]);
    });

    it('resetPatterns() restaure les valeurs d’usine', () => {
        HapticManager.setPattern('selection', 99);
        HapticManager.resetPatterns();
        HapticManager.vibrate('selection');
        expect(vibrateMock).toHaveBeenCalledWith(10);
    });

    it('vibrateRaw() envoie une séquence arbitraire', () => {
        HapticManager.vibrateRaw([8, 12, 8]);
        expect(vibrateMock).toHaveBeenCalledWith([8, 12, 8]);
    });

    it('ne fait rien si setEnabled(false)', () => {
        HapticManager.setEnabled(false);
        HapticManager.vibrate('medium');
        expect(vibrateMock).not.toHaveBeenCalled();
    });

    it('ne fait rien si prefers-reduced-motion est actif', () => {
        window.matchMedia = jest.fn().mockImplementation(() => ({
            matches: true,
            media: '(prefers-reduced-motion: reduce)',
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        }));
        MotionManager.init();

        HapticManager.vibrate('light');
        expect(vibrateMock).not.toHaveBeenCalled();
    });

    it('triggerFromOptions() respecte hapticFeedback', () => {
        HapticManager.triggerFromOptions({ hapticFeedback: true, hapticPattern: 'medium' });
        expect(vibrateMock).toHaveBeenCalledWith(25);

        vibrateMock.mockClear();
        HapticManager.triggerFromOptions({ hapticFeedback: false });
        expect(vibrateMock).not.toHaveBeenCalled();
    });

    it('dégrade silencieusement si vibrate lève une exception', () => {
        vibrateMock.mockImplementation(() => {
            throw new Error('Not allowed');
        });
        expect(() => HapticManager.vibrate('selection')).not.toThrow();
    });
});
