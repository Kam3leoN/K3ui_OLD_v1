/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant Radio
 */

import { Radio } from '../../src/components/Radio';

describe('Radio', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="radio"></div>';
    });

    test('initialise et stocke l\'instance sur l\'élément', () => {
        const el = document.getElementById('radio') as HTMLElement;
        const instance = new Radio(el);

        expect(instance).toBeDefined();
        expect(Radio.getInstance(el)).toBe(instance);
        expect(el.classList.contains('radio')).toBe(true);
    });

    test('Radio initialise avec état checked par défaut', () => {
        const el = document.getElementById('radio') as HTMLElement;
        el.setAttribute('checked', '');
        const instance = new Radio(el);

        expect(instance.getChecked()).toBe(true);
        expect(el.classList.contains('radio--checked')).toBe(true);
    });

    test('Radio initialise avec état disabled', () => {
        const el = document.getElementById('radio') as HTMLElement;
        el.setAttribute('disabled', '');
        const instance = new Radio(el);

        expect(instance.options.disabled).toBe(true);
        expect(el.classList.contains('radio--disabled')).toBe(true);
    });

    test('Radio initialise avec état error', () => {
        const el = document.getElementById('radio') as HTMLElement;
        el.setAttribute('error', '');
        const instance = new Radio(el);

        expect(instance.options.error).toBe(true);
        expect(el.classList.contains('radio--error')).toBe(true);
    });

    test('Radio initialise avec label', () => {
        const el = document.getElementById('radio') as HTMLElement;
        el.setAttribute('data-label', 'Option 1');
        const instance = new Radio(el);

        expect(instance.options.label).toBe('Option 1');
        const labelEl = el.querySelector('.radio__label') as HTMLElement;
        expect(labelEl).toBeTruthy();
        expect(labelEl.textContent).toBe('Option 1');
    });

    test('Radio initialise avec name et value', () => {
        const el = document.getElementById('radio') as HTMLElement;
        el.setAttribute('data-name', 'payment');
        el.setAttribute('data-value', 'credit');
        const instance = new Radio(el);

        expect(instance.options.name).toBe('payment');
        expect(instance.options.value).toBe('credit');
    });

    test('Radio setChecked met à jour l\'état', () => {
        const el = document.getElementById('radio') as HTMLElement;
        const instance = new Radio(el);

        instance.setChecked(true);
        expect(instance.getChecked()).toBe(true);
        expect(el.classList.contains('radio--checked')).toBe(true);
    });

    test('Radio setChecked(false) ne fait rien (un radio ne peut pas être désélectionné directement)', () => {
        const el = document.getElementById('radio') as HTMLElement;
        const instance = new Radio(el);

        instance.setChecked(true);
        expect(instance.getChecked()).toBe(true);

        instance.setChecked(false);
        // Le radio reste checked car il ne peut pas être désélectionné directement
        expect(instance.getChecked()).toBe(true);
    });

    test('Radio toggle sélectionne si non sélectionné', () => {
        const el = document.getElementById('radio') as HTMLElement;
        const instance = new Radio(el);

        expect(instance.getChecked()).toBe(false);
        instance.toggle();
        expect(instance.getChecked()).toBe(true);
    });

    test('Radio toggle ne fait rien si déjà sélectionné', () => {
        const el = document.getElementById('radio') as HTMLElement;
        const instance = new Radio(el);

        instance.setChecked(true);
        expect(instance.getChecked()).toBe(true);
        
        // Toggle ne devrait pas désélectionner un radio
        instance.toggle();
        expect(instance.getChecked()).toBe(true);
    });

    test('Radio getInstance retourne l\'instance existante', () => {
        const el = document.getElementById('radio') as HTMLElement;
        const instance1 = new Radio(el);
        const instance2 = Radio.getInstance(el);

        expect(instance2).toBe(instance1);
    });

    test('Radio init avec élément unique retourne une instance', () => {
        const el = document.getElementById('radio') as HTMLElement;
        const instance = Radio.init(el);

        expect(instance).toBeInstanceOf(Radio);
        expect(Radio.getInstance(el)).toBe(instance);
    });

    test('Radio init avec plusieurs éléments retourne un tableau', () => {
        document.body.innerHTML = `
            <div class="radio" id="r1"></div>
            <div class="radio" id="r2"></div>
        `;
        const elements = document.querySelectorAll('.radio');
        const instances = Radio.init(elements);

        expect(Array.isArray(instances)).toBe(true);
        expect(instances.length).toBe(2);
        instances.forEach(instance => {
            expect(instance).toBeInstanceOf(Radio);
        });
    });

    test('Radio déclenche onToggle lors du toggle', async () => {
        const el = document.getElementById('radio') as HTMLElement;
        const onToggle = jest.fn();
        new Radio(el, { onToggle });

        const input = el.querySelector('.radio__input') as HTMLInputElement;
        input.click();
        await new Promise((resolve) => setTimeout(resolve, 350));

        expect(onToggle).toHaveBeenCalledWith(el, true);
    });

    test('Radio déclenche onChange lors du changement', () => {
        const el = document.getElementById('radio') as HTMLElement;
        const onChange = jest.fn();
        new Radio(el, { onChange });

        const input = el.querySelector('.radio__input') as HTMLInputElement;
        input.click();
        expect(onChange).toHaveBeenCalledWith(el, true);
    });

    test('Radio déclenche onFocus lors du focus', () => {
        const el = document.getElementById('radio') as HTMLElement;
        const onFocus = jest.fn();
        const instance = new Radio(el, { onFocus });

        const input = el.querySelector('.radio__input') as HTMLInputElement;
        if (input) {
            input.dispatchEvent(new FocusEvent('focus'));
            expect(onFocus).toHaveBeenCalledWith(el);
            expect(el.classList.contains('radio--focused')).toBe(true);
        }
    });

    test('Radio déclenche onBlur lors du blur', () => {
        const el = document.getElementById('radio') as HTMLElement;
        const onBlur = jest.fn();
        const instance = new Radio(el, { onBlur });

        const input = el.querySelector('.radio__input') as HTMLInputElement;
        if (input) {
            el.classList.add('radio--focused');
            input.dispatchEvent(new FocusEvent('blur'));
            expect(onBlur).toHaveBeenCalledWith(el);
            expect(el.classList.contains('radio--focused')).toBe(false);
        }
    });

    test('Radio ne peut pas être modifié quand disabled', () => {
        const el = document.getElementById('radio') as HTMLElement;
        const instance = new Radio(el, { disabled: true });

        instance.setChecked(true);
        expect(instance.getChecked()).toBe(false);

        instance.toggle();
        expect(instance.getChecked()).toBe(false);
    });

    test('Radio crée la structure DOM correcte', () => {
        const el = document.getElementById('radio') as HTMLElement;
        const instance = new Radio(el);

        expect(el.querySelector('.radio__container')).toBeTruthy();
        expect(el.querySelector('.radio__state-layer')).toBeTruthy();
        expect(el.querySelector('.radio__dot')).toBeTruthy();
        expect(el.querySelector('.radio__input')).toBeTruthy();
    });

    test('Radio met à jour le dot selon l\'état', () => {
        const el = document.getElementById('radio') as HTMLElement;
        const instance = new Radio(el);

        // État checked : dot visible
        instance.setChecked(true);
        expect(el.classList.contains('radio--checked')).toBe(true);
        const dotChecked = el.querySelector('.radio__dot') as HTMLElement;
        expect(dotChecked).toBeTruthy();

        // Note: Le dot n'est pas retiré car on ne peut pas désélectionner un radio directement
    });

    test('Radio désélectionne les autres radios du même groupe', () => {
        document.body.innerHTML = `
            <div class="radio" id="r1" data-name="group1"></div>
            <div class="radio" id="r2" data-name="group1"></div>
            <div class="radio" id="r3" data-name="group1"></div>
        `;
        const r1 = document.getElementById('r1') as HTMLElement;
        const r2 = document.getElementById('r2') as HTMLElement;
        const r3 = document.getElementById('r3') as HTMLElement;

        const instance1 = new Radio(r1);
        const instance2 = new Radio(r2);
        const instance3 = new Radio(r3);

        // Sélectionner r2
        instance2.setChecked(true);
        expect(instance2.getChecked()).toBe(true);

        // Sélectionner r1 devrait désélectionner r2
        instance1.setChecked(true);
        expect(instance1.getChecked()).toBe(true);
        expect(instance2.getChecked()).toBe(false);
        expect(instance3.getChecked()).toBe(false);
    });

    test('Radio ne désélectionne pas les radios d\'un autre groupe', () => {
        document.body.innerHTML = `
            <div class="radio" id="r1" data-name="group1"></div>
            <div class="radio" id="r2" data-name="group2"></div>
        `;
        const r1 = document.getElementById('r1') as HTMLElement;
        const r2 = document.getElementById('r2') as HTMLElement;

        const instance1 = new Radio(r1);
        const instance2 = new Radio(r2);

        // Sélectionner r1
        instance1.setChecked(true);
        expect(instance1.getChecked()).toBe(true);

        // Sélectionner r2 ne devrait pas désélectionner r1 (groupes différents)
        instance2.setChecked(true);
        expect(instance1.getChecked()).toBe(true);
        expect(instance2.getChecked()).toBe(true);
    });

    test('Radio destroy nettoie l\'instance', () => {
        const el = document.getElementById('radio') as HTMLElement;
        const instance = new Radio(el);

        instance.destroy();
        expect(Radio.getInstance(el)).toBeFalsy();
    });

    test('Radio defaults retourne les options par défaut', () => {
        const defaults = Radio.defaults;
        expect(defaults).toBeDefined();
        expect(defaults.checked).toBe(false);
        expect(defaults.disabled).toBe(false);
        expect(defaults.error).toBe(false);
    });

    test('Radio gère les attributs ARIA correctement', () => {
        const el = document.getElementById('radio') as HTMLElement;
        const instance = new Radio(el);

        const input = el.querySelector('.radio__input') as HTMLInputElement;
        expect(input).toBeTruthy();
        expect(input.getAttribute('role')).toBe('radio');

        // État unchecked : `setAriaAttribute(..., false)` retire l'attribut
        expect(input.hasAttribute('aria-checked')).toBe(false);

        // État checked
        instance.setChecked(true);
        expect(input.getAttribute('aria-checked')).toBe('true');
    });

    test('Radio gère les attributs ARIA disabled', () => {
        const el = document.getElementById('radio') as HTMLElement;
        const instance = new Radio(el, { disabled: true });

        const input = el.querySelector('.radio__input') as HTMLInputElement;
        expect(input).toBeTruthy();
        expect(input.getAttribute('aria-disabled')).toBe('true');

        instance.options.disabled = false;
        instance.updateState();
        expect(input.getAttribute('aria-disabled')).toBeNull();
    });
});










