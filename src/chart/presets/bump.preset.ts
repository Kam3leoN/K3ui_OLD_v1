/**
 * @fileoverview Preset bump (ranking)
 */

import type { ChartRenderConfig } from '../engine/renderer';
import {
    buildGrid,
    buildLegend,
    buildTooltip,
    getAnimationSettings,
    getPalette,
    type PresetBuildContext,
} from './shared';

/**
 * Construit la configuration du preset bump (classement)
 */
export function buildBumpPreset(ctx: PresetBuildContext): ChartRenderConfig {
    const { options, data, theme } = ctx;
    const palette = getPalette(ctx);
    const animation = getAnimationSettings(ctx);

    const series = data.datasets.map((dataset, index) => ({
        type: 'line',
        name: dataset.label ?? `Série ${index + 1}`,
        smooth: true,
        symbolSize: 10,
        emphasis: { focus: 'series' },
        data: (dataset.data as number[]).map((rank, timeIndex) => [timeIndex, rank]),
        itemStyle: {
            color: dataset.color ?? palette[index % palette.length],
        },
        lineStyle: {
            width: 3,
        },
    }));

    return {
        ...animation,
        color: palette,
        tooltip: { ...buildTooltip(theme, options.showTooltip), trigger: 'item' },
        legend: buildLegend(theme, options.showLegend),
        grid: buildGrid(options.showGrid),
        xAxis: {
            type: 'category',
            data: data.labels,
            axisLine: { lineStyle: { color: theme.axisColor } },
            axisLabel: { color: theme.axisColor },
        },
        yAxis: {
            type: 'value',
            inverse: true,
            min: 1,
            max: data.datasets.length || 10,
            axisLine: { lineStyle: { color: theme.axisColor } },
            axisLabel: { color: theme.axisColor },
            splitLine: {
                show: options.showGrid,
                lineStyle: { color: theme.gridColor },
            },
        },
        series,
    };
}
