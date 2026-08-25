/// <reference types="@jest/globals" />
/**
 * Tests unitaires pour le composant IndexList
 */

import { IndexList } from '../../src/components/IndexList';
import { LocaleManager } from '../../src/core/managers';

type IntersectionObserverMock = {
    observe: jest.Mock;
    disconnect: jest.Mock;
    trigger: (entries: Partial<IntersectionObserverEntry>[]) => void;
};

function setupIntersectionObserverMock(): IntersectionObserverMock {
    const instances: Array<(entries: IntersectionObserverEntry[]) => void> = [];
    const mock: IntersectionObserverMock = {
        observe: jest.fn(),
        disconnect: jest.fn(),
        trigger: (entries) => {
            const normalized = entries.map((e) => ({
                isIntersecting: e.isIntersecting ?? false,
                target: e.target as Element,
                boundingClientRect: e.boundingClientRect ?? ({ top: 0 } as DOMRectReadOnly),
                intersectionRatio: e.intersectionRatio ?? 0,
                intersectionRect: e.intersectionRect ?? ({} as DOMRectReadOnly),
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

describe('IndexList', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        LocaleManager.init('fr-FR');
        setupIntersectionObserverMock();
        Element.prototype.scrollIntoView = jest.fn();
    });

    afterEach(() => {
        document.querySelectorAll('.index-list').forEach((el) => {
            IndexList.getInstance(el as HTMLElement)?.destroy();
        });
        document.body.innerHTML = '';
    });

    it('regroupe les items plats par clé dans le bon ordre', () => {
        document.body.innerHTML = `
            <div class="index-list">
                <div class="index-list__content">
                    <div class="index-list__item">Bob</div>
                    <div class="index-list__item">Alice</div>
                    <div class="index-list__item">42 answer</div>
                    <div class="index-list__item">#tag</div>
                </div>
            </div>
        `;

        const host = document.querySelector('.index-list') as HTMLElement;
        IndexList.init(host);

        const sections = host.querySelectorAll('.index-list__section');
        expect(sections.length).toBe(4);

        const keys = Array.from(sections).map((s) => (s as HTMLElement).dataset.indexKey);
        expect(keys[0]).toBe('#');
        expect(keys[1]).toBe('4');
        expect(keys[2]).toBe('A');
        expect(keys[3]).toBe('B');
    });

    it('construit le rail avec les clés présentes uniquement', () => {
        document.body.innerHTML = `
            <div class="index-list">
                <div class="index-list__content">
                    <div class="index-list__item">Anna</div>
                    <div class="index-list__item">Ben</div>
                </div>
            </div>
        `;

        const host = document.querySelector('.index-list') as HTMLElement;
        IndexList.init(host);

        const railItems = host.querySelectorAll('.index-list__rail-item');
        expect(railItems.length).toBe(2);
        expect(railItems[0].textContent).toBe('A');
        expect(railItems[1].textContent).toBe('B');
    });

    it('scrollToKey active la section cible', () => {
        document.body.innerHTML = `
            <div class="index-list">
                <div class="index-list__content">
                    <div class="index-list__item">Anna</div>
                    <div class="index-list__item">Ben</div>
                </div>
            </div>
        `;

        const host = document.querySelector('.index-list') as HTMLElement;
        const instance = IndexList.init(host) as IndexList;

        instance.scrollToKey('B', true);
        expect(instance.getActiveKey()).toBe('B');
        expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    });

    it('setItems en mode data-driven regénère le contenu', () => {
        document.body.innerHTML = `<div class="index-list"><div class="index-list__content"></div></div>`;

        const host = document.querySelector('.index-list') as HTMLElement;
        const instance = IndexList.init(host) as IndexList;

        instance.setItems([
            { label: 'Zoe' },
            { label: 'Marc' },
        ]);

        expect(host.querySelectorAll('.index-list__section').length).toBe(2);
        expect(host.querySelector('[data-index-key="M"]')).toBeTruthy();
        expect(host.querySelector('[data-index-key="Z"]')).toBeTruthy();
    });

    it('destroy nettoie l’instance', () => {
        document.body.innerHTML = `
            <div class="index-list">
                <div class="index-list__content">
                    <div class="index-list__item">Anna</div>
                </div>
            </div>
        `;

        const host = document.querySelector('.index-list') as HTMLElement;
        const instance = IndexList.init(host) as IndexList;
        instance.destroy();

        expect(IndexList.getInstance(host)).toBeNull();
    });
});
