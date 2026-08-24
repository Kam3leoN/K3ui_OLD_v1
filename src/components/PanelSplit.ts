/**
 * @fileoverview Composant PanelSplit pour K3UI
 * @description Dual-view layout M3 Expressive avec poignée drag (modèle M3E Split Pane)
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { toComponentClassDef } from '../types/components/component-base';
import type { PanelSplitOptions, PanelSplitOrientation } from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { setAriaAttribute, removeAriaAttribute } from '../utils/dom/aria';
import { ManagerFactory } from '../core/factories';
import { getPanelSplitDefaults } from '../specs/components/panel-split.specs';

const _defaults: PanelSplitOptions = getPanelSplitDefaults();

const VALID_ORIENTATIONS: PanelSplitOrientation[] = ['horizontal', 'vertical'];

interface KPanelSplitHTMLElement extends HTMLElement {
    K_PanelSplit?: PanelSplit;
}

interface DragState {
    startPos: number;
    startValue: number;
    cachedSize: number;
    min: number;
    max: number;
}

/**
 * Composant PanelSplit — séparation de contenu avec poignée redimensionnable
 */
export class PanelSplit extends Component<PanelSplitOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    private logger = ManagerFactory.getLoggerManager('[PanelSplit]');

    private startEl: HTMLElement | null = null;
    private endEl: HTMLElement | null = null;
    private handleEl: HTMLElement | null = null;
    private dragState: DragState | null = null;

    private boundPointerDown = this.handlePointerDown.bind(this);
    private boundPointerMove = this.handlePointerMove.bind(this);
    private boundPointerUp = this.handlePointerUp.bind(this);
    private boundKeyDown = this.handleKeyDown.bind(this);

    static get defaults(): PanelSplitOptions {
        return { ..._defaults };
    }

    /**
     * @param el Élément host
     * @returns Instance PanelSplit ou null
     */
    static getInstance(el: HTMLElement): PanelSplit | null {
        return (el as KPanelSplitHTMLElement).K_PanelSplit ?? null;
    }

    /**
     * Initialise une ou plusieurs instances PanelSplit
     * @param els Élément(s) ou sélecteur
     * @param options Options partielles
     * @returns Instances créées
     */
    static init(
        els: KElement | InitElements<KElement> | string,
        options: Partial<PanelSplitOptions> = {}
    ): PanelSplit[] {
        return Component.init(els, options, toComponentClassDef(PanelSplit)) as PanelSplit[];
    }

    constructor(el: HTMLElement, options: Partial<PanelSplitOptions> = {}) {
        super(el, options, toComponentClassDef(PanelSplit));
        const fromHtml = PanelSplit.readAttributes(el);
        this.options = {
            ...PanelSplit.defaults,
            ...options,
            ...fromHtml,
        };

        (el as KPanelSplitHTMLElement).K_PanelSplit = this;
        this.init();
    }

    /**
     * Lit les attributs data-* / aria du host
     * @param el Élément host
     * @returns Options partielles
     */
    private static readAttributes(el: HTMLElement): Partial<PanelSplitOptions> {
        const out: Partial<PanelSplitOptions> = {};
        const get = (key: string) => el.getAttribute(`data-${key}`);

        const orientation = get('orientation') ?? el.getAttribute('orientation');
        if (orientation != null && VALID_ORIENTATIONS.includes(orientation as PanelSplitOrientation)) {
            out.orientation = orientation as PanelSplitOrientation;
        }

        const parseNum = (raw: string | null): number | undefined => {
            if (raw == null || raw === '') return undefined;
            const n = parseFloat(raw);
            return Number.isFinite(n) ? n : undefined;
        };

        const value = parseNum(get('value') ?? el.getAttribute('value'));
        if (value !== undefined) out.value = value;

        const min = parseNum(get('min') ?? el.getAttribute('min'));
        if (min !== undefined) out.min = min;

        const max = parseNum(get('max') ?? el.getAttribute('max'));
        if (max !== undefined) out.max = max;

        const step = parseNum(get('step') ?? el.getAttribute('step'));
        if (step !== undefined) out.step = step;

        const disabled = get('disabled');
        if (disabled === 'true' || disabled === 'false') {
            out.disabled = disabled === 'true';
        }

        const label = get('label') ?? el.getAttribute('label');
        if (label != null && label !== '') out.label = label;

        const handleSize = get('handle-size');
        if (handleSize != null && handleSize !== '') out.handleSize = handleSize;

        return out;
    }

    private init(): void {
        this.resolveStructure();
        this.applyClasses();
        this.applyCssVariables();
        this.applyHandleAccessibility();
        this.setValue(this.options.value, false);
        this.bindHandleEvents();
        this.options.onOpenStart?.(this.el);
        this.options.onOpenEnd?.(this.el);
        this.logger.info('PanelSplit initialized', { orientation: this.options.orientation });
    }

    /**
     * Résout start / handle / end dans le light DOM
     */
    private resolveStructure(): void {
        this.startEl =
            this.el.querySelector('[slot="start"]') ??
            this.el.querySelector('.panel-split__start') ??
            this.el.querySelector('.docs-split-pane__start');

        this.endEl =
            this.el.querySelector('[slot="end"]') ??
            this.el.querySelector('.panel-split__end') ??
            this.el.querySelector('.docs-split-pane__end');

        this.handleEl =
            this.el.querySelector('.panel-split__handle') ??
            this.el.querySelector('.docs-split-pane__handle');

        if (!this.handleEl && this.startEl && this.endEl) {
            this.handleEl = document.createElement('div');
            this.handleEl.className = 'panel-split__handle docs-split-pane__handle';
            this.endEl.parentElement?.insertBefore(this.handleEl, this.endEl);
        }

        if (this.startEl) {
            this.startEl.classList.add('panel-split__start');
            this.startEl.id = this.startEl.id || 'panel-split-start';
        }
        if (this.endEl) {
            this.endEl.classList.add('panel-split__end');
        }
    }

    private applyClasses(): void {
        const { orientation } = this.options;
        this.el.classList.add('panel-split', 'docs-split-pane');
        this.el.classList.remove('panel-split--horizontal', 'panel-split--vertical');
        this.el.classList.remove('docs-split-pane--horizontal', 'docs-split-pane--vertical');
        this.el.classList.add(`panel-split--${orientation}`, `docs-split-pane--${orientation}`);

        if (this.options.disabled) {
            this.el.classList.add('panel-split--disabled');
        } else {
            this.el.classList.remove('panel-split--disabled');
        }
    }

    private applyCssVariables(): void {
        this.el.style.setProperty('--panel-split-handle-size', this.options.handleSize);
        this.el.style.setProperty('--docs-split-handle-size', this.options.handleSize);
    }

    private applyHandleAccessibility(): void {
        if (!this.handleEl) return;

        setAriaAttribute(this.handleEl, 'role', 'separator');
        setAriaAttribute(
            this.handleEl,
            'orientation',
            this.options.orientation === 'vertical' ? 'horizontal' : 'vertical'
        );
        setAriaAttribute(this.handleEl, 'label', this.options.label);
        setAriaAttribute(this.handleEl, 'valuemin', String(this.options.min));
        setAriaAttribute(this.handleEl, 'valuemax', String(this.options.max));
        setAriaAttribute(this.handleEl, 'valuenow', String(Math.round(this.options.value)));

        if (!this.options.disabled && !this.handleEl.hasAttribute('tabindex')) {
            this.handleEl.setAttribute('tabindex', '0');
        }
        if (this.options.disabled) {
            this.handleEl.setAttribute('aria-disabled', 'true');
            this.handleEl.removeAttribute('tabindex');
        } else {
            this.handleEl.removeAttribute('aria-disabled');
        }

        if (this.startEl) {
            this.handleEl.setAttribute('aria-controls', this.startEl.id);
        }
    }

    private bindHandleEvents(): void {
        if (!this.handleEl || this.options.disabled) return;

        this.registerEvent(this.handleEl, 'pointerdown', this.boundPointerDown);
        this.registerEvent(this.handleEl, 'pointermove', this.boundPointerMove);
        this.registerEvent(this.handleEl, 'pointerup', this.boundPointerUp);
        this.registerEvent(this.handleEl, 'pointercancel', this.boundPointerUp);
        this.registerEvent(this.handleEl, 'keydown', this.boundKeyDown);
    }

    /**
     * Retourne la valeur courante en pourcentage
     * @returns Valeur clampée entre min et max
     */
    getValue(): number {
        return this.clampValue(this.options.value);
    }

    /**
     * Définit la position de la poignée
     * @param value Valeur en pourcentage
     * @param emitChange Émettre l'événement change
     */
    setValue(value: number, emitChange = true): void {
        const next = this.clampValue(value);
        if (next === this.options.value && emitChange) return;

        this.options.value = next;
        const cssValue = `${next}%`;
        this.el.style.setProperty('--panel-split-value', cssValue);
        this.el.style.setProperty('--docs-split-value', cssValue);
        this.el.dataset.splitValue = String(Math.round(next * 10) / 10);

        if (this.handleEl) {
            setAriaAttribute(this.handleEl, 'valuenow', String(Math.round(next)));
        }

        this.el.dispatchEvent(new Event('input', { bubbles: true }));
        if (emitChange) {
            this.el.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    /**
     * Déplace la poignée à la position maximale (start étendu)
     */
    expand(): void {
        this.setValue(this.options.max);
    }

    /**
     * Déplace la poignée à la position minimale (end étendu)
     */
    collapse(): void {
        this.setValue(this.options.min);
    }

    /**
     * @returns Élément pane start
     */
    getStartElement(): HTMLElement | null {
        return this.startEl;
    }

    /**
     * @returns Élément pane end
     */
    getEndElement(): HTMLElement | null {
        return this.endEl;
    }

    /**
     * @returns Élément poignée
     */
    getHandleElement(): HTMLElement | null {
        return this.handleEl;
    }

    /**
     * Met à jour les options et réapplique l'état
     * @param options Options partielles
     */
    updateOptions(options: Partial<PanelSplitOptions>): void {
        this.options = { ...this.options, ...options };
        this.applyClasses();
        this.applyCssVariables();
        this.applyHandleAccessibility();
        this.setValue(this.options.value, false);
    }

    private clampValue(value: number): number {
        return Math.max(this.options.min, Math.min(this.options.max, value));
    }

    private getAxisSize(): number {
        return this.options.orientation === 'vertical'
            ? this.el.clientHeight
            : this.el.clientWidth;
    }

    private getPointerPos(event: PointerEvent): number {
        return this.options.orientation === 'vertical' ? event.clientY : event.clientX;
    }

    private handlePointerDown(event: PointerEvent): void {
        if (this.options.disabled) return;
        if (event.pointerType === 'mouse' && event.button > 0) return;
        if (!this.handleEl) return;

        this.handleEl.setPointerCapture(event.pointerId);
        this.handleEl.classList.add('is-pressed');
        this.dragState = {
            startPos: this.getPointerPos(event),
            startValue: this.getValue(),
            cachedSize: this.getAxisSize(),
            min: this.options.min,
            max: this.options.max,
        };
    }

    private handlePointerMove(event: PointerEvent): void {
        if (!this.handleEl?.hasPointerCapture(event.pointerId) || !this.dragState) return;

        const delta =
            this.dragState.cachedSize > 0
                ? ((this.getPointerPos(event) - this.dragState.startPos) / this.dragState.cachedSize) * 100
                : 0;

        this.setValue(this.dragState.startValue + delta, false);
    }

    private handlePointerUp(event: PointerEvent): void {
        if (!this.handleEl?.hasPointerCapture(event.pointerId)) return;

        this.handleEl.releasePointerCapture(event.pointerId);
        this.handleEl.classList.remove('is-pressed');
        this.dragState = null;
        this.setValue(this.getValue());
    }

    private handleKeyDown(event: KeyboardEvent): void {
        if (this.options.disabled) return;

        const step = event.shiftKey ? this.options.step * 5 : this.options.step;
        const vertical = this.options.orientation === 'vertical';
        let delta = 0;

        switch (event.key) {
            case 'ArrowUp':
                delta = vertical ? step : 0;
                break;
            case 'ArrowDown':
                delta = vertical ? -step : 0;
                break;
            case 'ArrowLeft':
                delta = vertical ? 0 : -step;
                break;
            case 'ArrowRight':
                delta = vertical ? 0 : step;
                break;
            case 'PageUp':
                delta = step * 5;
                break;
            case 'PageDown':
                delta = -step * 5;
                break;
            case 'Home':
                event.preventDefault();
                this.expand();
                return;
            case 'End':
                event.preventDefault();
                this.collapse();
                return;
            default:
                return;
        }

        if (delta !== 0) {
            event.preventDefault();
            this.setValue(this.getValue() + delta);
        }
    }

    override destroy(): void {
        if ((this.el as KPanelSplitHTMLElement).K_PanelSplit === this) {
            delete (this.el as KPanelSplitHTMLElement).K_PanelSplit;
        }

        this.handleEl?.classList.remove('is-pressed');
        this.dragState = null;

        this.options.onCloseStart?.(this.el);
        this.options.onCloseEnd?.(this.el);
        this.logger.info('PanelSplit destroyed');
        super.destroy();
    }
}

if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-panel-split')) {
    customElements.define('k3ui-panel-split', class K3UIPanelSplitElement extends HTMLElement {
        connectedCallback(): void {
            if (!this.hasAttribute('data-initialized')) {
                this.setAttribute('data-initialized', 'true');
            }
        }

        disconnectedCallback(): void {}
    });
}
