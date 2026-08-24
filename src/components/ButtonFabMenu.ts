/**
 * @fileoverview Composant ButtonFabMenu pour K3UI
 * @description FAB Speed Dial Material Design 3 Expressive — FAB principal + menu de pills (actions rapides)
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import type { ButtonFabMenuOptions, ButtonFabMenuItem } from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { setAriaAttributes } from '../utils/dom/aria';
import { LoggerManager, LocaleManager, IconManager } from '../core/managers';
import { ManagerFactory } from '../core/factories';
import { getButtonFabMenuDefaults, ButtonFabMenuSpecs } from '../specs/components/button-fab-menu.specs';
import { createRipple, Ripple } from '../utils/effects/ripple';
import { ButtonFab } from './ButtonFab';

interface KButtonFabMenuHTMLElement extends HTMLElement {
    K_ButtonFabMenu?: ButtonFabMenu;
}

const _defaults: ButtonFabMenuOptions = getButtonFabMenuDefaults();

type FabMenuPhase = 'idle' | 'opening' | 'closing';

interface LayoutResult {
    containerStyle: Record<string, string>;
    listAlign: string;
    dx: string;
    isBottom: boolean;
    isRight: boolean;
}

function computeLayout(position: ButtonFabMenuOptions['position']): LayoutResult {
    const isBottom = position.startsWith('bottom');
    const isRight = position.endsWith('right');
    const edge = ButtonFabMenuSpecs.behaviors.edge;
    const dx = isRight ? '80px' : '-80px';
    const flexDir = isBottom ? 'column' : 'column-reverse';
    const listAlign = isRight ? 'flex-end' : 'flex-start';
    const containerStyle: Record<string, string> = {
        flexDirection: flexDir,
        alignItems: listAlign,
        bottom: isBottom ? `${edge}px` : 'auto',
        top: isBottom ? 'auto' : `${edge}px`,
        right: isRight ? `${edge}px` : 'auto',
        left: isRight ? 'auto' : `${edge}px`,
    };
    return { containerStyle, listAlign, dx, isBottom, isRight };
}

/**
 * Classe ButtonFabMenu pour K3UI
 * @description FAB M3 Expressive avec menu de pills (speed dial) ; position et items configurables
 */
export class ButtonFabMenu extends Component<ButtonFabMenuOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;
    private logger: LoggerManager;
    private scrim: HTMLDivElement | null = null;
    private listEl: HTMLDivElement | null = null;
    private fabWrapper: HTMLElement | null = null;
    private fabInstance: ButtonFab | null = null;
    private fabButton: HTMLButtonElement | null = null;
    private iconRotator: HTMLElement | null = null;
    private open = false;
    private phase: FabMenuPhase = 'idle';
    private animKey = 0;
    private fabKey = 0;
    private rippleInstance: Ripple | null = null;
    private pillRipples: Ripple[] = [];
    private closingTimeout: ReturnType<typeof setTimeout> | null = null;
    private closingCascadeTimeouts: ReturnType<typeof setTimeout>[] = [];
    /** Stagger M3 — StaggerEnterDelayMillis */
    private static readonly OPEN_STAGGER_MS = ButtonFabMenuSpecs.behaviors.staggerEnterMs;
    /** Stagger M3 — StaggerExitDelayMillis */
    private static readonly CLOSE_STAGGER_MS = ButtonFabMenuSpecs.behaviors.staggerExitMs;
    private maxOpenDurationMs = ButtonFabMenuSpecs.behaviors.spatialDurationMs;
    private maxCloseDurationMs = ButtonFabMenuSpecs.behaviors.effectsDurationMs;

    static get defaults(): ButtonFabMenuOptions {
        return { ..._defaults };
    }

    static getInstance(el: HTMLElement): ButtonFabMenu | null {
        return (el as KButtonFabMenuHTMLElement).K_ButtonFabMenu ?? null;
    }

    static init(
        els: KElement | InitElements<KElement> | string,
        options: Partial<ButtonFabMenuOptions> = {}
    ): ButtonFabMenu[] {
        return Component.init(els, options, toComponentClassDef(ButtonFabMenu)) as ButtonFabMenu[];
    }

    constructor(el: HTMLElement, options: Partial<ButtonFabMenuOptions> = {}) {
        super(el, options, toComponentClassDef(ButtonFabMenu));
        this.logger = ManagerFactory.getLoggerManager('[ButtonFabMenu]');

        const fromHtml = ButtonFabMenu.readAttributes(el);
        this.options = {
            ...ButtonFabMenu.defaults,
            ...options,
            ...fromHtml,
        } as ButtonFabMenuOptions;

        (el as KButtonFabMenuHTMLElement).K_ButtonFabMenu = this;
        this.init();
    }

    private static readAttributes(el: HTMLElement): Partial<ButtonFabMenuOptions> {
        const out: Partial<ButtonFabMenuOptions> = {};
        const get = (dataName: string) => el.getAttribute('data-' + dataName);

        const pos = get('position');
        if (pos === 'bottom-right' || pos === 'bottom-left' || pos === 'top-right' || pos === 'top-left') {
            out.position = pos;
        }
        const icon = get('fab-icon');
        if (icon != null) out.fabIcon = icon;
        const closeIcon = get('fab-close-icon');
        if (closeIcon != null) out.fabCloseIcon = closeIcon;
        return out;
    }

    private init(): void {
        this.el.classList.add('button-fab-menu');
        if (!this.el.style.position || this.el.style.position === 'static') {
            this.el.style.position = 'relative';
        }
        setAriaAttributes(this.el, { role: 'group' });

        this.buildDom();
        this.applyLayout();
        this.measureAndSetItemDurations();
        this.attachEvents();
        this.updateFocusableWhenClosed();

        if (this.fabButton) {
            IconManager.processIconsInContainer(this.el);
            IconManager.forceDisplayIcons?.();
        }

        this.logger.info('ButtonFabMenu initialized');
    }

    private buildDom(): void {
        this.el.innerHTML = '';

        const scrim = document.createElement('div');
        scrim.className = 'button-fab-menu__scrim';
        scrim.setAttribute('aria-hidden', 'true');
        this.el.appendChild(scrim);
        this.scrim = scrim;

        const fabWrap = document.createElement('div');
        fabWrap.className = 'button-fab-menu__fab';
        this.el.appendChild(fabWrap);

        const list = document.createElement('div');
        list.className = 'button-fab-menu__list';
        list.setAttribute('role', ButtonFabMenuSpecs.accessibility.menuRole);
        fabWrap.appendChild(list);
        this.listEl = list;

        const items = this.options.items ?? [];
        const { isBottom, isRight } = computeLayout(this.options.position);
        const ordered = isBottom ? [...items].reverse() : [...items];

        ordered.forEach((item) => {
            const itemWrap = document.createElement('div');
            itemWrap.className = 'button-fab-menu__item';
            itemWrap.setAttribute('role', 'presentation');

            const pill = document.createElement('button');
            pill.type = 'button';
            pill.className = 'button-fab-menu__pill' + (!isRight ? ' button-fab-menu__pill--rev' : '') + ' ripple';
            pill.setAttribute('role', ButtonFabMenuSpecs.accessibility.itemRole);
            pill.setAttribute('data-id', item.id);
            pill.setAttribute('aria-label', item.label);

            const iconSpan = document.createElement('span');
            iconSpan.className = 'button-fab-menu__pill-icon';
            const iconEl = document.createElement('i');
            iconEl.className = 'k3ui-icon';
            iconEl.setAttribute('name', item.icon ?? 'edit');
            if (item.iconType) {
                iconEl.setAttribute('type', item.iconType);
            }
            iconEl.setAttribute('aria-hidden', 'true');
            iconSpan.appendChild(iconEl);

            const labelSpan = document.createElement('span');
            labelSpan.className = 'button-fab-menu__pill-label';
            labelSpan.textContent = item.label;

            pill.appendChild(iconSpan);
            pill.appendChild(labelSpan);
            itemWrap.appendChild(pill);
            list.appendChild(itemWrap);
        });

        // FAB principal : réutilise le composant ButtonFab
        const fabWrapper = document.createElement('div');
        fabWrapper.className = 'button-fab no-autoinit';
        fabWrapper.setAttribute('data-mode', 'fab');
        fabWrapper.setAttribute('data-size', 'small');
        fabWrapper.setAttribute('data-variant', 'secondary');
        fabWrapper.setAttribute('data-icon', this.options.fabIcon ?? 'add');
        fabWrap.appendChild(fabWrapper);
        this.fabWrapper = fabWrapper;

        const fabResult = ButtonFab.init(fabWrapper, {});
        this.fabInstance = (Array.isArray(fabResult) ? fabResult[0] : fabResult) ?? null;

        const iconWrap = fabWrapper.querySelector('.button-fab__icon');
        if (iconWrap) {
            iconWrap.innerHTML = '';
            const iconRotator = document.createElement('span');
            iconRotator.className = 'button-fab-menu__icon-rotator';
            this.iconRotator = iconRotator;

            const iconPlus = document.createElement('span');
            iconPlus.className = 'button-fab-menu__icon button-fab-menu__icon--plus';
            const iPlus = document.createElement('i');
            iPlus.className = 'k3ui-icon';
            iPlus.setAttribute('name', this.options.fabIcon ?? 'add');
            iPlus.setAttribute('aria-hidden', 'true');
            iconPlus.appendChild(iPlus);

            iconRotator.appendChild(iconPlus);

            if (this.usesExplicitCloseIcon()) {
                iconRotator.classList.add('button-fab-menu__icon-rotator--swap');
                const iconClose = document.createElement('span');
                iconClose.className = 'button-fab-menu__icon button-fab-menu__icon--close';
                const iClose = document.createElement('i');
                iClose.className = 'k3ui-icon';
                iClose.setAttribute('name', this.getCloseIconName());
                iClose.setAttribute('aria-hidden', 'true');
                iconClose.appendChild(iClose);
                iconRotator.appendChild(iconClose);
            }

            iconWrap.appendChild(iconRotator);
        }

        this.fabButton = fabWrapper.querySelector('.button-fab__btn');
        if (this.fabButton) {
            this.fabButton.setAttribute('aria-expanded', 'false');
            this.fabButton.setAttribute('aria-label', LocaleManager.t('buttonFabMenu.ariaOpen'));
        }

        try {
            this.el.querySelectorAll('.button-fab-menu__pill').forEach((pill) => {
                const r = createRipple(pill as HTMLElement);
                this.pillRipples.push(r);
            });
        } catch (_) {
            // ripple optional
        }
    }

    private applyLayout(): void {
        const { containerStyle, listAlign, dx, isBottom, isRight } = computeLayout(this.options.position);
        const fabWrap = this.el.querySelector('.button-fab-menu__fab') as HTMLElement;
        if (fabWrap) {
            const inLayer = this.el.closest('.fab-menu-layer');
            if (inLayer) {
                // Dans la layer le slot fournit déjà l'inset 16px : __fab à 0 pour ne pas doubler (évite FAB trop haut)
                fabWrap.style.setProperty('flex-direction', containerStyle.flexDirection, '');
                fabWrap.style.setProperty('align-items', containerStyle.alignItems, '');
                fabWrap.style.setProperty('bottom', '0', 'important');
                fabWrap.style.setProperty('top', 'auto', '');
                fabWrap.style.setProperty('right', isRight ? '0' : 'auto', 'important');
                fabWrap.style.setProperty('left', isRight ? 'auto' : '0', 'important');
            } else {
                Object.assign(fabWrap.style, containerStyle);
            }
        }
        if (this.listEl) {
            this.listEl.style.alignItems = listAlign;
        }
        this.el.querySelectorAll('.button-fab-menu__item').forEach((itemEl) => {
            (itemEl as HTMLElement).style.setProperty('--button-fab-menu-dx', dx);
        });
    }

    /**
     * Délais d’animation items — M3 FAB Menu : proche du FAB en premier à l’ouverture (35ms),
     * item éloigné en premier à la fermeture (25ms). Durée max = stagger + spatial (350ms).
     */
    private measureAndSetItemDurations(phase: 'open' | 'close' = 'open'): void {
        const items = this.el.querySelectorAll('.button-fab-menu__item');
        if (!items.length) return;
        const { isBottom } = computeLayout(this.options.position);
        const n = items.length;
        const spatialMs = ButtonFabMenuSpecs.behaviors.spatialDurationMs;
        if (phase === 'open') {
            const staggerMs = ButtonFabMenu.OPEN_STAGGER_MS;
            items.forEach((itemEl, i) => {
                const openDelayMs = isBottom ? (n - 1 - i) * staggerMs : i * staggerMs;
                (itemEl as HTMLElement).style.setProperty('--button-fab-menu-item-delay', `${openDelayMs}ms`);
            });
            this.maxOpenDurationMs = (n - 1) * staggerMs + spatialMs;
        } else {
            const staggerMs = ButtonFabMenu.CLOSE_STAGGER_MS;
            items.forEach((itemEl, i) => {
                const closeDelayMs = isBottom ? i * staggerMs : (n - 1 - i) * staggerMs;
                (itemEl as HTMLElement).style.setProperty('--button-fab-menu-item-delay', `${closeDelayMs}ms`);
            });
            this.maxCloseDurationMs = (n - 1) * staggerMs + spatialMs;
        }
    }

    private attachEvents(): void {
        if (this.fabButton) {
            this.registerEvent(this.fabButton, 'click', (e: Event) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggle();
            });
        }

        this.el.querySelectorAll('.button-fab-menu__pill').forEach((pill) => {
            this.registerEvent(pill, 'click', (e: Event) => {
                e.preventDefault();
                const id = (pill as HTMLElement).getAttribute('data-id');
                const item = this.options.items?.find((i) => i.id === id);
                if (item && this.options.onItemClick) {
                    this.options.onItemClick(item, this);
                }
                this.toggle();
            });
        });

        this.registerEvent(document, 'keydown', (e: Event) => {
            const key = (e as KeyboardEvent).key;
            if (key === 'Escape' && this.open) {
                e.preventDefault();
                this.closeMenu();
            }
        });
    }

    private toggle(): void {
        if (!this.open) {
            this.closingCascadeTimeouts.forEach((t) => clearTimeout(t));
            this.closingCascadeTimeouts = [];
            if (this.closingTimeout) clearTimeout(this.closingTimeout);
            this.closingTimeout = null;
            this.measureAndSetItemDurations('open');
            this.options.onOpenStart?.(this.el);
            this.open = true;
            this.phase = 'opening';
            this.animKey += 1;
            this.fabKey += 1;
            this.scrim?.classList.add('button-fab-menu__scrim--on');
            this.fabWrapper?.classList.add('button-fab--rounded-state');
            this.fabButton?.setAttribute('aria-expanded', 'true');
            this.fabButton?.setAttribute('aria-label', LocaleManager.t('buttonFabMenu.ariaClose'));
            this.updateItemClasses();
            this.updateFabIconRotation();
            setTimeout(() => {
                this.phase = 'idle';
                this.updateItemClasses();
                this.options.onOpenEnd?.(this.el);
            }, this.maxOpenDurationMs);
        } else {
            this.options.onCloseStart?.(this.el);
            this.open = false;
            this.phase = 'closing';
            this.animKey += 1;
            this.updateFabIconRotation();
            this.scrim?.classList.remove('button-fab-menu__scrim--on');
            this.fabWrapper?.classList.remove('button-fab--rounded-state');
            this.fabButton?.setAttribute('aria-expanded', 'false');
            this.fabButton?.setAttribute('aria-label', LocaleManager.t('buttonFabMenu.ariaOpen'));
            this.runCloseCascade();
        }
    }

    /**
     * Fermeture M3 : FastEffects + FastSpatial, stagger 25ms (item loin du FAB en premier).
     */
    private runCloseCascade(): void {
        this.closingCascadeTimeouts.forEach((t) => clearTimeout(t));
        this.closingCascadeTimeouts = [];
        if (this.closingTimeout) clearTimeout(this.closingTimeout);
        this.measureAndSetItemDurations('close');
        requestAnimationFrame(() => {
            this.updateItemClasses();
            this.closingTimeout = setTimeout(() => {
                this.closingTimeout = null;
                this.closingCascadeTimeouts.forEach((t) => clearTimeout(t));
                this.closingCascadeTimeouts = [];
                this.phase = 'idle';
                this.updateItemClasses();
                this.options.onCloseEnd?.(this.el);
            }, this.maxCloseDurationMs);
        });
    }

    private updateItemClasses(): void {
        let itemClass: string;
        if (this.phase === 'opening') {
            itemClass = 'button-fab-menu__item button-fab-menu__item--opening';
        } else if (this.phase === 'idle' && this.open) {
            itemClass = 'button-fab-menu__item button-fab-menu__item--open';
        } else if (this.phase === 'closing') {
            itemClass = 'button-fab-menu__item button-fab-menu__item--closing';
        } else {
            itemClass = 'button-fab-menu__item';
        }
        this.el.querySelectorAll('.button-fab-menu__item').forEach((itemEl) => {
            const el = itemEl as HTMLElement;
            el.className = itemClass;
            el.style.setProperty('--button-fab-menu-anim-key', String(this.animKey));
        });
        this.updateFocusableWhenClosed();
    }

    /**
     * Quand le menu est fermé, retire les éléments focusables du tab order (aria-hidden-focus).
     * Quand il est ouvert, restaure la focalisation.
     */
    private updateFocusableWhenClosed(): void {
        const tabindex = this.open ? '0' : '-1';
        this.fabButton?.setAttribute('tabindex', tabindex);
        this.el.querySelectorAll('.button-fab-menu__pill').forEach((pill) => {
            (pill as HTMLElement).setAttribute('tabindex', tabindex);
        });
    }

    /**
     * Utilise une icône de fermeture explicite (xmark/cross) plutôt que la rotation du « + ».
     */
    private usesExplicitCloseIcon(): boolean {
        return this.options.fabCloseIcon != null || (this.options.fabIcon ?? 'add') !== 'add';
    }

    /** Nom de l’icône affichée à l’ouverture (fermeture). */
    private getCloseIconName(): string {
        return this.options.fabCloseIcon ?? 'xmark';
    }

    /**
     * Rotation rebondissante du trigger + ↔ × ou bascule vers xmark/cross explicite.
     * Les classes --open / --closing sont mutuellement exclusives pour relancer la keyframe à chaque toggle.
     */
    private updateFabIconRotation(): void {
        if (!this.iconRotator || !this.el.contains(this.iconRotator)) {
            this.iconRotator = this.el.querySelector('.button-fab-menu__icon-rotator');
        }
        if (!this.iconRotator) return;

        if (this.usesExplicitCloseIcon()) {
            this.iconRotator.classList.remove(
                'button-fab-menu__icon-rotator--open',
                'button-fab-menu__icon-rotator--closing'
            );
            this.iconRotator.classList.toggle('button-fab-menu__icon-rotator--swap-open', this.open);
            return;
        }

        this.iconRotator.classList.remove('button-fab-menu__icon-rotator--swap-open');
        this.iconRotator.classList.toggle('button-fab-menu__icon-rotator--open', this.open);
        this.iconRotator.classList.toggle('button-fab-menu__icon-rotator--closing', !this.open);
    }

    /** Ouvre le menu FAB */
    openMenu(): void {
        if (!this.open) this.toggle();
    }

    /** Ferme le menu FAB */
    closeMenu(): void {
        if (this.open) this.toggle();
    }

    /** Retourne true si le menu est ouvert */
    isOpen(): boolean {
        return this.open;
    }

    /** Met à jour la position (bottom-right, bottom-left, top-right, top-left) */
    setPosition(position: ButtonFabMenuOptions['position']): void {
        this.options.position = position;
        this.applyLayout();
        const { isRight } = computeLayout(position);
        this.el.querySelectorAll('.button-fab-menu__pill').forEach((pill) => {
            pill.classList.toggle('button-fab-menu__pill--rev', !isRight);
        });
    }

    public override destroy(): void {
        this.closingCascadeTimeouts.forEach((t) => clearTimeout(t));
        this.closingCascadeTimeouts = [];
        if (this.closingTimeout) {
            clearTimeout(this.closingTimeout);
            this.closingTimeout = null;
        }
        try {
            this.fabInstance?.destroy();
        } catch (_) {}
        this.fabInstance = null;
        this.fabWrapper = null;
        try {
            this.rippleInstance?.destroy();
        } catch (_) {}
        this.rippleInstance = null;
        this.pillRipples.forEach((r) => {
            try { r.destroy(); } catch (_) {}
        });
        this.pillRipples = [];
        this.scrim = null;
        this.listEl = null;
        this.fabButton = null;
        this.iconRotator = null;
        if ((this.el as KButtonFabMenuHTMLElement).K_ButtonFabMenu === this) {
            delete (this.el as KButtonFabMenuHTMLElement).K_ButtonFabMenu;
        }
        this.logger.info('ButtonFabMenu destroyed');
    }
}

/**
 * Custom Element <k3ui-button-fab-menu>
 * @description Permet l'utilisation de <k3ui-button-fab-menu> dans le HTML. Initialisation par AutoInit.
 */
if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-button-fab-menu')) {
    customElements.define('k3ui-button-fab-menu', class K3UIButtonFabMenuElement extends HTMLElement {
        private buttonFabMenuInstance: ButtonFabMenu | null = null;

        connectedCallback(): void {
            if (!this.hasAttribute('data-initialized')) {
                this.setAttribute('data-initialized', 'true');
            }
        }

        disconnectedCallback(): void {
            if (this.buttonFabMenuInstance) {
                this.buttonFabMenuInstance.destroy();
                this.buttonFabMenuInstance = null;
            }
        }
    });
}
