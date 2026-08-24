/**
 * @fileoverview Registre central des managers K3UI
 * @description Pattern Singleton pour éviter les instances multiples et optimiser les performances
 * @author K3UI Team
 * @version 1.0.0
 */

import { LoggerManager } from '../managers/LoggerManager';

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Interface pour les factories de managers
 */
export interface ManagerFactory<T> {
    (): T;
}

/**
 * Interface pour les options du registre
 */
export interface ManagerRegistryOptions {
    /** Si le registre est activé */
    enabled: boolean;
    /** Taille maximale du cache */
    maxCacheSize: number;
    /** Si le nettoyage automatique est activé */
    autoCleanup: boolean;
    /** Délai de nettoyage en ms */
    cleanupInterval: number;
}

/**
 * Manager enregistré pouvant exposer une méthode `destroy`.
 */
interface DestroyableManager {
    destroy?: () => void;
}

function getManagerConstructorName(manager: unknown): string {
    if (typeof manager !== 'object' || manager === null) {
        return 'Unknown';
    }
    const ctor = (manager as { constructor?: { name?: string } }).constructor;
    return ctor?.name ?? 'Unknown';
}

function isDestroyableManager(manager: unknown): manager is DestroyableManager {
    return (
        typeof manager === 'object' &&
        manager !== null &&
        'destroy' in manager &&
        typeof (manager as DestroyableManager).destroy === 'function'
    );
}

/**
 * Interface pour les métadonnées d'un manager
 */
export interface ManagerMetadata {
    /** Nom du manager */
    name: string;
    /** Type de manager */
    type: string;
    /** Timestamp de création */
    createdAt: number;
    /** Timestamp de dernière utilisation */
    lastUsed: number;
    /** Nombre d'utilisations */
    usageCount: number;
    /** Si le manager est actif */
    active: boolean;
}

// ============================================================================
// CLASSE MANAGERREGISTRY
// ============================================================================

/**
 * Registre central des managers K3UI
 * Pattern Singleton pour éviter les instances multiples
 */
export class ManagerRegistry {
  /** Logger pour le registre */
  private static logger: LoggerManager = LoggerManager.create('[ManagerRegistry]', 'Manager');
    /** Instance unique du registre */
    private static instance: ManagerRegistry | null = null;

    /** Map des managers enregistrés */
    private managers = new Map<string, unknown>();

    /** Map des métadonnées des managers */
    private metadata = new Map<string, ManagerMetadata>();

    /** Configuration du registre */
    private options: ManagerRegistryOptions = {
        enabled: true,
        maxCacheSize: 50,
        autoCleanup: true,
        cleanupInterval: 300000 // 5 minutes
    };

    /** Timer de nettoyage automatique */
    private cleanupTimer: number | null = null;

    /**
     * Constructeur privé pour le pattern Singleton
     */
    private constructor() {
        this.startCleanupTimer();
    }

    /**
     * Obtenir l'instance unique du registre
     * @returns Instance du ManagerRegistry
     */
    static getInstance(): ManagerRegistry {
        if (!this.instance) {
            this.instance = new ManagerRegistry();
        }
        return this.instance;
    }

    /**
     * Configurer le registre
     * @param options Options de configuration
     */
    configure(options: Partial<ManagerRegistryOptions>): void {
        this.options = { ...this.options, ...options };

        if (this.options.autoCleanup && !this.cleanupTimer) {
            this.startCleanupTimer();
        } else if (!this.options.autoCleanup && this.cleanupTimer) {
            this.stopCleanupTimer();
        }
    }

    /**
     * Obtenir un manager du registre
     * @param name Nom du manager
     * @param factory Factory pour créer le manager si nécessaire
     * @returns Instance du manager
     */
    get<T>(name: string, factory: ManagerFactory<T>): T {
        if (!this.options.enabled) {
            return factory();
        }

        if (!this.managers.has(name)) {
            const manager = factory();
            this.managers.set(name, manager);

            // Enregistrer les métadonnées
            this.metadata.set(name, {
                name,
                type: getManagerConstructorName(manager),
                createdAt: Date.now(),
                lastUsed: Date.now(),
                usageCount: 1,
                active: true
            });
        } else {
            // Mettre à jour les métadonnées
            const meta = this.metadata.get(name)!;
            meta.lastUsed = Date.now();
            meta.usageCount++;
            this.metadata.set(name, meta);
        }

        return this.managers.get(name) as T;
    }

    /**
     * Vérifier si un manager existe
     * @param name Nom du manager
     * @returns true si le manager existe
     */
    has(name: string): boolean {
        return this.managers.has(name);
    }

    /**
     * Supprimer un manager du registre
     * @param name Nom du manager
     * @returns true si le manager a été supprimé
     */
    remove(name: string): boolean {
        const manager = this.managers.get(name);
        if (isDestroyableManager(manager)) {
            try {
                manager.destroy?.();
            } catch (error) {
                ManagerRegistry.logger.warn(`Could not destroy manager ${name}:`, error);
            }
        }

        this.managers.delete(name);
        this.metadata.delete(name);
        return true;
    }

    /**
     * Obtenir tous les managers enregistrés
     * @returns Map des managers
     */
    getAll(): Map<string, unknown> {
        return new Map(this.managers);
    }

    /**
     * Obtenir les métadonnées d'un manager
     * @param name Nom du manager
     * @returns Métadonnées ou undefined
     */
    getMetadata(name: string): ManagerMetadata | undefined {
        return this.metadata.get(name);
    }

    /**
     * Obtenir toutes les métadonnées
     * @returns Map des métadonnées
     */
    getAllMetadata(): Map<string, ManagerMetadata> {
        return new Map(this.metadata);
    }

    /**
     * Obtenir les statistiques du registre
     * @returns Statistiques détaillées
     */
    getStats() {
        const now = Date.now();
        const stats = {
            totalManagers: this.managers.size,
            activeManagers: 0,
            inactiveManagers: 0,
            totalMemoryUsage: 0,
            averageUsageCount: 0,
            oldestManager: null as ManagerMetadata | null,
            newestManager: null as ManagerMetadata | null
        };

        let totalUsage = 0;
        let oldestTime = Infinity;
        let newestTime = 0;

        for (const meta of this.metadata.values()) {
            if (meta.active) {
                stats.activeManagers++;
            } else {
                stats.inactiveManagers++;
            }

            totalUsage += meta.usageCount;

            if (meta.createdAt < oldestTime) {
                oldestTime = meta.createdAt;
                stats.oldestManager = meta;
            }

            if (meta.createdAt > newestTime) {
                newestTime = meta.createdAt;
                stats.newestManager = meta;
            }
        }

        stats.averageUsageCount = this.metadata.size > 0 ? totalUsage / this.metadata.size : 0;

        return stats;
    }

    /**
     * Nettoyer les managers inactifs
     */
    cleanup(): void {
        const now = Date.now();
        const threshold = this.options.cleanupInterval;
        const toRemove: string[] = [];

        for (const [name, meta] of this.metadata.entries()) {
            if (!meta.active || (now - meta.lastUsed > threshold)) {
                toRemove.push(name);
            }
        }

        for (const name of toRemove) {
            this.remove(name);
        }

        ManagerRegistry.logger.info(`Cleaned up ${toRemove.length} inactive managers`);
    }

    /**
     * Vider complètement le registre
     */
    clear(): void {
        for (const [name, manager] of this.managers.entries()) {
            if (isDestroyableManager(manager)) {
                try {
                    manager.destroy?.();
                } catch (error) {
                    ManagerRegistry.logger.warn(`Could not destroy manager ${name}:`, error);
                }
            }
        }

        this.managers.clear();
        this.metadata.clear();
    }

    /**
     * Détruire le registre et nettoyer les ressources
     */
    destroy(): void {
        this.stopCleanupTimer();
        this.clear();
        ManagerRegistry.instance = null;
    }

    // ============================================================================
    // MÉTHODES PRIVÉES
    // ============================================================================

    /**
     * Démarrer le timer de nettoyage automatique
     */
    private startCleanupTimer(): void {
        if (this.options.autoCleanup && !this.cleanupTimer) {
            this.cleanupTimer = window.setInterval(() => {
                this.cleanup();
            }, this.options.cleanupInterval);
        }
    }

    /**
     * Arrêter le timer de nettoyage automatique
     */
    private stopCleanupTimer(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
    }
}
