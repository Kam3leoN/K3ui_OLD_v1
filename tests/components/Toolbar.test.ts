/**
 * Tests unitaires — Toolbar M3
 */

import { Toolbar } from '../../src/components/Toolbar';
import { ButtonSplit } from '../../src/components/ButtonSplit';

describe('Toolbar', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="root"></div>';
    });

    it('crée une instance avec options par défaut', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new Toolbar(el, {});
        expect(instance).toBeDefined();
        expect(Toolbar.getInstance(el)).toBe(instance);
        expect(el.classList.contains('toolbar')).toBe(true);
        expect(el.classList.contains('toolbar--floating')).toBe(true);
        expect(el.classList.contains('toolbar--tonal')).toBe(true);
    });

    it('construit les items icônes + tooltips (pas de labels visibles)', () => {
        const el = document.getElementById('root') as HTMLElement;
        new Toolbar(el, {
            items: [
                { id: 'a', icon: 'edit', tooltip: 'Edit' },
                { id: 'b', icon: 'share', label: 'Share' },
            ],
        });
        expect(el.querySelectorAll('.toolbar__item').length).toBe(2);
        expect(el.querySelector('.toolbar__item-label')).toBeNull();
        expect(el.querySelector('[data-tooltip="Edit"]')).toBeTruthy();
        expect(el.querySelector('[data-tooltip="Share"]')).toBeTruthy();
    });

    it('gère la sélection checkable', () => {
        const el = document.getElementById('root') as HTMLElement;
        const onSelect = jest.fn();
        const instance = new Toolbar(el, {
            items: [
                { id: 'a', icon: 'edit' },
                { id: 'b', icon: 'share' },
            ],
            checkable: true,
            defaultSelected: [0],
            onSelect,
        });
        const buttons = el.querySelectorAll('.toolbar__item');
        expect(buttons[0].classList.contains('toolbar__item--active')).toBe(true);
        (buttons[1] as HTMLButtonElement).click();
        expect(onSelect).toHaveBeenCalled();
        expect(instance.getSelectedIndices()).toEqual([1]);
    });

    it('applique data-layout et data-variant (elevated|filled|tonal)', () => {
        const el = document.getElementById('root') as HTMLElement;
        el.setAttribute('data-layout', 'docked');
        el.setAttribute('data-variant', 'filled');
        new Toolbar(el, { items: [{ id: 'x', icon: 'add' }] });
        expect(el.classList.contains('toolbar--docked')).toBe(true);
        expect(el.classList.contains('toolbar--filled')).toBe(true);
    });

    it('mappe les anciennes variantes legacy vers tonal/filled', () => {
        const el = document.getElementById('root') as HTMLElement;
        el.setAttribute('data-variant', 'vibrant');
        new Toolbar(el, { items: [{ id: 'x', icon: 'add' }] });
        expect(el.classList.contains('toolbar--filled')).toBe(true);
    });

    it('supporte le mode bare', () => {
        const el = document.getElementById('root') as HTMLElement;
        new Toolbar(el, {
            showContainer: false,
            items: [{ id: 'a', icon: 'edit', tooltip: 'Edit' }],
        });
        expect(el.classList.contains('toolbar--bare')).toBe(true);
        expect(el.querySelector('.toolbar__item--icon-only')).toBeTruthy();
    });

    it('construit un item dual via ButtonSplit', () => {
        const el = document.getElementById('root') as HTMLElement;
        new Toolbar(el, {
            showContainer: false,
            items: [
                {
                    id: 'mic',
                    icon: 'microphone',
                    secondaryIcon: 'chevron-up',
                    dualAction: true,
                    secondaryAriaLabel: 'Options micro',
                },
            ],
        });
        expect(el.querySelector('.toolbar__split.split-btn, .toolbar__split.button-split')).toBeTruthy();
        expect(el.querySelector('.split-btn__leading, .button-split__leading')).toBeTruthy();
        expect(el.querySelector('.split-btn__trailing, .button-split__trailing')).toBeTruthy();
        const trailing = el.querySelector('.split-btn__trailing, .button-split__trailing') as HTMLElement;
        expect(trailing.getAttribute('aria-label')).toBe('Options micro');
        expect(trailing.getAttribute('data-part')).toBe('secondary');
        expect(ButtonSplit.getInstance(el.querySelector('.toolbar__split') as HTMLElement)).toBeTruthy();
    });

    it('applique ButtonIcon wide / narrow / default', () => {
        const el = document.getElementById('root') as HTMLElement;
        new Toolbar(el, {
            checkable: false,
            items: [
                { id: 'a', icon: 'edit', width: 'narrow' },
                { id: 'b', icon: 'share' },
                { id: 'c', icon: 'phone', width: 'wide' },
            ],
        });
        const buttons = el.querySelectorAll('.toolbar__item');
        expect(buttons[0].classList.contains('btn-icon--narrow')).toBe(true);
        expect(buttons[1].classList.contains('btn-icon--narrow')).toBe(false);
        expect(buttons[1].classList.contains('btn-icon--wide')).toBe(false);
        expect(buttons[2].classList.contains('btn-icon--wide')).toBe(true);
    });

    it('élargit en wide l’item sélectionné (sans width verrouillée)', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new Toolbar(el, {
            checkable: true,
            defaultSelected: [0],
            items: [
                { id: 'a', icon: 'edit' },
                { id: 'b', icon: 'share' },
            ],
        });
        const buttons = el.querySelectorAll('.toolbar__item');
        expect(buttons[0].classList.contains('btn-icon--wide')).toBe(true);
        (buttons[1] as HTMLButtonElement).click();
        expect(instance.getSelectedIndices()).toEqual([1]);
        expect(buttons[0].classList.contains('btn-icon--wide')).toBe(false);
        expect(buttons[1].classList.contains('btn-icon--wide')).toBe(true);
    });

    it('destroy nettoie l’instance', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new Toolbar(el, { items: [{ id: 'a', icon: 'add' }] });
        instance.destroy();
        expect(Toolbar.getInstance(el)).toBeFalsy();
    });
});
