/**
 * @fileoverview Composant Parallax pour K3UI
 * @description Moteur simpleParallax.js (img/vidéo), repli classique parallax.js (PixelCog),
 * et moteur pointer (calques data-depth, axes X/Y, gyroscope).
 * @see https://github.com/geosigno/simpleParallax.js
 * @see https://github.com/pixelcog/parallax.js/blob/v1.5.0/parallax.js
 * @author K3UI Team
 * @version 2.1.0
 */

import SimpleParallax from 'simple-parallax-js/vanilla';
import { Component } from '../core/base/Component';
import { toComponentClassDef } from '../types/components/component-base';
import type { ParallaxAxis, ParallaxOptions, ParallaxOrientation } from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { setAriaAttributes } from '../utils/dom/aria';
import { LoggerManager } from '../core/managers';
import { Mouse } from '../core/managers/MouseManager';
import { ManagerFactory } from '../core/factories';
import { getParallaxDefaults } from '../specs/components/parallax.specs';

const WRAP_SELECTOR = '.parallax__image';
const IMG_SELECTOR = '.parallax__img';
const VIDEO_SELECTOR = '.parallax__video';
const ORIENTATIONS: ParallaxOrientation[] = [
    'up',
    'right',
    'down',
    'left',
    'up left',
    'up right',
    'down left',
    'down right',
];
const AXES: ParallaxAxis[] = ['x', 'y', 'both'];

interface PointerLayer {
    el: HTMLElement;
    depthX: number;
    depthY: number;
}

type Vec2 = { x: number; y: number };

const clamp = (v: number, min: number, max: number): number =>
    v < min ? min : v > max ? max : v;

const roundPrecision = (v: number, precision: number): number => {
    const p = Math.pow(10, precision);
    return Math.round(v * p) / p;
};

const _defaults: ParallaxOptions = getParallaxDefaults();

export class Parallax extends Component<ParallaxOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    private logger: LoggerManager;
    /** Calque (wrapper) ; le média est .parallax__img ou .parallax__video */
    private wrapEl: HTMLElement | null = null;
    private imgEl: HTMLImageElement | null = null;
    private videoEl: HTMLVideoElement | null = null;
    private activeEngine: 'simple' | 'classic' | 'pointer' = 'classic';
    private classicEventsBound = false;
    private simpleParallaxInstance: SimpleParallax | null = null;
    private scrollRoot: Window | HTMLElement = window;
    private resizeObserver: ResizeObserver | null = null;
    private rafScheduled = false;
    private motionQuery: MediaQueryList | null = null;
    private onMotionChange: (() => void) | null = null;

    /** Ratio largeur / hauteur naturel (fallback jusqu’au chargement) */
    private aspectRatio = 16 / 9;

    // —— État refresh() moteur classique (parallax.js) ——
    private boxWidth = 0;
    private boxHeight = 0;
    private boxOffsetTop = 0;
    private boxOffsetLeft = 0;
    private boxOffsetBottom = 0;
    private boxOffsetRight = 0;
    private imageWidth = 0;
    private imageHeight = 0;
    private offsetLeftPx = 0;
    private offsetBaseTop = 0;
    private offsetBaseLeft = 0;

    // —— Moteur pointer (data-depth) ——
    private pointerLayers: PointerLayer[] = [];
    private pointerTarget: Vec2 = { x: 0, y: 0 };
    private pointerCurrent: Vec2 = { x: 0, y: 0 };
    private pointerRafId = 0;
    private pointerRunning = false;
    private pointerMouse: Mouse | null = null;
    private gyroActive = false;
    private pointerCleanups: Array<() => void> = [];
    /** true si l’axe n’a pas été fourni explicitement (pointer → both) */
    private axisFromDefaults = true;

    static get defaults(): ParallaxOptions {
        return { ..._defaults };
    }

    static getInstance(el: HTMLElement): Parallax | undefined {
        return Component.getInstance(el) as Parallax | undefined;
    }

    static init(
        els: KElement | InitElements<KElement> | string,
        options: Partial<ParallaxOptions> = {}
    ): Parallax[] {
        return Component.init(els, options, toComponentClassDef(Parallax)) as Parallax[];
    }

    constructor(el: HTMLElement, options: Partial<ParallaxOptions> = {}) {
        super(el, options, toComponentClassDef(Parallax));
        this.logger = ManagerFactory.getLoggerManager('[Parallax]');
        const fromHtml = Parallax.readAttributes(el);
        this.axisFromDefaults = options.axis === undefined && fromHtml.axis === undefined;
        this.options = {
            ...Parallax.defaults,
            ...options,
            ...fromHtml,
        };
        this.initCore();
    }

    private static readAttributes(el: HTMLElement): Partial<ParallaxOptions> {
        const out: Partial<ParallaxOptions> = {};
        const speed = el.getAttribute('data-speed');
        if (speed != null) {
            const n = parseFloat(speed);
            if (!Number.isNaN(n)) out.speed = n;
        }
        const engine = el.getAttribute('data-engine');
        if (engine === 'auto' || engine === 'simple' || engine === 'classic' || engine === 'pointer') {
            out.engine = engine;
        }
        const axis = el.getAttribute('data-axis');
        if (axis != null && AXES.includes(axis as ParallaxAxis)) {
            out.axis = axis as ParallaxAxis;
        }
        const img = el.getAttribute('data-image');
        if (img != null) out.image = img;
        const video = el.getAttribute('data-video');
        if (video != null) out.video = video;
        const h = el.getAttribute('data-image-height');
        if (h != null) {
            const n = parseFloat(h);
            if (!Number.isNaN(n) && n > 0) out.imageHeight = n;
        }
        const scale = el.getAttribute('data-scale');
        if (scale != null) {
            const n = parseFloat(scale);
            if (!Number.isNaN(n) && n > 1) out.scale = n;
        }
        const orientation = el.getAttribute('data-orientation');
        if (orientation != null && ORIENTATIONS.includes(orientation as ParallaxOrientation)) {
            out.orientation = orientation as ParallaxOrientation;
        }
        const overflow = el.getAttribute('data-overflow');
        if (overflow === 'true' || overflow === 'false') {
            out.overflow = overflow === 'true';
        }
        const delay = el.getAttribute('data-delay');
        if (delay != null) {
            const n = parseFloat(delay);
            if (!Number.isNaN(n) && n >= 0) out.delay = n;
        }
        const transition = el.getAttribute('data-transition');
        if (transition != null && transition.length > 0) out.transition = transition;
        const maxTransition = el.getAttribute('data-max-transition');
        if (maxTransition != null) {
            const n = parseFloat(maxTransition);
            if (!Number.isNaN(n) && n >= 0) out.maxTransition = n;
        }
        const sc = el.getAttribute('data-scroll-container');
        if (sc != null && sc.length > 0) out.scrollContainer = sc;
        const rm = el.getAttribute('data-respect-reduced-motion');
        if (rm === 'true' || rm === 'false') {
            out.respectReducedMotion = rm === 'true';
        }
        const bleed = el.getAttribute('data-bleed');
        if (bleed != null) {
            const n = parseFloat(bleed);
            if (!Number.isNaN(n) && n >= 0) out.bleed = n;
        }
        const rel = el.getAttribute('data-relative-input');
        if (rel === 'true' || rel === 'false') out.relativeInput = rel === 'true';
        const clip = el.getAttribute('data-clip-relative-input');
        if (clip === 'true' || clip === 'false') out.clipRelativeInput = clip === 'true';
        const hover = el.getAttribute('data-hover-only');
        if (hover === 'true' || hover === 'false') out.hoverOnly = hover === 'true';
        const sx = el.getAttribute('data-strength-x');
        if (sx != null) {
            const n = parseFloat(sx);
            if (!Number.isNaN(n)) out.strengthX = n;
        }
        const sy = el.getAttribute('data-strength-y');
        if (sy != null) {
            const n = parseFloat(sy);
            if (!Number.isNaN(n)) out.strengthY = n;
        }
        const invX = el.getAttribute('data-invert-x');
        if (invX === 'true' || invX === 'false') out.invertX = invX === 'true';
        const invY = el.getAttribute('data-invert-y');
        if (invY === 'true' || invY === 'false') out.invertY = invY === 'true';
        const smooth = el.getAttribute('data-smoothing');
        if (smooth != null) {
            const n = parseFloat(smooth);
            if (!Number.isNaN(n)) out.smoothing = n;
        }
        const gyro = el.getAttribute('data-gyroscope');
        if (gyro === 'true' || gyro === 'false') out.gyroscope = gyro === 'true';
        return out;
    }

    private initCore(): void {
        this.el.classList.add('parallax');
        this.resolveScrollRoot();
        this.activeEngine = this.resolveEngine();
        if (this.activeEngine === 'pointer') {
            this.setupAccessibilityScene();
            this.initPointerEngine();
            this.el.classList.add('parallax--pointer');
            this.setupReducedMotionListener();
            this.logger.info('Parallax initialisé (moteur pointer)');
            return;
        }
        this.ensureLayer();
        this.setupAccessibility();
        if (this.activeEngine === 'simple') {
            this.initSimpleEngine();
            this.setupReducedMotionListener();
            this.logger.info('Parallax initialisé (simpleParallax.js)');
            return;
        }
        this.attachImagePreload();
        this.bindClassicEvents();
        this.observeResize();
        this.setupReducedMotionListener();
        this.refreshLayout();
        this.scheduleUpdate();
        this.logger.info('Parallax initialisé (moteur classique parallax.js)');
    }

    private hasMediaElement(): boolean {
        return Boolean(
            this.imgEl ||
                this.videoEl ||
                this.options.image ||
                this.options.video ||
                this.el.querySelector(`${WRAP_SELECTOR} ${IMG_SELECTOR}, ${WRAP_SELECTOR} ${VIDEO_SELECTOR}`)
        );
    }

    private hasDepthLayers(): boolean {
        return Boolean(this.el.querySelector(this.options.depthSelector));
    }

    private resolveEngine(): 'simple' | 'classic' | 'pointer' {
        const { engine } = this.options;
        if (engine === 'classic') return 'classic';
        if (engine === 'pointer') return 'pointer';
        if (engine === 'simple') {
            if (!this.hasMediaElement()) {
                this.logger.warn('Moteur simple requiert une image ou vidéo ; bascule en classique');
                return 'classic';
            }
            return 'simple';
        }
        // auto
        if (this.hasDepthLayers() && !this.hasMediaElement()) return 'pointer';
        return this.hasMediaElement() ? 'simple' : 'classic';
    }

    /** Axe effectif : pointer sans override → both (référence) ; classic reste sur defaults. */
    private resolveAxis(): ParallaxAxis {
        if (this.activeEngine === 'pointer' && this.axisFromDefaults) {
            return 'both';
        }
        return this.options.axis;
    }

    private resolveScrollRoot(): void {
        const { scrollContainer } = this.options;
        if (!scrollContainer) {
            this.scrollRoot = window;
            return;
        }
        if (typeof scrollContainer === 'string') {
            const node = document.querySelector(scrollContainer);
            this.scrollRoot = node instanceof HTMLElement ? node : window;
            return;
        }
        this.scrollRoot = scrollContainer;
    }

    private ensureLayer(): void {
        let wrap = this.el.querySelector(WRAP_SELECTOR) as HTMLElement | null;
        if (!wrap) {
            wrap = document.createElement('div');
            wrap.className = 'parallax__image';
            this.el.insertBefore(wrap, this.el.firstChild);
        }
        this.wrapEl = wrap;

        this.imgEl = wrap.querySelector(IMG_SELECTOR) as HTMLImageElement | null;
        this.videoEl = wrap.querySelector(VIDEO_SELECTOR) as HTMLVideoElement | null;

        if (this.options.video) {
            if (!this.videoEl) {
                this.videoEl = document.createElement('video');
                this.videoEl.className = 'parallax__video';
                this.videoEl.muted = true;
                this.videoEl.playsInline = true;
                this.videoEl.loop = true;
                this.videoEl.autoplay = true;
                wrap.appendChild(this.videoEl);
            }
            const source = this.videoEl.querySelector('source');
            if (!source) {
                const srcEl = document.createElement('source');
                srcEl.type = 'video/mp4';
                this.videoEl.appendChild(srcEl);
                srcEl.src = this.options.video;
            } else if (source.src !== this.options.video) {
                source.src = this.options.video;
            }
            this.imgEl?.remove();
            this.imgEl = null;
            wrap.style.backgroundImage = '';
            return;
        }

        if (this.options.image) {
            if (!this.imgEl) {
                this.imgEl = document.createElement('img');
                this.imgEl.className = 'parallax__img';
                this.imgEl.alt = '';
                this.imgEl.decoding = 'async';
                this.imgEl.draggable = false;
                wrap.appendChild(this.imgEl);
            }
            const onLoad = (): void => {
                if (this.imgEl && this.imgEl.naturalWidth > 0 && this.imgEl.naturalHeight > 0) {
                    this.aspectRatio = this.imgEl.naturalWidth / this.imgEl.naturalHeight;
                }
                if (this.resolveEngine() === 'simple' && this.simpleParallaxInstance) {
                    this.simpleParallaxInstance.refresh();
                } else if (this.activeEngine === 'classic') {
                    this.refreshLayout();
                    this.scheduleUpdate();
                }
            };
            this.registerEvent(this.imgEl, 'load', onLoad);
            if (this.imgEl.src !== this.options.image) {
                this.imgEl.src = this.options.image;
            }
            if (this.imgEl.complete && this.imgEl.naturalWidth > 0) {
                onLoad();
            }
            this.videoEl?.remove();
            this.videoEl = null;
            wrap.style.backgroundImage = '';
            return;
        }

        if (!this.imgEl && !this.videoEl) {
            const existing = wrap.querySelector(IMG_SELECTOR);
            existing?.remove();
            this.imgEl = null;
            const ratio = Math.max(1.001, this.options.imageHeight);
            this.aspectRatio =
                this.el.offsetWidth > 0 && this.el.offsetHeight > 0
                    ? this.el.offsetWidth / (this.el.offsetHeight * ratio)
                    : 16 / 9;
        }
    }

    private getMediaTarget(): HTMLElement | null {
        return this.videoEl ?? this.imgEl;
    }

    /**
     * Dérive l’échelle simpleParallax à partir de `speed` si besoin.
     */
    private resolveScale(): number {
        const { scale, speed } = this.options;
        if (scale > 1) return scale;
        const clamped = Math.min(1, Math.max(0, speed));
        return Math.max(1.001, 1 + (1 - clamped) * 0.625);
    }

    private buildSimpleParallaxOptions(): ConstructorParameters<typeof SimpleParallax>[1] {
        const container = this.scrollRoot !== window ? (this.scrollRoot as HTMLElement) : undefined;
        return {
            orientation: this.options.orientation,
            scale: this.resolveScale(),
            overflow: this.options.overflow,
            delay: this.options.delay,
            transition: this.options.transition,
            maxTransition: this.options.maxTransition,
            customContainer: container,
            customWrapper: WRAP_SELECTOR,
        };
    }

    private initSimpleEngine(): void {
        this.destroySimpleEngine();
        const media = this.getMediaTarget();
        if (!media || !this.wrapEl) return;
        media.classList.add(this.videoEl ? 'parallax__video' : 'parallax__img');
        this.simpleParallaxInstance = new SimpleParallax(media, this.buildSimpleParallaxOptions());
        this.observeResize();
    }

    private destroySimpleEngine(): void {
        if (this.simpleParallaxInstance) {
            this.simpleParallaxInstance.destroy();
            this.simpleParallaxInstance = null;
        }
    }

    private setupAccessibility(): void {
        if (!this.wrapEl) return;
        setAriaAttributes(this.wrapEl, { 'aria-hidden': true });
    }

    private setupAccessibilityScene(): void {
        // Scène décorative : les calques depth restent dans le flux accessible du contenu texte
    }

    // =========================================================================
    // Moteur pointer (calques data-depth, axes X/Y)
    // =========================================================================

    private initPointerEngine(): void {
        this.destroyPointerEngine();
        this.collectPointerLayers();
        if (this.isReducedMotion()) return;
        this.bindPointerInput();
        if (this.options.gyroscope) this.bindGyroscope();
        this.pointerRunning = true;
        this.pointerLoop();
    }

    private collectPointerLayers(): void {
        const nodes = this.el.querySelectorAll<HTMLElement>(this.options.depthSelector);
        this.pointerLayers = Array.from(nodes).map((layerEl) => {
            const base = parseFloat(layerEl.dataset.depth ?? '0') || 0;
            const dx =
                layerEl.dataset.depthX !== undefined ? parseFloat(layerEl.dataset.depthX) || 0 : base;
            const dy =
                layerEl.dataset.depthY !== undefined ? parseFloat(layerEl.dataset.depthY) || 0 : base;
            layerEl.style.willChange = 'transform';
            layerEl.style.backfaceVisibility = 'hidden';
            return { el: layerEl, depthX: dx, depthY: dy };
        });
    }

    private bindPointerInput(): void {
        const target = this.options.hoverOnly ? this.el : window;
        this.pointerMouse = new Mouse({
            target: target as HTMLElement | Window,
            onMouseMove: (_event, x, y) => this.onPointerMove(x, y),
            onMouseLeave: this.options.hoverOnly
                ? () => {
                      this.setPointerTarget(0, 0);
                  }
                : null,
        });

        const onTouchMove = (e: TouchEvent): void => {
            const t = e.touches[0];
            if (!t) return;
            this.onPointerMove(t.clientX, t.clientY);
        };
        const onTouchEnd = (): void => {
            if (this.options.hoverOnly) this.setPointerTarget(0, 0);
        };
        const touchTarget: EventTarget = this.options.hoverOnly ? this.el : window;
        this.pointerCleanups.push(
            this.registerEvent(touchTarget, 'touchmove', onTouchMove as EventListener, {
                passive: true,
            })
        );
        if (this.options.hoverOnly) {
            this.pointerCleanups.push(
                this.registerEvent(this.el, 'touchend', onTouchEnd as EventListener, {
                    passive: true,
                })
            );
        }
    }

    private bindGyroscope(): void {
        const anyDOE =
            typeof DeviceOrientationEvent !== 'undefined'
                ? (DeviceOrientationEvent as unknown as {
                      requestPermission?: () => Promise<string>;
                  })
                : undefined;
        if (anyDOE && typeof anyDOE.requestPermission === 'function') {
            // iOS 13+ : attendre enableGyroscope() après un geste utilisateur
            return;
        }
        const onGyro = (e: DeviceOrientationEvent): void => this.onGyro(e);
        this.pointerCleanups.push(
            this.registerEvent(window, 'deviceorientation', onGyro as EventListener, {
                passive: true,
            })
        );
        this.gyroActive = true;
    }

    /**
     * Active le gyroscope (requis sur iOS 13+ après un geste utilisateur).
     * @returns true si l’écoute est active
     */
    public async enableGyroscope(): Promise<boolean> {
        const anyDOE =
            typeof DeviceOrientationEvent !== 'undefined'
                ? (DeviceOrientationEvent as unknown as {
                      requestPermission?: () => Promise<string>;
                  })
                : undefined;
        if (anyDOE && typeof anyDOE.requestPermission === 'function') {
            try {
                const res = await anyDOE.requestPermission();
                if (res !== 'granted') return false;
            } catch {
                return false;
            }
        }
        if (!this.gyroActive) {
            const onGyro = (e: DeviceOrientationEvent): void => this.onGyro(e);
            this.pointerCleanups.push(
                this.registerEvent(window, 'deviceorientation', onGyro as EventListener, {
                    passive: true,
                })
            );
            this.gyroActive = true;
        }
        return true;
    }

    private onPointerMove(clientX: number, clientY: number): void {
        let nx: number;
        let ny: number;
        if (this.options.relativeInput) {
            const r = this.el.getBoundingClientRect();
            nx = r.width ? (clientX - r.left) / r.width : 0.5;
            ny = r.height ? (clientY - r.top) / r.height : 0.5;
        } else {
            nx = clientX / window.innerWidth;
            ny = clientY / window.innerHeight;
        }
        let tx = (nx - this.options.originX) * 2;
        let ty = (ny - this.options.originY) * 2;
        if (this.options.clipRelativeInput) {
            tx = clamp(tx, -1, 1);
            ty = clamp(ty, -1, 1);
        }
        this.setPointerTarget(tx, ty);
    }

    private onGyro(e: DeviceOrientationEvent): void {
        const g = e.gamma ?? 0;
        const b = e.beta ?? 0;
        const tx = clamp(g / this.options.gyroRange, -1, 1);
        const ty = clamp(b / this.options.gyroRange, -1, 1);
        this.setPointerTarget(tx, ty);
    }

    private setPointerTarget(tx: number, ty: number): void {
        const axis = this.resolveAxis();
        this.pointerTarget.x = axis === 'y' ? 0 : tx;
        this.pointerTarget.y = axis === 'x' ? 0 : ty;
    }

    private pointerLoop = (): void => {
        if (!this.pointerRunning) return;
        const s = this.options.smoothing;
        this.pointerCurrent.x += (this.pointerTarget.x - this.pointerCurrent.x) * s;
        this.pointerCurrent.y += (this.pointerTarget.y - this.pointerCurrent.y) * s;

        const { invertX, invertY, strengthX, strengthY, precision } = this.options;
        const sx = invertX ? -1 : 1;
        const sy = invertY ? -1 : 1;
        const axis = this.resolveAxis();

        for (const layer of this.pointerLayers) {
            const ox =
                axis === 'y'
                    ? 0
                    : roundPrecision(
                          this.pointerCurrent.x * layer.depthX * strengthX * sx,
                          precision
                      );
            const oy =
                axis === 'x'
                    ? 0
                    : roundPrecision(
                          this.pointerCurrent.y * layer.depthY * strengthY * sy,
                          precision
                      );
            layer.el.style.transform = `translate3d(${ox}px, ${oy}px, 0)`;
        }
        this.pointerRafId = requestAnimationFrame(this.pointerLoop);
    };

    private destroyPointerEngine(): void {
        this.pointerRunning = false;
        cancelAnimationFrame(this.pointerRafId);
        this.pointerMouse?.destroy();
        this.pointerMouse = null;
        for (const cleanup of this.pointerCleanups) {
            cleanup();
        }
        this.pointerCleanups = [];
        this.gyroActive = false;
        for (const layer of this.pointerLayers) {
            layer.el.style.transform = '';
            layer.el.style.willChange = '';
            layer.el.style.backfaceVisibility = '';
        }
        this.pointerLayers = [];
        this.pointerTarget = { x: 0, y: 0 };
        this.pointerCurrent = { x: 0, y: 0 };
    }

    private attachImagePreload(): void {
        const url = this.options.image;
        if (!url) return;
        const pre = new Image();
        pre.onload = () => {
            if (pre.naturalWidth > 0 && pre.naturalHeight > 0) {
                this.aspectRatio = pre.naturalWidth / pre.naturalHeight;
            }
            this.refreshLayout();
            this.scheduleUpdate();
        };
        pre.onerror = () => this.logger.warn('Image parallax introuvable ou bloquée', url);
        pre.src = url;
    }

    private bindClassicEvents(): void {
        if (this.classicEventsBound) return;
        this.registerEvent(this.scrollRoot as EventTarget, 'scroll', () => this.scheduleUpdate(), {
            passive: true,
        });
        this.registerEvent(window, 'resize', () => this.scheduleUpdate(), { passive: true });
        this.classicEventsBound = true;
    }

    private observeResize(): void {
        if (typeof ResizeObserver === 'undefined') return;
        if (this.resizeObserver) return;
        this.resizeObserver = new ResizeObserver(() => {
            if (this.activeEngine === 'simple') {
                this.simpleParallaxInstance?.refresh();
                return;
            }
            if (this.activeEngine === 'pointer') {
                this.collectPointerLayers();
                return;
            }
            this.refreshLayout();
            this.scheduleUpdate();
        });
        this.resizeObserver.observe(this.el);
    }

    private setupReducedMotionListener(): void {
        if (typeof window === 'undefined' || !window.matchMedia) return;
        this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.onMotionChange = () => {
            if (this.activeEngine === 'simple' || this.activeEngine === 'pointer') {
                this.reinitEngine();
                return;
            }
            this.scheduleUpdate();
        };
        if (this.motionQuery.addEventListener) {
            this.motionQuery.addEventListener('change', this.onMotionChange);
        } else {
            this.motionQuery.addListener(this.onMotionChange);
        }
    }

    private isReducedMotion(): boolean {
        if (!this.options.respectReducedMotion) return false;
        if (typeof window === 'undefined' || !window.matchMedia) return false;
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    /** Offsets « document » du bloc (ou du contenu scrollable si root ≠ window), avec bleed */
    private readBoxGeometry(): void {
        const bleed = Math.max(0, this.options.bleed);
        this.boxWidth = this.el.offsetWidth + 2 * bleed;
        this.boxHeight = this.el.offsetHeight + 2 * bleed;

        if (this.scrollRoot === window) {
            const rect = this.el.getBoundingClientRect();
            const st = window.scrollY ?? document.documentElement.scrollTop ?? 0;
            const sl = window.scrollX ?? document.documentElement.scrollLeft ?? 0;
            this.boxOffsetTop = rect.top + st - bleed;
            this.boxOffsetLeft = rect.left + sl - bleed;
        } else {
            const c = this.scrollRoot as HTMLElement;
            const cRect = c.getBoundingClientRect();
            const elRect = this.el.getBoundingClientRect();
            this.boxOffsetTop = elRect.top - cRect.top + c.scrollTop - bleed;
            this.boxOffsetLeft = elRect.left - cRect.left + c.scrollLeft - bleed;
        }
        this.boxOffsetBottom = this.boxOffsetTop + this.boxHeight;
        this.boxOffsetRight = this.boxOffsetLeft + this.boxWidth;
    }

    private getScrollRootMetrics(): {
        scrollTop: number;
        scrollLeft: number;
        winHeight: number;
        winWidth: number;
        docHeight: number;
        docWidth: number;
    } {
        if (this.scrollRoot === window) {
            const scrollTop = window.scrollY ?? document.documentElement.scrollTop ?? 0;
            const scrollLeft = window.scrollX ?? document.documentElement.scrollLeft ?? 0;
            const winHeight = window.innerHeight;
            const winWidth = window.innerWidth;
            const docHeight = Math.max(
                document.documentElement?.scrollHeight ?? 0,
                document.body?.scrollHeight ?? 0
            );
            const docWidth = Math.max(
                document.documentElement?.scrollWidth ?? 0,
                document.body?.scrollWidth ?? 0
            );
            return { scrollTop, scrollLeft, winHeight, winWidth, docHeight, docWidth };
        }
        const c = this.scrollRoot as HTMLElement;
        return {
            scrollTop: c.scrollTop,
            scrollLeft: c.scrollLeft,
            winHeight: c.clientHeight,
            winWidth: c.clientWidth,
            docHeight: c.scrollHeight,
            docWidth: c.scrollWidth,
        };
    }

    /**
     * Recompute image dimensions and base offsets (équivalent Parallax.prototype.refresh).
     * Gère l’axe vertical (historique) et l’axe horizontal si `axis` le demande.
     */
    private refreshLayout(): void {
        this.readBoxGeometry();

        const { winHeight, winWidth, docHeight, docWidth } = this.getScrollRootMetrics();
        const speed = Math.min(1, Math.max(0, this.options.speed));
        const ar = this.aspectRatio > 0 ? this.aspectRatio : 16 / 9;
        const axis = this.options.axis;

        const maxOffsetY = Math.min(this.boxOffsetTop, Math.max(0, docHeight - winHeight));
        const minOffsetY = Math.max(this.boxOffsetTop + this.boxHeight - winHeight, 0);
        const imageHeightMin = Math.floor(this.boxHeight + (maxOffsetY - minOffsetY) * (1 - speed));
        const imageOffsetMinY = Math.floor((this.boxOffsetTop - maxOffsetY) * (1 - speed));

        const maxOffsetX = Math.min(this.boxOffsetLeft, Math.max(0, docWidth - winWidth));
        const minOffsetX = Math.max(this.boxOffsetLeft + this.boxWidth - winWidth, 0);
        const imageWidthMin = Math.floor(this.boxWidth + (maxOffsetX - minOffsetX) * (1 - speed));
        const imageOffsetMinX = Math.floor((this.boxOffsetLeft - maxOffsetX) * (1 - speed));

        if (axis === 'x') {
            // Priorité largeur (scroll horizontal)
            if (imageWidthMin / ar >= this.boxHeight) {
                this.imageWidth = imageWidthMin;
                this.imageHeight = Math.floor(imageWidthMin / ar);
                this.offsetBaseLeft = imageOffsetMinX;
                const margin = this.imageHeight - this.boxHeight;
                this.offsetBaseTop = -Math.floor(margin / 2);
                this.offsetLeftPx = imageOffsetMinX;
            } else {
                this.imageHeight = Math.floor(this.boxHeight);
                this.imageWidth = Math.floor(this.boxHeight * ar);
                this.offsetBaseTop = 0;
                const margin = this.imageWidth - imageWidthMin;
                this.offsetBaseLeft = imageOffsetMinX - Math.floor(margin / 2);
                this.offsetLeftPx = this.offsetBaseLeft;
            }
            return;
        }

        // Axe y (défaut) ou both : logique verticale PixelCog + base X centrée / scroll X
        if (imageHeightMin * ar >= this.boxWidth) {
            this.imageWidth = Math.floor(imageHeightMin * ar);
            this.imageHeight = imageHeightMin;
            this.offsetBaseTop = imageOffsetMinY;
            const margin = this.imageWidth - this.boxWidth;
            this.offsetLeftPx = -Math.floor(margin / 2);
            this.offsetBaseLeft =
                axis === 'both' ? imageOffsetMinX - Math.floor(margin / 2) : this.offsetLeftPx;
        } else {
            this.imageWidth = Math.floor(this.boxWidth);
            this.imageHeight = Math.floor(this.boxWidth / ar);
            this.offsetLeftPx = 0;
            this.offsetBaseLeft = axis === 'both' ? imageOffsetMinX : 0;
            const margin = this.imageHeight - imageHeightMin;
            this.offsetBaseTop = imageOffsetMinY - Math.floor(margin / 2);
        }
    }

    private scheduleUpdate(): void {
        if (this.rafScheduled) return;
        this.rafScheduled = true;
        requestAnimationFrame(() => {
            this.rafScheduled = false;
            this.updateTransform();
        });
    }

    /**
     * render() parallax.js + extension horizontale selon `axis`.
     */
    private updateTransform(): void {
        if (!this.wrapEl) return;

        if (this.isReducedMotion()) {
            if (this.wrapEl) this.wrapEl.style.visibility = 'visible';
            if (this.imgEl) {
                this.applyTransform(this.offsetBaseLeft, this.offsetBaseTop, true);
            } else {
                this.applyBackgroundFallback(this.offsetBaseLeft, this.offsetBaseTop);
            }
            return;
        }

        const { scrollTop, scrollLeft, winHeight, winWidth } = this.getScrollRootMetrics();
        const scrollBottom = scrollTop + winHeight;
        const scrollRight = scrollLeft + winWidth;
        const axis = this.options.axis;

        const inViewY = this.boxOffsetBottom > scrollTop && this.boxOffsetTop <= scrollBottom;
        const inViewX = this.boxOffsetRight > scrollLeft && this.boxOffsetLeft <= scrollRight;
        const inView = axis === 'x' ? inViewX : axis === 'both' ? inViewY || inViewX : inViewY;

        const speed = Math.min(1, Math.max(0, this.options.speed));
        const mirrorTop = this.boxOffsetTop - scrollTop;
        const mirrorLeft = this.boxOffsetLeft - scrollLeft;

        let offsetTopPx = this.offsetBaseTop;
        let offsetLeftPx = this.offsetLeftPx;

        if (axis === 'y' || axis === 'both') {
            offsetTopPx = this.offsetBaseTop - mirrorTop * (1 - speed);
        }
        if (axis === 'x' || axis === 'both') {
            offsetLeftPx = this.offsetBaseLeft - mirrorLeft * (1 - speed);
        }

        if (!inView) {
            this.wrapEl.style.visibility = 'hidden';
            return;
        }
        this.wrapEl.style.visibility = 'visible';

        if (this.imgEl) {
            this.applyTransform(offsetLeftPx, offsetTopPx, false);
            return;
        }

        this.applyBackgroundFallback(offsetLeftPx, offsetTopPx);
    }

    private applyTransform(offsetX: number, offsetY: number, reduced: boolean): void {
        if (!this.imgEl) return;
        this.imgEl.style.width = `${this.imageWidth}px`;
        this.imgEl.style.height = `${this.imageHeight}px`;
        const x = reduced ? this.offsetBaseLeft : offsetX;
        const y = reduced ? this.offsetBaseTop : offsetY;
        this.imgEl.style.transform = `translate3d(${Math.round(x * 100) / 100}px, ${Math.round(y * 100) / 100}px, 0)`;
    }

    private applyBackgroundFallback(offsetX: number, offsetY: number): void {
        if (!this.wrapEl) return;
        const w = Math.max(1, this.imageWidth);
        const h = Math.max(1, this.imageHeight);
        this.wrapEl.style.backgroundSize = `${w}px ${h}px`;
        this.wrapEl.style.backgroundPosition = `${Math.round(offsetX * 100) / 100}px ${Math.round(offsetY * 100) / 100}px`;
        this.wrapEl.style.backgroundRepeat = 'no-repeat';
    }

    /**
     * Réinitialise le moteur actif (changement d’options ou prefers-reduced-motion).
     */
    public reinitEngine(): void {
        const next = this.resolveEngine();
        if (next === this.activeEngine) {
            if (next === 'simple') {
                this.destroySimpleEngine();
                this.initSimpleEngine();
            } else if (next === 'pointer') {
                this.initPointerEngine();
            } else {
                this.refreshLayout();
                this.scheduleUpdate();
            }
            return;
        }
        this.destroySimpleEngine();
        this.destroyPointerEngine();
        this.activeEngine = next;
        if (next === 'pointer') {
            this.initPointerEngine();
            this.el.classList.add('parallax--pointer');
            return;
        }
        this.el.classList.remove('parallax--pointer');
        this.ensureLayer();
        this.setupAccessibility();
        if (next === 'simple') {
            this.initSimpleEngine();
            return;
        }
        this.bindClassicEvents();
        this.refreshLayout();
        this.scheduleUpdate();
    }

    /**
     * Met à jour les options et réinitialise l’effet.
     * @param options Options partielles
     */
    public updateOptions(options: Partial<ParallaxOptions>): void {
        if (options.axis !== undefined) this.axisFromDefaults = false;
        this.options = { ...this.options, ...options };
        this.resolveScrollRoot();
        if (this.resolveEngine() !== 'pointer') {
            this.ensureLayer();
        }
        this.reinitEngine();
    }

    /**
     * Recalcul complet (resize, nouvelle image, calques depth, etc.)
     */
    public refresh(): void {
        if (this.activeEngine === 'simple') {
            this.simpleParallaxInstance?.refresh();
            return;
        }
        if (this.activeEngine === 'pointer') {
            this.collectPointerLayers();
            return;
        }
        this.refreshLayout();
        this.scheduleUpdate();
    }

    /** Moteur actuellement actif */
    public getEngine(): 'simple' | 'classic' | 'pointer' {
        return this.activeEngine;
    }

    override destroy(): void {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        if (this.motionQuery && this.onMotionChange) {
            if (this.motionQuery.removeEventListener) {
                this.motionQuery.removeEventListener('change', this.onMotionChange);
            } else {
                this.motionQuery.removeListener(this.onMotionChange);
            }
        }
        this.motionQuery = null;
        this.onMotionChange = null;
        this.destroySimpleEngine();
        this.destroyPointerEngine();
        this.el.classList.remove('parallax--pointer');
        this.wrapEl = null;
        this.imgEl = null;
        this.videoEl = null;
        this.logger.info('Parallax détruit');
        super.destroy();
    }
}

if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-parallax')) {
    customElements.define(
        'k3ui-parallax',
        class K3UIParallaxElement extends HTMLElement {
            connectedCallback(): void {
                if (!this.hasAttribute('data-initialized')) {
                    this.setAttribute('data-initialized', 'true');
                }
            }

            disconnectedCallback(): void {
                const instance = Parallax.getInstance(this);
                instance?.destroy();
            }
        }
    );
}
