/**
 * @fileoverview Point d'entrée centralisé pour tous les types K3UI
 * @description Export de tous les types et interfaces du projet
 * @author K3UI Team
 * @version 1.0.0
 */

// ============================================================================
// TYPES DE BASE
// ============================================================================

// Types fondamentaux (avec résolution de conflits)
export * from './base/priority';
export * from './base/interfaces';
export { EventHandler as BaseEventHandler } from './base/element';
export { ComponentOptions as BaseComponentOptions } from './base/options';

// ============================================================================
// TYPES DE COMPOSANTS
// ============================================================================

// Types de composants (priorité sur les types de base en cas de conflit)
export * from './components';

// ============================================================================
// TYPES DE MANAGERS
// ============================================================================

// Types de managers
export * from './managers';

// ============================================================================
// TYPES UTILITAIRES
// ============================================================================

// Les types utilitaires sont maintenant dans src/types/base/dom.ts