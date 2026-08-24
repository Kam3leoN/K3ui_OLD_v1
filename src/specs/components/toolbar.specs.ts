/**
 * @fileoverview Spécifications Toolbar K3UI — M3 Expressive
 * @description Floating + docked ; icônes + tooltips ; relief elevated | filled | tonal
 * @see https://m3.material.io/components/toolbars/overview
 * @author K3UI Team
 * @version 2.0.0
 */

import type { ToolbarOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

export const ToolbarSpecs = {
    behaviors: {
        defaultLayout: 'floating' as const,
        defaultVariant: 'tonal' as const,
        defaultOrientation: 'horizontal' as const,
        defaultShowContainer: true,
        defaultInverseSurface: false,
        defaultShowTooltips: true,
        defaultTooltipPlacement: 'top' as const,
        defaultCheckable: true,
        defaultMultiSelect: false,
    },
    accessibility: {
        role: 'toolbar',
        itemRole: 'button',
    },
};

export function getToolbarDefaults(): ToolbarOptions {
    return {
        priorityLevel: PriorityLevel.MEDIUM,
        layout: ToolbarSpecs.behaviors.defaultLayout,
        variant: ToolbarSpecs.behaviors.defaultVariant,
        orientation: ToolbarSpecs.behaviors.defaultOrientation,
        showContainer: ToolbarSpecs.behaviors.defaultShowContainer,
        inverseSurface: ToolbarSpecs.behaviors.defaultInverseSurface,
        showTooltips: ToolbarSpecs.behaviors.defaultShowTooltips,
        tooltipPlacement: ToolbarSpecs.behaviors.defaultTooltipPlacement,
        checkable: ToolbarSpecs.behaviors.defaultCheckable,
        multiSelect: ToolbarSpecs.behaviors.defaultMultiSelect,
        defaultSelected: [0],
        items: [],
        onSelect: null,
        onItemClick: null,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
    };
}
