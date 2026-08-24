/// <reference types="@types/jest" />

import { Marquee } from '../../src/components/Marquee';

describe('Marquee', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="mq" class="marquee" data-mode="infinite" data-speed="60" data-direction="left" data-gap="32">
        <span>A</span><span>B</span><span>C</span>
      </div>
    `;
  });

  test('initialise la structure marquee', () => {
    const el = document.getElementById('mq') as HTMLElement;
    const instance = new Marquee(el, { autoplay: false });
    expect(instance).toBeDefined();
    expect(el.querySelector('.marquee-container')).toBeTruthy();
    expect(el.querySelector('.marquee-track')).toBeTruthy();
  });

  test('getInstance retourne l instance', () => {
    const el = document.getElementById('mq') as HTMLElement;
    const instance = new Marquee(el, { autoplay: false });
    const found = Marquee.getInstance(el);
    expect(found).toBe(instance);
  });

  test('setDirection met a jour data-direction', () => {
    const el = document.getElementById('mq') as HTMLElement;
    const instance = new Marquee(el, { autoplay: false });
    instance.setDirection('right');
    expect(el.querySelector('.marquee-container')?.getAttribute('data-direction')).toBe('right');
  });

  test('mode classic avec loop fini passe en state finished', () => {
    const el = document.getElementById('mq') as HTMLElement;
    el.dataset.mode = 'classic';
    const instance = new Marquee(el, {
      mode: 'classic',
      loop: 1,
      autoplay: false,
    });
    const track = el.querySelector('.marquee-track') as HTMLElement;
    instance.play(0);
    track.dispatchEvent(new Event('animationiteration'));
    const state = el.querySelector('.marquee-container')?.getAttribute('data-state');
    expect(state).toBe('finished');
    expect(instance.getLoopCount()).toBe(1);
  });

  test('destroy restaure les enfants originaux', () => {
    const el = document.getElementById('mq') as HTMLElement;
    const instance = new Marquee(el, { autoplay: false });
    instance.destroy();
    expect(el.querySelector('.marquee-container')).toBeNull();
    expect(el.children.length).toBe(3);
  });

  test('rotate alias cw crée un wrapper rotaté', () => {
    const el = document.getElementById('mq') as HTMLElement;
    el.dataset.rotate = 'cw';
    const instance = new Marquee(el, { autoplay: false });
    expect(instance).toBeDefined();
    expect(el.querySelector('.marquee-rotate-wrap')).toBeTruthy();
    expect(el.querySelector('.marquee-rotate-wrap')?.getAttribute('data-rotate')).toBe('clockwise');
  });
});

