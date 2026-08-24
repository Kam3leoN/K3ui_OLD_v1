/**
 * @fileoverview Composant MessageBox pour K3UI
 * @description Boîte de dialogue type « The Legend of Zelda: A Link to the Past ».
 *
 * - Affiche le texte caractère par caractère (effet machine à écrire).
 * - Nombre de lignes visibles configurable (1 à 5), wrapping mot à mot.
 * - Texte long découpé en plusieurs « pages » ; flèche « page suivante » animée
 *   centrée sur la bande du bas du cadre.
 * - Système de choix : la dernière page peut proposer une liste d'options ; un
 *   curseur de sélection (carré) n'apparaît QUE sur l'option active. La promesse
 *   renvoie la valeur (ou l'index) choisi.
 * - Sons gérés via la Web Audio API : chaque son est décodé une fois en
 *   AudioBuffer, puis rejoué via un BufferSource neuf à chaque lettre.
 * - Positionnement à l'écran configurable (par défaut centré parfaitement,
 *   horizontalement et verticalement).
 *
 * IMPORTANT : les navigateurs exigent un geste utilisateur avant tout son.
 * `unlockAudio()` est appelé automatiquement au premier clic/touche.
 *
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { toComponentClassDef } from '../types/components/component-base';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { LoggerManager, SoundFXManager } from '../core/managers';
import { ManagerFactory } from '../core/factories';
import { setAriaAttribute, setAriaAttributes } from '../utils/dom/aria';
import type {
    MessageBoxOptions,
    MessageBoxChoice,
    MessageBoxOrientation,
    MessageBoxOverlay,
    MessageBoxPosition,
    MessageBoxShowOptions,
} from '../types/components';
import { getPreferReducedMotion } from '../utils/accessibility/reducedMotion';
import { getMessageBoxDefaults, MessageBoxSpecs } from '../specs/components/messagebox.specs';

const _defaults: MessageBoxOptions = getMessageBoxDefaults();

const MIN_LINES = MessageBoxSpecs.lines.min;
const MAX_LINES = MessageBoxSpecs.lines.max;

type Page = string[];

/**
 * Moteur audio Web Audio : décode chaque URL une fois et rejoue à la demande.
 * @description Méthode fiable pour des lectures très rapprochées (à chaque lettre).
 */
class MessageBoxSoundEngine {
    private ctx: AudioContext | null = null;
    private buffers: Record<string, AudioBuffer> = {};
    private urls: Record<string, string>;
    private loaded = false;

    /** Volume courant (0..1) */
    public volume: number;
    /** Sons actifs ou non */
    public enabled: boolean;

    constructor(urls: Record<string, string>, volume = 0.5, enabled = true) {
        this.urls = urls;
        this.volume = volume;
        this.enabled = enabled;
    }

    /** À appeler depuis un geste utilisateur (clic/clavier). */
    async unlock(): Promise<void> {
        if (!this.enabled) return;
        if (!this.ctx) {
            const AC =
                window.AudioContext ||
                (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (!AC) return;
            this.ctx = new AC();
        }
        if (this.ctx.state === 'suspended') await this.ctx.resume();
        if (!this.loaded) {
            await Promise.all(
                Object.keys(this.urls).map(async (key) => {
                    try {
                        const res = await fetch(this.urls[key]);
                        const arr = await res.arrayBuffer();
                        this.buffers[key] = await this.ctx!.decodeAudioData(arr);
                    } catch (e) {
                        console.warn('[MessageBox] Décodage audio impossible :', key, e);
                    }
                }),
            );
            this.loaded = true;
        }
    }

    play(key: string): void {
        if (!this.enabled || !this.ctx || !this.buffers[key]) return;
        const src = this.ctx.createBufferSource();
        src.buffer = this.buffers[key];
        const gain = this.ctx.createGain();
        gain.gain.value = this.volume;
        src.connect(gain).connect(this.ctx.destination);
        src.start(0);
    }

    /** Ferme le contexte audio et libère les buffers. */
    dispose(): void {
        if (this.ctx) {
            void this.ctx.close().catch(() => undefined);
            this.ctx = null;
        }
        this.buffers = {};
        this.loaded = false;
    }
}

/**
 * Composant MessageBox pour K3UI.
 */
export class MessageBox extends Component<MessageBoxOptions> {
    /** Niveau de priorité du composant */
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    private logger: LoggerManager;

    private textEl!: HTMLElement;
    private choicesEl!: HTMLElement;
    private continueEl!: HTMLElement;
    private overlayEl: HTMLElement | null = null;
    private sound!: MessageBoxSoundEngine;

    /** Emplacement DOM d'origine avant portail sur `document.body`. */
    private _portalParent: Node | null = null;
    private _portalNextSibling: ChildNode | null = null;

    /** Empilement z-index pour superposer plusieurs MessageBox (au-dessus d'elles-mêmes). */
    private static _openStack = 0;
    private _stackZ: number | null = null;

    private pages: Page[] = [];
    private pageIndex = 0;
    private timer: number | null = null;
    private letterCount = 0;

    /** Promesse de fin : renvoie la valeur du choix, ou null si pas de choix. */
    private resolveDone: ((value: string | null) => void) | null = null;

    private choices: MessageBoxChoice[] = [];
    private selectedIndex = 0;

    /** Disposition des choix en cours. */
    public choiceOrientation: MessageBoxOrientation = 'vertical';

    public typing = false;
    public waitingForNext = false;
    public choosing = false;

    /** Vrai si le dernier `show()` a été fermé via `dismiss()` (Échap) et non lu jusqu'au bout. */
    public dismissed = false;

    /** Multiplicateur de vitesse de frappe (>1 = plus rapide, ex. touche maintenue). */
    public speedMultiplier = 1;

    /** Anti double-déclenchement clic + swipe. */
    private suppressClickUntil = 0;

    /**
     * Fenêtre de garde (ms) appliquée à l'apparition des choix : un clic ou un
     * « Entrée » résiduel (notamment en mouvement réduit, où les choix
     * apparaissent instantanément) est ignoré pour éviter une confirmation
     * involontaire. La navigation aux flèches n'est pas affectée.
     */
    private static readonly CHOICE_GUARD_MS = 300;

    /** Touches : accélérer (maintenu), page suivante, masquer. */
    private static readonly ACCEL_KEYS = new Set([' ', 'b', 'B']);
    private static readonly NEXT_KEYS = new Set(['x', 'X', 'a', 'A', 'Enter']);

    /**
     * Options par défaut du composant.
     */
    static get defaults(): MessageBoxOptions {
        return { ..._defaults };
    }

    /**
     * Obtient l'instance MessageBox pour un élément donné.
     * @param el Élément HTML
     */
    static getInstance(el: HTMLElement): MessageBox | null {
        return Component.getInstance(el) as unknown as MessageBox | null;
    }

    /**
     * Initialise les composants MessageBox.
     * @param els Éléments HTML ou sélecteur CSS
     * @param options Options de configuration
     */
    static init(
        els: KElement | InitElements<KElement> | string,
        options: Partial<MessageBoxOptions> = {},
    ): MessageBox | MessageBox[] {
        return Component.init(els, options, toComponentClassDef(MessageBox)) as MessageBox | MessageBox[];
    }

    /**
     * Constructeur du composant.
     * @param el Élément HTML racine
     * @param options Options de configuration
     */
    constructor(el: HTMLElement, options: Partial<MessageBoxOptions> = {}) {
        const domOptions = MessageBox._readOptionsFromElement(el);
        super(el, { ...domOptions, ...options }, toComponentClassDef(MessageBox));

        this.logger = ManagerFactory.getLoggerManager('[MessageBox]');
        this.options = {
            ...MessageBox.defaults,
            ...domOptions,
            ...options,
        } as MessageBoxOptions;
    }

    /** @inheritdoc */
    onInit(): void {
        const o = this.options;

        o.maxLines = Math.max(MIN_LINES, Math.min(MAX_LINES, o.maxLines));
        this.choiceOrientation = o.choiceOrientation === 'horizontal' ? 'horizontal' : 'vertical';

        this.sound = new MessageBoxSoundEngine(
            {
                letter: this._resolveSoundUrl(o.letterSound),
                done: this._resolveSoundUrl(o.doneSound),
            },
            o.volume,
            o.soundEnabled,
        );

        this._render();
        this._applyScale();
        this.setPosition(o.position);
        this._syncSoundEnabled();
        this._syncReducedMotionClass();
        this._setupEventListeners();
        this._setupGlobalListeners();

        if (o.classes) {
            this.el.classList.add(...o.classes.split(' ').filter(Boolean));
        }

        // Affichage automatique si un message initial est fourni (ex. data-message).
        if (o.message) {
            void this.show(o.message, o.choices ?? []);
        }
    }

    // ============================================================================
    // RENDU & CONFIGURATION
    // ============================================================================

    private _render(): void {
        this.el.classList.add('messagebox');
        this.el.style.setProperty('--messagebox-lines', String(this.options.maxLines));
        this.el.innerHTML = `
            <div class="messagebox__inner">
                <p class="messagebox__text"></p>
                <ul class="messagebox__choices" hidden></ul>
            </div>
            <div class="messagebox__continue" hidden></div>
        `;

        this.textEl = this.el.querySelector('.messagebox__text') as HTMLElement;
        this.choicesEl = this.el.querySelector('.messagebox__choices') as HTMLElement;
        this.continueEl = this.el.querySelector('.messagebox__continue') as HTMLElement;

        this.el.tabIndex = 0;
        setAriaAttributes(this.el, { role: 'dialog', label: MessageBoxSpecs.accessibility.labels.dialog });
        setAriaAttribute(this.textEl, 'live', MessageBoxSpecs.accessibility.textLive);
        setAriaAttributes(this.choicesEl, { role: 'listbox' });
        setAriaAttributes(this.continueEl, { role: 'button', label: MessageBoxSpecs.accessibility.labels.continue });
    }

    private _applyScale(): void {
        this.el.style.setProperty('--messagebox-scale', String(this.options.scale));
    }

    /**
     * Indique si l'effet machine à écrire doit être désactivé (mouvement réduit).
     */
    private _shouldReduceMotion(): boolean {
        return this.options.autoDisableForReducedMotion && getPreferReducedMotion();
    }

    /** Synchronise la classe CSS pour les animations réduites. */
    private _syncReducedMotionClass(): void {
        this.el.classList.toggle('messagebox--reduced-motion', this._shouldReduceMotion());
    }

    /**
     * Synchronise l'état audio avec les options du composant et le SoundFXManager global.
     */
    private _syncSoundEnabled(): void {
        if (!this.sound) return;
        SoundFXManager.init();
        const global = SoundFXManager.getOptions();
        this.sound.enabled = this.options.soundEnabled && global.enabled;
        this.sound.volume = this.options.volume * global.volume;
    }

    /** Écoute les bascules globales mouvement réduit et mute audio. */
    private _setupGlobalListeners(): void {
        this.registerEvent(document, 'k3ui-motion-changed', (() => {
            this._syncReducedMotionClass();
            if (this.typing && this._shouldReduceMotion()) {
                this._finishPageInstantly();
            }
        }) as EventListener);

        this.registerEvent(document, 'soundfx-toggled', (() => {
            this._syncSoundEnabled();
        }) as EventListener);
    }

    // ============================================================================
    // OVERLAY (voile noir / flou derrière la boîte)
    // ============================================================================

    /**
     * Porte la boîte sur `document.body` pour qu'elle s'affiche au-dessus de
     * l'overlay (contextes `contain` / empilement locaux des pages docs).
     */
    private _portalToBody(): void {
        if (this.el.parentElement === document.body) return;
        this._portalParent = this.el.parentNode;
        this._portalNextSibling = this.el.nextSibling;
        document.body.appendChild(this.el);
    }

    /** Remet la boîte à son emplacement d'origine dans le DOM. */
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
     * Crée (si besoin) l'élément overlay sur `document.body` pour sortir des
     * contextes d'empilement locaux (comme Toast / Tooltip).
     */
    private _ensureOverlay(): HTMLElement {
        if (this.overlayEl) return this.overlayEl;
        const overlay = document.createElement('div');
        overlay.className = 'messagebox-overlay';
        setAriaAttribute(overlay, 'hidden', 'true');
        // Un clic sur le voile fait avancer la boîte (comportement modal fidèle à ALTTP).
        this.registerEvent(overlay, 'click', () => {
            if (Date.now() < this.suppressClickUntil) return;
            void this.sound.unlock();
            this.advance();
        });
        document.body.appendChild(overlay);
        this.overlayEl = overlay;
        return overlay;
    }

    /** Affiche l'overlay selon les options (`overlay`, `overlayOpacity`, `overlayBlur`). */
    private _showOverlay(): void {
        if (this.options.overlay === 'none') return;
        const overlay = this._ensureOverlay();
        const scrim = this.options.overlay === 'scrim' || this.options.overlay === 'both';
        const blur = this.options.overlay === 'blur' || this.options.overlay === 'both';
        overlay.style.setProperty('--messagebox-overlay-opacity', scrim ? String(this.options.overlayOpacity) : '0');
        overlay.style.setProperty('--messagebox-overlay-blur', `${blur ? this.options.overlayBlur : 0}px`);

        MessageBox._openStack += 1;
        const base = 10000;
        this._stackZ = base + MessageBox._openStack * 2;
        overlay.style.zIndex = String(this._stackZ);
        this.el.style.zIndex = String(this._stackZ + 1);

        // Ordre DOM : overlay puis boîte (z-index identique au composant Sheet).
        if (this.el.parentElement === document.body) {
            document.body.appendChild(this.el);
        }

        setAriaAttribute(overlay, 'hidden', 'false');
        // Reflow pour fiabiliser la transition d'opacité depuis l'état masqué.
        void overlay.offsetWidth;
        overlay.classList.add('is-visible');
    }

    /** Masque l'overlay s'il est présent. */
    private _hideOverlay(): void {
        if (!this.overlayEl) return;
        this.overlayEl.classList.remove('is-visible');
        setAriaAttribute(this.overlayEl, 'hidden', 'true');
        if (this._stackZ !== null) {
            MessageBox._openStack = Math.max(0, MessageBox._openStack - 1);
            this._stackZ = null;
            this.el.style.removeProperty('z-index');
        }
    }

    /**
     * Définit le type d'overlay affiché derrière la boîte.
     * @param overlay `none`, `scrim`, `blur` ou `both`
     */
    public setOverlay(overlay: MessageBoxOverlay): void {
        const valid = (MessageBoxSpecs.overlay.available as readonly string[]).includes(overlay)
            ? overlay
            : MessageBoxSpecs.overlay.default;
        this.options.overlay = valid as MessageBoxOverlay;
    }

    private _resolveSoundUrl(name: string): string {
        if (!name) return name;
        if (name.includes('/') || name.includes('://')) return name;
        const base = this.options.soundsPath || '';
        return base.endsWith('/') ? base + name : `${base}/${name}`;
    }

    /**
     * Définit la position de la boîte à l'écran.
     * @param position Position cible (défaut `center`)
     */
    public setPosition(position: MessageBoxPosition): void {
        MessageBoxSpecs.positions.available.forEach((p) => {
            this.el.classList.remove(`messagebox--pos-${p}`);
        });
        const valid = (MessageBoxSpecs.positions.available as readonly string[]).includes(position)
            ? position
            : MessageBoxSpecs.positions.default;
        this.options.position = valid;
        this.el.classList.add(`messagebox--pos-${valid}`);
    }

    /**
     * Modifie le nombre de lignes visibles (borné entre 1 et 5).
     * @param n Nombre de lignes
     */
    public setMaxLines(n: number): void {
        this.options.maxLines = Math.max(MIN_LINES, Math.min(MAX_LINES, n));
        this.el.style.setProperty('--messagebox-lines', String(this.options.maxLines));
    }

    /** Débloque l'audio (à appeler depuis un geste utilisateur). */
    public unlockAudio(): Promise<void> {
        return this.sound.unlock();
    }

    // ============================================================================
    // ÉVÉNEMENTS
    // ============================================================================

    private _setupEventListeners(): void {
        const interact = (): void => {
            if (Date.now() < this.suppressClickUntil) return;
            void this.sound.unlock();
            this.advance();
        };

        this.registerEvent(this.el, 'click', () => interact());

        this.registerEvent(this.continueEl, 'click', ((e: Event) => {
            e.stopPropagation();
            interact();
        }) as EventListener);

        this.registerEvent(this.el, 'keydown', ((e: KeyboardEvent) => {
            if (e.key === 'Escape' && this.options.closeOnEscape) {
                e.preventDefault();
                this.dismiss();
                return;
            }

            if (this.choosing) {
                const horiz = this.choiceOrientation === 'horizontal';
                const prevKey = horiz ? 'ArrowLeft' : 'ArrowUp';
                const nextKey = horiz ? 'ArrowRight' : 'ArrowDown';
                if (e.key === prevKey) {
                    e.preventDefault();
                    this.moveSelection(-1);
                    return;
                }
                if (e.key === nextKey) {
                    e.preventDefault();
                    this.moveSelection(1);
                    return;
                }
                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                    e.preventDefault();
                    return;
                }
                if (e.key === 'Enter') {
                    e.preventDefault();
                    interact();
                    return;
                }
                return;
            }

            if (MessageBox.ACCEL_KEYS.has(e.key)) {
                e.preventDefault();
                void this.sound.unlock();
                this.speedMultiplier = 2;
                return;
            }
            if (MessageBox.NEXT_KEYS.has(e.key)) {
                e.preventDefault();
                interact();
            }
        }) as EventListener);

        this.registerEvent(this.el, 'keyup', ((e: KeyboardEvent) => {
            if (MessageBox.ACCEL_KEYS.has(e.key)) {
                e.preventDefault();
                this.speedMultiplier = 1;
            }
        }) as EventListener);

        if (this.options.swipe) {
            this._attachSwipe(this.el);
        }
    }

    /**
     * Détecte un swipe (tactile + souris) : un glissement horizontal ou vers le
     * haut au-delà du seuil déclenche `advance()`.
     */
    private _attachSwipe(el: HTMLElement, threshold = 30): void {
        let startX = 0;
        let startY = 0;
        let tracking = false;

        const onStart = (x: number, y: number): void => {
            startX = x;
            startY = y;
            tracking = true;
        };
        const onEnd = (x: number, y: number): void => {
            if (!tracking) return;
            tracking = false;
            const dx = x - startX;
            const dy = y - startY;
            if (Math.abs(dx) >= threshold || dy <= -threshold) {
                this.suppressClickUntil = Date.now() + 400;
                void this.sound.unlock();
                this.advance();
            }
        };

        this.registerEvent(
            el,
            'touchstart',
            ((e: TouchEvent) => {
                const t = e.changedTouches[0];
                onStart(t.clientX, t.clientY);
            }) as EventListener,
            { passive: true },
        );
        this.registerEvent(
            el,
            'touchend',
            ((e: TouchEvent) => {
                const t = e.changedTouches[0];
                onEnd(t.clientX, t.clientY);
            }) as EventListener,
            { passive: true },
        );
        this.registerEvent(el, 'pointerdown', ((e: PointerEvent) => {
            if (e.pointerType !== 'touch') onStart(e.clientX, e.clientY);
        }) as EventListener);
        this.registerEvent(el, 'pointerup', ((e: PointerEvent) => {
            if (e.pointerType !== 'touch') onEnd(e.clientX, e.clientY);
        }) as EventListener);
    }

    // ============================================================================
    // API PUBLIQUE
    // ============================================================================

    /**
     * Affiche un message ; résout quand toutes les pages ont été lues.
     * Si `choices` est fourni, propose une sélection sur la dernière page ; la
     * promesse renvoie alors la `value` (ou l'index) de l'option choisie. Sinon null.
     * @param message Texte (les retours à la ligne `\n` créent des paragraphes)
     * @param choices Options de choix (optionnel)
     * @param options Options du show (orientation des choix)
     */
    public show(
        message: string,
        choices: MessageBoxChoice[] = [],
        options: MessageBoxShowOptions = {},
    ): Promise<string | null> {
        this.stop();
        this.dismissed = false;
        this.options.onOpenStart?.(this.el);
        this.el.style.visibility = '';
        this._portalToBody();
        this._showOverlay();
        // La boîte capture l'entrée clavier (fidèle à ALTTP) : on lui donne le
        // focus sans provoquer de défilement de la page.
        this.el.focus({ preventScroll: true });
        this.pages = this._paginate(message);
        this.pageIndex = 0;
        this.choices = choices;
        this.choiceOrientation =
            options.orientation === 'horizontal'
                ? 'horizontal'
                : options.orientation === 'vertical'
                  ? 'vertical'
                  : this.options.choiceOrientation;
        return new Promise<string | null>((resolve) => {
            this.resolveDone = resolve;
            this._typePage();
            this.options.onOpenEnd?.(this.el);
        });
    }

    /** Accélère la page en cours, valide un choix, ou passe à la page suivante. */
    public advance(): void {
        if (this.typing) {
            this._finishPageInstantly();
            return;
        }
        if (this.choosing) {
            this._confirmChoice();
            return;
        }
        if (this.waitingForNext) {
            this.waitingForNext = false;
            this.continueEl.hidden = true;
            this.pageIndex++;
            if (this.pageIndex < this.pages.length) {
                this._typePage();
            } else {
                this._finishDone(null);
            }
        }
    }

    /** Interrompt la frappe et réinitialise l'affichage. */
    public stop(): void {
        if (this.timer !== null) {
            window.clearTimeout(this.timer);
            this.timer = null;
        }
        this.typing = false;
        this.waitingForNext = false;
        this.choosing = false;
        if (this.continueEl) this.continueEl.hidden = true;
        if (this.choicesEl) {
            this.choicesEl.hidden = true;
            this.choicesEl.innerHTML = '';
        }
    }

    /** Masque complètement la boîte (texte, curseur, choix) et stoppe la frappe. */
    public hide(): void {
        this.options.onCloseStart?.(this.el);
        this.stop();
        this._hideOverlay();
        this._restoreFromPortal();
        if (this.textEl) this.textEl.textContent = '';
        this.el.style.visibility = 'hidden';
        this.options.onCloseEnd?.(this.el);
    }

    /**
     * Ferme la boîte à la demande de l'utilisateur (ex. touche Échap) : résout
     * la promesse `show()` en cours avec `null`, puis masque la boîte.
     */
    public dismiss(): void {
        const wasActive = this.resolveDone !== null || this.el.style.visibility !== 'hidden';
        if (!wasActive) return;
        this.dismissed = true;
        this.choices = [];
        this._finishDone(null);
    }

    // ============================================================================
    // INTERNE : pagination, frappe, choix
    // ============================================================================

    private _finishDone(value: string | null): void {
        const done = this.resolveDone;
        this.resolveDone = null;
        done?.(value);
        this.hide();
    }

    private _isLastPage(): boolean {
        return this.pageIndex >= this.pages.length - 1;
    }

    private _paginate(message: string): Page[] {
        const { maxCharsPerLine, maxLines } = this.options;
        const pages: Page[] = [];
        let lines: string[] = [];
        const pushPage = (): void => {
            if (lines.length) {
                pages.push(lines);
                lines = [];
            }
        };
        for (const para of message.split('\n')) {
            const words = para.split(/\s+/).filter(Boolean);
            let current = '';
            for (const word of words) {
                const cand = current ? current + ' ' + word : word;
                if (cand.length <= maxCharsPerLine) {
                    current = cand;
                } else {
                    lines.push(current);
                    current = word;
                    if (lines.length === maxLines) pushPage();
                }
            }
            if (current) {
                lines.push(current);
                if (lines.length === maxLines) pushPage();
            }
        }
        pushPage();
        return pages.length ? pages : [['']];
    }

    private _typePage(): void {
        const full = this.pages[this.pageIndex].join('\n');
        this.textEl.textContent = '';
        this.choicesEl.hidden = true;
        this.choicesEl.innerHTML = '';
        this.typing = true;
        this.letterCount = 0;

        if (this._shouldReduceMotion()) {
            this.textEl.textContent = full;
            this._endPage();
            return;
        }

        let i = 0;
        const step = (): void => {
            if (i >= full.length) {
                this._endPage();
                return;
            }
            const ch = full[i];
            this.textEl.textContent += ch;
            i++;
            if (ch !== ' ' && ch !== '\n') {
                this.letterCount++;
                if (this.letterCount % this.options.soundEvery === 0) this.sound.play('letter');
            }
            const isPunct = '.,!?\u2026:;'.includes(ch);
            const base = isPunct ? this.options.punctuationDelay : this.options.charDelay;
            this.timer = window.setTimeout(step, base / (this.speedMultiplier || 1));
        };
        step();
    }

    private _finishPageInstantly(): void {
        if (this.timer !== null) window.clearTimeout(this.timer);
        this.timer = null;
        this.textEl.textContent = this.pages[this.pageIndex].join('\n');
        this._endPage();
    }

    private _endPage(): void {
        this.typing = false;
        this.sound.play('done');

        if (this._isLastPage() && this.choices.length > 0) {
            this._startChoosing();
        } else {
            this.waitingForNext = true;
            this.continueEl.hidden = false;
        }
    }

    private _startChoosing(): void {
        this.choosing = true;
        this.selectedIndex = 0;
        // Ignore un clic / « Entrée » résiduel le temps que l'utilisateur perçoive
        // les choix (crucial en mouvement réduit : apparition instantanée).
        this.suppressClickUntil = Math.max(this.suppressClickUntil, Date.now() + MessageBox.CHOICE_GUARD_MS);
        this.el.focus({ preventScroll: true });
        this.continueEl.hidden = true;
        this.choicesEl.classList.toggle('is-horizontal', this.choiceOrientation === 'horizontal');
        this._renderChoices();
        this.choicesEl.hidden = false;
    }

    private _renderChoices(): void {
        this.choicesEl.innerHTML = '';
        this.choices.forEach((choice, idx) => {
            const li = document.createElement('li');
            li.className = 'messagebox__choice';
            setAriaAttributes(li, { role: 'option', selected: idx === this.selectedIndex });
            if (idx === this.selectedIndex) li.classList.add('is-selected');

            const cur = document.createElement('span');
            cur.className = 'messagebox__select-cursor';
            setAriaAttribute(cur, 'hidden', true);

            const lab = document.createElement('span');
            lab.className = 'messagebox__choice-label';
            lab.textContent = choice.label;

            li.appendChild(cur);
            li.appendChild(lab);

            this.registerEvent(li, 'click', ((e: Event) => {
                e.stopPropagation();
                if (Date.now() < this.suppressClickUntil) return;
                void this.sound.unlock();
                this.selectedIndex = idx;
                this._confirmChoice();
            }) as EventListener);
            this.registerEvent(li, 'mouseenter', () => {
                this.selectedIndex = idx;
                this._updateSelectionClasses();
            });

            this.choicesEl.appendChild(li);
        });
    }

    private _updateSelectionClasses(): void {
        Array.from(this.choicesEl.querySelectorAll('.messagebox__choice')).forEach((el, idx) => {
            const active = idx === this.selectedIndex;
            el.classList.toggle('is-selected', active);
            setAriaAttribute(el as HTMLElement, 'selected', active);
        });
    }

    /**
     * Déplace la sélection courante d'un cran (avec bouclage).
     * @param delta -1 (précédent) ou +1 (suivant)
     */
    public moveSelection(delta: number): void {
        const n = this.choices.length;
        if (n === 0) return;
        this.selectedIndex = (this.selectedIndex + delta + n) % n;
        this._updateSelectionClasses();
        this.sound.play('letter');
    }

    private _confirmChoice(): void {
        this.choosing = false;
        this.choicesEl.hidden = true;
        this.sound.play('done');
        const choice = this.choices[this.selectedIndex];
        const value = choice?.value ?? String(this.selectedIndex);
        this.choices = [];
        this._finishDone(value);
    }

    // ============================================================================
    // OPTIONS DEPUIS LE DOM
    // ============================================================================

    private static _readOptionsFromElement(el: HTMLElement): Partial<MessageBoxOptions> {
        const get = (name: string): string | null => el.getAttribute(`data-${name}`);
        const num = (name: string): number | undefined => {
            const v = get(name);
            if (v === null) return undefined;
            const n = Number(v);
            return Number.isFinite(n) ? n : undefined;
        };
        const bool = (name: string): boolean | undefined => {
            const v = get(name);
            if (v === null) return undefined;
            if (v === '' || v.toLowerCase() === 'true') return true;
            if (v.toLowerCase() === 'false') return false;
            return undefined;
        };

        const positions = MessageBoxSpecs.positions.available as readonly string[];
        const orientations = MessageBoxSpecs.orientations.available as readonly string[];
        const overlays = MessageBoxSpecs.overlay.available as readonly string[];
        const positionAttr = get('position');
        const orientationAttr = get('orientation');
        const overlayAttr = get('overlay');

        const message = get('message') ?? ((el.textContent ?? '').trim() || undefined);

        const out: Partial<MessageBoxOptions> = {
            charDelay: num('char-delay'),
            punctuationDelay: num('punctuation-delay'),
            maxCharsPerLine: num('max-chars-per-line'),
            maxLines: num('lines') ?? num('max-lines'),
            soundEvery: num('sound-every'),
            scale: num('scale'),
            swipe: bool('swipe'),
            soundEnabled: bool('sound'),
            volume: num('volume'),
            soundsPath: get('sounds-path') ?? undefined,
            letterSound: get('letter-sound') ?? undefined,
            doneSound: get('done-sound') ?? undefined,
            position:
                positionAttr && positions.includes(positionAttr)
                    ? (positionAttr as MessageBoxPosition)
                    : undefined,
            choiceOrientation:
                orientationAttr && orientations.includes(orientationAttr)
                    ? (orientationAttr as MessageBoxOrientation)
                    : undefined,
            overlay:
                overlayAttr && overlays.includes(overlayAttr)
                    ? (overlayAttr as MessageBoxOverlay)
                    : undefined,
            overlayOpacity: num('overlay-opacity'),
            overlayBlur: num('overlay-blur'),
            message,
        };

        // Nettoie les clés undefined pour ne pas écraser les valeurs par défaut.
        (Object.keys(out) as (keyof MessageBoxOptions)[]).forEach((k) => {
            if (out[k] === undefined) delete out[k];
        });
        return out;
    }

    // ============================================================================
    // CYCLE DE VIE
    // ============================================================================

    /** @inheritdoc */
    onDestroy(): void {
        if (this.timer !== null) {
            window.clearTimeout(this.timer);
            this.timer = null;
        }
        if (this.overlayEl) {
            this.overlayEl.remove();
            this.overlayEl = null;
        }
        this._restoreFromPortal();
        this.sound?.dispose();
        this.resolveDone = null;
        this.logger.debug('MessageBox détruite');
    }
}

export default MessageBox;
