/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant Sheet
 * Sheet gère uniquement les ouvertures verticales (top / bottom).
 */

import { Sheet } from '../../src/components/Sheet';

describe('Sheet', () => {
    beforeEach(() => {
        document.body.innerHTML =
            '<div class="sheet sheet--bottom" id="sheet-el">' +
            '<div class="sheet-container"><div class="sheet-content">Contenu</div></div>' +
            '</div>';
    });

    afterEach(() => {
        document.body.innerHTML = '';
        Sheet._sheetsOpen = 0;
        jest.restoreAllMocks();
    });

    test('initialise et stocke l\'instance sur l\'élément', () => {
        const el = document.getElementById('sheet-el') as HTMLElement;
        const instance = new Sheet(el);

        expect(instance).toBeDefined();
        expect(Sheet.getInstance(el)).toBe(instance);
    });

    test('applique les options par défaut (position bottom)', () => {
        expect(Sheet.defaults).toBeDefined();
        expect(Sheet.defaults.position).toBe('bottom');
        expect(Sheet.defaults.type).toBe('bottom');
        expect(Sheet.defaults.position).not.toBe('left' as never);
        expect(Sheet.defaults.position).not.toBe('right' as never);
    });

    test('isOpen est false initialement', () => {
        const el = document.getElementById('sheet-el') as HTMLElement;
        const instance = new Sheet(el);

        expect(instance.isOpen).toBe(false);
    });

    test('open ouvre le sheet', () => {
        const el = document.getElementById('sheet-el') as HTMLElement;
        const instance = new Sheet(el);

        instance.open();
        expect(instance.isOpen).toBe(true);
        expect(el.classList.contains('is-open')).toBe(true);
    });

    test('close ferme le sheet', () => {
        const el = document.getElementById('sheet-el') as HTMLElement;
        const instance = new Sheet(el);

        instance.open();
        instance.close();
        expect(instance.isOpen).toBe(false);
    });

    test('callbacks onOpenStart/onCloseStart sont appelés', () => {
        const onOpenStart = jest.fn();
        const onCloseStart = jest.fn();
        const el = document.getElementById('sheet-el') as HTMLElement;
        const instance = new Sheet(el, { onOpenStart, onCloseStart });

        instance.open();
        expect(onOpenStart).toHaveBeenCalled();

        instance.close();
        expect(onCloseStart).toHaveBeenCalled();
    });

    test('destroy nettoie l\'instance et l\'overlay', () => {
        const el = document.getElementById('sheet-el') as HTMLElement;
        const instance = new Sheet(el);

        instance.destroy();
        expect(Sheet.getInstance(el)).toBeFalsy();
        expect(document.querySelector('.sheet-overlay')).toBeFalsy();
    });

    describe('position bottom', () => {
        test('ajoute la classe sheet--bottom', () => {
            const el = document.getElementById('sheet-el') as HTMLElement;
            const instance = new Sheet(el, { position: 'bottom' });
            expect(instance.options.position).toBe('bottom');
            expect(el.classList.contains('sheet--bottom')).toBe(true);
        });

        test('incrémente le compteur de sheets ouverts', () => {
            const el = document.getElementById('sheet-el') as HTMLElement;
            const instance = new Sheet(el, { position: 'bottom' });

            expect(Sheet._sheetsOpen).toBe(0);
            instance.open();
            expect(Sheet._sheetsOpen).toBe(1);
            instance.close();
            expect(Sheet._sheetsOpen).toBe(0);
        });
    });

    describe('position top', () => {
        test('détecte sheet--top depuis le markup', () => {
            const el = document.createElement('div');
            el.className = 'sheet sheet--top';
            el.innerHTML = '<div class="sheet-container"><div class="sheet-content">x</div></div>';
            document.body.appendChild(el);

            const instance = new Sheet(el);
            expect(instance.options.position).toBe('top');
            expect(el.classList.contains('sheet--top')).toBe(true);
        });

        test('ouvre et ferme un sheet top', () => {
            const el = document.createElement('div');
            el.className = 'sheet sheet--top';
            el.innerHTML = '<div class="sheet-container"><div class="sheet-content">x</div></div>';
            document.body.appendChild(el);

            const instance = new Sheet(el, { position: 'top' });
            instance.open();
            expect(instance.isOpen).toBe(true);
            instance.close();
            expect(instance.isOpen).toBe(false);
        });
    });

    describe('accessibilité', () => {
        test('ajoute role=dialog et aria-modal', () => {
            const el = document.getElementById('sheet-el') as HTMLElement;
            new Sheet(el, { position: 'bottom' });

            expect(el.getAttribute('role')).toBe('dialog');
            expect(el.getAttribute('aria-modal')).toBe('true');
            expect(el.getAttribute('aria-hidden')).toBe('true');
        });

        test('aria-hidden passe à false quand ouvert', () => {
            const el = document.getElementById('sheet-el') as HTMLElement;
            const instance = new Sheet(el, { position: 'bottom' });

            instance.open();
            expect(el.getAttribute('aria-hidden')).toBe('false');
        });

        test('poignée : role=button, label Drag handle, premier enfant (bottom)', () => {
            const el = document.getElementById('sheet-el') as HTMLElement;
            new Sheet(el, { position: 'bottom', draggable: true });

            const handle = el.querySelector('.sheet-drag-handle') as HTMLElement;
            expect(handle).toBeTruthy();
            expect(el.firstElementChild).toBe(handle);
            expect(handle.getAttribute('role')).toBe('button');
            expect(handle.getAttribute('aria-label')).toBe('Drag handle');
            expect(handle.getAttribute('tabindex')).toBe('0');
        });

        test('poignée : dernier enfant pour top', () => {
            const el = document.createElement('div');
            el.className = 'sheet sheet--top';
            el.innerHTML = '<div class="sheet-container"><div class="sheet-content">x</div></div>';
            document.body.appendChild(el);

            new Sheet(el, { position: 'top', draggable: true });

            const handle = el.querySelector('.sheet-drag-handle') as HTMLElement;
            expect(el.lastElementChild).toBe(handle);
        });
    });

    describe('hard break left / right', () => {
        test('retire sheet--left / sheet--right et retombe sur bottom', () => {
            const el = document.createElement('div');
            el.className = 'sheet sheet--left sheet--right';
            el.innerHTML = '<div class="sheet-container"><div class="sheet-content">x</div></div>';
            document.body.appendChild(el);

            const instance = new Sheet(el, { position: 'left' as unknown as 'bottom' });
            expect(instance.options.position).toBe('bottom');
            expect(el.classList.contains('sheet--bottom')).toBe(true);
            expect(el.classList.contains('sheet--left')).toBe(false);
            expect(el.classList.contains('sheet--right')).toBe(false);
        });

        test('Sheet.show ignore position left et ouvre en bottom', () => {
            const instance = Sheet.show('<p>x</p>', {
                position: 'left' as unknown as 'bottom',
            });
            expect(instance.options.position).toBe('bottom');
            expect(instance.el.classList.contains('sheet--bottom')).toBe(true);
            expect(instance.el.classList.contains('sheet--left')).toBe(false);
            instance.destroy();
        });
    });

    describe('tailles (classes de détente)', () => {
        test('applique sheet--large depuis les options', () => {
            const el = document.createElement('div');
            el.className = 'sheet sheet--bottom';
            el.innerHTML = '<div class="sheet-container"><div class="sheet-content">x</div></div>';
            document.body.appendChild(el);

            const instance = new Sheet(el, { size: 'large' });
            expect(instance.options.size).toBe('large');
            expect(el.classList.contains('sheet--large')).toBe(true);
            expect(el.getAttribute('size')).toBe('large');
        });

        test('setSize met à jour la classe', () => {
            const el = document.createElement('div');
            el.className = 'sheet sheet--bottom';
            el.innerHTML = '<div class="sheet-container"><div class="sheet-content">x</div></div>';
            document.body.appendChild(el);

            const instance = new Sheet(el, { size: 'medium' });
            instance.setSize('small');
            expect(instance.options.size).toBe('small');
            expect(el.classList.contains('sheet--small')).toBe(true);
        });
    });
});
