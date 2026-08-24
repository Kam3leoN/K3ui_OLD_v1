import type { Coords, SideObject } from '../core/utils';
import {
    arrow as arrowCore,
    autoPlacement as autoPlacementCore,
    detectOverflow as detectOverflowCore,
    flip as flipCore,
    hide as hideCore,
    inline as inlineCore,
    limitShift as limitShiftCore,
    offset as offsetCore,
    shift as shiftCore,
    size as sizeCore,
} from '../core';
import type {
    ArrowOptions,
    AutoPlacementOptions,
    Derivable,
    DetectOverflowOptions,
    FlipOptions,
    HideOptions,
    InlineOptions,
    LimitShiftOptions,
    Middleware,
    MiddlewareState,
    OffsetOptions,
    ShiftOptions,
    SizeOptions,
} from './types';

export const detectOverflow = detectOverflowCore as (
    state: MiddlewareState,
    options?: DetectOverflowOptions | Derivable<DetectOverflowOptions>
) => Promise<SideObject>;

export const offset = offsetCore as (options?: OffsetOptions) => Middleware;
export const autoPlacement = autoPlacementCore as (
    options?: AutoPlacementOptions | Derivable<AutoPlacementOptions>
) => Middleware;
export const shift = shiftCore as (
    options?: ShiftOptions | Derivable<ShiftOptions>
) => Middleware;
export const flip = flipCore as (
    options?: FlipOptions | Derivable<FlipOptions>
) => Middleware;
export const size = sizeCore as (
    options?: SizeOptions | Derivable<SizeOptions>
) => Middleware;
export const hide = hideCore as (
    options?: HideOptions | Derivable<HideOptions>
) => Middleware;
export const arrow = arrowCore as (options: ArrowOptions | Derivable<ArrowOptions>) => Middleware;
export const inline = inlineCore as (
    options?: InlineOptions | Derivable<InlineOptions>
) => Middleware;
export const limitShift = limitShiftCore as (
    options?: LimitShiftOptions | Derivable<LimitShiftOptions>
) => { options: unknown; fn: (state: MiddlewareState) => Coords };
export type { InlineOptions, LimitShiftOptions };
