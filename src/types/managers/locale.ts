/**
 * @fileoverview Types pour le LocaleManager K3UI
 * @description LocaleCode, options et structure des dictionnaires de traduction
 * @author K3UI Team
 * @version 1.0.0
 */

/**
 * Codes de locale supportés
 */
export type LocaleCode = 'fr-FR' | 'en-US';

/**
 * Options du LocaleManager
 */
export interface LocaleManagerOptions {
  /** Locale courante */
  locale?: LocaleCode;
  /** Locale de repli si une clé est absente */
  fallbackLocale?: LocaleCode;
  /** Clé de stockage pour persister la préférence */
  storageKey?: string;
  /** Sauvegarder la préférence en localStorage */
  savePreference?: boolean;
  /** Callback lors du changement de locale */
  onChange?: ((locale: LocaleCode) => void) | null;
}

/**
 * Structure des traductions par namespace (pagination, timepicker, paginationNav)
 */
export interface PaginationTranslations {
  firstPage: string;
  lastPage: string;
  previous: string;
  next: string;
  ariaNavLabel: string;
  ariaFirstPage: string;
  ariaLastPage: string;
  ariaPrevious: string;
  ariaNext: string;
  /** Libellé pour "Page" (ex. "Page 3" = ariaPage + " " + num) */
  ariaPage: string;
}

/** Traductions pour le composant PaginationNav (cartes Précédent/Suivant) */
export interface PaginationNavTranslations {
  previous: string;
  next: string;
  ariaNavLabel: string;
  ariaPrevious: string;
  ariaNext: string;
}

/** Libellés accessibilité pour le composant Chart */
export interface ChartTranslations {
  typePiePadAngle: string;
  typeNightingale: string;
  typeFunnel: string;
  typeHeatmap: string;
  typeBar: string;
  typeBarHorizontal: string;
  typeScatter: string;
  typeScatterClustering: string;
  typeCandlestick: string;
  typeRadar: string;
  typeRadarMultiple: string;
  typeLine: string;
  typeLineSmooth: string;
  typeArea: string;
  typeLineStacked: string;
  typeAreaStacked: string;
  typeBump: string;
  typeBasicChord: string;
  typeSunburstRounded: string;
  typeMixedLineBar: string;
  typeBarNegative: string;
  typeRingGauge: string;
  emptyData: string;
  defaultSeries: string;
  dataTableCaption: string;
  dataColumnCategory: string;
  dataColumnValue: string;
}

/** Traductions pour le composant Table */
export interface TableTranslations {
  /** ARIA : label par défaut du tableau */
  defaultAriaLabel: string;
  /** Placeholder du champ de recherche */
  searchPlaceholder: string;
  /** ARIA : label du champ de recherche */
  searchAriaLabel: string;
  /** ARIA : label de la région de pagination */
  paginationNavAriaLabel: string;
  /** Plage de résultats : {start}, {end}, {total} */
  resultsRange: string;
  /** Page courante sur total : {current}, {total} */
  pageOfTotal: string;
}

export interface TimepickerTranslations {
  placeholder: string;
  cancel: string;
  confirm: string;
  ariaOpenPicker: string;
  ariaLabel: string;
  modalTitle: string;
  hour: string;
  minute: string;
}

export interface DialogTranslations {
  titleConfirmation: string;
  titleDelete: string;
  buttonConfirm: string;
  buttonDelete: string;
  titleAlert: string;
  ok: string;
  cancel: string;
  save: string;
  reset: string;
  close: string;
  scrollableContent: string;
}

export interface TodoTranslations {
  placeholder: string;
  ariaInputLabel: string;
  ariaAddButtonLabel: string;
  ariaListLabel: string;
  ariaClearCompleted: string;
  clearCompletedText: string;
  filterAll: string;
  filterActive: string;
  filterCompleted: string;
  ariaEditLabel: string;
  ariaDeleteLabel: string;
  taskRemainingOne: string;
  tasksRemaining: string;
  task: string;
  tasks: string;
  visible: string;
  visibles: string;
}

export interface DatepickerTranslations {
  placeholder: string;
  ariaLabel: string;
  cancel: string;
  confirm: string;
  ok: string;
  openCalendar: string;
  selectDate: string;
  changeView: string;
  selectYear: string;
  selectMonth: string;
  selectDay: string;
  monthPrev: string;
  monthNext: string;
  yearBlockPrev: string;
  yearBlockNext: string;
  yearLabel: string;
  monthLabel: string;
  enterDate: string;
  /** Jours de la semaine (dimanche → samedi), format court */
  weekday0: string;
  weekday1: string;
  weekday2: string;
  weekday3: string;
  weekday4: string;
  weekday5: string;
  weekday6: string;
  /** Mois (janvier → décembre) */
  month0: string;
  month1: string;
  month2: string;
  month3: string;
  month4: string;
  month5: string;
  month6: string;
  month7: string;
  month8: string;
  month9: string;
  month10: string;
  month11: string;
}

export interface SnackbarTranslations {
  close: string;
}

export interface ToastTranslations {
  close: string;
}

export interface SelectTranslations {
  placeholder: string;
  ariaLabel: string;
  noResults: string;
}

export interface AutocompleteTranslations {
  ariaLabel: string;
  loadingLabel: string;
  noDataLabel: string;
  resultsLabel: string;
}

export interface FieldTranslations {
  showPassword: string;
  hidePassword: string;
  clear: string;
}

export interface ChipTranslations {
  ariaAddChip: string;
  remove: string;
  removeChipLabel: string;
}

export interface SnowTranslations {
  ariaLabel: string;
}

export interface ConfettiTranslations {
  ariaLabel: string;
}

export interface CountdownTranslations {
  ariaLabel: string;
  /** Message affiché quand le countdown est terminé */
  endMessage: string;
  month: string;
  months: string;
  day: string;
  days: string;
  hour: string;
  hours: string;
  minute: string;
  minutes: string;
  second: string;
  seconds: string;
  /** Libellés courts (countdowns compacts) */
  monthShort: string;
  dayShort: string;
  hourShort: string;
  minuteShort: string;
  secondShort: string;
  millisecond: string;
  milliseconds: string;
}

export interface CodeBlockTranslations {
  ariaLabel: string;
  copy: string;
  copySuccess: string;
  copyError: string;
  download?: string;
  /** Libellé du bouton « Voir plus » (collapse) */
  expandMore: string;
  /** Libellé du bouton « Réduire » (expand) */
  expandLess: string;
}

export interface PerspectiveTranslations {
  ariaPrev: string;
  ariaNext: string;
}

export interface PaceTranslations {
  ariaProgress: string;
}

export interface LoadingIndicatorTranslations {
  ariaProgress: string;
}

export interface HeatmapTranslations {
  ariaLabel: string;
  /** Template tooltip : {date} et {count} (ex. "15 fév. 2025 : 12 connexions") */
  tooltipCount: string;
  noActivity: string;
}

export interface NavigationBarTranslations {
  /** ARIA : label de la barre de navigation */
  ariaLabel: string;
}

export interface NavigationRailTranslations {
  /** ARIA : label du rail de navigation */
  ariaLabel: string;
  /** ARIA : rail réduit */
  ariaLabelCollapsed: string;
  /** ARIA : rail étendu */
  ariaLabelExpanded: string;
}

export interface NavigationMenuTranslations {
  /** ARIA : label du menu de navigation */
  ariaLabel: string;
}

export interface ButtonSegmentedTranslations {
  /** Libellé ARIA par défaut du conteneur (boutons segmentés) */
  ariaLabel: string;
}

export interface ButtonFabMenuTranslations {
  /** ARIA : ouvrir le menu FAB */
  ariaOpen: string;
  /** ARIA : fermer le menu FAB */
  ariaClose: string;
}

export interface ButtonFabDialTranslations {
  ariaOpen: string;
  ariaClose: string;
}

export interface ButtonFabRailTranslations {
  ariaOpen: string;
  ariaClose: string;
}

export interface MenuContextTranslations {
  /** ARIA : libellé de la zone / hôte du menu contextuel */
  ariaLabel: string;
}

export interface ButtonFabTranslations {
  /** ARIA : label par défaut du FAB (action principale) */
  ariaLabel: string;
  /** Label par défaut pour Extended FAB (ex. "Create") */
  labelDefault: string;
}

export interface ScrollToTopTranslations {
  /** ARIA : libellé du bouton retour en haut */
  ariaLabel: string;
  /** Tooltip affiché au survol */
  tooltipLabel: string;
}

/** Traductions du composant Page (empilement plein écran) */
export interface PageTranslations {
  /** ARIA : région principale */
  regionAriaLabel: string;
  /** ARIA : libellé d'un point de navigation */
  navSectionAriaLabel: string;
}

export interface ScrollSpyTranslations {
  /** Overline « Sur cette page » / « On this page » */
  onThisPage: string;
  /** ARIA : label de la navigation sommaire */
  navAriaLabel: string;
  /** Libellé du bouton mobile (drawer) */
  mobileTrigger: string;
  /** ARIA : ouvrir le sommaire */
  openDrawer: string;
  /** ARIA : fermer le sommaire */
  closeDrawer: string;
}

export interface IndexListTranslations {
  /** ARIA : label du rail d'index */
  railAriaLabel: string;
  /** ARIA : aller à la section {key} */
  sectionJump: string;
  /** ARIA : section active */
  sectionActive: string;
  /** ARIA : clé sans entrée */
  sectionEmpty: string;
}

export interface SkeletonTranslations {
  /** ARIA : placeholder de chargement */
  ariaLabel: string;
}

export interface ListTranslations {
  /** ARIA : label de la liste */
  ariaListLabel: string;
  /** Message "supprimé" (ex. pour snackbar) */
  deleted: string;
  /** Message "archivé" (ex. pour snackbar) */
  archived: string;
  /** Libellé du bouton Annuler (undo) */
  undo: string;
  /** Restaurer (bouton ou lien) */
  restore: string;
}

export interface CardTranslations {
  /** ARIA : label carte statique */
  ariaCard: string;
  /** ARIA : label carte cliquable */
  ariaClickable: string;
  /** ARIA : label carte sélectionnable */
  ariaSelectable: string;
}

/** Traductions du composant Flip */
export interface FlipTranslations {
  /** ARIA : basculer recto/verso */
  ariaToggle: string;
}

export interface ComparisonTranslations {
  /** Libellé par défaut — image avant */
  beforeLabelDefault: string;
  /** Libellé par défaut — image après */
  afterLabelDefault: string;
  /** Alt par défaut — image avant */
  beforeAltDefault: string;
  /** Alt par défaut — image après */
  afterAltDefault: string;
  /** ARIA : description du curseur de comparaison */
  ariaSlider: string;
}

export interface PricingTranslations {
  /** ARIA : label de la section tarifaire */
  ariaRegion: string;
  /** Libellé période mensuelle */
  billingMonthly: string;
  /** Libellé période annuelle */
  billingYearly: string;
  /** Indication économie facturation annuelle */
  billingSaveHint: string;
  /** Badge plan recommandé */
  badgePopular: string;
  /** Suffixe prix par mois */
  periodMonthly: string;
  /** Suffixe prix par an */
  periodYearly: string;
}

export interface GaugeTranslations {
  /** Valeur non définie (affichage placeholder) */
  valueUnknown: string;
  /** ARIA : description par défaut de l'indicateur */
  ariaLabelDefault: string;
}

/** Libellés pour le composant Ticker (cotations / KPI) */
export interface TickerTranslations {
  /** Glyphe / placeholder valeur indisponible */
  valueUnknown: string;
  /** Phrase aria quand la valeur n'est pas un nombre */
  valueUnavailable: string;
  /** Préfixe aria tendance haussière */
  trendUp: string;
  /** Préfixe aria tendance baissière */
  trendDown: string;
  /** Préfixe aria tendance stable */
  trendFlat: string;
}

export interface QrCodeTranslations {
  /** ARIA : description du QR code */
  ariaLabel: string;
}

export interface StackTranslations {
  /** ARIA : description de la pile */
  ariaLabel: string;
  /** ARIA : indicateur d’éléments restants (+N) */
  remainingLabel: string;
}

export interface SwipeDeckTranslations {
  /** ARIA : description de la pile de cartes */
  ariaLabel: string;
}

export interface AlertTranslations {
  /** ARIA : description de l'encart */
  ariaLabel: string;
  /** Titre variante alerte */
  titleAlert: string;
  /** Titre variante info */
  titleInfo: string;
  /** Titre variante warning */
  titleWarning: string;
  /** Titre variante note */
  titleNote: string;
  /** Titre variante tips */
  titleTips: string;
  /** Titre variante hint */
  titleHint: string;
}

export interface CollapseTranslations {
  /** ARIA : label du groupe collapse */
  ariaLabel: string;
  /** ARIA : action pour développer un item */
  expand: string;
  /** ARIA : action pour réduire un item */
  collapse: string;
}

export interface QuoteTranslations {
  /** ARIA : label du bloc citation */
  ariaLabel: string;
  /** ARIA : action de rafraîchissement au clic */
  refreshAriaLabel: string;
}

export interface ListMakerTranslations {
  /** ARIA : label de la liste à marqueurs */
  ariaLabel: string;
}

export interface MediaStoriesTranslations {
  /** ARIA : label du viewer */
  ariaLabel: string;
  /** ARIA : bouton fermer */
  close: string;
  /** ARIA : quitter le fullscreen */
  exitFullscreen: string;
  /** ARIA : story précédente */
  previous: string;
  /** ARIA : story suivante */
  next: string;
  /** Lien « Voir plus » */
  seeMore: string;
  /** ARIA : liker */
  like: string;
  /** ARIA : retirer le like */
  unlike: string;
  /** ARIA : partager */
  share: string;
  /** Feedback copie presse-papiers */
  shareCopied: string;
  /** ARIA : galerie */
  galleryAriaLabel: string;
  /** ARIA : ouvrir un album */
  openAlbum: string;
}

export interface BarCodeTranslations {
  /** ARIA : description du code-barres */
  ariaLabel: string;
}

export interface AppBarTranslations {
  /** ARIA : label de la top app bar */
  ariaLabel: string;
  /** ARIA : champ de recherche (variante search) si aucun label explicite */
  searchInputAriaLabel: string;
}

/** Traductions pour le composant Command (palette de commandes MD3) */
export interface CommandTranslations {
  /** Placeholder du champ de recherche */
  searchPlaceholder: string;
  /** ARIA : label du dialogue palette */
  ariaLabel: string;
  /** ARIA : effacer la recherche */
  ariaClearSearch: string;
  /** Message aucun résultat */
  noResults: string;
  /** Footer : naviguer */
  footerNavigate: string;
  /** Footer : exécuter */
  footerRun: string;
  /** Footer : fermer */
  footerClose: string;
}

/** Traductions pour le composant Breadcrumb (fil d'Ariane) */
export interface BreadcrumbTranslations {
  /** ARIA : label de la navigation fil d'Ariane */
  ariaLabel: string;
}

/** Traductions pour le composant PaginationAlpha (index alphabétique A–Z) */
export interface PaginationAlphaTranslations {
  /** ARIA : label de la navigation index alphabétique */
  ariaLabel: string;
  /** Singulier pour une entrée (ex. "entrée") */
  entryOne: string;
  /** Pluriel pour plusieurs entrées (ex. "entrées") */
  entryMany: string;
}

/** Traductions pour le composant Tooltips (mode rich interactif) */
export interface TooltipsTranslations {
  /** Bouton secondaire (text) — ex. Ignorer */
  actionDismiss: string;
  /** Bouton primaire (filled) — ex. OK */
  actionConfirm: string;
}

export interface ColorPickerTranslations {
  title: string;
  hexLabel: string;
  hexHelper: string;
  hctLabel: string;
  hctPlaceholder: string;
  copyHex: string;
  copyRgb: string;
  copyHsl: string;
  copyHsv: string;
  copyCmyk: string;
  copyHct: string;
  copied: string;
  ariaPreview: string;
  ariaSaturationLightness: string;
  ariaHue: string;
}

/**
 * Dictionnaire complet des traductions (tous namespaces)
 */
export interface Translations {
  breadcrumb: BreadcrumbTranslations;
  colorPicker: ColorPickerTranslations;
  paginationAlpha: PaginationAlphaTranslations;
  buttonSegmented: ButtonSegmentedTranslations;
  buttonFabMenu: ButtonFabMenuTranslations;
  buttonFabDial: ButtonFabDialTranslations;
  buttonFabRail: ButtonFabRailTranslations;
  menuContext: MenuContextTranslations;
  buttonFab: ButtonFabTranslations;
  scrollToTop: ScrollToTopTranslations;
  page: PageTranslations;
  scrollspy: ScrollSpyTranslations;
  indexList: IndexListTranslations;
  pagination: PaginationTranslations;
  paginationNav: PaginationNavTranslations;
  table: TableTranslations;
  timepicker: TimepickerTranslations;
  dialog: DialogTranslations;
  todo: TodoTranslations;
  datepicker: DatepickerTranslations;
  snackbar: SnackbarTranslations;
  toast: ToastTranslations;
  select: SelectTranslations;
  autocomplete: AutocompleteTranslations;
  field: FieldTranslations;
  chip: ChipTranslations;
  snow: SnowTranslations;
  confetti: ConfettiTranslations;
  countdown: CountdownTranslations;
  codeblock: CodeBlockTranslations;
  perspective: PerspectiveTranslations;
  pace: PaceTranslations;
  loadingIndicator: LoadingIndicatorTranslations;
  heatmap: HeatmapTranslations;
  navigationBar: NavigationBarTranslations;
  navigationRail: NavigationRailTranslations;
  navigationMenu: NavigationMenuTranslations;
  skeleton: SkeletonTranslations;
  list: ListTranslations;
  card: CardTranslations;
  flip: FlipTranslations;
  comparison: ComparisonTranslations;
  pricing: PricingTranslations;
  gauge: GaugeTranslations;
  ticker: TickerTranslations;
  qrcode: QrCodeTranslations;
  stack: StackTranslations;
  swipedeck: SwipeDeckTranslations;
  alert: AlertTranslations;
  collapse: CollapseTranslations;
  quote: QuoteTranslations;
  listMaker: ListMakerTranslations;
  mediastories: MediaStoriesTranslations;
  barcode: BarCodeTranslations;
  command: CommandTranslations;
  appbar: AppBarTranslations;
  chart: ChartTranslations;
  tooltips: TooltipsTranslations;
}
