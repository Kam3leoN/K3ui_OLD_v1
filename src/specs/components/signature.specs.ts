/**
 * @fileoverview Spécifications du composant Signature K3UI
 * @description Spécifications et comportements pour le composant Signature
 * @author K3UI Team
 * @version 1.0.0
 */

import type { AnimationConfig } from '../../types/components/animations';
import { SignatureOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Spécifications du composant Signature
 */
export const SignatureSpecs = {
  // ============================================================================
  // COMPORTEMENTS PAR DÉFAUT
  // ============================================================================

  behaviors: {
    /** Auto-activation par défaut */
    autoActivate: true,
    /** Support du touch par défaut */
    touchSupport: true,
    /** Support du pointer par défaut */
    pointerSupport: true,
  },

  // ============================================================================
  // ANIMATIONS
  // ============================================================================

  animations: {
    enter: {
      type: 'fade' as const,
      duration: 300,
      easing: 'ease-out' as const,
    } as AnimationConfig,

    exit: {
      type: 'fade' as const,
      duration: 300,
      easing: 'ease-in' as const,
    } as AnimationConfig,
  },

  // ============================================================================
  // ACCESSIBILITÉ
  // ============================================================================

  accessibility: {
    /** Rôle ARIA par défaut */
    role: 'img',
    /** Label ARIA par défaut */
    ariaLabel: 'Signature pad',
    /** Auto-désactiver pour mouvement réduit */
    autoDisableForReducedMotion: false,
  },
};

/**
 * Extrait les valeurs par défaut pour Signature
 * @returns Options par défaut
 */
export function getSignatureDefaults(): SignatureOptions {
  return {
    // Options de base
    priorityLevel: PriorityLevel.MEDIUM,

    // Options spécifiques
    penColor: 'black',
    backgroundColor: 'rgba(0,0,0,0)',
    minWidth: 0.5,
    maxWidth: 2.5,
    dotSize: 0,
    minDistance: 5,
    throttle: 16,
    velocityFilterWeight: 0.7,
    compositeOperation: 'source-over',
    canvasContextOptions: {},
    ariaLabel: 'Signature pad',

    // Callbacks
    onOpenStart: null,
    onOpenEnd: null,
    onCloseStart: null,
    onCloseEnd: null,
  };
}







