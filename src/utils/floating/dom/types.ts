import type {
    ClientRectObject,
    Coords,
    Rect,
    SideObject,
    Strategy,
} from '../core/utils';
import type { InlineOptions as CoreInlineOptions } from '../core/middleware/inline';
import type { LimitShiftOptions as CoreLimitShiftOptions } from '../core/middleware/shift';
import type { RootBoundary } from '../core/types';
export type { RootBoundary } from '../core/types';
import type { DetectOverflowOptions as CoreDetectOverflowOptions } from '../core/detectOverflow';
import type { Middleware as CoreMiddleware, MiddlewareState as CoreMiddlewareState } from '../core/types';

type Promisable<T> = T | Promise<T>;

export type Derivable<T> = (state: MiddlewareState) => T;

export type DetectOverflowOptions = CoreDetectOverflowOptions & { boundary?: Boundary };

export interface VirtualElement {
    getBoundingClientRect(): ClientRectObject;
    getClientRects?(): DOMRect[] | DOMRectList;
    contextElement?: Element;
}

export type ReferenceElement = Element | VirtualElement;
export type FloatingElement = HTMLElement;

export interface Elements {
    reference: ReferenceElement;
    floating: FloatingElement;
}

export type Boundary = 'clippingAncestors' | Element | Element[] | Rect;

export type MiddlewareState = Omit<CoreMiddlewareState, 'elements'> & {
    elements: Elements;
};

export type Middleware = Omit<CoreMiddleware, 'fn'> & {
    fn(state: MiddlewareState): Promisable<{ x?: number; y?: number; data?: Record<string, unknown>; reset?: boolean | { placement?: import('../core/utils').Placement; rects?: boolean | import('../core/utils').ElementRects } }>;
};

export interface Platform {
    getElementRects: (args: {
        reference: ReferenceElement;
        floating: FloatingElement;
        strategy: Strategy;
    }) => Promisable<import('../core/utils').ElementRects>;
    getClippingRect: (args: {
        element: Element;
        boundary: Boundary;
        rootBoundary: RootBoundary;
        strategy: Strategy;
    }) => Promisable<Rect>;
    getDimensions: (element: Element) => Promisable<{ width: number; height: number }>;
    convertOffsetParentRelativeRectToViewportRelativeRect?: (args: {
        elements?: Elements;
        rect: Rect;
        offsetParent: Element | Window;
        strategy: Strategy;
    }) => Promisable<Rect>;
    getOffsetParent?: (
        element: Element,
        polyfill?: (element: HTMLElement) => Element | null
    ) => Promisable<Element | Window>;
    isElement?: (value: unknown) => Promisable<boolean>;
    getDocumentElement?: (element: Element) => Promisable<HTMLElement>;
    getClientRects?: (element: Element) => Promisable<ClientRectObject[]>;
    isRTL?: (element: Element) => Promisable<boolean>;
    getScale?: (element: HTMLElement) => Promisable<{ x: number; y: number }>;
}

export type ComputePositionConfig = import('../core/types').ComputePositionConfig & {
    middleware?: Middleware[];
    platform?: Platform;
};

export type OffsetOptions = import('../core/middleware/offset').OffsetOptions;
export type ShiftOptions = DetectOverflowOptions & {
    mainAxis?: boolean;
    crossAxis?: boolean;
    limiter?: { fn: (state: MiddlewareState) => Coords; options?: unknown };
};
export type FlipOptions = DetectOverflowOptions & {
    mainAxis?: boolean;
    crossAxis?: boolean | 'alignment';
    fallbackPlacements?: import('../core/utils').Placement[];
    fallbackStrategy?: 'bestFit' | 'initialPlacement';
    fallbackAxisSideDirection?: 'none' | 'start' | 'end';
    flipAlignment?: boolean;
};
export type SizeOptions = DetectOverflowOptions & {
    apply?(args: MiddlewareState & { availableWidth: number; availableHeight: number }): void | Promise<void>;
};
export type ArrowOptions = { element: Element; padding?: import('../core/utils').Padding };
export type AutoPlacementOptions = DetectOverflowOptions & {
    crossAxis?: boolean;
    alignment?: import('../core/utils').Alignment | null;
    autoAlignment?: boolean;
    allowedPlacements?: import('../core/utils').Placement[];
};
export type HideOptions = DetectOverflowOptions & { strategy?: 'referenceHidden' | 'escaped' };
export type InlineOptions = CoreInlineOptions;
export type LimitShiftOptions = CoreLimitShiftOptions;

export interface AutoUpdateOptions {
    ancestorScroll?: boolean;
    ancestorResize?: boolean;
    elementResize?: boolean;
    layoutShift?: boolean;
    animationFrame?: boolean;
}
