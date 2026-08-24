/**
 * Switch Component
 * Composant de switch selon Material Design 3 Expressive
 */

import { Component } from '../core/base/Component';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import { SwitchOptions } from '../types/components';
import { PriorityLevel } from '../types/base';
import { KElement, InitElements } from '../types/base';
import { LoggerManager } from '../core/managers/LoggerManager';
import { ManagerFactory } from '../core/factories/ManagerFactory';
import { setAriaAttribute, removeAriaAttribute } from '../utils/dom/aria';
import { isRTL } from '../utils/dom/rtl';
import { getSwitchDefaults } from '../specs/components/switch.specs';
import { HapticManager } from '../core/managers/HapticManager';
import { getPointerPressReleaseBindings } from '../utils/dom/pointer';

/**
 * Options par défaut du composant Switch
 * @description Extrait depuis les specs pour garantir la cohérence
 */
const _defaults: SwitchOptions = getSwitchDefaults();

/**
 * Classe Switch
 * Gère les switches avec toutes leurs fonctionnalités
 */
export class Switch extends Component<SwitchOptions> {
    /** Niveau de priorité du composant */
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    private switchElement: HTMLElement | null = null;
    private stateLayerElement: HTMLElement | null = null;
    private trackElement: HTMLElement | null = null;
    private handleElement: HTMLElement | null = null;
    private inputElement: HTMLInputElement | null = null;
    private labelElement: HTMLElement | null = null;
    private iconElement: HTMLElement | null = null;
    private textElement: HTMLElement | null = null;
    private isChecked: boolean = false;
    private isAnimating: boolean = false;
    private logger: LoggerManager;

    /**
     * Constructeur
     * @param el - Élément DOM du Switch
     * @param options - Options de configuration
     */
    constructor(el: HTMLElement, options: Partial<SwitchOptions> = {}) {
        super(el, options, toComponentClassDef(Switch));

        this.logger = ManagerFactory.getLoggerManager('[Switch]');

        // Initialiser les options avec les valeurs par défaut
        this.options = {
            ...Switch.defaults,
            ...options
        };

        // Récupérer les attributs HTML si présents (data-* et attributs standards)
        if (el.hasAttribute('checked') || (el as HTMLInputElement).checked) {
            this.options.checked = true;
        }
        // Bouton avec role="switch" : lire aria-checked
        const ariaChecked = el.getAttribute('aria-checked');
        if (ariaChecked === 'true') this.options.checked = true;
        if (ariaChecked === 'false') this.options.checked = false;

        if (el.hasAttribute('disabled')) {
            this.options.disabled = true;
        }

        if (el.hasAttribute('data-label')) {
            this.options.label = el.getAttribute('data-label') || undefined;
            if (this.options.showLabel === undefined) {
                this.options.showLabel = true;
            }
        }

        // Détecter les textes pour le handle
        if (el.hasAttribute('data-text-unchecked')) {
            this.options.textUnchecked = el.getAttribute('data-text-unchecked');
        }
        if (el.hasAttribute('data-text-checked')) {
            this.options.textChecked = el.getAttribute('data-text-checked');
        }

        // Détecter la variante traffic
        if (el.hasAttribute('data-traffic') && el.getAttribute('data-traffic') === 'true') {
            this.options.traffic = true;
            this.el.setAttribute('data-traffic', 'true');
        }

        // Détecter le style (normal par défaut, compact pour Material Design 2)
        if (el.hasAttribute('data-style')) {
            const style = el.getAttribute('data-style');
            if (style === 'compact') {
                this.options.style = 'compact';
                this.el.setAttribute('data-style', 'compact');
            } else {
                this.options.style = 'normal';
                this.el.setAttribute('data-style', 'normal');
            }
        } else {
            this.options.style = 'normal';
        }

        if (el.hasAttribute('data-label-position')) {
            const labelPos = el.getAttribute('data-label-position');
            if (labelPos === 'right') {
                this.options.labelPosition = 'right';
                this.el.setAttribute('data-label-position', 'right');
            } else {
                this.options.labelPosition = 'left';
                this.el.setAttribute('data-label-position', 'left');
            }
        } else {
            this.options.labelPosition = 'left';
        }

        if (el.hasAttribute('data-name')) {
            this.options.name = el.getAttribute('data-name') || '';
        }

        if (el.hasAttribute('data-value')) {
            this.options.value = el.getAttribute('data-value') || '';
        }

        // Détecter le type d'icône (obligatoire pour IconManager : classic, brand, etc.)
        this.options.iconType = el.getAttribute('data-type-icon') || 'classic';

        // Détecter les icônes pour checked et unchecked
        if (el.hasAttribute('data-icon-check')) {
            this.options.iconCheck = el.getAttribute('data-icon-check');
            this.options.showIcon = true;
        }

        if (el.hasAttribute('data-icon-uncheck')) {
            this.options.iconUncheck = el.getAttribute('data-icon-uncheck');
            this.options.showIcon = true;
        }

        // Rétrocompatibilité : data-icon (déprécié)
        if (el.hasAttribute('data-icon')) {
            this.options.icon = el.getAttribute('data-icon');
            // Si iconCheck ou iconUncheck n'est pas défini, utiliser icon pour les deux
            if (!this.options.iconCheck && !this.options.iconUncheck) {
                this.options.iconCheck = this.options.icon;
                this.options.iconUncheck = this.options.icon;
            }
            this.options.showIcon = true;
        }

        // Vérifier explicitement data-show-icon
        if (el.hasAttribute('data-show-icon')) {
            const showIconValue = el.getAttribute('data-show-icon');
            this.options.showIcon = showIconValue === 'true' || showIconValue === '';
        }

        // Détecter le type d'activation (haptic, slide, scale)
        if (el.hasAttribute('data-activation')) {
            const activationValue = el.getAttribute('data-activation');
            if (activationValue === 'haptic' || activationValue === 'slide' || activationValue === 'scale') {
                this.options.activation = activationValue;
                this.el.setAttribute('data-activation', activationValue);
            }
        }

        // Récupérer l'état initial depuis les options
        this.isChecked = this.options.checked;

        // L'instance est gérée via ComponentRegistry (voir getInstance())

        this.init();
    }

    /**
     * Initialisation du composant
     */
    private init(): void {
        try {
            this.setupStructure();
            this.setupEventListeners();
            this.updateState();
            this.logger.success('Switch initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize Switch:', error);
        }
    }

    /**
     * Configuration de la structure HTML
     */
    private setupStructure(): void {
        // Ajouter la classe de base
        this.el.classList.add('switch');

        // Détecter et appliquer RTL si nécessaire
        if (isRTL(this.el)) {
            this.el.classList.add('switch--rtl');
        }

        // Créer la structure du switch
        this.createSwitchStructure();

        // Mettre à jour l'état visuel
        this.updateVisualState();
    }

    /**
     * Création de la structure HTML du switch
     * Si l'élément contient déjà .switch__track et .switch__handle (ex. slot trailing d'une List),
     * on réutilise cette structure pour éviter une double initialisation.
     */
    private createSwitchStructure(): void {
        const existingTrack = this.el.querySelector('.switch__track');
        const existingHandle = existingTrack?.querySelector('.switch__handle');
        if (existingTrack && existingHandle) {
            this.trackElement = existingTrack as HTMLElement;
            this.handleElement = existingHandle as HTMLElement;
            this.switchElement = null;
            this.stateLayerElement = null;
            this.inputElement = null;
            this.updateVisualState();
            return;
        }

        // Créer le conteneur principal du switch (visuel)
        this.switchElement = document.createElement('div');
        this.switchElement.classList.add('switch__container');

        // Créer le state layer (zone de touch interactif)
        this.stateLayerElement = document.createElement('div');
        this.stateLayerElement.classList.add('switch__state-layer');

        // Créer le track (rail)
        this.trackElement = document.createElement('div');
        this.trackElement.classList.add('switch__track');

        // Créer le handle (bouton qui glisse)
        this.handleElement = document.createElement('div');
        this.handleElement.classList.add('switch__handle');

        // Ajouter du texte dans le handle si nécessaire (priorité sur les icônes)
        if (this.options.textUnchecked || this.options.textChecked) {
            this.textElement = document.createElement('span');
            this.textElement.classList.add('switch__text');
            const initialText = this.isChecked
                ? (this.options.textChecked || this.options.textUnchecked)
                : (this.options.textUnchecked || this.options.textChecked);
            if (initialText) {
                this.textElement.textContent = initialText;
            }
            this.handleElement.appendChild(this.textElement);
            // Ajouter la classe pour indiquer la présence de texte
            this.el.classList.add('switch--with-text');
        }
        // Ajouter l'icône dans le handle si nécessaire (seulement si pas de texte)
        else if (this.options.showIcon) {
            // Déterminer quelle icône utiliser selon l'état initial
            const iconName = this.isChecked
                ? (this.options.iconCheck || this.options.icon)
                : (this.options.iconUncheck || this.options.icon);

            if (iconName) {
                this.iconElement = document.createElement('i');
                this.iconElement.classList.add('switch__icon');
                // Utiliser IconManager : attribut 'name' et 'type' pour les icônes
                this.iconElement.setAttribute('name', iconName);
                this.iconElement.setAttribute('type', this.options.iconType ?? 'classic');

                // Ajouter l'élément au DOM d'abord
                this.handleElement.appendChild(this.iconElement);

                // Forcer l'initialisation de l'icône via IconManager immédiatement
                // Utiliser requestAnimationFrame pour s'assurer que l'élément est dans le DOM
                requestAnimationFrame(() => {
                    const IconManager = ManagerFactory.getIconManager();
                    if (IconManager && this.iconElement) {
                        IconManager.updateIcon(this.iconElement);
                    }
                });

                // Ajouter la classe pour indiquer la présence d'une icône
                this.el.classList.add('switch--with-icon');
            }
        }

        // Assembler la structure visuelle
        // Le state layer doit être en premier pour être derrière le track
        if (this.switchElement) {
            this.switchElement.appendChild(this.stateLayerElement);
        }

        this.trackElement.appendChild(this.handleElement);
        this.switchElement.appendChild(this.trackElement);

        this.inputElement = document.createElement('input');
        this.inputElement.type = 'checkbox';
        this.inputElement.classList.add('switch__input');
        this.inputElement.checked = this.isChecked;
        this.inputElement.disabled = this.options.disabled;
        this.inputElement.setAttribute('role', 'switch');
        setAriaAttribute(this.inputElement, 'checked', this.isChecked);

        if (this.options.disabled) {
            setAriaAttribute(this.inputElement, 'disabled', true);
        }

        if (this.options.name) {
            this.inputElement.name = this.options.name;
        }

        if (this.options.value) {
            this.inputElement.value = this.options.value;
        }

        if (this.options.label) {
            setAriaAttribute(this.inputElement, 'label', this.options.label);
        }

        // Créer le label si nécessaire (avant d'ajouter au DOM)
        if (this.options.showLabel && this.options.label) {
            this.labelElement = document.createElement('label');
            this.labelElement.classList.add('switch__label');
            this.labelElement.textContent = this.options.label;

            // Associer le label à l'input
            const labelId = `switch-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
            this.inputElement.id = labelId;
            this.labelElement.setAttribute('for', labelId);
        }

        if (this.options.showLabel && this.options.label && this.labelElement) {
            this.el.appendChild(this.labelElement);
            this.el.appendChild(this.switchElement);
            this.el.appendChild(this.inputElement);
        } else {
            this.el.appendChild(this.switchElement);
            this.el.appendChild(this.inputElement);
        }

        if (this.options.traffic) {
            this.el.classList.add('switch--traffic');
        }

        if (this.options.disabled) {
            this.el.classList.add('switch--disabled');
        }

        const tabindex = (this.options.disabled || this.options.style === 'compact') ? '-1' : '0';
        this.switchElement.setAttribute('tabindex', tabindex);
    }

    /**
     * Configuration des écouteurs d'événements
     */
    private setupEventListeners(): void {
        // Structure existante (ex. slot trailing List) : pas d'input, on attache le clic sur this.el
        if (!this.inputElement && this.trackElement && this.handleElement) {
            this.registerEvent(this.el, 'click', (event: MouseEvent) => {
                if (this.options.disabled || this.isAnimating) return;
                event.preventDefault();
                this.isChecked = !this.isChecked;
                this.el.setAttribute('aria-checked', String(this.isChecked));
                this.el.classList.toggle('switch--checked', this.isChecked);
                this.updateVisualState();
                this.options.onChange?.(this.el, this.isChecked);
            });
            this.registerEvent(this.el, 'keydown', (event: KeyboardEvent) => {
                if ((event.key === 'Enter' || event.key === ' ') && !this.options.disabled && !this.isAnimating) {
                    event.preventDefault();
                    this.el.click();
                }
            });
            return;
        }

        // Gérer l'état pressed avec mousedown/mouseup
        if (this.inputElement) {
            const removePressed = (): void => {
                setTimeout(() => {
                    this.el.classList.remove('switch--pressed');
                }, 100);
            };
            getPointerPressReleaseBindings(this.inputElement, {
                onPress: () => {
                    if (!this.options.disabled) {
                        this.el.classList.add('switch--pressed');
                    }
                },
                onRelease: removePressed,
            }).forEach(({ target, type, handler, options }) => {
                this.registerEvent(target, type, handler, options);
            });
        }

        if (this.switchElement && this.inputElement) {
            this.registerEvent(this.switchElement, 'click', (event: MouseEvent) => {
                if (!this.options.disabled && !this.isAnimating) {
                    event.preventDefault();
                    event.stopPropagation();
                    this.inputElement?.click();
                }
            });

            this.registerEvent(this.switchElement, 'keydown', (event: KeyboardEvent) => {
                if ((event.key === 'Enter' || event.key === ' ') && !this.options.disabled && !this.isAnimating) {
                    event.preventDefault();
                    event.stopPropagation();
                    this.inputElement?.click();
                }
            });
        }

        if (this.inputElement) {
            this.registerEvent(this.inputElement, 'input', (event: Event) => {
                const target = event.target as HTMLInputElement;
                this.isChecked = target.checked;
                this.handleToggle(event);
            });

            this.registerEvent(this.inputElement, 'change', (event: Event) => {
                const target = event.target as HTMLInputElement;
                this.isChecked = target.checked;
                this.updateState();
                this.options.onChange?.(this.el, this.isChecked);
            });
        }

        if (this.inputElement && this.switchElement && this.options.style !== 'compact') {
            this.registerEvent(this.inputElement, 'focus', (event: FocusEvent) => {
                if (!this.options.disabled) {
                    this.el.classList.add('switch--focused');
                    this.options.onFocus?.(this.el);
                }
            });

            this.registerEvent(this.inputElement, 'blur', (event: FocusEvent) => {
                if (!this.options.disabled) {
                    this.el.classList.remove('switch--focused');
                    this.options.onBlur?.(this.el);
                }
            });
        }

        if (this.switchElement && this.inputElement && this.options.style !== 'compact') {
            this.registerEvent(this.switchElement, 'focus', () => {
                if (!this.options.disabled) {
                    this.inputElement?.focus();
                }
            });
        }
    }

    private handleToggle(event: Event): void {
        if (this.isAnimating || this.options.disabled) return;

        HapticManager.triggerFromOptions(this.options, 'light');

        const wasChecked = !this.isChecked;
        this.isAnimating = true;

        if (wasChecked) {
            this.options.onCloseStart?.(this.el);
        } else {
            this.options.onOpenStart?.(this.el);
        }

        requestAnimationFrame(() => {
            this.updateVisualState();
            // Appliquer l'effet d'activation selon le type
            if (this.options.activation === 'haptic' || this.options.activation === 'scale') {
                setTimeout(() => {
                    this.applyActivationEffect();
                }, 50);
            }
            // Pour 'slide', pas d'effet supplémentaire, juste le glissement normal (déjà géré par CSS)
        });

        setTimeout(() => {
            this.isAnimating = false;
            if (this.isChecked) {
                this.options.onOpenEnd?.(this.el);
            } else {
                this.options.onCloseEnd?.(this.el);
            }
            this.options.onToggle?.(this.el, this.isChecked);
        }, 450);
    }

    private applyActivationEffect(): void {
        if (!this.handleElement) return;

        // Appliquer l'effet selon le type d'activation
        if (this.options.activation === 'haptic') {
            this.handleElement.classList.add('switch__handle--haptic');
            setTimeout(() => {
                this.handleElement?.classList.remove('switch__handle--haptic');
            }, 200);
        } else if (this.options.activation === 'scale') {
            // Animation scale : effet de transition classique
            this.handleElement.classList.add('switch__handle--scale');
            setTimeout(() => {
                this.handleElement?.classList.remove('switch__handle--scale');
            }, 300);
        }
        // Pour 'slide', pas d'effet supplémentaire, juste le glissement normal (déjà géré par CSS)
    }

    private updateVisualState(): void {
        if (!this.el || !this.trackElement || !this.handleElement) return;

        this.el.setAttribute('aria-checked', String(this.isChecked));
        if (this.isChecked) {
            this.el.classList.add('switch--checked');
            this.trackElement.classList.add('switch__track--checked');
        } else {
            this.el.classList.remove('switch--checked');
            this.trackElement.classList.remove('switch__track--checked');
        }

        if (this.textElement && (this.options.textUnchecked || this.options.textChecked)) {
            const newText = this.isChecked
                ? (this.options.textChecked || this.options.textUnchecked)
                : (this.options.textUnchecked || this.options.textChecked);
            if (newText) {
                this.textElement.textContent = newText;
            }
        }

        if (this.iconElement && this.options.showIcon) {
            const newIconName = this.isChecked
                ? (this.options.iconCheck || this.options.icon)
                : (this.options.iconUncheck || this.options.icon);

            if (newIconName) {
                const currentIconName = this.iconElement.getAttribute('name');
                if (currentIconName !== newIconName) {
                    this.iconElement.setAttribute('name', newIconName);
                    const IconManager = ManagerFactory.getIconManager();
                    IconManager.updateIcon(this.iconElement);
                }
            }
        }

        if (this.inputElement) {
            setAriaAttribute(this.inputElement, 'checked', this.isChecked);
            this.inputElement.checked = this.isChecked;
        }
    }

    private updateState(): void {
        this.updateVisualState();
    }


    public toggle(): void {
        if (!this.options.disabled && !this.isAnimating && this.inputElement) {
            this.inputElement.click();
        }
    }

    public check(): void {
        if (!this.isChecked && !this.options.disabled && !this.isAnimating) {
            this.toggle();
        }
    }

    public uncheck(): void {
        if (this.isChecked && !this.options.disabled && !this.isAnimating) {
            this.toggle();
        }
    }

    public getChecked(): boolean {
        return this.isChecked;
    }

    /**
     * Met à jour l'état checked du switch
     * @param checked - Nouvel état checked
     * @param silent - Si true, n'appelle pas les callbacks onChange (utile pour les mises à jour programmatiques)
     */
    public setChecked(checked: boolean, silent: boolean = false): void {
        if (this.isChecked !== checked && !this.options.disabled && !this.isAnimating) {
            this.isChecked = checked;
            if (this.inputElement) {
                this.inputElement.checked = checked;
            }
            this.updateState();

            // N'appeler les callbacks que si ce n'est pas une mise à jour silencieuse
            if (!silent) {
                this.options.onChange?.(this.el, this.isChecked);
                if (this.inputElement) {
                    this.inputElement.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        }
    }

    public updateOptions(newOptions: Partial<SwitchOptions>): void {
        this.options = { ...this.options, ...newOptions };

        if (newOptions.disabled !== undefined) {
            this.el.classList.toggle('switch--disabled', newOptions.disabled);
            if (this.inputElement) {
                this.inputElement.disabled = newOptions.disabled;
                if (newOptions.disabled) {
                    setAriaAttribute(this.inputElement, 'disabled', true);
                } else {
                    removeAriaAttribute(this.inputElement, 'disabled');
                }
            }
            if (this.switchElement) {
                const updatedStyle = newOptions.style !== undefined ? newOptions.style : this.options.style;
                const tabindex = (newOptions.disabled || updatedStyle === 'compact') ? '-1' : '0';
                this.switchElement.setAttribute('tabindex', tabindex);
            }
        }

        this.updateState();
        this.logger.success('Options updated successfully');
    }

    destroy(): void {
        try {
            super.destroy();
            this.logger.success('Switch destroyed successfully');
        } catch (error) {
            this.logger.error('Failed to destroy Switch:', error);
        }
    }

    static getInstance(el: HTMLElement): Switch | undefined {
        return Component.getInstance(el) as Switch | undefined;
    }

    static get defaults(): SwitchOptions {
        return _defaults;
    }

    static init(
        els: HTMLElement | InitElements<KElement>,
        options?: Partial<SwitchOptions>
    ): Switch | Switch[] {
        if (els instanceof Element) {
            return new Switch(els as HTMLElement, options);
        } else if (!!els && els.length) {
            const instances: Switch[] = [];
            for (let i = 0; i < els.length; i++) {
                instances.push(new Switch(els[i] as HTMLElement, options));
            }
            return instances;
        }
        return [];
    }
}

// ============================================================================
// CUSTOM ELEMENT
// ============================================================================

/**
 * Custom Element <k3ui-switch>
 * @description Permet l'utilisation de <k3ui-switch> dans le HTML. Initialisation par AutoInit.
 */
if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-switch')) {
    customElements.define('k3ui-switch', class extends HTMLElement {
        private switchInstance: Switch | null = null;

        connectedCallback() {
            // L'initialisation sera gérée par AutoInit ou manuellement via K.Switch.init(this)
            if (!this.hasAttribute('data-initialized')) {
                this.setAttribute('data-initialized', 'true');
            }
        }

        disconnectedCallback() {
            if (this.switchInstance) {
                this.switchInstance.destroy();
                this.switchInstance = null;
            }
        }

        static get observedAttributes() {
            return [
                'checked', 'disabled', 'label', 'label-position', 'style', 'activation',
                'traffic', 'name', 'value', 'type-icon', 'icon-check', 'icon-uncheck',
                'icon', 'show-icon', 'text-checked', 'text-unchecked'
            ];
        }

        attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
            if (this.switchInstance && oldValue !== newValue) {
                // Mettre à jour l'instance si elle existe
                const camelCaseName = name.replace(/-([a-z])/g, (g) => g[1].toUpperCase()) as keyof SwitchOptions;
                if (camelCaseName in this.switchInstance.options) {
                    Object.assign(this.switchInstance.options, { [camelCaseName]: newValue } as Partial<SwitchOptions>);
                }
            }
        }
    });
}

// Déclaration pour TypeScript
declare global {
    interface Window {
        Switch: typeof Switch;
    }
}

