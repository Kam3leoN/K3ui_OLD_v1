/**
 * @fileoverview Composant Collapse pour K3UI
 * @description Accordion Material Design 3 Expressive (rayons morphiques, exclusive par défaut)
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { toComponentClassDef } from '../types/components/component-base';
import type { CollapseOptions } from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { setAriaAttributes, removeAriaAttribute } from '../utils/dom/aria';
import { generateGuid } from '../utils/helpers/guid';
import { IconManager, Keyboard, LocaleManager, LoggerManager } from '../core/managers';
import { ManagerFactory } from '../core/factories';
import { CollapseSpecs, getCollapseDefaults } from '../specs/components/collapse.specs';

interface KCollapseHTMLElement extends HTMLElement {
  K_Collapse?: Collapse;
}

interface CollapseItemRefs {
  item: HTMLElement;
  header: HTMLButtonElement;
  panel: HTMLElement;
  body: HTMLElement;
  trailing: HTMLElement | null;
  headerId: string;
  panelId: string;
  open: boolean;
  bodyVisible: boolean;
  closing: boolean;
  closingTimer: ReturnType<typeof setTimeout> | null;
  openEndTimer: ReturnType<typeof setTimeout> | null;
  closeEndTimer: ReturnType<typeof setTimeout> | null;
  keyboard: Keyboard | null;
}

const _defaults: CollapseOptions = getCollapseDefaults();

const XL = CollapseSpecs.radii.xl;
const XS = CollapseSpecs.radii.xs;

/**
 * Calcule le border-radius du header selon l'index et l'item ouvert
 */
function headerRadii(i: number, total: number, openIdx: number | null): string {
  let tl = XS;
  let tr = XS;
  let bl = XS;
  let br = XS;

  if (total === 1 && openIdx === null) {
    return `${XL}px ${XL}px ${XL}px ${XL}px`;
  }
  if (total === 1 && openIdx === 0) {
    return `${XL}px ${XL}px ${XS}px ${XS}px`;
  }

  if (i === 0) {
    tl = XL;
    tr = XL;
  }
  if (i === total - 1 && openIdx !== i) {
    bl = XL;
    br = XL;
  }

  if (openIdx !== null && i === openIdx) {
    tl = XL;
    tr = XL;
    bl = XS;
    br = XS;
  }

  return `${tl}px ${tr}px ${br}px ${bl}px`;
}

/**
 * Border-radius du body (toujours XL en bas)
 */
function bodyRadii(): string {
  return `${XS}px ${XS}px ${XL}px ${XL}px`;
}

/**
 * Composant Collapse — accordion M3 Expressive.
 */
export class Collapse extends Component<CollapseOptions> {
  readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

  private logger: LoggerManager;
  private items: CollapseItemRefs[] = [];
  private idPrefix: string;

  static get defaults(): CollapseOptions {
    return { ..._defaults };
  }

  /**
   * Obtient l'instance Collapse liée à un élément
   */
  static getInstance(el: HTMLElement): Collapse | undefined {
    return (el as KCollapseHTMLElement).K_Collapse;
  }

  /**
   * Initialise un ou plusieurs éléments Collapse
   */
  static init(
    els: KElement | InitElements<KElement> | string,
    options: Partial<CollapseOptions> = {}
  ): Collapse | Collapse[] {
    return Component.init(els, options, toComponentClassDef(Collapse)) as Collapse | Collapse[];
  }

  constructor(el: HTMLElement, options: Partial<CollapseOptions> = {}) {
    super(el, options, toComponentClassDef(Collapse));

    this.logger = ManagerFactory.getLoggerManager('[Collapse]');
    this.idPrefix = `k3ui-collapse-${generateGuid()}`;

    this.options = {
      ...Collapse.defaults,
      ...options,
      ...this.readDataOptions(),
    };

    (el as KCollapseHTMLElement).K_Collapse = this;
    this.mount();
  }

  /**
   * Lit les options depuis les attributs data-*
   */
  private readDataOptions(): Partial<CollapseOptions> {
    const data: Partial<CollapseOptions> = {};

    if (this.el.dataset.exclusive === 'false') {
      data.exclusive = false;
    } else if (this.el.dataset.exclusive === 'true') {
      data.exclusive = true;
    }

    if (this.el.dataset.openIndex !== undefined) {
      const parsed = Number.parseInt(this.el.dataset.openIndex, 10);
      if (!Number.isNaN(parsed)) {
        data.openIndex = parsed;
      }
    }

    if (this.el.dataset.animationDuration !== undefined) {
      const parsed = Number.parseInt(this.el.dataset.animationDuration, 10);
      if (!Number.isNaN(parsed)) {
        data.animationDuration = parsed;
      }
    }

    if (this.el.dataset.chevronIcon) {
      data.chevronIcon = this.el.dataset.chevronIcon;
    }

    return data;
  }

  /**
   * Monte le composant : scan items, ARIA, événements, état initial
   */
  private mount(): void {
    this.el.classList.add('collapse');
    setAriaAttributes(this.el, {
      role: 'region',
      label: LocaleManager.t('collapse.ariaLabel'),
    });

    this.scanItems();
    this.bindEvents();
    this.applyInitialOpenState();
    this.updateAllRadii();
    this.processIcons();
    this.logger.info('Collapse initialized');
  }

  /**
   * Scanne et normalise les items `.collapse__item`
   */
  private scanItems(): void {
    const itemEls = Array.from(this.el.querySelectorAll<HTMLElement>(':scope > .collapse__item'));

    this.items = itemEls.map((item, index) => {
      const header = this.ensureHeader(item);
      const { panel, body } = this.ensurePanel(item, header);
      const trailing = this.ensureTrailing(header);

      const headerId = header.id || `${this.idPrefix}-header-${index}`;
      const panelId = panel.id || `${this.idPrefix}-panel-${index}`;
      header.id = headerId;
      panel.id = panelId;

      setAriaAttributes(header, {
        expanded: 'false',
        controls: panelId,
      });
      setAriaAttributes(panel, {
        role: CollapseSpecs.accessibility.role,
        labelledby: headerId,
        hidden: true,
      });

      body.style.borderRadius = bodyRadii();

      return {
        item,
        header,
        panel,
        body,
        trailing,
        headerId,
        panelId,
        open: false,
        bodyVisible: false,
        closing: false,
        closingTimer: null,
        openEndTimer: null,
        closeEndTimer: null,
        keyboard: null,
      };
    });
  }

  /**
   * Garantit un bouton header
   */
  private ensureHeader(item: HTMLElement): HTMLButtonElement {
    let header = item.querySelector<HTMLButtonElement>(':scope > .collapse__header');
    if (!header) {
      header = document.createElement('button');
      header.type = 'button';
      header.className = 'collapse__header';

      const label = document.createElement('span');
      label.className = 'collapse__label';
      while (item.firstChild) {
        label.appendChild(item.firstChild);
      }
      header.appendChild(label);
      item.insertBefore(header, item.firstChild);
    }

    if (header.tagName !== 'BUTTON') {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = header.className;
      btn.innerHTML = header.innerHTML;
      header.replaceWith(btn);
      header = btn;
    } else {
      header.type = 'button';
    }

    return header;
  }

  /**
   * Garantit panel + clip + body
   */
  private ensurePanel(
    item: HTMLElement,
    header: HTMLButtonElement
  ): { panel: HTMLElement; body: HTMLElement } {
    let panel = item.querySelector<HTMLElement>(':scope > .collapse__panel');
    if (!panel) {
      panel = document.createElement('div');
      panel.className = 'collapse__panel';

      const siblings: Node[] = [];
      Array.from(item.childNodes).forEach((node) => {
        if (node !== header) {
          siblings.push(node);
        }
      });

      const clip = document.createElement('div');
      clip.className = 'collapse__clip';
      const body = document.createElement('div');
      body.className = 'collapse__body';
      siblings.forEach((node) => body.appendChild(node));
      clip.appendChild(body);
      panel.appendChild(clip);
      item.appendChild(panel);
      return { panel, body };
    }

    let clip = panel.querySelector<HTMLElement>(':scope > .collapse__clip');
    if (!clip) {
      clip = document.createElement('div');
      clip.className = 'collapse__clip';
      while (panel.firstChild) {
        clip.appendChild(panel.firstChild);
      }
      panel.appendChild(clip);
    }

    let body = clip.querySelector<HTMLElement>(':scope > .collapse__body');
    if (!body) {
      body = document.createElement('div');
      body.className = 'collapse__body';
      while (clip.firstChild) {
        body.appendChild(clip.firstChild);
      }
      clip.appendChild(body);
    }

    return { panel, body };
  }

  /**
   * Garantit le slot trailing + chevron
   */
  private ensureTrailing(header: HTMLButtonElement): HTMLElement {
    let trailing = header.querySelector<HTMLElement>(':scope > .collapse__trailing');
    if (!trailing) {
      trailing = document.createElement('span');
      trailing.className = 'collapse__trailing';
      header.appendChild(trailing);
    }

    if (!trailing.querySelector('.collapse__chevron, .icon, i[name]')) {
      const icon = document.createElement('i');
      icon.className = 'icon collapse__chevron';
      icon.setAttribute('name', this.options.chevronIcon);
      setAriaAttributes(icon, { hidden: true });
      trailing.appendChild(icon);
    } else {
      const chevron = trailing.querySelector<HTMLElement>('.collapse__chevron, .icon, i[name]');
      chevron?.classList.add('collapse__chevron');
      if (chevron) {
        this.normalizeIconElement(chevron, this.options.chevronIcon);
        setAriaAttributes(chevron, { hidden: true });
      }
    }

    setAriaAttributes(trailing, {
      label: LocaleManager.t('collapse.expand'),
    });

    return trailing;
  }

  /**
   * Convertit une icône texte Material (`<i class="icon">name</i>`) vers le format IconManager (`name`)
   */
  private normalizeIconElement(el: HTMLElement, fallbackName?: string): void {
    if (!el.hasAttribute('name')) {
      const fromText = (el.textContent || '').trim();
      const name = fromText || fallbackName || '';
      if (name) {
        el.setAttribute('name', name);
      }
    }
    el.textContent = '';
  }

  /**
   * Normalise toutes les icônes du conteneur puis les charge via IconManager
   */
  private processIcons(): void {
    this.el.querySelectorAll<HTMLElement>('i.icon, i.collapse__chevron, .collapse__leading i, .collapse__trailing i').forEach((icon) => {
      this.normalizeIconElement(icon);
    });
    IconManager.processIconsInContainer(this.el);
  }

  /**
   * Attache click + clavier sur chaque header
   */
  private bindEvents(): void {
    this.items.forEach((refs, index) => {
      this.registerEvent(refs.header, 'click', (e: Event) => {
        e.preventDefault();
        this.toggle(index);
      });

      refs.keyboard = new Keyboard({
        target: refs.header,
        onKeyDown: (event, key) => {
          this.handleHeaderKeyDown(event, key, index);
        },
      });
    });
  }

  /**
   * Navigation clavier accordion (Enter/Space/flèches/Home/End)
   */
  private handleHeaderKeyDown(event: KeyboardEvent, key: string, index: number): void {
    const total = this.items.length;
    if (total === 0) return;

    let next = -1;

    if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      this.toggle(index);
      return;
    }

    if (key === 'ArrowDown') {
      event.preventDefault();
      next = (index + 1) % total;
    } else if (key === 'ArrowUp') {
      event.preventDefault();
      next = (index - 1 + total) % total;
    } else if (key === 'Home') {
      event.preventDefault();
      next = 0;
    } else if (key === 'End') {
      event.preventDefault();
      next = total - 1;
    }

    if (next >= 0) {
      this.items[next]?.header.focus();
    }
  }

  /**
   * Applique l'état ouvert initial (data-open / openIndex)
   */
  private applyInitialOpenState(): void {
    const fromData: number[] = [];
    this.items.forEach((refs, index) => {
      if (
        refs.item.hasAttribute('data-open') ||
        refs.item.classList.contains('collapse__item--open')
      ) {
        fromData.push(index);
      }
    });

    let toOpen: number[] = [];
    if (fromData.length > 0) {
      toOpen = this.options.exclusive ? [fromData[0]] : fromData;
    } else if (this.options.openIndex !== null && this.options.openIndex >= 0) {
      toOpen = [this.options.openIndex];
    }

    toOpen.forEach((index) => {
      this.setItemOpen(index, true, true);
    });
  }

  /**
   * Ouvre un item par index
   */
  public open(index: number): void {
    if (!this.isValidIndex(index) || this.items[index].open) return;

    if (this.options.exclusive) {
      this.items.forEach((refs, i) => {
        if (i !== index && refs.open) {
          this.setItemOpen(i, false, false);
        }
      });
    }

    this.setItemOpen(index, true, false);
    this.emitChange();
  }

  /**
   * Ferme un item par index
   */
  public close(index: number): void {
    if (!this.isValidIndex(index) || !this.items[index].open) return;
    this.setItemOpen(index, false, false);
    this.emitChange();
  }

  /**
   * Bascule l'état d'un item
   */
  public toggle(index: number): void {
    if (!this.isValidIndex(index)) return;
    if (this.items[index].open) {
      this.close(index);
    } else {
      this.open(index);
    }
  }

  /**
   * Ferme tous les items
   */
  public closeAll(): void {
    let changed = false;
    this.items.forEach((refs, index) => {
      if (refs.open) {
        this.setItemOpen(index, false, false);
        changed = true;
      }
    });
    if (changed) {
      this.emitChange();
    }
  }

  /**
   * Indique si un item est ouvert
   */
  public isOpen(index: number): boolean {
    return this.isValidIndex(index) ? this.items[index].open : false;
  }

  /**
   * Index ouvert en mode exclusif (premier ouvert sinon)
   */
  public getOpenIndex(): number | null {
    const open = this.getOpenIndexes();
    return open.length > 0 ? open[0] : null;
  }

  /**
   * Liste des indexes ouverts
   */
  public getOpenIndexes(): number[] {
    return this.items
      .map((refs, index) => (refs.open ? index : -1))
      .filter((index) => index >= 0);
  }

  /**
   * Applique l'ouverture / fermeture d'un item avec animation
   */
  private setItemOpen(index: number, open: boolean, silent: boolean): void {
    const refs = this.items[index];
    if (!refs) return;

    this.clearItemTimers(refs);

    if (open) {
      refs.open = true;
      refs.closing = false;
      refs.item.classList.add('collapse__item--open');
      refs.header.classList.add('collapse__header--open');
      refs.panel.classList.add('collapse__panel--open');
      refs.body.classList.remove('collapse__body--closing');

      setAriaAttributes(refs.header, {
        expanded: 'true',
      });
      if (refs.trailing) {
        setAriaAttributes(refs.trailing, {
          label: LocaleManager.t('collapse.collapse'),
        });
      }
      setAriaAttributes(refs.panel, { hidden: false });

      if (!silent) {
        this.options.onOpenStart?.(this.el);
      }

      requestAnimationFrame(() => {
        refs.bodyVisible = true;
        refs.body.classList.add('collapse__body--visible');
      });

      this.updateAllRadii();

      if (!silent) {
        refs.openEndTimer = setTimeout(() => {
          this.options.onOpenEnd?.(this.el);
        }, this.options.animationDuration);
      }
    } else {
      if (!silent) {
        this.options.onCloseStart?.(this.el);
      }

      refs.open = false;
      refs.bodyVisible = false;
      refs.closing = true;
      refs.body.classList.remove('collapse__body--visible');
      refs.body.classList.add('collapse__body--closing');
      refs.item.classList.remove('collapse__item--open');
      refs.header.classList.remove('collapse__header--open');
      refs.panel.classList.remove('collapse__panel--open');

      setAriaAttributes(refs.header, {
        expanded: 'false',
      });
      if (refs.trailing) {
        setAriaAttributes(refs.trailing, {
          label: LocaleManager.t('collapse.expand'),
        });
      }
      setAriaAttributes(refs.panel, { hidden: true });

      this.updateAllRadii();

      refs.closingTimer = setTimeout(() => {
        refs.closing = false;
        refs.body.classList.remove('collapse__body--closing');
      }, CollapseSpecs.behaviors.closingFadeMs);

      if (!silent) {
        refs.closeEndTimer = setTimeout(() => {
          this.options.onCloseEnd?.(this.el);
        }, this.options.animationDuration);
      }
    }
  }

  /**
   * Met à jour les border-radius de tous les headers
   */
  private updateAllRadii(): void {
    const total = this.items.length;
    const openIdx = this.options.exclusive ? this.getOpenIndex() : null;

    this.items.forEach((refs, index) => {
      const radius = headerRadii(
        index,
        total,
        this.options.exclusive ? openIdx : refs.open ? index : null
      );
      refs.header.style.borderRadius = radius;
      refs.body.style.borderRadius = bodyRadii();
    });
  }

  /**
   * Émet onChange
   */
  private emitChange(): void {
    this.options.onChange?.(this.getOpenIndex(), this.getOpenIndexes());
  }

  private isValidIndex(index: number): boolean {
    return index >= 0 && index < this.items.length;
  }

  private clearItemTimers(refs: CollapseItemRefs): void {
    if (refs.closingTimer !== null) {
      clearTimeout(refs.closingTimer);
      refs.closingTimer = null;
    }
    if (refs.openEndTimer !== null) {
      clearTimeout(refs.openEndTimer);
      refs.openEndTimer = null;
    }
    if (refs.closeEndTimer !== null) {
      clearTimeout(refs.closeEndTimer);
      refs.closeEndTimer = null;
    }
  }

  /**
   * Détruit l'instance
   */
  public override destroy(): void {
    this.items.forEach((refs) => {
      this.clearItemTimers(refs);
      refs.keyboard?.destroy();
      refs.keyboard = null;
      removeAriaAttribute(refs.header, 'expanded');
      removeAriaAttribute(refs.header, 'controls');
      removeAriaAttribute(refs.panel, 'labelledby');
      removeAriaAttribute(refs.panel, 'hidden');
      removeAriaAttribute(refs.panel, 'role');
    });
    this.items = [];

    removeAriaAttribute(this.el, 'label');
    removeAriaAttribute(this.el, 'role');

    if ((this.el as KCollapseHTMLElement).K_Collapse === this) {
      delete (this.el as KCollapseHTMLElement).K_Collapse;
    }

    this.logger.info('Collapse destroyed');
    super.destroy();
  }
}
