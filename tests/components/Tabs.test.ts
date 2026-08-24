/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant Tabs
 */

import { Tabs } from '../../src/components/Tabs';

function createTabsContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'tabs-container';
    container.innerHTML = `
      <div class="tabs">
        <div class="tabs__scroller">
          <button type="button" class="tabs__tab" data-tab-index="0">Tab 1</button>
          <button type="button" class="tabs__tab" data-tab-index="1">Tab 2</button>
          <div class="tabs__indicator" aria-hidden="true"></div>
        </div>
      </div>
      <div class="tabs-items">
        <div class="tabs-item" data-tab-index="0">Content 1</div>
        <div class="tabs-item" data-tab-index="1">Content 2</div>
      </div>
    `;
    return container;
}

describe('Tabs', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    test('initialise et stocke l\'instance sur l\'élément', () => {
        const el = createTabsContainer();
        document.body.appendChild(el);
        const instance = new Tabs(el);

        expect(instance).toBeDefined();
        expect(Tabs.getInstance(el)).toBe(instance);
    });

    test('getInstance retourne l\'instance', () => {
        const el = createTabsContainer();
        document.body.appendChild(el);
        const instance = new Tabs(el);
        const found = Tabs.getInstance(el);

        expect(found).toBe(instance);
    });

    test('getActive retourne l\'index actif par défaut', () => {
        const el = createTabsContainer();
        document.body.appendChild(el);
        const instance = new Tabs(el);

        expect(instance.getActive()).toBe(0);
    });

    test('setActive change l\'onglet actif', () => {
        const el = createTabsContainer();
        document.body.appendChild(el);
        const instance = new Tabs(el);

        instance.setActive(1);
        expect(instance.getActive()).toBe(1);

        instance.setActive(0);
        expect(instance.getActive()).toBe(0);
    });

    test('Tabs.defaults existe', () => {
        expect(Tabs.defaults).toBeDefined();
        expect(Tabs.defaults.active).toBe(0);
        expect(Tabs.defaults.layoutDirection).toBe('horizontal');
    });

    test('init accepte un élément et des options', () => {
        const el = createTabsContainer();
        document.body.appendChild(el);
        const instances = Tabs.init(el, { active: 1 });

        expect(Array.isArray(instances) ? instances[0] : instances).toBeDefined();
        const instance = Array.isArray(instances) ? instances[0] : instances;
        expect(instance.getActive()).toBe(1);
    });

    test('destroy nettoie l\'instance', () => {
        const el = createTabsContainer();
        document.body.appendChild(el);
        const instance = new Tabs(el);

        expect(Tabs.getInstance(el)).toBe(instance);
        instance.destroy();
        expect(Tabs.getInstance(el)).toBeFalsy();
    });
});
