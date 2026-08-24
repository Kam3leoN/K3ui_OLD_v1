/**
 * @fileoverview Utilitaires pour le contraste
 * @description Façade K3UI — délègue le calcul au package Material Color Utilities
 */

import { Contrast as UpstreamContrast } from '@material/material-color-utilities';

/**
 * Niveau de contraste
 * -1 = contraste minimum
 * -0.5 = contraste faible
 * 0 = contraste standard (par défaut)
 * 0.5 = contraste élevé
 * 1 = contraste maximum
 */
export type ContrastLevel = -1 | -0.5 | 0 | 0.5 | 1;

/**
 * Utilitaires pour le contraste
 */
export class Contrast {
    static readonly VALID_LEVELS: readonly ContrastLevel[] = [-1, -0.5, 0, 0.5, 1] as const;
    static readonly DEFAULT_LEVEL: ContrastLevel = 0;

    /**
     * Vérifie si un niveau de contraste est valide
     * @param level - Niveau à vérifier
     * @returns true si le niveau est valide
     */
    static isValid(level: number): level is ContrastLevel {
        return this.VALID_LEVELS.includes(level as ContrastLevel);
    }

    /**
     * Normalise un niveau de contraste (arrondit à la valeur valide la plus proche)
     * @param level - Niveau à normaliser
     * @returns Niveau normalisé
     */
    static normalize(level: number): ContrastLevel {
        if (this.isValid(level)) {
            return level;
        }

        const validLevels = this.VALID_LEVELS as readonly number[];
        let closest = validLevels[0];
        let minDiff = Math.abs(level - closest);

        for (const validLevel of validLevels) {
            const diff = Math.abs(level - validLevel);
            if (diff < minDiff) {
                minDiff = diff;
                closest = validLevel;
            }
        }

        return closest as ContrastLevel;
    }

    static ratioOfTones(toneA: number, toneB: number): number {
        return UpstreamContrast.ratioOfTones(toneA, toneB);
    }

    static ratioOfYs(y1: number, y2: number): number {
        return UpstreamContrast.ratioOfYs(y1, y2);
    }

    static lighter(tone: number, ratio: number): number {
        return UpstreamContrast.lighter(tone, ratio);
    }

    static darker(tone: number, ratio: number): number {
        return UpstreamContrast.darker(tone, ratio);
    }

    static lighterUnsafe(tone: number, ratio: number): number {
        return UpstreamContrast.lighterUnsafe(tone, ratio);
    }

    static darkerUnsafe(tone: number, ratio: number): number {
        return UpstreamContrast.darkerUnsafe(tone, ratio);
    }

    /**
     * Calcule le ratio de contraste entre deux couleurs HCT
     * @param hctA - Première couleur HCT
     * @param hctB - Deuxième couleur HCT
     * @returns Ratio de contraste (1-21)
     */
    static ratioOfHct(hctA: { tone: number }, hctB: { tone: number }): number {
        return this.ratioOfTones(hctA.tone, hctB.tone);
    }

    /**
     * Obtient le label textuel d'un niveau de contraste
     * @param level - Niveau de contraste
     * @returns Label textuel
     */
    static getLabel(level: ContrastLevel): string {
        const labels: Record<ContrastLevel, string> = {
            [-1]: 'Minimum',
            [-0.5]: 'Faible',
            [0]: 'Standard',
            [0.5]: 'Élevé',
            [1]: 'Maximum',
        };
        return labels[level] || 'Standard';
    }
}
