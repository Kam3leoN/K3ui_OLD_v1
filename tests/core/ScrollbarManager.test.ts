/**
 * Tests unitaires pour ScrollbarManager
 */

import { ScrollbarManager } from '../../src/core/managers/ScrollbarManager';

describe('ScrollbarManager', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('bind crée rail + thumb et les attache au host', () => {
        const host = document.createElement('div');
        host.style.position = 'relative';
        host.style.height = '200px';

        const scroll = document.createElement('div');
        scroll.style.height = '100px';
        scroll.style.overflow = 'auto';
        scroll.innerHTML = `<div style="height:400px">Contenu</div>`;
        host.appendChild(scroll);
        document.body.appendChild(host);

        Object.defineProperty(scroll, 'clientHeight', { configurable: true, value: 100 });
        Object.defineProperty(scroll, 'scrollHeight', { configurable: true, value: 400 });

        const handle = ScrollbarManager.bind({
            scroll,
            railHost: host,
            railClass: 'test-scrollbar',
            thumbClass: 'test-scrollbar__thumb',
            removeRailOnDestroy: true,
        });

        expect(handle.rail.classList.contains('test-scrollbar')).toBe(true);
        expect(handle.thumb.classList.contains('test-scrollbar__thumb')).toBe(true);
        expect(host.querySelector(':scope > .test-scrollbar')).toBe(handle.rail);

        handle.destroy();
        expect(host.querySelector('.test-scrollbar')).toBeNull();
    });

    test('syncScrollBounds aligne le rail sur le scroller dans le host', () => {
        const host = document.createElement('div');
        host.style.position = 'relative';
        host.style.height = '300px';

        const header = document.createElement('div');
        header.style.height = '40px';
        const scroll = document.createElement('div');
        scroll.style.height = '200px';
        const rail = document.createElement('div');

        host.append(header, scroll, rail);
        document.body.appendChild(host);

        host.getBoundingClientRect = jest.fn(() => ({
            top: 0,
            left: 0,
            right: 200,
            bottom: 300,
            width: 200,
            height: 300,
            x: 0,
            y: 0,
            toJSON: () => ({}),
        }));
        scroll.getBoundingClientRect = jest.fn(() => ({
            top: 40,
            left: 0,
            right: 200,
            bottom: 240,
            width: 200,
            height: 200,
            x: 0,
            y: 40,
            toJSON: () => ({}),
        }));

        ScrollbarManager.syncScrollBounds(host, scroll, rail);

        expect(rail.style.top).toBe('40px');
        expect(rail.style.height).toBe('200px');
    });

    test('refresh recalcule la géométrie scroll-bounds', () => {
        const host = document.createElement('div');
        const scroll = document.createElement('div');
        scroll.style.overflow = 'auto';
        scroll.innerHTML = '<div style="height:800px"></div>';
        host.appendChild(scroll);
        document.body.appendChild(host);

        Object.defineProperty(scroll, 'clientHeight', { configurable: true, value: 120 });
        Object.defineProperty(scroll, 'scrollHeight', { configurable: true, value: 800 });

        host.getBoundingClientRect = jest.fn(() => ({
            top: 10,
            left: 0,
            right: 100,
            bottom: 310,
            width: 100,
            height: 300,
            x: 0,
            y: 10,
            toJSON: () => ({}),
        }));
        scroll.getBoundingClientRect = jest.fn(() => ({
            top: 50,
            left: 0,
            right: 100,
            bottom: 170,
            width: 100,
            height: 120,
            x: 0,
            y: 50,
            toJSON: () => ({}),
        }));

        const handle = ScrollbarManager.bind({
            scroll,
            railHost: host,
            geometryTarget: scroll,
            geometry: 'scroll-bounds',
            removeRailOnDestroy: true,
        });

        handle.refresh();

        expect(handle.rail.style.top).toBe('40px');
        expect(handle.rail.style.height).toBe('120px');

        handle.destroy();
    });

    test('resolvePlacement bascule en interne si le rail externe sort du viewport', () => {
        const rail = document.createElement('div');
        rail.className = 'test-scrollbar k3ui-scrollbar';
        rail.style.position = 'absolute';
        rail.style.width = '8px';
        rail.style.height = '200px';
        document.body.appendChild(rail);

        Object.defineProperty(window, 'innerWidth', { configurable: true, value: 400 });
        Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });

        rail.getBoundingClientRect = jest.fn(() => ({
            top: 50,
            left: 395,
            right: 410,
            bottom: 250,
            width: 15,
            height: 200,
            x: 395,
            y: 50,
            toJSON: () => ({}),
        }));

        const result = ScrollbarManager.resolvePlacement(rail, 'auto', 4);

        expect(result).toBe('internal');
        expect(rail.classList.contains('k3ui-scrollbar--internal')).toBe(true);
        expect(rail.classList.contains('k3ui-scrollbar--external')).toBe(false);
    });

    test('enlargeOnInteraction ajoute is-hovering au survol du rail', () => {
        const host = document.createElement('div');
        const scroll = document.createElement('div');
        scroll.style.overflow = 'auto';
        scroll.innerHTML = '<div style="height:800px"></div>';
        host.appendChild(scroll);
        document.body.appendChild(host);

        Object.defineProperty(scroll, 'clientHeight', { configurable: true, value: 120 });
        Object.defineProperty(scroll, 'scrollHeight', { configurable: true, value: 800 });

        const handle = ScrollbarManager.bind({
            scroll,
            railHost: host,
            enlargeOnInteraction: true,
            removeRailOnDestroy: true,
        });

        handle.rail.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
        expect(handle.rail.classList.contains('is-hovering')).toBe(true);

        handle.rail.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }));
        expect(handle.rail.classList.contains('is-hovering')).toBe(false);

        handle.destroy();
    });
});
