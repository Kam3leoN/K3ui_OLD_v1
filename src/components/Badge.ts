/**
 * @fileoverview Composant Badge pour K3UI
 * @description Composant de notification conforme aux spécifications Material Design 3 Expressive
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import { BadgeOptions } from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { setAriaAttributes, removeAriaAttribute } from '../utils/dom/aria';
import { LoggerManager } from '../core/managers';
import { ManagerFactory } from '../core/factories';
import { getBadgeDefaults } from '../specs/components/badge.specs';
import { getPreferReducedMotion } from '../utils/accessibility';

interface KBadgeHTMLElement extends HTMLElement {
    K_Badge?: Badge;
}

/**
 * Valeurs par défaut pour les options
 */
const _defaults: BadgeOptions = getBadgeDefaults();

const BADGE_POSITIONS: readonly BadgeOptions['position'][] = [
    'top-right', 'top-left', 'bottom-right', 'bottom-left',
];

/** Centrage sur le coin (pastille compacte / small) */
const BADGE_COMPACT_TRANSFORMS: Record<BadgeOptions['position'], string> = {
    'top-right': 'translate(50%, -50%)',
    'top-left': 'translate(-50%, -50%)',
    'bottom-right': 'translate(50%, 50%)',
    'bottom-left': 'translate(-50%, 50%)',
};

const ANCHOR_SELECTORS = [
    'button.btn--icon',
    'a.btn--icon',
    'div.btn--icon',
    'i[name]',
    'i.icon',
    'i[class*="icon"]',
    'svg',
] as const;

function isBadgePosition(value: string): value is BadgeOptions['position'] {
    return (BADGE_POSITIONS as readonly string[]).includes(value);
}

/**
 * Classe Badge pour K3UI
 * @description Composant de notification qui s'affiche sur un élément parent
 */
export class Badge extends Component<BadgeOptions> {
    /** Niveau de priorité du composant */
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    /** Logger pour le composant */
    private logger: LoggerManager;

    /** Élément badge créé */
    private badgeElement: HTMLElement | null = null;

    /** Contenu du badge */
    private content: string | number | null = null;

    /** Observateur de redimensionnement pour recalculer la position */
    private positionObserver: ResizeObserver | null = null;

    /** Élément visuel utilisé comme ancre de positionnement */
    private anchorElement: HTMLElement | null = null;

    /**
     * Options par défaut du composant
     * @returns Les options par défaut
     */
    static get defaults(): BadgeOptions {
        return { ..._defaults };
    }

    /**
     * Obtient l'instance du composant pour un élément donné
     * @param el Élément HTML
     * @returns L'instance Badge
     */
    static getInstance(el: HTMLElement): Badge | null {
        return (el as KBadgeHTMLElement).K_Badge || null;
    }

    /**
     * Initialise les composants
     * @param els Éléments HTML ou sélecteur CSS
     * @param options Options de configuration
     * @returns Instance ou tableau des instances créées
     */
    static init(
        els: KElement | InitElements<KElement> | string,
        options: Partial<BadgeOptions> = {}
    ): Badge | Badge[] {
        return Component.init(els, options, toComponentClassDef(Badge)) as Badge | Badge[];
    }

    /**
     * Constructeur du composant
     * @param el Élément HTML parent sur lequel le badge sera positionné
     * @param options Options de configuration
     */
    constructor(el: HTMLElement, options: Partial<BadgeOptions> = {}) {
        super(el, options, toComponentClassDef(Badge));

        this.logger = ManagerFactory.getLoggerManager('[Badge]');

        // Initialiser les options
        this.options = {
            ...Badge.defaults,
            ...options,
        };

        // Stocker l'instance sur l'élément
        (el as KBadgeHTMLElement).K_Badge = this;

        // Initialiser le composant
        this.init();
    }

    /**
     * Retourne l’élément visuel servant d’ancre au badge (icône, bouton icône, ou l’hôte lui-même).
     * @private
     */
    private getAnchorElement(): HTMLElement {
        if (this.anchorElement && this.el.contains(this.anchorElement)) {
            return this.anchorElement;
        }

        const tagName = this.el.tagName.toLowerCase();
        if (tagName === 'i' || tagName === 'svg') {
            this.anchorElement = this.el;
            return this.el;
        }

        if (
            this.el.classList.contains('btn--icon')
            && (tagName === 'button' || tagName === 'a' || tagName === 'div')
        ) {
            this.anchorElement = this.el;
            return this.el;
        }

        for (const selector of ANCHOR_SELECTORS) {
            const candidate = this.el.querySelector(selector);
            if (candidate instanceof HTMLElement) {
                this.anchorElement = candidate;
                return candidate;
            }
        }

        this.anchorElement = this.el;
        return this.el;
    }

    /**
     * Prépare l’hôte pour le positionnement absolu du badge.
     * @private
     */
    private ensureHostStyles(): void {
        const computedStyle = window.getComputedStyle(this.el);
        if (computedStyle.position === 'static') {
            this.el.style.position = 'relative';
        }

        const anchor = this.getAnchorElement();
        if (anchor === this.el) {
            const display = computedStyle.display;
            if (display === 'block' || display === '' || display === 'list-item') {
                this.el.style.display = 'inline-flex';
            }
            this.el.classList.add('badge-host');
        } else if (!this.el.hasAttribute('data-badge')) {
            this.el.classList.add('badge-host');
        }
    }

    /**
     * Planifie un recalcul de position après rendu / changement de contenu.
     * @private
     */
    private scheduleApplyPosition(): void {
        requestAnimationFrame(() => {
            this.applyPosition();
        });
    }

    /**
     * Observe les changements de taille de l’hôte et de l’ancre.
     * @private
     */
    private setupPositionObserver(): void {
        if (typeof ResizeObserver === 'undefined') {
            return;
        }

        this.positionObserver?.disconnect();
        this.positionObserver = new ResizeObserver(() => {
            this.applyPosition();
        });

        this.positionObserver.observe(this.el);
        const anchor = this.getAnchorElement();
        if (anchor !== this.el) {
            this.positionObserver.observe(anchor);
        }
    }

    /**
     * Arrête l’observateur de position.
     * @private
     */
    private teardownPositionObserver(): void {
        this.positionObserver?.disconnect();
        this.positionObserver = null;
    }

    /**
     * Initialise le composant
     * @private
     */
    private init(): void {
        this.ensureHostStyles();

        // Lire les options depuis les attributs data-* du parent AVANT de chercher/créer le badge
        this.readOptionsFromParent();

        // Chercher un badge existant dans le parent
        const existingBadge = this.el.querySelector('.badge') as HTMLElement;

        if (existingBadge) {
            // Utiliser le badge existant
            this.badgeElement = existingBadge;

            // Lire la configuration depuis le HTML du badge existant
            this.readConfigFromHTML();
        } else {
            // Créer un nouveau badge
            this.createBadge();
        }

        // Appliquer les attributs ARIA
        this.setupAccessibility();

        this.setupPositionObserver();
        this.scheduleApplyPosition();

        this.logger.info('Component initialized');
    }

    /**
     * Lit les options depuis les attributs data-* du parent
     * @private
     */
    private readOptionsFromParent(): void {
        // Lire la variante
        const variant = this.el.getAttribute('data-variant');
        if (variant === 'small' || variant === 'large') {
            this.options.variant = variant;
        }

        // Lire la position
        const position = this.el.getAttribute('data-position');
        if (position && isBadgePosition(position)) {
            this.options.position = position;
        }

        // Lire le contenu
        const content = this.el.getAttribute('data-content');
        if (content !== null) {
            const numValue = parseInt(content, 10);
            if (!isNaN(numValue)) {
                this.options.content = numValue;
            } else {
                this.options.content = content;
            }
        }

        // Lire les couleurs
        const bgColor = this.el.getAttribute('data-background-color');
        if (bgColor) {
            this.options.backgroundColor = bgColor;
        }

        const textColor = this.el.getAttribute('data-text-color');
        if (textColor) {
            this.options.textColor = textColor;
        }
    }

    /**
     * Lit la configuration depuis le HTML existant
     * @private
     */
    private readConfigFromHTML(): void {
        if (!this.badgeElement) return;

        // Lire la variante depuis les classes
        if (this.badgeElement.classList.contains('badge--small')) {
            this.options.variant = 'small';
        } else if (this.badgeElement.classList.contains('badge--large')) {
            this.options.variant = 'large';
        }

        // Lire la position depuis les classes
        const positionClasses = ['badge--top-right', 'badge--top-left', 'badge--bottom-right', 'badge--bottom-left'];
        for (const posClass of positionClasses) {
            if (this.badgeElement.classList.contains(posClass)) {
                const pos = posClass.replace('badge--', '');
                if (isBadgePosition(pos)) {
                    this.options.position = pos;
                }
                // La classe CSS est déjà présente, pas besoin de la réajouter
                break;
            }
        }

        this.ensureHostStyles();

        // Lire le contenu depuis data-content ou textContent
        const dataContent = this.badgeElement.getAttribute('data-content');
        if (dataContent !== null) {
            // Essayer de parser comme nombre
            const numValue = parseInt(dataContent, 10);
            if (!isNaN(numValue)) {
                this.options.content = numValue;
            } else {
                this.options.content = dataContent;
            }
        } else if (this.badgeElement.textContent) {
            // Lire depuis le textContent si pas de data-content
            const text = this.badgeElement.textContent.trim();
            const numValue = parseInt(text, 10);
            if (!isNaN(numValue) && text === numValue.toString()) {
                this.options.content = numValue;
            } else if (text) {
                this.options.content = text;
            }
        }

        // Lire les couleurs depuis les styles inline
        const bgColor = this.badgeElement.style.backgroundColor;
        if (bgColor) {
            this.options.backgroundColor = bgColor;
        }

        const textColor = this.badgeElement.style.color;
        if (textColor) {
            this.options.textColor = textColor;
        }

        // Mettre à jour le contenu selon la configuration lue
        this.updateContent();

        this.setupPositionObserver();
        this.scheduleApplyPosition();
    }

    /**
     * Crée l'élément badge
     * @private
     */
    private createBadge(): void {
        // Supprimer le badge existant s'il y en a un
        if (this.badgeElement) {
            this.badgeElement.remove();
        }

        this.ensureHostStyles();

        // Créer l'élément badge
        this.badgeElement = document.createElement('span');
        this.badgeElement.className = 'badge';

        // Appliquer la variante
        if (this.options.variant === 'small') {
            this.badgeElement.classList.add('badge--small');
        } else {
            this.badgeElement.classList.add('badge--large');
        }

        // Définir le contenu d'abord pour avoir les bonnes dimensions
        this.updateContent();

        // Appliquer la position via la classe CSS (pour les styles de base)
        this.badgeElement.classList.add(`badge--${this.options.position}`);

        // Appliquer les styles personnalisés
        if (this.options.backgroundColor) {
            this.badgeElement.style.backgroundColor = this.options.backgroundColor;
        }
        if (this.options.textColor) {
            this.badgeElement.style.color = this.options.textColor;
        }

        // Ajouter le badge à l'élément parent
        this.el.appendChild(this.badgeElement);

        this.scheduleApplyPosition();
    }

    /**
     * Indique si le contenu doit utiliser la pastille compacte (un seul chiffre).
     * @private
     */
    private isCompactContent(contentText: string): boolean {
        return contentText.length === 1 && /^\d$/.test(contentText);
    }

    /**
     * Retourne le texte affiché dans le badge.
     * @private
     */
    private getDisplayContentText(): string {
        if (this.options.variant === 'small') {
            return '';
        }
        if (typeof this.options.content === 'number') {
            return this.options.content > 999 ? '999+' : this.options.content.toString();
        }
        if (typeof this.options.content === 'string') {
            return this.options.content;
        }
        return '';
    }

    /**
     * Applique la position du badge par rapport au coin de l’élément ancre (icône, bouton, carte, texte…).
     * @private
     */
    private applyPosition(): void {
        if (!this.badgeElement?.parentNode) {
            return;
        }

        const hostRect = this.el.getBoundingClientRect();
        const anchor = this.getAnchorElement();
        const anchorRect = anchor.getBoundingClientRect();

        const offsetTop = anchorRect.top - hostRect.top;
        const offsetLeft = anchorRect.left - hostRect.left;
        const offsetRight = hostRect.right - anchorRect.right;
        const offsetBottom = hostRect.bottom - anchorRect.bottom;

        const contentText = this.getDisplayContentText();
        const useCompactLayout =
            this.options.variant === 'small'
            || (this.options.variant === 'large' && this.isCompactContent(contentText));

        this.badgeElement.style.top = '';
        this.badgeElement.style.right = '';
        this.badgeElement.style.bottom = '';
        this.badgeElement.style.left = '';

        if (useCompactLayout) {
            switch (this.options.position) {
                case 'top-right':
                    this.badgeElement.style.top = `${offsetTop}px`;
                    this.badgeElement.style.right = `${offsetRight}px`;
                    break;
                case 'top-left':
                    this.badgeElement.style.top = `${offsetTop}px`;
                    this.badgeElement.style.left = `${offsetLeft}px`;
                    break;
                case 'bottom-right':
                    this.badgeElement.style.bottom = `${offsetBottom}px`;
                    this.badgeElement.style.right = `${offsetRight}px`;
                    break;
                case 'bottom-left':
                    this.badgeElement.style.bottom = `${offsetBottom}px`;
                    this.badgeElement.style.left = `${offsetLeft}px`;
                    break;
                default:
                    break;
            }
            this.badgeElement.style.transform = BADGE_COMPACT_TRANSFORMS[this.options.position];
            return;
        }

        // Libellé : aligné sur le bord du coin, s’étend vers l’intérieur (évite le clipping à droite)
        this.badgeElement.style.setProperty('transform', 'none');

        switch (this.options.position) {
            case 'top-right':
                this.badgeElement.style.top = `${offsetTop}px`;
                this.badgeElement.style.right = `${offsetRight}px`;
                break;
            case 'top-left':
                this.badgeElement.style.top = `${offsetTop}px`;
                this.badgeElement.style.left = `${offsetLeft}px`;
                break;
            case 'bottom-right':
                this.badgeElement.style.bottom = `${offsetBottom}px`;
                this.badgeElement.style.right = `${offsetRight}px`;
                break;
            case 'bottom-left':
                this.badgeElement.style.bottom = `${offsetBottom}px`;
                this.badgeElement.style.left = `${offsetLeft}px`;
                break;
            default:
                break;
        }
    }

    /**
     * Met à jour le contenu du badge
     * @private
     */
    private updateContent(): void {
        if (!this.badgeElement) return;

        // Pour la variante small, pas de contenu
        if (this.options.variant === 'small') {
            this.badgeElement.textContent = '';
            this.badgeElement.classList.remove('badge--compact', 'badge--label');
            this.clearBadgeInlineDimensions();
            this.scheduleApplyPosition();
            return;
        }

        const contentText = this.getDisplayContentText();
        this.badgeElement.textContent = contentText;

        const isCompact = this.isCompactContent(contentText);
        this.badgeElement.classList.toggle('badge--compact', isCompact);
        this.badgeElement.classList.toggle('badge--label', !isCompact);
        this.clearBadgeInlineDimensions();

        this.content = this.options.content;
        this.scheduleApplyPosition();
    }

    /**
     * Supprime les dimensions inline pour laisser les classes SCSS gérer la taille.
     * @private
     */
    private clearBadgeInlineDimensions(): void {
        if (!this.badgeElement) return;
        this.badgeElement.style.removeProperty('width');
        this.badgeElement.style.removeProperty('min-width');
        this.badgeElement.style.removeProperty('max-width');
        this.badgeElement.style.removeProperty('height');
        this.badgeElement.style.removeProperty('min-height');
        this.badgeElement.style.removeProperty('padding');
        this.badgeElement.style.removeProperty('overflow');
        this.badgeElement.style.removeProperty('text-overflow');
    }

    /**
     * Configure l'accessibilité
     * @private
     */
    private setupAccessibility(): void {
        if (!this.badgeElement) return;

        const content = this.options.content;
        const ariaLabel = typeof content === 'number'
            ? `${content} notifications`
            : typeof content === 'string'
                ? content
                : 'Badge';

        setAriaAttributes(this.badgeElement, {
            role: 'status',
            'aria-label': ariaLabel,
        });

        // Respecter prefers-reduced-motion
        if (this.options.autoDisableForReducedMotion) {
            const prefersReducedMotion = getPreferReducedMotion();
            if (prefersReducedMotion) {
                this.badgeElement.style.transition = 'none';
            }
        }
    }

    /**
     * Met à jour le contenu du badge
     * @param content Nouveau contenu (string ou number)
     */
    public updateContentValue(content: string | number | null): void {
        this.options.content = content;
        this.updateContent();
        this.setupAccessibility();
    }

    /**
     * Met à jour la variante du badge
     * @param variant Nouvelle variante ('small' ou 'large')
     */
    public updateVariant(variant: 'small' | 'large'): void {
        this.options.variant = variant;
        if (this.badgeElement) {
            this.badgeElement.classList.remove('badge--small', 'badge--large');
            this.badgeElement.classList.add(`badge--${variant}`);
            this.updateContent();
        }
    }

    /**
     * Met à jour la position du badge
     * @param position Nouvelle position
     */
    public updatePosition(position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'): void {
        this.options.position = position;

        this.ensureHostStyles();

        if (this.badgeElement) {
            this.badgeElement.classList.remove(
                'badge--top-right',
                'badge--top-left',
                'badge--bottom-right',
                'badge--bottom-left'
            );
            this.badgeElement.classList.add(`badge--${position}`);
            this.scheduleApplyPosition();
        }
    }

    /**
     * Met à jour les couleurs du badge
     * @param backgroundColor Nouvelle couleur de fond
     * @param textColor Nouvelle couleur du texte
     */
    public updateColors(backgroundColor?: string, textColor?: string): void {
        if (backgroundColor) {
            this.options.backgroundColor = backgroundColor;
            if (this.badgeElement) {
                this.badgeElement.style.backgroundColor = backgroundColor;
            }
        }
        if (textColor) {
            this.options.textColor = textColor;
            if (this.badgeElement) {
                this.badgeElement.style.color = textColor;
            }
        }
    }

    /**
     * Affiche le badge
     */
    public show(): void {
        if (this.badgeElement) {
            this.badgeElement.style.display = '';
            this.badgeElement.style.visibility = 'visible';
            this.badgeElement.style.opacity = '1';
        }
    }

    /**
     * Cache le badge
     */
    public hide(): void {
        if (this.badgeElement) {
            this.badgeElement.style.display = 'none';
        }
    }

    /**
     * Détruit l'instance du composant
     */
    public override destroy(): void {
        this.teardownPositionObserver();
        this.anchorElement = null;

        // Supprimer le badge du DOM
        if (this.badgeElement && this.badgeElement.parentNode) {
            this.badgeElement.parentNode.removeChild(this.badgeElement);
        }

        // Nettoyer les attributs ARIA
        if (this.badgeElement) {
            removeAriaAttribute(this.badgeElement, 'role');
            removeAriaAttribute(this.badgeElement, 'aria-label');
        }

        // Supprimer l'instance de l'élément
        if ((this.el as KBadgeHTMLElement).K_Badge === this) {
            delete (this.el as KBadgeHTMLElement).K_Badge;
        }

        this.badgeElement = null;
        this.logger.info('Component destroyed');
    }
}

/**
 * Enregistrement du Web Component k3ui-badge
 * @description Permet l'utilisation de <k3ui-badge> dans le HTML. Initialisation par AutoInit.
 */
if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-badge')) {
    customElements.define('k3ui-badge', class extends HTMLElement {
        private badgeInstance: Badge | null = null;

        connectedCallback() {
            // L'initialisation sera gérée par AutoInit
            // ou manuellement via K.Badge.init(this)
            if (!this.hasAttribute('data-initialized')) {
                this.setAttribute('data-initialized', 'true');
            }
        }

        disconnectedCallback() {
            // Nettoyage lors de la suppression du DOM
            if (this.badgeInstance) {
                this.badgeInstance.destroy();
                this.badgeInstance = null;
            }
        }
    });
}

