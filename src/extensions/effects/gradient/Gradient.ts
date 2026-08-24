/**
 * @fileoverview Composant Gradient pour K3UI
 * @description Applique un dégradé CSS sur le texte d'un élément inline.
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../../../core/base/Component';
import { ComponentType, toComponentClassDef } from '../../../types/components/component-base';
import type { GradientOptions } from '../../../types/components';
import { PriorityLevel, KElement, InitElements } from '../../../types/base';
import { setAriaAttributes } from '../../../utils/dom/aria';
import { LoggerManager } from '../../../core/managers';
import { ManagerFactory } from '../../../core/factories';
import { getGradientDefaults } from '../../../specs/components/gradient.specs';
import { getK3uiComponentWindowOptions } from '../../../core/autoinit/window-options';

const _defaults: GradientOptions = getGradientDefaults();

/**
 * Composant Gradient
 */
export class Gradient extends Component<GradientOptions> {
    /** Niveau de priorité du composant */
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    /** Logger du composant */
    private logger: LoggerManager;

    /**
     * Retourne les options par défaut
     * @returns Les options par défaut du composant
     */
    static get defaults(): GradientOptions {
        return { ..._defaults };
    }

    /**
     * Retourne l'instance associée à l'élément
     * @param el Élément HTML cible
     * @returns L'instance si elle existe
     */
    static getInstance(el: HTMLElement): Gradient | undefined {
        return Component.getInstance(el) as Gradient | undefined;
    }

    /**
     * Initialise une ou plusieurs instances Gradient
     * @param els Élément, collection ou sélecteur
     * @param options Options de configuration
     * @returns L'instance créée ou la liste d'instances
     */
    static init(
        els: KElement | InitElements<KElement> | string,
        options: Partial<GradientOptions> = {}
    ): Gradient | Gradient[] {
        return Component.init(els, options, toComponentClassDef(Gradient)) as Gradient | Gradient[];
    }

    /**
     * Lit les attributs `data-*` de l'élément
     * @param el Élément HTML à lire
     * @returns Les options extraites
     */
    private static readAttributes(el: HTMLElement): Partial<GradientOptions> {
        const out: Partial<GradientOptions> = {};

        const colors = el.getAttribute('data-colors');
        if (colors) {
            try {
                const parsed = JSON.parse(colors);
                if (Array.isArray(parsed)) {
                    out.colors = parsed.filter((value): value is string => typeof value === 'string');
                }
            } catch (error) {
                console.warn('[Gradient] data-colors invalide', error);
            }
        }

        const angle = el.getAttribute('data-angle');
        if (angle) {
            const parsed = Number.parseFloat(angle);
            if (!Number.isNaN(parsed)) {
                out.angle = parsed;
            }
        }

        const text = el.getAttribute('data-text');
        if (text !== null) {
            out.text = text;
        }

        const backgroundSize = el.getAttribute('data-background-size');
        if (backgroundSize) {
            out.backgroundSize = backgroundSize;
        }

        return out;
    }

    /**
     * Constructeur du composant
     * @param el Élément HTML
     * @param options Options de configuration
     */
    constructor(el: HTMLElement, options: Partial<GradientOptions> = {}) {
        super(el, options, toComponentClassDef(Gradient));
        this.logger = ManagerFactory.getLoggerManager('[Gradient]');

        const fromHtml = Gradient.readAttributes(el);
        const globalOptions = getK3uiComponentWindowOptions('Gradient');
        this.options = {
            ...Gradient.defaults,
            ...globalOptions,
            ...options,
            ...fromHtml,
        };

        this.initComponent();
    }

    /**
     * Initialise le composant
     */
    private initComponent(): void {
        if (this.options.onOpenStart) {
            this.options.onOpenStart(this.el);
        }

        this.el.classList.add('gradient');
        this.applyText();
        this.applyGradientStyles();
        setAriaAttributes(this.el, {
            role: 'text',
        });

        this.logger.info('Gradient initialisé');

        if (this.options.onOpenEnd) {
            this.options.onOpenEnd(this.el);
        }
    }

    /**
     * Applique le texte configuré si nécessaire
     */
    private applyText(): void {
        const text = this.options.text.trim();
        if (text.length > 0) {
            this.el.textContent = text;
        }
    }

    /**
     * Construit la valeur CSS du dégradé courant
     * @returns La valeur CSS `linear-gradient(...)`
     */
    private buildGradient(): string {
        const colors = this.options.colors.length > 0 ? this.options.colors : Gradient.defaults.colors;
        return `linear-gradient(${this.options.angle}deg, ${colors.join(', ')})`;
    }

    /**
     * Applique les styles inline nécessaires au texte en dégradé
     */
    private applyGradientStyles(): void {
        this.el.style.setProperty('--k3ui-gradient-angle', `${this.options.angle}deg`);
        this.el.style.setProperty('--k3ui-gradient-colors', this.options.colors.join(', '));
        this.el.style.setProperty('--k3ui-gradient-background-size', this.options.backgroundSize);
        this.el.style.backgroundImage = this.buildGradient();
        this.el.style.backgroundSize = this.options.backgroundSize;
    }

    /**
     * Met à jour les options et réapplique le rendu
     * @param newOptions Nouvelles options partielles
     */
    public updateOptions(newOptions: Partial<GradientOptions>): void {
        this.options = {
            ...this.options,
            ...newOptions,
        };
        this.applyText();
        this.applyGradientStyles();
    }

    /**
     * Met à jour les couleurs du dégradé
     * @param colors Liste de couleurs CSS
     */
    public setColors(colors: string[]): void {
        this.updateOptions({ colors });
    }

    /**
     * Met à jour l'angle du dégradé
     * @param angle Angle en degrés
     */
    public setAngle(angle: number): void {
        this.updateOptions({ angle });
    }

    /**
     * Met à jour le texte affiché
     * @param text Texte à afficher
     */
    public setText(text: string): void {
        this.updateOptions({ text });
    }

    /**
     * Détruit proprement le composant
     */
    public override destroy(): void {
        if (this.options.onCloseStart) {
            this.options.onCloseStart(this.el);
        }

        super.destroy();

        if (this.options.onCloseEnd) {
            this.options.onCloseEnd(this.el);
        }
    }
}

if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-gradient')) {
    customElements.define('k3ui-gradient', class extends HTMLElement {});
}
