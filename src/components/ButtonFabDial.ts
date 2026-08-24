/**
 * @fileoverview Composant ButtonFabDial pour K3UI
 * @description FAB Speed Dial en éventail (flower) ou colonne (vertical) — M3 Expressive
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { toComponentClassDef } from '../types/components/component-base';
import type { ButtonFabDialOptions, ButtonFabSpeedDialItem } from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { setAriaAttributes } from '../utils/dom/aria';
import { LoggerManager, LocaleManager, IconManager } from '../core/managers';
import { ManagerFactory } from '../core/factories';
import { getButtonFabDialDefaults, ButtonFabDialSpecs } from '../specs/components/button-fab-dial.specs';
import { ButtonFab } from './ButtonFab';
import { HapticManager } from '../core/managers/HapticManager';
import {
    computeFabDialOffsets,
    computeFabDialIconRotation,
} from '../utils/fab/dial-geometry';
import {
    applyFabCornerPosition,
    attachFabRipple,
    bindFabPressHandlers,
    createFabActionButton,
    updateFabSpeedDialTriggerIcon,
} from '../utils/fab/speed-dial-helpers';
import type { Ripple } from '../utils/effects/ripple';

interface KButtonFabDialHTMLElement extends HTMLElement {
    K_ButtonFabDial?: ButtonFabDial;
}

const _defaults: ButtonFabDialOptions = getButtonFabDialDefaults();

export class ButtonFabDial extends Component<ButtonFabDialOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;
    private logger: LoggerManager;
    private scrim: HTMLButtonElement | null = null;
    private menuEl: HTMLDivElement | null = null;
    private fabButton: HTMLButtonElement | null = null;
    private fabWrapper: HTMLDivElement | null = null;
    private iconRotator: HTMLElement | null = null;
    private fabInstance: ButtonFab | null = null;
    private open = false;
    private ripples: Ripple[] = [];
    private openEndTimeout: ReturnType<typeof setTimeout> | null = null;

    static get defaults(): ButtonFabDialOptions {
        return { ..._defaults };
    }

    static getInstance(el: HTMLElement): ButtonFabDial | null {
        return (el as KButtonFabDialHTMLElement).K_ButtonFabDial ?? null;
    }

    static init(
        els: KElement | InitElements<KElement> | string,
        options: Partial<ButtonFabDialOptions> = {}
    ): ButtonFabDial[] {
        return Component.init(els, options, toComponentClassDef(ButtonFabDial)) as ButtonFabDial[];
    }

    constructor(el: HTMLElement, options: Partial<ButtonFabDialOptions> = {}) {
        super(el, options, toComponentClassDef(ButtonFabDial));
        this.logger = ManagerFactory.getLoggerManager('[ButtonFabDial]');

        const fromHtml = ButtonFabDial.readAttributes(el);
        this.options = {
            ...ButtonFabDial.defaults,
            ...options,
            ...fromHtml,
        } as ButtonFabDialOptions;

        (el as KButtonFabDialHTMLElement).K_ButtonFabDial = this;
        this.init();
    }

    private static readAttributes(el: HTMLElement): Partial<ButtonFabDialOptions> {
        const out: Partial<ButtonFabDialOptions> = {};
        const get = (name: string) => el.getAttribute('data-' + name);

        const pos = get('position');
        if (pos === 'bottom-right' || pos === 'bottom-left' || pos === 'top-right' || pos === 'top-left') {
            out.position = pos;
        }
        const layout = get('layout');
        if (layout === 'flower' || layout === 'vertical') out.layout = layout;
        const icon = get('fab-icon');
        if (icon != null) out.fabIcon = icon;
        if (el.hasAttribute('data-fixed')) out.fixed = true;
        if (el.getAttribute('data-fixed') === 'false') out.fixed = false;
        if (el.hasAttribute('data-show-labels')) out.showLabels = true;
        return out;
    }

    private init(): void {
        this.el.classList.add('button-fab-dial');
        if (!this.options.fixed) {
            this.el.classList.add('button-fab-dial--static');
        }

        this.applyRootStyles();
        this.buildDom();
        this.attachEvents();
        this.updateOpenState(false);
        IconManager.processIconsInContainer(this.el);
        this.logger.info('ButtonFabDial initialized');
    }

    private getVisibleItems(): ButtonFabSpeedDialItem[] {
        const items = this.options.items ?? [];
        const max = ButtonFabDialSpecs.behaviors.maxFlowerActions;
        if (this.options.layout === 'flower' && items.length > max) {
            this.logger.warn(
                `ButtonFabDial : ${items.length} actions, ${max} affichées. Passez en layout="vertical" pour en montrer plus.`
            );
            return items.slice(0, max);
        }
        return items;
    }

    private applyRootStyles(): void {
        const { triggerSize, actionSize, position, inset, fixed } = this.options;
        applyFabCornerPosition(this.el, position, inset, fixed);
        this.el.style.setProperty('--button-fab-dial-size', `${triggerSize}px`);
        this.el.style.setProperty('--button-fab-dial-item-size', `${actionSize}px`);
        this.el.style.setProperty('--button-fab-dial-rotate', `${computeFabDialIconRotation(position)}deg`);
        if (position.endsWith('left')) {
            this.el.classList.add('button-fab-dial--left');
        }
        if (this.options.mainAction) {
            this.el.setAttribute('data-has-main', 'true');
        }
    }

    private buildDom(): void {
        this.el.innerHTML = '';
        const items = this.getVisibleItems();

        if (this.options.scrim) {
            const scrim = document.createElement('button');
            scrim.type = 'button';
            scrim.className = 'button-fab-dial__scrim';
            scrim.tabIndex = -1;
            setAriaAttributes(scrim, { 'aria-hidden': 'true' });
            this.el.appendChild(scrim);
            this.scrim = scrim;
        }

        const menu = document.createElement('div');
        menu.className = 'button-fab-dial__menu';
        menu.setAttribute('role', ButtonFabDialSpecs.accessibility.menuRole);
        this.menuEl = menu;

        const offsets = computeFabDialOffsets({
            count: items.length,
            layout: this.options.layout,
            position: this.options.position,
            radius: this.options.radius ?? null,
            gap: this.options.gap,
            spread: this.options.spread,
            triggerSize: this.options.triggerSize,
            actionSize: this.options.actionSize,
            minGap: this.options.minGap,
        });

        items.forEach((item, i) => {
            const delayIn = i * ButtonFabDialSpecs.behaviors.staggerEnterMs;
            const delayOut = (items.length - 1 - i) * ButtonFabDialSpecs.behaviors.staggerExitMs;
            const wrap = document.createElement('div');
            wrap.className = 'button-fab-dial__item';
            wrap.style.setProperty('--button-fab-dial-x', `${offsets[i]?.x ?? 0}px`);
            wrap.style.setProperty('--button-fab-dial-y', `${offsets[i]?.y ?? 0}px`);
            wrap.style.setProperty('--button-fab-dial-delay-in', `${delayIn}ms`);
            wrap.style.setProperty('--button-fab-dial-delay-out', `${delayOut}ms`);

            if (this.options.showLabels && this.options.layout === 'vertical') {
                const label = document.createElement('span');
                label.className = 'button-fab-dial__label';
                label.textContent = item.label;
                setAriaAttributes(label, { 'aria-hidden': 'true' });
                wrap.appendChild(label);
            }

            const btn = createFabActionButton(
                item,
                'button-fab-dial__action',
                ButtonFabDialSpecs.accessibility.itemRole
            );
            wrap.appendChild(btn);
            menu.appendChild(wrap);
            const ripple = attachFabRipple(btn);
            if (ripple) this.ripples.push(ripple);
        });

        this.el.appendChild(menu);

        const slot = document.createElement('div');
        slot.className = 'button-fab-dial__slot';

        const triggerWrap = document.createElement('div');
        triggerWrap.className = 'button-fab-dial__trigger-wrap';

        const fabWrapper = document.createElement('div');
        fabWrapper.className = 'button-fab no-autoinit button-fab-dial__trigger';
        this.fabWrapper = fabWrapper;
        fabWrapper.setAttribute('data-mode', 'fab');
        fabWrapper.setAttribute('data-size', 'small');
        fabWrapper.setAttribute('data-variant', 'primary');
        fabWrapper.setAttribute('data-icon', this.options.fabIcon ?? 'add');
        triggerWrap.appendChild(fabWrapper);

        const fabResult = ButtonFab.init(fabWrapper, {});
        this.fabInstance = (Array.isArray(fabResult) ? fabResult[0] : fabResult) ?? null;

        const iconWrap = fabWrapper.querySelector('.button-fab__icon');
        if (iconWrap) {
            iconWrap.innerHTML = '';
            const rotator = document.createElement('span');
            rotator.className = 'button-fab-dial__icon-rotator';
            this.iconRotator = rotator;
            const iconPlus = document.createElement('span');
            const iPlus = document.createElement('i');
            iPlus.className = 'k3ui-icon';
            iPlus.setAttribute('name', this.options.fabIcon ?? 'add');
            setAriaAttributes(iPlus, { 'aria-hidden': 'true' });
            iconPlus.appendChild(iPlus);
            rotator.appendChild(iconPlus);
            iconWrap.appendChild(rotator);
        }

        this.fabButton = fabWrapper.querySelector('.button-fab__btn');
        if (this.fabButton) {
            setAriaAttributes(this.fabButton, {
                'aria-expanded': 'false',
                'aria-haspopup': 'menu',
                'aria-label': LocaleManager.t('buttonFabDial.ariaOpen'),
            });
            bindFabPressHandlers(this.fabButton);
        }

        slot.appendChild(triggerWrap);

        if (this.options.mainAction) {
            const main = this.options.mainAction;
            const mainBtn = document.createElement('button');
            mainBtn.type = 'button';
            mainBtn.className = 'button-fab-dial__main ripple';
            setAriaAttributes(mainBtn, { 'aria-label': main.label });
            mainBtn.title = main.label;
            const iconEl = document.createElement('i');
            iconEl.className = 'k3ui-icon';
            iconEl.setAttribute('name', main.icon ?? 'edit');
            if (main.iconType) iconEl.setAttribute('type', main.iconType);
            setAriaAttributes(iconEl, { 'aria-hidden': 'true' });
            mainBtn.appendChild(iconEl);
            bindFabPressHandlers(mainBtn);
            slot.appendChild(mainBtn);
            const ripple = attachFabRipple(mainBtn);
            if (ripple) this.ripples.push(ripple);
        }

        this.el.appendChild(slot);
    }

    private attachEvents(): void {
        if (this.fabButton) {
            this.registerEvent(this.fabButton, 'click', (e: Event) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggle();
            });
        }

        if (this.scrim) {
            this.registerEvent(this.scrim, 'click', () => this.closeDial());
        }

        this.el.querySelectorAll('.button-fab-dial__action:not(.button-fab-dial__main)').forEach((btn) => {
            this.registerEvent(btn, 'click', (e: Event) => {
                e.preventDefault();
                const id = (btn as HTMLElement).getAttribute('data-id');
                const item = this.getVisibleItems().find((i) => i.id === id);
                if (item && this.options.onItemClick) {
                    this.options.onItemClick(item, this);
                }
                this.closeDial();
            });
        });

        const mainBtn = this.el.querySelector('.button-fab-dial__main');
        if (mainBtn && this.options.mainAction) {
            this.registerEvent(mainBtn, 'click', (e: Event) => {
                e.preventDefault();
                this.closeDial();
                this.options.mainAction?.onClick?.();
            });
        }

        this.registerEvent(document, 'pointerdown', (e: Event) => {
            if (!this.open) return;
            const target = e.target as Node;
            if (!this.el.contains(target)) this.closeDial();
        });

        this.registerEvent(document, 'keydown', (e: Event) => {
            const key = (e as KeyboardEvent).key;
            if (key === 'Escape' && this.open) {
                e.preventDefault();
                this.closeDial();
                this.fabButton?.focus();
            }
        });
    }

    private updateTriggerAnimation(isOpen: boolean): void {
        if (isOpen) {
            this.fabWrapper?.classList.add('button-fab--rounded-state');
        } else {
            this.fabWrapper?.classList.remove('button-fab--rounded-state');
        }
        this.iconRotator = updateFabSpeedDialTriggerIcon(
            this.el,
            this.iconRotator,
            'button-fab-dial',
            isOpen
        );
    }

    private updateOpenState(isOpen: boolean): void {
        this.el.setAttribute('data-open', isOpen ? 'true' : 'false');
        this.fabButton?.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        this.fabButton?.setAttribute(
            'aria-label',
            LocaleManager.t(isOpen ? 'buttonFabDial.ariaClose' : 'buttonFabDial.ariaOpen')
        );
        const tabIndex = isOpen ? '0' : '-1';
        this.el.querySelectorAll('.button-fab-dial__action').forEach((btn) => {
            (btn as HTMLElement).setAttribute('tabindex', tabIndex);
        });
    }

    private toggle(): void {
        if (this.open) this.closeDial();
        else this.openDial();
    }

    /** Ouvre le speed dial */
    openDial(): void {
        if (this.open) return;
        if (this.openEndTimeout) clearTimeout(this.openEndTimeout);
        this.options.onOpenStart?.(this.el);
        this.open = true;
        this.updateOpenState(true);
        this.updateTriggerAnimation(true);
        HapticManager.triggerFromOptions(this.options, 'light');
        const items = this.getVisibleItems();
        const maxMs =
            (items.length - 1) * ButtonFabDialSpecs.behaviors.staggerEnterMs +
            ButtonFabDialSpecs.behaviors.spatialDurationMs;
        this.openEndTimeout = setTimeout(() => {
            this.openEndTimeout = null;
            this.options.onOpenEnd?.(this.el);
        }, maxMs);
    }

    /** Ferme le speed dial */
    closeDial(): void {
        if (!this.open) return;
        if (this.openEndTimeout) clearTimeout(this.openEndTimeout);
        this.options.onCloseStart?.(this.el);
        this.open = false;
        this.updateOpenState(false);
        this.updateTriggerAnimation(false);
        HapticManager.triggerFromOptions(this.options, 'light');
        const items = this.getVisibleItems();
        const maxMs =
            (items.length - 1) * ButtonFabDialSpecs.behaviors.staggerExitMs +
            ButtonFabDialSpecs.behaviors.exitDurationMs;
        setTimeout(() => this.options.onCloseEnd?.(this.el), maxMs);
    }

    /** Retourne true si le dial est ouvert */
    isOpen(): boolean {
        return this.open;
    }

    override destroy(): void {
        if (this.openEndTimeout) clearTimeout(this.openEndTimeout);
        try {
            this.fabInstance?.destroy();
        } catch (_) {}
        this.fabInstance = null;
        this.ripples.forEach((r) => {
            try { r.destroy(); } catch (_) {}
        });
        this.ripples = [];
        this.scrim = null;
        this.menuEl = null;
        this.fabButton = null;
        this.fabWrapper = null;
        this.iconRotator = null;
        if ((this.el as KButtonFabDialHTMLElement).K_ButtonFabDial === this) {
            delete (this.el as KButtonFabDialHTMLElement).K_ButtonFabDial;
        }
        this.logger.info('ButtonFabDial destroyed');
    }
}

if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-button-fab-dial')) {
    customElements.define('k3ui-button-fab-dial', class K3UIButtonFabDialElement extends HTMLElement {
        connectedCallback(): void {
            if (!this.hasAttribute('data-initialized')) {
                this.setAttribute('data-initialized', 'true');
            }
        }
        disconnectedCallback(): void {}
    });
}
