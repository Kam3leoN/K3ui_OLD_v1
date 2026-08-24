/**
 * @fileoverview Module de crop pour ImageEditor
 * @description Gestion du recadrage d'image avec drag & drop
 * @author K3UI Team
 * @version 1.0.0
 */

import { CropModuleOptions, CropState, CropCoordinates } from '../../../types/base/image';

// ============================================================================
// CLASSE CROPMODULE
// ============================================================================

/**
 * Module de gestion du crop
 * @description Gère le positionnement et le recadrage de l'image
 */
export class CropModule {
    private _showGrid: boolean;
    private _overlayColor: string;
    private _canvasWidth: number;
    private _canvasHeight: number;

    // État du crop
    private _imageX: number = 0;
    private _imageY: number = 0;
    private _imageScale: number = 1;

    // Données de l'image
    private _image: HTMLImageElement | null = null;

    constructor(options: CropModuleOptions = {}) {
        this._showGrid = options.showGrid ?? true;
        this._overlayColor = options.overlayColor ?? 'rgba(0, 0, 0, 0.5)';
        this._canvasWidth = 0;
        this._canvasHeight = 0;
    }

    /**
     * Initialise le module avec les dimensions du canvas
     */
    initialize(canvasWidth: number, canvasHeight: number): void {
        this._canvasWidth = canvasWidth;
        this._canvasHeight = canvasHeight;
    }

    /**
     * Définit l'image à cropper
     */
    setImage(image: HTMLImageElement): void {
        this._image = image;
        this.calculateInitialPosition();
    }

    /**
     * Calcule la position initiale de l'image pour la centrer et remplir le canvas
     */
    calculateInitialPosition(): void {
        if (!this._image) {
            console.warn('[CropModule] Aucune image définie');
            return;
        }

        const imgRatio = this._image.width / this._image.height;
        const canvasRatio = this._canvasWidth / this._canvasHeight;

        // Calculer l'échelle pour que l'image remplisse complètement la zone (mode cover)
        // mais avec une marge de 90% pour permettre de dézoomer un peu
        if (imgRatio > canvasRatio) {
            // Image plus large : ajuster sur la hauteur
            this._imageScale = (this._canvasHeight / this._image.height) * 0.9;
        } else {
            // Image plus haute : ajuster sur la largeur
            this._imageScale = (this._canvasWidth / this._image.width) * 0.9;
        }

        // Centrer l'image
        const scaledWidth = this._image.width * this._imageScale;
        const scaledHeight = this._image.height * this._imageScale;
        this._imageX = (this._canvasWidth - scaledWidth) / 2;
        this._imageY = (this._canvasHeight - scaledHeight) / 2;
    }

    /**
     * Gère le déplacement de l'image (drag)
     */
    handleDrag(deltaX: number, deltaY: number): void {
        if (!this._image) return;

        this._imageX += deltaX;
        this._imageY += deltaY;

        // Ne pas appliquer de limites strictes, permettre à l'image de sortir du canvas
        // pour un meilleur contrôle utilisateur lors du dézoom
    }

    /**
     * Définit la position de l'image
     */
    setPosition(x: number, y: number): void {
        this._imageX = x;
        this._imageY = y;
        // Pas de limites strictes pour permettre plus de liberté
    }

    /**
     * Définit l'échelle de l'image
     */
    setScale(scale: number): void {
        if (!this._image) return;

        const oldScale = this._imageScale;
        this._imageScale = scale;

        // Ajuster la position pour maintenir le centre
        const scaleFactor = scale / oldScale;
        const centerX = this._canvasWidth / 2;
        const centerY = this._canvasHeight / 2;

        this._imageX = centerX - (centerX - this._imageX) * scaleFactor;
        this._imageY = centerY - (centerY - this._imageY) * scaleFactor;

        // Pas de limites strictes
    }

    /**
     * Applique les limites de déplacement
     */
    private _applyBounds(): void {
        if (!this._image) return;

        const scaledWidth = this._image.width * this._imageScale;
        const scaledHeight = this._image.height * this._imageScale;

        // L'image ne peut pas dépasser les bords du canvas
        const minX = this._canvasWidth - scaledWidth;  // Maximum vers la gauche
        const maxX = 0;                                 // Maximum vers la droite
        const minY = this._canvasHeight - scaledHeight; // Maximum vers le haut
        const maxY = 0;                                 // Maximum vers le bas

        this._imageX = Math.max(minX, Math.min(maxX, this._imageX));
        this._imageY = Math.max(minY, Math.min(maxY, this._imageY));
    }

    /**
     * Récupère l'état actuel du crop
     */
    getState(): CropState {
        return {
            imageX: this._imageX,
            imageY: this._imageY,
            imageScale: this._imageScale
        };
    }

    /**
     * Restaure un état de crop
     */
    setState(state: CropState): void {
        this._imageX = state.imageX;
        this._imageY = state.imageY;
        this._imageScale = state.imageScale;
    }

    /**
     * Récupère les coordonnées de crop dans l'image originale
     */
    getCropCoordinates(): CropCoordinates {
        if (!this._image) {
            return { x: 0, y: 0, width: this._canvasWidth, height: this._canvasHeight };
        }

        // Convertir les coordonnées canvas en coordonnées image originale
        const scaleRatio = 1 / this._imageScale;
        const x = Math.max(0, -this._imageX * scaleRatio);
        const y = Math.max(0, -this._imageY * scaleRatio);
        const width = Math.min(this._image.width, this._canvasWidth * scaleRatio);
        const height = Math.min(this._image.height, this._canvasHeight * scaleRatio);

        return { x, y, width, height };
    }

    /**
     * Dessine l'image sur le canvas
     */
    drawImage(ctx: CanvasRenderingContext2D): void {
        if (!this._image) return;

        const scaledWidth = this._image.width * this._imageScale;
        const scaledHeight = this._image.height * this._imageScale;

        ctx.drawImage(
            this._image,
            this._imageX,
            this._imageY,
            scaledWidth,
            scaledHeight
        );
    }

    /**
     * Dessine la grille de composition (règle des tiers)
     */
    drawGrid(ctx: CanvasRenderingContext2D): void {
        if (!this._showGrid) return;

        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;

        // Lignes verticales (règle des tiers)
        const thirdWidth = this._canvasWidth / 3;
        ctx.beginPath();
        ctx.moveTo(thirdWidth, 0);
        ctx.lineTo(thirdWidth, this._canvasHeight);
        ctx.moveTo(thirdWidth * 2, 0);
        ctx.lineTo(thirdWidth * 2, this._canvasHeight);
        ctx.stroke();

        // Lignes horizontales (règle des tiers)
        const thirdHeight = this._canvasHeight / 3;
        ctx.beginPath();
        ctx.moveTo(0, thirdHeight);
        ctx.lineTo(this._canvasWidth, thirdHeight);
        ctx.moveTo(0, thirdHeight * 2);
        ctx.lineTo(this._canvasWidth, thirdHeight * 2);
        ctx.stroke();

        ctx.restore();
    }

    /**
     * Active/désactive la grille
     */
    setGridVisible(visible: boolean): void {
        this._showGrid = visible;
    }

    /**
     * Récupère l'échelle minimale pour remplir le canvas
     */
    getMinScale(): number {
        if (!this._image) return 1;

        // Retourner l'échelle minimale qui permet de remplir le canvas
        // divisée par 0.9 pour correspondre à l'échelle initiale
        return Math.max(
            this._canvasWidth / this._image.width,
            this._canvasHeight / this._image.height
        ) * 0.9;
    }

    /**
     * Récupère l'échelle initiale (celle calculée au chargement)
     */
    getInitialScale(): number {
        if (!this._image) return 1;

        const imgRatio = this._image.width / this._image.height;
        const canvasRatio = this._canvasWidth / this._canvasHeight;

        if (imgRatio > canvasRatio) {
            return (this._canvasHeight / this._image.height) * 0.9;
        } else {
            return (this._canvasWidth / this._image.width) * 0.9;
        }
    }

    /**
     * Récupère l'image
     */
    getImage(): HTMLImageElement | null {
        return this._image;
    }

    /**
     * Récupère l'échelle actuelle
     */
    getScale(): number {
        return this._imageScale;
    }

    /**
     * Récupère la position X
     */
    getX(): number {
        return this._imageX;
    }

    /**
     * Récupère la position Y
     */
    getY(): number {
        return this._imageY;
    }

    /**
     * Réinitialise le crop
     */
    reset(): void {
        if (this._image) {
            this.calculateInitialPosition();
        }
    }

    /**
     * Nettoie le module
     */
    destroy(): void {
        this._image = null;
    }
}
