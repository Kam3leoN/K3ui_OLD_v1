/**
 * Spécifications du composant Hero
 * Définit les règles et comportements attendus pour les sections d'en-tête
 */

import { HeroOptions } from '../../components/Hero';

/**
 * Spécifications de base du composant Hero
 */
export const HeroSpecs = {
    /**
     * Sélecteur CSS pour l'AutoInit
     */
    selector: 'k3ui-hero:not(.no-autoinit)',

    /**
     * Options par défaut pour l'AutoInit
     */
    defaultOptions: {
        titleClass: '',
        subtitleClass: ''
    } as Partial<HeroOptions>,

    /**
     * Structure HTML attendue
     */
    expectedStructure: {
        container: '.container',
        row: '.row',
        column: '.col.s12',
        title: 'h1',
        subtitle: 'h4'
    },

    /**
     * Classes CSS requises
     */
    requiredClasses: {
        container: 'container',
        row: 'row',
        column: 'col s12',
        title: '',
        subtitle: ''
    },

    /**
     * Attributs HTML requis
     */
    requiredAttributes: {
        title: 'title',
        subtitle: 'subtitle'
    },

    /**
     * Styles CSS requis
     */
    requiredStyles: {
        background: 'var(--md-sys-color-primary)',
        color: 'var(--md-sys-color-on-primary)',
        borderRadius: '1rem',
        width: 'calc(100% - 4rem)',
        margin: '2rem',
        display: 'block',
        position: 'relative'
    },

    /**
     * Responsive breakpoints
     */
    responsive: {
        mobileBreakpoint: '768px',
        mobilePadding: {
            top: '2rem',
            bottom: '2rem'
        }
    },

    /**
     * Règles d'accessibilité
     */
    accessibility: {
        titleLevel: 1,
        subtitleLevel: 4,
        colorContrast: 'AA',
        focusable: false,
        ariaRole: 'banner'
    },

    /**
     * Animations et transitions
     */
    animations: {
        elevation: 2,
        transitionDuration: '500ms',
        transitionEasing: 'var(--md-sys-motion-spatial-default-easing)'
    },

    /**
     * Validation des données
     */
    validation: {
        title: {
            required: false,
            maxLength: 100,
            type: 'string'
        },
        subtitle: {
            required: false,
            maxLength: 200,
            type: 'string'
        },
        titleClass: {
            required: false,
            type: 'string',
            allowedValues: ['display-large', 'display-medium', 'display-small', 'headline-large']
        },
        subtitleClass: {
            required: false,
            type: 'string',
            allowedValues: ['title-large', 'title-medium', 'title-small', 'body-large']
        }
    },

    /**
     * Callbacks requis
     */
    callbacks: {
        onInit: 'function',
        onOpenStart: 'function',
        onOpenEnd: 'function',
        onCloseStart: 'function',
        onCloseEnd: 'function'
    },

    /**
     * Méthodes publiques
     */
    publicMethods: [
        'updateTitle',
        'updateSubtitle',
        'destroy'
    ],

    /**
     * Propriétés statiques
     */
    staticProperties: [
        'defaults',
        'init',
        'getInstance'
    ],

    /**
     * Événements émis
     */
    events: {
        init: 'hero:init',
        update: 'hero:update',
        destroy: 'hero:destroy'
    },

    /**
     * Tests de régression
     */
    regressionTests: {
        autoInit: 'Le composant doit s\'initialiser automatiquement',
        manualInit: 'Le composant doit s\'initialiser manuellement',
        updateTitle: 'La méthode updateTitle doit fonctionner',
        updateSubtitle: 'La méthode updateSubtitle doit fonctionner',
        destroy: 'La méthode destroy doit nettoyer les ressources',
        responsive: 'Le composant doit être responsive',
        accessibility: 'Le composant doit respecter les standards d\'accessibilité',
        styling: 'Le composant doit appliquer les styles corrects'
    }
};

/**
 * Tests unitaires à exécuter
 */
export const HeroTestCases = [
    {
        name: 'Initialisation automatique',
        test: 'autoInit',
        description: 'Vérifie que le composant s\'initialise automatiquement'
    },
    {
        name: 'Initialisation manuelle',
        test: 'manualInit',
        description: 'Vérifie que le composant s\'initialise manuellement'
    },
    {
        name: 'Structure HTML',
        test: 'htmlStructure',
        description: 'Vérifie que la structure HTML est correcte'
    },
    {
        name: 'Styles CSS',
        test: 'cssStyles',
        description: 'Vérifie que les styles CSS sont appliqués'
    },
    {
        name: 'Mise à jour du titre',
        test: 'updateTitle',
        description: 'Vérifie que la méthode updateTitle fonctionne'
    },
    {
        name: 'Mise à jour du sous-titre',
        test: 'updateSubtitle',
        description: 'Vérifie que la méthode updateSubtitle fonctionne'
    },
    {
        name: 'Destruction du composant',
        test: 'destroy',
        description: 'Vérifie que la méthode destroy nettoie les ressources'
    },
    {
        name: 'Responsive design',
        test: 'responsive',
        description: 'Vérifie que le composant est responsive'
    },
    {
        name: 'Accessibilité',
        test: 'accessibility',
        description: 'Vérifie que le composant respecte les standards d\'accessibilité'
    }
];

/**
 * Extrait les valeurs par défaut pour Hero depuis les specs
 * @returns Options par défaut pour Hero
 */
export function getHeroDefaults(): HeroOptions {
    return {
        title: '',
        subtitle: '',
        logo: '',
        logoType: 'k3ui',
        titleClass: HeroSpecs.defaultOptions.titleClass ?? '',
        subtitleClass: HeroSpecs.defaultOptions.subtitleClass ?? '',
        color: 'primary',
        onInit: undefined,
        onOpenStart: undefined,
        onOpenEnd: undefined,
        onCloseStart: undefined,
        onCloseEnd: undefined,
    };
}

export default HeroSpecs;
