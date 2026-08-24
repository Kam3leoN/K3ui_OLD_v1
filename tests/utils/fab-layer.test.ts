/// <reference types="@types/jest" />
/**
 * Tests — chrome flottant : remontée uniquement à la collision footer
 */

import { initFloatingChromeInsets, setBodyNavigationBarOffset } from '../../src/utils/fab/layer';

function mockComputedStyle(map: Map<Element, Partial<CSSStyleDeclaration>>): jest.SpyInstance {
    return jest.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
        const base = map.get(el as Element) ?? {};
        const getPropertyValue =
            typeof base.getPropertyValue === 'function'
                ? base.getPropertyValue.bind(base)
                : () => '';
        return {
            display: 'block',
            position: 'static',
            visibility: 'visible',
            getPropertyValue,
            ...base,
        } as CSSStyleDeclaration;
    });
}

describe('fab layer — collision footer', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        document.body.style.cssText = '';
        document.body.className = '';
        Object.defineProperty(window, 'innerHeight', { value: 800, writable: true, configurable: true });
        jest.restoreAllMocks();
    });

    test('nav bar seule ne définit pas --k3ui-bottom-inset', () => {
        const nav = document.createElement('nav');
        nav.className = 'navigation-bar';
        document.body.appendChild(nav);
        Object.defineProperty(nav, 'offsetHeight', { value: 80, configurable: true });

        mockComputedStyle(
            new Map([
                [nav, { display: 'block', position: 'fixed', visibility: 'visible' }],
            ])
        );

        setBodyNavigationBarOffset();

        expect(document.body.style.getPropertyValue('--k3ui-navigation-bar-offset')).toBe('80px');
        expect(document.body.style.getPropertyValue('--k3ui-bottom-inset')).toBe('');
    });

    test('--k3ui-bottom-inset reflète le copyright visible au scroll', () => {
        const copyright = document.createElement('div');
        copyright.className = 'footer-copyright';
        document.body.appendChild(copyright);

        mockComputedStyle(
            new Map([
                [copyright, { display: 'flex', visibility: 'visible' }],
            ])
        );

        copyright.getBoundingClientRect = jest.fn(() => ({
            top: 760,
            bottom: 800,
            left: 0,
            right: 100,
            width: 100,
            height: 40,
            x: 0,
            y: 760,
            toJSON: () => ({}),
        }));

        setBodyNavigationBarOffset();

        expect(document.body.style.getPropertyValue('--k3ui-bottom-inset')).toBe('40px');
    });

    test('copyright hors viewport : pas de bottom-inset', () => {
        const copyright = document.createElement('div');
        copyright.className = 'footer-copyright';
        document.body.appendChild(copyright);

        mockComputedStyle(
            new Map([
                [copyright, { display: 'flex', visibility: 'visible' }],
            ])
        );

        copyright.getBoundingClientRect = jest.fn(() => ({
            top: 900,
            bottom: 950,
            left: 0,
            right: 100,
            width: 100,
            height: 50,
            x: 0,
            y: 900,
            toJSON: () => ({}),
        }));

        setBodyNavigationBarOffset();

        expect(document.body.style.getPropertyValue('--k3ui-bottom-inset')).toBe('');
    });

    test('docs-panes footer non révélé : pas de bottom-inset malgré copyright en bas du stack', () => {
        document.body.classList.add('docs-panes');

        const stack = document.createElement('div');
        stack.id = 'docs-layout-stack';
        stack.style.setProperty('--docs-footer-reveal', '0px');
        document.body.appendChild(stack);

        const copyright = document.createElement('div');
        copyright.className = 'footer-copyright';
        document.body.appendChild(copyright);

        mockComputedStyle(
            new Map([
                [
                    stack,
                    {
                        getPropertyValue: (prop: string) =>
                            prop === '--docs-footer-reveal' ? '0px' : '',
                    } as Partial<CSSStyleDeclaration>,
                ],
                [copyright, { display: 'flex', visibility: 'visible' }],
            ])
        );

        copyright.getBoundingClientRect = jest.fn(() => ({
            top: 760,
            bottom: 800,
            left: 0,
            right: 100,
            width: 100,
            height: 40,
            x: 0,
            y: 760,
            toJSON: () => ({}),
        }));

        setBodyNavigationBarOffset();

        expect(document.body.style.getPropertyValue('--k3ui-bottom-inset')).toBe('');
    });

    test('docs-panes footer révélé : bottom-inset actif', () => {
        document.body.classList.add('docs-panes');

        const stack = document.createElement('div');
        stack.id = 'docs-layout-stack';
        stack.style.setProperty('--docs-footer-reveal', '120px');
        document.body.appendChild(stack);

        const copyright = document.createElement('div');
        copyright.className = 'footer-copyright';
        document.body.appendChild(copyright);

        mockComputedStyle(
            new Map([
                [
                    stack,
                    {
                        getPropertyValue: (prop: string) =>
                            prop === '--docs-footer-reveal' ? '120px' : '',
                    } as Partial<CSSStyleDeclaration>,
                ],
                [copyright, { display: 'flex', visibility: 'visible' }],
            ])
        );

        copyright.getBoundingClientRect = jest.fn(() => ({
            top: 760,
            bottom: 800,
            left: 0,
            right: 100,
            width: 100,
            height: 40,
            x: 0,
            y: 760,
            toJSON: () => ({}),
        }));

        setBodyNavigationBarOffset();

        expect(document.body.style.getPropertyValue('--k3ui-bottom-inset')).toBe('40px');
    });

    test('init chrome flottant marque le body comme positionné (pas de slide depuis le haut)', () => {
        initFloatingChromeInsets();
        expect(document.body.classList.contains('k3ui-floating-chrome-positioned')).toBe(true);
    });
});
