/**
 * @fileoverview Composant Autocomplete pour K3UI
 * @description Champ texte + suggestions via Menu M3 Expressive (listbox / combobox)
 * @author K3UI Team
 * @version 1.1.0
 * @element k3ui-autocomplete
 */

import { Component } from '../core/base/Component';
import { toComponentClassDef } from '../types/components/component-base';
import type {
  AutocompleteFilterMode,
  AutocompleteOptionData,
  AutocompleteOptions,
  MenuItem,
  MenuOptions,
} from '../types/components';
import { PriorityLevel } from '../types/base';
import { LoggerManager, ManagerFactory, LocaleManager, Keyboard } from '../core/managers';
import { setAriaAttribute, setAriaAttributes, removeAriaAttribute } from '../utils/dom/aria';
import { generateGuid } from '../utils/helpers';
import { setMenuTriggerElement } from '../types/dom/k3ui-menu-element';
import { getAutocompleteDefaults } from '../specs/components/autocomplete.specs';
import { Menu } from './Menu';

const _defaults: AutocompleteOptions = getAutocompleteDefaults();

interface KAutocompleteHTMLElement extends HTMLElement {
  K_Autocomplete?: Autocomplete;
}

/**
 * Classe Autocomplete pour K3UI
 * @description Enrichit un input / k3ui-field avec un Menu filtrable (ARIA combobox)
 */
export class Autocomplete extends Component<AutocompleteOptions> {
  declare el: HTMLElement;

  readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

  private logger: LoggerManager;
  private input: HTMLInputElement | null = null;
  private fieldHost: HTMLElement | null = null;
  private menuEl: HTMLElement | null = null;
  private menu: Menu | null = null;
  private statusEl: HTMLElement | null = null;
  private keyboard: Keyboard | null = null;

  private allOptions: AutocompleteOptionData[] = [];
  private visibleOptions: AutocompleteOptionData[] = [];
  private activeIndex = -1;
  private inputChanged = false;
  private committed: AutocompleteOptionData | null = null;
  private uid = '';
  private _pendingRequiredOnClose = false;
  private _destroying = false;
  /** Ignore openOnFocus pendant un focus programmatique */
  private _suppressOpenOnFocus = false;
  /** Remettre le focus input après fermeture (sélection / Escape), pas après clic extérieur */
  private _restoreInputFocusOnClose = false;

  static get defaults(): AutocompleteOptions {
    return { ..._defaults };
  }

  /**
   * Obtient l'instance associée à un élément
   * @param el Élément hôte
   */
  static getInstance(el: HTMLElement): Autocomplete | undefined {
    return (el as KAutocompleteHTMLElement).K_Autocomplete;
  }

  /**
   * Initialise un ou plusieurs Autocomplete
   * @param els Élément(s) ou sélecteur
   * @param options Options
   */
  static init(
    els: HTMLElement | NodeListOf<HTMLElement> | string,
    options: Partial<AutocompleteOptions> = {}
  ): Autocomplete[] {
    return super.init(els, options, toComponentClassDef(Autocomplete)) as Autocomplete[];
  }

  /**
   * Lit les attributs HTML vers des options
   * @param el Élément hôte
   */
  static readAttributes(el: HTMLElement): Partial<AutocompleteOptions> {
    const o: Partial<AutocompleteOptions> = {};
    const forAttr = el.getAttribute('for') || el.getAttribute('data-for');
    if (forAttr) o.for = forAttr;

    const filter = el.getAttribute('filter') || el.getAttribute('data-filter');
    if (
      filter === 'contains' ||
      filter === 'starts-with' ||
      filter === 'ends-with' ||
      filter === 'none'
    ) {
      o.filter = filter;
    }

    if (el.hasAttribute('case-sensitive') || el.getAttribute('data-case-sensitive') === 'true') {
      o.caseSensitive = true;
    }
    if (el.hasAttribute('auto-activate') || el.getAttribute('data-auto-activate') === 'true') {
      o.autoActivate = true;
    }
    if (el.hasAttribute('required') || el.getAttribute('data-required') === 'true') {
      o.required = true;
    }
    if (el.hasAttribute('hide-no-data') || el.getAttribute('data-hide-no-data') === 'true') {
      o.hideNoData = true;
    }
    if (el.hasAttribute('hide-loading') || el.getAttribute('data-hide-loading') === 'true') {
      o.hideLoading = true;
    }
    if (el.hasAttribute('loading') || el.getAttribute('data-loading') === 'true') {
      o.loading = true;
    }
    const panelClass = el.getAttribute('panel-class') || el.getAttribute('data-panel-class');
    if (panelClass) o.panelClass = panelClass;

    return o;
  }

  constructor(el: HTMLElement, options: Partial<AutocompleteOptions> = {}) {
    const htmlOptions = Autocomplete.readAttributes(el);
    super(el, { ...options, ...htmlOptions }, toComponentClassDef(Autocomplete));

    this.logger = ManagerFactory.getLoggerManager('[Autocomplete]');
    this.options = { ...Autocomplete.defaults, ...htmlOptions, ...options };
    (el as KAutocompleteHTMLElement).K_Autocomplete = this;
    this.uid = `k3ui-autocomplete-${generateGuid()}`;

    this.initComponent();
  }

  /** Indique si le panneau (Menu) est ouvert */
  public get open(): boolean {
    return this.menu?.isOpen ?? false;
  }

  /** Valeur commitée */
  public get value(): string | null {
    return this.committed?.value ?? null;
  }

  /** Option sélectionnée */
  public get selected(): AutocompleteOptionData | null {
    return this.committed;
  }

  /**
   * Options courantes (données)
   */
  public getOptions(): AutocompleteOptionData[] {
    return this.allOptions.map((o) => ({ ...o }));
  }

  /**
   * Remplace les options et rafraîchit le menu
   * @param options Liste d'options
   */
  public setOptions(options: AutocompleteOptionData[]): void {
    this.options.options = options;
    this.allOptions = options.map((o) => ({ ...o }));
    this.refreshMenuItems();
    if (this.menu?.isOpen) {
      this.updatePanelVisibility();
    }
  }

  /**
   * Définit l'état de chargement
   * @param loading Chargement en cours
   */
  public setLoading(loading: boolean): void {
    this.options.loading = loading;
    this.refreshMenuItems();
    if (loading) {
      this.announce(LocaleManager.t('autocomplete.loadingLabel'));
      if (this.input === document.activeElement) {
        this.openPanel();
      }
    } else if (this.menu?.isOpen) {
      this.updatePanelVisibility();
    }
  }

  /**
   * Ouvre le panneau de suggestions (Menu)
   */
  public openPanel(): void {
    if (!this.input || this.input.disabled || this.input.readOnly) return;
    this.refreshMenuItems();
    if (!this.shouldShowPanel()) return;

    this.options.onOpenStart?.(this);
    this.el.dispatchEvent(new CustomEvent('toggle', { bubbles: true, detail: { open: true } }));

    if (!this.menu?.isOpen) {
      this.menu?.open();
    }
    setAriaAttribute(this.input, 'expanded', 'true');
    this.syncActiveVisual();
    this.options.onOpenEnd?.(this);
  }

  /**
   * Ferme le panneau de suggestions
   * @param restoreRequired Applique la règle `required` (via onCloseEnd Menu)
   */
  public closePanel(restoreRequired = false): void {
    if (!this.menu?.isOpen) {
      if (restoreRequired) this.applyRequiredOnClose();
      return;
    }

    this.options.onCloseStart?.(this);
    this.el.dispatchEvent(new CustomEvent('toggle', { bubbles: true, detail: { open: false } }));
    // Menu.onCloseEnd gère aria, required ; focus input seulement si demandé
    this._pendingRequiredOnClose = restoreRequired;
    this._restoreInputFocusOnClose = true;
    this.menu.close();
    this.options.onCloseEnd?.(this);
  }

  /**
   * Efface la valeur
   * @param restoreFocus Remet le focus sur l'input
   */
  public clear(restoreFocus = false): void {
    if (!this.input) return;
    const hadValue = this.committed !== null || this.input.value.length > 0;
    this.input.value = '';
    this.committed = null;
    this.inputChanged = true;
    this.refreshMenuItems();
    if (hadValue) {
      this.emitChange(null, null);
    }
    if (restoreFocus) {
      this.input.focus();
    } else {
      this.closePanel();
    }
  }

  /**
   * Définit la valeur commitée
   * @param value Valeur d'option
   */
  public setValue(value: string | null): void {
    if (value === null) {
      this.clear(false);
      return;
    }
    const match = this.allOptions.find((o) => o.value === value);
    if (match) {
      this.commitOption(match, false);
    } else if (this.input) {
      this.input.value = value;
      this.committed = { value, label: value };
      this.emitChange(value, value);
    }
  }

  /**
   * Détruit l'instance
   */
  public override destroy(): void {
    this._destroying = true;
    this.keyboard?.destroy();
    this.keyboard = null;
    if (this.menu?.isOpen) {
      this.menu.close();
    }
    this.menu?.destroy();
    this.menu = null;
    this.detachInputAria();
    this.statusEl?.remove();
    this.statusEl = null;
    this.menuEl?.remove();
    this.menuEl = null;
    this.allOptions = [];
    this.visibleOptions = [];

    if ((this.el as KAutocompleteHTMLElement).K_Autocomplete === this) {
      delete (this.el as KAutocompleteHTMLElement).K_Autocomplete;
    }
    this.logger.info('Autocomplete destroyed');
    super.destroy();
  }

  // --------------------------------------------------------------------------
  // Init
  // --------------------------------------------------------------------------

  private initComponent(): void {
    this.el.classList.add('autocomplete');
    this.resolveInput();
    if (!this.input) {
      this.logger.warn('Aucun input associé (for / data-for / input interne)');
      return;
    }

    this.input.autocomplete = 'off';
    this.setupInputAria();
    this.collectOptions();
    this.ensureStatusLiveRegion();
    this.setupMenu();
    this.bindEvents();
    this.refreshMenuItems();
    this.logger.info('Autocomplete initialized');
  }

  private resolveInput(): void {
    const forId = this.options.for;
    if (forId) {
      const target = document.getElementById(forId);
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        this.input = target as HTMLInputElement;
        this.fieldHost = target.closest('k3ui-field') as HTMLElement | null;
        return;
      }
      if (target) {
        this.fieldHost = target;
        const nested = target.querySelector(
          'input.input:not([type="hidden"]), input:not([type="hidden"]), textarea'
        ) as HTMLInputElement | null;
        if (nested) {
          this.input = nested;
          return;
        }
      }
    }
    const nested = this.el.querySelector(
      'input:not([type="hidden"]), textarea'
    ) as HTMLInputElement | null;
    this.input = nested;
    this.fieldHost = nested?.closest('k3ui-field') as HTMLElement | null;
  }

  private collectOptions(): void {
    if (this.options.options && this.options.options.length > 0) {
      this.allOptions = this.options.options.map((o) => ({ ...o }));
      return;
    }

    const nodes = Array.from(
      this.el.querySelectorAll(
        '.autocomplete__option, [data-autocomplete-option], option, li[role="option"], li'
      )
    ) as HTMLElement[];

    const seen = new Set<HTMLElement>();
    const items: AutocompleteOptionData[] = [];

    for (const node of nodes) {
      if (seen.has(node)) continue;
      if (node.closest('k3ui-menu')) continue;
      if (
        node.tagName === 'LI' &&
        !node.classList.contains('autocomplete__option') &&
        !node.hasAttribute('data-autocomplete-option') &&
        node.getAttribute('role') !== 'option'
      ) {
        const parent = node.parentElement;
        if (
          parent &&
          !parent.classList.contains('autocomplete__options') &&
          parent.tagName !== 'UL' &&
          parent.tagName !== 'OL'
        ) {
          continue;
        }
      }
      seen.add(node);
      const label = (node.textContent || '').trim();
      if (!label) continue;
      const value =
        node.getAttribute('data-value') ||
        (node instanceof HTMLOptionElement ? node.value : null) ||
        label;
      const disabled =
        node.hasAttribute('disabled') ||
        node.getAttribute('aria-disabled') === 'true' ||
        (node instanceof HTMLOptionElement && node.disabled);
      items.push({ value, label, disabled });
      node.classList.add('autocomplete__option--source');
      node.setAttribute('hidden', '');
    }

    this.allOptions = items;
  }

  private ensureStatusLiveRegion(): void {
    if (this.statusEl) return;
    this.statusEl = document.createElement('div');
    this.statusEl.className = 'autocomplete__status';
    this.statusEl.id = `${this.uid}-status`;
    setAriaAttributes(this.statusEl, { live: 'polite', atomic: 'true' });
    this.el.appendChild(this.statusEl);
  }

  private setupMenu(): void {
    if (!this.input) return;

    this.menuEl = document.createElement('k3ui-menu');
    this.menuEl.id = `${this.uid}-menu`;
    this.menuEl.setAttribute('data-no-auto-init', 'true');
    this.menuEl.setAttribute('role', 'listbox');
    if (this.options.panelClass) {
      this.menuEl.className = this.options.panelClass;
    }
    this.el.appendChild(this.menuEl);

    const trigger = this.fieldHost || this.input;
    setMenuTriggerElement(this.menuEl, trigger);
    trigger.classList.add('autocomplete-trigger', 'menu-trigger');
    trigger.setAttribute('data-target', this.menuEl.id);

    const menuOptions: Partial<MenuOptions> = {
      ...Menu.defaults,
      items: [],
      closeOnClick: true,
      // L’Autocomplete pilote open/close : éviter le toggle Menu sur le trigger
      // (sinon openOnFocus + clic input → ouverture puis fermeture immédiate).
      triggerToggle: false,
      restoreFocus: false,
      coverTrigger: false,
      autoFocus: false,
      placement: 'bottom-start',
      constrainWidth: true,
      onItemClick: (item: MenuItem) => {
        if (item.disabled || item.id?.startsWith('ac-meta-')) return;
        const opt = this.visibleOptions.find(
          (o) => o.value === item.value || o.value === item.id || o.label === (item.label || item.text)
        );
        if (opt) {
          this.commitOption(opt, true);
        }
      },
      onOpenStart: () => {
        setAriaAttribute(this.input!, 'expanded', 'true');
      },
      onOpenEnd: () => {
        // Garder le focus saisie sans retrigger openOnFocus
        this.focusInputQuiet();
        if (this.options.autoActivate && this.visibleOptions.length > 0) {
          this.activeIndex = 0;
        }
        this.syncActiveVisual();
      },
      onCloseStart: () => {
        setAriaAttribute(this.input!, 'expanded', 'false');
        // Empêche une réouverture si un focus résiduel arrive pendant la fermeture
        this._suppressOpenOnFocus = true;
      },
      onCloseEnd: () => {
        this.activeIndex = -1;
        this.clearActiveDescendant();
        if (this._pendingRequiredOnClose) {
          this.applyRequiredOnClose();
          this._pendingRequiredOnClose = false;
        }
        this.inputChanged = false;
        const shouldRestore = this._restoreInputFocusOnClose;
        this._restoreInputFocusOnClose = false;
        if (shouldRestore) {
          this.focusInputQuiet();
        } else {
          // Clic extérieur : laisser le focus où il est, lever le suppress au tick suivant
          window.setTimeout(() => {
            this._suppressOpenOnFocus = false;
          }, 0);
        }
      },
    };

    const result = Menu.init(this.menuEl, menuOptions);
    this.menu = (Array.isArray(result) ? result[0] : result) as Menu;
  }

  private setupInputAria(): void {
    if (!this.input) return;
    setAriaAttributes(this.input, {
      role: 'combobox',
      autocomplete: 'list',
      expanded: 'false',
      controls: `${this.uid}-menu`,
      haspopup: 'listbox',
    });
    if (!this.input.getAttribute('aria-label') && !this.input.id) {
      setAriaAttribute(this.input, 'label', LocaleManager.t('autocomplete.ariaLabel'));
    }
  }

  private detachInputAria(): void {
    if (!this.input) return;
    removeAriaAttribute(this.input, 'role');
    removeAriaAttribute(this.input, 'autocomplete');
    removeAriaAttribute(this.input, 'expanded');
    removeAriaAttribute(this.input, 'controls');
    removeAriaAttribute(this.input, 'haspopup');
    removeAriaAttribute(this.input, 'activedescendant');
  }

  private bindEvents(): void {
    if (!this.input) return;

    this.registerEvent(this.input, 'focus', () => this.handleFocus());
    this.registerEvent(this.input, 'blur', () => this.handleBlur());
    this.registerEvent(this.input, 'input', () => this.handleInput());
    // Ne pas basculer fermé au re-clic (combobox) — Menu.triggerToggle=false évite le double toggle
    this.registerEvent(this.input, 'click', () => {
      if (!this.menu?.isOpen) this.openPanel();
    });

    this.keyboard = new Keyboard({
      target: this.input,
      enabled: true,
      onKeyDown: (event, key) => this.handleKeyDown(event, key),
    });
  }

  private handleFocus(): void {
    if (this._destroying || this._suppressOpenOnFocus) return;
    this.dispatchQuery();
    if (this.options.openOnFocus) {
      this.openPanel();
    }
  }

  private handleBlur(): void {
    window.setTimeout(() => {
      if (document.activeElement === this.input) return;
      if (this.isFocusInsideMenuSurface()) return;
      // Clic item : Menu gère close ; required via onCloseEnd
      if (!this.menu?.isOpen) {
        this.applyRequiredOnClose();
        this.inputChanged = false;
      }
    }, 0);
  }

  /**
   * Focus l’input sans déclencher openOnFocus.
   * @private
   */
  private focusInputQuiet(): void {
    if (!this.input) return;
    this._suppressOpenOnFocus = true;
    try {
      this.input.focus({ preventScroll: true });
    } finally {
      window.setTimeout(() => {
        this._suppressOpenOnFocus = false;
      }, 0);
    }
  }

  /**
   * Focus dans le menu flottant (souvent déplacé hors de k3ui-menu).
   * @private
   */
  private isFocusInsideMenuSurface(): boolean {
    const active = document.activeElement;
    if (!active || !this.menuEl) return false;
    if (this.menuEl.contains(active)) return true;
    const menuId = this.menuEl.id;
    if (!menuId) return false;
    const container = document.querySelector(`.menu-container[data-menu-id="${CSS.escape(menuId)}"]`);
    return !!(container && container.contains(active));
  }

  private handleInput(): void {
    this.inputChanged = true;
    this.dispatchQuery();
    this.refreshMenuItems();
    if (!this.menu?.isOpen) {
      this.openPanel();
    } else {
      this.updatePanelVisibility();
    }
  }

  private handleKeyDown(event: KeyboardEvent, key: string): void {
    if (key === 'Escape') {
      if (this.menu?.isOpen) {
        event.preventDefault();
        this.closePanel(true);
      }
      return;
    }

    if (key === 'ArrowDown') {
      event.preventDefault();
      if (!this.menu?.isOpen) {
        this.openPanel();
        return;
      }
      this.moveActive(1);
      return;
    }

    if (key === 'ArrowUp') {
      event.preventDefault();
      if (!this.menu?.isOpen) {
        this.openPanel();
        return;
      }
      this.moveActive(-1);
      return;
    }

    if (key === 'Home' && this.menu?.isOpen) {
      event.preventDefault();
      this.setActiveIndex(0);
      return;
    }

    if (key === 'End' && this.menu?.isOpen) {
      event.preventDefault();
      this.setActiveIndex(this.visibleOptions.length - 1);
      return;
    }

    if ((key === 'Enter' || key === ' ') && this.menu?.isOpen && this.activeIndex >= 0) {
      const item = this.visibleOptions[this.activeIndex];
      if (item && !item.disabled) {
        event.preventDefault();
        this.commitOption(item, true);
      }
    }
  }

  private dispatchQuery(): void {
    const term = this.input?.value ?? '';
    this.options.onQuery?.(term, this);
    this.el.dispatchEvent(
      new CustomEvent('query', {
        bubbles: true,
        detail: { term },
      })
    );
  }

  // --------------------------------------------------------------------------
  // Filtrage / Menu items
  // --------------------------------------------------------------------------

  private normalize(text: string): string {
    return this.options.caseSensitive ? text : text.toLocaleLowerCase();
  }

  private matches(option: AutocompleteOptionData, term: string): boolean {
    const filter = this.options.filter;
    if (typeof filter === 'function') {
      return filter(option, term);
    }
    if (filter === 'none') return true;
    if (!term) return true;

    const hay = this.normalize(option.label);
    const needle = this.normalize(term);

    switch (filter as AutocompleteFilterMode) {
      case 'starts-with':
        return hay.startsWith(needle);
      case 'ends-with':
        return hay.endsWith(needle);
      case 'contains':
      default:
        return hay.includes(needle);
    }
  }

  private buildMenuItems(): MenuItem[] {
    const term = this.input?.value ?? '';
    const items: MenuItem[] = [];

    if (this.options.loading && !this.options.hideLoading) {
      items.push({
        id: 'ac-meta-loading',
        label: LocaleManager.t('autocomplete.loadingLabel'),
        disabled: true,
      });
      return items;
    }

    this.visibleOptions = this.allOptions.filter((o) => this.matches(o, term));

    if (this.visibleOptions.length === 0) {
      if (!this.options.hideNoData) {
        items.push({
          id: 'ac-meta-nodata',
          label: LocaleManager.t('autocomplete.noDataLabel'),
          disabled: true,
        });
      }
      return items;
    }

    for (const opt of this.visibleOptions) {
      items.push({
        id: opt.value,
        value: opt.value,
        label: opt.label,
        disabled: !!opt.disabled,
      });
    }
    return items;
  }

  private refreshMenuItems(): void {
    const items = this.buildMenuItems();
    this.menu?.setItems(items);

    if (this.options.autoActivate && this.visibleOptions.length > 0 && !this.options.loading) {
      this.activeIndex = 0;
    } else {
      this.activeIndex = -1;
      this.clearActiveDescendant();
    }

    if (this.visibleOptions.length > 0 && !this.options.loading) {
      this.announce(
        LocaleManager.t('autocomplete.resultsLabel').replace(
          '{count}',
          String(this.visibleOptions.length)
        )
      );
    } else if (
      !this.options.loading &&
      this.visibleOptions.length === 0 &&
      (this.input?.value.length ?? 0) > 0
    ) {
      this.announce(LocaleManager.t('autocomplete.noDataLabel'));
    }

    if (this.menu?.isOpen) {
      this.syncActiveVisual();
    }
  }

  private shouldShowPanel(): boolean {
    if (this.options.loading && !this.options.hideLoading) return true;
    if (this.visibleOptions.length > 0) return true;
    if (!this.options.loading && !this.options.hideNoData) return true;
    return false;
  }

  private updatePanelVisibility(): void {
    if (!this.shouldShowPanel()) {
      this.closePanel();
    }
  }

  // --------------------------------------------------------------------------
  // Activation / sélection
  // --------------------------------------------------------------------------

  private moveActive(delta: number): void {
    const enabled = this.visibleOptions
      .map((o, i) => ({ o, i }))
      .filter(({ o }) => !o.disabled);
    if (enabled.length === 0) return;

    let pos = enabled.findIndex(({ i }) => i === this.activeIndex);
    if (pos < 0) {
      pos = delta > 0 ? -1 : 0;
    }
    pos = (pos + delta + enabled.length) % enabled.length;
    this.setActiveIndex(enabled[pos].i);
  }

  private setActiveIndex(index: number): void {
    this.activeIndex = index;
    this.syncActiveVisual();
    const opt = this.visibleOptions[index];
    if (this.input && opt) {
      // Menu génère des ids d’items ; on pointe le wrapper/item si possible
      const itemEl =
        this.menuEl?.querySelector(`[data-item-id="${opt.value}"], menu-item[data-id="${opt.value}"]`) as
          | HTMLElement
          | null;
      if (itemEl?.id) {
        setAriaAttribute(this.input, 'activedescendant', itemEl.id);
      }
    } else {
      this.clearActiveDescendant();
    }
  }

  private syncActiveVisual(): void {
    if (!this.menuEl) return;
    const wrappers = Array.from(
      this.menuEl.querySelectorAll('.menu-item-wrapper, menu-item')
    ) as HTMLElement[];

    wrappers.forEach((el) => {
      el.classList.remove('menu-item--active-visual', 'menu-item--active', 'autocomplete__option--active');
    });

    if (this.activeIndex < 0 || !this.visibleOptions[this.activeIndex]) return;
    const value = this.visibleOptions[this.activeIndex].value;
    const target =
      (this.menuEl.querySelector(`.menu-item-wrapper[data-item-id="${value}"]`) as HTMLElement | null) ||
      (this.menuEl.querySelector(`menu-item[data-id="${value}"]`) as HTMLElement | null);

    if (target) {
      target.classList.add('menu-item--active-visual');
      const inner = target.matches('menu-item')
        ? target
        : (target.querySelector('menu-item') as HTMLElement | null);
      inner?.classList.add('menu-item--active-visual');
      target.scrollIntoView({ block: 'nearest' });
    }

    if (this.menu) {
      this.menu.focusedIndex = this.activeIndex;
    }
  }

  private clearActiveDescendant(): void {
    if (this.input) {
      removeAriaAttribute(this.input, 'activedescendant');
    }
  }

  private commitOption(option: AutocompleteOptionData, fromUser: boolean): void {
    if (!this.input || option.disabled) return;
    this.committed = { ...option };
    this.input.value = option.label;
    this.inputChanged = false;
    this.options.onSelect?.(option, this);
    this.emitChange(option.value, option.label);
    if (fromUser && this.options.closeOnSelect) {
      this._restoreInputFocusOnClose = true;
      this.closePanel();
    }
  }

  private emitChange(value: string | null, label: string | null): void {
    this.options.onChange?.(value, label, this);
    this.el.dispatchEvent(
      new CustomEvent('change', {
        bubbles: true,
        detail: { value, label },
      })
    );
  }

  private applyRequiredOnClose(): void {
    if (!this.options.required || !this.input || !this.inputChanged) return;

    if (!this.committed) {
      this.input.value = '';
      this.emitChange(null, null);
      return;
    }

    if (this.normalize(this.input.value) !== this.normalize(this.committed.label)) {
      this.input.value = this.committed.label;
    }
  }

  private announce(message: string): void {
    if (this.statusEl) {
      this.statusEl.textContent = message;
    }
  }
}
