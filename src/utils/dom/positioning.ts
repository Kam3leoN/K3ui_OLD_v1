/**
 * @fileoverview Module de positionnement pour K3UI
 * @description Gestion du positionnement et de l'alignement des éléments (menus, etc.)
 * avec support RTL, détection de débordement et repositionnement automatique
 * @module utils/dom/positioning
 */

import { Bounding, Edges, Position } from '../../types/base/dom';
import { isRTL } from './rtl';

// ============================================================================
// CONSTANTES
// ============================================================================

/** Seuil minimum de largeur pour considérer qu'un menu est dimensionné */
const MIN_MENU_WIDTH = 10;

/** Seuil de différence de largeur pour recalculer la position */
const WIDTH_DIFFERENCE_THRESHOLD = 1;

/** Z-index pour les menus normaux */
const MENU_Z_INDEX = '1100';

/** Z-index pour les menus dans la navbar */
const NAVBAR_MENU_Z_INDEX = '1200';

// (Anciennes APIs AppBarRepositionManager et callbacks supprimées – utiliser utils/floating à la place, plus d’intégration AppBar ici)

// ============================================================================
// CLASSE POSITIONING
// ============================================================================

/**
 * Classe de gestion du positionnement et de l'alignement
 * @description Gère le positionnement des éléments UI (menus) avec détection de débordement,
 * support RTL, repositionnement automatique et gestion des conteneurs avec overflow
 * @class Positioning
 */
export class Positioning {
    /**
     * Vérifie si un élément dépasse les bords de son conteneur
     * @param {HTMLElement} container - Élément conteneur
     * @param {Bounding} bounding - Dimensions de l'élément (left, top, width, height)
     * @param {number} offset - Décalage en pixels pour la marge de sécurité
     * @returns {Edges} Objet indiquant quels bords ont été dépassés (top, right, bottom, left)
     * @static
     */
    static checkWithinContainer(
        container: HTMLElement,
        bounding: Bounding,
        offset: number
    ): Edges {
        const containerRect = container.getBoundingClientRect();

        // Si body est plus petit que le viewport, utiliser la hauteur du viewport
        const containerBottom =
            container === document.body
                ? Math.max(containerRect.bottom, window.innerHeight)
                : containerRect.bottom;

        const scrollLeft = container.scrollLeft;
        const scrollTop = container.scrollTop;

        const scrolledX = bounding.left - scrollLeft;
        const scrolledY = bounding.top - scrollTop;

        // Vérifier chaque bord pour le conteneur et le viewport
        const left = scrolledX < containerRect.left + offset || scrolledX < offset;
        const right =
            scrolledX + bounding.width > containerRect.right - offset ||
            scrolledX + bounding.width > window.innerWidth - offset;
        const top = scrolledY < containerRect.top + offset || scrolledY < offset;
        const bottom =
            scrolledY + bounding.height > containerBottom - offset ||
            scrolledY + bounding.height > window.innerHeight - offset;

        return {
            top,
            right,
            bottom,
            left
        };
    }

    /**
     * Vérifie les alignements possibles pour un élément
     * @description Détermine quels alignements (top, right, bottom, left) sont possibles
     * et calcule l'espace disponible pour chaque direction
     * @param {HTMLElement} element - Élément à positionner
     * @param {HTMLElement} container - Élément conteneur
     * @param {Bounding} bounding - Dimensions de l'élément à positionner
     * @param {number} offset - Décalage en pixels pour la marge de sécurité
     * @returns {Object} Objet avec les alignements possibles (top, right, bottom, left) et les espaces disponibles (spaceOnTop, spaceOnRight, spaceOnBottom, spaceOnLeft)
     * @static
     */
    static checkPossibleAlignments(
        element: HTMLElement,
        container: HTMLElement,
        bounding: Bounding,
        offset: number
    ): {
        top: boolean;
        right: boolean;
        bottom: boolean;
        left: boolean;
        spaceOnTop: number;
        spaceOnRight: number;
        spaceOnBottom: number;
        spaceOnLeft: number;
    } {
        // Validation des paramètres
        if (!element || !container) {
            console.warn('[Positioning] checkPossibleAlignments: Éléments invalides', { element, container });
            return {
                top: false,
                right: false,
                bottom: false,
                left: false,
                spaceOnTop: 0,
                spaceOnRight: 0,
                spaceOnBottom: 0,
                spaceOnLeft: 0
            };
        }

        const canAlign: {
            top: boolean;
            right: boolean;
            bottom: boolean;
            left: boolean;
            spaceOnTop: number;
            spaceOnRight: number;
            spaceOnBottom: number;
            spaceOnLeft: number;
        } = {
            top: true,
            right: true,
            bottom: true,
            left: true,
            spaceOnTop: 0,
            spaceOnRight: 0,
            spaceOnBottom: 0,
            spaceOnLeft: 0
        };

        const containerAllowsOverflow = getComputedStyle(container).overflow === 'visible';
        const containerRect = container.getBoundingClientRect();
        const containerHeight = Math.min(containerRect.height, window.innerHeight);
        const containerWidth = Math.min(containerRect.width, window.innerWidth);
        const elementRect = element.getBoundingClientRect();

        const scrollLeft = container.scrollLeft;
        const scrollTop = container.scrollTop;

        const scrolledX = bounding.left - scrollLeft;
        const scrolledYTopEdge = bounding.top - scrollTop;
        const scrolledYBottomEdge = bounding.top + elementRect.height - scrollTop;

        // Vérifier pour le conteneur et le viewport à gauche
        canAlign.spaceOnRight = !containerAllowsOverflow
            ? containerWidth - (scrolledX + bounding.width)
            : window.innerWidth - (elementRect.left + bounding.width);
        if (canAlign.spaceOnRight < 0) {
            canAlign.left = false;
        }

        // Vérifier pour le conteneur et le viewport à droite
        canAlign.spaceOnLeft = !containerAllowsOverflow
            ? scrolledX - bounding.width + elementRect.width
            : elementRect.right - bounding.width;
        if (canAlign.spaceOnLeft < 0) {
            canAlign.right = false;
        }

        // Vérifier pour le conteneur et le viewport en haut
        canAlign.spaceOnBottom = !containerAllowsOverflow
            ? containerHeight - (scrolledYTopEdge + bounding.height + offset)
            : window.innerHeight - (elementRect.top + bounding.height + offset);
        if (canAlign.spaceOnBottom < 0) {
            canAlign.top = false;
        }

        // Vérifier pour le conteneur et le viewport en bas
        canAlign.spaceOnTop = !containerAllowsOverflow
            ? scrolledYBottomEdge - (bounding.height - offset)
            : elementRect.bottom - (bounding.height + offset);
        if (canAlign.spaceOnTop < 0) {
            canAlign.bottom = false;
        }

        return canAlign;
    }

    /**
     * Trouve la position optimale pour un élément en évitant les débordements
     * @description Calcule la position optimale en testant la position préférée puis les alternatives
     * sur le même axe, et repositionne dans l'écran si nécessaire
     * @deprecated Utiliser computePosition et autoUpdate depuis utils/floating. Cette fonction sera supprimée dans une future version.
     * @param {HTMLElement} origin - Élément d'origine (trigger)
     * @param {HTMLElement} container - Élément à positionner (menu, etc.)
     * @param {('top'|'right'|'bottom'|'left')} preferredPosition - Position préférée
     * @param {number} initialX - Position X initiale
     * @param {number} initialY - Position Y initiale
     * @param {number} margin - Marge en pixels entre l'origine et l'élément
     * @param {number} transitionMovement - Mouvement de transition (non utilisé actuellement)
     * @param {('left'|'center'|'right')} align - Alignement horizontal (left, center, right)
     * @returns {Position} Position optimale (x, y)
     * @static
     */
    static getOptimalPosition(
        origin: HTMLElement,
        container: HTMLElement,
        preferredPosition: 'top' | 'right' | 'bottom' | 'left',
        initialX: number,
        initialY: number,
        margin: number,
        transitionMovement: number,
        align: 'left' | 'center' | 'right'
    ): Position {
        const originHeight = origin.offsetHeight;
        const originWidth = origin.offsetWidth;
        const containerHeight = container.offsetHeight;
        const containerWidth = container.offsetWidth;
        const originRect = origin.getBoundingClientRect();
        const scrollTop = Positioning.getDocumentScrollTop();
        const scrollLeft = Positioning.getDocumentScrollLeft();

        // Définir les positions alternatives sur le même axe
        const axisPositions = this.getAxisPositions(preferredPosition);

        // Calculer la position pour l'orientation préférée
        const preferredPos = this.calculatePositionForAlignment(
            originRect,
            scrollTop,
            scrollLeft,
            preferredPosition,
            containerWidth,
            containerHeight,
            margin,
            align
        );

        // Vérifier si la position préférée fonctionne
        const bounding = {
            left: preferredPos.x,
            top: preferredPos.y,
            width: containerWidth,
            height: containerHeight
        };

        const edges = this.checkWithinContainer(document.body, bounding, margin);

        if (!edges.top && !edges.right && !edges.bottom && !edges.left) {
            return preferredPos;
        }

        // Essayer les positions alternatives
        for (const position of axisPositions) {
            const testPosition = this.calculatePositionForAlignment(
                originRect,
                scrollTop,
                scrollLeft,
                position,
                containerWidth,
                containerHeight,
                margin,
                align
            );

            const testBounding = {
                left: testPosition.x,
                top: testPosition.y,
                width: containerWidth,
                height: containerHeight
            };

            const testEdges = this.checkWithinContainer(document.body, testBounding, margin);

            if (!testEdges.top && !testEdges.right && !testEdges.bottom && !testEdges.left) {
                return testPosition;
            }
        }

        // Si aucune position idéale n'est trouvée, repositionner dans l'écran
        return this.repositionWithinBounds(
            { x: preferredPos.x, y: preferredPos.y },
            containerWidth,
            containerHeight,
            margin,
            false
        );
    }

    /**
     * Calcule la position pour un alignement spécifique
     * @description Calcule les coordonnées x et y pour une position donnée (top, right, bottom, left)
     * avec un alignement horizontal (left, center, right)
     * @private
     * @param {DOMRect} originRect - Rectangle de l'élément d'origine
     * @param {number} scrollTop - Position de scroll verticale du document
     * @param {number} scrollLeft - Position de scroll horizontale du document
     * @param {('top'|'right'|'bottom'|'left')} position - Position souhaitée
     * @param {number} containerWidth - Largeur du conteneur à positionner
     * @param {number} containerHeight - Hauteur du conteneur à positionner
     * @param {number} margin - Marge en pixels
     * @param {('left'|'center'|'right')} align - Alignement horizontal
     * @returns {Position} Position calculée (x, y)
     * @static
     */
    private static calculatePositionForAlignment(
        originRect: DOMRect,
        scrollTop: number,
        scrollLeft: number,
        position: 'top' | 'right' | 'bottom' | 'left',
        containerWidth: number,
        containerHeight: number,
        margin: number,
        align: 'left' | 'center' | 'right'
    ): Position {
        let x = 0;
        let y = 0;

        switch (position) {
            case 'top':
                y = originRect.top + scrollTop - containerHeight - margin;
                x = this._calculateHorizontalAlign(originRect, scrollLeft, containerWidth, align);
                break;
            case 'right':
                x = originRect.left + scrollLeft + originRect.width + margin;
                y = this._calculateVerticalAlign(originRect, scrollTop, containerHeight, align);
                break;
            case 'bottom':
                y = originRect.top + scrollTop + originRect.height + margin;
                x = this._calculateHorizontalAlign(originRect, scrollLeft, containerWidth, align);
                break;
            case 'left':
                x = originRect.left + scrollLeft - containerWidth - margin;
                y = this._calculateVerticalAlign(originRect, scrollTop, containerHeight, align);
                break;
        }

        return { x, y };
    }

    /**
     * Calcule l'alignement horizontal (left, center, right)
     * @private
     * @param {DOMRect} originRect - Rectangle de l'élément d'origine
     * @param {number} scrollLeft - Position de scroll horizontale
     * @param {number} containerWidth - Largeur du conteneur
     * @param {('left'|'center'|'right')} align - Alignement
     * @returns {number} Position X calculée
     * @static
     */
    private static _calculateHorizontalAlign(
        originRect: DOMRect,
        scrollLeft: number,
        containerWidth: number,
        align: 'left' | 'center' | 'right'
    ): number {
        if (align === 'center') {
            return originRect.left + scrollLeft + originRect.width / 2 - containerWidth / 2;
        } else if (align === 'right') {
            return originRect.left + scrollLeft + originRect.width - containerWidth;
        } else {
            return originRect.left + scrollLeft;
        }
    }

    /**
     * Calcule l'alignement vertical (top, center, bottom)
     * @private
     * @param {DOMRect} originRect - Rectangle de l'élément d'origine
     * @param {number} scrollTop - Position de scroll verticale
     * @param {number} containerHeight - Hauteur du conteneur
     * @param {('left'|'center'|'right')} align - Alignement (utilisé comme vertical pour left/right positions)
     * @returns {number} Position Y calculée
     * @static
     */
    private static _calculateVerticalAlign(
        originRect: DOMRect,
        scrollTop: number,
        containerHeight: number,
        align: 'left' | 'center' | 'right'
    ): number {
        if (align === 'center') {
            return originRect.top + scrollTop + originRect.height / 2 - containerHeight / 2;
        } else if (align === 'right') {
            return originRect.top + scrollTop + originRect.height - containerHeight;
        } else {
            return originRect.top + scrollTop;
        }
    }

    /**
     * Obtient les positions alternatives sur le même axe
     * @description Retourne un tableau des positions alternatives à tester si la position préférée ne fonctionne pas
     * @private
     * @param {('top'|'right'|'bottom'|'left')} preferredPosition - Position préférée
     * @returns {Array<('top'|'right'|'bottom'|'left')>} Tableau des positions alternatives à tester
     * @static
     */
    private static getAxisPositions(preferredPosition: 'top' | 'right' | 'bottom' | 'left'): ('top' | 'right' | 'bottom' | 'left')[] {
        switch (preferredPosition) {
            case 'top':
                return ['bottom', 'left', 'right'];
            case 'right':
                return ['left', 'top', 'bottom'];
            case 'bottom':
                return ['top', 'left', 'right'];
            case 'left':
                return ['right', 'top', 'bottom'];
            default:
                return ['top', 'right', 'bottom', 'left'];
        }
    }

    /**
     * Repositionne un élément dans les limites (viewport ou document)
     * @description Ajuste la position pour éviter les débordements en respectant les marges
     * Amélioré avec la logique de MaterializeWeb pour une meilleure gestion des débordements
     * @deprecated Utiliser le middleware shift() de utils/floating à la place. Cette fonction est conservée pour compatibilité mais sera supprimée dans une future version.
     * @private
     * @param {Position} position - Position initiale (x, y)
     * @param {number} width - Largeur de l'élément
     * @param {number} height - Hauteur de l'élément
     * @param {number} margin - Marge minimale en pixels
     * @param {boolean} useViewport - Si true, utilise viewport (pour fixed), sinon document (pour absolute)
     * @param {number} [transitionMovement=0] - Mouvement de transition pour ajuster l'offset
     * @param {string} [align='center'] - Alignement pour ajuster l'offset
     * @returns {Position} Position ajustée (x, y)
     * @static
     */
    private static repositionWithinBounds(
        position: Position,
        width: number,
        height: number,
        margin: number,
        useViewport: boolean = false,
        transitionMovement: number = 0,
        align: string = 'center'
    ): Position {
        const scrollLeft = useViewport ? 0 : Positioning.getDocumentScrollLeft();
        const scrollTop = useViewport ? 0 : Positioning.getDocumentScrollTop();

        // Pour position: fixed (useViewport=true), les coordonnées sont déjà relatives au viewport
        // Pour position: absolute (useViewport=false), soustraire le scroll pour obtenir les coordonnées viewport
        let newX = useViewport ? position.x : position.x - scrollLeft;
        let newY = useViewport ? position.y : position.y - scrollTop;

        // Calculer l'offset selon l'alignement (comme dans le code de référence)
        let offset: number;
        if (align === 'left' || align === 'center') {
            offset = margin + transitionMovement;
        } else if (align === 'right') {
            offset = margin - transitionMovement;
        } else {
            offset = margin;
        }


        // Pour position: fixed (useViewport=true), vérifier directement les coordonnées viewport
        // Pour position: absolute (useViewport=false), utiliser checkWithinContainer
        if (useViewport) {
            // Forcer newY à être >= 0 (pas de valeurs négatives)
            if (newY < 0) {
                newY = offset;
            }
            // Forcer newX à être >= 0 (pas de valeurs négatives)
            if (newX < 0) {
                newX = offset;
            }


            // Vérifier les débordements directement par rapport au viewport
            if (newX + width > window.innerWidth - offset) {
                // Débordement à droite
                const oldX = newX;
                newX = window.innerWidth - width - offset;
                // Si le menu est trop large, le positionner à gauche avec marge
                if (newX < offset) {
                    newX = offset;
                }
            }

            if (newY + height > window.innerHeight - offset) {
                // Débordement en bas
                const oldY = newY;
                newY = window.innerHeight - height - offset;
                // Si le menu est trop haut, le positionner en haut avec marge
                if (newY < offset) {
                    newY = offset;
                }
            }
        } else {
            // Pour position: absolute, utiliser checkWithinContainer
            const bounding: Bounding = {
                left: newX,
                top: newY,
                width: width,
                height: height
            };

            const edges = this.checkWithinContainer(document.body, bounding, offset);

            // Ajuster la position selon les débordements détectés
            if (edges.left) {
                newX = offset;
            } else if (edges.right) {
                // Ajuster pour éviter le débordement à droite
                newX = newX - (newX + width - document.documentElement.scrollWidth) + offset;
            }

            if (edges.top) {
                newY = offset;
            } else if (edges.bottom) {
                // Ajuster pour éviter le débordement en bas
                const containerBottom = Math.max(document.documentElement.scrollHeight, window.innerHeight);
                newY = newY - (newY + height - containerBottom) + offset;
            }
        }

        // Pour position: fixed, retourner directement les coordonnées viewport
        // Pour position: absolute, ajouter le scroll pour obtenir les coordonnées document
        return {
            x: useViewport ? newX : newX + scrollLeft,
            y: useViewport ? newY : newY + scrollTop
        };
    }

    /**
     * Repositionne un élément dans l'écran (document) pour position: absolute
     * @description Ajuste la position pour éviter les débordements en respectant les marges
     * @private
     * @param {Position} position - Position initiale (x, y)
     * @param {number} width - Largeur de l'élément
     * @param {number} height - Hauteur de l'élément
     * @param {number} margin - Marge minimale en pixels
     * @param {number} [transitionMovement=0] - Mouvement de transition pour ajuster l'offset
     * @param {string} [align='center'] - Alignement pour ajuster l'offset
     * @returns {Position} Position ajustée (x, y)
     * @static
     */
    private static repositionWithinScreen(
        position: Position,
        width: number,
        height: number,
        margin: number,
        transitionMovement: number = 0,
        align: string = 'center'
    ): Position {
        return this.repositionWithinBounds(position, width, height, margin, false, transitionMovement, align);
    }

    /**
     * Repositionne un élément dans la fenêtre (viewport) pour position: fixed
     * @description Ajuste la position pour éviter les débordements du viewport en respectant les marges
     * @private
     * @param {Position} position - Position initiale (x, y) en coordonnées viewport
     * @param {number} width - Largeur de l'élément
     * @param {number} height - Hauteur de l'élément
     * @param {number} margin - Marge minimale en pixels
     * @param {number} [transitionMovement=0] - Mouvement de transition pour ajuster l'offset
     * @param {string} [align='center'] - Alignement pour ajuster l'offset
     * @returns {Position} Position ajustée (x, y)
     * @static
     */
    private static repositionWithinViewport(
        position: Position,
        width: number,
        height: number,
        margin: number,
        transitionMovement: number = 0,
        align: string = 'center'
    ): Position {
        return this.repositionWithinBounds(position, width, height, margin, true, transitionMovement, align);
    }

    /**
     * Positionne un élément de manière absolue
     * @description Applique position: absolute avec les coordonnées x, y et optionnellement z-index
     * @param {HTMLElement} element - Élément à positionner
     * @param {number} x - Position X en pixels
     * @param {number} y - Position Y en pixels
     * @param {number} [zIndex] - Index Z optionnel
     * @returns {void}
     * @static
     */
    static setAbsolutePosition(
        element: HTMLElement,
        x: number,
        y: number,
        zIndex?: number
    ): void {
        element.style.position = 'absolute';
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;

        if (zIndex !== undefined) {
            element.style.zIndex = zIndex.toString();
        }
    }


    /**
     * Vérifie si un élément est dans un conteneur fixed/sticky ou une appbar
     * @description Parcourt les parents pour détecter si l'élément est dans un conteneur avec position fixed/sticky ou une appbar
     * Amélioré pour détecter les appbars avec reveal et les transformations CSS
     * @private
     * @param {HTMLElement} element - Élément à vérifier
     * @returns {boolean} true si l'élément est dans un conteneur fixed/sticky ou appbar
     * @static
     */
    private static _isInFixedContainer(element: HTMLElement): boolean {
        let parent: HTMLElement | null = element.parentElement;
        while (parent && parent !== document.body) {
            const style = getComputedStyle(parent);
            // Détecter les appbars (avec ou sans reveal)
            if (parent.classList.contains('appbar') ||
                parent.classList.contains('navbar') ||
                parent.classList.contains('appbar-container') ||
                // Détecter les positions fixed/sticky
                style.position === 'fixed' ||
                style.position === 'sticky' ||
                // Détecter les transformations CSS qui peuvent indiquer un reveal
                (style.transform && style.transform !== 'none')) {
                return true;
            }
            parent = parent.parentElement;
        }
        return false;
    }

    /**
     * Obtient le scroll top du document
     * @description Récupère la position de scroll verticale du document (compatible multi-navigateurs)
     * @private
     * @returns {number} Position de scroll verticale en pixels
     * @static
     */
    private static getDocumentScrollTop(): number {
        return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    }

    /**
     * Obtient le scroll left du document
     * @description Récupère la position de scroll horizontale du document (compatible multi-navigateurs)
     * @private
     * @returns {number} Position de scroll horizontale en pixels
     * @static
     */
    private static getDocumentScrollLeft(): number {
        return window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
    }

    /**
     * Obtient l'ID d'un élément trigger
     * @description Récupère l'ID depuis data-target, data-id, id ou génère un ID unique
     * @param {HTMLElement} trigger - Élément trigger
     * @returns {string} ID de l'élément ou ID généré automatiquement
     * @static
     */
    static getIdFromTrigger(trigger: HTMLElement): string {
        // Priorité: data-target (pour menus), puis data-id, puis id, puis génération automatique
        return trigger.getAttribute('data-target') ||
            trigger.getAttribute('data-id') ||
            trigger.id ||
            `trigger-${Date.now()}`;
    }

    /**
     * Mesure la largeur réelle d'un menu en le rendant temporairement visible
     * @description Sauvegarde les styles, rend le menu visible, mesure sa largeur, puis restaure les styles
     * @private
     * @param {HTMLElement} menu - Élément menu à mesurer
     * @returns {DOMRect} Rectangle du menu avec la largeur correcte
     * @static
     */
    private static _measureMenuWidth(menu: HTMLElement): DOMRect {
        // Sauvegarder les styles originaux
        const originalStyles = {
            display: menu.style.display,
            visibility: menu.style.visibility,
            position: menu.style.position,
            left: menu.style.left,
            right: menu.style.right,
            width: menu.style.width,
            maxWidth: menu.style.maxWidth,
            minWidth: menu.style.minWidth,
            transform: menu.style.transform
        };

        const computedDisplay = window.getComputedStyle(menu).display;
        const computedTransform = window.getComputedStyle(menu).transform;

        // S'assurer que le menu est visible pour obtenir sa largeur correcte
        if (originalStyles.display === 'none' || computedDisplay === 'none') {
            menu.style.display = 'block';
            menu.style.visibility = 'hidden'; // Cacher visuellement mais garder l'espace
        }

        // Réinitialiser temporairement la position et les contraintes de largeur
        menu.style.position = 'static';
        menu.style.left = 'auto';
        menu.style.right = 'auto';
        menu.style.width = 'auto';
        menu.style.maxWidth = 'none';
        menu.style.minWidth = 'auto';

        // IMPORTANT: Réinitialiser le transform pour obtenir la largeur réelle (sans scale)
        // Le transform scale réduit la largeur mesurée par getBoundingClientRect()
        if (computedTransform && computedTransform !== 'none') {
            menu.style.transform = 'none';
        }

        // Forcer un recalcul de layout avant la lecture (éviter forced reflow multiple)
        void menu.offsetWidth;
        let menuRect = menu.getBoundingClientRect();

        // IMPORTANT: Utiliser getBoundingClientRect().width pour le positionnement car il exclut les bordures
        // offsetWidth inclut les bordures, ce qui donnerait une largeur trop grande
        // Seulement utiliser offsetWidth si getBoundingClientRect().width est trop petit (menu pas encore dimensionné)
        if (menuRect.width < MIN_MENU_WIDTH) {
            // Le menu n'a pas encore sa largeur réelle, utiliser clientWidth (sans bordures) ou offsetWidth
            const menuActualWidth = menu.clientWidth || menu.offsetWidth || menu.scrollWidth || 0;
            if (menuActualWidth > menuRect.width) {
                // Créer un nouveau DOMRect avec la largeur corrigée
                // Utiliser clientWidth pour exclure les bordures comme getBoundingClientRect().width
                menuRect = new DOMRect(menuRect.x, menuRect.y, menuActualWidth, menuRect.height);
            }
        }

        // Restaurer les styles originaux
        Object.assign(menu.style, originalStyles);

        // Restaurer le transform si nécessaire (il a été réinitialisé pour la mesure)
        if (computedTransform && computedTransform !== 'none') {
            menu.style.transform = originalStyles.transform || computedTransform;
        }

        // Restaurer l'état d'affichage si nécessaire
        if (originalStyles.display === 'none' || computedDisplay === 'none') {
            menu.style.display = originalStyles.display;
            menu.style.visibility = originalStyles.visibility;
        }

        return menuRect;
    }

    /**
     * Parse un placement de menu pour extraire la direction et l'alignement
     * @private
     * @param {string} placement - Placement du menu (ex: 'top-start', 'bottom-end', etc.)
     * @returns {{direction: string, alignment: string}} Direction et alignement
     * @static
     */
    private static _parsePlacement(placement: string): { direction: string, alignment: string } {
        const parts = placement.split('-');
        return {
            direction: parts[0] || 'bottom',
            alignment: parts[1] || 'center'
        };
    }

    /**
     * Positionne un menu par rapport à son trigger et conteneur parent
     * @description Calcule et applique la position d'un menu avec support RTL, détection du container parent,
     * placements complets (top/top-start/top-end, bottom/bottom-start/bottom-end, etc.), et gestion des conteneurs
     * @deprecated Utiliser computePosition et autoUpdate depuis utils/floating. Cette fonction est conservée pour compatibilité mais sera supprimée dans une future version.
     * @param {HTMLElement} trigger - Élément trigger (bouton, input, etc.)
     * @param {HTMLElement} menu - Élément menu à positionner
     * @param {string} [placement='bottom-start'] - Placement du menu ('top', 'top-start', 'top-end', 'bottom', 'bottom-start', 'bottom-end', 'right', 'right-start', 'right-end', 'left', 'left-start', 'left-end', 'auto')
     * @param {boolean} [cover=false] - Si le menu recouvre le trigger (même position X/Y)
     * @param {number} [margin=4] - Marge en pixels entre le trigger et le menu
     * @param {HTMLElement} [container] - Conteneur parent optionnel (sinon détecté automatiquement)
     * @returns {void}
     * @static
     */
    static setMenuPosition(
        trigger: HTMLElement,
        menu: HTMLElement,
        placement: string = 'bottom-start',
        cover: boolean = false,
        margin: number = 4,
        container?: HTMLElement,
        useTransform: boolean = false
    ): void {
        // Trouver le conteneur parent si non fourni
        const parentContainer = container || Positioning._findOverflowParent(menu) || Positioning._findOverflowParent(trigger);

        // Détecter si le contexte est RTL
        const isRtlContext = isRTL(trigger) || isRTL(parentContainer) || isRTL(document);

        // Forcer un reflow pour garantir que tous les éléments ont leurs dimensions finales
        Positioning._forceReflow(trigger, menu, parentContainer);

        // Recalculer les rectangles après le reflow
        const triggerRect = trigger.getBoundingClientRect();

        // Mesurer la largeur et hauteur réelles du menu
        const menuRect = Positioning._measureMenuWidth(menu);
        const menuHeight = menu.offsetHeight || menuRect.height;

        // Déterminer si on utilise position: fixed ou absolute
        const isBodyContainer = parentContainer === document.body;
        const containerRect = isBodyContainer
            ? { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0 } as DOMRect
            : parentContainer.getBoundingClientRect();

        // Si cover est activé, positionner le menu exactement sur le trigger
        // IMPORTANT: Utiliser getBoundingClientRect() directement pour position: fixed
        if (cover) {
            const x = triggerRect.left;
            const y = triggerRect.top;
            Positioning._applyMenuPosition(menu, x, y, true, useTransform); // Toujours utiliser fixed
            Positioning._applyMenuStyles(menu, trigger, 'left', isRtlContext);
            return;
        }

        // Parser le placement
        const parsed = Positioning._parsePlacement(placement);
        const { direction, alignment } = parsed;

        // Calculer les positions selon le placement
        let positions = Positioning._calculatePlacementPosition(
            triggerRect,
            menuRect,
            menuHeight,
            containerRect,
            direction,
            alignment,
            isRtlContext,
            isBodyContainer,
            margin
        );

        // Vérifier les débordements et repositionner si nécessaire
        // Utiliser position: fixed donc vérifier par rapport au viewport
        // Pour position: fixed, vérifier directement les coordonnées viewport (pas besoin de soustraire scroll)
        const edges = {
            top: positions.y < margin,
            bottom: positions.y + menuHeight > window.innerHeight - margin,
            left: positions.x < margin,
            right: positions.x + menuRect.width > window.innerWidth - margin
        };

        // Si des débordements sont détectés, ajuster la position
        if (edges.left || edges.right || edges.top || edges.bottom) {
            // Repositionner dans le viewport (car on utilise position: fixed)
            positions = Positioning.repositionWithinViewport(
                positions,
                menuRect.width,
                menuHeight,
                margin,
                0, // transitionMovement
                alignment
            );
        }

        // Appliquer la position
        // IMPORTANT: Toujours utiliser position: fixed pour suivre le trigger au scroll
        Positioning._applyMenuPosition(menu, positions.x, positions.y, true, useTransform);

        // Forcer un layout recalculation
        void menu.offsetWidth;

        // Appliquer les styles supplémentaires (utiliser l'alignement dérivé du placement)
        const derivedAlignment = Positioning._getAlignmentFromPlacement(direction, alignment, isRtlContext);
        Positioning._applyMenuStyles(menu, trigger, derivedAlignment, isRtlContext);
    }

    /**
     * Calcule la position X/Y selon le placement
     * @private
     * @param {DOMRect} triggerRect - Rectangle du trigger
     * @param {DOMRect} menuRect - Rectangle du menu (largeur)
     * @param {number} menuHeight - Hauteur du menu
     * @param {DOMRect} containerRect - Rectangle du container
     * @param {string} direction - Direction du placement ('top', 'bottom', 'left', 'right')
     * @param {string} alignment - Alignement ('start', 'end', 'center')
     * @param {boolean} isRtlContext - Si le contexte est RTL
     * @param {boolean} isBodyContainer - Si le container est document.body
     * @param {number} margin - Marge en pixels
     * @returns {{x: number, y: number}} Positions X et Y calculées
     * @static
     */
    private static _calculatePlacementPosition(
        triggerRect: DOMRect,
        menuRect: DOMRect,
        menuHeight: number,
        containerRect: DOMRect,
        direction: string,
        alignment: string,
        isRtlContext: boolean,
        isBodyContainer: boolean,
        margin: number
    ): { x: number, y: number } {
        let x = 0;
        let y = 0;

        // IMPORTANT: Utiliser getBoundingClientRect() directement pour position: fixed
        // Les coordonnées sont toujours relatives au viewport avec position: fixed

        // Vérifier si le trigger est visible dans le viewport
        // Si le trigger est hors écran (top négatif ou bottom > viewport), ajuster la position
        const triggerVisibleTop = Math.max(0, triggerRect.top);
        const triggerVisibleBottom = Math.min(window.innerHeight, triggerRect.bottom);
        const triggerIsPartiallyVisible = triggerRect.bottom > 0 && triggerRect.top < window.innerHeight;
        const triggerIsCompletelyAbove = triggerRect.bottom <= 0;
        const triggerIsCompletelyBelow = triggerRect.top >= window.innerHeight;

        switch (direction) {
            case 'top':
                // Menu au-dessus du trigger
                if (triggerIsCompletelyAbove) {
                    // Trigger complètement hors écran en haut : positionner le menu en haut du viewport
                    y = margin;
                } else if (triggerRect.top < 0 && triggerVisibleBottom > 0) {
                    // Trigger partiellement visible (partie basse visible) : positionner en bas du trigger visible
                    y = triggerVisibleBottom + margin;
                } else {
                    // Trigger visible : positionner normalement au-dessus
                    y = triggerRect.top - menuHeight - margin;
                }
                x = Positioning._calculateHorizontalAlignment(triggerRect, menuRect, containerRect, alignment, isRtlContext, true);
                break;

            case 'bottom':
                // Menu en-dessous du trigger
                if (triggerIsCompletelyBelow) {
                    // Trigger complètement hors écran en bas : positionner le menu en bas du viewport
                    y = window.innerHeight - menuHeight - margin;
                } else if (triggerRect.bottom > window.innerHeight && triggerVisibleTop < window.innerHeight) {
                    // Trigger partiellement visible (partie haute visible) : positionner au-dessus du trigger visible
                    y = triggerVisibleTop - menuHeight - margin;
                } else {
                    // Trigger visible : positionner normalement en dessous
                    y = triggerRect.bottom + margin;
                }
                x = Positioning._calculateHorizontalAlignment(triggerRect, menuRect, containerRect, alignment, isRtlContext, true);
                break;

            case 'right':
                // Menu à droite du trigger
                x = triggerRect.right + margin;
                y = Positioning._calculateVerticalAlignment(triggerRect, menuHeight, containerRect, alignment, true);
                break;

            case 'left':
                // Menu à gauche du trigger
                x = triggerRect.left - menuRect.width - margin;
                y = Positioning._calculateVerticalAlignment(triggerRect, menuHeight, containerRect, alignment, true);
                break;
        }

        return { x, y };
    }

    /**
     * Calcule l'alignement horizontal (start/end/center) pour top/bottom
     * @private
     * @param {DOMRect} triggerRect - Rectangle du trigger
     * @param {DOMRect} menuRect - Rectangle du menu
     * @param {DOMRect} containerRect - Rectangle du container
     * @param {string} alignment - Alignement ('start', 'end', 'center')
     * @param {boolean} isRtlContext - Si le contexte est RTL
     * @param {boolean} isBodyContainer - Si le container est document.body
     * @returns {number} Position X calculée
     * @static
     */
    private static _calculateHorizontalAlignment(
        triggerRect: DOMRect,
        menuRect: DOMRect,
        containerRect: DOMRect,
        alignment: string,
        isRtlContext: boolean,
        isBodyContainer: boolean
    ): number {
        // IMPORTANT: Avec position: fixed, les coordonnées sont toujours relatives au viewport
        // Utiliser directement getBoundingClientRect() sans soustraire containerRect
        let x = 0;
        if (alignment === 'center') {
            // Centré : menu.center = trigger.center
            const triggerCenter = triggerRect.left + triggerRect.width / 2;
            const menuCenter = menuRect.width / 2;
            x = triggerCenter - menuCenter;
        } else if (alignment === 'start') {
            // Start : en LTR = gauche, en RTL = droite
            if (isRtlContext) {
                // En RTL, start = droite
                x = triggerRect.right - menuRect.width;
            } else {
                // En LTR, start = gauche
                x = triggerRect.left;
            }
        } else {
            // End : en LTR = droite, en RTL = gauche
            if (isRtlContext) {
                // En RTL, end = gauche
                x = triggerRect.left;
            } else {
                // En LTR, end = droite
                x = triggerRect.right - menuRect.width;
            }
        }

        return x;
    }

    /**
     * Calcule l'alignement vertical (start/end/center) pour left/right
     * @private
     * @param {DOMRect} triggerRect - Rectangle du trigger
     * @param {number} menuHeight - Hauteur du menu
     * @param {DOMRect} containerRect - Rectangle du container
     * @param {string} alignment - Alignement ('start', 'end', 'center')
     * @param {boolean} isBodyContainer - Si le container est document.body
     * @returns {number} Position Y calculée
     * @static
     */
    private static _calculateVerticalAlignment(
        triggerRect: DOMRect,
        menuHeight: number,
        containerRect: DOMRect,
        alignment: string,
        isBodyContainer: boolean
    ): number {
        // IMPORTANT: Avec position: fixed, les coordonnées sont toujours relatives au viewport
        // Utiliser directement getBoundingClientRect() sans soustraire containerRect
        if (alignment === 'center') {
            // Centré : menu.center = trigger.center
            const triggerCenter = triggerRect.top + triggerRect.height / 2;
            const menuCenter = menuHeight / 2;
            return triggerCenter - menuCenter;
        } else if (alignment === 'start') {
            // Start = haut
            return triggerRect.top;
        } else {
            // End = bas
            return triggerRect.bottom - menuHeight;
        }
    }

    /**
     * Obtient l'alignement (left/right) depuis le placement pour les styles
     * @private
     * @param {string} direction - Direction ('top', 'bottom', 'left', 'right')
     * @param {string} alignment - Alignement ('start', 'end', 'center')
     * @param {boolean} isRtlContext - Si le contexte est RTL
     * @returns {('left'|'right')} Alignement pour les styles
     * @static
     */
    private static _getAlignmentFromPlacement(
        direction: string,
        alignment: string,
        isRtlContext: boolean
    ): 'left' | 'right' {
        if (direction === 'top' || direction === 'bottom') {
            // Pour top/bottom, l'alignement horizontal détermine left/right
            if (alignment === 'start') {
                return isRtlContext ? 'right' : 'left';
            } else if (alignment === 'end') {
                return isRtlContext ? 'left' : 'right';
            } else {
                // Center : par défaut left
                return 'left';
            }
        } else {
            // Pour left/right, utiliser left par défaut
            return 'left';
        }
    }

    /**
     * Force un reflow pour garantir que les éléments ont leurs dimensions finales
     * @private
     * @param {HTMLElement} trigger - Élément trigger
     * @param {HTMLElement} menu - Élément menu
     * @param {HTMLElement} container - Conteneur parent
     * @returns {void}
     * @static
     */
    private static _forceReflow(trigger: HTMLElement, menu: HTMLElement, container: HTMLElement): void {
        void trigger.offsetHeight;
        void menu.offsetHeight;
        if (container !== document.body) {
            void container.offsetHeight;
        }
    }

    /**
     * Vérifie si un élément est un bouton
     * @private
     * @param {HTMLElement} trigger - Élément à vérifier
     * @returns {boolean} true si c'est un bouton
     * @static
     */
    private static _isButton(trigger: HTMLElement): boolean {
        return trigger.tagName === 'BUTTON' ||
            trigger.classList.contains('btn') ||
            !!trigger.closest('.select-wrapper')?.classList.contains('select-button-version');
    }

    /**
     * Corrige la position pour l'alignement à droite si la largeur a changé
     * @private
     * @param {HTMLElement} menu - Élément menu
     * @param {DOMRect} triggerRect - Rectangle du trigger
     * @param {DOMRect} originalMenuRect - Rectangle original du menu
     * @param {DOMRect} containerRect - Rectangle du container
     * @param {('left'|'right')} alignment - Alignement
     * @param {boolean} isRtlContext - Si le contexte est RTL
     * @param {boolean} isBodyContainer - Si le container est document.body
     * @returns {void}
     * @static
     */
    private static _correctRightAlignment(
        menu: HTMLElement,
        triggerRect: DOMRect,
        originalMenuRect: DOMRect,
        containerRect: DOMRect,
        alignment: 'left' | 'right',
        isRtlContext: boolean,
        isBodyContainer: boolean
    ): void {
        const menuRectAfter = menu.getBoundingClientRect();
        const actualWidth = menuRectAfter.width;

        if (Math.abs(actualWidth - originalMenuRect.width) > WIDTH_DIFFERENCE_THRESHOLD) {
            // La largeur a changé, recalculer la position
            const correctedX = Positioning._calculateHorizontalPosition(
                triggerRect,
                menuRectAfter,
                containerRect,
                alignment,
                isRtlContext,
                isBodyContainer
            );
            menu.style.left = correctedX + 'px';
            void menu.offsetWidth; // Forcer un nouveau recalcul
        }
    }

    /**
     * Calcule la position verticale du menu
     * @description Calcule la position Y selon coverTrigger et le type de container (body ou autre)
     * @private
     * @param {DOMRect} triggerRect - Rectangle du trigger
     * @param {DOMRect} containerRect - Rectangle du container parent
     * @param {boolean} coverTrigger - Si le menu couvre le trigger
     * @param {boolean} isBodyContainer - Si le container est document.body
     * @param {boolean} [isButton=false] - Si le trigger est un bouton (pour réduire l'espace vertical)
     * @param {HTMLElement} [menu] - Élément menu (pour calculer le padding)
     * @returns {number} Position Y calculée
     * @static
     */
    private static _calculateVerticalPosition(
        triggerRect: DOMRect,
        containerRect: DOMRect,
        coverTrigger: boolean,
        isBodyContainer: boolean,
        isButton: boolean = false,
        menu?: HTMLElement
    ): number {
        if (coverTrigger) {
            // Le menu couvre le trigger (même position Y)
            return isBodyContainer ? triggerRect.top : triggerRect.top - containerRect.top;
        } else {
            // Le menu est en dessous du trigger
            let verticalOffset = 0;

            // Pour les selects (pas les boutons), soustraire le padding-top du menu
            // pour que le contenu du menu soit collé directement au trigger
            // MAIS pour les menus simples (ul.menu-content), garder une marge de 4px
            if (!isButton && menu) {
                const isSimpleMenu = menu.classList.contains('menu-content') || menu.tagName === 'UL';
                if (!isSimpleMenu) {
                    // Seulement pour les selects, soustraire le padding-top
                    const menuStyle = getComputedStyle(menu);
                    const paddingTop = parseFloat(menuStyle.paddingTop) || 0;
                    verticalOffset = -paddingTop;
                } else {
                    // Pour les menus simples, ajouter une marge de 4px
                    verticalOffset = 4;
                }
            } else if (isButton) {
                // Pour les boutons, ajouter une marge de 4px
                verticalOffset = 4;
            }

            return isBodyContainer
                ? triggerRect.bottom + verticalOffset
                : triggerRect.bottom - containerRect.top + verticalOffset;
        }
    }

    /**
     * Calcule la position horizontale du menu
     * @description Calcule la position X avec support RTL, alignement à gauche/droite
     * RÈGLE SIMPLE : aligné à gauche = bord gauche du menu aligné avec bord gauche du trigger
     *                 aligné à droite = bord droit du menu aligné avec bord droit du trigger
     * @private
     * @param {DOMRect} triggerRect - Rectangle du trigger
     * @param {DOMRect} menuRect - Rectangle du menu
     * @param {DOMRect} containerRect - Rectangle du container parent
     * @param {('left'|'right')} alignment - Alignement horizontal ('left' ou 'right')
     * @param {boolean} isRtlContext - Si le contexte est RTL
     * @param {boolean} isBodyContainer - Si le container est document.body
     * @returns {number} Position X calculée (en pixels, relative au container si absolute, absolue si fixed)
     * @static
     */
    private static _calculateHorizontalPosition(
        triggerRect: DOMRect,
        menuRect: DOMRect,
        containerRect: DOMRect,
        alignment: 'left' | 'right',
        isRtlContext: boolean,
        isBodyContainer: boolean
    ): number {
        // LOGIQUE SIMPLIFIÉE ET CORRIGÉE
        // aligné à gauche = bord gauche du menu aligné avec le bord gauche du trigger
        // aligné à droite = bord droit du menu aligné avec le bord droit du trigger

        if (alignment === 'left') {
            // Alignement à gauche : menu.left = trigger.left
            if (isRtlContext) {
                // En RTL, 'left' visuel = bord droit physique
                return isBodyContainer
                    ? triggerRect.right - menuRect.width
                    : triggerRect.right - containerRect.left - menuRect.width;
            } else {
                // En LTR, 'left' = bord gauche
                return isBodyContainer
                    ? triggerRect.left
                    : triggerRect.left - containerRect.left;
            }
        } else {
            // Alignement à droite : menu.right = trigger.right
            if (isRtlContext) {
                // En RTL, 'right' visuel = bord gauche physique
                return isBodyContainer
                    ? triggerRect.left - menuRect.width
                    : triggerRect.left - containerRect.left - menuRect.width;
            } else {
                // En LTR, 'right' = bord droit
                return isBodyContainer
                    ? triggerRect.right - menuRect.width
                    : triggerRect.right - containerRect.left - menuRect.width;
            }
        }
    }

    /**
     * Applique la position calculée au menu
     * @description Applique position (fixed ou absolute) et les coordonnées x, y en désactivant temporairement les transitions
     * @private
     * @param {HTMLElement} menu - Élément menu
     * @param {number} x - Position X en pixels
     * @param {number} y - Position Y en pixels
     * @param {boolean} isBodyContainer - Si le container est document.body (détermine fixed vs absolute)
     * @returns {void}
     * @static
     */
    private static _applyMenuPosition(
        menu: HTMLElement,
        x: number,
        y: number,
        isBodyContainer: boolean,
        useTransform: boolean = false
    ): void {
        // Désactiver temporairement les transitions pour éviter les sauts
        const originalTransition = menu.style.transition;
        menu.style.transition = 'none';

        // IMPORTANT: Utiliser position: fixed pour TOUS les menus pour qu'ils suivent le trigger au scroll
        // Material Design 3 recommande d'utiliser position: fixed avec getBoundingClientRect()
        // pour garantir que le menu reste collé au trigger même lors du scroll
        menu.style.position = 'fixed';
        // Optimiser les performances avec will-change pour les repositionnements fréquents lors du scroll
        menu.style.willChange = 'left, top';

        // IMPORTANT: Toujours utiliser left/top pour le positionnement sticky, pas transform
        // car transform interfère avec l'animation de fermeture qui utilise aussi transform.
        // Le positionnement avec left/top et position: fixed est suffisamment performant.
        // IMPORTANT: Réinitialiser right AVANT de définir left pour éviter les conflits
        menu.style.right = 'auto';
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';

        // IMPORTANT: Ne pas utiliser transform pour le positionnement sticky car cela casse l'animation de fermeture
        // L'animation de fermeture utilise transform pour scale, donc on ne peut pas utiliser transform pour le positionnement
        // Réinitialiser transform uniquement si une animation n'est pas en cours (pour préserver l'animation de fermeture)
        const currentTransform = menu.style.transform;
        // Si transform contient scale (animation de fermeture), on le préserve, sinon on le vide
        if (!currentTransform || !currentTransform.includes('scale')) {
            menu.style.transform = '';
        }

        // Forcer un layout recalculation immédiat pour stabiliser le positionnement
        void menu.offsetWidth;

        // Vérifier si le menu est réellement positionné correctement après l'application
        // Si position: fixed mais que le menu est dans un conteneur avec transform,
        // le positionnement peut être incorrect
        const actualRect = menu.getBoundingClientRect();
        if (isBodyContainer && menu.style.position === 'fixed') {
            // Si la position réelle ne correspond pas à la position appliquée,
            // cela signifie que le menu est dans un conteneur avec un contexte de positionnement
            const expectedTop = parseFloat(menu.style.top) || 0;
            const actualTop = actualRect.top;
            const tolerance = 1; // Tolérance de 1px pour les arrondis

            // Si l'écart est significatif (plus que la tolérance), forcer le repositionnement
            if (Math.abs(actualTop - expectedTop) > tolerance) {
                // Le menu est probablement dans un conteneur avec transform
                // Forcer le repositionnement en ajustant la position
                const offset = actualTop - expectedTop;
                const correctedY = y - offset;
                menu.style.top = correctedY + 'px';
                // Forcer un nouveau layout recalculation
                void menu.offsetWidth;
            }
        }

        // Réactiver les transitions après un court délai
        requestAnimationFrame(() => {
            menu.style.transition = originalTransition;
        });
    }

    /**
     * Applique les styles supplémentaires au menu (z-index, transform-origin)
     * @description Définit le z-index selon le contexte (navbar ou normal) et le transform-origin pour l'animation selon l'alignement et RTL
     * @private
     * @param {HTMLElement} menu - Élément menu
     * @param {HTMLElement} trigger - Élément trigger
     * @param {('left'|'right')} alignment - Alignement horizontal
     * @param {boolean} isRtlContext - Si le contexte est RTL
     * @returns {void}
     * @static
     */
    private static _applyMenuStyles(
        menu: HTMLElement,
        trigger: HTMLElement,
        alignment: 'left' | 'right',
        isRtlContext: boolean
    ): void {
        // Déterminer le z-index selon le contexte
        const navbarContainer = trigger.closest('.navbar-select-container');
        const zIndex = navbarContainer ? NAVBAR_MENU_Z_INDEX : MENU_Z_INDEX;
        menu.style.zIndex = zIndex;

        // Définir le transform-origin pour l'animation
        // En RTL, le transform-origin est inversé visuellement
        if (alignment === 'left') {
            menu.style.transformOrigin = isRtlContext ? 'top right' : 'top left';
        } else {
            menu.style.transformOrigin = isRtlContext ? 'top left' : 'top right';
        }
    }

    /**
     * Trouve le parent avec overflow pour le positionnement
     * @description Parcourt les parents pour trouver le premier avec position non-static ou overflow non-visible
     * @private
     * @param {HTMLElement} element - Élément de départ
     * @returns {HTMLElement} Parent avec overflow ou document.body si aucun trouvé
     * @static
     */
    private static _findOverflowParent(element: HTMLElement): HTMLElement {
        let parent = element.parentElement;
        while (parent && parent !== document.body) {
            const style = getComputedStyle(parent);
            if (style.position !== 'static' || style.overflow !== 'visible') {
                return parent;
            }
            parent = parent.parentElement;
        }
        return document.body;
    }

    /**
     * Positionne un badge sur un élément parent selon Material Design 3
     * @description Cette méthode n'est plus utilisée - le positionnement est géré par le CSS
     * @param {HTMLElement} badge - Élément badge à positionner
     * @param {HTMLElement} parent - Élément parent
     * @param {('top-right'|'top-left'|'bottom-right'|'bottom-left')} position - Position du badge
     * @returns {void}
     * @static
     * @deprecated Le positionnement est maintenant géré uniquement par le CSS via les classes badge--top-right, etc.
     */
    static setBadgePosition(
        badge: HTMLElement,
        parent: HTMLElement,
        position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
    ): void {
        // S'assurer que le parent a position relative
        const parentStyle = getComputedStyle(parent);
        if (parentStyle.position === 'static') {
            parent.style.position = 'relative';
        }
        // Le reste du positionnement est géré par le CSS via les classes badge--top-right, etc.
    }

}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Fonctions utilitaires pour compatibilité avec utils.ts
 * @description Exporte les méthodes statiques de Positioning sous forme d'objet utilitaire
 * @note Certaines fonctions sont dépréciées en faveur de utils/floating (voir @deprecated dans Positioning)
 * @namespace positioningUtils
 */
export const positioningUtils = {
    checkWithinContainer: Positioning.checkWithinContainer,
    checkPossibleAlignments: Positioning.checkPossibleAlignments,
    setAbsolutePosition: Positioning.setAbsolutePosition,
    /** @deprecated Utiliser computePosition et autoUpdate depuis utils/floating à la place */
    setMenuPosition: Positioning.setMenuPosition,
    setBadgePosition: Positioning.setBadgePosition,
    getIdFromTrigger: Positioning.getIdFromTrigger,
};

