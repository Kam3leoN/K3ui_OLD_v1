/**
 * @fileoverview Moteur pur de filtrage IsoFilter (sans DOM).
 *
 * L'objectif : à partir d'une liste d'items (id + tags) et d'une valeur de filtre,
 * retourner l'ensemble des IDs visibles.
 */

/**
 * Données de filtrage pour un item.
 */
export interface IsoFilterSourceItem {
    /**
     * Identifiant unique de l'item.
     */
    id: string;
    /**
     * Liste de tags (déjà tokenisés côté composant).
     */
    tags: string[];
}

/**
 * Options de matching pour un filtre.
 */
export interface IsoFilterEngineOptions {
    /**
     * Valeur signifiant "afficher tout".
     */
    allFilterValue: string;
    /**
     * Mode de matching pour un filtre contenant plusieurs tags.
     */
    matchMode: 'any' | 'all';
    /**
     * Fallback : si aucun item ne matche et que filter n'est pas `all`,
     * afficher tout (true) ou rien (false).
     */
    fallbackToAllOnNoMatch: boolean;
}

/**
 * Tokenise une chaîne en tags séparés par espaces.
 * @param value String brute (ex: "red blue")
 */
export function tokenizeTags(value: string): string[] {
    return value
        .trim()
        .split(/\s+/g)
        .filter(Boolean);
}

/**
 * Calcule les IDs visibles selon un filtre.
 *
 * Règles :
 * - si `filterValue` == `allFilterValue` (ou vide) => tous visibles
 * - sinon :
 *   - si matchMode == 'any' => intersection non vide entre tags du filtre et tags de l'item
 *   - si matchMode == 'all' => tous les tags du filtre doivent être présents
 * - si résultat vide :
 *   - fallbackToAllOnNoMatch ? tous : aucun
 *
 * @param items Liste d'items sources.
 * @param filterValue Valeur de filtre (un tag ou plusieurs tags séparés par espaces).
 * @param options Options de matching.
 */
export function computeVisibleIds(params: {
    items: IsoFilterSourceItem[];
    filterValue: string;
    options: IsoFilterEngineOptions;
}): string[] {
    const { items, filterValue, options } = params;

    const raw = filterValue ?? '';
    const filter = raw.trim();

    const all = filter.length === 0 || filter === options.allFilterValue;
    if (all) {
        return items.map(it => it.id);
    }

    const filterTags = tokenizeTags(filter);
    const visible: string[] = [];

    for (const item of items) {
        const itemTags = new Set(item.tags);
        if (options.matchMode === 'all') {
            const ok = filterTags.every(t => itemTags.has(t));
            if (ok) visible.push(item.id);
        } else {
            // any
            const ok = filterTags.some(t => itemTags.has(t));
            if (ok) visible.push(item.id);
        }
    }

    if (visible.length === 0 && options.fallbackToAllOnNoMatch) {
        return items.map(it => it.id);
    }

    return visible;
}

