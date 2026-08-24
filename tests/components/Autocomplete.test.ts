/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant Autocomplete
 */

import { Autocomplete } from '../../src/components/Autocomplete';

describe('Autocomplete', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <label for="fruit">Fruit</label>
      <input id="fruit" type="text" />
      <div id="ac" class="autocomplete" data-for="fruit">
        <ul class="autocomplete__options">
          <li class="autocomplete__option" data-value="apples">Apples</li>
          <li class="autocomplete__option" data-value="oranges">Oranges</li>
          <li class="autocomplete__option" data-value="bananas">Bananas</li>
        </ul>
      </div>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('devrait créer une instance avec les options par défaut', () => {
    const el = document.getElementById('ac') as HTMLElement;
    const instance = new Autocomplete(el, {});
    expect(instance).toBeDefined();
    expect(Autocomplete.getInstance(el)).toBe(instance);
    expect(el.classList.contains('autocomplete')).toBe(true);
    expect(instance.getOptions().length).toBe(3);
    expect(el.querySelector('k3ui-menu')).toBeTruthy();
  });

  it('devrait exposer getInstance', () => {
    const el = document.getElementById('ac') as HTMLElement;
    new Autocomplete(el, {});
    expect(Autocomplete.getInstance(el)).toBeTruthy();
  });

  it('devrait filtrer les options (contains)', () => {
    const el = document.getElementById('ac') as HTMLElement;
    const input = document.getElementById('fruit') as HTMLInputElement;
    const instance = new Autocomplete(el, { filter: 'contains' });
    input.value = 'an';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    instance.openPanel();
    expect(instance.open).toBe(true);
    const menu = el.querySelector('k3ui-menu');
    expect(menu).toBeTruthy();
  });

  it('devrait committer une option via setValue', () => {
    const el = document.getElementById('ac') as HTMLElement;
    const input = document.getElementById('fruit') as HTMLInputElement;
    const instance = new Autocomplete(el, {});
    instance.setValue('oranges');
    expect(instance.value).toBe('oranges');
    expect(input.value).toBe('Oranges');
  });

  it('devrait appeler onChange lors d’une sélection programmatique', () => {
    const el = document.getElementById('ac') as HTMLElement;
    const onChange = jest.fn();
    const instance = new Autocomplete(el, { onChange });
    instance.setValue('bananas');
    expect(onChange).toHaveBeenCalled();
  });

  it('devrait détruire proprement', () => {
    const el = document.getElementById('ac') as HTMLElement;
    const instance = new Autocomplete(el, {});
    instance.openPanel();
    instance.destroy();
    expect(Autocomplete.getInstance(el)).toBeUndefined();
    expect(el.querySelector('k3ui-menu')).toBeNull();
  });

  it('defaults devrait retourner les options par défaut', () => {
    expect(Autocomplete.defaults.filter).toBe('contains');
    expect(Autocomplete.defaults.autoActivate).toBe(false);
  });

  it('devrait initialiser via init avec un élément', () => {
    const el = document.getElementById('ac') as HTMLElement;
    const result = Autocomplete.init(el, {});
    const instances = Array.isArray(result) ? result : [result];
    expect(instances.length).toBe(1);
    expect(instances[0]).toBeInstanceOf(Autocomplete);
  });
});
