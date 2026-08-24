/**
 * @fileoverview Scrollbar custom (rail + thumb) synchronisée sur un conteneur scrollable.
 * Masque la scrollbar native ; affiche le rail uniquement en cas de débordement.
 */

export interface CustomScrollbarOptions {
    /** Délai avant de retirer `.is-scrolling` (ms). */
    hideDelayMs?: number;
    /** Hauteur mini du thumb (px). */
    minThumbHeight?: number;
}

export interface CustomScrollbarHandle {
    /** Recalcule taille / position du thumb. */
    update: () => void;
    /** Détruit listeners et observers. */
    destroy: () => void;
}

const DEFAULT_HIDE_DELAY_MS = 900;
const DEFAULT_MIN_THUMB = 24;

/**
 * Lie une scrollbar custom (rail + thumb) à un élément scrollable.
 * Classes attendues : `.is-needed`, `.is-scrolling`, `.is-dragging` sur le rail.
 *
 * @param scroll - Conteneur avec overflow scroll
 * @param rail - Élément rail (track)
 * @param thumb - Élément thumb draggable
 * @param options - Options d’affichage
 * @returns Handle update/destroy
 */
export function bindCustomScrollbar(
    scroll: HTMLElement,
    rail: HTMLElement,
    thumb: HTMLElement,
    options: CustomScrollbarOptions = {},
): CustomScrollbarHandle {
    const hideDelayMs = options.hideDelayMs ?? DEFAULT_HIDE_DELAY_MS;
    const minThumbHeight = options.minThumbHeight ?? DEFAULT_MIN_THUMB;

    let hideTimer = 0;
    let dragging = false;
    let dragOffsetY = 0;

    const maxScroll = (): number => Math.max(0, scroll.scrollHeight - scroll.clientHeight);

    const update = (): void => {
        const max = maxScroll();
        const needed = max > 1;
        rail.classList.toggle('is-needed', needed);
        if (needed) {
            rail.removeAttribute('hidden');
        } else {
            rail.setAttribute('hidden', '');
            return;
        }

        const view = scroll.clientHeight;
        const total = Math.max(1, scroll.scrollHeight);
        const track = rail.clientHeight;
        const thumbH = Math.max(minThumbHeight, Math.round((view / total) * track));
        const maxTop = Math.max(0, track - thumbH);
        const top = max > 0 ? Math.round((scroll.scrollTop / max) * maxTop) : 0;

        thumb.style.height = `${thumbH}px`;
        thumb.style.top = `${top}px`;
    };

    const showScrolling = (): void => {
        rail.classList.add('is-scrolling');
        window.clearTimeout(hideTimer);
        hideTimer = window.setTimeout(() => {
            rail.classList.remove('is-scrolling');
        }, hideDelayMs);
    };

    const onScroll = (): void => {
        update();
        showScrolling();
    };

    const onPointerDown = (event: PointerEvent): void => {
        if (event.button != null && event.button !== 0) return;
        event.preventDefault();
        dragging = true;
        rail.classList.add('is-dragging');
        const thumbRect = thumb.getBoundingClientRect();
        dragOffsetY = event.clientY - thumbRect.top;
        thumb.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent): void => {
        if (!dragging) return;
        const railRect = rail.getBoundingClientRect();
        const thumbH = thumb.offsetHeight;
        const maxTop = Math.max(0, railRect.height - thumbH);
        const y = event.clientY - railRect.top - dragOffsetY;
        const top = Math.min(maxTop, Math.max(0, y));
        const max = maxScroll();
        scroll.scrollTop = maxTop > 0 ? (top / maxTop) * max : 0;
        update();
    };

    const onPointerUp = (event: PointerEvent): void => {
        if (!dragging) return;
        dragging = false;
        rail.classList.remove('is-dragging');
        try {
            thumb.releasePointerCapture(event.pointerId);
        } catch {
            /* ignore */
        }
        showScrolling();
    };

    const onRailPointerDown = (event: PointerEvent): void => {
        if (event.target === thumb) return;
        if (event.button != null && event.button !== 0) return;
        const railRect = rail.getBoundingClientRect();
        const thumbH = thumb.offsetHeight;
        const maxTop = Math.max(0, railRect.height - thumbH);
        const y = event.clientY - railRect.top - thumbH / 2;
        const top = Math.min(maxTop, Math.max(0, y));
        const max = maxScroll();
        scroll.scrollTop = maxTop > 0 ? (top / maxTop) * max : 0;
        update();
        showScrolling();
    };

    scroll.addEventListener('scroll', onScroll, { passive: true });
    thumb.addEventListener('pointerdown', onPointerDown);
    thumb.addEventListener('pointermove', onPointerMove);
    thumb.addEventListener('pointerup', onPointerUp);
    thumb.addEventListener('pointercancel', onPointerUp);
    rail.addEventListener('pointerdown', onRailPointerDown);

    const resizeObserver =
        typeof ResizeObserver !== 'undefined'
            ? new ResizeObserver(() => {
                  update();
              })
            : null;
    if (resizeObserver) {
        resizeObserver.observe(scroll);
        Array.from(scroll.children).forEach((child) => {
            if (child instanceof Element) resizeObserver.observe(child);
        });
    }

    const mutationObserver =
        typeof MutationObserver !== 'undefined'
            ? new MutationObserver(() => {
                  if (resizeObserver) {
                      Array.from(scroll.children).forEach((child) => {
                          if (child instanceof Element) {
                              try {
                                  resizeObserver.observe(child);
                              } catch {
                                  /* ignore */
                              }
                          }
                      });
                  }
                  update();
                  window.requestAnimationFrame(update);
              })
            : null;
    if (mutationObserver) {
        mutationObserver.observe(scroll, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: ['class', 'style', 'hidden'],
        });
    }

    const onWinResize = (): void => {
        update();
    };
    window.addEventListener('resize', onWinResize, { passive: true });
    update();

    return {
        update,
        destroy: () => {
            window.clearTimeout(hideTimer);
            scroll.removeEventListener('scroll', onScroll);
            thumb.removeEventListener('pointerdown', onPointerDown);
            thumb.removeEventListener('pointermove', onPointerMove);
            thumb.removeEventListener('pointerup', onPointerUp);
            thumb.removeEventListener('pointercancel', onPointerUp);
            rail.removeEventListener('pointerdown', onRailPointerDown);
            window.removeEventListener('resize', onWinResize);
            resizeObserver?.disconnect();
            mutationObserver?.disconnect();
        },
    };
}
