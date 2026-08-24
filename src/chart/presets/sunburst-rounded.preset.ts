/**
 * @fileoverview Preset sunburst-rounded (sunburst à coins arrondis)
 */

import type { ChartRenderConfig } from '../engine/renderer';
import type { ChartTreeNode } from '../../types/components';
import {
    buildLegend,
    buildTooltip,
    buildHiddenSliceLabels,
    getAnimationSettings,
    getPalette,
    type PresetBuildContext,
} from './shared';

/** Données sunburst de démonstration */
const DEFAULT_SUNBURST_TREE: ChartTreeNode[] = [
    {
        name: 'A',
        children: [
            { name: 'A1', value: 4 },
            { name: 'A2', value: 6 },
            {
                name: 'A3',
                children: [
                    { name: 'A31', value: 2 },
                    { name: 'A32', value: 3 },
                ],
            },
        ],
    },
    {
        name: 'B',
        children: [
            { name: 'B1', value: 5 },
            { name: 'B2', value: 7 },
            {
                name: 'B3',
                children: [
                    { name: 'B31', value: 2 },
                    { name: 'B32', value: 4 },
                ],
            },
        ],
    },
];

/**
 * Construit la configuration du preset sunburst-rounded
 */
export function buildSunburstRoundedPreset(ctx: PresetBuildContext): ChartRenderConfig {
    const { options, data, theme } = ctx;
    const palette = getPalette(ctx, 8);
    const animation = getAnimationSettings(ctx);
    const cornerRadius = options.borderRadius ?? 7;
    const treeData = data.tree?.length ? data.tree : DEFAULT_SUNBURST_TREE;

    return {
        ...animation,
        color: palette,
        tooltip: buildTooltip(theme, options.showTooltip),
        legend: buildLegend(theme, options.showLegend),
        series: [
            {
                type: 'sunburst',
                radius: ['15%', '90%'],
                sort: undefined,
                emphasis: {
                    focus: 'ancestor',
                },
                ...buildHiddenSliceLabels(),
                itemStyle: {
                    borderRadius: cornerRadius,
                    borderWidth: 0,
                },
                data: treeData,
            },
        ],
    };
}

