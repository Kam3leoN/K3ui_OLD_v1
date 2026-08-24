import type { InitElements, KElement } from '../../types/base/element';

/** Cibles passées à `Component.init` (élément, collection, sélecteur ou liste). */
export type ComponentInitElements =
    | KElement
    | InitElements<KElement>
    | string
    | HTMLElement
    | HTMLElement[];

/** Options fusionnées (DEFAULT + K3UI_OPTIONS + passe AutoInit). */
export type ComponentInitOptions = Record<string, unknown>;

/** Retour typé large : instance unique, tableau ou void selon le composant. */
export type ComponentInitResult = unknown;

/** Signature unifiée pour le registre AutoInit et `init-components`. */
export type ComponentInitFn = (
    els: ComponentInitElements,
    opts?: ComponentInitOptions
) => ComponentInitResult;

/**
 * Adapte `SomeComponent.init` au type `ComponentInitFn` (seul point de cast du registre).
 * Les signatures `init` par composant (surcharges, options typées) restent inchangées à l’appel direct.
 * @param componentClass - Classe composant avec `init` statique
 */
export function toComponentInitFn(componentClass: unknown): ComponentInitFn {
    const init = (componentClass as { init: ComponentInitFn }).init;
    return (els, opts) => init(els, opts);
}

/**
 * Compte les instances créées par un appel à `init`.
 * @param instances - Valeur retournée par `init`
 */
export function countInitInstances(instances: ComponentInitResult): number {
    if (Array.isArray(instances)) {
        return instances.length;
    }
    return instances != null ? 1 : 0;
}
