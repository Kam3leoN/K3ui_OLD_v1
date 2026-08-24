/**
 * @fileoverview Composant Card — Material Design 3 Expressive
 * @author K3UI Team
 * @version 2.0.0
 */

import { Component } from '../core/base/Component';
import { defineK3UIElement } from '../core/base/K3UIElement';
import { toComponentClassDef } from '../types/components/component-base';
import { CardOptions, CardData, CardAction, CardVariant, CardSize, CardShape } from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { setAriaAttributes, removeAriaAttribute } from '../utils/dom/aria';
import { LoggerManager, LocaleManager } from '../core/managers';
import { ManagerFactory } from '../core/factories';
import { Keyboard } from '../core/managers/KeyboardManager';
import { Mouse } from '../core/managers/MouseManager';
import { getPointerPressReleaseBindings } from '../utils/dom/pointer';
import { Ripple } from '../utils/effects/ripple';
import { getCardDefaults } from '../specs/components/card.specs';
import { Shape } from './Shape';
import { sanitizeHtmlFragment } from '../utils/dom/sanitize';

interface KCardHTMLElement extends HTMLElement {
    K_Card?: Card;
}

const _defaults: CardOptions = getCardDefaults();

/** Balises autorisées pour le contenu HTML de la carte (option `allowHTML`) */
const CARD_ALLOWED_TAGS = new Set([
    'div', 'span', 'p', 'b', 'i', 'u', 's', 'strong', 'em', 'del',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'br', 'hr',
    'ul', 'ol', 'li', 'a', 'img',
]);
const CARD_ALLOWED_ATTRS: Record<string, Set<string>> = {
    div: new Set(['class', 'id', 'style', 'role', 'data-*', 'aria-*']),
    span: new Set(['class', 'id', 'style', 'role', 'data-*', 'aria-*']),
    p: new Set(['class', 'id', 'style', 'role', 'data-*', 'aria-*']),
    ul: new Set(['class', 'id', 'style', 'role', 'data-*', 'aria-*']),
    ol: new Set(['class', 'id', 'style', 'role', 'data-*', 'aria-*']),
    li: new Set(['class', 'id', 'style', 'role', 'data-*', 'aria-*']),
    a: new Set(['class', 'id', 'style', 'href', 'target', 'rel', 'role', 'data-*', 'aria-*']),
    img: new Set(['class', 'id', 'style', 'src', 'alt', 'width', 'height', 'loading', 'data-*', 'aria-*']),
};

/**
 * Composant Card pour Material Design 3 Expressive
 */
export class Card extends Component<CardOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    private static readonly VARIANTS: CardVariant[] = ['elevated', 'filled', 'outlined'];
    private static readonly SIZES: CardSize[] = ['small', 'medium', 'large'];
    private static readonly SHAPES: CardShape[] = ['medium', 'largeIncreased', 'extraLargeIncreased'];
    private static readonly RADIUS_CLASSES = [
        'card--radius-small', 'card--radius-medium', 'card--radius-large',
        'card--radius-extra-large', 'card--radius-full',
    ];
    private static readonly SHAPE_CLASSES = [
        'card--shape-medium', 'card--shape-large-increased', 'card--shape-extra-large-increased',
    ];
    private static readonly ELEVATION_CLASSES = [
        'card--elevation-1', 'card--elevation-2', 'card--elevation-3',
        'card--elevation-4', 'card--elevation-5',
    ];
    private static readonly PADDING_CLASSES = [
        'card--padding-small', 'card--padding-medium', 'card--padding-large', 'card--padding-legacy',
    ];

    private cardData: CardData | null = null;
    private headerElement: HTMLElement | null = null;
    private contentElement: HTMLElement | null = null;
    private actionsElement: HTMLElement | null = null;
    private mediaElement: HTMLElement | null = null;
    private stateLayerElement: HTMLElement | null = null;
    private checkedIconElement: HTMLElement | null = null;
    private logger: LoggerManager;
    private rippleInstance: Ripple | null = null;
    private keyboardInstance: Keyboard | null = null;
    private mouseInstance: Mouse | null = null;
    private actionCleanups: Array<() => void> = [];

    private readonly handleCardClickBound = (event: MouseEvent | KeyboardEvent): void => {
        this.handleCardClick(event);
    };

    private readonly handleFocusInBound = (): void => {
        this.el.classList.add('card--focused');
    };

    private readonly handleFocusOutBound = (): void => {
        this.el.classList.remove('card--focused');
    };

    /**
     * Options par défaut du composant
     * @returns Les options par défaut
     */
    static get defaults(): CardOptions {
        return { ..._defaults };
    }

    /**
     * Obtient l'instance du composant pour un élément donné
     * @param el Élément HTML
     * @returns L'instance Card ou null
     */
    static getInstance(el: HTMLElement): Card | null {
        return (el as KCardHTMLElement).K_Card ?? null;
    }

    /**
     * Initialise les composants Card
     * @param els Éléments HTML ou NodeList
     * @param options Options de configuration
     * @returns Tableau des instances créées
     */
    static init(
        els: KElement | InitElements<KElement> | string,
        options: Partial<CardOptions> = {}
    ): Card[] {
        const result = Component.init(els, options, toComponentClassDef(Card));
        if (Array.isArray(result)) {
            return result as Card[];
        }
        return result ? [result as Card] : [];
    }

    /**
     * Constructeur du composant Card
     * @param el Élément HTML
     * @param options Options de configuration
     */
    constructor(el: HTMLElement, options: Partial<CardOptions> = {}) {
        super(el, options, toComponentClassDef(Card));

        this.logger = ManagerFactory.getLoggerManager('[Card]');

        this.options = {
            ...Card.defaults,
            ...options,
        };

        this.resolveInteractiveMode(options);

        (el as KCardHTMLElement).K_Card = this;

        this.init();
    }

    /**
     * Active le mode interactif si onClick, data-interactive ou classe présente
     * @private
     */
    private resolveInteractiveMode(options: Partial<CardOptions>): void {
        if (
            options.onClick ||
            options.clickable ||
            this.el.hasAttribute('data-interactive') ||
            this.el.classList.contains('card--interactive')
        ) {
            this.options.interactive = true;
        }
    }

    /**
     * Initialise le composant
     * @private
     */
    private init(): void {
        this.cardData = this.options.data ?? null;

        this.applyClasses(true);
        this.setupStructure();
        this.ensureStateLayer();
        this.setupAccessibility();
        this.attachEventListeners();
        this.updateCard();

        if (this.isInteractive() && this.options.ripple !== false) {
            this.setupRipple();
        }

        if (this.options.selected || this.options.checkable) {
            this.updateCheckedState();
        }

        this.initShapeAvatars();

        this.options.onOpenStart?.(this);
        this.options.onOpenEnd?.(this);

        this.logger.info('Card initialisée');
    }

    /**
     * Initialise les avatars shape (masque M3 Expressive) dans la carte
     * @private
     */
    private initShapeAvatars(): void {
        this.el.querySelectorAll<HTMLElement>('.card__avatar[data-shape]').forEach((avatarEl) => {
            if (!Shape.getInstance(avatarEl)) {
                Shape.init(avatarEl);
            }
        });
    }

    /**
     * Indique si la carte est interactive
     * @returns true si interactive
     */
    private isInteractive(): boolean {
        return !!this.options.interactive && !this.el.classList.contains('card--disabled');
    }

    /**
     * Applique les classes CSS selon les options
     * @private
     */
    private applyClasses(detectFromHtml = false): void {
        this.el.classList.add('card');
        if (detectFromHtml) {
            this.detectOptionsFromHTML();
        }
        this.removeModifierClasses();
        this.applyModifierClasses();
    }

    /**
     * Détecte les options depuis le HTML existant
     * @private
     */
    private detectOptionsFromHTML(): void {
        for (const variant of Card.VARIANTS) {
            if (this.el.classList.contains(`card--${variant}`)) {
                this.options.variant = variant;
                break;
            }
        }

        for (const size of Card.SIZES) {
            if (this.el.classList.contains(`card--padding-${size}`)) {
                this.options.size = size;
                break;
            }
        }

        if (this.el.classList.contains('card--shape-large-increased')) {
            this.options.shape = 'largeIncreased';
        } else if (this.el.classList.contains('card--shape-extra-large-increased')) {
            this.options.shape = 'extraLargeIncreased';
        }

        if (this.el.classList.contains('card--full-width')) {
            this.options.fullWidth = true;
        }
        if (this.el.classList.contains('card--actions-horizontal')) {
            this.options.horizontalActions = true;
        }
        if (this.el.classList.contains('card--actions-vertical')) {
            this.options.verticalActions = true;
        }
        if (this.el.classList.contains('card--selected')) {
            this.options.selected = true;
        }
        if (this.el.classList.contains('card--checkable')) {
            this.options.checkable = true;
        }
    }

    /**
     * Retire les classes modificateurs avant réapplication
     * @private
     */
    private removeModifierClasses(): void {
        Card.VARIANTS.forEach((v) => this.el.classList.remove(`card--${v}`));
        Card.PADDING_CLASSES.forEach((c) => this.el.classList.remove(c));
        Card.RADIUS_CLASSES.forEach((c) => this.el.classList.remove(c));
        Card.SHAPE_CLASSES.forEach((c) => this.el.classList.remove(c));
        Card.ELEVATION_CLASSES.forEach((c) => this.el.classList.remove(c));
        this.el.classList.remove(
            'card--actions-horizontal',
            'card--actions-vertical',
            'card--full-width',
            'card--interactive',
            'card--selected',
            'card--checkable'
        );
    }

    /**
     * Applique les classes modificateurs depuis les options
     * @private
     */
    private applyModifierClasses(): void {
        this.el.classList.add(`card--${this.options.variant}`);
        this.el.classList.add(`card--padding-${this.options.size}`);

        if (this.options.shape === 'largeIncreased') {
            this.el.classList.add('card--shape-large-increased');
        } else if (this.options.shape === 'extraLargeIncreased') {
            this.el.classList.add('card--shape-extra-large-increased');
        } else {
            this.el.classList.add('card--shape-medium');
        }

        if (this.options.radius) {
            this.el.classList.add(`card--radius-${this.options.radius}`);
        }

        if (this.options.elevation && this.options.elevation >= 1 && this.options.elevation <= 5) {
            this.el.classList.add(`card--elevation-${this.options.elevation}`);
        }

        if (this.options.fullWidth) {
            this.el.classList.add('card--full-width');
        }
        if (this.options.horizontalActions) {
            this.el.classList.add('card--actions-horizontal');
        }
        if (this.options.verticalActions) {
            this.el.classList.add('card--actions-vertical');
        }
        if (this.isInteractive()) {
            this.el.classList.add('card--interactive');
        }
        if (this.options.selected) {
            this.el.classList.add('card--selected');
        }
        if (this.options.checkable) {
            this.el.classList.add('card--checkable');
        }
    }

    /**
     * Configure la structure DOM de la carte
     * @private
     */
    private setupStructure(): void {
        const hasStructure =
            this.el.querySelector('.card__header') ||
            this.el.querySelector('.card__content') ||
            this.el.querySelector('.card__actions');

        if (hasStructure) {
            this.headerElement = this.el.querySelector('.card__header');
            this.contentElement = this.el.querySelector('.card__content');
            this.actionsElement = this.el.querySelector('.card__actions');
            this.mediaElement = this.el.querySelector('.card__media');
        } else {
            this.createStructure();
        }
    }

    /**
     * Crée la structure DOM si absente et données fournies
     * @private
     */
    private createStructure(): void {
        if (this.cardData?.image && !this.mediaElement) {
            this.mediaElement = document.createElement('img');
            this.mediaElement.className = 'card__media';
            this.mediaElement.alt = this.cardData.title ?? '';
            this.el.insertBefore(this.mediaElement, this.el.firstChild);
        }

        if (!this.headerElement) {
            this.headerElement = document.createElement('div');
            this.headerElement.className = 'card__header';
            this.el.appendChild(this.headerElement);
        }

        if (!this.contentElement) {
            this.contentElement = document.createElement('div');
            this.contentElement.className = 'card__content';
            this.el.appendChild(this.contentElement);
        }

        if (!this.actionsElement) {
            this.actionsElement = document.createElement('div');
            this.actionsElement.className = 'card__actions';
            this.el.appendChild(this.actionsElement);
        }
    }

    /**
     * Assure la présence du calque d'état pour les cartes interactives
     * @private
     */
    private ensureStateLayer(): void {
        if (!this.isInteractive()) {
            return;
        }

        this.stateLayerElement = this.el.querySelector('.card__state-layer');
        if (!this.stateLayerElement) {
            this.stateLayerElement = document.createElement('div');
            this.stateLayerElement.className = 'card__state-layer';
            this.stateLayerElement.setAttribute('aria-hidden', 'true');
            this.el.insertBefore(this.stateLayerElement, this.el.firstChild);
        }
    }

    /**
     * Configure l'accessibilité ARIA
     * @private
     */
    private setupAccessibility(): void {
        if (this.isInteractive()) {
            setAriaAttributes(this.el, {
                role: 'button',
                label: LocaleManager.t('card.ariaClickable'),
                disabled: this.el.classList.contains('card--disabled'),
            });
            if (!this.el.hasAttribute('tabindex')) {
                this.el.setAttribute('tabindex', '0');
            }
        } else {
            setAriaAttributes(this.el, {
                role: 'article',
                label: LocaleManager.t('card.ariaCard'),
            });
            removeAriaAttribute(this.el, 'disabled');
        }
    }

    /**
     * Attache les écouteurs d'événements
     * @private
     */
    private attachEventListeners(): void {
        if (!this.isInteractive()) {
            return;
        }

        this.keyboardInstance = new Keyboard({
            target: this.el,
            ignoreSystemKeys: false,
            onKeyDown: (event: KeyboardEvent) => this.handleKeydown(event),
        });

        this.mouseInstance = new Mouse({
            target: this.el,
            onMouseEnter: () => this.el.classList.add('card--hovered'),
            onMouseLeave: () => this.el.classList.remove('card--hovered'),
        });

        this.registerEvent(this.el, 'click', this.handleCardClickBound);
        this.registerEvent(this.el, 'focusin', this.handleFocusInBound);
        this.registerEvent(this.el, 'focusout', this.handleFocusOutBound);

        getPointerPressReleaseBindings(this.el, {
            onPress: () => {
                this.el.classList.add('card--pressed', 'pressing');
            },
            onRelease: () => {
                this.el.classList.remove('card--pressed', 'pressing');
            },
        }).forEach((binding) => {
            this.registerEvent(binding.target, binding.type, binding.handler, binding.options);
        });
    }

    /**
     * Configure l'effet ripple Material
     * @private
     */
    private setupRipple(): void {
        this.rippleInstance = new Ripple(this.el);
        this.rippleInstance.attach();
    }

    /**
     * Gère le clic sur la carte
     * @param event Événement souris ou clavier
     * @private
     */
    private handleCardClick(event: MouseEvent | KeyboardEvent): void {
        if (!this.isInteractive()) {
            return;
        }

        if (this.options.checkable) {
            this.toggleSelected();
        }

        if (this.options.onClick) {
            this.options.onClick(this.el, this.cardData ?? { id: 0 });
        }
    }

    /**
     * Gère la navigation clavier
     * @param event Événement clavier
     * @private
     */
    private handleKeydown(event: KeyboardEvent): void {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.handleCardClick(event);
        }
    }

    /**
     * Bascule l'état sélectionné (carte checkable)
     * @public
     */
    public toggleSelected(): void {
        this.options.selected = !this.options.selected;
        this.updateCheckedState();
    }

    /**
     * Met à jour l'état visuel checked/selected
     * @private
     */
    private updateCheckedState(): void {
        this.el.classList.toggle('card--selected', !!this.options.selected);

        if (this.options.checkable && this.options.selected) {
            if (!this.checkedIconElement) {
                this.checkedIconElement = document.createElement('span');
                this.checkedIconElement.className = 'card__checked-icon';
                this.checkedIconElement.setAttribute('aria-hidden', 'true');
                this.checkedIconElement.innerHTML = '<i class="k3ui-icon" name="check_circle" type="classic" size="md"></i>';
                this.el.appendChild(this.checkedIconElement);
            }
        } else if (this.checkedIconElement) {
            this.checkedIconElement.remove();
            this.checkedIconElement = null;
        }
    }

    /**
     * Gère le clic sur une action
     * @param action Action cliquée
     * @param event Événement
     * @private
     */
    private handleActionClick(action: CardAction, event: Event): void {
        event.stopPropagation();
        if (this.options.onActionClick) {
            this.options.onActionClick(this.el, action, this.cardData ?? { id: 0 });
        }
    }

    /**
     * Met à jour le contenu de la carte
     * @private
     */
    private updateCard(): void {
        this.updateHeader();
        this.updateContent();
        this.updateActions();
        this.updateMedia();
    }

    /**
     * Met à jour l'en-tête
     * @private
     */
    private updateHeader(): void {
        if (!this.headerElement || !this.cardData) {
            return;
        }

        this.headerElement.innerHTML = '';

        if (this.cardData.title) {
            const titleElement = document.createElement('h3');
            titleElement.className = 'card__title';
            titleElement.textContent = this.cardData.title;
            this.headerElement.appendChild(titleElement);
        }

        if (this.cardData.subtitle) {
            const subtitleElement = document.createElement('p');
            subtitleElement.className = 'card__subtitle';
            subtitleElement.textContent = this.cardData.subtitle;
            this.headerElement.appendChild(subtitleElement);
        }
    }

    /**
     * Met à jour le contenu
     * @private
     */
    private updateContent(): void {
        if (!this.contentElement || !this.cardData?.content) {
            return;
        }

        if (this.options.allowHTML) {
            this.contentElement.innerHTML = sanitizeHtmlFragment(
                this.cardData.content,
                CARD_ALLOWED_TAGS,
                CARD_ALLOWED_ATTRS
            );
        } else {
            this.contentElement.textContent = this.cardData.content;
        }
    }

    /**
     * Met à jour les actions
     * @private
     */
    private updateActions(): void {
        if (!this.actionsElement || !this.cardData?.actions?.length) {
            return;
        }

        this.clearActionListeners();
        this.actionsElement.innerHTML = '';

        this.cardData.actions.forEach((action: CardAction, index: number) => {
            const actionElement = this.createActionElement(action, index);
            this.actionsElement!.appendChild(actionElement);
        });
    }

    /**
     * Crée un bouton d'action M3 (text button)
     * @param action Configuration de l'action
     * @returns Élément bouton
     * @private
     */
    private createActionElement(action: CardAction, index = 0): HTMLElement {
        const actionElement = document.createElement('button');
        actionElement.type = 'button';
        const emphasis = index === 0 ? 'card__action--primary' : 'card__action--secondary';
        actionElement.className = `btn btn--text btn--sm ripple card__action ${emphasis}`;
        actionElement.textContent = action.text;

        if (action.icon) {
            const iconElement = document.createElement('i');
            iconElement.className = 'k3ui-icon';
            iconElement.setAttribute('name', action.icon);
            iconElement.setAttribute('type', 'classic');
            iconElement.setAttribute('size', 'sm');
            actionElement.prepend(iconElement);
        }

        const handler = (event: Event): void => this.handleActionClick(action, event);
        const cleanup = this.registerEvent(actionElement, 'click', handler);
        this.actionCleanups.push(cleanup);

        return actionElement;
    }

    /**
     * Nettoie les listeners des actions
     * @private
     */
    private clearActionListeners(): void {
        this.actionCleanups.forEach((cleanup) => cleanup());
        this.actionCleanups = [];
    }

    /**
     * Met à jour le média
     * @private
     */
    private updateMedia(): void {
        if (!this.cardData?.image) {
            return;
        }

        if (!this.mediaElement) {
            this.mediaElement = document.createElement('img');
            this.mediaElement.className = 'card__media';
            this.el.insertBefore(this.mediaElement, this.el.firstChild);
        }

        if (this.mediaElement instanceof HTMLImageElement) {
            this.mediaElement.src = this.cardData.image;
            this.mediaElement.alt = this.cardData.title ?? '';
        } else {
            (this.mediaElement as HTMLElement).style.backgroundImage = `url(${this.cardData.image})`;
        }
    }

    /**
     * Met à jour les options du composant
     * @param newOptions Nouvelles options partielles
     * @public
     */
    public updateOptions(newOptions: Partial<CardOptions>): void {
        this.options = { ...this.options, ...newOptions };
        this.resolveInteractiveMode(newOptions);

        if (newOptions.data !== undefined) {
            this.cardData = newOptions.data;
        }

        this.applyClasses(false);
        this.ensureStateLayer();
        this.setupAccessibility();
        this.updateCard();
        this.updateCheckedState();
    }

    /**
     * Définit les données de la carte
     * @param data Données de la carte
     * @public
     */
    public setData(data: CardData): void {
        this.cardData = data;
        if (!this.headerElement && !this.contentElement) {
            this.createStructure();
        }
        this.updateCard();
    }

    /**
     * Récupère les données de la carte
     * @returns Données ou null
     * @public
     */
    public getData(): CardData | null {
        return this.cardData;
    }

    /**
     * Active la carte
     * @public
     */
    public enable(): void {
        this.options.interactive = true;
        this.el.classList.remove('card--disabled');
        removeAriaAttribute(this.el, 'disabled');
    }

    /**
     * Désactive la carte
     * @public
     */
    public disable(): void {
        this.options.interactive = false;
        this.el.classList.add('card--disabled');
        setAriaAttributes(this.el, { disabled: true });
    }

    /**
     * Met la carte au focus
     * @public
     */
    public focus(): void {
        this.el.focus();
    }

    /**
     * Détruit l'instance du composant
     * @public
     */
    public override destroy(): void {
        if (!this.el) {
            return;
        }

        this.options.onCloseStart?.(this);

        this.clearActionListeners();
        this.rippleInstance?.detach();
        this.rippleInstance = null;
        this.keyboardInstance?.destroy();
        this.keyboardInstance = null;
        this.mouseInstance?.destroy();
        this.mouseInstance = null;

        if ((this.el as KCardHTMLElement).K_Card === this) {
            delete (this.el as KCardHTMLElement).K_Card;
        }

        this.options.onCloseEnd?.(this);
        this.logger.info('Card détruite');
        super.destroy();
    }
}

defineK3UIElement('k3ui-card', Card);

declare global {
    interface Window {
        Card: typeof Card;
    }
}
