/**
 * @fileoverview Composant Comparison pour K3UI
 * @description Comparaison interactive avant/après avec curseur glissant
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { toComponentClassDef } from '../types/components/component-base';
import type { ComparisonOptions } from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { setAriaAttributes } from '../utils/dom/aria';
import {
    bindPointerDown,
    getPointerCoords,
    startPointerDragSession,
    type PointerLikeEvent,
} from '../utils/dom/pointer';
import { Keyboard } from '../core/managers/KeyboardManager';
import { LocaleManager, LoggerManager } from '../core/managers';
import { ManagerFactory } from '../core/factories';
import { getComparisonDefaults } from '../specs/components/comparison.specs';

const SELECTORS = {
    before: '.comparison__image--before',
    after: '.comparison__image--after',
    labelBefore: '.comparison__label--before',
    labelAfter: '.comparison__label--after',
    sliderLine: '.comparison__slider-line',
    sliderKnob: '.comparison__slider-knob',
} as const;

const KNOB_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25" fill="none" aria-hidden="true">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M9.5 8C10.3284 8 11 7.32843 11 6.5C11 5.67157 10.3284 5 9.5 5C8.67157 5 8 5.67157 8 6.5C8 7.32843 8.67157 8 9.5 8ZM9.5 14C10.3284 14 11 13.3284 11 12.5C11 11.6716 10.3284 11 9.5 11C8.67157 11 8 11.6716 8 12.5C8 13.3284 8.67157 14 9.5 14ZM11 18.5C11 19.3284 10.3284 20 9.5 20C8.67157 20 8 19.3284 8 18.5C8 17.6716 8.67157 17 9.5 17C10.3284 17 11 17.6716 11 18.5ZM15.5 8C16.3284 8 17 7.32843 17 6.5C17 5.67157 16.3284 5 15.5 5C14.6716 5 14 5.67157 14 6.5C14 7.32843 14.6716 8 15.5 8ZM17 12.5C17 13.3284 16.3284 14 15.5 14C14.6716 14 14 13.3284 14 12.5C14 11.6716 14.6716 11 15.5 11C16.3284 11 17 11.6716 17 12.5ZM15.5 20C16.3284 20 17 19.3284 17 18.5C17 17.6716 16.3284 17 15.5 17C14.6716 17 14 17.6716 14 18.5C14 19.3284 14.6716 20 15.5 20Z" fill="currentColor"/>
</svg>`;

const _defaults: ComparisonOptions = getComparisonDefaults();

/**
 * Composant Comparison — slider avant/après pour images
 */
export class Comparison extends Component<ComparisonOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    private logger: LoggerManager;
    private beforeEl: HTMLElement | null = null;
    private afterEl: HTMLElement | null = null;
    private labelBeforeEl: HTMLElement | null = null;
    private labelAfterEl: HTMLElement | null = null;
    private sliderLineEl: HTMLElement | null = null;
    private sliderKnobEl: HTMLButtonElement | null = null;
    private keyboardHandler: Keyboard | null = null;
    private unbindKnobPointer: (() => void) | null = null;
    private unbindContainerPointer: (() => void) | null = null;
    private endDragSession: (() => void) | null = null;
    private isDragging = false;
    private currentPosition = _defaults.position;

    static get defaults(): ComparisonOptions {
        return { ..._defaults };
    }

    static getInstance(el: HTMLElement): Comparison | undefined {
        return Component.getInstance(el) as Comparison | undefined;
    }

    static init(
        els: KElement | InitElements<KElement> | string,
        options: Partial<ComparisonOptions> = {}
    ): Comparison | Comparison[] {
        return Component.init(els, options, toComponentClassDef(Comparison)) as Comparison | Comparison[];
    }

    constructor(el: HTMLElement, options: Partial<ComparisonOptions> = {}) {
        super(el, options, toComponentClassDef(Comparison));
        this.logger = ManagerFactory.getLoggerManager('[Comparison]');
        this.options = {
            ...Comparison.defaults,
            ...options,
            ...Comparison.readDataOptions(el),
        };
        this.currentPosition = this.options.position;
        this.initCore();
    }

    /**
     * Lit les options depuis les attributs data-* de l'élément
     * @param el - Élément HTML
     * @returns Options extraites
     */
    private static readDataOptions(el: HTMLElement): Partial<ComparisonOptions> {
        const out: Partial<ComparisonOptions> = {};
        const { dataset } = el;

        if (dataset.before) out.beforeImage = dataset.before;
        if (dataset.after) out.afterImage = dataset.after;
        if (dataset.beforeLabel) out.beforeLabel = dataset.beforeLabel;
        if (dataset.afterLabel) out.afterLabel = dataset.afterLabel;
        if (dataset.beforeAlt) out.beforeAlt = dataset.beforeAlt;
        if (dataset.afterAlt) out.afterAlt = dataset.afterAlt;

        if (dataset.position) {
            const n = parseFloat(dataset.position);
            if (!Number.isNaN(n)) out.position = n;
        }
        if (dataset.min) {
            const n = parseFloat(dataset.min);
            if (!Number.isNaN(n)) out.min = n;
        }
        if (dataset.max) {
            const n = parseFloat(dataset.max);
            if (!Number.isNaN(n)) out.max = n;
        }
        if (dataset.step) {
            const n = parseFloat(dataset.step);
            if (!Number.isNaN(n)) out.step = n;
        }
        if (dataset.aspectRatio) out.aspectRatio = dataset.aspectRatio;
        if (el.hasAttribute('data-show-labels')) {
            out.showLabels = dataset.showLabels !== 'false';
        }
        if (el.hasAttribute('data-disabled')) {
            out.disabled = dataset.disabled !== 'false';
        }

        return out;
    }

    private initCore(): void {
        this.el.classList.add('comparison');
        if (this.options.disabled) {
            this.el.classList.add('comparison--disabled');
        }
        if (this.options.aspectRatio) {
            this.el.style.aspectRatio = this.options.aspectRatio.replace(/\s*\/\s*/, ' / ');
        }

        this.ensureStructure();
        this.applyImages();
        this.applyLabels();
        this.setupAccessibility();
        this.setupInteractions();
        this.setPosition(this.options.position, false);
        this.options.onOpenEnd?.(this);
        this.logger.info('Comparison initialisé');
    }

    private ensureStructure(): void {
        this.beforeEl = this.el.querySelector(SELECTORS.before);
        this.afterEl = this.el.querySelector(SELECTORS.after);
        this.labelBeforeEl = this.el.querySelector(SELECTORS.labelBefore);
        this.labelAfterEl = this.el.querySelector(SELECTORS.labelAfter);
        this.sliderLineEl = this.el.querySelector(SELECTORS.sliderLine);
        this.sliderKnobEl = this.el.querySelector(SELECTORS.sliderKnob) as HTMLButtonElement | null;

        if (!this.beforeEl) {
            this.beforeEl = document.createElement('div');
            this.beforeEl.className = 'comparison__image comparison__image--before';
            this.beforeEl.innerHTML = '<img alt="" decoding="async" draggable="false" />';
            this.el.appendChild(this.beforeEl);
        }

        if (!this.afterEl) {
            this.afterEl = document.createElement('div');
            this.afterEl.className = 'comparison__image comparison__image--after';
            this.afterEl.innerHTML = '<img alt="" decoding="async" draggable="false" />';
            this.el.insertBefore(this.afterEl, this.beforeEl);
        }

        if (this.options.showLabels && !this.labelBeforeEl) {
            this.labelBeforeEl = document.createElement('span');
            this.labelBeforeEl.className = 'comparison__label comparison__label--before';
            this.el.appendChild(this.labelBeforeEl);
        }

        if (this.options.showLabels && !this.labelAfterEl) {
            this.labelAfterEl = document.createElement('span');
            this.labelAfterEl.className = 'comparison__label comparison__label--after';
            this.el.appendChild(this.labelAfterEl);
        }

        if (!this.sliderLineEl) {
            this.sliderLineEl = document.createElement('div');
            this.sliderLineEl.className = 'comparison__slider-line';
            this.el.appendChild(this.sliderLineEl);
        }

        if (!this.sliderKnobEl) {
            this.sliderKnobEl = document.createElement('button');
            this.sliderKnobEl.type = 'button';
            this.sliderKnobEl.className = 'comparison__slider-knob';
            this.sliderKnobEl.innerHTML = KNOB_SVG;
            this.el.appendChild(this.sliderKnobEl);
        }
    }

    private applyImages(): void {
        const beforeImg = this.beforeEl?.querySelector('img');
        const afterImg = this.afterEl?.querySelector('img');

        if (beforeImg && this.options.beforeImage) {
            beforeImg.src = this.options.beforeImage;
            beforeImg.alt = this.options.beforeAlt || LocaleManager.t('comparison.beforeAltDefault');
        }
        if (afterImg && this.options.afterImage) {
            afterImg.src = this.options.afterImage;
            afterImg.alt = this.options.afterAlt || LocaleManager.t('comparison.afterAltDefault');
        }
    }

    private applyLabels(): void {
        const beforeText = this.options.beforeLabel || LocaleManager.t('comparison.beforeLabelDefault');
        const afterText = this.options.afterLabel || LocaleManager.t('comparison.afterLabelDefault');

        if (this.labelBeforeEl) {
            this.labelBeforeEl.textContent = beforeText;
            this.labelBeforeEl.hidden = !this.options.showLabels;
        }
        if (this.labelAfterEl) {
            this.labelAfterEl.textContent = afterText;
            this.labelAfterEl.hidden = !this.options.showLabels;
        }
    }

    private setupAccessibility(): void {
        if (!this.sliderKnobEl) return;

        setAriaAttributes(this.sliderKnobEl, {
            role: 'slider',
            label: LocaleManager.t('comparison.ariaSlider'),
            valuemin: String(this.options.min),
            valuemax: String(this.options.max),
            valuenow: String(Math.round(this.currentPosition)),
        });

        if (this.sliderLineEl) {
            setAriaAttributes(this.sliderLineEl, { hidden: true });
        }
    }

    private setupInteractions(): void {
        if (this.options.disabled || !this.sliderKnobEl) return;

        const knob = this.sliderKnobEl;

        this.unbindKnobPointer = bindPointerDown(knob, (e) => this.startDrag(e, knob));
        this.unbindContainerPointer = bindPointerDown(
            this.el,
            (e) => {
                if (e.target === knob || knob.contains(e.target as Node)) return;
                this.startDrag(e, this.el);
                this.handlePointerMove(e);
            },
            { passive: false }
        );

        this.keyboardHandler = new Keyboard({
            target: knob,
            enabled: true,
            onKeyDown: (event: KeyboardEvent, key: string) => {
                if (this.options.disabled) return;

                let next = this.currentPosition;
                const { step, min, max } = this.options;

                switch (key) {
                    case 'ArrowLeft':
                    case 'ArrowDown':
                        next -= step;
                        event.preventDefault();
                        break;
                    case 'ArrowRight':
                    case 'ArrowUp':
                        next += step;
                        event.preventDefault();
                        break;
                    case 'Home':
                        next = min;
                        event.preventDefault();
                        break;
                    case 'End':
                        next = max;
                        event.preventDefault();
                        break;
                    default:
                        return;
                }

                this.setPosition(next, true);
            },
        });
    }

    private startDrag(event: PointerLikeEvent, captureElement: HTMLElement): void {
        if (this.options.disabled) return;
        if (event instanceof PointerEvent && event.pointerType === 'mouse' && event.button !== 0) return;
        if (event instanceof Event) {
            event.preventDefault();
        }

        this.isDragging = true;
        this.el.classList.add('comparison--dragging');
        this.options.onOpenStart?.(this);

        const pointerId = event instanceof PointerEvent ? event.pointerId : 0;

        this.endDragSession = startPointerDragSession({
            captureElement,
            pointerId,
            preventDefaultOnMove: true,
            onMove: (e) => this.handlePointerMove(e),
            onEnd: () => this.stopDrag(),
        });
    }

    private stopDrag(): void {
        if (!this.isDragging) return;
        this.isDragging = false;
        this.el.classList.remove('comparison--dragging');
        this.endDragSession = null;
        this.options.onCloseEnd?.(this);
    }

    private handlePointerMove(event: PointerLikeEvent): void {
        const { x } = getPointerCoords(event);
        const rect = this.el.getBoundingClientRect();
        if (rect.width <= 0) return;
        const percent = ((x - rect.left) / rect.width) * 100;
        this.setPosition(percent, true);
    }

    /**
     * Retourne la position actuelle du curseur (0–100)
     */
    public getPosition(): number {
        return this.currentPosition;
    }

    /**
     * Définit la position du curseur
     * @param position - Position en pourcentage
     * @param emitChange - Déclencher onChange si la valeur change
     */
    public setPosition(position: number, emitChange = true): void {
        const { min, max } = this.options;
        const clamped = Math.max(min, Math.min(max, position));
        const previous = this.currentPosition;
        this.currentPosition = clamped;

        if (this.beforeEl) {
            this.beforeEl.style.clipPath = `inset(0 ${100 - clamped}% 0 0)`;
        }
        if (this.sliderLineEl) {
            this.sliderLineEl.style.left = `${clamped}%`;
        }
        if (this.sliderKnobEl) {
            this.sliderKnobEl.style.left = `${clamped}%`;
            setAriaAttributes(this.sliderKnobEl, {
                valuenow: String(Math.round(clamped)),
            });
        }

        if (emitChange && clamped !== previous) {
            this.options.onChange?.(clamped, this);
        }
    }

    /**
     * Met à jour les images avant/après
     * @param before - URL image avant
     * @param after - URL image après
     */
    public setImages(before?: string, after?: string): void {
        if (before !== undefined) this.options.beforeImage = before;
        if (after !== undefined) this.options.afterImage = after;
        this.applyImages();
    }

    override destroy(): void {
        this.options.onCloseStart?.(this);
        this.endDragSession?.();
        this.endDragSession = null;
        this.unbindKnobPointer?.();
        this.unbindContainerPointer?.();
        this.unbindKnobPointer = null;
        this.unbindContainerPointer = null;
        this.keyboardHandler?.destroy();
        this.keyboardHandler = null;
        this.beforeEl = null;
        this.afterEl = null;
        this.labelBeforeEl = null;
        this.labelAfterEl = null;
        this.sliderLineEl = null;
        this.sliderKnobEl = null;
        this.logger.info('Comparison détruit');
        super.destroy();
    }
}

if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-comparison')) {
    customElements.define(
        'k3ui-comparison',
        class K3UIComparisonElement extends HTMLElement {
            connectedCallback(): void {
                if (!this.hasAttribute('data-initialized')) {
                    this.classList.add('comparison');
                    this.setAttribute('data-initialized', 'true');
                }
            }

            disconnectedCallback(): void {}
        }
    );
}
