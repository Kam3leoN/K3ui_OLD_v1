/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant Chips
 */

import { Chip } from '../../src/components/Chip';
import { flushComponentInit } from '../helpers/component-init';

describe('Chips', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="chips" class="chips"></div>';
    });

    test('initialise et stocke l\'instance sur l\'élément', async () => {
        const el = document.getElementById('chips') as HTMLElement;
        const instance = new Chip(el, { data: [] });
        await flushComponentInit();

        expect(instance).toBeDefined();
        expect(Chip.getInstance(el)).toBe(instance);
        expect(el.classList.contains('chips')).toBe(true);
    });

    test('ajoute et supprime un chip', async () => {
        const el = document.getElementById('chips') as HTMLElement;
        const instance = new Chip(el, { data: [] });
        await flushComponentInit();

        instance.addChip({ id: '1', text: 'Alpha' });
        expect(el.querySelectorAll('.chip-wrapper').length).toBe(1);

        instance.deleteChip(0);
        expect(el.querySelectorAll('.chip-wrapper').length).toBe(0);
    });

    test('sélectionne un chip et déclenche onChipSelect', async () => {
        const el = document.getElementById('chips') as HTMLElement;
        const onChipSelect = jest.fn();
        const instance = new Chip(el, { data: [{ id: '1', text: 'A' }, { id: '2', text: 'B' }], onChipSelect });
        await flushComponentInit();

        instance.selectChip(1);
        expect(onChipSelect).toHaveBeenCalled();
        expect(
            (el.querySelectorAll('.chip-wrapper')[1] as HTMLElement).classList.contains('chip--selected')
        ).toBe(true);
    });

    test('updateOptions met à jour les classes d\'état', async () => {
        const el = document.getElementById('chips') as HTMLElement;
        const instance = new Chip(el, { data: [] });
        await flushComponentInit();
        instance.updateOptions({ limit: 1 });
        instance.addChip({ id: '1', text: 'X' });
        // Ajout au-delà de la limite ne doit pas créer de chip
        instance.addChip({ id: '2', text: 'Y' });
        expect(el.querySelectorAll('.chip-wrapper').length).toBe(1);
    });

    test('createInput et addChipFromInput via Enter', async () => {
        const el = document.getElementById('chips') as HTMLElement;
        // allowUserInput pour créer l'input
        const instance = new Chip(el, {
            data: [],
            allowUserInput: true,
            placeholder: 'Ajouter',
        });
        await flushComponentInit();
        const field = el.querySelector('k3ui-field.chips__input-field');
        expect(field).toBeTruthy();
        const input = field?.querySelector('.input') as HTMLInputElement;
        expect(input).toBeTruthy();
        input.value = 'Test';
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
        expect(el.querySelectorAll('.chip-wrapper').length).toBe(1);
    });
});


