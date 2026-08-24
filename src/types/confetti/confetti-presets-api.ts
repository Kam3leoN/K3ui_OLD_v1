import type * as ConfettiPresets from '../../extensions/effects/confetti/module/presets';

/** Presets canvas-confetti exposés sur `K.Confetti` après chargement différé. */
export type ConfettiPresetApi = Pick<
    typeof ConfettiPresets,
    | 'fireBasicCannon'
    | 'fireRandomDirection'
    | 'fireRealisticLook'
    | 'fireFireworks'
    | 'fireStars'
    | 'fireSnow'
    | 'fireSchoolPride'
    | 'fireCustomShapes'
    | 'fireEmoji'
    | 'fireAmerica'
    | 'fireFrance'
>;

import type { ConfettiClassWithStatics } from './confetti-fire';

/** Constructeur Confetti enrichi des helpers de presets (runtime). */
export type ConfettiConstructorWithPresets = ConfettiClassWithStatics & ConfettiPresetApi;
