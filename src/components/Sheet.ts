/**
 * @fileoverview Composant Sheet K3UI — Bottom / Top Sheets Material Design 3
 * @description Panneau vertical (top / bottom). Pour left / right, utiliser Drawer.
 * @see https://m3.material.io/components/bottom-sheets/overview
 * @author K3UI Team
 * @version 3.0.0
 */

import { Component } from '../core/base/Component';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import { OpenableComponent } from '../core/base/OpenableComponent';
import { KElement, InitElements } from '../types/base';
import { SheetOptions } from '../types/components';
import { ManagerFactory } from '../core/factories/ManagerFactory';
import { getSheetDefaults } from '../specs/components/sheet.specs';
import { setAriaAttributes, removeAriaAttribute } from '../utils/dom/aria';
import { Keyboard, Mouse, ThemeManager } from '../core/managers';
import { SheetSpecs } from '../specs/components/sheet.specs';
import { IconManager } from '../core/managers/IconManager';
import { sanitizeHtmlFragment } from '../utils/dom/sanitize';
import {
    isSheetPosition,
    isSheetSize,
    resolveSheetPosition,
    resolveSheetSize,
    SHEET_SIZES,
    type SheetSize,
    clearSheetVerticalInlineSize,
} from '../utils/sheet/sheet-size';
import { getK3uiComponentWindowOptions } from '../core/autoinit/window-options';
import {
    bindPointerDown,
    getPointerCoords,
    startPointerDragSession,
    type PointerLikeEvent,
} from '../utils/dom/pointer';
import {
    DISMISS_RATIO,
    FLING_THRESHOLD,
    VelocityTracker,
    animateSpring,
    nearestDetentIndex,
    projectFling,
    rubberBand,
    springSpecForVelocity,
} from '../utils/motion/gesture-physics';

/**
 * Options par défaut du composant Sheet
 * @description Extrait depuis les specs MD3 pour garantir la cohérence
 */
const _defaults: SheetOptions = getSheetDefaults();

/**
 * Empilement Sheet : au-dessus de la chrome (navbar/menu), sous Dialog / Snackbar / Toast.
 * Aligné sur `scss/tokens/sheet.token.scss` ($md-sys-sheet-z-index-overlay).
 */
const SHEET_Z_INDEX_BASE = 1600;

const SHEET_ALLOWED_TAGS = new Set([
    'div', 'span', 'p', 'b', 'i', 'u', 's', 'strong', 'em', 'del',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'br', 'hr',
    'button', 'form', 'input', 'label', 'select', 'option', 'textarea',
    'ul', 'ol', 'li', 'pre', 'code', 'i'
]);
const SHEET_ALLOWED_ATTRS: Record<string, Set<string>> = {
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
    i: new Set(['name', 'size', 'type', 'custom', 'folder', 'class', 'style', 'aria-hidden']),
};

/**
 * Classe du composant Sheet selon Material Design 3.
 * Gère uniquement les ouvertures verticales (top / bottom).
 * Pour les ouvertures latérales (left / right), utiliser Drawer.
 */
export class Sheet extends OpenableComponent<SheetOptions> {
    static _sheetsOpen: number = 0;
    static _count: number = 0;

    /** ID unique du sheet */
    id: string;
    /** Si le sheet est ouvert */
    isOpen: boolean;

    private _openingTrigger: HTMLElement | undefined;
    private _overlay: HTMLDivElement;
    private _nthSheetOpened: number;
    private _keyboard: Keyboard | null = null;
    private _mouse: Mouse | null = null;
    private _focusableElements: HTMLElement[] = [];
    private _firstFocusableElement: HTMLElement | null = null;
    private _lastFocusableElement: HTMLElement | null = null;
    private _previousActiveElement: HTMLElement | null = null;
    private _portalParent: Node | null = null;
    private _portalNextSibling: ChildNode | null = null;
    private _explicitSize: SheetSize | null = null;
    private _dragHandle: HTMLDivElement | null = null;
    private _isDragging: boolean = false;
    private _startY: number = 0;
    private _startHeight: number = 0;
    private _minHeight: number = 120;
    private _maxHeight: number = 0;
    private _unbindDragPointer: (() => void) | null = null;
    private _dragSessionCleanup: (() => void) | null = null;
    private _handleKeyboard: Keyboard | null = null;
    private _detentIndex: number = 1;
    private _velocityTracker = new VelocityTracker();
    private _cancelSpring: (() => void) | null = null;

    constructor(el: HTMLElement, options: Partial<SheetOptions> = {}) {
        const explicitSize = isSheetSize(options.size) ? options.size : null;
        super(el, options, toComponentClassDef(Sheet));
        this._explicitSize = explicitSize;

        this.isOpen = false;
        this.id = this.el.id || `sheet-${Date.now()}`;
        this._openingTrigger = undefined;
        this._overlay = document.createElement('div');
        this._overlay.classList.add('sheet-overlay');

        this.el.tabIndex = -1;
        this._nthSheetOpened = 0;
        Sheet._count++;

        this._setupStructure();
        this._setupAccessibility();
        this._setupEventHandlers();

        ManagerFactory.getLoggerManager().info('Sheet initialisé', this.el);
    }

    static getInstance(el: HTMLElement): Sheet | undefined {
        return Component.getInstance(el) as Sheet | undefined;
    }

    static get defaults(): SheetOptions {
        return _defaults;
    }

    static init(
        el: HTMLElement,
        options?: Partial<SheetOptions>
    ): Sheet;
    static init(
        els: InitElements<KElement>,
        options?: Partial<SheetOptions>
    ): Sheet[];
    static init(
        els: HTMLElement | InitElements<KElement>,
        options?: Partial<SheetOptions>
    ): Sheet | Sheet[] {
        return Component.init(els, options ?? {}, Sheet) as Sheet | Sheet[];
    }

    /**
     * Initialise les sheets depuis les triggers avec attributs data
     */
    static initFromTriggers(): void {
        const triggers = document.querySelectorAll('[sheet-trigger]');

        triggers.forEach(trigger => {
            const targetSelector = trigger.getAttribute('sheet-trigger');
            if (!targetSelector) return;

            const targetSheet = document.querySelector(targetSelector) as HTMLElement;
            if (!targetSheet) return;

            let sheetInstance = Sheet.getInstance(targetSheet);
            if (!sheetInstance) {
                sheetInstance = new Sheet(targetSheet);
            }

            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                sheetInstance.open(trigger as HTMLElement);
            });
        });
    }

    /**
     * Crée et ouvre un sheet dynamiquement selon MD3
     * @param content - Contenu HTML du sheet
     * @param options - Options du sheet
     * @returns Instance du sheet créé
     */
    static show(content: string, options: Partial<SheetOptions> = {}): Sheet {
        const globalOptions = getK3uiComponentWindowOptions('Sheet') as Partial<SheetOptions>;
        const mergedOptions = { ...globalOptions, ...options };

        const sheetEl = document.createElement('div');
        sheetEl.className = 'sheet';

        const position = isSheetPosition(mergedOptions.position)
            ? mergedOptions.position
            : 'bottom';
        sheetEl.classList.add(`sheet--${position}`);
        mergedOptions.position = position;
        mergedOptions.type = position;
        const size = resolveSheetSize(sheetEl, isSheetSize(mergedOptions.size) ? mergedOptions.size : null);
        sheetEl.classList.add(`sheet--${size}`);
        mergedOptions.size = size;

        const safeContent = sanitizeHtmlFragment(content, SHEET_ALLOWED_TAGS, SHEET_ALLOWED_ATTRS);
        sheetEl.innerHTML = `
            <div class="sheet-container">
                <div class="sheet-content">
                    ${safeContent}
                </div>
            </div>
        `;

        document.body.appendChild(sheetEl);

        const sheetInstance = new Sheet(sheetEl, mergedOptions);
        sheetInstance.open();

        const originalClose = sheetInstance.close.bind(sheetInstance);
        sheetInstance.close = function (): Sheet {
            originalClose();
            setTimeout(() => {
                if (sheetEl.parentNode) {
                    sheetEl.parentNode.removeChild(sheetEl);
                }
            }, 300);
            return this;
        };

        return sheetInstance;
    }

    /**
     * Détruit l'instance du sheet
     */
    destroy(): void {
        Sheet._count--;
        this._teardownDrag();
        this._removeEventHandlers();
        this._removeAccessibility();
        this.el.removeAttribute('style');
        if (this._overlay.parentNode) {
            this._overlay.remove();
        }
        this._restoreFromPortal();
        super.destroy();
    }

    /**
     * Configure la structure du sheet (top / bottom uniquement)
     */
    private _setupStructure(): void {
        if (!this.el.classList.contains('sheet')) {
            this.el.classList.add('sheet');
        }

        const position = resolveSheetPosition(
            this.el,
            this.options.position ?? this.options.type
        );

        this.options.position = position;
        this.options.type = position;

        this.el.classList.remove(
            'sheet--side',
            'sheet--left',
            'sheet--right',
            'sheet--bottom',
            'sheet--top'
        );
        this.el.classList.add(`sheet--${position}`);
        this._applySizeClass();
        this.el.classList.toggle('sheet--border', this.options.border === true);
        this._applyFullWidth();

        let container = this.el.querySelector('.sheet-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'sheet-container';
            while (this.el.firstChild) {
                container.appendChild(this.el.firstChild);
            }
            this.el.appendChild(container);
        }

        if (this.options.draggable !== false) {
            this._createDragHandle();
        }
    }

    /**
     * Applique la taille M3 : classes CSS + variables side sheet.
     */
    private _applySizeClass(): void {
        const size = resolveSheetSize(this.el, this._explicitSize);
        this.options.size = size;

        for (const s of SHEET_SIZES) {
            this.el.classList.remove(`sheet--${s}`);
        }
        this.el.classList.add(`sheet--${size}`);
        this.el.setAttribute('size', size);
    }

    /**
     * Change la taille M3 du sheet (détente peek / half / large / full).
     * @param size - small | medium | large | half | full
     */
    setSize(size: SheetSize): void {
        if (!isSheetSize(size)) {
            return;
        }
        this.options.size = size;
        this._explicitSize = size;
        this._applySizeClass();
    }

    /**
     * Active ou désactive la largeur pleine (ignore le plafond M3 640 dp).
     * @param fullWidth - true = max-width 100 %
     */
    setFullWidth(fullWidth: boolean): void {
        this.options.fullWidth = fullWidth === true;
        this.el.classList.toggle('sheet--full-width', this.options.fullWidth);
        if (this.options.fullWidth) {
            this.el.setAttribute('full-width', '');
        } else {
            this.el.removeAttribute('full-width');
        }
    }

    /**
     * Applique `sheet--full-width` depuis l'option ou le markup (classe / attribut).
     */
    private _applyFullWidth(): void {
        if (!this.options.fullWidth) {
            const fromAttr =
                this.el.hasAttribute('full-width') &&
                this.el.getAttribute('full-width') !== 'false';
            if (fromAttr || this.el.classList.contains('sheet--full-width')) {
                this.options.fullWidth = true;
            }
        }
        this.setFullWidth(this.options.fullWidth === true);
    }

    /**
     * Configure l'accessibilité selon MD3
     */
    private _setupAccessibility(): void {
        setAriaAttributes(this.el, {
            role: 'dialog',
            modal: SheetSpecs.accessibility.ariaModal,
            hidden: !this.isOpen,
        });

        const title = this.el.querySelector('.sheet-header h1, .sheet-header h2, .sheet-header h3, .sheet-header h4, .sheet-header h5, .sheet-header h6');
        if (title && !title.id) {
            title.id = `${this.id}-title`;
            setAriaAttributes(this.el, {
                labelledby: `${this.id}-title`
            });
        }

        const content = this.el.querySelector('.sheet-content');
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
     * Configure les gestionnaires d'événements selon MD3
     */
    private _setupEventHandlers(): void {
        if (this.options.dismissible) {
            this._keyboard = new Keyboard({
                target: document,
                enabled: true,
                onKeyDown: (event: KeyboardEvent, key: string) => {
                    if (key === 'Escape' && this.isOpen && this.options.dismissible) {
                        this.close();
                    }
                }
            });
        }

        this._mouse = new Mouse({
            target: this._overlay,
            enabled: true,
            onClick: () => {
                if (this.options.dismissible && this.isOpen) {
                    this.close();
                }
            }
        });

        this.registerEvent(this.el, 'click', this._handleSheetClick);
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

    }

    /**
     * Gère les clics dans le sheet
     */
    private _handleSheetClick = (e: MouseEvent): void => {
        const closeTrigger = (e.target as HTMLElement).closest('.sheet-close');
        if (closeTrigger) {
            e.preventDefault();
            this.close();
        }
    }

    /**
     * Configure le focus trap selon MD3
     */
    private _setupFocusTrap(): void {
        this._setupFocusTrapBase(SheetSpecs.accessibility.focusTrap);
    }

    /**
     * Supprime le focus trap
     */
    private _removeFocusTrap(): void {
        this._removeFocusTrapBase();
    }

    /**
     * Gère le focus trap avec Tab
     */
    private _handleFocusTrap = (e: KeyboardEvent): void => {
        if (e.key !== 'Tab') return;

        if (this._focusableElements.length === 0) {
            e.preventDefault();
            return;
        }

        if (e.shiftKey) {
            if (document.activeElement === this._firstFocusableElement) {
                e.preventDefault();
                this._lastFocusableElement?.focus();
            }
        } else {
            if (document.activeElement === this._lastFocusableElement) {
                e.preventDefault();
                this._firstFocusableElement?.focus();
            }
        }
    }

    private _createDragHandle(): void {
        const existing = this.el.querySelector('.sheet-drag-handle');
        if (existing) existing.remove();

        this._dragHandle = document.createElement('div');
        this._dragHandle.className = 'sheet-drag-handle';
        this._dragHandle.tabIndex = 0;

        if (this.options.position === 'bottom') {
            this.el.insertBefore(this._dragHandle, this.el.firstChild);
        } else {
            this.el.appendChild(this._dragHandle);
        }

        this._syncHandleAria();

        this._unbindDragPointer?.();
        this._unbindDragPointer = bindPointerDown(this._dragHandle, (e) => this._handleDragStart(e));

        this._handleKeyboard?.destroy();
        this._handleKeyboard = new Keyboard({
            target: this._dragHandle,
            enabled: true,
            onKeyDown: (event: KeyboardEvent, key: string) => {
                if (key === ' ' || key === 'Enter') {
                    event.preventDefault();
                    this._toggleDetentExtremes();
                    return;
                }
                this._handleDetentKey(event, key);
            }
        });
    }

    /**
     * Sens d'ancrage : un multiplicateur retourne geste, vitesse et flèches.
     */
    private _dirY(): 1 | -1 {
        return this.options.position === 'top' ? -1 : 1;
    }

    /** Hauteurs des trois détentes (peek / half / full). */
    private _detentHeights(): [number, number, number] {
        this._computeVerticalLimits();
        const peek = this._minHeight;
        const full = this._maxHeight;
        const half = Math.round(peek + (full - peek) * 0.5);
        return [peek, half, full];
    }

    private _syncHandleAria(): void {
        if (!this._dragHandle) return;
        const detents = this._detentHeights();
        const expanded = this._detentIndex >= detents.length - 1;
        setAriaAttributes(this._dragHandle, {
            role: 'button',
            expanded: expanded ? 'true' : 'false',
            label: expanded ? 'Replier la feuille' : 'Déployer la feuille',
        });
    }

    /** Clic / Entrée : bascule entre détente basse et haute. */
    private _toggleDetentExtremes(): void {
        const detents = this._detentHeights();
        const top = detents.length - 1;
        this._detentIndex = this._detentIndex >= top ? 0 : top;
        this._snapToHeight(detents[this._detentIndex], 0);
        this._syncHandleAria();
    }

    private _handleDetentKey(event: KeyboardEvent, key: string): void {
        const detents = this._detentHeights();
        const expandKey = this.options.position === 'top' ? 'ArrowDown' : 'ArrowUp';
        const collapseKey = this.options.position === 'top' ? 'ArrowUp' : 'ArrowDown';
        let next: number | null = null;

        if (key === expandKey) {
            next = Math.min(this._detentIndex + 1, detents.length - 1);
        } else if (key === collapseKey) {
            if (this._detentIndex === 0 && this.options.dismissible) {
                event.preventDefault();
                this.close();
                return;
            }
            next = Math.max(this._detentIndex - 1, 0);
        } else if (key === 'Home') {
            next = 0;
        } else if (key === 'End') {
            next = detents.length - 1;
        } else {
            return;
        }

        event.preventDefault();
        if (next !== null && next !== this._detentIndex) {
            this._detentIndex = next;
            this._snapToHeight(detents[next], 0);
            this._syncHandleAria();
        }
    }

    private _cycleDetent(): void {
        this._toggleDetentExtremes();
    }

    private _applySheetHeight(height: number): void {
        const h = Math.max(0, height);
        this.el.style.setProperty('height', `${h}px`, 'important');
        this.el.style.setProperty('max-height', `${h}px`, 'important');

        const container = this.el.querySelector('.sheet-container, .sheet-content') as HTMLElement | null;
        if (container) {
            container.style.height = `${h}px`;
            container.style.maxHeight = `${h}px`;
        }
    }

    /**
     * Snap animé vers une hauteur (ressort default / fast selon la vitesse).
     */
    private _snapToHeight(target: number, velocityPxPerSec: number): void {
        this._cancelSpring?.();
        this.el.style.transition = 'none';
        const from = this.el.offsetHeight || target;
        this._cancelSpring = animateSpring({
            from,
            to: target,
            velocity: velocityPxPerSec,
            spec: springSpecForVelocity(velocityPxPerSec),
            onUpdate: (value) => this._applySheetHeight(value),
            onComplete: () => {
                this._cancelSpring = null;
                this._syncHandleAria();
                const container = this.el.querySelector('.sheet-container, .sheet-content') as HTMLElement | null;
                if (container) container.style.overflowY = 'auto';
            },
        });
    }

    private _handleDragStart = (e: PointerLikeEvent): void => {
        if (!this._dragHandle) return;

        const target = e.target as HTMLElement;
        if (!target.closest('.sheet-drag-handle')) return;

        e.preventDefault();
        e.stopPropagation();

        this._cancelSpring?.();
        this._cancelSpring = null;

        this._isDragging = true;
        const { y: clientY } = getPointerCoords(e);
        this._startY = clientY;
        this._velocityTracker.reset();
        this._velocityTracker.add(clientY, e instanceof PointerEvent ? e.timeStamp : performance.now());

        const rect = this.el.getBoundingClientRect();
        this._startHeight = rect.height;

        if (!this.el.style.height || this.el.style.height === 'auto') {
            this.el.style.height = `${this._startHeight}px`;
        }

        this._computeVerticalLimits();
        if (this._maxHeight < this._startHeight) {
            this._maxHeight = this._startHeight;
        }

        this.el.style.transition = 'none';
        this.el.classList.add('sheet--dragging');

        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'grabbing';

        const pointerId = e instanceof PointerEvent ? e.pointerId : 0;
        this._dragSessionCleanup?.();
        this._dragSessionCleanup = startPointerDragSession({
            captureElement: this.el,
            pointerId,
            onMove: (ev) => this._handleDragMove(ev),
            onEnd: () => this._handleDragEnd(),
            preventDefaultOnMove: true,
        });
    };

    private _handleDragMove = (e: PointerLikeEvent): void => {
        if (!this._isDragging) return;

        const edge = this.options.position;
        if (edge !== 'bottom' && edge !== 'top') return;

        e.preventDefault();
        e.stopPropagation();

        const { y: clientY } = getPointerCoords(e);
        this._velocityTracker.add(
            clientY,
            e instanceof PointerEvent ? e.timeStamp : performance.now()
        );

        const dirY = this._dirY();
        const delta = (this._startY - clientY) * dirY;
        let newHeight = this._startHeight + delta;

        const min = this._minHeight;
        const max = this._maxHeight;
        if (newHeight < min) {
            newHeight = min - rubberBand(min - newHeight, max);
        } else if (newHeight > max) {
            newHeight = max + rubberBand(newHeight - max, max);
        }

        this._applySheetHeight(newHeight);

        const container = this.el.querySelector('.sheet-container, .sheet-content') as HTMLElement | null;
        if (container) container.style.overflowY = 'hidden';

        if (this.options.dismissible && newHeight < min) {
            const travel = Math.max(1, min);
            const dismissProgress = Math.min(1, Math.max(0, (min - newHeight) / travel));
            const base =
                this.options.opacity !== undefined
                    ? this.options.opacity
                    : (ThemeManager.isDark() ? 0.64 : (this.options.overlayOpacity ?? 0.32));
            this._overlay.style.opacity = String(base * (1 - dismissProgress));
        }
    };

    private _handleDragEnd = (): void => {
        if (!this._isDragging) return;
        this._isDragging = false;
        this.el.classList.remove('sheet--dragging');

        document.body.style.userSelect = '';
        document.body.style.cursor = '';

        this._dragSessionCleanup?.();
        this._dragSessionCleanup = null;

        const dirY = this._dirY();
        const rawV = this._velocityTracker.velocity;
        const closeVelocity = rawV * dirY;
        const heightVelocity = -rawV * dirY;
        const currentHeight = this.el.offsetHeight;
        const projected = projectFling(currentHeight, heightVelocity);
        const detents = this._detentHeights();
        const dismissLine = this._minHeight * DISMISS_RATIO;

        if (
            this.options.dismissible &&
            (closeVelocity > FLING_THRESHOLD || projected < dismissLine)
        ) {
            this.close();
            return;
        }

        const sample =
            Math.abs(heightVelocity) > FLING_THRESHOLD ? projected : currentHeight;
        this._detentIndex = nearestDetentIndex(sample, detents);
        this._snapToHeight(detents[this._detentIndex], heightVelocity);
        this._syncHandleAria();
    };

    private _computeVerticalLimits(): void {
        const insetTop = window.innerWidth >= 600 ? 72 : 56;
        this._minHeight = 120;
        this._maxHeight = Math.max(this._minHeight, window.innerHeight - insetTop);
    }

    private _teardownDrag(): void {
        this._cancelSpring?.();
        this._cancelSpring = null;
        this._handleKeyboard?.destroy();
        this._handleKeyboard = null;
        this._unbindDragPointer?.();
        this._unbindDragPointer = null;
        this._dragSessionCleanup?.();
        this._dragSessionCleanup = null;
        this._dragHandle = null;
    }

    /**
     * Anime l'entrée du sheet (translateY uniquement)
     */
    private _animateIn(): void {
        this._overlay.style.display = 'block';
        this.el.style.display = 'flex';

        const duration = this.options.inDuration;
        const position = this.options.position || 'bottom';

        this.el.style.removeProperty('left');
        this.el.style.removeProperty('width');
        this.el.style.removeProperty('opacity');

        if (position === 'bottom') {
            this.el.style.transform = 'translateY(100%)';
        } else {
            this.el.style.transform = 'translateY(-100%)';
        }

        const isDarkTheme = ThemeManager.isDark();
        const opacity = this.options.opacity !== undefined
            ? this.options.opacity
            : (isDarkTheme ? 0.64 : 0.32);

        this._overlay.style.background = `rgba(0, 0, 0, ${opacity})`;
        this._overlay.style.opacity = '0';
        this._overlay.style.transition = `opacity ${duration}ms var(--md-sys-motion-effects-default-easing, ease-out)`;

        this.el.style.transition = `
            transform ${duration}ms var(--md-sys-motion-spatial-default-easing, cubic-bezier(0.38, 1.21, 0.22, 1))
        `;

        requestAnimationFrame(() => {
            this._overlay.style.opacity = '1';
            this.el.style.transform = 'translateY(0)';
        });

        setTimeout(() => {
            if (typeof this.options.onOpenEnd === 'function') {
                this.options.onOpenEnd(this.el);
            }
        }, duration);
    }

    /**
     * Anime la sortie du sheet (translateY uniquement)
     */
    private _animateOut(): void {
        const duration = this.options.outDuration;
        const position = this.options.position || 'bottom';

        this._overlay.style.transition = `opacity ${duration}ms ease-in`;
        this.el.style.transition = `
            transform ${duration}ms cubic-bezier(0.4, 0.0, 1, 1)
        `;

        requestAnimationFrame(() => {
            this._overlay.style.opacity = '0';
            if (position === 'bottom') {
                this.el.style.transform = 'translateY(100%)';
            } else {
                this.el.style.transform = 'translateY(-100%)';
            }
        });

        setTimeout(() => {
            this.el.style.display = 'none';
            clearSheetVerticalInlineSize(this.el);
            if (this._overlay.parentNode) {
                this._overlay.remove();
            }
            this._restoreFromPortal();
            if (typeof this.options.onCloseEnd === 'function') {
                this.options.onCloseEnd(this.el);
            }
        }, duration);
    }

    private _preventScrolling(): void {
        this._preventScrollingBase('sheet-open');
    }

    private _restoreScrolling(): void {
        this._restoreScrollingBase('sheet-open');
    }

    private _portalToBody(): void {
        if (this.el.parentElement === document.body) return;
        this._portalParent = this.el.parentNode;
        this._portalNextSibling = this.el.nextSibling;
        document.body.appendChild(this.el);
    }

    private _restoreFromPortal(): void {
        if (!this._portalParent) return;
        if (this._portalNextSibling && this._portalNextSibling.parentNode === this._portalParent) {
            this._portalParent.insertBefore(this.el, this._portalNextSibling);
        } else {
            this._portalParent.appendChild(this.el);
        }
        this._portalParent = null;
        this._portalNextSibling = null;
    }

    /**
     * Ouvre le sheet selon MD3
     * @param trigger - Élément déclencheur (optionnel)
     * @returns Instance du sheet
     */
    open(trigger?: HTMLElement): Sheet {
        if (this.isOpen) return this;

        this.isOpen = true;
        Sheet._sheetsOpen++;
        this._nthSheetOpened = Sheet._sheetsOpen;

        this._previousActiveElement = document.activeElement as HTMLElement;

        this._portalToBody();

        this._overlay.style.zIndex = (SHEET_Z_INDEX_BASE + Sheet._sheetsOpen * 2).toString();
        this.el.style.zIndex = (SHEET_Z_INDEX_BASE + Sheet._sheetsOpen * 2 + 1).toString();

        this._openingTrigger = trigger || undefined;

        if (typeof this.options.onOpenStart === 'function') {
            this.options.onOpenStart(this.el);
        }

        this._preventScrolling();

        document.body.appendChild(this._overlay);

        setAriaAttributes(this.el, {
            hidden: 'false'
        });

        this._setupFocusTrap();

        this.el.classList.add('is-open');

        this._animateIn();

        setTimeout(() => {
            const focusOpts: FocusOptions = { preventScroll: true };
            if (this._dragHandle) {
                this._dragHandle.focus(focusOpts);
            } else if (this._firstFocusableElement) {
                this._firstFocusableElement.focus(focusOpts);
            } else {
                this.el.focus(focusOpts);
            }
        }, 50);

        setTimeout(() => {
            IconManager.forceDisplayIcons();
        }, 100);

        return this;
    }

    /**
     * Ferme le sheet selon MD3
     * @returns Instance du sheet
     */
    close(): Sheet {
        if (!this.isOpen) return this;

        this.isOpen = false;
        this.el.classList.remove('is-open');
        Sheet._sheetsOpen--;
        this._nthSheetOpened = 0;

        if (typeof this.options.onCloseStart === 'function') {
            this.options.onCloseStart(this.el);
        }

        setAriaAttributes(this.el, {
            hidden: 'true'
        });

        this._removeFocusTrap();

        if (Sheet._sheetsOpen === 0) {
            this._restoreScrolling();
        }

        const restoreTarget =
            this._openingTrigger || this._previousActiveElement;
        this._previousActiveElement = null;
        if (restoreTarget && typeof restoreTarget.focus === 'function') {
            restoreTarget.focus({ preventScroll: true });
        }

        this._animateOut();

        return this;
    }
}

/**
 * Custom Element <k3ui-sheet>
 * @description Permet l'utilisation de <k3ui-sheet> dans le HTML. Initialisation par AutoInit.
 */
class K3UISheetElement extends HTMLElement {
    connectedCallback() {
        if (!this.classList.contains('sheet')) {
            this.classList.add('sheet');
        }
        if (!this.hasAttribute('data-initialized')) {
            this.setAttribute('data-initialized', 'true');
        }
    }

    disconnectedCallback() {
        const instance = Sheet.getInstance(this);
        if (instance) {
            instance.destroy();
        }
    }

    private initSheet() {
        if (Sheet.getInstance(this)) return;

        if (!this.classList.contains('sheet')) {
            this.classList.add('sheet');
        }

        const globalOptions = getK3uiComponentWindowOptions('Sheet') as Partial<SheetOptions>;
        const options: Partial<SheetOptions> = { ...globalOptions };

        if (this.hasAttribute('position')) {
            const position = this.getAttribute('position');
            if (position === 'top' || position === 'bottom') {
                options.position = position;
            }
        }

        if (this.hasAttribute('size')) {
            const size = this.getAttribute('size');
            if (isSheetSize(size)) {
                options.size = size;
            }
        }

        if (this.hasAttribute('opacity')) {
            options.opacity = parseFloat(this.getAttribute('opacity') || '0.32');
        }

        if (this.hasAttribute('in-duration')) {
            options.inDuration = parseInt(this.getAttribute('in-duration') || '300', 10);
        }

        if (this.hasAttribute('out-duration')) {
            options.outDuration = parseInt(this.getAttribute('out-duration') || '250', 10);
        }

        if (this.hasAttribute('dismissible')) {
            options.dismissible = this.getAttribute('dismissible') === 'true';
        }

        if (this.hasAttribute('prevent-scrolling')) {
            options.preventScrolling = this.getAttribute('prevent-scrolling') === 'true';
        }

        if (this.hasAttribute('full-width')) {
            options.fullWidth = this.getAttribute('full-width') !== 'false';
        }

        new Sheet(this, options);
    }

    static get observedAttributes() {
        return [
            'position', 'size', 'opacity', 'in-duration', 'out-duration',
            'dismissible', 'prevent-scrolling', 'full-width'
        ];
    }

    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
        const instance = Sheet.getInstance(this);
        if (instance && oldValue !== newValue) {
            instance.destroy();
            this.initSheet();
        }
    }

    /** Ouvre le sheet */
    public open(): void {
        if (!Sheet.getInstance(this)) {
            this.initSheet();
        }
        const instance = Sheet.getInstance(this);
        if (instance) {
            instance.open();
        }
    }

    /** Ferme le sheet */
    public close(): void {
        const instance = Sheet.getInstance(this);
        if (instance) {
            instance.close();
        }
    }

    /** Obtient l'instance du Sheet */
    public getInstance(): Sheet | null {
        return Sheet.getInstance(this) ?? null;
    }
}

if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-sheet')) {
    customElements.define('k3ui-sheet', K3UISheetElement);
}
