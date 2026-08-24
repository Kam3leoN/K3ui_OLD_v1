/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant ButtonGroups
 */

import { ButtonGroups } from '../../src/components/ButtonGroups';
import { Button } from '../../src/components/Button';
import { ButtonGroupsSpecs, getButtonGroupsRadiusVars } from '../../src/specs/components/button-groups.specs';

const defaultButtons = [
    { label: 'A', icon: 'heart' },
    { label: 'B' },
    { label: 'C', icon: 'star' },
];

describe('ButtonGroups', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="root"></div>';
    });

    it('devrait créer une instance avec les options par défaut (buttons vides = pas de rendu)', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new ButtonGroups(el, {});
        expect(instance).toBeDefined();
        expect(ButtonGroups.getInstance(el)).toBe(instance);
        expect(el.classList.contains('button-groups')).toBe(false);
        expect(el.querySelectorAll('.button-groups__btn').length).toBe(0);
    });

    it('devrait construire le DOM quand buttons est fourni', () => {
        const el = document.getElementById('root') as HTMLElement;
        new ButtonGroups(el, { buttons: defaultButtons });
        expect(el.classList.contains('button-groups')).toBe(true);
        expect(el.querySelectorAll('.button-groups__btn').length).toBe(3);
        expect(el.querySelectorAll('.button-groups__btn.btn').length).toBe(3);
        expect(Button.getInstance(el.querySelector('.button-groups__btn') as HTMLElement)).toBeTruthy();
        expect(el.getAttribute('role')).toBe('radiogroup');
    });

    it('devrait exposer getInstance', () => {
        const el = document.getElementById('root') as HTMLElement;
        new ButtonGroups(el, { buttons: defaultButtons });
        const instance = ButtonGroups.getInstance(el);
        expect(instance).toBeDefined();
        expect(instance?.getSelectedIndices()).toEqual([0]);
    });

    it('devrait accepter des options personnalisées (variant, size, shape, type)', () => {
        const el = document.getElementById('root') as HTMLElement;
        new ButtonGroups(el, {
            buttons: defaultButtons,
            variant: 'outlined',
            size: 'lg',
            shape: 'square',
            type: 'connected',
        });
        expect(el.classList.contains('button-groups--outlined')).toBe(true);
        expect(el.classList.contains('button-groups--lg')).toBe(true);
        expect(el.classList.contains('button-groups--square')).toBe(true);
        expect(el.classList.contains('button-groups--connected')).toBe(true);
    });

    it('devrait lire data-buttons, data-variant, data-size sur l\'élément', () => {
        const el = document.getElementById('root') as HTMLElement;
        el.setAttribute('data-buttons', JSON.stringify([{ label: 'X' }, { label: 'Y' }]));
        el.setAttribute('data-variant', 'tonal');
        el.setAttribute('data-size', 'sm');
        new ButtonGroups(el, {});
        expect(el.querySelectorAll('.button-groups__btn').length).toBe(2);
        expect(el.classList.contains('button-groups--tonal')).toBe(true);
        expect(el.classList.contains('button-groups--sm')).toBe(true);
    });

    it('devrait appliquer defaultSelected et multiSelect', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new ButtonGroups(el, {
            buttons: defaultButtons,
            multiSelect: true,
            defaultSelected: [0, 2],
        });
        expect(instance.getSelectedIndices()).toEqual([0, 2]);
        const active = el.querySelectorAll('.button-groups__btn--active');
        expect(active.length).toBe(2);
    });

    it('devrait appeler onSelect lors d\'un clic', () => {
        const el = document.getElementById('root') as HTMLElement;
        const onSelect = jest.fn();
        new ButtonGroups(el, { buttons: defaultButtons, onSelect });
        const second = el.querySelectorAll('.button-groups__btn')[1] as HTMLButtonElement;
        second.click();
        expect(onSelect).toHaveBeenCalledWith([1]);
    });

    it('getSelectedIndices et setSelectedIndices', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new ButtonGroups(el, { buttons: defaultButtons, multiSelect: true });
        expect(instance.getSelectedIndices()).toEqual([0]);
        instance.setSelectedIndices([1, 2]);
        expect(instance.getSelectedIndices()).toEqual([1, 2]);
        const active = el.querySelectorAll('.button-groups__btn--active');
        expect(active.length).toBe(2);
    });

    it('devrait détruire proprement', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = new ButtonGroups(el, { buttons: defaultButtons });
        instance.destroy();
        expect(ButtonGroups.getInstance(el)).toBeFalsy();
    });

    it('devrait initialiser via ButtonGroups.init avec un élément', () => {
        const el = document.getElementById('root') as HTMLElement;
        const instance = ButtonGroups.init(el, { buttons: defaultButtons }) as ButtonGroups;
        expect(instance).toBeInstanceOf(ButtonGroups);
        expect(ButtonGroups.getInstance(el)).toBe(instance);
    });

    it('devrait initialiser via ButtonGroups.init avec un sélecteur', () => {
        const el = document.getElementById('root') as HTMLElement;
        el.className = 'button-groups';
        el.setAttribute('data-buttons', JSON.stringify([{ label: 'X' }]));
        const instances = ButtonGroups.init('#root', {});
        expect(Array.isArray(instances)).toBe(true);
        expect(instances.length).toBe(1);
    });

    it('ne doit pas laisser btn--md sur les segments (taille gérée par button-groups)', () => {
        const el = document.getElementById('root') as HTMLElement;
        new ButtonGroups(el, { buttons: defaultButtons, size: 'sm' });
        const first = el.querySelector('.button-groups__btn') as HTMLButtonElement;
        expect(first.classList.contains('btn--md')).toBe(false);
        expect(el.classList.contains('button-groups--sm')).toBe(true);
    });

    it('les options passées à init() priment sur data-density résiduel', () => {
        const el = document.getElementById('root') as HTMLElement;
        el.setAttribute('data-density', '0');
        new ButtonGroups(el, { buttons: defaultButtons, density: -2 });
        expect(el.getAttribute('data-density')).toBe('-2');
    });

    it('devrait normaliser data-shape rounded (legacy) vers round M3', () => {
        const el = document.getElementById('root') as HTMLElement;
        el.setAttribute('data-shape', 'rounded');
        new ButtonGroups(el, { buttons: defaultButtons });
        expect(el.classList.contains('button-groups--round')).toBe(true);
        expect(el.classList.contains('button-groups--rounded')).toBe(false);
    });

    it('standard round applique btn--rounded sur les segments', () => {
        const el = document.getElementById('root') as HTMLElement;
        new ButtonGroups(el, { buttons: defaultButtons, type: 'standard', shape: 'round' });
        const first = el.querySelector('.button-groups__btn') as HTMLButtonElement;
        expect(first.classList.contains('btn--rounded')).toBe(true);
        expect(first.classList.contains('btn--round')).toBe(false);
    });

    it('defaults devrait retourner les options par défaut', () => {
        const def = ButtonGroups.defaults;
        expect(def.buttons).toEqual([]);
        expect(def.variant).toBe('filled');
        expect(def.size).toBe('md');
        expect(def.shape).toBe('round');
        expect(def.type).toBe('standard');
        expect(def.multiSelect).toBe(false);
        expect(def.overflowMode).toBe('none');
        expect(def.expandedRatio).toBe(0.15);
        expect(def.defaultSelected).toEqual([0]);
    });

    it('sélection simple utilise aria-checked', () => {
        const el = document.getElementById('root') as HTMLElement;
        new ButtonGroups(el, { buttons: defaultButtons });
        const first = el.querySelector('.button-groups__btn') as HTMLButtonElement;
        expect(first.getAttribute('aria-checked')).toBe('true');
        expect(first.hasAttribute('aria-pressed')).toBe(false);
    });

    it('multiSelect utilise aria-pressed et role group', () => {
        const el = document.getElementById('root') as HTMLElement;
        new ButtonGroups(el, { buttons: defaultButtons, multiSelect: true });
        expect(el.getAttribute('role')).toBe('group');
        const first = el.querySelector('.button-groups__btn') as HTMLButtonElement;
        expect(first.getAttribute('aria-pressed')).toBe('true');
    });

    it('connected ajoute la classe et data-density par défaut', () => {
        const el = document.getElementById('root') as HTMLElement;
        new ButtonGroups(el, { buttons: defaultButtons, type: 'connected', size: 'md' });
        expect(el.classList.contains('button-groups--connected')).toBe(true);
        expect(el.getAttribute('data-density')).toBe('0');
    });

    it('applique data-density depuis les options', () => {
        const el = document.getElementById('root') as HTMLElement;
        new ButtonGroups(el, { buttons: defaultButtons, density: -2 });
        expect(el.getAttribute('data-density')).toBe('-2');
    });

    it('mode déclaratif : enfants .btn sans data-buttons', () => {
        const el = document.getElementById('root') as HTMLElement;
        el.className = 'button-groups';
        el.setAttribute('data-variant', 'tonal');
        el.setAttribute('data-type', 'connected');
        el.innerHTML = `
          <button type="button" class="btn btn--tonal btn--md ripple">Un</button>
          <button type="button" class="btn btn--tonal btn--md ripple">Deux</button>
        `;
        new ButtonGroups(el, {});
        expect(el.querySelectorAll('.button-groups__btn').length).toBe(2);
        const first = el.querySelector('button') as HTMLButtonElement;
        expect(Button.getInstance(first)).toBeTruthy();
    });

    describe('conformité M3 Expressive (ButtonGroupsSpecs)', () => {
        it('defaultSize = md (56 dp)', () => {
            expect(ButtonGroupsSpecs.behaviors.defaultSize).toBe('md');
            expect(ButtonGroupsSpecs.behaviors.heightBySize.md).toBe(56);
        });

        it('gap standard constant = 12 dp pour toutes les tailles', () => {
            expect(ButtonGroupsSpecs.behaviors.gapStandard).toBe(12);
            const el = document.getElementById('root') as HTMLElement;
            new ButtonGroups(el, { buttons: defaultButtons, type: 'standard', size: 'xs' });
            expect(el.style.getPropertyValue('--button-groups-gap')).toBe('12px');
            el.innerHTML = '';
            new ButtonGroups(el, { buttons: defaultButtons, type: 'standard', size: 'xl' });
            expect(el.style.getPropertyValue('--button-groups-gap')).toBe('12px');
        });

        it('gap connected = 2 dp', () => {
            const el = document.getElementById('root') as HTMLElement;
            new ButtonGroups(el, { buttons: defaultButtons, type: 'connected' });
            expect(el.style.getPropertyValue('--button-groups-gap')).toBe('2px');
        });

        it('inner radius connected par taille (M3 junction — distinct de cornerRadiusBySize)', () => {
            expect(ButtonGroupsSpecs.behaviors.innerCornerConnectedBySize).toEqual({
                xs: 4,
                sm: 8,
                md: 8,
                lg: 16,
                xl: 20,
            });

            const expectedInner: Record<string, string> = {
                xs: '4px',
                sm: '8px',
                md: '8px',
                lg: '16px',
                xl: '20px',
            };

            (Object.keys(expectedInner) as Array<keyof typeof expectedInner>).forEach((size) => {
                const el = document.createElement('div');
                document.body.appendChild(el);
                new ButtonGroups(el, {
                    buttons: defaultButtons,
                    type: 'connected',
                    shape: 'round',
                    size: size as 'xs',
                });
                expect(el.style.getPropertyValue('--k3-button-groups-radius-inner')).toBe(expectedInner[size]);
                el.remove();
            });

            expect(getButtonGroupsRadiusVars('xl', 'round', 'connected').inner).toBe('20px');
            expect(ButtonGroupsSpecs.behaviors.cornerRadiusBySize.xl).toBe(28);
        });

        it('outer radius connected round = height/2 (calc, pas 9999px fixe)', () => {
            const capFormula = ButtonGroupsSpecs.behaviors.connectedOuterRadiusFormula;
            expect(capFormula).toBe('calc(var(--k3-button-groups-height) / 2)');

            const el = document.getElementById('root') as HTMLElement;
            new ButtonGroups(el, { buttons: defaultButtons, type: 'connected', shape: 'round', size: 'md' });
            expect(el.style.getPropertyValue('--k3-button-groups-radius-outer')).toBe(capFormula);
            expect(el.style.getPropertyValue('--k3-button-groups-radius-full')).toBe(capFormula);

            expect(getButtonGroupsRadiusVars('md', 'round', 'connected')).toEqual({
                inner: '8px',
                outer: capFormula,
                full: capFormula,
            });
        });

        it('outer cap connected par taille (height/2 fallback px)', () => {
            expect(ButtonGroupsSpecs.behaviors.outerCapBySize).toEqual({
                xs: 16,
                sm: 20,
                md: 28,
                lg: 48,
                xl: 68,
            });
        });

        it('hauteurs conteneur par taille (dp → rem)', () => {
            const expected: Record<string, { dp: number; rem: string }> = {
                xs: { dp: 32, rem: '2rem' },
                sm: { dp: 40, rem: '2.5rem' },
                md: { dp: 56, rem: '3.5rem' },
                lg: { dp: 96, rem: '6rem' },
                xl: { dp: 136, rem: '8.5rem' },
            };
            (Object.keys(expected) as Array<keyof typeof expected>).forEach((size) => {
                expect(ButtonGroupsSpecs.behaviors.heightBySize[size]).toBe(expected[size].dp);
                expect(ButtonGroupsSpecs.sizes[size].heightRem).toBe(expected[size].rem);
                const el = document.createElement('div');
                document.body.appendChild(el);
                new ButtonGroups(el, { buttons: defaultButtons, size: size as 'xs' });
                expect(el.style.getPropertyValue('--k3-button-groups-height')).toBe(expected[size].rem);
                expect(el.style.getPropertyValue(`--k3-button-groups-height-${size}`)).toBe(expected[size].rem);
                el.remove();
            });
        });

        it('corner radius square standard — shape scale M3', () => {
            expect(ButtonGroupsSpecs.behaviors.cornerRadiusBySize).toEqual({
                xs: 4,
                sm: 8,
                md: 12,
                lg: 16,
                xl: 28,
            });
        });

        it('getButtonGroupsRadiusVars — standard morph round↔square (height/2, pas 9999px)', () => {
            const cap = ButtonGroupsSpecs.behaviors.standardOuterRadiusFormula;
            expect(getButtonGroupsRadiusVars('sm', 'round', 'standard')).toEqual({
                inner: '8px',
                outer: cap,
                full: cap,
            });
            expect(getButtonGroupsRadiusVars('md', 'square', 'standard')).toEqual({
                inner: '8px',
                outer: '12px',
                full: cap,
            });
        });

        it('font-size M3 type scale par taille (aligné ButtonDefaults / button.token)', () => {
            const expected: Record<
                string,
                {
                    fontSizePx: number;
                    fontSizeRem: string;
                    lineHeightPx: number;
                    typeScaleToken: string;
                    fontWeight: number;
                }
            > = {
                xs: { fontSizePx: 14, fontSizeRem: '0.875rem', lineHeightPx: 20, typeScaleToken: 'label-large', fontWeight: 500 },
                sm: { fontSizePx: 14, fontSizeRem: '0.875rem', lineHeightPx: 20, typeScaleToken: 'label-large', fontWeight: 500 },
                md: { fontSizePx: 16, fontSizeRem: '1rem', lineHeightPx: 24, typeScaleToken: 'title-medium', fontWeight: 500 },
                lg: { fontSizePx: 24, fontSizeRem: '1.5rem', lineHeightPx: 32, typeScaleToken: 'headline-small', fontWeight: 400 },
                xl: { fontSizePx: 32, fontSizeRem: '2rem', lineHeightPx: 40, typeScaleToken: 'headline-medium', fontWeight: 400 },
            };

            (Object.keys(expected) as Array<keyof typeof expected>).forEach((size) => {
                expect(ButtonGroupsSpecs.sizes[size].fontSizePx).toBe(expected[size].fontSizePx);
                expect(ButtonGroupsSpecs.sizes[size].fontSizeRem).toBe(expected[size].fontSizeRem);
                expect(ButtonGroupsSpecs.sizes[size].lineHeightPx).toBe(expected[size].lineHeightPx);
                expect(ButtonGroupsSpecs.sizes[size].typeScaleToken).toBe(expected[size].typeScaleToken);
                expect(ButtonGroupsSpecs.sizes[size].fontWeight).toBe(expected[size].fontWeight);

                const el = document.createElement('div');
                document.body.appendChild(el);
                new ButtonGroups(el, { buttons: defaultButtons, type: 'connected', size: size as 'xs' });
                expect(el.style.getPropertyValue('--k3-button-groups-font-size')).toBe(expected[size].fontSizeRem);
                expect(el.style.getPropertyValue('--k3-button-groups-line-height')).toBe(
                    ButtonGroupsSpecs.sizes[size].lineHeightRem
                );
                expect(el.style.getPropertyValue('--k3-button-groups-font-weight')).toBe(
                    String(expected[size].fontWeight)
                );
                el.remove();
            });
        });

        it('connected retire btn--rounded et positionne __btn--last (coins junction via SCSS)', () => {
            const el = document.getElementById('root') as HTMLElement;
            new ButtonGroups(el, { buttons: defaultButtons, type: 'connected', shape: 'round', size: 'sm' });
            const last = el.querySelector('.button-groups__btn--last') as HTMLButtonElement;
            const first = el.querySelector('.button-groups__btn--first') as HTMLButtonElement;
            const middle = el.querySelector('.button-groups__btn--middle') as HTMLButtonElement;
            expect(last).toBeTruthy();
            expect(first).toBeTruthy();
            expect(middle).toBeTruthy();
            expect(last.classList.contains('btn--rounded')).toBe(false);
            expect(first.classList.contains('btn--rounded')).toBe(false);
            expect(el.style.getPropertyValue('--k3-button-groups-radius-inner')).toBe('8px');
        });

        it('connected active applique --active (morph full géré en CSS, y compris reduce-motion)', () => {
            const el = document.getElementById('root') as HTMLElement;
            new ButtonGroups(el, {
                buttons: defaultButtons,
                type: 'connected',
                shape: 'round',
                defaultSelected: [0],
            });
            el.classList.add('button-groups--reduce-motion');
            const first = el.querySelector('.button-groups__btn--first') as HTMLButtonElement;
            expect(first.classList.contains('button-groups__btn--active')).toBe(true);
            expect(el.style.getPropertyValue('--k3-button-groups-radius-full')).toBe(
                ButtonGroupsSpecs.behaviors.connectedOuterRadiusFormula
            );
        });

        it('standard round/square — CSS vars morph croisé (height/2 ↔ cornerRadiusBySize)', () => {
            const cap = ButtonGroupsSpecs.behaviors.standardOuterRadiusFormula;

            const elRound = document.createElement('div');
            document.body.appendChild(elRound);
            new ButtonGroups(elRound, {
                buttons: defaultButtons,
                type: 'standard',
                shape: 'round',
                size: 'md',
                defaultSelected: [1],
            });
            expect(elRound.style.getPropertyValue('--k3-button-groups-radius-outer')).toBe(cap);
            expect(elRound.style.getPropertyValue('--k3-button-groups-radius-full')).toBe(cap);
            expect(elRound.style.getPropertyValue('--k3-button-groups-radius-square')).toBe('12px');
            const activeRound = elRound.querySelector('.button-groups__btn--active') as HTMLElement;
            expect(activeRound).toBeTruthy();
            elRound.remove();

            const elSquare = document.createElement('div');
            document.body.appendChild(elSquare);
            new ButtonGroups(elSquare, {
                buttons: defaultButtons,
                type: 'standard',
                shape: 'square',
                size: 'md',
                defaultSelected: [0],
            });
            expect(elSquare.style.getPropertyValue('--k3-button-groups-radius-outer')).toBe('12px');
            expect(elSquare.style.getPropertyValue('--k3-button-groups-radius-full')).toBe(cap);
            expect(elSquare.style.getPropertyValue('--k3-button-groups-radius-square')).toBe('12px');
            const activeSquare = elSquare.querySelector('.button-groups__btn--active') as HTMLElement;
            expect(activeSquare).toBeTruthy();
            elSquare.remove();
        });

        it('multiSelect standard — chaque segment --active indépendamment', () => {
            const el = document.createElement('div');
            document.body.appendChild(el);
            new ButtonGroups(el, {
                buttons: defaultButtons,
                type: 'standard',
                shape: 'round',
                size: 'sm',
                multiSelect: true,
                defaultSelected: [0, 2],
            });
            const active = el.querySelectorAll('.button-groups__btn--active');
            expect(active.length).toBe(2);
            const buttons = el.querySelectorAll('.button-groups__btn');
            expect(buttons[1].classList.contains('button-groups__btn--active')).toBe(false);
            el.remove();
        });
    });
});
