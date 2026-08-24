/**
 * @fileoverview Preset mixed-line-bar (barres + ligne, double axe Y)
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
 * Construit la configuration du preset mixed-line-bar
 */
export function buildMixedLineBarPreset(ctx: PresetBuildContext): ChartRenderConfig {
    const { options, data, theme } = ctx;
    const palette = getPalette(ctx, data.datasets.length);
    const animation = getAnimationSettings(ctx);
    const axisNames = data.axisNames ?? ['Valeur', 'Valeur 2'];
    const borderRadius = options.borderRadius ?? 4;

    const series = data.datasets.map((dataset, index) => {
        const isLine = dataset.seriesType === 'line';
        const yAxisIndex = dataset.yAxisIndex ?? (isLine ? 1 : 0);

        if (isLine) {
            return {
                type: 'line',
                name: dataset.label ?? `Série ${index + 1}`,
                yAxisIndex,
                data: dataset.data as number[],
                smooth: true,
                symbol: 'emptyCircle',
                symbolSize: 8,
                itemStyle: {
                    color: dataset.color ?? palette[index % palette.length],
                },
                lineStyle: {
                    width: 2,
                    color: dataset.color ?? palette[index % palette.length],
                },
            };
        }

        return {
            type: 'bar',
            name: dataset.label ?? `Série ${index + 1}`,
            yAxisIndex,
            data: dataset.data as number[],
            itemStyle: {
                borderRadius: [borderRadius, borderRadius, 0, 0],
                color: dataset.color ?? palette[index % palette.length],
                borderWidth: 0,
            },
        };
    });

    const leftAxis = {
        ...buildValueAxis(theme, options.showGrid, 'left'),
        name: axisNames[0],
        nameTextStyle: { color: theme.axisColor },
    };

    const rightAxis = {
        ...buildValueAxis(theme, options.showGrid, 'left'),
        type: 'value',
        position: 'right',
        name: axisNames[1] ?? axisNames[0],
        nameTextStyle: { color: theme.axisColor },
        splitLine: { show: false },
    };

    return {
        ...animation,
        color: palette,
        tooltip: { ...buildTooltip(theme, options.showTooltip), trigger: 'axis' },
        legend: buildLegend(theme, options.showLegend),
        grid: {
            ...buildGrid(options.showGrid),
            right: '6%',
        },
        xAxis: buildCategoryAxis(theme, data.labels, false),
        yAxis: [leftAxis, rightAxis],
        series,
    };
}

