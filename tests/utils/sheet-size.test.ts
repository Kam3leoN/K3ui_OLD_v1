/// <reference types="@types/jest" />

import {
    detectSheetSizeFromElement,
    isSheetPosition,
    isSheetSize,
    resolveSheetPosition,
    resolveSheetSize,
    sheetInitialVerticalHeight,
} from '../../src/utils/sheet/sheet-size';

describe('sheet-size utils', () => {
    test('isSheetSize valide les tailles M3', () => {
        expect(isSheetSize('small')).toBe(true);
        expect(isSheetSize('medium')).toBe(true);
        expect(isSheetSize('large')).toBe(true);
        expect(isSheetSize('half')).toBe(true);
        expect(isSheetSize('full')).toBe(true);
        expect(isSheetSize('xl')).toBe(false);
        expect(isSheetSize(undefined)).toBe(false);
    });

    test('resolveSheetSize priorise option explicite > attribut > classe > medium', () => {
        const el = document.createElement('div');
        el.classList.add('sheet--large');
        el.setAttribute('size', 'small');

        expect(resolveSheetSize(el, 'medium')).toBe('medium');
        expect(resolveSheetSize(el)).toBe('small');

        el.removeAttribute('size');
        expect(resolveSheetSize(el)).toBe('large');

        el.classList.remove('sheet--large');
        expect(resolveSheetSize(el)).toBe('medium');
    });

    test('detectSheetSizeFromElement lit la première classe size', () => {
        const el = document.createElement('div');
        expect(detectSheetSizeFromElement(el)).toBeNull();
        el.classList.add('sheet--small');
        expect(detectSheetSizeFromElement(el)).toBe('small');
    });

    test('isSheetPosition n\'accepte que top / bottom', () => {
        expect(isSheetPosition('top')).toBe(true);
        expect(isSheetPosition('bottom')).toBe(true);
        expect(isSheetPosition('left')).toBe(false);
        expect(isSheetPosition('right')).toBe(false);
    });

    test('resolveSheetPosition ignore left/right et retombe sur bottom', () => {
        const el = document.createElement('div');
        el.classList.add('sheet--left', 'sheet--right');
        expect(resolveSheetPosition(el, 'left')).toBe('bottom');
        expect(resolveSheetPosition(el, 'top')).toBe('top');
        el.classList.add('sheet--top');
        expect(resolveSheetPosition(el, 'bottom')).toBe('top');
    });

    test('sheetInitialVerticalHeight mappe peek/half/large/full', () => {
        const detents: [number, number, number] = [200, 400, 800];
        expect(sheetInitialVerticalHeight('small', detents)).toBe(200);
        expect(sheetInitialVerticalHeight('medium', detents)).toBe(400);
        expect(sheetInitialVerticalHeight('half', detents)).toBe(400);
        expect(sheetInitialVerticalHeight('large', detents)).toBe(700);
        expect(sheetInitialVerticalHeight('full', detents)).toBe(800);
    });
});
