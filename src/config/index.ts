/**
 * @fileoverview Point d'entrée des configurations K3UI
 * @description Export centralisé de toutes les configurations par défaut
 * @author K3UI Team
 * @version 0.1.0
 */

// ============================================================================
// EXPORTS - Defaults
// ============================================================================

export {
    DEFAULT_ICON_CONFIG,
    DEFAULT_SOUND_CONFIG,
    DEFAULT_DYNAMIC_COLOR_CONFIG,
    DEFAULT_COMPONENT_OPTIONS,
    type IconManagerConfig,
    type SoundFXManagerConfig,
    type DynamicColorManagerConfig,
    type ComponentDefaultOptions
} from './defaults';

// ============================================================================
// EXPORTS - Selectors
// ============================================================================

export {
    DEFAULT_SELECTORS,
    type ComponentSelectors
} from './selectors';

// ============================================================================
// EXPORTS - Components registry (source de vérité)
// ============================================================================

export {
    COMPONENT_NAMES,
    COMPONENT_CONFIG,
    EXTENSION_COMPONENT_NAMES,
    isExtensionComponent,
    type ComponentName,
    type ComponentConfigEntry,
    type ExtensionComponentName,
} from './components-registry';

