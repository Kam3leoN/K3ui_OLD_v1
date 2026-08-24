/**
 * @fileoverview Chargement dynamique des composants marqués `deferred` dans COMPONENT_CONFIG.
 * Permet à Rollup d’émettre des chunks séparés (sans inlineDynamicImports).
 */

import { DEFAULT_SELECTORS } from '../../config/selectors';
import { COMPONENT_CONFIG, type ComponentName, EXTENSION_COMPONENT_NAMES } from '../../config/components-registry';

/** Noms des composants chargés en différé (aligné sur COMPONENT_CONFIG.deferred). */
export const DEFERRED_COMPONENT_NAMES = [
    'BarCode',
    'Chart',
    'CodeBlock',
    'ColorPicker',
    'Command',
    'Comparison',
    'Confetti',
    'Firework',
    'Flip',
    'Datepicker',
    'Gradient',
    'Halo',
    'Holo',
    'Heatmap',
    'InfiniteScroll',
    'Marquee',
    'Page',
    'Parallax',
    'Pace',
    'Perspective',
    'Tilt',
    'QrCode',
    'Signature',
    'Snow',
    'SwipeDeck',
    'SlideshowCaptions',
    'Table',
    'Timepicker',
    'Upload',
] as const;

export type DeferredComponentName = (typeof DEFERRED_COMPONENT_NAMES)[number];

type DeferredLoaderResult = unknown | Record<string, unknown>;

type DeferredLoader = () => Promise<DeferredLoaderResult>;

/** Chargeurs dynamiques — un chunk Rollup par entrée. */
const DEFERRED_LOADERS: Record<DeferredComponentName, DeferredLoader> = {
    BarCode: () => import('../../extensions/generators/barcode/BarCode').then((m) => m.BarCode),
    Chart: () => import('../../components/Chart').then((m) => m.Chart),
    CodeBlock: () => import('../../components/CodeBlock').then((m) => m.CodeBlock),
    ColorPicker: () => import('../../components/ColorPicker').then((m) => m.ColorPicker),
    Command: () => import('../../components/Command').then((m) => m.Command),
    Comparison: () => import('../../components/Comparison').then((m) => m.Comparison),
    Confetti: () => import('../../extensions/effects/confetti/module'),
    Firework: () => import('../../extensions/effects/firework/Firework').then((m) => m.Firework),
    Flip: () => import('../../components/Flip').then((m) => m.Flip),
    Datepicker: () => import('../../components/Datepicker').then((m) => m.Datepicker),
    Gradient: () => import('../../extensions/effects/gradient/Gradient').then((m) => m.Gradient),
    Halo: () => import('../../extensions/effects/halo/Halo').then((m) => m.Halo),
    Holo: () => import('../../extensions/effects/holo/Holo').then((m) => m.Holo),
    Heatmap: () => import('../../components/Heatmap').then((m) => m.Heatmap),
    InfiniteScroll: () => import('../../components/InfiniteScroll').then((m) => m.InfiniteScroll),
    Marquee: () => import('../../components/Marquee').then((m) => m.Marquee),
    Page: () => import('../../components/Page').then((m) => m.Page),
    Parallax: () => import('../../components/Parallax').then((m) => m.Parallax),
    Pace: () => import('../../components/Pace').then((m) => m.Pace),
    Perspective: () => import('../../components/Perspective').then((m) => m.Perspective),
    Tilt: () => import('../../components/Tilt').then((m) => m.Tilt),
    QrCode: () => import('../../extensions/generators/qrcode/QrCode').then((m) => m.QrCode),
    Signature: () => import('../../extensions/generators/signature/Signature').then((m) => m.Signature),
    Snow: () => import('../../extensions/effects/snow/Snow').then((m) => m.Snow),
    SwipeDeck: () => import('../../extensions/gestures/swipe-deck/SwipeDeck').then((m) => m.SwipeDeck),
    SlideshowCaptions: () => import('../../components/SlideshowCaptions').then((m) => m.SlideshowCaptions),
    Table: () => import('../../components/Table').then((m) => m.Table),
    Timepicker: () => import('../../components/Timepicker').then((m) => m.Timepicker),
    Upload: () => import('../../components/Upload').then((m) => m.Upload),
};

/** Promesse partagée pour ne charger les chunks différés qu’une seule fois. */
let deferredComponentsPromise: Promise<Record<string, unknown>> | null = null;
let deferredRequestKey = '';

/**
 * Détermine les composants différés requis selon le DOM et la config AutoInit.
 * @param context Racine de scan DOM
 * @param selectors Sélecteurs fusionnés (K3UI_OPTIONS + défauts)
 */
export function getRequiredDeferredComponentNames(
    context: HTMLElement = typeof document !== 'undefined' ? document.body : (null as unknown as HTMLElement),
    selectors: Record<string, string> = DEFAULT_SELECTORS as unknown as Record<string, string>
): DeferredComponentName[] {
    const required: DeferredComponentName[] = [];

    for (const name of DEFERRED_COMPONENT_NAMES) {
        const config = COMPONENT_CONFIG[name as ComponentName];
        if (!config?.deferred) continue;

        const selector = selectors[name] ?? (DEFAULT_SELECTORS as unknown as Record<string, string>)[name];
        if (!selector) continue;

        const alwaysInit = Boolean(config.alwaysInit);
        let hasMatch = alwaysInit;

        if (!hasMatch && context) {
            if (selector === 'body' && context === document.body) {
                hasMatch = alwaysInit;
            } else {
                hasMatch = context.querySelector(selector) !== null;
            }
        }

        if (hasMatch) {
            required.push(name);
        }
    }

    return required;
}

/**
 * Charge uniquement les classes différées demandées (chunks séparés).
 * @param names Noms des composants à charger
 */
export async function loadDeferredComponentClasses(
    names: readonly DeferredComponentName[]
): Promise<Record<string, unknown>> {
    const unique = [...new Set(names)];
    const result: Record<string, unknown> = {};

    await Promise.all(
        unique.map(async (name) => {
            const loader = DEFERRED_LOADERS[name];
            if (!loader) return;
            const loaded = await loader();
            if (name === 'Confetti' && loaded && typeof loaded === 'object') {
                const mod = loaded as { Confetti?: unknown; ConfettiPresets?: unknown };
                if (mod.Confetti) result.Confetti = mod.Confetti;
                if (mod.ConfettiPresets) result.ConfettiPresets = mod.ConfettiPresets;
            } else {
                result[name] = loaded;
            }
        })
    );

    return result;
}

/**
 * @deprecated Alias — charge toutes les classes différées.
 */
export async function loadAllDeferredComponentClasses(): Promise<Record<string, unknown>> {
    return loadDeferredComponentClasses(DEFERRED_COMPONENT_NAMES);
}

/**
 * Retourne la promesse partagée de chargement différé pour un ensemble de composants.
 * @param names Liste des composants à charger ; défaut = tous les différés
 */
export function getDeferredComponentsLoadPromise(
    names: readonly DeferredComponentName[] = DEFERRED_COMPONENT_NAMES
): Promise<Record<string, unknown>> {
    const key = names.slice().sort().join(',');
    if (!deferredComponentsPromise || deferredRequestKey !== key) {
        deferredRequestKey = key;
        deferredComponentsPromise = loadDeferredComponentClasses(names);
    }
    return deferredComponentsPromise;
}

/**
 * Réinitialise le cache de promesse (tests).
 */
export function resetDeferredComponentsLoadCache(): void {
    deferredComponentsPromise = null;
    deferredRequestKey = '';
}

/**
 * Attache les constructeurs d’extensions sur `K.Extensions` (alias de découverte).
 * Les clés flat `K.QrCode` etc. restent la source de vérité.
 */
export function attachExtensionNamespace(
    components: Record<string, unknown>,
    target?: Record<string, unknown>
): void {
    if (typeof window === 'undefined' && !target) return;
    const w = window as unknown as { K?: Record<string, unknown> };
    const K = target ?? w.K;
    if (!K || typeof K !== 'object') return;

    const extensions =
        (K.Extensions as Record<string, unknown> | undefined) &&
        typeof K.Extensions === 'object'
            ? (K.Extensions as Record<string, unknown>)
            : {};

    for (const name of EXTENSION_COMPONENT_NAMES) {
        if (components[name] != null) {
            extensions[name] = components[name];
        } else if (K[name] != null) {
            extensions[name] = K[name];
        }
    }

    K.Extensions = extensions;
}

/**
 * Attache les constructeurs chargés à `window.K` pour l’API programmatique (après chunks).
 */
export function attachDeferredComponentsToK(components: Record<string, unknown>): void {
    if (typeof window === 'undefined') return;
    const w = window as unknown as { K?: Record<string, unknown> };
    if (w.K && typeof w.K === 'object') {
        Object.assign(w.K, components);
        attachExtensionNamespace(components, w.K);
    }
}

/**
 * Charge uniquement les composants classés Extensions et les attache à `K` / `K.Extensions`.
 */
export async function loadExtensionComponentClasses(): Promise<Record<string, unknown>> {
    const names = EXTENSION_COMPONENT_NAMES.filter((name) =>
        (DEFERRED_COMPONENT_NAMES as readonly string[]).includes(name)
    ) as DeferredComponentName[];
    return loadDeferredComponentClasses(names);
}

/**
 * Indique si un nom correspond à un composant différé.
 */
export function isDeferredComponentName(name: string): boolean {
    return (DEFERRED_COMPONENT_NAMES as readonly string[]).includes(name);
}

export { EXTENSION_COMPONENT_NAMES };
