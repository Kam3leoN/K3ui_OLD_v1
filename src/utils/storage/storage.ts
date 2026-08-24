/**
 * @file storage.ts
 * @description Utilitaire de persistance pour localStorage/sessionStorage
 * @author K3UI
 * @version 1.0.0
 */

export class StorageUtil {
  /**
   * Sauvegarde une valeur dans localStorage
   * @param key Clé de stockage
   * @param value Valeur sérialisable en JSON
   */
  static set(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      // Optionnel : gestion d'erreur
    }
  }

  /**
   * Récupère une valeur depuis localStorage
   * @param key Clé de stockage
   * @param defaultValue Valeur par défaut si absente ou invalide
   */
  static get<T = unknown>(key: string, defaultValue?: T): T | null {
    try {
      const value = localStorage.getItem(key);
      if (value === null) return defaultValue ?? null;
      return JSON.parse(value) as T;
    } catch (e) {
      return defaultValue ?? null;
    }
  }

  /**
   * Supprime une clé du localStorage
   * @param key Clé à supprimer
   */
  static remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) { }
  }
}

/**
 * Objet storage avec les méthodes utilitaires
 */
export const storage = {
  set: StorageUtil.set,
  get: StorageUtil.get,
  remove: StorageUtil.remove,
};
