/**
 * @fileoverview Composant MediaStories K3UI — stories images/vidéo style Instagram
 * @description Progress bars, tap, hold, fullscreen, galerie de covers, clavier
 * @author K3UI Team
 * @version 1.1.0
 */

import { Component } from '../core/base/Component';
import { toComponentClassDef } from '../types/components/component-base';
import type {
  MediaStoriesGalleryIntro,
  MediaStoriesOptions,
  MediaStory,
  MediaStoryAlbum,
  MediaStoryType,
} from '../types/components';
import type { InitElements, KElement } from '../types/base';
import { PriorityLevel } from '../types/base';
import { ManagerFactory } from '../core/factories/ManagerFactory';
import { IconManager, Keyboard, LocaleManager, LoggerManager } from '../core/managers';
import { getMediaStoriesDefaults, MediaStoriesSpecs } from '../specs/components/mediastories.specs';
import { setAriaAttributes } from '../utils/dom/aria';
import { ButtonIcon } from './ButtonIcon';
import { ButtonShape } from './ButtonShape';
import { copyToClipboard } from '../utils/helpers/clipboard';

const ROOT_CLASS = 'mediastories';
const HOLD_THRESHOLD_FALLBACK = MediaStoriesSpecs.behaviors.holdThresholdMs;
const SWIPE_DOWN_FALLBACK = MediaStoriesSpecs.behaviors.swipeDownClosePx;
/** Tous les contrôles viewer / galerie utilisent ButtonIcon md */
const ICON_SIZE = 'md' as const;

const _defaults: MediaStoriesOptions = getMediaStoriesDefaults();

/**
 * Viewer de stories (images / vidéos) Material Design 3 — pattern Instagram / AMP Media Stories.
 * Mode `gallery` : rail de covers horizontales → ouverture fullscreen.
 */
export class MediaStories extends Component<MediaStoriesOptions> {
  readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

  private readonly logger: LoggerManager;

  private card: HTMLDivElement | null = null;
  private progressWrap: HTMLDivElement | null = null;
  private mediaWrap: HTMLDivElement | null = null;
  private headerWrap: HTMLDivElement | null = null;
  private captionWrap: HTMLDivElement | null = null;
  private tapLeft: HTMLDivElement | null = null;
  private tapRight: HTMLDivElement | null = null;

  private backdrop: HTMLDivElement | null = null;
  private backdropLayers: [HTMLDivElement, HTMLDivElement] | null = null;
  private backdropActiveLayer: 0 | 1 = 0;
  private arrowPrev: HTMLButtonElement | null = null;
  private arrowNext: HTMLButtonElement | null = null;
  private closeBtn: HTMLButtonElement | null = null;
  private exitFullscreenBtn: HTMLButtonElement | null = null;
  private actionsWrap: HTMLDivElement | null = null;
  private likeBtn: HTMLButtonElement | null = null;
  private shareBtn: HTMLButtonElement | null = null;

  private arrowPrevIcon: ButtonIcon | null = null;
  private arrowNextIcon: ButtonIcon | null = null;
  private exitFullscreenIcon: ButtonIcon | null = null;
  private likeIcon: ButtonIcon | null = null;
  private shareIcon: ButtonIcon | null = null;

  private likedByIndex = new Set<number>();

  private progressFills: HTMLDivElement[] = [];
  private currentIndex = 0;
  private paused = false;
  private isOpen = false;
  private destroyed = false;

  private currentMediaEl: HTMLImageElement | HTMLVideoElement | null = null;

  private rafId: number | null = null;
  private clockElapsedMs = 0;
  private clockDurationMs = 0;
  private clockLastTs = 0;
  private advancing = false;

  private pointerDownAt = 0;
  private pointerDownY = 0;
  private holdTimer: number | null = null;
  private isHolding = false;

  private keyboard: Keyboard | null = null;
  private eventCleanups: Array<() => void> = [];
  private mediaCleanups: Array<() => void> = [];
  private galleryCleanups: Array<() => void> = [];

  /** Portail body pour le viewer ouvert depuis la galerie */
  private viewerPortal: HTMLDivElement | null = null;
  private galleryRail: HTMLDivElement | null = null;
  private galleryBuilt = false;
  private activeAlbumIndex = -1;
  /** Fullscreen forcé quand le viewer vient de la galerie */
  private forceFullscreen = false;

  /**
   * Options par défaut
   */
  static get defaults(): MediaStoriesOptions {
    return { ..._defaults };
  }

  /**
   * Instance liée à un élément
   */
  static getInstance(el: HTMLElement): MediaStories | undefined {
    return Component.getInstance(el) as MediaStories | undefined;
  }

  /**
   * Initialise un ou plusieurs viewers / galeries
   */
  static init(el: HTMLElement, options?: Partial<MediaStoriesOptions>): MediaStories;
  static init(els: InitElements<KElement>, options?: Partial<MediaStoriesOptions>): MediaStories[];
  static init(
    els: HTMLElement | InitElements<KElement>,
    options: Partial<MediaStoriesOptions> = {}
  ): MediaStories | MediaStories[] {
    return Component.init(els, options, toComponentClassDef(MediaStories)) as MediaStories | MediaStories[];
  }

  constructor(el: HTMLElement, options: Partial<MediaStoriesOptions> = {}) {
    const fromDom = MediaStories.omitUndefined(
      MediaStories.readDomOptions(el) as Record<string, unknown>
    ) as Partial<MediaStoriesOptions>;
    super(el, { ...fromDom, ...options }, toComponentClassDef(MediaStories));

    this.logger = ManagerFactory.getLoggerManager('[MediaStories]');

    const resolvedStories: MediaStory[] =
      options.stories && options.stories.length > 0
        ? options.stories
        : fromDom.stories && fromDom.stories.length > 0
          ? fromDom.stories
          : Array.isArray(this.options.stories)
            ? [...this.options.stories]
            : [];

    const resolvedAlbums: MediaStoryAlbum[] =
      options.albums && options.albums.length > 0
        ? options.albums
        : fromDom.albums && fromDom.albums.length > 0
          ? fromDom.albums
          : Array.isArray(this.options.albums)
            ? [...this.options.albums]
            : [];

    this.options = {
      ...MediaStories.defaults,
      ...fromDom,
      ...options,
      stories: resolvedStories,
      albums: resolvedAlbums,
    };

    this.el.classList.add(ROOT_CLASS);
    this.currentIndex = Math.max(0, Math.min(this.options.currentIndex, Math.max(0, resolvedStories.length - 1)));

    if (this.options.autoStart) {
      this.open();
    }

    this.logger.info('Component initialized');
  }

  /**
   * Lit les options depuis le markup (data-* + enfants data-mediastories-*)
   */
  private static readDomOptions(el: HTMLElement): Partial<MediaStoriesOptions> {
    const storiesFromJson = MediaStories.parseStoriesJson(el.getAttribute('data-stories'));
    const storiesFromChildren = MediaStories.readStoriesFromChildren(el);
    const stories =
      storiesFromJson.length > 0 ? storiesFromJson : storiesFromChildren.length > 0 ? storiesFromChildren : undefined;

    const albums = MediaStories.parseAlbumsJson(el.getAttribute('data-albums'));
    const galleryIntro = MediaStories.parseGalleryIntro(el.getAttribute('data-gallery-intro'));
    const modeAttr = el.getAttribute('data-mode');
    const mode = modeAttr === 'gallery' || modeAttr === 'viewer' ? modeAttr : undefined;

    const num = (v: string | null): number | undefined => {
      if (v == null || v === '') return undefined;
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    };
    const bool = (v: string | null): boolean | undefined => {
      if (v == null) return undefined;
      if (v === 'true' || v === '') return true;
      if (v === 'false') return false;
      return undefined;
    };

    return {
      mode,
      albums: albums.length > 0 ? albums : undefined,
      galleryIntro: galleryIntro ?? undefined,
      stories,
      defaultInterval: num(el.getAttribute('data-default-interval')),
      width: el.getAttribute('data-width') ?? undefined,
      height: el.getAttribute('data-height') ?? undefined,
      loop: bool(el.getAttribute('data-loop')),
      keyboardNavigation: bool(el.getAttribute('data-keyboard-navigation')),
      showCloseButton: bool(el.getAttribute('data-show-close-button')),
      currentIndex: num(el.getAttribute('data-current-index')),
      fullscreen: bool(el.getAttribute('data-fullscreen')),
      aspectRatio: el.getAttribute('data-aspect-ratio') ?? undefined,
      showArrows: bool(el.getAttribute('data-show-arrows')),
      showLikeButton: bool(el.getAttribute('data-show-like-button')),
      showShareButton: bool(el.getAttribute('data-show-share-button')),
      autoStart: bool(el.getAttribute('data-auto-start')),
      holdThresholdMs: num(el.getAttribute('data-hold-threshold-ms')),
      swipeDownClosePx: num(el.getAttribute('data-swipe-down-close-px')),
    };
  }

  /** Retire les clés `undefined` pour ne pas écraser les defaults au spread */
  private static omitUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
    const out: Partial<T> = {};
    (Object.keys(obj) as Array<keyof T>).forEach((key) => {
      const value = obj[key];
      if (value !== undefined) {
        out[key] = value;
      }
    });
    return out;
  }

  /** Normalise une taille CSS (ajoute `px` si valeur numérique sans unité) */
  private static cssSize(value: number | string): string {
    if (typeof value === 'number' && Number.isFinite(value)) return `${value}px`;
    const raw = String(value).trim();
    if (/^\d+(\.\d+)?$/.test(raw)) return `${raw}px`;
    return raw;
  }

  private static parseStoriesJson(raw: string | null): MediaStory[] {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((s): s is MediaStory => s != null && typeof s === 'object' && typeof (s as MediaStory).url === 'string');
    } catch {
      console.warn('[MediaStories] data-stories JSON invalide');
      return [];
    }
  }

  private static parseAlbumsJson(raw: string | null): MediaStoryAlbum[] {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((a): a is MediaStoryAlbum => {
        if (a == null || typeof a !== 'object') return false;
        const album = a as MediaStoryAlbum;
        return (
          typeof album.title === 'string' &&
          typeof album.coverUrl === 'string' &&
          Array.isArray(album.stories) &&
          album.stories.length > 0
        );
      });
    } catch {
      console.warn('[MediaStories] data-albums JSON invalide');
      return [];
    }
  }

  private static parseGalleryIntro(raw: string | null): MediaStoriesGalleryIntro | null {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed == null || typeof parsed !== 'object') return null;
      const intro = parsed as MediaStoriesGalleryIntro;
      if (typeof intro.title !== 'string') return null;
      return intro;
    } catch {
      console.warn('[MediaStories] data-gallery-intro JSON invalide');
      return null;
    }
  }

  private static readStoriesFromChildren(el: HTMLElement): MediaStory[] {
    const nodes = el.querySelectorAll<HTMLElement>('[data-mediastories-url]');
    const out: MediaStory[] = [];
    nodes.forEach((node) => {
      const url = node.getAttribute('data-mediastories-url');
      if (!url) return;
      const typeAttr = node.getAttribute('data-mediastories-type');
      const type: MediaStoryType | undefined =
        typeAttr === 'video' || typeAttr === 'image' ? typeAttr : undefined;
      const durationRaw = node.getAttribute('data-mediastories-duration');
      const duration = durationRaw != null ? Number(durationRaw) : undefined;
      const heading = node.getAttribute('data-mediastories-heading');
      const subheading = node.getAttribute('data-mediastories-subheading') ?? undefined;
      const profileImage = node.getAttribute('data-mediastories-profile') ?? undefined;
      const caption = node.getAttribute('data-mediastories-caption') ?? undefined;
      const seeMoreUrl = node.getAttribute('data-mediastories-see-more') ?? undefined;
      const poster = node.getAttribute('data-mediastories-poster') ?? undefined;
      const story: MediaStory = { url, type, caption, seeMoreUrl, poster };
      if (Number.isFinite(duration) && duration! > 0) story.duration = duration;
      if (heading) {
        story.header = { heading, subheading, profileImage };
      }
      out.push(story);
    });
    return out;
  }

  /**
   * Hôte DOM du viewer (élément composant ou portail fullscreen)
   */
  private getMount(): HTMLElement {
    return this.viewerPortal ?? this.el;
  }

  /**
   * Albums résolus (option `albums` ou dérivés de `stories`)
   */
  private resolveAlbums(): MediaStoryAlbum[] {
    if (this.options.albums.length > 0) return this.options.albums;
    return this.options.stories.map((story) => ({
      title: story.header?.heading || LocaleManager.t('mediastories.ariaLabel'),
      coverUrl: story.poster || story.url,
      stacked: false,
      stories: [story],
    }));
  }

  /**
   * Ouvre la galerie (mode gallery) ou le viewer (mode viewer)
   */
  public open(): void {
    if (this.destroyed) return;

    if (this.options.mode === 'gallery') {
      this.buildGallery();
      return;
    }

    this.openViewer();
  }

  /**
   * Ouvre un album en fullscreen (mode gallery)
   */
  public openAlbum(index: number): void {
    if (this.destroyed) return;
    const albums = this.resolveAlbums();
    const album = albums[index];
    if (!album?.stories?.length) {
      this.logger.warn(`Album introuvable à l'index ${index}`);
      return;
    }

    this.activeAlbumIndex = index;
    this.options.stories = album.stories;
    this.currentIndex = 0;
    this.forceFullscreen = true;
    this.openViewer();
  }

  /**
   * Construit et démarre le viewer
   */
  private openViewer(): void {
    const stories = this.options.stories;
    if (!stories.length) {
      this.logger.warn('Aucune story à afficher (`stories` vide)');
      return;
    }

    this.options.onOpenStart?.(this.el);
    this.buildViewerDom();
    this.bindEvents();
    this.isOpen = true;
    this.goTo(this.currentIndex, 'start');
    this.options.onOpenEnd?.(this.el);
  }

  /**
   * Ferme le viewer (la galerie reste affichée en mode gallery)
   */
  public close(): void {
    if (!this.isOpen && !this.card) {
      this.options.onClose?.();
      return;
    }
    this.options.onCloseStart?.(this.el);
    this.options.onClose?.();
    this.teardownViewer();
    this.isOpen = false;
    this.forceFullscreen = false;
    this.activeAlbumIndex = -1;
    this.options.onCloseEnd?.(this.el);
  }

  /**
   * Story suivante
   */
  public next(): void {
    this.options.onNext?.(this.currentIndex);
    if (this.currentIndex < this.options.stories.length - 1) {
      this.goTo(this.currentIndex + 1, 'forward');
    } else {
      this.finishStory(this.currentIndex);
      if (this.options.loop) {
        this.goTo(0, 'forward');
      } else {
        this.options.onAllStoriesEnd?.();
      }
    }
  }

  /**
   * Story précédente
   */
  public prev(): void {
    this.options.onPrevious?.(this.currentIndex);
    const target = Math.max(0, Math.min(this.currentIndex - 1, this.options.stories.length - 1));
    this.goTo(target, 'backward');
  }

  /**
   * Saute à un index donné
   */
  public goTo(index: number, _direction: 'start' | 'forward' | 'backward' = 'forward'): void {
    if (this.destroyed || !this.isOpen) return;
    if (index === this.currentIndex && this.currentMediaEl) return;
    if (index < 0 || index >= this.options.stories.length) return;

    this.clearActiveStoryTimers();
    this.resetProgress(index);
    this.currentIndex = index;
    this.updateArrowState();
    const story = this.options.stories[index];
    if (!story) {
      this.logger.warn(`Story introuvable à l'index ${index}`);
      return;
    }
    this.renderStory(story);
  }

  /**
   * Met en pause la progression et la vidéo
   */
  public pause(): void {
    if (this.paused) return;
    this.paused = true;
    this.getMount().classList.add('mediastories--paused');
    if (this.currentMediaEl instanceof HTMLVideoElement) {
      this.currentMediaEl.pause();
    }
  }

  /**
   * Reprend après pause
   */
  public resume(): void {
    if (!this.paused) return;
    this.paused = false;
    this.getMount().classList.remove('mediastories--paused');
    this.clockLastTs = performance.now();
    if (this.currentMediaEl instanceof HTMLVideoElement) {
      this.currentMediaEl.play().catch(() => undefined);
    }
  }

  /** Alias de {@link resume} */
  public play = (): void => {
    this.resume();
  };

  /**
   * Remplace la liste de stories et redémarre si ouvert
   */
  public setStories(stories: MediaStory[], startIndex = 0): void {
    this.options.stories = stories;
    this.currentIndex = Math.max(0, Math.min(startIndex, Math.max(0, stories.length - 1)));
    if (this.isOpen) {
      this.teardownViewer();
      this.openViewer();
    }
  }

  /**
   * Remplace les albums (mode gallery) et reconstruit le rail
   */
  public setAlbums(albums: MediaStoryAlbum[]): void {
    this.options.albums = albums;
    if (this.options.mode === 'gallery') {
      this.teardownGallery();
      this.buildGallery();
    }
  }

  /**
   * Index courant
   */
  public getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * Index de l'album ouvert (-1 si aucun)
   */
  public getActiveAlbumIndex(): number {
    return this.activeAlbumIndex;
  }

  /**
   * Indique si le viewer est ouvert
   */
  public getIsOpen(): boolean {
    return this.isOpen;
  }

  /**
   * Indique si la story courante (ou un index) est likée
   */
  public isLiked(index: number = this.currentIndex): boolean {
    return this.likedByIndex.has(index);
  }

  /**
   * Bascule le like de la story courante (ou d'un index)
   */
  public toggleLike(index: number = this.currentIndex): boolean {
    const story = this.options.stories[index];
    if (!story) return false;
    const next = !this.likedByIndex.has(index);
    if (next) this.likedByIndex.add(index);
    else this.likedByIndex.delete(index);
    story.liked = next;
    this.syncLikeButton();
    this.options.onLike?.(index, story, next);
    return next;
  }

  /**
   * Force un like
   */
  public like(index: number = this.currentIndex): void {
    if (!this.isLiked(index)) this.toggleLike(index);
  }

  /**
   * Retire le like
   */
  public unlike(index: number = this.currentIndex): void {
    if (this.isLiked(index)) this.toggleLike(index);
  }

  /**
   * Partage la story courante (Web Share API ou copie presse-papiers)
   */
  public async share(index: number = this.currentIndex): Promise<void> {
    const story = this.options.stories[index];
    if (!story) return;
    const url = story.shareUrl || story.seeMoreUrl || story.url || window.location.href;
    const title = story.shareTitle || story.header?.heading || LocaleManager.t('mediastories.ariaLabel');
    const text = story.shareText || story.caption || title;

    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({ title, text, url });
      } else {
        await copyToClipboard(url);
      }
    } catch {
      try {
        await copyToClipboard(url);
      } catch {
        this.logger.warn('Partage impossible');
        return;
      }
    }

    this.options.onShare?.(index, story, url);
  }

  /**
   * Destruction complète de l'instance
   */
  public override destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.teardownViewer();
    this.teardownGallery();
    this.el.classList.remove(
      ROOT_CLASS,
      'mediastories--fullscreen',
      'mediastories--paused',
      'mediastories--gallery',
      'mediastories--with-arrows'
    );
    super.destroy();
    this.logger.info('Component destroyed');
  }

  // ---------------------------------------------------------------------------
  // Gallery
  // ---------------------------------------------------------------------------

  private buildGallery(): void {
    const albums = this.resolveAlbums();
    if (!albums.length) {
      this.logger.warn('Aucun album à afficher (mode gallery)');
      return;
    }

    this.teardownGallery();
    this.el.classList.add(ROOT_CLASS, 'mediastories--gallery');
    setAriaAttributes(this.el, {
      role: 'region',
      label: LocaleManager.t('mediastories.galleryAriaLabel'),
    });

    this.galleryRail = document.createElement('div');
    this.galleryRail.className = 'mediastories__gallery';
    setAriaAttributes(this.galleryRail, { role: 'list' });

    const intro = this.options.galleryIntro;
    if (intro) {
      this.galleryRail.appendChild(this.createGalleryIntro(intro));
    }

    albums.forEach((album, index) => {
      this.galleryRail!.appendChild(this.createCover(album, index));
    });

    this.el.appendChild(this.galleryRail);
    this.galleryBuilt = true;
    IconManager.forceDisplayIcons();
  }

  private createGalleryIntro(intro: MediaStoriesGalleryIntro): HTMLElement {
    const card = document.createElement('article');
    card.className = 'mediastories__intro';
    setAriaAttributes(card, { role: 'listitem' });

    if (intro.icon) {
      const iconWrap = document.createElement('span');
      iconWrap.className = 'mediastories__intro-icon';
      iconWrap.innerHTML = `<i class="k3ui-icon" name="${intro.icon}" size="${ICON_SIZE}" aria-hidden="true"></i>`;
      card.appendChild(iconWrap);
    }

    const title = document.createElement('h2');
    title.className = 'mediastories__intro-title';
    title.textContent = intro.title;
    card.appendChild(title);

    if (intro.subtitle) {
      const sub = document.createElement('p');
      sub.className = 'mediastories__intro-subtitle';
      sub.textContent = intro.subtitle;
      card.appendChild(sub);
    }

    return card;
  }

  private createCover(album: MediaStoryAlbum, index: number): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mediastories__cover';
    setAriaAttributes(btn, {
      role: 'listitem',
      label: `${LocaleManager.t('mediastories.openAlbum')}: ${album.title}`,
    });

    const coverBadge = this.createCoverBadge(album);
    if (coverBadge) {
      btn.appendChild(coverBadge);
    }

    const img = document.createElement('img');
    img.className = 'mediastories__cover-img';
    img.src = album.coverUrl;
    img.alt = album.title;
    img.loading = 'lazy';
    img.decoding = 'async';
    btn.appendChild(img);

    const headline = document.createElement('div');
    headline.className = 'mediastories__cover-headline';
    const headlineText = document.createElement('div');
    headlineText.className = 'mediastories__cover-headline-text';
    this.setCoverHeadline(headlineText, album.title);
    headline.appendChild(headlineText);
    btn.appendChild(headline);

    const bands = document.createElement('div');
    bands.className = 'mediastories__cover-bands';
    bands.setAttribute('aria-hidden', 'true');

    const bandNear = document.createElement('span');
    bandNear.className = 'mediastories__cover-band mediastories__cover-band--near';

    const bandFar = document.createElement('span');
    bandFar.className = 'mediastories__cover-band mediastories__cover-band--far';

    bands.append(bandNear, bandFar);
    btn.appendChild(bands);

    const cleanup = this.registerEvent(btn, 'click', () => {
      this.openAlbum(index);
    });
    if (typeof cleanup === 'function') this.galleryCleanups.push(cleanup);

    return btn;
  }

  /**
   * Badge catégorie cover — ButtonShape tonal décoratif (leading octagonal-circle)
   * @param album - Album galerie
   */
  private createCoverBadge(album: MediaStoryAlbum): HTMLElement | null {
    if (!album.badge && !album.badgeIcon) return null;

    const wrap = document.createElement('div');
    wrap.className = 'mediastories__cover-badge';

    const badge = document.createElement('span');
    badge.className = 'btn-shape btn-shape--tonal btn-shape--sm';
    badge.setAttribute('data-morph', 'false');
    badge.setAttribute('aria-hidden', 'true');

    if (album.badgeIcon) {
      const slot = document.createElement('span');
      slot.className = 'btn-shape__slot btn-shape__slot--leading';
      slot.setAttribute('data-shape', 'octagonal-circle');
      slot.innerHTML = `<i name="${album.badgeIcon}" aria-hidden="true"></i>`;
      badge.appendChild(slot);
    }

    if (album.badge) {
      const label = document.createElement('span');
      label.className = 'btn-shape__label';
      label.textContent = album.badge;
      badge.appendChild(label);
    }

    wrap.appendChild(badge);

    const created = ButtonShape.init(badge, {
      ripple: false,
      morph: false,
      variant: 'tonal',
      size: 'sm',
      leadingShape: 'octagonal-circle',
    });
    const inst = Array.isArray(created) ? created[0] ?? ButtonShape.getInstance(badge) : created;
    if (inst) {
      this.galleryCleanups.push(() => inst.destroy());
    }

    badge.removeAttribute('role');
    badge.removeAttribute('tabindex');

    return wrap;
  }

  /**
   * Titre cover : `\n` → sauts de ligne (affichage type Media Stories)
   */
  private setCoverHeadline(el: HTMLElement, title: string): void {
    const parts = title.split('\n');
    if (parts.length === 1) {
      el.textContent = title;
      return;
    }
    parts.forEach((part, i) => {
      if (i > 0) el.appendChild(document.createElement('br'));
      el.appendChild(document.createTextNode(part));
    });
  }

  private teardownGallery(): void {
    this.galleryCleanups.forEach((fn) => fn());
    this.galleryCleanups = [];
    this.galleryRail?.remove();
    this.galleryRail = null;
    this.galleryBuilt = false;
    this.el.classList.remove('mediastories--gallery');
  }

  // ---------------------------------------------------------------------------
  // Viewer DOM
  // ---------------------------------------------------------------------------

  private buildViewerDom(): void {
    this.teardownViewer(false);

    const fromGallery = this.options.mode === 'gallery';
    const fullscreen = fromGallery || this.forceFullscreen || this.options.fullscreen;
    const { width, height, showCloseButton, aspectRatio, showArrows } = this.options;

    this.syncLikedFromStories();

    let mount = this.el;
    if (fromGallery) {
      this.viewerPortal = document.createElement('div');
      this.viewerPortal.className = `${ROOT_CLASS} mediastories--portal`;
      document.body.appendChild(this.viewerPortal);
      mount = this.viewerPortal;
    } else {
      this.el.querySelectorAll('[data-mediastories-url]').forEach((n) => n.remove());
    }

    mount.classList.add(ROOT_CLASS);
    mount.classList.toggle('mediastories--fullscreen', fullscreen);
    mount.classList.toggle('mediastories--with-arrows', !!showArrows);
    setAriaAttributes(mount, {
      role: 'dialog',
      label: LocaleManager.t('mediastories.ariaLabel'),
      modal: fullscreen ? true : null,
    });
    mount.tabIndex = 0;

    this.card = document.createElement('div');
    this.card.className = 'mediastories__card';
    if (fullscreen) {
      this.card.style.aspectRatio = aspectRatio;
    } else {
      this.card.style.width = MediaStories.cssSize(width);
      this.card.style.height = MediaStories.cssSize(height);
    }

    if (fullscreen) {
      this.backdrop = document.createElement('div');
      this.backdrop.className = 'mediastories__backdrop';
      const layerA = document.createElement('div');
      layerA.className = 'mediastories__backdrop-layer mediastories__backdrop-layer--active';
      const layerB = document.createElement('div');
      layerB.className = 'mediastories__backdrop-layer';
      this.backdrop.append(layerA, layerB);
      this.backdropLayers = [layerA, layerB];

      this.exitFullscreenBtn = this.createIconButton({
        icon: 'compress',
        className: 'mediastories__exit',
        label: LocaleManager.t('mediastories.exitFullscreen'),
        variant: 'tonal',
      });
      this.exitFullscreenIcon = this.initIconButton(this.exitFullscreenBtn);
    }

    if (showArrows) {
      this.arrowPrev = this.createIconButton({
        icon: 'chevron-left',
        className: 'mediastories__arrow mediastories__arrow--prev',
        label: LocaleManager.t('mediastories.previous'),
        variant: 'tonal',
      });
      this.arrowNext = this.createIconButton({
        icon: 'chevron-right',
        className: 'mediastories__arrow mediastories__arrow--next',
        label: LocaleManager.t('mediastories.next'),
        variant: 'tonal',
      });
      this.arrowPrevIcon = this.initIconButton(this.arrowPrev);
      this.arrowNextIcon = this.initIconButton(this.arrowNext);
    }

    this.progressWrap = document.createElement('div');
    this.progressWrap.className = 'mediastories__progress';
    this.progressFills = [];
    this.options.stories.forEach(() => {
      const seg = document.createElement('div');
      seg.className = 'mediastories__progress-seg';
      const fill = document.createElement('div');
      fill.className = 'mediastories__progress-fill';
      seg.appendChild(fill);
      this.progressWrap!.appendChild(seg);
      this.progressFills.push(fill);
    });

    this.mediaWrap = document.createElement('div');
    this.mediaWrap.className = 'mediastories__media';

    this.headerWrap = document.createElement('div');
    this.headerWrap.className = 'mediastories__header';

    if (showCloseButton && !fullscreen) {
      this.closeBtn = this.createIconButton({
        icon: 'xmark',
        className: 'mediastories__close',
        label: LocaleManager.t('mediastories.close'),
        variant: 'standard',
      });
      this.initIconButton(this.closeBtn);
      this.headerWrap.appendChild(this.closeBtn);
    }

    this.captionWrap = document.createElement('div');
    this.captionWrap.className = 'mediastories__caption';

    this.actionsWrap = document.createElement('div');
    this.actionsWrap.className = 'mediastories__actions';

    if (this.options.showLikeButton) {
      this.likeBtn = this.createIconButton({
        icon: 'heart',
        className: 'mediastories__action mediastories__action--like',
        label: LocaleManager.t('mediastories.like'),
        variant: 'tonal',
      });
      this.likeIcon = this.initIconButton(this.likeBtn);
      this.actionsWrap.appendChild(this.likeBtn);
    }

    if (this.options.showShareButton) {
      this.shareBtn = this.createIconButton({
        icon: 'share-nodes',
        className: 'mediastories__action mediastories__action--share',
        label: LocaleManager.t('mediastories.share'),
        variant: 'tonal',
      });
      this.shareIcon = this.initIconButton(this.shareBtn);
      this.actionsWrap.appendChild(this.shareBtn);
    }

    this.tapLeft = document.createElement('div');
    this.tapLeft.className = 'mediastories__tap mediastories__tap--left';
    this.tapRight = document.createElement('div');
    this.tapRight.className = 'mediastories__tap mediastories__tap--right';

    this.card.append(
      this.mediaWrap,
      this.progressWrap,
      this.headerWrap,
      this.captionWrap,
      this.actionsWrap,
      this.tapLeft,
      this.tapRight
    );

    if (this.backdrop) mount.appendChild(this.backdrop);
    if (this.exitFullscreenBtn) mount.appendChild(this.exitFullscreenBtn);
    if (this.arrowPrev) mount.appendChild(this.arrowPrev);
    mount.appendChild(this.card);
    if (this.arrowNext) mount.appendChild(this.arrowNext);

    IconManager.forceDisplayIcons();
  }

  private createIconButton(opts: {
    icon: string;
    className: string;
    label: string;
    variant: 'standard' | 'tonal' | 'filled' | 'outlined';
  }): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `btn-icon btn-icon--${opts.variant} btn-icon--${ICON_SIZE} ripple ${opts.className}`;
    setAriaAttributes(btn, { label: opts.label });
    btn.innerHTML = `<span class="btn-icon__icon"><i class="k3ui-icon" name="${opts.icon}" size="${ICON_SIZE}" aria-hidden="true"></i></span>`;
    return btn;
  }

  private initIconButton(btn: HTMLButtonElement): ButtonIcon | null {
    const created = ButtonIcon.init(btn, {
      size: ICON_SIZE,
      variant: btn.classList.contains('btn-icon--tonal')
        ? 'tonal'
        : btn.classList.contains('btn-icon--filled')
          ? 'filled'
          : btn.classList.contains('btn-icon--outlined')
            ? 'outlined'
            : 'standard',
      ripple: true,
    });
    return Array.isArray(created) ? created[0] ?? ButtonIcon.getInstance(btn) : created;
  }

  private syncLikedFromStories(): void {
    this.likedByIndex.clear();
    this.options.stories.forEach((story, index) => {
      if (story.liked) this.likedByIndex.add(index);
    });
  }

  private syncLikeButton(): void {
    if (!this.likeBtn || !this.likeIcon) return;
    const liked = this.isLiked(this.currentIndex);
    this.likeIcon.setSelected(liked);
    setAriaAttributes(this.likeBtn, {
      label: LocaleManager.t(liked ? 'mediastories.unlike' : 'mediastories.like'),
    });
  }

  private teardownViewer(_clearHostClass = true): void {
    this.clearActiveStoryTimers();
    this.clearMediaEvents();
    this.unbindEvents();
    this.destroyIconButtons();
    this.currentMediaEl = null;
    this.progressFills = [];
    this.backdropLayers = null;
    this.backdrop?.remove();
    this.backdrop = null;
    this.arrowPrev?.remove();
    this.arrowPrev = null;
    this.arrowNext?.remove();
    this.arrowNext = null;
    this.exitFullscreenBtn?.remove();
    this.exitFullscreenBtn = null;
    this.closeBtn = null;
    this.likeBtn = null;
    this.shareBtn = null;
    this.actionsWrap = null;
    this.card?.remove();
    this.card = null;
    this.progressWrap = null;
    this.mediaWrap = null;
    this.headerWrap = null;
    this.captionWrap = null;
    this.tapLeft = null;
    this.tapRight = null;

    const mount = this.getMount();
    mount.classList.remove('mediastories--fullscreen', 'mediastories--paused', 'mediastories--with-arrows');

    if (this.viewerPortal) {
      this.viewerPortal.remove();
      this.viewerPortal = null;
    } else {
      this.el.classList.remove('mediastories--fullscreen', 'mediastories--paused', 'mediastories--with-arrows');
    }
  }

  private destroyIconButtons(): void {
    [
      this.arrowPrevIcon,
      this.arrowNextIcon,
      this.exitFullscreenIcon,
      this.likeIcon,
      this.shareIcon,
    ].forEach((inst) => {
      try {
        inst?.destroy();
      } catch {
        /* ignore */
      }
    });
    this.arrowPrevIcon = null;
    this.arrowNextIcon = null;
    this.exitFullscreenIcon = null;
    this.likeIcon = null;
    this.shareIcon = null;
  }

  private updateArrowState(): void {
    if (this.arrowPrev) {
      const atStart = this.currentIndex === 0 && !this.options.loop;
      this.arrowPrev.disabled = atStart;
      this.arrowPrev.classList.toggle('mediastories__arrow--disabled', atStart);
      if (atStart) this.arrowPrevIcon?.disable();
      else this.arrowPrevIcon?.enable();
    }
    if (this.arrowNext) {
      const atEnd = this.currentIndex === this.options.stories.length - 1 && !this.options.loop;
      this.arrowNext.disabled = atEnd;
      this.arrowNext.classList.toggle('mediastories__arrow--disabled', atEnd);
      if (atEnd) this.arrowNextIcon?.disable();
      else this.arrowNextIcon?.enable();
    }
  }

  private updateBackdrop(url: string | null): void {
    if (!this.backdropLayers) return;
    const nextLayer = this.backdropLayers[this.backdropActiveLayer === 0 ? 1 : 0];
    const currentLayer = this.backdropLayers[this.backdropActiveLayer];
    nextLayer.style.backgroundImage = url ? `url("${url}")` : '';
    nextLayer.classList.add('mediastories__backdrop-layer--active');
    currentLayer.classList.remove('mediastories__backdrop-layer--active');
    this.backdropActiveLayer = this.backdropActiveLayer === 0 ? 1 : 0;
  }

  // ---------------------------------------------------------------------------
  // Events
  // ---------------------------------------------------------------------------

  private bindEvents(): void {
    if (!this.tapLeft || !this.tapRight) return;
    const mount = this.getMount();

    this.trackEvent(this.registerEvent(this.tapLeft, 'pointerdown', this.onPointerDown));
    this.trackEvent(this.registerEvent(this.tapRight, 'pointerdown', this.onPointerDown));
    this.trackEvent(this.registerEvent(mount, 'pointerup', this.onPointerUp));
    this.trackEvent(this.registerEvent(mount, 'pointercancel', this.onPointerUp));
    this.trackEvent(this.registerEvent(mount, 'pointermove', this.onPointerMove));

    this.trackEvent(
      this.registerEvent(this.tapLeft, 'click', () => {
        if (this.isHolding) return;
        this.prev();
      })
    );
    this.trackEvent(
      this.registerEvent(this.tapRight, 'click', () => {
        if (this.isHolding) return;
        this.next();
      })
    );

    if (this.closeBtn) {
      this.trackEvent(
        this.registerEvent(this.closeBtn, 'click', (e: Event) => {
          e.stopPropagation();
          this.close();
        })
      );
    }
    if (this.exitFullscreenBtn) {
      this.trackEvent(
        this.registerEvent(this.exitFullscreenBtn, 'click', (e: Event) => {
          e.stopPropagation();
          this.close();
        })
      );
    }
    if (this.arrowPrev) {
      this.trackEvent(
        this.registerEvent(this.arrowPrev, 'click', (e: Event) => {
          e.stopPropagation();
          this.prev();
        })
      );
    }
    if (this.arrowNext) {
      this.trackEvent(
        this.registerEvent(this.arrowNext, 'click', (e: Event) => {
          e.stopPropagation();
          this.next();
        })
      );
    }
    if (this.likeBtn) {
      this.trackEvent(
        this.registerEvent(this.likeBtn, 'click', (e: Event) => {
          e.stopPropagation();
          this.toggleLike();
        })
      );
    }
    if (this.shareBtn) {
      this.trackEvent(
        this.registerEvent(this.shareBtn, 'click', (e: Event) => {
          e.stopPropagation();
          void this.share();
        })
      );
    }

    if (this.options.keyboardNavigation) {
      this.keyboard = new Keyboard({
        target: mount,
        enabled: true,
        ignoreSystemKeys: false,
        onKeyDown: (_event: KeyboardEvent, key: string) => {
          if (key === 'ArrowRight' || key === 'Right') this.next();
          else if (key === 'ArrowLeft' || key === 'Left') this.prev();
          else if (key === 'Escape' || key === 'Esc') this.close();
        },
      });
    }
  }

  private trackEvent(cleanup: (() => void) | void): void {
    if (typeof cleanup === 'function') this.eventCleanups.push(cleanup);
  }

  private unbindEvents(): void {
    this.eventCleanups.forEach((fn) => fn());
    this.eventCleanups = [];
    if (this.keyboard) {
      this.keyboard.destroy();
      this.keyboard = null;
    }
  }

  private onPointerDown = (e: Event): void => {
    const pe = e as PointerEvent;
    this.pointerDownAt = performance.now();
    this.pointerDownY = pe.clientY;
    this.isHolding = false;
    const threshold = this.options.holdThresholdMs ?? HOLD_THRESHOLD_FALLBACK;
    this.holdTimer = window.setTimeout(() => {
      this.isHolding = true;
      this.pause();
    }, threshold);
  };

  private onPointerMove = (e: Event): void => {
    if (!this.pointerDownAt) return;
    const pe = e as PointerEvent;
    const dy = pe.clientY - this.pointerDownY;
    const swipePx = this.options.swipeDownClosePx ?? SWIPE_DOWN_FALLBACK;
    if (dy > swipePx) {
      this.close();
    }
  };

  private onPointerUp = (): void => {
    if (this.holdTimer !== null) {
      window.clearTimeout(this.holdTimer);
      this.holdTimer = null;
    }
    if (this.isHolding) {
      this.resume();
    }
    this.pointerDownAt = 0;
    window.setTimeout(() => {
      this.isHolding = false;
    }, 0);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  private clearMediaEvents(): void {
    this.mediaCleanups.forEach((fn) => fn());
    this.mediaCleanups = [];
  }

  private trackMediaEvent(cleanup: (() => void) | void): void {
    if (typeof cleanup === 'function') this.mediaCleanups.push(cleanup);
  }

  private renderStory(story: MediaStory): void {
    if (!this.mediaWrap) return;
    this.clearMediaEvents();
    this.options.onStoryStart?.(this.currentIndex, story);
    this.renderHeader(story);
    this.renderCaption(story);
    this.syncLikeButton();

    const type: MediaStoryType = story.type ?? 'image';
    this.updateBackdrop(type === 'video' ? story.poster ?? null : story.url);

    this.mediaWrap.innerHTML = '';
    this.mediaWrap.classList.add('mediastories__media--loading');

    if (type === 'video') {
      const video = document.createElement('video');
      video.src = story.url;
      video.className = 'mediastories__media-el';
      video.playsInline = true;
      video.muted = true;
      this.trackMediaEvent(
        this.registerEvent(video, 'loadedmetadata', () => {
          this.mediaWrap?.classList.remove('mediastories__media--loading');
          this.startProgress(video.duration * 1000);
          video.play().catch(() => undefined);
        })
      );
      this.trackMediaEvent(
        this.registerEvent(video, 'ended', () => {
          this.advanceIfNotAlready();
        })
      );
      this.currentMediaEl = video;
      this.mediaWrap.appendChild(video);
    } else {
      const img = new Image();
      img.className = 'mediastories__media-el';
      img.alt = story.header?.heading ?? '';
      this.trackMediaEvent(
        this.registerEvent(img, 'load', () => {
          this.mediaWrap?.classList.remove('mediastories__media--loading');
          this.startProgress(story.duration ?? this.options.defaultInterval);
        })
      );
      this.trackMediaEvent(
        this.registerEvent(img, 'error', () => {
          this.mediaWrap?.classList.remove('mediastories__media--loading');
          this.startProgress(story.duration ?? this.options.defaultInterval);
        })
      );
      img.src = story.url;
      this.currentMediaEl = img;
      this.mediaWrap.appendChild(img);
    }

    this.preloadNext();
  }

  private renderHeader(story: MediaStory): void {
    if (!this.headerWrap) return;
    const closeBtn = this.closeBtn;
    this.headerWrap.innerHTML = '';

    if (story.header) {
      const info = document.createElement('div');
      info.className = 'mediastories__profile';

      if (story.header.profileImage) {
        const avatar = document.createElement('img');
        avatar.className = 'mediastories__avatar';
        avatar.src = story.header.profileImage;
        avatar.alt = '';
        info.appendChild(avatar);
      }

      const text = document.createElement('div');
      text.className = 'mediastories__profile-text';
      const heading = document.createElement('div');
      heading.className = 'mediastories__heading';
      heading.textContent = story.header.heading;
      text.appendChild(heading);

      if (story.header.subheading) {
        const sub = document.createElement('div');
        sub.className = 'mediastories__subheading';
        sub.textContent = story.header.subheading;
        text.appendChild(sub);
      }
      info.appendChild(text);
      this.headerWrap.appendChild(info);
    }

    if (closeBtn) this.headerWrap.appendChild(closeBtn);
  }

  private renderCaption(story: MediaStory): void {
    if (!this.captionWrap) return;
    this.captionWrap.innerHTML = '';
    if (story.caption) {
      const p = document.createElement('p');
      p.className = 'mediastories__caption-text';
      p.textContent = story.caption;
      this.captionWrap.appendChild(p);
    }
    if (story.seeMoreUrl) {
      const a = document.createElement('a');
      a.className = 'mediastories__see-more';
      a.href = story.seeMoreUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = LocaleManager.t('mediastories.seeMore');
      this.captionWrap.appendChild(a);
    }
  }

  private preloadNext(): void {
    const next = this.options.stories[this.currentIndex + 1];
    if (next && (next.type ?? 'image') === 'image') {
      new Image().src = next.url;
    }
  }

  // ---------------------------------------------------------------------------
  // Progress clock (rAF)
  // ---------------------------------------------------------------------------

  private resetProgress(activeIndex: number): void {
    this.progressFills.forEach((fill, i) => {
      fill.style.width = i < activeIndex ? '100%' : '0%';
    });
  }

  private startProgress(durationMs: number): void {
    this.clockDurationMs = Math.max(1, durationMs);
    this.clockElapsedMs = 0;
    this.clockLastTs = performance.now();
    this.advancing = false;
    const fill = this.progressFills[this.currentIndex];
    if (fill) fill.style.width = '0%';

    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame(this.tickProgress);
  }

  private tickProgress = (): void => {
    if (this.destroyed || !this.isOpen) return;

    const now = performance.now();
    const dt = now - this.clockLastTs;
    this.clockLastTs = now;
    if (!this.paused) {
      this.clockElapsedMs += dt;
    }

    const pct = Math.min(100, (this.clockElapsedMs / this.clockDurationMs) * 100);
    const fill = this.progressFills[this.currentIndex];
    if (fill) fill.style.width = `${pct}%`;

    if (pct >= 100) {
      this.advanceIfNotAlready();
      return;
    }

    this.rafId = requestAnimationFrame(this.tickProgress);
  };

  private advanceIfNotAlready(): void {
    if (this.advancing) return;
    this.advancing = true;
    this.finishStory(this.currentIndex);
    this.next();
  }

  private finishStory(index: number): void {
    const story = this.options.stories[index];
    if (story) this.options.onStoryEnd?.(index, story);
  }

  private clearActiveStoryTimers(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.holdTimer !== null) {
      window.clearTimeout(this.holdTimer);
      this.holdTimer = null;
    }
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('k3ui-mediastories')) {
  customElements.define(
    'k3ui-mediastories',
    class K3UIMediaStoriesElement extends HTMLElement {
      connectedCallback(): void {
        if (!MediaStories.getInstance(this)) {
          MediaStories.init(this);
        }
      }
    }
  );
}

export default MediaStories;
