/**
 * @fileoverview Utilitaire FocusRing pour K3UI
 * @description Gère l'affichage animé d'un anneau de focus pour l'accessibilité clavier
 * @author K3UI Team
 * @version 1.0.0
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Options pour le FocusRing
 */
export interface FocusRingOptions {
    /** Mode d'animation : 'outward' (par défaut) ou 'inward' */
    inward?: boolean;
    /** Élément de contrôle auquel s'attacher */
    control?: HTMLElement | null;
    /** ID de l'élément pour htmlFor */
    htmlFor?: string | null;
}

/**
 * Classe utilitaire pour gérer les focus rings
 * @description Crée et gère un élément DOM qui affiche un anneau de focus animé
 * autour d'un élément de contrôle, uniquement lors de la navigation clavier
 */
export class FocusRing {
    /** Élément DOM du focus ring */
    private ringElement: HTMLElement | null = null;
    /** Élément de contrôle auquel le ring est attaché */
    private controlElement: HTMLElement | null = null;
    /** Options de configuration */
    private options: FocusRingOptions;
    /** Symbol pour marquer les événements traités */
    private static readonly HANDLED_SYMBOL = Symbol('handledByFocusRing');
    /** Événements écoutés */
    private static readonly EVENTS = ['focusin', 'focusout', 'pointerdown'] as const;

    /**
     * Constructeur
     * @param options Options de configuration
     */
    constructor(options: FocusRingOptions = {}) {
        this.options = {
            inward: false,
            control: null,
            htmlFor: null,
            ...options
        };

        this.init();
    }

    /**
     * Initialise le focus ring
     */
    private init(): void {
        // Créer l'élément DOM du focus ring
        this.ringElement = document.createElement('k3ui-focus-ring');
        this.ringElement.setAttribute('aria-hidden', 'true');

        // Appliquer le mode inward si spécifié
        if (this.options.inward) {
            this.ringElement.setAttribute('inward', '');
        }

        // Attacher au contrôle si fourni
        if (this.options.control) {
            this.attach(this.options.control);
        } else if (this.options.htmlFor) {
            const control = document.getElementById(this.options.htmlFor);
            if (control) {
                this.attach(control);
            }
        }
    }

    /**
     * Attache le focus ring à un élément de contrôle
     * @param control Élément de contrôle
     */
    attach(control: HTMLElement): void {
        // Détacher l'ancien contrôle si présent
        this.detach();

        this.controlElement = control;

        // Positionner le ring element par rapport au contrôle
        // Utiliser le parent ou créer un wrapper si nécessaire
        let container: HTMLElement = control.parentElement || document.body;

        // S'assurer que le container a une position relative
        const computedStyle = window.getComputedStyle(container);
        if (computedStyle.position === 'static') {
            container.style.position = 'relative';
        }

        // Insérer le ring element dans le container
        container.insertBefore(this.ringElement!, control.nextSibling);

        // Positionner le ring pour qu'il entoure le contrôle
        this.updatePosition();

        // Ajouter les listeners d'événements
        this.addEventListeners();

        // Vérifier l'état initial du focus
        this.updateVisibility();
    }

    /**
     * Détache le focus ring de l'élément de contrôle
     */
    detach(): void {
        if (this.controlElement) {
            // Retirer les listeners
            this.removeEventListeners();
            this.controlElement = null;
        }

        // Retirer l'élément du DOM
        if (this.ringElement && this.ringElement.parentElement) {
            this.ringElement.parentElement.removeChild(this.ringElement);
        }
    }

    /**
     * Met à jour la position du focus ring
     */
    private updatePosition(): void {
        if (!this.ringElement || !this.controlElement) {
            return;
        }

        const controlRect = this.controlElement.getBoundingClientRect();
        const container = this.ringElement.parentElement;
        if (!container) {
            return;
        }

        const containerRect = container.getBoundingClientRect();

        // Calculer la position relative au container
        const scrollX = container.scrollLeft || 0;
        const scrollY = container.scrollTop || 0;

        // Positionner en absolu par rapport au container
        this.ringElement.style.position = 'absolute';
        this.ringElement.style.top = `${controlRect.top - containerRect.top + scrollY}px`;
        this.ringElement.style.left = `${controlRect.left - containerRect.left + scrollX}px`;
        this.ringElement.style.width = `${controlRect.width}px`;
        this.ringElement.style.height = `${controlRect.height}px`;
    }

    /**
     * Ajoute les listeners d'événements
     */
    private addEventListeners(): void {
        if (!this.controlElement) {
            return;
        }

        FocusRing.EVENTS.forEach(eventType => {
            this.controlElement!.addEventListener(eventType, this.handleEvent as EventListener, true);
        });

        // Écouter le redimensionnement pour mettre à jour la position
        window.addEventListener('resize', this.handleResize);
    }

    /**
     * Retire les listeners d'événements
     */
    private removeEventListeners(): void {
        if (!this.controlElement) {
            return;
        }

        FocusRing.EVENTS.forEach(eventType => {
            this.controlElement!.removeEventListener(eventType, this.handleEvent as EventListener, true);
        });

        window.removeEventListener('resize', this.handleResize);
    }

    /**
     * Gère les événements de focus
     * @param event Événement reçu
     */
    private handleEvent = (event: Event): void => {
        // Éviter les événements déjà traités par d'autres focus rings
        const handledEvent = event as Event & { [FocusRing.HANDLED_SYMBOL]?: boolean };
        if (handledEvent[FocusRing.HANDLED_SYMBOL]) {
            return;
        }

        handledEvent[FocusRing.HANDLED_SYMBOL] = true;

        if (!this.controlElement || !this.ringElement) {
            return;
        }

        switch (event.type) {
            case 'focusin':
                // Afficher uniquement si :focus-visible
                const isFocusVisible = this.controlElement.matches(':focus-visible');
                this.setVisible(isFocusVisible);
                break;

            case 'focusout':
            case 'pointerdown':
                // Masquer lors de la perte de focus ou d'un clic
                this.setVisible(false);
                break;
        }
    };

    /**
     * Gère le redimensionnement de la fenêtre
     */
    private handleResize = (): void => {
        this.updatePosition();
    };

    /**
     * Met à jour la visibilité du focus ring
     */
    private updateVisibility(): void {
        if (!this.controlElement) {
            return;
        }

        const isFocusVisible = this.controlElement.matches(':focus-visible');
        this.setVisible(isFocusVisible);
    }

    /**
     * Affiche ou masque le focus ring
     * @param visible État de visibilité
     */
    private setVisible(visible: boolean): void {
        if (!this.ringElement) {
            return;
        }

        if (visible) {
            this.ringElement.setAttribute('visible', '');
            // Mettre à jour la position avant d'afficher
            this.updatePosition();
        } else {
            this.ringElement.removeAttribute('visible');
        }
    }

    /**
     * Définit le mode inward
     * @param inward Mode inward (true) ou outward (false)
     */
    setInward(inward: boolean): void {
        this.options.inward = inward;
        if (this.ringElement) {
            if (inward) {
                this.ringElement.setAttribute('inward', '');
            } else {
                this.ringElement.removeAttribute('inward');
            }
        }
    }

    /**
     * Récupère l'élément de contrôle actuel
     * @returns Élément de contrôle ou null
     */
    get control(): HTMLElement | null {
        return this.controlElement;
    }

    /**
     * Nettoie les ressources
     */
    destroy(): void {
        this.detach();
        this.ringElement = null;
    }

    // ============================================================================
    // MÉTHODES STATIQUES
    // ============================================================================

    /**
     * Crée et attache un focus ring à un élément
     * @param control Élément de contrôle
     * @param options Options de configuration
     * @returns Instance du FocusRing
     */
    static attach(control: HTMLElement, options: Omit<FocusRingOptions, 'control' | 'htmlFor'> = {}): FocusRing {
        const focusRing = new FocusRing({ ...options, control });
        return focusRing;
    }

    /**
     * Crée un focus ring avec un htmlFor
     * @param htmlFor ID de l'élément cible
     * @param options Options de configuration
     * @returns Instance du FocusRing ou null si l'élément n'existe pas
     */
    static attachFor(htmlFor: string, options: Omit<FocusRingOptions, 'control' | 'htmlFor'> = {}): FocusRing | null {
        const control = document.getElementById(htmlFor);
        if (!control) {
            return null;
        }
        return new FocusRing({ ...options, control });
    }
}

