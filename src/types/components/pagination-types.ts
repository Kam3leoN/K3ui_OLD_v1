/**
 * @fileoverview Types pour le composant Pagination (pagination numérique MD3 Expressive)
 * @description Options et types pour la pagination numérique K3UI
 * @author K3UI Team
 * @version 1.0.0
 */

import { BaseOptions } from '../base/options';
import { PriorityLevel } from '../base/priority';
import type { HapticFeedbackOptions } from '../managers/haptic';

/**
 * Options pour le composant Pagination (pagination numérique MD3 Expressive)
 */
export interface PaginationOptions extends BaseOptions, HapticFeedbackOptions {
  /** Page courante (1-based) @default 1 */
  page: number;
  /** Nombre total de pages @default 10 */
  count: number;
  /** Nombre de pages affichées de chaque côté de la page courante (ellipsis) @default 1 */
  siblingCount: number;
  /** Afficher le bouton première page (<<) @default true */
  showFirst: boolean;
  /** Afficher le bouton dernière page (>>) @default true */
  showLast: boolean;
  /** Afficher le bouton page précédente (<) @default true */
  showPrev: boolean;
  /** Afficher le bouton page suivante (>) @default true */
  showNext: boolean;
  /**
   * Contenu du bouton « première page ». Texte (ex. "<<" ou "première") ou nom d’icône K3UI (ex. "chevron-double-left").
   * Si non défini, utilise "<<".
   */
  firstLabel?: string;
  /**
   * Contenu du bouton « page précédente ». Texte (ex. "<" ou "préc." ou "précédente") ou nom d’icône (ex. "chevron-left").
   * Si non défini, utilise "<".
   */
  prevLabel?: string;
  /**
   * Contenu du bouton « page suivante ». Texte (ex. ">" ou "suiv." ou "suivante") ou nom d’icône (ex. "chevron-right").
   * Si non défini, utilise ">".
   */
  nextLabel?: string;
  /**
   * Contenu du bouton « dernière page ». Texte (ex. ">>" ou "dernière") ou nom d’icône (ex. "chevron-double-right").
   * Si non défini, utilise ">>".
   */
  lastLabel?: string;
  /** Callback appelé lors du changement de page (nouvelle page 1-based) */
  onChange: ((page: number) => void) | null;
  /** Désactiver tous les boutons @default false */
  disabled: boolean;
  /** Niveau de priorité @default PriorityLevel.MEDIUM */
  priorityLevel: PriorityLevel;
  /** Callback appelé avant l'ouverture */
  onOpenStart: ((instance: unknown) => void) | null;
  /** Callback appelé après l'ouverture */
  onOpenEnd: ((instance: unknown) => void) | null;
  /** Callback appelé avant la fermeture */
  onCloseStart: ((instance: unknown) => void) | null;
  /** Callback appelé après la fermeture */
  onCloseEnd: ((instance: unknown) => void) | null;
}

/**
 * Page de pagination (lien précédent/suivant)
 * @deprecated Utiliser PaginationNavPage pour la navigation par étapes
 */
export interface PaginationPage {
  url: string;
  title?: string;
  label?: string;
  disabled?: boolean;
}
