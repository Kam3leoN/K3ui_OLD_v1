/**
 * @fileoverview Éditeur de crop d'images pour K3UI (LEGACY)
 * @description Wrapper de compatibilité vers ImageEditor
 * @author K3UI Team
 * @version 1.0.0
 * @deprecated Utiliser ImageEditor depuis utils/image à la place
 */

import { ImageEditor } from '../image/editor';
import { ImageCropperOptions, ImageCropperCallbacks } from '../../types/base/upload';
import { ImageEditorOptions, ImageEditorCallbacks } from '../../types/base/image';

// ============================================================================
// CLASSE IMAGECROPPER (LEGACY)
// ============================================================================

/**
 * Éditeur de crop d'images interactif
 * @description Wrapper de compatibilité vers ImageEditor
 * @deprecated Utiliser ImageEditor depuis utils/image à la place
 */
export class ImageCropper extends ImageEditor {
    /**
     * @deprecated Utiliser ImageEditor à la place
     */
    constructor(options: ImageCropperOptions & ImageCropperCallbacks) {
        console.warn('[ImageCropper] ImageCropper est deprecated. Utilisez ImageEditor depuis utils/image à la place.');

        // Convertir les options legacy vers les nouvelles options
        const editorOptions: ImageEditorOptions & ImageEditorCallbacks = {
            container: options.container,
            width: options.width,
            height: options.height,
            crop: {
                showGrid: options.showGrid,
                overlayColor: options.overlayColor
            },
            conversion: {
                quality: options.quality,
                format: 'jpeg'
            },
            onImageLoad: options.onImageLoad,
            onStateChange: (state) => {
                options.onPositionChange?.(state.cropState.imageX, state.cropState.imageY);
            },
            onExport: (result) => {
                options.onCrop?.(result.blob, result.dataUrl);
            }
        };

        super(editorOptions);
    }

    /**
     * Génère le crop final
     * @deprecated Utiliser export() à la place
     */
    async crop(): Promise<{ blob: Blob; dataUrl: string }> {
        const result = await this.export();
        return {
            blob: result.blob,
            dataUrl: result.dataUrl
        };
    }
}
