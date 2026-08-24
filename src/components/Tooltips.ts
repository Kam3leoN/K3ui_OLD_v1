/**
 * @fileoverview Composant Tooltips pour K3UI
 * @description Infobulles plain/rich conformes Material 3 (12 ancrages, flèche, motion springs)
 * @author K3UI Team
 * @version 2.0.0
 */

import { Component } from '../core/base/Component';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import {
    TooltipsOptions,
    TooltipPlacement,
    TooltipMode,
    TooltipSide,
    TooltipAlign,
    TooltipAction,
} from '../types/components';
import { PriorityLevel } from '../types/base';
import { setAriaAttributes, removeAriaAttribute } from '../utils/dom/aria';
import { sanitizeHtmlFragment } from '../utils/dom/sanitize';
import { LoggerManager, LocaleManager } from '../core/managers';
import { ManagerFactory } from '../core/factories';
import { getTooltipsDefaults } from '../specs/components/tooltips.specs';
import { HapticManager } from '../core/managers/HapticManager';
import { shouldSkipMotion, getMaxMotionDurationMs } from '../utils/motion/buildMotionTransition';
import { MotionPresets } from '../specs/common/motion-presets.specs';

const _defaults: TooltipsOptions = getTooltipsDefaults();

/** Synchronisé avec --tooltip-gap */
const GAP = 10;
/** Protrusion visible (height − overlap) */
const ARROW = 9;
/** Seuil viewport M3 (32 px) */
const VIEWPORT_MARGIN = 32;
/** Délai de grâce pour atteindre un tooltip rich interactif */
const RICH_CLOSE_DELAY = 120;
/** Inset minimal de la flèche depuis le coin du tooltip */
const ARROW_INSET = 16;

const OPPOSITE_SIDE: Record<TooltipSide, TooltipSide> = {
    top: 'bottom',
    bottom: 'top',
    left: 'right',
    right: 'left',
};

/**
 * Décompose un placement M3 en côté + alignement.
 * @param placement - Placement complet (ex. top-start)
 */
function parsePlacement(placement: TooltipPlacement): { side: TooltipSide; align: TooltipAlign } {
    const [side, align] = placement.split('-') as [TooltipSide, TooltipAlign?];
    return { side, align: align ?? 'center' };
}

/**
 * Classe Tooltips pour K3UI
 */
export class Tooltips extends Component<TooltipsOptions> {
    /** Priorité HIGH pour s'attacher même aux éléments déjà pris par Button (MEDIUM) */
    readonly priority: PriorityLevel = PriorityLevel.HIGH;

    private logger: LoggerManager;
    private tooltipEl: HTMLDivElement | null = null;
    private shellEl: HTMLDivElement | null = null;
    private panelEl: HTMLDivElement | null = null;
    private _showDelayTimer: number | null = null;
    private _hideDelayTimer: number | null = null;
    private _dismissTimer: number | null = null;
    private _isVisible = false;
    private _clickOutsideCleanup: (() => void) | null = null;
    private readonly _reposition = (): void => {
        if (this._isVisible && this.tooltipEl?.isConnected) {
            this._position();
        }
    };

    static get defaults(): TooltipsOptions {
        return { ..._defaults };
    }

    static getInstance(el: HTMLElement): Tooltips | undefined {
        return Component.getInstance(el) as Tooltips | undefined;
    }

    static init(
        els: HTMLElement | NodeListOf<HTMLElement> | string,
        options: Partial<TooltipsOptions> = {}
    ): Tooltips[] {
        return Component.init(els, options, toComponentClassDef(Tooltips), PriorityLevel.HIGH) as Tooltips[];
    }

    constructor(el: HTMLElement, options: Partial<TooltipsOptions> = {}) {
        super(el, options, toComponentClassDef(Tooltips));

        this.logger = ManagerFactory.getLoggerManager('[Tooltips]');

        this.options = {
            ...Tooltips.defaults,
            ...options,
            ...this._readAttributes(),
        };

        this.init();
    }

    /**
     * Lit les options depuis les attributs data-* de l'élément
     */
    private _readAttributes(): Partial<TooltipsOptions> {
        const o: Partial<TooltipsOptions> = {};
        const content = this.el.getAttribute('data-tooltip');
        if (content != null) o.content = content;
        const body = this.el.getAttribute('data-tooltip-body');
        if (body != null) o.body = body;
        const placement = this.el.getAttribute('data-tooltip-placement') as TooltipPlacement | null;
        if (placement) o.placement = placement;
        const type = this.el.getAttribute('data-tooltip-type') as TooltipsOptions['type'] | null;
        if (type) o.type = type;
        const trigger = this.el.getAttribute('data-tooltip-trigger') as TooltipsOptions['trigger'] | null;
        if (trigger) o.trigger = trigger;
        const mode = this.el.getAttribute('data-tooltip-mode') as TooltipMode | null;
        if (mode === 'plain' || mode === 'rich') o.mode = mode;
        const title = this.el.getAttribute('data-tooltip-title');
        if (title != null) o.title = title;
        const motion = this.el.getAttribute('data-tooltip-motion') as TooltipsOptions['motion'] | null;
        if (motion === 'standard' || motion === 'expressive') o.motion = motion;
        const motionSpeed = this.el.getAttribute('data-tooltip-motion-speed') as TooltipsOptions['motionSpeed'] | null;
        if (motionSpeed === 'fast' || motionSpeed === 'default' || motionSpeed === 'slow') {
            o.motionSpeed = motionSpeed;
        }
        const offsetAttr = this.el.getAttribute('data-tooltip-offset');
        if (offsetAttr != null) o.offset = parseInt(offsetAttr, 10) || _defaults.offset;
        const richActionsAttr = this.el.getAttribute('data-tooltip-rich-actions');
        if (richActionsAttr === 'false' || richActionsAttr === '0') o.richActions = false;
        const actionsAttr = this.el.getAttribute('data-tooltip-actions');
        if (actionsAttr != null && actionsAttr !== '') {
            try {
                const parsed = JSON.parse(actionsAttr) as TooltipAction[];
                if (Array.isArray(parsed)) o.actions = parsed;
            } catch {
                this.logger.warn('data-tooltip-actions JSON invalide', actionsAttr);
            }
        }
        return o;
    }

    /** Balises HTML autorisées : gras, italique, souligné, barré */
    private static readonly _allowedTooltipTags = new Set(['b', 'i', 'u', 's', 'strong', 'em', 'del']);

    /**
     * Affiche du contenu en texte pur, ou en HTML sanitisé (via l'utilitaire central `sanitizeHtmlFragment`)
     * si des balises de mise en forme basiques sont détectées. Aucun attribut n'est autorisé.
     */
    private _setTextContent(el: HTMLElement, content: string): void {
        if (/<[a-z][^>]*>/i.test(content)) {
            el.innerHTML = sanitizeHtmlFragment(content, Tooltips._allowedTooltipTags);
        } else {
            el.textContent = content;
        }
    }

    private _getContent(): string {
        const fromAttr = this.el.getAttribute('data-tooltip');
        if (fromAttr != null && fromAttr !== '') return fromAttr;
        return this.options.content || '';
    }

    private _getTitle(): string {
        const fromAttr = this.el.getAttribute('data-tooltip-title');
        if (fromAttr != null && fromAttr !== '') return fromAttr;
        return this.options.title || '';
    }

    private _getBody(): string {
        const fromAttr = this.el.getAttribute('data-tooltip-body');
        if (fromAttr != null && fromAttr !== '') return fromAttr;
        if (this.options.body) return this.options.body;
        return this._getContent();
    }

    private _getMode(): TooltipMode {
        const fromAttr = this.el.getAttribute('data-tooltip-mode') as TooltipMode | null;
        if (fromAttr === 'plain' || fromAttr === 'rich') return fromAttr;
        if (this.options.mode) return this.options.mode;
        if (this._getTitle() || this.el.hasAttribute('data-tooltip-body') || this.options.body) {
            return 'rich';
        }
        return 'plain';
    }

    private _isRich(): boolean {
        return this._getMode() === 'rich';
    }

    private _isInteractive(): boolean {
        return this._isRich() && this._getActions().length > 0;
    }

    /**
     * Déclencheur effectif : le rich interactif impose le focus pour permettre
     * la navigation clavier et les clics sur les boutons d'action.
     */
    private _getEffectiveTrigger(): TooltipsOptions['trigger'] {
        if (this._isInteractive()) {
            return 'focus';
        }
        return this.options.trigger;
    }

    /**
     * Vérifie si le focus reste dans la zone référence + tooltip interactif.
     */
    private _focusStaysInTooltipGroup(target: EventTarget | null): boolean {
        if (!(target instanceof Node)) return false;
        return this.el.contains(target) || Boolean(this.tooltipEl?.contains(target));
    }

    private _hasDisplayableContent(): boolean {
        if (this._isRich()) {
            return Boolean(this._getTitle() || this._getBody() || this._getActions().length);
        }
        return Boolean(this._getContent());
    }

    /**
     * Actions effectives du tooltip rich (custom, défaut M3, ou aucune).
     */
    private _getActions(): TooltipAction[] {
        if (this.options.actions !== undefined) {
            return this.options.actions;
        }
        if (!this._isRich() || this.options.richActions === false) {
            return [];
        }
        return this._createDefaultRichActions();
    }

    /**
     * Boutons M3 par défaut pour le mode rich interactif.
     */
    private _createDefaultRichActions(): TooltipAction[] {
        return [
            { label: LocaleManager.t('tooltips.actionDismiss'), variant: 'text' },
            { label: LocaleManager.t('tooltips.actionConfirm'), variant: 'filled' },
        ];
    }

    private init(): void {
        if (this.options.disabled) return;

        if (!this._hasDisplayableContent()) {
            this.logger.debug('Pas de contenu tooltip, skip init', this.el);
            return;
        }

        this._createTooltipElement();
        this._attachTriggerEvents();
        this.registerEvent(window, 'scroll', this._reposition, { passive: true, capture: true });
        this.registerEvent(window, 'resize', this._reposition, { passive: true });
        this.logger.info('Tooltips initialisé');
    }

    private _createTooltipElement(): void {
        const wrap = document.createElement('div');
        wrap.className = this._buildTooltipClassName();
        wrap.id = `tooltip-${this.id}`;
        wrap.style.position = 'fixed';
        wrap.setAttribute('data-motion', this.options.motion);
        wrap.setAttribute('data-motion-speed', this.options.motionSpeed);

        const shell = document.createElement('div');
        shell.className = 'tooltip__shell';

        const panel = document.createElement('div');
        panel.className = 'tooltip__panel';

        shell.appendChild(panel);
        wrap.appendChild(shell);

        document.body.appendChild(wrap);
        this.tooltipEl = wrap;
        this.shellEl = shell;
        this.panelEl = panel;

        this._applySurfaceColors(wrap);
        this._renderTooltipContent();
        this._syncAria(false);
        this._syncReducedMotionClass();
    }

    private _applySurfaceColors(wrap: HTMLDivElement): void {
        if (this.options.color) {
            wrap.style.setProperty('--tooltip-surface-bg', this.options.color);
        }
        if (this.options.textColor && this.panelEl) {
            this.panelEl.style.color = this.options.textColor;
        }
    }

    private _buildTooltipClassName(): string {
        const classes = ['tooltip', `tooltip--${this.options.type}`];
        if (this._isRich()) classes.push('tooltip--rich');
        if (this._isInteractive()) classes.push('tooltip--interactive');
        return classes.join(' ');
    }

    private _renderTooltipContent(): void {
        if (!this.panelEl) return;
        this.panelEl.replaceChildren();

        if (this._isRich()) {
            const title = this._getTitle();
            if (title) {
                const titleEl = document.createElement('p');
                titleEl.className = 'tooltip__title';
                titleEl.textContent = title;
                this.panelEl.appendChild(titleEl);
            }

            const body = this._getBody();
            if (body) {
                const bodyEl = document.createElement('p');
                bodyEl.className = 'tooltip__body';
                this._setTextContent(bodyEl, body);
                this.panelEl.appendChild(bodyEl);
            }

            if (this._getActions().length) {
                const row = document.createElement('div');
                row.className = 'tooltip__actions';
                for (const action of this._getActions()) {
                    row.appendChild(this._createActionButton(action));
                }
                this.panelEl.appendChild(row);
            }
        } else {
            this.panelEl.appendChild(document.createTextNode(this._getContent()));
        }
    }

    private _createActionButton(action: TooltipAction): HTMLButtonElement {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `tooltip__btn tooltip__btn--${action.variant ?? 'text'}`;
        btn.textContent = action.label;
        this.registerEvent(btn, 'click', () => {
            action.onClick?.({
                close: () => this.close(),
                open: () => this.open(),
            });
            if (action.dismissOnClick !== false) {
                this.close();
            }
        });
        return btn;
    }

    private _syncAria(expanded: boolean): void {
        if (!this.tooltipEl) return;

        if (this._isInteractive()) {
            setAriaAttributes(this.tooltipEl, { role: 'dialog' });
            setAriaAttributes(this.el, {
                haspopup: 'dialog',
                expanded: expanded ? 'true' : 'false',
            });
            removeAriaAttribute(this.el, 'describedby');
        } else {
            setAriaAttributes(this.tooltipEl, { role: 'tooltip' });
            setAriaAttributes(this.el, { describedby: this.tooltipEl.id });
            removeAriaAttribute(this.el, 'haspopup');
            removeAriaAttribute(this.el, 'expanded');
        }
    }

    private _attachTriggerEvents(): void {
        const trigger = this._getEffectiveTrigger();

        if (trigger === 'hover') {
            this.registerEvent(this.el, 'mouseenter', this._onReferenceEnter.bind(this));
            this.registerEvent(this.el, 'mouseleave', this._onReferenceLeave.bind(this));
            // Accessibilité clavier : le survol expose aussi le tooltip au focus
            this.registerEvent(this.el, 'focus', this._onReferenceEnter.bind(this));
            this.registerEvent(this.el, 'blur', this._onReferenceBlur.bind(this));
        } else if (trigger === 'focus') {
            this.registerEvent(this.el, 'focus', this._onReferenceEnter.bind(this));
            this.registerEvent(this.el, 'blur', this._onReferenceBlur.bind(this));
            if (this.tooltipEl && this._isInteractive()) {
                this.registerEvent(this.tooltipEl, 'focusout', this._onTooltipFocusOut.bind(this));
            }
        } else if (trigger === 'click') {
            this.registerEvent(this.el, 'click', this._onReferenceClick.bind(this));
        }

        if (this.options.closeOnKeyEscape) {
            this.registerEvent(document, 'keydown', this._onDocumentKeyDown.bind(this));
        }
    }

    private _clearShowDelay(): void {
        if (this._showDelayTimer != null) {
            clearTimeout(this._showDelayTimer);
            this._showDelayTimer = null;
        }
    }

    private _clearHideDelay(): void {
        if (this._hideDelayTimer != null) {
            clearTimeout(this._hideDelayTimer);
            this._hideDelayTimer = null;
        }
    }

    private _clearDismissTimer(): void {
        if (this._dismissTimer != null) {
            clearTimeout(this._dismissTimer);
            this._dismissTimer = null;
        }
    }

    private _onReferenceEnter(): void {
        this._clearHideDelay();
        this._showDelayTimer = window.setTimeout(() => this.open(), this.options.showDelay);
    }

    private _onReferenceLeave(): void {
        this._clearShowDelay();
        const wait = this._isRich() ? RICH_CLOSE_DELAY : this.options.hideDelay;
        this._hideDelayTimer = window.setTimeout(() => this.close(), wait);
    }

    /**
     * Blur référence — ne ferme pas si le focus entre dans le tooltip interactif.
     */
    private _onReferenceBlur(e: FocusEvent): void {
        if (this._isInteractive() && this._focusStaysInTooltipGroup(e.relatedTarget)) {
            return;
        }
        this._onReferenceLeave();
    }

    /**
     * Focusout du tooltip interactif — ferme si le focus quitte référence + tooltip.
     */
    private _onTooltipFocusOut(e: FocusEvent): void {
        if (this._focusStaysInTooltipGroup(e.relatedTarget)) {
            return;
        }
        this._onReferenceLeave();
    }

    private _onReferenceClick(e: Event): void {
        e.preventDefault();
        e.stopPropagation();
        if (this._isVisible) {
            if (this.options.closeOnClickReference) this.close();
        } else {
            this.open();
        }
    }

    private _onDocumentKeyDown(e: KeyboardEvent): void {
        if (e.key === 'Escape' && this._isVisible) this.close();
    }

    private _removeClickOutside(): void {
        if (this._clickOutsideCleanup) {
            this._clickOutsideCleanup();
            this._clickOutsideCleanup = null;
        }
    }

    /**
     * Durée maximale de transition (ms) pour la fermeture.
     */
    private _getTransitionMs(): number {
        if (shouldSkipMotion()) return 0;
        const preset = MotionPresets.tooltip;
        return getMaxMotionDurationMs(
            [
                { category: 'spatial', speed: this.options.motionSpeed },
                { category: 'effects', speed: this.options.motionSpeed },
            ],
            undefined,
            this.shellEl ?? this.tooltipEl
        );
    }

    /**
     * Applique ou retire le mode sans animation (prefers-reduced-motion).
     */
    private _syncReducedMotionClass(): void {
        if (!this.tooltipEl) return;
        this.tooltipEl.classList.toggle('tooltip--reduced-motion', shouldSkipMotion());
    }

    /**
     * Calcule et applique la position du tooltip (flip, clamp, flèche).
     */
    private _position(): void {
        if (!this.tooltipEl) return;

        const targetRect = this.el.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const w = this.tooltipEl.offsetWidth;
        const h = this.tooltipEl.offsetHeight;
        const gap = this.options.offset + ARROW;

        let { side, align } = parsePlacement(this.options.placement);

        const fits = (s: TooltipSide): boolean => {
            switch (s) {
                case 'top':
                    return targetRect.top - h - gap >= VIEWPORT_MARGIN;
                case 'bottom':
                    return targetRect.bottom + h + gap <= vh - VIEWPORT_MARGIN;
                case 'left':
                    return targetRect.left - w - gap >= VIEWPORT_MARGIN;
                case 'right':
                    return targetRect.right + w + gap <= vw - VIEWPORT_MARGIN;
            }
        };

        if (!fits(side)) {
            side = OPPOSITE_SIDE[side];
        }

        this.tooltipEl.classList.remove(
            'tooltip--top',
            'tooltip--bottom',
            'tooltip--left',
            'tooltip--right',
            'tooltip--align-start',
            'tooltip--align-center',
            'tooltip--align-end'
        );
        this.tooltipEl.classList.add(`tooltip--${side}`, `tooltip--align-${align}`);

        const isVertical = side === 'top' || side === 'bottom';
        let top = 0;
        let left = 0;

        if (isVertical) {
            top = side === 'top' ? targetRect.top - h - gap : targetRect.bottom + gap;
            const targetCx = targetRect.left + targetRect.width / 2;
            if (align === 'center') left = targetCx - w / 2;
            else if (align === 'start') left = targetRect.left;
            else left = targetRect.right - w;
        } else {
            left = side === 'left' ? targetRect.left - w - gap : targetRect.right + gap;
            const targetCy = targetRect.top + targetRect.height / 2;
            if (align === 'center') top = targetCy - h / 2;
            else if (align === 'start') top = targetRect.top;
            else top = targetRect.bottom - h;
        }

        left = Math.max(VIEWPORT_MARGIN, Math.min(left, vw - w - VIEWPORT_MARGIN));
        top = Math.max(VIEWPORT_MARGIN, Math.min(top, vh - h - VIEWPORT_MARGIN));

        if (isVertical) {
            const targetCx = targetRect.left + targetRect.width / 2;
            let pos = targetCx - left;
            pos = Math.max(ARROW_INSET, Math.min(pos, w - ARROW_INSET));
            this.tooltipEl.style.setProperty('--tooltip-arrow-pos', `${Math.round(pos)}px`);
        } else {
            const targetCy = targetRect.top + targetRect.height / 2;
            let pos = targetCy - top;
            pos = Math.max(ARROW_INSET, Math.min(pos, h - ARROW_INSET));
            this.tooltipEl.style.setProperty('--tooltip-arrow-pos', `${Math.round(pos)}px`);
        }

        this.tooltipEl.style.top = `${Math.round(top)}px`;
        this.tooltipEl.style.left = `${Math.round(left)}px`;
    }

    /**
     * Ouvre le tooltip
     */
    open(): void {
        if (this.options.disabled || !this.tooltipEl) return;
        if (!this._hasDisplayableContent()) return;

        this._clearHideDelay();
        this._clearShowDelay();

        if (this._isVisible) return;

        if (typeof this.options.onOpenStart === 'function') {
            this.options.onOpenStart(this.el);
        }

        this.tooltipEl.className = this._buildTooltipClassName();
        this.tooltipEl.setAttribute('data-motion', this.options.motion);
        this.tooltipEl.setAttribute('data-motion-speed', this.options.motionSpeed);
        this._applySurfaceColors(this.tooltipEl);
        this._renderTooltipContent();
        this._syncReducedMotionClass();
        this._position();

        void this.tooltipEl.offsetWidth;
        this.tooltipEl.classList.add('is-visible');
        this._syncAria(true);
        this._isVisible = true;

        if (this.options.trigger === 'click') {
            HapticManager.triggerFromOptions(this.options, 'light');
        }

        const effectiveTrigger = this._getEffectiveTrigger();

        // Plain hover/click : auto-dismiss. Focus (ou rich interactif) : fermeture via blur.
        if (!this._isInteractive() && effectiveTrigger !== 'focus') {
            this._clearDismissTimer();
            this._dismissTimer = window.setTimeout(
                () => this.close(),
                this.options.plainDismissDelay
            );
        }

        if (typeof this.options.onOpenEnd === 'function') {
            this.options.onOpenEnd(this.el);
        }

        if (this.options.trigger === 'click') {
            this._removeClickOutside();
            const handler = (e: MouseEvent) => {
                const target = e.target as Node;
                if (this.tooltipEl && !this.tooltipEl.contains(target) && !this.el.contains(target)) {
                    this._removeClickOutside();
                    this.close();
                }
            };
            window.setTimeout(() => {
                this._clickOutsideCleanup = this.registerEvent(document, 'click', handler, { capture: true });
            }, 0);
        }
    }

    /**
     * Ferme le tooltip
     */
    close(): void {
        if (!this._isVisible || !this.tooltipEl) return;

        if (typeof this.options.onCloseStart === 'function') {
            this.options.onCloseStart(this.el);
        }

        this._removeClickOutside();
        this._clearDismissTimer();
        this.tooltipEl.classList.remove('is-visible');
        this._syncAria(false);
        this._isVisible = false;

        const tooltipElRef = this.tooltipEl;
        const closeMs = this._getTransitionMs();

        window.setTimeout(() => {
            if (typeof this.options.onCloseEnd === 'function') {
                this.options.onCloseEnd(this.el);
            }
            void tooltipElRef;
        }, closeMs);
    }

    /**
     * Détruit l'instance
     */
    public override destroy(): void {
        this._clearShowDelay();
        this._clearHideDelay();
        this._clearDismissTimer();
        this._removeClickOutside();
        this.close();
        if (this.tooltipEl?.parentNode) {
            this.tooltipEl.parentNode.removeChild(this.tooltipEl);
            this.tooltipEl = null;
            this.shellEl = null;
            this.panelEl = null;
        }
        removeAriaAttribute(this.el, 'describedby');
        removeAriaAttribute(this.el, 'haspopup');
        removeAriaAttribute(this.el, 'expanded');
        this.logger.info('Tooltips détruit');
        super.destroy();
    }
}
