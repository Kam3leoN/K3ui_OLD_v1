/**
 * @fileoverview Spécifications du composant Upload K3UI
 * @description Material Design 3 – sélection / dépôt de fichiers avec restrictions développeur
 * @author K3UI Team
 * @version 1.0.0
 */

import type { UploadOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Spécifications du composant Upload
 */
export const UploadSpecs = {
    behaviors: {
        /** Accepter plusieurs fichiers par défaut */
        multiple: true,
        /** Types MIME acceptés */
        accept: '*/*',
        /** Taille max par fichier (10 Mo) */
        maxSize: 10 * 1024 * 1024,
        /** Nombre max de fichiers */
        maxFiles: 10,
        /** Désactivé */
        disabled: false,
        /** Prévisualisation images */
        showPreview: true,
        /** Upload automatique après sélection */
        autoUpload: false,
        /** Afficher les boutons Envoyer / Effacer */
        showActions: true,
        /** Méthode HTTP */
        method: 'POST' as const,
        /** Générer des thumbnails côté Uploader */
        generateThumbnails: true,
    },

    security: {
        /** Blacklist dangereuse par défaut (exe, bat, php, …) */
        useDefaultBlacklist: true,
        /** Vérifier signatures magiques */
        checkMagicBytes: true,
        /** Bloquer doubles extensions suspectes */
        blockDoubleExtensions: true,
        /** Rejeter fichiers vides */
        rejectEmpty: true,
        /** Timeout scan antivirus (ms) */
        scanTimeout: 30000,
    },

    accessibility: {
        role: 'region' as const,
    },
};

/**
 * Extrait les valeurs par défaut pour Upload
 * @returns Options par défaut
 */
export function getUploadDefaults(): UploadOptions {
    return {
        priorityLevel: PriorityLevel.MEDIUM,
        url: '',
        method: UploadSpecs.behaviors.method,
        headers: {},
        accept: UploadSpecs.behaviors.accept,
        multiple: UploadSpecs.behaviors.multiple,
        maxSize: UploadSpecs.behaviors.maxSize,
        maxFiles: UploadSpecs.behaviors.maxFiles,
        disabled: UploadSpecs.behaviors.disabled,
        showPreview: UploadSpecs.behaviors.showPreview,
        autoUpload: UploadSpecs.behaviors.autoUpload,
        showActions: UploadSpecs.behaviors.showActions,
        generateThumbnails: UploadSpecs.behaviors.generateThumbnails,
        chunkSize: 5 * 1024 * 1024,
        maxRetries: 3,
        label: undefined,
        hint: undefined,
        whitelist: [],
        blacklist: [],
        useDefaultBlacklist: UploadSpecs.security.useDefaultBlacklist,
        checkMagicBytes: UploadSpecs.security.checkMagicBytes,
        blockDoubleExtensions: UploadSpecs.security.blockDoubleExtensions,
        rejectEmpty: UploadSpecs.security.rejectEmpty,
        scanUrl: '',
        scanTimeout: UploadSpecs.security.scanTimeout,
        onFilesAdded: null,
        onFilesRejected: null,
        onPreviewReady: null,
        onProgress: null,
        onSuccess: null,
        onError: null,
        onUploadStart: null,
        onUploadComplete: null,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
    };
}
