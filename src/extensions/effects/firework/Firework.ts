/**
 * @fileoverview Composant Firework pour K3UI
 * @description Feux d'artifice plein écran derrière le contenu (canvas + Web Audio)
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../../../core/base/Component';
import { toComponentClassDef } from '../../../types/components/component-base';
import type {
    FireworkOptions,
    FireworkSequenceOptions,
    FireworkSequenceSalvo,
    FireworkShellType,
} from '../../../types/components';
import { PriorityLevel } from '../../../types/base';
import type { ThemeType } from '../../../core/managers/ThemeManager';
import { ThemeManager } from '../../../core/managers/ThemeManager';
import { ManagerFactory } from '../../../core/factories';
import type { LoggerManager } from '../../../core/managers';
import { getFireworkDefaults, resolveFireworkZIndex } from '../../../specs/components/firework.specs';
import { setAriaAttributes } from '../../../utils/dom/aria';
import { getPreferReducedMotion } from '../../../utils/accessibility';
import {
    FireworksEngine,
    type SequenceOptions,
    type SequenceSalvo,
    type ShellTypeName,
} from './firework-engine';

const _defaults: FireworkOptions = getFireworkDefaults();

/**
 * Composant Firework K3UI — wrapper du moteur canvas avec bascule de thème optionnelle.
 */
export class Firework extends Component<FireworkOptions> {
    readonly priority: PriorityLevel = PriorityLevel.LOW;

    private logger: LoggerManager;
    private engine: FireworksEngine | null = null;
    private _isOpen = false;

    private themeFlipped = false;
    private savedTheme: ThemeType | null = null;
    private tailTimer: ReturnType<typeof setTimeout> | null = null;
    private pollTimer: ReturnType<typeof setInterval> | null = null;
    private soundGestureCleanup: (() => void) | null = null;

    /**
     * Options par défaut du composant
     */
    static get defaults(): FireworkOptions {
        return { ..._defaults };
    }

    /**
     * Obtient l'instance du composant pour un élément donné
     * @param el - Élément hôte
     */
    static getInstance(el: HTMLElement): Firework | undefined {
        return Component.getInstance(el) as Firework | undefined;
    }

    /**
     * Initialise les instances Firework
     * @param els - Éléments ou sélecteur CSS
     * @param options - Options partielles
     */
    static init(
        els: HTMLElement | NodeListOf<HTMLElement> | string | HTMLCollectionOf<HTMLElement>,
        options: Partial<FireworkOptions> = {},
    ): Firework | Firework[] {
        return Component.init(els, options, toComponentClassDef(Firework)) as Firework | Firework[];
    }

    /**
     * @param el - Élément déclencheur (`k3ui-firework` ou `.firework`)
     * @param options - Options de configuration
     */
    constructor(el: HTMLElement, options: Partial<FireworkOptions> = {}) {
        const fromEl = Firework.readOptionsFromElement(el);
        const zIndexExplicit =
            fromEl.zIndexExplicit === true ||
            Object.prototype.hasOwnProperty.call(options, 'zIndex');
        const { zIndexExplicit: _drop, ...fromElOptions } = fromEl;

        const merged: FireworkOptions = {
            ...Firework.defaults,
            ...fromElOptions,
            ...options,
        };
        merged.zIndex = resolveFireworkZIndex(merged.layer, merged.zIndex, zIndexExplicit);
        if (merged.layer === 'front') {
            merged.transparentBackground = true;
        }

        super(el, merged, toComponentClassDef(Firework));

        this.logger = ManagerFactory.getLoggerManager('[Firework]');

        if (merged.disableForReducedMotion && getPreferReducedMotion()) {
            this.logger.info('Firework désactivé (prefers-reduced-motion)');
            return;
        }

        this.initEngine();
        this.setupThemeFlip();
        this.setupSoundGesture();
    }

    /** true si l'animation ou une séquence est active */
    get isOpen(): boolean {
        return this._isOpen;
    }

    /** Accès au moteur canvas sous-jacent */
    get fireworksEngine(): FireworksEngine | null {
        return this.engine;
    }

    /**
     * Démarre le moteur (alias open)
     */
    open(): void {
        if (!this.engine || this._isOpen) return;
        this.options.onOpenStart?.(this.el);
        this.engine.start();
        this._isOpen = true;
        this.options.onOpenEnd?.(this.el);
    }

    /**
     * Met en pause le moteur (alias close)
     */
    close(): void {
        if (!this.engine || !this._isOpen) return;
        this.options.onCloseStart?.(this.el);
        this.engine.pause();
        this.engine.stopSequence();
        this._isOpen = false;
        this.restoreThemeIfNeeded();
        this.options.onCloseEnd?.(this.el);
    }

    /**
     * Lance un obus unique
     */
    launch(opts?: { shell?: FireworkShellType; size?: number; x?: number; y?: number }): void {
        this.engine?.launch(opts as { shell?: ShellTypeName; size?: number; x?: number; y?: number });
    }

    /**
     * Lance une salve de N obus
     */
    launchBurst(count: number, opts?: { shell?: FireworkShellType; size?: number }): void {
        this.engine?.launchBurst(count, opts as { shell?: ShellTypeName; size?: number });
    }

    /**
     * Joue une séquence personnalisée
     */
    playSequence(salvos: FireworkSequenceSalvo[], options?: FireworkSequenceOptions): void {
        this.engine?.playSequence(salvos as SequenceSalvo[], options as SequenceOptions);
    }

    /**
     * Arrête la séquence en cours
     */
    stopSequence(): void {
        this.engine?.stopSequence();
    }

    /**
     * Séquence célébration : 2 › 3 › 2 › finale
     */
    celebrate(options?: FireworkSequenceOptions): void {
        this.playSequence(
            [{ count: 2 }, { count: 3 }, { count: 2 }, { finale: true }],
            options,
        );
    }

    pause(): void {
        this.engine?.pause();
    }

    resume(): void {
        this.open();
    }

    togglePause(): void {
        this.engine?.togglePause();
    }

    enableSound(): void {
        this.engine?.enableSound();
    }

    disableSound(): void {
        this.engine?.disableSound();
    }

    toggleSound(): void {
        this.engine?.toggleSound();
    }

    /**
     * Détruit l'instance et le moteur
     */
    public override destroy(): void {
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
        if (this.tailTimer) {
            clearTimeout(this.tailTimer);
            this.tailTimer = null;
        }
        if (this.soundGestureCleanup) {
            this.soundGestureCleanup();
            this.soundGestureCleanup = null;
        }
        this.restoreThemeIfNeeded();
        this.engine?.destroy();
        this.engine = null;
        this._isOpen = false;
        super.destroy();
        this.logger.info('Firework destroyed');
    }

    /**
     * Lit les attributs HTML de l'élément hôte
     * @param el - Élément déclencheur
     */
    private static readOptionsFromElement(
        el: HTMLElement,
    ): Partial<FireworkOptions> & { zIndexExplicit?: boolean } {
        const attr = (name: string) => el.getAttribute(name);
        const has = (name: string) => el.hasAttribute(name);
        const parsed: Partial<FireworkOptions> & { zIndexExplicit?: boolean } = {};

        if (has('theme-flip')) {
            parsed.themeFlip = attr('theme-flip') !== 'false';
        }
        const tail = attr('theme-flip-tail');
        if (tail != null) parsed.themeFlipTailMs = parseInt(tail, 10);
        const restore = attr('restore-theme');
        if (restore) parsed.restoreTheme = restore;

        if (has('auto')) parsed.autoLaunch = true;
        if (has('finale')) parsed.finale = true;
        if (has('sound')) parsed.soundEnabled = true;
        if (has('trails')) parsed.trails = attr('trails') !== 'false';
        if (has('imprints')) parsed.imprints = attr('imprints') === 'true';

        const shell = attr('shell');
        if (shell) parsed.shell = shell as FireworkShellType;
        const size = attr('size');
        if (size != null) parsed.size = parseFloat(size);
        const quality = attr('quality');
        if (quality != null) parsed.quality = parseInt(quality, 10) as FireworkOptions['quality'];
        const sky = attr('sky');
        if (sky != null) parsed.skyLighting = parseInt(sky, 10) as FireworkOptions['skyLighting'];
        const scale = attr('scale');
        if (scale != null) parsed.scaleFactor = parseFloat(scale);

        const layer = attr('layer');
        if (layer === 'front' || layer === 'behind') {
            parsed.layer = layer;
        }

        const z = attr('z-index');
        if (z != null) {
            parsed.zIndex = parseFloat(z);
            parsed.zIndexExplicit = true;
        }

        const soundMode = attr('sound-mode');
        if (soundMode === 'synth' || soundMode === 'samples') {
            parsed.soundMode = soundMode;
        }

        const srcRef = attr('sound-src');
        if (srcRef) {
            try {
                parsed.soundSources = JSON.parse(srcRef) as Partial<Record<string, string[]>>;
            } catch {
                const globalSources = (window as unknown as Record<string, unknown>)[srcRef];
                if (globalSources && typeof globalSources === 'object') {
                    parsed.soundSources = globalSources as Partial<Record<string, string[]>>;
                }
            }
        }

        return parsed;
    }

    private initEngine(): void {
        const o = this.options;
        const mountTarget = o.container ?? document.body;

        this.engine = new FireworksEngine({
            quality: o.quality,
            shell: o.shell,
            size: o.size,
            autoLaunch: o.autoLaunch,
            finale: o.finale,
            skyLighting: o.skyLighting,
            longExposure: o.longExposure,
            trails: o.trails,
            imprints: o.imprints,
            scaleFactor: o.scaleFactor,
            soundEnabled: o.soundEnabled,
            soundMode: o.soundMode,
            soundBaseUrl: o.soundBaseUrl,
            soundSources: o.soundSources,
            transparentBackground: o.transparentBackground,
            zIndex: o.zIndex,
            highDPI: o.highDPI,
            autoStart: o.autoStart,
            container: mountTarget,
        });

        const root = mountTarget.querySelector('.firework-root');
        if (root instanceof HTMLElement) {
            setAriaAttributes(root, { hidden: 'true' });
        }

        if (o.autoStart) {
            this._isOpen = true;
        }

        this.logger.info('Firework engine initialized');
    }

    private setupThemeFlip(): void {
        if (!this.options.themeFlip || !this.engine) return;

        const pollMs = 140;
        this.pollTimer = setInterval(() => this.tickThemeFlip(), pollMs);
    }

    private tickThemeFlip(): void {
        if (!this.engine || !this.options.themeFlip) return;

        const showActive =
            this.engine.isPlayingSequence || this.engine.activeParticleCount > 0;

        if (showActive) {
            if (this.tailTimer) {
                clearTimeout(this.tailTimer);
                this.tailTimer = null;
            }
            if (!this.themeFlipped) this.flipToDark();
            return;
        }

        if (!this.themeFlipped || this.tailTimer) return;

        this.tailTimer = setTimeout(() => {
            this.tailTimer = null;
            if (
                this.engine &&
                !this.engine.isPlayingSequence &&
                this.engine.activeParticleCount === 0
            ) {
                this.restoreThemeIfNeeded();
            }
        }, this.options.themeFlipTailMs);
    }

    private flipToDark(): void {
        if (this.themeFlipped) return;

        const preference = ThemeManager.currentTheme;
        if (Firework.shouldFlipToDark(preference)) {
            this.savedTheme = (this.options.restoreTheme as ThemeType | undefined) ?? preference;
            this.themeFlipped = true;
            ThemeManager.setTheme('dark', { silent: true });
        }
    }

    private restoreThemeIfNeeded(): void {
        if (!this.themeFlipped || this.savedTheme === null) return;
        this.engine?.clearIdleDisplay();
        ThemeManager.setTheme(this.savedTheme, { silent: true });
        this.themeFlipped = false;
        this.savedTheme = null;
    }

    /** true si le thème visuel est clair et nécessite un flip temporaire */
    private static shouldFlipToDark(theme: ThemeType): boolean {
        if (theme === 'dark') return false;
        if (theme === 'light') return true;
        return ThemeManager.getSystemTheme() === 'light';
    }

    private setupSoundGesture(): void {
        if (!this.options.soundEnabled || !this.engine) return;

        const enable = (): void => {
            this.engine?.enableSound();
            cleanup();
        };

        const cleanup = (): void => {
            this.soundGestureCleanup = null;
        };

        this.registerEvent(window, 'pointerdown', enable, { once: true });
        this.registerEvent(window, 'keydown', enable, { once: true });
        this.soundGestureCleanup = cleanup;
    }
}
