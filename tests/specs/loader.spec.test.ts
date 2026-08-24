/**
 * Tests des spécifications Loader (M3 motion + dimensions)
 */

import {
    LOADING_INDICATOR_SHAPE_COUNT,
    LOADING_INDICATOR_SHAPE_CONTAINER_RATIO,
    LOADING_INDICATOR_CONSTANT_ROTATION_DEG,
    LOADING_INDICATOR_EXTRA_ROTATION_DEG,
    LOADING_INDICATOR_DEFAULT_INDICATOR_COLOR,
    LOADING_INDICATOR_DEFAULT_CONTAINER_COLOR,
    LOADING_INDICATOR_DEFAULT_CONTAINER_INDICATOR_COLOR,
    M3_EXPRESSIVE_SHAPE_SEQUENCE,
    getLoaderMotionTiming,
    getDefaultMorphCycleDurationMs,
    LoaderSpecs,
} from '../../src/specs/components/loader.specs';
import { SHAPE_COUNT } from '../../src/utils/loading-indicator/morph';
import { MOTION_EXPRESSIVE_SPATIAL_SLOW_DURATION_MS } from '../../src/utils/motion/motionSpring';

describe('loader.specs', () => {
    it('séquence M3 = 7 shapes', () => {
        expect(M3_EXPRESSIVE_SHAPE_SEQUENCE).toHaveLength(7);
        expect(LOADING_INDICATOR_SHAPE_COUNT).toBe(7);
        expect(SHAPE_COUNT).toBe(7);
    });

    it('sizeRatio = 42/48 (headroom pill)', () => {
        expect(LOADING_INDICATOR_SHAPE_CONTAINER_RATIO).toBeCloseTo(42 / 48, 5);
        expect(LoaderSpecs.shapeContainerRatio).toBeCloseTo(42 / 48, 5);
    });

    it('cycle = SHAPE_COUNT × durée spatial-slow', () => {
        const timing = getLoaderMotionTiming();
        expect(timing.durationPerShapeMs).toBe(MOTION_EXPRESSIVE_SPATIAL_SLOW_DURATION_MS);
        expect(timing.cycleDurationMs).toBe(SHAPE_COUNT * timing.durationPerShapeMs);
        expect(getDefaultMorphCycleDurationMs()).toBe(7 * 650);
        expect(LoaderSpecs.morphDuration).toBe(7 * 650);
    });

    it('constantes rotation M3 Android', () => {
        expect(LOADING_INDICATOR_CONSTANT_ROTATION_DEG).toBe(360);
        expect(LOADING_INDICATOR_EXTRA_ROTATION_DEG).toBe(90);
        expect(LoaderSpecs.constantRotationDeg).toBe(360);
        expect(LoaderSpecs.extraRotationDeg).toBe(90);
    });

    it('variantes default/contained — rôles couleur M3', () => {
        expect(LoaderSpecs.container).toBe(false);
        expect(LoaderSpecs.indicatorColor).toBe('');
        expect(LoaderSpecs.containerColor).toBe('');
        expect(LOADING_INDICATOR_DEFAULT_INDICATOR_COLOR).toContain('primary');
        expect(LOADING_INDICATOR_DEFAULT_CONTAINER_COLOR).toContain('primary-container');
        expect(LOADING_INDICATOR_DEFAULT_CONTAINER_INDICATOR_COLOR).toContain('on-primary-container');
    });
});
