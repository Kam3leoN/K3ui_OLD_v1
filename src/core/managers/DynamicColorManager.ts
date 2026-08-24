/**
 * @fileoverview DynamicColorManager pour K3UI
 * @description Gère les couleurs dynamiques Material Design 3 avec support du contraste et persistance
 * @author K3UI Team
 * @version 2.0.0
 */

import {
    Hct,
    MaterialDynamicColors,
    ContrastLevel,
    createScheme,
    Variant,
    type SpecVersion,
    type Platform,
    type DynamicScheme,
    type DynamicColor,
} from '../../utils/color';
import { argbToHex, argbToRgbString } from '../../utils/color/color-format';
import { buildStateTokens } from '../../utils/color/state-tokens';
import { buildK3uiExtensionTokens } from '../../utils/color/k3ui-extension-tokens';
import { LoggerManager } from './LoggerManager';
import { PrivacyManager } from './PrivacyManager';
import { storage } from '../../utils/storage';
import { cacheDynamicColorCssVars } from '../autoinit/dynamic-color-critical';

/**
 * Interface pour les options du DynamicColorManager
 */
export interface DynamicColorOptions {
    /** Couleur source (hex) */
    sourceColor?: string;
    /** Niveau de contraste */
    contrastLevel?: ContrastLevel;
    /** Thème sombre ou clair */
    isDark?: boolean;
    /** Variante de schéma Material */
    variant?: Variant;
    /** Version de spec couleur */
    specVersion?: SpecVersion;
    /** Plateforme cible (spec 2025+) */
    platform?: Platform;
    /** Sauvegarder les préférences */
    savePreference?: boolean;
    /** Clé de stockage */
    storageKey?: string;
    /** Callback lors du changement */
    onChange?: ((
        sourceColor: string,
        contrastLevel: ContrastLevel,
        isDark: boolean,
        variant: Variant,
        specVersion: SpecVersion
    ) => void) | null;
}

/**
 * Options par défaut
 */
const _defaults: DynamicColorOptions = {
    sourceColor: '#6750A4',
    contrastLevel: 0,
    isDark: false,
    variant: Variant.TONAL_SPOT,
    specVersion: '2025',
    platform: 'phone',
    savePreference: true,
    storageKey: 'k3ui-dynamic-color',
    onChange: null,
};

/**
 * Interface pour les préférences sauvegardées
 */
interface SavedPreferences {
    sourceColor: string;
    contrastLevel: ContrastLevel;
    isDark: boolean;
    variant?: Variant;
    specVersion?: SpecVersion;
    platform?: Platform;
}

/** Entrée token système */
interface SystemTokenEntry {
    key: string;
    color: DynamicColor;
}

/** Construit la liste des tokens MD3 (ignore les rôles *-dim absents en spec 2021) */
function buildSystemTokens(): SystemTokenEntry[] {
    const entries: Array<{ key: string; color: DynamicColor | undefined }> = [
        { key: 'background', color: MaterialDynamicColors.background },
        { key: 'on-background', color: MaterialDynamicColors.onBackground },
        { key: 'surface', color: MaterialDynamicColors.surface },
        { key: 'surface-dim', color: MaterialDynamicColors.surfaceDim },
        { key: 'surface-bright', color: MaterialDynamicColors.surfaceBright },
        { key: 'surface-container-lowest', color: MaterialDynamicColors.surfaceContainerLowest },
        { key: 'surface-container-low', color: MaterialDynamicColors.surfaceContainerLow },
        { key: 'surface-container', color: MaterialDynamicColors.surfaceContainer },
        { key: 'surface-container-high', color: MaterialDynamicColors.surfaceContainerHigh },
        { key: 'surface-container-highest', color: MaterialDynamicColors.surfaceContainerHighest },
        { key: 'on-surface', color: MaterialDynamicColors.onSurface },
        { key: 'surface-variant', color: MaterialDynamicColors.surfaceVariant },
        { key: 'on-surface-variant', color: MaterialDynamicColors.onSurfaceVariant },
        { key: 'primary', color: MaterialDynamicColors.primary },
        { key: 'primary-dim', color: MaterialDynamicColors.primaryDim },
        { key: 'on-primary', color: MaterialDynamicColors.onPrimary },
        { key: 'primary-container', color: MaterialDynamicColors.primaryContainer },
        { key: 'on-primary-container', color: MaterialDynamicColors.onPrimaryContainer },
        { key: 'secondary', color: MaterialDynamicColors.secondary },
        { key: 'secondary-dim', color: MaterialDynamicColors.secondaryDim },
        { key: 'on-secondary', color: MaterialDynamicColors.onSecondary },
        { key: 'secondary-container', color: MaterialDynamicColors.secondaryContainer },
        { key: 'on-secondary-container', color: MaterialDynamicColors.onSecondaryContainer },
        { key: 'tertiary', color: MaterialDynamicColors.tertiary },
        { key: 'tertiary-dim', color: MaterialDynamicColors.tertiaryDim },
        { key: 'on-tertiary', color: MaterialDynamicColors.onTertiary },
        { key: 'tertiary-container', color: MaterialDynamicColors.tertiaryContainer },
        { key: 'on-tertiary-container', color: MaterialDynamicColors.onTertiaryContainer },
        { key: 'error', color: MaterialDynamicColors.error },
        { key: 'error-dim', color: MaterialDynamicColors.errorDim },
        { key: 'on-error', color: MaterialDynamicColors.onError },
        { key: 'error-container', color: MaterialDynamicColors.errorContainer },
        { key: 'on-error-container', color: MaterialDynamicColors.onErrorContainer },
        { key: 'outline', color: MaterialDynamicColors.outline },
        { key: 'outline-variant', color: MaterialDynamicColors.outlineVariant },
        { key: 'inverse-surface', color: MaterialDynamicColors.inverseSurface },
        { key: 'inverse-on-surface', color: MaterialDynamicColors.inverseOnSurface },
        { key: 'inverse-primary', color: MaterialDynamicColors.inversePrimary },
        { key: 'shadow', color: MaterialDynamicColors.shadow },
        { key: 'scrim', color: MaterialDynamicColors.scrim },
        { key: 'surface-tint', color: MaterialDynamicColors.surfaceTint },
        { key: 'primary-fixed', color: MaterialDynamicColors.primaryFixed },
        { key: 'primary-fixed-dim', color: MaterialDynamicColors.primaryFixedDim },
        { key: 'on-primary-fixed', color: MaterialDynamicColors.onPrimaryFixed },
        { key: 'on-primary-fixed-variant', color: MaterialDynamicColors.onPrimaryFixedVariant },
        { key: 'secondary-fixed', color: MaterialDynamicColors.secondaryFixed },
        { key: 'secondary-fixed-dim', color: MaterialDynamicColors.secondaryFixedDim },
        { key: 'on-secondary-fixed', color: MaterialDynamicColors.onSecondaryFixed },
        { key: 'on-secondary-fixed-variant', color: MaterialDynamicColors.onSecondaryFixedVariant },
        { key: 'tertiary-fixed', color: MaterialDynamicColors.tertiaryFixed },
        { key: 'tertiary-fixed-dim', color: MaterialDynamicColors.tertiaryFixedDim },
        { key: 'on-tertiary-fixed', color: MaterialDynamicColors.onTertiaryFixed },
        { key: 'on-tertiary-fixed-variant', color: MaterialDynamicColors.onTertiaryFixedVariant },
    ];

    return entries.filter((e): e is SystemTokenEntry => e.color !== undefined);
}

/** Liste déclarative des tokens MD3 injectés en CSS vars */
const SYSTEM_TOKENS: SystemTokenEntry[] = buildSystemTokens();

/**
 * Classe DynamicColorManager pour gérer les couleurs dynamiques
 */
export class DynamicColorManager {
    private static logger: LoggerManager = LoggerManager.create('[DynamicColorManager]', 'Manager');

    private static _initialized: boolean = false;
    private static _options: DynamicColorOptions = { ..._defaults };
    private static _currentScheme: DynamicScheme | null = null;
    private static _currentSourceColor: string = _defaults.sourceColor!;
    private static _currentContrastLevel: ContrastLevel = _defaults.contrastLevel!;
    private static _isDark: boolean = _defaults.isDark ?? false;
    private static _currentVariant: Variant = _defaults.variant!;
    private static _currentSpecVersion: SpecVersion = _defaults.specVersion!;
    private static _currentPlatform: Platform = _defaults.platform!;
    private static _lastThemeHash: string | null = null;

    static get currentSourceColor(): string {
        return this._currentSourceColor;
    }

    static get currentContrastLevel(): ContrastLevel {
        return this._currentContrastLevel;
    }

    static get isDark(): boolean {
        return this._isDark;
    }

    static get currentVariant(): Variant {
        return this._currentVariant;
    }

    static get currentSpecVersion(): SpecVersion {
        return this._currentSpecVersion;
    }

    static get currentPlatform(): Platform {
        return this._currentPlatform;
    }

    static get options(): DynamicColorOptions {
        return { ...this._options };
    }

    /**
     * Initialise le gestionnaire de couleurs dynamiques
     */
    static init(options?: Partial<DynamicColorOptions>): void {
        if (this._initialized) {
            DynamicColorManager.logger.warn('DynamicColorManager already initialized');
            return;
        }

        if (options) {
            this._options = { ...this._options, ...options };
        }

        this._currentSourceColor = this._options.sourceColor!;
        this._currentContrastLevel = this._options.contrastLevel!;
        this._isDark = this._options.isDark ?? false;
        this._currentVariant = this._options.variant ?? Variant.TONAL_SPOT;
        this._currentSpecVersion = this._options.specVersion ?? '2025';
        this._currentPlatform = this._options.platform ?? 'phone';

        this.restorePreference();
        this.applyTheme(
            this._currentSourceColor,
            this._currentContrastLevel,
            this._isDark,
            this._currentVariant,
            this._currentSpecVersion,
            this._currentPlatform
        );

        this._initialized = true;
        DynamicColorManager.logger.info('DynamicColorManager initialized');
    }

    private static restorePreference(): void {
        if (!this._options.savePreference) {
            return;
        }

        try {
            const saved = storage.get<SavedPreferences>(this._options.storageKey!);
            if (saved) {
                this._currentSourceColor = saved.sourceColor || this._options.sourceColor!;
                this._currentContrastLevel = saved.contrastLevel !== undefined
                    ? saved.contrastLevel
                    : this._options.contrastLevel!;
                this._isDark = saved.isDark !== undefined
                    ? saved.isDark
                    : (this._options.isDark ?? false);
                this._currentVariant = saved.variant ?? this._options.variant ?? Variant.TONAL_SPOT;
                this._currentSpecVersion = saved.specVersion ?? this._options.specVersion ?? '2025';
                this._currentPlatform = saved.platform ?? this._options.platform ?? 'phone';
                DynamicColorManager.logger.info('Preferences restored from storage');
            }
        } catch (error) {
            DynamicColorManager.logger.error('Error restoring preferences:', error);
        }
    }

    private static savePreference(): void {
        if (!this._options.savePreference) {
            return;
        }

        if (!PrivacyManager.canWrite(this._options.storageKey!)) {
            DynamicColorManager.logger.debug('Dynamic color preference write skipped (privacy consent)');
            return;
        }

        try {
            const preferences: SavedPreferences = {
                sourceColor: this._currentSourceColor,
                contrastLevel: this._currentContrastLevel,
                isDark: this._isDark,
                variant: this._currentVariant,
                specVersion: this._currentSpecVersion,
                platform: this._currentPlatform,
            };
            storage.set(this._options.storageKey!, preferences);
        } catch (error) {
            DynamicColorManager.logger.error('Error saving preferences:', error);
        }
    }

    private static buildThemeHash(
        sourceColor: string,
        contrastLevel: ContrastLevel,
        isDark: boolean,
        variant: Variant,
        specVersion: SpecVersion,
        platform: Platform
    ): string {
        return `${sourceColor}|${contrastLevel}|${isDark}|${variant}|${specVersion}|${platform}`;
    }

    /**
     * Applique le thème dynamique au document
     */
    static applyTheme(
        sourceColor: string,
        contrastLevel: ContrastLevel = this._currentContrastLevel,
        isDark: boolean = this._isDark,
        variant: Variant = this._currentVariant,
        specVersion: SpecVersion = this._currentSpecVersion,
        platform: Platform = this._currentPlatform
    ): void {
        const hash = this.buildThemeHash(sourceColor, contrastLevel, isDark, variant, specVersion, platform);
        if (hash === this._lastThemeHash && this._currentScheme) {
            return;
        }

        try {
            const sourceHct = Hct.fromHex(sourceColor);
            this._currentScheme = createScheme(sourceHct, {
                variant,
                specVersion,
                platform,
                contrastLevel,
                isDark,
            });

            this._currentSourceColor = sourceColor;
            this._currentContrastLevel = contrastLevel;
            this._isDark = isDark;
            this._currentVariant = variant;
            this._currentSpecVersion = specVersion;
            this._currentPlatform = platform;
            this._lastThemeHash = hash;

            this.applyTokensToDocument();
            cacheDynamicColorCssVars(document.documentElement, hash, this._isDark);
            this.savePreference();

            if (this._options.onChange) {
                this._options.onChange(sourceColor, contrastLevel, isDark, variant, specVersion);
            }

            DynamicColorManager.logger.info(
                `Theme applied: ${sourceColor}, contrast: ${contrastLevel}, dark: ${isDark}, variant: ${variant}, spec: ${specVersion}`
            );
        } catch (error) {
            DynamicColorManager.logger.error('Error applying theme:', error);
        }
    }

    /**
     * Applique les tokens système au document via CSS custom properties
     */
    private static applyTokensToDocument(target: HTMLElement = document.documentElement): void {
        if (!this._currentScheme) {
            return;
        }

        const scheme = this._currentScheme;

        for (const token of SYSTEM_TOKENS) {
            try {
                const argb = token.color.getArgb(scheme);
                const hex = argbToHex(argb);
                const cssKey = `--md-sys-color-${token.key}`;
                target.style.setProperty(cssKey, hex);
                target.style.setProperty(`${cssKey}-rgb`, argbToRgbString(argb));
            } catch (error) {
                DynamicColorManager.logger.warn(`Error applying token ${token.key}:`, error);
            }
        }

        for (const state of buildStateTokens(scheme)) {
            const cssKey = `--md-sys-color-${state.key}`;
            target.style.setProperty(cssKey, state.hex);
            target.style.setProperty(`${cssKey}-rgb`, state.rgb);
        }

        for (const ext of buildK3uiExtensionTokens(scheme.isDark)) {
            const cssKey = `--md-sys-color-${ext.key}`;
            target.style.setProperty(cssKey, ext.hex);
            target.style.setProperty(`${cssKey}-rgb`, ext.rgb);
        }
    }

    static setSourceColor(sourceColor: string): void {
        this.applyTheme(
            sourceColor,
            this._currentContrastLevel,
            this._isDark,
            this._currentVariant,
            this._currentSpecVersion,
            this._currentPlatform
        );
    }

    static setContrastLevel(contrastLevel: ContrastLevel): void {
        this.applyTheme(
            this._currentSourceColor,
            contrastLevel,
            this._isDark,
            this._currentVariant,
            this._currentSpecVersion,
            this._currentPlatform
        );
    }

    static setIsDark(isDark: boolean): void {
        if (!this._initialized) {
            return;
        }
        this.applyTheme(
            this._currentSourceColor,
            this._currentContrastLevel,
            isDark,
            this._currentVariant,
            this._currentSpecVersion,
            this._currentPlatform
        );
    }

    /**
     * Met à jour la variante de schéma
     */
    static setVariant(variant: Variant): void {
        this.applyTheme(
            this._currentSourceColor,
            this._currentContrastLevel,
            this._isDark,
            variant,
            this._currentSpecVersion,
            this._currentPlatform
        );
    }

    /**
     * Met à jour la version de spec couleur
     */
    static setSpecVersion(specVersion: SpecVersion): void {
        this.applyTheme(
            this._currentSourceColor,
            this._currentContrastLevel,
            this._isDark,
            this._currentVariant,
            specVersion,
            this._currentPlatform
        );
    }

    static updateOptions(options: Partial<DynamicColorOptions>): void {
        this._options = { ...this._options, ...options };
    }

    static reset(): void {
        this._currentSourceColor = this._options.sourceColor!;
        this._currentContrastLevel = this._options.contrastLevel!;
        this._isDark = this._options.isDark ?? false;
        this._currentVariant = this._options.variant ?? Variant.TONAL_SPOT;
        this._currentSpecVersion = this._options.specVersion ?? '2025';
        this._currentPlatform = this._options.platform ?? 'phone';
        this._lastThemeHash = null;
        this.applyTheme(
            this._currentSourceColor,
            this._currentContrastLevel,
            this._isDark,
            this._currentVariant,
            this._currentSpecVersion,
            this._currentPlatform
        );
    }

    static destroy(): void {
        this._initialized = false;
        this._currentScheme = null;
        this._lastThemeHash = null;
        this._options = { ..._defaults };
        this._currentSourceColor = _defaults.sourceColor!;
        this._currentContrastLevel = _defaults.contrastLevel!;
        this._isDark = _defaults.isDark ?? false;
        this._currentVariant = _defaults.variant!;
        this._currentSpecVersion = _defaults.specVersion!;
        this._currentPlatform = _defaults.platform!;
        DynamicColorManager.logger.info('DynamicColorManager destroyed');
    }
}
