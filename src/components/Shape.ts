/**
 * @file Shape.ts
 * @description Composant Shape pour Material Design 3 Expressive
 */

import { Component } from '../core/base/Component';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import { ShapeOptions } from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { ManagerFactory } from '../core/factories';
import { LoggerManager } from '../core/managers';

import { getShapeDefaults } from '../specs/components/shape.specs';
import { getK3uiComponentWindowOptions } from '../core/autoinit/window-options';

const SHAPE_NAMES: readonly ShapeOptions['shape'][] = [
  'arch', 'arrow', 'boom', 'boomsoft', 'bun', 'burst', 'burstsoft', 'circle', 'clamshell', 'diamond',
  'fan', 'flower', 'gem', 'ghost', 'heart', 'leaf4', 'leaf8', 'oval', 'octagonal-circle', 'pentagon', 'pill',
  'pixelcircle', 'pixeltriangle', 'puffy', 'puffydiamond', 'semicircle', 'sides4', 'sides6', 'sides7',
  'sides9', 'sides12', 'slanted', 'square', 'sunny', 'sunnysoft', 'triangle',
];
const SHAPE_VARIANTS: readonly ShapeOptions['variant'][] = [
  'mask', 'clip-path', 'background', 'outline', 'filled', 'gradient',
];
const SHAPE_SIZES: readonly ShapeOptions['size'][] = [
  'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl',
];

function isDatasetEnum<T extends string>(value: string, allowed: readonly T[]): value is T {
  return (allowed as readonly string[]).includes(value);
}

/**
 * Options par défaut du composant Shape
 * @description Extrait depuis les specs pour garantir la cohérence
 */
const _defaults: ShapeOptions = getShapeDefaults();

/**
 * Classe du composant Shape
 */
export class Shape extends Component<ShapeOptions> {
  /** Niveau de priorité du composant */
  readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

  /** Logger pour le composant */
  private logger: LoggerManager;

  /**
   * Obtient le chemin des assets avec détection automatique
   * @param globalOptions - Options globales depuis K3UI_OPTIONS
   * @param options - Options passées lors de l'initialisation
   * @param dataOptions - Options depuis les attributs data-*
   * @returns Le chemin des assets à utiliser
   */
  private static getAssetsPath(
    globalOptions: Partial<ShapeOptions>,
    options: Partial<ShapeOptions>,
    dataOptions: Partial<ShapeOptions>
  ): string {
    // Priorité 1: Attribut data-assets-path (le plus spécifique)
    if (dataOptions.assetsPath) {
      return dataOptions.assetsPath;
    }

    // Priorité 2: Options passées lors de l'initialisation
    if (options.assetsPath) {
      return options.assetsPath;
    }

    // Priorité 3: Configuration globale K3UI_OPTIONS
    if (globalOptions.assetsPath) {
      return globalOptions.assetsPath;
    }

    // Priorité 4: Détection automatique depuis window.location.pathname
    const pathname = window.location.pathname;
    const pathParts = pathname.split('/').filter(p => p);
    if (pathParts.length > 0) {
      const projectName = pathParts[0];
      return `/${projectName}/assets/images/shapes/`;
    }

    // Priorité 5: Valeur par défaut
    return _defaults.assetsPath ?? '/assets/images/shapes/';
  }

  /**
   * Lit les options depuis les attributs data-* de l'élément
   * @param el - Élément HTML
   * @returns Options extraites des attributs data-*
   */
  private static readDataOptions(el: HTMLElement): Partial<ShapeOptions> {
    const dataOptions: Partial<ShapeOptions> = {};

    if (el.dataset.shape && isDatasetEnum(el.dataset.shape, SHAPE_NAMES)) {
      dataOptions.shape = el.dataset.shape;
    }
    if (el.dataset.variant && isDatasetEnum(el.dataset.variant, SHAPE_VARIANTS)) {
      dataOptions.variant = el.dataset.variant;
    }
    if (el.dataset.size && isDatasetEnum(el.dataset.size, SHAPE_SIZES)) {
      dataOptions.size = el.dataset.size;
    }
    if (el.hasAttribute('data-hover')) {
      dataOptions.hover = el.dataset.hover !== 'false';
    }
    if (el.hasAttribute('data-animate')) {
      dataOptions.animate = el.dataset.animate !== 'false';
    }
    if (el.dataset.assetsPath) {
      dataOptions.assetsPath = el.dataset.assetsPath;
    }

    return dataOptions;
  }

  /**
   * Applique le mask-image sur l'image avec le chemin complet
   * @param el - Élément shape
   * @param assetsPath - Chemin des assets
   * @param shape - Nom de la shape
   */
  private static applyMaskImage(
    el: HTMLElement,
    assetsPath: string,
    shape: string
  ): void {
    const fullPath = `${assetsPath}${shape}.svg`;
    
    // Définir la variable CSS custom property (utilisée par le CSS SCSS)
    // Utiliser un chemin absolu pour garantir que le mask fonctionne
    const absolutePath = fullPath.startsWith('http') 
      ? fullPath 
      : `${window.location.origin}${fullPath.startsWith('/') ? fullPath : `/${fullPath}`}`;
    
    el.style.setProperty('--k3ui-shape-path', absolutePath);
    
    // Appliquer toutes les propriétés mask nécessaires sur l'image
    // Utiliser !important pour garantir que les styles inline prennent le dessus sur le CSS
    const img = el.querySelector('img');
    if (img) {
      // Propriétés mask standard avec chemins absolus
      // Utiliser alpha au lieu de luminance pour les SVG avec fill="black"
      img.style.setProperty('mask-image', `url(${absolutePath})`, 'important');
      img.style.setProperty('mask-size', '100% 100%', 'important');
      img.style.setProperty('mask-repeat', 'no-repeat', 'important');
      img.style.setProperty('mask-position', 'center', 'important');
      img.style.setProperty('mask-mode', 'alpha', 'important');
      
      // Propriétés mask webkit (pour la compatibilité)
      img.style.setProperty('-webkit-mask-image', `url(${absolutePath})`, 'important');
      img.style.setProperty('-webkit-mask-size', '100% 100%', 'important');
      img.style.setProperty('-webkit-mask-repeat', 'no-repeat', 'important');
      img.style.setProperty('-webkit-mask-position', 'center', 'important');
      img.style.setProperty('-webkit-mask-composite', 'source-in', 'important');
    }
  }

  /**
   * Met à jour les attributs data sur l'élément DOM
   * @param el - Élément HTML
   * @param options - Options à appliquer
   */
  private static updateDataAttributes(
    el: HTMLElement,
    options: ShapeOptions
  ): void {
    if (options.shape) {
      el.setAttribute('data-shape', options.shape);
    }
    if (options.variant) {
      el.setAttribute('data-variant', options.variant);
    }
    if (options.size) {
      el.setAttribute('data-size', options.size);
    }
    if (options.hover !== undefined) {
      el.setAttribute('data-hover', options.hover.toString());
    }
    if (options.animate !== undefined) {
      el.setAttribute('data-animate', options.animate.toString());
    }
  }

  constructor(el: HTMLElement, options: Partial<ShapeOptions> = {}) {
    super(el, options, toComponentClassDef(Shape));

    // Initialiser le logger
    this.logger = ManagerFactory.getLoggerManager('[Shape]');

    // Récupérer les options globales depuis K3UI_OPTIONS
    const globalOptions = getK3uiComponentWindowOptions('Shape') as Partial<ShapeOptions>;

    // Lire les attributs data-* depuis l'élément HTML
    const dataOptions = Shape.readDataOptions(el);

    // Obtenir le chemin des assets avec la bonne priorité
    const assetsPath = Shape.getAssetsPath(globalOptions, options, dataOptions);

    // Fusionner toutes les options avec la priorité correcte
    // Priorité: dataOptions > options > globalOptions > defaults
    this.options = {
      ..._defaults,
      ...globalOptions,
      ...options,
      ...dataOptions,
      // Forcer assetsPath avec la valeur calculée
      assetsPath
    };

    // Mettre à jour les attributs data sur l'élément DOM
    Shape.updateDataAttributes(el, this.options);

    // Appliquer le mask-image si on a un shape et un assetsPath
    if (this.options.assetsPath && this.options.shape) {
      Shape.applyMaskImage(el, this.options.assetsPath, this.options.shape);
    }

    // L'instance est gérée via ComponentRegistry (voir getInstance())
    this.init();
  }

  static getInstance(el: HTMLElement): Shape | undefined {
    return Component.getInstance(el) as Shape | undefined;
  }

  static get defaults(): ShapeOptions {
    return _defaults;
  }

  static init(
    el: HTMLElement,
    options?: Partial<ShapeOptions>
  ): Shape;
  static init(
    els: InitElements<HTMLElement>,
    options?: Partial<ShapeOptions>
  ): Shape[];
  static init(
    els: KElement | InitElements<KElement> | string,
    options?: Partial<ShapeOptions>
  ): Shape | Shape[] {
    return Component.init(els, options ?? {}, toComponentClassDef(Shape)) as Shape | Shape[];
  }

  /**
   * Initialise le composant Shape
   */
  init(): void {
    // Appeler le callback onOpenStart
    if (this.options.onOpenStart) {
      this.options.onOpenStart(this.el);
    }

    // Le composant Shape fonctionne uniquement avec les attributs data
    // Le CSS se base sur ces attributs pour appliquer les styles
    this.logger.success(`Shape initialisé: ${this.options.shape} (${this.options.variant}) ${this.options.size} - assetsPath: ${this.options.assetsPath}`);

    // Appeler le callback onOpenEnd
    if (this.options.onOpenEnd) {
      this.options.onOpenEnd(this.el);
    }
  }

  /**
   * Met à jour les options du composant
   */
  updateOptions(newOptions: Partial<ShapeOptions>): void {
    // Fusionner les nouvelles options
    this.options = { ...this.options, ...newOptions };

    // Mettre à jour les attributs data sur l'élément DOM
    Shape.updateDataAttributes(this.el, this.options);

    // Si assetsPath ou shape a changé, réappliquer le mask-image
    if (newOptions.assetsPath || newOptions.shape) {
      const assetsPath = newOptions.assetsPath || this.options.assetsPath;
      const shape = newOptions.shape || this.options.shape;
      if (assetsPath && shape) {
        // Mettre à jour assetsPath dans les options si nécessaire
        if (newOptions.assetsPath) {
          this.options.assetsPath = newOptions.assetsPath;
        }
        Shape.applyMaskImage(this.el, assetsPath, shape);
      }
    }

    this.init();
  }

  /**
   * Change la forme
   */
  setShape(shape: ShapeOptions['shape']): void {
    this.updateOptions({ shape });
  }

  /**
   * Change la variante
   */
  setVariant(variant: ShapeOptions['variant']): void {
    this.updateOptions({ variant });
  }

  /**
   * Change la taille
   */
  setSize(size: ShapeOptions['size']): void {
    this.updateOptions({ size });
  }

  /**
   * Active/désactive l'effet de survol
   */
  setHover(enabled: boolean): void {
    this.updateOptions({ hover: enabled });
  }

  /**
   * Active/désactive l'animation
   */
  setAnimation(enabled: boolean): void {
    this.updateOptions({ animate: enabled });
  }

  /**
   * Nettoie le composant
   */
  destroy(): void {
    // Appeler le callback onCloseStart
    if (this.options.onCloseStart) {
      this.options.onCloseStart(this.el);
    }

    // Appeler le callback onCloseEnd
    if (this.options.onCloseEnd) {
      this.options.onCloseEnd(this.el);
    }
    super.destroy();
  }
}

/**
 * Enregistrement du Web Component k3ui-shape
 * @description Permet l'utilisation de <k3ui-shape> dans le HTML. Initialisation par AutoInit.
 */
if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-shape')) {
    customElements.define('k3ui-shape', class extends HTMLElement {
        private shapeInstance: Shape | null = null;

        connectedCallback() {
            // L'initialisation sera gérée par AutoInit
            // ou manuellement via K.Shape.init(this)
            if (!this.hasAttribute('data-initialized')) {
                this.setAttribute('data-initialized', 'true');
            }
        }

        disconnectedCallback() {
            // Nettoyage lors de la suppression du DOM
            if (this.shapeInstance) {
                this.shapeInstance.destroy();
                this.shapeInstance = null;
            }
        }
    });
}
