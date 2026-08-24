/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant ButtonFabDial
 */

jest.mock('../../src/core/managers/IconManager', () => ({
    IconManager: {
        processIconsInContainer: jest.fn(),
        forceDisplayIcons: jest.fn(),
    },
}));

import { ButtonFabDial } from '../../src/components/ButtonFabDial';
import { ensurePointerAndAnimatePolyfills } from '../helpers/pointer-polyfill';

const defaultItems = [
    { id: 'photo', label: 'Photo', icon: 'camera' },
    { id: 'poll', label: 'Sondage', icon: 'list' },
];

describe('ButtonFabDial', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="root"></div>';
        ensurePointerAndAnimatePolyfills();
    });

    it('devrait créer une instance avec les options par défaut', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new ButtonFabDial(el, {});
        expect(instance).toBeDefined();
        expect(ButtonFabDial.getInstance(el)).toBe(instance);
        expect(el.classList.contains('button-fab-dial')).toBe(true);
        expect(instance.isOpen()).toBe(false);
    });

    it('devrait construire le DOM quand items est fourni', () => {
        const el = document.getElementById('root') as HTMLElement;
        new ButtonFabDial(el, { items: defaultItems });
        expect(el.querySelectorAll('.button-fab-dial__action').length).toBe(2);
        expect(el.querySelector('.button-fab-dial__scrim')).toBeTruthy();
    });

    it('devrait ouvrir et fermer le dial', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new ButtonFabDial(el, { items: defaultItems });
        instance.openDial();
        expect(instance.isOpen()).toBe(true);
        expect(el.getAttribute('data-open')).toBe('true');
        instance.closeDial();
        expect(instance.isOpen()).toBe(false);
    });

    it('devrait appeler onItemClick au clic sur une action', () => {
        const el = document.getElementById('root') as HTMLElement;
        const onItemClick = jest.fn();
        const instance = new ButtonFabDial(el, { items: defaultItems, onItemClick });
        instance.openDial();
        const action = el.querySelector('.button-fab-dial__action') as HTMLButtonElement;
        action.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(onItemClick).toHaveBeenCalled();
        expect(instance.isOpen()).toBe(false);
    });
});
