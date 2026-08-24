/**
 * @fileoverview Helpers pour les performances et optimisations
 * @description Fonctions utilitaires pour throttling, debouncing et optimisations
 * @author K3UI Team
 * @version 1.0.0
 */

/**
 * Options pour le throttling
 */
export interface ThrottleOptions {
    /** Exécuter au début */
    readonly leading?: boolean;
    /** Exécuter à la fin */
    readonly trailing?: boolean;
}

/**
 * Fonction de throttling pour limiter l'exécution d'une fonction
 * @param func - Fonction à throttler
 * @param wait - Délai d'attente en millisecondes
 * @param options - Options de throttling
 * @returns Fonction throttlée
 * @example
 * ```typescript
 * const throttledScroll = throttle(() => {
 *   console.log('Scroll throttlé');
 * }, 100);
 * 
 * window.addEventListener('scroll', throttledScroll);
 * ```
 */
export function throttle<T extends (...args: never[]) => unknown>(
    func: T,
    wait: number,
    options: ThrottleOptions = {}
): T {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let previous = 0;
    const { leading = false, trailing = true } = options;

    return ((...args: Parameters<T>) => {
        const now = Date.now();

        if (!previous && !leading) previous = now;

        const remaining = wait - (now - previous);

        if (remaining <= 0 || remaining > wait) {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            previous = now;
            func(...args);
        } else if (!timeout && trailing) {
            timeout = setTimeout(() => {
                previous = !leading ? 0 : Date.now();
                timeout = null;
                func(...args);
            }, remaining);
        }
    }) as T;
}

/**
 * Fonction de debouncing pour retarder l'exécution d'une fonction
 * @param func - Fonction à debouncer
 * @param wait - Délai d'attente en millisecondes
 * @param immediate - Exécuter immédiatement au premier appel
 * @returns Fonction debouncée
 * @example
 * ```typescript
 * const debouncedSearch = debounce((query: string) => {
 *   console.log('Recherche:', query);
 * }, 300);
 * 
 * input.addEventListener('input', (e) => {
 *   debouncedSearch(e.target.value);
 * });
 * ```
 */
export function debounce<T extends (...args: never[]) => unknown>(
    func: T,
    wait: number,
    immediate: boolean = false
): T {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    return ((...args: Parameters<T>) => {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };

        const callNow = immediate && !timeout;

        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(later, wait);

        if (callNow) func(...args);
    }) as T;
}

/**
 * Fonction de raf (requestAnimationFrame) avec fallback
 * @param callback - Fonction à exécuter
 * @returns ID de l'animation
 * @example
 * ```typescript
 * raf(() => {
 *   console.log('Animation frame');
 * });
 * ```
 */
export function raf(callback: FrameRequestCallback): number {
    return window.requestAnimationFrame ?
        window.requestAnimationFrame(callback) :
        window.setTimeout(callback, 16);
}

/**
 * Fonction de cancelRaf avec fallback
 * @param id - ID de l'animation à annuler
 * @example
 * ```typescript
 * const id = raf(callback);
 * cancelRaf(id);
 * ```
 */
export function cancelRaf(id: number): void {
    window.cancelAnimationFrame ?
        window.cancelAnimationFrame(id) :
        window.clearTimeout(id);
}

