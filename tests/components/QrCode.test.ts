/**
 * @fileoverview Tests unitaires QrCode
 */

import { QrCode } from '../../src/extensions/generators/qrcode/QrCode';

describe('QrCode', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
        container = document.createElement('div');
        container.className = 'qrcode';
        container.setAttribute('data-value', 'K3UI test');
        document.body.appendChild(container);
    });

    afterEach(() => {
        QrCode.getInstance(container)?.destroy();
        container.remove();
    });

    it('initialise avec les options par défaut', () => {
        const instance = QrCode.init(container) as QrCode;
        expect(instance).toBeInstanceOf(QrCode);
        expect(container.querySelector('.qrcode__canvas')).toBeTruthy();
    });

    it('expose getInstance', () => {
        QrCode.init(container);
        expect(QrCode.getInstance(container)).toBeInstanceOf(QrCode);
    });

    it('met à jour le contenu via setData', () => {
        const instance = QrCode.init(container) as QrCode;
        instance.setData('nouveau contenu');
        expect(instance.getSvgString()).toBeTruthy();
    });

    it('injecte un SVG dans .qrcode__canvas', () => {
        QrCode.init(container);
        const svg = container.querySelector('.qrcode__canvas svg');
        expect(svg).toBeTruthy();
        expect(svg?.getAttribute('width')).toBeTruthy();
    });

    it('détruit proprement l\'instance', () => {
        const instance = QrCode.init(container) as QrCode;
        instance.destroy();
        expect(QrCode.getInstance(container)).toBeFalsy();
    });
});
