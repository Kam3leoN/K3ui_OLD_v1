/**
 * @fileoverview Types pour le PrivacyManager K3UI
 * @description Catégories RGPD, inventaire des clés de stockage et options de consentement
 * @author K3UI Team
 * @version 1.0.0
 */

/**
 * Catégories de confidentialité RGPD utilisées par K3UI.
 * - `essential` : nécessaire au fonctionnement du site (ex. mémorisation du consentement lui-même). Toujours autorisé.
 * - `functional` : confort utilisateur (thème, langue, son, couleur dynamique…). Autorisé par défaut pour rester
 *   compatible avec les applications existantes qui n'appellent jamais `setConsent()`.
 * - `optional` : données non essentielles à l'usage du composant (ex. contenu du Todo). Refusé par défaut, nécessite
 *   un opt-in explicite via `setConsent('optional', true)`.
 */
export type PrivacyCategory = 'essential' | 'functional' | 'optional';

/**
 * Entrée d'inventaire décrivant une clé de stockage (localStorage) connue de K3UI.
 */
export interface PrivacyKeyInfo {
  /** Clé de stockage (localStorage) */
  key: string;
  /** Catégorie RGPD associée à la clé */
  category: PrivacyCategory;
  /** Description courte de l'usage de la clé (documentation/audit) */
  description?: string;
}

/**
 * État de consentement persisté. Seules les catégories explicitement définies par `setConsent()`
 * sont présentes ; l'absence d'entrée signifie « valeur par défaut » (voir `PrivacyCategory`).
 */
export type PrivacyConsentState = Partial<Record<PrivacyCategory, boolean>>;

/**
 * Options du PrivacyManager
 */
export interface PrivacyManagerOptions {
  /** Clé de stockage utilisée pour persister l'état de consentement lui-même (catégorie `essential`) */
  storageKey?: string;
  /** Callback appelé après chaque changement de consentement */
  onChange?: ((category: PrivacyCategory, granted: boolean) => void) | null;
}
