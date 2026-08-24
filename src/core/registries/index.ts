/**
 * @fileoverview Point d'entrée pour les registres K3UI
 * @description Export centralisé des registres ManagerRegistry et ComponentRegistry
 * @author K3UI Team
 * @version 1.0.0
 */

// ============================================================================
// REGISTRIES
// ============================================================================

export { ManagerRegistry } from './ManagerRegistry';
export { ComponentRegistry } from './ComponentRegistry';

// ============================================================================
// TYPES
// ============================================================================

export type {
    ManagerRegistryOptions
} from './ManagerRegistry';

// Types pour ComponentRegistry depuis les types génériques
export type {
    ComponentRegistryEntry,
    ComponentRegistryStats,
    ComponentRegistryConfig,
    IComponentRegistry,
    RegistryEvent
} from '../../types/components';

