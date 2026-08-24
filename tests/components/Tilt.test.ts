/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant Tilt (moteur natif)
 */

jest.mock('../../src/utils/accessibility', () => ({
    getPreferReducedMotion: jest.fn(() => false),
}));

import { Tilt } from '../../src/components/Tilt';
import { getPreferReducedMotion } from '../../src/utils/accessibility';
import { TILT_ENGINE_KEY } from '../../src/utils/effects/tiltDom';

type TiltEngineHost = HTMLElement & { [key: string]: unknown };

describe('Tilt', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (getPreferReducedMotion as jest.Mock).mockReturnValue(false);
        document.body.innerHTML = `
            <div id="tilt" class="tilt" style="width:300px;height:200px" data-rotate-x-max="20">
                <img src="test.jpg" alt="Test" data-tilt-offset="-5">
            </div>
        `;
    });

    it('devrait ajouter la classe tilt', () => {
        const el = document.getElementById('tilt') as HTMLElement;
        new Tilt(el, {});
        expect(el.classList.contains('tilt')).toBe(true);
        expect(el.classList.contains('atropos')).toBe(false);
    });

    it('devrait créer la structure interne si absente', () => {
        const el = document.getElementById('tilt') as HTMLElement;
        new Tilt(el, {});
        expect(el.querySelector('.tilt-scale')).toBeTruthy();
        expect(el.querySelector('.tilt-rotate')).toBeTruthy();
        expect(el.querySelector('.tilt-inner')).toBeTruthy();
        expect(el.querySelector('img')).toBeTruthy();
    });

    it('devrait initialiser le moteur natif', () => {
        const el = document.getElementById('tilt') as HTMLElement;
        new Tilt(el, { rotateXMax: 25 });
        expect((el as TiltEngineHost)[TILT_ENGINE_KEY]).toBeDefined();
    });

    it('devrait lire data-rotate-x-max depuis le DOM', () => {
        const el = document.getElementById('tilt') as HTMLElement;
        const instance = new Tilt(el, {});
        expect(instance.options.rotateXMax).toBe(20);
    });

    it('devrait exposer getInstance via Component', () => {
        const el = document.getElementById('tilt') as HTMLElement;
        new Tilt(el, {});
        expect(Tilt.getInstance(el)).toBeDefined();
    });

    it('devrait initialiser via init', () => {
        const el = document.getElementById('tilt') as HTMLElement;
        const result = Tilt.init(el, {});
        const instances = Array.isArray(result) ? result : [result];
        expect(instances.length).toBe(1);
    });

    it('defaults devrait inclure les options Tilt', () => {
        const def = Tilt.defaults;
        expect(def.rotateXMax).toBe(15);
        expect(def.rotateYMax).toBe(15);
        expect(def.duration).toBe(300);
        expect(def.shadow).toBe(true);
        expect(def.respectReducedMotion).toBe(true);
    });

    it('devrait détruire le moteur sans erreur', () => {
        const el = document.getElementById('tilt') as HTMLElement;
        const instance = new Tilt(el, {});
        expect(() => instance.destroy()).not.toThrow();
        expect((el as TiltEngineHost)[TILT_ENGINE_KEY]).toBeUndefined();
    });

    it('devrait désactiver complètement si reduced motion', () => {
        (getPreferReducedMotion as jest.Mock).mockReturnValue(true);
        const el = document.getElementById('tilt') as HTMLElement;
        new Tilt(el, {});
        expect((el as TiltEngineHost)[TILT_ENGINE_KEY]).toBeUndefined();
        expect(el.classList.contains('tilt--reduced-motion')).toBe(true);
    });

    it('devrait réactiver quand reduced motion est levé', () => {
        (getPreferReducedMotion as jest.Mock).mockReturnValue(true);
        const el = document.getElementById('tilt') as HTMLElement;
        const instance = new Tilt(el, {});
        expect((el as TiltEngineHost)[TILT_ENGINE_KEY]).toBeUndefined();

        (getPreferReducedMotion as jest.Mock).mockReturnValue(false);
        instance.reinit();

        expect(el.classList.contains('tilt--reduced-motion')).toBe(false);
        expect((el as TiltEngineHost)[TILT_ENGINE_KEY]).toBeDefined();
    });

    it('devrait forcer la désactivation via reducedMotion (option instance)', () => {
        (getPreferReducedMotion as jest.Mock).mockReturnValue(false);
        const el = document.getElementById('tilt') as HTMLElement;
        new Tilt(el, { reducedMotion: true, respectReducedMotion: false });
        expect((el as TiltEngineHost)[TILT_ENGINE_KEY]).toBeUndefined();
        expect(el.classList.contains('tilt--reduced-motion')).toBe(true);
    });

    it('reinitAtropos reste disponible (alias deprecated)', () => {
        const el = document.getElementById('tilt') as HTMLElement;
        const instance = new Tilt(el, {});
        expect(() => instance.reinitAtropos()).not.toThrow();
    });

    it('devrait accepter data-atropos-offset (alias legacy)', () => {
        document.body.innerHTML = `
            <div id="tilt-legacy" class="tilt" style="width:300px;height:200px">
                <img src="test.jpg" alt="Test" data-atropos-offset="-5">
            </div>
        `;
        const el = document.getElementById('tilt-legacy') as HTMLElement;
        expect(() => new Tilt(el, {})).not.toThrow();
        expect((el as TiltEngineHost)[TILT_ENGINE_KEY]).toBeDefined();
    });
});
