/**
 * @fileoverview Helpers pour la manipulation de tableaux
 * @description Fonctions utilitaires pour remplacer, supprimer ou insérer des éléments par index (tableaux immuables)
 * @author K3UI Team
 * @version 1.0.0
 */

/**
 * Remplace un élément à un index donné sans muter le tableau original.
 * Si l'index est hors bornes, retourne une copie du tableau.
 * @param arr - Tableau source
 * @param index - Index de l'élément à remplacer (0-based)
 * @param newValue - Nouvelle valeur
 * @returns Nouveau tableau avec l'élément remplacé
 * @example
 * ```typescript
 * const arr = [1, 2, 3];
 * replaceItemAtIndex(arr, 1, 99); // [1, 99, 3]
 * replaceItemAtIndex(arr, 10, 99); // [1, 2, 3] (index hors borne)
 * ```
 */
export function replaceItemAtIndex<T>(arr: T[], index: number, newValue: T): T[] {
  if (!Array.isArray(arr) || index < 0 || index >= arr.length) {
    return [...arr]
  }
  return [...arr.slice(0, index), newValue, ...arr.slice(index + 1)]
}

/**
 * Supprime un élément à un index donné sans muter le tableau original.
 * Si l'index est hors bornes, retourne une copie du tableau.
 * @param arr - Tableau source
 * @param index - Index de l'élément à supprimer (0-based)
 * @returns Nouveau tableau sans l'élément à l'index
 * @example
 * ```typescript
 * const arr = [1, 2, 3];
 * removeItemAtIndex(arr, 1); // [1, 3]
 * removeItemAtIndex(arr, 10); // [1, 2, 3] (index hors borne)
 * ```
 */
export function removeItemAtIndex<T>(arr: T[], index: number): T[] {
  if (!Array.isArray(arr) || index < 0 || index >= arr.length) {
    return [...arr]
  }
  return [...arr.slice(0, index), ...arr.slice(index + 1)]
}

/**
 * Insère un élément à un index donné sans muter le tableau original.
 * Si l'index est hors bornes, l'élément est ajouté en début (index &lt; 0) ou en fin (index &gt; length).
 * @param arr - Tableau source
 * @param index - Index où insérer (0-based)
 * @param value - Valeur à insérer
 * @returns Nouveau tableau avec l'élément inséré
 * @example
 * ```typescript
 * const arr = [1, 2, 3];
 * insertItemAtIndex(arr, 1, 99); // [1, 99, 2, 3]
 * insertItemAtIndex(arr, 0, 0);  // [0, 1, 2, 3]
 * insertItemAtIndex(arr, 10, 4); // [1, 2, 3, 4]
 * ```
 */
export function insertItemAtIndex<T>(arr: T[], index: number, value: T): T[] {
  if (!Array.isArray(arr)) {
    return [value]
  }
  const safeIndex = Math.max(0, Math.min(index, arr.length))
  return [...arr.slice(0, safeIndex), value, ...arr.slice(safeIndex)]
}
