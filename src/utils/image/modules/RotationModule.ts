/**
 * @fileoverview Module de rotation pour ImageEditor
 * @description Gestion de la rotation à 360° et des flips
 * @author K3UI Team
 * @version 1.0.0
 */

import { RotationModuleOptions, RotationState } from '../../../types/base/image';

// ============================================================================
// CLASSE ROTATIONMODULE
// ============================================================================

/**
 * Module de gestion de la rotation
 * @description Gère la rotation libre, les raccourcis et les flips
 */
export class RotationModule {
    private _allowFreeRotation: boolean;
    private _showRotationInput: boolean;
    private _showQuickButtons: boolean;
    private _snapToAngle: number;
    private _showAngleIndicator: boolean;

    // État de la rotation
    private _angle: number = 0;
    private _flipH: boolean = false;
    private _flipV: boolean = false;

    constructor(options: RotationModuleOptions = {}) {
        this._allowFreeRotation = options.allowFreeRotation ?? true;
        this._showRotationInput = options.showRotationInput ?? false;
        this._showQuickButtons = options.showQuickButtons ?? false;
        this._snapToAngle = options.snapToAngle ?? 0;
        this._showAngleIndicator = options.showAngleIndicator ?? false;
    }

    /**
     * Définit l'angle de rotation absolu (0-360°)
     */
    rotate(angle: number): void {
        // Normaliser l'angle entre 0 et 360
        let normalized = angle % 360;
        if (normalized < 0) normalized += 360;

        // Appliquer le magnétisme si activé
        if (this._snapToAngle > 0) {
            normalized = Math.round(normalized / this._snapToAngle) * this._snapToAngle;
        }

        this._angle = normalized;
    }

    /**
     * Rotation relative (ajoute un delta à l'angle actuel)
     */
    rotateBy(delta: number): void {
        const newAngle = this._angle + delta;
        this.rotate(newAngle);
    }

    /**
     * Rotation de 90° dans le sens horaire
     */
    rotate90(): void {
        this.rotate(this._angle + 90);
    }

    /**
     * Rotation de 180°
     */
    rotate180(): void {
        this.rotate(this._angle + 180);
    }

    /**
     * Rotation de 270° (ou -90°)
     */
    rotate270(): void {
        this.rotate(this._angle + 270);
    }

    /**
     * Rotation de -90° dans le sens antihoraire
     */
    rotateMinus90(): void {
        this.rotate(this._angle - 90);
    }

    /**
     * Flip horizontal
     */
    flipHorizontal(): void {
        this._flipH = !this._flipH;
    }

    /**
     * Flip vertical
     */
    flipVertical(): void {
        this._flipV = !this._flipV;
    }

    /**
     * Définit l'état du flip horizontal
     */
    setFlipHorizontal(flip: boolean): void {
        this._flipH = flip;
    }

    /**
     * Définit l'état du flip vertical
     */
    setFlipVertical(flip: boolean): void {
        this._flipV = flip;
    }

    /**
     * Récupère l'angle de rotation actuel (0-360°)
     */
    getRotation(): number {
        return this._angle;
    }

    /**
     * Récupère l'angle en radians
     */
    getRotationRadians(): number {
        return (this._angle * Math.PI) / 180;
    }

    /**
     * Vérifie si le flip horizontal est actif
     */
    isFlippedHorizontal(): boolean {
        return this._flipH;
    }

    /**
     * Vérifie si le flip vertical est actif
     */
    isFlippedVertical(): boolean {
        return this._flipV;
    }

    /**
     * Récupère l'état de la rotation
     */
    getState(): RotationState {
        return {
            angle: this._angle,
            flipH: this._flipH,
            flipV: this._flipV
        };
    }

    /**
     * Restaure un état de rotation
     */
    setState(state: RotationState): void {
        this._angle = state.angle;
        this._flipH = state.flipH;
        this._flipV = state.flipV;
    }

    /**
     * Applique les transformations de rotation au contexte canvas
     */
    applyTransform(
        ctx: CanvasRenderingContext2D,
        canvasWidth: number,
        canvasHeight: number
    ): void {
        // Sauvegarder l'état du contexte
        ctx.save();

        // Déplacer l'origine au centre du canvas
        ctx.translate(canvasWidth / 2, canvasHeight / 2);

        // Appliquer la rotation
        if (this._angle !== 0) {
            ctx.rotate(this.getRotationRadians());
        }

        // Appliquer les flips
        const scaleX = this._flipH ? -1 : 1;
        const scaleY = this._flipV ? -1 : 1;
        if (scaleX !== 1 || scaleY !== 1) {
            ctx.scale(scaleX, scaleY);
        }

        // Replacer l'origine au coin supérieur gauche
        ctx.translate(-canvasWidth / 2, -canvasHeight / 2);
    }

    /**
     * Restaure le contexte canvas après transformation
     */
    restoreTransform(ctx: CanvasRenderingContext2D): void {
        ctx.restore();
    }

    /**
     * Calcule les dimensions du canvas après rotation
     * @description Utile pour calculer la taille nécessaire pour contenir l'image tournée
     */
    calculateRotatedDimensions(width: number, height: number): { width: number; height: number } {
        const radians = this.getRotationRadians();
        const cos = Math.abs(Math.cos(radians));
        const sin = Math.abs(Math.sin(radians));

        const newWidth = width * cos + height * sin;
        const newHeight = width * sin + height * cos;

        return {
            width: Math.ceil(newWidth),
            height: Math.ceil(newHeight)
        };
    }

    /**
     * Réinitialise la rotation
     */
    reset(): void {
        this._angle = 0;
        this._flipH = false;
        this._flipV = false;
    }

    /**
     * Récupère les options d'affichage
     */
    getDisplayOptions(): {
        allowFreeRotation: boolean;
        showRotationInput: boolean;
        showQuickButtons: boolean;
        showAngleIndicator: boolean;
    } {
        return {
            allowFreeRotation: this._allowFreeRotation,
            showRotationInput: this._showRotationInput,
            showQuickButtons: this._showQuickButtons,
            showAngleIndicator: this._showAngleIndicator
        };
    }

    /**
     * Vérifie si une rotation est appliquée
     */
    hasRotation(): boolean {
        return this._angle !== 0 || this._flipH || this._flipV;
    }

    /**
     * Nettoie le module
     */
    destroy(): void {
        // Rien à nettoyer pour ce module
    }
}
