/**
 * @fileoverview Composant Toast — API solid-toast
 * @see https://www.solid-toast.com/
 */

import { Component, Openable } from '../core/base/Component';
import { toComponentClassDef } from '../types/components/component-base';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { IconManager, LocaleManager, LoggerManager, ToastToasterManager } from '../core/managers';
import type { ToastToasterItem } from '../core/managers/ToastToasterManager';
import { ManagerFactory } from '../core/factories';
import { setAriaAttributes } from '../utils/dom/aria';
import type {
  ToastHoverBehavior,
  ToastInput,
  ToastOptions,
  ToastPosition,
  ToastPriority,
  ToastPromiseMessages,
  ToastRenderContext,
  ToastTimerStyle,
  ToastUpdatePayload,
  ToastVariant,
} from '../types/components';
import { getToastDefaults, ToastSpecs } from '../specs/components/toast.specs';

type ToastId = string;

type ToastInternalState = {
  id: ToastId;
  closeDelay: number;
  unmountDelay: number;
  type: ToastPriority;
  hover: ToastHoverBehavior;
  createdAt: number;
  pauseDuration: number;
  pausedAt?: number;
  timeout: number | null;
};

/** API callable K.toast avec raccourcis solid-toast */
export interface ToastCallable {
  (input?: ToastInput, options?: Partial<ToastOptions>): string;
  success: (input?: ToastInput, options?: Partial<ToastOptions>) => string;
  error: (input?: ToastInput, options?: Partial<ToastOptions>) => string;
  warning: (input?: ToastInput, options?: Partial<ToastOptions>) => string;
  info: (input?: ToastInput, options?: Partial<ToastOptions>) => string;
  loading: (input?: ToastInput, options?: Partial<ToastOptions>) => string;
  promise: <T>(promise: Promise<T>, messages: ToastPromiseMessages<T>, options?: Partial<ToastOptions>) => Promise<T>;
  custom: (
    renderer: (ctx: ToastRenderContext) => HTMLElement | string,
    options?: Partial<ToastOptions>
  ) => string;
  dismiss: (id?: string) => void;
  remove: (id?: string) => void;
  update: (id: string, data: ToastUpdatePayload) => void;
  clear: (position?: ToastPosition) => void;
}

function generateId(prefix: string = 'toast'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

function isDatasetEnum<T extends string>(value: string, allowed: readonly T[]): value is T {
  return (allowed as readonly string[]).includes(value);
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function normalizeToastInput(
  input?: ToastInput,
  options: Partial<ToastOptions> = {}
): Partial<ToastOptions> {
  if (typeof input === 'string') {
    return { ...options, description: input };
  }
  return { ...input, ...options };
}

function resolvePromiseMessage<T>(
  input: ToastInput | ((value: T) => ToastInput) | undefined,
  value: T,
  fallbackVariant: ToastVariant
): Partial<ToastOptions> {
  if (typeof input === 'function') {
    return normalizeToastInput(input(value), { variant: fallbackVariant });
  }
  return normalizeToastInput(input, { variant: fallbackVariant });
}

/**
 * Toast Component - pile repliée + API solid-toast
 */
export class Toast extends Component<ToastOptions> implements Openable, ToastToasterItem {
  readonly priority: PriorityLevel = getToastDefaults().priorityLevel as PriorityLevel;

  private static _instances: Map<HTMLElement, Toast> = new Map();
  private static _active: Map<ToastId, Toast> = new Map();

  private logger: LoggerManager;
  private _isProgrammatic = false;
  private _state: ToastInternalState | null = null;
  private _skipExitAnimation = false;

  isOpen = false;

  constructor(el: HTMLElement | null, options: Partial<ToastOptions>) {
    const element = el || document.createElement('div');

    const domOptions = Toast._readOptionsFromElement(element);
    super(element, { ...domOptions, ...options }, toComponentClassDef(Toast));

    this._isProgrammatic = !el;
    this.logger = ManagerFactory.getLoggerManager('[Toast]');

    this.options = {
      ...Toast.defaults,
      ...domOptions,
      ...options,
    } as ToastOptions;

    if (!this._isProgrammatic) {
      Toast._instances.set(this.el, this);
    }

    this._setupToast();
    this._setupEventListeners();

    if (!this._isProgrammatic) {
      this._mountToContainer();
      const openNow = Boolean(this.options.showImmediately);
      if (openNow) {
        this.open();
      } else {
        requestAnimationFrame(() => this.open());
      }
    }
  }

  static get defaults(): ToastOptions {
    return getToastDefaults();
  }

  static getInstance(el: HTMLElement): Toast | undefined {
    return Toast._instances.get(el);
  }

  static init(
    els: KElement | InitElements<KElement> | string,
    options: Partial<ToastOptions> = {}
  ): Toast | Toast[] {
    return Component.init(els, options, toComponentClassDef(Toast)) as Toast | Toast[];
  }

  /** @inheritdoc */
  getId(): string {
    return this._state?.id ?? this.el.dataset.id ?? this.el.id;
  }

  /** @inheritdoc */
  isVisible(): boolean {
    return this.isOpen;
  }

  onInit(): void {
    // Les toasts programmatiques (Toast.show) gèrent mount/open après _setupToast
    if (!this._state) return;

    this._mountToContainer();

    if (this.options.classes) {
      this.el.classList.add(...this.options.classes.split(' ').filter(Boolean));
    }
    if (this.options.className) {
      this.el.classList.add(...this.options.className.split(' ').filter(Boolean));
    }

    const openNow = Boolean(this.options.showImmediately);
    if (openNow) {
      this.open();
    } else {
      requestAnimationFrame(() => this.open());
    }
  }

  /**
   * Affiche un toast (API programmatique).
   * @param options Options du toast
   * @returns id unique du toast
   */
  static show(options: Partial<ToastOptions> & { description?: string; title?: string } = {}): string {
    if (typeof options.gutter === 'number') {
      ToastToasterManager.configure({ gutter: options.gutter });
    }

    const toast = new Toast(null, options as ToastOptions);
    const id = toast._mountToContainer();
    toast.open();

    LoggerManager.create('[Toast]').info(
      `Toast.show(): "${options.title ?? options.description ?? ''}"`
    );
    return id;
  }

  /**
   * Toast succès.
   * @param input Message ou options
   * @param options Options additionnelles
   */
  static success(input?: ToastInput, options: Partial<ToastOptions> = {}): string {
    const merged = normalizeToastInput(input, { ...options, variant: 'success', showIcon: true });
    return Toast.show(merged);
  }

  /**
   * Toast erreur.
   * @param input Message ou options
   * @param options Options additionnelles
   */
  static error(input?: ToastInput, options: Partial<ToastOptions> = {}): string {
    const merged = normalizeToastInput(input, { ...options, variant: 'error', showIcon: true });
    return Toast.show(merged);
  }

  /**
   * Toast avertissement.
   * @param input Message ou options
   * @param options Options additionnelles
   */
  static warning(input?: ToastInput, options: Partial<ToastOptions> = {}): string {
    const merged = normalizeToastInput(input, { ...options, variant: 'warning', showIcon: true });
    return Toast.show(merged);
  }

  /**
   * Toast info.
   * @param input Message ou options
   * @param options Options additionnelles
   */
  static info(input?: ToastInput, options: Partial<ToastOptions> = {}): string {
    const merged = normalizeToastInput(input, { ...options, variant: 'info', showIcon: true });
    return Toast.show(merged);
  }

  /**
   * Toast chargement (persistant jusqu'à update/dismiss).
   * @param input Message ou options
   * @param options Options additionnelles
   */
  static loading(input?: ToastInput, options: Partial<ToastOptions> = {}): string {
    const merged = normalizeToastInput(input, {
      ...options,
      variant: 'loading',
      showIcon: true,
      closeDelay: 0,
      showProgressBar: false,
    });
    return Toast.show(merged);
  }

  /**
   * Toast lié à une promesse (loading → success/error).
   * @param promise Promesse à suivre
   * @param messages Messages par état
   * @param options Options communes
   */
  static promise<T>(
    promise: Promise<T>,
    messages: ToastPromiseMessages<T>,
    options: Partial<ToastOptions> = {}
  ): Promise<T> {
    const loadingOpts = resolvePromiseMessage(messages.loading, undefined as T, 'loading');
    const id = Toast.loading(loadingOpts, { ...options, id: options.id });

    return promise
      .then((data) => {
        const successOpts = resolvePromiseMessage(messages.success, data, 'success');
        Toast.update(id, { ...successOpts, variant: 'success', showIcon: true });
        const instance = Toast._active.get(id);
        if (instance) {
          instance._resetTimerForUpdate(
            (successOpts as ToastOptions).closeDelay ??
              (successOpts as ToastOptions).duration ??
              ToastSpecs.behaviors.defaultCloseDelay
          );
        }
        return data;
      })
      .catch((err) => {
        const errorOpts = resolvePromiseMessage(messages.error, err, 'error');
        Toast.update(id, { ...errorOpts, variant: 'error', showIcon: true });
        const instance = Toast._active.get(id);
        if (instance) {
          instance._resetTimerForUpdate(
            (errorOpts as ToastOptions).closeDelay ??
              (errorOpts as ToastOptions).duration ??
              ToastSpecs.behaviors.defaultCloseDelay
          );
        }
        throw err;
      });
  }

  /**
   * Toast entièrement custom.
   * @param renderer Fonction de rendu
   * @param options Options additionnelles
   */
  static custom(
    renderer: (ctx: ToastRenderContext) => HTMLElement | string,
    options: Partial<ToastOptions> = {}
  ): string {
    return Toast.show({ ...options, customRenderer: renderer });
  }

  /**
   * Ferme un toast avec animation.
   * @param id Identifiant (tous si omis)
   */
  static dismiss(id?: string): void {
    if (id) {
      Toast._active.get(id)?.close();
      return;
    }
    Toast.clear();
  }

  /**
   * Supprime un toast par id avec animation (alias dismiss).
   * @param id Identifiant
   */
  static remove(id?: string): void {
    if (!id) {
      Toast.clear(undefined, true);
      return;
    }
    const instance = Toast._active.get(id);
    if (!instance) return;
    instance._skipExitAnimation = true;
    instance.close(true);
  }

  /**
   * Met à jour le contenu d'un toast existant.
   * @param id Identifiant
   * @param data Données partielles
   */
  static update(id: string, data: ToastUpdatePayload & Partial<ToastOptions>): void {
    const instance = Toast._active.get(id);
    if (!instance) return;
    instance._updateContent(data);
  }

  /**
   * Nettoie les toasts visibles (plus récent en premier).
   * @param position Position ciblée (toutes si omise)
   */
  static clear(position?: ToastPosition, instant = false): void {
    const stagger = ToastSpecs.behaviors.clearStaggerMs;
    const targets = position
      ? ToastToasterManager.getToastsNewestFirst(position)
      : ToastToasterManager.getAllNewestFirst();

    targets.forEach((item, index) => {
      const toast = Toast._active.get(item.getId());
      if (!toast) return;
      if (instant) {
        toast._skipExitAnimation = true;
      }
      window.setTimeout(() => toast.close(instant), index * (instant ? 0 : stagger));
    });
  }

  /**
   * Met en pause les timers de tous les toasts d'une position (hover pause-all).
   * @param position Position du toaster
   */
  static pauseAll(position?: ToastPosition): void {
    const pos = (position ?? ToastSpecs.positions.default) as ToastPosition;
    ToastToasterManager.getToastsNewestFirst(pos).forEach((item) => {
      const toast = Toast._active.get(item.getId());
      if (toast?.isOpen) toast.pauseAutoClose();
    });
  }

  /**
   * Reprend les timers de tous les toasts d'une position.
   * @param position Position du toaster
   */
  static resumeAll(position?: ToastPosition): void {
    const pos = (position ?? ToastSpecs.positions.default) as ToastPosition;
    ToastToasterManager.getToastsNewestFirst(pos).forEach((item) => {
      const toast = Toast._active.get(item.getId());
      if (toast?.isOpen) toast.resumeAutoClose();
    });
  }

  private _mountToContainer(): string {
    const position = (this.options.position ?? ToastSpecs.positions.default) as ToastPosition;
    ToastToasterManager.ensureContainer(position);

    const id = this.options.id ?? generateId();
    this.el.id = id;
    this.el.dataset.id = id;
    if (this._state) {
      this._state.id = id;
    }

    ToastToasterManager.register(this, position);
    Toast._active.set(id, this);
    return id;
  }

  private _setupToast(): void {
    const o = this.options;
    const defaults = Toast.defaults;

    const closeDelay =
      typeof o.duration === 'number'
        ? o.duration
        : typeof o.closeDelay === 'number'
          ? o.closeDelay
          : (defaults.closeDelay ?? ToastSpecs.behaviors.defaultCloseDelay);

    const unmountDelay = o.unmountDelay ?? defaults.unmountDelay ?? ToastSpecs.behaviors.unmountDelay;
    const type = (o.type ?? defaults.type) as ToastPriority;
    const hover = (o.hover ?? defaults.hover) as ToastHoverBehavior;
    const shape = o.shape ?? defaults.shape ?? 'default';

    this.options.closeDelay = closeDelay;

    this.el.classList.add('toast');
    this._applyVariantClasses(o.variant ?? defaults.variant);
    this.el.classList.add(`toast--shape-${shape}`);
    this.el.classList.toggle('toast--with-title', Boolean(o.title));
    this.el.classList.toggle('toast--with-action', Boolean(o.actionText));
    this.el.classList.toggle('toast--with-close', Boolean(o.showClose));
    this.el.classList.toggle('toast--with-icon', this._hasLeadingIcon());
    this.el.classList.toggle('toast--multiline', Boolean(o.multiline));
    this.el.classList.toggle('toast--with-timer', this._showsProgressBar(closeDelay, o.showProgressBar));
    this._applyTimerStyleClasses(closeDelay, o.showProgressBar);

    const ariaLive = type === 'foreground' ? 'assertive' : ToastSpecs.accessibility.ariaLive;
    setAriaAttributes(this.el, {
      role: ToastSpecs.accessibility.role,
      live: ariaLive,
      tabIndex: ToastSpecs.accessibility.tabIndex,
    });

    const ids = {
      title: generateId('toast-title'),
      description: generateId('toast-desc'),
    };
    setAriaAttributes(this.el, {
      labelledby: ids.title,
      describedby: ids.description,
    });

    this._state = {
      id: '',
      closeDelay,
      unmountDelay,
      type,
      hover,
      createdAt: 0,
      pauseDuration: 0,
      timeout: null,
    };

    this._renderContent(ids.title, ids.description);
    this._applySurfaceStyle();
    if (this._usesK3uiIcon()) {
      IconManager.processIconsInContainer(this.el);
    }
  }

  private _usesK3uiIcon(): boolean {
    return typeof this.options.icon === 'string' || Boolean(this.options.showClose);
  }

  /**
   * Style de timer actif (barre basse ou overlay plein fond).
   */
  private _getTimerStyle(): ToastTimerStyle {
    return this.options.timerStyle ?? Toast.defaults.timerStyle ?? 'bar';
  }

  /**
   * Applique les classes de style timer sur le toast.
   */
  private _applyTimerStyleClasses(
    closeDelay: number = this._state?.closeDelay ?? this.options.closeDelay ?? 0,
    showProgressBar: boolean | undefined = this.options.showProgressBar
  ): void {
    const active = this._showsProgressBar(closeDelay, showProgressBar);
    const style = this._getTimerStyle();
    this.el.classList.toggle('toast--timer-bar', active && style === 'bar');
    this.el.classList.toggle('toast--timer-overlay', active && style === 'overlay');
  }

  /**
   * Indique si le timer auto-close doit être affiché.
   * @param closeDelay Délai de fermeture en ms
   * @param showProgressBar Option explicite (défaut : true)
   */
  private _showsProgressBar(
    closeDelay: number = this._state?.closeDelay ?? this.options.closeDelay ?? 0,
    showProgressBar: boolean | undefined = this.options.showProgressBar
  ): boolean {
    const show = showProgressBar ?? Toast.defaults.showProgressBar ?? true;
    if (!show) return false;
    return closeDelay > 0 && Number.isFinite(closeDelay) && closeDelay !== Infinity;
  }

  /** Markup HTML du timer barre (bas du toast). */
  private _renderBarTimerMarkup(): string {
    return `<div class="toast__timer" aria-hidden="true"><span class="toast__timer-track"><span class="toast__timer-bar"></span></span></div>`;
  }

  /** Markup HTML du timer overlay (plein fond). */
  private _renderOverlayTimerMarkup(): string {
    return `<div class="toast__timer-overlay" aria-hidden="true"><span class="toast__timer-overlay-fill"></span></div>`;
  }

  /** Insère le markup timer selon le style actif. */
  private _appendTimerMarkup(): void {
    if (!this._showsProgressBar()) return;
    if (this._getTimerStyle() === 'overlay') {
      this.el.insertAdjacentHTML('afterbegin', this._renderOverlayTimerMarkup());
      return;
    }
    this.el.insertAdjacentHTML('beforeend', this._renderBarTimerMarkup());
  }

  /** Retire tous les éléments timer du DOM. */
  private _removeTimerElements(): void {
    this.el.querySelector('.toast__timer')?.remove();
    this.el.querySelector('.toast__timer-overlay')?.remove();
  }

  /**
   * Anime l'élément de progression (barre ou overlay).
   * @param fill Élément animé
   * @param restart Redémarre l'animation depuis le ratio courant
   */
  private _animateTimerFill(fill: HTMLElement, restart = false): void {
    if (!this._state) return;

    const total = this._state.closeDelay;
    const left = this._getDurationLeft();
    if (left <= 0) return;

    const ratio = Math.min(1, Math.max(0, left / total));

    if (restart || !fill.style.getPropertyValue('--k3ui-toast-duration')) {
      fill.style.animation = 'none';
      fill.style.setProperty('--k3ui-toast-progress-start', String(ratio));
      fill.style.setProperty('--k3ui-toast-duration', `${left}ms`);
      void fill.offsetHeight;
      fill.style.animation = '';
    }
  }

  /**
   * Synchronise le timer avec le temps restant avant fermeture.
   * @param restart Redémarre l'animation depuis le ratio courant
   */
  private _syncTimer(restart = false): void {
    if (!this._showsProgressBar() || !this._state || !this.isOpen) {
      this.el.classList.remove('toast--with-timer', 'toast--paused', 'toast--timer-bar', 'toast--timer-overlay');
      return;
    }

    this.el.classList.add('toast--with-timer');
    this._applyTimerStyleClasses();

    const isOverlay = this._getTimerStyle() === 'overlay';

    if (isOverlay) {
      let overlay = this.el.querySelector('.toast__timer-overlay') as HTMLElement | null;
      if (!overlay) {
        this.el.insertAdjacentHTML('afterbegin', this._renderOverlayTimerMarkup());
        overlay = this.el.querySelector('.toast__timer-overlay') as HTMLElement | null;
      }
      const fill = overlay?.querySelector('.toast__timer-overlay-fill') as HTMLElement | null;
      if (fill) this._animateTimerFill(fill, restart);
      return;
    }

    let timer = this.el.querySelector('.toast__timer') as HTMLElement | null;
    if (!timer) {
      this.el.insertAdjacentHTML('beforeend', this._renderBarTimerMarkup());
      timer = this.el.querySelector('.toast__timer') as HTMLElement | null;
    }
    const bar = timer?.querySelector('.toast__timer-bar') as HTMLElement | null;
    if (bar) this._animateTimerFill(bar, restart);
  }

  private _renderContent(titleId: string, descId: string): void {
    const o = this.options;

    if (o.customRenderer) {
      const ctx = this._createRenderContext();
      const rendered = o.customRenderer(ctx);
      this.el.replaceChildren();
      if (typeof rendered === 'string') {
        const wrapper = document.createElement('div');
        wrapper.className = 'toast__surface--custom';
        wrapper.textContent = rendered;
        this.el.appendChild(wrapper);
      } else {
        rendered.classList.add('toast__surface--custom');
        this.el.appendChild(rendered);
      }
      if (this._showsProgressBar()) {
        this._appendTimerMarkup();
      }
      return;
    }

    if (o.content instanceof HTMLElement) {
      this.el.replaceChildren();
      const wrapper = document.createElement('div');
      wrapper.className = 'toast__surface--custom';
      wrapper.appendChild(o.content);
      this.el.appendChild(wrapper);
      if (this._showsProgressBar()) {
        this._appendTimerMarkup();
      }
      return;
    }

    this.el.innerHTML = this._buildHTML(titleId, descId);
    if (this._usesK3uiIcon()) {
      IconManager.processIconsInContainer(this.el);
    }
  }

  private _buildHTML(titleId: string, descId: string): string {
    const o = this.options;
    const title = o.title?.trim();
    const desc = o.content && typeof o.content === 'string' ? o.content : o.description?.trim();
    const actionText = o.actionText?.trim();
    const showClose = Boolean(o.showClose);
    const closeLabel = LocaleManager.t('toast.close');
    const iconMarkup = this._renderIconMarkup();
    const footerParts: string[] = [];

    const escape = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    if (actionText) {
      footerParts.push(
        `<button class="toast__action" type="button" data-action="action">${escape(actionText)}</button>`
      );
    }
    if (showClose) {
      footerParts.push(
        `<button class="toast__close" type="button" data-action="close" aria-label="${escape(closeLabel)}"><i name="xmark" size="sm"></i></button>`
      );
    }

    const footerMarkup =
      footerParts.length > 0 ? `<div class="toast__footer">${footerParts.join('')}</div>` : '';

    const timerSuffix =
      this._showsProgressBar() && this._getTimerStyle() === 'bar' ? this._renderBarTimerMarkup() : '';
    const timerPrefix =
      this._showsProgressBar() && this._getTimerStyle() === 'overlay'
        ? this._renderOverlayTimerMarkup()
        : '';

    return `
      ${timerPrefix}
      <div class="toast__main">
        ${iconMarkup}
        <div class="toast__copy">
          <div class="toast__title" id="${titleId}">${title ? escape(title) : ''}</div>
          ${desc ? `<div class="toast__description" id="${descId}">${escape(desc)}</div>` : `<div class="toast__description" id="${descId}" hidden></div>`}
        </div>
        ${footerMarkup}
      </div>
      ${timerSuffix}
    `;
  }

  private _createRenderContext(): ToastRenderContext {
    const id = this.getId();
    return {
      id,
      visible: this.isOpen,
      dismiss: () => this.close(),
      update: (data) => Toast.update(id, data),
    };
  }

  private _applySurfaceStyle(): void {
    const style = this.options.style;
    if (!style) return;
    Object.entries(style).forEach(([key, value]) => {
      this.el.style.setProperty(key, value);
    });
  }

  private _applyVariantClasses(variant: ToastVariant): void {
    ToastSpecs.types.variants.forEach((v) => this.el.classList.remove(`toast--variant-${v}`));
    this.el.classList.add(`toast--variant-${variant}`);
    if (variant === 'loading') {
      this.el.classList.add('toast--loading');
    }
  }

  private _hasLeadingIcon(): boolean {
    return Boolean(this._getGlyphClass() || typeof this.options.icon === 'string');
  }

  private _getGlyphClass(): string | null {
    const o = this.options;
    if (o.showIcon === false) return null;
    if (typeof o.icon === 'string') return null;
    const variant = o.variant ?? ToastSpecs.types.variantDefault;
    if (variant === 'default') return null;
    return `toast__glyph--${variant}`;
  }

  private _renderIconMarkup(): string {
    const o = this.options;
    const escape = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    if (typeof o.icon === 'string') {
      return `<div class="toast__icon-wrap" aria-hidden="true"><i name="${escape(o.icon)}" size="md"></i></div>`;
    }

    const glyph = this._getGlyphClass();
    if (!glyph) return '';
    return `<div class="toast__icon-wrap" aria-hidden="true"><span class="toast__glyph ${glyph}" aria-hidden="true"></span></div>`;
  }

  private static _readOptionsFromElement(el: HTMLElement): Partial<ToastOptions> {
    const getAttr = (name: string): string | null => el.getAttribute(name) ?? el.getAttribute(`data-${name}`);
    const boolAttr = (name: string, fallback?: boolean): boolean | undefined => {
      const v = getAttr(name);
      if (v === null) return fallback;
      if (v === '' || v.toLowerCase() === 'true') return true;
      if (v.toLowerCase() === 'false') return false;
      return fallback;
    };
    const numAttr = (name: string): number | undefined => {
      const v = getAttr(name);
      if (v === null) return undefined;
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    };

    const variantAttr = getAttr('variant');
    const variant =
      variantAttr && isDatasetEnum(variantAttr, ToastSpecs.types.variants) ? variantAttr : undefined;
    const typeAttr = getAttr('type');
    const type =
      typeAttr && isDatasetEnum(typeAttr, ToastSpecs.types.priority) ? typeAttr : undefined;
    const hoverAttr = getAttr('hover');
    const hover =
      hoverAttr && isDatasetEnum(hoverAttr, ['pause', 'pause-all'] as const) ? hoverAttr : undefined;
    const positionAttr = getAttr('position');
    const position =
      positionAttr && isDatasetEnum(positionAttr, ToastSpecs.positions.available)
        ? positionAttr
        : undefined;
    const shapeAttr = getAttr('shape');
    const shape =
      shapeAttr && isDatasetEnum(shapeAttr, ['default', 'square', 'pill'] as const)
        ? shapeAttr
        : undefined;

    let inferredDescription = getAttr('description') ?? undefined;
    if (!inferredDescription) {
      const slotText = (el.textContent ?? '').trim();
      if (slotText.length > 0) inferredDescription = slotText;
    }

    return {
      title: getAttr('title') ?? undefined,
      description: inferredDescription,
      variant,
      type,
      hover,
      position,
      shape,
      icon: getAttr('icon') ?? undefined,
      showIcon: boolAttr('show-icon', undefined),
      showProgressBar: boolAttr('show-progress-bar', undefined),
      timerStyle:
        getAttr('timer-style') && isDatasetEnum(getAttr('timer-style')!, ['bar', 'overlay'] as const)
          ? (getAttr('timer-style') as ToastTimerStyle)
          : undefined,
      multiline: boolAttr('multiline', undefined),
      actionText: getAttr('action-text') ?? undefined,
      showClose: boolAttr('show-close', undefined),
      closeDelay: numAttr('close-delay'),
      duration: numAttr('duration'),
      classes: getAttr('classes') ?? undefined,
      className: getAttr('class-name') ?? getAttr('class') ?? undefined,
      showImmediately: boolAttr('show-immediately', undefined),
    };
  }

  private _setupEventListeners(): void {
    this.registerEvent(this.el, 'click', (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const button = target.closest('[data-action]') as HTMLButtonElement | null;
      if (!button) return;
      const action = button.getAttribute('data-action');
      if (action === 'action' && this.options.onAction) {
        this.options.onAction();
        this.close();
      } else if (action === 'close') {
        this.close();
      }
    });

    const handlePauseEnter = () => {
      if (!this._state) return;
      if (this._state.hover === 'pause') {
        this._pauseTimer();
      } else if (this._state.hover === 'pause-all') {
        Toast.pauseAll((this.options.position ?? ToastSpecs.positions.default) as ToastPosition);
      }
    };

    const handlePauseLeave = () => {
      if (!this._state) return;
      if (this._state.hover === 'pause') {
        this._restartTimer();
      } else if (this._state.hover === 'pause-all') {
        Toast.resumeAll((this.options.position ?? ToastSpecs.positions.default) as ToastPosition);
      }
    };

    this.registerEvent(this.el, 'pointerenter', (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      handlePauseEnter();
    });
    this.registerEvent(this.el, 'pointerleave', (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      handlePauseLeave();
    });
    this.registerEvent(this.el, 'mouseenter', handlePauseEnter);
    this.registerEvent(this.el, 'mouseleave', handlePauseLeave);

    this.registerEvent(this.el, 'keydown', (event: KeyboardEvent) => {
      if (event.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  /**
   * Temps restant avant fermeture (pattern solid-toast).
   * durationLeft = closeDelay + pauseDuration - (now - createdAt)
   */
  private _getDurationLeft(): number {
    if (!this._state) return 0;
    const { closeDelay, pauseDuration, createdAt } = this._state;
    if (closeDelay === 0 || closeDelay === Infinity || !Number.isFinite(closeDelay)) return 0;
    if (!this.isOpen || createdAt === 0) return closeDelay;

    const now = this._state.pausedAt ?? Date.now();
    return Math.max(0, closeDelay + pauseDuration - (now - createdAt));
  }

  private _clearAutoCloseTimer(): void {
    if (!this._state) return;
    if (this._state.timeout !== null) {
      window.clearTimeout(this._state.timeout);
      this._state.timeout = null;
    }
  }

  /** Met en pause la fermeture automatique (survol pile ou toast). */
  pauseAutoClose(): void {
    this._pauseTimer();
  }

  /** Reprend la fermeture automatique. */
  resumeAutoClose(): void {
    this._restartTimer();
  }

  private _pauseTimer(): void {
    if (!this._state) return;
    if (this._state.closeDelay === 0 || this._state.pausedAt !== undefined) return;

    this._clearAutoCloseTimer();
    this._state.pausedAt = Date.now();
    this.el.classList.add('toast--paused');
  }

  private _restartTimer(): void {
    if (!this._state) return;
    if (this._state.closeDelay === 0) return;
    if (this._state.pausedAt === undefined) return;

    const pauseInterval = Date.now() - this._state.pausedAt;
    this._state.pauseDuration += pauseInterval;
    this._state.pausedAt = undefined;
    this.el.classList.remove('toast--paused');
    this._scheduleAutoClose();
  }

  private _scheduleAutoClose(delay?: number): void {
    if (!this._state) return;
    if (typeof delay === 'number') {
      this._state.closeDelay = delay;
    }

    const d = this._state.closeDelay;
    if (d === 0 || d === Infinity || !Number.isFinite(d)) return;

    this._clearAutoCloseTimer();
    const durationLeft = this._getDurationLeft();
    if (durationLeft <= 0) {
      this.close();
      return;
    }
    this._state.timeout = window.setTimeout(() => this.close(), durationLeft);
  }

  /** Réinitialise le timer après une mise à jour (API promise). */
  _resetTimerForUpdate(delay: number): void {
    if (!this._state) return;
    this._state.createdAt = Date.now();
    this._state.pauseDuration = 0;
    this._state.pausedAt = undefined;
    this._state.closeDelay = delay;
    this._state.pausedAt = undefined;
    this.el.classList.remove('toast--paused');
    this.el.classList.toggle('toast--with-timer', this._showsProgressBar(delay));
    this._applyTimerStyleClasses(delay);

    if (delay > 0) {
      this._scheduleAutoClose();
      this._syncTimer(true);
    } else {
      this._clearAutoCloseTimer();
      this.el.classList.remove('toast--with-timer', 'toast--timer-bar', 'toast--timer-overlay');
      this._removeTimerElements();
    }
  }

  private _updateContent(data: ToastUpdatePayload & Partial<ToastOptions>): void {
    this.options = { ...this.options, ...data } as ToastOptions;

    if (this.options.customRenderer) {
      this._renderContent(generateId('toast-title'), generateId('toast-desc'));
      this._applySurfaceStyle();
      IconManager.processIconsInContainer(this.el);
      return;
    }

    const titleEl = this.el.querySelector('.toast__title') as HTMLElement | null;
    const descEl = this.el.querySelector('.toast__description') as HTMLElement | null;
    const actionBtn = this.el.querySelector('.toast__action') as HTMLButtonElement | null;

    if (titleEl) titleEl.textContent = this.options.title ?? '';
    if (descEl) descEl.textContent = this.options.description ?? '';

    if (actionBtn) {
      if (this.options.actionText) {
        actionBtn.textContent = this.options.actionText;
      } else {
        actionBtn.remove();
      }
    }

    if (data.variant) {
      this._applyVariantClasses(data.variant);
    }

    this.el.classList.toggle('toast--with-icon', this._hasLeadingIcon());

    const iconWrap = this.el.querySelector('.toast__icon-wrap');
    const nextIcon = this._renderIconMarkup();

    if (nextIcon) {
      if (iconWrap) {
        iconWrap.outerHTML = nextIcon;
      } else {
        this.el.insertAdjacentHTML('afterbegin', nextIcon);
      }
    } else if (iconWrap) {
      iconWrap.remove();
    }

    if (this._usesK3uiIcon()) {
      IconManager.processIconsInContainer(this.el);
    }
  }

  /**
   * Ouvre le toast avec animation d'entrée.
   */
  open(): void {
    if (this.isOpen) return;

    this.options.onOpenStart?.(this);

    this.isOpen = true;
    if (!this._state) return;

    // Le timer (auto-close + barre) démarre uniquement à l'affichage effectif
    this._state.createdAt = Date.now();
    this._state.pauseDuration = 0;
    this._state.pausedAt = undefined;
    this._clearAutoCloseTimer();

    if (!this._state.id) {
      this._state.id = this.el.id || generateId();
    }

    const position = (this.options.position ?? ToastSpecs.positions.default) as ToastPosition;
    this.el.dataset.position = position;
    this.el.classList.toggle('toast--position-top', position.startsWith('top'));
    this.el.classList.toggle('toast--position-bottom', position.startsWith('bottom'));

    void this.el.offsetHeight;
    this.el.classList.add('show');
    this.el.classList.remove('toast--paused');
    this._scheduleAutoClose();
    this._syncTimer(true);

    const enterDuration = prefersReducedMotion()
      ? 0
      : ToastSpecs.animations.enter.duration ?? 350;

    window.setTimeout(() => {
      this.options.onOpenEnd?.(this);
    }, enterDuration);
  }

  /**
   * Ferme le toast avec animation de sortie.
   * @param instant Retrait immédiat sans animation
   */
  close(instant = false): void {
    if (!this.isOpen && !instant) return;

    this.options.onCloseStart?.(this);

    this.isOpen = false;
    const state = this._state;
    const unmountDelay = instant || this._skipExitAnimation
      ? 0
      : (state?.unmountDelay ?? ToastSpecs.behaviors.unmountDelay);

    if (!instant && !this._skipExitAnimation) {
      this.el.classList.add('leaving');
    }
    this.el.classList.remove('show');

    if (state?.timeout !== null && state) {
      window.clearTimeout(state.timeout);
      state.timeout = null;
    }

    const position = (this.options.position ?? ToastSpecs.positions.default) as ToastPosition;

    window.setTimeout(() => {
      const id = this.getId();
      Toast._active.delete(id);
      ToastToasterManager.unregister(this, position);
      this.destroy();
      this.options.onCloseEnd?.(this);
    }, unmountDelay);
  }

  destroy(): void {
    const state = this._state;
    if (state?.timeout !== null && state) {
      window.clearTimeout(state.timeout);
    }

    if (!this._isProgrammatic) {
      Toast._instances.delete(this.el);
    }

    if (this.el.parentElement) {
      this.el.parentElement.removeChild(this.el);
    }
  }
}

/**
 * Crée l'API callable `K.toast` avec raccourcis solid-toast.
 * @returns Fonction toast enrichie
 */
export function createToastApi(): ToastCallable {
  const toastFn = ((input?: ToastInput, options?: Partial<ToastOptions>) =>
    Toast.show(normalizeToastInput(input, options))) as ToastCallable;

  toastFn.success = Toast.success.bind(Toast);
  toastFn.error = Toast.error.bind(Toast);
  toastFn.warning = Toast.warning.bind(Toast);
  toastFn.info = Toast.info.bind(Toast);
  toastFn.loading = Toast.loading.bind(Toast);
  toastFn.promise = Toast.promise.bind(Toast);
  toastFn.custom = Toast.custom.bind(Toast);
  toastFn.dismiss = Toast.dismiss.bind(Toast);
  toastFn.remove = Toast.remove.bind(Toast);
  toastFn.update = Toast.update.bind(Toast);
  toastFn.clear = Toast.clear.bind(Toast);

  return toastFn;
}

export default Toast;

/**
 * Web Component k3ui-toast
 */
if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-toast')) {
  customElements.define(
    'k3ui-toast',
    class K3uiToastElement extends HTMLElement {
      private toastInstance: Toast | null = null;

      connectedCallback(): void {
        if (this.toastInstance) return;
        this.classList.add('no-autoinit');
        this.toastInstance = Toast.init(this, {}) as Toast;
      }

      disconnectedCallback(): void {
        this.toastInstance?.destroy();
        this.toastInstance = null;
      }
    }
  );
}

