/**
 * @fileoverview Gestionnaire de données temps réel pour le preset dynamic
 */

import type { ChartData, ChartLiveUpdateConfig } from '../../types/components';

export type DynamicUpdateCallback = (data: ChartData) => void;

/**
 * Gère les mises à jour périodiques des données pour les graphiques dynamic
 */
export class ChartDynamicManager {
    private timer: ReturnType<typeof setInterval> | null = null;
    private data: ChartData;
    private config: ChartLiveUpdateConfig;
    private onUpdate: DynamicUpdateCallback;

    /**
     * @param data Données initiales
     * @param config Configuration live update
     * @param onUpdate Callback appelé à chaque tick
     */
    constructor(data: ChartData, config: ChartLiveUpdateConfig, onUpdate: DynamicUpdateCallback) {
        this.data = data;
        this.config = config;
        this.onUpdate = onUpdate;
    }

    /**
     * Démarre les mises à jour périodiques
     */
    start(): void {
        this.stop();
        const interval = this.config.interval ?? 1000;
        const maxPoints = this.config.maxPoints ?? 20;

        this.timer = setInterval(() => {
            this.data = this.tick(this.data, maxPoints);
            this.onUpdate(this.data);
        }, interval);
    }

    /**
     * Arrête les mises à jour
     */
    stop(): void {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    /**
     * Met à jour la configuration
     */
    updateConfig(config: ChartLiveUpdateConfig): void {
        this.config = config;
        if (this.timer) {
            this.start();
        }
    }

    /**
     * Retourne les données courantes
     */
    getData(): ChartData {
        return this.data;
    }

    private tick(current: ChartData, maxPoints: number): ChartData {
        const labels = [...current.labels];
        const datasets = current.datasets.map((ds) => ({
            ...ds,
            data: [...(ds.data as number[])],
        }));

        if (this.config.generator) {
            const generated = this.config.generator(this.data);
            return normalizeTickResult(generated, maxPoints);
        }

        const now = new Date();
        const label = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        labels.push(label);
        if (labels.length > maxPoints) {
            labels.shift();
        }

        datasets.forEach((ds) => {
            const values = ds.data as number[];
            const last = values.length ? values[values.length - 1] : 50;
            const next = Math.max(0, Math.round(last + (Math.random() - 0.5) * 20));
            values.push(next);
            if (values.length > maxPoints) {
                values.shift();
            }
        });

        return { labels, datasets };
    }
}

function normalizeTickResult(input: ChartData, maxPoints: number): ChartData {
    const labels = [...input.labels];
    if (labels.length > maxPoints) {
        labels.splice(0, labels.length - maxPoints);
    }

    const datasets = input.datasets.map((ds) => {
        const data = [...(ds.data as number[])];
        if (data.length > maxPoints) {
            data.splice(0, data.length - maxPoints);
        }
        return { ...ds, data };
    });

    return { labels, datasets };
}
