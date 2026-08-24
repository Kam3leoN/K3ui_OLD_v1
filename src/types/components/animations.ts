/**
 * @fileoverview Types d'animation K3UI
 * @description Définitions de types et constantes pour animations/transitions
 * @author K3UI Team
 * @version 1.0.0
 */

// ============================================================================
// TYPES POUR LES ANIMATIONS
// ============================================================================

export type AnimationType =
    | 'fade'
    | 'slide'
    | 'scale'
    | 'rotate'
    | 'spring'
    | 'bounce'
    | 'shake'
    | 'pulse'
    | 'flip'
    | 'zoom'
    | 'skew'
    | 'wobble'
    | 'jello'
    | 'tada'
    | 'rubberBand'
    | 'swing'
    | 'hinge'
    | 'jackInTheBox'
    | 'rollIn'
    | 'rollOut'
    | 'lightSpeedIn'
    | 'lightSpeedOut'
    | 'bounceIn'
    | 'bounceOut'
    | 'fadeIn'
    | 'fadeOut'
    | 'slideIn'
    | 'slideOut'
    | 'zoomIn'
    | 'zoomOut'
    | 'flipIn'
    | 'flipOut'
    | 'custom';

export type AnimationDirection =
    | 'up'
    | 'down'
    | 'left'
    | 'right'
    | 'in'
    | 'out'
    | 'center'
    | 'top'
    | 'bottom'
    | 'start'
    | 'end';

export type AnimationFillMode = 'none' | 'forwards' | 'backwards' | 'both';

export type AnimationState = 'idle' | 'running' | 'paused' | 'finished' | 'cancelled' | 'error';

// ============================================================================
// TYPES POUR LES TRANSITIONS
// ============================================================================

export type TransitionType =
    | 'ease'
    | 'ease-in'
    | 'ease-out'
    | 'ease-in-out'
    | 'linear'
    | 'step-start'
    | 'step-end'
    | 'cubic-bezier'
    | 'spring'
    | 'bounce'
    | 'elastic'
    | 'custom';

export type TransitionProperty =
    | 'all'
    | 'none'
    | 'opacity'
    | 'transform'
    | 'background-color'
    | 'color'
    | 'width'
    | 'height'
    | 'top'
    | 'left'
    | 'right'
    | 'bottom'
    | 'margin'
    | 'padding'
    | 'border'
    | 'box-shadow'
    | 'filter'
    | 'backdrop-filter'
    | 'clip-path'
    | 'custom';

// ============================================================================
// TYPES POUR LES EASING
// ============================================================================

export type EasingType =
    | 'linear'
    | 'ease'
    | 'ease-in'
    | 'ease-out'
    | 'ease-in-out'
    | 'cubic-bezier'
    | 'spring'
    | 'bounce'
    | 'elastic'
    | 'back'
    | 'circ'
    | 'cubic'
    | 'expo'
    | 'quad'
    | 'quart'
    | 'quint'
    | 'sine'
    | 'custom';

export interface EasingFunction {
    name: string;
    function: (t: number) => number;
    parameters?: number[];
    description?: string;
}

export interface BezierCurve {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

// ============================================================================
// TYPES POUR LES KEYFRAMES
// ============================================================================

export interface Keyframe {
    offset: number;
    properties: Record<string, string | number>;
    easing?: EasingFunction;
    critical?: boolean;
}

export interface KeyframeSet {
    name: string;
    keyframes: Keyframe[];
    duration?: number;
    easing?: EasingFunction;
    direction?: AnimationDirection;
    fillMode?: AnimationFillMode;
    iterations?: number | 'infinite';
    delay?: number;
}

// ============================================================================
// TYPES POUR LA CONFIGURATION D'ANIMATION
// ============================================================================

export interface AnimationConfig extends Record<string, unknown> {
    type: AnimationType;
    duration: number;
    delay?: number;
    easing?: EasingFunction | EasingType;
    iterations?: number | 'infinite';
    direction?: AnimationDirection;
    fillMode?: AnimationFillMode;
    playDirection?: AnimationDirection;
    paused?: boolean;
    loop?: boolean;
    onStart?: () => void;
    onEnd?: () => void;
    onIteration?: () => void;
    onPause?: () => void;
    onResume?: () => void;
    onCancel?: () => void;
    onError?: (error: Error) => void;
}

export interface TransitionConfig {
    properties: TransitionProperty[];
    duration: number;
    delay?: number;
    easing?: EasingFunction | EasingType;
    running?: boolean;
    onStart?: () => void;
    onEnd?: () => void;
    onProgress?: (progress: number) => void;
}

// ============================================================================
// TYPES POUR LES ANIMATIONS DE COMPOSANTS
// ============================================================================

export interface ComponentAnimations {
    enter?: AnimationConfig;
    exit?: AnimationConfig;
    focus?: AnimationConfig;
    blur?: AnimationConfig;
    hover?: AnimationConfig;
    click?: AnimationConfig;
    loading?: AnimationConfig;
    error?: AnimationConfig;
    success?: AnimationConfig;
    warning?: AnimationConfig;
    info?: AnimationConfig;
}

export interface ComponentTransitions {
    base?: TransitionConfig;
    color?: TransitionConfig;
    size?: TransitionConfig;
    position?: TransitionConfig;
    opacity?: TransitionConfig;
    transform?: TransitionConfig;
    shadow?: TransitionConfig;
    border?: TransitionConfig;
}

// ============================================================================
// TYPES POUR LES GESTIONNAIRES D'ANIMATION
// ============================================================================

export interface AnimationManager {
    create(config: AnimationConfig): AnimationInstance;
    start(instance: AnimationInstance): void;
    pause(instance: AnimationInstance): void;
    resume(instance: AnimationInstance): void;
    stop(instance: AnimationInstance): void;
    cancel(instance: AnimationInstance): void;
    getState(instance: AnimationInstance): AnimationState;
    getAll(): AnimationInstance[];
    cleanup(): void;
}

export interface AnimationInstance {
    id: string;
    config: AnimationConfig;
    state: AnimationState;
    element: HTMLElement;
    animation?: Animation;
    startTime?: number;
    endTime?: number;
    elapsedTime?: number;
    progress?: number;
    isLooping?: boolean;
    iterationCount?: number;
}

// ============================================================================
// CONSTANTES
// ============================================================================

export const ANIMATION_TYPES = {
    FADE: 'fade' as const,
    SLIDE: 'slide' as const,
    SCALE: 'scale' as const,
    ROTATE: 'rotate' as const,
    BOUNCE: 'bounce' as const,
    SHAKE: 'shake' as const,
    PULSE: 'pulse' as const,
    FLIP: 'flip' as const,
    ZOOM: 'zoom' as const,
    SKEW: 'skew' as const,
    WOBBLE: 'wobble' as const,
    JELLO: 'jello' as const,
    TADA: 'tada' as const,
    RUBBER_BAND: 'rubberBand' as const,
    SWING: 'swing' as const,
    HINGE: 'hinge' as const,
    JACK_IN_THE_BOX: 'jackInTheBox' as const,
    ROLL_IN: 'rollIn' as const,
    ROLL_OUT: 'rollOut' as const,
    LIGHT_SPEED_IN: 'lightSpeedIn' as const,
    LIGHT_SPEED_OUT: 'lightSpeedOut' as const,
    BOUNCE_IN: 'bounceIn' as const,
    BOUNCE_OUT: 'bounceOut' as const,
    FADE_IN: 'fadeIn' as const,
    FADE_OUT: 'fadeOut' as const,
    SLIDE_IN: 'slideIn' as const,
    SLIDE_OUT: 'slideOut' as const,
    ZOOM_IN: 'zoomIn' as const,
    ZOOM_OUT: 'zoomOut' as const,
    FLIP_IN: 'flipIn' as const,
    FLIP_OUT: 'flipOut' as const,
    CUSTOM: 'custom' as const,
} as const;

export const ANIMATION_DIRECTIONS = {
    UP: 'up' as const,
    DOWN: 'down' as const,
    LEFT: 'left' as const,
    RIGHT: 'right' as const,
    IN: 'in' as const,
    OUT: 'out' as const,
    CENTER: 'center' as const,
    TOP: 'top' as const,
    BOTTOM: 'bottom' as const,
    START: 'start' as const,
    END: 'end' as const,
} as const;

export const ANIMATION_STATES = {
    IDLE: 'idle' as const,
    RUNNING: 'running' as const,
    PAUSED: 'paused' as const,
    FINISHED: 'finished' as const,
    CANCELLED: 'cancelled' as const,
    ERROR: 'error' as const,
} as const;

export const TRANSITION_TYPES = {
    EASE: 'ease' as const,
    EASE_IN: 'ease-in' as const,
    EASE_OUT: 'ease-out' as const,
    EASE_IN_OUT: 'ease-in-out' as const,
    LINEAR: 'linear' as const,
    STEP_START: 'step-start' as const,
    STEP_END: 'step-end' as const,
    CUBIC_BEZIER: 'cubic-bezier' as const,
    SPRING: 'spring' as const,
    BOUNCE: 'bounce' as const,
    ELASTIC: 'elastic' as const,
    CUSTOM: 'custom' as const,
} as const;

export const EASING_TYPES = {
    LINEAR: 'linear' as const,
    EASE: 'ease' as const,
    EASE_IN: 'ease-in' as const,
    EASE_OUT: 'ease-out' as const,
    EASE_IN_OUT: 'ease-in-out' as const,
    CUBIC_BEZIER: 'cubic-bezier' as const,
    SPRING: 'spring' as const,
    BOUNCE: 'bounce' as const,
    ELASTIC: 'elastic' as const,
    BACK: 'back' as const,
    CIRC: 'circ' as const,
    CUBIC: 'cubic' as const,
    EXPO: 'expo' as const,
    QUAD: 'quad' as const,
    QUART: 'quart' as const,
    QUINT: 'quint' as const,
    SINE: 'sine' as const,
    CUSTOM: 'custom' as const,
} as const;


