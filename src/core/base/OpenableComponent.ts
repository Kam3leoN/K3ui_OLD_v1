import { Component } from './Component';
import { BaseOptions } from '../../types/base';
import type { DOMEventCallback } from '../../types/base/dom';

// Selecteurs communs pour calculer les éléments focusables (MD3 focus trap)
const FOCUSABLE_SELECTORS = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(', ');

/** Champs focus-trap partagés par Dialog, Sheet, etc. (déclarés private dans les sous-classes) */
interface OpenableFocusTrapHost {
    _focusableElements?: HTMLElement[];
    _firstFocusableElement?: HTMLElement | null;
    _lastFocusableElement?: HTMLElement | null;
}

/** Options avec blocage du scroll body (Dialog, Sheet, Drawer, …) */
type OpenableScrollOptions = BaseOptions & { preventScrolling?: boolean };

/**
 * Base utilitaire pour les composants ouvrables.
 * * Contient la logique partagée focus-trap et prévention du scroll body.
 * * Les composants conservent leurs `open()` / `close()` et leur logique d'animation.
 */
export abstract class OpenableComponent<O extends BaseOptions> extends Component<O> {
    private get focusTrapHost(): OpenableFocusTrapHost {
        return this as unknown as OpenableFocusTrapHost;
    }

    private get scrollOptions(): OpenableScrollOptions {
        return this.options as OpenableScrollOptions;
    }

    /**
     * Handler unique pour la gestion du focus trap.
     * Enregistré via registerEvent pour un cleanup cohérent.
     */
    private _openableHandleFocusTrap = (e: KeyboardEvent): void => {
        if (e.key !== 'Tab') return;

        const host = this.focusTrapHost;
        const focusableElements = host._focusableElements ?? [];
        const firstFocusableElement = host._firstFocusableElement ?? null;
        const lastFocusableElement = host._lastFocusableElement ?? null;

        if (focusableElements.length === 0) {
            e.preventDefault();
            return;
        }

        if (e.shiftKey) {
            if (document.activeElement === firstFocusableElement) {
                e.preventDefault();
                lastFocusableElement?.focus();
            }
        } else {
            if (document.activeElement === lastFocusableElement) {
                e.preventDefault();
                firstFocusableElement?.focus();
            }
        }
    };

    private _focusTrapCleanup: (() => void) | null = null;

    protected _setupFocusTrapBase(enabled: boolean): void {
        if (!enabled) return;

        this._removeFocusTrapBase();

        const focusableElements = Array.from(this.el.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS));
        const host = this.focusTrapHost;

        host._focusableElements = focusableElements;
        host._firstFocusableElement = focusableElements[0] ?? null;
        host._lastFocusableElement =
            focusableElements.length > 0 ? focusableElements[focusableElements.length - 1] : null;

        this._focusTrapCleanup = this.registerEvent(
            this.el,
            'keydown',
            this._openableHandleFocusTrap as unknown as DOMEventCallback
        );
    }

    protected _removeFocusTrapBase(): void {
        if (this._focusTrapCleanup) {
            this._focusTrapCleanup();
            this._focusTrapCleanup = null;
        }

        const host = this.focusTrapHost;
        host._focusableElements = [];
        host._firstFocusableElement = null;
        host._lastFocusableElement = null;
    }

    protected _preventScrollingBase(bodyOpenClass: string): void {
        if (!this.scrollOptions.preventScrolling) return;

        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';

        /* Compensation pour le body + chrome fixed (FAB, TOC, scroll-to-top).
         * Le CSS applique --k3ui-scrollbar-compensation via margin-right (hors transition left/right). */
        document.documentElement.style.setProperty(
            '--k3ui-scrollbar-compensation',
            `${Math.max(0, scrollbarWidth)}px`
        );

        if (scrollbarWidth > 0) {
            document.body.style.paddingRight = `${scrollbarWidth}px`;
        }

        document.body.classList.add(bodyOpenClass);
    }

    protected _restoreScrollingBase(bodyOpenClass: string): void {
        if (!this.scrollOptions.preventScrolling) return;

        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        document.documentElement.style.setProperty('--k3ui-scrollbar-compensation', '0px');
        document.body.classList.remove(bodyOpenClass);
    }
}
