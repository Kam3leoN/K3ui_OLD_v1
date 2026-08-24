/**
 * @fileoverview Utilitaires spécifiques au canvas
 * @description Fonctions pour la configuration et la manipulation de canvas HTML5
 * @author K3UI Team
 * @version 1.0.0
 */

/**
 * Configuration du canvas pour le rendu haute résolution (retina)
 * Configure le canvas pour prendre en charge le devicePixelRatio
 * @param canvas - Élément canvas HTML
 * @returns Objet contenant le contexte 2D et les dimensions réelles
 * @throws Error si le contexte 2D ne peut pas être obtenu
 * @example
 * ```typescript
 * const { ctx, width, height } = setupHighDPRCanvas(canvasElement);
 * ```
 */
export function setupHighDPRCanvas(canvas: HTMLCanvasElement): {
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
} {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    // Utiliser la hauteur du style inline si disponible, sinon utiliser getBoundingClientRect
    const styleHeight = canvas.style.height;
    let height = rect.height;

    if (styleHeight && styleHeight !== 'auto' && styleHeight !== '100%') {
        // Extraire la valeur numérique de la hauteur (ex: "300px" -> 300)
        const heightMatch = styleHeight.match(/(\d+(?:\.\d+)?)/);
        if (heightMatch) {
            height = parseFloat(heightMatch[1]);
        }
    }

    // Définir les dimensions réelles du canvas (avec DPR)
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;

    // Obtenir le contexte 2D
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Could not get 2D context');
    }

    // Mettre à l'échelle le contexte pour correspondre au DPR
    ctx.scale(dpr, dpr);

    // Définir les dimensions d'affichage CSS
    canvas.style.width = rect.width + 'px';
    canvas.style.height = height + 'px';

    return {
        ctx,
        width: rect.width,
        height: height,
    };
}

/**
 * Obtient le contexte 2D d'un canvas avec vérifications
 * @param canvas - Élément canvas HTML
 * @returns Contexte 2D du canvas
 * @throws Error si le contexte 2D ne peut pas être obtenu
 * @example
 * ```typescript
 * const ctx = getCanvasContext(canvasElement);
 * ```
 */
export function getCanvasContext(
    canvas: HTMLCanvasElement
): CanvasRenderingContext2D {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Could not get 2D context from canvas');
    }
    return ctx;
}

/**
 * Efface tout le contenu du canvas
 * @param ctx - Contexte 2D du canvas
 * @param width - Largeur du canvas (en pixels CSS, pas en pixels réels)
 * @param height - Hauteur du canvas (en pixels CSS, pas en pixels réels)
 * @example
 * ```typescript
 * clearCanvas(ctx, 800, 600);
 * ```
 */
export function clearCanvas(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
): void {
    ctx.clearRect(0, 0, width, height);
}

/**
 * Obtient les dimensions actuelles d'un canvas
 * @param canvas - Élément canvas HTML
 * @returns Objet contenant la largeur et la hauteur (en pixels CSS)
 * @example
 * ```typescript
 * const { width, height } = getCanvasDimensions(canvasElement);
 * ```
 */
export function getCanvasDimensions(canvas: HTMLCanvasElement): {
    width: number;
    height: number;
} {
    const rect = canvas.getBoundingClientRect();
    const styleHeight = canvas.style.height;
    let height = rect.height;

    if (styleHeight && styleHeight !== 'auto' && styleHeight !== '100%') {
        const heightMatch = styleHeight.match(/(\d+(?:\.\d+)?)/);
        if (heightMatch) {
            height = parseFloat(heightMatch[1]);
        }
    }

    return {
        width: rect.width,
        height: height,
    };
}

/**
 * Obtient le ratio de pixels actuel du périphérique avec arrondi de précision
 * 
 * Le device pixel ratio représente le nombre de pixels physiques utilisés
 * pour dessiner un pixel CSS. C'est important pour les écrans haute résolution.
 * 
 * @returns Le device pixel ratio actuel, arrondi à 2 décimales
 * @example
 * ```typescript
 * const ratio = getCurrentPixelRatio(); // Retourne 1, 1.5, 2, etc.
 * ```
 */
export function getCurrentPixelRatio(): number {
    return Math.round((window.devicePixelRatio || 1) * 100) / 100;
}

/**
 * Mesure les dimensions d'un texte en utilisant un contexte canvas 2D
 * 
 * Cette fonction crée un canvas temporaire pour mesurer les dimensions
 * du texte avec précision, ce qui est essentiel pour le positionnement
 * et la mise en page corrects du texte.
 * 
 * @param text - La chaîne de texte à mesurer
 * @param font - Chaîne CSS de police pour le texte
 * @returns Objet contenant la largeur et la hauteur du texte en pixels
 * @example
 * ```typescript
 * const { width, height } = measureText('Hello World', 'bold 5rem "Google Sans Flex"');
 * console.log(`Taille du texte: ${width}x${height}px`);
 * ```
 */
export function measureText(text: string, font: string): { width: number; height: number } {
    // Créer un canvas temporaire pour la mesure
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Retourner des dimensions nulles si le contexte canvas n'est pas disponible
    if (!ctx) {
        return { width: 0, height: 0 };
    }

    // Définir la police et mesurer le texte
    ctx.font = font;
    const metrics = ctx.measureText(text);

    // Calculer les dimensions incluant l'ascent et la descente
    return {
        width: Math.ceil(metrics.width),
        height: Math.ceil(metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent)
    };
}

