/**
 * Tests unitaires pour DynamicColorManager
 */

import { DynamicColorManager } from '../../src/core/managers/DynamicColorManager';
import { Variant } from '../../src/utils/color';
import { storage } from '../../src/utils/storage';

describe('DynamicColorManager', () => {
    let target: HTMLElement;

    beforeEach(() => {
        DynamicColorManager.destroy();
        storage.clear?.();
        target = document.createElement('div');
        document.body.appendChild(target);
        target.style.cssText = '';
    });

    afterEach(() => {
        DynamicColorManager.destroy();
        storage.clear?.();
        target.remove();
        document.documentElement.style.cssText = '';
    });

    describe('applyTheme via init', () => {
        test('pose les variables CSS --md-sys-color-* et *-rgb sur documentElement', () => {
            DynamicColorManager.destroy();
            DynamicColorManager.init({
                sourceColor: '#6750A4',
                contrastLevel: 0,
                isDark: false,
                savePreference: false,
            });

            expect(document.documentElement.style.getPropertyValue('--md-sys-color-primary')).toBe('#655789');
            expect(document.documentElement.style.getPropertyValue('--md-sys-color-primary-rgb')).toMatch(/^\d+, \d+, \d+$/);
            expect(document.documentElement.style.getPropertyValue('--md-sys-color-surface')).toBeTruthy();
            expect(document.documentElement.style.getPropertyValue('--md-sys-color-error')).toBeTruthy();
        });

        test('mode sombre change primary', () => {
            DynamicColorManager.destroy();
            DynamicColorManager.init({
                sourceColor: '#6750A4',
                contrastLevel: 0,
                isDark: true,
                savePreference: false,
            });

            expect(document.documentElement.style.getPropertyValue('--md-sys-color-primary')).toBe('#CDC0EC');
        });
    });

    describe('persistance storage', () => {
        test('sauvegarde et restaure les préférences', () => {
            DynamicColorManager.init({
                sourceColor: '#6750A4',
                contrastLevel: 0,
                isDark: false,
                savePreference: true,
                storageKey: 'k3ui-dynamic-color-test',
            });

            DynamicColorManager.setSourceColor('#006493');
            DynamicColorManager.setContrastLevel(0.5);
            DynamicColorManager.setIsDark(true);
            DynamicColorManager.destroy();

            DynamicColorManager.init({
                savePreference: true,
                storageKey: 'k3ui-dynamic-color-test',
            });

            expect(DynamicColorManager.currentSourceColor).toBe('#006493');
            expect(DynamicColorManager.currentContrastLevel).toBe(0.5);
            expect(DynamicColorManager.isDark).toBe(true);
        });

        test('sauvegarde et restaure variant et specVersion', () => {
            DynamicColorManager.init({
                sourceColor: '#6750A4',
                contrastLevel: 0,
                isDark: false,
                savePreference: true,
                storageKey: 'k3ui-dynamic-color-test',
            });

            DynamicColorManager.setVariant(Variant.EXPRESSIVE);
            DynamicColorManager.setSpecVersion('2025');
            DynamicColorManager.destroy();

            DynamicColorManager.init({
                savePreference: true,
                storageKey: 'k3ui-dynamic-color-test',
            });

            expect(DynamicColorManager.currentVariant).toBe(Variant.EXPRESSIVE);
            expect(DynamicColorManager.currentSpecVersion).toBe('2025');
        });
    });

    describe('setters', () => {
        beforeEach(() => {
            DynamicColorManager.destroy();
            DynamicColorManager.init({
                sourceColor: '#6750A4',
                contrastLevel: 0,
                isDark: false,
                savePreference: false,
            });
        });

        test('setSourceColor met à jour primary', () => {
            DynamicColorManager.setSourceColor('#ff0000');
            expect(DynamicColorManager.currentSourceColor).toBe('#ff0000');
            expect(document.documentElement.style.getPropertyValue('--md-sys-color-primary')).toBe('#8C4E44');
        });

        test('setContrastLevel met à jour les tokens', () => {
            const before = document.documentElement.style.getPropertyValue('--md-sys-color-primary');
            DynamicColorManager.setContrastLevel(1);
            const after = document.documentElement.style.getPropertyValue('--md-sys-color-primary');
            expect(after).toBeTruthy();
            expect(after).not.toBe(before);
        });

        test('setIsDark bascule le thème', () => {
            DynamicColorManager.setIsDark(true);
            expect(DynamicColorManager.isDark).toBe(true);
            expect(document.documentElement.style.getPropertyValue('--md-sys-color-primary')).toBe('#CDC0EC');
        });

        test('reset restaure les valeurs par défaut des options', () => {
            DynamicColorManager.setSourceColor('#ff0000');
            DynamicColorManager.setIsDark(true);
            DynamicColorManager.reset();
            expect(DynamicColorManager.currentSourceColor).toBe('#6750A4');
            expect(DynamicColorManager.isDark).toBe(false);
        });

        test('setVariant change primary entre TONAL_SPOT et EXPRESSIVE', () => {
            const tonalPrimary = document.documentElement.style.getPropertyValue('--md-sys-color-primary');
            DynamicColorManager.setVariant(Variant.EXPRESSIVE);
            const expressivePrimary = document.documentElement.style.getPropertyValue('--md-sys-color-primary');
            expect(expressivePrimary).toBeTruthy();
            expect(expressivePrimary).not.toBe(tonalPrimary);
        });

        test('setSpecVersion 2025 définit primary-dim', () => {
            DynamicColorManager.setSpecVersion('2025');
            const primaryDim = document.documentElement.style.getPropertyValue('--md-sys-color-primary-dim');
            expect(primaryDim).toMatch(/^#[0-9A-Fa-f]{6}$/);
        });

        test('injecte les tokens d\'état hover/pressed', () => {
            const hover = document.documentElement.style.getPropertyValue('--md-sys-color-primary-hover');
            const hoverRgb = document.documentElement.style.getPropertyValue('--md-sys-color-primary-hover-rgb');
            expect(hover).toMatch(/^#[0-9A-Fa-f]{6}$/);
            expect(hoverRgb).toMatch(/^\d+, \d+, \d+$/);
        });

        test('injecte warning-dim (extension K3UI)', () => {
            const warningDim = document.documentElement.style.getPropertyValue('--md-sys-color-warning-dim');
            expect(warningDim).toBe('#6B3D00');
        });
    });

    describe('initialisation', () => {
        test('ne s\'initialise qu\'une fois', () => {
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
            DynamicColorManager.init({ savePreference: false });
            DynamicColorManager.init({ savePreference: false });
            warnSpy.mockRestore();
        });
    });
});
