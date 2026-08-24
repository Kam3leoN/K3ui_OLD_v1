/**
 * @fileoverview Cycle de vie « DOM prêt + fenêtre chargée » (équivalent moderne de readyAndLoad).
 * @description Remplace l’enchaînement jQuery $(document).ready() puis $(window).load().
 * API composable pour un futur branchement avec le composant loader (splash plein écran, etc.).
 */

/** Sélecteur par défaut de l’overlay de chargement template (aligné sur l’ancien flux) */
export const DEFAULT_TEMPLATE_LOADER_SELECTOR = '.main-template-loader';

export interface ReadyAndLoadState {
    domReady: boolean;
    assetsLoaded: boolean;
}

export interface ReadyAndLoadRunOptions {
    /** Sélecteur CSS du loader plein écran (défaut: {@link DEFAULT_TEMPLATE_LOADER_SELECTOR}) */
    loaderSelector?: string;
    /** Durée du fondu en ms (défaut: 300) */
    fadeOutMs?: number;
    /** Appliquer `is-touch` sur `<html>` (défaut: true) */
    detectTouch?: boolean;
    /** Afficher le body après retrait du loader (défaut: true) */
    revealBody?: boolean;
    /** Valeur de `document.body.style.visibility` après préparation (défaut: `'visible'`) */
    bodyVisibility?: string;
    /** Écouter `window` `error` et journaliser (défaut: false) */
    captureWindowErrors?: boolean;
    /** Journaliser les étapes dans la console (défaut: false) */
    debug?: boolean;
    /** Appelé une fois le flux terminé (après fondu / retrait loader si présent) */
    onReady?: () => void;
}

function logDebug(debug: boolean | undefined, ...args: unknown[]): void {
    if (debug) console.log('[readyAndLoad]', ...args);
}

/**
 * Résout quand le DOM est prêt pour la manipulation (équivalent DOMContentLoaded).
 */
export function whenDomReady(): Promise<void> {
    if (typeof document === 'undefined') return Promise.resolve();
    if (document.readyState !== 'loading') return Promise.resolve();
    return new Promise((resolve) => {
        document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
    });
}

/**
 * Résout quand la fenêtre et ses ressources principales sont chargées (équivalent window load).
 */
export function whenWindowLoaded(): Promise<void> {
    if (typeof document === 'undefined') return Promise.resolve();
    if (document.readyState === 'complete') return Promise.resolve();
    return new Promise((resolve) => {
        window.addEventListener('load', () => resolve(), { once: true });
    });
}

/**
 * Attend à la fois le DOM prêt et l’événement `load` (compteur « 2 » du readyAndLoad historique).
 */
export async function whenReadyAndLoaded(): Promise<void> {
    await Promise.all([whenDomReady(), whenWindowLoaded()]);
}

/**
 * Détecte un appareil tactile et bascule la classe `is-touch` sur la racine du document.
 * @param root — Élément recevant la classe (défaut: `document.documentElement`)
 */
export function applyTouchDeviceClass(root: HTMLElement | null = typeof document !== 'undefined' ? document.documentElement : null): boolean {
    if (!root || typeof window === 'undefined') return false;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    root.classList.toggle('is-touch', isTouch);
    return isTouch;
}

/**
 * Rend le body visible (souvent après retrait du splash).
 */
export function revealDocumentBody(visibility: string = 'visible'): void {
    if (typeof document === 'undefined' || !document.body) return;
    document.body.style.visibility = visibility;
}

/**
 * Retire un nœud loader par fondu puis `remove()`, avec repli `setTimeout` si `transitionend` ne part pas.
 */
export function fadeOutAndRemoveElement(
    element: HTMLElement,
    fadeOutMs: number = 300,
    onDone?: () => void
): void {
    if (typeof window === 'undefined') {
        element.remove();
        onDone?.();
        return;
    }
    let finished = false;
    const finish = () => {
        if (finished) return;
        finished = true;
        window.clearTimeout(fallbackId);
        element.remove();
        onDone?.();
    };

    element.style.transition = `opacity ${fadeOutMs}ms ease-out`;
    element.style.opacity = '0';

    const fallbackId = window.setTimeout(finish, fadeOutMs + 150);
    element.addEventListener(
        'transitionend',
        () => {
            finish();
        },
        { once: true }
    );
}

/**
 * Sélectionne le loader template, le fait disparaître puis l’enlève du DOM ; sinon exécute `onDone` tout de suite.
 */
export function removeTemplateLoader(
    selector: string = DEFAULT_TEMPLATE_LOADER_SELECTOR,
    fadeOutMs: number = 300,
    onDone?: () => void
): void {
    if (typeof document === 'undefined') {
        onDone?.();
        return;
    }
    const loader = document.querySelector(selector);
    if (!(loader instanceof HTMLElement)) {
        onDone?.();
        return;
    }
    fadeOutAndRemoveElement(loader, fadeOutMs, onDone);
}

function attachWindowErrorLogger(): () => void {
    if (typeof window === 'undefined') return () => {};
    const handler = (event: ErrorEvent) => {
        console.error('[readyAndLoad] Erreur:', event.message, 'URL:', event.filename, 'Ligne:', event.lineno);
    };
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
}

/**
 * Enchaîne : attente DOM + load, détection tactile optionnelle, retrait du loader, révélation du body, callback.
 * Ne s’exécute pas tout seul à l’import : l’appelant doit invoquer cette fonction (ou {@link ReadyAndLoadController.start}).
 */
export async function runReadyAndLoad(options: ReadyAndLoadRunOptions = {}): Promise<ReadyAndLoadState> {
    const {
        loaderSelector = DEFAULT_TEMPLATE_LOADER_SELECTOR,
        fadeOutMs = 300,
        detectTouch = true,
        revealBody = true,
        bodyVisibility = 'visible',
        captureWindowErrors = false,
        debug = false,
        onReady,
    } = options;

    let detachErrors: (() => void) | undefined;
    if (captureWindowErrors) {
        detachErrors = attachWindowErrorLogger();
    }

    try {
        await whenDomReady();
        logDebug(debug, 'DOM prêt');
        await whenWindowLoaded();
        logDebug(debug, 'Ressources chargées');

        if (detectTouch) applyTouchDeviceClass();

        await new Promise<void>((resolve) => {
            removeTemplateLoader(loaderSelector, fadeOutMs, () => {
                if (revealBody) revealDocumentBody(bodyVisibility);
                logDebug(debug, 'Application prête à être initialisée');
                onReady?.();
                resolve();
            });
        });

        return { domReady: true, assetsLoaded: true };
    } finally {
        detachErrors?.();
    }
}

/**
 * Contrôleur orienté objet, même logique que l’exemple historique, sans effet de bord à l’instanciation.
 */
export class ReadyAndLoadController {
    domReady = false;

    assetsLoaded = false;

    /**
     * Lance le flux complet ; met à jour {@link domReady} / {@link assetsLoaded} au fil de l’eau.
     */
    async start(options: ReadyAndLoadRunOptions = {}): Promise<ReadyAndLoadState> {
        const debug = options.debug;
        let detachErrors: (() => void) | undefined;
        if (options.captureWindowErrors) {
            detachErrors = attachWindowErrorLogger();
        }

        try {
            await whenDomReady();
            this.domReady = true;
            logDebug(debug, 'DOM prêt');

            await whenWindowLoaded();
            this.assetsLoaded = true;
            logDebug(debug, 'Ressources chargées');

            if (options.detectTouch !== false) applyTouchDeviceClass();

            await new Promise<void>((resolve) => {
                removeTemplateLoader(
                    options.loaderSelector ?? DEFAULT_TEMPLATE_LOADER_SELECTOR,
                    options.fadeOutMs ?? 300,
                    () => {
                        if (options.revealBody !== false) {
                            revealDocumentBody(options.bodyVisibility ?? 'visible');
                        }
                        logDebug(debug, 'Application prête à être initialisée');
                        options.onReady?.();
                        resolve();
                    }
                );
            });

            return { domReady: true, assetsLoaded: true };
        } finally {
            detachErrors?.();
        }
    }
}
