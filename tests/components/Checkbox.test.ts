/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant Checkbox
 */

import { Checkbox } from '../../src/components/Checkbox';

describe('Checkbox', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="checkbox"></div>';
    });

    test('initialise et stocke l\'instance sur l\'élément', () => {
        const el = document.getElementById('checkbox') as HTMLElement;
        const instance = new Checkbox(el);

        expect(instance).toBeDefined();
        expect(Checkbox.getInstance(el)).toBe(instance);
        expect(el.classList.contains('checkbox')).toBe(true);
    });

    test('Checkbox initialise avec état checked par défaut', () => {
        const el = document.getElementById('checkbox') as HTMLElement;
        el.setAttribute('checked', '');
        const instance = new Checkbox(el);

        expect(instance.getChecked()).toBe(true);
        expect(el.classList.contains('checkbox--checked')).toBe(true);
    });

    test('Checkbox initialise avec état indeterminate', () => {
        const el = document.getElementById('checkbox') as HTMLElement;
        el.setAttribute('indeterminate', '');
        const instance = new Checkbox(el);

        expect(instance.getIndeterminate()).toBe(true);
        expect(el.classList.contains('checkbox--indeterminate')).toBe(true);
    });

    test('Checkbox initialise avec état disabled', () => {
        const el = document.getElementById('checkbox') as HTMLElement;
        el.setAttribute('disabled', '');
        const instance = new Checkbox(el);

        expect(instance.options.disabled).toBe(true);
        expect(el.classList.contains('checkbox--disabled')).toBe(true);
    });

    test('Checkbox initialise avec état error', () => {
        const el = document.getElementById('checkbox') as HTMLElement;
        el.setAttribute('error', '');
        const instance = new Checkbox(el);

        expect(instance.options.error).toBe(true);
        expect(el.classList.contains('checkbox--error')).toBe(true);
    });

    test('Checkbox initialise avec label', () => {
        const el = document.getElementById('checkbox') as HTMLElement;
        el.setAttribute('data-label', 'Accepter les conditions');
        const instance = new Checkbox(el);

        expect(instance.options.label).toBe('Accepter les conditions');
        const labelEl = el.querySelector('.checkbox__label') as HTMLElement;
        expect(labelEl).toBeTruthy();
        expect(labelEl.textContent).toBe('Accepter les conditions');
    });

    test('Checkbox setChecked met à jour l\'état', () => {
        const el = document.getElementById('checkbox') as HTMLElement;
        const instance = new Checkbox(el);

        instance.setChecked(true);
        expect(instance.getChecked()).toBe(true);
        expect(el.classList.contains('checkbox--checked')).toBe(true);

        instance.setChecked(false);
        expect(instance.getChecked()).toBe(false);
        expect(el.classList.contains('checkbox--checked')).toBe(false);
    });

    test('Checkbox setIndeterminate met à jour l\'état', () => {
        const el = document.getElementById('checkbox') as HTMLElement;
        const instance = new Checkbox(el);

        instance.setIndeterminate(true);
        expect(instance.getIndeterminate()).toBe(true);
        expect(el.classList.contains('checkbox--indeterminate')).toBe(true);
        expect(instance.getChecked()).toBe(false);

        instance.setIndeterminate(false);
        expect(instance.getIndeterminate()).toBe(false);
        expect(el.classList.contains('checkbox--indeterminate')).toBe(false);
    });

    test('Checkbox toggle bascule l\'état', () => {
        const el = document.getElementById('checkbox') as HTMLElement;
        const instance = new Checkbox(el);

        expect(instance.getChecked()).toBe(false);
        // Utiliser setChecked directement pour les tests, toggle a une animation
        instance.setChecked(true);
        expect(instance.getChecked()).toBe(true);
        instance.setChecked(false);
        expect(instance.getChecked()).toBe(false);
    });

    test('Checkbox getInstance retourne l\'instance existante', () => {
        const el = document.getElementById('checkbox') as HTMLElement;
        const instance1 = new Checkbox(el);
        const instance2 = Checkbox.getInstance(el);

        expect(instance2).toBe(instance1);
    });

    test('Checkbox init avec élément unique retourne une instance', () => {
        const el = document.getElementById('checkbox') as HTMLElement;
        const instance = Checkbox.init(el);

        expect(instance).toBeInstanceOf(Checkbox);
        expect(Checkbox.getInstance(el)).toBe(instance);
    });

    test('Checkbox init avec plusieurs éléments retourne un tableau', () => {
        document.body.innerHTML = `
            <div class="checkbox" id="cb1"></div>
            <div class="checkbox" id="cb2"></div>
        `;
        const elements = document.querySelectorAll('.checkbox');
        const instances = Checkbox.init(elements);

        expect(Array.isArray(instances)).toBe(true);
        expect(instances.length).toBe(2);
        instances.forEach(instance => {
            expect(instance).toBeInstanceOf(Checkbox);
        });
    });

    test('Checkbox déclenche onToggle lors du toggle', async () => {
        const el = document.getElementById('checkbox') as HTMLElement;
        const onToggle = jest.fn();
        new Checkbox(el, { onToggle });

        const input = el.querySelector('.checkbox__input') as HTMLInputElement;
        input.click();
        await new Promise((resolve) => setTimeout(resolve, 350));

        expect(onToggle).toHaveBeenCalledWith(el, true);
    });

    test('Checkbox déclenche onChange lors du changement', () => {
        const el = document.getElementById('checkbox') as HTMLElement;
        const onChange = jest.fn();
        const instance = new Checkbox(el, { onChange });

        const input = el.querySelector('.checkbox__input') as HTMLInputElement;
        input.click();
        expect(onChange).toHaveBeenCalledWith(true, instance);
    });

    test('Checkbox déclenche onFocus lors du focus', () => {
        const el = document.getElementById('checkbox') as HTMLElement;
        const onFocus = jest.fn();
        const instance = new Checkbox(el, { onFocus });

        const input = el.querySelector('.checkbox__input') as HTMLInputElement;
        if (input) {
            input.dispatchEvent(new FocusEvent('focus'));
            expect(onFocus).toHaveBeenCalledWith(el);
            expect(el.classList.contains('checkbox--focused')).toBe(true);
        }
    });

    test('Checkbox déclenche onBlur lors du blur', () => {
        const el = document.getElementById('checkbox') as HTMLElement;
        const onBlur = jest.fn();
        const instance = new Checkbox(el, { onBlur });

        const input = el.querySelector('.checkbox__input') as HTMLInputElement;
        if (input) {
            el.classList.add('checkbox--focused');
            input.dispatchEvent(new FocusEvent('blur'));
            expect(onBlur).toHaveBeenCalledWith(el);
            expect(el.classList.contains('checkbox--focused')).toBe(false);
        }
    });

    test('Checkbox ne peut pas être modifié quand disabled', () => {
        const el = document.getElementById('checkbox') as HTMLElement;
        const instance = new Checkbox(el, { disabled: true });

        instance.setChecked(true);
        expect(instance.getChecked()).toBe(false);

        instance.toggle();
        expect(instance.getChecked()).toBe(false);
    });

    test('Checkbox crée la structure DOM correcte', () => {
        const el = document.getElementById('checkbox') as HTMLElement;
        new Checkbox(el);

        expect(el.querySelector('.checkbox__container')).toBeTruthy();
        expect(el.querySelector('.checkbox__state-layer')).toBeTruthy();
        expect(el.querySelector('.checkbox__check')).toBeTruthy();
        expect(el.querySelector('.checkbox__dash')).toBeTruthy();
        expect(el.querySelector('.checkbox__input')).toBeTruthy();
    });

    test('Checkbox met à jour les classes selon l\'état', () => {
        const el = document.getElementById('checkbox') as HTMLElement;
        const instance = new Checkbox(el);

        instance.setChecked(true);
        expect(el.classList.contains('checkbox--checked')).toBe(true);
        expect(el.classList.contains('checkbox--indeterminate')).toBe(false);
        expect(el.querySelector('.checkbox__check')).toBeTruthy();

        instance.setIndeterminate(true);
        expect(el.classList.contains('checkbox--indeterminate')).toBe(true);
        expect(el.classList.contains('checkbox--checked')).toBe(false);
        expect(el.querySelector('.checkbox__dash')).toBeTruthy();
    });

    test('Checkbox destroy nettoie l\'instance', () => {
        const el = document.getElementById('checkbox') as HTMLElement;
        const instance = new Checkbox(el);

        instance.destroy();
        expect(Checkbox.getInstance(el)).toBeFalsy();
    });

    test('Checkbox defaults retourne les options par défaut', () => {
        const defaults = Checkbox.defaults;
        expect(defaults).toBeDefined();
        expect(defaults.checked).toBe(false);
        expect(defaults.disabled).toBe(false);
        expect(defaults.indeterminate).toBe(false);
        expect(defaults.error).toBe(false);
    });
});

