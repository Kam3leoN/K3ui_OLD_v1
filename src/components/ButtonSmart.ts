/**
 * @fileoverview Composant ButtonSmart pour K3UI
 * @description Tuile réglages rapides façon Material You (Android 14/15) — morph pill/squircle, marquee AOSP, haptique
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { toComponentClassDef } from '../types/components/component-base';
import type { ButtonSmartOptions } from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { setAriaAttributes, removeAriaAttribute } from '../utils/dom/aria';
import { LoggerManager } from '../core/managers/LoggerManager';
import { ManagerFactory } from '../core/factories/ManagerFactory';
import { getButtonSmartDefaults } from '../specs/components/button-smart.specs';
import { Keyboard } from '../core/managers/KeyboardManager';
import { HapticManager } from '../core/managers/HapticManager';
import { MotionManager } from '../core/managers/MotionManager';
import { ButtonSmartSpecs } from '../specs/components/button-smart.specs';

interface KButtonSmartHTMLElement extends HTMLElement {
    K_ButtonSmart?: ButtonSmart;
}

const _defaults: ButtonSmartOptions = getButtonSmartDefaults();

const BASE_CLASS = 'btn-smart';
const LEGACY_CLASS = 'button-smart';

/**
 * ButtonSmart — tuile toggle ON/OFF façon réglages rapides Android.
 * OFF : pill, surface sombre · ON : squircle, surface claire + sous-titre.
 */
export class ButtonSmart extends Component<ButtonSmartOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    private logger: LoggerManager;
    private keyboardInstance: Keyboard | null = null;
    private marqueeEl: HTMLElement | null = null;
    private trackEl: HTMLElement | null = null;
    private subtitleEl: HTMLElement | null = null;
    private animation: Animation | null = null;
    private restartTimer: ReturnType<typeof setTimeout> | undefined;
    private resizeObserver: ResizeObserver | null = null;
    private isAnimating = false;

    static get defaults(): ButtonSmartOptions {
        return { ..._defaults };
    }

    /**
     * Retourne l'instance ButtonSmart attachée à l'élément
     * @param el - Élément DOM
     * @returns Instance ou null
     */
    static getInstance(el: HTMLElement): ButtonSmart | null {
        return (el as KButtonSmartHTMLElement).K_ButtonSmart ?? null;
    }

    /**
     * Initialise une ou plusieurs instances ButtonSmart
     * @param els - Élément(s) ou sélecteur CSS
     * @param options - Options partielles
     * @returns Instance(s) initialisée(s)
     */
    static init(
        els: KElement | InitElements<KElement> | string,
        options: Partial<ButtonSmartOptions> = {}
    ): ButtonSmart[] {
        return Component.init(els, options, toComponentClassDef(ButtonSmart)) as ButtonSmart[];
    }

    constructor(el: HTMLElement, options: Partial<ButtonSmartOptions> = {}) {
        super(el, options, toComponentClassDef(ButtonSmart));
        this.logger = ManagerFactory.getLoggerManager('[ButtonSmart]');
        this.options = { ...ButtonSmart.defaults, ...options };
        this.readAttributes();
        (el as KButtonSmartHTMLElement).K_ButtonSmart = this;
        this.init();
    }

    /**
     * Lit les attributs data-* et aria-* de l'élément
     */
    private readAttributes(): void {
        const el = this.el;

        if (el.hasAttribute('data-label')) {
            this.options.label = el.getAttribute('data-label') || '';
        }
        if (el.hasAttribute('data-active-subtitle')) {
            this.options.activeSubtitle = el.getAttribute('data-active-subtitle') || _defaults.activeSubtitle;
        }
        if (el.hasAttribute('data-inactive-subtitle')) {
            this.options.inactiveSubtitle = el.getAttribute('data-inactive-subtitle') || '';
        }
        if (el.hasAttribute('data-haptic-duration')) {
            const duration = parseInt(el.getAttribute('data-haptic-duration') || '', 10);
            if (!Number.isNaN(duration)) {
                this.options.hapticDuration = duration;
            }
        }
        if (el.hasAttribute('disabled')) {
            this.options.disabled = true;
        }
        if (el.getAttribute('aria-pressed') === 'true' || el.classList.contains(`${BASE_CLASS}--on`)) {
            this.options.active = true;
        }
        if (el.getAttribute('aria-pressed') === 'false') {
            this.options.active = false;
        }
        if (el.hasAttribute('data-active')) {
            const active = el.getAttribute('data-active');
            this.options.active = active === 'true' || active === '';
        }
    }

    private init(): void {
        this.ensureBaseClass();
        this.setupStructure();
        this.applyState(false);
        this.setupAccessibility();
        this.attachEventListeners();
        this.setupMarqueeObserver();
        requestAnimationFrame(() => {
            requestAnimationFrame(() => this.setupMarquee());
        });
        this.logger.info('ButtonSmart initialized');
    }

    private ensureBaseClass(): void {
        if (!this.el.classList.contains(BASE_CLASS) && !this.el.classList.contains(LEGACY_CLASS)) {
            this.el.classList.add(BASE_CLASS);
        }
        if (this.el.tagName !== 'BUTTON') {
            this.el.setAttribute('role', 'button');
            if (!this.el.hasAttribute('tabindex')) {
                this.el.setAttribute('tabindex', '0');
            }
        } else if (!this.el.hasAttribute('type')) {
            this.el.setAttribute('type', 'button');
        }
    }

    /**
     * Construit ou réutilise la structure interne (icône, marquee, sous-titre)
     */
    private setupStructure(): void {
        let iconEl = this.el.querySelector<HTMLElement>(`.${BASE_CLASS}__icon, .${LEGACY_CLASS}__icon`);
        if (!iconEl) {
            iconEl = document.createElement('span');
            iconEl.className = `${BASE_CLASS}__icon`;
            iconEl.setAttribute('aria-hidden', 'true');
            this.el.prepend(iconEl);
        }

        let textEl = this.el.querySelector<HTMLElement>(`.${BASE_CLASS}__text, .${LEGACY_CLASS}__text`);
        if (!textEl) {
            textEl = document.createElement('span');
            textEl.className = `${BASE_CLASS}__text`;
            this.el.appendChild(textEl);
        }

        let marqueeEl = textEl.querySelector<HTMLElement>(`.${BASE_CLASS}__marquee, .${LEGACY_CLASS}__marquee`);
        if (!marqueeEl) {
            marqueeEl = document.createElement('span');
            marqueeEl.className = `${BASE_CLASS}__marquee`;
            textEl.appendChild(marqueeEl);
        }
        this.marqueeEl = marqueeEl;

        let trackEl = marqueeEl.querySelector<HTMLElement>(`.${BASE_CLASS}__track, .${LEGACY_CLASS}__track`);
        if (!trackEl) {
            trackEl = document.createElement('span');
            trackEl.className = `${BASE_CLASS}__track`;
            marqueeEl.appendChild(trackEl);
        }
        this.trackEl = trackEl;

        const label = this.getLabelText();
        this.ensureLabelElements(trackEl, label);

        let subtitleEl = textEl.querySelector<HTMLElement>(`.${BASE_CLASS}__subtitle, .${LEGACY_CLASS}__subtitle`);
        if (!subtitleEl) {
            subtitleEl = document.createElement('span');
            subtitleEl.className = `${BASE_CLASS}__subtitle`;
            textEl.appendChild(subtitleEl);
        }
        this.subtitleEl = subtitleEl;
        this.updateSubtitle();
    }

    /**
     * Retourne le libellé depuis les options ou le DOM existant
     */
    private getLabelText(): string {
        if (this.options.label) {
            return this.options.label;
        }
        const existing = this.el.querySelector<HTMLElement>(`.${BASE_CLASS}__label, .${LEGACY_CLASS}__label`);
        return existing?.textContent?.trim() || '';
    }

    /**
     * Assure la présence du libellé et de son fantôme pour le marquee
     * @param track - Piste du marquee
     * @param label - Texte du libellé
     */
    private ensureLabelElements(track: HTMLElement, label: string): void {
        let labelEl = track.querySelector<HTMLElement>(`.${BASE_CLASS}__label:not(.${BASE_CLASS}__label--ghost)`);
        if (!labelEl) {
            labelEl = document.createElement('span');
            labelEl.className = `${BASE_CLASS}__label`;
            track.appendChild(labelEl);
        }
        labelEl.textContent = label;
        this.options.label = label;

        let ghostEl = track.querySelector<HTMLElement>(`.${BASE_CLASS}__label--ghost`);
        if (!ghostEl) {
            ghostEl = document.createElement('span');
            ghostEl.className = `${BASE_CLASS}__label ${BASE_CLASS}__label--ghost`;
            ghostEl.setAttribute('aria-hidden', 'true');
            track.appendChild(ghostEl);
        }
        ghostEl.textContent = label;
    }

    /**
     * Met à jour le sous-titre selon l'état actif/inactif
     */
    private updateSubtitle(): void {
        if (!this.subtitleEl) return;
        const subtitle = this.options.active
            ? this.options.activeSubtitle
            : this.options.inactiveSubtitle;
        this.subtitleEl.textContent = subtitle;
        if (subtitle) {
            this.subtitleEl.style.display = '';
        } else {
            this.subtitleEl.style.display = 'none';
        }
    }

    /**
     * Configure les attributs ARIA
     */
    private setupAccessibility(): void {
        const subtitle = this.options.active
            ? this.options.activeSubtitle
            : this.options.inactiveSubtitle;
        const ariaLabel = this.options.label + (subtitle ? `, ${subtitle}` : '');
        setAriaAttributes(this.el, {
            'aria-pressed': this.options.active ? 'true' : 'false',
            'aria-label': ariaLabel,
        });
        if (this.options.disabled) {
            setAriaAttributes(this.el, { 'aria-disabled': 'true' });
        }
    }

    private attachEventListeners(): void {
        this.keyboardInstance = new Keyboard({
            target: this.el,
            onKeyDown: (e: KeyboardEvent) => {
                if (this.options.disabled) return;
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggle();
                }
            },
        });

        this.registerEvent(this.el, 'click', (e: MouseEvent) => {
            if (this.options.disabled) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            this.toggle();
        });
    }

    /**
     * Bascule l'état actif/inactif
     */
    toggle(): void {
        if (this.options.disabled || this.isAnimating) return;
        this.setActive(!this.options.active);
    }

    /**
     * Définit l'état actif
     * @param active - État actif
     */
    setActive(active: boolean): void {
        if (this.options.disabled) return;

        const wasActive = this.options.active;
        if (wasActive === active) return;

        this.isAnimating = true;
        this.options.active = active;

        if (active) {
            this.options.onOpenStart?.(this.el);
        } else {
            this.options.onCloseStart?.(this.el);
        }

        this.triggerHaptic();
        this.applyState(true);

        const morphDuration = 350;

        setTimeout(() => {
            this.isAnimating = false;
            if (this.options.active) {
                this.options.onOpenEnd?.(this.el);
            } else {
                this.options.onCloseEnd?.(this.el);
            }
            this.options.onToggle?.(this.el, this.options.active);
        }, morphDuration);
    }

    /**
     * Retourne l'état actif courant
     * @returns true si actif
     */
    isActive(): boolean {
        return this.options.active;
    }

    /**
     * Active ou désactive le composant
     * @param disabled - État désactivé
     */
    setDisabled(disabled: boolean): void {
        this.options.disabled = disabled;
        if (disabled) {
            (this.el as HTMLButtonElement).disabled = true;
            this.el.setAttribute('disabled', '');
            setAriaAttributes(this.el, { 'aria-disabled': 'true' });
        } else {
            (this.el as HTMLButtonElement).disabled = false;
            this.el.removeAttribute('disabled');
            removeAriaAttribute(this.el, 'aria-disabled');
        }
    }

    /**
     * Met à jour le libellé et relance le marquee
     * @param label - Nouveau libellé
     */
    setLabel(label: string): void {
        this.options.label = label;
        if (this.trackEl) {
            this.ensureLabelElements(this.trackEl, label);
        }
        this.setupAccessibility();
        this.setupMarquee();
    }

    private applyState(animate: boolean): void {
        if (this.options.active) {
            this.el.classList.add(`${BASE_CLASS}--on`, `${LEGACY_CLASS}--on`);
        } else {
            this.el.classList.remove(`${BASE_CLASS}--on`, `${LEGACY_CLASS}--on`);
        }
        setAriaAttributes(this.el, {
            'aria-pressed': this.options.active ? 'true' : 'false',
        });
        this.updateSubtitle();
        this.setupAccessibility();
        if (animate) {
            requestAnimationFrame(() => this.setupMarquee());
        }
    }

    private triggerHaptic(): void {
        if (this.options.hapticDuration > 0) {
            HapticManager.vibrateRaw(this.options.hapticDuration);
            return;
        }
        HapticManager.triggerFromOptions(this.options, 'light');
    }

    private setupMarqueeObserver(): void {
        if (!this.marqueeEl || typeof ResizeObserver === 'undefined') return;
        this.resizeObserver = new ResizeObserver(() => this.setupMarquee());
        this.resizeObserver.observe(this.marqueeEl);
    }

    /**
     * Configure le marquee AOSP (TextView.Marquee)
     * Piste = [label][gap][ghost] ; translation de (textWidth + gap) pour une boucle sans chevauchement.
     */
    private setupMarquee(): void {
        const marquee = this.marqueeEl;
        const track = this.trackEl;
        if (!marquee || !track) return;

        this.stopMarquee();
        track.style.transform = '';

        const containerWidth = marquee.clientWidth;
        const textEl = track.querySelector<HTMLElement>(`.${BASE_CLASS}__label:not(.${BASE_CLASS}__label--ghost)`);
        if (!textEl) return;

        /* Mesure hors contrainte du reset global (* { max-width: 100% }) */
        const prevMaxWidth = textEl.style.maxWidth;
        textEl.style.maxWidth = 'none';
        const textWidth = textEl.scrollWidth;
        textEl.style.maxWidth = prevMaxWidth;

        if (containerWidth <= 0 || textWidth <= 0) {
            marquee.classList.remove(`${BASE_CLASS}__marquee--scrolling`);
            return;
        }

        const overflow = textWidth - containerWidth;
        const reduced = MotionManager.isReducedMotion();

        if (overflow <= 0 || reduced) {
            marquee.classList.remove(`${BASE_CLASS}__marquee--scrolling`);
            return;
        }

        marquee.classList.add(`${BASE_CLASS}__marquee--scrolling`);

        /* Écart ≥ largeur visible : le fantôme n’entre qu’après la sortie complète du libellé */
        const gap = Math.max(containerWidth, 24);
        track.style.setProperty('--btn-smart-marquee-gap', `${gap}px`);

        /* Forcer un reflow pour que le gap flex soit pris en compte avant l’animation */
        void track.offsetWidth;

        const distance = textWidth + gap;
        const durationMs =
            (distance / ButtonSmartSpecs.behaviors.marqueeDpPerSecond) * 1000;

        const rtl = getComputedStyle(track).direction === 'rtl';
        const shift = rtl ? distance : -distance;

        const play = () => {
            this.animation = track.animate(
                [{ transform: 'translateX(0)' }, { transform: `translateX(${shift}px)` }],
                {
                    delay: ButtonSmartSpecs.behaviors.marqueeDelayMs,
                    duration: durationMs,
                    easing: 'linear',
                    fill: 'none',
                }
            );
            this.animation.onfinish = () => {
                this.restartTimer = setTimeout(
                    play,
                    ButtonSmartSpecs.behaviors.marqueeRestartDelayMs
                );
            };
        };
        play();
    }

    private stopMarquee(): void {
        this.animation?.cancel();
        this.animation = null;
        if (this.restartTimer !== undefined) {
            clearTimeout(this.restartTimer);
            this.restartTimer = undefined;
        }
        if (this.trackEl) {
            this.trackEl.style.transform = '';
        }
        if (this.marqueeEl) {
            this.marqueeEl.classList.remove(`${BASE_CLASS}__marquee--scrolling`, `${LEGACY_CLASS}__marquee--scrolling`);
        }
    }

    override destroy(): void {
        this.stopMarquee();
        this.resizeObserver?.disconnect();
        this.resizeObserver = null;
        this.keyboardInstance = null;
        if ((this.el as KButtonSmartHTMLElement).K_ButtonSmart === this) {
            delete (this.el as KButtonSmartHTMLElement).K_ButtonSmart;
        }
        this.logger.info('ButtonSmart destroyed');
    }
}

if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-button-smart')) {
    customElements.define('k3ui-button-smart', class extends HTMLElement {
        connectedCallback(): void {
            if (!this.hasAttribute('data-initialized')) {
                this.setAttribute('data-initialized', 'true');
            }
        }
        disconnectedCallback(): void {}
    });
}
