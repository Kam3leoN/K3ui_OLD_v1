/**
 * @fileoverview Composant Marquee pour K3UI
 * @description Défilement horizontal en mode infinite (RAF) ou classic (CSS/RAF ping-pong).
 */

import { Component } from '../core/base/Component';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import type { MarqueeDirection, MarqueeMode, MarqueeOptions, MarqueeRotate } from '../types/components';
import { InitElements, KElement, PriorityLevel } from '../types/base';
import { getMarqueeDefaults } from '../specs/components/marquee.specs';

const _defaults: MarqueeOptions = getMarqueeDefaults();

export class Marquee extends Component<MarqueeOptions> {
  readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

  private container!: HTMLDivElement;
  private track!: HTMLDivElement;
  private rotateWrap: HTMLDivElement | null = null;
  private resizeHandler: () => void;
  private running = false;
  private rafId = 0;
  private lastTimestamp = 0;
  private currentX = 0;
  private loopWidth = 0;
  private velocityPxMs = 0;
  private loopCount = 0;
  private iterCount = 0;
  private startTimer: number | null = null;
  private destroyed = false;
  private ppStart = 0;
  private ppEnd = 0;
  private ppX = 0;
  private ppDir = -1;
  private ppVel = 0;
  private ppLastTs = 0;
  private ppPassCount = 0;
  private originalChildren: Node[] = [];

  static get defaults(): MarqueeOptions {
    return { ..._defaults };
  }

  static getInstance(el: HTMLElement): Marquee | undefined {
    return Component.getInstance(el) as Marquee | undefined;
  }

  static init(
    els: KElement | InitElements<KElement> | string,
    options: Partial<MarqueeOptions> = {}
  ): Marquee[] {
    return Component.init(els, options, toComponentClassDef(Marquee)) as Marquee[];
  }

  constructor(el: HTMLElement, options: Partial<MarqueeOptions> = {}) {
    super(el, options, toComponentClassDef(Marquee));
    const fromData = Marquee.readDataOptions(el);
    this.options = {
      ...Marquee.defaults,
      ...fromData,
      ...options,
    };
    this.options.rotate = Marquee.normalizeRotate(String(this.options.rotate ?? '')) ?? null;
    this.options.rotateLength = Math.max(100, Number(this.options.rotateLength || 300));

    this.resizeHandler = this.debounce(() => this.onResize(), 200);
    this.mount();
  }

  private static readDataOptions(el: HTMLElement): Partial<MarqueeOptions> {
    const mode = el.dataset.mode;
    const direction = el.dataset.direction;
    const duration = el.dataset.duration ? Number(el.dataset.duration) : undefined;
    const speed = el.dataset.speed ? Number(el.dataset.speed) : undefined;
    const gap = el.dataset.gap ? Number(el.dataset.gap) : undefined;
    const autoplay = el.dataset.autoplay;
    const loop = el.dataset.loop ? Number(el.dataset.loop) : undefined;
    const startDelay = el.dataset.startDelay ? Number(el.dataset.startDelay) : undefined;
    const rotate = Marquee.normalizeRotate(el.dataset.rotate);
    const rotateLength = el.dataset.rotateLength ? Number(el.dataset.rotateLength) : undefined;

    return {
      mode: mode === 'classic' ? 'classic' : 'infinite',
      direction: direction === 'right' ? 'right' : 'left',
      rotate,
      rotateLength: Number.isFinite(rotateLength) ? Math.max(100, Number(rotateLength)) : undefined,
      duration: Number.isFinite(duration) ? Math.max(0.1, Number(duration)) : undefined,
      speed: Number.isFinite(speed) ? Math.max(1, Number(speed)) : undefined,
      gap: Number.isFinite(gap) ? Math.max(0, Number(gap)) : undefined,
      pauseOnHover: el.hasAttribute('data-pause-on-hover'),
      autoplay: autoplay !== 'false',
      noFade: el.classList.contains('--no-fade'),
      pingPong: el.hasAttribute('data-ping-pong'),
      loop: Number.isFinite(loop) ? Math.max(0, Math.floor(Number(loop))) : undefined,
      startDelay: Number.isFinite(startDelay) ? Math.max(0, Math.floor(Number(startDelay))) : undefined,
    };
  }

  private static normalizeRotate(value?: string): MarqueeRotate {
    if (!value) return null;
    const v = value.trim().toLowerCase();
    if (v === 'cw' || v === 'clockwise') return 'clockwise';
    if (v === 'ccw' || v === 'counterclockwise' || v === 'counterclowise') return 'counterclockwise';
    return null;
  }

  private mount(): void {
    this.el.classList.add('marquee');

    this.container = document.createElement('div');
    this.container.className = 'marquee-container';
    if (this.options.noFade) this.container.classList.add('--no-fade');
    this.container.setAttribute('data-mode', this.options.mode);
    this.container.setAttribute('data-direction', this.options.direction);
    this.container.style.setProperty('--marquee-duration', `${this.options.duration}s`);
    this.container.style.setProperty('--marquee-gap', `${this.options.gap}px`);

    this.track = document.createElement('div');
    this.track.className = 'marquee-track';

    this.originalChildren = Array.from(this.el.childNodes);
    this.originalChildren.forEach((child) => this.track.appendChild(child));
    this.container.appendChild(this.track);

    if (this.options.rotate) {
      this.rotateWrap = document.createElement('div');
      this.rotateWrap.className = 'marquee-rotate-wrap';
      this.rotateWrap.setAttribute('data-rotate', this.options.rotate);
      this.applyRotateLength();
      this.rotateWrap.appendChild(this.container);
      this.el.appendChild(this.rotateWrap);
    } else {
      this.rotateWrap = null;
      this.el.appendChild(this.container);
    }

    this.attachListeners();
    window.addEventListener('resize', this.resizeHandler);

    if (this.options.mode === 'infinite') {
      requestAnimationFrame(() => {
        this.setupInfinite();
        if (this.options.autoplay) this.play();
      });
      return;
    }

    this.setupClassic();
    if (this.options.autoplay) this.play();
  }

  private applyRotateLength(): void {
    if (!this.rotateWrap) return;
    const parentHeight = this.el.parentElement?.clientHeight || 0;
    const length = parentHeight > 0 ? parentHeight : this.options.rotateLength;
    this.rotateWrap.style.setProperty('--rotate-length', `${Math.max(100, length)}px`);
  }

  play(delay?: number): void {
    if (!this.options.enabled || this.running) return;
    const effectiveDelay = this.options.mode === 'classic'
      ? (delay !== undefined ? delay : this.options.startDelay)
      : 0;

    if (effectiveDelay > 0) {
      this.startTimer = window.setTimeout(() => {
        this.startTimer = null;
        this.doPlay();
      }, effectiveDelay);
      this.container.setAttribute('data-state', 'delayed');
      return;
    }

    this.doPlay();
  }

  private doPlay(): void {
    if (this.running) return;
    this.running = true;
    this.container.setAttribute('data-state', 'playing');
    this.options.onOpenStart?.(this.el);

    if (this.options.mode === 'infinite') {
      this.lastTimestamp = 0;
      this.rafId = requestAnimationFrame((ts) => this.tick(ts));
    } else if (this.options.pingPong) {
      this.ppSetup();
      this.ppLastTs = 0;
      this.rafId = requestAnimationFrame((ts) => this.ppTick(ts));
    } else {
      this.track.style.animationPlayState = 'running';
    }

    this.options.onOpenEnd?.(this.el);
  }

  stop(): void {
    if (this.startTimer != null) {
      clearTimeout(this.startTimer);
      this.startTimer = null;
    }
    if (!this.running) return;
    this.options.onCloseStart?.(this.el);
    this.running = false;
    this.container.setAttribute('data-state', 'paused');

    if (this.options.mode === 'infinite' || this.options.pingPong) {
      cancelAnimationFrame(this.rafId);
    } else {
      this.track.style.animationPlayState = 'paused';
    }

    this.options.onCloseEnd?.(this.el);
  }

  setSpeed(pxPerSec: number): void {
    this.options.speed = Math.max(1, pxPerSec);
    this.computeVelocity();
  }

  setDuration(seconds: number): void {
    this.options.duration = Math.max(0.1, seconds);
    this.container.style.setProperty('--marquee-duration', `${this.options.duration}s`);
    this.computeVelocity();
    if (this.options.mode === 'classic') this.reapplyClassicAnimation();
  }

  setDirection(direction: MarqueeDirection): void {
    this.options.direction = direction;
    this.container.setAttribute('data-direction', direction);
    if (this.options.mode === 'infinite') {
      this.currentX = -(this.loopWidth + this.currentX);
      this.currentX = Math.max(-this.loopWidth, Math.min(0, this.currentX));
      this.track.style.transform = `translateX(${this.currentX}px)`;
    } else if (!this.options.pingPong) {
      this.reapplyClassicAnimation();
    }
  }

  private setupInfinite(): void {
    this.track.style.transform = 'none';
    this.currentX = 0;
    this.removeClones();
    this.loopWidth = this.measureOriginalsWidth();
    this.injectClones();
    this.computeVelocity();
    this.currentX = this.options.direction === 'left' ? 0 : -this.loopWidth;
    this.track.style.transform = `translateX(${this.currentX}px)`;
  }

  private measureOriginalsWidth(): number {
    const kids = Array.from(this.track.children).filter((el) => !el.hasAttribute('data-clone'));
    if (kids.length === 0) return 100;
    const first = kids[0] as HTMLElement;
    const last = kids[kids.length - 1] as HTMLElement;
    const groupWidth = (last.offsetLeft + last.offsetWidth) - first.offsetLeft;
    return Math.max(1, groupWidth + this.options.gap);
  }

  private removeClones(): void {
    Array.from(this.track.children)
      .filter((el) => el.hasAttribute('data-clone'))
      .forEach((el) => el.remove());
  }

  private injectClones(): void {
    const screenWidth = typeof window.screen !== 'undefined' ? window.screen.width : window.innerWidth;
    const safeWidth = Math.max(window.innerWidth, screenWidth) * 3;
    const clonesNeeded = Math.ceil(safeWidth / this.loopWidth) + 2;
    const originals = Array.from(this.track.children);

    for (let i = 0; i < clonesNeeded; i++) {
      originals.forEach((original) => {
        const clone = original.cloneNode(true) as HTMLElement;
        clone.setAttribute('data-clone', 'true');
        clone.setAttribute('aria-hidden', 'true');
        this.track.appendChild(clone);
      });
    }
  }

  private computeVelocity(): void {
    this.velocityPxMs = this.options.speed != null
      ? this.options.speed / 1000
      : this.loopWidth / (this.options.duration * 1000);
  }

  private tick(timestamp: number): void {
    if (!this.running) return;
    if (this.lastTimestamp === 0) this.lastTimestamp = timestamp;
    const delta = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;
    const step = this.velocityPxMs * delta;

    if (this.options.direction === 'left') {
      this.currentX -= step;
      if (this.currentX <= -this.loopWidth) this.currentX += this.loopWidth;
    } else {
      this.currentX += step;
      if (this.currentX >= 0) this.currentX -= this.loopWidth;
    }

    this.track.style.transform = `translateX(${this.currentX}px)`;
    this.rafId = requestAnimationFrame((ts) => this.tick(ts));
  }

  private setupClassic(): void {
    this.track.style.minWidth = 'unset';
    this.track.style.width = 'max-content';
    if (this.options.pingPong) {
      this.track.classList.add('marquee-track--pingpong');
      this.ppSetup();
      return;
    }
    this.track.classList.add('marquee-track--classic');
    this.track.style.animationPlayState = 'paused';
    this.track.addEventListener('animationiteration', this.onAnimationIteration);
  }

  private ppSetup(): void {
    const containerW = this.container.offsetWidth;
    const trackW = this.track.offsetWidth;
    this.ppStart = containerW;
    this.ppEnd = -trackW;
    this.ppVel = this.options.speed != null
      ? this.options.speed / 1000
      : (containerW + trackW) / (this.options.duration * 1000);
    this.ppDir = -1;
    this.ppX = this.ppStart;
    this.ppPassCount = 0;
    this.track.style.transform = `translateX(${this.ppX}px)`;
  }

  private ppTick(timestamp: number): void {
    if (!this.running) return;
    if (this.ppLastTs === 0) this.ppLastTs = timestamp;
    const delta = timestamp - this.ppLastTs;
    this.ppLastTs = timestamp;

    this.ppX += this.ppDir * (this.ppVel * delta);
    if (this.ppX <= this.ppEnd) {
      this.ppX = this.ppEnd;
      this.ppDir = 1;
      this.onPingPongPassEnd();
    } else if (this.ppX >= this.ppStart) {
      this.ppX = this.ppStart;
      this.ppDir = -1;
      this.onPingPongPassEnd();
    }

    this.track.style.transform = `translateX(${this.ppX}px)`;
    this.rafId = requestAnimationFrame((ts) => this.ppTick(ts));
  }

  private onPingPongPassEnd(): void {
    if (this.options.loop === 0) return;
    this.ppPassCount += 1;
    if (this.ppPassCount >= this.options.loop * 2) {
      this.ppPassCount = 0;
      this.loopCount = this.options.loop;
      this.stop();
      this.container.setAttribute('data-state', 'finished');
    }
  }

  private onAnimationIteration = (): void => {
    if (this.options.loop === 0) return;
    this.iterCount += 1;
    if (this.iterCount >= this.options.loop) {
      this.iterCount = 0;
      this.loopCount = this.options.loop;
      this.stop();
      this.container.setAttribute('data-state', 'finished');
      this.track.style.animationPlayState = 'paused';
    }
  };

  private reapplyClassicAnimation(): void {
    if (this.options.mode !== 'classic') return;
    if (this.options.pingPong) {
      this.ppPassCount = 0;
      this.ppLastTs = 0;
      this.ppSetup();
      if (this.running) {
        cancelAnimationFrame(this.rafId);
        this.rafId = requestAnimationFrame((ts) => this.ppTick(ts));
      }
      return;
    }

    this.track.classList.remove('marquee-track--classic');
    void this.track.offsetWidth;
    this.track.classList.add('marquee-track--classic');
    this.track.style.animationPlayState = this.running ? 'running' : 'paused';
  }

  private attachListeners(): void {
    if (this.options.pauseOnHover) {
      this.container.addEventListener('mouseenter', () => this.stop());
      this.container.addEventListener('mouseleave', () => this.play());
    }
  }

  private onResize(): void {
    if (this.options.mode === 'infinite') {
      const wasRunning = this.running;
      this.stop();
      this.track.style.transform = 'none';
      const oldLoop = this.loopWidth;
      this.removeClones();
      this.loopWidth = this.measureOriginalsWidth();
      if (oldLoop > 0) {
        const phase = ((this.currentX % oldLoop) + oldLoop) % oldLoop;
        const ratio = phase / oldLoop;
        this.currentX = -(ratio * this.loopWidth);
      } else {
        this.currentX = 0;
      }
      this.injectClones();
      this.computeVelocity();
      this.track.style.transform = `translateX(${this.currentX}px)`;
      if (wasRunning) this.play();
      this.applyRotateLength();
      return;
    }

    if (this.options.pingPong) {
      this.ppSetup();
    } else {
      this.reapplyClassicAnimation();
    }
    this.applyRotateLength();
  }

  private debounce(fn: () => void, wait: number): () => void {
    let t: number | null = null;
    return () => {
      if (t != null) window.clearTimeout(t);
      t = window.setTimeout(fn, wait);
    };
  }

  getMode(): MarqueeMode {
    return this.options.mode;
  }

  getLoopCount(): number {
    return this.loopCount;
  }

  override destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.stop();
    window.removeEventListener('resize', this.resizeHandler);
    this.track.removeEventListener('animationiteration', this.onAnimationIteration);

    const originals = Array.from(this.track.children).filter((el) => !el.hasAttribute('data-clone'));
    this.el.innerHTML = '';
    originals.forEach((child) => this.el.appendChild(child));
    super.destroy();
  }
}

if (
  typeof window !== 'undefined' &&
  typeof customElements !== 'undefined' &&
  !customElements.get('k3ui-marquee')
) {
  customElements.define(
    'k3ui-marquee',
    class extends HTMLElement {
      connectedCallback(): void {
        if (!this.classList.contains('marquee')) this.classList.add('marquee');
      }
    }
  );
}

