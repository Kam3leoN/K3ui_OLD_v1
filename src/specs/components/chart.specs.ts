/**
 * @fileoverview Spécifications du composant Chart K3UI
 * @description Spécifications et comportements pour les graphiques K3UI
 */

import type { AnimationConfig } from '../../types/components/animations';
import { ChartOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Spécifications du composant Chart
 */
export const ChartSpecs = {
    behaviors: {
        interactive: true,
        responsive: true,
        adaptive: true,
    },

    animations: {
        render: {
            type: 'custom' as const,
            duration: 1000,
            easing: 'ease-out' as const,
            direction: 'in' as const,
        } as AnimationConfig,
    },

    types: {
        available: [
            'pie-pad-angle',
            'nightingale',
            'funnel',
            'heatmap',
            'bar',
            'bar-horizontal',
            'scatter',
            'scatter-clustering',
            'candlestick',
            'radar',
            'radar-multiple',
            'line',
            'line-smooth',
            'area',
            'line-stacked',
            'area-stacked',
            'bump',
            'basic-chord',
            'sunburst-rounded',
            'mixed-line-bar',
            'bar-negative',
            'ring-gauge',
        ] as const,

        default: 'pie-pad-angle' as const,
    },

    accessibility: {
        role: 'img' as const,
        focusable: false,
        respectReducedMotion: true,
    },

    responsive: {
        adaptive: true,
        minWidth: 200,
        minHeight: 200,
    },

    theming: {
        followSystemTheme: true,
        defaultColors: [
            '#5470c6',
            '#91cc75',
            '#fac858',
            '#ee6666',
            '#73c0de',
            '#3ba272',
            '#fc8452',
            '#9a60b4',
        ],
    },
} as const;

/**
 * Extrait les valeurs par défaut pour Chart depuis les specs
 */
export function getChartDefaults(): ChartOptions {
    return {
        type: ChartSpecs.types.default,
        data: {
            labels: [],
            datasets: [{ data: [] }],
        },
        theme: 'auto',
        colors: [...ChartSpecs.theming.defaultColors],
        showGrid: true,
        showLegend: true,
        showLabels: true,
        showTooltip: true,
        animation: true,
        animationDuration: ChartSpecs.animations.render.duration,
        padAngle: 5,
        borderRadius: 10,
        radarMax: 100,
        gaugeMax: 100,
        gaugeRingWidth: 40,
        clusterCount: 6,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
        onDataUpdate: null,
        onSeriesClick: null,
        priorityLevel: PriorityLevel.MEDIUM,
        onEvent: null,
    };
}
