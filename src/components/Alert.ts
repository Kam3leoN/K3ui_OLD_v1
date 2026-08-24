/**
 * @fileoverview Composant Alert pour K3UI
 * @description Encart d'information avec surface type card et encoche titre paramétrable
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { toComponentClassDef } from '../types/components/component-base';
import type { AlertColor, AlertNotchPosition, AlertOptions } from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { setAriaAttributes, removeAriaAttribute } from '../utils/dom/aria';
import { ensureNotchStructure, fitNotchLabelWidth } from '../utils/dom/notch';
import { LocaleManager, LoggerManager } from '../core/managers';
import { ManagerFactory } from '../core/factories';
import { AlertSpecs, getAlertDefaults } from '../specs/components/alert.specs';

interface KAlertHTMLElement extends HTMLElement {
  K_Alert?: Alert;
}

const _defaults: AlertOptions = getAlertDefaults();

const COLORS: readonly AlertColor[] = AlertSpecs.colors.available;
const POSITIONS: readonly AlertNotchPosition[] = AlertSpecs.positions.available;
const EDGE_POSITIONS: readonly AlertNotchPosition[] = [
  'top-center',
  'bottom-center',
  'left-center',
  'right-center',
] as const;

const COLOR_TITLE_I18N_KEY: Partial<Record<AlertColor, string>> = {
  alert: 'titleAlert',
  info: 'titleInfo',
  warning: 'titleWarning',
  note: 'titleNote',
  tips: 'titleTips',
  hint: 'titleHint',
};

function isAlertColor(value: string): value is AlertColor {
  return (COLORS as readonly string[]).includes(value);
}

function isAlertPosition(value: string): value is AlertNotchPosition {
  return (POSITIONS as readonly string[]).includes(value);
}

function isEdgeNotchPosition(position: AlertNotchPosition): boolean {
  return (EDGE_POSITIONS as readonly string[]).includes(position);
}

/**
 * Composant Alert — encart d'information avec titre dans l'encoche (8 positions).
 */
export class Alert extends Component<AlertOptions> {
  readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

  private logger: LoggerManager;
  private textElement: HTMLElement | null = null;
  private labelElement: HTMLElement | null = null;

  static get defaults(): AlertOptions {
    return { ..._defaults };
  }

  /**
   * Obtient l'instance Alert liée à un élément
   */
  static getInstance(el: HTMLElement): Alert | undefined {
    return (el as KAlertHTMLElement).K_Alert;
  }

  /**
   * Initialise un ou plusieurs éléments Alert
   */
  static init(
    els: KElement | InitElements<KElement> | string,
    options: Partial<AlertOptions> = {}
  ): Alert | Alert[] {
    return Component.init(els, options, toComponentClassDef(Alert)) as Alert | Alert[];
  }

  constructor(el: HTMLElement, options: Partial<AlertOptions> = {}) {
    super(el, options, toComponentClassDef(Alert));

    this.logger = ManagerFactory.getLoggerManager('[Alert]');

    this.options = {
      ...Alert.defaults,
      ...options,
      ...this.readDataOptions(),
    };

    (el as KAlertHTMLElement).K_Alert = this;
    this.mount();
  }

  /**
   * Lit les options depuis les attributs data-*
   */
  private readDataOptions(): Partial<AlertOptions> {
    const data: Partial<AlertOptions> = {};

    const color = this.el.dataset.color ?? this.el.dataset.variant;
    if (color && isAlertColor(color)) {
      data.color = color;
    }

    const position = this.el.dataset.position ?? this.el.dataset.notch;
    if (position && isAlertPosition(position)) {
      data.position = position;
    }

    if (this.el.dataset.title !== undefined) {
      data.title = this.el.dataset.title;
    }

    if (this.el.dataset.text !== undefined) {
      data.text = this.el.dataset.text;
    }

    return data;
  }

  /**
   * Monte le composant : structure DOM, couleur, position, encoche, ARIA
   */
  private mount(): void {
    this.el.classList.add('alert', 'notch');
    this.applyColor(this.resolveColor());
    this.applyPosition(this.resolvePosition());
    this.ensureSurfaceStructure();
    this.renderContent();
    this.setupAccessibility();
    this.logger.info('Alert initialized');
  }

  /**
   * Résout la couleur (classes alert--*, data-color, data-variant, défaut primary)
   */
  private resolveColor(): AlertColor {
    for (const color of COLORS) {
      if (this.el.classList.contains(`alert--${color}`)) {
        return color;
      }
    }

    if (this.options.color && isAlertColor(this.options.color)) {
      return this.options.color;
    }

    if (this.options.variant && isAlertColor(this.options.variant)) {
      return this.options.variant;
    }

    return AlertSpecs.colors.default;
  }

  /**
   * Applique la classe de couleur
   */
  private applyColor(color: AlertColor): void {
    for (const c of COLORS) {
      this.el.classList.remove(`alert--${c}`);
    }
    this.el.classList.add(`alert--${color}`);
    this.options.color = color;
  }

  /**
   * Résout la position de l'encoche
   */
  private resolvePosition(): AlertNotchPosition {
    for (const position of POSITIONS) {
      if (this.el.classList.contains(`notch--${position}`)) {
        return position;
      }
    }

    return this.options.position ?? AlertSpecs.positions.default;
  }

  /**
   * Applique la classe de position notch
   */
  private applyPosition(position: AlertNotchPosition): void {
    for (const p of POSITIONS) {
      this.el.classList.remove(`notch--${p}`);
    }
    this.el.classList.add(`notch--${position}`);
    this.options.position = position;
  }

  /**
   * Garantit la présence de alert__surface, alert__text et de l'encoche titre
   */
  private ensureSurfaceStructure(): void {
    let surface = this.el.querySelector('.alert__surface');
    if (!(surface instanceof HTMLElement)) {
      surface = document.createElement('div');
      surface.className = 'alert__surface';
      const existingText = this.el.querySelector('.alert__text');
      if (existingText) {
        surface.appendChild(existingText);
      } else {
        const text = document.createElement('p');
        text.className = 'alert__text';
        surface.appendChild(text);
      }
      this.el.insertBefore(surface, this.el.firstChild);
    }

    this.textElement = surface.querySelector('.alert__text');
    if (!(this.textElement instanceof HTMLElement)) {
      this.textElement = document.createElement('p');
      this.textElement.className = 'alert__text';
      surface.appendChild(this.textElement);
    }

    const titleText = this.resolveTitle();
    const position = this.options.position ?? AlertSpecs.positions.default;

    /**
     * Coins : pastille hors surface (anti-fil AA du clip).
     * Bords : pastille dans la surface (sinon le bord droit de la card traverse les rounders).
     */
    this.labelElement = this.syncNotchHost(surface, titleText, position);
    fitNotchLabelWidth(this.labelElement);
  }

  /**
   * Place le wrapper notch sur le bon hôte selon la position (coin vs bord).
   */
  private syncNotchHost(
    surface: HTMLElement,
    titleText: string,
    position: AlertNotchPosition
  ): HTMLElement {
    const edge = isEdgeNotchPosition(position);
    const host = edge ? surface : this.el;

    const outside = this.el.querySelector(':scope > .notch__label-wrapper');
    const inside = surface.querySelector(':scope > .notch__label-wrapper');

    if (edge) {
      if (outside instanceof HTMLElement) {
        surface.appendChild(outside);
      }
    } else if (inside instanceof HTMLElement) {
      this.el.insertBefore(inside, surface);
    }

    return ensureNotchStructure(host, titleText, 'alert__title');
  }

  /**
   * Résout le titre (options / data / DOM / i18n optionnel par couleur)
   */
  private resolveTitle(): string {
    const fromOptions = this.options.title?.trim();
    if (fromOptions) {
      return fromOptions.toUpperCase();
    }

    const fromData = this.el.dataset.title?.trim();
    if (fromData) {
      return fromData.toUpperCase();
    }

    if (!this.labelElement) {
      const fromDom =
        this.el.querySelector('.alert__title')?.textContent?.trim() ||
        this.el.querySelector('.notch__label span')?.textContent?.trim() ||
        '';

      if (fromDom) {
        return fromDom.toUpperCase();
      }
    }

    const color = this.options.color ?? AlertSpecs.colors.default;
    const i18nKey = COLOR_TITLE_I18N_KEY[color];
    if (i18nKey) {
      return LocaleManager.t(`alert.${i18nKey}`).toUpperCase();
    }

    return '';
  }

  /**
   * Affiche le contenu textuel depuis options ou DOM
   */
  private renderContent(): void {
    const text =
      this.options.text?.trim() ||
      this.textElement?.textContent?.trim() ||
      this.el.dataset.text?.trim() ||
      '';

    if (this.textElement && text) {
      this.textElement.textContent = text;
    }

    if (this.labelElement) {
      const span = this.labelElement.querySelector('span');
      if (span instanceof HTMLElement) {
        span.textContent = this.resolveTitle();
        span.classList.add('alert__title');
      }
      fitNotchLabelWidth(this.labelElement);
    }
  }

  /**
   * Configure l'accessibilité (role + label)
   */
  private setupAccessibility(): void {
    const color = this.options.color ?? AlertSpecs.colors.default;
    const role = AlertSpecs.accessibility.roles[color];

    setAriaAttributes(this.el, {
      role,
      label: `${this.resolveTitle()}. ${LocaleManager.t('alert.ariaLabel')}`,
    });
  }

  /**
   * Retourne la couleur courante
   */
  public getColor(): AlertColor {
    return this.options.color ?? AlertSpecs.colors.default;
  }

  /** @deprecated Utiliser getColor() */
  public getVariant(): AlertColor {
    return this.getColor();
  }

  /**
   * Retourne la position de l'encoche
   */
  public getPosition(): AlertNotchPosition {
    return this.options.position ?? AlertSpecs.positions.default;
  }

  /**
   * Change la palette visuelle
   */
  public setColor(color: AlertColor): void {
    if (!isAlertColor(color)) {
      return;
    }
    this.applyColor(color);
    this.renderContent();
    this.setupAccessibility();
  }

  /** @deprecated Utiliser setColor() */
  public setVariant(variant: AlertColor): void {
    this.setColor(variant);
  }

  /**
   * Change la position de l'encoche
   */
  public setPosition(position: AlertNotchPosition): void {
    if (!isAlertPosition(position)) {
      return;
    }
    this.applyPosition(position);
    const surface = this.el.querySelector('.alert__surface');
    if (surface instanceof HTMLElement) {
      this.labelElement = this.syncNotchHost(surface, this.resolveTitle(), position);
    }
    if (this.labelElement) {
      fitNotchLabelWidth(this.labelElement);
    }
  }

  /**
   * Met à jour titre, texte, couleur et/ou position
   */
  public update(options: Partial<AlertOptions>): void {
    this.options = { ...this.options, ...options };
    if (options.color || options.variant) {
      this.applyColor(this.resolveColor());
    }
    if (options.position) {
      this.applyPosition(options.position);
      const surface = this.el.querySelector('.alert__surface');
      if (surface instanceof HTMLElement) {
        this.labelElement = this.syncNotchHost(
          surface,
          this.resolveTitle(),
          options.position
        );
      }
    }
    this.renderContent();
    this.setupAccessibility();
  }

  /**
   * Détruit l'instance
   */
  public override destroy(): void {
    if ((this.el as KAlertHTMLElement).K_Alert === this) {
      delete (this.el as KAlertHTMLElement).K_Alert;
    }
    removeAriaAttribute(this.el, 'role');
    removeAriaAttribute(this.el, 'label');
    this.logger.info('Alert destroyed');
    super.destroy();
  }
}

/**
 * Custom Element k3ui-alert
 */
if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-alert')) {
  customElements.define(
    'k3ui-alert',
    class extends HTMLElement {
      connectedCallback(): void {
        if (!this.hasAttribute('data-initialized')) {
          this.setAttribute('data-initialized', 'true');
        }
      }

      disconnectedCallback(): void {
        const instance = (this as KAlertHTMLElement).K_Alert;
        if (instance && typeof instance.destroy === 'function') {
          instance.destroy();
        }
        (this as KAlertHTMLElement).K_Alert = undefined;
      }
    }
  );
}
