/// <reference types="@types/jest" />

import { Halo } from '../../src/extensions/effects/halo/Halo';
import { flushComponentInit } from '../helpers/component-init';

describe('Halo', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    test('devrait créer une instance sur un conteneur .halo', async () => {
        document.body.innerHTML = `
            <div class="halo" id="halo-root" data-variant="rainbow" data-size="lg">
                <span class="halo__layers" aria-hidden="true">
                    <span class="halo__layer"></span>
                    <span class="halo__layer halo__layer--near"></span>
                    <span class="halo__layer halo__layer--far"></span>
                </span>
                <button class="btn">Action</button>
            </div>
        `;

        const el = document.getElementById('halo-root') as HTMLElement;
        const instance = new Halo(el);
        await flushComponentInit();

        expect(instance).toBeDefined();
        expect(instance.options.variant).toBe('rainbow');
        expect(instance.options.size).toBe('lg');
        expect(Halo.getInstance(el)).toBe(instance);
        expect(el.getAttribute('data-variant')).toBe('rainbow');
    });

    test('devrait envelopper automatiquement un élément avec data-halo', async () => {
        document.body.innerHTML =
            '<button class="btn" id="btn-halo" data-halo data-halo-variant="dual" data-halo-color="#4f39f6">Souscrire</button>';

        const btn = document.getElementById('btn-halo') as HTMLElement;
        const instance = new Halo(btn);
        await flushComponentInit();

        const wrapper = btn.parentElement;
        expect(wrapper).not.toBeNull();
        expect(wrapper?.classList.contains('halo')).toBe(true);
        expect(wrapper?.getAttribute('data-variant')).toBe('dual');
        expect(wrapper?.style.getPropertyValue('--halo-color')).toBe('#4f39f6');
        expect(wrapper?.querySelector('.halo__layers')).not.toBeNull();
        expect(btn.hasAttribute('data-halo')).toBe(false);
        expect(Halo.getInstance(wrapper as HTMLElement)).toBe(instance);
    });

    test('devrait appliquer pause et resume', async () => {
        document.body.innerHTML = '<div class="halo" id="halo-pause"></div>';
        const el = document.getElementById('halo-pause') as HTMLElement;
        const instance = new Halo(el);
        await flushComponentInit();

        instance.pause();
        expect(el.getAttribute('data-paused')).toBe('true');

        instance.resume();
        expect(el.hasAttribute('data-paused')).toBe(false);
    });

    test('devrait mettre à jour les options via updateOptions', async () => {
        document.body.innerHTML = '<div class="halo" id="halo-update"></div>';
        const el = document.getElementById('halo-update') as HTMLElement;
        const instance = new Halo(el);
        await flushComponentInit();

        instance.updateOptions({
            variant: 'pulse',
            size: 'xl',
            color: '#e11d48',
            trigger: 'hover',
        });

        expect(el.getAttribute('data-variant')).toBe('pulse');
        expect(el.getAttribute('data-size')).toBe('xl');
        expect(el.getAttribute('data-trigger')).toBe('hover');
        expect(el.style.getPropertyValue('--halo-color')).toBe('#e11d48');
    });

    test('devrait envelopper un bouton même si Button est déjà initialisé', async () => {
        document.body.innerHTML =
            '<button class="btn btn--filled" id="btn-halo" data-halo data-halo-variant="rainbow" data-halo-trigger="hover">Rainbow</button>';

        const btn = document.getElementById('btn-halo') as HTMLElement;
        const { Button } = await import('../../src/components/Button');
        Button.init(btn);
        await flushComponentInit();

        const instances = Halo.init('[data-halo]') as Halo[];
        await flushComponentInit();

        expect(instances).toHaveLength(1);
        const wrapper = btn.parentElement;
        expect(wrapper?.classList.contains('halo')).toBe(true);
        expect(wrapper?.getAttribute('data-variant')).toBe('rainbow');
        expect(wrapper?.getAttribute('data-trigger')).toBe('hover');
        expect(wrapper?.querySelector('.halo__layers')).not.toBeNull();
        expect(Halo.getInstance(wrapper as HTMLElement)).toBeDefined();
        expect(Button.getInstance(btn)).toBeDefined();
    });

    test('devrait detruire proprement et retirer le wrapper auto', async () => {
        document.body.innerHTML =
            '<span class="badge" id="badge-halo" data-halo data-halo-variant="pulse">New</span>';

        const badge = document.getElementById('badge-halo') as HTMLElement;
        const instance = new Halo(badge);
        await flushComponentInit();

        const wrapper = badge.parentElement as HTMLElement;
        instance.destroy();

        expect(Halo.getInstance(wrapper)).toBeFalsy();
        expect(document.body.contains(badge)).toBe(true);
        expect(badge.parentElement?.classList.contains('halo')).toBe(false);
    });

    test('k3ui-halo disconnectedCallback détruit l instance', async () => {
        document.body.innerHTML = '<k3ui-halo class="halo" id="ce-halo"></k3ui-halo>';
        const el = document.getElementById('ce-halo') as HTMLElement;
        const instance = new Halo(el);
        await flushComponentInit();
        expect(Halo.getInstance(el)).toBe(instance);
        el.remove();
        expect(Halo.getInstance(el)).toBeFalsy();
    });
});
