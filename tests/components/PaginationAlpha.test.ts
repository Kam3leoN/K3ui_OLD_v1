/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant PaginationAlpha
 */

import { PaginationAlpha } from '../../src/components/PaginationAlpha';

const SAMPLE_ITEMS = ['Apple', 'Banana', 'Cherry', 'Apricot', 'Blueberry'];

describe('PaginationAlpha', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div class="pagination-alpha" id="pagination-alpha-root"></div>';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('devrait créer une instance avec les options par défaut', () => {
    const el = document.getElementById('pagination-alpha-root') as HTMLElement;
    const instance = new PaginationAlpha(el, {});

    expect(instance).toBeDefined();
    expect(PaginationAlpha.getInstance(el)).toBe(instance);
    expect(PaginationAlpha.defaults).toBeDefined();
    expect(PaginationAlpha.defaults.size).toBe('md');
    expect(PaginationAlpha.defaults.orientation).toBe('horizontal');
    expect(PaginationAlpha.defaults.showCount).toBe(false);
    expect(PaginationAlpha.defaults.showDisabled).toBe(true);
    expect(PaginationAlpha.defaults.activeLetter).toBe('A');
    expect(PaginationAlpha.defaults.items).toEqual([]);
  });

  it('devrait exposer getInstance', () => {
    const el = document.getElementById('pagination-alpha-root') as HTMLElement;
    const instance = new PaginationAlpha(el, { items: [] });

    expect(PaginationAlpha.getInstance(el)).toBe(instance);
  });

  it('devrait rendre les lettres avec la lettre active', () => {
    const el = document.getElementById('pagination-alpha-root') as HTMLElement;
    new PaginationAlpha(el, {
      items: SAMPLE_ITEMS,
      activeLetter: 'B',
      showDisabled: true,
    });

    const nav = el.querySelector('.pagination-alpha__nav');
    expect(nav).toBeTruthy();
    const buttons = el.querySelectorAll('.pagination-alpha__letter-btn');
    expect(buttons.length).toBeGreaterThanOrEqual(26);
    const activeBtn = el.querySelector('.pagination-alpha__letter-btn--active');
    expect(activeBtn).toBeTruthy();
    expect(activeBtn?.getAttribute('data-letter')).toBe('B');
  });

  it('devrait appeler onSelect au clic sur une lettre', () => {
    const el = document.getElementById('pagination-alpha-root') as HTMLElement;
    const onSelect = jest.fn();
    new PaginationAlpha(el, {
      items: SAMPLE_ITEMS,
      activeLetter: 'A',
      onSelect,
    });

    const btnC = el.querySelector('.pagination-alpha__letter-btn[data-letter="C"]') as HTMLButtonElement;
    expect(btnC).toBeTruthy();
    expect(btnC.disabled).toBe(false);
    btnC.click();
    expect(onSelect).toHaveBeenCalledWith('C');
  });

  it('devrait mettre à jour avec updateOptions', () => {
    const el = document.getElementById('pagination-alpha-root') as HTMLElement;
    const instance = new PaginationAlpha(el, {
      items: SAMPLE_ITEMS,
      activeLetter: 'A',
    });

    instance.updateOptions({ activeLetter: 'C', items: ['Cat', 'Dog', 'Cow'] });

    const activeBtn = el.querySelector('.pagination-alpha__letter-btn--active');
    expect(activeBtn?.getAttribute('data-letter')).toBe('C');
  });

  it('devrait détruire proprement', () => {
    const el = document.getElementById('pagination-alpha-root') as HTMLElement;
    const instance = new PaginationAlpha(el, { items: SAMPLE_ITEMS });

    instance.destroy();

    expect(PaginationAlpha.getInstance(el)).toBeFalsy();
  });
});
