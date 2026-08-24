/**
 * @fileoverview Rendu code-barres via JsBarcode
 * @description Wrapper typé autour de JsBarcode
 */

import JsBarcode from 'jsbarcode';

export type BarCodeFormat =
    | 'CODE128'
    | 'CODE128A'
    | 'CODE128B'
    | 'CODE128C'
    | 'EAN13'
    | 'EAN8'
    | 'EAN5'
    | 'EAN2'
    | 'UPC'
    | 'UPCE'
    | 'CODE39'
    | 'ITF'
    | 'ITF14'
    | 'MSI'
    | 'MSI10'
    | 'MSI11'
    | 'MSI1010'
    | 'MSI1110'
    | 'pharmacode'
    | 'codabar';

export interface RenderBarCodeOptions {
    format?: BarCodeFormat;
    lineColor?: string;
    background?: string;
    width?: number;
    height?: number;
    displayValue?: boolean;
    fontSize?: number;
    textMargin?: number;
    margin?: number;
    onInvalid?: (valid: boolean) => void;
}

/**
 * Rend un code-barres dans un élément SVG cible
 * @param target Élément SVG ou sélecteur
 * @param value Valeur à encoder
 * @param options Options de rendu
 */
export function renderBarCode(
    target: string | SVGSVGElement,
    value: string,
    options: RenderBarCodeOptions = {}
): void {
    const fmt = (options.format ?? 'CODE128').toUpperCase();

    JsBarcode(target, value, {
        format: fmt,
        lineColor: options.lineColor ?? '#000000',
        background: options.background ?? '#ffffff',
        width: options.width ?? 2,
        height: options.height ?? 100,
        displayValue: options.displayValue ?? true,
        fontSize: options.fontSize ?? 18,
        textMargin: options.textMargin ?? 4,
        margin: options.margin ?? 10,
        valid: options.onInvalid,
    });
}
