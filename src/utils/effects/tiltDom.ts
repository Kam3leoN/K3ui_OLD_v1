/**
 * @fileoverview Constantes et helpers DOM du moteur Tilt K3UI
 */

/** Classes DOM générées par Tilt */
export const TILT_CLASS = {
    scale: 'tilt-scale',
    rotate: 'tilt-rotate',
    inner: 'tilt-inner',
    shadow: 'tilt-shadow',
    highlight: 'tilt-highlight',
    active: 'tilt-active',
    rotateTouch: 'tilt-rotate-touch',
} as const;

/** Sélecteurs incluant alias legacy (compatibilité markup historique) */
export const TILT_SELECTORS = {
    scale: '.tilt-scale, .atropos-scale',
    rotate: '.tilt-rotate, .atropos-rotate',
    inner: '.tilt-inner, .atropos-inner',
    shadow: '.tilt-shadow, .atropos-shadow',
    highlight: '.tilt-highlight, .atropos-highlight',
    parallaxLayers:
        '[data-tilt-offset], [data-atropos-offset], [data-tilt-opacity], [data-atropos-opacity]',
    offsetLayers: '[data-tilt-offset], [data-atropos-offset]',
    opacityLayers: '[data-tilt-opacity], [data-atropos-opacity]',
} as const;

export const TILT_ENGINE_KEY = '__tiltEngine__';

type TiltEngineHost = HTMLElement & { __tiltEngine__?: unknown; __atropos__?: unknown };

/**
 * Récupère l'offset parallax d'un calque (data-tilt-offset ou alias legacy).
 * @param element Calque parallax
 * @returns Valeur numérique ou undefined
 */
export function getTiltLayerOffset(element: HTMLElement): number | undefined {
    const raw = element.dataset.tiltOffset ?? element.dataset.atroposOffset;
    if (raw == null || raw === '') {
        return undefined;
    }
    const value = parseFloat(raw);
    return Number.isNaN(value) ? undefined : value;
}

/**
 * Récupère les opacités parallax d'un calque (data-tilt-opacity ou alias legacy).
 * @param element Calque parallax
 * @returns Tableau min/max ou undefined
 */
export function getTiltLayerOpacity(element: HTMLElement): number[] | undefined {
    const raw = element.dataset.tiltOpacity ?? element.dataset.atroposOpacity;
    if (!raw) {
        return undefined;
    }
    return raw.split(';').map((part) => parseFloat(part));
}

/**
 * Indique si le moteur Tilt est déjà attaché à l'élément.
 * @param el Élément racine Tilt
 */
export function hasTiltEngine(el: HTMLElement): boolean {
    const host = el as TiltEngineHost;
    return Boolean(host.__tiltEngine__ ?? host.__atropos__);
}

/**
 * Enregistre l'instance moteur sur l'élément racine.
 * @param el Élément racine Tilt
 * @param instance Instance moteur
 */
export function setTiltEngine(el: HTMLElement, instance: unknown): void {
    const host = el as TiltEngineHost;
    host.__tiltEngine__ = instance;
    delete host.__atropos__;
}

/**
 * Supprime l'instance moteur de l'élément racine.
 * @param el Élément racine Tilt
 */
export function clearTiltEngine(el: HTMLElement): void {
    const host = el as TiltEngineHost;
    delete host.__tiltEngine__;
    delete host.__atropos__;
}
