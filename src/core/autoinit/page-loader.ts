import { Loader } from '../../components/Loader';
import { DEFAULT_COMPONENT_OPTIONS } from '../../config';
import { applyTouchDeviceClass, whenWindowLoaded } from '../../utils/dom/readyAndLoad';
import { applyLoadingIndicatorSize, getPageLoaderSize } from '../../utils/loading-indicator';
import { MotionManager } from '../managers';
import { K3UI_HIDE_BODY_STYLE_ID, K3UI_PAGE_LOADER_ID, K3UI_READY_CLASS } from './constants';
import { k3uiLogger } from './logger';
import type { ComponentInitOptions } from './component-init-helper';
import { getK3uiWindowOptions } from './window-options';

/**
 * Snippet à exécuter de façon synchrone dans le <head> pour éviter le FOUC lorsque hideBodyUntilReady est utilisé.
 * Sans ce snippet, le style est injecté au chargement du bundle (après le premier paint), donc un flash peut apparaître.
 */
export const K3UI_HIDE_BODY_UNTIL_READY_CRITICAL_SCRIPT =
    `(function(){var o=typeof window!=="undefined"&&window.K3UI_OPTIONS;if(o&&o.hideBodyUntilReady&&document.head&&!document.getElementById("${K3UI_HIDE_BODY_STYLE_ID}")){var s=document.createElement("style");s.id="${K3UI_HIDE_BODY_STYLE_ID}";s.textContent="body:not(.${K3UI_READY_CLASS}) > *:not(#${K3UI_PAGE_LOADER_ID}){visibility:hidden}";document.head.appendChild(s);}})();`;

/**
 * Injecte en tête de page le CSS qui masque le contenu du body jusqu'à .k3ui-ready (sauf le page loader).
 * À appeler dès l'exécution du script si l'option hideBodyUntilReady est activée.
 * No-op si le style a déjà été injecté (ex. via K3UI_HIDE_BODY_UNTIL_READY_CRITICAL_SCRIPT dans le head).
 */
export function injectHideBodyUntilReadyStyle(): void {
    const opts = getK3uiWindowOptions();
    if (opts.hideBodyUntilReady !== true || !document.head) return;
    if (document.getElementById(K3UI_HIDE_BODY_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = K3UI_HIDE_BODY_STYLE_ID;
    style.textContent = `body:not(.${K3UI_READY_CLASS}) > *:not(#${K3UI_PAGE_LOADER_ID}){visibility:hidden}`;
    document.head.appendChild(style);
}

/**
 * Injecte un loader plein écran (spinner centré, sans voile). Masqué après `k3ui-critical-ready`
 *
 * Sur une doc ou une app locale, l’init critique est surtout **synchrone** (quelques ms) et `load` survient vite
 * si peu de ressources bloquantes ou cache chaud : le loader peut à peine se voir. Optionnel :
 * `pageLoaderMinDisplayMs` pour imposer un plancher d’affichage.
 */
export function injectPageLoader(): void {
    const opts = getK3uiWindowOptions();
    if (opts.pageLoader === false) return;
    if (!document.body || document.getElementById(K3UI_PAGE_LOADER_ID)) return;

    const wrap = document.createElement('div');
    wrap.id = K3UI_PAGE_LOADER_ID;
    wrap.setAttribute('aria-hidden', 'true');
    const loaderOptions =
        opts.Loader != null
            ? opts.Loader
            : ((DEFAULT_COMPONENT_OPTIONS as unknown as Record<string, unknown>).Loader as
                  | Record<string, unknown>
                  | undefined);
    const mergedLoaderOptions = { ...(loaderOptions ?? {}), container: false, blur: false };
    const initialSize = getPageLoaderSize(mergedLoaderOptions as { size?: number } | undefined);

    const reducedMotion = MotionManager.isReducedMotion();
    const enterDurationMs = reducedMotion ? 0 : 100;
    const exitDurationMs = reducedMotion ? 0 : 100;
    const ease = 'var(--md-sys-motion-spatial-fast-easing)';

    wrap.style.cssText =
        'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;' +
        'background:transparent;' +
        (reducedMotion ? 'opacity:1;' : `opacity:0;transition:opacity ${enterDurationMs}ms ${ease}`);
    const inner = document.createElement('div');
    inner.className = 'loading-indicator';
    inner.setAttribute('data-size', String(initialSize));
    inner.style.transform = reducedMotion ? 'scale(1)' : 'scale(0.94)';
    inner.style.transition = reducedMotion ? 'none' : `transform ${enterDurationMs}ms ${ease}`;
    applyLoadingIndicatorSize(inner, initialSize);

    try {
        Loader.init(inner, mergedLoaderOptions as ComponentInitOptions);
        inner.setAttribute('data-no-auto-init', '');
    } catch (e) {
        k3uiLogger.error('Erreur init page loader:', e);
    }

    wrap.appendChild(inner);
    document.body.insertBefore(wrap, document.body.firstChild);
    const pageLoaderShownAt = Date.now();

    if (!reducedMotion) {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                wrap.style.opacity = '1';
                inner.style.transform = 'scale(1)';
            });
        });
    }

    const runPageLoaderExit = (): void => {
        applyTouchDeviceClass();
        Loader.getInstance(inner)?.destroy?.();

        const removeWrap = (): void => {
            if (wrap.isConnected) wrap.remove();
        };

        if (reducedMotion) {
            wrap.style.transition = 'none';
            wrap.style.opacity = '0';
            wrap.style.visibility = 'hidden';
            wrap.style.pointerEvents = 'none';
            wrap.style.background = 'transparent';
            wrap.style.setProperty('-webkit-backdrop-filter', 'none');
            wrap.style.setProperty('backdrop-filter', 'none');
            removeWrap();
            return;
        }

        /** Le blur ne doit pas être animé (transition lente / saccadée) — retrait immédiat, fondu opacity seul */
        wrap.style.setProperty('-webkit-backdrop-filter', 'none');
        wrap.style.setProperty('backdrop-filter', 'none');
        wrap.style.pointerEvents = 'none';
        wrap.style.background = 'transparent';
        wrap.style.transition = `opacity ${exitDurationMs}ms ${ease}`;
        wrap.style.opacity = '0';

        const fallbackId = window.setTimeout(removeWrap, exitDurationMs + 32);
        wrap.addEventListener(
            'transitionend',
            (event) => {
                if (event.propertyName !== 'opacity') return;
                window.clearTimeout(fallbackId);
                removeWrap();
            },
            { once: true },
        );
    };

    const scheduleExitAfterMinDisplay = (): void => {
        const raw = opts.pageLoaderMinDisplayMs;
        const minMs = typeof raw === 'number' && raw > 0 ? raw : 0;
        if (minMs === 0) {
            runPageLoaderExit();
            return;
        }
        const elapsed = Date.now() - pageLoaderShownAt;
        const wait = Math.max(0, minMs - elapsed);
        if (wait > 0) setTimeout(runPageLoaderExit, wait);
        else runPageLoaderExit();
    };

    /** Par défaut : retrait dès l’init critique (SPA / doc) — `true` pour attendre aussi window `load` */
    const waitForFullLoad = opts.pageLoaderWaitForWindowLoad === true;

    /** Filet de sécurité : ne jamais laisser le voile bloquer l’UI (erreur init, load manquant, etc.) */
    const PAGE_LOADER_MAX_MS = 12_000;
    const forceExitTimeoutId = window.setTimeout(() => {
        if (document.getElementById(K3UI_PAGE_LOADER_ID)) {
            k3uiLogger.warn('Page loader : retrait forcé après délai max');
            scheduleExitAfterMinDisplay();
        }
    }, PAGE_LOADER_MAX_MS);

    const clearForceExit = (): void => {
        window.clearTimeout(forceExitTimeoutId);
    };

    const scheduleExitAndClear = (): void => {
        clearForceExit();
        scheduleExitAfterMinDisplay();
    };

    if (waitForFullLoad) {
        const criticalReady = new Promise<void>((resolve) => {
            document.addEventListener('k3ui-critical-ready', () => resolve(), { once: true });
        });
        void Promise.all([criticalReady, whenWindowLoaded()]).then(scheduleExitAndClear);
    } else {
        document.addEventListener('k3ui-critical-ready', scheduleExitAndClear, { once: true });
    }
}
