/**
 * @fileoverview Preset basic-chord (diagramme de relations)
 */

import type { ChartRenderConfig } from '../engine/renderer';
import {
    buildLegend,
    buildTooltip,
    buildHiddenSliceLabels,
    getAnimationSettings,
    getPalette,
    type PresetBuildContext,
} from './shared';

/**
 * Construit la configuration du preset basic-chord
 */
export function buildBasicChordPreset(ctx: PresetBuildContext): ChartRenderConfig {
    const { options, data, theme } = ctx;
    const nodeCount = Math.max(data.labels.length, 1);
    const palette = getPalette(ctx, nodeCount);
    const animation = getAnimationSettings(ctx);
    const gap = options.padAngle ?? 2;
    const nodes = data.labels.map((name) => ({ name }));
    const links = data.links ?? [];

    return {
        ...animation,
        color: palette,
        tooltip: buildTooltip(theme, options.showTooltip),
        legend: buildLegend(theme, options.showLegend),
        series: [
            {
                type: 'chord',
                radius: ['70%', '80%'],
                startAngle: 90,
                clockwise: false,
                padAngle: gap,
                ...buildHiddenSliceLabels(),
                lineStyle: {
                    color: 'target',
                    opacity: 0.4,
                },
                itemStyle: {
                    borderRadius: options.borderRadius ?? 4,
                },
                emphasis: {
                    focus: 'adjacency',
                    lineStyle: {
                        opacity: 0.6,
                    },
                },
                data: nodes,
                links,
            },
        ],
    };
}

