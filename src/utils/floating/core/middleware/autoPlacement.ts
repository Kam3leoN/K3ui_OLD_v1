import type { Alignment, Placement } from '../utils';
import {
    evaluate,
    getAlignment,
    getAlignmentSides,
    getOppositeAlignmentPlacement,
    getSide,
    placements as ALL_PLACEMENTS,
} from '../utils';
import type { DetectOverflowOptions } from '../detectOverflow';
import type { Derivable, Middleware } from '../types';

export function getPlacementList(
    alignment: Alignment | null,
    autoAlignment: boolean,
    allowedPlacements: Placement[]
): Placement[] {
    const allowedPlacementsSortedByAlignment = alignment
        ? [
              ...allowedPlacements.filter((p) => getAlignment(p) === alignment),
              ...allowedPlacements.filter((p) => getAlignment(p) !== alignment),
          ]
        : allowedPlacements.filter((p) => getSide(p) === p);
    return allowedPlacementsSortedByAlignment.filter((placement) => {
        if (alignment) {
            return (
                getAlignment(placement) === alignment ||
                (autoAlignment ? getOppositeAlignmentPlacement(placement) !== placement : false)
            );
        }
        return true;
    });
}

export interface AutoPlacementOptions extends DetectOverflowOptions {
    crossAxis?: boolean;
    alignment?: Alignment | null;
    autoAlignment?: boolean;
    allowedPlacements?: Placement[];
}

export const autoPlacement = (
    options: AutoPlacementOptions | Derivable<AutoPlacementOptions> = {}
): Middleware => ({
    name: 'autoPlacement',
    options,
    async fn(state) {
        const { rects, middlewareData, placement, platform, elements } = state;
        const {
            crossAxis = false,
            alignment,
            allowedPlacements = ALL_PLACEMENTS,
            autoAlignment = true,
            ...detectOverflowOptions
        } = evaluate(options, state);

        const placements =
            alignment !== undefined || allowedPlacements === ALL_PLACEMENTS
                ? getPlacementList(alignment ?? null, autoAlignment, allowedPlacements)
                : allowedPlacements;

        const overflow = await platform.detectOverflow!(state, detectOverflowOptions);
        const currentIndex = (middlewareData.autoPlacement as { index?: number })?.index ?? 0;
        const currentPlacement = placements[currentIndex];
        if (currentPlacement == null) return {};

        const alignmentSides = getAlignmentSides(
            currentPlacement,
            rects,
            await platform.isRTL?.(elements.floating)
        );

        if (placement !== currentPlacement) {
            return { reset: { placement: placements[0] } };
        }

        const currentOverflows = [
            overflow[getSide(currentPlacement)],
            overflow[alignmentSides[0]],
            overflow[alignmentSides[1]],
        ];
        const allOverflows = [
            ...((middlewareData.autoPlacement as { overflows?: Array<{ placement: Placement; overflows: number[] }> })?.overflows ?? []),
            { placement: currentPlacement, overflows: currentOverflows },
        ];

        const nextPlacement = placements[currentIndex + 1];
        if (nextPlacement) {
            return {
                data: { index: currentIndex + 1, overflows: allOverflows },
                reset: { placement: nextPlacement },
            };
        }

        const placementsSortedByMostSpace = allOverflows
            .map((d) => {
                const alignment = getAlignment(d.placement);
                return [
                    d.placement,
                    alignment && crossAxis
                        ? d.overflows.slice(0, 2).reduce((acc, v) => acc + v, 0)
                        : d.overflows[0],
                    d.overflows,
                ] as const;
            })
            .sort((a, b) => a[1] - b[1]);

        const placementsThatFitOnEachSide = placementsSortedByMostSpace.filter((d) =>
            d[2]
                .slice(0, getAlignment(d[0]) ? 2 : 3)
                .every((v) => v <= 0)
        );
        const resetPlacement =
            placementsThatFitOnEachSide[0]?.[0] ?? placementsSortedByMostSpace[0][0];

        if (resetPlacement !== placement) {
            return {
                data: { index: currentIndex + 1, overflows: allOverflows },
                reset: { placement: resetPlacement },
            };
        }
        return {};
    },
});
