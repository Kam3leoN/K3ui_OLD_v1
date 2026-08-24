/**
 * @fileoverview Spécifications du composant ListMaker K3UI
 * @description Liste à marqueur pill (Material Design 3 Expressive)
 * @author K3UI Team
 * @version 1.0.0
 */

import type { ListMakerOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Géométrie marqueur = ButtonIcon XS narrow (28×48).
 * @see scss/tokens/button-icon.token.scss
 */
export const LIST_MAKER_MARKER_WIDTH_PX = 28;
export const LIST_MAKER_MARKER_HEIGHT_PX = 48;

/** Rotation pour l’orientation horizontal (XS narrow → paysage, pas de wide). */
export const LIST_MAKER_HORIZONTAL_ROTATION_DEG = 90;

/** Padding horizontal du marqueur (px) — XS narrow fixe, contenu centré. */
export const LIST_MAKER_PAD_X = 0;

/** Facteur d’échelle typographique. */
export const LIST_MAKER_TEXT_SCALE = 1.1;

/**
 * Échelles typo / gaps (le pill reste XS narrow ; seule la typo de libellé varie).
 */
export const LIST_MAKER_SIZES = {
  small: { fs: 11, label: 13, gap: 12, row: 4 },
  medium: { fs: 12, label: 14, gap: 16, row: 4 },
  large: { fs: 14, label: 16, gap: 16, row: 4 },
} as const;

/**
 * Spécifications du composant ListMaker
 */
export const ListMakerSpecs = {
  behaviors: {
    defaultVariant: 'filled' as const,
    defaultSize: 'medium' as const,
    defaultOrientation: 'vertical' as const,
  },

  sizes: LIST_MAKER_SIZES,

  geometry: {
    /** Largeur ButtonIcon XS narrow */
    markerWidthPx: LIST_MAKER_MARKER_WIDTH_PX,
    /** Hauteur ButtonIcon XS narrow */
    markerHeightPx: LIST_MAKER_MARKER_HEIGHT_PX,
    horizontalRotationDeg: LIST_MAKER_HORIZONTAL_ROTATION_DEG,
    padX: LIST_MAKER_PAD_X,
    textScale: LIST_MAKER_TEXT_SCALE,
    /** Taille glyphe marqueur (proche icon-button XS 20dp). */
    markerFontSizePx: 12,
  },

  accessibility: {
    role: 'list' as const,
  },
} as const;

/**
 * Extrait les valeurs par défaut pour ListMaker
 * @returns Options par défaut
 */
export function getListMakerDefaults(): ListMakerOptions {
  return {
    priorityLevel: PriorityLevel.MEDIUM,
    variant: ListMakerSpecs.behaviors.defaultVariant,
    size: ListMakerSpecs.behaviors.defaultSize,
    orientation: ListMakerSpecs.behaviors.defaultOrientation,
    onOpenStart: null,
    onOpenEnd: null,
    onCloseStart: null,
    onCloseEnd: null,
  };
}
