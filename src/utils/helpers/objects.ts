/**
 * @fileoverview Helpers pour la manipulation d'objets
 * @description Fonctions utilitaires pour merge, validation et manipulation d'objets
 * @author K3UI Team
 * @version 1.0.0
 */

type StringKeyedRecord = Record<string, unknown>;

function isNestedMergeable(value: unknown): value is StringKeyedRecord {
    return typeof value === 'object' && value !== null && !Array.isArray(value) && typeof value !== 'function';
}

/**
 * Merge profond d'objets génériques
 * @description Fusionne récursivement deux objets de manière profonde
 * @param target Objet cible (valeurs par défaut)
 * @param source Objet source (valeurs qui surchargent)
 * @returns Objet fusionné
 * @example
 * ```typescript
 * const target = { theme: 'light', size: { width: 100, height: 200 } };
 * const source = { size: { width: 150 } };
 * const merged = deepMerge(target, source);
 * // Résultat: { theme: 'light', size: { width: 150, height: 200 } }
 * ```
 */
export function deepMerge<T extends StringKeyedRecord>(
    target: T,
    source: Partial<T> = {}
): T {
    const result: StringKeyedRecord = { ...target };

    for (const key in source) {
        const sourceValue = source[key];
        if (sourceValue !== undefined && sourceValue !== null) {
            if (isNestedMergeable(sourceValue)) {
                const targetValue = result[key];
                result[key] = deepMerge(
                    isNestedMergeable(targetValue) ? targetValue : {},
                    sourceValue
                );
            } else {
                result[key] = sourceValue;
            }
        }
    }

    return result as T;
}

/**
 * Clone profond d'un objet
 * @param obj - Objet à cloner
 * @returns Objet cloné
 * @example
 * ```typescript
 * const original = { a: { b: 1 } };
 * const cloned = deepClone(original);
 * cloned.a.b = 2;
 * console.log(original.a.b); // 1
 * ```
 */
export function deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (obj instanceof Date) {
        return new Date(obj.getTime()) as T;
    }

    if (Array.isArray(obj)) {
        return obj.map((item) => deepClone(item)) as T;
    }

    const clonedObj = {} as Record<string, unknown>;
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            clonedObj[key] = deepClone((obj as Record<string, unknown>)[key]);
        }
    }
    return clonedObj as T;
}

/**
 * Vérifie si un objet est vide
 * @param obj - Objet à vérifier
 * @returns true si l'objet est vide
 * @example
 * ```typescript
 * isEmpty({}); // true
 * isEmpty({ a: 1 }); // false
 * ```
 */
export function isEmpty(obj: unknown): boolean {
    if (obj == null) return true;
    if (typeof obj === 'string') return obj.length === 0;
    if (Array.isArray(obj)) return obj.length === 0;
    if (typeof obj === 'object') return Object.keys(obj).length === 0;
    return false;
}

/**
 * Obtient une valeur imbriquée d'un objet en utilisant une clé pointée
 * @param obj - Objet source
 * @param path - Chemin vers la propriété (ex: 'user.profile.name')
 * @param defaultValue - Valeur par défaut si la propriété n'existe pas
 * @returns Valeur trouvée ou valeur par défaut
 * @example
 * ```typescript
 * const obj = { user: { profile: { name: 'John' } } };
 * getNestedValue(obj, 'user.profile.name'); // 'John'
 * getNestedValue(obj, 'user.age', 25); // 25
 * ```
 */
export function getNestedValue<T = unknown>(
    obj: unknown,
    path: string,
    defaultValue?: T
): T {
    const keys = path.split('.');
    let current: unknown = obj;

    for (const key of keys) {
        if (current == null || typeof current !== 'object') {
            return defaultValue as T;
        }
        current = (current as StringKeyedRecord)[key];
    }

    return current !== undefined ? (current as T) : (defaultValue as T);
}
