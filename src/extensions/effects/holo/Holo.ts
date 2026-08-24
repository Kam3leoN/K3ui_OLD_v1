/**
 * @fileoverview Composant Holo — foil holographique irisé (3 variantes Pokémon)
 * @description Rayon, Space, Rainbow — portage pokemon-cards-151 (@simeydotme, GPL-3.0)
 * @author K3UI Team
 * @version 2.0.0
 */

import { Component } from '../../../core/base/Component';
import { ComponentRegistry } from '../../../core/registries/ComponentRegistry';
import { toComponentClassDef } from '../../../types/components/component-base';
import type { HoloOptions, HoloVariant } from '../../../types/components';
import { PriorityLevel, KElement, InitElements } from '../../../types/base';
import { LoggerManager } from '../../../core/managers';
import { ManagerFactory } from '../../../core/factories';
import {
    getHoloDefaults,
    HOLO_VARIANTS,
} from '../../../specs/components/holo.specs';
import { getK3uiComponentWindowOptions } from '../../../core/autoinit/window-options';
import {
    attachHoloSpring,
    type HoloSpringController,
} from '../../../utils/effects/holoSpring';
import { applyHoloTextureVars } from '../../../utils/effects/holoAssets';

const HOLO_LAYERS = ['holo__shine', 'holo__glitter', 'holo__glare', 'holo__glare2'] as const;

const _defaults: HoloOptions = getHoloDefaults();

/**
 * Composant Holo — foil irisé multi-couches piloté par ressorts
 */
export class Holo extends Component<HoloOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    private logger: LoggerManager;
    private wrappedTarget: HTMLElement | null = null;
    private springController: HoloSpringController | null = null;

    static get defaults(): HoloOptions {
        return { ..._defaults };
    }

    static getInstance(el: HTMLElement): Holo | undefined {
        return Component.getInstance(el) as Holo | undefined;
    }

    static init(
        els: KElement | InitElements<KElement> | string,
        options: Partial<HoloOptions> = {}
    ): Holo | Holo[] {
        const elements = Holo.collectInitElements(els);
        const instances: Holo[] = [];

        for (const element of elements) {
            const existingWrapper = element.parentElement;
            if (
                element.hasAttribute('data-holo')
                && existingWrapper
                && Holo.isHoloRoot(existingWrapper)
            ) {
                const existing = Holo.getInstance(existingWrapper);
                if (existing) {
                    instances.push(existing);
                    continue;
                }
            }

            if (
                element.hasAttribute('data-holo')
                && !Holo.isHoloRoot(element)
                && !element.closest('.holo')
            ) {
                instances.push(new Holo(element, options));
                continue;
            }

            if (ComponentRegistry.hasHigherPriority(element, PriorityLevel.MEDIUM)) {
                instances.push(new Holo(element, options));
            } else {
                const existing = Holo.getInstance(element);
                if (existing) {
                    instances.push(existing);
                }
            }
        }

        const single =
            typeof els !== 'string'
            && (els instanceof HTMLElement || els instanceof Element);
        return (single ? instances[0] : instances) as Holo | Holo[];
    }

    private static collectInitElements(els: KElement | InitElements<KElement> | string): HTMLElement[] {
        const elements: HTMLElement[] = [];

        if (typeof els === 'string') {
            elements.push(...Array.from(document.querySelectorAll<HTMLElement>(els)));
        } else if (els instanceof HTMLElement) {
            elements.push(els);
        } else if (els instanceof Element) {
            elements.push(els as HTMLElement);
        } else if (els && typeof (els as NodeListOf<KElement>).length === 'number') {
            for (const node of Array.from(els as NodeListOf<KElement>)) {
                if (node instanceof HTMLElement) {
                    elements.push(node);
                }
            }
        }

        return elements;
    }

    constructor(el: HTMLElement, options: Partial<HoloOptions> = {}) {
        const presetFromElement = Holo.readAttributes(el);
        const root = Holo.resolveRootElement(el);
        super(root, options, toComponentClassDef(Holo));
        this.logger = ManagerFactory.getLoggerManager('[Holo]');

        if (root !== el) {
            this.wrappedTarget = el;
        }

        const fromRoot = Holo.readAttributes(root);
        const globalOptions = getK3uiComponentWindowOptions('Holo');
        this.options = {
            ...Holo.defaults,
            ...globalOptions,
            ...options,
            ...presetFromElement,
            ...fromRoot,
        };

        this.initComponent();
    }

    private static resolveRootElement(el: HTMLElement): HTMLElement {
        if (Holo.isHoloRoot(el)) {
            return el;
        }

        if (el.hasAttribute('data-holo') && !el.closest('.holo')) {
            return Holo.wrapWithHolo(el);
        }

        return el;
    }

    private static isHoloRoot(el: HTMLElement): boolean {
        return el.classList.contains('holo') || el.tagName.toLowerCase() === 'k3ui-holo';
    }

    private static wrapWithHolo(target: HTMLElement): HTMLElement {
        const wrapper = document.createElement('div');
        wrapper.classList.add('holo');

        Holo.transferHoloAttributes(target, wrapper);

        const parent = target.parentNode;
        if (parent) {
            parent.insertBefore(wrapper, target);
        }

        const tilt = document.createElement('div');
        tilt.className = 'holo__tilt';

        const content = document.createElement('div');
        content.className = 'holo__content';
        content.appendChild(target);
        tilt.appendChild(content);
        wrapper.appendChild(tilt);

        // Même largeur que le parent (figure / grille) — évite le sizing intrinsèque de l'image
        wrapper.style.width = '100%';
        wrapper.style.maxWidth = '100%';

        target.removeAttribute('data-holo');
        Holo.ensureLayers(wrapper);

        return wrapper;
    }

    private static transferHoloAttributes(source: HTMLElement, wrapper: HTMLElement): void {
        const attrMap: Record<string, string> = {
            'data-holo-variant': 'data-variant',
            'data-holo-strength': 'data-strength',
            'data-holo-autoplay': 'data-autoplay',
        };

        for (const [from, to] of Object.entries(attrMap)) {
            const value = source.getAttribute(from);
            if (value !== null) {
                wrapper.setAttribute(to, value);
                source.removeAttribute(from);
            }
        }
    }

    private static ensureStructure(root: HTMLElement): void {
        let tilt = root.querySelector(':scope > .holo__tilt') as HTMLElement | null;

        if (!tilt) {
            tilt = document.createElement('div');
            tilt.className = 'holo__tilt';

            const legacyContent = root.querySelector(':scope > .holo__content');
            if (legacyContent) {
                tilt.appendChild(legacyContent);
            } else {
                while (root.firstChild) {
                    tilt.appendChild(root.firstChild);
                }
            }

            root.appendChild(tilt);
        }

        if (!tilt.querySelector(':scope > .holo__content')) {
            const content = document.createElement('div');
            content.className = 'holo__content';
            while (tilt.firstChild) {
                content.appendChild(tilt.firstChild);
            }
            tilt.appendChild(content);
        }

        Holo.ensureLayers(root);
    }

    private static ensureLayers(root: HTMLElement): void {
        const content = root.querySelector(':scope > .holo__tilt > .holo__content')
            ?? root.querySelector(':scope > .holo__content');
        if (!content) return;

        for (const layerClass of HOLO_LAYERS) {
            if (content.querySelector(`:scope > .${layerClass}`)) continue;
            const layer = document.createElement('div');
            layer.className = layerClass;
            layer.setAttribute('aria-hidden', 'true');
            content.appendChild(layer);
        }
    }

    private static isEnum<T extends string>(value: string, allowed: readonly T[]): value is T {
        return (allowed as readonly string[]).includes(value);
    }

    private static normalizeVariant(raw: string): HoloVariant | null {
        const aliases: Record<string, HoloVariant> = {
            rayon: 'rayon',
            space: 'space',
            rainbow: 'rainbow',
            'double-rare': 'rayon',
            'double rare': 'rayon',
            'hyper-rare': 'space',
            'hyper rare': 'space',
            'rare rainbow alt': 'rainbow',
        };
        const mapped = aliases[raw.toLowerCase()] ?? raw;
        return Holo.isEnum(mapped, HOLO_VARIANTS) ? mapped : null;
    }

    private static resolveContentImage(root: HTMLElement): HTMLImageElement | null {
        const content = root.querySelector(':scope > .holo__tilt > .holo__content')
            ?? root.querySelector(':scope > .holo__content');
        if (!content) return null;

        const img = content.querySelector('img:not([class^="holo__"])');
        return img instanceof HTMLImageElement ? img : null;
    }

    private static toMaskUrl(src: string): string {
        const escaped = src.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        return `url("${escaped}")`;
    }

    private static readAttributes(el: HTMLElement): Partial<HoloOptions> {
        const out: Partial<HoloOptions> = {};

        const variant = el.getAttribute('data-variant') ?? el.getAttribute('data-holo-variant');
        if (variant) {
            const normalized = Holo.normalizeVariant(variant);
            if (normalized) out.variant = normalized;
        }

        const strength = el.getAttribute('data-strength') ?? el.getAttribute('data-holo-strength');
        if (strength) {
            const n = parseFloat(strength);
            if (!Number.isNaN(n)) out.strength = n;
        }

        const autoplay = el.getAttribute('data-autoplay') ?? el.getAttribute('data-holo-autoplay');
        if (autoplay === 'true') out.autoplay = true;
        else if (autoplay === 'false') out.autoplay = false;
        else if (autoplay === 'auto') out.autoplay = 'auto';

        return out;
    }

    private initComponent(): void {
        this.options.onOpenStart?.(this.el);
        this.el.classList.add('holo');
        Holo.ensureStructure(this.el);
        applyHoloTextureVars(this.el);
        this.applyOptions();
        this.attachSpring();
        this.logger.info('Holo initialisé');
        this.options.onOpenEnd?.(this.el);
    }

    private applyOptions(): void {
        this.el.setAttribute('data-variant', this.options.variant);
        this.el.style.setProperty('--holo-strength', String(this.options.strength));
        this.el.dataset.active = 'false';
        this.applyContentMask();
    }

    /**
     * Sans texture foil/mask dédiée (pokemon), on n'utilise pas l'illustration
     * comme masque luminance — sinon le hover suit le contraste photo et paraît faux.
     */
    private applyContentMask(): void {
        if (this.options.variant === 'rainbow') {
            this.el.style.setProperty('--mask', 'none');
            this.el.style.setProperty('--foil', 'none');
            this.el.classList.remove('holo--masked');
            return;
        }

        this.el.style.setProperty('--mask', 'none');
        this.el.style.setProperty('--foil', 'var(--birthday)');
        this.el.classList.remove('holo--masked');
    }

    private attachSpring(): void {
        this.springController?.destroy();
        const surface = this.el.querySelector(':scope > .holo__tilt') as HTMLElement ?? this.el;
        this.springController = attachHoloSpring(this.el, {
            autoplay: this.options.autoplay,
            strength: this.options.strength,
            surface,
        });
    }

    /**
     * Met à jour les options
     * @param options Options partielles
     */
    public updateOptions(options: Partial<HoloOptions>): void {
        this.options = { ...this.options, ...options };
        this.applyOptions();
        if (
            options.autoplay !== undefined
            || options.strength !== undefined
            || options.variant !== undefined
        ) {
            this.attachSpring();
        }
    }

    private unwrapTarget(): void {
        if (!this.wrappedTarget) return;

        const content = this.el.querySelector('.holo__tilt > .holo__content')
            ?? this.el.querySelector('.holo__content');
        const parent = this.el.parentNode;
        if (parent && content && this.wrappedTarget.parentElement === content) {
            parent.insertBefore(this.wrappedTarget, this.el);
        }

        this.wrappedTarget.removeAttribute('data-holo');
        this.el.remove();
        this.wrappedTarget = null;
    }

    override destroy(): void {
        this.options.onCloseStart?.(this.el);
        this.springController?.destroy();
        this.springController = null;
        this.unwrapTarget();
        super.destroy();
        this.options.onCloseEnd?.(this.el);
        this.logger.info('Holo détruit');
    }
}

if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-holo')) {
    customElements.define(
        'k3ui-holo',
        class K3UIHoloElement extends HTMLElement {
            connectedCallback(): void {
                if (!this.hasAttribute('data-initialized')) {
                    this.setAttribute('data-initialized', 'true');
                }
            }

            disconnectedCallback(): void {
                Holo.getInstance(this)?.destroy();
            }
        }
    );
}
