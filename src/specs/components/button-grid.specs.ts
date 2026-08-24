/**
 * @fileoverview Spécifications du composant ButtonGrid K3UI
 * @description Grille 3×3 Material Design 3 Expressive — FAB reveal / pad déployé
 * @see https://m3.material.io/components/buttons/overview
 * @author K3UI Team
 * @version 1.0.0
 */

import type { AnimationConfig } from '../../types/components/animations';
import type { ButtonGridOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';
import { getHapticFeedbackDefaults } from '../common/haptic-feedback.specs';

/** Position d'une cellule dans la grille 3×3 */
export type ButtonGridPosition =
    | 'tl'
    | 'tc'
    | 'tr'
    | 'ml'
    | 'mc'
    | 'mr'
    | 'bl'
    | 'bc'
    | 'br';

/** Définition d'une cellule du ButtonGrid */
export interface ButtonGridCellDef {
    position: ButtonGridPosition;
    /** Distance de stagger open : 0=centre, 1=arête, 2=coin */
    staggerDistance: 0 | 1 | 2;
}

/** Labels numériques par défaut (1–9) */
export const BUTTON_GRID_DEFAULT_LABELS: string[] = [
    '1', '2', '3', '4', '5', '6', '7', '8', '9',
];

/**
 * Métadonnées des 9 cellules (ordre lecture LTR)
 * Stagger open : centre → arêtes → coins
 */
export const BUTTON_GRID_CELLS: ButtonGridCellDef[] = [
    { position: 'tl', staggerDistance: 2 },
    { position: 'tc', staggerDistance: 1 },
    { position: 'tr', staggerDistance: 2 },
    { position: 'ml', staggerDistance: 1 },
    { position: 'mc', staggerDistance: 0 },
    { position: 'mr', staggerDistance: 1 },
    { position: 'bl', staggerDistance: 2 },
    { position: 'bc', staggerDistance: 1 },
    { position: 'br', staggerDistance: 2 },
];

/** Path SVG Material Symbols « apps » (viewBox 0 0 24 24) */
export const BUTTON_GRID_APPS_PATH =
    'M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z';

/**
 * Génère le markup SVG icône apps pour le FAB
 * @param path - Path SVG
 */
export function buttonGridAppsSVG(path: string = BUTTON_GRID_APPS_PATH): string {
    return `<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${path}"/></svg>`;
}

/**
 * Spécifications du composant ButtonGrid (M3 Expressive)
 */
export const ButtonGridSpecs = {
    behaviors: {
        defaultVariant: 'filled' as const,
        defaultTriggerFAB: true,
        cellCount: 9,
    },

    cells: BUTTON_GRID_CELLS,

    animations: {
        open: {
            type: 'scale' as const,
            duration: 500,
            easing: 'ease-out' as const,
        } as AnimationConfig,
        close: {
            type: 'scale' as const,
            duration: 420,
            easing: 'ease-in' as const,
        } as AnimationConfig,
    },

    accessibility: {
        role: 'group',
        fabLabel: 'Ouvrir la grille',
        autoPadForReducedMotion: true,
    },
};

/**
 * Extrait les valeurs par défaut pour ButtonGrid
 * @returns Options par défaut
 */
export function getButtonGridDefaults(): ButtonGridOptions {
    return {
        priorityLevel: PriorityLevel.MEDIUM,
        labels: [...BUTTON_GRID_DEFAULT_LABELS],
        variant: ButtonGridSpecs.behaviors.defaultVariant,
        triggerFAB: ButtonGridSpecs.behaviors.defaultTriggerFAB,
        onSelect: null,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
        ...getHapticFeedbackDefaults('medium'),
    };
}
