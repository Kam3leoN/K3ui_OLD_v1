/**
 * @fileoverview Composant Breadcrumb (fil d'Ariane) pour K3UI
 * @description Fil d'Ariane MD3 Expressive : variantes plain/tonal/filled, séparateurs, collapse, icônes
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import { BreadcrumbOptions, BreadcrumbItem } from '../types/components';
import { PriorityLevel, InitElements } from '../types/base';
import { setAriaAttributes, removeAriaAttribute } from '../utils/dom/aria';
import { queryOne } from '../utils/dom/elements';
import { LoggerManager, IconManager, LocaleManager } from '../core/managers';
import { ManagerFactory } from '../core/factories';
import { getBreadcrumbDefaults, BreadcrumbSpecs } from '../specs/components/breadcrumb.specs';

const _defaults: BreadcrumbOptions = getBreadcrumbDefaults();

/**
 * Classe Breadcrumb : fil d'Ariane de navigation (MD3 Expressive)
 */
export class Breadcrumb extends Component<BreadcrumbOptions> {
  readonly priority: PriorityLevel = PriorityLevel.MEDIUM;
  private logger: LoggerManager;
  private listElement: HTMLOListElement | null = null;

  static get defaults(): BreadcrumbOptions {
    return { ..._defaults };
  }

  static getInstance(el: HTMLElement): Breadcrumb | undefined {
    return Component.getInstance(el) as Breadcrumb | undefined;
  }

  static init(el: HTMLElement, options?: Partial<BreadcrumbOptions>): Breadcrumb;
  static init(els: InitElements<HTMLElement> | string, options?: Partial<BreadcrumbOptions>): Breadcrumb[];
  static init(
    els: HTMLElement | InitElements<HTMLElement> | string,
    options: Partial<BreadcrumbOptions> = {}
  ): Breadcrumb | Breadcrumb[] {
    const elements: HTMLElement | InitElements<HTMLElement> =
      typeof els === 'string' ? document.querySelectorAll<HTMLElement>(els) : els;
    return super.init(
      elements,
      options,
      Breadcrumb as ComponentType<Breadcrumb, BreadcrumbOptions>
    ) as Breadcrumb | Breadcrumb[];
  }

  constructor(el: HTMLElement, options: Partial<BreadcrumbOptions> = {}) {
    super(el, options, toComponentClassDef(Breadcrumb));
    this.logger = ManagerFactory.getLoggerManager('[Breadcrumb]');
    this.options = { ...Breadcrumb.defaults, ...options };
    // L'instance est gérée via ComponentRegistry (voir getInstance())
    this.init();
  }

  private init(): void {
    this.render();
    this.setupAccessibility();
    this.logger.info('Component initialized');
  }

  /**
   * Calcule la liste d'éléments à afficher (avec collapse si collapseAfter est défini)
   */
  private getVisibleItems(): (BreadcrumbItem | 'ellipsis')[] {
    const { items, collapseAfter } = this.options;
    if (items.length === 0) return [];
    if (collapseAfter == null || items.length <= collapseAfter) return [...items];
    if (collapseAfter <= 1) return items.length > 1 ? [items[0], 'ellipsis', items[items.length - 1]] : [items[0]];
    const first = items.slice(0, 1);
    const last = items.slice(-1);
    return [...first, 'ellipsis', ...last];
  }

  /**
   * Retourne le caractère ou contenu du séparateur selon l'option
   */
  private getSeparatorContent(): string {
    const key = this.options.separator;
    return (BreadcrumbSpecs.separators as Record<string, string>)[key] ?? '›';
  }

  private renderIcon(iconName: string): HTMLElement {
    const span = document.createElement('span');
    span.setAttribute('name', iconName);
    span.setAttribute('aria-hidden', 'true');
    span.className = 'breadcrumb__icon';
    IconManager.updateIcon(span);
    return span;
  }

  private createSeparator(): HTMLElement {
    const sep = document.createElement('span');
    sep.className = `breadcrumb__separator breadcrumb__separator--${this.options.separator}`;
    sep.setAttribute('aria-hidden', 'true');
    const content = this.getSeparatorContent();
    if (this.options.separator === 'chevron') {
      const icon = document.createElement('span');
      icon.setAttribute('name', 'chevron-right');
      icon.setAttribute('aria-hidden', 'true');
      IconManager.updateIcon(icon);
      sep.appendChild(icon);
    } else {
      sep.textContent = content;
    }
    return sep;
  }

  private createItemNode(item: BreadcrumbItem, index: number): HTMLElement {
    const li = document.createElement('li');
    li.className = 'breadcrumb__item';
    if (item.current) li.classList.add('breadcrumb__item--current');

    const isCurrent = item.current ?? false;
    const href = item.href ?? '#';

    if (isCurrent) {
      const span = document.createElement('span');
      span.className = 'breadcrumb__link breadcrumb__link--current';
      if (this.options.showIcons && item.icon) {
        span.appendChild(this.renderIcon(item.icon));
      }
      const textSpan = document.createElement('span');
      textSpan.className = 'breadcrumb__text';
      textSpan.textContent = item.text;
      span.appendChild(textSpan);
      li.appendChild(span);
    } else {
      const a = document.createElement('a');
      a.className = 'breadcrumb__link';
      a.href = href;
      if (this.options.showIcons && item.icon) {
        a.appendChild(this.renderIcon(item.icon));
      }
      const textSpan = document.createElement('span');
      textSpan.className = 'breadcrumb__text';
      textSpan.textContent = item.text;
      a.appendChild(textSpan);
      a.addEventListener('click', (e) => {
        if (this.options.onItemClick) {
          const idx = this.options.items.indexOf(item);
          this.options.onItemClick(e as MouseEvent, item, idx);
        }
      });
      li.appendChild(a);
    }
    return li;
  }

  private createEllipsisNode(): HTMLElement {
    const li = document.createElement('li');
    li.className = 'breadcrumb__item breadcrumb__item--ellipsis';
    li.setAttribute('aria-hidden', 'true');
    const span = document.createElement('span');
    span.className = 'breadcrumb__ellipsis';
    span.textContent = '…';
    li.appendChild(span);
    return li;
  }

  private render(): void {
    const { variant, size } = this.options;
    this.el.className = [
      'breadcrumb',
      'breadcrumb--' + variant,
      'breadcrumb--' + size,
    ].join(' ');

    if (this.listElement && this.listElement.parentNode === this.el) {
      this.el.removeChild(this.listElement);
    }
    this.listElement = document.createElement('ol');
    this.listElement.className = 'breadcrumb__list';

    const visible = this.getVisibleItems();
    visible.forEach((entry, i) => {
      if (entry === 'ellipsis') {
        this.listElement!.appendChild(this.createEllipsisNode());
      } else {
        this.listElement!.appendChild(this.createItemNode(entry, i));
      }
      if (i < visible.length - 1) {
        const sepLi = document.createElement('li');
        sepLi.className = 'breadcrumb__item breadcrumb__item--sep';
        sepLi.setAttribute('aria-hidden', 'true');
        sepLi.appendChild(this.createSeparator());
        this.listElement!.appendChild(sepLi);
      }
    });

    this.el.appendChild(this.listElement);
  }

  private setupAccessibility(): void {
    setAriaAttributes(this.el, {
      role: 'navigation',
      label: LocaleManager.t('breadcrumb.ariaLabel'),
    });
    if (this.listElement) {
      const currentItem = this.listElement.querySelector('.breadcrumb__link--current');
      if (currentItem) setAriaAttributes(currentItem as HTMLElement, { current: 'page' });
    }
  }

  /**
   * Met à jour les options et re-rend le fil d'Ariane
   */
  public updateOptions(newOptions: Partial<BreadcrumbOptions>): void {
    this.options = { ...this.options, ...newOptions };
    this.render();
    this.setupAccessibility();
  }

  public override destroy(): void {
    removeAriaAttribute(this.el, 'role');
    removeAriaAttribute(this.el, 'label');
    const current = queryOne(this.el, '[aria-current="page"]');
    if (current) removeAriaAttribute(current, 'current');
    this.listElement = null;
    this.logger.info('Component destroyed');
    super.destroy();
  }
}

if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-breadcrumb')) {
  customElements.define(
    'k3ui-breadcrumb',
    class extends HTMLElement {
      connectedCallback(): void {
        if (!this.hasAttribute('data-initialized')) this.setAttribute('data-initialized', 'true');
      }
    }
  );
}
