/**
 * Chip Component
 * Composant de chips selon Material Design 3 Expressive
 * @description Gestion complète des chips avec support des types Material Design 3 (assist, filter, input, suggestion)
 * @description Support des états (selected, disabled, elevated), icônes leading/trailing, et liens
 */

import { Component } from '../core/base/Component';
import { ChipData, ChipOptions } from '../types/components';
import { toComponentClassDef } from '../types/components/component-base';
import {
    type ChipDomData,
    deleteChipFocusRing,
    deleteChipKeyboard,
    getChipKeyboard,
    getChipMouse,
    getChipWrapperData,
    setChipFocusRing,
    setChipKeyboard,
    setChipMouse,
    setChipRipple,
    setChipWrapperData,
    setChipWrapperIndex,
} from '../types/dom/chip-element';
import { PriorityLevel } from '../types/base';
import { KElement, InitElements } from '../types/base';
import { LoggerManager } from '../core/managers/LoggerManager';
import { IconManager } from '../core/managers/IconManager';
import { generateGuid, removeItemAtIndex } from '../utils/helpers';
import { ManagerFactory } from '../core/factories/ManagerFactory';
import { setAriaAttribute, setAriaAttributes, getAriaAttribute } from '../utils/dom/aria';
import { getChipDefaults, ChipSpecs } from '../specs/components/chip.specs';
import { Keyboard, Mouse, LocaleManager } from '../core/managers';
import { createRipple, Ripple } from '../utils/effects/ripple';
import { FocusRing } from '../utils/effects/focusring';
import { HapticManager } from '../core/managers/HapticManager';
import { Field } from './Field';

/**
 * Options par défaut du composant Chip
 * @description Extrait depuis les specs pour garantir la cohérence
 */
const _defaults: ChipOptions = getChipDefaults();
/**
 * Classe Chip
 * Gère les chips avec toutes leurs fonctionnalités Material Design 3
 */
export class Chip extends Component<ChipOptions> {
  /** Niveau de priorité du composant */
  readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

  private chipsData: ChipDomData[] = [];
  private chipElements: HTMLElement[] = [];
  private selectAllChipElement: HTMLElement | null = null; // Chip "Tous" séparé des données
  private inputElement: HTMLInputElement | null = null;
  private inputFieldInstance: Field | null = null;
  private inputFieldElement: HTMLElement | null = null;
  private inputWrapper: HTMLElement | null = null;
  private selectedChip: HTMLElement | null = null;
  private isFocused: boolean = false;
  private logger: LoggerManager;
  private keyboardHandlers: Map<HTMLElement, string> = new Map();
  private mouseHandlers: Map<HTMLElement, Mouse> = new Map();
  private rippleInstances: Map<HTMLElement, Ripple> = new Map();
  private focusRingInstances: Map<HTMLElement, FocusRing> = new Map();
  // Cache DOM pour éviter les querySelector répétés
  private domCache: Map<HTMLElement, {
    container?: HTMLElement;
    primaryAction?: HTMLElement;
    trailingAction?: HTMLElement;
    leadingCell?: HTMLElement;
    labelText?: HTMLElement;
  }> = new Map();
  // Batch updates avec requestAnimationFrame
  private updateQueue: Set<number> = new Set();
  private rafId: number | null = null;

  /**
   * Constructeur
   * @param el - Élément DOM du Chip
   * @param options - Options de configuration
   */
  constructor(el: HTMLElement, options: Partial<ChipOptions> = {}) {
    // Lire les attributs HTML et les convertir en options
    // Les attributs HTML ont la priorité sur les options passées en paramètre
    const htmlOptions = Chip.readAttributes(el);

    super(el, { ...options, ...htmlOptions }, toComponentClassDef(Chip));

    this.logger = ManagerFactory.getLoggerManager('[Chip]');

    // Initialiser les options avec les valeurs par défaut
    this.options = {
      ...Chip.defaults,
      ...htmlOptions,
      ...options
    };

    // Stocker l'instance sur l'élément DOM
    // L'instance est gérée via ComponentRegistry (voir getInstance())

    this.init();
  }

  /**
   * Lit les attributs HTML et les convertit en options
   */
  private static readAttributes(el: HTMLElement): Partial<ChipOptions> {
    const options: Partial<ChipOptions> = {};

    // Lire les attributs HTML
    if (el.hasAttribute('variant')) {
      const variant = el.getAttribute('variant');
      if (variant === 'assist' || variant === 'filter' || variant === 'input' || variant === 'suggestion' || variant === 'default') {
        // Mapper les variants obsolètes vers les variants valides
        if (variant === 'assist' || variant === 'default' || variant === 'suggestion') {
          options.variant = 'input'; // Mapper vers 'input' par défaut
        } else {
          options.variant = variant as 'filter' | 'input' | 'choice' | 'action';
        }
      }
    }
    if (el.hasAttribute('size')) {
      const size = el.getAttribute('size');
      if (size === 'small' || size === 'medium' || size === 'large') {
        options.size = size;
      }
    }
    if (el.hasAttribute('placeholder')) {
      options.placeholder = el.getAttribute('placeholder') || undefined;
    }
    if (el.hasAttribute('secondary-placeholder')) {
      options.secondaryPlaceholder = el.getAttribute('secondary-placeholder') || undefined;
    }
    if (el.hasAttribute('limit')) {
      const limit = parseInt(el.getAttribute('limit') || '0', 10);
      if (!isNaN(limit) && limit > 0) {
        options.limit = limit;
      }
    }

    // Attributs booléens
    options.allowUserInput = el.hasAttribute('allow-user-input') || el.hasAttribute('allowUserInput');

    // Lire les données depuis l'attribut data-data (JSON)
    if (el.hasAttribute('data-data')) {
      try {
        const dataAttr = el.getAttribute('data-data');
        if (dataAttr) {
          options.data = JSON.parse(dataAttr);
        }
      } catch (e) {
        console.warn('[Chip] Failed to parse data-data attribute:', e);
      }
    }

    return options;
  }

  /**
   * Initialisation du composant
   */
  private init(): void {
    try {
      this.setupStructure();
      this.setupEventListeners();
      this.renderChips();
      this.updateState();
      this.logger.success('Chip initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Chip:', error);
    }
  }

  /**
   * Configuration de la structure HTML
   */
  private setupStructure(): void {
    // Ajouter la classe de base
    this.el.classList.add('chips');

    // Ajouter les classes de taille et variante
    this.el.classList.add(`chips--${this.options.size}`);
    this.el.classList.add(`chips--${this.options.variant}`);

    // Créer l'input si nécessaire
    if (this.options.allowUserInput) {
      this.createInput();
    }

    // Initialiser les données
    // Si aucune donnée n'est fournie, détecter les chips existants dans le HTML
    if (!this.options.data || this.options.data.length === 0) {
      this.chipsData = this.parseExistingChips();
    } else {
      // Filtrer le chip "Tous" des données utilisateur s'il existe
      // Le chip "Tous" sera géré séparément par le système
      this.chipsData = this.options.data.filter(chip => {
        const extendedChip = chip as ChipDomData;
        const text = extendedChip.text?.trim().toLowerCase() || '';
        const value = extendedChip.value?.trim().toLowerCase() || '';
        return text !== 'tous' && text !== 'all' && value !== 'tous' && value !== 'all';
      });
    }
  }

  /**
   * Parse les chips existants dans le HTML pour les convertir en données
   * @returns Tableau de données de chips extraites du HTML
   */
  private parseExistingChips(): ChipDomData[] {
    const chips: ChipDomData[] = [];
    // Sélectionner uniquement les chips qui sont des enfants directs de .chips
    // et qui ne sont pas déjà dans un .chip-wrapper (chips générés)
    const existingChips = Array.from(this.el.children).filter(
      child => child.classList.contains('chip') && !child.classList.contains('chip-wrapper')
    ) as HTMLElement[];

    existingChips.forEach((chipEl, index) => {
      const chipElement = chipEl as HTMLElement;
      const textElement = chipElement.querySelector('.chip__text') as HTMLElement;
      const text = textElement?.textContent?.trim() || chipElement.textContent?.trim() || '';

      // Extraire les attributs du chip
      const type = chipElement.getAttribute('data-type') ||
        chipElement.getAttribute('type') ||
        this.options.variant ||
        'assist';
      const id = chipElement.getAttribute('data-id') ||
        chipElement.getAttribute('id') ||
        `chip-${index}`;
      const href = chipElement.getAttribute('href') ||
        chipElement.getAttribute('data-href') ||
        undefined;
      const target = chipElement.getAttribute('target') ||
        chipElement.getAttribute('data-target') ||
        undefined;
      const selected = chipElement.hasAttribute('selected') ||
        chipElement.hasAttribute('data-selected') ||
        chipElement.classList.contains('selected');
      const disabled = chipElement.hasAttribute('disabled') ||
        chipElement.hasAttribute('data-disabled') ||
        chipElement.classList.contains('disabled');
      const elevated = chipElement.hasAttribute('elevated') ||
        chipElement.hasAttribute('data-elevated') ||
        chipElement.classList.contains('elevated');

      // Extraire l'icône leading
      const leadingIconEl = chipElement.querySelector('.chip__icon, .leading-icon, [data-icon]');
      const leadingIcon = leadingIconEl?.getAttribute('data-icon') ||
        leadingIconEl?.getAttribute('data-leading-icon') ||
        undefined;

      // Extraire l'image (déprécié, utiliser leadingIcon à la place)
      const imageEl = chipElement.querySelector('img');
      const image = imageEl?.getAttribute('src') ||
        chipElement.getAttribute('data-image') ||
        undefined;

      const chipData: ChipDomData = {
        id,
        text,
        type: type as 'assist' | 'filter' | 'input' | 'suggestion',
        selected,
        disabled,
        elevated,
        href,
        target,
        leadingIcon,
        image
      };

      chips.push(chipData);
    });

    return chips;
  }


  /**
   * Création du champ de saisie pour les input chips (pattern k3ui-field)
   */
  private createInput(): void {
    this.inputWrapper = document.createElement('div');
    this.inputWrapper.classList.add('chips__input-wrapper');

    const fieldElement = document.createElement('k3ui-field');
    fieldElement.classList.add('no-autoinit', 'chips__input-field');
    fieldElement.setAttribute('type', 'text');
    fieldElement.setAttribute('variant', 'outlined');
    fieldElement.setAttribute('autocomplete', 'off');
    setAriaAttribute(fieldElement, 'label', LocaleManager.t('chip.ariaAddChip'));

    if (this.options.placeholder) {
      fieldElement.setAttribute('placeholder', this.options.placeholder);
    }

    this.inputWrapper.appendChild(fieldElement);
    this.el.appendChild(this.inputWrapper);

    this.inputFieldElement = fieldElement;
    this.inputFieldInstance = Field.init(fieldElement, {
      variant: 'outlined',
      type: 'text',
      placeholder: this.options.placeholder,
      clearable: false,
      autocomplete: 'off',
    }) as Field;

    this.inputElement = this.inputFieldInstance.inputElement as HTMLInputElement | null;
    this.updatePlaceholder();
  }

  /**
   * Configuration des écouteurs d'événements
   */
  private setupEventListeners(): void {
    // Événements sur le conteneur
    this.registerEvent(this.el, 'click', this.handleContainerClick.bind(this));
    this.registerEvent(this.el, 'focusin', this.handleFocusIn.bind(this));
    this.registerEvent(this.el, 'focusout', this.handleFocusOut.bind(this));

    // Événements sur l'input
    if (this.inputElement) {
      this.registerEvent(this.inputElement, 'keydown', this.handleInputKeydown.bind(this));
      this.registerEvent(this.inputElement, 'input', this.handleInput.bind(this));
      this.registerEvent(this.inputElement, 'focus', this.handleInputFocus.bind(this));
      this.registerEvent(this.inputElement, 'blur', this.handleInputBlur.bind(this));
    }
  }

  /**
   * Gestion du clic sur le conteneur
   */
  private handleContainerClick(event: Event): void {
    const target = event.target as HTMLElement;

    // Vérifier si on clique sur un chip wrapper
    const chipWrapper = target.closest('.chip-wrapper');
    if (chipWrapper) {
      // Vérifier si c'est le chip "Tous" (select all) - il est séparé des données
      const isSelectAll = chipWrapper === this.selectAllChipElement ||
        chipWrapper.hasAttribute('data-select-all') ||
        chipWrapper.getAttribute('data-select-all') === 'true';

      if (isSelectAll) {
        // Ignorer les clics sur les trailing actions
        if (target.closest('.trailing.action')) {
          return;
        }

        // Ignorer les clics sur le primary.action (il a son propre gestionnaire)
        if (target.closest('.primary.action') && !target.closest('.primary.action.link')) {
          return;
        }

        // Toggle tous les autres chips filter
        this.toggleAllChips();

        HapticManager.triggerFromOptions(this.options, 'selection');

        // Appeler le callback de clic
        const selectAllChipData = getChipWrapperData(chipWrapper as HTMLElement)!;
        if (this.options.onChipClick && selectAllChipData) {
          this.options.onChipClick(this.el, chipWrapper as HTMLElement, selectAllChipData);
        }
        return;
      }

      // Pour les chips normaux (dans les données)
      const chipIndex = this.chipElements.indexOf(chipWrapper as HTMLElement);
      if (chipIndex !== -1) {
        const chipData = this.chipsData[chipIndex] as ChipDomData;

        // Ignorer les clics sur les trailing actions (menu ou suppression)
        if (target.closest('.trailing.action')) {
          // L'ouverture du menu ou la suppression est gérée dans createTrailingIcon/createTrailingAction
          return;
        }

        // Ignorer les clics sur le primary.action (il a son propre gestionnaire)
        // Sauf si c'est un lien (les liens n'ont pas de gestionnaire de clic pour la sélection)
        if (target.closest('.primary.action') && !target.closest('.primary.action.link')) {
          // Le gestionnaire du primary.action gère déjà la sélection pour les filter chips
          return;
        }

        // Pour les autres cas (clic sur le wrapper ou autres éléments), gérer la sélection
        if (chipData.type === 'filter') {
          // Toggle normal pour un chip individuel
          this.toggleChipSelection(chipIndex);
        }

        HapticManager.triggerFromOptions(this.options, 'selection');

        // Appeler le callback de clic
        if (this.options.onChipClick) {
          this.options.onChipClick(this.el, chipWrapper as HTMLElement, chipData);
        }
      }
    } else if (this.inputElement) {
      // Focus sur l'input si on clique ailleurs
      this.inputElement.focus();
    }
  }

  /**
   * Gestion de la navigation clavier pour un chip spécifique
   * @param chipElement - Élément chip
   * @param chipData - Données du chip
   */
  private setupChipKeyboard(chipElement: HTMLElement, chipData: ChipDomData): void {
    const keyboard = new Keyboard({
      target: chipElement,
      enabled: !chipData.disabled,
      onKeyDown: (event: KeyboardEvent, key: string) => {
        this.handleChipKeyDown(event, key, chipElement, chipData);
      }
    });

    const handlerId = `chip_${chipData.id}_${Date.now()}`;
    this.keyboardHandlers.set(chipElement, handlerId);
    setChipKeyboard(chipElement, keyboard);
  }

  /**
   * Gestion des événements clavier sur un chip
   * Amélioré pour correspondre à Material Web avec support Home/End et meilleur RTL
   */
  private handleChipKeyDown(event: KeyboardEvent, key: string, chipElement: HTMLElement, chipData: ChipDomData): void {
    // Vérifier si le chip est disabled (sauf si alwaysFocusable ou softDisabled)
    if (chipData.disabled && !chipData.alwaysFocusable && !chipData.softDisabled) {
      return;
    }

    const index = this.chipElements.indexOf(chipElement);
    if (index === -1) return;

    const isRtl = getComputedStyle(this.el).direction === 'rtl';
    const isLeft = key === 'ArrowLeft';
    const isRight = key === 'ArrowRight';
    const isHome = key === 'Home';
    const isEnd = key === 'End';

    // Navigation avec les flèches horizontales
    if (isLeft || isRight) {
      const forwards = isRtl ? isLeft : isRight;

      event.preventDefault();
      event.stopPropagation();

      // Navigation entre chips
      if (forwards && index < this.chipElements.length - 1) {
        const nextChip = this.chipElements[index + 1];
        const nextChipData = getChipWrapperData(nextChip)!;
        // Ignorer les chips disabled (sauf alwaysFocusable)
        if (!nextChipData.disabled || nextChipData.alwaysFocusable) {
          nextChip.focus();
        } else {
          // Chercher le prochain chip non-disabled
          for (let i = index + 2; i < this.chipElements.length; i++) {
            const chip = this.chipElements[i];
            const data = getChipWrapperData(chip)!;
            if (!data.disabled || data.alwaysFocusable) {
              chip.focus();
              break;
            }
          }
        }
      } else if (!forwards && index > 0) {
        const prevChip = this.chipElements[index - 1];
        const prevChipData = getChipWrapperData(prevChip)!;
        // Ignorer les chips disabled (sauf alwaysFocusable)
        if (!prevChipData.disabled || prevChipData.alwaysFocusable) {
          prevChip.focus();
        } else {
          // Chercher le chip précédent non-disabled
          for (let i = index - 2; i >= 0; i--) {
            const chip = this.chipElements[i];
            const data = getChipWrapperData(chip)!;
            if (!data.disabled || data.alwaysFocusable) {
              chip.focus();
              break;
            }
          }
        }
      } else if (forwards && this.inputElement) {
        this.inputElement.focus();
      }
      return;
    }

    // Navigation Home/End
    if (isHome || isEnd) {
      event.preventDefault();
      event.stopPropagation();

      const targetIndex = isHome ? 0 : this.chipElements.length - 1;
      if (targetIndex >= 0 && targetIndex < this.chipElements.length) {
        const targetChip = this.chipElements[targetIndex];
        const targetData = getChipWrapperData(targetChip)!;
        if (!targetData.disabled || targetData.alwaysFocusable) {
          targetChip.focus();
        } else {
          // Chercher le premier/dernier chip non-disabled
          if (isHome) {
            for (let i = 1; i < this.chipElements.length; i++) {
              const chip = this.chipElements[i];
              const data = getChipWrapperData(chip)!;
              if (!data.disabled || data.alwaysFocusable) {
                chip.focus();
                break;
              }
            }
          } else {
            for (let i = this.chipElements.length - 2; i >= 0; i--) {
              const chip = this.chipElements[i];
              const data = getChipWrapperData(chip)!;
              if (!data.disabled || data.alwaysFocusable) {
                chip.focus();
                break;
              }
            }
          }
        }
      }
      return;
    }

    // Suppression avec Backspace/Delete
    if ((key === 'Backspace' || key === 'Delete') && this.options.removable && chipData.removable) {
      event.preventDefault();
      event.stopPropagation();
      this.deleteChip(index);
      return;
    }

    // Sélection avec Enter ou Espace (uniquement pour les filter chips)
    if ((key === 'Enter' || key === ' ') && chipData.type === 'filter') {
      event.preventDefault();
      event.stopPropagation();
      this.toggleChipSelection(index);
      return;
    }
  }

  /**
   * Gestion des événements de l'input
   */
  private handleInputKeydown(event: KeyboardEvent): void {
    const key = event.key;

    if (key === 'Enter') {
      event.preventDefault();
      this.addChipFromInput();
    } else if (key === 'Backspace' && this.inputElement && this.inputElement.value === '' && this.chipsData.length > 0) {
      event.preventDefault();
      this.selectChip(this.chipsData.length - 1);
    }
  }

  /**
   * Gestion de l'input
   */
  private handleInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.updatePlaceholder();
  }

  /**
   * Gestion du focus sur l'input
   */
  private handleInputFocus(event: FocusEvent): void {
    this.isFocused = true;
    this.el.classList.add('chips--focused');
  }

  /**
   * Gestion de la perte de focus sur l'input
   */
  private handleInputBlur(event: FocusEvent): void {
    this.isFocused = false;
    this.el.classList.remove('chips--focused');
  }

  /**
   * Gestion du focus sur le conteneur
   */
  private handleFocusIn(event: FocusEvent): void {
    this.isFocused = true;
    this.el.classList.add('chips--focused');
  }

  /**
   * Gestion de la perte de focus sur le conteneur
   */
  private handleFocusOut(event: FocusEvent): void {
    // Vérifier si le focus reste dans le conteneur
    setTimeout(() => {
      if (!this.el.contains(document.activeElement)) {
        this.isFocused = false;
        this.el.classList.remove('chips--focused');
        this.selectedChip = null;
      }
    }, 0);
  }

  /**
   * Ajout d'un chip depuis l'input
   */
  private addChipFromInput(): void {
    if (!this.inputElement) return;

    const value = this.inputElement.value.trim();
    const limit = this.options.limit ?? Infinity;
    if (value && this.chipsData.length < limit) {
      // Capitaliser la première lettre du texte
      const capitalizedText = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

      const chipData: ChipDomData = {
        id: generateGuid(),
        text: capitalizedText,
        type: 'input', // Forcer le type input pour les chips ajoutés via l'input
        removable: true // Forcer removable pour les input chips
      };

      this.addChip(chipData);
      this.inputElement.value = '';
      this.updatePlaceholder();
    }
  }

  /**
   * Mise à jour du placeholder
   */
  private updatePlaceholder(): void {
    if (!this.inputElement) return;

    let placeholder = '';
    if (this.chipsData.length === 0 && this.options.placeholder) {
      placeholder = this.options.placeholder;
    } else if (this.chipsData.length > 0 && this.options.secondaryPlaceholder) {
      placeholder = this.options.secondaryPlaceholder;
    } else if (this.chipsData.length > 0 && !this.options.secondaryPlaceholder && this.options.placeholder) {
      // Si pas de secondaryPlaceholder mais qu'il y a des chips, utiliser le placeholder par défaut
      placeholder = this.options.placeholder;
    }

    // Mettre à jour le placeholder directement sur l'input
    this.inputElement.placeholder = placeholder;
  }

  /**
   * Rendu des chips (optimisé avec DocumentFragment)
   */
  private renderChips(): void {
    // Nettoyer le cache DOM
    this.domCache.clear();

    // Nettoyer les chips existants (chips générés)
    this.chipElements.forEach(chip => {
      // Nettoyer les handlers
      const keyboard = getChipKeyboard(chip);
      if (keyboard && typeof keyboard.destroy === 'function') {
        keyboard.destroy();
      }
      const mouse = getChipMouse(chip);
      if (mouse && typeof mouse.destroy === 'function') {
        mouse.destroy();
      }
      chip.remove();
    });
    this.chipElements = [];

    // Supprimer le chip "Tous" s'il existe
    if (this.selectAllChipElement) {
      this.selectAllChipElement.remove();
      this.selectAllChipElement = null;
    }

    // Supprimer les chips HTML statiques qui ont été parsés
    // (ceux qui ont la classe .chip mais ne sont pas dans .chip-wrapper)
    const existingChips = Array.from(this.el.children).filter(
      child => child.classList.contains('chip') && !child.classList.contains('chip-wrapper')
    );
    existingChips.forEach(chip => chip.remove());

    // Créer le chip "Tous" automatiquement s'il y a au moins 2 filter chips
    const filterChips = this.chipsData.filter(
      chip => (chip as ChipDomData).type === 'filter'
    );

    if (filterChips.length >= 2) {
      this.createSelectAllChip();
    }

    // Utiliser DocumentFragment pour batch les insertions DOM
    const fragment = document.createDocumentFragment();

    // Créer tous les chips dans le fragment
    this.chipsData.forEach((chipData, index) => {
      const chipElement = this.createChipElement(chipData, index);
      fragment.appendChild(chipElement);
      this.chipElements.push(chipElement);
    });

    // Insérer le fragment en une seule opération DOM
    if (this.inputWrapper) {
      this.el.insertBefore(fragment, this.inputWrapper);
    } else {
      this.el.appendChild(fragment);
    }
  }

  /**
   * Crée le chip "Tous" automatiquement (séparé des données utilisateur)
   */
  private createSelectAllChip(): void {
    // Compter les filter chips sélectionnés
    const filterChips = this.chipsData.filter(
      chip => (chip as ChipDomData).type === 'filter'
    );
    const allSelected = filterChips.length > 0 && filterChips.every(
      chip => (chip as ChipDomData).selected
    );

    // Créer les données du chip "Tous" (non sélectionnable, juste un contrôle)
    const selectAllChipData: ChipDomData = {
      id: 'system-select-all',
      text: 'Tous',
      type: 'filter',
      selected: allSelected,
      // Ce chip n'est pas dans chipsData, c'est un élément de contrôle séparé
    };

    // Créer l'élément chip
    const chipElement = this.createChipElement(selectAllChipData, -1); // Index -1 pour indiquer que c'est séparé

    // Stocker l'élément séparément
    this.selectAllChipElement = chipElement;

    // Insérer en premier (avant tous les autres chips)
    if (this.el.firstChild) {
      this.el.insertBefore(chipElement, this.el.firstChild);
    } else {
      this.el.appendChild(chipElement);
    }
  }

  /**
   * Création d'un élément chip avec support Material Design 3
   * Structure inspirée de Material Web pour une meilleure compatibilité
   */
  private createChipElement(chipData: ChipDomData, index: number): HTMLElement {
    // Convertir les anciens types vers les nouveaux types valides
    let type: 'assist' | 'filter' | 'input' | 'suggestion' = chipData.type || 'assist';
    if (this.options.variant) {
      // Mapper les variants valides vers les types internes
      if (this.options.variant === 'input' || this.options.variant === 'action') {
        type = 'input';
      } else if (this.options.variant === 'filter' || this.options.variant === 'choice') {
        type = 'filter';
      }
    }

    // Les chips filter peuvent avoir un trailing icon (caret) pour les menus
    // mais ne peuvent pas être removable (pas de bouton de suppression)
    const hasTrailingIcon = chipData.trailingIcon && chipData.trailingIcon !== '';
    const isRemovable = type === 'filter' ? false : (type === 'input' ? true : (this.options.removable && type !== 'assist'));

    const chipDataWithDefaults: ChipDomData = {
      ...chipData,
      type,
      selected: chipData.selected ?? false,
      disabled: chipData.disabled ?? false,
      softDisabled: chipData.softDisabled ?? false,
      alwaysFocusable: chipData.alwaysFocusable ?? false,
      elevated: chipData.elevated ?? false,
      removable: isRemovable,
      touchTarget: chipData.touchTarget ?? 'wrapper'
    };

    // Créer le wrapper (équivalent à :host dans Material Web)
    const wrapper = document.createElement('div');
    wrapper.classList.add('chip-wrapper', `chip-wrapper--${type}`);
    wrapper.setAttribute('role', 'presentation');

    // Ajouter l'attribut data-select-all="true" si c'est un chip "Tous" fourni par l'utilisateur
    // Le chip "Tous" doit être fourni dans les données par l'utilisateur, pas ajouté automatiquement
    const normalizedText = chipDataWithDefaults.text?.trim().toLowerCase() || '';
    const normalizedValue = chipDataWithDefaults.value?.trim().toLowerCase() || '';
    if (normalizedText === 'tous' || normalizedText === 'all' ||
      normalizedValue === 'tous' || normalizedValue === 'all') {
      wrapper.setAttribute('data-select-all', 'true');
    }

    // Touch target mode
    if (chipDataWithDefaults.touchTarget === 'wrapper') {
      wrapper.setAttribute('touch-target', 'wrapper');
    } else if (chipDataWithDefaults.touchTarget === 'none') {
      wrapper.setAttribute('touch-target', 'none');
    }

    // Attributs d'état
    if (chipDataWithDefaults.disabled && !chipDataWithDefaults.softDisabled) {
      wrapper.setAttribute('disabled', '');
    }
    if (chipDataWithDefaults.softDisabled) {
      wrapper.setAttribute('soft-disabled', '');
    }
    if (chipDataWithDefaults.elevated) {
      wrapper.classList.add('chip-wrapper--elevated');
    }
    if (chipDataWithDefaults.shape === 'rounded') {
      wrapper.classList.add('chip-wrapper--rounded');
    }
    if (chipDataWithDefaults.selected) {
      wrapper.classList.add('chip-wrapper--selected');
    }

    // Créer le conteneur (équivalent à .container dans Material Web)
    // NE PAS ajouter la classe 'container' globale pour éviter les conflits de padding
    const container = document.createElement('div');
    container.classList.add('chip-container');

    // Classes d'état pour le container
    if (chipDataWithDefaults.disabled && !chipDataWithDefaults.softDisabled) {
      container.classList.add('disabled');
    }
    if (chipDataWithDefaults.softDisabled) {
      container.classList.add('disabled');
    }
    if (chipDataWithDefaults.selected) {
      container.classList.add('selected');
    }
    if (chipDataWithDefaults.elevated) {
      container.classList.add('elevated');
    }
    // Pour les chips filter : has-icon uniquement si sélectionné (checkmark en leading)
    // Pour les autres types : has-icon si leadingIcon ou selected
    if (chipDataWithDefaults.type === 'filter') {
      if (chipDataWithDefaults.selected) {
        wrapper.classList.add('has-icon');
        container.classList.add('has-icon');
      }
    } else if (chipDataWithDefaults.leadingIcon || chipDataWithDefaults.selected) {
      wrapper.classList.add('has-icon');
      container.classList.add('has-icon');
    }
    // has-trailing : suppression, ou icône trailing (menu / chevron) sur filter, assist et suggestion
    const hasMenuTrailingIcon =
      hasTrailingIcon &&
      (chipDataWithDefaults.type === 'filter' ||
        chipDataWithDefaults.type === 'assist' ||
        chipDataWithDefaults.type === 'suggestion');
    if (chipDataWithDefaults.removable || hasMenuTrailingIcon) {
      wrapper.classList.add('has-trailing');
    }

    // Créer l'outline (équivalent à .outline dans Material Web)
    const outline = this.createOutline();
    container.appendChild(outline);

    // ID pour l'action principale
    const primaryId = `chip-${index}-primary`;

    // Créer l'action principale (button, link ou span)
    const primaryAction = this.createPrimaryAction(chipDataWithDefaults, container);
    primaryAction.id = primaryId;

    // Créer le focus ring (inspiré de Material Web md-focus-ring)
    const focusRing = this.createFocusRing(primaryId, container);
    if (focusRing) {
      container.appendChild(focusRing);
    }

    // Le ripple sera créé automatiquement par setupChipRipple
    // On ne crée plus l'élément .ripple-surface manuellement

    // Contenu principal (équivalent à .primary.action dans Material Web)
    // Dans Material Web, .primary.action est le button/link lui-même, pas un wrapper

    // Cell pour l'icône leading (équivalent à .cell dans Material Web)
    const leadingCell = document.createElement('div');
    leadingCell.classList.add('cell');

    // Icône leading
    // Pour les chips filter : uniquement le checkmark en leading quand sélectionné, pas d'autre icône
    if (chipDataWithDefaults.type === 'filter') {
      // Chips filter : uniquement checkmark en leading quand sélectionné
      if (chipDataWithDefaults.selected) {
        const selectedIcon = document.createElement('span');
        selectedIcon.classList.add('leading', 'icon');
        selectedIcon.setAttribute('aria-hidden', 'true');

        // Pour le chip "Tous" (system-select-all), utiliser l'icône "check-all"
        if (chipDataWithDefaults.id === 'system-select-all') {
          const iconElement = document.createElement('i');
          iconElement.className = `${this.options.closeIconClass || 'k3ui-icon'}`;
          iconElement.setAttribute('name', 'check-all');
          selectedIcon.appendChild(iconElement);
        } else {
          // Pour les autres chips filter, utiliser le checkmark SVG
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.setAttribute('class', 'checkmark');
          svg.setAttribute('viewBox', '0 0 18 18');
          svg.setAttribute('aria-hidden', 'true');
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', 'M6.75012 12.1274L3.62262 8.99988L2.55762 10.0574L6.75012 14.2499L15.7501 5.24988L14.6926 4.19238L6.75012 12.1274Z');
          svg.appendChild(path);
          selectedIcon.appendChild(svg);
        }

        leadingCell.appendChild(selectedIcon);
      }
      // Si pas sélectionné, pas d'icône leading pour les chips filter
    } else {
      // Pour les autres types de chips (assist, input, suggestion)
      if (chipDataWithDefaults.leadingIcon && !chipDataWithDefaults.selected) {
        const leadingIcon = document.createElement('span');
        leadingIcon.classList.add('leading', 'icon');
        leadingIcon.setAttribute('aria-hidden', 'true');

        // Détecter si leadingIcon est une URL d'image ou un nom d'icône
        // Selon Material Design 3, leadingIcon peut être une icône ou une image
        const isImageUrl = chipDataWithDefaults.leadingIcon.match(/\.(jpg|jpeg|png|gif|svg|webp|avif)(\?.*)?$/i) ||
          chipDataWithDefaults.leadingIcon.startsWith('http://') ||
          chipDataWithDefaults.leadingIcon.startsWith('https://') ||
          chipDataWithDefaults.leadingIcon.startsWith('data:') ||
          chipDataWithDefaults.leadingIcon.startsWith('/') ||
          chipDataWithDefaults.leadingIcon.startsWith('./') ||
          chipDataWithDefaults.leadingIcon.startsWith('../');

        if (isImageUrl) {
          // C'est une image, créer un élément <img>
          // Selon Material Design 3, les images dans leadingIcon font 24x24px et sont full rounded
          const imageElement = document.createElement('img');
          imageElement.src = chipDataWithDefaults.leadingIcon;
          imageElement.alt = '';
          imageElement.classList.add('chip-leading-image');
          leadingIcon.classList.add('has-image');
          leadingIcon.appendChild(imageElement);
        } else {
          // C'est un nom d'icône, créer un élément <i>
          // Selon Material Design 3, les icônes dans leadingIcon font 18x18px
          const iconElement = document.createElement('i');
          iconElement.className = `${this.options.closeIconClass || 'k3ui-icon'}`;
          iconElement.setAttribute('name', chipDataWithDefaults.leadingIcon);
          leadingIcon.classList.add('has-icon');
          leadingIcon.appendChild(iconElement);
        }

        leadingCell.appendChild(leadingIcon);
      } else if (chipDataWithDefaults.selected && chipDataWithDefaults.selectedIcon) {
        // Pour les autres types, on peut avoir un selectedIcon personnalisé
        const selectedIcon = document.createElement('span');
        selectedIcon.classList.add('leading', 'icon');
        selectedIcon.setAttribute('aria-hidden', 'true');
        const iconElement = document.createElement('i');
        iconElement.className = `${this.options.closeIconClass || 'k3ui-icon'}`;
        iconElement.setAttribute('name', chipDataWithDefaults.selectedIcon);
        selectedIcon.appendChild(iconElement);
        leadingCell.appendChild(selectedIcon);
      }
    }

    primaryAction.appendChild(leadingCell);

    // Label (équivalent à .label dans Material Web)
    const labelWrapper = document.createElement('span');
    labelWrapper.classList.add('label');
    const label = document.createElement('span');
    label.classList.add('label-text');
    label.id = `chip-${index}-label`;
    label.textContent = chipData.text || String(chipData.id);
    labelWrapper.appendChild(label);
    primaryAction.appendChild(labelWrapper);

    // Touch target (équivalent à .touch dans Material Web)
    const touch = document.createElement('span');
    touch.classList.add('touch');
    primaryAction.appendChild(touch);

    container.appendChild(primaryAction);

    // Action trailing (bouton de suppression OU caret pour menu sur filter chips)
    if (chipDataWithDefaults.removable) {
      const trailingAction = this.createTrailingAction(chipDataWithDefaults, index);
      container.appendChild(trailingAction);
    } else if (hasMenuTrailingIcon) {
      const trailingIcon = this.createTrailingIcon(chipDataWithDefaults, index, wrapper);
      container.appendChild(trailingIcon);
    }

    wrapper.appendChild(container);

    // Configuration ARIA
    this.setupChipAria(wrapper, chipDataWithDefaults);

    // Configuration clavier et souris
    const isDisabled = chipDataWithDefaults.disabled && !chipDataWithDefaults.alwaysFocusable && !chipDataWithDefaults.softDisabled;
    if (!isDisabled) {
      this.setupChipKeyboard(wrapper, chipDataWithDefaults);
      this.setupChipMouse(wrapper, chipDataWithDefaults);
      this.setupChipRipple(wrapper, chipDataWithDefaults);
      this.setupChipFocusRing(wrapper, primaryId);
    }

    // Stocker les données sur l'élément
    setChipWrapperData(wrapper, chipDataWithDefaults);
    setChipWrapperIndex(wrapper, index);

    // Créer le cache DOM immédiatement après la création du chip
    // Cela évite les querySelector répétés dans les méthodes suivantes
    this.getDomCache(wrapper);

    return wrapper;
  }

  /**
   * Crée l'outline (équivalent à .outline dans Material Web)
   */
  private createOutline(): HTMLElement {
    const outline = document.createElement('span');
    outline.classList.add('outline');
    return outline;
  }

  /**
   * Crée l'élément focus ring (inspiré de Material Web md-focus-ring)
   */
  private createFocusRing(primaryId: string, container: HTMLElement): HTMLElement | null {
    const focusRing = document.createElement('k3ui-focus-ring');
    focusRing.setAttribute('part', 'focus-ring');
    focusRing.setAttribute('for', primaryId);
    return focusRing;
  }


  /**
   * Crée l'action principale (button, link ou span)
   * Inspiré de Material Web avec support des liens et soft-disabled
   */
  private createPrimaryAction(chipData: ChipDomData, container: HTMLElement): HTMLElement {
    if (chipData.href) {
      const link = document.createElement('a');
      link.classList.add('primary', 'action', 'link');
      link.href = chipData.href;
      link.id = 'chip-link';
      if (chipData.target) {
        link.target = chipData.target as '_blank' | '_parent' | '_self' | '_top';
      }
      if (chipData.text) {
        setAriaAttribute(link, 'label', chipData.text);
      }
      // Les liens ne peuvent pas être disabled dans Material Web
      return link;
    }

    if (chipData.type === 'input' && chipData.removable && !chipData.text) {
      // Mode remove-only (pas d'action principale)
      const span = document.createElement('span');
      span.classList.add('primary', 'action');
      if (chipData.text) {
        setAriaAttribute(span, 'label', chipData.text);
      }
      return span;
    }

    const button = document.createElement('button');
    button.classList.add('primary', 'action');
    button.type = 'button';
    button.id = 'chip-button';

    // Gestion du disabled (les liens ne peuvent pas être disabled)
    if (chipData.disabled && !chipData.alwaysFocusable) {
      button.disabled = true;
    }

    // Soft-disabled utilise aria-disabled au lieu de disabled
    if (chipData.softDisabled) {
      setAriaAttribute(button, 'disabled', 'true');
    }

    // ARIA pressed pour filter chips
    if (chipData.type === 'filter') {
      setAriaAttribute(button, 'pressed', String(chipData.selected));
    }

    if (chipData.text) {
      setAriaAttribute(button, 'label', chipData.text);
    }

    // Gestion du clic pour filter chips
    if (chipData.type === 'filter') {
      this.registerEvent(button, 'click', (event) => {
        // Récupérer les données à jour depuis l'élément DOM
        const wrapper = container.closest('.chip-wrapper') as HTMLElement;

        // Vérifier si c'est le chip "Tous" (select all) - il est séparé des données
        // Vérifier d'abord l'attribut data-select-all, puis l'ID, puis la référence
        const hasDataSelectAll = wrapper.hasAttribute('data-select-all') ||
          wrapper.getAttribute('data-select-all') === 'true';
        const chipDataFromWrapper = getChipWrapperData(wrapper)!;
        const isSystemSelectAll = chipDataFromWrapper && chipDataFromWrapper.id === 'system-select-all';
        const isSelectAll = hasDataSelectAll || isSystemSelectAll || wrapper === this.selectAllChipElement;

        if (isSelectAll) {
          // Pour le chip "Tous", récupérer les données depuis l'élément
          const selectAllChipData = chipDataFromWrapper;
          if (selectAllChipData && (selectAllChipData.disabled || selectAllChipData.softDisabled)) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }

          event.stopPropagation();
          event.preventDefault();

          // Toggle tous les autres chips filter
          this.toggleAllChips();
          return;
        }

        // Pour les chips normaux (dans les données)
        const index = this.chipElements.indexOf(wrapper);
        if (index === -1) return;

        // Utiliser les données stockées sur l'élément pour être sûr d'avoir les données à jour
        const currentChipData = getChipWrapperData(wrapper) || (this.chipsData[index] as ChipDomData);

        if (currentChipData.disabled || currentChipData.softDisabled) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        event.stopPropagation();
        event.preventDefault();

        // Toggle normal pour un chip individuel
        // Mettre à jour les données dans le tableau
        currentChipData.selected = !currentChipData.selected;
        this.chipsData[index] = { ...currentChipData };

        // Mettre à jour les données stockées sur l'élément
        setChipWrapperData(wrapper, { ...currentChipData });

        // Mettre à jour l'élément DOM
        this.updateChipElement(index, currentChipData);

        // Mettre à jour l'état du chip "Tous" si nécessaire
        this.updateSelectAllChipState();

        IconManager.forceDisplayIcons();

        // Appeler le callback
        if (this.options.onChipSelect) {
          this.options.onChipSelect(this.el, wrapper, currentChipData);
        }
      });
    }

    return button;
  }

  /**
   * Crée l'action trailing (bouton de suppression)
   */
  private createTrailingAction(chipData: ChipDomData, index: number): HTMLElement {
    const button = document.createElement('button');
    button.classList.add('trailing', 'action');
    // Empêcher l'auto-init du ripple sur cet élément
    button.classList.add('no-ripple');
    button.type = 'button';
    button.tabIndex = -1;

    // ARIA label pour le bouton de suppression
    const removeLabelId = `chip-${index}-remove-label`;
    const removeLabel = document.createElement('span');
    removeLabel.id = removeLabelId;
    removeLabel.setAttribute('hidden', '');
    removeLabel.setAttribute('aria-hidden', 'true');
    removeLabel.textContent = LocaleManager.t('chip.remove');
    button.appendChild(removeLabel);

    const ariaLabel = chipData.text
      ? `${LocaleManager.t('chip.removeChipLabel')} ${chipData.text}`
      : null;

    if (ariaLabel) {
      setAriaAttribute(button, 'label', ariaLabel);
    } else {
      // Utiliser aria-labelledby pour combiner "Remove" + label du chip
      const labelId = `chip-${index}-label`;
      setAriaAttribute(button, 'labelledby', `${removeLabelId} ${labelId}`);
    }

    // Focus ring pour le trailing action
    const trailingFocusRing = document.createElement('k3ui-focus-ring');
    trailingFocusRing.setAttribute('part', 'trailing-focus-ring');
    button.appendChild(trailingFocusRing);

    // Le ripple sera créé automatiquement par setupChipRipple

    // Icône trailing
    const icon = document.createElement('span');
    icon.classList.add('trailing', 'icon');
    icon.setAttribute('aria-hidden', 'true');

    const iconElement = document.createElement('i');
    iconElement.className = `${this.options.closeIconClass || 'k3ui-icon'}`;
    iconElement.setAttribute('name', 'xmark');
    icon.appendChild(iconElement);

    button.appendChild(icon);

    // Touch target
    const touch = document.createElement('span');
    touch.classList.add('touch');
    button.appendChild(touch);

    // Gestion du clic
    this.registerEvent(button, 'click', (event) => {
      event.stopPropagation();
      if (chipData.disabled || chipData.softDisabled) {
        return;
      }

      const wrapper = button.closest('.chip-wrapper') as HTMLElement;
      const chipIndex = this.chipElements.indexOf(wrapper);
      if (chipIndex !== -1) {
        // Dispatcher un événement 'remove' comme dans Material Web
        const removeEvent = new Event('remove', { cancelable: true, bubbles: true });
        const preventDefault = !wrapper.dispatchEvent(removeEvent);

        if (!preventDefault) {
          this.deleteChip(chipIndex);
        }
      }
    });

    // Gestion du focus pour la navigation entre primary et trailing
    this.registerEvent(button, 'focus', () => {
      const wrapper = button.closest('.chip-wrapper') as HTMLElement;
      const primaryAction = wrapper.querySelector('.chip-primary-action') as HTMLElement;
      if (primaryAction && primaryAction instanceof HTMLButtonElement) {
        primaryAction.tabIndex = -1;
        this.registerEvent(button, 'focusout', () => {
          if (primaryAction instanceof HTMLButtonElement) {
            primaryAction.tabIndex = 0;
          }
        }, { once: true });
      }
    });

    return button;
  }

  /**
   * Crée l'icône trailing (caret) pour les filter chips avec menu
   * L'icône est cliquable pour ouvrir un menu
   */
  private createTrailingIcon(chipData: ChipDomData, index: number, chipWrapper?: HTMLElement): HTMLElement {
    // Créer un trailing.action pour avoir une zone de clic de 24dp
    const trailingAction = document.createElement('button');
    trailingAction.classList.add('trailing', 'action');
    // Empêcher l'auto-init du ripple sur cet élément
    trailingAction.classList.add('no-ripple');
    trailingAction.type = 'button';
    trailingAction.tabIndex = -1;
    trailingAction.setAttribute('aria-label', ChipSpecs.accessibility.labels.openMenu);

    // Focus ring pour le trailing action
    const trailingFocusRing = document.createElement('k3ui-focus-ring');
    trailingFocusRing.setAttribute('part', 'trailing-focus-ring');
    trailingAction.appendChild(trailingFocusRing);

    // Le ripple sera créé automatiquement par setupChipRipple

    // L'icône elle-même reste à 18dp
    const iconWrapper = document.createElement('span');
    iconWrapper.classList.add('trailing', 'icon');
    iconWrapper.setAttribute('aria-hidden', 'true');

    const iconElement = document.createElement('i');
    iconElement.className = `${this.options.closeIconClass || 'k3ui-icon'}`;
    iconElement.setAttribute('name', chipData.trailingIcon || 'caret-down');
    iconWrapper.appendChild(iconElement);

    trailingAction.appendChild(iconWrapper);

    return trailingAction;
  }

  /**
   * Configure les attributs ARIA pour un chip
   */
  private setupChipAria(chipElement: HTMLElement, chipData: ChipDomData): void {
    const primaryAction = chipElement.querySelector('.chip-primary-action') as HTMLElement;
    if (!primaryAction) return;

    if (chipData.disabled) {
      setAriaAttribute(primaryAction, 'disabled', 'true');
    }

    if (chipData.type === 'filter') {
      setAriaAttribute(primaryAction, 'pressed', String(chipData.selected));
      setAriaAttribute(primaryAction, 'role', 'button');
    }

    if (chipData.value) {
      setAriaAttribute(primaryAction, 'value', chipData.value);
    }
  }

  /**
   * Configure les interactions souris pour un chip
   */
  private setupChipMouse(chipElement: HTMLElement, chipData: ChipDomData): void {
    // Pour les chips filter, la gestion du clic est faite dans handleContainerClick
    // pour éviter les conflits et permettre le toggle en un seul clic
    const mouse = new Mouse({
      target: chipElement,
      enabled: !chipData.disabled,
      onClick: (event: MouseEvent) => {
        // La logique de toggle pour les chips filter est gérée dans handleContainerClick
        // Pas besoin de la dupliquer ici
      }
    });

    this.mouseHandlers.set(chipElement, mouse);
    setChipMouse(chipElement, mouse);
  }

  /**
   * Configure les effets Ripple pour un chip - optimisé avec cache DOM
   * Le ripple doit être attaché à l'élément interactif (button/link), pas à la surface ripple
   */
  private setupChipRipple(chipElement: HTMLElement, chipData: ChipDomData): void {
    // Les input chips n'ont pas besoin de ripple
    // car ils sont principalement des éléments de saisie, pas des boutons interactifs
    if (chipData.type === 'input') {
      // Pas de ripple pour les input chips (ni primary action ni trailing action)
      return;
    }

    // Pour les filter chips avec menu, désactiver le ripple sur le primary action aussi
    // pour éviter les conflits visuels avec le trailing action (menu)
    if (chipData.type === 'filter' && chipData.menuItems && chipData.menuItems.length > 0) {
      // Pas de ripple pour les filter chips avec menu
      return;
    }

    // State layer sur le container ; ripple pressed sur toute la surface du chip
    const cache = this.domCache.get(chipElement);
    const container = cache?.container || chipElement.querySelector('.chip-container') as HTMLElement;
    if (container) {
      const ripple = createRipple(container, {
        disabled: chipData.href ? false : (chipData.disabled || chipData.softDisabled)
      });
      this.rippleInstances.set(chipElement, ripple);
      setChipRipple(chipElement, ripple);
    }

    // Pas de ripple sur les trailing actions pour éviter les conflits visuels
  }

  /**
   * Configure le Focus Ring pour un chip - optimisé avec cache DOM
   */
  private setupChipFocusRing(chipElement: HTMLElement, primaryId: string): void {
    // Utiliser le cache DOM si disponible
    const cache = this.domCache.get(chipElement);
    const primaryAction = cache?.primaryAction || chipElement.querySelector(`#${primaryId}, .primary.action`) as HTMLElement;
    if (primaryAction) {
      const focusRingElement = chipElement.querySelector('k3ui-focus-ring[part="focus-ring"]') as HTMLElement;
      if (focusRingElement) {
        const focusRing = FocusRing.attach(primaryAction);
        this.focusRingInstances.set(chipElement, focusRing);
        setChipFocusRing(chipElement, focusRing);
      }
    }

    const trailingAction = cache?.trailingAction || chipElement.querySelector('.trailing.action') as HTMLElement;
    if (trailingAction) {
      const trailingFocusRing = trailingAction.querySelector('k3ui-focus-ring[part="trailing-focus-ring"]') as HTMLElement;
      if (trailingFocusRing) {
        FocusRing.attach(trailingAction);
      }
    }
  }

  /**
   * Récupère ou crée le cache DOM pour un chip
   */
  private getDomCache(chipElement: HTMLElement): {
    container?: HTMLElement;
    primaryAction?: HTMLElement;
    trailingAction?: HTMLElement;
    leadingCell?: HTMLElement;
    labelText?: HTMLElement;
  } {
    if (!this.domCache.has(chipElement)) {
      const cache = {
        container: chipElement.querySelector('.chip-container') as HTMLElement | undefined,
        primaryAction: chipElement.querySelector('.primary.action') as HTMLElement | undefined,
        trailingAction: chipElement.querySelector('.trailing.action') as HTMLElement | undefined,
        leadingCell: chipElement.querySelector('.cell') as HTMLElement | undefined,
        labelText: chipElement.querySelector('.label-text') as HTMLElement | undefined
      };
      this.domCache.set(chipElement, cache);
    }
    return this.domCache.get(chipElement)!;
  }

  /**
   * Met à jour un chip existant (pour les filter chips) - optimisé avec cache DOM
   */
  private updateChipElement(index: number, chipData: ChipDomData): void {
    if (index < 0 || index >= this.chipElements.length) return;

    const chipElement = this.chipElements[index];
    if (!chipElement) return;

    // Utiliser le cache DOM au lieu de querySelector
    const cache = this.getDomCache(chipElement);

    // Mettre à jour les classes du wrapper
    if (chipData.selected) {
      chipElement.classList.add('chip-wrapper--selected');
    } else {
      chipElement.classList.remove('chip-wrapper--selected');
    }

    // Mettre à jour le container
    if (cache.container) {
      if (chipData.selected) {
        cache.container.classList.add('selected');
      } else {
        cache.container.classList.remove('selected');
      }
    }

    // Mettre à jour l'ARIA
    if (cache.primaryAction) {
      if (chipData.selected) {
        setAriaAttribute(cache.primaryAction, 'pressed', 'true');
      } else {
        setAriaAttribute(cache.primaryAction, 'pressed', 'false');
      }
    }

    // Pour les chips filter : mettre à jour l'icône checkmark en leading
    if (chipData.type === 'filter' && cache.leadingCell) {
      // Supprimer l'ancienne icône leading
      const oldIcon = cache.leadingCell.querySelector('.leading.icon');
      if (oldIcon) {
        oldIcon.remove();
      }

      // Ajouter le checkmark si sélectionné
      if (chipData.selected) {
        const selectedIcon = document.createElement('span');
        selectedIcon.classList.add('leading', 'icon');
        selectedIcon.setAttribute('aria-hidden', 'true');
        // Toujours utiliser le checkmark pour les chips filter
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'checkmark');
        svg.setAttribute('viewBox', '0 0 18 18');
        svg.setAttribute('aria-hidden', 'true');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M6.75012 12.1274L3.62262 8.99988L2.55762 10.0574L6.75012 14.2499L15.7501 5.24988L14.6926 4.19238L6.75012 12.1274Z');
        svg.appendChild(path);
        selectedIcon.appendChild(svg);
        cache.leadingCell.appendChild(selectedIcon);
      }

      // Mettre à jour la classe has-icon sur le container
      if (cache.container) {
        if (chipData.selected) {
          chipElement.classList.add('has-icon');
          cache.container.classList.add('has-icon');
        } else {
          chipElement.classList.remove('has-icon');
          cache.container.classList.remove('has-icon');
        }
      }
    }
  }

  /**
   * Batch update avec requestAnimationFrame pour optimiser les mises à jour multiples
   */
  private scheduleUpdate(index: number): void {
    this.updateQueue.add(index);

    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(() => {
        // Traiter toutes les mises à jour en batch
        this.updateQueue.forEach(idx => {
          if (idx >= 0 && idx < this.chipsData.length) {
            const chipData = this.chipsData[idx] as ChipDomData;
            this.updateChipElement(idx, chipData);
          }
        });

        this.updateQueue.clear();
        this.rafId = null;
      });
    }
  }

  /**
   * Bascule la sélection d'un chip (pour filter chips)
   * @deprecated Utiliser updateChipElement directement
   */
  private toggleChipSelection(index: number): void {
    if (index < 0 || index >= this.chipsData.length) return;

    const chipData = this.chipsData[index] as ChipDomData;
    // Seuls les filter chips peuvent être sélectionnés/désélectionnés
    if (chipData.type !== 'filter') {
      return;
    }

    // Toggle la sélection
    chipData.selected = !chipData.selected;

    // Mettre à jour les données dans le tableau
    this.chipsData[index] = { ...chipData };

    // Mettre à jour les données stockées sur l'élément DOM
    const chipElement = this.chipElements[index];
    if (chipElement) {
      setChipWrapperData(chipElement, { ...chipData });
      this.updateChipElement(index, chipData);
    }

    // Mettre à jour l'état du chip "Tous" si nécessaire
    this.updateSelectAllChipState();

    // Appeler le callback
    if (this.options.onChipSelect && chipElement) {
      this.options.onChipSelect(this.el, chipElement, chipData);
    }
  }

  /**
   * Met à jour l'état du chip "Tous" en fonction de l'état des chips filter - optimisé avec cache DOM
   */
  private updateSelectAllChipState(): void {
    if (!this.selectAllChipElement) return;

    // Compter les filter chips sélectionnés (optimisé avec une seule boucle)
    let filterChipsCount = 0;
    let selectedCount = 0;
    for (let i = 0; i < this.chipsData.length; i++) {
      const chip = this.chipsData[i] as ChipDomData;
      if (chip.type === 'filter') {
        filterChipsCount++;
        if (chip.selected) {
          selectedCount++;
        }
      }
    }
    const allSelected = filterChipsCount > 0 && selectedCount === filterChipsCount;

    // Mettre à jour les données du chip "Tous"
    const selectAllChipData = getChipWrapperData(this.selectAllChipElement)!;
    if (selectAllChipData) {
      selectAllChipData.selected = allSelected;
      setChipWrapperData(this.selectAllChipElement, { ...selectAllChipData });

      // Utiliser le cache DOM
      const cache = this.getDomCache(this.selectAllChipElement);

      // Mettre à jour l'affichage
      if (allSelected) {
        this.selectAllChipElement.classList.add('chip-wrapper--selected');
        if (cache.container) {
          cache.container.classList.add('selected');
        }
        if (cache.primaryAction) {
          setAriaAttribute(cache.primaryAction, 'pressed', 'true');
        }
        // Ajouter l'icône check-all si nécessaire
        if (cache.leadingCell && !cache.leadingCell.querySelector('.leading.icon')) {
          const selectedIcon = document.createElement('span');
          selectedIcon.classList.add('leading', 'icon');
          selectedIcon.setAttribute('aria-hidden', 'true');
          // Utiliser l'icône "check-all" pour le chip "Tous"
          const iconElement = document.createElement('i');
          iconElement.className = `${this.options.closeIconClass || 'k3ui-icon'}`;
          iconElement.setAttribute('name', 'check-all');
          selectedIcon.appendChild(iconElement);
          cache.leadingCell.appendChild(selectedIcon);
          this.selectAllChipElement.classList.add('has-icon');
          if (cache.container) {
            cache.container.classList.add('has-icon');
          }
        }
      } else {
        this.selectAllChipElement.classList.remove('chip-wrapper--selected');
        if (cache.container) {
          cache.container.classList.remove('selected');
        }
        if (cache.primaryAction) {
          setAriaAttribute(cache.primaryAction, 'pressed', 'false');
        }
        // Supprimer le checkmark
        if (cache.leadingCell) {
          const oldIcon = cache.leadingCell.querySelector('.leading.icon');
          if (oldIcon) {
            oldIcon.remove();
          }
          this.selectAllChipElement.classList.remove('has-icon');
          if (cache.container) {
            cache.container.classList.remove('has-icon');
          }
        }
      }
    }
  }

  /**
   * Sélectionne/désélectionne tous les chips filter (le chip "Tous" est séparé des données)
   */
  private toggleAllChips(): void {
    if (!this.selectAllChipElement) {
      this.logger.warn('toggleAllChips: Select all chip element not found');
      return;
    }

    // Récupérer l'état actuel du chip "Tous"
    const selectAllChipData = getChipWrapperData(this.selectAllChipElement)!;
    if (!selectAllChipData) {
      this.logger.warn('toggleAllChips: Select all chip data not found');
      return;
    }

    // Toggle le chip "Tous" d'abord
    const previousState = selectAllChipData.selected;
    const newSelectedState = !previousState;
    selectAllChipData.selected = newSelectedState;

    // Mettre à jour les données stockées sur l'élément DOM
    setChipWrapperData(this.selectAllChipElement, { ...selectAllChipData });

    // Mettre à jour l'élément DOM du chip "Tous" - optimisé avec cache DOM
    // Note: updateChipElement attend un index, mais le chip "Tous" n'est pas dans chipElements
    // On doit le mettre à jour manuellement
    const cache = this.getDomCache(this.selectAllChipElement);

    if (newSelectedState) {
      this.selectAllChipElement.classList.add('chip-wrapper--selected');
      if (cache.container) {
        cache.container.classList.add('selected');
      }
      if (cache.primaryAction) {
        setAriaAttribute(cache.primaryAction, 'pressed', 'true');
      }
      // Ajouter l'icône check-all pour le chip "Tous"
      if (cache.leadingCell) {
        const oldIcon = cache.leadingCell.querySelector('.leading.icon');
        if (oldIcon) {
          oldIcon.remove();
        }
        const selectedIcon = document.createElement('span');
        selectedIcon.classList.add('leading', 'icon');
        selectedIcon.setAttribute('aria-hidden', 'true');
        // Utiliser l'icône "check-all" pour le chip "Tous"
        const iconElement = document.createElement('i');
        iconElement.className = `${this.options.closeIconClass || 'k3ui-icon'}`;
        iconElement.setAttribute('name', 'check-all');
        selectedIcon.appendChild(iconElement);
        cache.leadingCell.appendChild(selectedIcon);
        this.selectAllChipElement.classList.add('has-icon');
        if (cache.container) {
          cache.container.classList.add('has-icon');
        }
      }
    } else {
      this.selectAllChipElement.classList.remove('chip-wrapper--selected');
      if (cache.container) {
        cache.container.classList.remove('selected');
      }
      if (cache.primaryAction) {
        setAriaAttribute(cache.primaryAction, 'pressed', 'false');
      }
      // Supprimer le checkmark
      if (cache.leadingCell) {
        const oldIcon = cache.leadingCell.querySelector('.leading.icon');
        if (oldIcon) {
          oldIcon.remove();
        }
        this.selectAllChipElement.classList.remove('has-icon');
        if (cache.container) {
          cache.container.classList.remove('has-icon');
        }
      }
    }

    // Appliquer le même état à tous les chips filter (dans les données utilisateur)
    // Optimisé avec une seule boucle
    let updatedCount = 0;
    const updatedChips: Array<{ element: HTMLElement; data: ChipDomData }> = [];

    for (let index = 0; index < this.chipsData.length; index++) {
      const chipData = this.chipsData[index] as ChipDomData;
      if (chipData.type === 'filter' && !chipData.disabled) {
        // Mettre à jour l'état
        chipData.selected = newSelectedState;

        // Mettre à jour les données dans le tableau
        this.chipsData[index] = { ...chipData };

        // Mettre à jour les données stockées sur l'élément DOM
        const chipElement = this.chipElements[index];
        if (chipElement) {
          setChipWrapperData(chipElement, { ...chipData });
          this.updateChipElement(index, chipData);
          updatedCount++;
          updatedChips.push({ element: chipElement, data: chipData });
        }
      }
    }

    // Appeler les callbacks après toutes les mises à jour
    if (this.options.onChipSelect) {
      updatedChips.forEach(({ element, data }) => {
        this.options.onChipSelect!(this.el, element, data);
      });
    }

    // Appeler le callback pour le chip "Tous" en dernier
    if (this.options.onChipSelect && this.selectAllChipElement) {
      this.options.onChipSelect(this.el, this.selectAllChipElement, selectAllChipData);
    }

    // Forcer le refresh des icônes
    IconManager.forceDisplayIcons();

    this.logger.info(`toggleAllChips: Updated ${updatedCount} chips to ${newSelectedState ? 'selected' : 'unselected'}`);
  }

  /**
   * Ajout d'un chip
   */
  public addChip(chipData: ChipData | ChipDomData): void {
    const limit = this.options.limit ?? Infinity;
    if (this.chipsData.length >= limit) {
      this.logger.warn('Chip limit reached');
      return;
    }

    // Vérifier si le chip existe déjà
    const exists = this.chipsData.some(chip => chip.id === chipData.id);
    if (exists) {
      this.logger.warn('Chip already exists');
      return;
    }

    // Convertir les variants valides vers les types internes
    let type: 'assist' | 'filter' | 'input' | 'suggestion' = (chipData as ChipDomData).type || 'assist';
    if (this.options.variant) {
      // Mapper les variants valides vers les types internes
      if (this.options.variant === 'input' || this.options.variant === 'action') {
        type = 'input';
      } else if (this.options.variant === 'filter' || this.options.variant === 'choice') {
        type = 'filter';
      }
    }

    const extendedChipData: ChipDomData = {
      ...chipData,
      type
    };

    this.chipsData.push(extendedChipData);
    const chipElement = this.createChipElement(extendedChipData, this.chipsData.length - 1);

    // Insérer avant le wrapper de l'input si présent
    if (this.inputWrapper) {
      this.el.insertBefore(chipElement, this.inputWrapper);
    } else {
      this.el.appendChild(chipElement);
    }

    this.chipElements.push(chipElement);
    this.updatePlaceholder();
    this.updateState();

    // Appeler le callback
    if (this.options.onChipAdd) {
      this.options.onChipAdd(extendedChipData, this);
    }

    this.logger.success('Chip added successfully');
  }

  /**
   * Suppression d'un chip - optimisé
   */
  public deleteChip(index: number): void {
    if (index < 0 || index >= this.chipsData.length) {
      this.logger.warn('Invalid chip index');
      return;
    }

    const chipData = this.chipsData[index];
    const chipElement = this.chipElements[index];

    // Nettoyer les handlers
    this.cleanupChipHandlers(chipElement);

    // Nettoyer le cache DOM
    this.domCache.delete(chipElement);

    // Supprimer les données
    this.chipsData = removeItemAtIndex(this.chipsData, index);
    this.chipElements = removeItemAtIndex(this.chipElements, index);

    // Supprimer l'élément DOM
    chipElement.remove();

    // Réindexer les chips restants (optimisé avec une seule boucle)
    for (let i = 0; i < this.chipElements.length; i++) {
      setChipWrapperIndex(this.chipElements[i], i);
    }

    this.updatePlaceholder();
    this.updateState();

    // Appeler le callback
    if (this.options.onChipDelete) {
      this.options.onChipDelete(this.el, chipElement, chipData);
    }

    this.logger.success('Chip deleted successfully');
  }

  /**
   * Nettoie les handlers d'un chip
   */
  private cleanupChipHandlers(chipElement: HTMLElement): void {
    // Nettoyer le keyboard handler
    const keyboard = getChipKeyboard(chipElement);
    if (keyboard) {
      keyboard.destroy();
      deleteChipKeyboard(chipElement);
    }

    // Nettoyer le mouse handler
    const mouse = this.mouseHandlers.get(chipElement);
    if (mouse) {
      mouse.destroy();
      this.mouseHandlers.delete(chipElement);
    }

    // Nettoyer le ripple
    const ripple = this.rippleInstances.get(chipElement);
    if (ripple) {
      ripple.destroy();
      this.rippleInstances.delete(chipElement);
    }

    // Nettoyer le focus ring
    const focusRing = this.focusRingInstances.get(chipElement);
    if (focusRing) {
      focusRing.destroy();
      this.focusRingInstances.delete(chipElement);
      deleteChipFocusRing(chipElement);
    }

    this.keyboardHandlers.delete(chipElement);
  }

  /**
   * Sélection d'un chip
   */
  public selectChip(index: number): void {
    if (index < 0 || index >= this.chipElements.length) {
      this.logger.warn('Invalid chip index');
      return;
    }

    // Désélectionner le chip précédent
    if (this.selectedChip) {
      this.selectedChip.classList.remove('chip--selected');
    }

    // Sélectionner le nouveau chip
    this.selectedChip = this.chipElements[index];
    this.selectedChip.classList.add('chip--selected');
    this.selectedChip.focus();

    const chipData = this.chipsData[index];

    // Appeler le callback
    if (this.options.onChipSelect) {
      this.options.onChipSelect(this.el, this.selectedChip, chipData);
    }

    this.logger.success('Chip selected successfully');
  }

  /**
   * Mise à jour de l'état du composant
   */
  private updateState(): void {
    // Ajouter/supprimer la classe vide
    if (this.chipsData.length === 0) {
      this.el.classList.add('chips--empty');
    } else {
      this.el.classList.remove('chips--empty');
    }

    // Ajouter/supprimer la classe avec limite atteinte
    if (this.chipsData.length >= (this.options.limit ?? Number.POSITIVE_INFINITY)) {
      this.el.classList.add('chips--limit-reached');
    } else {
      this.el.classList.remove('chips--limit-reached');
    }
  }

  /**
   * Mise à jour des options
   */
  public updateOptions(newOptions: Partial<ChipOptions>): void {
    this.options = { ...this.options, ...newOptions };
    this.updateState();
    this.logger.success('Options updated successfully');
  }

  /**
   * Récupération des données des chips
   */
  public getData(): ChipData[] {
    return [...this.chipsData];
  }

  /**
   * Définition des données des chips
   */
  public setData(data: ChipData[]): void {
    // Filtrer le chip "Tous" des données utilisateur s'il existe
    // Le chip "Tous" sera géré séparément par le système
    this.chipsData = data.filter(chip => {
      const extendedChip = chip as ChipDomData;
      const text = extendedChip.text?.trim().toLowerCase() || '';
      const value = extendedChip.value?.trim().toLowerCase() || '';
      return text !== 'tous' && text !== 'all' && value !== 'tous' && value !== 'all';
    });
    this.renderChips();
    this.updateState();
    this.logger.success('Data updated successfully');
  }

  /**
   * Focus sur l'input
   */
  public focus(): void {
    if (this.inputElement) {
      this.inputElement.focus();
    }
  }

  /**
   * Perte de focus
   */
  public blur(): void {
    if (this.inputElement) {
      this.inputElement.blur();
    }
  }

  /**
   * Nettoyage du composant - optimisé
   */
  destroy(): void {
    try {
      // Annuler le requestAnimationFrame en cours si présent
      if (this.rafId !== null) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }

      // Nettoyer tous les handlers des chips
      this.chipElements.forEach(chip => {
        this.cleanupChipHandlers(chip);
        chip.remove();
      });

      // Nettoyer le chip "Tous" s'il existe
      if (this.selectAllChipElement) {
        this.cleanupChipHandlers(this.selectAllChipElement);
        this.selectAllChipElement.remove();
        this.selectAllChipElement = null;
      }

      this.chipElements = [];
      this.chipsData = [];
      this.keyboardHandlers.clear();
      this.mouseHandlers.clear();
      this.rippleInstances.clear();
      this.focusRingInstances.clear();
      this.domCache.clear(); // Nettoyer le cache DOM
      this.updateQueue.clear(); // Nettoyer la queue de mises à jour

      // Nettoyer le field de saisie si présent
      if (this.inputFieldInstance) {
        this.inputFieldInstance.destroy();
        this.inputFieldInstance = null;
      }

      if (this.inputWrapper) {
        this.inputWrapper.remove();
        this.inputWrapper = null;
      }

      this.inputFieldElement = null;
      this.inputElement = null;

      // Supprimer l'instance
      super.destroy();

      this.logger.success('Chip destroyed successfully');
    } catch (error) {
      this.logger.error('Failed to destroy Chip:', error);
    }
  }

  /**
   * Récupération de l'instance
   */
  static getInstance(el: HTMLElement): Chip | undefined {
    return Component.getInstance(el) as Chip | undefined;
  }

  /**
   * Options par défaut
   */
  static get defaults(): ChipOptions {
    return _defaults;
  }

  /**
   * Initialisation du composant
   */
  static init(
    els: HTMLElement | InitElements<KElement>,
    options?: Partial<ChipOptions>
  ): Chip | Chip[] {
    if (els instanceof Element) {
      return new Chip(els as HTMLElement, options);
    } else if (!!els && els.length) {
      const instances: Chip[] = [];
      for (let i = 0; i < els.length; i++) {
        instances.push(new Chip(els[i] as HTMLElement, options));
      }
      return instances;
    }
    return [];
  }
}

// Déclaration pour TypeScript
declare global {
  interface Window {
    Chip: typeof Chip;
  }
}

// Custom Element <k3ui-chip> - Initialisation par AutoInit
if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-chip')) {
  customElements.define('k3ui-chip', class extends HTMLElement {
    private chipInstance: Chip | null = null;

    connectedCallback(): void {
      if (!this.hasAttribute('data-initialized')) {
        this.setAttribute('data-initialized', 'true');
      }
    }

    disconnectedCallback(): void {
      const instance = Chip.getInstance(this as HTMLElement);
      if (instance && typeof instance.destroy === 'function') instance.destroy();
      this.chipInstance = null;
    }
  });
} 