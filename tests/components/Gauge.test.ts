/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant Gauge (MD3 Expressive v2)
 */

import { Gauge } from '../../src/components/Gauge';

describe('Gauge', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="root"></div>';
    });

    it('devrait initialiser correctement avec les options par défaut', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new Gauge(el);

        expect(instance).toBeDefined();
        expect(Gauge.getInstance(el)).toBe(instance);
        expect(instance.getValue()).toBe(50);
        expect(el.classList.contains('gauge')).toBe(true);
        expect(el.querySelector('.gauge__track')).toBeTruthy();
        expect(el.querySelector('.gauge__progress')).toBeTruthy();
        expect(el.querySelector('.gauge__content')).toBeTruthy();
        expect(el.querySelector('.gauge__value')).toBeTruthy();
        expect(el.getAttribute('role')).toBe('meter');
    });

    it('devrait exposer getInstance', () => {
        const el = document.getElementById('root') as HTMLElement;
        new Gauge(el);
        const instance = Gauge.getInstance(el);
        expect(instance).toBeDefined();
        expect(instance?.getValue()).toBe(50);
    });

    it('devrait accepter une valeur initiale via options', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new Gauge(el, { value: 75, min: 0, max: 100 });
        expect(instance.getValue()).toBe(75);
    });

    it('devrait lire data-value, data-min, data-max depuis les attributs', () => {
        const el = document.getElementById('root') as HTMLElement;
        el.setAttribute('data-value', '42');
        el.setAttribute('data-min', '0');
        el.setAttribute('data-max', '100');
        const instance = new Gauge(el);
        expect(instance.getValue()).toBe(42);
    });

    it('devrait mettre à jour la valeur avec update', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new Gauge(el, { min: 0, max: 100 });
        instance.update(80);
        expect(instance.getValue()).toBe(80);
    });

    it('devrait appeler onChange lors d\'un update', () => {
        const el = document.getElementById('root') as HTMLElement;
        const onChange = jest.fn();
        const instance = new Gauge(el, { onChange, min: 0, max: 100 });
        instance.update(60);
        expect(onChange).toHaveBeenCalledWith(60, instance);
    });

    it('devrait clamper la valeur entre min et max dans update', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new Gauge(el, { value: 50, min: 0, max: 100 });
        instance.update(150);
        expect(instance.getValue()).toBe(100);
        instance.update(-10);
        expect(instance.getValue()).toBe(0);
    });

    it('devrait monter ticks et marker', () => {
        const el = document.getElementById('root') as HTMLElement;
        new Gauge(el, { ticks: 4, threshold: 50, min: 0, max: 100 });
        expect(el.querySelectorAll('.gauge__tick').length).toBe(5);
        expect(el.querySelector('.gauge__marker')).toBeTruthy();
    });

    it('devrait afficher l\'état error', () => {
        const el = document.getElementById('root') as HTMLElement;
        new Gauge(el, { state: 'error' });
        expect(el.dataset.state).toBe('error');
        expect(el.querySelector('.gauge__state')).toBeTruthy();
        expect(el.querySelector('.gauge__progress')).toBeFalsy();
    });

    it('devrait détruire l\'instance proprement', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new Gauge(el);
        expect(Gauge.getInstance(el)).toBe(instance);
        instance.destroy();
        expect(Gauge.getInstance(el)).toBeFalsy();
    });

    it('devrait exposer defaults statiques', () => {
        const def = Gauge.defaults;
        expect(def).toBeDefined();
        expect(typeof def.value).toBe('number');
        expect(typeof def.min).toBe('number');
        expect(typeof def.max).toBe('number');
        expect(typeof def.label).toBe('string');
        expect(typeof def.unit).toBe('string');
        expect(def.display).toBe('value');
        expect(def.palette).toBe('semantic');
    });

    it('devrait initialiser plusieurs instances via init', () => {
        document.body.innerHTML = '<div id="a" class="gauge"></div><div id="b" class="gauge"></div>';
        const els = document.querySelectorAll('.gauge');
        const result = Gauge.init(els as NodeListOf<HTMLElement>);
        const instances = Array.isArray(result) ? result : [result];
        expect(instances.length).toBe(2);
        expect(Gauge.getInstance(document.getElementById('a')!)).toBe(instances[0]);
        expect(Gauge.getInstance(document.getElementById('b')!)).toBe(instances[1]);
    });
});
