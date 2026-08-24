/**
 * @fileoverview Normalisation des données Chart K3UI
 */

import type { ChartData, ChartDataset, ChartType, SimpleChartData } from '../../types/components';

/**
 * Assigne des clusters simples (k-means lite) à des points 2D
 * @param points Points [x, y]
 * @param clusterCount Nombre de clusters
 */
export function assignClusters(points: number[][], clusterCount: number): number[][] {
    if (!points.length) {
        return [];
    }

    const k = Math.max(1, Math.min(clusterCount, points.length));
    const centroids = points.slice(0, k).map((p) => [...p]);

    for (let iter = 0; iter < 8; iter++) {
        const groups: number[][][] = Array.from({ length: k }, () => []);

        points.forEach((point) => {
            let best = 0;
            let bestDist = Infinity;
            centroids.forEach((c, ci) => {
                const dist = (point[0] - c[0]) ** 2 + (point[1] - c[1]) ** 2;
                if (dist < bestDist) {
                    bestDist = dist;
                    best = ci;
                }
            });
            groups[best].push(point);
        });

        groups.forEach((group, gi) => {
            if (!group.length) {
                return;
            }
            const sx = group.reduce((s, p) => s + p[0], 0) / group.length;
            const sy = group.reduce((s, p) => s + p[1], 0) / group.length;
            centroids[gi] = [sx, sy];
        });
    }

    return points.map((point) => {
        let best = 0;
        let bestDist = Infinity;
        centroids.forEach((c, ci) => {
            const dist = (point[0] - c[0]) ** 2 + (point[1] - c[1]) ** 2;
            if (dist < bestDist) {
                bestDist = dist;
                best = ci;
            }
        });
        return [point[0], point[1], best];
    });
}

/**
 * Normalise des données simples en ChartData
 */
export function normalizeSimpleData(items: SimpleChartData[]): ChartData {
    return {
        labels: items.map((item) => item.label),
        datasets: [
            {
                data: items.map((item) => item.value),
            },
        ],
    };
}

/**
 * Normalise une entrée data hétérogène en ChartData
 */
export function normalizeChartData(input: unknown): ChartData {
    if (!input) {
        return { labels: [], datasets: [{ data: [] }] };
    }

    if (Array.isArray(input)) {
        if (input.length && typeof input[0] === 'object' && input[0] !== null && 'label' in (input[0] as object)) {
            return normalizeSimpleData(input as SimpleChartData[]);
        }
        return { labels: [], datasets: [{ data: input as number[] }] };
    }

    const obj = input as ChartData;
    if (obj.labels && obj.datasets) {
        return {
            labels: [...obj.labels],
            yLabels: obj.yLabels ? [...obj.yLabels] : undefined,
            links: obj.links ? obj.links.map((link) => ({ ...link })) : undefined,
            tree: obj.tree ? JSON.parse(JSON.stringify(obj.tree)) as ChartData['tree'] : undefined,
            axisNames: obj.axisNames ? [...obj.axisNames] : undefined,
            datasets: obj.datasets.map((ds) => ({
                label: ds.label,
                color: ds.color,
                seriesType: ds.seriesType,
                yAxisIndex: ds.yAxisIndex,
                data: Array.isArray(ds.data) ? [...ds.data] as ChartDataset['data'] : [],
            })),
        };
    }

    return { labels: [], datasets: [{ data: [] }] };
}

/**
 * Prépare les données selon le type (ex. clustering)
 */
export function prepareDataForType(type: ChartType, data: ChartData, clusterCount = 6): ChartData {
    if (type !== 'scatter-clustering') {
        return data;
    }

    const points: number[][] = [];
    data.datasets.forEach((ds) => {
        (ds.data as number[][]).forEach((point) => {
            if (Array.isArray(point) && point.length >= 2) {
                points.push([point[0], point[1]]);
            }
        });
    });

    const clustered = assignClusters(points, clusterCount);

    return {
        labels: data.labels,
        datasets: [
            {
                label: data.datasets[0]?.label ?? 'Clusters',
                data: clustered as unknown as ChartDataset['data'],
            },
        ],
    };
}

/**
 * Parse une valeur data-* JSON
 */
export function parseDataAttribute(raw: string | null | undefined): ChartData | null {
    if (!raw) {
        return null;
    }

    try {
        return normalizeChartData(JSON.parse(raw));
    } catch {
        return null;
    }
}
