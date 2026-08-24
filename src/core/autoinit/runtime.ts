import { keyboardUtils, MotionManager } from '../managers';
import type { K3UIWindowGlobal } from '../../types/global/k3ui-window';
import { AutoInit } from './autoinit';
import { K3UI_READY_CLASS } from './constants';
import { k3uiLogger } from './logger';
import { injectHideBodyUntilReadyStyle, injectPageLoader } from './page-loader';

/** Payload minimal passé à `installK3UIRuntime` (objet `K` de `src/index.ts`). */
export type K3UIRuntimeInstallInput = K3UIWindowGlobal;

/**
 * Effets de bord navigateur : window.K, clavier, page loader, AutoInit au DOMContentLoaded.
 * @param K - Objet global K3UI
 */
export function installK3UIRuntime(K: K3UIRuntimeInstallInput): void {
    if (typeof window !== 'undefined') {
        const existingK = window.K;
        if (existingK && typeof existingK === 'object' && !('AutoInit' in existingK && existingK.AutoInit)) {
            Object.assign(existingK, K);
            window.K = existingK;
        } else {
            window.K = K;
        }
    }

    if (typeof document !== 'undefined') {
        MotionManager.init();
        injectHideBodyUntilReadyStyle();

        const initK3UI = (): void => {
            try {
                document.addEventListener('keydown', keyboardUtils.handleKeyDown);
                document.addEventListener('keyup', keyboardUtils.handleKeyUp);
                document.addEventListener('focus', keyboardUtils.handleFocus, true);
                document.addEventListener('blur', keyboardUtils.handleBlur, true);

                AutoInit();
            } catch (error) {
                k3uiLogger.error('Erreur dans initK3UI:', error);
                document.dispatchEvent(new CustomEvent('k3ui-critical-ready', { detail: { error } }));
                if (document.body) document.body.classList.add(K3UI_READY_CLASS);
            }
        };

        injectPageLoader();
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initK3UI);
        } else {
            initK3UI();
        }
    }
}
