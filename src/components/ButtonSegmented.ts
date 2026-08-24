/**
 * @fileoverview Composant ButtonSegmented pour K3UI
 * @description Segmented Button Material Design 3 Expressive — conteneur outlineVariant×40, padding 4dp, gap 4dp, segment actif = pill primaryContainer
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import type { ButtonSegmentedOptions, ButtonGroupItem } from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { setAriaAttributes } from '../utils/dom/aria';
import { LoggerManager, LocaleManager, IconManager } from '../core/managers';
import { ManagerFactory } from '../core/factories';
import { getButtonSegmentedDefaults } from '../specs/components/button-segmented.specs';
import { ButtonSegmentedSpecs } from '../specs/components/button-segmented.specs';
import { HapticManager } from '../core/managers/HapticManager';

interface KButtonSegmentedHTMLElement extends HTMLElement {
    K_ButtonSegmented?: ButtonSegmented;
}

const _defaults: ButtonSegmentedOptions = getButtonSegmentedDefaults();

/**
 * Classe ButtonSegmented pour K3UI
 * @description Boutons segmentés M3 Expressive : conteneur avec fond outlineVariant×40, segments avec pill actif primaryContainer
 */
// @ts-expect-error - ButtonSegmentedOptions utilise des callbacks avec instance au lieu de HTMLElement
export class ButtonSegmented extends Component<ButtonSegmentedOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;
    private logger: LoggerManager;
    private selectedIndices: Set<number> = new Set();
    private buttonElements: HTMLButtonElement[] = [];

    static get defaults(): ButtonSegmentedOptions {
        return { ..._defaults };
    }

    static getInstance(el: HTMLElement): ButtonSegmented | null {
        return (el as KButtonSegmentedHTMLElement).K_ButtonSegmented ?? null;
    }

    static init(
        els: KElement | InitElements<KElement> | string,
        options: Partial<ButtonSegmentedOptions> = {}
    ): ButtonSegmented[] {
        return Component.init(els, options, toComponentClassDef(ButtonSegmented)) as ButtonSegmented[];
    }

    constructor(el: HTMLElement, options: Partial<ButtonSegmentedOptions> = {}) {
        super(el, options, toComponentClassDef(ButtonSegmented));
        this.logger = ManagerFactory.getLoggerManager('[ButtonSegmented]');

        const fromHtml = ButtonSegmented.readAttributes(el);
        this.options = {
            ...ButtonSegmented.defaults,
            ...options,
            ...fromHtml,
        } as ButtonSegmentedOptions;

        const defSelected = this.options.defaultSelected;
        this.selectedIndices = new Set(
            Array.isArray(defSelected) ? defSelected : [defSelected != null ? defSelected : 0]
        );

        (el as KButtonSegmentedHTMLElement).K_ButtonSegmented = this;
        this.init();
    }

    private static readAttributes(el: HTMLElement): Partial<ButtonSegmentedOptions> {
        const out: Partial<ButtonSegmentedOptions> = {};
        const get = (dataName: string, plainName?: string) =>
            el.getAttribute(`data-${dataName}`) ?? (plainName ? el.getAttribute(plainName) : null);

        const dataSegments = get('segments', 'segments');
        if (dataSegments) {
            try {
                const parsed = JSON.parse(dataSegments) as ButtonGroupItem[];
                if (Array.isArray(parsed)) out.segments = parsed;
            } catch (_) {
                /* ignore */
            }
        }
        const sh = get('shape', 'shape');
        if (sh === 'rounded' || sh === 'square') out.shape = sh;
        const multi = get('multi-select', 'multi-select');
        if (multi !== null) out.multiSelect = multi === 'true' || multi === '1';
        const defSel = get('default-selected', 'default-selected');
        if (defSel !== null) {
            try {
                const arr = JSON.parse(defSel) as number[];
                if (Array.isArray(arr)) out.defaultSelected = arr;
            } catch (_) {
                const n = parseInt(defSel, 10);
                if (!Number.isNaN(n)) out.defaultSelected = [n];
            }
        }
        const aria = get('aria-label', 'aria-label');
        if (aria !== null) out.ariaLabel = aria;
        const showCheckAttr = get('show-check', 'show-check');
        if (showCheckAttr !== null) out.showCheck = showCheckAttr === 'true' || showCheckAttr === '1';
        return out;
    }

    private init(): void {
        const segments = this.options.segments ?? [];
        if (segments.length === 0) {
            this.logger.warn('ButtonSegmented: no segments provided');
            return;
        }

        this.el.classList.add('button-segmented');
        this.el.classList.add(`button-segmented--${this.options.shape}`);

        const role = this.options.multiSelect
            ? ButtonSegmentedSpecs.accessibility.roleMulti
            : ButtonSegmentedSpecs.accessibility.roleSingle;
        const ariaLabel =
            this.options.ariaLabel != null && this.options.ariaLabel !== ''
                ? this.options.ariaLabel
                : LocaleManager.t('buttonSegmented.ariaLabel');
        const ariaAttrs: Record<string, string | boolean | number | null> = { role };
        if (ariaLabel) ariaAttrs.ariaLabel = ariaLabel;
        setAriaAttributes(this.el, ariaAttrs);

        const fragment = document.createDocumentFragment();
        this.buttonElements = [];

        for (let i = 0; i < segments.length; i++) {
            const item = segments[i];
            const active = this.selectedIndices.has(i);
            const btn = this.createSegmentButton(item, i, active);
            fragment.appendChild(btn);
            this.buttonElements.push(btn);
        }

        this.el.innerHTML = '';
        this.el.appendChild(fragment);

        IconManager.processIconsInContainer(this.el);
        IconManager.forceDisplayIcons();

        this.logger.info('ButtonSegmented initialized');
    }

    private createSegmentButton(item: ButtonGroupItem, index: number, active: boolean): HTMLButtonElement {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.classList.add('button-segmented__btn');
        if (active) btn.classList.add('button-segmented__btn--active');
        btn.setAttribute('data-index', String(index));
        if (item.value != null && item.value !== '') {
            btn.setAttribute('data-value', item.value);
        }
        if (item.attributes) {
            Object.entries(item.attributes).forEach(([key, val]) => {
                if (key && val != null) btn.setAttribute(key, String(val));
            });
        }
        btn.setAttribute('aria-checked', String(active));
        btn.setAttribute(
            'role',
            this.options.multiSelect ? 'checkbox' : 'radio'
        );

        // Pill (fond actif) — scaleX animation gérée en CSS
        const pill = document.createElement('span');
        pill.className = 'button-segmented__pill';
        pill.setAttribute('aria-hidden', 'true');
        btn.appendChild(pill);

        // Overlay hover/press (inactif)
        const overlay = document.createElement('span');
        overlay.className = 'button-segmented__overlay';
        overlay.setAttribute('aria-hidden', 'true');
        btn.appendChild(overlay);

        // Content : leading check (si showCheck) + icône segment (optionnel) + label
        const content = document.createElement('span');
        content.className = 'button-segmented__content';
        if (this.options.showCheck) {
            const leadingWrap = document.createElement('span');
            leadingWrap.className = 'button-segmented__leading-icon';
            leadingWrap.setAttribute('aria-hidden', 'true');
            const checkEl = document.createElement('i');
            checkEl.className = 'k3ui-icon';
            checkEl.setAttribute('name', 'check');
            leadingWrap.appendChild(checkEl);
            content.appendChild(leadingWrap);
        }
        if (item.icon) {
            const iconSpan = document.createElement('span');
            iconSpan.className = 'button-segmented__icon';
            const iconEl = document.createElement('i');
            iconEl.className = 'k3ui-icon';
            iconEl.setAttribute('name', item.icon);
            iconEl.setAttribute('aria-hidden', 'true');
            iconSpan.appendChild(iconEl);
            content.appendChild(iconSpan);
        }
        const labelSpan = document.createElement('span');
        labelSpan.className = 'button-segmented__label';
        labelSpan.textContent = item.label;
        content.appendChild(labelSpan);
        btn.appendChild(content);

        this.registerEvent(btn, 'click', () => this.toggle(index));

        return btn;
    }

    private toggle(index: number): void {
        HapticManager.triggerFromOptions(this.options, 'selection');

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
        this.buttonElements.forEach((btn, i) => {
            const active = this.selectedIndices.has(i);
            btn.classList.toggle('button-segmented__btn--active', active);
            btn.setAttribute('aria-checked', String(active));
        });
    }

    /**
     * Retourne les indices actuellement sélectionnés
     */
    getSelectedIndices(): number[] {
        return Array.from(this.selectedIndices).sort((a, b) => a - b);
    }

    /**
     * Définit les indices sélectionnés (sans déclencher onSelect)
     */
    setSelectedIndices(indices: number[]): void {
        const max = (this.options.segments ?? []).length;
        this.selectedIndices = new Set(indices.filter((i) => i >= 0 && i < max));
        this.syncDomState();
    }

    public override destroy(): void {
        this.buttonElements = [];
        this.selectedIndices.clear();
        if ((this.el as KButtonSegmentedHTMLElement).K_ButtonSegmented === this) {
            delete (this.el as KButtonSegmentedHTMLElement).K_ButtonSegmented;
        }
        this.logger.info('ButtonSegmented destroyed');
    }
}

if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-button-segmented')) {
    customElements.define(
        'k3ui-button-segmented',
        class K3UIButtonSegmentedElement extends HTMLElement {
            private buttonSegmentedInstance: ButtonSegmented | null = null;

            connectedCallback(): void {
                if (!this.hasAttribute('data-initialized')) {
                    this.setAttribute('data-initialized', 'true');
                }
            }

            disconnectedCallback(): void {
                if (this.buttonSegmentedInstance) {
                    this.buttonSegmentedInstance.destroy();
                    this.buttonSegmentedInstance = null;
                }
            }
        }
    );
}
