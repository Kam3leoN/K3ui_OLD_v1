/**
 * @fileoverview Composant Loader pour K3UI
 * @description Material Design 3 — morph SMIL sur paths SVG bruts (assets/shapes)
 * @author K3UI Team
 * @version 2.1.0
 */

import { Component } from '../core/base/Component';
import { toComponentClassDef } from '../types/components/component-base';
import type { LoaderOptions } from '../types/components';
import { PriorityLevel, InitElements } from '../types/base';
import { setAriaAttributes } from '../utils/dom/aria';
import { ManagerFactory } from '../core/factories';
import { LocaleManager } from '../core/managers';
import { getPreferReducedMotion } from '../utils/accessibility';
import {
    getLoaderDefaults,
    LOADING_INDICATOR_SHAPES,
    LOADING_INDICATOR_SHAPE_CONTAINER_RATIO,
    LOADING_INDICATOR_SIZE_MIN,
    LOADING_INDICATOR_SIZE_MAX,
} from '../specs/components/loader.specs';
import { getK3uiComponentWindowOptions } from '../core/autoinit/window-options';
import {
    isMorphableShape,
    MORPHABLE_SHAPE_NAMES,
    getMorphSvgViewBox,
    MORPH_CENTER,
    getMorphablePath,
    getMorphablePathsForSequence,
    getShapeViewportOffset,
    type MorphableShapeName,
} from '../utils/loading-indicator';
import {
    applyLoadingIndicatorMotionVars,
    computeMorphAnimationState,
} from '../utils/loading-indicator/animator';

const _defaults: LoaderOptions = getLoaderDefaults();

function readDataOptions(el: HTMLElement): Partial<LoaderOptions> {
    const o: Partial<LoaderOptions> = {};
    if (el.dataset.mode != null) o.mode = el.dataset.mode === 'cycle' ? 'cycle' : 'morph';
    if (el.dataset.morphShapeSequence != null) {
        o.morphShapeSequence = el.dataset.morphShapeSequence.split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (el.dataset.morphDuration != null) o.morphDuration = parseInt(el.dataset.morphDuration, 10) || _defaults.morphDuration;
    if (el.dataset.size != null) o.size = parseInt(el.dataset.size, 10) || _defaults.size;
    if (el.dataset.container != null) o.container = el.dataset.container !== 'false';
    if (el.dataset.center != null) o.center = el.dataset.center !== 'false';
    if (el.dataset.cycleInterval != null) o.cycleInterval = parseInt(el.dataset.cycleInterval, 10) || _defaults.cycleInterval;
    if (el.dataset.rotationDuration != null) o.rotationDuration = parseInt(el.dataset.rotationDuration, 10) || _defaults.rotationDuration;
    if (el.dataset.assetsPath != null) o.assetsPath = el.dataset.assetsPath;
    if (el.dataset.blur != null) o.blur = el.dataset.blur !== 'false' && el.dataset.blur !== '0';
    if (el.dataset.paused != null) o.paused = el.dataset.paused === 'true';
    if (el.dataset.progress != null) {
        const p = parseFloat(el.dataset.progress);
        o.progress = Number.isFinite(p) ? Math.max(0, Math.min(1, p)) : null;
    }
    if (el.dataset.indicatorColor != null) o.indicatorColor = el.dataset.indicatorColor;
    if (el.dataset.containerColor != null) o.containerColor = el.dataset.containerColor;
    return o;
}

function resolveAssetsPath(
    el: HTMLElement,
    options: Partial<LoaderOptions>,
    globalOptions: Partial<LoaderOptions>
): string {
    const dataPath = el.dataset.assetsPath;
    if (dataPath) return dataPath;
    if (options.assetsPath) return options.assetsPath;
    if (globalOptions?.assetsPath) return globalOptions.assetsPath;
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length > 0) return `/${parts[0]}/assets/images/shapes/`;
    return '/assets/images/shapes/';
}

export class Loader extends Component<LoaderOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    private logger = ManagerFactory.getLoggerManager('[Loader]');
    private cycleTimer: ReturnType<typeof setInterval> | null = null;
    private shapeIndex = 0;
    private imgEl: HTMLImageElement | null = null;
    private wrapperEl: HTMLElement | null = null;
    private svgEl: SVGSVGElement | null = null;
    private morphGroupEl: SVGGElement | null = null;
    private morphPathAGroup: SVGGElement | null = null;
    private morphPathBGroup: SVGGElement | null = null;
    private morphPathAEl: SVGPathElement | null = null;
    private morphPathBEl: SVGPathElement | null = null;
    private morphPaths: string[] = [];
    private morphShapeNames: MorphableShapeName[] = [];
    private morphRafId: number | null = null;
    private morphStartMs = 0;

    static get defaults(): LoaderOptions {
        return { ..._defaults };
    }

    static getInstance(el: HTMLElement): Loader | undefined {
        return Component.getInstance(el) as Loader | undefined;
    }

    static init(
        els: HTMLElement | InitElements<HTMLElement> | string,
        options: Partial<LoaderOptions> = {}
    ): Loader[] {
        const resolved: HTMLElement | InitElements<HTMLElement> =
            typeof els === 'string' ? document.querySelectorAll<HTMLElement>(els) : els;
        const result = Component.init(resolved, options, toComponentClassDef(Loader));
        return Array.isArray(result) ? (result as Loader[]) : [result as Loader];
    }

    constructor(el: HTMLElement, options: Partial<LoaderOptions> = {}) {
        super(el, options, toComponentClassDef(Loader));

        const globalOptions = getK3uiComponentWindowOptions('Loader');
        const dataOptions = readDataOptions(el);
        const assetsPath = resolveAssetsPath(el, { ...options, ...dataOptions }, globalOptions);

        this.options = {
            ..._defaults,
            ...globalOptions,
            ...options,
            ...dataOptions,
            assetsPath,
        };
        if (!this.options.morphShapeSequence?.length) {
            this.options.morphShapeSequence = [..._defaults.morphShapeSequence];
        }
        this.options.size = Math.max(LOADING_INDICATOR_SIZE_MIN, Math.min(LOADING_INDICATOR_SIZE_MAX, this.options.size));

        el.style.width = `${this.options.size}px`;
        el.style.height = `${this.options.size}px`;

        this.init();
    }

    private applyColors(): void {
        const { container, indicatorColor, containerColor } = this.options;

        if (indicatorColor) {
            this.el.style.color = indicatorColor;
            this.el.style.setProperty('--loading-indicator-color', indicatorColor);
        } else {
            this.el.style.color = '';
            this.el.style.removeProperty('--loading-indicator-color');
        }

        if (container) {
            if (containerColor) {
                this.el.style.backgroundColor = containerColor;
                this.el.style.setProperty('--loading-indicator-container-color', containerColor);
            } else {
                this.el.style.backgroundColor = '';
                this.el.style.removeProperty('--loading-indicator-container-color');
            }
        } else {
            this.el.style.backgroundColor = '';
            this.el.style.removeProperty('--loading-indicator-container-color');
        }
    }

    private buildMorphDOM(): void {
        const { size, container, morphShapeSequence, progress, paused } = this.options;
        const prefersReduced = getPreferReducedMotion();

        let sequence = morphShapeSequence.filter(isMorphableShape) as MorphableShapeName[];
        if (sequence.length === 0) {
            sequence = [...MORPHABLE_SHAPE_NAMES];
        }
        this.morphShapeNames = sequence;
        this.morphPaths = getMorphablePathsForSequence(sequence);

        const shapeSize = Math.round(size * LOADING_INDICATOR_SHAPE_CONTAINER_RATIO);
        const shapeContainer = document.createElement('div');
        shapeContainer.className = 'loading-indicator__shape-container';
        shapeContainer.setAttribute('aria-hidden', 'true');
        shapeContainer.style.width = `${shapeSize}px`;
        shapeContainer.style.height = `${shapeSize}px`;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;
        svg.setAttribute('viewBox', getMorphSvgViewBox());
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        svg.setAttribute('aria-hidden', 'true');
        svg.classList.add('loading-indicator__svg');

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const gA = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const gB = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const pathA = document.createElementNS('http://www.w3.org/2000/svg', 'path') as SVGPathElement;
        const pathB = document.createElementNS('http://www.w3.org/2000/svg', 'path') as SVGPathElement;
        pathA.setAttribute('fill', 'currentColor');
        pathB.setAttribute('fill', 'currentColor');
        pathA.setAttribute('d', this.morphPaths[0] ?? getMorphablePath(sequence[0]!));
        pathB.setAttribute('d', this.morphPaths[1] ?? this.morphPaths[0] ?? getMorphablePath(sequence[0]!));
        pathB.style.opacity = '0';
        gA.appendChild(pathA);
        gB.appendChild(pathB);
        g.appendChild(gA);
        g.appendChild(gB);
        svg.appendChild(g);

        applyLoadingIndicatorMotionVars(this.el);

        const shouldAnimate = !prefersReduced && !paused && progress == null;

        this.morphGroupEl = g;
        this.morphPathAGroup = gA;
        this.morphPathBGroup = gB;
        this.morphPathAEl = pathA;
        this.morphPathBEl = pathB;

        this.applyShapeGroupOffset(gA, sequence[0]!);
        this.applyShapeGroupOffset(gB, sequence[1] ?? sequence[0]!);

        if (shouldAnimate) {
            this.morphStartMs = performance.now();
            this.startMorphRaf();
        } else if (progress != null && Number.isFinite(progress)) {
            this.applyProgressPath(progress);
        } else {
            this.applyMorphState(
                computeMorphAnimationState(0, {
                    shapeCount: this.morphPaths.length,
                    contextEl: this.el,
                    reducedMotion: prefersReduced,
                })
            );
        }

        shapeContainer.appendChild(svg);

        this.el.classList.add('loading-indicator');
        if (container) this.el.classList.add('loading-indicator--container');
        this.el.style.width = `${size}px`;
        this.el.style.height = `${size}px`;
        this.applyColors();

        setAriaAttributes(this.el, {
            role: 'progressbar',
            label: LocaleManager.t('loadingIndicator.ariaProgress'),
            valuetext: LocaleManager.t('loadingIndicator.ariaProgress'),
        });
        this.el.setAttribute('aria-live', 'polite');
        this.applyBlurBackdrop();
        this.el.appendChild(shapeContainer);
        this.svgEl = svg;
    }

    private applyShapeGroupOffset(group: SVGGElement, shape: MorphableShapeName): void {
        const { x, y } = getShapeViewportOffset(shape);
        group.setAttribute('transform', `translate(${x} ${y})`);
    }

    private applyMorphState(state: ReturnType<typeof computeMorphAnimationState>): void {
        if (!this.morphPathAEl || !this.morphPathBEl || !this.morphGroupEl || this.morphPaths.length === 0) return;

        const { indexA, indexB, morphT, rotationDeg } = state;
        const shapeA = this.morphShapeNames[indexA] ?? this.morphShapeNames[0]!;
        const shapeB = this.morphShapeNames[indexB] ?? shapeA;

        this.morphPathAEl.setAttribute('d', this.morphPaths[indexA]!);
        this.morphPathBEl.setAttribute('d', this.morphPaths[indexB]!);
        if (this.morphPathAGroup) this.applyShapeGroupOffset(this.morphPathAGroup, shapeA);
        if (this.morphPathBGroup) this.applyShapeGroupOffset(this.morphPathBGroup, shapeB);
        this.morphPathAEl.style.opacity = String(1 - morphT);
        this.morphPathBEl.style.opacity = String(morphT);
        this.morphGroupEl.setAttribute(
            'transform',
            `rotate(${rotationDeg} ${MORPH_CENTER} ${MORPH_CENTER})`
        );
    }

    private startMorphRaf(): void {
        if (this.options.mode !== 'morph' || this.options.paused || this.options.progress != null) return;
        if (getPreferReducedMotion()) return;

        this.stopMorphRaf();
        if (this.morphStartMs === 0) {
            this.morphStartMs = performance.now();
        }

        const tick = (now: number): void => {
            if (this.options.paused || this.options.progress != null || !this.morphPathAEl) {
                this.morphRafId = null;
                return;
            }
            const elapsed = now - this.morphStartMs;
            const state = computeMorphAnimationState(elapsed, {
                shapeCount: this.morphPaths.length,
                contextEl: this.el,
            });
            this.applyMorphState(state);
            this.morphRafId = requestAnimationFrame(tick);
        };

        this.morphRafId = requestAnimationFrame(tick);
    }

    private stopMorphRaf(): void {
        if (this.morphRafId != null) {
            cancelAnimationFrame(this.morphRafId);
            this.morphRafId = null;
        }
    }

    private applyProgressPath(progress: number): void {
        if (!this.morphPathAEl || this.morphPaths.length === 0) return;
        const p = Math.max(0, Math.min(1, progress));
        const n = this.morphPaths.length;
        const idx = Math.min(n - 1, Math.floor(p * n));
        const shape = this.morphShapeNames[idx] ?? this.morphShapeNames[0]!;
        this.morphPathAEl.setAttribute('d', this.morphPaths[idx]!);
        this.morphPathAEl.style.opacity = '1';
        if (this.morphPathAGroup) this.applyShapeGroupOffset(this.morphPathAGroup, shape);
        if (this.morphPathBEl) {
            this.morphPathBEl.style.opacity = '0';
        }
        if (this.morphGroupEl) {
            this.morphGroupEl.setAttribute('transform', `rotate(0 ${MORPH_CENTER} ${MORPH_CENTER})`);
        }
    }

    private buildCycleDOM(): void {
        const { size, container } = this.options;
        const assetsPath = this.options.assetsPath || '';
        const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';
        const base = assetsPath.startsWith('http') ? assetsPath : `${origin}${assetsPath.startsWith('/') ? assetsPath : `/${assetsPath}`}`;

        const shapeSize = Math.round(size * LOADING_INDICATOR_SHAPE_CONTAINER_RATIO);
        const shapeContainer = document.createElement('div');
        shapeContainer.className = 'loading-indicator__shape-container';
        shapeContainer.setAttribute('aria-hidden', 'true');
        shapeContainer.style.width = `${shapeSize}px`;
        shapeContainer.style.height = `${shapeSize}px`;

        const wrapper = document.createElement('div');
        wrapper.className = 'loading-indicator__wrapper';
        wrapper.setAttribute('aria-hidden', 'true');
        wrapper.style.width = '100%';
        wrapper.style.height = '100%';

        const img = document.createElement('img');
        img.className = 'loading-indicator__shape';
        img.alt = '';
        img.setAttribute('aria-hidden', 'true');
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        img.src = `${base}${LOADING_INDICATOR_SHAPES[0]}.svg`;
        wrapper.appendChild(img);
        shapeContainer.appendChild(wrapper);

        this.el.classList.add('loading-indicator');
        if (container) this.el.classList.add('loading-indicator--container');
        this.el.style.width = `${size}px`;
        this.el.style.height = `${size}px`;
        this.applyColors();

        setAriaAttributes(this.el, {
            role: 'progressbar',
            label: LocaleManager.t('loadingIndicator.ariaProgress'),
            valuetext: LocaleManager.t('loadingIndicator.ariaProgress'),
        });
        this.el.setAttribute('aria-live', 'polite');
        this.applyBlurBackdrop();
        this.el.appendChild(shapeContainer);
        this.wrapperEl = wrapper;
        this.imgEl = img;

        const duration = this.options.rotationDuration;
        const prefersReduced = getPreferReducedMotion();
        if (!prefersReduced && duration > 0 && !this.options.paused) {
            wrapper.style.animation = `loading-indicator-rotate ${duration}ms linear infinite`;
        }
    }

    private applyBlurBackdrop(): void {
        if (!this.options.blur) return;
        const px = 6;
        this.el.style.setProperty('-webkit-backdrop-filter', `blur(${px}px)`);
        this.el.style.setProperty('backdrop-filter', `blur(${px}px)`);
    }

    private buildDOM(): void {
        if (this.options.mode === 'morph') {
            this.buildMorphDOM();
        } else {
            this.buildCycleDOM();
        }
    }

    private cycleShape(): void {
        if (!this.imgEl || !this.options.assetsPath) return;
        this.shapeIndex = (this.shapeIndex + 1) % LOADING_INDICATOR_SHAPES.length;
        const name = LOADING_INDICATOR_SHAPES[this.shapeIndex];
        const base = this.options.assetsPath.startsWith('http')
            ? this.options.assetsPath
            : `${window.location.origin}${this.options.assetsPath.startsWith('/') ? this.options.assetsPath : `/${this.options.assetsPath}`}`;
        this.imgEl.src = `${base}${name}.svg`;
    }

    private startCycle(): void {
        this.stopCycle();
        if (this.options.mode !== 'cycle' || this.options.paused) return;
        const interval = Math.max(80, this.options.cycleInterval);
        this.cycleTimer = setInterval(() => this.cycleShape(), interval);
    }

    private stopCycle(): void {
        if (this.cycleTimer) {
            clearInterval(this.cycleTimer);
            this.cycleTimer = null;
        }
    }

    private pauseSvgAnimations(): void {
        this.stopMorphRaf();
    }

    private unpauseSvgAnimations(): void {
        if (this.options.mode === 'morph') {
            this.startMorphRaf();
        }
    }

    private init(): void {
        if (this.options.onOpenStart) this.options.onOpenStart(this.el);

        if (!this.imgEl && !this.svgEl) this.buildDOM();
        if (this.options.mode === 'cycle') this.startCycle();
        if (this.options.paused) this.pauseSvgAnimations();

        this.logger.debug('Loader initialisé');
        if (this.options.onOpenEnd) this.options.onOpenEnd(this.el);
    }

    stop(): void {
        this.options.paused = true;
        this.stopCycle();
        this.pauseSvgAnimations();
    }

    start(): void {
        this.options.paused = false;
        if (this.options.mode === 'cycle') {
            this.startCycle();
        } else {
            this.unpauseSvgAnimations();
        }
    }

    setProgress(value: number | null): void {
        if (value === null) {
            this.options.progress = null;
            this.morphStartMs = performance.now();
            this.startMorphRaf();
        } else {
            this.options.progress = Math.max(0, Math.min(1, value));
            this.stopMorphRaf();
            this.applyProgressPath(this.options.progress);
        }
    }

    setSize(dp: number): void {
        const size = Math.max(LOADING_INDICATOR_SIZE_MIN, Math.min(LOADING_INDICATOR_SIZE_MAX, Math.round(dp)));
        this.options.size = size;
        this.el.style.setProperty('width', `${size}px`, 'important');
        this.el.style.setProperty('height', `${size}px`, 'important');
        this.el.style.flexShrink = '0';
        const shapeSize = Math.round(size * LOADING_INDICATOR_SHAPE_CONTAINER_RATIO);
        const shapeContainer = this.el.querySelector<HTMLElement>('.loading-indicator__shape-container');
        if (shapeContainer) {
            shapeContainer.style.setProperty('width', `${shapeSize}px`, 'important');
            shapeContainer.style.setProperty('height', `${shapeSize}px`, 'important');
        }
    }

    override destroy(): void {
        if (this.options.onCloseStart) this.options.onCloseStart(this.el);
        this.stopCycle();
        this.stopMorphRaf();
        this.imgEl = null;
        this.wrapperEl = null;
        this.svgEl = null;
        this.morphGroupEl = null;
        this.morphPathAGroup = null;
        this.morphPathBGroup = null;
        this.morphPathAEl = null;
        this.morphPathBEl = null;
        this.morphPaths = [];
        this.morphShapeNames = [];
        if (this.options.onCloseEnd) this.options.onCloseEnd(this.el);
        super.destroy();
    }
}

if (typeof window !== 'undefined' && typeof customElements !== 'undefined') {
    if (!customElements.get('k3ui-loader')) {
        customElements.define('k3ui-loader', class extends HTMLElement {
            connectedCallback(): void {
                if (!this.hasAttribute('data-initialized')) {
                    this.setAttribute('data-initialized', 'true');
                }
            }
            disconnectedCallback(): void {
                const instance = Loader.getInstance(this as unknown as HTMLElement);
                if (instance && typeof instance.destroy === 'function') instance.destroy();
            }
        });
    }
    if (!customElements.get('k3ui-loading-indicator')) {
        customElements.define('k3ui-loading-indicator', class extends HTMLElement {
            connectedCallback(): void {
                if (!this.hasAttribute('data-initialized')) {
                    this.setAttribute('data-initialized', 'true');
                }
            }
            disconnectedCallback(): void {
                const instance = Loader.getInstance(this as unknown as HTMLElement);
                if (instance && typeof instance.destroy === 'function') instance.destroy();
            }
        });
    }
}
