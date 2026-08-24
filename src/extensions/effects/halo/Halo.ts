/**
 * @fileoverview Composant Halo pour K3UI
 * @description Aura lumineuse animée autour de n'importe quel élément (cards, boutons, badges, etc.).
 * Distinct de Holo (foil irisé de surface).
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../../../core/base/Component';
import { ComponentRegistry } from '../../../core/registries/ComponentRegistry';
import { ComponentType, toComponentClassDef } from '../../../types/components/component-base';
import type { HaloOptions, HaloVariant, HaloSize, HaloDirection, HaloTrigger } from '../../../types/components';
import { PriorityLevel, KElement, InitElements } from '../../../types/base';
import { LoggerManager } from '../../../core/managers';
import { ManagerFactory } from '../../../core/factories';
import {
    getHaloDefaults,
    HALO_VARIANTS,
    HALO_SIZES,
    HALO_DIRECTIONS,
    HALO_TRIGGERS,
} from '../../../specs/components/halo.specs';
import { getK3uiComponentWindowOptions } from '../../../core/autoinit/window-options';

const _defaults: HaloOptions = getHaloDefaults();

/**
 * Composant Halo — lumière animée autour de n'importe quel élément
 */
export class Halo extends Component<HaloOptions> {
    /** Niveau de priorité du composant */
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    /** Logger du composant */
    private logger: LoggerManager;

    /** Enfant enveloppé lors d'un auto-wrap via data-halo */
    private wrappedTarget: HTMLElement | null = null;

    /**
     * Retourne les options par défaut
     * @returns Les options par défaut du composant
     */
    static get defaults(): HaloOptions {
        return { ..._defaults };
    }

    /**
     * Retourne l'instance associée à l'élément
     * @param el Élément HTML cible
     * @returns L'instance si elle existe
     */
    static getInstance(el: HTMLElement): Halo | undefined {
        return Component.getInstance(el) as Halo | undefined;
    }

    /**
     * Initialise une ou plusieurs instances Halo
     * @param els Élément, collection ou sélecteur
     * @param options Options de configuration
     * @returns L'instance créée ou la liste d'instances
     */
    static init(
        els: KElement | InitElements<KElement> | string,
        options: Partial<HaloOptions> = {},
    ): Halo | Halo[] {
        const elements = Halo.collectInitElements(els);
        const instances: Halo[] = [];

        for (const element of elements) {
            const existingWrapper = element.parentElement;
            if (
                element.hasAttribute('data-halo')
                && existingWrapper
                && Halo.isHaloRoot(existingWrapper)
            ) {
                const existing = Halo.getInstance(existingWrapper);
                if (existing) {
                    instances.push(existing);
                    continue;
                }
            }

            if (
                element.hasAttribute('data-halo')
                && !Halo.isHaloRoot(element)
                && !element.closest('.halo')
            ) {
                instances.push(new Halo(element, options));
                continue;
            }

            if (ComponentRegistry.hasHigherPriority(element, PriorityLevel.MEDIUM)) {
                instances.push(new Halo(element, options));
            } else {
                const existing = Halo.getInstance(element);
                if (existing) {
                    instances.push(existing);
                }
            }
        }

        const single =
            typeof els !== 'string'
            && (els instanceof HTMLElement || els instanceof Element);
        return (single ? instances[0] : instances) as Halo | Halo[];
    }

    /**
     * Collecte les éléments DOM à initialiser
     * @param els Sélecteur, élément ou collection
     * @returns Liste d'éléments HTML
     */
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
                } else if (node instanceof Element) {
                    elements.push(node as HTMLElement);
                }
            }
        }

        return elements;
    }

    /**
     * Constructeur du composant
     * @param el Élément HTML
     * @param options Options de configuration
     */
    constructor(el: HTMLElement, options: Partial<HaloOptions> = {}) {
        const root = Halo.resolveRootElement(el);
        super(root, options, toComponentClassDef(Halo));
        this.logger = ManagerFactory.getLoggerManager('[Halo]');

        if (root !== el) {
            this.wrappedTarget = el;
        }

        const fromHtml = Halo.readAttributes(root);
        const globalOptions = getK3uiComponentWindowOptions('Halo');
        this.options = {
            ...Halo.defaults,
            ...globalOptions,
            ...options,
            ...fromHtml,
        };

        this.initComponent();
    }

    /**
     * Résout l'élément racine : wrapper existant ou auto-wrap via data-halo
     * @param el Élément d'origine
     * @returns L'élément racine du halo
     */
    private static resolveRootElement(el: HTMLElement): HTMLElement {
        if (Halo.isHaloRoot(el)) {
            return el;
        }

        if (el.hasAttribute('data-halo') && !el.closest('.halo')) {
            return Halo.wrapWithHalo(el);
        }

        return el;
    }

    /**
     * Indique si l'élément est déjà un conteneur halo
     * @param el Élément à tester
     * @returns true si c'est un conteneur halo
     */
    private static isHaloRoot(el: HTMLElement): boolean {
        return el.classList.contains('halo') || el.tagName.toLowerCase() === 'k3ui-halo';
    }

    /**
     * Enveloppe un élément cible dans un conteneur .halo
     * @param target Élément à envelopper
     * @returns Le conteneur halo créé
     */
    private static wrapWithHalo(target: HTMLElement): HTMLElement {
        const wrapper = document.createElement('div');
        wrapper.classList.add('halo');

        Halo.transferHaloAttributes(target, wrapper);
        Halo.ensureLayers(wrapper);

        const parent = target.parentNode;
        if (parent) {
            parent.insertBefore(wrapper, target);
        }

        wrapper.appendChild(target);
        target.removeAttribute('data-halo');

        return wrapper;
    }

    /**
     * Transfère les attributs data-halo-* vers le wrapper
     * @param source Élément source
     * @param wrapper Conteneur halo
     */
    private static transferHaloAttributes(source: HTMLElement, wrapper: HTMLElement): void {
        const attrMap: Record<string, string> = {
            'data-halo-variant': 'data-variant',
            'data-halo-size': 'data-size',
            'data-halo-direction': 'data-direction',
            'data-halo-trigger': 'data-trigger',
            'data-halo-paused': 'data-paused',
            'data-halo-block': 'data-block',
        };

        for (const [from, to] of Object.entries(attrMap)) {
            const value = source.getAttribute(from);
            if (value !== null) {
                wrapper.setAttribute(to, value);
                source.removeAttribute(from);
            }
        }

        const cssVars: Array<[string, string]> = [
            ['data-halo-color', '--halo-color'],
            ['data-halo-radius', '--halo-radius'],
            ['data-halo-duration', '--halo-duration'],
            ['data-halo-padding', '--halo-padding'],
        ];

        for (const [attr, cssVar] of cssVars) {
            const value = source.getAttribute(attr);
            if (value !== null) {
                wrapper.style.setProperty(cssVar, Halo.toCssLength(value) ?? value);
                source.removeAttribute(attr);
            }
        }
    }

    /**
     * Lit les attributs data-* de l'élément halo
     * @param el Élément HTML à lire
     * @returns Les options extraites
     */
    private static readAttributes(el: HTMLElement): Partial<HaloOptions> {
        const out: Partial<HaloOptions> = {};

        const variant = el.getAttribute('data-variant') ?? el.getAttribute('data-halo-variant');
        if (variant && Halo.isEnum(variant, HALO_VARIANTS)) {
            out.variant = variant;
        }

        const size = el.getAttribute('data-size') ?? el.getAttribute('data-halo-size');
        if (size && Halo.isEnum(size, HALO_SIZES)) {
            out.size = size;
        }

        const direction = el.getAttribute('data-direction') ?? el.getAttribute('data-halo-direction');
        if (direction && Halo.isEnum(direction, HALO_DIRECTIONS)) {
            out.direction = direction;
        }

        const trigger = el.getAttribute('data-trigger') ?? el.getAttribute('data-halo-trigger');
        if (trigger && Halo.isEnum(trigger, HALO_TRIGGERS)) {
            out.trigger = trigger;
        }

        const paused = el.getAttribute('data-paused') ?? el.getAttribute('data-halo-paused');
        if (paused === 'true') {
            out.paused = true;
        } else if (paused === 'false') {
            out.paused = false;
        }

        const block = el.getAttribute('data-block') ?? el.getAttribute('data-halo-block');
        if (block === 'true') {
            out.block = true;
        } else if (block === 'false') {
            out.block = false;
        }

        const color = el.getAttribute('data-halo-color');
        if (color) {
            out.color = color;
        }

        const radius = el.getAttribute('data-halo-radius');
        if (radius) {
            out.radius = radius === 'full' ? '9999px' : radius;
            out.autoRadius = false;
        }

        const duration = el.getAttribute('data-halo-duration');
        if (duration) {
            out.duration = duration;
        }

        const padding = el.getAttribute('data-halo-padding');
        if (padding) {
            out.padding = padding;
        }

        const autoRadius = el.getAttribute('data-halo-auto-radius');
        if (autoRadius === 'false') {
            out.autoRadius = false;
        } else if (autoRadius === 'true') {
            out.autoRadius = true;
        }

        return out;
    }

    /**
     * Vérifie qu'une valeur appartient à une énumération
     * @param value Valeur à tester
     * @param allowed Valeurs autorisées
     * @returns true si la valeur est autorisée
     */
    private static isEnum<T extends string>(value: string, allowed: readonly T[]): value is T {
        return (allowed as readonly string[]).includes(value);
    }

    /**
     * Convertit une valeur en longueur CSS
     * @param value Valeur numérique ou chaîne
     * @returns Longueur CSS ou undefined
     */
    private static toCssLength(value: string | number | undefined | null): string | undefined {
        if (value === undefined || value === null || value === '') {
            return undefined;
        }
        if (typeof value === 'number') {
            return `${value}px`;
        }
        if (value === 'full') {
            return '9999px';
        }
        return String(value);
    }

    /**
     * Convertit une durée en valeur CSS
     * @param value Durée en ms ou chaîne CSS
     * @returns Durée CSS
     */
    private static toCssDuration(value: string | number | undefined | null): string | undefined {
        if (value === undefined || value === null || value === '') {
            return undefined;
        }
        if (typeof value === 'number') {
            return `${value}ms`;
        }
        return String(value);
    }

    /**
     * Crée la structure DOM des calques animés
     * @returns L'élément conteneur des calques
     */
    private static createLayersElement(): HTMLSpanElement {
        const layers = document.createElement('span');
        layers.className = 'halo__layers';
        layers.setAttribute('aria-hidden', 'true');

        const core = document.createElement('span');
        core.className = 'halo__layer';

        const near = document.createElement('span');
        near.className = 'halo__layer halo__layer--near';

        const far = document.createElement('span');
        far.className = 'halo__layer halo__layer--far';

        layers.append(core, near, far);
        return layers;
    }

    /**
     * Garantit la présence des calques dans le conteneur
     * @param root Conteneur halo
     */
    private static ensureLayers(root: HTMLElement): void {
        if (root.querySelector(':scope > .halo__layers')) {
            return;
        }

        const layers = Halo.createLayersElement();
        root.insertBefore(layers, root.firstChild);
    }

    /**
     * Initialise le composant
     */
    private initComponent(): void {
        if (this.options.onOpenStart) {
            this.options.onOpenStart(this.el);
        }

        this.el.classList.add('halo');
        Halo.ensureLayers(this.el);
        this.applyOptions();
        this.applyAutoRadius();

        this.logger.info('Halo initialisé');

        if (this.options.onOpenEnd) {
            this.options.onOpenEnd(this.el);
        }
    }

    /**
     * Applique les options sur les attributs et variables CSS
     */
    private applyOptions(): void {
        this.el.setAttribute('data-variant', this.options.variant);
        this.el.setAttribute('data-size', this.options.size);
        this.el.setAttribute('data-direction', this.options.direction);
        this.el.setAttribute('data-trigger', this.options.trigger);

        if (this.options.paused) {
            this.el.setAttribute('data-paused', 'true');
        } else {
            this.el.removeAttribute('data-paused');
        }

        if (this.options.block) {
            this.el.setAttribute('data-block', 'true');
        } else {
            this.el.removeAttribute('data-block');
        }

        if (this.options.color) {
            this.el.style.setProperty('--halo-color', this.options.color);
        }

        const radius = Halo.toCssLength(this.options.radius);
        if (radius) {
            this.el.style.setProperty('--halo-radius', radius);
        }

        const duration = Halo.toCssDuration(this.options.duration);
        if (duration) {
            this.el.style.setProperty('--halo-duration', duration);
        }

        const padding = Halo.toCssLength(this.options.padding);
        if (padding) {
            this.el.style.setProperty('--halo-padding', padding);
        }
    }

    /**
     * Détecte le border-radius du premier enfant si autoRadius est actif
     */
    private applyAutoRadius(): void {
        if (!this.options.autoRadius || this.options.radius) {
            return;
        }

        const child = this.getContentChild();
        if (!child) {
            return;
        }

        const computed = window.getComputedStyle(child);
        const radius = computed.borderRadius;
        if (radius && radius !== '0px') {
            this.el.style.setProperty('--halo-radius', radius);
        }
    }

    /**
     * Retourne le premier enfant de contenu (hors calques)
     * @returns L'enfant de contenu ou null
     */
    private getContentChild(): HTMLElement | null {
        for (const node of Array.from(this.el.children)) {
            if (node instanceof HTMLElement && !node.classList.contains('halo__layers')) {
                return node;
            }
        }
        return null;
    }

    /**
     * Met à jour les options et réapplique le rendu
     * @param newOptions Nouvelles options partielles
     */
    public updateOptions(newOptions: Partial<HaloOptions>): void {
        this.options = {
            ...this.options,
            ...newOptions,
        };
        this.applyOptions();
        this.applyAutoRadius();
    }

    /**
     * Met à jour la variante visuelle
     * @param variant Variante du halo
     */
    public setVariant(variant: HaloVariant): void {
        this.updateOptions({ variant });
    }

    /**
     * Met à jour la taille du halo
     * @param size Taille du halo
     */
    public setSize(size: HaloSize): void {
        this.updateOptions({ size });
    }

    /**
     * Met à jour le sens de rotation
     * @param direction Sens cw ou ccw
     */
    public setDirection(direction: HaloDirection): void {
        this.updateOptions({ direction });
    }

    /**
     * Met à jour le mode de déclenchement
     * @param trigger always ou hover
     */
    public setTrigger(trigger: HaloTrigger): void {
        this.updateOptions({ trigger });
    }

    /**
     * Met en pause l'animation
     */
    public pause(): void {
        this.updateOptions({ paused: true });
    }

    /**
     * Reprend l'animation
     */
    public resume(): void {
        this.updateOptions({ paused: false });
    }

    /**
     * Définit la couleur du halo
     * @param color Couleur CSS
     */
    public setColor(color: string): void {
        this.updateOptions({ color });
    }

    /**
     * Définit le rayon de bordure
     * @param radius Rayon CSS ou 'full'
     */
    public setRadius(radius: string | number): void {
        this.updateOptions({
            radius: radius === 'full' ? '9999px' : String(radius),
            autoRadius: false,
        });
    }

    /**
     * Retire l'enveloppe halo et restaure l'élément d'origine
     */
    private unwrapTarget(): void {
        if (!this.wrappedTarget) {
            return;
        }

        const parent = this.el.parentNode;
        if (parent) {
            parent.insertBefore(this.wrappedTarget, this.el);
        }

        this.wrappedTarget.removeAttribute('data-halo');
        this.el.remove();
        this.wrappedTarget = null;
    }

    /**
     * Détruit proprement le composant
     */
    public override destroy(): void {
        if (this.options.onCloseStart) {
            this.options.onCloseStart(this.el);
        }

        this.unwrapTarget();
        super.destroy();

        if (this.options.onCloseEnd) {
            this.options.onCloseEnd(this.el);
        }
    }
}

if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-halo')) {
    customElements.define(
        'k3ui-halo',
        class K3UIHaloElement extends HTMLElement {
            connectedCallback(): void {
                if (!this.hasAttribute('data-initialized')) {
                    this.setAttribute('data-initialized', 'true');
                }
            }

            disconnectedCallback(): void {
                Halo.getInstance(this)?.destroy();
            }
        }
    );
}
