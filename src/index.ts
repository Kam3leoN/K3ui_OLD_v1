/**
 * @fileoverview Point d'entrée principal de K3UI
 * @description Bibliothèque de composants Material Design 3 avec pattern AutoInit
 * @author K3UI Team
 * @version 0.1.0
 */

// ============================================================================
// IMPORTS
// ============================================================================

import {
    DEFAULT_COMPONENT_OPTIONS,
    DEFAULT_SELECTORS
} from './config';

import {
    AutoInit,
    initComponents,
    initManagers,
    installK3UIRuntime,
    K3UI_HIDE_BODY_UNTIL_READY_CRITICAL_SCRIPT,
    K3UI_DYNAMIC_COLOR_CRITICAL_SCRIPT,
    registerRegistryAssigner
} from './core/autoinit';
import {
    attachDeferredComponentsToK,
    DEFERRED_COMPONENT_NAMES,
    getDeferredComponentsLoadPromise,
    loadExtensionComponentClasses,
} from './core/autoinit/deferred-component-loaders';

import {
    cleanupManagers,
    configureManagers,
    CookieManager,
    DynamicColorManager,
    getEssentialManagers,
    getManagerStats,
    getTestManagers,
    IconManager,
    LazyManager,
    LoggerManager,
    LocaleManager,
    ManagerFactory,
    Gesture,
    HapticManager,
    MotionManager,
    PrivacyManager,
    ScrollbarManager,
    SoundFXManager,
    ThemeManager
} from './core/managers';

import { PriorityLevel } from './types/base';
import { Component } from './core/base/Component';
import type { SnackbarOptions, ToastOptions } from './types/components/components';

import { ripple, storage } from './utils';
import { toggleReducedMotion as toggleReducedMotionUtil } from './utils/accessibility';
import { Hct } from './utils/color';
import { themeFromImage } from './utils/color/image-theme';
import { Drag } from './utils/dom/drag';
import { DropZone } from './utils/dom/dropzone';
import { ImageEditor } from './utils/image/editor';
import { ThumbnailGenerator } from './utils/upload/thumbnail';
import { Uploader } from './utils/upload/uploader';
import { FileSecurity } from './utils/upload/security';

import { AppBar } from './components/AppBar';
import { Alert } from './components/Alert';
import { Autocomplete } from './components/Autocomplete';
import { Avatar } from './components/Avatar';
import { Badge } from './components/Badge';
import { Breadcrumb } from './components/Breadcrumb';
import { Bubble } from './components/Bubble';
import { Button } from './components/Button';
import { ButtonFab } from './components/ButtonFab';
import { ButtonFabMenu } from './components/ButtonFabMenu';
import { ButtonFabDial } from './components/ButtonFabDial';
import { ButtonFabRail } from './components/ButtonFabRail';
import { ButtonGroups } from './components/ButtonGroups';
import { ButtonIcon } from './components/ButtonIcon';
import { ButtonShape } from './components/ButtonShape';
import { ButtonArrow } from './components/ButtonArrow';
import { ButtonPad } from './components/ButtonPad';
import { ButtonGrid } from './components/ButtonGrid';
import { ButtonSmart } from './components/ButtonSmart';
import { ButtonSegmented } from './components/ButtonSegmented';
import { ButtonSplit } from './components/ButtonSplit';
import { Card } from './components/Card';
import { Checkbox } from './components/Checkbox';
import { Chip } from './components/Chip';
import { Collapse } from './components/Collapse';
import { Counter } from './components/Counter';
import { Countdown } from './components/Countdown';
import { Dialog } from './components/Dialog';
import { Drawer } from './components/Drawer';
import { Divider } from './components/Divider';
import { Stack } from './components/Stack';
import { Field } from './components/Field';
import { Fieldset } from './components/Fieldset';
import { Gauge } from './components/Gauge';
import { Hero } from './components/Hero';
import { IsoFilter } from './components/IsoFilter';
import { MediaStories } from './components/MediaStories';
import { List } from './components/List';
import { ListMaker } from './components/ListMaker';
import { Loader } from './components/Loader';
import { Mason } from './components/Mason';
import { Menu } from './components/Menu';
import { MenuContext } from './components/MenuContext';
import { MessageBox } from './components/MessageBox';
import { NavigationBar } from './components/NavigationBar';
import { NavigationRail } from './components/NavigationRail';
import { NavigationMenu } from './components/NavigationMenu';
import { Pagination } from './components/Pagination';
import { PaginationAlpha } from './components/PaginationAlpha';
import { PaginationNav } from './components/PaginationNav';
import { Pin } from './components/Pin';
import { Pricing } from './components/Pricing';
import { ProgressIndicator } from './components/ProgressIndicator';
import { Quote } from './components/Quote';
import { Radio } from './components/Radio';
import { Tile } from './components/Tile';
import { ScrollSpy } from './components/ScrollSpy';
import { ScrollToTop } from './components/ScrollToTop';
import { PanelContent } from './components/PanelContent';
import { PanelSplit } from './components/PanelSplit';
import { Select } from './components/Select';
import { Shape } from './components/Shape';
import { Sheet } from './components/Sheet';
import { Skeleton } from './components/Skeleton';
import { ShuffleNumber, Slot } from './components/ShuffleNumber';
import { Slider } from './components/Slider';
import { Snackbar } from './components/Snackbar';
import { Toast, createToastApi } from './components/Toast';
import { Switch } from './components/Switch';
import { Tabs } from './components/Tabs';
import { Textarea } from './components/Textarea';
import { Ticker } from './components/Ticker';
import { Todo } from './components/Todo';
import { Toolbar } from './components/Toolbar';
import { Tooltips } from './components/Tooltips';
import { WheelPicker } from './components/WheelPicker';

// ============================================================================
// EXPORTS — AutoInit (implémentation dans core/autoinit)
// ============================================================================

export {
    AutoInit,
    initComponents,
    initManagers,
    K3UI_HIDE_BODY_UNTIL_READY_CRITICAL_SCRIPT,
    K3UI_DYNAMIC_COLOR_CRITICAL_SCRIPT,
};

export type { AutoInitOptions } from './core/autoinit/types';

// ============================================================================
// EXPORTS
// ============================================================================

export {
    cleanupManagers,
    Component,
    configureManagers,
    CookieManager,
    DynamicColorManager,
    getEssentialManagers,
    getManagerStats,
    getTestManagers,
    IconManager,
    LazyManager,
    LoggerManager,
    LocaleManager,
    ManagerFactory,
    ScrollbarManager,
    SoundFXManager,
    ThemeManager
};

export { PriorityLevel };

export * from './components/AppBar';
export * from './components/Alert';
export * from './components/Autocomplete';
export * from './components/Avatar';
export * from './components/Badge';
export * from './components/Breadcrumb';
export * from './components/Bubble';
export * from './components/Button';
export * from './components/ButtonFab';
export * from './components/ButtonFabMenu';
export * from './components/ButtonFabDial';
export * from './components/ButtonFabRail';
export * from './components/ButtonGroups';
export * from './components/ButtonIcon';
export * from './components/ButtonShape';
export * from './components/ButtonArrow';
export * from './components/ButtonPad';
export * from './components/ButtonGrid';
export * from './components/ButtonSmart';
export * from './components/ButtonSegmented';
export * from './components/ButtonSplit';
export * from './components/Card';
export * from './components/Checkbox';
export * from './components/Chip';
export * from './components/Collapse';
export * from './components/Counter';
export * from './components/Countdown';
export * from './components/Dialog';
export * from './components/Divider';
export * from './components/Stack';
export * from './components/Drawer';
export * from './components/Field';
export * from './components/Fieldset';
export * from './components/Flip';
export * from './components/Gauge';
export * from './extensions/effects/halo/Halo';
export * from './extensions/effects/holo/Holo';
export * from './components/Hero';
export * from './components/IsoFilter';
export * from './components/MediaStories';
export * from './components/List';
export * from './components/ListMaker';
export * from './components/Loader';
export * from './components/Mason';
export * from './components/Menu';
export * from './components/MenuContext';
export * from './components/MessageBox';
export * from './components/NavigationBar';
export * from './components/NavigationRail';
export * from './components/NavigationMenu';
export * from './components/Pagination';
export * from './components/PaginationAlpha';
export * from './components/PaginationNav';
export * from './components/Pin';
export * from './components/Pricing';
export * from './components/ProgressIndicator';
export * from './components/Quote';
export * from './components/Radio';
export * from './components/Tile';
export * from './components/Tilt';
export * from './components/ScrollSpy';
export * from './components/ScrollToTop';
export * from './components/PanelContent';
export * from './components/PanelSplit';
export * from './components/Select';
export * from './components/Shape';
export * from './components/Sheet';
export * from './components/Skeleton';
export * from './components/ShuffleNumber';
export * from './components/Slider';
export * from './components/Snackbar';
export * from './components/Toast';
export * from './components/Switch';
export * from './components/Tabs';
export * from './components/Textarea';
export * from './components/Ticker';
export * from './components/Todo';
export * from './components/Toolbar';
export * from './components/WheelPicker';
export * from './components/Tooltips';

export * from './utils';
export { themeFromImage } from './utils/color/image-theme';

// ============================================================================
// OBJET GLOBAL K
// ============================================================================

/**
 * Objet global K avec les composants « critiques », managers et utilitaires.
 * Les composants différés (Chart, Table, Datepicker, etc.) sont ajoutés sur `K` après chargement des chunks (AutoInit ou `loadDeferredComponents`).
 */
const K = {
    AppBar,
    AutoInit,
    Alert,
    Autocomplete,
    Avatar,
    Badge,
    Breadcrumb,
    Bubble,
    Button,
    ButtonFab,
    ButtonFabMenu,
    ButtonFabDial,
    ButtonFabRail,
    ButtonGroups,
    ButtonIcon,
    ButtonShape,
    ButtonArrow,
    ButtonPad,
    ButtonGrid,
    ButtonSmart,
    ButtonSegmented,
    ButtonSplit,
    Card,
    Checkbox,
    Chip,
    Collapse,
    Component,
    CookieManager,
    Counter,
    Countdown,
    DEFAULT_COMPONENT_OPTIONS,
    DEFAULT_SELECTORS,
    Dialog,
    Drag,
    Drawer,
    Divider,
    Stack,
    DropZone,
    DynamicColorManager,
    Field,
    Fieldset,
    Gauge,
    Gesture,
    Hct,
    Hero,
    IconManager,
    LazyManager,
    ImageEditor,
    initComponents,
    initManagers,
    IsoFilter,
    MediaStories,
    List,
    ListMaker,
    Loader,
    LocaleManager,
    LoggerManager,
    Mason,
    Menu,
    MenuContext,
    MessageBox,
    ScrollbarManager,
    Haptic: {
        /** Déclenche un motif nommé (selection, light, medium, success, error). */
        vibrate: (pattern: import('./types/managers/haptic').HapticPattern) => HapticManager.vibrate(pattern),
        /** Séquence libre (ms ou [on, off, on, …]). */
        vibrateRaw: (sequence: import('./types/managers/haptic').HapticVibrationSequence) =>
            HapticManager.vibrateRaw(sequence),
        setEnabled: (enabled: boolean) => HapticManager.setEnabled(enabled),
        isEnabled: () => HapticManager.isEnabled(),
        getPatterns: () => HapticManager.getPatterns(),
        getPattern: (pattern: import('./types/managers/haptic').HapticPattern) =>
            HapticManager.getPattern(pattern),
        setPattern: (
            pattern: import('./types/managers/haptic').HapticPattern,
            sequence: import('./types/managers/haptic').HapticVibrationSequence
        ) => HapticManager.setPattern(pattern, sequence),
        setPatterns: (overrides: Partial<Record<import('./types/managers/haptic').HapticPattern, import('./types/managers/haptic').HapticVibrationSequence>>) =>
            HapticManager.setPatterns(overrides),
        resetPatterns: () => HapticManager.resetPatterns(),
    },
    Motion: {
        /** Retourne true si le mouvement est réduit (override ou prefers-reduced-motion). */
        isReducedMotion: (): boolean => MotionManager.isReducedMotion(),
        /**
         * Override global :
         * - `true` : forcer mouvement réduit
         * - `false` : forcer mouvement normal
         * - `null` : suivre `prefers-reduced-motion`
         */
        setOverride: (override: boolean | null): void => MotionManager.setOverride(override),
        /** Bascule l'override global et retourne l'état effectif. */
        toggle: (): boolean => MotionManager.toggle()
    },
    NavigationBar,
    NavigationRail,
    NavigationMenu,
    Pagination,
    PaginationAlpha,
    PaginationNav,
    Pin,
    Pricing,
    PriorityLevel,
    PrivacyManager,
    ProgressIndicator,
    Quote,
    Radio,
    Tile,
    registry: {} as Record<string, HTMLElement[]>,
    ripple,
    ScrollSpy,
    ScrollToTop,
    PanelContent,
    PanelSplit,
    Select,
    Shape,
    Sheet,
    Skeleton,
    ShuffleNumber,
    Slot,
    Slider,
    Snackbar,
    Toast,
    SoundFXManager,
    HapticManager,
    storage,
    Switch,
    Tabs,
    Textarea,
    Ticker,
    themeFromImage,
    ThemeManager,
    ThumbnailGenerator,
    Todo,
    Toolbar,
    Tooltips,
    Uploader,
    WheelPicker,
    FileSecurity,
    snackbar: (options: Partial<SnackbarOptions> & { text: string }) => Snackbar.show(options),
    toast: createToastApi(),
    /** Bascule l'override global "mouvement réduit" et retourne le nouvel état (true = activé). */
    toggleReducedMotion: (): boolean => toggleReducedMotionUtil(),
    toggleSound: () => K.SoundFXManager.toggleSound(),
    /**
     * Précharge les chunks des composants différés et les attache à `K` (Chart, Table, Datepicker, etc.).
     * Idempotent avec l’AutoInit différé : une seule charge réseau grâce à la promesse partagée.
     * Remplit aussi `K.Extensions` pour les modules classés extensions.
     */
    loadDeferredComponents: async (): Promise<void> => {
        const classes = await getDeferredComponentsLoadPromise(DEFERRED_COMPONENT_NAMES);
        attachDeferredComponentsToK(classes);
    },
    /**
     * Précharge uniquement les Extensions (QrCode, Firework, SwipeDeck, …) et les attache à `K` / `K.Extensions`.
     * Alias ciblé de `loadDeferredComponents` — API flat `K.QrCode` inchangée.
     */
    loadExtensions: async (): Promise<void> => {
        const classes = await loadExtensionComponentClasses();
        attachDeferredComponentsToK(classes);
    },
    /** Namespace de découverte des extensions (après chargement). */
    Extensions: {} as Record<string, unknown>,
};

registerRegistryAssigner((r) => {
    K.registry = r;
});

export { K };
/** Export par défaut pour usage ESM (import K from 'k3ui') ; window.K est aussi défini pour les scripts classiques */
export default K;

installK3UIRuntime(K);
