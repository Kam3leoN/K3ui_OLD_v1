/**
 * @fileoverview Spécifications du composant Checkbox K3UI
 * @description Spécifications et comportements pour les checkboxes selon Material Design 3
 * @author K3UI Team
 * @version 1.0.0
 */

import type { AnimationConfig } from '../../types/components/animations';
import { CheckboxOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';
import { getHapticFeedbackDefaults } from '../common/haptic-feedback.specs';

/**
 * Spécifications du composant Checkbox
 */
export const CheckboxSpecs = {
    // ============================================================================
    // COMPORTEMENTS PAR DÉFAUT
    // ============================================================================

    behaviors: {
        /** Si le checkbox est coché par défaut */
        defaultChecked: false,
        /** Si le checkbox est désactivé */
        disabled: false,
        /** Si le checkbox est en état indéterminé */
        indeterminate: false,
        /** Si le checkbox a un label */
        showLabel: true,
        /** Si le checkbox a un état d'erreur */
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
        role: 'checkbox' as const,
        /** Si le checkbox est focusable */
        focusable: true,
        /** Ordre de tabulation */
        tabIndex: 0,
        /** Labels ARIA par défaut */
        labels: {
            checked: 'Coché',
            unchecked: 'Décoché',
            indeterminate: 'Indéterminé',
        },
        /** Si le checkbox annonce ses changements d'état */
        announceStateChanges: true,
        /** Si le checkbox respecte les préférences de mouvement réduit */
        respectReducedMotion: true,
    },

    // ============================================================================
    // INTERACTIONS
    // ============================================================================

    interactions: {
        /** Si le checkbox répond au clic */
        clickable: true,
        /** Si le checkbox répond au clavier */
        keyboardEnabled: true,
        /** Si le checkbox répond au touch */
        touchEnabled: true,
        /** Si le checkbox peut être coché/décoché */
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
        /** Si le checkbox suit le thème système */
        followSystemTheme: true,
        /** Styles par état */
        states: {
            default: {
                containerColor: 'transparent',
                outlineColor: 'var(--md-sys-color-on-surface-variant)',
                outlineWidth: '2px',
            },
            checked: {
                containerColor: 'var(--md-sys-color-primary)',
                iconColor: 'var(--md-sys-color-on-primary)',
            },
            indeterminate: {
                containerColor: 'var(--md-sys-color-primary)',
                iconColor: 'var(--md-sys-color-on-primary)',
            },
            error: {
                outlineColor: 'var(--md-sys-color-error)',
                containerColor: 'var(--md-sys-color-error)',
                iconColor: 'var(--md-sys-color-on-error)',
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
 * Extrait les valeurs par défaut pour Checkbox depuis les specs
 * @returns Options par défaut pour Checkbox
 */
export function getCheckboxDefaults(): CheckboxOptions {
    return {
        checked: CheckboxSpecs.behaviors.defaultChecked,
        disabled: CheckboxSpecs.behaviors.disabled,
        indeterminate: CheckboxSpecs.behaviors.indeterminate,
        label: undefined,
        showLabel: CheckboxSpecs.behaviors.showLabel,
        error: CheckboxSpecs.behaviors.error,
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
        animation: CheckboxSpecs.animations.toggle,
        ...getHapticFeedbackDefaults('light'),
    };
}

