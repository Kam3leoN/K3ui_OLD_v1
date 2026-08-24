/**
 * @fileoverview Utilitaires partagés des presets Chart K3UI
 */

import type { ChartData, ChartOptions } from '../../types/components';
import type { ChartRenderConfig } from '../engine/renderer';
import type { K3uiChartTheme } from '../theme/k3ui-theme';
import { resolveChartPalette } from '../theme/k3ui-theme';

/** Contexte de construction d'un preset */
export interface PresetBuildContext {
    options: ChartOptions;
    data: ChartData;
    theme: K3uiChartTheme;
}

/**
 * Retourne la palette de couleurs effective
 */
export function getPalette(ctx: PresetBuildContext, minCount?: number): string[] {
    const count = minCount ?? Math.max(ctx.data.labels.length, 1);
    if (ctx.options.colors?.length) {
        return resolveChartPalette(count, ctx.options.colors);
    }
    return resolveChartPalette(count, ctx.theme.palette);
}

/**
 * Paramètres d'animation selon les options et prefers-reduced-motion
 */
export function getAnimationSettings(ctx: PresetBuildContext): { animation: boolean; animationDuration: number } {
    const reducedMotion =
        typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    return {
        animation: ctx.options.animation && !reducedMotion,
        animationDuration: ctx.options.animationDuration ?? 1000,
    };
}

/**
 * Configuration tooltip commune
 */
export function buildTooltip(theme: K3uiChartTheme, enabled: boolean): Record<string, unknown> {
    return {
        show: enabled,
        trigger: 'item',
        backgroundColor: theme.tooltipBackground,
        borderWidth: 0,
        textStyle: {
            color: theme.tooltipText,
        },
    };
}

/**
 * Configuration légende commune
 */
export function buildLegend(theme: K3uiChartTheme, show: boolean): Record<string, unknown> {
    return {
        show,
        textStyle: {
            color: theme.textColor,
        },
        bottom: 0,
    };
}

/**
 * Configuration grille commune
 */
export function buildGrid(show: boolean): Record<string, unknown> {
    return {
        left: '3%',
        right: '4%',
        bottom: show ? '12%' : '8%',
        top: '8%',
        containLabel: true,
    };
}

/**
 * Axe valeur commun
 */
export function buildValueAxis(
    theme: K3uiChartTheme,
    showGrid: boolean,
    position: 'left' | 'bottom' = 'left'
): Record<string, unknown> {
    return {
        type: 'value',
        position,
        axisLine: { lineStyle: { color: theme.axisColor } },
        axisLabel: { color: theme.axisColor },
        splitLine: {
            show: showGrid,
            lineStyle: { color: theme.gridColor },
        },
    };
}

/**
 * Axe catégorie commun
 */
export function buildCategoryAxis(
    theme: K3uiChartTheme,
    labels: string[],
    showGrid: boolean
): Record<string, unknown> {
    return {
        type: 'category',
        data: labels,
        axisLine: { lineStyle: { color: theme.axisColor } },
        axisLabel: { color: theme.axisColor },
        splitLine: {
            show: showGrid,
            lineStyle: { color: theme.gridColor },
        },
    };
}

/** Entrée nom/valeur pour graphiques circulaires */
export interface PieSeriesItem {
    name: string;
    value: number;
    itemStyle?: { color?: string };
}

/** Correspondance libellé couleur → hex (palette K3UI) */
const COLOR_LABEL_MAP: Record<string, string> = {
    violet: '#9a60b4',
    vert: '#91cc75',
    jaune: '#fac858',
    rouge: '#ee6666',
    cyan: '#73c0de',
    bleu: '#5470c6',
    orange: '#fc8452',
};

/**
 * Résout une couleur depuis un libellé de couleur (ex. « Rouge » → #ee6666)
 */
export function resolveColorFromLabel(label: string, fallback: string): string {
    const key = label.trim().toLowerCase();
    return COLOR_LABEL_MAP[key] ?? fallback;
}

/**
 * Désactive les libellés externes avec traits de repère (légende callout)
 */
export function buildHiddenSliceLabels(): { label: { show: false }; labelLine: { show: false } } {
    return {
        label: { show: false },
        labelLine: { show: false },
    };
}

/**
 * Construit les entrées pie/funnel depuis labels + dataset
 */
export function buildNamedValueSeries(ctx: PresetBuildContext): PieSeriesItem[] {
    const { data, options } = ctx;
    const palette = getPalette(ctx);
    const dataset = data.datasets[0];

    return data.labels.map((label, index) => ({
        name: label,
        value: Number(dataset?.data[index] ?? 0),
        itemStyle: {
            color: dataset?.color
                ?? resolveColorFromLabel(label, palette[index % palette.length]),
        },
    }));
}

/**
 * Trie les entrées pie par valeur croissante
 */
export function sortPieSeriesAscending(items: PieSeriesItem[]): PieSeriesItem[] {
    return [...items].sort((a, b) => a.value - b.value);
}

/**
 * Trie les entrées pie par valeur décroissante (effet escargot depuis 12 h)
 */
export function sortPieSeriesDescending(items: PieSeriesItem[]): PieSeriesItem[] {
    return [...items].sort((a, b) => b.value - a.value);
}

/**
 * Réassigne les couleurs de la palette après tri
 */
export function applyPaletteToPieSeries(items: PieSeriesItem[], palette: string[]): PieSeriesItem[] {
    return items.map((item, index) => ({
        ...item,
        itemStyle: {
            color: palette[index % palette.length],
        },
    }));
}

/**
 * Fusionne une config de base avec des séries
 */
export function mergeConfig(
    base: ChartRenderConfig,
    series: Record<string, unknown>[]
): ChartRenderConfig {
    return {
        ...base,
        series,
    };
}
