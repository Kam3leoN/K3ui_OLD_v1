/**
 * @fileoverview Composant ButtonGrid pour K3UI
 * @description Grille 3×3 Material Design 3 Expressive — FAB animé ou pad déployé
 * @see https://m3.material.io/components/buttons/overview
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { toComponentClassDef } from '../types/components/component-base';
import type { ButtonGridOptions } from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { setAriaAttributes, setAriaAttribute } from '../utils/dom/aria';
import { LoggerManager } from '../core/managers';
import { ManagerFactory } from '../core/factories';
import {
    getButtonGridDefaults,
    ButtonGridSpecs,
    BUTTON_GRID_CELLS,
    BUTTON_GRID_DEFAULT_LABELS,
    buttonGridAppsSVG,
    type ButtonGridCellDef,
} from '../specs/components/button-grid.specs';
import { Keyboard } from '../core/managers/KeyboardManager';
import { HapticManager } from '../core/managers/HapticManager';

interface KButtonGridHTMLElement extends HTMLElement {
    K_ButtonGrid?: ButtonGrid;
}

const _defaults: ButtonGridOptions = getButtonGridDefaults();

const VARIANTS: ButtonGridOptions['variant'][] = ['filled', 'tonal', 'outlined'];

/**
 * Classe ButtonGrid pour K3UI
 * @description Grille 3×3 de sélection — déclenchement FAB animé ou pad toujours visible
 */
export class ButtonGrid extends Component<ButtonGridOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;
    private logger: LoggerManager;
    private fab: HTMLButtonElement | null = null;
    private gridEl: HTMLElement | null = null;
    private cells: HTMLButtonElement[] = [];
    private keyboardInstance: Keyboard | null = null;
    /** true = FAB + reveal ; false = pad déployé */
    private useFabTrigger = true;

    static get defaults(): ButtonGridOptions {
        return {
            ..._defaults,
            labels: [...(_defaults.labels ?? BUTTON_GRID_DEFAULT_LABELS)],
        };
    }

    /**
     * Retourne l'instance ButtonGrid attachée à un élément
     * @param el - Élément hôte
     */
    static getInstance(el: HTMLElement): ButtonGrid | null {
        return (el as KButtonGridHTMLElement).K_ButtonGrid ?? null;
    }

    /**
     * Initialise ButtonGrid sur un ou plusieurs éléments
     * @param els - Élément(s) ou sélecteur
     * @param options - Options partielles
     */
    static init(
        els: KElement | InitElements<KElement> | string,
        options: Partial<ButtonGridOptions> = {}
    ): ButtonGrid[] {
        return Component.init(els, options, toComponentClassDef(ButtonGrid)) as ButtonGrid[];
    }

    constructor(el: HTMLElement, options: Partial<ButtonGridOptions> = {}) {
        super(el, options, toComponentClassDef(ButtonGrid));
        this.logger = ManagerFactory.getLoggerManager('[ButtonGrid]');

        const fromHtml = ButtonGrid.readAttributes(el);
        this.options = {
            ...ButtonGrid.defaults,
            ...options,
            ...fromHtml,
        } as ButtonGridOptions;

        if (!Array.isArray(this.options.labels) || this.options.labels.length < 9) {
            this.options.labels = [...BUTTON_GRID_DEFAULT_LABELS];
        }

        this.useFabTrigger = this.resolveTriggerFAB();

        (el as KButtonGridHTMLElement).K_ButtonGrid = this;
        this.init();
    }

    /**
     * Lit les attributs data-* / classes HTML
     * @param el - Élément hôte
     */
    private static readAttributes(el: HTMLElement): Partial<ButtonGridOptions> {
        const out: Partial<ButtonGridOptions> = {};
        const get = (dataName: string, plainName?: string) =>
            el.getAttribute(`data-${dataName}`) ?? (plainName ? el.getAttribute(plainName) : null);

        const variant = get('variant', 'variant') ?? get('v');
        if (variant === 'filled' || variant === 'tonal' || variant === 'outlined') {
            out.variant = variant;
        } else {
            for (const v of VARIANTS) {
                if (
                    el.classList.contains(`btn-grid--${v}`) ||
                    el.classList.contains(`button-grid--${v}`)
                ) {
                    out.variant = v;
                    break;
                }
            }
        }

        const trigger = get('trigger');
        if (trigger === 'pad' || trigger === 'false') {
            out.triggerFAB = false;
        } else if (trigger === 'fab' || trigger === 'true') {
            out.triggerFAB = true;
        } else if (
            el.classList.contains('btn-grid--pad') ||
            el.classList.contains('button-grid--pad')
        ) {
            out.triggerFAB = false;
        }

        const triggerFabAttr = get('trigger-fab') ?? get('triggerfab');
        if (triggerFabAttr === 'false' || triggerFabAttr === '0') {
            out.triggerFAB = false;
        } else if (triggerFabAttr === 'true' || triggerFabAttr === '1') {
            out.triggerFAB = true;
        }

        const labelsRaw = get('labels');
        if (labelsRaw) {
            const parts = labelsRaw.split(',').map((s) => s.trim()).filter(Boolean);
            if (parts.length >= 9) {
                out.labels = parts.slice(0, 9);
            }
        }

        return out;
    }

    /**
     * Détermine si le FAB animé est actif (false si reduced motion)
     */
    private resolveTriggerFAB(): boolean {
        if (this.options.triggerFAB === false) {
            return false;
        }
        if (
            ButtonGridSpecs.accessibility.autoPadForReducedMotion &&
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ) {
            return false;
        }
        return true;
    }

    private init(): void {
        if (this.options.onOpenStart) this.options.onOpenStart(this.el);

        this.applyClasses();
        this.setupAccessibility();

        const hasExisting = this.el.querySelector(
            '.btn-grid__grid, .button-grid__grid, .btn-grid__cell, .button-grid__cell'
        );
        if (hasExisting) {
            this.collectExistingDom();
        } else {
            this.buildDom();
        }

        this.attachEventListeners();

        if (this.options.onOpenEnd) this.options.onOpenEnd(this.el);
        this.logger.info('ButtonGrid initialized');
    }

    private applyClasses(): void {
        if (!this.el.classList.contains('btn-grid') && !this.el.classList.contains('button-grid')) {
            this.el.classList.add('btn-grid');
        }

        for (const v of VARIANTS) {
            this.el.classList.remove(`btn-grid--${v}`, `button-grid--${v}`);
        }
        this.el.classList.remove('btn-grid--pad', 'button-grid--pad');

        const { variant } = this.options;
        if (variant === 'tonal') {
            this.el.classList.add('btn-grid--tonal', 'button-grid--tonal');
        } else if (variant === 'outlined') {
            this.el.classList.add('btn-grid--outlined', 'button-grid--outlined');
        } else {
            this.el.classList.add('btn-grid--filled', 'button-grid--filled');
        }

        this.el.setAttribute('data-variant', variant);

        if (this.useFabTrigger) {
            this.el.setAttribute('data-trigger', 'fab');
            this.el.setAttribute('data-state', 'collapsed');
            this.el.classList.remove('btn-grid--pad', 'button-grid--pad');
        } else {
            this.el.setAttribute('data-trigger', 'pad');
            this.el.removeAttribute('data-state');
            this.el.classList.add('btn-grid--pad', 'button-grid--pad');
        }
    }

    private setupAccessibility(): void {
        setAriaAttributes(this.el, { role: ButtonGridSpecs.accessibility.role });
    }

    private buildDom(): void {
        this.el.innerHTML = '';
        this.fab = null;
        this.cells = [];

        if (this.useFabTrigger) {
            this.buildFab();
        }

        this.gridEl = document.createElement('div');
        this.gridEl.className = 'btn-grid__grid button-grid__grid';

        BUTTON_GRID_CELLS.forEach((meta, i) => {
            const cell = this.createCellButton(meta, i);
            this.gridEl!.appendChild(cell);
            this.cells.push(cell);
        });

        this.el.appendChild(this.gridEl);
    }

    private buildFab(): void {
        this.fab = document.createElement('button');
        this.fab.type = 'button';
        this.fab.className = 'btn-grid__fab button-grid__fab';
        setAriaAttribute(this.fab, 'label', ButtonGridSpecs.accessibility.fabLabel);
        setAriaAttribute(this.fab, 'expanded', 'false');
        this.fab.innerHTML = buttonGridAppsSVG();
        this.el.appendChild(this.fab);
    }

    /**
     * Crée un bouton de cellule
     * @param meta - Métadonnées de position / stagger
     * @param index - Index 0–8
     */
    private createCellButton(meta: ButtonGridCellDef, index: number): HTMLButtonElement {
        const label = this.options.labels[index] ?? String(index + 1);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className =
            `btn-grid__cell btn-grid__cell--${meta.position} ` +
            `button-grid__cell button-grid__cell--${meta.position}`;
        btn.dataset.d = String(meta.staggerDistance);
        btn.dataset.index = String(index + 1);
        setAriaAttribute(btn, 'label', label);
        btn.textContent = label;
        return btn;
    }

    private collectExistingDom(): void {
        this.fab = this.el.querySelector('.btn-grid__fab, .button-grid__fab');
        this.gridEl = this.el.querySelector('.btn-grid__grid, .button-grid__grid');
        this.cells = Array.from(
            this.el.querySelectorAll('.btn-grid__cell, .button-grid__cell')
        ) as HTMLButtonElement[];

        this.cells.forEach((cell, i) => {
            const meta = BUTTON_GRID_CELLS[i];
            if (meta && !cell.dataset.d) {
                cell.dataset.d = String(meta.staggerDistance);
            }
            if (!cell.getAttribute('aria-label')) {
                const label = this.options.labels[i] ?? cell.textContent?.trim() ?? String(i + 1);
                setAriaAttribute(cell, 'label', label);
            }
        });
    }

    private attachEventListeners(): void {
        if (this.fab) {
            this.registerEvent(this.fab, 'click', (e: Event) => {
                e.preventDefault();
                this.expand();
            });
        }

        this.cells.forEach((cell, i) => {
            this.registerEvent(cell, 'click', (e: Event) => {
                e.preventDefault();
                this.select(i);
            });
        });

        if (this.useFabTrigger) {
            this.keyboardInstance = new Keyboard({
                target: this.el,
                onKeyDown: (e: KeyboardEvent) => {
                    if (e.key === 'Escape' && this.isExpanded) {
                        e.preventDefault();
                        this.collapse();
                    }
                },
            });
        }
    }

    /**
     * Indique si la grille est déployée (mode FAB uniquement)
     */
    get isExpanded(): boolean {
        return this.el.getAttribute('data-state') === 'expanded';
    }

    /**
     * Déploie la grille (mode FAB)
     */
    expand(): void {
        if (!this.useFabTrigger) return;
        this.el.setAttribute('data-state', 'expanded');
        if (this.fab) {
            setAriaAttribute(this.fab, 'expanded', 'true');
        }
    }

    /**
     * Replie la grille vers le FAB
     */
    collapse(): void {
        if (!this.useFabTrigger) return;
        this.el.setAttribute('data-state', 'collapsed');
        if (this.fab) {
            setAriaAttribute(this.fab, 'expanded', 'false');
        }
    }

    /**
     * Sélectionne une cellule par index 0–8
     * @param index - Index de la cellule (0-based)
     */
    select(index: number): void {
        if (index < 0 || index > 8) return;
        const label = this.options.labels[index] ?? String(index + 1);
        HapticManager.triggerFromOptions(this.options, 'medium');
        this.options.onSelect?.(index + 1, label, this);
        if (this.useFabTrigger) {
            this.collapse();
        }
    }

    /**
     * Change la variante visuelle
     * @param variant - filled | tonal | outlined
     */
    setVariant(variant: ButtonGridOptions['variant']): void {
        this.options.variant = variant;
        this.applyClasses();
    }

    /**
     * Active / désactive le mode FAB (reconstruit le DOM)
     * @param enabled - true = FAB + reveal
     */
    setTriggerFAB(enabled: boolean): void {
        this.options.triggerFAB = enabled;
        this.useFabTrigger = this.resolveTriggerFAB();
        this.keyboardInstance?.destroy();
        this.keyboardInstance = null;
        this.applyClasses();
        this.buildDom();
        this.attachEventListeners();
    }

    /**
     * Met à jour les labels des 9 cellules
     * @param labels - Tableau de 9 libellés
     */
    setLabels(labels: string[]): void {
        if (!Array.isArray(labels) || labels.length < 9) return;
        this.options.labels = labels.slice(0, 9);
        this.cells.forEach((cell, i) => {
            const label = this.options.labels[i];
            cell.textContent = label;
            setAriaAttribute(cell, 'label', label);
        });
    }

    override destroy(): void {
        if (this.options.onCloseStart) this.options.onCloseStart(this.el);

        this.keyboardInstance?.destroy();
        this.keyboardInstance = null;
        this.cells = [];
        this.fab = null;
        this.gridEl = null;
        delete (this.el as KButtonGridHTMLElement).K_ButtonGrid;

        if (this.options.onCloseEnd) this.options.onCloseEnd(this.el);
        this.logger.info('ButtonGrid destroyed');
        super.destroy();
    }
}

if (typeof customElements !== 'undefined' && !customElements.get('k3ui-button-grid')) {
    class K3UIButtonGridElement extends HTMLElement {
        connectedCallback(): void {
            if (!ButtonGrid.getInstance(this)) {
                ButtonGrid.init(this);
            }
        }
    }
    customElements.define('k3ui-button-grid', K3UIButtonGridElement);
}
