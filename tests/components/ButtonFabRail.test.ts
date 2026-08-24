/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant ButtonFabRail
 */

jest.mock('../../src/core/managers/IconManager', () => ({
    IconManager: {
        processIconsInContainer: jest.fn(),
        forceDisplayIcons: jest.fn(),
    },
}));

import { ButtonFabRail } from '../../src/components/ButtonFabRail';
import { ensurePointerAndAnimatePolyfills } from '../helpers/pointer-polyfill';

const defaultItems = [
    { id: 'photo', label: 'Photo', icon: 'camera' },
    { id: 'gallery', label: 'Galerie', icon: 'image' },
];

describe('ButtonFabRail', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="root"></div>';
        ensurePointerAndAnimatePolyfills();
    });

    it('devrait créer une instance avec les options par défaut', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new ButtonFabRail(el, {});
        expect(instance).toBeDefined();
        expect(ButtonFabRail.getInstance(el)).toBe(instance);
        expect(el.classList.contains('button-fab-rail')).toBe(true);
        expect(instance.isOpen()).toBe(false);
    });

    it('devrait construire le DOM quand items est fourni', () => {
        const el = document.getElementById('root') as HTMLElement;
        new ButtonFabRail(el, { items: defaultItems });
        expect(el.querySelectorAll('.button-fab-rail__action').length).toBe(2);
        expect(el.querySelector('.button-fab-rail__scrim')).toBeTruthy();
    });

    it('devrait ouvrir et fermer le rail', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new ButtonFabRail(el, { items: defaultItems });
        instance.openRail();
        expect(instance.isOpen()).toBe(true);
        expect(el.getAttribute('data-open')).toBe('true');
        instance.closeRail();
        expect(instance.isOpen()).toBe(false);
    });

    it('devrait limiter à 5 actions maximum', () => {
        const el = document.getElementById('root') as HTMLElement;
        const items = Array.from({ length: 7 }, (_, i) => ({
            id: `a${i}`,
            label: `Action ${i}`,
            icon: 'edit',
        }));
        new ButtonFabRail(el, { items });
        expect(el.querySelectorAll('.button-fab-rail__action').length).toBe(5);
    });
});
