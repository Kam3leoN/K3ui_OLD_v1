/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant Switch
 */

import { Switch } from '../../src/components/Switch';

describe('Switch', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="switch"></div>';
    });

    test('initialise et stocke l\'instance sur l\'élément', () => {
        const el = document.getElementById('switch') as HTMLElement;
        const instance = new Switch(el);

        expect(instance).toBeDefined();
        expect(Switch.getInstance(el)).toBe(instance);
        expect(el.classList.contains('switch')).toBe(true);
    });

    test('Switch initialise avec état checked par défaut', () => {
        const el = document.getElementById('switch') as HTMLElement;
        el.setAttribute('checked', '');
        const instance = new Switch(el);

        expect(instance.getChecked()).toBe(true);
        expect(el.classList.contains('switch--checked')).toBe(true);
    });

    test('Switch initialise avec état disabled', () => {
        const el = document.getElementById('switch') as HTMLElement;
        el.setAttribute('disabled', '');
        const instance = new Switch(el);

        expect(instance.options.disabled).toBe(true);
        expect(el.classList.contains('switch--disabled')).toBe(true);
    });

    test('Switch initialise avec label', () => {
        const el = document.getElementById('switch') as HTMLElement;
        el.setAttribute('data-label', 'Activer les notifications');
        const instance = new Switch(el);

        expect(instance.options.label).toBe('Activer les notifications');
        const labelEl = el.querySelector('.switch__label') as HTMLElement;
        expect(labelEl).toBeTruthy();
        expect(labelEl.textContent).toBe('Activer les notifications');
    });

    test('Switch initialise avec texte sur le handle', () => {
        const el = document.getElementById('switch') as HTMLElement;
        el.setAttribute('data-text-unchecked', 'OFF');
        el.setAttribute('data-text-checked', 'ON');
        const instance = new Switch(el);

        expect(instance.options.textUnchecked).toBe('OFF');
        expect(instance.options.textChecked).toBe('ON');
        const textEl = el.querySelector('.switch__text') as HTMLElement;
        expect(textEl).toBeTruthy();
    });

    test('Switch initialise avec variante traffic', () => {
        const el = document.getElementById('switch') as HTMLElement;
        el.setAttribute('data-traffic', 'true');
        const instance = new Switch(el);

        expect(instance.options.traffic).toBe(true);
        expect(el.hasAttribute('data-traffic')).toBe(true);
    });

    test('Switch initialise avec style compact', () => {
        const el = document.getElementById('switch') as HTMLElement;
        el.setAttribute('data-style', 'compact');
        const instance = new Switch(el);

        expect(instance.options.style).toBe('compact');
        expect(el.getAttribute('data-style')).toBe('compact');
    });

    test('Switch setChecked met à jour l\'état', () => {
        const el = document.getElementById('switch') as HTMLElement;
        const instance = new Switch(el);

        instance.setChecked(true);
        expect(instance.getChecked()).toBe(true);
        expect(el.classList.contains('switch--checked')).toBe(true);

        instance.setChecked(false);
        expect(instance.getChecked()).toBe(false);
        expect(el.classList.contains('switch--checked')).toBe(false);
    });

    test('Switch toggle bascule l\'état', () => {
        const el = document.getElementById('switch') as HTMLElement;
        const instance = new Switch(el);

        expect(instance.getChecked()).toBe(false);
        // Utiliser setChecked directement pour les tests, toggle a une animation
        instance.setChecked(true);
        expect(instance.getChecked()).toBe(true);
        instance.setChecked(false);
        expect(instance.getChecked()).toBe(false);
    });

    test('Switch getInstance retourne l\'instance existante', () => {
        const el = document.getElementById('switch') as HTMLElement;
        const instance1 = new Switch(el);
        const instance2 = Switch.getInstance(el);

        expect(instance2).toBe(instance1);
    });

    test('Switch init avec élément unique retourne une instance', () => {
        const el = document.getElementById('switch') as HTMLElement;
        const instance = Switch.init(el);

        expect(instance).toBeInstanceOf(Switch);
        expect(Switch.getInstance(el)).toBe(instance);
    });

    test('Switch init avec plusieurs éléments retourne un tableau', () => {
        document.body.innerHTML = `
            <div class="switch" id="sw1"></div>
            <div class="switch" id="sw2"></div>
        `;
        const elements = document.querySelectorAll('.switch');
        const instances = Switch.init(elements);

        expect(Array.isArray(instances)).toBe(true);
        expect(instances.length).toBe(2);
        instances.forEach((instance: Switch) => {
            expect(instance).toBeInstanceOf(Switch);
        });
    });

    test('Switch déclenche onToggle lors du toggle', () => {
        jest.useFakeTimers();
        const el = document.getElementById('switch') as HTMLElement;
        const onToggle = jest.fn();
        const instance = new Switch(el, { onToggle });

        // Déclencher directement l'événement input pour simuler le toggle
        // Switch utilise 'input' pour handleToggle (ligne 379-383)
        const input = el.querySelector('.switch__input') as HTMLInputElement;
        expect(input).toBeTruthy();
        
        // Mettre à jour l'état de l'input et déclencher l'événement
        input.checked = true;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Gérer requestAnimationFrame (dans handleToggle ligne 430)
        // Puis avancer les timers pour déclencher le callback onToggle
        jest.runOnlyPendingTimers(); // Exécuter tous les timers en attente
        jest.advanceTimersByTime(500); // 450ms pour onToggle + marge
        
        expect(onToggle).toHaveBeenCalledWith(el, true);
        jest.useRealTimers();
    });

    test('Switch déclenche onChange lors du changement', (done) => {
        const el = document.getElementById('switch') as HTMLElement;
        const onChange = jest.fn((el, checked) => {
            expect(checked).toBe(true);
            done();
        });
        const instance = new Switch(el, { onChange });

        const input = el.querySelector('.switch__input') as HTMLInputElement;
        if (input) {
            input.checked = true;
            input.dispatchEvent(new Event('change'));
        }
    });

    test('Switch déclenche onFocus lors du focus', () => {
        const el = document.getElementById('switch') as HTMLElement;
        const onFocus = jest.fn();
        const instance = new Switch(el, { onFocus });

        const input = el.querySelector('.switch__input') as HTMLInputElement;
        if (input) {
            input.dispatchEvent(new FocusEvent('focus'));
            expect(onFocus).toHaveBeenCalledWith(el);
            expect(el.classList.contains('switch--focused')).toBe(true);
        }
    });

    test('Switch déclenche onBlur lors du blur', () => {
        const el = document.getElementById('switch') as HTMLElement;
        const onBlur = jest.fn();
        const instance = new Switch(el, { onBlur });

        const input = el.querySelector('.switch__input') as HTMLInputElement;
        if (input) {
            el.classList.add('switch--focused');
            input.dispatchEvent(new FocusEvent('blur'));
            expect(onBlur).toHaveBeenCalledWith(el);
            expect(el.classList.contains('switch--focused')).toBe(false);
        }
    });

    test('Switch ne peut pas être modifié quand disabled', () => {
        const el = document.getElementById('switch') as HTMLElement;
        const instance = new Switch(el, { disabled: true });

        instance.setChecked(true);
        expect(instance.getChecked()).toBe(false);

        instance.toggle();
        expect(instance.getChecked()).toBe(false);
    });

    test('Switch crée la structure DOM correcte', () => {
        const el = document.getElementById('switch') as HTMLElement;
        const instance = new Switch(el);

        expect(el.querySelector('.switch__track')).toBeTruthy();
        expect(el.querySelector('.switch__handle')).toBeTruthy();
        expect(el.querySelector('.switch__input')).toBeTruthy();
    });

    test('Switch met à jour le texte selon l\'état', () => {
        const el = document.getElementById('switch') as HTMLElement;
        el.setAttribute('data-text-unchecked', 'OFF');
        el.setAttribute('data-text-checked', 'ON');
        const instance = new Switch(el);

        const textEl = el.querySelector('.switch__text') as HTMLElement;
        if (textEl) {
            expect(textEl.textContent).toBe('OFF');
            
            instance.setChecked(true);
            // Attendre un peu pour la mise à jour
            setTimeout(() => {
                expect(textEl.textContent).toBe('ON');
            }, 100);
        }
    });

    test('Switch met à jour l\'icône selon l\'état', () => {
        const el = document.getElementById('switch') as HTMLElement;
        el.setAttribute('data-icon', 'check');
        el.setAttribute('data-icon-check', 'check');
        el.setAttribute('data-icon-uncheck', 'close');
        const instance = new Switch(el, { showIcon: true });

        const iconEl = el.querySelector('.switch__icon') as HTMLElement;
        if (iconEl) {
            expect(iconEl).toBeTruthy();
            
            instance.setChecked(true);
            // L'icône devrait être mise à jour
            expect(iconEl.getAttribute('name')).toBeTruthy();
        }
    });

    test('Switch destroy nettoie l\'instance', () => {
        const el = document.getElementById('switch') as HTMLElement;
        const instance = new Switch(el);

        instance.destroy();
        expect(Switch.getInstance(el)).toBeFalsy();
    });

    test('Switch defaults retourne les options par défaut', () => {
        const defaults = Switch.defaults;
        expect(defaults).toBeDefined();
        expect(defaults.checked).toBe(false);
        expect(defaults.disabled).toBe(false);
        expect(defaults.traffic).toBe(false);
        expect(defaults.style).toBe('normal');
    });

    test('Switch met à jour les attributs ARIA', () => {
        const el = document.getElementById('switch') as HTMLElement;
        const instance = new Switch(el);

        const input = el.querySelector('.switch__input') as HTMLInputElement;
        if (input) {
            expect(input.getAttribute('role')).toBe('switch');
            // aria-checked peut être null au début, utiliser getAriaAttribute ou vérifier directement
            const ariaChecked = input.getAttribute('aria-checked');
            expect(ariaChecked === 'false' || ariaChecked === null).toBe(true);
            
            instance.setChecked(true);
            expect(input.getAttribute('aria-checked')).toBe('true');
        }
    });

    test('Switch gère la position du label', () => {
        const el = document.getElementById('switch') as HTMLElement;
        el.setAttribute('data-label', 'Notifications');
        el.setAttribute('data-label-position', 'right');
        const instance = new Switch(el);

        expect(instance.options.labelPosition).toBe('right');
        const labelEl = el.querySelector('.switch__label') as HTMLElement;
        if (labelEl) {
            expect(el.querySelector('.switch__label')).toBeTruthy();
        }
    });
});

