/**
 * @fileoverview Composant Dialog K3UI - Modales Material Design 3 You Expressive
 * @description Composant de dialogue modal conforme à Material Design 3
 * @see https://m3.material.io/components/dialogs/overview
 * @author K3UI Team
 * @version 2.0.0
 */

import { Component } from '../core/base/Component';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import { OpenableComponent } from '../core/base/OpenableComponent';
import { createK3UIElementClass } from '../core/base/K3UIElement';
import { KElement, InitElements } from '../types/base';
import { DialogOptions, type DialogAnimation } from '../types/components';
import { ManagerFactory } from '../core/factories/ManagerFactory';
import { getDialogDefaults } from '../specs/components/dialog.specs';
import { getAriaAttribute, setAriaAttributes, removeAriaAttribute } from '../utils/dom/aria';
import { ScrollbarManager, type ScrollbarHandle } from '../core/managers/ScrollbarManager';
import { Keyboard, Mouse } from '../core/managers';
import { DialogActionButtonClasses, DialogSpecs } from '../specs/components/dialog.specs';
import { IconManager, LocaleManager, ThemeManager } from '../core/managers';
import { HapticManager } from '../core/managers/HapticManager';
import {
    buildEffectsTransition,
    buildMotionTransition,
    buildSpatialEffectsTransition,
    shouldSkipMotion,
} from '../utils/motion/buildMotionTransition';
import { MotionPresets } from '../specs/common/motion-presets.specs';
import { readMotionSpring } from '../utils/motion/motionSpring';
import { Field } from './Field';
import { Select } from './Select';
import { Radio } from './Radio';
import {
    computePosition,
    flip,
    shift,
    size,
    offset,
    autoUpdate,
    type Placement,
    type ComputePositionConfig,
} from '../utils/floating';
import { getK3uiComponentWindowOptions } from '../core/autoinit/window-options';
import { escapeHtml, sanitizeHtmlFragment } from '../utils/dom/sanitize';
import { Sheet } from './Sheet';
import {
    animateDialogSectionsIn,
    animateDialogSectionsOut,
    getCenteredDialogExitTransform,
    getCenteredDialogTransform,
    getFullscreenDialogExitTransform,
    getFullscreenDialogTransform,
    prepareDialogSectionsForEnter,
    resetDialogSectionStyles,
} from '../utils/motion/dialogAnimations';
import { createDialogSpringController, type DialogSpringController } from '../utils/motion/dialogSpringMotion';
import type { M3SpringSpeed } from '../utils/motion/springValue';
import { containerTransform, containerTransformOut } from '../utils/motion/containerTransform';
import { windowSizeClass } from '../utils/layout/windowSizeClass';

export interface DialogChoiceItem {
    label: string;
    value: string;
    supportingText?: string;
    /** Nom d'icône IconManager (mode grille) */
    icon?: string;
    disabled?: boolean;
}

export type DialogChoiceMode = 'list' | 'single' | 'multiple' | 'grid';

export interface DialogChoiceOptions {
    mode: DialogChoiceMode;
    items: DialogChoiceItem[];
    value?: string | string[];
    /** Colonnes demandées (mode grille, 1–12 — grille s12) */
    columns?: number;
    closeOnSelect?: boolean;
    onSelect?: (value: string | string[]) => void;
}

/** Colonnes max grille (système s12). */
const GRID_COLUMNS_MAX = 12;
/** Largeur minimale d'une cellule (px) pour le calcul responsive. */
const GRID_CELL_MIN_WIDTH = 44;
const GRID_COLUMN_GAP = 12;
const GRID_INLINE_PADDING = 48;

/** Borne le nombre de colonnes grille selon la largeur disponible (s12, max 12). */
const fitChoiceColumns = (requested: number, width: number): number => {
    const clamped = Math.max(1, Math.min(Math.round(requested) || 4, GRID_COLUMNS_MAX));
    const cellMin =
        clamped >= 10 ? 36 : clamped >= 6 ? 40 : GRID_CELL_MIN_WIDTH;
    const maxFit = Math.max(
        1,
        Math.floor((width - GRID_INLINE_PADDING + GRID_COLUMN_GAP) / (cellMin + GRID_COLUMN_GAP))
    );
    return Math.min(clamped, maxFit);
};

export type DialogCloseReason = 'escape' | 'scrim' | 'action' | 'select' | 'back' | 'api';

export interface DialogResult {
    reason: DialogCloseReason;
    returnValue: string;
    value?: string | string[];
}

/**
 * Parties du markup dialog M3 (headline / content / actions)
 */
export interface DialogMarkupParts {
    header?: string;
    icon?: string;
    content: string;
    footer?: string;
    scrollable?: boolean;
    /** Variante M3 — influence la structure du markup */
    variant?: DialogOptions['variant'];
    /** Libellé du bouton de confirmation en mode fullscreen */
    confirmLabel?: string;
}

/**
 * Options par défaut du composant Dialog
 * @description Extrait depuis les specs MD3 pour garantir la cohérence
 */
const _defaults: DialogOptions = getDialogDefaults();
const DIALOG_ALLOWED_TAGS = new Set([
    'div', 'span', 'p', 'b', 'i', 'u', 's', 'strong', 'em', 'del',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'br', 'hr',
    'button', 'form', 'input', 'label', 'select', 'option', 'textarea',
    'ul', 'ol', 'li', 'pre', 'code',
    'k3ui-field', 'k3ui-select', 'k3ui-radio', 'i'
]);
const DIALOG_ALLOWED_ATTRS: Record<string, Set<string>> = {
    div: new Set(['class', 'id', 'style', 'role', 'data-*', 'aria-*']),
    span: new Set(['class', 'id', 'style', 'role', 'data-*', 'aria-*']),
    p: new Set(['class', 'id', 'style', 'role', 'data-*', 'aria-*']),
    button: new Set(['class', 'id', 'style', 'type', 'role', 'data-*', 'aria-*']),
    form: new Set(['class', 'id', 'style', 'role', 'data-*', 'aria-*']),
    input: new Set(['class', 'id', 'style', 'type', 'name', 'value', 'placeholder', 'required', 'checked', 'role', 'data-*', 'aria-*']),
    label: new Set(['class', 'id', 'style', 'for', 'role', 'data-*', 'aria-*']),
    select: new Set(['class', 'id', 'style', 'name', 'required', 'role', 'data-*', 'aria-*']),
    option: new Set(['class', 'id', 'style', 'value', 'selected', 'data-*', 'aria-*']),
    textarea: new Set(['class', 'id', 'style', 'name', 'placeholder', 'required', 'role', 'data-*', 'aria-*']),
    ul: new Set(['class', 'id', 'style', 'role', 'data-*', 'aria-*']),
    ol: new Set(['class', 'id', 'style', 'role', 'data-*', 'aria-*']),
    li: new Set(['class', 'id', 'style', 'role', 'data-*', 'aria-*']),
    pre: new Set(['class', 'id', 'style', 'data-*', 'aria-*']),
    code: new Set(['class', 'id', 'style', 'data-*', 'aria-*']),
    'k3ui-field': new Set(['class', 'id', 'style', 'label', 'name', 'type', 'placeholder', 'variant', 'required', 'data-*', 'aria-*']),
    'k3ui-select': new Set(['class', 'id', 'style', 'label', 'name', 'variant', 'required', 'data-*', 'aria-*']),
    'k3ui-radio': new Set(['class', 'id', 'style', 'data-*', 'aria-*', 'checked']),
    i: new Set(['name', 'size', 'type', 'custom', 'folder', 'class', 'style', 'aria-hidden']),
};

/**
 * Classe du composant Dialog selon Material Design 3
 */
const DIALOG_CONTAINER_TRANSFORM_CLASS = 'dialog--container-transform';

export class Dialog extends OpenableComponent<DialogOptions> {
    static _dialogsOpen: number = 0;
    static _count: number = 0;

    /**
     * ID unique du dialog
     */
    id: string;
    /**
     * Si le dialog est ouvert
     */
    isOpen: boolean;

    private _openingTrigger: HTMLElement | undefined;
    private _overlay: HTMLDivElement;
    private _nthDialogOpened: number;
    private _keyboard: Keyboard | null = null;
    private _mouse: Mouse | null = null;
    private _focusableElements: HTMLElement[] = [];
    private _firstFocusableElement: HTMLElement | null = null;
    private _lastFocusableElement: HTMLElement | null = null;
    private _previousActiveElement: HTMLElement | null = null;
    private _floatingCleanup: (() => void) | null = null;
    private _positioningMode: 'centered' | 'anchored' = 'centered';
    private _dialogRole: 'dialog' | 'alertdialog' = 'dialog';
    private _dialogClickCleanup: (() => void) | null = null;
    private _springController: DialogSpringController | null = null;
    private _resizeObserver: ResizeObserver | null = null;
    private _scrollbarHandle: ScrollbarHandle | null = null;
    private _historyPushed = false;
    private _pendingCloseReason: DialogCloseReason = 'api';
    private _choiceSelection = new Set<string>();
    private _choiceOptions: DialogChoiceOptions | null = null;
    /** Incrémenté à chaque open/close pour invalider les callbacks d'animation en cours. */
    private _motionGeneration = 0;
    private _syncViewportHandler = (): void => this._syncViewport();
    private _syncLayoutHandler = (): void => this._syncLayout();
    private _onPopStateHandler = (): void => {
        this._historyPushed = false;
        void this._closeWithReason('back');
    };

    /** Valeur de retour (aligné material-web / HTMLDialogElement.returnValue) */
    returnValue = '';

    constructor(el: HTMLElement, options: Partial<DialogOptions> = {}) {
        super(el, options, toComponentClassDef(Dialog));

        this.isOpen = false;
        this.id = this.el.id || `dialog-${Date.now()}`;
        this._openingTrigger = undefined;
        this._overlay = document.createElement('div');
        this._overlay.classList.add('dialog-overlay');

        // Appliquer l'effet blur si activé
        // Le blur sera appliqué dans _animateIn() pour être sûr qu'il persiste après l'animation

        this.el.tabIndex = -1; // MD3: focusable mais pas dans l'ordre de tabulation normal
        this._nthDialogOpened = 0;
        Dialog._count++;

        this._setupStructure();
        this._applyAnimationScheme();
        this._applyOptionsClasses();
        this._warnDeprecatedOptions();
        this._setupAccessibility();
        this._setupCloseButtonLabels();
        this._setupEventHandlers();

        ManagerFactory.getLoggerManager().info('Dialog initialisé', this.el);
    }

    static getInstance(el: HTMLElement): Dialog | undefined {
        return Component.getInstance(el) as Dialog | undefined;
    }

    static get defaults(): DialogOptions {
        return _defaults;
    }

    static init(
        el: HTMLElement,
        options?: Partial<DialogOptions>
    ): Dialog;
    static init(
        els: InitElements<KElement>,
        options?: Partial<DialogOptions>
    ): Dialog[];
    static init(
        els: HTMLElement | InitElements<KElement>,
        options?: Partial<DialogOptions>
    ): Dialog | Dialog[] {
        return Component.init(els, options ?? {}, Dialog) as Dialog | Dialog[];
    }

    /**
     * Initialise les dialogs depuis les triggers avec attributs data
     */
    static initFromTriggers(): void {
        const triggers = document.querySelectorAll('[dialog-trigger]');

        triggers.forEach(trigger => {
            const targetSelector = trigger.getAttribute('dialog-trigger');
            if (!targetSelector) return;

            const targetDialog = document.querySelector(targetSelector) as HTMLElement;
            if (!targetDialog) return;

            // Utiliser l'instance existante ou en créer une nouvelle
            let dialogInstance = Dialog.getInstance(targetDialog);
            if (!dialogInstance) {
                dialogInstance = new Dialog(targetDialog);
            }

            // Ajouter l'événement click au trigger
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                dialogInstance.open(trigger as HTMLElement);
            });
        });
    }

    /**
     * Construit le markup interne d'un dialog selon l'anatomie M3.
     * @param parts - Sections headline, content, actions
     * @returns HTML à injecter dans `.dialog-container`
     */
    static buildDialogMarkup(parts: DialogMarkupParts): string {
        if (parts.variant === 'fullscreen') {
            return Dialog.buildFullscreenDialogMarkup(parts);
        }

        const hasIcon = Boolean(parts.icon);
        const headerClass = hasIcon ? 'dialog-header dialog-header--hero' : 'dialog-header';
        const headerHtml = parts.header
            ? `<div class="${headerClass}">${hasIcon ? `<div class="dialog-header__hero-icon" aria-hidden="true">${parts.icon}</div>` : ''}${parts.header}</div>`
            : '';

        const scrollerClass = parts.scrollable ? 'dialog-scroller dialog-scroller--scrollable' : 'dialog-scroller';
        const contentHtml = `<div class="${scrollerClass}"><div class="dialog-content">${parts.content}</div></div>`;
        const footerHtml = parts.footer ? `<div class="dialog-footer">${parts.footer}</div>` : '';

        return `${headerHtml}${contentHtml}${footerHtml}`;
    }

    /**
     * Construit le markup d'un dialog fullscreen M3 (toolbar haut + titre + contenu).
     * @param parts - Sections headline, content, actions optionnelles
     * @returns HTML à injecter dans `.dialog-container`
     */
    static buildFullscreenDialogMarkup(parts: DialogMarkupParts): string {
        const confirmLabel = escapeHtml(parts.confirmLabel ?? LocaleManager.t('dialog.save'));
        const closeLabel = escapeHtml(LocaleManager.t('dialog.close'));
        const scrollerClass = parts.scrollable ? 'dialog-scroller dialog-scroller--scrollable' : 'dialog-scroller';

        const titleHtml = parts.header
            ? parts.header
            : '';

        const toolbarHtml = `
            <div class="dialog-header__toolbar">
                <div class="dialog-header__leading">
                    <button type="button" class="btn-icon btn-icon--standard btn-icon--sm dialog-close ripple" aria-label="${closeLabel}">
                        <span class="btn-icon__icon"><i class="k3ui-icon" name="xmark" size="md" aria-hidden="true"></i></span>
                    </button>
                </div>
                ${titleHtml}
                <div class="dialog-header__actions">
                    <button type="button" class="${DialogActionButtonClasses.textPrimary} dialog-confirm ripple">${confirmLabel}</button>
                </div>
            </div>`;

        const headerHtml = `<div class="dialog-header dialog-header--fullscreen">${toolbarHtml}</div>`;
        const contentHtml = `<div class="${scrollerClass}"><div class="dialog-content">${parts.content}</div></div>`;

        // Actions secondaires (reset, cancel) restent en footer si fournies
        const footerHtml = parts.footer
            ? `<div class="dialog-footer dialog-footer--fullscreen-secondary">${parts.footer}</div>`
            : '';

        return `${headerHtml}${contentHtml}${footerHtml}`;
    }

    /**
     * Crée et ouvre un dialog dynamiquement selon MD3
     * @param content - Contenu HTML du dialog (sections header/content/footer à plat)
     * @param options - Options du dialog
     * @returns Instance du dialog créé
     */
    static show(content: string, options: Partial<DialogOptions> = {}): Dialog {
        const globalOptions = getK3uiComponentWindowOptions('Dialog');
        const mergedOptions: Partial<DialogOptions> = { ...globalOptions, ...options };
        // `trigger` n’est pas une option d’instance : consommé ici puis passé à open()
        const openingTrigger = mergedOptions.trigger;
        delete mergedOptions.trigger;

        const dialogEl = document.createElement('div');
        dialogEl.className = 'dialog';
        const safeContent = sanitizeHtmlFragment(content, DIALOG_ALLOWED_TAGS, DIALOG_ALLOWED_ATTRS);
        const hasStructure = /class=["'][^"']*dialog-(header|content|footer)/.test(safeContent);
        let innerHtml = hasStructure
            ? safeContent
            : Dialog.buildDialogMarkup({
                content: safeContent,
                scrollable: mergedOptions.scrollable,
                variant: mergedOptions.variant,
            });
        // Garantir un scroller M3 si header/content/footer sans .dialog-scroller
        if (hasStructure && !/dialog-scroller/.test(innerHtml) && /dialog-content/.test(innerHtml)) {
            innerHtml = innerHtml.replace(
                /(<div[^>]*class=["'][^"']*dialog-content[^"']*["'][^>]*>)/,
                '<div class="dialog-scroller">$1'
            );
            // Fermer le scroller juste avant le footer (ou en fin de markup)
            if (/dialog-footer/.test(innerHtml)) {
                innerHtml = innerHtml.replace(/(<div[^>]*class=["'][^"']*dialog-footer)/, '</div>$1');
            } else {
                innerHtml += '</div>';
            }
        }
        dialogEl.innerHTML = `<div class="dialog-container">${innerHtml}</div>`;

        document.body.appendChild(dialogEl);

        const dialogInstance = new Dialog(dialogEl, mergedOptions);
        dialogInstance.open(openingTrigger);

        const originalClose = dialogInstance.close.bind(dialogInstance);
        const cleanupDelay = mergedOptions.outDuration ?? Dialog.defaults.outDuration;
        dialogInstance.close = function (): Dialog {
            originalClose();
            window.setTimeout(() => {
                if (dialogEl.parentNode) {
                    dialogEl.parentNode.removeChild(dialogEl);
                }
                if (!dialogInstance.isDestroyed) {
                    dialogInstance.destroy();
                }
            }, cleanupDelay);
            return this;
        };

        return dialogInstance;
    }

    /**
     * Affiche un dialog de confirmation selon MD3
     * @param message - Message à afficher
     * @param onConfirmOrOptions - Callback de confirmation ou options du dialog
     * @param onCancel - Callback d'annulation (si onConfirmOrOptions est une fonction)
     * @param options - Options du dialog (si onConfirmOrOptions est une fonction)
     * @returns Instance du dialog créé
     */
    static confirm(
        message: string,
        onConfirmOrOptions?: (() => void) | Partial<DialogOptions>,
        onCancel?: () => void,
        options?: Partial<DialogOptions>
    ): Dialog {
        return Dialog.confirmWithIcon(message, undefined, undefined, onConfirmOrOptions, onCancel, options);
    }

    /**
     * Affiche un dialog de confirmation avec icône selon MD3
     * @param message - Message à afficher
     * @param iconName - Nom de l'icône à afficher (optionnel)
     * @param iconColor - Couleur de l'icône (optionnel, défaut: primary)
     * @param onConfirmOrOptions - Callback de confirmation ou options du dialog
     * @param onCancel - Callback d'annulation (si onConfirmOrOptions est une fonction)
     * @param options - Options du dialog (si onConfirmOrOptions est une fonction)
     * @returns Instance du dialog créé
     */
    static confirmWithIcon(
        message: string,
        iconName?: string,
        iconColor: string = 'primary',
        onConfirmOrOptions?: (() => void) | Partial<DialogOptions>,
        onCancel?: () => void,
        options?: Partial<DialogOptions>
    ): Dialog {
        // Fusionner avec les options globales de K3UI_OPTIONS
        const globalOptions = getK3uiComponentWindowOptions('Dialog');

        // Détecter si le paramètre est une fonction ou des options
        let actualOnConfirm: (() => void) | undefined;
        let actualOnCancel: (() => void) | undefined;
        let dialogOptions: Partial<DialogOptions> = { ...globalOptions };

        if (typeof onConfirmOrOptions === 'function') {
            actualOnConfirm = onConfirmOrOptions;
            actualOnCancel = onCancel;
            if (options) {
                dialogOptions = { ...dialogOptions, ...options };
            }
        } else if (onConfirmOrOptions && typeof onConfirmOrOptions === 'object') {
            dialogOptions = { ...dialogOptions, ...onConfirmOrOptions };
            actualOnConfirm = onCancel as (() => void) | undefined;
            actualOnCancel = options as (() => void) | undefined;
        } else {
            actualOnConfirm = undefined;
            actualOnCancel = onCancel;
        }

        const safeIconName = iconName ? escapeHtml(iconName) : '';
        const iconHtml = safeIconName
            ? `<i class="k3ui-icon" name="${safeIconName}" size="md" aria-hidden="true"></i>`
            : '';

        const isDestructive = iconName === 'delete' || iconName === 'trash';
        const confirmButtonClass = isDestructive
            ? `${DialogActionButtonClasses.textError} dialog-confirm`
            : `${DialogActionButtonClasses.textPrimary} dialog-confirm`;

        const markup = Dialog.buildDialogMarkup({
            header: `<h2>${isDestructive ? LocaleManager.t('dialog.titleDelete') : LocaleManager.t('dialog.titleConfirmation')}</h2>`,
            icon: iconHtml || undefined,
            content: `<p>${escapeHtml(message)}</p>`,
            footer: `
                <div class="dialog-action-left">
                    <button type="button" class="${DialogActionButtonClasses.text} dialog-close">${LocaleManager.t('dialog.cancel')}</button>
                </div>
                <div class="dialog-action-right">
                    <button type="button" class="${confirmButtonClass}">${isDestructive ? LocaleManager.t('dialog.buttonDelete') : LocaleManager.t('dialog.buttonConfirm')}</button>
                </div>
            `,
        });

        const dialog = Dialog.show(markup, dialogOptions);
        dialog.el.setAttribute('data-dialog-role', 'alertdialog');
        dialog._dialogRole = 'alertdialog';
        dialog._setupAccessibility();

        // Ajouter les événements
        const confirmBtn = dialog.el.querySelector('.dialog-confirm');

        if (confirmBtn) {
            dialog.registerEvent(confirmBtn, 'click', () => {
                HapticManager.triggerFromOptions(dialog.options, 'medium');
                if (actualOnConfirm) actualOnConfirm();
                dialog.close();
            });
        }

        if (actualOnCancel) {
            const cancelBtn = dialog.el.querySelector('.dialog-close');
            if (cancelBtn) {
                dialog.registerEvent(cancelBtn, 'click', () => {
                    actualOnCancel?.();
                });
            }
        }

        // Charger les icônes après l'ajout au DOM
        setTimeout(() => {
            IconManager.forceDisplayIcons();
        }, 100);

        return dialog;
    }

    /**
     * Affiche un dialog d'alerte simple selon MD3
     * @param message - Message à afficher
     * @param title - Titre du dialog (optionnel, défaut: "Alert dialog")
     * @param options - Options du dialog
     * @returns Instance du dialog créé
     */
    static alert(
        message: string,
        title: string = LocaleManager.t('dialog.titleAlert'),
        options: Partial<DialogOptions> = {}
    ): Dialog {
        const markup = Dialog.buildDialogMarkup({
            header: `<h2>${escapeHtml(title)}</h2>`,
            content: `<p>${escapeHtml(message)}</p>`,
            footer: `
                <div class="dialog-action-right">
                    <button type="button" class="${DialogActionButtonClasses.textPrimary} dialog-close">${LocaleManager.t('dialog.ok')}</button>
                </div>
            `,
        });

        const dialog = Dialog.show(markup, { dismissible: false, variant: 'alert', ...options });
        dialog.el.setAttribute('data-dialog-role', 'alertdialog');
        dialog._dialogRole = 'alertdialog';
        dialog.options.dismissible = false;
        dialog._setupAccessibility();
        return dialog;
    }

    /**
     * Affiche un dialog de choix avec radio buttons selon MD3
     * @param title - Titre du dialog
     * @param choices - Tableau d'options {value: string, label: string}
     * @param selectedValue - Valeur sélectionnée par défaut (optionnel)
     * @param onConfirmOrOptions - Callback de confirmation ou options du dialog
     * @param onCancel - Callback d'annulation (si onConfirmOrOptions est une fonction)
     * @param options - Options du dialog (si onConfirmOrOptions est une fonction)
     * @returns Instance du dialog créé
     */
    static choose(
        title: string,
        choices: Array<{ value: string; label: string }>,
        selectedValue?: string,
        onConfirmOrOptions?: ((value: string) => void) | Partial<DialogOptions>,
        onCancel?: () => void,
        options?: Partial<DialogOptions>
    ): Dialog {
        // Fusionner avec les options globales de K3UI_OPTIONS
        const globalOptions = getK3uiComponentWindowOptions('Dialog');

        // Détecter si le paramètre est une fonction ou des options
        let actualOnConfirm: ((value: string) => void) | undefined;
        let actualOnCancel: (() => void) | undefined;
        let dialogOptions: Partial<DialogOptions> = { ...globalOptions };

        if (typeof onConfirmOrOptions === 'function') {
            actualOnConfirm = onConfirmOrOptions;
            actualOnCancel = onCancel;
            if (options) {
                dialogOptions = { ...dialogOptions, ...options };
            }
        } else if (onConfirmOrOptions && typeof onConfirmOrOptions === 'object') {
            dialogOptions = { ...dialogOptions, ...onConfirmOrOptions };
            actualOnConfirm = onCancel as ((value: string) => void) | undefined;
            actualOnCancel = options as (() => void) | undefined;
        } else {
            actualOnConfirm = undefined;
            actualOnCancel = onCancel;
        }

        const groupName = `dialog-choice-${Date.now()}`;
        const choicesHtml = choices.map((choice, index) => {
            const checked = selectedValue === choice.value || (!selectedValue && index === 0) ? 'checked' : '';
            const safeChoiceValue = escapeHtml(choice.value);
            const safeChoiceLabel = escapeHtml(choice.label);
            return `
                <div style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--md-sys-color-outline-variant);">
                    <k3ui-radio 
                        data-name="${groupName}" 
                        data-value="${safeChoiceValue}" 
                        data-label="${safeChoiceLabel}"
                        data-show-label="true"
                        ${checked ? 'checked' : ''}>
                    </k3ui-radio>
                </div>
            `;
        }).join('');

        const markup = Dialog.buildDialogMarkup({
            header: `<h2>${escapeHtml(title)}</h2>`,
            content: choicesHtml,
            footer: `
                <div class="dialog-action-left">
                    <button type="button" class="${DialogActionButtonClasses.text} dialog-close">${LocaleManager.t('dialog.cancel')}</button>
                </div>
                <div class="dialog-action-right">
                    <button type="button" class="${DialogActionButtonClasses.textPrimary} dialog-confirm">${LocaleManager.t('dialog.ok')}</button>
                </div>
            `,
        });

        const dialog = Dialog.show(markup, dialogOptions);

        // Initialiser les composants k3ui-radio après l'ajout au DOM
        setTimeout(() => {
            IconManager.forceDisplayIcons();
            const radioElements = dialog.el.querySelectorAll('k3ui-radio');
            radioElements.forEach(radioEl => {
                if (!Radio.getInstance(radioEl as HTMLElement)) {
                    Radio.init(radioEl as HTMLElement);
                }
            });
        }, 100);

        // Ajouter les événements
        const confirmBtn = dialog.el.querySelector('.dialog-confirm');

        if (confirmBtn) {
            dialog.registerEvent(confirmBtn, 'click', () => {
                const selectedInput = dialog.el.querySelector(`input[type="radio"][name="${groupName}"]:checked`) as HTMLInputElement;
                if (selectedInput && actualOnConfirm) {
                    actualOnConfirm(selectedInput.value);
                }
                dialog.close();
            });
        }

        if (actualOnCancel) {
            const cancelBtn = dialog.el.querySelector('.dialog-close');
            if (cancelBtn) {
                dialog.registerEvent(cancelBtn, 'click', () => {
                    actualOnCancel?.();
                });
            }
        }

        return dialog;
    }

    /**
     * Affiche un dialog de formulaire selon MD3
     * @param title - Titre du dialog
     * @param fields - Tableau de champs {name: string, label: string, type?: string, placeholder?: string, required?: boolean, component?: 'field' | 'select', options?: Array<{value: string, label: string}>}
     * @param onConfirmOrOptions - Callback de confirmation ou options du dialog
     * @param onCancel - Callback d'annulation (si onConfirmOrOptions est une fonction)
     * @param options - Options du dialog (si onConfirmOrOptions est une fonction)
     * @returns Instance du dialog créé
     */
    static form(
        title: string,
        fields: Array<{ name: string; label: string; type?: string; placeholder?: string; required?: boolean; component?: 'field' | 'select'; options?: Array<{ value: string; label: string }> }>,
        onConfirmOrOptions?: ((data: Record<string, string>) => void) | Partial<DialogOptions>,
        onCancel?: () => void,
        options?: Partial<DialogOptions>
    ): Dialog {
        // Fusionner avec les options globales de K3UI_OPTIONS
        const globalOptions = getK3uiComponentWindowOptions('Dialog');

        // Détecter si le paramètre est une fonction ou des options
        let actualOnConfirm: ((data: Record<string, string>) => void) | undefined;
        let actualOnCancel: (() => void) | undefined;
        let dialogOptions: Partial<DialogOptions> = { ...globalOptions };

        if (typeof onConfirmOrOptions === 'function') {
            actualOnConfirm = onConfirmOrOptions;
            actualOnCancel = onCancel;
            if (options) {
                dialogOptions = { ...dialogOptions, ...options };
            }
        } else if (onConfirmOrOptions && typeof onConfirmOrOptions === 'object') {
            dialogOptions = { ...dialogOptions, ...onConfirmOrOptions };
            actualOnConfirm = onCancel as ((data: Record<string, string>) => void) | undefined;
            actualOnCancel = options as (() => void) | undefined;
        } else {
            actualOnConfirm = undefined;
            actualOnCancel = onCancel;
        }

        const fieldsHtml = fields.map(field => {
            const component = field.component || 'field';
            const type = field.type || 'text';
            const placeholder = field.placeholder || '';
            const required = field.required ? 'required' : '';
            const safeFieldLabel = escapeHtml(field.label);
            const safeFieldName = escapeHtml(field.name);
            const safeType = escapeHtml(type);
            const safePlaceholder = escapeHtml(placeholder);

            if (component === 'select' && field.options) {
                const optionsHtml = field.options.map(opt =>
                    `<option value="${escapeHtml(opt.value)}">${escapeHtml(opt.label)}</option>`
                ).join('');
                return `
                    <div style="margin-bottom: 20px;">
                        <k3ui-select 
                            label="${safeFieldLabel}" 
                            name="${safeFieldName}" 
                            variant="filled"
                            ${required}>
                            ${optionsHtml}
                        </k3ui-select>
                    </div>
                `;
            } else {
                return `
                    <div style="margin-bottom: 20px;">
                        <k3ui-field 
                            label="${safeFieldLabel}" 
                            name="${safeFieldName}" 
                            type="${safeType}"
                            placeholder="${safePlaceholder}" 
                            variant="filled"
                            ${required}>
                        </k3ui-field>
                    </div>
                `;
            }
        }).join('');

        const markup = Dialog.buildDialogMarkup({
            header: `<h2>${escapeHtml(title)}</h2>`,
            content: `<form id="dialog-form">${fieldsHtml}</form>`,
            footer: `
                <div class="dialog-action-left">
                    <button type="button" class="${DialogActionButtonClasses.text} dialog-close">${LocaleManager.t('dialog.cancel')}</button>
                    <button type="button" class="${DialogActionButtonClasses.text} dialog-reset">${LocaleManager.t('dialog.reset')}</button>
                </div>
                <div class="dialog-action-right">
                    <button type="button" class="${DialogActionButtonClasses.textPrimary} dialog-confirm">${LocaleManager.t('dialog.save')}</button>
                </div>
            `,
            variant: dialogOptions.variant,
            scrollable: dialogOptions.scrollable ?? true,
        });

        const dialog = Dialog.show(markup, dialogOptions);

        // Ajouter les événements
        const confirmBtn = dialog.el.querySelector('.dialog-confirm');
        const resetBtn = dialog.el.querySelector('.dialog-reset');
        const form = dialog.el.querySelector('#dialog-form') as HTMLFormElement;

        if (confirmBtn && form) {
            dialog.registerEvent(confirmBtn, 'click', () => {
                const formData = new FormData(form);
                const data: Record<string, string> = {};
                formData.forEach((value, key) => {
                    data[key] = value.toString();
                });
                if (actualOnConfirm) {
                    actualOnConfirm(data);
                }
                dialog.close();
            });
        }

        if (resetBtn && form) {
            dialog.registerEvent(resetBtn, 'click', () => {
                form.reset();
            });
        }

        if (actualOnCancel) {
            const cancelBtn = dialog.el.querySelector('.dialog-close');
            if (cancelBtn) {
                dialog.registerEvent(cancelBtn, 'click', () => {
                    actualOnCancel?.();
                });
            }
        }

        // Initialiser les composants k3ui-field et k3ui-select après l'ajout au DOM
        setTimeout(() => {
            IconManager.forceDisplayIcons();
            // Réinitialiser les fields et selects pour qu'ils soient fonctionnels
            const fieldElements = dialog.el.querySelectorAll('k3ui-field');
            fieldElements.forEach(fieldEl => {
                if (!Field.getInstance(fieldEl as HTMLElement)) {
                    Field.init(fieldEl as HTMLElement);
                }
            });
            // Chercher les selects natifs créés par les custom elements k3ui-select
            // Le custom element k3ui-select se transforme en select natif dans connectedCallback
            const selectElements = dialog.el.querySelectorAll('select.select');
            selectElements.forEach(selectEl => {
                if (!Select.getInstance(selectEl as HTMLElement)) {
                    Select.init(selectEl as HTMLSelectElement);
                }
            });
        }, 100);

        return dialog;
    }

    /**
     * @deprecated Utiliser Sheet.show() pour les feuilles top/bottom, ou Drawer pour left/right.
     * @param title - Titre du panneau
     * @param content - Contenu HTML
     * @param options - Options
     * @returns Instance Sheet créée (bottom par défaut)
     */
    static floatingSheet(
        title: string,
        content: string,
        options: Partial<DialogOptions> = {}
    ): Sheet {
        ManagerFactory.getLoggerManager().warn(
            '[Dialog] floatingSheet() est déprécié. Utilisez Sheet.show() (top/bottom) ou Drawer (left/right).'
        );

        const markup = Dialog.buildDialogMarkup({
            header: `<h2>${escapeHtml(title)}</h2>`,
            content: sanitizeHtmlFragment(content, DIALOG_ALLOWED_TAGS, DIALOG_ALLOWED_ATTRS),
        });

        return Sheet.show(markup, { position: 'bottom', ...options } as Parameters<typeof Sheet.show>[1]);
    }

    /**
     * Détruit l'instance du dialog
     */
    destroy(): void {
        if (!this.el) {
            return;
        }
        Dialog._count--;

        // Nettoyer Floating UI cleanup
        if (this._floatingCleanup) {
            this._floatingCleanup();
            this._floatingCleanup = null;
        }

        this._springController?.destroy();
        this._springController = null;
        this._teardownCustomScrollbar();
        this._resizeObserver?.disconnect();
        this._resizeObserver = null;
        window.removeEventListener('popstate', this._onPopStateHandler);
        window.removeEventListener('resize', this._syncLayoutHandler);
        window.visualViewport?.removeEventListener('resize', this._syncViewportHandler);

        this._removeEventHandlers();
        this._removeAccessibility();
        this.el.removeAttribute('style');
        if (this._overlay.parentNode) {
            this._overlay.remove();
        }
        super.destroy();
    }

    /**
     * Applique le schéma d'animation M3 (`expressive` | `spatial`) sur l'élément.
     * Remappe les 12 springs via data-animation (voir dialog.module.scss).
     */
    private _applyAnimationScheme(): void {
        const animation = this._resolveAnimation();
        this.el.setAttribute('data-animation', animation);
    }

    /**
     * Résout l'option animation (défaut expressive).
     */
    private _resolveAnimation(): DialogAnimation {
        const value = this.options.animation;
        return value === 'spatial' ? 'spatial' : 'expressive';
    }

    /**
     * Configure la structure du dialog selon MD3
     */
    private _setupStructure(): void {
        // S'assurer que le dialog a la classe de base
        if (!this.el.classList.contains('dialog')) {
            this.el.classList.add('dialog');
        }

        // S'assurer qu'il y a un dialog-container
        let container = this.el.querySelector('.dialog-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'dialog-container';
            while (this.el.firstChild) {
                container.appendChild(this.el.firstChild);
            }
            this.el.appendChild(container);
        }

        // Envelopper le contenu dans un scroller si absent (markup déclaratif legacy)
        const existingScroller = container.querySelector(':scope > .dialog-scroller');
        const bareContent = container.querySelector(':scope > .dialog-content');
        if (!existingScroller && bareContent) {
            const scroller = document.createElement('div');
            scroller.className = 'dialog-scroller';
            bareContent.parentNode?.insertBefore(scroller, bareContent);
            scroller.appendChild(bareContent);
        }

        this._ensureScrollDividers(container as HTMLElement);
        this._setupCustomScrollbar();
    }

    /**
     * Scrollbar custom hors surface (ScrollbarManager — rail externe au container).
     */
    private _setupCustomScrollbar(): void {
        this._teardownCustomScrollbar();
        const scroller = this.el.querySelector<HTMLElement>(':scope > .dialog-container > .dialog-scroller');
        if (!scroller) {
            return;
        }

        this._scrollbarHandle = ScrollbarManager.bind({
            scroll: scroller,
            railHost: this.el,
            geometryTarget: scroller,
            geometry: 'scroll-bounds',
            /*
             * Interne : sur scrim, un rail externe sort de la surface blanche
             * (bande primaire hors coins arrondis). Overlay dans le host.
             * Fullscreen / bottom-sheet : déjà forcé interne en CSS.
             */
            placement: 'internal',
            railClass: 'dialog__scrollbar',
            thumbClass: 'dialog__scrollbar-thumb',
            removeRailOnDestroy: true,
            enlargeOnInteraction: true,
            enlargeFactor: 2,
            minThumbHeight: 24,
        });

        requestAnimationFrame(() => this._scrollbarHandle?.refresh());
    }

    /** Recalcule rail + thumb après affichage (layout stable). */
    private _refreshCustomScrollbar = (): void => {
        this._scrollbarHandle?.refresh();
    };

    private _teardownCustomScrollbar(): void {
        this._scrollbarHandle?.destroy();
        this._scrollbarHandle = null;
    }

    /**
     * Insère les séparateurs scroll M3 (visible quand le corps défile).
     */
    private _ensureScrollDividers(container: HTMLElement): void {
        if (container.querySelector('.dialog-divider')) {
            return;
        }
        const scroller = container.querySelector(':scope > .dialog-scroller');
        if (!scroller) {
            return;
        }
        const top = document.createElement('div');
        top.className = 'dialog-divider';
        top.setAttribute('aria-hidden', 'true');
        const bottom = document.createElement('div');
        bottom.className = 'dialog-divider';
        bottom.setAttribute('aria-hidden', 'true');
        container.insertBefore(top, scroller);
        container.insertBefore(bottom, scroller.nextSibling);
        scroller.addEventListener('scroll', this._syncDividers, { passive: true });
    }

    /** Synchronise la visibilité des dividers scroll. */
    private _syncDividers = (): void => {
        const scroller = this.el.querySelector('.dialog-scroller');
        if (!scroller) return;
        const dividers = this.el.querySelectorAll('.dialog-divider');
        const top = dividers[0];
        const bottom = dividers[1];
        const scrollTop = scroller.scrollTop;
        const scrollable = scroller.scrollHeight - scroller.clientHeight > 1;
        if (top instanceof HTMLElement) {
            top.toggleAttribute('data-visible', scrollable && scrollTop > 1);
        }
        if (bottom instanceof HTMLElement) {
            const atBottom = scroller.scrollHeight - scroller.clientHeight - scrollTop <= 1;
            bottom.toggleAttribute('data-visible', scrollable && !atBottom);
        }
        if (scrollable) {
            scroller.setAttribute('tabindex', '0');
            scroller.setAttribute('role', 'group');
            scroller.setAttribute('aria-label', LocaleManager.t('dialog.scrollableContent'));
        } else {
            scroller.removeAttribute('tabindex');
            scroller.removeAttribute('role');
            scroller.removeAttribute('aria-label');
        }
    };

    /** Empile les actions si elles dépassent la largeur disponible. */
    private _syncStackedActions(): void {
        const footer = this.el.querySelector('.dialog-footer');
        if (!(footer instanceof HTMLElement)) return;
        footer.classList.remove('dialog-footer--stacked');
        if (footer.scrollWidth > footer.clientWidth + 1) {
            footer.classList.add('dialog-footer--stacked');
        }
    }

    /** Recadre le dialog quand le clavier virtuel réduit visualViewport. */
    private _syncViewport(): void {
        const viewport = window.visualViewport;
        if (!viewport || this._isFullscreen()) return;
        const hidden = window.innerHeight - viewport.height;
        const container = this.el.querySelector('.dialog-container');
        if (!(container instanceof HTMLElement)) return;
        if (hidden > 120) {
            this.el.style.setProperty('--dialog-viewport-inset-block', '16px');
            container.style.maxBlockSize = `${viewport.height - 32}px`;
        } else {
            this.el.style.removeProperty('--dialog-viewport-inset-block');
            container.style.maxBlockSize = '';
        }
    }

    /** Synchronise layout responsive (dividers, actions, grille, variante). */
    private _syncLayout = (): void => {
        this._resolveEffectiveVariant();
        this._syncChoiceGridColumns();
        this._syncDividers();
        this._syncStackedActions();
        this._syncViewport();
        this._refreshCustomScrollbar();
    };

    /** Largeur utile pour calculer les colonnes grille. */
    private _getChoiceGridWidth(): number {
        const grid = this.el.querySelector('.dialog-choices--grid');
        const container = this.el.querySelector('.dialog-container');
        const scroller = this.el.querySelector('.dialog-scroller');
        const candidates = [
            grid instanceof HTMLElement ? grid.clientWidth : 0,
            scroller instanceof HTMLElement ? scroller.clientWidth : 0,
            container instanceof HTMLElement ? container.clientWidth : 0,
            this.el.clientWidth,
        ];
        return Math.max(...candidates, 320);
    }

    /** Met à jour `--dialog-choice-columns` pour le mode grille. */
    private _syncChoiceGridColumns(): void {
        if (!this._choiceOptions || this._choiceOptions.mode !== 'grid') return;
        const grid = this.el.querySelector('.dialog-choices--grid');
        if (!(grid instanceof HTMLElement)) return;
        const requested = this._choiceOptions.columns ?? 4;
        const width = this._getChoiceGridWidth();
        const columns = fitChoiceColumns(requested, width);
        grid.style.setProperty('--dialog-choice-columns', String(columns));
        this.el.style.setProperty('--dialog-choice-columns', String(columns));
        grid.dataset.columns = String(columns);
        grid.classList.toggle('dialog-choices--grid-dense', columns >= 6);
        grid.classList.toggle('dialog-choices--grid-compact', columns >= 10);
    }

    /**
     * Met à jour le nombre de colonnes d'un dialog grille ouvert (1–12, s12).
     * @param columns - Colonnes demandées, ajustées à la largeur disponible
     */
    setChoiceColumns(columns: number): void {
        if (!this._choiceOptions || this._choiceOptions.mode !== 'grid') return;
        this._choiceOptions.columns = Math.max(1, Math.min(GRID_COLUMNS_MAX, Math.round(columns) || 4));
        const grid = this.el.querySelector('.dialog-choices--grid');
        if (grid instanceof HTMLElement) {
            grid.style.setProperty('--dialog-choice-columns', String(this._choiceOptions.columns));
            this.el.style.setProperty('--dialog-choice-columns', String(this._choiceOptions.columns));
        }
        requestAnimationFrame(() => this._syncChoiceGridColumns());
    }

    /**
     * Résout la variante effective (basic → fullscreen sur compact si activé).
     */
    private _resolveEffectiveVariant(): void {
        const requested = this.options.variant ?? 'basic';
        if (requested !== 'basic') {
            this.el.classList.toggle('dialog--fullscreen', requested === 'fullscreen');
            return;
        }
        const compactFullscreen = Boolean(this.options.fullScreenOnCompact) && windowSizeClass() === 'compact';
        this.el.classList.toggle('dialog--fullscreen', compactFullscreen);
    }

    /**
     * Construit le HTML des lignes de choix M3 (list / single / multiple / grid).
     */
    static buildChoiceMarkup(options: DialogChoiceOptions): string {
        const initial = options.value
            ? (Array.isArray(options.value) ? options.value : [options.value])
            : [];

        if (options.mode === 'grid') {
            const cells = options.items.map((item, index) => {
                const safeLabel = escapeHtml(item.label);
                const safeValue = escapeHtml(item.value);
                const support = item.supportingText
                    ? `<span class="dialog-choice-support">${escapeHtml(item.supportingText)}</span>`
                    : '';
                const icon = item.icon
                    ? `<span class="dialog-choice-cell__icon" aria-hidden="true"><i class="k3ui-icon" name="${escapeHtml(item.icon)}" size="sm"></i></span>`
                    : '';
                const disabled = item.disabled ? ' aria-disabled="true"' : '';
                const selected = initial.includes(item.value);
                const tabindex = index === 0 || selected ? '0' : '-1';
                return `<button type="button" class="dialog-choice-cell" role="option" aria-selected="${selected}" tabindex="${tabindex}" data-value="${safeValue}" data-index="${index}"${disabled}>
                    ${icon}<span class="dialog-choice-label">${safeLabel}</span>${support}
                </button>`;
            }).join('');
            const cols = Math.max(1, Math.min(GRID_COLUMNS_MAX, options.columns ?? 4));
            return `<div class="dialog-choices dialog-choices--grid" role="listbox" style="--dialog-choice-columns: ${cols}">${cells}</div>`;
        }

        const rows = options.items.map((item, index) => {
            const safeLabel = escapeHtml(item.label);
            const safeValue = escapeHtml(item.value);
            const support = item.supportingText
                ? `<span class="dialog-choice-support">${escapeHtml(item.supportingText)}</span>`
                : '';
            const disabled = item.disabled ? ' aria-disabled="true"' : '';
            const checked = initial.includes(item.value);

            if (options.mode === 'list') {
                return `<button type="button" class="dialog-choice-row" data-value="${safeValue}" data-index="${index}"${disabled}>
                    <span class="dialog-choice-label">${safeLabel}</span>${support}
                </button>`;
            }

            const controlKind = options.mode === 'single' ? 'radio' : 'checkbox';
            const ariaChecked = checked ? 'true' : 'false';
            const tabindex = options.mode === 'multiple' ? '0' : index === 0 ? '0' : '-1';
            return `<button type="button" class="dialog-choice-row" role="${controlKind}" aria-checked="${ariaChecked}" tabindex="${tabindex}" data-value="${safeValue}" data-index="${index}"${disabled}>
                <span class="dialog-choice-control" data-kind="${controlKind}" aria-hidden="true"></span>
                <span class="dialog-choice-label">${safeLabel}</span>${support}
            </button>`;
        }).join('');

        const role = options.mode === 'single' ? 'radiogroup' : 'group';
        return `<div class="dialog-choices" role="${role}">${rows}</div>`;
    }

    /**
     * Affiche un dialog liste simple M3 (fermeture à la sélection).
     */
    static pickList(
        title: string,
        items: DialogChoiceItem[],
        options: Partial<DialogOptions> = {}
    ): Dialog {
        return Dialog._showChoiceDialog(title, { mode: 'list', items, closeOnSelect: true }, options);
    }

    /**
     * Affiche un dialog choix unique M3 (radiogroup).
     */
    static pickSingle(
        title: string,
        items: DialogChoiceItem[],
        selectedValue?: string,
        options: Partial<DialogOptions> = {}
    ): Dialog {
        return Dialog._showChoiceDialog(title, { mode: 'single', items, value: selectedValue, closeOnSelect: false }, options);
    }

    /**
     * Affiche un dialog choix multiple M3 (checkboxes).
     */
    static pickMultiple(
        title: string,
        items: DialogChoiceItem[],
        selectedValues?: string[],
        options: Partial<DialogOptions> = {}
    ): Dialog {
        return Dialog._showChoiceDialog(title, { mode: 'multiple', items, value: selectedValues, closeOnSelect: false }, options);
    }

    /**
     * Affiche un dialog grille M3 (extension hors spec — listbox en cellules).
     * @param columns - Colonnes demandées (1–12, s12), adaptées à la largeur
     */
    static pickGrid(
        title: string,
        items: DialogChoiceItem[],
        selectedValue?: string,
        options: Partial<DialogOptions> & { columns?: number } = {}
    ): Dialog {
        const { columns = 4, ...dialogOptions } = options;
        return Dialog._showChoiceDialog(
            title,
            { mode: 'grid', items, value: selectedValue, columns, closeOnSelect: true },
            dialogOptions
        );
    }

    private static _showChoiceDialog(
        title: string,
        choice: DialogChoiceOptions,
        options: Partial<DialogOptions>
    ): Dialog {
        const choicesHtml = Dialog.buildChoiceMarkup(choice);
        let footer = '';
        if (choice.mode === 'single' || choice.mode === 'multiple') {
            footer = `<div class="dialog-action-left">
                    <button type="button" class="${DialogActionButtonClasses.text} dialog-close">${LocaleManager.t('dialog.cancel')}</button>
                </div>
                <div class="dialog-action-right">
                    <button type="button" class="${DialogActionButtonClasses.textPrimary} dialog-confirm">${LocaleManager.t('dialog.ok')}</button>
                </div>`;
        } else if (choice.mode === 'grid') {
            footer = `<div class="dialog-action-right">
                    <button type="button" class="${DialogActionButtonClasses.text} dialog-close">${LocaleManager.t('dialog.close')}</button>
                </div>`;
        }

        const markup = Dialog.buildDialogMarkup({
            header: `<h2>${escapeHtml(title)}</h2>`,
            content: choicesHtml,
            footer,
            scrollable: true,
        });

        const dialog = Dialog.show(markup, { scrollable: true, ...options });
        dialog._wireChoiceHandlers(choice);
        return dialog;
    }

    /** Branche les interactions des lignes / cellules de choix M3. */
    private _wireChoiceHandlers(choice: DialogChoiceOptions): void {
        const container = this.el.querySelector('.dialog-choices');
        if (!container) return;

        this._choiceOptions = choice;
        const initial = choice.value
            ? (Array.isArray(choice.value) ? choice.value : [choice.value])
            : [];
        initial.forEach((v) => this._choiceSelection.add(v));
        if (choice.mode === 'grid') {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => this._syncChoiceGridColumns());
            });
        }

        const items = container.querySelectorAll<HTMLButtonElement>('.dialog-choice-row, .dialog-choice-cell');
        items.forEach((row) => {
            this.registerEvent(row, 'click', () => {
                const index = Number(row.dataset.index);
                const item = choice.items[index];
                if (!item || item.disabled) {
                    HapticManager.triggerFromOptions(this.options, 'error');
                    return;
                }
                const value = item.value;
                const closeOnSelect = choice.closeOnSelect ?? (choice.mode === 'list' || choice.mode === 'grid');

                if (choice.mode === 'list') {
                    this.returnValue = value;
                    choice.onSelect?.(value);
                    void this._closeWithReason('select', value);
                    return;
                }

                if (choice.mode === 'multiple') {
                    if (this._choiceSelection.has(value)) this._choiceSelection.delete(value);
                    else this._choiceSelection.add(value);
                    row.setAttribute('aria-checked', String(this._choiceSelection.has(value)));
                    choice.onSelect?.([...this._choiceSelection]);
                    HapticManager.triggerFromOptions(this.options, 'light');
                    return;
                }

                // single + grid
                this._choiceSelection.clear();
                this._choiceSelection.add(value);
                items.forEach((r) => {
                    const on = String(r.dataset.value === value);
                    if (r.hasAttribute('aria-checked')) r.setAttribute('aria-checked', on);
                    if (r.hasAttribute('aria-selected')) r.setAttribute('aria-selected', on);
                    r.setAttribute('tabindex', r === row ? '0' : '-1');
                });
                choice.onSelect?.(value);
                HapticManager.triggerFromOptions(this.options, 'light');

                if (closeOnSelect) {
                    this.returnValue = value;
                    void this._closeWithReason('select', value);
                }
            });
        });

        const confirmBtn = this.el.querySelector('.dialog-confirm');
        if (confirmBtn && (choice.mode === 'single' || choice.mode === 'multiple')) {
            this.registerEvent(confirmBtn, 'click', () => {
                const value = choice.mode === 'multiple'
                    ? [...this._choiceSelection]
                    : [...this._choiceSelection][0] ?? '';
                this.returnValue = Array.isArray(value) ? value.join(',') : value;
                choice.onSelect?.(value);
                void this._closeWithReason('select', this.returnValue);
            });
        }
    }

    /** Indique si Escape / clic scrim peuvent fermer le dialog. */
    private _isDismissible(): boolean {
        return this.options.dismissible !== false;
    }

    /** Seul le dialog au sommet de la pile répond aux dismiss globaux. */
    private _isTopmostOpenDialog(): boolean {
        return this.isOpen && this._nthDialogOpened === Dialog._dialogsOpen;
    }

    /** Émet dialog:cancel annulable avant fermeture scrim/escape. */
    private _dispatchCancelEvent(): boolean {
        return this.el.dispatchEvent(new CustomEvent('dialog:cancel', { bubbles: true, cancelable: true }));
    }

    /** Retour visuel M3 quand la fermeture scrim/escape est bloquée. */
    private _signalDismissBlocked(): void {
        HapticManager.triggerFromOptions(this.options, 'error');
        this.el.removeAttribute('data-blocked');
        void this.el.offsetWidth;
        this.el.setAttribute('data-blocked', '');
    }

    /**
     * Tente une fermeture via scrim ou Escape.
     * Les boutons `.dialog-close` contournent cette garde (fermeture explicite).
     */
    private _handleDismissRequest(reason: DialogCloseReason, event?: Event): void {
        if (!this._isTopmostOpenDialog()) {
            return;
        }

        if (!this._dispatchCancelEvent()) {
            event?.preventDefault();
            return;
        }

        if (!this._isDismissible()) {
            event?.preventDefault();
            this._signalDismissBlocked();
            return;
        }

        void this._closeWithReason(reason);
    }

    /** Ferme avec raison et returnValue optionnel. */
    private async _closeWithReason(reason: DialogCloseReason, returnValue?: string): Promise<void> {
        if (returnValue !== undefined) this.returnValue = returnValue;
        this._pendingCloseReason = reason;
        this.close();
    }

    /** Résultat structuré à la fermeture. */
    getResult(): DialogResult {
        return {
            reason: this._pendingCloseReason,
            returnValue: this.returnValue,
            value: this._choiceSelection.size
                ? (this._choiceOptions?.mode === 'multiple' || this._choiceSelection.size > 1
                    ? [...this._choiceSelection]
                    : [...this._choiceSelection][0])
                : undefined,
        };
    }

    /**
     * Applique les classes CSS et le rôle ARIA liés aux options (variant, scrollable).
     */
    private _applyOptionsClasses(): void {
        const variant = this.options.variant ?? 'basic';
        this.el.classList.toggle('dialog--fullscreen', variant === 'fullscreen');
        this.el.classList.toggle('dialog--scrollable', Boolean(this.options.scrollable));
        this.el.classList.toggle('dialog--alert', variant === 'alert');
        this.el.classList.toggle('dialog--centered', Boolean(this.options.centered));
        this.el.classList.toggle('dialog--emphasized-headline', Boolean(this.options.emphasizedHeadline));

        this._resolveEffectiveVariant();

        if (this._isFullscreen()) {
            this._setupFullscreenStructure();
        } else {
            this._restoreBasicStructure();
        }

        if (variant === 'alert') {
            this.el.setAttribute('data-dialog-role', 'alertdialog');
            this._dialogRole = 'alertdialog';
        } else if (this.el.getAttribute('data-dialog-role') !== 'alertdialog') {
            this.el.removeAttribute('data-dialog-role');
            this._dialogRole = 'dialog';
        }

        this._setupAccessibility();

        if (this.options.icon) {
            this._injectHeroIcon(this.options.icon);
        }
    }

    /**
     * Indique si le dialog utilise la variante fullscreen M3.
     */
    private _isFullscreen(): boolean {
        return this.el.classList.contains('dialog--fullscreen');
    }

    /**
     * Indique si l'animation slide-up fullscreen s'applique.
     */
    private _usesFullscreenSlideAnimation(): boolean {
        return this._isFullscreen();
    }

    /**
     * Sauvegarde le markup d'origine avant transformation fullscreen (persisté sur l'élément).
     */
    private _saveFullscreenMarkupBackup(container: HTMLElement): void {
        const el = this.el as HTMLElement & { K_DialogMarkupBackup?: string };
        if (!el.K_DialogMarkupBackup) {
            el.K_DialogMarkupBackup = container.innerHTML;
        }
    }

    /**
     * Restaure le markup basic/alert après une variante fullscreen (footer en bas).
     */
    private _restoreBasicStructure(): void {
        const container = this.el.querySelector('.dialog-container');
        if (!container) {
            return;
        }

        const hasFullscreenStructure = container.querySelector('.dialog-header--fullscreen');
        const backup = (this.el as HTMLElement & { K_DialogMarkupBackup?: string }).K_DialogMarkupBackup;
        if (!hasFullscreenStructure && !backup) {
            return;
        }

        if (backup) {
            container.innerHTML = backup;
            this._setupStructure();
            this._setupCloseButtonLabels();
            return;
        }

        // Repli : retirer les classes fullscreen sans backup
        container.querySelector('.dialog-header')?.classList.remove('dialog-header--fullscreen');
        container.querySelector('.dialog-footer')?.classList.remove(
            'dialog-footer--fullscreen-hidden',
            'dialog-footer--fullscreen-secondary'
        );
    }

    /**
     * Restructure le header en toolbar M3 fullscreen (close gauche, action droite).
     * Transforme le markup déclaratif standard si nécessaire.
     */
    private _setupFullscreenStructure(): void {
        const container = this.el.querySelector('.dialog-container');
        if (!container) {
            return;
        }

        let header = container.querySelector(':scope > .dialog-header');
        if (header?.classList.contains('dialog-header--fullscreen')) {
            this._relocateFullscreenTitleIntoToolbar(header);
            return;
        }

        this._saveFullscreenMarkupBackup(container);

        const footer = container.querySelector(':scope > .dialog-footer');
        const footerClose = footer?.querySelector('.dialog-close');
        const footerConfirm = footer?.querySelector('.dialog-confirm');
        const headerClose = header?.querySelector('.dialog-close');
        const headerConfirm = header?.querySelector('.dialog-confirm');

        const closeBtn = (footerClose ?? headerClose) as HTMLElement | null;
        const confirmBtn = (footerConfirm ?? headerConfirm) as HTMLElement | null;

        if (!header) {
            header = document.createElement('div');
            header.className = 'dialog-header dialog-header--fullscreen';
            container.insertBefore(header, container.firstChild);
        } else {
            header.classList.add('dialog-header--fullscreen');
        }

        const titleEl = header.querySelector('h1, h2, h3, h4, h5, h6, .dialog-title');
        const titleHtml = titleEl instanceof HTMLElement ? titleEl.outerHTML : '';

        const toolbar = document.createElement('div');
        toolbar.className = 'dialog-header__toolbar';

        const leading = document.createElement('div');
        leading.className = 'dialog-header__leading';

        if (closeBtn instanceof HTMLButtonElement) {
            this._upgradeCloseButtonToIcon(closeBtn);
            leading.appendChild(closeBtn);
        } else {
            leading.innerHTML = `
                <button type="button" class="btn-icon btn-icon--standard btn-icon--sm dialog-close ripple" aria-label="${escapeHtml(LocaleManager.t('dialog.close'))}">
                    <span class="btn-icon__icon"><i class="k3ui-icon" name="xmark" size="md" aria-hidden="true"></i></span>
                </button>`;
        }

        const actions = document.createElement('div');
        actions.className = 'dialog-header__actions';

        if (confirmBtn instanceof HTMLButtonElement) {
            actions.appendChild(confirmBtn);
        } else {
            actions.innerHTML = `
                <button type="button" class="${DialogActionButtonClasses.textPrimary} dialog-confirm ripple">
                    ${escapeHtml(LocaleManager.t('dialog.save'))}
                </button>`;
        }

        toolbar.appendChild(leading);

        if (titleHtml) {
            const titleWrap = document.createElement('div');
            titleWrap.innerHTML = titleHtml;
            const insertedTitle = titleWrap.firstElementChild;
            if (insertedTitle instanceof HTMLElement) {
                insertedTitle.classList.add('dialog-title');
                toolbar.appendChild(insertedTitle);
            }
        }

        toolbar.appendChild(actions);

        header.innerHTML = '';
        header.appendChild(toolbar);
        this._relocateFullscreenTitleIntoToolbar(header);

        if (footer) {
            const secondaryActions = footer.querySelectorAll(
                '.dialog-action-left button:not(.dialog-close):not(.dialog-confirm), .dialog-action-right button:not(.dialog-close):not(.dialog-confirm), .dialog-reset'
            );
            if (secondaryActions.length === 0) {
                footer.classList.add('dialog-footer--fullscreen-hidden');
            } else {
                footer.classList.add('dialog-footer--fullscreen-secondary');
            }
        }

        this._setupCloseButtonLabels();
    }

    private _findFullscreenHeaderTitle(header: Element): HTMLElement | null {
        for (const child of Array.from(header.children)) {
            if (!(child instanceof HTMLElement)) {
                continue;
            }
            if (child.classList.contains('dialog-header__toolbar')) {
                continue;
            }
            if (
                child.classList.contains('dialog-title')
                || /^H[1-6]$/i.test(child.tagName)
            ) {
                return child;
            }
        }
        return null;
    }

    /**
     * Déplace le titre dans la toolbar si encore en dehors (markup legacy).
     */
    private _relocateFullscreenTitleIntoToolbar(header: Element): void {
        const toolbar = header.querySelector('.dialog-header__toolbar');
        if (!toolbar) {
            return;
        }

        const titleEl = this._findFullscreenHeaderTitle(header);
        if (!titleEl || toolbar.contains(titleEl)) {
            return;
        }

        titleEl.classList.add('dialog-title');
        const actions = toolbar.querySelector('.dialog-header__actions');
        if (actions) {
            toolbar.insertBefore(titleEl, actions);
        } else {
            toolbar.appendChild(titleEl);
        }
    }

    /**
     * Convertit un bouton texte `.dialog-close` en bouton icône M3 fullscreen.
     */
    private _upgradeCloseButtonToIcon(btn: HTMLButtonElement): void {
        if (btn.classList.contains('btn-icon')) {
            return;
        }
        btn.className = 'btn-icon btn-icon--standard btn-icon--sm dialog-close ripple';
        btn.innerHTML = `
            <span class="btn-icon__icon">
                <i class="k3ui-icon" name="xmark" size="md" aria-hidden="true"></i>
            </span>`;
        btn.setAttribute('aria-label', LocaleManager.t('dialog.close'));
    }

    /**
     * Injecte une icône hero dans le header si absente.
     */
    private _injectHeroIcon(iconName: string): void {
        const header = this.el.querySelector('.dialog-header');
        if (!header || header.querySelector('.dialog-header__hero-icon')) {
            return;
        }
        header.classList.add('dialog-header--hero');
        const iconWrap = document.createElement('div');
        iconWrap.className = 'dialog-header__hero-icon';
        iconWrap.setAttribute('aria-hidden', 'true');
        iconWrap.innerHTML = `<i class="k3ui-icon" name="${escapeHtml(iconName)}" size="md" aria-hidden="true"></i>`;
        header.insertBefore(iconWrap, header.firstChild);
    }

    /**
     * Avertit en console pour les options dépréciées (mode ancré).
     */
    private _warnDeprecatedOptions(): void {
        if (this.options.placement !== undefined || this.options.anchor || this.options.cover) {
            ManagerFactory.getLoggerManager().warn(
                '[Dialog] placement/anchor/cover sont dépréciés. Utilisez Menu/Popover pour les surfaces ancrées.'
            );
        }
    }

    /**
     * Ajoute des aria-label sur les boutons de fermeture icon-only ou sans texte visible.
     */
    private _setupCloseButtonLabels(): void {
        this.el.querySelectorAll('.dialog-close').forEach((btn) => {
            if (btn instanceof HTMLElement && !btn.getAttribute('aria-label') && !btn.textContent?.trim()) {
                btn.setAttribute('aria-label', LocaleManager.t('dialog.close'));
            }
        });
    }

    /**
     * Émet un événement custom dialog:* sur l'élément.
     */
    private _dispatchDialogEvent(phase: 'open' | 'opened' | 'close' | 'closed'): void {
        if (!this.el) {
            return;
        }
        this.el.dispatchEvent(new CustomEvent(`dialog:${phase}`, {
            bubbles: true,
            detail: { dialog: this.el, trigger: this._openingTrigger ?? undefined },
        }));
    }

    /**
     * Retourne le bouton d'action primaire pour le focus initial MD3.
     */
    private _getPrimaryActionElement(): HTMLElement | null {
        return this.el.querySelector(
            '.dialog-confirm, .dialog-footer .dialog-action-right .btn--primary, .dialog-footer .dialog-action-right .btn'
        ) as HTMLElement | null;
    }

    /**
     * Configure l'accessibilité selon MD3
     */
    private _setupAccessibility(): void {
        const dataRole = this.el.getAttribute('data-dialog-role');
        this._dialogRole = dataRole === 'alertdialog' ? 'alertdialog' : 'dialog';

        // Rôle ARIA
        setAriaAttributes(this.el, {
            role: this._dialogRole,
            modal: DialogSpecs.accessibility.ariaModal,
            hidden: !this.isOpen,
        });

        // Trouver le titre pour aria-labelledby
        const title = this.el.querySelector('.dialog-header h1, .dialog-header h2, .dialog-header h3, .dialog-header h4, .dialog-header h5, .dialog-header h6');
        if (title && !title.id) {
            title.id = `${this.id}-title`;
            setAriaAttributes(this.el, {
                labelledby: `${this.id}-title`
            });
        }
        if (!title && !this.el.getAttribute('aria-label')) {
            this.el.setAttribute('aria-label', DialogSpecs.accessibility.labels.dialog);
        }

        // Trouver le contenu pour aria-describedby
        const content = this.el.querySelector('.dialog-content');
        if (content && !content.id) {
            content.id = `${this.id}-content`;
            setAriaAttributes(this.el, {
                describedby: `${this.id}-content`
            });
        }
    }

    /**
     * Supprime les attributs ARIA
     */
    private _removeAccessibility(): void {
        removeAriaAttribute(this.el, 'role');
        removeAriaAttribute(this.el, 'modal');
        removeAriaAttribute(this.el, 'hidden');
        removeAriaAttribute(this.el, 'labelledby');
        removeAriaAttribute(this.el, 'describedby');
    }

    /**
     * Configure les gestionnaires d'événements selon MD3.
     * Escape et scrim sont toujours écoutés ; `_isDismissible()` est évalué à l'exécution.
     */
    private _setupEventHandlers(): void {
        this._removeEventHandlers();

        this._keyboard = new Keyboard({
            target: document,
            enabled: true,
            ignoreSystemKeys: false,
            onKeyDown: (event: KeyboardEvent, key: string) => {
                if (key !== 'Escape') return;
                this._handleDismissRequest('escape', event);
            },
        });

        this._mouse = new Mouse({
            target: this._overlay,
            enabled: true,
            onClick: (event: MouseEvent) => {
                if (event.target !== this._overlay) return;
                this._handleDismissRequest('scrim', event);
            },
        });

        // Gestionnaire pour les boutons de fermeture
        if (this._dialogClickCleanup) {
            this._dialogClickCleanup();
        }
        this._dialogClickCleanup = this.registerEvent(this.el, 'click', this._handleDialogClick);
    }

    /**
     * Supprime les gestionnaires d'événements
     */
    private _removeEventHandlers(): void {
        if (this._keyboard) {
            this._keyboard.destroy();
            this._keyboard = null;
        }
        if (this._mouse) {
            this._mouse.destroy();
            this._mouse = null;
        }
        if (this._dialogClickCleanup) {
            this._dialogClickCleanup();
            this._dialogClickCleanup = null;
        }
    }

    /**
     * Gère les clics dans le dialog
     */
    private _handleDialogClick = (e: MouseEvent): void => {
        const closeTrigger = (e.target as HTMLElement).closest('.dialog-close');
        if (closeTrigger) {
            e.preventDefault();
            this.close();
        }
    }

    /**
     * Configure le focus trap selon MD3
     */
    private _setupFocusTrap(): void {
        this._setupFocusTrapBase(DialogSpecs.accessibility.focusTrap);
    }

    /**
     * Supprime le focus trap
     */
    private _removeFocusTrap(): void {
        this._removeFocusTrapBase();
    }

    /**
     * Indique si les animations doivent être ignorées (reduced motion).
     */
    private _shouldSkipDialogMotion(): boolean {
        return shouldSkipMotion();
    }

    /**
     * Durée d'animation effective (0 si reduced motion).
     */
    private _getAnimDuration(direction: 'in' | 'out'): number {
        if (this._shouldForceReducedMotion()) {
            return 0;
        }
        return direction === 'in' ? this.options.inDuration : this.options.outDuration;
    }

    /**
     * Mouvement réduit forcé (option composant) ou préférence système / override global.
     */
    private _shouldForceReducedMotion(): boolean {
        return Boolean(this.options.reducedMotion ?? this.options.quick) || this._shouldSkipDialogMotion();
    }

    /**
     * Transition M3 pour le dialog (modal ou bottom sheet).
     */
    private _buildDialogTransition(isBottomSheet: boolean, durationMs?: number): string {
        const preset = isBottomSheet ? MotionPresets.dialogBottomSheet : MotionPresets.dialogModal;
        return buildSpatialEffectsTransition(
            preset.spatialSpeed,
            preset.effectsSpeed,
            durationMs,
            this.el
        );
    }

    /**
     * Transition M3 pour le scrim (opacity effects).
     */
    private _buildScrimTransition(durationMs?: number): string {
        return buildEffectsTransition(MotionPresets.dialogScrim.effectsSpeed, durationMs, this.el);
    }

    /**
     * Transition M3 pour le bottom sheet (bottom + opacity).
     */
    private _buildBottomSheetTransition(durationMs?: number): string {
        const preset = MotionPresets.dialogBottomSheet;
        return buildMotionTransition(
            [
                { property: 'bottom', category: 'spatial', speed: preset.spatialSpeed },
                { property: 'opacity', category: 'effects', speed: preset.effectsSpeed },
            ],
            durationMs,
            this.el
        );
    }

    /**
     * Transition M3 pour le dialog fullscreen mobile (translateY + opacity).
     */
    private _buildFullscreenTransition(durationMs?: number): string {
        const preset = MotionPresets.dialogFullscreen;
        return buildMotionTransition(
            [
                { property: 'transform', category: 'spatial', speed: preset.spatialSpeed },
                { property: 'opacity', category: 'effects', speed: preset.effectsSpeed },
            ],
            durationMs,
            this.el
        );
    }

    /**
     * Annonce l'ouverture du dialog aux lecteurs d'écran (aria-live).
     */
    private _announceDialogOpen(): void {
        if (!DialogSpecs.accessibility.announceStateChanges) {
            return;
        }
        const title = this.el.querySelector(
            '.dialog-header h1, .dialog-header h2, .dialog-header h3, .dialog-header h4, .dialog-header h5, .dialog-header h6'
        );
        const message = title?.textContent?.trim() || DialogSpecs.accessibility.labels.dialog;
        const live = document.createElement('div');
        live.setAttribute('aria-live', 'polite');
        live.setAttribute('aria-atomic', 'true');
        live.className = 'sr-only';
        live.style.cssText =
            'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;';
        live.textContent = message;
        document.body.appendChild(live);
        window.setTimeout(() => live.remove(), 1000);
    }

    /**
     * Retour haptique à l'ouverture selon le rôle du dialog.
     */
    private _triggerOpenHaptic(): void {
        const pattern = this._dialogRole === 'alertdialog' ? 'error' : 'light';
        HapticManager.triggerFromOptions(this.options, pattern);
    }

    /**
     * Positionne le dialog selon le mode (centré ou ancré)
     * @private
     */
    private async _positionDialog(): Promise<void> {
        // 1. Nettoyage instance précédente
        if (this._floatingCleanup) {
            this._floatingCleanup();
            this._floatingCleanup = null;
        }

        // 2. Mode de positionnement — `anchor`/`placement` uniquement.
        // `_openingTrigger` sert au Container Transform, pas au Floating UI.
        const anchor = this.options.anchor;
        const hasPlacement = this.options.placement !== undefined;
        const isAnchored = Boolean(anchor && hasPlacement);

        this._positioningMode = isAnchored ? 'anchored' : 'centered';

        // 3. MODE CENTRÉ (défaut)
        if (!isAnchored) {
            this.el.style.position = 'fixed';

            if (this._isFullscreen()) {
                this.el.style.top = '0';
                this.el.style.left = '0';
                this.el.style.right = '0';
                this.el.style.bottom = '0';
                this.el.style.width = '100%';
                this.el.style.height = '100%';
                this.el.style.maxWidth = 'none';
                this.el.style.maxHeight = 'none';
                this.el.style.margin = '0';
                this.el.style.borderRadius = '0';
                this.el.style.transform = getFullscreenDialogTransform(false);
                this.el.style.transformOrigin = 'center bottom';
                return;
            }

            // Position centrée — le scale M3 est piloté par --dialog-spatial (CSS)
            this.el.style.top = '50%';
            this.el.style.left = '50%';
            this.el.style.transform = '';
            this.el.style.transformOrigin = 'center center';
            return;
        }

        // 4. MODE ANCRÉ (Floating UI)
        if (!anchor) return;

        // Préparation pour le calcul de dimensions
        this.el.style.transition = 'none';
        this.el.style.display = 'block';
        this.el.style.visibility = 'visible';
        this.el.style.opacity = '0';
        this.el.style.transform = 'none';

        // Force reflow pour appliquer les styles
        void this.el.offsetWidth;

        // Configuration Floating UI
        const placement = (this.options.placement || 'bottom-start') as Placement;
        const offsetVal = this.options.cover ? 0 : 8;

        // Fonction de mise à jour de la position
        const dialogFloatingMiddleware = [
            offset(offsetVal),
            flip({ padding: 8 }),
            shift({ padding: 8 }),
            size({
                padding: 8,
                apply({ availableWidth, availableHeight, elements }) {
                    Object.assign(elements.floating.style, {
                        maxWidth: `${Math.max(200, availableWidth)}px`,
                        maxHeight: `${Math.max(100, availableHeight)}px`,
                    });
                },
            }),
        ] as NonNullable<ComputePositionConfig['middleware']>;

        const updatePosition = async () => {
            if (!anchor) return;

            const result = await computePosition(anchor, this.el, {
                placement: placement,
                middleware: dialogFloatingMiddleware,
            });

            // S'assurer que le dialog est bien affiché
            this.el.style.display = 'block';
            this.el.style.position = 'absolute';

            // Appliquer la position
            this.el.style.left = `${Math.round(result.x)}px`;
            this.el.style.top = `${Math.round(result.y)}px`;

            // Définir l'origine de l'animation selon le placement
            const [side, align] = result.placement.split('-');
            const originY = side === 'top' ? 'bottom' : (side === 'bottom' ? 'top' : 'center');
            const originX = align === 'end' ? 'right' : (align === 'start' ? 'left' : 'center');
            this.el.style.transformOrigin = `${originX} ${originY}`;
        };

        // Premier calcul de position
        await updatePosition();

        // Démarrer autoUpdate pour les mises à jour suivantes
        this._floatingCleanup = autoUpdate(
            anchor,
            this.el,
            updatePosition
        );
    }

    /**
     * Résout la vitesse ressort M3 (fast | default | slow) depuis inDuration / outDuration.
     */
    private _resolveSpringSpeed(direction: 'in' | 'out'): M3SpringSpeed {
        const ms = direction === 'in'
            ? (this.options.inDuration ?? 500)
            : (this.options.outDuration ?? 150);
        if (direction === 'in') {
            if (ms <= 400) return 'fast';
            if (ms >= 650) return 'slow';
            return 'default';
        }
        if (ms <= 130) return 'fast';
        if (ms >= 220) return 'slow';
        return 'default';
    }

    /**
     * Indique si l'animation ressort M3 Fade (scale + opacity) s'applique.
     */
    private _usesSpringFadeAnimation(): boolean {
        const isBottomSheet = this.el.classList.contains('bottom-sheet');
        const isAnchored = this._positioningMode === 'anchored';
        return !isBottomSheet && !isAnchored;
    }

    /**
     * Surface `.dialog-container` cible du FLIP / des ressorts spatiaux.
     */
    private _getDialogContainer(): HTMLElement | null {
        const container = this.el.querySelector('.dialog-container');
        return container instanceof HTMLElement ? container : null;
    }

    /**
     * Annule les animations WAAPI et retire transform/opacity inline sur le container.
     * Évite un snap au second open après un Container Transform out (`fill: both`).
     */
    private _resetDialogContainerMotion(container: HTMLElement): void {
        container.getAnimations().forEach((animation) => {
            animation.cancel();
        });
        container.style.removeProperty('transform');
        container.style.removeProperty('opacity');
    }

    /** True si la génération d'animation correspond encore (open/close non interrompu). */
    private _isMotionGenerationActive(generation: number): boolean {
        return generation === this._motionGeneration;
    }

    /**
     * Container Transform M3 : trigger + surface centrée, hors fullscreen / reduced motion.
     */
    private _canUseContainerTransform(container: HTMLElement | null): container is HTMLElement {
        return Boolean(
            this.options.containerTransform !== false &&
            this._openingTrigger &&
            container &&
            !this._shouldForceReducedMotion() &&
            !this._isFullscreen()
        );
    }

    /**
     * Notifie la fin d'ouverture (callback + événement `opened`).
     */
    private _notifyOpened(): void {
        this._refreshCustomScrollbar();
        requestAnimationFrame(() => this._refreshCustomScrollbar());
        if (typeof this.options.onOpenEnd === 'function') {
            this.options.onOpenEnd(this.el);
        }
        this._dispatchDialogEvent('opened');
    }

    /**
     * Applique le scrim via tokens CSS (`--dialog-scrim-opacity`, `--dialog-blur-value`).
     * Ne touche pas à l'opacité d'animation (`--dialog-effects` / style.opacity).
     */
    private _applyScrim(): void {
        if (!this._overlay) return;

        const blurValue = Math.max(0, Number(this.options.blur) || 0);
        const isDarkTheme = ThemeManager.isDark();
        let opacity: number;
        if (this.options.opacity !== undefined && !Number.isNaN(Number(this.options.opacity))) {
            opacity = Number(this.options.opacity);
        } else if (blurValue > 0) {
            opacity = isDarkTheme ? 0.32 : 0.16;
        } else {
            opacity = isDarkTheme ? 0.64 : 0.32;
        }
        opacity = Math.min(1, Math.max(0, opacity));

        // Fond uniquement via CSS var — jamais d'inline background (évite les conflits)
        this._overlay.style.removeProperty('background');
        this._overlay.style.removeProperty('background-color');
        this._overlay.style.setProperty('--dialog-scrim-opacity', String(opacity));

        if (blurValue > 0) {
            this._overlay.classList.add('dialog-overlay--blur');
            this._overlay.style.setProperty('--dialog-blur-value', `${blurValue}px`);
        } else {
            this._overlay.classList.remove('dialog-overlay--blur');
            this._overlay.style.setProperty('--dialog-blur-value', '0px');
        }
    }

    /**
     * @deprecated Utiliser {@link _applyScrim}
     */
    private _applyScrimOpacity(): void {
        this._applyScrim();
    }

    /**
     * Ouverture via Container Transform M3 (FLIP WAAPI depuis le trigger).
     * Le scrim reste géré par l’overlay ; le container n’a pas de `transform` CSS figé
     * (Chromium ignore sinon les keyframes WAAPI).
     */
    private _animateInWithContainerTransform(trigger: HTMLElement, container: HTMLElement): void {
        if (!this._overlay) return;

        const generation = this._motionGeneration;
        this._resetDialogContainerMotion(container);
        this._overlay.style.setProperty('--dialog-effects', '1');
        this.el.classList.add(DIALOG_CONTAINER_TRANSFORM_CLASS);
        void container.offsetWidth;

        const anim = containerTransform(trigger, container, {
            durationMs: this._getAnimDuration('in'),
        });

        const finish = (): void => {
            if (!this._isMotionGenerationActive(generation) || !this.isOpen) return;
            this._resetDialogContainerMotion(container);
            this._springController?.jump(1);
            this.el.classList.remove(DIALOG_CONTAINER_TRANSFORM_CLASS);
            this._notifyOpened();
        };

        void anim.finished.then(finish).catch(finish);
    }

    /**
     * Fermeture via Container Transform inverse (FLIP vers le trigger d'ouverture).
     */
    private _animateOutWithContainerTransform(trigger: HTMLElement, container: HTMLElement): void {
        if (!this._overlay) {
            this._finalizeClose();
            return;
        }

        const outMs = this._getAnimDuration('out');
        const generation = this._motionGeneration;
        this.el.classList.add(DIALOG_CONTAINER_TRANSFORM_CLASS);
        this._overlay.style.transition = buildEffectsTransition(outMs);
        this._overlay.style.setProperty('--dialog-effects', '0');

        const anim = containerTransformOut(trigger, container, { durationMs: outMs });

        const finish = (): void => {
            if (!this._isMotionGenerationActive(generation) || this.isOpen) return;
            this._resetDialogContainerMotion(container);
            this._springController?.jump(0);
            this._springController?.destroy();
            this._springController = null;
            this._openingTrigger = undefined;
            this.el.classList.remove(DIALOG_CONTAINER_TRANSFORM_CLASS);
            this._finalizeClose();
        };

        void anim.finished.then(finish).catch(finish);
    }

    /**
     * Anime l'entrée via ressorts M3 (pattern Fade : scale 0.8→1 + opacity),
     * ou Container Transform si un trigger d'ouverture est fourni.
     */
    private async _animateInWithSprings(): Promise<void> {
        if (!this._overlay) return;

        const animation = this._resolveAnimation();
        this._springController?.destroy();
        this._springController = createDialogSpringController(this.el, this._overlay, animation);
        this._overlay.style.removeProperty('opacity');
        this._overlay.style.removeProperty('transition');
        this._springController.jump(0);
        this._applyScrim();

        const trigger = this._openingTrigger;
        const container = this._getDialogContainer();
        if (container) {
            this._resetDialogContainerMotion(container);
        }
        if (trigger && this._canUseContainerTransform(container)) {
            this._animateInWithContainerTransform(trigger, container);
            return;
        }

        await this._springController.animateTo(1, this._resolveSpringSpeed('in'));
        this._notifyOpened();
    }

    /**
     * Anime la sortie via ressorts M3.
     */
    private async _animateOutWithSprings(): Promise<void> {
        const trigger = this._openingTrigger;
        const container = this._getDialogContainer();
        if (trigger && this._canUseContainerTransform(container)) {
            this._animateOutWithContainerTransform(trigger, container);
            return;
        }

        if (!this._springController) {
            this._finalizeClose();
            return;
        }
        const generation = this._motionGeneration;
        await this._springController.animateTo(0, this._resolveSpringSpeed('out'));
        if (!this._isMotionGenerationActive(generation) || this.isOpen) return;
        this._springController.destroy();
        this._springController = null;
        this._finalizeClose();
    }

    /**
     * Anime l'entrée du dialog selon MD3 Expressive (12 springs M3)
     */
    private _animateIn(): void {
        if (!this.el || !this._overlay) {
            return;
        }
        this._overlay.style.display = 'block';
        this.el.style.display = 'block';
        this.el.style.visibility = 'visible';
        this.el.style.pointerEvents = 'auto';
        requestAnimationFrame(() => this._refreshCustomScrollbar());

        const duration = this._getAnimDuration('in');
        const skipMotion = duration === 0;
        const useSprings = this._usesSpringFadeAnimation() && !skipMotion && !this._isFullscreen();

        if (useSprings) {
            void this._animateInWithSprings();
            return;
        }

        if (skipMotion && this._usesSpringFadeAnimation()) {
            this._applyScrim();
            this._springController?.destroy();
            this._springController = createDialogSpringController(
                this.el,
                this._overlay,
                this._resolveAnimation()
            );
            this._springController.jump(1);
            window.setTimeout(() => {
                if (this.el) {
                    this._notifyOpened();
                }
            }, 0);
            return;
        }

        this.el.style.opacity = '0';

        const isBottomSheet = this.el.classList.contains('bottom-sheet');
        const isFullscreenSlide = this._usesFullscreenSlideAnimation();
        const isHaptic = this.options.haptic;
        const isAnchored = this._positioningMode === 'anchored';
        const modalPreset = isBottomSheet ? MotionPresets.dialogBottomSheet : MotionPresets.dialogModal;
        const spatialEasing = readMotionSpring('spatial', modalPreset.spatialSpeed, this.el).easing;

        if (!isBottomSheet && !isAnchored) {
            if (isFullscreenSlide) {
                this.el.style.transform = getFullscreenDialogTransform(false);
            } else {
                this.el.style.transform = getCenteredDialogTransform(false);
                prepareDialogSectionsForEnter(this.el);
            }
        } else if (isAnchored) {
            this.el.style.transform = isHaptic ? 'scale(0.8)' : 'scale(0.9)';
        } else if (isBottomSheet) {
            this.el.style.transform = 'none';
            this.el.style.bottom = '-100%';
        }

        this._applyScrim();
        const blurValue = Math.max(0, Number(this.options.blur) || 0);
        const isBlurActive = blurValue > 0;

        // Fade du scrim : opacity élément (chemin legacy) — le fond reste sur --dialog-scrim-opacity
        if (isBlurActive) {
            this._overlay.style.opacity = '1';
            this._overlay.style.transition = 'none';
        } else {
            this._overlay.style.opacity = skipMotion ? '1' : '0';
            this._overlay.style.transition = skipMotion ? 'none' : this._buildScrimTransition(duration);
        }

        if (skipMotion) {
            this.el.style.opacity = '1';
            if (isBottomSheet) {
                this.el.style.bottom = '0';
            } else if (isAnchored) {
                this.el.style.transform = 'scale(1)';
            } else if (isFullscreenSlide) {
                this.el.style.transform = getFullscreenDialogTransform(true);
            } else {
                this.el.style.transform = getCenteredDialogTransform(true);
            }
            resetDialogSectionStyles(this.el);
            window.setTimeout(() => {
                if (this.el && typeof this.options.onOpenEnd === 'function') {
                    this.options.onOpenEnd(this.el);
                }
                this._dispatchDialogEvent('opened');
            }, 0);
            return;
        }

        if (isBottomSheet) {
            this.el.style.transition = 'none';
            void this.el.offsetWidth;
            this.el.style.transition = this._buildBottomSheetTransition(duration);
        } else if (isFullscreenSlide) {
            this.el.style.transition = this._buildFullscreenTransition(duration);
        } else if (isHaptic && isAnchored) {
            const overshootDuration = Math.floor(duration * 0.6);
            const overshootEasing = 'cubic-bezier(0.25, 1.35, 0.5, 1)';
            this.el.style.transition = `opacity ${overshootDuration}ms ${overshootEasing}, transform ${overshootDuration}ms ${overshootEasing}`;
        } else if (!isAnchored) {
            this.el.style.transition = this._buildDialogTransition(false, duration);
        } else {
            this.el.style.transition = this._buildDialogTransition(false, duration);
        }

        requestAnimationFrame(() => {
            if (!this.el || !this._overlay) {
                return;
            }
            if (!isBlurActive) {
                this._overlay.style.opacity = '1';
            }
            this.el.style.opacity = '1';

            if (isBottomSheet) {
                this.el.style.bottom = '0';
            } else if (isHaptic && isAnchored) {
                const overshootDuration = Math.floor(duration * 0.6);
                const settleDuration = duration - overshootDuration;
                const settleEasing = spatialEasing;
                this.el.style.transform = 'scale(1.04)';
                window.setTimeout(() => {
                    if (!this.el) return;
                    this.el.style.transition = `transform ${settleDuration}ms ${settleEasing}`;
                    this.el.style.transform = 'scale(1)';
                }, overshootDuration);
            } else if (isFullscreenSlide) {
                this.el.style.transform = getFullscreenDialogTransform(true);
            } else if (!isBottomSheet && !isAnchored) {
                this.el.style.transform = getCenteredDialogTransform(true);
                animateDialogSectionsIn(this.el);
            } else if (isAnchored) {
                this.el.style.transform = 'scale(1)';
            }
        });

        window.setTimeout(() => {
            if (this.el && typeof this.options.onOpenEnd === 'function') {
                this.options.onOpenEnd(this.el);
            }
            this._dispatchDialogEvent('opened');
        }, duration);
    }

    /**
     * Anime la sortie du dialog selon MD3 Expressive (12 springs M3)
     */
    private _animateOut(): void {
        if (!this.el || !this._overlay) {
            return;
        }
        const duration = this._getAnimDuration('out');
        const skipMotion = duration === 0;
        const useSprings = this._usesSpringFadeAnimation() && !skipMotion && !this._isFullscreen() && this._springController;

        if (useSprings) {
            void this._animateOutWithSprings();
            return;
        }

        if (skipMotion && this._usesSpringFadeAnimation() && this._springController) {
            this._springController.jump(0);
            this._springController.destroy();
            this._springController = null;
            this._finalizeClose();
            return;
        }

        const isBottomSheet = this.el.classList.contains('bottom-sheet');
        const isFullscreenSlide = this._usesFullscreenSlideAnimation();
        const isHaptic = this.options.haptic;
        const isAnchored = this._positioningMode === 'anchored';
        const spatialEasing = readMotionSpring('spatial', MotionPresets.dialogModal.spatialSpeed, this.el).easing;

        if (isAnchored && this._floatingCleanup) {
            this._floatingCleanup();
            this._floatingCleanup = null;
        }

        this._positioningMode = 'centered';
        this.el.style.transformOrigin = 'center center';
        this._overlay.style.transition = skipMotion ? 'none' : this._buildScrimTransition(duration);

        if (skipMotion) {
            this._overlay.style.opacity = '0';
            this.el.style.opacity = '0';
            this._finalizeClose();
            return;
        }

        if (isBottomSheet) {
            this.el.style.transition = this._buildBottomSheetTransition(duration);
        } else if (isFullscreenSlide) {
            this.el.style.transition = this._buildFullscreenTransition(duration);
        } else if (isHaptic && isAnchored) {
            const bounceOutDuration = Math.floor(duration * 0.3);
            const shrinkDuration = duration - bounceOutDuration;
            const bounceEasing = 'cubic-bezier(0.25, 1.35, 0.5, 1)';
            this.el.style.transition = `transform ${bounceOutDuration}ms ${bounceEasing}`;
            this.el.style.transform = 'scale(1.08)';
            window.setTimeout(() => {
                if (!this.el) return;
                this.el.style.transition = `opacity ${shrinkDuration}ms ${spatialEasing}, transform ${shrinkDuration}ms ${spatialEasing}`;
                this.el.style.opacity = '0';
                this.el.style.transform = 'scale(0.7)';
            }, bounceOutDuration);
        } else {
            this.el.style.transition = this._buildDialogTransition(false, duration);
        }

        if (!isBottomSheet && !isAnchored && !isFullscreenSlide) {
            animateDialogSectionsOut(this.el);
        }

        requestAnimationFrame(() => {
            if (!this.el || !this._overlay) {
                return;
            }
            this._overlay.style.opacity = '0';

            if (isBottomSheet) {
                this.el.style.bottom = '-100%';
                this.el.style.opacity = '0';
            } else if (isFullscreenSlide) {
                this.el.style.opacity = '0';
                this.el.style.transform = getFullscreenDialogExitTransform();
            } else if (isHaptic && isAnchored) {
                // géré par timeout ci-dessus
            } else if (!isAnchored) {
                this.el.style.opacity = '0';
                this.el.style.transform = getCenteredDialogExitTransform();
            } else if (!isHaptic) {
                this.el.style.opacity = '0';
                this.el.style.transform = 'scale(0.9)';
            }
        });

        window.setTimeout(() => {
            this._finalizeClose();
        }, duration);
    }

    /**
     * Empêche le scroll du body selon MD3
     * Utilise overflow: hidden pour éviter tout glissement visuel
     */
    private _preventScrolling(): void {
        this._preventScrollingBase('dialog-open');
    }

    /**
     * Restaure le scroll du body
     * Pas besoin de restaurer la position car overflow: hidden ne la modifie pas
     */
    private _restoreScrolling(): void {
        this._restoreScrollingBase('dialog-open');
    }

    /**
     * Ouvre le dialog selon MD3
     * @param trigger - Élément déclencheur (optionnel)
     * @returns Instance du dialog
     */
    open(trigger?: HTMLElement): Dialog {
        if (this.isOpen) {
            const hidden = this.el.style.display === 'none'
                || getAriaAttribute(this.el, 'hidden') === 'true';
            if (!hidden) {
                return this;
            }
            this.isOpen = false;
        }

        this._motionGeneration++;
        this.isOpen = true;
        Dialog._dialogsOpen++;
        this._nthDialogOpened = Dialog._dialogsOpen;
        this.returnValue = '';
        this._pendingCloseReason = 'api';

        // Sauvegarder l'élément actif pour restaurer le focus
        this._previousActiveElement = document.activeElement as HTMLElement;

        // Z-Index selon le nombre de dialogs ouverts (aligné Chrome Web Store : base 2000)
        const baseZIndex = 2000;
        this._overlay.style.zIndex = (baseZIndex + Dialog._dialogsOpen * 2).toString();
        this.el.style.zIndex = (baseZIndex + Dialog._dialogsOpen * 2 + 1).toString();

        // Trigger d'ouverture
        this._openingTrigger = trigger || undefined;

        this._applyOptionsClasses();

        // Callback onOpenStart
        if (typeof this.options.onOpenStart === 'function') {
            this.options.onOpenStart(this.el);
        }
        this._dispatchDialogEvent('open');

        // Empêcher le scroll
        this._preventScrolling();

        // Ajouter l'overlay au body pour qu'il couvre toute la page
        document.body.appendChild(this._overlay);

        // Mettre à jour l'accessibilité
        setAriaAttributes(this.el, {
            hidden: false
        });

        // Configurer le focus trap
        this._setupFocusTrap();

        // Positionner le dialog PUIS animer
        this._positionDialog().then(() => {
            if (!this.el) {
                return;
            }

            this._syncLayout();
            if ('ResizeObserver' in window) {
                const container = this.el.querySelector('.dialog-container');
                this._resizeObserver?.disconnect();
                this._resizeObserver = new ResizeObserver(this._syncLayoutHandler);
                if (container instanceof HTMLElement) {
                    this._resizeObserver.observe(container);
                }
                const scroller = this.el.querySelector('.dialog-scroller');
                if (scroller instanceof HTMLElement) {
                    this._resizeObserver.observe(scroller);
                }
            }
            window.addEventListener('resize', this._syncLayoutHandler);
            window.visualViewport?.addEventListener('resize', this._syncViewportHandler);

            if (this.options.closeOnBackNavigation !== false) {
                history.pushState({ k3uiDialog: true }, '');
                this._historyPushed = true;
                window.addEventListener('popstate', this._onPopStateHandler);
            }

            this._triggerOpenHaptic();
            this._announceDialogOpen();
            // Animer l'entrée après le positionnement
            this._animateIn();
        });

        // Focus sur l'action primaire MD3, sinon premier focusable
        setTimeout(() => {
            if (!this.el) {
                return;
            }
            const primaryAction = this._getPrimaryActionElement();
            if (primaryAction) {
                primaryAction.focus();
            } else if (this._firstFocusableElement) {
                this._firstFocusableElement.focus();
            } else {
                this.el.focus();
            }
        }, 50);

        // Charger les icônes avec IconManager après l'ajout au DOM
        setTimeout(() => {
            IconManager.forceDisplayIcons();
        }, 100);

        return this;
    }

    /**
     * Ferme le dialog selon MD3
     * @returns Instance du dialog
     */
    close(): Dialog {
        if (!this.isOpen) return this;

        this._motionGeneration++;
        this.isOpen = false;
        Dialog._dialogsOpen--;
        this._nthDialogOpened = 0;

        // Note : Le nettoyage de Floating UI (_floatingCleanup) est fait dans _animateOut()
        // pour permettre le bon réglage du transformOrigin avant l'animation

        // Callback onCloseStart
        if (typeof this.options.onCloseStart === 'function') {
            this.options.onCloseStart(this.el);
        }
        this._dispatchDialogEvent('close');

        // Mettre à jour l'accessibilité
        setAriaAttributes(this.el, {
            hidden: true
        });

        // Supprimer le focus trap
        this._removeFocusTrap();

        // Restaurer le focus (le scroll body est rétabli après l'animation de fermeture)
        if (this._previousActiveElement) {
            this._previousActiveElement.focus();
            this._previousActiveElement = null;
        }

        // Animer la sortie
        this._animateOut();

        return this;
    }

    /**
     * Finalise la fermeture après l'animation (évite le shift scrollbar pendant le fade-out).
     */
    private _finalizeClose(): void {
        if (!this.el) {
            return;
        }
        window.removeEventListener('popstate', this._onPopStateHandler);
        window.removeEventListener('resize', this._syncLayoutHandler);
        window.visualViewport?.removeEventListener('resize', this._syncViewportHandler);
        this._resizeObserver?.disconnect();
        this._resizeObserver = null;

        this.el.style.display = 'none';
        this.el.removeAttribute('data-blocked');
        resetDialogSectionStyles(this.el);
        if (this._overlay?.parentNode) {
            this._overlay.remove();
        }
        if (this._historyPushed) {
            this._historyPushed = false;
            history.back();
        }
        if (Dialog._dialogsOpen === 0) {
            this._restoreScrolling();
        }
        if (typeof this.options.onCloseEnd === 'function') {
            this.options.onCloseEnd(this.el);
        }
        this._dispatchDialogEvent('closed');
    }
}

const DIALOG_OBSERVED_ATTRIBUTES = [
    'haptic', 'blur', 'opacity', 'in-duration', 'out-duration', 'animation',
    'dismissible', 'prevent-scrolling', 'variant', 'scrollable', 'reduced-motion', 'quick', 'icon',
    'close-on-back-navigation', 'full-screen-on-compact', 'emphasized-headline', 'centered',
    'container-transform',
] as const;

const K3UIDialogElementBase = createK3UIElementClass(Dialog, {
    observedAttributes: [...DIALOG_OBSERVED_ATTRIBUTES],
    onConnected(el) {
        if (!el.classList.contains('dialog')) {
            el.classList.add('dialog');
        }
    },
    onAttributeChanged(el, _name, oldValue, newValue, instance) {
        if (oldValue === newValue) return;
        instance.destroy();
        (el as HTMLElement & { initDialog?: () => void }).initDialog?.();
    },
});

/**
 * Custom Element <k3ui-dialog>
 * @description Permet l'utilisation de <k3ui-dialog> dans le HTML. Initialisation par AutoInit.
 */
class K3UIDialogElement extends K3UIDialogElementBase {
    initDialog(): void {
        if (Dialog.getInstance(this)) return;

        if (!this.classList.contains('dialog')) {
            this.classList.add('dialog');
        }

        const globalOptions = getK3uiComponentWindowOptions('Dialog');
        const options: Partial<DialogOptions> = { ...globalOptions };

        if (this.hasAttribute('haptic')) {
            options.haptic = this.getAttribute('haptic') === 'true';
        }

        if (this.hasAttribute('blur')) {
            const blurValue = this.getAttribute('blur');
            const blurNumber = parseFloat(blurValue || '0');
            options.blur = isNaN(blurNumber) ? 0 : blurNumber;
        }

        if (this.hasAttribute('opacity')) {
            options.opacity = parseFloat(this.getAttribute('opacity') || '0.4');
        }

        if (this.hasAttribute('in-duration')) {
            options.inDuration = parseInt(this.getAttribute('in-duration') || '500', 10);
        }

        if (this.hasAttribute('out-duration')) {
            options.outDuration = parseInt(this.getAttribute('out-duration') || '150', 10);
        }

        if (this.hasAttribute('animation')) {
            const animation = this.getAttribute('animation');
            if (animation === 'expressive' || animation === 'spatial') {
                options.animation = animation;
            }
        }

        if (this.hasAttribute('dismissible')) {
            options.dismissible = this.getAttribute('dismissible') === 'true';
        }

        if (this.hasAttribute('prevent-scrolling')) {
            options.preventScrolling = this.getAttribute('prevent-scrolling') === 'true';
        }

        if (this.hasAttribute('variant')) {
            const variant = this.getAttribute('variant');
            if (variant === 'basic' || variant === 'alert' || variant === 'fullscreen') {
                options.variant = variant;
            }
        }

        if (this.hasAttribute('scrollable')) {
            options.scrollable = this.getAttribute('scrollable') === 'true';
        }

        if (this.hasAttribute('reduced-motion')) {
            options.reducedMotion = this.getAttribute('reduced-motion') === 'true';
        }

        if (this.hasAttribute('quick')) {
            options.reducedMotion = this.getAttribute('quick') === 'true';
        }

        if (this.hasAttribute('icon')) {
            options.icon = this.getAttribute('icon') ?? undefined;
        }

        if (this.hasAttribute('close-on-back-navigation')) {
            options.closeOnBackNavigation = this.getAttribute('close-on-back-navigation') === 'true';
        }

        if (this.hasAttribute('full-screen-on-compact')) {
            options.fullScreenOnCompact = this.getAttribute('full-screen-on-compact') === 'true';
        }

        if (this.hasAttribute('emphasized-headline')) {
            options.emphasizedHeadline = true;
        }

        if (this.hasAttribute('centered')) {
            options.centered = true;
        }

        if (this.hasAttribute('container-transform')) {
            options.containerTransform = this.getAttribute('container-transform') !== 'false';
        }

        new Dialog(this, options);
    }

    /** Ouvre le dialog */
    public open(): void {
        if (!Dialog.getInstance(this)) {
            this.initDialog();
        }
        const instance = Dialog.getInstance(this);
        if (instance) {
            instance.open();
        }
    }

    /** Ferme le dialog */
    public close(): void {
        const instance = Dialog.getInstance(this);
        if (instance) {
            instance.close();
        }
    }

    /** Obtient l'instance du Dialog */
    public getInstance(): Dialog | null {
        return Dialog.getInstance(this) ?? null;
    }
}

// Enregistrer le custom element
if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-dialog')) {
    customElements.define('k3ui-dialog', K3UIDialogElement);
}
