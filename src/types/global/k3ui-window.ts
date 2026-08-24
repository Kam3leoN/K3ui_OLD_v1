import type { Menu } from '../../components/Menu';
import type { Timepicker } from '../../components/Timepicker';
import type { Loader } from '../../components/Loader';
import type { PanelContent } from '../../components/PanelContent';
import type { Toast, ToastCallable } from '../../components/Toast';
import type { IconManager } from '../../core/managers/IconManager';
import type { ThemeManager } from '../../core/managers/ThemeManager';
import type { AutoInitOptions } from '../../core/autoinit/types';
import type { ConfettiClassWithStatics } from '../confetti/confetti-fire';
import type { ConfettiPresetApi } from '../confetti/confetti-presets-api';
import type { storage as k3uiStorage } from '../../utils/storage/storage';

/**
 * Sous-ensemble typé de `window.K` utilisé par l’AutoInit et la doc.
 * Les clés complètes restent sur l’objet `K` exporté par `src/index.ts`.
 */
export interface K3UIWindowGlobal {
    ThemeManager?: typeof ThemeManager;
    IconManager?: typeof IconManager;
    Menu?: typeof Menu;
    Timepicker?: typeof Timepicker;
    /** Classe exportée `Loader` (indicateur de chargement). */
    Loader?: typeof Loader;
    PanelContent?: typeof PanelContent;
    Toast?: typeof Toast;
    toast?: ToastCallable;
    storage?: typeof k3uiStorage;
    Confetti?: ConfettiClassWithStatics & ConfettiPresetApi;
    AutoInit?: (context?: HTMLElement, options?: Partial<AutoInitOptions>) => void;
    /** Override mouvement réduit (voir `MotionManager`). */
    preferReducedMotion?: boolean | null;
    [key: string]: unknown;
}

declare global {
    interface Window {
        K?: K3UIWindowGlobal;
    }
}

/** Accès sûr à `window.K` (undefined hors navigateur). */
export function getK3uiGlobal(): K3UIWindowGlobal | undefined {
    if (typeof window === 'undefined') {
        return undefined;
    }
    return window.K;
}
