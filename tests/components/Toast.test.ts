/// <reference types="@jest/jest" />

/**

 * Tests unitaires pour le composant Toast (solid-toast)

 */



import { Toast } from '../../src/components/Toast';

import { ToastToasterManager } from '../../src/core/managers/ToastToasterManager';

import { ToastSpecs } from '../../src/specs/components/toast.specs';

import { getAriaAttribute } from '../../src/utils/dom/aria';



describe('Toast', () => {

  beforeEach(() => {

    document.body.innerHTML = '';

    jest.useFakeTimers();

    Toast.clear(undefined, true);

    ToastToasterManager.resetAll();

  });



  afterEach(() => {

    Toast.clear(undefined, true);

    ToastToasterManager.resetAll();

    jest.useRealTimers();

  });



  test('show crée un toast visible dans le toaster', () => {

    const id = Toast.show({ title: 'Hello', description: 'World', closeDelay: 4000 });

    expect(id).toBeTruthy();

    const el = document.getElementById(id);

    expect(el).toBeTruthy();

    expect(el?.classList.contains('show')).toBe(true);

    expect(document.querySelector('.toast-toaster')).toBeTruthy();

  });



  test('getInstance ne crée pas d\'instance implicite', () => {

    const el = document.createElement('div');

    expect(Toast.getInstance(el)).toBeUndefined();

  });



  test('success applique la variante et l\'icône', () => {

    const id = Toast.success({ title: 'Successfully toasted!', description: 'Done.' });

    const el = document.getElementById(id);

    expect(el?.classList.contains('toast--variant-success')).toBe(true);

    expect(el?.querySelector('.toast__glyph--success')).toBeTruthy();

  });



  test('clear ferme du plus récent au plus ancien', () => {

    const idA = Toast.show({ title: 'A', closeDelay: 0 });

    const idB = Toast.show({ title: 'B', closeDelay: 0 });

    const idC = Toast.show({ title: 'C', closeDelay: 0 });

    const closedOrder: string[] = [];



    const originalClose = Toast.prototype.close;

    jest.spyOn(Toast.prototype, 'close').mockImplementation(function (this: Toast, instant?: boolean) {

      closedOrder.push(this.getId());

      return originalClose.call(this, instant);

    });



    Toast.clear();

    jest.advanceTimersByTime(500);



    expect(closedOrder.length).toBeGreaterThanOrEqual(2);

    expect(closedOrder[0]).toBe(idC);

    expect(closedOrder[closedOrder.length - 1]).toBe(idA);



    jest.restoreAllMocks();

  });



  test('promise passe de loading à success', async () => {

    const promise = Promise.resolve({ ok: true });

    const wrapped = Toast.promise(promise, {

      loading: 'Chargement…',

      success: 'Terminé',

      error: 'Erreur',

    });



    await expect(wrapped).resolves.toEqual({ ok: true });

    const toastEl = document.querySelector('.toast--variant-success');

    expect(toastEl).toBeTruthy();

  });



  test('promise rejette avec variante error', async () => {

    const promise = Promise.reject(new Error('fail'));

    const wrapped = Toast.promise(promise, {

      loading: 'Chargement…',

      success: 'OK',

      error: 'Échec',

    });



    await expect(wrapped).rejects.toThrow('fail');

    const toastEl = document.querySelector('.toast--variant-error');

    expect(toastEl).toBeTruthy();

  });



  test('pause au survol met en pause le timer', () => {

    const id = Toast.show({ title: 'Pause', closeDelay: 5000, hover: 'pause' });

    const instance = Toast._active.get(id)! as Toast & {

      _state: { pausedAt?: number };

      _pauseTimer: () => void;

      _restartTimer: () => void;

    };

    const el = document.getElementById(id)!;



    instance._pauseTimer();

    expect(instance._state.pausedAt).toBeDefined();

    expect(el.classList.contains('toast--paused')).toBe(true);



    instance._restartTimer();

    expect(instance._state.pausedAt).toBeUndefined();

    expect(el.classList.contains('toast--paused')).toBe(false);

  });



  test('pause au survol via événements souris', () => {

    const id = Toast.show({ title: 'Pause', closeDelay: 5000, hover: 'pause' });

    const instance = Toast._active.get(id)! as Toast & { _state: { pausedAt?: number } };

    const el = document.getElementById(id)!;

    el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

    expect(instance._state.pausedAt).toBeDefined();

    el.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));

    expect(instance._state.pausedAt).toBeUndefined();

  });



  test('custom renderer injecte du contenu', () => {

    Toast.custom(() => {

      const div = document.createElement('div');

      div.textContent = 'Custom JSX Content';

      return div;

    });

    expect(document.body.textContent).toContain('Custom JSX Content');

  });



  test('expose role status et aria-live', () => {

    const id = Toast.show({ title: 'A11y' });

    const el = document.getElementById(id)!;

    expect(getAriaAttribute(el, 'role')).toBe('status');

  });



  test('affiche tous les toasts sans limite de file', () => {

    for (let i = 1; i <= 5; i++) {

      Toast.show({ title: `Toast ${i}`, closeDelay: 8000 });

    }



    expect(document.querySelectorAll('.toast.show').length).toBe(5);

    expect(ToastToasterManager.getToastsNewestFirst().length).toBe(5);

  });



  test('update modifie le titre', () => {

    const id = Toast.show({ title: 'Avant', closeDelay: 0 });

    Toast.update(id, { title: 'Après' });

    const title = document.querySelector('.toast__title');

    expect(title?.textContent).toBe('Après');

  });



  test('defaults alignés solid-toast', () => {

    expect(Toast.defaults.onOpenStart).toBeNull();

    expect(Toast.defaults.position).toBe('top-right');
    expect(Toast.defaults.timerStyle).toBe('bar');

    expect(Toast.defaults.showProgressBar).toBe(true);

    expect(Toast.defaults.gutter).toBe(8);

    expect(Toast.defaults.unmountDelay).toBe(ToastSpecs.behaviors.unmountDelay);

  });



  test('affiche une barre de timer en bas quand closeDelay > 0', () => {

    const id = Toast.show({ title: 'Timer', closeDelay: 4000 });

    const el = document.getElementById(id)!;

    expect(el.classList.contains('toast--with-timer')).toBe(true);

    expect(el.querySelector('.toast__timer')).toBeTruthy();
    expect(el.querySelector('.toast__timer-track')).toBeTruthy();
    expect(el.querySelector('.toast__timer-bar')).toBeTruthy();
  });



  test('loading sans barre de timer', () => {

    const id = Toast.loading('Chargement…');

    const el = document.getElementById(id)!;

    expect(el.classList.contains('toast--with-timer')).toBe(false);

    expect(el.querySelector('.toast__timer')).toBeFalsy();

  });

  test('timerStyle overlay affiche le remplissage plein fond', () => {
    const id = Toast.show({
      title: 'Overlay',
      closeDelay: 5000,
      timerStyle: 'overlay',
    });
    const el = document.getElementById(id)!;
    expect(el.classList.contains('toast--timer-overlay')).toBe(true);
    expect(el.querySelector('.toast__timer-overlay-fill')).toBeTruthy();
    expect(el.querySelector('.toast__timer')).toBeFalsy();
  });

});

