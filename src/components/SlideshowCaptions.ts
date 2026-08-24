/**
 * @fileoverview Composant SlideshowCaptions — légendes par slide (2 lignes, type Synergy)
 * @description Mode synergy (défaut) : enfants directs groupés par **paires** (2+2+…) ; chaque paire se croise sur l’axe
 * vertical du **centre** de la largeur (container ou fenêtre). Mode `marquee` : 2 premières lignes seulement.
 */

import { Component } from '../core/base/Component';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import type { SlideshowCaptionsOptions } from '../types/components';
import { PriorityLevel } from '../types/base';
import type { InitElements, KElement } from '../types/base';
import { ManagerFactory } from '../core/factories';
import {
    getSlideshowCaptionsDefaults,
    SYNERGY_EASE_THEME_CROSS,
} from '../specs/components/slideshow-captions.specs';
import gsap from 'gsap';
import { getPreferReducedMotion } from '../utils/accessibility';

const TRACK_CLASS = 'slideshow-captions__track';
const SEGMENT_CLASS = 'slideshow-captions__segment';
const MODE_ATTR = 'data-k3-slideshow-captions-mode';
const VIEWPORT_ATTR = 'data-k3-slideshow-captions-viewport';

/**
 * Les `text-shadow` 3D dépassent visuellement sous le texte sans augmenter `offsetHeight` :
 * on l’ajoute au calcul de pile / min-height pour recentrer l’ensemble (gros corps, 5rem, etc.).
 */
const SYNERGY_VISUAL_BLEED_Y_PX = 36;

/** Largeur viewport « layout » (exclut barre de défilement) pour le milieu horizontal réel. */
function getViewportInnerWidth(): number {
    if (typeof window === 'undefined' || typeof document === 'undefined') return 1;
    const d = document.documentElement;
    return Math.max(1, d.clientWidth || window.innerWidth);
}

/**
 * Courbe 0→1 : vitesse max aux bords, dérivée nulle à t=½ (croisement au centre du trajet temporel).
 * Approximation légère du SlowMo du thème Synergy HTML (mc.modules.animation.js).
 */
function synergySlowCrossEaseFn(t: number): number {
    return t + Math.sin(2 * Math.PI * t) / (2 * Math.PI);
}

const _defaults: SlideshowCaptionsOptions = getSlideshowCaptionsDefaults();

/** Contexte partagé pour l’animation synergy (après résolution des paires). */
type SynergyTweenCtx = {
    gsap: typeof gsap;
    lines: HTMLElement[];
    pairs: [HTMLElement, HTMLElement][];
    cxLocal: number;
    travelW: number;
    duration: number;
    ease: string;
    lineGap: number;
};

export class SlideshowCaptions extends Component<SlideshowCaptionsOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    private readonly logger = ManagerFactory.getLoggerManager('[SlideshowCaptions]');
    private playToken = 0;
    private marqueeBuilt = false;
    /** Handle du setTimeout de fin de cycle synergy (loop). */
    private loopTimeoutId: number | null = null;
    /** Dernière paire synergy terminée en séquence ou au pas à pas ; -1 = aucune. */
    private synergyStepIndex = -1;

    static get defaults(): SlideshowCaptionsOptions {
        return { ..._defaults };
    }

    static getInstance(el: HTMLElement): SlideshowCaptions | undefined {
        return Component.getInstance(el) as SlideshowCaptions | undefined;
    }

    static init(
        els: KElement | InitElements<KElement> | string,
        options: Partial<SlideshowCaptionsOptions> = {}
    ): SlideshowCaptions | SlideshowCaptions[] {
        return Component.init(els, options, toComponentClassDef(SlideshowCaptions)) as SlideshowCaptions | SlideshowCaptions[];
    }

    constructor(el: HTMLElement, options: Partial<SlideshowCaptionsOptions> = {}) {
        super(el, options, toComponentClassDef(SlideshowCaptions));
        const fromData = SlideshowCaptions.readDataOptions(el);
        this.options = {
            ...SlideshowCaptions.defaults,
            ...fromData,
            ...options,
        };
        this.ensureRootLayout();
        this.el.setAttribute(MODE_ATTR, this.options.mode);
        this.el.setAttribute(VIEWPORT_ATTR, this.options.viewport);
    }

    private static readDataOptions(el: HTMLElement): Partial<SlideshowCaptionsOptions> {
        const duration = el.dataset.duration != null ? Number(el.dataset.duration) : undefined;
        const lineGap = el.dataset.lineGap != null ? Number(el.dataset.lineGap) : undefined;
        const widthExtra = el.dataset.widthExtra != null ? Number(el.dataset.widthExtra) : undefined;
        const v = el.dataset.viewport;
        const viewport =
            v === 'container' ? 'container' : v === 'window' ? ('window' as const) : undefined;
        const ease = el.dataset.ease;
        const autoStart = el.dataset.autostart === 'false' ? false : el.dataset.autostart === 'true' ? true : undefined;
        const loop =
            el.dataset.loop === 'false' ? false : el.dataset.loop === 'true' ? true : undefined;
        const mode = el.dataset.mode === 'synergy' ? 'synergy' : el.dataset.mode === 'marquee' ? 'marquee' : undefined;
        const marqueeSpeed = el.dataset.marqueeSpeed != null ? Number(el.dataset.marqueeSpeed) : undefined;
        const marqueeSegmentGap =
            el.dataset.marqueeSegmentGap != null ? Number(el.dataset.marqueeSegmentGap) : undefined;
        const maxCaptionLines =
            el.dataset.maxCaptionLines != null ? Number(el.dataset.maxCaptionLines) : undefined;
        const maxCap =
            Number.isFinite(maxCaptionLines) && maxCaptionLines! >= 1 && maxCaptionLines! <= 24
                ? Math.floor(maxCaptionLines!)
                : undefined;
        return {
            duration: Number.isFinite(duration) && duration! > 0 ? duration : undefined,
            lineGap: Number.isFinite(lineGap) && lineGap! >= 0 ? lineGap : undefined,
            widthExtra: Number.isFinite(widthExtra) && widthExtra! >= 0 ? widthExtra : undefined,
            viewport,
            ease: ease || undefined,
            autoStart,
            loop,
            mode,
            marqueeSpeed: Number.isFinite(marqueeSpeed) && marqueeSpeed! > 0 ? marqueeSpeed : undefined,
            marqueeSegmentGap:
                Number.isFinite(marqueeSegmentGap) && marqueeSegmentGap! >= 0 ? marqueeSegmentGap : undefined,
            maxCaptionLines: maxCap,
        };
    }

    private ensureRootLayout(): void {
        const pos = window.getComputedStyle(this.el).position;
        if (pos === 'static') {
            this.el.style.position = 'relative';
        }
    }

    private getRawLineElements(): HTMLElement[] {
        return Array.from(this.el.children).filter((n): n is HTMLElement => n instanceof HTMLElement);
    }

    /**
     * Marquee : au plus 2 lignes. Synergy : jusqu’à `maxCaptionLines` enfants (puis groupés par paires).
     */
    private getCaptionLineElements(): HTMLElement[] {
        const raw = this.getRawLineElements();
        if (this.options.mode === 'marquee') {
            if (raw.length > 2) {
                this.logger.warn(
                    `SlideshowCaptions (marquee) : ${raw.length} enfant(s) direct(s) ; seules les 2 premières sont utilisées.`
                );
            }
            return raw.slice(0, 2);
        }
        const max = Math.max(2, Math.min(24, this.options.maxCaptionLines));
        if (raw.length > max) {
            this.logger.warn(
                `SlideshowCaptions (synergy) : ${raw.length} enfant(s) direct(s) ; seuls les ${max} premiers sont pris en compte (paires de 2).`
            );
        }
        return raw.slice(0, max);
    }

    private chunkSynergyPairs(lines: HTMLElement[]): HTMLElement[][] {
        const pairs: HTMLElement[][] = [];
        for (let i = 0; i + 1 < lines.length; i += 2) {
            pairs.push([lines[i]!, lines[i + 1]!]);
        }
        if (lines.length % 2 === 1) {
            this.logger.warn(
                'SlideshowCaptions (synergy) : nombre impair d’enfants directs — la dernière ligne est ignorée (il faut des paires de 2).'
            );
        }
        return pairs;
    }

    private getTracks(): HTMLElement[] {
        return this.getCaptionLineElements()
            .map((line) => line.querySelector(`:scope > .${TRACK_CLASS}`) as HTMLElement | null)
            .filter((t): t is HTMLElement => t != null);
    }

    /**
     * Centre du croisement en coordonnées locales du conteneur (`left` des lignes en `position:absolute`).
     * Repère = bord gauche de la **boîte de padding** du root (comme `left` en CSS), pas la boîte de bordure.
     * — `container` : milieu horizontal de `clientWidth`.
     * — `window` : projection du milieu du viewport dans ce repère (bloc étroit dans la page).
     */
    private getSynergyCrossingGeometry(): { cxLocal: number; travelW: number } {
        const el = this.el;
        void el.offsetWidth;
        const rect = el.getBoundingClientRect();
        const clientW = Math.max(1, el.clientWidth);
        const padEdgeLeft = rect.left + el.clientLeft;
        if (this.options.viewport === 'container') {
            return { cxLocal: clientW * 0.5, travelW: clientW };
        }
        const vw = getViewportInnerWidth();
        return { cxLocal: vw * 0.5 - padEdgeLeft, travelW: vw };
    }

    public onInit(): void {
        if (this.options.autoStart) {
            this.play();
        }
    }

    public play(): void {
        this.playToken += 1;
        if (this.options.mode === 'marquee') {
            this.runMarqueeAnimation();
        } else {
            this.runSynergyAnimation();
        }
    }

    /**
     * Synergy : anime uniquement la paire d’indice `pairIndex` (0-based), sans enchaîner la suivante.
     * Annule toute animation synergy en cours (même jeton que `play()`).
     */
    public playSynergyPairAt(pairIndex: number): void {
        if (this.options.mode !== 'synergy') return;
        this.playToken += 1;
        const token = this.playToken;
        this.runSynergySinglePairAt(pairIndex, token);
    }

    /** Synergy : paire suivante (boucle si `loop: true`). Sans effet en marquee. */
    public nextSynergyPair(): void {
        if (this.options.mode !== 'synergy') return;
        const lines = this.getCaptionLineElements();
        const pairs = this.chunkSynergyPairs(lines);
        if (pairs.length === 0) return;
        let next = this.synergyStepIndex + 1;
        if (next >= pairs.length) {
            if (!this.options.loop) return;
            next = 0;
        }
        this.playSynergyPairAt(next);
    }

    /** Synergy : paire précédente (boucle si `loop: true`). Sans effet en marquee. */
    public previousSynergyPair(): void {
        if (this.options.mode !== 'synergy') return;
        const lines = this.getCaptionLineElements();
        const pairs = this.chunkSynergyPairs(lines);
        if (pairs.length === 0) return;
        let prev: number;
        if (this.synergyStepIndex < 0) {
            if (!this.options.loop) return;
            prev = pairs.length - 1;
        } else {
            prev = this.synergyStepIndex - 1;
            if (prev < 0) {
                if (!this.options.loop) return;
                prev = pairs.length - 1;
            }
        }
        this.playSynergyPairAt(prev);
    }

    private ensureMarqueeTracks(): void {
        if (this.marqueeBuilt) return;
        const lines = this.getCaptionLineElements();
        for (const line of lines) {
            if (line.querySelector(`:scope > .${TRACK_CLASS}`)) continue;
            const track = document.createElement('div');
            track.className = TRACK_CLASS;
            const seg1 = document.createElement('span');
            seg1.className = SEGMENT_CLASS;
            while (line.firstChild) {
                seg1.appendChild(line.firstChild);
            }
            const seg2 = seg1.cloneNode(true) as HTMLElement;
            seg2.setAttribute('aria-hidden', 'true');
            track.appendChild(seg1);
            track.appendChild(seg2);
            line.appendChild(track);
        }
        this.marqueeBuilt = lines.length > 0;
        void this.el.offsetWidth;
    }

    private runMarqueeAnimation(): void {
        const lines = this.getCaptionLineElements();
        if (lines.length === 0) return;

        if (this.options.disableForReducedMotion && getPreferReducedMotion()) {
            this.applyMarqueeStatic(gsap, lines);
            return;
        }

        this.ensureMarqueeTracks();
        const tracks = this.getTracks();
        if (tracks.length === 0) return;

        gsap.killTweensOf(tracks);
        for (const t of tracks) {
            gsap.set(t, { clearProps: 'transform' });
        }

        this.options.onCycleStart?.(this);

        const speed = Math.max(8, this.options.marqueeSpeed);
        const gap = Math.max(0, this.options.marqueeSegmentGap);

        for (let i = 0; i < tracks.length; i++) {
            const track = tracks[i]!;
            const seg1 = track.querySelector(`:scope > .${SEGMENT_CLASS}:first-of-type`) as HTMLElement | null;
            if (!seg1) continue;
            const w = seg1.offsetWidth + gap;
            if (w <= gap) continue;

            if (i % 2 === 0) {
                gsap.set(track, { x: 0 });
                gsap.to(track, {
                    x: -w,
                    duration: w / speed,
                    ease: 'none',
                    repeat: -1,
                });
            } else {
                gsap.set(track, { x: -w });
                gsap.to(track, {
                    x: 0,
                    duration: w / speed,
                    ease: 'none',
                    repeat: -1,
                });
            }
        }

        this.el.style.minHeight = '';
    }

    private applyMarqueeStatic(gsapLib: typeof gsap, lines: HTMLElement[]): void {
        this.ensureMarqueeTracks();
        gsapLib.killTweensOf(this.getTracks());
        for (const t of this.getTracks()) {
            gsapLib.set(t, { clearProps: 'transform' });
        }
        this.el.style.display = 'flex';
        this.el.style.flexDirection = 'column';
        this.el.style.alignItems = 'center';
        this.el.style.justifyContent = 'center';
        this.el.style.gap = `${this.options.lineGap}px`;
        for (const line of lines) {
            line.style.position = 'relative';
            line.style.display = 'block';
            line.style.width = '100%';
            line.style.overflow = 'hidden';
            line.style.textAlign = 'center';
        }
    }

    /** Résout `ease` : identifiant thème Synergy ou chaîne GSAP. */
    private resolveSynergyEase(ease: string): string | ((t: number) => number) {
        if (ease === SYNERGY_EASE_THEME_CROSS || ease === 'synergy.theme') {
            return synergySlowCrossEaseFn;
        }
        return ease;
    }

    /**
     * Croisement sur l’axe vertical passant par `cxLocal` (milieu du container ou du viewport selon l’option).
     */
    private runSynergyPairTween(
        gsapLib: typeof gsap,
        pair: [HTMLElement, HTMLElement],
        cxLocal: number,
        travelW: number,
        duration: number,
        ease: string,
        lineGap: number,
        onPairComplete: () => void
    ): void {
        const [line0, line1] = pair;
        const metrics = this.measureSynergyLineMetrics(pair);
        const w0 = metrics[0]!.width;
        const w1 = metrics[1]!.width;
        const h0 = metrics[0]!.height;
        const h1 = metrics[1]!.height;
        const layoutH = this.synergyPairLayoutHeight(h0, h1, lineGap);
        const containerH = Math.max(this.el.offsetHeight, layoutH);
        const topBase = Math.max(0, (containerH - layoutH) / 2);
        const left0 = cxLocal - w0 / 2;
        const left1 = cxLocal - w1 / 2;

        let done = 0;
        const check = (): void => {
            done += 1;
            if (done >= 2) onPairComplete();
        };

        line0.removeAttribute('style');
        line1.removeAttribute('style');

        // `x` (transform) plutôt que `left` : moins de reflow, meilleure fluidité avec gros texte / text-shadow.
        gsap.set(line0, {
            top: topBase,
            left: left0,
            x: -travelW,
            opacity: 1,
            display: 'inline-block',
            position: 'absolute',
            force3D: true,
        });
        gsap.set(line1, {
            top: topBase + lineGap,
            left: left1,
            x: travelW,
            opacity: 1,
            display: 'inline-block',
            position: 'absolute',
            force3D: true,
        });

        const easeResolved = this.resolveSynergyEase(ease);
        const v0: Record<string, unknown> = {
            duration,
            x: travelW,
            ease: easeResolved,
            force3D: true,
            onComplete: check,
        };
        const v1: Record<string, unknown> = {
            duration,
            x: -travelW,
            ease: easeResolved,
            force3D: true,
            onComplete: check,
        };
        gsap.to(line0, v0);
        gsap.to(line1, v1);
    }

    private synergyResolveTweenContext(): SynergyTweenCtx | null | 'reduced-static' {
        const lines = this.getCaptionLineElements();
        if (lines.length < 2) {
            if (lines.length === 1) {
                this.logger.warn('SlideshowCaptions (synergy) : un seul enfant direct — il faut au moins une paire (2 lignes).');
            }
            return null;
        }

        const pairs = this.chunkSynergyPairs(lines);
        if (pairs.length === 0) return null;

        if (this.options.disableForReducedMotion && getPreferReducedMotion()) {
            this.applyStaticLayout(gsap, lines);
            this.options.onCycleComplete?.(this);
            return 'reduced-static';
        }

        const { cxLocal, travelW } = this.getSynergyCrossingGeometry();
        return {
            gsap,
            lines,
            pairs: pairs as [HTMLElement, HTMLElement][],
            cxLocal,
            travelW,
            duration: this.options.duration,
            ease: this.options.ease,
            lineGap: this.options.lineGap,
        };
    }

    private synergyBeginHideAll(ctx: SynergyTweenCtx): void {
        const { gsap, lines, pairs, lineGap } = ctx;
        gsap.killTweensOf(lines);
        this.clearLineStyles(lines);

        this.applySynergyContainerMinHeight(pairs, lineGap);

        for (const el of lines) {
            el.style.opacity = '0';
            el.style.visibility = 'hidden';
        }
    }

    private runSynergySinglePairAt(pairIndex: number, token: number): void {
        const resolved = this.synergyResolveTweenContext();
        if (resolved == null || resolved === 'reduced-static') return;

        const ctx = resolved;
        if (pairIndex < 0 || pairIndex >= ctx.pairs.length) return;

        this.synergyBeginHideAll(ctx);
        this.options.onCycleStart?.(this);

        const { gsap, pairs, cxLocal, travelW, duration, ease, lineGap } = ctx;

        const afterPair = (pair: [HTMLElement, HTMLElement]): void => {
            for (const el of pair) {
                gsap.killTweensOf(el);
                el.removeAttribute('style');
                el.style.opacity = '0';
                el.style.visibility = 'hidden';
            }
        };

        if (token !== this.playToken) return;
        const pair = pairs[pairIndex]! as [HTMLElement, HTMLElement];
        for (const el of pair) {
            el.style.visibility = 'visible';
            el.style.opacity = '1';
        }
        this.runSynergyPairTween(gsap, pair, cxLocal, travelW, duration, ease, lineGap, () => {
            if (token !== this.playToken) return;
            afterPair(pair);
            this.synergyStepIndex = pairIndex;
            this.options.onCycleComplete?.(this);
        });
    }

    private runSynergyAnimation(): void {
        const resolved = this.synergyResolveTweenContext();
        if (resolved == null || resolved === 'reduced-static') return;

        const ctx = resolved;
        this.synergyBeginHideAll(ctx);
        this.options.onCycleStart?.(this);
        this.synergyStepIndex = -1;

        const { gsap, pairs, cxLocal, travelW, duration, ease, lineGap } = ctx;
        const token = this.playToken;

        const afterPair = (pair: [HTMLElement, HTMLElement]): void => {
            for (const el of pair) {
                gsap.killTweensOf(el);
                el.removeAttribute('style');
                el.style.opacity = '0';
                el.style.visibility = 'hidden';
            }
        };

        const runPairAt = (index: number): void => {
            if (token !== this.playToken) return;
            if (index >= pairs.length) {
                this.finishSynergyCycle();
                return;
            }
            const pair = pairs[index]! as [HTMLElement, HTMLElement];
            for (const el of pair) {
                el.style.visibility = 'visible';
                el.style.opacity = '1';
            }
            this.runSynergyPairTween(gsap, pair, cxLocal, travelW, duration, ease, lineGap, () => {
                if (token !== this.playToken) return;
                this.synergyStepIndex = index;
                afterPair(pair);
                runPairAt(index + 1);
            });
        };

        runPairAt(0);
    }

    /**
     * Mesure largeur + hauteur réelles (padding, typo) pour le placement synergy.
     * La largeur sert au centrage (`left = cx - width/2`) : utiliser `offsetWidth` réel uniquement ;
     * ajouter une marge ici décale le croisement (voir `widthExtra`, réservé sans effet sur le centrage).
     */
    private measureSynergyLineMetrics(lines: HTMLElement[]): { width: number; height: number }[] {
        const out: { width: number; height: number }[] = [];
        for (const line of lines) {
            line.removeAttribute('style');
            line.style.setProperty('display', 'inline-block');
            line.style.setProperty('position', 'absolute');
            line.style.setProperty('visibility', 'hidden');
            line.style.setProperty('left', '-99999px');
            line.style.setProperty('top', '0');
            line.style.setProperty('white-space', 'nowrap');
            void line.offsetWidth;
            const ow = line.offsetWidth;
            const sw = line.scrollWidth;
            const width = Math.max(ow, sw, 1);
            out.push({ width, height: line.offsetHeight });
        }
        void this.el.offsetWidth;
        return out;
    }

    /** Hauteur verticale occupée par une paire (ligne 0 en haut, ligne 1 décalée de lineGap). */
    private synergyPairStackHeight(h0: number, h1: number, lineGap: number): number {
        return Math.max(h0, lineGap + h1);
    }

    /** Pile + marge sous le glyphe (ombres portées hors boîte de mise en page). */
    private synergyPairLayoutHeight(h0: number, h1: number, lineGap: number): number {
        return this.synergyPairStackHeight(h0, h1, lineGap) + SYNERGY_VISUAL_BLEED_Y_PX;
    }

    /**
     * Fixe une min-height synergy dès le départ : max des hauteurs de toutes les paires,
     * en respectant un min-height CSS éventuel sur le root (attribut / feuille de style).
     */
    private applySynergyContainerMinHeight(pairs: [HTMLElement, HTMLElement][], lineGap: number): void {
        let maxStack = lineGap + 48 + SYNERGY_VISUAL_BLEED_Y_PX;
        for (const pair of pairs) {
            const m = this.measureSynergyLineMetrics(pair);
            const h0 = m[0]?.height ?? 0;
            const h1 = m[1]?.height ?? 0;
            maxStack = Math.max(maxStack, this.synergyPairLayoutHeight(h0, h1, lineGap));
        }

        const el = this.el;
        const computed = typeof window !== 'undefined' ? window.getComputedStyle(el) : null;
        let cssMinH = 0;
        if (computed && computed.minHeight && computed.minHeight !== 'auto' && computed.minHeight !== 'none') {
            const px = parseFloat(computed.minHeight);
            if (Number.isFinite(px)) cssMinH = px;
        }

        el.style.minHeight = `${Math.max(maxStack, cssMinH, el.offsetHeight)}px`;
    }

    private finishSynergyCycle(): void {
        this.options.onCycleComplete?.(this);
        if (this.options.loop) {
            if (this.loopTimeoutId !== null) {
                window.clearTimeout(this.loopTimeoutId);
            }
            this.loopTimeoutId = window.setTimeout(() => {
                this.loopTimeoutId = null;
                this.reset();
                this.play();
            }, 0);
        }
    }

    private applyStaticLayout(gsapLib: typeof gsap, lines: HTMLElement[]): void {
        gsapLib.killTweensOf(lines);
        this.el.style.display = 'flex';
        this.el.style.flexDirection = 'column';
        this.el.style.gap = `${this.options.lineGap}px`;
        this.el.style.minHeight = '';
        for (const line of lines) {
            line.removeAttribute('style');
            line.style.opacity = '1';
            line.style.visibility = 'visible';
            line.style.position = 'relative';
        }
    }

    private clearLineStyles(lines: HTMLElement[]): void {
        this.el.style.display = '';
        this.el.style.flexDirection = '';
        this.el.style.gap = '';
        this.el.style.alignItems = '';
        this.el.style.justifyContent = '';
        for (const line of lines) {
            line.removeAttribute('style');
        }
    }

    public reset(): void {
        this.playToken += 1;
        this.synergyStepIndex = -1;
        const allLines = this.getRawLineElements();
        const marqueeLines = this.options.mode === 'marquee' ? allLines.slice(0, 2) : allLines;

        if (this.options.mode === 'marquee') {
            const tracks = marqueeLines
                .map((line) => line.querySelector(`:scope > .${TRACK_CLASS}`) as HTMLElement | null)
                .filter((t): t is HTMLElement => t != null);
            if (tracks.length > 0) gsap.killTweensOf(tracks);
            for (const t of tracks) {
                gsap.set(t, { clearProps: 'transform' });
            }
            gsap.killTweensOf(marqueeLines);
        } else {
            gsap.killTweensOf(allLines);
        }

        this.clearLineStyles(allLines);
        this.el.style.minHeight = '';
    }

    public onDestroy(): void {
        if (this.loopTimeoutId !== null) {
            window.clearTimeout(this.loopTimeoutId);
            this.loopTimeoutId = null;
        }
        this.playToken += 1;
        this.reset();
    }
}

export { SYNERGY_EASE_THEME_CROSS } from '../specs/components/slideshow-captions.specs';
