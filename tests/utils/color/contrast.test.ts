/**
 * Tests façade contrast K3UI vs package Material
 */

import { Contrast } from '../../../src/utils/color/contrast';
import { Contrast as UpstreamContrast } from '@material/material-color-utilities';

describe('Contrast façade', () => {
    test('ratioOfTones délègue à upstream', () => {
        const toneA = 50;
        const toneB = 0;
        expect(Contrast.ratioOfTones(toneA, toneB)).toBe(UpstreamContrast.ratioOfTones(toneA, toneB));
    });

    test('lighter et darker délèguent à upstream', () => {
        expect(Contrast.lighter(40, 4.5)).toBe(UpstreamContrast.lighter(40, 4.5));
        expect(Contrast.darker(80, 4.5)).toBe(UpstreamContrast.darker(80, 4.5));
    });
});
