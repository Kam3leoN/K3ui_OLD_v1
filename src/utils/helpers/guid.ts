/**
 * @fileoverview Helpers pour la génération d'identifiants uniques
 * @description Fonctions utilitaires pour générer des GUIDs et IDs
 * @author K3UI Team
 * @version 1.0.0
 */

/**
 * Génère un identifiant unique (GUID)
 * @returns Identifiant unique sous forme de chaîne
 * @example
 * ```typescript
 * const id = generateGuid();
 * // Résultat: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 * ```
 */
export function generateGuid(): string {
    const s4 = (): string => {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    };
    return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}

/**
 * Génère un ID court et unique
 * @param prefix - Préfixe optionnel pour l'ID
 * @returns ID court unique
 * @example
 * ```typescript
 * const id = generateShortId('btn');
 * // Résultat: "btn_abc123"
 * ```
 */
export function generateShortId(prefix: string = ''): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}

