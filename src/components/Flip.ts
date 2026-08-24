/**
 * @fileoverview Composant Flip — retournement 3D recto/verso
 * @description Wrapper générique pour révéler un dos au survol ou au clic
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { toComponentClassDef } from '../types/components/component-base';
import type { FlipOptions } from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { LoggerManager, LocaleManager } from '../core/managers';
import { ManagerFactory } from '../core/factories';
import { Keyboard } from '../core/managers/KeyboardManager';
import { setAriaAttributes } from '../utils/dom/aria';
import { getPreferReducedMotion } from '../utils/accessibility';
import {
    getFlipDefaults,
    FLIP_AXES,
    FLIP_MOTIONS,
    FLIP_TRIGGERS,
} from '../specs/components/flip.specs';
import { getK3uiComponentWindowOptions } from '../core/autoinit/window-options';

const _defaults: FlipOptions = getFlipDefaults();

/**
 * Composant Flip pour retournement 3D de contenu
 */
export class Flip extends Component<FlipOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    private logger: LoggerManager;
    private keyboardInstance: Keyboard | null = null;
    private internalFlipped = false;
    private onMotionChange: (() => void) | null = null;

    static get defaults(): FlipOptions {
        return { ..._defaults };
    }

    static getInstance(el: HTMLElement): Flip | undefined {
        return Component.getInstance(el) as Flip | undefined;
    }

    static init(
        els: KElement | InitElements<KElement> | string,
        options: Partial<FlipOptions> = {}
    ): Flip | Flip[] {
        return Component.init(els, options, toComponentClassDef(Flip)) as Flip | Flip[];
    }

    constructor(el: HTMLElement, options: Partial<FlipOptions> = {}) {
        super(el, options, toComponentClassDef(Flip));
        this.logger = ManagerFactory.getLoggerManager('[Flip]');
        const globalOptions = getK3uiComponentWindowOptions('Flip');
        this.options = {
            ...Flip.defaults,
            ...globalOptions,
            ...Flip.readAttributes(el),
            ...options,
        };
        this.internalFlipped = this.options.flipped;
        this.initComponent();
    }

    private static isEnum<T extends string>(value: string, list: readonly T[]): value is T {
        return (list as readonly string[]).includes(value);
    }

    private static readAttributes(el: HTMLElement): Partial<FlipOptions> {
        const out: Partial<FlipOptions> = {};

        const axis = el.getAttribute('data-axis') ?? el.getAttribute('data-flip-axis');
        if (axis && Flip.isEnum(axis, FLIP_AXES)) out.axis = axis;

        const motion = el.getAttribute('data-motion') ?? el.getAttribute('data-flip-motion');
        if (motion && Flip.isEnum(motion, FLIP_MOTIONS)) out.motion = motion;

        const trigger = el.getAttribute('data-trigger') ?? el.getAttribute('data-flip-trigger');
        if (trigger && Flip.isEnum(trigger, FLIP_TRIGGERS)) out.trigger = trigger;

        const duration = el.getAttribute('data-duration') ?? el.getAttribute('data-flip-duration');
        if (duration) {
            const n = parseInt(duration, 10);
            if (!Number.isNaN(n)) out.duration = n;
        }

        const perspective = el.getAttribute('data-perspective') ?? el.getAttribute('data-flip-perspective');
        if (perspective) {
            const n = parseInt(perspective, 10);
            if (!Number.isNaN(n)) out.perspective = n;
        }

        const flipped = el.getAttribute('data-flipped') ?? el.getAttribute('data-flip-flipped');
        if (flipped === 'true') out.flipped = true;
        else if (flipped === 'false') out.flipped = false;

        const label = el.getAttribute('data-label') ?? el.getAttribute('data-flip-label');
        if (label) out.label = label;

        return out;
    }

    private initComponent(): void {
        this.el.classList.add('flip');
        this.ensureStructure();
        this.applyDataAttributes();
        this.setupAccessibility();
        this.setupReducedMotionListener();
        this.syncReducedMotion();
        this.attachInteractionListeners();
        this.updateFaceVisibility();
        this.options.onOpenStart?.(this.el);
        this.options.onOpenEnd?.(this.el);
        this.logger.info('Flip initialisé');
    }

    private ensureStructure(): void {
        if (!this.el.querySelector('.flip__inner')) {
            const inner = document.createElement('div');
            inner.className = 'flip__inner';
            while (this.el.firstChild) {
                inner.appendChild(this.el.firstChild);
            }
            this.el.appendChild(inner);
        }

        const inner = this.el.querySelector('.flip__inner')!;
        const faces = inner.querySelectorAll(':scope > .flip__face');
        if (faces.length < 2) {
            const children = Array.from(inner.children).filter(
                (c) => !c.classList.contains('flip__face')
            );
            if (children.length >= 2) {
                children[0].classList.add('flip__face', 'flip__face--front');
                children[1].classList.add('flip__face', 'flip__face--back');
            }
        }
    }

    private applyDataAttributes(): void {
        this.el.classList.remove('flip--axis-x', 'flip--axis-y');
        this.el.classList.add(this.options.axis === 'x' ? 'flip--axis-x' : 'flip--axis-y');
        this.el.dataset.flipAxis = this.options.axis;
        this.el.dataset.flipMotion = this.options.motion;
        this.el.dataset.flipTrigger = this.options.trigger;
        this.el.style.setProperty('--flip-duration', `${this.options.duration}ms`);
        this.el.style.setProperty('--flip-perspective', `${this.options.perspective}px`);
        this.setFlippedState(this.options.flipped);
    }

    private setupAccessibility(): void {
        if (this.options.trigger === 'click') {
            setAriaAttributes(this.el, {
                role: 'button',
                label: this.options.label || LocaleManager.t('flip.ariaToggle'),
                pressed: this.isFlipped(),
            });
            if (!this.el.hasAttribute('tabindex')) {
                this.el.setAttribute('tabindex', '0');
            }
        } else if (!this.el.hasAttribute('tabindex')) {
            this.el.setAttribute('tabindex', '0');
        }
    }

    private setupReducedMotionListener(): void {
        this.onMotionChange = () => this.syncReducedMotion();
        this.registerEvent(document, 'k3ui-motion-changed', this.onMotionChange);
    }

    private syncReducedMotion(): void {
        const reduced = getPreferReducedMotion();
        this.el.classList.toggle('flip--reduced-motion', reduced);
        if (reduced) {
            this.el.dataset.flipMotion = 'standard';
        } else {
            this.el.dataset.flipMotion = this.options.motion;
        }
    }

    private attachInteractionListeners(): void {
        if (this.options.trigger !== 'click') return;

        this.registerEvent(this.el, 'click', this.handleToggleBound);

        this.keyboardInstance = new Keyboard({
            target: this.el,
            onKeyDown: (event: KeyboardEvent) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    this.toggle();
                }
            },
        });
    }

    private readonly handleToggleBound = (): void => {
        this.toggle();
    };

    private isFlipped(): boolean {
        return this.el.dataset.flipFlipped === 'true';
    }

    private setFlippedState(flipped: boolean): void {
        this.internalFlipped = flipped;
        this.el.dataset.flipFlipped = flipped ? 'true' : 'false';
        if (this.options.trigger === 'click') {
            setAriaAttributes(this.el, { pressed: flipped });
        }
        this.updateFaceVisibility();
    }

    private updateFaceVisibility(): void {
        const flipped = this.isFlipped();
        const front = this.el.querySelector('.flip__face--front');
        const back = this.el.querySelector('.flip__face--back');
        if (front) front.setAttribute('aria-hidden', flipped ? 'true' : 'false');
        if (back) back.setAttribute('aria-hidden', flipped ? 'false' : 'true');
    }

    /**
     * Bascule l'état retourné (mode click)
     */
    public toggle(): void {
        const next = !this.isFlipped();
        this.setFlippedState(next);
        this.options.onFlipChange?.(next);
    }

    /**
     * Définit l'état retourné
     * @param flipped État souhaité
     */
    public setFlipped(flipped: boolean): void {
        this.setFlippedState(flipped);
        this.options.flipped = flipped;
    }

    /**
     * Met à jour les options
     * @param options Options partielles
     */
    public updateOptions(options: Partial<FlipOptions>): void {
        this.options = { ...this.options, ...options };
        if (options.flipped !== undefined) {
            this.setFlippedState(options.flipped);
        }
        this.applyDataAttributes();
        this.setupAccessibility();
        this.syncReducedMotion();
    }

    override destroy(): void {
        this.options.onCloseStart?.(this.el);
        this.onMotionChange = null;
        this.keyboardInstance?.destroy();
        this.keyboardInstance = null;
        this.el.classList.remove('flip', 'flip--reduced-motion', 'flip--axis-x', 'flip--axis-y');
        this.options.onCloseEnd?.(this.el);
        this.logger.info('Flip détruit');
        super.destroy();
    }
}

if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-flip')) {
    customElements.define(
        'k3ui-flip',
        class K3UIFlipElement extends HTMLElement {
            connectedCallback(): void {
                if (!this.hasAttribute('data-initialized')) {
                    this.setAttribute('data-initialized', 'true');
                }
            }

            disconnectedCallback(): void {
                Flip.getInstance(this)?.destroy();
            }
        }
    );
}
