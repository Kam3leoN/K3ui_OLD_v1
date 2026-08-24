/**
 * @fileoverview Types pour les managers K3UI
 * @description Interfaces et types complets pour tous les managers
 * @author K3UI Team
 * @version 1.0.0
 */

import { BaseOptions } from '../base/options';
import { PriorityLevel } from '../base/priority';
import type { Component } from '../components/component-base';
import type {
    ManagerConfigMap,
    ManagerEventData,
    ManagerLogData,
    ManagerStoredValue,
} from './manager-data';

// ============================================================================
// INTERFACES DE BASE POUR LES MANAGERS
// ============================================================================

/**
 * Interface de base pour tous les managers
 * @description Tous les managers doivent implémenter cette interface
 */
export interface IManager {
    /** Nom du manager */
    name: string;
    /** Options du manager */
    options: BaseOptions;
    /** Options par défaut */
    defaults: BaseOptions;
    /** Initialiser le manager */
    init(): void;
    /** Détruire le manager */
    destroy(): void;
    /** Définir les options */
    setOptions(opts: Partial<BaseOptions>): void;
    /** Vérifier si le manager est initialisé */
    isInitialized(): boolean;
    /** Obtenir l'état du manager */
    getState(): ManagerState;
}

/**
 * Interface pour les managers avec instance unique (Singleton)
 */
export interface ISingletonManager extends IManager {
    /** Récupérer l'instance unique */
    getInstance(): IManager;
    /** Vérifier si l'instance existe */
    hasInstance(): boolean;
    /** Créer l'instance si elle n'existe pas */
    createInstance(): IManager;
}

/**
 * Interface pour les managers avec instances multiples
 */
export interface IMultiInstanceManager extends IManager {
    /** Récupérer une instance par ID */
    getInstance(id: string): IManager | null;
    /** Créer une nouvelle instance */
    createInstance(id: string, options?: BaseOptions): IManager;
    /** Supprimer une instance */
    removeInstance(id: string): boolean;
    /** Obtenir toutes les instances */
    getAllInstances(): Map<string, IManager>;
    /** Vérifier si une instance existe */
    hasInstance(id: string): boolean;
    /** Obtenir le nombre d'instances */
    getInstanceCount(): number;
}

/**
 * Interface pour les managers avec priorité
 */
export interface IPrioritizedManager extends IManager {
    /** Niveau de priorité du manager */
    priority: PriorityLevel;
    /** Définir la priorité */
    setPriority(priority: PriorityLevel): void;
    /** Vérifier si la priorité est plus élevée */
    hasHigherPriority(priority: PriorityLevel): boolean;
}

/**
 * Interface pour les managers avec événements
 */
export interface IEventManager extends IManager {
    /** Écouter un événement */
    on(event: string, handler: Function): void;
    /** Arrêter d'écouter un événement */
    off(event: string, handler: Function): void;
    /** Émettre un événement */
    emit(event: string, data?: ManagerEventData): void;
    /** Écouter un événement une seule fois */
    once(event: string, handler: Function): void;
}

/**
 * Interface pour les managers avec configuration
 */
export interface IConfigurableManager extends IManager {
    /** Charger la configuration */
    loadConfig(): void;
    /** Sauvegarder la configuration */
    saveConfig(): void;
    /** Réinitialiser la configuration */
    resetConfig(): void;
    /** Valider la configuration */
    validateConfig(): boolean;
    /** Obtenir la configuration */
    getConfig(): ManagerConfigMap;
    /** Définir la configuration */
    setConfig(config: ManagerConfigMap): void;
}

/**
 * Interface pour les managers avec cache
 */
export interface ICacheableManager extends IManager {
    /** Mettre en cache */
    cache(key: string, value: ManagerStoredValue): void;
    /** Récupérer du cache */
    getCache(key: string): ManagerStoredValue | undefined;
    /** Supprimer du cache */
    removeCache(key: string): void;
    /** Vider le cache */
    clearCache(): void;
    /** Obtenir la taille du cache */
    getCacheSize(): number;
    /** Vérifier si une clé existe dans le cache */
    hasCache(key: string): boolean;
}

/**
 * Interface pour les managers avec persistance
 */
export interface IPersistentManager extends IManager {
    /** Sauvegarder l'état */
    save(): void;
    /** Charger l'état */
    load(): void;
    /** Exporter l'état */
    export(): string;
    /** Importer l'état */
    import(data: string): void;
    /** Vérifier si l'état est sauvegardé */
    isSaved(): boolean;
}

// ============================================================================
// TYPES POUR LES ÉTATS DES MANAGERS
// ============================================================================

/**
 * État d'un manager
 */
export type ManagerState =
    | 'uninitialized'
    | 'initializing'
    | 'initialized'
    | 'running'
    | 'paused'
    | 'stopping'
    | 'stopped'
    | 'error'
    | 'destroyed';

/**
 * Niveau de priorité des managers
 */
export type ManagerPriority =
    | 'critical'
    | 'high'
    | 'medium'
    | 'low'
    | 'background';

/**
 * Type de manager
 */
export type ManagerType =
    | 'singleton'
    | 'multi-instance'
    | 'factory'
    | 'service'
    | 'utility';

// ============================================================================
// INTERFACES SPÉCIFIQUES AUX MANAGERS
// ============================================================================

/**
 * Interface pour le ComponentManager
 */
export interface IComponentManager extends IManager, IMultiInstanceManager, IPrioritizedManager {
    /** Enregistrer un composant */
    register(element: HTMLElement, component: Component<BaseOptions>, priority: PriorityLevel): boolean;
    /** Désenregistrer un composant */
    unregister(element: HTMLElement): void;
    /** Obtenir l'instance d'un composant */
    getComponentInstance(element: HTMLElement): Component<BaseOptions> | null;
    /** Vérifier si un composant est enregistré */
    isComponentRegistered(element: HTMLElement): boolean;
    /** Obtenir tous les composants enregistrés */
    getAllComponents(): Map<HTMLElement, Component<BaseOptions>>;
}

/**
 * Interface pour le ThemeManager
 */
export interface IThemeManager extends IManager, ISingletonManager, IConfigurableManager, IEventManager {
    /** Obtenir le thème actuel */
    getCurrentTheme(): string;
    /** Définir le thème */
    setTheme(theme: string): void;
    /** Basculer le thème */
    toggleTheme(): void;
    /** Réinitialiser le thème */
    resetTheme(): void;
    /** Obtenir la liste des thèmes disponibles */
    getAvailableThemes(): string[];
    /** Vérifier si un thème existe */
    hasTheme(theme: string): boolean;
    /** Appliquer le thème */
    applyTheme(theme: string): void;
}

/**
 * Interface pour le LoggerManager
 */
export interface ILoggerManager extends IManager, ISingletonManager, IConfigurableManager {
    /** Logger un message */
    log(level: LogLevel, message: string, data?: ManagerLogData): void;
    /** Logger une erreur */
    error(message: string, error?: Error): void;
    /** Logger un avertissement */
    warn(message: string, data?: ManagerLogData): void;
    /** Logger une information */
    info(message: string, data?: ManagerLogData): void;
    /** Logger un debug */
    debug(message: string, data?: ManagerLogData): void;
    /** Définir le niveau de log */
    setLevel(level: LogLevel): void;
    /** Obtenir le niveau de log */
    getLevel(): LogLevel;
    /** Vider les logs */
    clear(): void;
    /** Obtenir les logs */
    getLogs(): LogEntry[];
}

/**
 * Interface pour le IconManager
 */
export interface IIconManager extends IManager, ISingletonManager, ICacheableManager {
    /** Charger une icône */
    loadIcon(name: string, path?: string): Promise<string>;
    /** Obtenir une icône */
    getIcon(name: string): string | null;
    /** Vérifier si une icône existe */
    hasIcon(name: string): boolean;
    /** Obtenir la liste des icônes */
    getAvailableIcons(): string[];
    /** Précharger des icônes */
    preloadIcons(icons: string[]): Promise<void>;
    /** Définir le dossier des icônes */
    setIconFolder(folder: string): void;
    /** Obtenir le dossier des icônes */
    getIconFolder(): string;
}

/**
 * Interface pour le StorageManager
 */
export interface IStorageManager extends IManager, ISingletonManager, IPersistentManager {
    /** Sauvegarder une valeur */
    setItem(key: string, value: ManagerStoredValue): void;
    /** Récupérer une valeur */
    getItem(key: string): ManagerStoredValue | undefined;
    /** Supprimer une valeur */
    removeItem(key: string): void;
    /** Vider le stockage */
    clear(): void;
    /** Obtenir la taille du stockage */
    getSize(): number;
    /** Vérifier si une clé existe */
    hasItem(key: string): boolean;
    /** Obtenir toutes les clés */
    getKeys(): string[];
    /** Obtenir toutes les valeurs */
    getValues(): ManagerStoredValue[];
    /** Obtenir tous les éléments */
    getAll(): Record<string, ManagerStoredValue>;
}

// ============================================================================
// TYPES POUR LES LOGS
// ============================================================================

/**
 * Niveaux de log
 */
export type LogLevel =
    | 'debug'
    | 'info'
    | 'warn'
    | 'error'
    | 'fatal';

/**
 * Interface pour une entrée de log
 */
export interface LogEntry {
    /** Niveau du log */
    level: LogLevel;
    /** Message du log */
    message: string;
    /** Données du log */
    data?: ManagerLogData;
    /** Timestamp du log */
    timestamp: number;
    /** Source du log */
    source: string;
    /** ID du log */
    id: string;
}

/**
 * Interface pour la configuration des logs
 */
export interface LogConfig {
    /** Niveau minimum de log */
    level: LogLevel;
    /** Si les logs doivent être sauvegardés */
    save: boolean;
    /** Si les logs doivent être affichés dans la console */
    console: boolean;
    /** Taille maximale du buffer de logs */
    maxBufferSize: number;
    /** Format des logs */
    format: string;
    /** Filtres de logs */
    filters: LogFilter[];
}

/**
 * Interface pour un filtre de log
 */
export interface LogFilter {
    /** Type de filtre */
    type: 'level' | 'source' | 'message' | 'custom';
    /** Valeur du filtre */
    value: string | number | boolean | LogLevel;
    /** Fonction de filtre personnalisée */
    function?: (entry: LogEntry) => boolean;
}

// ============================================================================
// TYPES POUR LES ÉVÉNEMENTS DES MANAGERS
// ============================================================================

/**
 * Interface pour les événements de manager
 */
export interface ManagerEvent {
    /** Type d'événement */
    type: string;
    /** Données de l'événement */
    data: ManagerEventData;
    /** Timestamp de l'événement */
    timestamp: number;
    /** Source de l'événement */
    source: string;
    /** ID de l'événement */
    id: string;
}

/**
 * Interface pour les événements de cycle de vie des managers
 */
export interface ManagerLifecycleEvent extends ManagerEvent {
    /** Phase du cycle de vie */
    phase: 'init' | 'start' | 'pause' | 'resume' | 'stop' | 'destroy';
    /** Manager concerné */
    manager: string;
    /** Durée de la phase */
    duration?: number;
}

// ============================================================================
// TYPES POUR LA CONFIGURATION DES MANAGERS
// ============================================================================

/**
 * Interface pour la configuration d'un manager
 */
export interface ManagerConfig {
    /** Nom du manager */
    name: string;
    /** Type du manager */
    type: ManagerType;
    /** Priorité du manager */
    priority: ManagerPriority;
    /** Si le manager est activé */
    enabled: boolean;
    /** Si le manager est persistant */
    persistent: boolean;
    /** Si le manager est caché */
    cacheable: boolean;
    /** Options du manager */
    options: BaseOptions;
    /** Dépendances du manager */
    dependencies: string[];
    /** Callbacks du manager */
    callbacks: ManagerCallbacks;
}

/**
 * Interface pour les callbacks d'un manager
 */
export interface ManagerCallbacks {
    /** Callback d'initialisation */
    onInit?: () => void;
    /** Callback de démarrage */
    onStart?: () => void;
    /** Callback de pause */
    onPause?: () => void;
    /** Callback de reprise */
    onResume?: () => void;
    /** Callback d'arrêt */
    onStop?: () => void;
    /** Callback de destruction */
    onDestroy?: () => void;
    /** Callback d'erreur */
    onError?: (error: Error) => void;
    /** Callback de changement d'état */
    onStateChange?: (state: ManagerState) => void;
}

// ============================================================================
// TYPES POUR LA GESTION DES MANAGERS
// ============================================================================

/**
 * Interface pour le gestionnaire de managers
 */
export interface IManagerRegistry {
    /** Enregistrer un manager */
    register(manager: IManager): void;
    /** Désenregistrer un manager */
    unregister(name: string): void;
    /** Obtenir un manager */
    getManager(name: string): IManager | null;
    /** Vérifier si un manager existe */
    hasManager(name: string): boolean;
    /** Obtenir tous les managers */
    getAllManagers(): Map<string, IManager>;
    /** Initialiser tous les managers */
    initAll(): void;
    /** Détruire tous les managers */
    destroyAll(): void;
    /** Obtenir l'état de tous les managers */
    getAllStates(): Map<string, ManagerState>;
}

// ============================================================================
// CONSTANTES POUR LES MANAGERS
// ============================================================================

/**
 * États des managers par défaut
 */
export const MANAGER_STATES = {
    UNINITIALIZED: 'uninitialized' as const,
    INITIALIZING: 'initializing' as const,
    INITIALIZED: 'initialized' as const,
    RUNNING: 'running' as const,
    PAUSED: 'paused' as const,
    STOPPING: 'stopping' as const,
    STOPPED: 'stopped' as const,
    ERROR: 'error' as const,
    DESTROYED: 'destroyed' as const
} as const;

/**
 * Priorités des managers par défaut
 */
export const MANAGER_PRIORITIES = {
    CRITICAL: 'critical' as const,
    HIGH: 'high' as const,
    MEDIUM: 'medium' as const,
    LOW: 'low' as const,
    BACKGROUND: 'background' as const
} as const;

/**
 * Types de managers par défaut
 */
export const MANAGER_TYPES = {
    SINGLETON: 'singleton' as const,
    MULTI_INSTANCE: 'multi-instance' as const,
    FACTORY: 'factory' as const,
    SERVICE: 'service' as const,
    UTILITY: 'utility' as const
} as const;

/**
 * Niveaux de log par défaut
 */
export const LOG_LEVELS = {
    DEBUG: 'debug' as const,
    INFO: 'info' as const,
    WARN: 'warn' as const,
    ERROR: 'error' as const,
    FATAL: 'fatal' as const
} as const;
