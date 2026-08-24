/**
 * @fileoverview Composant List pour K3UI - Material Design 3 Expressive
 * @description Listes avec leading/trailing, drag & drop, swipe
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import type { ListOptions, ListConfig, ListItemData, ListItemAvatar } from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { setAriaAttributes } from '../utils/dom/aria';
import { LoggerManager, LocaleManager, IconManager } from '../core/managers';
import { ManagerFactory } from '../core/factories';
import { getListDefaults, getListSegmentedBorderRadius, ListSpecs } from '../specs';
import { ripple } from '../utils/effects/ripple';
import { Switch } from './Switch';
import { Checkbox } from './Checkbox';
import { Snackbar } from './Snackbar';
import { bindPointerDown, getPointerCoords, startPointerDragSession } from '../utils/dom/pointer';

// ============================================================================
// ICÔNES VIA ICONMANAGER
// ============================================================================

/** Crée un élément icône pour IconManager (i.k3ui-icon avec name, size, color). */
function createListIcon(name: string, sizePx: number = 24, color?: string): HTMLElement {
    const i = document.createElement('i');
    i.className = 'k3ui-icon';
    i.setAttribute('name', name);
    i.setAttribute('aria-hidden', 'true');
    i.setAttribute('size', sizePx === 20 ? 'lg' : 'xl');
    if (color) i.setAttribute('color', color);
    (i as HTMLElement).style.flexShrink = '0';
    (i as HTMLElement).style.display = 'block';
    return i;
}

const IMG_GRADIENTS = [
    'linear-gradient(135deg,#FF6B35,#FFD93D)',
    'linear-gradient(135deg,#6750A4,#D0BCFF)',
    'linear-gradient(135deg,#00BCD4,#B2EBF2)',
    'linear-gradient(135deg,#4CAF50,#C8E6C9)',
    'linear-gradient(135deg,#FF5722,#FFCCBC)',
];

function segBRIsolated(): string {
    return `${ListSpecs.radii.segmentedActivePx}px`;
}

/** Border-radius par groupe : premier item du groupe (coins hauts), dernier (coins bas), milieu (4px). */
function segBRForGroup(isFirstInGroup: boolean, isLastInGroup: boolean): string {
    return getListSegmentedBorderRadius({ grouped: true, isFirstInGroup, isLastInGroup });
}

// ============================================================================
// CLASSE LIST
// ============================================================================

interface KListHTMLElement extends HTMLElement {
    K_List?: List;
}

export class List extends Component<ListOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    private logger: LoggerManager;
    private items: ListItemData[] = [];
    private selectedId: string | number | null = null;
    private checked: Record<string | number, boolean> = {};
    private switches: Record<string | number, boolean> = {};
    private dragIdx: number | null = null;
    private dropIdx: number | null = null;
    private containerEl: HTMLElement | null = null;
    private rippleInstances: ReturnType<typeof ripple.create>[] = [];
    private childComponents: { switch: Switch[]; checkbox: Checkbox[] } = { switch: [], checkbox: [] };
    private swipeState = new Map<string | number, { x: number; action: 'delete' | 'archive' | null }>();
    private swipeStart = new Map<string | number, { x: number; y: number }>();
    private mouseSwipeActive = false;
    /** IDs des items dont le contenu expand est ouvert */
    private expandedIds = new Set<string | number>();
    /** Refs des wrappers expand (wrap/inner) par item id, pour l'animation */
    private expandedElementRefs = new Map<string | number, { wrap: HTMLElement; inner: HTMLElement }>();
    private expandRafRefs = new Map<HTMLElement, number>();

    static get defaults(): ListOptions {
        return getListDefaults();
    }

    static getInstance(el: HTMLElement): List {
        return (el as KListHTMLElement).K_List!;
    }

    static init(
        els: KElement | InitElements<KElement> | string,
        options: Partial<ListOptions> = {}
    ): List | List[] {
        return Component.init(els, options, toComponentClassDef(List)) as List | List[];
    }

    constructor(el: HTMLElement, options: Partial<ListOptions> = {}) {
        super(el, options, toComponentClassDef(List));

        this.logger = ManagerFactory.getLoggerManager('[List]');

        this.options = {
            ...List.defaults,
            ...options,
        };

        this.items = [...(this.options.items || [])];
        this.selectedId = this.options.selectedId ?? null;
        this.checked = { ...(this.options.checked || {}) };
        this.switches = this.options.switches || {};

        (el as KListHTMLElement).K_List = this;

        this.init();
    }

    private get effectiveConfig(): ListConfig {
        const c = this.options.config ?? {};
        return {
            ...c,
            withSwitches: !!c.withSwitches && !c.expandCollapse && c.selection !== 'multiple',
            selection: c.selection,
            trailing: (c.withSwitches || c.expandCollapse) ? 'none' : c.trailing,
            expandCollapse: !!c.expandCollapse && !c.withSwitches && c.selection !== 'multiple',
            accordion: c.accordion ?? false,
            swipe: !!c.swipe && !c.drag,
            drag: !!c.drag && !c.swipe,
        };
    }

    private init(): void {
        this.el.classList.add('list');
        setAriaAttributes(this.el, { role: 'list', label: LocaleManager.t('list.ariaListLabel') });
        this.render();
        this.logger.info('List initialized');
    }

    private render(): void {
        const cfg = this.effectiveConfig;
        const isSegmented = cfg.variant === 'segmented';

        this.el.classList.toggle('list--segmented', isSegmented);
        this.el.classList.toggle('list--segmented-isolated', isSegmented && !cfg.grouped);
        this.el.innerHTML = '';
        this.rippleInstances = [];
        this.childComponents = { switch: [], checkbox: [] };

        this.containerEl = document.createElement('div');
        this.containerEl.className = 'list__container';
        this.containerEl.style.display = 'flex';
        this.containerEl.style.flexDirection = 'column';
        this.containerEl.style.gap = isSegmented ? `${ListSpecs.segmentedGapPx}px` : '0';

        this.expandedElementRefs.clear();

        this.items.forEach((item, i) => {
            const wrapper = this.buildItemWrapper(item, i, this.items.length);
            this.containerEl!.appendChild(wrapper);
        });

        this.el.appendChild(this.containerEl);

        if (cfg.drag) {
            this.containerEl.addEventListener('dragover', (e: DragEvent) => {
                e.preventDefault();
                if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
                const target = (e.target as HTMLElement).closest?.('.list__item-wrapper');
                if (target && this.containerEl) {
                    const idx = Array.from(this.containerEl.children).indexOf(target);
                    if (idx >= 0 && idx < this.items.length) {
                        this.dropIdx = idx;
                        this.updateDropIndicators();
                    }
                }
            });
            this.containerEl.addEventListener('dragenter', (e: DragEvent) => {
                e.preventDefault();
                const target = (e.target as HTMLElement).closest?.('.list__item-wrapper');
                if (target && this.containerEl) {
                    const idx = Array.from(this.containerEl.children).indexOf(target);
                    if (idx >= 0 && idx < this.items.length) {
                        this.dropIdx = idx;
                        this.updateDropIndicators();
                    }
                }
            });
        }

        // Délégation change pour Switch/Checkbox (une seule fois sur le container)
        this.containerEl.addEventListener('change', (e) => {
            const t = (e.target as HTMLElement).closest?.('[data-list-switch]');
            if (t) {
                const id = (t as HTMLElement).dataset?.listSwitch;
                if (id !== undefined) {
                    const checked = (e.target as HTMLInputElement).type === 'checkbox' ? (e.target as HTMLInputElement).checked : !this.switches[id];
                    this.setSwitch(id, checked);
                }
            }
            const c = (e.target as HTMLElement).closest?.('[data-list-checkbox]');
            if (c) {
                const id = (c as HTMLElement).dataset?.listCheckbox;
                if (id !== undefined) {
                    const checked = (e.target as HTMLInputElement).type === 'checkbox' ? (e.target as HTMLInputElement).checked : !this.checked[id];
                    this.setChecked(id, checked);
                }
            }
        });

        // Init sous-composants (Switch, Checkbox) et icônes IconManager
        requestAnimationFrame(() => {
            if (this.isDestroyed || !this.el) return;
            this.initChildComponents();
            IconManager.processIconsInContainer(this.el);
            IconManager.forceDisplayIcons();
        });
    }

    private initChildComponents(): void {
        if (!this.containerEl) return;
        const switches = this.containerEl.querySelectorAll<HTMLElement>('.switch[data-list-switch]');
        switches.forEach((el) => {
            try {
                const id = el.dataset.listSwitch;
                const checked = id != null ? (this.switches[id] ?? false) : false;
                const inst = Switch.init(el, { checked }) as Switch;
                if (Array.isArray(inst)) this.childComponents.switch.push(...inst);
                else this.childComponents.switch.push(inst);
            } catch (_) {}
        });
        const checkboxes = this.containerEl.querySelectorAll<HTMLElement>('.checkbox[data-list-checkbox]');
        checkboxes.forEach((el) => {
            try {
                const id = el.dataset.listCheckbox;
                const checked = id != null ? (this.checked[id] ?? false) : false;
                const inst = Checkbox.init(el, { checked }) as Checkbox;
                if (Array.isArray(inst)) this.childComponents.checkbox.push(...inst);
                else this.childComponents.checkbox.push(inst);
            } catch (_) {}
        });
    }

    private buildItemWrapper(item: ListItemData, index: number, total: number): HTMLElement {
        const cfg = this.effectiveConfig;
        const stdRadius = `${ListSpecs.radii.standardItemPx}px`;
        let itemBR: string;
        let isFirstInGroup = false;
        let isLastInGroup = false;

        if (cfg.variant === 'segmented') {
            if (cfg.grouped) {
                const useOverlineGroups = !!cfg.overline && this.items.some((it) => !!(it as { overline?: string }).overline);
                if (useOverlineGroups) {
                    isFirstInGroup = !!(item as { overline?: string }).overline;
                    const next = this.items[index + 1] as { overline?: string } | undefined;
                    isLastInGroup = index === total - 1 || !!next?.overline;
                } else {
                    isFirstInGroup = index === 0;
                    isLastInGroup = index === total - 1;
                }
                itemBR = segBRForGroup(isFirstInGroup, isLastInGroup);
            } else {
                itemBR = segBRIsolated();
            }
        } else {
            itemBR = stdRadius;
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'list__item-wrapper';
        if (cfg.variant === 'segmented' && cfg.grouped) {
            wrapper.classList.toggle('list__item-wrapper--group-start', isFirstInGroup);
            wrapper.classList.toggle('list__item-wrapper--group-end', isLastInGroup);
            if (isFirstInGroup && isLastInGroup) {
                wrapper.classList.add('list__item-wrapper--group-only');
            }
        }
        const itemKey = item.id ?? index;
        const selected = cfg.selection === 'single' && this.selectedId === itemKey;
        if (selected) {
            wrapper.classList.add('list__item-wrapper--selected');
        }
        wrapper.dataset.itemId = String(item.id);
        wrapper.style.position = 'relative';
        wrapper.style.transition = 'opacity 150ms ease';
        wrapper.style.borderRadius = itemBR;

        if (cfg.drag) {
            wrapper.draggable = true;
            wrapper.addEventListener('dragstart', (e: DragEvent) => this.handleDragStart(e, index));
            wrapper.addEventListener('dragend', () => this.handleDragEnd());
        }

        // Indicateur drop (top)
        const dropTop = document.createElement('div');
        dropTop.className = 'list__drop-indicator list__drop-indicator--top';
        dropTop.style.cssText = 'position:absolute;top:0;left:12px;right:12px;height:2px;background:var(--md-sys-color-primary,#6750A4);border-radius:999px;z-index:10;display:none;';
        wrapper.appendChild(dropTop);

        const inner = document.createElement('div');
        inner.className = 'list__item-inner';
        // Material Web : forme définie une seule fois (sur le wrapper), les couches internes héritent.
        inner.style.borderRadius = 'inherit';
        inner.style.position = 'relative';
        inner.style.zIndex = 'auto';
        wrapper.appendChild(inner);

        if (cfg.drag) {
            const handle = document.createElement('div');
            handle.className = 'list__drag-handle';
            handle.setAttribute('aria-hidden', 'true');
            handle.appendChild(createListIcon('grip-vertical', 20, 'var(--md-sys-color-on-surface-variant)'));
            inner.appendChild(handle);
        }

        const row = this.buildListItem(item, index, total);
        if (cfg.swipe) {
            const reveal = document.createElement('div');
            reveal.className = 'list__swipe-reveal';
            reveal.setAttribute('aria-hidden', 'true');
            const revealArchive = document.createElement('div');
            revealArchive.className = 'list__swipe-reveal-icon list__swipe-reveal-icon--archive';
            revealArchive.appendChild(createListIcon('archive', 20, 'var(--md-sys-color-on-success-container, var(--md-sys-color-on-success, #1B5E20))'));
            const revealDelete = document.createElement('div');
            revealDelete.className = 'list__swipe-reveal-icon list__swipe-reveal-icon--delete';
            revealDelete.appendChild(createListIcon('delete', 20, 'var(--md-sys-color-on-error-container)'));
            reveal.appendChild(revealArchive);
            reveal.appendChild(revealDelete);
            inner.appendChild(reveal);
            const slider = document.createElement('div');
            slider.className = 'list__swipe-slider';
            slider.appendChild(row);
            inner.appendChild(slider);
            this.setupSwipeHandlers(wrapper, slider, reveal, item.id ?? index);
        } else {
            inner.appendChild(row);
        }

        const dropBottom = document.createElement('div');
        dropBottom.className = 'list__drop-indicator list__drop-indicator--bottom';
        dropBottom.style.cssText = 'position:absolute;bottom:0;left:12px;right:12px;height:2px;background:var(--md-sys-color-primary,#6750A4);border-radius:999px;z-index:10;display:none;';
        wrapper.appendChild(dropBottom);

        return wrapper;
    }

    private buildListItem(item: ListItemData, index: number, total: number): HTMLElement {
        const cfg = this.effectiveConfig;
        const isSegmented = cfg.variant === 'segmented';
        const isTall = cfg.lines === '3';
        const hasSupport = cfg.lines !== '1';
        const isMulti = cfg.selection === 'multiple';
        const itemKey = item.id ?? index;
        const selected = !isMulti && this.selectedId === itemKey;
        const checked = this.checked[itemKey] ?? false;
        const switchVal = this.switches[itemKey] ?? false;

        const minH = isTall ? 88 : hasSupport ? 72 : 56;
        const pad = hasSupport ? (isSegmented ? '12px 16px' : '8px 24px 8px 16px') : (isSegmented ? '0 16px' : '0 24px 0 16px');
        const bg = isSegmented ? (selected ? 'var(--md-sys-color-secondary-container)' : 'var(--md-sys-color-surface-container-high)') : (selected ? 'var(--md-sys-color-secondary-container)' : 'transparent');

        const row = document.createElement('div');
        row.setAttribute('role', 'listitem');
        row.setAttribute('tabindex', '0');
        row.className = 'list__item';
        if (selected) {
            row.classList.add('list__item--selected');
        }
        row.dataset.itemId = String(item.id);
        row.style.cssText = `
            position:relative;display:flex;align-items:${isTall || hasSupport ? 'flex-start' : 'center'};
            min-height:${minH}px;padding:${pad};padding-left:${cfg.drag ? (isSegmented ? '40px' : '48px') : '16px'};
            gap:16px;cursor:${cfg.drag ? 'default' : 'pointer'};user-select:none;
            background:${bg};border-radius:inherit;outline:none;
            transition:transform 250ms cubic-bezier(0.2,0,0,1), background 200ms cubic-bezier(0.2,0,0,1);
        `;

        // State layer
        const stateLayer = document.createElement('div');
        stateLayer.className = 'list__state-layer';
        stateLayer.style.cssText = 'position:absolute;inset:0;pointer-events:none;border-radius:inherit;transition:background 200ms ease;';
        row.appendChild(stateLayer);

        // Leading
        const leadingWrap = document.createElement('div');
        leadingWrap.style.cssText = 'flex-shrink:0;display:flex;align-items:center;padding-top:' + (isTall || hasSupport ? '4px' : '0') + ';';
        if (cfg.leading === 'avatar' && item.avatar) {
            const av = document.createElement('div');
            av.className = 'avatar list__leading-avatar avatar--md avatar--circle';
            av.setAttribute('data-name', typeof item.avatar === 'string' ? item.avatar : (item.avatar.label ?? ''));
            av.style.width = '40px';
            av.style.height = '40px';
            av.style.borderRadius = '50%';
            av.style.flexShrink = '0';
            av.style.background = (typeof item.avatar === 'string' ? undefined : item.avatar.color) || 'var(--md-sys-color-primary-container)';
            av.style.color = (typeof item.avatar === 'string' ? undefined : item.avatar.textColor) || 'var(--md-sys-color-on-primary-container)';
            av.style.display = 'flex';
            av.style.alignItems = 'center';
            av.style.justifyContent = 'center';
            av.style.fontSize = '14px';
            av.style.fontWeight = '500';
            av.textContent = typeof item.avatar === 'string' ? item.avatar : (item.avatar.label ?? '');
            leadingWrap.appendChild(av);
        } else if (cfg.leading === 'image') {
            const imgBox = document.createElement('div');
            imgBox.style.cssText = `width:56px;height:56px;border-radius:${isSegmented ? '8px' : '0'};background:${IMG_GRADIENTS[(Number(item.id) || index) % 5]};flex-shrink:0;`;
            leadingWrap.appendChild(imgBox);
        } else if (cfg.leading === 'icon' && item.icon) {
            leadingWrap.appendChild(createListIcon(item.icon, 24, selected ? 'var(--md-sys-color-secondary)' : 'var(--md-sys-color-on-surface-variant)'));
        }
        if (leadingWrap.hasChildNodes()) row.appendChild(leadingWrap);

        // Text block (column layout so headline + support stack and get constrained width for wrapping)
        const textBlock = document.createElement('div');
        textBlock.style.cssText = 'flex:1;min-width:0;display:flex;flex-direction:column;padding-top:' + (isTall || hasSupport || cfg.overline ? '2px' : '0') + ';';
        if (cfg.overline && item.overline) {
            const over = document.createElement('div');
            over.className = 'list__overline';
            if (selected) over.classList.add('list__overline--selected');
            over.textContent = item.overline;
            textBlock.appendChild(over);
        }
        const headline = document.createElement('div');
        headline.className = 'list__headline';
        headline.style.cssText = 'font-size:14px;font-weight:400;line-height:20px;color:' + (selected ? 'var(--md-sys-color-on-secondary-container)' : 'var(--md-sys-color-on-surface)') + ';overflow:hidden;text-overflow:' + (hasSupport ? 'unset' : 'ellipsis') + ';white-space:' + (hasSupport ? 'normal' : 'nowrap') + ';' + (hasSupport ? 'min-width:0;' : '');
        headline.textContent = item.headline ?? item.primaryText ?? null;
        textBlock.appendChild(headline);
        if (hasSupport && (item.sub1 || item.sub2)) {
            const support = document.createElement('div');
            support.className = 'list__support';
            const lineClamp = isTall ? '3' : '1';
            const lineHeight = isTall ? '16px' : 'normal';
            const minHeight = isTall ? '48px' : '';
            const whiteSpace = isTall && item.sub1 && item.sub2 ? 'pre-line;' : '';
            support.style.cssText = 'font-size:12px;line-height:' + lineHeight + ';color:' + (selected ? 'var(--md-sys-color-on-secondary-container)' : 'var(--md-sys-color-on-surface-variant)') + ';margin-top:2px;min-width:0;width:100%;display:-webkit-box;-webkit-line-clamp:' + lineClamp + ';-webkit-box-orient:vertical;overflow:hidden;word-wrap:break-word;' + (minHeight ? 'min-height:' + minHeight + ';' : '') + (whiteSpace ? 'white-space:' + whiteSpace : '');
            support.textContent = isTall && item.sub1 && item.sub2 ? `${item.sub1}\n${item.sub2}` : (item.sub1 || item.sub2 || '');
            textBlock.appendChild(support);
        }
        const expanded = this.expandedIds.has(itemKey);
        if (cfg.expandCollapse && (item.sub2 != null && item.sub2 !== '')) {
            const expandWrap = document.createElement('div');
            expandWrap.className = 'list__expand-wrap';
            expandWrap.style.cssText = 'overflow:hidden;transition:none;';
            expandWrap.style.height = expanded ? 'auto' : '0px';
            expandWrap.style.opacity = expanded ? '1' : '0';
            const expandInner = document.createElement('div');
            expandInner.className = 'list__expand-inner';
            expandInner.style.cssText = 'margin-top:8px;padding-top:8px;border-top:1px solid var(--md-sys-color-outline-variant);';
            const expandText = document.createElement('div');
            expandText.className = 'list__expand-text';
            expandText.style.cssText = 'font-size:12px;line-height:18px;color:' + (selected ? 'var(--md-sys-color-on-secondary-container)' : 'var(--md-sys-color-on-surface-variant)') + ';';
            expandText.textContent = item.sub2;
            expandInner.appendChild(expandText);
            expandWrap.appendChild(expandInner);
            textBlock.appendChild(expandWrap);
            this.expandedElementRefs.set(itemKey, { wrap: expandWrap, inner: expandInner });
        }
        row.appendChild(textBlock);

        // Trailing
        const trailingWrap = document.createElement('div');
        trailingWrap.style.cssText = 'flex-shrink:0;display:flex;align-items:center;padding-top:' + (isTall || hasSupport || cfg.overline ? '4px' : '0') + ';';
        if (cfg.withSwitches) {
            const sw = document.createElement('div');
            sw.className = 'switch';
            sw.setAttribute('role', 'switch');
            sw.setAttribute('aria-checked', String(switchVal));
            sw.setAttribute('data-list-switch', String(itemKey));
            trailingWrap.appendChild(sw);
        } else if (isMulti) {
            const cb = document.createElement('div');
            cb.className = 'checkbox';
            cb.setAttribute('role', 'checkbox');
            cb.setAttribute('aria-checked', String(checked));
            cb.setAttribute('data-list-checkbox', String(itemKey));
            trailingWrap.appendChild(cb);
        } else if (cfg.expandCollapse) {
            const chevronWrap = document.createElement('div');
            chevronWrap.className = 'list__trailing-chevron';
            chevronWrap.style.cssText = 'transition:transform 200ms ease;transform:' + (expanded ? 'rotate(180deg)' : 'rotate(0)') + ';';
            chevronWrap.appendChild(createListIcon('chevron-down', 20, selected ? 'var(--md-sys-color-secondary)' : 'var(--md-sys-color-on-surface-variant)'));
            trailingWrap.appendChild(chevronWrap);
        } else if (cfg.trailing === 'arrow') {
            trailingWrap.appendChild(createListIcon('chevron-right', 20, selected ? 'var(--md-sys-color-secondary)' : 'var(--md-sys-color-on-surface-variant)'));
        } else if (cfg.trailing === 'badge' && item.badge) {
            const badge = document.createElement('div');
            badge.style.cssText = 'background:var(--md-sys-color-primary-container);color:var(--md-sys-color-on-primary-container);border-radius:999px;padding:2px 8px;font-size:11px;font-weight:500;';
            badge.textContent = item.badge != null ? String(item.badge) : '';
            trailingWrap.appendChild(badge);
        } else if (cfg.trailing === 'time' && item.time) {
            const date = document.createElement('span');
            date.style.cssText = 'font-size:11px;font-weight:500;color:' + (selected ? 'var(--md-sys-color-on-secondary-container)' : 'var(--md-sys-color-on-surface-variant)') + ';white-space:nowrap;';
            date.textContent = item.time;
            trailingWrap.appendChild(date);
        }
        if (trailingWrap.hasChildNodes()) row.appendChild(trailingWrap);

        // Ripple
        const rip = ripple.create(row, { target: row });
        this.rippleInstances.push(rip);

        // Events
        row.addEventListener('click', (e) => this.handleItemClick(e, item, index));
        row.addEventListener('keydown', (e) => { if (e.key === 'Enter') this.handleItemClick(e, item, index); });
        row.addEventListener('mouseenter', () => { stateLayer.style.background = selected ? 'rgba(98,91,113,0.08)' : 'rgba(103,80,164,0.08)'; });
        row.addEventListener('mouseleave', () => { stateLayer.style.background = 'transparent'; });

        return row;
    }

    private handleItemClick(e: Event, item: ListItemData, index: number): void {
        const target = e.target as HTMLElement;
        const itemKey = item.id ?? index;
        if (target.closest?.('[data-list-switch], [data-list-checkbox]')) return;
        const cfg = this.effectiveConfig;
        if (cfg.expandCollapse && (item.sub2 != null && item.sub2 !== '')) {
            this.toggleExpand(itemKey);
            return;
        }
        if (cfg.selection === 'single') {
            this.selectedId = this.selectedId === itemKey ? null : itemKey;
            this.options.onSelect?.(item, index, this);
            this.render();
            return;
        }
    }

    /** Ouvre ou ferme le contenu expand d’un item (accordion : un seul ouvert) */
    private toggleExpand(id: string | number): void {
        const cfg = this.effectiveConfig;
        const wasExpanded = this.expandedIds.has(id);
        const previouslyExpanded = cfg.accordion ? new Set(this.expandedIds) : null;
        if (cfg.accordion) this.expandedIds.clear();
        if (wasExpanded) {
            this.expandedIds.delete(id);
        } else {
            this.expandedIds.add(id);
        }
        const nowExpanded = !wasExpanded;
        const refs = this.expandedElementRefs.get(id);
        if (refs) this.animateExpandContent(refs.wrap, refs.inner, nowExpanded);
        if (cfg.accordion && previouslyExpanded) {
            previouslyExpanded.forEach((otherId) => {
                if (otherId === id) return;
                const otherRefs = this.expandedElementRefs.get(otherId);
                if (otherRefs) this.animateExpandContent(otherRefs.wrap, otherRefs.inner, false);
            });
        }
        this.containerEl?.querySelectorAll('.list__trailing-chevron').forEach((el) => {
            const wrapper = el as HTMLElement;
            const itemWrapper = wrapper.closest('.list__item-wrapper');
            const itemId = itemWrapper?.getAttribute?.('data-item-id');
            if (itemId != null) {
                const open = this.expandedIds.has(itemId) || this.expandedIds.has(Number(itemId));
                wrapper.style.transform = open ? 'rotate(180deg)' : 'rotate(0)';
            }
        });
    }

    /** Easing smoothstep (même douceur que la fermeture) pour expand et collapse */
    private smoothstep(t: number): number {
        return t * t * (3 - 2 * t);
    }

    /** Anime l’ouverture/fermeture du bloc expand (même animation douce dans les deux sens). */
    private animateExpandContent(wrap: HTMLElement, inner: HTMLElement, expanded: boolean): void {
        const prev = this.expandRafRefs.get(wrap);
        if (prev != null) {
            cancelAnimationFrame(prev);
            this.expandRafRefs.delete(wrap);
        }
        const DUR = 280;
        const t0 = performance.now();
        if (expanded) {
            wrap.style.height = 'auto';
            wrap.style.overflow = 'visible';
            wrap.style.opacity = '0';
            const targetH = inner.offsetHeight;
            wrap.style.height = '0px';
            wrap.style.overflow = 'hidden';
            const tick = (now: number) => {
                const p = Math.min((now - t0) / DUR, 1);
                const y = this.smoothstep(p);
                wrap.style.height = `${targetH * y}px`;
                wrap.style.opacity = String(y);
                if (p < 1) {
                    const raf = requestAnimationFrame(tick);
                    this.expandRafRefs.set(wrap, raf);
                } else {
                    wrap.style.height = 'auto';
                    wrap.style.overflow = 'visible';
                    wrap.style.opacity = '1';
                    this.expandRafRefs.delete(wrap);
                }
            };
            const raf = requestAnimationFrame(tick);
            this.expandRafRefs.set(wrap, raf);
        } else {
            const fromH = inner.offsetHeight;
            wrap.style.height = `${fromH}px`;
            wrap.style.overflow = 'hidden';
            const tick = (now: number) => {
                const p = Math.min((now - t0) / DUR, 1);
                const y = this.smoothstep(p);
                wrap.style.height = `${fromH * (1 - y)}px`;
                wrap.style.opacity = String(1 - y);
                if (p < 1) {
                    const raf = requestAnimationFrame(tick);
                    this.expandRafRefs.set(wrap, raf);
                } else {
                    wrap.style.height = '0px';
                    wrap.style.opacity = '0';
                    this.expandRafRefs.delete(wrap);
                }
            };
            const raf = requestAnimationFrame(tick);
            this.expandRafRefs.set(wrap, raf);
        }
    }
    private setSwitch(id: string | number, value: boolean): void {
        this.switches[id] = value;
        const item = this.items.find((i) => i.id === id);
        if (item) this.options.onSwitch?.(item, value, this);
    }

    private setChecked(id: string | number, value: boolean): void {
        this.checked[id] = value;
        const item = this.items.find((i) => i.id === id);
        if (item) this.options.onCheck?.(item, value, this);
    }

    private handleDragStart(e: DragEvent, index: number): void {
        this.dragIdx = index;
        this.dropIdx = index;
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', String(index));
            e.dataTransfer.setData('application/json', JSON.stringify({ listIndex: index }));
        }
        const wrapper = this.containerEl?.children[index] as HTMLElement | undefined;
        wrapper?.classList.add('list__item-wrapper--dragging');
    }

    private handleDragEnd(): void {
        this.containerEl?.querySelectorAll('.list__item-wrapper--dragging').forEach((w) => w.classList.remove('list__item-wrapper--dragging'));
        if (this.dragIdx === null || this.dropIdx === null) {
            this.dragIdx = null;
            this.dropIdx = null;
            this.render();
            return;
        }
        const next = [...this.items];
        const [moved] = next.splice(this.dragIdx, 1);
        next.splice(this.dropIdx, 0, moved);
        this.items = next;
        this.dragIdx = null;
        this.dropIdx = null;
        this.options.onReorder?.(this.items, this);
        this.render();
    }

    private updateDropIndicators(): void {
        if (!this.containerEl) return;
        const wrappers = this.containerEl.querySelectorAll('.list__item-wrapper');
        wrappers.forEach((w, i) => {
            const top = w.querySelector('.list__drop-indicator--top') as HTMLElement;
            const bottom = w.querySelector('.list__drop-indicator--bottom') as HTMLElement;
            if (this.dragIdx !== null && this.dropIdx !== null && this.dropIdx !== this.dragIdx) {
                if (i === this.dropIdx) {
                    if (this.dropIdx < this.dragIdx) { top!.style.display = 'block'; if (bottom) bottom.style.display = 'none'; }
                    else { if (top) top.style.display = 'none'; bottom!.style.display = 'block'; }
                } else { if (top) top.style.display = 'none'; if (bottom) bottom.style.display = 'none'; }
            } else { if (top) top.style.display = 'none'; if (bottom) bottom.style.display = 'none'; }
        });
    }

    private setupSwipeHandlers(wrapper: HTMLElement, slider: HTMLElement, reveal: HTMLElement, itemId: string | number): void {
        const THRESHOLD = 40;
        const COMMIT = 100;
        const updateUI = (x: number, action: 'delete' | 'archive' | null) => {
            slider.style.transform = `translateX(${x}px)`;
            slider.style.transition = 'none';
            if (action === 'delete') {
                reveal.style.background = 'var(--md-sys-color-error-container)';
                reveal.querySelector('.list__swipe-reveal-icon--delete')?.classList.add('list__swipe-reveal-icon--visible');
                (reveal.querySelector('.list__swipe-reveal-icon--archive') as HTMLElement)?.classList.remove('list__swipe-reveal-icon--visible');
            } else if (action === 'archive') {
                reveal.style.background = 'var(--md-sys-color-success-container, var(--md-sys-color-success, #C8E6C9))';
                reveal.querySelector('.list__swipe-reveal-icon--archive')?.classList.add('list__swipe-reveal-icon--visible');
                (reveal.querySelector('.list__swipe-reveal-icon--delete') as HTMLElement)?.classList.remove('list__swipe-reveal-icon--visible');
            } else {
                reveal.style.background = 'transparent';
                reveal.querySelectorAll('.list__swipe-reveal-icon').forEach((el) => el.classList.remove('list__swipe-reveal-icon--visible'));
            }
        };
        const commit = (action: 'delete' | 'archive') => {
            wrapper.classList.add('list__item-wrapper--dismissing');
            const h = wrapper.getBoundingClientRect().height;
            wrapper.style.height = `${h}px`;
            wrapper.style.overflow = 'hidden';
            wrapper.style.transition = 'height 280ms ease, opacity 280ms ease';
            requestAnimationFrame(() => {
                wrapper.style.height = '0';
                wrapper.style.opacity = '0';
            });
            this.swipeState.delete(itemId);
            this.swipeStart.delete(itemId);
            setTimeout(() => {
                if (action === 'delete') this.removeItem(itemId);
                else this.archiveItem(itemId);
            }, 280);
        };
        const reset = () => {
            this.swipeState.delete(itemId);
            slider.style.transition = 'transform 250ms cubic-bezier(0.2,0,0,1)';
            slider.style.transform = 'translateX(0)';
            reveal.style.background = 'transparent';
            reveal.style.transition = 'background 200ms ease';
            reveal.querySelectorAll('.list__swipe-reveal-icon').forEach((el) => el.classList.remove('list__swipe-reveal-icon--visible'));
        };

        const finishSwipe = (): void => {
            const state = this.swipeState.get(itemId);
            this.swipeStart.delete(itemId);
            this.mouseSwipeActive = false;
            if (state && Math.abs(state.x) > COMMIT && state.action) {
                commit(state.action);
            } else {
                reset();
            }
        };

        bindPointerDown(slider, (e) => {
            const { x, y } = getPointerCoords(e);
            this.swipeStart.set(itemId, { x, y });
            this.mouseSwipeActive = true;
            const pointerId = e instanceof PointerEvent ? e.pointerId : 0;
            startPointerDragSession({
                captureElement: slider,
                pointerId,
                onMove: (ev) => {
                    const start = this.swipeStart.get(itemId);
                    if (!start) return;
                    const cur = getPointerCoords(ev);
                    const dx = cur.x - start.x;
                    const dy = cur.y - start.y;
                    const state = this.swipeState.get(itemId);
                    if (!state && Math.abs(dy) > Math.abs(dx)) return;
                    const action: 'delete' | 'archive' | null =
                        dx < -THRESHOLD ? 'delete' : dx > THRESHOLD ? 'archive' : null;
                    this.swipeState.set(itemId, { x: dx, action });
                    updateUI(dx, action);
                },
                onEnd: finishSwipe,
            });
        });
    }

    /** Supprime un item et optionnellement affiche un snackbar avec undo */
    removeItem(id: string | number): void {
        const item = this.items.find((i) => i.id === id);
        if (!item) return;
        const idx = this.items.findIndex((i) => i.id === id);
        this.items = this.items.filter((i) => i.id !== id);
        this.options.onDelete?.(item, this);
        if (this.options.showSnackbarUndo) {
            Snackbar.show({
                text: `"${item.headline}" ${LocaleManager.t('list.deleted')}`,
                actionText: LocaleManager.t('list.undo'),
                actionCallback: () => {
                    this.items = [...this.items.slice(0, idx), item, ...this.items.slice(idx)];
                    this.render();
                },
            });
        }
        this.render();
    }

    /** Archive un item (même logique que remove avec message archivé) */
    archiveItem(id: string | number): void {
        const item = this.items.find((i) => i.id === id);
        if (!item) return;
        const idx = this.items.findIndex((i) => i.id === id);
        this.items = this.items.filter((i) => i.id !== id);
        this.options.onArchive?.(item, this);
        if (this.options.showSnackbarUndo) {
            Snackbar.show({
                text: `"${item.headline}" ${LocaleManager.t('list.archived')}`,
                actionText: LocaleManager.t('list.undo'),
                actionCallback: () => {
                    this.items = [...this.items.slice(0, idx), item, ...this.items.slice(idx)];
                    this.render();
                },
            });
        }
        this.render();
    }

    /** Retourne la liste des items actuels */
    getItems(): ListItemData[] {
        return [...this.items];
    }

    /** Définit les items et re-rend */
    setItems(items: ListItemData[]): void {
        this.items = [...items];
        this.render();
    }

    /** Définit l’item sélectionné (mode single) et re-rend */
    setSelectedId(id: string | number | null): void {
        this.selectedId = id;
        this.render();
    }

    override destroy(): void {
        this.expandRafRefs.forEach((raf) => cancelAnimationFrame(raf));
        this.expandRafRefs.clear();
        this.rippleInstances.forEach((r) => { try { r.destroy(); } catch (_) {} });
        this.childComponents.switch.forEach((s) => { try { s.destroy(); } catch (_) {} });
        this.childComponents.checkbox.forEach((c) => { try { c.destroy(); } catch (_) {} });
        if ((this.el as KListHTMLElement).K_List === this) {
            delete (this.el as KListHTMLElement).K_List;
        }
        this.logger.info('List destroyed');
        super.destroy();
    }
}
