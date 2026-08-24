import { DEFAULT_SELECTORS } from '../../config/selectors';
import type { AutoInitOptions } from './types';
import '../../types/global/k3ui-window';

type DocsAutoinitBridge = {
    resolve: (root?: Document) => Record<string, string>;
};

declare global {
    interface Window {
        /** Options globales (ex. `dist/js/init.js`). */
        K3UI_OPTIONS?: Partial<AutoInitOptions>;
        /** Active `performance.mark` / `measure` pour l’AutoInit. */
        K3UI_PROFILE_AUTOINIT?: boolean;
    }
}

/** Options `window.K3UI_OPTIONS` (objet vide si absent ou hors navigateur). */
export function getK3uiWindowOptions(): Partial<AutoInitOptions> {
    if (typeof window === 'undefined') {
        return {};
    }
    return window.K3UI_OPTIONS ?? {};
}

/**
 * Options globales d’un composant depuis `window.K3UI_OPTIONS` (ex. `Dialog`, `Sheet`).
 * @param component - Clé composant alignée sur `AutoInitOptions` / `init.js`
 */
export function getK3uiComponentWindowOptions<K extends keyof AutoInitOptions>(
    component: K
): NonNullable<Partial<AutoInitOptions>[K]> {
    const value = getK3uiWindowOptions()[component];
    return (value ?? {}) as NonNullable<Partial<AutoInitOptions>[K]>;
}

/** Flag profilage AutoInit (`window.K3UI_PROFILE_AUTOINIT`). */
export function isK3uiProfileAutoInitEnabled(): boolean {
    return typeof window !== 'undefined' && Boolean(window.K3UI_PROFILE_AUTOINIT);
}

/**
 * Fusionne DEFAULT_SELECTORS, K3UI_OPTIONS.selectors et (doc) K3UIDocsAutoinit.resolve().
 * La résolution docs est lazy : exécutée ici, au boot AutoInit, quand le DOM est complet.
 */
export function resolveAutoinitSelectors(options?: Partial<AutoInitOptions>): Record<string, string> {
    const customOptions = getK3uiWindowOptions();
    const mergedOptions: Partial<AutoInitOptions> = { ...customOptions, ...options };
    let pageSelectors = (mergedOptions.selectors ?? {}) as Record<string, string>;

    const useDocsResolve = mergedOptions.selectorsOnDemand !== false;
    if (useDocsResolve && typeof window !== 'undefined') {
        const docsBridge = (window as Window & { K3UIDocsAutoinit?: DocsAutoinitBridge }).K3UIDocsAutoinit;
        if (docsBridge?.resolve) {
            pageSelectors = { ...pageSelectors, ...docsBridge.resolve() };
        }
    }

    const selectors = { ...DEFAULT_SELECTORS, ...pageSelectors } as Record<string, string>;
    if (typeof selectors.Tooltips !== 'string') {
        selectors.Tooltips = DEFAULT_SELECTORS.Tooltips;
    }
    return selectors;
}
