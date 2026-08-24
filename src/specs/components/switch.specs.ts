/**
 * @fileoverview Spécifications du composant Switch K3UI
 * @description Spécifications et comportements pour les switches
 * @author K3UI Team
 * @version 1.0.0
 */

import type { AnimationConfig } from '../../types/components/animations';
import { SwitchOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';
import { getHapticFeedbackDefaults } from '../common/haptic-feedback.specs';

/**
 * Spécifications du composant Switch
 */
export const SwitchSpecs = {
    // ============================================================================
    // COMPORTEMENTS PAR DÉFAUT
    // ============================================================================

    behaviors: {
        /** Si le switch est activé par défaut */
        defaultChecked: false,
        /** Si le switch est désactivé */
        disabled: false,
        /** Si le switch a un label */
        showLabel: true,
        /** Si le switch affiche l'icône */
        showIcon: false,
    },

    // ============================================================================
    // ANIMATIONS
    // ============================================================================

    animations: {
        toggle: {
            type: 'scale' as const,
            duration: 200,
            easing: 'ease-out' as const,
            direction: 'center' as const,
        } as AnimationConfig,

        haptic: {
            type: 'bounce' as const,
            duration: 150,
            easing: 'ease-out' as const,
            direction: 'center' as const,
        } as AnimationConfig,
    },

    // ============================================================================
    // TYPES ET VARIANTS
    // ============================================================================

    types: {
        available: [
            'default',
            'icon'
        ] as const,

        default: 'default' as const,
    },

    // ============================================================================
    // TAILLES (Plus de variantes - uniquement la version normale)
    // ============================================================================

    // ============================================================================
    // ACCESSIBILITÉ
    // ============================================================================

    accessibility: {
        /** Rôle ARIA */
        role: 'switch' as const,
        /** Si le switch est focusable */
        focusable: true,
        /** Ordre de tabulation */
        tabIndex: 0,
        /** Labels ARIA par défaut */
        labels: {
            on: 'Activé',
            off: 'Désactivé',
        },
        /** Si le switch annonce ses changements d'état */
        announceStateChanges: true,
        /** Si le switch respecte les préférences de mouvement réduit */
        respectReducedMotion: true,
    },

    // ============================================================================
    // INTERACTIONS
    // ============================================================================

    interactions: {
        /** Si le switch répond au clic */
        clickable: true,
        /** Si le switch répond au clavier */
        keyboardEnabled: true,
        /** Si le switch répond au touch */
        touchEnabled: true,
        /** Si le switch peut être activé/désactivé */
        togglable: true,
    },

    // ============================================================================
    // PERFORMANCE
    // ============================================================================

    performance: {
        /** Si l'animation est désactivée sur mobile */
        disableAnimationOnMobile: false,
        /** Si le rendu est différé */
        deferredRendering: false,
    },

    // ============================================================================
    // THÈMES ET STYLES
    // ============================================================================

    theming: {
        /** Si le switch suit le thème système */
        followSystemTheme: true,
        /** Styles par état */
        states: {
            default: {
                backgroundColor: 'var(--md-sys-color-surface-container-highest)',
                color: 'var(--md-sys-color-on-surface-variant)',
            },
            checked: {
                backgroundColor: 'var(--md-sys-color-primary)',
                color: 'var(--md-sys-color-on-primary)',
            },
            disabled: {
                backgroundColor: 'var(--md-sys-color-surface-container-highest)',
                color: 'var(--md-sys-color-on-surface-disabled)',
                opacity: 0.38,
            },
        },
    },

    // ============================================================================
    // SONS ET FEEDBACK
    // ============================================================================

    audio: {
        /** Si les sons sont activés */
        enabled: true,
        /** Sons par action */
        sounds: {
            toggle: 'click.mp3',
        },
        /** Volume par défaut */
        volume: 0.5,
    },

    // ============================================================================
    // PRIORITÉ
    // ============================================================================

    priority: PriorityLevel.MEDIUM,
} as const;

/**
 * Extrait les valeurs par défaut pour Switch depuis les specs
 * @returns Options par défaut pour Switch
 */
export function getSwitchDefaults(): SwitchOptions {
    return {
        checked: SwitchSpecs.behaviors.defaultChecked,
        disabled: SwitchSpecs.behaviors.disabled,
        label: undefined,
        size: 'medium',
        style: 'normal',
        traffic: false,
        iconType: 'classic',
        labelPosition: 'left',
        onChange: null,
        priorityLevel: PriorityLevel.MEDIUM,
        ...getHapticFeedbackDefaults('light'),
    };
}

