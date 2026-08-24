import type { Rect } from '../../core/utils';
import { getDocumentElement, getNodeScroll } from '../../utils-dom';

export function getWindowScrollBarX(element: Element, rect?: Rect): number {
    const docEl = getDocumentElement(element);
    const leftScroll = getNodeScroll(docEl).scrollLeft;
    if (!rect) {
        return docEl.getBoundingClientRect().left + leftScroll;
    }
    return rect.x + leftScroll;
}
