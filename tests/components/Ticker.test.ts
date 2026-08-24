/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant Ticker
 */

import { Ticker, trendOf, formatTickerValue } from '../../src/components/Ticker';

describe('Ticker', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="root"></div>';
    });

    it('devrait initialiser correctement avec les options par défaut', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new Ticker(el);

        expect(instance).toBeDefined();
        expect(Ticker.getInstance(el)).toBe(instance);
        expect(instance.getValue()).toBe(0);
        expect(el.classList.contains('ticker')).toBe(true);
        expect(el.querySelector('.ticker__label')).toBeTruthy();
        expect(el.querySelector('.ticker__value')).toBeTruthy();
        expect(el.querySelector('.ticker__indicator')).toBeTruthy();
        expect(el.querySelector('.ticker__delta')).toBeTruthy();
    });

    it('devrait exposer getInstance', () => {
        const el = document.getElementById('root') as HTMLElement;
        new Ticker(el);
        expect(Ticker.getInstance(el)).toBeDefined();
    });

    it('devrait accepter une valeur initiale via options', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new Ticker(el, { value: 1.24, label: 'CAC 40' });
        expect(instance.getValue()).toBe(1.24);
        expect(el.querySelector('.ticker__label')?.textContent).toBe('CAC 40');
    });

    it('devrait accepter data-value et data-label', () => {
        const el = document.getElementById('root') as HTMLElement;
        el.setAttribute('data-value', '2.5');
        el.setAttribute('data-label', 'DAX');
        const instance = new Ticker(el);
        expect(instance.getValue()).toBe(2.5);
        expect(el.querySelector('.ticker__label')?.textContent).toBe('DAX');
    });

    it('devrait mettre à jour la valeur avec setValue', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new Ticker(el, { value: 1 });
        instance.setValue(-0.86);
        expect(instance.getValue()).toBe(-0.86);
        expect(el.classList.contains('is-down')).toBe(true);
    });

    it('devrait appeler onChange lors d\'un setValue', () => {
        const el = document.getElementById('root') as HTMLElement;
        const onChange = jest.fn();
        const instance = new Ticker(el, { onChange });
        instance.setValue(3.1);
        expect(onChange).toHaveBeenCalledWith(3.1, instance);
    });

    it('devrait calculer la tendance via trendOf', () => {
        expect(trendOf(1)).toBe('up');
        expect(trendOf(-1)).toBe('down');
        expect(trendOf(0.04, 0.05)).toBe('flat');
    });

    it('devrait formater en percent', () => {
        const text = formatTickerValue({
            value: 1.24,
            format: 'percent',
            locale: 'fr-FR',
            currency: 'EUR',
            precision: null,
            indicator: 'caret',
            signOnValue: false,
        });
        expect(text).toContain('%');
        expect(text).toMatch(/1[,.]24/);
    });

    it('devrait afficher le delta', () => {
        const el = document.getElementById('root') as HTMLElement;
        new Ticker(el, { value: 1, delta: '+12 pts' });
        const delta = el.querySelector('.ticker__delta') as HTMLElement;
        expect(delta.hidden).toBe(false);
        expect(delta.textContent).toBe('+12 pts');
    });

    it('devrait détruire proprement', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new Ticker(el);
        instance.destroy();
        expect(Ticker.getInstance(el)).toBeFalsy();
    });
});
