/**
 * @fileoverview Types pour les éléments HTML K3UI
 * @description Types et interfaces pour la manipulation des éléments DOM
 * @author K3UI Team
 * @version 0.1.0
 */

/**
 * Type pour les éléments HTML K3UI
 * @description Union type pour les éléments HTML supportés par K3UI
 */
export type KElement = HTMLElement | Element;

/**
 * Type pour les collections d'éléments
 * @description Union type pour les collections d'éléments HTML
 */
export type InitElements<T extends KElement> = NodeListOf<T> | HTMLCollectionOf<T>;

/**
 * Type pour les sélecteurs CSS
 * @description Type pour les sélecteurs CSS valides
 */
export type CSSSelector = string;

/**
 * Type pour les éléments HTML ou sélecteurs
 * @description Union type pour les éléments HTML ou les sélecteurs CSS
 */
export type ElementOrSelector = HTMLElement | CSSSelector;

/**
 * Interface pour les éléments avec propriétés K3UI
 * @description Interface pour les éléments qui ont des propriétés K3UI attachées
 */
export interface K3UIElement extends HTMLElement {
    [key: `K_${string}`]: unknown;
}

/**
 * Type pour les événements DOM
 * @description Union type pour les événements DOM supportés
 */
export type DOMEvent = Event | MouseEvent | KeyboardEvent | FocusEvent | TouchEvent;

/**
 * Type pour les gestionnaires d'événements
 * @description Type pour les fonctions de gestion d'événements
 */
export type EventHandler<T extends DOMEvent = Event> = (event: T) => void;

/**
 * Interface pour les éléments avec gestion d'événements
 * @description Interface pour les éléments qui gèrent des événements
 */
export interface EventTargetElement extends HTMLElement {
    addEventListener(type: string, listener: EventHandler, options?: boolean | AddEventListenerOptions): void;
    removeEventListener(type: string, listener: EventHandler, options?: boolean | EventListenerOptions): void;
}
