/**
 * @fileoverview Preset scatter-clustering
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
 * Construit la configuration du preset scatter-clustering
 */
export function buildScatterClusteringPreset(ctx: PresetBuildContext): ChartRenderConfig {
    const { options, data, theme } = ctx;
    const palette = getPalette(ctx);
    const animation = getAnimationSettings(ctx);
    const clusterCount = options.clusterCount ?? 6;

    const points = (data.datasets[0]?.data as number[][]) ?? [];

    return {
        ...animation,
        color: palette,
        tooltip: buildTooltip(theme, options.showTooltip),
        legend: buildLegend(theme, options.showLegend),
        grid: buildGrid(options.showGrid),
        xAxis: buildValueAxis(theme, options.showGrid),
        yAxis: buildValueAxis(theme, options.showGrid),
        visualMap: {
            show: true,
            dimension: 2,
            min: 0,
            max: Math.max(0, clusterCount - 1),
            inRange: {
                color: palette,
            },
            textStyle: { color: theme.textColor },
        },
        series: [
            {
                type: 'scatter',
                symbolSize: 14,
                data: points,
            },
        ],
    };
}
