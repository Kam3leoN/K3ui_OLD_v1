/**
 * @fileoverview Composant Pricing pour K3UI
 * @description Grille tarifaire SaaS inspirée Postiz — cartes de plans, toggle mensuel/annuel, tableau comparatif
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { toComponentClassDef } from '../types/components/component-base';
import type { PricingOptions } from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { setAriaAttributes } from '../utils/dom/aria';
import { LocaleManager, LoggerManager } from '../core/managers';
import { ManagerFactory } from '../core/factories';
import { getPricingDefaults } from '../specs/components/pricing.specs';
import type { PricingBillingPeriod } from '../specs/components/pricing.specs';

const SELECTORS = {
    billingToggle: '.pricing__billing-toggle',
    priceValue: '.pricing__price[data-monthly]',
    tablePrice: '.pricing__table-col-price[data-monthly]',
    segmentedBtn: '.button-segmented__btn',
} as const;

interface KPricingHTMLElement extends HTMLElement {
    K_Pricing?: Pricing;
}

const _defaults: PricingOptions = getPricingDefaults();

/**
 * Composant Pricing — section tarifaire avec bascule mensuel/annuel
 */
export class Pricing extends Component<PricingOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    private logger: LoggerManager;
    private billingPeriod: PricingBillingPeriod = _defaults.billingPeriod;

    static get defaults(): PricingOptions {
        return { ..._defaults };
    }

    static getInstance(el: HTMLElement): Pricing | undefined {
        return (el as KPricingHTMLElement).K_Pricing;
    }

    static init(
        els: KElement | InitElements<KElement> | string,
        options: Partial<PricingOptions> = {}
    ): Pricing | Pricing[] {
        return Component.init(els, options, toComponentClassDef(Pricing)) as Pricing | Pricing[];
    }

    constructor(el: HTMLElement, options: Partial<PricingOptions> = {}) {
        super(el, options, toComponentClassDef(Pricing));
        this.logger = ManagerFactory.getLoggerManager('[Pricing]');
        this.options = {
            ...Pricing.defaults,
            ...options,
            ...Pricing.readDataOptions(el),
        };
        this.billingPeriod = this.options.billingPeriod;
        (el as KPricingHTMLElement).K_Pricing = this;
        this.initCore();
    }

    /**
     * Lit les options depuis les attributs data-* de l'élément
     * @param el - Élément HTML racine
     * @returns Options extraites
     */
    private static readDataOptions(el: HTMLElement): Partial<PricingOptions> {
        const out: Partial<PricingOptions> = {};
        const { dataset } = el;

        if (dataset.billing === 'monthly' || dataset.billing === 'yearly') {
            out.billingPeriod = dataset.billing;
        }
        if (dataset.currency) out.currency = dataset.currency;
        if (dataset.yearlyDiscount) {
            const n = parseFloat(dataset.yearlyDiscount);
            if (!Number.isNaN(n)) out.yearlyDiscount = n;
        }
        if (el.hasAttribute('data-dark-theme')) {
            out.darkTheme = dataset.darkTheme !== 'false';
        }

        return out;
    }

    private initCore(): void {
        this.el.classList.add('pricing');
        if (this.options.darkTheme) {
            this.el.classList.add('pricing--dark');
        }

        this.setupAccessibility();
        this.applyBillingPeriod(this.billingPeriod, false);
        this.setupBillingToggle();
        this.options.onOpenEnd?.(this);
        this.logger.info('Pricing initialisé');
    }

    private setupAccessibility(): void {
        setAriaAttributes(this.el, {
            role: 'region',
            label: LocaleManager.t('pricing.ariaRegion'),
        });
    }

    private setupBillingToggle(): void {
        const toggleRoot = this.el.querySelector(SELECTORS.billingToggle);
        if (!toggleRoot) return;

        const segmentedBtns = toggleRoot.querySelectorAll<HTMLButtonElement>(SELECTORS.segmentedBtn);
        if (segmentedBtns.length >= 2) {
            this.registerEvent(toggleRoot, 'click', (event: Event) => {
                const target = event.target as HTMLElement;
                const btn = target.closest<HTMLButtonElement>(SELECTORS.segmentedBtn);
                if (!btn || !toggleRoot.contains(btn)) return;
                const index = Array.from(segmentedBtns).indexOf(btn);
                if (index >= 0) {
                    this.setBillingPeriod(index === 1 ? 'yearly' : 'monthly');
                }
            });
            return;
        }

        const buttons = toggleRoot.querySelectorAll<HTMLButtonElement>('[data-billing-period]');
        if (buttons.length === 0) return;

        buttons.forEach((btn) => {
            const handler = () => {
                const period = btn.dataset.billingPeriod as PricingBillingPeriod | undefined;
                if (period === 'monthly' || period === 'yearly') {
                    this.setBillingPeriod(period);
                    buttons.forEach((b) => {
                        b.classList.toggle('button-segmented__btn--active', b === btn);
                        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
                    });
                }
            };
            this.registerEvent(btn, 'click', handler);
        });
    }

    /**
     * Définit la période de facturation (mensuel ou annuel)
     * @param period - Période cible
     */
    public setBillingPeriod(period: PricingBillingPeriod): void {
        if (period === this.billingPeriod) return;
        this.applyBillingPeriod(period, true);
    }

    /**
     * Retourne la période de facturation active
     * @returns Période active
     */
    public getBillingPeriod(): PricingBillingPeriod {
        return this.billingPeriod;
    }

    private applyBillingPeriod(period: PricingBillingPeriod, notify: boolean): void {
        this.billingPeriod = period;
        this.el.dataset.billing = period;
        this.updatePrices();
        if (notify) {
            this.options.onBillingChange?.(period, this);
        }
    }

    private updatePrices(): void {
        const currency = this.options.currency ?? '$';
        const isYearly = this.billingPeriod === 'yearly';

        this.el.querySelectorAll<HTMLElement>(SELECTORS.priceValue).forEach((el) => {
            const monthly = parseFloat(el.dataset.monthly ?? '');
            const yearly = parseFloat(el.dataset.yearly ?? '');
            const value = isYearly && !Number.isNaN(yearly) ? yearly : monthly;
            if (!Number.isNaN(value)) {
                el.textContent = `${currency}${Math.round(value)}`;
            }
        });

        this.el.querySelectorAll<HTMLElement>(SELECTORS.tablePrice).forEach((el) => {
            const monthly = parseFloat(el.dataset.monthly ?? '');
            const yearly = parseFloat(el.dataset.yearly ?? '');
            const value = isYearly && !Number.isNaN(yearly) ? yearly : monthly;
            if (!Number.isNaN(value)) {
                el.textContent = `${currency}${Math.round(value)}`;
            }
        });
    }

    /**
     * Détruit l'instance du composant
     */
    public override destroy(): void {
        if ((this.el as KPricingHTMLElement).K_Pricing === this) {
            delete (this.el as KPricingHTMLElement).K_Pricing;
        }
        super.destroy();
        this.logger.info('Pricing détruit');
    }
}

export type { PricingBillingPeriod };
