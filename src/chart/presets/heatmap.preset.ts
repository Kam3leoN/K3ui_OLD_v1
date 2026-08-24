/**
 * @fileoverview Preset heatmap (carte de chaleur)
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
 * Construit la configuration du preset heatmap
 */
export function buildHeatmapPreset(ctx: PresetBuildContext): ChartRenderConfig {
    const { options, data, theme } = ctx;
    const palette = getPalette(ctx);
    const animation = getAnimationSettings(ctx);
    const yLabels = data.yLabels ?? data.datasets.map((_, index) => `Ligne ${index + 1}`);
    const rawData = data.datasets[0]?.data ?? [];

    const heatmapData: [number, number, number][] = Array.isArray(rawData[0])
        ? (rawData as number[][]).map((point) => {
              const [x, y, value] = point;
              return [Number(x), Number(y), Number(value ?? 0)];
          })
        : data.labels.flatMap((_, xIndex) =>
              yLabels.map((_, yIndex) => {
                  const flatIndex = yIndex * data.labels.length + xIndex;
                  const value = Number((rawData as number[])[flatIndex] ?? 0);
                  return [xIndex, yIndex, value] as [number, number, number];
              })
          );

    const maxValue = heatmapData.reduce((max, item) => Math.max(max, item[2]), 0);

    return {
        ...animation,
        color: palette,
        tooltip: {
            ...buildTooltip(theme, options.showTooltip),
            position: 'top',
        },
        grid: {
            ...buildGrid(options.showGrid),
            height: '62%',
            top: '10%',
        },
        xAxis: {
            type: 'category',
            data: data.labels,
            splitArea: { show: true },
            axisLine: { lineStyle: { color: theme.axisColor } },
            axisLabel: { color: theme.axisColor },
        },
        yAxis: {
            type: 'category',
            data: yLabels,
            splitArea: { show: true },
            axisLine: { lineStyle: { color: theme.axisColor } },
            axisLabel: { color: theme.axisColor },
        },
        visualMap: {
            min: 0,
            max: maxValue || 10,
            calculable: true,
            orient: 'horizontal',
            left: 'center',
            bottom: '2%',
            textStyle: { color: theme.textColor },
            inRange: {
                color: [theme.gridColor, palette[0], palette[2] ?? palette[0]],
            },
        },
        series: [
            {
                name: data.datasets[0]?.label ?? 'Heatmap',
                type: 'heatmap',
                data: heatmapData,
                label: {
                    show: options.showLabels,
                    color: theme.textColor,
                },
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowColor: 'rgba(0,0,0,0.25)',
                    },
                },
            },
        ],
        legend: buildLegend(theme, false),
    };
}
