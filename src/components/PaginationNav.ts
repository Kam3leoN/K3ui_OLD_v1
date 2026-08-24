/**
 * @fileoverview Composant PaginationNav pour K3UI
 * @description Navigation entre pages (Précédent / Suivant) — surfaces tonales M3 Expressive
 * @author K3UI Team
 * @version 2.0.0
 */

import { Component } from "../core/base/Component";
import { ComponentType, toComponentClassDef } from "../types/components/component-base";
import { PaginationNavOptions } from "../types/components";
import { PriorityLevel, InitElements } from "../types/base";
import { setAriaAttributes, removeAriaAttribute } from "../utils/dom/aria";
import { LoggerManager, LocaleManager, IconManager } from "../core/managers";
import { ManagerFactory } from "../core/factories";
import { Mouse } from "../core/managers/MouseManager";
import { getPointerPressReleaseBindings } from "../utils/dom/pointer";
import { getPaginationNavDefaults } from "../specs/components/paginationnav.specs";

const _defaults: PaginationNavOptions = getPaginationNavDefaults();

/**
 * Composant PaginationNav : tuiles Précédent / Suivant (label + titre + icône)
 */
export class PaginationNav extends Component<PaginationNavOptions> {
  readonly priority: PriorityLevel = PriorityLevel.MEDIUM;
  private logger: LoggerManager;
  private previousElement: HTMLElement | null = null;
  private nextElement: HTMLElement | null = null;
  private previousElementCreatedByUs = false;
  private nextElementCreatedByUs = false;
  private mouseInstances: Mouse[] = [];

  static get defaults(): PaginationNavOptions {
    return { ..._defaults };
  }

  static getInstance(el: HTMLElement): PaginationNav | undefined {
    return Component.getInstance(el) as PaginationNav | undefined;
  }

  static init(el: HTMLElement, options?: Partial<PaginationNavOptions>): PaginationNav;
  static init(els: InitElements<HTMLElement> | string, options?: Partial<PaginationNavOptions>): PaginationNav[];
  static init(
    els: HTMLElement | InitElements<HTMLElement> | string,
    options: Partial<PaginationNavOptions> = {}
  ): PaginationNav | PaginationNav[] {
    const elements: HTMLElement | InitElements<HTMLElement> =
      typeof els === "string" ? document.querySelectorAll<HTMLElement>(els) : els;
    return super.init(
      elements,
      options,
      PaginationNav as ComponentType<PaginationNav, PaginationNavOptions>
    ) as PaginationNav | PaginationNav[];
  }

  constructor(el: HTMLElement, options: Partial<PaginationNavOptions> = {}) {
    super(el, options, toComponentClassDef(PaginationNav));
    this.logger = ManagerFactory.getLoggerManager("[PaginationNav]");
    this.options = { ...PaginationNav.defaults, ...options };
    this.init();
  }

  private init(): void {
    this.setupStructure();
    this.setupEventListeners();
    this.updateContent();
    this.setupAccessibility();
    this.logger.info("Component initialized");
  }

  private setupStructure(): void {
    this.previousElement = this.el.querySelector(".pagination-nav__previous") as HTMLElement;
    this.nextElement = this.el.querySelector(".pagination-nav__next") as HTMLElement;

    if (!this.previousElement && this.options.previous) {
      this.previousElement = this.createNavElement("previous");
      this.el.appendChild(this.previousElement);
      this.previousElementCreatedByUs = true;
    }

    if (!this.nextElement && this.options.next) {
      this.nextElement = this.createNavElement("next");
      this.el.appendChild(this.nextElement);
      this.nextElementCreatedByUs = true;
    }

    if (this.previousElement) {
      this.ensureNavItemStructure(this.previousElement, "previous");
    }
    if (this.nextElement) {
      this.ensureNavItemStructure(this.nextElement, "next");
    }
  }

  /**
   * Crée un lien previous/next avec surface, texte et icône
   */
  private createNavElement(type: "previous" | "next"): HTMLElement {
    const navEl = document.createElement("a");
    navEl.className = `pagination-nav__${type}`;
    navEl.href =
      type === "previous"
        ? this.options.previous?.url || "#"
        : this.options.next?.url || "#";

    const surface = document.createElement("div");
    surface.className = "pagination-nav__surface";

    const text = document.createElement("div");
    text.className = "pagination-nav__text";

    const labelEl = document.createElement("div");
    labelEl.className = "pagination-nav__label";
    labelEl.textContent =
      type === "previous"
        ? this.options.previous?.label || LocaleManager.t("paginationNav.previous")
        : this.options.next?.label || LocaleManager.t("paginationNav.next");

    const titleEl = document.createElement("div");
    titleEl.className = "pagination-nav__title";
    titleEl.textContent =
      type === "previous"
        ? this.options.previous?.title || ""
        : this.options.next?.title || "";

    text.appendChild(labelEl);
    text.appendChild(titleEl);

    const icon = this.createIconElement(type);

    if (type === "previous") {
      surface.appendChild(icon);
      surface.appendChild(text);
    } else {
      surface.appendChild(text);
      surface.appendChild(icon);
    }

    navEl.appendChild(surface);
    return navEl;
  }

  /**
   * Icône directionnelle M3 (arrow_back / arrow_forward)
   */
  private createIconElement(type: "previous" | "next"): HTMLElement {
    const wrap = document.createElement("span");
    wrap.className = "pagination-nav__icon";
    wrap.setAttribute("aria-hidden", "true");

    const icon = document.createElement("i");
    icon.className = "icon";
    icon.setAttribute("name", type === "previous" ? "arrow-left" : "arrow-right");
    wrap.appendChild(icon);

    try {
      IconManager.processIconsInContainer(wrap);
    } catch {
      // IconManager optionnel si assets absents
    }

    return wrap;
  }

  /**
   * Normalise le markup (surface + text + label + title + icon) sans encoche
   */
  private ensureNavItemStructure(navEl: HTMLElement, type: "previous" | "next"): void {
    // Retirer l’ancienne structure notch si présente
    navEl.classList.remove("notch", "notch--top-start", "notch--top-end");
    navEl.querySelectorAll(":scope > .notch__label-wrapper").forEach((node) => node.remove());

    let surface = navEl.querySelector(".pagination-nav__surface");
    if (!(surface instanceof HTMLElement)) {
      surface = document.createElement("div");
      surface.className = "pagination-nav__surface";

      const orphanTitle = navEl.querySelector(":scope > .pagination-nav__title");
      const orphanLabel = navEl.querySelector(":scope > .pagination-nav__label");
      if (orphanTitle) {
        surface.appendChild(orphanTitle);
      }
      if (orphanLabel) {
        surface.appendChild(orphanLabel);
      }
      navEl.appendChild(surface);
    }

    // Migrer label notch éventuel vers label standard
    const notchLabel = surface.querySelector(".notch__label, .notch__label-wrapper");
    if (notchLabel) {
      const text = notchLabel.textContent?.trim() || "";
      notchLabel.remove();
      let label = surface.querySelector(".pagination-nav__label");
      if (!(label instanceof HTMLElement) && text) {
        label = document.createElement("div");
        label.className = "pagination-nav__label";
        label.textContent = text;
        surface.prepend(label);
      }
    }

    let text = surface.querySelector(".pagination-nav__text");
    if (!(text instanceof HTMLElement)) {
      text = document.createElement("div");
      text.className = "pagination-nav__text";

      const label = surface.querySelector(".pagination-nav__label");
      const title = surface.querySelector(".pagination-nav__title");
      if (label) {
        text.appendChild(label);
      }
      if (title) {
        text.appendChild(title);
      }
      surface.appendChild(text);
    }

    if (!text.querySelector(".pagination-nav__label")) {
      const labelEl = document.createElement("div");
      labelEl.className = "pagination-nav__label";
      labelEl.textContent =
        type === "previous"
          ? LocaleManager.t("paginationNav.previous")
          : LocaleManager.t("paginationNav.next");
      text.prepend(labelEl);
    }

    if (!text.querySelector(".pagination-nav__title")) {
      const titleEl = document.createElement("div");
      titleEl.className = "pagination-nav__title";
      text.appendChild(titleEl);
    }

    let icon = surface.querySelector(".pagination-nav__icon");
    if (!(icon instanceof HTMLElement)) {
      icon = this.createIconElement(type);
    }

    const children = Array.from(surface.childNodes).filter(
      (n) => n.nodeType === Node.ELEMENT_NODE
    ) as HTMLElement[];
    const expectedOrder =
      type === "previous" ? [icon, text] : [text, icon];
    const needsReorder =
      children.length !== expectedOrder.length ||
      expectedOrder.some((el, i) => children[i] !== el);

    if (needsReorder) {
      expectedOrder.forEach((el) => surface.appendChild(el));
    }
  }

  private handlePreviousClick = (e: Event): void => {
    if (this.options.onPreviousClick) {
      e.preventDefault();
      this.options.onPreviousClick(e as MouseEvent, this);
    }
  };

  private handleNextClick = (e: Event): void => {
    if (this.options.onNextClick) {
      e.preventDefault();
      this.options.onNextClick(e as MouseEvent, this);
    }
  };

  private setupEventListeners(): void {
    if (this.previousElement) {
      this.registerEvent(this.previousElement, "click", this.handlePreviousClick);
      this.setupNavItemInteraction(this.previousElement);
    }
    if (this.nextElement) {
      this.registerEvent(this.nextElement, "click", this.handleNextClick);
      this.setupNavItemInteraction(this.nextElement);
    }
  }

  /**
   * Synchronise la hauteur réelle pour le rayon pressed (hauteur / 2)
   */
  private syncNavItemHeight(element: HTMLElement): void {
    const surface = element.querySelector(".pagination-nav__surface");
    const target = surface instanceof HTMLElement ? surface : element;
    target.style.setProperty("--paginationnav-item-height", `${target.offsetHeight}px`);
  }

  private clearNavItemPressedState(element: HTMLElement): void {
    element.classList.remove("pagination-nav--pressed", "pressing");
    const surface = element.querySelector(".pagination-nav__surface");
    if (surface instanceof HTMLElement) {
      surface.classList.remove("pagination-nav--pressed", "pressing");
    }
  }

  private setupNavItemInteraction(element: HTMLElement): void {
    this.syncNavItemHeight(element);
    this.registerEvent(window, "resize", () => this.syncNavItemHeight(element));

    const mouseInstance = new Mouse({
      target: element,
      onMouseEnter: () => element.classList.add("pagination-nav--hovered"),
      onMouseLeave: () => {
        element.classList.remove("pagination-nav--hovered");
        this.clearNavItemPressedState(element);
      },
    });
    this.mouseInstances.push(mouseInstance);

    getPointerPressReleaseBindings(element, {
      onPress: () => {
        this.syncNavItemHeight(element);
        element.classList.add("pagination-nav--pressed", "pressing");
        const surface = element.querySelector(".pagination-nav__surface");
        if (surface instanceof HTMLElement) {
          surface.classList.add("pagination-nav--pressed", "pressing");
        }
      },
      onRelease: () => {
        this.clearNavItemPressedState(element);
      },
      onDocumentRelease: () => {
        if (element.classList.contains("pressing")) {
          this.clearNavItemPressedState(element);
        }
      },
    }).forEach((binding) => {
      this.registerEvent(binding.target, binding.type, binding.handler, binding.options);
    });
  }

  private updateContent(): void {
    if (this.previousElement) {
      this.syncNavItemContent(this.previousElement, "previous");
    }
    if (this.nextElement) {
      this.syncNavItemContent(this.nextElement, "next");
    }
  }

  /**
   * Met à jour label, titre et URL d’un item
   */
  private syncNavItemContent(navEl: HTMLElement, type: "previous" | "next"): void {
    const options = type === "previous" ? this.options.previous : this.options.next;
    const createdByUs =
      type === "previous" ? this.previousElementCreatedByUs : this.nextElementCreatedByUs;
    const defaultLabel =
      type === "previous"
        ? LocaleManager.t("paginationNav.previous")
        : LocaleManager.t("paginationNav.next");

    const labelEl = navEl.querySelector(".pagination-nav__label");
    const titleEl = navEl.querySelector(".pagination-nav__title");

    if (options) {
      if (labelEl) {
        labelEl.textContent = options.label ?? defaultLabel;
      }
      if (titleEl) {
        titleEl.textContent = options.title || "";
      }
      if (options.url) {
        (navEl as HTMLAnchorElement).href = options.url;
      }
    } else if (!createdByUs) {
      if (labelEl && !labelEl.textContent?.trim()) {
        labelEl.textContent = defaultLabel;
      }
    }

    if (createdByUs && !options) {
      navEl.style.display = "none";
    } else if (createdByUs) {
      navEl.style.display = "";
    }
  }

  private setupAccessibility(): void {
    setAriaAttributes(this.el, {
      role: "navigation",
      label: LocaleManager.t("paginationNav.ariaNavLabel"),
    });
    if (this.previousElement) {
      const prevTitle = this.options.previous?.title ?? "";
      setAriaAttributes(this.previousElement, {
        label: prevTitle
          ? `${LocaleManager.t("paginationNav.ariaPrevious")}: ${prevTitle}`
          : LocaleManager.t("paginationNav.ariaPrevious"),
      });
    }
    if (this.nextElement) {
      const nextTitle = this.options.next?.title ?? "";
      setAriaAttributes(this.nextElement, {
        label: nextTitle
          ? `${LocaleManager.t("paginationNav.ariaNext")}: ${nextTitle}`
          : LocaleManager.t("paginationNav.ariaNext"),
      });
    }
  }

  /**
   * Met à jour les options du composant
   */
  public updateOptions(newOptions: Partial<PaginationNavOptions>): void {
    this.options = { ...this.options, ...newOptions };
    this.updateContent();
    this.setupAccessibility();
  }

  public override destroy(): void {
    removeAriaAttribute(this.el, "role");
    removeAriaAttribute(this.el, "label");
    if (this.previousElement) {
      removeAriaAttribute(this.previousElement, "label");
      this.previousElement.classList.remove("pagination-nav--hovered", "pagination-nav--pressed", "pressing");
    }
    if (this.nextElement) {
      removeAriaAttribute(this.nextElement, "label");
      this.nextElement.classList.remove("pagination-nav--hovered", "pagination-nav--pressed", "pressing");
    }
    this.mouseInstances.forEach((instance) => instance.destroy());
    this.mouseInstances = [];
    this.previousElement = null;
    this.nextElement = null;
    this.logger.info("Component destroyed");
    super.destroy();
  }
}

if (typeof window !== "undefined" && typeof customElements !== "undefined" && !customElements.get("k3ui-pagination-nav")) {
  customElements.define(
    "k3ui-pagination-nav",
    class extends HTMLElement {
      connectedCallback(): void {
        if (!this.hasAttribute("data-initialized")) this.setAttribute("data-initialized", "true");
      }

      disconnectedCallback(): void {
        const instance = PaginationNav.getInstance(this);
        if (instance && typeof instance.destroy === "function") {
          instance.destroy();
        }
      }
    }
  );
}
