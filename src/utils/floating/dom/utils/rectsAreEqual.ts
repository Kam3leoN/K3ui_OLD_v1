import type { Rect } from '../../core/utils';

export function rectsAreEqual(a: Rect, b: Rect): boolean {
    return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}
