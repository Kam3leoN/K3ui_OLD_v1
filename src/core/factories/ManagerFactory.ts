/**
 * @fileoverview Factory centralisée pour les managers K3UI
 * @description Point d'accès unique pour obtenir les instances des managers
 * @author K3UI Team
 * @version 1.0.0
 */

import { ManagerRegistry } from '../registries/ManagerRegistry';
import { LoggerManager } from '../managers/LoggerManager';
import { ThemeManager } from '../managers/ThemeManager';
import { SoundFXManager } from '../managers/SoundFXManager';
import { CookieManager } from '../managers/CookieManager';
import { PrivacyManager } from '../managers/PrivacyManager';
import { IconManager } from '../managers/IconManager';
import { HapticManager } from '../managers/HapticManager';
import { ComponentRegistry } from '../registries/ComponentRegistry';

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Interface pour les options de la factory
 */
export interface ManagerFactoryOptions {
    /** Si la factory est activée */
    enabled: boolean;
    /** Si le cache est activé */
    cacheEnabled: boolean;
    /** Taille maximale du cache */
    maxCacheSize: number;
}

/**
 * Interface pour les options de création d'un manager
 */
export interface ManagerCreationOptions {
    /** Nom du manager */
    name: string;
    /** Type du manager */
    type: string;
    /** Options spécifiques */
    options?: Record<string, unknown>;
    /** Si le manager doit être mis en cache */
    cache?: boolean;
}

// ============================================================================
// CLASSE MANAGERFACTORY
// ============================================================================

/**
 * Factory centralisée pour les managers K3UI
 * Fournit un point d'accès unique et optimisé pour tous les managers
 */
export class ManagerFactory {
    /** Instance unique de la factory */
    private static instance: ManagerFactory | null = null;

    /** Configuration de la factory */
    private options: ManagerFactoryOptions = {
        enabled: true,
        cacheEnabled: true,
        maxCacheSize: 50
    };

    /**
     * Constructeur privé pour le pattern Singleton
     */
    private constructor() {
        // Configuration par défaut
    }

    /**
     * Obtenir l'instance unique de la factory
     * @returns Instance de la ManagerFactory
     */
    static getInstance(): ManagerFactory {
        if (!this.instance) {
            this.instance = new ManagerFactory();
        }
        return this.instance;
    }

    /**
     * Configurer la factory
     * @param options Options de configuration
     */
    configure(options: Partial<ManagerFactoryOptions>): void {
        this.options = { ...this.options, ...options };

        // Configurer le registre si nécessaire
        if (this.options.cacheEnabled) {
            ManagerRegistry.getInstance().configure({
                enabled: this.options.enabled,
                maxCacheSize: this.options.maxCacheSize,
                autoCleanup: true,
                cleanupInterval: 300000 // 5 minutes
            });
        }
    }

    // ============================================================================
    // MÉTHODES POUR LES MANAGERS SPÉCIALISÉS
    // ============================================================================


    /**
     * Obtenir le LoggerManager
     * @param prefix Préfixe pour le logger (ex: '[Component]')
     * @param type Type du logger ('Manager' | 'Component' | 'Front-end')
     * @returns Instance du LoggerManager
     */
    static getLoggerManager(prefix?: string, type?: 'Manager' | 'Component' | 'Front-end'): LoggerManager {
        if (prefix) {
            // Détecter automatiquement le type si non fourni
            if (!type) {
                if (prefix.includes('Manager') || prefix.includes('Registry')) {
                    type = 'Manager';
                } else {
                    type = 'Component';
                }
            }
            return LoggerManager.create(prefix, type);
        }
        return LoggerManager.global;
    }

    /**
     * Obtenir le ThemeManager
     * @returns Instance du ThemeManager
     */
    static getThemeManager(): ThemeManager {
        if (!this.getInstance().options.enabled) {
            return new ThemeManager();
        }

        if (this.getInstance().options.cacheEnabled) {
            return ManagerRegistry.getInstance().get('theme', () =>
                new ThemeManager()
            );
        }

        return new ThemeManager();
    }

    /**
     * Obtenir le HapticManager (retour vibratoire Vibration API)
     * @returns Instance partagée du HapticManager
     */
    static getHapticManager(): HapticManager {
        if (!this.getInstance().options.enabled) {
            return HapticManager.create();
        }

        if (this.getInstance().options.cacheEnabled) {
            return ManagerRegistry.getInstance().get('haptic', () => HapticManager.create());
        }

        return HapticManager.create();
    }

    /**
     * Obtenir le SoundFXManager
     * @returns Instance du SoundFXManager
     */
    static getSoundFXManager(): SoundFXManager {
        if (!this.getInstance().options.enabled) {
            return new SoundFXManager();
        }

        if (this.getInstance().options.cacheEnabled) {
            return ManagerRegistry.getInstance().get('soundfx', () =>
                new SoundFXManager()
            );
        }

        return new SoundFXManager();
    }

    /**
     * Obtenir le CookieManager
     * @returns Instance du CookieManager
     */
    static getCookieManager(): CookieManager {
        if (!this.getInstance().options.enabled) {
            return new CookieManager({
                documentAlias: document,
                navigatorAlias: navigator,
                decodeWrapper: decodeURIComponent,
                encodeWrapper: encodeURIComponent,
                getCookiesConfig: () => ({
                    cookiesDisabled: false,
                    cookieNamePrefix: 'k3ui'
                })
            });
        }

        if (this.getInstance().options.cacheEnabled) {
            return ManagerRegistry.getInstance().get('cookie', () =>
                new CookieManager({
                    documentAlias: document,
                    navigatorAlias: navigator,
                    decodeWrapper: decodeURIComponent,
                    encodeWrapper: encodeURIComponent,
                    getCookiesConfig: () => ({
                        cookiesDisabled: false,
                        cookieNamePrefix: 'k3ui'
                    })
                })
            );
        }

        return new CookieManager({
            documentAlias: document,
            navigatorAlias: navigator,
            decodeWrapper: decodeURIComponent,
            encodeWrapper: encodeURIComponent,
            getCookiesConfig: () => ({
                cookiesDisabled: false,
                cookieNamePrefix: 'k3ui'
            })
        });
    }

    /**
     * Obtenir le PrivacyManager (consentement RGPD et inventaire des clés de stockage)
     * @returns Instance du PrivacyManager
     */
    static getPrivacyManager(): PrivacyManager {
        if (!this.getInstance().options.enabled) {
            return new PrivacyManager();
        }

        if (this.getInstance().options.cacheEnabled) {
            return ManagerRegistry.getInstance().get('privacy', () =>
                new PrivacyManager()
            );
        }

        return new PrivacyManager();
    }

    /**
     * Obtenir l'IconManager
     * @returns Instance de l'IconManager
     */
    static getIconManager(): typeof IconManager {
        return IconManager;
    }

    /**
     * Obtenir le ComponentRegistry
     * @returns Instance du ComponentRegistry
     */
    static getComponentRegistry(): ComponentRegistry {
        if (!this.getInstance().options.enabled) {
            return ComponentRegistry.getInstance();
        }

        if (this.getInstance().options.cacheEnabled) {
            return ManagerRegistry.getInstance().get('component-registry', () =>
                ComponentRegistry.getInstance()
            );
        }

        return ComponentRegistry.getInstance();
    }

    // ============================================================================
    // MÉTHODES GÉNÉRIQUES
    // ============================================================================

    /**
     * Obtenir un manager par nom
     * @param name Nom du manager
     * @param factory Factory pour créer le manager
     * @returns Instance du manager
     */
    static getManager<T>(name: string, factory: () => T): T {
        if (!this.getInstance().options.enabled) {
            return factory();
        }

        if (this.getInstance().options.cacheEnabled) {
            return ManagerRegistry.getInstance().get(name, factory);
        }

        return factory();
    }

    /**
     * Vérifier si un manager existe dans le cache
     * @param name Nom du manager
     * @returns true si le manager existe
     */
    static hasManager(name: string): boolean {
        if (!this.getInstance().options.cacheEnabled) {
            return false;
        }
        return ManagerRegistry.getInstance().has(name);
    }

    /**
     * Supprimer un manager du cache
     * @param name Nom du manager
     * @returns true si le manager a été supprimé
     */
    static removeManager(name: string): boolean {
        if (!this.getInstance().options.cacheEnabled) {
            return false;
        }
        return ManagerRegistry.getInstance().remove(name);
    }

    /**
     * Obtenir les statistiques de la factory
     * @returns Statistiques détaillées
     */
    static getStats() {
        if (!this.getInstance().options.cacheEnabled) {
            return {
                enabled: this.getInstance().options.enabled,
                cacheEnabled: false,
                totalManagers: 0,
                cachedManagers: 0
            };
        }

        const registryStats = ManagerRegistry.getInstance().getStats();
        return {
            enabled: this.getInstance().options.enabled,
            cacheEnabled: this.getInstance().options.cacheEnabled,
            maxCacheSize: this.getInstance().options.maxCacheSize,
            ...registryStats
        };
    }

    /**
     * Nettoyer le cache des managers
     */
    static cleanup(): void {
        if (this.getInstance().options.cacheEnabled) {
            ManagerRegistry.getInstance().cleanup();
        }
    }

    /**
     * Vider complètement le cache
     */
    static clear(): void {
        if (this.getInstance().options.cacheEnabled) {
            ManagerRegistry.getInstance().clear();
        }
    }

    /**
     * Détruire la factory et nettoyer les ressources
     */
    static destroy(): void {
        if (this.getInstance().options.cacheEnabled) {
            ManagerRegistry.getInstance().destroy();
        }
        this.instance = null;
    }

    // ============================================================================
    // MÉTHODES DE CONVENIENCE POUR LES COMPOSANTS
    // ============================================================================

    /**
     * Obtenir les managers essentiels pour un composant
     * @param componentName Nom du composant
     * @returns Objet contenant les managers essentiels
     */
    static getEssentialManagers(componentName: string) {
        return {
            logger: this.getLoggerManager(`[${componentName}]`),
            themeManager: this.getThemeManager(),
            iconManager: this.getIconManager()
        };
    }

    /**
     * Obtenir les managers pour les tests
     * @param options Options de configuration
     * @returns Objet contenant les managers pour les tests
     */
    static getTestManagers(_options: Partial<ManagerFactoryOptions> = {}) {
        // Désactiver le cache pour les tests
        const originalOptions = this.getInstance().options;
        this.getInstance().configure({
            enabled: true,
            cacheEnabled: false,
            maxCacheSize: 0
        });

        const managers = {
            logger: this.getLoggerManager('[Test]'),
            themeManager: this.getThemeManager(),
            hapticManager: this.getHapticManager(),
            soundFXManager: this.getSoundFXManager(),
            cookieManager: this.getCookieManager(),
            privacyManager: this.getPrivacyManager(),
            iconManager: this.getIconManager()
        };

        // Restaurer les options originales
        this.getInstance().configure(originalOptions);

        return managers;
    }
}
