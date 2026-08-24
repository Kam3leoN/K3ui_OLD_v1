/**
 * @fileoverview Spécifications du composant PanelContent K3UI
 * @description Surface M3 Expressive scrollable pour layouts multi-colonnes (leading | layout | trailing)
 * @author K3UI Team
 * @version 1.0.0
 */

import type { PanelContentOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

export const PanelContentSpecs = {
    behaviors: {
        variant: 'layout' as const,
        radius: '28px',
        /** Vide = surface pilotée par les tokens M3 en CSS */
        surface: '',
        scrollable: true,
        empty: false,
    },
    accessibility: {
        roleByVariant: {
            leading: 'complementary' as const,
            layout: 'region' as const,
            trailing: 'complementary' as const,
        },
    },
} as const;

/**
 * Extrait les valeurs par défaut pour PanelContent depuis les specs
 * @returns Options par défaut pour PanelContent
 */
export function getPanelContentDefaults(): PanelContentOptions {
    return {
        variant: PanelContentSpecs.behaviors.variant,
        radius: PanelContentSpecs.behaviors.radius,
        surface: PanelContentSpecs.behaviors.surface,
        scrollable: PanelContentSpecs.behaviors.scrollable,
        empty: PanelContentSpecs.behaviors.empty,
        ariaLabel: null,
        priorityLevel: PriorityLevel.MEDIUM,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
    };
}
