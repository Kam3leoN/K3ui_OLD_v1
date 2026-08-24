/**
 * @fileoverview Effet Ripple Material Design 3
 * @description Gestionnaire d'effets ripple (state layers) Material Design 3
 * @author K3UI Team
 * @version 1.0.0
 */

// Easing Material Design 3 standard
const EASING = {
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    'standard-accelerate': 'cubic-bezier(0.3, 0, 1, 1)',
    'standard-decelerate': 'cubic-bezier(0, 0, 0, 1)',
} as const;

// ============================================================================
// CONSTANTES
// ============================================================================

/**
 * Durée de croissance du ripple en millisecondes
 */
const PRESS_GROW_MS = 450;

/**
 * Durée minimale d'affichage du ripple en millisecondes
 */
const MINIMUM_PRESS_MS = 225;

/**
 * Échelle initiale de l'origine du ripple
 */
const INITIAL_ORIGIN_SCALE = 0.2;

/**
 * Padding autour du ripple
 */
const PADDING = 10;

/**
 * Taille minimale du soft edge
 */
const SOFT_EDGE_MINIMUM_SIZE = 75;

/**
 * Ratio du conteneur pour le soft edge
 */
const SOFT_EDGE_CONTAINER_RATIO = 0.35;

/**
 * Délai avant de réagir au touch (pour ignorer swipe/scroll)
 */
const TOUCH_DELAY_MS = 150;

/**
 * Pseudo-élément utilisé pour l'animation
 */
const PRESS_PSEUDO = '::after';

/**
 * Fill mode de l'animation
 */
const ANIMATION_FILL = 'forwards';

/**
 * Événements écoutés par le ripple (réduit au strict nécessaire).
 * pointerenter/leave en passive ; click pour activation clavier.
 */
const EVENTS = [
    'click',
    'contextmenu',
    'pointercancel',
    'pointerdown',
    'pointerenter',
    'pointerleave',
    'pointerup',
] as const;

const PASSIVE_EVENTS = new Set<string>(['pointerenter', 'pointerleave']);

// ============================================================================
// ENUMS ET TYPES
// ============================================================================

/**
 * États d'interaction pour le ripple
 *
 * Sur Touch:
 *  - INACTIVE -> TOUCH_DELAY -> WAITING_FOR_CLICK -> INACTIVE
 *  - INACTIVE -> TOUCH_DELAY -> HOLDING -> WAITING_FOR_CLICK -> INACTIVE
 *
 * Sur Mouse ou Pen:
 *   - INACTIVE -> WAITING_FOR_CLICK -> INACTIVE
 */
enum RippleState {
    /**
     * État initial, aucune interaction en cours
     */
    INACTIVE = 0,

    /**
     * Touch down reçu, en attente pour déterminer si c'est un swipe ou scroll
     */
    TOUCH_DELAY = 1,

    /**
     * Un touch a été considéré comme un press
     */
    HOLDING = 2,

    /**
     * L'interaction utilisateur est terminée, transition vers l'état de repos
     */
    WAITING_FOR_CLICK = 3,
}

/**
 * Options de configuration du ripple
 */
export interface RippleOptions {
    /**
     * Désactive le ripple
     */
    disabled?: boolean;

    /**
     * Élément cible (par défaut l'élément lui-même)
     */
    target?: HTMLElement;
}

// ============================================================================
// CLASSE RIPPLE
// ============================================================================

/**
 * Gestionnaire d'effets ripple Material Design 3
 *
 * Les ripples, aussi appelés state layers, sont des indicateurs visuels utilisés
 * pour communiquer le statut d'un composant ou d'un élément interactif.
 *
 * @example
 * ```typescript
 * const ripple = new Ripple(buttonElement);
 * ripple.attach();
 * ```
 */
export class Ripple {
    private _element: HTMLElement;
    private _disabled: boolean;
    private _hovered: boolean;
    private _pressed: boolean;
    private _state: RippleState;
    private _rippleSize: string;
    private _rippleScale: string;
    private _initialSize: number;
    private _rippleStartEvent?: PointerEvent;
    private _checkBoundsAfterContextMenu: boolean;
    private _growAnimation?: Animation;
    private _surfaceElement?: HTMLElement;
    private _pressedLayer?: HTMLElement;
    private _hoverLayer?: HTMLElement;
    private _boundHandleEvent: (event: Event) => void;
    private _forcedColorsMedia?: MediaQueryList;

    /**
     * Crée une instance de Ripple
     * @param element - Élément auquel attacher le ripple
     * @param options - Options de configuration
     */
    constructor(element: HTMLElement, options: RippleOptions = {}) {
        this._element = options.target || element;
        this._disabled = options.disabled ?? false;
        this._hovered = false;
        this._pressed = false;
        this._state = RippleState.INACTIVE;
        this._rippleSize = '';
        this._rippleScale = '';
        this._initialSize = 0;
        this._checkBoundsAfterContextMenu = false;
        this._boundHandleEvent = this.handleEvent.bind(this);

        // Détection HCM (High Contrast Mode)
        if (typeof window !== 'undefined') {
            this._forcedColorsMedia = window.matchMedia('(forced-colors: active)');
        }

        // Créer la surface du ripple si elle n'existe pas
        this.createSurface();
    }

    /**
     * Crée l'élément surface pour le ripple
     */
    private createSurface(): void {
        // Vérifier si une surface existe déjà
        this._surfaceElement = this._element.querySelector('.ripple-surface') as HTMLElement;

        if (!this._surfaceElement) {
            this._surfaceElement = document.createElement('div');
            this._surfaceElement.className = 'ripple-surface';
            this._surfaceElement.setAttribute('aria-hidden', 'true');

            // Créer les couches hover et pressed
            this._hoverLayer = document.createElement('div');
            this._hoverLayer.className = 'ripple-hover-layer';

            this._pressedLayer = document.createElement('div');
            this._pressedLayer.className = 'ripple-pressed-layer';

            this._surfaceElement.appendChild(this._hoverLayer);
            this._surfaceElement.appendChild(this._pressedLayer);

            // Ajouter la surface à l'élément
            // Position relative si nécessaire
            const position = window.getComputedStyle(this._element).position;
            if (position === 'static') {
                this._element.style.position = 'relative';
            }

            this._element.appendChild(this._surfaceElement);
        } else {
            // Récupérer les couches existantes
            this._hoverLayer = this._surfaceElement.querySelector('.ripple-hover-layer') as HTMLElement;
            this._pressedLayer = this._surfaceElement.querySelector('.ripple-pressed-layer') as HTMLElement;
        }

        // Mettre à jour les classes
        this.updateSurfaceClasses();
    }

    /**
     * Met à jour les classes de la surface
     */
    private updateSurfaceClasses(): void {
        if (!this._surfaceElement) return;

        this._surfaceElement.classList.toggle('ripple-hovered', this._hovered);
        this._surfaceElement.classList.toggle('ripple-pressed', this._pressed);
        this._surfaceElement.classList.toggle('ripple-disabled', this._disabled);
    }

    /**
     * Attache les événements au ripple
     */
    attach(): void {
        if (this._disabled) {
            return;
        }

        if (
            typeof matchMedia !== 'undefined' &&
            matchMedia('(prefers-reduced-motion: reduce)').matches
        ) {
            return;
        }

        for (const eventType of EVENTS) {
            const opts = PASSIVE_EVENTS.has(eventType) ? ({ passive: true } as AddEventListenerOptions) : undefined;
            this._element.addEventListener(eventType, this._boundHandleEvent, opts);
        }
    }

    /**
     * Détache les événements du ripple
     */
    detach(): void {
        for (const eventType of EVENTS) {
            const opts = PASSIVE_EVENTS.has(eventType) ? ({ passive: true } as EventListenerOptions) : undefined;
            this._element.removeEventListener(eventType, this._boundHandleEvent, opts);
        }

        // Annuler l'animation en cours
        if (this._growAnimation) {
            this._growAnimation.cancel();
            this._growAnimation = undefined;
        }

        this.endPressAnimation();
    }

    /**
     * Active ou désactive le ripple
     * @param disabled - État désactivé
     */
    setDisabled(disabled: boolean): void {
        this._disabled = disabled;

        if (disabled) {
            this._hovered = false;
            this._pressed = false;
            this.updateSurfaceClasses();
            this.detach();
        } else {
            this.attach();
        }
    }

    /**
     * Gère tous les événements
     * @param event - Événement à traiter
     */
    private handleEvent(event: Event): void {
        // Ignorer les événements en mode High Contrast
        if (this._forcedColorsMedia?.matches) {
            return;
        }

        switch (event.type) {
            case 'click':
                this.handleClick(event as MouseEvent);
                break;
            case 'contextmenu':
                this.handleContextmenu(event as MouseEvent);
                break;
            case 'pointercancel':
                this.handlePointercancel(event as PointerEvent);
                break;
            case 'pointerdown':
                this.handlePointerdown(event as PointerEvent);
                break;
            case 'pointerenter':
                this.handlePointerenter(event as PointerEvent);
                break;
            case 'pointerleave':
                this.handlePointerleave(event as PointerEvent);
                break;
            case 'pointerup':
                this.handlePointerup(event as PointerEvent);
                break;
        }
    }

    /**
     * Gère l'entrée du pointeur
     * @param event - Événement pointer
     */
    private handlePointerenter(event: PointerEvent): void {
        if (!this.shouldReactToEvent(event)) {
            return;
        }

        this._hovered = true;
        this.updateSurfaceClasses();
    }

    /**
     * Gère la sortie du pointeur
     * @param event - Événement pointer
     */
    private handlePointerleave(event: PointerEvent): void {
        if (!this.shouldReactToEvent(event)) {
            return;
        }

        this._hovered = false;
        this.updateSurfaceClasses();

        // Libérer un press tenu si la souris sort de l'élément
        if (this._state !== RippleState.INACTIVE) {
            this.endPressAnimation();
        }
    }

    /**
     * Gère le relâchement du pointeur
     * @param event - Événement pointer
     */
    private handlePointerup(event: PointerEvent): void {
        if (!this.shouldReactToEvent(event)) {
            return;
        }

        if (this._state === RippleState.HOLDING) {
            this._state = RippleState.WAITING_FOR_CLICK;
            return;
        }

        if (this._state === RippleState.TOUCH_DELAY) {
            this._state = RippleState.WAITING_FOR_CLICK;
            if (this._rippleStartEvent) {
                this.startPressAnimation(this._rippleStartEvent);
            }
            return;
        }
    }

    /**
     * Gère l'appui du pointeur
     * @param event - Événement pointer
     */
    private async handlePointerdown(event: PointerEvent): Promise<void> {
        if (!this.shouldReactToEvent(event)) {
            return;
        }

        this._rippleStartEvent = event;

        if (!this.isTouch(event)) {
            this._state = RippleState.WAITING_FOR_CLICK;
            this.startPressAnimation(event);
            return;
        }

        // Après un contextmenu longpress, un pointerdown supplémentaire peut être
        // envoyé à l'élément pressé. Vérifier que le down est dans les limites.
        if (this._checkBoundsAfterContextMenu && !this.inBounds(event)) {
            return;
        }

        this._checkBoundsAfterContextMenu = false;

        // Attendre un hold après le délai touch
        this._state = RippleState.TOUCH_DELAY;

        await new Promise<void>((resolve) => {
            setTimeout(resolve, TOUCH_DELAY_MS);
        });

        if (this._state !== RippleState.TOUCH_DELAY) {
            return;
        }

        this._state = RippleState.HOLDING;
        this.startPressAnimation(event);
    }

    /**
     * Gère le clic
     * @param event - Événement clic
     */
    private handleClick(event: MouseEvent): void {
        if (this._disabled) {
            return;
        }

        if (this._state === RippleState.WAITING_FOR_CLICK) {
            this.endPressAnimation();
            return;
        }

        if (this._state === RippleState.INACTIVE) {
            // Clic synthétisé par le clavier
            this.startPressAnimation();
            this.endPressAnimation();
        }
    }

    /**
     * Gère l'annulation du pointeur
     * @param event - Événement pointer
     */
    private handlePointercancel(event: PointerEvent): void {
        if (!this.shouldReactToEvent(event)) {
            return;
        }

        this.endPressAnimation();
    }

    /**
     * Gère le menu contextuel
     * @param event - Événement context menu
     */
    private handleContextmenu(event: MouseEvent): void {
        if (this._disabled) {
            return;
        }

        this._checkBoundsAfterContextMenu = true;
        this.endPressAnimation();
    }

    /**
     * Détermine la taille du ripple
     */
    private determineRippleSize(): void {
        const { height, width } = this._element.getBoundingClientRect();
        const maxDim = Math.max(height, width);
        const softEdgeSize = Math.max(
            SOFT_EDGE_CONTAINER_RATIO * maxDim,
            SOFT_EDGE_MINIMUM_SIZE
        );
        const initialSize = Math.floor(maxDim * INITIAL_ORIGIN_SCALE);
        const hypotenuse = Math.sqrt(width ** 2 + height ** 2);
        const maxRadius = hypotenuse + PADDING;

        this._initialSize = initialSize;
        this._rippleScale = `${(maxRadius + softEdgeSize) / initialSize}`;
        this._rippleSize = `${initialSize}px`;
    }

    /**
     * Obtient les coordonnées normalisées du pointeur
     * @param pointerEvent - Événement pointer
     * @returns Coordonnées normalisées
     */
    private getNormalizedPointerEventCoords(pointerEvent: PointerEvent): { x: number; y: number } {
        const { scrollX, scrollY } = window;
        const { left, top } = this._element.getBoundingClientRect();
        const documentX = scrollX + left;
        const documentY = scrollY + top;
        const { pageX, pageY } = pointerEvent;

        return {
            x: pageX - documentX,
            y: pageY - documentY,
        };
    }

    /**
     * Obtient les coordonnées de translation
     * @param positionEvent - Événement de position (optionnel)
     * @returns Coordonnées de début et de fin
     */
    private getTranslationCoordinates(
        positionEvent?: PointerEvent
    ): { startPoint: { x: number; y: number }; endPoint: { x: number; y: number } } {
        const { height, width } = this._element.getBoundingClientRect();

        // Finir au centre
        const endPoint = {
            x: (width - this._initialSize) / 2,
            y: (height - this._initialSize) / 2,
        };

        let startPoint: { x: number; y: number };

        if (positionEvent instanceof PointerEvent) {
            startPoint = this.getNormalizedPointerEventCoords(positionEvent);
        } else {
            startPoint = {
                x: width / 2,
                y: height / 2,
            };
        }

        // Centrer autour du point de départ
        startPoint = {
            x: startPoint.x - this._initialSize / 2,
            y: startPoint.y - this._initialSize / 2,
        };

        return { startPoint, endPoint };
    }

    /**
     * Démarre l'animation de press
     * @param positionEvent - Événement de position (optionnel)
     */
    private startPressAnimation(positionEvent?: PointerEvent): void {
        if (!this._pressedLayer) {
            return;
        }

        this._pressed = true;
        this.updateSurfaceClasses();

        this._growAnimation?.cancel();
        this.determineRippleSize();

        const { startPoint, endPoint } = this.getTranslationCoordinates(positionEvent);
        const translateStart = `${startPoint.x}px, ${startPoint.y}px`;
        const translateEnd = `${endPoint.x}px, ${endPoint.y}px`;

        // Réinitialiser la position et la taille
        this._pressedLayer.style.width = this._rippleSize;
        this._pressedLayer.style.height = this._rippleSize;
        this._pressedLayer.style.left = '0';
        this._pressedLayer.style.top = '0';
        this._pressedLayer.style.transform = `translate(${translateStart}) scale(1)`;

        // Animer la croissance
        this._growAnimation = this._pressedLayer.animate(
            {
                transform: [
                    `translate(${translateStart}) scale(1)`,
                    `translate(${translateEnd}) scale(${this._rippleScale})`,
                ],
            },
            {
                duration: PRESS_GROW_MS,
                easing: EASING.standard,
                fill: ANIMATION_FILL,
            }
        );
    }

    /**
     * Termine l'animation de press
     */
    private async endPressAnimation(): Promise<void> {
        this._rippleStartEvent = undefined;
        this._state = RippleState.INACTIVE;

        const animation = this._growAnimation;
        let pressAnimationPlayState = Infinity;

        if (typeof animation?.currentTime === 'number') {
            pressAnimationPlayState = animation.currentTime;
        } else if (animation?.currentTime) {
            // Gestion pour AnimationTimeline
            const timelineTime = animation.currentTime as { to?: (unit: string) => { value?: number } };
            pressAnimationPlayState = timelineTime.to?.('ms')?.value ?? Infinity;
        }

        if (pressAnimationPlayState >= MINIMUM_PRESS_MS) {
            this._pressed = false;
            this.updateSurfaceClasses();
            return;
        }

        await new Promise<void>((resolve) => {
            setTimeout(resolve, MINIMUM_PRESS_MS - pressAnimationPlayState);
        });

        if (this._growAnimation !== animation) {
            // Une nouvelle animation de press a été démarrée
            return;
        }

        this._pressed = false;
        this.updateSurfaceClasses();
    }

    /**
     * Vérifie si l'événement doit être traité
     * @param event - Événement pointer
     * @returns true si l'événement doit être traité
     */
    private shouldReactToEvent(event: PointerEvent): boolean {
        if (this._disabled || !event.isPrimary) {
            return false;
        }

        if (this._rippleStartEvent && this._rippleStartEvent.pointerId !== event.pointerId) {
            return false;
        }

        if (event.type === 'pointerenter' || event.type === 'pointerleave') {
            return !this.isTouch(event);
        }

        const isPrimaryButton = event.buttons === 1;
        return this.isTouch(event) || isPrimaryButton;
    }

    /**
     * Vérifie si l'événement est dans les limites de l'élément
     * @param event - Événement pointer
     * @returns true si dans les limites
     */
    private inBounds(event: PointerEvent): boolean {
        const { top, left, bottom, right } = this._element.getBoundingClientRect();
        return event.x >= left && event.x <= right && event.y >= top && event.y <= bottom;
    }

    /**
     * Vérifie si l'événement est un touch
     * @param event - Événement pointer
     * @returns true si c'est un touch
     */
    private isTouch(event: PointerEvent): boolean {
        return event.pointerType === 'touch';
    }

    /**
     * Nettoie les ressources
     */
    destroy(): void {
        this.detach();
        this._surfaceElement?.remove();
        this._surfaceElement = undefined;
    }
}

/**
 * Fonction utilitaire pour créer et attacher un ripple
 * @param element - Élément auquel attacher le ripple
 * @param options - Options de configuration
 * @returns Instance du ripple
 */
export function createRipple(element: HTMLElement, options?: RippleOptions): Ripple {
    const ripple = new Ripple(element, options);
    ripple.attach();
    return ripple;
}

/**
 * Fonction utilitaire pour initialiser les ripples automatiquement
 * sur les éléments avec la classe `.ripple`
 */
export function initRipples(): void {
    if (typeof document === 'undefined') {
        return;
    }

    const init = (): void => {
        const elements = document.querySelectorAll<HTMLElement>('.ripple:not([data-ripple-initialized])');

        elements.forEach((element) => {
            element.setAttribute('data-ripple-initialized', 'true');
            const ripple = createRipple(element);
            (element as HTMLElement & { K_Ripple?: Ripple }).K_Ripple = ripple;
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
}

/**
 * Objet ripple avec les méthodes utilitaires
 * Compatible avec l'ancien API waves pour migration
 */
export const ripple = {
    create: createRipple,
    init: initRipples,
    Ripple,
};

