/**
 * @fileoverview Utilitaire DropZone pour K3UI
 * @description Gestionnaire de drag-and-drop de fichiers/images avec validation et prévisualisation
 * @author K3UI Team
 * @version 1.0.0
 */

import { DropZoneOptions, DropZoneCallbacks, DropZoneFile } from '../../types/base/dom';
import type { Uploader } from '../upload/uploader';

// ============================================================================
// CLASSE DROPZONE
// ============================================================================

/**
 * Gestionnaire de drag-and-drop pour fichiers externes
 * @description Permet de déposer des fichiers/images sur une zone avec validation et prévisualisation
 */
export class DropZone {
    private _element: HTMLElement;
    private _accept: string;
    private _multiple: boolean;
    private _maxSize: number;
    private _maxFiles: number;
    private _disabled: boolean;
    private _showPreview: boolean;
    private _uploadOnDrop: boolean;
    private _uploader?: Uploader;
    private _autoUpload: boolean;

    private _callbacks: DropZoneCallbacks;
    private _files: DropZoneFile[] = [];
    private _fileInput?: HTMLInputElement;

    private _dragEnterHandler?: (e: DragEvent) => void;
    private _dragOverHandler?: (e: DragEvent) => void;
    private _dragLeaveHandler?: (e: DragEvent) => void;
    private _dropHandler?: (e: DragEvent) => void;
    private _clickHandler?: (e: MouseEvent) => void;
    private _dragCounter: number = 0;

    constructor(options: DropZoneOptions & DropZoneCallbacks) {
        if (!options.element) {
            console.error('[DropZone] element is required');
            throw new Error('DropZone: element is required');
        }

        this._element = options.element;
        this._accept = options.accept || '*/*';
        this._multiple = options.multiple ?? true;
        this._maxSize = options.maxSize ?? 10 * 1024 * 1024; // 10MB par défaut
        this._maxFiles = options.maxFiles ?? 10;
        this._disabled = options.disabled ?? false;
        this._showPreview = options.showPreview ?? true;
        this._uploadOnDrop = options.uploadOnDrop ?? false;
        this._uploader = options.uploader;
        this._autoUpload = options.autoUpload ?? false;

        this._callbacks = {
            onFilesAdded: options.onFilesAdded || null,
            onFilesRejected: options.onFilesRejected || null,
            onPreviewReady: options.onPreviewReady || null,
            onUploadReady: options.onUploadReady || null
        };

        // Créer l'input file caché
        this.createFileInput();

        // Attacher les événements
        if (!this._disabled) {
            this.attachEvents();
        }

        // Ajouter la classe dropzone si elle n'existe pas
        if (!this._element.classList.contains('dropzone')) {
            this._element.classList.add('dropzone');
        }

        // Si autoUpload, lancer l'upload après ajout
        if (this._autoUpload && this._uploader) {
            const originalOnFilesAdded = this._callbacks.onFilesAdded;
            this._callbacks.onFilesAdded = (files: File[]) => {
                originalOnFilesAdded?.(files);
                // Lancer l'upload automatiquement
                if (this._uploader && typeof this._uploader.uploadMultiple === 'function') {
                    this._uploader.uploadMultiple(files);
                }
            };
        }
    }

    /**
     * Crée un input file caché pour le fallback click
     */
    private createFileInput(): void {
        this._fileInput = document.createElement('input');
        this._fileInput.type = 'file';
        this._fileInput.accept = this._accept;
        this._fileInput.multiple = this._multiple;
        this._fileInput.style.display = 'none';

        this._fileInput.addEventListener('change', (e: Event) => {
            const target = e.target as HTMLInputElement;
            if (target.files && target.files.length > 0) {
                this.handleFiles(Array.from(target.files));
            }
        });

        this._element.appendChild(this._fileInput);
    }

    /**
     * Attache les gestionnaires d'événements
     */
    private attachEvents(): void {
        // Drag enter
        this._dragEnterHandler = this.handleDragEnter.bind(this);
        this._element.addEventListener('dragenter', this._dragEnterHandler);

        // Drag over
        this._dragOverHandler = this.handleDragOver.bind(this);
        this._element.addEventListener('dragover', this._dragOverHandler);

        // Drag leave
        this._dragLeaveHandler = this.handleDragLeave.bind(this);
        this._element.addEventListener('dragleave', this._dragLeaveHandler);

        // Drop
        this._dropHandler = this.handleDrop.bind(this);
        this._element.addEventListener('drop', this._dropHandler);

        // Click pour ouvrir le sélecteur de fichiers
        this._clickHandler = this.handleClick.bind(this);
        this._element.addEventListener('click', this._clickHandler);
    }

    /**
     * Détache les gestionnaires d'événements
     */
    private detachEvents(): void {
        if (this._dragEnterHandler) {
            this._element.removeEventListener('dragenter', this._dragEnterHandler);
        }
        if (this._dragOverHandler) {
            this._element.removeEventListener('dragover', this._dragOverHandler);
        }
        if (this._dragLeaveHandler) {
            this._element.removeEventListener('dragleave', this._dragLeaveHandler);
        }
        if (this._dropHandler) {
            this._element.removeEventListener('drop', this._dropHandler);
        }
        if (this._clickHandler) {
            this._element.removeEventListener('click', this._clickHandler);
        }
    }

    /**
     * Gère l'événement dragenter
     */
    private handleDragEnter(event: DragEvent): void {
        if (this._disabled) return;

        event.preventDefault();
        event.stopPropagation();

        this._dragCounter++;

        if (this._dragCounter === 1) {
            this._element.classList.add('dropzone--active');
        }
    }

    /**
     * Gère l'événement dragover
     */
    private handleDragOver(event: DragEvent): void {
        if (this._disabled) return;

        event.preventDefault();
        event.stopPropagation();

        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'copy';
        }
    }

    /**
     * Gère l'événement dragleave
     */
    private handleDragLeave(event: DragEvent): void {
        if (this._disabled) return;

        event.preventDefault();
        event.stopPropagation();

        this._dragCounter--;

        if (this._dragCounter === 0) {
            this._element.classList.remove('dropzone--active');
        }
    }

    /**
     * Gère l'événement drop
     */
    private handleDrop(event: DragEvent): void {
        if (this._disabled) return;

        event.preventDefault();
        event.stopPropagation();

        this._dragCounter = 0;
        this._element.classList.remove('dropzone--active');

        if (event.dataTransfer && event.dataTransfer.files.length > 0) {
            const files = Array.from(event.dataTransfer.files);
            this.handleFiles(files);
        }
    }

    /**
     * Gère le clic sur la zone (ouvre le sélecteur de fichiers)
     */
    private handleClick(event: MouseEvent): void {
        if (this._disabled) return;

        // Ne pas déclencher si on clique sur un bouton de suppression
        const target = event.target as HTMLElement;
        if (target.closest('.dropzone-preview__remove')) {
            return;
        }

        this._fileInput?.click();
    }

    /**
     * Traite les fichiers déposés ou sélectionnés
     */
    private handleFiles(files: File[]): void {
        const validFiles: File[] = [];
        const rejectedFiles: File[] = [];
        let rejectionReason = '';

        // Vérifier le nombre total de fichiers
        if (this._files.length + files.length > this._maxFiles) {
            rejectionReason = `Nombre maximum de fichiers dépassé (max: ${this._maxFiles})`;
            this._callbacks.onFilesRejected?.(files, rejectionReason);
            this.showInvalidFeedback();
            return;
        }

        // Valider chaque fichier
        for (const file of files) {
            const validation = this.validateFile(file);
            if (validation.valid) {
                validFiles.push(file);
            } else {
                rejectedFiles.push(file);
                rejectionReason = validation.reason || 'Fichier invalide';
            }
        }

        // Traiter les fichiers rejetés
        if (rejectedFiles.length > 0) {
            this._callbacks.onFilesRejected?.(rejectedFiles, rejectionReason);
            this.showInvalidFeedback();
        }

        // Traiter les fichiers valides
        if (validFiles.length > 0) {
            this.addFiles(validFiles);
            this._callbacks.onFilesAdded?.(validFiles);

            // Upload immédiat si activé
            if (this._uploadOnDrop) {
                this._callbacks.onUploadReady?.(validFiles);
            }
        }
    }

    /**
     * Valide un fichier
     */
    private validateFile(file: File): { valid: boolean; reason?: string } {
        // Vérifier la taille
        if (file.size > this._maxSize) {
            return {
                valid: false,
                reason: `Fichier trop volumineux (max: ${this.formatFileSize(this._maxSize)})`
            };
        }

        // Vérifier le type MIME
        if (this._accept !== '*/*') {
            const acceptTypes = this._accept.split(',').map(t => t.trim());
            const isValid = acceptTypes.some(acceptType => {
                if (acceptType.startsWith('.')) {
                    // Extension de fichier
                    return file.name.toLowerCase().endsWith(acceptType.toLowerCase());
                } else if (acceptType.endsWith('/*')) {
                    // Type MIME avec wildcard (ex: image/*)
                    const typePrefix = acceptType.slice(0, -2);
                    return file.type.startsWith(typePrefix);
                } else {
                    // Type MIME exact
                    return file.type === acceptType;
                }
            });

            if (!isValid) {
                return {
                    valid: false,
                    reason: `Type de fichier non accepté (accepté: ${this._accept})`
                };
            }
        }

        return { valid: true };
    }

    /**
     * Ajoute des fichiers à la liste
     */
    private addFiles(files: File[]): void {
        for (const file of files) {
            const dropZoneFile: DropZoneFile = {
                file,
                status: 'pending'
            };

            this._files.push(dropZoneFile);

            // Générer la preview pour les images
            if (this._showPreview && file.type.startsWith('image/')) {
                this.generatePreview(dropZoneFile);
            } else {
                dropZoneFile.status = 'ready';
            }
        }
    }

    /**
     * Génère une prévisualisation pour une image
     */
    private generatePreview(dropZoneFile: DropZoneFile): void {
        const reader = new FileReader();

        reader.onload = (e: ProgressEvent<FileReader>) => {
            if (e.target && typeof e.target.result === 'string') {
                dropZoneFile.preview = e.target.result;
                dropZoneFile.status = 'ready';
                this._callbacks.onPreviewReady?.(dropZoneFile.file, e.target.result);
            }
        };

        reader.onerror = () => {
            console.error('[DropZone] Erreur lors de la génération de la preview');
            dropZoneFile.status = 'error';
        };

        reader.readAsDataURL(dropZoneFile.file);
    }

    /**
     * Affiche un feedback visuel d'erreur
     */
    private showInvalidFeedback(): void {
        this._element.classList.add('dropzone--invalid');
        setTimeout(() => {
            this._element.classList.remove('dropzone--invalid');
        }, 1000);
    }

    /**
     * Formate une taille de fichier en format lisible
     */
    private formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Récupère la liste des fichiers
     */
    getFiles(): DropZoneFile[] {
        return this._files;
    }

    /**
     * Récupère uniquement les objets File natifs
     */
    getNativeFiles(): File[] {
        return this._files.map(f => f.file);
    }

    /**
     * Confirme et déclenche l'upload
     */
    confirm(): void {
        const readyFiles = this._files.filter(f => f.status === 'ready' || f.status === 'pending');
        if (readyFiles.length > 0) {
            const files = readyFiles.map(f => f.file);

            // Si uploader configuré, lancer l'upload
            if (this._uploader && typeof this._uploader.uploadMultiple === 'function') {
                this._uploader.uploadMultiple(files);
            } else {
                // Sinon, appeler le callback comme avant
                this._callbacks.onUploadReady?.(files);
            }
        }
    }

    /**
     * Supprime un fichier par index
     */
    removeFile(index: number): void {
        if (index >= 0 && index < this._files.length) {
            this._files.splice(index, 1);
        }
    }

    /**
     * Supprime tous les fichiers
     */
    clear(): void {
        this._files = [];
        if (this._fileInput) {
            this._fileInput.value = '';
        }
    }

    /**
     * Active/désactive la zone de dépôt
     */
    setEnabled(enabled: boolean): void {
        const shouldBeDisabled = !enabled;
        if (this._disabled !== shouldBeDisabled) {
            this._disabled = shouldBeDisabled;
            if (enabled) {
                this.attachEvents();
                this._element.classList.remove('dropzone--disabled');
            } else {
                this.detachEvents();
                this._element.classList.add('dropzone--disabled');
            }
        }
    }

    /**
     * Met à jour les options
     */
    updateOptions(options: Partial<DropZoneOptions & DropZoneCallbacks>): void {
        if (options.accept !== undefined) {
            this._accept = options.accept;
            if (this._fileInput) {
                this._fileInput.accept = this._accept;
            }
        }
        if (options.multiple !== undefined) {
            this._multiple = options.multiple;
            if (this._fileInput) {
                this._fileInput.multiple = this._multiple;
            }
        }
        if (options.maxSize !== undefined) {
            this._maxSize = options.maxSize;
        }
        if (options.maxFiles !== undefined) {
            this._maxFiles = options.maxFiles;
        }
        if (options.disabled !== undefined) {
            this.setEnabled(!options.disabled);
        }
        if (options.showPreview !== undefined) {
            this._showPreview = options.showPreview;
        }
        if (options.uploadOnDrop !== undefined) {
            this._uploadOnDrop = options.uploadOnDrop;
        }

        // Mettre à jour les callbacks
        Object.assign(this._callbacks, options);
    }

    /**
     * Nettoie les ressources
     */
    destroy(): void {
        this.detachEvents();
        this.clear();

        if (this._fileInput) {
            this._fileInput.remove();
            this._fileInput = undefined;
        }

        this._element.classList.remove('dropzone', 'dropzone--active', 'dropzone--invalid', 'dropzone--disabled');
    }
}
