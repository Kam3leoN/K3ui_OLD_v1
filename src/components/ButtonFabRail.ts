/**
 * @fileoverview Composant ButtonFabRail pour K3UI
 * @description FAB Speed Dial linéaire (rail) — M3 Expressive
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { toComponentClassDef } from '../types/components/component-base';
import type { ButtonFabRailOptions, ButtonFabSpeedDialItem } from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { setAriaAttributes } from '../utils/dom/aria';
import { LoggerManager, LocaleManager, IconManager } from '../core/managers';
import { ManagerFactory } from '../core/factories';
import { getButtonFabRailDefaults, ButtonFabRailSpecs } from '../specs/components/button-fab-rail.specs';
import { ButtonFab } from './ButtonFab';
import { HapticManager } from '../core/managers/HapticManager';
import {
    computeFabRailFitScale,
    computeFabRailIconRotation,
    computeFabRailOffsets,
    DEFAULT_RAIL_DIRECTION,
} from '../utils/fab/rail-geometry';
import {
    applyFabCornerPosition,
    attachFabRipple,
    bindFabPressHandlers,
    createFabActionButton,
    updateFabSpeedDialTriggerIcon,
} from '../utils/fab/speed-dial-helpers';
import type { Ripple } from '../utils/effects/ripple';

interface KButtonFabRailHTMLElement extends HTMLElement {
    K_ButtonFabRail?: ButtonFabRail;
}

const _defaults: ButtonFabRailOptions = getButtonFabRailDefaults();

export class ButtonFabRail extends Component<ButtonFabRailOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;
    private logger: LoggerManager;
    private scrim: HTMLButtonElement | null = null;
    private fabButton: HTMLButtonElement | null = null;
    private fabWrapper: HTMLDivElement | null = null;
    private iconRotator: HTMLElement | null = null;
    private fabInstance: ButtonFab | null = null;
    private open = false;
    private ripples: Ripple[] = [];
    private openEndTimeout: ReturnType<typeof setTimeout> | null = null;

    static get defaults(): ButtonFabRailOptions {
        return { ..._defaults };
    }

    static getInstance(el: HTMLElement): ButtonFabRail | null {
        return (el as KButtonFabRailHTMLElement).K_ButtonFabRail ?? null;
    }

    static init(
        els: KElement | InitElements<KElement> | string,
        options: Partial<ButtonFabRailOptions> = {}
    ): ButtonFabRail[] {
        return Component.init(els, options, toComponentClassDef(ButtonFabRail)) as ButtonFabRail[];
    }

    constructor(el: HTMLElement, options: Partial<ButtonFabRailOptions> = {}) {
        super(el, options, toComponentClassDef(ButtonFabRail));
        this.logger = ManagerFactory.getLoggerManager('[ButtonFabRail]');

        const fromHtml = ButtonFabRail.readAttributes(el);
        this.options = {
            ...ButtonFabRail.defaults,
            ...options,
            ...fromHtml,
        } as ButtonFabRailOptions;

        (el as KButtonFabRailHTMLElement).K_ButtonFabRail = this;
        this.init();
    }

    private static readAttributes(el: HTMLElement): Partial<ButtonFabRailOptions> {
        const out: Partial<ButtonFabRailOptions> = {};
        const get = (name: string) => el.getAttribute('data-' + name);

        const pos = get('position');
        if (pos === 'bottom-right' || pos === 'bottom-left' || pos === 'top-right' || pos === 'top-left') {
            out.position = pos;
        }
        const dir = get('direction');
        if (dir === 'right' || dir === 'left' || dir === 'up' || dir === 'down') out.direction = dir;
        const icon = get('fab-icon');
        if (icon != null) out.fabIcon = icon;
        if (el.hasAttribute('data-fixed')) out.fixed = true;
        if (el.getAttribute('data-fixed') === 'false') out.fixed = false;
        if (el.hasAttribute('data-auto-fit')) out.autoFit = el.getAttribute('data-auto-fit') !== 'false';
        return out;
    }

    private init(): void {
        this.el.classList.add('button-fab-rail');
        if (!this.options.fixed) {
            this.el.classList.add('button-fab-rail--static');
        }

        this.applyRootStyles();
        this.buildDom();
        this.attachEvents();
        this.updateOpenState(false);

        if (this.options.autoFit) {
            this.registerEvent(window, 'resize', () => this.refreshItemLayout());
        }

        IconManager.processIconsInContainer(this.el);
        this.logger.info('ButtonFabRail initialized');
    }

    private getAxisDirection(): 'right' | 'left' | 'up' | 'down' {
        return this.options.direction ?? DEFAULT_RAIL_DIRECTION[this.options.position] ?? 'up';
    }

    private getVisibleItems(): ButtonFabSpeedDialItem[] {
        const items = this.options.items ?? [];
        const max = ButtonFabRailSpecs.behaviors.maxActions;
        if (items.length > max) {
            this.logger.warn(`ButtonFabRail : ${items.length} actions, ${max} affichées.`);
            return items.slice(0, max);
        }
        return items;
    }

    private getItemSizes(): { actionSize: number; gap: number } {
        const items = this.getVisibleItems();
        let actionSize = this.options.actionSize;
        let gap = this.options.gap;
        if (this.options.autoFit && items.length > 0) {
            const fit = computeFabRailFitScale(
                this.el.getBoundingClientRect(),
                this.getAxisDirection(),
                items.length,
                actionSize,
                gap
            );
            actionSize = Math.round(actionSize * fit);
            gap = Math.round(gap * fit);
        }
        return { actionSize, gap };
    }

    private applyRootStyles(): void {
        const { triggerSize, position, inset, fixed } = this.options;
        applyFabCornerPosition(this.el, position, inset, fixed);
        this.el.style.setProperty('--button-fab-rail-size', `${triggerSize}px`);
        this.el.style.setProperty('--button-fab-rail-rotate', computeFabRailIconRotation(this.getAxisDirection()));
        this.el.setAttribute('data-direction', this.getAxisDirection());
    }

    private refreshItemLayout(): void {
        const items = this.getVisibleItems();
        const { actionSize, gap } = this.getItemSizes();
        this.el.style.setProperty('--button-fab-rail-item-size', `${actionSize}px`);

        const offsets = computeFabRailOffsets({
            count: items.length,
            direction: this.getAxisDirection(),
            actionSize,
            gap,
            triggerSize: this.options.triggerSize,
        });

        this.el.querySelectorAll('.button-fab-rail__item').forEach((itemEl, i) => {
            const el = itemEl as HTMLElement;
            el.style.setProperty('--button-fab-rail-x', `${offsets[i]?.x ?? 0}px`);
            el.style.setProperty('--button-fab-rail-y', `${offsets[i]?.y ?? 0}px`);
        });
    }

    private buildDom(): void {
        this.el.innerHTML = '';
        const items = this.getVisibleItems();
        const { actionSize, gap } = this.getItemSizes();

        this.el.style.setProperty('--button-fab-rail-item-size', `${actionSize}px`);

        if (this.options.scrim) {
            const scrim = document.createElement('button');
            scrim.type = 'button';
            scrim.className = 'button-fab-rail__scrim';
            scrim.tabIndex = -1;
            setAriaAttributes(scrim, { 'aria-hidden': 'true' });
            this.el.appendChild(scrim);
            this.scrim = scrim;
        }

        const menu = document.createElement('div');
        menu.className = 'button-fab-rail__menu';
        menu.setAttribute('role', ButtonFabRailSpecs.accessibility.menuRole);

        const offsets = computeFabRailOffsets({
            count: items.length,
            direction: this.getAxisDirection(),
            actionSize,
            gap,
            triggerSize: this.options.triggerSize,
        });

        items.forEach((item, i) => {
            const delayIn = i * ButtonFabRailSpecs.behaviors.staggerEnterMs;
            const delayOut = (items.length - 1 - i) * ButtonFabRailSpecs.behaviors.staggerExitMs;
            const wrap = document.createElement('div');
            wrap.className = 'button-fab-rail__item';
            wrap.style.setProperty('--button-fab-rail-x', `${offsets[i]?.x ?? 0}px`);
            wrap.style.setProperty('--button-fab-rail-y', `${offsets[i]?.y ?? 0}px`);
            wrap.style.setProperty('--button-fab-rail-delay-in', `${delayIn}ms`);
            wrap.style.setProperty('--button-fab-rail-delay-out', `${delayOut}ms`);

            const btn = createFabActionButton(
                item,
                'button-fab-rail__action',
                ButtonFabRailSpecs.accessibility.itemRole
            );
            wrap.appendChild(btn);
            menu.appendChild(wrap);
            const ripple = attachFabRipple(btn);
            if (ripple) this.ripples.push(ripple);
        });

        this.el.appendChild(menu);

        const slot = document.createElement('div');
        slot.className = 'button-fab-rail__slot';

        const triggerWrap = document.createElement('div');
        triggerWrap.className = 'button-fab-rail__trigger-wrap';

        const fabWrapper = document.createElement('div');
        fabWrapper.className = 'button-fab no-autoinit button-fab-rail__trigger';
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
            rotator.className = 'button-fab-rail__icon-rotator';
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
                'aria-label': LocaleManager.t('buttonFabRail.ariaOpen'),
            });
            bindFabPressHandlers(this.fabButton);
        }

        slot.appendChild(triggerWrap);
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
            this.registerEvent(this.scrim, 'click', () => this.closeRail());
        }

        this.el.querySelectorAll('.button-fab-rail__action').forEach((btn) => {
            this.registerEvent(btn, 'click', (e: Event) => {
                e.preventDefault();
                const id = (btn as HTMLElement).getAttribute('data-id');
                const item = this.getVisibleItems().find((i) => i.id === id);
                if (item && this.options.onItemClick) {
                    this.options.onItemClick(item, this);
                }
                this.closeRail();
            });
        });

        this.registerEvent(document, 'pointerdown', (e: Event) => {
            if (!this.open) return;
            const target = e.target as Node;
            if (!this.el.contains(target)) this.closeRail();
        });

        this.registerEvent(document, 'keydown', (e: Event) => {
            const key = (e as KeyboardEvent).key;
            if (key === 'Escape' && this.open) {
                e.preventDefault();
                this.closeRail();
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
            'button-fab-rail',
            isOpen
        );
    }

    private updateOpenState(isOpen: boolean): void {
        this.el.setAttribute('data-open', isOpen ? 'true' : 'false');
        this.fabButton?.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        this.fabButton?.setAttribute(
            'aria-label',
            LocaleManager.t(isOpen ? 'buttonFabRail.ariaClose' : 'buttonFabRail.ariaOpen')
        );
        const tabIndex = isOpen ? '0' : '-1';
        this.el.querySelectorAll('.button-fab-rail__action').forEach((btn) => {
            (btn as HTMLElement).setAttribute('tabindex', tabIndex);
        });
    }

    private toggle(): void {
        if (this.open) this.closeRail();
        else this.openRail();
    }

    /** Ouvre le rail */
    openRail(): void {
        if (this.open) return;
        if (this.openEndTimeout) clearTimeout(this.openEndTimeout);
        if (this.options.autoFit) this.refreshItemLayout();
        this.options.onOpenStart?.(this.el);
        this.open = true;
        this.updateOpenState(true);
        this.updateTriggerAnimation(true);
        HapticManager.triggerFromOptions(this.options, 'light');
        const items = this.getVisibleItems();
        const maxMs =
            (items.length - 1) * ButtonFabRailSpecs.behaviors.staggerEnterMs +
            ButtonFabRailSpecs.behaviors.spatialDurationMs;
        this.openEndTimeout = setTimeout(() => {
            this.openEndTimeout = null;
            this.options.onOpenEnd?.(this.el);
        }, maxMs);
    }

    /** Ferme le rail */
    closeRail(): void {
        if (!this.open) return;
        if (this.openEndTimeout) clearTimeout(this.openEndTimeout);
        this.options.onCloseStart?.(this.el);
        this.open = false;
        this.updateOpenState(false);
        this.updateTriggerAnimation(false);
        HapticManager.triggerFromOptions(this.options, 'light');
        const items = this.getVisibleItems();
        const maxMs =
            (items.length - 1) * ButtonFabRailSpecs.behaviors.staggerExitMs +
            ButtonFabRailSpecs.behaviors.exitDurationMs;
        setTimeout(() => this.options.onCloseEnd?.(this.el), maxMs);
    }

    /** Retourne true si le rail est ouvert */
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
        this.fabButton = null;
        this.fabWrapper = null;
        this.iconRotator = null;
        if ((this.el as KButtonFabRailHTMLElement).K_ButtonFabRail === this) {
            delete (this.el as KButtonFabRailHTMLElement).K_ButtonFabRail;
        }
        this.logger.info('ButtonFabRail destroyed');
    }
}

if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-button-fab-rail')) {
    customElements.define('k3ui-button-fab-rail', class K3UIButtonFabRailElement extends HTMLElement {
        connectedCallback(): void {
            if (!this.hasAttribute('data-initialized')) {
                this.setAttribute('data-initialized', 'true');
            }
        }
        disconnectedCallback(): void {}
    });
}
