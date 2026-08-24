/**
 * @fileoverview Utilitaire Uploader pour K3UI
 * @description Gestionnaire d'upload avec chunking, retry et progression
 * @author K3UI Team
 * @version 1.0.0
 */

import { UploaderOptions, UploaderCallbacks, UploadTask, ChunkInfo } from '../../types/base/upload';
import { FileChunker } from './chunker';
import { ThumbnailGenerator } from './thumbnail';
import { generateGuid } from '../helpers/guid';

// ============================================================================
// CLASSE UPLOADER
// ============================================================================

/**
 * Gestionnaire d'upload de fichiers
 * @description Upload automatique avec chunking, retry et barre de progression
 */
export class Uploader {
    private _url: string;
    private _method: 'POST' | 'PUT';
    private _headers: Record<string, string>;
    private _chunkSize: number;
    private _maxRetries: number;
    private _retryDelay: number;
    private _maxRetryDelay: number;
    private _parallel: boolean;
    private _maxParallel: number;
    private _withCredentials: boolean;
    private _thumbnailMaxWidth: number;
    private _thumbnailMaxHeight: number;
    private _thumbnailQuality: number;
    private _generateThumbnails: boolean;

    private _callbacks: UploaderCallbacks;
    private _tasks: Map<string, UploadTask> = new Map();
    private _abortControllers: Map<string, AbortController> = new Map();

    constructor(options: UploaderOptions & UploaderCallbacks) {
        if (!options.url) {
            console.error('[Uploader] url is required');
            throw new Error('Uploader: url is required');
        }

        this._url = options.url;
        this._method = options.method || 'POST';
        this._headers = options.headers || {};
        this._chunkSize = options.chunkSize || 5 * 1024 * 1024; // 5MB
        this._maxRetries = options.maxRetries ?? 3;
        this._retryDelay = options.retryDelay ?? 1000;
        this._maxRetryDelay = options.maxRetryDelay ?? 30000;
        this._parallel = options.parallel ?? false;
        this._maxParallel = options.maxParallel ?? 3;
        this._withCredentials = options.withCredentials ?? false;
        this._thumbnailMaxWidth = options.thumbnailMaxWidth ?? 200;
        this._thumbnailMaxHeight = options.thumbnailMaxHeight ?? 200;
        this._thumbnailQuality = options.thumbnailQuality ?? 0.8;
        this._generateThumbnails = options.generateThumbnails ?? true;

        this._callbacks = {
            onProgress: options.onProgress,
            onChunkProgress: options.onChunkProgress,
            onSuccess: options.onSuccess,
            onError: options.onError,
            onRetry: options.onRetry,
            onThumbnailGenerated: options.onThumbnailGenerated
        };
    }

    /**
     * Upload un fichier
     * @param file - Fichier à uploader
     * @returns Promise avec la réponse du serveur
     */
    async upload(file: File): Promise<unknown> {
        const taskId = generateGuid();

        // Créer la tâche
        const task: UploadTask = {
            id: taskId,
            file,
            status: 'pending',
            progress: 0,
            loaded: 0,
            total: file.size,
            chunks: []
        };

        this._tasks.set(taskId, task);

        try {
            // Générer le thumbnail si c'est une image
            if (this._generateThumbnails && file.type.startsWith('image/')) {
                try {
                    const thumbnail = await ThumbnailGenerator.generate(
                        file,
                        this._thumbnailMaxWidth,
                        this._thumbnailMaxHeight,
                        this._thumbnailQuality
                    );
                    task.thumbnail = thumbnail.blob;
                    task.thumbnailDataUrl = thumbnail.dataUrl;
                    this._callbacks.onThumbnailGenerated?.(thumbnail.blob, thumbnail.dataUrl);
                } catch (error) {
                    console.warn('[Uploader] Erreur génération thumbnail', error);
                }
            }

            // Déterminer si on a besoin de chunking
            const needsChunking = FileChunker.needsChunking(file.size, this._chunkSize);

            if (needsChunking) {
                return await this.uploadChunked(task);
            } else {
                return await this.uploadDirect(task);
            }
        } catch (error) {
            task.status = 'error';
            task.error = error as Error;
            this._callbacks.onError?.(error as Error);
            throw error;
        }
    }

    /**
     * Upload plusieurs fichiers
     * @param files - Liste de fichiers
     * @returns Promise avec les réponses du serveur
     */
    async uploadMultiple(files: File[]): Promise<unknown[]> {
        const promises = files.map(file => this.upload(file));
        return Promise.all(promises);
    }

    /**
     * Upload direct (fichier complet)
     * @param task - Tâche d'upload
     * @returns Réponse du serveur
     */
    private async uploadDirect(task: UploadTask): Promise<unknown> {
        task.status = 'uploading';

        const formData = new FormData();
        formData.append('file', task.file);
        formData.append('fileName', task.file.name);
        formData.append('fileSize', task.file.size.toString());
        formData.append('fileType', task.file.type);

        // Créer AbortController
        const abortController = new AbortController();
        this._abortControllers.set(task.id, abortController);

        try {
            const response = await fetch(this._url, {
                method: this._method,
                headers: this._headers,
                body: formData,
                credentials: this._withCredentials ? 'include' : 'same-origin',
                signal: abortController.signal
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }

            const data = await response.json();

            task.status = 'completed';
            task.progress = 100;
            task.loaded = task.total;
            this._callbacks.onProgress?.(100, task.total, task.total);
            this._callbacks.onSuccess?.(data);

            return data;
        } finally {
            this._abortControllers.delete(task.id);
        }
    }

    /**
     * Upload en chunks
     * @param task - Tâche d'upload
     * @returns Réponse du serveur
     */
    private async uploadChunked(task: UploadTask): Promise<unknown> {
        task.status = 'uploading';

        // Diviser en chunks
        task.chunks = FileChunker.split(task.file, this._chunkSize);

        if (this._parallel) {
            return await this.uploadChunksParallel(task);
        } else {
            return await this.uploadChunksSequential(task);
        }
    }

    /**
     * Upload des chunks séquentiellement
     * @param task - Tâche d'upload
     * @returns Réponse du serveur
     */
    private async uploadChunksSequential(task: UploadTask): Promise<unknown> {
        for (const chunk of task.chunks) {
            await this.uploadChunk(task, chunk);
        }

        return this.finalizeUpload(task);
    }

    /**
     * Upload des chunks en parallèle
     * @param task - Tâche d'upload
     * @returns Réponse du serveur
     */
    private async uploadChunksParallel(task: UploadTask): Promise<unknown> {
        const pendingChunks = [...task.chunks];
        const uploading: Promise<void>[] = [];

        while (pendingChunks.length > 0 || uploading.length > 0) {
            // Lancer autant de chunks que possible en parallèle
            while (pendingChunks.length > 0 && uploading.length < this._maxParallel) {
                const chunk = pendingChunks.shift()!;
                const promise = this.uploadChunk(task, chunk);
                uploading.push(promise);
            }

            // Attendre qu'au moins un chunk se termine
            if (uploading.length > 0) {
                await Promise.race(uploading);
                // Retirer les promises terminées
                for (let i = uploading.length - 1; i >= 0; i--) {
                    const isSettled = await Promise.race([
                        uploading[i].then(() => true),
                        Promise.resolve(false)
                    ]);
                    if (isSettled) {
                        uploading.splice(i, 1);
                    }
                }
            }
        }

        return this.finalizeUpload(task);
    }

    /**
     * Upload un chunk avec retry
     * @param task - Tâche parente
     * @param chunk - Chunk à uploader
     */
    private async uploadChunk(task: UploadTask, chunk: ChunkInfo): Promise<void> {
        let attempt = 0;

        while (attempt <= this._maxRetries) {
            try {
                chunk.status = 'uploading';

                const formData = new FormData();
                formData.append('chunk', chunk.blob!);
                formData.append('chunkIndex', chunk.index.toString());
                formData.append('totalChunks', task.chunks.length.toString());
                formData.append('fileId', task.id);
                formData.append('fileName', task.file.name);
                formData.append('fileSize', task.file.size.toString());
                formData.append('fileType', task.file.type);

                // Créer AbortController pour ce chunk
                const abortController = new AbortController();
                this._abortControllers.set(`${task.id}-${chunk.index}`, abortController);

                const response = await fetch(this._url, {
                    method: this._method,
                    headers: this._headers,
                    body: formData,
                    credentials: this._withCredentials ? 'include' : 'same-origin',
                    signal: abortController.signal
                });

                this._abortControllers.delete(`${task.id}-${chunk.index}`);

                if (!response.ok) {
                    throw new Error(`Chunk ${chunk.index} upload failed: ${response.statusText}`);
                }

                chunk.status = 'completed';
                this.updateProgress(task);
                this._callbacks.onChunkProgress?.(chunk.index, 100);

                return;
            } catch (error) {
                attempt++;
                chunk.retries = attempt;

                if (attempt > this._maxRetries) {
                    chunk.status = 'error';
                    throw error;
                }

                // Exponential backoff
                const delay = Math.min(
                    this._retryDelay * Math.pow(2, attempt - 1),
                    this._maxRetryDelay
                );

                this._callbacks.onRetry?.(attempt, delay);
                console.warn(`[Uploader] Retry chunk ${chunk.index}, attempt ${attempt}, delay ${delay}ms`);

                await this.sleep(delay);
            }
        }
    }

    /**
     * Finalise l'upload (tous les chunks sont uploadés)
     * @param task - Tâche d'upload
     * @returns Réponse du serveur
     */
    private async finalizeUpload(task: UploadTask): Promise<unknown> {
        task.status = 'completed';
        task.progress = 100;

        // Appeler le callback de succès
        const response = { success: true, fileId: task.id, fileName: task.file.name };
        this._callbacks.onSuccess?.(response);

        return response;
    }

    /**
     * Met à jour la progression globale
     * @param task - Tâche d'upload
     */
    private updateProgress(task: UploadTask): void {
        const progress = FileChunker.getProgress(task.chunks);
        task.progress = progress.percentage;
        task.loaded = progress.bytesUploaded;

        this._callbacks.onProgress?.(
            progress.percentage,
            progress.bytesUploaded,
            progress.bytesTotal
        );
    }

    /**
     * Pause un upload
     * @param taskId - ID de la tâche
     */
    pause(taskId: string): void {
        const task = this._tasks.get(taskId);
        if (task && task.status === 'uploading') {
            task.status = 'paused';

            // Annuler toutes les requêtes en cours
            for (const [key, controller] of this._abortControllers.entries()) {
                if (key.startsWith(taskId)) {
                    controller.abort();
                    this._abortControllers.delete(key);
                }
            }
        }
    }

    /**
     * Resume un upload
     * @param taskId - ID de la tâche
     */
    async resume(taskId: string): Promise<unknown> {
        const task = this._tasks.get(taskId);
        if (task && task.status === 'paused') {
            task.status = 'uploading';

            // Réinitialiser les chunks en erreur
            FileChunker.resetErrorChunks(task.chunks);

            // Reprendre l'upload
            if (this._parallel) {
                return await this.uploadChunksParallel(task);
            } else {
                return await this.uploadChunksSequential(task);
            }
        }
    }

    /**
     * Annule un upload
     * @param taskId - ID de la tâche
     */
    cancel(taskId: string): void {
        const task = this._tasks.get(taskId);
        if (task) {
            task.status = 'error';
            task.error = new Error('Upload cancelled');

            // Annuler toutes les requêtes en cours
            for (const [key, controller] of this._abortControllers.entries()) {
                if (key.startsWith(taskId)) {
                    controller.abort();
                    this._abortControllers.delete(key);
                }
            }

            this._tasks.delete(taskId);
        }
    }

    /**
     * Récupère toutes les tâches
     * @returns Liste des tâches
     */
    getTasks(): UploadTask[] {
        return Array.from(this._tasks.values());
    }

    /**
     * Récupère une tâche par ID
     * @param taskId - ID de la tâche
     * @returns Tâche ou undefined
     */
    getTask(taskId: string): UploadTask | undefined {
        return this._tasks.get(taskId);
    }

    /**
     * Attend un délai
     * @param ms - Délai en millisecondes
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
