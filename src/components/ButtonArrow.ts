/**
 * @fileoverview Composant ButtonArrow pour K3UI
 * @description Split-button flèches Material Design 3 Expressive — horizontal (← →) / vertical (↑ ↓)
 * @see https://m3.material.io/components/buttons/overview
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { toComponentClassDef } from '../types/components/component-base';
import type { ButtonArrowOptions } from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { setAriaAttributes, setAriaAttribute } from '../utils/dom/aria';
import { LoggerManager, IconManager } from '../core/managers';
import { ManagerFactory } from '../core/factories';
import { getButtonArrowDefaults, ButtonArrowSpecs } from '../specs/components/button-arrow.specs';
import { Keyboard } from '../core/managers/KeyboardManager';
import { HapticManager } from '../core/managers/HapticManager';

interface KButtonArrowHTMLElement extends HTMLElement {
    K_ButtonArrow?: ButtonArrow;
}

const _defaults: ButtonArrowOptions = getButtonArrowDefaults();

const VARIANTS: ButtonArrowOptions['variant'][] = ['filled', 'tonal', 'outlined'];
const DIRECTIONS: ButtonArrowOptions['direction'][] = ['horizontal', 'vertical'];

/**
 * Classe ButtonArrow pour K3UI
 * @description Paire de boutons flèche (capsule) pour naviguer dans une liste cyclique
 */
export class ButtonArrow extends Component<ButtonArrowOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;
    private logger: LoggerManager;
    private btnA: HTMLButtonElement | null = null;
    private btnB: HTMLButtonElement | null = null;
    private idx = 0;
    private keyboardInstance: Keyboard | null = null;

    static get defaults(): ButtonArrowOptions {
        return { ..._defaults, list: [...(_defaults.list ?? [])] };
    }

    /**
     * Retourne l'instance ButtonArrow attachée à un élément
     * @param el - Élément hôte
     */
    static getInstance(el: HTMLElement): ButtonArrow | null {
        return (el as KButtonArrowHTMLElement).K_ButtonArrow ?? null;
    }

    /**
     * Initialise ButtonArrow sur un ou plusieurs éléments
     * @param els - Élément(s) ou sélecteur
     * @param options - Options partielles
     */
    static init(
        els: KElement | InitElements<KElement> | string,
        options: Partial<ButtonArrowOptions> = {}
    ): ButtonArrow[] {
        return Component.init(els, options, toComponentClassDef(ButtonArrow)) as ButtonArrow[];
    }

    constructor(el: HTMLElement, options: Partial<ButtonArrowOptions> = {}) {
        super(el, options, toComponentClassDef(ButtonArrow));
        this.logger = ManagerFactory.getLoggerManager('[ButtonArrow]');

        const fromHtml = ButtonArrow.readAttributes(el);
        this.options = {
            ...ButtonArrow.defaults,
            ...options,
            ...fromHtml,
            list: fromHtml.list ?? options.list ?? ButtonArrow.defaults.list,
        } as ButtonArrowOptions;

        this.idx = this.clampIndex(this.options.initialIndex);
        (el as KButtonArrowHTMLElement).K_ButtonArrow = this;
        this.init();
    }

    /** Valeur courante dans la liste (chaîne vide si liste vide) */
    get value(): string {
        return this.options.list[this.idx] ?? '';
    }

    /** Index courant */
    get index(): number {
        return this.idx;
    }

    /**
     * Lit les attributs data-* / classes HTML
     * @param el - Élément hôte
     */
    private static readAttributes(el: HTMLElement): Partial<ButtonArrowOptions> {
        const out: Partial<ButtonArrowOptions> = {};
        const get = (dataName: string, plainName?: string) =>
            el.getAttribute(`data-${dataName}`) ?? (plainName ? el.getAttribute(plainName) : null);

        const dir = get('dir', 'direction') ?? get('direction');
        if (dir === 'horizontal' || dir === 'vertical') out.direction = dir;
        else if (el.classList.contains('btn-arrow--vertical') || el.classList.contains('button-arrow--vertical')) {
            out.direction = 'vertical';
        } else if (el.classList.contains('btn-arrow--horizontal') || el.classList.contains('button-arrow--horizontal')) {
            out.direction = 'horizontal';
        }

        const variant = get('variant', 'variant') ?? get('v');
        if (variant === 'filled' || variant === 'tonal' || variant === 'outlined') {
            out.variant = variant;
        } else {
            for (const v of VARIANTS) {
                if (el.classList.contains(`btn-arrow--${v}`) || el.classList.contains(`button-arrow--${v}`)) {
                    out.variant = v;
                    break;
                }
            }
        }

        const listRaw = get('list');
        if (listRaw != null && listRaw.trim() !== '') {
            out.list = ButtonArrow.parseList(listRaw);
        }

        const initial = get('initial-index', 'initialIndex');
        if (initial != null && initial !== '') {
            const n = Number.parseInt(initial, 10);
            if (!Number.isNaN(n)) out.initialIndex = n;
        }

        return out;
    }

    /**
     * Parse une liste depuis un attribut (JSON array ou CSV)
     * @param raw - Chaîne brute
     */
    private static parseList(raw: string): string[] {
        const trimmed = raw.trim();
        if (trimmed.startsWith('[')) {
            try {
                const parsed = JSON.parse(trimmed) as unknown;
                if (Array.isArray(parsed)) return parsed.map(String);
            } catch {
                /* fallback CSV */
            }
        }
        return trimmed.split(',').map((s) => s.trim()).filter(Boolean);
    }

    private clampIndex(i: number): number {
        const len = this.options.list.length;
        if (len === 0) return 0;
        return ((i % len) + len) % len;
    }

    private init(): void {
        if (this.options.onOpenStart) this.options.onOpenStart(this.el);

        this.applyClasses();
        this.setupAccessibility();

        const hasExisting = this.el.querySelector('.btn-arrow__btn, .button-arrow__btn');
        if (hasExisting) {
            this.btnA = this.el.querySelector('.btn-arrow__btn--a, .button-arrow__btn--a') as HTMLButtonElement;
            this.btnB = this.el.querySelector('.btn-arrow__btn--b, .button-arrow__btn--b') as HTMLButtonElement;
        } else {
            this.buildDom();
        }

        this.attachEventListeners();

        if (this.btnA || this.btnB) {
            IconManager.processIconsInContainer(this.el);
            IconManager.forceDisplayIcons();
        }

        if (this.options.onOpenEnd) this.options.onOpenEnd(this.el);
        this.logger.info('ButtonArrow initialized');
    }

    private applyClasses(): void {
        if (!this.el.classList.contains('btn-arrow') && !this.el.classList.contains('button-arrow')) {
            this.el.classList.add('btn-arrow');
        }

        for (const d of DIRECTIONS) {
            this.el.classList.remove(`btn-arrow--${d}`, `button-arrow--${d}`);
        }
        for (const v of VARIANTS) {
            this.el.classList.remove(`btn-arrow--${v}`, `button-arrow--${v}`);
        }

        const { direction, variant } = this.options;
        if (direction === 'vertical') {
            this.el.classList.add('btn-arrow--vertical', 'button-arrow--vertical');
        } else {
            this.el.classList.add('btn-arrow--horizontal', 'button-arrow--horizontal');
        }
        if (variant === 'tonal') {
            this.el.classList.add('btn-arrow--tonal', 'button-arrow--tonal');
        } else if (variant === 'outlined') {
            this.el.classList.add('btn-arrow--outlined', 'button-arrow--outlined');
        } else {
            this.el.classList.add('btn-arrow--filled', 'button-arrow--filled');
        }
        this.el.setAttribute('data-dir', direction);
        this.el.setAttribute('data-variant', variant);
    }

    private setupAccessibility(): void {
        setAriaAttributes(this.el, { role: ButtonArrowSpecs.accessibility.role });
        if (!this.el.hasAttribute('tabindex')) {
            this.el.setAttribute('tabindex', '0');
        }
    }

    private buildDom(): void {
        this.el.innerHTML = '';
        const isH = this.options.direction === 'horizontal';
        const { iconLeft, iconRight, iconUp, iconDown } = ButtonArrowSpecs.behaviors;
        const { labelPrev, labelNext, labelUp, labelDown } = ButtonArrowSpecs.accessibility;

        this.btnA = this.createHalfButton('a', isH ? iconLeft : iconUp, isH ? labelPrev : labelUp);
        this.btnB = this.createHalfButton('b', isH ? iconRight : iconDown, isH ? labelNext : labelDown);

        this.el.append(this.btnA, this.btnB);
    }

    /**
     * Crée une moitié du split-button
     * @param half - Identifiant a (leading) ou b (trailing)
     * @param iconName - Nom d'icône IconManager
     * @param ariaLabel - Libellé accessible
     */
    private createHalfButton(
        half: 'a' | 'b',
        iconName: string,
        ariaLabel: string
    ): HTMLButtonElement {
        const btn = document.createElement('button');
        btn.type = 'button';
        if (half === 'a') {
            btn.className = 'btn-arrow__btn btn-arrow__btn--a button-arrow__btn button-arrow__btn--a';
        } else {
            btn.className = 'btn-arrow__btn btn-arrow__btn--b button-arrow__btn button-arrow__btn--b';
        }
        setAriaAttribute(btn, 'label', ariaLabel);

        const icon = document.createElement('i');
        icon.className = 'k3ui-icon';
        icon.setAttribute('name', iconName);
        setAriaAttribute(icon, 'hidden', true);
        btn.appendChild(icon);

        return btn;
    }

    private attachEventListeners(): void {
        if (this.btnA) {
            this.registerEvent(this.btnA, 'click', (e: Event) => {
                e.preventDefault();
                this.step(-1);
            });
        }
        if (this.btnB) {
            this.registerEvent(this.btnB, 'click', (e: Event) => {
                e.preventDefault();
                this.step(+1);
            });
        }

        const isH = this.options.direction === 'horizontal';
        const prevKey = isH ? 'ArrowLeft' : 'ArrowUp';
        const nextKey = isH ? 'ArrowRight' : 'ArrowDown';

        this.keyboardInstance = new Keyboard({
            target: this.el,
            onKeyDown: (e: KeyboardEvent) => {
                if (e.key === prevKey) {
                    e.preventDefault();
                    this.step(-1);
                } else if (e.key === nextKey) {
                    e.preventDefault();
                    this.step(+1);
                }
            },
        });
    }

    /**
     * Avance ou recule dans la liste (cycle)
     * @param delta - -1 précédent, +1 suivant
     */
    private step(delta: number): void {
        if (this.options.list.length === 0) {
            HapticManager.triggerFromOptions(this.options, 'medium');
            this.options.onChange?.('', this.idx, this);
            return;
        }
        this.idx = this.clampIndex(this.idx + delta);
        HapticManager.triggerFromOptions(this.options, 'medium');
        this.options.onChange?.(this.value, this.idx, this);
    }

    /** Passe à l'élément précédent */
    prev(): void {
        this.step(-1);
    }

    /** Passe à l'élément suivant */
    next(): void {
        this.step(+1);
    }

    /**
     * Définit l'index courant
     * @param index - Nouvel index
     */
    setIndex(index: number): void {
        this.idx = this.clampIndex(index);
        this.options.onChange?.(this.value, this.idx, this);
    }

    /**
     * Change la variante visuelle
     * @param variant - filled | tonal | outlined
     */
    setVariant(variant: ButtonArrowOptions['variant']): void {
        this.options.variant = variant;
        this.applyClasses();
    }

    /**
     * Change l'orientation (reconstruit le DOM des icônes)
     * @param direction - horizontal | vertical
     */
    setDirection(direction: ButtonArrowOptions['direction']): void {
        this.options.direction = direction;
        this.applyClasses();
        this.buildDom();
        this.keyboardInstance?.destroy();
        this.keyboardInstance = null;
        this.attachEventListeners();
        IconManager.processIconsInContainer(this.el);
        IconManager.forceDisplayIcons();
    }

    /**
     * Remplace la liste de valeurs
     * @param list - Nouvelle liste
     * @param resetIndex - Remettre l'index à 0
     */
    setList(list: string[], resetIndex = true): void {
        this.options.list = [...list];
        if (resetIndex) this.idx = 0;
        else this.idx = this.clampIndex(this.idx);
    }

    override destroy(): void {
        if (this.options.onCloseStart) this.options.onCloseStart(this.el);

        this.keyboardInstance?.destroy();
        this.keyboardInstance = null;
        this.btnA = null;
        this.btnB = null;
        delete (this.el as KButtonArrowHTMLElement).K_ButtonArrow;

        if (this.options.onCloseEnd) this.options.onCloseEnd(this.el);
        this.logger.info('ButtonArrow destroyed');
        super.destroy();
    }
}

if (typeof customElements !== 'undefined' && !customElements.get('k3ui-button-arrow')) {
    class K3UIButtonArrowElement extends HTMLElement {
        connectedCallback(): void {
            if (!ButtonArrow.getInstance(this)) {
                ButtonArrow.init(this);
            }
        }
    }
    customElements.define('k3ui-button-arrow', K3UIButtonArrowElement);
}
