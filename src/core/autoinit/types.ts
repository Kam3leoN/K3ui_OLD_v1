import { DEFAULT_COMPONENT_OPTIONS } from '../../config';
import { DEFAULT_SELECTORS } from '../../config/selectors';

/** Options par composant pour AutoInit (dérivées de DEFAULT_COMPONENT_OPTIONS) */
type AutoInitComponentOptions = {
    [K in keyof typeof DEFAULT_COMPONENT_OPTIONS]?: Partial<(typeof DEFAULT_COMPONENT_OPTIONS)[K]>;
};

/**
 * Interface pour les options AutoInit
 * @description Permet de personnaliser l'initialisation de chaque composant
 */
export interface AutoInitOptions extends AutoInitComponentOptions {
    /** Sélecteurs CSS pour l'auto-initialisation des composants */
    selectors?: Partial<typeof DEFAULT_SELECTORS>;

    /**
     * Doc / pages optimisées : si true (défaut doc), `K3UIDocsAutoinit.resolve()` est appelé
     * au moment de l'AutoInit (DOM complet) plutôt qu'à l'exécution de init.js.
     */
    selectorsOnDemand?: boolean;

    /** Désactiver le loader plein écran injecté au chargement (défaut: true = injecté) */
    pageLoader?: boolean;

    /**
     * Page loader : attendre `window` `load` (ressources) en plus de `k3ui-critical-ready`.
     * Défaut `false` — masquage dès l’init critique (recommandé SPA / doc).
     * Mettre `true` pour attendre aussi le chargement complet des ressources (images, polices, etc.).
     */
    pageLoaderWaitForWindowLoad?: boolean;

    /**
     * Durée minimale d’affichage du page loader (ms), après que les conditions de retrait soient remplies.
     * `0` ou omis = aucun délai (comportement par défaut : disparaît dès que c’est prêt, souvent très vite en local).
     * Ex. `400` pour laisser le temps de voir l’animation / la marque sur des pages légères.
     */
    pageLoaderMinDisplayMs?: number;

    /** Masquer le contenu du body jusqu'à k3ui-ready (injection CSS) pour éviter le flash avant le loader */
    hideBodyUntilReady?: boolean;

    /**
     * Racine pour l’observation des icônes (MutationObserver). Par défaut `document.body`.
     * Préférer le conteneur de l’app pour limiter le bruit et le coût sur les grosses pages.
     */
    iconMutationObserverRoot?: HTMLElement | null;

    /**
     * Active performance.mark / measure pour le diagnostic (AutoInit, managers, composants).
     * Peut aussi être défini via `window.K3UI_PROFILE_AUTOINIT = true`.
     */
    profileAutoInit?: boolean;
}

export type {
    ComponentInitElements,
    ComponentInitFn,
    ComponentInitOptions,
    ComponentInitResult,
} from './component-init-helper';
