/**
 * Tests unitaires pour MotionManager
 * @description Valide la politique globale reduced motion : système + override + toggle.
 */

/// <reference types="@types/jest" />

import { MotionManager } from '../../src/core/managers/MotionManager';
import { getPreferReducedMotion, toggleReducedMotion } from '../../src/utils/accessibility/reducedMotion';
import { getK3uiGlobal } from '../../src/types/global/k3ui-window';

describe('MotionManager', () => {
    beforeEach(() => {
        document.documentElement.classList.remove('k3ui-reduced-motion');
        document.documentElement.removeAttribute('data-k3ui-motion');
        if (typeof window !== 'undefined') {
            window.K = undefined;
        }
        MotionManager.setOverride(null);
    });

    it('passe en reduced motion quand prefers-reduced-motion est activé (système)', () => {
        window.matchMedia = jest.fn().mockImplementation(() => ({
            matches: true,
            media: '(prefers-reduced-motion: reduce)',
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn()
        }));

        MotionManager.init();

        expect(MotionManager.isReducedMotion()).toBe(true);
        expect(document.documentElement.classList.contains('k3ui-reduced-motion')).toBe(true);
        expect(getPreferReducedMotion()).toBe(true);
    });

    it('override=false désactive reduced motion même si le système est en reduced', () => {
        window.matchMedia = jest.fn().mockImplementation(() => ({
            matches: true,
            media: '(prefers-reduced-motion: reduce)',
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn()
        }));

        MotionManager.init();
        MotionManager.setOverride(false);

        expect(MotionManager.isReducedMotion()).toBe(false);
        expect(document.documentElement.classList.contains('k3ui-reduced-motion')).toBe(false);
        expect(getK3uiGlobal()?.preferReducedMotion).toBe(false);
        expect(getPreferReducedMotion()).toBe(false);
    });

    it('toggleReducedMotion force un override (toggle) via MotionManager', () => {
        window.matchMedia = jest.fn().mockImplementation(() => ({
            matches: false,
            media: '(prefers-reduced-motion: reduce)',
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn()
        }));

        MotionManager.init();
        // Etat initial : système = full motion
        expect(getPreferReducedMotion()).toBe(false);

        // Toggle : met un override=true (donc reduced)
        const next = toggleReducedMotion();
        expect(next).toBe(true);
        expect(MotionManager.isReducedMotion()).toBe(true);
        expect(getK3uiGlobal()?.preferReducedMotion).toBe(true);
        expect(document.documentElement.classList.contains('k3ui-reduced-motion')).toBe(true);
    });
});

