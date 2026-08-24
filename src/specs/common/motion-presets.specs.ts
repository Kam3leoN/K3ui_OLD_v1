/**
 * @fileoverview Presets motion M3 Expressive partagés entre composants
 * @description Mapping des 12 springs (spatial/effects × fast/default/slow) par cas d'usage
 * @see motion.token.scss — schéma expressive (défaut) ou standard via data-motion-scheme
 * @author K3UI Team
 */

import type { MotionSpringSpeed } from '../../utils/motion/motionSpring';

/** Preset motion : vitesses spatial et effects */
export interface MotionPreset {
    spatialSpeed: MotionSpringSpeed;
    effectsSpeed: MotionSpringSpeed;
}

/**
 * Presets motion M3 par composant / cas d'usage.
 * Référence unique pour Dialog, Tooltip, Snackbar, Menu.
 */
export const MotionPresets = {
    /** Dialog modal centré : scale + fade */
    dialogModal: {
        spatialSpeed: 'default',
        effectsSpeed: 'default',
    } as MotionPreset,

    /** Dialog scrim / overlay : fade uniquement */
    dialogScrim: {
        effectsSpeed: 'default',
    } as { effectsSpeed: MotionSpringSpeed },

    /** Dialog bottom sheet : slide vertical */
    dialogBottomSheet: {
        spatialSpeed: 'default',
        effectsSpeed: 'fast',
    } as MotionPreset,

    /** Dialog fullscreen mobile : slide depuis le bas */
    dialogFullscreen: {
        spatialSpeed: 'default',
        effectsSpeed: 'fast',
    } as MotionPreset,

    /** Tooltip : scale léger + fade */
    tooltip: {
        spatialSpeed: 'fast',
        effectsSpeed: 'fast',
    } as MotionPreset,

    /** Snackbar entrée : slide depuis le bas */
    snackbarEnter: {
        spatialSpeed: 'default',
        effectsSpeed: 'fast',
    } as MotionPreset,

    /** Snackbar sortie */
    snackbarExit: {
        spatialSpeed: 'fast',
        effectsSpeed: 'fast',
    } as MotionPreset,

    /** Toast entrée (aligné Snackbar) */
    toastEnter: {
        spatialSpeed: 'default',
        effectsSpeed: 'fast',
    } as MotionPreset,

    /** Toast sortie */
    toastExit: {
        spatialSpeed: 'fast',
        effectsSpeed: 'fast',
    } as MotionPreset,

    /** Drawer overlay (effects uniquement) */
    drawerOverlay: {
        effectsSpeed: 'default',
    } as { effectsSpeed: MotionSpringSpeed },

    /** Drawer panneau (spatial) */
    drawerPanel: {
        spatialSpeed: 'default',
        effectsSpeed: 'fast',
    } as MotionPreset,

    /** Menu principal (référence existante) */
    menu: {
        spatialSpeed: 'fast',
        effectsSpeed: 'fast',
    } as MotionPreset,
} as const;
