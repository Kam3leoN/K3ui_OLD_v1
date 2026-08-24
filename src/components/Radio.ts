/**
 * K3UI Radio Component
 * Composant de radio button basé sur Material Design 3
 *
 * @summary Radio Button Material Design 3
 * @element k3ui-radio
 *
 * @event change - La valeur change
 * @event toggle - Bascule entre sélectionné/désélectionné
 * @event focus - Obtient le focus
 * @event blur - Perd le focus
 */

import { Component } from '../core/base/Component';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import { RadioOptions } from '../types/components';
import { PriorityLevel } from '../types/base';
import { KElement, InitElements } from '../types/base';
import { LoggerManager } from '../core/managers/LoggerManager';
import { ManagerFactory } from '../core/factories/ManagerFactory';
import { setAriaAttribute, setAriaAttributes, removeAriaAttribute } from '../utils/dom/aria';
import { Keyboard, Mouse } from '../core/managers';
import { getRadioDefaults } from '../specs/components/radio.specs';
import { HapticManager } from '../core/managers/HapticManager';
import { bindPointerDown, getPointerPressReleaseBindings } from '../utils/dom/pointer';

/** Durée d'animation toggle alignée sur spatial-fast (~350ms) */
const TOGGLE_ANIMATION_MS = 350;

/**
 * Options par défaut du composant Radio
 * @description Extrait depuis les specs pour garantir la cohérence
 */
const _defaults: RadioOptions = getRadioDefaults();

/**
 * Classe Radio
 * Gère les radio buttons avec toutes leurs fonctionnalités selon Material Design 3
 */
export class Radio extends Component<RadioOptions> {
    /** Niveau de priorité du composant */
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    private radioElement: HTMLElement | null = null;
    private containerElement: HTMLElement | null = null;
    private stateLayerElement: HTMLElement | null = null;
    /** Cercle SVG intérieur (géométrie M3E : cx/cy 10, r 5) */
    private dotElement: SVGCircleElement | null = null;
    private inputElement: HTMLInputElement | null = null;
    private labelElement: HTMLElement | null = null;
    private isChecked: boolean = false;
    private isAnimating: boolean = false;
    private logger: LoggerManager;
    private keyboardHandler: Keyboard | null = null;
    private mouseHandler: Mouse | null = null;
    private _unbindRadioPointerDown: (() => void) | null = null;
    private animationTimer: ReturnType<typeof setTimeout> | null = null;
    /** Sélection anticipée au pointerdown (le change natif ne se déclenche alors plus) */
    private pendingSelectionNotify: boolean = false;

    /**
     * Constructeur
     * @param el - Élément DOM du Radio
     * @param options - Options de configuration
     */
    constructor(el: HTMLElement, options: Partial<RadioOptions> = {}) {
        super(el, options, toComponentClassDef(Radio));

        this.logger = ManagerFactory.getLoggerManager('[Radio]');

        // Initialiser les options avec les valeurs par défaut
        this.options = {
            ...Radio.defaults,
            ...options
        };

        // Récupérer les attributs HTML si présents
        if (el.hasAttribute('checked') || (el as HTMLInputElement).checked) {
            this.options.checked = true;
        }

        if (el.hasAttribute('disabled')) {
            this.options.disabled = true;
        }

        if (el.hasAttribute('error') || el.classList.contains('radio--error')) {
            this.options.error = true;
        }

        if (el.hasAttribute('data-label') || el.hasAttribute('label')) {
            const labelValue = el.getAttribute('data-label') || el.getAttribute('label');
            this.options.label = labelValue ?? undefined;
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

        // Récupérer l'état initial depuis les options
        this.isChecked = this.options.checked;

        // L'instance est gérée via ComponentRegistry (voir getInstance())

        this.init();
    }

    static getInstance(el: HTMLElement): Radio | undefined {
        return Component.getInstance(el) as Radio | undefined;
    }

    static get defaults(): RadioOptions {
        return _defaults;
    }

    /**
     * Initialise une instance de Radio.
     * @param el Élément HTML.
     * @param options Options du composant.
     */
    static init(el: HTMLElement, options?: Partial<RadioOptions>): Radio;
    /**
     * Initialise des instances de Radio.
     * @param els Éléments HTML.
     * @param options Options du composant.
     */
    static init(els: InitElements<KElement>, options?: Partial<RadioOptions>): Radio[];
    static init(
        els: HTMLElement | InitElements<KElement>,
        options?: Partial<RadioOptions>
    ): Radio | Radio[] {

        if (els instanceof Element) {
            const existing = Radio.getInstance(els as HTMLElement);
            if (existing) {
                return existing;
            }
            return new Radio(els as HTMLElement, options);
        } else if (!!els && els.length) {
            const instances = [];
            for (let i = 0; i < els.length; i++) {
                const existing = Radio.getInstance(els[i] as HTMLElement);
                if (existing) {
                    instances.push(existing);
                } else {
                    instances.push(new Radio(els[i] as HTMLElement, options));
                }
            }
            return instances;
        }
        return [];
    }

    /**
     * Initialisation du composant
     */
    private init(): void {
        try {
            this.setupStructure();
            this.setupEventListeners();
            this.updateState();

            // Normaliser les groupes après l'initialisation pour s'assurer qu'un seul radio par groupe est sélectionné
            if (this.options.name) {
                // Utiliser setTimeout avec un délai plus long pour s'assurer que tous les radios du groupe sont initialisés
                setTimeout(() => {
                    this.normalizeGroup();
                }, 100);
            }

            this.logger.success('Radio initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize Radio:', error);
        }
    }

    /**
     * Configuration de la structure HTML
     */
    private setupStructure(): void {
        // Ajouter la classe de base
        this.el.classList.add('radio');

        // Créer la structure du radio
        this.createRadioStructure();

        // Mettre à jour l'état visuel
        this.updateVisualState();
    }

    /**
     * Création de la structure HTML du radio
     */
    private createRadioStructure(): void {
        // Créer le conteneur principal du radio (visuel)
        this.radioElement = document.createElement('div');

        // Créer le state layer (zone de touch interactif)
        this.stateLayerElement = document.createElement('div');
        this.stateLayerElement.classList.add('radio__state-layer');

        // Container + SVG M3E (viewBox 20×20, anneau r=10/mask r=8, point r=5, centre 10,10)
        this.containerElement = document.createElement('div');
        this.containerElement.classList.add('radio__container');
        setAriaAttribute(this.containerElement, 'hidden', true);

        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.classList.add('radio__icon');
        svg.setAttribute('viewBox', '0 0 20 20');
        svg.setAttribute('focusable', 'false');

        const maskId = `radio-cutout-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const mask = document.createElementNS(svgNS, 'mask');
        mask.setAttribute('id', maskId);

        const maskRect = document.createElementNS(svgNS, 'rect');
        maskRect.setAttribute('width', '100%');
        maskRect.setAttribute('height', '100%');
        maskRect.setAttribute('fill', 'white');

        const maskCircle = document.createElementNS(svgNS, 'circle');
        maskCircle.setAttribute('cx', '10');
        maskCircle.setAttribute('cy', '10');
        maskCircle.setAttribute('r', '8');
        maskCircle.setAttribute('fill', 'black');

        mask.appendChild(maskRect);
        mask.appendChild(maskCircle);

        const outer = document.createElementNS(svgNS, 'circle');
        outer.classList.add('radio__outer');
        outer.setAttribute('cx', '10');
        outer.setAttribute('cy', '10');
        outer.setAttribute('r', '10');
        outer.setAttribute('mask', `url(#${maskId})`);

        this.dotElement = document.createElementNS(svgNS, 'circle');
        this.dotElement.classList.add('radio__dot');
        this.dotElement.setAttribute('cx', '10');
        this.dotElement.setAttribute('cy', '10');
        this.dotElement.setAttribute('r', '5');

        svg.appendChild(mask);
        svg.appendChild(outer);
        svg.appendChild(this.dotElement);

        // Assembler la structure visuelle
        // Le state layer doit être en premier pour être derrière le container
        if (this.radioElement) {
            this.radioElement.appendChild(this.stateLayerElement);
        }

        // Le container doit être au-dessus du state layer
        if (this.containerElement) {
            this.containerElement.appendChild(svg);
            if (this.radioElement) {
                this.radioElement.appendChild(this.containerElement);
            }
        }

        // Créer l'input caché
        this.inputElement = document.createElement('input');
        this.inputElement.type = 'radio';
        this.inputElement.classList.add('radio__input');
        this.inputElement.checked = this.isChecked;
        this.inputElement.disabled = this.options.disabled;
        this.inputElement.setAttribute('role', 'radio');
        setAriaAttribute(this.inputElement, 'checked', this.isChecked);
        if (this.options.disabled) {
            setAriaAttribute(this.inputElement, 'disabled', true);
        } else {
            removeAriaAttribute(this.inputElement, 'disabled');
        }

        if (this.options.name) {
            this.inputElement.name = this.options.name;
        }

        if (this.options.value) {
            this.inputElement.value = this.options.value;
        }

        // Créer le label si nécessaire
        if (this.options.showLabel && this.options.label) {
            this.labelElement = document.createElement('label');
            this.labelElement.classList.add('radio__label');
            this.labelElement.textContent = this.options.label;

            // Associer le label à l'input
            const labelId = `radio-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
            this.inputElement.id = labelId;
            this.labelElement.setAttribute('for', labelId);
        }

        // Assembler dans le DOM
        // L'input doit être dans le radioElement pour limiter sa zone cliquable
        if (this.radioElement) {
            this.radioElement.appendChild(this.inputElement);
        }
        this.el.appendChild(this.radioElement);
        if (this.labelElement) {
            this.el.appendChild(this.labelElement);
        }

        // Appliquer les classes d'état
        if (this.options.disabled) {
            this.el.classList.add('radio--disabled');
        }

        if (this.options.error) {
            this.el.classList.add('radio--error');
        }

        if (this.isChecked) {
            this.el.classList.add('radio--checked');
        }

        if (!this.options.disabled) {
            this.inputElement.setAttribute('tabindex', '0');
        }
    }

    /**
     * Configuration des écouteurs d'événements
     */
    private setupEventListeners(): void {
        if (!this.inputElement) return;

        // Intercepter le clic AVANT que le navigateur ne change l'état de l'input
        // AMÉLIORATION: Sélectionner d'abord ce radio, puis désélectionner les autres
        // Cela garantit qu'il y a toujours un radio sélectionné, même lors de clics rapides
        this._unbindRadioPointerDown = bindPointerDown(
            this.inputElement,
            () => {
                if (!this.options.disabled && this.options.name && this.inputElement) {
                    const wasUnchecked = !this.isChecked;
                    if (!this.inputElement.checked) {
                        this.inputElement.checked = true;
                        this.isChecked = true;
                    }
                    this.deselectOtherRadiosInGroup();
                    // Le navigateur ne déclenchera plus « change » : notifier au click
                    if (wasUnchecked) {
                        this.pendingSelectionNotify = true;
                        this.updateVisualState();
                    }
                }
            },
            { capture: true }
        );

        // Utiliser Mouse pour gérer les événements souris
        this.mouseHandler = new Mouse({
            target: this.inputElement,
            enabled: true,
            onClick: (event: MouseEvent) => {
                if (!this.options.disabled) {
                    this.handleToggle(event);
                }
            },
            onMouseEnter: () => {
                if (!this.options.disabled && !this.isAnimating) {
                    this.el.classList.add('radio--hovered');
                }
            },
            onMouseLeave: () => {
                if (!this.options.disabled) {
                    this.el.classList.remove('radio--hovered');
                }
            }
        });

        // Utiliser Keyboard pour gérer les événements clavier
        this.keyboardHandler = new Keyboard({
            target: this.inputElement,
            enabled: true,
            onKeyDown: (event: KeyboardEvent, key: string) => {
                if (!this.options.disabled) {
                    if (key === 'Enter' || key === ' ') {
                        event.preventDefault();
                        this.handleToggle(event);
                    } else if (key === 'ArrowUp' || key === 'ArrowDown') {
                        // Navigation entre radios du même groupe
                        event.preventDefault();
                        this.navigateGroup(key === 'ArrowDown' ? 'next' : 'prev');
                    }
                }
            }
        });

        getPointerPressReleaseBindings(this.inputElement, {
            onPress: () => {
                if (!this.options.disabled) {
                    this.el.classList.add('radio--pressed');
                }
            },
            onRelease: () => {
                this.el.classList.remove('radio--pressed');
            },
        }).forEach(({ target, type, handler, options }) => {
            this.registerEvent(target, type, handler as EventListener, options);
        });

        // IMPORTANT: désélectionner les autres radios AVANT de mettre à jour l'état
        this.registerEvent(this.inputElement, 'input', (event: Event) => {
            const target = event.target as HTMLInputElement;
            if (target.checked && this.options.name) {
                this.deselectOtherRadiosInGroup();
            }
            const wasChecked = this.isChecked;
            const nextChecked = target.checked;
            if (!wasChecked && nextChecked) {
                this.handleToggle(event);
            } else {
                this.isChecked = nextChecked;
            }
        });

        this.registerEvent(this.inputElement, 'change', (event: Event) => {
            const target = event.target as HTMLInputElement;
            if (target.checked && this.options.name) {
                this.deselectOtherRadiosInGroup();
            }
            this.isChecked = target.checked;
            this.updateState();
            // Si le pointerdown a déjà prévu la notif, le click/handleToggle s'en charge
            if (this.pendingSelectionNotify) {
                return;
            }
            this.options.onChange?.(this.el, this.isChecked);
        });

        this.registerEvent(this.inputElement, 'focus', () => {
            if (!this.options.disabled) {
                this.el.classList.add('radio--focused');
                this.options.onFocus?.(this.el);
            }
        });

        this.registerEvent(this.inputElement, 'blur', () => {
            if (!this.options.disabled) {
                this.el.classList.remove('radio--focused');
                this.options.onBlur?.(this.el);
            }
        });
    }

    /**
     * Navigation entre les radios du même groupe
     */
    private navigateGroup(direction: 'next' | 'prev'): void {
        if (!this.options.name || !this.inputElement) return;

        const radios = Array.from(
            document.querySelectorAll<HTMLInputElement>(`input[type="radio"][name="${this.options.name}"]`)
        );

        const currentIndex = radios.findIndex(radio => radio === this.inputElement);
        if (currentIndex === -1) return;

        let targetIndex: number;
        if (direction === 'next') {
            targetIndex = (currentIndex + 1) % radios.length;
        } else {
            targetIndex = (currentIndex - 1 + radios.length) % radios.length;
        }

        const targetRadio = radios[targetIndex];
        if (targetRadio) {
            targetRadio.focus();
            targetRadio.click();
        }
    }

    /**
     * Désélectionne les autres radios du même groupe
     * Cette méthode est CRITIQUE pour garantir qu'un seul radio peut être sélectionné à la fois
     * AMÉLIORATION: Garantit qu'il y a toujours un radio sélectionné en sélectionnant d'abord le nouveau
     */
    private deselectOtherRadiosInGroup(): void {
        if (!this.options.name || !this.inputElement) return;


        const radios = Array.from(
            document.querySelectorAll<HTMLInputElement>(`input[type="radio"][name="${this.options.name}"]`)
        );

        // AMÉLIORATION CRITIQUE: S'assurer que le radio actuel est TOUJOURS sélectionné AVANT de désélectionner les autres
        // Cela garantit qu'il y a toujours un radio sélectionné, même lors de clics rapides
        // On sélectionne le radio actuel si :
        // 1. Il n'est pas déjà checked dans l'input natif
        // 2. OU si isChecked est true (état interne indique qu'il devrait être checked)
        // 3. OU si c'est le radio qui a déclenché l'événement (on veut le sélectionner)
        if (!this.inputElement.checked) {
            // Toujours sélectionner ce radio avant de désélectionner les autres
            // C'est la clé pour éviter les décrochages
            this.inputElement.checked = true;
            this.isChecked = true;

            // CRITIQUE: Mettre à jour l'état visuel immédiatement pour que la classe radio--checked soit appliquée
            this.el.classList.add('radio--checked');
            setAriaAttribute(this.inputElement, 'checked', true);
            this.updateVisualState();

        } else if (this.inputElement.checked && !this.el.classList.contains('radio--checked')) {
            // Si l'input est checked mais la classe n'est pas présente, la synchroniser
            this.isChecked = true;
            this.el.classList.add('radio--checked');
            setAriaAttribute(this.inputElement, 'checked', true);
            this.updateVisualState();
        }

        // Désélectionner TOUS les autres radios du même groupe de manière synchrone et immédiate
        radios.forEach(radio => {
            if (radio !== this.inputElement) {
                // Désélectionner l'input natif immédiatement (même s'il n'est pas checked)
                radio.checked = false;

                // Mettre à jour l'instance correspondante
                const radioEl = radio.closest('.radio') as HTMLElement;
                if (radioEl) {
                    const radioInstance = Radio.getInstance(radioEl);
                    if (radioInstance) {
                        // Mettre à jour l'état sans déclencher à nouveau la désélection
                        radioInstance.isChecked = false;
                        radioInstance.el.classList.remove('radio--checked');
                        if (radioInstance.inputElement) {
                            setAriaAttribute(radioInstance.inputElement, 'checked', false);
                        }
                        // Mettre à jour l'état visuel
                        radioInstance.updateVisualState();
                    }
                }
            }
        });

        // Vérification finale: garantir qu'au moins un radio est sélectionné
        const hasCheckedRadio = radios.some(radio => radio.checked);


        // PROTECTION CRITIQUE: Si aucun radio n'est sélectionné (peut arriver lors de clics rapides),
        // TOUJOURS sélectionner celui-ci immédiatement
        if (!hasCheckedRadio && this.inputElement) {

            this.inputElement.checked = true;
            this.isChecked = true;
            this.el.classList.add('radio--checked');
            if (this.inputElement) {
                setAriaAttribute(this.inputElement, 'checked', true);
            }
            this.updateVisualState();
        }

        // PROTECTION ADDITIONNELLE: Vérifier une dernière fois que le radio actuel est bien sélectionné
        // Cela protège contre les cas où le navigateur pourrait avoir désélectionné le radio entre-temps
        if (this.inputElement && !this.inputElement.checked) {

            this.inputElement.checked = true;
            this.isChecked = true;
            this.el.classList.add('radio--checked');
            setAriaAttribute(this.inputElement, 'checked', true);
            this.updateVisualState();
        }
    }

    /**
     * Normalise le groupe : s'assure qu'un seul radio par groupe est sélectionné
     * Si plusieurs radios sont sélectionnés, garde le premier et désélectionne les autres
     */
    private normalizeGroup(): void {
        if (!this.options.name || !this.inputElement) return;

        const radios = Array.from(
            document.querySelectorAll<HTMLInputElement>(`input[type="radio"][name="${this.options.name}"]`)
        );

        const checkedRadios = radios.filter(radio => radio.checked);

        // Si plusieurs radios sont sélectionnés, garder seulement le premier
        if (checkedRadios.length > 1) {
            // Garder le premier checked
            const firstChecked = checkedRadios[0];

            // Désélectionner tous les autres
            checkedRadios.slice(1).forEach(radio => {
                radio.checked = false;
                const radioEl = radio.closest('.radio') as HTMLElement;
                if (radioEl) {
                    const radioInstance = Radio.getInstance(radioEl);
                    if (radioInstance) {
                        radioInstance.isChecked = false;
                        radioInstance.updateState();
                    }
                }
            });
        }
    }

    /**
     * Gère le toggle du radio
     */
    private handleToggle(event: Event): void {
        if (this.options.disabled) return;

        // Sélection déjà appliquée au pointerdown : finaliser callbacks + onChange
        if (this.pendingSelectionNotify) {
            this.pendingSelectionNotify = false;
            if (this.isAnimating) return;

            HapticManager.triggerFromOptions(this.options, 'light');
            this.isAnimating = true;
            this.options.onOpenStart?.(this.el);
            this.updateState();
            this.options.onChange?.(this.el, true);

            if (this.animationTimer) {
                clearTimeout(this.animationTimer);
            }
            this.animationTimer = setTimeout(() => {
                this.isAnimating = false;
                this.animationTimer = null;
                this.options.onOpenEnd?.(this.el);
                this.options.onToggle?.(this.el, true);
            }, TOGGLE_ANIMATION_MS);
            return;
        }

        if (this.isAnimating || this.isChecked) return;

        HapticManager.triggerFromOptions(this.options, 'light');

        const wasChecked = this.isChecked;
        this.isChecked = true;
        this.isAnimating = true;

        if (!wasChecked) {
            this.options.onOpenStart?.(this.el);
        } else {
            this.options.onCloseStart?.(this.el);
        }

        if (this.options.name) {
            this.deselectOtherRadiosInGroup();
        }

        this.updateState();
        this.options.onChange?.(this.el, true);

        requestAnimationFrame(() => {
            this.updateVisualState();
        });

        if (this.animationTimer) {
            clearTimeout(this.animationTimer);
        }

        this.animationTimer = setTimeout(() => {
            this.isAnimating = false;
            this.animationTimer = null;
            if (this.isChecked) {
                this.options.onOpenEnd?.(this.el);
            } else {
                this.options.onCloseEnd?.(this.el);
            }
            this.options.onToggle?.(this.el, this.isChecked);
        }, TOGGLE_ANIMATION_MS);
    }

    /**
     * Met à jour l'état du composant
     */
    private updateState(): void {
        if (!this.inputElement) return;

        // TOUJOURS désélectionner les autres radios si ce radio devient checked
        // Cela doit être fait AVANT de mettre à jour l'input pour éviter les sélections multiples
        if (this.isChecked && this.options.name) {
            this.deselectOtherRadiosInGroup();
        }

        // S'assurer que l'input natif reflète l'état
        this.inputElement.checked = this.isChecked;

        // Vérification finale : si plusieurs radios sont checked dans le groupe, ne garder que celui-ci
        if (this.isChecked && this.options.name) {
            const radios = Array.from(
                document.querySelectorAll<HTMLInputElement>(`input[type="radio"][name="${this.options.name}"]`)
            );
            const checkedCount = radios.filter(r => r.checked).length;
            if (checkedCount > 1) {
                // Forcer la désélection de tous les autres
                this.deselectOtherRadiosInGroup();
                // S'assurer que celui-ci reste checked
                this.inputElement.checked = true;
                this.isChecked = true;
            }
        }

        // Mettre à jour aria-disabled selon l'état disabled
        if (this.options.disabled) {
            setAriaAttribute(this.inputElement, 'disabled', true);
        } else {
            removeAriaAttribute(this.inputElement, 'disabled');
        }

        // Mettre à jour aria-checked selon l'état
        if (this.isChecked) {
            setAriaAttribute(this.inputElement, 'checked', true);
        } else {
            setAriaAttribute(this.inputElement, 'checked', false);
        }

        this.updateVisualState();
    }

    /**
     * Met à jour l'état visuel du composant
     */
    private updateVisualState(): void {
        if (!this.el || !this.dotElement) return;

        // Mettre à jour les classes d'état
        if (this.isChecked) {
            this.el.classList.add('radio--checked');
        } else {
            this.el.classList.remove('radio--checked');
        }
    }

    /**
     * Obtient l'état checked du radio
     */
    getChecked(): boolean {
        return this.isChecked;
    }

    /**
     * Définit l'état checked du radio
     * @description Autorisé pendant une animation (réinit programmatique, sync de groupe)
     */
    setChecked(checked: boolean): void {
        if (this.options.disabled) return;

        // Un radio ne peut pas être désélectionné directement
        if (!checked) return;

        this.isChecked = checked;

        // Désélectionner les autres radios du même groupe
        if (this.options.name && checked) {
            this.deselectOtherRadiosInGroup();
        }

        this.updateState();
    }

    /**
     * Bascule l'état du radio (seulement pour sélectionner, pas désélectionner)
     */
    toggle(): void {
        if (this.isAnimating || this.options.disabled) return;
        if (!this.isChecked) {
            this.setChecked(true);
        }
    }

    /**
     * Détruit l'instance du composant
     */
    destroy(): void {
        if (this.animationTimer) {
            clearTimeout(this.animationTimer);
            this.animationTimer = null;
        }

        if (this.keyboardHandler) {
            this.keyboardHandler.destroy();
            this.keyboardHandler = null;
        }

        if (this.mouseHandler) {
            this.mouseHandler.destroy();
            this.mouseHandler = null;
        }

        if (this._unbindRadioPointerDown) {
            this._unbindRadioPointerDown();
            this._unbindRadioPointerDown = null;
        }

        if (this.inputElement) {
            removeAriaAttribute(this.inputElement, 'checked');
            removeAriaAttribute(this.inputElement, 'disabled');
        }

        super.destroy();

        this.logger.success('Radio destroyed');
    }
}

// ============================================================================
// WEB COMPONENT REGISTRATION
// ============================================================================

/**
 * Enregistrement du Web Component k3ui-radio
 * @description Permet l'utilisation de <k3ui-radio> dans le HTML. Initialisation par AutoInit.
 */
if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-radio')) {
    customElements.define('k3ui-radio', class extends HTMLElement {
        private radioInstance: Radio | null = null;

        connectedCallback() {
            // L'initialisation sera gérée par AutoInit
            // ou manuellement via K.Radio.init(this)
        }

        disconnectedCallback() {
            if (this.radioInstance) {
                this.radioInstance.destroy();
                this.radioInstance = null;
            }
        }

        static get observedAttributes() {
            return [
                'checked', 'disabled', 'error', 'label', 'name', 'value'
            ];
        }

        attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
            if (this.radioInstance && oldValue !== newValue) {
                // Mettre à jour l'instance si elle existe
                const camelCaseName = name.replace(/-([a-z])/g, (g) => g[1].toUpperCase()) as keyof RadioOptions;
                if (camelCaseName in this.radioInstance.options) {
                    Object.assign(this.radioInstance.options, { [camelCaseName]: newValue } as Partial<RadioOptions>);
                }
            }
        }
    });
}

