/**
 * @fileoverview Composant Upload pour K3UI
 * @description Zone de sélection / dépôt de fichiers (single ou multiple) — compose DropZone, Uploader et ProgressIndicator
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { toComponentClassDef } from '../types/components/component-base';
import type { UploadOptions } from '../types/components';
import { PriorityLevel } from '../types/base';
import type { KElement, InitElements } from '../types/base';
import { setAriaAttributes, removeAriaAttribute } from '../utils/dom/aria';
import { LoggerManager, LocaleManager, ManagerFactory, IconManager } from '../core/managers';
import { DropZone } from '../utils/dom/dropzone';
import { Uploader } from '../utils/upload/uploader';
import { FileSecurity } from '../utils/upload/security';
import type { FileSecurityOptions } from '../types/base/upload';
import { formatBytes } from '../utils/helpers/formatBytes';
import { ProgressIndicator } from './ProgressIndicator';
import { getUploadDefaults } from '../specs/components/upload.specs';

/** Ligne de progression upload : label + ProgressIndicator MD3 + stats octets */
interface UploadProgressRow {
    root: HTMLElement;
    indicator: ProgressIndicator;
    labelEl: HTMLElement;
    statsEl: HTMLElement;
    update(progress: number): void;
    setLabel(text: string): void;
    setStats(loaded: number, total: number): void;
    destroy(): void;
}

interface KUploadHTMLElement extends HTMLElement {
    K_Upload?: Upload;
}

const _defaults: UploadOptions = getUploadDefaults();

/**
 * Composant Upload — sélection / dépôt de fichiers Material Design 3
 * @description Réutilise DropZone (sélection + validation), Uploader (HTTP) et ProgressIndicator (UI)
 * @class Upload
 * @extends {Component<UploadOptions>}
 */
export class Upload extends Component<UploadOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    private logger: LoggerManager;
    private dropZone: DropZone | null = null;
    private uploader: Uploader | null = null;
    private zoneEl: HTMLElement | null = null;
    private previewEl: HTMLElement | null = null;
    private actionsEl: HTMLElement | null = null;
    private progressEl: HTMLElement | null = null;
    private uploadBtn: HTMLButtonElement | null = null;
    private clearBtn: HTMLButtonElement | null = null;
    private progressRows: UploadProgressRow[] = [];
    private uploading = false;
    private builtStructure = false;

    /**
     * Options par défaut
     */
    static get defaults(): UploadOptions {
        return { ..._defaults };
    }

    /**
     * Récupère l'instance attachée à un élément
     * @param el - Élément DOM
     */
    static getInstance(el: HTMLElement): Upload {
        return (el as KUploadHTMLElement).K_Upload!;
    }

    /**
     * Initialise Upload sur un ou plusieurs éléments
     * @param els - Élément(s) ou sélecteur
     * @param options - Options partielles
     */
    static init(
        els: HTMLElement | NodeListOf<HTMLElement> | string,
        options: Partial<UploadOptions> = {}
    ): Upload[] {
        return Component.init(
            els as string | KElement | InitElements<KElement>,
            options,
            toComponentClassDef(Upload)
        ) as Upload[];
    }

    /**
     * @param el - Élément hôte
     * @param options - Options partielles
     */
    constructor(el: HTMLElement, options: Partial<UploadOptions> = {}) {
        super(el, options, toComponentClassDef(Upload));

        this.logger = ManagerFactory.getLoggerManager('Upload');

        this.options = {
            ...Upload.defaults,
            ...options,
            ...this.parseDataOptions(el),
        };

        (el as KUploadHTMLElement).K_Upload = this;
        this.init();
    }

    /**
     * Lit les options depuis les attributs data-*
     */
    private parseDataOptions(el: HTMLElement): Partial<UploadOptions> {
        const data: Partial<UploadOptions> = {};
        const ds = el.dataset;

        if (ds.url != null) data.url = ds.url;
        if (ds.method === 'POST' || ds.method === 'PUT') data.method = ds.method;
        if (ds.accept != null) data.accept = ds.accept;
        if (ds.multiple != null) data.multiple = ds.multiple !== 'false';
        if (ds.maxSize != null) {
            const n = Number(ds.maxSize);
            if (!Number.isNaN(n)) data.maxSize = n;
        }
        if (ds.maxFiles != null) {
            const n = Number(ds.maxFiles);
            if (!Number.isNaN(n)) data.maxFiles = n;
        }
        if (ds.disabled != null) data.disabled = ds.disabled !== 'false';
        if (ds.showPreview != null) data.showPreview = ds.showPreview !== 'false';
        if (ds.autoUpload != null) data.autoUpload = ds.autoUpload === 'true';
        if (ds.showActions != null) data.showActions = ds.showActions !== 'false';
        if (ds.generateThumbnails != null) {
            data.generateThumbnails = ds.generateThumbnails !== 'false';
        }
        if (ds.chunkSize != null) {
            const n = Number(ds.chunkSize);
            if (!Number.isNaN(n)) data.chunkSize = n;
        }
        if (ds.maxRetries != null) {
            const n = Number(ds.maxRetries);
            if (!Number.isNaN(n)) data.maxRetries = n;
        }
        if (ds.label != null) data.label = ds.label;
        if (ds.hint != null) data.hint = ds.hint;
        if (ds.whitelist != null) data.whitelist = FileSecurity.parseList(ds.whitelist);
        if (ds.blacklist != null) data.blacklist = FileSecurity.parseList(ds.blacklist);
        if (ds.useDefaultBlacklist != null) {
            data.useDefaultBlacklist = ds.useDefaultBlacklist !== 'false';
        }
        if (ds.checkMagicBytes != null) {
            data.checkMagicBytes = ds.checkMagicBytes !== 'false';
        }
        if (ds.blockDoubleExtensions != null) {
            data.blockDoubleExtensions = ds.blockDoubleExtensions !== 'false';
        }
        if (ds.rejectEmpty != null) data.rejectEmpty = ds.rejectEmpty !== 'false';
        if (ds.scanUrl != null) data.scanUrl = ds.scanUrl;
        if (ds.scanTimeout != null) {
            const n = Number(ds.scanTimeout);
            if (!Number.isNaN(n)) data.scanTimeout = n;
        }

        return data;
    }

    /**
     * Initialisation interne
     */
    private init(): void {
        this.el.classList.add('upload');
        this.buildStructure();
        this.setupAccessibility();
        this.createUploader();
        this.createDropZone();
        this.bindActions();
        this.updateActionsVisibility();
        IconManager.processIconsInContainer(this.el);
        this.logger.info('Upload initialized');
    }

    /**
     * Construit la structure DOM (zone, preview, actions, progress)
     */
    private buildStructure(): void {
        const existingZone = this.el.querySelector('.upload__zone, .dropzone') as HTMLElement | null;
        const existingPreview = this.el.querySelector('.upload__preview, .dropzone-preview') as HTMLElement | null;
        const existingActions = this.el.querySelector('.upload__actions') as HTMLElement | null;
        const existingProgress = this.el.querySelector('.upload__progress, .upload-progress-list') as HTMLElement | null;

        if (existingZone) {
            this.zoneEl = existingZone;
            this.zoneEl.classList.add('upload__zone', 'dropzone');
        } else {
            this.zoneEl = document.createElement('div');
            this.zoneEl.className = 'upload__zone dropzone';
            this.zoneEl.innerHTML = `
                <i name="cloud-upload" type="classic" aria-hidden="true"></i>
                <p class="title-medium upload__label"></p>
                <p class="body-small upload__hint"></p>
            `;
            this.el.appendChild(this.zoneEl);
            this.builtStructure = true;
        }

        const labelEl = this.zoneEl.querySelector('.upload__label, .title-medium') as HTMLElement | null;
        const hintEl = this.zoneEl.querySelector('.upload__hint, .body-small') as HTMLElement | null;
        if (labelEl) {
            labelEl.textContent =
                this.options.label ?? LocaleManager.t('upload.dropLabel');
        }
        if (hintEl) {
            hintEl.textContent =
                this.options.hint ?? LocaleManager.t('upload.dropHint');
        }

        if (existingPreview) {
            this.previewEl = existingPreview;
            this.previewEl.classList.add('upload__preview', 'dropzone-preview');
        } else {
            this.previewEl = document.createElement('div');
            this.previewEl.className = 'upload__preview dropzone-preview';
            this.el.appendChild(this.previewEl);
            this.builtStructure = true;
        }

        if (existingActions) {
            this.actionsEl = existingActions;
            this.actionsEl.classList.add('upload__actions');
            this.uploadBtn = this.actionsEl.querySelector('[data-upload-action="send"]') as HTMLButtonElement | null;
            this.clearBtn = this.actionsEl.querySelector('[data-upload-action="clear"]') as HTMLButtonElement | null;
        } else {
            this.actionsEl = document.createElement('div');
            this.actionsEl.className = 'upload__actions';
            this.actionsEl.innerHTML = `
                <button type="button" class="btn btn--filled btn--sm btn--primary ripple" data-upload-action="send">
                    <i name="send" type="classic" aria-hidden="true"></i>
                    <span>${LocaleManager.t('upload.send')}</span>
                </button>
                <button type="button" class="btn btn--outlined btn--sm ripple" data-upload-action="clear">
                    <i name="trash" type="classic" aria-hidden="true"></i>
                    <span>${LocaleManager.t('upload.clear')}</span>
                </button>
            `;
            this.el.appendChild(this.actionsEl);
            this.uploadBtn = this.actionsEl.querySelector('[data-upload-action="send"]') as HTMLButtonElement;
            this.clearBtn = this.actionsEl.querySelector('[data-upload-action="clear"]') as HTMLButtonElement;
            this.builtStructure = true;
        }

        if (existingProgress) {
            this.progressEl = existingProgress;
            this.progressEl.classList.add('upload__progress', 'upload-progress-list');
        } else {
            this.progressEl = document.createElement('div');
            this.progressEl.className = 'upload__progress upload-progress-list';
            this.el.appendChild(this.progressEl);
            this.builtStructure = true;
        }
    }

    /**
     * Accessibilité ARIA
     */
    private setupAccessibility(): void {
        setAriaAttributes(this.el, {
            role: 'region',
            'aria-label': LocaleManager.t('upload.ariaLabel'),
        });
    }

    /**
     * Crée l'instance Uploader si une URL est fournie
     */
    private createUploader(): void {
        if (!this.options.url) {
            this.uploader = null;
            return;
        }

        this.uploader = new Uploader({
            url: this.options.url,
            method: this.options.method,
            headers: this.options.headers,
            chunkSize: this.options.chunkSize,
            maxRetries: this.options.maxRetries,
            generateThumbnails: this.options.generateThumbnails,
        });
    }

    /**
     * Crée la DropZone sur la zone de dépôt
     */
    private createDropZone(): void {
        if (!this.zoneEl) return;

        this.dropZone = new DropZone({
            element: this.zoneEl,
            accept: this.options.accept,
            multiple: this.options.multiple,
            maxSize: this.options.maxSize,
            maxFiles: this.options.maxFiles,
            disabled: this.options.disabled,
            showPreview: this.options.showPreview,
            uploadOnDrop: false,
            autoUpload: false,
            uploader: undefined,
            onFilesAdded: (files) => this.handleFilesAdded(files),
            onFilesRejected: (files, reason) => this.handleFilesRejected(files, reason),
            onPreviewReady: (file, preview) => this.handlePreviewReady(file, preview),
        });

        if (this.options.disabled) {
            this.el.classList.add('upload--disabled');
        }
    }

    /**
     * Bind des boutons d'action via registerEvent
     */
    private bindActions(): void {
        if (this.uploadBtn) {
            this.registerEvent(this.uploadBtn, 'click', (e: Event) => {
                e.preventDefault();
                e.stopPropagation();
                void this.upload();
            });
        }
        if (this.clearBtn) {
            this.registerEvent(this.clearBtn, 'click', (e: Event) => {
                e.preventDefault();
                e.stopPropagation();
                this.clear();
            });
        }
    }

    /**
     * Affiche / masque la barre d'actions
     */
    private updateActionsVisibility(): void {
        if (!this.actionsEl) return;
        const show = this.options.showActions && !this.options.autoUpload;
        this.actionsEl.hidden = !show;
        this.actionsEl.style.display = show ? '' : 'none';
    }

    /**
     * Options passées à FileSecurity
     */
    private getSecurityOptions(): FileSecurityOptions {
        return {
            whitelist: this.options.whitelist,
            blacklist: this.options.blacklist,
            useDefaultBlacklist: this.options.useDefaultBlacklist,
            checkMagicBytes: this.options.checkMagicBytes,
            blockDoubleExtensions: this.options.blockDoubleExtensions,
            rejectEmpty: this.options.rejectEmpty,
            scanUrl: this.options.scanUrl || undefined,
            scanTimeout: this.options.scanTimeout,
            headers: this.options.headers,
        };
    }

    /**
     * Filtre les fichiers via FileSecurity et retire les rejetés de la DropZone
     * @param files - Fichiers à contrôler
     * @param includeRemoteScan - Inclure le scan antivirus distant (avant envoi)
     */
    private async applySecurityFilter(files: File[], includeRemoteScan = false): Promise<File[]> {
        const options = this.getSecurityOptions();
        if (!includeRemoteScan) {
            options.scanUrl = undefined;
        }

        const { safe, rejected } = await FileSecurity.validateMany(files, options);

        if (rejected.length > 0 && this.dropZone) {
            const natives = this.dropZone.getNativeFiles();
            for (let i = natives.length - 1; i >= 0; i--) {
                if (rejected.some((r) => r.file === natives[i])) {
                    this.dropZone.removeFile(i);
                }
            }
            const reason = rejected.map((r) => r.reason).join(' ; ');
            this.handleFilesRejected(
                rejected.map((r) => r.file),
                reason
            );
        }

        return safe;
    }

    /**
     * Fichiers acceptés par DropZone → contrôle sécurité
     */
    private async handleFilesAdded(files: File[]): Promise<void> {
        const safe = await this.applySecurityFilter(files);
        this.renderPreviewList();

        if (safe.length === 0) {
            return;
        }

        this.options.onOpenStart?.(this.el);
        this.options.onFilesAdded?.(safe, this.el);
        this.options.onOpenEnd?.(this.el);

        if (this.options.autoUpload) {
            void this.uploadFiles(safe);
        }
    }

    /**
     * Fichiers rejetés
     */
    private handleFilesRejected(files: File[], reason: string): void {
        this.options.onFilesRejected?.(files, reason, this.el);
        this.logger.warn('Fichiers rejetés', { reason, count: files.length });
    }

    /**
     * Preview image prête
     */
    private handlePreviewReady(file: File, preview: string): void {
        this.options.onPreviewReady?.(file, preview, this.el);
        this.renderPreviewList();
    }

    /**
     * Rend la liste de prévisualisation
     */
    private renderPreviewList(): void {
        if (!this.previewEl || !this.dropZone) return;

        this.previewEl.innerHTML = '';
        const entries = this.dropZone.getFiles();

        entries.forEach((entry, index) => {
            const item = document.createElement('div');
            item.className = 'dropzone-preview__item';

            if (entry.preview) {
                const img = document.createElement('img');
                img.src = entry.preview;
                img.alt = entry.file.name;
                item.appendChild(img);
            } else {
                const iconWrap = document.createElement('div');
                iconWrap.className = 'dropzone-preview__file-icon';
                iconWrap.innerHTML = `<i name="file" type="classic" aria-hidden="true"></i>`;
                item.appendChild(iconWrap);
            }

            const name = document.createElement('span');
            name.className = 'dropzone-preview__filename';
            name.textContent = entry.file.name;
            item.appendChild(name);

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'dropzone-preview__remove btn btn--icon btn--sm ripple';
            removeBtn.setAttribute('aria-label', LocaleManager.t('upload.removeFile'));
            removeBtn.innerHTML = `<i name="close" type="classic" aria-hidden="true"></i>`;
            this.registerEvent(removeBtn, 'click', (e: Event) => {
                e.preventDefault();
                e.stopPropagation();
                this.removeFile(index);
            });
            item.appendChild(removeBtn);

            this.previewEl!.appendChild(item);
        });

        IconManager.processIconsInContainer(this.previewEl);
    }

    /**
     * Nettoie les barres de progression
     */
    private clearProgressBars(): void {
        this.progressRows.forEach((row) => row.destroy());
        this.progressRows = [];
        if (this.progressEl) {
            this.progressEl.innerHTML = '';
        }
    }

    /**
     * Crée une ligne label + ProgressIndicator + stats pour un fichier en cours d'upload.
     * @param container - Conteneur liste de progression
     * @param label - Nom du fichier affiché
     */
    private createUploadProgressRow(container: HTMLElement, label: string): UploadProgressRow {
        const root = document.createElement('div');
        root.className = 'upload-progress';

        const labelEl = document.createElement('div');
        labelEl.className = 'upload-progress__label';
        labelEl.textContent = label;

        const indicatorEl = document.createElement('div');
        indicatorEl.className = 'progress-indicator no-autoinit';

        const statsEl = document.createElement('div');
        statsEl.className = 'upload-progress__stats';

        root.appendChild(labelEl);
        root.appendChild(indicatorEl);
        root.appendChild(statsEl);
        container.appendChild(root);

        const indicator = ProgressIndicator.init(indicatorEl, {
            variant: 'linear',
            wavy: false,
            thick: false,
            indeterminate: false,
            value: 0,
            min: 0,
            max: 100,
            label,
        }) as ProgressIndicator;

        return {
            root,
            indicator,
            labelEl,
            statsEl,
            update: (progress: number) => {
                indicator.update(progress);
            },
            setLabel: (text: string) => {
                labelEl.textContent = text;
                indicator.configure({ label: text });
            },
            setStats: (loaded: number, total: number) => {
                const percentage = total > 0 ? Math.round((loaded / total) * 100) : 0;
                statsEl.textContent = `${percentage}% - ${formatBytes(loaded)} / ${formatBytes(total)}`;
            },
            destroy: () => {
                indicator.destroy();
                root.remove();
            },
        };
    }

    /**
     * Upload une liste de fichiers (séquentiel pour une progression fiable)
     */
    private async uploadFiles(files: File[]): Promise<void> {
        if (this.uploading || files.length === 0) return;

        // Re-validation sécurité avant envoi (+ scan antivirus si scanUrl)
        const safe = await this.applySecurityFilter(files, true);
        if (safe.length === 0) return;

        if (!this.options.url || !this.uploader) {
            this.logger.warn('Upload ignoré : aucune URL configurée (option url)');
            return;
        }

        this.uploading = true;
        this.options.onUploadStart?.(safe, this.el);
        this.clearProgressBars();

        if (this.uploadBtn) this.uploadBtn.disabled = true;
        if (this.zoneEl) this.dropZone?.setEnabled(false);

        try {
            for (const file of safe) {
                if (!this.progressEl) break;

                const row = this.createUploadProgressRow(this.progressEl, file.name);
                this.progressRows.push(row);

                const fileUploader = new Uploader({
                    url: this.options.url,
                    method: this.options.method,
                    headers: this.options.headers,
                    chunkSize: this.options.chunkSize,
                    maxRetries: this.options.maxRetries,
                    generateThumbnails: this.options.generateThumbnails,
                    onProgress: (progress, loaded, total) => {
                        row.update(progress);
                        row.setStats(loaded, total);
                        this.options.onProgress?.(file, progress, loaded, total);
                    },
                    onSuccess: (response) => {
                        this.options.onSuccess?.(file, response);
                    },
                    onError: (error) => {
                        this.options.onError?.(file, error);
                    },
                });

                try {
                    await fileUploader.upload(file);
                } catch (error) {
                    this.logger.error('Échec upload fichier', error);
                }
            }
        } finally {
            this.uploading = false;
            if (this.uploadBtn) this.uploadBtn.disabled = false;
            if (!this.options.disabled) {
                this.dropZone?.setEnabled(true);
            }
            this.options.onUploadComplete?.(safe, this.el);
        }
    }

    // ========================================================================
    // API PUBLIQUE
    // ========================================================================

    /**
     * Retourne les fichiers avec métadonnées DropZone
     */
    public getFiles(): ReturnType<DropZone['getFiles']> {
        return this.dropZone?.getFiles() ?? [];
    }

    /**
     * Retourne les objets File natifs
     */
    public getNativeFiles(): File[] {
        return this.dropZone?.getNativeFiles() ?? [];
    }

    /**
     * Lance l'upload des fichiers prêts
     */
    public async upload(): Promise<void> {
        const files = this.getNativeFiles();
        await this.uploadFiles(files);
    }

    /**
     * Alias de {@link upload}
     */
    public confirm(): Promise<void> {
        return this.upload();
    }

    /**
     * Supprime un fichier par index
     * @param index - Index dans la liste
     */
    public removeFile(index: number): void {
        this.dropZone?.removeFile(index);
        this.renderPreviewList();
    }

    /**
     * Vide la sélection
     */
    public clear(): void {
        this.options.onCloseStart?.(this.el);
        this.dropZone?.clear();
        this.clearProgressBars();
        if (this.previewEl) this.previewEl.innerHTML = '';
        this.options.onCloseEnd?.(this.el);
    }

    /**
     * Active / désactive le composant
     * @param enabled - true pour activer
     */
    public setEnabled(enabled: boolean): void {
        this.options.disabled = !enabled;
        this.dropZone?.setEnabled(enabled);
        this.el.classList.toggle('upload--disabled', !enabled);
        if (this.uploadBtn) this.uploadBtn.disabled = !enabled || this.uploading;
        if (this.clearBtn) this.clearBtn.disabled = !enabled;
    }

    /**
     * Met à jour les options
     * @param options - Options partielles
     */
    public update(options: Partial<UploadOptions>): void {
        this.options = { ...this.options, ...options };

        if (options.url !== undefined || options.method !== undefined || options.headers !== undefined) {
            this.createUploader();
        }

        this.dropZone?.updateOptions({
            accept: this.options.accept,
            multiple: this.options.multiple,
            maxSize: this.options.maxSize,
            maxFiles: this.options.maxFiles,
            disabled: this.options.disabled,
            showPreview: this.options.showPreview,
            uploadOnDrop: false,
        });

        this.updateActionsVisibility();
        this.setEnabled(!this.options.disabled);

        const labelEl = this.zoneEl?.querySelector('.upload__label, .title-medium') as HTMLElement | null;
        const hintEl = this.zoneEl?.querySelector('.upload__hint, .body-small') as HTMLElement | null;
        if (options.label != null && labelEl) labelEl.textContent = options.label;
        if (options.hint != null && hintEl) hintEl.textContent = options.hint;
    }

    /**
     * Destruction du composant
     */
    public override destroy(): void {
        this.clearProgressBars();
        this.dropZone?.destroy();
        this.dropZone = null;
        this.uploader = null;

        if (this.builtStructure) {
            this.zoneEl?.remove();
            this.previewEl?.remove();
            this.actionsEl?.remove();
            this.progressEl?.remove();
        }

        removeAriaAttribute(this.el, 'role');
        removeAriaAttribute(this.el, 'aria-label');
        this.el.classList.remove('upload', 'upload--disabled');

        if ((this.el as KUploadHTMLElement).K_Upload === this) {
            delete (this.el as KUploadHTMLElement).K_Upload;
        }

        this.logger.info('Upload destroyed');
        super.destroy();
    }
}

/**
 * Custom Element &lt;k3ui-upload&gt;
 * @description Initialisation par AutoInit
 */
if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-upload')) {
    customElements.define(
        'k3ui-upload',
        class extends HTMLElement {
            connectedCallback(): void {
                if (!this.hasAttribute('data-initialized')) {
                    this.setAttribute('data-initialized', 'true');
                }
            }

            disconnectedCallback(): void {
                const instance = (this as KUploadHTMLElement).K_Upload;
                if (instance && typeof instance.destroy === 'function') {
                    instance.destroy();
                }
                (this as KUploadHTMLElement).K_Upload = undefined;
            }
        }
    );
}
