/**
 * @fileoverview Composant BarCode pour K3UI
 * @description Code-barres multi-formats via JsBarcode
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../../../core/base/Component';
import { toComponentClassDef } from '../../../types/components/component-base';
import type { BarCodeOptions, BarCodeFormatType } from '../../../types/components';
import { PriorityLevel, KElement, InitElements } from '../../../types/base';
import { setAriaAttribute } from '../../../utils/dom/aria';
import { LocaleManager } from '../../../core/managers';
import { getBarCodeDefaults } from '../../../specs/components/barcode.specs';
import { renderBarCode } from './render';

const _defaults: BarCodeOptions = getBarCodeDefaults();

/**
 * Composant BarCode — génération de codes-barres
 */
export class BarCode extends Component<BarCodeOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    private svgEl: SVGSVGElement | null = null;
    private _destroying = false;

    static get defaults(): BarCodeOptions {
        return { ..._defaults };
    }

    static getInstance(el: HTMLElement): BarCode | undefined {
        return Component.getInstance(el) as BarCode | undefined;
    }

    static init(
        els: KElement | InitElements<KElement> | string,
        options: Partial<BarCodeOptions> = {}
    ): BarCode | BarCode[] {
        return Component.init(els, options, toComponentClassDef(BarCode)) as BarCode | BarCode[];
    }

    constructor(el: HTMLElement, options: Partial<BarCodeOptions> = {}) {
        super(el, options, toComponentClassDef(BarCode));
        this.options = { ...BarCode.defaults, ...options };
        this.readAttributes();
        this.setupDom();
        this.render();
    }

    private readAttributes(): void {
        const { el } = this;
        const value = el.getAttribute('data-value');
        if (value !== null) {
            this.options.value = value;
        }
        const format = el.getAttribute('data-format');
        if (format) {
            this.options.format = format as BarCodeFormatType;
        }
        const lineColor = el.getAttribute('data-line-color');
        if (lineColor) {
            this.options.lineColor = lineColor;
        }
        const background = el.getAttribute('data-background');
        if (background) {
            this.options.background = background;
        }
    }

    private setupDom(): void {
        let svg = this.el.querySelector<SVGSVGElement>('svg.barcode__svg, svg');
        if (!svg) {
            svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.classList.add('barcode__svg');
            this.el.appendChild(svg);
        }
        this.svgEl = svg;
        this.el.classList.add('barcode');
        setAriaAttribute(this.el, 'role', 'img');
        this.updateAriaLabel();
    }

    private updateAriaLabel(): void {
        setAriaAttribute(
            this.el,
            'label',
            `${LocaleManager.t('barcode.ariaLabel')}: ${this.options.value}`
        );
    }

    /**
     * Génère ou met à jour le code-barres
     */
    render(): void {
        if (!this.svgEl || this._destroying) {
            return;
        }

        try {
            renderBarCode(this.svgEl, this.options.value, {
                format: this.options.format,
                lineColor: this.options.lineColor,
                background: this.options.background,
                width: this.options.barWidth,
                height: this.options.barHeight,
                displayValue: this.options.displayValue,
                fontSize: this.options.fontSize,
                textMargin: this.options.textMargin,
                margin: this.options.margin,
                onInvalid: (valid) => {
                    if (!valid) {
                        this.options.onInvalid?.(this);
                    }
                },
            });
            this.updateAriaLabel();
            this.options.onRender?.(this);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.options.onError?.(message, this);
        }
    }

    /**
     * Met à jour la valeur encodée
     * @param value Nouvelle valeur
     */
    setValue(value: string): void {
        this.options.value = value;
        this.render();
    }

    /**
     * Met à jour le format
     * @param format Format du code-barres
     */
    setFormat(format: BarCodeFormatType): void {
        this.options.format = format;
        this.render();
    }

    /**
     * Retourne l'élément SVG du code-barres
     */
    getSvgElement(): SVGSVGElement | null {
        return this.svgEl;
    }

    override destroy(): void {
        if (this._destroying) {
            return;
        }
        this._destroying = true;
        this.svgEl = null;
        super.destroy();
    }
}

export type { BarCodeOptions };
