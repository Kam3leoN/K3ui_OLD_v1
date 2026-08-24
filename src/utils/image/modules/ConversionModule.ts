/**
 * @fileoverview Module de conversion pour ImageEditor
 * @description Gestion de la conversion de formats d'images
 * @author K3UI Team
 * @version 1.0.0
 */

import { ConversionOptions, ImageFormat } from '../../../types/base/image';

// ============================================================================
// CLASSE CONVERSIONMODULE
// ============================================================================

/**
 * Module de gestion de la conversion de formats
 * @description Gère la conversion entre différents formats d'images
 */
export class ConversionModule {
    private _format: ImageFormat;
    private _quality: number;
    private _preserveMetadata: boolean;
    private _backgroundColor: string;

    // Formats supportés par le navigateur
    private _supportedFormats: Set<ImageFormat> = new Set();

    constructor(options: ConversionOptions = {}) {
        this._format = options.format ?? 'jpeg';
        this._quality = options.quality ?? 0.8;
        this._preserveMetadata = options.preserveMetadata ?? false;
        this._backgroundColor = options.backgroundColor ?? '#ffffff';

        this._detectSupportedFormats();
    }

    /**
     * Détecte les formats supportés par le navigateur
     */
    private _detectSupportedFormats(): void {
        // JPEG et PNG sont toujours supportés
        this._supportedFormats.add('jpeg');
        this._supportedFormats.add('png');

        // Créer un canvas temporaire pour tester les formats
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;

        // Tester WebP
        if (canvas.toDataURL('image/webp').startsWith('data:image/webp')) {
            this._supportedFormats.add('webp');
        }

        // Tester AVIF (support plus récent)
        if (canvas.toDataURL('image/avif').startsWith('data:image/avif')) {
            this._supportedFormats.add('avif');
        }

        // GIF est généralement supporté mais limité
        this._supportedFormats.add('gif');

        // Formats supportés: Array.from(this._supportedFormats)
    }

    /**
     * Définit le format de sortie
     */
    setFormat(format: ImageFormat): void {
        if (!this._supportedFormats.has(format)) {
            console.warn(`[ConversionModule] Format ${format} non supporté, utilisation de jpeg par défaut`);
            this._format = 'jpeg';
            return;
        }
        this._format = format;
    }

    /**
     * Définit la qualité de compression (0-1)
     */
    setQuality(quality: number): void {
        this._quality = Math.max(0, Math.min(1, quality));
    }

    /**
     * Définit la couleur de fond pour formats sans alpha
     */
    setBackgroundColor(color: string): void {
        this._backgroundColor = color;
    }

    /**
     * Récupère le format actuel
     */
    getFormat(): ImageFormat {
        return this._format;
    }

    /**
     * Récupère la qualité actuelle
     */
    getQuality(): number {
        return this._quality;
    }

    /**
     * Récupère le type MIME du format actuel
     */
    getMimeType(): string {
        switch (this._format) {
            case 'jpeg':
                return 'image/jpeg';
            case 'png':
                return 'image/png';
            case 'webp':
                return 'image/webp';
            case 'avif':
                return 'image/avif';
            case 'gif':
                return 'image/gif';
            default:
                return 'image/jpeg';
        }
    }

    /**
     * Vérifie si le format supporte la transparence
     */
    supportsTransparency(): boolean {
        return this._format === 'png' || this._format === 'webp' || this._format === 'gif';
    }

    /**
     * Vérifie si le format supporte la qualité
     */
    supportsQuality(): boolean {
        // JPEG, WebP et AVIF supportent la qualité
        return this._format === 'jpeg' || this._format === 'webp' || this._format === 'avif';
    }

    /**
     * Vérifie si un format est supporté
     */
    isFormatSupported(format: ImageFormat): boolean {
        return this._supportedFormats.has(format);
    }

    /**
     * Récupère la liste des formats supportés
     */
    getSupportedFormats(): ImageFormat[] {
        return Array.from(this._supportedFormats);
    }

    /**
     * Convertit un canvas en Blob du format spécifié
     */
    async convert(canvas: HTMLCanvasElement): Promise<Blob> {
        return new Promise((resolve, reject) => {
            // Si le format ne supporte pas la transparence, appliquer un fond
            if (!this.supportsTransparency()) {
                canvas = this._applyBackground(canvas);
            }

            const mimeType = this.getMimeType();
            const quality = this.supportsQuality() ? this._quality : undefined;

            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error('Impossible de créer le blob'));
                        return;
                    }
                    resolve(blob);
                },
                mimeType,
                quality
            );
        });
    }

    /**
     * Applique un fond de couleur sur un canvas (pour formats sans alpha)
     */
    private _applyBackground(sourceCanvas: HTMLCanvasElement): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.width = sourceCanvas.width;
        canvas.height = sourceCanvas.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('[ConversionModule] Impossible de créer le contexte canvas');
            return sourceCanvas;
        }

        // Remplir avec la couleur de fond
        ctx.fillStyle = this._backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Dessiner l'image originale par-dessus
        ctx.drawImage(sourceCanvas, 0, 0);

        return canvas;
    }

    /**
     * Estime la taille du fichier résultant
     * @description Estimation approximative basée sur le format et la qualité
     */
    async estimateSize(canvas: HTMLCanvasElement): Promise<number> {
        try {
            const blob = await this.convert(canvas);
            return blob.size;
        } catch (error) {
            console.error('[ConversionModule] Erreur estimation taille:', error);
            // Estimation approximative en cas d'erreur
            const pixels = canvas.width * canvas.height;
            const bytesPerPixel = this._estimateBytesPerPixel();
            return Math.round(pixels * bytesPerPixel);
        }
    }

    /**
     * Estime le nombre d'octets par pixel selon le format et la qualité
     */
    private _estimateBytesPerPixel(): number {
        switch (this._format) {
            case 'jpeg':
                return this._quality * 0.5; // JPEG: ~0.1 à 0.5 bytes/pixel
            case 'png':
                return 1.5; // PNG: ~1-2 bytes/pixel (compression lossless)
            case 'webp':
                return this._quality * 0.3; // WebP: meilleure compression que JPEG
            case 'avif':
                return this._quality * 0.2; // AVIF: excellente compression
            case 'gif':
                return 0.5; // GIF: ~0.5 bytes/pixel (256 couleurs)
            default:
                return 1;
        }
    }

    /**
     * Convertit et génère un Data URL
     */
    async convertToDataURL(canvas: HTMLCanvasElement): Promise<string> {
        if (!this.supportsTransparency()) {
            canvas = this._applyBackground(canvas);
        }

        const mimeType = this.getMimeType();
        const quality = this.supportsQuality() ? this._quality : undefined;

        return canvas.toDataURL(mimeType, quality);
    }

    /**
     * Récupère les informations sur le format actuel
     */
    getFormatInfo(): {
        format: ImageFormat;
        mimeType: string;
        supportsTransparency: boolean;
        supportsQuality: boolean;
        quality: number;
    } {
        return {
            format: this._format,
            mimeType: this.getMimeType(),
            supportsTransparency: this.supportsTransparency(),
            supportsQuality: this.supportsQuality(),
            quality: this._quality
        };
    }

    /**
     * Réinitialise aux valeurs par défaut
     */
    reset(): void {
        this._format = 'jpeg';
        this._quality = 0.8;
        this._backgroundColor = '#ffffff';
    }

    /**
     * Nettoie le module
     */
    destroy(): void {
        // Rien à nettoyer pour ce module
    }
}
