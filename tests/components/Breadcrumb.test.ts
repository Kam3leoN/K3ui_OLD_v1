/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant Breadcrumb
 */

import { Breadcrumb } from '../../src/components/Breadcrumb';

describe('Breadcrumb', () => {
  beforeEach(() => {
    document.body.innerHTML = '<nav class="breadcrumb" id="breadcrumb-root"></nav>';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('devrait créer une instance avec les options par défaut', () => {
    const el = document.getElementById('breadcrumb-root') as HTMLElement;
    const instance = new Breadcrumb(el, {});

    expect(instance).toBeDefined();
    expect(Breadcrumb.getInstance(el)).toBe(instance);
    expect(Breadcrumb.defaults).toBeDefined();
    expect(Breadcrumb.defaults.variant).toBe('plain');
    expect(Breadcrumb.defaults.separator).toBe('chevron');
    expect(Breadcrumb.defaults.items).toEqual([]);
  });

  it('devrait exposer getInstance', () => {
    const el = document.getElementById('breadcrumb-root') as HTMLElement;
    const instance = new Breadcrumb(el, {});

    expect(Breadcrumb.getInstance(el)).toBe(instance);
  });

  it('devrait rendre les items avec séparateurs', () => {
    const el = document.getElementById('breadcrumb-root') as HTMLElement;
    new Breadcrumb(el, {
      items: [
        { text: 'Accueil', href: '/' },
        { text: 'Page', current: true },
      ],
    });

    const list = el.querySelector('.breadcrumb__list');
    expect(list).toBeTruthy();
    const items = el.querySelectorAll('.breadcrumb__item');
    expect(items.length).toBeGreaterThanOrEqual(2);
    const links = el.querySelectorAll('.breadcrumb__link');
    expect(links.length).toBe(2);
    expect(el.querySelector('.breadcrumb__link--current')).toBeTruthy();
    expect(el.querySelectorAll('.breadcrumb__item--sep').length).toBeGreaterThanOrEqual(1);
  });

  it('devrait appliquer collapse après N items', () => {
    const el = document.getElementById('breadcrumb-root') as HTMLElement;
    new Breadcrumb(el, {
      items: [
        { text: 'A', href: '#' },
        { text: 'B', href: '#' },
        { text: 'C', href: '#' },
        { text: 'D', current: true },
      ],
      collapseAfter: 3,
    });

    expect(el.querySelector('.breadcrumb__item--ellipsis')).toBeTruthy();
    expect(el.querySelector('.breadcrumb__ellipsis')).toBeTruthy();
  });

  it('devrait mettre à jour avec updateOptions', () => {
    const el = document.getElementById('breadcrumb-root') as HTMLElement;
    const instance = new Breadcrumb(el, {
      items: [{ text: 'Accueil', href: '/' }],
    });

    instance.updateOptions({
      items: [
        { text: 'Accueil', href: '/' },
        { text: 'Nouvelle page', current: true },
      ],
    });

    const links = el.querySelectorAll('.breadcrumb__link');
    expect(links.length).toBe(2);
    expect(links[1].textContent).toContain('Nouvelle page');
    expect(el.querySelector('.breadcrumb__link--current')).toBeTruthy();
  });

  it('devrait détruire proprement', () => {
    const el = document.getElementById('breadcrumb-root') as HTMLElement;
    const instance = new Breadcrumb(el, { items: [{ text: 'A', current: true }] });

    instance.destroy();

    expect(Breadcrumb.getInstance(el)).toBeFalsy();
  });
});
