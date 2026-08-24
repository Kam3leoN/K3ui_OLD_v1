import type {
    Axis,
    ClientRectObject,
    Coords,
    Dimensions,
    ElementRects,
    Placement,
    Rect,
    SideObject,
    Strategy,
} from './utils';

type Promisable<T> = T | Promise<T>;

export type Derivable<T> = (state: MiddlewareState) => T;

export interface Platform {
    getElementRects: (args: {
        reference: ReferenceElement;
        floating: FloatingElement;
        strategy: Strategy;
    }) => Promisable<ElementRects>;
    getClippingRect: (args: {
        element: unknown;
        boundary: Boundary;
        rootBoundary: RootBoundary;
        strategy: Strategy;
    }) => Promisable<Rect>;
    getDimensions: (element: unknown) => Promisable<Dimensions>;
    convertOffsetParentRelativeRectToViewportRelativeRect?: (args: {
        elements?: Elements;
        rect: Rect;
        offsetParent: unknown;
        strategy: Strategy;
    }) => Promisable<Rect>;
    getOffsetParent?: (element: unknown) => Promisable<Element | Window | null>;
    isElement?: (value: unknown) => Promisable<boolean>;
    getDocumentElement?: (element: unknown) => Promisable<HTMLElement>;
    getClientRects?: (element: unknown) => Promisable<Array<ClientRectObject>>;
    isRTL?: (element: unknown) => Promisable<boolean>;
    getScale?: (element: unknown) => Promisable<{ x: number; y: number }>;
    detectOverflow?: (state: MiddlewareState, options?: unknown) => Promise<SideObject>;
}

export interface MiddlewareData {
    [key: string]: unknown;
    arrow?: Partial<Coords> & { centerOffset: number; alignmentOffset?: number };
    autoPlacement?: {
        index?: number;
        overflows: Array<{ placement: Placement; overflows: number[] }>;
    };
    flip?: {
        index?: number;
        overflows: Array<{ placement: Placement; overflows: number[] }>;
    };
    hide?: {
        referenceHidden?: boolean;
        escaped?: boolean;
        referenceHiddenOffsets?: SideObject;
        escapedOffsets?: SideObject;
    };
    offset?: Coords & { placement: Placement };
    shift?: Coords & { enabled: { [key in Axis]: boolean } };
}

export interface ComputePositionConfig {
    platform: Platform;
    placement?: Placement;
    strategy?: Strategy;
    middleware?: Array<Middleware>;
}

export interface ComputePositionReturn extends Coords {
    placement: Placement;
    strategy: Strategy;
    middlewareData: MiddlewareData;
}

export type ComputePosition = (
    reference: unknown,
    floating: unknown,
    config: ComputePositionConfig
) => Promise<ComputePositionReturn>;

export interface MiddlewareReturn extends Partial<Coords> {
    data?: { [key: string]: unknown };
    reset?: boolean | { placement?: Placement; rects?: boolean | ElementRects };
}

export type Middleware = {
    name: string;
    options?: unknown;
    fn: (state: MiddlewareState) => Promisable<MiddlewareReturn>;
};

export type ReferenceElement = unknown;
export type FloatingElement = unknown;

export interface Elements {
    reference: ReferenceElement;
    floating: FloatingElement;
}

export interface MiddlewareState extends Coords {
    initialPlacement: Placement;
    placement: Placement;
    strategy: Strategy;
    middlewareData: MiddlewareData;
    elements: Elements;
    rects: ElementRects;
    platform: Platform & { detectOverflow: (state: MiddlewareState, options?: unknown) => Promise<SideObject> };
}

export type MiddlewareArguments = MiddlewareState;

export type Boundary = 'clippingAncestors' | Element | Array<Element> | Rect;
export type RootBoundary = 'viewport' | 'document' | Rect;
export type ElementContext = 'reference' | 'floating';
