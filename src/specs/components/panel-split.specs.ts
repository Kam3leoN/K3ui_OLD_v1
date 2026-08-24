/**
 * @fileoverview Spécifications du composant PanelSplit K3UI
 * @description Dual-view layout M3E avec poignée drag (horizontal / vertical)
 * @author K3UI Team
 * @version 1.0.0
 */

import type { PanelSplitOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

export const PanelSplitSpecs = {
    behaviors: {
        orientation: 'vertical' as const,
        value: 50,
        min: 0,
        max: 100,
        step: 2,
        disabled: false,
        label: 'Ajuster les panes',
        handleSize: '24px',
    },
} as const;

/**
 * Extrait les valeurs par défaut pour PanelSplit depuis les specs
 * @returns Options par défaut pour PanelSplit
 */
export function getPanelSplitDefaults(): PanelSplitOptions {
    return {
        orientation: PanelSplitSpecs.behaviors.orientation,
        value: PanelSplitSpecs.behaviors.value,
        min: PanelSplitSpecs.behaviors.min,
        max: PanelSplitSpecs.behaviors.max,
        step: PanelSplitSpecs.behaviors.step,
        disabled: PanelSplitSpecs.behaviors.disabled,
        label: PanelSplitSpecs.behaviors.label,
        handleSize: PanelSplitSpecs.behaviors.handleSize,
        priorityLevel: PriorityLevel.MEDIUM,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
    };
}
