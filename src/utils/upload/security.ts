/**
 * @fileoverview Sécurité fichiers pour K3UI Upload
 * @description Blacklist / whitelist, doubles extensions, signatures magiques, scan antivirus serveur optionnel
 * @author K3UI Team
 * @version 1.0.0
 */

import type {
    FileSecurityOptions,
    FileSecurityRejectCode,
    FileSecurityRejection,
    FileSecurityResult,
} from '../../types/base/upload';

/** Signature magique (premiers octets) */
interface MagicSignature {
    /** Extensions associées (sans point) */
    extensions: string[];
    /** Préfixe d’octets attendu */
    bytes: number[];
    /** Offset de départ dans le fichier */
    offset?: number;
}

/**
 * Validateur de sécurité des fichiers uploadés
 * @description Couche client défensive — un antivirus réel doit rester côté serveur
 */
export class FileSecurity {
    /**
     * Extensions dangereuses bloquées par défaut
     */
    static readonly DEFAULT_BLACKLIST: readonly string[] = [
        '.exe', '.bat', '.cmd', '.com', '.cpl', '.dll', '.msi', '.msp', '.scr',
        '.ps1', '.psm1', '.psd1', '.vbs', '.vbe', '.js', '.jse', '.ws', '.wsf', '.wsh',
        '.msh', '.msh1', '.msh2', '.scf', '.lnk', '.inf', '.reg',
        '.sh', '.bash', '.zsh', '.csh', '.ksh',
        '.php', '.phtml', '.php3', '.php4', '.php5', '.phps', '.phar',
        '.asp', '.aspx', '.asa', '.asax', '.ascx', '.ashx', '.asmx',
        '.jsp', '.jspx', '.cgi', '.pl', '.py', '.rb', '.htaccess',
        '.jar', '.war', '.ear', '.class',
        '.app', '.deb', '.rpm', '.dmg', '.pkg', '.apk', '.ipa',
        '.sys', '.drv', '.bin', '.iso', '.img',
    ];

    /**
     * Signatures magiques courantes (détection de déguisement MIME / extension)
     */
    private static readonly MAGIC_SIGNATURES: readonly MagicSignature[] = [
        { extensions: ['jpg', 'jpeg'], bytes: [0xff, 0xd8, 0xff] },
        { extensions: ['png'], bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
        { extensions: ['gif'], bytes: [0x47, 0x49, 0x46, 0x38] },
        { extensions: ['webp'], bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 }, // RIFF….WEBP
        { extensions: ['bmp'], bytes: [0x42, 0x4d] },
        { extensions: ['pdf'], bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
        { extensions: ['zip', 'docx', 'xlsx', 'pptx', 'odt', 'ods', 'odp', 'jar', 'apk'], bytes: [0x50, 0x4b, 0x03, 0x04] },
        { extensions: ['gz'], bytes: [0x1f, 0x8b] },
        { extensions: ['7z'], bytes: [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c] },
        { extensions: ['rar'], bytes: [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07] },
        { extensions: ['mp3'], bytes: [0x49, 0x44, 0x33] }, // ID3
        { extensions: ['mp4', 'm4a', 'mov'], bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }, // ....ftyp
        { extensions: ['wav'], bytes: [0x52, 0x49, 0x46, 0x46] },
        { extensions: ['ico'], bytes: [0x00, 0x00, 0x01, 0x00] },
        { extensions: ['svg'], bytes: [] }, // texte — contrôlé à part
    ];

    /**
     * Valide un fichier (sync + scan antivirus optionnel)
     */
    static async validate(file: File, options: FileSecurityOptions = {}): Promise<FileSecurityResult> {
        const sync = await this.validateLocal(file, options);
        if (!sync.valid) {
            return sync;
        }

        if (options.scanUrl) {
            return this.scanRemote(file, options);
        }

        return { valid: true };
    }

    /**
     * Valide plusieurs fichiers
     */
    static async validateMany(
        files: File[],
        options: FileSecurityOptions = {}
    ): Promise<{ safe: File[]; rejected: FileSecurityRejection[] }> {
        const safe: File[] = [];
        const rejected: FileSecurityRejection[] = [];

        for (const file of files) {
            const result = await this.validate(file, options);
            if (result.valid) {
                safe.push(file);
            } else {
                rejected.push({
                    file,
                    reason: result.reason || 'Fichier rejeté',
                    code: result.code || 'blacklist',
                });
            }
        }

        return { safe, rejected };
    }

    /**
     * Contrôles locaux (sans réseau)
     */
    static async validateLocal(file: File, options: FileSecurityOptions = {}): Promise<FileSecurityResult> {
        const opts = this.normalizeOptions(options);
        const ext = this.getExtension(file.name);
        const allExts = this.getAllExtensions(file.name);

        if (opts.rejectEmpty && file.size === 0) {
            return this.reject('empty', 'Fichier vide interdit');
        }

        if (opts.blockDoubleExtensions && this.hasSuspiciousDoubleExtension(allExts, opts)) {
            return this.reject(
                'double-extension',
                `Double extension suspecte interdite (${file.name})`
            );
        }

        const blacklist = this.buildBlacklist(opts);
        if (this.matchesList(file, blacklist)) {
            return this.reject(
                'blacklist',
                `Type de fichier interdit (blacklist) : ${ext || file.type || 'inconnu'}`
            );
        }

        if (opts.whitelist.length > 0 && !this.matchesList(file, opts.whitelist)) {
            return this.reject(
                'whitelist',
                `Type de fichier non autorisé (whitelist) : ${ext || file.type || 'inconnu'}`
            );
        }

        if (opts.checkMagicBytes) {
            const magic = await this.checkMagicBytes(file);
            if (!magic.valid) {
                return magic;
            }
        }

        return { valid: true };
    }

    /**
     * Construit les options de sécurité à partir d’options Upload / data-*
     */
    static normalizeOptions(options: FileSecurityOptions): Required<
        Pick<
            FileSecurityOptions,
            | 'whitelist'
            | 'blacklist'
            | 'useDefaultBlacklist'
            | 'checkMagicBytes'
            | 'blockDoubleExtensions'
            | 'rejectEmpty'
            | 'scanTimeout'
        >
    > &
        FileSecurityOptions {
        return {
            whitelist: this.normalizeTokens(options.whitelist),
            blacklist: this.normalizeTokens(options.blacklist),
            useDefaultBlacklist: options.useDefaultBlacklist !== false,
            checkMagicBytes: options.checkMagicBytes !== false,
            blockDoubleExtensions: options.blockDoubleExtensions !== false,
            rejectEmpty: options.rejectEmpty !== false,
            scanUrl: options.scanUrl,
            scanTimeout: options.scanTimeout ?? 30000,
            headers: options.headers || {},
        };
    }

    /**
     * Parse une chaîne CSV en tokens (ex: `.pdf,.jpg,image/*`)
     */
    static parseList(value: string | undefined | null): string[] {
        if (!value || !value.trim()) return [];
        return this.normalizeTokens(value.split(','));
    }

    // ========================================================================
    // PRIVÉ
    // ========================================================================

    private static reject(code: FileSecurityRejectCode, reason: string): FileSecurityResult {
        return { valid: false, code, reason };
    }

    private static normalizeTokens(list?: string[] | null): string[] {
        if (!list) return [];
        return list
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean)
            .map((t) => {
                if (t.startsWith('.') || t.includes('/') || t.includes('*')) return t;
                return `.${t}`;
            });
    }

    private static buildBlacklist(opts: ReturnType<typeof FileSecurity.normalizeOptions>): string[] {
        const list = [...opts.blacklist];
        if (opts.useDefaultBlacklist) {
            list.push(...FileSecurity.DEFAULT_BLACKLIST);
        }
        return this.normalizeTokens(list);
    }

    private static getExtension(filename: string): string {
        const base = filename.split(/[/\\]/).pop() || filename;
        const i = base.lastIndexOf('.');
        if (i <= 0 || i === base.length - 1) return '';
        return `.${base.slice(i + 1).toLowerCase()}`;
    }

    private static getAllExtensions(filename: string): string[] {
        const base = (filename.split(/[/\\]/).pop() || filename).toLowerCase();
        const parts = base.split('.');
        if (parts.length < 2) return [];
        // ignore le nom : parts[0]
        return parts.slice(1).map((p) => `.${p}`);
    }

    /**
     * Double extension suspecte : une extension blacklistée apparaît dans la chaîne
     * (ex: `facture.pdf.exe`, `photo.jpg.js`)
     */
    private static hasSuspiciousDoubleExtension(
        allExts: string[],
        opts: ReturnType<typeof FileSecurity.normalizeOptions>
    ): boolean {
        if (allExts.length < 2) return false;
        const blacklist = this.buildBlacklist(opts);
        return allExts.some((e) => blacklist.includes(e));
    }

    private static matchesList(file: File, list: string[]): boolean {
        if (list.length === 0) return false;
        const ext = this.getExtension(file.name);
        const mime = (file.type || '').toLowerCase();

        return list.some((token) => {
            if (token.startsWith('.')) {
                return ext === token;
            }
            if (token.endsWith('/*')) {
                const prefix = token.slice(0, -1); // "image/"
                return mime.startsWith(prefix);
            }
            return mime === token;
        });
    }

    private static async readHeader(file: File, length: number): Promise<Uint8Array> {
        const slice = file.slice(0, length);
        const buffer = await slice.arrayBuffer();
        return new Uint8Array(buffer);
    }

    private static async checkMagicBytes(file: File): Promise<FileSecurityResult> {
        const ext = this.getExtension(file.name).replace(/^\./, '');
        if (!ext) {
            return { valid: true };
        }

        // SVG : texte, vérifier absence de script
        if (ext === 'svg' || file.type === 'image/svg+xml') {
            return this.validateSvg(file);
        }

        const signatures = this.MAGIC_SIGNATURES.filter(
            (s) => s.extensions.includes(ext) && s.bytes.length > 0
        );
        if (signatures.length === 0) {
            // Pas de signature connue → ne bloque pas (txt, csv, …)
            return { valid: true };
        }

        const header = await this.readHeader(file, 64);

        // WEBP : RIFF + WEBP à offset 8
        if (ext === 'webp') {
            const isRiff =
                header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46;
            const isWebp =
                header.length >= 12 &&
                header[8] === 0x57 &&
                header[9] === 0x45 &&
                header[10] === 0x42 &&
                header[11] === 0x50;
            if (!isRiff || !isWebp) {
                return this.reject(
                    'magic-bytes',
                    'Contenu incohérent avec l’extension .webp (possible fichier déguisé)'
                );
            }
            return { valid: true };
        }

        const matched = signatures.some((sig) => {
            const offset = sig.offset ?? 0;
            if (header.length < offset + sig.bytes.length) return false;
            return sig.bytes.every((b, i) => header[offset + i] === b);
        });

        if (!matched) {
            // PE/MZ exécutable déguisé
            if (header[0] === 0x4d && header[1] === 0x5a) {
                return this.reject('magic-bytes', 'Exécutable Windows (MZ) détecté — fichier bloqué');
            }
            return this.reject(
                'magic-bytes',
                `Contenu incohérent avec l’extension .${ext} (possible fichier déguisé)`
            );
        }

        // Même si l’extension match, bloquer MZ
        if (header[0] === 0x4d && header[1] === 0x5a) {
            return this.reject('magic-bytes', 'Exécutable Windows (MZ) détecté — fichier bloqué');
        }

        return { valid: true };
    }

    private static async validateSvg(file: File): Promise<FileSecurityResult> {
        const text = (await file.slice(0, 64 * 1024).text()).toLowerCase();
        const dangerous = [
            '<script',
            'javascript:',
            'onerror=',
            'onload=',
            'onclick=',
            '<foreignobject',
            'xlink:href="data:',
        ];
        if (dangerous.some((d) => text.includes(d))) {
            return this.reject('magic-bytes', 'SVG potentiellement malveillant (script / handlers)');
        }
        if (!text.includes('<svg')) {
            return this.reject('magic-bytes', 'Fichier SVG invalide ou déguisé');
        }
        return { valid: true };
    }

    /**
     * Scan antivirus distant (endpoint développeur)
     */
    private static async scanRemote(file: File, options: FileSecurityOptions): Promise<FileSecurityResult> {
        const scanUrl = options.scanUrl!;
        const timeout = options.scanTimeout ?? 30000;

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);

        try {
            const formData = new FormData();
            formData.append('file', file, file.name);

            const response = await fetch(scanUrl, {
                method: 'POST',
                body: formData,
                headers: options.headers || {},
                signal: controller.signal,
                credentials: 'same-origin',
            });

            if (!response.ok) {
                return this.reject('scan-error', `Scan antivirus échoué (HTTP ${response.status})`);
            }

            const data = (await response.json()) as { safe?: boolean; reason?: string };
            if (data.safe === true) {
                return { valid: true };
            }

            return this.reject('virus', data.reason || 'Fichier détecté comme malveillant');
        } catch (error) {
            if ((error as Error).name === 'AbortError') {
                return this.reject('scan-timeout', 'Délai du scan antivirus dépassé');
            }
            console.error('[FileSecurity] Erreur scan antivirus:', error);
            return this.reject('scan-error', 'Impossible de scanner le fichier');
        } finally {
            clearTimeout(timer);
        }
    }
}
