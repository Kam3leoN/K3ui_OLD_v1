/**
 * Tests morph LoadingIndicator — paths SVG bruts + helpers SMIL
 */

import {
    SHAPE_COUNT,
    MORPH_VIEWPORT,
    MORPH_VIEWPORT_PADDING,
    getMorphSvgViewBox,
    getMorphablePath,
    getMorphablePathsForSequence,
    getShapeViewportOffset,
    getShapeViewBoxSize,
    buildMorphKeyTimes,
    buildMorphRotationValues,
    cubicBezierToKeySplines,
} from '../../../src/utils/loading-indicator/morph';
import { M3_OFFICIAL_SHAPE_PATHS } from '../../../src/utils/loading-indicator/shape-paths';
import { computeMorphAnimationState } from '../../../src/utils/loading-indicator/animator';
import {
    LOADING_INDICATOR_CONSTANT_ROTATION_DEG,
    LOADING_INDICATOR_EXTRA_ROTATION_DEG,
    getLoaderMotionTiming,
} from '../../../src/specs/components/loader.specs';

describe('loading-indicator morph utils', () => {
    it('SHAPE_COUNT = 7', () => {
        expect(SHAPE_COUNT).toBe(7);
    });

    it('getMorphablePath = path brut assets (sans scale)', () => {
        const path = getMorphablePath('burstsoft');
        expect(path).toBe(M3_OFFICIAL_SHAPE_PATHS.burstsoft.pathD);
        expect(path).toMatch(/^M145\.15/);
    });

    it('getMorphablePathsForSequence retourne 7 paths bruts', () => {
        const paths = getMorphablePathsForSequence([
            'burstsoft', 'sides9', 'pentagon', 'pill', 'sunny', 'sides4', 'oval',
        ]);
        expect(paths).toHaveLength(7);
        expect(paths[0]).toBe(M3_OFFICIAL_SHAPE_PATHS.burstsoft.pathD);
    });

    it('MORPH_CANVAS = 340 (sunny)', () => {
        expect(MORPH_VIEWPORT).toBe(340);
    });

    it('getMorphSvgViewBox inclut padding anti-clipping pill', () => {
        expect(MORPH_VIEWPORT_PADDING).toBeGreaterThan(0);
        expect(getMorphSvgViewBox()).toBe(`-${MORPH_VIEWPORT_PADDING} -${MORPH_VIEWPORT_PADDING} ${340 + MORPH_VIEWPORT_PADDING * 2} ${340 + MORPH_VIEWPORT_PADDING * 2}`);
    });

    it('getShapeViewportOffset centre la shape dans le viewport 340', () => {
        expect(getShapeViewportOffset('sunny')).toEqual({ x: 0, y: 0 });
        expect(getShapeViewportOffset('sides4')).toEqual({ x: 30, y: 30 });
        expect(getShapeViewBoxSize('pill')).toBe(300);
    });

    it('buildMorphKeyTimes — 7 shapes', () => {
        expect(buildMorphKeyTimes(7)).toBe('0.000; 0.167; 0.333; 0.500; 0.667; 0.833; 1.000');
    });

    it('buildMorphRotationValues inclut rotation extra', () => {
        const values = buildMorphRotationValues(7).split('; ');
        expect(values.length).toBe(7);
        expect(parseFloat(values[1]!)).toBeGreaterThan(parseFloat(values[0]!));
    });

    it('cubicBezierToKeySplines extrait les 4 nombres', () => {
        const splines = cubicBezierToKeySplines('cubic-bezier(0.39, 1.29, 0.35, 0.98)', 7);
        expect(splines).toContain('0.39 1.29 0.35 0.98');
    });

    it('computeMorphAnimationState — rotation double', () => {
        const timing = getLoaderMotionTiming();
        const atStart = computeMorphAnimationState(0, { shapeCount: 7, timing });
        expect(atStart.rotationDeg).toBe(0);
        const mid = computeMorphAnimationState(timing.cycleDurationMs / 2, { shapeCount: 7, timing });
        expect(mid.rotationDeg).toBeGreaterThan(LOADING_INDICATOR_CONSTANT_ROTATION_DEG / 2 - 50);
    });

    it('computeMorphAnimationState — reduced-motion statique', () => {
        const state = computeMorphAnimationState(9999, { shapeCount: 7, reducedMotion: true });
        expect(state.rotationDeg).toBe(0);
    });

    it('EXTRA_ROTATION_DEG = 90', () => {
        expect(LOADING_INDICATOR_EXTRA_ROTATION_DEG).toBe(90);
    });
});
