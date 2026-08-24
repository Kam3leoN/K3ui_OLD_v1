/**
 * @fileoverview Spécifications du composant ButtonFabDial K3UI
 * @description FAB Speed Dial en éventail (flower) ou colonne (vertical) — M3 Expressive
 * @author K3UI Team
 * @version 1.0.0
 */

import type { ButtonFabDialOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

export const ButtonFabDialSpecs = {
    behaviors: {
        defaultPosition: 'bottom-right' as const,
        defaultLayout: 'flower' as const,
        defaultFabIcon: 'add',
        maxFlowerActions: 4,
        triggerSize: 64,
        actionSize: 46,
        minGap: 14,
        gap: 60,
        spread: [0, 90] as [number, number],
        inset: 24,
        staggerEnterMs: 32,
        staggerExitMs: 22,
        spatialDurationMs: 366,
        exitDurationMs: 200,
        effectsDurationMs: 150,
    },
    accessibility: {
        menuRole: 'menu',
        itemRole: 'menuitem',
    },
};

export function getButtonFabDialDefaults(): ButtonFabDialOptions {
    return {
        priorityLevel: PriorityLevel.MEDIUM,
        position: ButtonFabDialSpecs.behaviors.defaultPosition,
        layout: ButtonFabDialSpecs.behaviors.defaultLayout,
        items: [],
        fabIcon: ButtonFabDialSpecs.behaviors.defaultFabIcon,
        mainAction: null,
        radius: null,
        spread: [...ButtonFabDialSpecs.behaviors.spread],
        triggerSize: ButtonFabDialSpecs.behaviors.triggerSize,
        actionSize: ButtonFabDialSpecs.behaviors.actionSize,
        minGap: ButtonFabDialSpecs.behaviors.minGap,
        gap: ButtonFabDialSpecs.behaviors.gap,
        inset: ButtonFabDialSpecs.behaviors.inset,
        showLabels: false,
        scrim: true,
        fixed: true,
        onItemClick: null,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
    };
}
