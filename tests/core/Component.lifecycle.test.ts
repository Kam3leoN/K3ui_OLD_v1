/**
 * Tests cycle de vie K3UI v3 — hooks, getters, événements
 */

import { Component } from '../../src/core/base/Component';
import { ComponentRegistry } from '../../src/core/registries/ComponentRegistry';
import { K3UI_EVENT_TYPES } from '../../src/types/components/events';
import { LifecycleSpecs } from '../../src/specs/common/lifecycle.specs';
import { PriorityLevel, BaseOptions } from '../../src/types/base';
import type { ComponentLifecycleChanges } from '../../src/types/base/lifecycle';

class LifecycleTestComponent extends Component<BaseOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    static hookLog: string[] = [];
    static eventLog: string[] = [];

    constructor(el: HTMLElement, options: Partial<BaseOptions> = {}) {
        super(el, options, LifecycleTestComponent);
    }

    static get defaults(): BaseOptions {
        return {};
    }

    setup(): void {
        LifecycleTestComponent.hookLog.push('setup');
    }

    onInit(): void {
        LifecycleTestComponent.hookLog.push('onInit');
    }

    onMount(): void {
        LifecycleTestComponent.hookLog.push('onMount');
    }

    onUpdate(changes?: ComponentLifecycleChanges): void {
        LifecycleTestComponent.hookLog.push(`onUpdate:${changes?.keys?.join(',') ?? ''}`);
    }

    onUnmount(): void {
        LifecycleTestComponent.hookLog.push('onUnmount');
    }

    onDestroy(): void {
        LifecycleTestComponent.hookLog.push('onDestroy');
    }
}

describe('Component lifecycle v3', () => {
    let container: HTMLElement;
    let testElement: HTMLElement;

    beforeEach(() => {
        LifecycleTestComponent.hookLog = [];
        LifecycleTestComponent.eventLog = [];
        ComponentRegistry.clear();
        container = document.createElement('div');
        document.body.appendChild(container);
        testElement = document.createElement('div');
        container.appendChild(testElement);

        testElement.addEventListener(K3UI_EVENT_TYPES.LIFECYCLE_INIT, () => {
            LifecycleTestComponent.eventLog.push('init');
        });
        testElement.addEventListener(K3UI_EVENT_TYPES.LIFECYCLE_MOUNT, () => {
            LifecycleTestComponent.eventLog.push('mount');
        });
        testElement.addEventListener(K3UI_EVENT_TYPES.LIFECYCLE_UPDATE, () => {
            LifecycleTestComponent.eventLog.push('update');
        });
        testElement.addEventListener(K3UI_EVENT_TYPES.LIFECYCLE_UNMOUNT, () => {
            LifecycleTestComponent.eventLog.push('unmount');
        });
        testElement.addEventListener(K3UI_EVENT_TYPES.LIFECYCLE_DESTROY, () => {
            LifecycleTestComponent.eventLog.push('destroy');
        });
    });

    afterEach(() => {
        ComponentRegistry.destroy();
        container.remove();
    });

    test('exécute setup → onInit → onMount quand connecté', () => {
        const component = new LifecycleTestComponent(testElement);

        expect(LifecycleTestComponent.hookLog).toEqual(['setup', 'onInit', 'onMount']);
        expect(component.isInitialized).toBe(true);
        expect(component.isMounted).toBe(true);
        expect(component.isConnected).toBe(true);
        expect(LifecycleTestComponent.eventLog).toEqual(['init', 'mount']);
    });

    test('handleConnected monte si init hors document', () => {
        const detached = document.createElement('div');
        const component = new LifecycleTestComponent(detached);

        expect(component.isMounted).toBe(false);
        document.body.appendChild(detached);
        component.handleConnected();

        expect(component.isMounted).toBe(true);
        expect(LifecycleTestComponent.hookLog).toContain('onMount');
        detached.remove();
    });

    test('updateOptions déclenche onUpdate et événement update', () => {
        const component = new LifecycleTestComponent(testElement);
        LifecycleTestComponent.hookLog = [];
        LifecycleTestComponent.eventLog = [];

        component.updateOptions({ onOpenStart: jest.fn() }, { keys: ['onOpenStart'] });

        expect(LifecycleTestComponent.hookLog).toEqual(['onUpdate:onOpenStart']);
        expect(LifecycleTestComponent.eventLog).toEqual(['update']);
        expect(component.isUpdating).toBe(false);
    });

    test('destroy exécute onUnmount → onDestroy et getters', () => {
        const component = new LifecycleTestComponent(testElement);
        LifecycleTestComponent.hookLog = [];
        LifecycleTestComponent.eventLog = [];

        component.destroy();

        expect(LifecycleTestComponent.hookLog).toEqual(['onUnmount', 'onDestroy']);
        expect(LifecycleTestComponent.eventLog).toEqual(['unmount', 'destroy']);
        expect(component.isDestroyed).toBe(true);
        expect(component.isMounted).toBe(false);
    });

    test('LifecycleSpecs définit l’ordre des hooks documenté', () => {
        expect(LifecycleSpecs.hookOrder).toEqual([
            'setup',
            'onInit',
            'onMount',
            'onUpdate',
            'onUnmount',
            'onDestroy',
        ]);
        expect(LifecycleSpecs.hasVirtualRender).toBe(false);
    });
});
