/**
 * @fileoverview Spécifications du composant ButtonPad K3UI
 * @description Pad 4 directions Material Design 3 Expressive (cardinal 45° / diagonal 0°)
 * @see https://m3.material.io/components/buttons/overview
 * @author K3UI Team
 * @version 1.0.0
 */

import type { AnimationConfig } from '../../types/components/animations';
import type { ButtonPadOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';
import { getHapticFeedbackDefaults } from '../common/haptic-feedback.specs';

/** Direction émise par ButtonPad */
export type ButtonPadDirection =
    | 'up'
    | 'down'
    | 'left'
    | 'right'
    | 'nw'
    | 'ne'
    | 'sw'
    | 'se';

/** Position d'une cellule dans la grille 2×2 */
export type ButtonPadPosition = 'tl' | 'tr' | 'bl' | 'br';

/** Clé de path SVG chevron Material */
export type ButtonPadChevronKey = 'up' | 'down' | 'left' | 'right';

/** Définition d'une cellule du pad */
export interface ButtonPadCellDef {
    position: ButtonPadPosition;
    icon: ButtonPadChevronKey;
    /** Rotation SVG en degrés (diagonal : ±45 ; cardinal : 0) */
    iconRotation: number;
    direction: ButtonPadDirection;
    label: string;
}

/** Paths SVG Material Design chevron (viewBox 0 0 24 24) */
export const BUTTON_PAD_CHEVRON_PATHS: Record<ButtonPadChevronKey, string> = {
    up: 'M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z',
    down: 'M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z',
    left: 'M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z',
    right: 'M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z',
};

/**
 * Spécifications du composant ButtonPad (M3 Expressive)
 */
export const ButtonPadSpecs = {
    behaviors: {
        defaultMode: 'diagonal' as const,
        defaultVariant: 'filled' as const,
    },

    /** Cellules mode diagonal (grille 0°) — ↖ ↗ ↙ ↘ */
    diagonalCells: [
        { position: 'tl', icon: 'up', iconRotation: -45, direction: 'nw', label: 'Nord-Ouest' },
        { position: 'tr', icon: 'up', iconRotation: 45, direction: 'ne', label: 'Nord-Est' },
        { position: 'bl', icon: 'down', iconRotation: 45, direction: 'sw', label: 'Sud-Ouest' },
        { position: 'br', icon: 'down', iconRotation: -45, direction: 'se', label: 'Sud-Est' },
    ] as ButtonPadCellDef[],

    /** Cellules mode cardinal (grille rotée 45°) — ↑ → ↓ ← */
    cardinalCells: [
        { position: 'tl', icon: 'up', iconRotation: 0, direction: 'up', label: 'Nord' },
        { position: 'tr', icon: 'right', iconRotation: 0, direction: 'right', label: 'Est' },
        { position: 'bl', icon: 'left', iconRotation: 0, direction: 'left', label: 'Ouest' },
        { position: 'br', icon: 'down', iconRotation: 0, direction: 'down', label: 'Sud' },
    ] as ButtonPadCellDef[],

    animations: {
        enter: {
            type: 'fade' as const,
            duration: 200,
            easing: 'ease-out' as const,
        } as AnimationConfig,
        exit: {
            type: 'fade' as const,
            duration: 150,
            easing: 'ease-in' as const,
        } as AnimationConfig,
    },

    accessibility: {
        role: 'group',
        autoDisableForReducedMotion: true,
    },
};

/**
 * Génère le markup SVG chevron Material
 * @param path - Path SVG
 * @param rotDeg - Rotation en degrés (via CSS var, pour ne pas bloquer le hover)
 */
export function buttonPadChevronSVG(path: string, rotDeg = 0): string {
    const rot = rotDeg
        ? ` style="--btn-pad-icon-rot:${rotDeg}deg"`
        : '';
    return `<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"${rot}><path d="${path}"/></svg>`;
}

/**
 * Extrait les valeurs par défaut pour ButtonPad
 * @returns Options par défaut
 */
export function getButtonPadDefaults(): ButtonPadOptions {
    return {
        priorityLevel: PriorityLevel.MEDIUM,
        mode: ButtonPadSpecs.behaviors.defaultMode,
        variant: ButtonPadSpecs.behaviors.defaultVariant,
        onNavigate: null,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
        ...getHapticFeedbackDefaults('medium'),
    };
}
