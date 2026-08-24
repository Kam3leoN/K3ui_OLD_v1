/**
 * @fileoverview Déclarations TypeScript pour qr-code-styling
 */

declare module 'qr-code-styling' {
    export type QrDotType =
        | 'square'
        | 'dots'
        | 'rounded'
        | 'extra-rounded'
        | 'classy'
        | 'classy-rounded';

    export type QrCornerSquareType = 'dot' | 'square' | 'extra-rounded';
    export type QrCornerDotType = 'dot' | 'square';
    export type QrErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';
    export type QrType = 'canvas' | 'svg';

    export interface QrImageOptions {
        hideBackgroundDots?: boolean;
        imageSize?: number;
        margin?: number;
        crossOrigin?: string;
    }

    export interface QrOptions {
        width?: number;
        height?: number;
        type?: QrType;
        data?: string;
        image?: string;
        margin?: number;
        qrOptions?: {
            typeNumber?: number;
            mode?: string;
            errorCorrectionLevel?: QrErrorCorrectionLevel;
        };
        imageOptions?: QrImageOptions;
        dotsOptions?: {
            type?: QrDotType;
            color?: string;
        };
        backgroundOptions?: {
            color?: string;
        };
        cornersSquareOptions?: {
            type?: QrCornerSquareType;
            color?: string;
        };
        cornersDotOptions?: {
            type?: QrCornerDotType;
            color?: string;
        };
    }

    export default class QRCodeStyling {
        constructor(options: QrOptions);
        append(container: HTMLElement): void;
        update(options: QrOptions): void;
        download(options?: { name?: string; extension?: 'png' | 'jpeg' | 'webp' | 'svg' }): Promise<void>;
        getRawData(extension?: 'png' | 'jpeg' | 'webp' | 'svg'): Promise<Blob | null>;
    }
}
