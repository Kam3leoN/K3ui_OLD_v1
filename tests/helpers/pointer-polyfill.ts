/**
 * Polyfills PointerEvent / Element.animate pour jsdom (LOT 5).
 */

type GlobalWithPolyfills = typeof globalThis & {
    PointerEvent?: typeof PointerEvent;
};

/** Installe PointerEvent et Element.animate si absents (idempotent). */
export function ensurePointerAndAnimatePolyfills(): void {
    const g: GlobalWithPolyfills =
        typeof globalThis !== 'undefined'
            ? globalThis
            : typeof window !== 'undefined'
              ? window
              : ({} as GlobalWithPolyfills);

    if (typeof g.PointerEvent === 'undefined') {
        g.PointerEvent = class PointerEvent extends MouseEvent {
            readonly pointerId: number;
            readonly width: number;
            readonly height: number;
            readonly pressure: number;

            constructor(type: string, params: PointerEventInit = {}) {
                super(type, params);
                this.pointerId = params.pointerId ?? 0;
                this.width = params.width ?? 1;
                this.height = params.height ?? 1;
                this.pressure = params.pressure ?? 0;
            }
        } as typeof PointerEvent;
    }

    if (typeof Element !== 'undefined' && !Element.prototype.animate) {
        Element.prototype.animate = () =>
            ({
                finish: () => Promise.resolve(),
                cancel: () => {},
            }) as Animation;
    }
}
