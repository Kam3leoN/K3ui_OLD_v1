/// <reference types="@types/jest" />

import { Gradient } from '../../src/extensions/effects/gradient/Gradient';
import { flushComponentInit } from '../helpers/component-init';

describe('Gradient', () => {
    beforeEach(() => {
        document.body.innerHTML = '<k3ui-gradient id="gradient">Expressive</k3ui-gradient>';
    });

    test('devrait créer une instance avec les options par défaut', async () => {
        const el = document.getElementById('gradient') as HTMLElement;
        const instance = new Gradient(el);
        await flushComponentInit();

        expect(instance).toBeDefined();
        expect(instance.options.colors).toEqual(['#0575E6', '#021B79', '#0575E6']);
        expect(Gradient.getInstance(el)).toBe(instance);
    });

    test('devrait lire data-colors et data-angle depuis le HTML', async () => {
        const el = document.getElementById('gradient') as HTMLElement;
        el.setAttribute('data-colors', '["#E1AD4A","#C937E4","#1DBAF6"]');
        el.setAttribute('data-angle', '135');

        const instance = new Gradient(el);
        await flushComponentInit();

        expect(instance.options.colors).toEqual(['#E1AD4A', '#C937E4', '#1DBAF6']);
        expect(instance.options.angle).toBe(135);
        expect(el.style.getPropertyValue('--k3ui-gradient-angle')).toBe('135deg');
    });

    test('devrait exposer getInstance et updateOptions', async () => {
        const el = document.getElementById('gradient') as HTMLElement;
        const instance = new Gradient(el);
        await flushComponentInit();

        expect(Gradient.getInstance(el)).toBe(instance);

        instance.updateOptions({
            colors: ['#FF4500', '#FFD700'],
            angle: 45,
            text: 'Creativite',
        });

        expect(el.textContent).toBe('Creativite');
        expect(el.style.getPropertyValue('--k3ui-gradient-angle')).toBe('45deg');
    });

    test('devrait detruire proprement', async () => {
        const el = document.getElementById('gradient') as HTMLElement;
        const instance = new Gradient(el);
        await flushComponentInit();

        instance.destroy();

        expect(Gradient.getInstance(el)).toBeFalsy();
    });
});
