/**
 * @fileoverview Spécifications du composant ButtonSplit K3UI
 * @description Split Button Material Design 3 Expressive — main + trailing, gap 3dp, inner radius 4/8/12dp
 * @author K3UI Team
 * @version 1.0.0
 */

import type { ButtonSplitOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Spécifications ButtonSplit (M3 Expressive)
 * Tailles : xs 32dp, sm 40dp, md 56dp, lg 96dp, xl 136dp
 * Gap entre boutons : 3dp · Inner radius : 4dp (xs/sm/md), 8dp (lg), 12dp (xl)
 */
export const ButtonSplitSpecs = {
    behaviors: {
        defaultVariant: 'filled' as const,
        defaultSize: 'md' as const,
        defaultShape: 'rounded' as const,
        defaultIconType: 'chevron' as const,
        /** Noms IconManager (classic/) pour le trailing */
        trailingIconChevron: 'chevron',
        trailingIconArrow: 'arrow-down',
        trailingIconEllipsis: 'ellipsis-vertical',
        defaultLeadingIcon: 'edit',
        /** Gap entre main et trailing (3dp) */
        gap: 3,
        /** Inner radius (bords connectés) : 4dp xs/sm/md, 8dp lg, 12dp xl */
        innerRadiusXs: 4,
        innerRadiusSm: 4,
        innerRadiusMd: 4,
        innerRadiusLg: 8,
        innerRadiusXl: 12,
    },

    /** Tailles M3 Expressive (hauteur en px). Icon sizes = M3 tokens (leading = Button*Tokens.IconSize, trailing = SplitButton*Tokens.TrailingIconSize) */
    sizes: {
        xs: { height: 32, fontSize: 11, iconSize: 20, trailingIconSize: 22, mainPl: 12, mainGap: 4, mainPr: 10, trailingWidth: 22, outerRadius: 8, innerRadius: 4 },
        sm: { height: 40, fontSize: 13, iconSize: 20, trailingIconSize: 22, mainPl: 16, mainGap: 8, mainPr: 12, trailingWidth: 22, outerRadius: 10, innerRadius: 4 },
        md: { height: 56, fontSize: 16, iconSize: 24, trailingIconSize: 26, mainPl: 24, mainGap: 8, mainPr: 13, trailingWidth: 26, outerRadius: 16, innerRadius: 4 },
        lg: { height: 96, fontSize: 24, iconSize: 32, trailingIconSize: 38, mainPl: 48, mainGap: 12, mainPr: 26, trailingWidth: 38, outerRadius: 28, innerRadius: 8 },
        xl: { height: 136, fontSize: 32, iconSize: 40, trailingIconSize: 50, mainPl: 64, mainGap: 16, mainPr: 37, trailingWidth: 50, outerRadius: 40, innerRadius: 12 },
    },

    accessibility: {
        role: 'group',
        leadingAriaLabelDefault: 'Bouton principal',
        trailingAriaLabelExpand: 'Déployer',
        trailingAriaLabelCollapse: 'Réduire',
    },
};

/**
 * Retourne les options par défaut pour ButtonSplit
 */
export function getButtonSplitDefaults(): ButtonSplitOptions {
    return {
        priorityLevel: PriorityLevel.MEDIUM,
        label: 'Label',
        variant: ButtonSplitSpecs.behaviors.defaultVariant,
        size: ButtonSplitSpecs.behaviors.defaultSize,
        shape: ButtonSplitSpecs.behaviors.defaultShape,
        iconType: ButtonSplitSpecs.behaviors.defaultIconType,
        leadingIcon: ButtonSplitSpecs.behaviors.defaultLeadingIcon,
        onMainClick: null,
        onTrailingClick: null,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
    };
}
