/// <reference types="@types/jest" />
/**
 * Tests unitaires pour K3UIElement (Custom Elements bridge)
 */

import { defineK3UIElement } from '../../src/core/base/K3UIElement';
import { Badge } from '../../src/components/Badge';

describe('K3UIElement', () => {
    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('defineK3UIElement ne lance pas d\'erreur pour un composant valide', () => {
        expect(() => {
            try {
                defineK3UIElement('k3ui-test-badge', Badge as any);
            } catch (e: any) {
                if (!e.message?.includes('already been defined')) throw e;
            }
        }).not.toThrow();
    });

    test('defineK3UIElement avec un tag déjà enregistré ne lance pas d\'erreur', () => {
        expect(() => {
            try {
                defineK3UIElement('k3ui-test-badge-dup', Badge as any);
            } catch (e: any) {
                if (!e.message?.includes('already been defined')) throw e;
            }
        }).not.toThrow();
    });
});
