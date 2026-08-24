/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant ButtonFab
 */

import { ButtonFab } from '../../src/components/ButtonFab';
import { ensurePointerAndAnimatePolyfills } from '../helpers/pointer-polyfill';

describe('ButtonFab', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="root"></div>';
        ensurePointerAndAnimatePolyfills();
    });

    it('devrait créer une instance avec les options par défaut (mode fab)', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new ButtonFab(el, {});
        expect(instance).toBeDefined();
        expect(ButtonFab.getInstance(el)).toBe(instance);
        expect(el.classList.contains('button-fab')).toBe(true);
        expect(el.querySelector('.button-fab__btn')).toBeTruthy();
        expect(el.querySelector('.button-fab__icon')).toBeTruthy();
        expect(el.getAttribute('data-mode')).toBe('fab');
    });

    it('devrait construire le DOM en mode extended avec label', () => {
        const el = document.getElementById('root') as HTMLElement;
        new ButtonFab(el, { mode: 'extended', label: 'Créer' });
        expect(el.querySelector('.button-fab__label')).toBeTruthy();
        expect((el.querySelector('.button-fab__label') as HTMLElement)?.textContent).toBe('Créer');
    });

    it('devrait exposer getInstance', () => {
        const el = document.getElementById('root') as HTMLElement;
        new ButtonFab(el, {});
        const instance = ButtonFab.getInstance(el);
        expect(instance).toBeDefined();
    });

    it('devrait retourner isExtendedState selon le mode', () => {
        const el = document.getElementById('root') as HTMLElement;
        const fab = new ButtonFab(el, { mode: 'fab' });
        expect(fab.isExtendedState()).toBe(false);
        fab.destroy();
        document.body.innerHTML = '<div id="root2"></div>';
        const ext = new ButtonFab(document.getElementById('root2')!, { mode: 'extended' });
        expect(ext.isExtendedState()).toBe(true);
    });

    it('devrait mettre à jour le label avec setLabel', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new ButtonFab(el, { mode: 'extended', label: 'Créer' });
        instance.setLabel('Modifier');
        expect(instance.options.label).toBe('Modifier');
        expect((el.querySelector('.button-fab__label') as HTMLElement)?.textContent).toBe('Modifier');
    });

    it('devrait détruire proprement', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new ButtonFab(el, {});
        instance.destroy();
        expect(ButtonFab.getInstance(el)).toBeFalsy();
    });

    it('devrait initialiser via init avec un élément', () => {
        const el = document.getElementById('root') as HTMLElement;
        const result = ButtonFab.init(el, { mode: 'fab' });
        const instances = Array.isArray(result) ? result : [result];
        expect(instances.length).toBe(1);
        expect(ButtonFab.getInstance(el)).toBe(instances[0]);
    });

    it('defaults devrait retourner les options par défaut', () => {
        const def = ButtonFab.defaults;
        expect(def.mode).toBe('fab');
        expect(def.size).toBe('medium');
        expect(def.variant).toBe('primary');
        expect(def.icon).toBe('add');
    });

    it('devrait lire les attributs data-*', () => {
        const el = document.createElement('div');
        el.className = 'button-fab';
        el.setAttribute('data-mode', 'extended');
        el.setAttribute('data-icon', 'edit');
        el.setAttribute('data-label', 'Modifier');
        el.setAttribute('data-size', 'small');
        document.getElementById('root')!.appendChild(el);
        const instance = new ButtonFab(el, {});
        expect(instance.options.mode).toBe('extended');
        expect(instance.options.icon).toBe('edit');
        expect(instance.options.label).toBe('Modifier');
        expect(instance.options.size).toBe('small');
    });
});
