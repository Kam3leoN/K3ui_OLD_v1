/**
 * @fileoverview Composant QrCode pour K3UI
 * @description QR code stylisable avec moteur SVG custom, logo central et export multi-format
 * @author K3UI Team
 * @version 2.0.0
 */

import { Component } from '../../../core/base/Component';
import { toComponentClassDef } from '../../../types/components/component-base';
import type { QrCodeOptions } from '../../../types/components';
import { PriorityLevel, KElement, InitElements } from '../../../types/base';
import { setAriaAttribute } from '../../../utils/dom/aria';
import { LocaleManager } from '../../../core/managers';
import { getQrCodeDefaults } from '../../../specs/components/qrcode.specs';
import { canvasToEpsBlob, downloadBlob, rasterizeSvgToCanvas } from './export';
import { composeQrPayload } from './compose';
import { renderQrSvgString } from './render';
import { serializeDisplayedQrSvg, svgTextToDataUrl } from './shapes';

const _defaults: QrCodeOptions = getQrCodeDefaults();

/**
 * Composant QrCode — génération et personnalisation de QR codes
 */
export class QrCode extends Component<QrCodeOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    private renderContainer: HTMLElement | null = null;
    private _destroying = false;

    static get defaults(): QrCodeOptions {
        return { ..._defaults };
    }

    static getInstance(el: HTMLElement): QrCode | undefined {
        return Component.getInstance(el) as QrCode | undefined;
    }

    static init(
        els: KElement | InitElements<KElement> | string,
        options: Partial<QrCodeOptions> = {}
    ): QrCode | QrCode[] {
        return Component.init(els, options, toComponentClassDef(QrCode)) as QrCode | QrCode[];
    }

    /**
     * Construit une charge utile typée (URL, Wi‑Fi, vCard, etc.)
     * @see composeQrPayload
     */
    static composePayload = composeQrPayload;

    constructor(el: HTMLElement, options: Partial<QrCodeOptions> = {}) {
        super(el, options, toComponentClassDef(QrCode));
        this.options = { ...QrCode.defaults, ...options };
        this.readAttributes();
        this.setupDom();
        this.render();
    }

    private readAttributes(): void {
        const { el } = this;
        const data = el.getAttribute('data-value') ?? el.getAttribute('data-data');
        if (data !== null) {
            this.options.data = data;
        }
        const size = el.getAttribute('data-size');
        if (size !== null) {
            const n = parseInt(size, 10);
            if (!Number.isNaN(n)) {
                this.options.size = n;
            }
        }
        const image = el.getAttribute('data-image');
        if (image !== null) {
            this.options.image = image;
        }
        const frame = el.getAttribute('data-frame-shape');
        if (frame) {
            this.options.frameShape = frame;
        }
        const ball = el.getAttribute('data-ball-shape');
        if (ball) {
            this.options.ballShape = ball;
        }
        const cover = el.getAttribute('data-cover-shape');
        if (cover !== null) {
            if (cover === '' || cover === 'none') {
                this.options.coverShape = null;
            } else {
                const n = parseInt(cover, 10);
                if (!Number.isNaN(n)) {
                    this.options.coverShape = n;
                }
            }
        }
        const margin = el.getAttribute('data-quiet-margin');
        if (margin !== null) {
            const n = parseInt(margin, 10);
            if (!Number.isNaN(n)) {
                this.options.quietMargin = n;
            }
        }
    }

    private setupDom(): void {
        this.el.classList.add('qrcode');
        let container = this.el.querySelector<HTMLElement>('.qrcode__canvas');
        if (!container) {
            container = document.createElement('div');
            container.className = 'qrcode__canvas';
            this.el.appendChild(container);
        }
        this.renderContainer = container;
        setAriaAttribute(this.el, 'role', 'img');
        this.updateAriaLabel();
    }

    private updateAriaLabel(): void {
        setAriaAttribute(
            this.el,
            'label',
            `${LocaleManager.t('qrcode.ariaLabel')}: ${this.options.data}`
        );
    }

    /**
     * Génère ou met à jour le QR code
     */
    render(): void {
        if (!this.renderContainer || this._destroying) {
            return;
        }

        try {
            const opts = this.options;
            const svg = renderQrSvgString({
                value: opts.data,
                size: opts.size,
                backgroundColor: opts.backgroundColor,
                dotsColor: opts.dotsColor,
                cornersSquareColor: opts.cornersSquareColor,
                cornersDotColor: opts.cornersDotColor,
                dotsType: opts.dotsType,
                level: opts.errorCorrectionLevel,
                frameShape: opts.frameShape,
                ballShape: opts.ballShape,
                image: opts.image,
                hideBackgroundDots: opts.hideBackgroundDots,
                imageSize: opts.imageSize,
                dotsFill: opts.dotsFill,
                dotsGradientEnd: opts.dotsGradientEnd,
                dotsGradientPreset: opts.dotsGradientPreset,
                dotsRoundSize: opts.dotsRoundSize,
                coverShape: opts.coverShape,
                quietMargin: opts.quietMargin,
            });
            this.renderContainer.innerHTML = svg;
            this.updateAriaLabel();
            this.options.onRender?.(this);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.options.onError?.(message, this);
        }
    }

    /**
     * Met à jour le contenu encodé
     * @param data Nouveau contenu
     */
    setData(data: string): void {
        this.options.data = data;
        this.render();
    }

    /**
     * Met à jour le logo central
     * @param image URL, data URL ou SVG texte
     */
    setImage(image: string | null): void {
        this.options.image = image;
        this.render();
    }

    /**
     * Définit le logo à partir d'un SVG texte
     * @param svgText Contenu `<svg>…</svg>`
     */
    setImageFromSvg(svgText: string): void {
        this.setImage(svgText ? svgTextToDataUrl(svgText) : null);
    }

    /**
     * Retourne le SVG affiché
     */
    getSvgString(): string | null {
        if (!this.renderContainer) {
            return null;
        }
        return serializeDisplayedQrSvg(this.renderContainer, this.options.size);
    }

    /**
     * Télécharge le QR en SVG
     * @param filename Nom du fichier
     */
    downloadSvg(filename = 'qrcode.svg'): void {
        const svgStr = this.getSvgString();
        if (!svgStr) {
            this.options.onError?.('Rien à exporter.', this);
            return;
        }
        downloadBlob(new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' }), filename);
    }

    /**
     * Télécharge le QR en PNG
     * @param filename Nom du fichier
     * @param quality Résolution en pixels (défaut : exportQuality)
     */
    async downloadPng(filename = 'qrcode.png', quality?: number): Promise<void> {
        const svgStr = this.getSvgString();
        if (!svgStr) {
            this.options.onError?.('Rien à exporter.', this);
            return;
        }
        const px = quality ?? this.options.exportQuality;
        try {
            const canvas = await rasterizeSvgToCanvas(svgStr, px, {
                backgroundColor: this.options.backgroundColor,
            });
            canvas.toBlob((blob) => {
                if (blob) {
                    downloadBlob(blob, filename);
                }
            }, 'image/png');
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.options.onError?.(message, this);
        }
    }

    /**
     * Télécharge le QR en JPEG
     * @param filename Nom du fichier
     * @param quality Résolution en pixels (défaut : exportQuality)
     * @param jpegQuality Qualité JPEG 0–1 (défaut 0.92)
     */
    async downloadJpeg(
        filename = 'qrcode.jpg',
        quality?: number,
        jpegQuality = 0.92
    ): Promise<void> {
        const svgStr = this.getSvgString();
        if (!svgStr) {
            this.options.onError?.('Rien à exporter.', this);
            return;
        }
        const px = quality ?? this.options.exportQuality;
        try {
            const canvas = await rasterizeSvgToCanvas(svgStr, px, {
                backgroundColor: this.options.backgroundColor,
                forceBackground: '#ffffff',
            });
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        downloadBlob(blob, filename);
                    }
                },
                'image/jpeg',
                jpegQuality
            );
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.options.onError?.(message, this);
        }
    }

    /**
     * Télécharge le QR en PDF (image PNG embarquée)
     * @param filename Nom du fichier
     */
    async downloadPdf(filename = 'qrcode.pdf'): Promise<void> {
        const svgStr = this.getSvgString();
        if (!svgStr) {
            this.options.onError?.('Rien à exporter.', this);
            return;
        }
        try {
            const canvas = await rasterizeSvgToCanvas(svgStr, this.options.exportQuality, {
                backgroundColor: this.options.backgroundColor,
                forceBackground: '#ffffff',
            });
            const { jsPDF } = await import('jspdf');
            const dataUrl = canvas.toDataURL('image/png');
            const mm = 80;
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [mm, mm] });
            doc.addImage(dataUrl, 'PNG', 0, 0, mm, mm);
            downloadBlob(doc.output('blob'), filename);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.options.onError?.(message, this);
        }
    }

    /**
     * Télécharge le QR en EPS
     * @param filename Nom du fichier
     */
    async downloadEps(filename = 'qrcode.eps'): Promise<void> {
        const svgStr = this.getSvgString();
        if (!svgStr) {
            this.options.onError?.('Rien à exporter.', this);
            return;
        }
        try {
            const canvas = await rasterizeSvgToCanvas(svgStr, this.options.exportQuality, {
                backgroundColor: this.options.backgroundColor,
                forceBackground: '#ffffff',
            });
            downloadBlob(canvasToEpsBlob(canvas), filename);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.options.onError?.(message, this);
        }
    }

    override destroy(): void {
        if (this._destroying) {
            return;
        }
        this._destroying = true;
        this.renderContainer = null;
        super.destroy();
    }
}

export type { QrCodeOptions };
