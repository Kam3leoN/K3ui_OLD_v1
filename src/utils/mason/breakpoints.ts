/**
 * @fileoverview Seuils responsives utilisés par le moteur Mason minimal de K3ui
 * @description Les classes de spans K3ui suivent un modèle :
 * - `s*` : base (sans media query dans `scss/mixins/layout.mixin.scss`)
 * - `m*` : media query `medium-and-up`
 * - `l*` : media query `large-and-up`
 * - `xl*` : media query `extra-large-and-up`
 *
 * Dans `scss/mixins/layout.mixin.scss`, `extra-large-and-up` utilise `tokens.$breakpoint-l`,
 * ce qui correspond à 1600px dans `scss/tokens/layout.token.scss`.
 */

/**
 * Préfixes de spans supportés (ce sont ceux générés par `layout.mixin.scss` pour K3ui).
 */
export type MasonSpanPrefix = 's' | 'm' | 'l' | 'xl';

/**
 * Seuils numériques (en pixels) pour basculer entre les préfixes `s/m/l/xl`.
 */
export const MasonK3uiBreakpointsPx = {
    /**
     * `m*` s'applique à partir de 840px (`tokens.$breakpoint-s` dans `layout.token.scss`)
     */
    m: 840,

    /**
     * `l*` s'applique à partir de 1200px (`tokens.$breakpoint-m` dans `layout.token.scss`)
     */
    l: 1200,

    /**
     * `xl*` s'applique à partir de 1600px (`tokens.$breakpoint-l` dans `layout.token.scss`)
     * @description Aligné avec `extra-large-and-up` dans `layout.mixin.scss`
     */
    xl: 1600,
} as const;

/**
 * Résout le préfixe “préféré” à partir de la largeur conteneur.
 *
 * @param containerWidth La largeur disponible (en pixels) pour le conteneur Masonry.
 * @returns Le préfixe de span à tenter en premier (`s`, `m`, `l` ou `xl`).
 */
export function getPreferredSpanPrefix(containerWidth: number): MasonSpanPrefix {
    if (containerWidth >= MasonK3uiBreakpointsPx.xl) return 'xl';
    if (containerWidth >= MasonK3uiBreakpointsPx.l) return 'l';
    if (containerWidth >= MasonK3uiBreakpointsPx.m) return 'm';
    return 's';
}

/**
 * Ordre de fallback pour sélectionner une valeur de span si le préfixe préféré n'est pas présent.
 *
 * @param preferred Préfixe préféré (résolu via `getPreferredSpanPrefix`)
 * @returns Une liste de préfixes à tenter, du plus spécifique au plus général.
 */
export function getSpanFallbackOrder(preferred: MasonSpanPrefix): MasonSpanPrefix[] {
    switch (preferred) {
        case 'xl':
            return ['xl', 'l', 'm', 's'];
        case 'l':
            return ['l', 'm', 's'];
        case 'm':
            return ['m', 's'];
        case 's':
        default:
            return ['s'];
    }
}

