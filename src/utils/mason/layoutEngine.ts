/**
 * @fileoverview Moteur Masonry minimal, encapsulé et testable
 * @description
 * Ce module calcule :
 * - l'assignation d'un `span` (ex: 6) à partir des classes K3ui (`s6`, `m6`, `l6`, `xl6`)
 * - des positions `(x, y)` et tailles `(width, height)` pour un layout Masonry basé sur des “colonnes logiques”
 *
 * Il ne touche jamais au DOM. La partie mesure / injection est faite par le composant `Mason`.
 */

import { getPreferredSpanPrefix, getSpanFallbackOrder, type MasonSpanPrefix } from './breakpoints';

/**
 * Input “pur” par item : hauteur mesurée et classes pour extraire le span.
 */
export interface MasonLayoutItemInput {
    /**
     * Index de l'item dans l'ordre rendu (ordre d'entrée).
     */
    index: number;
    /**
     * Liste de classes CSS sur l'item, utilisée pour extraire les spans `s* / m* / l* / xl*`.
     * @example ['col', 's12', 'm6', 'l4', 'xl3']
     */
    classNames: string[];
    /**
     * Hauteur mesurée en pixels.
     */
    height: number;
}

/**
 * Span résolu par préfixe (valeurs partiellement présentes).
 */
export type MasonResolvedSpansByPrefix = Partial<Record<MasonSpanPrefix, number>>;

/**
 * Résultat de calcul pour un item.
 */
export interface MasonResolvedItemPosition {
    /**
     * Index original de l'item.
     */
    index: number;
    /**
     * Span final résolu (1..columns).
     */
    span: number;
    /**
     * Position X (en pixels) relative au conteneur Masonry.
     */
    x: number;
    /**
     * Position Y (en pixels) relative au conteneur Masonry.
     */
    y: number;
    /**
     * Largeur calculée en pixels (basée sur `span`, `columns` et `gap`).
     */
    width: number;
    /**
     * Hauteur (en pixels) égale à celle de l'input.
     */
    height: number;
}

/**
 * Résultat global du layout.
 */
export interface MasonLayoutResult {
    /**
     * Hauteur du conteneur Masonry (en pixels).
     */
    containerHeight: number;
    /**
     * Positions et tailles calculées pour chaque item.
     */
    items: MasonResolvedItemPosition[];
    /**
     * Spans résolus pour chaque item (utile au debug/tests).
     */
    resolvedSpans: number[];
}

/**
 * Extrait les spans K3ui d'une liste de classes.
 *
 * Les spans attendus sont sous la forme :
 * - `s{n}`, `m{n}`, `l{n}`, `xl{n}` avec n en 1..columns.
 *
 * @param classNames Liste de classes CSS.
 * @param columns Nombre de colonnes logiques (sert au clamp).
 * @returns Un dictionnaire partiel `prefix -> span`.
 */
export function extractMasonSpansFromClassNames(
    classNames: string[],
    columns: number
): MasonResolvedSpansByPrefix {
    const spans: MasonResolvedSpansByPrefix = {};

    // Regex simple et déterministe : préfixe + nombre.
    // Note : on ne suppose pas de séparation par espaces; classNames est déjà un tableau.
    for (const cls of classNames) {
        const match = /^(s|m|l|xl)(\d{1,2})$/.exec(cls.trim());
        if (!match) continue;

        const prefix = match[1] as MasonSpanPrefix;
        const rawSpan = parseInt(match[2], 10);
        if (!Number.isFinite(rawSpan)) continue;

        const clamped = Math.max(1, Math.min(columns, rawSpan));
        spans[prefix] = clamped;
    }

    return spans;
}

/**
 * Résout le span final d'un item pour une largeur conteneur donnée.
 *
 * @param spans Par préfixe (ex: { m: 6, l: 4 }).
 * @param containerWidth Largeur conteneur en pixels.
 * @param fallbackSpan Span à utiliser si aucun span compatible n'est présent.
 * @param columns Nombre de colonnes logiques (sert au clamp final).
 * @returns Span résolu (1..columns).
 */
export function resolveMasonSpanForWidth(
    spans: MasonResolvedSpansByPrefix,
    containerWidth: number,
    fallbackSpan: number,
    columns: number
): number {
    const preferred = getPreferredSpanPrefix(containerWidth);
    const fallbackOrder = getSpanFallbackOrder(preferred);

    for (const prefix of fallbackOrder) {
        const v = spans[prefix];
        if (typeof v === 'number' && Number.isFinite(v)) {
            return Math.max(1, Math.min(columns, v));
        }
    }

    return Math.max(1, Math.min(columns, fallbackSpan));
}

/**
 * Calcule un layout Masonry minimal pour items “span-based”.
 *
 * L'algorithme :
 * - on maintient un `columnHeights[]` pour 12 colonnes logiques
 * - chaque item occupe `span` colonnes consécutives
 * - l'item est placé au `y` qui minimise la hauteur maximale des colonnes couvertes
 *
 * @param params Paramètres de calcul.
 * @returns Résultat déterministe (sans effets de bord).
 */
export function computeMasonryLayout(params: {
    containerWidth: number;
    gap: number;
    columns: number;
    fallbackSpan: number;
    /**
     * Base de lecture des spans K3ui dans les classes `s* / m* / l* / xl*`.
     * Par défaut : 12 (K3ui).
     *
     * Si `columns` diffère de `spanBaseColumns`, on convertit le span lue
     * (ex: m6 = 6/12) vers un span effectif (ex: 9/18).
     */
    spanBaseColumns?: number;
    items: MasonLayoutItemInput[];
}): MasonLayoutResult {
    const { containerWidth, gap, columns, fallbackSpan, items, spanBaseColumns } = params;

    const safeColumns = Math.max(1, Math.floor(columns));
    // Si `spanBaseColumns` n'est pas fourni, on se comporte comme l'implémentation historique :
    // les spans `s*/m*/l*/xl*` sont interprétés comme étant directement dans l'espace `columns`.
    const safeSpanBaseColumns = Math.max(1, Math.floor(spanBaseColumns ?? columns));
    const safeGap = Math.max(0, gap);
    const safeContainerWidth = Math.max(0, containerWidth);

    if (!items || items.length === 0) {
        return {
            containerHeight: 0,
            items: [],
            resolvedSpans: [],
        };
    }

    // Largeur d'une colonne logique (en tenant compte du gap entre colonnes).
    const totalGapWidth = safeGap * (safeColumns - 1);
    const colWidthRaw = (safeContainerWidth - totalGapWidth) / safeColumns;
    const colWidth = Math.max(0, colWidthRaw);

    const columnHeights: number[] = Array.from({ length: safeColumns }, () => 0);
    const resolvedItems: MasonResolvedItemPosition[] = [];
    const resolvedSpans: number[] = [];

    for (const item of items) {
        // 1) Span en "unités base" (ex: m6 = 6/12)
        const spans = extractMasonSpansFromClassNames(item.classNames, safeSpanBaseColumns);
        const spanBaseResolved = resolveMasonSpanForWidth(
            spans,
            safeContainerWidth,
            fallbackSpan,
            safeSpanBaseColumns
        );

        // 2) Conversion vers le nombre de colonnes cible
        const scaledSpan = spanBaseResolved * safeColumns / safeSpanBaseColumns;
        const clampedSpan = Math.max(1, Math.min(safeColumns, Math.round(scaledSpan)));

        // Les start columns possibles
        const maxStart = safeColumns - clampedSpan;
        let bestStart = 0;
        let bestY = Number.POSITIVE_INFINITY;

        for (let start = 0; start <= maxStart; start++) {
            let y = 0;
            for (let c = start; c < start + clampedSpan; c++) {
                y = Math.max(y, columnHeights[c]);
            }

            if (y < bestY) {
                bestY = y;
                bestStart = start;
            } else if (y === bestY) {
                // Tie-breaker stable : start le plus petit.
                if (start < bestStart) bestStart = start;
            }
        }

        const x = bestStart * (colWidth + safeGap);
        const width = clampedSpan * colWidth + (clampedSpan - 1) * safeGap;
        const y = bestY;

        resolvedItems.push({
            index: item.index,
            span: clampedSpan,
            x,
            y,
            width,
            height: Math.max(0, item.height),
        });
        resolvedSpans[item.index] = clampedSpan;

        // Mettre à jour les hauteurs des colonnes couvertes.
        const nextHeight = y + Math.max(0, item.height) + safeGap;
        for (let c = bestStart; c < bestStart + clampedSpan; c++) {
            columnHeights[c] = nextHeight;
        }
    }

    const maxColumnHeight = Math.max(...columnHeights);
    // On enlève un dernier gap pour éviter un espace “extra” en bas.
    const containerHeight = Math.max(0, maxColumnHeight - (items.length > 0 ? safeGap : 0));

    return {
        containerHeight,
        items: resolvedItems,
        resolvedSpans,
    };
}

export interface MasonLayoutPartialResult extends MasonLayoutResult {
    /**
     * Hauteurs finales des colonnes logiques après placement des items de ce run.
     * Permet de chaîner des layouts (ex: visible puis caché) sans que les items cachés
     * influencent le placement des items visibles.
     */
    finalColumnHeights: number[];
}

/**
 * Variante de `computeMasonryLayout` qui permet de partir d'un état initial des hauteurs de colonnes.
 * Utile pour enchaîner des placements (visible puis caché) afin d'améliorer la cohérence FLIP.
 */
export function computeMasonryLayoutWithInitialColumnHeights(params: {
    containerWidth: number;
    gap: number;
    columns: number;
    fallbackSpan: number;
    spanBaseColumns?: number;
    items: MasonLayoutItemInput[];
    /**
     * Si présent, doit contenir au moins `columns` entrées (ou sera clampé).
     * Si non fourni, les hauteurs démarrent à 0.
     */
    initialColumnHeights?: number[];
}): MasonLayoutPartialResult {
    const { containerWidth, gap, columns, fallbackSpan, items, spanBaseColumns, initialColumnHeights } = params;

    const safeColumns = Math.max(1, Math.floor(columns));
    const safeSpanBaseColumns = Math.max(1, Math.floor(spanBaseColumns ?? columns));
    const safeGap = Math.max(0, gap);
    const safeContainerWidth = Math.max(0, containerWidth);

    const resolvedSpans: number[] = [];

    if (!items || items.length === 0) {
        const baseHeights =
            initialColumnHeights && initialColumnHeights.length > 0
                ? Array.from({ length: safeColumns }, (_, i) => Number.isFinite(initialColumnHeights[i]) ? initialColumnHeights[i] : 0)
                : Array.from({ length: safeColumns }, () => 0);

        return {
            containerHeight: 0,
            items: [],
            resolvedSpans,
            finalColumnHeights: baseHeights,
        };
    }

    // Largeur d'une colonne logique (en tenant compte du gap entre colonnes).
    const totalGapWidth = safeGap * (safeColumns - 1);
    const colWidthRaw = (safeContainerWidth - totalGapWidth) / safeColumns;
    const colWidth = Math.max(0, colWidthRaw);

    const columnHeights: number[] = Array.from({ length: safeColumns }, (_, i) => {
        if (!initialColumnHeights || initialColumnHeights.length === 0) return 0;
        const v = initialColumnHeights[i];
        return Number.isFinite(v) ? v : 0;
    });

    const resolvedItems: MasonResolvedItemPosition[] = [];

    for (const item of items) {
        // 1) Span en "unités base" (ex: m6 = 6/12)
        const spans = extractMasonSpansFromClassNames(item.classNames, safeSpanBaseColumns);
        const spanBaseResolved = resolveMasonSpanForWidth(
            spans,
            safeContainerWidth,
            fallbackSpan,
            safeSpanBaseColumns
        );

        // 2) Conversion vers le nombre de colonnes cible
        const scaledSpan = spanBaseResolved * safeColumns / safeSpanBaseColumns;
        const clampedSpan = Math.max(1, Math.min(safeColumns, Math.round(scaledSpan)));

        // Les start columns possibles
        const maxStart = safeColumns - clampedSpan;
        let bestStart = 0;
        let bestY = Number.POSITIVE_INFINITY;

        for (let start = 0; start <= maxStart; start++) {
            let y = 0;
            for (let c = start; c < start + clampedSpan; c++) {
                y = Math.max(y, columnHeights[c]);
            }

            if (y < bestY) {
                bestY = y;
                bestStart = start;
            } else if (y === bestY) {
                // Tie-breaker stable : start le plus petit.
                if (start < bestStart) bestStart = start;
            }
        }

        const x = bestStart * (colWidth + safeGap);
        const width = clampedSpan * colWidth + (clampedSpan - 1) * safeGap;
        const y = bestY;

        resolvedItems.push({
            index: item.index,
            span: clampedSpan,
            x,
            y,
            width,
            height: Math.max(0, item.height),
        });

        resolvedSpans[item.index] = clampedSpan;

        // Mettre à jour les hauteurs des colonnes couvertes.
        const nextHeight = y + Math.max(0, item.height) + safeGap;
        for (let c = bestStart; c < bestStart + clampedSpan; c++) {
            columnHeights[c] = nextHeight;
        }
    }

    const maxColumnHeight = Math.max(...columnHeights);
    const containerHeight = Math.max(0, maxColumnHeight - (items.length > 0 ? safeGap : 0));

    return {
        containerHeight,
        items: resolvedItems,
        resolvedSpans,
        finalColumnHeights: columnHeights,
    };
}

