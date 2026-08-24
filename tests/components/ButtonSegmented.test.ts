/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant ButtonSegmented
 */

import { ButtonSegmented } from '../../src/components/ButtonSegmented';

const defaultSegments = [
    { label: 'Option A' },
    { label: 'Option B' },
    { label: 'Option C' },
];

describe('ButtonSegmented', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="root"></div>';
    });

    it('devrait créer une instance avec les options par défaut (segments vides = pas de rendu)', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new ButtonSegmented(el, {});
        expect(instance).toBeDefined();
        expect(ButtonSegmented.getInstance(el)).toBe(instance);
        expect(el.classList.contains('button-segmented')).toBe(false);
        expect(el.querySelectorAll('.button-segmented__btn').length).toBe(0);
    });

    it('devrait construire le DOM quand segments est fourni', () => {
        const el = document.getElementById('root') as HTMLElement;
        new ButtonSegmented(el, { segments: defaultSegments });
        expect(el.classList.contains('button-segmented')).toBe(true);
        expect(el.querySelectorAll('.button-segmented__btn').length).toBe(3);
        expect(el.getAttribute('role')).toBe('radiogroup');
    });

    it('devrait exposer getInstance', () => {
        const el = document.getElementById('root') as HTMLElement;
        new ButtonSegmented(el, { segments: defaultSegments });
        const instance = ButtonSegmented.getInstance(el);
        expect(instance).toBeDefined();
        expect(instance?.getSelectedIndices()).toEqual([0]);
    });

    it('devrait accepter des options personnalisées (shape, multiSelect)', () => {
        const el = document.getElementById('root') as HTMLElement;
        new ButtonSegmented(el, {
            segments: defaultSegments,
            shape: 'square',
            multiSelect: true,
        });
        expect(el.classList.contains('button-segmented--square')).toBe(true);
        expect(el.getAttribute('role')).toBe('group');
    });

    it('devrait lire data-segments, data-shape, data-multi-select sur l\'élément', () => {
        const el = document.getElementById('root') as HTMLElement;
        el.setAttribute('data-segments', JSON.stringify([{ label: 'X' }, { label: 'Y' }]));
        el.setAttribute('data-shape', 'square');
        el.setAttribute('data-multi-select', 'true');
        new ButtonSegmented(el, {});
        expect(el.querySelectorAll('.button-segmented__btn').length).toBe(2);
        expect(el.classList.contains('button-segmented--square')).toBe(true);
        expect(el.getAttribute('role')).toBe('group');
    });

    it('devrait appliquer defaultSelected et multiSelect', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new ButtonSegmented(el, {
            segments: defaultSegments,
            multiSelect: true,
            defaultSelected: [0, 2],
        });
        expect(instance.getSelectedIndices()).toEqual([0, 2]);
        const active = el.querySelectorAll('.button-segmented__btn--active');
        expect(active.length).toBe(2);
    });

    it('devrait appeler onSelect lors d\'un clic', () => {
        const el = document.getElementById('root') as HTMLElement;
        const onSelect = jest.fn();
        new ButtonSegmented(el, { segments: defaultSegments, onSelect });
        const second = el.querySelectorAll('.button-segmented__btn')[1] as HTMLButtonElement;
        second.click();
        expect(onSelect).toHaveBeenCalledWith([1]);
    });

    it('getSelectedIndices et setSelectedIndices', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new ButtonSegmented(el, { segments: defaultSegments, multiSelect: true });
        expect(instance.getSelectedIndices()).toEqual([0]);
        instance.setSelectedIndices([1, 2]);
        expect(instance.getSelectedIndices()).toEqual([1, 2]);
        const active = el.querySelectorAll('.button-segmented__btn--active');
        expect(active.length).toBe(2);
    });

    it('devrait détruire proprement', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new ButtonSegmented(el, { segments: defaultSegments });
        instance.destroy();
        expect(ButtonSegmented.getInstance(el)).toBeFalsy();
    });

    it('devrait initialiser via ButtonSegmented.init avec un élément', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = ButtonSegmented.init(el, { segments: defaultSegments }) as ButtonSegmented;
        expect(instance).toBeInstanceOf(ButtonSegmented);
        expect(ButtonSegmented.getInstance(el)).toBe(instance);
    });

    it('devrait initialiser via ButtonSegmented.init avec un sélecteur', () => {
        const el = document.getElementById('root') as HTMLElement;
        el.className = 'button-segmented';
        el.setAttribute('data-segments', JSON.stringify([{ label: 'X' }]));
        const instances = ButtonSegmented.init('#root', {});
        expect(Array.isArray(instances)).toBe(true);
        expect(instances.length).toBe(1);
    });

    it('defaults devrait retourner les options par défaut', () => {
        const def = ButtonSegmented.defaults;
        expect(def.segments).toEqual([]);
        expect(def.shape).toBe('rounded');
        expect(def.multiSelect).toBe(false);
        expect(def.defaultSelected).toEqual([0]);
    });
});
