/**
 * @fileoverview Spécifications du composant Tile K3UI
 * @description Spécifications et comportements pour le composant Tile
 * @author K3UI Team
 * @version 1.0.0
 */

import type { AnimationConfig } from '../../types/components/animations';
import { TileOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Spécifications du composant Tile
 */
export const TileSpecs = {
    behaviors: {
        defaultChecked: false,
        disabled: false,
        showLabel: true,
        defaultVariant: 'v1' as const,
        defaultSize: 'md' as const,
        defaultLayout: 'expressive' as const,
    },

    animations: {
        toggle: {
            type: 'scale' as const,
            duration: 250,
            easing: 'ease-out' as const,
            direction: 'center' as const,
        } as AnimationConfig,
    },

    accessibility: {
        role: 'radio' as const,
        focusable: true,
        tabIndex: 0,
        respectReducedMotion: true,
    },

    priority: PriorityLevel.MEDIUM,
} as const;

/**
 * Extrait les valeurs par défaut pour Tile
 * @returns Options par défaut pour Tile
 */
export function getTileDefaults(): TileOptions {
    return {
        checked: TileSpecs.behaviors.defaultChecked,
        disabled: TileSpecs.behaviors.disabled,
        label: undefined,
        showLabel: TileSpecs.behaviors.showLabel,
        name: '',
        value: '',
        variant: TileSpecs.behaviors.defaultVariant,
        size: TileSpecs.behaviors.defaultSize,
        layout: TileSpecs.behaviors.defaultLayout,
        showIcon: false,
        icon: null,
        iconType: 'classic',
        onToggle: null,
        onChange: null,
        onFocus: null,
        onBlur: null,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
        priorityLevel: TileSpecs.priority,
    };
}
