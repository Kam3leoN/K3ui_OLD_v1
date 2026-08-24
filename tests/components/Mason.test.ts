/// <reference types="jest" />
import { Mason } from '../../src/components/Mason';
import { createMockDOMRect } from '../helpers/dom-mocks';
import { waitMs } from '../helpers/menu-async';

describe('components/Mason', () => {
    test('destroy restaure les styles inline et supprime la classe racine', async () => {
        const container = document.createElement('div');

        container.getBoundingClientRect = jest.fn(() =>
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

        const item = document.createElement('div');
        item.className = 'm-item s2';

        Object.defineProperty(item, 'offsetHeight', {
            value: 100,
            configurable: true,
        });

        item.style.position = 'relative';
        item.style.left = '5px';
        item.style.top = '7px';
        item.style.width = '111px';
        item.style.height = '222px';
        item.style.transform = 'scale(2)';
        item.style.willChange = 'auto';

        container.appendChild(item);
        document.body.appendChild(container);

        const instance = new Mason(container, {
            itemsSelector: '.m-item',
            columns: 4,
            gap: 10,
            fallbackSpan: 4,
            itemsHeightStrategy: 'offsetHeight',
            positionMode: 'transform',
        });

        await waitMs(30);

        instance.destroy();

        expect(item.style.position).toBe('relative');
        expect(item.style.left).toBe('5px');
        expect(item.style.top).toBe('7px');
        expect(item.style.width).toBe('111px');
        expect(item.style.height).toBe('222px');
        expect(item.style.transform).toBe('scale(2)');
        expect(item.style.willChange).toBe('auto');

        expect(container.classList.contains('k3ui-mason')).toBe(false);
        expect(container.style.height).toBe('');
    });
});
