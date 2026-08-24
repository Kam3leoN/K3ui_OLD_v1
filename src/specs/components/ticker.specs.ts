/**
 * @fileoverview Spécifications du composant Ticker K3UI
 * @description Affichage d'une valeur chiffrée signée (cotation / KPI)
 * @author K3UI Team
 * @version 1.0.0
 */

import type { TickerOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Spécifications du composant Ticker
 */
export const TickerSpecs = {
    behaviors: {
        format: 'percent' as const,
        indicator: 'caret' as const,
        size: 'md' as const,
        layout: 'inline' as const,
        flatThreshold: 0,
        locale: 'fr-FR',
        currency: 'EUR',
    },
    accessibility: {
        role: 'group',
    },
    animations: {
        flashDurationMs: 620,
        caretTransitionMs: 140,
    },
};

/**
 * Extrait les valeurs par défaut pour Ticker
 * @returns Options par défaut
 */
export function getTickerDefaults(): TickerOptions {
    return {
        label: '',
        value: 0,
        format: TickerSpecs.behaviors.format,
        indicator: TickerSpecs.behaviors.indicator,
        precision: null,
        locale: TickerSpecs.behaviors.locale,
        currency: TickerSpecs.behaviors.currency,
        delta: null,
        flatThreshold: TickerSpecs.behaviors.flatThreshold,
        signOnValue: false,
        size: TickerSpecs.behaviors.size,
        layout: TickerSpecs.behaviors.layout,
        live: false,
        onChange: null,
        priorityLevel: PriorityLevel.MEDIUM,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
    };
}
