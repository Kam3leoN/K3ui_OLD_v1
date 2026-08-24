/**
 * @fileoverview Spécifications Button Groups — Material Design 3 You Expressive
 * @see https://m3.material.io/components/button-groups/specs
 * @see https://github.com/material-components/material-components-android/blob/master/docs/components/ButtonGroup.md
 * @author K3UI Team
 * @version 3.1.0
 */

import type { AnimationConfig } from '../../types/components/animations';
import type { ButtonGroupsOptions, ButtonGroupItem } from '../../types/components';
import { PriorityLevel } from '../../types/base';

export type ButtonGroupsSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** Forme M3 Button Groups — round (pill) ou square */
export type ButtonGroupsShape = 'round' | 'square';

/** Métriques par taille — alignées ButtonDefaults M3 Expressive */
export interface ButtonGroupsSizeMetrics {
    /** Hauteur conteneur (dp) */
    heightDp: number;
    /** Hauteur en rem (base 16) */
    heightRem: string;
    /** Padding horizontal (dp) — contentPaddingFor */
    paddingXDp: number;
    /** Taille label — rem (aligné ButtonDefaults M3 Expressive / button.token) */
    fontSizeRem: string;
    /** Taille label (px) — lecture specs / tests */
    fontSizePx: number;
    /** Line-height label — rem */
    lineHeightRem: string;
    /** Line-height label (px) — tests */
    lineHeightPx: number;
    /** Graisse — type scale M3 */
    fontWeight: number;
    /** Letter-spacing — rem */
    letterSpacingRem: string;
    /** Token type scale M3 */
    typeScaleToken: 'label-large' | 'title-medium' | 'headline-small' | 'headline-medium';
    /** Taille icône (dp) — iconSizeFor */
    iconSizeDp: number;
    /** Espacement icône/label (dp) — iconSpacingFor */
    iconSpacingDp: number;
    /** Rayon square standard (dp) — shape scale M3 */
    squareRadiusDp: number;
}

/**
 * Spécifications M3 Button Groups (source de vérité)
 *
 * | size | height | gap standard | gap connected | inner radius | outer radius (connected round) |
 * | xs   | 32dp   | 12dp         | 2dp           | 4dp          | full                           |
 * | sm   | 40dp   | 12dp         | 2dp           | 8dp          | full                           |
 * | md   | 56dp   | 12dp         | 2dp           | 8dp          | full                           |
 * | lg   | 96dp   | 12dp         | 2dp           | 16dp         | full                           |
 * | xl   | 136dp  | 12dp         | 2dp           | 20dp         | full                           |
 */
export const ButtonGroupsSpecs = {
    behaviors: {
        defaultVariant: 'filled' as const,
        defaultSize: 'md' as const,
        defaultShape: 'round' as const,
        defaultType: 'standard' as const,
        defaultMultiSelect: false,
        defaultOverflowMode: 'none' as const,

        /** Connected : inner corner par taille (M3 Expressive — junction entre segments) */
        innerCornerConnectedBySize: {
            xs: 4,
            sm: 8,
            md: 8,
            lg: 16,
            xl: 20,
        } as Record<ButtonGroupsSize, number>,

        /** Connected : gap 2dp (toutes tailles) */
        gapConnected: 2,

        /** Standard — gap constant 12dp (toutes tailles) */
        gapStandard: 12,

        /** Standard round pill morph — height/2 (identique connected cap, pas 9999px) */
        standardOuterRadiusFormula: 'calc(var(--k3-button-groups-height) / 2)',

        /** Legacy pill constant — non utilisé pour standard/connected round (cap height/2) */
        outerRadiusFull: 9999,

        /** Connected round — fully rounded cap = min(radius, height/2) */
        connectedOuterRadiusFormula: 'calc(var(--k3-button-groups-height) / 2)',

        /** Fallback px outer cap density 0 (height/2) — xs16/sm20/md28/lg48/xl68 */
        outerCapBySize: {
            xs: 16,
            sm: 20,
            md: 28,
            lg: 48,
            xl: 68,
        } as Record<ButtonGroupsSize, number>,

        /** Connected square — outer = shape large (~16dp) */
        outerRadiusConnectedSquare: 16,

        /** Corner radius square standard par taille (shape scale M3 : xs4/sm8/md12/lg16/xl28) */
        cornerRadiusBySize: {
            xs: 4,
            sm: 8,
            md: 12,
            lg: 16,
            xl: 28,
        } as Record<ButtonGroupsSize, number>,

        /** Hauteurs conteneur (dp) M3 Expressive ButtonDefaults ContainerHeight */
        heightBySize: {
            xs: 32,
            sm: 40,
            md: 56,
            lg: 96,
            xl: 136,
        } as Record<ButtonGroupsSize, number>,

        /** Density supportée (0, -1, -2, -3) — réduction 4dp par niveau */
        densityLevels: [0, -1, -2, -3] as const,
        densityStepDp: 4,

        /** Standard — ratio d'expansion au press (M3 ExpandedRatio) */
        expandedRatio: 0.15,

        minTouchTargetDp: 48,

        defaultOverflowButtonIcon: 'ellipsis-vertical',

        /** Morph sélection : round ↔ square (M3 guidelines) */
        shapeMorphOnSelect: true,
        shapeMorphOnPress: true,
    },

    /** Métriques détaillées par taille (padding, typo, icônes) */
    sizes: {
        xs: {
            heightDp: 32,
            heightRem: '2rem',
            paddingXDp: 12,
            fontSizeRem: '0.875rem',
            fontSizePx: 14,
            lineHeightRem: '1.25rem',
            lineHeightPx: 20,
            fontWeight: 500,
            letterSpacingRem: '0.00625rem',
            typeScaleToken: 'label-large',
            iconSizeDp: 18,
            iconSpacingDp: 4,
            squareRadiusDp: 4,
        },
        sm: {
            heightDp: 40,
            heightRem: '2.5rem',
            paddingXDp: 16,
            fontSizeRem: '0.875rem',
            fontSizePx: 14,
            lineHeightRem: '1.25rem',
            lineHeightPx: 20,
            fontWeight: 500,
            letterSpacingRem: '0.00625rem',
            typeScaleToken: 'label-large',
            iconSizeDp: 20,
            iconSpacingDp: 8,
            squareRadiusDp: 8,
        },
        md: {
            heightDp: 56,
            heightRem: '3.5rem',
            paddingXDp: 24,
            fontSizeRem: '1rem',
            fontSizePx: 16,
            lineHeightRem: '1.5rem',
            lineHeightPx: 24,
            fontWeight: 500,
            letterSpacingRem: '0.009375rem',
            typeScaleToken: 'title-medium',
            iconSizeDp: 24,
            iconSpacingDp: 8,
            squareRadiusDp: 12,
        },
        lg: {
            heightDp: 96,
            heightRem: '6rem',
            paddingXDp: 48,
            fontSizeRem: '1.5rem',
            fontSizePx: 24,
            lineHeightRem: '2rem',
            lineHeightPx: 32,
            fontWeight: 400,
            letterSpacingRem: '0',
            typeScaleToken: 'headline-small',
            iconSizeDp: 32,
            iconSpacingDp: 12,
            squareRadiusDp: 16,
        },
        xl: {
            heightDp: 136,
            heightRem: '8.5rem',
            paddingXDp: 64,
            fontSizeRem: '2rem',
            fontSizePx: 32,
            lineHeightRem: '2.5rem',
            lineHeightPx: 40,
            fontWeight: 400,
            letterSpacingRem: '0',
            typeScaleToken: 'headline-medium',
            iconSizeDp: 40,
            iconSpacingDp: 16,
            squareRadiusDp: 28,
        },
    } as Record<ButtonGroupsSize, ButtonGroupsSizeMetrics>,

    /** Motion M3 Expressive — spatial (forme, expansion) + effects (état, overlay) */
    motion: {
        shape: {
            schema: 'spatial' as const,
            speed: 'fast' as const,
        },
        expand: {
            schema: 'spatial' as const,
            speed: 'fast' as const,
        },
        state: {
            schema: 'effects' as const,
            speed: 'default' as const,
        },
        overlay: {
            schema: 'effects' as const,
            speed: 'fast' as const,
        },
        indicator: {
            schema: 'spatial' as const,
            speed: 'fast' as const,
        },
        pressedScale: 0.97,
    },

    animations: {
        enter: {
            type: 'fade' as const,
            duration: 350,
            easing: 'cubic-bezier(0.42, 1.67, 0.21, 0.9)' as const,
        } as unknown as AnimationConfig,
        exit: {
            type: 'fade' as const,
            duration: 150,
            easing: 'cubic-bezier(0.31, 0.94, 0.34, 1)' as const,
        } as unknown as AnimationConfig,
    },

    accessibility: {
        roleGroup: 'group',
        roleRadioGroup: 'radiogroup',
        autoDisableForReducedMotion: true,
    },
};

/**
 * Calcule les CSS custom properties radius pour le conteneur
 * @param size Taille du groupe
 * @param shape Forme round | square
 * @param type Type standard | connected
 */
export function getButtonGroupsRadiusVars(
    size: ButtonGroupsSize,
    shape: ButtonGroupsShape,
    type: 'standard' | 'connected'
): { inner: string; outer: string; full: string } {
    const {
        innerCornerConnectedBySize,
        outerRadiusConnectedSquare,
        cornerRadiusBySize,
        connectedOuterRadiusFormula,
        standardOuterRadiusFormula,
    } = ButtonGroupsSpecs.behaviors;
    const cap = connectedOuterRadiusFormula;
    const inner = `${innerCornerConnectedBySize[size]}px`;

    if (type === 'connected') {
        const outer = shape === 'round' ? cap : `${outerRadiusConnectedSquare}px`;
        return { inner, outer, full: cap };
    }

    const pillCap = standardOuterRadiusFormula;
    const outer = shape === 'round' ? pillCap : `${cornerRadiusBySize[size]}px`;
    return { inner, outer, full: pillCap };
}

export function getButtonGroupsDefaults(): ButtonGroupsOptions {
    return {
        priorityLevel: PriorityLevel.MEDIUM,
        buttons: [] as ButtonGroupItem[],
        variant: ButtonGroupsSpecs.behaviors.defaultVariant,
        size: ButtonGroupsSpecs.behaviors.defaultSize,
        shape: ButtonGroupsSpecs.behaviors.defaultShape,
        type: ButtonGroupsSpecs.behaviors.defaultType,
        multiSelect: ButtonGroupsSpecs.behaviors.defaultMultiSelect,
        overflowMode: ButtonGroupsSpecs.behaviors.defaultOverflowMode,
        overflowButtonIcon: ButtonGroupsSpecs.behaviors.defaultOverflowButtonIcon,
        expandedRatio: ButtonGroupsSpecs.behaviors.expandedRatio,
        defaultSelected: [0],
        density: 0,
        onSelect: null,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
    };
}
