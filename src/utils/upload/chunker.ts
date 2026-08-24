/**
 * @fileoverview Gestionnaire de chunks pour K3UI
 * @description Utilitaire pour diviser des fichiers en chunks pour l'upload
 * @author K3UI Team
 * @version 1.0.0
 */

import { ChunkInfo } from '../../types/base/upload';

// ============================================================================
// CLASSE FILECHUNKER
// ============================================================================

/**
 * Gestionnaire de chunks pour gros fichiers
 * @description Divise les fichiers en morceaux pour l'upload progressif
 */
export class FileChunker {
    /**
     * Divise un fichier en chunks
     * @param file - Fichier à diviser
     * @param chunkSize - Taille de chaque chunk en octets
     * @returns Liste des chunks
     */
    static split(file: File, chunkSize: number): ChunkInfo[] {
        const chunks: ChunkInfo[] = [];
        const totalChunks = Math.ceil(file.size / chunkSize);

        // FileChunker: Division de ${file.name} (${file.size} bytes) en ${totalChunks} chunks

        for (let i = 0; i < totalChunks; i++) {
            const start = i * chunkSize;
            const end = Math.min(start + chunkSize, file.size);

            chunks.push({
                index: i,
                start,
                end,
                size: end - start,
                status: 'pending',
                retries: 0,
                blob: file.slice(start, end)
            });
        }

        return chunks;
    }

    /**
     * Vérifie si un fichier nécessite d'être divisé en chunks
     * @param fileSize - Taille du fichier en octets
     * @param chunkSize - Taille limite d'un chunk
     * @returns True si le fichier doit être divisé
     */
    static needsChunking(fileSize: number, chunkSize: number): boolean {
        return fileSize > chunkSize;
    }

    /**
     * Calcule le nombre total de chunks pour un fichier
     * @param fileSize - Taille du fichier en octets
     * @param chunkSize - Taille de chaque chunk
     * @returns Nombre de chunks
     */
    static getTotalChunks(fileSize: number, chunkSize: number): number {
        return Math.ceil(fileSize / chunkSize);
    }

    /**
     * Formate la progression des chunks
     * @param chunks - Liste des chunks
     * @returns Statistiques de progression
     */
    static getProgress(chunks: ChunkInfo[]): {
        completed: number;
        total: number;
        percentage: number;
        bytesUploaded: number;
        bytesTotal: number;
    } {
        const completed = chunks.filter(c => c.status === 'completed').length;
        const total = chunks.length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        const bytesUploaded = chunks
            .filter(c => c.status === 'completed')
            .reduce((sum, c) => sum + c.size, 0);

        const bytesTotal = chunks.reduce((sum, c) => sum + c.size, 0);

        return {
            completed,
            total,
            percentage,
            bytesUploaded,
            bytesTotal
        };
    }

    /**
     * Réinitialise le statut des chunks en erreur
     * @param chunks - Liste des chunks
     */
    static resetErrorChunks(chunks: ChunkInfo[]): void {
        chunks.forEach(chunk => {
            if (chunk.status === 'error') {
                chunk.status = 'pending';
            }
        });
    }

    /**
     * Obtient les chunks en attente
     * @param chunks - Liste des chunks
     * @returns Chunks non complétés
     */
    static getPendingChunks(chunks: ChunkInfo[]): ChunkInfo[] {
        return chunks.filter(c => c.status === 'pending' || c.status === 'error');
    }

    /**
     * Vérifie si tous les chunks sont complétés
     * @param chunks - Liste des chunks
     * @returns True si tous les chunks sont complétés
     */
    static areAllCompleted(chunks: ChunkInfo[]): boolean {
        return chunks.every(c => c.status === 'completed');
    }
}
