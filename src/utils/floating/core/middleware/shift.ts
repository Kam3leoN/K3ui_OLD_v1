import type { Coords } from '../utils';
import { clamp, evaluate, getOppositeAxis, getSide, getSideAxis } from '../utils';
import { originSides } from '../constants';
import type { DetectOverflowOptions } from '../detectOverflow';
import type { Derivable, Middleware, MiddlewareState } from '../types';

export interface ShiftOptions extends DetectOverflowOptions {
    mainAxis?: boolean;
    crossAxis?: boolean;
    limiter?: { fn: (state: MiddlewareState) => Coords; options?: unknown };
}

export const shift = (options: ShiftOptions | Derivable<ShiftOptions> = {}): Middleware => ({
    name: 'shift',
    options,
    async fn(state) {
        const { x, y, placement, platform } = state;
        const {
            mainAxis: checkMainAxis = true,
            crossAxis: checkCrossAxis = false,
            limiter = { fn: ({ x, y }: Coords) => ({ x, y }) },
            ...detectOverflowOptions
        } = evaluate(options, state);

        const coords = { x, y };
        const overflow = await platform.detectOverflow!(state, detectOverflowOptions);
        const crossAxis = getSideAxis(getSide(placement));
        const mainAxis = getOppositeAxis(crossAxis);

        let mainAxisCoord = coords[mainAxis];
        let crossAxisCoord = coords[crossAxis];

        if (checkMainAxis) {
            const minSide = mainAxis === 'y' ? 'top' : 'left';
            const maxSide = mainAxis === 'y' ? 'bottom' : 'right';
            mainAxisCoord = clamp(
                mainAxisCoord + overflow[minSide],
                mainAxisCoord,
                mainAxisCoord - overflow[maxSide]
            );
        }
        if (checkCrossAxis) {
            const minSide = crossAxis === 'y' ? 'top' : 'left';
            const maxSide = crossAxis === 'y' ? 'bottom' : 'right';
            crossAxisCoord = clamp(
                crossAxisCoord + overflow[minSide],
                crossAxisCoord,
                crossAxisCoord - overflow[maxSide]
            );
        }

        const limitedCoords = limiter.fn({
            ...state,
            [mainAxis]: mainAxisCoord,
            [crossAxis]: crossAxisCoord,
        });

        return {
            ...limitedCoords,
            data: {
                x: limitedCoords.x - x,
                y: limitedCoords.y - y,
                enabled: { [mainAxis]: checkMainAxis, [crossAxis]: checkCrossAxis },
            },
        };
    },
});

type LimitShiftOffset =
    | number
    | { mainAxis?: number; crossAxis?: number };

export interface LimitShiftOptions {
    offset?: LimitShiftOffset | Derivable<LimitShiftOffset>;
    mainAxis?: boolean;
    crossAxis?: boolean;
}

export const limitShift = (
    options: LimitShiftOptions | Derivable<LimitShiftOptions> = {}
): { options: unknown; fn: (state: MiddlewareState) => Coords } => ({
    options,
    fn(state) {
        const { x, y, placement, rects, middlewareData } = state;
        const {
            offset: offsetOpt = 0,
            mainAxis: checkMainAxis = true,
            crossAxis: checkCrossAxis = true,
        } = evaluate(options, state);

        const coords = { x, y };
        const crossAxis = getSideAxis(placement);
        const mainAxis = getOppositeAxis(crossAxis);
        let mainAxisCoord = coords[mainAxis];
        let crossAxisCoord = coords[crossAxis];

        const rawOffset = evaluate(offsetOpt, state);
        const computedOffset =
            typeof rawOffset === 'number'
                ? { mainAxis: rawOffset, crossAxis: 0 }
                : Object.assign(
                      { mainAxis: 0, crossAxis: 0 },
                      typeof rawOffset === 'object' && rawOffset !== null
                          ? (rawOffset as { mainAxis?: number; crossAxis?: number })
                          : {}
                  );

        if (checkMainAxis) {
            const len = mainAxis === 'y' ? 'height' : 'width';
            const limitMin =
                rects.reference[mainAxis] - rects.floating[len] + computedOffset.mainAxis;
            const limitMax =
                rects.reference[mainAxis] + rects.reference[len] - computedOffset.mainAxis;
            if (mainAxisCoord < limitMin) mainAxisCoord = limitMin;
            else if (mainAxisCoord > limitMax) mainAxisCoord = limitMax;
        }
        if (checkCrossAxis) {
            const len = mainAxis === 'y' ? 'width' : 'height';
            const isOriginSide = originSides.has(getSide(placement));
            const offsetData = middlewareData.offset as Record<string, number> | undefined;
            const limitMin =
                rects.reference[crossAxis] -
                rects.floating[len] +
                (isOriginSide ? offsetData?.[crossAxis] || 0 : 0) +
                (isOriginSide ? 0 : computedOffset.crossAxis);
            const limitMax =
                rects.reference[crossAxis] +
                rects.reference[len] +
                (isOriginSide ? 0 : offsetData?.[crossAxis] || 0) -
                (isOriginSide ? computedOffset.crossAxis : 0);
            if (crossAxisCoord < limitMin) crossAxisCoord = limitMin;
            else if (crossAxisCoord > limitMax) crossAxisCoord = limitMax;
        }

        return { [mainAxis]: mainAxisCoord, [crossAxis]: crossAxisCoord } as Coords;
    },
});
