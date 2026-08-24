/**
 * Mocks DOM typés pour jsdom (NodeList, DOMRect, …) — LOT 5.
 */

/** NodeList minimal compatible avec `Component.init`. */
export function createMockNodeList<T extends Element>(items: T[]): NodeListOf<T> {
    const list: NodeListOf<T> & Record<number, T> = {
        length: items.length,
        item: (index: number) => items[index] ?? null,
        forEach: (callback, thisArg) => {
            items.forEach((el, index) => callback.call(thisArg, el, index, list));
        },
        entries: () => items.entries(),
        keys: () => items.keys(),
        values: () => items.values(),
        [Symbol.iterator]: () => items[Symbol.iterator](),
    } as NodeListOf<T> & Record<number, T>;

    items.forEach((el, index) => {
        list[index] = el;
    });

    return list;
}

/** DOMRect partiel pour `getBoundingClientRect` mocké. */
export function createMockDOMRect(overrides: Partial<DOMRect> = {}): DOMRect {
    return {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        toJSON: () => ({}),
        ...overrides,
    } as DOMRect;
}
