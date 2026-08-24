/**
 * @fileoverview Composant Snackbar - Material You 3 Expressive
 * @author Kam3leon
 * @version 2.0.0
 */

import { Component, Openable } from '../core/base/Component';
import { toComponentClassDef } from '../types/components/component-base';
import { SnackbarOptions } from '../types/components';
import { PriorityLevel } from '../types/base';
import { LoggerManager, LocaleManager, IconManager } from '../core/managers';
import { HapticManager } from '../core/managers/HapticManager';
import { ManagerFactory } from '../core/factories';
import { getSnackbarDefaults, SnackbarSpecs } from '../specs/components/snackbar.specs';
import { MotionPresets } from '../specs/common/motion-presets.specs';
import {
    buildSpatialEffectsTransition,
    shouldSkipMotion,
} from '../utils/motion/buildMotionTransition';
import { readMotionSpring } from '../utils/motion/motionSpring';
import { setAriaAttributes } from '../utils/dom/aria';
import { escapeHtml } from '../utils/dom/sanitize';

const PORTAL_ID = 'k3ui-snackbar-portal';
const STACK_SPACING_PX = SnackbarSpecs.behaviors.spacing;

/**
 * Snackbar Component — usage DOM (AutoInit) ou programmatique (`Snackbar.show`).
 */
export class Snackbar extends Component<SnackbarOptions> implements Openable {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    private static _instances: Map<HTMLElement, Snackbar> = new Map();
    private static _pending: Snackbar[] = [];
    private static _visible: Snackbar[] = [];

    private _timeoutId: number | null = null;
    private logger: LoggerManager;
    private _isProgrammatic: boolean = false;

    isOpen: boolean = false;

    constructor(el: HTMLElement | null, options: Partial<SnackbarOptions>) {
        const element = el || document.createElement('div');
        const isProgrammatic = !el;

        if (!el) {
            Snackbar._getPortal().appendChild(element);
        }

        super(element, options, toComponentClassDef(Snackbar));

        this._isProgrammatic = isProgrammatic;
        this.logger = ManagerFactory.getLoggerManager('[Snackbar]');

        this.options = {
            ...Snackbar.defaults,
            ...options,
        } as SnackbarOptions;

        if (!this._isProgrammatic) {
            Snackbar._instances.set(this.el, this);
        }

        this._setupSnackbar();
        this._setupEventListeners();
        this.logger.success('Snackbar initialized successfully');
    }

    static get defaults(): SnackbarOptions {
        return getSnackbarDefaults();
    }

    static init<I extends HTMLElement | Element>(
        els: I | NodeListOf<I> | HTMLCollectionOf<I>,
        options: Partial<SnackbarOptions> = {}
    ): Snackbar[] {
        return Component.init(els, options, toComponentClassDef(Snackbar)) as Snackbar[];
    }

    /**
     * Obtient l'instance Snackbar pour un élément (sans création implicite).
     */
    static getInstance(el: HTMLElement): Snackbar | undefined {
        return Snackbar._instances.get(el);
    }

    /**
     * Affiche un snackbar programmatiquement (file d'attente + empilement max 3).
     */
    static show(options: Partial<SnackbarOptions> & { text: string }): void {
        const snackbar = new Snackbar(null, {
            showImmediately: true,
            ...options,
        } as SnackbarOptions);
        Snackbar._enqueue(snackbar);
        LoggerManager.create('[Snackbar]').info(`Snackbar.show() called: "${options.text}"`);
    }

    /**
     * Vide la file et ferme les snackbars visibles.
     */
    static clear(): void {
        Snackbar._pending = [];
        [...Snackbar._visible].forEach((instance) => instance.close());
        LoggerManager.create('[Snackbar]').info('Snackbar queue cleared');
    }

    /**
     * Informations sur la file d'attente.
     */
    static getQueueInfo(): { length: number; isShowing: boolean; visible: number } {
        return {
            length: Snackbar._pending.length,
            isShowing: Snackbar._visible.length > 0,
            visible: Snackbar._visible.length,
        };
    }

  /**
   * Conteneur portal pour l'empilement des snackbars.
   */
    private static _getPortal(): HTMLElement {
        let portal = document.getElementById(PORTAL_ID);
        if (!portal) {
            portal = document.createElement('div');
            portal.id = PORTAL_ID;
            portal.className = 'k3ui-snackbar-portal';
            setAriaAttributes(portal, { live: 'polite' });
            portal.setAttribute('role', 'region');
            document.body.appendChild(portal);
        }
        return portal;
    }

    private static _maxVisible(options?: Partial<SnackbarOptions>): number {
        return options?.maxSnackbars ?? SnackbarSpecs.behaviors.maxSnackbars;
    }

    private static _enqueue(snackbar: Snackbar): void {
        const max = Snackbar._maxVisible(snackbar.options);
        if (Snackbar._visible.length < max) {
            snackbar.open();
            return;
        }
        Snackbar._pending.push(snackbar);
    }

    private static _dequeueNext(): void {
        if (Snackbar._pending.length === 0) {
            return;
        }
        const next = Snackbar._pending.shift();
        if (next) {
            next.open();
        }
    }

    private static _registerVisible(snackbar: Snackbar): void {
        if (!Snackbar._visible.includes(snackbar)) {
            Snackbar._visible.push(snackbar);
        }
        Snackbar._updateStackLayout();
    }

    private static _unregisterVisible(snackbar: Snackbar): void {
        Snackbar._visible = Snackbar._visible.filter((s) => s !== snackbar);
        Snackbar._updateStackLayout();
    }

    private static _updateStackLayout(): void {
        const baseOffset = SnackbarSpecs.positions.offsets.bottom;
        let offset = baseOffset;

        [...Snackbar._visible].reverse().forEach((instance) => {
            const position = instance.options.position ?? SnackbarSpecs.positions.default;
            const isTop = position.startsWith('top');
            if (isTop) {
                instance.el.style.top = `${offset}px`;
                instance.el.style.bottom = 'auto';
            } else {
                instance.el.style.bottom = `${offset}px`;
                instance.el.style.top = 'auto';
            }

            if (position.includes('center')) {
                instance.el.style.left = '50%';
                instance.el.style.right = 'auto';
                if (instance.isOpen && !instance.el.classList.contains('leaving')) {
                    instance.el.style.transform = instance._getRestTransform();
                }
            }

            offset += instance.el.offsetHeight + STACK_SPACING_PX;
        });
    }

    private _setupSnackbar(): void {
        const { text, isLongAction, type = 'default', classes } = this.options;
        const isTwoLines = this._shouldUseTwoLines(text, this.options.maxCharsPerLine);

        this.el.classList.add('snackbar');
        this.el.classList.add(isTwoLines ? 'double-line' : 'single-line');

        if (isLongAction) {
            this.el.classList.add('has-long-action');
        }

        if (type !== 'default') {
            this.el.classList.add(`snackbar--color-${type}`);
        }

        if (classes) {
            classes.split(/\s+/).filter(Boolean).forEach((c) => this.el.classList.add(c));
        }

        this._applyPositionClasses();
        this._buildDOM();
        IconManager.processIconsInContainer(this.el);
        setAriaAttributes(this.el, { role: 'alert' });
    }

    private _applyPositionClasses(): void {
        const position = this.options.position ?? SnackbarSpecs.positions.default;
        const [vertical, horizontal] = position.split('-') as ['bottom' | 'top', string];

        this.el.classList.add(vertical === 'top' ? 'snackbar--position-top' : 'snackbar--position-bottom');

        if (horizontal === 'center') {
            this.el.classList.add('snackbar--position-center');
            this.el.style.left = '50%';
            this.el.style.right = 'auto';
            this.el.style.transform = 'translateX(-50%)';
        } else if (horizontal === 'left') {
            this.el.style.left = `${SnackbarSpecs.positions.offsets.left}px`;
            this.el.style.right = 'auto';
        } else if (horizontal === 'right') {
            this.el.style.right = `${SnackbarSpecs.positions.offsets.right}px`;
            this.el.style.left = 'auto';
        }
    }

    private _shouldUseTwoLines(text: string, maxCharsPerLine?: number): boolean {
        const charLimit = maxCharsPerLine || 60;
        if (text.length > charLimit) return true;
        const wordCount = text.trim().split(/\s+/).length;
        if (wordCount > 10) return true;
        const words = text.trim().split(/\s+/);
        if (words.some((word) => word.length > 15) && text.length > 50) return true;
        return false;
    }

    private _buildDOM(): void {
        const { text, actionText, isLongAction, showClose } = this.options;
        const safeText = escapeHtml(text);
        const safeAction = actionText ? escapeHtml(actionText) : '';

        this.el.innerHTML = '';

        const content = document.createElement('div');
        content.className = 'snackbar__content';

        const textContainer = document.createElement('div');
        textContainer.className = 'snackbar__text-container';
        const textSpan = document.createElement('span');
        textSpan.className = 'snackbar__text';
        textSpan.textContent = text;
        textContainer.appendChild(textSpan);
        content.appendChild(textContainer);

        if (!isLongAction && (safeAction || showClose)) {
            const actions = document.createElement('div');
            actions.className = 'snackbar__actions';
            if (safeAction) {
                const actionBtn = document.createElement('button');
                actionBtn.className = 'snackbar__action';
                actionBtn.dataset.action = 'action';
                actionBtn.textContent = actionText!;
                actions.appendChild(actionBtn);
            }
            if (showClose) {
                const closeBtn = document.createElement('button');
                closeBtn.className = 'snackbar__close';
                closeBtn.dataset.action = 'close';
                closeBtn.setAttribute('aria-label', LocaleManager.t('snackbar.close'));
                closeBtn.innerHTML = '<i name="xmark" size="lg"></i>';
                actions.appendChild(closeBtn);
            }
            content.appendChild(actions);
        }

        this.el.appendChild(content);

        if (isLongAction) {
            const longSection = document.createElement('div');
            longSection.className = 'snackbar__long-action';
            const actions = document.createElement('div');
            actions.className = 'snackbar__actions';
            if (safeAction) {
                const actionBtn = document.createElement('button');
                actionBtn.className = 'snackbar__action';
                actionBtn.dataset.action = 'action';
                actionBtn.textContent = actionText!;
                actions.appendChild(actionBtn);
            }
            if (showClose) {
                const closeBtn = document.createElement('button');
                closeBtn.className = 'snackbar__close';
                closeBtn.dataset.action = 'close';
                closeBtn.setAttribute('aria-label', LocaleManager.t('snackbar.close'));
                closeBtn.innerHTML = '<i name="xmark" size="lg"></i>';
                actions.appendChild(closeBtn);
            }
            longSection.appendChild(actions);
            this.el.appendChild(longSection);
        }
    }

    private _setupEventListeners(): void {
        this.registerEvent(this.el, 'click', (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            const button = target.closest('[data-action]') as HTMLButtonElement | null;
            if (!button) return;

            const action = button.getAttribute('data-action');
            if (action === 'action') {
                this.options.onAction?.();
                this.options.actionCallback?.();
                this.close();
            } else if (action === 'close') {
                this.close();
            }
        });

        this.registerEvent(document, 'keydown', (event: KeyboardEvent) => {
            if (event.key === 'Escape' && this.options.showClose && this.isOpen) {
                this.close();
            }
        });
    }

    private _getAnimDurationMs(direction: 'in' | 'out'): number {
        if (shouldSkipMotion()) {
            return 0;
        }
        const preset = direction === 'in' ? MotionPresets.snackbarEnter : MotionPresets.snackbarExit;
        const spatial = readMotionSpring('spatial', preset.spatialSpeed, this.el);
        const effects = readMotionSpring('effects', preset.effectsSpeed, this.el);
        return Math.max(spatial.durationMs, effects.durationMs);
    }

    private _triggerShowHaptic(): void {
        const type = this.options.type ?? 'default';
        if (type === 'success') {
            HapticManager.triggerFromOptions(this.options, 'success');
        } else if (type === 'error') {
            HapticManager.triggerFromOptions(this.options, 'error');
        } else {
            HapticManager.triggerFromOptions(this.options, 'light');
        }
    }

    private _animateIn(): void {
        const durationMs = this._getAnimDurationMs('in');
        if (durationMs === 0) {
            this.el.style.opacity = '1';
            this.el.style.transform = this._getRestTransform();
            return;
        }

        const preset = MotionPresets.snackbarEnter;
        const transition = buildSpatialEffectsTransition(
            preset.spatialSpeed,
            preset.effectsSpeed,
            undefined,
            this.el
        );

        const position = this.options.position ?? SnackbarSpecs.positions.default;
        const isTop = position.startsWith('top');
        const slideFrom = isTop ? 'translateY(-100%)' : 'translateY(100%)';
        const baseTransform = this._getBaseTransform();

        this.el.style.transition = 'none';
        this.el.style.opacity = '0';
        this.el.style.transform = `${baseTransform} ${slideFrom}`.trim();
        void this.el.offsetWidth;

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                this.el.style.transition = transition;
                this.el.style.opacity = '1';
                this.el.style.transform = this._getRestTransform();
            });
        });
    }

    private _animateOut(onComplete: () => void): void {
        const durationMs = this._getAnimDurationMs('out');
        if (durationMs === 0) {
            onComplete();
            return;
        }

        const preset = MotionPresets.snackbarExit;
        const transition = buildSpatialEffectsTransition(
            preset.spatialSpeed,
            preset.effectsSpeed,
            undefined,
            this.el
        );

        const position = this.options.position ?? SnackbarSpecs.positions.default;
        const isTop = position.startsWith('top');
        const slideTo = isTop ? 'translateY(-100%)' : 'translateY(100%)';
        const baseTransform = this._getBaseTransform();

        this.el.style.transition = transition;
        this.el.style.opacity = '0';
        this.el.style.transform = `${baseTransform} ${slideTo}`.trim();

        window.setTimeout(onComplete, durationMs);
    }

    private _getBaseTransform(): string {
        const position = this.options.position ?? SnackbarSpecs.positions.default;
        return position.includes('center') ? 'translateX(-50%)' : '';
    }

    private _getRestTransform(): string {
        const base = this._getBaseTransform();
        return base ? `${base} translateY(0)`.trim() : 'translateY(0)';
    }

    open(): void {
        if (this.isOpen) return;

        const max = Snackbar._maxVisible(this.options);
        if (!Snackbar._visible.includes(this) && Snackbar._visible.length >= max) {
            Snackbar._pending.push(this);
            return;
        }

        const runOpen = (): void => {
            this.options.onOpenStart?.(this.el);

            this.isOpen = true;
            Snackbar._registerVisible(this);
            this.el.classList.add('show', 'entering');
            this._triggerShowHaptic();
            this._animateIn();

            const durationMs = this._getAnimDurationMs('in');
            window.setTimeout(() => {
                this.el.classList.remove('entering');
                this.options.onOpenEnd?.(this.el);
            }, durationMs);

            if (!this.options.persistent && this.options.duration && this.options.duration > 0) {
                this._timeoutId = window.setTimeout(() => this.close(), this.options.duration);
            }

            if (this.options.autoFocus) {
                this.el.setAttribute('tabindex', '-1');
                this.el.focus();
            }
        };

        if (this.options.showImmediately) {
            runOpen();
        } else {
            requestAnimationFrame(() => runOpen());
        }
    }

    close(): void {
        if (!this.isOpen) return;

        this.options.onCloseStart?.(this.el);
        this.isOpen = false;
        Snackbar._unregisterVisible(this);

        this.el.classList.add('leaving');
        this.el.classList.remove('show');

        if (this._timeoutId) {
            clearTimeout(this._timeoutId);
            this._timeoutId = null;
        }

        this._animateOut(() => {
            this.options.onCloseEnd?.(this.el);
            this.options.onClose?.();
            this.destroy();
            Snackbar._dequeueNext();
        });
    }

    updateText(newText: string): void {
        this.options.text = newText;
        const textElement = this.el.querySelector('.snackbar__text');
        if (textElement) {
            textElement.textContent = newText;
        }
        const isTwoLines = this._shouldUseTwoLines(newText, this.options.maxCharsPerLine);
        this.el.classList.toggle('single-line', !isTwoLines);
        this.el.classList.toggle('double-line', isTwoLines);
        Snackbar._updateStackLayout();
    }

    destroy(): void {
        if (this._timeoutId) {
            clearTimeout(this._timeoutId);
        }

        if (!this._isProgrammatic) {
            Snackbar._instances.delete(this.el);
        }

        Snackbar._unregisterVisible(this);
        Snackbar._pending = Snackbar._pending.filter((s) => s !== this);

        if (this.el.parentElement) {
            this.el.parentElement.removeChild(this.el);
        }

        this.logger.info('Snackbar destroyed');
        super.destroy();
    }
}

export default Snackbar;

if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-snackbar')) {
    customElements.define('k3ui-snackbar', class extends HTMLElement {
        connectedCallback(): void {
            if (!this.hasAttribute('data-initialized')) {
                this.setAttribute('data-initialized', 'true');
            }
        }

        disconnectedCallback(): void {
            const instance = Snackbar.getInstance(this);
            instance?.destroy();
        }
    });
}
