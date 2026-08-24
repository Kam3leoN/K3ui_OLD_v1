/**
 * LoggerManager
 * @description Gestionnaire de logs pour le développement et le debug.
 * @privacy Ne journalise aucune donnée personnelle par conception : `userId` (LogContext) est
 * automatiquement redacté (masqué) avant affichage. Éviter de passer des valeurs de champs de
 * formulaire (email, mot de passe, numéro de carte, etc.) dans `data`/`state`/`params` — ces objets
 * sont sérialisés tels quels dans la console.
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

export type LoggerType = 'Manager' | 'Component' | 'Front-end';

export interface LogOptions {
  level?: LogLevel;
  prefix?: string;
  type?: LoggerType;
  timestamp?: boolean;
  colors?: boolean;
}

/**
 * Métadonnées contextuelles pour les logs
 */
export interface LogContext {
  /** ID de session/requête pour tracer une action spécifique */
  sessionId?: string;
  /** ID utilisateur */
  userId?: string;
  /** Version de l'application */
  version?: string;
  /** Environnement (dev/staging/production) */
  environment?: string;
}

/**
 * Informations de performance
 */
export interface LogPerformance {
  /** Durée d'exécution en ms */
  duration?: number;
  /** Mémoire utilisée en bytes */
  memory?: number;
  /** Taille des données (nombre d'éléments) */
  size?: number;
}

/**
 * Informations de stack trace
 */
export interface LogStackTrace {
  /** Nom du fichier source */
  file?: string;
  /** Numéro de ligne */
  line?: number;
  /** Stack trace complète */
  stack?: string;
}

/**
 * Informations système
 */
export interface LogSystem {
  /** User Agent (navigateur) */
  userAgent?: string;
  /** URL/Route actuelle */
  url?: string;
  /** Résolution écran */
  screenResolution?: string;
}

/**
 * Informations de corrélation
 */
export interface LogCorrelation {
  /** Trace ID pour suivre une opération */
  traceId?: string;
  /** Parent ID pour lier à une opération parente */
  parentId?: string;
  /** Request ID */
  requestId?: string;
}

/**
 * Métadonnées complètes pour un log
 */
export interface LogMetadata {
  /** Métadonnées contextuelles */
  context?: LogContext;
  /** Informations de performance */
  performance?: LogPerformance;
  /** Stack trace */
  stackTrace?: LogStackTrace;
  /** Informations système */
  system?: LogSystem;
  /** Corrélation */
  correlation?: LogCorrelation;
  /** Données structurées supplémentaires */
  data?: Record<string, unknown>;
  /** État du composant/manager */
  state?: Record<string, unknown>;
  /** Paramètres de la fonction */
  params?: Record<string, unknown>;
}

/** `performance.memory` (Chrome / Chromium). */
interface PerformanceMemorySnapshot {
  usedJSHeapSize?: number;
}

type PerformanceWithMemory = Performance & {
  memory?: PerformanceMemorySnapshot;
};

/** Argument libre passé aux méthodes de log (hors métadonnées structurées). */
type LogRestArg = unknown;

function readUsedJsHeapSize(): number | undefined {
  if (typeof performance === 'undefined') {
    return undefined;
  }
  return (performance as PerformanceWithMemory).memory?.usedJSHeapSize;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Détecte un contexte de développement local (localhost/127.0.0.1/IP privée/fichier local)
 * @description Utilisé pour déterminer le niveau de log par défaut : en production (hors localhost),
 * seuls WARN/ERROR sont journalisés par défaut afin de limiter le bruit et l'exposition d'informations
 * techniques dans la console des utilisateurs finaux.
 */
function isLocalHostEnvironment(): boolean {
  if (typeof window === 'undefined' || !window.location) {
    return true;
  }
  const hostname = window.location.hostname;
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '' ||
    hostname === '::1' ||
    window.location.protocol === 'file:'
  );
}

/** Valeur affichée à la place d'une donnée sensible redactée */
const REDACTED_PLACEHOLDER = '[redacted]';

/**
 * Classe LoggerManager pour la gestion des logs
 */
export class LoggerManager {
  private level: LogLevel;
  private prefix: string;
  private type: LoggerType;
  private timestamp: boolean;
  private colors: boolean;
  private defaultContext: LogContext;
  private defaultSystem: LogSystem;

  constructor(options: LogOptions = {}) {
    // Hors localhost (production), on limite le bruit/l'exposition d'infos techniques : WARN par défaut.
    this.level = options.level ?? (isLocalHostEnvironment() ? LogLevel.INFO : LogLevel.WARN);
    this.prefix = options.prefix ?? '[K3UI]';
    this.type = options.type ?? 'Front-end';
    this.timestamp = options.timestamp ?? true;
    this.colors = options.colors ?? true;
    
    // Initialiser les métadonnées par défaut
    this.defaultContext = {
      version: '0.1.0',
      environment: typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'dev' : 'production'
    };
    
    this.defaultSystem = {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      screenResolution: typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : undefined
    };
  }

  /**
   * Génère un timestamp formaté
   */
  private getTimestamp(): string {
    if (!this.timestamp) return '';
    const now = new Date();
    return `[${now.toLocaleTimeString()}] `;
  }

  /**
   * Extrait le nom du préfixe (sans les crochets)
   */
  private extractName(): string {
    // Enlever les crochets du préfixe [ThemeManager] -> ThemeManager
    let name = this.prefix.replace(/^\[|\]$/g, '');
    
    // Si c'est Front-end, utiliser "K3UI"
    if (this.type === 'Front-end') {
      return 'K3UI';
    }
    
    // Si c'est un Manager, enlever "Manager" du nom
    if (this.type === 'Manager' && name.endsWith('Manager')) {
      name = name.replace(/Manager$/, '');
    }
    
    // Si c'est un Component, garder tel quel
    return name;
  }

  /**
   * Génère un ID de trace unique
   */
  private generateTraceId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }

  /**
   * Extrait les informations de stack trace
   */
  private getStackTrace(): LogStackTrace {
    try {
      const stack = new Error().stack;
      if (stack) {
        const lines = stack.split('\n');
        // Chercher la ligne qui contient le fichier source (ignorer les lignes du LoggerManager)
        for (let i = 2; i < lines.length; i++) {
          const line = lines[i];
          // Format: "    at functionName (file:///path/to/file.ts:123:45)"
          const match = line.match(/\((.+):(\d+):(\d+)\)/);
          if (match) {
            const filePath = match[1];
            const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || filePath;
            return {
              file: fileName,
              line: parseInt(match[2], 10),
              stack: stack
            };
          }
        }
      }
    } catch (e) {
      // Ignorer les erreurs de stack trace
    }
    return {};
  }

  /**
   * Formate les métadonnées pour l'affichage
   */
  private formatMetadata(metadata?: LogMetadata, includeStackTrace: boolean = false): string {
    if (!metadata) return '';

    const parts: string[] = [];
    
    // Context
    if (metadata.context) {
      const ctx = metadata.context;
      if (ctx.sessionId) parts.push(`session=${ctx.sessionId}`);
      if (ctx.userId) parts.push(`user=${ctx.userId}`);
      if (ctx.version) parts.push(`v=${ctx.version}`);
      if (ctx.environment) parts.push(`env=${ctx.environment}`);
    }

    // Performance
    if (metadata.performance) {
      const perf = metadata.performance;
      if (perf.duration !== undefined) parts.push(`duration=${perf.duration}ms`);
      if (perf.memory !== undefined) parts.push(`memory=${(perf.memory / 1024).toFixed(2)}KB`);
      if (perf.size !== undefined) parts.push(`size=${perf.size}`);
    }

    // Correlation
    if (metadata.correlation) {
      const corr = metadata.correlation;
      if (corr.traceId) parts.push(`trace=${corr.traceId}`);
      if (corr.parentId) parts.push(`parent=${corr.parentId}`);
      if (corr.requestId) parts.push(`request=${corr.requestId}`);
    }

    // Stack trace (seulement pour les erreurs)
    if (includeStackTrace && metadata.stackTrace) {
      const st = metadata.stackTrace;
      if (st.file) parts.push(`file=${st.file}`);
      if (st.line) parts.push(`line=${st.line}`);
    }

    // System (seulement si différent des valeurs par défaut)
    if (metadata.system) {
      const sys = metadata.system;
      if (sys.url && sys.url !== this.defaultSystem.url) parts.push(`url=${sys.url}`);
    }

    // State
    if (metadata.state && Object.keys(metadata.state).length > 0) {
      parts.push(`state=${JSON.stringify(metadata.state)}`);
    }

    // Params
    if (metadata.params && Object.keys(metadata.params).length > 0) {
      parts.push(`params=${JSON.stringify(metadata.params)}`);
    }

    // Data supplémentaire
    if (metadata.data && Object.keys(metadata.data).length > 0) {
      parts.push(`data=${JSON.stringify(metadata.data)}`);
    }

    return parts.length > 0 ? ` | ${parts.join(' | ')}` : '';
  }

  /**
   * Formate le message selon les meilleures pratiques
   * Format: [timestamp] Type:Name | LEVEL:message | metadata
   */
  private formatMessage(level: string, message: string, metadata?: LogMetadata, includeStackTrace: boolean = false): string {
    const timestamp = this.getTimestamp();
    const name = this.extractName();
    const source = this.type === 'Front-end' ? name : `${this.type}:${name}`;
    const metadataStr = this.formatMetadata(metadata, includeStackTrace);
    return `${timestamp}${source} | ${level}: ${message}${metadataStr}`;
  }

  /**
   * Fusionne les métadonnées avec les valeurs par défaut
   */
  private mergeMetadata(metadata?: LogMetadata, autoStackTrace: boolean = false): LogMetadata {
    const mergedContext: LogContext = { ...this.defaultContext, ...metadata?.context };
    // RGPD : ne jamais journaliser un identifiant utilisateur en clair.
    if (mergedContext.userId) {
      mergedContext.userId = REDACTED_PLACEHOLDER;
    }

    const merged: LogMetadata = {
      context: mergedContext,
      system: { ...this.defaultSystem, ...metadata?.system },
      correlation: metadata?.correlation || {},
      performance: metadata?.performance,
      data: metadata?.data,
      state: metadata?.state,
      params: metadata?.params
    };

    // Ajouter stack trace automatiquement si demandé
    if (autoStackTrace && !merged.stackTrace) {
      merged.stackTrace = this.getStackTrace();
    } else if (metadata?.stackTrace) {
      merged.stackTrace = metadata.stackTrace;
    }

    // Générer un traceId si non fourni
    if (!merged.correlation?.traceId) {
      merged.correlation = { ...merged.correlation, traceId: this.generateTraceId() };
    }

    return merged;
  }

  /**
   * Détecte si le deuxième argument est des métadonnées ou des args
   */
  private isMetadata(arg: unknown): arg is LogMetadata {
    if (!arg || typeof arg !== 'object' || Array.isArray(arg)) {
      return false;
    }
    const record = arg as Record<string, unknown>;
    return (
      'context' in record ||
      'performance' in record ||
      'stackTrace' in record ||
      'system' in record ||
      'correlation' in record ||
      'data' in record ||
      'state' in record ||
      'params' in record
    );
  }

  /**
   * Log de niveau DEBUG
   */
  debug(message: string, metadataOrArg?: LogMetadata | LogRestArg, ...args: LogRestArg[]): void {
    if (this.level <= LogLevel.DEBUG) {
      const metadata = this.isMetadata(metadataOrArg) ? metadataOrArg : undefined;
      const additionalArgs = this.isMetadata(metadataOrArg) ? args : (metadataOrArg !== undefined ? [metadataOrArg, ...args] : args);
      const mergedMetadata = this.mergeMetadata(metadata);
      const formattedMessage = this.formatMessage('DEBUG', message, mergedMetadata);
      if (this.colors) {
        console.debug(`%c${formattedMessage}`, 'color: #6c757d; font-weight: normal;', ...additionalArgs);
      } else {
        console.debug(formattedMessage, ...additionalArgs);
      }
      // Afficher les données structurées si présentes
      if (mergedMetadata.data) {
        console.debug('Data:', mergedMetadata.data);
      }
    }
  }

  /**
   * Log de niveau INFO
   */
  info(message: string, metadataOrArg?: LogMetadata | LogRestArg, ...args: LogRestArg[]): void {
    if (this.level <= LogLevel.INFO) {
      const metadata = this.isMetadata(metadataOrArg) ? metadataOrArg : undefined;
      const additionalArgs = this.isMetadata(metadataOrArg) ? args : (metadataOrArg !== undefined ? [metadataOrArg, ...args] : args);
      const mergedMetadata = this.mergeMetadata(metadata);
      const formattedMessage = this.formatMessage('INFO', message, mergedMetadata);
      if (this.colors) {
        console.info(`%c${formattedMessage}`, 'color: #0d6efd; font-weight: bold;', ...additionalArgs);
      } else {
        console.info(formattedMessage, ...additionalArgs);
      }
      // Afficher les données structurées si présentes
      if (mergedMetadata.data) {
        console.info('Data:', mergedMetadata.data);
      }
    }
  }

  /**
   * Log de niveau WARN
   */
  warn(message: string, metadataOrArg?: LogMetadata | LogRestArg, ...args: LogRestArg[]): void {
    if (this.level <= LogLevel.WARN) {
      const metadata = this.isMetadata(metadataOrArg) ? metadataOrArg : undefined;
      const additionalArgs = this.isMetadata(metadataOrArg) ? args : (metadataOrArg !== undefined ? [metadataOrArg, ...args] : args);
      const mergedMetadata = this.mergeMetadata(metadata);
      const formattedMessage = this.formatMessage('WARN', message, mergedMetadata);
      if (this.colors) {
        console.warn(`%c${formattedMessage}`, 'color: #ffc107; font-weight: bold;', ...additionalArgs);
      } else {
        console.warn(formattedMessage, ...additionalArgs);
      }
      // Afficher les données structurées si présentes
      if (mergedMetadata.data) {
        console.warn('Data:', mergedMetadata.data);
      }
    }
  }

  /**
   * Log de niveau ERROR
   */
  error(message: string, metadataOrArg?: LogMetadata | LogRestArg, ...args: LogRestArg[]): void {
    if (this.level <= LogLevel.ERROR) {
      const metadata = this.isMetadata(metadataOrArg) ? metadataOrArg : undefined;
      const additionalArgs = this.isMetadata(metadataOrArg) ? args : (metadataOrArg !== undefined ? [metadataOrArg, ...args] : args);
      const mergedMetadata = this.mergeMetadata(metadata, true); // Auto stack trace pour les erreurs
      const formattedMessage = this.formatMessage('ERROR', message, mergedMetadata, true);
      if (this.colors) {
        console.error(`%c${formattedMessage}`, 'color: #dc3545; font-weight: bold;', ...additionalArgs);
      } else {
        console.error(formattedMessage, ...additionalArgs);
      }
      // Afficher la stack trace complète si présente
      if (mergedMetadata.stackTrace?.stack) {
        console.error('Stack:', mergedMetadata.stackTrace.stack);
      }
      // Afficher les données structurées si présentes
      if (mergedMetadata.data) {
        console.error('Data:', mergedMetadata.data);
      }
    }
  }

  /**
   * Log de succès (niveau INFO avec couleur verte)
   */
  success(message: string, metadataOrArg?: LogMetadata | LogRestArg, ...args: LogRestArg[]): void {
    if (this.level <= LogLevel.INFO) {
      const metadata = this.isMetadata(metadataOrArg) ? metadataOrArg : undefined;
      const additionalArgs = this.isMetadata(metadataOrArg) ? args : (metadataOrArg !== undefined ? [metadataOrArg, ...args] : args);
      const mergedMetadata = this.mergeMetadata(metadata);
      const formattedMessage = this.formatMessage('SUCCESS', message, mergedMetadata);
      if (this.colors) {
        console.info(`%c${formattedMessage}`, 'color: #198754; font-weight: bold;', ...additionalArgs);
      } else {
        console.info(formattedMessage, ...additionalArgs);
      }
      // Afficher les données structurées si présentes
      if (mergedMetadata.data) {
        console.info('Data:', mergedMetadata.data);
      }
    }
  }

  /**
   * Log de groupe pour organiser les logs
   */
  group(label: string, collapsed: boolean = false): void {
    if (this.level <= LogLevel.INFO) {
      if (collapsed) {
        console.groupCollapsed(label);
      } else {
        console.group(label);
      }
    }
  }

  /**
   * Ferme un groupe de logs
   */
  groupEnd(): void {
    if (this.level <= LogLevel.INFO) {
      console.groupEnd();
    }
  }

  /**
   * Log d'une table pour les objets complexes
   */
  table(data: unknown, columns?: string[]): void {
    if (this.level <= LogLevel.INFO) {
      console.table(data, columns);
    }
  }

  /**
   * Log d'un objet avec formatage
   */
  object(obj: unknown, label?: string): void {
    if (this.level <= LogLevel.INFO) {
      if (label) {
        console.log(`${this.prefix} ${label}:`, obj);
      } else {
        console.log(`${this.prefix} Object:`, obj);
      }
    }
  }

  /**
   * Mesure le temps d'exécution
   */
  time(label: string): void {
    if (this.level <= LogLevel.INFO) {
      console.time(`${this.prefix} ${label}`);
    }
  }

  /**
   * Termine la mesure de temps
   */
  timeEnd(label: string): void {
    if (this.level <= LogLevel.INFO) {
      console.timeEnd(`${this.prefix} ${label}`);
    }
  }

  /**
   * Définit le niveau de log
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Définit le préfixe
   */
  setPrefix(prefix: string): void {
    this.prefix = prefix;
  }

  /**
   * Active/désactive les timestamps
   */
  setTimestamp(enabled: boolean): void {
    this.timestamp = enabled;
  }

  /**
   * Active/désactive les couleurs
   */
  setColors(enabled: boolean): void {
    this.colors = enabled;
  }

  /**
   * Définit le contexte par défaut
   */
  setDefaultContext(context: Partial<LogContext>): void {
    this.defaultContext = { ...this.defaultContext, ...context };
  }

  /**
   * Définit les informations système par défaut
   */
  setDefaultSystem(system: Partial<LogSystem>): void {
    this.defaultSystem = { ...this.defaultSystem, ...system };
  }

  /**
   * Mesure la performance d'une opération et log le résultat
   */
  async measurePerformance<T>(
    label: string,
    operation: () => T | Promise<T>,
    metadata?: LogMetadata
  ): Promise<T> {
    const startTime = performance.now();
    const startMemory = readUsedJsHeapSize();
    
    try {
      const result = await operation();
      const endTime = performance.now();
      const endMemory = readUsedJsHeapSize();
      const duration = endTime - startTime;
      const memoryDelta = startMemory && endMemory ? endMemory - startMemory : undefined;

      const perfMetadata: LogMetadata = {
        ...metadata,
        performance: {
          ...metadata?.performance,
          duration: Math.round(duration),
          memory: memoryDelta,
          size: metadata?.performance?.size
        }
      };

      this.info(`${label} completed`, perfMetadata);
      return result;
    } catch (error: unknown) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      const perfMetadata: LogMetadata = {
        ...metadata,
        performance: {
          ...metadata?.performance,
          duration: Math.round(duration)
        },
        data: {
          ...metadata?.data,
          error: getErrorMessage(error)
        }
      };

      this.error(`${label} failed`, perfMetadata);
      throw error;
    }
  }

  /**
   * Crée une instance avec un préfixe spécifique
   */
  static create(prefix: string, type?: LoggerType, options?: LogOptions): LoggerManager {
    // Détecter automatiquement le type si non fourni
    if (!type) {
      if (prefix.includes('Manager') || prefix.includes('Registry')) {
        type = 'Manager';
      } else if (prefix.includes('Component') || prefix === '[Component]') {
        type = 'Component';
      } else {
        // Par défaut, considérer comme Component si c'est un nom de composant
        // Sinon Front-end
        type = 'Front-end';
      }
    }
    return new LoggerManager({ ...options, prefix, type });
  }

  /**
   * Instance globale par défaut
   */
  static readonly global = new LoggerManager();
}

// Export des méthodes statiques pour utilisation directe
export const logger = LoggerManager.global;
export const debug = logger.debug.bind(logger);
export const info = logger.info.bind(logger);
export const warn = logger.warn.bind(logger);
export const error = logger.error.bind(logger);
export const success = logger.success.bind(logger);