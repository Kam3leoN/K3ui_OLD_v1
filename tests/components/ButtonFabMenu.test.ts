/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant ButtonFabMenu
 */

import { ButtonFabMenu } from '../../src/components/ButtonFabMenu';
import { ensurePointerAndAnimatePolyfills } from '../helpers/pointer-polyfill';

const defaultItems = [
    { id: 'a', label: 'Action A', icon: 'edit' },
    { id: 'b', label: 'Action B', icon: 'link' },
];

describe('ButtonFabMenu', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="root"></div>';
        ensurePointerAndAnimatePolyfills();
    });

    it('devrait créer une instance avec les options par défaut', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new ButtonFabMenu(el, {});
        expect(instance).toBeDefined();
        expect(ButtonFabMenu.getInstance(el)).toBe(instance);
        expect(el.classList.contains('button-fab-menu')).toBe(true);
        expect(el.querySelector('.button-fab__btn')).toBeTruthy();
        expect(instance.isOpen()).toBe(false);
    });

    it('devrait construire le DOM quand items est fourni', () => {
        const el = document.getElementById('root') as HTMLElement;
        new ButtonFabMenu(el, { items: defaultItems });
        expect(el.querySelectorAll('.button-fab-menu__pill').length).toBe(2);
        expect(el.querySelector('.button-fab-menu__scrim')).toBeTruthy();
        expect(el.querySelector('.button-fab-menu__list')).toBeTruthy();
    });

    it('devrait exposer getInstance', () => {
        const el = document.getElementById('root') as HTMLElement;
        new ButtonFabMenu(el, { items: defaultItems });
        const instance = ButtonFabMenu.getInstance(el);
        expect(instance).toBeDefined();
        expect(instance?.isOpen()).toBe(false);
    });

    it('devrait ouvrir et fermer le menu (toggle, isOpen)', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new ButtonFabMenu(el, { items: defaultItems });
        expect(instance.isOpen()).toBe(false);
        instance.openMenu();
        expect(instance.isOpen()).toBe(true);
        instance.closeMenu();
        expect(instance.isOpen()).toBe(false);
    });

    it('devrait appeler onItemClick au clic sur une pill', () => {
        const el = document.getElementById('root') as HTMLElement;
        const onItemClick = jest.fn();
        const instance = new ButtonFabMenu(el, { items: defaultItems, onItemClick, position: 'top-right' });
        instance.openMenu();
        const pills = el.querySelectorAll('.button-fab-menu__pill');
        expect(pills.length).toBeGreaterThanOrEqual(1);
        (pills[0] as HTMLButtonElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(onItemClick).toHaveBeenCalled();
        expect(['a', 'b']).toContain(onItemClick.mock.calls[0][0].id);
    });

    it('devrait appeler onOpenStart / onOpenEnd et onCloseStart / onCloseEnd', () => {
        jest.useFakeTimers();
        const el = document.getElementById('root') as HTMLElement;
        const onOpenStart = jest.fn();
        const onOpenEnd = jest.fn();
        const onCloseStart = jest.fn();
        const onCloseEnd = jest.fn();
        const instance = new ButtonFabMenu(el, {
            items: defaultItems,
            onOpenStart,
            onOpenEnd,
            onCloseStart,
            onCloseEnd,
        });
        instance.openMenu();
        expect(onOpenStart).toHaveBeenCalled();
        // 2 items : (1 * 35) + 350 = 385ms
        jest.advanceTimersByTime(400);
        expect(onOpenEnd).toHaveBeenCalled();
        instance.closeMenu();
        expect(onCloseStart).toHaveBeenCalled();
        // 2 items : (1 * 25) + 350 = 375ms
        jest.advanceTimersByTime(400);
        expect(onCloseEnd).toHaveBeenCalled();
        jest.useRealTimers();
    });

    it('devrait mettre à jour la position avec setPosition', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new ButtonFabMenu(el, { items: defaultItems, position: 'bottom-right' });
        const fabWrap = el.querySelector('.button-fab-menu__fab') as HTMLElement;
        expect(fabWrap?.style.bottom).toBeDefined();
        instance.setPosition('top-left');
        expect(fabWrap?.style.top).toBeDefined();
        expect(fabWrap?.style.left).toBeDefined();
    });

    it('devrait détruire proprement', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new ButtonFabMenu(el, { items: defaultItems });
        instance.destroy();
        expect(ButtonFabMenu.getInstance(el)).toBeFalsy();
    });

    it('devrait initialiser via init avec un élément', () => {
        const el = document.getElementById('root') as HTMLElement;
        const result = ButtonFabMenu.init(el, { items: defaultItems });
        const instances = Array.isArray(result) ? result : [result];
        expect(instances.length).toBe(1);
        expect(ButtonFabMenu.getInstance(el)).toBe(instances[0]);
    });

    it('devrait initialiser via init avec une NodeList', () => {
        const el = document.getElementById('root') as HTMLElement;
        el.className = 'button-fab-menu';
        const list = document.querySelectorAll<HTMLElement>('#root');
        const result = ButtonFabMenu.init(list, { items: defaultItems });
        const instances = Array.isArray(result) ? result : [result];
        expect(instances.length).toBe(1);
    });

    it('devrait faire tourner l\'icône du trigger à l\'ouverture et à la fermeture', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new ButtonFabMenu(el, { items: defaultItems });
        const rotator = el.querySelector('.button-fab-menu__icon-rotator') as HTMLElement;
        expect(rotator).toBeTruthy();
        expect(rotator.classList.contains('button-fab-menu__icon-rotator--open')).toBe(false);
        instance.openMenu();
        expect(rotator.classList.contains('button-fab-menu__icon-rotator--open')).toBe(true);
        instance.closeMenu();
        expect(rotator.classList.contains('button-fab-menu__icon-rotator--open')).toBe(false);
    });

    it('devrait fermer le menu à la touche Escape', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new ButtonFabMenu(el, { items: defaultItems });
        instance.openMenu();
        expect(instance.isOpen()).toBe(true);
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(instance.isOpen()).toBe(false);
    });

    it('defaults devrait retourner les options par défaut', () => {
        const def = ButtonFabMenu.defaults;
        expect(def.position).toBe('bottom-right');
        expect(def.items).toEqual([]);
        expect(def.fabIcon).toBe('add');
    });
});
