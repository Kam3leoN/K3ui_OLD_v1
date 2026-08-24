/**
 * @fileoverview Types pour le registre des composants K3UI
 * @description Interfaces et types pour la gestion du registre des instances
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component, ComponentConstructor } from './component-base';
import { PriorityLevel } from '../base/priority';
import { BaseOptions } from '../base/options';

// ============================================================================
// TYPES POUR LE REGISTRE DES COMPOSANTS
// ============================================================================

/**
 * Entrée dans le registre des composants
 */
export interface ComponentRegistryEntry {
    /** Instance du composant */
    component: Component<BaseOptions>;
    /** Niveau de priorité */
    priority: PriorityLevel;
    /** Options utilisées */
    options: BaseOptions;
    /** Nom de la classe */
    className: string;
    /** Timestamp de création */
    createdAt: number;
    /** Timestamp de dernière utilisation */
    lastUsed: number;
}

/**
 * Interface pour le registre des composants
 */
export interface IComponentRegistry {
    /** Enregistrer une instance */
    register(
        element: HTMLElement,
        component: Component<BaseOptions>,
        priority: PriorityLevel,
        options: BaseOptions,
        className: string
    ): boolean;

    /** Obtenir une instance */
    getInstance(element: HTMLElement): Component<BaseOptions> | null;

    /** Vérifier si une priorité est plus élevée */
    hasHigherPriority(element: HTMLElement, newPriority: PriorityLevel): boolean;

    /** Supprimer une instance */
    unregister(element: HTMLElement): void;

    /** Obtenir toutes les instances */
    getAllInstances(): Map<HTMLElement, ComponentRegistryEntry>;

    /** Nettoyer les instances inactives */
    cleanup(): void;

    /** Obtenir les statistiques du registre */
    getStats(): ComponentRegistryStats;
}

/**
 * Statistiques du registre
 */
export interface ComponentRegistryStats {
    /** Nombre total d'instances */
    totalInstances: number;
    /** Instances par priorité */
    instancesByPriority: Record<PriorityLevel, number>;
    /** Instances par classe */
    instancesByClass: Record<string, number>;
    /** Instances inactives */
    inactiveInstances: number;
    /** Mémoire utilisée (estimation) */
    memoryUsage: number;
}

/**
 * Configuration du registre
 */
export interface ComponentRegistryConfig {
    /** Taille maximale du registre */
    maxSize?: number;
    /** Délai de nettoyage automatique (ms) */
    cleanupInterval?: number;
    /** Seuil d'inactivité (ms) */
    inactivityThreshold?: number;
    /** Si le nettoyage automatique est activé */
    autoCleanup?: boolean;
    /** Callback de nettoyage */
    onCleanup?: (removedCount: number) => void;
}

// ============================================================================
// TYPES POUR LA GESTION DES PRIORITÉS
// ============================================================================

/**
 * Interface pour la gestion des priorités
 */
export interface IPriorityManager {
    /** Comparer deux priorités */
    compare(priority1: PriorityLevel, priority2: PriorityLevel): number;

    /** Vérifier si une priorité est plus élevée */
    isHigher(priority1: PriorityLevel, priority2: PriorityLevel): boolean;

    /** Obtenir la priorité par défaut */
    getDefaultPriority(): PriorityLevel;

    /** Valider une priorité */
    isValid(priority: PriorityLevel): boolean;
}

// ============================================================================
// TYPES POUR LA GESTION DES CONFLITS
// ============================================================================

/**
 * Interface pour la gestion des conflits d'instances
 */
export interface IConflictManager {
    /** Résoudre un conflit d'instance */
    resolveConflict(
        element: HTMLElement,
        existing: ComponentRegistryEntry,
        incoming: ComponentRegistryEntry
    ): ComponentRegistryEntry;

    /** Vérifier s'il y a un conflit */
    hasConflict(element: HTMLElement, newPriority: PriorityLevel): boolean;

    /** Obtenir la stratégie de résolution */
    getResolutionStrategy(): ConflictResolutionStrategy;
}

/**
 * Stratégies de résolution de conflits
 */
export type ConflictResolutionStrategy =
    | 'replace'      // Remplacer l'ancienne instance
    | 'merge'        // Fusionner les options
    | 'ignore'       // Ignorer la nouvelle instance
    | 'promote'      // Promouvoir l'ancienne instance
    | 'demote';      // Rétrograder la nouvelle instance

// ============================================================================
// TYPES POUR LA GESTION DU CYCLE DE VIE
// ============================================================================

/**
 * Interface pour la gestion du cycle de vie des composants
 */
export interface ILifecycleManager {
    /** Créer une instance */
    create<O extends BaseOptions>(
        element: HTMLElement,
        options: Partial<O>,
        classDef: ComponentConstructor<Component<O>, O>
    ): Component<O>;

    /** Initialiser une instance */
    initialize<O extends BaseOptions>(
        element: HTMLElement,
        options: Partial<O>,
        classDef: ComponentConstructor<Component<O>, O>
    ): Component<O>;

    /** Détruire une instance */
    destroy(component: Component<BaseOptions>): void;

    /** Valider une instance */
    validate(component: Component<BaseOptions>): boolean;
}

// ============================================================================
// TYPES POUR LA GESTION DES ÉVÉNEMENTS DU REGISTRE
// ============================================================================

/**
 * Événements du registre
 */
export type RegistryEvent =
    | 'instance-created'
    | 'instance-destroyed'
    | 'instance-updated'
    | 'conflict-resolved'
    | 'cleanup-started'
    | 'cleanup-completed'
    | 'registry-cleared';

/**
 * Interface pour les événements du registre
 */
export interface IRegistryEventManager {
    /** Écouter un événement */
    on(event: RegistryEvent, callback: (data: unknown) => void): void;

    /** Arrêter d'écouter un événement */
    off(event: RegistryEvent, callback: (data: unknown) => void): void;

    /** Émettre un événement */
    emit(event: RegistryEvent, data: unknown): void;

    /** Nettoyer tous les listeners */
    cleanup(): void;
}
