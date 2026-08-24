/**
 * @fileoverview IconManager pour K3UI — chargement SVG, cache et révélation anti-FOUC
 * @author Kam3leon
 * @version 3.0.0
 */

import { EMBEDDED_ICON_SVG } from './embedded-icons';
import { LoggerManager } from './LoggerManager';
import { generateGuid } from '../../utils/helpers/guid';

/**
 * Interface pour les options d'icône
 */
export interface IconOptions {
    /** Nom de l'icône */
    name: string;
    /** Taille de l'icône */
    size?: IconSize;
    /** Couleur de l'icône */
    color?: string;
    /** Classe CSS personnalisée */
    className?: string;
    /** Rotation en degrés */
    rotate?: number;
    /** Retournement */
    flip?: IconFlip;
    /** Couleur du contour */
    stroke?: string;
    /** Épaisseur du contour */
    strokeWidth?: string;
}

/** Tailles d'icônes */
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** Retournements */
export type IconFlip = 'horizontal' | 'vertical';

/** Statistiques d'utilisation */
export interface IconStats {
    total: number;
    loaded: number;
    failed: number;
    cached: number;
}

/**
 * Configuration du gestionnaire d'icônes
 */
export interface IconManagerConfig {
    /** Chemin de base pour les icônes */
    basePath?: string;
    /** Délai de debounce pour les mutations (si coalesceMutationsWithRaf est false) */
    debounceDelay?: number;
    /** Activer le cache */
    enableCache?: boolean;
    /**
     * Racine du MutationObserver (null = document.body).
     * Limite le coût sur les grosses pages en n’observant qu’un sous-arbre (ex. conteneur SPA).
     */
    mutationObserverRoot?: HTMLElement | null;
    /**
     * Regrouper les callbacks MutationObserver sur une frame via requestAnimationFrame (recommandé).
     */
    coalesceMutationsWithRaf?: boolean;
    /**
     * Regrouper les injections SVG sur une frame (évite le pop-in échelonné).
     */
    batchRevealWithRaf?: boolean;
    /**
     * Délai max (ms) pour la passe initiale avant révélation / whenReady.
     * Évite de bloquer hideBodyUntilReady si un SVG est lent ou en erreur.
     */
    initialBatchTimeoutMs?: number;
    /**
     * Nombre max de fetch SVG simultanés (évite l’échec navigateur sur pages catalogue).
     */
    maxConcurrentFetches?: number;
    /**
     * Nombre de tentatives réseau par URL (1 = pas de retry).
     */
    fetchRetries?: number;
    /**
     * Si true : retient TOUTES les injections jusqu’au settle (à utiliser avec hideBodyUntilReady).
     * Si false (défaut) : peint immédiatement les SVG sync (cache/embed) pour qu’ils
     * apparaissent avec le premier paint JS, sans attendre les fetches lents.
     */
    atomicPageReveal?: boolean;
}

type IconManagerResolvedConfig = Required<Omit<IconManagerConfig, 'mutationObserverRoot'>> & {
    mutationObserverRoot: HTMLElement | null;
};

/**
 * Gestionnaire d'icônes SVG — cache, dédup réseau, révélation groupée anti-FOUC.
 */
export class IconManager {
    // ============================================================================
    // PROPRIÉTÉS STATIQUES
    // ============================================================================

    private static logger: LoggerManager | null = null;

    private static config: IconManagerResolvedConfig = {
        basePath: '/k3ui-docs/assets/icons/',
        debounceDelay: 10,
        enableCache: true,
        mutationObserverRoot: null,
        coalesceMutationsWithRaf: true,
        batchRevealWithRaf: true,
        initialBatchTimeoutMs: 800,
        maxConcurrentFetches: 16,
        fetchRetries: 3,
        atomicPageReveal: false
    };

    private static _initialized = false;

    /** Cache mémoire SVG (clé de résolution → markup) */
    private static _iconCache = new Map<string, string>();

    /** Templates SVG déjà parsés / sanitizés (clone rapide à l’injection) */
    private static _svgTemplateCache = new Map<string, SVGElement>();

    /** Clés dont le chargement a échoué (ne pas réessayer) */
    private static _failedIconKeys = new Set<string>();

    /**
     * Promesses de chargement partagées par clé (dédup XHR/fetch).
     */
    private static _loadPromises = new Map<string, Promise<string | null>>();

    /** File d’attente fetch (concurrence limitée). */
    private static _fetchActive = 0;

    private static _fetchWaitQueue: Array<() => void> = [];

    /** Persistence session (survit aux navigations pleine page docs) */
    private static readonly SESSION_CACHE_KEY = 'k3ui-icon-svg-cache-v1';

    private static _sessionHydrated = false;

    private static _persistTimer: ReturnType<typeof setTimeout> | null = null;

    private static _mutationObserver: MutationObserver | null = null;

    private static _debounceTimer: ReturnType<typeof setTimeout> | null = null;

    private static _mutationRafId: number | null = null;

    private static _pendingMutationBatches: MutationRecord[][] = [];

    private static _forceDisplayIconsPending = false;

    /** File d’attente d’injection SVG (élément → markup sanitizé) */
    private static _paintQueue = new Map<HTMLElement, string>();

    private static _paintRafId: number | null = null;

    /** Pendant la passe initiale : on retient le flush jusqu’au settle */
    private static _holdInitialReveal = false;

    private static _iconsReady = false;

    private static _initialPassPromise: Promise<void> | null = null;

    private static _finalizePromise: Promise<void> | null = null;

    private static _readyWaiters: Array<() => void> = [];

    private static readonly ICON_SELECTOR = 'i[name], span[name]';

    private static readonly MULTICOLOR_CLASS = 'k3ui-icon--multicolor';

    private static readonly MULTICOLOR_TYPES = new Set<string>(['flags']);

    private static readonly MULTICOLOR_CUSTOM_FOLDERS = new Set<string>(['flags']);

    /** Attribut data pour éviter les re-traitements inutiles */
    private static readonly DATA_ICON_KEY = 'data-k3ui-icon-key';

    private static readonly SAFE_PATH_SEGMENT = /^[a-zA-Z0-9_-]+$/;

    // ============================================================================
    // API PUBLIQUE
    // ============================================================================

    /**
     * Configure le gestionnaire d'icônes
     * @param config Configuration à appliquer
     */
    static configure(config: Partial<IconManagerConfig>): void {
        this.config = { ...this.config, ...config };
        if (this.logger) {
            this.logger.info('IconManager configured:', this.config);
        }
    }

    /**
     * Obtient la configuration actuelle
     * @returns Configuration actuelle
     */
    static getConfiguration(): typeof IconManager.config {
        return { ...this.config };
    }

    /**
     * Indique si la passe initiale d’icônes est terminée (ou a expiré).
     */
    static isReady(): boolean {
        return this._iconsReady;
    }

    /**
     * Résout lorsque les icônes sont injectées (passe initiale + icônes ajoutées par l’AutoInit).
     * Utile pour hideBodyUntilReady afin d’éviter le retard / clignotement au premier paint.
     * @param timeoutMs Plafond d’attente (défaut = config.initialBatchTimeoutMs)
     */
    static whenReady(timeoutMs?: number): Promise<void> {
        if (this._iconsReady) {
            return Promise.resolve();
        }
        return this.finalizeReveal(timeoutMs);
    }

    /**
     * Met à jour une icône (swap atomique : pas de retrait anticipé de .k3ui-icon-loaded).
     * @param element Élément icône
     */
    static updateIcon(element: HTMLElement): void {
        if (!this.isValidIconElement(element)) {
            return;
        }
        this.processIconElement(element, { force: true });
        this.logDebug(`Icon updated: ${element.getAttribute('name')}`);
    }

    /**
     * Met à jour une icône par sélecteur CSS
     * @param selector Sélecteur CSS
     */
    static updateIconBySelector(selector: string): void {
        const element = document.querySelector(selector) as HTMLElement | null;
        if (element) {
            this.updateIcon(element);
        } else if (this.logger) {
            this.logger.warn(`Icon not found with selector: ${selector}`);
        }
    }

    /**
     * Recharge toutes les icônes
     */
    static reloadAllIcons(): void {
        this._failedIconKeys.clear();
        this._loadPromises.clear();
        const root = this.getMutationObserverTarget();
        root.querySelectorAll(this.ICON_SELECTOR).forEach((icon) => {
            const el = icon as HTMLElement;
            el.classList.remove('k3ui-icon-loaded');
            el.removeAttribute(this.DATA_ICON_KEY);
            this.processIconElement(el, { force: true });
        });
        if (this.logger) {
            this.logger.info('All icons reloaded');
        }
    }

    /**
     * Force le traitement des icônes non chargées (appels coalescés en microtask).
     */
    static forceDisplayIcons(): void {
        if (this._forceDisplayIconsPending) {
            return;
        }
        this._forceDisplayIconsPending = true;
        queueMicrotask(() => {
            this._forceDisplayIconsPending = false;
            const icons = document.querySelectorAll(`${this.ICON_SELECTOR}:not(.k3ui-icon-loaded)`);
            icons.forEach((icon) => this.processIconElement(icon as HTMLElement));
            if (this.logger) {
                this.logger.info(`Icons display forced: ${icons.length} icons processed`);
            }
        });
    }

    /**
     * Traite les icônes d’un conteneur (après injection HTML dynamique).
     * @param container Racine (ex. .list)
     */
    static processIconsInContainer(container: HTMLElement | null | undefined): void {
        if (!container || !(container instanceof HTMLElement)) {
            return;
        }
        const icons = container.querySelectorAll(`${this.ICON_SELECTOR}:not(.k3ui-icon-loaded)`);
        icons.forEach((icon) => this.processIconElement(icon as HTMLElement));
    }

    /**
     * Teste si une icône est disponible sans réseau (cache / embed).
     */
    static testIcon(iconName: string, style: string = 'classic', custom?: string): boolean {
        const tempElement = document.createElement('i');
        tempElement.setAttribute('name', iconName);
        if (custom) {
            tempElement.setAttribute('custom', custom);
        } else {
            tempElement.setAttribute('type', style);
        }

        const resKey = this.getIconResolutionKey(iconName, tempElement);
        if (this.config.enableCache && this._iconCache.has(resKey)) {
            return true;
        }

        const embedded =
            EMBEDDED_ICON_SVG[resKey] ?? (EMBEDDED_ICON_SVG as Record<string, string>)[iconName] ?? null;
        return embedded !== null;
    }

    /**
     * Initialise le gestionnaire (passe initiale groupée anti-FOUC).
     */
    static init(): void {
        if (this._initialized) {
            this.logWarn('IconManager already initialized');
            return;
        }

        if (!this.isDOMReady()) {
            this.waitForDOM();
            return;
        }

        this.hydrateSessionCache();
        this.setupMutationObserver();
        this._initialized = true;
        // Mode atomique (hideBodyUntilReady) : retient le paint jusqu’au settle.
        // Sinon : peindre sync immédiatement pour coller au premier rendu de page.
        this._holdInitialReveal = this.config.atomicPageReveal === true;
        this._initialPassPromise = this.runInitialIconPass();
        void this._initialPassPromise;
        window.setTimeout(() => {
            void this.finalizeReveal();
        }, this.config.initialBatchTimeoutMs + 50);
        this.logDebug('IconManager initialized (initial pass started)');
    }

    /**
     * Configure le logger
     * @param logger Instance du logger
     */
    static setLogger(logger: LoggerManager | null): void {
        this.logger = logger;
    }

    /**
     * Liste des icônes « disponibles » (API historique — les SVG viennent des fichiers / cache).
     */
    static getAvailableIcons(): string[] {
        return [];
    }

    /**
     * Ajoute une icône dynamiquement dans le cache
     * @param name Nom (type classic)
     * @param svgContent Markup SVG
     */
    static addIcon(name: string, svgContent: string): void {
        const resKey = `classic:${name}`;
        const sanitized = this.sanitizeSvgContent(svgContent, { uniqueIds: false });
        this._iconCache.set(resKey, sanitized);
        this._svgTemplateCache.delete(resKey);
        this.schedulePersistSessionCache();

        const existingIcons = document.querySelectorAll(
            `i[name="${name}"]:not(.k3ui-icon-loaded), span[name="${name}"]:not(.k3ui-icon-loaded)`
        );
        existingIcons.forEach((icon) => this.processIconElement(icon as HTMLElement));

        if (this.logger) {
            this.logger.info(`Icon '${name}' added dynamically and ${existingIcons.length} elements updated`);
        }
    }

    /**
     * Statistiques d’utilisation
     */
    static getStats(): IconStats {
        const total = document.querySelectorAll(this.ICON_SELECTOR).length;
        const loaded = document.querySelectorAll(`${this.ICON_SELECTOR}.k3ui-icon-loaded`).length;
        const failed = Math.max(0, total - loaded);
        const cached = this._iconCache.size;
        return { total, loaded, failed, cached };
    }

    /**
     * Vide le cache mémoire et session
     */
    static clearCache(): void {
        this._iconCache.clear();
        this._svgTemplateCache.clear();
        this._loadPromises.clear();
        this._failedIconKeys.clear();
        this._fetchWaitQueue = [];
        this._sessionHydrated = false;
        if (typeof sessionStorage !== 'undefined') {
            try {
                sessionStorage.removeItem(this.SESSION_CACHE_KEY);
            } catch {
                /* ignore */
            }
        }
        if (this.logger) {
            this.logger.info('Icon cache cleared');
        }
    }

    /**
     * Détruit le gestionnaire
     */
    static destroy(): void {
        if (this._mutationObserver) {
            this._mutationObserver.disconnect();
            this._mutationObserver = null;
        }

        if (this._mutationRafId !== null) {
            cancelAnimationFrame(this._mutationRafId);
            this._mutationRafId = null;
        }
        this._pendingMutationBatches = [];

        if (this._debounceTimer !== null) {
            clearTimeout(this._debounceTimer);
            this._debounceTimer = null;
        }

        if (this._paintRafId !== null) {
            cancelAnimationFrame(this._paintRafId);
            this._paintRafId = null;
        }
        this._paintQueue.clear();

        this.clearCache();
        this._initialized = false;
        this._forceDisplayIconsPending = false;
        this._holdInitialReveal = false;
        this._iconsReady = false;
        this._initialPassPromise = null;
        this._finalizePromise = null;
        this._readyWaiters = [];

        if (this._persistTimer !== null) {
            clearTimeout(this._persistTimer);
            this._persistTimer = null;
        }
        if (typeof document !== 'undefined') {
            document.documentElement.classList.remove('k3ui-icons-ready');
        }

        if (this.logger) {
            this.logger.info('IconManager destroyed');
        }
    }

    // ============================================================================
    // PASSE INITIALE / RÉVÉLATION
    // ============================================================================

    /**
     * Collecte et charge les icônes au boot.
     * Sync (cache/embed) : peintes tout de suite sauf atomicPageReveal.
     * Async : fetches démarrés immédiatement, injection au fur et à mesure (rAF).
     */
    private static async runInitialIconPass(): Promise<void> {
        const root = this.getMutationObserverTarget();
        const icons = Array.from(root.querySelectorAll(this.ICON_SELECTOR)) as HTMLElement[];
        const loadJobs: Promise<void>[] = [];

        for (const element of icons) {
            const name = element.getAttribute('name');
            if (!name) continue;
            if (element.hasAttribute('data-k3ui-lazy-pending')) continue;

            const syncSvg = this.resolveIconSync(name, element);
            if (syncSvg !== null) {
                this.paintIcon(element, syncSvg, { immediate: !this._holdInitialReveal });
                continue;
            }

            loadJobs.push(
                this.resolveIconAsync(name, element).then((svg) => {
                    if (svg) {
                        this.paintIcon(element, svg, { immediate: false });
                    } else {
                        this.handleIconNotFound(element, name);
                    }
                })
            );
        }

        if (loadJobs.length > 0) {
            await Promise.race([
                Promise.allSettled(loadJobs).then(() => undefined),
                this.delay(this.config.initialBatchTimeoutMs)
            ]);
        }

        if (!this.config.atomicPageReveal) {
            this.flushPaintQueue();
            this.markIconsReady();
        }
    }

    /**
     * Termine la révélation atomique (hideBodyUntilReady) ou filet de sécurité.
     */
    private static finalizeReveal(timeoutMs?: number): Promise<void> {
        if (this._iconsReady) {
            return Promise.resolve();
        }
        if (this._finalizePromise) {
            return this._finalizePromise;
        }

        const cap = timeoutMs ?? this.config.initialBatchTimeoutMs;

        this._finalizePromise = (async (): Promise<void> => {
            if (this._initialPassPromise) {
                await Promise.race([this._initialPassPromise, this.delay(cap)]);
            }

            const root = this.getMutationObserverTarget();
            const pending = Array.from(
                root.querySelectorAll(`${this.ICON_SELECTOR}:not(.k3ui-icon-loaded)`)
            ) as HTMLElement[];

            const loadJobs: Promise<void>[] = [];
            for (const element of pending) {
                const name = element.getAttribute('name');
                if (!name) continue;
                if (element.hasAttribute('data-k3ui-lazy-pending')) continue;

                const syncSvg = this.resolveIconSync(name, element);
                if (syncSvg !== null) {
                    this.paintIcon(element, syncSvg, { immediate: !this.config.atomicPageReveal });
                    continue;
                }

                loadJobs.push(
                    this.resolveIconAsync(name, element).then((svg) => {
                        if (!element.isConnected) return;
                        if (svg) {
                            this.paintIcon(element, svg, { immediate: false });
                        } else {
                            this.handleIconNotFound(element, name);
                        }
                    })
                );
            }

            if (loadJobs.length > 0) {
                await Promise.race([
                    Promise.allSettled(loadJobs).then(() => undefined),
                    this.delay(cap)
                ]);
            }

            this._holdInitialReveal = false;
            this.flushPaintQueue();
            this.markIconsReady();
            this.scheduleMissingIconRecovery();
        })();

        return this._finalizePromise;
    }

    /**
     * Relance les icônes restées en fallback (⚠️) après la passe initiale.
     * Utile sur les pages catalogue (milliers d’icônes).
     */
    private static scheduleMissingIconRecovery(round: number = 0): void {
        if (round > 10) {
            return;
        }
        const delayMs = round === 0 ? 250 : 500;
        window.setTimeout(() => {
            if (this._fetchActive > 0 || this._fetchWaitQueue.length > 0) {
                this.scheduleMissingIconRecovery(round);
                return;
            }

            const root = this.getMutationObserverTarget();
            const broken = Array.from(root.querySelectorAll(this.ICON_SELECTOR)) as HTMLElement[];
            let n = 0;
            for (const el of broken) {
                if (el.hasAttribute('data-k3ui-lazy-pending')) continue;
                if (el.querySelector('svg')) continue;
                if (!el.getAttribute('name')) continue;
                this.processIconElement(el, { force: true });
                n += 1;
            }
            if (n > 0) {
                if (this.logger) {
                    this.logger.info(`Icon recovery round ${round + 1}: ${n} icons re-queued`);
                }
                this.scheduleMissingIconRecovery(round + 1);
            }
        }, delayMs);
    }

    private static markIconsReady(): void {
        if (this._iconsReady) {
            return;
        }
        this._iconsReady = true;
        if (typeof document !== 'undefined') {
            document.documentElement.classList.add('k3ui-icons-ready');
            document.dispatchEvent(new CustomEvent('k3ui-icons-ready'));
        }
        const waiters = this._readyWaiters.splice(0);
        waiters.forEach((fn) => {
            try {
                fn();
            } catch {
                /* ignore */
            }
        });
        this.logDebug('IconManager icons ready');
    }

    private static delay(ms: number): Promise<void> {
        return new Promise((resolve) => {
            window.setTimeout(resolve, Math.max(0, ms));
        });
    }

    // ============================================================================
    // RÉSOLUTION / CHARGEMENT
    // ============================================================================

    private static getMutationObserverTarget(): HTMLElement {
        return this.config.mutationObserverRoot ?? document.body;
    }

    private static isSafePathSegment(value: string): boolean {
        if (!value) return false;
        if (value.includes('..') || value.includes('/') || value.includes('\\') || value.includes(':')) {
            return false;
        }
        return this.SAFE_PATH_SEGMENT.test(value);
    }

    private static isValidIconElement(element: HTMLElement): boolean {
        const tag = element.tagName.toLowerCase();
        return (tag === 'i' || tag === 'span') && element.hasAttribute('name');
    }

    private static getIconResolutionKey(name: string, element: HTMLElement): string {
        const custom = element.getAttribute('custom');
        if (custom) {
            return `custom:${custom}:${name}`;
        }
        const type = element.getAttribute('type') || 'classic';
        return `${type}:${name}`;
    }

    /**
     * Traite un élément icône (sync cache/embed ou async réseau).
     */
    private static processIconElement(element: HTMLElement, options: { force?: boolean } = {}): void {
        try {
            const name = element.getAttribute('name');
            if (!name) {
                this.logWarn('No name attribute found for icon element');
                return;
            }

            const resKey = this.getIconResolutionKey(name, element);
            if (element.hasAttribute('data-k3ui-lazy-pending')) {
                return;
            }
            if (options.force) {
                this._failedIconKeys.delete(resKey);
                this._loadPromises.delete(resKey);
                element.classList.remove('k3ui-icon-loaded');
                element.removeAttribute(this.DATA_ICON_KEY);
            }
            if (
                !options.force &&
                element.classList.contains('k3ui-icon-loaded') &&
                element.getAttribute(this.DATA_ICON_KEY) === resKey &&
                element.querySelector('svg')
            ) {
                return;
            }

            const syncSvg = this.resolveIconSync(name, element);
            if (syncSvg !== null) {
                this.paintIcon(element, syncSvg, { immediate: !this._holdInitialReveal });
                return;
            }

            void this.resolveIconAsync(name, element).then((svg) => {
                if (!element.isConnected) return;
                if (svg) {
                    this.paintIcon(element, svg, { immediate: false });
                } else {
                    this.handleIconNotFound(element, name);
                }
            });
        } catch (error) {
            this.logError('Erreur lors du traitement de l\'icône:', error);
            this.handleIconError(element, error);
        }
    }

    /**
     * Résolution synchrone (cache mémoire, session déjà hydraté, embed).
     * @returns Markup SVG ou null si un chargement async est nécessaire
     */
    private static resolveIconSync(name: string, element: HTMLElement): string | null {
        this.hydrateSessionCache();
        const resKey = this.getIconResolutionKey(name, element);

        if (this._failedIconKeys.has(resKey)) {
            return null;
        }

        if (this.config.enableCache && this._iconCache.has(resKey)) {
            return this._iconCache.get(resKey)!;
        }

        const embedded =
            EMBEDDED_ICON_SVG[resKey] ??
            (EMBEDDED_ICON_SVG as Record<string, string>)[name] ??
            null;

        if (embedded) {
            if (this.config.enableCache) {
                this._iconCache.set(resKey, embedded);
                this.schedulePersistSessionCache();
            }
            return embedded;
        }

        return null;
    }

    /**
     * Charge (ou réutilise) le SVG async pour une clé, avec cache.
     */
    private static resolveIconAsync(name: string, element: HTMLElement): Promise<string | null> {
        const resKey = this.getIconResolutionKey(name, element);

        if (this._failedIconKeys.has(resKey)) {
            return Promise.resolve(null);
        }

        const sync = this.resolveIconSync(name, element);
        if (sync !== null) {
            return Promise.resolve(sync);
        }

        const existing = this._loadPromises.get(resKey);
        if (existing) {
            return existing;
        }

        const iconPath = this.buildIconPath(name, element);
        if (iconPath === null) {
            this._failedIconKeys.add(resKey);
            return Promise.resolve(null);
        }

        let requestUrl = iconPath;
        if (typeof window !== 'undefined' && window.location?.href) {
            try {
                requestUrl = new URL(iconPath, window.location.href).href;
            } catch {
                requestUrl = iconPath;
            }
        }

        const promise = this.fetchSvg(requestUrl)
            .then((raw) => {
                if (raw === null) {
                    this._failedIconKeys.add(resKey);
                    return null;
                }
                const svgContent = this.sanitizeSvgContent(raw, { uniqueIds: false });
                if (!svgContent) {
                    this._failedIconKeys.add(resKey);
                    return null;
                }
                if (this.config.enableCache) {
                    this._iconCache.set(resKey, svgContent);
                    this.schedulePersistSessionCache();
                }
                return svgContent;
            })
            .finally(() => {
                this._loadPromises.delete(resKey);
            });

        this._loadPromises.set(resKey, promise);
        return promise;
    }

    /**
     * Fetch texte SVG (async, concurrence limitée + retries).
     */
    private static fetchSvg(url: string): Promise<string | null> {
        const maxAttempts = Math.max(1, this.config.fetchRetries);

        const attemptOnce = (): Promise<string | null> =>
            fetch(url, { credentials: 'same-origin', cache: 'force-cache' })
                .then((response) => {
                    if (!response.ok) {
                        this.logWarn(`Erreur HTTP ${response.status} pour ${url}`);
                        return null;
                    }
                    return response.text();
                })
                .catch((error: unknown) => {
                    this.logError(`Erreur réseau lors du chargement de ${url}`, error);
                    return null;
                });

        const runWithRetry = async (): Promise<string | null> => {
            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                const raw = await attemptOnce();
                if (raw !== null) {
                    return raw;
                }
                if (attempt < maxAttempts) {
                    await this.delay(40 * attempt);
                }
            }
            return null;
        };

        return this.enqueueFetch(runWithRetry);
    }

    /**
     * Limite le nombre de fetch SVG simultanés.
     */
    private static enqueueFetch<T>(job: () => Promise<T>): Promise<T> {
        const max = Math.max(1, this.config.maxConcurrentFetches);

        const start = (): Promise<T> => {
            this._fetchActive += 1;
            return job().finally(() => {
                this._fetchActive -= 1;
                const next = this._fetchWaitQueue.shift();
                if (next) {
                    next();
                }
            });
        };

        if (this._fetchActive < max) {
            return start();
        }

        return new Promise<T>((resolve, reject) => {
            this._fetchWaitQueue.push(() => {
                start().then(resolve, reject);
            });
        });
    }

    private static buildIconPath(name: string, element: HTMLElement): string | null {
        const type = element.getAttribute('type') || 'classic';
        const custom = element.getAttribute('custom');

        if (!this.isSafePathSegment(name)) {
            this.logWarn(`Nom d'icône invalide (caractères non autorisés): ${name}`);
            return null;
        }
        if (!this.isSafePathSegment(type)) {
            this.logWarn(`Type d'icône invalide (caractères non autorisés): ${type}`);
            return null;
        }
        if (custom && !this.isSafePathSegment(custom)) {
            this.logWarn(`Dossier custom invalide (caractères non autorisés): ${custom}`);
            return null;
        }

        if (custom) {
            return `${this.config.basePath}custom/${custom}/${name}.svg`;
        }
        return `${this.config.basePath}${type}/${name}.svg`;
    }

    // ============================================================================
    // PAINT QUEUE (anti pop-in)
    // ============================================================================

    /**
     * Peint une icône : immédiat (sync / cache) ou file d’attente rAF (async).
     */
    private static paintIcon(
        element: HTMLElement,
        svgContent: string,
        options: { immediate?: boolean } = {}
    ): void {
        const immediate = options.immediate === true;
        if (immediate && !this._holdInitialReveal) {
            this.applySvgToElement(element, svgContent);
            return;
        }
        this._paintQueue.set(element, svgContent);
        if (this._holdInitialReveal) {
            return;
        }
        this.schedulePaintFlush();
    }

    private static schedulePaintFlush(): void {
        if (!this.config.batchRevealWithRaf) {
            this.flushPaintQueue();
            return;
        }
        if (this._paintRafId !== null) {
            return;
        }
        this._paintRafId = requestAnimationFrame(() => {
            this._paintRafId = null;
            this.flushPaintQueue();
        });
    }

    private static flushPaintQueue(): void {
        if (this._paintQueue.size === 0) {
            return;
        }
        const entries = Array.from(this._paintQueue.entries());
        this._paintQueue.clear();
        for (const [element, svgContent] of entries) {
            if (!element.isConnected) continue;
            this.applySvgToElement(element, svgContent);
        }
    }

    private static applySvgToElement(element: HTMLElement, svgContent: string): void {
        const name = element.getAttribute('name') || '';
        const resKey = this.getIconResolutionKey(name, element);

        // Clone d’un template parsé une seule fois par clé (beaucoup plus rapide que DOMParser × N).
        const svgNode = this.getSvgTemplateClone(resKey, svgContent);
        if (svgNode) {
            element.replaceChildren(svgNode);
        } else {
            element.innerHTML = this.sanitizeSvgContent(svgContent);
        }

        element.setAttribute(this.DATA_ICON_KEY, resKey);
        this.applyIconStyles(element);
        element.classList.add('k3ui-icon-loaded');
    }

    /**
     * Clone SVG prêt pour le DOM (ids uniques), depuis un template en cache par clé.
     */
    private static getSvgTemplateClone(resKey: string, svgContent: string): SVGElement | null {
        let template = this._svgTemplateCache.get(resKey);
        if (!template) {
            const sanitized = this.sanitizeSvgContent(svgContent, { uniqueIds: false });
            const parser = new DOMParser();
            const doc = parser.parseFromString(sanitized, 'image/svg+xml');
            const svg = doc.querySelector('svg');
            if (!svg) return null;
            template = svg as SVGElement;
            this._svgTemplateCache.set(resKey, template);
            if (this.config.enableCache) {
                this._iconCache.set(resKey, sanitized);
            }
        }

        const clone = template.cloneNode(true) as SVGElement;
        this.rewriteSvgIdsToUnique(clone);
        return clone;
    }

    // ============================================================================
    // CACHE SESSION
    // ============================================================================

    private static hydrateSessionCache(): void {
        if (this._sessionHydrated || !this.config.enableCache) {
            return;
        }
        this._sessionHydrated = true;
        if (typeof sessionStorage === 'undefined') {
            return;
        }
        try {
            const raw = sessionStorage.getItem(this.SESSION_CACHE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw) as Record<string, string>;
            if (!parsed || typeof parsed !== 'object') return;
            for (const [key, svg] of Object.entries(parsed)) {
                if (
                    typeof key === 'string' &&
                    typeof svg === 'string' &&
                    svg.includes('<svg') &&
                    !this._iconCache.has(key)
                ) {
                    this._iconCache.set(key, svg);
                }
            }
        } catch {
            /* ignore quota / JSON */
        }
    }

    private static schedulePersistSessionCache(): void {
        if (!this.config.enableCache || typeof sessionStorage === 'undefined') {
            return;
        }
        if (this._persistTimer !== null) {
            clearTimeout(this._persistTimer);
        }
        this._persistTimer = setTimeout(() => {
            this._persistTimer = null;
            try {
                const obj: Record<string, string> = {};
                let n = 0;
                for (const [key, svg] of this._iconCache) {
                    if (n >= 400) break;
                    obj[key] = svg;
                    n += 1;
                }
                sessionStorage.setItem(this.SESSION_CACHE_KEY, JSON.stringify(obj));
            } catch {
                /* quota exceeded */
            }
        }, 120);
    }

    // ============================================================================
    // STYLES / ERREURS / SANITIZE
    // ============================================================================

    private static isMulticolorIcon(element: HTMLElement): boolean {
        const type = element.getAttribute('type') || 'classic';
        if (this.MULTICOLOR_TYPES.has(type)) {
            return true;
        }
        const custom = element.getAttribute('custom');
        return custom !== null && this.MULTICOLOR_CUSTOM_FOLDERS.has(custom);
    }

    private static syncMulticolorClass(element: HTMLElement): void {
        if (this.isMulticolorIcon(element)) {
            element.classList.add(this.MULTICOLOR_CLASS);
        } else {
            element.classList.remove(this.MULTICOLOR_CLASS);
        }
    }

    private static applyIconStyles(element: HTMLElement): void {
        this.syncMulticolorClass(element);

        const color = element.getAttribute('color');
        const className = element.getAttribute('className');
        const rotate = element.getAttribute('rotate');
        const flip = element.getAttribute('flip') as IconFlip | null;
        const stroke = element.getAttribute('stroke');
        const strokeWidth = element.getAttribute('strokeWidth');

        if (this.isMulticolorIcon(element)) {
            element.style.removeProperty('color');
        } else if (color) {
            element.style.color = color;
        }

        // Ne jamais écraser className DOM (sinon perte de k3ui-icon-loaded → clignotement)
        if (className) {
            className
                .split(/\s+/)
                .filter(Boolean)
                .forEach((cls) => element.classList.add(cls));
        }

        if (rotate) {
            element.style.transform = `rotate(${rotate}deg)`;
        }

        if (flip) {
            const flipTransform = flip === 'horizontal' ? 'scaleX(-1)' : 'scaleY(-1)';
            element.style.transform = element.style.transform
                ? `${element.style.transform} ${flipTransform}`
                : flipTransform;
        }

        if (stroke) {
            element.style.stroke = stroke;
        }

        if (strokeWidth) {
            element.style.strokeWidth = strokeWidth;
        }
    }

    private static handleIconNotFound(element: HTMLElement, name: string): void {
        this.logWarn(`Icon not found: ${name}`);
        element.textContent = `⚠️ ${name}`;
        element.style.color = 'red';
        element.classList.add('k3ui-icon-loaded');
        element.removeAttribute(this.DATA_ICON_KEY);
    }

    private static handleIconError(element: HTMLElement, error: unknown): void {
        const name = element.getAttribute('name') || 'unknown';
        this.logError(`Error loading icon ${name}:`, error);
        element.textContent = `❌ ${name}`;
        element.style.color = 'red';
        element.classList.add('k3ui-icon-loaded');
        element.removeAttribute(this.DATA_ICON_KEY);
    }

    private static sanitizeSvgContent(
        svgRaw: string,
        options: { uniqueIds?: boolean } = {}
    ): string {
        const uniqueIds = options.uniqueIds !== false;
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgRaw, 'image/svg+xml');
        const svg = doc.querySelector('svg');
        if (!svg) return '';

        const dangerousTags = ['script', 'foreignObject', 'iframe', 'object', 'embed'];
        dangerousTags.forEach((tag) => {
            doc.querySelectorAll(tag).forEach((el) => el.remove());
        });

        doc.querySelectorAll('*').forEach((el) => {
            Array.from(el.attributes).forEach((attr) => {
                const attrName = attr.name.toLowerCase();
                const value = (attr.value || '').trim().toLowerCase();
                if (attrName.startsWith('on')) {
                    el.removeAttribute(attr.name);
                    return;
                }
                if (
                    (attrName === 'href' || attrName === 'xlink:href') &&
                    (value.startsWith('javascript:') || value.startsWith('data:'))
                ) {
                    el.removeAttribute(attr.name);
                }
            });
        });

        if (uniqueIds) {
            IconManager.rewriteSvgIdsToUnique(svg as SVGElement);
        }
        return new XMLSerializer().serializeToString(svg);
    }

    private static rewriteSvgIdsToUnique(svg: SVGElement): void {
        const suffix = 'k3svg' + generateGuid().replace(/-/g, '').slice(0, 12);
        const idNodes = svg.querySelectorAll('[id]');
        if (idNodes.length === 0) return;

        const idMap = new Map<string, string>();
        idNodes.forEach((node) => {
            const oldId = node.getAttribute('id');
            if (!oldId || idMap.has(oldId)) return;
            idMap.set(oldId, `${oldId}_${suffix}`);
        });

        idMap.forEach((newId, oldId) => {
            const el = svg.querySelector(`#${IconManager.escapeCssIdForSelector(oldId)}`);
            if (el) el.setAttribute('id', newId);
        });

        const sortedPairs = [...idMap.entries()].sort((a, b) => b[0].length - a[0].length);
        const replaceAttrRef = (val: string): string => {
            let out = val;
            sortedPairs.forEach(([oldId, newId]) => {
                out = out.split(`url(#${oldId})`).join(`url(#${newId})`);
                out = out.split(`#${oldId}`).join(`#${newId}`);
            });
            return out;
        };

        svg.querySelectorAll('*').forEach((el) => {
            Array.from(el.attributes).forEach((attr) => {
                const v = attr.value;
                if (!v || (!v.includes('#') && !v.includes('url('))) return;
                const next = replaceAttrRef(v);
                if (next !== v) el.setAttribute(attr.name, next);
            });
        });
    }

    private static escapeCssIdForSelector(id: string): string {
        if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
            return CSS.escape(id);
        }
        return id.replace(/([\\:*+?()[\]{}|^$])/g, '\\$1');
    }

    // ============================================================================
    // MUTATION OBSERVER / DOM READY
    // ============================================================================

    private static isDOMReady(): boolean {
        return document.readyState === 'complete' || document.readyState === 'interactive';
    }

    private static waitForDOM(): void {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.init();
            });
        }
    }

    private static setupMutationObserver(): void {
        if (this._mutationObserver) {
            this._mutationObserver.disconnect();
        }
        if (this._mutationRafId !== null) {
            cancelAnimationFrame(this._mutationRafId);
            this._mutationRafId = null;
        }
        this._pendingMutationBatches = [];

        this._mutationObserver = new MutationObserver((mutations) => {
            if (this.config.coalesceMutationsWithRaf) {
                this._pendingMutationBatches.push(mutations);
                if (this._mutationRafId !== null) {
                    return;
                }
                this._mutationRafId = requestAnimationFrame(() => {
                    this._mutationRafId = null;
                    if (this._debounceTimer !== null) {
                        clearTimeout(this._debounceTimer);
                        this._debounceTimer = null;
                    }
                    const flat = this._pendingMutationBatches.flat();
                    this._pendingMutationBatches = [];
                    if (flat.length > 0) {
                        this.processMutations(flat);
                    }
                });
                return;
            }

            if (this._debounceTimer !== null) {
                clearTimeout(this._debounceTimer);
            }
            this._debounceTimer = setTimeout(() => {
                this._debounceTimer = null;
                this.processMutations(mutations);
            }, this.config.debounceDelay);
        });

        const target = this.getMutationObserverTarget();
        this._mutationObserver.observe(target, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['name', 'type', 'custom']
        });
    }

    private static processMutations(mutations: MutationRecord[]): void {
        const iconsToProcess = new Set<HTMLElement>();

        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType !== Node.ELEMENT_NODE) return;
                const element = node as HTMLElement;

                // L’élément ajouté peut être lui-même une icône (pas seulement un descendant)
                if (
                    this.isValidIconElement(element) &&
                    !element.classList.contains('k3ui-icon-loaded')
                ) {
                    iconsToProcess.add(element);
                }

                const icons = element.querySelectorAll(
                    `${this.ICON_SELECTOR}:not(.k3ui-icon-loaded)`
                );
                icons.forEach((icon) => iconsToProcess.add(icon as HTMLElement));
            });

            if (mutation.type !== 'attributes' || !mutation.attributeName) {
                return;
            }

            const attr = mutation.attributeName;
            const target = mutation.target as HTMLElement;

            if (attr === 'name' || attr === 'type' || attr === 'custom') {
                const tag = target.tagName.toLowerCase();
                if (tag === 'i' || tag === 'span') {
                    // Pas de removeClass ici : processIconElement force le swap atomique
                    iconsToProcess.add(target);
                }
            }
        });

        iconsToProcess.forEach((icon) => this.processIconElement(icon, { force: true }));
    }

    // ============================================================================
    // LOGGING
    // ============================================================================

    private static logDebug(message: string): void {
        if (this.logger) {
            this.logger.debug(message);
        }
    }

    private static logWarn(message: string): void {
        if (this.logger) {
            this.logger.warn(message);
        }
    }

    private static logError(message: string, error?: unknown): void {
        if (this.logger) {
            this.logger.error(message, error);
        }
    }
}
