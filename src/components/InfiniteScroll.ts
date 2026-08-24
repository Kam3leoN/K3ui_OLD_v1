/**
 * @fileoverview Composant InfiniteScroll pour K3UI
 * @description Chargement progressif autonome (scroll infini / bouton "load more") inspiré d'XtendUI.
 * @author K3UI Team
 * @version 1.0.0
 *
 * @security
 * L'option `get` déclenche des requêtes `fetch()` vers l'URL courante (avec un paramètre de pagination)
 * et le HTML de la réponse est parsé via `DOMParser`, puis les éléments correspondants sont clonés
 * (`cloneNode`) dans le DOM. Ce flux suppose que la page cible est **de même origine et de confiance**
 * (rendue par le propre backend de l'application). Ne JAMAIS pointer `get`/l'URL de pagination vers un
 * domaine tiers ou une source non contrôlée : le HTML récupéré n'est pas sanitisé avant clonage dans le DOM
 * (contrairement aux composants qui utilisent `allowHTML` + `sanitizeHtmlFragment`). Si le contenu retourné
 * peut inclure du HTML non fiable, sanitiser la réponse côté serveur ou passer par `sanitizeHtmlFragment`
 * (`src/utils/dom/sanitize.ts`) avant de l'insérer.
 */

import { Component } from '../core/base/Component';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import type { InfiniteScrollOptions } from '../types/components';
import { InitElements, PriorityLevel } from '../types/base';
import { setAriaAttributes, removeAriaAttribute } from '../utils/dom/aria';
import { LoggerManager } from '../core/managers';
import { ManagerFactory } from '../core/factories';
import { getInfiniteScrollDefaults } from '../specs/components/infinite-scroll.specs';

const _defaults: InfiniteScrollOptions = getInfiniteScrollDefaults();

type TriggerEvent = 'click' | 'scroll' | 'both';

/**
 * Composant InfiniteScroll : charge des pages supplémentaires automatiquement
 * au scroll et/ou via un bouton de chargement.
 */
export class InfiniteScroll extends Component<InfiniteScrollOptions> {
  readonly priority: PriorityLevel = PriorityLevel.MEDIUM;
  private logger: LoggerManager;

  private itemsContainerEl: HTMLElement | null = null;
  private controlsEl: HTMLElement | null = null;
  private triggerButtonEl: HTMLButtonElement | null = null;
  private statusEl: HTMLElement | null = null;

  private currentPage = 1;
  private isLoading = false;
  private destroyed = false;
  private prefetchCache = new Map<number, string>();
  private boundScrollHandler: (() => void) | null = null;

  static get defaults(): InfiniteScrollOptions {
    return { ..._defaults };
  }

  static getInstance(el: HTMLElement): InfiniteScroll | undefined {
    return Component.getInstance(el) as InfiniteScroll | undefined;
  }

  static init(el: HTMLElement, options?: Partial<InfiniteScrollOptions>): InfiniteScroll;
  static init(els: InitElements<HTMLElement> | string, options?: Partial<InfiniteScrollOptions>): InfiniteScroll[];
  static init(
    els: HTMLElement | InitElements<HTMLElement> | string,
    options: Partial<InfiniteScrollOptions> = {}
  ): InfiniteScroll | InfiniteScroll[] {
    const elements: HTMLElement | InitElements<HTMLElement> =
      typeof els === 'string' ? document.querySelectorAll<HTMLElement>(els) : els;
    return super.init(
      elements,
      options,
      InfiniteScroll as ComponentType<InfiniteScroll, InfiniteScrollOptions>
    ) as InfiniteScroll | InfiniteScroll[];
  }

  constructor(el: HTMLElement, options: Partial<InfiniteScrollOptions> = {}) {
    super(el, options, toComponentClassDef(InfiniteScroll));
    this.logger = ManagerFactory.getLoggerManager('[InfiniteScroll]');

    const fromData = this.readOptionsFromElement(el);
    this.options = {
      ...InfiniteScroll.defaults,
      ...fromData,
      ...options,
    };

    if (el.tagName.toLowerCase() === 'k3ui-infinite-scroll') {
      el.classList.add('infinite-scroll');
    }

    this.currentPage = Math.max(1, this.options.currentPage);
    this.initComponent();
  }

  private readOptionsFromElement(el: HTMLElement): Partial<InfiniteScrollOptions> {
    const out: Partial<InfiniteScrollOptions> = {};

    const maxPages = Number(el.getAttribute('data-max-pages'));
    if (!Number.isNaN(maxPages) && maxPages > 0) out.maxPages = Math.floor(maxPages);

    const currentPage = Number(el.getAttribute('data-current-page'));
    if (!Number.isNaN(currentPage) && currentPage > 0) out.currentPage = Math.floor(currentPage);

    const threshold = Number(el.getAttribute('data-threshold'));
    if (!Number.isNaN(threshold) && threshold >= 0) out.threshold = threshold;

    const triggerEvent = el.getAttribute('data-trigger-event') as TriggerEvent | null;
    if (triggerEvent === 'click' || triggerEvent === 'scroll' || triggerEvent === 'both') {
      out.triggerEvent = triggerEvent;
    }

    const getParam = el.getAttribute('data-get');
    if (getParam) out.get = getParam;

    const itemSelector = el.getAttribute('data-item');
    if (itemSelector) out.itemSelector = itemSelector;

    const itemsContainerSelector = el.getAttribute('data-items-container');
    if (itemsContainerSelector) out.itemsContainerSelector = itemsContainerSelector;

    if (el.hasAttribute('data-show-status')) {
      out.showStatus = el.getAttribute('data-show-status') !== 'false';
    }
    if (el.hasAttribute('data-prefetch')) {
      out.prefetch = el.getAttribute('data-prefetch') !== 'false';
    }
    if (el.hasAttribute('data-auto-load-on-scroll')) {
      out.autoLoadOnScroll = el.getAttribute('data-auto-load-on-scroll') !== 'false';
    }
    const triggerLabel = el.getAttribute('data-trigger-label');
    if (triggerLabel) out.triggerLabel = triggerLabel;

    const loadingText = el.getAttribute('data-loading-text');
    if (loadingText) out.loadingText = loadingText;

    const finishedText = el.getAttribute('data-finished-text');
    if (finishedText) out.finishedText = finishedText;

    return out;
  }

  private initComponent(): void {
    this.el.classList.add('infinite-scroll');
    this.setupStructure();
    this.setupAccessibility();
    this.setupEvents();
    this.updateUi();
    this.tryPrefetch(this.currentPage + 1);
    this.logger.info('Component initialized');
  }

  private setupStructure(): void {
    const existingItems = this.resolveItemsContainer();
    if (!existingItems) {
      this.itemsContainerEl = document.createElement('div');
      this.itemsContainerEl.className = 'infinite-scroll__items';
      this.el.appendChild(this.itemsContainerEl);
    } else {
      this.itemsContainerEl = existingItems;
      this.itemsContainerEl.classList.add('infinite-scroll__items');
    }

    this.controlsEl = this.el.querySelector<HTMLElement>('.infinite-scroll__controls');
    if (!this.controlsEl) {
      this.controlsEl = document.createElement('div');
      this.controlsEl.className = 'infinite-scroll__controls';
      this.el.appendChild(this.controlsEl);
    } else {
      this.controlsEl.innerHTML = '';
    }

    this.triggerButtonEl = document.createElement('button');
    this.triggerButtonEl.type = 'button';
    this.triggerButtonEl.className = 'infinite-scroll__trigger';
    this.triggerButtonEl.textContent = this.options.triggerLabel;

    this.statusEl = document.createElement('div');
    this.statusEl.className = 'infinite-scroll__status';

    this.controlsEl.appendChild(this.triggerButtonEl);
    this.controlsEl.appendChild(this.statusEl);
  }

  private resolveItemsContainer(): HTMLElement | null {
    if (this.options.itemsContainerSelector) {
      return this.el.querySelector<HTMLElement>(this.options.itemsContainerSelector);
    }
    const existing = this.el.querySelector<HTMLElement>('.infinite-scroll__items');
    if (existing) return existing;

    const maybeControls = this.el.querySelector('.infinite-scroll__controls');
    if (!maybeControls && this.el.children.length > 0) {
      return this.el as HTMLElement;
    }
    return null;
  }

  private setupAccessibility(): void {
    setAriaAttributes(this.el, {
      role: 'feed',
      label: 'Infinite scroll',
      busy: false,
    });
    if (this.statusEl) {
      this.statusEl.setAttribute('aria-live', 'polite');
    }
  }

  private setupEvents(): void {
    if (this.triggerButtonEl) {
      this.triggerButtonEl.addEventListener('click', () => {
        if (this.options.triggerEvent === 'click' || this.options.triggerEvent === 'both') {
          this.loadNextPage();
        }
      });
    }

    if (this.options.autoLoadOnScroll && this.shouldUseScroll()) {
      this.boundScrollHandler = () => {
        if (this.destroyed || this.isLoading || !this.options.enabled || this.options.disabled) return;
        if (this.isNearBottom()) this.loadNextPage();
      };
      window.addEventListener('scroll', this.boundScrollHandler, { passive: true });
      window.addEventListener('resize', this.boundScrollHandler, { passive: true });
    }
  }

  private shouldUseScroll(): boolean {
    return this.options.triggerEvent === 'scroll' || this.options.triggerEvent === 'both';
  }

  private isNearBottom(): boolean {
    const rect = this.el.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    return rect.bottom - viewportHeight <= this.options.threshold;
  }

  private updateUi(): void {
    const reachedEnd = this.currentPage >= this.options.maxPages;
    this.el.classList.toggle('infinite-scroll--loading', this.isLoading);
    this.el.classList.toggle('infinite-scroll--last', reachedEnd);

    if (!this.triggerButtonEl || !this.statusEl) return;

    this.triggerButtonEl.disabled =
      this.options.disabled ||
      !this.options.enabled ||
      this.isLoading ||
      reachedEnd ||
      this.options.triggerEvent === 'scroll';

    this.triggerButtonEl.textContent = this.isLoading ? this.options.loadingText : this.options.triggerLabel;
    this.triggerButtonEl.classList.toggle('is-hidden', this.options.triggerEvent === 'scroll');

    if (this.options.showStatus) {
      this.statusEl.classList.remove('is-hidden');
      this.statusEl.textContent = reachedEnd
        ? this.options.finishedText
        : `Page ${this.currentPage} of ${this.options.maxPages}`;
    } else {
      this.statusEl.classList.add('is-hidden');
      this.statusEl.textContent = '';
    }
  }

  private setLoading(loading: boolean): void {
    this.isLoading = loading;
    this.el.setAttribute('aria-busy', String(loading));
    this.updateUi();
  }

  /**
   * Charge la page suivante.
   * - Via callback `onLoadMore`
   * - Ou via requête HTTP si `get` est défini
   */
  async loadNextPage(): Promise<void> {
    if (this.isLoading || this.options.disabled || !this.options.enabled) return;
    if (this.currentPage >= this.options.maxPages) {
      this.updateUi();
      return;
    }

    const nextPage = this.currentPage + 1;
    this.setLoading(true);
    this.options.onOpenStart?.(this.el);

    try {
      if (typeof this.options.onLoadMore === 'function') {
        await this.options.onLoadMore(nextPage, this);
      } else if (this.options.get) {
        await this.loadFromHttp(nextPage);
      }

      this.currentPage = nextPage;
      this.options.currentPage = nextPage;
      this.options.onPageChange?.(nextPage, this);
      this.dispatchStatusEvent();

      this.tryPrefetch(this.currentPage + 1);
      this.options.onOpenEnd?.(this.el);
    } catch (error) {
      this.logger.error('Failed to load next page', error);
      this.options.onError?.(error, this);
    } finally {
      this.setLoading(false);
      if (this.currentPage >= this.options.maxPages) {
        this.options.onCloseEnd?.(this.el);
      }
    }
  }

  /**
   * Charge et insère la page suivante depuis une réponse HTTP HTML.
   * @security Le HTML reçu doit provenir d'une origine de confiance (même origine, backend contrôlé).
   * Les nœuds correspondants sont clonés (`cloneNode`) directement dans le DOM sans sanitization :
   * ne jamais utiliser cette fonctionnalité avec une URL/domaine non fiable ou du contenu utilisateur brut.
   */
  private async loadFromHttp(page: number): Promise<void> {
    const html = await this.getPageHtml(page);
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const selector = this.options.itemsContainerSelector || '.infinite-scroll__items';
    const sourceContainer = doc.querySelector<HTMLElement>(selector);
    if (!sourceContainer || !this.itemsContainerEl) {
      throw new Error(`InfiniteScroll: impossible de trouver le container '${selector}' dans la réponse.`);
    }

    let appended = 0;
    if (this.options.itemSelector) {
      const items = Array.from(sourceContainer.querySelectorAll<HTMLElement>(this.options.itemSelector));
      items.forEach((item) => {
        this.itemsContainerEl?.appendChild(item.cloneNode(true));
        appended++;
      });
    } else {
      Array.from(sourceContainer.children).forEach((child) => {
        this.itemsContainerEl?.appendChild(child.cloneNode(true));
        appended++;
      });
    }

    if (appended === 0) {
      throw new Error('InfiniteScroll: aucun nouvel élément trouvé dans la page suivante.');
    }
  }

  /**
   * Récupère le HTML brut de la page demandée (cache de prefetch ou requête réseau).
   * @security Requête effectuée vers l'URL courante (même origine). Le HTML retourné doit provenir
   * d'une source de confiance : il est inséré dans le DOM (via `loadFromHttp`) sans sanitization.
   */
  private async getPageHtml(page: number): Promise<string> {
    if (this.prefetchCache.has(page)) {
      const cached = this.prefetchCache.get(page);
      if (cached) {
        this.prefetchCache.delete(page);
        return cached;
      }
    }

    const url = new URL(window.location.href);
    const getParam = this.options.get;
    if (!getParam) {
      throw new Error("InfiniteScroll: l'option 'get' est obligatoire pour le chargement HTTP.");
    }
    url.searchParams.set(getParam, String(page));
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });
    if (!response.ok) {
      throw new Error(`InfiniteScroll: requête en erreur (${response.status}).`);
    }
    return response.text();
  }

  private async tryPrefetch(page: number): Promise<void> {
    if (!this.options.prefetch || !this.options.get) return;
    if (page > this.options.maxPages) return;
    if (this.prefetchCache.has(page)) return;
    try {
      const html = await this.getPageHtmlWithoutCache(page);
      this.prefetchCache.set(page, html);
    } catch {
      // Le prefetch est une optimisation best-effort.
    }
  }

  /**
   * Récupère le HTML brut de la page demandée sans passer par le cache de prefetch.
   * @security Requête effectuée vers l'URL courante (même origine). Le HTML retourné doit provenir
   * d'une source de confiance : il est inséré dans le DOM (via `loadFromHttp`) sans sanitization.
   */
  private async getPageHtmlWithoutCache(page: number): Promise<string> {
    const url = new URL(window.location.href);
    const getParam = this.options.get;
    if (!getParam) {
      throw new Error("InfiniteScroll: l'option 'get' est obligatoire pour le prefetch.");
    }
    url.searchParams.set(getParam, String(page));
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });
    if (!response.ok) {
      throw new Error(`InfiniteScroll: prefetch en erreur (${response.status}).`);
    }
    return response.text();
  }

  private dispatchStatusEvent(): void {
    this.el.dispatchEvent(
      new CustomEvent('status.k3ui.infinitescroll', {
        bubbles: true,
        detail: {
          page: this.currentPage,
          maxPages: this.options.maxPages,
          isLast: this.currentPage >= this.options.maxPages,
        },
      })
    );
  }

  public updateOptions(newOptions: Partial<InfiniteScrollOptions>): void {
    this.options = { ...this.options, ...newOptions };
    this.currentPage = Math.max(1, this.options.currentPage);
    this.updateUi();
  }

  public getCurrentPage(): number {
    return this.currentPage;
  }

  public isLastPage(): boolean {
    return this.currentPage >= this.options.maxPages;
  }

  public override destroy(): void {
    this.destroyed = true;
    if (this.boundScrollHandler) {
      window.removeEventListener('scroll', this.boundScrollHandler);
      window.removeEventListener('resize', this.boundScrollHandler);
      this.boundScrollHandler = null;
    }

    removeAriaAttribute(this.el, 'role');
    removeAriaAttribute(this.el, 'label');
    removeAriaAttribute(this.el, 'busy');

    this.prefetchCache.clear();
    this.logger.info('Component destroyed');
    super.destroy();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'k3ui-infinite-scroll': HTMLElement;
  }
}

if (
  typeof window !== 'undefined' &&
  typeof customElements !== 'undefined' &&
  !customElements.get('k3ui-infinite-scroll')
) {
  customElements.define(
    'k3ui-infinite-scroll',
    class extends HTMLElement {
      connectedCallback(): void {
        if (!this.classList.contains('infinite-scroll')) {
          this.classList.add('infinite-scroll');
        }
      }
    }
  );
}
