/**
 * @fileoverview Composant WheelPicker pour K3UI
 * @description Sélecteur de caractères en colonnes rotatives (initiales arcade)
 */

import { Component } from '../core/base/Component';
import { toComponentClassDef } from '../types/components/component-base';
import type { WheelPickerDirection, WheelPickerOptions } from '../types/components';
import { InitElements, KElement, PriorityLevel } from '../types/base';
import { setAriaAttribute, setAriaAttributes } from '../utils/dom/aria';
import { getPreferReducedMotion } from '../utils/accessibility';
import { getWheelPickerDefaults } from '../specs/components/wheel-picker.specs';

/** Options par défaut du composant WheelPicker */
const _defaults: WheelPickerOptions = getWheelPickerDefaults();

/** Durée de l'animation de cycle entre deux caractères (ms) — alignée sur le CSS */
const CYCLE_ANIMATION_MS = 260;

/** Délai de base avant l'animation d'entrée d'une colonne (ms) */
const ENTRANCE_DELAY_BASE_MS = 120;

/** Décalage entre chaque colonne à l'entrée (ms) */
const ENTRANCE_STAGGER_MS = 90;

/** Classes CSS du composant WheelPicker */
export const WHEEL_PICKER_CSS = {
    root: 'wheel-picker',
    preview: 'wheel-picker__preview',
    previewChar: 'wheel-picker__preview-char',
    previewSaved: 'wheel-picker__preview--saved',
    wheels: 'wheel-picker__wheels',
    column: 'wheel-picker__column',
    columnMounted: 'wheel-picker__column--mounted',
    btn: 'wheel-picker__btn',
    btnUp: 'wheel-picker__btn--up',
    btnDown: 'wheel-picker__btn--down',
    display: 'wheel-picker__display',
    displayAnimating: 'wheel-picker__display--animating',
    letter: 'wheel-picker__letter',
    letterCurrent: 'wheel-picker__letter--current',
    letterHidden: 'wheel-picker__letter--hidden',
    letterSlideOutUp: 'wheel-picker__letter--slide-out-up',
    letterSlideOutDown: 'wheel-picker__letter--slide-out-down',
    letterSlideInUp: 'wheel-picker__letter--slide-in-up',
    letterSlideInDown: 'wheel-picker__letter--slide-in-down',
    shimmer: 'wheel-picker__shimmer',
    submit: 'wheel-picker__submit',
    submitSaved: 'wheel-picker__submit--saved',
    ripple: 'wheel-picker__ripple',
    saved: 'wheel-picker--saved',
} as const;

/**
 * Contrôleur interne d'une colonne rotative WheelPicker.
 */
class WheelPickerColumn {
    /** Élément racine de la colonne */
    readonly el: HTMLDivElement;

    /** Index de la colonne dans le sélecteur */
    readonly index: number;

    /** Caractère actuellement affiché */
    private value: string;

    /** Indique si une animation de cycle est en cours */
    private animating = false;

    /** Direction du dernier cycle (-1 haut, 1 bas) */
    private direction: WheelPickerDirection = 1;

    /** Identifiant du délai de secours d'animation en cours */
    private cycleTimeout: ReturnType<typeof setTimeout> | undefined;

    /** Gestionnaire de fin d'animation en cours */
    private cycleFinishHandler: (() => void) | null = null;

    /** Respecte prefers-reduced-motion */
    private readonly reducedMotion: boolean;

    /** Zone d'affichage du caractère */
    private displayEl: HTMLDivElement;

    /** Lettre courante affichée */
    private currentLetterEl: HTMLSpanElement;

    /** Bouton vers le caractère précédent */
    private upBtn: HTMLButtonElement;

    /** Bouton vers le caractère suivant */
    private downBtn: HTMLButtonElement;

    /** Liste des caractères autorisés */
    private readonly chars: string[];

    /** Callback lors d'un changement de caractère */
    private readonly onValueChange: (index: number, char: string) => void;

    /** Référence vers la méthode d'enregistrement d'événements du composant parent */
    private readonly registerEvent: (
        target: HTMLElement | Document | Window,
        event: string,
        handler: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions
    ) => () => void;

    /**
     * Crée une colonne rotative WheelPicker.
     * @param index - Index de la colonne
     * @param initialValue - Caractère initial
     * @param chars - Jeu de caractères autorisés
     * @param onValueChange - Callback de changement
     * @param registerEvent - Fonction d'enregistrement d'événements du parent
     * @param reducedMotion - Désactive les animations de cycle si true
     */
    constructor(
        index: number,
        initialValue: string,
        chars: string[],
        onValueChange: (index: number, char: string) => void,
        registerEvent: WheelPickerColumn['registerEvent'],
        reducedMotion = false
    ) {
        this.index = index;
        this.chars = chars;
        this.value = this.normalizeChar(initialValue);
        this.onValueChange = onValueChange;
        this.registerEvent = registerEvent;
        this.reducedMotion = reducedMotion;

        this.el = document.createElement('div');
        this.el.className = WHEEL_PICKER_CSS.column;
        this.el.dataset.column = String(index);

        this.upBtn = this.createNavButton('up', 'Lettre précédente');
        this.displayEl = this.createDisplay();
        this.downBtn = this.createNavButton('down', 'Lettre suivante');

        this.el.appendChild(this.upBtn);
        this.el.appendChild(this.displayEl);
        this.el.appendChild(this.downBtn);

        this.attachEvents();
        this.scheduleEntrance();
    }

    /**
     * Retourne le caractère courant de la colonne.
     * @returns Caractère affiché
     */
    getValue(): string {
        return this.value;
    }

    /**
     * Met à jour le caractère affiché sans animation.
     * @param char - Nouveau caractère
     */
    setValue(char: string): void {
        this.value = this.normalizeChar(char);
        this.currentLetterEl.textContent = this.value;
    }

    /**
     * Détruit la colonne et annule les temporisations en cours.
     */
    destroy(): void {
        this.cancelCycleAnimation();
        if (this.cycleTimeout) {
            clearTimeout(this.cycleTimeout);
            this.cycleTimeout = undefined;
        }
    }

    /**
     * Annule une animation de cycle en cours et nettoie le DOM.
     */
    private cancelCycleAnimation(): void {
        if (this.cycleFinishHandler) {
            this.cycleFinishHandler();
            this.cycleFinishHandler = null;
        }
    }

    /**
     * Normalise un caractère par rapport au jeu autorisé.
     * @param char - Caractère à normaliser
     * @returns Caractère valide
     */
    private normalizeChar(char: string): string {
        if (!this.chars.length) {
            return '';
        }
        const upper = (char || this.chars[0]).toUpperCase();
        const idx = this.chars.findIndex((c) => c.toUpperCase() === upper);
        return idx >= 0 ? this.chars[idx] : this.chars[0];
    }

    /**
     * Retourne l'index du caractère courant dans le jeu autorisé.
     * @returns Index du caractère
     */
    private getCharIndex(): number {
        const idx = this.chars.indexOf(this.value);
        return idx >= 0 ? idx : 0;
    }

    /**
     * Retourne le caractère adjacent selon une direction.
     * @param direction - Direction du cycle (-1 ou 1)
     * @returns Caractère adjacent
     */
    private getAdjacentChar(direction: WheelPickerDirection): string {
        const len = this.chars.length;
        const nextIndex = (this.getCharIndex() + direction + len) % len;
        return this.chars[nextIndex];
    }

    /**
     * Crée un bouton de navigation haut ou bas.
     * @param direction - Direction du bouton
     * @param label - Libellé accessible
     * @returns Bouton HTML
     */
    private createNavButton(direction: 'up' | 'down', label: string): HTMLButtonElement {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `${WHEEL_PICKER_CSS.btn} ${
            direction === 'up' ? WHEEL_PICKER_CSS.btnUp : WHEEL_PICKER_CSS.btnDown
        }`;
        setAriaAttribute(btn, 'label', label);
        btn.innerHTML =
            direction === 'up'
                ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7.4 15.4L6 14l6-6 6 6-1.4 1.4L12 10.8z" fill="currentColor"/></svg>'
                : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7.4 8.6L12 13.2l4.6-4.6L18 10l-6 6-6-6z" fill="currentColor"/></svg>';
        return btn;
    }

    /**
     * Crée la zone d'affichage du caractère courant.
     * @returns Conteneur d'affichage
     */
    private createDisplay(): HTMLDivElement {
        const display = document.createElement('div');
        display.className = WHEEL_PICKER_CSS.display;
        display.setAttribute('aria-hidden', 'true');

        this.currentLetterEl = document.createElement('span');
        this.currentLetterEl.className = `${WHEEL_PICKER_CSS.letter} ${WHEEL_PICKER_CSS.letterCurrent}`;
        this.currentLetterEl.textContent = this.value;

        const shimmer = document.createElement('div');
        shimmer.className = WHEEL_PICKER_CSS.shimmer;

        display.appendChild(this.currentLetterEl);
        display.appendChild(shimmer);
        return display;
    }

    /**
     * Attache les événements de la colonne.
     */
    private attachEvents(): void {
        this.registerEvent(this.upBtn, 'click', (event) => {
            this.cycle(-1, event as MouseEvent);
        });
        this.registerEvent(this.downBtn, 'click', (event) => {
            this.cycle(1, event as MouseEvent);
        });
        this.registerEvent(this.upBtn, 'keydown', (event) => {
            const e = event as KeyboardEvent;
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.cycle(-1);
            }
        });
        this.registerEvent(this.downBtn, 'keydown', (event) => {
            const e = event as KeyboardEvent;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.cycle(1);
            }
        });
    }

    /**
     * Programme l'animation d'entrée échelonnée de la colonne.
     */
    private scheduleEntrance(): void {
        const delay = ENTRANCE_DELAY_BASE_MS + this.index * ENTRANCE_STAGGER_MS;
        this.cycleTimeout = setTimeout(() => {
            this.el.classList.add(WHEEL_PICKER_CSS.columnMounted);
            this.cycleTimeout = undefined;
        }, delay);
    }

    /**
     * Déclenche un effet ripple sur un bouton.
     * @param button - Bouton cible
     * @param event - Événement pointeur optionnel
     */
    private fireRipple(button: HTMLButtonElement, event?: MouseEvent): void {
        const rect = button.getBoundingClientRect();
        const x = (event?.clientX ?? rect.left + rect.width / 2) - rect.left;
        const y = (event?.clientY ?? rect.top + rect.height / 2) - rect.top;
        const size = Math.max(rect.width, rect.height) * 2.2;

        const ripple = document.createElement('span');
        ripple.className = WHEEL_PICKER_CSS.ripple;
        ripple.style.left = `${x - size / 2}px`;
        ripple.style.top = `${y - size / 2}px`;
        ripple.style.width = `${size}px`;
        ripple.style.height = `${size}px`;

        button.appendChild(ripple);
        setTimeout(() => ripple.remove(), 560);
    }

    /**
     * Anime le passage au caractère adjacent.
     * @param direction - Direction du cycle (-1 haut, 1 bas)
     * @param event - Événement souris optionnel pour le ripple
     */
    private cycle(direction: WheelPickerDirection, event?: MouseEvent): void {
        if (this.animating || this.chars.length <= 1) {
            return;
        }

        const incomingChar = this.getAdjacentChar(direction);

        if (this.reducedMotion) {
            this.value = incomingChar;
            this.currentLetterEl.textContent = this.value;
            this.onValueChange(this.index, this.value);
            return;
        }

        const triggerBtn = direction === -1 ? this.upBtn : this.downBtn;
        this.fireRipple(triggerBtn, event);

        this.animating = true;
        this.direction = direction;
        this.cancelCycleAnimation();

        const outgoing = document.createElement('span');
        outgoing.className = `${WHEEL_PICKER_CSS.letter} ${
            direction === -1 ? WHEEL_PICKER_CSS.letterSlideOutDown : WHEEL_PICKER_CSS.letterSlideOutUp
        }`;
        outgoing.textContent = this.value;
        outgoing.setAttribute('aria-hidden', 'true');

        const incoming = document.createElement('span');
        incoming.className = `${WHEEL_PICKER_CSS.letter} ${
            direction === -1 ? WHEEL_PICKER_CSS.letterSlideInUp : WHEEL_PICKER_CSS.letterSlideInDown
        }`;
        incoming.textContent = incomingChar;
        incoming.setAttribute('aria-hidden', 'true');

        this.currentLetterEl.classList.add(WHEEL_PICKER_CSS.letterHidden);
        this.displayEl.classList.add(WHEEL_PICKER_CSS.displayAnimating);
        this.displayEl.appendChild(outgoing);
        this.displayEl.appendChild(incoming);

        let finished = false;
        const finishCycle = (): void => {
            if (finished) {
                return;
            }
            finished = true;

            if (this.cycleTimeout) {
                clearTimeout(this.cycleTimeout);
                this.cycleTimeout = undefined;
            }

            incoming.removeEventListener('animationend', onAnimationEnd);

            this.value = incomingChar;
            this.currentLetterEl.textContent = this.value;
            this.currentLetterEl.classList.remove(WHEEL_PICKER_CSS.letterHidden);
            outgoing.remove();
            incoming.remove();
            this.displayEl.classList.remove(WHEEL_PICKER_CSS.displayAnimating);
            this.animating = false;
            this.cycleFinishHandler = null;
            this.onValueChange(this.index, this.value);
        };

        const onAnimationEnd = (animationEvent: AnimationEvent): void => {
            if (animationEvent.target !== incoming) {
                return;
            }
            requestAnimationFrame(finishCycle);
        };

        this.cycleFinishHandler = finishCycle;
        incoming.addEventListener('animationend', onAnimationEnd);

        // Force le démarrage des animations CSS après insertion DOM
        void incoming.offsetHeight;

        this.cycleTimeout = setTimeout(finishCycle, CYCLE_ANIMATION_MS + 48);
    }
}

/**
 * Composant WheelPicker — sélecteur de caractères en colonnes rotatives.
 */
export class WheelPicker extends Component<WheelPickerOptions> {
    /** Niveau de priorité du composant */
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    /** Colonnes rotatives actives */
    private columns: WheelPickerColumn[] = [];

    /** Élément de prévisualisation */
    private previewEl: HTMLDivElement | null = null;

    /** Conteneur des colonnes */
    private wheelsEl: HTMLDivElement | null = null;

    /** Bouton de soumission */
    private submitBtn: HTMLButtonElement | null = null;

    /** Valeurs courantes par colonne */
    private values: string[] = [];

    /** Indique si la valeur a été soumise */
    private saved = false;

    /** Indique si les animations sont réduites */
    private reducedMotion = false;

    /**
     * Retourne les options par défaut du composant.
     */
    static get defaults(): WheelPickerOptions {
        return { ..._defaults };
    }

    /**
     * Récupère l'instance WheelPicker attachée à un élément.
     * @param el - Élément DOM
     * @returns Instance ou undefined
     */
    static getInstance(el: HTMLElement): WheelPicker | undefined {
        return Component.getInstance(el) as WheelPicker | undefined;
    }

    /**
     * Initialise une ou plusieurs instances WheelPicker.
     * @param els - Élément ou collection d'éléments
     * @param options - Options partielles
     * @returns Instance ou tableau d'instances
     */
    static init(els: HTMLElement, options?: Partial<WheelPickerOptions>): WheelPicker;
    static init(
        els: InitElements<KElement>,
        options?: Partial<WheelPickerOptions>
    ): WheelPicker[];
    static init(
        els: HTMLElement | InitElements<KElement>,
        options: Partial<WheelPickerOptions> = {}
    ): WheelPicker | WheelPicker[] {
        return Component.init(els, options, toComponentClassDef(WheelPicker)) as WheelPicker | WheelPicker[];
    }

    /**
     * Constructeur du composant WheelPicker.
     * @param el - Élément racine
     * @param options - Options utilisateur
     */
    constructor(el: HTMLElement, options: Partial<WheelPickerOptions> = {}) {
        super(el, options, toComponentClassDef(WheelPicker));
        this.init();
    }

    /**
     * Initialise le composant WheelPicker.
     */
    init(): void {
        const tag = this.el.tagName.toLowerCase();
        if (tag === 'k3ui-wheel-picker') {
            this.el.classList.add(WHEEL_PICKER_CSS.root);
        } else if (!this.el.classList.contains(WHEEL_PICKER_CSS.root)) {
            this.el.classList.add(WHEEL_PICKER_CSS.root);
        }

        this.readAttributes();
        this.reducedMotion = getPreferReducedMotion();
        this.values = this.parseInitialValues();
        this.buildDom();
        this.attachEvents();

        setAriaAttributes(this.el, {
            label: 'Sélecteur de caractères',
            live: 'polite',
        });
    }

    /**
     * Retourne la valeur courante concaténée.
     * @returns Chaîne de caractères sélectionnés
     */
    getValue(): string {
        return this.values.join('');
    }

    /**
     * Met à jour la valeur du sélecteur.
     * @param value - Nouvelle valeur (chaîne ou tableau)
     */
    setValue(value: string | string[]): void {
        const next = this.normalizeValueArray(value);
        this.values = next;
        this.saved = false;
        this.el.classList.remove(WHEEL_PICKER_CSS.saved);
        this.columns.forEach((col, i) => {
            col.setValue(next[i] ?? this.getDefaultChar());
        });
        this.updatePreview();
        this.updateSubmitButton();
    }

    /**
     * Réinitialise l'état « enregistré » du bouton de soumission.
     */
    resetSaved(): void {
        this.saved = false;
        this.el.classList.remove(WHEEL_PICKER_CSS.saved);
        this.updateSubmitButton();
        this.updatePreview();
    }

    /**
     * Détruit le composant et nettoie les ressources.
     */
    destroy(): void {
        this.columns.forEach((col) => col.destroy());
        this.columns = [];
        super.destroy();
    }

    /**
     * Lit les attributs HTML et les fusionne dans les options.
     */
    private readAttributes(): void {
        const lengthAttr = this.el.getAttribute('length');
        if (lengthAttr) {
            const n = parseInt(lengthAttr, 10);
            if (!Number.isNaN(n) && n > 0) {
                this.options.length = n;
            }
        }

        const valueAttr = this.el.getAttribute('value');
        if (valueAttr !== null) {
            this.options.value = valueAttr;
        }

        const allowedAttr = this.el.getAttribute('allowed-chars');
        if (allowedAttr) {
            this.options.allowedChars = allowedAttr;
        }

        const showPreviewAttr = this.el.getAttribute('show-preview');
        if (showPreviewAttr !== null) {
            this.options.showPreview = showPreviewAttr !== 'false';
        }

        const showSubmitAttr = this.el.getAttribute('show-submit-button');
        if (showSubmitAttr !== null) {
            this.options.showSubmitButton = showSubmitAttr !== 'false';
        }

        const submitTextAttr = this.el.getAttribute('submit-text');
        if (submitTextAttr !== null) {
            this.options.submitText = submitTextAttr;
        }

        const submittedTextAttr = this.el.getAttribute('submitted-text');
        if (submittedTextAttr !== null) {
            this.options.submittedText = submittedTextAttr;
        }
    }

    /**
     * Retourne le tableau de caractères autorisés.
     * @returns Tableau de caractères uniques
     */
    private getAllowedChars(): string[] {
        const raw = (this.options.allowedChars || _defaults.allowedChars).split('');
        const unique: string[] = [];
        raw.forEach((char) => {
            if (char && !unique.includes(char)) {
                unique.push(char);
            }
        });
        return unique.length ? unique : _defaults.allowedChars.split('');
    }

    /**
     * Retourne le caractère par défaut (premier du jeu autorisé).
     * @returns Caractère par défaut
     */
    private getDefaultChar(): string {
        const chars = this.getAllowedChars();
        return chars[0] ?? 'A';
    }

    /**
     * Normalise une valeur initiale en tableau de caractères.
     * @param value - Valeur source
     * @returns Tableau normalisé à la longueur configurée
     */
    private normalizeValueArray(value: string | string[]): string[] {
        const chars = this.getAllowedChars();
        const length = Math.max(1, this.options.length);
        let source: string[];

        if (Array.isArray(value)) {
            source = value;
        } else {
            source = String(value || '').split('');
        }

        const result: string[] = [];
        for (let i = 0; i < length; i++) {
            const raw = source[i] ?? this.getDefaultChar();
            const upper = raw.toUpperCase();
            const idx = chars.findIndex((c) => c.toUpperCase() === upper);
            result.push(idx >= 0 ? chars[idx] : this.getDefaultChar());
        }
        return result;
    }

    /**
     * Parse la valeur initiale depuis les options.
     * @returns Tableau de caractères initial
     */
    private parseInitialValues(): string[] {
        return this.normalizeValueArray(this.options.value);
    }

    /**
     * Construit la structure DOM du composant.
     */
    private buildDom(): void {
        this.el.innerHTML = '';
        this.columns = [];

        if (this.options.showPreview) {
            this.previewEl = document.createElement('div');
            this.previewEl.className = WHEEL_PICKER_CSS.preview;
            this.el.appendChild(this.previewEl);
            this.updatePreview();
        } else {
            this.previewEl = null;
        }

        this.wheelsEl = document.createElement('div');
        this.wheelsEl.className = WHEEL_PICKER_CSS.wheels;
        setAriaAttribute(this.wheelsEl, 'label', 'Colonnes de sélection');

        const chars = this.getAllowedChars();
        this.values.forEach((char, index) => {
            const column = new WheelPickerColumn(
                index,
                char,
                chars,
                (colIndex, newChar) => this.handleColumnChange(colIndex, newChar),
                this.registerEvent.bind(this),
                this.reducedMotion
            );
            this.columns.push(column);
            this.wheelsEl!.appendChild(column.el);
        });

        this.el.appendChild(this.wheelsEl);

        if (this.options.showSubmitButton) {
            this.submitBtn = document.createElement('button');
            this.submitBtn.type = 'button';
            this.submitBtn.className = WHEEL_PICKER_CSS.submit;
            this.updateSubmitButton();
            this.el.appendChild(this.submitBtn);
        } else {
            this.submitBtn = null;
        }
    }

    /**
     * Attache les événements globaux du composant.
     */
    private attachEvents(): void {
        if (this.submitBtn) {
            this.registerEvent(this.submitBtn, 'click', (event) => {
                this.handleSubmit(event as MouseEvent);
            });
        }
    }

    /**
     * Gère le changement de caractère d'une colonne.
     * @param index - Index de la colonne
     * @param char - Nouveau caractère
     */
    private handleColumnChange(index: number, char: string): void {
        this.values[index] = char;
        this.saved = false;
        this.el.classList.remove(WHEEL_PICKER_CSS.saved);
        this.updatePreview();
        this.updateSubmitButton();

        if (typeof this.options.onChange === 'function') {
            this.options.onChange(this.getValue());
        }
    }

    /**
     * Gère la soumission de la valeur.
     * @param event - Événement clic sur le bouton
     */
    private handleSubmit(event: MouseEvent): void {
        if (!this.submitBtn || this.saved) {
            return;
        }

        this.fireSubmitRipple(event);
        this.saved = true;
        this.el.classList.add(WHEEL_PICKER_CSS.saved);
        this.updateSubmitButton();
        this.updatePreview();

        if (typeof this.options.onSubmit === 'function') {
            this.options.onSubmit(this.getValue());
        }
    }

    /**
     * Déclenche un effet ripple sur le bouton de soumission.
     * @param event - Événement souris
     */
    private fireSubmitRipple(event: MouseEvent): void {
        if (!this.submitBtn) {
            return;
        }
        const rect = this.submitBtn.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const size = Math.max(rect.width, rect.height) * 2.2;

        const ripple = document.createElement('span');
        ripple.className = WHEEL_PICKER_CSS.ripple;
        ripple.style.left = `${x - size / 2}px`;
        ripple.style.top = `${y - size / 2}px`;
        ripple.style.width = `${size}px`;
        ripple.style.height = `${size}px`;
        this.submitBtn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 560);
    }

    /**
     * Met à jour l'affichage de la pilule de prévisualisation.
     */
    private updatePreview(): void {
        if (!this.previewEl) {
            return;
        }

        this.previewEl.innerHTML = '';
        this.previewEl.classList.toggle(WHEEL_PICKER_CSS.previewSaved, this.saved);

        this.values.forEach((char) => {
            const span = document.createElement('span');
            span.className = WHEEL_PICKER_CSS.previewChar;
            span.textContent = char;
            this.previewEl!.appendChild(span);
        });
    }

    /**
     * Met à jour le libellé et l'état visuel du bouton de soumission.
     */
    private updateSubmitButton(): void {
        if (!this.submitBtn) {
            return;
        }

        this.submitBtn.classList.toggle(WHEEL_PICKER_CSS.submitSaved, this.saved);

        if (this.saved) {
            this.submitBtn.innerHTML =
                '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 16.2l-3.5-3.5L4.1 14.1 9 19 20.3 7.7l-1.4-1.4z" stroke="currentColor" stroke-width="2" fill="currentColor"/></svg>' +
                `<span>${this.options.submittedText}</span>`;
            setAriaAttribute(this.submitBtn, 'label', this.options.submittedText);
        } else {
            this.submitBtn.textContent = this.options.submitText;
            setAriaAttribute(this.submitBtn, 'label', this.options.submitText);
        }
    }
}
