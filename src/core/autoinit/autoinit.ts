import { k3uiLogger } from './logger';
import { K3UI_READY_CLASS } from './constants';
import { initManagers } from './init-managers';
import { initComponents } from './init-components';
import type { AutoInitOptions } from './types';
import { getK3uiWindowOptions, isK3uiProfileAutoInitEnabled } from './window-options';

/**
 * AutoInit - Initialise automatiquement tous les managers et composants K3UI
 * @description Fonction principale d'initialisation automatique de K3UI
 * @param context - Élément racine pour l'initialisation. Par défaut `document.body`
 * @param options - Options pour chaque composant (optionnel, surcharge window.K3UI_OPTIONS)
 */
export function AutoInit(context: HTMLElement = document.body, options?: Partial<AutoInitOptions>): void {
    k3uiLogger.info('Démarrage de l\'AutoInit K3UI...');

    const customOptions = getK3uiWindowOptions();
    const mergedForProfile = { ...customOptions, ...options };
    const profileAutoInit = Boolean(
        mergedForProfile.profileAutoInit ?? isK3uiProfileAutoInitEnabled()
    );
    if (profileAutoInit && typeof performance !== 'undefined' && typeof performance.mark === 'function') {
        performance.mark('k3ui-autoinit-total-start');
    }

    try {
        initManagers(options);

        initComponents(context, options);

        k3uiLogger.info('AutoInit K3UI terminé avec succès');

        if (profileAutoInit && typeof performance !== 'undefined' && typeof performance.mark === 'function') {
            performance.mark('k3ui-autoinit-total-end');
            try {
                performance.measure('k3ui-autoinit-total', 'k3ui-autoinit-total-start', 'k3ui-autoinit-total-end');
            } catch {
                /* ignore */
            }
        }
    } catch (error) {
        k3uiLogger.error('Erreur lors de l\'AutoInit K3UI:', error);
        if (typeof document !== 'undefined') {
            document.dispatchEvent(new CustomEvent('k3ui-critical-ready', { detail: { error } }));
            if (document.body) document.body.classList.add(K3UI_READY_CLASS);
        }
    }
}
