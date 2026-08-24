/**
 * @fileoverview Composant ButtonSplit pour K3UI
 * @description Split Button Material Design 3 Expressive — bouton principal + trailing (chevron/arrow/ellipsis), gap 3dp
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import type { ButtonSplitOptions } from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { setAriaAttributes } from '../utils/dom/aria';
import { LoggerManager, IconManager } from '../core/managers';
import { ManagerFactory } from '../core/factories';
import { getButtonSplitDefaults, ButtonSplitSpecs } from '../specs/components/button-split.specs';
import { getPointerPressReleaseBindings } from '../utils/dom/pointer';
import { Menu } from './Menu';

interface KButtonSplitHTMLElement extends HTMLElement {
    K_ButtonSplit?: ButtonSplit;
}

const _defaults: ButtonSplitOptions = getButtonSplitDefaults();

/**
 * Classe ButtonSplit pour K3UI
 * @description Split button M3 Expressive : main (icône + label) + trailing (chevron/arrow), spec 5 tailles, 4 variantes
 */
export class ButtonSplit extends Component<ButtonSplitOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;
    private logger: LoggerManager;
    private leadingButton: HTMLButtonElement | null = null;
    private trailingButton: HTMLButtonElement | null = null;
    private expanded: boolean = false;
    private outsideClickCleanup: (() => void) | null = null;

    static get defaults(): ButtonSplitOptions {
        return { ..._defaults };
    }

    static getInstance(el: HTMLElement): ButtonSplit | null {
        return (el as KButtonSplitHTMLElement).K_ButtonSplit ?? null;
    }

    static init(
        els: KElement | InitElements<KElement> | string,
        options: Partial<ButtonSplitOptions> = {}
    ): ButtonSplit[] {
        return Component.init(els, options, toComponentClassDef(ButtonSplit)) as ButtonSplit[];
    }

    constructor(el: HTMLElement, options: Partial<ButtonSplitOptions> = {}) {
        super(el, options, toComponentClassDef(ButtonSplit));
        this.logger = ManagerFactory.getLoggerManager('[ButtonSplit]');

        const fromHtml = ButtonSplit.readAttributes(el);
        this.options = {
            ...ButtonSplit.defaults,
            ...options,
            ...fromHtml,
        } as ButtonSplitOptions;

        (el as KButtonSplitHTMLElement).K_ButtonSplit = this;
        this.init();
    }

    private static readAttributes(el: HTMLElement): Partial<ButtonSplitOptions> {
        const out: Partial<ButtonSplitOptions> = {};
        const get = (dataName: string, plainName?: string) =>
            el.getAttribute(`data-${dataName}`) ?? (plainName ? el.getAttribute(plainName) : null);

        const label = get('label', 'label');
        if (label != null) out.label = label;

        const v = get('variant', 'variant');
        if (v === 'filled' || v === 'tonal' || v === 'outlined' || v === 'elevated') out.variant = v;

        const s = get('size', 'size');
        if (s === 'xs' || s === 'sm' || s === 'md' || s === 'lg' || s === 'xl') out.size = s;

        const sh = get('shape', 'shape');
        if (sh === 'rounded' || sh === 'square') out.shape = sh;

        const it = get('icon-type', 'iconType');
        if (it === 'chevron' || it === 'arrow' || it === 'ellipsis') out.iconType = it;

        const li = get('leading-icon', 'leadingIcon');
        if (li != null) out.leadingIcon = li;

        return out;
    }

    private init(): void {
        this.el.classList.add('split-btn', 'split-button', 'button-split');
        this.el.classList.add(`split-btn--${this.options.variant}`, `split-button--${this.options.variant}`, `button-split--${this.options.variant}`);
        this.el.classList.add(`split-btn--${this.options.size}`, `split-button--${this.options.size}`, `button-split--${this.options.size}`);
        this.el.classList.add(`split-btn--${this.options.shape}`, `split-button--${this.options.shape}`, `button-split--${this.options.shape}`);
        this.el.classList.add(`split-btn--${this.options.iconType}`, `split-button--${this.options.iconType}`, `button-split--${this.options.iconType}`);
        setAriaAttributes(this.el, { role: 'group' });

        const hasExisting = this.el.querySelector('.split-btn__leading, .split-button__leading');
        if (hasExisting) {
            this.leadingButton = this.el.querySelector('.split-btn__leading, .split-button__leading') as HTMLButtonElement;
            this.trailingButton = this.el.querySelector('.split-btn__trailing, .split-button__trailing') as HTMLButtonElement;
            if (this.leadingButton) this.syncLeadingContent();
            if (this.trailingButton) this.syncTrailingIcon();
        } else {
            this.buildDom();
        }

        const labelText = this.options.label?.trim() ?? this.leadingButton?.querySelector('.button-split__label')?.textContent?.trim() ?? '';
        if (!labelText) {
            this.el.classList.add('split-btn--icon-only', 'split-button--icon-only', 'button-split--icon-only');
        }

        this.attachEvents();

        this.syncLeadingIconClass();

        if (this.leadingButton || this.trailingButton) {
            IconManager.processIconsInContainer(this.el);
            IconManager.forceDisplayIcons();
        }

        this.logger.info('ButtonSplit initialized');
    }

    /** Indique si une icône leading valide est configurée (attribut vide = absent). */
    private hasLeadingIcon(): boolean {
        const icon = this.options.leadingIcon;
        return typeof icon === 'string' && icon.trim().length > 0;
    }

    /** Applique la classe `--no-leading-icon` quand le segment leading n'a pas d'icône. */
    private syncLeadingIconClass(): void {
        const noLeading = !this.hasLeadingIcon();
        const classes = [
            'split-btn--no-leading-icon',
            'split-button--no-leading-icon',
            'button-split--no-leading-icon',
        ] as const;
        classes.forEach((cls) => this.el.classList.toggle(cls, noLeading));
    }

    /** Crée le span d'icône leading avec le nom d'icône courant. */
    private createLeadingIconSpan(): HTMLSpanElement {
        const leadingIconSpan = document.createElement('span');
        leadingIconSpan.className = 'button-split__icon button-split__icon--leading';
        const leadingIconEl = document.createElement('i');
        leadingIconEl.className = 'k3ui-icon';
        leadingIconEl.setAttribute('name', this.options.leadingIcon!.trim());
        leadingIconEl.setAttribute('aria-hidden', 'true');
        leadingIconSpan.appendChild(leadingIconEl);
        return leadingIconSpan;
    }

    private buildDom(): void {
        this.el.innerHTML = '';

        const leading = document.createElement('button');
        leading.type = 'button';
        leading.className = 'split-btn__leading split-button__leading button-split__leading';
        const leadingLabel = (this.options.label ?? '').trim() || ButtonSplitSpecs.accessibility.leadingAriaLabelDefault;
        leading.setAttribute('aria-label', leadingLabel);

        const labelSpan = document.createElement('span');
        labelSpan.className = 'button-split__label';
        labelSpan.textContent = this.options.label;

        if (this.hasLeadingIcon()) {
            leading.appendChild(this.createLeadingIconSpan());
        }
        leading.appendChild(labelSpan);

        const trailing = document.createElement('button');
        trailing.type = 'button';
        trailing.className = 'split-btn__trailing split-button__trailing button-split__trailing';
        trailing.setAttribute('aria-label', ButtonSplitSpecs.accessibility.trailingAriaLabelExpand);
        trailing.setAttribute('aria-haspopup', 'true');
        trailing.setAttribute('aria-expanded', 'false');

        const trailingIconSpan = document.createElement('span');
        trailingIconSpan.className = 'button-split__icon button-split__icon--trailing';
        const trailingIconEl = document.createElement('i');
        trailingIconEl.className = 'k3ui-icon';
        trailingIconEl.setAttribute('name', ButtonSplit.getTrailingIconName(this.options.iconType));
        trailingIconEl.setAttribute('aria-hidden', 'true');
        trailingIconSpan.appendChild(trailingIconEl);
        trailing.appendChild(trailingIconSpan);

        this.el.appendChild(leading);
        this.el.appendChild(trailing);
        this.leadingButton = leading;
        this.trailingButton = trailing;
    }

    private syncLeadingContent(): void {
        if (!this.leadingButton) return;
        const labelEl = this.leadingButton.querySelector('.button-split__label');
        if (labelEl) labelEl.textContent = this.options.label;

        let iconSpan = this.leadingButton.querySelector(
            '.button-split__icon--leading'
        ) as HTMLSpanElement | null;

        if (this.hasLeadingIcon()) {
            if (!iconSpan) {
                iconSpan = this.createLeadingIconSpan();
                this.leadingButton.insertBefore(iconSpan, labelEl);
            } else {
                const iconEl = iconSpan.querySelector('.k3ui-icon');
                if (iconEl) iconEl.setAttribute('name', this.options.leadingIcon!.trim());
            }
            IconManager.processIconsInContainer(iconSpan);
        } else if (iconSpan) {
            iconSpan.remove();
        }

        this.syncLeadingIconClass();

        // Ne pas écraser un aria-label existant par une chaîne vide (a11y)
        const label = (this.options.label ?? '').trim();
        if (label) this.leadingButton.setAttribute('aria-label', label);
    }

    /**
     * Nom d’icône trailing selon iconType (chevron | arrow | ellipsis).
     * @param iconType - Type d’icône trailing
     */
    private static getTrailingIconName(iconType: ButtonSplitOptions['iconType']): string {
        const { trailingIconArrow, trailingIconChevron, trailingIconEllipsis } = ButtonSplitSpecs.behaviors;
        switch (iconType) {
            case 'arrow':
                return trailingIconArrow;
            case 'ellipsis':
                return trailingIconEllipsis;
            default:
                return trailingIconChevron;
        }
    }

    private syncTrailingIcon(): void {
        if (!this.trailingButton) return;
        const iconEl = this.trailingButton.querySelector('.k3ui-icon');
        if (iconEl) {
            iconEl.setAttribute('name', ButtonSplit.getTrailingIconName(this.options.iconType));
        }
    }

    private attachEvents(): void {
        if (this.leadingButton) {
            this.registerEvent(this.leadingButton, 'click', (e: Event) => {
                e.preventDefault();
                this.closeLinkedMenu();
                if (this.expanded) {
                    this.closeTrailing();
                }
                if (this.options.onMainClick) this.options.onMainClick(this);
            });
        }

        if (this.trailingButton) {
            const trailing = this.trailingButton;
            const activeClasses = ['split-btn__trailing--active', 'split-button__trailing--active'] as const;
            const setActive = (active: boolean): void => {
                activeClasses.forEach((cls) => trailing.classList.toggle(cls, active));
            };
            getPointerPressReleaseBindings(trailing, {
                onPress: () => setActive(true),
                onRelease: () => setActive(false),
                onDocumentRelease: () => setActive(false),
            }).forEach(({ target, type, handler, options }) => {
                this.registerEvent(target, type, handler, options);
            });
            this.registerEvent(this.trailingButton, 'click', (e: Event) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleTrailing();
            });
        }
    }

    private toggleTrailing(): void {
        this.expanded = !this.expanded;

        if (this.trailingButton) {
            this.trailingButton.setAttribute('aria-expanded', String(this.expanded));
            this.trailingButton.setAttribute(
                'aria-label',
                this.expanded
                    ? ButtonSplitSpecs.accessibility.trailingAriaLabelCollapse
                    : ButtonSplitSpecs.accessibility.trailingAriaLabelExpand
            );
            this.trailingButton.classList.toggle('split-btn__trailing--expanded', this.expanded);
            this.trailingButton.classList.toggle('split-button__trailing--expanded', this.expanded);
        }

        if (this.options.onTrailingClick) this.options.onTrailingClick(this, this.expanded);

        if (this.expanded) {
            if (this.options.onOpenStart) this.options.onOpenStart(this.el);
            this.attachOutsideClickHandler();
            setTimeout(() => {
                if (this.options.onOpenEnd) this.options.onOpenEnd(this.el);
            }, 100);
        } else {
            if (this.options.onCloseStart) this.options.onCloseStart(this.el);
            this.detachOutsideClickHandler();
            setTimeout(() => {
                if (this.options.onCloseEnd) this.options.onCloseEnd(this.el);
            }, 100);
        }
    }

    private attachOutsideClickHandler(): void {
        this.detachOutsideClickHandler();
        const handler = (event: MouseEvent) => {
            const target = event.target as Node;
            if (this.el.contains(target)) return;
            const menuId = this.trailingButton?.getAttribute('aria-controls');
            if (menuId) {
                const menu = document.getElementById(menuId);
                if (menu?.contains(target)) return;
            }
            this.closeTrailing();
        };
        setTimeout(() => {
            this.outsideClickCleanup = this.registerEvent(document, 'click', handler, true);
        }, 0);
    }

    private detachOutsideClickHandler(): void {
        if (this.outsideClickCleanup) {
            this.outsideClickCleanup();
            this.outsideClickCleanup = null;
        }
    }

    /**
     * Ferme le menu Select lié (navbar thème, etc.) via data-target du trailing.
     * @private
     */
    private closeLinkedMenu(): void {
        if (!this.trailingButton) return;

        const menuId =
            this.trailingButton.getAttribute('data-target') ??
            this.trailingButton.getAttribute('aria-controls');
        if (menuId) {
            const menuEl = document.getElementById(menuId);
            const menu = menuEl ? Menu.getInstance(menuEl) : undefined;
            if (menu?.isOpen) {
                menu.close();
            }
            return;
        }

        const menuList = this.el.parentElement?.querySelector(
            'ul.menu-content, ul.select-menu, .menu-content'
        ) as HTMLElement | null;
        if (menuList) {
            const menu = Menu.getInstance(menuList);
            if (menu?.isOpen) {
                menu.close();
            }
        }
    }

    /** Ferme le menu trailing */
    closeTrailing(): void {
        if (!this.expanded) return;
        this.expanded = false;
        if (this.trailingButton) {
            this.trailingButton.setAttribute('aria-expanded', 'false');
            this.trailingButton.setAttribute('aria-label', ButtonSplitSpecs.accessibility.trailingAriaLabelExpand);
            this.trailingButton.classList.remove('split-btn__trailing--expanded', 'split-button__trailing--expanded');
        }
        if (this.options.onCloseStart) this.options.onCloseStart(this.el);
        this.detachOutsideClickHandler();
        this.closeLinkedMenu();
        setTimeout(() => {
            if (this.options.onCloseEnd) this.options.onCloseEnd(this.el);
        }, 100);
    }

    /** Retourne true si le menu trailing est ouvert */
    isExpanded(): boolean {
        return this.expanded;
    }

    public override destroy(): void {
        this.detachOutsideClickHandler();
        this.leadingButton = null;
        this.trailingButton = null;
        if ((this.el as KButtonSplitHTMLElement).K_ButtonSplit === this) {
            delete (this.el as KButtonSplitHTMLElement).K_ButtonSplit;
        }
        this.logger.info('ButtonSplit destroyed');
        super.destroy();
    }
}

/**
 * Custom Element <k3ui-button-split>
 * @description Permet l'utilisation de <k3ui-button-split> dans le HTML. Initialisation par AutoInit.
 */
if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-button-split')) {
    customElements.define('k3ui-button-split', class K3UIButtonSplitElement extends HTMLElement {
        private buttonSplitInstance: ButtonSplit | null = null;

        connectedCallback(): void {
            if (!this.hasAttribute('data-initialized')) {
                this.setAttribute('data-initialized', 'true');
            }
        }

        disconnectedCallback(): void {
            if (this.buttonSplitInstance) {
                this.buttonSplitInstance.destroy();
                this.buttonSplitInstance = null;
            }
        }
    });
}
