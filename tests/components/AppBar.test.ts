/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant AppBar
 */

import { AppBar } from '../../src/components/AppBar';

function createAppBar(attributes: Record<string, string> = {}): HTMLElement {
  const el = document.createElement('k3ui-appbar');
  el.className = 'appbar';
  Object.entries(attributes).forEach(([key, value]) => {
    el.setAttribute(key, value);
  });
  el.innerHTML = `
    <div class="appbar__content">
      <div class="appbar__navigation"></div>
      <div class="appbar__title-section">
        <h1 class="appbar__title">Title</h1>
      </div>
      <div class="appbar__actions"></div>
    </div>
  `;
  return el;
}

describe('AppBar', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    Object.defineProperty(window, 'scrollY', {
      value: 0,
      writable: true,
      configurable: true,
    });
  });

  test('initialise et stocke l\'instance sur l\'élément', () => {
    const el = createAppBar();
    document.body.appendChild(el);
    const instance = new AppBar(el);

    expect(instance).toBeDefined();
    expect(AppBar.getInstance(el)).toBe(instance);
  });

  test('AppBar.defaults existe et fournit une configuration cohérente', () => {
    const defaults = AppBar.defaults;
    expect(defaults.variant).toBe('small');
    expect(defaults.height).toBe('medium');
    expect(defaults.fixed).toBe(false);
    expect(defaults.collapseDistance).toBe(112);
  });

  test('getInstance retourne l\'instance', () => {
    const el = createAppBar();
    document.body.appendChild(el);
    const instance = new AppBar(el);

    const found = AppBar.getInstance(el);
    expect(found).toBe(instance);
  });

  test('lit les attributs HTML M3 (variant, height, fixed, collapse-distance)', () => {
    const el = createAppBar({
      variant: 'large',
      height: 'large',
      fixed: 'true',
      'collapse-distance': '200',
    });
    document.body.appendChild(el);
    const instance = new AppBar(el);

    expect(instance.options.variant).toBe('large');
    expect(instance.options.height).toBe('large');
    expect(instance.options.fixed).toBe(true);
    expect(instance.options.collapseDistance).toBe(200);
  });

  test('ajoute appbar--scrolled au scroll (lift automatique)', () => {
    const el = createAppBar();
    document.body.appendChild(el);
    new AppBar(el);

    Object.defineProperty(window, 'scrollY', { value: 10, configurable: true });
    window.dispatchEvent(new Event('scroll'));

    expect(el.classList.contains('appbar--scrolled')).toBe(true);
  });

  test('met à jour --appbar-scroll-ratio en variant medium (collapse automatique)', () => {
    const el = createAppBar({ variant: 'medium' });
    document.body.appendChild(el);
    const instance = new AppBar(el);

    instance.options.collapseDistance = 100;

    Object.defineProperty(window, 'scrollY', { value: 50, configurable: true });
    window.dispatchEvent(new Event('scroll'));

    const ratio = instance.options.scrollRatio;
    expect(ratio).toBeGreaterThan(0.45);
    expect(ratio).toBeLessThan(0.55);
    expect(el.style.getPropertyValue('--appbar-scroll-ratio')).not.toBe('');
    expect(el.classList.contains('appbar--scrolled')).toBe(true);
    expect(el.classList.contains('appbar--collapsible')).toBe(true);
  });

  test('AppBar.create produit un k3ui-appbar initialisé', () => {
    const el = AppBar.create({ variant: 'small' });
    expect(el.tagName.toLowerCase()).toBe('k3ui-appbar');
    expect(AppBar.getInstance(el)).toBeDefined();
    expect(el.classList.contains('appbar--small')).toBe(true);
    expect(el.classList.contains('appbar--top')).toBe(true);
  });

  test('updateOptions met à jour les classes de variante', () => {
    const el = createAppBar();
    document.body.appendChild(el);
    const instance = new AppBar(el);

    instance.updateOptions({ variant: 'center' });

    expect(el.classList.contains('appbar--center')).toBe(true);
    expect(el.classList.contains('appbar--top')).toBe(true);
  });

  test('destroy nettoie l\'instance et les écouteurs de scroll', () => {
    const el = createAppBar();
    document.body.appendChild(el);
    const instance = new AppBar(el);

    instance.destroy();

    expect(AppBar.getInstance(el)).toBeFalsy();
  });

  test('variante search : définit aria-label sur le champ si aucun nom accessible', () => {
    const el = document.createElement('k3ui-appbar');
    el.setAttribute('variant', 'search');
    el.innerHTML = `
      <div class="appbar__content">
        <div class="appbar__search-field">
          <input type="search" placeholder="Rechercher" />
        </div>
      </div>
    `;
    document.body.appendChild(el);
    new AppBar(el);

    const input = el.querySelector('input')!;
    expect(input.getAttribute('aria-label')).toBe('Rechercher');
  });

  test('variante search : ne remplace pas aria-label existant sur le champ', () => {
    const el = document.createElement('k3ui-appbar');
    el.setAttribute('variant', 'search');
    el.innerHTML = `
      <div class="appbar__content">
        <div class="appbar__search-field">
          <input type="search" aria-label="Recherche globale" />
        </div>
      </div>
    `;
    document.body.appendChild(el);
    new AppBar(el);

    const input = el.querySelector('input')!;
    expect(input.getAttribute('aria-label')).toBe('Recherche globale');
  });
});
