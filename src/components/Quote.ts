/**
 * @fileoverview Composant Quote pour K3UI
 * @description Citation motivante avec encoche auteur (primitive notch)
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { toComponentClassDef } from '../types/components/component-base';
import type { QuoteItem, QuoteOptions } from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { setAriaAttributes, removeAriaAttribute } from '../utils/dom/aria';
import { ensureNotchStructure, fitNotchLabelWidth } from '../utils/dom/notch';
import { storage } from '../utils/storage/storage';
import { LocaleManager, LoggerManager } from '../core/managers';
import { ManagerFactory } from '../core/factories';
import { getQuoteDefaults, QuoteSpecs } from '../specs/components/quote.specs';

interface KQuoteHTMLElement extends HTMLElement {
  K_Quote?: Quote;
}

const _defaults: QuoteOptions = getQuoteDefaults();

/**
 * Composant Quote — affichage de citations avec encoche auteur.
 */
export class Quote extends Component<QuoteOptions> {
  readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

  private logger: LoggerManager;
  private textElement: HTMLElement | null = null;
  private labelElement: HTMLElement | null = null;
  private currentItem: QuoteItem = { quote: '', author: '' };

  static get defaults(): QuoteOptions {
    return { ..._defaults };
  }

  /**
   * Obtient l'instance Quote liée à un élément
   */
  static getInstance(el: HTMLElement): Quote | undefined {
    return (el as KQuoteHTMLElement).K_Quote;
  }

  /**
   * Initialise un ou plusieurs éléments Quote
   */
  static init(
    els: KElement | InitElements<KElement> | string,
    options: Partial<QuoteOptions> = {}
  ): Quote | Quote[] {
    return Component.init(els, options, toComponentClassDef(Quote)) as Quote | Quote[];
  }

  constructor(el: HTMLElement, options: Partial<QuoteOptions> = {}) {
    super(el, options, toComponentClassDef(Quote));

    this.logger = ManagerFactory.getLoggerManager('[Quote]');

    this.options = {
      ...Quote.defaults,
      ...options,
      ...this.readDataOptions(),
    };

    (el as KQuoteHTMLElement).K_Quote = this;
    this.mount();
  }

  /**
   * Lit les options depuis les attributs data-*
   */
  private readDataOptions(): Partial<QuoteOptions> {
    const data: Partial<QuoteOptions> = {};

    if (this.el.dataset.quote !== undefined) {
      data.quote = this.el.dataset.quote;
    }
    if (this.el.dataset.author !== undefined) {
      data.author = this.el.dataset.author;
    }
    if (this.el.dataset.random === 'true' || this.el.dataset.random === '') {
      data.random = true;
    }
    if (this.el.dataset.daily === 'true' || this.el.dataset.daily === '') {
      data.daily = true;
    }
    if (this.el.dataset.refreshOnClick === 'true' || this.el.dataset.refreshOnClick === '') {
      data.refreshOnClick = true;
    }
    if (this.el.dataset.maxLength) {
      const parsed = Number.parseInt(this.el.dataset.maxLength, 10);
      if (!Number.isNaN(parsed)) {
        data.maxLength = parsed;
      }
    }
    if (this.el.dataset.quotes) {
      try {
        const parsed = JSON.parse(this.el.dataset.quotes) as QuoteItem[];
        if (Array.isArray(parsed)) {
          data.quotes = parsed;
        }
      } catch {
        console.warn('[Quote] data-quotes JSON invalide');
      }
    }

    return data;
  }

  /**
   * Monte le composant : structure DOM, contenu, ARIA, interactions
   */
  private mount(): void {
    this.el.classList.add('quote', 'notch', 'notch--bottom-end');
    this.ensureSurfaceStructure();
    this.resolveAndDisplayContent();
    this.setupAccessibility();
    this.setupRefreshOnClick();
    this.logger.info('Quote initialized');
  }

  /**
   * Garantit la présence de quote__surface et quote__text
   */
  private ensureSurfaceStructure(): void {
    let surface = this.el.querySelector('.quote__surface');
    if (!(surface instanceof HTMLElement)) {
      surface = document.createElement('div');
      surface.className = 'quote__surface';
      const existingText = this.el.querySelector('.quote__text');
      if (existingText) {
        surface.appendChild(existingText);
      } else {
        const text = document.createElement('p');
        text.className = 'quote__text';
        surface.appendChild(text);
      }
      this.el.insertBefore(surface, this.el.firstChild);
    }

    this.textElement = surface.querySelector('.quote__text');
    if (!(this.textElement instanceof HTMLElement)) {
      this.textElement = document.createElement('p');
      this.textElement.className = 'quote__text';
      surface.appendChild(this.textElement);
    }

    const authorText =
      this.options.author ||
      this.el.querySelector('.quote__author')?.textContent?.trim() ||
      '';

    // Pastille à l’intérieur de la surface (réf. MYNT : tab dans la card overflow:hidden)
    const legacyWrapper = this.el.querySelector(':scope > .notch__label-wrapper');
    if (legacyWrapper instanceof HTMLElement && !surface.contains(legacyWrapper)) {
      surface.appendChild(legacyWrapper);
    }

    this.labelElement = ensureNotchStructure(surface, authorText, 'quote__author');
  }

  /**
   * Résout le contenu (daily, random, statique) puis affiche
   */
  private resolveAndDisplayContent(): void {
    if (this.options.quote || this.options.author) {
      this.renderQuote({
        quote: this.options.quote,
        author: this.options.author,
      });
      return;
    }

    if (this.options.daily) {
      const stored = this.loadDailyQuote();
      if (stored) {
        this.renderQuote(stored);
        return;
      }
      if (this.options.quotes.length > 0) {
        const picked = this.pickRandomQuote();
        this.renderQuote(picked, true);
        return;
      }
    }

    if (this.options.random && this.options.quotes.length > 0) {
      this.renderQuote(this.pickRandomQuote());
      return;
    }

    const fromDom = this.readContentFromDom();
    if (fromDom.quote || fromDom.author) {
      this.renderQuote(fromDom);
      return;
    }

    if (this.options.quotes.length > 0) {
      this.renderQuote(this.options.quotes[0]);
    }
  }

  /**
   * Lit le contenu déjà présent dans le DOM
   */
  private readContentFromDom(): QuoteItem {
    const quote =
      this.textElement?.textContent?.trim() ||
      this.el.querySelector('.quote__text')?.textContent?.trim() ||
      '';
    const author =
      this.el.querySelector('.quote__author')?.textContent?.trim() ||
      this.el.querySelector('.notch__label span')?.textContent?.trim() ||
      '';

    return { quote, author };
  }

  /**
   * Affiche une citation et ajuste la pastille auteur
   * @param item - Citation à afficher
   * @param persistDaily - Enregistrer comme citation du jour
   */
  private renderQuote(item: QuoteItem, persistDaily = false): void {
    this.currentItem = { ...item };

    if (this.textElement) {
      this.textElement.textContent = item.quote;
    }

    if (this.labelElement) {
      const span = this.labelElement.querySelector('span');
      if (span) {
        span.textContent = item.author;
        if (item.author) {
          span.classList.add('quote__author');
        }
      }
      fitNotchLabelWidth(this.labelElement);
    }

    if (persistDaily || this.options.daily) {
      this.storeDailyQuote(item);
    }
  }

  /**
   * Affiche une citation et déclenche onRefresh
   */
  private displayQuote(item: QuoteItem): void {
    this.renderQuote(item, this.options.daily);
    this.options.onRefresh?.(item);
  }

  /**
   * Clé localStorage pour la citation du jour
   */
  private getDailyStorageKey(): string {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const locale = LocaleManager.currentLocale;
    return `${QuoteSpecs.storage.keyPrefix}-${locale}-${y}-${m}-${d}`;
  }

  /**
   * Charge la citation du jour depuis le stockage
   */
  private loadDailyQuote(): QuoteItem | null {
    const stored = storage.get<QuoteItem>(this.getDailyStorageKey(), null);
    if (!stored) {
      return null;
    }

    if (this.options.quotes.length > 0) {
      const stillInPool = this.options.quotes.some(
        (item) => item.quote === stored.quote && item.author === stored.author
      );
      if (!stillInPool) {
        return null;
      }
    }

    return stored;
  }

  /**
   * Enregistre la citation du jour
   */
  private storeDailyQuote(item: QuoteItem): void {
    storage.set(this.getDailyStorageKey(), item);
  }

  /**
   * Choisit une citation aléatoire respectant maxLength
   */
  private pickRandomQuote(): QuoteItem {
    const { quotes, maxLength } = this.options;
    if (quotes.length === 0) {
      return { quote: '', author: '' };
    }

    const maxAttempts = 15;
    for (let i = 0; i < maxAttempts; i++) {
      const candidate = quotes[Math.floor(Math.random() * quotes.length)];
      const total = candidate.quote.length + candidate.author.length;
      if (total <= maxLength) {
        return candidate;
      }
    }

    return quotes[Math.floor(Math.random() * quotes.length)];
  }

  /**
   * Configure l'accessibilité (blockquote + cite)
   */
  private setupAccessibility(): void {
    setAriaAttributes(this.el, {
      role: QuoteSpecs.accessibility.role,
      label: LocaleManager.t('quote.ariaLabel'),
    });

    if (this.labelElement) {
      this.labelElement.setAttribute('role', 'doc-credit');
    }
  }

  /**
   * Active le rafraîchissement au clic
   */
  private setupRefreshOnClick(): void {
    if (!this.options.refreshOnClick) {
      return;
    }

    this.el.classList.add('quote--refreshable');
    setAriaAttributes(this.el, {
      label: `${LocaleManager.t('quote.ariaLabel')}. ${LocaleManager.t('quote.refreshAriaLabel')}`,
    });

    const handler = () => this.refresh();
    this.registerEvent(this.el, 'click', handler);
    this.registerEvent(this.el, 'keydown', (e: Event) => {
      const ke = e as KeyboardEvent;
      if (ke.key === 'Enter' || ke.key === ' ') {
        ke.preventDefault();
        this.refresh();
      }
    });
  }

  /**
   * Retourne la citation courante
   */
  public getCurrentQuote(): QuoteItem {
    return { ...this.currentItem };
  }

  /**
   * Affiche une nouvelle citation (random ou quotes[])
   */
  public refresh(): void {
    if (this.options.quotes.length === 0) {
      return;
    }

    const item = this.pickRandomQuote();
    if (this.options.daily) {
      this.storeDailyQuote(item);
    }
    this.displayQuote(item);
  }

  /**
   * Met à jour les options et le contenu
   */
  public update(options: Partial<QuoteOptions>): void {
    this.options = { ...this.options, ...options };
    if (options.quotes || options.random || options.daily) {
      this.resolveAndDisplayContent();
    } else if (options.quote !== undefined || options.author !== undefined) {
      this.displayQuote({
        quote: this.options.quote,
        author: this.options.author,
      });
    }
  }

  /**
   * Détruit l'instance
   */
  public override destroy(): void {
    if ((this.el as KQuoteHTMLElement).K_Quote === this) {
      delete (this.el as KQuoteHTMLElement).K_Quote;
    }
    removeAriaAttribute(this.el, 'role');
    removeAriaAttribute(this.el, 'label');
    this.logger.info('Quote destroyed');
    super.destroy();
  }
}

/**
 * Custom Element k3ui-quote
 */
if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-quote')) {
  customElements.define(
    'k3ui-quote',
    class extends HTMLElement {
      connectedCallback(): void {
        if (!this.hasAttribute('data-initialized')) {
          this.setAttribute('data-initialized', 'true');
        }
      }

      disconnectedCallback(): void {
        const instance = (this as KQuoteHTMLElement).K_Quote;
        if (instance && typeof instance.destroy === 'function') {
          instance.destroy();
        }
        (this as KQuoteHTMLElement).K_Quote = undefined;
      }
    }
  );
}
