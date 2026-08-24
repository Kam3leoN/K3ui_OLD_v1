/**
 * @fileoverview Types pour les composants K3UI
 * @description Interfaces et types pour les composants
 * @author K3UI Team
 * @version 0.1.0
 */

/**
 * Interface pour les composants ouvrables
 */
export interface Openable {
    isOpen: boolean;
    open(): void;
    close(): void;
}

/**
 * Interface pour les options i18n
 */
export interface I18nOptions {
    cancel: string;
    clear: string;
    done: string;
}
