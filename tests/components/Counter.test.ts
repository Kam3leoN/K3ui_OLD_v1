/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant Counter
 */

import { Counter } from '../../src/components/Counter';

describe('Counter', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="root"></div>';
    });

    it('devrait initialiser correctement avec les options par défaut', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new Counter(el);

        expect(instance).toBeDefined();
        expect(Counter.getInstance(el)).toBe(instance);
        expect(instance.getValue()).toBe(0);
        expect(el.querySelector('.counter__wrapper')).toBeTruthy();
        expect(el.querySelector('.counter__btn--decrement')).toBeTruthy();
        expect(el.querySelector('.counter__btn--increment')).toBeTruthy();
        expect(el.querySelector('.counter__number')).toBeTruthy();
    });

    it('devrait exposer getInstance', () => {
        const el = document.getElementById('root') as HTMLElement;
        new Counter(el);
        const instance = Counter.getInstance(el);
        expect(instance).toBeDefined();
        expect(instance.getValue()).toBe(0);
    });

    it('devrait accepter une valeur initiale via options', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new Counter(el, { value: 10 });
        expect(instance.getValue()).toBe(10);
    });

    it('devrait accepter data-value pour la valeur initiale', () => {
        const el = document.getElementById('root') as HTMLElement;
        el.setAttribute('data-value', '7');
        const instance = new Counter(el);
        expect(instance.getValue()).toBe(7);
    });

    it('devrait mettre à jour la valeur avec setValue', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new Counter(el);
        instance.setValue(5);
        expect(instance.getValue()).toBe(5);
    });

    it('devrait appeler onChange lors d\'un setValue', () => {
        const el = document.getElementById('root') as HTMLElement;
        const onChange = jest.fn();
        const instance = new Counter(el, { onChange });
        instance.setValue(3);
        expect(onChange).toHaveBeenCalledWith(3, instance);
    });

    it('devrait ne pas descendre en dessous de 0 sans allowNegative', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new Counter(el, { value: 1 });
        const decBtn = el.querySelector('.counter__btn--decrement') as HTMLButtonElement;
        decBtn.click();
        expect(instance.getValue()).toBe(0);
        decBtn.click();
        expect(instance.getValue()).toBe(0);
    });

    it('devrait permettre les valeurs négatives avec allowNegative', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new Counter(el, { value: 0, allowNegative: true });
        const decBtn = el.querySelector('.counter__btn--decrement') as HTMLButtonElement;
        decBtn.click();
        expect(instance.getValue()).toBe(-1);
    });

    it('devrait respecter min et max', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new Counter(el, { value: 0, allowNegative: true, min: -2, max: 2 });
        const incBtn = el.querySelector('.counter__btn--increment') as HTMLButtonElement;
        const decBtn = el.querySelector('.counter__btn--decrement') as HTMLButtonElement;
        incBtn.click();
        incBtn.click();
        incBtn.click();
        expect(instance.getValue()).toBe(2);
        decBtn.click();
        decBtn.click();
        decBtn.click();
        decBtn.click();
        decBtn.click();
        expect(instance.getValue()).toBe(-2);
    });

    it('devrait utiliser le step', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new Counter(el, { value: 0, allowNegative: true, step: 5 });
        const incBtn = el.querySelector('.counter__btn--increment') as HTMLButtonElement;
        incBtn.click();
        expect(instance.getValue()).toBe(5);
        incBtn.click();
        expect(instance.getValue()).toBe(10);
        const decBtn = el.querySelector('.counter__btn--decrement') as HTMLButtonElement;
        decBtn.click();
        expect(instance.getValue()).toBe(5);
    });

    it('devrait détruire proprement', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new Counter(el);
        instance.destroy();
        expect(Counter.getInstance(el)).toBeFalsy();
    });

    it('devrait initialiser via Counter.init avec un élément', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = Counter.init(el) as Counter;
        expect(instance).toBeInstanceOf(Counter);
        expect(instance.getValue()).toBe(0);
    });

    it('devrait initialiser via Counter.init avec une NodeList', () => {
        document.body.innerHTML = '<div id="a"></div><div id="b"></div>';
        const els = document.querySelectorAll('#a, #b');
        const instances = Counter.init(els as NodeListOf<HTMLElement>) as Counter[];
        expect(Array.isArray(instances)).toBe(true);
        expect(instances.length).toBe(2);
    });
});
