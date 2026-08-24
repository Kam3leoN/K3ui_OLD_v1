/**
 * @fileoverview Spécifications du composant Heatmap K3UI
 * @description Grille type contribution (année, 7×~53, intensité par jour)
 * @author K3UI Team
 * @version 1.0.0
 */

import type { HeatmapOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Spécifications du composant Heatmap
 */
export const HeatmapSpecs = {
    year: new Date().getFullYear(),
    data: [] as HeatmapOptions['data'],
    levels: 5,
    /** 0 = dimanche en premier (ligne 1 vide, ligne 2 = Lun) pour aligner les 3 labels */
    firstDayOfWeek: 0 as 0 | 1,
    showMonthLabels: true,
    showWeekdayLabels: true,
    size: 'medium',
    cellSize: 14,
    cellGap: 3,
};

/**
 * Extrait les valeurs par défaut pour Heatmap
 * @returns Options par défaut
 */
export function getHeatmapDefaults(): HeatmapOptions {
    return {
        ...HeatmapSpecs,
        data: [],
        priorityLevel: PriorityLevel.MEDIUM,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
    };
}
