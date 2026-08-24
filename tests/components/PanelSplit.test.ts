/// <reference types="@jest/types" />
/**
 * Tests unitaires pour le composant PanelSplit
 */

import { PanelSplit } from '../../src/components/PanelSplit';

describe('PanelSplit', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <k3ui-panel-split id="split" orientation="vertical" value="60" style="width:400px;height:300px">
                <div class="panel-split__start">Start</div>
                <div class="panel-split__handle" role="separator"></div>
                <div class="panel-split__end">End</div>
            </k3ui-panel-split>
        `;
    });

    it('devrait créer une instance et appliquer les classes', () => {
        const el = document.getElementById('split') as HTMLElement;
        const instance = new PanelSplit(el, {});

        expect(instance).toBeDefined();
        expect(PanelSplit.getInstance(el)).toBe(instance);
        expect(el.classList.contains('panel-split')).toBe(true);
        expect(el.classList.contains('docs-split-pane')).toBe(true);
        expect(el.classList.contains('panel-split--vertical')).toBe(true);
        expect(el.style.getPropertyValue('--panel-split-value')).toBe('60%');
    });

    it('devrait appliquer l\'orientation horizontal', () => {
        document.body.innerHTML = `
            <k3ui-panel-split id="split-h" orientation="horizontal" value="40">
                <div class="panel-split__start">L</div>
                <div class="panel-split__end">R</div>
            </k3ui-panel-split>
        `;
        const el = document.getElementById('split-h') as HTMLElement;
        new PanelSplit(el, {});

        expect(el.classList.contains('panel-split--horizontal')).toBe(true);
    });

    it('devrait résoudre start, handle et end', () => {
        const el = document.getElementById('split') as HTMLElement;
        const instance = new PanelSplit(el, {});

        expect(instance.getStartElement()?.textContent).toContain('Start');
        expect(instance.getHandleElement()).not.toBeNull();
        expect(instance.getEndElement()?.textContent).toContain('End');
    });

    it('devrait créer la poignée si absente', () => {
        document.body.innerHTML = `
            <k3ui-panel-split id="split-auto">
                <div class="panel-split__start">A</div>
                <div class="panel-split__end">B</div>
            </k3ui-panel-split>
        `;
        const el = document.getElementById('split-auto') as HTMLElement;
        const instance = new PanelSplit(el, {});

        expect(instance.getHandleElement()).not.toBeNull();
        expect(el.querySelector('.panel-split__handle')).not.toBeNull();
    });

    it('setValue devrait mettre à jour la variable CSS', () => {
        const el = document.getElementById('split') as HTMLElement;
        const instance = new PanelSplit(el, { min: 0, max: 100 });

        instance.setValue(25);
        expect(instance.getValue()).toBe(25);
        expect(el.style.getPropertyValue('--panel-split-value')).toBe('25%');
        expect(el.style.getPropertyValue('--docs-split-value')).toBe('25%');
        expect(el.dataset.splitValue).toBe('25');
    });

    it('devrait clamp min/max', () => {
        const el = document.getElementById('split') as HTMLElement;
        const instance = new PanelSplit(el, { min: 10, max: 90, value: 50 });

        instance.setValue(5);
        expect(instance.getValue()).toBe(10);

        instance.setValue(95);
        expect(instance.getValue()).toBe(90);
    });

    it('expand et collapse devraient aller aux extrêmes', () => {
        const el = document.getElementById('split') as HTMLElement;
        const instance = new PanelSplit(el, { min: 0, max: 100, value: 50 });

        instance.expand();
        expect(instance.getValue()).toBe(100);

        instance.collapse();
        expect(instance.getValue()).toBe(0);
    });

    it('devrait lire les attributs data-* et HTML', () => {
        document.body.innerHTML = `
            <k3ui-panel-split id="split-attrs"
                data-orientation="vertical"
                data-value="75"
                data-min="5"
                data-max="95"
                data-step="4"
                data-label="Split test"
                data-handle-size="32px">
                <div class="panel-split__start"></div>
                <div class="panel-split__end"></div>
            </k3ui-panel-split>
        `;
        const el = document.getElementById('split-attrs') as HTMLElement;
        const instance = new PanelSplit(el, {});

        expect(instance.getValue()).toBe(75);
        expect(instance.options.min).toBe(5);
        expect(instance.options.max).toBe(95);
        expect(instance.options.step).toBe(4);
        expect(instance.options.label).toBe('Split test');
        expect(el.style.getPropertyValue('--panel-split-handle-size')).toBe('32px');
    });

    it('updateOptions devrait réappliquer l\'état', () => {
        const el = document.getElementById('split') as HTMLElement;
        const instance = new PanelSplit(el, { value: 60 });

        instance.updateOptions({ value: 30, disabled: true });
        expect(instance.getValue()).toBe(30);
        expect(el.classList.contains('panel-split--disabled')).toBe(true);
    });

    it('devrait initialiser via init avec un élément', () => {
        const el = document.getElementById('split') as HTMLElement;
        const result = PanelSplit.init(el, { value: 60 });
        const instances = Array.isArray(result) ? result : [result];
        expect(instances.length).toBe(1);
        expect(PanelSplit.getInstance(el)).toBe(instances[0]);
    });

    it('defaults devrait retourner les options par défaut', () => {
        const def = PanelSplit.defaults;
        expect(def.orientation).toBe('vertical');
        expect(def.value).toBe(50);
        expect(def.min).toBe(0);
        expect(def.max).toBe(100);
        expect(def.handleSize).toBe('24px');
    });

    it('devrait détruire proprement', () => {
        const el = document.getElementById('split') as HTMLElement;
        const instance = new PanelSplit(el, {});
        instance.destroy();
        expect(PanelSplit.getInstance(el)).toBeFalsy();
    });
});
