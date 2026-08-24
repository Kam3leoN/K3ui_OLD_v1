/**
 * @fileoverview Spécifications du composant IsoFilter K3UI
 * @description Filtrage "type Isotope" inspiré, sans lib externe, pouvant coordonner un layout Mason.
 * @author K3UI Team
 * @version 1.0.0
 */

import type { IsoFilterOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Valeurs par défaut pour IsoFilter.
 */
export function getIsoFilterDefaults(): IsoFilterOptions {
    return {
        itemsSelector: '[data-isofilter-id]',
        masonContainerSelector: '.k3ui-mason',
        masonItemsSelector: '[data-isofilter-id]',
        controlsSelector: '[data-isofilter-filter]',

        allFilterValue: 'all',
        matchMode: 'any',

        controlFilterAttribute: 'data-isofilter-filter',
        idAttribute: 'data-isofilter-id',
        tagsAttribute: 'data-isofilter-tags',

        masonHiddenAttribute: 'data-k3ui-mason-hidden',

        animationDurationMs: 350,
        fallbackToAllOnNoMatch: true,
        debug: false,
        priorityLevel: PriorityLevel.MEDIUM,

        // Callbacks hérités de BaseOptions (non-utilisés ici mais conservés pour cohérence)
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
        onEvent: null,
    };
}

