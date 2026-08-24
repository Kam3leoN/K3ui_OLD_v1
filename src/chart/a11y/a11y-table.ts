/**
 * @fileoverview Tableau accessibilité des graphiques K3UI
 */

import { LocaleManager } from '../../core/managers';
import type { ChartData } from '../../types/components';

/**
 * Construit un tableau HTML masqué visuellement avec les données du graphique
 */
export function buildAccessibilityTable(data: ChartData): HTMLTableElement {
    const table = document.createElement('table');
    table.className = 'chart__a11y-table';

    const caption = document.createElement('caption');
    caption.textContent = LocaleManager.t('chart.dataTableCaption');
    table.appendChild(caption);

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    const thCategory = document.createElement('th');
    thCategory.scope = 'col';
    thCategory.textContent = LocaleManager.t('chart.dataColumnCategory');
    headerRow.appendChild(thCategory);

    data.datasets.forEach((dataset, index) => {
        const th = document.createElement('th');
        th.scope = 'col';
        th.textContent = dataset.label ?? `${LocaleManager.t('chart.defaultSeries')} ${index + 1}`;
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    const rowCount = Math.max(data.labels.length, ...data.datasets.map((ds) => (ds.data as unknown[]).length));

    for (let i = 0; i < rowCount; i++) {
        const tr = document.createElement('tr');

        const tdLabel = document.createElement('td');
        tdLabel.textContent = data.labels[i] ?? String(i + 1);
        tr.appendChild(tdLabel);

        data.datasets.forEach((dataset) => {
            const td = document.createElement('td');
            const value = (dataset.data as unknown[])[i];
            td.textContent = formatCell(value);
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    return table;
}

function formatCell(value: unknown): string {
    if (value === undefined || value === null) {
        return '';
    }
    if (Array.isArray(value)) {
        return value.join(', ');
    }
    return String(value);
}
