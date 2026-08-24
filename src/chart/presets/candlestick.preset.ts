/**
 * @fileoverview Preset candlestick
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
 * Construit la configuration du preset candlestick
 */
export function buildCandlestickPreset(ctx: PresetBuildContext): ChartRenderConfig {
    const { options, data, theme } = ctx;
    const palette = getPalette(ctx);
    const animation = getAnimationSettings(ctx);
    const dataset = data.datasets[0];

    const ohlcData = (dataset?.data as number[][]).map((row) => {
        if (row.length >= 4) {
            return [row[0], row[1], row[2], row[3]];
        }
        return row;
    });

    return {
        ...animation,
        color: palette,
        tooltip: { ...buildTooltip(theme, options.showTooltip), trigger: 'axis' },
        legend: buildLegend(theme, options.showLegend),
        grid: buildGrid(options.showGrid),
        xAxis: buildCategoryAxis(theme, data.labels, false),
        yAxis: buildValueAxis(theme, options.showGrid),
        series: [
            {
                type: 'candlestick',
                name: dataset?.label ?? 'OHLC',
                data: ohlcData,
                itemStyle: {
                    color: palette[0],
                    color0: palette[1] ?? '#7D5260',
                    borderColor: palette[0],
                    borderColor0: palette[1] ?? '#7D5260',
                },
            },
        ],
    };
}
