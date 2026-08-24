/**
 * @fileoverview LocaleManager pour K3UI
 * @description Gestion de la locale et des traductions (fr-FR, en-US)
 * @author K3UI Team
 * @version 1.0.0
 */

import { LoggerManager } from './LoggerManager';
import { PrivacyManager } from './PrivacyManager';
import type { LocaleCode, LocaleManagerOptions, Translations } from '../../types/managers/locale';
import { frFR } from '../../i18n/fr-FR';
import { enUS } from '../../i18n/en-US';

/**
 * Options par défaut
 */
const _defaults: LocaleManagerOptions = {
  locale: 'fr-FR',
  fallbackLocale: 'en-US',
  storageKey: 'k3ui-locale',
  savePreference: true,
  onChange: null,
};

/** Dictionnaires par code locale */
const _dictionaries: Record<LocaleCode, Translations> = {
  'fr-FR': frFR,
  'en-US': enUS,
};

/**
 * Classe LocaleManager pour gérer la locale et les traductions
 */
export class LocaleManager {
  /** Logger pour le manager */
  private static logger: LoggerManager = LoggerManager.create('[LocaleManager]', 'Manager');

  /** État d'initialisation */
  private static _initialized: boolean = false;

  /** Options de configuration */
  private static _options: LocaleManagerOptions = { ..._defaults };

  /** Locale courante */
  private static _currentLocale: LocaleCode = _defaults.locale!;

  /**
   * Obtient la locale courante
   */
  static get currentLocale(): LocaleCode {
    return this._currentLocale;
  }

  /**
   * Obtient les options de configuration
   */
  static get options(): LocaleManagerOptions {
    return { ...this._options };
  }

  /**
   * Initialise le LocaleManager
   * @param options Options optionnelles (locale, fallbackLocale, storageKey, savePreference, onChange)
   */
  static init(options?: Partial<LocaleManagerOptions>): void {
    if (this._initialized) {
      this.logger.warn('LocaleManager already initialized');
      return;
    }

    if (options) {
      this._options = { ...this._options, ...options };
    }

    this._currentLocale = this._options.locale ?? _defaults.locale!;
    if (options?.locale === undefined) {
      this.restorePreference();
    }

    this._initialized = true;
    this.logger.info(`LocaleManager initialized with locale: ${this._currentLocale}`);
  }

  /**
   * Traduit une clé au format namespace.key (ex. pagination.previous)
   * @param key Clé de traduction (namespace.key)
   * @returns Chaîne traduite ou la clé si non trouvée
   */
  static t(key: string): string {
    const dot = key.indexOf('.');
    if (dot === -1) {
      this.logger.warn(`LocaleManager.t: invalid key format "${key}", expected "namespace.key"`);
      return key;
    }
    const namespace = key.slice(0, dot) as keyof Translations;
    const suffix = key.slice(dot + 1);

    const dict = _dictionaries[this._currentLocale];
    const ns = dict?.[namespace] as unknown as Record<string, string> | undefined;
    if (ns && typeof ns[suffix] === 'string') {
      return ns[suffix];
    }

    const fallbackDict = _dictionaries[this._options.fallbackLocale ?? 'en-US'];
    const fallbackNs = fallbackDict?.[namespace] as unknown as Record<string, string> | undefined;
    if (fallbackNs && typeof fallbackNs[suffix] === 'string') {
      return fallbackNs[suffix];
    }

    return key;
  }

  /**
   * Définit la locale courante
   * @param locale Code de locale (fr-FR | en-US)
   */
  static setLocale(locale: LocaleCode): void {
    if (!_dictionaries[locale]) {
      this.logger.warn(`LocaleManager.setLocale: unknown locale "${locale}"`);
      return;
    }
    this._currentLocale = locale;

    if (this._options.savePreference && typeof localStorage !== 'undefined') {
      this.savePreference();
    }

    if (typeof document !== 'undefined') {
      document.dispatchEvent(new CustomEvent('k3ui-locale-change', { detail: { locale } }));
    }

    if (this._options.onChange) {
      this._options.onChange(locale);
    }

    this.logger.info(`Locale set to: ${locale}`);
  }

  /**
   * Sauvegarde la préférence de locale en localStorage
   */
  private static savePreference(): void {
    if (!PrivacyManager.canWrite(this._options.storageKey!)) {
      this.logger.debug('Locale preference write skipped (privacy consent)');
      return;
    }

    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this._options.storageKey!, this._currentLocale);
        this.logger.debug('Locale preference saved');
      }
    } catch (error) {
      this.logger.error('Error saving locale preference:', error as Error);
    }
  }

  /**
   * Restaure la préférence de locale depuis localStorage
   */
  private static restorePreference(): void {
    if (!this._options.savePreference || typeof localStorage === 'undefined') return;

    try {
      const saved = localStorage.getItem(this._options.storageKey!);
      if (saved && (saved === 'fr-FR' || saved === 'en-US')) {
        this._currentLocale = saved as LocaleCode;
        this.logger.debug(`Locale preference restored: ${saved}`);
      }
    } catch (error) {
      this.logger.warn('Error restoring locale preference:', error);
    }
  }
}
