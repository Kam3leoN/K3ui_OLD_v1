/// <reference types="@jest/globals" />
/**
 * Tests unitaires pour index-list-keys
 */

import {
    compareIndexKeys,
    indexKeyToSectionId,
    resolveIndexKeyFromLabel,
    sortIndexKeys,
    INDEX_LIST_KEY_ORDER,
} from '../../src/utils/helpers/index-list-keys';

describe('index-list-keys', () => {
    describe('resolveIndexKeyFromLabel', () => {
        it('retourne A–Z en majuscule', () => {
            expect(resolveIndexKeyFromLabel('alice')).toBe('A');
            expect(resolveIndexKeyFromLabel('Zorro')).toBe('Z');
        });

        it('retourne les chiffres individuels', () => {
            expect(resolveIndexKeyFromLabel('123')).toBe('1');
            expect(resolveIndexKeyFromLabel('9 lives')).toBe('9');
        });

        it('retourne les symboles prioritaires', () => {
            expect(resolveIndexKeyFromLabel('-dash')).toBe('-');
            expect(resolveIndexKeyFromLabel('_private')).toBe('_');
            expect(resolveIndexKeyFromLabel('—em')).toBe('—');
        });

        it('retourne # pour symboles non reconnus', () => {
            expect(resolveIndexKeyFromLabel('@mail')).toBe('#');
            expect(resolveIndexKeyFromLabel('')).toBe('#');
        });
    });

    describe('compareIndexKeys / sortIndexKeys', () => {
        it('respecte l’ordre # → symboles → chiffres → lettres', () => {
            const unsorted = ['B', '1', '#', 'A', '9', '-', '0'];
            expect(sortIndexKeys(unsorted)).toEqual(['#', '-', '0', '1', '9', 'A', 'B']);
        });

        it('compare deux clés', () => {
            expect(compareIndexKeys('#', 'A')).toBeLessThan(0);
            expect(compareIndexKeys('9', 'A')).toBeLessThan(0);
            expect(compareIndexKeys('B', 'A')).toBeGreaterThan(0);
        });

        it('contient tous les groupes dans KEY_ORDER', () => {
            expect(INDEX_LIST_KEY_ORDER.length).toBeGreaterThanOrEqual(26 + 10 + 5);
        });
    });

    describe('indexKeyToSectionId', () => {
        it('slugifie les caractères spéciaux', () => {
            expect(indexKeyToSectionId('#')).toBe('index-list-hash');
            expect(indexKeyToSectionId('A')).toBe('index-list-a');
            expect(indexKeyToSectionId(' ')).toBe('index-list-space');
        });
    });
});
