/**
 * @fileoverview Spécifications du composant Badge K3UI
 * @description Spécifications et comportements pour le composant Badge conforme Material Design 3 Expressive
 * @author K3UI Team
 * @version 1.0.0
 */

import type { AnimationConfig } from '../../types/components/animations';
import { BadgeOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Spécifications du composant Badge
 */
export const BadgeSpecs = {
    // ============================================================================
    // COMPORTEMENTS PAR DÉFAUT
    // ============================================================================

    behaviors: {
        /** Variante par défaut */
        defaultVariant: 'large' as const,
        /** Position par défaut */
        defaultPosition: 'top-right' as const,
        /** Contenu par défaut */
        defaultContent: null as string | number | null,
        /** Couleur de fond par défaut */
        defaultBackgroundColor: '#ee4540',
        /** Couleur du texte par défaut */
        defaultTextColor: '#ffffdd',
    },

    // ============================================================================
    // ANIMATIONS
    // ============================================================================

    animations: {
        enter: {
            type: 'scale' as const,
            duration: 200,
            easing: 'ease-out' as const,
        } as AnimationConfig,

        exit: {
            type: 'scale' as const,
            duration: 150,
            easing: 'ease-in' as const,
        } as AnimationConfig,
    },

    // ============================================================================
    // VARIANTS
    // ============================================================================

    variants: {
        available: ['small', 'large'] as const,

        default: 'large' as const,

        /** Configuration par variante */
        config: {
            small: {
                /** Taille du badge small (point uniquement) */
                size: '8px',
                /** Pas de contenu pour small */
                showContent: false,
            },
            large: {
                /** Hauteur minimale du badge large */
                minHeight: '20px',
                /** Padding horizontal */
                paddingHorizontal: '6px',
                /** Taille de police */
                fontSize: '12px',
                /** Afficher le contenu */
                showContent: true,
            },
        },
    },

    // ============================================================================
    // POSITIONS
    // ============================================================================

    positions: {
        available: ['top-right', 'top-left', 'bottom-right', 'bottom-left'] as const,

        default: 'top-right' as const,

        /** Configuration par position */
        config: {
            'top-right': {
                top: '0',
                right: '0',
                transform: 'translate(50%, -50%)',
            },
            'top-left': {
                top: '0',
                left: '0',
                transform: 'translate(-50%, -50%)',
            },
            'bottom-right': {
                bottom: '0',
                right: '0',
                transform: 'translate(50%, 50%)',
            },
            'bottom-left': {
                bottom: '0',
                left: '0',
                transform: 'translate(-50%, 50%)',
            },
        },
    },

    // ============================================================================
    // CONTENU
    // ============================================================================

    content: {
        /** Valeur maximale pour les nombres (au-delà affiche "999+") */
        maxNumber: 999,
        /** Texte affiché quand le nombre dépasse maxNumber */
        overflowText: '999+',
        /** Longueur maximale du texte (recommandé) */
        maxTextLength: 10,
    },

    // ============================================================================
    // ACCESSIBILITÉ
    // ============================================================================

    accessibility: {
        /** Rôle ARIA par défaut */
        role: 'status' as const,
        /** Auto-désactiver pour mouvement réduit */
        autoDisableForReducedMotion: true,
        /** Labels ARIA par défaut */
        labels: {
            number: (count: number) => `${count} notifications`,
            text: (text: string) => text,
            default: 'Badge',
        },
    },

    // ============================================================================
    // COULEURS
    // ============================================================================

    colors: {
        /** Couleur de fond par défaut */
        defaultBackground: '#ee4540',
        /** Couleur de texte par défaut */
        defaultText: '#ffffdd',
        /** Couleurs Material Design 3 recommandées */
        material: {
            error: '#ba1a1a',
            warning: '#ff9800',
            info: '#1976d2',
            success: '#4caf50',
        },
    },
} as const;

/**
 * Extrait les valeurs par défaut pour Badge depuis les specs
 * @returns Options par défaut pour Badge
 */
export function getBadgeDefaults(): BadgeOptions {
    return {
        // Options de base
        priorityLevel: PriorityLevel.MEDIUM,

        // Options spécifiques
        variant: BadgeSpecs.variants.default,
        position: BadgeSpecs.positions.default,
        content: BadgeSpecs.behaviors.defaultContent,
        backgroundColor: BadgeSpecs.colors.defaultBackground,
        textColor: BadgeSpecs.colors.defaultText,
        autoDisableForReducedMotion: BadgeSpecs.accessibility.autoDisableForReducedMotion,

        // Callbacks
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
    };
}



