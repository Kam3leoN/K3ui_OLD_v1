/**
 * @fileoverview Registre central des composants K3UI
 * @description Gestion centralisée des instances de composants avec priorités
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component, ComponentRegistryEntry, ComponentRegistryStats, ComponentRegistryConfig, RegistryEvent } from '../../types/components';
import { PriorityLevel, BaseOptions } from '../../types/base';
import { LoggerManager } from '../managers/LoggerManager';

// ============================================================================
// CLASSE COMPONENTREGISTRY
// ============================================================================

/**
 * Registre central des instances de composants avec gestion des priorités
 */
export class ComponentRegistry {
  /** Logger pour le registre */
  private static logger: LoggerManager = LoggerManager.create('[ComponentRegistry]', 'Manager');

  /** Instance unique du registre */
  private static instance: ComponentRegistry | null = null;

  /** Map des instances enregistrées */
  private static instances = new Map<HTMLElement, ComponentRegistryEntry>();

  /** Configuration du registre */
  private static config: ComponentRegistryConfig = {
    maxSize: 1000,
    cleanupInterval: 30000, // 30 secondes
    inactivityThreshold: 300000, // 5 minutes
    autoCleanup: true
  };

  /** Timer de nettoyage automatique */
  private static cleanupTimer: number | null = null;

  /** Listeners d'événements */
  private static eventListeners = new Map<RegistryEvent, Set<(data: unknown) => void>>();

  /**
   * Obtenir l'instance unique du registre
   * @returns Instance du ComponentRegistry
   */
  static getInstance(): ComponentRegistry {
    if (!this.instance) {
      this.instance = new ComponentRegistry();
    }
    return this.instance;
  }

  /**
   * Initialiser le registre
   * @param config Configuration optionnelle
   */
  static init(config?: Partial<ComponentRegistryConfig>): void {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    if (this.config.autoCleanup && !this.cleanupTimer) {
      this.cleanupTimer = window.setInterval(() => {
        this.cleanup();
      }, this.config.cleanupInterval);
    }
  }

  /**
   * Enregistrer une nouvelle instance avec gestion automatique des priorités
   * @param element Élément DOM associé
   * @param component Instance du composant
   * @param priority Niveau de priorité
   * @param options Options utilisées
   * @param className Nom de la classe du composant
   * @returns true si l'enregistrement a réussi, false sinon
   */
  static register(
    element: HTMLElement,
    component: Component<BaseOptions>,
    priority: PriorityLevel,
    options: BaseOptions,
    className: string
  ): boolean {
    const existing = this.instances.get(element);
    const now = Date.now();

    // Vérifier la limite de taille
    if (this.instances.size >= this.config.maxSize!) {
      this.cleanup();
    }

    // Si pas d'instance existante OU nouvelle priorité plus élevée
    if (!existing || priority > existing.priority) {
      // Détruire l'ancienne instance si elle existe
      if (existing) {
        try {
          existing.component.destroy();
          this.emit('instance-destroyed', {
            element,
            className: existing.className,
            reason: 'replaced'
          });
        } catch (error) {
          this.logger.warn(`Could not destroy existing ${existing.className} instance:`, error);
        }
      }

      // Créer la nouvelle entrée
      const entry: ComponentRegistryEntry = {
        component,
        priority,
        options,
        className,
        createdAt: now,
        lastUsed: now
      };

      // Enregistrer la nouvelle avec sa priorité
      this.instances.set(element, entry);

      this.emit('instance-created', {
        element,
        className,
        priority
      });

      return true; // Enregistrement réussi
    }

    // Mettre à jour le timestamp de dernière utilisation
    if (existing) {
      existing.lastUsed = now;
    }

    return false; // Priorité insuffisante, ignoré
  }

  /**
   * Récupérer l'instance active d'un composant
   * @param element Élément DOM
   * @returns Instance du composant ou null
   */
  static getComponentInstance(element: HTMLElement): Component<BaseOptions> | null {
    const entry = this.instances.get(element);
    if (entry) {
      entry.lastUsed = Date.now();
      return entry.component;
    }
    return null;
  }

  /**
   * Vérifier si une nouvelle priorité est plus élevée que l'existante
   * @param element Élément DOM
   * @param newPriority Nouvelle priorité à vérifier
   * @returns true si la nouvelle priorité est plus élevée
   */
  static hasHigherPriority(element: HTMLElement, newPriority: PriorityLevel): boolean {
    const existing = this.instances.get(element);
    return !existing || newPriority > existing.priority;
  }

  /**
   * Supprimer une instance du registre
   * @param element Élément DOM
   */
  static unregister(element: HTMLElement): void {
    const entry = this.instances.get(element);
    if (entry) {
      this.emit('instance-destroyed', {
        element,
        className: entry.className,
        reason: 'unregistered'
      });
    }
    this.instances.delete(element);
  }

  /**
   * Récupérer toutes les instances enregistrées
   * @returns Map des instances avec leurs métadonnées
   */
  static getAllInstances(): Map<HTMLElement, ComponentRegistryEntry> {
    return new Map(this.instances);
  }

  /**
   * Nettoyer les instances inactives
   */
  static cleanup(): void {
    this.emit('cleanup-started', { timestamp: Date.now() });

    const now = Date.now();
    const threshold = this.config.inactivityThreshold!;
    let removedCount = 0;

    for (const [element, entry] of this.instances.entries()) {
      if (now - entry.lastUsed > threshold) {
        try {
          entry.component.destroy();
          this.instances.delete(element);
          removedCount++;
        } catch (error) {
          this.logger.warn(`Could not destroy inactive ${entry.className} instance:`, error);
        }
      }
    }

    this.emit('cleanup-completed', {
      removedCount,
      remainingCount: this.instances.size
    });

    if (this.config.onCleanup) {
      this.config.onCleanup(removedCount);
    }
  }

  /**
   * Obtenir les statistiques du registre
   * @returns Statistiques détaillées
   */
  static getStats(): ComponentRegistryStats {
    const stats: ComponentRegistryStats = {
      totalInstances: this.instances.size,
      instancesByPriority: {} as Record<PriorityLevel, number>,
      instancesByClass: {},
      inactiveInstances: 0,
      memoryUsage: 0
    };

    const now = Date.now();
    const threshold = this.config.inactivityThreshold!;

    for (const entry of this.instances.values()) {
      // Compter par priorité
      stats.instancesByPriority[entry.priority] =
        (stats.instancesByPriority[entry.priority] || 0) + 1;

      // Compter par classe
      stats.instancesByClass[entry.className] =
        (stats.instancesByClass[entry.className] || 0) + 1;

      // Compter les instances inactives
      if (now - entry.lastUsed > threshold) {
        stats.inactiveInstances++;
      }

      // Estimation de la mémoire (très approximative)
      stats.memoryUsage += JSON.stringify(entry.options).length;
    }

    return stats;
  }

  /**
   * Vider complètement le registre
   */
  static clear(): void {
    for (const [element, entry] of this.instances.entries()) {
      try {
        entry.component.destroy();
      } catch (error) {
        this.logger.warn(`Could not destroy ${entry.className} instance:`, error);
      }
    }

    this.instances.clear();
    this.emit('registry-cleared', { timestamp: Date.now() });
  }

  /**
   * Détruire le registre et nettoyer les ressources
   */
  static destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    this.clear();
    this.eventListeners.clear();
  }

  // ============================================================================
  // GESTION DES ÉVÉNEMENTS
  // ============================================================================

  /**
   * Écouter un événement du registre
   * @param event Type d'événement
   * @param callback Fonction de callback
   */
  static on(event: RegistryEvent, callback: (data: unknown) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * Arrêter d'écouter un événement
   * @param event Type d'événement
   * @param callback Fonction de callback
   */
  static off(event: RegistryEvent, callback: (data: unknown) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * Émettre un événement
   * @param event Type d'événement
   * @param data Données de l'événement
   */
  private static emit(event: RegistryEvent, data: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          this.logger.error(`Error in registry event listener for ${event}:`, error);
        }
      });
    }
  }
}
