/**
 * @fileoverview Animation ressort M3 pour Dialog (pattern Fade : scale + opacity)
 * @description Pilote --dialog-spatial et --dialog-effects via SpringValue
 */

import { getM3SpringSpecs, SpringValue, type M3SpringSpeed } from './springValue';

export interface DialogSpringController {
    spatial: SpringValue;
    effects: SpringValue;
    /** Attend la fin des deux ressorts */
    animateTo(target: number, speed?: M3SpringSpeed): Promise<void>;
    jump(value: number): void;
    destroy(): void;
}

/**
 * Crée un contrôleur ressort pour un dialog (élément .dialog + overlay).
 * @param dialogEl - Élément .dialog
 * @param overlayEl - Overlay scrim
 * @param animation - Schéma expressive ou spatial
 */
export function createDialogSpringController(
    dialogEl: HTMLElement,
    overlayEl: HTMLElement,
    animation: 'expressive' | 'spatial' = 'expressive'
): DialogSpringController {
    const setSpatial = (v: number): void => {
        dialogEl.style.setProperty('--dialog-spatial', String(v));
    };
    const setEffects = (v: number): void => {
        dialogEl.style.setProperty('--dialog-effects', String(v));
        overlayEl.style.setProperty('--dialog-effects', String(v));
    };

    const defaultSpecs = getM3SpringSpecs(animation, 'default');
    const spatial = new SpringValue(0, defaultSpecs.spatial, setSpatial);
    const effects = new SpringValue(0, defaultSpecs.effects, setEffects);

    const animateTo = (target: number, speed: M3SpringSpeed = 'default'): Promise<void> => {
        const specs = getM3SpringSpecs(animation, speed);
        return new Promise<void>((resolve) => {
            let pending = 2;
            const done = (): void => {
                if (--pending <= 0) resolve();
            };
            spatial.setTarget(target, specs.spatial, done);
            effects.setTarget(target, specs.effects, done);
        });
    };

    return {
        spatial,
        effects,
        animateTo,
        jump(value: number): void {
            spatial.jump(value);
            effects.jump(value);
        },
        destroy(): void {
            spatial.cancel();
            effects.cancel();
        },
    };
}
