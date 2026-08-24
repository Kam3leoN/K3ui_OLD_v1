/**
 * @fileoverview Point d'entrée pour les classes de base K3UI
 * @description Export centralisé de la classe Component de base
 * @author K3UI Team
 * @version 1.0.0
 */

// ============================================================================
// BASE CLASSES
// ============================================================================

export { Component } from './Component';
export type { ComponentLifecycle, ComponentLifecycleChanges, LifecyclePhase } from './Component';
export { OpenableComponent } from './OpenableComponent';
export {
    createK3UIElementClass,
    defineK3UIElement,
    attributeNameToCamelCase,
    mapStringAttributeToOptions,
} from './K3UIElement';
export type { K3UIComponentClass, K3UIElementOptions } from './K3UIElement';

// ============================================================================
// RE-EXPORTS
// ============================================================================

// Re-export types for backward compatibility
export type { KElement, InitElements } from '../../types/base';
export type { Openable, I18nOptions } from '../../types/base';
export type { BaseOptions } from '../../types/base';
export { PriorityLevel } from '../../types/base';

