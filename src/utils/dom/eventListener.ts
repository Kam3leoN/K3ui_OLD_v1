/**
 * @fileoverview Utilitaires bas niveau pour les événements DOM
 * @description Fonctions pures pour aider à la manipulation des événements (feature detection, helpers)
 * @author K3UI Team
 * @version 2.0.0
 */

// ============================================================================
// FEATURE DETECTION
// ============================================================================

/**
 * Cache pour le support des options passives
 */
let passiveSupported: boolean | null = null;

/**
 * Vérifie si le navigateur supporte les event listeners passifs.
 * Utile pour améliorer les performances du scroll sur mobile.
 * @returns {boolean} True si supporté
 */
export function isPassiveSupported(): boolean {
    if (passiveSupported !== null) {
        return passiveSupported;
    }

    try {
        const options = Object.defineProperty({}, 'passive', {
            get: function () {
                passiveSupported = true;
                return true;
            }
        });
        // Test bidon sur un événement qui ne sera jamais déclenché
        const noop = (): void => undefined;
        window.addEventListener('testPassive', noop, options);
        window.removeEventListener('testPassive', noop, options);
    } catch (err) {
        passiveSupported = false;
    }

    return passiveSupported || false;
}

/**
 * Retourne les options normalisées pour un listener passif si supporté.
 * @param {boolean} passive - Si true, tente d'activer le mode passif
 * @returns {boolean | AddEventListenerOptions} L'objet d'options ou booléen
 */
export function passiveOpts(passive: boolean = true): boolean | AddEventListenerOptions {
    return isPassiveSupported() && passive ? { passive: true } : false;
}

// ============================================================================
// HELPERS D'ÉVÉNEMENTS
// ============================================================================

/**
 * Arrête complètement la propagation d'un événement (capture et bubbling) et l'action par défaut.
 * @param {Event} e - L'événement à arrêter
 */
export function stopEvent(e: Event): void {
    if (!e) return;
    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === 'function') {
        e.stopImmediatePropagation();
    }
}

/**
 * Récupère le chemin complet de l'événement (compatible Shadow DOM).
 * Polyfill léger pour composedPath().
 * @param {Event} evt - L'événement
 * @returns {EventTarget[]} Le chemin des éléments traversés
 */
export function getEventPath(evt: Event): EventTarget[] {
    if (typeof evt.composedPath === 'function') {
        return evt.composedPath();
    }

    // Fallback pour les vieux navigateurs
    const path: EventTarget[] = [];
    let currentElem: Node | null = evt.target as Node;

    while (currentElem) {
        path.push(currentElem);
        if (currentElem instanceof HTMLElement && currentElem.tagName === 'HTML') {
            path.push(document);
            path.push(window);
            return path;
        }
        currentElem = currentElem.parentNode;
    }
    return path;
}

/**
 * Vérifie si un événement a été déclenché par un clic tactile (touch).
 * Utile pour distinguer les clics souris des taps sur mobile.
 * @param {Event} e - L'événement
 * @returns {boolean} True si c'est un événement touch ou pointerType touch
 */
export function isTouchEvent(e: Event): boolean {
    if (e.type.startsWith('touch')) return true;
    if ((e as PointerEvent).pointerType === 'touch') return true;
    return false;
}

/**
 * Normalise la récupération des coordonnées (X, Y) depuis un MouseEvent ou TouchEvent.
 * @param {MouseEvent | TouchEvent | PointerEvent} e - L'événement
 * @returns {{x: number, y: number}} Les coordonnées {x, y}
 */
export function getPointerCoords(e: MouseEvent | TouchEvent | PointerEvent): { x: number; y: number } {
    // Cas TouchEvent
    if ((window.TouchEvent && e instanceof TouchEvent) || 'touches' in e) {
        const touch = (e as TouchEvent).touches[0] || (e as TouchEvent).changedTouches[0];
        return { x: touch.clientX, y: touch.clientY };
    }

    // Cas MouseEvent / PointerEvent
    return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
}