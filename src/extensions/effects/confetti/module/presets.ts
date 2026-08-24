/**
 * @fileoverview Presets de confetti pour K3UI
 * @description Fonctions utilitaires pour créer des effets de confetti prédéfinis
 * @author K3UI Team
 * @version 1.0.0
 */

import { Confetti } from '../Confetti';
import type {
    ConfettiClassWithStatics,
    ConfettiFireOptions,
    ConfettiFireShape,
    ConfettiPresetInput,
    ConfettiPresetInstance,
} from '../../../../types/confetti/confetti-fire';

/**
 * Fonction utilitaire pour générer des nombres aléatoires
 * @param min Valeur minimale
 * @param max Valeur maximale
 * @returns Nombre aléatoire entre min et max
 */
function randomInRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

/** Interface pour les fonctions de preset */
export interface ConfettiPresetFunction {
    (confettiOrEl?: ConfettiPresetInput): void;
}

function getConfettiClass(): ConfettiClassWithStatics {
    return Confetti;
}

function isConfettiInstance(value: unknown): value is ConfettiPresetInstance {
    return typeof value === 'object' && value !== null && typeof (value as ConfettiPresetInstance).fire === 'function';
}

function resolveConfettiElement(confettiOrEl: ConfettiPresetInput): HTMLElement | null {
    if (!confettiOrEl) {
        let el = document.querySelector('.confetti');
        if (!el) {
            el = document.createElement('div');
            el.className = 'confetti';
            document.body.appendChild(el);
        }
        return el instanceof HTMLElement ? el : null;
    }
    if (isConfettiInstance(confettiOrEl)) {
        return null;
    }
    return confettiOrEl;
}

/**
 * Helper pour obtenir une instance Confetti depuis un élément ou une instance
 * @param confettiOrEl Instance Confetti ou élément DOM
 * @returns Instance Confetti
 */
function getConfettiInstance(confettiOrEl?: ConfettiPresetInput): ConfettiPresetInstance | null {
    const Confetti = getConfettiClass();
    if (!Confetti) {
        return null;
    }

    if (isConfettiInstance(confettiOrEl)) {
        return confettiOrEl;
    }

    const el = resolveConfettiElement(confettiOrEl);
    if (!el) {
        return null;
    }

    return Confetti.getInstance(el) ?? new Confetti(el, { resize: true });
}

function requireConfettiWithShapeFromPath(): ConfettiClassWithStatics | null {
    const Confetti = getConfettiClass();
    if (!Confetti?.shapeFromPath) {
        console.error('Confetti.shapeFromPath is not available');
        return null;
    }
    return Confetti;
}

function requireConfettiWithShapeFromText(): ConfettiClassWithStatics | null {
    const Confetti = getConfettiClass();
    if (!Confetti?.shapeFromText) {
        console.error('Confetti.shapeFromText is not available');
        return null;
    }
    return Confetti;
}

/**
 * Preset Basic Cannon - Le mode par défaut, un tir basique de confettis
 * @param confettiOrEl Instance de confetti ou élément DOM (optionnel, utilise .confetti par défaut)
 */
export function fireBasicCannon(confettiOrEl?: ConfettiPresetInput): void {
    const confetti = getConfettiInstance(confettiOrEl);
    if (!confetti) return;
    const instance = confetti;
    instance.fire({
        particleCount: 100,
        spread: 70,
        origin: {
            x: 0.5,
            y: 0.6,
        },
    });
}

/**
 * Preset Random Direction - Tir aléatoire avec directions variées
 * @param confettiOrEl Instance de confetti ou élément DOM (optionnel, utilise .confetti par défaut)
 */
export function fireRandomDirection(confettiOrEl?: ConfettiPresetInput): void {
    const confetti = getConfettiInstance(confettiOrEl);
    if (!confetti) return;
    const instance = confetti;
    instance.fire({
        angle: randomInRange(55, 125),
        spread: randomInRange(50, 70),
        particleCount: randomInRange(50, 100),
        origin: {
            x: 0.5,
            y: 0.6,
        },
    });
}

/**
 * Preset Realistic Look - Effet réaliste avec plusieurs tirs combinés
 * @param confettiOrEl Instance de confetti ou élément DOM (optionnel, utilise .confetti par défaut)
 */
export function fireRealisticLook(confettiOrEl?: ConfettiPresetInput): void {
    const confetti = getConfettiInstance(confettiOrEl);
    if (!confetti) return;
    const instance = confetti;
    const count = 200;
    const defaults = {
        origin: {
            x: 0.5,
            y: 0.7,
        },
    };

    function fire(particleRatio: number, opts: Partial<ConfettiFireOptions>): void {
        instance.fire({
            ...defaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio),
        });
    }

    fire(0.25, {
        spread: 26,
        startVelocity: 55,
    });
    fire(0.2, {
        spread: 60,
    });
    fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
    });
    fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
    });
    fire(0.1, {
        spread: 120,
        startVelocity: 45,
    });
}

/**
 * Preset Fireworks - Feu d'artifice depuis les côtés
 * @param confettiOrEl Instance de confetti ou élément DOM (optionnel, utilise .confetti par défaut)
 */
export function fireFireworks(confettiOrEl?: ConfettiPresetInput): void {
    const confetti = getConfettiInstance(confettiOrEl);
    if (!confetti) return;
    const instance = confetti;
    const duration = 15 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = {
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        zIndex: 0,
    };

    const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            clearInterval(interval);
            return;
        }

        const particleCount = 50 * (timeLeft / duration);

        instance.fire({
            ...defaults,
            particleCount,
            origin: {
                x: randomInRange(0.1, 0.3),
                y: Math.random() - 0.2,
            },
        });
        instance.fire({
            ...defaults,
            particleCount,
            origin: {
                x: randomInRange(0.7, 0.9),
                y: Math.random() - 0.2,
            },
        });
    }, 250);
}

/**
 * Preset Stars - Étoiles avec effet de célébration
 * @param confettiOrEl Instance de confetti ou élément DOM (optionnel, utilise .confetti par défaut)
 */
export function fireStars(confettiOrEl?: ConfettiPresetInput): void {
    const confetti = getConfettiInstance(confettiOrEl);
    if (!confetti) return;
    const instance = confetti;
    const defaults = {
        spread: 360,
        ticks: 50,
        gravity: 0,
        decay: 0.94,
        startVelocity: 30,
        colors: ['FFE400', 'FFBD00', 'E89400', 'FFCA6C', 'FDFFB8'],
    };

    function shoot(): void {
        instance.fire({
            ...defaults,
            particleCount: 40,
            scalar: 1.2,
            shapes: ['star'],
        });
    }

    setTimeout(shoot, 0);
    setTimeout(shoot, 100);
    setTimeout(shoot, 200);
}

/**
 * Preset Snow - Neige qui tombe doucement
 * @param confettiOrEl Instance de confetti ou élément DOM (optionnel, utilise .confetti par défaut)
 */
export function fireSnow(confettiOrEl?: ConfettiPresetInput): void {
    const confetti = getConfettiInstance(confettiOrEl);
    if (!confetti) return;
    const instance = confetti;
    const Confetti = requireConfettiWithShapeFromPath();
    if (!Confetti) return;

    // Snowflake shape (viewBox: 0 0 512 512)
    const snowflake = Confetti.shapeFromPath({
        path: 'M288.2 0c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 62.1-15-15c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l49 49 0 70.6-61.2-35.3-17.9-66.9c-3.4-12.8-16.6-20.4-29.4-17S95.3 98 98.7 110.8l5.5 20.5-53.7-31C35.2 91.5 15.6 96.7 6.8 112s-3.6 34.9 11.7 43.7l53.7 31-20.5 5.5c-12.8 3.4-20.4 16.6-17 29.4s16.6 20.4 29.4 17l66.9-17.9 61.2 35.3-61.2 35.3-66.9-17.9c-12.8-3.4-26 4.2-29.4 17s4.2 26 17 29.4l20.5 5.5-53.7 31C3.2 365.1-2 384.7 6.8 400s28.4 20.6 43.7 11.7l53.7-31-5.5 20.5c-3.4 12.8 4.2 26 17 29.4s26-4.2 29.4-17l17.9-66.9 61.2-35.3 0 70.6-49 49c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l15-15 0 62.1c0 17.7 14.3 32 32 32s32-14.3 32-32l0-62.1 15 15c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-49-49 0-70.6 61.2 35.3 17.9 66.9c3.4 12.8 16.6 20.4 29.4 17s20.4-16.6 17-29.4l-5.5-20.5 53.7 31c15.3 8.8 34.9 3.6 43.7-11.7s3.6-34.9-11.7-43.7l-53.7-31 20.5-5.5c12.8-3.4 20.4-16.6 17-29.4s-16.6-20.4-29.4-17l-66.9 17.9-61.2-35.3 61.2-35.3 66.9 17.9c12.8 3.4 26-4.2 29.4-17s-4.2-26-17-29.4l-20.5-5.5 53.7-31c15.3-8.8 20.6-28.4 11.7-43.7s-28.4-20.5-43.7-11.7l-53.7 31 5.5-20.5c3.4-12.8-4.2-26-17-29.4s-26 4.2-29.4 17l-17.9 66.9-61.2 35.3 0-70.6 49-49c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-15 15 0-62.1z',
        matrix: [0.01953125, 0, 0, 0.01953125, -5, -5],
    });

    // Star of life shape (viewBox: 0 0 512 512)
    const starOfLife = Confetti.shapeFromPath({
        path: 'M208.5 32c0-17.7 14.3-32 32-32l32 0c17.7 0 32 14.3 32 32l0 140.9 122-70.4c15.3-8.8 34.9-3.6 43.7 11.7l16 27.7c8.8 15.3 3.6 34.9-11.7 43.7l-122 70.4 122 70.4c15.3 8.8 20.6 28.4 11.7 43.7l-16 27.7c-8.8 15.3-28.4 20.6-43.7 11.7l-122-70.4 0 140.9c0 17.7-14.3 32-32 32l-32 0c-17.7 0-32-14.3-32-32l0-140.9-122 70.4c-15.3 8.8-34.9 3.6-43.7-11.7l-16-27.7c-8.8-15.3-3.6-34.9 11.7-43.7l122-70.4-122-70.4c-15.3-8.8-20.5-28.4-11.7-43.7l16-27.7c8.8-15.3 28.4-20.5 43.7-11.7l122 70.4 0-140.9z',
        matrix: [0.01953125, 0, 0, 0.01953125, -5, -5],
    });

    const duration = 15 * 1000;
    const animationEnd = Date.now() + duration;
    let skew = 1;

    (function frame() {
        const timeLeft = animationEnd - Date.now();
        const ticks = Math.max(200, 500 * (timeLeft / duration));
        skew = Math.max(0.8, skew - 0.001);

        const shapeType = Math.random();
        let shapes: ConfettiFireShape[];
        let scalar: number;
        if (shapeType < 0.4) {
            shapes = [snowflake];
            scalar = randomInRange(1.5, 2.5); // Flocons plus gros
        } else if (shapeType < 0.8) {
            shapes = [starOfLife];
            scalar = randomInRange(1.5, 2.5); // Star of life plus grosse
        } else {
            shapes = ['circle'];
            scalar = randomInRange(0.4, 1); // Cercles normaux
        }

        instance.fire({
            particleCount: 1,
            startVelocity: 0,
            ticks: ticks,
            origin: {
                x: Math.random(),
                y: (Math.random() * skew) - 0.2,
            },
            colors: ['#ffffff'],
            shapes: shapes,
            gravity: randomInRange(0.4, 0.6),
            scalar: scalar,
            drift: randomInRange(-0.4, 0.4),
        });

        if (timeLeft > 0) {
            requestAnimationFrame(frame);
        }
    })();
}

/**
 * Preset School Pride - Effet de célébration avec couleurs personnalisées
 * @param confettiOrEl Instance de confetti ou élément DOM (optionnel, utilise .confetti par défaut)
 * @param colors Couleurs personnalisées (optionnel, défaut: ['#bb0000', '#ffffff'])
 */
export function fireSchoolPride(
    confettiOrEl?: ConfettiPresetInput,
    colors: string[] = ['#bb0000', '#ffffff']
): void {
    const confetti = getConfettiInstance(confettiOrEl);
    if (!confetti) return;
    const instance = confetti;
    const end = Date.now() + 15 * 1000;

    (function frame() {
        instance.fire({
            particleCount: 2,
            angle: 60,
            spread: 55,
            origin: {
                x: 0,
                y: 0.5,
            },
            colors: colors,
        });
        instance.fire({
            particleCount: 2,
            angle: 120,
            spread: 55,
            origin: {
                x: 1,
                y: 0.5,
            },
            colors: colors,
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    })();
}

/**
 * Preset Custom Shapes - Formes personnalisées (pumpkin, tree, heart)
 * @param confettiOrEl Instance de confetti ou élément DOM (optionnel, utilise .confetti par défaut)
 */
export function fireCustomShapes(confettiOrEl?: ConfettiPresetInput): void {
    const confetti = getConfettiInstance(confettiOrEl);
    if (!confetti) return;
    const instance = confetti;
    const Confetti = requireConfettiWithShapeFromPath();
    if (!Confetti) return;

    // pumpkin shape from https://thenounproject.com/icon/pumpkin-5253388/
    const pumpkin = Confetti.shapeFromPath({
        path: 'M449.4 142c-5 0-10 .3-15 1a183 183 0 0 0-66.9-19.1V87.5a17.5 17.5 0 1 0-35 0v36.4a183 183 0 0 0-67 19c-4.9-.6-9.9-1-14.8-1C170.3 142 105 219.6 105 315s65.3 173 145.7 173c5 0 10-.3 14.8-1a184.7 184.7 0 0 0 169 0c4.9.7 9.9 1 14.9 1 80.3 0 145.6-77.6 145.6-173s-65.3-173-145.7-173zm-220 138 27.4-40.4a11.6 11.6 0 0 1 16.4-2.7l54.7 40.3a11.3 11.3 0 0 1-7 20.3H239a11.3 11.3 0 0 1-9.6-17.5zM444 383.8l-43.7 17.5a17.7 17.7 0 0 1-13 0l-37.3-15-37.2 15a17.8 17.8 0 0 1-13 0L256 383.8a17.5 17.5 0 0 1 13-32.6l37.3 15 37.2-15c4.2-1.6 8.8-1.6 13 0l37.3 15 37.2-15a17.5 17.5 0 0 1 13 32.6zm17-86.3h-82a11.3 11.3 0 0 1-6.9-20.4l54.7-40.3a11.6 11.6 0 0 1 16.4 2.8l27.4 40.4a11.3 11.3 0 0 1-9.6 17.5z',
        matrix: [0.020491803278688523, 0, 0, 0.020491803278688523, -7.172131147540983, -5.9016393442622945],
    });

    // tree shape from https://thenounproject.com/icon/pine-tree-1471679/
    const tree = Confetti.shapeFromPath({
        path: 'M120 240c-41,14 -91,18 -120,1 29,-10 57,-22 81,-40 -18,2 -37,3 -55,-3 25,-14 48,-30 66,-51 -11,5 -26,8 -45,7 20,-14 40,-30 57,-49 -13,1 -26,2 -38,-1 18,-11 35,-25 51,-43 -13,3 -24,5 -35,6 21,-19 40,-41 53,-67 14,26 32,48 54,67 -11,-1 -23,-3 -35,-6 15,18 32,32 51,43 -13,3 -26,2 -38,1 17,19 36,35 56,49 -19,1 -33,-2 -45,-7 19,21 42,37 67,51 -19,6 -37,5 -56,3 25,18 53,30 82,40 -30,17 -79,13 -120,-1l0 41 -31 0 0 -41z',
        matrix: [0.03597122302158273, 0, 0, 0.03597122302158273, -4.856115107913669, -5.071942446043165],
    });

    // heart shape from https://thenounproject.com/icon/heart-1545381/
    const heart = Confetti.shapeFromPath({
        path: 'M167 72c19,-38 37,-56 75,-56 42,0 76,33 76,75 0,76 -76,151 -151,227 -76,-76 -151,-151 -151,-227 0,-42 33,-75 75,-75 38,0 57,18 76,56z',
        matrix: [0.03333333333333333, 0, 0, 0.03333333333333333, -5.566666666666666, -5.533333333333333],
    });

    const defaults = {
        scalar: 2,
        spread: 180,
        particleCount: 30,
        origin: {
            x: 0.5,
            y: -0.1,
        },
        startVelocity: -35,
    };

    instance.fire({
        ...defaults,
        shapes: [pumpkin],
        colors: ['#ff9a00', '#ff7400', '#ff4d00'],
    });

    instance.fire({
        ...defaults,
        shapes: [tree],
        colors: ['#8d960f', '#be0f10', '#445404'],
    });

    instance.fire({
        ...defaults,
        shapes: [heart],
        colors: ['#f93963', '#a10864', '#ee0b93'],
    });
}

/**
 * Preset America - Célébration américaine avec étoiles et formes personnalisées
 * @param confettiOrEl Instance de confetti ou élément DOM (optionnel, utilise .confetti par défaut)
 */
export function fireAmerica(confettiOrEl?: ConfettiPresetInput): void {
    const confetti = getConfettiInstance(confettiOrEl);
    if (!confetti) return;
    const instance = confetti;
    const Confetti = requireConfettiWithShapeFromPath();
    if (!Confetti) return;

    // Couleurs américaines : bleu, blanc, rouge
    const colors = ['#0A3161', '#eeeeee', '#B31942'];

    // Star shape (viewBox: 0 0 576 512)
    const star = Confetti.shapeFromPath({
        path: 'M309.5-18.9c-4.1-8-12.4-13.1-21.4-13.1s-17.3 5.1-21.4 13.1L193.1 125.3 33.2 150.7c-8.9 1.4-16.3 7.7-19.1 16.3s-.5 18 5.8 24.4l114.4 114.5-25.2 159.9c-1.4 8.9 2.3 17.9 9.6 23.2s16.9 6.1 25 2L288.1 417.6 432.4 491c8 4.1 17.7 3.3 25-2s11-14.2 9.6-23.2L441.7 305.9 556.1 191.4c6.4-6.4 8.6-15.8 5.8-24.4s-10.1-14.9-19.1-16.3L383 125.3 309.5-18.9z',
        matrix: [0.020491803278688523, 0, 0, 0.020491803278688523, -7.172131147540983, -5.9016393442622945],
    });

    const count = 200;
    const defaults = {
        origin: {
            x: 0.5,
            y: 0.7,
        },
        colors: colors,
        shapes: [star],
    };

    function fire(particleRatio: number, opts: Partial<ConfettiFireOptions>): void {
        instance.fire({
            ...defaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio),
        });
    }

    fire(0.25, {
        spread: 26,
        startVelocity: 55,
        scalar: 1.2,
    });
    fire(0.2, {
        spread: 60,
        scalar: 1.4,
    });
    fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 1.6,
    });
    fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.8,
    });
    fire(0.1, {
        spread: 120,
        startVelocity: 45,
        scalar: 2,
    });
}

/**
 * Preset France - Célébration française avec hexagone aux couleurs tricolores
 * @param confettiOrEl Instance de confetti ou élément DOM (optionnel, utilise .confetti par défaut)
 */
export function fireFrance(confettiOrEl?: ConfettiPresetInput): void {
    const confetti = getConfettiInstance(confettiOrEl);
    if (!confetti) return;
    const instance = confetti;
    const Confetti = requireConfettiWithShapeFromPath();
    if (!Confetti) return;

    // Couleurs françaises : bleu, blanc, rouge
    const colors = ['#0099ff', '#eeeeee', '#B31942']; //'#0A3161'
    // Hexagon shape (viewBox: 0 0 576 512)
    const hexagon = Confetti.shapeFromPath({
        path: 'M33.5 220.3c-12.7 22.2-12.7 49.4 0 71.5l96.2 168.1c12.8 22.4 36.7 36.2 62.5 36.2l191.6 0c25.8 0 49.7-13.8 62.5-36.2l96.2-168.1c12.7-22.2 12.7-49.4 0-71.5L446.3 52.2C433.5 29.8 409.6 16 383.8 16L192.2 16c-25.8 0-49.7 13.8-62.5 36.2L33.5 220.3z',
        matrix: [0.017361111111111112, 0, 0, 0.01953125, -4.163194444444444, -4.5],
    });

    const count = 200;
    const defaults = {
        origin: {
            x: 0.5,
            y: 0.7,
        },
        colors: colors,
        shapes: [hexagon],
    };

    function fire(particleRatio: number, opts: Partial<ConfettiFireOptions>): void {
        instance.fire({
            ...defaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio),
        });
    }

    fire(0.25, {
        spread: 26,
        startVelocity: 55,
        scalar: 1.2,
    });
    fire(0.2, {
        spread: 60,
        scalar: 1.4,
    });
    fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 1.6,
    });
    fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.8,
    });
    fire(0.1, {
        spread: 120,
        startVelocity: 45,
        scalar: 2,
    });
}

/**
 * Preset Emoji - Confettis emoji
 * @param confettiOrEl Instance de confetti ou élément DOM (optionnel, utilise .confetti par défaut)
 * @param emoji Emoji à utiliser (optionnel, défaut: '🦄')
 */
export function fireEmoji(confettiOrEl?: ConfettiPresetInput, emoji: string = '🦄'): void {
    const confetti = getConfettiInstance(confettiOrEl);
    if (!confetti) return;
    const instance = confetti;
    const Confetti = requireConfettiWithShapeFromText();
    if (!Confetti) return;
    const scalar = 2;
    const unicorn = Confetti.shapeFromText({
        text: emoji,
        scalar: scalar,
    });

    const defaults = {
        spread: 360,
        ticks: 60,
        gravity: 0,
        decay: 0.96,
        startVelocity: 20,
        shapes: [unicorn],
        scalar: scalar,
    };

    function shoot(): void {
        instance.fire({
            ...defaults,
            particleCount: 30,
        });
        instance.fire({
            ...defaults,
            particleCount: 5,
            flat: true,
        });
        instance.fire({
            ...defaults,
            particleCount: 15,
            scalar: scalar / 2,
            shapes: ['circle'],
        });
    }

    setTimeout(shoot, 0);
    setTimeout(shoot, 100);
    setTimeout(shoot, 200);
}
