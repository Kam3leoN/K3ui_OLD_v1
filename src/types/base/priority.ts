/**
 * @fileoverview Types pour la gestion des priorités K3UI
 * @description Types et interfaces pour la gestion des priorités des composants
 * @author K3UI Team
 * @version 0.1.0
 */

import type { BaseOptions } from './options';

/**
 * Niveaux de priorité pour la gestion des composants
 * @description Détermine quelle instance d'un composant prend le dessus
 */
export enum PriorityLevel {
    SYSTEM = 0,      // Composants système critiques (priorité la plus basse)
    LOW = 1,         // AutoInit (priorité basse)
    MEDIUM = 2,      // Initialisation directe (priorité par défaut)
    HIGH = 3,        // init.js (utilisateur - priorité élevée)
    CRITICAL = 4     // Configurations d'urgence (priorité maximale)
}

/**
 * Interface pour la configuration des priorités
 * @description Configuration des priorités pour un composant
 */
export interface PriorityConfig {
    /** Niveau de priorité */
    level: PriorityLevel;
    /** Nom du composant */
    componentName: string;
    /** Description de la priorité */
    description?: string;
}

/**
 * Interface pour l'enregistrement d'une instance avec priorité
 * @description Structure pour enregistrer une instance avec sa priorité
 */
export interface PriorityInstance<T = unknown> {
    /** Instance du composant */
    component: T;
    /** Niveau de priorité */
    priority: PriorityLevel;
    /** Options utilisées */
    options: BaseOptions;
    /** Nom de la classe du composant */
    className: string;
    /** Timestamp de création */
    createdAt: number;
}

/**
 * Type pour les gestionnaires de priorité
 * @description Fonction pour gérer les conflits de priorité
 */
export type PriorityHandler<T = unknown> = (
    element: HTMLElement,
    newInstance: T,
    newPriority: PriorityLevel,
    existingInstance?: T,
    existingPriority?: PriorityLevel
) => boolean;

/**
 * Interface pour les composants avec gestion de priorité
 * @description Interface pour les composants qui gèrent les priorités
 */
export interface PrioritizedComponent {
    /** Niveau de priorité du composant */
    priorityLevel: PriorityLevel;
    /** Vérifier si la priorité est suffisante */
    hasHigherPriority(priority: PriorityLevel): boolean;
    /** Mettre à jour la priorité */
    updatePriority(priority: PriorityLevel): void;
}

/**
 * Constantes pour les priorités
 * @description Valeurs par défaut et constantes pour les priorités
 */
export const PRIORITY_CONSTANTS = {
    /** Priorité par défaut pour les composants */
    DEFAULT_PRIORITY: PriorityLevel.MEDIUM,
    /** Priorité maximale possible */
    MAX_PRIORITY: PriorityLevel.CRITICAL,
    /** Priorité minimale possible */
    MIN_PRIORITY: PriorityLevel.SYSTEM,
    /** Priorité pour l'AutoInit */
    AUTOINIT_PRIORITY: PriorityLevel.LOW,
    /** Priorité pour les configurations utilisateur */
    USER_PRIORITY: PriorityLevel.HIGH
} as const;

/**
 * Type pour les niveaux de priorité valides
 * @description Union type pour les niveaux de priorité valides
 */
export type ValidPriorityLevel = keyof typeof PriorityLevel;

/**
 * Interface pour la validation des priorités
 * @description Interface pour valider les priorités
 */
export interface PriorityValidator {
    /** Valider un niveau de priorité */
    isValid(priority: PriorityLevel): boolean;
    /** Comparer deux priorités */
    compare(priority1: PriorityLevel, priority2: PriorityLevel): number;
    /** Obtenir le nom d'une priorité */
    getName(priority: PriorityLevel): string;
}
