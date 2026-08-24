import type { Coords } from '../utils';
import { evaluate, getAlignment, getSide, getSideAxis } from '../utils';
import { originSides } from '../constants';
import type { Derivable, Middleware, MiddlewareState } from '../types';

export type OffsetValue =
    | number
    | {
          mainAxis?: number;
          crossAxis?: number;
          alignmentAxis?: number | null;
      };

export type OffsetOptions = OffsetValue | Derivable<OffsetValue>;

export async function convertValueToCoords(
    state: MiddlewareState,
    options: OffsetOptions
): Promise<Coords> {
    const { placement, platform, elements } = state;
    const rtl = await platform.isRTL?.(elements.floating);
    const side = getSide(placement);
    const alignment = getAlignment(placement);
    const isVertical = getSideAxis(placement) === 'y';
    const mainAxisMulti = originSides.has(side) ? -1 : 1;
    const crossAxisMulti = rtl && isVertical ? -1 : 1;
    const rawValue = evaluate(options, state);

    let { mainAxis = 0, crossAxis = 0, alignmentAxis = null } =
        typeof rawValue === 'number'
            ? { mainAxis: rawValue, crossAxis: 0, alignmentAxis: null }
            : {
                  mainAxis: (rawValue as OffsetValue & { mainAxis?: number }).mainAxis ?? 0,
                  crossAxis: (rawValue as OffsetValue & { crossAxis?: number }).crossAxis ?? 0,
                  alignmentAxis: (rawValue as OffsetValue & { alignmentAxis?: number | null }).alignmentAxis,
              };

    if (alignment && typeof alignmentAxis === 'number') {
        crossAxis = alignment === 'end' ? alignmentAxis * -1 : alignmentAxis;
    }

    return isVertical
        ? { x: crossAxis * crossAxisMulti, y: mainAxis * mainAxisMulti }
        : { x: mainAxis * mainAxisMulti, y: crossAxis * crossAxisMulti };
}

export const offset = (options: OffsetOptions = 0): Middleware => ({
    name: 'offset',
    options,
    async fn(state) {
        const { x, y, placement, middlewareData } = state;
        const diffCoords = await convertValueToCoords(state, options);
        if (
            placement === (middlewareData.offset as { placement?: string } | undefined)?.placement &&
            (middlewareData.arrow as { alignmentOffset?: number } | undefined)?.alignmentOffset
        ) {
            return {};
        }
        return {
            x: x + diffCoords.x,
            y: y + diffCoords.y,
            data: {
                ...diffCoords,
                placement,
            },
        };
    },
});
