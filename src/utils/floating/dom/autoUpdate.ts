import { floor, max, min } from '../core/utils';
import { getDocumentElement, getOverflowAncestors } from '../utils-dom';
import type { FloatingElement, ReferenceElement } from './types';
import { getBoundingClientRect, rectsAreEqual, unwrapElement } from './platform';

export interface AutoUpdateOptions {
    ancestorScroll?: boolean;
    ancestorResize?: boolean;
    elementResize?: boolean;
    layoutShift?: boolean;
    animationFrame?: boolean;
}

function observeMove(element: Element, onMove: () => void): () => void {
    let io: IntersectionObserver | null = null;
    let timeoutId: ReturnType<typeof setTimeout>;
    const root = getDocumentElement(element);

    function cleanup() {
        clearTimeout(timeoutId);
        io?.disconnect();
        io = null;
    }

    function refresh(skip = false, threshold = 1) {
        cleanup();
        const elementRectForRootMargin = element.getBoundingClientRect();
        const { left, top, width, height } = elementRectForRootMargin;
        if (!skip) onMove();
        if (!width || !height) return;
        const insetTop = floor(top);
        const insetRight = floor(root.clientWidth - (left + width));
        const insetBottom = floor(root.clientHeight - (top + height));
        const insetLeft = floor(left);
        const rootMargin = `${-insetTop}px ${-insetRight}px ${-insetBottom}px ${-insetLeft}px`;
        const options = {
            rootMargin,
            threshold: max(0, min(1, threshold)) || 1,
        };
        let isFirstUpdate = true;
        function handleObserve(entries: IntersectionObserverEntry[]) {
            const ratio = entries[0].intersectionRatio;
            if (ratio !== threshold) {
                if (!isFirstUpdate) return refresh();
                if (!ratio) {
                    timeoutId = setTimeout(() => refresh(false, 1e-7), 1000);
                } else {
                    refresh(false, ratio);
                }
            }
            if (
                ratio === 1 &&
                !rectsAreEqual(
                    elementRectForRootMargin as unknown as { x: number; y: number; width: number; height: number },
                    element.getBoundingClientRect() as unknown as { x: number; y: number; width: number; height: number }
                )
            ) {
                refresh();
            }
            isFirstUpdate = false;
        }
        try {
            io = new IntersectionObserver(handleObserve, {
                ...options,
                root: root.ownerDocument,
            });
        } catch {
            io = new IntersectionObserver(handleObserve, options);
        }
        io.observe(element);
    }
    refresh(true);
    return cleanup;
}

export function autoUpdate(
    reference: ReferenceElement,
    floating: FloatingElement | null,
    update: () => void,
    options: AutoUpdateOptions = {}
): () => void {
    const {
        ancestorScroll = true,
        ancestorResize = true,
        elementResize = typeof ResizeObserver === 'function',
        layoutShift = typeof IntersectionObserver === 'function',
        animationFrame = false,
    } = options;

    const referenceEl = unwrapElement(reference as import('./types').VirtualElement);

    const ancestors =
        ancestorScroll || ancestorResize
            ? [
                  ...(referenceEl ? getOverflowAncestors(referenceEl) : []),
                  ...(floating ? getOverflowAncestors(floating) : []),
              ]
            : [];

    ancestors.forEach((ancestor) => {
        ancestorScroll &&
            ancestor.addEventListener('scroll', update, { passive: true });
        ancestorResize && ancestor.addEventListener('resize', update);
    });

    const cleanupIo =
        referenceEl && layoutShift ? observeMove(referenceEl, update) : null;

    let reobserveFrame = -1;
    let resizeObserver: ResizeObserver | null = null;

    if (elementResize) {
        resizeObserver = new ResizeObserver(([firstEntry]) => {
            if (
                firstEntry &&
                firstEntry.target === referenceEl &&
                resizeObserver &&
                floating
            ) {
                resizeObserver.unobserve(floating);
                cancelAnimationFrame(reobserveFrame);
                reobserveFrame = requestAnimationFrame(() => {
                    resizeObserver?.observe(floating);
                });
            }
            update();
        });
        if (referenceEl && !animationFrame) {
            resizeObserver.observe(referenceEl);
        }
        if (floating) {
            resizeObserver.observe(floating);
        }
    }

    let frameId: number;
    let prevRefRect: ReturnType<typeof getBoundingClientRect> | null = animationFrame
        ? getBoundingClientRect(reference as Element, false, false, null)
        : null;

    if (animationFrame) {
        function frameLoop() {
            const nextRefRect = getBoundingClientRect(
                reference as Element,
                false,
                false,
                null
            );
            if (prevRefRect && !rectsAreEqual(prevRefRect, nextRefRect)) {
                update();
            }
            prevRefRect = nextRefRect;
            frameId = requestAnimationFrame(frameLoop);
        }
        frameLoop();
    }

    update();

    return () => {
        ancestors.forEach((ancestor) => {
            ancestorScroll && ancestor.removeEventListener('scroll', update);
            ancestorResize && ancestor.removeEventListener('resize', update);
        });
        cleanupIo?.();
        resizeObserver?.disconnect();
        resizeObserver = null;
        if (animationFrame) {
            cancelAnimationFrame(frameId);
        }
    };
}
