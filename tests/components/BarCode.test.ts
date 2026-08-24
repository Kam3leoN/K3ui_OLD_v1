/**
 * @fileoverview Tests unitaires BarCode
 */

import { BarCode } from '../../src/extensions/generators/barcode/BarCode';

describe('BarCode', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
        container = document.createElement('div');
        container.className = 'barcode';
        container.setAttribute('data-value', '3760123456788');
        document.body.appendChild(container);
    });

    afterEach(() => {
        BarCode.getInstance(container)?.destroy();
        container.remove();
    });

    it('initialise sur un conteneur HTML', () => {
        const instance = BarCode.init(container) as BarCode;
        expect(instance).toBeInstanceOf(BarCode);
        expect(container.querySelector('svg')).toBeTruthy();
    });

    it('expose getInstance', () => {
        BarCode.init(container);
        expect(BarCode.getInstance(container)).toBeInstanceOf(BarCode);
    });

    it('met à jour la valeur via setValue', () => {
        const instance = BarCode.init(container) as BarCode;
        instance.setValue('123456789012');
        expect(container.querySelector('svg')?.childNodes.length).toBeGreaterThan(0);
    });

    it('détruit proprement l\'instance', () => {
        const instance = BarCode.init(container) as BarCode;
        instance.destroy();
        expect(BarCode.getInstance(container)).toBeFalsy();
    });
});
