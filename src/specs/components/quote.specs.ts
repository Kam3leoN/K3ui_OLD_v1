/**
 * @fileoverview Spécifications du composant Quote K3UI
 * @description Citation motivante avec encoche auteur (Material You)
 * @author K3UI Team
 * @version 1.0.0
 */

import type { QuoteOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Spécifications du composant Quote
 */
export const QuoteSpecs = {
  maxLength: {
    default: 140,
  },

  storage: {
    keyPrefix: 'k3ui-quote-daily',
  },

  accessibility: {
    role: 'blockquote' as const,
  },
} as const;

/**
 * Extrait les valeurs par défaut pour Quote
 */
export function getQuoteDefaults(): QuoteOptions {
  return {
    priorityLevel: PriorityLevel.MEDIUM,
    quote: '',
    author: '',
    quotes: [],
    random: false,
    daily: false,
    maxLength: QuoteSpecs.maxLength.default,
    refreshOnClick: false,
    onRefresh: null,
    onOpenStart: null,
    onOpenEnd: null,
    onCloseStart: null,
    onCloseEnd: null,
  };
}
