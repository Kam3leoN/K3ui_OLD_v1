/**
 * @fileoverview Composant Pace pour K3UI – barre de progression de chargement de page
 * @description
 * Pace instrumente le chargement de page (readyState, history, XHR).
 * Lorsqu'il est actif, il monkey-patch `window.XMLHttpRequest` pour suivre les requêtes
 * réseau ; le patch est retiré dans `destroy()` / `unpatchXHR()`.
 * AutoInit est opt-in : sélecteur `[data-k3ui-pace="on"]` (sur `html`/`body`).
 * Pour un chargement global, surcharger `selectors.Pace` et/ou appeler `K.Pace.init()`.
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import type { PaceOptions, PaceTheme } from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { getK3uiGlobal } from '../types/global/k3ui-window';

const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

function isValidHexColor(value: string | null | undefined): value is string {
    return typeof value === 'string' && value.length > 0 && HEX_COLOR_REGEX.test(value);
}
import { setAriaAttributes } from '../utils/dom/aria';
import { ManagerFactory } from '../core/factories';
import { LocaleManager } from '../core/managers';
import { getPaceDefaults } from '../specs/components/pace.specs';

const _defaults: PaceOptions = getPaceDefaults();

/** Temps courant (performance.now ou Date) */
function now(): number {
    return (typeof performance !== 'undefined' && performance?.now) ? performance.now() : +new Date();
}

const raf = typeof requestAnimationFrame !== 'undefined'
    ? requestAnimationFrame
    : (fn: FrameRequestCallback) => window.setTimeout(fn, 50);
const caf = typeof cancelAnimationFrame !== 'undefined'
    ? cancelAnimationFrame
    : (id: number) => window.clearTimeout(id);

/** Boucle d'animation ~33ms par frame */
function runAnimation(fn: (frameTime: number, next: () => void) => void): number {
    let last = now();
    const tick = () => {
        const diff = now() - last;
        if (diff >= 33) {
            last = now();
            fn(diff, () => { raf(tick); });
        } else {
            return window.setTimeout(tick, 33 - diff);
        }
    };
    raf(tick);
    return 0;
}

/** Moyenne des valeurs absolues */
function avgAmplitude(arr: number[]): number {
    if (!arr.length) return 0;
    const sum = arr.reduce((s, v) => s + Math.abs(v), 0);
    return sum / arr.length;
}

/** Source avec propriété progress (0–100) */
interface PaceSource {
    progress: number;
    elements?: { progress: number }[];
}

/** Suivi état du document */
class DocumentMonitor implements PaceSource {
    progress: number;
    private readonly states: Record<string, number> = {
        loading: 0,
        interactive: 50,
        complete: 100,
    };

    constructor() {
        const state = document.readyState as keyof typeof DocumentMonitor.prototype.states;
        this.progress = this.states[state] ?? 100;
        if (typeof document.onreadystatechange !== 'function' || !document.onreadystatechange) {
            document.addEventListener('readystatechange', () => {
                const s = document.readyState as keyof typeof this.states;
                if (this.states[s] != null) this.progress = this.states[s];
            });
        }
    }
}

/** Suivi d'un sélecteur (attente qu'il soit présent) */
class ElementTracker {
    progress = 0;
    private readonly selector: string;
    private readonly callback: () => void;
    private readonly checkInterval: number;

    constructor(selector: string, callback: () => void, checkInterval: number) {
        this.selector = selector;
        this.callback = callback;
        this.checkInterval = checkInterval;
        this.check();
    }

    private check(): void {
        if (document.querySelector(this.selector)) {
            this.progress = 100;
            this.callback();
        } else {
            window.setTimeout(() => this.check(), this.checkInterval);
        }
    }
}

/** Suivi de plusieurs éléments */
class ElementMonitor implements PaceSource {
    progress = 0;
    elements: ElementTracker[] = [];
    private doneCount = 0;

    constructor(selectors: string[], checkInterval: number) {
        const complete = () => {
            this.doneCount++;
            if (this.doneCount >= selectors.length) this.progress = 100;
        };
        selectors.forEach(sel => this.elements.push(new ElementTracker(sel, complete, checkInterval)));
    }
}

/** Suivi du lag event loop */
class EventLagMonitor implements PaceSource {
    progress = 0;

    constructor(
        minSamples: number,
        sampleCount: number,
        lagThreshold: number,
    ) {
        const samples: number[] = [];
        let last = now();
        let points = 0;
        const interval = window.setInterval(() => {
            const diff = now() - last - 50;
            last = now();
            samples.push(diff);
            if (samples.length > sampleCount) samples.shift();
            const avg = avgAmplitude(samples);
            if (++points >= minSamples && avg < lagThreshold) {
                this.progress = 100;
                window.clearInterval(interval);
            } else {
                this.progress = 100 * (3 / (avg + 3));
            }
        }, 50);
    }
}

/** Interception XHR pour suivi des requêtes */
let _xhrPatched = false;
const _OriginalXHR = typeof XMLHttpRequest !== 'undefined' ? window.XMLHttpRequest : null;
const requestListeners: Array<(type: string, url: string, request: XMLHttpRequest) => void> = [];
let _xhrPatchUsers = 0;

function patchXHR(): void {
    if (_xhrPatched || !_OriginalXHR) return;
    _xhrPatched = true;
    window.XMLHttpRequest = function XHR(this: XMLHttpRequest) {
        const req = new _OriginalXHR!();
        const open = req.open.bind(req);
        req.open = function (
            method: string,
            url: string | URL,
            async?: boolean,
            username?: string | null,
            password?: string | null
        ) {
            requestListeners.forEach((fn) => fn(method, String(url), req));
            return open(method, url, async ?? true, username, password);
        };
        return req;
    } as unknown as typeof XMLHttpRequest;
}

function unpatchXHR(): void {
    if (!_xhrPatched || !_OriginalXHR) return;
    window.XMLHttpRequest = _OriginalXHR;
    _xhrPatched = false;
}

/** Tracker pour une requête XHR */
class XHRRequestTracker {
    progress = 0;
    private readonly req: XMLHttpRequest;
    private readonly completeCallback: (t: XHRRequestTracker) => void;

    constructor(req: XMLHttpRequest, completeCallback: (t: XHRRequestTracker) => void) {
        this.req = req;
        this.completeCallback = completeCallback;
        if (typeof ProgressEvent !== 'undefined') {
            req.addEventListener('progress', (ev: ProgressEvent) => {
                if (ev.lengthComputable) this.progress = (100 * ev.loaded) / ev.total;
                else this.progress += (100 - this.progress) / 2;
            });
            ['load', 'abort', 'timeout', 'error'].forEach(ev => {
                req.addEventListener(ev, () => {
                    this.progress = 100;
                    completeCallback(this);
                });
            });
        } else {
            const orig = req.onreadystatechange;
            req.onreadystatechange = (_ev: Event) => {
                if (req.readyState === 0 || req.readyState === 4) {
                    this.progress = 100;
                    completeCallback(this);
                } else if (req.readyState === 3) {
                    this.progress = 50;
                }
                if (orig) {
                    orig.call(req, _ev);
                }
            };
        }
    }
}

/** Suivi des requêtes AJAX */
class AjaxMonitor implements PaceSource {
    progress = 0;
    elements: XHRRequestTracker[] = [];
    private readonly ignoreURLs: (string | RegExp)[];
    private readonly trackMethods: string[];

    constructor(
        ignoreURLs: (string | RegExp)[],
        trackMethods: string[],
    ) {
        this.ignoreURLs = ignoreURLs;
        this.trackMethods = trackMethods;
    }

    watch(type: string, _url: string, request: XMLHttpRequest): void {
        const url = _url || '';
        if (this.ignoreURLs.some(p => typeof p === 'string' ? url.indexOf(p) !== -1 : p.test(url))) return;
        if (this.trackMethods.indexOf(type.toUpperCase()) === -1) return;
        this.elements.push(new XHRRequestTracker(request, (t) => {
            this.elements = this.elements.filter(e => e !== t);
        }));
    }
}

/** Scaler pour lisser la progression */
class Scaler {
    last = 0;
    sinceLastUpdate = 0;
    rate: number;
    catchup = 0;
    progress = 0;
    lastProgress = 0;
    done = false;
    private readonly source: PaceSource | null;
    private readonly opts: PaceOptions;

    constructor(source: PaceSource | null, opts: PaceOptions) {
        this.source = source;
        this.opts = opts;
        this.rate = opts.initialRate;
        this.progress = source ? this.getProgress(source) : 0;
        this.last = this.progress;
    }

    private getProgress(s: PaceSource): number {
        if ('elements' in s && Array.isArray(s.elements)) {
            /** Aucune requête XHR suivie (ex. AjaxMonitor au repos) → considéré terminé */
            if (s.elements.length === 0) return 100;
            const sum = s.elements.reduce((a, e) => a + e.progress, 0);
            return sum / s.elements.length;
        }
        return s.progress;
    }

    tick(frameTime: number, val?: number): number {
        const v = val ?? (this.source ? this.getProgress(this.source) : 0);
        if (v >= 100) this.done = true;
        if (v === this.last) this.sinceLastUpdate += frameTime;
        else {
            if (this.sinceLastUpdate) this.rate = (v - this.last) / this.sinceLastUpdate;
            this.catchup = (v - this.progress) / this.opts.catchupTime;
            this.sinceLastUpdate = 0;
            this.last = v;
        }
        if (v > this.progress) this.progress += this.catchup * frameTime;
        const scaling = 1 - Math.pow(this.progress / 100, this.opts.easeFactor);
        this.progress += scaling * this.rate * frameTime;
        this.progress = Math.min(this.lastProgress + this.opts.maxProgressPerFrame, this.progress);
        this.progress = Math.max(0, Math.min(100, this.progress));
        this.lastProgress = this.progress;
        return this.progress;
    }
}

/**
 * Composant Pace – barre de chargement en haut de page
 */
export class Pace extends Component<PaceOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    private logger = ManagerFactory.getLoggerManager('[Pace]');
    private barEl: HTMLElement | null = null;
    private backdropEl: HTMLElement | null = null;
    private progressEl: HTMLElement | null = null;
    private progress = 0;
    private lastRenderedProgress = -1;
    private running = false;
    private animationId: number | null = null;
    private startTime = 0;

    private documentSource: DocumentMonitor | null = null;
    private elementSource: ElementMonitor | null = null;
    private eventLagSource: EventLagMonitor | null = null;
    private ajaxSource: AjaxMonitor | null = null;
    private sources: PaceSource[] = [];
    private scalers: Scaler[][] = [];
    private uniScaler: Scaler | null = null;
    private cancelRequested = false;
    private _unpatchHistory: (() => void) | null = null;
    private _requestListenerWatch: ((type: string, url: string, request: XMLHttpRequest) => void) | null = null;
    private _requestListenerRestart: ((type: string, url: string, request: XMLHttpRequest) => void) | null = null;

    static get defaults(): PaceOptions {
        return { ..._defaults };
    }

    static getInstance(el: HTMLElement): Pace | undefined {
        return Component.getInstance(el) as Pace | undefined;
    }

    static init(
        els: KElement | InitElements<KElement> | string,
        options: Partial<PaceOptions> = {}
    ): Pace | Pace[] {
        return Component.init(els, options, toComponentClassDef(Pace)) as Pace | Pace[];
    }

    constructor(el: HTMLElement, options: Partial<PaceOptions> = {}) {
        super(el, options, toComponentClassDef(Pace));
        this.options = { ...Pace.defaults, ...options };
        this.init();
    }

    private init(): void {
        this.createSources();
        this.uniScaler = new Scaler(null, this.options);
        if (this.options.startOnPageLoad) this.start();
    }

    private createSources(): void {
        this.documentSource = new DocumentMonitor();
        this.sources.push(this.documentSource);

        const elOpts = this.options.elements;
        if (elOpts?.selectors?.length) {
            this.elementSource = new ElementMonitor(elOpts.selectors, elOpts.checkInterval ?? 100);
            this.sources.push(this.elementSource);
        }

        const lagOpts = this.options.eventLag;
        if (lagOpts) {
            this.eventLagSource = new EventLagMonitor(
                lagOpts.minSamples,
                lagOpts.sampleCount,
                lagOpts.lagThreshold,
            );
            this.sources.push(this.eventLagSource);
        }

        if (this.options.ajax && Array.isArray(this.options.ajax.trackMethods)) {
            patchXHR();
            _xhrPatchUsers++;
            this.ajaxSource = new AjaxMonitor(
                this.options.ajax.ignoreURLs ?? [],
                this.options.ajax.trackMethods ?? ['GET'],
            );
            this.sources.push(this.ajaxSource);
            this._requestListenerWatch = (type, url, req) => {
                if (this.ajaxSource) this.ajaxSource.watch(type, url, req);
            };
            requestListeners.push(this._requestListenerWatch);
            const after = this.options.restartOnRequestAfter ?? 500;
            this._requestListenerRestart = (_type, _url, req) => {
                if (this.running) return;
                window.setTimeout(() => {
                    const active = req.readyState > 0 && req.readyState < 4;
                    if (active && Pace.getInstance(this.el) === this) this.restart();
                }, typeof after === 'number' ? after : 0);
            };
            requestListeners.push(this._requestListenerRestart);
        }

        if (this.options.restartOnPushState && typeof history.pushState !== 'undefined') {
            const self = this;
            const origPush = history.pushState.bind(history);
            const origReplace = history.replaceState.bind(history);
            history.pushState = function (this: History, ...args: Parameters<History['pushState']>) {
                if (Pace.getInstance(self.el) === self) self.restart();
                return origPush.apply(this, args);
            };
            history.replaceState = function (this: History, ...args: Parameters<History['replaceState']>) {
                if (Pace.getInstance(self.el) === self) self.restart();
                return origReplace.apply(this, args);
            };
            this._unpatchHistory = () => {
                history.pushState = origPush;
                history.replaceState = origReplace;
            };
        }
    }

    private getBarElement(): HTMLElement {
        if (this.barEl) return this.barEl;
        const target = document.querySelector(this.options.target);
        if (!target || !(target instanceof HTMLElement)) {
            throw new Error('Pace: target not found');
        }
        const className = this.options.className ? ` ${this.options.className}` : '';
        this.barEl = document.createElement('div');
        this.barEl.className = 'pace pace-active';
        const theme: PaceTheme = this.options.theme ?? 'minimal';
        this.barEl.classList.add(`pace--${theme}`);
        if (isValidHexColor(this.options.colorOnTrack)) {
            this.barEl.style.setProperty('--pace-track-color', this.options.colorOnTrack);
        }
        if (isValidHexColor(this.options.colorOnProgress)) {
            this.barEl.style.setProperty('--pace-bar-color', this.options.colorOnProgress);
        }
        if (this.options.backdrop) {
            this.backdropEl = document.createElement('div');
            this.backdropEl.className = 'pace-backdrop';
            this.barEl.appendChild(this.backdropEl);
        }
        this.progressEl = document.createElement('div');
        this.progressEl.className = `pace-progress${className}`;
        this.progressEl.innerHTML = '<div class="pace-progress-inner"></div>';
        if (theme === 'material') {
            const loaderWrap = document.createElement('div');
            loaderWrap.className = 'pace-material-loader';
            const loaderEl = document.createElement('div');
            loaderEl.className = 'loading-indicator loading-indicator--container';
            loaderEl.setAttribute('data-size', '96');
            loaderWrap.appendChild(loaderEl);
            this.progressEl.appendChild(loaderWrap);
        }
        this.barEl.appendChild(this.progressEl);
        const activity = document.createElement('div');
        activity.className = 'pace-activity';
        this.barEl.appendChild(activity);

        if (target.firstChild) target.insertBefore(this.barEl, target.firstChild);
        else target.appendChild(this.barEl);

        document.body.classList.remove('pace-done');
        document.body.classList.add('pace-running');

        const inner = this.progressEl.querySelector('.pace-progress-inner');
        this.progressEl.setAttribute('role', 'progressbar');
        const ariaLabel = LocaleManager.t('pace.ariaProgress');
        setAriaAttributes(this.progressEl, { label: ariaLabel, valueMin: 0, valueMax: 100, valueNow: 0 });
        if (inner) setAriaAttributes(inner as HTMLElement, { hidden: true });

        if (theme === 'material') {
            const loaderEl = this.barEl.querySelector('.pace-material-loader .loading-indicator') as HTMLElement;
            getK3uiGlobal()?.Loader?.init(loaderEl);
        }

        return this.barEl;
    }

    private render(): void {
        const target = document.querySelector(this.options.target);
        if (!target) return;
        this.getBarElement();
        if (!this.progressEl?.firstElementChild) return;
        const inner = this.progressEl.firstElementChild as HTMLElement;
        const theme = this.options.theme ?? 'minimal';
        const isCounter = theme === 'counter';
        const isMaterial = theme === 'material';
        if (!isCounter && !isMaterial) {
            const t = `translate3d(${this.progress}%, 0, 0)`;
            inner.style.setProperty('-webkit-transform', t);
            inner.style.setProperty('-ms-transform', t);
            inner.style.transform = t;
        } else {
            inner.style.removeProperty('transform');
            inner.style.removeProperty('-webkit-transform');
            inner.style.removeProperty('-ms-transform');
        }
        const pct = Math.floor(this.progress);
        if (this.lastRenderedProgress !== pct) {
            inner.setAttribute('data-progress-text', `${pct}%`);
            const progressStr = this.progress >= 100 ? '99' : (this.progress < 10 ? '0' : '') + pct;
            inner.setAttribute('data-progress', progressStr);
            setAriaAttributes(this.progressEl!, { valueNow: pct });
            this.lastRenderedProgress = pct;
        }
    }

    private finish(): void {
        const bar = this.barEl;
        if (bar) {
            bar.classList.remove('pace-active');
            bar.classList.add('pace-inactive');
        }
        document.body.classList.remove('pace-running');
        document.body.classList.add('pace-done');
    }

    private barDone(): boolean {
        return this.progress >= 100;
    }

    /** Démarre la barre de progression */
    start(): void {
        if (this.running) return;
        this.options.onOpenStart?.(this.el);
        this.running = true;
        this.cancelRequested = false;
        try {
            this.getBarElement();
        } catch {
            window.setTimeout(() => this.start(), 50);
            return;
        }
        if (!document.querySelector('.pace')) {
            window.setTimeout(() => this.start(), 50);
            return;
        }
        this.options.onOpenEnd?.(this.el);
        this.go();
    }

    private go(): void {
        this.startTime = now();
        this.render();
        const opts = this.options;
        const self = this;

        const tick = (frameTime: number, enqueueNext: () => void) => {
            if (self.cancelRequested) return;

            let count = 0;
            let sum = 0;
            let done = true;

            self.sources.forEach((source, i) => {
                const list: PaceSource[] = source.elements?.length ? source.elements : [source];
                if (!self.scalers[i]) self.scalers[i] = [];
                list.forEach((elem, j) => {
                    if (!self.scalers[i][j]) self.scalers[i][j] = new Scaler(elem, opts);
                    const scaler = self.scalers[i][j];
                    done = done && scaler.done;
                    if (!scaler.done) {
                        count++;
                        sum += scaler.tick(frameTime);
                    }
                });
            });

            const avg = count > 0 ? sum / count : 100;
            self.progress = self.uniScaler!.tick(frameTime, avg);
            self.render();

            if (self.barDone() || done || self.cancelRequested) {
                self.progress = 100;
                self.render();
                self.options.onCloseStart?.(self.el);
                const delay = Math.max(
                    opts.ghostTime,
                    Math.max(opts.minTime - (now() - self.startTime), 0),
                );
                window.setTimeout(() => {
                    self.finish();
                    self.running = false;
                    self.options.onCloseEnd?.(self.el);
                }, delay);
            } else {
                enqueueNext();
            }
        };

        runAnimation(tick);
    }

    /** Arrête et détruit la barre (réinitialise les sources) */
    stop(): void {
        this.cancelRequested = true;
        this.running = false;
        if (this.barEl?.parentNode) this.barEl.parentNode.removeChild(this.barEl);
        this.barEl = null;
        this.backdropEl = null;
        this.progressEl = null;
        this.progress = 0;
        this.lastRenderedProgress = -1;
        this.sources = [];
        this.scalers = [];
        this.documentSource = null;
        this.elementSource = null;
        this.eventLagSource = null;
        this.ajaxSource = null;
        this.createSources();
        this.uniScaler = new Scaler(null, this.options);
    }

    /** Redémarre la barre (stop puis start) */
    restart(): void {
        this.stop();
        this.start();
    }

    /** Indique si la barre est en cours d'exécution */
    isRunning(): boolean {
        return this.running;
    }

    override destroy(): void {
        if (this._unpatchHistory) {
            this._unpatchHistory();
            this._unpatchHistory = null;
        }
        if (this._requestListenerWatch) {
            const idx = requestListeners.indexOf(this._requestListenerWatch);
            if (idx >= 0) requestListeners.splice(idx, 1);
            this._requestListenerWatch = null;
        }
        if (this._requestListenerRestart) {
            const idx = requestListeners.indexOf(this._requestListenerRestart);
            if (idx >= 0) requestListeners.splice(idx, 1);
            this._requestListenerRestart = null;
        }
        if (_xhrPatchUsers > 0) {
            _xhrPatchUsers--;
        }
        if (_xhrPatchUsers === 0) {
            unpatchXHR();
        }
        this.stop();
        this.logger.info('Pace destroyed');
        super.destroy();
    }
}
