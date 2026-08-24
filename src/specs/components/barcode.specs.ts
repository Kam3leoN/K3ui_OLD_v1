/**
 * @fileoverview Spécifications du composant BarCode K3UI
 * @description Code-barres multi-formats via JsBarcode
 * @author K3UI Team
 * @version 1.0.0
 */

import type { BarCodeOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

export const BarCodeSpecs = {
    defaults: {
        value: '3760123456788',
        format: 'CODE128' as const,
        lineColor: '#000000',
        background: '#ffffff',
        barWidth: 2,
        barHeight: 100,
        displayValue: true,
        fontSize: 18,
        textMargin: 4,
        margin: 10,
    },
    accessibility: {
        role: 'img',
    },
};

/**
 * Retourne les options par défaut du composant BarCode
 */
export function getBarCodeDefaults(): BarCodeOptions {
    return {
        ...BarCodeSpecs.defaults,
        onRender: null,
        onError: null,
        onInvalid: null,
        priorityLevel: PriorityLevel.MEDIUM,
    };
}
