/**
 * @fileoverview Spécifications du composant ProgressIndicator K3UI
 * @description Material Design 3 Expressive — linear & circular progress indicators
 * @see https://m3.material.io/components/progress-indicators/specs
 * @author K3UI Team
 * @version 1.0.0
 */

import type { ProgressIndicatorOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Spécifications Material Design 3 Expressive pour ProgressIndicator
 */
export const ProgressIndicatorSpecs = {
    /** Hauteur de piste standard (dp) — LinearProgressIndicatorTokens.TrackThickness */
    trackHeightStandard: 4,
    /** Hauteur de piste épaisse (dp) — variante expressive optionnelle (Android M3) */
    trackHeightThick: 8,
    /** Hauteur conteneur wavy linéaire (dp) — LinearProgressIndicatorTokens.WaveHeight */
    linearWaveHeightStandard: 10,
    /** Hauteur conteneur wavy linéaire épais (dp) — sample Compose thick wavy */
    linearWaveHeightThick: 14,
    /** Amplitude onde linéaire (dp) — LinearProgressIndicatorTokens.ActiveWaveAmplitude */
    linearWaveAmplitudeStandard: 3,
    /** Écart entre indicateur actif et piste inactive (dp) — déterminé uniquement au point de jonction */
    gapDp: 4,
    /**
     * Diamètre du stop indicator (dp) — Android `trackStopIndicatorSize` / Compose `LinearTrackStopIndicatorSize`
     * Requis si le contraste piste / surface < 3:1.
     */
    stopIndicatorSize: 4,
    /** Tailles circulaires (dp) */
    circularSizes: [24, 36, 40, 52] as const,
    /** Taille circulaire par défaut (dp) — CircularProgressIndicatorTokens.Size */
    circularSizeDefault: 40,
    /** Taille circulaire épaisse recommandée (dp) */
    circularSizeThick: 52,
    /** Longueur d'onde wavy linéaire (dp) — LinearProgressIndicatorTokens.ActiveWaveWavelength */
    linearWavelengthStandard: 40,
    /** Longueur d'onde wavy linéaire épais (dp) */
    linearWavelengthThick: 40,
    /** Amplitude onde circulaire (dp) — CircularProgressIndicatorTokens.ActiveWaveAmplitude */
    circularWaveAmplitudeStandard: 2,
    /** Amplitude onde circulaire épais (dp) */
    circularWaveAmplitudeThick: 2.5,
    /** Longueur d'onde wavy circulaire (dp) — CircularProgressIndicatorTokens.ActiveWaveWavelength */
    circularWavelength: 15,
    /** Ramp amplitude — progress < 0.1 ou > 0.9 */
    amplitudeRampMin: 0.1,
    amplitudeRampMax: 0.9,
    /** Vitesse onde : 1 longueur d'onde / seconde */
    waveSpeedPerSecond: 1,
    /** Cycle indéterminé linéaire (s) — Material Web / M3E keyframes 2.1s */
    linearIndeterminateCycle: 2.1,
    /** Décalage second segment indéterminé linéaire (s) — M3E animation-delay 1.15s */
    linearIndeterminateSecondaryDelay: 1.15,
    /** Balayage min indéterminé circulaire flat (deg) — Compose CircularIndeterminateMinProgress */
    circularIndeterminateMinSweep: 36,
    /** Balayage max indéterminé circulaire flat (deg) — Compose CircularIndeterminateMaxProgress */
    circularIndeterminateMaxSweep: 313.2,
    /** Cycle pulsation indéterminé circulaire flat (s) — Material Web ~4 × 1.333s */
    circularIndeterminateProgressCycle: 5.332,
    /** Rotation indéterminée circulaire flat (deg/s) — Material Web linear-rotate ≈ 1560ms/tour → 230.8°/s */
    circularIndeterminateRotation: 230.8,
    /**
     * Cycle wavy indéterminé circulaire (s) — M3E holdMin+grow+holdMax+shrink = 4 × 1.575
     * @see https://github.com/matraic/m3e
     */
    circularWavyIndeterminatePhase: 1.575,
    /** Balayage min wavy indéterminé (deg) — M3E minSweep ≈ 18 + padding */
    circularWavyIndeterminateMinSweep: 30,
    /** Balayage max wavy indéterminé (deg) — M3E maxSweep ≈ 280 */
    circularWavyIndeterminateMaxSweep: 280,
    /** Durée transition valeur déterminée (ms) — Material active-track 500ms */
    valueTransitionMs: 500,
    /** ViewBox largeur linéaire de référence */
    linearViewBoxWidth: 300,

    defaults: {
        variant: 'linear' as const,
        value: 0,
        min: 0,
        max: 100,
        indeterminate: false,
        wavy: true,
        thick: false,
        size: 40,
        stopIndicator: true,
        stopSize: 4,
        showValue: false,
        valueFormat: null as
            | ((ratio: number, value: number, min: number, max: number) => string)
            | null,
        palette: 'primary' as const,
        color: null as string | null,
        trackColor: null as string | null,
        label: '',
        onChange: null as ((value: number, instance: unknown) => void) | null,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
    },
};

/**
 * Valeurs par défaut ProgressIndicator
 */
export function getProgressIndicatorDefaults(): ProgressIndicatorOptions {
    return {
        variant: ProgressIndicatorSpecs.defaults.variant,
        value: ProgressIndicatorSpecs.defaults.value,
        min: ProgressIndicatorSpecs.defaults.min,
        max: ProgressIndicatorSpecs.defaults.max,
        indeterminate: ProgressIndicatorSpecs.defaults.indeterminate,
        wavy: ProgressIndicatorSpecs.defaults.wavy,
        thick: ProgressIndicatorSpecs.defaults.thick,
        size: ProgressIndicatorSpecs.defaults.size,
        stopIndicator: ProgressIndicatorSpecs.defaults.stopIndicator,
        stopSize: ProgressIndicatorSpecs.defaults.stopSize,
        showValue: ProgressIndicatorSpecs.defaults.showValue,
        valueFormat: ProgressIndicatorSpecs.defaults.valueFormat,
        palette: ProgressIndicatorSpecs.defaults.palette,
        color: ProgressIndicatorSpecs.defaults.color,
        trackColor: ProgressIndicatorSpecs.defaults.trackColor,
        label: ProgressIndicatorSpecs.defaults.label,
        onChange: ProgressIndicatorSpecs.defaults.onChange,
        onOpenStart: ProgressIndicatorSpecs.defaults.onOpenStart,
        onOpenEnd: ProgressIndicatorSpecs.defaults.onOpenEnd,
        onCloseStart: ProgressIndicatorSpecs.defaults.onCloseStart,
        onCloseEnd: ProgressIndicatorSpecs.defaults.onCloseEnd,
        priorityLevel: PriorityLevel.MEDIUM,
    };
}
