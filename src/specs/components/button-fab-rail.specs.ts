/**
 * @fileoverview Spécifications du composant ButtonFabRail K3UI
 * @description FAB Speed Dial linéaire (rail) — M3 Expressive
 * @author K3UI Team
 * @version 1.0.0
 */

import type { ButtonFabRailOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

export const ButtonFabRailSpecs = {
    behaviors: {
        defaultPosition: 'bottom-right' as const,
        maxActions: 5,
        triggerSize: 64,
        actionSize: 46,
        gap: 14,
        inset: 24,
        autoFit: true,
        staggerEnterMs: 28,
        staggerExitMs: 18,
        spatialDurationMs: 366,
        exitDurationMs: 200,
        effectsDurationMs: 150,
        defaultFabIcon: 'add',
    },
    accessibility: {
        menuRole: 'menu',
        itemRole: 'menuitem',
    },
};

export function getButtonFabRailDefaults(): ButtonFabRailOptions {
    return {
        priorityLevel: PriorityLevel.MEDIUM,
        position: ButtonFabRailSpecs.behaviors.defaultPosition,
        direction: null,
        items: [],
        fabIcon: ButtonFabRailSpecs.behaviors.defaultFabIcon,
        triggerSize: ButtonFabRailSpecs.behaviors.triggerSize,
        actionSize: ButtonFabRailSpecs.behaviors.actionSize,
        gap: ButtonFabRailSpecs.behaviors.gap,
        inset: ButtonFabRailSpecs.behaviors.inset,
        autoFit: ButtonFabRailSpecs.behaviors.autoFit,
        scrim: true,
        fixed: true,
        onItemClick: null,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
    };
}
