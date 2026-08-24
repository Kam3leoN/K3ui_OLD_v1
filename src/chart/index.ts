/**
 * @fileoverview Module interne Chart K3UI (non exporté publiquement)
 */

export { ChartRendererEngine, type ChartRenderConfig } from './engine/renderer';
export { buildChartRenderConfig, CHART_TYPES, isSupportedChartType } from './presets/index';
export { normalizeChartData, parseDataAttribute, prepareDataForType } from './data/data-normalizer';
export { buildAccessibilitySummary, getChartTypeLabel } from './a11y/summary-builder';
export { buildAccessibilityTable } from './a11y/a11y-table';
export { resolveThemeMode } from './theme/k3ui-theme';
