/**
 * Tests unitaires pour buildMotionTransition
 */

import {
    buildSpatialEffectsTransition,
    shouldSkipMotion,
    getMotionSpringPair,
} from '../../src/utils/motion/buildMotionTransition';
import { MotionPresets } from '../../src/specs/common/motion-presets.specs';
import { MotionManager } from '../../src/core/managers/MotionManager';

describe('buildMotionTransition', () => {
    beforeEach(() => {
        document.documentElement.style.setProperty('--md-sys-motion-spatial-default-duration', '500ms');
        document.documentElement.style.setProperty(
            '--md-sys-motion-spatial-default-easing',
            'cubic-bezier(0.38, 1.21, 0.22, 1)'
        );
        document.documentElement.style.setProperty('--md-sys-motion-effects-default-duration', '200ms');
        document.documentElement.style.setProperty(
            '--md-sys-motion-effects-default-easing',
            'cubic-bezier(0.34, 0.8, 0.34, 1)'
        );
    });

    afterEach(() => {
        MotionManager.setOverride(null);
    });

    test('buildSpatialEffectsTransition lit les tokens M3', () => {
        const transition = buildSpatialEffectsTransition('default', 'default');
        expect(transition).toContain('transform 500ms');
        expect(transition).toContain('opacity 200ms');
    });

    test('getMotionSpringPair retourne spatial et effects', () => {
        const pair = getMotionSpringPair(
            MotionPresets.dialogModal.spatialSpeed,
            MotionPresets.dialogModal.effectsSpeed
        );
        expect(pair.spatial.durationMs).toBe(500);
        expect(pair.effects.durationMs).toBe(200);
    });

    test('shouldSkipMotion respecte l\'override MotionManager', () => {
        MotionManager.setOverride(true);
        expect(shouldSkipMotion()).toBe(true);
        MotionManager.setOverride(false);
        expect(shouldSkipMotion()).toBe(false);
    });
});
