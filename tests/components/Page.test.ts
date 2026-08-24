/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant Page
 */

import { Page } from '../../src/components/Page';

describe('Page', () => {
    beforeEach(() => {
        window.location.hash = '';
        document.documentElement.classList.remove('page-scroll-lock');
        document.body.className = '';
        document.body.innerHTML = `
            <div id="page-demo" class="page" style="height:100vh">
                <div class="page__section" data-anchor="first" style="background:#f2f2f2">
                    <h2>Section 1</h2>
                </div>
                <div class="page__section" data-anchor="second" style="background:#4BBFC3">
                    <h2>Section 2</h2>
                </div>
                <div class="page__section page__section--scrollable" style="background:#7BAABE">
                    <h2>Section scrollable</h2>
                    <p style="height:200vh">Contenu long</p>
                </div>
            </div>
        `;
        Object.defineProperty(window, 'innerHeight', { value: 800, writable: true });
    });

    afterEach(() => {
        document.documentElement.classList.remove('page-scroll-lock');
        document.body.className = '';
    });

    it('devrait initialiser avec les sections empilées', () => {
        const el = document.getElementById('page-demo') as HTMLElement;
        const instance = new Page(el, { anchors: ['first', 'second'] });
        expect(instance).toBeDefined();
        expect(el.querySelectorAll('.page__section').length).toBe(3);
        expect(el.querySelector('.page__section--active')).toBeTruthy();
        instance.destroy();
    });

    it('devrait exposer getInstance', () => {
        const el = document.getElementById('page-demo') as HTMLElement;
        new Page(el, {});
        expect(Page.getInstance(el)).toBeDefined();
        Page.getInstance(el)?.destroy();
    });

    it('devrait initialiser via init', () => {
        const el = document.getElementById('page-demo') as HTMLElement;
        const result = Page.init(el, {});
        const instances = Array.isArray(result) ? result : [result];
        expect(instances.length).toBe(1);
        instances[0].destroy();
    });

    it('defaults devrait inclure scrollingSpeed et sectionSelector', () => {
        const def = Page.defaults;
        expect(def.scrollingSpeed).toBe(700);
        expect(def.sectionSelector).toBe('.page__section');
        expect(def.direction).toBe('vertical');
        expect(def.keyboardScrolling).toBe(true);
        expect(def.fullscreen).toBe(true);
    });

    it('moveTo devrait activer la section cible', () => {
        const el = document.getElementById('page-demo') as HTMLElement;
        const instance = new Page(el, { anchors: ['first', 'second'] });
        instance.moveTo(2);
        const active = el.querySelector('.page__section--active');
        expect(active?.textContent).toContain('Section 2');
        instance.destroy();
    });

    it('getActiveIndex devrait retourner 1 au départ', () => {
        const el = document.getElementById('page-demo') as HTMLElement;
        const instance = new Page(el, {});
        expect(instance.getActiveIndex()).toBe(1);
        instance.destroy();
    });

    it('devrait créer la navigation si activée', () => {
        const el = document.getElementById('page-demo') as HTMLElement;
        const instance = new Page(el, {
            navigation: { position: 'right', tooltips: ['Un', 'Deux', 'Trois'] },
        });
        expect(document.querySelector('.page__nav')).toBeTruthy();
        instance.destroy();
        expect(document.querySelector('.page__nav')).toBeFalsy();
    });

    it('ne devrait pas verrouiller le document en mode intégré', () => {
        const el = document.getElementById('page-demo') as HTMLElement;
        el.style.height = '400px';
        const instance = new Page(el, { fullscreen: false });
        expect(document.documentElement.classList.contains('page-scroll-lock')).toBe(false);
        expect(el.classList.contains('page--fullscreen')).toBe(false);
        instance.destroy();
    });

    it('un cran de molette devrait passer à la section suivante', () => {
        const el = document.getElementById('page-demo') as HTMLElement;
        const instance = new Page(el, { anchors: ['first', 'second'] });

        document.body.dispatchEvent(
            new WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true })
        );

        expect(instance.getActiveIndex()).toBe(2);
        instance.destroy();
    });

    it('moveSectionUp devrait restaurer la section précédente', async () => {
        const el = document.getElementById('page-demo') as HTMLElement;
        const instance = new Page(el, { anchors: ['first', 'second'] });
        instance.moveSectionDown();
        await new Promise((r) => setTimeout(r, 800));
        instance.moveSectionUp();
        await new Promise((r) => setTimeout(r, 800));

        expect(instance.getActiveIndex()).toBe(1);
        const sections = [...el.querySelectorAll<HTMLElement>('.page__section')];
        expect(sections[0].style.transform).toBe('translate3d(0px, 0px, 0px)');
        expect(sections[1].style.transform).toBe('translate3d(0px, 0px, 0px)');
        instance.destroy();
    });

    it('devrait détruire proprement', () => {
        const el = document.getElementById('page-demo') as HTMLElement;
        const instance = new Page(el, {});
        expect(() => instance.destroy()).not.toThrow();
        expect(document.documentElement.classList.contains('page-scroll-lock')).toBe(false);
    });
});
