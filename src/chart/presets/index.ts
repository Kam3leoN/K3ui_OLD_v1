/**
 * @fileoverview Registre des presets Chart K3UI
 */

import type { ChartType } from '../../types/components';
import type { ChartRenderConfig } from '../engine/renderer';
import { resolveThemeMode } from '../theme/k3ui-theme';
import type { ChartData, ChartOptions } from '../../types/components';
import { buildPiePadAnglePreset } from './pie-pad-angle.preset';
import { buildNightingalePreset } from './nightingale.preset';
import { buildBarPreset } from './bar.preset';
import { buildBarHorizontalPreset } from './bar-horizontal.preset';
import { buildScatterPreset } from './scatter.preset';
import { buildScatterClusteringPreset } from './scatter-clustering.preset';
import { buildCandlestickPreset } from './candlestick.preset';
import { buildRadarPreset } from './radar.preset';
import { buildRadarMultiplePreset } from './radar-multiple.preset';
import {
    buildAreaPreset,
    buildAreaStackedPreset,
    buildLinePreset,
    buildLineSmoothPreset,
    buildLineStackedPreset,
} from './line-family.preset';
import { buildBumpPreset } from './bump.preset';
import { buildFunnelPreset } from './funnel.preset';
import { buildHeatmapPreset } from './heatmap.preset';
import { buildBasicChordPreset } from './basic-chord.preset';
import { buildSunburstRoundedPreset } from './sunburst-rounded.preset';
import { buildMixedLineBarPreset } from './mixed-line-bar.preset';
import { buildBarNegativePreset } from './bar-negative.preset';
import { buildRingGaugePreset } from './ring-gauge.preset';
import type { PresetBuildContext } from './shared';

type PresetBuilder = (ctx: PresetBuildContext) => ChartRenderConfig;

const PRESET_REGISTRY: Record<ChartType, PresetBuilder> = {
    'pie-pad-angle': buildPiePadAnglePreset,
    nightingale: buildNightingalePreset,
    funnel: buildFunnelPreset,
    heatmap: buildHeatmapPreset,
    bar: buildBarPreset,
    'bar-horizontal': buildBarHorizontalPreset,
    scatter: buildScatterPreset,
    'scatter-clustering': buildScatterClusteringPreset,
    candlestick: buildCandlestickPreset,
    radar: buildRadarPreset,
    'radar-multiple': buildRadarMultiplePreset,
    line: buildLinePreset,
    'line-smooth': buildLineSmoothPreset,
    area: buildAreaPreset,
    'line-stacked': buildLineStackedPreset,
    'area-stacked': buildAreaStackedPreset,
    bump: buildBumpPreset,
    'basic-chord': buildBasicChordPreset,
    'sunburst-rounded': buildSunburstRoundedPreset,
    'mixed-line-bar': buildMixedLineBarPreset,
    'bar-negative': buildBarNegativePreset,
    'ring-gauge': buildRingGaugePreset,
};

/** Liste des types de graphiques disponibles */
export const CHART_TYPES = Object.keys(PRESET_REGISTRY) as ChartType[];

/**
 * Construit la configuration de rendu pour un type de graphique K3UI
 * @param options Options du composant
 * @param data Données normalisées
 * @param host Élément hôte pour la résolution du thème
 */
export function buildChartRenderConfig(
    options: ChartOptions,
    data: ChartData,
    host?: HTMLElement
): ChartRenderConfig {
    const builder = PRESET_REGISTRY[options.type];
    if (!builder) {
        return {};
    }

    const theme = resolveThemeMode(options.theme ?? 'auto', host);
    const ctx: PresetBuildContext = { options, data, theme };
    return builder(ctx);
}

/**
 * Vérifie si un type de graphique est supporté
 */
export function isSupportedChartType(type: string): type is ChartType {
    return type in PRESET_REGISTRY;
}
