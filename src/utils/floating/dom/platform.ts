/**
 * Implémentation de la plateforme DOM pour Floating UI (getElementRects, getClippingRect, etc.)
 */
import { createCoords, max, min, rectToClientRect } from '../core/utils';
import type { Rect, Strategy } from '../core/utils';
import {
    getComputedStyle,
    getContainingBlock,
    getDocumentElement,
    getFrameElement,
    getNodeName,
    getNodeScroll,
    getOverflowAncestors,
    getParentNode,
    getWindow,
    isContainingBlock,
    isElement,
    isHTMLElement,
    isLastTraversableNode,
    isOverflowElement,
    isTableElement,
    isTopLayer,
    isWebKit,
} from '../utils-dom';
import type { Boundary, Elements, Platform, ReferenceElement, RootBoundary } from './types';
import type { VirtualElement } from './types';
import { getCssDimensions } from './utils/getCssDimensions';
import { getHTMLOffset } from './utils/getHTMLOffset';
import { getScale } from './utils/getScale';
import { getWindowScrollBarX } from './utils/getWindowScrollBarX';
import { getVisualOffsets } from './utils/getVisualOffsets';
import { isStaticPositioned } from './utils/isStaticPositioned';
import { unwrapElement } from './utils/unwrapElement';

const SCROLLBAR_MAX = 25;
const absoluteOrFixed = new Set<string>(['absolute', 'fixed']);

function getDimensions(element: Element): { width: number; height: number } {
    const { width, height } = getCssDimensions(element);
    return { width, height };
}

function shouldAddVisualOffsets(
    element: Element,
    isFixed: boolean,
    floatingOffsetParent: Element | Window | null
): boolean {
    if (!floatingOffsetParent || (isFixed && floatingOffsetParent !== getWindow(element)))
        return false;
    return isFixed;
}

function getBoundingClientRect(
    element: Element | VirtualElement,
    includeScale: boolean,
    isFixedStrategy: boolean,
    offsetParent: Element | Window | null
): Rect & { top: number; left: number; right: number; bottom: number } {
    const clientRect = (unwrapElement(element as VirtualElement) as HTMLElement).getBoundingClientRect();
    const domElement = unwrapElement(element as VirtualElement);
    let scale = createCoords(1);
    if (includeScale) {
        if (offsetParent && isElement(offsetParent)) {
            scale = getScale(offsetParent as HTMLElement);
        } else if (domElement) {
            scale = getScale(domElement as HTMLElement);
        }
    }
    const visualOffsets = shouldAddVisualOffsets(
        domElement,
        isFixedStrategy,
        offsetParent
    )
        ? getVisualOffsets(domElement)
        : createCoords(0);
    let x = (clientRect.left + visualOffsets.x) / scale.x;
    let y = (clientRect.top + visualOffsets.y) / scale.y;
    let width = clientRect.width / scale.x;
    let height = clientRect.height / scale.y;
    if (domElement) {
        const win = getWindow(domElement);
        const offsetWin =
            offsetParent && isElement(offsetParent)
                ? getWindow(offsetParent as Element)
                : offsetParent;
        let currentWin = win;
        let currentIFrame = getFrameElement(currentWin);
        while (
            currentIFrame &&
            offsetParent &&
            offsetWin !== currentWin
        ) {
            const iframeScale = getScale(currentIFrame);
            const iframeRect = currentIFrame.getBoundingClientRect();
            const css = getComputedStyle(currentIFrame);
            const left =
                iframeRect.left +
                (currentIFrame.clientLeft +
                    parseFloat((css as CSSStyleDeclaration & { paddingLeft: string }).paddingLeft)) *
                    iframeScale.x;
            const top =
                iframeRect.top +
                (currentIFrame.clientTop +
                    parseFloat((css as CSSStyleDeclaration & { paddingTop: string }).paddingTop)) *
                    iframeScale.y;
            x *= iframeScale.x;
            y *= iframeScale.y;
            width *= iframeScale.x;
            height *= iframeScale.y;
            x += left;
            y += top;
            currentWin = getWindow(currentIFrame);
            currentIFrame = getFrameElement(currentWin);
        }
    }
    const r = { width, height, x, y };
    return {
        ...r,
        top: y,
        left: x,
        right: x + width,
        bottom: y + height,
    };
}

function getDocumentRect(element: Element): Rect {
    const html = getDocumentElement(element);
    const scroll = getNodeScroll(html);
    const body = (element as Element & { ownerDocument?: Document }).ownerDocument?.body!;
    const width = max(
        html.scrollWidth,
        html.clientWidth,
        body.scrollWidth,
        body.clientWidth
    );
    const height = max(
        html.scrollHeight,
        html.clientHeight,
        body.scrollHeight,
        body.clientHeight
    );
    let x = -scroll.scrollLeft + getWindowScrollBarX(html);
    const y = -scroll.scrollTop;
    if (getComputedStyle(body).direction === 'rtl') {
        x += max(html.clientWidth, body.clientWidth) - width;
    }
    return { width, height, x, y };
}

function getViewportRect(element: Element, strategy: Strategy): Rect {
    const win = getWindow(element);
    const html = getDocumentElement(element);
    const visualViewport = win.visualViewport;
    let width = html.clientWidth;
    let height = html.clientHeight;
    let x = 0;
    let y = 0;
    if (visualViewport) {
        width = visualViewport.width;
        height = visualViewport.height;
        const visualViewportBased = isWebKit();
        if (!visualViewportBased || (visualViewportBased && strategy === 'fixed')) {
            x = visualViewport.offsetLeft;
            y = visualViewport.offsetTop;
        }
    }
    const windowScrollbarX = getWindowScrollBarX(html);
    if (windowScrollbarX <= 0) {
        const doc = html.ownerDocument;
        const body = doc.body;
        const bodyStyles = getComputedStyle(body);
        const bodyMarginInline =
            doc.compatMode === 'CSS1Compat'
                ? parseFloat((bodyStyles as CSSStyleDeclaration & { marginLeft: string }).marginLeft) +
                  parseFloat((bodyStyles as CSSStyleDeclaration & { marginRight: string }).marginRight) || 0
                : 0;
        const clippingStableScrollbarWidth = Math.abs(
            html.clientWidth - body.clientWidth - bodyMarginInline
        );
        if (clippingStableScrollbarWidth <= SCROLLBAR_MAX) {
            width -= clippingStableScrollbarWidth;
        }
    } else if (windowScrollbarX <= SCROLLBAR_MAX) {
        width += windowScrollbarX;
    }
    return { width, height, x, y };
}

function getInnerBoundingClientRect(element: HTMLElement, strategy: Strategy): Rect {
    const clientRect = getBoundingClientRect(
        element,
        true,
        strategy === 'fixed',
        null
    );
    const top = clientRect.top + element.clientTop;
    const left = clientRect.left + element.clientLeft;
    const scale = getScale(element);
    const width = element.clientWidth * scale.x;
    const height = element.clientHeight * scale.y;
    return {
        width,
        height,
        x: left * scale.x,
        y: top * scale.y,
    };
}

function getClientRectFromClippingAncestor(
    element: Element,
    clippingAncestor: RootBoundary | Element | Rect,
    strategy: Strategy
): { top: number; right: number; bottom: number; left: number; width: number; height: number } {
    if (clippingAncestor === 'viewport') {
        return rectToClientRect(getViewportRect(element, strategy));
    }
    if (clippingAncestor === 'document') {
        return rectToClientRect(getDocumentRect(getDocumentElement(element)));
    }
    if (isElement(clippingAncestor)) {
        return rectToClientRect(
            getInnerBoundingClientRect(clippingAncestor as HTMLElement, strategy)
        );
    }
    const visualOffsets = getVisualOffsets(element);
    const r = clippingAncestor as Rect;
    return rectToClientRect({
        x: r.x - visualOffsets.x,
        y: r.y - visualOffsets.y,
        width: r.width,
        height: r.height,
    });
}

function hasFixedPositionAncestor(element: Element, stopNode: Node): boolean {
    const parentNode = getParentNode(element);
    if (
        parentNode === stopNode ||
        !isElement(parentNode) ||
        isLastTraversableNode(parentNode)
    ) {
        return false;
    }
    return (
        getComputedStyle(parentNode as Element).position === 'fixed' ||
        hasFixedPositionAncestor(parentNode as Element, stopNode)
    );
}

function getClippingElementAncestors(
    element: Element,
    cache: Map<Element, Element[]>
): Element[] {
    const cachedResult = cache.get(element);
    if (cachedResult) return cachedResult;
    let result = getOverflowAncestors(element, [], false).filter(
        (el): el is Element => isElement(el) && getNodeName(el) !== 'body'
    );
    let currentContainingBlockComputedStyle: CSSStyleDeclaration | null = null;
    const elementIsFixed = getComputedStyle(element).position === 'fixed';
    let currentNode: Node | null = elementIsFixed ? getParentNode(element) : element;
    while (isElement(currentNode) && !isLastTraversableNode(currentNode)) {
        const computedStyle = getComputedStyle(currentNode);
        const currentNodeIsContaining = isContainingBlock(currentNode);
        if (!currentNodeIsContaining && computedStyle.position === 'fixed') {
            currentContainingBlockComputedStyle = null;
        }
        const shouldDropCurrentNode = elementIsFixed
            ? !currentNodeIsContaining && !currentContainingBlockComputedStyle
            : (!currentNodeIsContaining &&
                  computedStyle.position === 'static' &&
                  !!currentContainingBlockComputedStyle &&
                  absoluteOrFixed.has(currentContainingBlockComputedStyle.position)) ||
              (isOverflowElement(currentNode) &&
                  !currentNodeIsContaining &&
                  hasFixedPositionAncestor(element, currentNode));
        if (shouldDropCurrentNode) {
            result = result.filter((ancestor) => ancestor !== currentNode);
        } else {
            currentContainingBlockComputedStyle = computedStyle;
        }
        currentNode = getParentNode(currentNode);
    }
    cache.set(element, result);
    return result;
}

function getClippingRect(this: Platform & { _c?: Map<Element, Element[]> }, args: {
    element: Element;
    boundary: Boundary;
    rootBoundary: RootBoundary;
    strategy: Strategy;
}): Rect {
    const { element, boundary, rootBoundary, strategy } = args;
    const cache = this._c ?? new Map();
    const elementClippingAncestors =
        boundary === 'clippingAncestors'
            ? isTopLayer(element)
                ? []
                : getClippingElementAncestors(element, cache)
            : Array.isArray(boundary)
              ? boundary
              : [boundary as Element];
    const clippingAncestors = [...elementClippingAncestors, rootBoundary];
    const firstClippingAncestor = clippingAncestors[0];
    const clippingRect = clippingAncestors.reduce(
        (accRect, clippingAncestor) => {
            const rect = getClientRectFromClippingAncestor(
                element,
                clippingAncestor as RootBoundary | Element | Rect,
                strategy
            );
            accRect.top = max(rect.top, accRect.top);
            accRect.right = min(rect.right, accRect.right);
            accRect.bottom = min(rect.bottom, accRect.bottom);
            accRect.left = max(rect.left, accRect.left);
            return accRect;
        },
        getClientRectFromClippingAncestor(
            element,
            firstClippingAncestor as RootBoundary | Element | Rect,
            strategy
        )
    );
    return {
        width: clippingRect.right - clippingRect.left,
        height: clippingRect.bottom - clippingRect.top,
        x: clippingRect.left,
        y: clippingRect.top,
    };
}

function getRectRelativeToOffsetParent(
    element: Element | VirtualElement,
    offsetParent: Element | Window,
    strategy: Strategy
): Rect {
    const isOffsetParentAnElement = isHTMLElement(offsetParent);
    const documentElement = getDocumentElement(offsetParent as Element);
    const isFixed = strategy === 'fixed';
    const rect = getBoundingClientRect(
        element,
        true,
        isFixed,
        offsetParent
    );
    let scroll = { scrollLeft: 0, scrollTop: 0 };
    const offsets = createCoords(0);
    function setLeftRTLScrollbarOffset() {
        offsets.x = getWindowScrollBarX(documentElement);
    }
    if (isOffsetParentAnElement || (!isOffsetParentAnElement && !isFixed)) {
        if (
            getNodeName(offsetParent as Element) !== 'body' ||
            isOverflowElement(documentElement)
        ) {
            scroll = getNodeScroll(offsetParent as Element);
        }
        if (isOffsetParentAnElement) {
            const offsetRect = getBoundingClientRect(
                offsetParent as Element,
                true,
                isFixed,
                offsetParent
            );
            offsets.x = offsetRect.x + (offsetParent as HTMLElement).clientLeft;
            offsets.y = offsetRect.y + (offsetParent as HTMLElement).clientTop;
        } else if (documentElement) {
            setLeftRTLScrollbarOffset();
        }
    }
    if (isFixed && !isOffsetParentAnElement && documentElement) {
        setLeftRTLScrollbarOffset();
    }
    const htmlOffset =
        documentElement && !isOffsetParentAnElement && !isFixed
            ? getHTMLOffset(documentElement, scroll)
            : createCoords(0);
    return {
        x: rect.left + scroll.scrollLeft - offsets.x - htmlOffset.x,
        y: rect.top + scroll.scrollTop - offsets.y - htmlOffset.y,
        width: rect.width,
        height: rect.height,
    };
}

function convertOffsetParentRelativeRectToViewportRelativeRect(args: {
    elements?: Elements;
    rect: Rect;
    offsetParent: Element | Window;
    strategy: Strategy;
}): Rect {
    const { elements, rect, offsetParent, strategy } = args;
    const isFixed = strategy === 'fixed';
    const documentElement = getDocumentElement(offsetParent as Element);
    const topLayer = elements ? isTopLayer(elements.floating) : false;
    if (offsetParent === documentElement || (topLayer && isFixed)) {
        return rect;
    }
    let scroll = { scrollLeft: 0, scrollTop: 0 };
    let scale = createCoords(1);
    const offsets = createCoords(0);
    const isOffsetParentAnElement = isHTMLElement(offsetParent);
    if (isOffsetParentAnElement || (!isOffsetParentAnElement && !isFixed)) {
        if (
            getNodeName(offsetParent as Element) !== 'body' ||
            isOverflowElement(documentElement)
        ) {
            scroll = getNodeScroll(offsetParent as Element);
        }
        if (isHTMLElement(offsetParent)) {
            const offsetRect = getBoundingClientRect(
                offsetParent as Element,
                true,
                isFixed,
                null
            );
            scale = getScale(offsetParent as HTMLElement);
            offsets.x = offsetRect.x + (offsetParent as HTMLElement).clientLeft;
            offsets.y = offsetRect.y + (offsetParent as HTMLElement).clientTop;
        }
    }
    const htmlOffset =
        documentElement && !isOffsetParentAnElement && !isFixed
            ? getHTMLOffset(documentElement, scroll)
            : createCoords(0);
    return {
        width: rect.width * scale.x,
        height: rect.height * scale.y,
        x: rect.x * scale.x - scroll.scrollLeft * scale.x + offsets.x + htmlOffset.x,
        y: rect.y * scale.y - scroll.scrollTop * scale.y + offsets.y + htmlOffset.y,
    };
}

function getTrueOffsetParent(
    element: HTMLElement,
    polyfill?: (element: HTMLElement) => Element | null
): Element | null {
    if (!isHTMLElement(element) || getComputedStyle(element).position === 'fixed') {
        return null;
    }
    if (polyfill) return polyfill(element);
    let rawOffsetParent = element.offsetParent;
    if (getDocumentElement(element) === rawOffsetParent) {
        rawOffsetParent = rawOffsetParent!.ownerDocument!.body;
    }
    return rawOffsetParent;
}

function getOffsetParent(
    element: Element,
    polyfill?: (element: HTMLElement) => Element | null
): Element | Window {
    const win = getWindow(element);
    if (isTopLayer(element)) return win;
    if (!isHTMLElement(element)) {
        let svgOffsetParent = getParentNode(element);
        while (svgOffsetParent && !isLastTraversableNode(svgOffsetParent)) {
            if (
                isElement(svgOffsetParent) &&
                !isStaticPositioned(svgOffsetParent as Element)
            ) {
                return svgOffsetParent as Element;
            }
            svgOffsetParent = getParentNode(svgOffsetParent);
        }
        return win;
    }
    let offsetParent = getTrueOffsetParent(element as HTMLElement, polyfill);
    while (
        offsetParent &&
        isTableElement(offsetParent) &&
        isStaticPositioned(offsetParent)
    ) {
        offsetParent = getTrueOffsetParent(offsetParent as HTMLElement, polyfill);
    }
    if (
        offsetParent &&
        isLastTraversableNode(offsetParent) &&
        isStaticPositioned(offsetParent) &&
        !isContainingBlock(offsetParent)
    ) {
        return win;
    }
    return offsetParent || getContainingBlock(element) || win;
}

async function getElementRects(this: Platform, data: {
    reference: ReferenceElement;
    floating: HTMLElement;
    strategy: Strategy;
}) {
    const getOffsetParentFn = this.getOffsetParent ?? getOffsetParent;
    const getDimensionsFn = this.getDimensions ?? getDimensions;
    const floatingDimensions = await getDimensionsFn(data.floating);
    return {
        reference: getRectRelativeToOffsetParent(
            data.reference,
            await getOffsetParentFn(data.floating),
            data.strategy
        ),
        floating: {
            x: 0,
            y: 0,
            width: floatingDimensions.width,
            height: floatingDimensions.height,
        },
    };
}

function isRTL(element: Element): boolean {
    return getComputedStyle(element).direction === 'rtl';
}

function getClientRects(element: Element): import('../core/utils').ClientRectObject[] {
    return Array.from((element as HTMLElement).getClientRects());
}

export const platform: Platform = {
    getElementRects,
    getClippingRect,
    getDimensions,
    convertOffsetParentRelativeRectToViewportRelativeRect,
    getOffsetParent,
    getDocumentElement: (el) => Promise.resolve(getDocumentElement(el)),
    getClientRects: (el) => Promise.resolve(getClientRects(el)),
    isElement: (v) => Promise.resolve(isElement(v)),
    isRTL: (el) => Promise.resolve(isRTL(el)),
    getScale: (el) => Promise.resolve(getScale(el)),
};

import { rectsAreEqual } from './utils/rectsAreEqual';

export { getBoundingClientRect, rectsAreEqual, unwrapElement };
