/**
 * @fileoverview Sync chrome flottant (FAB Menu layer, FAB fixed, ScrollToTop…) avec app bars / nav rail
 * @description Variables CSS body --k3ui-rail-inset-* + position des slots .fab-menu-layer
 */

import { ButtonFabMenuSpecs } from '../../specs/components/button-fab-menu.specs';
import { NavigationBarSpecs } from '../../specs/components/navigation-bar.specs';
import { NavigationRailSpecs } from '../../specs/components/navigation-rail.specs';

const LAYER_ID = 'fab-menu-layer';
const INSET_PX = ButtonFabMenuSpecs.layer.insetPx;
const APP_BAR_HEIGHT_PX = ButtonFabMenuSpecs.layer.appBarHeightPx;
const FAB_TOP_REVEAL_PX = INSET_PX + APP_BAR_HEIGHT_PX;

/** Variable CSS : inset bas total quand la navigation bar est affichée (hauteur barre + 16px). */
const BOTTOM_INSET_CSS_VAR = '--k3ui-bottom-inset';

/** Variable CSS : hauteur de la navigation-bar fixed (footer-copyright margin-bottom). */
const NAV_BAR_OFFSET_CSS_VAR = '--k3ui-navigation-bar-offset';

/** Variable CSS : app bar basse révélée (FAB / scroll-to-top). */
const APPBAR_BOTTOM_OFFSET_CSS_VAR = '--k3ui-appbar-bottom-offset';

/** Variables CSS : largeur du navigation-rail visible (sans le +16px FAB — géré en CSS). */
export const RAIL_INSET_LEFT_CSS_VAR = '--k3ui-rail-inset-left';
export const RAIL_INSET_RIGHT_CSS_VAR = '--k3ui-rail-inset-right';

type RailSide = 'left' | 'right';

interface NavigationRailInsets {
    leftPx: number;
    rightPx: number;
}

/**
 * Retourne la hauteur totale (px) des navigation bars fixed visibles (display !== none).
 * Ignore les maquettes no-autoinit / absolute (démos).
 */
function getVisibleNavigationBarOffsetPx(): number {
    const bars = document.querySelectorAll('.navigation-bar, k3ui-navigation-bar');
    let offset = 0;
    bars.forEach((el) => {
        const style = window.getComputedStyle(el);
        if (style.display === 'none') return;
        if (style.position !== 'fixed') return;
        const height = (el as HTMLElement).offsetHeight || 0;
        if (height > 0) offset += NavigationBarSpecs.dimensions.barHeight;
    });
    return offset;
}

/**
 * Docs 3 panes avec trailing-pane actif (TOC) : le chrome flottant est dans la colonne trailing —
 * le footer reveal ne s’y étend pas, on le laisse en bas (pas de remontée au-dessus du copyright).
 */
function hasActiveDocsTrailingPane(): boolean {
    if (!document.body.classList.contains('docs-panes')) return false;

    const trailing = document.querySelector(
        'k3ui-panel-content[data-variant="trailing"], .trailing-pane, k3ui-content-pane.content-pane--trailing'
    ) as HTMLElement | null;

    if (!trailing) return false;
    if (trailing.getAttribute('data-empty') === 'true') return false;
    if (
        trailing.classList.contains('trailing-pane--empty') ||
        trailing.classList.contains('panel-content--empty') ||
        trailing.classList.contains('content-pane--empty')
    ) {
        return false;
    }

    return trailing.querySelector('k3ui-scrollspy, .doc-scrollspy-widget') !== null;
}

/**
 * Docs 3 panes : le footer est sous le layout-pane tant que --docs-footer-reveal vaut 0.
 * Le copyright reste dans le DOM en bas du stack (getBoundingClientRect non nul même caché).
 */
function getDocsFooterRevealPx(): number {
    const stack = document.getElementById('docs-layout-stack');
    if (!stack) return 0;

    const inline = stack.style.getPropertyValue('--docs-footer-reveal').trim();
    const computed = getComputedStyle(stack).getPropertyValue('--docs-footer-reveal').trim();
    const raw = inline || computed;
    const value = parseFloat(raw);
    return Number.isNaN(value) ? 0 : value;
}

/**
 * @returns true si le rideau footer docs est ouvert (collision réelle avec le chrome flottant).
 */
function isDocsFooterRevealed(): boolean {
    if (!document.body.classList.contains('docs-panes')) return true;

    if (getDocsFooterRevealPx() > 0.5) return true;

    const footer = document.getElementById('docs-footer-reveal');
    if (footer?.classList.contains('is-interactive')) return true;

    const pane = document.getElementById('docs-layout-pane')
        ?? document.querySelector(
            'k3ui-panel-content[data-variant="layout"], .layout-pane, k3ui-content-pane.content-pane--layout'
        );
    if (pane instanceof HTMLElement && pane.classList.contains('is-footer-revealing')) {
        return true;
    }

    return false;
}

/**
 * Portion du copyright actuellement visible au-dessus de la navigation-bar.
 * Quand le bandeau est hors viewport (scroll), retourne 0 pour redescendre FAB / scroll-to-top.
 */
function getVisibleFooterCopyrightOffsetPx(): number {
    const el = document.querySelector('.footer-copyright') as HTMLElement | null;
    if (!el) return 0;

    if (hasActiveDocsTrailingPane()) return 0;

    /* Docs panes : pas de collision tant que le footer n'est pas révélé (rideau scroll) */
    if (document.body.classList.contains('docs-panes') && !isDocsFooterRevealed()) {
        return 0;
    }

    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return 0;

    const rect = el.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    if (rect.bottom <= 0 || rect.top >= viewportHeight) return 0;

    const navPx = getVisibleNavigationBarOffsetPx();
    const stackCeiling = navPx > 0 ? viewportHeight - navPx : viewportHeight;

    if (rect.top >= stackCeiling) return 0;

    const visibleTop = Math.max(rect.top, 0);
    const visibleBottom = Math.min(rect.bottom, stackCeiling);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);

    return visibleHeight > 0 ? Math.round(visibleHeight) : 0;
}

/**
 * Empilement bas pour collision footer : copyright visible uniquement (pas la nav bar).
 * La navigation bar a sa propre variable --k3ui-navigation-bar-offset (margin footer).
 */
function getFooterCollisionInsetPx(): number {
    return getVisibleFooterCopyrightOffsetPx();
}

/**
 * Côté du viewport occupé par le rail.
 */
function getNavigationRailSide(rail: HTMLElement): RailSide {
    const rect = rail.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    return centerX < window.innerWidth / 2 ? 'left' : 'right';
}

/**
 * Largeur utile du rail.
 * À l'expand : largeur cible immédiatement (évite le FAB restant sous le rail pendant l'anim).
 * Au collapse / idle : mesure live.
 */
function getNavigationRailWidthPx(rail: HTMLElement): number {
    const expanding =
        rail.classList.contains('navigation-rail--expanding') ||
        (rail.classList.contains('navigation-rail--expanded') &&
            !rail.classList.contains('navigation-rail--collapsing'));

    if (expanding) {
        return Math.max(rail.offsetWidth, NavigationRailSpecs.dimensions.widthExpanded);
    }

    const measured = rail.offsetWidth;
    if (measured > 0) return measured;
    return NavigationRailSpecs.dimensions.widthCollapsed;
}

/**
 * Insets horizontaux dus aux navigation-rails visibles (largeur max par côté).
 */
function getVisibleNavigationRailInsets(): NavigationRailInsets {
    const rails = document.querySelectorAll('.navigation-rail, k3ui-navigation-rail');
    let leftMax = 0;
    let rightMax = 0;

    rails.forEach((node) => {
        const el = node as HTMLElement;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return;
        // Démos in-flow (position absolute/relative) ne doivent pas décaler le chrome viewport
        if (style.position !== 'fixed') return;
        const width = getNavigationRailWidthPx(el);
        if (width <= 0) return;

        const rect = el.getBoundingClientRect();
        const hugsLeft = rect.left <= 2;
        const hugsRight = rect.right >= window.innerWidth - 2;
        if (hugsLeft) leftMax = Math.max(leftMax, width);
        if (hugsRight) rightMax = Math.max(rightMax, width);
        if (!hugsLeft && !hugsRight) {
            const side = getNavigationRailSide(el);
            if (side === 'left') leftMax = Math.max(leftMax, width);
            else rightMax = Math.max(rightMax, width);
        }
    });

    return { leftPx: leftMax, rightPx: rightMax };
}

/** Marge FAB (16px) : le bottom CSS est piloté par les variables body, pas d’inline. */
function setAppBarBottomOffset(appBarBottom: Element | null): void {
    const extra = isAppBarRevealed(appBarBottom) ? APP_BAR_HEIGHT_PX : 0;
    if (extra > 0) {
        document.body.style.setProperty(APPBAR_BOTTOM_OFFSET_CSS_VAR, `${extra}px`);
    } else {
        document.body.style.removeProperty(APPBAR_BOTTOM_OFFSET_CSS_VAR);
    }
}

/**
 * Met à jour --k3ui-bottom-inset et --k3ui-navigation-bar-offset sur body.
 * --k3ui-bottom-inset = copyright visible au scroll (collision footer) — pas la nav bar.
 * --k3ui-navigation-bar-offset = hauteur nav seule (margin-bottom du copyright).
 */
export function setBodyNavigationBarOffset(): void {
    const navPx = getVisibleNavigationBarOffsetPx();
    const footerPx = getFooterCollisionInsetPx();

    if (navPx > 0) {
        document.body.style.setProperty(NAV_BAR_OFFSET_CSS_VAR, `${navPx}px`);
    } else {
        document.body.style.removeProperty(NAV_BAR_OFFSET_CSS_VAR);
    }

    if (footerPx > 0) {
        document.body.style.setProperty(BOTTOM_INSET_CSS_VAR, `${footerPx}px`);
    } else {
        document.body.style.removeProperty(BOTTOM_INSET_CSS_VAR);
    }
}

/** Événement document : chrome flottant resynchronisé (nav, rail, copyright). */
export const FLOATING_CHROME_SYNC_EVENT = 'k3ui-floating-chrome-sync';

function dispatchFloatingChromeSyncEvent(): void {
    document.dispatchEvent(new CustomEvent(FLOATING_CHROME_SYNC_EVENT));
}

/**
 * Met à jour --k3ui-rail-inset-left / --k3ui-rail-inset-right sur body.
 * Consommé en CSS par .fab-menu-layer, .button-fab--fixed, .scroll-to-top, etc.
 */
export function setBodyNavigationRailOffset(): void {
    const { leftPx, rightPx } = getVisibleNavigationRailInsets();
    if (leftPx > 0) {
        document.body.style.setProperty(RAIL_INSET_LEFT_CSS_VAR, `${leftPx}px`);
    } else {
        document.body.style.removeProperty(RAIL_INSET_LEFT_CSS_VAR);
    }
    if (rightPx > 0) {
        document.body.style.setProperty(RAIL_INSET_RIGHT_CSS_VAR, `${rightPx}px`);
    } else {
        document.body.style.removeProperty(RAIL_INSET_RIGHT_CSS_VAR);
    }
}

function findBottomAppBar(): Element | null {
    return document.querySelector('k3ui-appbar[position="bottom"]') ?? document.querySelector('.appbar.appbar--bottom');
}

function findTopAppBar(): Element | null {
    return document.querySelector('k3ui-appbar[position="top"]') ?? document.querySelector('.appbar.appbar--top');
}

/** AppBar visible = pas appbar--collapsed ; bottom aussi pas appbar--scrolled (init). */
function isAppBarRevealed(appBarEl: Element | null): boolean {
    if (!appBarEl) return false;
    if (appBarEl.classList.contains('appbar--collapsed')) return false;
    if (appBarEl.classList.contains('appbar--bottom') && appBarEl.classList.contains('appbar--scrolled')) return false;
    return true;
}

/**
 * Retire les left/right inline (héritage ancienne sync) pour laisser le CSS + variables body piloter.
 */
function clearFabLayerInlineHorizontalInsets(layerEl: HTMLElement): void {
    const slots = layerEl.querySelectorAll(
        '.fab-menu-layer__slot--bottom-left, .fab-menu-layer__slot--bottom-right, .fab-menu-layer__slot--top-left, .fab-menu-layer__slot--top-right'
    );
    slots.forEach((slot) => {
        const el = slot as HTMLElement;
        el.style.removeProperty('left');
        el.style.removeProperty('right');
    });
}

function syncFabLayerVerticalInsets(layerEl: HTMLElement): void {
    const bottomSlots = layerEl.querySelectorAll('.fab-menu-layer__slot--bottom-left, .fab-menu-layer__slot--bottom-right');
    const topSlots = layerEl.querySelectorAll('.fab-menu-layer__slot--top-left, .fab-menu-layer__slot--top-right');
    const appBarBottom = findBottomAppBar();
    const appBarTop = findTopAppBar();

    setAppBarBottomOffset(appBarBottom);

    const skipMotion = !layerEl.classList.contains('fab-menu-layer--positioned');

    bottomSlots.forEach((slot) => {
        const el = slot as HTMLElement;
        el.style.removeProperty('bottom');
        el.style.setProperty('top', 'auto', 'important');
    });

    const topPx = isAppBarRevealed(appBarTop) ? FAB_TOP_REVEAL_PX : INSET_PX;
    const topValue = `calc(${topPx}px + env(safe-area-inset-top, 0px))`;
    topSlots.forEach((slot) => {
        (slot as HTMLElement).style.setProperty('top', topValue, 'important');
    });

    if (skipMotion) {
        layerEl.classList.add('fab-menu-layer--positioned');
        document.body.classList.add('k3ui-floating-chrome-positioned');
    }
}

function syncFloatingChrome(): void {
    setBodyNavigationRailOffset();
    setBodyNavigationBarOffset();
    setAppBarBottomOffset(findBottomAppBar());
    dispatchFloatingChromeSyncEvent();

    const layerEl = document.getElementById(LAYER_ID);
    if (!layerEl) {
        document.body.classList.add('k3ui-floating-chrome-positioned');
        return;
    }

    ensureLayerOnTop();
    clearFabLayerInlineHorizontalInsets(layerEl);
    syncFabLayerVerticalInsets(layerEl);
}

let layerInitialized = false;
let chromeObserversReady = false;

/** Une seule sync par frame pour éviter les rafales depuis plusieurs observers. */
let fabLayerRafId: number | null = null;

/**
 * Demande une sync chrome flottant (rail / app bars) au prochain frame.
 * À appeler depuis NavigationRail à chaque expand/collapse.
 */
export function requestFloatingChromeSync(): void {
    if (fabLayerRafId !== null) return;
    fabLayerRafId = requestAnimationFrame(() => {
        fabLayerRafId = null;
        syncFloatingChrome();
    });
}

/** @deprecated Alias — utiliser requestFloatingChromeSync */
export function scheduleFabLayerSync(): void {
    requestFloatingChromeSync();
}

function setupFloatingChromeObservers(): void {
    if (chromeObserversReady) return;
    chromeObserversReady = true;

    const sync = (): void => requestFloatingChromeSync();
    const layerEl = document.getElementById(LAYER_ID);

    syncFloatingChrome();
    requestAnimationFrame(() => requestFloatingChromeSync());

    if (layerEl) {
        new MutationObserver(() => sync()).observe(layerEl, { childList: true, subtree: false });
    }

    const appBarBottom = findBottomAppBar();
    const appBarTop = findTopAppBar();

    if (appBarBottom) {
        new ResizeObserver(sync).observe(appBarBottom);
        new MutationObserver(sync).observe(appBarBottom, { attributes: true, attributeFilter: ['class', 'style'] });
    }
    if (appBarTop) {
        new ResizeObserver(sync).observe(appBarTop);
        new MutationObserver(sync).observe(appBarTop, { attributes: true, attributeFilter: ['class', 'style'] });
    }

    const observedRails = new WeakSet<Element>();
    const observeRail = (rail: Element): void => {
        if (observedRails.has(rail)) return;
        observedRails.add(rail);
        new ResizeObserver(sync).observe(rail);
        new MutationObserver(sync).observe(rail, {
            attributes: true,
            attributeFilter: ['class', 'style', 'data-expanded'],
        });
    };
    document.querySelectorAll('.navigation-rail, k3ui-navigation-rail').forEach(observeRail);

    const observedNavBars = new WeakSet<Element>();
    const observeNavBar = (bar: Element): void => {
        if (observedNavBars.has(bar)) return;
        observedNavBars.add(bar);
        new ResizeObserver(sync).observe(bar);
        new MutationObserver(sync).observe(bar, {
            attributes: true,
            attributeFilter: ['class', 'style'],
        });
    };
    document.querySelectorAll('.navigation-bar, k3ui-navigation-bar').forEach(observeNavBar);

    const copyrightEl = document.querySelector('.footer-copyright');
    if (copyrightEl) {
        new ResizeObserver(sync).observe(copyrightEl);
    }

    new MutationObserver((mutations) => {
        let shouldSync = false;
        for (const mutation of mutations) {
            mutation.addedNodes.forEach((node) => {
                if (!(node instanceof Element)) return;
                if (node.matches('.navigation-rail, k3ui-navigation-rail')) {
                    observeRail(node);
                    shouldSync = true;
                } else if (node.matches('.navigation-bar, k3ui-navigation-bar')) {
                    observeNavBar(node);
                    shouldSync = true;
                } else {
                    node.querySelectorAll('.navigation-rail, k3ui-navigation-rail').forEach((rail) => {
                        observeRail(rail);
                        shouldSync = true;
                    });
                    node.querySelectorAll('.navigation-bar, k3ui-navigation-bar').forEach((bar) => {
                        observeNavBar(bar);
                        shouldSync = true;
                    });
                }
            });
            mutation.removedNodes.forEach((node) => {
                if (!(node instanceof Element)) return;
                if (
                    node.matches('.navigation-rail, k3ui-navigation-rail, .navigation-bar, k3ui-navigation-bar') ||
                    node.querySelector('.navigation-rail, k3ui-navigation-rail, .navigation-bar, k3ui-navigation-bar')
                ) {
                    shouldSync = true;
                }
            });
        }
        if (shouldSync) sync();
    }).observe(document.body, { childList: true, subtree: true });

    window.addEventListener('resize', sync);
    window.addEventListener('scroll', sync, { passive: true });
    document.addEventListener('k3ui-floating-chrome-sync-request', sync);

    const docsLayoutPane = document.getElementById('docs-layout-pane')
        ?? document.querySelector(
            'k3ui-panel-content[data-variant="layout"], .layout-pane, k3ui-content-pane.content-pane--layout'
        );
    if (docsLayoutPane instanceof HTMLElement) {
        docsLayoutPane.addEventListener('scroll', sync, { passive: true });
    }

    const docsLayoutStack = document.getElementById('docs-layout-stack');
    if (docsLayoutStack) {
        new MutationObserver(sync).observe(docsLayoutStack, {
            attributes: true,
            attributeFilter: ['style', 'class'],
        });
    }

    const docsFooterReveal = document.getElementById('docs-footer-reveal');
    if (docsFooterReveal) {
        new MutationObserver(sync).observe(docsFooterReveal, {
            attributes: true,
            attributeFilter: ['class', 'style'],
        });
    }

    window.addEventListener('load', () => {
        sync();
        setTimeout(sync, 0);
        setTimeout(sync, 100);
        setTimeout(sync, 300);
        setTimeout(sync, 600);
    });
}

function ensureLayerOnTop(): void {
    const el = document.getElementById(LAYER_ID);
    if (!el || el.parentNode === document.body) return;
    document.body.appendChild(el);
}

/**
 * Initialise la synchro chrome flottant (rail + app bars).
 * Fonctionne même sans #fab-menu-layer (variables body pour ButtonFab / ScrollToTop).
 */
export function initFloatingChromeInsets(): void {
    setupFloatingChromeObservers();
    setTimeout(() => syncFloatingChrome(), 350);
}

/**
 * Initialise la synchro de la couche FAB avec les app bars / rails.
 */
export function initFabMenuLayer(): void {
    const layer = document.getElementById(LAYER_ID);
    if (layer) {
        if (!layerInitialized) {
            layerInitialized = true;
            layer.removeAttribute('aria-hidden');
            ensureLayerOnTop();
        }
    }
    initFloatingChromeInsets();
}
