/// <reference types="@jest/globals" />
/**
 * Tests unitaires pour le composant ScrollSpy
 */

import { ScrollSpy } from '../../src/components/ScrollSpy';
import { LocaleManager } from '../../src/core/managers';

type IntersectionObserverMock = {
    observe: jest.Mock;
    unobserve: jest.Mock;
    disconnect: jest.Mock;
    trigger: (entries: Partial<IntersectionObserverEntry>[]) => void;
};

function setupIntersectionObserverMock(): IntersectionObserverMock {
    const instances: Array<(entries: IntersectionObserverEntry[]) => void> = [];
    const mock: IntersectionObserverMock = {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
        trigger: (entries) => {
            const normalized = entries.map((e) => ({
                isIntersecting: e.isIntersecting ?? false,
                target: e.target as Element,
                boundingClientRect: e.boundingClientRect ?? { top: 0 } as DOMRectReadOnly,
                intersectionRatio: e.intersectionRatio ?? 0,
                intersectionRect: e.intersectionRect ?? {} as DOMRectReadOnly,
                rootBounds: e.rootBounds ?? null,
                time: e.time ?? 0,
            })) as IntersectionObserverEntry[];
            instances.forEach((cb) => cb(normalized));
        },
    };

    (global.IntersectionObserver as unknown as jest.Mock) = jest.fn((cb: (entries: IntersectionObserverEntry[]) => void) => {
        instances.push(cb);
        return mock;
    });

    return mock;
}

function buildPage(): { main: HTMLElement; tocHost: HTMLElement } {
    document.body.innerHTML = `
        <main data-scrollspy-content>
            <h1>Page Title</h1>
            <h2>Introduction</h2>
            <p>Content intro</p>
            <h2>Getting Started</h2>
            <h3>Install</h3>
            <p>Install content</p>
            <h3>Configure</h3>
            <p>Configure content</p>
            <h2>Advanced</h2>
            <p>Advanced content</p>
        </main>
        <k3ui-scrollspy></k3ui-scrollspy>
    `;
    const main = document.querySelector('main') as HTMLElement;
    const tocHost = document.querySelector('k3ui-scrollspy') as HTMLElement;
    return { main, tocHost };
}

describe('ScrollSpy', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        LocaleManager.init('en-US');
        setupIntersectionObserverMock();
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: jest.fn().mockImplementation((query: string) => ({
                matches: query.includes('max-width'),
                media: query,
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn(),
            })),
        });
    });

    test('initialise et stocke l\'instance sur l\'élément (K_ScrollSpy)', () => {
        const { tocHost } = buildPage();
        const instance = ScrollSpy.init(tocHost) as ScrollSpy;
        expect(instance).toBeDefined();
        expect((tocHost as HTMLElement & { K_ScrollSpy?: ScrollSpy }).K_ScrollSpy).toBe(instance);
    });

    test('getInstance retourne l\'instance', () => {
        const { tocHost } = buildPage();
        const created = ScrollSpy.init(tocHost) as ScrollSpy;
        expect(ScrollSpy.getInstance(tocHost)).toBe(created);
    });

    test('double init retourne la même instance', () => {
        const { tocHost } = buildPage();
        const first = ScrollSpy.init(tocHost) as ScrollSpy;
        const second = ScrollSpy.init(tocHost) as ScrollSpy;
        expect(second).toBe(first);
    });

    test('defaults expose les options par défaut', () => {
        expect(ScrollSpy.defaults.offset).toBe(96);
        expect(ScrollSpy.defaults.headings).toBe('h2');
        expect(ScrollSpy.defaults.progress).toBe(false);
        expect(ScrollSpy.defaults.mobileBreakpoint).toBe(960);
    });

    test('active le premier élément au chargement initial', () => {
        const { tocHost } = buildPage();
        const instance = ScrollSpy.init(tocHost, { selector: 'main' }) as ScrollSpy;
        expect(instance.getActive()).toBe('introduction');
        const active = tocHost.querySelector('.scrollspy__desktop .scrollspy__link--active') as HTMLAnchorElement;
        expect(active?.dataset.sectionId).toBe('introduction');
        expect(active?.getAttribute('aria-current')).toBe('location');
    });

    test('refresh resynchronise les classes actives après rebuild DOM', () => {
        const { tocHost } = buildPage();
        const instance = ScrollSpy.init(tocHost, { selector: 'main' }) as ScrollSpy;
        instance.setActive('getting-started', false);
        instance.refresh();
        const active = tocHost.querySelector('.scrollspy__desktop .scrollspy__link--active') as HTMLAnchorElement;
        expect(instance.getActive()).toBe('getting-started');
        expect(active?.dataset.sectionId).toBe('getting-started');
        expect(active?.getAttribute('aria-current')).toBe('location');
    });

    test('auto-génère les sections avec ids slugifiés', () => {
        buildPage();
        const h2 = document.querySelector('h2') as HTMLElement;
        h2.removeAttribute('id');
        h2.textContent = 'Hello World!';

        const tocHost = document.querySelector('k3ui-scrollspy') as HTMLElement;
        ScrollSpy.init(tocHost, { selector: 'main' });
        const link = tocHost.querySelector('.scrollspy__link') as HTMLAnchorElement;
        expect(h2.id).toBe('hello-world');
        expect(link.getAttribute('href')).toBe('#hello-world');
    });

    test('construit la hiérarchie h2/h3 imbriquée', () => {
        const { tocHost } = buildPage();
        ScrollSpy.init(tocHost, { selector: 'main', headings: 'h2, h3' });
        const nested = tocHost.querySelector('.scrollspy__desktop .scrollspy__list .scrollspy__list');
        expect(nested).not.toBeNull();
        const h3Items = tocHost.querySelectorAll('.scrollspy__desktop .scrollspy__item--level-3');
        expect(h3Items.length).toBe(2);
    });

    test('setActive et getActive synchronisent aria-current', () => {
        const { tocHost } = buildPage();
        const instance = ScrollSpy.init(tocHost, { selector: 'main' }) as ScrollSpy;
        instance.setActive('getting-started', true);
        expect(instance.getActive()).toBe('getting-started');
        const active = tocHost.querySelector('.scrollspy__link--active') as HTMLAnchorElement;
        expect(active).not.toBeNull();
        expect(active.getAttribute('aria-current')).toBe('location');
    });

    test('refresh re-scanne les headings', () => {
        const { main, tocHost } = buildPage();
        const instance = ScrollSpy.init(tocHost, { selector: 'main' }) as ScrollSpy;
        (instance as unknown as { mutationObserver: MutationObserver | null }).mutationObserver?.disconnect();
        const extra = document.createElement('h2');
        extra.textContent = 'New Section';
        main.appendChild(extra);
        instance.refresh();
        const links = tocHost.querySelectorAll('.scrollspy__desktop .scrollspy__link');
        expect(links.length).toBe(4);
    });

    test('destroy nettoie les observers et l\'instance', () => {
        const { tocHost } = buildPage();
        const instance = ScrollSpy.init(tocHost, { selector: 'main' }) as ScrollSpy;
        const io = (global.IntersectionObserver as jest.Mock).mock.results[0]?.value as IntersectionObserverMock;
        instance.destroy();
        expect(io.disconnect).toHaveBeenCalled();
        expect((tocHost as HTMLElement & { K_ScrollSpy?: ScrollSpy }).K_ScrollSpy).toBeUndefined();
    });

    test('mode mobile affiche le trigger drawer', () => {
        const { tocHost } = buildPage();
        ScrollSpy.init(tocHost, { selector: 'main', mobileBreakpoint: 9999 });
        tocHost.classList.add('scrollspy--mobile');
        const trigger = tocHost.querySelector('.scrollspy__mobile-trigger') as HTMLButtonElement;
        expect(trigger).not.toBeNull();
        trigger.click();
        expect(tocHost.classList.contains('scrollspy--drawer-open')).toBe(true);
    });

    test('navigation clavier Flèches sans scroll immédiat', () => {
        const { tocHost } = buildPage();
        ScrollSpy.init(tocHost, { selector: 'main' });
        const links = Array.from(tocHost.querySelectorAll<HTMLAnchorElement>('.scrollspy__desktop .scrollspy__link'));
        const active = links.find((l) => l.classList.contains('scrollspy__link--active')) ?? links[0];
        active.focus();
        const nextIndex = links.indexOf(active) + 1;
        const scrollSpy = jest.spyOn(links[nextIndex], 'scrollIntoView');
        active.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
        expect(document.activeElement).toBe(links[nextIndex]);
        expect(scrollSpy).not.toHaveBeenCalled();
        scrollSpy.mockRestore();
    });

    test('reduced-motion désactive l\'animation de la pilule', () => {
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: jest.fn().mockImplementation((query: string) => ({
                matches: query.includes('prefers-reduced-motion'),
                media: query,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn(),
            })),
        });
        const { tocHost } = buildPage();
        const instance = ScrollSpy.init(tocHost, { selector: 'main' }) as ScrollSpy;
        instance.setActive('advanced', false);
        const pill = tocHost.querySelector('.scrollspy__desktop .scrollspy__pill') as HTMLElement;
        expect(pill.classList.contains('scrollspy__pill--static')).toBe(true);
    });

    test('IntersectionObserver active la section visible', () => {
        const { tocHost } = buildPage();
        const instance = ScrollSpy.init(tocHost, { selector: 'main' }) as ScrollSpy;
        Object.defineProperty(window, 'scrollY', { value: 200, configurable: true });
        const h2 = document.getElementById('advanced') as HTMLElement;
        const ioResult = (global.IntersectionObserver as jest.Mock).mock.results[0]?.value as IntersectionObserverMock;
        ioResult.trigger([{ isIntersecting: true, target: h2, boundingClientRect: { top: 100 } as DOMRectReadOnly }]);
        expect(instance.getActive()).toBe('advanced');
    });

    test('lit les attributs data-* déclaratifs', () => {
        document.body.innerHTML = `
            <main><h2>Section</h2></main>
            <k3ui-scrollspy data-selector="main" data-progress="true" data-offset="120"></k3ui-scrollspy>
        `;
        const tocHost = document.querySelector('k3ui-scrollspy') as HTMLElement;
        const instance = ScrollSpy.init(tocHost) as ScrollSpy;
        expect(instance.options.selector).toBe('main');
        expect(instance.options.progress).toBe(true);
        expect(instance.options.offset).toBe(120);
        expect(tocHost.classList.contains('scrollspy--progress')).toBe(true);
    });
});
