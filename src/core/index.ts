/**
 * @fileoverview Point d'entrée centralisé pour les managers K3UI
 * @description Export centralisé de tous les managers et utilitaires
 * @author K3UI Team
 * @version 1.0.0
 */

// ============================================================================
// CORE STRUCTURE
// ============================================================================

// Factories
import { ManagerFactory, type ManagerFactoryOptions } from './factories';
export { ManagerFactory } from './factories';

// Registries
export { ManagerRegistry, ComponentRegistry } from './registries';

// Base classes
export { Component } from './base';
export {
    createK3UIElementClass,
    defineK3UIElement,
    attributeNameToCamelCase,
    mapStringAttributeToOptions,
} from './base';
export type {
    ComponentLifecycle,
    ComponentLifecycleChanges,
    LifecyclePhase,
    K3UIComponentClass,
    K3UIElementOptions,
} from './base';

// Lifecycle
export { LifecycleManager } from './lifecycle';

// Managers
export {
    LoggerManager,
    ThemeManager,
    SoundFXManager,
    CookieManager,
    IconManager,
    // Re-export from managers index
    type KElement,
    type InitElements,
    type Openable,
    type I18nOptions,
    PriorityLevel
} from './managers';


// ============================================================================
// TYPES DE COMPOSANTS
// ============================================================================

export type { ComponentOptions } from '../types/base/options';

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Obtenir les managers essentiels pour un composant
 * @param componentName Nom du composant
 * @returns Objet contenant les managers essentiels
 */
export function getEssentialManagers(componentName: string) {
    return ManagerFactory.getEssentialManagers(componentName);
}

/**
 * Obtenir les managers pour les tests
 * @param options Options de configuration
 * @returns Objet contenant les managers pour les tests
 */
export function getTestManagers(options: Partial<ManagerFactoryOptions> = {}) {
    return ManagerFactory.getTestManagers(options);
}

/**
 * Configurer le système de managers
 * @param options Options de configuration
 */
export function configureManagers(options: Partial<ManagerFactoryOptions>) {
    ManagerFactory.getInstance().configure(options);
}

/**
 * Obtenir les statistiques des managers
 * @returns Statistiques détaillées
 */
export function getManagerStats() {
    return ManagerFactory.getStats();
}

/**
 * Nettoyer le cache des managers
 */
export function cleanupManagers() {
    ManagerFactory.cleanup();
}
