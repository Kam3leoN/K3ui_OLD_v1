/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant Skeleton
 */

import { Skeleton } from '../../src/components/Skeleton';

describe('Skeleton', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div class="skeleton" id="sk"></div>';
  });

  it('devrait créer une instance avec les options par défaut', () => {
    const el = document.getElementById('sk') as HTMLElement;
    const instance = new Skeleton(el);
    expect(instance).toBeDefined();
    expect(Skeleton.defaults.variant).toBe('text');
    expect(Skeleton.defaults.animation).toBe('pulse');
    expect(el.classList.contains('skeleton')).toBe(true);
    expect(el.classList.contains('skeleton--text')).toBe(true);
    expect(el.classList.contains('skeleton--pulse')).toBe(true);
  });

  it('devrait exposer getInstance et retourner la même instance', () => {
    const el = document.getElementById('sk') as HTMLElement;
    const instance = new Skeleton(el);
    const got = Skeleton.getInstance(el);
    expect(got).toBe(instance);
  });

  it('devrait initialiser via Skeleton.init (élément unique et sélecteur)', () => {
    const el = document.getElementById('sk') as HTMLElement;
    const one = Skeleton.init(el) as Skeleton;
    expect(one).toBeInstanceOf(Skeleton);
    expect(Skeleton.getInstance(el)).toBe(one);

    document.body.innerHTML += '<div class="skeleton" id="sk2"></div>';
    const two = Skeleton.init('.skeleton') as Skeleton[];
    expect(two.length).toBe(2);
  });

  it('devrait mettre à jour les options avec update()', () => {
    const el = document.getElementById('sk') as HTMLElement;
    const instance = new Skeleton(el);
    instance.update({ variant: 'rounded', animation: 'wave' });
    expect(el.classList.contains('skeleton--rounded')).toBe(true);
    expect(el.classList.contains('skeleton--wave')).toBe(true);
    instance.update({ width: '100%', height: '2rem' });
    expect(el.style.width).toBe('100%');
    expect(el.style.height).toBe('2rem');
  });

  it('devrait détruire l\'instance proprement', () => {
    const el = document.getElementById('sk') as HTMLElement;
    const instance = new Skeleton(el);
    expect(Skeleton.getInstance(el)).toBe(instance);
    instance.destroy();
    expect(Skeleton.getInstance(el)).toBeFalsy();
  });
});
