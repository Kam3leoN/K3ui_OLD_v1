/**
 * @fileoverview Configurations par défaut pour K3UI
 * @description Toutes les valeurs par défaut pour les managers et composants
 * @description Les valeurs pour les composants sont extraites depuis leurs fichiers spec respectifs
 * @author K3UI Team
 * @version 0.1.0
 */

import { getAlertDefaults } from '../specs/components/alert.specs';
import { getAutocompleteDefaults } from '../specs/components/autocomplete.specs';
import { getAvatarDefaults } from '../specs/components/avatar.specs';
import { getBadgeDefaults } from '../specs/components/badge.specs';
import { getBreadcrumbDefaults } from '../specs/components/breadcrumb.specs';
import { getBubbleDefaults } from '../specs/components/bubble.specs';
import { getButtonDefaults } from '../specs/components/button.specs';
import { getButtonGroupsDefaults } from '../specs/components/button-groups.specs';
import { getToolbarDefaults } from '../specs/components/toolbar.specs';
import { getButtonSegmentedDefaults } from '../specs/components/button-segmented.specs';
import { getButtonSmartDefaults } from '../specs/components/button-smart.specs';
import { getButtonFabMenuDefaults } from '../specs/components/button-fab-menu.specs';
import { getButtonFabDialDefaults } from '../specs/components/button-fab-dial.specs';
import { getButtonFabRailDefaults } from '../specs/components/button-fab-rail.specs';
import { getButtonFabDefaults } from '../specs/components/button-fab.specs';
import { getCounterDefaults } from '../specs/components/counter.specs';
import { getCountdownDefaults } from '../specs/components/countdown.specs';
import { getCodeBlockDefaults } from '../specs/components/codeblock.specs';
import { getCardDefaults } from '../specs/components/card.specs';
import { getChartDefaults } from '../specs/components/chart.specs';
import { getCheckboxDefaults } from '../specs/components/checkbox.specs';
import { getChipDefaults } from '../specs/components/chip.specs';
import { getCollapseDefaults } from '../specs/components/collapse.specs';
import { getConfettiDefaults } from '../specs/components/confetti.specs';
import { getPanelContentDefaults } from '../specs/components/panel-content.specs';
import { getPanelSplitDefaults } from '../specs/components/panel-split.specs';
import { getDatepickerDefaults } from '../specs/components/datepicker.specs';
import { getDialogDefaults } from '../specs/components/dialog.specs';
import { getCommandDefaults } from '../specs/components/command.specs';
import { getMessageBoxDefaults } from '../specs/components/messagebox.specs';
import { getDrawerDefaults } from '../specs/components/drawer.specs';
import { getDividerDefaults } from '../specs/components/divider.specs';
import { getStackDefaults } from '../specs/components/stack.specs';
import { getFieldDefaults } from '../specs/components/field.specs';
import { getFieldsetDefaults } from '../specs/components/fieldset.specs';
import { getHeroDefaults } from '../specs/components/hero.specs';
import { getLoaderDefaults } from '../specs/components/loader.specs';
import { getHeatmapDefaults } from '../specs/components/heatmap.specs';
import { getMenuDefaults } from '../specs/components/menu.specs';
import { getMenuContextDefaults } from '../specs/components/menu-context.specs';
import { getPaceDefaults } from '../specs/components/pace.specs';
import { getPerspectiveDefaults } from '../specs/components/perspective.specs';
import { getPinDefaults } from '../specs/components/pin.specs';
import { getPricingDefaults } from '../specs/components/pricing.specs';
import { getRadioDefaults } from '../specs/components/radio.specs';
import { getTileDefaults } from '../specs/components/tile.specs';
import { getScrollSpyDefaults } from '../specs/components/scrollspy.specs';
import { getScrollToTopDefaults } from '../specs/components/scroll-to-top.specs';
import { getSelectDefaults } from '../specs/components/select.specs';
import { getShapeDefaults } from '../specs/components/shape.specs';
import { getSkeletonDefaults } from '../specs/components/skeleton.specs';
import { getUploadDefaults } from '../specs/components/upload.specs';
import { getSheetDefaults } from '../specs/components/sheet.specs';
import { getSignatureDefaults } from '../specs/components/signature.specs';
import { getColorPickerDefaults } from '../specs/components/color-picker.specs';
import { getSliderDefaults } from '../specs/components/slider.specs';
import { getSnackbarDefaults } from '../specs/components/snackbar.specs';
import { getToastDefaults } from '../specs/components/toast.specs';
import { getSlideshowCaptionsDefaults } from '../specs/components/slideshow-captions.specs';
import { getFireworkDefaults } from '../specs/components/firework.specs';
import { getSnowDefaults } from '../specs/components/snow.specs';
import { getSwitchDefaults } from '../specs/components/switch.specs';
import { getTableDefaults } from '../specs/components/table.specs';
import { getTextareaDefaults } from '../specs/components/textarea.specs';
import { getTickerDefaults } from '../specs/components/ticker.specs';
import { getTimepickerDefaults } from '../specs/components/timepicker.specs';
import { getTodoDefaults } from '../specs/components/todo.specs';
import { getTabsDefaults } from '../specs/components/tabs.specs';
import { getNavigationBarDefaults } from '../specs/components/navigation-bar.specs';
import { getNavigationRailDefaults } from '../specs/components/navigation-rail.specs';
import { getNavigationMenuDefaults } from '../specs/components/navigation-menu.specs';
import { getTooltipsDefaults } from '../specs/components/tooltips.specs';
import { getListDefaults } from '../specs/components/list.specs';
import { getListMakerDefaults } from '../specs/components/list-maker.specs';
import { getComparisonDefaults } from '../specs/components/comparison.specs';
import { getGaugeDefaults } from '../specs/components/gauge.specs';
import { getProgressIndicatorDefaults } from '../specs/components/progress-indicator.specs';
import { getQrCodeDefaults } from '../specs/components/qrcode.specs';
import { getSwipeDeckDefaults } from '../specs/components/swipe-deck.specs';
import { getQuoteDefaults } from '../specs/components/quote.specs';
import { getBarCodeDefaults } from '../specs/components/barcode.specs';
import { getGradientDefaults } from '../specs/components/gradient.specs';
import { getFlipDefaults } from '../specs/components/flip.specs';
import { getHaloDefaults } from '../specs/components/halo.specs';
import { getHoloDefaults } from '../specs/components/holo.specs';
import { getPaginationDefaults } from '../specs/components/pagination.specs';
import { getPaginationAlphaDefaults } from '../specs/components/pagination-alpha.specs';
import { getPaginationNavDefaults } from '../specs/components/paginationnav.specs';
import { getPageDefaults } from '../specs/components/page.specs';
import { getParallaxDefaults } from '../specs/components/parallax.specs';
import { getTiltDefaults } from '../specs/components/tilt.specs';
import { getInfiniteScrollDefaults } from '../specs/components/infinite-scroll.specs';
import { getMarqueeDefaults } from '../specs/components/marquee.specs';
import { getShuffleNumberDefaults } from '../specs/components/shuffle-number.specs';
import { getWheelPickerDefaults } from '../specs/components/wheel-picker.specs';
import { getAppBarDefaults } from '../specs/components/appbar.specs';
import { getIsoFilterDefaults } from '../specs/components/isofilter.specs';
import { getMediaStoriesDefaults } from '../specs/components/mediastories.specs';
import type { MenuItem, TodoItem } from '../types/components/components';
import type { DynamicColorOptions } from '../core/managers/DynamicColorManager';
import { Variant } from '../utils/color';
// ============================================================================
// TYPES
// ============================================================================

/**
 * Configuration par défaut pour IconManager
 */
export interface IconManagerConfig {
    /** Chemin de base pour les icônes */
    basePath: string;
    /** Délai de debounce en millisecondes (si coalesceMutationsWithRaf est false) */
    debounceDelay: number;
    /** Activer le cache des icônes */
    enableCache: boolean;
    /** Racine MutationObserver des icônes (null = document.body) */
    mutationObserverRoot: HTMLElement | null;
    /** Regrouper les mutations sur une frame (requestAnimationFrame) */
    coalesceMutationsWithRaf: boolean;
    /** Regrouper les injections SVG sur une frame (anti pop-in) */
    batchRevealWithRaf: boolean;
    /** Délai max (ms) de la passe initiale avant whenReady / révélation */
    initialBatchTimeoutMs: number;
    /**
     * Retenir toutes les injections jusqu’au settle (hideBodyUntilReady).
     * false = peindre tout de suite les SVG sync (cache / embed).
     */
    atomicPageReveal: boolean;
}

/**
 * Configuration par défaut pour SoundFXManager
 */
export interface SoundFXManagerConfig {
    /** Chemin de base pour les sons */
    soundsPath: string;
    /** Activer/désactiver les sons */
    enabled: boolean;
    /** Volume par défaut (0.0 à 1.0) */
    volume: number;
    /** Activer les sons au survol */
    hoverEnabled: boolean;
    /** Activer les sons au clic */
    clickEnabled: boolean;
    /** Activer les sons à la sortie */
    leaveEnabled: boolean;
}

/**
 * Options par défaut pour tous les composants
 */
export interface ComponentDefaultOptions {
    ScrollSpy: ReturnType<typeof getScrollSpyDefaults>;
    ScrollToTop: ReturnType<typeof getScrollToTopDefaults>;
    Snackbar: {
        displayLength: number;
        type: string;
    };
    Toast: ReturnType<typeof getToastDefaults>;
    Chip: {
        removable: boolean;
        size: string;
    };
    Collapse: ReturnType<typeof getCollapseDefaults>;
    Card: {
        size: string;
        variant: string;
    };
    Shape: {
        shape: string;
        size: string;
        variant: string;
    };
    Select: {
        menuOptions: {
            coverTrigger: boolean;
        };
    };
    Drawer: {
        draggable: boolean;
        edge: string;
    };
    Divider: ReturnType<typeof getDividerDefaults>;
    Stack: ReturnType<typeof getStackDefaults>;
    Sheet: {
        position: string;
        size: string;
        type: string;
    };
    Alert: ReturnType<typeof getAlertDefaults>;
    Autocomplete: ReturnType<typeof getAutocompleteDefaults>;
    Avatar: {
        imageUrl: string;
        name: string;
        shape: string;
        size: string;
        variant: string;
    };
    Badge: {
        autoDisableForReducedMotion: boolean;
        backgroundColor: string;
        content: string | number | null;
        position: string;
        textColor: string;
        variant: string;
    };
    Breadcrumb: ReturnType<typeof getBreadcrumbDefaults>;
    Bubble: ReturnType<typeof getBubbleDefaults>;
    Dialog: {
        dismissible: boolean;
    };
    Field: {
        type: string;
        variant: string;
    };
    Fieldset: ReturnType<typeof getFieldsetDefaults>;
    Firework: ReturnType<typeof getFireworkDefaults>;
    Flip: ReturnType<typeof getFlipDefaults>;
    Hero: {
        subtitleClass: string;
        titleClass: string;
    };
    Textarea: {
        rows: number;
        variant: string;
    };
    Ticker: ReturnType<typeof getTickerDefaults>;
    Pin: {
        length: number;
        type: string;
        variant: string;
    };
    Menu: {
        closeOnClick: boolean;
        items: MenuItem[];
        placement: string;
    };
    MenuContext: ReturnType<typeof getMenuContextDefaults>;
    Switch: {
        checked: boolean;
        disabled: boolean;
        size: string;
    };
    Checkbox: {
        checked: boolean;
        disabled: boolean;
        error: boolean;
        indeterminate: boolean;
    };
    Radio: {
        checked: boolean;
        disabled: boolean;
        error: boolean;
    };
    Tile: ReturnType<typeof getTileDefaults>;
    Tilt: ReturnType<typeof getTiltDefaults>;
    Todo: {
        allowEditOnDoubleClick: boolean;
        filter: string;
        items: TodoItem[];
        persistToStorage: boolean;
        placeholder: string;
        showClearCompleted: boolean;
        showCounter: boolean;
        storageKey: string;
    };
    Datepicker: {
        dateFormat: string;
        locale: string;
        selectedDate: Date | null;
        variant: string;
    };
    Timepicker: {
        format: string;
        locale: string;
        selectedTime: { hours: number; minutes: number; } | null;
        timeFormat: string;
        variant: string;
    };
    Chart: {
        animation: boolean;
        showGrid: boolean;
        showLabels: boolean;
        showLegend: boolean;
        showTooltip: boolean;
        theme: string;
        type: string;
    };
    ColorPicker: ReturnType<typeof getColorPickerDefaults>;
    Slider: {
        max: number;
        min: number;
        size: string;
        step: number;
        value: number;
    };
    ShuffleNumber: ReturnType<typeof getShuffleNumberDefaults>;
    /** @deprecated Utiliser ShuffleNumber */
    Slot: ReturnType<typeof getShuffleNumberDefaults>;
    Confetti: {
        angle: number;
        colors: string[];
        decay: number;
        disableForReducedMotion: boolean;
        drift: number;
        flat: boolean;
        gravity: number;
        origin: { x: number; y: number };
        particleCount: number;
        resize: boolean;
        scalar: number;
        shapes: string[];
        spread: number;
        startVelocity: number;
        ticks: number;
        zIndex: number;
    };
    PanelContent: ReturnType<typeof getPanelContentDefaults>;
    PanelSplit: ReturnType<typeof getPanelSplitDefaults>;
    Snow: {
        autoStart: boolean;
        disableForReducedMotion: boolean;
        mode: 'manual' | 'auto';
        particleCount: number;
        resize: boolean;
        speed: number;
        wind: number;
        windVariance: number;
        zIndex: number;
    };
    SlideshowCaptions: ReturnType<typeof getSlideshowCaptionsDefaults>;
    Table: {
        multiSelect: boolean;
        selectable: boolean;
        sortable: boolean;
    };
    Tabs: ReturnType<typeof getTabsDefaults>;
    NavigationBar: ReturnType<typeof getNavigationBarDefaults>;
    NavigationRail: ReturnType<typeof getNavigationRailDefaults>;
    NavigationMenu: ReturnType<typeof getNavigationMenuDefaults>;
    Signature: {
        ariaLabel: string;
        backgroundColor: string;
        canvasContextOptions: CanvasRenderingContext2DSettings;
        compositeOperation: GlobalCompositeOperation;
        dotSize: number;
        maxWidth: number;
        minDistance: number;
        minWidth: number;
        penColor: string;
        throttle: number;
        velocityFilterWeight: number;
    };
    Pace: ReturnType<typeof getPaceDefaults>;
    Perspective: {
        effect: string;
        focus: number;
        shadows: { enabled: boolean };
        navigation: { enabled: boolean };
        autoplay: { enabled: boolean; speed: number };
        loop: { enabled: boolean };
    };
    Loader: ReturnType<typeof getLoaderDefaults>;
    Heatmap: ReturnType<typeof getHeatmapDefaults>;
    Button: {
        mode: string;
        ripple: boolean;
        size: string;
        type: string;
    };
    ButtonGroups: ReturnType<typeof getButtonGroupsDefaults>;
    ButtonSegmented: ReturnType<typeof getButtonSegmentedDefaults>;
    ButtonSmart: ReturnType<typeof getButtonSmartDefaults>;
    ButtonFabMenu: ReturnType<typeof getButtonFabMenuDefaults>;
    ButtonFabDial: ReturnType<typeof getButtonFabDialDefaults>;
    ButtonFabRail: ReturnType<typeof getButtonFabRailDefaults>;
    ButtonFab: ReturnType<typeof getButtonFabDefaults>;
    Toolbar: ReturnType<typeof getToolbarDefaults>;
    Counter: {
        value: number;
        allowNegative: boolean;
        step: number;
        decimals: number;
        readonly: boolean;
        disabled: boolean;
        asyncChange: boolean;
        size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    };
    Countdown: ReturnType<typeof getCountdownDefaults>;
    CodeBlock: {
        showToolbar: boolean;
        showCopy: boolean;
        label: string;
    };
    Skeleton: ReturnType<typeof getSkeletonDefaults>;
    Upload: ReturnType<typeof getUploadDefaults>;
    WheelPicker: ReturnType<typeof getWheelPickerDefaults>;
    Tooltips: {
        content: string;
        type: string;
        placement: string;
        trigger: string;
        offset: number;
        closeOnClickReference: boolean;
        closeOnKeyEscape: boolean;
        disabled: boolean;
    };
    List: ReturnType<typeof getListDefaults>;
    ListMaker: ReturnType<typeof getListMakerDefaults>;
    Comparison: ReturnType<typeof getComparisonDefaults>;
    Gauge: ReturnType<typeof getGaugeDefaults>;
    ProgressIndicator: ReturnType<typeof getProgressIndicatorDefaults>;
    Pricing: ReturnType<typeof getPricingDefaults>;
    QrCode: ReturnType<typeof getQrCodeDefaults>;
    SwipeDeck: ReturnType<typeof getSwipeDeckDefaults>;
    Quote: ReturnType<typeof getQuoteDefaults>;
    BarCode: ReturnType<typeof getBarCodeDefaults>;
    Gradient: ReturnType<typeof getGradientDefaults>;
    Halo: ReturnType<typeof getHaloDefaults>;
    Holo: ReturnType<typeof getHoloDefaults>;
    Command: ReturnType<typeof getCommandDefaults>;
    MessageBox: ReturnType<typeof getMessageBoxDefaults>;
    Pagination: ReturnType<typeof getPaginationDefaults>;
    PaginationAlpha: ReturnType<typeof getPaginationAlphaDefaults>;
    PaginationNav: ReturnType<typeof getPaginationNavDefaults>;
    Page: ReturnType<typeof getPageDefaults>;
    Parallax: ReturnType<typeof getParallaxDefaults>;
    InfiniteScroll: ReturnType<typeof getInfiniteScrollDefaults>;
    Marquee: ReturnType<typeof getMarqueeDefaults>;
    AppBar: ReturnType<typeof getAppBarDefaults>;
    IsoFilter: ReturnType<typeof getIsoFilterDefaults>;
    MediaStories: ReturnType<typeof getMediaStoriesDefaults>;
}

// ============================================================================
// CONFIGURATIONS PAR DÉFAUT
// ============================================================================

/**
 * Configuration par défaut pour IconManager
 * @description Paramètres d'initialisation du gestionnaire d'icônes
 */
export const DEFAULT_ICON_CONFIG: IconManagerConfig = {
    basePath: '/assets/icons/',
    debounceDelay: 10,
    enableCache: true,
    mutationObserverRoot: null,
    coalesceMutationsWithRaf: true,
    batchRevealWithRaf: true,
    initialBatchTimeoutMs: 800,
    atomicPageReveal: false
};

/**
 * Configuration par défaut pour DynamicColorManager
 */
export type DynamicColorManagerConfig = Required<
    Pick<
        DynamicColorOptions,
        'sourceColor' | 'contrastLevel' | 'isDark' | 'variant' | 'specVersion' | 'platform' | 'savePreference' | 'storageKey'
    >
>;

export const DEFAULT_DYNAMIC_COLOR_CONFIG: DynamicColorManagerConfig = {
    sourceColor: '#6750A4',
    contrastLevel: 0,
    isDark: false,
    variant: Variant.TONAL_SPOT,
    specVersion: '2025',
    platform: 'phone',
    savePreference: true,
    storageKey: 'k3ui-dynamic-color',
};

/**
 * Configuration par défaut pour SoundFXManager
 * @description Paramètres d'initialisation du gestionnaire d'effets sonores
 */
export const DEFAULT_SOUND_CONFIG: SoundFXManagerConfig = {
    soundsPath: '/k3ui-docs/assets/sounds/',
    enabled: true,
    volume: 0.5,
    hoverEnabled: true,
    clickEnabled: true,
    leaveEnabled: true
};

/**
 * Options par défaut pour les composants
 * @description Valeurs par défaut utilisées lors de l'initialisation automatique des composants
 */
export const DEFAULT_COMPONENT_OPTIONS: ComponentDefaultOptions = {
    Alert: {
        ...getAlertDefaults(),
    },
    Autocomplete: {
        ...getAutocompleteDefaults(),
    },
    Avatar: {
        ...getAvatarDefaults()
    },
    Badge: {
        ...getBadgeDefaults()
    },
    Breadcrumb: {
        ...getBreadcrumbDefaults()
    },
    Bubble: {
        ...getBubbleDefaults(),
    },
    Button: {
        ...getButtonDefaults(),
    },
    ButtonGroups: {
        ...getButtonGroupsDefaults(),
    },
    ButtonSegmented: {
        ...getButtonSegmentedDefaults(),
    },
    ButtonSmart: {
        ...getButtonSmartDefaults(),
    },
    ButtonFabMenu: {
        ...getButtonFabMenuDefaults(),
    },
    ButtonFabDial: {
        ...getButtonFabDialDefaults(),
    },
    ButtonFabRail: {
        ...getButtonFabRailDefaults(),
    },
    ButtonFab: {
        ...getButtonFabDefaults(),
    },
    Toolbar: {
        ...getToolbarDefaults(),
    },
    Counter: {
        ...getCounterDefaults(),
    },
    Countdown: {
        ...getCountdownDefaults(),
    },
    CodeBlock: {
        ...getCodeBlockDefaults(),
    },
    Skeleton: {
        ...getSkeletonDefaults(),
    },
    Upload: {
        ...getUploadDefaults(),
    },
    WheelPicker: {
        ...getWheelPickerDefaults(),
    },
    Card: {
        variant: getCardDefaults().variant || 'elevated',
        size: getCardDefaults().size || 'medium'
    },
    Chart: {
        type: getChartDefaults().type || 'pie-pad-angle',
        theme: getChartDefaults().theme || 'auto',
        showGrid: getChartDefaults().showGrid ?? true,
        showLegend: getChartDefaults().showLegend ?? true,
        showLabels: getChartDefaults().showLabels ?? true,
        showTooltip: getChartDefaults().showTooltip ?? true,
        animation: getChartDefaults().animation ?? true
    },
    Checkbox: {
        checked: getCheckboxDefaults().checked !== undefined ? getCheckboxDefaults().checked : false,
        disabled: getCheckboxDefaults().disabled !== undefined ? getCheckboxDefaults().disabled : false,
        indeterminate: getCheckboxDefaults().indeterminate !== undefined ? getCheckboxDefaults().indeterminate : false,
        error: getCheckboxDefaults().error !== undefined ? getCheckboxDefaults().error : false
    },
    Chip: {
        size: getChipDefaults().size || 'medium',
        removable: getChipDefaults().removable || false
    },
    Collapse: {
        ...getCollapseDefaults(),
    },
    Confetti: {
        ...getConfettiDefaults(),
    },
    PanelContent: {
        ...getPanelContentDefaults(),
    },
    PanelSplit: {
        ...getPanelSplitDefaults(),
    },
    Datepicker: {
        selectedDate: getDatepickerDefaults().selectedDate ?? null,
        locale: getDatepickerDefaults().locale || 'fr-FR',
        dateFormat: getDatepickerDefaults().dateFormat || 'DD/MM/YYYY',
        variant: getDatepickerDefaults().variant || 'filled'
    },
    Dialog: {
        dismissible: getDialogDefaults().dismissible !== undefined ? getDialogDefaults().dismissible : true
    },
    Drawer: {
        edge: getDrawerDefaults().edge || 'left',
        draggable: getDrawerDefaults().draggable !== undefined ? getDrawerDefaults().draggable : true
    },
    Divider: {
        ...getDividerDefaults(),
    },
    Stack: {
        ...getStackDefaults(),
    },
    Field: {
        variant: getFieldDefaults().variant || 'filled',
        type: getFieldDefaults().type || 'text'
    },
    Fieldset: {
        ...getFieldsetDefaults(),
    },
    Firework: {
        ...getFireworkDefaults(),
    },
    Flip: {
        ...getFlipDefaults(),
    },
    Hero: {
        titleClass: getHeroDefaults().titleClass ?? '',
        subtitleClass: getHeroDefaults().subtitleClass ?? ''
    },
    Loader: {
        ...getLoaderDefaults(),
        size: 128,
    },
    Heatmap: {
        ...getHeatmapDefaults(),
    },
    Menu: {
        closeOnClick: getMenuDefaults().closeOnClick ?? true,
        items: getMenuDefaults().items || [],
        placement: getMenuDefaults().placement || 'auto'
    },
    MenuContext: {
        ...getMenuContextDefaults(),
    },
    Pace: {
        ...getPaceDefaults(),
    },
    Perspective: {
        ...getPerspectiveDefaults(),
    },
    Pin: {
        variant: getPinDefaults().variant || 'filled',
        length: getPinDefaults().length || 6,
        type: getPinDefaults().type || 'password'
    },
    Pricing: {
        ...getPricingDefaults(),
    },
    Radio: {
        checked: getRadioDefaults().checked !== undefined ? getRadioDefaults().checked : false,
        disabled: getRadioDefaults().disabled !== undefined ? getRadioDefaults().disabled : false,
        error: getRadioDefaults().error !== undefined ? getRadioDefaults().error : false
    },
    Tile: {
        ...getTileDefaults(),
    },
    Tilt: {
        ...getTiltDefaults(),
    },
    ScrollSpy: {
        ...getScrollSpyDefaults()
    },
    ScrollToTop: {
        ...getScrollToTopDefaults(),
    },
    Select: {
        menuOptions: {
            coverTrigger: getSelectDefaults().menuOptions?.coverTrigger || false
        }
    },
    Shape: {
        shape: getShapeDefaults().shape || 'heart',
        variant: getShapeDefaults().variant || 'mask',
        size: getShapeDefaults().size || 'md'
    },
    Sheet: {
        ...getSheetDefaults()
    },
    Signature: {
        ...getSignatureDefaults(),
    },
    ColorPicker: {
        ...getColorPickerDefaults(),
    },
    Slider: {
        value: getSliderDefaults().value || 50,
        min: getSliderDefaults().min || 0,
        max: getSliderDefaults().max || 100,
        step: getSliderDefaults().step || 1,
        size: getSliderDefaults().size || 'm'
    },
    ShuffleNumber: {
        ...getShuffleNumberDefaults(),
    },
    /** @deprecated Utiliser ShuffleNumber */
    Slot: {
        ...getShuffleNumberDefaults(),
    },
    Snow: {
        ...getSnowDefaults(),
    },
    SlideshowCaptions: {
        ...getSlideshowCaptionsDefaults(),
    },
    Snackbar: {
        displayLength: getSnackbarDefaults().duration || 4000,
        type: getSnackbarDefaults().type || 'default'
    },
    Toast: {
        ...getToastDefaults(),
    },
    Switch: {
        checked: getSwitchDefaults().checked !== undefined ? getSwitchDefaults().checked : false,
        disabled: getSwitchDefaults().disabled !== undefined ? getSwitchDefaults().disabled : false,
        size: getSwitchDefaults().size || 'medium'
    },
    Table: {
        ...getTableDefaults(),
    },
    Tabs: {
        ...getTabsDefaults(),
    },
    NavigationBar: {
        ...getNavigationBarDefaults(),
    },
    NavigationRail: {
        ...getNavigationRailDefaults(),
    },
    NavigationMenu: {
        ...getNavigationMenuDefaults(),
    },
    Textarea: {
        variant: getTextareaDefaults().variant || 'filled',
        rows: getTextareaDefaults().rows || 3
    },
    Ticker: {
        ...getTickerDefaults(),
    },
    Timepicker: {
        selectedTime: getTimepickerDefaults().selectedTime ?? null,
        locale: getTimepickerDefaults().locale || 'fr-FR',
        timeFormat: getTimepickerDefaults().timeFormat || 'HH:mm',
        format: getTimepickerDefaults().format || '24h',
        variant: getTimepickerDefaults().variant || 'filled'
    },
    Tooltips: {
        ...getTooltipsDefaults(),
    },
    List: {
        ...getListDefaults(),
    },
    ListMaker: {
        ...getListMakerDefaults(),
    },
    Comparison: {
        ...getComparisonDefaults(),
    },
    Gauge: {
        ...getGaugeDefaults(),
    },
    ProgressIndicator: {
        ...getProgressIndicatorDefaults(),
    },
    QrCode: {
        ...getQrCodeDefaults(),
    },
    SwipeDeck: {
        ...getSwipeDeckDefaults(),
    },
    Quote: {
        ...getQuoteDefaults(),
    },
    BarCode: {
        ...getBarCodeDefaults(),
    },
    Gradient: {
        ...getGradientDefaults(),
    },
    Halo: {
        ...getHaloDefaults(),
    },
    Holo: {
        ...getHoloDefaults(),
    },
    Pagination: {
        ...getPaginationDefaults(),
    },
    Command: {
        ...getCommandDefaults(),
    },
    MessageBox: {
        ...getMessageBoxDefaults(),
    },
    PaginationAlpha: {
        ...getPaginationAlphaDefaults(),
    },
    PaginationNav: {
        ...getPaginationNavDefaults(),
    },
    Page: {
        ...getPageDefaults(),
    },
    Parallax: {
        ...getParallaxDefaults(),
    },
    InfiniteScroll: {
        ...getInfiniteScrollDefaults(),
    },
    Marquee: {
        ...getMarqueeDefaults(),
    },
    AppBar: {
        ...getAppBarDefaults(),
    },
    IsoFilter: {
        ...getIsoFilterDefaults(),
    },
    MediaStories: {
        ...getMediaStoriesDefaults(),
    },
    Todo: {
        items: getTodoDefaults().items || [],
        filter: getTodoDefaults().filter || 'all',
        persistToStorage: getTodoDefaults().persistToStorage !== undefined ? getTodoDefaults().persistToStorage : false,
        storageKey: getTodoDefaults().storageKey || 'k3ui-todo',
        placeholder: getTodoDefaults().placeholder || 'Ajouter une tâche...',
        allowEditOnDoubleClick: getTodoDefaults().allowEditOnDoubleClick !== undefined ? getTodoDefaults().allowEditOnDoubleClick : true,
        showCounter: getTodoDefaults().showCounter !== undefined ? getTodoDefaults().showCounter : true,
        showClearCompleted: getTodoDefaults().showClearCompleted !== undefined ? getTodoDefaults().showClearCompleted : true
    },
};

