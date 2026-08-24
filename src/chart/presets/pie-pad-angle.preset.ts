/**
 * @fileoverview Preset pie-pad-angle
 */

import type { ChartRenderConfig } from '../engine/renderer';
import {
    buildLegend,
    buildNamedValueSeries,
    buildTooltip,
    buildHiddenSliceLabels,
    getAnimationSettings,
    getPalette,
    type PresetBuildContext,
} from './shared';

/**
 * Construit la configuration du preset pie-pad-angle
 */
export function buildPiePadAnglePreset(ctx: PresetBuildContext): ChartRenderConfig {
    const { options, theme } = ctx;
    const palette = getPalette(ctx);
    const animation = getAnimationSettings(ctx);
    const gap = options.padAngle ?? 5;
    const cornerRadius = options.borderRadius ?? 10;
    const seriesData = buildNamedValueSeries(ctx);

    return {
        ...animation,
        color: palette,
        tooltip: { ...buildTooltip(theme, options.showTooltip), trigger: 'item' },
        legend: buildLegend(theme, options.showLegend),
        series: [
            {
                type: 'pie',
                radius: ['40%', '70%'],
                startAngle: 90,
                clockwise: true,
                padAngle: gap,
                itemStyle: {
                    borderRadius: cornerRadius,
                    borderWidth: 0,
                },
                ...buildHiddenSliceLabels(),
                data: seriesData,
            },
        ],
    };
}
