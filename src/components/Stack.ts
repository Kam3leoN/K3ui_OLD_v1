/**
 * @fileoverview Composant Stack pour K3UI
 * @description Pile visuelle d’éléments (overlap horizontal ou deck en profondeur)
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { toComponentClassDef } from '../types/components/component-base';
import type {
  StackAlign,
  StackDirection,
  StackOptions,
  StackVariant,
} from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { setAriaAttributes, removeAriaAttribute } from '../utils/dom/aria';
import { LoggerManager, LocaleManager } from '../core/managers';
import { ManagerFactory } from '../core/factories';
import { StackSpecs, getStackDefaults } from '../specs/components/stack.specs';

interface KStackHTMLElement extends HTMLElement {
  K_Stack?: Stack;
}

const { classes: STACK_CLASSES } = StackSpecs;

const _defaults: StackOptions = getStackDefaults();

const VARIANTS: readonly StackVariant[] = StackSpecs.variants.available;
const DIRECTIONS: readonly StackDirection[] = StackSpecs.directions.available;
const ALIGNS: readonly StackAlign[] = StackSpecs.aligns.available;

/** Direction canonique deck / peek */
type StackPeekDirection = 'top' | 'bottom' | 'left' | 'right';

function isVariant(value: string): value is StackVariant {
  return (VARIANTS as readonly string[]).includes(value);
}

function isDirection(value: string): value is StackDirection {
  return (DIRECTIONS as readonly string[]).includes(value);
}

function isAlign(value: string): value is StackAlign {
  return (ALIGNS as readonly string[]).includes(value);
}

/**
 * Normalise start/end → left/right pour le layout deck
 */
export function normalizeStackDirection(direction: StackDirection): StackPeekDirection {
  if (direction === 'start') return 'left';
  if (direction === 'end') return 'right';
  return direction;
}

/**
 * Classe Stack — empilement présentational (overlap ou deck).
 */
export class Stack extends Component<StackOptions> {
  readonly priority: PriorityLevel = PriorityLevel.LOW;

  private logger: LoggerManager;
  private items: HTMLElement[] = [];
  private remainingEl: HTMLElement | null = null;

  static get defaults(): StackOptions {
    return { ..._defaults };
  }

  /**
   * Obtient l’instance Stack liée à un élément
   */
  static getInstance(el: HTMLElement): Stack | undefined {
    return (el as KStackHTMLElement).K_Stack;
  }

  /**
   * Initialise un ou plusieurs éléments Stack
   */
  static init(
    els: KElement | InitElements<KElement> | string,
    options: Partial<StackOptions> = {}
  ): Stack | Stack[] {
    return Component.init(els, options, toComponentClassDef(Stack)) as Stack | Stack[];
  }

  constructor(el: HTMLElement, options: Partial<StackOptions> = {}) {
    super(el, options, toComponentClassDef(Stack));

    this.logger = ManagerFactory.getLoggerManager('[Stack]');

    this.options = {
      ...Stack.defaults,
      ...options,
      ...this.readDataOptions(),
    };

    (el as KStackHTMLElement).K_Stack = this;
    this.mount();
  }

  /**
   * Lit les options depuis data-* / attributs
   */
  private readDataOptions(): Partial<StackOptions> {
    const data: Partial<StackOptions> = {};

    const variant = this.el.dataset.variant;
    if (variant && isVariant(variant)) {
      data.variant = variant;
    }

    const direction = this.el.dataset.direction;
    if (direction && isDirection(direction)) {
      data.direction = direction;
    }

    const align = this.el.dataset.align;
    if (align && isAlign(align)) {
      data.align = align;
    }

    const depth = this.parsePositiveInt(this.el.dataset.depth);
    if (depth !== null) {
      data.depth = depth;
    }

    const offset = this.parsePositiveInt(this.el.dataset.offset);
    if (offset !== null) {
      data.offset = offset;
    }

    const max = this.parsePositiveInt(this.el.getAttribute('data-max') ?? this.el.dataset.max);
    if (max !== null) {
      data.max = max;
      data.showRemaining = true;
    }

    if (this.el.classList.contains(STACK_CLASSES.limited) || this.el.hasAttribute('data-limited')) {
      data.showRemaining = true;
      if (data.max == null) {
        data.max = 4;
      }
    }

    if (this.el.dataset.scroll === 'false') {
      data.scroll = false;
    }

    const itemSelector = this.el.dataset.itemSelector;
    if (itemSelector) {
      data.itemSelector = itemSelector;
    }

    return data;
  }

  private parsePositiveInt(raw: string | null | undefined): number | null {
    if (raw == null || raw === '') {
      return null;
    }
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }

  private resolveVariant(): StackVariant {
    return this.options.variant ?? StackSpecs.variants.default;
  }

  private resolveDirection(): StackDirection {
    return this.options.direction ?? StackSpecs.directions.default;
  }

  private resolveAlign(): StackAlign {
    return this.options.align ?? StackSpecs.aligns.default;
  }

  /**
   * Enrichit les options depuis les classes BEM déjà présentes
   */
  private seedOptionsFromClasses(): void {
    if (this.el.classList.contains(`${STACK_CLASSES.variantPrefix}deck`)) {
      this.options.variant = 'deck';
    } else if (this.el.classList.contains(`${STACK_CLASSES.variantPrefix}overlap`)) {
      this.options.variant = 'overlap';
    }

    const dirKeys: StackDirection[] = ['top', 'bottom', 'left', 'right', 'start', 'end'];
    for (const dir of dirKeys) {
      if (this.el.classList.contains(`${STACK_CLASSES.directionPrefix}${dir}`)) {
        this.options.direction = dir;
        break;
      }
    }

    if (this.el.classList.contains(`${STACK_CLASSES.alignPrefix}center`)) {
      this.options.align = 'center';
    } else if (this.el.classList.contains(`${STACK_CLASSES.alignPrefix}end`)) {
      this.options.align = 'end';
    } else if (this.el.classList.contains(`${STACK_CLASSES.alignPrefix}start`)) {
      this.options.align = 'start';
    }
  }

  /**
   * Monte le DOM (classes, layout, ARIA)
   */
  private mount(): void {
    this.el.classList.add(STACK_CLASSES.root);
    this.seedOptionsFromClasses();
    this.syncVariant();
    this.syncDirection();
    this.syncAlign();
    this.syncScroll();
    this.syncCssVars();
    this.refresh();
    this.syncAccessibility();
    this.options.onOpenEnd?.(this.el);
    this.logger.info('Stack initialized');
  }

  private syncVariant(): void {
    const variant = this.resolveVariant();
    this.el.classList.toggle(`${STACK_CLASSES.variantPrefix}deck`, variant === 'deck');
    this.el.classList.toggle(`${STACK_CLASSES.variantPrefix}overlap`, variant === 'overlap');
    this.options.variant = variant;
  }

  private syncDirection(): void {
    let direction = this.resolveDirection();
    // Deck : défaut top si encore start (alias overlap)
    if (this.options.variant === 'deck' && (direction === 'start' || direction === 'end')) {
      // conserver start/end mappés en left/right ; si pure default start + deck → top
      if (direction === 'start' && !this.el.dataset.direction) {
        direction = StackSpecs.directions.deckDefault;
      }
    }
    this.el.classList.remove(
      `${STACK_CLASSES.directionPrefix}top`,
      `${STACK_CLASSES.directionPrefix}bottom`,
      `${STACK_CLASSES.directionPrefix}left`,
      `${STACK_CLASSES.directionPrefix}right`,
      `${STACK_CLASSES.directionPrefix}start`,
      `${STACK_CLASSES.directionPrefix}end`
    );
    this.el.classList.add(`${STACK_CLASSES.directionPrefix}${direction}`);
    this.options.direction = direction;
  }

  private syncAlign(): void {
    const align = this.resolveAlign();
    ALIGNS.forEach((a) => {
      this.el.classList.remove(`${STACK_CLASSES.alignPrefix}${a}`);
    });
    this.el.classList.add(`${STACK_CLASSES.alignPrefix}${align}`);
    this.options.align = align;
  }

  private syncScroll(): void {
    const scroll = this.options.variant === 'deck' ? false : Boolean(this.options.scroll);
    this.el.classList.toggle(STACK_CLASSES.scroll, scroll);
    this.options.scroll = scroll;
  }

  private syncCssVars(): void {
    const isDeck = this.options.variant === 'deck';
    const offset = isDeck
      ? (this.el.dataset.offset != null ? this.options.offset : StackSpecs.behaviors.deckOffset)
      : this.options.offset;
    const depth = Math.min(this.options.depth, StackSpecs.behaviors.depthMax);
    this.el.style.setProperty('--k3ui-stack-offset', `${offset}px`);
    this.el.style.setProperty('--k3ui-stack-depth', String(depth));
    this.el.style.setProperty('--k3ui-stack-scale-step', String(this.options.scaleStep));
    this.el.style.setProperty('--k3ui-stack-opacity-step', String(this.options.opacityStep));
  }

  private syncAccessibility(): void {
    setAriaAttributes(this.el, {
      role: StackSpecs.accessibility.role,
      label: LocaleManager.t('stack.ariaLabel'),
    });
  }

  private queryItems(): HTMLElement[] {
    return Array.from(this.el.querySelectorAll<HTMLElement>(this.options.itemSelector)).filter(
      (node) => !node.classList.contains(STACK_CLASSES.remaining)
    );
  }

  private clearItemInlineStyles(item: HTMLElement): void {
    item.style.zIndex = '';
    item.style.transform = '';
    item.style.transformOrigin = '';
    item.style.opacity = '';
    item.style.pointerEvents = '';
    item.style.display = '';
    item.removeAttribute('data-stack-index');
    item.removeAttribute('data-behind');
  }

  /**
   * Layout deck compact (style shadcn collapsed) — peek selon orientation.
   * Plafonne à 3 couches ; ombre gérée en CSS sur [data-stack-index="0"] uniquement.
   */
  static layoutDeck(
    items: HTMLElement[],
    options: {
      depth?: number;
      offset?: number;
      scaleStep?: number;
      opacityStep?: number;
      direction?: StackDirection;
    } = {}
  ): void {
    const depthMax = StackSpecs.behaviors.depthMax;
    const depth = Math.min(
      Math.max(1, options.depth ?? StackSpecs.behaviors.depth),
      depthMax
    );
    const offset = options.offset ?? StackSpecs.behaviors.deckOffset;
    const scaleStep = options.scaleStep ?? StackSpecs.behaviors.scaleStep;
    const opacityStep = options.opacityStep ?? StackSpecs.behaviors.opacityStep;
    const peek = normalizeStackDirection(
      options.direction ?? StackSpecs.directions.deckDefault
    );

    const origins: Record<StackPeekDirection, string> = {
      top: 'bottom center',
      bottom: 'top center',
      left: 'right center',
      right: 'left center',
    };

    items.forEach((item, index) => {
      item.classList.add(STACK_CLASSES.item);
      item.style.display = '';
      item.style.zIndex = String(items.length - index);
      item.style.transformOrigin = origins[peek];
      item.setAttribute('data-stack-index', String(index));

      if (index === 0) {
        item.style.transform = '';
        item.style.opacity = '1';
        item.style.pointerEvents = 'auto';
        item.removeAttribute('data-behind');
        return;
      }

      if (index < depth) {
        const scale = Math.max(0.7, 1 - index * scaleStep);
        const delta = index * offset;
        let transform = '';
        if (peek === 'top') {
          transform = `translateY(${-delta}px) scale(${scale})`;
        } else if (peek === 'bottom') {
          transform = `translateY(${delta}px) scale(${scale})`;
        } else if (peek === 'left') {
          transform = `translateX(${-delta}px) scale(${scale})`;
        } else {
          transform = `translateX(${delta}px) scale(${scale})`;
        }
        item.style.transform = transform;
        item.style.opacity = String(
          opacityStep === 0 ? 1 : Math.max(0.5, 1 - index * opacityStep)
        );
        item.style.pointerEvents = 'none';
        item.setAttribute('data-behind', '');
        return;
      }

      item.style.opacity = '0';
      item.style.pointerEvents = 'none';
      item.style.transform = '';
      item.setAttribute('data-behind', '');
    });
  }

  /**
   * Layout overlap (z-index + max) — utilisable sans instance
   */
  static layoutOverlap(
    items: HTMLElement[],
    options: { max?: number | null } = {}
  ): { visible: HTMLElement[]; remaining: number } {
    const max = options.max;
    const limited = max != null && max >= 0;
    const visible = limited ? items.slice(0, max) : items;
    const remaining = limited ? Math.max(0, items.length - max!) : 0;

    items.forEach((item, index) => {
      item.classList.add(STACK_CLASSES.item);
      if (limited && index >= max!) {
        item.style.display = 'none';
        item.style.zIndex = '';
        return;
      }
      item.style.display = '';
      item.style.zIndex = String(visible.length - index);
      item.style.transform = '';
      item.style.opacity = '';
      item.style.pointerEvents = '';
    });

    return { visible, remaining };
  }

  private removeRemaining(): void {
    const existing =
      this.remainingEl ??
      this.el.querySelector<HTMLElement>(`.${STACK_CLASSES.remaining}`);
    if (existing) {
      existing.remove();
    }
    this.remainingEl = null;
  }

  private syncRemaining(remaining: number): void {
    this.removeRemaining();
    if (!this.options.showRemaining || remaining <= 0 || this.options.variant === 'deck') {
      this.el.classList.toggle(STACK_CLASSES.limited, false);
      return;
    }

    this.el.classList.add(STACK_CLASSES.limited);
    const indicator = document.createElement('div');
    indicator.className = STACK_CLASSES.remaining;
    indicator.textContent = `+${remaining}`;
    setAriaAttributes(indicator, {
      label: LocaleManager.t('stack.remainingLabel').replace('{count}', String(remaining)),
    });
    this.el.appendChild(indicator);
    this.remainingEl = indicator;
  }

  /**
   * Applique le layout overlap (z-index + masquage max)
   */
  private applyOverlapLayout(): void {
    const { remaining } = Stack.layoutOverlap(this.items, { max: this.options.max });
    this.syncRemaining(remaining);
  }

  /**
   * Applique le layout deck (échelle / translation / profondeur)
   */
  private applyDeckLayout(): void {
    this.removeRemaining();
    this.el.classList.toggle(STACK_CLASSES.limited, false);
    const offset =
      this.el.dataset.offset != null
        ? this.options.offset
        : StackSpecs.behaviors.deckOffset;
    Stack.layoutDeck(this.items, {
      depth: this.options.depth,
      offset,
      scaleStep: this.options.scaleStep,
      opacityStep: this.options.opacityStep,
      direction: this.options.direction,
    });
  }

  /**
   * Recalcule les enfants et réapplique le layout
   * @returns Les items visibles (tous les enfants matchés)
   */
  public refresh(): HTMLElement[] {
    this.items = this.queryItems();
    this.syncCssVars();

    if (this.options.variant === 'deck') {
      this.applyDeckLayout();
    } else {
      this.applyOverlapLayout();
    }

    return this.items;
  }

  /**
   * Items actuellement gérés
   */
  public getItems(): HTMLElement[] {
    return [...this.items];
  }

  /**
   * Nombre d’items (hors indicateur +N)
   */
  public getItemCount(): number {
    return this.items.length;
  }

  /**
   * Met à jour la variante
   */
  public setVariant(variant: StackVariant): void {
    if (!isVariant(variant)) return;
    this.options.variant = variant;
    this.syncVariant();
    this.syncScroll();
    this.refresh();
  }

  /**
   * Met à jour la direction (overlap)
   */
  public setDirection(direction: StackDirection): void {
    if (!isDirection(direction)) return;
    this.options.direction = direction;
    this.syncDirection();
    this.refresh();
  }

  /**
   * Met à jour l’alignement
   */
  public setAlign(align: StackAlign): void {
    if (!isAlign(align)) return;
    this.options.align = align;
    this.syncAlign();
  }

  /**
   * Met à jour la profondeur visible (deck) ou informative
   */
  public setDepth(depth: number): void {
    if (!Number.isFinite(depth) || depth < 1) return;
    this.options.depth = depth;
    this.refresh();
  }

  /**
   * Met à jour le max visible (+N en overlap)
   */
  public setMax(max: number | null): void {
    this.options.max = max;
    this.options.showRemaining = max != null;
    this.refresh();
  }

  /**
   * Met à jour les options
   */
  public update(options: Partial<StackOptions>): void {
    this.options = { ...this.options, ...options };

    if (options.variant !== undefined) {
      this.syncVariant();
    }
    if (options.direction !== undefined) {
      this.syncDirection();
    }
    if (options.align !== undefined) {
      this.syncAlign();
    }
    if (options.scroll !== undefined || options.variant !== undefined) {
      this.syncScroll();
    }

    this.refresh();
  }

  /**
   * Détruit l’instance et nettoie styles / ARIA
   */
  public override destroy(): void {
    this.items.forEach((item) => this.clearItemInlineStyles(item));
    this.removeRemaining();

    this.el.classList.remove(
      STACK_CLASSES.root,
      `${STACK_CLASSES.variantPrefix}deck`,
      `${STACK_CLASSES.variantPrefix}overlap`,
      `${STACK_CLASSES.directionPrefix}top`,
      `${STACK_CLASSES.directionPrefix}bottom`,
      `${STACK_CLASSES.directionPrefix}left`,
      `${STACK_CLASSES.directionPrefix}right`,
      `${STACK_CLASSES.directionPrefix}start`,
      `${STACK_CLASSES.directionPrefix}end`,
      `${STACK_CLASSES.alignPrefix}start`,
      `${STACK_CLASSES.alignPrefix}center`,
      `${STACK_CLASSES.alignPrefix}end`,
      STACK_CLASSES.scroll,
      STACK_CLASSES.limited
    );

    this.el.style.removeProperty('--k3ui-stack-offset');
    this.el.style.removeProperty('--k3ui-stack-depth');
    this.el.style.removeProperty('--k3ui-stack-scale-step');
    this.el.style.removeProperty('--k3ui-stack-opacity-step');

    removeAriaAttribute(this.el, 'role');
    removeAriaAttribute(this.el, 'label');

    if ((this.el as KStackHTMLElement).K_Stack === this) {
      delete (this.el as KStackHTMLElement).K_Stack;
    }

    this.items = [];
    this.options.onCloseEnd?.(this.el);
    this.logger.info('Stack destroyed');
    super.destroy();
  }
}

/**
 * Custom Element k3ui-stack
 */
if (
  typeof window !== 'undefined' &&
  typeof customElements !== 'undefined' &&
  !customElements.get('k3ui-stack')
) {
  customElements.define(
    'k3ui-stack',
    class extends HTMLElement {
      connectedCallback(): void {
        if (!this.hasAttribute('data-initialized')) {
          this.setAttribute('data-initialized', 'true');
        }
      }

      disconnectedCallback(): void {
        const instance = (this as KStackHTMLElement).K_Stack;
        if (instance && typeof instance.destroy === 'function') {
          instance.destroy();
        }
        (this as KStackHTMLElement).K_Stack = undefined;
      }
    }
  );
}
