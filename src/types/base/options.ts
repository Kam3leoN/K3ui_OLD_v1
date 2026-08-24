/**
 * @fileoverview Types de base pour les options K3UI
 * @description Interface de base pour toutes les options des composants et managers
 * @author K3UI Team
 * @version 0.1.0
 */

/**
 * Interface de base pour toutes les options
 * @description Toutes les options des composants et managers héritent de cette interface
 */
export interface BaseOptions {
    /** Fonction appelée au début de l'ouverture */
    onOpenStart?: ((el: HTMLElement) => void) | null;
    /** Fonction appelée à la fin de l'ouverture */
    onOpenEnd?: ((el: HTMLElement) => void) | null;
    /** Fonction appelée au début de la fermeture */
    onCloseStart?: ((el: HTMLElement) => void) | null;
    /** Fonction appelée à la fin de la fermeture */
    onCloseEnd?: ((el: HTMLElement) => void) | null;
    /** Fonction appelée lors d'un événement */
    onEvent?: ((el: HTMLElement) => void) | null;
}

/**
 * Options pour l'initialisation automatique
 * @description Permet de personnaliser l'initialisation de chaque composant
 */
export interface AutoInitOptions {
    /** Sélecteurs CSS pour l'auto-initialisation des composants */
    selectors?: Record<string, string>;
    /** Options pour chaque composant */
    components?: Record<string, BaseOptions>;
    /** Options pour chaque manager */
    managers?: Record<string, BaseOptions>;
}

/**
 * Options pour les managers
 * @description Interface de base pour tous les managers
 */
export interface ManagerOptions extends BaseOptions {
    /** Nom du manager */
    name?: string;
    /** Activer le manager */
    enabled?: boolean;
}

/**
 * Options pour les composants
 * @description Interface de base pour tous les composants
 */
export interface ComponentOptions extends BaseOptions {
    /** Nom du composant */
    name?: string;
    /** Activer le composant */
    enabled?: boolean;
}
