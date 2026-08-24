/**
 * @fileoverview Module de gestion clavier pour K3UI
 * @description Gestionnaire d'événements clavier unifié pour les composants
 * @author K3UI Team
 * @version 1.0.0
 */

import { KeyboardOptions, KeyboardCallbacks, KEY_MAP } from '../../types/base/dom';

// ============================================================================
// INTERFACES INTERNES
// ============================================================================

interface ActiveKey {
    key: string;
    code: string;
    timestamp: number;
    holdTimer?: number;
    repeatTimer?: number;
    duration: number;
}

interface KeyRegister {
    callback: (event: KeyboardEvent, key: string) => void;
    key: string;
    active: boolean;
    id: string;
    uuid?: string;
}

// ============================================================================
// CLASSE KEYBOARD
// ============================================================================

/**
 * Gestionnaire d'événements clavier unifié
 */
export class Keyboard {
    private _target: HTMLElement | Document;
    private _enabled: boolean;
    private _capture: boolean;
    private _holdDelay: number;
    private _repeatInterval: number;
    private _ignoreSystemKeys: boolean;

    private _activeKeys: Map<string, ActiveKey> = new Map();
    private _keyRegisters: Map<string, KeyRegister> = new Map();
    private _callbacks: KeyboardCallbacks;
    private _boundHandleKeyDown: (event: KeyboardEvent) => void;
    private _boundHandleKeyUp: (event: KeyboardEvent) => void;
    private _boundHandleFocus: (event: FocusEvent) => void;
    private _boundHandleBlur: (event: FocusEvent) => void;

    /** Indique si la touche Tab est pressée */
    private static _tabPressed = false;
    /** Indique s'il y a une touche pressée */
    private static _keyDown = false;

    constructor(options: KeyboardOptions & KeyboardCallbacks = {}) {
        this._target = options.target || document;
        this._enabled = options.enabled ?? true;
        this._capture = options.capture ?? false;
        this._holdDelay = options.holdDelay ?? 500;
        this._repeatInterval = options.repeatInterval ?? 100;
        this._ignoreSystemKeys = options.ignoreSystemKeys ?? true;

        this._callbacks = {
            onKeyDown: options.onKeyDown || null,
            onKeyUp: options.onKeyUp || null,
            onKeyHold: options.onKeyHold || null
        };
        this._boundHandleKeyDown = this.handleKeyDown.bind(this);
        this._boundHandleKeyUp = this.handleKeyUp.bind(this);
        this._boundHandleFocus = this.handleFocus.bind(this);
        this._boundHandleBlur = this.handleBlur.bind(this);

        if (this._enabled) {
            this.attachEvents();
        }
    }

    /**
     * Attache les événements clavier
     */
    private attachEvents(): void {
        this._target.addEventListener('keydown', this._boundHandleKeyDown as EventListener, this._capture);
        this._target.addEventListener('keyup', this._boundHandleKeyUp as EventListener, this._capture);
        this._target.addEventListener('focus', this._boundHandleFocus as EventListener, this._capture);
        this._target.addEventListener('blur', this._boundHandleBlur as EventListener, this._capture);
    }

    /**
     * Détache les événements clavier
     */
    private detachEvents(): void {
        this._target.removeEventListener('keydown', this._boundHandleKeyDown as EventListener, this._capture);
        this._target.removeEventListener('keyup', this._boundHandleKeyUp as EventListener, this._capture);
        this._target.removeEventListener('focus', this._boundHandleFocus as EventListener, this._capture);
        this._target.removeEventListener('blur', this._boundHandleBlur as EventListener, this._capture);
    }

    /**
     * Gère l'événement keydown
     */
    private handleKeyDown(event: KeyboardEvent): void {
        Keyboard._keyDown = true;

        // Vérifier les touches de navigation
        const tabKeys = [...KEY_MAP.TAB, ...KEY_MAP.ARROW_DOWN, ...KEY_MAP.ARROW_UP];
        if ((tabKeys as readonly string[]).includes(event.key)) {
            Keyboard._tabPressed = true;
        }

        // Ignorer les touches système si configuré
        if (this._ignoreSystemKeys && this.isSystemKey(event.key)) {
            return;
        }

        const key = event.key;
        const code = event.code;
        const timestamp = Date.now();

        // Si la touche n'est pas déjà active
        if (!this._activeKeys.has(key)) {
            const activeKey: ActiveKey = {
                key,
                code,
                timestamp,
                duration: 0
            };

            // Démarrer le timer de maintien
            activeKey.holdTimer = setTimeout(() => {
                this._callbacks.onKeyHold?.(event, key, code, this._holdDelay);

                // Démarrer la répétition
                activeKey.repeatTimer = setInterval(() => {
                    this._callbacks.onKeyHold?.(event, key, code, this._holdDelay + this._repeatInterval);
                }, this._repeatInterval);
            }, this._holdDelay);

            this._activeKeys.set(key, activeKey);
        }

        // Mettre à jour la durée
        const activeKey = this._activeKeys.get(key)!;
        activeKey.duration = timestamp - activeKey.timestamp;

        // Appeler le callback
        this._callbacks.onKeyDown?.(event, key, code);

        // Déclencher les callbacks enregistrés
        this._keyRegisters.forEach(register => {
            if (register.active && register.key === key) {
                register.callback(event, key);
            }
        });
    }

    /**
     * Gère l'événement keyup
     */
    private handleKeyUp(event: KeyboardEvent): void {
        Keyboard._keyDown = false;

        const tabKeys = [...KEY_MAP.TAB, ...KEY_MAP.ARROW_DOWN, ...KEY_MAP.ARROW_UP];
        if ((tabKeys as readonly string[]).includes(event.key)) {
            Keyboard._tabPressed = false;
        }

        const key = event.key;
        const activeKey = this._activeKeys.get(key);

        if (activeKey) {
            // Nettoyer les timers
            if (activeKey.holdTimer) {
                clearTimeout(activeKey.holdTimer);
            }
            if (activeKey.repeatTimer) {
                clearInterval(activeKey.repeatTimer);
            }

            this._activeKeys.delete(key);
            this._callbacks.onKeyUp?.(event, key, event.code);
        }
    }

    /**
     * Gère l'événement focus
     */
    private handleFocus(event: FocusEvent): void {
        if (Keyboard._keyDown) {
            document.body.classList.add('keyboard-focused');
        }
    }

    /**
     * Gère l'événement blur
     */
    private handleBlur(event: FocusEvent): void {
        document.body.classList.remove('keyboard-focused');
    }

    /**
     * Vérifie si une touche est système
     */
    private isSystemKey(key: string): boolean {
        const systemKeys = ['Control', 'Alt', 'Shift', 'Meta', 'Enter', 'Escape', 'Delete', 'Backspace', 'Tab', ' '];
        return systemKeys.includes(key);
    }

    /**
     * Enregistre un callback pour une touche spécifique
     */
    onKey(key: string, callback: (event: KeyboardEvent, key: string) => void, id: string = ''): string {
        const registerId = id || `key_${key}_${Date.now()}`;
        this._keyRegisters.set(registerId, {
            callback,
            key,
            active: true,
            id: registerId
        });
        return registerId;
    }

    /**
     * Désactive un enregistrement de touche
     */
    offKey(id: string): void {
        const register = this._keyRegisters.get(id);
        if (register) {
            register.active = false;
            this._keyRegisters.delete(id);
        }
    }

    /**
     * Active/désactive le gestionnaire
     */
    setEnabled(enabled: boolean): void {
        if (this._enabled !== enabled) {
            this._enabled = enabled;
            if (enabled) {
                this.attachEvents();
            } else {
                this.detachEvents();
                this._activeKeys.clear();
            }
        }
    }

    /**
     * Met à jour les options
     */
    updateOptions(options: Partial<KeyboardOptions & KeyboardCallbacks>): void {
        if (options.target !== undefined) {
            this._target = options.target;
        }
        if (options.enabled !== undefined) {
            this.setEnabled(options.enabled);
        }
        if (options.capture !== undefined) {
            this._capture = options.capture;
        }
        if (options.holdDelay !== undefined) {
            this._holdDelay = options.holdDelay;
        }
        if (options.repeatInterval !== undefined) {
            this._repeatInterval = options.repeatInterval;
        }
        if (options.ignoreSystemKeys !== undefined) {
            this._ignoreSystemKeys = options.ignoreSystemKeys;
        }

        // Mettre à jour les callbacks
        Object.assign(this._callbacks, options);
    }

    /**
     * Nettoie les ressources
     */
    destroy(): void {
        this.detachEvents();
        this._activeKeys.clear();
        this._keyRegisters.clear();
    }

    // ============================================================================
    // MÉTHODES STATIQUES (compatibilité avec utils.ts)
    // ============================================================================

    /**
     * Détecte quand une touche est pressée (méthode statique)
     */
    static handleKeyDown(event: KeyboardEvent): void {
        Keyboard._keyDown = true;
        const tabKeys = [...KEY_MAP.TAB, ...KEY_MAP.ARROW_DOWN, ...KEY_MAP.ARROW_UP];
        if ((tabKeys as readonly string[]).includes(event.key)) {
            Keyboard._tabPressed = true;
        }
    }

    /**
     * Détecte quand une touche est relâchée (méthode statique)
     */
    static handleKeyUp(event: KeyboardEvent): void {
        Keyboard._keyDown = false;
        const tabKeys = [...KEY_MAP.TAB, ...KEY_MAP.ARROW_DOWN, ...KEY_MAP.ARROW_UP];
        if ((tabKeys as readonly string[]).includes(event.key)) {
            Keyboard._tabPressed = false;
        }
    }

    /**
     * Détecte quand le document est focalisé (méthode statique)
     */
    static handleFocus(event: FocusEvent): void {
        if (Keyboard._keyDown) {
            document.body.classList.add('keyboard-focused');
        }
    }

    /**
     * Détecte quand le document perd le focus (méthode statique)
     */
    static handleBlur(event: FocusEvent): void {
        document.body.classList.remove('keyboard-focused');
    }

    /**
     * Indique si la touche Tab est pressée
     */
    static get isTabPressed(): boolean {
        return Keyboard._tabPressed;
    }

    /**
     * Indique s'il y a une touche pressée
     */
    static get isKeyDown(): boolean {
        return Keyboard._keyDown;
    }
}

// ============================================================================
// INSTANCE GLOBALE
// ============================================================================

/**
 * Instance globale du gestionnaire clavier
 */
export const keyboard = new Keyboard();

/**
 * Fonctions utilitaires pour compatibilité avec utils.ts
 */
export const keyboardUtils = {
    handleKeyDown: Keyboard.handleKeyDown,
    handleKeyUp: Keyboard.handleKeyUp,
    handleFocus: Keyboard.handleFocus,
    handleBlur: Keyboard.handleBlur,
    isTabPressed: () => Keyboard.isTabPressed,
    isKeyDown: () => Keyboard.isKeyDown
};
