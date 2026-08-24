/// <reference types="@jest/types" />
/**
 * Tests unitaires pour le composant PanelContent
 */

import { PanelContent } from '../../src/components/PanelContent';

describe('PanelContent', () => {
    beforeEach(() => {
        document.body.innerHTML = '<k3ui-panel-content id="pane"></k3ui-panel-content>';
    });

    it('devrait créer une instance avec les options par défaut', () => {
        const el = document.getElementById('pane') as HTMLElement;
        const instance = new PanelContent(el, {});

        expect(instance).toBeDefined();
        expect(PanelContent.getInstance(el)).toBe(instance);
        expect(el.classList.contains('panel-content')).toBe(true);
        expect(el.classList.contains('content-pane')).toBe(true);
        expect(el.classList.contains('panel-content--layout')).toBe(true);
        expect(el.classList.contains('layout-pane')).toBe(true);
        expect(el.classList.contains('panel-content--scroll')).toBe(true);
        expect(el.classList.contains('docs-pane-scroll')).toBe(true);
        expect(el.style.getPropertyValue('--panel-content-surface')).toBe('');
    });

    it('devrait appliquer la variante leading', () => {
        const el = document.getElementById('pane') as HTMLElement;
        new PanelContent(el, { variant: 'leading' });

        expect(el.classList.contains('panel-content--leading')).toBe(true);
        expect(el.classList.contains('leading-pane')).toBe(true);
        expect(el.getAttribute('role')).toBe('complementary');
    });

    it('devrait appliquer la variante trailing vide', () => {
        const el = document.getElementById('pane') as HTMLElement;
        new PanelContent(el, { variant: 'trailing', empty: true });

        expect(el.classList.contains('panel-content--trailing')).toBe(true);
        expect(el.classList.contains('trailing-pane')).toBe(true);
        expect(el.classList.contains('panel-content--empty')).toBe(true);
        expect(el.classList.contains('trailing-pane--empty')).toBe(true);
    });

    it('devrait lire les attributs data-*', () => {
        const el = document.getElementById('pane') as HTMLElement;
        el.setAttribute('data-variant', 'layout');
        el.setAttribute('data-radius', '16px');
        el.setAttribute('data-surface', '#fafafa');
        el.setAttribute('data-scrollable', 'false');
        el.setAttribute('aria-label', 'Contenu principal');

        new PanelContent(el, {});

        expect(el.classList.contains('panel-content--scroll')).toBe(false);
        expect(el.classList.contains('docs-pane-scroll')).toBe(false);
        expect(el.style.getPropertyValue('--panel-content-radius')).toBe('16px');
        expect(el.style.getPropertyValue('--content-pane-radius')).toBe('16px');
        expect(el.style.getPropertyValue('--panel-content-surface')).toBe('#fafafa');
        expect(el.style.getPropertyValue('--docs-pane-surface')).toBe('#fafafa');
        expect(el.getAttribute('aria-label')).toBe('Contenu principal');
        expect(el.getAttribute('role')).toBe('region');
    });

    it('devrait lire l\'attribut variant sur le custom element', () => {
        const el = document.getElementById('pane') as HTMLElement;
        el.setAttribute('variant', 'trailing');

        new PanelContent(el, {});

        expect(el.classList.contains('panel-content--trailing')).toBe(true);
    });

    it('defaults devrait retourner les options par défaut', () => {
        const def = PanelContent.defaults;
        expect(def.variant).toBe('layout');
        expect(def.radius).toBe('28px');
        expect(def.surface).toBe('');
        expect(def.scrollable).toBe(true);
        expect(def.empty).toBe(false);
    });

    it('getScrollElement devrait retourner le host', () => {
        const el = document.getElementById('pane') as HTMLElement;
        const instance = new PanelContent(el, {});
        expect(instance.getScrollElement()).toBe(el);
    });

    it('updateOptions devrait mettre à jour classes et CSS vars', () => {
        const el = document.getElementById('pane') as HTMLElement;
        const instance = new PanelContent(el, { variant: 'layout' });

        instance.updateOptions({ variant: 'leading', radius: '12px', scrollable: false });

        expect(el.classList.contains('panel-content--leading')).toBe(true);
        expect(el.classList.contains('leading-pane')).toBe(true);
        expect(el.classList.contains('panel-content--scroll')).toBe(false);
        expect(el.style.getPropertyValue('--panel-content-radius')).toBe('12px');
    });

    it('devrait initialiser via init avec un élément', () => {
        const el = document.getElementById('pane') as HTMLElement;
        const result = PanelContent.init(el, { variant: 'layout' });
        const instances = Array.isArray(result) ? result : [result];
        expect(instances.length).toBe(1);
        expect(PanelContent.getInstance(el)).toBe(instances[0]);
    });

    it('devrait détruire proprement', () => {
        const el = document.getElementById('pane') as HTMLElement;
        const instance = new PanelContent(el, { ariaLabel: 'Test pane' });
        instance.destroy();
        expect(PanelContent.getInstance(el)).toBeFalsy();
        expect(el.getAttribute('role')).toBeNull();
        expect(el.getAttribute('aria-label')).toBeNull();
    });
});
