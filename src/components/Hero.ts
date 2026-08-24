import { Component } from '../core/base/Component';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import { LoggerManager } from '../core/managers';
import { BaseOptions } from '../types/base';
import { PriorityLevel } from '../types/base';
import { KElement, InitElements } from '../types/base';
import { ManagerFactory } from '../core/factories';

/**
 * Interface pour les options du composant Hero
 */
export interface HeroOptions extends BaseOptions {
    /** Titre principal du hero */
    title?: string;
    /** Sous-titre du hero */
    subtitle?: string;
    /** Nom de l'icône brand (ex. k3ui-logo) — affichée via IconManager */
    logo?: string;
    /** Type IconManager pour l'icône brand (dossier sous assets/icons/) */
    logoType?: string;
    /** Classe CSS personnalisée pour le titre */
    titleClass?: string;
    /** Classe CSS personnalisée pour le sous-titre */
    subtitleClass?: string;
    /** Couleur personnalisée pour le fond (nom de couleur ou code hex) */
    color?: string;
    /** Callback appelé lors de l'initialisation */
    onInit?: ((element: HTMLElement) => void) | null;
    /** Callback appelé au début de l'ouverture */
    onOpenStart?: ((element: HTMLElement) => void) | null;
    /** Callback appelé à la fin de l'ouverture */
    onOpenEnd?: ((element: HTMLElement) => void) | null;
    /** Callback appelé au début de la fermeture */
    onCloseStart?: ((element: HTMLElement) => void) | null;
    /** Callback appelé à la fin de la fermeture */
    onCloseEnd?: ((element: HTMLElement) => void) | null;
}

import { getHeroDefaults } from '../specs/components/hero.specs';

/**
 * Options par défaut du composant Hero
 * @description Extrait depuis les specs pour garantir la cohérence
 */
const _defaults: HeroOptions = getHeroDefaults();

/**
 * Composant Hero pour les sections d'en-tête des pages
 */
export class Hero extends Component<HeroOptions> {
    /** Niveau de priorité du composant */
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;
    private logger: LoggerManager;

    /**
     * Options par défaut du composant Hero
     */
    static get defaults(): HeroOptions {
        return _defaults;
    }

    /**
     * Initialise le composant Hero
     * @param els - Sélecteur ou éléments à initialiser
     * @param options - Options de configuration
     */
    public static init<O extends BaseOptions, C extends Component<O>>(
        els: string | KElement | InitElements<KElement>,
        options?: Partial<O>,
        classDef?: ComponentType<C, O>,
        priority?: PriorityLevel
    ): unknown {
        return super.init(els, options, classDef ?? (Hero as unknown as ComponentType<C, O>), priority);
    }

    /**
     * Obtient une instance du composant Hero
     * @param element - Élément DOM
     * @returns Instance du composant Hero
     */
    public static getInstance(element: Element): Hero | undefined {
        return Component.getInstance(element as HTMLElement) as Hero | undefined;
    }

    /**
     * Constructeur du composant Hero
     * @param element - Élément DOM
     * @param options - Options de configuration
     */
    constructor(element: HTMLElement, options: Partial<HeroOptions> = {}) {
        super(element, options, toComponentClassDef(Hero));

        // Initialiser les options avec les valeurs par défaut d'abord
        this.options = {
            ...Hero.defaults,
            ...options
        };

        // Lire les attributs HTML et les appliquer par-dessus
        const title = element.getAttribute('title');
        const subtitle = element.getAttribute('subtitle');
        const color = element.getAttribute('color');
        const logo = element.getAttribute('logo');
        const logoType = element.getAttribute('logo-type');

        if (title !== null) this.options.title = title;
        if (subtitle !== null) this.options.subtitle = subtitle;
        if (color !== null) this.options.color = color;
        if (logo !== null) this.options.logo = logo;
        if (logoType !== null) this.options.logoType = logoType;

        this.logger = ManagerFactory.getLoggerManager('[Hero]');

        this.init();
    }

    /**
     * Initialise le composant Hero
     */
    private init(): void {
        try {
            this.setupStructure();
            this.setupEventListeners();
            this.updateHero();

            if (this.options.onInit) {
                this.options.onInit(this.el);
            }

            this.logger.info('Hero initialisé');
        } catch (error) {
            this.logger.error('Erreur lors de l\'initialisation de Hero:', error);
        }
    }

    /**
     * Configure la structure du composant Hero
     * Préserve le light DOM SSR (LCP mobile) s'il contient déjà le contenu attendu.
     */
    private setupStructure(force = false): void {
        if (!force && this.hasServerRenderedContent()) {
            return;
        }

        const titleClass = this.options.titleClass ? ` class="${this.options.titleClass}"` : '';
        const subtitleClass = this.options.subtitleClass ? ` class="${this.options.subtitleClass}"` : '';
        const logoName = this.options.logo?.trim() ?? '';
        const logoType = this.options.logoType?.trim() || 'k3ui';
        const title = this.options.title?.trim() ?? '';
        const subtitle = this.options.subtitle?.trim() ?? '';
        const showBrandLogo = logoName.length > 0;
        const showTitleText = title.length > 0 && title.toLowerCase() !== 'k3ui';
        const contentClass = showBrandLogo ? 'col s12 hero__content hero__content--center' : 'col s12';

        const brandMarkup = showBrandLogo
            ? `<div class="hero__brand" aria-hidden="true">
                    <i name="${this.escapeHtml(logoName)}" type="${this.escapeHtml(logoType)}" size="xl" aria-hidden="true"></i>
               </div>`
            : '';

        const titleMarkup = showTitleText
            ? `<h1${titleClass}>${this.escapeHtml(title)}</h1>`
            : showBrandLogo
                ? '<h1 class="hero__title-sr">K3UI</h1>'
                : title
                    ? `<h1${titleClass}>${this.escapeHtml(title)}</h1>`
                    : '';

        const subtitleMarkup = subtitle
            ? `<h2${subtitleClass}>${this.escapeHtml(subtitle)}</h2>`
            : '';

        this.el.innerHTML = `
            <div class="container">
                <div class="row">
                    <div class="${contentClass}">
                        ${brandMarkup}
                        ${titleMarkup}
                        ${subtitleMarkup}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Indique si le light DOM a déjà été rendu côté serveur (évite un reflow LCP).
     */
    private hasServerRenderedContent(): boolean {
        return Boolean(
            this.el.querySelector('.hero__content') &&
            (this.el.querySelector('h2') || this.el.querySelector('h1'))
        );
    }

    /**
     * Échappe le texte injecté dans le markup du hero.
     * @param value Texte à échapper
     */
    private escapeHtml(value: string): string {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Configure les écouteurs d'événements
     */
    private setupEventListeners(): void {
        // Pas d'événements spécifiques pour le moment
    }

    /**
     * Met à jour le composant Hero
     */
    private updateHero(): void {
        // Appliquer la couleur personnalisée
        this.applyCustomColor();
    }

    /**
     * Met à jour le titre du hero
     * @param title - Nouveau titre
     */
    public updateTitle(title: string): void {
        this.options.title = title;
        this.setupStructure(true);
        this.updateHero();
    }

    /**
     * Met à jour le sous-titre du hero
     * @param subtitle - Nouveau sous-titre
     */
    public updateSubtitle(subtitle: string): void {
        this.options.subtitle = subtitle;
        this.setupStructure(true);
        this.updateHero();
    }

    /**
     * Applique une couleur personnalisée au hero
     * @param color - Couleur (nom de couleur ou code hex)
     */
    public setColor(color: string): void {
        this.options.color = color;
        this.applyCustomColor();
    }

    /**
     * Applique la couleur personnalisée définie dans les options
     */
    private applyCustomColor(): void {
        if (!this.options.color || this.options.color === 'primary') {
            // Utiliser la couleur primaire par défaut
            this.el.style.removeProperty('background-color');
            this.el.style.removeProperty('color');
            return;
        }

        // Appliquer la couleur personnalisée avec !important
        const backgroundColor = this.parseColor(this.options.color);
        const textColor = this.getContrastColor(backgroundColor);

        this.el.style.setProperty('background-color', backgroundColor, 'important');
        this.el.style.setProperty('color', textColor, 'important');
    }

    /**
     * Parse une couleur (nom ou code hex) et retourne une valeur CSS valide
     * @param color - Couleur à parser
     * @returns Couleur CSS valide
     */
    private parseColor(color: string): string {
        // Si c'est déjà un code hex valide
        if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
            return color;
        }

        // Si c'est un code hex sans #
        if (/^[0-9A-Fa-f]{6}$/.test(color)) {
            return `#${color}`;
        }

        // Si c'est un nom de couleur CSS
        const colorMap: { [key: string]: string } = {
            'red': '#ff0000',
            'green': '#008000',
            'blue': '#0000ff',
            'yellow': '#ffff00',
            'orange': '#ffa500',
            'purple': '#800080',
            'pink': '#ffc0cb',
            'black': '#000000',
            'white': '#ffffff',
            'gray': '#808080',
            'grey': '#808080'
        };

        return colorMap[color.toLowerCase()] || color;
    }

    /**
     * Détermine la couleur de texte appropriée selon la couleur de fond
     * @param backgroundColor - Couleur de fond
     * @returns Couleur de texte (blanc ou noir)
     */
    private getContrastColor(backgroundColor: string): string {
        // Convertir hex en RGB
        const hex = backgroundColor.replace('#', '');
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);

        // Calculer la luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

        // Retourner blanc ou noir selon la luminance
        return luminance > 0.5 ? '#000000' : '#ffffff';
    }

    /**
     * Détruit le composant Hero
     */
    public destroy(): void {
        this.logger.info('Hero détruit');
        super.destroy();
    }
}

/**
 * Enregistrement du Web Component k3ui-hero
 * @description Permet l'utilisation de <k3ui-hero> dans le HTML. Initialisation par AutoInit.
 */
if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-hero')) {
    customElements.define('k3ui-hero', class extends HTMLElement {
        connectedCallback() {
            // L'initialisation sera gérée par AutoInit
            // ou manuellement via K.Hero.init(this)
            if (!this.hasAttribute('data-initialized')) {
                this.setAttribute('data-initialized', 'true');
            }
        }

        disconnectedCallback() {
            const instance = Hero.getInstance(this);
            if (instance && typeof instance.destroy === 'function') {
                instance.destroy();
            }
        }
    });
}
