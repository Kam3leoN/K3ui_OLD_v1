/**
 * @fileoverview Composant NavigationBar pour K3UI (Material Design 3 Expressive)
 * @description Barre de navigation en bas avec indicateur pill horizontal (64×32) et destinations icône + label
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import type { NavigationBarOptions } from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { setAriaAttributes, setAriaAttribute } from '../utils/dom/aria';
import { generateGuid } from '../utils/helpers/guid';
import { LoggerManager, LocaleManager, IconManager } from '../core/managers';
import { ManagerFactory } from '../core/factories/ManagerFactory';
import { getNavigationBarDefaults } from '../specs/components/navigation-bar.specs';
import { NavigationBarSpecs } from '../specs/components/navigation-bar.specs';
import { setBodyNavigationBarOffset } from '../utils/fab';
import { HapticManager } from '../core/managers/HapticManager';

const _defaults: NavigationBarOptions = getNavigationBarDefaults();

/** Seuil en px pour portable vs desktop */
const DISPLAY_MODE_BREAKPOINT = 768;

/**
 * Classe NavigationBar - Barre de navigation en bas MD3 (pill horizontale 64×32, hauteur 80px)
 */
export class NavigationBar extends Component<NavigationBarOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    private logger: LoggerManager;
    private items: HTMLElement[] = [];
    private panels: HTMLElement[] = [];
    private pillAnimTimer: ReturnType<typeof setTimeout> | null = null;
    private hrefNavTimer: ReturnType<typeof setTimeout> | null = null;

    static get defaults(): NavigationBarOptions {
        return { ..._defaults };
    }

    static getInstance(el: HTMLElement): NavigationBar | undefined {
        return Component.getInstance(el) as NavigationBar | undefined;
    }

    static init(
        els: KElement | InitElements<KElement> | string,
        options: Partial<NavigationBarOptions> = {}
    ): NavigationBar | NavigationBar[] {
        return Component.init(els, options, toComponentClassDef(NavigationBar)) as NavigationBar | NavigationBar[];
    }

    constructor(el: HTMLElement, options: Partial<NavigationBarOptions> = {}) {
        super(el, options, toComponentClassDef(NavigationBar));

        this.logger = ManagerFactory.getLoggerManager('[NavigationBar]');
        this.options = {
            ...NavigationBar.defaults,
            ...options,
        };

        if (el.hasAttribute('data-active-index')) {
            const v = parseInt(el.getAttribute('data-active-index')!, 10);
            if (!Number.isNaN(v) && v >= 0) this.options.activeIndex = v;
        }
        if (el.hasAttribute('data-display-mode')) {
            const mode = el.getAttribute('data-display-mode');
            if (mode === 'portable' || mode === 'desktop' || mode === 'always') this.options.displayMode = mode;
        }
        if (el.hasAttribute('data-compact')) {
            this.options.compact = el.getAttribute('data-compact') !== 'false' && el.getAttribute('data-compact') !== '0';
        }

        if (!this.options.id) this.options.id = generateGuid();
        el.id = el.id || this.options.id;
        el.setAttribute('data-navigation-bar-id', this.options.id);

        this.init();
    }

    private init(): void {
        this.resolveStructure();
        if (this.items.length === 0) {
            this.logger.warn('NavigationBar: aucun .navigation-bar__item trouvé');
            return;
        }
        this.applyDisplayMode();
        this.applyCompact();
        this.setActiveIndex(this.options.activeIndex, false);
        this.setupAria();
        this.setupEvents();
        this.syncBottomOffset();
        this.registerEvent(window, 'resize', this._boundSyncBottomOffset);
        IconManager.processIconsInContainer(this.el);
        this.logger.info('NavigationBar initialized');
    }

    private _boundSyncBottomOffset = (): void => this.syncBottomOffset();

    /**
     * Met à jour --k3ui-navigation-bar-offset / --k3ui-bottom-inset.
     * La barre reste fixed en bas ; le page-footer se place juste au-dessus via la variable CSS.
     */
    private syncBottomOffset(): void {
        this.el.style.bottom = '0';
        setBodyNavigationBarOffset();
    }

    private applyDisplayMode(): void {
        this.el.setAttribute('data-display-mode', this.options.displayMode);
        this.syncBottomOffset();
    }

    private applyCompact(): void {
        this.el.classList.toggle('navigation-bar--compact', this.options.compact);
    }

    private resolveStructure(): void {
        this.items = Array.from(this.el.querySelectorAll<HTMLElement>('.navigation-bar__item'));
        const container = this.el.closest('.navigation-bar-container') || document.body;
        this.panels = Array.from(container.querySelectorAll<HTMLElement>('.navigation-bar-panel'));
        if (this.panels.length === 0) {
            this.panels = Array.from(container.querySelectorAll<HTMLElement>('.active-page'));
        }
    }

    private setupAria(): void {
        const ariaLabel = LocaleManager.t('navigationBar.ariaLabel');
        setAriaAttributes(this.el, {
            role: 'navigation',
            label: ariaLabel || null,
        });
        this.items.forEach((item, i) => {
            setAriaAttributes(item, {
                role: 'tab',
                selected: i === this.options.activeIndex,
                setSize: this.items.length,
                posInSet: i + 1,
            });
        });
    }

    private setupEvents(): void {
        this.items.forEach((item, index) => {
            item.addEventListener('click', (e) => this.handleItemClick(e, index));
            item.addEventListener('keydown', (e) => this.handleKeydown(e, index));
        });
    }

    private handleItemClick(e: Event, index: number): void {
        const item = this.items[index];
        if (item.hasAttribute('aria-disabled') || item.getAttribute('aria-disabled') === 'true') return;
        e.preventDefault();
        const destination = item.getAttribute('data-destination') ?? index;
        const href = item.getAttribute('data-href');

        if (index === this.options.activeIndex) {
            this.options.onClick?.(destination, index);
            return;
        }

        HapticManager.triggerFromOptions(this.options, 'selection');
        this.setActiveIndex(index, true);

        if (this.hrefNavTimer !== null) {
            clearTimeout(this.hrefNavTimer);
            this.hrefNavTimer = null;
        }

        if (href) {
            const navDelayMs =
                typeof NavigationBarSpecs.animations.pill.navDelayMs === 'number'
                    ? NavigationBarSpecs.animations.pill.navDelayMs
                    : 240;
            this.hrefNavTimer = window.setTimeout(() => {
                this.hrefNavTimer = null;
                this.options.onClick?.(destination, index);
            }, navDelayMs);
            return;
        }

        this.options.onClick?.(destination, index);
    }

    private handleKeydown(e: KeyboardEvent, index: number): void {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.handleItemClick(e, index);
            return;
        }
        if (e.key === 'ArrowRight' && index < this.items.length - 1) {
            e.preventDefault();
            this.items[index + 1].focus();
            this.setActiveIndex(index + 1, true);
            return;
        }
        if (e.key === 'ArrowLeft' && index > 0) {
            e.preventDefault();
            this.items[index - 1].focus();
            this.setActiveIndex(index - 1, true);
            return;
        }
        if (e.key === 'Home') {
            e.preventDefault();
            this.items[0].focus();
            this.setActiveIndex(0, true);
            return;
        }
        if (e.key === 'End') {
            e.preventDefault();
            const last = this.items.length - 1;
            this.items[last].focus();
            this.setActiveIndex(last, true);
        }
    }

    setActiveIndex(index: number, notify = true): void {
        const safeIndex = Math.max(0, Math.min(index, this.items.length - 1));
        const previousIndex = this.options.activeIndex;
        const indexChanged = safeIndex !== previousIndex;

        if (!indexChanged && !notify) {
            this.items.forEach((item, i) => {
                const active = i === safeIndex;
                item.classList.toggle('navigation-bar__item--active', active);
                item.classList.remove('navigation-bar__item--pill-anim');
                setAriaAttribute(item, 'selected', active);
            });
            return;
        }

        this.options.activeIndex = safeIndex;
        const target = this.items[safeIndex];
        const runPillAnim = indexChanged;

        this.items.forEach((item, i) => {
            const active = i === safeIndex;
            item.classList.toggle('navigation-bar__item--active', active);
            item.classList.remove('navigation-bar__item--pill-anim');
            setAriaAttribute(item, 'selected', active);
        });

        if (runPillAnim && target) {
            this.restartPillEnter(target);
        } else if (this.pillAnimTimer !== null) {
            clearTimeout(this.pillAnimTimer);
            this.pillAnimTimer = null;
        }

        const destId = this.items[safeIndex]?.getAttribute('data-destination');
        this.panels.forEach((panel) => {
            const dataDest = panel.getAttribute('data-destination');
            const idMatch = panel.id && destId && panel.id === `page-${destId}`;
            const dataMatch = dataDest !== null && dataDest === destId;
            const show = !!idMatch || !!dataMatch;
            panel.classList.toggle('navigation-bar-panel--active', show);
            panel.classList.toggle('show', show);
        });

        if (notify) {
            const destination = this.items[safeIndex]?.getAttribute('data-destination') ?? safeIndex;
            this.options.onChange?.(destination, safeIndex);
        }
    }

    /**
     * Relance l’entrée pill (spatial-fast) : cancel + reflow + --pill-anim.
     */
    private restartPillEnter(item: HTMLElement): void {
        const pill = item.querySelector<HTMLElement>('.navigation-bar__pill');
        item.classList.remove('navigation-bar__item--pill-anim');
        if (pill) {
            pill.style.setProperty('animation', 'none');
            void pill.offsetWidth;
            pill.style.removeProperty('animation');
        }
        item.classList.add('navigation-bar__item--pill-anim');
        if (this.pillAnimTimer !== null) {
            clearTimeout(this.pillAnimTimer);
        }
        const pillDurationMs = NavigationBarSpecs.animations.pill.duration ?? 350;
        this.pillAnimTimer = window.setTimeout(() => {
            item.classList.remove('navigation-bar__item--pill-anim');
            this.pillAnimTimer = null;
        }, pillDurationMs + 40);
    }

    getActiveIndex(): number {
        return this.options.activeIndex;
    }

    /** Retourne l'identifiant unique de la barre */
    getId(): string {
        return this.options.id ?? this.el.id ?? '';
    }

    /** Met à jour le mode d'affichage (portable / desktop / always). */
    setDisplayMode(mode: 'portable' | 'desktop' | 'always'): void {
        this.options.displayMode = mode;
        this.applyDisplayMode();
    }

    /** Met à jour le mode compact (items resserrés). */
    setCompact(compact: boolean): void {
        this.options.compact = compact;
        this.applyCompact();
    }

    public override destroy(): void {
        if (this.pillAnimTimer !== null) {
            clearTimeout(this.pillAnimTimer);
            this.pillAnimTimer = null;
        }
        if (this.hrefNavTimer !== null) {
            clearTimeout(this.hrefNavTimer);
            this.hrefNavTimer = null;
        }
        this.el.style.removeProperty('bottom');
        setBodyNavigationBarOffset();
        this.logger.info('NavigationBar destroyed');
        super.destroy();
    }
}

/**
 * Custom Element <k3ui-navigation-bar>
 * @description Permet l'utilisation de <k3ui-navigation-bar> dans le HTML. Initialisation par AutoInit.
 */
if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-navigation-bar')) {
    customElements.define('k3ui-navigation-bar', class extends HTMLElement {
        connectedCallback(): void {
            if (!this.hasAttribute('data-initialized')) {
                this.setAttribute('data-initialized', 'true');
            }
        }
        disconnectedCallback(): void {
            const instance = NavigationBar.getInstance(this);
            if (instance && typeof instance.destroy === 'function') {
                instance.destroy();
            }
        }
    });
}
