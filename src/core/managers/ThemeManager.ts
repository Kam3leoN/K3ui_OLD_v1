/**
 * @fileoverview ThemeManager pour K3UI
 * @author Kam3leon
 * @version 1.0.0
 */

import { LoggerManager } from './LoggerManager';
import { PrivacyManager } from './PrivacyManager';
import { Component } from '../base/Component';
import { getK3uiGlobal } from '../../types/global/k3ui-window';

/** Méthodes internes de Select utilisées pour resynchroniser l’UI thème. */
interface SelectThemeSyncInstance {
  _syncSelectedIndex?: () => void;
  _setSelectedStates?: () => void;
  _setValueToInput?: () => void;
}

/**
 * Types de thèmes disponibles
 */
export type ThemeType = 'light' | 'dark' | 'auto' | 'system';

/**
 * Options ponctuelles pour setTheme()
 */
export interface SetThemeOptions {
  /** Ne pas afficher le toast de feedback (bascules automatiques, ex. Firework) */
  silent?: boolean;
}

/**
 * Interface pour les options du thème
 */
export interface ThemeOptions {
  /** Type de thème */
  theme?: ThemeType;
  /** Sauvegarder la préférence */
  savePreference?: boolean;
  /** Clé de stockage */
  storageKey?: string;
  /** Callback lors du changement de thème */
  onChange?: ((theme: ThemeType) => void) | null;
}

/**
 * Options par défaut
 */
const _defaults: ThemeOptions = {
  theme: 'system',
  savePreference: true,
  storageKey: 'k3ui-theme',
  onChange: null,
};

/**
 * Classe ThemeManager pour gérer les thèmes
 */
export class ThemeManager {
  /** Logger pour le manager */
  private static logger: LoggerManager = LoggerManager.create('[ThemeManager]', 'Manager');

  /** État d'initialisation */
  private static _initialized: boolean = false;

  /** Options de configuration */
  private static _options: ThemeOptions = { ..._defaults };

  /** Thème actuel */
  private static _currentTheme: ThemeType = 'system';

  /** Media query pour le thème système */
  private static _systemThemeQuery: MediaQueryList | null = null;

  /** État d'initialisation des boutons de thème */
  private static _themeButtonsInitialized: boolean = false;

  /** Flag pour éviter les boucles de synchronisation */
  private static _syncing: boolean = false;

  /** Anti-double feedback (UI peut appeler setTheme 2x) */
  private static _lastFeedback: { theme: ThemeType; at: number } | null = null;

  /**
   * Resynchronise l’instance Select enregistrée sur un élément.
   * @param el - `<select>` ou élément hôte de l’instance
   */
  private static syncSelectInstance(el: HTMLElement): void {
    const selectInstance = Component.getInstance(el) as SelectThemeSyncInstance | null | undefined;
    if (!selectInstance) {
      return;
    }
    selectInstance._syncSelectedIndex?.();
    selectInstance._setSelectedStates?.();
    selectInstance._setValueToInput?.();
  }

  /**
   * Obtient le thème actuel
   */
  static get currentTheme(): ThemeType {
    return this._currentTheme;
  }

  /**
   * Indique si le thème effectif appliqué au document est sombre.
   * Priorité : classes / data-theme sur html, puis préférence ThemeManager, puis OS.
   */
  static isDark(): boolean {
    const root = document.documentElement;
    if (root.classList.contains('theme-dark') || root.getAttribute('data-theme') === 'dark') {
      return true;
    }
    if (root.classList.contains('theme-light') || root.getAttribute('data-theme') === 'light') {
      return false;
    }
    if (this._currentTheme === 'dark') {
      return true;
    }
    if (this._currentTheme === 'light') {
      return false;
    }
    return this.getSystemTheme() === 'dark';
  }

  /**
   * Obtient les options de configuration
   */
  static get options(): ThemeOptions {
    return { ...this._options };
  }

  /**
   * Initialise le gestionnaire de thèmes
   */
  static init(options?: Partial<ThemeOptions>): void {
    if (this._initialized) {
      this.logger.warn('ThemeManager already initialized');
      return;
    }

    // Mettre à jour les options
    if (options) {
      this._options = { ...this._options, ...options };
    }

    // Restaurer la préférence sauvegardée
    this.restorePreference();

    // Configurer l'écouteur de thème système
    this.setupSystemThemeListener();

    // Appliquer le thème initial
    this.applyTheme(this._currentTheme);

    // Initialiser les boutons de thème (seulement si pas déjà fait)
    if (!this._themeButtonsInitialized) {
      this.initThemeButtons();
      this._themeButtonsInitialized = true;
    }

    // Synchroniser les selects au démarrage - délai pour s'assurer que les composants sont prêts
    setTimeout(() => {
      this.logger.info('Synchronisation au démarrage...');
      this.syncThemeElements();
    }, 500);

    this._initialized = true;
    this.logger.info('ThemeManager initialized');
  }

  /**
   * Définit le thème
   * @param theme Le thème à appliquer
   * @param options - Options ponctuelles (ex. silent pour les bascules automatiques)
   */
  static setTheme(theme: ThemeType, options?: SetThemeOptions): void {
    const previous = this._currentTheme;
    // Évite les doublons: certains flows UI déclenchent setTheme() 2 fois (click + change/sync).
    if (previous === theme && this._initialized) {
      this.logger.debug(`Theme unchanged (${theme}) — skip`);
      return;
    }

    this._currentTheme = theme;
    this.applyTheme(theme);

    // Sauvegarder la préférence
    if (this._options.savePreference) {
      this.savePreference();
    }

    // Synchroniser tous les éléments de thème
    this.syncThemeElements();

    // Appeler le callback
    if (this._options.onChange) {
      this._options.onChange(theme);
    }

    if (options?.silent) {
      this.logger.info(`Theme set to: ${theme} (silent)`);
      return;
    }

    // Afficher un feedback non bloquant (Toast)
    const toast = getK3uiGlobal()?.Toast;
    if (toast) {
      const now = Date.now();
      if (this._lastFeedback && this._lastFeedback.theme === theme && now - this._lastFeedback.at < 600) {
        // Double-trigger rapproché → ne pas spammer l’UI
      } else {
      // Animation d'entrée personnalisée
      document.body.classList.add('theme-transitioning');

      toast.show({
        title: 'Thème',
        icon: theme === 'dark' ? 'moon' : theme === 'light' ? 'sun' : theme === 'system' ? 'gear' : 'clock',
        description: `Thème ${theme} activé`,
        variant: 'info',
        closeDelay: 2200,
        showClose: false,
        showProgressBar: true,
      });
      this._lastFeedback = { theme, at: now };

      window.setTimeout(() => {
        document.body.classList.remove('theme-transitioning');
      }, 2200);
      }
    }

    this.logger.info(`Theme set to: ${theme}`);
  }

  /**
   * Initialise les boutons de thème et gère l'interface utilisateur
   */
  static initThemeButtons(): void {
    // Vérifier si les boutons sont déjà initialisés
    if (ThemeManager._themeButtonsInitialized) {
      ThemeManager.logger.warn('Theme buttons already initialized');
      return;
    }

    // Écouter les clics sur les boutons switch-theme
    document.addEventListener('click', function (event) {
      const target = event.target as HTMLElement;

      // Bouton avec data-theme explicite → applique ce thème
      const explicitTheme = target.closest('.switch-theme[data-theme]') as HTMLElement;
      if (explicitTheme) {
        const theme = explicitTheme.getAttribute('data-theme') as ThemeType;
        if (theme) {
          ThemeManager.setTheme(theme);
        }
        return;
      }

      // Bouton leading du split-button thème : aucune action (le trailing gère l'ouverture du menu)
      const leadingBtn = target.closest('.split-btn__leading.switch-theme, .split-button__leading.switch-theme, .button-split__leading.switch-theme') as HTMLElement;
      if (leadingBtn) {
        return;
      }
    });

    // Écouter les changements de select de thème (SELECT natif et k3ui-select)
    document.addEventListener('change', function (event) {
      const target = event.target as HTMLElement;

      // Gérer les SELECT natifs
      if (target.getAttribute('data-group') === 'theme' && target.tagName === 'SELECT') {
        const select = target as HTMLSelectElement;
        const theme = select.value as ThemeType;
        if (theme && !ThemeManager._syncing) {
          ThemeManager.setTheme(theme);
        }
      }
      
      // Gérer les k3ui-select - obtenir la valeur depuis le select natif caché
      if (target.getAttribute('data-group') === 'theme' && target.tagName === 'K3UI-SELECT') {
        const k3uiSelect = target as HTMLElement;
        // Trouver le select natif caché dans le k3ui-select
        const hiddenSelect = k3uiSelect.querySelector('select[data-group="theme"]') as HTMLSelectElement;
        if (hiddenSelect) {
          const theme = hiddenSelect.value as ThemeType;
          if (theme && !ThemeManager._syncing) {
            ThemeManager.setTheme(theme);
          }
        }
      }
    });

    ThemeManager._themeButtonsInitialized = true;
    ThemeManager.logger.info('Theme buttons initialized with document listeners');
  }

  /**
   * Synchronise tous les éléments de thème avec le thème actuel
   */
  static syncThemeElements(): void {
    // Éviter les boucles de synchronisation
    if (this._syncing) {
      this.logger.debug('Synchronisation déjà en cours, ignorée');
      return;
    }

    this._syncing = true;
    this.logger.info(`syncThemeElements appelée avec thème: ${this._currentTheme}`);

    try {
      // Synchroniser les selects de thème
      this._syncSelectsByGroup('theme', this._currentTheme);
    } finally {
      this._syncing = false;
    }
  }

  /**
   * Synchronise les selects de thème uniquement
   */
  private static _syncSelectsByGroup(groupName: string, targetValue: string): void {
    // Synchroniser les selects natifs (ancien système)
    const selector = `select[data-group="${groupName}"]`;
    const allGroupSelects = document.querySelectorAll(selector);
    this.logger.debug(`Selects natifs du groupe "${groupName}" trouvés: ${allGroupSelects.length}`);

    allGroupSelects.forEach((element) => {
      if (element instanceof HTMLSelectElement) {
        this.logger.debug(`Select [${groupName}] - valeur actuelle: ${element.value}, valeur cible: ${targetValue}`);
        if (element.value !== targetValue) {
          // Vérifier que la valeur cible existe dans les options
          const targetOption = Array.from(element.options).find(option => option.value === targetValue);
          if (!targetOption) {
            this.logger.warn(`Select [${groupName}] - valeur cible "${targetValue}" non trouvée dans les options`);
            return;
          }

          element.value = targetValue;
          // Synchroniser selectedIndex avec value pour garantir la cohérence
          element.selectedIndex = Array.from(element.options).indexOf(targetOption);
          this.logger.info(`Select [${groupName}] - valeur mise à jour vers: ${targetValue}`);

          // Mettre à jour l'instance du select si elle existe
          if (Component.getInstance(element)) {
            this.logger.debug(`Select [${groupName}] - instance trouvée, mise à jour...`);
            ThemeManager.syncSelectInstance(element);
            element.setAttribute('data-theme', targetValue);
          } else {
            this.logger.debug(`Select [${groupName}] - aucune instance trouvée`);
          }

          // Déclencher l'événement change pour que les autres selects se synchronisent
          element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
        }
      }
    });

    // Synchroniser les k3ui-select
    const k3uiSelector = `k3ui-select[data-group="${groupName}"]`;
    const allK3uiSelects = document.querySelectorAll(k3uiSelector);
    this.logger.debug(`k3ui-select du groupe "${groupName}" trouvés: ${allK3uiSelects.length}`);

    allK3uiSelects.forEach((k3uiSelectEl) => {
      if (k3uiSelectEl instanceof HTMLElement) {
        // Trouver le select natif caché dans le k3ui-select
        const hiddenSelect = k3uiSelectEl.querySelector(`select[data-group="${groupName}"]`) as HTMLSelectElement;
        if (hiddenSelect && hiddenSelect.value !== targetValue) {
          this.logger.debug(`k3ui-select [${groupName}] - valeur actuelle: ${hiddenSelect.value}, valeur cible: ${targetValue}`);
          hiddenSelect.value = targetValue;
          // Synchroniser selectedIndex avec value pour garantir la cohérence
          const targetOption = Array.from(hiddenSelect.options).find(option => option.value === targetValue);
          if (targetOption) {
            hiddenSelect.selectedIndex = Array.from(hiddenSelect.options).indexOf(targetOption);
          }
          this.logger.info(`k3ui-select [${groupName}] - valeur mise à jour vers: ${targetValue}`);

          // Mettre à jour l'instance du select si elle existe
          if (Component.getInstance(hiddenSelect)) {
            this.logger.debug(`k3ui-select [${groupName}] - instance trouvée, mise à jour...`);
            ThemeManager.syncSelectInstance(hiddenSelect);
            hiddenSelect.setAttribute('data-theme', targetValue);
            k3uiSelectEl.setAttribute('data-theme', targetValue);
          } else {
            this.logger.debug(`k3ui-select [${groupName}] - aucune instance trouvée`);
          }

          // Déclencher l'événement change sur le k3ui-select pour que les autres selects se synchronisent
          k3uiSelectEl.dispatchEvent(new Event('change', { bubbles: true, cancelable: true, composed: true }));
        }
      }
    });

    // Synchroniser les nouveaux selects (k3ui-field et .select-button-container)
    const newSelector = `k3ui-field[data-group="${groupName}"], .select-button-container[data-group="${groupName}"]`;
    const allGroupElements = document.querySelectorAll(newSelector);
    this.logger.debug(`Éléments du groupe "${groupName}" trouvés: ${allGroupElements.length}`);

    // Mapper les valeurs de thème aux labels et icônes
    const themeMap: Record<string, { label: string; icon: string }> = {
      'light': { label: 'Clair', icon: 'sun' },
      'dark': { label: 'Sombre', icon: 'moon' },
      'auto': { label: 'Auto', icon: 'clock' },
      'system': { label: 'Système', icon: 'gear' }
    };

    const themeInfo = themeMap[targetValue];
    if (!themeInfo) {
      this.logger.warn(`Thème "${targetValue}" non reconnu`);
      return;
    }

    allGroupElements.forEach((element) => {
      // Chercher le menu dans l'élément
      let menu: HTMLElement | null = null;
      let inputField: HTMLElement | null = null;

      if (element.tagName === 'K3UI-FIELD') {
        inputField = element.querySelector('.input-field');
        if (inputField) {
          menu = inputField.querySelector('k3ui-menu');
        }
      } else if (element.classList.contains('select-button-container')) {
        menu = element.querySelector('k3ui-menu');
      }

      if (!menu) {
        return;
      }

      // Trouver le menu-item correspondant au thème
      const menuItem = menu.querySelector(`menu-item[data-id="${targetValue}"]`) as HTMLElement;
      if (!menuItem) {
        this.logger.debug(`Menu-item pour thème "${targetValue}" non trouvé dans le menu`);
        return;
      }

      // Mettre à jour l'input si c'est un field
      if (element.tagName === 'K3UI-FIELD' && inputField) {
        const wrapper = inputField.querySelector('.select-wrapper');
        if (wrapper) {
          const input = wrapper.querySelector('input.select-menu, input.select-trigger') as HTMLInputElement;
          if (input) {
            input.value = themeInfo.label;
            this.logger.debug(`Input [${groupName}] - valeur mise à jour vers: ${themeInfo.label}`);
          }
        }
      }

      // Mettre à jour le bouton trigger si présent
      const button = menu.querySelector('button[slot="trigger"]') as HTMLButtonElement;
      if (button) {
        const iconElement = button.querySelector('i.k3ui-icon, i[name]') as HTMLElement;
        if (iconElement) {
          iconElement.setAttribute('name', themeInfo.icon);
          this.logger.debug(`Button [${groupName}] - icône mise à jour vers: ${themeInfo.icon}`);
          getK3uiGlobal()?.IconManager?.forceDisplayIcons();
        }
      }

      // Sélectionner le menu-item correspondant
      menu.querySelectorAll('menu-item[data-selected]').forEach((item) => {
        item.removeAttribute('data-selected');
        item.removeAttribute('data-checked');
      });
      menuItem.setAttribute('data-selected', 'true');
      menuItem.setAttribute('data-checked', 'true');
      this.logger.debug(`Menu-item [${groupName}] - sélectionné: ${targetValue}`);
    });
  }


  /**
   * Applique le thème au document
   * @param theme Le thème à appliquer
   */
  private static applyTheme(theme: ThemeType): void {
    const documentElement = document.documentElement;

    this.logger.info(`applyTheme - Thème à appliquer: ${theme}`);

    // Supprimer les classes existantes
    documentElement.classList.remove('theme-light', 'theme-dark');

    // Appliquer le nouveau thème
    if (theme === 'light') {
      documentElement.classList.add('theme-light');
      documentElement.setAttribute('data-theme', 'light');
      this.logger.success('Thème light appliqué');
    } else if (theme === 'dark') {
      documentElement.classList.add('theme-dark');
      documentElement.setAttribute('data-theme', 'dark');
      this.logger.success('Thème dark appliqué');
    } else if (theme === 'auto' || theme === 'system') {
      // Utiliser le thème système
      const systemTheme = this.getSystemTheme();
      this.logger.info(`Thème système détecté: ${systemTheme}`);
      this.applyTheme(systemTheme);
      return;
    }

    this.logger.debug(`Theme applied: ${theme}`);
  }

  /**
   * Obtient le thème système
   * @returns Le thème système (light ou dark)
   */
  static getSystemTheme(): 'light' | 'dark' {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  /**
   * Configure l'écouteur de thème système
   */
  private static setupSystemThemeListener(): void {
    this._systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');

    this._systemThemeQuery.addEventListener('change', (e) => {
      if (this._currentTheme === 'system' || this._currentTheme === 'auto') {
        const newSystemTheme = e.matches ? 'dark' : 'light';
        this.applyTheme(newSystemTheme);
        this.logger.debug(`System theme changed to: ${newSystemTheme}`);
      }
    });
  }

  /**
   * Sauvegarde la préférence de thème
   */
  private static savePreference(): void {
    if (!PrivacyManager.canWrite(this._options.storageKey!)) {
      this.logger.debug('Theme preference write skipped (privacy consent)');
      return;
    }

    try {
      localStorage.setItem(this._options.storageKey!, this._currentTheme);
      this.logger.debug('Theme preference saved');
    } catch (error) {
      this.logger.error('Error saving theme preference:', error);
    }
  }


  /**
   * Restaure la préférence de thème
   */
  private static restorePreference(): void {
    if (!this._options.savePreference) return;

    try {
      const savedTheme = localStorage.getItem(this._options.storageKey!);
      if (savedTheme && this.isValidTheme(savedTheme)) {
        this._currentTheme = savedTheme as ThemeType;
        this.logger.debug(`Theme preference restored: ${savedTheme}`);
      }
    } catch (error) {
      this.logger.error('Error restoring theme preference:', error);
    }
  }

  /**
   * Vérifie si un thème est valide
   * @param theme Le thème à vérifier
   * @returns true si le thème est valide
   */
  private static isValidTheme(theme: string): theme is ThemeType {
    return ['light', 'dark', 'auto', 'system'].includes(theme);
  }

  /**
   * Met à jour les options de configuration
   * @param options Les nouvelles options
   */
  static updateOptions(options: Partial<ThemeOptions>): void {
    this._options = { ...this._options, ...options };
    this.logger.debug('Options updated:', this._options);
  }

  /**
   * Obtient les options par défaut
   */
  static get defaults(): ThemeOptions {
    return { ..._defaults };
  }

  /**
   * Nettoie les ressources
   */
  static destroy(): void {
    if (this._systemThemeQuery) {
      this._systemThemeQuery.removeEventListener('change', () => { });
      this._systemThemeQuery = null;
    }

    this._initialized = false;
    this.logger.info('ThemeManager destroyed');
  }
}