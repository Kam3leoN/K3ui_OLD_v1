/**
 * @fileoverview Preset scatter
 */

import type { ChartRenderConfig } from '../engine/renderer';
import {
    buildGrid,
    buildLegend,
    buildTooltip,
    buildValueAxis,
    getAnimationSettings,
    getPalette,
    type PresetBuildContext,
} from './shared';

/**
 * Construit la configuration du preset scatter
 */
export function buildScatterPreset(ctx: PresetBuildContext): ChartRenderConfig {
    const { options, data, theme } = ctx;
    const palette = getPalette(ctx);
    const animation = getAnimationSettings(ctx);

    const series = data.datasets.map((dataset, index) => {
        const points = (dataset.data as number[][]).map((point, pointIndex) => ({
            value: point,
            name: data.labels[pointIndex] ?? `${pointIndex}`,
        }));

        return {
            type: 'scatter',
            name: dataset.label ?? `Série ${index + 1}`,
            symbolSize: 12,
            data: points.length ? points : (dataset.data as number[]).map((v, i) => [i, v]),
            itemStyle: {
                color: dataset.color ?? palette[index % palette.length],
            },
        };
    });

    return {
        ...animation,
        color: palette,
        tooltip: buildTooltip(theme, options.showTooltip),
        legend: buildLegend(theme, options.showLegend),
        grid: buildGrid(options.showGrid),
        xAxis: buildValueAxis(theme, options.showGrid),
        yAxis: buildValueAxis(theme, options.showGrid),
        series,
    };
}
