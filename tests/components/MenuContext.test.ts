/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant MenuContext
 */

import { MenuContext } from '../../src/components/MenuContext';
import { ensurePointerAndAnimatePolyfills } from '../helpers/pointer-polyfill';

const defaultItems = [
    { id: 'edit', label: 'Modifier', icon: 'edit' },
    { id: 'copy', label: 'Copier', icon: 'copy' },
    { id: 'delete', label: 'Supprimer', icon: 'trash' },
];

describe('MenuContext', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="root" class="menu-context"></div>';
        ensurePointerAndAnimatePolyfills();
    });

    afterEach(() => {
        const el = document.getElementById('root');
        const instance = el ? MenuContext.getInstance(el) : null;
        instance?.destroy();
        document.body.innerHTML = '';
    });

    it('devrait créer une instance avec les options par défaut', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new MenuContext(el, { items: defaultItems });
        expect(instance).toBeDefined();
        expect(MenuContext.getInstance(el)).toBe(instance);
        expect(el.classList.contains('menu-context')).toBe(true);
        expect(instance.isOpen()).toBe(false);
    });

    it('devrait exposer getInstance', () => {
        const el = document.getElementById('root') as HTMLElement;
        new MenuContext(el, { items: defaultItems });
        const instance = MenuContext.getInstance(el);
        expect(instance).toBeDefined();
        expect(instance?.isOpen()).toBe(false);
    });

    it('devrait ouvrir le menu via openAt', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new MenuContext(el, { items: defaultItems, scope: 'element' });
        instance.openAt(100, 120);
        expect(instance.isOpen()).toBe(true);
        expect(instance.getMenu()).toBeTruthy();
    });

    it('devrait fermer le menu via close', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new MenuContext(el, { items: defaultItems, scope: 'element' });
        instance.openAt(50, 50);
        expect(instance.isOpen()).toBe(true);
        instance.close();
        expect(instance.isOpen()).toBe(false);
    });

    it('devrait ouvrir au contextmenu sur l’élément (scope element)', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new MenuContext(el, { items: defaultItems, scope: 'element' });
        el.dispatchEvent(
            new MouseEvent('contextmenu', {
                bubbles: true,
                cancelable: true,
                clientX: 80,
                clientY: 90,
            })
        );
        expect(instance.isOpen()).toBe(true);
    });

    it('devrait appeler onOpenStart à l’ouverture', () => {
        const el = document.getElementById('root') as HTMLElement;
        const onOpenStart = jest.fn();
        const instance = new MenuContext(el, {
            items: defaultItems,
            scope: 'element',
            onOpenStart,
        });
        instance.openAt(10, 10);
        expect(onOpenStart).toHaveBeenCalled();
    });

    it('devrait mettre à jour les items avec setItems', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new MenuContext(el, { items: defaultItems, scope: 'element' });
        instance.setItems([{ id: 'only', label: 'Seul' }]);
        expect(instance.getMenu()?.options.items?.length).toBe(1);
    });

    it('devrait initialiser via init', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = MenuContext.init(el, { items: defaultItems, scope: 'element' });
        expect(instance).toBeDefined();
        expect(MenuContext.getInstance(el)).toBe(instance);
    });

    it('devrait exposer defaults', () => {
        expect(MenuContext.defaults.items).toEqual([]);
        expect(MenuContext.defaults.scope).toBe('document');
        expect(MenuContext.defaults.preventDefault).toBe(true);
    });

    it('devrait détruire proprement', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new MenuContext(el, { items: defaultItems, scope: 'element' });
        instance.openAt(20, 20);
        instance.destroy();
        expect(MenuContext.getInstance(el)).toBeNull();
        expect(document.querySelector('.menu-context__anchor')).toBeNull();
    });
});
