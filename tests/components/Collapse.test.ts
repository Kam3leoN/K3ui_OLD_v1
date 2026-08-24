/**
 * Tests unitaires pour le composant Collapse
 */

import { Collapse } from '../../src/components/Collapse';
import { PriorityLevel } from '../../src/types/base';
import { LocaleManager } from '../../src/core/managers/LocaleManager';

function createCollapseMarkup(itemCount = 3, openIndexes: number[] = []): HTMLElement {
  const root = document.createElement('div');
  root.className = 'collapse';

  for (let i = 0; i < itemCount; i += 1) {
    const item = document.createElement('div');
    item.className = 'collapse__item';
    if (openIndexes.includes(i)) {
      item.setAttribute('data-open', '');
    }

    const header = document.createElement('button');
    header.type = 'button';
    header.className = 'collapse__header';
    header.innerHTML = `<span class="collapse__label">Question ${i}</span>`;

    const panel = document.createElement('div');
    panel.className = 'collapse__panel';
    panel.innerHTML = `<div class="collapse__clip"><div class="collapse__body">Réponse ${i}</div></div>`;

    item.appendChild(header);
    item.appendChild(panel);
    root.appendChild(item);
  }

  document.body.appendChild(root);
  return root;
}

describe('Collapse', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    LocaleManager.init({ locale: 'fr-FR', savePreference: false });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Création et initialisation', () => {
    test('devrait créer une instance avec les options par défaut', () => {
      const el = createCollapseMarkup();
      const instance = new Collapse(el);

      expect(instance).toBeDefined();
      expect(instance.priority).toBe(PriorityLevel.MEDIUM);
      expect(el.classList.contains('collapse')).toBe(true);
      expect(Collapse.getInstance(el)).toBe(instance);
      expect(instance.getOpenIndex()).toBeNull();
    });

    test('devrait ouvrir l\'item data-open au montage', () => {
      const el = createCollapseMarkup(3, [1]);
      const instance = new Collapse(el);

      expect(instance.isOpen(1)).toBe(true);
      expect(instance.getOpenIndex()).toBe(1);
      expect(el.querySelectorAll('.collapse__item--open').length).toBe(1);
    });

    test('devrait lire data-exclusive="false"', () => {
      const el = createCollapseMarkup(3, [0, 2]);
      el.dataset.exclusive = 'false';
      const instance = new Collapse(el);

      expect(instance.isOpen(0)).toBe(true);
      expect(instance.isOpen(2)).toBe(true);
      expect(instance.getOpenIndexes()).toEqual([0, 2]);
    });
  });

  describe('open / close / toggle', () => {
    test('open en mode exclusif ferme les autres', () => {
      const el = createCollapseMarkup();
      const instance = new Collapse(el);

      instance.open(0);
      expect(instance.getOpenIndexes()).toEqual([0]);

      instance.open(2);
      expect(instance.isOpen(0)).toBe(false);
      expect(instance.isOpen(2)).toBe(true);
    });

    test('toggle ouvre puis ferme', () => {
      const el = createCollapseMarkup();
      const instance = new Collapse(el);

      instance.toggle(1);
      expect(instance.isOpen(1)).toBe(true);

      instance.toggle(1);
      expect(instance.isOpen(1)).toBe(false);
    });

    test('closeAll ferme tous les items', () => {
      const el = createCollapseMarkup(3);
      el.dataset.exclusive = 'false';
      const instance = new Collapse(el, { exclusive: false });

      instance.open(0);
      instance.open(1);
      instance.closeAll();

      expect(instance.getOpenIndexes()).toEqual([]);
    });

    test('multi-open avec exclusive false', () => {
      const el = createCollapseMarkup();
      const instance = new Collapse(el, { exclusive: false });

      instance.open(0);
      instance.open(1);

      expect(instance.getOpenIndexes()).toEqual([0, 1]);
    });
  });

  describe('Callbacks et accessibilité', () => {
    test('devrait appeler onChange et onOpenStart', () => {
      const el = createCollapseMarkup();
      const onChange = jest.fn();
      const onOpenStart = jest.fn();
      const instance = new Collapse(el, { onChange, onOpenStart });

      instance.open(0);

      expect(onOpenStart).toHaveBeenCalledWith(el);
      expect(onChange).toHaveBeenCalledWith(0, [0]);
    });

    test('devrait exposer aria-expanded sur les headers', () => {
      const el = createCollapseMarkup();
      const instance = new Collapse(el);

      const header = el.querySelector('.collapse__header') as HTMLElement;
      expect(header.getAttribute('aria-expanded')).toBe('false');

      instance.open(0);
      expect(header.getAttribute('aria-expanded')).toBe('true');
    });
  });

  describe('Destruction', () => {
    test('destroy nettoie l\'instance', () => {
      const el = createCollapseMarkup();
      const instance = new Collapse(el);

      instance.destroy();
      expect(Collapse.getInstance(el)).toBeUndefined();
    });
  });
});
