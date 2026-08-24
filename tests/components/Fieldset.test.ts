/// <reference types="@jest/globals" />
/**
 * Tests unitaires pour Fieldset et régressions Field (adornements)
 */

import { Field } from '../../src/components/Field';
import { Fieldset } from '../../src/components/Fieldset';

describe('Field adornements label', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    test('data-leading est posé quand une icône leading est présente', () => {
        const el = document.createElement('k3ui-field');
        el.setAttribute('label', 'Email');
        document.body.appendChild(el);

        new Field(el, { leadingIcon: 'envelope' });

        expect(el.hasAttribute('data-leading')).toBe(true);
        expect(el.style.getPropertyValue('--k3ui-field-label-inset-start')).toBe('52px');
    });

    test('data-trailing est posé quand une icône trailing est présente', () => {
        const el = document.createElement('k3ui-field');
        el.setAttribute('label', 'Recherche');
        document.body.appendChild(el);

        new Field(el, { trailingIcon: 'magnifying-glass' });

        expect(el.hasAttribute('data-trailing')).toBe(true);
        expect(el.style.getPropertyValue('--k3ui-field-label-inset-end')).toBe('52px');
    });

    test('setError et clearError pilotent invalid', () => {
        const el = document.createElement('k3ui-field');
        el.setAttribute('label', 'SIREN');
        document.body.appendChild(el);

        const instance = new Field(el, { name: 'siren', required: true });
        instance.setError('SIREN invalide');

        expect(el.hasAttribute('invalid')).toBe(true);
        expect(instance.checkValidity()).toBe(false);

        instance.clearError();
        expect(el.hasAttribute('invalid')).toBe(false);
    });
});

describe('Fieldset', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <form id="form">
                <k3ui-fieldset headline="Identité" supporting-text="Informations légales" class="no-autoinit">
                    <k3ui-field class="no-autoinit" label="Nom" name="name" required></k3ui-field>
                    <k3ui-field class="no-autoinit" label="Prénom" name="firstname"></k3ui-field>
                </k3ui-fieldset>
            </form>
        `;
    });

    test('initialise la structure fieldset', () => {
        const el = document.querySelector('k3ui-fieldset') as HTMLElement;
        const group = Fieldset.init(el) as Fieldset;

        expect(group).toBeDefined();
        expect(el.querySelector('.fieldset__container')).toBeTruthy();
        expect(el.querySelector('.fieldset__fields k3ui-field')).toBeTruthy();
        expect(Fieldset.getInstance(el)).toBe(group);
    });

    test('reportGroupValidity détecte les champs invalides', () => {
        const el = document.querySelector('k3ui-fieldset') as HTMLElement;
        const group = Fieldset.init(el) as Fieldset;

        Field.init(el.querySelector('k3ui-field[name="name"]') as HTMLElement, { required: true });
        Field.init(el.querySelector('k3ui-field[name="firstname"]') as HTMLElement, {});

        const valid = group.reportGroupValidity();
        expect(valid).toBe(false);
        expect(el.hasAttribute('data-error')).toBe(true);
    });

    test('désactiver le groupe désactive les champs natifs', () => {
        const el = document.querySelector('k3ui-fieldset') as HTMLElement;
        el.setAttribute('disabled', '');

        const group = Fieldset.init(el, { disabled: true }) as Fieldset;

        Field.init(el.querySelector('k3ui-field[name="name"]') as HTMLElement, {});
        Field.init(el.querySelector('k3ui-field[name="firstname"]') as HTMLElement, {});

        group.init();

        expect(group.controls.length).toBeGreaterThan(0);
        expect(group.controls.every((control) => control.matches(':disabled'))).toBe(true);
    });

    test('propage la densité aux champs', () => {
        document.body.innerHTML = `
            <k3ui-fieldset class="no-autoinit" headline="Test" density="comfortable">
                <k3ui-field class="no-autoinit" label="A" name="a"></k3ui-field>
            </k3ui-fieldset>
        `;

        const el = document.querySelector('k3ui-fieldset') as HTMLElement;
        Fieldset.init(el, { density: 'comfortable' });
        Field.init(el.querySelector('k3ui-field') as HTMLElement, {});

        const field = el.querySelector('k3ui-field') as HTMLElement;
        expect(field.getAttribute('density')).toBe('comfortable');
    });

    test('hérite la densité du fieldset dans Field', () => {
        document.body.innerHTML = `
            <k3ui-fieldset class="no-autoinit" headline="Densité" density="compact">
                <k3ui-field class="no-autoinit" label="B" name="b"></k3ui-field>
            </k3ui-fieldset>
        `;

        const fieldEl = document.querySelector('k3ui-field') as HTMLElement;
        Fieldset.init(document.querySelector('k3ui-fieldset') as HTMLElement, { density: 'compact' });
        Field.init(fieldEl, {});

        expect(fieldEl.getAttribute('density')).toBe('compact');
    });
});

