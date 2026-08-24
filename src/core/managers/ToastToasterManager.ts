/**
 * @fileoverview Gestionnaire de viewport Toast (style solid-toast)
 * @description Conteneur fixe par position, liste verticale avec gutter — sans pile repliée
 * @see https://www.solid-toast.com/
 * @author K3UI Team
 * @version 3.0.0
 */

import type { ToastPosition } from '../../types/components';
import { ToastSpecs } from '../../specs/components/toast.specs';

/** Toast minimal enregistré dans le toaster */
export interface ToastToasterItem {
  el: HTMLElement;
  getId(): string;
}

export interface ToastToasterManagerOptions {
  gutter?: number;
}

type ToasterEntry = {
  container: HTMLElement;
  items: ToastToasterItem[];
};

/**
 * Gère les conteneurs `.toast-toaster` par position (équivalent &lt;Toaster /&gt; solid-toast).
 */
export class ToastToasterManager {
  private static _toasters: Map<ToastPosition, ToasterEntry> = new Map();
  private static _gutter = ToastSpecs.behaviors.gutter;

  /**
   * Met à jour les options globales du toaster.
   * @param options Options partielles
   */
  static configure(options: Partial<ToastToasterManagerOptions>): void {
    if (typeof options.gutter === 'number') {
      this._gutter = options.gutter;
      for (const [, entry] of this._toasters) {
        entry.container.style.setProperty('--k3ui-toast-gutter', `${this._gutter}px`);
      }
    }
  }

  /**
   * Obtient ou crée le conteneur pour une position donnée.
   * @param position Position du toaster
   * @returns Élément `.toast-toaster`
   */
  static ensureContainer(position?: ToastPosition): HTMLElement {
    const pos = (position ?? ToastSpecs.positions.default) as ToastPosition;
    let entry = this._toasters.get(pos);

    if (!entry) {
      const container = document.createElement('div');
      container.className = 'toast-toaster';
      container.dataset.position = pos;
      container.style.setProperty('--k3ui-toast-gutter', `${this._gutter}px`);
      container.setAttribute('aria-live', ToastSpecs.accessibility.ariaLive);
      container.setAttribute('aria-relevant', 'additions text');
      document.body.appendChild(container);
      entry = { container, items: [] };
      this._toasters.set(pos, entry);
    }

    return entry.container;
  }

  /**
   * Ajoute un toast au toaster (affichage immédiat).
   * @param item Instance toast
   * @param position Position cible
   */
  static register(item: ToastToasterItem, position?: ToastPosition): void {
    const pos = (position ?? ToastSpecs.positions.default) as ToastPosition;
    const entry = this._ensureEntry(pos);

    if (entry.items.includes(item)) return;

    if (item.el.parentElement !== entry.container) {
      entry.container.appendChild(item.el);
    }

    entry.items.push(item);
  }

  /**
   * Retire un toast du toaster.
   * @param item Instance toast
   * @param position Position du toaster
   */
  static unregister(item: ToastToasterItem, position?: ToastPosition): void {
    const pos = (position ?? ToastSpecs.positions.default) as ToastPosition;
    const entry = this._toasters.get(pos);
    if (!entry) return;

    entry.items = entry.items.filter((t) => t !== item);

    if (item.el.parentElement) {
      item.el.parentElement.removeChild(item.el);
    }

    if (entry.items.length === 0) {
      if (entry.container.parentElement) {
        entry.container.parentElement.removeChild(entry.container);
      }
      this._toasters.delete(pos);
    }
  }

  /**
   * Retourne les toasts d'une position (plus récent en premier).
   * @param position Position du toaster
   */
  static getToastsNewestFirst(position?: ToastPosition): ToastToasterItem[] {
    const pos = (position ?? ToastSpecs.positions.default) as ToastPosition;
    const entry = this._toasters.get(pos);
    if (!entry) return [];
    return [...entry.items].reverse();
  }

  /**
   * Retourne tous les toasts actifs (toutes positions), plus récent en premier.
   */
  static getAllNewestFirst(): ToastToasterItem[] {
    const result: ToastToasterItem[] = [];
    for (const [, entry] of this._toasters) {
      result.push(...[...entry.items].reverse());
    }
    return result;
  }

  /**
   * Vide tous les toasters (tests).
   */
  static resetAll(): void {
    for (const [, entry] of this._toasters) {
      entry.items = [];
      if (entry.container.parentElement) {
        entry.container.parentElement.removeChild(entry.container);
      }
    }
    this._toasters.clear();
  }

  private static _ensureEntry(position: ToastPosition): ToasterEntry {
    ToastToasterManager.ensureContainer(position);
    return ToastToasterManager._toasters.get(position)!;
  }
}
