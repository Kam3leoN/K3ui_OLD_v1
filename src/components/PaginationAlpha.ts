/**
 * @fileoverview Composant PaginationAlpha pour K3UI
 * @description Index alphabétique A–Z MD3 Expressive (navigation par lettre, comptages optionnels)
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from "../core/base/Component";
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import type { PaginationAlphaOptions } from "../types/components";
import { PriorityLevel, InitElements } from "../types/base";
import { setAriaAttributes, removeAriaAttribute } from "../utils/dom/aria";
import { LoggerManager, LocaleManager } from "../core/managers";
import { ManagerFactory } from "../core/factories";
import { getPaginationAlphaDefaults, PaginationAlphaSpecs } from "../specs/components/pagination-alpha.specs";

const ALPHABET = PaginationAlphaSpecs.alphabet;
const _defaults: PaginationAlphaOptions = getPaginationAlphaDefaults();

/**
 * Construit la map lettre → nombre d'éléments (premier caractère en majuscule)
 */
function buildLetterMap(items: string[]): Record<string, number> {
  const m: Record<string, number> = {};
  ALPHABET.forEach((l) => {
    m[l] = 0;
  });
  items.forEach((i) => {
    const first = i.trim().charAt(0).toUpperCase();
    if (ALPHABET.includes(first)) {
      m[first]++;
    }
  });
  return m;
}

/**
 * Composant PaginationAlpha : index alphabétique A–Z (MD3 Expressive)
 */
export class PaginationAlpha extends Component<PaginationAlphaOptions> {
  readonly priority: PriorityLevel = PriorityLevel.MEDIUM;
  private logger: LoggerManager;
  private navEl: HTMLElement | null = null;

  static get defaults(): PaginationAlphaOptions {
    return { ..._defaults };
  }

  static getInstance(el: HTMLElement): PaginationAlpha | undefined {
    return Component.getInstance(el) as PaginationAlpha | undefined;
  }

  static init(el: HTMLElement, options?: Partial<PaginationAlphaOptions>): PaginationAlpha;
  static init(
    els: InitElements<HTMLElement> | string,
    options?: Partial<PaginationAlphaOptions>
  ): PaginationAlpha[];
  static init(
    els: HTMLElement | InitElements<HTMLElement> | string,
    options: Partial<PaginationAlphaOptions> = {}
  ): PaginationAlpha | PaginationAlpha[] {
    const elements: HTMLElement | InitElements<HTMLElement> =
      typeof els === "string" ? document.querySelectorAll<HTMLElement>(els) : els;
    return super.init(
      elements,
      options,
      PaginationAlpha as ComponentType<PaginationAlpha, PaginationAlphaOptions>
    ) as PaginationAlpha | PaginationAlpha[];
  }

  constructor(el: HTMLElement, options: Partial<PaginationAlphaOptions> = {}) {
    super(el, options, toComponentClassDef(PaginationAlpha));

    this.logger = ManagerFactory.getLoggerManager("[PaginationAlpha]");

    const fromData = this.readOptionsFromElement(el);
    this.options = {
      ...PaginationAlpha.defaults,
      ...fromData,
      ...options,
    };

    if (el.tagName.toLowerCase() === "k3ui-pagination-alpha") {
      el.classList.add("pagination-alpha");
    }

    this.init();
  }

  /**
   * Lit les options depuis les attributs data-* de l'élément
   */
  private readOptionsFromElement(el: HTMLElement): Partial<PaginationAlphaOptions> {
    const out: Partial<PaginationAlphaOptions> = {};
    const dataItems = el.getAttribute("data-items");
    if (dataItems) {
      try {
        const parsed = JSON.parse(dataItems) as string[];
        if (Array.isArray(parsed)) {
          out.items = parsed;
        }
      } catch {
        this.logger.warn("data-items invalide (JSON attendu)");
      }
    }
    const dataActive = el.getAttribute("data-active-letter");
    if (dataActive && dataActive.length === 1) {
      out.activeLetter = dataActive.toUpperCase();
    }
    const dataSize = el.getAttribute("data-size") as PaginationAlphaOptions["size"] | null;
    if (dataSize === "sm" || dataSize === "md" || dataSize === "lg") {
      out.size = dataSize;
    }
    const dataOrientation = el.getAttribute("data-orientation") as PaginationAlphaOptions["orientation"] | null;
    if (dataOrientation === "horizontal" || dataOrientation === "vertical") {
      out.orientation = dataOrientation;
    }
    if (el.hasAttribute("data-show-count")) {
      out.showCount = el.getAttribute("data-show-count") !== "false";
    }
    if (el.hasAttribute("data-show-disabled")) {
      out.showDisabled = el.getAttribute("data-show-disabled") !== "false";
    }
    if (el.hasAttribute("data-animated")) {
      out.animated = el.getAttribute("data-animated") !== "false";
    }
    const dataColor = el.getAttribute("data-color-scheme") as PaginationAlphaOptions["colorScheme"] | null;
    if (dataColor === "primary" || dataColor === "secondary" || dataColor === "neutral") {
      out.colorScheme = dataColor;
    }
    const dataDensity = el.getAttribute("data-density") as PaginationAlphaOptions["density"] | null;
    if (dataDensity === "compact" || dataDensity === "normal" || dataDensity === "spacious") {
      out.density = dataDensity;
    }
    return out;
  }

  private init(): void {
    this.setupStructure();
    this.render();
    this.setupAccessibility();
    this.logger.info("Component initialized");
  }

  private setupStructure(): void {
    let nav = this.el.querySelector<HTMLElement>(".pagination-alpha__nav");
    if (nav) {
      this.navEl = nav;
      return;
    }
    this.el.innerHTML = "";
    this.navEl = document.createElement("nav");
    this.navEl.className = "pagination-alpha__nav";
    this.el.appendChild(this.navEl);
  }

  private render(): void {
    const nav = this.navEl;
    if (!nav) return;

    const { items, activeLetter, size, orientation, showCount, showDisabled, animated, colorScheme, density } =
      this.options;
    const letterMap = buildLetterMap(items);

    this.el.className = "pagination-alpha";
    this.el.classList.add(`pagination-alpha--${size}`);
    this.el.classList.add(`pagination-alpha--${orientation}`);
    this.el.classList.add(`pagination-alpha--${colorScheme}`);
    this.el.classList.add(`pagination-alpha--${density}`);
    if (animated) {
      this.el.classList.add("pagination-alpha--animated");
    } else {
      this.el.classList.remove("pagination-alpha--animated");
    }
    if (showCount) {
      this.el.classList.add("pagination-alpha--show-count");
    } else {
      this.el.classList.remove("pagination-alpha--show-count");
    }

    nav.innerHTML = "";
    nav.setAttribute("aria-label", LocaleManager.t("paginationAlpha.ariaLabel"));

    const entryOne = LocaleManager.t("paginationAlpha.entryOne");
    const entryMany = LocaleManager.t("paginationAlpha.entryMany");

    ALPHABET.forEach((letter) => {
      const count = letterMap[letter] ?? 0;
      const disabled = count === 0;
      if (!showDisabled && disabled) return;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pagination-alpha__letter-btn";
      btn.setAttribute("data-letter", letter);
      if (letter === activeLetter) {
        btn.classList.add("pagination-alpha__letter-btn--active");
        btn.setAttribute("aria-current", "true");
      }
      if (disabled) {
        btn.disabled = true;
        btn.setAttribute("aria-disabled", "true");
      }

      const label = count === 0 ? `${letter} — 0` : `${letter} — ${count} ${count === 1 ? entryOne : entryMany}`;
      btn.setAttribute("title", label);
      btn.setAttribute("aria-label", label);

      const letterSpan = document.createElement("span");
      letterSpan.className = "pagination-alpha__letter";
      letterSpan.textContent = letter;
      btn.appendChild(letterSpan);

      if (showCount) {
        const countSpan = document.createElement("span");
        countSpan.className = "pagination-alpha__count";
        countSpan.textContent = count > 0 ? (count > 9999 ? "9999+" : String(count)) : "0";
        countSpan.setAttribute("aria-hidden", "true");
        btn.appendChild(countSpan);
      }

      if (!disabled) {
        btn.addEventListener("click", () => this.handleSelect(letter));
      }

      nav.appendChild(btn);
    });
  }

  private handleSelect(letter: string): void {
    this.options.activeLetter = letter;
    if (this.options.onSelect) {
      this.options.onSelect(letter);
    }
    this.render();
  }

  /**
   * Met à jour les options et re-rend le composant
   */
  public updateOptions(newOptions: Partial<PaginationAlphaOptions>): void {
    this.options = { ...this.options, ...newOptions };
    this.render();
    this.setupAccessibility();
  }

  private setupAccessibility(): void {
    setAriaAttributes(this.el, {
      role: "navigation",
      label: LocaleManager.t("paginationAlpha.ariaLabel"),
    });
  }

  public override destroy(): void {
    removeAriaAttribute(this.el, "role");
    removeAriaAttribute(this.el, "label");

    if (this.navEl) {
      this.navEl.innerHTML = "";
      this.navEl = null;
    }

    this.logger.info("Component destroyed");
    super.destroy();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "k3ui-pagination-alpha": HTMLElement;
  }
}

if (typeof window !== "undefined" && typeof customElements !== "undefined" && !customElements.get("k3ui-pagination-alpha")) {
  customElements.define(
    "k3ui-pagination-alpha",
    class extends HTMLElement {
      connectedCallback(): void {
        if (!this.classList.contains("pagination-alpha")) {
          this.classList.add("pagination-alpha");
        }
      }
    }
  );
}
