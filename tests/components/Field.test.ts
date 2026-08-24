/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant Field
 */

import { Field } from '../../src/components/Field';

describe('Field', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="field" variant="filled" label="Nom" placeholder="Votre nom"></div>';
    });

    test('initialise et expose getInstance', () => {
        const el = document.getElementById('field') as HTMLElement;
        const instance = new Field(el, { name: 'username' });

        expect(instance).toBeDefined();
        expect(Field.getInstance(el)).toBe(instance);
        expect(el.querySelector('.input')).toBeTruthy();
        expect(el.querySelector('.label')?.textContent).toBe('Nom');
    });

    test('setValue met à jour has-value', () => {
        const el = document.getElementById('field') as HTMLElement;
        const instance = new Field(el, {});
        instance.setValue('John');
        expect(instance.getValue()).toBe('John');
        expect(el.hasAttribute('has-value')).toBe(true);
    });

    test('focus/blur mettent à jour les attributs', () => {
        const el = document.getElementById('field') as HTMLElement;
        const instance = new Field(el, {});
        instance.focus();
        expect(el.getAttribute('focused')).toBe('');
        instance.blur();
        expect(el.hasAttribute('focused')).toBe(false);
    });

    test('validation hex_color formate la valeur', () => {
        const el = document.getElementById('field') as HTMLElement;
        const instance = new Field(el, { pattern: 'hex_color', type: 'text' });
        instance.setValue('FF');
        const input = el.querySelector('.input') as HTMLInputElement;
        input.dispatchEvent(new Event('input'));
        // la valeur est préfixée par #
        expect(input.value.startsWith('#')).toBe(true);
    });

    test('required affiche l\'attribut sur le host', () => {
        const el = document.getElementById('field') as HTMLElement;
        el.setAttribute('required', '');
        new Field(el, { label: 'Nom', required: true });
        expect(el.hasAttribute('required')).toBe(true);
    });

    test('clearable affiche le bouton clear quand le champ a une valeur', () => {
        const el = document.getElementById('field') as HTMLElement;
        el.setAttribute('clearable', '');
        const instance = new Field(el, { clearable: true });
        instance.setValue('test');
        const clearButton = el.querySelector('.clear-button') as HTMLElement;
        expect(clearButton).toBeTruthy();
        expect(clearButton.getAttribute('name')).toBe('xmark');
        expect(clearButton.hidden).toBe(false);
    });

    test('clear efface la valeur du champ', () => {
        const el = document.getElementById('field') as HTMLElement;
        el.setAttribute('clearable', '');
        const instance = new Field(el, { clearable: true });
        instance.setValue('test');
        const clearButton = el.querySelector('.clear-button') as HTMLElement;
        clearButton.click();
        expect(instance.getValue()).toBe('');
        expect(clearButton.hidden).toBe(true);
    });

    test('attribut invalid synchronise bordures et classe invalid', () => {
        const el = document.createElement('k3ui-field');
        el.setAttribute('variant', 'outlined');
        el.setAttribute('label', 'Erreur');
        el.setAttribute('invalid', '');
        el.setAttribute('error-text', 'Format invalide');
        document.body.appendChild(el);

        new Field(el, { variant: 'outlined', label: 'Erreur', errorText: 'Format invalide' });

        expect(el.hasAttribute('invalid')).toBe(true);
        expect(el.querySelector('.input-field')?.classList.contains('invalid')).toBe(true);
    });

    test('density comfortable est conservée sur le host après init', () => {
        const el = document.createElement('k3ui-field');
        el.setAttribute('variant', 'outlined');
        el.setAttribute('label', 'Densité');
        el.setAttribute('density', 'comfortable');
        document.body.appendChild(el);

        new Field(el, { density: 'comfortable' });

        expect(el.getAttribute('density')).toBe('comfortable');
        expect(el.dataset.density).toBe('comfortable');
    });
});


