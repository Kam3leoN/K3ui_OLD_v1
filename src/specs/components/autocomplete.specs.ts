/**
 * @fileoverview Spécifications du composant Autocomplete K3UI
 * @description Spécifications Material Design 3 Expressive (inspiré M3E)
 * @author K3UI Team
 * @version 1.0.0
 */

import type { AnimationConfig } from '../../types/components/animations';
import type { AutocompleteOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Spécifications du composant Autocomplete
 */
export const AutocompleteSpecs = {
  behaviors: {
    filter: 'contains' as const,
    caseSensitive: false,
    autoActivate: false,
    required: false,
    hideNoData: false,
    hideLoading: false,
    loading: false,
    closeOnSelect: true,
    openOnFocus: true,
  },

  animations: {
    enter: {
      type: 'fade' as const,
      duration: 200,
      easing: 'ease-out' as const,
    } as AnimationConfig,
    exit: {
      type: 'fade' as const,
      duration: 150,
      easing: 'ease-in' as const,
    } as AnimationConfig,
  },

  accessibility: {
    role: 'combobox' as const,
    listboxRole: 'listbox' as const,
    optionRole: 'option' as const,
    autoDisableForReducedMotion: false,
  },
} as const;

/**
 * Extrait les valeurs par défaut pour Autocomplete
 * @returns Options par défaut
 */
export function getAutocompleteDefaults(): AutocompleteOptions {
  return {
    filter: AutocompleteSpecs.behaviors.filter,
    caseSensitive: AutocompleteSpecs.behaviors.caseSensitive,
    autoActivate: AutocompleteSpecs.behaviors.autoActivate,
    required: AutocompleteSpecs.behaviors.required,
    hideNoData: AutocompleteSpecs.behaviors.hideNoData,
    hideLoading: AutocompleteSpecs.behaviors.hideLoading,
    loading: AutocompleteSpecs.behaviors.loading,
    closeOnSelect: AutocompleteSpecs.behaviors.closeOnSelect,
    openOnFocus: AutocompleteSpecs.behaviors.openOnFocus,
    panelClass: '',
    for: null,
    options: null,
    highlightMatches: true,
    priorityLevel: PriorityLevel.MEDIUM,
    onOpenStart: null,
    onOpenEnd: null,
    onCloseStart: null,
    onCloseEnd: null,
    onQuery: null,
    onChange: null,
    onSelect: null,
  };
}
