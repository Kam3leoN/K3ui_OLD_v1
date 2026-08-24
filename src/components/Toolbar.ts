/**
 * @fileoverview Composant Toolbar K3UI — M3 Expressive
 * @description Barre d'actions floating / docked ; items = ButtonIcon ; dualAction = ButtonSplit
 * @see https://m3.material.io/components/toolbars/overview
 * @see https://m3.material.io/components/icon-buttons/overview
 * @see https://m3.material.io/components/buttons/overview#split-button
 * @author K3UI Team
 * @version 1.3.0
 */

import { Component } from '../core/base/Component';
import { defineK3UIElement } from '../core/base/K3UIElement';
import { toComponentClassDef } from '../types/components/component-base';
import type { ButtonSplitOptions, ToolbarItem, ToolbarItemWidth, ToolbarOptions } from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { setAriaAttributes } from '../utils/dom/aria';
import { LoggerManager, IconManager } from '../core/managers';
import { ManagerFactory } from '../core/factories';
import { getToolbarDefaults, ToolbarSpecs } from '../specs/components/toolbar.specs';
import { ButtonIcon } from './ButtonIcon';
import { ButtonSplit } from './ButtonSplit';
import { Tooltips } from './Tooltips';

interface KToolbarHTMLElement extends HTMLElement {
    K_Toolbar?: Toolbar;
}

/** Entrée interne : un slot logique de toolbar (simple ou split) */
interface ToolbarSlot {
    index: number;
    id: string;
    root: HTMLElement;
    buttons: HTMLButtonElement[];
    item?: ToolbarItem;
    /** Largeur de base (API / data-width) — hors morph sélection */
    baseWidth: ToolbarItemWidth;
    /** Largeur figée (narrow|wide) — pas d’expansion sélection */
    lockedWidth?: ToolbarItemWidth;
    /** Slot dual via ButtonSplit */
    isSplit?: boolean;
}

const _defaults: ToolbarOptions = getToolbarDefaults();

/** Taille ButtonIcon / ButtonSplit des items toolbar (M3 compact) */
const TOOLBAR_ICON_SIZE = 'sm' as const;

/**
 * Toolbar M3 Expressive — actions fréquentes de la page courante.
 * Compose {@link ButtonIcon} (largeurs) et {@link ButtonSplit} (dualAction).
 */
export class Toolbar extends Component<ToolbarOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;
    private logger: LoggerManager;
    private itemsEl: HTMLElement | null = null;
    private slots: ToolbarSlot[] = [];
    private selectedIndices: Set<number> = new Set();
    private tooltipInstances: Tooltips[] = [];
    /** Instances ButtonIcon créées / adoptées par cette toolbar */
    private ownedButtonIcons: ButtonIcon[] = [];
    /** Instances ButtonSplit (items dualAction) */
    private ownedButtonSplits: ButtonSplit[] = [];

    static get defaults(): ToolbarOptions {
        return { ..._defaults };
    }

    static getInstance(el: HTMLElement): Toolbar | null {
        return (el as KToolbarHTMLElement).K_Toolbar ?? null;
    }

    static init(
        els: KElement | InitElements<KElement> | string,
        options: Partial<ToolbarOptions> = {}
    ): Toolbar[] {
        return Component.init(els, options, toComponentClassDef(Toolbar)) as Toolbar[];
    }

    constructor(el: HTMLElement, options: Partial<ToolbarOptions> = {}) {
        super(el, options, toComponentClassDef(Toolbar));
        this.logger = ManagerFactory.getLoggerManager('[Toolbar]');

        const fromHtml = Toolbar.readAttributes(el);
        this.options = {
            ...Toolbar.defaults,
            ...options,
            ...fromHtml,
        } as ToolbarOptions;

        const def = this.options.defaultSelected;
        this.selectedIndices = new Set(Array.isArray(def) ? def : [def ?? 0]);

        (el as KToolbarHTMLElement).K_Toolbar = this;
        this.init();
    }

    private static readAttributes(el: HTMLElement): Partial<ToolbarOptions> {
        const out: Partial<ToolbarOptions> = {};
        const get = (name: string) => el.getAttribute(`data-${name}`);

        const layout = get('layout');
        if (layout === 'floating' || layout === 'docked') out.layout = layout;

        const variant = get('variant');
        if (variant === 'elevated' || variant === 'filled' || variant === 'tonal') {
            out.variant = variant;
        } else if (variant === 'vibrant' || variant === 'primary') {
            out.variant = 'filled';
        } else if (
            variant === 'standard' ||
            variant === 'secondary' ||
            variant === 'tertiary'
        ) {
            out.variant = 'tonal';
        }

        /* Legacy data-elevation → variante elevated */
        const elevation = get('elevation');
        if (!out.variant && (elevation === 'small' || elevation === 'medium' || elevation === 'large')) {
            out.variant = 'elevated';
        }

        const orientation = get('orientation');
        if (orientation === 'horizontal' || orientation === 'vertical') out.orientation = orientation;
        const showContainer = get('show-container');
        if (showContainer !== null) out.showContainer = showContainer !== 'false' && showContainer !== '0';
        const inverseSurface = get('inverse-surface');
        if (inverseSurface !== null) out.inverseSurface = inverseSurface === 'true' || inverseSurface === '1';
        const showTooltips = get('show-tooltips');
        if (showTooltips !== null) out.showTooltips = showTooltips !== 'false' && showTooltips !== '0';
        const tooltipPlacement = get('tooltip-placement');
        if (tooltipPlacement) out.tooltipPlacement = tooltipPlacement as ToolbarOptions['tooltipPlacement'];
        const checkable = get('checkable');
        if (checkable !== null) out.checkable = checkable !== 'false' && checkable !== '0';
        const multi = get('multi-select');
        if (multi !== null) out.multiSelect = multi === 'true' || multi === '1';

        const itemsJson = get('items');
        if (itemsJson) {
            try {
                const parsed = JSON.parse(itemsJson) as ToolbarItem[];
                if (Array.isArray(parsed)) out.items = parsed;
            } catch {
                /* ignore */
            }
        }
        return out;
    }

    private init(): void {
        this.el.classList.add('toolbar');
        this.applyModifierClasses();

        setAriaAttributes(this.el, { role: ToolbarSpecs.accessibility.role });

        if (this.options.items?.length) {
            this.buildFromItems();
        } else {
            this.collectDeclarativeItems();
        }

        this.applySelectionState();
        this.attachEvents();
        this.initTooltips();
        IconManager.processIconsInContainer(this.el);
        this.logger.info('Toolbar initialized');
    }

    private applyModifierClasses(): void {
        const { layout, variant, orientation, showContainer, inverseSurface } = this.options;
        const layouts = ['floating', 'docked'];
        const variants = [
            'elevated',
            'filled',
            'tonal',
            /* legacy */
            'standard',
            'vibrant',
            'primary',
            'secondary',
            'tertiary',
        ];
        const orientations = ['horizontal', 'vertical'];
        const elevations = ['none', 'small', 'medium', 'large'];
        const labelPositions = ['bottom', 'end'];

        layouts.forEach((l) => this.el.classList.remove(`toolbar--${l}`));
        variants.forEach((v) => this.el.classList.remove(`toolbar--${v}`));
        orientations.forEach((o) => this.el.classList.remove(`toolbar--${o}`));
        elevations.forEach((e) => this.el.classList.remove(`toolbar--elevation-${e}`));
        labelPositions.forEach((p) => this.el.classList.remove(`toolbar--label-${p}`));
        this.el.classList.remove('toolbar__item--labeled');

        this.el.classList.toggle('toolbar--bare', !showContainer);
        this.el.classList.toggle('toolbar--inverse', Boolean(inverseSurface));
        this.el.classList.add(`toolbar--${layout}`, `toolbar--${variant}`, `toolbar--${orientation}`);
    }

    private buildFromItems(): void {
        this.el.innerHTML = '';
        const itemsWrap = document.createElement('div');
        itemsWrap.className = 'toolbar__items';
        this.el.appendChild(itemsWrap);
        this.itemsEl = itemsWrap;
        this.slots = [];
        this.destroyOwnedButtonIcons();
        this.destroyOwnedButtonSplits();

        (this.options.items ?? []).forEach((item, index) => {
            const node = this.createItemNode(item, index);
            itemsWrap.appendChild(node);
            this.registerSlot(node, index, item);
        });
    }

    private collectDeclarativeItems(): void {
        this.itemsEl = this.el.querySelector('.toolbar__items') ?? this.el;
        this.slots = [];
        this.destroyOwnedButtonIcons();
        this.destroyOwnedButtonSplits();

        const roots = Array.from(
            this.itemsEl.querySelectorAll(
                ':scope > .toolbar__split, :scope > .split-btn, :scope > .button-split, :scope > .toolbar__compound, :scope > .toolbar__item, :scope > [data-toolbar-item]'
            )
        ) as HTMLElement[];

        roots.forEach((root, index) => {
            if (this.isSplitRoot(root)) {
                this.enhanceSplitFromDom(root);
                this.registerSlot(root, index);
            } else if (root.classList.contains('toolbar__compound')) {
                this.enhanceCompoundFromDom(root);
                this.registerSlot(root, index);
            } else {
                const btn = root as HTMLButtonElement;
                if (!btn.classList.contains('toolbar__item')) btn.classList.add('toolbar__item');
                this.enhanceItemButtonFromDom(btn);
                this.registerSlot(btn, index);
            }
        });
    }

    private isSplitRoot(root: HTMLElement): boolean {
        return (
            root.classList.contains('toolbar__split') ||
            root.classList.contains('split-btn') ||
            root.classList.contains('button-split') ||
            root.classList.contains('split-button')
        );
    }

    private registerSlot(root: HTMLElement, index: number, item?: ToolbarItem): void {
        const id = root.getAttribute('data-id') ?? item?.id ?? `item-${index}`;
        const isSplit = this.isSplitRoot(root);
        const isCompound = root.classList.contains('toolbar__compound');

        let buttons: HTMLButtonElement[];
        if (isSplit) {
            buttons = Array.from(
                root.querySelectorAll(
                    '.split-btn__leading, .split-button__leading, .button-split__leading, .split-btn__trailing, .split-button__trailing, .button-split__trailing'
                )
            ) as HTMLButtonElement[];
        } else if (isCompound) {
            buttons = Array.from(
                root.querySelectorAll('.toolbar__item-part, .toolbar__item')
            ) as HTMLButtonElement[];
        } else {
            buttons = [root as HTMLButtonElement];
        }

        const primary = isSplit
            ? (root.querySelector<HTMLElement>(
                  '.split-btn__leading, .split-button__leading, .button-split__leading'
              ) ?? root)
            : isCompound
              ? (root.querySelector<HTMLElement>('.toolbar__item-part--primary') ?? root)
              : root;
        const baseWidth = this.resolveBaseWidth(primary, item);
        const lockedWidth = baseWidth === 'narrow' || baseWidth === 'wide' ? baseWidth : undefined;
        this.slots.push({ index, id, root, buttons, item, baseWidth, lockedWidth, isSplit });
    }

    /**
     * Largeur déclarée (item API, data-width, ou classes initiales).
     * Ne pas rappeler après morph sélection — utiliser slot.baseWidth.
     */
    private resolveBaseWidth(el: HTMLElement, item?: ToolbarItem): ToolbarItemWidth {
        if (item?.width === 'narrow' || item?.width === 'wide' || item?.width === 'default') {
            return item.width;
        }
        const fromData = el.getAttribute('data-width') as ToolbarItemWidth | null;
        if (fromData === 'narrow' || fromData === 'wide' || fromData === 'default') return fromData;
        if (el.classList.contains('btn-icon--narrow') || el.classList.contains('button-icon--narrow')) {
            return 'narrow';
        }
        if (el.classList.contains('btn-icon--wide') || el.classList.contains('button-icon--wide')) {
            return 'wide';
        }
        return 'default';
    }

    private enhanceItemButtonFromDom(btn: HTMLButtonElement): void {
        btn.classList.remove('toolbar__item--labeled', 'toolbar__item--label-bottom', 'toolbar__item--label-end');
        btn.classList.add('toolbar__item--icon-only');
        btn.type = btn.type || 'button';

        const accessible =
            btn.getAttribute('aria-label') ??
            btn.getAttribute('data-label') ??
            btn.getAttribute('data-tooltip') ??
            'Action';
        if (!btn.getAttribute('aria-label')) {
            btn.setAttribute('aria-label', accessible);
        }
        if (!btn.getAttribute('data-tooltip')) {
            btn.setAttribute('data-tooltip', accessible);
        }

        const width = this.readWidthFromElement(btn);
        this.mountButtonIcon(btn, width, false);
    }

    private enhanceCompoundFromDom(compound: HTMLElement): void {
        compound.querySelectorAll<HTMLButtonElement>('.toolbar__item-part, .toolbar__item').forEach((btn) => {
            const part = (btn.getAttribute('data-part') ?? 'primary') as 'primary' | 'secondary';
            const width = part === 'secondary' ? 'narrow' : this.readWidthFromElement(btn);
            btn.classList.add('toolbar__item--icon-only');
            btn.classList.remove('toolbar__item--labeled');
            this.mountButtonIcon(btn, width, false);
        });
    }

    /**
     * Adopte / monte un {@link ButtonSplit} déclaratif dans la toolbar.
     */
    private enhanceSplitFromDom(root: HTMLElement): void {
        root.classList.add('toolbar__item', 'toolbar__split', 'no-autoinit');
        const leadingIcon =
            root.getAttribute('data-leading-icon') ??
            root.querySelector('.k3ui-icon[name]')?.getAttribute('name') ??
            'edit';
        const iconType = this.resolveSplitIconType(
            root.getAttribute('data-icon-type') ?? root.getAttribute('data-secondary-icon')
        );

        let instance = ButtonSplit.getInstance(root);
        if (!instance) {
            const created = ButtonSplit.init(root, {
                label: '',
                leadingIcon,
                iconType,
                size: TOOLBAR_ICON_SIZE,
                variant: 'tonal',
                shape: 'rounded',
            });
            instance = created[0] ?? ButtonSplit.getInstance(root);
        }
        if (instance && !this.ownedButtonSplits.includes(instance)) {
            this.ownedButtonSplits.push(instance);
        }
        this.tagSplitParts(root);
    }

    private readWidthFromElement(el: HTMLElement): ToolbarItemWidth {
        const data = el.getAttribute('data-width') as ToolbarItemWidth | null;
        if (data === 'narrow' || data === 'wide' || data === 'default') return data;
        if (el.classList.contains('btn-icon--narrow') || el.classList.contains('button-icon--narrow')) {
            return 'narrow';
        }
        if (el.classList.contains('btn-icon--wide') || el.classList.contains('button-icon--wide')) {
            return 'wide';
        }
        return 'default';
    }

    private createItemNode(item: ToolbarItem, index: number): HTMLElement {
        if (item.dualAction && item.secondaryIcon) {
            return this.createCompoundItem(item, index);
        }
        return this.createSimpleItem(item, index);
    }

    private createSimpleItem(item: ToolbarItem, index: number): HTMLButtonElement {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'toolbar__item toolbar__item--icon-only';
        btn.setAttribute('data-id', item.id);
        btn.setAttribute('data-toolbar-item', 'true');
        if (item.disabled) btn.disabled = true;

        const accessible = item.ariaLabel ?? item.label ?? item.id;
        btn.setAttribute('aria-label', accessible);
        this.applyTooltipAttr(btn, item.tooltip ?? item.label ?? accessible);
        this.applyItemTone(btn, item.tone);

        btn.appendChild(this.createIconWrap(item.icon));

        if (item.selected) this.selectedIndices.add(index);

        const width = item.width ?? 'default';
        if (width !== 'default') btn.setAttribute('data-width', width);
        this.mountButtonIcon(btn, width, Boolean(item.selected));

        return btn;
    }

    private createCompoundItem(item: ToolbarItem, index: number): HTMLElement {
        const root = document.createElement('div');
        root.className = 'toolbar__item toolbar__split no-autoinit';
        root.setAttribute('data-toolbar-item', 'true');
        root.setAttribute('data-id', item.id);
        if (item.disabled) root.setAttribute('aria-disabled', 'true');

        const iconType = this.resolveSplitIconType(item.secondaryIcon);
        const created = ButtonSplit.init(root, {
            label: '',
            leadingIcon: item.icon,
            iconType,
            size: TOOLBAR_ICON_SIZE,
            variant: 'tonal',
            shape: 'rounded',
        });
        const instance = created[0] ?? ButtonSplit.getInstance(root);
        if (instance && !this.ownedButtonSplits.includes(instance)) {
            this.ownedButtonSplits.push(instance);
        }

        this.tagSplitParts(root, item);
        this.applyTooltipAttr(
            root.querySelector('.split-btn__leading, .split-button__leading, .button-split__leading') as HTMLElement,
            item.tooltip ?? item.label ?? item.ariaLabel ?? item.id
        );

        if (item.selected) this.selectedIndices.add(index);
        this.applyItemTone(root, item.tone);
        return root;
    }

    /**
     * Mappe secondaryIcon / data-icon-type vers ButtonSplit.iconType.
     */
    private resolveSplitIconType(raw?: string | null): ButtonSplitOptions['iconType'] {
        if (!raw) return 'chevron';
        const v = raw.toLowerCase();
        if (v.includes('ellipsis') || v === 'ellipsis') return 'ellipsis';
        if (v.includes('arrow')) return 'arrow';
        return 'chevron';
    }

    /** Marque leading = primary, trailing = secondary pour les handlers toolbar. */
    private tagSplitParts(root: HTMLElement, item?: ToolbarItem): void {
        const leading = root.querySelector(
            '.split-btn__leading, .split-button__leading, .button-split__leading'
        ) as HTMLButtonElement | null;
        const trailing = root.querySelector(
            '.split-btn__trailing, .split-button__trailing, .button-split__trailing'
        ) as HTMLButtonElement | null;

        if (leading) {
            leading.setAttribute('data-part', 'primary');
            leading.setAttribute('data-id', item?.id ?? root.getAttribute('data-id') ?? '');
            leading.setAttribute(
                'aria-label',
                item?.ariaLabel ?? item?.label ?? item?.id ?? leading.getAttribute('aria-label') ?? 'Action'
            );
            if (item?.disabled) leading.disabled = true;
        }
        if (trailing) {
            trailing.setAttribute('data-part', 'secondary');
            trailing.setAttribute('data-id', item?.id ?? root.getAttribute('data-id') ?? '');
            if (item?.secondaryAriaLabel) {
                trailing.setAttribute('aria-label', item.secondaryAriaLabel);
            }
            if (item?.disabled) trailing.disabled = true;
        }
    }

    /**
     * Monte / adopte une instance {@link ButtonIcon} avec largeur M3 (narrow | default | wide).
     */
    private mountButtonIcon(
        btn: HTMLButtonElement,
        width: ToolbarItemWidth,
        selected: boolean
    ): ButtonIcon {
        btn.classList.add('btn-icon', `btn-icon--${TOOLBAR_ICON_SIZE}`, 'btn-icon--standard', 'ripple');
        if (width === 'narrow') {
            btn.classList.add('btn-icon--narrow', 'button-icon--narrow');
        } else if (width === 'wide') {
            btn.classList.add('btn-icon--wide', 'button-icon--wide');
        }

        let instance = ButtonIcon.getInstance(btn);
        if (!instance) {
            const created = ButtonIcon.init(btn, {
                size: TOOLBAR_ICON_SIZE,
                width,
                variant: 'standard',
                selected,
                ripple: true,
            });
            instance = created[0] ?? ButtonIcon.getInstance(btn);
        } else {
            instance.setSize(TOOLBAR_ICON_SIZE);
            instance.setWidth(width);
            instance.setSelected(selected);
        }

        if (instance && !this.ownedButtonIcons.includes(instance)) {
            this.ownedButtonIcons.push(instance);
        }
        return instance!;
    }

    private createIconWrap(iconName: string): HTMLSpanElement {
        const iconWrap = document.createElement('span');
        iconWrap.className = 'btn-icon__icon toolbar__item-icon';
        const icon = document.createElement('i');
        icon.className = 'k3ui-icon';
        icon.setAttribute('name', iconName);
        icon.setAttribute('aria-hidden', 'true');
        iconWrap.appendChild(icon);
        return iconWrap;
    }

    private applyItemTone(el: HTMLElement, tone?: ToolbarItem['tone']): void {
        el.classList.remove('toolbar__item--destructive', 'toolbar__item--emphasized');
        if (tone === 'destructive') el.classList.add('toolbar__item--destructive');
        if (tone === 'emphasized') el.classList.add('toolbar__item--emphasized');
    }

    private applyTooltipAttr(el: HTMLElement | null, tooltip?: string): void {
        if (el && tooltip) {
            el.setAttribute('data-tooltip', tooltip);
        }
    }

    private initTooltips(): void {
        if (!this.options.showTooltips) return;

        this.slots.forEach(({ buttons }) => {
            buttons.forEach((btn) => {
                const content = btn.getAttribute('data-tooltip');
                if (!content) return;
                const result = Tooltips.init(btn, {
                    content,
                    placement: this.options.tooltipPlacement,
                });
                const instances = Array.isArray(result) ? result : result ? [result] : [];
                this.tooltipInstances.push(...instances);
            });
        });
    }

    private attachEvents(): void {
        this.slots.forEach((slot) => {
            slot.buttons.forEach((btn) => {
                const part = (btn.getAttribute('data-part') ?? 'primary') as 'primary' | 'secondary';
                this.registerEvent(btn, 'click', (e: Event) => {
                    if (btn.disabled) return;
                    /* ButtonSplit gère déjà preventDefault sur leading/trailing */
                    if (!slot.isSplit) e.preventDefault();
                    this.handleItemClick(slot.index, part, slot.item);
                });
            });
        });
    }

    private handleItemClick(index: number, part: 'primary' | 'secondary', item?: ToolbarItem): void {
        const resolvedItem = item ?? this.options.items?.[index];
        if (resolvedItem) {
            this.options.onItemClick?.({ item: resolvedItem, index, part });
        }

        if (part === 'secondary') return;

        if (this.options.checkable) {
            this.toggleIndex(index);
        }
    }

    private toggleIndex(index: number): void {
        if (!this.options.multiSelect) {
            this.selectedIndices.clear();
            this.selectedIndices.add(index);
        } else if (this.selectedIndices.has(index)) {
            this.selectedIndices.delete(index);
        } else {
            this.selectedIndices.add(index);
        }
        this.applySelectionState();
        this.options.onSelect?.(Array.from(this.selectedIndices).sort((a, b) => a - b));
    }

    private applySelectionState(): void {
        this.slots.forEach((slot) => {
            const active = this.options.checkable && this.selectedIndices.has(slot.index);
            slot.root.classList.toggle('toolbar__item--active', active);
            slot.root.classList.toggle(
                'toolbar__compound--active',
                active && slot.root.classList.contains('toolbar__compound')
            );
            slot.root.classList.toggle(
                'toolbar__split--active',
                active && Boolean(slot.isSplit)
            );

            slot.buttons.forEach((btn) => {
                btn.classList.toggle('toolbar__item--active', active);
                this.syncButtonIconState(btn, slot, active);

                if (this.options.checkable) {
                    setAriaAttributes(btn, { 'aria-pressed': active ? 'true' : 'false' });
                }
                if (active) {
                    btn.setAttribute('data-selected', 'true');
                } else {
                    btn.removeAttribute('data-selected');
                }
            });
        });
    }

    /**
     * Synchronise sélection + largeur ButtonIcon (sélection → wide si non verrouillé).
     * Applique aussi les classes en direct : Tooltips (priorité HIGH) peut avoir
     * remplacé ButtonIcon dans le ComponentRegistry sans retirer les classes.
     */
    private syncButtonIconState(btn: HTMLButtonElement, slot: ToolbarSlot, active: boolean): void {
        if (btn.classList.contains('toolbar__item--labeled')) return;

        const part = btn.getAttribute('data-part');
        /* Secondary compound : toujours narrow */
        if (part === 'secondary') {
            this.applyButtonIconWidthClasses(btn, 'narrow');
            this.applyButtonIconSelectedClasses(btn, false);
            ButtonIcon.getInstance(btn)?.setWidth('narrow');
            ButtonIcon.getInstance(btn)?.setSelected(false);
            return;
        }

        const baseWidth: ToolbarItemWidth = slot.baseWidth;

        const expandToWide =
            this.options.checkable &&
            active &&
            !slot.isSplit &&
            !slot.root.classList.contains('toolbar__compound') &&
            slot.lockedWidth !== 'narrow' &&
            slot.lockedWidth !== 'wide' &&
            baseWidth === 'default';

        const width: ToolbarItemWidth = expandToWide ? 'wide' : baseWidth;
        const selected = active && this.options.checkable;

        this.applyButtonIconWidthClasses(btn, width);
        this.applyButtonIconSelectedClasses(btn, selected);

        const instance = ButtonIcon.getInstance(btn);
        if (instance) {
            instance.setWidth(width);
            instance.setSelected(selected);
        }
    }

    /** Classes de largeur M3 (indépendantes de l’instance ButtonIcon). */
    private applyButtonIconWidthClasses(btn: HTMLElement, width: ToolbarItemWidth): void {
        btn.classList.remove(
            'btn-icon--narrow',
            'button-icon--narrow',
            'btn-icon--wide',
            'button-icon--wide'
        );
        if (width === 'narrow') {
            btn.classList.add('btn-icon--narrow', 'button-icon--narrow');
        } else if (width === 'wide') {
            btn.classList.add('btn-icon--wide', 'button-icon--wide');
        }
    }

    /** Classes selected M3 (indépendantes de l’instance ButtonIcon). */
    private applyButtonIconSelectedClasses(btn: HTMLElement, selected: boolean): void {
        btn.classList.toggle('btn-icon--selected', selected);
        btn.classList.toggle('button-icon--selected', selected);
    }

    private destroyOwnedButtonIcons(): void {
        this.ownedButtonIcons.forEach((icon) => {
            try {
                icon.destroy();
            } catch {
                /* ignore */
            }
        });
        this.ownedButtonIcons = [];
    }

    private destroyOwnedButtonSplits(): void {
        this.ownedButtonSplits.forEach((split) => {
            try {
                split.destroy();
            } catch {
                /* ignore */
            }
        });
        this.ownedButtonSplits = [];
    }

    /**
     * Indices sélectionnés
     */
    getSelectedIndices(): number[] {
        return Array.from(this.selectedIndices).sort((a, b) => a - b);
    }

    /**
     * Met à jour le layout (floating | docked)
     */
    setLayout(layout: ToolbarOptions['layout']): void {
        this.options.layout = layout;
        this.applyModifierClasses();
    }

    setVariant(variant: ToolbarOptions['variant']): void {
        this.options.variant = variant;
        this.applyModifierClasses();
    }

    /**
     * Affiche ou masque le conteneur pill
     */
    setShowContainer(show: boolean): void {
        this.options.showContainer = show;
        this.applyModifierClasses();
    }

    destroy(): void {
        this.tooltipInstances.forEach((t) => t.destroy());
        this.tooltipInstances = [];
        this.destroyOwnedButtonIcons();
        this.destroyOwnedButtonSplits();
        delete (this.el as KToolbarHTMLElement).K_Toolbar;
        super.destroy();
    }
}

/**
 * Custom Element `<k3ui-toolbar>` — monte l’instance Toolbar depuis les attributs data-*.
 */
defineK3UIElement('k3ui-toolbar', Toolbar, {
    onConnected: (el: HTMLElement): void => {
        if (!el.classList.contains('toolbar')) {
            el.classList.add('toolbar');
        }
    },
});
