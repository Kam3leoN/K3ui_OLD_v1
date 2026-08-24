/**
 * @fileoverview Preset radar-multiple
 */

import type { ChartRenderConfig } from '../engine/renderer';
import {
    buildLegend,
    buildTooltip,
    getAnimationSettings,
    getPalette,
    type PresetBuildContext,
} from './shared';

/**
 * Construit la configuration du preset radar-multiple
 */
export function buildRadarMultiplePreset(ctx: PresetBuildContext): ChartRenderConfig {
    const { options, data, theme } = ctx;
    const palette = getPalette(ctx);
    const animation = getAnimationSettings(ctx);

    const indicator = data.labels.map((label) => ({ name: label, max: options.radarMax ?? 100 }));

    const seriesData = data.datasets.map((dataset, index) => ({
        name: dataset.label ?? `Série ${index + 1}`,
        value: dataset.data as number[],
        areaStyle: { opacity: 0.15 },
        lineStyle: { width: 2 },
        itemStyle: { color: dataset.color ?? palette[index % palette.length] },
    }));

    return {
        ...animation,
        color: palette,
        tooltip: buildTooltip(theme, options.showTooltip),
        legend: buildLegend(theme, options.showLegend),
        radar: {
            indicator,
            axisName: { color: theme.axisColor },
            splitLine: { lineStyle: { color: theme.gridColor } },
            splitArea: { show: false },
        },
        series: [
            {
                type: 'radar',
                emphasis: { lineStyle: { width: 4 } },
                data: seriesData,
            },
        ],
    };
}
