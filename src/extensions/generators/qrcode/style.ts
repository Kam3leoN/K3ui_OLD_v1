/**
 * @fileoverview Couleurs et presets de style pour le rendu QR SVG
 */

/** Presets de dégradé sur les modules de données. */
export const QR_DOTS_GRADIENT_PRESETS = [
    'linear-vertical',
    'linear-horizontal',
    'diagonal-left',
    'diagonal-right',
    'radial',
] as const;

export type QrDotsGradientPreset = (typeof QR_DOTS_GRADIENT_PRESETS)[number];

/**
 * Vérifie qu'une valeur est un preset de dégradé valide
 * @param v Valeur à tester
 */
export function isQrDotsGradientPreset(v: unknown): v is QrDotsGradientPreset {
    return typeof v === 'string' && (QR_DOTS_GRADIENT_PRESETS as readonly string[]).includes(v);
}

/** Remplissage des modules : uni ou dégradé. */
export type QrDotsFill = 'solid' | 'gradient';

/** Couleurs par partie du QR. */
export interface QrPartColors {
    /** Modules de données */
    dots: string;
    /** Contours des repères (yeux) */
    outer: string;
    /** Centres des repères */
    inner: string;
    /** Mode de remplissage des modules */
    dotsFill: QrDotsFill;
    /** Couleur de fin de dégradé */
    dotsGradientEnd: string;
    /** Preset de dégradé */
    dotsGradientPreset: QrDotsGradientPreset;
}

const HEX6 = /^#[0-9a-fA-F]{6}$/;

function normHex(v: unknown, fallback: string): string {
    if (typeof v === 'string' && HEX6.test(v.trim())) {
        return v.trim();
    }
    if (typeof v === 'string' && v.trim()) {
        return v.trim();
    }
    return fallback;
}

/**
 * Indique si la couleur de fond doit être traitée comme transparente
 * @param value Couleur CSS
 */
export function isTransparentBgColor(value: string | undefined | null): boolean {
    const t = (value ?? '').trim().toLowerCase();
    if (t === 'transparent') {
        return true;
    }
    if (t === 'rgba(0, 0, 0, 0)' || t === 'rgba(0,0,0,0)') {
        return true;
    }
    return false;
}

/**
 * Résout les couleurs effectives pour le rendu SVG
 * @param fgFallback Couleur modules de repli
 * @param partial Couleurs partielles optionnelles
 */
export function resolveQrPartColors(
    fgFallback: string,
    partial?: Partial<QrPartColors>
): QrPartColors {
    const fg = normHex(fgFallback, '#111827');
    const p = partial ?? {};
    const dots = normHex(p.dots, fg);
    const outer = normHex(p.outer, fg);
    const inner = normHex(p.inner, fg);
    const dotsFill = p.dotsFill === 'gradient' ? 'gradient' : 'solid';
    const dotsGradientEnd = normHex(p.dotsGradientEnd, '#2196f3');
    const dotsGradientPreset = isQrDotsGradientPreset(p.dotsGradientPreset)
        ? p.dotsGradientPreset
        : 'diagonal-right';

    return { dots, outer, inner, dotsFill, dotsGradientEnd, dotsGradientPreset };
}

/**
 * Résout l'URL du logo (data / blob / http / chemin relatif)
 * @param logoUrl Source du logo
 */
export function resolveLogoSrc(logoUrl: string | undefined | null): string | undefined {
    const t = (logoUrl ?? '').trim();
    if (!t) {
        return undefined;
    }
    return t;
}
