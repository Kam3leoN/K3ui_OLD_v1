/**
 * @fileoverview Types DOM pour K3UI
 * @description Interfaces et types pour la manipulation DOM
 * @author K3UI Team
 * @version 1.0.0
 */

// ============================================================================
// TYPES GÉNÉRIQUES DOM
// ============================================================================

export interface Bounding {
    /** Coordonnée gauche */
    readonly left: number;
    /** Coordonnée haute */
    readonly top: number;
    /** Largeur */
    readonly width: number;
    /** Hauteur */
    readonly height: number;
}

export interface Edges {
    /** Si le bord supérieur a été dépassé */
    readonly top: boolean;
    /** Si le bord droit a été dépassé */
    readonly right: boolean;
    /** Si le bord inférieur a été dépassé */
    readonly bottom: boolean;
    /** Si le bord gauche a été dépassé */
    readonly left: boolean;
}

export interface Position {
    readonly x: number;
    readonly y: number;
}

export interface RGBColor {
    readonly r: number;
    readonly g: number;
    readonly b: number;
}

/**
 * Callback DOM compatible avec les handlers typés MouseEvent / KeyboardEvent dans registerEvent
 * (contre-variance stricte sur `Event` sinon).
 */
export type DOMEventCallback = {
    bivarianceHack(event: Event): void;
}['bivarianceHack'];

// ============================================================================
// TYPES CLAVIER
// ============================================================================

export interface KeyboardOptions {
    /** Élément cible pour les événements clavier */
    target?: HTMLElement | Document;
    /** Activer la gestion des événements clavier */
    enabled?: boolean;
    /** Capturer les événements même si l'élément n'a pas le focus */
    capture?: boolean;
    /** Délai en millisecondes pour détecter les touches maintenues */
    holdDelay?: number;
    /** Intervalle en millisecondes pour les répétitions de touches maintenues */
    repeatInterval?: number;
    /** Ignorer les touches système */
    ignoreSystemKeys?: boolean;
}

export interface KeyboardCallbacks {
    /** Callback appelé lors d'une pression de touche */
    onKeyDown?: ((event: KeyboardEvent, key: string, code: string) => void) | null;
    /** Callback appelé lors d'un relâchement de touche */
    onKeyUp?: ((event: KeyboardEvent, key: string, code: string) => void) | null;
    /** Callback appelé lors d'un maintien de touche */
    onKeyHold?: ((event: KeyboardEvent, key: string, code: string, duration: number) => void) | null;
}

// ============================================================================
// TYPES SOURIS
// ============================================================================

export interface MouseOptions {
    /** Élément cible pour les événements de souris */
    target?: HTMLElement | Document | Window;
    /** Activer la gestion des événements de souris */
    enabled?: boolean;
    /** Capturer les événements même si l'élément n'a pas le focus */
    capture?: boolean;
    /** Seuil de mouvement en pixels pour détecter un glissement */
    dragThreshold?: number;
    /** Délai en millisecondes pour détecter un clic long */
    longClickDelay?: number;
    /** Délai en millisecondes pour détecter un double-clic */
    doubleClickDelay?: number;
}

export interface MouseCallbacks {
    /** Callback appelé lors d'un clic simple */
    onClick?: ((event: MouseEvent, x: number, y: number) => void) | null;
    /** Callback appelé lors d'un double-clic */
    onDoubleClick?: ((event: MouseEvent, x: number, y: number) => void) | null;
    /** Callback appelé lors d'un clic long */
    onLongClick?: ((event: MouseEvent, x: number, y: number, duration: number) => void) | null;
    /** Callback appelé lors d'un clic droit (contextmenu) */
    onContextMenu?: ((event: MouseEvent, x: number, y: number) => void) | null;
    /** Callback appelé lors d'un mouvement de souris */
    onMouseMove?: ((event: MouseEvent, x: number, y: number) => void) | null;
    /** Callback appelé lors de l'entrée de la souris dans l'élément */
    onMouseEnter?: ((event: MouseEvent, x: number, y: number) => void) | null;
    /** Callback appelé lors de la sortie de la souris de l'élément */
    onMouseLeave?: ((event: MouseEvent, x: number, y: number) => void) | null;
    /** Callback appelé lors d'un début de glissement */
    onDragStart?: ((event: MouseEvent, x: number, y: number) => void) | null;
    /** Callback appelé lors d'un glissement */
    onDrag?: ((event: MouseEvent, x: number, y: number, deltaX: number, deltaY: number) => void) | null;
    /** Callback appelé lors d'une fin de glissement */
    onDragEnd?: ((event: MouseEvent, x: number, y: number) => void) | null;
    /** Callback appelé lors du scroll de la fenêtre */
    onScroll?: ((event: Event) => void) | null;
    /** Callback appelé lors de l'utilisation de la molette de la souris */
    onWheel?: ((event: WheelEvent, deltaX: number, deltaY: number, deltaZ: number) => void) | null;
}

// ============================================================================
// TYPES TOUCH
// ============================================================================

export interface TouchOptions {
    /** Élément cible pour les événements tactiles */
    target?: HTMLElement | Document;
    /** Activer la gestion des événements tactiles */
    enabled?: boolean;
    /** Capturer les événements même si l'élément n'a pas le focus */
    capture?: boolean;
    /** Seuil de mouvement en pixels pour détecter un swipe */
    swipeThreshold?: number;
    /** Délai maximum en millisecondes pour détecter un swipe */
    swipeTimeout?: number;
    /** Délai en millisecondes pour détecter un tap long */
    longTapDelay?: number;
    /** Seuil de mouvement pour annuler un tap */
    tapThreshold?: number;
}

export interface TouchCallbacks {
    /** Callback appelé lors d'un tap simple */
    onTap?: ((event: TouchEvent, x: number, y: number) => void) | null;
    /** Callback appelé lors d'un double-tap */
    onDoubleTap?: ((event: TouchEvent, x: number, y: number) => void) | null;
    /** Callback appelé lors d'un tap long */
    onLongTap?: ((event: TouchEvent, x: number, y: number, duration: number) => void) | null;
    /** Callback appelé lors d'un swipe */
    onSwipe?: ((event: TouchEvent, direction: SwipeDirection, distance: number, velocity: number) => void) | null;
    /** Callback appelé lors d'un pinch */
    onPinch?: ((event: TouchEvent, scale: number, centerX: number, centerY: number) => void) | null;
    /** Callback appelé lors d'une rotation */
    onRotate?: ((event: TouchEvent, rotation: number, centerX: number, centerY: number) => void) | null;
}

export type SwipeDirection = 'up' | 'down' | 'left' | 'right';

// ============================================================================
// TYPES DRAG
// ============================================================================

/** Direction de déplacement autorisée */
export type DragDirection = 'x' | 'y' | 'xy';

/** Direction d'attraction (snap vers les bords) */
export type DragAttraction = 'x' | 'y' | 'xy';

/** Limites de déplacement */
export interface DragBoundary {
    /** Limite supérieure en pixels ou string CSS */
    top?: number | string;
    /** Limite inférieure en pixels ou string CSS */
    bottom?: number | string;
    /** Limite gauche en pixels ou string CSS */
    left?: number | string;
    /** Limite droite en pixels ou string CSS */
    right?: number | string;
}

export interface DragOptions {
    /** Élément à faire glisser */
    element: HTMLElement;
    /** Direction de déplacement autorisée */
    direction?: DragDirection;
    /** Direction d'attraction (snap vers les bords) */
    attraction?: DragAttraction;
    /** Désactiver le drag */
    disabled?: boolean;
    /** Limites de déplacement */
    boundary?: DragBoundary;
    /** Z-index de l'élément pendant le drag */
    zIndex?: number | string;
    /** Conteneur de téléportation (body par défaut) */
    teleport?: HTMLElement | string | false;
    /** Activer les transitions */
    enableTransition?: boolean;
    /** Durée de transition en ms */
    transitionDuration?: number;
}

export interface DragCallbacks {
    /** Callback appelé lors d'un clic (si pas de drag) */
    onClick?: ((event: MouseEvent | TouchEvent) => void) | null;
    /** Callback appelé au début du drag */
    onDragStart?: ((event: MouseEvent | TouchEvent, x: number, y: number) => void) | null;
    /** Callback appelé pendant le drag */
    onDrag?: ((event: MouseEvent | TouchEvent, x: number, y: number) => void) | null;
    /** Callback appelé à la fin du drag */
    onDragEnd?: ((event: MouseEvent | TouchEvent, x: number, y: number) => void) | null;
}

// ============================================================================
// TYPES DROPZONE
// ============================================================================

/** Options pour DropZone */
export interface DropZoneOptions {
    /** Élément DOM cible pour la zone de dépôt */
    element: HTMLElement;
    /** Types MIME acceptés (ex: 'image/*', '.pdf,.doc') */
    accept?: string;
    /** Accepter plusieurs fichiers */
    multiple?: boolean;
    /** Taille maximale par fichier en bytes */
    maxSize?: number;
    /** Nombre maximum de fichiers */
    maxFiles?: number;
    /** Désactiver la zone de dépôt */
    disabled?: boolean;
    /** Afficher la prévisualisation des images */
    showPreview?: boolean;
    /** Upload immédiat ou attendre confirmation */
    uploadOnDrop?: boolean;
    /** Instance d'Uploader pour upload automatique (optionnel) */
    /** Instance Uploader (import type-only pour éviter dépendance circulaire à l'exécution) */
    uploader?: import('../../utils/upload/uploader').Uploader;
    /** Upload automatique après drop (nécessite uploader) */
    autoUpload?: boolean;
}

/** Callbacks pour DropZone */
export interface DropZoneCallbacks {
    /** Callback appelé quand des fichiers sont ajoutés */
    onFilesAdded?: ((files: File[]) => void) | null;
    /** Callback appelé quand des fichiers sont rejetés */
    onFilesRejected?: ((files: File[], reason: string) => void) | null;
    /** Callback appelé quand une preview est prête */
    onPreviewReady?: ((file: File, preview: string) => void) | null;
    /** Callback appelé quand l'utilisateur confirme l'upload */
    onUploadReady?: ((files: File[]) => void) | null;
}

/** Fichier avec métadonnées pour DropZone */
export interface DropZoneFile {
    /** Objet File natif */
    file: File;
    /** Data URL pour la prévisualisation (images uniquement) */
    preview?: string;
    /** Statut du fichier */
    status: 'pending' | 'ready' | 'uploading' | 'uploaded' | 'error';
}

// ============================================================================
// CONSTANTES
// ============================================================================

export const KEY_MAP = {
    TAB: ['Tab'],
    ENTER: ['Enter'],
    ESC: ['Escape', 'Esc'],
    BACKSPACE: ['Backspace'],
    ARROW_UP: ['ArrowUp', 'Up'],
    ARROW_DOWN: ['ArrowDown', 'Down'],
    ARROW_LEFT: ['ArrowLeft', 'Left'],
    ARROW_RIGHT: ['ArrowRight', 'Right'],
    DELETE: ['Delete', 'Del']
} as const;
