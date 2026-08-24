/**
 * @fileoverview Spécifications du composant Menu K3UI
 * @description Spécifications et comportements pour les menus en cascade
 * @author K3UI Team
 * @version 1.0.0
 */

import type { AnimationConfig } from '../../types/components/animations';
import { MenuOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';
import { getHapticFeedbackDefaults } from '../common/haptic-feedback.specs';

/**
 * Spécifications du composant Menu
 */
export const MenuSpecs = {
    // ============================================================================
    // COMPORTEMENTS PAR DÉFAUT
    // ============================================================================

    behaviors: {
        /** Si le menu est activé par défaut */
        enabled: true,
        /** Si le menu ferme au clic externe */
        closeOnClickOutside: true,
        /** Si le menu ferme avec Escape */
        closeOnEscape: true,
        /** Si le menu ferme après sélection */
        closeOnSelect: true,
        /** Toggle open/close au clic/clavier sur le trigger */
        triggerToggle: true,
        /** Remettre le focus sur le trigger à la fermeture */
        restoreFocus: true,
        /** Si les sous-menus s'ouvrent au hover */
        submenuHover: true,
        /** Si les sous-menus s'ouvrent au clic */
        submenuClick: false,
    },

    // ============================================================================
    // ANIMATIONS
    // ============================================================================

    animations: {
        /**
         * Enter menu : transform → spatial-fast, opacity → effects-fast.
         * Durées/easing via `--md-sys-motion-{spatial|effects}-fast-*` (schéma data-motion-scheme).
         */
        enter: {
            type: 'fade' as const,
            duration: 350,
            easing: 'ease-out' as const,
            direction: 'down' as const,
        } as AnimationConfig,

        /**
         * Exit menu : spatial-fast + effects-fast (exit ≤ enter, pas de token exit dédié).
         */
        exit: {
            type: 'fade' as const,
            duration: 350,
            easing: 'ease-in' as const,
            direction: 'up' as const,
        } as AnimationConfig,

        /** Sous-menu : translateX → spatial-fast, opacity → effects-fast */
        submenuEnter: {
            type: 'slide' as const,
            duration: 350,
            easing: 'ease-out' as const,
            direction: 'right' as const,
        } as AnimationConfig,
    },

    /** Motion M3 Expressive — aligné sur menu.token.scss ($menu-animation-scale-start) */
    motion: {
        scaleStart: 0.85,
        scaleEnd: 1,
        spatialSpeed: 'fast' as const,
        effectsSpeed: 'fast' as const,
    },

    /**
     * Timings d'intention sous-menu (nommés — pas de valeurs magiques en JS).
     * Modèle M3 : délai court avant ouverture/fermeture au survol.
     */
    timing: {
        /** Délai avant ouverture d'un sous-menu au survol (intention d'ouverture) */
        submenuOpenDelayMs: 100,
        /** Délai avant fermeture quand le pointeur quitte item + sous-menu */
        submenuCloseDelayMs: 120,
    },

    // ============================================================================
    // POSITIONS ET ALIGNEMENTS
    // ============================================================================

    positions: {
        available: [
            'auto',
            'top',
            'top-start',
            'top-end',
            'bottom',
            'bottom-start',
            'bottom-end',
            'right',
            'right-start',
            'right-end',
            'left',
            'left-start',
            'left-end'
        ] as const,

        default: 'auto' as const,
        
        /** Si le menu recouvre le trigger par défaut */
        cover: false,

        submenuPositions: {
            available: [
                'auto',
                'left',
                'right'
            ] as const,
            default: 'auto' as const,
        },

        /** Marges de sécurité */
        margins: {
            top: 8,
            bottom: 8,
            left: 8,
            right: 8,
        },
    },

    // ============================================================================
    // ACCESSIBILITÉ
    // ============================================================================

    accessibility: {
        /** Rôle ARIA */
        role: 'menu' as const,
        /** Si le menu est focusable */
        focusable: true,
        /** Ordre de tabulation */
        tabIndex: 0,
        /** Labels ARIA par défaut */
        labels: {
            menu: 'Menu',
            trigger: 'Ouvrir le menu',
            item: 'Élément de menu',
            submenu: 'Sous-menu',
        },
        /** Si le menu respecte les préférences de mouvement réduit */
        respectReducedMotion: true,
        /** Si le menu annonce ses changements d'état */
        announceStateChanges: true,
    },

    // ============================================================================
    // INTERACTIONS
    // ============================================================================

    interactions: {
        /** Si le menu répond au clic */
        clickable: true,
        /** Si le menu répond au hover */
        hoverable: true,
        /** Si le menu répond au focus */
        focusable: true,
        /** Si le menu peut être activé au clavier */
        keyboardActivable: true,
        /** Si le menu peut être activé au touch */
        touchActivable: true,
    },

    // ============================================================================
    // RESPONSIVE
    // ============================================================================

    responsive: {
        /** Si le menu s'adapte aux petits écrans */
        adaptive: true,
        /** Largeur maximale sur mobile */
        maxWidthMobile: '90vw',
        /** Largeur maximale sur desktop */
        maxWidthDesktop: '300px',
    },

    // ============================================================================
    // PERFORMANCE
    // ============================================================================

    performance: {
        /** Si l'animation est désactivée sur mobile */
        disableAnimationOnMobile: false,
        /** Si le rendu est différé */
        deferredRendering: false,
        /** Si les items sont mis en cache */
        cached: true,
    },
} as const;

/**
 * Extrait les valeurs par défaut pour Menu depuis les specs
 * @returns Options par défaut pour Menu
 */
export function getMenuDefaults(): MenuOptions {
    return {
        items: [],
        position: MenuSpecs.positions.default,
        submenuPosition: MenuSpecs.positions.submenuPositions.default,
        closeOnClick: MenuSpecs.behaviors.closeOnSelect,
        triggerToggle: MenuSpecs.behaviors.triggerToggle,
        restoreFocus: MenuSpecs.behaviors.restoreFocus,
        enableAnimations: true,
        hover: false,
        cover: false,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
        onItemClick: undefined,
        priorityLevel: PriorityLevel.MEDIUM,
        ...getHapticFeedbackDefaults('selection'),
    };
}

