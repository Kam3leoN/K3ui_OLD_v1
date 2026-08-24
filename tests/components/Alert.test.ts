/**
 * Tests unitaires pour le composant Alert
 */

import { Alert } from '../../src/components/Alert';
import { PriorityLevel } from '../../src/types/base';
import { LocaleManager } from '../../src/core/managers/LocaleManager';

describe('Alert', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    LocaleManager.init({ locale: 'fr-FR', savePreference: false });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Création et initialisation', () => {
    test('devrait créer un Alert avec primary et top-end par défaut', () => {
      const el = document.createElement('div');
      document.body.appendChild(el);

      const alert = new Alert(el);

      expect(alert).toBeDefined();
      expect(alert.getColor()).toBe('primary');
      expect(alert.getPosition()).toBe('top-end');
      expect(alert.priority).toBe(PriorityLevel.MEDIUM);
      expect(el.classList.contains('alert')).toBe(true);
      expect(el.classList.contains('alert--primary')).toBe(true);
      expect(el.classList.contains('notch')).toBe(true);
      expect(el.classList.contains('notch--top-end')).toBe(true);
    });

    test('devrait lire data-color, data-position, data-title et data-text', () => {
      const el = document.createElement('div');
      el.dataset.color = 'warning';
      el.dataset.position = 'bottom-start';
      el.dataset.title = 'Custom';
      el.dataset.text = 'Contenu test';
      document.body.appendChild(el);

      const alert = new Alert(el);

      expect(alert.getColor()).toBe('warning');
      expect(alert.getPosition()).toBe('bottom-start');
      expect(el.querySelector('.alert__title')?.textContent).toBe('CUSTOM');
      expect(el.querySelector('.alert__text')?.textContent).toBe('Contenu test');
    });

    test('getInstance retourne l\'instance', () => {
      const el = document.createElement('div');
      document.body.appendChild(el);

      const alert = new Alert(el);
      expect(Alert.getInstance(el)).toBe(alert);
    });
  });

  describe('Couleurs et positions', () => {
    test('devrait appliquer alert--hint depuis la classe', () => {
      const el = document.createElement('div');
      el.classList.add('alert--hint');
      document.body.appendChild(el);

      new Alert(el);

      expect(el.classList.contains('alert--hint')).toBe(true);
      expect(el.querySelector('.alert__title')?.textContent).toBe('INDICE');
    });

    test('setColor change la classe et le titre i18n', () => {
      const el = document.createElement('div');
      document.body.appendChild(el);

      const instance = new Alert(el);
      instance.setColor('tips');

      expect(el.classList.contains('alert--tips')).toBe(true);
      expect(el.querySelector('.alert__title')?.textContent).toBe('ASTUCE');
    });

    test('setPosition change la classe notch', () => {
      const el = document.createElement('div');
      document.body.appendChild(el);

      const instance = new Alert(el);
      instance.setPosition('top-start');

      expect(el.classList.contains('notch--top-start')).toBe(true);
      expect(el.classList.contains('notch--top-end')).toBe(false);
    });

    test('title et texte seuls conservent primary', () => {
      const el = document.createElement('div');
      el.dataset.title = 'Note';
      el.dataset.text = 'Contenu';
      document.body.appendChild(el);

      new Alert(el);

      expect(el.classList.contains('alert--primary')).toBe(true);
      expect(el.querySelector('.alert__title')?.textContent).toBe('NOTE');
    });
  });

  describe('Accessibilité et destruction', () => {
    test('devrait exposer un role selon la couleur', () => {
      const el = document.createElement('div');
      el.dataset.color = 'info';
      document.body.appendChild(el);

      new Alert(el);

      expect(el.getAttribute('role')).toBe('note');
      expect(el.getAttribute('aria-label')).toBeTruthy();
    });

    test('destroy nettoie l\'instance', () => {
      const el = document.createElement('div');
      document.body.appendChild(el);

      const instance = new Alert(el);
      instance.destroy();

      expect(Alert.getInstance(el)).toBeUndefined();
      expect(el.getAttribute('role')).toBeNull();
    });
  });
});
