/**
 * @fileoverview Composant Pagination pour K3UI
 * @description Pagination numérique MD3 Expressive (boutons 1, 2, 3… avec ellipsis et nav first/prev/next/last)
 * @author
 * @version 1.0.0
 */

import { Component } from "../core/base/Component";
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import { PaginationOptions } from "../types/components";
import { PriorityLevel, InitElements } from "../types/base";
import { setAriaAttributes, removeAriaAttribute } from "../utils/dom/aria";
import { LoggerManager, LocaleManager, IconManager } from "../core/managers";
import { ManagerFactory } from "../core/factories";
import { getPaginationDefaults } from "../specs/components/pagination.specs";
import { HapticManager } from "../core/managers/HapticManager";

/**
 * Symbole d’ellipsis utilisé dans la pagination
 */
const DOTS = "…";

/**
 * Construit la liste des pages avec ellipsis
 * @param current Page courante (1-based)
 * @param total   Nombre total de pages
 * @param siblingCount Nombre de pages visibles de chaque côté
 */
function buildPages(current: number, total: number, siblingCount: number = 1): (number | string)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const leftSiblingIdx = Math.max(current - siblingCount, 1);
  const rightSiblingIdx = Math.min(current + siblingCount, total);

  const showLeftDots = leftSiblingIdx > 2;
  const showRightDots = rightSiblingIdx < total - 1;

  if (!showLeftDots && showRightDots) {
    const leftRange = Array.from({ length: 3 + 2 * siblingCount }, (_, i) => i + 1);
    return [...leftRange, DOTS, total];
  }

  if (showLeftDots && !showRightDots) {
    const rightRange = Array.from(
      { length: 3 + 2 * siblingCount },
      (_, i) => total - (3 + 2 * siblingCount) + i + 1
    );
    return [1, DOTS, ...rightRange];
  }

  const middleRange = Array.from(
    { length: rightSiblingIdx - leftSiblingIdx + 1 },
    (_, i) => leftSiblingIdx + i
  );
  return [1, DOTS, ...middleRange, DOTS, total];
}

const _defaults: PaginationOptions = getPaginationDefaults();

/**
 * Composant Pagination : pagination numérique MD3 Expressive
 */
export class Pagination extends Component<PaginationOptions> {
  readonly priority: PriorityLevel = PriorityLevel.MEDIUM;
  private logger: LoggerManager;

  private wrapperEl: HTMLElement | null = null;

  static get defaults(): PaginationOptions {
    return { ..._defaults };
  }

  static getInstance(el: HTMLElement): Pagination | undefined {
    return Component.getInstance(el) as Pagination | undefined;
  }

  static init(el: HTMLElement, options?: Partial<PaginationOptions>): Pagination;
  static init(els: InitElements<HTMLElement> | string, options?: Partial<PaginationOptions>): Pagination[];
  static init(
    els: HTMLElement | InitElements<HTMLElement> | string,
    options: Partial<PaginationOptions> = {}
  ): Pagination | Pagination[] {
    const elements: HTMLElement | InitElements<HTMLElement> =
      typeof els === "string" ? document.querySelectorAll<HTMLElement>(els) : els;

    return (super.init(
      elements,
      options,
      Pagination as ComponentType<Pagination, PaginationOptions>
    ) as unknown) as Pagination | Pagination[];
  }

  constructor(el: HTMLElement, options: Partial<PaginationOptions> = {}) {
    super(el, options, toComponentClassDef(Pagination));

    this.logger = ManagerFactory.getLoggerManager("[Pagination]");

    this.options = {
      ...Pagination.defaults,
      ...options,
    };

    if (el.tagName.toLowerCase() === "k3ui-pagination") {
      el.classList.add("pagination");
    }

    this.wrapperEl = null;

    this.init();
  }

  // ============================================================================
  // INIT & STRUCTURE
  // ============================================================================

  private init(): void {
    this.setupStructure();
    this.render();
    this.setupAccessibility();
    this.logger.info("Component initialized");
  }

  /**
   * Prépare le wrapper interne .pagination__inner
   */
  private setupStructure(): void {
    const existing = this.el.querySelector<HTMLElement>(".pagination__inner");
    if (existing) {
      this.wrapperEl = existing;
      return;
    }

    this.wrapperEl = document.createElement("div");
    this.wrapperEl.className = "pagination__inner";

    // On contrôle la structure : on vide le contenu direct
    this.el.innerHTML = "";
    this.el.appendChild(this.wrapperEl);
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  /**
   * Reconstruit la pagination complète
   */
  private render(): void {
    if (!this.wrapperEl) return;

    const { page, count, siblingCount, showFirst, showLast, showPrev, showNext, disabled } = this.options;
    const pages = buildPages(page, count, siblingCount);

    this.wrapperEl.innerHTML = "";

    const isFirst = page <= 1;
    const isLast = page >= count;

    const nav = document.createElement("nav");
    nav.className = "pagination__nav";
    nav.setAttribute("role", "navigation");
    nav.setAttribute("aria-label", LocaleManager.t("pagination.ariaNavLabel"));

    const ariaFirst = LocaleManager.t("pagination.ariaFirstPage");
    const ariaLast = LocaleManager.t("pagination.ariaLastPage");
    const ariaPrev = LocaleManager.t("pagination.ariaPrevious");
    const ariaNext = LocaleManager.t("pagination.ariaNext");
    const ariaPageBase = LocaleManager.t("pagination.ariaPage");

    const firstLabel = this.options.firstLabel ?? "angles-left";
    const prevLabel = this.options.prevLabel ?? "angle-left";
    const nextLabel = this.options.nextLabel ?? "angle-right";
    const lastLabel = this.options.lastLabel ?? "angles-right";

    // ── Bouton première page ──
    if (showFirst) {
      const btnFirst = this.createNavButton("pagination__first", firstLabel, disabled || isFirst);
      btnFirst.setAttribute("aria-label", ariaFirst);
      btnFirst.title = LocaleManager.t("pagination.firstPage");
      btnFirst.addEventListener("click", () => this.goTo(1));
      nav.appendChild(btnFirst);
    }

    // ── Bouton précédente ──
    if (showPrev) {
      const btnPrev = this.createNavButton("pagination__prev", prevLabel, disabled || isFirst);
      btnPrev.setAttribute("aria-label", ariaPrev);
      btnPrev.title = LocaleManager.t("pagination.previous");
      btnPrev.addEventListener("click", () => this.goTo(page - 1));
      nav.appendChild(btnPrev);
    }

    // ── Pages numériques + ellipsis ──
    pages.forEach((p) => {
      if (p === DOTS) {
        const span = document.createElement("span");
        span.className = "pagination__ellipsis";
        span.textContent = DOTS;
        span.setAttribute("aria-hidden", "true");
        nav.appendChild(span);
        return;
      }

      const num = p as number;
      const isCurrent = num === page;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pagination__page-btn";
      if (isCurrent) {
        btn.classList.add("pagination__page-btn--active");
        btn.setAttribute("aria-current", "page");
      }
      btn.textContent = String(num);
      btn.disabled = disabled;
      btn.setAttribute("aria-label", `${ariaPageBase} ${num}`);

      btn.addEventListener("click", () => this.goTo(num));

      nav.appendChild(btn);
    });

    // ── Bouton suivante ──
    if (showNext) {
      const btnNext = this.createNavButton("pagination__next", nextLabel, disabled || isLast);
      btnNext.setAttribute("aria-label", ariaNext);
      btnNext.title = LocaleManager.t("pagination.next");
      btnNext.addEventListener("click", () => this.goTo(page + 1));
      nav.appendChild(btnNext);
    }

    // ── Bouton dernière page ──
    if (showLast) {
      const btnLast = this.createNavButton("pagination__last", lastLabel, disabled || isLast);
      btnLast.setAttribute("aria-label", ariaLast);
      btnLast.title = LocaleManager.t("pagination.lastPage");
      btnLast.addEventListener("click", () => this.goTo(count));
      nav.appendChild(btnLast);
    }

    this.wrapperEl.appendChild(nav);

    if (typeof IconManager !== "undefined" && IconManager.processIconsInContainer) {
      IconManager.processIconsInContainer(this.wrapperEl);
    }
  }

  /**
   * Indique si le label doit être rendu comme une icône K3UI (nom en kebab-case contenant "-").
   */
  private static isIconName(label: string): boolean {
    return typeof label === "string" && label.indexOf("-") !== -1;
  }

  private createNavButton(className: string, label: string, isDisabled: boolean): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `pagination__nav-btn ${className}`;
    if (Pagination.isIconName(label)) {
      const icon = document.createElement("i");
      icon.setAttribute("name", label);
      icon.setAttribute("aria-hidden", "true");
      btn.appendChild(icon);
    } else {
      btn.textContent = label;
    }
    btn.disabled = isDisabled || this.options.disabled;
    return btn;
  }

  // ============================================================================
  // LOGIQUE
  // ============================================================================

  private goTo(target: number): void {
    const { disabled, count, page } = this.options;
    if (disabled) return;
    if (target < 1 || target > count || target === page) return;

    this.options.page = target;
    HapticManager.triggerFromOptions(this.options, 'selection');
    if (this.options.onChange) {
      this.options.onChange(target);
    }
    this.render();
  }

  /**
   * Met à jour les options et re-render
   */
  public updateOptions(newOptions: Partial<PaginationOptions>): void {
    this.options = { ...this.options, ...newOptions };
    this.render();
    this.setupAccessibility();
  }

  // ============================================================================
  // ACCESSIBILITÉ
  // ============================================================================

  private setupAccessibility(): void {
    setAriaAttributes(this.el, {
      role: "navigation",
      label: LocaleManager.t("pagination.ariaNavLabel"),
    });
  }

  // ============================================================================
  // DESTROY
  // ============================================================================

  public override destroy(): void {
    removeAriaAttribute(this.el, "role");
    removeAriaAttribute(this.el, "label");

    if (this.wrapperEl) {
      this.wrapperEl.innerHTML = "";
      this.wrapperEl = null;
    }

    this.logger.info("Component destroyed");
    super.destroy();
  }
}

/**
 * Enregistrement du Web Component k3ui-pagination
 */
if (typeof window !== "undefined" && typeof customElements !== "undefined" && !customElements.get("k3ui-pagination")) {
  customElements.define(
    "k3ui-pagination",
    class extends HTMLElement {
      connectedCallback(): void {
        if (!this.hasAttribute("data-initialized")) {
          this.setAttribute("data-initialized", "true");
        }
      }
    }
  );
}