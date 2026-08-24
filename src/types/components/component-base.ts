/**
 * @fileoverview Types de base pour les composants K3UI
 * @description Interfaces et types fondamentaux pour le système de composants
 * @author K3UI Team
 * @version 1.0.0
 */

import { BaseOptions } from '../base/options';
import { PriorityLevel } from '../base/priority';
import { KElement, InitElements } from '../base/element';

// ============================================================================
// TYPES POUR LES CONSTRUCTEURS DE COMPOSANTS
// ============================================================================

/**
 * Constructeur de composant
 */
export type ComponentConstructor<T extends Component<O>, O extends BaseOptions> = {
    new(el: HTMLElement, options: Partial<O>): T;
};

/**
 * Type de composant complet avec méthodes statiques.
 * On n'intersecte pas avec `typeof Component` pour éviter les conflits de signature
 * de `init` entre la classe de base et les sous-classes (retours `Foo[]` vs `Foo | Foo[]`).
 */
export type ComponentType<C extends Component<O>, O extends BaseOptions> = ComponentConstructor<C, O> & {
    defaults: O;
    name?: string;
};

/**
 * Passe-through pour marquer l’intention (cast centralisé côté `Component` / `super`).
 * @param classDef - Classe composant (`Button`, `Menu`, …)
 */
export function toComponentClassDef(classDef: unknown): unknown {
    return classDef;
}

// ============================================================================
// INTERFACES POUR LES COMPOSANTS
// ============================================================================

/**
 * Interface de base pour tous les composants
 */
export interface IComponent<O extends BaseOptions> {
    /** Élément DOM associé */
    el: HTMLElement;
    /** Options du composant */
    options: O;
    /** Niveau de priorité */
    priority: PriorityLevel;

    /** Définir les options du composant */
    setOptions(opts: Partial<O>): void;
    /** Détruire le composant */
    destroy(): void;
}

/**
 * Interface pour les composants ouverts/fermables
 */
export interface IOpenable {
    /** Si le composant est ouvert */
    isOpen: boolean;
    /** Ouvrir le composant */
    open(): void;
    /** Fermer le composant */
    close(): void;
    /** Toggle l'état ouvert/fermé */
    toggle(): void;
}

/**
 * Interface pour les composants avec initialisation statique
 */
export interface IComponentWithInit<O extends BaseOptions> {
    /** Initialiser un composant */
    init(el: HTMLElement, options?: Partial<O>): Component<O>;
    /** Initialiser plusieurs composants */
    init(els: InitElements<HTMLElement>, options?: Partial<O>): Component<O>[];
    /** Obtenir l'instance d'un composant */
    getInstance(el: HTMLElement): Component<O> | null;
    /** Options par défaut */
    defaults: O;
}

// ============================================================================
// CLASSE DE BASE ABSTRAITE
// ============================================================================

/**
 * Classe de base pour tous les composants K3UI
 */
export class Component<O extends BaseOptions> implements IComponent<O> {
    /** Élément DOM associé */
    el: HTMLElement;
    /** Options du composant */
    options!: O;
    /** Niveau de priorité */
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    /**
     * Constructeur de base
     * @param el Élément DOM
     * @param options Options du composant
     * @param classDef Définition de la classe
     */
    constructor(el: HTMLElement, options: Partial<O>, classDef: ComponentType<Component<O>, O>) {
        // Validation de l'élément
        if (!(el instanceof HTMLElement)) {
            console.error(Error(el + ' is not an HTML Element'));
        }

        this.el = el;

        // Les options seront définies par les classes dérivées
        // via mergeOptions dans leur constructeur
    }

    /**
     * Définir les options du composant
     * @param opts Nouvelles options
     */
    setOptions(opts: Partial<O>): void {
        this.options = { ...this.options, ...opts };
    }

    /**
     * Détruire le composant
     */
    destroy(): void {
        // À implémenter par les classes dérivées
    }

    /**
     * Options par défaut (à implémenter par les classes dérivées)
     */
    static get defaults(): BaseOptions {
        return {};
    }

    /**
     * Obtenir l'instance d'un composant (à implémenter par les classes dérivées)
     * @param el Élément DOM
     */
    static getInstance(el: HTMLElement): Component<BaseOptions> {
        throw new Error('This method must be implemented.');
    }
}

export type {
    K3UIComponentInstance,
    ComponentInstanceCallback,
    ComponentInstanceCallbackOptional,
    ComponentCustomData,
    ComponentAnimationOptions,
    TableCellValue,
    ChartTooltipContextItem,
} from './callbacks';
