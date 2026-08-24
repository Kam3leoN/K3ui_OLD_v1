/**
 * @fileoverview Couche Extensions K3UI
 * @description Métadonnées des modules optionnels (générateurs, effets, gestes).
 * Les classes sont chargées via deferred-component-loaders (chunks séparés).
 * L’API publique reste K.QrCode, K.Firework… ; K.Extensions est un namespace de découverte.
 */

export {
    EXTENSION_COMPONENT_NAMES,
    isExtensionComponent,
    type ExtensionComponentName,
} from '../config/components-registry';

/** Catégories logiques (documentation / navigation). */
export const EXTENSION_CATEGORIES = {
    generators: ['QrCode', 'BarCode', 'Signature'] as const,
    effects: ['Firework', 'Confetti', 'Snow', 'Halo', 'Holo', 'Gradient'] as const,
    gestures: ['SwipeDeck'] as const,
} as const;
