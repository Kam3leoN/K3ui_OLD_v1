/**
 * Helpers legacy pour propriétés `K_*` sur le DOM (LOT 5).
 * @deprecated Préférer `Component.getInstance(el)` ou `Foo.getInstance(el)` (LOT 6).
 */
import { ComponentRegistry } from '../../src/core/registries/ComponentRegistry';
import type { K3UIElement } from '../../src/types/base/element';

/** Cast HTMLElement → K3UIElement (propriétés `K_*`). */
export function asK3Element(el: HTMLElement | Element): K3UIElement {
    return el as HTMLElement as K3UIElement;
}

/**
 * Lit une instance composant : propriété `K_*` sur l’élément si présente,
 * sinon `ComponentRegistry` (pattern V5).
 * @param el - Élément DOM
 * @param key - Clé d’instance attendue (ex. `K_Switch`) — utilisée pour le DOM legacy
 */
export function getKInstance<T = unknown>(el: HTMLElement | Element, key: `K_${string}`): T | undefined {
    const domValue = asK3Element(el)[key];
    if (domValue !== undefined) {
        return domValue as T;
    }
    const fromRegistry = ComponentRegistry.getComponentInstance(el as HTMLElement);
    return fromRegistry ? (fromRegistry as T) : undefined;
}
