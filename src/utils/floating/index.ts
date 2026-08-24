/**
 * Module floating K3UI : implémentation locale de Floating UI (sans dépendance @floating-ui/dom).
 * Comportement identique à la librairie officielle pour tooltips, menus, dialogs.
 */
import { computePosition as computePositionCore } from './core';
import type { ComputePositionConfig } from './dom/types';
import type { FloatingElement, ReferenceElement } from './dom/types';
import { platform } from './dom/platform';

export const computePosition = (
    reference: ReferenceElement,
    floating: FloatingElement,
    options?: Partial<ComputePositionConfig>
) => {
    const cache = new Map<Element, Element[]>();
    const mergedOptions = { platform, ...options };
    const platformWithCache = { ...mergedOptions.platform, _c: cache };
    return computePositionCore(reference, floating, {
        ...mergedOptions,
        platform: platformWithCache as ComputePositionConfig['platform'],
    });
};

export { autoUpdate } from './dom/autoUpdate';
export {
    arrow,
    autoPlacement,
    detectOverflow,
    flip,
    hide,
    inline,
    limitShift,
    offset,
    shift,
    size,
} from './dom/middleware';
export { getOverflowAncestors } from './utils-dom';

export type { Placement } from './core/utils';
export type { ComputePositionConfig, MiddlewareState } from './dom/types';
