/**
 * @fileoverview Gestionnaire d'options pour K3UI
 * @description Gestion centralisée des options avec merge profond
 * @author K3UI Team
 * @version 0.1.0
 */

import { BaseOptions } from '../../types/base';

/** Objet plat fusionnable (exclut types spéciaux non mergés en profondeur) */
type MergeableRecord = Record<string, unknown>;

/** Validateur de schéma pour une option */
export type OptionValidator = (value: unknown) => boolean;

const CALLBACK_KEYS: (keyof BaseOptions)[] = [
    'onOpenStart',
    'onOpenEnd',
    'onCloseStart',
    'onCloseEnd',
    'onEvent',
];

function isPlainMergeableObject(value: unknown): value is MergeableRecord {
    return (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        !(value instanceof Function) &&
        !(value instanceof Date) &&
        !(value instanceof RegExp) &&
        !(value instanceof HTMLElement)
    );
}

/**
 * Merge profond des options par défaut et des options utilisateur
 * @description Fusionne récursivement les objets d'options avec protection contre les références circulaires
 * @param defaults Options par défaut
 * @param overrides Options utilisateur (surchargent les défauts)
 * @param visited Set des objets déjà visités pour éviter les références circulaires
 * @returns Options fusionnées
 * @example
 * ```typescript
 * const defaults = { theme: 'light', size: { width: 100, height: 200 } };
 * const overrides = { size: { width: 150 } };
 * const merged = mergeOptions(defaults, overrides);
 * // Résultat: { theme: 'light', size: { width: 150, height: 200 } }
 * ```
 */
export function mergeOptions<T extends BaseOptions>(
    defaults: T,
    overrides: Partial<T> = {},
    visited: WeakSet<object> = new WeakSet()
): T {
    const result = { ...defaults } as MergeableRecord;
    const blockedKeys = new Set(['__proto__', 'prototype', 'constructor']);

    for (const key in overrides) {
        if (!Object.prototype.hasOwnProperty.call(overrides, key) || blockedKeys.has(key)) {
            continue;
        }
        const overrideValue = overrides[key as keyof T];

        if (overrideValue === undefined) {
            continue;
        }

        if (overrideValue === null) {
            result[key] = null;
        } else if (isPlainMergeableObject(overrideValue)) {
            if (visited.has(overrideValue)) {
                result[key] = overrideValue;
                continue;
            }

            visited.add(overrideValue);

            const defaultValue = result[key];
            if (isPlainMergeableObject(defaultValue)) {
                result[key] = mergeOptions(
                    defaultValue as BaseOptions,
                    overrideValue as Partial<BaseOptions>,
                    visited
                );
            } else {
                result[key] = { ...overrideValue };
            }
        } else {
            result[key] = overrideValue;
        }
    }

    return result as T;
}

/**
 * Valide les options d'un composant ou manager
 * @description Vérifie que les options sont valides selon le schéma attendu
 * @param options Options à valider
 * @param schema Schéma de validation (optionnel)
 * @returns true si les options sont valides
 */
export function validateOptions(
    options: BaseOptions,
    schema?: Record<string, OptionValidator>
): boolean {
    try {
        if (!options || typeof options !== 'object') {
            return false;
        }

        const opts = options as Record<string, unknown>;

        for (const key of CALLBACK_KEYS) {
            const value = opts[key];
            if (value !== undefined && value !== null && typeof value !== 'function') {
                console.warn(`[OptionHandler] Option ${key} must be a function or null`);
                return false;
            }
        }

        if (schema) {
            for (const [key, validator] of Object.entries(schema)) {
                const value = opts[key];
                if (value !== undefined && !validator(value)) {
                    console.warn(`[OptionHandler] Option ${key} failed validation`);
                    return false;
                }
            }
        }

        return true;
    } catch (error) {
        console.error('[OptionHandler] Error validating options:', error);
        return false;
    }
}

/**
 * Normalise les options en appliquant les valeurs par défaut
 * @description S'assure que toutes les options requises sont présentes
 * @param options Options à normaliser
 * @param defaults Options par défaut
 * @returns Options normalisées
 */
export function normalizeOptions<T extends BaseOptions>(
    options: Partial<T>,
    defaults: T
): T {
    return mergeOptions(defaults, options);
}

/**
 * Clone profond des options
 * @description Crée une copie profonde des options pour éviter les mutations
 * @param options Options à cloner
 * @returns Copie profonde des options
 */
export function cloneOptions<T extends BaseOptions>(options: T): T {
    return JSON.parse(JSON.stringify(options)) as T;
}
