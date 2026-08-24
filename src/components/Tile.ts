/**
 * K3UI Tile — sélection exclusive (radio) ou cases isolées (checkbox déclaratif), présentation expressive MD3 ou carte.
 */

import { Component } from '../core/base/Component';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import { TileOptions } from '../types/components';
import { PriorityLevel } from '../types/base';
import { KElement, InitElements } from '../types/base';
import { LoggerManager } from '../core/managers/LoggerManager';
import { ManagerFactory } from '../core/factories/ManagerFactory';
import { setAriaAttribute, removeAriaAttribute } from '../utils/dom/aria';
import { getTileDefaults } from '../specs/components/tile.specs';
import { generateShortId } from '../utils/helpers/guid';

const _defaults: TileOptions = getTileDefaults();

export class Tile extends Component<TileOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    private inputElement: HTMLInputElement | null = null;
    private contentElement: HTMLElement | null = null;
    private iconWrapElement: HTMLElement | null = null;
    private labelElement: HTMLElement | null = null;
    private stateLayerElement: HTMLElement | null = null;
    private iconElement: HTMLElement | null = null;
    private isChecked: boolean = false;
    private declarativeTileMode: boolean = false;
    private logger: LoggerManager;

    constructor(el: HTMLElement, options: Partial<TileOptions> = {}) {
        super(el, options, toComponentClassDef(Tile));

        this.logger = ManagerFactory.getLoggerManager('[Tile]');
        this.options = {
            ...Tile.defaults,
            ...options,
        };

        if (el.hasAttribute('checked') || (el as HTMLInputElement).checked) {
            this.options.checked = true;
        }
        if (el.hasAttribute('disabled')) {
            this.options.disabled = true;
        }
        if (el.hasAttribute('data-label') || el.hasAttribute('label')) {
            this.options.label = el.getAttribute('data-label') || el.getAttribute('label') || undefined;
        }
        if (el.hasAttribute('data-show-label')) {
            const showLabelValue = el.getAttribute('data-show-label');
            this.options.showLabel = showLabelValue === 'true' || showLabelValue === '';
        }
        if (el.hasAttribute('data-name') || el.hasAttribute('name')) {
            this.options.name = el.getAttribute('data-name') || el.getAttribute('name') || '';
        }
        if (el.hasAttribute('data-value') || el.hasAttribute('value')) {
            this.options.value = el.getAttribute('data-value') || el.getAttribute('value') || '';
        }
        if (el.hasAttribute('data-size')) {
            const size = el.getAttribute('data-size');
            if (size === 'xs' || size === 'sm' || size === 'md' || size === 'lg' || size === 'xl') {
                this.options.size = size;
            }
        }
        if (el.hasAttribute('data-variant')) {
            const variant = el.getAttribute('data-variant');
            if (variant === 'v1' || variant === 'v2') {
                this.options.variant = variant;
            }
        }
        if (el.hasAttribute('data-layout')) {
            const layout = el.getAttribute('data-layout');
            if (layout === 'tile' || layout === 'expressive') {
                this.options.layout = layout;
            }
        }
        if (el.hasAttribute('data-icon')) {
            this.options.icon = el.getAttribute('data-icon');
            this.options.showIcon = true;
        }
        if (el.hasAttribute('data-show-icon')) {
            const showIconValue = el.getAttribute('data-show-icon');
            this.options.showIcon = showIconValue === 'true' || showIconValue === '';
        }
        if (el.hasAttribute('data-type-icon')) {
            this.options.iconType = el.getAttribute('data-type-icon') || 'classic';
        }

        this.isChecked = this.options.checked;
        this.init();
    }

    static getInstance(el: HTMLElement): Tile | undefined {
        return Component.getInstance(el) as Tile | undefined;
    }

    static get defaults(): TileOptions {
        return _defaults;
    }

    static init(el: HTMLElement, options?: Partial<TileOptions>): Tile;
    static init(els: InitElements<KElement>, options?: Partial<TileOptions>): Tile[];
    static init(
        els: HTMLElement | InitElements<KElement>,
        options?: Partial<TileOptions>
    ): Tile | Tile[] {
        if (els instanceof Element) {
            const existing = Tile.getInstance(els as HTMLElement);
            if (existing) return existing;
            return new Tile(els as HTMLElement, options);
        } else if (!!els && els.length) {
            const instances = [];
            for (let i = 0; i < els.length; i++) {
                const existing = Tile.getInstance(els[i] as HTMLElement);
                instances.push(existing || new Tile(els[i] as HTMLElement, options));
            }
            return instances;
        }
        return [];
    }

    private init(): void {
        try {
            this.setupStructure();
            this.setupEventListeners();
            this.updateState();
            this.logger.success('Tile initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize Tile:', error);
        }
    }

    /**
     * Input déclaratif : `input.tile-input` radio ou checkbox + `.tile-panel` dans la racine.
     */
    private findDeclarativeTileInput(): HTMLInputElement | null {
        const panel = this.el.querySelector('.tile-panel') as HTMLElement | null;
        if (!panel || !this.el.contains(panel)) return null;

        const radio = this.el.querySelector<HTMLInputElement>('input.tile-input[type="radio"]');
        if (radio && this.el.contains(radio)) return radio;

        const checkbox = this.el.querySelector<HTMLInputElement>('input.tile-input[type="checkbox"]');
        if (checkbox && this.el.contains(checkbox)) return checkbox;

        return null;
    }

    private isDeclarativeTileMarkup(): boolean {
        return this.findDeclarativeTileInput() !== null;
    }

    private setupStructure(): void {
        const declarativeInput = this.findDeclarativeTileInput();
        if (declarativeInput) {
            const panel = this.el.querySelector('.tile-panel') as HTMLElement;
            this.setupDeclarativeTile(declarativeInput, panel);
            return;
        }

        if (this.options.layout === 'tile') {
            this.setupBuiltTile();
        } else {
            this.setupBuiltExpressive();
        }
    }

    private setupDeclarativeTile(input: HTMLInputElement, panel: HTMLElement): void {
        this.declarativeTileMode = true;
        this.inputElement = input;
        this.contentElement = panel;
        input.classList.add('tile-input');

        const dataName = this.el.getAttribute('data-name');
        if (dataName) {
            input.name = dataName;
            this.options.name = dataName;
        } else if (this.options.name) {
            input.name = this.options.name;
        } else {
            this.options.name = input.name;
        }

        if (this.options.value && !input.value && input.type === 'radio') {
            input.value = this.options.value;
        }
        if (input.type === 'radio') {
            this.options.value = input.value;
        }

        if (this.el.hasAttribute('disabled')) {
            this.options.disabled = true;
        }
        input.disabled = this.options.disabled;

        this.isChecked = input.checked;
        if (this.options.checked && !input.checked) {
            input.checked = true;
            this.isChecked = true;
        }

        this.el.classList.add('tile-item', 'tile-item--tile');
        this.el.classList.toggle('tile-item--checked', this.isChecked);
        this.el.classList.toggle('tile-item--disabled', !!this.options.disabled);

        this.applyInputAria();
        this.refreshClassicIconsInTile(panel);
    }

    /**
     * Met à jour les balises `<i name type="classic">` sous `.tile-panel` via IconManager (init déclaratif).
     */
    private refreshClassicIconsInTile(tileRoot: HTMLElement): void {
        requestAnimationFrame(() => {
            const iconManager = ManagerFactory.getIconManager();
            if (!iconManager) return;
            tileRoot.querySelectorAll<HTMLElement>('i[name]').forEach((iconEl) => {
                iconManager.updateIcon(iconEl);
            });
        });
    }

    private setupBuiltExpressive(): void {
        this.el.classList.add(
            'tile-item',
            'tile-item--expressive',
            `tile-item--${this.options.size}`,
            `tile-item--${this.options.variant}`
        );
        this.el.classList.toggle('tile-item--disabled', this.options.disabled);
        this.el.classList.toggle('tile-item--checked', this.isChecked);

        const existingIcon = this.el.querySelector('[slot="icon"]');
        this.el.innerHTML = '';

        this.contentElement = document.createElement('div');
        this.contentElement.classList.add('tile-item__content');

        this.stateLayerElement = document.createElement('div');
        this.stateLayerElement.classList.add('tile-item__state-layer');

        this.iconWrapElement = document.createElement('span');
        this.iconWrapElement.classList.add('tile-item__icon');

        if (existingIcon) {
            this.iconWrapElement.appendChild(existingIcon);
        } else if (this.options.showIcon && this.options.icon) {
            this.iconElement = document.createElement('i');
            this.iconElement.classList.add('tile-item__icon-glyph');
            this.iconElement.setAttribute('name', this.options.icon);
            this.iconElement.setAttribute('type', this.options.iconType || 'classic');
            this.iconElement.setAttribute('size', this.getClassicButtonIconSize(this.options.size));
            this.iconWrapElement.appendChild(this.iconElement);
        }

        this.labelElement = document.createElement('span');
        this.labelElement.classList.add('tile-item__label');
        if (this.options.label) {
            this.labelElement.textContent = this.options.label;
        }
        if (!this.options.showLabel) {
            this.labelElement.hidden = true;
        }

        this.inputElement = document.createElement('input');
        this.inputElement.type = 'radio';
        this.inputElement.classList.add('tile-input');
        this.inputElement.checked = this.isChecked;
        this.inputElement.disabled = this.options.disabled;
        this.inputElement.setAttribute('role', 'radio');
        this.inputElement.tabIndex = this.options.disabled ? -1 : 0;
        if (this.options.name) this.inputElement.name = this.options.name;
        if (this.options.value) this.inputElement.value = this.options.value;

        this.applyInputAria();

        this.contentElement.appendChild(this.stateLayerElement);
        this.contentElement.appendChild(this.iconWrapElement);
        this.contentElement.appendChild(this.labelElement);
        this.contentElement.appendChild(this.inputElement);
        this.el.appendChild(this.contentElement);

        if (this.iconElement) {
            requestAnimationFrame(() => {
                const iconManager = ManagerFactory.getIconManager();
                if (iconManager && this.iconElement) {
                    iconManager.updateIcon(this.iconElement);
                }
            });
        }
    }

    private setupBuiltTile(): void {
        this.el.classList.add('tile-item', 'tile-item--tile');
        this.el.classList.toggle('tile-item--disabled', this.options.disabled);
        this.el.classList.toggle('tile-item--checked', this.isChecked);

        const existingIcon = this.el.querySelector('[slot="icon"]');
        this.el.innerHTML = '';

        const inputId = generateShortId('tile');

        this.inputElement = document.createElement('input');
        this.inputElement.type = 'radio';
        this.inputElement.classList.add('tile-input');
        this.inputElement.id = inputId;
        this.inputElement.checked = this.isChecked;
        this.inputElement.disabled = this.options.disabled;
        this.inputElement.setAttribute('role', 'radio');
        this.inputElement.tabIndex = this.options.disabled ? -1 : 0;
        if (this.options.name) this.inputElement.name = this.options.name;
        if (this.options.value) this.inputElement.value = this.options.value;

        this.contentElement = document.createElement('div');
        this.contentElement.classList.add('tile-panel');

        if (existingIcon) {
            const wrap = document.createElement('div');
            wrap.classList.add('icon');
            wrap.appendChild(existingIcon);
            this.contentElement.appendChild(wrap);
        } else if (this.options.showIcon && this.options.icon) {
            this.iconElement = document.createElement('i');
            this.iconElement.setAttribute('name', this.options.icon);
            this.iconElement.setAttribute('type', this.options.iconType || 'classic');
            this.iconElement.setAttribute('size', 'lg');
            const wrap = document.createElement('div');
            wrap.classList.add('icon');
            wrap.appendChild(this.iconElement);
            this.contentElement.appendChild(wrap);
        }

        const labelEl = document.createElement('label');
        labelEl.classList.add('tile-panel-label');
        labelEl.htmlFor = inputId;
        if (this.options.label) {
            labelEl.textContent = this.options.label;
        }
        if (!this.options.showLabel) {
            labelEl.hidden = true;
        }
        this.contentElement.appendChild(labelEl);
        this.labelElement = labelEl;

        this.applyInputAria();

        this.el.appendChild(this.inputElement);
        this.el.appendChild(this.contentElement);

        if (this.iconElement) {
            requestAnimationFrame(() => {
                const iconManager = ManagerFactory.getIconManager();
                if (iconManager && this.iconElement) {
                    iconManager.updateIcon(this.iconElement);
                }
            });
        }
    }

    private applyInputAria(): void {
        if (!this.inputElement) return;
        if (this.options.label) {
            setAriaAttribute(this.inputElement, 'label', this.options.label);
        }
        setAriaAttribute(this.inputElement, 'checked', this.isChecked);
        if (this.options.disabled) {
            setAriaAttribute(this.inputElement, 'disabled', true);
        } else {
            removeAriaAttribute(this.inputElement, 'disabled');
        }
    }

    private getClassicButtonIconSize(size: TileOptions['size']): string {
        if (size === 'xs' || size === 'sm') return 'sm';
        if (size === 'md') return 'md';
        if (size === 'lg') return 'lg';
        return 'xl';
    }

    private setupEventListeners(): void {
        if (!this.inputElement) return;

        if (!this.declarativeTileMode && this.options.layout !== 'tile' && this.contentElement) {
            this.registerEvent(this.contentElement, 'click', (event: Event) => {
                const ev = event as MouseEvent;
                if (this.options.disabled || !this.inputElement) return;
                ev.preventDefault();
                this.inputElement.focus();

                if (this.options.name && this.isChecked) return;
                this.setChecked(!this.options.name ? !this.isChecked : true);
            });
        }

        this.registerEvent(this.inputElement, 'change', () => {
            if (!this.inputElement || this.options.disabled) return;
            this.isChecked = this.inputElement.checked;
            if (this.isChecked && this.options.name && this.inputElement.type === 'radio') {
                this.deselectOthersInGroup();
            }
            this.updateState();
            this.options.onChange?.(this.el, this.isChecked);
            this.options.onToggle?.(this.el, this.isChecked);
        });

        this.registerEvent(this.inputElement, 'focus', () => {
            if (!this.options.disabled) {
                this.el.classList.add('tile-item--focused');
                this.options.onFocus?.(this.el);
            }
        });

        this.registerEvent(this.inputElement, 'blur', () => {
            if (!this.options.disabled) {
                this.el.classList.remove('tile-item--focused');
                this.options.onBlur?.(this.el);
            }
        });
    }

    private deselectOthersInGroup(): void {
        if (!this.options.name || !this.inputElement || this.inputElement.type !== 'radio') return;
        const safeName =
            typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
                ? CSS.escape(this.options.name)
                : this.options.name.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        const inputs = Array.from(
            document.querySelectorAll<HTMLInputElement>(
                `input.tile-input[type="radio"][name="${safeName}"]`
            )
        );
        inputs.forEach((input) => {
            if (input !== this.inputElement) {
                input.checked = false;
                const itemEl = input.closest('.tile-item') as HTMLElement | null;
                if (!itemEl) return;
                const instance = Tile.getInstance(itemEl);
                if (instance) {
                    instance.isChecked = false;
                    instance.updateState();
                }
            }
        });
    }

    private updateState(): void {
        if (!this.inputElement) return;
        this.inputElement.checked = this.isChecked;
        setAriaAttribute(this.inputElement, 'checked', this.isChecked);
        this.el.classList.toggle('tile-item--checked', this.isChecked);
    }

    /**
     * @returns État coché courant
     */
    public getChecked(): boolean {
        return this.isChecked;
    }

    /**
     * @param checked — Nouvel état
     */
    public setChecked(checked: boolean): void {
        if (this.options.disabled) return;

        if (this.options.name && this.inputElement?.type === 'radio') {
            this.isChecked = checked;
            if (checked) this.deselectOthersInGroup();
        } else {
            this.isChecked = checked;
        }
        this.updateState();
    }

    /**
     * Bascule l'état (radio groupé : sélectionne si non coché ; sinon toggle)
     */
    public toggle(): void {
        if (this.options.disabled) return;
        if (this.options.name && this.inputElement?.type === 'radio') {
            if (!this.isChecked) this.setChecked(true);
            return;
        }
        this.setChecked(!this.isChecked);
    }

    destroy(): void {
        if (this.inputElement) {
            removeAriaAttribute(this.inputElement, 'checked');
            removeAriaAttribute(this.inputElement, 'disabled');
        }
        super.destroy();
        this.logger.success('Tile destroyed');
    }
}

if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-tile')) {
    customElements.define(
        'k3ui-tile',
        class extends HTMLElement {
            private tileInstance: Tile | null = null;

            connectedCallback(): void {
                // AutoInit gère l'initialisation
            }

            disconnectedCallback(): void {
                if (this.tileInstance) {
                    this.tileInstance.destroy();
                    this.tileInstance = null;
                }
            }

            static get observedAttributes(): string[] {
                return [
                    'checked',
                    'disabled',
                    'label',
                    'name',
                    'value',
                    'data-size',
                    'data-variant',
                    'data-layout',
                    'data-icon',
                    'data-type-icon',
                    'data-show-icon',
                ];
            }

            attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
                if (this.tileInstance && oldValue !== newValue) {
                    const camelCaseName = name.replace(/-([a-z])/g, (g) => g[1].toUpperCase()) as keyof TileOptions;
                    if (camelCaseName in this.tileInstance.options) {
                        (this.tileInstance.options as unknown as Record<string, unknown>)[camelCaseName] =
                            newValue;
                    }
                }
            }
        }
    );
}
