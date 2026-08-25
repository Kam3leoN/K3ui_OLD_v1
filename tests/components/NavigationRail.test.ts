/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant NavigationRail
 */

import { NavigationRail } from '../../src/components/NavigationRail';
import { NavigationRailSpecs } from '../../src/specs/components/navigation-rail.specs';

function createNavigationRail(): HTMLElement {
    const nav = document.createElement('nav');
    nav.className = 'navigation-rail';
    nav.setAttribute('data-active-index', '0');
    nav.setAttribute('data-expanded', 'false');
    nav.innerHTML = `
      <button type="button" class="navigation-rail__toggle" aria-label="Toggle"></button>
      <div class="navigation-rail__items">
        <button type="button" class="navigation-rail__item navigation-rail__item--active" data-destination="home">
          <div class="navigation-rail__icon">
            <div class="navigation-rail__pill"></div>
            <span class="navigation-rail__icon-classic">⌂</span>
          </div>
          <span class="navigation-rail__label">Accueil</span>
        </button>
        <button type="button" class="navigation-rail__item" data-destination="explore">
          <div class="navigation-rail__icon">
            <div class="navigation-rail__pill"></div>
            <span class="navigation-rail__icon-classic">◉</span>
          </div>
          <span class="navigation-rail__label">Explorer</span>
        </button>
      </div>
    `;
    return nav;
}

function createNavigationRailWithFooter(footerItemCount = 2): HTMLElement {
    const nav = createNavigationRail();
    const footer = document.createElement('div');
    footer.className = 'navigation-rail__footer';
    for (let i = 0; i < footerItemCount; i += 1) {
        const id = i === 0 ? 'settings' : i === 1 ? 'help' : `extra-${i}`;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'navigation-rail__item';
        btn.setAttribute('data-destination', id);
        btn.innerHTML = `
          <div class="navigation-rail__icon">
            <div class="navigation-rail__pill"></div>
            <span class="navigation-rail__icon-classic">•</span>
          </div>
          <span class="navigation-rail__label">${id}</span>
        `;
        footer.appendChild(btn);
    }
    nav.appendChild(footer);
    return nav;
}

describe('NavigationRail', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    test('initialise et stocke l\'instance sur l\'élément', () => {
        const el = createNavigationRail();
        document.body.appendChild(el);
        const instance = new NavigationRail(el);

        expect(instance).toBeDefined();
        expect(NavigationRail.getInstance(el)).toBe(instance);
    });

    test('getInstance retourne l\'instance', () => {
        const el = createNavigationRail();
        document.body.appendChild(el);
        const instance = new NavigationRail(el);
        const found = NavigationRail.getInstance(el);

        expect(found).toBe(instance);
    });

    test('NavigationRail.defaults existe', () => {
        expect(NavigationRail.defaults).toBeDefined();
        expect(NavigationRail.defaults.activeIndex).toBe(0);
        expect(NavigationRail.defaults.expanded).toBe(false);
        expect(NavigationRail.defaults.footerDividerEnabled).toBe(false);
        expect(NavigationRail.defaults.border).toBe(false);
    });

    test('setActiveIndex met à jour l\'index actif', () => {
        const el = createNavigationRail();
        document.body.appendChild(el);
        const instance = new NavigationRail(el);

        expect(instance.getActiveIndex()).toBe(0);
        instance.setActiveIndex(1, false);
        expect(instance.getActiveIndex()).toBe(1);
        instance.setActiveIndex(0, false);
        expect(instance.getActiveIndex()).toBe(0);
    });

    test('getActiveIndex retourne l\'index actif', () => {
        const el = createNavigationRail();
        document.body.appendChild(el);
        const instance = new NavigationRail(el);

        expect(instance.getActiveIndex()).toBe(0);
        instance.setActiveIndex(1, false);
        expect(instance.getActiveIndex()).toBe(1);
    });

    test('setExpanded et getExpanded mettent à jour l\'état étendu', () => {
        const el = createNavigationRail();
        document.body.appendChild(el);
        const instance = new NavigationRail(el);

        expect(instance.getExpanded()).toBe(false);
        instance.setExpanded(true);
        expect(instance.getExpanded()).toBe(true);
        instance.setExpanded(false);
        expect(instance.getExpanded()).toBe(false);
    });

    test('defaults incluent expandMode standard', () => {
        expect(NavigationRail.defaults.expandMode).toBe('standard');
        expect(NavigationRail.defaults.hideOnCollapse).toBe(false);
        expect(NavigationRail.defaults.overlayOpacity).toBe(0.32);
        expect(NavigationRail.defaults.dismissible).toBe(true);
    });

    test('expandMode modal : pas de push + scrim + compensation scrollbar', () => {
        const container = document.createElement('div');
        container.className = 'navigation-rail-container';
        const el = createNavigationRail();
        el.id = 'nav-rail-modal-test';
        container.appendChild(el);
        document.body.appendChild(container);

        const instance = new NavigationRail(el, {
            expandMode: 'modal',
            expanded: false,
        });
        expect(instance.getExpandMode()).toBe('modal');
        expect(el.classList.contains('navigation-rail--expand-modal')).toBe(true);
        expect(container.style.paddingInlineStart).toBe('96px');

        instance.setExpanded(true);
        expect(el.classList.contains('navigation-rail--expanded')).toBe(true);
        expect(container.style.paddingInlineStart).toBe('96px');
        expect(document.querySelector('.navigation-rail-overlay')).toBeTruthy();
        expect(document.body.classList.contains('navigation-rail-modal-open')).toBe(true);
        expect(document.documentElement.style.getPropertyValue('--k3ui-scrollbar-compensation')).toMatch(/px$/);

        instance.destroy();
        expect(document.querySelector('.navigation-rail-overlay')).toBeFalsy();
        expect(document.body.classList.contains('navigation-rail-modal-open')).toBe(false);
        expect(document.documentElement.style.getPropertyValue('--k3ui-scrollbar-compensation')).toBe('0px');
        container.remove();
    });

    test('expandMode standard (et alias push) : pousse le container', () => {
        const container = document.createElement('div');
        container.className = 'navigation-rail-container';
        const el = createNavigationRail();
        el.id = 'nav-rail-standard-test';
        container.appendChild(el);
        document.body.appendChild(container);

        const instance = new NavigationRail(el, { expandMode: 'push', expanded: false });
        expect(instance.getExpandMode()).toBe('standard');
        instance.setExpanded(true);
        expect(container.style.paddingInlineStart).toBe('256px');
        expect(document.querySelector('.navigation-rail-overlay')).toBeFalsy();
        instance.destroy();
        container.remove();
    });

    test('hideOnCollapse : flux à 0 quand collapsed', () => {
        const container = document.createElement('div');
        container.className = 'navigation-rail-container';
        const el = createNavigationRail();
        el.id = 'nav-rail-hide-test';
        container.appendChild(el);
        document.body.appendChild(container);

        const instance = new NavigationRail(el, {
            expandMode: 'standard',
            hideOnCollapse: true,
            expanded: false,
        });
        expect(instance.getHideOnCollapse()).toBe(true);
        expect(el.classList.contains('navigation-rail--hide-on-collapse')).toBe(true);
        expect(container.style.paddingInlineStart).toBe('0px');

        instance.setExpanded(true);
        expect(container.style.paddingInlineStart).toBe('256px');
        instance.destroy();
        container.remove();
    });

    test('getId retourne l\'identifiant', () => {
        const el = createNavigationRail();
        document.body.appendChild(el);
        const instance = new NavigationRail(el);

        expect(typeof instance.getId()).toBe('string');
        expect(instance.getId().length).toBeGreaterThan(0);
    });

    test('destroy nettoie l\'instance', () => {
        const el = createNavigationRail();
        document.body.appendChild(el);
        const instance = new NavigationRail(el);

        expect(NavigationRail.getInstance(el)).toBe(instance);
        instance.destroy();
        expect(NavigationRail.getInstance(el)).toBeFalsy();
    });

    test('footer : items épinglés hors zone scroll avec gap (pas de divider)', () => {
        const el = createNavigationRailWithFooter(2);
        document.body.appendChild(el);
        const instance = new NavigationRail(el);

        const footer = el.querySelector('.navigation-rail__footer');
        expect(footer).toBeTruthy();
        expect(footer?.parentElement).toBe(el);
        expect(footer?.querySelector('.navigation-rail__divider')).toBeNull();
        expect(NavigationRail.defaults.footerDividerEnabled).toBe(false);
        expect(instance.getFooterItems()).toHaveLength(2);
        expect(el.querySelector('.navigation-rail__footer [data-destination="settings"]')).toBeTruthy();
        expect(el.querySelector('.navigation-rail__footer [data-destination="help"]')).toBeTruthy();

        const shell = el.querySelector('.navigation-rail__items-shell');
        expect(shell).toBeTruthy();
        expect(shell?.contains(footer as Node)).toBe(false);
        expect(el.lastElementChild?.classList.contains('navigation-rail__footer')).toBe(true);
    });

    test('footer : plafonné à footerMaxItems (surplus retiré)', () => {
        const el = createNavigationRailWithFooter(3);
        document.body.appendChild(el);
        const instance = new NavigationRail(el);

        expect(instance.getFooterItems()).toHaveLength(NavigationRailSpecs.behaviors.footerMaxItems);
        expect(el.querySelectorAll('.navigation-rail__footer > .navigation-rail__item')).toHaveLength(2);
    });

    test('footer : footerDividerEnabled=true ajoute un divider trait', () => {
        const el = createNavigationRailWithFooter(1);
        document.body.appendChild(el);
        const instance = new NavigationRail(el, { footerDividerEnabled: true });

        expect(instance.getFooterItems()).toHaveLength(1);
        expect(el.querySelector('.navigation-rail__footer .navigation-rail__divider')).toBeTruthy();
    });

    test('footer : items inclus dans la liste navigable (index après le main)', () => {
        const el = createNavigationRailWithFooter(2);
        document.body.appendChild(el);
        const instance = new NavigationRail(el);

        instance.setActiveIndex(2, false);
        expect(instance.getActiveIndex()).toBe(2);
        expect(
            el.querySelector('.navigation-rail__footer [data-destination="settings"]')
                ?.classList.contains('navigation-rail__item--active')
        ).toBe(true);
    });
});
