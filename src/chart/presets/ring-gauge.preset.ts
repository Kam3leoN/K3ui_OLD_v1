/**
 * @fileoverview Preset ring-gauge (jauges circulaires concentriques)
 */

import type { ChartRenderConfig } from '../engine/renderer';
import {
    buildLegend,
    buildTooltip,
    getAnimationSettings,
    getPalette,
    type PresetBuildContext,
} from './shared';

/** Données de démonstration */
const DEFAULT_RING_GAUGE_LABELS = ['Parfait', 'Bon', 'Moyen'];
const DEFAULT_RING_GAUGE_VALUES = [20, 40, 60];

/**
 * Calcule le décalage vertical des libellés pour les anneaux concentriques
 */
function resolveRingLabelOffsets(
    index: number,
    total: number
): { title: [string, string]; detail: [string, string] } {
    if (total <= 1) {
        return {
            title: ['0%', '-10%'],
            detail: ['0%', '10%'],
        };
    }

    const step = 20;
    const start = -((total - 1) * step) / 2;
    const titleY = start + index * step;
    const detailY = titleY + 10;

    return {
        title: ['0%', `${titleY}%`],
        detail: ['0%', `${detailY}%`],
    };
}

/**
 * Construit la configuration du preset ring-gauge
 */
export function buildRingGaugePreset(ctx: PresetBuildContext): ChartRenderConfig {
    const { options, data, theme } = ctx;
    const palette = getPalette(ctx, 8);
    const animation = getAnimationSettings(ctx);
    const max = options.gaugeMax ?? 100;
    const ringWidth = options.gaugeRingWidth ?? 40;

    const labels = data.labels.length ? data.labels : DEFAULT_RING_GAUGE_LABELS;
    const values = (data.datasets[0]?.data as number[] | undefined)?.length
        ? (data.datasets[0].data as number[])
        : DEFAULT_RING_GAUGE_VALUES;

    const gaugeData = labels.map((name, index) => {
        const offsets = resolveRingLabelOffsets(index, labels.length);

        return {
            value: Number(values[index] ?? 0),
            name,
            title: {
                offsetCenter: offsets.title,
                color: theme.textColor,
            },
            detail: {
                valueAnimation: animation.animation,
                offsetCenter: offsets.detail,
                formatter: '{value}%',
                color: palette[index % palette.length],
                borderWidth: 0,
            },
            itemStyle: {
                color: palette[index % palette.length],
            },
        };
    });

    return {
        ...animation,
        color: palette,
        tooltip: buildTooltip(theme, options.showTooltip),
        legend: buildLegend(theme, options.showLegend),
        series: [
            {
                type: 'gauge',
                min: 0,
                max,
                startAngle: 90,
                endAngle: -270,
                pointer: { show: false },
                progress: {
                    show: true,
                    overlap: false,
                    roundCap: true,
                    clip: false,
                    width: ringWidth,
                    itemStyle: {
                        borderWidth: 0,
                    },
                },
                axisLine: {
                    lineStyle: {
                        width: ringWidth,
                    },
                },
                splitLine: { show: false },
                axisTick: { show: false },
                axisLabel: { show: false },
                title: {
                    show: options.showLabels,
                    fontSize: 14,
                    color: theme.textColor,
                },
                detail: {
                    show: options.showLabels,
                    fontSize: 14,
                    borderWidth: 0,
                    formatter: '{value}%',
                },
                data: gaugeData,
            },
        ],
    };
}

