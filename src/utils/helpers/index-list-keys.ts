/**
 * @fileoverview Utilitaires de clés pour IndexList (annuaire)
 * @description Ordre # → symboles → chiffres → A–Z ; résolution depuis un libellé
 */

/** Symboles prioritaires avant les chiffres */
export const INDEX_LIST_SYMBOL_KEYS = ['#', '-', '_', '—', ' '] as const;

/** Chiffres 0–9 */
export const INDEX_LIST_DIGIT_KEYS = '0123456789'.split('');

/** Lettres A–Z */
export const INDEX_LIST_LETTER_KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/** Ordre canonique des groupes IndexList */
export const INDEX_LIST_KEY_ORDER: readonly string[] = [
    ...INDEX_LIST_SYMBOL_KEYS,
    ...INDEX_LIST_DIGIT_KEYS,
    ...INDEX_LIST_LETTER_KEYS,
];

const KEY_ORDER_MAP: ReadonlyMap<string, number> = new Map(
    INDEX_LIST_KEY_ORDER.map((key, index) => [key, index]),
);

/** Map clé → identifiant de section DOM (sans préfixe) */
const KEY_TO_SLUG: Readonly<Record<string, string>> = {
    '#': 'hash',
    '-': 'dash',
    '_': 'underscore',
    '—': 'emdash',
    ' ': 'space',
};

/**
 * Normalise le premier caractère d'un libellé en clé de groupe IndexList
 * @param label Texte source (nom, titre…)
 * @param locale Locale pour la casse (uppercase annuaire)
 * @returns Clé de groupe (#, -, 0–9, A–Z…)
 */
export function resolveIndexKeyFromLabel(label: string, locale = 'fr-FR'): string {
    const trimmed = label.trim();
    if (!trimmed) {
        return '#';
    }

    const first = trimmed.charAt(0);

    if (first === '-') {
        return '-';
    }
    if (first === '_') {
        return '_';
    }
    if (first === '—' || first === '–') {
        return '—';
    }
    if (first === ' ') {
        return ' ';
    }

    const upper = first.toLocaleUpperCase(locale);
    if (upper >= 'A' && upper <= 'Z') {
        return upper;
    }
    if (upper >= '0' && upper <= '9') {
        return upper;
    }

    return '#';
}

/**
 * Compare deux clés selon l'ordre annuaire
 * @param a Première clé
 * @param b Seconde clé
 * @returns Résultat compatible Array.sort
 */
export function compareIndexKeys(a: string, b: string): number {
    const orderA = KEY_ORDER_MAP.get(a) ?? Number.MAX_SAFE_INTEGER;
    const orderB = KEY_ORDER_MAP.get(b) ?? Number.MAX_SAFE_INTEGER;
    return orderA - orderB;
}

/**
 * Trie un tableau de clés selon l'ordre annuaire
 * @param keys Clés à trier
 * @returns Nouveau tableau trié
 */
export function sortIndexKeys(keys: string[]): string[] {
    return [...keys].sort(compareIndexKeys);
}

/**
 * Identifiant DOM stable pour une section (`index-list-a`, `index-list-hash`…)
 * @param key Clé de groupe
 * @returns id HTML sans collision sur les caractères spéciaux
 */
export function indexKeyToSectionId(key: string): string {
    const slug = KEY_TO_SLUG[key] ?? key.toLowerCase();
    return `index-list-${slug}`;
}

/**
 * Libellé court affiché dans le rail / header
 * @param key Clé de groupe
 * @returns Caractère ou symbole visible
 */
export function indexKeyToDisplayLabel(key: string): string {
    if (key === ' ') {
        return '·';
    }
    return key;
}

/**
 * Libellé accessible pour une clé de rail
 * @param key Clé de groupe
 * @param sectionLabel Libellé i18n « Section {key} »
 * @returns Texte pour aria-label
 */
export function indexKeyToAriaLabel(key: string, sectionLabel: string): string {
    const names: Record<string, string> = {
        '#': 'symboles',
        '-': 'tiret',
        '_': 'underscore',
        '—': 'tiret cadratin',
        ' ': 'espace',
    };
    const name = names[key] ?? key;
    return sectionLabel.replace('{key}', name);
}
