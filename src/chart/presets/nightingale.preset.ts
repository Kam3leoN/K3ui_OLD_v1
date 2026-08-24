/**
 * @fileoverview Preset nightingale (rose chart)
 */

import type { ChartRenderConfig } from '../engine/renderer';
import {
    applyPaletteToPieSeries,
    buildLegend,
    buildNamedValueSeries,
    buildTooltip,
    buildHiddenSliceLabels,
    getAnimationSettings,
    getPalette,
    sortPieSeriesDescending,
    type PresetBuildContext,
} from './shared';

/**
 * Construit la configuration du preset nightingale
 */
export function buildNightingalePreset(ctx: PresetBuildContext): ChartRenderConfig {
    const { options, data, theme } = ctx;
    const itemCount = Math.max(data.labels.length, 1);
    const palette = getPalette(ctx, itemCount);
    const animation = getAnimationSettings(ctx);
    const gap = options.padAngle ?? 2;
    const seriesData = applyPaletteToPieSeries(
        sortPieSeriesDescending(buildNamedValueSeries(ctx)),
        palette
    );

    return {
        ...animation,
        color: palette,
        tooltip: buildTooltip(theme, options.showTooltip),
        legend: buildLegend(theme, options.showLegend),
        series: [
            {
                type: 'pie',
                radius: ['20%', '75%'],
                roseType: 'radius',
                startAngle: 90,
                clockwise: true,
                padAngle: gap,
                itemStyle: {
                    borderRadius: options.borderRadius ?? 8,
                    borderWidth: 0,
                },
                ...buildHiddenSliceLabels(),
                data: seriesData,
            },
        ],
    };
}
