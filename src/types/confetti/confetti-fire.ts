/**
 * Types partagés pour `Confetti.fire()` et les presets (`src/utils/confetti/`).
 * Miroir des interfaces internes de `Confetti.ts` (évite l’import composant depuis utils).
 */

/** Forme confetti dérivée d’un path SVG */
export interface ConfettiPathShape {
    type: 'path';
    path: string;
    matrix: number[];
}

/** Forme confetti dérivée d’un bitmap (texte / emoji) */
export interface ConfettiBitmapShape {
    type: 'bitmap';
    bitmap: ImageBitmap;
    matrix: number[];
}

export type ConfettiFireShape = string | ConfettiPathShape | ConfettiBitmapShape;

/** Options passées à `Confetti#fire()` (canvas-confetti) */
export interface ConfettiFireOptions {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    origin?: { x?: number; y?: number };
    shapes?: ConfettiFireShape[];
    zIndex?: number;
    colors?: string[];
    disableForReducedMotion?: boolean;
    scalar?: number;
    flat?: boolean;
}

/** Instance minimale utilisée par les presets */
export interface ConfettiPresetInstance {
    fire(options?: ConfettiFireOptions): Promise<void>;
}

/** Entrée optionnelle d’un preset : instance, élément DOM ou défaut `.confetti` */
export type ConfettiPresetInput = ConfettiPresetInstance | HTMLElement | undefined;

/** Constructeur `Confetti` + méthodes statiques requises par les presets */
export interface ConfettiClassWithStatics {
    getInstance(el: HTMLElement): ConfettiPresetInstance | undefined;
    new (el: HTMLElement, options?: { resize?: boolean }): ConfettiPresetInstance;
    shapeFromPath(pathData: string | { path: string; matrix?: number[] }): ConfettiPathShape;
    shapeFromText(
        textData:
            | string
            | {
                  text: string;
                  scalar?: number;
                  fontFamily?: string;
                  color?: string;
              }
    ): ConfettiBitmapShape;
}
