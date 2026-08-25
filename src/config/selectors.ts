/**
 * @fileoverview Sélecteurs CSS par défaut pour K3UI
 * @description Tous les sélecteurs utilisés pour l'AutoInit des composants
 * @author K3UI Team
 * @version 0.1.0
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Sélecteurs CSS par défaut pour tous les composants
 * @description Les sélecteurs utilisés pour la détection automatique des composants dans le DOM
 */
export interface ComponentSelectors {
    /** Sélecteur pour le composant ScrollSpy */
    ScrollSpy: string;
    /** Sélecteur pour le composant IndexList */
    IndexList: string;
    /** Sélecteur pour le composant ScrollToTop */
    ScrollToTop: string;
    /** Sélecteur pour le composant Ticker */
    /** Sélecteur pour le composant Snackbar */
    Snackbar: string;
    /** Sélecteur pour le composant Toast */
    Toast: string;
    /** Sélecteur pour le composant Chip */
    Chip: string;
    /** Sélecteur pour le composant Collapse */
    Collapse: string;
    /** Sélecteur pour le composant Card */
    Card: string;
    /** Sélecteur pour le composant Shape */
    Shape: string;
    /** Sélecteur pour le composant Select */
    Select: string;
    /** Sélecteur pour le composant Drawer */
    Drawer: string;
    /** Sélecteur pour le composant Divider */
    Divider: string;
    /** Sélecteur pour le composant Stack */
    Stack: string;
    /** Sélecteur pour le composant Sheet */
    Sheet: string;
    /** Sélecteur pour le composant Alert */
    Alert: string;
    /** Sélecteur pour le composant Autocomplete */
    Autocomplete: string;
    /** Sélecteur pour le composant Avatar */
    Avatar: string;
    /** Sélecteur pour le composant Badge */
    Badge: string;
    /** Sélecteur pour le composant Breadcrumb */
    Breadcrumb: string;
    /** Sélecteur pour le composant Bubble */
    Bubble: string;
    /** Sélecteur pour le composant Dialog */
    Dialog: string;
    /** Sélecteur pour le composant Command (palette de commandes) */
    Command: string;
    /** Sélecteur pour le composant MessageBox (boîte de dialogue ALTTP) */
    MessageBox: string;
    /** Sélecteur pour le composant Field */
    Field: string;
    /** Sélecteur pour le composant Fieldset */
    Fieldset: string;
    /** Sélecteur pour le composant Hero */
    Hero: string;
    /** Sélecteur pour le composant Textarea */
    Textarea: string;
    /** Sélecteur pour le composant Pin */
    Pin: string;
    /** Sélecteur pour le composant Pricing */
    Pricing: string;
    /** Sélecteur pour le composant Menu */
    Menu: string;
    /** Sélecteur pour le composant MenuContext */
    MenuContext: string;
    /** Sélecteur pour le composant Switch */
    Switch: string;
    /** Sélecteur pour le composant Checkbox */
    Checkbox: string;
    /** Sélecteur pour le composant Radio */
    Radio: string;
    /** Sélecteur pour le composant Tile */
    Tile: string;
    /** Sélecteur pour le composant Tilt */
    Tilt: string;
    /** Sélecteur pour le composant Todo */
    Todo: string;
    /** Sélecteur pour le composant Datepicker */
    Datepicker: string;
    /** Sélecteur pour le composant Timepicker */
    Timepicker: string;
    /** Sélecteur pour le composant Chart */
    Chart: string;
    /** Sélecteur pour le composant ColorPicker */
    ColorPicker: string;
    /** Sélecteur pour le composant Comparison */
    Comparison: string;
    /** Sélecteur pour le composant Slider */
    Slider: string;
    /** Sélecteur pour le composant ShuffleNumber */
    ShuffleNumber: string;
    /** @deprecated Utiliser ShuffleNumber */
    Slot: string;
    /** Sélecteur pour le composant Firework */
    Firework: string;
    /** Sélecteur pour le composant Flip */
    Flip: string;
    /** Sélecteur pour le composant Confetti */
    Confetti: string;
    /** Sélecteur pour le composant PanelContent */
    PanelContent: string;
    /** Sélecteur pour le composant PanelSplit */
    PanelSplit: string;
    /** Sélecteur pour le composant Snow */
    Snow: string;
    /** Sélecteur pour le composant Table */
    Table: string;
    /** Sélecteur pour le composant Tabs */
    Tabs: string;
    /** Sélecteur pour le composant NavigationBar */
    NavigationBar: string;
    /** Sélecteur pour le composant NavigationRail */
    NavigationRail: string;
    /** Sélecteur pour le composant NavigationMenu */
    NavigationMenu: string;
    /** Sélecteur pour le composant Signature */
    Signature: string;
    /** Sélecteur pour le composant Pace (barre de chargement) */
    Pace: string;
    /** Sélecteur pour le composant Perspective */
    Perspective: string;
    /** Sélecteur pour le composant Loader */
    Loader: string;
    /** Sélecteur pour le composant Heatmap */
    Heatmap: string;
    /** Sélecteur pour le composant Button */
    Button: string;
    /** Sélecteur pour le composant ButtonIcon (bouton d'action) */
    ButtonIcon: string;
    /** Sélecteur pour le composant ButtonShape (pastille + slots shape) */
    ButtonShape: string;
    /** Sélecteur pour le composant ButtonArrow (split-button flèches) */
    ButtonArrow: string;
    /** Sélecteur pour le composant ButtonPad (pad 4 directions) */
    ButtonPad: string;
    /** Sélecteur pour le composant ButtonGrid (grille 3×3) */
    ButtonGrid: string;
    /** Sélecteur pour le composant ButtonSmart (tuile réglages rapides) */
    ButtonSmart: string;
    /** Sélecteur pour le composant ButtonGroups */
    ButtonGroups: string;
    /** Sélecteur pour le composant ButtonSplit */
    ButtonSplit: string;
    /** Sélecteur pour le composant ButtonSegmented */
    ButtonSegmented: string;
    /** Sélecteur pour le composant ButtonFabMenu */
    ButtonFabMenu: string;
    /** Sélecteur pour le composant ButtonFabDial */
    ButtonFabDial: string;
    /** Sélecteur pour le composant ButtonFabRail */
    ButtonFabRail: string;
    /** Sélecteur pour le composant ButtonFab */
    ButtonFab: string;
    /** Sélecteur pour le composant Counter */
    Counter: string;
    /** Sélecteur pour le composant Countdown */
    Countdown: string;
    /** Sélecteur pour le composant CodeBlock */
    CodeBlock: string;
    /** Sélecteur pour le composant Skeleton */
    Skeleton: string;
    /** Sélecteur pour le composant SlideshowCaptions */
    SlideshowCaptions: string;
    /** Sélecteur pour le composant Toolbar */
    Toolbar: string;
    /** Sélecteur pour le composant Tooltips */
    Tooltips: string;
    /** Sélecteur pour le composant Upload */
    Upload: string;
    /** Sélecteur pour le composant WheelPicker */
    WheelPicker: string;
    /** Sélecteur pour le composant List */
    List: string;
    /** Sélecteur pour le composant ListMaker */
    ListMaker: string;
    /** Sélecteur pour le composant Gauge */
    Gauge: string;
    /** Sélecteur pour le composant ProgressIndicator */
    ProgressIndicator: string;
    /** Sélecteur pour le composant QrCode */
    QrCode: string;
    /** Sélecteur pour le composant SwipeDeck */
    SwipeDeck: string;
    /** Sélecteur pour le composant Quote */
    Quote: string;
    /** Sélecteur pour le composant BarCode */
    BarCode: string;
    /** Sélecteur pour le composant Gradient */
    Gradient: string;
    /** Sélecteur pour le composant Halo */
    Halo: string;
    /** Sélecteur pour le composant Holo */
    Holo: string;
    /** Sélecteur pour le composant Pagination */
    Pagination: string;
    /** Sélecteur pour le composant PaginationAlpha (index alphabétique A–Z) */
    PaginationAlpha: string;
    /** Sélecteur pour le composant PaginationNav (cartes Précédent / Suivant) */
    PaginationNav: string;
    /** Sélecteur pour le composant Page (empilement plein écran) */
    Page: string;
    /** Sélecteur pour le composant Parallax */
    Parallax: string;
    /** Sélecteur pour le composant InfiniteScroll */
    InfiniteScroll: string;
    /** Sélecteur pour le composant Marquee */
    Marquee: string;
    /** Sélecteur pour le composant AppBar (Top App Bar) */
    AppBar: string;

    /** Sélecteur pour le composant IsoFilter (filtrage type Isotope sans lib externe) */
    IsoFilter: string;
    /** Sélecteur pour le composant MediaStories */
    MediaStories: string;
}

// ============================================================================
// SÉLECTEURS PAR DÉFAUT
// ============================================================================

/**
 * Sélecteurs par défaut pour les composants
 * @description Ces sélecteurs sont utilisés par l'AutoInit pour détecter et initialiser automatiquement les composants.
 * Le suffixe `:not(.no-autoinit)` permet d'exclure les éléments marqués avec la classe `no-autoinit`.
 */
export const DEFAULT_SELECTORS: ComponentSelectors = {
    ScrollSpy: '.scrollspy:not(.no-autoinit), k3ui-scrollspy:not(.no-autoinit)',
    IndexList: '.index-list:not(.no-autoinit), k3ui-index-list:not(.no-autoinit)',
    ScrollToTop: '.scroll-to-top:not(.no-autoinit), .scrolltotop:not(.no-autoinit), k3ui-scroll-to-top:not(.no-autoinit)',
    Ticker: '.ticker:not(.no-autoinit), k3ui-ticker:not(.no-autoinit)',
    Snackbar: '.snackbar:not(.no-autoinit), k3ui-snackbar:not(.no-autoinit)',
    Toast: '.toast:not(.no-autoinit), k3ui-toast:not(.no-autoinit)',
    Chip: '.chips:not(.no-autoinit), k3ui-chip:not(.no-autoinit)',
    Collapse: '.collapse:not(.no-autoinit), k3ui-collapse:not(.no-autoinit)',
    Card: '.card:not(.no-autoinit), k3ui-card:not(.no-autoinit)',
    Shape: '.shape:not(.no-autoinit), .card__avatar[data-shape]:not(.no-autoinit), k3ui-shape:not(.no-autoinit)',
    Select: '.select:not(.no-autoinit), .select-hidden:not(.no-autoinit), k3ui-select:not(.no-autoinit)',
    Drawer: '.drawer:not(.no-autoinit), k3ui-drawer:not(.no-autoinit)',
    Divider: '.divider:not(.no-autoinit), k3ui-divider:not(.no-autoinit)',
    Stack: '.stack:not(.no-autoinit):not(.avatar-group):not(.swipe-deck), k3ui-stack:not(.no-autoinit)',
    Sheet: '.sheet:not(.no-autoinit), k3ui-sheet:not(.no-autoinit)',
    Alert: '.alert:not(.no-autoinit), k3ui-alert:not(.no-autoinit)',
    Autocomplete: '.autocomplete:not(.no-autoinit), k3ui-autocomplete:not(.no-autoinit)',
    Avatar: '.avatar:not(.no-autoinit), k3ui-avatar:not(.no-autoinit)',
    Badge: '[data-badge]:not(.no-autoinit), :has(> .badge:not(.no-autoinit)), k3ui-badge:not(.no-autoinit)',
    Breadcrumb: '.breadcrumb:not(.no-autoinit), k3ui-breadcrumb:not(.no-autoinit)',
    Bubble: '.bubble:not(.no-autoinit), k3ui-bubble:not(.no-autoinit)',
    Dialog: '.dialog:not(.no-autoinit), k3ui-dialog:not(.no-autoinit)',
    Command: '.command:not(.no-autoinit), k3ui-command:not(.no-autoinit)',
    MessageBox: '.messagebox:not(.no-autoinit), k3ui-messagebox:not(.no-autoinit)',
    Field: 'k3ui-field:not(.no-autoinit)',
    Fieldset: 'k3ui-fieldset:not(.no-autoinit)',
    Hero: 'k3ui-hero:not(.no-autoinit)',
    Textarea: 'k3ui-textarea:not(.no-autoinit)',
    Pin: 'k3ui-pin:not(.no-autoinit), .pin:not(.no-autoinit)',
    Pricing: '.pricing:not(.no-autoinit), k3ui-pricing:not(.no-autoinit)',
    Menu: 'k3ui-menu:not(.no-autoinit)',
    MenuContext: '.menu-context:not(.no-autoinit), k3ui-menu-context:not(.no-autoinit)',
    Switch: '.switch:not(.no-autoinit), k3ui-switch:not(.no-autoinit)',
    Checkbox: '.checkbox:not(.no-autoinit), k3ui-checkbox:not(.no-autoinit)',
    Radio: '.radio:not(.no-autoinit), k3ui-radio:not(.no-autoinit)',
    Tile: '.tile-item:not(.no-autoinit), k3ui-tile:not(.no-autoinit)',
    Tilt: '.tilt:not(.no-autoinit), k3ui-tilt:not(.no-autoinit)',
    Todo: '.todo:not(.no-autoinit), k3ui-todo:not(.no-autoinit)',
    Datepicker: '.datepicker:not(.no-autoinit), k3ui-datepicker:not(.no-autoinit)',
    Timepicker: '.timepicker:not(.no-autoinit), k3ui-timepicker:not(.no-autoinit)',
    Chart: '.chart:not(.no-autoinit), k3ui-chart:not(.no-autoinit)',
    ColorPicker: 'k3ui-color-picker:not(.no-autoinit)',
    Comparison: '.comparison:not(.no-autoinit), k3ui-comparison:not(.no-autoinit)',
    Slider: 'k3ui-slider:not(.no-autoinit)',
    ShuffleNumber:
        '.shuffle-number:not(.no-autoinit), [data-shuffle-number]:not(.no-autoinit), k3ui-shuffle-number:not(.no-autoinit), .slot:not(.no-autoinit), [data-slot]:not(.no-autoinit), k3ui-slot:not(.no-autoinit)',
    /** @deprecated Utiliser ShuffleNumber */
    Slot: '.slot:not(.no-autoinit), [data-slot]:not(.no-autoinit), k3ui-slot:not(.no-autoinit)',
    Firework: 'k3ui-firework:not(.no-autoinit), .firework:not(.no-autoinit)',
    Flip: '.flip:not(.no-autoinit), k3ui-flip:not(.no-autoinit)',
    Confetti: '.confetti:not(.no-autoinit), canvas.custom-canvas:not(.no-autoinit), k3ui-confetti:not(.no-autoinit)',
    PanelContent:
        '.panel-content:not(.no-autoinit), .content-pane:not(.no-autoinit), k3ui-panel-content:not(.no-autoinit)',
    PanelSplit:
        '.panel-split:not(.no-autoinit), .docs-split-pane:not(.no-autoinit), k3ui-panel-split:not(.no-autoinit)',
    Snow: '.snow:not(.no-autoinit), canvas#snow:not(.no-autoinit), k3ui-snow:not(.no-autoinit)',
    Signature: '.signature:not(.no-autoinit), k3ui-signature:not(.no-autoinit)',
    /** Opt-in : mettre `data-k3ui-pace="on"` sur `html` ou `body` (plus d’init automatique globale). */
    Pace: '[data-k3ui-pace="on"]',
    Perspective: '.perspective:not(.no-autoinit), k3ui-perspective:not(.no-autoinit)',
    Loader:
        '.loading-indicator:not(.no-autoinit), .loader:not(.no-autoinit), k3ui-loader:not(.no-autoinit), k3ui-loading-indicator:not(.no-autoinit)',
    Heatmap: '.heatmap:not(.no-autoinit), k3ui-heatmap:not(.no-autoinit)',
    Table: '.table:not(.no-autoinit), k3ui-table:not(.no-autoinit)',
    Tabs: '.tabs-container:not(.no-autoinit), .tabs:not(.no-autoinit)',
    NavigationBar: '.navigation-bar:not(.no-autoinit), k3ui-navigation-bar:not(.no-autoinit)',
    NavigationRail: '.navigation-rail:not(.no-autoinit), k3ui-navigation-rail:not(.no-autoinit)',
    NavigationMenu: '.navigation-menu:not(.no-autoinit), k3ui-navigation-menu:not(.no-autoinit)',
    Button: '.btn:not(.no-autoinit), .button:not(.no-autoinit), k3ui-button:not(.no-autoinit)',
    ButtonIcon: '.btn-icon:not(.no-autoinit), .button-icon:not(.no-autoinit), k3ui-button-icon:not(.no-autoinit)',
    ButtonShape: '.btn-shape:not(.no-autoinit), .button-shape:not(.no-autoinit), k3ui-button-shape:not(.no-autoinit)',
    ButtonArrow: '.btn-arrow:not(.no-autoinit), .button-arrow:not(.no-autoinit), k3ui-button-arrow:not(.no-autoinit)',
    ButtonPad: '.btn-pad:not(.no-autoinit), .button-pad:not(.no-autoinit), k3ui-button-pad:not(.no-autoinit)',
    ButtonGrid: '.btn-grid:not(.no-autoinit), .button-grid:not(.no-autoinit), k3ui-button-grid:not(.no-autoinit)',
    ButtonSmart: '.btn-smart:not(.no-autoinit), .button-smart:not(.no-autoinit), k3ui-button-smart:not(.no-autoinit)',
    ButtonGroups: '.button-groups:not(.no-autoinit), k3ui-button-groups:not(.no-autoinit)',
    ButtonSplit: '.split-btn:not(.no-autoinit), .button-split:not(.no-autoinit), k3ui-button-split:not(.no-autoinit)',
    ButtonSegmented: '.button-segmented:not(.no-autoinit), k3ui-button-segmented:not(.no-autoinit)',
    ButtonFabMenu: '.button-fab-menu:not(.no-autoinit), k3ui-button-fab-menu:not(.no-autoinit)',
    ButtonFabDial: '.button-fab-dial:not(.no-autoinit), k3ui-button-fab-dial:not(.no-autoinit)',
    ButtonFabRail: '.button-fab-rail:not(.no-autoinit), k3ui-button-fab-rail:not(.no-autoinit)',
    ButtonFab: '.button-fab:not(.no-autoinit), k3ui-button-fab:not(.no-autoinit)',
    Counter: '.counter:not(.no-autoinit), k3ui-counter:not(.no-autoinit)',
    Countdown: '.countdown:not(.no-autoinit), k3ui-countdown:not(.no-autoinit)',
    CodeBlock: '.codeblock:not(.no-autoinit), k3ui-codeblock:not(.no-autoinit)',
    Skeleton: '.skeleton:not(.no-autoinit), k3ui-skeleton:not(.no-autoinit)',
    Upload: '.upload:not(.no-autoinit), k3ui-upload:not(.no-autoinit)',
    WheelPicker:
        '.wheel-picker:not(.no-autoinit), [data-wheel-picker]:not(.no-autoinit), k3ui-wheel-picker:not(.no-autoinit)',
    SlideshowCaptions:
        '.slideshow-captions:not(.no-autoinit), [data-slideshow-captions]:not(.no-autoinit), k3ui-slideshow-captions:not(.no-autoinit), #slideshow-captions:not(.no-autoinit)',
    Toolbar: '.toolbar:not(.no-autoinit), k3ui-toolbar:not(.no-autoinit)',
    Tooltips: '[data-tooltip]:not(.no-autoinit), [data-tooltip-title]:not(.no-autoinit), [data-tooltip-body]:not(.no-autoinit)',
    List: '.list:not(.no-autoinit), k3ui-list:not(.no-autoinit)',
    ListMaker: '.list-maker:not(.no-autoinit), k3ui-list-maker:not(.no-autoinit)',
    Gauge: '.gauge:not(.no-autoinit), k3ui-gauge:not(.no-autoinit)',
    ProgressIndicator:
        '.progress-indicator:not(.no-autoinit), k3ui-progress-indicator:not(.no-autoinit)',
    QrCode: '.qrcode:not(.no-autoinit), k3ui-qrcode:not(.no-autoinit)',
    SwipeDeck: '.swipe-deck:not(.no-autoinit), k3ui-swipe-deck:not(.no-autoinit)',
    Quote: '.quote:not(.no-autoinit), k3ui-quote:not(.no-autoinit)',
    BarCode: '.barcode:not(.no-autoinit), k3ui-barcode:not(.no-autoinit)',
    Gradient: '.gradient:not(.no-autoinit), k3ui-gradient:not(.no-autoinit)',
    Halo: '.halo:not(.no-autoinit), [data-halo]:not(.no-autoinit):not(.halo), k3ui-halo:not(.no-autoinit)',
    Holo: '.holo:not(.no-autoinit), [data-holo]:not(.no-autoinit):not(.holo), k3ui-holo:not(.no-autoinit)',
    Pagination: '.pagination:not(.no-autoinit), k3ui-pagination:not(.no-autoinit)',
    PaginationAlpha: '.pagination-alpha:not(.no-autoinit), k3ui-pagination-alpha:not(.no-autoinit)',
    PaginationNav: '.pagination-nav:not(.no-autoinit), k3ui-pagination-nav:not(.no-autoinit)',
    Page: '.page:not(.no-autoinit), k3ui-page:not(.no-autoinit)',
    Parallax: '.parallax:not(.no-autoinit), k3ui-parallax:not(.no-autoinit)',
    InfiniteScroll: '.infinite-scroll:not(.no-autoinit), k3ui-infinite-scroll:not(.no-autoinit)',
    Marquee: '.marquee:not(.no-autoinit), [data-marquee]:not(.no-autoinit), k3ui-marquee:not(.no-autoinit)',
  AppBar: '.appbar:not(.no-autoinit), k3ui-appbar:not(.no-autoinit)',
  IsoFilter: '.isofilter:not(.no-autoinit), k3ui-isofilter:not(.no-autoinit)',
  MediaStories: '.mediastories:not(.no-autoinit), k3ui-mediastories:not(.no-autoinit)',
};

