/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant Heatmap
 */

import { Heatmap } from '../../src/components/Heatmap';

describe('Heatmap', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div class="heatmap"></div>';
    });

    it('devrait créer une instance avec les options par défaut', () => {
        const el = document.querySelector('.heatmap') as HTMLElement;
        const instance = new Heatmap(el, {});
        expect(instance).toBeDefined();
        expect(instance.options.year).toBe(new Date().getFullYear());
        expect(instance.options.levels).toBe(5);
        expect(instance.options.data).toEqual([]);
    });

    it('devrait exposer getInstance', () => {
        const el = document.querySelector('.heatmap') as HTMLElement;
        new Heatmap(el, {});
        const got = Heatmap.getInstance(el);
        expect(got).toBeDefined();
    });

    it('devrait construire la grille (cellules, niveaux)', () => {
        const el = document.querySelector('.heatmap') as HTMLElement;
        new Heatmap(el, { data: [{ date: '2025-01-15', count: 5 }] });
        expect(el.querySelector('.heatmap__grid')).toBeTruthy();
        expect(el.querySelectorAll('.heatmap__cell').length).toBeGreaterThan(0);
    });

    it('setData met à jour les données', () => {
        const el = document.querySelector('.heatmap') as HTMLElement;
        const instance = new Heatmap(el, { data: [] });
        instance.setData([{ date: '2025-02-01', count: 10 }]);
        expect(instance.options.data).toHaveLength(1);
        expect(instance.options.data[0].count).toBe(10);
    });

    it('setYear change l\'année', () => {
        const el = document.querySelector('.heatmap') as HTMLElement;
        const instance = new Heatmap(el, { year: 2024 });
        instance.setYear(2023);
        expect(instance.options.year).toBe(2023);
    });

    it('devrait détruire proprement', () => {
        const el = document.querySelector('.heatmap') as HTMLElement;
        const instance = new Heatmap(el, {});
        instance.destroy();
        expect(Heatmap.getInstance(el)).toBeFalsy();
    });
});
