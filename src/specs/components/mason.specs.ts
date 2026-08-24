/**
 * @fileoverview Spécifications du composant Mason K3UI
 * @description Spécifications et valeurs par défaut pour un composant de layout Masonry/Packery minimal,
 * qui conserve les classes de spans K3ui s* / m* / l* / xl* comme source de largeur.
 * @author K3UI Team
 * @version 1.0.0
 */

import type { MasonOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Valeurs par défaut pour Mason.
 */
export function getMasonDefaults(): MasonOptions {
    return {
        itemsSelector: '.k3ui-mason__item',
        columns: 12,
        spanBaseColumns: 12,
        gap: 24,
        itemsHeightStrategy: 'boundingClientRect',
        fallbackSpan: 12,
        positionMode: 'transform',
        debug: false,
        priorityLevel: PriorityLevel.MEDIUM,

        // Callbacks issus de BaseOptions (non-utilisés ici mais conservés pour compatibilité API)
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
        onEvent: null,
    };
}

