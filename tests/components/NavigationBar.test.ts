/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant NavigationBar
 */

import { NavigationBar } from '../../src/components/NavigationBar';

function createNavigationBar(): HTMLElement {
    const nav = document.createElement('nav');
    nav.className = 'navigation-bar';
    nav.setAttribute('data-active-index', '0');
    nav.innerHTML = `
      <button type="button" class="navigation-bar__item navigation-bar__item--active" data-destination="home">
        <div class="navigation-bar__icon">
          <div class="navigation-bar__pill"></div>
          <svg class="navigation-bar__icon-outlined"><path d="M10 19"/></svg>
          <svg class="navigation-bar__icon-filled"><path d="M10 19"/></svg>
        </div>
        <span class="navigation-bar__label">Accueil</span>
      </button>
      <button type="button" class="navigation-bar__item" data-destination="search">
        <div class="navigation-bar__icon">
          <div class="navigation-bar__pill"></div>
          <svg class="navigation-bar__icon-outlined"><path d="M15 14"/></svg>
          <svg class="navigation-bar__icon-filled"><path d="M15 14"/></svg>
        </div>
        <span class="navigation-bar__label">Rechercher</span>
      </button>
    `;
    return nav;
}

describe('NavigationBar', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    test('initialise et stocke l\'instance sur l\'élément', () => {
        const el = createNavigationBar();
        document.body.appendChild(el);
        const instance = new NavigationBar(el);

        expect(instance).toBeDefined();
        expect(NavigationBar.getInstance(el)).toBe(instance);
    });

    test('getInstance retourne l\'instance', () => {
        const el = createNavigationBar();
        document.body.appendChild(el);
        const instance = new NavigationBar(el);
        const found = NavigationBar.getInstance(el);

        expect(found).toBe(instance);
    });

    test('NavigationBar.defaults existe', () => {
        expect(NavigationBar.defaults).toBeDefined();
        expect(NavigationBar.defaults.activeIndex).toBe(0);
    });

    test('setActiveIndex met à jour l\'index actif', () => {
        const el = createNavigationBar();
        document.body.appendChild(el);
        const instance = new NavigationBar(el);

        expect(instance.getActiveIndex()).toBe(0);
        instance.setActiveIndex(1, false);
        expect(instance.getActiveIndex()).toBe(1);
        instance.setActiveIndex(0, false);
        expect(instance.getActiveIndex()).toBe(0);
    });

    test('getActiveIndex retourne l\'index actif', () => {
        const el = createNavigationBar();
        document.body.appendChild(el);
        const instance = new NavigationBar(el);

        expect(instance.getActiveIndex()).toBe(0);
        instance.setActiveIndex(1, false);
        expect(instance.getActiveIndex()).toBe(1);
    });

    test('destroy nettoie l\'instance', () => {
        const el = createNavigationBar();
        document.body.appendChild(el);
        const instance = new NavigationBar(el);

        expect(NavigationBar.getInstance(el)).toBe(instance);
        instance.destroy();
        expect(NavigationBar.getInstance(el)).toBeFalsy();
    });
});
