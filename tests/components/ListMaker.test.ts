/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant ListMaker
 */

import { ListMaker } from '../../src/components/ListMaker';

describe('ListMaker', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <ol class="list-maker" id="lm">
        <li>Container</li>
        <li>Large carousel item</li>
        <li data-marker="A.">Alpha</li>
      </ol>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('initialise et stocke l\'instance sur l\'élément', () => {
    const el = document.getElementById('lm') as HTMLElement;
    const instance = new ListMaker(el);

    expect(instance).toBeDefined();
    expect(ListMaker.getInstance(el)).toBe(instance);
    expect(el.classList.contains('list-maker')).toBe(true);
  });

  test('génère des marqueurs indexés quand data-marker est absent', () => {
    const el = document.getElementById('lm') as HTMLElement;
    new ListMaker(el);

    const markers = el.querySelectorAll('.list-maker__marker');
    expect(markers.length).toBe(3);
    expect(markers[0].textContent).toBe('1');
    expect(markers[1].textContent).toBe('2');
    expect(markers[2].textContent).toBe('A.');
  });

  test('enveloppe le contenu dans list-maker__body', () => {
    const el = document.getElementById('lm') as HTMLElement;
    new ListMaker(el);

    const bodies = el.querySelectorAll('.list-maker__body');
    expect(bodies[0].textContent).toBe('Container');
    expect(bodies[2].textContent).toBe('Alpha');
  });

  test('applique la variante tonal via options', () => {
    const el = document.getElementById('lm') as HTMLElement;
    const instance = new ListMaker(el, { variant: 'tonal' });

    expect(el.classList.contains('list-maker--tonal')).toBe(true);
    expect(el.dataset.variant).toBe('tonal');
    instance.setVariant('filled');
    expect(el.classList.contains('list-maker--filled')).toBe(true);
  });

  test('applique la taille et recalcule les CSS vars', () => {
    const el = document.getElementById('lm') as HTMLElement;
    const instance = new ListMaker(el, { size: 'large' });

    expect(el.classList.contains('list-maker--large')).toBe(true);
    expect(el.style.getPropertyValue('--list-maker-w')).toBeTruthy();
    instance.setSize('small');
    expect(el.classList.contains('list-maker--small')).toBe(true);
  });

  test('setItemMarker met à jour le marqueur', () => {
    const el = document.getElementById('lm') as HTMLElement;
    const instance = new ListMaker(el);

    instance.setItemMarker(0, 'I.');
    const markers = el.querySelectorAll('.list-maker__marker');
    expect(markers[0].textContent).toBe('I.');
  });

  test('destroy nettoie l\'instance', () => {
    const el = document.getElementById('lm') as HTMLElement;
    const instance = new ListMaker(el);
    instance.destroy();
    expect(ListMaker.getInstance(el)).toBeUndefined();
  });

  test('applique orientation horizontal via rotation 90° (XS narrow)', () => {
    const el = document.getElementById('lm') as HTMLElement;
    const instance = new ListMaker(el, { orientation: 'horizontal' });

    expect(el.classList.contains('list-maker--horizontal')).toBe(true);
    expect(el.style.getPropertyValue('--list-maker-rotate')).toBe('90deg');
    expect(el.style.getPropertyValue('--list-maker-w')).toBe('28px');
    expect(el.style.getPropertyValue('--list-maker-h')).toBe('48px');
    expect(el.style.getPropertyValue('--list-maker-slot-w')).toBe('48px');
    expect(el.style.getPropertyValue('--list-maker-slot-h')).toBe('28px');

    instance.setOrientation('vertical');
    expect(el.classList.contains('list-maker--vertical')).toBe(true);
    expect(el.style.getPropertyValue('--list-maker-rotate')).toBe('0deg');
    expect(el.style.getPropertyValue('--list-maker-w')).toBe('28px');
    expect(el.style.getPropertyValue('--list-maker-h')).toBe('48px');
  });

  test('expose defaults', () => {
    expect(ListMaker.defaults.variant).toBe('filled');
    expect(ListMaker.defaults.size).toBe('medium');
    expect(ListMaker.defaults.orientation).toBe('vertical');
  });
});
