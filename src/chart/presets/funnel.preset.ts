/**
 * @fileoverview Preset funnel (entonnoir)
 */

import type { ChartRenderConfig } from '../engine/renderer';
import {
    buildLegend,
    buildTooltip,
    buildNamedValueSeries,
    getAnimationSettings,
    getPalette,
    type PresetBuildContext,
} from './shared';

/**
 * Construit la configuration du preset funnel
 */
export function buildFunnelPreset(ctx: PresetBuildContext): ChartRenderConfig {
    const { options, theme } = ctx;
    const palette = getPalette(ctx);
    const animation = getAnimationSettings(ctx);
    const seriesData = buildNamedValueSeries(ctx);

    return {
        ...animation,
        color: palette,
        tooltip: { ...buildTooltip(theme, options.showTooltip), trigger: 'item' },
        legend: buildLegend(theme, options.showLegend),
        series: [
            {
                type: 'funnel',
                left: '10%',
                top: '8%',
                bottom: '12%',
                width: '80%',
                min: 0,
                max: Math.max(...seriesData.map((item) => item.value), 1),
                minSize: '0%',
                maxSize: '100%',
                sort: 'descending',
                orient: 'vertical',
                funnelAlign: 'center',
                gap: 0,
                label: {
                    show: options.showLabels,
                    position: 'inside',
                    color: '#fff',
                },
                labelLine: {
                    show: false,
                },
                itemStyle: {
                    borderRadius: 0,
                    borderWidth: 0,
                    borderColor: 'transparent',
                },
                emphasis: {
                    itemStyle: {
                        borderWidth: 0,
                        borderColor: 'transparent',
                    },
                },
                data: seriesData,
            },
        ],
    };
}
