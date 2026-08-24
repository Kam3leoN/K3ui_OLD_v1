/**
 * @fileoverview Spécifications du composant Gauge K3UI
 * @description Spécifications Material Design 3 Expressive — arc 270°, ressort spatial
 * @author K3UI Team
 * @version 2.0.0
 */

import type { GaugeOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/** Arc 270° démarrant à -135° (Material 3 Expressive) */
const SWEEP = 270;
const START = -135;
const CX = 50;
const CY = 50;

/**
 * Spécifications Material Design 3 Expressive pour le composant Gauge
 */
export const GaugeSpecs = {
    centerX: CX,
    centerY: CY,
    /** Arc principal (degrés) */
    startAngle: START,
    totalSpan: SWEEP,
    /** Rayon centre de trait — md / sm */
    radius: 42,
    /** Rayon centre de trait — lg */
    radiusLg: 44,
    trackStrokeWidth: 8,
    trackStrokeWidthLg: 5,
    /** Seuils palette sémantique (ratio 0–1) */
    paletteThresholds: { low: 0.25, medium: 0.5, high: 0.75 },
    /** Seuils Lighthouse officiels */
    lighthouseThresholds: { poor: 0.5, average: 0.9 },

    behaviors: {
        decimals: 0,
        label: '',
        unit: '',
        icon: '',
    },

    defaults: {
        value: 50,
        min: 0,
        max: 100,
        decimals: 0,
        label: '',
        unit: '',
        icon: '',
        display: 'value' as const,
        palette: 'semantic' as const,
        size: 'md' as const,
        spring: 'default' as const,
        frame: false,
        curvedText: false,
        ticks: 0,
        threshold: null as number | null,
        state: 'ok' as const,
        colors: {},
    },
};

/**
 * Extrait les valeurs par défaut pour Gauge
 */
export function getGaugeDefaults(): GaugeOptions {
    return {
        value: GaugeSpecs.defaults.value,
        min: GaugeSpecs.defaults.min,
        max: GaugeSpecs.defaults.max,
        decimals: GaugeSpecs.defaults.decimals,
        label: GaugeSpecs.defaults.label,
        unit: GaugeSpecs.defaults.unit,
        icon: GaugeSpecs.defaults.icon,
        display: GaugeSpecs.defaults.display,
        palette: GaugeSpecs.defaults.palette,
        size: GaugeSpecs.defaults.size,
        spring: GaugeSpecs.defaults.spring,
        frame: GaugeSpecs.defaults.frame,
        curvedText: GaugeSpecs.defaults.curvedText,
        ticks: GaugeSpecs.defaults.ticks,
        threshold: GaugeSpecs.defaults.threshold,
        state: GaugeSpecs.defaults.state,
        colors: { ...GaugeSpecs.defaults.colors },
        formatValue: null,
        onChange: null,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
        priorityLevel: PriorityLevel.MEDIUM,
    };
}
