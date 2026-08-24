/**
 * @fileoverview Types Image Editor pour K3UI
 * @description Interfaces et types pour l'éditeur d'images avancé
 * @author K3UI Team
 * @version 1.0.0
 */

// ============================================================================
// TYPES FORMATS ET POSITIONS
// ============================================================================

/** Formats d'image supportés */
export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'avif' | 'gif';

/** Type de watermark */
export type WatermarkType = 'text' | 'image';

/** Position du watermark */
export type WatermarkPosition =
    | 'center'
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'middle-left'
    | 'middle-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';

// ============================================================================
// OPTIONS MODULES
// ============================================================================

/** Options pour le module de crop */
export interface CropModuleOptions {
    /** Afficher la grille de composition (défaut: true) */
    showGrid?: boolean;
    /** Couleur de l'overlay (défaut: rgba(0,0,0,0.5)) */
    overlayColor?: string;
}

/** Options pour le module de zoom */
export interface ZoomModuleOptions {
    /** Zoom minimum en échelle (défaut: 0.5) */
    min?: number;
    /** Zoom maximum en échelle (défaut: 5) */
    max?: number;
    /** Pas d'incrémentation (défaut: 0.1) */
    step?: number;
    /** Sensibilité de la molette (défaut: 0.05) */
    wheelSensitivity?: number;
    /** Afficher le slider UI (défaut: false) */
    showSlider?: boolean;
    /** Afficher le pourcentage (défaut: false) */
    showPercentage?: boolean;
}

/** Options pour le module de rotation */
export interface RotationModuleOptions {
    /** Autoriser la rotation libre 0-360° (défaut: true) */
    allowFreeRotation?: boolean;
    /** Afficher l'input de rotation (défaut: false) */
    showRotationInput?: boolean;
    /** Afficher les boutons rapides 90°/180°/270° (défaut: false) */
    showQuickButtons?: boolean;
    /** Magnétisme tous les X degrés, 0 = désactivé (défaut: 0) */
    snapToAngle?: number;
    /** Afficher l'indicateur d'angle (défaut: false) */
    showAngleIndicator?: boolean;
}

/** Options pour le watermark */
export interface WatermarkOptions {
    /** Type de watermark */
    type: WatermarkType;

    // Texte
    /** Texte du watermark (pour type 'text') */
    text?: string;
    /** Taille de police en pixels (défaut: 24) */
    fontSize?: number;
    /** Famille de police (défaut: 'Arial') */
    fontFamily?: string;
    /** Couleur du texte (défaut: '#ffffff') */
    color?: string;

    // Image
    /** URL de l'image watermark (pour type 'image') */
    imageUrl?: string;
    /** Blob de l'image watermark (pour type 'image') */
    imageBlob?: Blob;

    // Commun
    /** Opacité 0-1 (défaut: 0.5) */
    opacity?: number;
    /** Position prédéfinie (défaut: 'bottom-right') */
    position?: WatermarkPosition;
    /** Position X personnalisée en pixels */
    customX?: number;
    /** Position Y personnalisée en pixels */
    customY?: number;
    /** Padding depuis les bords en pixels (défaut: 20) */
    padding?: number;
    /** Échelle du watermark (défaut: 1) */
    scale?: number;

    // Nouvelles options avancées
    /** Répéter le watermark sur toute l'image (défaut: false) */
    repeat?: boolean;
    /** Espacement entre les répétitions en pixels (défaut: 10) */
    repeatPadding?: number;
    /** Rotation du watermark en degrés (défaut: 0) */
    rotation?: number;
    /** Afficher un fond derrière le watermark (défaut: false) */
    showBackground?: boolean;
    /** Couleur du fond (défaut: '#000000') */
    backgroundColor?: string;
    /** Opacité du fond 0-1 (défaut: 0.5) */
    backgroundOpacity?: number;
    /** Padding intérieur du fond en pixels (défaut: 10) */
    backgroundPadding?: number;
}

/** Options pour le module de conversion */
export interface ConversionOptions {
    /** Format de sortie (défaut: 'jpeg') */
    format?: ImageFormat;
    /** Qualité 0-1 (défaut: 0.8) */
    quality?: number;
    /** Préserver les métadonnées EXIF (défaut: false) */
    preserveMetadata?: boolean;
    /** Couleur de fond pour formats sans alpha (défaut: '#ffffff') */
    backgroundColor?: string;
}

// ============================================================================
// OPTIONS ÉDITEUR PRINCIPAL
// ============================================================================

/** Options pour l'ImageEditor */
export interface ImageEditorOptions {
    /** Élément conteneur */
    container: HTMLElement;
    /** Largeur de la zone d'édition (défaut: 800px) */
    width?: number;
    /** Hauteur de la zone d'édition (défaut: 600px) */
    height?: number;

    /** Options du module crop */
    crop?: CropModuleOptions;
    /** Options du module zoom */
    zoom?: ZoomModuleOptions;
    /** Options du module rotation */
    rotation?: RotationModuleOptions;
    /** Options de conversion */
    conversion?: ConversionOptions;
}

/** Callbacks pour l'ImageEditor */
export interface ImageEditorCallbacks {
    /** Callback appelé quand l'image est chargée */
    onImageLoad?: () => void;
    /** Callback appelé quand l'état change */
    onStateChange?: (state: EditorState) => void;
    /** Callback appelé lors de l'export */
    onExport?: (result: ExportResult) => void;
    /** Callback appelé en cas d'erreur */
    onError?: (error: Error) => void;
}

// ============================================================================
// ÉTATS ET RÉSULTATS
// ============================================================================

/** Coordonnées de crop */
export interface CropCoordinates {
    /** Position X */
    x: number;
    /** Position Y */
    y: number;
    /** Largeur */
    width: number;
    /** Hauteur */
    height: number;
}

/** État du crop */
export interface CropState {
    /** Position X de l'image */
    imageX: number;
    /** Position Y de l'image */
    imageY: number;
    /** Échelle de l'image */
    imageScale: number;
}

/** État de l'éditeur pour historique */
export interface EditorState {
    /** Données image */
    imageData: ImageData;
    /** État du crop */
    cropState: CropState;
    /** Niveau de zoom */
    zoom: number;
    /** Angle de rotation en degrés */
    rotation: number;
    /** Format de conversion */
    format: ImageFormat;
    /** Qualité de conversion */
    quality: number;
    /** Timestamp de l'état */
    timestamp: number;
}

/** Résultat de l'export */
export interface ExportResult {
    /** Blob de l'image exportée */
    blob: Blob;
    /** Data URL de l'image */
    dataUrl: string;
    /** Format de l'image */
    format: ImageFormat;
    /** Taille en octets */
    size: number;
    /** Largeur en pixels */
    width: number;
    /** Hauteur en pixels */
    height: number;
    /** Qualité utilisée (0-1) */
    quality: number;
}

// ============================================================================
// TYPES INTERNES MODULES
// ============================================================================

/** État interne du zoom */
export interface ZoomState {
    /** Niveau de zoom actuel */
    level: number;
    /** Point focal X (pour zoom centré) */
    focalX: number;
    /** Point focal Y (pour zoom centré) */
    focalY: number;
}

/** État interne de la rotation */
export interface RotationState {
    /** Angle de rotation en degrés (0-360) */
    angle: number;
    /** Flip horizontal */
    flipH: boolean;
    /** Flip vertical */
    flipV: boolean;
}

/** Watermark chargé (interne) */
export interface LoadedWatermark {
    /** Type */
    type: WatermarkType;
    /** Options */
    options: WatermarkOptions;
    /** Image chargée (pour type 'image') */
    image?: HTMLImageElement;
}
