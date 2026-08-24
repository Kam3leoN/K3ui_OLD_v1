/**
 * @fileoverview Générateur de thumbnails pour K3UI
 * @description Utilitaire pour redimensionner et recadrer des images côté client avec Canvas API
 * @author K3UI Team
 * @version 1.0.0
 */

import { ThumbnailOptions, ThumbnailCropPosition } from '../../types/base/upload';

// ============================================================================
// CLASSE THUMBNAILGENERATOR
// ============================================================================

/**
 * Générateur de thumbnails avec Canvas API
 * @description Redimensionne et recadre les images en préservant ou non le ratio d'aspect
 */
export class ThumbnailGenerator {
    /**
     * Génère un thumbnail à partir d'un fichier image
     * @param file - Fichier image source
     * @param options - Options de génération (ou maxWidth pour compatibilité)
     * @param maxHeight - Hauteur maximale (obsolète, utiliser options)
     * @param quality - Qualité JPEG (obsolète, utiliser options)
     * @returns Promise avec le Blob et la DataURL du thumbnail
     * @example
     * ```typescript
     * // Nouvelle syntaxe avec options
     * const thumb = await ThumbnailGenerator.generate(file, {
     *     maxWidth: 200,
     *     maxHeight: 200,
     *     quality: 0.8,
     *     crop: { mode: 'cover', position: 'center' }
     * });
     * 
     * // Ancienne syntaxe (rétrocompatible)
     * const thumb = await ThumbnailGenerator.generate(file, 200, 200, 0.8);
     * ```
     */
    static async generate(
        file: File,
        options: ThumbnailOptions | number = {},
        maxHeight?: number,
        quality?: number
    ): Promise<{ blob: Blob; dataUrl: string }> {
        // Rétrocompatibilité : convertir les anciens paramètres en options
        let opts: ThumbnailOptions;
        if (typeof options === 'number') {
            opts = {
                maxWidth: options,
                maxHeight: maxHeight ?? 200,
                quality: quality ?? 0.8,
                crop: { mode: 'contain' }
            };
        } else {
            opts = {
                maxWidth: options.maxWidth ?? 200,
                maxHeight: options.maxHeight ?? 200,
                quality: options.quality ?? 0.8,
                crop: options.crop ?? { mode: 'contain', position: 'center' }
            };
        }

        return new Promise((resolve, reject) => {
            // Vérifier que c'est bien une image
            if (!file.type.startsWith('image/')) {
                reject(new Error('Le fichier n\'est pas une image'));
                return;
            }

            // Créer un FileReader pour lire le fichier
            const reader = new FileReader();

            reader.onload = (e: ProgressEvent<FileReader>) => {
                if (!e.target || typeof e.target.result !== 'string') {
                    reject(new Error('Erreur lors de la lecture du fichier'));
                    return;
                }

                // Créer une image
                const img = new Image();

                img.onload = () => {
                    try {
                        // Calculer les dimensions selon le mode de crop
                        const result = ThumbnailGenerator.calculateCropDimensions(
                            img.width,
                            img.height,
                            opts.maxWidth!,
                            opts.maxHeight!,
                            opts.crop!
                        );

                        // Créer un canvas
                        const canvas = document.createElement('canvas');
                        canvas.width = result.canvasWidth;
                        canvas.height = result.canvasHeight;

                        const ctx = canvas.getContext('2d');
                        if (!ctx) {
                            reject(new Error('Impossible de créer le contexte canvas'));
                            return;
                        }

                        // Améliorer la qualité du redimensionnement
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';

                        // Dessiner l'image avec crop si nécessaire
                        ctx.drawImage(
                            img,
                            result.sx,
                            result.sy,
                            result.sw,
                            result.sh,
                            result.dx,
                            result.dy,
                            result.dw,
                            result.dh
                        );

                        // Déterminer le type MIME (JPEG ou PNG)
                        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';

                        // Convertir le canvas en Blob
                        canvas.toBlob(
                            (blob) => {
                                if (!blob) {
                                    reject(new Error('Impossible de créer le blob'));
                                    return;
                                }

                                // Générer aussi la DataURL pour affichage direct
                                const dataUrl = canvas.toDataURL(mimeType, opts.quality);

                                resolve({ blob, dataUrl });
                            },
                            mimeType,
                            opts.quality
                        );
                    } catch (error) {
                        console.error('[ThumbnailGenerator] Erreur lors de la génération', error);
                        reject(error);
                    }
                };

                img.onerror = () => {
                    reject(new Error('Erreur lors du chargement de l\'image'));
                };

                img.src = e.target.result;
            };

            reader.onerror = () => {
                reject(new Error('Erreur lors de la lecture du fichier'));
            };

            reader.readAsDataURL(file);
        });
    }

    /**
     * Calcule les dimensions et positions pour le crop
     * @param originalWidth - Largeur originale
     * @param originalHeight - Hauteur originale
     * @param maxWidth - Largeur maximale
     * @param maxHeight - Hauteur maximale
     * @param cropOptions - Options de crop
     * @returns Coordonnées source et destination pour drawImage
     */
    private static calculateCropDimensions(
        originalWidth: number,
        originalHeight: number,
        maxWidth: number,
        maxHeight: number,
        cropOptions: { mode?: string; position?: ThumbnailCropPosition }
    ): {
        sx: number; sy: number; sw: number; sh: number;
        dx: number; dy: number; dw: number; dh: number;
        canvasWidth: number; canvasHeight: number;
    } {
        const mode = cropOptions.mode || 'contain';
        const position = cropOptions.position || 'center';

        // Mode FILL : étirer l'image pour remplir exactement
        if (mode === 'fill') {
            return {
                sx: 0,
                sy: 0,
                sw: originalWidth,
                sh: originalHeight,
                dx: 0,
                dy: 0,
                dw: maxWidth,
                dh: maxHeight,
                canvasWidth: maxWidth,
                canvasHeight: maxHeight
            };
        }

        // Mode COVER : remplir la zone en cropant l'excès
        if (mode === 'cover') {
            const sourceRatio = originalWidth / originalHeight;
            const targetRatio = maxWidth / maxHeight;

            let sx = 0, sy = 0, sw = originalWidth, sh = originalHeight;

            if (sourceRatio > targetRatio) {
                // Image trop large, crop horizontal
                sw = originalHeight * targetRatio;
                const offset = originalWidth - sw;

                // Positionner selon l'option
                if (position.includes('left')) {
                    sx = 0;
                } else if (position.includes('right')) {
                    sx = offset;
                } else {
                    sx = offset / 2; // center par défaut
                }
            } else {
                // Image trop haute, crop vertical
                sh = originalWidth / targetRatio;
                const offset = originalHeight - sh;

                // Positionner selon l'option
                if (position.includes('top')) {
                    sy = 0;
                } else if (position.includes('bottom')) {
                    sy = offset;
                } else {
                    sy = offset / 2; // center par défaut
                }
            }

            return {
                sx: Math.round(sx),
                sy: Math.round(sy),
                sw: Math.round(sw),
                sh: Math.round(sh),
                dx: 0,
                dy: 0,
                dw: maxWidth,
                dh: maxHeight,
                canvasWidth: maxWidth,
                canvasHeight: maxHeight
            };
        }

        // Mode CONTAIN (défaut) : préserver le ratio, fit complet
        const dimensions = ThumbnailGenerator.calculateContainDimensions(
            originalWidth,
            originalHeight,
            maxWidth,
            maxHeight
        );

        return {
            sx: 0,
            sy: 0,
            sw: originalWidth,
            sh: originalHeight,
            dx: 0,
            dy: 0,
            dw: dimensions.width,
            dh: dimensions.height,
            canvasWidth: dimensions.width,
            canvasHeight: dimensions.height
        };
    }

    /**
     * Calcule les dimensions du thumbnail en mode contain (préserve le ratio)
     * @param originalWidth - Largeur originale
     * @param originalHeight - Hauteur originale
     * @param maxWidth - Largeur maximale
     * @param maxHeight - Hauteur maximale
     * @returns Dimensions calculées
     */
    private static calculateContainDimensions(
        originalWidth: number,
        originalHeight: number,
        maxWidth: number,
        maxHeight: number
    ): { width: number; height: number } {
        let width = originalWidth;
        let height = originalHeight;

        // Calculer le ratio
        const ratio = originalWidth / originalHeight;

        // Si l'image est plus large que la limite
        if (width > maxWidth) {
            width = maxWidth;
            height = width / ratio;
        }

        // Si l'image est plus haute que la limite
        if (height > maxHeight) {
            height = maxHeight;
            width = height * ratio;
        }

        // Arrondir les dimensions
        return {
            width: Math.round(width),
            height: Math.round(height)
        };
    }

    /**
     * Génère plusieurs thumbnails en parallèle
     * @param files - Liste de fichiers images
     * @param options - Options de génération (ou maxWidth pour compatibilité)
     * @param maxHeight - Hauteur maximale (obsolète, utiliser options)
     * @param quality - Qualité JPEG (obsolète, utiliser options)
     * @returns Promise avec les thumbnails générés
     * @example
     * ```typescript
     * // Nouvelle syntaxe
     * const thumbs = await ThumbnailGenerator.generateMultiple(files, {
     *     maxWidth: 200,
     *     maxHeight: 200,
     *     crop: { mode: 'cover', position: 'center' }
     * });
     * 
     * // Ancienne syntaxe (rétrocompatible)
     * const thumbs = await ThumbnailGenerator.generateMultiple(files, 200, 200, 0.8);
     * ```
     */
    static async generateMultiple(
        files: File[],
        options: ThumbnailOptions | number = {},
        maxHeight?: number,
        quality?: number
    ): Promise<Array<{ blob: Blob; dataUrl: string } | null>> {
        const promises = files.map(file => {
            if (!file.type.startsWith('image/')) {
                return Promise.resolve(null);
            }
            return ThumbnailGenerator.generate(file, options, maxHeight, quality)
                .catch(error => {
                    console.error('[ThumbnailGenerator] Erreur pour', file.name, error);
                    return null;
                });
        });

        return Promise.all(promises);
    }
}
