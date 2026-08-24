/**
 * @fileoverview Presets line, line-smooth, area, stacked
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

type LinePresetMode = 'line' | 'line-smooth' | 'area' | 'line-stacked' | 'area-stacked';

/**
 * Construit une configuration de série linéaire selon le mode
 */
function buildLineSeries(
    ctx: PresetBuildContext,
    mode: LinePresetMode
): Record<string, unknown>[] {
    const palette = getPalette(ctx);
    const stacked = mode === 'line-stacked' || mode === 'area-stacked';
    const isArea = mode === 'area' || mode === 'area-stacked';
    const smooth = mode === 'line-smooth';

    return ctx.data.datasets.map((dataset, index) => ({
        type: 'line',
        name: dataset.label ?? `Série ${index + 1}`,
        data: dataset.data as number[],
        smooth,
        stack: stacked ? 'total' : undefined,
        areaStyle: isArea ? { opacity: 0.25 } : undefined,
        itemStyle: {
            color: dataset.color ?? palette[index % palette.length],
        },
        lineStyle: {
            width: 2,
        },
    }));
}

/**
 * Construit la configuration d'un preset linéaire
 */
export function buildLineFamilyPreset(ctx: PresetBuildContext, mode: LinePresetMode): ChartRenderConfig {
    const { options, theme } = ctx;
    const palette = getPalette(ctx);
    const animation = getAnimationSettings(ctx);

    return {
        ...animation,
        color: palette,
        tooltip: { ...buildTooltip(theme, options.showTooltip), trigger: 'axis' },
        legend: buildLegend(theme, options.showLegend),
        grid: buildGrid(options.showGrid),
        xAxis: buildCategoryAxis(theme, ctx.data.labels, false),
        yAxis: buildValueAxis(theme, options.showGrid),
        series: buildLineSeries(ctx, mode),
    };
}

export function buildLinePreset(ctx: PresetBuildContext): ChartRenderConfig {
    return buildLineFamilyPreset(ctx, 'line');
}

export function buildLineSmoothPreset(ctx: PresetBuildContext): ChartRenderConfig {
    return buildLineFamilyPreset(ctx, 'line-smooth');
}

export function buildAreaPreset(ctx: PresetBuildContext): ChartRenderConfig {
    return buildLineFamilyPreset(ctx, 'area');
}

export function buildLineStackedPreset(ctx: PresetBuildContext): ChartRenderConfig {
    return buildLineFamilyPreset(ctx, 'line-stacked');
}

export function buildAreaStackedPreset(ctx: PresetBuildContext): ChartRenderConfig {
    return buildLineFamilyPreset(ctx, 'area-stacked');
}
