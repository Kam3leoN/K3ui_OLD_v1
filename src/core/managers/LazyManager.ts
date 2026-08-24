/**
 * @fileoverview LazyManager — activation différée via IntersectionObserver
 * @description Observe des éléments (ou sous-arbres) et exécute un callback
 * lorsqu’ils entrent dans le viewport. Utile pour catalogues d’icônes, images, etc.
 */

export interface LazyObserveOptions {
    /** Marge autour du viewport (syntaxe IntersectionObserver rootMargin). */
    rootMargin?: string;
    /** Seuil d’intersection 0–1. */
    threshold?: number | number[];
    /** Racine de scroll (défaut : viewport). */
    root?: Element | null;
    /** Si true (défaut), n’observe plus après le premier déclenchement. */
    once?: boolean;
}

export type LazyEnterCallback = (element: Element, entry: IntersectionObserverEntry) => void;

/**
 * Gestionnaire global de lazy-loading basé sur IntersectionObserver.
 */
export class LazyManager {
    private static readonly DEFAULT_ROOT_MARGIN = '120px 0px';
    private static readonly DEFAULT_THRESHOLD = 0.01;

    /**
     * Observe une liste d’éléments et appelle `onEnter` à l’entrée dans le viewport.
     * @returns Fonction de cleanup (disconnect)
     */
    static observe(
        elements: ArrayLike<Element> | Element[],
        onEnter: LazyEnterCallback,
        options: LazyObserveOptions = {}
    ): () => void {
        if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
            const list = Array.from(elements as ArrayLike<Element>);
            list.forEach((el) => {
                onEnter(el, {
                    target: el,
                    isIntersecting: true,
                    intersectionRatio: 1
                } as IntersectionObserverEntry);
            });
            return () => undefined;
        }

        const once = options.once !== false;
        const rootMargin = options.rootMargin ?? LazyManager.DEFAULT_ROOT_MARGIN;
        const threshold = options.threshold ?? LazyManager.DEFAULT_THRESHOLD;
        const root = options.root ?? null;

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (!entry.isIntersecting) continue;
                    const el = entry.target;
                    onEnter(el, entry);
                    if (once) {
                        observer.unobserve(el);
                    }
                }
            },
            { root, rootMargin, threshold }
        );

        Array.from(elements as ArrayLike<Element>).forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }

    /**
     * Observe les descendants matching `selector` sous `root`.
     * @returns Fonction de cleanup
     */
    static observeSelector(
        root: ParentNode,
        selector: string,
        onEnter: LazyEnterCallback,
        options: LazyObserveOptions = {}
    ): () => void {
        const nodes = root.querySelectorAll(selector);
        return LazyManager.observe(nodes, onEnter, options);
    }

    /**
     * Active le chargement IconManager des sous-arbres marqués `[data-k3ui-lazy-icons]`.
     * Les icônes portent `data-k3ui-lazy-pending` jusqu’à l’entrée viewport.
     * @returns Fonction de cleanup
     */
    static observeLazyIcons(
        root: ParentNode = typeof document !== 'undefined' ? document : (null as unknown as ParentNode),
        options: LazyObserveOptions = {}
    ): () => void {
        if (!root || typeof document === 'undefined') {
            return () => undefined;
        }

        return LazyManager.observeSelector(
            root,
            '[data-k3ui-lazy-icons]',
            (section) => {
                LazyManager.activateLazyIcons(section as HTMLElement);
            },
            options
        );
    }

    /**
     * Retire le marquage lazy et demande à IconManager de traiter le conteneur.
     */
    static activateLazyIcons(container: HTMLElement): void {
        if (!container) return;

        container.querySelectorAll('[data-k3ui-lazy-pending]').forEach((node) => {
            node.removeAttribute('data-k3ui-lazy-pending');
        });
        container.removeAttribute('data-k3ui-lazy-icons');
        container.setAttribute('data-k3ui-lazy-icons-loaded', 'true');

        const IconManager = (
            typeof window !== 'undefined'
                ? (window as Window & { K?: { IconManager?: { processIconsInContainer?: (el: HTMLElement) => void } } }).K
                      ?.IconManager
                : undefined
        );

        if (IconManager && typeof IconManager.processIconsInContainer === 'function') {
            IconManager.processIconsInContainer(container);
        }
    }
}
