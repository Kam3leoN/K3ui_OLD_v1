/**
 * @fileoverview Composant Bubble pour K3UI
 * @description Ligne de conversation (bulle) — placement, couleur, ARIA
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { toComponentClassDef } from '../types/components/component-base';
import type { BubbleOptions, BubblePlacement, BubbleColor } from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { setAriaAttributes, removeAriaAttribute } from '../utils/dom/aria';
import { LoggerManager } from '../core/managers';
import { ManagerFactory } from '../core/factories';
import { getBubbleDefaults, BubbleSpecs } from '../specs/components/bubble.specs';

interface KBubbleHTMLElement extends HTMLElement {
  K_Bubble?: Bubble;
}

const _defaults: BubbleOptions = getBubbleDefaults();

const PLACEMENTS: readonly BubblePlacement[] = BubbleSpecs.placements.available;
const COLORS: readonly BubbleColor[] = BubbleSpecs.colors.available;

function isPlacement(value: string): value is BubblePlacement {
  return (PLACEMENTS as readonly string[]).includes(value);
}

function isColor(value: string): value is BubbleColor {
  return (COLORS as readonly string[]).includes(value);
}

/**
 * Classe Bubble — affichage présentational d’une ligne de conversation.
 */
export class Bubble extends Component<BubbleOptions> {
  readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

  private logger: LoggerManager;

  static get defaults(): BubbleOptions {
    return { ..._defaults };
  }

  /**
   * Obtient l’instance Bubble liée à un élément
   */
  static getInstance(el: HTMLElement): Bubble | undefined {
    return (el as KBubbleHTMLElement).K_Bubble;
  }

  /**
   * Initialise un ou plusieurs éléments Bubble
   */
  static init(
    els: KElement | InitElements<KElement> | string,
    options: Partial<BubbleOptions> = {}
  ): Bubble | Bubble[] {
    return Component.init(els, options, toComponentClassDef(Bubble)) as Bubble | Bubble[];
  }

  constructor(el: HTMLElement, options: Partial<BubbleOptions> = {}) {
    super(el, options, toComponentClassDef(Bubble));

    this.logger = ManagerFactory.getLoggerManager('[Bubble]');

    this.options = {
      ...Bubble.defaults,
      ...options,
      ...this.readDataOptions(),
    };

    (el as KBubbleHTMLElement).K_Bubble = this;
    this.mount();
  }

  /**
   * Lit les options depuis les attributs data-*
   */
  private readDataOptions(): Partial<BubbleOptions> {
    const data: Partial<BubbleOptions> = {};
    const placement = this.el.dataset.placement;
    if (placement && isPlacement(placement)) {
      data.placement = placement;
    }
    const color = this.el.dataset.color;
    if (color && isColor(color)) {
      data.color = color;
    }
    return data;
  }

  /**
   * Applique classes, placement, couleur et ARIA
   */
  private mount(): void {
    this.el.classList.add('bubble');
    this.applyPlacement(this.resolvePlacement());
    this.applyColor(this.resolveColor());
    this.setupAccessibility();
    this.normalizeImages();
    this.logger.info('Bubble initialized');
  }

  /**
   * Résout le placement (options / data / classes existantes)
   */
  private resolvePlacement(): BubblePlacement {
    if (this.el.classList.contains('bubble--end')) return 'end';
    if (this.el.classList.contains('bubble--start')) return 'start';
    return this.options.placement ?? 'start';
  }

  /**
   * Résout la couleur (options / data / classes existantes sur le body)
   */
  private resolveColor(): BubbleColor {
    if (this.el.dataset.color && isColor(this.el.dataset.color)) {
      return this.el.dataset.color;
    }
    const body = this.el.querySelector('.bubble__body');
    if (body instanceof HTMLElement) {
      for (const c of COLORS) {
        if (c !== 'default' && body.classList.contains(`bubble__body--${c}`)) {
          return c;
        }
      }
    }
    return this.options.color ?? 'default';
  }

  /**
   * Applique le placement start / end
   */
  private applyPlacement(placement: BubblePlacement): void {
    this.el.classList.remove('bubble--start', 'bubble--end');
    this.el.classList.add(`bubble--${placement}`);
    this.options.placement = placement;
  }

  /**
   * Applique la variante de couleur sur `.bubble__body`
   */
  private applyColor(color: BubbleColor): void {
    const body = this.el.querySelector('.bubble__body');
    if (!(body instanceof HTMLElement)) {
      this.options.color = color;
      return;
    }

    COLORS.forEach((c) => {
      if (c !== 'default') {
        body.classList.remove(`bubble__body--${c}`);
      }
    });

    if (color !== 'default') {
      body.classList.add(`bubble__body--${color}`);
    }

    this.options.color = color;
  }

  /**
   * Configure le rôle ARIA du conteneur
   */
  private setupAccessibility(): void {
    setAriaAttributes(this.el, {
      role: BubbleSpecs.accessibility.role,
    });
  }

  /**
   * Garantit un alt sur les images d’auteur si manquant
   */
  private normalizeImages(): void {
    const images = this.el.querySelectorAll('.bubble__image img');
    images.forEach((node) => {
      if (!(node instanceof HTMLImageElement)) return;
      if (!node.hasAttribute('alt')) {
        node.alt = '';
      }
    });
  }

  /**
   * Met à jour le placement
   * @param placement - start | end
   */
  public setPlacement(placement: BubblePlacement): void {
    if (!isPlacement(placement)) return;
    this.applyPlacement(placement);
  }

  /**
   * Met à jour la couleur du corps
   * @param color - variante de couleur
   */
  public setColor(color: BubbleColor): void {
    if (!isColor(color)) return;
    this.applyColor(color);
  }

  /**
   * Met à jour les options du composant
   */
  public update(options: Partial<BubbleOptions>): void {
    this.options = { ...this.options, ...options };
    if (options.placement) this.applyPlacement(options.placement);
    if (options.color) this.applyColor(options.color);
  }

  /**
   * Détruit l’instance et nettoie ARIA
   */
  public override destroy(): void {
    if ((this.el as KBubbleHTMLElement).K_Bubble === this) {
      delete (this.el as KBubbleHTMLElement).K_Bubble;
    }
    removeAriaAttribute(this.el, 'role');
    this.logger.info('Bubble destroyed');
    super.destroy();
  }
}

/**
 * Custom Element &lt;k3ui-bubble&gt;
 */
if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-bubble')) {
  customElements.define(
    'k3ui-bubble',
    class extends HTMLElement {
      connectedCallback(): void {
        if (!this.hasAttribute('data-initialized')) {
          this.setAttribute('data-initialized', 'true');
        }
      }

      disconnectedCallback(): void {
        const instance = (this as KBubbleHTMLElement).K_Bubble;
        if (instance && typeof instance.destroy === 'function') {
          instance.destroy();
        }
        (this as KBubbleHTMLElement).K_Bubble = undefined;
      }
    }
  );
}
