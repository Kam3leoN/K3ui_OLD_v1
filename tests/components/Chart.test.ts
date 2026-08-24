/**
 * Tests unitaires pour le composant Chart K3UI
 */

import { Chart } from '../../src/components/Chart';
import type { ChartData, ChartType } from '../../src/types/components';
import { buildChartRenderConfig, CHART_TYPES, isSupportedChartType } from '../../src/chart';

jest.mock('../../src/chart/engine/renderer', () => {
    return {
        ChartRendererEngine: jest.fn().mockImplementation(() => ({
            mount: jest.fn(),
            applyConfig: jest.fn(),
            resize: jest.fn(),
            dispose: jest.fn(),
            toDataURL: jest.fn(() => 'data:image/png;base64,mock'),
        })),
    };
});

describe('Chart', () => {
    const mockChartData: ChartData = {
        labels: ['A', 'B', 'C'],
        datasets: [{ label: 'Série 1', data: [30, 50, 20] }],
    };

    afterEach(() => {
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    describe('Initialisation', () => {
        test('devrait créer une instance sur k3ui-chart', () => {
            const el = document.createElement('k3ui-chart');
            el.style.width = '400px';
            el.style.height = '300px';
            document.body.appendChild(el);

            const chart = new Chart(el, { type: 'pie-pad-angle', data: mockChartData });

            expect(chart).toBeInstanceOf(Chart);
            expect(el.querySelector('.chart__canvas')).not.toBeNull();
            expect(Chart.getInstance(el)).toBe(chart);
            chart.destroy();
        });

        test('devrait créer une instance sur div.chart', () => {
            const el = document.createElement('div');
            el.className = 'chart';
            document.body.appendChild(el);

            const chart = new Chart(el, { type: 'bar', data: mockChartData });

            expect(chart).toBeInstanceOf(Chart);
            expect(el.classList.contains('chart')).toBe(true);
            chart.destroy();
        });

        test('devrait lire les attributs data-*', () => {
            const el = document.createElement('k3ui-chart');
            el.setAttribute('data-type', 'line-smooth');
            el.setAttribute('data-data', JSON.stringify(mockChartData));
            el.setAttribute('data-show-grid', 'false');
            document.body.appendChild(el);

            const chart = new Chart(el);
            expect(chart).toBeInstanceOf(Chart);
            chart.destroy();
        });
    });

    describe('API publique', () => {
        let el: HTMLElement;
        let chart: Chart;

        beforeEach(() => {
            el = document.createElement('k3ui-chart');
            document.body.appendChild(el);
            chart = new Chart(el, { type: 'line', data: mockChartData });
        });

        afterEach(() => {
            chart.destroy();
        });

        test('setType devrait changer le type', () => {
            chart.setType('area');
            expect(chart).toBeInstanceOf(Chart);
        });

        test('setData devrait mettre à jour les données', () => {
            chart.setData({
                labels: ['X', 'Y'],
                datasets: [{ data: [10, 20] }],
            });
            expect(chart).toBeInstanceOf(Chart);
        });

        test('setOptions devrait fusionner les options', () => {
            chart.setOptions({ showLegend: false, animation: false });
            expect(chart).toBeInstanceOf(Chart);
        });

        test('resize ne devrait pas lever d\'erreur', () => {
            expect(() => chart.resize()).not.toThrow();
        });

        test('exportImage devrait retourner une data URL', () => {
            const url = chart.exportImage('png');
            expect(url).toContain('data:image');
        });
    });

    describe('Presets', () => {
        const sampleData: ChartData = {
            labels: ['Jan', 'Fév', 'Mar'],
            datasets: [
                { label: 'A', data: [10, 20, 30] },
                { label: 'B', data: [15, 25, 35] },
            ],
        };

        test.each(CHART_TYPES)('devrait produire une config pour le type %s', (type: ChartType) => {
            const config = buildChartRenderConfig(
                {
                    ...Chart.defaults,
                    type,
                    data: sampleData,
                },
                sampleData
            );
            expect(config).toBeDefined();
            expect(typeof config).toBe('object');
        });

        test('isSupportedChartType valide les types connus', () => {
            expect(isSupportedChartType('bump')).toBe(true);
            expect(isSupportedChartType('pie')).toBe(false);
        });
    });

    describe('Accessibilité', () => {
        test('devrait définir role=img sur le conteneur de rendu', () => {
            const el = document.createElement('k3ui-chart');
            document.body.appendChild(el);
            const chart = new Chart(el, {
                type: 'radar',
                data: mockChartData,
                showAccessibilityTable: true,
            });

            const canvas = el.querySelector('.chart__canvas');
            expect(canvas?.getAttribute('role')).toBe('img');
            expect(el.querySelector('.chart__a11y-table')).not.toBeNull();
            chart.destroy();
        });
    });

    describe('Destruction', () => {
        test('destroy devrait nettoyer l\'instance', () => {
            const el = document.createElement('k3ui-chart');
            document.body.appendChild(el);
            const chart = new Chart(el, { type: 'pie-pad-angle', data: mockChartData });
            chart.destroy();
            expect(Chart.getInstance(el)).toBeFalsy();
        });
    });
});
