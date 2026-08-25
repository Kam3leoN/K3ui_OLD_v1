/// <reference types="@types/jest" />
/**
 * Tests anti-régression — physique de geste M3 (Sheet / Drawer)
 */

import {
    FLING_THRESHOLD,
    VelocityTracker,
    animateSpring,
    clamp,
    nearestDetentIndex,
    projectFling,
    rubberBand,
    shouldDismissByGesture,
    springSpecForVelocity,
    M3_SPRING,
} from '../../src/utils/motion/gesture-physics';

describe('gesture-physics', () => {
    describe('rubberBand', () => {
        test('retourne 0 si overshoot ou dimension invalides', () => {
            expect(rubberBand(0, 100)).toBe(0);
            expect(rubberBand(10, 0)).toBe(0);
            expect(rubberBand(-5, 100)).toBe(0);
        });

        test('est inférieur à l\'overshoot (résistance)', () => {
            const overshoot = 80;
            const band = rubberBand(overshoot, 400);
            expect(band).toBeGreaterThan(0);
            expect(band).toBeLessThan(overshoot);
        });
    });

    describe('projectFling', () => {
        test('projette plus loin avec une vitesse positive', () => {
            const pos = 100;
            const projected = projectFling(pos, 800);
            expect(projected).toBeGreaterThan(pos);
        });

        test('reste stable à vitesse nulle', () => {
            expect(projectFling(50, 0)).toBe(50);
        });
    });

    describe('VelocityTracker', () => {
        test('velocity = 0 avec moins de 2 échantillons', () => {
            const t = new VelocityTracker();
            t.add(0, 0);
            expect(t.velocity).toBe(0);
        });

        test('estime une vitesse en px/s', () => {
            const t = new VelocityTracker(200);
            t.add(0, 0);
            t.add(100, 100); // 100 px en 100 ms → 1000 px/s
            expect(t.velocity).toBeCloseTo(1000, 0);
        });

        test('reset efface les échantillons', () => {
            const t = new VelocityTracker();
            t.add(0, 0);
            t.add(50, 50);
            t.reset();
            expect(t.velocity).toBe(0);
        });
    });

    describe('springSpecForVelocity', () => {
        test('default sous le seuil, fast au-delà', () => {
            expect(springSpecForVelocity(0)).toBe(M3_SPRING.defaultSpatial);
            expect(springSpecForVelocity(FLING_THRESHOLD)).toBe(M3_SPRING.defaultSpatial);
            expect(springSpecForVelocity(FLING_THRESHOLD + 1)).toBe(M3_SPRING.fastSpatial);
            expect(springSpecForVelocity(-(FLING_THRESHOLD + 1))).toBe(M3_SPRING.fastSpatial);
        });
    });

    describe('nearestDetentIndex', () => {
        test('choisit la détente la plus proche', () => {
            const detents = [120, 400, 800];
            expect(nearestDetentIndex(130, detents)).toBe(0);
            expect(nearestDetentIndex(450, detents)).toBe(1);
            expect(nearestDetentIndex(790, detents)).toBe(2);
        });

        test('liste vide → 0', () => {
            expect(nearestDetentIndex(10, [])).toBe(0);
        });
    });

    describe('shouldDismissByGesture', () => {
        test('fling au-delà du seuil', () => {
            expect(shouldDismissByGesture(FLING_THRESHOLD + 1, 0, 100)).toBe(true);
        });

        test('projection au-delà du seuil de dismiss', () => {
            expect(shouldDismissByGesture(0, 101, 100)).toBe(true);
            expect(shouldDismissByGesture(0, 99, 100)).toBe(false);
        });
    });

    describe('clamp', () => {
        test('borne min/max', () => {
            expect(clamp(5, 0, 10)).toBe(5);
            expect(clamp(-1, 0, 10)).toBe(0);
            expect(clamp(11, 0, 10)).toBe(10);
        });
    });

    describe('animateSpring', () => {
        test('atteint la cible immédiatement si prefers-reduced-motion', () => {
            const matchMedia = window.matchMedia;
            window.matchMedia = jest.fn().mockReturnValue({
                matches: true,
                media: '(prefers-reduced-motion: reduce)',
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
            }) as unknown as typeof window.matchMedia;

            const values: number[] = [];
            let completed = false;
            animateSpring({
                from: 0,
                to: 100,
                onUpdate: (v) => values.push(v),
                onComplete: () => {
                    completed = true;
                },
            });

            expect(completed).toBe(true);
            expect(values[values.length - 1]).toBe(100);
            window.matchMedia = matchMedia;
        });
    });
});
