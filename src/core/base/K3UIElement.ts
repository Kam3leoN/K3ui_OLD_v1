/**
 * @fileoverview Base Web Component K3UI — pont CE ↔ instance Component
 */

import type { BaseOptions } from '../../types/base';
import type { ComponentLifecycleChanges } from '../../types/base/lifecycle';
import { toComponentClassDef } from '../../types/components/component-base';
import { Component } from './Component';

/** Classe composant avec factory statique attendue par le bridge CE */
export interface K3UIComponentClass<O extends BaseOptions = BaseOptions> {
    new (el: HTMLElement, options: Partial<O>, classDef: unknown): Component<O>;
    getInstance(el: HTMLElement): Component<O> | null | undefined;
    init(
        els: HTMLElement | string,
        options?: Partial<O>,
    ): Component<O> | Component<O>[] | undefined;
    name?: string;
}

/** Élément exclu de l'AutoInit (aligné sur les sélecteurs `:not(.no-autoinit)`) */
function shouldSkipAutoMount(el: HTMLElement): boolean {
    return el.classList.contains('no-autoinit') || el.hasAttribute('data-no-auto-init');
}

/**
 * Monte l'instance composant depuis le connectedCallback du CE.
 * Les classes sans `static init` public (ex. AppBar) ne doivent pas appeler `Component.init` directement.
 */
function mountComponentInstance<O extends BaseOptions>(
    componentClass: K3UIComponentClass<O>,
    el: HTMLElement,
): void {
    if (componentClass.getInstance(el) || shouldSkipAutoMount(el)) {
        return;
    }

    if (componentClass.init !== Component.init) {
        componentClass.init(el);
        return;
    }

    new componentClass(el, {}, toComponentClassDef(componentClass));
}

/** Options pour createK3UIElementClass */
export interface K3UIElementOptions<O extends BaseOptions = BaseOptions> {
    /** Attributs observés (Web Components) */
    observedAttributes?: string[];
    /** Hook à la connexion DOM (classes CSS, etc.) */
    onConnected?: (el: HTMLElement) => void;
    /** Map attribut kebab-case → clé option + valeur typée */
    mapAttributeToOption?: (
        name: string,
        value: string | null,
    ) => Partial<O> | null;
    /** Logique custom si mapAttributeToOption ne suffit pas */
    onAttributeChanged?: (
        el: HTMLElement,
        name: string,
        oldValue: string | null,
        newValue: string | null,
        instance: Component<O>,
    ) => void;
}

/**
 * Crée une classe Custom Element reliée à un composant K3UI.
 * @param tagName - Nom du tag (informatif, enregistrement via defineK3UIElement)
 * @param componentClass - Classe TS du composant (Button, Dialog, …)
 * @param options - Hooks CE optionnels
 */
export function createK3UIElementClass<O extends BaseOptions = BaseOptions>(
    componentClass: K3UIComponentClass<O>,
    options: K3UIElementOptions<O> = {},
): CustomElementConstructor {
    const {
        observedAttributes = [],
        onConnected,
        mapAttributeToOption,
        onAttributeChanged,
    } = options;

    return class K3UIElementBase extends HTMLElement {
        static get observedAttributes(): string[] {
            return observedAttributes;
        }

        connectedCallback(): void {
            onConnected?.(this);
            if (!this.hasAttribute('data-initialized')) {
                this.setAttribute('data-initialized', 'true');
            }
            mountComponentInstance(componentClass, this);
            componentClass.getInstance(this)?.handleConnected();
        }

        disconnectedCallback(): void {
            const instance = componentClass.getInstance(this);
            if (instance) {
                instance.handleDisconnected();
            }
        }

        attributeChangedCallback(
            name: string,
            oldValue: string | null,
            newValue: string | null,
        ): void {
            if (oldValue === newValue) return;
            const instance = componentClass.getInstance(this);
            if (!instance) return;

            if (onAttributeChanged) {
                onAttributeChanged(this, name, oldValue, newValue, instance);
                return;
            }

            if (mapAttributeToOption) {
                const partial = mapAttributeToOption(name, newValue);
                if (partial && Object.keys(partial).length > 0) {
                    instance.updateOptions(partial as Partial<O>, {
                        attribute: name,
                        oldValue,
                        newValue,
                    });
                }
            }
        }
    };
}

/**
 * Enregistre un custom element K3UI si absent.
 * @param tagName - ex. k3ui-button
 * @param componentClass - Classe composant
 * @param options - Options CE
 */
export function defineK3UIElement<O extends BaseOptions = BaseOptions>(
    tagName: string,
    componentClass: K3UIComponentClass<O>,
    options?: K3UIElementOptions<O>,
): void {
    if (typeof window === 'undefined' || typeof customElements === 'undefined') return;
    if (customElements.get(tagName)) return;
    customElements.define(tagName, createK3UIElementClass(componentClass, options));
}

/**
 * Convertit un attribut kebab-case en camelCase.
 * @param name - Nom d'attribut
 */
export function attributeNameToCamelCase(name: string): string {
    return name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

/**
 * Map générique attribut string → option si la clé existe dans defaults.
 * @param name - Attribut
 * @param value - Valeur
 * @param optionKeys - Clés valides des options
 */
export function mapStringAttributeToOptions<O extends BaseOptions>(
    name: string,
    value: string | null,
    optionKeys: Set<string>,
): Partial<O> | null {
    const key = attributeNameToCamelCase(name);
    if (!optionKeys.has(key)) return null;
    return { [key]: value } as Partial<O>;
}

/** Métadonnées pour updateOptions depuis un attribut observé */
export type { ComponentLifecycleChanges };
