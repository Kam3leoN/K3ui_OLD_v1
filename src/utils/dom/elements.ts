/**
 * @fileoverview Module de création d'éléments DOM pour K3UI
 * @description Fonctions utilitaires pour créer et manipuler des éléments DOM
 * @author K3UI Team
 * @version 1.0.0
 */

import { copyToClipboard } from '../helpers';

// ============================================================================
// CLASSE ELEMENTS
// ============================================================================

/**
 * Gestionnaire de création et manipulation d'éléments DOM
 */
export class Elements {
    /**
     * Crée un conteneur de confirmation
     * @param message - Message à afficher
     * @param confirmText - Texte du bouton de confirmation
     * @param cancelText - Texte du bouton d'annulation
     * @returns Conteneur de confirmation
     */
    static createConfirmationContainer(
        message: string,
        confirmText: string = 'Confirmer',
        cancelText: string = 'Annuler'
    ): HTMLElement {
        const container = document.createElement('div');
        container.className = 'confirmation-container';

        const messageEl = document.createElement('div');
        messageEl.className = 'confirmation-message';
        messageEl.textContent = message;

        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'confirmation-buttons';

        this.createButton(buttonsContainer, confirmText, ['confirmation-confirm']);
        this.createButton(buttonsContainer, cancelText, ['confirmation-cancel']);

        container.appendChild(messageEl);
        container.appendChild(buttonsContainer);

        return container;
    }

    /**
     * Crée un conteneur de confirmation avec callbacks (version legacy)
     * @param container - Conteneur parent
     * @param confirmText - Texte du bouton de confirmation
     * @param cancelText - Texte du bouton d'annulation
     * @param onConfirm - Callback de confirmation
     * @param onCancel - Callback d'annulation
     */
    static createConfirmationContainerWithCallbacks(
        container: HTMLElement,
        confirmText: string,
        cancelText: string,
        onConfirm: (event: Event) => void,
        onCancel: (event: Event) => void
    ): void {
        const confirmationButtonsContainer = document.createElement('div');
        confirmationButtonsContainer.classList.add('confirmation-btns');
        container.appendChild(confirmationButtonsContainer);

        this.createButton(confirmationButtonsContainer, cancelText, ['btn-cancel'], true, onCancel);
        this.createButton(confirmationButtonsContainer, confirmText, ['btn-confirm'], true, onConfirm);
    }

    /**
     * Crée un bouton avec gestion d'événements et styles
     * @param container - Conteneur parent
     * @param text - Texte du bouton
     * @param className - Classes CSS du bouton (array)
     * @param visibility - Visibilité du bouton
     * @param callback - Fonction de callback
     */
    static createButton(
        container: HTMLElement,
        text: string,
        className: string[] = [],
        visibility: boolean = true,
        callback?: (event: Event) => void
    ): HTMLButtonElement {
        // Classes par défaut
        const defaultClasses = ['btn', 'ripple', 'text'];
        const allClasses = [...defaultClasses, ...className];

        const button = document.createElement('button');
        button.className = allClasses.join(' ');
        button.style.visibility = visibility ? 'visible' : 'hidden';
        button.type = 'button';
        button.tabIndex = visibility ? 0 : -1;
        button.textContent = text;

        // Ajouter le callback si fourni
        if (callback) {
            button.addEventListener('click', callback);
            button.addEventListener('keypress', (e: KeyboardEvent) => {
                if (e.key === 'Enter') {
                    callback(e);
                }
            });
        }

        container.appendChild(button);
        return button;
    }

    /**
     * Crée un bouton simple (version simplifiée)
     * @param text - Texte du bouton
     * @param className - Classe CSS du bouton
     * @param type - Type du bouton
     * @returns Élément bouton
     */
    static createSimpleButton(
        text: string,
        className: string = 'btn',
        type: 'button' | 'submit' | 'reset' = 'button'
    ): HTMLButtonElement {
        const button = document.createElement('button');
        button.type = type;
        button.className = className;
        button.textContent = text;

        return button;
    }

    /**
     * Crée un bouton de copie pour les blocs de code
     * @param container - Conteneur du code
     * @param buttonText - Texte du bouton
     * @param buttonClass - Classe CSS du bouton
     * @returns Bouton de copie
     */
    static createCopyButton(
        container: HTMLElement,
        buttonText: string = 'Copier',
        buttonClass: string = 'code-copy-button'
    ): HTMLButtonElement {
        const button = document.createElement('button');
        button.className = buttonClass;
        button.textContent = buttonText;
        button.setAttribute('aria-label', 'Copier le code');

        button.addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();

            const originalText = button.textContent;
            button.textContent = 'Copié !';
            button.disabled = true;

            try {
                await copyToClipboard(container.textContent || '');

                // Restaurer le bouton après un délai
                setTimeout(() => {
                    button.textContent = originalText;
                    button.disabled = false;
                }, 2000);
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : String(error);
                console.error(`[Elements] Erreur lors de la copie: ${message}`);
                button.textContent = 'Erreur';

                setTimeout(() => {
                    button.textContent = originalText;
                    button.disabled = false;
                }, 2000);
            }
        });

        return button;
    }

    /**
     * Initialise les boutons de copie pour tous les blocs de code
     * @param selector - Sélecteur CSS pour les blocs de code
     */
    static initCopyButtons(selector: string = 'pre[class*="language-"], .code-container'): void {
        const blocks = document.querySelectorAll(selector);

        blocks.forEach((block) => {
            // Éviter d'ajouter plusieurs boutons
            if (block.querySelector('.code-copy-button')) {
                return;
            }

            // Créer le conteneur si nécessaire
            let container = block as HTMLElement;
            if (!block.classList.contains('code-container')) {
                const wrapper = document.createElement('div');
                wrapper.className = 'code-container';
                block.parentNode?.insertBefore(wrapper, block);
                wrapper.appendChild(block);
                container = wrapper;
            }

            // Ajouter le bouton de copie
            const copyButton = this.createCopyButton(container);
            container.appendChild(copyButton);
        });
    }

    /**
     * Crée un élément avec des classes CSS
     * @param tagName - Nom de la balise HTML
     * @param className - Classes CSS à appliquer
     * @param textContent - Contenu texte (optionnel)
     * @returns Élément créé
     */
    static createElement(
        tagName: string,
        className?: string,
        textContent?: string
    ): HTMLElement {
        const element = document.createElement(tagName);

        if (className) {
            element.className = className;
        }

        if (textContent) {
            element.textContent = textContent;
        }

        return element;
    }

    /**
     * Crée un élément avec des attributs
     * @param tagName - Nom de la balise HTML
     * @param attributes - Attributs à appliquer
     * @returns Élément créé
     */
    static createElementWithAttributes(
        tagName: string,
        attributes: Record<string, string>
    ): HTMLElement {
        const element = document.createElement(tagName);

        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });

        return element;
    }

    /**
     * Ajoute des classes CSS à un élément
     * @param element - Élément cible
     * @param classes - Classes à ajouter
     */
    static addClasses(element: HTMLElement, ...classes: string[]): void {
        element.classList.add(...classes);
    }

    /**
     * Supprime des classes CSS d'un élément
     * @param element - Élément cible
     * @param classes - Classes à supprimer
     */
    static removeClasses(element: HTMLElement, ...classes: string[]): void {
        element.classList.remove(...classes);
    }

    /**
     * Toggle des classes CSS sur un élément
     * @param element - Élément cible
     * @param classes - Classes à toggle
     * @param force - Forcer l'ajout (true) ou la suppression (false)
     */
    static toggleClasses(
        element: HTMLElement,
        classes: string[],
        force?: boolean
    ): void {
        classes.forEach(className => {
            element.classList.toggle(className, force);
        });
    }

    /**
     * Vérifie si un élément a une classe CSS
     * @param element - Élément cible
     * @param className - Classe à vérifier
     * @returns True si l'élément a la classe
     */
    static hasClass(element: HTMLElement, className: string): boolean {
        return element.classList.contains(className);
    }

    /**
     * Obtient les dimensions d'un élément
     * @param element - Élément cible
     * @returns Dimensions de l'élément
     */
    static getElementDimensions(element: HTMLElement): {
        width: number;
        height: number;
        top: number;
        left: number;
    } {
        const rect = element.getBoundingClientRect();
        return {
            width: rect.width,
            height: rect.height,
            top: rect.top,
            left: rect.left
        };
    }

    /**
     * Cache un élément
     * @param element - Élément à cacher
     */
    static hideElement(element: HTMLElement): void {
        element.style.display = 'none';
    }

    /**
     * Affiche un élément
     * @param element - Élément à afficher
     * @param display - Valeur de display (défaut: 'block')
     */
    static showElement(element: HTMLElement, display: string = 'block'): void {
        element.style.display = display;
    }

    /**
     * Vérifie si un élément est visible
     * @param element - Élément à vérifier
     * @returns True si l'élément est visible
     */
    static isElementVisible(element: HTMLElement): boolean {
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    }

    /**
     * Vérifie si un élément est géré par le positionnement (floating)
     * @description Vérifie si un élément a une instance de positionnement attachée
     * @param element - Élément à vérifier
     * @returns True si l'élément est géré par le positionnement
     */
    static isPopperManaged(element: HTMLElement): boolean {
        const host = element as HTMLElement & {
            __popperInstance?: unknown;
            __k3uiPopperInstance?: unknown;
        };
        return host.__popperInstance != null || host.__k3uiPopperInstance != null;
    }

    /**
     * Récupère l'instance de positionnement d'un élément (si disponible)
     * @description Récupère l'instance de positionnement attachée à un élément
     * @param element - Élément à vérifier
     * @returns Instance de positionnement ou null
     */
    static getPopperInstance(element: HTMLElement): unknown {
        const host = element as HTMLElement & {
            __popperInstance?: unknown;
            __k3uiPopperInstance?: unknown;
        };
        return host.__popperInstance ?? host.__k3uiPopperInstance ?? null;
    }

    /**
     * Définit un style de manière sécurisée sans écraser les styles gérés par le positionnement
     * @description Définit un style CSS sur un élément en vérifiant si le positionnement gère déjà cette propriété.
     * Si le positionnement gère la propriété et que force n'est pas true, un avertissement est émis.
     * @param element - Élément cible
     * @param property - Propriété CSS à définir (camelCase ou kebab-case)
     * @param value - Valeur à définir
     * @param options - Options de configuration
     * @param options.force - Forcer la modification même si le positionnement gère la propriété
     * @param options.popperManaged - Liste des propriétés gérées par le positionnement (par défaut: position, top, left, transform)
     * @returns True si le style a été défini, false sinon
     */
    static setStyleSafe(
        element: HTMLElement,
        property: string,
        value: string,
        options?: {
            force?: boolean;
            popperManaged?: string[];
        }
    ): boolean {
        const popperManaged = options?.popperManaged || ['position', 'top', 'left', 'right', 'bottom', 'transform'];

        // Normaliser la propriété (kebab-case vers camelCase)
        const normalizedProperty = property.replace(/-([a-z])/g, (g) => g[1].toUpperCase());

        // Vérifier si le positionnement gère cette propriété
        if (popperManaged.includes(normalizedProperty) || popperManaged.includes(property)) {
            if (!options?.force && this.isPopperManaged(element)) {
                console.warn(
                    `[Elements] Tentative de définir ${property} sur un élément géré par le positionnement. ` +
                    `Utilisez force: true pour forcer la modification.`
                );
                return false;
            }
        }

        element.style.setProperty(property, value);
        return true;
    }
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Fonctions utilitaires pour compatibilité avec utils.ts
 */
export const elementsUtils = {
    createConfirmationContainer: Elements.createConfirmationContainer,
    createConfirmationContainerWithCallbacks: Elements.createConfirmationContainerWithCallbacks,
    createButton: Elements.createButton,
    createSimpleButton: Elements.createSimpleButton,
    createCopyButton: Elements.createCopyButton,
    initCopyButtons: Elements.initCopyButtons,
    createElement: Elements.createElement,
    createElementWithAttributes: Elements.createElementWithAttributes,
    addClasses: Elements.addClasses,
    removeClasses: Elements.removeClasses,
    toggleClasses: Elements.toggleClasses,
    hasClass: Elements.hasClass,
    getElementDimensions: Elements.getElementDimensions,
    hideElement: Elements.hideElement,
    showElement: Elements.showElement,
    isElementVisible: Elements.isElementVisible,
    isPopperManaged: Elements.isPopperManaged,
    getPopperInstance: Elements.getPopperInstance,
    setStyleSafe: Elements.setStyleSafe
};

/**
 * Crée un ResizeObserver avec optimisation requestAnimationFrame
 * 
 * ResizeObserver surveille les changements de taille d'un élément et appelle
 * la fonction de callback fournie. On l'enveloppe dans requestAnimationFrame
 * pour de meilleures performances.
 * 
 * @param target - L'élément DOM à observer pour les changements de taille
 * @param callback - Fonction à appeler quand un redimensionnement se produit
 * @returns L'instance ResizeObserver
 * @example
 * ```typescript
 * const observer = resizeObserver(myElement, (entry) => {
 *   console.log('Élément redimensionné:', entry.contentRect);
 * });
 * ```
 */
export function resizeObserver(
    target: Element,
    callback: (entry: ResizeObserverEntry) => void
): ResizeObserver {
    const observer = new ResizeObserver((entries: ResizeObserverEntry[]) => {
        // Utiliser requestAnimationFrame pour regrouper les mises à jour et améliorer les performances
        requestAnimationFrame(() => {
            if (!Array.isArray(entries) || !entries.length) {
                return;
            }
            // Appeler le callback avec la première entrée (on observe un seul élément)
            callback(entries[0]);
        });
    });

    // Commencer à observer l'élément cible
    observer.observe(target);

    return observer;
}

// ============================================================================
// HELPERS ENFANT (getOrCreateChild, queryOne)
// ============================================================================

/**
 * Retourne le premier élément correspondant au sélecteur dans le parent, ou null.
 * @param parent - Élément parent
 * @param selector - Sélecteur CSS
 * @returns Premier élément trouvé ou null
 */
export function queryOne(parent: HTMLElement, selector: string): HTMLElement | null {
    return parent.querySelector(selector) as HTMLElement | null;
}

/**
 * Retourne un enfant existant correspondant au sélecteur, ou crée un nouvel élément et l'ajoute au parent.
 * @param parent - Élément parent
 * @param selector - Sélecteur CSS pour trouver un enfant existant
 * @param tagName - Balise à créer si aucun enfant trouvé (défaut: 'div')
 * @returns L'élément existant ou le nouvel élément créé
 */
export function getOrCreateChild(parent: HTMLElement, selector: string, tagName: string = 'div'): HTMLElement {
    const existing = parent.querySelector(selector);
    if (existing && existing instanceof HTMLElement) {
        return existing;
    }
    const el = document.createElement(tagName);
    if (selector.startsWith('.') && !selector.includes(' ')) {
        el.className = selector.slice(1);
    } else if (selector.startsWith('#') && !selector.includes(' ')) {
        el.id = selector.slice(1);
    }
    parent.appendChild(el);
    return el;
}