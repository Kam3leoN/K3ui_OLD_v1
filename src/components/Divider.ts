/**
 * @fileoverview Composant Divider pour K3UI
 * @description Séparateur horizontal ou vertical — classes, texte, couleurs, ARIA
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { toComponentClassDef } from '../types/components/component-base';
import type {
  DividerColor,
  DividerOptions,
  DividerOrientation,
  DividerPlacement,
} from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { setAriaAttributes, removeAriaAttribute } from '../utils/dom/aria';
import { LoggerManager } from '../core/managers';
import { ManagerFactory } from '../core/factories';
import { DividerSpecs, getDividerDefaults } from '../specs/components/divider.specs';

interface KDividerHTMLElement extends HTMLElement {
  K_Divider?: Divider;
}

const { classes: DIVIDER_CLASSES } = DividerSpecs;

const _defaults: DividerOptions = getDividerDefaults();

const ORIENTATIONS: readonly DividerOrientation[] = DividerSpecs.orientations.available;
const PLACEMENTS: readonly DividerPlacement[] = DividerSpecs.placements.available;
const COLORS: readonly DividerColor[] = DividerSpecs.colors.available;

function isOrientation(value: string): value is DividerOrientation {
  return (ORIENTATIONS as readonly string[]).includes(value);
}

function isPlacement(value: string): value is DividerPlacement {
  return (PLACEMENTS as readonly string[]).includes(value);
}

function isColor(value: string): value is DividerColor {
  return (COLORS as readonly string[]).includes(value);
}

/**
 * Classe Divider — séparateur présentational avec libellé optionnel.
 */
export class Divider extends Component<DividerOptions> {
  readonly priority: PriorityLevel = PriorityLevel.LOW;

  private logger: LoggerManager;

  static get defaults(): DividerOptions {
    return { ..._defaults };
  }

  /**
   * Obtient l'instance Divider liée à un élément
   */
  static getInstance(el: HTMLElement): Divider | undefined {
    return (el as KDividerHTMLElement).K_Divider;
  }

  /**
   * Initialise un ou plusieurs éléments Divider
   */
  static init(
    els: KElement | InitElements<KElement> | string,
    options: Partial<DividerOptions> = {}
  ): Divider | Divider[] {
    return Component.init(els, options, toComponentClassDef(Divider)) as Divider | Divider[];
  }

  constructor(el: HTMLElement, options: Partial<DividerOptions> = {}) {
    super(el, options, toComponentClassDef(Divider));

    this.logger = ManagerFactory.getLoggerManager('[Divider]');

    this.options = {
      ...Divider.defaults,
      ...options,
      ...this.readDataOptions(),
    };

    (el as KDividerHTMLElement).K_Divider = this;
    this.mount();
  }

  /**
   * Lit les options depuis les attributs HTML et data-*
   */
  private readDataOptions(): Partial<DividerOptions> {
    const data: Partial<DividerOptions> = {};

    if (this.el.hasAttribute('text')) {
      data.text = this.el.getAttribute('text') ?? '';
    } else if (this.el.dataset.text !== undefined) {
      data.text = this.el.dataset.text;
    }

    const orientation = this.el.dataset.orientation;
    if (orientation && isOrientation(orientation)) {
      data.orientation = orientation;
    }

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
   * Initialise le DOM (classes, texte, ARIA)
   */
  private mount(): void {
    this.el.classList.add(DIVIDER_CLASSES.root);
    this.syncOrientation();
    this.syncPlacement();
    this.syncColor();
    this.syncText();
    this.syncAccessibility();
    this.logger.info('Divider initialized');
  }

  /**
   * Résout l'orientation depuis options, data ou classes existantes
   */
  private resolveOrientation(): DividerOrientation {
    if (this.el.classList.contains(DIVIDER_CLASSES.verticalLine)) {
      return 'vertical';
    }
    return this.options.orientation ?? DividerSpecs.orientations.default;
  }

  /**
   * Résout le placement depuis options, data ou classes existantes
   */
  private resolvePlacement(): DividerPlacement {
    if (this.el.classList.contains(DIVIDER_CLASSES.labelStart)) return 'start';
    if (this.el.classList.contains(DIVIDER_CLASSES.labelEnd)) return 'end';
    return this.options.placement ?? DividerSpecs.placements.default;
  }

  /**
   * Résout la couleur depuis options, data ou classes existantes
   */
  private resolveColor(): DividerColor {
    if (this.el.dataset.color && isColor(this.el.dataset.color)) {
      return this.el.dataset.color;
    }

    for (const color of COLORS) {
      if (color !== 'default' && this.el.classList.contains(`${DIVIDER_CLASSES.colorPrefix}${color}`)) {
        return color;
      }
    }

    return this.options.color ?? DividerSpecs.colors.default;
  }

  /**
   * Détermine si un libellé explicite a été fourni (options / attributs)
   */
  private hasExplicitText(): boolean {
    return (
      this.el.hasAttribute('text') ||
      this.el.dataset.text !== undefined ||
      (this.options.text !== undefined && this.options.text !== '')
    );
  }

  /**
   * Lit le libellé explicite ; undefined = conserver le contenu DOM
   */
  private resolveExplicitText(): string | undefined {
    if (this.el.hasAttribute('text')) {
      return this.el.getAttribute('text') ?? '';
    }
    if (this.el.dataset.text !== undefined) {
      return this.el.dataset.text;
    }
    if (this.options.text !== undefined && this.options.text !== '') {
      return this.options.text;
    }
    return undefined;
  }

  /**
   * Applique l'orientation du trait (horizontal = empilé, vertical = côte à côte)
   */
  private syncOrientation(): void {
    const orientation = this.resolveOrientation();
    const isVerticalLine = orientation === 'vertical';

    this.el.classList.toggle(DIVIDER_CLASSES.verticalLine, isVerticalLine);
    this.options.orientation = orientation;
    this.syncAriaOrientation(isVerticalLine);
  }

  /**
   * Applique le placement du libellé
   */
  private syncPlacement(): void {
    const placement = this.resolvePlacement();

    this.el.classList.remove(DIVIDER_CLASSES.labelStart, DIVIDER_CLASSES.labelEnd);

    if (placement === 'start') {
      this.el.classList.add(DIVIDER_CLASSES.labelStart);
    } else if (placement === 'end') {
      this.el.classList.add(DIVIDER_CLASSES.labelEnd);
    }

    this.options.placement = placement;
  }

  /**
   * Applique la variante de couleur sémantique
   */
  private syncColor(): void {
    const color = this.resolveColor();

    COLORS.forEach((variant) => {
      if (variant !== 'default') {
        this.el.classList.remove(`${DIVIDER_CLASSES.colorPrefix}${variant}`);
      }
    });

    if (color !== 'default') {
      this.el.classList.add(`${DIVIDER_CLASSES.colorPrefix}${color}`);
    }

    this.options.color = color;
  }

  /**
   * Injecte ou efface le libellé ; sans texte explicite, conserve le DOM pour :empty CSS
   */
  private syncText(): void {
    if (!this.hasExplicitText() && this.resolveExplicitText() === undefined) {
      return;
    }

    const text = this.resolveExplicitText() ?? '';
    this.el.textContent = text;
    this.options.text = text;
  }

  /**
   * Met à jour aria-orientation
   */
  private syncAriaOrientation(isVerticalLine: boolean): void {
    setAriaAttributes(this.el, {
      'aria-orientation': isVerticalLine ? 'vertical' : 'horizontal',
    });
  }

  /**
   * Configure role et orientation ARIA initiaux
   */
  private syncAccessibility(): void {
    const isVerticalLine = this.options.orientation === 'vertical';
    setAriaAttributes(this.el, {
      role: DividerSpecs.accessibility.role,
      'aria-orientation': isVerticalLine ? 'vertical' : 'horizontal',
    });
  }

  /**
   * Met à jour le libellé affiché (chaîne vide = trait continu)
   * @param text - Texte du séparateur
   */
  public setText(text: string): void {
    this.el.textContent = text;
    this.options.text = text;
  }

  /**
   * Met à jour l'orientation du trait
   * @param orientation - horizontal | vertical
   */
  public setOrientation(orientation: DividerOrientation): void {
    if (!isOrientation(orientation)) return;
    this.options.orientation = orientation;
    this.syncOrientation();
  }

  /**
   * Met à jour le placement du libellé
   * @param placement - start | end | center
   */
  public setPlacement(placement: DividerPlacement): void {
    if (!isPlacement(placement)) return;
    this.options.placement = placement;
    this.syncPlacement();
  }

  /**
   * Met à jour la couleur sémantique
   * @param color - variante de couleur
   */
  public setColor(color: DividerColor): void {
    if (!isColor(color)) return;
    this.options.color = color;
    this.syncColor();
  }

  /**
   * Met à jour les options du composant
   */
  public update(options: Partial<DividerOptions>): void {
    this.options = { ...this.options, ...options };

    if (options.orientation !== undefined) {
      this.syncOrientation();
    }
    if (options.placement !== undefined) {
      this.syncPlacement();
    }
    if (options.color !== undefined) {
      this.syncColor();
    }
    if (options.text !== undefined) {
      this.setText(options.text);
    }
  }

  /**
   * Détruit l'instance et nettoie ARIA
   */
  public override destroy(): void {
    if ((this.el as KDividerHTMLElement).K_Divider === this) {
      delete (this.el as KDividerHTMLElement).K_Divider;
    }
    removeAriaAttribute(this.el, 'role');
    removeAriaAttribute(this.el, 'aria-orientation');
    this.logger.info('Divider destroyed');
    super.destroy();
  }
}

/**
 * Custom Element k3ui-divider
 */
if (
  typeof window !== 'undefined' &&
  typeof customElements !== 'undefined' &&
  !customElements.get('k3ui-divider')
) {
  customElements.define(
    'k3ui-divider',
    class extends HTMLElement {
      connectedCallback(): void {
        if (!this.hasAttribute('data-initialized')) {
          this.setAttribute('data-initialized', 'true');
        }
      }

      disconnectedCallback(): void {
        const instance = (this as KDividerHTMLElement).K_Divider;
        if (instance && typeof instance.destroy === 'function') {
          instance.destroy();
        }
        (this as KDividerHTMLElement).K_Divider = undefined;
      }
    }
  );
}
