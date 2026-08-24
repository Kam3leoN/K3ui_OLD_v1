/**
 * @fileoverview Composant Perspective (slider 3D) pour K3UI
 * @description Slider avec effets de perspective 3D (wave, coverflow, carousel, cube, etc.)
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import type { PerspectiveOptions, PerspectiveEffectType } from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { setAriaAttributes } from '../utils/dom/aria';
import { LoggerManager, LocaleManager } from '../core/managers';
import { getPerspectiveDefaults } from '../specs/components/perspective.specs';
import { getPointerCoords, supportsPointerEvents } from '../utils/dom/pointer';

const _defaults: PerspectiveOptions = getPerspectiveDefaults();

const SLIDE_SELECTOR = '.perspective__slide';
const INNER_SELECTOR = '.perspective__slide-inner';
const NAV_PREV_SELECTOR = '.perspective__nav--prev';
const NAV_NEXT_SELECTOR = '.perspective__nav--next';
const INDICATORS_SELECTOR = '.perspective__indicators';
const EFFECT_CLASS_PREFIX = 'perspective--effect-';

/**
 * Classe Perspective pour K3UI
 */
export class Perspective extends Component<PerspectiveOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;
    private logger: LoggerManager;
    private slides: HTMLElement[] = [];
    private currentIndex: number = 0;
    private autoplayTimer: ReturnType<typeof setInterval> | null = null;
    private navPrev: HTMLElement | null = null;
    private navNext: HTMLElement | null = null;
    private indicatorsContainer: HTMLElement | null = null;
    private transitionTimeouts: ReturnType<typeof setTimeout>[] = [];

    static get defaults(): PerspectiveOptions {
        return { ..._defaults };
    }

    static getInstance(el: HTMLElement): Perspective | undefined {
        return Component.getInstance(el) as Perspective | undefined;
    }

    static init(
        els: KElement | InitElements<KElement> | string,
        options: Partial<PerspectiveOptions> = {}
    ): Perspective | Perspective[] {
        return Component.init(els, options, toComponentClassDef(Perspective)) as Perspective | Perspective[];
    }

    constructor(el: HTMLElement, options: Partial<PerspectiveOptions> = {}) {
        super(el, options, toComponentClassDef(Perspective));
        this.logger = LoggerManager.create('[Perspective]');
        const dataOrientation = el.getAttribute('data-orientation');
        const orientation = dataOrientation === 'vertical' ? 'vertical' : 'horizontal';
        this.options = { ...Perspective.defaults, ...options, orientation };
        this.currentIndex = this.options.focus;
        this.init();
    }

    private init(): void {
        this.el.classList.add('perspective');
        this.slides = Array.from(this.el.querySelectorAll(SLIDE_SELECTOR));
        if (this.slides.length === 0) {
            const children = Array.from(this.el.children).filter(
                (c): c is HTMLElement => c instanceof HTMLElement && !c.classList.contains('perspective__nav')
            );
            children.forEach((c) => {
                c.classList.add('perspective__slide');
                if (!c.querySelector(INNER_SELECTOR)) {
                    const inner = document.createElement('div');
                    inner.className = 'perspective__slide-inner';
                    while (c.firstChild) inner.appendChild(c.firstChild);
                    c.appendChild(inner);
                }
            });
            this.slides = children;
        }
        if (this.slides.length === 0) {
            this.logger.warn('Aucune slide trouvée');
            return;
        }
        this.applyEffect(this.options.effect);
        this.applyOrientation(this.options.orientation);
        this.applyTransitionDuration();
        this.applyIndicatorsPosition(this.options.indicatorsPosition);
        this.navPrev = this.el.querySelector(NAV_PREV_SELECTOR);
        this.navNext = this.el.querySelector(NAV_NEXT_SELECTOR);
        this.setupNavAria();
        if (this.options.indicators) this.addIndicators();
        this.updateSlides();
        this.slide(this.currentIndex, true);
        this.setupEvents();
        if (this.options.navigation.enabled) this.showNavigation();
        else this.hideNavigation();
        if (this.options.autoplay.enabled) this.startAutoplay();
        if (this.options.shadows.enabled) this.addShadows();
        this.logger.info('Perspective initialisé');
    }

    private applyTransitionDuration(): void {
        const inMs = this.options.inDuration;
        const outMs = this.options.outDuration;
        const totalMs = inMs + outMs;
        this.el.style.setProperty('--perspective-transition-duration', `${totalMs / 2}ms`);
        this.el.style.setProperty('--perspective-in-duration', `${inMs}ms`);
        this.el.style.setProperty('--perspective-out-duration', `${outMs}ms`);
    }

    private applyIndicatorsPosition(position: 'top' | 'bottom'): void {
        this.el.classList.remove('perspective--indicators-top', 'perspective--indicators-bottom');
        this.el.classList.add(`perspective--indicators-${position}`);
    }

    private setupNavAria(): void {
        const prevLabel = LocaleManager.t('perspective.ariaPrev');
        const nextLabel = LocaleManager.t('perspective.ariaNext');
        if (this.navPrev) setAriaAttributes(this.navPrev, { 'aria-label': prevLabel });
        if (this.navNext) setAriaAttributes(this.navNext, { 'aria-label': nextLabel });
    }

    private applyEffect(effect: PerspectiveEffectType): void {
        this.el.classList.forEach((c) => {
            if (c.startsWith(EFFECT_CLASS_PREFIX)) this.el.classList.remove(c);
        });
        this.el.classList.add(`${EFFECT_CLASS_PREFIX}${effect}`);
    }

    private applyOrientation(orientation: 'horizontal' | 'vertical'): void {
        if (orientation === 'vertical') {
            this.el.classList.add('perspective--vertical');
        } else {
            this.el.classList.remove('perspective--vertical');
        }
    }

    private setupEvents(): void {
        const isVertical = () => this.options.orientation === 'vertical';
        if (this.options.listeners.keys) {
            this.registerEvent(document, 'keydown', (e: Event) => {
                const ke = e as KeyboardEvent;
                if (isVertical()) {
                    if (ke.keyCode === 40) this.next();
                    if (ke.keyCode === 38) this.prev();
                } else {
                    if ([39, 40].includes(ke.keyCode)) this.next();
                    if ([37, 38].includes(ke.keyCode)) this.prev();
                }
            });
        }
        if (this.options.listeners.touches) {
            let startX = 0;
            let startY = 0;
            let moveX = 0;
            let moveY = 0;
            const onSwipeEnd = (): void => {
                if (isVertical()) {
                    if (Math.abs(moveY) > 50) moveY > 0 ? this.prev() : this.next();
                } else if (Math.abs(moveX) > 50) {
                    moveX > 0 ? this.prev() : this.next();
                }
            };
            const bindSwipePointer = (): void => {
                this.registerEvent(this.el, 'pointerdown', (e: Event) => {
                    const c = getPointerCoords(e as PointerEvent);
                    startX = c.x;
                    startY = c.y;
                    moveX = 0;
                    moveY = 0;
                });
                this.registerEvent(
                    this.el,
                    'pointermove',
                    (e: Event) => {
                        const c = getPointerCoords(e as PointerEvent);
                        moveX = c.x - startX;
                        moveY = c.y - startY;
                        if (
                            this.options.preventScrolling &&
                            (Math.abs(moveX) > 10 || Math.abs(moveY) > 10)
                        ) {
                            e.preventDefault();
                        }
                    },
                    { passive: false }
                );
                this.registerEvent(this.el, 'pointerup', onSwipeEnd);
                this.registerEvent(this.el, 'pointercancel', onSwipeEnd);
            };
            if (supportsPointerEvents()) {
                bindSwipePointer();
            } else {
                this.registerEvent(this.el, 'touchstart', (e: Event) => {
                    const te = e as TouchEvent;
                    startX = te.touches[0].pageX;
                    startY = te.touches[0].pageY;
                    moveX = 0;
                    moveY = 0;
                });
                this.registerEvent(
                    this.el,
                    'touchmove',
                    (e: Event) => {
                        const te = e as TouchEvent;
                        moveX = te.touches[0].pageX - startX;
                        moveY = te.touches[0].pageY - startY;
                        if (this.options.preventScrolling && (Math.abs(moveX) > 10 || Math.abs(moveY) > 10)) {
                            te.preventDefault();
                        }
                    },
                    { passive: false }
                );
                this.registerEvent(this.el, 'touchend', onSwipeEnd);
            }
        }
        if (this.options.listeners.scroll) {
            this.registerEvent(
                this.el,
                'wheel',
                (e: Event) => {
                    const we = e as WheelEvent;
                    if (this.options.preventScrolling) we.preventDefault();
                    if (isVertical()) {
                        we.deltaY > 0 ? this.next() : this.prev();
                    } else {
                        we.deltaY > 0 ? this.next() : this.prev();
                    }
                },
                { passive: false }
            );
        }
        if (this.options.listeners.drag) {
            let startX = 0;
            let startY = 0;
            let moveX = 0;
            let moveY = 0;
            let dragging = false;
            this.el.classList.add('perspective--draggable');
            const onDragEnd = (): void => {
                if (dragging) {
                    if (isVertical()) {
                        if (Math.abs(moveY) > 50) moveY > 0 ? this.prev() : this.next();
                    } else if (Math.abs(moveX) > 50) {
                        moveX > 0 ? this.prev() : this.next();
                    }
                }
                dragging = false;
                startX = 0;
                startY = 0;
            };
            const bindDragPointer = (): void => {
                this.registerEvent(this.el, 'pointerdown', (e: Event) => {
                    const pe = e as PointerEvent;
                    if (pe.pointerType === 'mouse' && pe.button !== 0) return;
                    const c = getPointerCoords(pe);
                    startX = c.x;
                    startY = c.y;
                    moveX = 0;
                    moveY = 0;
                    dragging = true;
                });
                this.registerEvent(this.el, 'pointermove', (e: Event) => {
                    if (!dragging) return;
                    const c = getPointerCoords(e as PointerEvent);
                    moveX = c.x - startX;
                    moveY = c.y - startY;
                });
                this.registerEvent(this.el, 'pointerup', onDragEnd);
                this.registerEvent(this.el, 'pointerleave', onDragEnd);
                this.registerEvent(this.el, 'pointercancel', onDragEnd);
            };
            if (supportsPointerEvents()) {
                bindDragPointer();
            } else {
                this.registerEvent(this.el, 'mousedown', (e: Event) => {
                    startX = (e as MouseEvent).clientX;
                    startY = (e as MouseEvent).clientY;
                    moveX = 0;
                    moveY = 0;
                    dragging = true;
                });
                this.registerEvent(this.el, 'mousemove', (e: Event) => {
                    if (!dragging) return;
                    moveX = (e as MouseEvent).clientX - startX;
                    moveY = (e as MouseEvent).clientY - startY;
                });
                this.registerEvent(this.el, 'mouseup', onDragEnd);
            }
        }
        if (this.options.listeners.clicks) {
            this.slides.forEach((slide, index) => {
                this.registerEvent(slide, 'click', () => {
                    if (index !== this.currentIndex) this.slide(index);
                });
            });
        }
        if (this.navPrev) {
            this.registerEvent(this.navPrev, 'click', (e) => {
                e.preventDefault();
                this.prev();
            });
        }
        if (this.navNext) {
            this.registerEvent(this.navNext, 'click', (e) => {
                e.preventDefault();
                this.next();
            });
        }
    }

    private updateSlides(): void {
        const activeClass = 'perspective__slide--active';
        const inactiveClass = 'perspective__slide--inactive';
        const beforePrefix = 'perspective__slide--before-';
        const afterPrefix = 'perspective__slide--after-';
        const n = this.slides.length;
        const numVisible = Math.min(5, Math.max(1, this.options.numVisible));
        const allBeforeAfterClasses = [
            activeClass, inactiveClass, 'perspective__slide--before', 'perspective__slide--after',
            ...Array.from({ length: 5 }, (_, i) => `${beforePrefix}${i + 1}`),
            ...Array.from({ length: 5 }, (_, i) => `${afterPrefix}${i + 1}`)
        ];
        this.slides.forEach((slide, index) => {
            slide.classList.remove(...allBeforeAfterClasses);
            let offset = index - this.currentIndex;
            if (this.options.loop.enabled && n > 1) {
                const half = n / 2;
                if (offset > half) offset -= n;
                else if (offset < -half) offset += n;
            }
            if (offset === 0) {
                slide.classList.add(activeClass);
            } else {
                slide.classList.add(inactiveClass);
                const absOffset = Math.abs(offset);
                if (offset < 0) {
                    slide.classList.add('perspective__slide--before');
                    if (absOffset <= numVisible) slide.classList.add(`${beforePrefix}${Math.min(absOffset, 5)}`);
                } else {
                    slide.classList.add('perspective__slide--after');
                    if (absOffset <= numVisible) slide.classList.add(`${afterPrefix}${Math.min(absOffset, 5)}`);
                }
            }
        });
        this.updateIndicators();
    }

    /** Passe à la slide à l’index donné */
    slide(index: number, skipCallbacks?: boolean): void {
        const prevIndex = this.currentIndex;
        const nextIndex = Math.max(0, Math.min(index, this.slides.length - 1));
        this.transitionTimeouts.forEach((t) => clearTimeout(t));
        this.transitionTimeouts = [];
        if (!skipCallbacks && prevIndex !== nextIndex) {
            this.options.onCloseStart?.(this.el);
        }
        this.currentIndex = nextIndex;
        this.updateSlides();
        if (!skipCallbacks && prevIndex !== nextIndex) {
            this.options.onOpenStart?.(this.el);
            const outMs = this.options.outDuration;
            const inMs = this.options.inDuration;
            this.transitionTimeouts.push(setTimeout(() => this.options.onCloseEnd?.(this.el), outMs));
            this.transitionTimeouts.push(setTimeout(() => {
                this.options.onOpenEnd?.(this.el);
            }, outMs + inMs));
        }
        this.options.onChange?.({ index: this.currentIndex, slide: this.slides[this.currentIndex] });
        this.options.onCycleTo?.({ index: this.currentIndex, slide: this.slides[this.currentIndex] });
        this.resetAutoplay();
    }

    /** Slide suivante */
    next(): void {
        let nextIndex = this.currentIndex + 1;
        if (this.options.loop.enabled && nextIndex >= this.slides.length) nextIndex = 0;
        if (nextIndex < this.slides.length) this.slide(nextIndex);
    }

    /** Slide précédente */
    prev(): void {
        let prevIndex = this.currentIndex - 1;
        if (this.options.loop.enabled && prevIndex < 0) prevIndex = this.slides.length - 1;
        if (prevIndex >= 0) this.slide(prevIndex);
    }

    private startAutoplay(): void {
        this.stopAutoplay();
        this.autoplayTimer = setInterval(() => this.next(), this.options.autoplay.speed);
    }

    private stopAutoplay(): void {
        if (this.autoplayTimer) {
            clearInterval(this.autoplayTimer);
            this.autoplayTimer = null;
        }
    }

    private resetAutoplay(): void {
        if (this.options.autoplay.enabled) {
            this.stopAutoplay();
            this.startAutoplay();
        }
    }

    private addShadows(): void {
        const wrapperClass = 'perspective__shadow-wrapper';
        const shadowClass = 'perspective__shadow';
        this.slides.forEach((slide) => {
            if (slide.querySelector(`.${wrapperClass}`)) return;
            const wrap = document.createElement('div');
            wrap.className = wrapperClass;
            wrap.innerHTML = `<div class="${shadowClass}"><span></span></div>`;
            slide.appendChild(wrap);
        });
    }

    private removeShadows(): void {
        this.slides.forEach((slide) => {
            const w = slide.querySelector('.perspective__shadow-wrapper');
            if (w) w.remove();
        });
    }

    private addIndicators(): void {
        if (this.indicatorsContainer) return;
        const container = document.createElement('div');
        container.className = 'perspective__indicators';
        container.setAttribute('role', 'tablist');
        container.setAttribute('aria-label', 'Slides');
        this.slides.forEach((_, i) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'perspective__indicator';
            btn.setAttribute('role', 'tab');
            btn.setAttribute('aria-selected', i === this.currentIndex ? 'true' : 'false');
            btn.setAttribute('aria-label', `Slide ${i + 1}`);
            btn.addEventListener('click', () => this.slide(i));
            container.appendChild(btn);
        });
        this.el.appendChild(container);
        this.indicatorsContainer = container;
    }

    private updateIndicators(): void {
        if (!this.indicatorsContainer) return;
        const buttons = this.indicatorsContainer.querySelectorAll('.perspective__indicator');
        buttons.forEach((btn, i) => {
            const isActive = i === this.currentIndex;
            btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
            btn.classList.toggle('perspective__indicator--active', isActive);
        });
    }

    private showNavigation(): void {
        if (this.navPrev) (this.navPrev as HTMLElement).style.display = 'flex';
        if (this.navNext) (this.navNext as HTMLElement).style.display = 'flex';
    }

    private hideNavigation(): void {
        if (this.navPrev) (this.navPrev as HTMLElement).style.display = 'none';
        if (this.navNext) (this.navNext as HTMLElement).style.display = 'none';
    }

    /** Change l’effet visuel */
    changeEffect(effect: PerspectiveEffectType): void {
        this.options.effect = effect;
        this.applyEffect(effect);
        this.updateSlides();
    }

    /** Change l’orientation (horizontal / vertical) */
    setOrientation(orientation: 'horizontal' | 'vertical'): void {
        this.options.orientation = orientation;
        this.applyOrientation(orientation);
        this.updateSlides();
    }

    /** Active ou désactive les ombres */
    toggleShadows(enabled: boolean): void {
        this.options.shadows.enabled = enabled;
        if (enabled) this.addShadows();
        else this.removeShadows();
    }

    /** Active ou désactive l’autoplay */
    toggleAutoplay(enabled: boolean): void {
        this.options.autoplay.enabled = enabled;
        if (enabled) this.startAutoplay();
        else this.stopAutoplay();
    }

    /** Active ou désactive le blocage du scroll de la page */
    setPreventScrolling(enabled: boolean): void {
        this.options.preventScrolling = enabled;
    }

    /** Définit les durées de transition (ms) */
    setDurations(inDuration: number, outDuration: number): void {
        this.options.inDuration = Math.max(0, Math.min(750, inDuration));
        this.options.outDuration = Math.max(0, Math.min(750, outDuration));
        this.applyTransitionDuration();
    }

    /** Active ou désactive les indicateurs (points de navigation) */
    setIndicators(enabled: boolean): void {
        this.options.indicators = enabled;
        if (enabled) this.addIndicators();
        else {
            this.indicatorsContainer?.remove();
            this.indicatorsContainer = null;
        }
    }

    /** Position des indicateurs : 'top' ou 'bottom' */
    setIndicatorsPosition(position: 'top' | 'bottom'): void {
        this.options.indicatorsPosition = position;
        this.applyIndicatorsPosition(position);
    }

    /** Active ou désactive la boucle */
    toggleLoop(enabled: boolean): void {
        this.options.loop.enabled = enabled;
    }

    /** Affiche ou masque la navigation */
    toggleNavigation(enabled: boolean): void {
        this.options.navigation.enabled = enabled;
        if (enabled) this.showNavigation();
        else this.hideNavigation();
    }

    /** Index de la slide courante */
    getCurrentIndex(): number {
        return this.currentIndex;
    }

    /** Nombre de slides */
    getSlideCount(): number {
        return this.slides.length;
    }

    override destroy(): void {
        this.transitionTimeouts.forEach((t) => clearTimeout(t));
        this.transitionTimeouts = [];
        this.stopAutoplay();
        this.el.classList.remove('perspective--draggable');
        this.removeShadows();
        this.indicatorsContainer?.remove();
        this.indicatorsContainer = null;
        this.logger.info('Perspective détruit');
        super.destroy();
    }
}

/**
 * Custom Element <k3ui-perspective>
 * @description Permet l'utilisation de <k3ui-perspective> dans le HTML. Initialisation par AutoInit.
 */
if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-perspective')) {
    customElements.define('k3ui-perspective', class extends HTMLElement {
        connectedCallback(): void {
            if (!this.hasAttribute('data-initialized')) {
                this.setAttribute('data-initialized', 'true');
            }
        }
        disconnectedCallback(): void {
            const instance = Perspective.getInstance(this as unknown as HTMLElement);
            if (instance && typeof instance.destroy === 'function') instance.destroy();
        }
    });
}
