/// <reference types="jest" />
import { MediaStories } from '../../src/components/MediaStories';

describe('components/MediaStories', () => {
  let host: HTMLElement;

  const sampleStories = [
    { url: 'https://example.com/a.jpg', header: { heading: 'Alice' } },
    { url: 'https://example.com/b.jpg', duration: 2000 },
  ];

  beforeEach(() => {
    host = document.createElement('div');
    host.className = 'mediastories no-autoinit';
    document.body.appendChild(host);
  });

  afterEach(() => {
    const instance = MediaStories.getInstance(host);
    instance?.destroy();
    host.remove();
  });

  it('devrait créer une instance avec les options par défaut', () => {
    const ws = new MediaStories(host, { stories: sampleStories, autoStart: false });
    expect(ws).toBeInstanceOf(MediaStories);
    expect(MediaStories.getInstance(host)).toBe(ws);
    expect(MediaStories.defaults.defaultInterval).toBe(4000);
  });

  it('devrait exposer getInstance après init', () => {
    const ws = MediaStories.init(host, { stories: sampleStories, autoStart: false }) as MediaStories;
    expect(MediaStories.getInstance(host)).toBe(ws);
  });

  it('devrait ouvrir et construire le DOM', () => {
    const ws = new MediaStories(host, { stories: sampleStories, autoStart: false });
    ws.open();
    expect(ws.getIsOpen()).toBe(true);
    expect(host.querySelector('.mediastories__card')).toBeTruthy();
    expect(host.querySelectorAll('.mediastories__progress-seg').length).toBe(2);
  });

  it('devrait naviguer next / prev', () => {
    const ws = new MediaStories(host, { stories: sampleStories, autoStart: false });
    ws.open();
    expect(ws.getCurrentIndex()).toBe(0);
    ws.next();
    expect(ws.getCurrentIndex()).toBe(1);
    ws.prev();
    expect(ws.getCurrentIndex()).toBe(0);
  });

  it('devrait lire les stories depuis le markup', () => {
    const item = document.createElement('div');
    item.setAttribute('data-mediastories-url', 'https://example.com/c.jpg');
    item.setAttribute('data-mediastories-heading', 'Bob');
    host.appendChild(item);

    const ws = new MediaStories(host, { autoStart: false });
    expect(ws['options'].stories.length).toBe(1);
    expect(ws['options'].stories[0]?.url).toBe('https://example.com/c.jpg');
  });

  it('devrait détruire proprement', () => {
    const ws = new MediaStories(host, { stories: sampleStories, autoStart: true });
    ws.destroy();
    expect(MediaStories.getInstance(host)).toBeFalsy();
    expect(host.querySelector('.mediastories__card')).toBeNull();
  });

  it('devrait appeler onAllStoriesEnd sans loop', () => {
    const onAll = jest.fn();
    const ws = new MediaStories(host, {
      stories: [{ url: 'https://example.com/a.jpg' }],
      autoStart: false,
      onAllStoriesEnd: onAll,
    });
    ws.open();
    ws.next();
    expect(onAll).toHaveBeenCalled();
  });

  it('devrait liker et exposer isLiked', () => {
    const onLike = jest.fn();
    const ws = new MediaStories(host, {
      stories: sampleStories,
      autoStart: false,
      onLike,
    });
    ws.open();
    expect(ws.isLiked()).toBe(false);
    expect(ws.toggleLike()).toBe(true);
    expect(ws.isLiked()).toBe(true);
    expect(onLike).toHaveBeenCalledWith(0, expect.any(Object), true);
  });

  it('devrait construire la galerie et ouvrir un album en fullscreen', () => {
    const albums = [
      {
        title: 'Album A',
        coverUrl: 'https://example.com/cover.jpg',
        stories: sampleStories,
      },
    ];
    const ws = new MediaStories(host, {
      mode: 'gallery',
      albums,
      autoStart: true,
    });

    expect(host.classList.contains('mediastories--gallery')).toBe(true);
    expect(host.querySelectorAll('.mediastories__cover').length).toBe(1);
    expect(host.querySelector('.mediastories__cover-img')).toBeTruthy();
    expect(host.querySelector('.mediastories__cover-bands')).toBeTruthy();
    expect(host.querySelector('.mediastories__cover-band--near')).toBeTruthy();
    expect(host.querySelector('.mediastories__cover-band--far')).toBeTruthy();
    expect(host.querySelector('.mediastories__cover-headline-text')).toBeTruthy();

    ws.openAlbum(0);
    expect(ws.getIsOpen()).toBe(true);
    expect(ws.getActiveAlbumIndex()).toBe(0);
    expect(document.querySelector('.mediastories--portal.mediastories--fullscreen')).toBeTruthy();
    expect(document.querySelectorAll('.btn-icon--md.mediastories__arrow').length).toBeGreaterThan(0);
    expect(document.querySelector('.btn-icon--lg')).toBeNull();

    ws.close();
    expect(ws.getIsOpen()).toBe(false);
    expect(document.querySelector('.mediastories--portal')).toBeNull();
    expect(host.querySelector('.mediastories__gallery')).toBeTruthy();
  });

  it('devrait normaliser width/height data-* en px', () => {
    host.setAttribute('data-width', '360');
    host.setAttribute('data-height', '640');
    host.setAttribute(
      'data-stories',
      JSON.stringify([{ url: 'https://example.com/a.jpg' }])
    );
    const ws = new MediaStories(host, { autoStart: false, showArrows: false });
    ws.open();
    const card = host.querySelector('.mediastories__card') as HTMLElement | null;
    expect(card?.style.width).toBe('360px');
    expect(card?.style.height).toBe('640px');
  });
});
