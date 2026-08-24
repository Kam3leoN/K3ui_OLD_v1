/**
 * @fileoverview Preset bar-negative (barres horizontales avec valeurs négatives)
 */

import type { ChartRenderConfig } from '../engine/renderer';
import {
    buildCategoryAxis,
    buildGrid,
    buildLegend,
    buildTooltip,
    buildValueAxis,
    getAnimationSettings,
    getPalette,
    type PresetBuildContext,
} from './shared';

/**
 * Détermine la position du label selon le signe de la valeur
 */
function resolveNegativeBarLabelPosition(value: number): 'left' | 'inside' | 'right' {
    if (value < 0) {
        return 'left';
    }
    return 'inside';
}

/**
 * Construit la configuration du preset bar-negative
 */
export function buildBarNegativePreset(ctx: PresetBuildContext): ChartRenderConfig {
    const { options, data, theme } = ctx;
    const palette = getPalette(ctx, data.datasets.length);
    const animation = getAnimationSettings(ctx);
    const borderRadius = options.borderRadius ?? 4;

    const series = data.datasets.map((dataset, index) => ({
        type: 'bar',
        name: dataset.label ?? `Série ${index + 1}`,
        data: dataset.data as number[],
        itemStyle: {
            borderRadius: [0, borderRadius, borderRadius, 0],
            color: dataset.color ?? palette[index % palette.length],
            borderWidth: 0,
        },
        label: {
            show: options.showLabels,
            formatter: '{c}',
            color: theme.textColor,
            position: (params: { value: number }) => resolveNegativeBarLabelPosition(Number(params.value)),
        },
    }));

    return {
        ...animation,
        color: palette,
        tooltip: { ...buildTooltip(theme, options.showTooltip), trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: buildLegend(theme, options.showLegend),
        grid: buildGrid(options.showGrid),
        xAxis: {
            ...buildValueAxis(theme, options.showGrid, 'bottom'),
            axisLine: { onZero: true, lineStyle: { color: theme.axisColor } },
        },
        yAxis: {
            ...buildCategoryAxis(theme, data.labels, false),
            type: 'category',
        },
        series,
    };
}

