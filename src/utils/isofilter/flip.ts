/**
 * @fileoverview Helper FLIP pour IsoFilter.
 *
 * Principe FLIP :
 * - on capture la position "first" (avant changement)
 * - on capture la position "last" (après changement, relayout Mason effectué)
 * - pour chaque élément, on calcule un delta (first - last) et on applique un transform temporaire
 *   pour le ramener au point "first", puis on remet le transform final pour déclencher l'animation.
 *
 * Comme `Mason` positionne ses items via `style.transform = translate3d(x, y, 0)`,
 * ce helper ajoute simplement une 2e translation à la transform courante (sans la remplacer),
 * puis la supprime au frame suivant.
 */

export interface RectLike {
    left: number;
    top: number;
    width: number;
    height: number;
}

export type RectMap = Map<HTMLElement, RectLike>;

export type FlipVisibility = 'enter' | 'exit' | 'stay';

export interface FlipAnimationParams {
    /**
     * Items à animer (doit correspondre à la map `first` + `last`).
     */
    elements: HTMLElement[];
    /**
     * Rects avant changement.
     */
    first: RectMap;
    /**
     * Rects après changement.
     */
    last: RectMap;
    /**
     * Durée de transition en ms.
     */
    durationMs: number;
    /**
     * Durée de transition d'opacité en ms.
     * (utile pour l'entrance/exit ; par défaut = durationMs)
     */
    opacityDurationMs?: number;
    /**
     * Définition de la visibilité pour piloter l'opacité.
     */
    visibilityByElement?: Map<HTMLElement, FlipVisibility>;
    /**
     * Easing CSS (appliqué à transform/opacity)
     */
    easing?: string;
}

/**
 * Capture les positions via `getBoundingClientRect()`.
 */
export function captureRects(elements: HTMLElement[]): RectMap {
    const map: RectMap = new Map();
    for (const el of elements) {
        const r = el.getBoundingClientRect();
        map.set(el, {
            left: r.left,
            top: r.top,
            width: r.width,
            height: r.height,
        });
    }
    return map;
}

/**
 * Lance l'animation FLIP + opacité pour IsoFilter.
 */
export function runFlipAnimation(params: FlipAnimationParams): void {
    const {
        elements,
        first,
        last,
        durationMs,
        opacityDurationMs,
        visibilityByElement,
        easing = 'ease',
    } = params;

    const opacityDur = opacityDurationMs ?? durationMs;

    // Snapshot du style de transition (optionnel : on ne restaure pas ici pour éviter de surcharger des styles existants).
    // Le composant IsoFilter pourra décider d'enlever les classes/ciblage plus tard.

    for (const el of elements) {
        const firstRect = first.get(el);
        const lastRect = last.get(el);
        if (!firstRect || !lastRect) continue;

        const dx = firstRect.left - lastRect.left;
        const dy = firstRect.top - lastRect.top;

        const baseTransform = el.style.transform || '';
        const spacer = baseTransform.trim().length > 0 ? ' ' : '';

        const visibility: FlipVisibility = visibilityByElement?.get(el) ?? 'stay';

        if (visibility === 'enter') {
            // Commencer invisible, puis on animera vers l'opacité 1.
            el.style.opacity = '0';
        } else if (visibility === 'exit') {
            // Sortie : partir visible, puis vers 0.
            el.style.opacity = el.style.opacity && el.style.opacity !== '0' ? el.style.opacity : '1';
        }

        // Forcer la transition sur transform/opacity pour obtenir un vrai FLIP visuel.
        el.style.transition = `transform ${durationMs}ms ${easing}, opacity ${opacityDur}ms ${easing}`;

        // Ramener à l'ancienne position via un translate additionnel.
        if (dx !== 0 || dy !== 0) {
            el.style.transform = `${baseTransform}${spacer}translate3d(${dx}px, ${dy}px, 0)`;
        }

        // Prochaine frame : remettre la transform Mason courante (sans delta) pour animer vers "last".
        requestAnimationFrame(() => {
            // Important : on remet exactement la transform courante Mason (avant delta).
            el.style.transform = baseTransform;

            if (visibility === 'enter') {
                el.style.opacity = '1';
            } else if (visibility === 'exit') {
                el.style.opacity = '0';
            }
        });
    }
}

