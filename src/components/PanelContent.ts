/**
 * @fileoverview Composant PanelContent pour K3UI
 * @description Surface M3 Expressive scrollable pour panes de layout (leading, layout, trailing)
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { toComponentClassDef } from '../types/components/component-base';
import type { PanelContentOptions, PanelContentVariant } from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { setAriaAttribute, removeAriaAttribute } from '../utils/dom/aria';
import { ManagerFactory } from '../core/factories';
import { getPanelContentDefaults } from '../specs/components/panel-content.specs';

const _defaults: PanelContentOptions = getPanelContentDefaults();

const VALID_VARIANTS: PanelContentVariant[] = ['leading', 'layout', 'trailing'];

interface KPanelContentHTMLElement extends HTMLElement {
    K_PanelContent?: PanelContent;
}

/**
 * Composant PanelContent — surface card M3E avec scroll vertical optionnel
 */
export class PanelContent extends Component<PanelContentOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    private logger = ManagerFactory.getLoggerManager('[PanelContent]');

    static get defaults(): PanelContentOptions {
        return { ..._defaults };
    }

    /**
     * @param el Élément host
     * @returns Instance PanelContent ou null
     */
    static getInstance(el: HTMLElement): PanelContent | null {
        const host = el as KPanelContentHTMLElement;
        return host.K_PanelContent ?? null;
    }

    /**
     * Initialise une ou plusieurs instances PanelContent
     * @param els Élément(s) ou sélecteur
     * @param options Options partielles
     * @returns Instances créées
     */
    static init(
        els: KElement | InitElements<KElement> | string,
        options: Partial<PanelContentOptions> = {}
    ): PanelContent[] {
        return Component.init(els, options, toComponentClassDef(PanelContent)) as PanelContent[];
    }

    private explicitSurface = false;
    private explicitRadius = false;

    constructor(el: HTMLElement, options: Partial<PanelContentOptions> = {}) {
        super(el, options, toComponentClassDef(PanelContent));
        const fromHtml = PanelContent.readAttributes(el);
        this.explicitSurface = el.hasAttribute('data-surface');
        this.explicitRadius = el.hasAttribute('data-radius');
        this.options = {
            ...PanelContent.defaults,
            ...options,
            ...fromHtml,
        };

        const host = el as KPanelContentHTMLElement;
        host.K_PanelContent = this;
        this.init();
    }

    /**
     * Lit les attributs data-* et aria-label du host
     * @param el Élément host
     * @returns Options partielles
     */
    private static readAttributes(el: HTMLElement): Partial<PanelContentOptions> {
        const out: Partial<PanelContentOptions> = {};
        const get = (key: string) => el.getAttribute(`data-${key}`);

        const variant = get('variant') ?? el.getAttribute('variant');
        if (variant != null && VALID_VARIANTS.includes(variant as PanelContentVariant)) {
            out.variant = variant as PanelContentVariant;
        }

        const radius = get('radius');
        if (radius != null && radius !== '') out.radius = radius;

        const surface = get('surface');
        if (surface != null && surface !== '') out.surface = surface;

        const scrollable = get('scrollable');
        if (scrollable === 'true' || scrollable === 'false') {
            out.scrollable = scrollable === 'true';
        }

        const empty = get('empty');
        if (empty === 'true' || empty === 'false') {
            out.empty = empty === 'true';
        }

        const ariaLabel = el.getAttribute('aria-label');
        if (ariaLabel != null && ariaLabel !== '') {
            out.ariaLabel = ariaLabel;
        }

        return out;
    }

    private init(): void {
        this.applyClasses();
        this.applyCssVariables();
        this.applyAccessibility();
        this.options.onOpenStart?.(this.el);
        this.options.onOpenEnd?.(this.el);
        this.logger.info('PanelContent initialized', { variant: this.options.variant });
    }

    private applyClasses(): void {
        const { variant, scrollable, empty } = this.options;

        this.el.classList.add('panel-content', 'content-pane');
        this.el.classList.add(`panel-content--${variant}`, `content-pane--${variant}`);

        const legacyClass = `${variant}-pane`;
        this.el.classList.add(legacyClass);

        if (scrollable) {
            this.el.classList.add('panel-content--scroll', 'content-pane--scroll', 'docs-pane-scroll');
        } else {
            this.el.classList.remove('panel-content--scroll', 'content-pane--scroll', 'docs-pane-scroll');
        }

        if (empty) {
            this.el.classList.add('panel-content--empty', 'content-pane--empty', 'trailing-pane--empty');
        } else {
            this.el.classList.remove('panel-content--empty', 'content-pane--empty', 'trailing-pane--empty');
        }
    }

    private applyCssVariables(): void {
        const { radius, surface } = this.options;

        if (this.explicitRadius) {
            this.el.style.setProperty('--panel-content-radius', radius);
            this.el.style.setProperty('--content-pane-radius', radius);
            this.el.style.setProperty('--docs-pane-radius', radius);
        } else {
            this.el.style.removeProperty('--panel-content-radius');
            this.el.style.removeProperty('--content-pane-radius');
            this.el.style.removeProperty('--docs-pane-radius');
        }

        if (this.explicitSurface && surface !== '') {
            this.el.style.setProperty('--panel-content-surface', surface);
            this.el.style.setProperty('--content-pane-surface', surface);
            this.el.style.setProperty('--docs-pane-surface', surface);
        } else {
            this.el.style.removeProperty('--panel-content-surface');
            this.el.style.removeProperty('--content-pane-surface');
            this.el.style.removeProperty('--docs-pane-surface');
        }
    }

    private applyAccessibility(): void {
        const { variant, ariaLabel } = this.options;
        const roleMap: Record<PanelContentVariant, string> = {
            leading: 'complementary',
            layout: 'region',
            trailing: 'complementary',
        };

        setAriaAttribute(this.el, 'role', roleMap[variant]);

        if (ariaLabel) {
            setAriaAttribute(this.el, 'label', ariaLabel);
        } else {
            removeAriaAttribute(this.el, 'label');
        }
    }

    /**
     * Retourne l'élément DOM utilisé comme conteneur de scroll
     * @returns Élément scrollable (le host)
     */
    getScrollElement(): HTMLElement {
        return this.el;
    }

    /**
     * Met à jour les options et réapplique classes / variables CSS
     * @param options Options partielles à fusionner
     */
    updateOptions(options: Partial<PanelContentOptions>): void {
        if ('surface' in options && options.surface !== '') this.explicitSurface = true;
        if ('radius' in options) this.explicitRadius = true;
        this.options = { ...this.options, ...options };
        this.applyClasses();
        this.applyCssVariables();
        this.applyAccessibility();
    }

    override destroy(): void {
        removeAriaAttribute(this.el, 'role');
        removeAriaAttribute(this.el, 'label');

        const host = this.el as KPanelContentHTMLElement;
        if (host.K_PanelContent === this) {
            delete host.K_PanelContent;
        }

        this.options.onCloseStart?.(this.el);
        this.options.onCloseEnd?.(this.el);
        this.logger.info('PanelContent destroyed');
        super.destroy();
    }
}

/**
 * Enregistre le custom element panel-content
 */
function definePanelContentElements(): void {
    if (typeof window === 'undefined' || typeof customElements === 'undefined') return;

    const createPaneElement = (): CustomElementConstructor =>
        class K3UIPanelContentElement extends HTMLElement {
            connectedCallback(): void {
                if (!this.hasAttribute('data-initialized')) {
                    this.setAttribute('data-initialized', 'true');
                }
            }

            disconnectedCallback(): void {}
        };

    if (!customElements.get('k3ui-panel-content')) {
        customElements.define('k3ui-panel-content', createPaneElement());
    }
}

definePanelContentElements();
