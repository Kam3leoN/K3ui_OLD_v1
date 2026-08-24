/**
 * @fileoverview Types pour les événements K3UI
 * @description Typage strict des événements et système d'événements
 * @author K3UI Team
 * @version 1.0.0
 */

// HTMLElement est un type global de TypeScript

// ============================================================================
// TYPES DE BASE POUR LES ÉVÉNEMENTS
// ============================================================================

/**
 * Type de base pour tous les événements K3UI
 */
export interface K3UIEvent<T = unknown> extends CustomEvent {
    /** Détails de l'événement */
    detail: T;
    /** Nom du composant qui a déclenché l'événement */
    component: string;
    /** Instance du composant */
    instance?: unknown;
    /** Timestamp de l'événement */
    timestamp: number;
    /** Source de l'événement */
    source: 'user' | 'system' | 'api' | 'auto';
}

/**
 * Type pour les événements de composant
 */
export interface ComponentEvent<T = unknown> extends K3UIEvent<T> {
    /** Élément DOM concerné */
    element: HTMLElement;
    /** Type d'action */
    action: string;
}

/**
 * Type pour les événements de validation
 */
export interface ValidationEvent extends K3UIEvent<{
    isValid: boolean;
    errors: string[];
    field: string;
    value: unknown;
}> {
    component: 'Forms' | 'Input' | 'Select' | 'Textarea';
    action: string;
}

/**
 * Type pour les événements de thème
 */
export interface ThemeEvent extends K3UIEvent<{
    theme: string;
    mode: 'light' | 'dark' | 'auto' | 'system';
    previousTheme?: string;
}> {
    component: 'ThemeManager';
    action: 'change' | 'toggle' | 'reset';
}

/**
 * Type pour les événements d'animation
 */
export interface AnimationEvent extends K3UIEvent<{
    animation: string;
    duration: number;
    direction: 'in' | 'out';
}> {
    component: string;
    action: 'start' | 'end' | 'cancel';
}

/**
 * Type pour les événements de scroll
 */
export interface ScrollEvent extends K3UIEvent<{
    scrollTop: number;
    scrollLeft: number;
    direction: 'up' | 'down' | 'left' | 'right';
    velocity: number;
}> {
    component: 'ScrollManager';
    action: string;
}

/**
 * Type pour les événements de drag & drop
 */
export interface DragEvent extends K3UIEvent<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    deltaX: number;
    deltaY: number;
    velocity: number;
}> {
    component: string;
    action: 'start' | 'move' | 'end' | 'cancel';
}

/**
 * Type pour les événements de resize
 */
export interface ResizeEvent extends K3UIEvent<{
    width: number;
    height: number;
    previousWidth: number;
    previousHeight: number;
}> {
    component: 'Window' | 'Component';
    action: 'start' | 'end' | 'change';
}

/**
 * Type pour les événements de focus
 */
export interface FocusEvent extends K3UIEvent<{
    element: HTMLElement;
    previousElement?: HTMLElement;
    direction: 'forward' | 'backward' | 'up' | 'down' | 'left' | 'right';
}> {
    component: string;
    action: 'focus' | 'blur' | 'focusin' | 'focusout';
}

/**
 * Type pour les événements de clavier
 */
export interface KeyboardEvent extends K3UIEvent<{
    key: string;
    code: string;
    keyCode: number;
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
    metaKey: boolean;
    repeat: boolean;
}> {
    component: string;
    action: 'keydown' | 'keyup' | 'keypress';
}

/**
 * Type pour les événements de souris
 */
export interface MouseEvent extends K3UIEvent<{
    x: number;
    y: number;
    clientX: number;
    clientY: number;
    pageX: number;
    pageY: number;
    button: number;
    buttons: number;
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
    metaKey: boolean;
}> {
    component: string;
    action: 'click' | 'dblclick' | 'mousedown' | 'mouseup' | 'mousemove' | 'mouseover' | 'mouseout' | 'mouseenter' | 'mouseleave';
}

/**
 * Type pour les événements de touch
 */
export interface TouchEvent extends K3UIEvent<{
    touches: Touch[];
    changedTouches: Touch[];
    targetTouches: Touch[];
    scale: number;
    rotation: number;
}> {
    component: string;
    action: 'touchstart' | 'touchend' | 'touchmove' | 'touchcancel';
}

/**
 * Type pour les événements de geste
 */
export interface GestureEvent extends K3UIEvent<{
    type: 'swipe' | 'pinch' | 'rotate' | 'pan';
    direction: 'up' | 'down' | 'left' | 'right';
    distance: number;
    velocity: number;
    scale?: number;
    rotation?: number;
}> {
    component: string;
    action: 'start' | 'move' | 'end' | 'cancel';
}

// ============================================================================
// TYPES POUR LES ÉVÉNEMENTS SPÉCIFIQUES AUX COMPOSANTS
// ============================================================================

/**
 * Événements pour le composant Dialog
 */
export interface DialogEvent extends ComponentEvent<{
    dialog: HTMLElement;
    trigger?: HTMLElement;
    overlay?: HTMLElement;
    method: 'open' | 'close' | 'toggle';
}> {
    component: 'Dialog';
    action: 'open' | 'close' | 'toggle' | 'overlay-click' | 'escape-key';
}

/**
 * Événements pour le composant Snackbar
 */
export interface SnackbarEvent extends ComponentEvent<{
    snackbar: HTMLElement;
    text: string;
    duration: number;
    position: string;
}> {
    component: 'Snackbar';
    action: 'show' | 'hide' | 'click' | 'swipe';
}

/**
 * Événements pour le composant Toast
 */
export interface ToastEvent extends ComponentEvent<{
    toast: HTMLElement;
    title?: string;
    description?: string;
    variant: string;
    position: string;
}> {
    component: 'Toast';
    action: 'show' | 'hide' | 'click' | 'action' | 'close';
}

/**
 * Événements pour le composant Select
 */
export interface SelectEvent extends ComponentEvent<{
    select: HTMLElement;
    options: HTMLElement[];
    selectedOption?: HTMLElement;
    value: unknown;
    previousValue?: unknown;
}> {
    component: 'Select';
    action: 'open' | 'close' | 'select' | 'change' | 'search';
}

/**
 * Événements pour le composant Drawer
 */
export interface DrawerEvent extends ComponentEvent<{
    drawer: HTMLElement;
    overlay?: HTMLElement;
    position: 'left' | 'right';
    width: string;
}> {
    component: 'Drawer';
    action: 'open' | 'close' | 'toggle' | 'overlay-click' | 'escape-key';
}

/**
 * Événements pour le composant Card
 */
export interface CardEvent extends ComponentEvent<{
    card: HTMLElement;
    clickable: boolean;
    hoverable: boolean;
}> {
    component: 'Card';
    action: 'click' | 'hover' | 'focus' | 'blur';
}

/**
 * Événements pour le composant Chip
 */
export interface ChipEvent extends ComponentEvent<{
    chips: HTMLElement;
    chip: HTMLElement;
    text: string;
    value: unknown;
    selected: boolean;
}> {
    component: 'Chip';
    action: 'add' | 'remove' | 'select' | 'deselect' | 'click';
}

/**
 * Événements pour le composant Forms
 */
export interface FormsEvent extends ValidationEvent {
    component: 'Forms';
    action: 'submit' | 'reset' | 'validate' | 'error' | 'success' | 'change';
}


/**
 * Événements pour le composant Shape
 */
export interface ShapeEvent extends ComponentEvent<{
    shape: HTMLElement;
    type: string;
    size: string;
    color: string;
}> {
    component: 'Shape';
    action: 'click' | 'hover' | 'focus' | 'blur';
}

// ============================================================================
// TYPES POUR LE SYSTÈME D'ÉVÉNEMENTS
// ============================================================================

/**
 * Type pour les gestionnaires d'événements
 */
export type EventHandler<T = unknown> = (event: T) => void | Promise<void>;

/**
 * Type pour les gestionnaires d'événements avec contexte
 */
export type EventHandlerWithContext<T = unknown, C = unknown> = (event: T, context: C) => void | Promise<void>;

/**
 * Type pour les options d'événement
 */
export interface EventOptions {
    /** Si l'événement doit être capturé */
    capture?: boolean;
    /** Si l'événement doit être passif */
    passive?: boolean;
    /** Si l'événement doit être supprimé après la première exécution */
    once?: boolean;
    /** Signal pour annuler l'événement */
    signal?: AbortSignal;
}

/**
 * Type pour les options d'événement personnalisé
 */
export interface CustomEventOptions extends EventOptions {
    /** Détails de l'événement */
    detail?: unknown;
    /** Si l'événement peut être annulé */
    cancelable?: boolean;
    /** Si l'événement peut bouillonner */
    bubbles?: boolean;
}

/**
 * Type pour les abonnements aux événements
 */
export interface EventSubscription {
    /** ID de l'abonnement */
    id: string;
    /** Type d'événement */
    type: string;
    /** Gestionnaire d'événement */
    handler: EventHandler;
    /** Options de l'événement */
    options?: EventOptions;
    /** Si l'abonnement est actif */
    active: boolean;
    /** Date de création */
    createdAt: number;
    /** Date de dernière exécution */
    lastExecuted?: number;
}

/**
 * Type pour les événements globaux
 */
export interface GlobalEvent {
    /** Type d'événement */
    type: string;
    /** Données de l'événement */
    data: unknown;
    /** Timestamp */
    timestamp: number;
    /** Source */
    source: string;
    /** ID unique */
    id: string;
}

/**
 * Type pour les événements de cycle de vie
 */
export interface LifecycleEvent extends K3UIEvent<{
    phase: 'init' | 'mount' | 'update' | 'unmount' | 'destroy';
    component: string;
    duration?: number;
}> {
    component: 'ComponentManager' | 'App' | 'Component';
    action: 'init' | 'mount' | 'update' | 'unmount' | 'destroy';
}

// ============================================================================
// TYPES POUR LES ÉVÉNEMENTS DE PERFORMANCE
// ============================================================================

/**
 * Type pour les événements de performance
 */
export interface PerformanceEvent extends K3UIEvent<{
    metric: string;
    value: number;
    unit: 'ms' | 'bytes' | 'count' | 'percentage';
    threshold?: number;
    status: 'good' | 'warning' | 'error';
}> {
    component: 'Performance' | 'Component' | 'Manager';
    action: 'measure' | 'threshold' | 'alert';
}

/**
 * Type pour les événements de mémoire
 */
export interface MemoryEvent extends K3UIEvent<{
    used: number;
    total: number;
    percentage: number;
    threshold: number;
}> {
    component: 'Memory' | 'Component' | 'Manager';
    action: 'measure' | 'warning' | 'error';
}

// ============================================================================
// TYPES POUR LES ÉVÉNEMENTS D'ERREUR
// ============================================================================

/**
 * Type pour les événements d'erreur
 */
export interface ErrorEvent extends K3UIEvent<{
    error: Error;
    message: string;
    stack?: string;
    component: string;
    method?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
}> {
    component: string;
    action: 'error' | 'warning' | 'fatal';
}

// ============================================================================
// TYPES POUR LES ÉVÉNEMENTS DE DEBUG
// ============================================================================

/**
 * Type pour les événements de debug
 */
export interface DebugEvent extends K3UIEvent<{
    level: 'debug' | 'info' | 'warn' | 'error';
    message: string;
    data?: unknown;
    component: string;
    method?: string;
}> {
    component: string;
    action: 'log' | 'debug' | 'info' | 'warn' | 'error';
}

// ============================================================================
// CONSTANTES POUR LES ÉVÉNEMENTS
// ============================================================================

/**
 * Types d'événements K3UI
 */
export const K3UI_EVENT_TYPES = {
    // Événements de composants
    COMPONENT_OPEN: 'k3ui:component:open',
    COMPONENT_CLOSE: 'k3ui:component:close',
    COMPONENT_CHANGE: 'k3ui:component:change',
    COMPONENT_CLICK: 'k3ui:component:click',
    COMPONENT_HOVER: 'k3ui:component:hover',
    COMPONENT_FOCUS: 'k3ui:component:focus',
    COMPONENT_BLUR: 'k3ui:component:blur',

    // Événements de validation
    VALIDATION_START: 'k3ui:validation:start',
    VALIDATION_END: 'k3ui:validation:end',
    VALIDATION_ERROR: 'k3ui:validation:error',
    VALIDATION_SUCCESS: 'k3ui:validation:success',

    // Événements de thème
    THEME_CHANGE: 'k3ui:theme:change',
    THEME_TOGGLE: 'k3ui:theme:toggle',
    THEME_RESET: 'k3ui:theme:reset',

    // Événements d'animation
    ANIMATION_START: 'k3ui:animation:start',
    ANIMATION_END: 'k3ui:animation:end',
    ANIMATION_CANCEL: 'k3ui:animation:cancel',

    // Événements de scroll
    SCROLL_START: 'k3ui:scroll:start',
    SCROLL_END: 'k3ui:scroll:end',
    SCROLL_CHANGE: 'k3ui:scroll:change',

    // Événements de drag & drop
    DRAG_START: 'k3ui:drag:start',
    DRAG_MOVE: 'k3ui:drag:move',
    DRAG_END: 'k3ui:drag:end',
    DRAG_CANCEL: 'k3ui:drag:cancel',

    // Événements de resize
    RESIZE_START: 'k3ui:resize:start',
    RESIZE_END: 'k3ui:resize:end',
    RESIZE_CHANGE: 'k3ui:resize:change',

    // Événements de clavier
    KEY_DOWN: 'k3ui:key:down',
    KEY_UP: 'k3ui:key:up',
    KEY_PRESS: 'k3ui:key:press',

    // Événements de souris
    MOUSE_CLICK: 'k3ui:mouse:click',
    MOUSE_DOUBLE_CLICK: 'k3ui:mouse:dblclick',
    MOUSE_DOWN: 'k3ui:mouse:down',
    MOUSE_UP: 'k3ui:mouse:up',
    MOUSE_MOVE: 'k3ui:mouse:move',
    MOUSE_OVER: 'k3ui:mouse:over',
    MOUSE_OUT: 'k3ui:mouse:out',
    MOUSE_ENTER: 'k3ui:mouse:enter',
    MOUSE_LEAVE: 'k3ui:mouse:leave',

    // Événements de touch
    TOUCH_START: 'k3ui:touch:start',
    TOUCH_END: 'k3ui:touch:end',
    TOUCH_MOVE: 'k3ui:touch:move',
    TOUCH_CANCEL: 'k3ui:touch:cancel',

    // Événements de geste
    GESTURE_START: 'k3ui:gesture:start',
    GESTURE_MOVE: 'k3ui:gesture:move',
    GESTURE_END: 'k3ui:gesture:end',
    GESTURE_CANCEL: 'k3ui:gesture:cancel',

    // Événements de cycle de vie
    LIFECYCLE_INIT: 'k3ui:lifecycle:init',
    LIFECYCLE_MOUNT: 'k3ui:lifecycle:mount',
    LIFECYCLE_UPDATE: 'k3ui:lifecycle:update',
    LIFECYCLE_UNMOUNT: 'k3ui:lifecycle:unmount',
    LIFECYCLE_DESTROY: 'k3ui:lifecycle:destroy',

    // Événements de performance
    PERFORMANCE_MEASURE: 'k3ui:performance:measure',
    PERFORMANCE_THRESHOLD: 'k3ui:performance:threshold',
    PERFORMANCE_ALERT: 'k3ui:performance:alert',

    // Événements de mémoire
    MEMORY_MEASURE: 'k3ui:memory:measure',
    MEMORY_WARNING: 'k3ui:memory:warning',
    MEMORY_ERROR: 'k3ui:memory:error',

    // Événements d'erreur
    ERROR_OCCURRED: 'k3ui:error:occurred',
    ERROR_WARNING: 'k3ui:error:warning',
    ERROR_FATAL: 'k3ui:error:fatal',

    // Événements de debug
    DEBUG_LOG: 'k3ui:debug:log',
    DEBUG_INFO: 'k3ui:debug:info',
    DEBUG_WARN: 'k3ui:debug:warn',
    DEBUG_ERROR: 'k3ui:debug:error'
} as const;

/**
 * Types d'événements par composant
 */
export const COMPONENT_EVENT_TYPES = {
    Dialog: ['open', 'close', 'toggle', 'overlay-click', 'escape-key'],
    Snackbar: ['show', 'hide', 'click', 'swipe'],
    Toast: ['show', 'hide', 'click', 'action', 'close'],
    Menu: ['open', 'close', 'select', 'hover'],
    Select: ['open', 'close', 'select', 'change', 'search'],
    Drawer: ['open', 'close', 'toggle', 'overlay-click', 'escape-key'],
    Card: ['click', 'hover', 'focus', 'blur'],
    Chip: ['add', 'remove', 'select', 'deselect', 'click'],
    Forms: ['submit', 'reset', 'validate', 'error', 'success', 'change'],
    Shape: ['click', 'hover', 'focus', 'blur']
} as const;

/**
 * Types d'événements par action
 */
export const ACTION_EVENT_TYPES = {
    open: ['k3ui:component:open'],
    close: ['k3ui:component:close'],
    change: ['k3ui:component:change'],
    click: ['k3ui:component:click', 'k3ui:mouse:click'],
    hover: ['k3ui:component:hover', 'k3ui:mouse:over'],
    focus: ['k3ui:component:focus'],
    blur: ['k3ui:component:blur'],
    validate: ['k3ui:validation:start', 'k3ui:validation:end'],
    error: ['k3ui:validation:error', 'k3ui:error:occurred'],
    success: ['k3ui:validation:success'],
    submit: ['k3ui:forms:submit'],
    reset: ['k3ui:forms:reset']
} as const;
