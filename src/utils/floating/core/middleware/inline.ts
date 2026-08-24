import type { ClientRectObject, Padding } from '../utils';
import {
    evaluate,
    getPaddingObject,
    getSide,
    getSideAxis,
    max,
    min,
    rectToClientRect,
} from '../utils';
import type { Derivable, Middleware } from '../types';

function getBoundingRect(rects: Array<ClientRectObject>) {
    const minX = min(...rects.map((r) => r.left));
    const minY = min(...rects.map((r) => r.top));
    const maxX = max(...rects.map((r) => r.right));
    const maxY = max(...rects.map((r) => r.bottom));
    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
    };
}

export function getRectsByLine(rects: Array<ClientRectObject>) {
    const sortedRects = rects.slice().sort((a, b) => a.y - b.y);
    const groups: Array<ClientRectObject[]> = [];
    let prevRect: ClientRectObject | null = null;
    for (let i = 0; i < sortedRects.length; i++) {
        const rect = sortedRects[i];
        if (!prevRect || rect.y - prevRect.y > prevRect.height / 2) {
            groups.push([rect]);
        } else {
            groups[groups.length - 1].push(rect);
        }
        prevRect = rect;
    }
    return groups.map((rect) => rectToClientRect(getBoundingRect(rect)));
}

export interface InlineOptions {
    x?: number;
    y?: number;
    padding?: Padding;
}

export const inline = (options: InlineOptions | Derivable<InlineOptions> = {}): Middleware => ({
    name: 'inline',
    options,
    async fn(state) {
        const { placement, elements, rects, platform, strategy } = state;
        const { padding = 2, x, y } = evaluate(options, state);

        const nativeClientRects = Array.from(
            (await platform.getClientRects?.(elements.reference)) || []
        );
        const clientRects = getRectsByLine(nativeClientRects);
        const fallback = rectToClientRect(getBoundingRect(nativeClientRects));
        const paddingObject = getPaddingObject(padding);

        function getBoundingClientRect(): ClientRectObject {
            if (
                clientRects.length === 2 &&
                clientRects[0].left > clientRects[1].right &&
                x != null &&
                y != null
            ) {
                return (
                    clientRects.find(
                        (rect) =>
                            x > rect.left - paddingObject.left &&
                            x < rect.right + paddingObject.right &&
                            y > rect.top - paddingObject.top &&
                            y < rect.bottom + paddingObject.bottom
                    ) || fallback
                );
            }
            if (clientRects.length >= 2) {
                if (getSideAxis(placement) === 'y') {
                    const firstRect = clientRects[0];
                    const lastRect = clientRects[clientRects.length - 1];
                    const isTop = getSide(placement) === 'top';
                    return {
                        top: firstRect.top,
                        bottom: lastRect.bottom,
                        left: isTop ? firstRect.left : lastRect.left,
                        right: isTop ? firstRect.right : lastRect.right,
                        width: (isTop ? firstRect.right : lastRect.right) - (isTop ? firstRect.left : lastRect.left),
                        height: lastRect.bottom - firstRect.top,
                        x: isTop ? firstRect.left : lastRect.left,
                        y: firstRect.top,
                    };
                }
                const isLeftSide = getSide(placement) === 'left';
                const maxRight = max(...clientRects.map((r) => r.right));
                const minLeft = min(...clientRects.map((r) => r.left));
                const measureRects = clientRects.filter((r) =>
                    isLeftSide ? r.left === minLeft : r.right === maxRight
                );
                return {
                    top: measureRects[0].top,
                    bottom: measureRects[measureRects.length - 1].bottom,
                    left: minLeft,
                    right: maxRight,
                    width: maxRight - minLeft,
                    height: measureRects[measureRects.length - 1].bottom - measureRects[0].top,
                    x: minLeft,
                    y: measureRects[0].top,
                };
            }
            return fallback;
        }

        const resetRects = await platform.getElementRects({
            reference: { getBoundingClientRect },
            floating: elements.floating,
            strategy,
        });

        if (
            rects.reference.x !== resetRects.reference.x ||
            rects.reference.y !== resetRects.reference.y ||
            rects.reference.width !== resetRects.reference.width ||
            rects.reference.height !== resetRects.reference.height
        ) {
            return { reset: { rects: resetRects } };
        }
        return {};
    },
});
