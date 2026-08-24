/**
 * @fileoverview Composant ButtonPad pour K3UI
 * @description Pad 4 directions Material Design 3 Expressive — cardinal (45°) / diagonal (0°)
 * @see https://m3.material.io/components/buttons/overview
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { toComponentClassDef } from '../types/components/component-base';
import type { ButtonPadOptions } from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { setAriaAttributes, setAriaAttribute } from '../utils/dom/aria';
import { LoggerManager } from '../core/managers';
import { ManagerFactory } from '../core/factories';
import {
    getButtonPadDefaults,
    ButtonPadSpecs,
    BUTTON_PAD_CHEVRON_PATHS,
    buttonPadChevronSVG,
    type ButtonPadCellDef,
    type ButtonPadDirection,
} from '../specs/components/button-pad.specs';
import { Keyboard } from '../core/managers/KeyboardManager';
import { HapticManager } from '../core/managers/HapticManager';

interface KButtonPadHTMLElement extends HTMLElement {
    K_ButtonPad?: ButtonPad;
}

const _defaults: ButtonPadOptions = getButtonPadDefaults();

const VARIANTS: ButtonPadOptions['variant'][] = ['filled', 'tonal', 'outlined'];
const MODES: ButtonPadOptions['mode'][] = ['cardinal', 'diagonal'];

/**
 * Classe ButtonPad pour K3UI
 * @description Grille 2×2 de boutons directionnels (cardinal roté 45° ou diagonal à 0°)
 */
export class ButtonPad extends Component<ButtonPadOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;
    private logger: LoggerManager;
    private buttons: Map<ButtonPadDirection, HTMLButtonElement> = new Map();
    private keyboardInstance: Keyboard | null = null;

    static get defaults(): ButtonPadOptions {
        return { ..._defaults };
    }

    /**
     * Retourne l'instance ButtonPad attachée à un élément
     * @param el - Élément hôte
     */
    static getInstance(el: HTMLElement): ButtonPad | null {
        return (el as KButtonPadHTMLElement).K_ButtonPad ?? null;
    }

    /**
     * Initialise ButtonPad sur un ou plusieurs éléments
     * @param els - Élément(s) ou sélecteur
     * @param options - Options partielles
     */
    static init(
        els: KElement | InitElements<KElement> | string,
        options: Partial<ButtonPadOptions> = {}
    ): ButtonPad[] {
        return Component.init(els, options, toComponentClassDef(ButtonPad)) as ButtonPad[];
    }

    constructor(el: HTMLElement, options: Partial<ButtonPadOptions> = {}) {
        super(el, options, toComponentClassDef(ButtonPad));
        this.logger = ManagerFactory.getLoggerManager('[ButtonPad]');

        const fromHtml = ButtonPad.readAttributes(el);
        this.options = {
            ...ButtonPad.defaults,
            ...options,
            ...fromHtml,
        } as ButtonPadOptions;

        (el as KButtonPadHTMLElement).K_ButtonPad = this;
        this.init();
    }

    /**
     * Lit les attributs data-* / classes HTML
     * @param el - Élément hôte
     */
    private static readAttributes(el: HTMLElement): Partial<ButtonPadOptions> {
        const out: Partial<ButtonPadOptions> = {};
        const get = (dataName: string, plainName?: string) =>
            el.getAttribute(`data-${dataName}`) ?? (plainName ? el.getAttribute(plainName) : null);

        const mode = get('mode') ?? get('rot');
        if (mode === 'cardinal' || mode === '45') {
            out.mode = 'cardinal';
        } else if (mode === 'diagonal' || mode === '0') {
            out.mode = 'diagonal';
        } else if (el.classList.contains('btn-pad--cardinal') || el.classList.contains('button-pad--cardinal')) {
            out.mode = 'cardinal';
        } else if (el.classList.contains('btn-pad--diagonal') || el.classList.contains('button-pad--diagonal')) {
            out.mode = 'diagonal';
        }

        const variant = get('variant', 'variant') ?? get('v');
        if (variant === 'filled' || variant === 'tonal' || variant === 'outlined') {
            out.variant = variant;
        } else {
            for (const v of VARIANTS) {
                if (el.classList.contains(`btn-pad--${v}`) || el.classList.contains(`button-pad--${v}`)) {
                    out.variant = v;
                    break;
                }
            }
        }

        return out;
    }

    private init(): void {
        if (this.options.onOpenStart) this.options.onOpenStart(this.el);

        this.applyClasses();
        this.setupAccessibility();

        const hasExisting = this.el.querySelector('.btn-pad__btn, .button-pad__btn');
        if (hasExisting) {
            this.collectExistingButtons();
        } else {
            this.buildDom();
        }

        this.attachEventListeners();

        if (this.options.onOpenEnd) this.options.onOpenEnd(this.el);
        this.logger.info('ButtonPad initialized');
    }

    private applyClasses(): void {
        if (!this.el.classList.contains('btn-pad') && !this.el.classList.contains('button-pad')) {
            this.el.classList.add('btn-pad');
        }

        for (const m of MODES) {
            this.el.classList.remove(`btn-pad--${m}`, `button-pad--${m}`);
        }
        for (const v of VARIANTS) {
            this.el.classList.remove(`btn-pad--${v}`, `button-pad--${v}`);
        }

        const { mode, variant } = this.options;
        this.el.classList.add(`btn-pad--${mode}`, `button-pad--${mode}`);

        if (variant === 'tonal') {
            this.el.classList.add('btn-pad--tonal', 'button-pad--tonal');
        } else if (variant === 'outlined') {
            this.el.classList.add('btn-pad--outlined', 'button-pad--outlined');
        } else {
            this.el.classList.add('btn-pad--filled', 'button-pad--filled');
        }

        this.el.setAttribute('data-mode', mode);
        this.el.setAttribute('data-variant', variant);
        if (mode === 'cardinal') {
            this.el.setAttribute('data-rot', '45');
        } else {
            this.el.removeAttribute('data-rot');
        }
    }

    private setupAccessibility(): void {
        setAriaAttributes(this.el, { role: ButtonPadSpecs.accessibility.role });
        if (!this.el.hasAttribute('tabindex')) {
            this.el.setAttribute('tabindex', '0');
        }
    }

    private getCells(): ButtonPadCellDef[] {
        return this.options.mode === 'cardinal'
            ? ButtonPadSpecs.cardinalCells
            : ButtonPadSpecs.diagonalCells;
    }

    private buildDom(): void {
        this.el.innerHTML = '';
        this.buttons.clear();

        for (const cell of this.getCells()) {
            const btn = this.createCellButton(cell);
            this.el.appendChild(btn);
            this.buttons.set(cell.direction, btn);
        }
    }

    private collectExistingButtons(): void {
        this.buttons.clear();
        for (const cell of this.getCells()) {
            const btn = this.el.querySelector(
                `.btn-pad__btn--${cell.position}, .button-pad__btn--${cell.position}`
            ) as HTMLButtonElement | null;
            if (btn) {
                this.buttons.set(cell.direction, btn);
                if (!btn.getAttribute('aria-label')) {
                    setAriaAttribute(btn, 'label', cell.label);
                }
            }
        }
    }

    /**
     * Crée un bouton de cellule avec SVG chevron Material
     * @param cell - Définition de la cellule
     */
    private createCellButton(cell: ButtonPadCellDef): HTMLButtonElement {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className =
            `btn-pad__btn btn-pad__btn--${cell.position} ` +
            `button-pad__btn button-pad__btn--${cell.position}`;
        setAriaAttribute(btn, 'label', cell.label);
        btn.dataset.direction = cell.direction;
        btn.innerHTML = buttonPadChevronSVG(
            BUTTON_PAD_CHEVRON_PATHS[cell.icon],
            cell.iconRotation
        );
        return btn;
    }

    private attachEventListeners(): void {
        for (const [direction, btn] of this.buttons) {
            this.registerEvent(btn, 'click', (e: Event) => {
                e.preventDefault();
                this.navigate(direction);
            });
        }

        const keyMap: Record<string, ButtonPadDirection> =
            this.options.mode === 'cardinal'
                ? {
                      ArrowUp: 'up',
                      ArrowRight: 'right',
                      ArrowDown: 'down',
                      ArrowLeft: 'left',
                  }
                : {
                      Home: 'nw',
                      PageUp: 'ne',
                      End: 'sw',
                      PageDown: 'se',
                  };

        this.keyboardInstance = new Keyboard({
            target: this.el,
            onKeyDown: (e: KeyboardEvent) => {
                const dir = keyMap[e.key];
                if (dir) {
                    e.preventDefault();
                    this.navigate(dir);
                }
            },
        });
    }

    /**
     * Émet une navigation dans une direction
     * @param direction - Direction cardinale ou diagonale
     */
    navigate(direction: ButtonPadDirection): void {
        HapticManager.triggerFromOptions(this.options, 'medium');
        this.options.onNavigate?.(direction, this);
    }

    /**
     * Change la variante visuelle
     * @param variant - filled | tonal | outlined
     */
    setVariant(variant: ButtonPadOptions['variant']): void {
        this.options.variant = variant;
        this.applyClasses();
    }

    /**
     * Change le mode (reconstruit le DOM)
     * @param mode - cardinal | diagonal
     */
    setMode(mode: ButtonPadOptions['mode']): void {
        this.options.mode = mode;
        this.applyClasses();
        this.buildDom();
        this.keyboardInstance?.destroy();
        this.keyboardInstance = null;
        this.attachEventListeners();
    }

    override destroy(): void {
        if (this.options.onCloseStart) this.options.onCloseStart(this.el);

        this.keyboardInstance?.destroy();
        this.keyboardInstance = null;
        this.buttons.clear();
        delete (this.el as KButtonPadHTMLElement).K_ButtonPad;

        if (this.options.onCloseEnd) this.options.onCloseEnd(this.el);
        this.logger.info('ButtonPad destroyed');
        super.destroy();
    }
}

if (typeof customElements !== 'undefined' && !customElements.get('k3ui-button-pad')) {
    class K3UIButtonPadElement extends HTMLElement {
        connectedCallback(): void {
            if (!ButtonPad.getInstance(this)) {
                ButtonPad.init(this);
            }
        }
    }
    customElements.define('k3ui-button-pad', K3UIButtonPadElement);
}
