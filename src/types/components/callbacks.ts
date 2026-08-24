/**
 * @fileoverview Types de callbacks et données associées aux composants K3UI
 * @description Utilitaires de typage pour remplacer `any` dans les options (LOT 4)
 */

import type { BaseOptions } from '../base/options';
import type { Component } from './component-base';

/** Instance générique d’un composant K3UI */
export type K3UIComponentInstance = Component<BaseOptions>;

/** Callback recevant l’instance du composant */
export type ComponentInstanceCallback<T extends K3UIComponentInstance = K3UIComponentInstance> = (
    instance: T,
) => void;

/** Callback avec instance optionnelle */
export type ComponentInstanceCallbackOptional<T extends K3UIComponentInstance = K3UIComponentInstance> = (
    instance?: T,
) => void;

/** Données personnalisées attachées à un item (chip, liste, etc.) */
export type ComponentCustomData = Record<string, unknown>;

/** Options d’animation libres (anime.js, etc.) */
export type ComponentAnimationOptions = Record<string, unknown>;

/** Valeur de cellule de table */
export type TableCellValue = string | number | boolean | null | undefined;

/** Point / item de tooltip graphique (Chart) */
export interface ChartTooltipContextItem {
    label?: string;
    value?: number | string;
    datasetIndex?: number;
    index?: number;
    raw?: unknown;
    [key: string]: unknown;
}
