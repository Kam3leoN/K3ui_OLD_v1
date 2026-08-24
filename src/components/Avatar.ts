/**
 * @fileoverview Composant Avatar pour K3UI
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import { AvatarOptions } from '../types/components';
import { PriorityLevel, KElement, InitElements, BaseOptions } from '../types/base';
import { setAriaAttributes, removeAriaAttribute } from '../utils/dom/aria';
import { LoggerManager } from '../core/managers';
import { ManagerFactory } from '../core/factories';
import { getAvatarDefaults } from '../specs/components/avatar.specs';
import { mergeOptions } from '../utils/options';
import { Stack } from './Stack';

interface KAvatarHTMLElement extends HTMLElement {
  K_Avatar?: Avatar;
}

/**
 * Valeurs par défaut pour les options
 */
const _defaults: AvatarOptions = getAvatarDefaults();

/**
 * Type pour les tailles d'avatar
 */
export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';

/**
 * Type pour les variants d'avatar
 */
export type AvatarVariant = 'filled' | 'outlined' | 'elevated';

/**
 * Type pour les formes d'avatar
 */
export type AvatarShape = 'circle' | 'rounded' | 'square';

/**
 * Type pour les palettes de couleurs
 */
export type AvatarColorPalette = 'blue' | 'red' | 'green' | 'purple' | 'orange' | 'gray';

/**
 * Type pour les badges de statut
 */
export type AvatarBadge = AvatarOptions['badge'];

const AVATAR_SIZES: readonly AvatarSize[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'];
const AVATAR_VARIANTS: readonly AvatarVariant[] = ['filled', 'outlined', 'elevated'];
const AVATAR_SHAPES: readonly AvatarShape[] = ['circle', 'rounded', 'square'];
const AVATAR_PALETTES: readonly AvatarColorPalette[] = ['blue', 'red', 'green', 'purple', 'orange', 'gray'];
const AVATAR_BADGE_VALUES: readonly NonNullable<AvatarBadge>[] = [
  'online', 'offline', 'idle', 'dnd', 'busy', 'away',
];

function isDatasetEnum<T extends string>(value: string, allowed: readonly T[]): value is T {
  return (allowed as readonly string[]).includes(value);
}

/**
 * Type pour l'empilement des groupes
 */
export type AvatarStacking = 'left' | 'right';

/**
 * Classe Avatar pour K3UI
 */
export class Avatar extends Component<AvatarOptions> {
  /** Niveau de priorité du composant */
  readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

  /** Logger pour le composant */
  private logger: LoggerManager;

  /** Image chargée avec succès */
  private imageLoaded: boolean = false;

  /** Erreur de chargement d'image */
  private imageError: boolean = false;

  /**
   * Options par défaut du composant
   * @returns Les options par défaut
   */
  static get defaults(): AvatarOptions {
    return { ..._defaults };
  }

  /**
   * Obtient l'instance du composant pour un élément donné
   * @param el Élément HTML
   * @returns L'instance Avatar
   */
  static getInstance(el: HTMLElement): Avatar {
    return (el as KAvatarHTMLElement).K_Avatar!;
  }

  /**
   * Initialise les composants
   * @param els Éléments HTML ou sélecteur CSS
   * @param options Options de configuration
   * @returns Instance ou tableau des instances créées
   */
  static init(
    els: KElement | InitElements<KElement> | string,
    options: Partial<AvatarOptions> = {}
  ): Avatar | Avatar[] {
    return Component.init(els, options, toComponentClassDef(Avatar)) as Avatar | Avatar[];
  }

  /**
   * Extrait les initiales d'un nom
   * @param name Le nom complet
   * @returns Les initiales (max 2 caractères)
   */
  static getInitials(name: string | null | undefined): string {
    if (!name || name.trim() === '') return '';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  /**
   * Constructeur du composant
   * @param el Élément HTML
   * @param options Options de configuration
   */
  constructor(el: HTMLElement, options: Partial<AvatarOptions> = {}, classDef?: unknown) {
    super(el, options, classDef ?? toComponentClassDef(Avatar));

    this.logger = ManagerFactory.getLoggerManager('[Avatar]');

    // Lire les attributs data-* depuis l'élément HTML APRÈS super()
    // Note: Les attributs data-* avec tirets sont convertis en camelCase (data-image-url -> imageUrl)
    const dataOptions: Partial<AvatarOptions> = {};

    if (el.dataset.size && isDatasetEnum(el.dataset.size, AVATAR_SIZES)) {
      dataOptions.size = el.dataset.size;
    }
    if (el.dataset.variant && isDatasetEnum(el.dataset.variant, AVATAR_VARIANTS)) {
      dataOptions.variant = el.dataset.variant;
    }
    if (el.dataset.shape && isDatasetEnum(el.dataset.shape, AVATAR_SHAPES)) {
      dataOptions.shape = el.dataset.shape;
    }
    // data-name reste name (pas de conversion camelCase pour les noms simples)
    // Vérifier explicitement si l'attribut existe (même si vide)
    if (el.hasAttribute('data-name')) {
      const nameValue = el.getAttribute('data-name');
      if (nameValue !== null) {
        dataOptions.name = nameValue;
      }
    }
    // data-image-url devient imageUrl en camelCase
    if (el.dataset.imageUrl) {
      dataOptions.imageUrl = el.dataset.imageUrl;
    }
    if (el.dataset.colorPalette && isDatasetEnum(el.dataset.colorPalette, AVATAR_PALETTES)) {
      dataOptions.colorPalette = el.dataset.colorPalette;
    }
    if (el.dataset.badge && isDatasetEnum(el.dataset.badge, AVATAR_BADGE_VALUES)) {
      dataOptions.badge = el.dataset.badge;
    }

    // Fusionner dataOptions avec les options existantes (data-* > options > defaults)
    // Utiliser mergeOptions pour garantir une fusion correcte
    // Important: mergeOptions ignore les valeurs undefined, donc on doit s'assurer que toutes les valeurs sont définies
    if (Object.keys(dataOptions).length > 0) {
      this.options = mergeOptions(this.options, dataOptions as Partial<AvatarOptions>) as AvatarOptions;
      // Forcer la mise à jour de name si présent dans dataOptions (car mergeOptions peut ignorer les chaînes vides)
      if (dataOptions.name !== undefined) {
        this.options.name = dataOptions.name;
      }
    }

    // Stocker l'instance sur l'élément
    (el as KAvatarHTMLElement).K_Avatar = this;

    // Initialiser le composant
    this.init();
  }

  /**
   * Initialise le composant
   * @private
   */
  private init(): void {
    // Ajouter la classe de base
    this.el.classList.add('avatar');

    // Appliquer les classes selon les options
    this.updateClasses();

    // Configurer l'accessibilité
    this.setupAccessibility();

    // Configurer le contenu
    this.setupContent();

    // Configurer les événements
    this.setupEvents();

    // S'assurer que le badge est créé après setupContent (au cas où updateClasses aurait détecté la classe)
    // Détecter aussi depuis les classes CSS existantes si l'option n'est pas définie
    const existingBadgeClass = this.getBadgeFromElementClasses();
    if (this.options.badge || existingBadgeClass) {
      if (!this.options.badge && existingBadgeClass) {
        this.options.badge = existingBadgeClass;
      }
      this.setupBadge();
    }

    this.logger.info('Component initialized');
  }

  /**
   * Met à jour les classes CSS selon les options
   * @private
   */
  private updateClasses(): void {
    // Taille : détecter depuis les classes CSS existantes si l'option n'est pas définie
    // IMPORTANT : Détecter AVANT de retirer les classes
    const sizeClasses = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'];

    // Vérifier d'abord si une classe de taille existe déjà dans le HTML
    const existingSizeClass = sizeClasses.find(s => this.el.classList.contains(`avatar--${s}`));

    // Utiliser la classe existante si trouvée, sinon l'option, sinon le défaut
    let size = existingSizeClass || this.options.size || 'lg';

    // Retirer toutes les classes de taille existantes avant d'ajouter la nouvelle
    sizeClasses.forEach(s => this.el.classList.remove(`avatar--${s}`));
    this.el.classList.add(`avatar--${size}`);

    // Variant
    const variant = this.options.variant || 'filled';
    this.el.classList.add(`avatar--${variant}`);

    // Forme
    const shape = this.options.shape || 'circle';
    this.el.classList.add(`avatar--${shape}`);

    // Palette de couleurs
    const colorPalette = this.options.colorPalette || 'blue';
    this.el.classList.add(`avatar--${colorPalette}`);

    // Badge : détecter depuis les classes CSS existantes si l'option n'est pas définie
    const existingBadgeClass = this.getBadgeFromElementClasses();
    const badge = existingBadgeClass || this.options.badge;

    if (badge) {
      this.el.classList.add(`avatar--badge-${badge}`);
      if (!this.options.badge) {
        this.options.badge = badge;
      }
    }
  }

  /**
   * Configure l'accessibilité
   * @private
   */
  private setupAccessibility(): void {
    const name = this.options.name || '';
    const imageUrl = this.options.imageUrl || '';

    setAriaAttributes(this.el, {
      role: 'img',
      label: name || 'Avatar',
    });

    if (imageUrl) {
      setAriaAttributes(this.el, {
        label: `${name || 'Avatar'} - Image`,
      });
    }
  }

  /**
   * Configure le contenu de l'avatar
   * @private
   */
  private setupContent(): void {
    // Nettoyer le contenu existant
    this.el.innerHTML = '';

    const imageUrl = this.options.imageUrl || '';
    const name = this.options.name || '';

    // Si une image est fournie et qu'il n'y a pas d'erreur
    if (imageUrl && !this.imageError) {
      const img = document.createElement('img');
      img.src = imageUrl;
      img.alt = name || 'Avatar';
      img.className = 'avatar__image';
      img.onload = () => {
        this.imageLoaded = true;
        this.imageError = false;
      };
      img.onerror = () => {
        this.imageError = true;
        this.imageLoaded = false;
        this.setupContent(); // Réessayer avec les initiales
      };
      this.el.appendChild(img);
    } else {
      // Afficher les initiales ou une icône
      const initials = Avatar.getInitials(name);
      if (initials) {
        const span = document.createElement('span');
        span.className = 'avatar__initials';
        span.textContent = initials;
        this.el.appendChild(span);
      } else {
        // Icône générique (à implémenter avec IconManager si nécessaire)
        const icon = document.createElement('span');
        icon.className = 'avatar__icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.innerHTML = '👤';
        this.el.appendChild(icon);
      }
    }

    // Ajouter le badge si nécessaire (après updateClasses qui peut avoir détecté la classe)
    // Vérifier à nouveau si un badge doit être créé
    // Détecter aussi depuis les classes CSS existantes si l'option n'est pas définie
    const existingBadgeClass = this.getBadgeFromElementClasses();
    if (this.options.badge || existingBadgeClass) {
      if (!this.options.badge && existingBadgeClass) {
        this.options.badge = existingBadgeClass;
      }
      this.setupBadge();
    }
  }

  /**
   * Lit le badge depuis les classes CSS `avatar--badge-*` sur l’élément.
   */
  private getBadgeFromElementClasses(): NonNullable<AvatarBadge> | undefined {
    return AVATAR_BADGE_VALUES.find((b) => this.el.classList.contains(`avatar--badge-${b}`));
  }

  /**
   * Configure le badge de statut
   * @private
   * Note: Le nouveau système utilise ::after pour le badge et un élément réel pour le gap
   * Le gap est créé via un élément DOM pour éviter les conflits avec ::before du badge dnd
   */
  private setupBadge(): void {
    // Nettoyer les éléments de badge existants
    const existingGap = this.el.querySelector('.avatar__gap');
    const existingDndLine = this.el.querySelector('.avatar__dnd-line');
    if (existingGap) existingGap.remove();
    if (existingDndLine) existingDndLine.remove();

    if (this.options.badge) {
      // Ajouter l'attribut aria-label pour l'accessibilité
      this.el.setAttribute('aria-label', `Statut: ${this.options.badge}`);

      // Créer un élément réel pour le gap (contour transparent)
      // Cet élément remplit le trou créé par le mask avec la couleur de fond
      const gapEl = document.createElement('span');
      gapEl.className = 'avatar__gap';
      gapEl.setAttribute('aria-hidden', 'true');
      this.el.appendChild(gapEl);

      // Pour le badge dnd, créer un élément réel pour la ligne horizontale
      // au lieu d'utiliser ::before (qui est réservé pour le gap dans d'autres cas)
      if (this.options.badge === 'dnd') {
        const dndLineEl = document.createElement('span');
        dndLineEl.className = 'avatar__dnd-line';
        dndLineEl.setAttribute('aria-hidden', 'true');
        this.el.appendChild(dndLineEl);
      }
    }
  }

  /**
   * Configure les événements
   * @private
   */
  private setupEvents(): void {
    // Gérer les erreurs d'image
    const img = this.el.querySelector('img');
    if (img) {
      img.addEventListener('error', () => {
        this.imageError = true;
        this.setupContent();
      });
    }

  }


  /**
   * Met à jour les options du composant
   * @param options Nouvelles options
   */
  public update(options: Partial<AvatarOptions>): void {
    this.options = {
      ...this.options,
      ...options,
    };

    // Retirer toutes les classes d'avatar
    const classesToRemove = Array.from(this.el.classList).filter((cls) =>
      cls.startsWith('avatar--')
    );
    classesToRemove.forEach((cls) => this.el.classList.remove(cls));

    // Mettre à jour les classes
    this.updateClasses();

    // Mettre à jour le contenu
    this.setupContent();

    // Mettre à jour l'accessibilité
    this.setupAccessibility();

  }

  /**
   * Détruit l'instance du composant
   */
  public override destroy(): void {

    // Nettoyage
    if ((this.el as KAvatarHTMLElement).K_Avatar === this) {
      delete (this.el as KAvatarHTMLElement).K_Avatar;
    }

    // Retirer les attributs ARIA
    removeAriaAttribute(this.el, 'role');
    removeAriaAttribute(this.el, 'label');

    this.logger.info('Component destroyed');
  }
}

/**
 * Classe pour gérer les groupes d’avatars (délègue l’empilement à Stack).
 * Le mode grille reste spécifique à Avatar ; l’overlap / +N passe par Stack.
 */
export class AvatarGroup {
  /** Élément conteneur */
  private el: HTMLElement;

  /** Options du groupe */
  private options: {
    stacking: AvatarStacking;
    max: number;
  };

  /** Instance Stack (overlap) */
  private stack: Stack | null = null;

  /** Logger */
  private logger: LoggerManager;

  /**
   * Constructeur du groupe d’avatars
   * @param el Élément conteneur
   * @param options Options du groupe
   */
  constructor(
    el: HTMLElement,
    options: { stacking?: AvatarStacking; max?: number } = {}
  ) {
    this.el = el;
    this.logger = ManagerFactory.getLoggerManager('[AvatarGroup]');
    this.options = {
      stacking: options.stacking || 'left',
      max: options.max || 4,
    };

    this.init();
  }

  /**
   * Initialise le groupe
   * @private
   */
  private init(): void {
    this.el.classList.add('avatar-group');

    const isStacked =
      this.el.classList.contains('avatar-stacked--left') ||
      this.el.classList.contains('avatar-stacked--right');
    const isGrid = this.el.classList.contains('avatar-grid');
    const isLimited = this.el.classList.contains('avatar-limited');

    if (!isStacked && !isGrid) {
      this.el.classList.add(`avatar-stacked--${this.options.stacking}`);
    }

    const stackedDirection = this.el.classList.contains('avatar-stacked--right')
      ? 'right'
      : 'left';

    if (isGrid) {
      this.destroyStack();
      this.applyGridLimited(isLimited);
      this.logger.info(
        `Avatar group initialized (grid, limited: ${isLimited}, max: ${this.options.max})`
      );
      return;
    }

    const existing = Stack.getInstance(this.el);
    const stackOptions = {
      variant: 'overlap' as const,
      direction: (stackedDirection === 'right' ? 'end' : 'start') as 'start' | 'end',
      offset: 12,
      max: isLimited ? this.options.max : null,
      showRemaining: isLimited,
      scroll: true,
      itemSelector: ':scope > .avatar, :scope > k3ui-avatar',
    };

    if (existing) {
      this.stack = existing;
      this.stack.update(stackOptions);
    } else {
      this.stack = new Stack(this.el, stackOptions);
    }

    // Classes BC Avatar + classes Stack
    this.el.classList.add('stack', 'stack--overlap', 'stack--scroll');
    this.el.classList.toggle('stack--direction-end', stackedDirection === 'right');
    this.el.classList.toggle('stack--direction-start', stackedDirection !== 'right');

    this.logger.info(
      `Avatar group initialized via Stack (${this.stack.getItemCount()} avatars, limited: ${isLimited})`
    );
  }

  /**
   * Mode grille : masquage + indicateur sans Stack deck/overlap
   */
  private applyGridLimited(isLimited: boolean): void {
    const avatars = Array.from(
      this.el.querySelectorAll<HTMLElement>(':scope > .avatar, :scope > k3ui-avatar')
    );

    const existingRemaining = this.el.querySelector('.avatar-group__remaining, .stack__remaining');
    if (existingRemaining) {
      existingRemaining.remove();
    }

    if (!isLimited) {
      avatars.forEach((avatar) => {
        avatar.style.display = '';
      });
      return;
    }

    const remaining = Math.max(0, avatars.length - this.options.max);
    avatars.forEach((avatar, index) => {
      avatar.style.display = index >= this.options.max ? 'none' : '';
    });

    if (remaining > 0) {
      const indicator = document.createElement('div');
      indicator.className = 'avatar-group__remaining stack__remaining';
      indicator.textContent = `+${remaining}`;
      this.el.appendChild(indicator);
    }
  }

  private destroyStack(): void {
    if (this.stack) {
      this.stack.destroy();
      this.stack = null;
    }
  }

  /**
   * Met à jour les options du groupe
   * @param options Nouvelles options
   */
  public update(options: { stacking?: AvatarStacking; max?: number }): void {
    this.options = {
      ...this.options,
      ...options,
    };

    this.el.classList.remove('avatar-stacked--left', 'avatar-stacked--right');
    this.init();
  }

  /**
   * Détruit le groupe
   */
  public destroy(): void {
    if (this.stack) {
      this.stack.destroy();
      this.stack = null;
    }

    const indicator = this.el.querySelector('.avatar-group__remaining, .stack__remaining');
    if (indicator) {
      indicator.remove();
    }

    this.el.classList.remove(
      'avatar-group',
      'avatar-stacked--left',
      'avatar-stacked--right',
      'avatar-grid',
      'avatar-limited',
      'avatar-align--left',
      'avatar-align--right',
      'avatar-align--center',
      'stack',
      'stack--overlap',
      'stack--scroll',
      'stack--direction-start',
      'stack--direction-end',
      'stack--limited'
    );
    this.logger.info('Avatar group destroyed');
  }
}

/**
 * Enregistrement du Web Component k3ui-avatar
 * @description Permet l’utilisation de <k3ui-avatar> dans le HTML. Initialisation par AutoInit.
 */
if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-avatar')) {
    customElements.define('k3ui-avatar', class extends HTMLElement {
        connectedCallback() {
            if (!this.hasAttribute('data-initialized')) {
                this.setAttribute('data-initialized', 'true');
            }
        }

        disconnectedCallback() {
            const instance = (this as KAvatarHTMLElement).K_Avatar;
            if (instance && typeof instance.destroy === 'function') {
                instance.destroy();
            }
            (this as KAvatarHTMLElement).K_Avatar = undefined;
        }
    });
}

