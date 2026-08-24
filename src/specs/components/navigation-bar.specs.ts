/**
 * @fileoverview Spécifications du composant NavigationBar K3UI
 * @description Material Design 3 - Barre de navigation en bas (pill horizontale 64×32, hauteur 80px)
 * @author K3UI Team
 * @version 1.0.0
 */

import type { AnimationConfig } from '../../types/components/animations';
import type { NavigationBarOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';
import { getHapticFeedbackDefaults } from '../common/haptic-feedback.specs';

/**
 * Spécifications du composant Navigation Bar (Material Design 3)
 */
export const NavigationBarSpecs = {
    behaviors: {
        defaultActiveIndex: 0,
    },

    animations: {
        /**
         * M3 Expressive / Android ActiveIndicatorTransform :
         * scaleX 0.4→1 (spatial-fast) + fade sur le premier 1/5 (ALPHA_FRACTION).
         * Harmonisé NavigationBar ↔ NavigationRail.
         */
        pill: {
            type: 'scale' as const,
            duration: 350,
            easing: 'spatial-fast' as const,
            navDelayMs: 140,
        } as AnimationConfig,
    },

    dimensions: {
        /** Hauteur de la barre (MD3 80px) */
        barHeight: 80,
        /** Taille icône (px) - 28×28 */
        iconSize: 28,
        /** Pill : largeur active (horizontal = 64px) */
        pillWidth: 64,
        /** Pill : hauteur (32px) */
        pillHeight: 32,
        iconLabelGap: 4,
        pillRadius: 16,
    },

    accessibility: {
        role: 'navigation' as const,
        tabRole: 'tab' as const,
    },

    priority: PriorityLevel.MEDIUM,
} as const;

/**
 * Extrait les valeurs par défaut pour NavigationBar
 */
export function getNavigationBarDefaults(): NavigationBarOptions {
    return {
        id: undefined,
        activeIndex: NavigationBarSpecs.behaviors.defaultActiveIndex,
        displayMode: 'always',
        compact: false,
        onChange: null,
        onClick: null,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
        priorityLevel: PriorityLevel.MEDIUM,
        ...getHapticFeedbackDefaults('selection'),
    };
}
