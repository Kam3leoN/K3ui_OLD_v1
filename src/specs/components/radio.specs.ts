/**
 * @fileoverview Spécifications du composant Radio K3UI
 * @description Spécifications et comportements pour les radio buttons selon Material Design 3
 * @author K3UI Team
 * @version 1.0.0
 */

import type { AnimationConfig } from '../../types/components/animations';
import { RadioOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';
import { getHapticFeedbackDefaults } from '../common/haptic-feedback.specs';

/**
 * Spécifications du composant Radio
 */
export const RadioSpecs = {
    // ============================================================================
    // COMPORTEMENTS PAR DÉFAUT
    // ============================================================================

    behaviors: {
        /** Si le radio est sélectionné par défaut */
        defaultChecked: false,
        /** Si le radio est désactivé */
        disabled: false,
        /** Si le radio a un label */
        showLabel: true,
        /** Si le radio a un état d'erreur */
        error: false,
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
    },

    // ============================================================================
    // TYPES ET VARIANTS
    // ============================================================================

    types: {
        available: [
            'default',
        ] as const,

        default: 'default' as const,
    },

    // ============================================================================
    // ACCESSIBILITÉ
    // ============================================================================

    accessibility: {
        /** Rôle ARIA */
        role: 'radio' as const,
        /** Si le radio est focusable */
        focusable: true,
        /** Ordre de tabulation */
        tabIndex: 0,
        /** Labels ARIA par défaut */
        labels: {
            checked: 'Sélectionné',
            unchecked: 'Non sélectionné',
        },
        /** Si le radio annonce ses changements d'état */
        announceStateChanges: true,
        /** Si le radio respecte les préférences de mouvement réduit */
        respectReducedMotion: true,
    },

    // ============================================================================
    // INTERACTIONS
    // ============================================================================

    interactions: {
        /** Si le radio répond au clic */
        clickable: true,
        /** Si le radio répond au clavier */
        keyboardEnabled: true,
        /** Si le radio répond au touch */
        touchEnabled: true,
        /** Si le radio peut être sélectionné */
        selectable: true,
        /** Navigation clavier entre radios du même groupe */
        keyboardNavigation: true,
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
        /** Si le radio suit le thème système */
        followSystemTheme: true,
        /** Styles par état */
        states: {
            default: {
                containerColor: 'transparent',
                outlineColor: 'var(--md-sys-color-on-surface-variant)',
                outlineWidth: '2px',
            },
            checked: {
                containerColor: 'transparent',
                dotColor: 'var(--md-sys-color-primary)',
                outlineColor: 'var(--md-sys-color-primary)',
            },
            error: {
                outlineColor: 'var(--md-sys-color-error)',
                dotColor: 'var(--md-sys-color-error)',
            },
            disabled: {
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
 * Extrait les valeurs par défaut pour Radio depuis les specs
 * @returns Options par défaut pour Radio
 */
export function getRadioDefaults(): RadioOptions {
    return {
        checked: RadioSpecs.behaviors.defaultChecked,
        disabled: RadioSpecs.behaviors.disabled,
        label: undefined,
        showLabel: RadioSpecs.behaviors.showLabel,
        error: RadioSpecs.behaviors.error,
        name: '',
        value: '',
        onToggle: null,
        onChange: null,
        onFocus: null,
        onBlur: null,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
        priority: RadioSpecs.priority,
        animation: RadioSpecs.animations.toggle,
        ...getHapticFeedbackDefaults('light'),
    };
}










