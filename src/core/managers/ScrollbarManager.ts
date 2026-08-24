/**
 * @fileoverview ScrollbarManager — scrollbar custom (rail + thumb) K3UI
 * @description API unifiée pour Dialog, NavigationRail, panel-content, docs layout.
 * Masque la scrollbar native et synchronise un rail externe ou en gutter.
 */

import {
    bindCustomScrollbar,
    type CustomScrollbarHandle,
} from '../../utils/dom/customScrollbar';
import type {
    ScrollbarBindOptions,
    ScrollbarHandle,
    ScrollbarPlacement,
} from '../../types/managers/scrollbar';

const DEFAULT_RAIL_CLASS = 'k3ui-scrollbar';
const DEFAULT_THUMB_CLASS = 'k3ui-scrollbar__thumb';
const DEFAULT_VIEWPORT_MARGIN = 4;
const DEFAULT_THUMB_WIDTH = 5;
const DEFAULT_ENLARGE_FACTOR = 2;

/**
 * Gestionnaire utilitaire de scrollbars custom (instances multiples par composant).
 */
export class ScrollbarManager {
    /**
     * Vérifie si le rail est entièrement visible dans le viewport (visualViewport ou window).
     *
     * @param rail - Élément rail positionné
     * @param margin - Marge de sécurité (px)
     */
    static isRailVisibleInViewport(rail: HTMLElement, margin = DEFAULT_VIEWPORT_MARGIN): boolean {
        if (typeof window === 'undefined') {
            return true;
        }
        const rect = rail.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) {
            return false;
        }
        const viewport = window.visualViewport;
        const vw = viewport?.width ?? window.innerWidth;
        const vh = viewport?.height ?? window.innerHeight;
        const offsetLeft = viewport?.offsetLeft ?? 0;
        const offsetTop = viewport?.offsetTop ?? 0;
        return (
            rect.left >= offsetLeft + margin &&
            rect.right <= offsetLeft + vw - margin &&
            rect.top >= offsetTop + margin &&
            rect.bottom <= offsetTop + vh - margin
        );
    }

    /**
     * Aligne le rail sur les bounds verticales d’un élément scrollable dans son host.
     *
     * @param host - Conteneur positionné (position relative / fixed)
     * @param scroll - Zone scrollable de référence
     * @param rail - Rail à dimensionner
     */
    static syncScrollBounds(host: HTMLElement, scroll: HTMLElement, rail: HTMLElement): void {
        const hostRect = host.getBoundingClientRect();
        const scrollRect = scroll.getBoundingClientRect();
        if (hostRect.height <= 0 || scrollRect.height <= 0) {
            return;
        }
        const top = scrollRect.top - hostRect.top;
        rail.style.top = `${Math.max(0, top)}px`;
        rail.style.height = `${scrollRect.height}px`;
        rail.style.bottom = 'auto';
    }

    /**
     * Applique le placement externe / interne du rail.
     * En mode `auto`, tente l’externe puis bascule interne si clip viewport.
     *
     * @param rail - Rail à positionner
     * @param placement - Mode de placement
     * @param viewportMargin - Marge viewport (px)
     * @returns Placement effectif
     */
    static resolvePlacement(
        rail: HTMLElement,
        placement: ScrollbarPlacement = 'auto',
        viewportMargin = DEFAULT_VIEWPORT_MARGIN,
    ): 'external' | 'internal' {
        const setExternal = (): void => {
            rail.classList.add('k3ui-scrollbar--external');
            rail.classList.remove('k3ui-scrollbar--internal');
        };
        const setInternal = (): void => {
            rail.classList.add('k3ui-scrollbar--internal');
            rail.classList.remove('k3ui-scrollbar--external');
        };

        if (placement === 'internal') {
            setInternal();
            return 'internal';
        }
        if (placement === 'external') {
            setExternal();
            return 'external';
        }

        setExternal();
        const rect = rail.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && !ScrollbarManager.isRailVisibleInViewport(rail, viewportMargin)) {
            setInternal();
            return 'internal';
        }
        return 'external';
    }

    /**
     * Crée un couple rail + thumb avec les classes demandées.
     *
     * @param railClass - Classe du rail
     * @param thumbClass - Classe du thumb
     * @returns Éléments rail et thumb
     */
    static createRail(
        railClass: string = DEFAULT_RAIL_CLASS,
        thumbClass: string = DEFAULT_THUMB_CLASS,
    ): { rail: HTMLElement; thumb: HTMLElement } {
        const rail = document.createElement('div');
        rail.className = `${DEFAULT_RAIL_CLASS} ${railClass}`.trim();
        rail.setAttribute('aria-hidden', 'true');
        rail.hidden = true;

        const thumb = document.createElement('div');
        thumb.className = thumbClass;
        rail.appendChild(thumb);

        return { rail, thumb };
    }

    /**
     * Lie une scrollbar custom à un conteneur scrollable.
     *
     * @param options - Scroll, host, géométrie et classes
     * @returns Handle refresh/update/destroy
     */
    static bind(options: ScrollbarBindOptions): ScrollbarHandle {
        const {
            scroll,
            railHost = scroll.parentElement ?? scroll,
            geometryTarget = scroll,
            geometry = 'none',
            placement = 'auto',
            viewportMargin = DEFAULT_VIEWPORT_MARGIN,
            railClass = DEFAULT_RAIL_CLASS,
            thumbClass = DEFAULT_THUMB_CLASS,
            removeRailOnDestroy = false,
            enlargeOnInteraction = true,
            enlargeFactor = DEFAULT_ENLARGE_FACTOR,
            thumbWidth = DEFAULT_THUMB_WIDTH,
            hideDelayMs,
            minThumbHeight,
        } = options;

        let rail = options.rail;
        let thumb: HTMLElement | null = null;

        if (rail) {
            rail.classList.add(DEFAULT_RAIL_CLASS);
            thumb = rail.querySelector<HTMLElement>(`.${thumbClass.split(/\s+/)[0] ?? DEFAULT_THUMB_CLASS}`);
            if (!thumb) {
                thumb = rail.querySelector<HTMLElement>(`:scope > [class*="scrollbar"]`);
            }
        } else {
            const created = ScrollbarManager.createRail(railClass, thumbClass);
            rail = created.rail;
            thumb = created.thumb;
            railHost.appendChild(rail);
        }

        if (!thumb) {
            throw new Error('[ScrollbarManager] Thumb introuvable pour le rail fourni.');
        }

        rail.style.setProperty('--k3ui-scrollbar-thumb-width', `${thumbWidth}px`);
        rail.style.setProperty('--k3ui-scrollbar-enlarge-factor', String(enlargeFactor));

        const applyGeometry = (): void => {
            if (geometry === 'scroll-bounds') {
                ScrollbarManager.syncScrollBounds(railHost, geometryTarget, rail);
            }
        };

        const applyPlacement = (): void => {
            const hostRect = railHost.getBoundingClientRect();
            if (hostRect.width <= 0 || hostRect.height <= 0) {
                return;
            }
            ScrollbarManager.resolvePlacement(rail, placement, viewportMargin);
        };

        const onPointerEnter = (): void => {
            if (enlargeOnInteraction) {
                rail.classList.add('is-hovering');
            }
        };
        const onPointerLeave = (): void => {
            rail.classList.remove('is-hovering');
        };

        if (enlargeOnInteraction) {
            rail.addEventListener('pointerenter', onPointerEnter);
            rail.addEventListener('pointerleave', onPointerLeave);
        }

        const innerHandle: CustomScrollbarHandle = bindCustomScrollbar(scroll, rail, thumb, {
            hideDelayMs,
            minThumbHeight,
        });

        const refresh = (): void => {
            applyGeometry();
            applyPlacement();
            innerHandle.update();
        };

        applyGeometry();
        applyPlacement();
        innerHandle.update();

        const onViewportChange = (): void => {
            refresh();
        };
        window.addEventListener('resize', onViewportChange, { passive: true });
        window.visualViewport?.addEventListener('resize', onViewportChange, { passive: true });
        window.visualViewport?.addEventListener('scroll', onViewportChange, { passive: true });

        return {
            rail,
            thumb,
            refresh,
            update: innerHandle.update,
            destroy: () => {
                rail.classList.remove('is-hovering');
                rail.removeEventListener('pointerenter', onPointerEnter);
                rail.removeEventListener('pointerleave', onPointerLeave);
                window.removeEventListener('resize', onViewportChange);
                window.visualViewport?.removeEventListener('resize', onViewportChange);
                window.visualViewport?.removeEventListener('scroll', onViewportChange);
                innerHandle.destroy();
                if (removeRailOnDestroy) {
                    rail.remove();
                }
            },
        };
    }
}
