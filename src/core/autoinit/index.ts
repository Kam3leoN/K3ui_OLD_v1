/**
 * AutoInit et bootstrap runtime K3UI (usage interne + réexport depuis src/index.ts).
 */
export type { AutoInitOptions, ComponentInitFn } from './types';
export { initManagers } from './init-managers';
export { initComponents } from './init-components';
export { AutoInit } from './autoinit';
export { K3UI_HIDE_BODY_UNTIL_READY_CRITICAL_SCRIPT } from './page-loader';
export {
    K3UI_DYNAMIC_COLOR_CRITICAL_SCRIPT,
    K3UI_DYNAMIC_COLOR_CSS_VARS_STORAGE_KEY,
    applyCachedDynamicColorCssVars,
    cacheDynamicColorCssVars,
} from './dynamic-color-critical';
export { registerRegistryAssigner } from './registry-bridge';
export { installK3UIRuntime } from './runtime';
