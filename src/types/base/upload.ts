/**
 * @fileoverview Types Upload pour K3UI
 * @description Interfaces et types pour l'upload de fichiers avec chunking et retry
 * @author K3UI Team
 * @version 1.0.0
 */

// ============================================================================
// TYPES THUMBNAIL
// ============================================================================

/** Mode de crop pour les thumbnails */
export type ThumbnailCropMode = 'cover' | 'contain' | 'fill';

/** Position du crop pour le mode cover */
export type ThumbnailCropPosition =
    | 'center'
    | 'top'
    | 'bottom'
    | 'left'
    | 'right'
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right';

/** Options de crop pour les thumbnails */
export interface ThumbnailCropOptions {
    /** Mode de crop (défaut: contain) */
    mode?: ThumbnailCropMode;
    /** Position du crop pour mode cover (défaut: center) */
    position?: ThumbnailCropPosition;
}

/** Options pour la génération de thumbnails */
export interface ThumbnailOptions {
    /** Largeur maximale en pixels (défaut: 200px) */
    maxWidth?: number;
    /** Hauteur maximale en pixels (défaut: 200px) */
    maxHeight?: number;
    /** Qualité JPEG/WebP (0-1, défaut: 0.8) */
    quality?: number;
    /** Options de crop */
    crop?: ThumbnailCropOptions;
}

// ============================================================================
// TYPES IMAGE CROPPER
// ============================================================================

/** Options pour l'ImageCropper */
export interface ImageCropperOptions {
    /** Élément conteneur */
    container: HTMLElement;
    /** Largeur de la zone de crop (défaut: 300px) */
    width?: number;
    /** Hauteur de la zone de crop (défaut: 300px) */
    height?: number;
    /** Qualité JPEG/WebP (0-1, défaut: 0.8) */
    quality?: number;
    /** Afficher la grille (défaut: true) */
    showGrid?: boolean;
    /** Couleur de l'overlay (défaut: rgba(0,0,0,0.5)) */
    overlayColor?: string;
}

/** Callbacks pour l'ImageCropper */
export interface ImageCropperCallbacks {
    /** Callback appelé quand l'image est chargée */
    onImageLoad?: () => void;
    /** Callback appelé quand la position change */
    onPositionChange?: (x: number, y: number) => void;
    /** Callback appelé quand le crop est validé */
    onCrop?: (blob: Blob, dataUrl: string) => void;
}

/** Réexport des coordonnées de crop (définies dans image.ts) */
export type { CropCoordinates } from './image';

// ============================================================================
// TYPES UPLOADER
// ============================================================================

/** Options pour l'Uploader */
export interface UploaderOptions {
    /** URL de destination pour l'upload */
    url: string;
    /** Méthode HTTP (défaut: POST) */
    method?: 'POST' | 'PUT';
    /** Headers HTTP personnalisés */
    headers?: Record<string, string>;
    /** Taille des chunks en bytes (défaut: 5MB) */
    chunkSize?: number;
    /** Nombre maximum de tentatives (défaut: 3) */
    maxRetries?: number;
    /** Délai initial entre les retries en ms (défaut: 1000ms) */
    retryDelay?: number;
    /** Délai maximum entre les retries en ms (défaut: 30000ms) */
    maxRetryDelay?: number;
    /** Upload des chunks en parallèle (défaut: false) */
    parallel?: boolean;
    /** Nombre maximum de chunks simultanés (défaut: 3) */
    maxParallel?: number;
    /** Envoyer les cookies (défaut: false) */
    withCredentials?: boolean;
    /** Largeur maximale du thumbnail (défaut: 200px) */
    thumbnailMaxWidth?: number;
    /** Hauteur maximale du thumbnail (défaut: 200px) */
    thumbnailMaxHeight?: number;
    /** Qualité du thumbnail JPEG (défaut: 0.8) */
    thumbnailQuality?: number;
    /** Générer des thumbnails pour les images (défaut: true) */
    generateThumbnails?: boolean;
}

/** Callbacks pour l'Uploader */
export interface UploaderCallbacks {
    /** Callback appelé lors de la progression globale */
    onProgress?: (progress: number, loaded: number, total: number) => void;
    /** Callback appelé lors de la progression d'un chunk */
    onChunkProgress?: (chunkIndex: number, chunkProgress: number) => void;
    /** Callback appelé en cas de succès */
    onSuccess?: (response: unknown) => void;
    /** Callback appelé en cas d'erreur */
    onError?: (error: Error) => void;
    /** Callback appelé lors d'un retry */
    onRetry?: (attempt: number, delay: number) => void;
    /** Callback appelé quand un thumbnail est généré */
    onThumbnailGenerated?: (thumbnail: Blob, dataUrl: string) => void;
}

/** Tâche d'upload */
export interface UploadTask {
    /** Identifiant unique de la tâche */
    id: string;
    /** Fichier à uploader */
    file: File;
    /** Statut de la tâche */
    status: 'pending' | 'uploading' | 'paused' | 'completed' | 'error';
    /** Progression en pourcentage (0-100) */
    progress: number;
    /** Nombre d'octets uploadés */
    loaded: number;
    /** Taille totale en octets */
    total: number;
    /** Liste des chunks */
    chunks: ChunkInfo[];
    /** Erreur si échec */
    error?: Error;
    /** Thumbnail généré (si image) */
    thumbnail?: Blob;
    /** URL du thumbnail en base64 */
    thumbnailDataUrl?: string;
}

/** Information sur un chunk */
export interface ChunkInfo {
    /** Index du chunk */
    index: number;
    /** Position de début dans le fichier */
    start: number;
    /** Position de fin dans le fichier */
    end: number;
    /** Taille du chunk en octets */
    size: number;
    /** Statut du chunk */
    status: 'pending' | 'uploading' | 'completed' | 'error';
    /** Nombre de tentatives */
    retries: number;
    /** Blob du chunk */
    blob?: Blob;
}

// ============================================================================
// TYPES SÉCURITÉ FICHIERS
// ============================================================================

/** Code de rejet sécurité */
export type FileSecurityRejectCode =
    | 'empty'
    | 'blacklist'
    | 'whitelist'
    | 'double-extension'
    | 'magic-bytes'
    | 'virus'
    | 'scan-error'
    | 'scan-timeout';

/** Options de validation sécurité */
export interface FileSecurityOptions {
    /**
     * Liste blanche (extensions `.pdf` et/ou MIME `image/*`, `application/pdf`)
     * Si vide : pas de filtre whitelist (blacklist + accept restent actifs)
     */
    whitelist?: string[];
    /**
     * Extensions / MIME supplémentaires à bloquer (fusionnés avec la blacklist par défaut)
     */
    blacklist?: string[];
    /**
     * Appliquer la blacklist dangereuse par défaut (exe, bat, php, …)
     * @default true
     */
    useDefaultBlacklist?: boolean;
    /**
     * Vérifier les signatures magiques (contenu vs extension / MIME)
     * @default true
     */
    checkMagicBytes?: boolean;
    /**
     * Bloquer les doubles extensions (ex: `facture.pdf.exe`)
     * @default true
     */
    blockDoubleExtensions?: boolean;
    /**
     * Rejeter les fichiers vides
     * @default true
     */
    rejectEmpty?: boolean;
    /**
     * URL d’un endpoint antivirus serveur (FormData `file`)
     * Réponse attendue : `{ "safe": true }` ou `{ "safe": false, "reason": "…" }`
     */
    scanUrl?: string;
    /**
     * Timeout du scan antivirus (ms)
     * @default 30000
     */
    scanTimeout?: number;
    /** Headers HTTP pour le scan */
    headers?: Record<string, string>;
}

/** Résultat de validation d’un fichier */
export interface FileSecurityResult {
    valid: boolean;
    reason?: string;
    code?: FileSecurityRejectCode;
}

/** Fichier rejeté par la sécurité */
export interface FileSecurityRejection {
    file: File;
    reason: string;
    code: FileSecurityRejectCode;
}
