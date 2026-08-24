/**
 * @fileoverview Spécifications du composant Command K3UI (palette de commandes)
 * @description Spécifications Material Design 3 You Expressive pour la command palette
 * @see https://m3.material.io/components/dialogs/overview
 * @author K3UI Team
 * @version 1.0.0
 */

import type { AnimationConfig } from '../../types/components/animations';
import type { CommandOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Spécifications du composant Command (palette de commandes MD3 Expressive)
 */
export const CommandSpecs = {
    // ============================================================================
    // COMPORTEMENTS PAR DÉFAUT (MD3)
    // ============================================================================

    behaviors: {
        /** Fermer au clic sur le scrim */
        closeOnScrimClick: true,
        /** Fermer avec Escape */
        closeOnEscape: true,
        /** Empêcher le scroll du body quand ouvert */
        preventScrolling: true,
        /** Piéger le focus dans la palette */
        focusTrap: true,
        /** Afficher les groupes par défaut */
        showGroups: true,
        /** Afficher les icônes par défaut */
        showIcons: true,
        /** Afficher les descriptions par défaut */
        showDescriptions: true,
        /** Afficher les raccourcis par défaut */
        showShortcuts: true,
    },

    // ============================================================================
    // ANIMATIONS (MD3 Expressive)
    // ============================================================================

    animations: {
        enter: {
            type: 'scale' as const,
            duration: 350,
            easing: 'ease-out' as const,
        } as AnimationConfig,
        exit: {
            type: 'scale' as const,
            duration: 250,
            easing: 'ease-in' as const,
        } as AnimationConfig,
        scrim: {
            type: 'fade' as const,
            duration: 200,
            easing: 'ease-out' as const,
        } as AnimationConfig,
    },

    // ============================================================================
    // ACCESSIBILITÉ
    // ============================================================================

    accessibility: {
        role: 'dialog' as const,
        ariaModal: true,
        ariaLabel: true,
        respectReducedMotion: true,
    },

    // ============================================================================
    // TAILLES (largeur palette)
    // ============================================================================

    sizes: {
        compact: { width: 'min(480px, calc(100vw - 48px))' },
        default: { width: 'min(640px, calc(100vw - 48px))' },
        expanded: { width: 'min(800px, calc(100vw - 48px))' },
    },

    // ============================================================================
    // RACCOURCI CLAVIER
    // ============================================================================

    shortcut: {
        /** Raccourci par défaut (meta sur Mac = Cmd, ctrl ailleurs) */
        defaultKey: 'k',
        modKey: 'ctrl', // ctrl ou meta selon plateforme
    },
} as const;

/**
 * Extrait les valeurs par défaut pour Command depuis les specs MD3
 * @returns Options par défaut pour Command
 */
export function getCommandDefaults(): CommandOptions {
    return {
        commands: [],
        groups: {},
        groupOrder: [],
        triggerSelector: null,
        shortcutKey: 'ctrl+k',
        showGroups: CommandSpecs.behaviors.showGroups,
        showIcons: CommandSpecs.behaviors.showIcons,
        showDescriptions: CommandSpecs.behaviors.showDescriptions,
        showShortcuts: CommandSpecs.behaviors.showShortcuts,
        size: 'default',
        priorityLevel: PriorityLevel.MEDIUM,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
        onCommandSelect: null,
    };
}
