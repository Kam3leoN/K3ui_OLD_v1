/**
 * @fileoverview Preset bar (vertical, border radius)
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
 * Construit la configuration du preset bar vertical
 */
export function buildBarPreset(ctx: PresetBuildContext): ChartRenderConfig {
    const { options, data, theme } = ctx;
    const palette = getPalette(ctx);
    const animation = getAnimationSettings(ctx);
    const borderRadius = options.borderRadius ?? 8;

    const series = data.datasets.map((dataset, index) => ({
        type: 'bar',
        name: dataset.label ?? `Série ${index + 1}`,
        data: dataset.data as number[],
        itemStyle: {
            borderRadius: [borderRadius, borderRadius, 0, 0],
            color: dataset.color ?? palette[index % palette.length],
        },
    }));

    return {
        ...animation,
        color: palette,
        tooltip: { ...buildTooltip(theme, options.showTooltip), trigger: 'axis' },
        legend: buildLegend(theme, options.showLegend),
        grid: buildGrid(options.showGrid),
        xAxis: buildCategoryAxis(theme, data.labels, false),
        yAxis: buildValueAxis(theme, options.showGrid),
        series,
    };
}
