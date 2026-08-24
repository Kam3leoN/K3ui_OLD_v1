/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant NavigationMenu
 * @description Régression — menu hiérarchique MD3 (M3E nav-menu)
 */

import { NavigationMenu } from '../../src/components/NavigationMenu';

function createFlatNavigationMenu(): HTMLElement {
    const nav = document.createElement('nav');
    nav.className = 'navigation-menu';
    nav.innerHTML = `
      <div class="navigation-menu__group">
        <div class="navigation-menu__group-label">Mail</div>
        <div class="navigation-menu__item" data-selected="true">
          <button type="button" class="navigation-menu__item-row">
            <span class="navigation-menu__item-icon"><i class="icon">mail</i></span>
            <span class="navigation-menu__item-label">Inbox</span>
            <span class="navigation-menu__item-badge">24</span>
          </button>
        </div>
        <div class="navigation-menu__item">
          <button type="button" class="navigation-menu__item-row">
            <span class="navigation-menu__item-icon"><i class="icon">send</i></span>
            <span class="navigation-menu__item-label">Outbox</span>
          </button>
        </div>
      </div>
    `;
    return nav;
}

function createNestedNavigationMenu(): HTMLElement {
    const nav = document.createElement('nav');
    nav.className = 'navigation-menu';
    nav.innerHTML = `
      <div class="navigation-menu__item navigation-menu__item--open" data-open="true">
        <button type="button" class="navigation-menu__item-row">
          <span class="navigation-menu__item-icon"><i class="icon">rocket_launch</i></span>
          <span class="navigation-menu__item-label">Getting Started</span>
          <span class="navigation-menu__item-toggle"><i class="icon">expand_more</i></span>
        </button>
        <div class="navigation-menu__item-children">
          <div class="navigation-menu__item">
            <button type="button" class="navigation-menu__item-row">
              <span class="navigation-menu__item-icon"><i class="icon">widgets</i></span>
              <span class="navigation-menu__item-label">Overview</span>
            </button>
          </div>
          <div class="navigation-menu__item">
            <button type="button" class="navigation-menu__item-row">
              <span class="navigation-menu__item-icon"><i class="icon">package_2</i></span>
              <span class="navigation-menu__item-label">Installation</span>
            </button>
          </div>
        </div>
      </div>
      <div class="navigation-menu__item">
        <button type="button" class="navigation-menu__item-row">
          <span class="navigation-menu__item-label">Actions</span>
          <span class="navigation-menu__item-toggle"><i class="icon">expand_more</i></span>
        </button>
        <div class="navigation-menu__item-children">
          <div class="navigation-menu__item">
            <button type="button" class="navigation-menu__item-row">
              <span class="navigation-menu__item-label">Button</span>
            </button>
          </div>
        </div>
      </div>
    `;
    return nav;
}

describe('NavigationMenu', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('initialise et stocke l\'instance sur l\'élément', () => {
        const el = createFlatNavigationMenu();
        document.body.appendChild(el);
        const instance = new NavigationMenu(el);

        expect(instance).toBeDefined();
        expect(NavigationMenu.getInstance(el)).toBe(instance);
    });

    test('getInstance retourne l\'instance', () => {
        const el = createFlatNavigationMenu();
        document.body.appendChild(el);
        const instance = new NavigationMenu(el);
        expect(NavigationMenu.getInstance(el)).toBe(instance);
    });

    test('NavigationMenu.defaults existe', () => {
        expect(NavigationMenu.defaults).toBeDefined();
        expect(NavigationMenu.defaults.priorityLevel).toBeDefined();
    });

    test('getId retourne un identifiant', () => {
        const el = createFlatNavigationMenu();
        document.body.appendChild(el);
        const instance = new NavigationMenu(el);
        expect(typeof instance.getId()).toBe('string');
        expect(instance.getId().length).toBeGreaterThan(0);
    });

    test('select met à jour l\'item sélectionné', () => {
        const el = createFlatNavigationMenu();
        document.body.appendChild(el);
        const instance = new NavigationMenu(el);
        const items = el.querySelectorAll('.navigation-menu__item');
        const outbox = items[1] as HTMLElement;

        instance.select(outbox);
        expect(instance.getSelectedItem()).toBe(outbox);
        expect(outbox.classList.contains('navigation-menu__item--selected')).toBe(true);
        expect(outbox.getAttribute('data-selected')).toBe('true');
    });

    test('toggle ouvre et ferme un item avec enfants', () => {
        const el = createNestedNavigationMenu();
        document.body.appendChild(el);
        const instance = new NavigationMenu(el);
        const actionsItem = Array.from(el.querySelectorAll('.navigation-menu__item'))
            .find((item) => item.querySelector('.navigation-menu__item-label')?.textContent?.trim() === 'Actions') as HTMLElement;

        expect(actionsItem.classList.contains('navigation-menu__item--open')).toBe(false);
        instance.toggle(actionsItem);
        expect(actionsItem.classList.contains('navigation-menu__item--open')).toBe(true);
        expect(actionsItem.getAttribute('data-open')).toBe('true');

        instance.toggle(actionsItem);
        expect(actionsItem.classList.contains('navigation-menu__item--open')).toBe(false);
        expect(actionsItem.getAttribute('data-open')).toBe('false');
    });

    test('expand ouvre un item parent', () => {
        const el = createNestedNavigationMenu();
        document.body.appendChild(el);
        const instance = new NavigationMenu(el);
        const actionsItem = Array.from(el.querySelectorAll('.navigation-menu__item'))
            .find((item) => item.querySelector('.navigation-menu__item-label')?.textContent?.trim() === 'Actions') as HTMLElement;

        instance.expand([actionsItem]);
        expect(actionsItem.classList.contains('navigation-menu__item--open')).toBe(true);
    });

    test('collapse ferme un item parent ouvert', () => {
        const el = createNestedNavigationMenu();
        document.body.appendChild(el);
        const instance = new NavigationMenu(el);
        const parentItem = el.querySelector('.navigation-menu__item--open') as HTMLElement;

        instance.collapse([parentItem]);
        expect(parentItem.classList.contains('navigation-menu__item--open')).toBe(false);
    });

    test('hasChildItems détecte les items avec enfants', () => {
        const el = createNestedNavigationMenu();
        document.body.appendChild(el);
        const instance = new NavigationMenu(el);
        const parentItem = el.querySelector('.navigation-menu__item--open') as HTMLElement;
        const leafItem = el.querySelector('.navigation-menu__item-children .navigation-menu__item') as HTMLElement;

        expect(instance.hasChildItems(parentItem)).toBe(true);
        expect(parentItem.classList.contains('navigation-menu__item--has-children')).toBe(true);
        expect(instance.hasChildItems(leafItem)).toBe(false);
    });

    test('aria-activedescendant est défini après initialisation', () => {
        const el = createFlatNavigationMenu();
        document.body.appendChild(el);
        new NavigationMenu(el);

        expect(el.getAttribute('aria-activedescendant')).toBeTruthy();
        expect(el.getAttribute('role')).toBe('tree');
    });

    test('clavier ArrowDown déplace l\'item actif', () => {
        const el = createFlatNavigationMenu();
        document.body.appendChild(el);
        new NavigationMenu(el);
        el.focus();

        const firstId = el.getAttribute('aria-activedescendant');
        el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
        const secondId = el.getAttribute('aria-activedescendant');

        expect(secondId).toBeTruthy();
        expect(secondId).not.toBe(firstId);
    });

    test('clavier Enter sélectionne un item feuille', () => {
        const el = createFlatNavigationMenu();
        document.body.appendChild(el);
        const instance = new NavigationMenu(el);
        const outbox = el.querySelectorAll('.navigation-menu__item')[1] as HTMLElement;

        instance.setActiveItem(outbox);
        el.focus();
        el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

        expect(instance.getSelectedItem()).toBe(outbox);
    });

    test('onChange est appelé lors de la sélection', () => {
        const el = createFlatNavigationMenu();
        document.body.appendChild(el);
        const onChange = jest.fn();
        const instance = new NavigationMenu(el, { onChange });
        const outbox = el.querySelectorAll('.navigation-menu__item')[1] as HTMLElement;

        instance.select(outbox);
        expect(onChange).toHaveBeenCalledWith(outbox, instance);
    });

    test('destroy nettoie l\'instance', () => {
        const el = createFlatNavigationMenu();
        document.body.appendChild(el);
        const instance = new NavigationMenu(el);

        expect(NavigationMenu.getInstance(el)).toBe(instance);
        instance.destroy();
        expect(NavigationMenu.getInstance(el)).toBeFalsy();
    });
});
