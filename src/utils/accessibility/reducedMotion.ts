/**
 * @fileoverview Utilitaire pour la préférence "reduced motion"
 * @description Permet de respecter prefers-reduced-motion (système) ou un override global (ex. doc)
 * @author K3UI Team
 * @version 1.0.0
 */

import { MotionManager } from '../../core/managers/MotionManager';

/**
 * Retourne true si l'utilisateur préfère moins de mouvement (animations réduites).
 * La logique est déléguée à `MotionManager` (source de vérité unique).
 */
export function getPreferReducedMotion(): boolean {
    MotionManager.init();
    // sync (classe + évent si besoin)
    MotionManager.ensureSynced();
    return MotionManager.isReducedMotion();
}

/**
 * Bascule l'override global "mouvement réduit" via l’API MotionManager.
 * @returns Le nouvel état effectif (true = mouvement réduit activé)
 */
export function toggleReducedMotion(): boolean {
    return MotionManager.toggle();
}
