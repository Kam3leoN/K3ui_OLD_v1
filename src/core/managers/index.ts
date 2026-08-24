/**
 * @fileoverview Point d'entrée centralisé pour les managers K3UI
 * @description Export centralisé de tous les managers et utilitaires
 * @author K3UI Team
 * @version 1.0.0
 */

// ============================================================================
// MANAGERS CORE
// ============================================================================

// Registre et Factory
import { ManagerFactory, type ManagerFactoryOptions } from '../factories/ManagerFactory';
export { ManagerRegistry } from '../registries/ManagerRegistry';
export { ManagerFactory } from '../factories/ManagerFactory';

// Managers spécialisés
export { LoggerManager } from './LoggerManager';
export { LocaleManager } from './LocaleManager';
export { ThemeManager } from './ThemeManager';
export { DynamicColorManager } from './DynamicColorManager';
export { SoundFXManager } from './SoundFXManager';
export { CookieManager } from './CookieManager';
export { PrivacyManager } from './PrivacyManager';
export { IconManager } from './IconManager';
export { LazyManager } from './LazyManager';
export type { LazyObserveOptions, LazyEnterCallback } from './LazyManager';
export { Keyboard, keyboard, keyboardUtils } from './KeyboardManager';
export { Mouse, mouse, mouseUtils } from './MouseManager';
export { Gesture, gestureUtils } from './GestureManager';
export { MotionManager } from './MotionManager';
export { HapticManager } from './HapticManager';
export { ToastToasterManager } from './ToastToasterManager';
export type { ToastToasterItem, ToastToasterManagerOptions } from './ToastToasterManager';
export { ScrollbarManager } from './ScrollbarManager';
export type {
    ScrollbarBindOptions,
    ScrollbarGeometryMode,
    ScrollbarHandle,
    ScrollbarPlacement,
} from '../../types/managers/scrollbar';
export type { HapticPattern, HapticVibrationSequence } from './HapticManager';

// Component Management - déplacés vers leurs dossiers respectifs
export { Component } from '../base/Component';
export { ComponentRegistry } from '../registries/ComponentRegistry';

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

// Types de base
export type { KElement, InitElements } from '../../types/base';
export type { Openable, I18nOptions } from '../../types/base';
export { PriorityLevel } from '../../types/base';

// Types de composants
export type { ComponentOptions } from '../../types/base/options';
export type { LocaleCode, LocaleManagerOptions } from '../../types/managers/locale';
export type { PrivacyCategory, PrivacyKeyInfo, PrivacyManagerOptions } from '../../types/managers/privacy';

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
