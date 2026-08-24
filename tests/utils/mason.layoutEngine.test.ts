/// <reference types="jest" />
import {
    computeMasonryLayout,
    extractMasonSpansFromClassNames,
    resolveMasonSpanForWidth,
} from '../../src/utils/mason/layoutEngine';

describe('utils/mason/layoutEngine', () => {
    test('extractMasonSpansFromClassNames extrait et clamp correctement', () => {
        const spans = extractMasonSpansFromClassNames(['col', 's6', 'm4', 'xl3'], 12);
        expect(spans.s).toBe(6);
        expect(spans.m).toBe(4);
        expect(spans.xl).toBe(3);
        expect(spans.l).toBeUndefined();
    });

    test('resolveMasonSpanForWidth utilise l ordre de fallback (x -> lower -> s)', () => {
        // Largeur => preferred = l (>=1200 et <1600)
        const spans = { m: 6, s: 8 };
        const resolved = resolveMasonSpanForWidth(spans, 1500, 12, 12);
        expect(resolved).toBe(6);
    });

    test('computeMasonryLayout place les items “span-based” comme attendu', () => {
        // Configuration qui rend colWidth “propre” :
        // columns = 4, gap = 10, containerWidth = 130 => colWidth = (130 - 30) / 4 = 25
        const result = computeMasonryLayout({
            containerWidth: 130,
            gap: 10,
            columns: 4,
            fallbackSpan: 4,
            items: [
                { index: 0, classNames: ['s2'], height: 100 },
                { index: 1, classNames: ['s2'], height: 120 },
                { index: 2, classNames: ['s2'], height: 80 },
            ],
        });

        expect(result.containerHeight).toBe(190);

        const byIndex = new Map(result.items.map((it) => [it.index, it]));

        const item0 = byIndex.get(0);
        expect(item0).toBeDefined();
        expect(item0!.x).toBe(0);
        expect(item0!.y).toBe(0);
        expect(item0!.width).toBe(60);
        expect(item0!.height).toBe(100);
        expect(item0!.span).toBe(2);

        const item1 = byIndex.get(1);
        expect(item1).toBeDefined();
        expect(item1!.x).toBe(70);
        expect(item1!.y).toBe(0);
        expect(item1!.width).toBe(60);
        expect(item1!.height).toBe(120);
        expect(item1!.span).toBe(2);

        const item2 = byIndex.get(2);
        expect(item2).toBeDefined();
        expect(item2!.x).toBe(0);
        expect(item2!.y).toBe(110);
        expect(item2!.width).toBe(60);
        expect(item2!.height).toBe(80);
        expect(item2!.span).toBe(2);
    });

    test('computeMasonryLayout scale les spans de base vers colonnes custom', () => {
        // On fixe colWidth = 10 et gap = 10 pour que les largeurs soient entières.
        // columnsTarget = 18, gap = 10, containerWidth = 18*10 + 10*17 = 350 => colWidth = 10
        // spanBaseColumns = 12, classe m6 => 6/12 => 9/18 (arrondi)
        const result = computeMasonryLayout({
            containerWidth: 350,
            gap: 10,
            columns: 18,
            spanBaseColumns: 12,
            fallbackSpan: 12,
            items: [
                { index: 0, classNames: ['s6'], height: 100 },
                { index: 1, classNames: ['s6'], height: 120 },
                { index: 2, classNames: ['s6'], height: 80 },
            ],
        });

        // Note : le moteur ajoute aussi un "gap" vertical entre placements (voir layoutEngine).
        // Ici : 100 + gap(10) => 110, puis 110 + 80 + gap(10) => 200 ; container = 200 - gap(10) => 190.
        expect(result.containerHeight).toBe(190);

        const byIndex = new Map(result.items.map((it) => [it.index, it]));
        const item0 = byIndex.get(0);
        const item1 = byIndex.get(1);
        const item2 = byIndex.get(2);

        // span effectif attendu : round(6 * 18 / 12) = 9
        expect(item0!.span).toBe(9);
        expect(item0!.x).toBe(0);
        expect(item0!.y).toBe(0);
        expect(item0!.width).toBe(170); // 9*10 + 8*10
        expect(item0!.height).toBe(100);

        expect(item1!.span).toBe(9);
        expect(item1!.x).toBe(180); // start=9 => 9*(10+10)
        expect(item1!.y).toBe(0);
        expect(item1!.width).toBe(170);
        expect(item1!.height).toBe(120);

        expect(item2!.span).toBe(9);
        expect(item2!.x).toBe(0);
        // Ici, après item0, colonnes[0..8]=110 (100 + gap 10), donc bestY pour start=0 = 110.
        expect(item2!.y).toBe(110);
        expect(item2!.width).toBe(170);
        expect(item2!.height).toBe(80);
    });
});

