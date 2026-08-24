/**
 * @fileoverview Wrapper TypeScript pour l'espace colorimétrique HCT (Hue, Chroma, Tone)
 * @description Étend la classe HCT du package Material avec helpers hex/RGB K3UI.
 * Les factory upstream renvoient des instances du prototype package : on réapplique
 * `Hct.prototype` pour exposer toHex / toRgb / etc.
 */

import { Hct as UpstreamHct } from '@material/material-color-utilities';
import { argbToHex, hexToArgb } from './color-format';

/**
 * Réapplique le prototype K3UI sur une instance créée par le package.
 * @param instance - Instance HCT upstream
 */
function asK3uiHct(instance: UpstreamHct): Hct {
    Object.setPrototypeOf(instance, Hct.prototype);
    return instance as Hct;
}

/**
 * Représente une couleur dans l'espace HCT (Hue, Chroma, Tone)
 */
export class Hct extends UpstreamHct {
    /**
     * Crée une instance HCT depuis des valeurs HCT
     * @param hue - Teinte en degrés (0-360)
     * @param chroma - Chroma (0-~150)
     * @param tone - Ton/Luminosité (0-100)
     */
    static from(hue: number, chroma: number, tone: number): Hct {
        return asK3uiHct(UpstreamHct.from(hue, chroma, tone));
    }

    /**
     * Crée une instance HCT depuis une couleur ARGB (32 bits)
     * @param argb - Couleur ARGB (ex: 0xFF006493)
     */
    static fromInt(argb: number): Hct {
        return asK3uiHct(UpstreamHct.fromInt(argb));
    }

    /**
     * Crée une instance HCT depuis une couleur hexadécimale
     * @param hex - Couleur hexadécimale (ex: #006493 ou 006493)
     */
    static fromHex(hex: string): Hct {
        return Hct.fromInt(hexToArgb(hex));
    }

    /**
     * Convertit la couleur HCT en hexadécimal
     * @param includeAlpha - Inclure le canal alpha (défaut: false)
     */
    toHex(includeAlpha: boolean = false): string {
        const argb = this.toInt();

        if (includeAlpha) {
            return `#${argb.toString(16).padStart(8, '0').toUpperCase()}`;
        }

        return argbToHex(argb);
    }

    /**
     * Convertit la couleur HCT en RGB
     */
    toRgb(): { r: number; g: number; b: number } {
        const argb = this.toInt();
        return {
            r: (argb >> 16) & 0xff,
            g: (argb >> 8) & 0xff,
            b: argb & 0xff,
        };
    }

    /**
     * Convertit la couleur HCT en RGB string
     */
    toRgbString(): string {
        const rgb = this.toRgb();
        return `${rgb.r}, ${rgb.g}, ${rgb.b}`;
    }

    /**
     * Modifie la teinte
     * @param hue - Nouvelle teinte (0-360)
     */
    setHue(hue: number): void {
        this.hue = hue;
    }

    /**
     * Modifie le chroma
     * @param chroma - Nouveau chroma (0-~150)
     */
    setChroma(chroma: number): void {
        this.chroma = chroma;
    }

    /**
     * Modifie le ton
     * @param tone - Nouveau ton (0-100)
     */
    setTone(tone: number): void {
        this.tone = tone;
    }

    /**
     * Obtient l'instance HCT (compatibilité schémas)
     */
    toMaterialHct(): Hct {
        return this;
    }
}
