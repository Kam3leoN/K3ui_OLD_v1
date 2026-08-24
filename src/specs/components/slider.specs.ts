/**
 * @fileoverview Spécifications pour le composant Slider
 * @description Spécifications Material Design 3 Expressive pour le composant Slider
 */

import { SliderOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';
import { getHapticFeedbackDefaults } from '../common/haptic-feedback.specs';

/**
 * Spécifications Material Design 3 Expressive pour les sliders
 * Basé sur les spécifications officielles Material Design 3 You Expressive
 */
export const SliderSpecs = {
    /**
     * Tailles disponibles selon Material Design 3 Expressive
     */
    sizes: {
        xs: {
            trackHeight: 16, // 16dp
            handleWidth: 4, // 4dp
            handleHeight: 44, // 44dp
            trackShape: 8, // 8dp border radius
            innerRadius: 2, // 2dp inner radius
            handleGap: 6, // 6dp gap transparent autour du handle
            label: 'XS: 16dp'
        },
        s: {
            trackHeight: 24, // 24dp
            handleWidth: 4, // 4dp
            handleHeight: 44, // 44dp
            trackShape: 8, // 8dp border radius
            innerRadius: 2, // 2dp inner radius
            handleGap: 6, // 6dp gap transparent autour du handle
            label: 'S: 24dp'
        },
        m: {
            trackHeight: 40, // 40dp
            handleWidth: 4, // 4dp
            handleHeight: 52, // 52dp
            trackShape: 12, // 12dp border radius
            innerRadius: 2, // 2dp inner radius
            handleGap: 6, // 6dp gap transparent autour du handle
            label: 'M: 40dp (Default)'
        },
        l: {
            trackHeight: 56, // 56dp
            handleWidth: 4, // 4dp
            handleHeight: 68, // 68dp
            trackShape: 16, // 16dp border radius
            innerRadius: 2, // 2dp inner radius
            handleGap: 6, // 6dp gap transparent autour du handle
            label: 'L: 56dp'
        },
        xl: {
            trackHeight: 96, // 96dp (corrigé selon Material Design 3)
            handleWidth: 4, // 4dp
            handleHeight: 108, // 108dp (dépasse du track)
            trackShape: 28, // 28dp border radius
            innerRadius: 2, // 2dp inner radius
            handleGap: 6, // 6dp gap transparent autour du handle
            label: 'XL: 96dp'
        }
    },

    /**
     * Comportements par défaut
     */
    behaviors: {
        discrete: false,
        vertical: false,
        centered: false,
        range: false,
        disabled: false,
        showLabel: false,
        showValueLabel: true,
        showStopIndicators: false,
        direction: 'auto' as 'auto' | 'ltr' | 'rtl'
    },

    /**
     * Valeurs par défaut
     */
    defaults: {
        value: 50,
        valueStart: 25,
        valueEnd: 75,
        min: 0,
        max: 100,
        step: 1
    }
};

/**
 * Extrait les valeurs par défaut pour Slider
 * @returns Options par défaut pour Slider
 */
export function getSliderDefaults(): SliderOptions {
    return {
        value: SliderSpecs.defaults.value,
        min: SliderSpecs.defaults.min,
        max: SliderSpecs.defaults.max,
        step: SliderSpecs.defaults.step,
        size: 'm',
        disabled: SliderSpecs.behaviors.disabled,
        label: undefined,
        onChange: null,
        priorityLevel: PriorityLevel.MEDIUM,
        ...getHapticFeedbackDefaults('selection'),
    };
}

