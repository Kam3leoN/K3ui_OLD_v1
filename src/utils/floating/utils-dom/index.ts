/**
 * Utilitaires DOM pour floating (équivalent @floating-ui/utils/dom).
 * getOverflowAncestors, getDocumentElement, getWindow, etc.
 */

type OverflowAncestors = Array<Element | Window | VisualViewport>;

function hasWindow(): boolean {
    return typeof window !== 'undefined';
}

export function getNodeName(node: Node | Window): string {
    if (isNode(node)) {
        return (node.nodeName || '').toLowerCase();
    }
    return '#document';
}

export function getWindow(node: Node | Window | null | undefined): Window {
    return (node as Node & { ownerDocument?: Document })?.ownerDocument?.defaultView ?? window;
}

export function getDocumentElement(node: Node | Window): HTMLElement {
    const doc = (isNode(node) ? (node as Node).ownerDocument : (node as Window).document) ?? window.document;
    return doc.documentElement;
}

export function isNode(value: unknown): value is Node {
    if (!hasWindow() || typeof Node === 'undefined') return false;
    return value instanceof Node;
}

export function isElement(value: unknown): value is Element {
    if (!hasWindow() || typeof Element === 'undefined') return false;
    return value instanceof Element;
}

export function isHTMLElement(value: unknown): value is HTMLElement {
    if (!hasWindow() || typeof HTMLElement === 'undefined') return false;
    return value instanceof HTMLElement;
}

export function isShadowRoot(value: unknown): value is ShadowRoot {
    if (!hasWindow() || typeof ShadowRoot === 'undefined') return false;
    return value instanceof ShadowRoot;
}

const invalidOverflowDisplayValues = new Set(['inline', 'contents']);
export function isOverflowElement(element: Element): boolean {
    const { overflow, overflowX, overflowY, display } = getComputedStyle(element);
    return (
        /auto|scroll|overlay|hidden|clip/.test(overflow + overflowY + overflowX) &&
        !invalidOverflowDisplayValues.has(display)
    );
}

const tableElements = new Set(['table', 'td', 'th']);
export function isTableElement(element: Element): boolean {
    return tableElements.has(getNodeName(element));
}

const topLayerSelectors = [':popover-open', ':modal'];
export function isTopLayer(element: Element): boolean {
    return topLayerSelectors.some((selector) => {
        try {
            return element.matches(selector);
        } catch {
            return false;
        }
    });
}

const transformProperties = ['transform', 'translate', 'scale', 'rotate', 'perspective'];
const willChangeValues = ['transform', 'translate', 'scale', 'rotate', 'perspective', 'filter'];
const containValues = ['paint', 'layout', 'strict', 'content'];
export function isContainingBlock(elementOrCss: Element | CSSStyleDeclaration): boolean {
    const css = isElement(elementOrCss) ? getComputedStyle(elementOrCss) : elementOrCss;
    const styleRec = css as unknown as Record<string, string>;
    return (
        transformProperties.some((p) => styleRec[p] && styleRec[p] !== 'none') ||
        (styleRec.containerType && styleRec.containerType !== 'normal') ||
        (!isWebKit() && styleRec.backdropFilter && styleRec.backdropFilter !== 'none') ||
        (!isWebKit() && styleRec.filter && styleRec.filter !== 'none') ||
        willChangeValues.some((v) => (styleRec.willChange || '').includes(v)) ||
        containValues.some((v) => (css.contain || '').includes(v))
    );
}

export function getContainingBlock(element: Element): HTMLElement | null {
    let currentNode: Node | null = getParentNode(element);
    while (isHTMLElement(currentNode) && !isLastTraversableNode(currentNode)) {
        if (isContainingBlock(currentNode)) return currentNode;
        if (isTopLayer(currentNode)) return null;
        currentNode = getParentNode(currentNode);
    }
    return null;
}

let isWebKitValue: boolean | undefined;
export function isWebKit(): boolean {
    if (isWebKitValue == null) {
        isWebKitValue =
            typeof CSS !== 'undefined' &&
            !!CSS.supports &&
            CSS.supports('-webkit-backdrop-filter', 'none');
    }
    return isWebKitValue;
}

const lastTraversableNodeNames = new Set(['html', 'body', '#document']);
export function isLastTraversableNode(node: Node): boolean {
    return lastTraversableNodeNames.has(getNodeName(node));
}

export function getComputedStyle(element: Element): CSSStyleDeclaration {
    return getWindow(element).getComputedStyle(element);
}

export function getNodeScroll(element: Element | Window): { scrollLeft: number; scrollTop: number } {
    if (isElement(element)) {
        return { scrollLeft: element.scrollLeft, scrollTop: element.scrollTop };
    }
    return { scrollLeft: (element as Window).scrollX, scrollTop: (element as Window).scrollY };
}

export function getParentNode(node: Node): Node {
    if (getNodeName(node) === 'html') return node;
    const n = node as Node & { assignedSlot?: Element };
    const result =
        n.assignedSlot ??
        node.parentNode ??
        (isShadowRoot(node) ? (node as ShadowRoot).host : null) ??
        getDocumentElement(node);
    return isShadowRoot(result) ? (result as ShadowRoot).host : (result as Node);
}

export function getNearestOverflowAncestor(node: Node): HTMLElement {
    const parentNode = getParentNode(node);
    if (isLastTraversableNode(parentNode)) {
        return node.ownerDocument?.body ?? (node as Document).body;
    }
    if (isHTMLElement(parentNode) && isOverflowElement(parentNode)) {
        return parentNode;
    }
    return getNearestOverflowAncestor(parentNode);
}

export function getOverflowAncestors(
    node: Node,
    list: OverflowAncestors = [],
    traverseIframes = true
): OverflowAncestors {
    const scrollableAncestor = getNearestOverflowAncestor(node);
    const isBody = scrollableAncestor === node.ownerDocument?.body;
    const win = getWindow(scrollableAncestor);
    if (isBody) {
        const frameElement = getFrameElement(win);
        return list.concat(
            win,
            win.visualViewport ? [win.visualViewport] : [],
            isOverflowElement(scrollableAncestor) ? [scrollableAncestor] : [],
            frameElement && traverseIframes ? getOverflowAncestors(frameElement) : []
        );
    }
    return list.concat(
        scrollableAncestor,
        getOverflowAncestors(scrollableAncestor, [], traverseIframes)
    );
}

export function getFrameElement(win: Window): Element | null {
    return win.parent && Object.getPrototypeOf(win.parent) ? (win as Window & { frameElement?: Element }).frameElement ?? null : null;
}
