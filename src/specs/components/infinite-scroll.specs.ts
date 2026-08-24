/**
 * @fileoverview Spécifications du composant InfiniteScroll K3UI
 * @description Chargement progressif des pages (scroll/click) en alternative autonome de navigation.
 * @author K3UI Team
 * @version 1.0.0
 */

import { PriorityLevel } from '../../types/base';
import type { InfiniteScrollOptions } from '../../types/components';

/**
 * Valeurs par défaut pour InfiniteScroll
 */
export function getInfiniteScrollDefaults(): InfiniteScrollOptions {
  return {
    enabled: true,
    currentPage: 1,
    maxPages: 10,
    threshold: 120,
    autoLoadOnScroll: true,
    triggerEvent: 'both',
    disabled: false,
    get: false,
    itemsContainerSelector: null,
    itemSelector: null,
    showStatus: true,
    loadingText: 'Chargement...',
    finishedText: 'Tous les éléments ont été chargés',
    triggerLabel: 'Afficher plus',
    prefetch: true,
    onLoadMore: null,
    onPageChange: null,
    onError: null,
    priorityLevel: PriorityLevel.MEDIUM,
    onOpenStart: null,
    onOpenEnd: null,
    onCloseStart: null,
    onCloseEnd: null,
  };
}
