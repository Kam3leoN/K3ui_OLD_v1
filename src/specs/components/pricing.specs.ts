/**
 * @fileoverview Spécifications du composant Pricing K3UI
 * @description Grille tarifaire SaaS avec toggle mensuel/annuel et tableau comparatif
 * @author K3UI Team
 * @version 1.0.0
 */

import type { PricingOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/** Période de facturation supportée */
export type PricingBillingPeriod = 'monthly' | 'yearly';

/**
 * Spécifications du composant Pricing
 */
export const PricingSpecs = {
    behaviors: {
        billingPeriod: 'monthly' as PricingBillingPeriod,
        currency: '$',
        yearlyDiscount: 0.2,
        darkTheme: false,
    },

    accessibility: {
        role: 'region',
        autoDisableForReducedMotion: false,
    },
};

/**
 * Extrait les valeurs par défaut pour Pricing
 * @returns Options par défaut pour Pricing
 */
export function getPricingDefaults(): PricingOptions {
    return {
        billingPeriod: PricingSpecs.behaviors.billingPeriod,
        currency: PricingSpecs.behaviors.currency,
        yearlyDiscount: PricingSpecs.behaviors.yearlyDiscount,
        darkTheme: PricingSpecs.behaviors.darkTheme,
        onBillingChange: null,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
        priorityLevel: PriorityLevel.MEDIUM,
    };
}
