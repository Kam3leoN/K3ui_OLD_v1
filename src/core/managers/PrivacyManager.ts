/**
 * @fileoverview PrivacyManager pour K3UI
 * @description Gestion centralisée du consentement RGPD/vie privée et de l'inventaire des clés
 * de stockage (localStorage) utilisées par la bibliothèque. K3UI ne fait aucune analytics ni
 * tracking : ce manager sert uniquement à documenter/contrôler les écritures de préférences UI
 * (thème, langue, son, couleur dynamique) et les données utilisateur optionnelles (Todo).
 * @author K3UI Team
 * @version 1.0.0
 */

import { LoggerManager } from './LoggerManager';
import { storage } from '../../utils/storage/storage';
import type {
  PrivacyCategory,
  PrivacyConsentState,
  PrivacyKeyInfo,
  PrivacyManagerOptions,
} from '../../types/managers/privacy';

/**
 * Options par défaut
 */
const _defaults: PrivacyManagerOptions = {
  storageKey: 'k3ui-privacy-consent',
  onChange: null,
};

/**
 * Inventaire des clés localStorage connues, avec leur catégorie RGPD par défaut.
 * @description Les composants/managers hôtes peuvent enrichir cet inventaire via `registerKey()`.
 */
const _defaultKeyInventory: PrivacyKeyInfo[] = [
  { key: 'k3ui-theme', category: 'functional', description: 'Préférence de thème (clair/sombre/auto/système)' },
  { key: 'k3ui-locale', category: 'functional', description: 'Préférence de langue (locale)' },
  { key: 'k3ui-sound-enabled', category: 'functional', description: 'Activation des effets sonores UI' },
  { key: 'k3ui-dynamic-color', category: 'functional', description: 'Préférences de couleur dynamique Material (source, contraste, variante)' },
  { key: 'k3ui-dynamic-color-css-vars', category: 'functional', description: 'Cache anti-FOUC des variables CSS de couleur dynamique' },
  { key: 'k3ui-todo', category: 'optional', description: 'Contenu des listes de tâches (données saisies par l\'utilisateur)' },
  { key: 'k3ui-quote-daily', category: 'functional', description: 'Citation motivante du jour (préfixe de clé avec locale et date)' },
];

/**
 * Classe PrivacyManager pour gérer le consentement RGPD et l'inventaire des clés de stockage K3UI
 * @description Manager statique, sans dépendance à un élément DOM (pattern LocaleManager/ThemeManager)
 */
export class PrivacyManager {
  /** Logger pour le manager */
  private static logger: LoggerManager = LoggerManager.create('[PrivacyManager]', 'Manager');

  /** État d'initialisation */
  private static _initialized: boolean = false;

  /** Options de configuration */
  private static _options: PrivacyManagerOptions = { ..._defaults };

  /** Inventaire courant des clés connues (clé → info) */
  private static _keyInventory: Map<string, PrivacyKeyInfo> = new Map(
    _defaultKeyInventory.map((entry) => [entry.key, entry])
  );

  /** État de consentement en mémoire (chargé depuis le stockage à la demande) */
  private static _consent: PrivacyConsentState | null = null;

  /**
   * Obtient les options de configuration
   */
  static get options(): PrivacyManagerOptions {
    return { ...this._options };
  }

  /**
   * Initialise le gestionnaire de vie privée
   * @param options Options optionnelles (storageKey, onChange)
   */
  static init(options?: Partial<PrivacyManagerOptions>): void {
    if (this._initialized) {
      this.logger.warn('PrivacyManager already initialized');
      return;
    }

    if (options) {
      this._options = { ...this._options, ...options };
    }

    this.loadConsent();

    this._initialized = true;
    this.logger.info('PrivacyManager initialized');
  }

  /**
   * Charge l'état de consentement depuis le stockage (catégorie `essential`, toujours autorisée)
   */
  private static loadConsent(): void {
    try {
      this._consent = storage.get<PrivacyConsentState>(this._options.storageKey!) ?? {};
    } catch (error) {
      this.logger.warn('Error loading consent state:', error);
      this._consent = {};
    }
  }

  /**
   * S'assure que l'état de consentement a été chargé au moins une fois (lazy init pour les usages sans `init()`)
   */
  private static ensureLoaded(): void {
    if (this._consent === null) {
      this.loadConsent();
    }
  }

  /**
   * Sauvegarde l'état de consentement (catégorie `essential`, toujours autorisée)
   */
  private static saveConsent(): void {
    try {
      storage.set(this._options.storageKey!, this._consent ?? {});
    } catch (error) {
      this.logger.error('Error saving consent state:', error);
    }
  }

  /**
   * Vérifie si une catégorie a le consentement
   * @param category Catégorie RGPD à vérifier
   * @returns true si les écritures pour cette catégorie sont autorisées
   * @description Comportement par défaut (aucun `setConsent()` explicite) : `essential` et `functional`
   * sont autorisés (compatibilité rétroactive des apps existantes), `optional` est refusé (opt-in requis).
   */
  static hasConsent(category: PrivacyCategory): boolean {
    if (category === 'essential') {
      return true;
    }

    this.ensureLoaded();
    const explicit = this._consent?.[category];
    if (explicit !== undefined) {
      return explicit;
    }

    // Pas de préférence explicite : functional reste autorisé (défaut historique), optional est refusé.
    return category === 'functional';
  }

  /**
   * Définit le consentement pour une catégorie
   * @param category Catégorie RGPD concernée (`functional` ou `optional`)
   * @param granted true pour autoriser les écritures de cette catégorie, false pour les refuser
   */
  static setConsent(category: PrivacyCategory, granted: boolean): void {
    if (category === 'essential') {
      this.logger.warn('setConsent: la catégorie "essential" ne peut pas être modifiée');
      return;
    }

    this.ensureLoaded();
    this._consent = { ...this._consent, [category]: granted };
    this.saveConsent();

    if (!granted) {
      this.clearCategory(category);
    }

    if (this._options.onChange) {
      this._options.onChange(category, granted);
    }

    this.logger.info(`Consent for "${category}" set to: ${granted}`);
  }

  /**
   * Supprime du localStorage toutes les clés connues appartenant à une catégorie
   * @param category Catégorie RGPD à effacer (`functional` ou `optional`)
   */
  static clearCategory(category: PrivacyCategory): void {
    if (category === 'essential') {
      this.logger.warn('clearCategory: la catégorie "essential" ne peut pas être effacée');
      return;
    }

    this._keyInventory.forEach((info, key) => {
      if (info.category === category) {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          this.logger.warn(`Error clearing key "${key}":`, error);
        }
      }
    });
  }

  /**
   * Supprime du localStorage toutes les clés connues (functional + optional) ainsi que le consentement lui-même
   */
  static clearAll(): void {
    this.clearCategory('functional');
    this.clearCategory('optional');

    try {
      localStorage.removeItem(this._options.storageKey!);
    } catch (error) {
      this.logger.warn('Error clearing consent store:', error);
    }
    this._consent = {};
  }

  /**
   * Enregistre (ou met à jour) une clé dans l'inventaire de vie privée
   * @param key Clé de stockage
   * @param category Catégorie RGPD associée
   * @param description Description courte (optionnelle)
   * @description Permet aux applications hôtes de déclarer leurs propres clés localStorage pour bénéficier
   * de `canWrite()`/`clearCategory()`/`listKeys()` sans dupliquer la logique de consentement.
   */
  static registerKey(key: string, category: PrivacyCategory, description?: string): void {
    this._keyInventory.set(key, { key, category, description });
  }

  /**
   * Obtient la catégorie RGPD associée à une clé
   * @param key Clé de stockage
   * @returns La catégorie connue, ou `functional` par défaut pour une clé non inventoriée
   * (comportement conservateur qui préserve la compatibilité avec du code non gaté)
   */
  static getCategoryForKey(key: string): PrivacyCategory {
    return this._keyInventory.get(key)?.category ?? 'functional';
  }

  /**
   * Vérifie si une écriture localStorage est autorisée pour une clé donnée
   * @param key Clé de stockage à écrire
   * @returns true si l'écriture est autorisée selon le consentement de sa catégorie
   */
  static canWrite(key: string): boolean {
    return this.hasConsent(this.getCategoryForKey(key));
  }

  /**
   * Liste l'inventaire complet des clés de stockage connues avec leur catégorie
   * @returns Copie de l'inventaire des clés (clé, catégorie, description)
   */
  static listKeys(): PrivacyKeyInfo[] {
    return Array.from(this._keyInventory.values()).map((entry) => ({ ...entry }));
  }

  /**
   * Réinitialise le PrivacyManager à son état par défaut (utile pour les tests)
   */
  static reset(): void {
    this._options = { ..._defaults };
    this._keyInventory = new Map(_defaultKeyInventory.map((entry) => [entry.key, entry]));
    this._consent = null;
    this._initialized = false;
  }

  /**
   * Obtient les options par défaut
   */
  static get defaults(): PrivacyManagerOptions {
    return { ..._defaults };
  }

  /**
   * Nettoie les ressources (n'efface pas le consentement persisté)
   */
  static destroy(): void {
    this._initialized = false;
    this.logger.info('PrivacyManager destroyed');
  }
}
