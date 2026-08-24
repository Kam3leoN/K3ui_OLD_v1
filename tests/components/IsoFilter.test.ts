/// <reference types="jest" />
import { IsoFilter } from '../../src/components/IsoFilter';
import { Mason } from '../../src/components/Mason';
import { createMockDOMRect } from '../helpers/dom-mocks';
import { waitMs } from '../helpers/menu-async';

describe('components/IsoFilter', () => {
    test('destroy restaure hidden/opacity et nettoie l’état', async () => {
        // Mason root
        const masonRoot = document.createElement('div');
        masonRoot.getBoundingClientRect = jest.fn(() =>
            createMockDOMRect({
                width: 500,
                height: 0,
                top: 0,
                left: 0,
                right: 500,
                bottom: 0,
                x: 0,
                y: 0,
            })
        );

        const item1 = document.createElement('div');
        item1.className = 'm-item s2';
        item1.setAttribute('data-isofilter-id', '1');
        Object.defineProperty(item1, 'offsetHeight', { value: 100, configurable: true });

        const item2 = document.createElement('div');
        item2.className = 'm-item s2';
        item2.setAttribute('data-isofilter-id', '2');
        Object.defineProperty(item2, 'offsetHeight', { value: 120, configurable: true });

        masonRoot.appendChild(item1);
        masonRoot.appendChild(item2);
        document.body.appendChild(masonRoot);

        new Mason(masonRoot, {
            itemsSelector: '.m-item',
            columns: 4,
            gap: 10,
            fallbackSpan: 4,
            itemsHeightStrategy: 'offsetHeight',
            positionMode: 'transform',
        });
        await waitMs(30);

        const isoRoot = document.createElement('div');

        const btnAll = document.createElement('button');
        btnAll.setAttribute('data-isofilter-filter', 'all');
        isoRoot.appendChild(btnAll);

        const btnRed = document.createElement('button');
        btnRed.setAttribute('data-isofilter-filter', 'red');
        isoRoot.appendChild(btnRed);

        const source1 = document.createElement('div');
        source1.setAttribute('data-isofilter-id', '1');
        source1.setAttribute('data-isofilter-tags', 'red');
        isoRoot.appendChild(source1);

        const source2 = document.createElement('div');
        source2.setAttribute('data-isofilter-id', '2');
        source2.setAttribute('data-isofilter-tags', 'blue');
        isoRoot.appendChild(source2);

        document.body.appendChild(isoRoot);

        const iso = new IsoFilter(isoRoot, {});

        expect(item2.style.opacity).toBe('1');

        btnRed.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

        iso.destroy();

        expect(item2.getAttribute('data-k3ui-mason-hidden')).toBeNull();
        expect(item2.style.opacity).toBe('');

        expect(item1.getAttribute('data-k3ui-mason-hidden')).toBeNull();
        expect(item1.style.opacity).toBe('');

        expect(masonRoot.classList.contains('k3ui-mason--isofilter-animate')).toBe(false);

        btnRed.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        expect(item2.getAttribute('data-k3ui-mason-hidden')).toBeNull();
    });
});
