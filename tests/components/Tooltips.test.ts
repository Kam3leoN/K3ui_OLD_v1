/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant Tooltips
 */

import { Tooltips } from '../../src/components/Tooltips';
import { MotionManager } from '../../src/core/managers/MotionManager';
import { waitMs } from '../helpers/menu-async';

describe('Tooltips', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    it('devrait initialiser correctement avec data-tooltip', () => {
        const el = document.createElement('button');
        el.setAttribute('data-tooltip', 'Texte du tooltip');
        document.body.appendChild(el);
        const instance = new Tooltips(el);
        expect(instance).toBeDefined();
        expect(Tooltips.getInstance(el)).toBe(instance);
        instance.destroy();
    });

    it('devrait exposer getInstance', () => {
        const el = document.createElement('span');
        el.setAttribute('data-tooltip', 'Test');
        document.body.appendChild(el);
        new Tooltips(el);
        const instance = Tooltips.getInstance(el);
        expect(instance).toBeDefined();
        instance.destroy();
    });

    it('devrait ne pas créer de tooltip sans contenu', () => {
        const el = document.createElement('button');
        document.body.appendChild(el);
        const instance = new Tooltips(el);
        expect(instance).toBeDefined();
        expect(document.body.querySelector('.tooltip')).toBeFalsy();
        instance.destroy();
    });

    it('devrait créer l\'élément tooltip dans le body avec contenu plain', () => {
        const el = document.createElement('button');
        el.setAttribute('data-tooltip', 'Mon tooltip');
        document.body.appendChild(el);
        const instance = new Tooltips(el);
        const tooltipEl = document.body.querySelector('.tooltip');
        expect(tooltipEl).toBeTruthy();
        expect(tooltipEl?.textContent).toContain('Mon tooltip');
        expect(tooltipEl?.querySelector('.tooltip__panel')).toBeTruthy();
        instance.destroy();
    });

    it('devrait ouvrir et fermer le tooltip', async () => {
        const el = document.createElement('button');
        el.setAttribute('data-tooltip', 'Ouvrir');
        document.body.appendChild(el);
        const instance = new Tooltips(el);
        const tooltipEl = document.body.querySelector('.tooltip') as HTMLElement;
        expect(tooltipEl.classList.contains('is-visible')).toBe(false);
        instance.open();
        expect(tooltipEl.classList.contains('is-visible')).toBe(true);
        instance.close();
        await waitMs(700);
        expect(tooltipEl.classList.contains('is-visible')).toBe(false);
        instance.destroy();
    });

    it('devrait détruire proprement et retirer le tooltip du DOM', () => {
        const el = document.createElement('button');
        el.setAttribute('data-tooltip', 'Test');
        document.body.appendChild(el);
        const instance = new Tooltips(el);
        expect(document.body.querySelector('.tooltip')).toBeTruthy();
        instance.destroy();
        expect(document.body.querySelector('.tooltip')).toBeFalsy();
        expect(Tooltips.getInstance(el)).toBeFalsy();
    });

    it('devrait exposer showDelay et hideDelay depuis les specs', () => {
        expect(Tooltips.defaults.showDelay).toBe(0);
        expect(Tooltips.defaults.hideDelay).toBe(100);
        expect(Tooltips.defaults.motion).toBe('expressive');
        expect(Tooltips.defaults.motionSpeed).toBe('default');
        expect(Tooltips.defaults.plainDismissDelay).toBe(1500);
        const el = document.createElement('button');
        el.setAttribute('data-tooltip', 'Delays');
        document.body.appendChild(el);
        const instance = new Tooltips(el, { showDelay: 120, hideDelay: 80 });
        expect(instance.options.showDelay).toBe(120);
        expect(instance.options.hideDelay).toBe(80);
        instance.destroy();
    });

    it('devrait appliquer tooltip--reduced-motion via MotionManager', () => {
        MotionManager.setOverride(true);
        const el = document.createElement('button');
        el.setAttribute('data-tooltip', 'Reduced');
        document.body.appendChild(el);
        const instance = new Tooltips(el);
        instance.open();
        const tooltipEl = document.body.querySelector('.tooltip') as HTMLElement;
        expect(tooltipEl.classList.contains('tooltip--reduced-motion')).toBe(true);
        const shell = tooltipEl.querySelector('.tooltip__shell') as HTMLElement;
        expect(shell).toBeTruthy();
        MotionManager.setOverride(null);
        instance.destroy();
    });

    it('devrait rendre le mode rich avec titre, corps et boutons M3 par défaut', () => {
        const el = document.createElement('button');
        el.setAttribute('data-tooltip-mode', 'rich');
        el.setAttribute('data-tooltip-title', 'Titre rich');
        el.setAttribute('data-tooltip-body', 'Corps du tooltip');
        document.body.appendChild(el);
        const instance = new Tooltips(el);
        const tooltipEl = document.body.querySelector('.tooltip--rich');
        expect(tooltipEl).toBeTruthy();
        expect(tooltipEl?.querySelector('.tooltip__panel')).toBeTruthy();
        expect(tooltipEl?.querySelector('.tooltip__title')?.textContent).toBe('Titre rich');
        expect(tooltipEl?.querySelector('.tooltip__body')?.textContent).toBe('Corps du tooltip');
        const buttons = tooltipEl?.querySelectorAll('.tooltip__btn');
        expect(buttons?.length).toBe(2);
        expect(buttons?.[0]?.classList.contains('tooltip__btn--text')).toBe(true);
        expect(buttons?.[1]?.classList.contains('tooltip__btn--filled')).toBe(true);
        instance.destroy();
    });

    it('devrait désactiver les boutons rich avec actions vide', () => {
        const el = document.createElement('button');
        el.setAttribute('data-tooltip-mode', 'rich');
        el.setAttribute('data-tooltip-title', 'Sans boutons');
        document.body.appendChild(el);
        const instance = new Tooltips(el, { actions: [] });
        expect(document.body.querySelector('.tooltip__actions')).toBeFalsy();
        instance.destroy();
    });

    it('devrait positionner avec les classes de côté et alignement', () => {
        const el = document.createElement('button');
        el.setAttribute('data-tooltip', 'Placement');
        el.setAttribute('data-tooltip-placement', 'top-start');
        document.body.appendChild(el);
        const instance = new Tooltips(el);
        instance.open();
        const tooltipEl = document.body.querySelector('.tooltip') as HTMLElement;
        const hasSide = ['top', 'bottom', 'left', 'right'].some((side) =>
            tooltipEl.classList.contains(`tooltip--${side}`)
        );
        expect(hasSide).toBe(true);
        expect(tooltipEl.classList.contains('tooltip--align-start')).toBe(true);
        instance.destroy();
    });

    it('devrait forcer le déclencheur focus et rester ouvert pour le rich interactif', async () => {
        const el = document.createElement('button');
        el.setAttribute('data-tooltip-mode', 'rich');
        el.setAttribute('data-tooltip-title', 'Rich focus');
        el.setAttribute('data-tooltip-body', 'Corps');
        document.body.appendChild(el);
        const instance = new Tooltips(el, { trigger: 'hover' });
        const tooltipEl = document.body.querySelector('.tooltip--interactive') as HTMLElement;
        expect(tooltipEl).toBeTruthy();

        el.focus();
        await waitMs(50);
        expect(tooltipEl.classList.contains('is-visible')).toBe(true);

        const actionBtn = tooltipEl.querySelector('.tooltip__btn--filled') as HTMLButtonElement;
        actionBtn.focus();
        await waitMs(200);
        expect(tooltipEl.classList.contains('is-visible')).toBe(true);

        actionBtn.click();
        await waitMs(700);
        expect(tooltipEl.classList.contains('is-visible')).toBe(false);
        instance.destroy();
    });

    it('devrait exposer les attributs motion sur le tooltip', () => {
        const el = document.createElement('button');
        el.setAttribute('data-tooltip', 'Motion');
        el.setAttribute('data-tooltip-motion', 'standard');
        el.setAttribute('data-tooltip-motion-speed', 'fast');
        document.body.appendChild(el);
        const instance = new Tooltips(el);
        const tooltipEl = document.body.querySelector('.tooltip') as HTMLElement;
        expect(tooltipEl.getAttribute('data-motion')).toBe('standard');
        expect(tooltipEl.getAttribute('data-motion-speed')).toBe('fast');
        instance.destroy();
    });
});
