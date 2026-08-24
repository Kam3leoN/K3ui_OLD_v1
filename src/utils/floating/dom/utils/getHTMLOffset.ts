import { getDocumentElement } from '../../utils-dom';
import { getNodeScroll } from '../../utils-dom';
import { getWindowScrollBarX } from './getWindowScrollBarX';

export function getHTMLOffset(
    documentElement: HTMLElement,
    scroll: { scrollLeft: number; scrollTop: number }
): { x: number; y: number } {
    const htmlRect = documentElement.getBoundingClientRect();
    const x =
        htmlRect.left + scroll.scrollLeft - getWindowScrollBarX(documentElement, htmlRect);
    const y = htmlRect.top + scroll.scrollTop;
    return { x, y };
}
