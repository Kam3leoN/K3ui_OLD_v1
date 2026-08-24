/**
 * @fileoverview Gestionnaire centralisé d'événements pour K3UI
 * @description Permet de gérer proprement l'ajout/suppression d'événements avec cleanup automatique
 * @author K3UI Team
 * @version 1.0.0
 */

// Modification ici : Comme ils sont dans le même dossier, on utilise ./
import { LoggerManager } from './LoggerManager';
import type { DOMEventCallback } from '../../types/base/dom';

// ============================================================================
// CONSTANTES
// ============================================================================

/** Logger pour le module eventListener */
const logger = LoggerManager.create('[EventListenerManager]');

/** Entrée trackée : listener + options (capture/passive) pour un removeEventListener correct */
interface TrackedListenerEntry {
    listener: DOMEventCallback;
    options?: boolean | AddEventListenerOptions;
}

// ============================================================================
// CLASSE EVENTLISTENERMANAGER
// ============================================================================

/**
 * Gestionnaire centralisé d'événements pour K3UI
 * @description Permet de gérer proprement l'ajout/suppression d'événements avec tracking automatique
 * pour éviter les fuites mémoire et assurer un cleanup complet
 * @class EventListenerManager
 */
export class EventListenerManager {
    /** Map des listeners par target et par événement (avec options pour le remove) */
    private listeners: Map<EventTarget, Map<string, Map<DOMEventCallback, TrackedListenerEntry>>> = new Map();

    /**
     * Ajoute un écouteur d'événement avec tracking
     * @param target - Cible de l'événement (window, document, élément DOM, etc.)
     * @param event - Nom de l'événement
     * @param listener - Fonction de callback
     * @param options - Options d'écoute (capture, passive, once, etc.)
     * @returns Fonction de cleanup pour supprimer l'écouteur
     */
    add(
        target: EventTarget,
        event: string,
        listener: DOMEventCallback,
        options?: boolean | AddEventListenerOptions
    ): () => void {
        if (!this.listeners.has(target)) {
            this.listeners.set(target, new Map());
        }

        const targetListeners = this.listeners.get(target)!;
        if (!targetListeners.has(event)) {
            targetListeners.set(event, new Map());
        }

        const eventListeners = targetListeners.get(event)!;

        // Vérifier si le listener existe déjà pour éviter les doublons
        if (eventListeners.has(listener)) {
            logger.warn(`Listener déjà enregistré pour l'événement "${event}" sur le target`, target);
            // Retourner quand même une fonction de cleanup
            return () => this.remove(target, event, listener);
        }

        eventListeners.set(listener, { listener, options });
        target.addEventListener(event, listener as EventListener, options);

        // Retourner une fonction de cleanup
        return () => this.remove(target, event, listener);
    }

    /**
     * Supprime un écouteur d'événement
     * @param target - Cible de l'événement
     * @param event - Nom de l'événement
     * @param listener - Fonction de callback à supprimer
     */
    remove(target: EventTarget, event: string, listener: DOMEventCallback): void {
        const targetListeners = this.listeners.get(target);
        if (!targetListeners) {
            return;
        }

        const eventListeners = targetListeners.get(event);
        if (!eventListeners) {
            return;
        }

        const entry = eventListeners.get(listener);
        if (entry) {
            eventListeners.delete(listener);
            target.removeEventListener(event, listener as EventListener, entry.options as EventListenerOptions | boolean | undefined);

            // Nettoyer les structures vides
            if (eventListeners.size === 0) {
                targetListeners.delete(event);
            }

            if (targetListeners.size === 0) {
                this.listeners.delete(target);
            }
        }
    }

    /**
     * Supprime tous les écouteurs pour un target spécifique
     * @param target - Cible de l'événement
     */
    removeAll(target: EventTarget): void {
        const targetListeners = this.listeners.get(target);
        if (!targetListeners) {
            return;
        }

        targetListeners.forEach((listeners, event) => {
            listeners.forEach((entry) => {
                target.removeEventListener(
                    event,
                    entry.listener as EventListener,
                    entry.options as EventListenerOptions | boolean | undefined
                );
            });
        });

        this.listeners.delete(target);
    }

    /**
     * Supprime tous les écouteurs pour un événement spécifique sur un target
     * @param target - Cible de l'événement
     * @param event - Nom de l'événement
     */
    removeAllForEvent(target: EventTarget, event: string): void {
        const targetListeners = this.listeners.get(target);
        if (!targetListeners) {
            return;
        }

        const eventListeners = targetListeners.get(event);
        if (!eventListeners) {
            return;
        }

        eventListeners.forEach((entry) => {
            target.removeEventListener(
                event,
                entry.listener as EventListener,
                entry.options as EventListenerOptions | boolean | undefined
            );
        });

        targetListeners.delete(event);

        if (targetListeners.size === 0) {
            this.listeners.delete(target);
        }
    }

    /**
     * Supprime tous les écouteurs enregistrés
     * @description Nettoie complètement tous les écouteurs pour éviter les fuites mémoire
     */
    destroy(): void {
        this.listeners.forEach((_targetListeners, target) => {
            this.removeAll(target);
        });
    }

    /**
     * Vérifie si un écouteur est enregistré
     * @param target - Cible de l'événement
     * @param event - Nom de l'événement
     * @param listener - Fonction de callback
     * @returns true si l'écouteur est enregistré
     */
    has(target: EventTarget, event: string, listener: DOMEventCallback): boolean {
        const targetListeners = this.listeners.get(target);
        if (!targetListeners) {
            return false;
        }

        const eventListeners = targetListeners.get(event);
        if (!eventListeners) {
            return false;
        }

        return eventListeners.has(listener);
    }

    /**
     * Retourne le nombre d'écouteurs enregistrés pour un target
     * @param target - Cible de l'événement
     * @returns Nombre d'écouteurs enregistrés
     */
    count(target: EventTarget): number {
        const targetListeners = this.listeners.get(target);
        if (!targetListeners) {
            return 0;
        }

        let total = 0;
        targetListeners.forEach(listeners => {
            total += listeners.size;
        });

        return total;
    }
}

// ============================================================================
// INSTANCE GLOBALE
// ============================================================================

/** Instance globale du gestionnaire d'événements */
export const eventListenerManager = new EventListenerManager();
