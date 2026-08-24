/**
 * @fileoverview Composant ButtonGroups — compose le composant Button (M3 container pattern)
 * @see https://m3.material.io/components/button-groups/specs
 * @author K3UI Team
 * @version 3.1.0
 */

import { Component } from '../core/base/Component';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import type { ButtonGroupsOptions, ButtonGroupItem, ButtonOptions } from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { setAriaAttributes, removeAriaAttribute } from '../utils/dom/aria';
import { LoggerManager, IconManager } from '../core/managers';
import { ManagerFactory } from '../core/factories';
import { Button } from './Button';
import { ButtonGroupsSpecs, getButtonGroupsDefaults, getButtonGroupsRadiusVars } from '../specs/components/button-groups.specs';

interface KButtonGroupsHTMLElement extends HTMLElement {
    K_ButtonGroups?: ButtonGroups;
}

const _defaults: ButtonGroupsOptions = getButtonGroupsDefaults();

const CHILD_BUTTON_SELECTOR = ':scope > button:not(.button-groups__btn--overflow)';

/**
 * Groupe de boutons M3 — conteneur + instances {@link Button}
 */
// @ts-expect-error - callbacks avec instance
export class ButtonGroups extends Component<ButtonGroupsOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;
    private logger: LoggerManager;
    private selectedIndices: Set<number> = new Set();
    private buttonElements: HTMLButtonElement[] = [];
    /** Instances Button créées par ce groupe (destroy ciblée) */
    private ownedButtonInstances: Button[] = [];
    private overflowButton: HTMLButtonElement | null = null;
    private overflowMenu: HTMLUListElement | null = null;
    private resizeObserver: ResizeObserver | null = null;
    private overflowVisibleCount = 0;
    /** true = enfants `.btn` déjà dans le DOM (pattern M3) */
    private declarativeMode = false;

    static get defaults(): ButtonGroupsOptions {
        return { ..._defaults };
    }

    static getInstance(el: HTMLElement): ButtonGroups | null {
        return (el as KButtonGroupsHTMLElement).K_ButtonGroups ?? null;
    }

    static init(
        els: KElement | InitElements<KElement> | string,
        options: Partial<ButtonGroupsOptions> = {}
    ): ButtonGroups[] {
        return Component.init(els, options, toComponentClassDef(ButtonGroups)) as ButtonGroups[];
    }

    constructor(el: HTMLElement, options: Partial<ButtonGroupsOptions> = {}) {
        super(el, options, toComponentClassDef(ButtonGroups));
        this.logger = ManagerFactory.getLoggerManager('[ButtonGroups]');

        const fromHtml = ButtonGroups.readAttributes(el);
        // Attributs data-* (déclaratif) > options AutoInit/defaults (souvent buttons: [], type: standard…)
        this.options = {
            ...ButtonGroups.defaults,
            ...options,
            ...fromHtml,
        } as ButtonGroupsOptions;

        const normalizedShape = ButtonGroups.normalizeShape(this.options.shape);
        if (normalizedShape) {
            this.options.shape = normalizedShape;
        }

        const defSelected = this.options.defaultSelected;
        this.selectedIndices = new Set(
            Array.isArray(defSelected) ? defSelected : [defSelected != null ? defSelected : 0]
        );

        (el as KButtonGroupsHTMLElement).K_ButtonGroups = this;
        this.init();
    }

    /** Normalise la forme M3 (`round`) — accepte l’alias legacy `rounded` */
    private static normalizeShape(shape: string | null | undefined): ButtonGroupsOptions['shape'] | undefined {
        if (shape === 'round' || shape === 'rounded') return 'round';
        if (shape === 'square') return 'square';
        return undefined;
    }

    /** Classe shape du composant Button (distincte de l’option M3 `round`) */
    private static toButtonShapeClass(shape: ButtonGroupsOptions['shape']): 'rounded' | 'square' {
        return shape === 'round' ? 'rounded' : 'square';
    }

    /**
     * Lit la configuration depuis les attributs (data-* ou custom element)
     */
    private static readAttributes(el: HTMLElement): Partial<ButtonGroupsOptions> {
        const out: Partial<ButtonGroupsOptions> = {};
        const get = (dataName: string, plainName?: string) =>
            el.getAttribute(`data-${dataName}`) ?? (plainName ? el.getAttribute(plainName) : null);

        const dataButtons = get('buttons', 'buttons');
        if (dataButtons) {
            try {
                const parsed = JSON.parse(dataButtons) as ButtonGroupItem[];
                if (Array.isArray(parsed)) out.buttons = parsed;
            } catch {
                /* ignore */
            }
        }
        const v = get('variant', 'variant');
        if (v === 'filled' || v === 'tonal' || v === 'outlined' || v === 'elevated') out.variant = v;
        const s = get('size', 'size');
        if (s === 'xs' || s === 'sm' || s === 'md' || s === 'lg' || s === 'xl') out.size = s;
        const sh = get('shape', 'shape');
        const normalizedShape = ButtonGroups.normalizeShape(sh);
        if (normalizedShape) out.shape = normalizedShape;
        const t = get('type', 'type');
        // « segmented » = alias UX de « connected » (groupe lié M3, opposé à standard)
        if (t === 'standard' || t === 'connected' || t === 'segmented') {
            out.type = t === 'segmented' ? 'connected' : t;
        }
        const densityRaw = get('density', 'density');
        if (densityRaw !== null) {
            const density = parseInt(densityRaw, 10);
            if (density === 0 || density === -1 || density === -2 || density === -3) {
                out.density = density;
            }
        }
        const multi = get('multi-select', 'multi-select');
        if (multi !== null) out.multiSelect = multi === 'true' || multi === '1';
        const overflow = get('overflow-mode', 'overflow-mode');
        if (overflow === 'none' || overflow === 'wrap' || overflow === 'menu') out.overflowMode = overflow;
        const overflowIcon = get('overflow-button-icon', 'overflow-button-icon');
        if (overflowIcon) out.overflowButtonIcon = overflowIcon;
        const ratio = get('expanded-ratio', 'expanded-ratio');
        if (ratio !== null) {
            const n = parseFloat(ratio);
            if (!Number.isNaN(n) && n >= 0 && n <= 1) out.expandedRatio = n;
        }
        const defSel = get('default-selected', 'default-selected');
        if (defSel !== null) {
            try {
                const arr = JSON.parse(defSel) as number[];
                if (Array.isArray(arr)) out.defaultSelected = arr;
            } catch {
                const n = parseInt(defSel, 10);
                if (!Number.isNaN(n)) out.defaultSelected = [n];
            }
        }
        return out;
    }

    private init(): void {
        const configButtons = this.options.buttons ?? [];
        const existingChildren = this.collectDeclarativeChildButtons();

        if (existingChildren.length > 0 && configButtons.length === 0) {
            this.declarativeMode = true;
            this.initFromDeclarativeChildren(existingChildren);
            return;
        }

        if (configButtons.length === 0) {
            this.logger.warn('ButtonGroups: provide data-buttons JSON or child <button class="btn"> elements');
            return;
        }

        for (const item of configButtons) {
            if (!item.label?.trim() && !item.icon) {
                this.logger.warn('ButtonGroups: each button needs a label and/or icon');
            }
        }

        this.initFromConfig(configButtons);
    }

  /**
   * Boutons déjà présents dans le markup (pattern M3 : conteneur + Material Button)
   */
    private collectDeclarativeChildButtons(): HTMLButtonElement[] {
        return Array.from(this.el.querySelectorAll<HTMLButtonElement>(CHILD_BUTTON_SELECTOR)).filter(
            (btn) => !btn.classList.contains('button-groups__btn--overflow')
        );
    }

    private setupContainerClasses(): void {
        this.el.classList.add('button-groups');
        this.el.classList.add(`button-groups--${this.options.variant}`);
        this.el.classList.add(`button-groups--${this.options.size}`);
        this.el.classList.add(`button-groups--${this.options.shape}`);
        this.el.classList.add(`button-groups--${this.options.type}`);
        this.el.classList.add(`button-groups--overflow-${this.options.overflowMode}`);

        const density = this.options.density ?? 0;
        this.el.setAttribute('data-density', String(density));

        const ratio = this.options.expandedRatio ?? ButtonGroupsSpecs.behaviors.expandedRatio;
        this.el.style.setProperty('--button-groups-expanded-ratio', String(ratio));

        const gap =
            this.options.type === 'connected'
                ? ButtonGroupsSpecs.behaviors.gapConnected
                : ButtonGroupsSpecs.behaviors.gapStandard;
        this.el.style.setProperty('--button-groups-gap', `${gap}px`);

        this.applyDesignTokens();

        if (this.prefersReducedMotion()) {
            this.el.classList.add('button-groups--reduce-motion');
        } else {
            this.el.classList.remove('button-groups--reduce-motion');
        }

        this.applyGroupAria();
    }

    /**
     * Applique les CSS custom properties M3 (hauteur, padding, typo, rayons)
     */
    private applyDesignTokens(): void {
        const size = this.options.size ?? ButtonGroupsSpecs.behaviors.defaultSize;
        const shape = this.options.shape ?? ButtonGroupsSpecs.behaviors.defaultShape;
        const type = this.options.type ?? ButtonGroupsSpecs.behaviors.defaultType;
        const metrics = ButtonGroupsSpecs.sizes[size];
        const radiusVars = getButtonGroupsRadiusVars(size, shape, type);

        this.el.style.setProperty('--k3-button-groups-height', metrics.heightRem);
        this.el.style.setProperty('--k3-button-groups-height-' + size, metrics.heightRem);
        this.el.style.setProperty('--k3-button-groups-padding-x', `${metrics.paddingXDp}px`);
        this.el.style.setProperty('--k3-button-groups-font-size', metrics.fontSizeRem);
        this.el.style.setProperty('--k3-button-groups-line-height', metrics.lineHeightRem);
        this.el.style.setProperty('--k3-button-groups-font-weight', String(metrics.fontWeight));
        this.el.style.setProperty('--k3-button-groups-letter-spacing', metrics.letterSpacingRem);
        this.el.style.setProperty(
            '--k3-button-groups-font-family',
            `var(--md-sys-typescale-${metrics.typeScaleToken}-font-family-name)`
        );
        this.el.style.setProperty('--k3-button-groups-icon-size', `${metrics.iconSizeDp}px`);
        this.el.style.setProperty('--k3-button-groups-icon-gap', `${metrics.iconSpacingDp}px`);
        this.el.style.setProperty('--k3-button-groups-radius-inner', radiusVars.inner);
        this.el.style.setProperty('--k3-button-groups-radius-outer', radiusVars.outer);
        this.el.style.setProperty('--k3-button-groups-radius-full', radiusVars.full);
        this.el.style.setProperty(
            '--k3-button-groups-radius-square',
            `${ButtonGroupsSpecs.behaviors.cornerRadiusBySize[size]}px`
        );
    }

    /** Détecte prefers-reduced-motion (WCAG + M3 motion fallback) */
    private prefersReducedMotion(): boolean {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
            return false;
        }
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    private initFromDeclarativeChildren(children: HTMLButtonElement[]): void {
        this.setupContainerClasses();
        this.buttonElements = children;
        this.ownedButtonInstances = [];

        const total = children.length;
        children.forEach((btn, i) => {
            const active =
                this.selectedIndices.has(i) ||
                btn.getAttribute('aria-checked') === 'true' ||
                btn.getAttribute('aria-pressed') === 'true';
            if (active) this.selectedIndices.add(i);

            this.enhanceGroupButton(btn, i, total, active);
            this.initButtonComponent(btn);
            this.wireGroupToggle(btn, i);
        });

        this.finalizeInit();
    }

    private initFromConfig(buttons: ButtonGroupItem[]): void {
        this.setupContainerClasses();

        const fragment = document.createDocumentFragment();
        this.buttonElements = [];
        this.ownedButtonInstances = [];

        for (let i = 0; i < buttons.length; i++) {
            const item = buttons[i];
            const position = this.getPosition(i, buttons.length);
            const active = this.selectedIndices.has(i);
            const btn = this.createButtonFromItem(item, i, position, active);
            fragment.appendChild(btn);
            this.buttonElements.push(btn);
        }

        if (this.options.overflowMode === 'menu') {
            this.overflowButton = this.createOverflowButton();
            this.overflowMenu = this.createOverflowMenu();
            fragment.appendChild(this.overflowButton);
            fragment.appendChild(this.overflowMenu);
        }

        this.el.innerHTML = '';
        this.el.appendChild(fragment);

        this.finalizeInit();
    }

    private finalizeInit(): void {
        IconManager.processIconsInContainer(this.el);
        IconManager.forceDisplayIcons();

        if (this.options.type === 'standard' && !this.prefersReducedMotion()) {
            this.setupStandardPressExpansion();
        } else if (this.options.type === 'connected' && !this.prefersReducedMotion()) {
            this.setupConnectedPressMorph();
        } else if (this.options.type === 'connected' || this.options.type === 'standard') {
            this.setupStaticPressHandlers();
        }
        if (this.options.overflowMode === 'menu') {
            this.setupOverflowMenuLayout();
        }

        this.syncDomState();
        this.logger.info('ButtonGroups initialized');
    }

    /** Options minimales pour {@link Button.init} — ripple + variant (pas de morph shape Button) */
    private getButtonInitOptions(): Partial<ButtonOptions> {
        return {
            type: this.options.variant as ButtonOptions['type'],
            ripple: true,
        };
    }

    /** Retire les classes taille Button — dimensions gérées par SCSS button-groups */
    private stripButtonSizeClasses(btn: HTMLButtonElement): void {
        const sizes = ['xs', 'sm', 'md', 'lg', 'xl', 'xsmall', 'small', 'medium', 'large', 'xlarge'] as const;
        sizes.forEach((s) => btn.classList.remove(`btn--${s}`, `button--${s}`));
    }

    /** Classes variant sur chaque segment (shape gérée par SCSS button-groups) */
    private applyButtonGroupClasses(btn: HTMLButtonElement, active: boolean): void {
        const variant = this.options.variant ?? 'filled';
        const variants = ['filled', 'tonal', 'outlined', 'elevated', 'text'] as const;
        const buttonShapes = ['rounded', 'square'] as const;

        variants.forEach((v) => btn.classList.remove(`btn--${v}`, `button--${v}`));
        btn.classList.add(`btn--${variant}`, `button--${variant}`);

        buttonShapes.forEach((s) => btn.classList.remove(`btn--${s}`, `button--${s}`));
        if (this.options.type === 'standard') {
            const btnShape = ButtonGroups.toButtonShapeClass(this.options.shape ?? 'round');
            btn.classList.add(`btn--${btnShape}`, `button--${btnShape}`);
        }

        btn.classList.remove('btn--selected', 'button--selected', 'btn--unselected', 'button--unselected', 'selected');
        this.stripButtonSizeClasses(btn);
    }

    /** Met à jour les classes position (first / middle / last / standalone) */
    private updatePositionClasses(): void {
        const total = this.buttonElements.length;
        this.buttonElements.forEach((btn, i) => {
            btn.classList.remove(
                'button-groups__btn--standalone',
                'button-groups__btn--first',
                'button-groups__btn--middle',
                'button-groups__btn--last'
            );
            btn.classList.add(`button-groups__btn--${this.getPosition(i, total)}`);
        });
    }

    /**
     * Initialise ou resynchronise le composant Button sur l’élément
     */
    private initButtonComponent(btn: HTMLButtonElement): void {
        if (Button.getInstance(btn)) {
            return;
        }
        const instances = Button.init(btn, this.getButtonInitOptions());
        this.stripButtonSizeClasses(btn);
        if (instances[0]) {
            this.ownedButtonInstances.push(instances[0]);
        }
        if (this.options.type === 'connected') {
            btn.classList.remove('btn--rounded', 'button--rounded', 'btn--square', 'button--square');
        }
        this.stripButtonSizeClasses(btn);
    }

    private applyGroupAria(): void {
        if (this.options.multiSelect) {
            setAriaAttributes(this.el, { role: ButtonGroupsSpecs.accessibility.roleGroup });
        } else {
            setAriaAttributes(this.el, { role: ButtonGroupsSpecs.accessibility.roleRadioGroup });
        }
    }

    private getPosition(index: number, total: number): 'standalone' | 'first' | 'middle' | 'last' {
        if (this.options.type === 'standard' || total <= 1) return 'standalone';
        if (index === 0) return 'first';
        if (index === total - 1) return 'last';
        return 'middle';
    }

    /** Nettoie les styles inline — rayons 100 % SCSS (position + shape M3) */
    private applyButtonBorderRadius(btn: HTMLButtonElement): void {
        btn.style.borderTopLeftRadius = '';
        btn.style.borderTopRightRadius = '';
        btn.style.borderBottomRightRadius = '';
        btn.style.borderBottomLeftRadius = '';
        btn.style.borderRadius = '';
    }

    private wirePressMorph(btn: HTMLButtonElement, onPressExtra?: () => void, onReleaseExtra?: () => void): void {
        const onPressStart = (): void => {
            if (btn.disabled) return;
            btn.classList.add('button-groups__btn--pressing');
            onPressExtra?.();
        };
        const onPressEnd = (): void => {
            btn.classList.remove('button-groups__btn--pressing');
            onReleaseExtra?.();
        };
        this.registerEvent(btn, 'pointerdown', onPressStart);
        this.registerEvent(btn, 'pointerup', onPressEnd);
        this.registerEvent(btn, 'pointercancel', onPressEnd);
        this.registerEvent(btn, 'pointerleave', onPressEnd);
    }

    private isIconOnly(item: ButtonGroupItem): boolean {
        return Boolean(item.icon) && !item.label?.trim();
    }

    private ensureGroupLayers(btn: HTMLButtonElement): void {
        // Couches indicator/overlay retirées — états M3 via background direct (SCSS)
    }

    private enhanceGroupButton(
        btn: HTMLButtonElement,
        index: number,
        total: number,
        active: boolean
    ): void {
        if (!btn.classList.contains('btn') && !btn.classList.contains('button')) {
            btn.classList.add('btn');
        }
        if (!btn.classList.contains('ripple')) {
            btn.classList.add('ripple');
        }
        const position = this.getPosition(index, total);
        btn.classList.add('button-groups__btn');
        btn.classList.add(`button-groups__btn--${position}`);
        if (active) btn.classList.add('button-groups__btn--active');
        if (!btn.textContent?.trim() && btn.querySelector('.k3ui-icon, .icon, i[name]')) {
            btn.classList.add('button-groups__btn--icon-only');
        }
        btn.setAttribute('data-index', String(index));
        this.ensureGroupLayers(btn);
        this.applyButtonGroupClasses(btn, active);
        this.applyButtonAria(btn, active);
        this.applyButtonBorderRadius(btn);
    }

    private createButtonFromItem(
        item: ButtonGroupItem,
        index: number,
        position: 'standalone' | 'first' | 'middle' | 'last',
        active: boolean
    ): HTMLButtonElement {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.classList.add('btn', 'ripple', 'button-groups__btn', `button-groups__btn--${position}`);
        if (this.isIconOnly(item)) btn.classList.add('button-groups__btn--icon-only');
        if (active) btn.classList.add('button-groups__btn--active');
        btn.setAttribute('data-index', String(index));

        this.ensureGroupLayers(btn);
        this.applyButtonGroupClasses(btn, active);
        this.applyButtonAria(btn, active);
        this.applyButtonBorderRadius(btn);

        if (item.icon) {
            const iconEl = document.createElement('i');
            iconEl.className = 'icon k3ui-icon';
            iconEl.setAttribute('name', item.icon);
            iconEl.setAttribute('aria-hidden', 'true');
            btn.appendChild(iconEl);
        }

        if (item.value != null && item.value !== '') {
            btn.setAttribute('data-value', item.value);
        }

        if (item.label?.trim()) {
            const labelSpan = document.createElement('span');
            labelSpan.className = 'button-groups__label';
            labelSpan.textContent = item.label;
            btn.appendChild(labelSpan);
        }

        if (item.className) {
            item.className.split(/\s+/).forEach((c) => {
                if (c) btn.classList.add(c);
            });
        }
        if (item.attributes) {
            Object.entries(item.attributes).forEach(([name, value]) => {
                btn.setAttribute(name, value);
            });
        }
        if (item.style) {
            btn.style.cssText = btn.style.cssText ? `${btn.style.cssText};${item.style}` : item.style;
        }

        this.initButtonComponent(btn);
        this.wireGroupToggle(btn, index);
        return btn;
    }

    private wireGroupToggle(btn: HTMLButtonElement, index: number): void {
        this.registerEvent(btn, 'click', () => {
            if (btn.disabled) return;
            this.toggle(index);
            btn.blur();
        });
    }

    private applyButtonAria(btn: HTMLButtonElement, active: boolean): void {
        if (this.options.multiSelect) {
            removeAriaAttribute(btn, 'checked');
            btn.setAttribute('aria-pressed', String(active));
        } else {
            removeAriaAttribute(btn, 'pressed');
            btn.setAttribute('aria-checked', String(active));
        }
    }

    private createOverflowButton(): HTMLButtonElement {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className =
            'btn btn--icon btn--sm ripple button-groups__btn button-groups__btn--overflow';
        btn.setAttribute('aria-haspopup', 'menu');
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-label', 'Plus d’options');
        btn.hidden = true;

        const iconEl = document.createElement('i');
        iconEl.className = 'icon k3ui-icon';
        iconEl.setAttribute('name', this.options.overflowButtonIcon ?? 'ellipsis-vertical');
        iconEl.setAttribute('aria-hidden', 'true');
        btn.appendChild(iconEl);

        Button.init(btn, { type: 'tonal', size: 'sm', ripple: true });

        this.registerEvent(btn, 'click', (e) => {
            e.stopPropagation();
            this.toggleOverflowMenu();
        });
        return btn;
    }

    private createOverflowMenu(): HTMLUListElement {
        const ul = document.createElement('ul');
        ul.className = 'button-groups__overflow-menu';
        ul.setAttribute('role', 'menu');
        ul.hidden = true;
        return ul;
    }

    private toggleOverflowMenu(): void {
        if (!this.overflowMenu || !this.overflowButton) return;
        const open = !this.overflowMenu.hidden;
        this.overflowMenu.hidden = open;
        this.overflowButton.setAttribute('aria-expanded', String(!open));
    }

    private setupStandardPressExpansion(): void {
        const ratio = this.options.expandedRatio ?? ButtonGroupsSpecs.behaviors.expandedRatio;
        const neighborShrink = Math.max(0, 1 - ratio * 0.5);
        this.el.style.setProperty('--button-groups-neighbor-flex', String(neighborShrink));

        this.buttonElements.forEach((btn) => {
            this.wirePressMorph(
                btn,
                () => btn.style.setProperty('--button-groups-flex-grow', String(1 + ratio)),
                () => btn.style.removeProperty('--button-groups-flex-grow')
            );
        });
    }

    /** Connected / standard réduit — classe pressing sans expansion flex */
    private setupStaticPressHandlers(): void {
        this.buttonElements.forEach((btn) => {
            this.wirePressMorph(btn);
        });
    }

    /** Connected — morph shape au press (segment actif uniquement, M3) */
    private setupConnectedPressMorph(): void {
        this.setupStaticPressHandlers();
    }

    private setupOverflowMenuLayout(): void {
        const run = (): void => this.layoutOverflowMenu();
        this.resizeObserver = new ResizeObserver(run);
        this.resizeObserver.observe(this.el);
        this.registerEvent(window, 'resize', run);
        run();
    }

    private layoutOverflowMenu(): void {
        if (this.options.overflowMode !== 'menu' || !this.overflowButton || !this.overflowMenu) return;

        this.buttonElements.forEach((btn) => {
            btn.hidden = false;
            btn.style.display = '';
        });
        this.overflowButton.hidden = true;
        this.overflowMenu.hidden = true;
        this.overflowButton.setAttribute('aria-expanded', 'false');
        this.overflowMenu.innerHTML = '';

        const containerWidth = this.el.clientWidth;
        if (containerWidth <= 0) return;

        const overflowBtnWidth = 48;
        let used = 0;
        let visibleCount = 0;

        for (let i = 0; i < this.buttonElements.length; i++) {
            const btn = this.buttonElements[i];
            const w = btn.offsetWidth;
            const gapSpec =
                this.options.type === 'connected'
                    ? ButtonGroupsSpecs.behaviors.gapConnected
                    : ButtonGroupsSpecs.behaviors.gapStandard;
            const gap = i > 0 ? gapSpec : 0;
            const needsOverflowSlot = i < this.buttonElements.length - 1 || visibleCount > 0;
            const limit = containerWidth - (needsOverflowSlot ? overflowBtnWidth + 2 : 0);

            if (used + gap + w <= limit || visibleCount === 0) {
                used += gap + w;
                visibleCount++;
            } else {
                break;
            }
        }

        if (visibleCount >= this.buttonElements.length) {
            this.overflowVisibleCount = this.buttonElements.length;
            return;
        }

        this.overflowVisibleCount = Math.max(1, visibleCount);
        this.overflowButton.hidden = false;

        for (let i = this.overflowVisibleCount; i < this.buttonElements.length; i++) {
            this.buttonElements[i].hidden = true;
            const item = this.options.buttons?.[i];
            const label =
                item?.label?.trim() ||
                this.buttonElements[i].textContent?.trim() ||
                `Option ${i + 1}`;
            const li = document.createElement('li');
            li.setAttribute('role', 'none');
            const menuBtn = document.createElement('button');
            menuBtn.type = 'button';
            menuBtn.className = 'button-groups__overflow-menu-item';
            menuBtn.setAttribute('role', 'menuitem');
            menuBtn.textContent = label;
            this.registerEvent(menuBtn, 'click', () => {
                this.overflowMenu!.hidden = true;
                this.overflowButton!.setAttribute('aria-expanded', 'false');
                this.toggle(i);
            });
            li.appendChild(menuBtn);
            this.overflowMenu.appendChild(li);
        }
    }

    private toggle(index: number): void {
        if (this.options.multiSelect) {
            if (this.selectedIndices.has(index)) {
                this.selectedIndices.delete(index);
            } else {
                this.selectedIndices.add(index);
            }
        } else {
            this.selectedIndices = new Set([index]);
        }
        this.syncDomState();
        const arr = Array.from(this.selectedIndices).sort((a, b) => a - b);
        if (this.options.onSelect) this.options.onSelect(arr);
    }

    private syncDomState(): void {
        this.updatePositionClasses();
        this.buttonElements.forEach((btn, i) => {
            const active = this.selectedIndices.has(i);
            btn.classList.toggle('button-groups__btn--active', active);
            this.applyButtonGroupClasses(btn, active);
            this.applyButtonAria(btn, active);
            this.applyButtonBorderRadius(btn);
        });
        if (this.options.overflowMode === 'menu') {
            this.layoutOverflowMenu();
        }
    }

    /** @returns Indices sélectionnés */
    getSelectedIndices(): number[] {
        return Array.from(this.selectedIndices).sort((a, b) => a - b);
    }

    /** Définit la sélection sans déclencher onSelect */
    setSelectedIndices(indices: number[]): void {
        const max = this.buttonElements.length;
        this.selectedIndices = new Set(indices.filter((i) => i >= 0 && i < max));
        this.syncDomState();
    }

    public override destroy(): void {
        this.resizeObserver?.disconnect();
        this.resizeObserver = null;

        this.ownedButtonInstances.forEach((instance) => {
            instance.destroy();
        });
        this.ownedButtonInstances = [];
        this.buttonElements = [];
        this.overflowButton = null;
        this.overflowMenu = null;
        this.selectedIndices.clear();

        if ((this.el as KButtonGroupsHTMLElement).K_ButtonGroups === this) {
            delete (this.el as KButtonGroupsHTMLElement).K_ButtonGroups;
        }
        this.clearContainerState();
        this.logger.info('ButtonGroups destroyed');
        super.destroy();
    }

    /** Retire les attributs/classes ajoutés par le composant (ré-init propre) */
    private clearContainerState(): void {
        if (!this.el) return;
        this.el.removeAttribute('data-density');
        [
            '--button-groups-expanded-ratio',
            '--button-groups-gap',
            '--button-groups-neighbor-flex',
            '--k3-button-groups-height',
            '--k3-button-groups-padding-x',
            '--k3-button-groups-font-size',
            '--k3-button-groups-icon-size',
            '--k3-button-groups-icon-gap',
            '--k3-button-groups-radius-inner',
            '--k3-button-groups-radius-outer',
            '--k3-button-groups-radius-full',
        ].forEach((prop) => this.el!.style.removeProperty(prop));
        ['xs', 'sm', 'md', 'lg', 'xl'].forEach((s) =>
            this.el!.style.removeProperty(`--k3-button-groups-height-${s}`)
        );
        Array.from(this.el.classList)
            .filter((cls) => cls === 'button-groups' || cls.startsWith('button-groups--'))
            .forEach((cls) => this.el!.classList.remove(cls));
    }
}

if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-button-groups')) {
    customElements.define('k3ui-button-groups', class K3UIButtonGroupsElement extends HTMLElement {
        connectedCallback(): void {
            if (!this.hasAttribute('data-initialized')) {
                this.setAttribute('data-initialized', 'true');
            }
        }

        disconnectedCallback(): void {
            const instance = (this as KButtonGroupsHTMLElement).K_ButtonGroups;
            if (instance) {
                instance.destroy();
            }
        }
    });
}
