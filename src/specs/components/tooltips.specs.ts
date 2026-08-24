/**
 * @fileoverview Spécifications du composant Tooltips K3UI
 * @description Spécifications et comportements pour les tooltips (inspiré Varlet)
 * @author K3UI Team
 * @version 1.0.0
 */

import type { AnimationConfig } from '../../types/components/animations';
import type { TooltipsOptions, TooltipType, TooltipPlacement, TooltipTrigger, TooltipMode } from '../../types/components';
import { PriorityLevel } from '../../types/base';
import { getHapticFeedbackDefaults } from '../common/haptic-feedback.specs';
import { MotionPresets } from '../common/motion-presets.specs';

/**
 * Spécifications du composant Tooltips
 */
export const TooltipsSpecs = {
    // ============================================================================
    // COMPORTEMENTS PAR DÉFAUT
    // ============================================================================

    behaviors: {
        /** Type par défaut */
        defaultType: 'default' as TooltipType,
        /** Mode par défaut */
        defaultMode: 'plain' as TooltipMode,
        /** Placement par défaut */
        defaultPlacement: 'bottom' as TooltipPlacement,
        /** Déclencheur par défaut */
        defaultTrigger: 'hover' as TooltipTrigger,
        /** Offset par défaut (px) */
        defaultOffset: 10,
        /** Fermer au clic référence (trigger click) */
        closeOnClickReference: true,
        /** Fermer avec Escape */
        closeOnKeyEscape: true,
        /** Boutons M3 par défaut en mode rich */
        richActions: true,
    },

    // ============================================================================
    // ANIMATIONS
    // ============================================================================

    animations: {
        enter: {
            type: 'fade' as const,
            duration: 200,
            easing: 'ease-out' as const,
        } as AnimationConfig,

        exit: {
            type: 'fade' as const,
            duration: 200,
            easing: 'ease-in' as const,
        } as AnimationConfig,
    },

    motion: MotionPresets.tooltip,

    // ============================================================================
    // ACCESSIBILITÉ
    // ============================================================================

    accessibility: {
        /** Rôle ARIA du tooltip */
        role: 'tooltip' as const,
        /** Délai avant affichage (hover) en ms */
        showDelay: 0,
        /** Délai avant masquage (hover) en ms */
        hideDelay: 100,
    },
} as const;

/**
 * Extrait les valeurs par défaut pour Tooltips
 * @returns Options par défaut
 */
export function getTooltipsDefaults(): TooltipsOptions {
    return {
        content: '',
        type: TooltipsSpecs.behaviors.defaultType,
        mode: TooltipsSpecs.behaviors.defaultMode,
        title: '',
        body: '',
        placement: TooltipsSpecs.behaviors.defaultPlacement,
        trigger: TooltipsSpecs.behaviors.defaultTrigger,
        offset: TooltipsSpecs.behaviors.defaultOffset,
        motion: 'expressive',
        motionSpeed: 'default',
        plainDismissDelay: 1500,
        richActions: TooltipsSpecs.behaviors.richActions,
        closeOnClickReference: TooltipsSpecs.behaviors.closeOnClickReference,
        closeOnKeyEscape: TooltipsSpecs.behaviors.closeOnKeyEscape,
        disabled: false,
        showDelay: TooltipsSpecs.accessibility.showDelay,
        hideDelay: TooltipsSpecs.accessibility.hideDelay,
        ...getHapticFeedbackDefaults('light'),
        hapticFeedback: false,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
    };
}
