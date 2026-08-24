/**
 * @fileoverview Module de gestion RTL/LTR pour K3UI
 * @description Fonctions utilitaires pour la gestion de la direction de texte (RTL/LTR)
 * @author K3UI Team
 * @version 1.0.0
 * @license Apache-2.0
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Direction de texte supportée
 */
export type TextDirection = 'ltr' | 'rtl';

/**
 * Propriétés CSS logiques communes
 */
export const LOGICAL_PROPERTIES = {
    margin: {
        start: 'margin-inline-start',
        end: 'margin-inline-end',
        blockStart: 'margin-block-start',
        blockEnd: 'margin-block-end'
    },
    padding: {
        start: 'padding-inline-start',
        end: 'padding-inline-end',
        blockStart: 'padding-block-start',
        blockEnd: 'padding-block-end'
    },
    border: {
        start: 'border-inline-start',
        end: 'border-inline-end',
        blockStart: 'border-block-start',
        blockEnd: 'border-block-end',
        startWidth: 'border-inline-start-width',
        endWidth: 'border-inline-end-width',
        startColor: 'border-inline-start-color',
        endColor: 'border-inline-end-color'
    },
    inset: {
        start: 'inset-inline-start',
        end: 'inset-inline-end',
        blockStart: 'inset-block-start',
        blockEnd: 'inset-block-end'
    }
} as const;

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Récupère l'élément racine (document.documentElement) ou l'élément spécifié
 * @param element - Élément à vérifier, ou document, ou null/undefined
 * @returns L'élément racine ou l'élément spécifié
 */
function getRootElement(element?: HTMLElement | Document | null): HTMLElement {
    if (!element) {
        return document.documentElement;
    }
    if (element instanceof Document) {
        return element.documentElement;
    }
    return element;
}

/**
 * Récupère la direction d'un élément en remontant la hiérarchie DOM
 * @param element - Élément à vérifier (optionnel, vérifie le document par défaut)
 * @returns La direction trouvée ou 'ltr' par défaut
 */
function getElementDirection(element?: HTMLElement | Document | null): TextDirection {
    const root = getRootElement(element);

    // Vérifier directement sur l'élément
    if (root instanceof HTMLElement) {
        const dir = root.getAttribute('dir') || root.style.direction;
        if (dir === 'rtl' || dir === 'ltr') {
            return dir;
        }
    }

    // Vérifier sur le parent si pas trouvé
    if (root instanceof HTMLElement && root.parentElement) {
        const parentDir = root.parentElement.getAttribute('dir') ||
            root.parentElement.style.direction;
        if (parentDir === 'rtl' || parentDir === 'ltr') {
            return parentDir as TextDirection;
        }
    }

    // Vérifier sur le document
    const docDir = document.documentElement.getAttribute('dir') ||
        document.documentElement.style.direction;
    if (docDir === 'rtl' || docDir === 'ltr') {
        return docDir as TextDirection;
    }

    // Vérifier la valeur calculée CSS
    const computed = window.getComputedStyle(root);
    const direction = computed.direction;
    if (direction === 'rtl') {
        return 'rtl';
    }

    // Par défaut, retourner 'ltr'
    return 'ltr';
}

/**
 * Détecte si un élément ou le document est en mode RTL
 * @param element - Élément à vérifier (optionnel, vérifie le document par défaut)
 * @returns true si RTL, false sinon
 * @example
 * ```typescript
 * if (isRTL()) {
 *   // Le document est en RTL
 * }
 * if (isRTL(myElement)) {
 *   // myElement est en RTL
 * }
 * ```
 */
export function isRTL(element?: HTMLElement | Document | null): boolean {
    return getElementDirection(element) === 'rtl';
}

/**
 * Détecte si un élément ou le document est en mode LTR
 * @param element - Élément à vérifier (optionnel, vérifie le document par défaut)
 * @returns true si LTR, false sinon
 */
export function isLTR(element?: HTMLElement | Document | null): boolean {
    return getElementDirection(element) === 'ltr';
}

/**
 * Récupère la direction (ltr/rtl) d'un élément ou du document
 * @param element - Élément à vérifier (optionnel, vérifie le document par défaut)
 * @returns 'ltr' ou 'rtl'
 * @example
 * ```typescript
 * const dir = getDirection(); // 'ltr' ou 'rtl'
 * const elDir = getDirection(myElement); // Direction de myElement
 * ```
 */
export function getDirection(element?: HTMLElement | Document | null): TextDirection {
    return getElementDirection(element);
}

/**
 * Définit la direction d'un élément
 * @param element - Élément sur lequel définir la direction
 * @param direction - Direction à définir ('ltr' ou 'rtl')
 * @example
 * ```typescript
 * setDirection(myElement, 'rtl');
 * ```
 */
export function setDirection(element: HTMLElement, direction: TextDirection): void {
    element.setAttribute('dir', direction);
    element.style.direction = direction;
}

/**
 * Inverse left/right dans une chaîne CSS (pour les valeurs physiques)
 * Utile pour inverser des valeurs comme "left: 10px" en "right: 10px" en RTL
 * @param value - Chaîne à inverser
 * @returns Chaîne avec left/right inversés
 * @example
 * ```typescript
 * flipDirection('left: 10px'); // 'right: 10px'
 * flipDirection('margin-left: 20px'); // 'margin-right: 20px'
 * ```
 */
export function flipDirection(value: string): string {
    return value
        .replace(/\bleft\b/g, '$$TEMP$$')
        .replace(/\bright\b/g, 'left')
        .replace(/\$\$TEMP\$\$/g, 'right');
}

/**
 * Convertit une propriété physique (left/right) en logique (start/end)
 * @param property - Propriété physique (ex: 'left', 'right', 'margin-left')
 * @param isRTLMode - Si true, considère que le contexte est RTL
 * @returns Propriété logique correspondante
 * @example
 * ```typescript
 * getLogicalProperty('left', false); // 'start'
 * getLogicalProperty('right', true); // 'start'
 * getLogicalProperty('margin-left', false); // 'margin-start'
 * ```
 */
export function getLogicalProperty(property: string, isRTLMode?: boolean): string {
    const rtl = isRTLMode ?? isRTL();

    // Propriétés avec tiret (ex: margin-left)
    if (property.includes('-')) {
        const parts = property.split('-');
        const lastPart = parts[parts.length - 1];

        if (lastPart === 'left') {
            parts[parts.length - 1] = rtl ? 'end' : 'start';
            return parts.join('-');
        } else if (lastPart === 'right') {
            parts[parts.length - 1] = rtl ? 'start' : 'end';
            return parts.join('-');
        }
    }

    // Propriétés simples
    if (property === 'left') {
        return rtl ? 'end' : 'start';
    } else if (property === 'right') {
        return rtl ? 'start' : 'end';
    }

    return property;
}

/**
 * Convertit start/end en left/right selon la direction
 * @param property - Propriété logique ('start' ou 'end')
 * @param isRTLMode - Si true, considère que le contexte est RTL
 * @returns 'left' ou 'right'
 * @example
 * ```typescript
 * getPhysicalProperty('start', false); // 'left'
 * getPhysicalProperty('end', true); // 'left'
 * ```
 */
export function getPhysicalProperty(
    property: 'start' | 'end',
    isRTLMode?: boolean
): 'left' | 'right' {
    const rtl = isRTLMode ?? isRTL();

    if (property === 'start') {
        return rtl ? 'right' : 'left';
    } else {
        return rtl ? 'left' : 'right';
    }
}

/**
 * Récupère la propriété CSS logique équivalente
 * @param baseProperty - Propriété de base (ex: 'margin', 'padding', 'border')
 * @param side - Côté ('start', 'end', 'blockStart', 'blockEnd')
 * @param isRTLMode - Si true, considère que le contexte est RTL
 * @returns Propriété CSS logique complète
 * @example
 * ```typescript
 * getLogicalCSSProperty('margin', 'start'); // 'margin-inline-start'
 * getLogicalCSSProperty('padding', 'end'); // 'padding-inline-end'
 * ```
 */
export function getLogicalCSSProperty(
    baseProperty: 'margin' | 'padding' | 'border',
    side: 'start' | 'end' | 'blockStart' | 'blockEnd',
    isRTLMode?: boolean
): string {
    const props = LOGICAL_PROPERTIES[baseProperty];
    if (side === 'start') {
        return props.start;
    } else if (side === 'end') {
        return props.end;
    } else if (side === 'blockStart') {
        return props.blockStart;
    } else {
        return props.blockEnd;
    }
}

/**
 * Inverse les coordonnées X si RTL (pour le positionnement)
 * @param value - Valeur X à inverser
 * @param containerWidth - Largeur du conteneur
 * @param isRTLMode - Si true, considère que le contexte est RTL
 * @returns Valeur X inversée si RTL, valeur originale sinon
 * @example
 * ```typescript
 * // En RTL, left: 10px devient right: 10px
 * const x = flipX(10, 100, true); // 90 (100 - 10)
 * ```
 */
export function flipX(value: number, containerWidth: number, isRTLMode?: boolean): number {
    const rtl = isRTLMode ?? isRTL();
    if (!rtl) {
        return value;
    }
    return containerWidth - value;
}

/**
 * Applique une propriété CSS logique à un élément
 * @param element - Élément sur lequel appliquer la propriété
 * @param property - Propriété logique (ex: 'margin-inline-start')
 * @param value - Valeur à appliquer
 * @example
 * ```typescript
 * setLogicalProperty(myElement, 'margin-inline-start', '16px');
 * ```
 */
export function setLogicalProperty(
    element: HTMLElement,
    property: string,
    value: string
): void {
    element.style.setProperty(property, value);
}

/**
 * Récupère une propriété CSS logique d'un élément
 * @param element - Élément depuis lequel récupérer la propriété
 * @param property - Propriété logique (ex: 'margin-inline-start')
 * @returns Valeur de la propriété ou chaîne vide
 */
export function getLogicalPropertyValue(
    element: HTMLElement,
    property: string
): string {
    return window.getComputedStyle(element).getPropertyValue(property) || '';
}

/**
 * Classe utilitaire pour gérer RTL/LTR avec cache et observateurs
 */
export class RTLManager {
    private static directionCache: Map<HTMLElement, TextDirection> = new Map();
    private static observers: Map<HTMLElement, MutationObserver> = new Map();

    /**
     * Récupère la direction avec cache
     */
    static getDirection(element?: HTMLElement | Document | null): TextDirection {
        const root = getRootElement(element);

        if (this.directionCache.has(root)) {
            return this.directionCache.get(root)!;
        }

        const direction = getElementDirection(root);
        this.directionCache.set(root, direction);
        return direction;
    }

    /**
     * Observe les changements de direction sur un élément
     */
    static observe(
        element: HTMLElement,
        callback: (direction: TextDirection) => void
    ): () => void {
        // Nettoyer l'observer existant si présent
        this.unobserve(element);

        // Créer un nouvel observer
        const observer = new MutationObserver(() => {
            const direction = getElementDirection(element);
            this.directionCache.set(element, direction);
            callback(direction);
        });

        observer.observe(element, {
            attributes: true,
            attributeFilter: ['dir'],
            subtree: false
        });

        this.observers.set(element, observer);

        // Retourner une fonction de nettoyage
        return () => {
            this.unobserve(element);
        };
    }

    /**
     * Arrête d'observer un élément
     */
    static unobserve(element: HTMLElement): void {
        const observer = this.observers.get(element);
        if (observer) {
            observer.disconnect();
            this.observers.delete(element);
            this.directionCache.delete(element);
        }
    }

    /**
     * Nettoie tous les observers et le cache
     */
    static cleanup(): void {
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
        this.directionCache.clear();
    }
}

