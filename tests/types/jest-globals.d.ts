/**
 * Extensions globales pour l'environnement Jest / jsdom (LOT 5).
 */
import type { AutoInitOptions } from '../../src/core/autoinit/types';

declare global {
    interface Window {
        K3UI_OPTIONS?: Partial<AutoInitOptions>;
    }

    // eslint-disable-next-line no-var
    var localStorage: Storage;
    // eslint-disable-next-line no-var
    var sessionStorage: Storage;
}

export {};
