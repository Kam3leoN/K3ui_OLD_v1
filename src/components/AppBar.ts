/**
 * @fileoverview Composant AppBar pour K3UI
 * @description Top App Bar M3 — variantes material.io ; scroll lift/collapse automatique
 * @see https://m3.material.io/components/app-bars/overview
 * @author K3UI Team
 * @version 1.2.0
 */

import { Component } from '../core/base/Component';
import { defineK3UIElement } from '../core/base/K3UIElement';
import { toComponentClassDef } from '../types/components/component-base';
import type { AppBarOptions } from '../types/components';
import { PriorityLevel } from '../types/base';
import { getAriaAttribute, setAriaAttribute, setAriaAttributes } from '../utils/dom/aria';
import { LoggerManager, LocaleManager } from '../core/managers';
import { ManagerFactory } from '../core/factories';
import { AppBarSpecs, getAppBarDefaults } from '../specs/components/appbar.specs';
import { getPreferReducedMotion } from '../utils/accessibility';

const _defaults: AppBarOptions = getAppBarDefaults();

const COLLAPSIBLE_VARIANTS: AppBarOptions['variant'][] = ['medium', 'large'];

/**
 * Classe AppBar pour K3UI
 */
export class AppBar extends Component<AppBarOptions> {
  readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

  private logger: LoggerManager;
  private lastScrollRatio = 0;
  private boundOnScroll: (() => void) | null = null;
  private scrollCleanup: (() => void) | null = null;

  static get defaults(): AppBarOptions {
    return { ..._defaults };
  }

  static getInstance(el: HTMLElement): AppBar | undefined {
    return Component.getInstance(el) as AppBar | undefined;
  }

  /**
   * Initialise une ou plusieurs AppBar
   * @param els Élément(s) ou sélecteur CSS
   * @param options Options partielles
   */
  static init(
    els: HTMLElement | NodeListOf<HTMLElement> | string,
    options: Partial<AppBarOptions> = {},
  ): AppBar | AppBar[] {
    return Component.init(els, options, toComponentClassDef(AppBar)) as AppBar | AppBar[];
  }

  /**
   * Crée un élément `<k3ui-appbar>` initialisé
   */
  static create(options: Partial<AppBarOptions> = {}): HTMLElement {
    const el = document.createElement('k3ui-appbar');
    if (options.variant) el.setAttribute('variant', options.variant);
    if (options.height) el.setAttribute('height', options.height);
    if (options.fixed) el.setAttribute('fixed', 'true');
    if (options.collapseDistance != null) {
      el.setAttribute('collapse-distance', String(options.collapseDistance));
    }
    new AppBar(el, options);
    return el;
  }

  constructor(el: HTMLElement, options: Partial<AppBarOptions> = {}) {
    super(el, options, toComponentClassDef(AppBar));

    this.logger = ManagerFactory.getLoggerManager('[AppBar]');

    this.options = {
      ...AppBar.defaults,
      ...options,
    };

    this.readAttributesFromElement();
    this.init();
  }

  private readAttributesFromElement(): void {
    const { el } = this;

    const variant = el.getAttribute('variant') as AppBarOptions['variant'] | null;
    if (variant && ['small', 'center', 'search', 'medium', 'large'].includes(variant)) {
      this.options.variant = variant;
    }

    const height = el.getAttribute('height') as AppBarOptions['height'] | null;
    if (height && ['small', 'medium', 'large'].includes(height)) {
      this.options.height = height;
    }

    if (el.hasAttribute('fixed')) {
      const v = el.getAttribute('fixed');
      this.options.fixed = v == null || v === '' || v === 'true';
    }

    const collapseAttr = el.getAttribute('collapse-distance') ?? el.getAttribute('data-collapse-distance');
    if (collapseAttr) {
      const n = parseInt(collapseAttr, 10);
      if (!Number.isNaN(n) && n > 0) {
        this.options.collapseDistance = n;
      }
    }
  }

  private init(): void {
    this.setupClasses();
    this.setupAria();
    this.setupAriaSearchField();
    this.setupScrollBehavior();
    this.logger.info('AppBar initialized');
  }

  private setupClasses(): void {
    this.el.classList.add('appbar', 'appbar--top');

    (['small', 'center', 'search', 'medium', 'large'] as const).forEach((v) => {
      this.el.classList.toggle(`appbar--${v}`, this.options.variant === v);
    });

    if (this.options.fixed) {
      this.el.classList.add('appbar--fixed');
    }

    if (this.isCollapsibleVariant()) {
      this.el.classList.add('appbar--collapsible');
      this.el.style.setProperty('--appbar-scroll-ratio', String(this.options.scrollRatio ?? 0));
    }
  }

  private setupAria(): void {
    const ariaLabel =
      this.el.getAttribute('aria-label') ||
      LocaleManager.t('appbar.ariaLabel') ||
      undefined;

    setAriaAttributes(this.el, {
      role: AppBarSpecs.accessibility.role,
      label: ariaLabel ?? null,
    });
  }

  private setupAriaSearchField(): void {
    if (this.options.variant !== 'search') {
      return;
    }

    const field = this.el.querySelector('.appbar__search-field');
    if (!field) {
      return;
    }

    const input = field.querySelector<HTMLInputElement>('input[type="search"], input:not([type])');
    if (!input) {
      return;
    }

    const hasAriaLabel = getAriaAttribute(input, 'label');
    const hasAriaLabelledBy = getAriaAttribute(input, 'labelledby');
    const hasAssociatedLabel = typeof input.labels !== 'undefined' && input.labels !== null && input.labels.length > 0;

    if (hasAriaLabel || hasAriaLabelledBy || hasAssociatedLabel) {
      return;
    }

    setAriaAttribute(input, 'label', LocaleManager.t('appbar.searchInputAriaLabel'));
  }

  private isCollapsibleVariant(): boolean {
    return COLLAPSIBLE_VARIANTS.includes(this.options.variant);
  }

  /** M3 : lift on scroll (toutes variantes) + collapse medium/large flexible */
  private setupScrollBehavior(): void {
    const disableAnimations = getPreferReducedMotion();
    if (disableAnimations) {
      this.el.classList.add('appbar--reduced-motion');
    }

    const onScroll = (): void => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      const threshold = AppBarSpecs.behaviors.liftScrollThreshold;

      this.el.classList.toggle('appbar--scrolled', scrollTop > threshold);

      if (this.isCollapsibleVariant()) {
        const distance = Math.max(1, this.options.collapseDistance);
        const ratio = Math.max(0, Math.min(1, scrollTop / distance));
        if (Math.abs(ratio - this.lastScrollRatio) >= 0.005) {
          this.lastScrollRatio = ratio;
          this.options.scrollRatio = ratio;
          this.el.style.setProperty('--appbar-scroll-ratio', String(ratio));
          this.options.onScrollRatioChange?.(ratio, this);
        }
      }
    };

    this.boundOnScroll = onScroll;
    this.scrollCleanup?.();
    this.scrollCleanup = this.registerEvent(window, 'scroll', onScroll, { passive: true });
    onScroll();
  }

  public updateOptions(options: Partial<AppBarOptions>): void {
    this.options = {
      ...this.options,
      ...options,
    };
    this.setupClasses();
    this.setupAria();
    this.setupAriaSearchField();
    if (this.scrollCleanup) {
      this.scrollCleanup();
      this.scrollCleanup = null;
    }
    this.boundOnScroll = null;
    this.setupScrollBehavior();
  }

  public override destroy(): void {
    this.scrollCleanup?.();
    this.scrollCleanup = null;
    this.boundOnScroll = null;
    this.logger.info('AppBar destroyed');
    super.destroy();
  }
}

defineK3UIElement('k3ui-appbar', AppBar);
