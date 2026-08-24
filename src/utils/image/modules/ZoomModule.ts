/**
 * @fileoverview Module de zoom pour ImageEditor
 * @description Gestion du zoom avec contrôles avancés
 * @author K3UI Team
 * @version 1.0.0
 */

import { ZoomModuleOptions, ZoomState } from '../../../types/base/image';

// ============================================================================
// CLASSE ZOOMMODULE
// ============================================================================

/**
 * Module de gestion du zoom
 * @description Gère le zoom avec contrôles slider, boutons et molette
 */
export class ZoomModule {
    private _min: number;
    private _max: number;
    private _step: number;
    private _wheelSensitivity: number;
    private _showSlider: boolean;
    private _showPercentage: boolean;

    // État du zoom
    private _level: number = 1;
    private _focalX: number = 0;
    private _focalY: number = 0;

    // Limites dynamiques
    private _minScale: number = 1;

    constructor(options: ZoomModuleOptions = {}) {
        this._min = 0.1;  // Minimum absolu à 10%
        this._max = options.max ?? 10;    // Permettre de zoomer jusqu'à 1000%
        this._step = options.step ?? 0.1;
        this._wheelSensitivity = options.wheelSensitivity ?? 0.1; // 10% par cran de molette
        this._showSlider = options.showSlider ?? false;
        this._showPercentage = options.showPercentage ?? false;
    }

    /**
     * Définit l'échelle minimale (basée sur l'image et le canvas)
     */
    setMinScale(minScale: number): void {
        this._minScale = minScale;
        // Ajuster le niveau actuel si nécessaire
        if (this._level < this._minScale) {
            this._level = this._minScale;
        }
    }

    /**
     * Zoom avant
     */
    zoomIn(): void {
        const currentLevel = this._level;
        // Calcul du nouveau niveau : +10% du niveau actuel
        const increment = currentLevel * 0.1;
        const newLevel = currentLevel + increment;
        this.setZoom(newLevel);
    }

    /**
     * Zoom arrière
     */
    zoomOut(): void {
        const currentLevel = this._level;
        // Calcul du nouveau niveau : -10% du niveau actuel
        const decrement = currentLevel * 0.1;
        const newLevel = currentLevel - decrement;
        this.setZoom(newLevel);
    }

    /**
     * Définit le niveau de zoom
     */
    setZoom(level: number, focalX?: number, focalY?: number): void {
        // Appliquer les limites
        const effectiveMin = Math.max(this._min, this._minScale);
        const clampedLevel = Math.max(effectiveMin, Math.min(this._max, level));

        if (clampedLevel === this._level) return;

        this._level = clampedLevel;

        // Mettre à jour le point focal si fourni
        if (focalX !== undefined) this._focalX = focalX;
        if (focalY !== undefined) this._focalY = focalY;
    }

    /**
     * Gère le zoom avec la molette
     */
    handleWheel(deltaY: number, mouseX: number, mouseY: number): number {
        // Calculer le facteur de zoom : ±10% du niveau actuel
        const currentLevel = this._level;
        const zoomFactor = deltaY > 0 ? 0.9 : 1.1; // -10% ou +10%
        const newLevel = currentLevel * zoomFactor;

        // Mettre à jour le point focal
        this._focalX = mouseX;
        this._focalY = mouseY;

        // Appliquer le zoom
        const effectiveMin = Math.max(this._min, this._minScale);
        const clampedLevel = Math.max(effectiveMin, Math.min(this._max, newLevel));

        if (clampedLevel === this._level) return this._level;

        this._level = clampedLevel;
        return this._level;
    }

    /**
     * Ajuste le zoom pour que l'image remplisse le canvas
     */
    fitToCanvas(): void {
        this._level = this._minScale;
        this._focalX = 0;
        this._focalY = 0;
    }

    /**
     * Réinitialise le zoom à l'échelle initiale
     */
    resetToInitial(): void {
        this._level = this._minScale;
        this._focalX = 0;
        this._focalY = 0;
    }

    /**
     * Récupère le niveau de zoom actuel
     */
    getZoomLevel(): number {
        return this._level;
    }

    /**
     * Récupère le niveau de zoom en pourcentage
     */
    getZoomPercentage(): number {
        return Math.round(this._level * 100);
    }

    /**
     * Récupère le point focal
     */
    getFocalPoint(): { x: number; y: number } {
        return { x: this._focalX, y: this._focalY };
    }

    /**
     * Récupère l'état du zoom
     */
    getState(): ZoomState {
        return {
            level: this._level,
            focalX: this._focalX,
            focalY: this._focalY
        };
    }

    /**
     * Restaure un état de zoom
     */
    setState(state: ZoomState): void {
        this._level = state.level;
        this._focalX = state.focalX;
        this._focalY = state.focalY;
    }

    /**
     * Vérifie si on peut zoomer davantage
     */
    canZoomIn(): boolean {
        return this._level < this._max;
    }

    /**
     * Vérifie si on peut dézoomer davantage
     */
    canZoomOut(): boolean {
        const effectiveMin = Math.max(this._min, this._minScale);
        return this._level > effectiveMin;
    }

    /**
     * Récupère les limites de zoom
     */
    getLimits(): { min: number; max: number } {
        const effectiveMin = Math.max(this._min, this._minScale);
        return { min: effectiveMin, max: this._max };
    }

    /**
     * Calcule la nouvelle position après zoom
     */
    calculateNewPosition(
        currentX: number,
        currentY: number,
        currentScale: number,
        mouseX: number,
        mouseY: number
    ): { x: number; y: number } {
        // Calculer la position relative à l'image avant zoom
        const relativeX = (mouseX - currentX) / currentScale;
        const relativeY = (mouseY - currentY) / currentScale;

        // Calculer la nouvelle position pour garder le point sous la souris
        const newX = mouseX - relativeX * this._level;
        const newY = mouseY - relativeY * this._level;

        return { x: newX, y: newY };
    }

    /**
     * Réinitialise le zoom
     */
    reset(): void {
        this._level = this._minScale;
        this._focalX = 0;
        this._focalY = 0;
    }

    /**
     * Récupère les options d'affichage
     */
    getDisplayOptions(): { showSlider: boolean; showPercentage: boolean } {
        return {
            showSlider: this._showSlider,
            showPercentage: this._showPercentage
        };
    }

    /**
     * Nettoie le module
     */
    destroy(): void {
        // Rien à nettoyer pour ce module
    }
}
