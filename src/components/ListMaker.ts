/**
 * @fileoverview Composant ListMaker pour K3UI
 * @description Liste ordonnée / à puces avec marqueur pill Material Design 3
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { toComponentClassDef } from '../types/components/component-base';
import type { ListMakerOptions, ListMakerSize, ListMakerVariant, ListMakerOrientation } from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { setAriaAttributes, setAriaAttribute, getAriaAttribute } from '../utils/dom/aria';
import { LocaleManager, LoggerManager } from '../core/managers';
import { ManagerFactory } from '../core/factories';
import {
  getListMakerDefaults,
  ListMakerSpecs,
  LIST_MAKER_SIZES,
} from '../specs/components/list-maker.specs';

interface KListMakerHTMLElement extends HTMLElement {
  K_ListMaker?: ListMaker;
}

const _defaults: ListMakerOptions = getListMakerDefaults();

const VARIANTS: readonly ListMakerVariant[] = ['filled', 'tonal'];
const SIZES: readonly ListMakerSize[] = ['small', 'medium', 'large'];
const ORIENTATIONS: readonly ListMakerOrientation[] = ['vertical', 'horizontal'];

/**
 * Scale une valeur typographique selon ListMakerSpecs.
 * @param value Valeur de base
 */
function scaled(value: number): number {
  return Math.round(value * ListMakerSpecs.geometry.textScale * 10) / 10;
}

/**
 * Indique si la valeur est une variante ListMaker valide.
 */
function isVariant(value: string): value is ListMakerVariant {
  return (VARIANTS as readonly string[]).includes(value);
}

/**
 * Indique si la valeur est une taille ListMaker valide.
 */
function isSize(value: string): value is ListMakerSize {
  return (SIZES as readonly string[]).includes(value);
}

/**
 * Indique si la valeur est une orientation ListMaker valide.
 */
function isOrientation(value: string): value is ListMakerOrientation {
  return (ORIENTATIONS as readonly string[]).includes(value);
}

/**
 * Liste à marqueur pill — contenu libre (`data-marker`) ou index automatique.
 */
export class ListMaker extends Component<ListMakerOptions> {
  readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

  private logger: LoggerManager;

  /** Observateur pour recalculer les marqueurs si le DOM change. */
  private mutationObserver: MutationObserver | null = null;

  /** Évite les boucles lors des mutations internes. */
  private isMutating = false;

  static get defaults(): ListMakerOptions {
    return { ..._defaults };
  }

  /**
   * Obtient l'instance ListMaker liée à un élément
   * @param el Élément HTML
   */
  static getInstance(el: HTMLElement): ListMaker | undefined {
    return (el as KListMakerHTMLElement).K_ListMaker;
  }

  /**
   * Initialise un ou plusieurs éléments ListMaker
   * @param els Éléments ou sélecteur
   * @param options Options de configuration
   */
  static init(
    els: KElement | InitElements<KElement> | string,
    options: Partial<ListMakerOptions> = {}
  ): ListMaker | ListMaker[] {
    return Component.init(els, options, toComponentClassDef(ListMaker)) as ListMaker | ListMaker[];
  }

  /**
   * @param el Élément racine (`ol` / `ul` / `.list-maker`)
   * @param options Options de configuration
   */
  constructor(el: HTMLElement, options: Partial<ListMakerOptions> = {}) {
    super(el, options, toComponentClassDef(ListMaker));

    this.logger = ManagerFactory.getLoggerManager('[ListMaker]');

    this.options = {
      ...ListMaker.defaults,
      ...options,
      ...this.readDataOptions(),
    };

    (el as KListMakerHTMLElement).K_ListMaker = this;
    this.mount();
  }

  /**
   * Lit les options depuis data-* et classes modificatrices.
   */
  private readDataOptions(): Partial<ListMakerOptions> {
    const data: Partial<ListMakerOptions> = {};

    const variantAttr = this.el.dataset.variant;
    if (variantAttr && isVariant(variantAttr)) {
      data.variant = variantAttr;
    } else if (this.el.classList.contains('list-maker--tonal')) {
      data.variant = 'tonal';
    } else if (this.el.classList.contains('list-maker--filled')) {
      data.variant = 'filled';
    }

    const sizeAttr = this.el.dataset.size;
    if (sizeAttr && isSize(sizeAttr)) {
      data.size = sizeAttr;
    } else if (this.el.classList.contains('list-maker--small')) {
      data.size = 'small';
    } else if (this.el.classList.contains('list-maker--large')) {
      data.size = 'large';
    } else if (this.el.classList.contains('list-maker--medium')) {
      data.size = 'medium';
    }

    const orientationAttr = this.el.dataset.orientation;
    if (orientationAttr && isOrientation(orientationAttr)) {
      data.orientation = orientationAttr;
    } else if (this.el.classList.contains('list-maker--horizontal')) {
      data.orientation = 'horizontal';
    } else if (this.el.classList.contains('list-maker--vertical')) {
      data.orientation = 'vertical';
    }

    return data;
  }

  /**
   * Monte le composant : classes, structure, CSS vars, ARIA, observer.
   */
  private mount(): void {
    this.el.classList.add('list-maker');
    this.applyVariantClass();
    this.applySizeClass();
    this.applyOrientationClass();
    this.setupAccessibility();
    this.refresh();
    this.logger.info('ListMaker initialized');
  }

  /**
   * Configure le rôle / label ARIA (sans écraser un label existant).
   */
  private setupAccessibility(): void {
    const existingLabel =
      getAriaAttribute(this.el, 'label') || getAriaAttribute(this.el, 'labelledby');
    if (!existingLabel) {
      setAriaAttributes(this.el, {
        label: LocaleManager.t('listMaker.ariaLabel'),
      });
    }

    const tag = this.el.tagName.toLowerCase();
    if (tag !== 'ol' && tag !== 'ul') {
      setAriaAttribute(this.el, 'role', ListMakerSpecs.accessibility.role);
    }
  }

  /**
   * Applique la classe de variante.
   */
  private applyVariantClass(): void {
    this.el.classList.remove('list-maker--filled', 'list-maker--tonal');
    this.el.classList.add(`list-maker--${this.options.variant}`);
    this.el.dataset.variant = this.options.variant;
  }

  /**
   * Applique la classe de taille.
   */
  private applySizeClass(): void {
    this.el.classList.remove('list-maker--small', 'list-maker--medium', 'list-maker--large');
    this.el.classList.add(`list-maker--${this.options.size}`);
    this.el.dataset.size = this.options.size;
  }

  /**
   * Applique la classe d’orientation du marqueur.
   */
  private applyOrientationClass(): void {
    this.el.classList.remove('list-maker--vertical', 'list-maker--horizontal');
    this.el.classList.add(`list-maker--${this.options.orientation}`);
    this.el.dataset.orientation = this.options.orientation;
  }

  /**
   * Retourne les items directs (li ou .list-maker__item).
   */
  private getItems(): HTMLElement[] {
    return Array.from(this.el.children).filter((child): child is HTMLElement => {
      if (!(child instanceof HTMLElement)) {
        return false;
      }
      return child.tagName.toLowerCase() === 'li' || child.classList.contains('list-maker__item');
    });
  }

  /**
   * Résout le texte du marqueur pour un item (data-marker ou index 1-based).
   * @param item Élément item
   * @param index Index 0-based
   */
  private resolveMarker(item: HTMLElement, index: number): string {
    if (item.dataset.marker !== undefined && item.dataset.marker !== '') {
      return String(item.dataset.marker);
    }
    return String(index + 1);
  }

  /**
   * Garantit la structure wrap + marqueur + body pour un item.
   * @param item Élément item
   * @param marker Texte du marqueur
   */
  private ensureItemStructure(item: HTMLElement, marker: string): void {
    item.classList.add('list-maker__item');

    let wrapEl = item.querySelector(':scope > .list-maker__marker-wrap');
    let markerEl =
      wrapEl?.querySelector('.list-maker__marker') ??
      item.querySelector(':scope > .list-maker__marker');
    let bodyEl = item.querySelector(':scope > .list-maker__body');

    if (!(wrapEl instanceof HTMLElement)) {
      wrapEl = document.createElement('span');
      wrapEl.className = 'list-maker__marker-wrap';

      if (markerEl instanceof HTMLElement && markerEl.parentElement === item) {
        item.insertBefore(wrapEl, markerEl);
        wrapEl.appendChild(markerEl);
      } else {
        item.insertBefore(wrapEl, item.firstChild);
      }
    }

    if (!(markerEl instanceof HTMLElement) || !wrapEl.contains(markerEl)) {
      markerEl = document.createElement('span');
      markerEl.className = 'list-maker__marker';
      wrapEl.appendChild(markerEl);
    }

    if (!(bodyEl instanceof HTMLElement)) {
      const nodesToMove: Node[] = [];
      Array.from(item.childNodes).forEach((node) => {
        if (node === wrapEl) {
          return;
        }
        nodesToMove.push(node);
      });

      bodyEl = document.createElement('div');
      bodyEl.className = 'list-maker__body';
      wrapEl.after(bodyEl);
      nodesToMove.forEach((node) => bodyEl!.appendChild(node));
    }

    let labelEl = markerEl.querySelector('.list-maker__marker-label');
    if (!(labelEl instanceof HTMLElement)) {
      labelEl = document.createElement('span');
      labelEl.className = 'list-maker__marker-label';
      markerEl.textContent = '';
      markerEl.appendChild(labelEl);
    }
    labelEl.textContent = marker;
    setAriaAttribute(markerEl, 'hidden', 'true');
  }

  /**
   * Calcule et applique les variables CSS de layout.
   * Pill = ButtonIcon XS narrow fixe (28×48) ; horizontal = rotation 90° (pas de wide).
   * @param _markers Textes des marqueurs
   */
  private applyLayoutVars(_markers: string[]): void {
    const sizeKey = this.options.size;
    const s = LIST_MAKER_SIZES[sizeKey] ?? LIST_MAKER_SIZES.medium;
    const label = scaled(s.label);
    const {
      markerWidthPx,
      markerHeightPx,
      horizontalRotationDeg,
      markerFontSizePx,
    } = ListMakerSpecs.geometry;

    const w = markerWidthPx;
    const h = markerHeightPx;

    const isHorizontal = this.options.orientation === 'horizontal';
    const rotateDeg = isHorizontal ? horizontalRotationDeg : 0;
    const labelRotateDeg = isHorizontal ? -horizontalRotationDeg : 0;
    // 90° : swap exact des dimensions (évite les erreurs flottantes cos/sin)
    const slotW = isHorizontal ? h : w;
    const slotH = isHorizontal ? w : h;

    const lh = Math.round(label * 1.43);
    const overhang = Math.max(0, (slotH - lh) / 2);

    this.el.style.setProperty('--list-maker-w', `${w}px`);
    this.el.style.setProperty('--list-maker-h', `${h}px`);
    this.el.style.setProperty('--list-maker-slot-w', `${slotW}px`);
    this.el.style.setProperty('--list-maker-slot-h', `${slotH}px`);
    this.el.style.setProperty('--list-maker-rotate', `${rotateDeg}deg`);
    this.el.style.setProperty('--list-maker-label-rotate', `${labelRotateDeg}deg`);
    this.el.style.setProperty('--list-maker-overhang', `${overhang}px`);
    this.el.style.setProperty('--list-maker-fs', `${markerFontSizePx}px`);
    this.el.style.setProperty('--list-maker-label', `${label}px`);
    this.el.style.setProperty('--list-maker-gap', `${s.gap}px`);
    this.el.style.setProperty('--list-maker-row', `${s.row}px`);
  }

  /**
   * Attache l’observateur DOM (items ajoutés / data-marker modifié).
   * Déconnecté pendant refresh pour éviter une boucle infinie :
   * les callbacks MutationObserver partent après le finally, quand isMutating
   * est déjà false.
   */
  private observeMutations(): void {
    if (typeof MutationObserver === 'undefined') {
      return;
    }

    if (!this.mutationObserver) {
      this.mutationObserver = new MutationObserver(() => {
        if (this.isMutating) {
          return;
        }
        this.refresh();
      });
    }

    this.mutationObserver.observe(this.el, {
      childList: true,
    });

    // data-marker est sur les <li> : observer chaque item (sans subtree sur la racine)
    this.getItems().forEach((item) => {
      this.mutationObserver!.observe(item, {
        attributes: true,
        attributeFilter: ['data-marker'],
      });
    });
  }

  /**
   * Reconstruit les marqueurs et la largeur commune de colonne.
   */
  public refresh(): void {
    if (this.mutationObserver) {
      this.mutationObserver.takeRecords();
      this.mutationObserver.disconnect();
    }

    this.isMutating = true;
    try {
      const items = this.getItems();
      const markers = items.map((item, i) => this.resolveMarker(item, i));
      items.forEach((item, i) => this.ensureItemStructure(item, markers[i]));
      this.applyLayoutVars(markers.length > 0 ? markers : ['1']);
    } finally {
      this.isMutating = false;
      this.observeMutations();
    }
  }

  /**
   * Définit la variante visuelle.
   * @param variant `filled` | `tonal`
   */
  public setVariant(variant: ListMakerVariant): void {
    if (!isVariant(variant)) {
      this.logger.warn(`Invalid variant: ${variant}`);
      return;
    }
    this.options.variant = variant;
    this.applyVariantClass();
  }

  /**
   * Définit la taille.
   * @param size `small` | `medium` | `large`
   */
  public setSize(size: ListMakerSize): void {
    if (!isSize(size)) {
      this.logger.warn(`Invalid size: ${size}`);
      return;
    }
    this.options.size = size;
    this.applySizeClass();
    this.refresh();
  }

  /**
   * Définit l’orientation du marqueur.
   * @param orientation `vertical` | `horizontal`
   */
  public setOrientation(orientation: ListMakerOrientation): void {
    if (!isOrientation(orientation)) {
      this.logger.warn(`Invalid orientation: ${orientation}`);
      return;
    }
    this.options.orientation = orientation;
    this.applyOrientationClass();
    this.refresh();
  }

  /**
   * Définit le marqueur d’un item par index.
   * @param index Index 0-based
   * @param marker Texte du marqueur (chaîne vide → index auto au prochain refresh)
   */
  public setItemMarker(index: number, marker: string): void {
    const items = this.getItems();
    const item = items[index];
    if (!item) {
      this.logger.warn(`Item index out of range: ${index}`);
      return;
    }
    if (marker === '') {
      delete item.dataset.marker;
    } else {
      item.dataset.marker = marker;
    }
    this.refresh();
  }

  /**
   * Fusionne des options et met à jour l’affichage.
   * @param options Options partielles
   */
  public updateOptions(options: Partial<ListMakerOptions>): void {
    this.options = {
      ...this.options,
      ...options,
    };
    this.applyVariantClass();
    this.applySizeClass();
    this.applyOrientationClass();
    this.refresh();
  }

  /**
   * Détruit l'instance du composant.
   */
  public override destroy(): void {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }

    if ((this.el as KListMakerHTMLElement).K_ListMaker === this) {
      delete (this.el as KListMakerHTMLElement).K_ListMaker;
    }

    this.logger.info('ListMaker destroyed');
    super.destroy();
  }
}
