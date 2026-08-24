/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant Textarea
 */

import { Textarea } from '../../src/components/Textarea';

describe('Textarea', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="ta" variant="filled" label="Message"></div>';
  });

  test('initialise et crée la structure', () => {
    const el = document.getElementById('ta') as HTMLElement;
    const instance = new Textarea(el, { maxLength: 100 });
    expect(instance).toBeDefined();
    expect(el.querySelector('.textarea')).toBeTruthy();
    expect(el.querySelector('.label')?.textContent).toBe('Message');
  });

  test('setValue met à jour la valeur et le compteur', () => {
    const el = document.getElementById('ta') as HTMLElement;
    const instance = new Textarea(el, { maxLength: 10 });
    instance.setValue('abc');
    expect(instance.getValue()).toBe('abc');
  });

  test('focus/blur mettent à jour focused et has-value', () => {
    const el = document.getElementById('ta') as HTMLElement;
    const instance = new Textarea(el, { maxLength: 10 });
    instance.focus();
    expect(el.getAttribute('focused')).toBe('');
    instance.blur();
    expect(el.hasAttribute('focused')).toBe(false);
  });
});


