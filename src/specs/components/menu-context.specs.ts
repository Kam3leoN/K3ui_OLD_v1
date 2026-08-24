/**
 * @fileoverview Spécifications du composant MenuContext K3UI
 * @description Menu contextuel (clic droit) basé sur le composant Menu
 * @author K3UI Team
 * @version 1.0.0
 */

import type { AnimationConfig } from '../../types/components/animations';
import type { MenuContextOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Spécifications du composant MenuContext
 */
export const MenuContextSpecs = {
    behaviors: {
        /** Portée d’écoute par défaut */
        scope: 'document' as const,
        /** Bloquer le menu natif */
        preventDefault: true,
        /** Laisser le menu natif sur champs éditables */
        allowNativeOnEditable: true,
        /** Activé par défaut */
        enabled: true,
        /** Placement Floating UI sous le curseur */
        placement: 'bottom-start' as const,
    },

    animations: {
        enter: {
            type: 'fade' as const,
            duration: 350,
            easing: 'ease-out' as const,
        } as AnimationConfig,
        exit: {
            type: 'fade' as const,
            duration: 350,
            easing: 'ease-in' as const,
        } as AnimationConfig,
    },

    accessibility: {
        role: 'presentation' as const,
        /** Rôle du menu délégué au composant Menu */
        menuRole: 'menu' as const,
    },
} as const;

/**
 * Extrait les valeurs par défaut pour MenuContext
 * @returns Options par défaut
 */
export function getMenuContextDefaults(): MenuContextOptions {
    return {
        items: [],
        scope: MenuContextSpecs.behaviors.scope,
        preventDefault: MenuContextSpecs.behaviors.preventDefault,
        allowNativeOnEditable: MenuContextSpecs.behaviors.allowNativeOnEditable,
        excludeSelector: null,
        enabled: MenuContextSpecs.behaviors.enabled,
        placement: MenuContextSpecs.behaviors.placement,
        priorityLevel: PriorityLevel.MEDIUM,
        onItemClick: null,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
    };
}
