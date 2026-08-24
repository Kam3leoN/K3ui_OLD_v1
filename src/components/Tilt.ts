/**
 * @fileoverview Composant Tilt — effet 3D parallax au survol (moteur natif K3UI)
 * @description Wrapper K3UI autour du moteur tiltEngine natif
 * @author K3UI Team
 * @version 2.0.0
 */

import { Component } from '../core/base/Component';
import { toComponentClassDef } from '../types/components/component-base';
import type { TiltOptions } from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { LoggerManager } from '../core/managers';
import { ManagerFactory } from '../core/factories';
import { getTiltDefaults } from '../specs/components/tilt.specs';
import { getPreferReducedMotion } from '../utils/accessibility';
import { createTiltEngine, type TiltEngineInstance } from '../utils/effects/tiltEngine';
import { getK3uiComponentWindowOptions } from '../core/autoinit/window-options';

import {
    TILT_CLASS,
    TILT_SELECTORS,
} from '../utils/effects/tiltDom';

const SCALE_SELECTOR = TILT_SELECTORS.scale;
const ROTATE_SELECTOR = TILT_SELECTORS.rotate;
const INNER_SELECTOR = TILT_SELECTORS.inner;

const _defaults: TiltOptions = getTiltDefaults();

/**
 * Composant Tilt pour effets 3D parallax interactifs
 */
export class Tilt extends Component<TiltOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    private logger: LoggerManager;
    private engineInstance: TiltEngineInstance | null = null;
    private onMotionChange: (() => void) | null = null;

    static get defaults(): TiltOptions {
        return { ..._defaults };
    }

    static getInstance(el: HTMLElement): Tilt | undefined {
        return Component.getInstance(el) as Tilt | undefined;
    }

    static init(
        els: KElement | InitElements<KElement> | string,
        options: Partial<TiltOptions> = {}
    ): Tilt | Tilt[] {
        return Component.init(els, options, toComponentClassDef(Tilt)) as Tilt | Tilt[];
    }

    constructor(el: HTMLElement, options: Partial<TiltOptions> = {}) {
        super(el, options, toComponentClassDef(Tilt));
        this.logger = ManagerFactory.getLoggerManager('[Tilt]');
        const globalOptions = getK3uiComponentWindowOptions('Tilt');
        this.options = {
            ...Tilt.defaults,
            ...globalOptions,
            ...Tilt.readAttributes(el),
            ...options,
        };
        this.initCore();
    }

    private static readAttributes(el: HTMLElement): Partial<TiltOptions> {
        const out: Partial<TiltOptions> = {};
        const boolAttr = (name: string): boolean | undefined => {
            const v = el.getAttribute(name);
            if (v === 'true') return true;
            if (v === 'false') return false;
            return undefined;
        };
        const numAttr = (name: string): number | undefined => {
            const v = el.getAttribute(name);
            if (v == null) return undefined;
            const n = parseFloat(v);
            return Number.isNaN(n) ? undefined : n;
        };

        const alwaysActive = boolAttr('data-always-active');
        if (alwaysActive !== undefined) out.alwaysActive = alwaysActive;

        const activeOffset = numAttr('data-active-offset');
        if (activeOffset !== undefined) out.activeOffset = activeOffset;

        const shadowOffset = numAttr('data-shadow-offset');
        if (shadowOffset !== undefined) out.shadowOffset = shadowOffset;

        const shadowScale = numAttr('data-shadow-scale');
        if (shadowScale !== undefined) out.shadowScale = shadowScale;

        const duration = numAttr('data-duration');
        if (duration !== undefined) out.duration = duration;

        const rotate = boolAttr('data-rotate');
        if (rotate !== undefined) out.rotate = rotate;

        const rotateTouch = el.getAttribute('data-rotate-touch');
        if (rotateTouch === 'true') out.rotateTouch = true;
        else if (rotateTouch === 'false') out.rotateTouch = false;
        else if (rotateTouch === 'scroll-x' || rotateTouch === 'scroll-y') {
            out.rotateTouch = rotateTouch;
        }

        const rotateXMax = numAttr('data-rotate-x-max');
        if (rotateXMax !== undefined) out.rotateXMax = rotateXMax;

        const rotateYMax = numAttr('data-rotate-y-max');
        if (rotateYMax !== undefined) out.rotateYMax = rotateYMax;

        const rotateXInvert = boolAttr('data-rotate-x-invert');
        if (rotateXInvert !== undefined) out.rotateXInvert = rotateXInvert;

        const rotateYInvert = boolAttr('data-rotate-y-invert');
        if (rotateYInvert !== undefined) out.rotateYInvert = rotateYInvert;

        const stretchX = numAttr('data-stretch-x');
        if (stretchX !== undefined) out.stretchX = stretchX;

        const stretchY = numAttr('data-stretch-y');
        if (stretchY !== undefined) out.stretchY = stretchY;

        const stretchZ = numAttr('data-stretch-z');
        if (stretchZ !== undefined) out.stretchZ = stretchZ;

        const commonOrigin = boolAttr('data-common-origin');
        if (commonOrigin !== undefined) out.commonOrigin = commonOrigin;

        const shadow = boolAttr('data-shadow');
        if (shadow !== undefined) out.shadow = shadow;

        const highlight = boolAttr('data-highlight');
        if (highlight !== undefined) out.highlight = highlight;

        const eventsEl = el.getAttribute('data-events-el');
        if (eventsEl) out.eventsEl = eventsEl;

        const respectReducedMotion = boolAttr('data-respect-reduced-motion');
        if (respectReducedMotion !== undefined) out.respectReducedMotion = respectReducedMotion;

        const reducedMotion = boolAttr('data-reduced-motion');
        if (reducedMotion !== undefined) out.reducedMotion = reducedMotion;

        return out;
    }

    private initCore(): void {
        this.el.classList.add('tilt');
        this.ensureStructure();
        this.setupReducedMotionListener();
        this.syncReducedMotionState();
        this.logger.info('Tilt initialisé (moteur natif)');
    }

    private ensureStructure(): void {
        if (this.el.querySelector(ROTATE_SELECTOR)) {
            return;
        }

        const scaleEl = document.createElement('div');
        scaleEl.className = TILT_CLASS.scale;

        const rotateEl = document.createElement('div');
        rotateEl.className = TILT_CLASS.rotate;

        const innerEl = document.createElement('div');
        innerEl.className = TILT_CLASS.inner;

        while (this.el.firstChild) {
            innerEl.appendChild(this.el.firstChild);
        }

        rotateEl.appendChild(innerEl);
        scaleEl.appendChild(rotateEl);

        if (!this.el.querySelector(SCALE_SELECTOR)) {
            this.el.appendChild(scaleEl);
        }
    }

    private shouldDisableMotion(): boolean {
        if (this.options.reducedMotion) return true;
        if (!this.options.respectReducedMotion) return false;
        return getPreferReducedMotion();
    }

    private setupReducedMotionListener(): void {
        if (typeof document === 'undefined') return;
        this.onMotionChange = () => {
            this.syncReducedMotionState();
        };
        this.registerEvent(document, 'k3ui-motion-changed', this.onMotionChange);
    }

    /**
     * Réinitialise les transforms inline laissés par le moteur (parallax, rotation).
     */
    private resetMotionTransforms(): void {
        const selectors = [
            TILT_SELECTORS.scale,
            TILT_SELECTORS.rotate,
            TILT_SELECTORS.offsetLayers,
            TILT_SELECTORS.opacityLayers,
        ];
        selectors.forEach((selector) => {
            this.el.querySelectorAll(selector).forEach((node) => {
                const target = node as HTMLElement;
                target.style.removeProperty('transform');
                target.style.removeProperty('opacity');
                target.style.removeProperty('transition-duration');
                target.style.removeProperty('transition-timing-function');
            });
        });
    }

    /**
     * Active ou coupe l'effet Tilt selon prefers-reduced-motion / override MotionManager.
     */
    private syncReducedMotionState(): void {
        const disabled = this.shouldDisableMotion();
        this.el.classList.toggle('tilt--reduced-motion', disabled);

        if (disabled) {
            this.destroyEngine();
            this.resetMotionTransforms();
            this.el.classList.remove(TILT_CLASS.active, TILT_CLASS.rotateTouch);
            return;
        }

        this.initEngine();
    }

    private buildEngineParams() {
        const { options } = this;

        return {
            el: this.el,
            eventsEl: options.eventsEl,
            alwaysActive: options.alwaysActive,
            activeOffset: options.activeOffset,
            shadowOffset: options.shadowOffset,
            shadowScale: options.shadowScale,
            duration: options.duration,
            rotate: options.rotate,
            rotateTouch: options.rotateTouch,
            rotateXMax: options.rotateXMax,
            rotateYMax: options.rotateYMax,
            rotateXInvert: options.rotateXInvert,
            rotateYInvert: options.rotateYInvert,
            stretchX: options.stretchX,
            stretchY: options.stretchY,
            stretchZ: options.stretchZ,
            commonOrigin: options.commonOrigin,
            shadow: options.shadow,
            highlight: options.highlight,
            onEnter: () => {
                this.options.onOpenStart?.(this.el);
                this.options.onOpenEnd?.(this.el);
            },
            onLeave: () => {
                this.options.onCloseStart?.(this.el);
                this.options.onCloseEnd?.(this.el);
            },
            onRotate: (rotateX: number, rotateY: number) => {
                this.options.onRotate?.(rotateX, rotateY);
            },
        };
    }

    private initEngine(): void {
        this.destroyEngine();
        this.engineInstance = createTiltEngine(this.buildEngineParams());
    }

    private destroyEngine(): void {
        if (this.engineInstance && !this.engineInstance.destroyed) {
            this.engineInstance.destroy();
        }
        this.engineInstance = null;
    }

    /**
     * Réinitialise l'instance Tilt (options ou prefers-reduced-motion)
     */
    public reinit(): void {
        this.syncReducedMotionState();
    }

    /**
     * @deprecated Utiliser reinit()
     */
    public reinitAtropos(): void {
        this.reinit();
    }

    /**
     * Met à jour les options et réinitialise l'effet
     * @param options Options partielles
     */
    public updateOptions(options: Partial<TiltOptions>): void {
        this.options = { ...this.options, ...options };
        this.reinit();
    }

    /**
     * Active ou désactive la rotation
     * @param enabled État souhaité
     */
    public setRotate(enabled: boolean): void {
        this.updateOptions({ rotate: enabled });
    }

    /**
     * Indique si l'effet est actif (survol / touch)
     */
    public isActive(): boolean {
        return this.engineInstance?.isActive ?? false;
    }

    override destroy(): void {
        this.onMotionChange = null;
        this.destroyEngine();
        this.el.classList.remove(
            'tilt',
            TILT_CLASS.active,
            TILT_CLASS.rotateTouch,
            `${TILT_CLASS.rotateTouch}-scroll-x`,
            `${TILT_CLASS.rotateTouch}-scroll-y`,
            'tilt--reduced-motion'
        );
        this.logger.info('Tilt détruit');
        super.destroy();
    }
}

if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-tilt')) {
    customElements.define(
        'k3ui-tilt',
        class K3UITiltElement extends HTMLElement {
            connectedCallback(): void {
                if (!this.hasAttribute('data-initialized')) {
                    this.setAttribute('data-initialized', 'true');
                }
            }

            disconnectedCallback(): void {
                const instance = Tilt.getInstance(this);
                instance?.destroy();
            }
        }
    );
}
