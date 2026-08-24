/**
 * Tests unitaires pour fitNotchLabelWidth
 */

import { createNotchRounderSvg, ensureNotchStructure, fitNotchLabelWidth, NOTCH_ROUNDER_PATH } from '../../../src/utils/dom/notch';

describe('notch utils', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('NOTCH_ROUNDER_PATH est défini', () => {
    expect(NOTCH_ROUNDER_PATH).toContain('M30 0');
  });

  test('createNotchRounderSvg crée un SVG avec path', () => {
    const svg = createNotchRounderSvg();
    expect(svg.namespaceURI).toContain('svg');
    const path = svg.querySelector('path');
    expect(path?.getAttribute('d')).toBe(NOTCH_ROUNDER_PATH);
  });

  test('ensureNotchStructure injecte label et rounders', () => {
    const host = document.createElement('div');
    host.className = 'notch notch--bottom-end';
    document.body.appendChild(host);

    const label = ensureNotchStructure(host, 'Vince Lombardi', 'quote__author');

    expect(host.querySelector('.notch__label-wrapper')).toBeTruthy();
    expect(host.querySelector('.notch__rounder--a .notch__rounder-inner svg')).toBeTruthy();
    expect(host.querySelector('.notch__rounder--b .notch__rounder-inner svg')).toBeTruthy();
    expect(label.querySelector('span')?.textContent).toBe('Vince Lombardi');
    // Ordre DOM : rounders puis label (réf. HTML)
    const wrapper = host.querySelector('.notch__label-wrapper');
    expect(wrapper?.children[0]?.classList.contains('notch__rounder--a')).toBe(true);
    expect(wrapper?.children[1]?.classList.contains('notch__rounder--b')).toBe(true);
    expect(wrapper?.children[2]?.classList.contains('notch__label')).toBe(true);
  });

  test('fitNotchLabelWidth ajuste la largeur du label', () => {
    const label = document.createElement('div');
    label.className = 'notch__label';
    const span = document.createElement('span');
    span.textContent = 'Author Name';
    label.appendChild(span);
    document.body.appendChild(label);

    Object.defineProperty(span, 'scrollWidth', { value: 100, configurable: true });

    fitNotchLabelWidth(label, 32);

    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        expect(label.style.width).toBe('132px');
        resolve();
      });
    });
  });
});
