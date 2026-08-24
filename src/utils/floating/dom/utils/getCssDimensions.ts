import type { Dimensions } from '../../core/utils';
import { round } from '../../core/utils';
import { getComputedStyle, isHTMLElement } from '../../utils-dom';

export function getCssDimensions(
    element: Element
): Dimensions & { $: boolean } {
    const css = getComputedStyle(element);
    let width = parseFloat((css as CSSStyleDeclaration & { width: string }).width) || 0;
    let height = parseFloat((css as CSSStyleDeclaration & { height: string }).height) || 0;
    const hasOffset = isHTMLElement(element);
    const offsetWidth = hasOffset ? (element as HTMLElement).offsetWidth : width;
    const offsetHeight = hasOffset ? (element as HTMLElement).offsetHeight : height;
    const shouldFallback =
        round(width) !== offsetWidth || round(height) !== offsetHeight;
    if (shouldFallback) {
        width = offsetWidth;
        height = offsetHeight;
    }
    return { width, height, $: shouldFallback };
}
