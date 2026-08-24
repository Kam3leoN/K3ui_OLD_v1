/**
 * @fileoverview Gestionnaire unifié de cookies avec support TypeScript
 * @description Utilitaire bas niveau de lecture/écriture de cookies (lecture, écriture, suppression,
 * test de support navigateur). Ne fait AUCUN tracking et n'embarque aucune dépendance analytics
 * (ex. Matomo/AMP) : c'est à l'application hôte de décider quels cookies créer et pourquoi.
 * Passe automatiquement l'attribut `Secure` lorsque la page est chargée en HTTPS.
 * @author K3UI Team
 * @version 1.0.0
 */

import { LoggerManager } from './LoggerManager';

/**
 * Configuration des cookies
 */
export interface CookieConfig {
    /**
     * Indique si les cookies sont désactivés
     * @default false
     */
    cookiesDisabled: boolean;
    /**
     * Préfixe pour les noms de cookies
     * @default 'k3ui'
     */
    cookieNamePrefix: string;
    /**
     * Durée d'expiration par défaut en millisecondes
     * @default 31536000000 (1 an)
     */
    msToExpire?: number;
    /**
     * Chemin par défaut pour les cookies
     * @default '/'
     */
    path?: string;
    /**
     * Domaine par défaut pour les cookies
     * @default undefined
     */
    domain?: string;
    /**
     * Indique si les cookies doivent être sécurisés
     * @default false
     */
    isSecure?: boolean;
}

/**
 * Configuration pour l'écriture d'un cookie individuel
 */
export interface SetCookieConfig {
    /**
     * Durée d'expiration en millisecondes
     * @default undefined
     */
    msToExpire?: number;
    /**
     * Chemin du cookie
     * @default '/'
     */
    path?: string;
    /**
     * Domaine du cookie
     * @default undefined
     */
    domain?: string;
    /**
     * Indique si le cookie doit être sécurisé
     * @default false
     */
    isSecure?: boolean;
    /**
     * Politique SameSite
     * @default 'Lax'
     */
    sameSite?: 'Strict' | 'Lax' | 'None';
}

/**
 * Dépendances injectées dans le CookieManager
 */
export interface CookieManagerDependencies {
    /**
     * Alias pour document
     */
    documentAlias: Document;
    /**
     * Alias pour navigator
     */
    navigatorAlias: Navigator;
    /**
     * Fonction de décodage
     */
    decodeWrapper: (value: string) => string;
    /**
     * Fonction d'encodage
     */
    encodeWrapper: (value: string | number | boolean) => string;
    /**
     * Fonction pour obtenir la configuration des cookies
     */
    getCookiesConfig: () => CookieConfig;
}

/**
 * Résultat d'un test de cookies
 */
export type CookieTestResult = '1' | '0' | boolean;

/**
 * Options par défaut du CookieManager
 */
const _defaults: CookieConfig = {
    cookiesDisabled: false,
    cookieNamePrefix: 'k3ui',
    msToExpire: 31536000000, // 1 an
    path: '/',
    domain: undefined,
    isSecure: false,
};

/**
 * Gestionnaire unifié de cookies avec support TypeScript
 * @description Utilitaire bas niveau (lecture/écriture/suppression), sans tracking ni analytics
 */
export class CookieManager {
    private static readonly CACHE_DURATION = 5000; // 5 secondes
    private static readonly VALID_SAMESITE_VALUES: ReadonlyArray<string> = ['Strict', 'Lax', 'None'];

    private cookiesConfigCache: CookieConfig | null = null;
    private cacheTimestamp = 0;
    private logger: LoggerManager;

    constructor(private dependencies: CookieManagerDependencies) {
        this.logger = new LoggerManager({ prefix: '[CookieManager]' });
    }

    /**
     * Obtient la configuration avec mise en cache
     * @returns La configuration des cookies
     */
    private getCachedConfig(): CookieConfig {
        const now = Date.now();
        if (!this.cookiesConfigCache || (now - this.cacheTimestamp) > CookieManager.CACHE_DURATION) {
            this.cookiesConfigCache = this.dependencies.getCookiesConfig();
            this.cacheTimestamp = now;
        }
        return this.cookiesConfigCache;
    }

    /**
     * Détecte si la page est chargée en contexte sécurisé (HTTPS)
     * @returns true si `location.protocol === 'https:'`
     */
    private static isHttpsContext(): boolean {
        return typeof location !== 'undefined' && location.protocol === 'https:';
    }

    /**
     * Compose une chaîne de cookie complète avec validation
     * @param cookieName - Le nom du cookie
     * @param value - La valeur du cookie
     * @param config - La configuration du cookie
     * @returns La chaîne de cookie composée
     * @throws Error si le nom du cookie est invalide
     */
    private composeCookie(cookieName: string, value: string, config: SetCookieConfig = {}): string {
        if (!cookieName || typeof cookieName !== 'string') {
            throw new Error('Cookie name must be a non-empty string');
        }

        const {
            msToExpire,
            path = '/',
            domain,
            isSecure,
            sameSite = 'Lax'
        } = config;

        const parts: string[] = [`${cookieName}=${encodeURIComponent(value)}`];

        // Gestion de l'expiration
        if (msToExpire) {
            const expiryDate = new Date(Date.now() + msToExpire);
            parts.push(`expires=${expiryDate.toUTCString()}`);
        }

        // Path
        parts.push(`path=${path}`);

        // Domain (avec validation basique)
        if (domain && typeof domain === 'string' && domain.length > 0) {
            parts.push(`domain=${domain}`);
        }

        // Sécurité : respecte le choix explicite, sinon préfère Secure en contexte HTTPS
        const resolvedSecure = isSecure !== undefined ? isSecure : CookieManager.isHttpsContext();
        if (resolvedSecure) {
            parts.push('secure');
        }

        // SameSite avec validation
        if (CookieManager.VALID_SAMESITE_VALUES.includes(sameSite)) {
            parts.push(`SameSite=${sameSite}`);

            // Si SameSite=None, Secure est obligatoire
            if (sameSite === 'None' && !resolvedSecure) {
                this.logger.warn('SameSite=None requires Secure attribute');
            }
        }

        return parts.join(';');
    }

    /**
     * Génère un nom de cookie avec préfixe
     * @param baseName - Le nom de base du cookie
     * @returns Le nom complet du cookie (`${prefix}.${baseName}`)
     * @throws Error si le nom de base est invalide
     */
    public getCookieName(baseName: string): string {
        if (!baseName || typeof baseName !== 'string') {
            throw new Error('Base name must be a non-empty string');
        }

        const config = this.getCachedConfig();
        return `${config.cookieNamePrefix}.${baseName}`;
    }

    /**
     * Lit la valeur d'un cookie
     * @param cookieName - Le nom du cookie à lire
     * @returns La valeur du cookie ou null si non trouvé
     */
    public getCookie(cookieName: string): string | null {
        if (!cookieName || typeof cookieName !== 'string') {
            return null;
        }

        const config = this.getCachedConfig();
        if (config.cookiesDisabled) {
            return null;
        }

        try {
            // Regex plus précise et échappement du nom de cookie
            const escapedName = cookieName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const cookiePattern = new RegExp(`(?:^|;)\\s*${escapedName}=([^;]*)`);
            const match = cookiePattern.exec(this.dependencies.documentAlias.cookie);

            if (match && match[1]) {
                return this.dependencies.decodeWrapper(match[1]) || null;
            }
            return null;
        } catch (error) {
            this.logger.warn('Error reading cookie:', error);
            return null;
        }
    }

    /**
     * Écrit un cookie avec la configuration spécifiée
     * @param cookieName - Le nom du cookie
     * @param value - La valeur du cookie
     * @param userConfig - La configuration personnalisée
     * @returns true si le cookie a été écrit avec succès
     * @throws Error si le nom du cookie est invalide
     */
    public setCookie(cookieName: string, value: string | number | boolean, userConfig: SetCookieConfig = {}): boolean {
        if (!cookieName || typeof cookieName !== 'string') {
            throw new Error('Cookie name must be a non-empty string');
        }

        const config = this.getCachedConfig();
        if (config.cookiesDisabled) {
            return false;
        }

        try {
            const mergedConfig: SetCookieConfig = {
                ...config,
                ...userConfig,
                msToExpire: userConfig.msToExpire ?? config.msToExpire,
                path: userConfig.path ?? config.path,
                // Respecte un choix explicite de l'appelant, sinon préfère Secure en HTTPS
                isSecure: userConfig.isSecure !== undefined
                    ? userConfig.isSecure
                    : (config.isSecure || CookieManager.isHttpsContext())
            };

            const cookieString = this.composeCookie(
                cookieName,
                this.dependencies.encodeWrapper(value),
                mergedConfig
            );

            this.dependencies.documentAlias.cookie = cookieString;
            return true;
        } catch (error) {
            this.logger.warn('Error setting cookie:', error);
            return false;
        }
    }

    /**
     * Supprime un cookie en définissant une date d'expiration passée
     * @param cookieName - Le nom du cookie à supprimer
     * @returns true si le cookie a été supprimé avec succès
     */
    public deleteCookie(cookieName: string): boolean {
        const config = this.getCachedConfig();

        // Supprimer avec différents paths pour plus de sûreté
        const pathsToTry = [config.path, '/', ''];
        let deleted = false;

        pathsToTry.forEach(path => {
            if (this.setCookie(cookieName, '', {
                msToExpire: -86400000, // -1 jour en ms
                path: path
            })) {
                deleted = true;
            }
        });

        return deleted;
    }

    /**
     * Teste si les cookies sont activés dans le navigateur
     * @returns Le résultat du test de cookies
     */
    public hasCookies(): CookieTestResult {
        const config = this.getCachedConfig();

        if (config.cookiesDisabled) {
            return false;
        }

        // Utiliser navigator.cookieEnabled si disponible (plus rapide)
        if (this.isDefined(this.dependencies.navigatorAlias.cookieEnabled)) {
            return this.dependencies.navigatorAlias.cookieEnabled;
        }

        // Test manuel avec timeout
        try {
            const testCookieName = this.getCookieName('test-cookie');
            this.setCookie(testCookieName, '1');

            const result = this.getCookie(testCookieName) === '1';
            this.deleteCookie(testCookieName);

            return result;
        } catch (error) {
            this.logger.warn('Error testing cookie support:', error);
            return false;
        }
    }

    /**
     * Récupère tous les cookies du domaine sous forme d'objet
     * @returns Un objet contenant tous les cookies
     */
    public getAllCookies(): Record<string, string> {
        if (this.getCachedConfig().cookiesDisabled) {
            return {};
        }

        const cookies: Record<string, string> = {};
        const cookieString = this.dependencies.documentAlias.cookie;

        if (cookieString) {
            cookieString.split(';').forEach(cookie => {
                const [name, ...valueParts] = cookie.trim().split('=');
                if (name && valueParts.length > 0) {
                    try {
                        cookies[name] = this.dependencies.decodeWrapper(valueParts.join('='));
                    } catch (error) {
                        this.logger.warn(`Error decoding cookie ${name}:`, error);
                    }
                }
            });
        }

        return cookies;
    }

    /**
     * Vérifie si un cookie spécifique existe
     * @param cookieName - Le nom du cookie à vérifier
     * @returns true si le cookie existe
     */
    public hasCookie(cookieName: string): boolean {
        return this.getCookie(cookieName) !== null;
    }

    /**
     * Nettoie le cache de configuration (utile pour les tests)
     */
    public clearConfigCache(): void {
        this.cookiesConfigCache = null;
        this.cacheTimestamp = 0;
    }

    /**
     * Utilitaire pour vérifier si une valeur est définie
     * @param value - La valeur à vérifier
     * @returns true si la valeur est définie
     */
    private isDefined<T>(value: T | undefined | null): value is T {
        return value !== undefined && value !== null;
    }

    /**
     * Méthode statique pour créer une instance avec des dépendances par défaut
     * @param getCookiesConfig - Fonction pour obtenir la configuration des cookies
     * @param customDependencies - Dépendances personnalisées optionnelles
     * @returns Une instance de CookieManager
     */
    public static createWithDefaults(
        getCookiesConfig: () => CookieConfig,
        customDependencies?: Partial<CookieManagerDependencies>
    ): CookieManager {
        const defaultDependencies: CookieManagerDependencies = {
            documentAlias: document,
            navigatorAlias: navigator,
            decodeWrapper: decodeURIComponent,
            encodeWrapper: (value) => String(value),
            getCookiesConfig,
            ...customDependencies
        };

        return new CookieManager(defaultDependencies);
    }

    /**
     * Obtient les options par défaut
     * @returns Les options par défaut du CookieManager
     */
    static get defaults(): CookieConfig {
        return _defaults;
    }
}

// Export des types pour utilisation externe
export type { CookieManagerDependencies as CookieManagerDeps };
