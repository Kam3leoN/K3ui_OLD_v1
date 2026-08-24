/**
 * Tests unitaires pour le composant Quote
 */

import { Quote } from '../../src/components/Quote';
import type { QuoteItem } from '../../src/types/components';
import { PriorityLevel } from '../../src/types/base';
import { LocaleManager } from '../../src/core/managers/LocaleManager';

const SAMPLE_QUOTES: QuoteItem[] = [
  { quote: 'Short quote.', author: 'A' },
  { quote: 'Another one.', author: 'B' },
];

describe('Quote', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
    LocaleManager.init({ locale: 'fr-FR', savePreference: false });
  });

  afterEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
  });

  describe('Création et initialisation', () => {
    test('devrait créer un Quote avec les options par défaut', () => {
      const el = document.createElement('div');
      document.body.appendChild(el);

      const quote = new Quote(el);

      expect(quote).toBeDefined();
      expect(quote.options.random).toBe(false);
      expect(quote.options.daily).toBe(false);
      expect(quote.priority).toBe(PriorityLevel.MEDIUM);
      expect(el.classList.contains('quote')).toBe(true);
      expect(el.classList.contains('notch')).toBe(true);
    });

    test('devrait lire data-quote et data-author', () => {
      const el = document.createElement('div');
      el.dataset.quote = 'Hello world';
      el.dataset.author = 'Tester';
      document.body.appendChild(el);

      const quote = new Quote(el);

      expect(quote.getCurrentQuote().quote).toBe('Hello world');
      expect(quote.getCurrentQuote().author).toBe('Tester');
    });

    test('getInstance retourne l\'instance', () => {
      const el = document.createElement('div');
      el.dataset.quote = 'Test';
      document.body.appendChild(el);

      const quote = new Quote(el);
      expect(Quote.getInstance(el)).toBe(quote);
    });
  });

  describe('Random et daily', () => {
    test('devrait afficher une citation aléatoire', () => {
      const el = document.createElement('div');
      document.body.appendChild(el);

      new Quote(el, { random: true, quotes: SAMPLE_QUOTES });

      const current = Quote.getInstance(el)!.getCurrentQuote();
      expect(SAMPLE_QUOTES.some((q) => q.quote === current.quote)).toBe(true);
    });

    test('devrait persister la citation du jour', () => {
      const el = document.createElement('div');
      document.body.appendChild(el);

      new Quote(el, { daily: true, quotes: SAMPLE_QUOTES });

      const first = Quote.getInstance(el)!.getCurrentQuote();

      document.body.innerHTML = '';
      const el2 = document.createElement('div');
      document.body.appendChild(el2);

      new Quote(el2, { daily: true, quotes: SAMPLE_QUOTES });

      expect(Quote.getInstance(el2)!.getCurrentQuote().quote).toBe(first.quote);
    });
  });

  describe('Refresh', () => {
    test('refresh() met à jour la citation', () => {
      const el = document.createElement('div');
      document.body.appendChild(el);

      const instance = new Quote(el, {
        random: true,
        quotes: [
          { quote: 'One', author: 'A' },
          { quote: 'Two', author: 'B' },
          { quote: 'Three', author: 'C' },
        ],
      });

      const before = instance.getCurrentQuote().quote;
      instance.refresh();
      const after = instance.getCurrentQuote().quote;

      expect(after).toBeTruthy();
      expect(typeof after).toBe('string');
      expect(['One', 'Two', 'Three']).toContain(after);
      expect(typeof before).toBe('string');
    });

    test('refreshOnClick ajoute la classe quote--refreshable', () => {
      const el = document.createElement('div');
      el.dataset.refreshOnClick = 'true';
      el.dataset.quote = 'Click me';
      document.body.appendChild(el);

      new Quote(el);

      expect(el.classList.contains('quote--refreshable')).toBe(true);
    });
  });

  describe('Accessibilité et destruction', () => {
    test('devrait exposer role blockquote', () => {
      const el = document.createElement('div');
      el.dataset.quote = 'Accessible';
      document.body.appendChild(el);

      new Quote(el);

      expect(el.getAttribute('role')).toBe('blockquote');
      expect(el.getAttribute('aria-label')).toBeTruthy();
    });

    test('destroy nettoie l\'instance', () => {
      const el = document.createElement('div');
      el.dataset.quote = 'Bye';
      document.body.appendChild(el);

      const instance = new Quote(el);
      instance.destroy();

      expect(Quote.getInstance(el)).toBeUndefined();
      expect(el.getAttribute('role')).toBeNull();
    });
  });
});
