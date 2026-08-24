/**
 * @fileoverview Résumé accessibilité des graphiques K3UI
 */

import { LocaleManager } from '../../core/managers';
import type { ChartData, ChartType } from '../../types/components';

const TYPE_I18N_KEYS: Record<ChartType, keyof import('../../types/managers/locale').ChartTranslations> = {
    'pie-pad-angle': 'typePiePadAngle',
    nightingale: 'typeNightingale',
    funnel: 'typeFunnel',
    heatmap: 'typeHeatmap',
    bar: 'typeBar',
    'bar-horizontal': 'typeBarHorizontal',
    scatter: 'typeScatter',
    'scatter-clustering': 'typeScatterClustering',
    candlestick: 'typeCandlestick',
    radar: 'typeRadar',
    'radar-multiple': 'typeRadarMultiple',
    line: 'typeLine',
    'line-smooth': 'typeLineSmooth',
    area: 'typeArea',
    'line-stacked': 'typeLineStacked',
    'area-stacked': 'typeAreaStacked',
    bump: 'typeBump',
    'basic-chord': 'typeBasicChord',
    'sunburst-rounded': 'typeSunburstRounded',
    'mixed-line-bar': 'typeMixedLineBar',
    'bar-negative': 'typeBarNegative',
    'ring-gauge': 'typeRingGauge',
};

/**
 * Retourne le libellé i18n du type de graphique
 */
export function getChartTypeLabel(type: ChartType): string {
    const key = TYPE_I18N_KEYS[type];
    return LocaleManager.t(`chart.${key}`);
}

/**
 * Construit un résumé textuel des données pour les lecteurs d'écran
 */
export function buildAccessibilitySummary(type: ChartType, data: ChartData, custom?: string): string {
    if (custom) {
        return custom;
    }

    const typeLabel = getChartTypeLabel(type);
    const hasData =
        data.datasets.some((ds) => Array.isArray(ds.data) && ds.data.length > 0) ||
        (data.tree?.length ?? 0) > 0 ||
        (data.links?.length ?? 0) > 0;

    if (!hasData) {
        return `${typeLabel}. ${LocaleManager.t('chart.emptyData')}`;
    }

    const parts: string[] = [typeLabel];

    data.datasets.forEach((dataset, dsIndex) => {
        const seriesName = dataset.label ?? `${LocaleManager.t('chart.defaultSeries')} ${dsIndex + 1}`;
        const values = dataset.data as number[];
        if (!values.length) {
            return;
        }

        const pairs = data.labels.length
            ? data.labels.map((label, i) => `${label}: ${formatValue(values[i])}`).filter((p) => !p.endsWith(': undefined'))
            : values.map((v, i) => `${i + 1}: ${formatValue(v)}`);

        parts.push(`${seriesName} — ${pairs.join(', ')}`);
    });

    return parts.join('. ');
}

function formatValue(value: unknown): string {
    if (typeof value === 'number') {
        return Number.isInteger(value) ? String(value) : value.toFixed(2);
    }
    if (Array.isArray(value)) {
        return value.join('/');
    }
    return String(value ?? '');
}
