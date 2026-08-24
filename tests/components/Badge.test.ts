/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant Badge
 */

import { Badge } from '../../src/components/Badge';

describe('Badge', () => {
    beforeEach(() => {
        document.body.innerHTML =
            '<button type="button" class="btn btn--icon" id="badge-container" aria-label="Notifications">' +
            '<i name="bell" aria-hidden="true"></i></button>';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('initialise et stocke l\'instance sur l\'élément', () => {
        const el = document.getElementById('badge-container') as HTMLElement;
        const instance = new Badge(el, {
            variant: 'large',
            content: 5,
        });

        expect(instance).toBeDefined();
        expect(Badge.getInstance(el)).toBe(instance);
        expect(el.querySelector('.badge')).toBeTruthy();
    });

    test('crée un badge large avec contenu numérique', () => {
        const el = document.getElementById('badge-container') as HTMLElement;
        const instance = new Badge(el, {
            variant: 'large',
            content: 5,
        });

        const badgeElement = el.querySelector('.badge') as HTMLElement;
        expect(badgeElement).toBeTruthy();
        expect(badgeElement.classList.contains('badge--large')).toBe(true);
        expect(badgeElement.textContent).toBe('5');
    });

    test('crée un badge small sans contenu', () => {
        const el = document.getElementById('badge-container') as HTMLElement;
        const instance = new Badge(el, {
            variant: 'small',
            content: 5,
        });

        const badgeElement = el.querySelector('.badge') as HTMLElement;
        expect(badgeElement).toBeTruthy();
        expect(badgeElement.classList.contains('badge--small')).toBe(true);
        expect(badgeElement.textContent).toBe('');
    });

    test('affiche "999+" pour les nombres supérieurs à 999', () => {
        const el = document.getElementById('badge-container') as HTMLElement;
        const instance = new Badge(el, {
            variant: 'large',
            content: 1000,
        });

        const badgeElement = el.querySelector('.badge') as HTMLElement;
        expect(badgeElement.textContent).toBe('999+');
    });

    test('affiche le texte pour la variante large', () => {
        const el = document.getElementById('badge-container') as HTMLElement;
        const instance = new Badge(el, {
            variant: 'large',
            content: 'Nouveau',
        });

        const badgeElement = el.querySelector('.badge') as HTMLElement;
        expect(badgeElement.textContent).toBe('Nouveau');
        expect(badgeElement.classList.contains('badge--label')).toBe(true);
        expect(badgeElement.classList.contains('badge--compact')).toBe(false);
    });

    test('applique badge--compact pour un seul chiffre', () => {
        const el = document.getElementById('badge-container') as HTMLElement;
        new Badge(el, { variant: 'large', content: 7 });

        const badgeElement = el.querySelector('.badge') as HTMLElement;
        expect(badgeElement.classList.contains('badge--compact')).toBe(true);
        expect(badgeElement.classList.contains('badge--label')).toBe(false);
    });

    test('badge libellé en top-right utilise le mode bord (après layout)', async () => {
        const el = document.getElementById('badge-container') as HTMLElement;
        new Badge(el, {
            variant: 'large',
            content: 'Nouveau',
            position: 'top-right',
        });

        await new Promise<void>((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        });

        const badgeElement = el.querySelector('.badge') as HTMLElement;
        expect(badgeElement.style.transform).toBe('none');
        expect(badgeElement.style.right).not.toBe('');
        expect(badgeElement.style.left).toBe('');
    });

    test('applique la position top-right par défaut', () => {
        const el = document.getElementById('badge-container') as HTMLElement;
        const instance = new Badge(el, {
            variant: 'large',
            content: 5,
        });

        const badgeElement = el.querySelector('.badge') as HTMLElement;
        expect(badgeElement.classList.contains('badge--top-right')).toBe(true);
    });

    test('applique la position spécifiée', () => {
        const el = document.getElementById('badge-container') as HTMLElement;
        const instance = new Badge(el, {
            variant: 'large',
            content: 5,
            position: 'bottom-left',
        });

        const badgeElement = el.querySelector('.badge') as HTMLElement;
        expect(badgeElement.classList.contains('badge--bottom-left')).toBe(true);
    });

    test('applique les couleurs personnalisées', () => {
        const el = document.getElementById('badge-container') as HTMLElement;
        const instance = new Badge(el, {
            variant: 'large',
            content: 5,
            backgroundColor: '#4caf50',
            textColor: '#ffffff',
        });

        const badgeElement = el.querySelector('.badge') as HTMLElement;
        expect(badgeElement.style.backgroundColor).toBe('rgb(76, 175, 80)');
        expect(badgeElement.style.color).toBe('rgb(255, 255, 255)');
    });

    test('met à jour le contenu avec updateContentValue', () => {
        const el = document.getElementById('badge-container') as HTMLElement;
        const instance = new Badge(el, {
            variant: 'large',
            content: 5,
        });

        instance.updateContentValue(10);
        const badgeElement = el.querySelector('.badge') as HTMLElement;
        expect(badgeElement.textContent).toBe('10');
    });

    test('met à jour la variante avec updateVariant', () => {
        const el = document.getElementById('badge-container') as HTMLElement;
        const instance = new Badge(el, {
            variant: 'large',
            content: 5,
        });

        instance.updateVariant('small');
        const badgeElement = el.querySelector('.badge') as HTMLElement;
        expect(badgeElement.classList.contains('badge--small')).toBe(true);
        expect(badgeElement.classList.contains('badge--large')).toBe(false);
        expect(badgeElement.textContent).toBe('');
    });

    test('met à jour la position avec updatePosition', () => {
        const el = document.getElementById('badge-container') as HTMLElement;
        const instance = new Badge(el, {
            variant: 'large',
            content: 5,
            position: 'top-right',
        });

        instance.updatePosition('bottom-left');
        const badgeElement = el.querySelector('.badge') as HTMLElement;
        expect(badgeElement.classList.contains('badge--bottom-left')).toBe(true);
        expect(badgeElement.classList.contains('badge--top-right')).toBe(false);
    });

    test('met à jour les couleurs avec updateColors', () => {
        const el = document.getElementById('badge-container') as HTMLElement;
        const instance = new Badge(el, {
            variant: 'large',
            content: 5,
        });

        instance.updateColors('#4caf50', '#ffffff');
        const badgeElement = el.querySelector('.badge') as HTMLElement;
        expect(badgeElement.style.backgroundColor).toBe('rgb(76, 175, 80)');
        expect(badgeElement.style.color).toBe('rgb(255, 255, 255)');
    });

    test('affiche le badge avec show()', () => {
        const el = document.getElementById('badge-container') as HTMLElement;
        const instance = new Badge(el, {
            variant: 'large',
            content: 5,
        });

        const badgeElement = el.querySelector('.badge') as HTMLElement;
        badgeElement.style.display = 'none';
        instance.show();
        expect(badgeElement.style.display).toBe('');
        expect(badgeElement.style.visibility).toBe('visible');
        expect(badgeElement.style.opacity).toBe('1');
    });

    test('cache le badge avec hide()', () => {
        const el = document.getElementById('badge-container') as HTMLElement;
        const instance = new Badge(el, {
            variant: 'large',
            content: 5,
        });

        const badgeElement = el.querySelector('.badge') as HTMLElement;
        instance.hide();
        expect(badgeElement.style.display).toBe('none');
    });

    test('détruit l\'instance avec destroy()', () => {
        const el = document.getElementById('badge-container') as HTMLElement;
        const instance = new Badge(el, {
            variant: 'large',
            content: 5,
        });

        expect(el.querySelector('.badge')).toBeTruthy();
        expect(Badge.getInstance(el)).toBe(instance);

        instance.destroy();

        expect(el.querySelector('.badge')).toBeFalsy();
        expect(Badge.getInstance(el)).toBeFalsy();
    });

    test('initialise avec getInstance', () => {
        const el = document.getElementById('badge-container') as HTMLElement;
        const instance = new Badge(el, {
            variant: 'large',
            content: 5,
        });

        const retrievedInstance = Badge.getInstance(el);
        expect(retrievedInstance).toBe(instance);
    });

    test('initialise plusieurs badges avec Badge.init', () => {
        document.body.innerHTML = `
            <div id="badge1" style="position: relative; width: 48px; height: 48px;"></div>
            <div id="badge2" style="position: relative; width: 48px; height: 48px;"></div>
        `;

        const els = document.querySelectorAll('#badge1, #badge2');
        const instances = Badge.init(els as NodeListOf<HTMLElement>, {
            variant: 'large',
            content: 5,
        });

        expect(instances.length).toBe(2);
        expect(instances[0]).toBeInstanceOf(Badge);
        expect(instances[1]).toBeInstanceOf(Badge);
    });

    test('respecte prefers-reduced-motion quand autoDisableForReducedMotion est true', () => {
        // Mock matchMedia
        const mockMatchMedia = jest.fn().mockReturnValue({
            matches: true,
            media: '(prefers-reduced-motion: reduce)',
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        });
        window.matchMedia = mockMatchMedia;

        const el = document.getElementById('badge-container') as HTMLElement;
        const instance = new Badge(el, {
            variant: 'large',
            content: 5,
            autoDisableForReducedMotion: true,
        });

        const badgeElement = el.querySelector('.badge') as HTMLElement;
        expect(badgeElement.style.transition).toBe('none');
    });
});



