/**
 * @fileoverview Métadonnées transverses pour la famille Effects K3UI
 * @author K3UI Team
 * @version 1.0.0
 */

/**
 * Métadonnées communes aux composants d'effets visuels (Flip, Holo, Tilt, Halo)
 */
export interface EffectComponentMeta {
    /** L'effet est entièrement piloté par CSS (sans JS runtime d'animation) */
    cssOnly: boolean;
    /** Peut envelopper un élément enfant via wrapper */
    supportsWrapper: boolean;
    /** Supporte un attribut data-* pour auto-init (ex. data-halo, data-holo) */
    supportsDataAttribute: boolean;
    /** Expose un custom element k3ui-* */
    supportsCustomElement: boolean;
    /** Respecte prefers-reduced-motion / k3ui-motion-changed */
    respectsReducedMotion: boolean;
}
