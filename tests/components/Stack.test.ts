/**
 * @fileoverview Tests unitaires Stack
 */

import { Stack, normalizeStackDirection } from '../../src/components/Stack';

describe('Stack', () => {
  let root: HTMLElement;

  beforeEach(() => {
    root = document.createElement('div');
    root.className = 'stack';
    root.innerHTML = '<span>A</span><span>B</span><span>C</span><span>D</span><span>E</span>';
    document.body.appendChild(root);
  });

  afterEach(() => {
    Stack.getInstance(root)?.destroy();
    root.remove();
  });

  it('initialise en overlap et pose K_Stack', () => {
    const instance = Stack.init(root) as Stack;
    expect(instance).toBeInstanceOf(Stack);
    expect(Stack.getInstance(root)).toBe(instance);
    expect(root.classList.contains('stack--overlap')).toBe(true);
    expect(instance.getItemCount()).toBe(5);
  });

  it('limite les items et affiche +N', () => {
    const instance = Stack.init(root, { max: 3, showRemaining: true }) as Stack;
    expect(instance.getItems().filter((el) => el.style.display !== 'none')).toHaveLength(3);
    const remaining = root.querySelector('.stack__remaining');
    expect(remaining?.textContent).toBe('+2');
  });

  it('layoutDeck compact : peek top, max 3, data-stack-index', () => {
    const items = Array.from(root.children) as HTMLElement[];
    Stack.layoutDeck(items, {
      depth: 10,
      offset: 6,
      scaleStep: 0.05,
      opacityStep: 0,
      direction: 'top',
    });
    expect(items[0].getAttribute('data-stack-index')).toBe('0');
    expect(items[0].hasAttribute('data-behind')).toBe(false);
    expect(items[1].style.transform).toContain('translateY(-6px)');
    expect(items[2].style.transform).toContain('translateY(-12px)');
    expect(items[3].style.opacity).toBe('0');
    expect(items[1].hasAttribute('data-behind')).toBe(true);
  });

  it('normalizeStackDirection mappe start/end', () => {
    expect(normalizeStackDirection('start')).toBe('left');
    expect(normalizeStackDirection('end')).toBe('right');
    expect(normalizeStackDirection('top')).toBe('top');
  });

  it('setVariant deck bascule les classes', () => {
    const instance = Stack.init(root) as Stack;
    instance.setVariant('deck');
    expect(root.classList.contains('stack--deck')).toBe(true);
    expect(root.classList.contains('stack--overlap')).toBe(false);
  });
});
