/**
 * @fileoverview Barrel Confetti + presets (chargement différé).
 */

import { Confetti } from '../Confetti';
import type { ConfettiConstructorWithPresets } from '../../../../types/confetti/confetti-presets-api';
import {
    fireAmerica,
    fireBasicCannon,
    fireCustomShapes,
    fireEmoji,
    fireFireworks,
    fireFrance,
    fireRandomDirection,
    fireRealisticLook,
    fireSchoolPride,
    fireSnow,
    fireStars,
} from './presets';

export { Confetti };
export * from './presets';

const PRESET_BINDINGS = [
    fireBasicCannon,
    fireRandomDirection,
    fireRealisticLook,
    fireFireworks,
    fireStars,
    fireSnow,
    fireSchoolPride,
    fireCustomShapes,
    fireEmoji,
    fireAmerica,
    fireFrance,
] as const;

const PRESET_KEYS = [
    'fireBasicCannon',
    'fireRandomDirection',
    'fireRealisticLook',
    'fireFireworks',
    'fireStars',
    'fireSnow',
    'fireSchoolPride',
    'fireCustomShapes',
    'fireEmoji',
    'fireAmerica',
    'fireFrance',
] as const;

/**
 * Attache les presets confetti au constructeur `Confetti` (chunk différé).
 * @param ConfettiClass - Classe `Confetti` sur `window.K`
 */
export function attachConfettiPresetsToClass(ConfettiClass: ConfettiConstructorWithPresets): void {
    PRESET_KEYS.forEach((key, index) => {
        (ConfettiClass as Record<typeof key, (typeof PRESET_BINDINGS)[number]>)[key] = PRESET_BINDINGS[index];
    });
}

attachConfettiPresetsToClass(Confetti as ConfettiConstructorWithPresets);

/** Namespace rétrocompatible `K.ConfettiPresets` (attaché au chargement différé). */
export const ConfettiPresets = {
    fireAmerica,
    fireBasicCannon,
    fireCustomShapes,
    fireEmoji,
    fireFireworks,
    fireFrance,
    fireRandomDirection,
    fireRealisticLook,
    fireSchoolPride,
    fireSnow,
    fireStars,
};
