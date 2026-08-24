/**
 * @fileoverview Spécifications du composant QrCode K3UI
 * @description QR code stylisable avec yeux et logo custom
 * @author K3UI Team
 * @version 1.0.0
 */

import type { QrCodeOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

export const QrCodeSpecs = {
    defaults: {
        data: 'K3UI',
        size: 300,
        exportQuality: 1000,
        backgroundColor: '#ffffff',
        dotsColor: '#1a1d27',
        cornersSquareColor: '#6c8cff',
        cornersDotColor: '#1a1d27',
        dotsType: 'rounded' as const,
        errorCorrectionLevel: 'Q' as const,
        frameShape: 'svg-0',
        ballShape: 'svg-0',
        hideBackgroundDots: true,
        imageSize: 0.45,
        imageMargin: 4,
        dotsFill: 'solid' as const,
        dotsGradientEnd: '#2196f3',
        dotsGradientPreset: 'diagonal-right' as const,
        dotsRoundSize: true,
        coverShape: null as number | null,
        quietMargin: 4,
    },
    accessibility: {
        role: 'img',
    },
};

/**
 * Retourne les options par défaut du composant QrCode
 */
export function getQrCodeDefaults(): QrCodeOptions {
    return {
        ...QrCodeSpecs.defaults,
        image: null,
        onRender: null,
        onError: null,
        priorityLevel: PriorityLevel.MEDIUM,
    };
}
