import type { Padding } from '../utils';
import {
    clamp,
    evaluate,
    getAlignment,
    getAlignmentAxis,
    getAxisLength,
    getPaddingObject,
    min as mathMin,
} from '../utils';
import type { Derivable, Middleware } from '../types';

export interface ArrowOptions {
    element: Element;
    padding?: Padding;
}

export const arrow = (options: ArrowOptions | Derivable<ArrowOptions>): Middleware => ({
    name: 'arrow',
    options,
    async fn(state) {
        const { x, y, placement, rects, platform, elements, middlewareData } = state;
        const { element, padding = 0 } = evaluate(options, state) || {};
        if (element == null) return {};

        const paddingObject = getPaddingObject(padding);
        const coords = { x, y };
        const axis = getAlignmentAxis(placement);
        const length = getAxisLength(axis);
        const arrowDimensions = await platform.getDimensions(element);
        const isYAxis = axis === 'y';
        const minProp = isYAxis ? 'top' : 'left';
        const maxProp = isYAxis ? 'bottom' : 'right';
        const clientProp = isYAxis ? 'clientHeight' : 'clientWidth';

        const endDiff =
            rects.reference[length] + rects.reference[axis] - coords[axis] - rects.floating[length];
        const startDiff = coords[axis] - rects.reference[axis];

        const arrowOffsetParent = await platform.getOffsetParent?.(element);
        let clientSize = arrowOffsetParent && typeof arrowOffsetParent === 'object' && clientProp in arrowOffsetParent
            ? (arrowOffsetParent as HTMLElement)[clientProp as 'clientHeight' | 'clientWidth']
            : 0;

        if (!clientSize || !(await platform.isElement?.(arrowOffsetParent))) {
            const fl = elements.floating as HTMLElement;
            clientSize = (fl?.[clientProp as keyof HTMLElement] as number) ?? rects.floating[length];
        }

        const centerToReference = endDiff / 2 - startDiff / 2;
        const largestPossiblePadding = clientSize / 2 - arrowDimensions[length] / 2 - 1;
        const minPadding = mathMin(paddingObject[minProp], largestPossiblePadding);
        const maxPadding = mathMin(paddingObject[maxProp], largestPossiblePadding);
        const minVal = minPadding;
        const maxVal = clientSize - arrowDimensions[length] - maxPadding;
        const center = clientSize / 2 - arrowDimensions[length] / 2 + centerToReference;
        const offset = clamp(minVal, center, maxVal);

        const shouldAddOffset =
            !(middlewareData.arrow as object) &&
            getAlignment(placement) != null &&
            center !== offset &&
            rects.reference[length] / 2 -
                (center < minVal ? minPadding : maxPadding) -
                arrowDimensions[length] / 2 <
                0;
        const alignmentOffset = shouldAddOffset
            ? center < minVal
                ? center - minVal
                : center - maxVal
            : 0;

        return {
            [axis]: coords[axis] + alignmentOffset,
            data: {
                [axis]: offset,
                centerOffset: center - offset - alignmentOffset,
                ...(shouldAddOffset ? { alignmentOffset } : {}),
            },
            reset: shouldAddOffset,
        };
    },
});
