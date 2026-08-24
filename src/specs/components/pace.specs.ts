/**
 * @fileoverview Spécifications du composant Pace K3UI
 * @description Barre de progression de chargement de page (type pace.js)
 * @author K3UI Team
 * @version 1.0.0
 */

import type { PaceOptions, PaceTheme } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Spécifications du composant Pace
 */
export const PaceSpecs = {
    /** Temps pour rattraper la progression réelle (ms) */
    catchupTime: 100,
    /** Vitesse initiale de la barre (0–1) */
    initialRate: 0.03,
    /** Durée minimale d'affichage (ms) */
    minTime: 150,
    /** Délai avant masquage après 100% (ms) */
    ghostTime: 50,
    /** Progression max par frame (%) */
    maxProgressPerFrame: 20,
    /** Facteur d'easing */
    easeFactor: 1.25,
    /** Démarrer au chargement de la page */
    startOnPageLoad: true,
    /** Redémarrer sur history.pushState/replaceState */
    restartOnPushState: true,
    /** Redémarrer après une requête en cours (ms) */
    restartOnRequestAfter: 500,
    /** Cible d'injection de la barre (sélecteur) */
    target: 'body',
    /** Suivi des éléments (sélecteurs à attendre) */
    elements: {
        checkInterval: 100,
        selectors: ['body'],
    },
    /** Détection du lag (event loop) */
    eventLag: {
        minSamples: 10,
        sampleCount: 3,
        lagThreshold: 3,
    },
    /** Suivi AJAX */
    ajax: {
        trackMethods: ['GET'] as string[],
        trackWebSockets: true,
        ignoreURLs: [] as (string | RegExp)[],
    },
    /** Classe CSS additionnelle sur la barre */
    className: '',
    /** Couleur de la piste (rail) en hex ; vide = couleurs SCSS */
    colorOnTrack: '',
    /** Couleur du remplissage (barre) en hex ; vide = couleurs SCSS */
    colorOnProgress: '',
    /** Thème visuel (material par défaut : loader M3 container 96dp centré) */
    theme: 'material' as PaceTheme,
    /** Backdrop blur plein écran (tous thèmes) */
    backdrop: false,
};

/**
 * Extrait les valeurs par défaut pour Pace
 * @returns Options par défaut
 */
export function getPaceDefaults(): PaceOptions {
    return {
        ...PaceSpecs,
        priorityLevel: PriorityLevel.MEDIUM,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
    };
}
