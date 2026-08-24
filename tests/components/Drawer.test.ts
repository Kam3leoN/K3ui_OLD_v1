/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant Drawer
 * Drawer gère uniquement left / right (navigation drawer M3).
 */

import { Drawer } from '../../src/components/Drawer';

describe('Drawer', () => {
    beforeEach(() => {
        document.body.innerHTML =
            '<div class="drawer" id="drawer-el">' +
            '<div class="drawer-wrapper"><div class="drawer-content">Contenu</div></div>' +
            '</div>';
    });

    afterEach(() => {
        document.body.innerHTML = '';
        Drawer._drawers.length = 0;
        jest.restoreAllMocks();
    });

    test('initialise et stocke l\'instance', () => {
        const el = document.getElementById('drawer-el') as HTMLElement;
        const instance = new Drawer(el);

        expect(instance).toBeDefined();
        expect(Drawer.getInstance(el)).toBe(instance);
    });

    test('applique les options par défaut (edge left)', () => {
        expect(Drawer.defaults).toBeDefined();
        expect(Drawer.defaults.edge).toBe('left');
        expect(Drawer.defaults.edge).not.toBe('top' as never);
        expect(Drawer.defaults.edge).not.toBe('bottom' as never);
    });

    test('isOpen est false initialement', () => {
        const el = document.getElementById('drawer-el') as HTMLElement;
        const instance = new Drawer(el, { edge: 'left' });

        expect(instance.isOpen).toBe(false);
    });

    describe('position left', () => {
        test('ouvre et ferme un drawer latéral', () => {
            const el = document.getElementById('drawer-el') as HTMLElement;
            const instance = new Drawer(el, { edge: 'left' });

            instance.open();
            expect(instance.isOpen).toBe(true);

            instance.close();
            expect(instance.isOpen).toBe(false);
        });

        test('callbacks onOpenStart/onCloseStart', () => {
            const onOpenStart = jest.fn();
            const onCloseStart = jest.fn();
            const el = document.getElementById('drawer-el') as HTMLElement;
            const instance = new Drawer(el, { edge: 'left', onOpenStart, onCloseStart });

            instance.open();
            expect(onOpenStart).toHaveBeenCalled();

            instance.close();
            expect(onCloseStart).toHaveBeenCalled();
        });

        test('ajoute la classe drawer--left', () => {
            const el = document.getElementById('drawer-el') as HTMLElement;
            const instance = new Drawer(el, { edge: 'left' });

            expect(instance.options.edge).toBe('left');
            expect(el.classList.contains('drawer--left')).toBe(true);
        });
    });

    describe('position right', () => {
        test('détecte la position right depuis la classe CSS', () => {
            const el = document.getElementById('drawer-el') as HTMLElement;
            el.classList.add('drawer--right');
            const instance = new Drawer(el);

            expect(instance.options.edge).toBe('right');
        });

        test('options.edge right ajoute drawer--right', () => {
            const el = document.getElementById('drawer-el') as HTMLElement;
            const instance = new Drawer(el, { edge: 'right' });

            expect(instance.options.edge).toBe('right');
            expect(el.classList.contains('drawer--right')).toBe(true);
        });

        test('ouvre et ferme un drawer right', () => {
            const el = document.getElementById('drawer-el') as HTMLElement;
            const instance = new Drawer(el, { edge: 'right' });

            instance.open();
            expect(instance.isOpen).toBe(true);
            instance.close();
            expect(instance.isOpen).toBe(false);
        });
    });

    describe('destroy', () => {
        test('destroy nettoie un drawer latéral', () => {
            const el = document.getElementById('drawer-el') as HTMLElement;
            const instance = new Drawer(el, { edge: 'left' });

            instance.destroy();
            expect(Drawer.getInstance(el)).toBeFalsy();
        });

        test('supprime des drawers statiques', () => {
            const el = document.getElementById('drawer-el') as HTMLElement;
            const instance = new Drawer(el, { edge: 'left' });

            expect(Drawer._drawers.length).toBe(1);
            instance.destroy();
            expect(Drawer._drawers.length).toBe(0);
        });
    });

    describe('static init', () => {
        test('init avec un seul élément retourne une instance', () => {
            const el = document.getElementById('drawer-el') as HTMLElement;
            const instance = Drawer.init(el, { edge: 'left' });

            expect(instance).toBeInstanceOf(Drawer);
        });
    });

    describe('hard break top / bottom', () => {
        test('ignore drawer--top / drawer--bottom et force left', () => {
            const el = document.getElementById('drawer-el') as HTMLElement;
            el.classList.add('drawer--top', 'drawer--bottom');
            const instance = new Drawer(el);

            expect(instance.options.edge).toBe('left');
            expect(el.classList.contains('drawer--left')).toBe(true);
            expect(el.classList.contains('drawer--top')).toBe(false);
            expect(el.classList.contains('drawer--bottom')).toBe(false);
        });

        test('edge invalide (top) retombe sur left', () => {
            const el = document.getElementById('drawer-el') as HTMLElement;
            const instance = new Drawer(el, { edge: 'top' as unknown as 'left' });

            expect(instance.options.edge).toBe('left');
            expect(el.classList.contains('drawer--left')).toBe(true);
        });

        test('open utilise un overlay latéral, pas de poignée verticale', () => {
            const el = document.getElementById('drawer-el') as HTMLElement;
            const instance = new Drawer(el, { edge: 'right' });

            instance.open();
            expect(instance.isOpen).toBe(true);
            expect(el.querySelector('.sheet-drag-handle')).toBeFalsy();
            expect(el.querySelector('.drawer-drag-handle')).toBeFalsy();
            expect(document.querySelector('.drawer-overlay')).toBeTruthy();
            instance.destroy();
        });

        test('open après left → right ancre à droite et porte sur body', () => {
            const host = document.createElement('div');
            document.body.appendChild(host);
            const el = document.getElementById('drawer-el') as HTMLElement;
            host.appendChild(el);

            const left = new Drawer(el, { edge: 'left' });
            left.open();
            expect(el.classList.contains('drawer--left')).toBe(true);
            left.close();
            left.destroy();

            el.className = 'drawer drawer--right';
            const right = new Drawer(el, { edge: 'right' });
            right.open();

            expect(right.isOpen).toBe(true);
            expect(el.classList.contains('drawer--right')).toBe(true);
            expect(el.classList.contains('drawer--left')).toBe(false);
            expect(el.classList.contains('is-open')).toBe(true);
            expect(el.parentElement).toBe(document.body);
            expect(Number(el.style.zIndex)).toBeGreaterThanOrEqual(1300);
            right.destroy();
            host.remove();
        });

        test('open left porte sur body au-dessus du stacking modal', () => {
            const host = document.createElement('div');
            document.body.appendChild(host);
            const el = document.getElementById('drawer-el') as HTMLElement;
            host.appendChild(el);

            const instance = new Drawer(el, { edge: 'left' });
            instance.open();

            expect(el.parentElement).toBe(document.body);
            expect(Number(el.style.zIndex)).toBeGreaterThanOrEqual(1300);
            const overlay = document.querySelector('.drawer-overlay') as HTMLElement;
            expect(overlay).toBeTruthy();
            expect(Number(overlay.style.zIndex)).toBeGreaterThanOrEqual(1299);

            instance.destroy();
            host.remove();
        });
    });
});
