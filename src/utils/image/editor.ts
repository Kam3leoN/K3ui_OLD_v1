/**
 * @fileoverview ImageEditor pour K3UI
 * @description Éditeur d'images avancé avec modules de crop, zoom, rotation et conversion
 * @author K3UI Team
 * @version 1.0.0
 */

import {
    ImageEditorOptions,
    ImageEditorCallbacks,
    EditorState,
    ExportResult,
    ImageFormat,
    CropCoordinates
} from '../../types/base/image';
import {
    CropModule,
    ZoomModule,
    RotationModule,
    ConversionModule
} from './modules';

// ============================================================================
// CLASSE IMAGEEDITOR
// ============================================================================

/**
 * Éditeur d'images avancé
 * @description Orchestrateur des modules d'édition d'images
 */
export class ImageEditor {
    private _container: HTMLElement;
    private _width: number;
    private _height: number;
    private _callbacks: ImageEditorCallbacks;

    // Canvas et contexte
    private _canvas: HTMLCanvasElement;
    private _ctx: CanvasRenderingContext2D;

    // Image
    private _image: HTMLImageElement | null = null;
    private _originalFile: File | null = null;

    // Modules
    private _cropModule: CropModule;
    private _zoomModule: ZoomModule;
    private _rotationModule: RotationModule;
    private _conversionModule: ConversionModule;

    // Historique undo/redo
    private _history: EditorState[] = [];
    private _historyIndex: number = -1;
    private _maxHistorySize: number = 50;

    // État de drag
    private _isDragging: boolean = false;
    private _dragStartX: number = 0;
    private _dragStartY: number = 0;

    constructor(options: ImageEditorOptions & ImageEditorCallbacks) {
        if (!options.container) {
            throw new Error('ImageEditor: container is required');
        }

        this._container = options.container;
        this._width = options.width ?? 800;
        this._height = options.height ?? 600;

        this._callbacks = {
            onImageLoad: options.onImageLoad,
            onStateChange: options.onStateChange,
            onExport: options.onExport,
            onError: options.onError
        };

        // Initialiser les modules
        this._cropModule = new CropModule(options.crop);
        this._zoomModule = new ZoomModule({
            min: 0.1,
            max: 10,
            step: 0.1,
            wheelSensitivity: 0.1,
            ...options.zoom
        });
        this._rotationModule = new RotationModule(options.rotation);
        this._conversionModule = new ConversionModule(options.conversion);

        // Créer le canvas
        this._canvas = document.createElement('canvas');
        this._canvas.width = this._width;
        this._canvas.height = this._height;
        this._canvas.style.cursor = 'move';
        this._canvas.style.border = '2px solid var(--md-sys-color-outline)';
        this._canvas.style.borderRadius = '8px';
        this._canvas.style.display = 'block';

        const ctx = this._canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
            throw new Error('ImageEditor: Unable to get canvas context');
        }
        this._ctx = ctx;

        // Ajouter le canvas au conteneur
        this._container.innerHTML = '';
        this._container.appendChild(this._canvas);

        // Initialiser les modules avec les dimensions
        this._cropModule.initialize(this._width, this._height);

        // Configurer les événements
        this._setupEvents();
    }

    /**
     * Configure les événements souris et clavier
     */
    private _setupEvents(): void {
        // Événements souris
        this._canvas.addEventListener('mousedown', (e) => this._handleMouseDown(e));
        this._canvas.addEventListener('mousemove', (e) => this._handleMouseMove(e));
        this._canvas.addEventListener('mouseup', () => this._handleMouseUp());
        this._canvas.addEventListener('mouseleave', () => {
            this._handleMouseUp();
            this._canvas.style.cursor = 'move';
        });
        this._canvas.addEventListener('wheel', (e) => this._handleWheel(e), { passive: false });

        // Événements tactiles (touch)
        this._canvas.addEventListener('touchstart', (e) => this._handleTouchStart(e));
        this._canvas.addEventListener('touchmove', (e) => this._handleTouchMove(e));
        this._canvas.addEventListener('touchend', () => this._handleTouchEnd());
    }

    /**
     * Charge une image depuis un fichier
     */
    async loadImage(file: File): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!file.type.startsWith('image/')) {
                const error = new Error('Le fichier n\'est pas une image');
                this._callbacks.onError?.(error);
                reject(error);
                return;
            }

            this._originalFile = file;
            const reader = new FileReader();

            reader.onload = (e: ProgressEvent<FileReader>) => {
                if (!e.target || typeof e.target.result !== 'string') {
                    const error = new Error('Erreur lors de la lecture du fichier');
                    this._callbacks.onError?.(error);
                    reject(error);
                    return;
                }

                const img = new Image();

                img.onload = () => {
                    this._image = img;
                    this._cropModule.setImage(img);

                    // Définir l'échelle minimale et initiale pour le zoom
                    const minScale = this._cropModule.getMinScale();
                    const initialScale = this._cropModule.getInitialScale();
                    this._zoomModule.setMinScale(minScale);
                    // Initialiser le niveau de zoom avec l'échelle initiale du crop
                    this._zoomModule.setZoom(initialScale);

                    // Réinitialiser l'historique
                    this._history = [];
                    this._historyIndex = -1;

                    // Sauvegarder l'état initial
                    this._saveState();

                    // Rendre l'image
                    this._render();

                    this._callbacks.onImageLoad?.();
                    resolve();
                };

                img.onerror = () => {
                    const error = new Error('Erreur lors du chargement de l\'image');
                    this._callbacks.onError?.(error);
                    reject(error);
                };

                img.src = e.target.result;
            };

            reader.onerror = () => {
                const error = new Error('Erreur lors de la lecture du fichier');
                this._callbacks.onError?.(error);
                reject(error);
            };

            reader.readAsDataURL(file);
        });
    }

    // ============================================================================
    // GESTION DES ÉVÉNEMENTS
    // ============================================================================

    private _handleMouseDown(e: MouseEvent): void {
        if (!this._image) return;

        const rect = this._canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this._isDragging = true;
        this._dragStartX = x;
        this._dragStartY = y;
        this._canvas.style.cursor = 'grabbing';
    }

    private _handleMouseMove(e: MouseEvent): void {
        if (!this._isDragging || !this._image) return;

        const rect = this._canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;

        const deltaX = currentX - this._dragStartX;
        const deltaY = currentY - this._dragStartY;

        this._dragStartX = currentX;
        this._dragStartY = currentY;

        // Drag de l'image (crop)
        this._cropModule.handleDrag(deltaX, deltaY);

        this._render();
    }

    private _handleMouseUp(): void {
        if (this._isDragging) {
            this._isDragging = false;
            this._canvas.style.cursor = 'move';
            this._saveState();
        }
    }

    private _handleWheel(e: WheelEvent): void {
        if (!this._image) return;

        e.preventDefault();

        const rect = this._canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const currentScale = this._cropModule.getScale();
        const newZoomLevel = this._zoomModule.handleWheel(e.deltaY, mouseX, mouseY);

        // Calculer la nouvelle position après zoom
        const newPos = this._zoomModule.calculateNewPosition(
            this._cropModule.getX(),
            this._cropModule.getY(),
            currentScale,
            mouseX,
            mouseY
        );

        // Appliquer le nouveau zoom
        this._cropModule.setScale(newZoomLevel);
        this._cropModule.setPosition(newPos.x, newPos.y);

        this._render();
        this._saveState();
    }

    private _handleTouchStart(e: TouchEvent): void {
        if (!this._image || e.touches.length !== 1) return;

        e.preventDefault();
        const touch = e.touches[0];
        const rect = this._canvas.getBoundingClientRect();

        this._isDragging = true;
        this._dragStartX = touch.clientX - rect.left;
        this._dragStartY = touch.clientY - rect.top;
    }

    private _handleTouchMove(e: TouchEvent): void {
        if (!this._isDragging || !this._image || e.touches.length !== 1) return;

        e.preventDefault();
        const touch = e.touches[0];
        const rect = this._canvas.getBoundingClientRect();
        const currentX = touch.clientX - rect.left;
        const currentY = touch.clientY - rect.top;

        const deltaX = currentX - this._dragStartX;
        const deltaY = currentY - this._dragStartY;

        this._dragStartX = currentX;
        this._dragStartY = currentY;

        this._cropModule.handleDrag(deltaX, deltaY);
        this._render();
    }

    private _handleTouchEnd(): void {
        if (this._isDragging) {
            this._isDragging = false;
            this._saveState();
        }
    }

    // ============================================================================
    // API PUBLIQUE - ZOOM
    // ============================================================================

    zoomIn(): void {
        if (!this._image) return;
        this._zoomModule.zoomIn();
        this._cropModule.setScale(this._zoomModule.getZoomLevel());
        this._render();
        this._saveState();
    }

    zoomOut(): void {
        if (!this._image) return;
        this._zoomModule.zoomOut();
        this._cropModule.setScale(this._zoomModule.getZoomLevel());
        this._render();
        this._saveState();
    }

    setZoom(level: number): void {
        if (!this._image) return;
        this._zoomModule.setZoom(level);
        this._cropModule.setScale(level);
        this._render();
        this._saveState();
    }

    getZoomLevel(): number {
        return this._zoomModule.getZoomLevel();
    }

    fitToCanvas(): void {
        if (!this._image) return;

        // Récupérer l'échelle initiale et réinitialiser complètement
        const initialScale = this._cropModule.getInitialScale();
        this._zoomModule.resetToInitial();
        this._cropModule.reset();

        this._render();
        this._saveState();
    }

    // ============================================================================
    // API PUBLIQUE - ROTATION
    // ============================================================================

    rotate(angle: number): void {
        this._rotationModule.rotate(angle);
        this._render();
        this._saveState();
    }

    rotateBy(delta: number): void {
        this._rotationModule.rotateBy(delta);
        this._render();
        this._saveState();
    }

    rotate90(): void {
        this._rotationModule.rotate90();
        this._render();
        this._saveState();
    }

    rotate180(): void {
        this._rotationModule.rotate180();
        this._render();
        this._saveState();
    }

    rotate270(): void {
        this._rotationModule.rotate270();
        this._render();
        this._saveState();
    }

    flipHorizontal(): void {
        this._rotationModule.flipHorizontal();
        this._render();
        this._saveState();
    }

    flipVertical(): void {
        this._rotationModule.flipVertical();
        this._render();
        this._saveState();
    }

    flipBoth(): void {
        this._rotationModule.flipHorizontal();
        this._rotationModule.flipVertical();
        this._render();
        this._saveState();
    }

    getRotation(): number {
        return this._rotationModule.getRotation();
    }

    /**
     * Réinitialise la rotation à 0°
     */
    resetRotation(): void {
        this._rotationModule.rotate(0);
        this._render();
        this._saveState();
    }

    /**
     * Réinitialise les flips (horizontal et vertical)
     */
    resetFlip(): void {
        this._rotationModule.setFlipHorizontal(false);
        this._rotationModule.setFlipVertical(false);
        this._render();
        this._saveState();
    }

    // ============================================================================
    // API PUBLIQUE - CONVERSION
    // ============================================================================

    setFormat(format: ImageFormat): void {
        this._conversionModule.setFormat(format);
    }

    setQuality(quality: number): void {
        this._conversionModule.setQuality(quality);
    }

    getFormat(): ImageFormat {
        return this._conversionModule.getFormat();
    }

    getQuality(): number {
        return this._conversionModule.getQuality();
    }

    async estimateSize(): Promise<number> {
        const exportCanvas = await this._createExportCanvas();
        return this._conversionModule.estimateSize(exportCanvas);
    }

    // ============================================================================
    // RENDU
    // ============================================================================

    private _render(): void {
        if (!this._image) return;

        // Effacer le canvas
        this._ctx.clearRect(0, 0, this._width, this._height);

        // Appliquer les transformations de rotation
        this._rotationModule.applyTransform(this._ctx, this._width, this._height);

        // Dessiner l'image avec crop
        this._cropModule.drawImage(this._ctx);

        // Dessiner la grille
        this._cropModule.drawGrid(this._ctx);

        // Restaurer les transformations
        this._rotationModule.restoreTransform(this._ctx);

        // Notifier le changement d'état
        this._callbacks.onStateChange?.(this._getCurrentState());
    }

    // ============================================================================
    // HISTORIQUE
    // ============================================================================

    private _saveState(): void {
        if (!this._image) return;

        // Supprimer les états après l'index actuel (si on a fait undo)
        if (this._historyIndex < this._history.length - 1) {
            this._history = this._history.slice(0, this._historyIndex + 1);
        }

        // Ajouter le nouvel état
        this._history.push(this._getCurrentState());

        // Limiter la taille de l'historique
        if (this._history.length > this._maxHistorySize) {
            this._history.shift();
        } else {
            this._historyIndex++;
        }
    }

    private _getCurrentState(): EditorState {
        const imageData = this._ctx.getImageData(0, 0, this._width, this._height);

        return {
            imageData,
            cropState: this._cropModule.getState(),
            zoom: this._zoomModule.getZoomLevel(),
            rotation: this._rotationModule.getRotation(),
            format: this._conversionModule.getFormat(),
            quality: this._conversionModule.getQuality(),
            timestamp: Date.now()
        };
    }

    private _restoreState(state: EditorState): void {
        this._cropModule.setState(state.cropState);
        this._zoomModule.setZoom(state.zoom);
        this._rotationModule.rotate(state.rotation);
        this._conversionModule.setFormat(state.format);
        this._conversionModule.setQuality(state.quality);

        this._render();
    }

    undo(): void {
        if (!this.canUndo()) return;

        this._historyIndex--;
        this._restoreState(this._history[this._historyIndex]);
    }

    redo(): void {
        if (!this.canRedo()) return;

        this._historyIndex++;
        this._restoreState(this._history[this._historyIndex]);
    }

    canUndo(): boolean {
        return this._historyIndex > 0;
    }

    canRedo(): boolean {
        return this._historyIndex < this._history.length - 1;
    }

    // ============================================================================
    // EXPORT
    // ============================================================================

    private async _createExportCanvas(): Promise<HTMLCanvasElement> {
        const canvas = document.createElement('canvas');
        canvas.width = this._width;
        canvas.height = this._height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Impossible de créer le contexte canvas');
        }

        // Améliorer la qualité
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Appliquer les transformations de rotation
        this._rotationModule.applyTransform(ctx, this._width, this._height);

        // Dessiner l'image croppée
        this._cropModule.drawImage(ctx);

        // Restaurer les transformations
        this._rotationModule.restoreTransform(ctx);

        return canvas;
    }

    async export(): Promise<ExportResult> {
        if (!this._image) {
            throw new Error('Aucune image chargée');
        }

        try {
            const canvas = await this._createExportCanvas();
            const blob = await this._conversionModule.convert(canvas);
            const dataUrl = await this._conversionModule.convertToDataURL(canvas);

            const result: ExportResult = {
                blob,
                dataUrl,
                format: this._conversionModule.getFormat(),
                size: blob.size,
                width: this._width,
                height: this._height,
                quality: this._conversionModule.getQuality()
            };

            this._callbacks.onExport?.(result);
            return result;
        } catch (error) {
            console.error('[ImageEditor] Erreur export:', error);
            this._callbacks.onError?.(error as Error);
            throw error;
        }
    }

    // ============================================================================
    // UTILITAIRES
    // ============================================================================

    getCropCoordinates(): CropCoordinates {
        return this._cropModule.getCropCoordinates();
    }

    setGridVisible(visible: boolean): void {
        this._cropModule.setGridVisible(visible);
        this._render();
    }

    reset(): void {
        if (!this._image) return;

        this._cropModule.reset();
        this._zoomModule.reset();
        this._rotationModule.reset();
        this._conversionModule.reset();

        this._render();
        this._saveState();
    }

    getCanvas(): HTMLCanvasElement {
        return this._canvas;
    }

    getImage(): HTMLImageElement | null {
        return this._image;
    }

    destroy(): void {
        this._cropModule.destroy();
        this._zoomModule.destroy();
        this._rotationModule.destroy();
        this._conversionModule.destroy();

        this._canvas.remove();
        this._image = null;
        this._originalFile = null;
        this._history = [];
    }
}