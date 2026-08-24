/**
 * @fileoverview Résolution des textures Holo (pokemon-cards-151)
 * @description Chemins adaptés au contexte k3ui / k3ui-docs
 * @author K3UI Team
 * @version 1.0.0
 */

const HOLO_TEXTURE_FILES = [
    'grain.webp',
    'glitter.webp',
    'birthday-holo.webp',
    'birthday-dank.webp',
    'birthday-dank-2.webp',
    'iri-1.webp',
    'iri-2.webp',
    'iri-3.webp',
    'iri-4.webp',
    'iri-5.webp',
    'iri-6.webp',
    'iri-7.webp',
    'iri-8.webp',
    'iri-9.webp',
    'noise-base.webp',
    'noise-top.webp',
] as const;

/**
 * Détecte la base URL des assets holo selon le contexte de chargement
 * @returns Chemin absolu se terminant par /
 */
export function resolveHoloAssetsBase(): string {
    if (typeof window === 'undefined') {
        return '/k3ui/assets/images/holo/';
    }

    const path = window.location.pathname;
    if (path.includes('/k3ui-docs')) {
        return '/k3ui-docs/assets/images/holo/';
    }

    const scripts = document.querySelectorAll('script[src]');
    for (const script of scripts) {
        const src = script.getAttribute('src');
        if (!src || !/k3ui/i.test(src)) continue;
        try {
            const url = new URL(src, window.location.href);
            if (/\/js\//.test(url.pathname)) {
                return `${url.pathname.replace(/\/js\/[^/]+$/, '/assets/images/holo/')}`;
            }
        } catch {
            /* ignore invalid URL */
        }
    }

    return '/k3ui/assets/images/holo/';
}

/**
 * Applique les variables CSS de textures sur un élément `.holo`
 * @param el Élément racine holo
 * @param base Base URL (optionnelle)
 */
export function applyHoloTextureVars(el: HTMLElement, base?: string): void {
    const root = base ?? resolveHoloAssetsBase();
    const normalized = root.endsWith('/') ? root : `${root}/`;

    const url = (file: string): string => `url('${normalized}${file}')`;

    el.style.setProperty('--grain', url('grain.webp'));
    el.style.setProperty('--glitter', url('glitter.webp'));
    el.style.setProperty('--birthday', url('birthday-holo.webp'));
    el.style.setProperty('--birthday-dank', url('birthday-dank.webp'));
    el.style.setProperty('--birthday-dank2', url('birthday-dank-2.webp'));
    el.style.setProperty('--iri1', url('iri-1.webp'));
    el.style.setProperty('--iri2', url('iri-2.webp'));
    el.style.setProperty('--iri3', url('iri-3.webp'));
    el.style.setProperty('--iri4', url('iri-4.webp'));
    el.style.setProperty('--iri5', url('iri-5.webp'));
    el.style.setProperty('--iri6', url('iri-6.webp'));
    el.style.setProperty('--iri7', url('iri-7.webp'));
    el.style.setProperty('--iri8', url('iri-8.webp'));
    el.style.setProperty('--iri9', url('iri-9.webp'));
    el.style.setProperty('--noise', url('noise-base.webp'));
    el.style.setProperty('--noise-over', url('noise-top.webp'));
}

export { HOLO_TEXTURE_FILES };
