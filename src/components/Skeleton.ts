/**
 * @fileoverview Composant Skeleton pour K3UI
 * @description Placeholder de chargement Material Design 3 Expressive (pulse / wave)
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import type { SkeletonOptions } from '../types/components';
import { PriorityLevel } from '../types/base';
import { setAriaAttributes, removeAriaAttribute } from '../utils/dom/aria';
import { LoggerManager } from '../core/managers';
import { ManagerFactory } from '../core/factories';
import { LocaleManager } from '../core/managers';
import { getSkeletonDefaults } from '../specs/components/skeleton.specs';
import { getPreferReducedMotion } from '../utils/accessibility/reducedMotion';

interface KSkeletonHTMLElement extends HTMLElement {
  K_Skeleton?: Skeleton;
}

const _defaults: SkeletonOptions = getSkeletonDefaults();

/**
 * Classe Skeleton pour K3UI – M3 Expressive
 */
export class Skeleton extends Component<SkeletonOptions> {
  readonly priority: PriorityLevel = PriorityLevel.MEDIUM;
  private logger: LoggerManager;

  static get defaults(): SkeletonOptions {
    return { ..._defaults };
  }

  static getInstance(el: HTMLElement): Skeleton {
    return (el as KSkeletonHTMLElement).K_Skeleton!;
  }

  static init(
    els: HTMLElement | NodeListOf<HTMLElement> | string,
    options: Partial<SkeletonOptions> = {}
  ): Skeleton[] {
    return Component.init(els, options, toComponentClassDef(Skeleton)) as Skeleton[];
  }

  constructor(el: HTMLElement, options: Partial<SkeletonOptions> = {}) {
    super(el, options, toComponentClassDef(Skeleton));

    this.logger = ManagerFactory.getLoggerManager('Skeleton');

    const dataOptions: Partial<SkeletonOptions> = {};
    if (el.dataset.variant) dataOptions.variant = el.dataset.variant as SkeletonOptions['variant'];
    if (el.dataset.animation) dataOptions.animation = el.dataset.animation as SkeletonOptions['animation'];
    if (el.dataset.width != null) dataOptions.width = el.dataset.width;
    if (el.dataset.height != null) dataOptions.height = el.dataset.height;
    if (el.dataset.autoDisableForReducedMotion != null) {
      dataOptions.autoDisableForReducedMotion = el.dataset.autoDisableForReducedMotion !== 'false';
    }

    this.options = {
      ...Skeleton.defaults,
      ...options,
      ...dataOptions,
    };

    (el as KSkeletonHTMLElement).K_Skeleton = this;
    this.init();
  }

  private init(): void {
    this.el.classList.add('skeleton');

    const variant = this.options.variant ?? 'text';
    const animation = this.effectiveAnimation();

    this.el.classList.add(`skeleton--${variant}`);
    if (animation !== 'none') {
      this.el.classList.add(`skeleton--${animation}`);
    }

    if (this.options.width != null) {
      const w = typeof this.options.width === 'number' ? `${this.options.width}px` : this.options.width;
      this.el.style.width = w;
    }
    if (this.options.height != null) {
      const h = typeof this.options.height === 'number' ? `${this.options.height}px` : this.options.height;
      this.el.style.height = h;
    }

    this.setupAccessibility();
    this.logger.info('Skeleton initialized');
  }

  private effectiveAnimation(): 'pulse' | 'wave' | 'none' {
    if (this.options.animation === 'none') return 'none';
    if (
      this.options.autoDisableForReducedMotion &&
      getPreferReducedMotion()
    ) {
      return 'none';
    }
    return this.options.animation ?? 'pulse';
  }

  private setupAccessibility(): void {
    setAriaAttributes(this.el, {
      role: 'status',
      'aria-label': LocaleManager.t('skeleton.ariaLabel'),
      'aria-busy': 'true',
    });
  }

  /**
   * Met à jour les options du composant
   */
  public update(options: Partial<SkeletonOptions>): void {
    this.options = { ...this.options, ...options };

    const variantClasses = ['skeleton--text', 'skeleton--circular', 'skeleton--rectangular', 'skeleton--rounded'];
    const animationClasses = ['skeleton--pulse', 'skeleton--wave'];
    variantClasses.forEach((c) => this.el.classList.remove(c));
    animationClasses.forEach((c) => this.el.classList.remove(c));

    this.el.classList.add(`skeleton--${this.options.variant ?? 'text'}`);
    const animation = this.effectiveAnimation();
    if (animation !== 'none') {
      this.el.classList.add(`skeleton--${animation}`);
    }

    if (this.options.width != null) {
      const w = typeof this.options.width === 'number' ? `${this.options.width}px` : this.options.width;
      this.el.style.width = w;
    } else {
      this.el.style.removeProperty('width');
    }
    if (this.options.height != null) {
      const h = typeof this.options.height === 'number' ? `${this.options.height}px` : this.options.height;
      this.el.style.height = h;
    } else {
      this.el.style.removeProperty('height');
    }
  }

  public override destroy(): void {
    if ((this.el as KSkeletonHTMLElement).K_Skeleton === this) {
      delete (this.el as KSkeletonHTMLElement).K_Skeleton;
    }
    removeAriaAttribute(this.el, 'role');
    removeAriaAttribute(this.el, 'aria-label');
    removeAriaAttribute(this.el, 'aria-busy');
    this.logger.info('Skeleton destroyed');
  }
}

/**
 * Custom Element <k3ui-skeleton>
 * @description Permet l'utilisation de <k3ui-skeleton> dans le HTML. Initialisation par AutoInit.
 */
if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-skeleton')) {
  customElements.define('k3ui-skeleton', class extends HTMLElement {
    connectedCallback(): void {
      if (!this.hasAttribute('data-initialized')) {
        this.setAttribute('data-initialized', 'true');
      }
    }
    disconnectedCallback(): void {
      const instance = (this as KSkeletonHTMLElement).K_Skeleton;
      if (instance && typeof instance.destroy === 'function') {
        instance.destroy();
      }
      (this as KSkeletonHTMLElement).K_Skeleton = undefined;
    }
  });
}
