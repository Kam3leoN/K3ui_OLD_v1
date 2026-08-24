/**
 * @fileoverview Moteur Tilt natif K3UI
 * @description Effet 3D parallax au survol sans dépendance externe
 * @author K3UI Team
 * @version 1.0.0
 */

import type { TiltRotateTouchMode } from '../../types/components';
import {
    TILT_CLASS,
    TILT_SELECTORS,
    clearTiltEngine,
    getTiltLayerOffset,
    getTiltLayerOpacity,
    hasTiltEngine,
    setTiltEngine,
} from './tiltDom';

/** Callbacks du moteur Tilt */
export interface TiltEngineCallbacks {
    onEnter?: () => void;
    onLeave?: () => void;
    onRotate?: (rotateX: number, rotateY: number) => void;
}

/** Paramètres du moteur Tilt */
export interface TiltEngineParams extends TiltEngineCallbacks {
    el: HTMLElement;
    eventsEl?: string | HTMLElement;
    alwaysActive?: boolean;
    activeOffset?: number;
    shadowOffset?: number;
    shadowScale?: number;
    duration?: number;
    rotate?: boolean;
    rotateTouch?: TiltRotateTouchMode;
    rotateXMax?: number;
    rotateYMax?: number;
    rotateXInvert?: boolean;
    rotateYInvert?: boolean;
    stretchX?: number;
    stretchY?: number;
    stretchZ?: number;
    commonOrigin?: boolean;
    shadow?: boolean;
    highlight?: boolean;
}

/** Instance active du moteur Tilt */
export interface TiltEngineInstance {
    el: HTMLElement;
    params: Required<Omit<TiltEngineParams, 'eventsEl' | 'onEnter' | 'onLeave' | 'onRotate'>> &
        Pick<TiltEngineParams, 'eventsEl' | 'onEnter' | 'onLeave' | 'onRotate'>;
    destroyed: boolean;
    isActive: boolean;
    destroy: () => void;
}

const DEFAULTS = {
    alwaysActive: false,
    activeOffset: 50,
    shadowOffset: 50,
    shadowScale: 1,
    duration: 300,
    rotate: true,
    rotateTouch: true as TiltRotateTouchMode,
    rotateXMax: 15,
    rotateYMax: 15,
    rotateXInvert: false,
    rotateYInvert: false,
    stretchX: 0,
    stretchY: 0,
    stretchZ: 0,
    commonOrigin: true,
    shadow: true,
    highlight: true,
};

type QueueItem =
    | (() => void)
    | { element: HTMLElement; prop: string; value: string };

function $(el: HTMLElement, sel: string): HTMLElement | null {
    return el.querySelector(sel);
}

function $$(el: HTMLElement, sel: string): HTMLElement[] {
    return Array.from(el.querySelectorAll(sel));
}

/**
 * Crée et attache une instance du moteur Tilt
 * @param originalParams Paramètres d'initialisation
 * @returns Instance du moteur
 */
export function createTiltEngine(originalParams: TiltEngineParams): TiltEngineInstance {
    const el = originalParams.el;
    let eventsEl: HTMLElement | undefined =
        typeof originalParams.eventsEl === 'string'
            ? (document.querySelector(originalParams.eventsEl) as HTMLElement | null) ?? undefined
            : originalParams.eventsEl;

    const params = {
        ...DEFAULTS,
        onEnter: null as (() => void) | null | undefined,
        onLeave: null as (() => void) | null | undefined,
        onRotate: null as ((rotateX: number, rotateY: number) => void) | null | undefined,
        ...originalParams,
        el,
    };

    const self: TiltEngineInstance = {
        el,
        params: params as TiltEngineInstance['params'],
        destroyed: false,
        isActive: false,
        destroy: () => {},
    };

    let childrenRootEl: HTMLElement = el;
    let rotateEl: HTMLElement | null = null;
    let scaleEl: HTMLElement | null = null;
    let innerEl: HTMLElement | null = null;
    let elBoundingClientRect: DOMRect | undefined;
    let eventsElBoundingClientRect: DOMRect | undefined;
    let shadowEl: HTMLElement | null = null;
    let highlightEl: HTMLElement | null = null;
    let isScrolling: boolean | undefined;
    let clientXStart = 0;
    let clientYStart = 0;
    const queue: QueueItem[] = [];
    let queueFrameId = 0;

    const purgeQueue = (): void => {
        queueFrameId = requestAnimationFrame(() => {
            queue.forEach((data) => {
                if (typeof data === 'function') {
                    data();
                } else {
                    (data.element.style as unknown as Record<string, string>)[data.prop] = data.value;
                }
            });
            queue.splice(0, queue.length);
            purgeQueue();
        });
    };

    purgeQueue();

    const setDuration = (element: HTMLElement, value: string): void => {
        queue.push({ element, prop: 'transitionDuration', value });
    };

    const setEasing = (element: HTMLElement, value: string): void => {
        queue.push({ element, prop: 'transitionTimingFunction', value });
    };

    const setTransform = (element: HTMLElement, value: string): void => {
        queue.push({ element, prop: 'transform', value });
    };

    const setOpacity = (element: HTMLElement, value: string | number): void => {
        queue.push({ element, prop: 'opacity', value: String(value) });
    };

    const setOrigin = (element: HTMLElement, value: string): void => {
        queue.push({ element, prop: 'transformOrigin', value });
    };

    const createShadow = (): void => {
        if (!rotateEl) return;
        let created = false;
        shadowEl = $(el, TILT_SELECTORS.shadow);
        if (!shadowEl) {
            shadowEl = document.createElement('span');
            shadowEl.classList.add(TILT_CLASS.shadow);
            created = true;
        }
        setTransform(
            shadowEl,
            `translate3d(0,0,-${params.shadowOffset}px) scale(${params.shadowScale})`
        );
        if (created) {
            rotateEl.appendChild(shadowEl);
        }
    };

    const createHighlight = (): void => {
        if (!innerEl) return;
        let created = false;
        highlightEl = $(el, TILT_SELECTORS.highlight);
        if (!highlightEl) {
            highlightEl = document.createElement('span');
            highlightEl.classList.add(TILT_CLASS.highlight);
            created = true;
        }
        setTransform(highlightEl, 'translate3d(0,0,0)');
        if (created) {
            innerEl.appendChild(highlightEl);
        }
    };

    const setChildrenOffset = (opts: {
        rotateXPercentage?: number;
        rotateYPercentage?: number;
        duration?: string;
        opacityOnly?: boolean;
        easeOut?: boolean;
    }): void => {
        const rotateXPercentage = opts.rotateXPercentage ?? 0;
        const rotateYPercentage = opts.rotateYPercentage ?? 0;
        const duration = opts.duration ?? '';
        const opacityOnly = opts.opacityOnly ?? false;
        const easeOut = opts.easeOut ?? false;

        const getOpacity = (element: HTMLElement): number[] | undefined => getTiltLayerOpacity(element);

        $$(childrenRootEl, TILT_SELECTORS.parallaxLayers).forEach((childEl) => {
            setDuration(childEl, duration);
            setEasing(childEl, easeOut ? 'ease-out' : '');
            const elementOpacity = getOpacity(childEl);

            if (rotateXPercentage === 0 && rotateYPercentage === 0) {
                if (!opacityOnly) setTransform(childEl, 'translate3d(0, 0, 0)');
                if (elementOpacity) setOpacity(childEl, elementOpacity[0]);
            } else {
                const childElOffset = (getTiltLayerOffset(childEl) ?? NaN) / 100;
                if (!Number.isNaN(childElOffset) && !opacityOnly) {
                    setTransform(
                        childEl,
                        `translate3d(${-rotateYPercentage * -childElOffset}%, ${rotateXPercentage * -childElOffset}%, 0)`
                    );
                }
                if (elementOpacity) {
                    const min = elementOpacity[0];
                    const max = elementOpacity[1];
                    const rotatePercentage = Math.max(
                        Math.abs(rotateXPercentage),
                        Math.abs(rotateYPercentage)
                    );
                    setOpacity(childEl, min + ((max - min) * rotatePercentage) / 100);
                }
            }
        });
    };

    const setElements = (clientX?: number, clientY?: number): void => {
        if (!rotateEl || !scaleEl) return;

        const isMultiple = el !== eventsEl;
        if (!elBoundingClientRect) {
            elBoundingClientRect = el.getBoundingClientRect();
        }
        if (isMultiple && eventsEl && !eventsElBoundingClientRect) {
            eventsElBoundingClientRect = eventsEl.getBoundingClientRect();
        }

        if (clientX === undefined && clientY === undefined) {
            const rect = isMultiple && eventsEl ? eventsElBoundingClientRect! : elBoundingClientRect;
            clientX = rect.left + rect.width / 2;
            clientY = rect.top + rect.height / 2;
        }

        let rotateX = 0;
        let rotateY = 0;
        let transformOrigin: string | undefined;

        const { top, left, width, height } = elBoundingClientRect!;

        if (!isMultiple || !eventsEl) {
            const centerX = width / 2;
            const centerY = height / 2;
            const coordX = clientX! - left;
            const coordY = clientY! - top;
            rotateY = (params.rotateYMax * (coordX - centerX)) / (width / 2) * -1;
            rotateX = (params.rotateXMax * (coordY - centerY)) / (height / 2);
        } else {
            const parentRect = eventsElBoundingClientRect!;
            const offsetLeft = left - parentRect.left;
            const offsetTop = top - parentRect.top;
            const centerX = width / 2 + offsetLeft;
            const centerY = height / 2 + offsetTop;
            const coordX = clientX! - parentRect.left;
            const coordY = clientY! - parentRect.top;
            rotateY =
                (params.rotateYMax * (coordX - centerX)) / (parentRect.width - width / 2) * -1;
            rotateX =
                (params.rotateXMax * (coordY - centerY)) / (parentRect.height - height / 2);
            transformOrigin = `${clientX! - left}px ${clientY! - top}px`;
        }

        rotateX = Math.min(Math.max(-rotateX, -params.rotateXMax), params.rotateXMax);
        if (params.rotateXInvert) rotateX = -rotateX;
        rotateY = Math.min(Math.max(-rotateY, -params.rotateYMax), params.rotateYMax);
        if (params.rotateYInvert) rotateY = -rotateY;

        const rotateXPercentage = (rotateX / params.rotateXMax) * 100;
        const rotateYPercentage = (rotateY / params.rotateYMax) * 100;
        const stretchX =
            (isMultiple ? (rotateYPercentage / 100) * params.stretchX : 0) *
            (params.rotateYInvert ? -1 : 1);
        const stretchY =
            (isMultiple ? (rotateXPercentage / 100) * params.stretchY : 0) *
            (params.rotateXInvert ? -1 : 1);
        const stretchZ = isMultiple
            ? (Math.max(Math.abs(rotateXPercentage), Math.abs(rotateYPercentage)) / 100) *
              params.stretchZ
            : 0;

        setTransform(
            rotateEl,
            `translate3d(${stretchX}%, ${-stretchY}%, ${-stretchZ}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
        );

        if (transformOrigin && params.commonOrigin) {
            setOrigin(rotateEl, transformOrigin);
        }

        if (highlightEl) {
            setDuration(highlightEl, `${params.duration}ms`);
            setEasing(highlightEl, 'ease-out');
            setTransform(
                highlightEl,
                `translate3d(${-rotateYPercentage * 0.25}%, ${rotateXPercentage * 0.25}%, 0)`
            );
            setOpacity(
                highlightEl,
                Math.max(Math.abs(rotateXPercentage), Math.abs(rotateYPercentage)) / 100
            );
        }

        setChildrenOffset({
            rotateXPercentage,
            rotateYPercentage,
            duration: `${params.duration}ms`,
            easeOut: true,
        });

        params.onRotate?.(rotateX, rotateY);
    };

    const activate = (): void => {
        if (!rotateEl || !scaleEl) return;
        queue.push(() => el.classList.add(TILT_CLASS.active));
        setDuration(rotateEl, `${params.duration}ms`);
        setEasing(rotateEl, 'ease-out');
        setTransform(scaleEl, `translate3d(0,0, ${params.activeOffset}px)`);
        setDuration(scaleEl, `${params.duration}ms`);
        setEasing(scaleEl, 'ease-out');
        if (shadowEl) {
            setDuration(shadowEl, `${params.duration}ms`);
            setEasing(shadowEl, 'ease-out');
        }
        self.isActive = true;
    };

    const onPointerEnter = (e: PointerEvent): void => {
        isScrolling = undefined;
        if (e.type === 'pointerdown' && e.pointerType === 'mouse') return;
        if (e.type === 'pointerenter' && e.pointerType !== 'mouse') return;
        if (e.type === 'pointerdown') {
            e.preventDefault();
        }
        clientXStart = e.clientX;
        clientYStart = e.clientY;
        if (params.alwaysActive) {
            elBoundingClientRect = undefined;
            eventsElBoundingClientRect = undefined;
            return;
        }
        activate();
        params.onEnter?.();
    };

    const onTouchMove = (e: TouchEvent): void => {
        if (isScrolling === false && e.cancelable) {
            e.preventDefault();
        }
    };

    const onPointerMove = (e: PointerEvent): void => {
        if (!params.rotate || !self.isActive) return;
        if (e.pointerType !== 'mouse') {
            if (!params.rotateTouch) return;
            e.preventDefault();
        }
        const { clientX, clientY } = e;
        const diffX = clientX - clientXStart;
        const diffY = clientY - clientYStart;

        if (
            typeof params.rotateTouch === 'string' &&
            (diffX !== 0 || diffY !== 0) &&
            typeof isScrolling === 'undefined'
        ) {
            if (diffX * diffX + diffY * diffY >= 25) {
                const touchAngle = (Math.atan2(Math.abs(diffY), Math.abs(diffX)) * 180) / Math.PI;
                isScrolling =
                    params.rotateTouch === 'scroll-y' ? touchAngle > 45 : 90 - touchAngle > 45;
            }
            if (isScrolling === false) {
                el.classList.add(TILT_CLASS.rotateTouch);
                if (e.cancelable) {
                    e.preventDefault();
                }
            }
        }

        if (e.pointerType !== 'mouse' && isScrolling) {
            return;
        }

        setElements(clientX, clientY);
    };

    const onPointerLeave = (e?: PointerEvent): void => {
        if (!rotateEl || !scaleEl) return;
        elBoundingClientRect = undefined;
        eventsElBoundingClientRect = undefined;
        if (!self.isActive) return;
        if (e && e.type === 'pointerup' && e.pointerType === 'mouse') return;
        if (e && e.type === 'pointerleave' && e.pointerType !== 'mouse') return;

        if (typeof params.rotateTouch === 'string' && isScrolling) {
            el.classList.remove(TILT_CLASS.rotateTouch);
        }

        if (params.alwaysActive) {
            setElements();
            params.onRotate?.(0, 0);
            params.onLeave?.();
            return;
        }

        queue.push(() => el.classList.remove(TILT_CLASS.active));
        setDuration(scaleEl, `${params.duration}ms`);
        setEasing(scaleEl, '');
        setTransform(scaleEl, 'translate3d(0,0, 0px)');

        if (shadowEl) {
            setDuration(shadowEl, `${params.duration}ms`);
            setEasing(shadowEl, '');
        }

        if (highlightEl) {
            setDuration(highlightEl, `${params.duration}ms`);
            setEasing(highlightEl, '');
            setTransform(highlightEl, 'translate3d(0, 0, 0)');
            setOpacity(highlightEl, 0);
        }

        setDuration(rotateEl, `${params.duration}ms`);
        setEasing(rotateEl, '');
        setTransform(rotateEl, 'translate3d(0,0,0) rotateX(0deg) rotateY(0deg)');
        setChildrenOffset({ duration: `${params.duration}ms` });
        self.isActive = false;
        params.onRotate?.(0, 0);
        params.onLeave?.();
    };

    const onDocumentClick = (e: MouseEvent): void => {
        const clickTarget = e.target as Node;
        if (eventsEl && !eventsEl.contains(clickTarget) && clickTarget !== eventsEl && self.isActive) {
            onPointerLeave();
        }
    };

    const initDOM = (): void => {
        if (hasTiltEngine(el)) {
            return;
        }

        if (!eventsEl) {
            eventsEl = el;
        }

        childrenRootEl = el;
        rotateEl = $(el, TILT_SELECTORS.rotate);
        scaleEl = $(el, TILT_SELECTORS.scale);
        innerEl = $(el, TILT_SELECTORS.inner);

        setTiltEngine(el, self);
    };

    const init = (): void => {
        initDOM();
        if (!eventsEl || !rotateEl || !scaleEl) return;

        if (params.shadow) createShadow();
        if (params.highlight) createHighlight();

        if (params.rotateTouch) {
            if (typeof params.rotateTouch === 'string') {
                el.classList.add(`${TILT_CLASS.rotateTouch}-${params.rotateTouch}`);
            } else {
                el.classList.add(TILT_CLASS.rotateTouch);
            }
        }

        if ($(childrenRootEl, TILT_SELECTORS.opacityLayers)) {
            setChildrenOffset({ opacityOnly: true });
        }

        document.addEventListener('click', onDocumentClick);
        eventsEl.addEventListener('pointerdown', onPointerEnter);
        eventsEl.addEventListener('pointerenter', onPointerEnter);
        eventsEl.addEventListener('pointermove', onPointerMove);
        eventsEl.addEventListener('touchmove', onTouchMove);
        eventsEl.addEventListener('pointerleave', onPointerLeave);
        eventsEl.addEventListener('pointerup', onPointerLeave);
        eventsEl.addEventListener('lostpointercapture', onPointerLeave);

        if (params.alwaysActive) {
            activate();
            setElements();
        }
    };

    const destroy = (): void => {
        if (self.destroyed) return;
        self.destroyed = true;
        cancelAnimationFrame(queueFrameId);

        if (eventsEl) {
            document.removeEventListener('click', onDocumentClick);
            eventsEl.removeEventListener('pointerdown', onPointerEnter);
            eventsEl.removeEventListener('pointerenter', onPointerEnter);
            eventsEl.removeEventListener('pointermove', onPointerMove);
            eventsEl.removeEventListener('touchmove', onTouchMove);
            eventsEl.removeEventListener('pointerleave', onPointerLeave);
            eventsEl.removeEventListener('pointerup', onPointerLeave);
            eventsEl.removeEventListener('lostpointercapture', onPointerLeave);
        }

        clearTiltEngine(el);
    };

    self.destroy = destroy;
    init();

    return self;
}
