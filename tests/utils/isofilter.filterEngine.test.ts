/// <reference types="jest" />
import { computeVisibleIds, type IsoFilterEngineOptions, type IsoFilterSourceItem } from '../../src/utils/isofilter/filterEngine';

describe('utils/isofilter/filterEngine', () => {
    const items: IsoFilterSourceItem[] = [
        { id: '1', tags: ['red', 'blue'] },
        { id: '2', tags: ['green'] },
        { id: '3', tags: ['red'] },
        { id: '4', tags: [] },
    ];

    test('filter=all retourne tous les ids', () => {
        const options: IsoFilterEngineOptions = {
            allFilterValue: 'all',
            matchMode: 'any',
            fallbackToAllOnNoMatch: true,
        };

        const result = computeVisibleIds({ items, filterValue: 'all', options });
        expect(result.sort()).toEqual(items.map(i => i.id).sort());
    });

    test('matchMode=any : multi-tags => OR', () => {
        const options: IsoFilterEngineOptions = {
            allFilterValue: 'all',
            matchMode: 'any',
            fallbackToAllOnNoMatch: true,
        };

        const result = computeVisibleIds({ items, filterValue: 'red blue', options });
        expect(result.sort()).toEqual(['1', '3'].sort());
    });

    test('matchMode=all : multi-tags => AND', () => {
        const options: IsoFilterEngineOptions = {
            allFilterValue: 'all',
            matchMode: 'all',
            fallbackToAllOnNoMatch: true,
        };

        const result = computeVisibleIds({ items, filterValue: 'red blue', options });
        expect(result).toEqual(['1']);
    });

    test('no match => fallbackToAllOnNoMatch=true', () => {
        const options: IsoFilterEngineOptions = {
            allFilterValue: 'all',
            matchMode: 'any',
            fallbackToAllOnNoMatch: true,
        };

        const result = computeVisibleIds({ items, filterValue: 'purple', options });
        expect(result.sort()).toEqual(items.map(i => i.id).sort());
    });

    test('no match => fallbackToAllOnNoMatch=false', () => {
        const options: IsoFilterEngineOptions = {
            allFilterValue: 'all',
            matchMode: 'any',
            fallbackToAllOnNoMatch: false,
        };

        const result = computeVisibleIds({ items, filterValue: 'purple', options });
        expect(result).toEqual([]);
    });
});

